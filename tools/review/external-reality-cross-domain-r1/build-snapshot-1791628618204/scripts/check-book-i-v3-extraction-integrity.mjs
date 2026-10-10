import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const admission=read('content/knowledge/manuscripts/completed/book-1-completed-manuscript-v3.json');
const inventory=read('content/knowledge/manuscripts/extraction/book-1-v3-full-section-inventory-v1.json');
const integrity=read('content/knowledge/manuscripts/extraction/book-1-v3-section-integrity-v1.json');
const completed=read('content/knowledge/manuscripts/completed/completed-manuscript-registry-v2.json');

assert.equal(admission.bookCode,'BOOK-1');
assert.equal(admission.sourceBinary.fileName,'PHI-OS-Book-I-v3.pdf');
assert.match(admission.sourceBinary.sha256,/^[a-f0-9]{64}$/);
assert.ok(Number.isInteger(admission.sourceBinary.byteSize)&&admission.sourceBinary.byteSize>0);
assert.ok(Number.isInteger(admission.sourceBinary.pageCount)&&admission.sourceBinary.pageCount>0);
assert.equal(admission.sourceBinary.exactBinaryMetadataStatus,'VERIFIED_FROM_PRIVATE_R2_DOWNLOAD');
assert.equal(admission.cutoverGate.completedManuscriptRegistryCutoverAllowed,false);

assert.equal(inventory.bookCode,'BOOK-1');
assert.equal(inventory.sourceObjectKey,'books/book-1/source/PHI-OS-Book-I-v3.pdf');
assert.equal(inventory.sourceSha256,admission.sourceBinary.sha256);
assert.equal(inventory.sourceByteSize,admission.sourceBinary.byteSize);
assert.equal(inventory.sourcePageCount,admission.sourceBinary.pageCount);
assert.equal(inventory.ocrUsed,false);
assert.equal(inventory.semanticRewrite,false);
assert.equal(inventory.humanReviewStatus,'PENDING');
assert.ok(Array.isArray(inventory.sections)&&inventory.sections.length>0);

for(const code of ['P0','P1','P2','P3','P4']){
 assert.ok((inventory.partCounts?.[code]??0)>0,code+' section coverage required');
}
let expected=0;
for(const section of inventory.sections){
 assert.equal(section.startOffset,expected,'section offset continuity '+section.sectionCode);
 assert.ok(section.endOffset>section.startOffset,'non-empty section '+section.sectionCode);
 assert.match(section.textSha256,/^[a-f0-9]{64}$/);
 expected=section.endOffset;
}
assert.equal(expected,integrity.corpusCharCount);
assert.equal(integrity.sourceSha256,admission.sourceBinary.sha256);
assert.equal(integrity.byteSize,admission.sourceBinary.byteSize);
assert.equal(integrity.pageCount,admission.sourceBinary.pageCount);
assert.match(integrity.corpusSha256,/^[a-f0-9]{64}$/);
assert.match(integrity.pageHashChainSha256,/^[a-f0-9]{64}$/);
assert.match(integrity.sectionHashChainSha256,/^[a-f0-9]{64}$/);
assert.equal(integrity.exactCoverage.gaps,0);
assert.equal(integrity.exactCoverage.overlaps,0);
assert.equal(integrity.exactCoverage.corpusLengthMatches,true);
assert.equal(integrity.authorityBoundary.publicRepositoryBodyStorageAllowed,false);
assert.equal(integrity.authorityBoundary.canonicalNodeAuthorityCreated,false);
assert.equal(integrity.authorityBoundary.nodeCodeMutationAllowed,false);
assert.equal(integrity.authorityBoundary.completedRegistryCutoverAllowed,false);

const active=completed.records.find(r=>r.bookCode==='BOOK-1');
assert.ok(active);
assert.equal(active.fileName,'PHI-OS-Book-I-v2.pdf','v3 extraction must not auto-cutover completed registry');

console.log('PASS Book I v3 extraction integrity: binary metadata verified, P0-P4 section inventory is contiguous, OCR-free, private-body only, and canonical/production cutover remains closed.');
