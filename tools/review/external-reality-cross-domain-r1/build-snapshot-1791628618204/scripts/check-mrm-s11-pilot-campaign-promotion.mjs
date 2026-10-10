import assert from 'node:assert/strict';
import {readJson,sha256,emOrdinal} from './lib/runtime-maturity/pilot-campaign-lib.mjs';
const policy=readJson('content/runtime-maturity/promotion/em3-pilot-promotion-policy-v2.json');
const candidates=readJson('content/runtime-maturity/pilot/campaign/first-batch-pilot-candidate-registry-v1.json');
const registry=readJson('content/runtime-maturity/pilot/pilot-case-registry-v2.json');
const evals=readJson('content/runtime-maturity/pilot/campaign/pilot-promotion-evaluation-registry-v1.json');
const matrix=readJson('content/runtime-maturity/matrices/master-evidence-maturity-matrix-v1.5.json');
const acceptance=readJson('content/runtime-maturity/pilot/campaign/pilot-campaign-acceptance-v1.json');
assert.equal(policy.supersedes.sha256,sha256(policy.supersedes.path));
assert.equal(policy.rules.priorEm2Required,true); assert.equal(policy.rules.wholeProductPromotionForbidden,true); assert.equal(policy.rules.fixtureInsufficient,true);
const em2=new Map(matrix.records.filter(r=>r.evaluatedEM==='EM-2').map(r=>[r.capabilityCode,r]));
for(const c of candidates.candidates) for(const code of c.candidatePromotionCapabilities){ assert.ok(em2.has(code),`campaign promotion target must already be EM-2: ${code}`); }
assert.equal(registry.counts.qualifyingPilotCases,0); assert.equal(evals.counts.capabilitiesPromotedToEM3,0); assert.equal(evals.matrixSuccessorRequiredNow,false);
assert.equal(matrix.records.some(r=>emOrdinal(r.evaluatedEM)>=3),false); assert.equal(acceptance.currentCounts.em3Promotions,0); assert.equal(acceptance.status,'READY_FOR_FIRST_REAL_CASE_EXECUTION_NOT_PILOT_VERIFIED');
console.log('✓ MRM-S11 Pilot Campaign EM-3 promotion boundary passed.');
console.log('  Campaign is execution-ready; EM-3 remains 0 until an admitted real governed case completes an exact vertical slice for an already-EM-2 capability.');
