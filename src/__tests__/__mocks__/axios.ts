import { vi } from 'vitest';

const mockAxios = {
  post: vi.fn(),
  get: vi.fn(),
  defaults: {
    headers: {},
  },
};

export default mockAxios;

vi.mock('axios', () => ({
  default: mockAxios,
}));