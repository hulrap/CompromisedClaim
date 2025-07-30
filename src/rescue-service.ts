import { ethers } from 'ethers';
import axios from 'axios';
import { RescueConfig, BundleTransaction, BundleResponse, GasEstimate } from './types';
import { GasOptimizer } from './gas-optimizer';
import { AllocationService } from './allocation-service';
import { SERVICE_CONFIG } from './config';

export class LXPRescueService {
  private readonly provider: ethers.JsonRpcProvider;
  private readonly infuraUrl: string;
  private readonly gasOptimizer: GasOptimizer;
  private readonly allocationService: AllocationService;
  
  constructor() {
    // Use service's hardcoded API key - users don't need to provide
    this.infuraUrl = `${SERVICE_CONFIG.LINEA_RPC_URL}${SERVICE_CONFIG.INFURA_API_KEY}`;
    this.provider = new ethers.JsonRpcProvider(this.infuraUrl);
    this.gasOptimizer = new GasOptimizer(this.provider);
    this.allocationService = new AllocationService(this.provider);
  }

  private validateAddress(address: string): void {
    if (!ethers.isAddress(address)) {
      throw new Error(`Invalid address: ${address}`);
    }
  }

  private validatePrivateKey(privateKey: string): void {
    try {
      new ethers.Wallet(privateKey);
    } catch {
      throw new Error('Invalid private key');
    }
  }

  async estimateGas(compromisedAddress: string, userAmount?: string): Promise<GasEstimate> {
    const gasSettings = await this.gasOptimizer.getOptimalGasSettings();
    const gasPrice = gasSettings.gasPrice;
    
    // Get allocation info which includes claim data
    const allocation = await this.allocationService.getAllocation(compromisedAddress, userAmount);
    if (!allocation.canClaim) {
      throw new Error(allocation.error || 'Cannot claim tokens');
    }
    
    const claimGas = await this.gasOptimizer.estimateClaimGas(
      SERVICE_CONFIG.LINEA_TOKEN_CLAIM_CONTRACT,
      allocation.claimData,
      compromisedAddress
    );
    
    const transferGas = await this.gasOptimizer.estimateTransferGas();
    const fundingGas = 21000n; // Standard ETH transfer
    
    const totalGas = claimGas + transferGas + fundingGas;
    const totalEthNeeded = totalGas * gasPrice;
    
    return {
      claimGas,
      transferGas,
      totalEthNeeded
    };
  }

