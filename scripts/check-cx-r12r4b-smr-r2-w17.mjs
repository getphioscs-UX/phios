import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const r=read('content/customer-experience-rebuild/r12r4b/smr-r2/review/smr-r2-w17-five-benchmark-human-review-results-v1.json');
const a=read('content/customer-experience-rebuild/r12r4b/smr-r2/admission/smr-r2-w17-five-benchmark-human-admission-v1.json');
assert.equal(r.workCode,'R2-W17');assert.deepEqual(r.summary,{accepted:5,rejected:0,pending:0});assert.equal(r.results.length,5);assert.equal(new Set(r.results.map(x=>x.methodId)).size,5);for(const x of r.results)assert.equal(x.decision,'HUMAN_ACCEPTED');assert.equal(r.bulkCampaignAllowed,true);assert.equal(r.liveCustomerIndividuallyHumanReviewed,false);
assert.equal(a.status,'HUMAN_ACCEPTED_5_OF_5');assert.deepEqual(a.actual,{accepted:5,rejected:0,pending:0});assert.equal(a.bulkCampaignAllowed,true);assert.equal(a.productionCutoverAllowed,false);assert.equal(a.reasonProductionStillBlocked,'R2_W18_AND_R2_W19_REQUIRED');
console.log('✓ R2-W17 founder benchmark human acceptance admitted: 5/5 accepted; W18 bulk diversity campaign allowed.');
