import { assertZiWeiPolicyConsumable } from './policy-gate.js';
export function buildZiWeiCalendarRepresentation(input, options = {}) {
  assertZiWeiPolicyConsumable(options.policy);
  const error = new Error('Zi Wei calendar conversion algorithm has not yet been admitted by a post-freeze implementation successor.');
  error.code = 'ZWR_CALENDAR_ALGORITHM_NOT_AUTHORIZED';
  error.inputPreserved = input ?? null;
  throw error;
}
