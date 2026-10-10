/*
 * Canonical PWS-I9 import path.
 *
 * The implementation lives in the browser-neutral shared core so PJA-W2 can
 * project the same frozen rules without copying or weakening them.
 */
export {
  evaluateQuestionRoute,
  ROUTING_BOUNDARIES
} from '../../../assets/js/modules/pws-i9-rule-engine-core.js';
