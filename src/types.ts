export interface RescueConfig {
  compromisedAddress: string;
  compromisedPrivateKey: string;
  safeAddress: string;
  safePrivateKey: string;
}

export interface BundleTransaction {
  from: string;
  to: string;
  value?: bigint;
  data?: string;
  nonce: number;
  gasLimit: bigint;
  gasPrice: bigint;
  chainId: number;
}

export interface BundleResponse {
  bundleHash: string;
  transactions: string[];
}

export interface LXPClaimInfo {
  amount: bigint;
  claimData: string;
  contractAddress: string;
}

export interface GasEstimate {
  claimGas: bigint;
  transferGas: bigint;
  totalEthNeeded: bigint;
}