import { ethers } from 'ethers';
import axios from 'axios';

interface RescueConfig {
  compromisedWallet: string;
  compromisedPrivateKey: string;
  safeWallet: string;
  safePrivateKey: string;
  infuraApiKey: string;
  lxpContractAddress: string;
  lxpClaimData: string; // Encoded claim function call
}

class CompromisedWalletRescue {
  private provider: ethers.JsonRpcProvider;
  private infuraUrl: string;
  
  constructor(infuraApiKey: string) {
    this.infuraUrl = `https://linea-mainnet.infura.io/v3/${infuraApiKey}`;
    this.provider = new ethers.JsonRpcProvider(this.infuraUrl);
  }

  async rescueLXP(config: RescueConfig): Promise<string> {
    try {
      // 1. Create wallets
      const compromisedWallet = new ethers.Wallet(config.compromisedPrivateKey, this.provider);
      const safeWallet = new ethers.Wallet(config.safePrivateKey, this.provider);

      // 2. Get current block and nonces
      const currentBlock = await this.provider.getBlockNumber();
      const compromisedNonce = await this.provider.getTransactionCount(compromisedWallet.address);
      const safeNonce = await this.provider.getTransactionCount(safeWallet.address);

      // 3. Estimate gas for each transaction
      const gasPrice = await this.provider.getFeeData();
      const claimGasLimit = 200000n; // Adjust based on actual LXP claim complexity
      const transferGasLimit = 65000n; // Standard ERC20 transfer
      const gasBuffer = 1.2; // 20% buffer

      // Calculate total gas needed
      const totalGasNeeded = (claimGasLimit + transferGasLimit) * gasPrice.gasPrice! * BigInt(Math.floor(gasBuffer * 100)) / 100n;

      // 4. Build transactions
      const transactions = [];

      // Transaction 1: Send ETH from safe wallet to compromised wallet
      const fundingTx = {
        from: safeWallet.address,
        to: compromisedWallet.address,
        value: totalGasNeeded,
        nonce: safeNonce,
        gasLimit: 21000n,
        gasPrice: gasPrice.gasPrice,
        chainId: 59144, // Linea mainnet
      };
      const signedFundingTx = await safeWallet.signTransaction(fundingTx);
      transactions.push(signedFundingTx);

      // Transaction 2: Claim LXP from compromised wallet
      const claimTx = {
        from: compromisedWallet.address,
        to: config.lxpContractAddress,
        data: config.lxpClaimData,
        nonce: compromisedNonce,
        gasLimit: claimGasLimit,
        gasPrice: gasPrice.gasPrice,
        chainId: 59144,
      };
      const signedClaimTx = await compromisedWallet.signTransaction(claimTx);
      transactions.push(signedClaimTx);

      // Transaction 3: Transfer claimed LXP to safe wallet
      // Assuming standard ERC20 transfer
      const lxpInterface = new ethers.Interface([
        "function transfer(address to, uint256 amount) returns (bool)",
        "function balanceOf(address account) view returns (uint256)"
      ]);
      
      // You'll need to determine the amount to transfer
      // This is a placeholder - in reality, you'd need to know the claim amount
      const transferAmount = ethers.parseEther("100"); // Adjust based on actual amount
      
      const transferData = lxpInterface.encodeFunctionData("transfer", [
        safeWallet.address,
        transferAmount
      ]);

      const transferTx = {
        from: compromisedWallet.address,
        to: config.lxpContractAddress,
        data: transferData,
        nonce: compromisedNonce + 1,
        gasLimit: transferGasLimit,
        gasPrice: gasPrice.gasPrice,
        chainId: 59144,
      };
      const signedTransferTx = await compromisedWallet.signTransaction(transferTx);
      transactions.push(signedTransferTx);

      // 5. Send bundle
      const bundle = {
        jsonrpc: "2.0",
        method: "eth_sendBundle",
        params: [{
          txs: transactions,
          blockNumber: `0x${(currentBlock + 1).toString(16)}`,
          minTimestamp: Math.floor(Date.now() / 1000),
          maxTimestamp: Math.floor(Date.now() / 1000) + 60 // Valid for 60 seconds
        }],
        id: 1
      };

      const response = await axios.post(this.infuraUrl, bundle, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      return response.data.result.bundleHash;
    } catch (error) {
      console.error('Bundle submission failed:', error);
      throw error;
    }
  }

  // Monitor bundle status
  async monitorBundle(transactions: string[]): Promise<boolean> {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const receipts = await Promise.all(
        transactions.map(tx => 
          this.provider.getTransactionReceipt(ethers.keccak256(tx))
        )
      );

      // Check if all transactions are confirmed
      if (receipts.every(receipt => receipt !== null)) {
        console.log('Bundle executed successfully!');
        return true;
      }

      // Wait 2 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    return false;
  }
}

// Usage example
async function main() {
  const rescue = new CompromisedWalletRescue('YOUR_INFURA_API_KEY');
  
  const config: RescueConfig = {
    compromisedWallet: '0x...',
    compromisedPrivateKey: '0x...',
    safeWallet: '0x...',
    safePrivateKey: '0x...',
    infuraApiKey: 'YOUR_INFURA_API_KEY',
    lxpContractAddress: '0x...', // LXP token contract
    lxpClaimData: '0x...', // Encoded claim function call
  };

  try {
    const bundleHash = await rescue.rescueLXP(config);
    console.log('Bundle submitted:', bundleHash);
    
    // Monitor execution
    // Note: You'll need to extract transaction hashes from the signed transactions
    // await rescue.monitorBundle([...]);
  } catch (error) {
    console.error('Rescue failed:', error);
  }
}