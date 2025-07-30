export const SERVICE_CONFIG = {
  INFURA_API_KEY: (import.meta.env?.VITE_INFURA_API_KEY as string) || 'your-allowlisted-infura-key',
  LINEA_TOKEN_CLAIM_CONTRACT: (import.meta.env?.VITE_LINEA_CLAIM_CONTRACT as string) || '0xd83af4fbD77f3AB65C3B1Dc4B38D7e67AEcf599A',
  
  GAS_SETTINGS: {
    BASE_GAS_PRICE_GWEI: 20,
    GAS_MULTIPLIER: 1.2,
    MAX_GAS_PRICE_GWEI: 100,
  },
  
  CLAIM_CONFIG: {
    AUTO_DETECT_ALLOCATION: false,
    CLAIM_FUNCTION_SIGNATURE: 'claim(uint256 amount, bytes32[] calldata merkleProof)',
    REQUIRE_USER_AMOUNT: true,
    MAX_CLAIM_AMOUNT: '1000000',
  },
  
  LINEA_CHAIN_ID: 59144,
  LINEA_RPC_URL: 'https://linea-mainnet.infura.io/v3/',
  
  BUNDLE_CONFIG: {
    VALIDITY_SECONDS: 120,
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 2000,
  }
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