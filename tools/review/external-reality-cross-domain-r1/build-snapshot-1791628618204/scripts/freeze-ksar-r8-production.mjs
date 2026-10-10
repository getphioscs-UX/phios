import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const BASELINE='851870f8abefa9a1c3cdb12e4f2f3265fd70ba27';
const P={
  verification:'content/knowledge/source-access/registries/r2-manuscript-object-verification-v1.json',
  reviewed:'content/knowledge/source-access/registries/manuscript-reviewed-corpus-registry-v1.json',
  human:'content/knowledge/review/ksar-r4-human-review-closure-v1.json',
  predecessorFreeze:'content/knowledge/source-access/freeze/ksar-r1-r8-reconciliation-v1.json',
  promotion:'content/knowledge/source-access/freeze/ksar-r4-reviewed-corpus-promotion-v1.json',
  contract:'content/knowledge/source-access/contracts/ksar-r1-r8-reconciliation-contract-v1.json',
  runtimeManifest:'content/knowledge/source-access/registries/ksar-runtime-manifest-v1.json',
  finalFreeze:'content/knowledge/source-access/freeze/ksar-r8-production-freeze-v1.json',
  finalStatus:'content/knowledge/source-access/registries/ksar-r8-production-status-v1.json'
};
const read=rel=>JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8'));
const shaFile=rel=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,rel))).digest('hex');
const shaText=text=>crypto.createHash('sha256').update(text).digest('hex');
const stableDigest=obj=>shaText(JSON.stringify(obj));
function writeAtomic(rel,obj){
  const file=path.join(ROOT,rel); fs.mkdirSync(path.dirname(file),{recursive:true});
  const tmp=`${file}.${process.pid}.tmp`; fs.writeFileSync(tmp,JSON.stringify(obj,null,2)+'\n','utf8'); fs.renameSync(tmp,file);
}

const verification=read(P.verification);
const reviewed=read(P.reviewed);
const human=read(P.human);
const predecessor=read(P.predecessorFreeze);
const promotion=read(P.promotion);
const contract=read(P.contract);
const runtimeManifest=read(P.runtimeManifest);

// Frozen predecessor gates must remain intact. R8 closes through a successor freeze, not by rewriting them.
assert.equal(human.status,'HUMAN_REVIEW_GATE_CLOSED');
assert.equal(human.summary.totalManuscriptSections,448);
assert.equal(human.summary.pendingHumanReview,0);
assert.equal(reviewed.status,'HUMAN_REVIEW_COMPLETE_ACTIVE_PENDING_REMOTE_R2_VERIFICATION');
assert.equal(reviewed.recordCount,448);
assert.equal(reviewed.records.length,2);
assert.equal(predecessor.status,'HUMAN_REVIEW_GATE_CLOSED_REMOTE_R2_GATE_PENDING');
assert.equal(predecessor.acceptance.remoteR2GetVerificationComplete,false);
assert.equal(predecessor.acceptance.productionFreezeEligible,false);
assert.deepEqual(predecessor.productionBlockers,['REMOTE_R2_GET_SHA256_VERIFICATION_PENDING']);
assert.equal(promotion.status,'PROMOTED_HUMAN_GATE_CLOSED_REMOTE_TRANSPORT_GATE_PENDING');
assert.equal(promotion.productionFreezeEligible,false);
assert.equal(promotion.remainingBlocker,'REMOTE_R2_GET_SHA256_VERIFICATION_PENDING');
assert.equal(contract.stages['KSAR-R8'].acceptance,'HUMAN_REVIEW_GATE_CLOSED_REMOTE_R2_GATE_PENDING');
assert.equal(runtimeManifest.productionState,'BLOCKED_PENDING_REMOTE_R2_GET_ONLY');

assert.equal(verification.status,'REVIEWED_CORPUS_REMOTE_GET_SHA256_VERIFIED','Run npm run ksar:r2:verify-remote -- <KSAR-reviewed-dir> --write first.');
assert.equal(verification.records.length,2);

const remoteEvidence=[];
for(const corpus of reviewed.records){
  const row=verification.records.find(r=>r.sourceCode===corpus.sourceCode);
  assert(row,`Missing remote verification row ${corpus.sourceCode}`);
  assert.equal(row.r2ObjectKey,corpus.r2ObjectKey);
  assert.equal(row.expectedRetrievalCorpusSha256,corpus.retrievalCorpusSha256);
  assert.equal(row.localBytesVerified,true);
  assert.equal(row.remoteObjectGetVerified,true,`Remote GET not verified: ${corpus.sourceCode}`);
  assert.equal(row.remoteBytesSha256,corpus.retrievalCorpusSha256,`Remote bytes SHA256 mismatch: ${corpus.sourceCode}`);
  assert.equal(row.productionEligible,true,`Remote corpus not production eligible: ${corpus.sourceCode}`);
  remoteEvidence.push({
    sourceCode:corpus.sourceCode,
    reviewedCorpusCode:corpus.reviewedCorpusCode,
    bookCode:corpus.bookCode,
    locale:corpus.locale,
    r2ObjectKey:corpus.r2ObjectKey,
    expectedRetrievalCorpusSha256:corpus.retrievalCorpusSha256,
    remoteBytesSha256:row.remoteBytesSha256,
    verificationMethod:row.verificationMethod||'WRANGLER_REMOTE_GET_ACTUAL_BYTES_SHA256',
    remoteVerifiedAt:row.remoteVerifiedAt||verification.verifiedAt||null
  });
}

