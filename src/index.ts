export { LXPRescueService } from './rescue-service';
export { LXPDetector } from './lxp-detector';
export { Validator, ValidationError } from './validator';
export * from './types';

import { LXPRescueService } from './rescue-service';
import { RescueConfig } from './types';

export async function rescueLXP(
  config: RescueConfig, 
  userAmount?: string
) {
  const service = new LXPRescueService();
  return await service.rescueTokens(config, userAmount);
}

export async function estimateRescueCost(
  compromisedAddress: string,
  userAmount?: string
) {
  const service = new LXPRescueService();
  return await service.estimateGas(compromisedAddress, userAmount);
}