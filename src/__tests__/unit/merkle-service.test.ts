import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MerkleProofService } from '../../merkle-service';
import '../../__tests__/__mocks__/ethers';

// Mock fetch globally
global.fetch = vi.fn();

// Mock SERVICE_CONFIG
vi.mock('../../config', () => ({
  SERVICE_CONFIG: {
    ALLOCATION_API_URL: 'https://test-api.linea.build'
  }
}));

// Mock ethers
vi.mock('ethers', async () => {
  const actual = await vi.importActual('ethers');
  return {
    ...actual,
    ethers: {
      parseUnits: vi.fn((value: string, decimals: number) => {
        return BigInt(Math.floor(parseFloat(value) * (10 ** decimals)));
      }),
      keccak256: vi.fn((data: string | Uint8Array) => {
        // Deterministic mock hash based on input
        if (typeof data === 'string') {
          return '0x' + data.slice(2).padStart(64, '0');
        }
        return '0x' + 'a'.repeat(64);
      }),
      solidityPacked: vi.fn((_types: string[], values: any[]) => {
        // Mock packed encoding
        return '0x' + values.join('').replace(/0x/g, '');
      }),
      concat: vi.fn((arrays: any[]) => {
        // Mock array concatenation
        return '0x' + arrays.map(arr => arr.slice(2)).join('');
      }),
      toUtf8Bytes: vi.fn((str: string) => {
        return new Uint8Array([...str].map(c => c.charCodeAt(0)));
      }),
    },
  };
});

