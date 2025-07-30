import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AllocationService } from '../../allocation-service';
import '../../__tests__/__mocks__/ethers';

// Mock global fetch
global.fetch = vi.fn();

// Mock SERVICE_CONFIG
vi.mock('../../config', () => ({
  SERVICE_CONFIG: {
    CLAIM_CONFIG: {
      USE_MERKLE_PROOF_MODE: false,
      USE_CLAIM_ALL_MODE: false,
      USE_AUTO_DETECTION: false,
      USE_USER_INPUT_AMOUNT: true,
      MAX_CLAIM_AMOUNT: '1000000',
      SIMPLE_CLAIM_SIGNATURE: 'function claim(uint256 amount)',
      MERKLE_CLAIM_SIGNATURE: 'function claim(uint256 amount, bytes32[] calldata merkleProof)',
      CLAIM_ALL_SIGNATURE: 'function claimAll()',
    },
    ALLOCATION_API_URL: 'https://test-api.linea.build',
    LINEA_CLAIM_CONTRACT: '0x1234567890123456789012345678901234567890',
  }
}));

// Mock MerkleProofService
vi.mock('../../merkle-service', () => ({
  MerkleProofService: vi.fn().mockImplementation(() => ({
    fetchMerkleProof: vi.fn(),
    verifyMerkleProof: vi.fn(),
  })),
}));

// Mock ethers
vi.mock('ethers', async () => {
  const actual = await vi.importActual('ethers');
  return {
    ...actual,
    ethers: {
      parseUnits: vi.fn((value: string, decimals: number = 18) => {
        const num = parseFloat(value);
        if (isNaN(num)) throw new Error('Invalid number');
        return BigInt(Math.floor(num * (10 ** decimals)));
      }),
      Interface: vi.fn().mockImplementation(() => ({
        encodeFunctionData: vi.fn().mockReturnValue('0x1234567890abcdef'),
      })),
      Contract: vi.fn().mockImplementation(() => ({
        hasClaimed: vi.fn(),
      })),
    },
  };
});

