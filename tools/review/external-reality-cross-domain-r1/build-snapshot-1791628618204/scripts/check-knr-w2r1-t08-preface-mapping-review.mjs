import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  deriveBookIBlueprintNodes,
  deriveInitialBookINodeMapping,
  validateBookINodeMapping
} from './book-i-manuscript.mjs';
import {
  P0_CANDIDATE_RELATIVE,
  P0_EXTRACTION_REPORT_RELATIVE,
  P0_HUMAN_REVIEW_RELATIVE,
  P0_R2_TARGET,
  REQUIRED_REVIEW_CHECKS
} from './lib/knowledge-manuscripts/p0-human-review.mjs';
import {
  P0_BLUEPRINT_RELATIVE,
  P0_INVENTORY_RELATIVE,
  P0_MAPPING_MANIFEST_RELATIVE,
  P0_MAPPING_RELATIVE,
  P0_MAPPING_REVIEW_RELATIVE,
  REQUIRED_MAPPING_REVIEW_CHECKS,
  applyApprovedP0Mapping,
  createP0MappingReviewTemplate,
  evaluateP0MappingReview
} from './lib/knowledge-manuscripts/p0-mapping-review.mjs';
import {
  parseP0MappingReviewArgs,
  runP0MappingReviewCommand
} from './review-book-i-p0-mapping.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(repositoryRoot, relative), 'utf8');
const json = relative => JSON.parse(read(relative));
const clone = value => JSON.parse(JSON.stringify(value));
const sha256 = value => createHash('sha256').update(value).digest('hex');
const jsonText = value => `${JSON.stringify(value, null, 2)}\n`;

const packageJson = json('package.json');
const repositoryManifest = json(P0_MAPPING_MANIFEST_RELATIVE);
const repositoryInventory = json(P0_INVENTORY_RELATIVE);
const repositoryBlueprint = json(P0_BLUEPRINT_RELATIVE);
const repositoryMappingSource = read(P0_MAPPING_RELATIVE);
const repositoryMapping = JSON.parse(repositoryMappingSource);
const implementationSource = read('scripts/lib/knowledge-manuscripts/p0-mapping-review.mjs');
const cliSource = read('scripts/review-book-i-p0-mapping.mjs');
const blueprintNodes = deriveBookIBlueprintNodes(repositoryBlueprint, repositoryManifest);
const p0BlueprintNodes = blueprintNodes.filter(node => node.partCode === 'P0');

assert.equal(
  packageJson.scripts['knowledge:manuscript:review-map-p0'],
  'node scripts/review-book-i-p0-mapping.mjs review'
);
assert.equal(
  packageJson.scripts['knowledge:manuscript:apply-map-p0'],
  'node scripts/review-book-i-p0-mapping.mjs apply'
);
assert.equal(
  packageJson.scripts['check:knr-w2r1-t08'],
  'node scripts/check-knr-w2r1-t08-preface-mapping-review.mjs'
);
assert.deepEqual(REQUIRED_MAPPING_REVIEW_CHECKS, [
  'primaryRange',
  'supportingRange',
  'crossSectionReferences',
  'rangeSufficiency',
  'conflict',
  'distinction',
  'boundary',
  'paidBookSubstitutionRisk'
]);
assert(P0_MAPPING_REVIEW_RELATIVE.startsWith('.tmp/knowledge-manuscripts/'));
assert.deepEqual(parseP0MappingReviewArgs('review', []), { command: 'review', mode: 'dry-run' });
assert.equal(parseP0MappingReviewArgs('review', ['--prepare']).mode, 'prepare');
assert.equal(parseP0MappingReviewArgs('apply', []).mode, 'dry-run');
assert.equal(parseP0MappingReviewArgs('apply', ['--apply']).mode, 'apply');
assert.throws(
  () => parseP0MappingReviewArgs('review', ['--dry-run', '--prepare']),
  error => error.code === 'P0_MAPPING_REVIEW_MODE_CONFLICT'
);
assert.throws(
  () => parseP0MappingReviewArgs('apply', ['--dry-run', '--apply']),
  error => error.code === 'P0_MAPPING_APPLY_MODE_CONFLICT'
);
assert(!/publicUrl|presignedUrl|r2\.dev|PutObject|GetObject|HeadObject/u.test(
  `${implementationSource}\n${cliSource}`
));
assert(!/PHIOS_MANUSCRIPT_R2_(?:ACCOUNT_ID|ACCESS_KEY_ID|SECRET_ACCESS_KEY)/u.test(
  `${implementationSource}\n${cliSource}`
));
assert(!implementationSource.includes('production/kn-preface-001'));
assert(!implementationSource.includes('content/knowledge/articles'));
assert(!implementationSource.includes('public/'));

