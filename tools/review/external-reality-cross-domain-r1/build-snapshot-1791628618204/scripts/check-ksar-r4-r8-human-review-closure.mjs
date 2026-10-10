import assert from 'node:assert/strict';
import fs from 'node:fs';

const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const full=json('content/knowledge/review/ksar-human-pdf-extract-review-resolution-v1.json');
assert.equal(full.recordCount,448);
assert.equal(full.pendingCount,0);
assert.equal(full.status,'HUMAN_REVIEW_COMPLETE_ALL_REPAIRS_FINAL_ACCEPTED');
assert.deepEqual(full.decisionCounts,{APPROVE_TEXT:426,APPROVE_WITH_FIGURE_EXCLUSION:17,TABLE_REEXTRACT:2,REEXTRACT:3});
assert.equal(full.reviewedCorpusPromotionEligible,true);

const v22=json('content/knowledge/review/ksar-r4-repair-final-verification-v1.json');
assert.equal(v22.recordCount,22); assert.deepEqual(v22.progress,{a:19,n:3,p:0,done:22});
const needs=v22.records.filter(r=>r.finalVerification==='NEEDS_MORE_FIX').map(r=>r.sectionCode);
assert.deepEqual(needs,['CM-B1V2-P1-S009','CM-B1V2-P1-S010','CM-B1V2-P1-S011']);
const v3=json('content/knowledge/review/ksar-r4-final-3-correction-verification-v1.json');
assert.equal(v3.recordCount,3); assert.deepEqual(v3.progress,{a:3,n:0,p:0});
assert(v3.records.every(r=>r.finalVerification==='ACCEPT_REPAIR'));
assert.deepEqual(v3.records.map(r=>r.sectionCode),needs);

const repairs=json('content/knowledge/review/ksar-r4-repair-action-manifest-v1.json');
assert.equal(repairs.status,'ALL_22_REPAIRS_HUMAN_ACCEPTED_FINAL');
assert.equal(repairs.actions.length,22);
assert(repairs.actions.every(r=>r.finalVerification==='ACCEPT_REPAIR'));
assert.deepEqual(repairs.finalVerification,{accepted:22,needsMoreFix:0,pending:0});

const closure=json('content/knowledge/review/ksar-r4-human-review-closure-v1.json');
assert.equal(closure.status,'HUMAN_REVIEW_GATE_CLOSED');
assert.equal(closure.summary.totalManuscriptSections,448);
assert.equal(closure.summary.directHumanApproved,426);
assert.equal(closure.summary.repairActionsHumanAccepted,22);
assert.equal(closure.summary.pendingHumanReview,0);
assert.equal(closure.r8.humanReviewGateClosed,true);
assert.equal(closure.r8.remoteR2GateClosed,false);

const reviewed=json('content/knowledge/source-access/registries/manuscript-reviewed-corpus-registry-v1.json');
assert.equal(reviewed.status,'HUMAN_REVIEW_COMPLETE_ACTIVE_PENDING_REMOTE_R2_VERIFICATION');
assert.equal(reviewed.recordCount,448); assert.equal(reviewed.records.length,2);
assert.equal(reviewed.records.reduce((n,r)=>n+r.recordCount,0),448);
assert.deepEqual(reviewed.records.map(r=>r.r2ObjectKey),['books/book-1/materialized/v2/reviewed/retrieval-corpus.json','books/book-2/materialized/v1/reviewed/retrieval-corpus.json']);
assert(reviewed.records.every(r=>r.humanReadabilityStatus==='HUMAN_REVIEW_COMPLETE'&&/^[a-f0-9]{64}$/.test(r.retrievalCorpusSha256)));

const readability=json('content/knowledge/source-access/registries/manuscript-readability-review-v1.json');
assert.equal(readability.status,'HUMAN_READABILITY_REVIEW_COMPLETE');
assert.equal(readability.humanReviewSummary.totalReviewed,448);
assert.equal(readability.humanReviewSummary.pending,0);
assert(readability.records.every(r=>!Object.hasOwn(r,'text')),'Public readability registry must stay body-free.');

const freeze=json('content/knowledge/source-access/freeze/ksar-r1-r8-reconciliation-v1.json');
assert.equal(freeze.status,'HUMAN_REVIEW_GATE_CLOSED_REMOTE_R2_GATE_PENDING');
assert.equal(freeze.acceptance.all448HumanReadabilityReviewsComplete,true);
assert.equal(freeze.acceptance.all22RepairCandidatesFinalAccepted,true);
assert.equal(freeze.acceptance.reviewedCorpusPromotionComplete,true);
assert.equal(freeze.acceptance.reviewedCorpusActiveForKnowledgeAccess,true);
assert.equal(freeze.acceptance.remoteR2GetVerificationComplete,false);
assert.equal(freeze.acceptance.productionFreezeEligible,false);
assert.deepEqual(freeze.productionBlockers,['REMOTE_R2_GET_SHA256_VERIFICATION_PENDING']);

const api=fs.readFileSync('functions/_lib/knowledge-access-api.js','utf8');
assert(api.includes('manuscript-reviewed-corpus-registry-v1.json'));
assert(api.includes("humanReadabilityStatus !== 'HUMAN_REVIEW_COMPLETE'"));
const runtime=fs.readFileSync('functions/knowledge-runtime/manuscript-source-runtime.js','utf8');
assert(runtime.includes('record.retrievalEligible === false'));
assert(runtime.includes('sourceMaterializationDigest'));

for(const forbidden of ['content/knowledge/source-access/reviewed/retrieval-corpus.json','content/knowledge/source-access/full-manuscript.md']) assert.equal(fs.existsSync(forbidden),false);
console.log('✓ KSAR-R4 Reviewed Manuscript Corpus Promotion + R8 Human Review Gate Closure passed.');
console.log('  448/448 sections have final human readability disposition: 426 direct approvals + 22 human-accepted repairs.');
console.log('  Final reviewed corpus hashes/object keys are public governance metadata only; manuscript bodies remain private R2 artifacts.');
console.log('  Knowledge Access now selects the human-reviewed derivative corpus.');
console.log('  R8 Human Review Gate is closed; Production Freeze remains blocked only by remote R2 GET actual-bytes SHA256 verification.');
