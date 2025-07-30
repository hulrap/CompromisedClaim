import { ethers } from 'ethers';
import { SERVICE_CONFIG } from './config';

export interface MerkleProofData {
  proof: string[];
  leaf: string;
  root: string;
  index: number;
  amount: bigint;
}

export interface MerkleAllocation {
  address: string;
  amount: string;
  proof: string[];
  index: number;
}

export class MerkleProofService {
  /**
   * Fetch merkle proof from LINEA allocation API
   */
  async fetchMerkleProof(walletAddress: string): Promise<MerkleProofData | null> {
    try {
      const apiUrl = import.meta.env.VITE_MERKLE_PROOF_API_URL || SERVICE_CONFIG.ALLOCATION_API_URL;
      const response = await fetch(`${apiUrl}/${walletAddress}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Wallet not eligible
        }
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data: MerkleAllocation = await response.json();
      
      if (!data.proof || !data.amount) {
        return null;
      }
      
      const amount = ethers.parseUnits(data.amount, 18);
      const leaf = this.createLeafHash(data.address, amount);
      
      return {
        proof: data.proof,
        leaf,
        root: await this.fetchMerkleRoot(),
        index: data.index,
        amount
      };
    } catch (error) {
      console.warn('Failed to fetch merkle proof:', error);
      return null;
    }
  }

  /**
   * Generate merkle proof data for testing/development
   * Creates a mock proof structure for development
   */
  async generateMockMerkleProof(
    walletAddress: string,
    amount: bigint
  ): Promise<MerkleProofData> {
    const leaf = this.createLeafHash(walletAddress, amount);
    
    // Generate mock proof (in real implementation, this would come from the API)
    const mockProof = [
      ethers.keccak256(ethers.toUtf8Bytes('mock_sibling_1')),
      ethers.keccak256(ethers.toUtf8Bytes('mock_sibling_2')),
      ethers.keccak256(ethers.toUtf8Bytes('mock_sibling_3'))
    ];
    
    // Calculate mock root
    let computedHash = leaf;
    for (const proofElement of mockProof) {
      computedHash = ethers.keccak256(ethers.concat([computedHash, proofElement]));
    }
    
    return {
      proof: mockProof,
      leaf,
      root: computedHash,
      index: 0,
      amount
    };
  }

  /**
   * Fetch the merkle root from the contract or API
   */
  private async fetchMerkleRoot(): Promise<string> {
    try {
      // In a real implementation, this would fetch from the claim contract
      // For now, return a placeholder
      return '0x' + '0'.repeat(64);
    } catch (error) {
      console.warn('Failed to fetch merkle root:', error);
      return '0x' + '0'.repeat(64);
    }
  }

  /**
   * Verify a merkle proof locally before submitting
   */
  verifyMerkleProof(
    proof: string[],
    leaf: string,
    root: string
  ): boolean {
    let computedHash = leaf;
    
    for (const proofElement of proof) {
      if (computedHash <= proofElement) {
        computedHash = ethers.keccak256(ethers.concat([computedHash, proofElement]));
      } else {
        computedHash = ethers.keccak256(ethers.concat([proofElement, computedHash]));
      }
    }
    
    return computedHash === root;
  }

  /**
   * Create leaf hash for merkle tree
   * Format will depend on LINEA's implementation
   */
  createLeafHash(address: string, amount: bigint): string {
    // Standard format is often: keccak256(abi.encodePacked(address, amount))
    return ethers.keccak256(
      ethers.solidityPacked(['address', 'uint256'], [address, amount])
    );
  }
}