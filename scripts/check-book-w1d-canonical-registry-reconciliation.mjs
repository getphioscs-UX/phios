import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  ACTIVE_BLUEPRINT_REGISTRY_PATH, BOOK_SPECS, HISTORICAL_NODE_PATH,
  MIGRATION_CONTRACT_PATH, W1D_ACCEPTANCE_PATH, W1D_ACTIVE_PUBLICATION_PATH,
  W1D_ACTIVE_RECONCILIATION_PATH, W1D_SUCCESSOR_AUTHORITY_PATH,
  W1D_SUCCESSOR_BLUEPRINT_ROOT, W1D_SUCCESSOR_FREEZE_PATH,
  W1D_SUCCESSOR_NODE_PATH, buildBookW1DActivation, sha256
} from './apply-book-w1d-human-acceptance.mjs';

const root = process.cwd();
const read = relative => fs.readFile(path.join(root, relative), 'utf8');
const readJson = async relative => JSON.parse(await read(relative));
const expected = await buildBookW1DActivation(root);
const [
  historicalRaw, r5, successor, activeRegistry, freeze, authority, acceptance,
  reconciliation, ownership, contract, pkg, audit, ...blueprints
] = await Promise.all([
  read(HISTORICAL_NODE_PATH),
  readJson('content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json'),
  readJson(W1D_SUCCESSOR_NODE_PATH), readJson(ACTIVE_BLUEPRINT_REGISTRY_PATH),
  readJson(W1D_SUCCESSOR_FREEZE_PATH), readJson(W1D_SUCCESSOR_AUTHORITY_PATH),
  readJson(W1D_ACCEPTANCE_PATH), readJson(W1D_ACTIVE_RECONCILIATION_PATH),
  readJson(W1D_ACTIVE_PUBLICATION_PATH), readJson(MIGRATION_CONTRACT_PATH),
  readJson('package.json'), read('docs/audits/BOOK-W1D-canonical-registry-reconciliation.md'),
  ...BOOK_SPECS.map(spec => readJson(`${W1D_SUCCESSOR_BLUEPRINT_ROOT}/${spec.successorFile}`))
]);

assert.deepEqual(successor, expected.successorRegistry);
assert.deepEqual(activeRegistry, expected.activeBlueprintRegistry);
assert.deepEqual(freeze, expected.freeze);
assert.deepEqual(authority, expected.authorityContract);
assert.deepEqual(acceptance, expected.acceptance);
assert.deepEqual(reconciliation, expected.reconciliation);
assert.deepEqual(ownership, expected.ownership);
// The migration contract is a rolling successor ledger. W1D-generated records remain
// deterministic, while W1E–W1G legitimately advance the contract after W1D activation.
for (const [index, spec] of BOOK_SPECS.entries()) {
  assert.deepEqual(blueprints[index], expected.blueprints.get(spec.bookCode));
}

assert.equal(sha256(historicalRaw), r5.canonicalAuthority.successorSha256,
  'The exact 718-record KAU-R5 predecessor must remain immutable.');
const historical = JSON.parse(historicalRaw);
assert.equal(historical.nodes.length, 718);
assert.equal(successor.nodes.length, 931);
const historicalCodes = new Set(historical.nodes.map(node => node.nodeCode));
const successorCodes = new Set(successor.nodes.map(node => node.nodeCode));
assert.equal(successorCodes.size, 931);
assert([...historicalCodes].every(code => successorCodes.has(code)), '0 silent deletion required.');
const admitted = successor.nodes.filter(node => node.canonicalAdmission?.status === 'HUMAN_APPROVED_BOOK_W1D');
assert.equal(admitted.length, 213);
assert.equal(admitted.filter(node => node.canonicalAdmission.action === 'promote').length, 192);
assert.equal(admitted.filter(node => node.canonicalAdmission.action === 'supersede').length, 21);
assert(admitted.every(node => node.productionReady === false && node.articleStatus === 'not_created'));

