import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GasOptimizer } from '../../gas-optimizer';
import '../../__tests__/__mocks__/ethers';

// Mock SERVICE_CONFIG
vi.mock('../../config', () => ({
  SERVICE_CONFIG: {
    GAS_SETTINGS: {
      BASE_GAS_PRICE_GWEI: 50,
      GAS_MULTIPLIER: 1.5,
      MAX_GAS_PRICE_GWEI: 200
    }
  }
}));

// Mock ethers
vi.mock('ethers', async () => {
  const actual = await vi.importActual('ethers');
  return {
    ...actual,
    ethers: {
      parseUnits: vi.fn((value: string, unit: string) => {
        if (unit === 'gwei') {
          return BigInt(Math.floor(parseFloat(value) * 1e9));
        }
        return BigInt(Math.floor(parseFloat(value) * 1e18));
      }),
    },
  };
});

describe('GasOptimizer', () => {
  let optimizer: GasOptimizer;
  let mockProvider: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockProvider = {
      getFeeData: vi.fn(),
      estimateGas: vi.fn()
    };
    
    optimizer = new GasOptimizer(mockProvider);
  });

  describe('getOptimalGasSettings', () => {
    it('should return EIP-1559 fees when available', async () => {
      mockProvider.getFeeData.mockResolvedValue({
        maxFeePerGas: BigInt('50000000000'), // 50 Gwei
        maxPriorityFeePerGas: BigInt('2000000000'), // 2 Gwei
        gasPrice: BigInt('45000000000') // 45 Gwei
      });

      const result = await optimizer.getOptimalGasSettings();
      
      expect(result.maxFeePerGas).toBeTruthy();
      expect(result.maxPriorityFeePerGas).toBeTruthy();
      expect(result.gasPrice).toBeTruthy();
      
      // Should apply multiplier (1.2x)
      expect(result.maxFeePerGas).toBeGreaterThan(BigInt('50000000000'));
      expect(result.maxPriorityFeePerGas).toBeGreaterThan(BigInt('2000000000'));
    });

    it('should fallback to legacy pricing when EIP-1559 not available', async () => {
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: BigInt('25000000000'), // 25 Gwei
        maxFeePerGas: null,
        maxPriorityFeePerGas: null
      });

      const result = await optimizer.getOptimalGasSettings();
      
      expect(result.gasPrice).toBeTruthy();
      expect(result.maxFeePerGas).toBeUndefined();
      expect(result.maxPriorityFeePerGas).toBeUndefined();
      
      // Should apply multiplier to gas price
      expect(result.gasPrice).toBeGreaterThan(BigInt('25000000000'));
    });

    it('should use fallback gas price when provider fails', async () => {
      mockProvider.getFeeData.mockRejectedValue(new Error('Network error'));

      const result = await optimizer.getOptimalGasSettings();
      
      expect(result.gasPrice).toBe(BigInt('50000000000')); // BASE_GAS_PRICE_GWEI
      expect(result.maxFeePerGas).toBeUndefined();
      expect(result.maxPriorityFeePerGas).toBeUndefined();
    });

    it('should apply gas multiplier correctly', async () => {
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: BigInt('100000000000') // 100 Gwei
      });

      const result = await optimizer.getOptimalGasSettings();
      
      // 100 Gwei * 1.5 = 150 Gwei
      expect(result.gasPrice).toBe(BigInt('150000000000'));
    });

    it('should cap gas price at maximum limit', async () => {
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: BigInt('300000000000') // 300 Gwei (above 200 limit)
      });

      const result = await optimizer.getOptimalGasSettings();
      
      // Should be capped at MAX_GAS_PRICE_GWEI (200)
      expect(result.gasPrice).toBe(BigInt('200000000000'));
    });

    it('should handle missing gasPrice in feeData', async () => {
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: null,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null
      });

      const result = await optimizer.getOptimalGasSettings();
      
      expect(result.gasPrice).toBe(BigInt('75000000000')); // BASE_GAS_PRICE_GWEI * multiplier (50 * 1.5)
    });
  });

  describe('estimateClaimGas', () => {
    const contractAddress = '0x742E4C7d4eE6F8c8B0F8e3E8f8F8F8F8F8F8F8F8';
    const claimData = '0x1234567890abcdef';
    const fromAddress = '0x123E4C7d4eE6F8c8B0F8e3E8f8F8F8F8F8F8F8F8';

    it('should estimate gas successfully', async () => {
      mockProvider.estimateGas.mockResolvedValue(BigInt('200000'));

      const result = await optimizer.estimateClaimGas(contractAddress, claimData, fromAddress);
      
      expect(mockProvider.estimateGas).toHaveBeenCalledWith({
        from: fromAddress,
        to: contractAddress,
        data: claimData
      });
      
      // Should apply multiplier (200000 * 1.5 = 300000)
      expect(result).toBe(BigInt('300000'));
    });

    it('should use fallback gas when estimation fails', async () => {
      mockProvider.estimateGas.mockRejectedValue(new Error('Estimation failed'));

      const result = await optimizer.estimateClaimGas(contractAddress, claimData, fromAddress);
      
      expect(result).toBe(BigInt('300000')); // Conservative fallback
    });

    it('should handle very high gas estimates', async () => {
      mockProvider.estimateGas.mockResolvedValue(BigInt('1000000'));

      const result = await optimizer.estimateClaimGas(contractAddress, claimData, fromAddress);
      
      // Should apply multiplier without issues
      expect(result).toBe(BigInt('1500000'));
    });

    it('should handle zero gas estimate', async () => {
      mockProvider.estimateGas.mockResolvedValue(BigInt('0'));

      const result = await optimizer.estimateClaimGas(contractAddress, claimData, fromAddress);
      
      expect(result).toBe(BigInt('0')); // Multiplier applied to 0 is still 0
    });
  });

  describe('estimateTransferGas', () => {
    it('should return standard ERC20 transfer gas', async () => {
      const result = await optimizer.estimateTransferGas();
      
      expect(result).toBe(BigInt('80000'));
    });

    it('should be consistent across calls', async () => {
      const result1 = await optimizer.estimateTransferGas();
      const result2 = await optimizer.estimateTransferGas();
      
      expect(result1).toBe(result2);
      expect(result1).toBe(BigInt('80000'));
    });
  });

  describe('applyMultiplier private method edge cases', () => {
    it('should handle extreme gas prices correctly', async () => {
      // Test with very high gas price that exceeds limit after multiplication
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: BigInt('150000000000') // 150 Gwei
      });

      const result = await optimizer.getOptimalGasSettings();
      
      // 150 * 1.5 = 225, but should be capped at 200
      expect(result.gasPrice).toBe(BigInt('200000000000'));
    });

    it('should handle very small gas prices', async () => {
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: BigInt('1000000') // 0.001 Gwei
      });

      const result = await optimizer.getOptimalGasSettings();
      
      // Should still apply multiplier to very small values
      expect(result.gasPrice).toBe(BigInt('1500000')); // 0.001 * 1.5
    });
  });
});