import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT=process.cwd();
const rel=p=>path.join(ROOT,p);
const json=p=>JSON.parse(fs.readFileSync(rel(p),'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(rel(p))).digest('hex');
const write=(p,v)=>fs.writeFileSync(rel(p),JSON.stringify(v,null,2)+'\n','utf8');

const paths={
  predecessor:'content/knowledge/source-access/freeze/ksar-r1-r8-reconciliation-v1.json',
  reviewClosure:'content/knowledge/review/ksar-r4-human-review-closure-v1.json',
  reviewedCorpus:'content/knowledge/source-access/registries/manuscript-reviewed-corpus-registry-v1.json',
  verification:'content/knowledge/source-access/registries/r2-manuscript-object-verification-v1.json',
  runtimeManifest:'content/knowledge/source-access/registries/ksar-runtime-manifest-v1.json',
  output:'content/knowledge/source-access/freeze/ksar-r8-production-freeze-v1.json'
};

for(const p of Object.values(paths).filter(p=>p!==paths.output)) assert(fs.existsSync(rel(p)),`Missing required KSAR artifact: ${p}`);

const predecessor=json(paths.predecessor);
const closure=json(paths.reviewClosure);
const reviewed=json(paths.reviewedCorpus);
const verification=json(paths.verification);
const manifest=json(paths.runtimeManifest);

assert.equal(closure.status,'HUMAN_REVIEW_GATE_CLOSED','KSAR-R8 requires the human manuscript review gate to be closed.');
assert.equal(closure.r8?.humanReviewGateClosed,true,'KSAR-R8 requires humanReviewGateClosed=true.');
assert.equal(closure.summary?.pendingHumanReview,0,'KSAR-R8 cannot freeze with pending human review.');
assert.equal(reviewed.recordCount,448,'KSAR-R8 expects the reviewed 448-section corpus.');
assert.equal(reviewed.records?.length,2,'KSAR-R8 expects exactly two active reviewed manuscript corpora.');
assert.equal(verification.records?.length,reviewed.records.length,'R2 verification rows must cover every reviewed corpus.');

for(const corpus of reviewed.records){
  const row=verification.records.find(r=>r.sourceCode===corpus.sourceCode);
  assert(row,`Missing R2 verification row for ${corpus.sourceCode}`);
  assert.equal(row.localBytesVerified,true,`Local bytes are not verified for ${corpus.sourceCode}`);
  assert.equal(row.humanReviewGateClosed,true,`Human review gate evidence is not closed for ${corpus.sourceCode}`);
  assert.equal(row.remoteObjectGetVerified,true,`REMOTE_R2_GET_SHA256_VERIFICATION_PENDING: ${corpus.sourceCode}`);
  assert.equal(row.productionEligible,true,`Production eligibility remains false for ${corpus.sourceCode}`);
  assert.match(row.remoteBytesSha256??'',/^[a-f0-9]{64}$/,`Missing remote bytes SHA256 for ${corpus.sourceCode}`);
  assert.equal(row.remoteBytesSha256,corpus.retrievalCorpusSha256,`Remote bytes SHA256 does not match reviewed corpus for ${corpus.sourceCode}`);
  assert.equal(row.expectedRetrievalCorpusSha256,corpus.retrievalCorpusSha256,`Expected R2 SHA256 does not match reviewed corpus for ${corpus.sourceCode}`);
}

const freeze={
  schemaVersion:'PHI-OS-KSAR-R8-PRODUCTION-FREEZE-v1.0.0',
  stage:'KSAR-R8',
  status:'PRODUCTION_FROZEN',
  successorOf:paths.predecessor,
  predecessorStatus:predecessor.status,
  authority:'SUCCESSOR_FREEZE_ONLY',
  acceptance:{
    humanReviewGateClosed:true,
    all448HumanReadabilityReviewsComplete:true,
    reviewedCorpusPromotionComplete:true,
    reviewedCorpusActiveForKnowledgeAccess:true,
    remoteR2GetVerificationComplete:true,
    reviewedCorpusRemoteBytesMatchExpectedHashes:true,
    rawFullBookDeliveryBlocked:true,
    canonicalKnowledgeAuthorityUnchanged:true,
    publishedArticleAuthorityUnchanged:true,
    productionFreezeEligible:true,
    productionFreezeComplete:true
  },
  corpusVerification:reviewed.records.map(corpus=>{
    const row=verification.records.find(r=>r.sourceCode===corpus.sourceCode);
    return {
      sourceCode:corpus.sourceCode,
      bookCode:corpus.bookCode,
      reviewedCorpusCode:corpus.reviewedCorpusCode,
      r2ObjectKey:corpus.r2ObjectKey,
      expectedRetrievalCorpusSha256:corpus.retrievalCorpusSha256,
      remoteBytesSha256:row.remoteBytesSha256,
      remoteObjectGetVerified:true,
      productionEligible:true
    };
  }),
  evidence:{
    humanReviewClosure:{path:paths.reviewClosure,sha256:sha(paths.reviewClosure)},
    reviewedCorpusRegistry:{path:paths.reviewedCorpus,sha256:sha(paths.reviewedCorpus)},
    remoteR2Verification:{path:paths.verification,sha256:sha(paths.verification)},
    runtimeManifest:{path:paths.runtimeManifest,sha256:sha(paths.runtimeManifest)},
    predecessorReconciliation:{path:paths.predecessor,sha256:sha(paths.predecessor)}
  },
  boundaries:{
    manuscriptReadabilityApprovalDoesNotCreateCanonicalNodeAuthority:true,
    manuscriptAccessDoesNotPublishArticle:true,
    questionScopedGroundingOnly:true,
    rawFullBookDeliveryRemainsBlocked:true,
    predecessorFreezeEvidencePreserved:true
  },
  productionBlockers:[]
};

fs.mkdirSync(path.dirname(rel(paths.output)),{recursive:true});
write(paths.output,freeze);
console.log('✓ KSAR-R8 Production Freeze successor written.');
console.log(`  ${paths.output}`);
console.log('  Human Review Gate: CLOSED');
console.log('  Remote R2 GET SHA256 Gate: CLOSED');
console.log('  Production Freeze: COMPLETE');
