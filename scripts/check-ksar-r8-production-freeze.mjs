import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const digest=obj=>crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
const finalPath='content/knowledge/source-access/freeze/ksar-r8-production-freeze-v1.json';
const statusPath='content/knowledge/source-access/registries/ksar-r8-production-status-v1.json';
assert.equal(fs.existsSync(finalPath),true,'KSAR-R8 final freeze missing. Run npm run ksar:r8:close -- <KSAR-reviewed-dir>.');
assert.equal(fs.existsSync(statusPath),true,'KSAR-R8 production status successor missing.');

const freeze=json(finalPath);
assert.equal(freeze.schemaVersion,'PHI-OS-KSAR-R8-PRODUCTION-ACCEPTANCE-FREEZE-v1.1.0');
assert.equal(freeze.stage,'KSAR-R8');
assert.equal(freeze.status,'PRODUCTION_ACCEPTED_AND_FROZEN');
assert.equal(freeze.baselineCommit,'851870f8abefa9a1c3cdb12e4f2f3265fd70ba27');
assert.equal(freeze.scope.reviewedManuscriptCorpusRecords,448);
assert.deepEqual(freeze.scope.books,['BOOK-1','BOOK-2']);
assert.equal(freeze.gates.humanReviewGateClosed,true);
assert.equal(freeze.gates.all448HumanReadabilityReviewsComplete,true);
assert.equal(freeze.gates.all22RepairsHumanAccepted,true);
assert.equal(freeze.gates.reviewedCorpusPromotionComplete,true);
assert.equal(freeze.gates.remoteR2GetActualBytesSha256Verified,true);
assert.equal(freeze.gates.productionFreezeEligible,true);
assert.equal(freeze.remoteEvidence.length,2);
assert(freeze.remoteEvidence.every(r=>r.remoteBytesSha256===r.expectedRetrievalCorpusSha256));
assert.equal(freeze.governance.successorOnlyFreeze,true);
assert.equal(freeze.governance.predecessorArtifactsRemainImmutable,true);
assert.equal(freeze.governance.remotePutAloneInsufficient,true);
assert.equal(freeze.governance.dashboardScreenshotAloneInsufficient,true);

// Evidence hashes must still bind to exact predecessor governance bytes.
for(const [pathKey,shaKey] of [
  ['humanReviewClosurePath','humanReviewClosureSha256'],
  ['reviewedCorpusRegistryPath','reviewedCorpusRegistrySha256'],
  ['r2VerificationPath','r2VerificationSha256'],
  ['contractPath','contractSha256']
]) assert.equal(sha(freeze.evidence[pathKey]),freeze.evidence[shaKey],`${pathKey} bytes drifted after freeze.`);
assert.equal(sha(freeze.successorOf.reconciliationPath),freeze.successorOf.reconciliationSha256);
assert.equal(sha(freeze.successorOf.reviewedCorpusPromotionPath),freeze.successorOf.reviewedCorpusPromotionSha256);
assert.equal(sha(freeze.successorOf.runtimeManifestPath),freeze.successorOf.runtimeManifestSha256);

const human=json(freeze.evidence.humanReviewClosurePath);
assert.equal(human.status,'HUMAN_REVIEW_GATE_CLOSED');
assert.equal(human.summary.totalManuscriptSections,448);
assert.equal(human.summary.pendingHumanReview,0);

const reviewed=json(freeze.evidence.reviewedCorpusRegistryPath);
assert.equal(reviewed.status,'HUMAN_REVIEW_COMPLETE_ACTIVE_PENDING_REMOTE_R2_VERIFICATION','Predecessor reviewed-corpus registry must remain frozen as the pre-R8 state.');
assert.equal(reviewed.recordCount,448);
assert.equal(reviewed.records.length,2);
for(const corpus of reviewed.records){
  const evidence=freeze.remoteEvidence.find(r=>r.sourceCode===corpus.sourceCode);
  assert(evidence,`Missing freeze remote evidence ${corpus.sourceCode}`);
  assert.equal(evidence.r2ObjectKey,corpus.r2ObjectKey);
  assert.equal(evidence.expectedRetrievalCorpusSha256,corpus.retrievalCorpusSha256);
}

const verification=json(freeze.evidence.r2VerificationPath);
assert.equal(verification.status,'REVIEWED_CORPUS_REMOTE_GET_SHA256_VERIFIED');
assert.equal(verification.records.length,2);
assert(verification.records.every(r=>r.localBytesVerified===true&&r.remoteObjectGetVerified===true&&r.productionEligible===true&&r.remoteBytesSha256===r.expectedRetrievalCorpusSha256));

const predecessor=json(freeze.successorOf.reconciliationPath);
assert.equal(predecessor.status,'HUMAN_REVIEW_GATE_CLOSED_REMOTE_R2_GATE_PENDING');
assert.equal(predecessor.acceptance.remoteR2GetVerificationComplete,false);
assert.equal(predecessor.acceptance.productionFreezeEligible,false);
assert.deepEqual(predecessor.productionBlockers,['REMOTE_R2_GET_SHA256_VERIFICATION_PENDING']);

const promotion=json(freeze.successorOf.reviewedCorpusPromotionPath);
assert.equal(promotion.status,'PROMOTED_HUMAN_GATE_CLOSED_REMOTE_TRANSPORT_GATE_PENDING');
assert.equal(promotion.productionFreezeEligible,false);

const runtime=json(freeze.successorOf.runtimeManifestPath);
assert.equal(runtime.productionState,'BLOCKED_PENDING_REMOTE_R2_GET_ONLY');

const status=json(statusPath);
assert.equal(status.status,'PRODUCTION_ACCEPTED_AND_FROZEN');
assert.equal(status.baselineCommit,freeze.baselineCommit);
assert.equal(status.freezePath,finalPath);
assert.equal(status.freezeDigest,freeze.freezeDigest);
assert.equal(status.activeReviewedCorpusRecordCount,448);
assert.equal(status.remoteR2GateClosed,true);
assert.equal(status.humanReviewGateClosed,true);
assert.equal(status.productionKnowledgeAccessEligible,true);
const statusCopy={...status}; delete statusCopy.statusDigest; assert.equal(status.statusDigest,digest(statusCopy));
const freezeCopy={...freeze}; delete freezeCopy.freezeDigest; assert.equal(freeze.freezeDigest,digest(freezeCopy));

assert.equal(freeze.authorityBoundaries.canonicalNodeAuthorityUnchanged,true);
assert.equal(freeze.authorityBoundaries.KAUAuthorityUnchanged,true);
assert.equal(freeze.authorityBoundaries.PJAAuthorityUnchanged,true);
assert.equal(freeze.authorityBoundaries.CARAuthorityUnchanged,true);
assert.equal(freeze.authorityBoundaries.publishedArticleAuthorityUnchanged,true);
assert.equal(freeze.productionAuthority.rawFullBookDeliveryAllowed,false);

console.log('✓ KSAR-R8 Production Acceptance & Freeze passed.');
console.log('  Human Review Gate: CLOSED (448/448).');
console.log('  Remote R2 Gate: CLOSED (2/2 reviewed corpora actual bytes SHA256 verified by remote GET).');
console.log('  Production: ELIGIBLE, ACCEPTED, FROZEN through successor-only R8 authority.');
console.log('  KAU / Canonical / PJA / CAR / Published Article authorities remain unchanged.');
