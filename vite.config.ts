/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      process: 'process/browser',
      buffer: 'buffer',
      util: 'util',
    },
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: {
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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/build/**',
        '**/dist/**'
      ]
    },
  },
});