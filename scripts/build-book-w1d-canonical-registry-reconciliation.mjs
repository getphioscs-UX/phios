import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const OUTPUT_ROOT='content/knowledge/migrations/book-w1d';
export const RECONCILIATION_PATH=`${OUTPUT_ROOT}/canonical-registry-reconciliation-candidate-v1.json`;
export const PUBLICATION_PATH=`${OUTPUT_ROOT}/publication-ownership-migration-candidate-v1.json`;
export const ACCEPTANCE_PATH=`${OUTPUT_ROOT}/book-w1d-human-acceptance-v1.json`;
export const W1C_ADMISSION_LEDGER_PATH='content/knowledge/blueprints/successors/book-w1c/canonical-node-admission-review-candidates-v1.json';
export const W1C_FINAL_ACCEPTANCE_PATH='content/knowledge/blueprints/successors/book-w1c/canonical-node-admission-review-human-acceptance-v2.json';
export const MAP_PATHS=[
  'content/knowledge/migrations/p8-runtime-maintenance-outline-migration-v1.json',
  'content/knowledge/migrations/p9-coordination-runtime-outline-migration-v1.json',
  'content/knowledge/migrations/p10-runtime-expansion-outline-migration-v1.json',
  'content/knowledge/migrations/p11-civilization-runtime-outline-migration-v1.json',
  'content/knowledge/migrations/p12-civilization-atlas-outline-migration-v1.json',
  'content/knowledge/migrations/p13-reading-science-outline-migration-v1.json',
  'content/knowledge/migrations/p14-navigation-science-outline-migration-v1.json',
  'content/knowledge/migrations/p15-reality-continuation-outline-migration-v1.json'
];

