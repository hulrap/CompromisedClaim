import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Config Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SERVICE_CONFIG structure', () => {
    it('should export SERVICE_CONFIG with required properties', async () => {
      const { SERVICE_CONFIG } = await import('../../config');

      expect(SERVICE_CONFIG).toHaveProperty('INFURA_API_KEY');
      expect(SERVICE_CONFIG).toHaveProperty('LINEA_RPC_URL');
      expect(SERVICE_CONFIG).toHaveProperty('LINEA_CHAIN_ID');
      expect(SERVICE_CONFIG).toHaveProperty('LINEA_TOKEN_CONTRACT');
      expect(SERVICE_CONFIG).toHaveProperty('LINEA_CLAIM_CONTRACT');
      expect(SERVICE_CONFIG).toHaveProperty('ALLOCATION_API_URL');
      expect(SERVICE_CONFIG).toHaveProperty('GAS_SETTINGS');
      expect(SERVICE_CONFIG).toHaveProperty('CLAIM_CONFIG');
      expect(SERVICE_CONFIG).toHaveProperty('BUNDLE_CONFIG');
    });

    it('should have valid data types for numeric configs', async () => {
      const { SERVICE_CONFIG } = await import('../../config');

      expect(typeof SERVICE_CONFIG.LINEA_CHAIN_ID).toBe('number');
      expect(typeof SERVICE_CONFIG.GAS_SETTINGS.BASE_GAS_PRICE_GWEI).toBe('number');
      expect(typeof SERVICE_CONFIG.GAS_SETTINGS.GAS_MULTIPLIER).toBe('number');
      expect(typeof SERVICE_CONFIG.GAS_SETTINGS.MAX_GAS_PRICE_GWEI).toBe('number');
      expect(typeof SERVICE_CONFIG.GAS_SETTINGS.MANUAL_GAS_PRICE_GWEI).toBe('number');
      expect(typeof SERVICE_CONFIG.BUNDLE_CONFIG.VALIDITY_SECONDS).toBe('number');
      expect(typeof SERVICE_CONFIG.BUNDLE_CONFIG.MAX_RETRY_ATTEMPTS).toBe('number');
      expect(typeof SERVICE_CONFIG.BUNDLE_CONFIG.RETRY_DELAY_MS).toBe('number');
    });

    it('should have valid data types for boolean configs', async () => {
      const { SERVICE_CONFIG } = await import('../../config');

      expect(typeof SERVICE_CONFIG.ENABLE_AUTO_ALLOCATION).toBe('boolean');
      expect(typeof SERVICE_CONFIG.GAS_SETTINGS.FORCE_MANUAL_GAS).toBe('boolean');
      expect(typeof SERVICE_CONFIG.CLAIM_CONFIG.USE_AUTO_DETECTION).toBe('boolean');
      expect(typeof SERVICE_CONFIG.CLAIM_CONFIG.USE_USER_INPUT_AMOUNT).toBe('boolean');
      expect(typeof SERVICE_CONFIG.CLAIM_CONFIG.USE_CLAIM_ALL_MODE).toBe('boolean');
      expect(typeof SERVICE_CONFIG.CLAIM_CONFIG.USE_MERKLE_PROOF_MODE).toBe('boolean');
      expect(typeof SERVICE_CONFIG.DEBUG_LOGGING).toBe('boolean');
      expect(typeof SERVICE_CONFIG.TEST_MODE).toBe('boolean');
    });

    it('should have gas settings structure', async () => {
      const { SERVICE_CONFIG } = await import('../../config');

      expect(SERVICE_CONFIG.GAS_SETTINGS).toHaveProperty('BASE_GAS_PRICE_GWEI');
      expect(SERVICE_CONFIG.GAS_SETTINGS).toHaveProperty('GAS_MULTIPLIER');
      expect(SERVICE_CONFIG.GAS_SETTINGS).toHaveProperty('MAX_GAS_PRICE_GWEI');
      expect(SERVICE_CONFIG.GAS_SETTINGS).toHaveProperty('FORCE_MANUAL_GAS');
      expect(SERVICE_CONFIG.GAS_SETTINGS).toHaveProperty('MANUAL_GAS_PRICE_GWEI');
    });

    it('should have claim config structure', async () => {
      const { SERVICE_CONFIG } = await import('../../config');

      expect(SERVICE_CONFIG.CLAIM_CONFIG).toHaveProperty('USE_AUTO_DETECTION');
      expect(SERVICE_CONFIG.CLAIM_CONFIG).toHaveProperty('USE_USER_INPUT_AMOUNT');
      expect(SERVICE_CONFIG.CLAIM_CONFIG).toHaveProperty('USE_CLAIM_ALL_MODE');
      expect(SERVICE_CONFIG.CLAIM_CONFIG).toHaveProperty('USE_MERKLE_PROOF_MODE');
      expect(SERVICE_CONFIG.CLAIM_CONFIG).toHaveProperty('SIMPLE_CLAIM_SIGNATURE');
      expect(SERVICE_CONFIG.CLAIM_CONFIG).toHaveProperty('MERKLE_CLAIM_SIGNATURE');
      expect(SERVICE_CONFIG.CLAIM_CONFIG).toHaveProperty('CLAIM_ALL_SIGNATURE');
      expect(SERVICE_CONFIG.CLAIM_CONFIG).toHaveProperty('MAX_CLAIM_AMOUNT');
      expect(SERVICE_CONFIG.CLAIM_CONFIG).toHaveProperty('DEFAULT_CLAIM_AMOUNT');
    });

    it('should have bundle config structure', async () => {
      const { SERVICE_CONFIG } = await import('../../config');

      expect(SERVICE_CONFIG.BUNDLE_CONFIG).toHaveProperty('VALIDITY_SECONDS');
      expect(SERVICE_CONFIG.BUNDLE_CONFIG).toHaveProperty('MAX_RETRY_ATTEMPTS');
      expect(SERVICE_CONFIG.BUNDLE_CONFIG).toHaveProperty('RETRY_DELAY_MS');
    });

    it('should include all function signatures', async () => {
      const { SERVICE_CONFIG } = await import('../../config');

      expect(SERVICE_CONFIG.CLAIM_CONFIG.SIMPLE_CLAIM_SIGNATURE).toBe('claim(uint256 amount)');
      expect(SERVICE_CONFIG.CLAIM_CONFIG.MERKLE_CLAIM_SIGNATURE).toBe('function claimERC20(address _token, address _receiver, uint256 _quantity, bytes32[] calldata _proofs)');
      expect(SERVICE_CONFIG.CLAIM_CONFIG.CLAIM_ALL_SIGNATURE).toBe('claimAll()');
    });
  });

  describe('ALLOCATION_PROVIDERS configuration', () => {
    it('should configure allocation providers correctly', async () => {
      const { ALLOCATION_PROVIDERS, SERVICE_CONFIG } = await import('../../config');

      expect(ALLOCATION_PROVIDERS.USER_INPUT.enabled).toBe(true);
      expect(ALLOCATION_PROVIDERS.USER_INPUT.validation.min).toBe('0.1');
      expect(ALLOCATION_PROVIDERS.USER_INPUT.validation.max).toBe(SERVICE_CONFIG.CLAIM_CONFIG.MAX_CLAIM_AMOUNT);
    });
  });

  describe('Default values', () => {
    it('should have reasonable default values', async () => {
      const { SERVICE_CONFIG } = await import('../../config');

      // Check that numeric values are within reasonable ranges
      expect(SERVICE_CONFIG.LINEA_CHAIN_ID).toBeGreaterThan(0);
      expect(SERVICE_CONFIG.GAS_SETTINGS.BASE_GAS_PRICE_GWEI).toBeGreaterThan(0);
      expect(SERVICE_CONFIG.GAS_SETTINGS.GAS_MULTIPLIER).toBeGreaterThan(1);
      expect(SERVICE_CONFIG.GAS_SETTINGS.MAX_GAS_PRICE_GWEI).toBeGreaterThan(SERVICE_CONFIG.GAS_SETTINGS.BASE_GAS_PRICE_GWEI);
      expect(SERVICE_CONFIG.BUNDLE_CONFIG.VALIDITY_SECONDS).toBeGreaterThan(0);
      expect(SERVICE_CONFIG.BUNDLE_CONFIG.MAX_RETRY_ATTEMPTS).toBeGreaterThan(0);
      expect(SERVICE_CONFIG.BUNDLE_CONFIG.RETRY_DELAY_MS).toBe(2000);
    });

    it('should have valid URL formats', async () => {
      const { SERVICE_CONFIG } = await import('../../config');

      if (SERVICE_CONFIG.LINEA_RPC_URL) {
        expect(SERVICE_CONFIG.LINEA_RPC_URL).toMatch(/^https?:\/\//);
      }
      
      if (SERVICE_CONFIG.ALLOCATION_API_URL) {
        expect(SERVICE_CONFIG.ALLOCATION_API_URL).toMatch(/^https?:\/\//);
      }
    });
  });
});