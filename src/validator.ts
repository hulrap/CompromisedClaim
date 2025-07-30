import { ethers } from 'ethers';
import { RescueConfig } from './types';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class Validator {
  static validateConfig(config: RescueConfig): void {
    if (!config.compromisedAddress || !ethers.isAddress(config.compromisedAddress)) {
      throw new ValidationError('Invalid compromised wallet address');
    }
    
    if (!config.safeAddress || !ethers.isAddress(config.safeAddress)) {
      throw new ValidationError('Invalid safe wallet address');
    }
    
    if (config.compromisedAddress.toLowerCase() === config.safeAddress.toLowerCase()) {
      throw new ValidationError('Compromised and safe addresses cannot be the same');
    }
    
    if (!config.compromisedPrivateKey?.startsWith('0x')) {
      throw new ValidationError('Invalid compromised private key format');
    }
    
    if (!config.safePrivateKey?.startsWith('0x')) {
      throw new ValidationError('Invalid safe private key format');
    }
    
    
    try {
      const compromisedWallet = new ethers.Wallet(config.compromisedPrivateKey);
      if (compromisedWallet.address.toLowerCase() !== config.compromisedAddress.toLowerCase()) {
        throw new ValidationError('Compromised private key does not match address');
      }
      
      const safeWallet = new ethers.Wallet(config.safePrivateKey);
      if (safeWallet.address.toLowerCase() !== config.safeAddress.toLowerCase()) {
        throw new ValidationError('Safe private key does not match address');
      }
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError('Invalid private key format');
    }
  }
  
  static validateAmount(amount: string): bigint {
    try {
      const parsed = ethers.parseUnits(amount, 18);
      if (parsed <= 0n) {
        throw new ValidationError('Amount must be greater than 0');
      }
      return parsed;
    } catch {
      throw new ValidationError('Invalid amount format');
    }
  }
  
  static validateClaimData(claimData: string): void {
    if (!claimData || !claimData.startsWith('0x') || claimData.length < 10) {
      throw new ValidationError('Invalid claim data format');
    }
  }

  static validateGasPrice(gasPrice: string): void {
    try {
      const parsed = Number(gasPrice);
      if (parsed <= 0 || parsed > 1000) {
        throw new ValidationError('Gas price must be between 1 and 1000 Gwei');
      }
    } catch {
      throw new ValidationError('Invalid gas price format');
    }
  }

  static validateContractAddress(address: string, contractType: string): void {
    if (!address || !ethers.isAddress(address)) {
      throw new ValidationError(`Invalid ${contractType} address format`);
    }
    
    if (address === '0x0000000000000000000000000000000000000000') {
      throw new ValidationError(`${contractType} address cannot be zero address`);
    }
  }
}