const currentP0 = repositoryMapping.mappings.filter(record => record.partCode === 'P0');
assert.equal(currentP0.length, p0BlueprintNodes.length);
const repositoryCandidateRound = currentP0.every(record => record.mappingStatus === 'candidate');
const repositoryMappedRound = currentP0.every(record => record.mappingStatus === 'mapped');
assert(
  repositoryCandidateRound || repositoryMappedRound,
  'P0 must be wholly candidate or atomically TL-mapped'
);
if (repositoryCandidateRound) {
  assert(currentP0.every(record => record.authorityStatus === 'automation_candidate'));
  assert(currentP0.every(record => record.review.humanVerified === false));
} else {
  assert(currentP0.every(record => record.authorityStatus === 'human_confirmed'));
  assert(currentP0.every(record => record.review.status === 'approved'));
  assert(currentP0.every(record => record.review.reviewerRole === 'TL'));
  assert(currentP0.every(record => record.review.humanVerified === true));
  assert(currentP0.every(record => record.publicExtractionPolicy === 'prohibited'));
}

const candidateSegments = p0BlueprintNodes.map(node => [
  `## ${node.titleZhHans}`,
  `${node.nodeCode} 起始锚点。`,
  `${node.nodeCode} 的私有测试段落仅用于验收审核工具。`
].join('\n'));
const candidateText = [
  '---',
  'schemaVersion: PHI-OS-KNR-W2R1-P0-CANDIDATE-v1.0.0',
  'bookCode: BOOK-1',
  'partCode: P0',
  '---',
  '',
  '# 为什么需要 PHI OS',
  '',
  ...candidateSegments
].join('\n\n');
const candidateHash = sha256(candidateText);
const manifest = clone(repositoryManifest);
manifest.contentHashes.normalizedParts.P0 = candidateHash;
const inventory = clone(repositoryInventory);
const p0Inventory = inventory.parts.find(part => part.partCode === 'P0');
p0Inventory.sectionHash = candidateHash;
const mapping = deriveInitialBookINodeMapping({
  manifest: repositoryManifest,
  blueprint: repositoryBlueprint,
  inventory: repositoryInventory
});
for (const record of mapping.mappings.filter(item => item.partCode === 'P0')) {
  for (const range of record.ranges) range.sectionHash = candidateHash;
}
const mappingSource = jsonText(mapping);
const context = {
  manifest,
  inventory,
  blueprint: repositoryBlueprint,
  mapping,
  mappingSha256: sha256(mappingSource),
  candidate: {
    path: P0_CANDIDATE_RELATIVE,
    sha256: candidateHash,
    sizeBytes: Buffer.byteLength(candidateText),
    characterCount: candidateText.length,
    text: candidateText,
    headings: [
      '为什么需要 PHI OS',
      ...p0BlueprintNodes.map(node => node.titleZhHans)
    ]
  }
};

const fixedNow = () => new Date('2026-08-04T04:00:00.000Z');
const template = createP0MappingReviewTemplate(context, { now: fixedNow });
assert.equal(template.stage, 'KNR-W2R1-T08');
assert.equal(template.mapping.applyPolicy, 'atomic_after_all_p0_nodes_approved');
assert.equal(template.nodes.length, p0BlueprintNodes.length);
assert.deepEqual(template.nodes.map(node => node.nodeCode), p0BlueprintNodes.map(node => node.nodeCode));
assert(template.nodes.every(node => node.decision === 'pending'));
assert(template.nodes.every(node => node.ranges.length === 0));
assert(template.nodes.every(node => REQUIRED_MAPPING_REVIEW_CHECKS.every(
  check => node.checks[check] === false
)));
assert.equal(template.publicBoundary.manuscriptBodyStored, false);
assert.equal(template.publicBoundary.publicExtractionAllowed, false);
assert.equal(template.publicBoundary.paidBookSubstitutionAllowed, false);

const pendingEvaluation = evaluateP0MappingReview(template, context);
assert.equal(pendingEvaluation.status, 'human_review_required');
assert.equal(pendingEvaluation.approvedNodeCount, 0);
assert.equal(pendingEvaluation.blockedNodeCount, p0BlueprintNodes.length);
assert.equal(pendingEvaluation.readyForApply, false);

