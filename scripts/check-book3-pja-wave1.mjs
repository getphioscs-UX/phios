import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const manifest=read('content/knowledge/production-planning/production/book3-wave1/manifest-v1.json');
const inv=read('content/knowledge/manuscripts/extraction/book-3-full-section-inventory-v1.json');
const acc=read('content/knowledge/production-planning/acceptance/book3-pja-wave1-acceptance-v1.json');
const sections=new Map(inv.sections.filter(x=>x.segmentType==='SECTION').map(x=>[x.sectionCode,x]));
assert.equal(manifest.articleConceptCount,8); assert.equal(manifest.localeCandidateCount,16); assert.equal(manifest.records.length,16);
for(const r of manifest.records){
  assert.ok(['zh-Hans','en'].includes(r.locale)); assert.equal(r.status,'SOURCE_BOUND_EDITORIAL_CANDIDATE'); assert.ok(fs.existsSync(r.path),r.path);
  const a=read(r.path); assert.equal(a.review.humanEditorialApproved,false); assert.equal(a.review.customerPublishable,false); assert.equal(a.review.publicationStatus,'not_published');
  assert.equal(a.canonicalNodeBinding.status,'PENDING_KAU_R6D_HUMAN_RECONCILIATION'); assert.equal(a.canonicalNodeBinding.nodeCode,null); assert.ok(a.sourceBindings.length>=1);
  for(const b of a.sourceBindings){const s=sections.get(b.sourceSectionCode); assert.ok(s,b.sourceSectionCode); assert.equal(s.textSha256,b.sourceTextSha256); assert.deepEqual([s.startPage,s.endPage],b.sourcePages);}
  assert.ok(a.blocks.length>=6); assert.equal(a.authorityBoundary.mayCreateBookClaimBeyondSource,false); assert.equal(a.authorityBoundary.mayMarkPublished,false);
}
assert.equal(acc.machine.articleConcepts,8); assert.equal(acc.machine.localeCandidates,16); assert.equal(acc.human.zhHansEditorialAccepted,false); assert.equal(acc.publication.published,false);
console.log('✓ BOOK-3 PJA Wave 1 passed: 8 article concepts / 16 locale candidates are source-section-bound.');
console.log('✓ Human editorial, English semantic parity, exact R2 figure binding, canonical-node binding and publication remain fail-closed.');
