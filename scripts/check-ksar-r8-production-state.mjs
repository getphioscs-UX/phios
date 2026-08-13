import assert from 'node:assert/strict';
import fs from 'node:fs';

const json=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const finalPath='content/knowledge/source-access/freeze/ksar-r8-production-freeze-v1.json';
const statusPath='content/knowledge/source-access/registries/ksar-r8-production-status-v1.json';
const finalExists=fs.existsSync(finalPath);
const statusExists=fs.existsSync(statusPath);

assert.equal(finalExists,statusExists,'KSAR-R8 final freeze and production status must be created as one successor pair.');

if(finalExists){
  await import('./check-ksar-r8-production-freeze.mjs');
}else{
  const verification=json('content/knowledge/source-access/registries/r2-manuscript-object-verification-v1.json');
  assert.equal(verification.status,'REVIEWED_CORPUS_LOCAL_BYTES_RECONCILED_REMOTE_GET_PENDING');
  assert.equal(verification.records.length,2);
  assert(verification.records.every(record=>
    record.localBytesVerified===true &&
    record.remoteObjectGetVerified===false &&
    record.remoteBytesSha256===null &&
    record.humanReviewGateClosed===true &&
    record.productionEligible===false
  ));

  const predecessor=json('content/knowledge/source-access/freeze/ksar-r1-r8-reconciliation-v1.json');
  assert.equal(predecessor.status,'HUMAN_REVIEW_GATE_CLOSED_REMOTE_R2_GATE_PENDING');
  assert.equal(predecessor.acceptance.remoteR2GetVerificationComplete,false);
  assert.equal(predecessor.acceptance.productionFreezeEligible,false);
  assert.deepEqual(predecessor.productionBlockers,['REMOTE_R2_GET_SHA256_VERIFICATION_PENDING']);

  const promotion=json('content/knowledge/source-access/freeze/ksar-r4-reviewed-corpus-promotion-v1.json');
  assert.equal(promotion.status,'PROMOTED_HUMAN_GATE_CLOSED_REMOTE_TRANSPORT_GATE_PENDING');
  assert.equal(promotion.productionFreezeEligible,false);
  assert.equal(promotion.remainingBlocker,'REMOTE_R2_GET_SHA256_VERIFICATION_PENDING');

  const runtime=json('content/knowledge/source-access/registries/ksar-runtime-manifest-v1.json');
  assert.equal(runtime.productionState,'BLOCKED_PENDING_REMOTE_R2_GET_ONLY');

  console.log('✓ KSAR-R8 production state is internally consistent.');
  console.log('  Human Review Gate: CLOSED (448/448); Remote R2 GET Gate: PENDING (0/2).');
  console.log('  Production Freeze remains correctly blocked; no remote evidence or acceptance was fabricated.');
}
