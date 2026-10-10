import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const audit = read('content/knowledge/production-planning/reconciliation/wave1-c2-manuscript-mapping-reconciliation-v1.json');
const mapping = read('content/knowledge/manuscripts/book-1/node-manuscript-mapping.json');
const inventory = read('content/knowledge/manuscripts/book-1/book-1-section-inventory.json');
const resolution = read('content/knowledge/production-planning/review/wave1-c2-human-editorial-freeze-resolution-v1.json');
const expectedCodes = ['KN-PREFACE-004','KN-B1-P1-003','KN-B1-P4-003','KN-B1-P4-004'];

assert.equal(audit.auditCode, 'PHI-OS-WAVE1-C2-MANUSCRIPT-MAPPING-RECONCILIATION-v1');
assert.equal(audit.status, 'HUMAN_VERIFIED');
assert.equal(audit.baselineCommit, '6920c9efb164a6e29f7dcbd8575f7a54e9d28c2f');
assert.equal(audit.reviewedBy, 'TL');
assert.equal(audit.reviewerRole, 'HUMAN_EDITORIAL_AUTHORITY');
assert(!Number.isNaN(Date.parse(audit.reviewedAt)));
assert.deepEqual(audit.scope, expectedCodes);
assert.equal(audit.hashSemantics.sectionHashAuthority, 'PART_LEVEL_NORMALIZED_SECTION_HASH');
assert.equal(audit.hashSemantics.samePartRangesMayShareSectionHash, true);
assert.equal(audit.decision.allFourMappingsAcceptedForThisC2Freeze, true);
assert.equal(audit.decision.globalManuscriptMappingAuthorityPromoted, false);
assert.equal(audit.decision.productionAuthorityCreated, false);

const mappingByCode = new Map(mapping.mappings.map(item => [item.nodeCode, item]));
const partByCode = new Map(inventory.parts.map(item => [item.partCode, item]));
for (const code of expectedCodes) {
  const source = mappingByCode.get(code);
  const item = audit.items.find(entry => entry.nodeCode === code);
  const resolutionEntry = resolution.entries.find(entry => entry.nodeCode === code);
  assert(source && item && resolutionEntry, `Missing Wave 1 mapping evidence for ${code}`);
  assert.equal(source.mappingStatus, 'candidate');
  assert.equal(source.ranges.length, 1);
  const range = source.ranges[0];
  const part = partByCode.get(source.partCode);
  assert(part, `Missing inventory Part ${source.partCode}`);
  assert.equal(range.sectionHash, part.sectionHash, `${code} range must bind its Part-level normalized section hash`);
  assert.equal(item.partHashMatched, true);
  assert.equal(item.rangeSectionHash, range.sectionHash);
  assert.equal(item.partSectionHash, part.sectionHash);
  assert.equal(item.rangeCode, range.rangeCode);
  assert.equal(item.startHeading, range.startHeading);
  assert.equal(item.endHeading, range.endHeading);
  assert.equal(item.humanDecision, 'APPROVED_FOR_C2_MAPPING_VERIFICATION');
  assert.equal(resolutionEntry.manuscriptMappingReview.humanVerified, true);
}

const p4003 = mappingByCode.get('KN-B1-P4-003').ranges[0];
const p4004 = mappingByCode.get('KN-B1-P4-004').ranges[0];
assert.equal(p4003.sectionHash, p4004.sectionHash, 'Same-Part P4 ranges are expected to share the Part-level hash');
assert.notEqual(p4003.rangeCode, p4004.rangeCode);
assert.notEqual(p4003.startHeading, p4004.startHeading);
assert.notEqual(p4003.endHeading, p4004.endHeading);

console.log('✓ Wave 1 C2 Manuscript Mapping Reconciliation passed.');
console.log('✓ 4/4 mappings are Human-verified for this C2 freeze and bind the authoritative Part-level section hash.');
console.log('✓ P4-003/P4-004 shared sectionHash is intentional Part-level lineage, not a range collision.');
console.log('✓ Global manuscript mapping authority and Production authority remain unchanged.');
