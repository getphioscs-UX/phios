import crypto from 'node:crypto';
import {
  createProfessionalDecisionPackage,
  createProfessionalJudgment,
  createProfessionalObservation,
  createProfessionalRecommendation,
  stableDigest
} from './pr-v2.mjs';

const clean = value => typeof value === 'string' ? value.trim() : '';
const required = (value, field) => { const text = clean(value); if (!text) throw new TypeError(`${field} is required.`); return text; };
const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const digest = value => crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])])) : value;

const CLASS_TO_FIELD = Object.freeze({
  RAW_DATA:'rawDataReferences', REALITY:'realityReferences', EVIDENCE:'evidenceReferences', READOUT:'readoutReferences', METRICS:'metricReferences',
  MEANING:'meaningReferences', KNOWLEDGE:'knowledgeReferences', JOURNEY:'journeyReferences', UNKNOWN:'unknownReferences'
});

function verifyPackageDigest(record) {
  const copy = structuredClone(record || {}); const actual = clean(copy.packageDigest); delete copy.packageDigest;
  if (!actual || stableDigest(copy) !== actual) throw new TypeError('Professional Decision Package digest is invalid.');
  return true;
}
function evidenceProjection(resolved) {
  if (resolved?.objectClass !== 'PR_RESOLVED_EVIDENCE_PACKAGE' || !clean(resolved.packageDigest)) throw new TypeError('Resolved Professional Evidence Package required.');
  const fields = Object.fromEntries(Object.values(CLASS_TO_FIELD).map(key => [key, []]));
  for (const source of resolved.resolvedSources || []) {
    const field = CLASS_TO_FIELD[source.sourceClass]; if (!field) throw new TypeError(`Unsupported resolved source class: ${source.sourceClass}`);
    fields[field].push(freeze({reference:source.reference, dataType:source.dataType || null, referenceKind:source.referenceKind || null, authority:source.authority, sourceDigest:source.sourceDigest || null}));
  }
  const record = {objectClass:'PR_DECISION_EVIDENCE_PROJECTION', packageReference:`${resolved.packageReference}#decision`, sourceResolvedPackageReference:resolved.packageReference, sourceResolvedPackageDigest:resolved.packageDigest, ...fields,
    rawDataCountsAsEvidence:false, metricCountsAsJudgment:false, readoutCountsAsJudgment:false, sourcePayloadCopied:false};
  record.packageDigest = stableDigest(record); return freeze(record);
}

export function materializeProfessionalDecision(caseContext, caseVersion, resolvedEvidence, capabilityBoundary, input = {}) {
  if (caseContext?.objectClass !== 'PR_CASE_CONTEXT') throw new TypeError('Canonical PR Case Context required.');
  if (caseVersion?.objectClass !== 'PR_CASE_VERSION' || caseVersion.status !== 'ACTIVE') throw new TypeError('Active canonical PR Case Version required.');
  if (caseVersion.caseReference !== caseContext.caseId || caseVersion.versionDigest !== required(input.caseVersionDigest, 'caseVersionDigest')) throw new TypeError('Case Version binding mismatch.');
  if (resolvedEvidence?.caseVersionReference !== `${caseVersion.caseReference}:v${caseVersion.caseVersion}`) throw new TypeError('Resolved Evidence Package Case Version mismatch.');
  if (capabilityBoundary?.decision !== 'PROFESSIONAL_CAPABILITY_BOUNDARY_SATISFIED' || capabilityBoundary.professionalId !== caseVersion.professionalReference) throw new TypeError('Professional capability boundary mismatch.');
  const humanProfessionalId = required(input.humanProfessionalId, 'humanProfessionalId');
  if (humanProfessionalId !== caseVersion.professionalReference) throw new TypeError('Human Professional attribution mismatch.');
  if (input.aiAuthoredJudgment === true || input.providerAuthoredJudgment === true || input.automaticRecommendation === true) throw new TypeError('Automated Professional semantic authoring is forbidden.');
  const projected = evidenceProjection(resolvedEvidence);
  const observation = createProfessionalObservation(caseContext, projected, {observationReference:input.observationReference, observation:input.observation, createdAt:input.observationCreatedAt});
  const judgment = createProfessionalJudgment(caseContext, projected, observation, capabilityBoundary, {judgmentReference:input.judgmentReference, judgment:input.judgment, scope:input.scope, limitations:input.judgmentLimitations, createdAt:input.judgmentCreatedAt});
  const recommendation = createProfessionalRecommendation(caseContext, projected, judgment, capabilityBoundary, {recommendationReference:input.recommendationReference, recommendation:input.recommendation, scope:input.scope, limitations:input.recommendationLimitations, evidenceReferences:input.evidenceReferences, alternativeReferences:input.alternativeReferences, createdAt:input.recommendationCreatedAt});
  const decisionPackage = createProfessionalDecisionPackage(caseContext, observation, judgment, recommendation, {packageReference:input.decisionPackageReference, version:input.decisionVersion, unknown:input.unknown, alternative:input.alternative, boundary:input.boundary, createdAt:input.decisionCreatedAt});
  const record = {objectClass:'PR_DECISION_MATERIALIZATION', caseVersionReference:`${caseVersion.caseReference}:v${caseVersion.caseVersion}`, caseVersionDigest:caseVersion.versionDigest, professionalReference:humanProfessionalId,
    evidenceProjection:projected, observation, judgment, recommendation, decisionPackage,
    authorityFlags:{humanProfessionalAttributable:true,aiJudgmentCreated:false,providerJudgmentCreated:false,automaticRecommendationCreated:false,readoutConvertedToJudgment:false,metricConvertedToJudgment:false,rawDataPromotedToEvidence:false}, materializationDigest:null};
  record.materializationDigest = digest({...record, materializationDigest:null}); return freeze(record);
}

