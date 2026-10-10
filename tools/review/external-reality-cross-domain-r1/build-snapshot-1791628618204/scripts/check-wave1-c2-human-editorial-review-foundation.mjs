import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const root = process.cwd();
const readJson = async relativePath => JSON.parse(await fs.readFile(path.join(root, relativePath), 'utf8'));
const expected = [
  {
    nodeCode: 'KN-PREFACE-004',
    titleZhHans: '为什么需要 PHI OS',
    productionRole: 'ARTICLE',
    dispatchTarget: 'PJA',
    candidateReference: 'content/knowledge/editorial/c2/candidates/kn-preface-004.json',
    c3AssessmentReference: 'content/knowledge/editorial/c3/assessments/kn-preface-004-production-readiness.json'
  },
  {
    nodeCode: 'KN-B1-P1-003',
    titleZhHans: '为什么现实需要结构',
    productionRole: 'FRAGMENT',
    dispatchTarget: 'PJA',
    candidateReference: 'content/knowledge/editorial/c2/candidates/kn-b1-p1-003.json',
    c3AssessmentReference: 'content/knowledge/editorial/c3/assessments/kn-b1-p1-003-production-readiness.json'
  },
  {
    nodeCode: 'KN-B1-P4-003',
    titleZhHans: '初始化状态如何嵌入坐标并形成长期稳定',
    productionRole: 'FIGURE',
    dispatchTarget: 'CAR',
    candidateReference: 'content/knowledge/editorial/c2/candidates/kn-b1-p4-003.json',
    c3AssessmentReference: 'content/knowledge/editorial/c3/assessments/kn-b1-p4-003-production-readiness.json'
  },
  {
    nodeCode: 'KN-B1-P4-004',
    titleZhHans: '为什么身体是分层且有限的现实载体',
    productionRole: 'MULTI_ASSET',
    dispatchTarget: 'CAR',
    candidateReference: 'content/knowledge/editorial/c2/candidates/kn-b1-p4-004.json',
    c3AssessmentReference: 'content/knowledge/editorial/c3/assessments/kn-b1-p4-004-production-readiness.json'
  }
];
const selectedCodes = new Set(expected.map(item => item.nodeCode));
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
  kpeActivated: false,
  pjaCandidateCreated: false,
  carCandidateCreated: false,
  reviewApproved: false,
  published: false
};

const paths = {
  schema: 'content/knowledge/production-planning/schemas/wave1-c2-human-editorial-review-package-registry-v1.schema.json',
  contract: 'content/knowledge/production-planning/contracts/wave1-c2-human-editorial-review-foundation-v1.json',
  registry: 'content/knowledge/production-planning/review/wave1-c2-human-editorial-review-package-registry-v1.json',
  preflight: 'content/knowledge/production-planning/activation/wave1-production-activation-preflight-v1.json',
  queue: 'content/knowledge/production-planning/review/wave1-c2-human-review-queue-v1.json',
  pilot: 'content/knowledge/production-planning/plans/kpp-pilot-production-plan-v2.json',
  nodes: 'content/knowledge/registry/nodes.json',
  blueprint: 'content/knowledge/blueprints/book-1-knowledge-blueprint.json',
  c2Contract: 'content/knowledge/editorial/c2/canonical-thesis-boundary.contract.json',
  legacy: 'content/knowledge/authoring/extensions/legacy-supporting-source/registries/legacy-accepted-supporting-relationship-registry-v1.json',
  legacyHandoff: 'content/knowledge/authoring/extensions/legacy-supporting-source/handoff/kau-e2-kpp-accepted-supporting-relationship-handoff-v1.json',
  assets: 'content/knowledge/registry/assets.json',
  publishedArticles: 'content/knowledge/public/published-articles.json',
  runtimeFragments: 'content/knowledge/runtime/index/fragments-index.json',
  carFragments: 'content/knowledge/public/retrieval/fragments.json',
  publishedFragmentExpansion: 'content/knowledge/completion/published-fragment-expansion-v1.json',
  kppFreeze: 'content/knowledge/production-planning/freeze/kpp-w29-knowledge-production-planning-v2-freeze.json',
  humanDecisions: 'content/knowledge/production-planning/registries/kpp-human-production-decision-registry-v1.json',
  planFreeze: 'content/knowledge/production-planning/registries/kpp-production-plan-freeze-registry-v1.json',
  waves: 'content/knowledge/production-planning/registries/kpp-production-wave-registry-v2.json',
  pjaHandoffs: 'content/knowledge/production-planning/registries/kpp-pja-handoff-registry-v1.json',
  carHandoffs: 'content/knowledge/production-planning/registries/kpp-car-handoff-registry-v1.json',
  pjaCandidates: 'content/knowledge/production/registry/candidate-registry.json',
  pjaReviews: 'content/knowledge/production/registry/review-registry.json',
  pjaApprovals: 'content/knowledge/production/registry/approval-registry.json',
  pjaPublications: 'content/knowledge/production/registry/publication-registry.json',
  carContract: 'content/professional/canonical-asset-runtime/contracts/canonical-asset-brief-runtime-v1.json',
  carPolicy: 'content/professional/canonical-asset-runtime/policies/canonical-asset-brief-coverage-policy-v1.json',
  package: 'package.json'
};

