import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const readJson=async f=>JSON.parse(await fs.readFile(path.join(root,f),'utf8'));
const base='content/knowledge/authoring/extensions/legacy-supporting-source';
const q=await readJson(`${base}/review/legacy-unified-language-human-review-queue-v1.json`);
const reg=await readJson(`${base}/review-resolution/legacy-human-review-resolution-registry-v1.json`);
const policy=await readJson(`${base}/review-resolution/legacy-human-review-recommendation-policy-v1.json`);
const contract=await readJson(`${base}/contracts/legacy-human-review-resolution-contract-v1.json`);
const acceptance=await readJson(`${base}/acceptance/kau-e1r-human-review-resolution-runtime-acceptance-v1.json`);
assert.equal(q.entries.length,185,'KAU_E1R_REQUIRES_185_E1_REVIEWS');
assert.equal(reg.batchCount,6,'KAU_E1R_BATCH_COUNT_INVALID');
assert.equal(reg.reviewCount,185,'KAU_E1R_REVIEW_COUNT_INVALID');
assert.equal(policy.authority,'DECISION_SUPPORT_ONLY');
assert.equal(contract.rules.recommendationsAreAdvisoryOnly,true);
const seen=new Set();
let count=0;
for (const b of reg.batches){
 const data=await readJson(`${base}/review-resolution/${b.file}`);
 assert.equal(data.entries.length,b.entryCount,`KAU_E1R_BATCH_COUNT_MISMATCH:${b.batchCode}`);
 for (const e of data.entries){
   assert.ok(!seen.has(e.reviewCode),`KAU_E1R_DUPLICATE_REVIEW:${e.reviewCode}`);
   seen.add(e.reviewCode); count++;
   assert.equal(e.humanDecision,null,`KAU_E1R_HUMAN_DECISION_PREPOPULATED:${e.reviewCode}`);
   assert.equal(e.acceptedRelationship,null,`KAU_E1R_RELATIONSHIP_PREACCEPTED:${e.reviewCode}`);
   assert.deepEqual(e.acceptedCanonicalNodeReferences,[],`KAU_E1R_NODE_PREACCEPTED:${e.reviewCode}`);
   assert.ok(['SUPPORTS','HISTORICAL_PRECURSOR','TERMINOLOGY_PREDECESSOR','PARTIAL_OVERLAP','CONFLICTS_WITH','SUPERSEDED_BY','NO_CANONICAL_MATCH','DEFER'].includes(e.recommendedHumanDecision));
 }
}
assert.equal(count,185);
assert.equal(seen.size,185);
for (const e of q.entries) assert.ok(seen.has(e.reviewCode),`KAU_E1R_MISSING_REVIEW:${e.reviewCode}`);
assert.equal(acceptance.status,'READY_FOR_HUMAN_BATCH_REVIEW');
assert.equal(acceptance.checks.acceptedRelationshipsInitiallyZero,true);
console.log('✓ KAU-E1R human review resolution runtime passed: 6 waves cover all 185 reviews exactly once; recommendations are advisory and no human/canonical decision is pre-accepted.');