const PWS_STAGE = Object.freeze({
  DRAFT:{pwsState:'draft',operation:null,target:null,handoff:'READY_FOR_WORKSPACE_DRAFT_PROJECTION'},
  REVIEWED:{pwsState:'review_required',operation:'deliverable.freeze',target:'approved',handoff:'READY_FOR_PWS_DELIVERABLE_FREEZE'},
  APPROVED:{pwsState:'approved',operation:'deliverable.sign',target:'signed',handoff:'READY_FOR_PWS_DELIVERABLE_SIGN'},
  SIGNED:{pwsState:'signed',operation:'deliverable.release',target:'released',handoff:'READY_FOR_PWS_DELIVERABLE_RELEASE'},
  RELEASED:{pwsState:'released',operation:null,target:null,handoff:'PWS_DELIVERABLE_RELEASE_ACKNOWLEDGED'}
});

export function buildPwsProfessionalDecisionHandoff(materialization, packageRecord, workspace = {}) {
  if (materialization?.objectClass !== 'PR_DECISION_MATERIALIZATION') throw new TypeError('Professional Decision Materialization required.');
  verifyPackageDigest(packageRecord);
  if (packageRecord.packageReference !== materialization.decisionPackage.packageReference) throw new TypeError('Decision Package reference mismatch.');
  const stage = PWS_STAGE[packageRecord.state]; if (!stage) throw new TypeError('Unsupported Professional lifecycle state for PWS handoff.');
  const workspaceReference = required(workspace.workspaceReference, 'workspaceReference');
  const assignmentReference = required(workspace.assignmentReference, 'assignmentReference');
  const deliverableReference = required(workspace.deliverableReference, 'deliverableReference');
  if (workspaceReference !== required(workspace.expectedWorkspaceReference, 'expectedWorkspaceReference')) throw new TypeError('PWS Workspace reference mismatch.');
  if (assignmentReference !== required(workspace.expectedAssignmentReference, 'expectedAssignmentReference')) throw new TypeError('PWS Assignment reference mismatch.');
  if (clean(workspace.assignmentState) !== 'active') throw new TypeError('Active PWS Assignment required.');
  if (workspace.consentValidated !== true || clean(workspace.workspaceStatus) === 'access_revoked') throw new TypeError('Active consent-validated Professional Workspace required.');
  if (clean(workspace.currentDeliverableState) !== stage.pwsState) throw new TypeError(`PWS Deliverable state mismatch for PR ${packageRecord.state}.`);
  if (workspace.deliverableProvisionedExternally !== true) throw new TypeError('Existing externally provisioned PWS Deliverable required.');
  const operation = stage.operation;
  const idempotencyKey = `pr-pws:${digest({deliverableReference,packageDigest:packageRecord.packageDigest,operation:operation||'projection'})}`;
  const record = {objectClass:'PR_PWS_DECISION_HANDOFF',handoffReference:`${packageRecord.packageReference}#PWS-${packageRecord.state}`,workspaceReference,assignmentReference,deliverableReference,
    decisionPackageReference:packageRecord.packageReference,decisionPackageDigest:packageRecord.packageDigest,prState:packageRecord.state,pwsCurrentState:stage.pwsState,requestedOperation:operation,requestedTargetState:stage.target,idempotencyKey,handoffState:stage.handoff,
    executionFlags:{workspaceMutatedByPr:false,deliverableMutatedByPr:false,pwsOperationExecutedByPr:false,pwsPersistencePerformedByPr:false,pwsDeliverableCreatedByPr:false},handoffDigest:null};
  record.handoffDigest=digest({...record,handoffDigest:null}); return freeze(record);
}

