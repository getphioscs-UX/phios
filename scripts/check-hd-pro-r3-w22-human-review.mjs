import assert from 'node:assert/strict';import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const g=spawnSync(process.execPath,['scripts/generate-hd-pro-r3-w22-human-review-pack.mjs','--check'],{stdio:'inherit'});assert.equal(g.status,0);
const cases=read(`${ROOT}/review/HD-PRO-R3-W22-human-review-cases-v1.json`);const results=read(`${ROOT}/review/HD-PRO-R3-W22-human-review-results-v1.json`);const status=read(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v19.json`);const prev=read(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v18.json`);
assert.equal(cases.status,'HUMAN_REVIEW_PENDING_24_OF_24');assert.equal(cases.r2AcceptanceInheritanceAllowed,false);assert.equal(cases.cases.length,24);assert.deepEqual(cases.groups,{CORE_COMPOSITION:8,CHANNEL_CENTER_DEFINITION_HEAVY:8,VARIABLE_PHS_ADVANCED:4,SPARSE_EDGE_VARIANT:4});
for(const c of cases.cases){assert.equal(c.reviewCriteria.length,9);assert(c.primaryFindings.length>=3);assert(c.realityQuestions.length>=4);}
assert.equal(results.r2AcceptanceInherited,false);assert.equal(results.status,'HUMAN_REVIEW_PENDING_24_OF_24');assert.deepEqual(results.summary,{accepted:0,rejected:0,pending:24});assert(results.decisions.every(x=>x.decision==='PENDING'));
assert.equal(prev.updatedByWork,'HD-PRO-R3-W21');assert.equal(status.updatedByWork,'HD-PRO-R3-W22');assert.equal(status.aggregate.r3HumanReviewAcceptedCases,0);assert.equal(status.aggregate.r3HumanReviewPendingCases,24);assert.equal(status.aggregate.r2HumanAcceptanceInheritedByR3,false);assert.equal(status.aggregate.r3CustomerCutoverAllowed,false);
console.log('✓ HD-PRO-R3-W22 new human review pack passed structural checks: 24 cases are ready and remain PENDING.');
console.log('  R2 24/24 acceptance is explicitly not inherited; R3 customer publication remains blocked until this new review is actually accepted.');
