import { ethers } from 'ethers';
import { SERVICE_CONFIG } from './config';
import { MerkleProofService, MerkleProofData } from './merkle-service';

export interface AllocationInfo {
  amount: bigint;
  claimData: string;
  canClaim: boolean;
  mode: 'user_input' | 'auto_detect' | 'claim_all' | 'merkle_proof';
  merkleProof?: MerkleProofData;
  error?: string;
}

export class AllocationService {
  private readonly provider: ethers.JsonRpcProvider;
  private readonly merkleService: MerkleProofService;

  constructor(provider: ethers.JsonRpcProvider) {
    this.provider = provider;
    this.merkleService = new MerkleProofService();
  }

  async getAllocation(walletAddress: string, userAmount?: string): Promise<AllocationInfo> {
    // Determine which claim mode to use based on configuration
    if (SERVICE_CONFIG.CLAIM_CONFIG.USE_MERKLE_PROOF_MODE) {
      return await this.getMerkleProofAllocation(walletAddress);
    }
    
    if (SERVICE_CONFIG.CLAIM_CONFIG.USE_CLAIM_ALL_MODE) {
      return await this.getClaimAllAllocation(walletAddress);
    }
    
    if (SERVICE_CONFIG.CLAIM_CONFIG.USE_AUTO_DETECTION) {
      try {
        return await this.getAutoDetectedAllocation(walletAddress);
      } catch (error) {
        console.warn('Auto-detection failed, falling back to user input:', error);
        return this.getUserInputAllocation(walletAddress, userAmount);
      }
    }
    
    if (SERVICE_CONFIG.CLAIM_CONFIG.USE_USER_INPUT_AMOUNT) {
      return this.getUserInputAllocation(walletAddress, userAmount);
    }
    
    // Fallback: Default to user input mode if no mode is set
    return this.getUserInputAllocation(walletAddress, userAmount);
  }

  private async getUserInputAllocation(
    _walletAddress: string, 
    userAmount?: string
  ): Promise<AllocationInfo> {
    if (!userAmount) {
      return {
        amount: 0n,
        claimData: '0x',
        canClaim: false,
        mode: 'user_input',
        error: 'Amount required for user input mode'
      };
    }

    try {
      const amount = ethers.parseUnits(userAmount, 18);
      const maxAmount = ethers.parseUnits(SERVICE_CONFIG.CLAIM_CONFIG.MAX_CLAIM_AMOUNT, 18);
      
      if (amount > maxAmount) {
        return {
          amount: 0n,
          claimData: '0x',
          canClaim: false,
          mode: 'user_input',
          error: `Amount exceeds maximum allowed: ${SERVICE_CONFIG.CLAIM_CONFIG.MAX_CLAIM_AMOUNT}`
        };
      }

      const claimData = await this.generateSimpleClaimData(amount);
      
      return {
        amount,
        claimData,
        canClaim: true,
        mode: 'user_input'
      };
    } catch (error) {
      return {
        amount: 0n,
        claimData: '0x',
        canClaim: false,
        mode: 'user_input',
        error: `Invalid amount: ${(error as Error).message}`
      };
    }
  }

  private async getMerkleProofAllocation(walletAddress: string): Promise<AllocationInfo> {
    try {
      const merkleProof = await this.merkleService.fetchMerkleProof(walletAddress);
      
      if (!merkleProof) {
        return {
          amount: 0n,
          claimData: '0x',
          canClaim: false,
          mode: 'merkle_proof',
          error: 'No merkle proof found for this wallet address'
        };
      }

      // Verify the proof locally before generating claim data
      const isValid = this.merkleService.verifyMerkleProof(
        merkleProof.proof,
        merkleProof.leaf,
        merkleProof.root
      );

      if (!isValid) {
        return {
          amount: 0n,
          claimData: '0x',
          canClaim: false,
          mode: 'merkle_proof',
          error: 'Invalid merkle proof'
        };
      }

      const claimData = await this.generateMerkleClaimData(merkleProof.amount, merkleProof.proof);
      
      return {
        amount: merkleProof.amount,
        claimData,
        canClaim: true,
        mode: 'merkle_proof',
        merkleProof
      };
    } catch (error) {
      return {
        amount: 0n,
        claimData: '0x',
        canClaim: false,
        mode: 'merkle_proof',
        error: `Merkle proof error: ${(error as Error).message}`
      };
    }
  }

