import { vi } from 'vitest';

// Mock ethers providers and utilities
export const mockProvider = {
  getBalance: vi.fn(),
  getBlockNumber: vi.fn(),
  getTransactionCount: vi.fn(),
  getFeeData: vi.fn(),
  estimateGas: vi.fn(),
  getTransactionReceipt: vi.fn(),
};

export const mockWallet = {
  address: '0x742E4C7d4eE6F8c8B0F8e3E8f8F8F8F8F8F8F8F8',
  signTransaction: vi.fn(),
};

export const mockContract = {
  hasClaimed: vi.fn(),
  estimateGas: vi.fn(),
};

// Mock ethers utilities
export const ethers = {
  JsonRpcProvider: vi.fn(() => mockProvider),
  Wallet: vi.fn(() => mockWallet),
  Contract: vi.fn(() => mockContract),
  Interface: vi.fn(() => ({
    encodeFunctionData: vi.fn(),
  })),
  isAddress: vi.fn((addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr)),
  parseUnits: vi.fn((value: string, decimals: number = 18) => BigInt(value) * BigInt(10 ** decimals)),
  formatEther: vi.fn((value: bigint) => (Number(value) / 1e18).toString()),
  formatUnits: vi.fn((value: bigint, decimals: number = 18) => (Number(value) / (10 ** decimals)).toString()),
  parseEther: vi.fn((value: string) => BigInt(Math.floor(parseFloat(value) * 1e18))),
  keccak256: vi.fn((_data: string) => '0x' + 'a'.repeat(64)),
  solidityPacked: vi.fn(() => '0x' + 'b'.repeat(64)),
  concat: vi.fn(() => '0x' + 'c'.repeat(64)),
  toUtf8Bytes: vi.fn((str: string) => new Uint8Array([...str].map(c => c.charCodeAt(0)))),
};

vi.mock('ethers', () => ({ ethers }));