const documents = Object.fromEntries(await Promise.all(
  Object.entries(paths).map(async ([key, relativePath]) => [key, await readJson(relativePath)])
));
const candidates = Object.fromEntries(await Promise.all(
  expected.map(async item => [item.nodeCode, await readJson(item.candidateReference)])
));
const assessments = Object.fromEntries(await Promise.all(
  expected.map(async item => [item.nodeCode, await readJson(item.c3AssessmentReference)])
));

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(documents.schema);
assert.equal(
  validate(documents.registry),
  true,
  `Review package registry schema failure:\n${JSON.stringify(validate.errors, null, 2)}`
);

assert.equal(documents.registry.baselineCommit, '0732b3dfef7c15d3571d980887f1423b68eee6a2');
assert.equal(documents.contract.status, 'ESTABLISHED_PENDING_HUMAN');
assert.deepEqual(documents.contract.reviewDimensions, requiredDimensions);
assert.equal(documents.contract.humanAuthority.aiMayActAsHumanReviewer, false);
assert.equal(documents.contract.humanAuthority.aiMayFreezeC2, false);
assert.equal(documents.contract.legacySupportingBoundary.mayBecomeCanonicalThesis, false);
assert.equal(documents.contract.legacySupportingBoundary.mayRaiseProductionReadiness, false);
assert.equal(documents.contract.publishedKnowledgeReconciliation.existingPublishedKnowledgeMayBeSilentlyRebuilt, false);
assert.deepEqual(documents.contract.failClosedEffects, noEffects);
assert.deepEqual(documents.registry.effects, noEffects);

assert.equal(documents.preflight.status, 'BLOCKED_PENDING_C2_HUMAN_FREEZE');
assert.equal(documents.queue.status, 'OPEN');
assert.equal(documents.pilot.status, 'VALIDATION_PILOT_ONLY');
assert.equal(documents.pilot.invariants.roleAssignmentsArePilotFixturesNotProductionDecisions, true);
assert.equal(documents.kppFreeze.status, 'frozen');
assert.equal(documents.kppFreeze.productionStatus, 'validation_only');
assert.equal(documents.kppFreeze.productionActivated, false);
assert.equal(documents.registry.authoritySnapshot.kppProductionStatus, documents.kppFreeze.productionStatus);

assert.deepEqual(documents.preflight.selectedExecutionScope.map(item => item.nodeCode), expected.map(item => item.nodeCode));
assert.deepEqual(documents.queue.items.map(item => item.nodeCode), expected.map(item => item.nodeCode));
assert.deepEqual(documents.registry.packages.map(item => item.nodeCode), expected.map(item => item.nodeCode));
assert.equal(new Set(documents.registry.packages.map(item => item.nodeCode)).size, expected.length);

const blueprintEntries = collectObjectsByNodeCode(documents.blueprint, selectedCodes);
const nodeEntries = documents.nodes.nodes.filter(node => selectedCodes.has(node.nodeCode));
assert.equal(blueprintEntries.length, expected.length);
assert.equal(nodeEntries.length, expected.length);

