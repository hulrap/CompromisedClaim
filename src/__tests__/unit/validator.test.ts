import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Validator, ValidationError } from '../../validator';
import { RescueConfig } from '../../types';
import '../../__tests__/__mocks__/ethers';

// Mock ethers for testing
vi.mock('ethers', async () => {
  const actual = await vi.importActual('ethers');
  return {
    ...actual,
    ethers: {
      isAddress: vi.fn((addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr)),
      parseUnits: vi.fn((value: string) => {
        const num = parseFloat(value);
        if (isNaN(num)) throw new Error('Invalid number');
        return BigInt(Math.floor(num * 1e18));
      }),
      Wallet: vi.fn((privateKey: string) => {
        if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
          throw new Error('Invalid private key');
        }
        // Mock address derivation from private key
        const mockAddresses: { [key: string]: string } = {
          '0x1111111111111111111111111111111111111111111111111111111111111111': '0x742E4C7d4eE6F8c8B0F8e3E8f8F8F8F8F8F8F8F8',
          '0x2222222222222222222222222222222222222222222222222222222222222222': '0x123E4C7d4eE6F8c8B0F8e3E8f8F8F8F8F8F8F8F8',
        };
        return {
          address: mockAddresses[privateKey] || '0x0000000000000000000000000000000000000000',
        };
      }),
    },
  };
});

