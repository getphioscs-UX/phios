import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  buildC2,
  contentHash,
  resolveHumanEditorialFreezeResolutions
} from './lib/knowledge-readiness/canonical-thesis-boundary.mjs';

const root = process.cwd();
const readJson = async relativePath => JSON.parse(await fs.readFile(path.join(root, relativePath), 'utf8'));
const expected = [
  { nodeCode: 'KN-PREFACE-004', titleZhHans: '为什么需要 PHI OS', knowledgeVersion: '1.1.0', legacyCodes: [] },
  { nodeCode: 'KN-B1-P1-003', titleZhHans: '为什么现实需要结构', knowledgeVersion: '1.0.0', legacyCodes: ['KAU-E2-REL-0018', 'KAU-E2-REL-0020', 'KAU-E2-REL-0021'] },
  { nodeCode: 'KN-B1-P4-003', titleZhHans: '初始化状态如何嵌入坐标并形成长期稳定', knowledgeVersion: '1.0.0', legacyCodes: [] },
  { nodeCode: 'KN-B1-P4-004', titleZhHans: '为什么身体是分层且有限的现实载体', knowledgeVersion: '1.0.0', legacyCodes: ['KAU-E2-REL-0019', 'KAU-E2-REL-0024', 'KAU-E2-REL-0042', 'KAU-E2-REL-0053', 'KAU-E2-REL-0088'] }
];
const requiredDimensions = [
  'CANONICAL_THESIS',
  'ARTICLE_BOUNDARY',
  'SUPPORTING_QUESTION_BOUNDARY',
  'SEQUENCE_BOUNDARY',
  'CLAIM_BOUNDARY',
  'SOURCE_BOUNDARY',
  'FIGURE_BOUNDARY',
  'PUBLIC_CONTENT_BOUNDARY',
  'CROSS_NODE_BOUNDARY'
];
const noEffects = {
  c2Frozen: false,
  c3Rebuilt: false,
  productionDecisionCreated: false,
  productionPlanFrozen: false,
  productionWaveFrozen: false,
  kpeAuthorityCreated: false,
  kpeActivated: false,
  pjaCandidateCreated: false,
  carCandidateCreated: false,
  published: false
};
const paths = {
  schema: 'content/knowledge/production-planning/schemas/wave1-c2-human-editorial-freeze-resolution-v1.schema.json',
  contract: 'content/knowledge/production-planning/contracts/wave1-c2-human-editorial-freeze-resolution-v1.json',
  resolution: 'content/knowledge/production-planning/review/wave1-c2-human-editorial-freeze-resolution-v1.json',
  reviewRegistry: 'content/knowledge/production-planning/review/wave1-c2-human-editorial-review-package-registry-v1.json',
  nodes: 'content/knowledge/registry/nodes.json',
  blueprint: 'content/knowledge/blueprints/book-1-knowledge-blueprint.json',
  manuscriptMapping: 'content/knowledge/manuscripts/book-1/node-manuscript-mapping.json',
  legacy: 'content/knowledge/authoring/extensions/legacy-supporting-source/registries/legacy-accepted-supporting-relationship-registry-v1.json',
  humanDecisions: 'content/knowledge/production-planning/registries/kpp-human-production-decision-registry-v1.json',
  planFreeze: 'content/knowledge/production-planning/registries/kpp-production-plan-freeze-registry-v1.json',
  waves: 'content/knowledge/production-planning/registries/kpp-production-wave-registry-v2.json',
  pjaHandoffs: 'content/knowledge/production-planning/registries/kpp-pja-handoff-registry-v1.json',
  carHandoffs: 'content/knowledge/production-planning/registries/kpp-car-handoff-registry-v1.json',
  package: 'package.json'
};