const superseded = successor.nodes.filter(node =>
  node.canonicalDisposition?.status === 'SUPERSEDED_BY_BOOK_W1D_HUMAN_ACCEPTED_SUCCESSORS');
assert.equal(superseded.length, 13);
assert.equal(superseded.reduce((total, node) =>
  total + node.canonicalDisposition.successorNodeCodes.length, 0), 21);
assert(superseded.every(node => node.canonicalDisposition.legacyNodeCode === node.nodeCode));
assert(superseded.every(node => node.canonicalDisposition.lineage.every(lineage =>
  lineage.legacyNodeCode === node.nodeCode && lineage.successorNodeCode
  && lineage.compatibilityStrategy)));
assert(superseded.every(node => node.canonicalDisposition.historicalIdentityPreserved
  && node.canonicalDisposition.nodeCodeReusable === false));

assert.equal(successor.nodes.reduce((total, node) =>
  total + (node.outlineAuthorityLinks?.length ?? 0), 0), 66);
assert.equal(reconciliation.deferredAdmissionCandidates.length, 44);

const byCode = new Map(successor.nodes.map(node => [node.nodeCode, node]));
const rehome52 = byCode.get('KN-B2-P7-052');
const rehome57 = byCode.get('KN-B2-P7-057');
assert.equal(rehome52.partCode, 'P7');
assert.equal(rehome52.publicationBookCode, 'BOOK-4');
assert.equal(rehome52.publicationPartCode, 'P11');
assert.equal(rehome52.canonicalDisposition.physicalMoveStatus, 'APPLIED');
assert.equal(rehome57.partCode, 'P7');
assert.equal(rehome57.publicationBookCode, 'BOOK-4');
assert.equal(rehome57.publicationPartCode, 'P10');
assert.equal(rehome57.canonicalDisposition.physicalMoveStatus, 'APPLIED');

assert.equal(reconciliation.status, 'HUMAN_APPROVED_ACTIVE_SUCCESSOR');
assert.equal(reconciliation.existingIdentityDecisions.length, 718);
assert(reconciliation.existingIdentityDecisions.every(record =>
  record.oldNodeCode === record.canonicalNodeCode
  && record.canonicalIdentityChanged === false
  && record.humanDecision === 'ACCEPT_RECONCILIATION'));
assert.equal(reconciliation.canonicalAdmissionDecisions.length, 213);
assert.equal(reconciliation.canonicalAdmissionDecisions.filter(record =>
  record.canonicalIdentityChanged).length, 21);
assert.equal(reconciliation.accounting.silentDeletionCount, 0);
assert.equal(reconciliation.accounting.ungovernedNodeCodeMutationCount, 0);
assert.equal(reconciliation.accounting.duplicateActiveIdentityCount, 0);
assert.equal(reconciliation.accounting.orphanMigrationEntryCount, 0);

assert.equal(ownership.status, 'HUMAN_APPROVED_APPLIED');
assert.equal(ownership.recordCount, 473);
assert.equal(ownership.w1bMapRecordCount, 471);
assert.equal(ownership.rehomeAppliedRecordCount, 2);
assert.equal(ownership.untraceableRecordCount, 0);
assert(ownership.records.every(record => record.applicationStatus === 'applied-in-book-w1d-successor'));
assert.deepEqual(ownership.records.filter(record => record.physicalMoveDecision === 'APPLY')
  .map(record => [record.canonicalNodeCode, record.partCode]), [
  ['KN-B2-P7-052', 'P11'], ['KN-B2-P7-057', 'P10']
]);

