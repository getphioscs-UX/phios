import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const completed=read('content/knowledge/manuscripts/completed/book-4-completed-manuscript-v1.json');
const inv=read('content/knowledge/manuscripts/extraction/book-4-final-section-inventory-v1.json');
const audit=read('content/knowledge/manuscripts/review/book4-a1-canonical-coverage-audit-v1.json');
const prep=read('content/knowledge/production-planning/production/book4-wave1/pre-admission-contract-v1.json');
const manifest=read('content/knowledge/production-planning/production/book4-wave1/manifest-v1.json');
const acceptance=read('content/knowledge/production-planning/acceptance/book4-pja-wave1-acceptance-v1.json');
assert.equal(completed.completionEvidence.finishedManuscriptSectionCount,125); assert.equal(completed.formalMasterState.a1Complete,true); assert.equal(completed.formalMasterState.bookIVAdmitted,false);
const sections=inv.sections.filter(x=>x.segmentType==='SECTION'); assert.equal(sections.length,125); assert.equal(sections.filter(x=>x.partCode==='P10').length,79); assert.equal(sections.filter(x=>x.partCode==='P11').length,46);
assert.equal(audit.status,'COMPLETE_TL_AUTHORIZED_FINAL_CANONICAL_COVERAGE'); assert.equal(audit.finalCanonicalCoverage.canonicalNodeCount,125); assert.equal(audit.finalCanonicalCoverage.unmappedSectionCount,0);
assert.equal(prep.status,'PREPARATION_ONLY_NO_PHASE_CUTOVER'); assert.equal(prep.integratedExecutionBoundary.formalCurrentProgramPhaseIsNotAdvancedByThisDelta,true);
assert.equal(manifest.articleConceptCount,8); assert.equal(manifest.localeCandidateCount,16); assert.equal(manifest.records.length,16); assert.equal(manifest.masterWork.a1Status,'COMPLETE'); assert.equal(manifest.masterWork.a2Status,'COMPLETE'); assert.equal(manifest.masterWork.a3Status,'READY_NOT_STARTED'); assert.equal(manifest.publication.bookIVAdmitted,false);
for(const r of manifest.records){ const a=read(r.path); assert.ok(a.canonicalNodeBinding.nodeCodes.length>0); assert.equal(a.canonicalNodeBinding.status,'BOOK_IV_A1_FINAL_CANONICAL_RECONCILED'); assert.equal(a.review.customerPublishable,false); assert.equal(a.review.publicationStatus,'not_published'); }
assert.equal(acceptance.human.zhHansEditorialAccepted,true); assert.equal(acceptance.human.zhHansAcceptedArticleCount,8); assert.equal(acceptance.human.englishSemanticParityAccepted,false); assert.equal(acceptance.publication.published,false); assert.equal(acceptance.publication.bookIVAdmitted,false);
console.log('✓ BOOK IV Phase 15 pre-admission successor passed: A0 complete, A1 complete, A2 complete, A3 ready; 125 final sections after TL-confirmed dedup.');
console.log('✓ PJA Wave 1 remains pre-admission: 8/8 zh-Hans accepted, English parity pending, publication closed, BOOK-IV-A6 not admitted.');
