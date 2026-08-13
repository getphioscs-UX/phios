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
assert.equal(actualReconciliation.candidateDecisionCounts.upstreamHumanAcceptedRecommendationCount,279);
assert.equal(actualReconciliation.candidateDecisionCounts.upstreamHumanResolvedDispositionCount,323);
assert.equal(actualReconciliation.candidateDecisionCounts.upstreamPendingHumanDecisionCount,0);
assert.equal(actualReconciliation.candidateDecisionCounts.w1dAdmissionCandidateCount,213);
assert.equal(actualReconciliation.candidateDecisionCounts.acceptedLinkRelationshipCount,66);
assert.equal(actualReconciliation.candidateDecisionCounts.deferredAdmissionCandidateCount,44);
assert.equal(actualReconciliation.candidateDecisionCounts.w1dAcceptedAdmissionCount,0);
assert.equal(actualReconciliation.boundaries.nodesJsonMutationAllowed,false);
assert.equal(actualReconciliation.boundaries.outlineChapterAutoApprovalAllowed,false);
assert.equal(actualReconciliation.status,'ready-for-human-review-not-active');
assert.equal(actualReconciliation.admissionCandidates.length,213);
assert.equal(actualReconciliation.admissionCandidates.filter(record=>record.proposedAction==='promote').length,192);
assert.equal(actualReconciliation.admissionCandidates.filter(record=>record.proposedAction==='supersede').length,21);
assert.equal(new Set(actualReconciliation.admissionCandidates.map(record=>record.proposedCanonicalNodeCode)).size,213);
assert(actualReconciliation.admissionCandidates.every(record=>record.canonicalNodeApproved===false));
assert(actualReconciliation.admissionCandidates.every(record=>record.canonicalIdentityChanged===false));
assert(actualReconciliation.admissionCandidates.every(record=>record.w1dHumanDecision===null));
assert(actualReconciliation.admissionCandidates.every(record=>
  !nodes.some(node=>node.nodeCode===record.proposedCanonicalNodeCode)));
assert(actualReconciliation.admissionCandidates.filter(record=>record.proposedAction==='supersede')
  .every(record=>record.lineageCandidate.legacyNodeCode
    && record.lineageCandidate.successorProvisionalNodeCode===record.proposedCanonicalNodeCode
    && record.lineageCandidate.compatibilityStrategy));
assert.equal(actualReconciliation.acceptedLinkRelationships.length,66);
assert(actualReconciliation.acceptedLinkRelationships.every(record=>
  record.w1cHumanAcceptance.status==='HUMAN_ACCEPTED_RELATIONSHIP_RECOMMENDATION'
  && record.canonicalNodeCreated===false));
assert.equal(actualReconciliation.deferredAdmissionCandidates.length,44);
assert(actualReconciliation.deferredAdmissionCandidates.every(record=>
  record.w1cHumanAcceptance.status==='HUMAN_ACCEPTED_DEFERRED_DISPOSITION'
  && record.applicationStatus.includes('preserved')));

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
assert(rehomeRecords.every(record=>record.applicationStatus==='ready-for-w1d-explicit-physical-application-decision'));

