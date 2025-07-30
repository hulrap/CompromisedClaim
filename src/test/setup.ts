import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// Global test setup
global.fetch = vi.fn();

// Mock import.meta.env for Vitest
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_INFURA_API_KEY: 'test_infura_key',
    VITE_LINEA_CLAIM_CONTRACT: '0x1234567890123456789012345678901234567890',
    VITE_LINEA_TOKEN_CONTRACT: '0x0987654321098765432109876543210987654321',
    VITE_ALLOCATION_API_URL: 'https://test-api.linea.build',
    VITE_USE_MERKLE_PROOF_MODE: 'false',
    VITE_USE_AUTO_DETECTION: 'false',
    VITE_USE_USER_INPUT_AMOUNT: 'true',
    VITE_USE_CLAIM_ALL_MODE: 'false',
    VITE_DEFAULT_GAS_PRICE_GWEI: '50',
    VITE_GAS_MULTIPLIER: '1.5',
    VITE_MAX_GAS_PRICE_GWEI: '200'
  },
  writable: true
});

// Mock environment variables for testing
process.env.VITE_INFURA_API_KEY = 'test_infura_key';
process.env.VITE_LINEA_CLAIM_CONTRACT = '0x1234567890123456789012345678901234567890';
process.env.VITE_LINEA_TOKEN_CONTRACT = '0x0987654321098765432109876543210987654321';
process.env.VITE_ALLOCATION_API_URL = 'https://test-api.linea.build';
process.env.VITE_USE_MERKLE_PROOF_MODE = 'false';
process.env.VITE_USE_AUTO_DETECTION = 'false';
process.env.VITE_USE_USER_INPUT_AMOUNT = 'true';
process.env.VITE_USE_CLAIM_ALL_MODE = 'false';
process.env.VITE_DEFAULT_GAS_PRICE_GWEI = '50';
process.env.VITE_GAS_MULTIPLIER = '1.5';
process.env.VITE_MAX_GAS_PRICE_GWEI = '200';

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});