const legacyFor = nodeCode => documents.legacy.entries.filter(entry => entry.canonicalNodeReferences.includes(nodeCode));
assert.deepEqual(expected.map(item => legacyFor(item.nodeCode).length), [0, 3, 0, 5]);
assert.equal(documents.legacy.authority.supportingOnly, true);
assert.equal(documents.legacy.authority.canonicalAuthority, false);
assert.equal(documents.legacy.authority.productionDecisionAuthority, false);
assert.equal(documents.legacyHandoff.consumerRules.acceptedSupportingDoesNotEqualProductionReadiness, true);
assert.equal(documents.legacyHandoff.consumerRules.acceptedSupportingDoesNotEqualArticleRequirement, true);
assert.equal(documents.legacyHandoff.consumerRules.acceptedSupportingDoesNotEqualPriority, true);
assert.equal(documents.legacyHandoff.consumerRules.acceptedSupportingDoesNotEqualWavePlacement, true);

for (const expectedItem of expected) {
  const reviewPackage = documents.registry.packages.find(item => item.nodeCode === expectedItem.nodeCode);
  const preflightItem = documents.preflight.selectedExecutionScope.find(item => item.nodeCode === expectedItem.nodeCode);
  const queueItem = documents.queue.items.find(item => item.nodeCode === expectedItem.nodeCode);
  const pilotItem = documents.pilot.nodes.find(item => item.nodeCode === expectedItem.nodeCode);
  const node = nodeEntries.find(item => item.nodeCode === expectedItem.nodeCode);
  const blueprint = blueprintEntries.find(item => item.nodeCode === expectedItem.nodeCode);
  const candidate = candidates[expectedItem.nodeCode];
  const assessment = assessments[expectedItem.nodeCode];

  assert.ok(reviewPackage, `Missing review package ${expectedItem.nodeCode}`);
  assert.ok(preflightItem, `Missing preflight item ${expectedItem.nodeCode}`);
  assert.ok(queueItem, `Missing queue item ${expectedItem.nodeCode}`);
  assert.ok(pilotItem, `Missing pilot item ${expectedItem.nodeCode}`);
  assert.ok(node, `Missing Canonical Node ${expectedItem.nodeCode}`);
  assert.ok(blueprint, `Missing Blueprint entry ${expectedItem.nodeCode}`);

  assert.equal(reviewPackage.titleZhHans, expectedItem.titleZhHans);
  assert.equal(queueItem.titleZhHans, expectedItem.titleZhHans);
  assert.equal(reviewPackage.candidateReference, expectedItem.candidateReference);
  assert.equal(reviewPackage.c3AssessmentReference, expectedItem.c3AssessmentReference);
  assert.equal(preflightItem.productionRole, expectedItem.productionRole);
  assert.equal(preflightItem.dispatchTarget, expectedItem.dispatchTarget);
  assert.equal(pilotItem.productionRole, expectedItem.productionRole);
  assert.deepEqual(reviewPackage.productionProjection, {
    productionRole: expectedItem.productionRole,
    dispatchTarget: expectedItem.dispatchTarget,
    sourcePlan: paths.pilot,
    sourceIsProductionDecision: false
  });

  assert.deepEqual(reviewPackage.canonicalSnapshot, canonicalSnapshot(node, blueprint, documents.pilot));
  assert.deepEqual(reviewPackage.c2Snapshot, c2Snapshot(candidate));
  assert.deepEqual(reviewPackage.c3Snapshot, c3Snapshot(assessment));
  assert.deepEqual(reviewPackage.publishedKnowledgeSnapshot, publishedKnowledgeSnapshot(expectedItem.nodeCode, assessment));
  assert.deepEqual(reviewPackage.legacySupportingRelationships, legacyFor(expectedItem.nodeCode).map(projectLegacyRelationship));

  assert.equal(candidate.candidateThesis, null);
  assert.equal(candidate.candidateBoundaries, null);
  assert.equal(candidate.protectedBoundary.productionEligible, false);
  assert.equal(candidate.protectedBoundary.articleGenerationAllowed, false);
  assert.equal(assessment.productionReady, false);
  assert.equal(assessment.gates.c2FrozenThesisBoundary.code, 'C2_NOT_FROZEN');
  assert.equal(assessment.authority.c2FreezeRecord, null);
  assert.ok(assessment.blocking.includes('C2_THESIS_BOUNDARY_NOT_FROZEN'));

  assert.deepEqual(reviewPackage.reviewDimensions.map(item => item.dimension), requiredDimensions);
  assert.equal(new Set(reviewPackage.reviewDimensions.map(item => item.dimension)).size, requiredDimensions.length);
  assert(reviewPackage.reviewDimensions.every(item => item.state === 'PENDING_HUMAN'));
  assert(reviewPackage.reviewDimensions.every(item => item.humanFinding === null));
  assert(Object.values(reviewPackage.humanDecision).every(value => value === null));
  assert.equal(reviewPackage.approvalState, 'pending_human');
  assert.deepEqual(reviewPackage.effects, noEffects);
}