const frozenAt=verification.verifiedAt||remoteEvidence.map(r=>r.remoteVerifiedAt).filter(Boolean).sort().at(-1)||new Date().toISOString();
const freeze={
  schemaVersion:'PHI-OS-KSAR-R8-PRODUCTION-ACCEPTANCE-FREEZE-v1.1.0',
  stage:'KSAR-R8',
  status:'PRODUCTION_ACCEPTED_AND_FROZEN',
  baselineCommit:BASELINE,
  frozenAt,
  successorOf:{
    reconciliationPath:P.predecessorFreeze,
    reconciliationSha256:shaFile(P.predecessorFreeze),
    reconciliationStatus:predecessor.status,
    reviewedCorpusPromotionPath:P.promotion,
    reviewedCorpusPromotionSha256:shaFile(P.promotion),
    reviewedCorpusPromotionStatus:promotion.status,
    runtimeManifestPath:P.runtimeManifest,
    runtimeManifestSha256:shaFile(P.runtimeManifest),
    runtimeManifestProductionState:runtimeManifest.productionState
  },
  scope:{reviewedManuscriptCorpusRecords:448,books:['BOOK-1','BOOK-2'],locale:'zh-Hans'},
  gates:{
    humanReviewGateClosed:true,
    all448HumanReadabilityReviewsComplete:true,
    all22RepairsHumanAccepted:true,
    reviewedCorpusPromotionComplete:true,
    remoteR2GetActualBytesSha256Verified:true,
    productionFreezeEligible:true
  },
  remoteEvidence,
  evidence:{
    humanReviewClosurePath:P.human,
    humanReviewClosureSha256:shaFile(P.human),
    reviewedCorpusRegistryPath:P.reviewed,
    reviewedCorpusRegistrySha256:shaFile(P.reviewed),
    r2VerificationPath:P.verification,
    r2VerificationSha256:shaFile(P.verification),
    contractPath:P.contract,
    contractSha256:shaFile(P.contract)
  },
  productionAuthority:{
    activeKnowledgeSourceAuthority:'HUMAN_REVIEWED_MANUSCRIPT_DERIVATIVE',
    questionScopedKnowledgeAccessAllowed:true,
    rawFullBookDeliveryAllowed:false,
    articlePublicationRequiredForManuscriptGrounding:false
  },
  authorityBoundaries:{
    canonicalNodeAuthorityUnchanged:true,
    KAUAuthorityUnchanged:true,
    publishedArticleAuthorityUnchanged:true,
    PJAAuthorityUnchanged:true,
    CARAuthorityUnchanged:true,
    readabilityApprovalDoesNotPublishArticle:true,
    sourceNativeReviewedManuscriptMayGroundQuestionScopedKnowledgeAccess:true,
    bookPurchaseCapabilityPreserved:true
  },
  governance:{
    successorOnlyFreeze:true,
    predecessorArtifactsRemainImmutable:true,
    freezeRequiresRemoteGetActualBytesSha256:true,
    remotePutAloneInsufficient:true,
    dashboardScreenshotAloneInsufficient:true,
    checkerWritesState:false
  }
};
freeze.freezeDigest=stableDigest(freeze);

const status={
  schemaVersion:'PHI-OS-KSAR-R8-PRODUCTION-STATUS-v1.0.0',
  stage:'KSAR-R8',
  status:'PRODUCTION_ACCEPTED_AND_FROZEN',
  baselineCommit:BASELINE,
  freezePath:P.finalFreeze,
  freezeDigest:freeze.freezeDigest,
  activeReviewedCorpusRegistry:P.reviewed,
  activeReviewedCorpusRecordCount:448,
  remoteR2GateClosed:true,
  humanReviewGateClosed:true,
  productionKnowledgeAccessEligible:true,
  authority:'QUESTION_SCOPED_ACCESS_ONLY'
};
status.statusDigest=stableDigest(status);

writeAtomic(P.finalFreeze,freeze);
writeAtomic(P.finalStatus,status);
console.log('✓ KSAR-R8 successor Production Acceptance & Freeze written.');
console.log('  Frozen predecessor R1–R8 reconciliation / R4 promotion / runtime manifest were not rewritten.');
console.log(`  Remote reviewed corpora verified: ${remoteEvidence.length}/2`);
console.log(`  Freeze: ${P.finalFreeze}`);
console.log(`  freezeDigest: ${freeze.freezeDigest}`);