assert.equal(acceptance.status, 'HUMAN_APPROVED');
assert.equal(acceptance.humanActor, 'TL');
assert.equal(acceptance.decision, 'ACCEPT');
assert.deepEqual(acceptance.overrides, []);
assert.equal(acceptance.acceptedScope.existingIdentityReconciliationCount, 718);
assert.equal(acceptance.acceptedScope.promoteAdmissionCount, 192);
assert.equal(acceptance.acceptedScope.supersedeAdmissionCount, 21);
assert.equal(acceptance.acceptedScope.publicationOwnershipRecordCount, 473);
assert.deepEqual(acceptance.acceptedScope.rehomeApplications, [
  { canonicalNodeCode: 'KN-B2-P7-052', targetPartCode: 'P11', decision: 'APPLY' },
  { canonicalNodeCode: 'KN-B2-P7-057', targetPartCode: 'P10', decision: 'APPLY' }
]);
assert.equal(acceptance.activation.canonicalRegistrySuccessorActive, true);
assert.equal(acceptance.activation.activeBlueprintRegistrySuccessorActive, true);
assert.equal(acceptance.activation.publicProjectionMutationAllowed, false);
assert.equal(acceptance.activation.productionAuthorityCreated, false);

assert.deepEqual(Object.fromEntries(blueprints.map(blueprint =>
  [blueprint.bookCode, blueprint.nodes.length])), {
  'BOOK-2': 180, 'BOOK-3': 105, 'BOOK-4': 279, 'BOOK-5': 302
});
assert(blueprints.every(blueprint => blueprint.status === 'book-w1d-human-approved-active-successor'));
assert(blueprints.every(blueprint => blueprint.activation.activeBlueprintAuthorityCreated));
assert(blueprints.every(blueprint => !blueprint.activation.productionAuthorityCreated));
assert.equal(activeRegistry.totals.canonicalNodes, 931);
assert.equal(activeRegistry.status, 'book-w1d-human-approved-frozen-successor');
assert.equal(activeRegistry.authority.canonicalKnowledge, W1D_SUCCESSOR_NODE_PATH);
assert.equal(activeRegistry.authorityContract, W1D_SUCCESSOR_AUTHORITY_PATH);
assert.equal(freeze.registryManifestSHA, acceptance.activatedSuccessors.activeBlueprintRegistrySha256);
assert.equal(authority.authorities.canonicalKnowledge.path, W1D_SUCCESSOR_NODE_PATH);
assert.equal(authority.contract, 'PHI-OS-KNOWLEDGE-REGISTRY-AUTHORITY-v3.0.0');

assert.equal(contract.implementationSteps.find(record => record.step === 'BOOK-W1D').status, 'accepted');
assert.equal(contract.implementationSteps.find(record => record.step === 'BOOK-W1E').status, 'accepted');
assert.equal(contract.progress.currentStep, 'BOOK-W1G');
assert.equal(contract.w1dCandidatePreparation.w1dCanonicalAdmissionDecisionCount, 213);
assert.equal(contract.w1dCandidatePreparation.appliedPublicationOwnershipRecordCount, 473);
assert.equal(contract.w1dCandidatePreparation.appliedRehomeRecordCount, 2);
assert.equal(contract.w1dCandidatePreparation.successorCanonicalNodeRecordCount, 931);
assert.equal(contract.w1eCandidatePreparation.w1dActiveReconciliationSatisfied, true);
assert.equal(contract.w1eCandidatePreparation.activePublicProjectionMutated, true);

assert.equal(pkg.scripts['check:book-w1-canonical'],
  'node scripts/check-book-w1d-canonical-registry-reconciliation.mjs');
for (const phrase of [
  'HUMAN_APPROVED', '718 existing identity', '192 promote', '21 supersede',
  '473 publication ownership', 'KN-B2-P7-052', 'KN-B2-P7-057',
  '931 Canonical', 'W1E remains independently Human-governed'
]) assert(audit.includes(phrase), `Missing W1D audit phrase: ${phrase}`);

console.log('✓ BOOK-W1D Human-approved Canonical Registry successor passed.');
console.log('  718 existing identities remain accounted for; 192 promote + 21 lineage-bound supersede admissions are active.');
console.log('  473 publication ownership records are applied, including KN-B2-P7-052 → P11 and KN-B2-P7-057 → P10.');
console.log('  Successor authority contains 931 Canonical records with 0 silent deletion, mutation, duplicate or orphan entry.');
console.log('  W1E–W1G successor public projection, compatibility reconciliation and freeze are independently active.');