describe('Validator', () => {
  const validConfig: RescueConfig = {
    compromisedAddress: '0x742E4C7d4eE6F8c8B0F8e3E8f8F8F8F8F8F8F8F8',
    compromisedPrivateKey: '0x1111111111111111111111111111111111111111111111111111111111111111',
    safeAddress: '0x123E4C7d4eE6F8c8B0F8e3E8f8F8F8F8F8F8F8F8',
    safePrivateKey: '0x2222222222222222222222222222222222222222222222222222222222222222',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      expect(() => Validator.validateConfig(validConfig)).not.toThrow();
    });

    it('should throw for invalid compromised address', () => {
      const config = { ...validConfig, compromisedAddress: 'invalid' };
      expect(() => Validator.validateConfig(config))
        .toThrow(ValidationError);
      expect(() => Validator.validateConfig(config))
        .toThrow('Invalid compromised wallet address');
    });

    it('should throw for invalid safe address', () => {
      const config = { ...validConfig, safeAddress: 'invalid' };
      expect(() => Validator.validateConfig(config))
        .toThrow(ValidationError);
      expect(() => Validator.validateConfig(config))
        .toThrow('Invalid safe wallet address');
    });

    it('should throw when addresses are the same', () => {
      const config = { 
        ...validConfig, 
        safeAddress: validConfig.compromisedAddress,
        safePrivateKey: validConfig.compromisedPrivateKey
      };
      expect(() => Validator.validateConfig(config))
        .toThrow('Compromised and safe addresses cannot be the same');
    });

    it('should throw for private key without 0x prefix', () => {
      const config = { ...validConfig, compromisedPrivateKey: '1111111111111111111111111111111111111111111111111111111111111111' };
      expect(() => Validator.validateConfig(config))
        .toThrow('Invalid compromised private key format');
    });

    it('should throw for mismatched private key and address', () => {
      const config = { 
        ...validConfig, 
        compromisedPrivateKey: '0x3333333333333333333333333333333333333333333333333333333333333333'
      };
      expect(() => Validator.validateConfig(config))
        .toThrow('Compromised private key does not match address');
    });

    it('should throw for invalid private key format', () => {
      const config = { ...validConfig, compromisedPrivateKey: '0xinvalid' };
      expect(() => Validator.validateConfig(config))
        .toThrow('Invalid private key format');
    });

    it('should throw for empty addresses', () => {
      const config = { ...validConfig, compromisedAddress: '' };
      expect(() => Validator.validateConfig(config))
        .toThrow('Invalid compromised wallet address');
    });
  });

  describe('validateAmount', () => {
    it('should validate correct amounts', () => {
      expect(Validator.validateAmount('1')).toBe(BigInt('1000000000000000000'));
      expect(Validator.validateAmount('0.5')).toBe(BigInt('500000000000000000'));
      expect(Validator.validateAmount('1000')).toBe(BigInt('1000000000000000000000'));
    });

    it('should throw for zero amount', () => {
      expect(() => Validator.validateAmount('0'))
        .toThrow('Amount must be greater than 0');
    });

    it('should throw for negative amount', () => {
      expect(() => Validator.validateAmount('-1'))
        .toThrow('Amount must be greater than 0');
    });

    it('should throw for invalid format', () => {
      expect(() => Validator.validateAmount('invalid'))
        .toThrow('Invalid amount format');
    });

    it('should throw for empty string', () => {
      expect(() => Validator.validateAmount(''))
        .toThrow('Invalid amount format');
    });
  });

  describe('validateClaimData', () => {
    it('should validate correct claim data', () => {
      expect(() => Validator.validateClaimData('0x1234567890')).not.toThrow();
      expect(() => Validator.validateClaimData('0xabcdef1234567890abcdef')).not.toThrow();
    });

    it('should throw for data without 0x prefix', () => {
      expect(() => Validator.validateClaimData('1234567890'))
        .toThrow('Invalid claim data format');
    });

    it('should throw for too short data', () => {
      expect(() => Validator.validateClaimData('0x123'))
        .toThrow('Invalid claim data format');
    });

    it('should throw for empty data', () => {
      expect(() => Validator.validateClaimData(''))
        .toThrow('Invalid claim data format');
    });

    it('should throw for null data', () => {
      expect(() => Validator.validateClaimData(null as any))
        .toThrow('Invalid claim data format');
    });
  });

  describe('validateGasPrice', () => {
    it('should accept valid gas prices', () => {
      expect(() => Validator.validateGasPrice('25')).not.toThrow();
      expect(() => Validator.validateGasPrice('0.001')).not.toThrow();
      expect(() => Validator.validateGasPrice('1000')).not.toThrow();
      expect(() => Validator.validateGasPrice('50.5')).not.toThrow();
    });

    it('should reject gas prices below minimum', () => {
      expect(() => Validator.validateGasPrice('0.0001'))
        .toThrow('Gas price must be between 0.001 and 1000 Gwei');
    });

    it('should reject gas prices above maximum', () => {
      expect(() => Validator.validateGasPrice('1001'))
        .toThrow('Gas price must be between 0.001 and 1000 Gwei');
    });

    it('should reject non-numeric values', () => {
      expect(() => Validator.validateGasPrice('invalid'))
        .toThrow('Gas price must be a valid number');
    });

    it('should reject empty string', () => {
      expect(() => Validator.validateGasPrice(''))
        .toThrow('Gas price must be a valid number');
    });

    it('should reject negative values', () => {
      expect(() => Validator.validateGasPrice('-1'))
        .toThrow('Gas price must be between 0.001 and 1000 Gwei');
    });
  });

  describe('validateTokenAmount', () => {
    it('should accept valid token amounts', () => {
      expect(() => Validator.validateTokenAmount('1')).not.toThrow();
      expect(() => Validator.validateTokenAmount('1000')).not.toThrow();
      expect(() => Validator.validateTokenAmount('1000000')).not.toThrow();
      expect(() => Validator.validateTokenAmount('999999999')).not.toThrow();
    });

    it('should reject amounts exceeding 1 billion', () => {
      expect(() => Validator.validateTokenAmount('1000000001'))
        .toThrow('Token amount cannot exceed 1 billion tokens');
    });

    it('should reject zero amounts', () => {
      expect(() => Validator.validateTokenAmount('0'))
        .toThrow('Token amount must be greater than 0');
    });

    it('should reject negative amounts', () => {
      expect(() => Validator.validateTokenAmount('-1'))
        .toThrow('Token amount must be greater than 0');
    });

    it('should reject non-numeric values', () => {
      expect(() => Validator.validateTokenAmount('invalid'))
        .toThrow('Token amount must be a valid number');
    });

    it('should accept decimal values', () => {
      expect(() => Validator.validateTokenAmount('123.456')).not.toThrow();
    });
  });

  describe('validateContractAddress', () => {
    it('should validate correct contract addresses', () => {
      expect(() => Validator.validateContractAddress('0x742E4C7d4eE6F8c8B0F8e3E8f8F8F8F8F8F8F8F8', 'claim')).not.toThrow();
      expect(() => Validator.validateContractAddress('0x123E4C7d4eE6F8c8B0F8e3E8f8F8F8F8F8F8F8F8', 'token')).not.toThrow();
    });

    it('should throw for invalid address format', () => {
      expect(() => Validator.validateContractAddress('invalid', 'claim'))
        .toThrow('Invalid claim address format');
    });

    it('should throw for zero address', () => {
      expect(() => Validator.validateContractAddress('0x0000000000000000000000000000000000000000', 'token'))
        .toThrow('token address cannot be zero address');
    });

    it('should throw for empty address', () => {
      expect(() => Validator.validateContractAddress('', 'claim'))
        .toThrow('Invalid claim address format');
    });

    it('should include contract type in error messages', () => {
      expect(() => Validator.validateContractAddress('invalid', 'custom'))
        .toThrow('Invalid custom address format');
    });
  });
});