function approveTemplate(value) {
  const approved = clone(value);
  for (const [index, node] of approved.nodes.entries()) {
    const nextNode = approved.nodes[index + 1] || null;
    node.decision = 'approved';
    node.checks = Object.fromEntries(REQUIRED_MAPPING_REVIEW_CHECKS.map(check => [check, true]));
    node.ranges = [{
      rangeCode: `${node.nodeCode}-R01`,
      startHeading: node.titleZhHans,
      endHeading: nextNode?.titleZhHans || null,
      startAnchor: `${node.nodeCode} 起始锚点。`,
      endAnchor: nextNode ? `${nextNode.nodeCode} 起始锚点。` : null,
      sectionHash: candidateHash,
      rangeRole: 'primary'
    }];
    node.crossSectionReferences = [];
    node.unresolved = [];
    node.conflict = { status: 'none', resolution: null };
    node.paidBookSubstitutionRisk = {
      status: 'controlled',
      control: 'mapping_metadata_only_no_continuous_body'
    };
    node.reviewerRole = 'TL';
    node.reviewedBy = 'tl-fixture-reviewer';
    node.reviewedAt = '2026-08-04T04:15:00.000Z';
  }
  return approved;
}

const approvedReview = approveTemplate(template);
const approvedEvaluation = evaluateP0MappingReview(approvedReview, context);
assert.equal(approvedEvaluation.status, 'ready_for_atomic_apply');
assert.equal(approvedEvaluation.approvedNodeCount, p0BlueprintNodes.length);
assert.equal(approvedEvaluation.blockedNodeCount, 0);
assert.equal(approvedEvaluation.readyForApply, true);

const mapped = applyApprovedP0Mapping(approvedReview, context);
const mappedP0 = mapped.mappings.filter(record => record.partCode === 'P0');
assert.equal(mappedP0.length, p0BlueprintNodes.length);
assert(mappedP0.every(record => record.mappingStatus === 'mapped'));
assert(mappedP0.every(record => record.authorityStatus === 'human_confirmed'));
assert(mappedP0.every(record => record.extractionEligibility === 'private_mapped_only'));
assert(mappedP0.every(record => record.review.status === 'approved'));
assert(mappedP0.every(record => record.review.reviewerRole === 'TL'));
assert(mappedP0.every(record => record.review.humanVerified === true));
assert(mappedP0.every(record => record.review.confirmations.length === REQUIRED_MAPPING_REVIEW_CHECKS.length));
assert(mappedP0.every(record => record.review.paidBookSubstitutionRisk.status === 'controlled'));
assert(mappedP0.every(record => (
  record.review.paidBookSubstitutionRisk.control ===
  'mapping_metadata_only_no_continuous_body'
)));
assert(mappedP0.every(record => record.publicExtractionPolicy === 'prohibited'));
assert(mappedP0.every(record => record.unresolved.length === 0));
assert(mapped.mappings.filter(record => record.partCode !== 'P0').every(
  record => record.mappingStatus === 'unmapped'
));
assert.equal(validateBookINodeMapping(mapped, {
  manifest,
  blueprint: repositoryBlueprint,
  inventory
}), mapped);
const mappedSource = JSON.stringify(mapped);
assert(!mappedSource.includes('私有测试段落'));
assert(!/"(?:body|content|markdown|paragraphs|excerpt|continuousText)"\s*:/u.test(mappedSource));

const missingCheck = clone(approvedReview);
missingCheck.nodes[0].checks.boundary = false;
const missingCheckEvaluation = evaluateP0MappingReview(missingCheck, context);
assert.equal(missingCheckEvaluation.readyForApply, false);
assert(missingCheckEvaluation.nodeResults[0].blockers.includes('check_missing:boundary'));
const conflict = clone(approvedReview);
conflict.nodes[0].conflict.status = 'unresolved';
assert(evaluateP0MappingReview(conflict, context).nodeResults[0].blockers.includes(
  'conflict_not_cleared'
));
const conflictWithoutResolution = clone(approvedReview);
conflictWithoutResolution.nodes[0].conflict = { status: 'resolved', resolution: null };
assert(evaluateP0MappingReview(
  conflictWithoutResolution,
  context
).nodeResults[0].blockers.includes('conflict_resolution_required'));
const substitutionRisk = clone(approvedReview);
substitutionRisk.nodes[0].paidBookSubstitutionRisk.status = 'not_reviewed';
assert(evaluateP0MappingReview(substitutionRisk, context).nodeResults[0].blockers.includes(
  'paid_book_substitution_risk_not_controlled'
));
const staleContext = { ...context, candidate: { ...context.candidate, sha256: '0'.repeat(64) } };
assert.throws(
  () => evaluateP0MappingReview(approvedReview, staleContext),
  error => error.code === 'P0_MAPPING_REVIEW_MANUSCRIPT_STALE'
);

function writeJson(root, relative, value) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, jsonText(value), 'utf8');
}