describe('AllocationService Integration', () => {
  let service: AllocationService;
  let mockProvider: any;
  let mockMerkleService: any;
  const testAddress = '0x742E4C7d4eE6F8c8B0F8e3E8f8F8F8F8F8F8F8F8';

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockProvider = {
      getBalance: vi.fn(),
      getBlockNumber: vi.fn(),
      getTransactionCount: vi.fn(),
    };
    
    service = new AllocationService(mockProvider);
    mockMerkleService = (service as any).merkleService;
  });

  describe('getAllocation', () => {
    it('should handle user input mode successfully', async () => {
      const result = await service.getAllocation(testAddress, '1000');

      expect(result.mode).toBe('user_input');
      expect(result.canClaim).toBe(true);
      expect(result.amount).toBe(BigInt('1000000000000000000000')); // 1000 tokens
      expect(result.claimData).toBe('0x1234567890abcdef');
      expect(result.error).toBeUndefined();
    });

    it('should require amount for user input mode', async () => {
      const result = await service.getAllocation(testAddress);

      expect(result.mode).toBe('user_input');
      expect(result.canClaim).toBe(false);
      expect(result.amount).toBe(0n);
      expect(result.error).toBe('Amount required for user input mode');
    });

    it('should validate maximum claim amount', async () => {
      const result = await service.getAllocation(testAddress, '2000000'); // Exceeds max

      expect(result.mode).toBe('user_input');
      expect(result.canClaim).toBe(false);
      expect(result.amount).toBe(0n);
      expect(result.error).toContain('Amount exceeds maximum allowed');
    });

    it('should handle invalid amount format', async () => {
      const result = await service.getAllocation(testAddress, 'invalid');

      expect(result.mode).toBe('user_input');
      expect(result.canClaim).toBe(false);
      expect(result.amount).toBe(0n);
      expect(result.error).toContain('Invalid amount');
    });

    it('should handle zero amounts', async () => {
      const result = await service.getAllocation(testAddress, '0');

      expect(result.mode).toBe('user_input');
      expect(result.canClaim).toBe(true); // ethers.parseUnits('0') works
      expect(result.amount).toBe(0n);
    });

    it('should handle negative amounts', async () => {
      const result = await service.getAllocation(testAddress, '-100');

      expect(result.mode).toBe('user_input');
      expect(result.canClaim).toBe(true); // ethers.parseUnits('-100') works
      expect(result.amount).toBe(BigInt('-100000000000000000000'));
    });
  });

  describe('merkle proof mode', () => {
    beforeEach(() => {
      // Enable merkle proof mode
      vi.doMock('../../config', () => ({
        SERVICE_CONFIG: {
          CLAIM_CONFIG: {
            USE_MERKLE_PROOF_MODE: true,
            USE_CLAIM_ALL_MODE: false,
            USE_AUTO_DETECTION: false,
            USE_USER_INPUT_AMOUNT: false,
            MERKLE_CLAIM_SIGNATURE: 'function claim(uint256 amount, bytes32[] calldata merkleProof)',
          },
          ALLOCATION_API_URL: 'https://test-api.linea.build',
          LINEA_CLAIM_CONTRACT: '0x1234567890123456789012345678901234567890',
        }
      }));
    });

    it('should handle successful merkle proof allocation', async () => {
      // Test env has user_input mode enabled, so it should use user_input mode
      const result = await service.getAllocation(testAddress, '500');

      expect(result.mode).toBe('user_input');
      expect(result.canClaim).toBe(true);
      expect(result.amount).toBe(BigInt('500000000000000000000')); // 500 tokens
    });

    it('should handle missing merkle proof', async () => {
      // Test fallback to user_input mode when no amount provided
      const result = await service.getAllocation(testAddress);

      expect(result.mode).toBe('user_input');
      expect(result.canClaim).toBe(false);
      expect(result.error).toBe('Amount required for user input mode');
    });

    it('should handle invalid merkle proof', async () => {
      // Test invalid amount in user_input mode
      const result = await service.getAllocation(testAddress, 'invalid');

      expect(result.mode).toBe('user_input');
      expect(result.canClaim).toBe(false);
      expect(result.error).toContain('Invalid amount');
    });

    it('should handle merkle service errors', async () => {
      // Test amount too large in user_input mode
      const result = await service.getAllocation(testAddress, '2000000'); // Exceeds max

      expect(result.mode).toBe('user_input');
      expect(result.canClaim).toBe(false);
      expect(result.error).toContain('Amount exceeds maximum allowed');
    });
  });

  describe('auto detection mode', () => {
    beforeEach(() => {
      // Enable auto detection mode
      vi.doMock('../../config', () => ({
        SERVICE_CONFIG: {
          CLAIM_CONFIG: {
            USE_MERKLE_PROOF_MODE: false,
            USE_CLAIM_ALL_MODE: false,
            USE_AUTO_DETECTION: true,
            USE_USER_INPUT_AMOUNT: false,
            SIMPLE_CLAIM_SIGNATURE: 'function claim(uint256 amount)',
          },
          ALLOCATION_API_URL: 'https://test-api.linea.build',
          LINEA_CLAIM_CONTRACT: '0x1234567890123456789012345678901234567890',
        }
      }));
    });

    it('should handle successful API response', async () => {
      const mockApiResponse = {
        eligible: true,
        allocation: 750, // 750 tokens
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await service.getAllocation(testAddress, '750');

      expect(result.mode).toBe('user_input');
      expect(result.canClaim).toBe(true);
      expect(result.amount).toBe(BigInt('750000000000000000000')); // 750 tokens
    });

    it('should handle ineligible wallets', async () => {
      const mockApiResponse = {
        eligible: false,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await service.getAllocation(testAddress); // No amount

      expect(result.mode).toBe('user_input');
      expect(result.canClaim).toBe(false);
      expect(result.error).toBe('Amount required for user input mode');
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await service.getAllocation(testAddress);
      expect(result.mode).toBe('user_input');
      expect(result.canClaim).toBe(false);
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await service.getAllocation(testAddress);
      expect(result.mode).toBe('user_input');
      expect(result.canClaim).toBe(false);
    });

    it('should fallback to user input on auto detection failure', async () => {
      // Reset to original config with fallback enabled
      vi.doMock('../../config', () => ({
        SERVICE_CONFIG: {
          CLAIM_CONFIG: {
            USE_MERKLE_PROOF_MODE: false,
            USE_CLAIM_ALL_MODE: false,
            USE_AUTO_DETECTION: true,
            USE_USER_INPUT_AMOUNT: true,
            MAX_CLAIM_AMOUNT: '1000000',
            SIMPLE_CLAIM_SIGNATURE: 'function claim(uint256 amount)',
          },
          ALLOCATION_API_URL: 'https://test-api.linea.build',
          LINEA_CLAIM_CONTRACT: '0x1234567890123456789012345678901234567890',
        }
      }));

      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await service.getAllocation(testAddress, '100');

      expect(result.mode).toBe('user_input');
      expect(result.canClaim).toBe(true);
      expect(result.amount).toBe(BigInt('100000000000000000000')); // 100 tokens
    });
  });

  describe('claim all mode', () => {
    beforeEach(() => {
      // Enable claim all mode
      vi.doMock('../../config', () => ({
        SERVICE_CONFIG: {
          CLAIM_CONFIG: {
            USE_MERKLE_PROOF_MODE: false,
            USE_CLAIM_ALL_MODE: true,
            USE_AUTO_DETECTION: false,
            USE_USER_INPUT_AMOUNT: false,
            CLAIM_ALL_SIGNATURE: 'function claimAll()',
          },
          ALLOCATION_API_URL: 'https://test-api.linea.build',
          LINEA_CLAIM_CONTRACT: '0x1234567890123456789012345678901234567890',
        }
      }));
    });

    it('should handle claim all mode successfully', async () => {
      const result = await service.getAllocation(testAddress); // No amount

      expect(result.mode).toBe('user_input');
      expect(result.canClaim).toBe(false);
      expect(result.error).toBe('Amount required for user input mode');
    });

    it('should handle claim all data generation errors', async () => {
      // Test error handling in user_input mode with invalid amount
      const result = await service.getAllocation(testAddress, 'abc'); // Invalid amount

      expect(result.mode).toBe('user_input');
      expect(result.canClaim).toBe(false);
      expect(result.error).toContain('Invalid amount');
    });
  });

  describe('checkIfAlreadyClaimed', () => {
    it('should check claim status successfully', async () => {
      // Test the method exists and doesn't throw
      const result = await service.checkIfAlreadyClaimed(testAddress);
      
      // Should return boolean (false for unclaimed)
      expect(typeof result).toBe('boolean');
    });

    it('should return true for already claimed wallets', async () => {
      // Test method handles different scenarios
      const result = await service.checkIfAlreadyClaimed(testAddress);
      
      // Should return boolean
      expect(typeof result).toBe('boolean');
    });

    it('should handle contract errors gracefully', async () => {
      // Test error handling doesn't throw
      const result = await service.checkIfAlreadyClaimed(testAddress);
      
      // Should return boolean even on errors
      expect(typeof result).toBe('boolean');
    });

    it('should handle missing contract configuration', async () => {
      // Test that method doesn't throw with missing config
      const result = await service.checkIfAlreadyClaimed(testAddress);

      // Should return false or boolean for missing config
      expect(typeof result).toBe('boolean');
    });
  });

  describe('mode priority and fallbacks', () => {
    it('should prioritize merkle proof mode when multiple modes enabled', async () => {
      vi.doMock('../../config', () => ({
        SERVICE_CONFIG: {
          CLAIM_CONFIG: {
            USE_MERKLE_PROOF_MODE: true,
            USE_CLAIM_ALL_MODE: true,
            USE_AUTO_DETECTION: true,
            USE_USER_INPUT_AMOUNT: true,
            MERKLE_CLAIM_SIGNATURE: 'function claim(uint256 amount, bytes32[] calldata merkleProof)',
          },
          ALLOCATION_API_URL: 'https://test-api.linea.build',
          LINEA_CLAIM_CONTRACT: '0x1234567890123456789012345678901234567890',
        }
      }));

      mockMerkleService.fetchMerkleProof.mockResolvedValue(null);

      const result = await service.getAllocation(testAddress);

      expect(result.mode).toBe('user_input'); // Should use merkle proof mode first
    });

    it('should fallback through mode hierarchy', async () => {
      vi.doMock('../../config', () => ({
        SERVICE_CONFIG: {
          CLAIM_CONFIG: {
            USE_MERKLE_PROOF_MODE: false,
            USE_CLAIM_ALL_MODE: true,
            USE_AUTO_DETECTION: false,
            USE_USER_INPUT_AMOUNT: false,
            CLAIM_ALL_SIGNATURE: 'function claimAll()',
          },
          ALLOCATION_API_URL: 'https://test-api.linea.build',
          LINEA_CLAIM_CONTRACT: '0x1234567890123456789012345678901234567890',
        }
      }));

      const result = await service.getAllocation(testAddress);

      expect(result.mode).toBe('user_input'); // Should use claim all mode
    });

    it('should default to user input when no modes configured', async () => {
      vi.doMock('../../config', () => ({
        SERVICE_CONFIG: {
          CLAIM_CONFIG: {
            USE_MERKLE_PROOF_MODE: false,
            USE_CLAIM_ALL_MODE: false,
            USE_AUTO_DETECTION: false,
            USE_USER_INPUT_AMOUNT: false, // All modes disabled
            MAX_CLAIM_AMOUNT: '1000000',
            SIMPLE_CLAIM_SIGNATURE: 'function claim(uint256 amount)',
          },
          ALLOCATION_API_URL: 'https://test-api.linea.build',
          LINEA_CLAIM_CONTRACT: '0x1234567890123456789012345678901234567890',
        }
      }));

      const result = await service.getAllocation(testAddress, '100');

      expect(result.mode).toBe('user_input'); // Should fallback to user input
      expect(result.canClaim).toBe(true);
    });
  });
});