const read=(root,relative)=>fs.readFile(path.join(root,relative),'utf8');
const readJson=async(root,relative)=>JSON.parse(await read(root,relative));
const normalizedSha=value=>crypto.createHash('sha256').update(value.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n'),'utf8').digest('hex');
const inferPart=node=>node.partCode ?? (node.nodeCode.startsWith('KN-PREFACE-')?'P0':node.nodeCode.match(/^KN-B1-(P[1-4])-/)?.[1] ?? null);
const currentOwner=partCode=>partCode==='P0'||/^P[1-4]$/.test(partCode)?'BOOK-1':partCode&&Number(partCode.slice(1))<=9?'BOOK-2':partCode&&Number(partCode.slice(1))<=12?'BOOK-3':'BOOK-4';
const targetOwner=partCode=>partCode==='P0'||/^P[1-4]$/.test(partCode)?'BOOK-1':partCode&&Number(partCode.slice(1))<=7?'BOOK-2':partCode&&Number(partCode.slice(1))<=9?'BOOK-3':partCode&&Number(partCode.slice(1))<=12?'BOOK-4':'BOOK-5';

export async function buildBookW1DReconciliation(root=process.cwd()){
  const [nodesRaw,r5,w1Contract,w1cRegistry,w1cAcceptance,w1cAdmissionLedger,rehome,...maps]=await Promise.all([
    read(root,'content/knowledge/registry/nodes.json'),
    readJson(root,'content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json'),
    readJson(root,'content/knowledge/migrations/five-volume-migration-contract-v1.json'),
    readJson(root,'content/knowledge/blueprints/successors/book-w1c/successor-blueprint-candidate-registry-v1.json'),
    readJson(root,'content/knowledge/blueprints/successors/book-w1c/book-w1c-human-acceptance-v1.json'),
    readJson(root,W1C_ADMISSION_LEDGER_PATH),
    readJson(root,'content/knowledge/reconciliation/kau-r5/canonical-node-rehome-pending-v1.json'),
    ...MAP_PATHS.map(relative=>readJson(root,relative))
  ]);
  const nodes=JSON.parse(nodesRaw).nodes;
  assert.equal(nodes.length,718);
  assert.equal(normalizedSha(nodesRaw),r5.canonicalAuthority.successorSha256);
  assert.equal(w1Contract.implementationSteps.find(step=>step.step==='BOOK-W1B')?.status,'accepted');
  assert.equal(w1Contract.implementationSteps.find(step=>step.step==='BOOK-W1C')?.status,'accepted');
  assert.equal(w1Contract.implementationSteps.find(step=>step.step==='BOOK-W1D')?.status,'in_progress');
  assert.equal(w1cRegistry.activationGates.w1bMigrationMapsAccepted,true);
  assert.equal(w1cAcceptance.status,'HUMAN_APPROVED');
  assert.equal(w1cAcceptance.decision,'ACCEPT');
  assert.equal(w1cAdmissionLedger.status,'HUMAN_REVIEW_COMPLETE_W1C_ACCEPTED');
  assert.equal(w1cAdmissionLedger.inventory.candidateCount,323);
  assert.equal(w1cAdmissionLedger.inventory.resolvedHumanDispositionCount,323);
  assert.equal(w1cAdmissionLedger.inventory.provisionalNodeCodeCount,213);
  assert.equal(w1cAdmissionLedger.inventory.acceptedLinkToExistingCount,66);
  assert.equal(w1cAdmissionLedger.inventory.acceptedDeferredDispositionCount,44);
  assert.equal(w1cAdmissionLedger.inventory.pendingHumanDecisionCount,0);
  assert.equal(w1cAdmissionLedger.inventory.approvedCanonicalNodeCount,0);

  const mapEntries=new Map();
  maps.forEach((migration,mapIndex)=>migration.entries.forEach((entry,entryIndex)=>{
    assert.equal(mapEntries.has(entry.oldNodeCode),false,`Duplicate W1B entry ${entry.oldNodeCode}`);
    mapEntries.set(entry.oldNodeCode,{entry,path:MAP_PATHS[mapIndex],migrationCode:migration.migrationCode,entryIndex});
  }));
  assert.equal(mapEntries.size,471);
  const newCodes=new Set(r5.appliedDelta.newNodeCodes);
  const deprecatedCodes=new Set(r5.appliedDelta.deprecatedNodeCodes);
  const rehomeByCode=new Map(rehome.records.map(record=>[record.nodeCode,record]));
  const metadataCodes=new Set([...r5.appliedDelta.scopeRevisionNodeCodes,...r5.appliedDelta.book1DisplayRevisionNodeCodes]);

  const entries=nodes.map((node,registryIndex)=>{
    const mapped=mapEntries.get(node.nodeCode);
    const rehomeRecord=rehomeByCode.get(node.nodeCode);
    const partCode=inferPart(node);
    let action='retain';
    let decisionAuthority={authority:'KAU-R5-CANONICAL-SUCCESSOR',status:'human-accepted-applied',path:'content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json'};
    let applicationStatus='already-active-in-kau-r5-successor';
    if(mapped){
      action=mapped.entry.action;
      decisionAuthority={authority:'BOOK-W1B-OUTLINE-MIGRATION-MAP',status:mapped.entry.outlineMatchStatus,path:mapped.path,migrationCode:mapped.migrationCode,entryIndex:mapped.entryIndex};
      applicationStatus='ready-for-w1d-human-reconciliation-review-not-applied';
    }else if(rehomeRecord){
      action='cross-part relationship';
      decisionAuthority={authority:'KAU-R4-HUMAN-ACCEPTED-REHOME-TARGET',status:'target-accepted-physical-move-deferred',path:'content/knowledge/reconciliation/kau-r5/canonical-node-rehome-pending-v1.json'};
      applicationStatus='ready-for-w1d-explicit-physical-application-decision';
    }else if(deprecatedCodes.has(node.nodeCode)) action='legacy reference';
    else if(metadataCodes.has(node.nodeCode)) action='rename metadata';

    return {
      registryIndex,
      oldNodeCode:node.nodeCode,
      canonicalNodeCode:node.nodeCode,
      canonicalIdentityChanged:false,
      action,
      baselineClass:newCodes.has(node.nodeCode)?'KAU-R5-HUMAN-ACCEPTED-POST-BASELINE-ADMISSION':'716-PREDECESSOR-CANONICAL-AUTHORITY',
      partCode,
      currentPublicationBookCode:node.publicationBookCode ?? currentOwner(partCode),
      targetPublicationBookCode:mapped?.entry.newPublicationBookCode ?? (rehomeRecord?targetOwner(rehomeRecord.targetPartCode):node.publicationBookCode ?? currentOwner(partCode)),
      registryStatus:node.registryStatus,
      applicationStatus,
      decisionAuthority,
      lineage:{predecessorNodeCode:node.nodeCode,successorNodeCode:node.nodeCode,legacyResolutionRequired:false},
      compatibilityStrategy:'preserve-nodeCode-and-resolve-publication-context-separately'
    };
  });

  const publicationEntries=[
    ...[...mapEntries.entries()].map(([nodeCode,mapped])=>({
      canonicalNodeCode:nodeCode,
      oldNodeCode:nodeCode,
      canonicalIdentityChanged:false,
      action:'move publication ownership',
      oldPublicationBookCode:mapped.entry.oldPublicationBookCode,
      newPublicationBookCode:mapped.entry.newPublicationBookCode,
      partCode:maps.find(map=>map.migrationCode===mapped.migrationCode).partAuthority.partCode,
      publicationOwnershipChanged:true,
      migrationRecord:{path:mapped.path,migrationCode:mapped.migrationCode,entryIndex:mapped.entryIndex},
      humanAcceptance:{status:'HUMAN_APPROVED_BOOK_W1B',authority:'content/knowledge/migrations/book-w1b/book-w1b-human-acceptance-v1.json'},
      applicationStatus:'candidate-only-not-applied'
    })),
    ...rehome.records.map((record,index)=>({
      canonicalNodeCode:record.nodeCode,
      oldNodeCode:record.nodeCode,
      canonicalIdentityChanged:false,
      action:'move publication ownership',
      oldPublicationBookCode:record.currentPublicationBookCode,
      newPublicationBookCode:targetOwner(record.targetPartCode),
      oldPartCode:record.currentPartCode,
      partCode:record.targetPartCode,
      targetChapterCode:record.targetChapterCode ?? null,
      publicationOwnershipChanged:true,
      migrationRecord:{path:'content/knowledge/reconciliation/kau-r5/canonical-node-rehome-pending-v1.json',recordIndex:index,deferredTo:record.deferredTo},
      humanAcceptance:{status:'HUMAN_ACCEPTED_TARGET_ONLY',authority:record.humanAuthority},
      applicationStatus:'ready-for-w1d-explicit-physical-application-decision'
    }))
  ];

  const admissionCandidates=w1cAdmissionLedger.entries
    .filter(record=>['promote','supersede'].includes(record.recommendation.action))
    .map(record=>({
      admissionCandidateCode:record.admissionCandidateCode,
      partCode:record.partCode,
      targetPublicationBookCode:record.targetPublicationBookCode,
      outlineChapterCode:record.outlineChapterCode,
      sourceTitle:record.sourceTitle,
      canonicalQuestion:record.canonicalQuestion,
      proposedAction:record.recommendation.action,
      proposedCanonicalNodeCode:record.provisionalNodeCode,
      targetExistingNodeCode:record.recommendation.targetExistingNodeCode,
      canonicalNodeApproved:false,
      canonicalIdentityChanged:false,
      proposedCanonicalIdentityChangedOnW1DAdmission:
        record.recommendation.proposedCanonicalIdentityChangedOnW1DAdmission,
      w1cHumanAcceptance:{
        status:'HUMAN_ACCEPTED_RECOMMENDATION_NON_CANONICAL',
        path:record.recommendation.humanAcceptancePath,
        decision:record.recommendation.humanDecision
      },
      w1dHumanDecision:null,
      lineageCandidate:record.lineageCandidate ?? {
        legacyNodeCode:null,
        successorProvisionalNodeCode:record.provisionalNodeCode,
        compatibilityStrategy:'new-identity-only-after-explicit-w1d-human-admission'
      },
      sourceAuthority:record.sourceAuthority,
      applicationStatus:'ready-for-w1d-human-admission-review-not-applied'
    }));
  const acceptedLinkRelationships=w1cAdmissionLedger.entries
    .filter(record=>record.recommendation.action==='link to existing')
    .map(record=>({
      admissionCandidateCode:record.admissionCandidateCode,
      partCode:record.partCode,
      outlineChapterCode:record.outlineChapterCode,
      sourceTitle:record.sourceTitle,
      action:'link to existing',
      targetExistingNodeCode:record.recommendation.targetExistingNodeCode,
      canonicalIdentityChanged:false,
      canonicalNodeCreated:false,
      w1cHumanAcceptance:{
        status:'HUMAN_ACCEPTED_RELATIONSHIP_RECOMMENDATION',
        path:record.recommendation.humanAcceptancePath,
        decision:record.recommendation.humanDecision
      },
      applicationStatus:'human-accepted-relationship-pending-w1d-registry-application'
    }));
  const deferredAdmissionCandidates=w1cAdmissionLedger.entries
    .filter(record=>record.recommendation.action==='defer')
    .map(record=>({
      admissionCandidateCode:record.admissionCandidateCode,
      partCode:record.partCode,
      outlineChapterCode:record.outlineChapterCode,
      sourceTitle:record.sourceTitle,
      action:'defer',
      canonicalIdentityChanged:false,
      canonicalNodeCreated:false,
      w1cHumanAcceptance:{
        status:'HUMAN_ACCEPTED_DEFERRED_DISPOSITION',
        path:record.recommendation.humanAcceptancePath,
        decision:record.recommendation.humanDecision
      },
      applicationStatus:'deferred-candidate-preserved-excluded-from-current-w1d-admission-queue'
    }));
  assert.equal(admissionCandidates.length,213);
  assert.equal(admissionCandidates.filter(record=>record.proposedAction==='promote').length,192);
  assert.equal(admissionCandidates.filter(record=>record.proposedAction==='supersede').length,21);
  assert.equal(acceptedLinkRelationships.length,66);
  assert.equal(deferredAdmissionCandidates.length,44);
  assert.equal(new Set(admissionCandidates.map(record=>record.proposedCanonicalNodeCode)).size,213);
  assert(admissionCandidates.every(record=>!nodes.some(node=>node.nodeCode===record.proposedCanonicalNodeCode)));

  const actionCounts=Object.fromEntries([...new Set(entries.map(entry=>entry.action))].sort().map(action=>[action,entries.filter(entry=>entry.action===action).length]));
  const reconciliation={
    schemaVersion:'PHI-OS-BOOK-W1D-CANONICAL-REGISTRY-RECONCILIATION-CANDIDATE-v1.0.0',
    phase:'BOOK-W1',step:'BOOK-W1D-HUMAN-REVIEW',status:'ready-for-human-review-not-active',recordedAt:'2026-08-13',
    sourceAuthority:{canonicalRegistryPath:r5.canonicalAuthority.path,canonicalRegistrySha256:r5.canonicalAuthority.successorSha256,kauR5FreezePath:'content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json',predecessorCanonicalNodeCount:716,currentCanonicalNodeCount:718},
    priorGateState:{
      w1bAccepted:true,
      w1cAdmissionReviewAuthorized:true,
      w1cAdmissionReviewCandidateCount:323,
      w1cAdmissionHumanDecisionCount:323,
      w1cAdmissionPendingHumanDecisionCount:0,
      w1cAdmissionReviewPartiallyAccepted:true,
      w1cAdmissionReviewFullyResolved:true,
      w1cBlueprintHumanAcceptanceRecorded:true,
      w1cActiveBlueprintRegistryCreated:false,
      w1dHumanReviewAllowed:true,
      w1dActivationAllowed:false
    },
    acceptanceAccounting:{existing716CanonicalNodeAuthorityAccountedFor:entries.filter(entry=>entry.baselineClass==='716-PREDECESSOR-CANONICAL-AUTHORITY').length,postBaselineHumanAcceptedAdmissionsAccountedFor:entries.filter(entry=>entry.baselineClass!=='716-PREDECESSOR-CANONICAL-AUTHORITY').length,silentDeletionCount:0,ungovernedNodeCodeMutationCount:0,duplicateActiveIdentityCount:0,orphanMigrationEntryCount:0,publicationOwnershipRecords:publicationEntries.length,untraceableOwnershipChangeCount:0},
    actionCounts,
    candidateDecisionCounts:{
      splitCandidate:0,mergeCandidate:0,newCandidate:0,canonicalIdentityChanged:0,
      upstreamAdmissionReviewCandidateCount:323,
      upstreamPromoteRecommendationCount:w1cAdmissionLedger.inventory.promote,
      upstreamLinkToExistingRecommendationCount:w1cAdmissionLedger.inventory.linkToExisting,
      upstreamSupersedeRecommendationCount:w1cAdmissionLedger.inventory.supersede,
      upstreamDeferRecommendationCount:w1cAdmissionLedger.inventory.defer,
      upstreamHumanAcceptedRecommendationCount:w1cAdmissionLedger.inventory.acceptedRecommendationCount,
      upstreamHumanResolvedDispositionCount:w1cAdmissionLedger.inventory.resolvedHumanDispositionCount,
      upstreamPendingHumanDecisionCount:w1cAdmissionLedger.inventory.pendingHumanDecisionCount,
      w1dAdmissionCandidateCount:admissionCandidates.length,
      acceptedLinkRelationshipCount:acceptedLinkRelationships.length,
      deferredAdmissionCandidateCount:deferredAdmissionCandidates.length,
      w1dAcceptedAdmissionCount:0
    },
    boundaries:{nodesJsonMutationAllowed:false,outlineChapterAutoApprovalAllowed:false,batchNodeCodeRewriteAllowed:false,legacyNodeDeletionAllowed:false,productionAuthorityCreated:false},
    entries,
    admissionCandidates,
    acceptedLinkRelationships,
    deferredAdmissionCandidates
  };
  const publication={
    schemaVersion:'PHI-OS-BOOK-W1D-PUBLICATION-OWNERSHIP-MIGRATION-CANDIDATE-v1.0.0',phase:'BOOK-W1',step:'BOOK-W1D-CANDIDATE-PREPARATION',status:'candidate-only-not-applied',recordedAt:'2026-08-13',
    recordCount:publicationEntries.length,w1bMapRecordCount:471,kauR4RehomeRecordCount:2,identityMutationCount:0,untraceableRecordCount:0,
    activation:{w1bAccepted:true,w1cBlueprintsAccepted:true,w1dHumanAcceptanceRecorded:false,nodesJsonPublicationContextMutationAllowed:false},
    records:publicationEntries
  };
  const acceptance={
    schemaVersion:'PHI-OS-BOOK-W1D-HUMAN-ACCEPTANCE-v1.0.0',phase:'BOOK-W1',step:'BOOK-W1D',status:'READY_FOR_HUMAN_REVIEW',recordedAt:null,humanActor:null,decision:null,
    priorGates:{
      w1bOutlineMigrationMapsAccepted:true,
      w1cCanonicalAdmissionReviewAuthorized:true,
      w1cCanonicalAdmissionReviewPartiallyAccepted:true,
      w1cCanonicalAdmissionReviewAccepted:true,
      w1cSuccessorBlueprintsAccepted:true
    },
    upstreamAdmissionReview:{
      path:W1C_ADMISSION_LEDGER_PATH,
      candidateCount:323,
      resolvedHumanDispositionCount:323,
      canonicalAdmissionCandidateCount:213,
      acceptedLinkRelationshipCount:66,
      deferredAdmissionCandidateCount:44,
      pendingHumanDecisionCount:0,
      approvedCanonicalNodeCount:0,
      w1dAcceptedAdmissionCount:0
    },
    reviewedArtifacts:[RECONCILIATION_PATH,PUBLICATION_PATH,W1C_ADMISSION_LEDGER_PATH,W1C_FINAL_ACCEPTANCE_PATH],
    requiredHumanDecisions:{
      existingCanonicalIdentityLedgerEntryCount:718,
      canonicalAdmissionCandidateCount:213,
      promoteCandidateCount:192,
      supersedeCandidateCount:21,
      acceptedLinkRelationshipCount:66,
      deferredCandidateCount:44,
      publicationOwnershipRecordCount:473,
      targetOnlyRehomePhysicalApplicationDecisionCount:2
    },
    acceptanceChecks:{existing716CanonicalNodeAuthorityAccountedFor:null,silentDeletionCount:null,ungovernedNodeCodeMutationCount:null,duplicateActiveIdentityCount:null,orphanMigrationEntryCount:null,allOwnershipChangesTraceable:null},
    activation:{canonicalRegistryMutationAllowed:false,publicationOwnershipMutationAllowed:false,activeAuthorityCreated:false}
  };
  return {reconciliation,publication,acceptance};
}

async function write(root,relative,value){const absolute=path.join(root,relative);await fs.mkdir(path.dirname(absolute),{recursive:true});await fs.writeFile(absolute,`${JSON.stringify(value,null,2)}\n`,'utf8');}
const isMain=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain){
  assert.equal(process.argv[2],'--write','Use --write to materialize BOOK-W1D candidate ledgers.');
  const built=await buildBookW1DReconciliation();
  await write(process.cwd(),RECONCILIATION_PATH,built.reconciliation);
  await write(process.cwd(),PUBLICATION_PATH,built.publication);
  await write(process.cwd(),ACCEPTANCE_PATH,built.acceptance);
  console.log('Generated BOOK-W1D Human Review package: 718 existing identities + 213 admission candidates + 473 publication records; activation remains blocked pending W1D acceptance.');
}
