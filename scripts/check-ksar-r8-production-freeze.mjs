import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const digest=obj=>crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
const freezePath='content/knowledge/source-access/freeze/ksar-r8-production-freeze-v1.json';
const statusPath='content/knowledge/source-access/registries/ksar-r8-production-status-v1.json';

assert(fs.existsSync(freezePath),'KSAR-R8 successor freeze is absent. Run npm run ksar:r8:close -- <private-corpus-dir> after remote R2 verification.');
const freeze=json(freezePath);
const predecessor=json('content/knowledge/source-access/freeze/ksar-r1-r8-reconciliation-v1.json');
const closure=json('content/knowledge/review/ksar-r4-human-review-closure-v1.json');
const reviewed=json('content/knowledge/source-access/registries/manuscript-reviewed-corpus-registry-v1.json');
const verification=json('content/knowledge/source-access/registries/r2-manuscript-object-verification-v1.json');
const pkg=json('package.json');

assert.equal(freeze.schemaVersion,'PHI-OS-KSAR-R8-PRODUCTION-FREEZE-v1.0.0');
assert.equal(freeze.stage,'KSAR-R8');
assert.equal(freeze.status,'PRODUCTION_FROZEN');
assert.equal(freeze.successorOf,'content/knowledge/source-access/freeze/ksar-r1-r8-reconciliation-v1.json');
assert.equal(freeze.predecessorStatus,predecessor.status);
assert.equal(freeze.authority,'SUCCESSOR_FREEZE_ONLY');
assert.equal(freeze.acceptance.humanReviewGateClosed,true);
assert.equal(freeze.acceptance.remoteR2GetVerificationComplete,true);
assert.equal(freeze.acceptance.productionFreezeEligible,true);
assert.equal(freeze.acceptance.productionFreezeComplete,true);
assert.equal(freeze.acceptance.rawFullBookDeliveryBlocked,true);
assert.deepEqual(freeze.productionBlockers,[]);
assert.equal(closure.status,'HUMAN_REVIEW_GATE_CLOSED');
assert.equal(closure.summary.pendingHumanReview,0);
assert.equal(reviewed.recordCount,448);
assert.equal(reviewed.records.length,2);
assert.equal(verification.records.length,2);

for(const corpus of reviewed.records){
  const row=verification.records.find(r=>r.sourceCode===corpus.sourceCode);
  const frozen=freeze.corpusVerification.find(r=>r.sourceCode===corpus.sourceCode);
  assert(row,`Missing verification row ${corpus.sourceCode}`);
  assert(frozen,`Missing frozen corpus evidence ${corpus.sourceCode}`);
  assert.equal(row.remoteObjectGetVerified,true,`Remote GET is not verified for ${corpus.sourceCode}`);
  assert.equal(row.productionEligible,true,`Production eligibility is not true for ${corpus.sourceCode}`);
  assert.equal(row.remoteBytesSha256,corpus.retrievalCorpusSha256,`Remote SHA mismatch for ${corpus.sourceCode}`);
  assert.equal(row.expectedRetrievalCorpusSha256,corpus.retrievalCorpusSha256,`Expected SHA mismatch for ${corpus.sourceCode}`);
  assert.equal(frozen.remoteBytesSha256,corpus.retrievalCorpusSha256,`Frozen SHA mismatch for ${corpus.sourceCode}`);
  assert.equal(frozen.r2ObjectKey,corpus.r2ObjectKey,`Frozen object key mismatch for ${corpus.sourceCode}`);
}

const evidenceMap={
  humanReviewClosure:'content/knowledge/review/ksar-r4-human-review-closure-v1.json',
  reviewedCorpusRegistry:'content/knowledge/source-access/registries/manuscript-reviewed-corpus-registry-v1.json',
  remoteR2Verification:'content/knowledge/source-access/registries/r2-manuscript-object-verification-v1.json',
  runtimeManifest:'content/knowledge/source-access/registries/ksar-runtime-manifest-v1.json',
  predecessorReconciliation:'content/knowledge/source-access/freeze/ksar-r1-r8-reconciliation-v1.json'
};
for(const [key,p] of Object.entries(evidenceMap)){
  assert.equal(freeze.evidence[key]?.path,p,`Freeze evidence path mismatch: ${key}`);
  assert.equal(freeze.evidence[key]?.sha256,sha(p),`Freeze evidence digest drift: ${key}`);
}

// The v1.0 freeze predates the optional production-status companion. If a later
// companion is present, it must bind to the exact immutable v1.0 freeze bytes.
if(fs.existsSync(statusPath)){
  const status=json(statusPath);
  assert.equal(status.stage,'KSAR-R8');
  assert.equal(status.freezePath,freezePath);
  assert.equal(status.freezeSha256,sha(freezePath));
  assert.equal(status.remoteR2GateClosed,true);
  assert.equal(status.humanReviewGateClosed,true);
  assert.equal(status.productionKnowledgeAccessEligible,true);
  const copy={...status}; delete copy.statusDigest;
  assert.equal(status.statusDigest,digest(copy));
}

assert.equal(pkg.scripts['ksar:r8:freeze'],'node scripts/freeze-ksar-r8-production.mjs');
assert.equal(pkg.scripts['ksar:r8:close'],'node scripts/close-ksar-r8-remote-and-freeze.mjs');
assert.equal(pkg.scripts['check:ksar-r8'],'node scripts/check-ksar-r8-production-freeze.mjs');

console.log('✓ KSAR-R8 Production Acceptance & Successor Freeze passed.');
console.log('  448/448 human-reviewed manuscript sections remain closed and active for governed Knowledge Access.');
console.log('  Every active reviewed-corpus R2 object is remote-GET actual-bytes SHA256 verified.');
console.log('  The immutable v1.0 freeze remains authoritative; its later status companion is optional and validated when present.');
console.log('  Canonical Knowledge / Published Article authority boundaries remain unchanged; raw full-book delivery remains blocked.');
