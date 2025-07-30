import { ethers } from 'ethers';
import { SERVICE_CONFIG } from './config';

export class GasOptimizer {
  private readonly provider: ethers.JsonRpcProvider;

  constructor(provider: ethers.JsonRpcProvider) {
    this.provider = provider;
  }

  async getOptimalGasSettings(): Promise<{
    gasPrice: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  }> {
    try {
      const feeData = await this.provider.getFeeData();
      
      // Use EIP-1559 if available (more reliable)
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        const maxFeePerGas = this.applyMultiplier(feeData.maxFeePerGas);
        const maxPriorityFeePerGas = this.applyMultiplier(feeData.maxPriorityFeePerGas);
        
        return {
          gasPrice: maxFeePerGas, // Fallback for legacy
          maxFeePerGas,
          maxPriorityFeePerGas
        };
      }
      
      // Fallback to legacy gas pricing
      const baseGasPrice = feeData.gasPrice || ethers.parseUnits(
        SERVICE_CONFIG.GAS_SETTINGS.BASE_GAS_PRICE_GWEI.toString(), 
        'gwei'
      );
      
      const optimizedGasPrice = this.applyMultiplier(baseGasPrice);
      
      return { gasPrice: optimizedGasPrice };
    } catch (error) {
      console.warn('Failed to get optimal gas, using fallback:', error);
      return {
        gasPrice: ethers.parseUnits(
          SERVICE_CONFIG.GAS_SETTINGS.BASE_GAS_PRICE_GWEI.toString(),
          'gwei'
        )
      };
    }
  }

  private applyMultiplier(gasPrice: bigint): bigint {
    const multiplier = Math.floor(SERVICE_CONFIG.GAS_SETTINGS.GAS_MULTIPLIER * 100);
    const maxGasPrice = ethers.parseUnits(
      SERVICE_CONFIG.GAS_SETTINGS.MAX_GAS_PRICE_GWEI.toString(),
      'gwei'
    );
    
    const optimized = (gasPrice * BigInt(multiplier)) / 100n;
    
    // Apply safety limit
    return optimized > maxGasPrice ? maxGasPrice : optimized;
  }

  async estimateClaimGas(
    contractAddress: string,
    claimData: string,
    fromAddress: string
  ): Promise<bigint> {
    try {
      const gasEstimate = await this.provider.estimateGas({
        from: fromAddress,
        to: contractAddress,
        data: claimData
      });
      
      // Add buffer for safety
      return this.applyMultiplier(gasEstimate);
    } catch (error) {
      console.warn('Gas estimation failed, using fallback:', error);
      // Conservative fallback
      return 300000n;
    }
  }

  async estimateTransferGas(): Promise<bigint> {
    // Standard ERC20 transfer with buffer
    return 80000n;
  }
}