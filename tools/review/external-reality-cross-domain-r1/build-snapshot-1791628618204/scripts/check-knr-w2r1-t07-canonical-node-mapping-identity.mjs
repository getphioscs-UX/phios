import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  deriveBookIBlueprintNodes,
  deriveInitialBookINodeMapping,
  runBookIManuscriptCommand,
  validateBookINodeMapping
} from './book-i-manuscript.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mappingRelative = 'content/knowledge/manuscripts/book-1/node-manuscript-mapping.json';
const blueprintRelative = 'content/knowledge/blueprints/book-1-knowledge-blueprint.json';
const inventoryRelative = 'content/knowledge/manuscripts/book-1/book-1-section-inventory.json';
const manifestRelative = 'content/knowledge/manuscripts/book-1/manuscript-manifest.json';
const read = relative => fs.readFileSync(path.join(repositoryRoot, relative), 'utf8');
const json = relative => JSON.parse(read(relative));
const clone = value => JSON.parse(JSON.stringify(value));

const mappingSource = read(mappingRelative);
const mapping = JSON.parse(mappingSource);
const blueprint = json(blueprintRelative);
const inventory = json(inventoryRelative);
const manifest = json(manifestRelative);
const packageJson = json('package.json');
const blueprintNodes = deriveBookIBlueprintNodes(blueprint, manifest);
const requiredFields = [
  'nodeCode',
  'bookCode',
  'partCode',
  'locale',
  'sourceObjectKey',
  'sourceVersion',
  'mappingStatus',
  'authorityStatus',
  'ranges',
  'crossSectionReferences',
  'extractionEligibility',
  'publicExtractionPolicy',
  'unresolved',
  'review',
  'stalenessStatus'
];
const requiredRangeFields = [
  'rangeCode',
  'startHeading',
  'endHeading',
  'startAnchor',
  'endAnchor',
  'sectionHash',
  'rangeRole'
];

assert.equal(
  packageJson.scripts['check:knr-w2r1-t07'],
  'node scripts/check-knr-w2r1-t07-canonical-node-mapping-identity.mjs'
);
assert.equal(mapping.schemaVersion, '1.0.0');
assert.equal(mapping.stage, 'KNR-W2R1-T07');
assert.equal(mapping.bookCode, manifest.bookCode);
assert.equal(mapping.locale, manifest.locale);
assert.equal(mapping.sourceVersion, manifest.manuscriptVersion);
assert.equal(mapping.blueprintPath, blueprintRelative);
assert.equal(mapping.blueprintContract, blueprint.contract);
assert.equal(mapping.inventoryPath, inventoryRelative);
assert.equal(
  mapping.coverageAuthority,
  'blueprint.parts.nodes_cross_checked_with_blueprint.nodes'
);
assert.deepEqual(mapping.allowedMappingStatuses, [
  'unmapped',
  'candidate',
  'human_review_required',
  'mapped',
  'conflicted',
  'insufficient_source'
]);
assert.deepEqual(mapping.allowedRangeRoles, [
  'primary',
  'supporting',
  'continuity',
  'distinction',
  'example',
  'boundary'
]);
assert.deepEqual(mapping.mappingAuthority, {
  automationMaximumStatus: 'candidate',
  mappedRequires: {
    reviewerRole: 'TL',
    reviewStatus: 'approved',
    humanVerified: true,
    authorityStatus: 'human_confirmed'
  }
});
assert.deepEqual(mapping.manuscriptBodyPolicy, {
  storage: 'references_only',
  continuousBodyAllowed: false,
  gitEligible: false,
  publicBuildEligible: false,
  productionPackageEligible: false
});
assert(!mappingSource.includes('.tmp/knowledge-manuscripts/'));
assert(!/"(?:body|content|markdown|paragraphs|excerpt|continuousText)"\s*:/u.test(mappingSource));
assert(!/publicUrl|presignedUrl|secretAccessKey|accessKeyId|apiToken|credential/u.test(mappingSource));

assert.equal(mapping.mappings.length, blueprintNodes.length);
assert.deepEqual(
  mapping.mappings.map(record => record.nodeCode),
  blueprintNodes.map(node => node.nodeCode)
);
for (const part of blueprint.parts) {
  assert.equal(
    mapping.mappings.filter(record => record.partCode === part.partCode).length,
    part.nodes.length,
    `${part.partCode} coverage must be derived from Blueprint`
  );
}

