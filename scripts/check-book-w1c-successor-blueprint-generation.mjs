import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ACCEPTANCE_PATH, BOOK_SPECS, CANDIDATE_REGISTRY_PATH, CANDIDATE_ROOT, buildBookW1CCandidateSet } from './build-book-w1c-successor-blueprint-candidates.mjs';
import {
  ADMISSION_AUTHORIZATION_PATH,
  ADMISSION_AUDIT_PATH,
  ADMISSION_LEDGER_PATH,
  buildBookW1CAdmissionAudit
} from './build-book-w1c-canonical-node-admission-review.mjs';

const root = process.cwd();
const read = relativePath => fs.readFile(path.join(root, relativePath), 'utf8');
const readJson = async relativePath => JSON.parse(await read(relativePath));
const digest = value => crypto.createHash('sha256').update(value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8').digest('hex');

const [
  expected, activeRegistryRaw, activeFreeze, r5Freeze, contract, packageJson, audit,
  actualAdmissionAuthorization, actualAdmissionLedger, admissionAudit, nodesRaw
] = await Promise.all([
  buildBookW1CCandidateSet(root), read('content/knowledge/blueprints/blueprint-registry.json'),
  readJson('content/knowledge/blueprints/knowledge-blueprint-freeze-v2.json'), readJson('content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json'),
  readJson('content/knowledge/migrations/five-volume-migration-contract-v1.json'), readJson('package.json'), read('docs/audits/BOOK-W1C-successor-blueprint-generation.md'),
  readJson(ADMISSION_AUTHORIZATION_PATH), readJson(ADMISSION_LEDGER_PATH),
  read(ADMISSION_AUDIT_PATH), read('content/knowledge/registry/nodes.json')
]);
assert.equal(digest(activeRegistryRaw), r5Freeze.blueprintAuthority.registryManifestSha256);
assert.equal(activeFreeze.registryManifestSHA, r5Freeze.blueprintAuthority.registryManifestSha256);
assert.equal(digest(nodesRaw), r5Freeze.canonicalAuthority.successorSha256);
assert.deepEqual(actualAdmissionAuthorization, expected.admissionReview.authorization);
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
assert(newNodeCandidates.every(candidate => candidate.admissionReviewStatus === 'HUMAN_DECISION_PENDING'));
assert(newNodeCandidates.every(candidate => candidate.admissionCandidateCode));
assert(newNodeCandidates.every(candidate => candidate.admissionRecommendation.humanDecision === null));

assert.equal(actualAdmissionAuthorization.status, 'HUMAN_REVIEW_AUTHORIZED_NOT_ACCEPTED');
assert.equal(actualAdmissionAuthorization.humanActor, 'TL');
assert.equal(actualAdmissionAuthorization.decision, 'AUTHORIZE_REVIEW');
assert.equal(actualAdmissionAuthorization.boundaries.canonicalNodeCreatedByAuthorization, false);
assert.equal(actualAdmissionAuthorization.boundaries.bookW1CAccepted, false);
assert.equal(actualAdmissionAuthorization.boundaries.bookW1DAccepted, false);
assert.equal(actualAdmissionLedger.inventory.candidateCount, 323);
assert.deepEqual({
  promote: actualAdmissionLedger.inventory.promote,
  linkToExisting: actualAdmissionLedger.inventory.linkToExisting,
  supersede: actualAdmissionLedger.inventory.supersede,
  defer: actualAdmissionLedger.inventory.defer
}, { promote: 192, linkToExisting: 66, supersede: 21, defer: 44 });
assert.equal(actualAdmissionLedger.inventory.provisionalNodeCodeCount, 213);
assert.equal(actualAdmissionLedger.inventory.approvedCanonicalNodeCount, 0);
assert.equal(actualAdmissionLedger.inventory.w1cHumanDecisionCount, 0);
assert.equal(actualAdmissionLedger.inventory.w1dCanonicalAdmissionDecisionCount, 0);
assert.equal(new Set(actualAdmissionLedger.entries.map(entry => entry.admissionCandidateCode)).size, 323);
assert(actualAdmissionLedger.entries.every(entry => entry.candidateOnly));
assert(actualAdmissionLedger.entries.every(entry => !entry.canonicalNodeApproved));
assert(actualAdmissionLedger.entries.every(entry => !entry.canonicalIdentityChanged));
assert(actualAdmissionLedger.entries.every(entry => entry.recommendation.humanDecision === null));
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
assert.equal(actualRegistry.status, 'candidate-set-ready-for-human-review');
assert.equal(actualRegistry.traceability.book2NodesTraceToKauR5Count, 182);
assert.equal(actualRegistry.traceability.p8ToP15NodesTraceToW1BMigrationDecisionCount, 471);
assert.equal(actualRegistry.traceability.untracedIncludedNodeCount, 0);
assert.equal(actualRegistry.traceability.candidateOnlyNewOutlineChaptersTraceToW1BCount, 323);
assert.equal(actualRegistry.traceability.approvedNewCanonicalNodeCount, 0);
assert.equal(actualRegistry.canonicalAdmissionReview.candidateCount, 323);
assert.equal(actualRegistry.canonicalAdmissionReview.promote, 192);
assert.equal(actualRegistry.canonicalAdmissionReview.linkToExisting, 66);
assert.equal(actualRegistry.canonicalAdmissionReview.supersede, 21);
assert.equal(actualRegistry.canonicalAdmissionReview.defer, 44);
assert.equal(actualRegistry.canonicalAdmissionReview.approvedCanonicalNodeCount, 0);
assert.equal(actualRegistry.activationGates.w1bMigrationMapsAccepted, true);
assert.equal(actualRegistry.activationGates.humanBlueprintAcceptanceRecorded, false);
assert.equal(actualRegistry.activationGates.activeBlueprintRegistryMutationAllowed, false);
assert.equal(actualAcceptance.status, 'PENDING_HUMAN_ACCEPTANCE');
assert.equal(actualAcceptance.humanActor, null);
assert.equal(actualAcceptance.decision, null);
assert.equal(actualAcceptance.admissionReviewAuthorization.reviewAuthorized, true);
assert.equal(actualAcceptance.admissionReviewAuthorization.authorizationIsW1CAcceptance, false);
assert.equal(actualAcceptance.admissionReview.decision, null);
assert.deepEqual(actualAcceptance.admissionReview.recommendationCounts,
  { promote: 192, linkToExisting: 66, supersede: 21, defer: 44 });
assert(actualAcceptance.bookDecisions.every(record => record.decision === null));
assert(actualAcceptance.bookDecisions.every(record => record.admissionDecision === null));
assert.deepEqual(actualAcceptance.bookDecisions.map(record => record.newCanonicalNodeCandidateCount), [0, 33, 146, 144]);

assert.equal(contract.implementationSteps[0].status, 'accepted');
assert.equal(contract.implementationSteps[1].status, 'accepted');
assert.equal(contract.implementationSteps[2].status, 'in_progress');
assert(contract.implementationSteps.slice(3).every(step => step.status === 'pending'));
assert.equal(contract.w1cCandidatePreparation.status, 'generated-ready-for-human-review-not-active');
assert.equal(contract.w1cCandidatePreparation.candidateCount, 4);
assert.equal(contract.w1cCandidatePreparation.w1bAcceptanceSatisfied, true);
assert.equal(contract.w1cCandidatePreparation.canonicalAdmissionReviewAuthorizedByTl, true);
assert.equal(contract.w1cCandidatePreparation.canonicalAdmissionCandidateCount, 323);
assert.deepEqual(contract.w1cCandidatePreparation.canonicalAdmissionRecommendationCounts,
  { promote: 192, linkToExisting: 66, supersede: 21, defer: 44 });
assert.equal(contract.w1cCandidatePreparation.approvedCanonicalNodeCount, 0);
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
assert(admissionAudit.includes('Approved Canonical Nodes: 0'));

console.log('✓ BOOK-W1C Successor Blueprint Candidate Generation passed.');
console.log('  4 deterministic candidates cover BOOK-2 P5-P7, BOOK-3 P8-P9, BOOK-4 P10-P12 and BOOK-5 P13-P15.');
console.log('  182 Book-II nodes trace to KAU-R5; all 471 P8-P15 nodes trace to exact W1B migration-map entries.');
console.log('  323 admission candidates: 192 promote, 66 link-to-existing, 21 supersede and 44 defer recommendations; 0 Canonical Nodes approved.');
console.log('  W1C Human Acceptance is pending; nodes.json and the frozen Active Blueprint Registry were not mutated.');