const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'phios-knr-w2r1-t08-'));
try {
  writeJson(fixtureRoot, P0_MAPPING_MANIFEST_RELATIVE, manifest);
  writeJson(fixtureRoot, P0_INVENTORY_RELATIVE, inventory);
  writeJson(fixtureRoot, P0_BLUEPRINT_RELATIVE, repositoryBlueprint);
  writeJson(fixtureRoot, P0_MAPPING_RELATIVE, mapping);
  const candidateFile = path.join(fixtureRoot, P0_CANDIDATE_RELATIVE);
  fs.mkdirSync(path.dirname(candidateFile), { recursive: true });
  fs.writeFileSync(candidateFile, candidateText, { encoding: 'utf8', mode: 0o600 });
  writeJson(fixtureRoot, P0_EXTRACTION_REPORT_RELATIVE, {
    stage: 'KNR-W2R1-T04',
    bookCode: 'BOOK-1',
    partCode: 'P0',
    extractionMethod: 'searchable_pdf_text_layer',
    ocrUsed: false,
    candidate: {
      path: P0_CANDIDATE_RELATIVE,
      sha256: candidateHash,
      characterCount: candidateText.length
    },
    r2TargetObjectKey: P0_R2_TARGET,
    r2UploadPerformed: false,
    productionModified: false
  });
  writeJson(fixtureRoot, P0_HUMAN_REVIEW_RELATIVE, {
    stage: 'KNR-W2R1-T05',
    bookCode: 'BOOK-1',
    partCode: 'P0',
    reviewerRole: 'TL',
    reviewedAt: '2026-08-04T03:00:00.000Z',
    candidate: { sha256: candidateHash },
    reviewChecklist: Object.fromEntries(REQUIRED_REVIEW_CHECKS.map(check => [check, true])),
    normalizationStatus: 'human_verified',
    humanVerified: true
  });

  const initialStatus = runP0MappingReviewCommand('review', ['--dry-run'], {
    root: fixtureRoot,
    now: fixedNow
  });
  assert.equal(initialStatus.status, 'review_template_required');
  assert.equal(initialStatus.writes, 0);
  const prepared = runP0MappingReviewCommand('review', ['--prepare'], {
    root: fixtureRoot,
    now: fixedNow
  });
  assert.equal(prepared.status, 'human_review_required');
  assert.equal(prepared.writes, 1);
  const reviewFile = path.join(fixtureRoot, P0_MAPPING_REVIEW_RELATIVE);
  const fixtureReview = JSON.parse(fs.readFileSync(reviewFile, 'utf8'));
  fs.writeFileSync(reviewFile, jsonText(approveTemplate(fixtureReview)), 'utf8');

  const applyDryRun = runP0MappingReviewCommand('apply', ['--dry-run'], {
    root: fixtureRoot,
    now: fixedNow
  });
  assert.equal(applyDryRun.status, 'ready_for_atomic_apply');
  assert.equal(applyDryRun.mappingWrites, 0);
  const applied = runP0MappingReviewCommand('apply', ['--apply'], {
    root: fixtureRoot,
    now: fixedNow
  });
  assert.equal(applied.status, 'mapped');
  assert.equal(applied.mappingWrites, 1);
  assert.equal(applied.writes, 2);
  const appliedMapping = JSON.parse(fs.readFileSync(path.join(fixtureRoot, P0_MAPPING_RELATIVE), 'utf8'));
  assert(appliedMapping.mappings.filter(record => record.partCode === 'P0').every(
    record => record.mappingStatus === 'mapped' && record.authorityStatus === 'human_confirmed'
  ));
  const applicationReceipt = JSON.parse(fs.readFileSync(reviewFile, 'utf8'));
  assert.equal(applicationReceipt.application.status, 'applied');
  assert.equal(applicationReceipt.application.appliedMappingSha256, applied.mappingSha256);
  const repeated = runP0MappingReviewCommand('apply', ['--apply'], {
    root: fixtureRoot,
    now: fixedNow
  });
  assert.equal(repeated.status, 'already_mapped');
  assert.equal(repeated.writes, 0);
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('✓ KNR-W2R1-T08 Preface Mapping Review contract passed.');
console.log('  P0 review order and count are derived from the Book I Blueprint, never from a fixed node total.');
console.log('  Every Node requires eight explicit TL checks, exact private Anchors, current Section Hash and cleared conflicts.');
console.log('  One incomplete Node blocks the atomic transition; automation alone cannot produce mapped authority.');
console.log('  Approved Mapping retains metadata only, prohibits public extraction and controls paid-book substitution risk.');
console.log('  Private Candidate and TL review evidence remain under .tmp; Production and R2 are unchanged.');
