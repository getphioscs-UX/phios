import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const reg = read('content/knowledge/manuscripts/extraction/kau-r1c-section-integrity-registry-v1.json');
const accept = read('content/knowledge/manuscripts/completed/kau-r1bc-acceptance-v1.json');
const handoff = read('content/knowledge/manuscripts/completed/kau-r1bc-handoff-v1.json');

const checkInventory = (inventoryPath, integrityPath, expected) => {
  const inv = read(inventoryPath);
  const integ = read(integrityPath);
  assert.equal(inv.stage, 'KAU-R1C');
  assert.equal(inv.status, 'EXTRACTED_INTEGRITY_VERIFIED_HUMAN_REVIEW_PENDING');
  assert.equal(inv.humanReviewStatus, 'PENDING');
  assert.equal(inv.totalSegments, expected.total);
  assert.equal(inv.sectionSegments, expected.sections);
  assert.deepEqual(inv.partCounts, expected.parts);
  assert.equal(integ.status, 'INTEGRITY_VERIFIED');
  assert.equal(integ.exactCoverage.firstOffset, 0);
  assert.equal(integ.exactCoverage.lastOffset, integ.corpusCharCount);
  assert.equal(integ.exactCoverage.coveredCharCount, integ.corpusCharCount);
  assert.equal(integ.exactCoverage.gaps, 0);
  assert.equal(integ.exactCoverage.overlaps, 0);
  assert.equal(integ.exactCoverage.corpusLengthMatches, true);
  assert.equal(integ.pageIntegrity.materializedPages, expected.pages);
  assert.equal(inv.sections.length, expected.total);
  let cursor = 0;
  for (const section of inv.sections) {
    assert.equal(section.startOffset, cursor, `${inv.bookCode} non-contiguous section ${section.sectionCode}`);
    assert.equal(section.endOffset - section.startOffset, section.charCount);
    assert.match(section.textSha256, /^[a-f0-9]{64}$/);
    assert.equal(section.integrityStatus, 'VERIFIED');
    assert.equal(section.humanReviewStatus, 'PENDING');
    cursor = section.endOffset;
  }
  assert.equal(cursor, integ.corpusCharCount);
  return { inv, integ };
};

const b1 = checkInventory(
  'content/knowledge/manuscripts/extraction/book-1-full-section-inventory-v1.json',
  'content/knowledge/manuscripts/extraction/book-1-section-integrity-v1.json',
  { pages:402, total:275, sections:274, parts:{FRONT:1,P0:12,P1:28,P2:49,P3:104,P4:81} }
);
const b2 = checkInventory(
  'content/knowledge/manuscripts/extraction/book-2-full-section-inventory-v1.json',
  'content/knowledge/manuscripts/extraction/book-2-section-integrity-v1.json',
  { pages:386, total:173, sections:172, parts:{FRONT:1,P5:66,P6:49,P7:57} }
);

assert.equal(reg.totals.physicalSegments, 448);
assert.equal(reg.totals.logicalSectionSegments, 446);
assert.equal(reg.totals.gaps, 0);
assert.equal(reg.totals.overlaps, 0);
assert.deepEqual(b1.integ.pageIntegrity.duplicatePageGroups, []);
assert.deepEqual(b2.integ.pageIntegrity.duplicatePageGroups, [[100,101]]);
assert.equal(reg.sourceIntegrityFindings.length, 1);
assert.equal(reg.sourceIntegrityFindings[0].findingCode, 'BOOK2-EXACT-DUPLICATE-PAGE-100-101');
assert.equal(reg.sourceIntegrityFindings[0].preservedInMaterialization, true);
assert.equal(accept.acceptance.book2DuplicatePages100And101PreservedAndFlagged, true);
assert.equal(accept.acceptance.canonical716NodesUntouched, true);
assert.equal(handoff.gates.candidateMatchingAllowed, true);
assert.equal(handoff.gates.automaticAcceptanceAllowed, false);
assert.equal(handoff.gates.nodesJsonMutationAllowed, false);

if (fs.existsSync('content/knowledge/registry/nodes.json')) {
  const nodes = read('content/knowledge/registry/nodes.json');
  const arr = Array.isArray(nodes) ? nodes : (nodes.nodes ?? nodes.canonicalNodes ?? []);
  assert.equal(arr.length, 716, 'KAU-R1C must preserve 716 Canonical Nodes');
}

console.log('✓ KAU-R1C Full Section Extraction & Integrity passed.');
console.log('  BOOK-1: 274 logical section segments + 1 front-matter segment; exact 0-gap/0-overlap corpus coverage.');
console.log('  BOOK-2: 172 logical section segments + 1 front-matter segment; exact 0-gap/0-overlap corpus coverage.');
console.log('  NOTICE: BOOK-2 source PDF pages 100 and 101 are exact duplicates; both are preserved, but page 101 does not create a second logical section boundary.');
console.log('  Human semantic review remains required before Canonical mapping acceptance.');
