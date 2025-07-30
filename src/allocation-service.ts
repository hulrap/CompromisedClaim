import { ethers } from 'ethers';
import { SERVICE_CONFIG } from './config';

export interface AllocationInfo {
  amount: bigint;
  claimData: string;
  canClaim: boolean;
  error?: string;
}

export class AllocationService {
  private readonly provider: ethers.JsonRpcProvider;

  constructor(provider: ethers.JsonRpcProvider) {
    this.provider = provider;
  }

  async getAllocation(walletAddress: string, userAmount?: string): Promise<AllocationInfo> {
    if (SERVICE_CONFIG.CLAIM_CONFIG.AUTO_DETECT_ALLOCATION) {
      return await this.getFromLineaAPI(walletAddress);
    }

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
        error: 'Amount required - allocation auto-detection not available yet'
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
          error: `Amount exceeds maximum allowed: ${SERVICE_CONFIG.CLAIM_CONFIG.MAX_CLAIM_AMOUNT}`
        };
      }

      const claimData = await this.generateClaimData(amount);
      
      return {
        amount,
        claimData,
        canClaim: true
      };
    } catch (error) {
      return {
        amount: 0n,
        claimData: '0x',
        canClaim: false,
        error: `Invalid amount: ${(error as Error).message}`
      };
    }
  }

  private async generateClaimData(amount: bigint): Promise<string> {
    const lxpInterface = new ethers.Interface([
      SERVICE_CONFIG.CLAIM_CONFIG.CLAIM_FUNCTION_SIGNATURE,
    ]);

    try {
      return lxpInterface.encodeFunctionData('claim', [amount]);
    } catch (error) {
      throw new Error(`Failed to generate claim data: ${(error as Error).message}`);
    }
  }

  private async getFromLineaAPI(walletAddress: string): Promise<AllocationInfo> {
    try {
      const response = await fetch(`https://api.linea.build/allocations/${walletAddress}`);
      const data = await response.json();
      
      if (!data.eligible) {
        return {
          amount: 0n,
          claimData: '0x',
          canClaim: false,
          error: 'Wallet not eligible for LXP claim'
        };
      }
      
      const amount = ethers.parseUnits(data.allocation.toString(), 18);
      const claimData = await this.generateClaimData(amount);
      
      return {
        amount,
        claimData,
        canClaim: true
      };
    } catch (error) {
      return {
        amount: 0n,
        claimData: '0x',
        canClaim: false,
        error: `Failed to fetch allocation: ${(error as Error).message}`
      };
    }
  }

  async checkIfAlreadyClaimed(walletAddress: string): Promise<boolean> {
    try {
      const contract = new ethers.Contract(
        SERVICE_CONFIG.LINEA_TOKEN_CLAIM_CONTRACT,
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