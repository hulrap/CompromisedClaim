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
   * Fetch merkle proof from LINEA allocation API or use local demo data
   */
  async fetchMerkleProof(walletAddress: string): Promise<MerkleProofData | null> {
    try {
      // First try the API if configured
      const apiUrl = import.meta.env.VITE_MERKLE_PROOF_API_URL || SERVICE_CONFIG.ALLOCATION_API_URL;
      
      if (apiUrl && apiUrl !== 'https://api.linea.build/allocations') {
        const response = await fetch(`${apiUrl}/${walletAddress}`);
        
        if (response.ok) {
          const data: MerkleAllocation = await response.json();
          
          if (data.proof && data.amount) {
            const amount = ethers.parseUnits(data.amount, 18);
            const leaf = this.createLeafHash(data.address, amount);
            
            return {
              proof: data.proof,
              leaf,
              root: await this.fetchMerkleRoot(),
              index: data.index,
              amount
            };
          }
        }
      }
      
      // Fallback to local demo data for your wallets
      const demoAmount = ethers.parseUnits('1000', 18); // 1000 tokens per demo wallet
      return await this.generateMockMerkleProof(walletAddress, demoAmount);
      
    } catch (error) {
      console.warn('Failed to fetch merkle proof, using demo data:', error);
      // Fallback to demo data
      const demoAmount = ethers.parseUnits('1000', 18);
      return await this.generateMockMerkleProof(walletAddress, demoAmount);
    }
  }

  /**
   * Generate merkle proof data for your live demonstration wallets
   */
  async generateMockMerkleProof(
    walletAddress: string,
    amount: bigint
  ): Promise<MerkleProofData> {
    const leaf = this.createLeafHash(walletAddress, amount);
    
    // Your live merkle root from the generated tree
    const merkleRoot = '0x8d55b081cf60a7a4906a15640fb1315f255b6e5d493ea7572fd4f278a25f6345';
    
    // Your actual proofs for the two demo wallets
    const proofs: { [address: string]: string[] } = {
      '0xEAc2272aBE991443702c2F5920Df4ACfd9A31386': ['0x3810ee2df9c6fca9f7f6c79554ce105d11f246f05e1cb038975bef1a27493242'],
      '0x6F3a62C07C928C2aE8FB5377D20A8D898930F028': ['0xb1c796ad20d27936e429580807268176bfa825d39c037e5ba3df18e7a83f9bb0']
    };
    
    const proof = proofs[walletAddress.toLowerCase()] || proofs[walletAddress] || [];
    
    if (proof.length === 0) {
      console.warn(`No proof found for wallet ${walletAddress}. Available wallets:`, Object.keys(proofs));
    }
    
    return {
      proof,
      leaf,
      root: merkleRoot,
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