const inventoryByPart = new Map(inventory.parts.map(part => [part.partCode, part]));
for (const [index, record] of mapping.mappings.entries()) {
  const blueprintNode = blueprintNodes[index];
  const inventoryPart = inventoryByPart.get(record.partCode);
  assert(requiredFields.every(field => Object.hasOwn(record, field)), `${record.nodeCode} fields`);
  assert.equal(record.nodeCode, blueprintNode.nodeCode);
  assert.equal(record.partCode, blueprintNode.partCode);
  assert.equal(record.bookCode, manifest.bookCode);
  assert.equal(record.locale, manifest.locale);
  assert.equal(record.sourceObjectKey, inventoryPart.sourceObjectKey);
  assert.equal(record.sourceVersion, manifest.manuscriptVersion);
  assert.equal(record.publicExtractionPolicy, 'prohibited');
  assert.equal(record.review.reviewerRole, 'TL');
  if (record.mappingStatus === 'mapped') {
    assert.equal(record.authorityStatus, 'human_confirmed');
    assert.equal(record.review.status, 'approved');
    assert.equal(record.review.humanVerified, true);
    assert(record.review.reviewedBy);
    assert(record.review.reviewedAt);
  } else {
    assert.deepEqual(record.crossSectionReferences, []);
    assert.equal(record.review.humanVerified, false);
    assert.equal(record.review.reviewedBy, null);
    assert.equal(record.review.reviewedAt, null);
  }
  assert.equal(record.stalenessStatus, inventoryPart.stalenessStatus);
}

const p0Records = mapping.mappings.filter(record => record.partCode === 'P0');
const laterRecords = mapping.mappings.filter(record => record.partCode !== 'P0');
assert.equal(p0Records.length, blueprint.parts.find(part => part.partCode === 'P0').nodes.length);
const p0CandidateRound = p0Records.every(record => record.mappingStatus === 'candidate');
const p0MappedRound = p0Records.every(record => record.mappingStatus === 'mapped');
assert(p0CandidateRound || p0MappedRound, 'P0 must be wholly candidate or atomically TL-mapped');
if (p0CandidateRound) {
  assert(p0Records.every(record => record.authorityStatus === 'automation_candidate'));
  assert(p0Records.every(record => record.extractionEligibility === 'private_candidate_only'));
  assert(p0Records.every(record => record.review.status === 'pending_tl_review'));
  assert(p0Records.every(record => record.ranges.length === 1));
  for (const record of p0Records) {
    const [range] = record.ranges;
    assert(requiredRangeFields.every(field => Object.hasOwn(range, field)));
    assert.equal(range.startHeading, inventory.parts[0].startHeading);
    assert.equal(range.endHeading, inventory.parts[0].endHeading);
    assert.equal(range.startAnchor, inventory.parts[0].startAnchor);
    assert.equal(range.endAnchor, inventory.parts[0].endAnchor);
    assert.equal(range.sectionHash, inventory.parts[0].sectionHash);
    assert.equal(range.rangeRole, 'primary');
    assert(record.unresolved.includes('exact_primary_range_requires_tl_confirmation'));
  }
} else {
  assert(p0Records.every(record => record.authorityStatus === 'human_confirmed'));
  assert(p0Records.every(record => record.extractionEligibility === 'private_mapped_only'));
  assert(p0Records.every(record => record.review.status === 'approved'));
  assert(p0Records.every(record => record.review.reviewerRole === 'TL'));
  assert(p0Records.every(record => record.review.humanVerified === true));
  assert(p0Records.every(record => record.unresolved.length === 0));
  assert(p0Records.every(record => record.ranges.some(range => range.rangeRole === 'primary')));
}
assert(laterRecords.every(record => record.mappingStatus === 'unmapped'));
assert(laterRecords.every(record => record.authorityStatus === 'unassigned'));
assert(laterRecords.every(record => record.extractionEligibility === 'blocked_not_materialized'));
assert(laterRecords.every(record => record.ranges.length === 0));
assert(laterRecords.every(record => record.review.status === 'not_started'));

assert.equal(validateBookINodeMapping(mapping, { manifest, blueprint, inventory }), mapping);
if (p0CandidateRound) {
  assert.deepEqual(
    deriveInitialBookINodeMapping({ manifest, blueprint, inventory }),
    mapping,
    'The initial Mapping must remain a deterministic Blueprint-derived first-round identity'
  );
}