  async rescueTokens(config: RescueConfig, userAmount?: string): Promise<BundleResponse> {
    this.validateAddress(config.compromisedAddress);
    this.validateAddress(config.safeAddress);
    this.validatePrivateKey(config.compromisedPrivateKey);
    this.validatePrivateKey(config.safePrivateKey);
    
    // Check if already claimed
    const alreadyClaimed = await this.allocationService.checkIfAlreadyClaimed(config.compromisedAddress);
    if (alreadyClaimed) {
      throw new Error('Tokens have already been claimed from this wallet');
    }
    
    // Get allocation and claim data
    const allocation = await this.allocationService.getAllocation(config.compromisedAddress, userAmount);
    if (!allocation.canClaim) {
      throw new Error(allocation.error || 'Cannot claim tokens');
    }
    
    const compromisedWallet = new ethers.Wallet(config.compromisedPrivateKey, this.provider);
    const safeWallet = new ethers.Wallet(config.safePrivateKey, this.provider);
    
    const [currentBlock, compromisedNonce, safeNonce] = await Promise.all([
      this.provider.getBlockNumber(),
      this.provider.getTransactionCount(config.compromisedAddress),
      this.provider.getTransactionCount(config.safeAddress)
    ]);
    
    const gasSettings = await this.gasOptimizer.getOptimalGasSettings();
    const gasEstimate = await this.estimateGas(config.compromisedAddress, userAmount);
    
    const transactions: string[] = [];
    
    // Transaction 1: Fund compromised wallet
    const fundingTx: BundleTransaction = {
      from: config.safeAddress,
      to: config.compromisedAddress,
      value: gasEstimate.totalEthNeeded,
      nonce: safeNonce,
      gasLimit: 21000n,
      gasPrice: gasSettings.gasPrice,
      chainId: SERVICE_CONFIG.LINEA_CHAIN_ID
    };
    const signedFundingTx = await safeWallet.signTransaction(fundingTx);
    transactions.push(signedFundingTx);
    
    // Transaction 2: Claim LINEA tokens
    const claimTx: BundleTransaction = {
      from: config.compromisedAddress,
      to: SERVICE_CONFIG.LINEA_TOKEN_CLAIM_CONTRACT,
      data: allocation.claimData,
      nonce: compromisedNonce,
      gasLimit: gasEstimate.claimGas,
      gasPrice: gasSettings.gasPrice,
      chainId: SERVICE_CONFIG.LINEA_CHAIN_ID
    };
    const signedClaimTx = await compromisedWallet.signTransaction(claimTx);
    transactions.push(signedClaimTx);
    
    // Transaction 3: Transfer claimed LINEA tokens to safe wallet
    const lineaTokenInterface = new ethers.Interface([
      'function transfer(address to, uint256 amount) returns (bool)'
    ]);
    
    const transferData = lineaTokenInterface.encodeFunctionData('transfer', [
      config.safeAddress,
      allocation.amount
    ]);
    
    const transferTx: BundleTransaction = {
      from: config.compromisedAddress,
      to: SERVICE_CONFIG.LINEA_TOKEN_CLAIM_CONTRACT,
      data: transferData,
      nonce: compromisedNonce + 1,
      gasLimit: gasEstimate.transferGas,
      gasPrice: gasSettings.gasPrice,
      chainId: SERVICE_CONFIG.LINEA_CHAIN_ID
    };
    const signedTransferTx = await compromisedWallet.signTransaction(transferTx);
    transactions.push(signedTransferTx);
    
    // Send bundle with retry logic
    return await this.submitBundleWithRetry(transactions, currentBlock);
  }

  private async submitBundleWithRetry(transactions: string[], currentBlock: number): Promise<BundleResponse> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= SERVICE_CONFIG.BUNDLE_CONFIG.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const bundle = {
          jsonrpc: '2.0',
          method: 'eth_sendBundle',
          params: [{
            txs: transactions,
            blockNumber: `0x${(currentBlock + attempt).toString(16)}`,
            minTimestamp: Math.floor(Date.now() / 1000),
            maxTimestamp: Math.floor(Date.now() / 1000) + SERVICE_CONFIG.BUNDLE_CONFIG.VALIDITY_SECONDS
          }],
          id: attempt
        };
        
        const response = await axios.post(this.infuraUrl, bundle, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        });
        
        if (response.data.error) {
          lastError = new Error(`Bundle attempt ${attempt} failed: ${response.data.error.message}`);
          console.warn(lastError.message);
          
          if (attempt < SERVICE_CONFIG.BUNDLE_CONFIG.MAX_RETRY_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, SERVICE_CONFIG.BUNDLE_CONFIG.RETRY_DELAY_MS));
            continue;
          }
        } else {
          return {
            bundleHash: response.data.result.bundleHash,
            transactions: transactions.map(tx => ethers.keccak256(tx))
          };
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(`Bundle attempt ${attempt} failed:`, error);
        
        if (attempt < SERVICE_CONFIG.BUNDLE_CONFIG.MAX_RETRY_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, SERVICE_CONFIG.BUNDLE_CONFIG.RETRY_DELAY_MS));
        }
      }
    }
    
    throw new Error(`Bundle submission failed after ${SERVICE_CONFIG.BUNDLE_CONFIG.MAX_RETRY_ATTEMPTS} attempts. Last error: ${lastError?.message}`);
  }

  async monitorBundle(transactionHashes: string[]): Promise<boolean> {
    const maxAttempts = 60; // 2 minutes
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const receipts = await Promise.all(
          transactionHashes.map(hash => this.provider.getTransactionReceipt(hash))
        );
        
        if (receipts.every(receipt => receipt !== null && receipt.status === 1)) {
          return true;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      } catch (error) {
        console.warn('Error monitoring bundle:', error);
        attempts++;
      }
    }
    
    return false;
  }
}