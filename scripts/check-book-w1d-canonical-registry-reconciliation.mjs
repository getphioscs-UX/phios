import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ACCEPTANCE_PATH, MAP_PATHS, PUBLICATION_PATH, RECONCILIATION_PATH, W1C_ADMISSION_LEDGER_PATH, buildBookW1DReconciliation } from './build-book-w1d-canonical-registry-reconciliation.mjs';

const root=process.cwd();
const read=relative=>fs.readFile(path.join(root,relative),'utf8');
const readJson=async relative=>JSON.parse(await read(relative));
const sha=value=>crypto.createHash('sha256').update(value.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n'),'utf8').digest('hex');

const [expected,actualReconciliation,actualPublication,actualAcceptance,nodesRaw,r5,w1Contract,w1cRegistry,w1cAcceptance,w1cAdmissionLedger,pkg,audit,...maps]=await Promise.all([
  buildBookW1DReconciliation(root),readJson(RECONCILIATION_PATH),readJson(PUBLICATION_PATH),readJson(ACCEPTANCE_PATH),read('content/knowledge/registry/nodes.json'),
  readJson('content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json'),readJson('content/knowledge/migrations/five-volume-migration-contract-v1.json'),
  readJson('content/knowledge/blueprints/successors/book-w1c/successor-blueprint-candidate-registry-v1.json'),readJson('content/knowledge/blueprints/successors/book-w1c/book-w1c-human-acceptance-v1.json'),
  readJson(W1C_ADMISSION_LEDGER_PATH),
  readJson('package.json'),read('docs/audits/BOOK-W1D-canonical-registry-reconciliation.md'),...MAP_PATHS.map(readJson)
]);
assert.deepEqual(actualReconciliation,expected.reconciliation);
assert.deepEqual(actualPublication,expected.publication);
assert.deepEqual(actualAcceptance,expected.acceptance);

const nodes=JSON.parse(nodesRaw).nodes;
assert.equal(nodes.length,718);
assert.equal(sha(nodesRaw),r5.canonicalAuthority.successorSha256,'BOOK-W1D candidate preparation must not mutate the exact KAU-R5 Canonical Registry.');
assert.equal(actualReconciliation.entries.length,718);
assert.equal(actualReconciliation.acceptanceAccounting.existing716CanonicalNodeAuthorityAccountedFor,716);
assert.equal(actualReconciliation.acceptanceAccounting.postBaselineHumanAcceptedAdmissionsAccountedFor,2);
assert.equal(actualReconciliation.acceptanceAccounting.silentDeletionCount,0);
assert.equal(actualReconciliation.acceptanceAccounting.ungovernedNodeCodeMutationCount,0);
assert.equal(actualReconciliation.acceptanceAccounting.duplicateActiveIdentityCount,0);
assert.equal(actualReconciliation.acceptanceAccounting.orphanMigrationEntryCount,0);
assert.equal(actualReconciliation.acceptanceAccounting.untraceableOwnershipChangeCount,0);
assert.deepEqual(new Set(actualReconciliation.entries.map(entry=>entry.canonicalNodeCode)),new Set(nodes.map(node=>node.nodeCode)));
assert.equal(new Set(actualReconciliation.entries.map(entry=>entry.canonicalNodeCode)).size,718);
assert(actualReconciliation.entries.every(entry=>entry.oldNodeCode===entry.canonicalNodeCode));
assert(actualReconciliation.entries.every(entry=>entry.canonicalIdentityChanged===false));
assert(actualReconciliation.entries.every(entry=>entry.lineage.predecessorNodeCode===entry.canonicalNodeCode&&entry.lineage.successorNodeCode===entry.canonicalNodeCode));
assert.equal(actualReconciliation.candidateDecisionCounts.splitCandidate,0);
assert.equal(actualReconciliation.candidateDecisionCounts.mergeCandidate,0);
assert.equal(actualReconciliation.candidateDecisionCounts.newCandidate,0);
assert.equal(actualReconciliation.candidateDecisionCounts.canonicalIdentityChanged,0);
assert.equal(actualReconciliation.candidateDecisionCounts.upstreamAdmissionReviewCandidateCount,323);
assert.equal(actualReconciliation.candidateDecisionCounts.upstreamPromoteRecommendationCount,192);
assert.equal(actualReconciliation.candidateDecisionCounts.upstreamLinkToExistingRecommendationCount,66);
assert.equal(actualReconciliation.candidateDecisionCounts.upstreamSupersedeRecommendationCount,21);
assert.equal(actualReconciliation.candidateDecisionCounts.upstreamDeferRecommendationCount,44);
assert.equal(actualReconciliation.candidateDecisionCounts.upstreamHumanAcceptedRecommendationCount,213);
assert.equal(actualReconciliation.candidateDecisionCounts.upstreamPendingHumanDecisionCount,110);
assert.equal(actualReconciliation.candidateDecisionCounts.w1dAcceptedAdmissionCount,0);
assert.equal(actualReconciliation.boundaries.nodesJsonMutationAllowed,false);
assert.equal(actualReconciliation.boundaries.outlineChapterAutoApprovalAllowed,false);

assert.equal(actualPublication.recordCount,473);
assert.equal(actualPublication.w1bMapRecordCount,471);
assert.equal(actualPublication.kauR4RehomeRecordCount,2);
assert.equal(actualPublication.identityMutationCount,0);
assert.equal(actualPublication.untraceableRecordCount,0);
assert(actualPublication.records.every(record=>record.oldNodeCode===record.canonicalNodeCode&&record.canonicalIdentityChanged===false));
assert(actualPublication.records.every(record=>record.publicationOwnershipChanged===true&&record.migrationRecord.path));
const mapRecords=actualPublication.records.slice(0,471);
const sourceMapEntries=maps.flatMap((migration,mapIndex)=>migration.entries.map((entry,entryIndex)=>({entry,entryIndex,path:MAP_PATHS[mapIndex],migrationCode:migration.migrationCode,partCode:migration.partAuthority.partCode})));
assert.equal(sourceMapEntries.length,471);
for(const [index,record] of mapRecords.entries()){
  const source=sourceMapEntries[index];
  assert.equal(record.canonicalNodeCode,source.entry.oldNodeCode);
  assert.equal(record.oldPublicationBookCode,source.entry.oldPublicationBookCode);
  assert.equal(record.newPublicationBookCode,source.entry.newPublicationBookCode);
  assert.equal(record.partCode,source.partCode);
  assert.equal(record.migrationRecord.path,source.path);
  assert.equal(record.migrationRecord.entryIndex,source.entryIndex);
  assert.equal(record.humanAcceptance.status,'HUMAN_APPROVED_BOOK_W1B');
  assert.equal(record.applicationStatus,'candidate-only-not-applied');
}
const rehomeRecords=actualPublication.records.slice(471);
assert.deepEqual(rehomeRecords.map(record=>record.canonicalNodeCode),['KN-B2-P7-052','KN-B2-P7-057']);
assert.deepEqual(rehomeRecords.map(record=>record.partCode),['P11','P10']);
assert(rehomeRecords.every(record=>record.humanAcceptance.status==='HUMAN_ACCEPTED_TARGET_ONLY'));
assert(rehomeRecords.every(record=>record.applicationStatus==='blocked-pending-target-completed-outline-authority'));

assert.equal(w1Contract.implementationSteps.find(step=>step.step==='BOOK-W1B').status,'accepted');
assert.equal(w1Contract.implementationSteps.find(step=>step.step==='BOOK-W1C').status,'in_progress');
assert.equal(w1Contract.implementationSteps.find(step=>step.step==='BOOK-W1D').status,'pending');
assert.equal(w1Contract.w1dCandidatePreparation.status,'generated-blocked-not-active');
assert.equal(w1Contract.w1dCandidatePreparation.existingCanonicalAuthorityAccountedFor,716);
assert.equal(w1Contract.w1dCandidatePreparation.postBaselineKauR5AdmissionsAccountedFor,2);
assert.equal(w1Contract.w1dCandidatePreparation.upstreamW1cAdmissionReviewCandidateCount,323);
assert.equal(w1Contract.w1dCandidatePreparation.upstreamW1cAcceptedAdmissionRecommendationCount,213);
assert.equal(w1Contract.w1dCandidatePreparation.upstreamW1cPendingAdmissionRecommendationCount,110);
assert.equal(w1Contract.w1dCandidatePreparation.w1dCanonicalAdmissionDecisionCount,0);
assert.equal(w1Contract.w1dCandidatePreparation.activeCanonicalRegistryMutated,false);
assert.equal(w1Contract.boundaries.canonicalRegistryReconciliationAllowedBeforeW1BAndW1CAcceptance,false);
assert.equal(w1cRegistry.activationGates.w1bMigrationMapsAccepted,true);
assert.equal(w1cAcceptance.status,'PARTIAL_HUMAN_ACCEPTANCE');
assert.equal(w1cAcceptance.decision,'PARTIAL_ACCEPT');
assert.equal(w1cAdmissionLedger.inventory.candidateCount,323);
assert.equal(w1cAdmissionLedger.inventory.acceptedRecommendationCount,213);
assert.equal(w1cAdmissionLedger.inventory.pendingHumanDecisionCount,110);
assert.equal(w1cAdmissionLedger.inventory.approvedCanonicalNodeCount,0);
assert.equal(actualAcceptance.status,'BLOCKED_PENDING_W1C_HUMAN_GATE');
assert.equal(actualAcceptance.priorGates.w1cCanonicalAdmissionReviewAuthorized,true);
assert.equal(actualAcceptance.priorGates.w1cCanonicalAdmissionReviewPartiallyAccepted,true);
assert.equal(actualAcceptance.priorGates.w1cCanonicalAdmissionReviewAccepted,false);
assert.equal(actualAcceptance.decision,null);
assert.equal(actualAcceptance.activation.canonicalRegistryMutationAllowed,false);
assert.equal(actualAcceptance.activation.activeAuthorityCreated,false);
assert.equal(pkg.scripts['check:book-w1-canonical'],'node scripts/check-book-w1d-canonical-registry-reconciliation.mjs');
assert.equal(pkg.scripts['check:book-w1d'],'npm run check:book-w1-canonical');
assert.equal((pkg.scripts.precheck.match(/npm run check:book-w1-canonical/g)??[]).length,1);
for(const phrase of ['716 existing Canonical Node Authority','2 KAU-R5 Human-accepted admissions','0 silent deletion','473 publication ownership records','323 upstream Canonical admission review candidates','213 provisional recommendations are TL-accepted','W1C remains partially accepted']) assert(audit.includes(phrase));

console.log('✓ BOOK-W1D Canonical Registry Reconciliation candidate passed.');
console.log('  716 predecessor Canonical Nodes + 2 KAU-R5 Human-accepted admissions are accounted for exactly once.');
console.log('  0 silent deletion, 0 ungoverned nodeCode mutation, 0 duplicate identity and 0 orphan migration entry.');
console.log('  473 publication ownership records are traceable: 471 W1B moves + 2 Human-accepted rehome targets.');
console.log('  213 W1C recommendations are Human accepted and 110 remain pending; W1D has admitted 0 and created 0 identities.');
console.log('  W1C remains partially accepted, so W1D is blocked; nodes.json and active Blueprint authority were not mutated.');