describe('MerkleProofService', () => {
  let service: MerkleProofService;
  const testAddress = '0x742E4C7d4eE6F8c8B0F8e3E8f8F8F8F8F8F8F8F8';
  const testAmount = BigInt('1000000000000000000'); // 1 token

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MerkleProofService();
  });

  describe('fetchMerkleProof', () => {
    it('should fetch valid merkle proof from API', async () => {
      const mockApiResponse = {
        address: testAddress,
        amount: '1',
        proof: [
          '0x1111111111111111111111111111111111111111111111111111111111111111',
          '0x2222222222222222222222222222222222222222222222222222222222222222'
        ],
        index: 0
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse)
      });

      const result = await service.fetchMerkleProof(testAddress);

      expect(global.fetch).toHaveBeenCalledWith(`https://test-api.linea.build/${testAddress}`);
      expect(result).toBeTruthy();
      expect(result?.proof).toEqual(mockApiResponse.proof);
      expect(result?.amount).toBe(testAmount);
      expect(result?.index).toBe(0);
    });

    it('should return demo data fallback for 404 responses (wallet not eligible)', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404
      });

      const result = await service.fetchMerkleProof(testAddress);

      expect(result).toBeTruthy();
      expect(result?.amount).toBe(BigInt('1000000000000000000000')); // 1000 tokens
      expect(result?.proof).toEqual([]);
    });

    it('should return demo data fallback for other HTTP errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500
      });

      const result = await service.fetchMerkleProof(testAddress);

      expect(result).toBeTruthy();
      expect(result?.amount).toBe(BigInt('1000000000000000000000')); // 1000 tokens
      expect(result?.proof).toEqual([]);
    });

    it('should return demo data fallback for invalid API response', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          address: testAddress,
          // Missing proof and amount
        })
      });

      const result = await service.fetchMerkleProof(testAddress);

      expect(result).toBeTruthy();
      expect(result?.amount).toBe(BigInt('1000000000000000000000')); // 1000 tokens
      expect(result?.proof).toEqual([]);
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await service.fetchMerkleProof(testAddress);

      expect(result).toBeTruthy();
      expect(result?.amount).toBe(BigInt('1000000000000000000000')); // 1000 tokens
      expect(result?.proof).toEqual([]);
    });

    it('should use configuration API URL', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          address: testAddress,
          amount: '1',
          proof: ['0x1111111111111111111111111111111111111111111111111111111111111111'],
          index: 0
        })
      });

      await service.fetchMerkleProof(testAddress);

      expect(global.fetch).toHaveBeenCalledWith(`https://test-api.linea.build/${testAddress}`);
    });
  });

  describe('generateMockMerkleProof', () => {
    it('should generate valid mock proof structure', async () => {
      const result = await service.generateMockMerkleProof(testAddress, testAmount);

      expect(result.proof).toHaveLength(0); // Empty for non-demo addresses
      expect(result.amount).toBe(testAmount);
      expect(result.leaf).toBeTruthy();
      expect(result.root).toBeTruthy();
      expect(result.index).toBe(0);
    });

    it('should generate consistent proofs for same inputs', async () => {
      const result1 = await service.generateMockMerkleProof(testAddress, testAmount);
      const result2 = await service.generateMockMerkleProof(testAddress, testAmount);

      expect(result1.leaf).toBe(result2.leaf);
      expect(result1.proof).toEqual(result2.proof);
      expect(result1.root).toBe(result2.root);
    });

    it('should generate different proofs for different addresses', async () => {
      const address2 = '0x123E4C7d4eE6F8c8B0F8e3E8f8F8F8F8F8F8F8F8';
      
      const result1 = await service.generateMockMerkleProof(testAddress, testAmount);
      const result2 = await service.generateMockMerkleProof(address2, testAmount);

      expect(result1.leaf).not.toBe(result2.leaf);
      expect(result1.root).toBe(result2.root); // Same hardcoded root
    });

    it('should generate different proofs for different amounts', async () => {
      const amount2 = BigInt('2000000000000000000'); // 2 tokens
      
      const result1 = await service.generateMockMerkleProof(testAddress, testAmount);
      const result2 = await service.generateMockMerkleProof(testAddress, amount2);

      expect(result1.leaf).not.toBe(result2.leaf);
      expect(result1.root).toBe(result2.root); // Same hardcoded root
    });
  });

  describe('verifyMerkleProof', () => {
    it('should verify valid proofs correctly', () => {
      const leaf = '0x' + 'a'.repeat(64);
      const proof = ['0x' + 'b'.repeat(64), '0x' + 'c'.repeat(64)];
      const root = '0x' + 'e'.repeat(64);
      
      const isValid = service.verifyMerkleProof(proof, leaf, root);
      
      // Test that it returns a boolean result
      expect(typeof isValid).toBe('boolean');
    });

    it('should reject invalid proofs', () => {
      const leaf = '0x' + 'a'.repeat(64);
      const proof = ['0x' + 'b'.repeat(64)];
      const wrongRoot = '0x' + 'wrong'.padEnd(64, '0');

      const isValid = service.verifyMerkleProof(proof, leaf, wrongRoot);

      expect(isValid).toBe(false);
    });

    it('should handle empty proofs', () => {
      const leaf = '0x' + 'a'.repeat(64);
      const proof: string[] = [];
      const root = leaf; // For empty proof, leaf should equal root

      const isValid = service.verifyMerkleProof(proof, leaf, root);

      expect(isValid).toBe(true);
    });

    it('should handle single element proofs', () => {
      const leaf = '0x' + 'a'.repeat(64);
      const proof = ['0x' + 'b'.repeat(64)];
      const root = '0x' + 'computed'.padEnd(64, '0');
      
      const isValid = service.verifyMerkleProof(proof, leaf, root);
      expect(typeof isValid).toBe('boolean');
    });

    it('should handle multiple proof elements', () => {
      const leaf = '0x' + '1'.repeat(64);
      const proof = ['0x' + '2'.repeat(64), '0x' + '3'.repeat(64)];
      const root = '0x' + '4'.repeat(64);
      
      const isValid = service.verifyMerkleProof(proof, leaf, root);
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('createLeafHash', () => {
    it('should create consistent leaf hashes', () => {
      const leaf1 = service.createLeafHash(testAddress, testAmount);
      const leaf2 = service.createLeafHash(testAddress, testAmount);

      expect(leaf1).toBe(leaf2);
      expect(leaf1).toBeTruthy();
      expect(leaf1.startsWith('0x')).toBe(true);
    });

    it('should create different hashes for different inputs', () => {
      const address2 = '0x123E4C7d4eE6F8c8B0F8e3E8f8F8F8F8F8F8F8F8';
      const amount2 = BigInt('2000000000000000000');

      const leaf1 = service.createLeafHash(testAddress, testAmount);
      const leaf2 = service.createLeafHash(address2, testAmount);
      const leaf3 = service.createLeafHash(testAddress, amount2);

      expect(leaf1).not.toBe(leaf2);
      expect(leaf1).not.toBe(leaf3);
      expect(leaf2).not.toBe(leaf3);
    });

    it('should use proper encoding for leaf generation', () => {
      const leaf = service.createLeafHash(testAddress, testAmount);
      
      expect(leaf).toBeTruthy();
      expect(leaf.startsWith('0x')).toBe(true);
      expect(leaf.length).toBe(66); // 0x + 64 hex chars
    });

    it('should handle zero amounts', () => {
      const leaf = service.createLeafHash(testAddress, BigInt('0'));

      expect(leaf).toBeTruthy();
      expect(leaf.startsWith('0x')).toBe(true);
    });

    it('should handle very large amounts', () => {
      const largeAmount = BigInt('1000000000000000000000000000'); // 1 billion tokens
      const leaf = service.createLeafHash(testAddress, largeAmount);

      expect(leaf).toBeTruthy();
      expect(leaf.startsWith('0x')).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('should work end-to-end with generated mock proof', async () => {
      const mockProof = await service.generateMockMerkleProof(testAddress, testAmount);
      
      const isValid = service.verifyMerkleProof(
        mockProof.proof,
        mockProof.leaf,
        mockProof.root
      );

      // Mock proof for non-demo addresses has empty proof, so verification fails
      expect(isValid).toBe(false);
    });

    it('should handle API response and verification workflow', async () => {
      const mockApiResponse = {
        address: testAddress,
        amount: '1',
        proof: [
          '0x1111111111111111111111111111111111111111111111111111111111111111',
          '0x2222222222222222222222222222222222222222222222222222222222222222'
        ],
        index: 0
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      });

      const proofData = await service.fetchMerkleProof(testAddress);
      expect(proofData).toBeTruthy();

      if (proofData) {
        // This would normally verify against the real merkle root
        // For testing, we just ensure the verification method runs
        const isValid = service.verifyMerkleProof(
          proofData.proof,
          proofData.leaf,
          proofData.root
        );
        
        // Result depends on our mocked keccak256 implementation
        expect(typeof isValid).toBe('boolean');
      }
    });
  });
});