const documents = Object.fromEntries(await Promise.all(
  Object.entries(paths).map(async ([key, relativePath]) => [key, await readJson(relativePath)])
));
const candidates = Object.fromEntries(await Promise.all(expected.map(async item => [
  item.nodeCode,
  await readJson(`content/knowledge/editorial/c2/candidates/${item.nodeCode.toLowerCase()}.json`)
])));
const assessments = Object.fromEntries(await Promise.all(expected.map(async item => [
  item.nodeCode,
  await readJson(`content/knowledge/editorial/c3/assessments/${item.nodeCode.toLowerCase()}-production-readiness.json`)
])));

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(documents.schema);
assert.equal(
  validate(documents.resolution),
  true,
  `Wave 1 C2 freeze resolution schema failure:\n${JSON.stringify(validate.errors, null, 2)}`
);

assert.equal(documents.contract.status, 'ESTABLISHED_PENDING_HUMAN');
assert.equal(documents.contract.proposalAuthority.proposalIsCanonicalKnowledge, false);
assert.equal(documents.contract.proposalAuthority.proposalIsHumanDecision, false);
assert.equal(documents.contract.proposalAuthority.proposalMayFreezeC2, false);
assert.equal(documents.contract.c3Boundary.c2FreezeIsC3Readiness, false);
assert.equal(documents.contract.c3Boundary.c3MustBeRebuiltAfterFreeze, true);
assert.equal(documents.contract.kpeBoundary.currentMainAuthorityStatus, 'NOT_PRESENT_IN_CURRENT_MAIN');
assert.equal(documents.contract.kpeBoundary.mayBeEstablishedBeforeC2AndC3, false);
assert.equal(documents.contract.legacySupportingBoundary.mayBecomeCanonicalThesis, false);
assert.equal(documents.contract.legacySupportingBoundary.mayRaiseProductionReadiness, false);
assert.equal(documents.contract.checkerBoundary.mutate, false);
assert.equal(documents.contract.checkerBoundary.approve, false);
assert.equal(documents.contract.checkerBoundary.freeze, false);

assert.equal(documents.resolution.baselineCommit, '5430224d5fb21232d77c19b0f854ba4f802a73a7');
assert.equal(documents.resolution.status, 'OPEN_PENDING_HUMAN');
assert.equal(documents.resolution.proposalAuthority, 'AI_EDITORIAL_RECOMMENDATION_ONLY');
assert.deepEqual(documents.resolution.effects, noEffects);
assert.equal(documents.resolution.sourcePackageSetDigest, documents.reviewRegistry.digestBinding.packageSetDigest);
assert.equal(documents.reviewRegistry.digestBinding.packageSetDigest, digest(documents.reviewRegistry.packages));
assert.deepEqual(documents.resolution.entries.map(entry => entry.nodeCode), expected.map(item => item.nodeCode));
assert.equal(new Set(documents.resolution.entries.map(entry => entry.nodeCode)).size, expected.length);

const nodeByCode = new Map(documents.nodes.nodes.map(node => [node.nodeCode, node]));
const blueprintEntries = collectObjectsByNodeCode(documents.blueprint, new Set(expected.map(item => item.nodeCode)));
const blueprintByCode = new Map(blueprintEntries.map(entry => [entry.nodeCode, entry]));
const mappingByCode = new Map(documents.manuscriptMapping.mappings.map(mapping => [mapping.nodeCode, mapping]));
const reviewByCode = new Map(documents.reviewRegistry.packages.map(reviewPackage => [reviewPackage.nodeCode, reviewPackage]));
const legacyByCode = new Map(documents.legacy.entries.map(entry => [entry.relationshipCode, entry]));

