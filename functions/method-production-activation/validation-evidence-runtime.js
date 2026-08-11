import crypto from 'node:crypto';

export const MPA_ERROR_CODES = Object.freeze([
  'INPUT_INVALID','INPUT_INCOMPLETE','PRECISION_LIMIT','DATA_AUTHORITY_UNAVAILABLE',
  'CALCULATION_FAILED','PROJECTION_FAILED','METHOD_NOT_ELIGIBLE','PROFESSIONAL_REQUIRED'
]);

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function canonicalDigest(value) {
  return crypto.createHash('sha256').update(stable(value), 'utf8').digest('hex');
}
export function createMpaError(code, message, details = {}) {
  if (!MPA_ERROR_CODES.includes(code)) throw new TypeError(`Unknown MPA error code: ${code}`);
  const error = new Error(message || code);
  error.name = 'MpaMethodError'; error.code = code; error.details = Object.freeze({ ...details });
  return error;
}
export function assertNoPseudoResult(errorOrResult) {
  if (!errorOrResult || typeof errorOrResult !== 'object') throw createMpaError('CALCULATION_FAILED','Missing calculation outcome.');
  if (errorOrResult.errorCode) {
    if (!MPA_ERROR_CODES.includes(errorOrResult.errorCode)) throw createMpaError('CALCULATION_FAILED','Unknown error taxonomy.');
    if ('result' in errorOrResult && errorOrResult.result != null) throw createMpaError('CALCULATION_FAILED','Pseudo result is forbidden when an MPA error exists.');
  }
  return true;
}
export function validateFixtureCorpus(corpus) {
  const requiredMethods = ['NUMEROLOGY','ASTROLOGY','BAZI','HUMAN_DESIGN'];
  const requiredTypes = ['valid','edge','invalid','regression'];
  for (const methodCode of requiredMethods) {
    const methodFixtures = corpus.fixtures.filter(x => x.methodCode === methodCode);
    for (const type of requiredTypes) if (!methodFixtures.some(x => x.fixtureType === type)) throw new Error(`MPA_FIXTURE_TYPE_MISSING:${methodCode}:${type}`);
  }
  return Object.freeze({ deterministic: true, corpusDigest: canonicalDigest(corpus), methods: Object.freeze(requiredMethods) });
}
export function evaluateValidationEvidence({ methodCode, checks, authorityReady, comparisonReady }) {
  const required = ['determinism','schema','policy','boundary','reference_comparison'];
  const blockingReasons = [];
  for (const check of required) if (checks?.[check] !== true) blockingReasons.push(`CHECK_FAILED_OR_UNRESOLVED:${check}`);
  if (authorityReady !== true) blockingReasons.push('DATA_AUTHORITY_NOT_PRODUCTION_READY');
  if (comparisonReady !== true) blockingReasons.push('CROSS_IMPLEMENTATION_COMPARISON_NOT_PRODUCTION_READY');
  return Object.freeze({ methodCode, validationVersion: '1.0.0', checks: Object.freeze({ ...checks }), decision: blockingReasons.length ? 'VALIDATION_BLOCKED' : 'VALIDATION_PASS_PRODUCTION_STILL_BLOCKED', blockingReasons: Object.freeze(blockingReasons), productionEligibilityChanged: false });
}
