import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// Global test setup
global.fetch = vi.fn();

// Mock environment variables for testing
process.env.VITE_INFURA_API_KEY = 'test_infura_key';
process.env.VITE_LINEA_CLAIM_CONTRACT = '0x1234567890123456789012345678901234567890';
process.env.VITE_LINEA_TOKEN_CONTRACT = '0x0987654321098765432109876543210987654321';
process.env.VITE_ALLOCATION_API_URL = 'https://test-api.linea.build';

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