for (const expectedItem of expected) {
  const entry = documents.resolution.entries.find(item => item.nodeCode === expectedItem.nodeCode);
  const node = nodeByCode.get(expectedItem.nodeCode);
  const blueprint = blueprintByCode.get(expectedItem.nodeCode);
  const mapping = mappingByCode.get(expectedItem.nodeCode);
  const reviewPackage = reviewByCode.get(expectedItem.nodeCode);
  const candidate = candidates[expectedItem.nodeCode];
  const assessment = assessments[expectedItem.nodeCode];

  assert.ok(entry && node && blueprint && mapping && reviewPackage);
  assert.equal(entry.titleZhHans, expectedItem.titleZhHans);
  assert.equal(entry.knowledgeVersion, expectedItem.knowledgeVersion);
  assert.equal(entry.knowledgeVersion, node.version);
  assert.equal(entry.titleZhHans, blueprint.titleZhHans);
  assert.equal(entry.reviewPackageCode, reviewPackage.packageCode);
  assert.equal(entry.approvalState, 'pending_human');
  assert.equal(entry.promotionAllowed, false);
  assert.equal(entry.manuscriptMappingReview.humanVerified, false);
  assert.equal(mapping.mappingStatus, 'candidate');
  assert.equal(mapping.review.humanVerified, false);
  assert.match(entry.manuscriptMappingReview.reference, new RegExp(`#${expectedItem.nodeCode}$`));
  assert.equal(entry.proposalContentHash, contentHash(entry.proposedContent));
  assert.deepEqual(entry.reviewDimensionProposals.map(item => item.dimension), requiredDimensions);
  assert(entry.reviewDimensionProposals.every(item => item.state === 'PENDING_HUMAN'));
  assert(entry.reviewDimensionProposals.every(item => item.humanFinding === null));
  assert(Object.values(entry.humanDecision).every(value => value === null));

  for (const reference of [...entry.sourceAuthorities, ...entry.supportingEvidenceReferences]) {
    await fs.access(path.join(root, reference.split('#')[0]));
  }
  const referencedLegacyCodes = entry.supportingEvidenceReferences.map(reference => reference.split('#')[1]);
  assert.deepEqual(referencedLegacyCodes, expectedItem.legacyCodes);
  for (const relationshipCode of referencedLegacyCodes) {
    const relationship = legacyByCode.get(relationshipCode);
    assert.ok(relationship, `Missing accepted Legacy relationship ${relationshipCode}`);
    assert.equal(relationship.state, 'ACCEPTED_SUPPORTING');
    assert.equal(relationship.supportingOnly, true);
    assert.equal(relationship.canonicalAuthority, false);
    assert.equal(relationship.productionDecisionAuthority, false);
    assert(relationship.canonicalNodeReferences.includes(expectedItem.nodeCode));
  }

  assert.equal(candidate.candidateThesis, null);
  assert.equal(candidate.candidateBoundaries, null);
  assert.equal(candidate.humanFreezeState, 'required');
  assert.equal(assessment.productionReady, false);
  assert.equal(assessment.authority.c2FreezeRecord, null);
  assert.ok(assessment.blocking.includes('C2_THESIS_BOUNDARY_NOT_FROZEN'));
}

assert.equal(documents.resolution.entries[0].publicationReconciliationProposal, 'RECONCILE_EXISTING_PUBLICATION_INTO_C2');
assert(documents.resolution.entries[0].evidenceLimitations.some(value => value.includes('Published Article')));
for (const entry of documents.resolution.entries.slice(1)) {
  assert.equal(entry.publicationReconciliationProposal, 'NO_EXISTING_PUBLICATION');
}

const computedProposalDigest = digest({
  baselineCommit: documents.resolution.baselineCommit,
  sourceReviewRegistry: documents.resolution.sourceReviewRegistry,
  sourcePackageSetDigest: documents.resolution.sourcePackageSetDigest,
  proposalAuthority: documents.resolution.proposalAuthority,
  entries: documents.resolution.entries.map(projectProposalEntry)
});
assert.equal(documents.resolution.proposalDigest, computedProposalDigest, 'Wave 1 C2 exact-content proposal drifted');

const currentResolution = resolveHumanEditorialFreezeResolutions(root);
assert.equal(currentResolution.approvedByNode.size, 0);
const currentC2 = buildC2(root);
for (const expectedItem of expected) {
  const indexEntry = currentC2.index.entries.find(entry => entry.nodeCode === expectedItem.nodeCode);
  assert.equal(indexEntry.status, 'human_review_required');
  assert.equal(indexEntry.freezeRecord, null);
}