const missingNode = clone(mapping);
missingNode.mappings.pop();
assert.throws(
  () => validateBookINodeMapping(missingNode, { manifest, blueprint, inventory }),
  error => error.code === 'NODE_MAPPING_BLUEPRINT_COVERAGE_MISMATCH'
);
const embeddedBody = clone(mapping);
embeddedBody.mappings[0].body = 'Manuscript body is not mapping metadata.';
assert.throws(
  () => validateBookINodeMapping(embeddedBody, { manifest, blueprint, inventory }),
  error => error.code === 'MANUSCRIPT_BODY_NOT_ALLOWED_IN_MAPPING'
);
const invalidRangeRole = clone(mapping);
invalidRangeRole.mappings[0].ranges[0].rangeRole = 'illustrative';
assert.throws(
  () => validateBookINodeMapping(invalidRangeRole, { manifest, blueprint, inventory }),
  error => error.code === 'NODE_MAPPING_RANGE_CONTRACT_MISMATCH'
);
const automatedMapped = clone(mapping);
automatedMapped.mappings[0].mappingStatus = 'mapped';
assert.throws(
  () => validateBookINodeMapping(automatedMapped, { manifest, blueprint, inventory }),
  error => error.code === 'NODE_MAPPING_MAPPED_REQUIRES_TL_APPROVAL'
);
const tlMapped = clone(mapping);
tlMapped.mappings[0].mappingStatus = 'mapped';
tlMapped.mappings[0].authorityStatus = 'human_confirmed';
tlMapped.mappings[0].review = {
  status: 'approved',
  reviewerRole: 'TL',
  humanVerified: true,
  reviewedBy: 'tl-reviewer',
  reviewedAt: '2026-08-04T00:00:00.000Z'
};
assert.equal(validateBookINodeMapping(tlMapped, { manifest, blueprint, inventory }), tlMapped);

const report = await runBookIManuscriptCommand('map', ['--dry-run'], {
  manifest,
  blueprint,
  inventory,
  mapping
});
assert.equal(report.stage, 'KNR-W2R1-T07');
assert.equal(report.status, 'registered');
assert.equal(report.mappingFilePresent, true);
assert.equal(report.blueprintNodeCount, blueprintNodes.length);
assert.equal(report.mappingRecordCount, blueprintNodes.length);
assert.equal(
  p0CandidateRound ? report.mappingStatusCounts.candidate : report.mappingStatusCounts.mapped,
  p0Records.length
);
assert.equal(report.mappingStatusCounts.unmapped, laterRecords.length);
assert.deepEqual(report.staleNodeCodes, []);
assert.equal(report.staleArtifactReuseBlocked, false);
assert.equal(report.automationMaximumStatus, 'candidate');
assert.equal(report.automaticHumanVerification, false);
assert.equal(report.automaticMappedStatus, false);
assert.equal(report.mappedStatusRequiresTL, true);
assert.equal(report.manuscriptBodyStored, false);
assert.equal(report.publicExtractionAllowed, false);
assert.equal(report.writes, 0);
assert.equal(report.productionModified, false);
assert.equal(report.nextImplementation, 'KNR-W2R1-T08');

const changedManifest = clone(manifest);
changedManifest.contentHashes.normalizedParts.P0 = '0'.repeat(64);
const staleReport = await runBookIManuscriptCommand('map', ['--dry-run'], {
  manifest: changedManifest,
  blueprint,
  inventory,
  mapping
});
assert.equal(staleReport.status, 'MANUSCRIPT_STALE');
assert.deepEqual(staleReport.staleNodeCodes, p0Records.map(record => record.nodeCode));
assert.equal(staleReport.staleArtifactReuseBlocked, true);
assert(staleReport.staleNodeStates.filter(state => state.partCode === 'P0').every(
  state => state.reuseBlocked && state.invalidatedArtifacts.includes('mapping')
));
assert.equal(
  staleReport.nextImplementation,
  'FRESH_EXTRACTION_MAPPING_CANDIDATE_AND_PROMPT_REVIEW_REQUIRED'
);
assert.equal(staleReport.writes, 0);

console.log('✓ KNR-W2R1-T07 Canonical Node Mapping Identity contract passed.');
console.log('  Mapping coverage is derived from the Book I Blueprint node arrays; no fixed portfolio count is used.');
console.log(`  P0 is ${p0CandidateRound ? 'automation-candidate for TL review' : 'atomically TL-mapped'}; unmaterialized P1–P5 remain unmapped.`);
console.log('  Automation cannot grant mapped authority, and mapped status requires explicit TL approval evidence.');
console.log('  Section Hash drift becomes MANUSCRIPT_STALE and blocks Mapping, Candidate and Prompt reuse.');
console.log('  Mapping stores references and hashes only—no continuous manuscript body or public extraction right.');