const prefacePackage = documents.registry.packages.find(item => item.nodeCode === 'KN-PREFACE-004');
assert.equal(prefacePackage.publishedKnowledgeSnapshot.publishedAssetCodes.length, 4);
assert.equal(prefacePackage.publishedKnowledgeSnapshot.publishedArticleCodes.length, 2);
assert.equal(prefacePackage.publishedKnowledgeSnapshot.runtimePublishedFragmentCount, 16);
assert.equal(prefacePackage.publishedKnowledgeSnapshot.carAuthoritativePublishedFragmentCount, 0);
assert.equal(prefacePackage.publishedKnowledgeSnapshot.c3PublicationStateConflict, true);
assert.ok(prefacePackage.unresolvedFindings.includes('EXISTING_PUBLISHED_ARTICLE_REQUIRES_C2_AUTHORITY_RECONCILIATION'));
assert.ok(prefacePackage.unresolvedFindings.includes('C3_PUBLICATION_STATE_CONFLICT'));
for (const asset of documents.assets.assets.filter(item => item.nodeCode === 'KN-PREFACE-004')) {
  assert.equal(asset.reviewStatus, 'approved');
  assert.equal(asset.publicationStatus, 'published');
  await fs.access(path.join(root, asset.contentPath));
}

for (const nodeCode of ['KN-B1-P4-003', 'KN-B1-P4-004']) {
  const reviewPackage = documents.registry.packages.find(item => item.nodeCode === nodeCode);
  assert.equal(reviewPackage.productionProjection.dispatchTarget, 'CAR');
  assert.equal(reviewPackage.publishedKnowledgeSnapshot.carAuthoritativePublishedFragmentCount, 0);
  assert.ok(reviewPackage.unresolvedFindings.includes('CAR_PUBLISHED_FRAGMENT_AUTHORITY_NOT_ESTABLISHED'));
}

assert.equal(documents.carContract.productionStatus, 'validation_only');
assert.equal(documents.carContract.invariants.assetBriefMayCreateKnowledge, false);
assert.equal(documents.carContract.invariants.assetBriefMayPublish, false);
assert.equal(documents.carPolicy.minimumPublishedFragmentCount, 1);
assert.equal(documents.carPolicy.onInsufficientCoverage, 'reject_brief');
assert.equal(documents.carPolicy.requirePublishedFragmentsOnly, true);

assert.equal(documents.humanDecisions.decisions.length, 0);
assert.equal(documents.planFreeze.plans.length, 0);
assert.equal(documents.planFreeze.revisions.length, 0);
assert.equal(documents.waves.waves.length, 0);
assert.equal(documents.pjaHandoffs.handoffs.length, 0);
assert.equal(documents.carHandoffs.handoffs.length, 0);
assert.equal(documents.registry.authoritySnapshot.humanProductionDecisionCount, documents.humanDecisions.decisions.length);
assert.equal(documents.registry.authoritySnapshot.frozenProductionPlanCount, documents.planFreeze.plans.length);
assert.equal(documents.registry.authoritySnapshot.frozenProductionWaveCount, documents.waves.waves.length);
assert.equal(documents.registry.authoritySnapshot.pjaHandoffCount, documents.pjaHandoffs.handoffs.length);
assert.equal(documents.registry.authoritySnapshot.carHandoffCount, documents.carHandoffs.handoffs.length);

