import assert from 'node:assert/strict';
import fs from 'node:fs';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const r=j('content/customer-experience-rebuild/r12r4b/cross/review/cross-w25-human-review-results-v1.json');
const a=j('content/customer-experience-rebuild/r12r4b/cross/acceptance/cross-w25-human-admission-v1.json');
assert.equal(r.status,'HUMAN_ACCEPTED_36_OF_36');
assert.deepEqual(r.summary,{accepted:36,rejected:0,pending:0});
assert.equal(r.productionAdmissionAllowed,true);
assert.equal(r.results.length,36);
assert.equal(r.humanDecisionEvidence?.type,'EXPLICIT_FOUNDER_DECLARATION_IN_CHAT');
assert.equal(r.humanDecisionEvidence?.machineGeneratedDecision,false);
for(const x of r.results){assert.equal(x.decision,'ACCEPT',x.caseId);for(const [k,v] of Object.entries(x.criteria))assert.equal(v,'ACCEPT',`${x.caseId}:${k}`)}
assert.equal(a.status,'HUMAN_ACCEPTED_36_OF_36');
assert.deepEqual(a.actual,{accepted:36,rejected:0,pending:0,total:36});
assert.equal(a.productionAdmissionAllowed,true);
assert.equal(a.humanDecisionEvidence?.machineMaySetHumanAcceptance,false);
console.log('✓ R2-W25 Cross human admission passed: 36/36 accepted, 0 rejected, 0 pending; explicit founder declaration recorded and machine acceptance cannot substitute for it.');
