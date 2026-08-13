import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ACCEPTANCE_PATH, BOOK_SPECS, CANDIDATE_REGISTRY_PATH, CANDIDATE_ROOT, buildBookW1CCandidateSet } from './build-book-w1c-successor-blueprint-candidates.mjs';
import {
  ADMISSION_AUTHORIZATION_PATH,
  ADMISSION_AUDIT_PATH,
  ADMISSION_HUMAN_ACCEPTANCE_PATH,
  ADMISSION_LEDGER_PATH,
  buildBookW1CAdmissionAudit
} from './build-book-w1c-canonical-node-admission-review.mjs';

const root = process.cwd();
const read = relativePath => fs.readFile(path.join(root, relativePath), 'utf8');
const readJson = async relativePath => JSON.parse(await read(relativePath));
const digest = value => crypto.createHash('sha256').update(value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8').digest('hex');

const [
  expected, activeRegistryRaw, activeFreeze, r5Freeze, contract, packageJson, audit,
  actualAdmissionAuthorization, actualAdmissionHumanAcceptance, actualAdmissionLedger,
  admissionAudit, nodesRaw
] = await Promise.all([
  buildBookW1CCandidateSet(root), read('content/knowledge/blueprints/blueprint-registry.json'),
  readJson('content/knowledge/blueprints/knowledge-blueprint-freeze-v2.json'), readJson('content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json'),
  readJson('content/knowledge/migrations/five-volume-migration-contract-v1.json'), readJson('package.json'), read('docs/audits/BOOK-W1C-successor-blueprint-generation.md'),
  readJson(ADMISSION_AUTHORIZATION_PATH), readJson(ADMISSION_HUMAN_ACCEPTANCE_PATH),
  readJson(ADMISSION_LEDGER_PATH),
  read(ADMISSION_AUDIT_PATH), read('content/knowledge/registry/nodes.json')
]);
assert.equal(digest(activeRegistryRaw), r5Freeze.blueprintAuthority.registryManifestSha256);
assert.equal(activeFreeze.registryManifestSHA, r5Freeze.blueprintAuthority.registryManifestSha256);
assert.equal(digest(nodesRaw), r5Freeze.canonicalAuthority.successorSha256);
assert.deepEqual(actualAdmissionAuthorization, expected.admissionReview.authorization);
assert.deepEqual(actualAdmissionHumanAcceptance, expected.admissionReview.humanAcceptance);
assert.deepEqual(actualAdmissionLedger, expected.admissionReview.ledger);
assert.equal(admissionAudit, `${buildBookW1CAdmissionAudit(expected.admissionReview.ledger)}\n`);

const actualCandidates = [];
for (const spec of BOOK_SPECS) {
  const actual = await readJson(`${CANDIDATE_ROOT}/${spec.candidateFile}`);
  assert.deepEqual(actual, expected.candidates.get(spec.candidateFile), `${spec.bookCode} candidate must rebuild deterministically.`);
  actualCandidates.push(actual);
}
assert.deepEqual(await readJson(CANDIDATE_REGISTRY_PATH), expected.candidateRegistry);
assert.deepEqual(await readJson(ACCEPTANCE_PATH), expected.acceptance);
assert.deepEqual(actualCandidates.map(candidate => candidate.bookCode), ['BOOK-2', 'BOOK-3', 'BOOK-4', 'BOOK-5']);
assert.deepEqual(actualCandidates.map(candidate => candidate.nodes.length), [182, 86, 187, 198]);
assert.equal(actualCandidates.reduce((sum, candidate) => sum + candidate.nodes.length, 0), 653);
assert.deepEqual(actualCandidates.map(candidate => candidate.parts.map(part => part.partCode)), [['P5', 'P6', 'P7'], ['P8', 'P9'], ['P10', 'P11', 'P12'], ['P13', 'P14', 'P15']]);

const expectedPartTitles = { P8: '第八部｜运行维持', P9: '第九部｜协调运行', P10: '第十部｜运行扩展', P11: '第十一部｜文明运行', P12: '第十二部｜文明图谱', P13: '第十三部｜读取科学', P14: '第十四部｜导航科学', P15: '第十五部｜现实延续' };
for (const part of actualCandidates.slice(1).flatMap(candidate => candidate.parts)) assert.equal(part.title, expectedPartTitles[part.partCode]);

const book2Nodes = actualCandidates[0].nodes;
assert.equal(book2Nodes.length, 182);
assert(book2Nodes.every(node => node.migrationDecisionRef.authority === 'KAU-R5-CANONICAL-SUCCESSOR'));
assert(book2Nodes.every(node => node.migrationDecisionRef.status === 'human-accepted-applied'));
const w1bNodes = actualCandidates.slice(1).flatMap(candidate => candidate.nodes);
assert.equal(w1bNodes.length, 471);
assert.equal(new Set(w1bNodes.map(node => node.nodeCode)).size, 471);
assert(w1bNodes.every(node => node.migrationDecisionRef.authority === 'BOOK-W1B-OUTLINE-MIGRATION-MAP'));
assert(w1bNodes.every(node => node.migrationDecisionRef.oldNodeCode === node.nodeCode));
assert(w1bNodes.every(node => node.migrationDecisionRef.status === 'human-approved-book-w1b-primary-recommendation'));
assert(w1bNodes.every(node => node.migrationDecisionRef.humanDecision === 'ACCEPT'));
assert(w1bNodes.every(node => node.migrationDecisionRef.canonicalIdentityChanged === false));

for (const candidate of actualCandidates) {
  assert.equal(candidate.status, 'successor-blueprint-candidate-human-acceptance-pending');
  assert.equal(candidate.activation.candidateOnly, true);
  assert.equal(candidate.activation.w1bMigrationMapsAccepted, true);
  assert.equal(candidate.activation.humanBlueprintAcceptanceStatus, 'PENDING');
  assert.equal(candidate.activation.activeBlueprintRegistryMutationAllowed, false);
  assert.equal(candidate.activation.activeBlueprintAuthorityCreated, false);
  assert(candidate.migrationRecord.length > 0);
  assert(candidate.supersedes.path && candidate.supersedes.sha256 && candidate.sourceOutlineAuthority);
}

assert.deepEqual(actualCandidates.map(candidate => candidate.newCanonicalNodeCandidates.length), [0, 33, 146, 144]);
const newNodeCandidates = actualCandidates.flatMap(candidate => candidate.newCanonicalNodeCandidates);
assert.equal(newNodeCandidates.length, 323);
assert(newNodeCandidates.every(candidate => candidate.candidateOnly));
assert(newNodeCandidates.every(candidate => !candidate.canonicalNodeApproved));
assert(newNodeCandidates.every(candidate => candidate.w1bDisposition === 'HUMAN_APPROVED_AS_NON_CANONICAL_CANDIDATE_ONLY'));
assert(newNodeCandidates.every(candidate => candidate.admissionCandidateCode));
assert.equal(newNodeCandidates.filter(candidate =>
  candidate.admissionReviewStatus === 'HUMAN_RECOMMENDATION_ACCEPTED_CANONICAL_ADMISSION_PENDING_W1D').length, 213);
assert.equal(newNodeCandidates.filter(candidate =>
  candidate.admissionReviewStatus === 'HUMAN_DECISION_PENDING').length, 110);
assert.equal(newNodeCandidates.filter(candidate =>
  candidate.admissionRecommendation.humanDecision === 'ACCEPT_RECOMMENDATION').length, 213);
assert.equal(newNodeCandidates.filter(candidate =>
  candidate.admissionRecommendation.humanDecision === null).length, 110);

assert.equal(actualAdmissionAuthorization.status, 'HUMAN_REVIEW_AUTHORIZED_NOT_ACCEPTED');
assert.equal(actualAdmissionAuthorization.humanActor, 'TL');
assert.equal(actualAdmissionAuthorization.decision, 'AUTHORIZE_REVIEW');
assert.equal(actualAdmissionAuthorization.boundaries.canonicalNodeCreatedByAuthorization, false);
assert.equal(actualAdmissionAuthorization.boundaries.bookW1CAccepted, false);
assert.equal(actualAdmissionAuthorization.boundaries.bookW1DAccepted, false);
assert.equal(actualAdmissionHumanAcceptance.status, 'PARTIAL_HUMAN_ACCEPTANCE_RECORDED');
assert.equal(actualAdmissionHumanAcceptance.humanActor, 'TL');
assert.equal(actualAdmissionHumanAcceptance.decision,
  'ACCEPT_213_PROVISIONAL_ADMISSION_RECOMMENDATIONS');
assert.deepEqual(actualAdmissionHumanAcceptance.acceptedCounts,
  { total: 213, promote: 192, supersede: 21 });
assert.deepEqual(actualAdmissionHumanAcceptance.unresolvedCounts,
  { total: 110, linkToExisting: 66, defer: 44 });
assert.equal(actualAdmissionHumanAcceptance.acceptedCandidates.length, 213);
assert.equal(new Set(actualAdmissionHumanAcceptance.acceptedCandidates
  .map(entry => entry.admissionCandidateCode)).size, 213);
assert.equal(actualAdmissionHumanAcceptance.boundaries.recommendationAcceptanceCreatesCanonicalNode,
  false);
assert.equal(actualAdmissionHumanAcceptance.boundaries.bookW1CAccepted, false);
assert.equal(actualAdmissionHumanAcceptance.boundaries.w1dMayBegin, false);
assert.equal(actualAdmissionLedger.inventory.candidateCount, 323);
assert.deepEqual({
  promote: actualAdmissionLedger.inventory.promote,
  linkToExisting: actualAdmissionLedger.inventory.linkToExisting,
  supersede: actualAdmissionLedger.inventory.supersede,
  defer: actualAdmissionLedger.inventory.defer
}, { promote: 192, linkToExisting: 66, supersede: 21, defer: 44 });
assert.equal(actualAdmissionLedger.inventory.provisionalNodeCodeCount, 213);
assert.equal(actualAdmissionLedger.inventory.acceptedRecommendationCount, 213);
assert.equal(actualAdmissionLedger.inventory.acceptedPromoteCount, 192);
assert.equal(actualAdmissionLedger.inventory.acceptedSupersedeCount, 21);
assert.equal(actualAdmissionLedger.inventory.pendingHumanDecisionCount, 110);
assert.equal(actualAdmissionLedger.inventory.approvedCanonicalNodeCount, 0);
assert.equal(actualAdmissionLedger.inventory.w1cHumanDecisionCount, 213);
assert.equal(actualAdmissionLedger.inventory.w1dCanonicalAdmissionDecisionCount, 0);
assert.equal(new Set(actualAdmissionLedger.entries.map(entry => entry.admissionCandidateCode)).size, 323);
assert(actualAdmissionLedger.entries.every(entry => entry.candidateOnly));
assert(actualAdmissionLedger.entries.every(entry => !entry.canonicalNodeApproved));
assert(actualAdmissionLedger.entries.every(entry => !entry.canonicalIdentityChanged));
assert.equal(actualAdmissionLedger.entries.filter(entry =>
  entry.recommendation.humanDecision === 'ACCEPT_RECOMMENDATION').length, 213);
assert.equal(actualAdmissionLedger.entries.filter(entry =>
  entry.recommendation.humanDecision === null).length, 110);
assert(actualAdmissionLedger.entries.filter(entry =>
  ['promote', 'supersede'].includes(entry.recommendation.action))
  .every(entry => entry.recommendation.humanDecision === 'ACCEPT_RECOMMENDATION'
    && entry.gates.w1cHumanAcceptanceRecorded));
assert(actualAdmissionLedger.entries.filter(entry =>
  ['link to existing', 'defer'].includes(entry.recommendation.action))
  .every(entry => entry.recommendation.humanDecision === null
    && !entry.gates.w1cHumanAcceptanceRecorded));
assert(actualAdmissionLedger.entries.every(entry =>
  ['promote', 'link to existing', 'supersede', 'defer'].includes(entry.recommendation.action)));
assert(actualAdmissionLedger.entries.filter(entry =>
  ['promote', 'supersede'].includes(entry.recommendation.action))
  .every(entry => entry.provisionalNodeCode?.startsWith(`KN-${entry.targetPublicationBookCode.replace('BOOK-', 'B')}-${entry.partCode}-`)));
assert(actualAdmissionLedger.entries.filter(entry =>
  ['link to existing', 'defer'].includes(entry.recommendation.action))
  .every(entry => entry.provisionalNodeCode === null));

const actualRegistry = await readJson(CANDIDATE_REGISTRY_PATH);
const actualAcceptance = await readJson(ACCEPTANCE_PATH);
assert.equal(actualRegistry.status, 'candidate-set-partial-human-review');
assert.equal(actualRegistry.traceability.book2NodesTraceToKauR5Count, 182);
assert.equal(actualRegistry.traceability.p8ToP15NodesTraceToW1BMigrationDecisionCount, 471);
assert.equal(actualRegistry.traceability.untracedIncludedNodeCount, 0);
assert.equal(actualRegistry.traceability.candidateOnlyNewOutlineChaptersTraceToW1BCount, 323);
assert.equal(actualRegistry.traceability.acceptedAdmissionRecommendationCount, 213);
assert.equal(actualRegistry.traceability.pendingAdmissionRecommendationCount, 110);
assert.equal(actualRegistry.traceability.approvedNewCanonicalNodeCount, 0);
assert.equal(actualRegistry.canonicalAdmissionReview.candidateCount, 323);
assert.equal(actualRegistry.canonicalAdmissionReview.promote, 192);
assert.equal(actualRegistry.canonicalAdmissionReview.linkToExisting, 66);
assert.equal(actualRegistry.canonicalAdmissionReview.supersede, 21);
assert.equal(actualRegistry.canonicalAdmissionReview.defer, 44);
assert.equal(actualRegistry.canonicalAdmissionReview.acceptedRecommendationCount, 213);
assert.equal(actualRegistry.canonicalAdmissionReview.pendingHumanDecisionCount, 110);
assert.equal(actualRegistry.canonicalAdmissionReview.approvedCanonicalNodeCount, 0);
assert.equal(actualRegistry.activationGates.w1bMigrationMapsAccepted, true);
assert.equal(actualRegistry.activationGates.canonicalAdmissionReviewPartiallyAccepted, true);
assert.equal(actualRegistry.activationGates.canonicalAdmissionReviewFullyResolved, false);
assert.equal(actualRegistry.activationGates.humanBlueprintAcceptanceRecorded, false);
assert.equal(actualRegistry.activationGates.activeBlueprintRegistryMutationAllowed, false);
assert.equal(actualAcceptance.status, 'PARTIAL_HUMAN_ACCEPTANCE');
assert.equal(actualAcceptance.humanActor, 'TL');
assert.equal(actualAcceptance.decision, 'PARTIAL_ACCEPT');
assert.equal(actualAcceptance.admissionReviewAuthorization.reviewAuthorized, true);
assert.equal(actualAcceptance.admissionReviewAuthorization.authorizationIsW1CAcceptance, false);
assert.equal(actualAcceptance.admissionReview.decision,
  'PARTIAL_ACCEPT_PROMOTE_AND_SUPERSEDE_RECOMMENDATIONS');
assert.deepEqual(actualAcceptance.admissionReview.acceptedRecommendationCounts,
  { promote: 192, supersede: 21, total: 213 });
assert.deepEqual(actualAcceptance.admissionReview.pendingRecommendationCounts,
  { linkToExisting: 66, defer: 44, total: 110 });
assert.deepEqual(actualAcceptance.admissionReview.recommendationCounts,
  { promote: 192, linkToExisting: 66, supersede: 21, defer: 44 });
assert(actualAcceptance.bookDecisions.every(record => record.decision === null));
assert.equal(actualAcceptance.bookDecisions[0].admissionDecision, 'NOT_APPLICABLE');
assert(actualAcceptance.bookDecisions.slice(1).every(record =>
  record.admissionDecision === 'PARTIAL_ACCEPT_PROMOTE_AND_SUPERSEDE_RECOMMENDATIONS'));
assert.deepEqual(actualAcceptance.bookDecisions.map(record =>
  record.acceptedAdmissionRecommendationCount), [0, 19, 90, 104]);
assert.deepEqual(actualAcceptance.bookDecisions.map(record =>
  record.pendingAdmissionRecommendationCount), [0, 14, 56, 40]);
assert.deepEqual(actualAcceptance.bookDecisions.map(record => record.newCanonicalNodeCandidateCount), [0, 33, 146, 144]);

assert.equal(contract.implementationSteps[0].status, 'accepted');
assert.equal(contract.implementationSteps[1].status, 'accepted');
assert.equal(contract.implementationSteps[2].status, 'in_progress');
assert(contract.implementationSteps.slice(3).every(step => step.status === 'pending'));
assert.equal(contract.w1cCandidatePreparation.status, 'partial-human-acceptance-not-active');
assert.equal(contract.w1cCandidatePreparation.candidateCount, 4);
assert.equal(contract.w1cCandidatePreparation.w1bAcceptanceSatisfied, true);
assert.equal(contract.w1cCandidatePreparation.canonicalAdmissionReviewAuthorizedByTl, true);
assert.equal(contract.w1cCandidatePreparation.canonicalAdmissionCandidateCount, 323);
assert.deepEqual(contract.w1cCandidatePreparation.canonicalAdmissionRecommendationCounts,
  { promote: 192, linkToExisting: 66, supersede: 21, defer: 44 });
assert.equal(contract.w1cCandidatePreparation.approvedCanonicalNodeCount, 0);
assert.equal(contract.w1cCandidatePreparation.acceptedCanonicalAdmissionRecommendationCount, 213);
assert.equal(contract.w1cCandidatePreparation.pendingCanonicalAdmissionRecommendationCount, 110);
assert.equal(contract.w1cCandidatePreparation.humanBlueprintAcceptanceSatisfied, false);
assert.equal(contract.w1cCandidatePreparation.activeBlueprintRegistryMutated, false);
assert.equal(contract.boundaries.successorBlueprintCandidatePreparationCreatesAuthority, false);
assert.equal(packageJson.scripts['check:book-w1-blueprints'], 'node scripts/check-book-w1c-successor-blueprint-generation.mjs');
assert.equal(packageJson.scripts['check:book-w1c'], 'npm run check:book-w1-blueprints');
assert.equal((packageJson.scripts.precheck.match(/npm run check:book-w1-blueprints/g) ?? []).length, 1);
assert(audit.includes('4 successor Blueprint candidates'));
assert(audit.includes('Active Blueprint Registry remains byte-identical'));
assert(audit.includes('W1B is Human approved'));
assert(admissionAudit.includes('All 323 review candidates'));
assert(admissionAudit.includes('TL-accepted recommendations: 213'));
assert(admissionAudit.includes('approved Canonical Nodes: 0'));

console.log('✓ BOOK-W1C Successor Blueprint Candidate Generation passed.');
console.log('  4 deterministic candidates cover BOOK-2 P5-P7, BOOK-3 P8-P9, BOOK-4 P10-P12 and BOOK-5 P13-P15.');
console.log('  182 Book-II nodes trace to KAU-R5; all 471 P8-P15 nodes trace to exact W1B migration-map entries.');
console.log('  TL accepted 213 provisional recommendations: 192 promote + 21 supersede; 66 link-to-existing and 44 defer remain pending.');
console.log('  W1C remains partially accepted and W1D remains blocked; 0 Canonical Nodes were approved or created.');