for (const registry of [documents.pjaCandidates, documents.pjaReviews, documents.pjaApprovals, documents.pjaPublications]) {
  assert.equal(
    registry.records.filter(record => selectedCodes.has(record.nodeCode)).length,
    0,
    `${registry.registryCode} must contain no Wave 1 selected production state while C2 is pending`
  );
}

const registeredKpeScripts = Object.keys(documents.package.scripts).filter(script => script.toLowerCase().includes('kpe')).sort();
assert.deepEqual(registeredKpeScripts, []);
assert.equal(documents.registry.authoritySnapshot.kpeAuthorityStatus, 'NOT_PRESENT_IN_CURRENT_MAIN');

const inputProjection = {
  c2Contract: documents.c2Contract,
  preflight: {
    status: documents.preflight.status,
    selectedExecutionScope: documents.preflight.selectedExecutionScope,
    gateSnapshot: documents.preflight.gateSnapshot
  },
  queue: {
    status: documents.queue.status,
    items: documents.queue.items
  },
  pilot: {
    status: documents.pilot.status,
    nodes: documents.pilot.nodes.filter(item => selectedCodes.has(item.nodeCode)),
    crossNodeAssembly: documents.pilot.crossNodeAssembly,
    activation: documents.pilot.activation,
    invariants: documents.pilot.invariants,
    inputDigest: documents.pilot.inputDigest,
    policyDigest: documents.pilot.policyDigest,
    resultDigest: documents.pilot.resultDigest
  },
  nodes: nodeEntries,
  blueprintEntries,
  candidates: expected.map(item => candidates[item.nodeCode]),
  assessments: expected.map(item => assessments[item.nodeCode]),
  legacyAuthority: documents.legacy.authority,
  legacyRelationships: documents.legacy.entries.filter(entry => entry.canonicalNodeReferences.some(nodeCode => selectedCodes.has(nodeCode))),
  legacyHandoff: {
    status: documents.legacyHandoff.status,
    consumerRules: documents.legacyHandoff.consumerRules,
    authority: documents.legacyHandoff.authority
  },
  publishedAssets: documents.assets.assets.filter(item => selectedCodes.has(item.nodeCode)),
  publishedArticles: documents.publishedArticles.records.filter(item => selectedCodes.has(item.nodeCode)),
  runtimePublishedFragments: documents.runtimeFragments.records.filter(item => selectedCodes.has(item.nodeCode)),
  carPublishedFragments: documents.carFragments.records.filter(item => selectedCodes.has(item.nodeCode)),
  publishedFragmentExpansion: documents.publishedFragmentExpansion.records.filter(item => selectedCodes.has(item.nodeCode)),
  productionState: {
    humanDecisions: documents.humanDecisions.decisions,
    frozenPlans: documents.planFreeze.plans,
    planRevisions: documents.planFreeze.revisions,
    waves: documents.waves.waves,
    pjaHandoffs: documents.pjaHandoffs.handoffs,
    carHandoffs: documents.carHandoffs.handoffs,
    pjaCandidates: documents.pjaCandidates.records.filter(record => selectedCodes.has(record.nodeCode)),
    pjaReviews: documents.pjaReviews.records.filter(record => selectedCodes.has(record.nodeCode)),
    pjaApprovals: documents.pjaApprovals.records.filter(record => selectedCodes.has(record.nodeCode)),
    pjaPublications: documents.pjaPublications.records.filter(record => selectedCodes.has(record.nodeCode))
  },
  kppFreeze: {
    status: documents.kppFreeze.status,
    productionStatus: documents.kppFreeze.productionStatus,
    productionActivated: documents.kppFreeze.productionActivated,
    authority: documents.kppFreeze.authority,
    coreInvariants: documents.kppFreeze.coreInvariants
  },
  car: {
    contract: documents.carContract,
    coveragePolicy: documents.carPolicy
  },
  registeredKpeScripts
};
const computedDigests = {
  inputDigest: digest(inputProjection),
  packageSetDigest: digest(documents.registry.packages)
};

if (process.argv.includes('--print-digests')) {
  console.log(JSON.stringify(computedDigests, null, 2));
  process.exit(0);
}

