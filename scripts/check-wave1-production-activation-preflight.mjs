import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readJson = async rel => JSON.parse(await fs.readFile(path.join(root, rel), 'utf8'));

const expected = [
  ['KN-PREFACE-004', 'ARTICLE', 'PJA', 'content/knowledge/editorial/c3/assessments/kn-preface-004-production-readiness.json'],
  ['KN-B1-P1-003', 'FRAGMENT', 'PJA', 'content/knowledge/editorial/c3/assessments/kn-b1-p1-003-production-readiness.json'],
  ['KN-B1-P4-003', 'FIGURE', 'CAR', 'content/knowledge/editorial/c3/assessments/kn-b1-p4-003-production-readiness.json'],
  ['KN-B1-P4-004', 'MULTI_ASSET', 'CAR', 'content/knowledge/editorial/c3/assessments/kn-b1-p4-004-production-readiness.json']
];

const preflight = await readJson('content/knowledge/production-planning/activation/wave1-production-activation-preflight-v1.json');
const queue = await readJson('content/knowledge/production-planning/review/wave1-c2-human-review-queue-v1.json');
const gate = await readJson('content/knowledge/production-planning/contracts/wave1-production-activation-gate-v1.json');
const humanDecisions = await readJson('content/knowledge/production-planning/registries/kpp-human-production-decision-registry-v1.json');
const planFreeze = await readJson('content/knowledge/production-planning/registries/kpp-production-plan-freeze-registry-v1.json');
const waveRegistry = await readJson('content/knowledge/production-planning/registries/kpp-production-wave-registry-v2.json');
const pjaHandoffs = await readJson('content/knowledge/production-planning/registries/kpp-pja-handoff-registry-v1.json');
const carHandoffs = await readJson('content/knowledge/production-planning/registries/kpp-car-handoff-registry-v1.json');

assert.equal(gate.failClosed, true);
assert.equal(preflight.status, 'BLOCKED_PENDING_C2_HUMAN_FREEZE');
assert.equal(preflight.gateSnapshot.selectedItemCount, 4);
assert.equal(queue.items.length, 4);

for (const [nodeCode, role, target, readinessRef] of expected) {
  const selected = preflight.selectedExecutionScope.find(x => x.nodeCode === nodeCode);
  assert.ok(selected, `Missing preflight item ${nodeCode}`);
  assert.equal(selected.productionRole, role);
  assert.equal(selected.dispatchTarget, target);
  const assessment = await readJson(readinessRef);
  assert.equal(assessment.nodeCode, nodeCode);
  assert.equal(assessment.productionReady, false, `${nodeCode} unexpectedly production ready; preflight must be regenerated`);
  assert.ok(assessment.blocking.includes('C2_THESIS_BOUNDARY_NOT_FROZEN'), `${nodeCode} missing expected C2 blocker`);
  const q = queue.items.find(x => x.nodeCode === nodeCode);
  assert.ok(q);
  assert.equal(q.status, 'HUMAN_REVIEW_REQUIRED');
}

assert.equal(preflight.gateSnapshot.productionReadyCount, 0);
assert.equal(preflight.gateSnapshot.blockedCount, 4);
assert.equal(preflight.gateSnapshot.humanProductionDecisionAllowed, false);
assert.equal(preflight.gateSnapshot.productionPlanFreezeAllowed, false);
assert.equal(preflight.gateSnapshot.productionWaveFreezeAllowed, false);
assert.equal(preflight.gateSnapshot.dispatchAllowed, false);

assert.equal(humanDecisions.decisions.length, 0, 'Human production decisions must remain empty while C2 is blocked');
assert.equal(planFreeze.plans.length, 0, 'Production plan freeze must remain empty while C2 is blocked');
assert.equal(waveRegistry.waves.length, 0, 'KPP production wave v2 must remain empty while C2 is blocked');
assert.equal(pjaHandoffs.handoffs.length, 0, 'PJA handoff must remain empty while C2 is blocked');
assert.equal(carHandoffs.handoffs.length, 0, 'CAR handoff must remain empty while C2 is blocked');

console.log('✓ Wave 1 Production Activation Preflight passed.');
console.log('✓ 4/4 selected items remain blocked by PJA C2 thesis/boundary freeze; no production authority was fabricated.');
console.log('✓ Resolve the Wave 1 C2 Human Editorial Review Queue before Human Production Decision / Frozen Plan / Wave dispatch.');
