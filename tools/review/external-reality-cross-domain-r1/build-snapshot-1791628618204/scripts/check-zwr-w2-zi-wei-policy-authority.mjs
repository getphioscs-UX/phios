import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const policyPath = path.join(
  root,
  'content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json'
);

const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));

const expectedPolicies = [
  ['CALENDAR_CONVENTION', 'calendar convention'],
  ['LUNAR_CONVERSION', 'lunar conversion'],
  ['LEAP_MONTH_POLICY', 'leap month policy'],
  ['DAY_BOUNDARY', 'day boundary'],
  ['BIRTH_HOUR_BOUNDARY', 'birth-hour boundary'],
  ['PALACE_CONSTRUCTION', 'palace construction'],
  ['MAIN_STAR_SYSTEM', 'main-star system'],
  ['AUXILIARY_STAR_SCOPE', 'auxiliary-star scope'],
  ['TRANSFORMATION_SCOPE', 'transformation scope'],
  ['DYNAMIC_PERIOD_SCOPE', 'dynamic-period scope']
];

assert.equal(policy.schemaVersion, 'PHI-OS-ZI-WEI-CALCULATION-POLICY-v1.0.0');
assert.equal(policy.phase, 'ZWR');
assert.equal(policy.work, 'ZWR-W2');
assert.match(policy.baselineCommit, /^[0-9a-f]{40}$/);
assert.equal(policy.authorityCode, 'ZI_WEI_CALCULATION_POLICY');
assert.equal(policy.authorityVersion, '1.0.0');
assert.equal(policy.authorityType, 'CALCULATION_POLICY_AUTHORITY');
assert.equal(policy.methodCode, 'ZI_WEI_DOU_SHU');
assert.equal(policy.runtimeCode, 'ZI_WEI_RUNTIME');

assert.equal(policy.freezeGate.mode, 'HUMAN_ONLY');
assert.equal(policy.freezeGate.requiredDecisionCount, 10);
assert.equal(policy.freezeGate.automatedSelectionAllowed, false);
assert.equal(policy.freezeGate.externalSourceInferenceAllowed, false);
assert.equal(policy.freezeGate.failClosed, true);
assert.equal(policy.freezeGate.calculationRuntimeActivationGranted, false);
assert.equal(policy.freezeGate.productionActivationGranted, false);

for (const [key, value] of Object.entries(policy.humanFreezeRequirements)) {
  assert.equal(value, true, `human freeze requirement must stay true: ${key}`);
}

assert.equal(policy.requiredPolicies.length, expectedPolicies.length);
const seen = new Set();
let frozenCount = 0;

for (let i = 0; i < expectedPolicies.length; i += 1) {
  const entry = policy.requiredPolicies[i];
  const [expectedCode, expectedLabel] = expectedPolicies[i];

  assert.equal(entry.policyCode, expectedCode, `policy order/code drift at index ${i}`);
  assert.equal(entry.label, expectedLabel, `policy label drift for ${expectedCode}`);
  assert.equal(entry.humanFreezeRequired, true, `${expectedCode} must require Human freeze`);
  assert.ok(entry.decisionScope && typeof entry.decisionScope === 'string');
  assert.ok(!seen.has(entry.policyCode), `duplicate policyCode: ${entry.policyCode}`);
  seen.add(entry.policyCode);

  if (entry.frozen) {
    frozenCount += 1;
    assert.equal(entry.status, 'HUMAN_FROZEN', `${expectedCode}: frozen status mismatch`);
    assert.ok(entry.decision !== null, `${expectedCode}: frozen decision is required`);
    if (typeof entry.decision === 'string') {
      assert.ok(entry.decision.trim().length > 0, `${expectedCode}: frozen decision cannot be empty`);
    }
    assert.ok(typeof entry.rationale === 'string' && entry.rationale.trim().length > 0,
      `${expectedCode}: rationale required before freeze`);
    assert.ok(Array.isArray(entry.evidenceRefs) && entry.evidenceRefs.length > 0,
      `${expectedCode}: at least one evidenceRef required before freeze`);
    assert.ok(entry.evidenceRefs.every((ref) => typeof ref === 'string' && ref.trim().length > 0),
      `${expectedCode}: evidenceRefs must be non-empty strings`);
    assert.ok(typeof entry.approver === 'string' && entry.approver.trim().length > 0,
      `${expectedCode}: approver required before freeze`);
    assert.ok(typeof entry.approvedAt === 'string' && !Number.isNaN(Date.parse(entry.approvedAt)),
      `${expectedCode}: approvedAt must be an ISO-compatible timestamp`);
  } else {
    assert.equal(entry.status, 'PENDING_HUMAN_FREEZE', `${expectedCode}: pending status mismatch`);
    assert.equal(entry.decision, null, `${expectedCode}: unapproved decision must remain null`);
    assert.equal(entry.rationale, null, `${expectedCode}: unapproved rationale must remain null`);
    assert.deepEqual(entry.evidenceRefs, [], `${expectedCode}: unapproved evidenceRefs must remain empty`);
    assert.equal(entry.approver, null, `${expectedCode}: unapproved approver must remain null`);
    assert.equal(entry.approvedAt, null, `${expectedCode}: unapproved approvedAt must remain null`);
  }
}

assert.equal(policy.freezeGate.frozenDecisionCount, frozenCount,
  'freezeGate.frozenDecisionCount must equal actual frozen policies');
assert.equal(policy.freezeGate.allRequiredDecisionsFrozen, frozenCount === expectedPolicies.length,
  'freezeGate.allRequiredDecisionsFrozen drift');

if (frozenCount === expectedPolicies.length) {
  assert.equal(policy.status, 'HUMAN_FROZEN');
  assert.equal(policy.freezeGate.state, 'HUMAN_FROZEN');
  assert.equal(policy.freezeGate.downstreamPolicyConsumptionAllowed, true);
} else {
  assert.equal(policy.status, 'PENDING_HUMAN_FREEZE');
  assert.equal(policy.freezeGate.state, 'BLOCKED_PENDING_HUMAN_FREEZE');
  assert.equal(policy.freezeGate.downstreamPolicyConsumptionAllowed, false);
}

for (const key of [
  'singleZiWeiPolicyAuthority',
  'noSilentDefaults',
  'noCrossMethodPolicyInheritance',
  'noAISchoolSelection',
  'noExternalWebsiteRuleSynthesis',
  'noCalculationBeforeHumanFreeze',
  'calculationPolicyIsNotInterpretation',
  'policyFreezeDoesNotGrantProduction',
  'partialFreezeDoesNotOpenGate'
]) {
  assert.equal(policy.invariants[key], true, `required invariant drift: ${key}`);
}

assert.equal(policy.successorPolicy.inPlaceMutationAfterFreezeAllowed, false);
assert.equal(policy.successorPolicy.futureRuleChangeRequiresVersionedSuccessor, true);
assert.equal(policy.successorPolicy.predecessorRemainsHistoricalAuthority, true);

console.log(`✓ ZWR-W2 Zi Wei Policy Authority structure passed (${frozenCount}/10 Human-frozen).`);
console.log(
  frozenCount === 10
    ? '  Human freeze gate is closed and downstream policy consumption is allowed; Production remains ungranted.'
    : '  Human freeze gate remains intentionally blocked; no Zi Wei calculation runtime activation is granted.'
);