  private async getClaimAllAllocation(_walletAddress: string): Promise<AllocationInfo> {
    try {
      const claimData = await this.generateClaimAllData();
      
      return {
        amount: 0n, // Amount determined by contract
        claimData,
        canClaim: true,
        mode: 'claim_all'
      };
    } catch (error) {
      return {
        amount: 0n,
        claimData: '0x',
        canClaim: false,
        mode: 'claim_all',
        error: `Claim all error: ${(error as Error).message}`
      };
    }
  }

  private async getAutoDetectedAllocation(walletAddress: string): Promise<AllocationInfo> {
    try {
      const response = await fetch(`${SERVICE_CONFIG.ALLOCATION_API_URL}/${walletAddress}`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.eligible || !data.allocation) {
        return {
          amount: 0n,
          claimData: '0x',
          canClaim: false,
          mode: 'auto_detect',
          error: 'Wallet not eligible for LINEA token claim'
        };
      }
      
      const amount = ethers.parseUnits(data.allocation.toString(), 18);
      const claimData = await this.generateSimpleClaimData(amount);
      
      return {
        amount,
        claimData,
        canClaim: true,
        mode: 'auto_detect'
      };
    } catch (error) {
      throw new Error(`Failed to fetch allocation from API: ${(error as Error).message}`);
    }
  }

  private async generateSimpleClaimData(amount: bigint): Promise<string> {
    const claimInterface = new ethers.Interface([
      SERVICE_CONFIG.CLAIM_CONFIG.SIMPLE_CLAIM_SIGNATURE,
    ]);

    try {
      return claimInterface.encodeFunctionData('claim', [amount]);
    } catch (error) {
      throw new Error(`Failed to generate simple claim data: ${(error as Error).message}`);
    }
  }

  private async generateMerkleClaimData(amount: bigint, proof: string[]): Promise<string> {
    const claimInterface = new ethers.Interface([
      SERVICE_CONFIG.CLAIM_CONFIG.MERKLE_CLAIM_SIGNATURE,
    ]);

    try {
      return claimInterface.encodeFunctionData('claim', [amount, proof]);
    } catch (error) {
      throw new Error(`Failed to generate merkle claim data: ${(error as Error).message}`);
    }
  }

  private async generateClaimAllData(): Promise<string> {
    const claimInterface = new ethers.Interface([
      SERVICE_CONFIG.CLAIM_CONFIG.CLAIM_ALL_SIGNATURE,
    ]);

    try {
      return claimInterface.encodeFunctionData('claimAll', []);
    } catch (error) {
      throw new Error(`Failed to generate claim all data: ${(error as Error).message}`);
    }
  }

  async checkIfAlreadyClaimed(walletAddress: string): Promise<boolean> {
    try {
      if (!SERVICE_CONFIG.LINEA_CLAIM_CONTRACT || SERVICE_CONFIG.LINEA_CLAIM_CONTRACT === '0x0000000000000000000000000000000000000000') {
        console.warn('LINEA claim contract not configured');
        return false;
      }

      const contract = new ethers.Contract(
        SERVICE_CONFIG.LINEA_CLAIM_CONTRACT,
        ['function hasClaimed(address) view returns (bool)'],
        this.provider
      );
      
      return await contract.hasClaimed(walletAddress);
    } catch (error) {
      console.warn('Could not check claim status:', error);
      return false;
    }
  }
}