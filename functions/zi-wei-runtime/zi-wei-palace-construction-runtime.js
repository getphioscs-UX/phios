import { assertZiWeiPolicyConsumable } from './policy-gate.js';
export function buildZiWeiPalaceStructure(calendarRepresentation, options = {}) {
  assertZiWeiPolicyConsumable(options.policy);
  const error = new Error('Zi Wei palace construction algorithm has not yet been admitted by a post-freeze implementation successor.');
  error.code = 'ZWR_PALACE_ALGORITHM_NOT_AUTHORIZED';
  error.calendarRepresentationPreserved = calendarRepresentation ?? null;
  throw error;
}