export function buildRrProfessionalApprovalHandoff(materialization, packageRecord, input = {}) {
  if (materialization?.objectClass !== 'PR_DECISION_MATERIALIZATION') throw new TypeError('Professional Decision Materialization required.');
  verifyPackageDigest(packageRecord);
  if (!['APPROVED','SIGNED','RELEASED'].includes(packageRecord.state) || !packageRecord.approval) throw new TypeError('PR APPROVED or later Decision Package required for RR handoff.');
  const signatureRequired = input.signatureRequired === true;
  if (signatureRequired && !['SIGNED','RELEASED'].includes(packageRecord.state)) throw new TypeError('PR signature required before RR professional handoff.');
  if (signatureRequired && !packageRecord.signature?.signatureReference) throw new TypeError('PR signature reference required before RR professional handoff.');
  const caseReference=required(input.caseReference,'caseReference'), customerReference=required(input.customerReference,'customerReference'), serviceReference=required(input.serviceReference,'serviceReference');
  if (!materialization.caseVersionReference.startsWith(`${caseReference}:v`)) throw new TypeError('RR handoff Case reference mismatch.');
  const sources=[
    {sectionCode:'PROFESSIONAL_OBSERVATION',reference:materialization.observation.observationReference,kind:'RDG_DATA',dataType:'OUTCOME_RECORD',authority:'PR',semanticRole:'PROFESSIONAL_OBSERVATION',state:'VALID',availability:'AVAILABLE'},
    {sectionCode:'PROFESSIONAL_JUDGMENT',reference:materialization.judgment.judgmentReference,kind:'RDG_DATA',dataType:'PROFESSIONAL_JUDGMENT_RECORD',authority:'PR',semanticRole:'PROFESSIONAL_JUDGMENT',state:'VALID',availability:'AVAILABLE'},
    {sectionCode:'RECOMMENDATION',reference:materialization.recommendation.recommendationReference,kind:'RDG_DATA',dataType:'OUTCOME_RECORD',authority:'PR',semanticRole:'PROFESSIONAL_RECOMMENDATION',state:'VALID',availability:'AVAILABLE'}
  ];
  const professionalApproval={authorityRuntime:'PR',approvalReference:packageRecord.approval.approvalReference,approvedBy:packageRecord.approval.approverProfessionalId,approvedAt:packageRecord.approval.approvedAt,signatureReference:packageRecord.signature?.signatureReference??null};
  const record={objectClass:'PR_RR_PROFESSIONAL_APPROVAL_HANDOFF',handoffReference:`${packageRecord.packageReference}#RR-APPROVAL`,caseReference,customerReference,serviceReference,decisionPackageReference:packageRecord.packageReference,decisionPackageDigest:packageRecord.packageDigest,
    professionalApproval,professionalSources:freeze(sources),handoffState:'READY_FOR_RR_PROFESSIONAL_APPROVAL_GATE',authorityFlags:{rrCreatesProfessionalApproval:false,prCreatesReportApproval:false,prCreatesReport:false,reportAssemblyAuthorityRemainsRr:true},handoffDigest:null};
  record.handoffDigest=digest({...record,handoffDigest:null}); return freeze(record);
}

export function buildRrProfessionalSectionRegistryProjection(baseRegistry, consumerExtension) {
  if (!Array.isArray(baseRegistry?.sections)) throw new TypeError('RR section registry required.');
  if (consumerExtension?.sourceRegistryMutated !== false || consumerExtension?.extension?.sectionCode !== 'RECOMMENDATION') throw new TypeError('Valid RR PR consumer successor required.');
  const copy=structuredClone(baseRegistry); const section=copy.sections.find(item=>item.sectionCode==='RECOMMENDATION'); if(!section) throw new TypeError('RR RECOMMENDATION section missing.');
  if (!section.acceptedDataTypes.includes('OUTCOME_RECORD')) section.acceptedDataTypes.push('OUTCOME_RECORD');
  if (!section.acceptedAuthorities.includes('PR')) section.acceptedAuthorities.push('PR');
  return freeze({...copy,projectionMode:'VERSIONED_CONSUMER_SUCCESSOR_EPHEMERAL',baseRegistryMutated:false,requiredPrOutcomeKind:'PROFESSIONAL_RECOMMENDATION'});
}
