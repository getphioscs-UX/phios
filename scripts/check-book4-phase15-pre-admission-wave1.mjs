import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const BASE='489eb817fde8bc34f2faefe395eca128ef997220';
const completed=read('content/knowledge/manuscripts/completed/book-4-completed-manuscript-v1.json');
const inv=read('content/knowledge/manuscripts/extraction/book-4-full-section-inventory-v1.json');
const integrity=read('content/knowledge/manuscripts/extraction/book-4-section-integrity-v1.json');
const audit=read('content/knowledge/manuscripts/review/book4-a1-canonical-coverage-audit-v1.json');
const prep=read('content/knowledge/production-planning/production/book4-wave1/pre-admission-contract-v1.json');
const manifest=read('content/knowledge/production-planning/production/book4-wave1/manifest-v1.json');
const acceptance=read('content/knowledge/production-planning/acceptance/book4-pja-wave1-acceptance-v1.json');

assert.equal(completed.baselineCommit,BASE);
assert.equal(completed.sourceBinary.sha256,'181cb98e54d0f2a2b5ad9dc00ab1d146f4ad41492e36b258e340f2104d29bd8e');
assert.equal(completed.sourceBinary.pageCount,433);
assert.equal(completed.completionEvidence.finishedManuscriptSectionCount,127);
assert.equal(completed.formalMasterState.bookIVAdmitted,false);

assert.equal(inv.baselineCommit,BASE);
assert.equal(inv.sectionSegments,127);
assert.deepEqual(inv.partCounts,{FRONT:1,P10:81,P11:46});
const sections=inv.sections.filter(x=>x.segmentType==='SECTION');
assert.equal(sections.length,127);
assert.equal(new Set(sections.map(x=>x.sectionCode)).size,127);
assert.equal(sections.filter(x=>x.partCode==='P10').length,81);
assert.equal(sections.filter(x=>x.partCode==='P11').length,46);

assert.equal(integrity.sectionCount,127);
assert.equal(integrity.duplicateHeadingCount,2);
assert.equal(audit.status,'RECONCILIATION_REQUIRED_NOT_COMPLETE');
assert.equal(audit.exactHeadingMatchCount,29);
assert.equal(audit.semanticOrHumanResolutionRequiredCount,98);
assert.equal(audit.sourceDuplicateFindings.pairCount,2);
const duplicateCodes=audit.sourceDuplicateFindings.pairs.flatMap(x=>[x.firstSectionCode,x.secondSectionCode]).sort();
assert.deepEqual(duplicateCodes,['CM-B4V1-P10-S048','CM-B4V1-P10-S049','CM-B4V1-P10-S050','CM-B4V1-P10-S051']);
assert.ok(audit.sourceDuplicateFindings.pairs.every(x=>x.automaticDeduplicationAllowed===false));

assert.equal(prep.status,'PREPARATION_ONLY_NO_PHASE_CUTOVER');
assert.equal(prep.integratedExecutionBoundary.formalCurrentProgramPhaseIsNotAdvancedByThisDelta,true);
assert.equal(manifest.articleConceptCount,8);
assert.equal(manifest.localeCandidateCount,16);
assert.equal(manifest.records.length,16);
assert.equal(manifest.masterWork.a0Status,'EVIDENCE_READY');
assert.equal(manifest.masterWork.a1Status,'RECONCILIATION_REQUIRED_NOT_COMPLETE');
assert.equal(manifest.masterWork.a3Status,'NOT_COMPLETE_SOURCE_BOUND_PREVIEW_ONLY');
assert.equal(manifest.publication.bookIVAdmitted,false);
assert.equal(manifest.publication.publicationAuthorityCreated,false);

const byCode=new Map(sections.map(x=>[x.sectionCode,x]));
const conceptLocales=new Map();
for(const r of manifest.records){
  assert.ok(fs.existsSync(r.path),r.path);
  const a=read(r.path);
  assert.equal(a.productionRole,'ARTICLE');
  assert.equal(a.dispatchTarget,'PJA');
  assert.equal(a.status,'SOURCE_BOUND_EDITORIAL_CANDIDATE_CANONICAL_RECONCILIATION_PENDING');
  assert.equal(a.canonicalNodeBinding.status,'PENDING_BOOK_IV_A1_CANONICAL_RECONCILIATION');
  assert.deepEqual(a.canonicalNodeBinding.nodeCodes,[]);
  assert.equal(a.canonicalNodeBinding.mutationPerformed,false);
  assert.equal(a.review.humanEditorialApproved,false);
  assert.equal(a.review.customerPublishable,false);
  assert.equal(a.review.publicationStatus,'not_published');
  assert.equal(a.authorityBoundary.mayMarkPublished,false);
  assert.equal(a.authorityBoundary.mayMarkBookAdmitted,false);
  if(!conceptLocales.has(a.candidateId)) conceptLocales.set(a.candidateId,new Set());
  conceptLocales.get(a.candidateId).add(a.locale);
  for(const b of a.sourceBindings){
    const s=byCode.get(b.sourceSectionCode);
    assert.ok(s,b.sourceSectionCode);
    assert.equal(s.textSha256,b.sourceTextSha256);
    assert.deepEqual([s.startPage,s.endPage],b.sourcePages);
    assert.equal(s.partCode,b.partCode);
  }
}
assert.equal(conceptLocales.size,8);
for(const [id,set] of conceptLocales) assert.deepEqual([...set].sort(),['en','zh-Hans'],`${id} locale pair`);

assert.equal(acceptance.status,'HUMAN_EDITORIAL_REVIEW_PENDING');
assert.equal(acceptance.machine.sourceBindingIntegrity,true);
assert.equal(acceptance.machine.canonicalCoverageComplete,false);
assert.equal(acceptance.human.zhHansEditorialAccepted,false);
assert.equal(acceptance.publication.published,false);
assert.equal(acceptance.publication.bookIVAdmitted,false);

console.log('✓ BOOK IV A0 source evidence + 127-section inventory verified (P10 81 / P11 46).');
console.log('✓ BOOK IV A1 audit is fail-closed: 29 exact-title candidates, 98 semantic/human resolutions pending, 2 source duplicate pairs preserved for human disposition.');
console.log('✓ BOOK IV PJA Wave 1 pre-admission passed: 8 concepts / 16 locale candidates are source-bound, non-published and non-admitted.');
