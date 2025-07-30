// Environment variable validation
const requiredEnvVars = {
  INFURA_API_KEY: import.meta.env.VITE_INFURA_API_KEY,
  LINEA_CLAIM_CONTRACT: import.meta.env.VITE_LINEA_CLAIM_CONTRACT,
  LINEA_TOKEN_CONTRACT: import.meta.env.VITE_LINEA_TOKEN_CONTRACT,
};

// Validate required environment variables
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value || value === '0x0000000000000000000000000000000000000000') {
    console.warn(`${key} not configured. Please set in .env file.`);
  }
}

export const SERVICE_CONFIG = {
  // API Configuration
  INFURA_API_KEY: import.meta.env.VITE_INFURA_API_KEY,
  LINEA_RPC_URL: import.meta.env.VITE_LINEA_RPC_URL || 'https://linea-mainnet.infura.io/v3/',
  LINEA_CHAIN_ID: Number(import.meta.env.VITE_LINEA_CHAIN_ID) || 59144,
  
  // Contract Addresses - MUST be configured when LINEA token launches
  LINEA_TOKEN_CONTRACT: import.meta.env.VITE_LINEA_TOKEN_CONTRACT,
  LINEA_CLAIM_CONTRACT: import.meta.env.VITE_LINEA_CLAIM_CONTRACT,
  
  // Allocation API
  ALLOCATION_API_URL: import.meta.env.VITE_LINEA_ALLOCATION_API_URL || 'https://api.linea.build/allocations',
  ENABLE_AUTO_ALLOCATION: import.meta.env.VITE_ENABLE_AUTO_ALLOCATION_DETECTION === 'true',
  
  // Gas Settings - Critical for LINEA token launch
  GAS_SETTINGS: {
    BASE_GAS_PRICE_GWEI: Number(import.meta.env.VITE_DEFAULT_GAS_PRICE_GWEI) || 50,
    GAS_MULTIPLIER: Number(import.meta.env.VITE_GAS_MULTIPLIER) || 1.5,
    MAX_GAS_PRICE_GWEI: Number(import.meta.env.VITE_MAX_GAS_PRICE_GWEI) || 200,
    FORCE_MANUAL_GAS: import.meta.env.VITE_FORCE_MANUAL_GAS_PRICE === 'true',
    MANUAL_GAS_PRICE_GWEI: Number(import.meta.env.VITE_MANUAL_GAS_PRICE_GWEI) || 100,
  },
  
  // Claim Configuration - Choose your claim mode
  CLAIM_CONFIG: {
    // Claim modes (choose one)
    USE_AUTO_DETECTION: import.meta.env.VITE_USE_AUTO_DETECTION === 'true',
    USE_USER_INPUT_AMOUNT: import.meta.env.VITE_USE_USER_INPUT_AMOUNT === 'true',
    USE_CLAIM_ALL_MODE: import.meta.env.VITE_USE_CLAIM_ALL_MODE === 'true',
    USE_MERKLE_PROOF_MODE: import.meta.env.VITE_USE_MERKLE_PROOF_MODE === 'true',
    
    // Function signatures for different claim contract types
    SIMPLE_CLAIM_SIGNATURE: 'claim(uint256 amount)',
    MERKLE_CLAIM_SIGNATURE: 'function claimERC20(address _token, address _receiver, uint256 _quantity, bytes32[] calldata _proofs)',
    CLAIM_ALL_SIGNATURE: 'claimAll()',
    
    // Settings
    MAX_CLAIM_AMOUNT: import.meta.env.VITE_MAX_CLAIM_AMOUNT || '1000000',
    DEFAULT_CLAIM_AMOUNT: import.meta.env.VITE_DEFAULT_CLAIM_AMOUNT || '0',
  },
  
  // Bundle Transaction Settings
  BUNDLE_CONFIG: {
    VALIDITY_SECONDS: Number(import.meta.env.VITE_BUNDLE_VALIDITY_SECONDS) || 120,
    MAX_RETRY_ATTEMPTS: Number(import.meta.env.VITE_MAX_RETRY_ATTEMPTS) || 3,
    RETRY_DELAY_MS: 2000,
  },
  
  // Development Settings
  DEBUG_LOGGING: import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true',
  TEST_MODE: import.meta.env.VITE_TEST_MODE === 'true',
};

export const ALLOCATION_PROVIDERS = {
  USER_INPUT: {
    enabled: true,
    validation: {
      min: '0.1',
      max: SERVICE_CONFIG.CLAIM_CONFIG.MAX_CLAIM_AMOUNT
    }
  }
};