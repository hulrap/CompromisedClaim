import { ethers } from 'ethers';
import { LXPClaimInfo } from './types';

const LXP_ABI = [
  'function claim(uint256 amount, bytes32[] calldata merkleProof) external',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

const KNOWN_LXP_CONTRACTS = [
  '0xd83af4fbD77f3AB65C3B1Dc4B38D7e67AEcf599A',
];

export class LXPDetector {
  private readonly provider: ethers.JsonRpcProvider;

  constructor(provider: ethers.JsonRpcProvider) {
    this.provider = provider;
  }

  async detectClaimableTokens(address: string): Promise<LXPClaimInfo[]> {
    const claimableTokens: LXPClaimInfo[] = [];
    
    for (const contractAddress of KNOWN_LXP_CONTRACTS) {
      try {
        const contract = new ethers.Contract(contractAddress, LXP_ABI, this.provider);
        const balance = await contract.balanceOf(address);
        
        if (balance > 0n) {
          const transferData = contract.interface.encodeFunctionData('transfer', [
            address, // This will be replaced with safe address
            balance
          ]);
          
          claimableTokens.push({
            amount: balance,
            claimData: transferData,
            contractAddress
          });
        }
      } catch (error) {
        console.warn(`Failed to check contract ${contractAddress}:`, error);
        continue;
      }
    }
    
    return claimableTokens;
  }

  async getClaimData(contractAddress: string, amount: bigint, merkleProof: string[]): Promise<string> {
    const contract = new ethers.Contract(contractAddress, LXP_ABI, this.provider);
    return contract.interface.encodeFunctionData('claim', [amount, merkleProof]);
  }

  async estimateClaimGas(contractAddress: string, claimData: string, from: string): Promise<bigint> {
    try {
      const gasEstimate = await this.provider.estimateGas({
        from,
        to: contractAddress,
        data: claimData
      });
      return gasEstimate * 120n / 100n; // 20% buffer
    } catch {
      return 200000n; // Fallback gas limit
    }
  }
}