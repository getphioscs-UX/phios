import assert from 'node:assert/strict';import fs from 'node:fs';
const r=JSON.parse(fs.readFileSync('content/customer-experience-rebuild/r12r4b/cross/review/cross-w25-human-review-results-v1.json','utf8'));
assert.equal(r.status,'HUMAN_ACCEPTED_36_OF_36');assert.deepEqual(r.summary,{accepted:36,rejected:0,pending:0});assert.equal(r.productionAdmissionAllowed,true);assert.equal(r.results.length,36);for(const x of r.results){assert.equal(x.decision,'ACCEPT',x.caseId);for(const [k,v] of Object.entries(x.criteria))assert.equal(v,'ACCEPT',`${x.caseId}:${k}`)}
console.log('✓ R2-W25 Cross human acceptance passed: 36/36 accepted, 0 rejected, 0 pending.');
