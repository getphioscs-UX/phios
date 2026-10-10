import assert from 'node:assert/strict';
import fs from 'node:fs';
import { executeMcd4Request, toMcd4ApiProjection } from '../functions/method-client-delivery/execution-runtime.js';
import { onRequestPost } from '../functions/api/method-execute.js';

const json = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const contract = json('content/professional/method-client-delivery/contracts/mcd-4-execution-contract-v1.json');
const acceptance = json('content/professional/method-client-delivery/acceptance/mcd-4-execution-acceptance-v1.json');
const reasons = json('content/professional/method-client-delivery/registries/mcd-4-reason-code-registry-v1.json');

const canonicalInput = Object.freeze({
  birthDate: '1990-01-15',
  birthTime: '12:30:00',
  birthPlace: Object.freeze({ displayName: 'Singapore', countryCode: 'SG', latitude: 1.3521, longitude: 103.8198 }),
  timezone: Object.freeze({ iana: 'Asia/Singapore', utcOffsetAtBirth: '+08:00', source: 'PINNED_IANA_TZDB', confidence: 'HIGH' }),
  timeAccuracy: 'EXACT',
  locale: 'en',
  consent: Object.freeze({ recordId: 'CONSENT-MCD4-CHECK', granted: true }),
  inputVersion: 'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'
});
const request = (methodCode, methodVersion, capability = 'CALCULATION', overrides = {}) => ({
  schemaVersion: 'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',
  methodCode,
  methodVersion,
  capability,
  purposeCode: 'MCD4_CHECK',
  canonicalInput,
  executionParameters: {},
  consentRecordId: 'CONSENT-MCD4-CHECK',
  requestId: `REQ-${methodCode}`,
  ...overrides
});

assert.equal(contract.status, 'ACTIVE_MPA_FIRST_PARTIAL_EXECUTION_NO_CANONICAL_PROJECTION');
assert.equal(contract.sequence[1], 'MPA_EVALUATION');
assert.equal(contract.sequence[2], 'CANONICAL_INPUT_EVALUATION');
assert.equal(reasons.rules.blockedAuthorityReasonsMayNotBeDowngradedToWarnings, true);

const hdr = await executeMcd4Request(request('HUMAN_DESIGN', '1.0.0'));
assert.equal(hdr.executionStatus, 'BLOCKED_BY_MPA');
assert.equal(hdr.inputEvaluation, null);
assert.equal(hdr.governance.coreInvoked, false);
assert.equal(hdr.governance.hdrFailClosed, true);

const invalid = await executeMcd4Request(request('NUMEROLOGY', '0.1.0-candidate', 'CALCULATION', { canonicalInput: {} }));
assert.equal(invalid.executionStatus, 'INPUT_BLOCKED');
assert.equal(invalid.governance.coreInvoked, false);

const ast = await executeMcd4Request(request('ASTROLOGY', '0.1.0'));
assert.equal(ast.executionStatus, 'PARTIAL_EXECUTION');
assert(ast.reasonCodes.includes('AST_GOVERNED_ASTRONOMY_ENGINE_ADAPTER_NOT_MATERIALIZED'));
assert.equal(ast.governance.canonicalProjectionCreated, false);

const bzrInput = { ...canonicalInput, birthTime: null, timeAccuracy: 'UNKNOWN' };
const bzr = await executeMcd4Request(request('BAZI', '0.1.0', 'CALCULATION', { canonicalInput: bzrInput }));
assert.equal(bzr.executionStatus, 'PARTIAL_EXECUTION');
assert(bzr.reasonCodes.includes('BZR_UNKNOWN_TIME_DEGRADE_TO_THREE_PILLARS'));

const num = await executeMcd4Request(request('NUMEROLOGY', '0.1.0-candidate', 'CALCULATION', { executionParameters: { targetDate: '2026-08-14' } }));
assert.equal(num.executionStatus, 'EXECUTED_BOUND_SCOPE');
assert(num.reasonCodes.includes('NUM_BIRTH_NUMBER_EXECUTED'));
assert(num.reasonCodes.includes('NUM_NUMBER_STRUCTURE_EXECUTED'));
assert(num.reasonCodes.includes('NUM_CYCLE_EXECUTED'));
const projected = toMcd4ApiProjection(num);
assert.equal(Object.hasOwn(projected.partialExecution, 'coreResults'), false);
assert.equal(projected.partialExecution.coreResultsSuppressedUntilMcd5, true);
assert.equal(projected.partialExecution.coreResultRefs.length, 3);

const apiRequest = new Request('https://phios.local/api/method-execute', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(request('NUMEROLOGY', '0.1.0-candidate', 'CALCULATION', { executionParameters: { targetDate: '2026-08-14' } }))
});
const apiResponse = await onRequestPost({ request: apiRequest });
const apiPayload = await apiResponse.json();
assert.equal(apiResponse.status, 200);
assert.equal(apiPayload.ok, true);
assert.equal(Object.hasOwn(apiPayload.result.partialExecution, 'coreResults'), false);
assert.equal(apiPayload.result.governance.interpretationCreated, false);
assert.equal(apiPayload.result.governance.professionalJudgmentCreated, false);

assert.equal(acceptance.status, 'ACCEPTED_MPA_FIRST_PARTIAL_EXECUTION_HDR_FAIL_CLOSED');
for (const key of ['mpaEvaluationFirst', 'mpaRemainsSoleProductionDispatchAuthority', 'apiSuppressesRawCoreResults', 'hdrMpaFailClosedBeforeInputEvaluation', 'canonicalProjectionCreated']) {
  assert.equal(acceptance.acceptedFacts[key], key === 'canonicalProjectionCreated' ? false : true, key);
}

console.log('✓ MCD-4 MPA-first partial execution passed.');
console.log('  NUM bound-scope calculation executes with raw Core results suppressed; AST/BZR defer explicitly and HDR fails closed before input evaluation.');