const approvedFixture = structuredClone(documents.resolution);
const fixtureEntry = approvedFixture.entries[1];
fixtureEntry.approvalState = 'human_approved';
fixtureEntry.manuscriptMappingReview.humanVerified = true;
fixtureEntry.promotionAllowed = true;
fixtureEntry.humanDecision = {
  decision: 'freeze_approved',
  actor: 'TL',
  actorRole: 'HUMAN_EDITORIAL_AUTHORITY',
  decidedAt: '2026-08-10T18:00:00+08:00',
  rationale: 'In-memory validation fixture only; it creates no repository authority.',
  contentHash: fixtureEntry.proposalContentHash
};
fixtureEntry.reviewDimensionProposals = fixtureEntry.reviewDimensionProposals.map(item => ({
  ...item,
  state: 'HUMAN_APPROVED',
  humanFinding: 'In-memory Human-resolution contract fixture.'
}));
const fixtureResolution = resolveHumanEditorialFreezeResolutions(root, approvedFixture);
assert.deepEqual([...fixtureResolution.approvedByNode.keys()], ['KN-B1-P1-003']);
const invalidActorFixture = structuredClone(approvedFixture);
invalidActorFixture.entries[1].humanDecision.actor = 'AI';
assert.throws(
  () => resolveHumanEditorialFreezeResolutions(root, invalidActorFixture),
  error => error.code === 'C2_REAL_HUMAN_REVIEWER_REQUIRED'
);

assert.equal(documents.humanDecisions.decisions.length, 0);
assert.equal(documents.planFreeze.plans.length, 0);
assert.equal(documents.planFreeze.revisions.length, 0);
assert.equal(documents.waves.waves.length, 0);
assert.equal(documents.pjaHandoffs.handoffs.length, 0);
assert.equal(documents.carHandoffs.handoffs.length, 0);
assert.deepEqual(Object.keys(documents.package.scripts).filter(script => script.toLowerCase().includes('kpe')), []);

if (process.argv.includes('--print-digests')) {
  console.log(JSON.stringify({
    proposalDigest: computedProposalDigest,
    contentHashes: Object.fromEntries(documents.resolution.entries.map(entry => [entry.nodeCode, contentHash(entry.proposedContent)]))
  }, null, 2));
  process.exit(0);
}

console.log('✓ Wave 1 C2 Human Editorial Freeze Resolution foundation passed.');
console.log('✓ 4/4 exact-content proposals are digest-bound and remain pending_human; no C2 freeze was fabricated.');
console.log('✓ The existing PJA C2 builder accepts only a real Human reviewer, verified manuscript mapping, nine Human findings and a matching content hash.');
console.log('✓ C3, Human Production Decision, Frozen Plan/Wave, KPE authority/activation, PJA/CAR Candidate and Publication remain unchanged.');

function projectProposalEntry(entry) {
  return {
    nodeCode: entry.nodeCode,
    titleZhHans: entry.titleZhHans,
    knowledgeVersion: entry.knowledgeVersion,
    locale: entry.locale,
    reviewPackageCode: entry.reviewPackageCode,
    sourceAuthorities: entry.sourceAuthorities,
    supportingEvidenceReferences: entry.supportingEvidenceReferences,
    evidenceLimitations: entry.evidenceLimitations,
    manuscriptMappingReview: entry.manuscriptMappingReview,
    publicationReconciliationProposal: entry.publicationReconciliationProposal,
    proposedContent: entry.proposedContent,
    proposalContentHash: contentHash(entry.proposedContent),
    reviewDimensionRecommendations: entry.reviewDimensionProposals.map(({ dimension, recommendation }) => ({ dimension, recommendation }))
  };
}

function collectObjectsByNodeCode(value, allowed) {
  const found = [];
  const seen = new Set();
  const walk = current => {
    if (!current || typeof current !== 'object' || seen.has(current)) return;
    seen.add(current);
    if (!Array.isArray(current) && allowed.has(current.nodeCode)) found.push(current);
    for (const child of Object.values(current)) walk(child);
  };
  walk(value);
  return found;
}

function digest(value) {
  return `sha256:${crypto.createHash('sha256').update(canonicalJson(value)).digest('hex')}`;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