assert.equal(w1Contract.implementationSteps.find(step=>step.step==='BOOK-W1B').status,'accepted');
assert.equal(w1Contract.implementationSteps.find(step=>step.step==='BOOK-W1C').status,'accepted');
assert.equal(w1Contract.implementationSteps.find(step=>step.step==='BOOK-W1D').status,'in_progress');
assert.equal(w1Contract.w1dCandidatePreparation.status,'generated-ready-for-human-review-not-active');
assert.equal(w1Contract.w1dCandidatePreparation.existingCanonicalAuthorityAccountedFor,716);
assert.equal(w1Contract.w1dCandidatePreparation.postBaselineKauR5AdmissionsAccountedFor,2);
assert.equal(w1Contract.w1dCandidatePreparation.upstreamW1cAdmissionReviewCandidateCount,323);
assert.equal(w1Contract.w1dCandidatePreparation.upstreamW1cResolvedHumanDispositionCount,323);
assert.equal(w1Contract.w1dCandidatePreparation.w1dAdmissionCandidateCount,213);
assert.equal(w1Contract.w1dCandidatePreparation.acceptedLinkRelationshipCount,66);
assert.equal(w1Contract.w1dCandidatePreparation.deferredAdmissionCandidateCount,44);
assert.equal(w1Contract.w1dCandidatePreparation.upstreamW1cPendingAdmissionRecommendationCount,0);
assert.equal(w1Contract.w1dCandidatePreparation.w1dCanonicalAdmissionDecisionCount,0);
assert.equal(w1Contract.w1dCandidatePreparation.activeCanonicalRegistryMutated,false);
assert.equal(w1Contract.boundaries.canonicalRegistryReconciliationAllowedBeforeW1BAndW1CAcceptance,false);
assert.equal(w1cRegistry.activationGates.w1bMigrationMapsAccepted,true);
assert.equal(w1cAcceptance.status,'HUMAN_APPROVED');
assert.equal(w1cAcceptance.decision,'ACCEPT');
assert.equal(w1cAdmissionLedger.inventory.candidateCount,323);
assert.equal(w1cAdmissionLedger.inventory.resolvedHumanDispositionCount,323);
assert.equal(w1cAdmissionLedger.inventory.pendingHumanDecisionCount,0);
assert.equal(w1cAdmissionLedger.inventory.approvedCanonicalNodeCount,0);
assert.equal(actualAcceptance.status,'READY_FOR_HUMAN_REVIEW');
assert.equal(actualAcceptance.priorGates.w1cCanonicalAdmissionReviewAuthorized,true);
assert.equal(actualAcceptance.priorGates.w1cCanonicalAdmissionReviewPartiallyAccepted,true);
assert.equal(actualAcceptance.priorGates.w1cCanonicalAdmissionReviewAccepted,true);
assert.equal(actualAcceptance.priorGates.w1cSuccessorBlueprintsAccepted,true);
assert.equal(actualAcceptance.upstreamAdmissionReview.resolvedHumanDispositionCount,323);
assert.equal(actualAcceptance.upstreamAdmissionReview.canonicalAdmissionCandidateCount,213);
assert.equal(actualAcceptance.upstreamAdmissionReview.acceptedLinkRelationshipCount,66);
assert.equal(actualAcceptance.upstreamAdmissionReview.deferredAdmissionCandidateCount,44);
assert.equal(actualAcceptance.requiredHumanDecisions.existingCanonicalIdentityLedgerEntryCount,718);
assert.equal(actualAcceptance.requiredHumanDecisions.canonicalAdmissionCandidateCount,213);
assert.equal(actualAcceptance.requiredHumanDecisions.publicationOwnershipRecordCount,473);
assert.equal(actualAcceptance.decision,null);
assert.equal(actualAcceptance.activation.canonicalRegistryMutationAllowed,false);
assert.equal(actualAcceptance.activation.activeAuthorityCreated,false);
assert.equal(pkg.scripts['check:book-w1-canonical'],'node scripts/check-book-w1d-canonical-registry-reconciliation.mjs');
assert.equal(pkg.scripts['check:book-w1d'],'npm run check:book-w1-canonical');
assert.equal((pkg.scripts.precheck.match(/npm run check:book-w1-canonical/g)??[]).length,1);
for(const phrase of ['716 existing Canonical Node Authority','2 KAU-R5 Human-accepted admissions','0 silent deletion','473 publication ownership records','323 W1C dispositions','213 Canonical admission candidates','W1C is Human approved','READY_FOR_HUMAN_REVIEW']) assert(audit.includes(phrase));

console.log('✓ BOOK-W1D Canonical Registry Human Review package passed.');
console.log('  716 predecessor Canonical Nodes + 2 KAU-R5 Human-accepted admissions are accounted for exactly once.');
console.log('  0 silent deletion, 0 ungoverned nodeCode mutation, 0 duplicate identity and 0 orphan migration entry.');
console.log('  473 publication ownership records are traceable: 471 W1B moves + 2 Human-accepted rehome targets.');
console.log('  W1C resolved all 323 dispositions: 213 admission candidates, 66 accepted links and 44 preserved deferrals.');
console.log('  W1D is ready for Human Review but has admitted 0; nodes.json and active Blueprint authority were not mutated.');