assert.equal(documents.registry.digestBinding.inputDigest, computedDigests.inputDigest, 'Wave 1 authority input projection drifted');
assert.equal(documents.registry.digestBinding.packageSetDigest, computedDigests.packageSetDigest, 'Wave 1 C2 review package set drifted');

console.log('✓ Wave 1 C2 Human Editorial Review Foundation passed.');
console.log('✓ 4/4 evidence-bound review packages cover thesis, article, question, sequence, claim, source, figure, public-content and cross-node boundaries.');
console.log('✓ All packages remain pending_human; C2/C3, Production Decision, Frozen Plan/Wave, KPE, PJA/CAR Candidate and Publication effects remain false.');
console.log('✓ KN-PREFACE-004 existing publication conflict is preserved for Human reconciliation; KAU-E2 evidence remains supporting-only.');

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

function canonicalSnapshot(node, blueprint, pilot) {
  let pilotAssemblyParticipation = 'none';
  if (pilot.crossNodeAssembly.primaryNode === node.nodeCode) pilotAssemblyParticipation = 'primary_node';
  if (pilot.crossNodeAssembly.supportingNodes.includes(node.nodeCode)) pilotAssemblyParticipation = 'supporting_node';
  return {
    nodeVersion: node.version,
    registryStatus: node.registryStatus,
    canonicalLanguage: node.canonicalLanguage,
    nodeRequiredPublicLanguages: node.requiredPublicLanguages ?? [],
    blueprintStatus: blueprint.status,
    blueprintArticleRequiredNow: blueprint.articleRequiredNow,
    blueprintPublicLanguagePlan: blueprint.publicLanguagePlan,
    sourceCodes: node.sourceReferences.map(reference => reference.sourceCode),
    supportingQuestionCodes: node.supportingQuestionCodes,
    prerequisiteNodeCodes: node.relationships.prerequisiteNodeCodes,
    nextNodeCodes: node.relationships.nextNodeCodes,
    relatedNodeCodes: node.relationships.relatedNodeCodes,
    pilotAssemblyParticipation
  };
}

function c2Snapshot(candidate) {
  return {
    status: candidate.status,
    thesisState: candidate.thesisState,
    boundaryState: candidate.boundaryState,
    humanFreezeState: candidate.humanFreezeState,
    authorityFinding: candidate.authorityAssessment.finding,
    candidateThesisPresent: candidate.candidateThesis !== null,
    candidateBoundariesPresent: candidate.candidateBoundaries !== null,
    blocking: candidate.blocking
  };
}

function c3Snapshot(assessment) {
  return {
    status: assessment.status,
    productionReady: assessment.productionReady,
    c2GateCode: assessment.gates.c2FrozenThesisBoundary.code,
    publicationState: assessment.publicationState,
    blocking: assessment.blocking
  };
}

function publishedKnowledgeSnapshot(nodeCode, assessment) {
  const publishedAssets = documents.assets.assets.filter(item => item.nodeCode === nodeCode && item.publicationStatus === 'published');
  const publishedArticles = documents.publishedArticles.records.filter(item => item.nodeCode === nodeCode && item.publicationStatus === 'published');
  const runtimePublishedFragments = documents.runtimeFragments.records.filter(item => item.nodeCode === nodeCode && item.publicStatus === 'published');
  const carPublishedFragments = documents.carFragments.records.filter(item => item.nodeCode === nodeCode);
  return {
    publishedAssetCodes: publishedAssets.map(item => item.assetCode),
    publishedArticleCodes: publishedArticles.map(item => item.articleCode),
    runtimePublishedFragmentCount: runtimePublishedFragments.length,
    carAuthoritativePublishedFragmentCount: carPublishedFragments.length,
    c3PublicationStateConflict: publishedArticles.length > 0 && assessment.publicationState !== 'published',
    silentRebuildAllowed: false
  };
}

function projectLegacyRelationship(entry) {
  return {
    relationshipCode: entry.relationshipCode,
    sourceCode: entry.sourceCode,
    legacySectionCode: entry.legacySectionCode,
    relationshipType: entry.relationshipType,
    state: entry.state,
    supportingOnly: entry.supportingOnly,
    canonicalAuthority: entry.canonicalAuthority,
    productionDecisionAuthority: entry.productionDecisionAuthority
  };
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
