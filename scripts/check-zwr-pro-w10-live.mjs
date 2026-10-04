import fs from 'node:fs';
import assert from 'node:assert/strict';
import {assertZwrProSnapshotReopenW9} from '../functions/personal-reading/narrative/zwr-pro-w9-immutable-snapshot.js';

const path='docs/reports/ziwei/production-admission/zwr-pro-w10-live-campaign.json';
assert(fs.existsSync(path),'W10 live campaign evidence missing: run npm run run:zwr-pro:w10-live');
const doc=JSON.parse(fs.readFileSync(path,'utf8'));
assert.equal(doc.schemaVersion,'ZWR-PRO-W10-LIVE-CAMPAIGN-v1');
assert.equal(doc.status,'PASS_LIVE_CAMPAIGN');
assert.equal(doc.providerExecution,'LIVE');
assert(doc.subjectCount>=4,'W10 live campaign requires at least four non-reference subjects');
assert.equal(doc.results.length,doc.subjectCount);
assert(!doc.sentinelIds.includes('01'),'gold reference subject may not count as W10 live QA');
assert(doc.providerCalls>0,'W10 live campaign must contain real provider calls');
assert(doc.semanticReviewCalls>0,'W10 live campaign must contain real semantic review calls');
assert(doc.providerAttempts>0,'W10 live campaign must contain provider attempts');
assert.equal(doc.productionAdmissionGranted,false);
assert.equal(new Set(doc.results.map(x=>x.inputFingerprint)).size,doc.results.length,'W10 live subjects must be input-distinct');
assert.equal(new Set(doc.results.map(x=>x.reportSnapshotId)).size,doc.results.length,'W10 snapshots must be distinct');
for(const row of doc.results){
 assert(row.fixtureId&&row.fixtureId!=='01');
 assert(row.pipelineDigest&&row.w8ParityDigest&&row.authorityDigest&&row.structuralSignature);
 assert.equal(row.snapshot.reportSnapshotId,row.reportSnapshotId);
 assertZwrProSnapshotReopenW9(row.snapshot);
 assert.equal(row.snapshot.productionAdmissionGranted,false);
}
console.log('PASS ZWR-PRO W10-B: live controlled multi-chart composition evidence is present for',doc.subjectCount,'non-reference subjects; all W4-W9 gates passed; provider calls=',doc.providerCalls,'semantic review calls=',doc.semanticReviewCalls,'estimated provider cost=',doc.estimatedProviderCost,'; production remains closed.');
