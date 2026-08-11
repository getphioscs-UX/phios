import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  approveProfessionalDecision,
  authorizeProfessionalAccess,
  buildProfessionalCase,
  releaseProfessionalDecision,
  reviewProfessionalDecision,
  signProfessionalDecision,
  validateProfessionalCapabilityBoundary
} from './lib/professional-runtime/pr-v2.mjs';
import {
  materializeProfessionalCaseVersion,
  resolveProfessionalEvidencePackage
} from './lib/professional-runtime/pr-production-extension-v1.mjs';
import {
  buildPwsProfessionalDecisionHandoff,
  buildRrProfessionalApprovalHandoff,
  materializeProfessionalDecision
} from './lib/professional-runtime/pr-decision-workspace-report-integration-v1.mjs';
import {
  bindProfessionalHandoffSecurity,
  buildProfessionalProductionAcceptance,
  createProfessionalDecisionRevision,
  enforceProfessionalProductionSecurity,
  reReviewProfessionalDecision,
  transitionRevisedProfessionalDecision
} from './lib/professional-runtime/pr-revision-security-acceptance-v1.mjs';

const root=process.cwd();
const base='content/runtime/professional-runtime/extensions/production';
const readText=file=>fs.readFile(path.join(root,file),'utf8');
const read=async file=>JSON.parse(await readText(file));
const norm=s=>s.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
const digestFile=async file=>crypto.createHash('sha256').update(norm(await readText(file)),'utf8').digest('hex');

const e4Freeze=await read(`${base}/freeze/pr-e4-e6-decision-integration-freeze-v1.json`);
assert.equal(e4Freeze.status,'FROZEN_POST_FREEZE_DECISION_WORKSPACE_REPORT_INTEGRATION');
assert.equal(e4Freeze.finalExtensionFreeze,false);
assert.equal(e4Freeze.nextExtension,'PR-E7');

const preservation=await read(`${base}/freeze/pr-e7-e10-final-extension-preservation-manifest-v1.json`);
assert.equal(preservation.baselineCommit,'d150a741231abe608a0d994e9e5787e6c71cfc3d');
for(const item of preservation.preserved){
  assert.equal(await digestFile(item.reference),item.sha256,`PR_E7_E10_PRESERVATION:${item.reference}`);
}
assert.ok(Object.values(preservation.rules).every(value=>value===false || value===true));
assert.equal(preservation.rules.prV2BaseFreezeRewritten,false);
assert.equal(preservation.rules.prE1E3FreezeRewritten,false);
assert.equal(preservation.rules.prE4E6FreezeRewritten,false);

const revisionContract=await read(`${base}/contracts/pr-decision-revision-rereview-contract-v1.json`);
assert.equal(revisionContract.revisionSourceState,'RELEASED');
assert.equal(revisionContract.revisionTargetState,'DRAFT');
assert.equal(revisionContract.rules.releasedDecisionMayBeOverwritten,false);
assert.equal(revisionContract.rules.revisionRequiresReReview,true);
assert.equal(revisionContract.rules.approvalMayBeReusedFromPreviousVersion,false);
assert.equal(revisionContract.rules.signatureMayBeReusedFromPreviousVersion,false);
assert.equal(revisionContract.rules.releaseMayBeReusedFromPreviousVersion,false);

const securityContract=await read(`${base}/contracts/pr-production-security-rdg-enforcement-contract-v1.json`);
assert.equal(securityContract.status,'ACTIVE_OPERATION_SCOPED_ENFORCEMENT');
assert.equal(securityContract.rules.permissionMayBeInferredFromRole,false);
assert.equal(securityContract.rules.permissionMayBeGrantedByAi,false);
assert.equal(securityContract.rules.crossCaseAccessAllowed,false);
assert.equal(securityContract.rules.customerSurfaceMayReadUnreleasedProfessionalData,false);

const rdgPermission=await read('content/governance/reality-data-governance/contracts/data-permission-contract-v1.json');
assert.equal(rdgPermission.rules.missingGovernanceFailsClosed,true);
assert.equal(rdgPermission.rules.aiMayGrantPermission,false);
const rdgIsolation=await read('content/governance/reality-data-governance/contracts/professional-data-isolation-v1.json');
assert.equal(rdgIsolation.rules.crossCaseAccessForbidden,true);
assert.equal(rdgIsolation.rules.customerSurfaceMayReadUnreleasedProfessionalData,false);
assert.equal(rdgIsolation.rules.reportMayApproveProfessionalJudgment,false);
assert.equal(rdgIsolation.rules.aiMayCreateProfessionalJudgment,false);

const baseFixture=await read(`${base}/fixtures/pr-production-extension.valid.json`);
const e4Fixture=await read(`${base}/fixtures/pr-e4-e6-production-slice.valid.json`);
const fixture=await read(`${base}/fixtures/pr-e7-e10-production-acceptance.valid.json`);

const caseContext=buildProfessionalCase(baseFixture.case);
const primaryAccess=authorizeProfessionalAccess(caseContext,baseFixture.access);
const caseVersion=materializeProfessionalCaseVersion(caseContext,baseFixture.caseVersion);
const resolved=resolveProfessionalEvidencePackage(caseVersion,primaryAccess,baseFixture.evidenceRequest,baseFixture.sourceCatalogue);
const primaryCapability=validateProfessionalCapabilityBoundary(caseContext,e4Fixture.capability);

const initialMaterialization=materializeProfessionalDecision(caseContext,caseVersion,resolved,primaryCapability,{...e4Fixture.materialization,caseVersionDigest:caseVersion.versionDigest});
const initialDraft=initialMaterialization.decisionPackage;
const initialReviewed=reviewProfessionalDecision(initialDraft,e4Fixture.review);
const initialApproved=approveProfessionalDecision(initialReviewed,e4Fixture.approval);
const initialSigned=signProfessionalDecision(initialApproved,e4Fixture.signature);
const initialReleased=releaseProfessionalDecision(initialSigned,e4Fixture.release);
assert.equal(initialReleased.state,'RELEASED');
const initialFrozenSnapshot=JSON.stringify(initialReleased);

const revisedMaterialization=materializeProfessionalDecision(caseContext,caseVersion,resolved,primaryCapability,{...fixture.revisionMaterialization,caseVersionDigest:caseVersion.versionDigest});
assert.equal(revisedMaterialization.decisionPackage.state,'DRAFT');
assert.notEqual(revisedMaterialization.decisionPackage.packageReference,initialReleased.packageReference);

const actorAccess=professionalId=>({
  ...primaryAccess,
  professionalId
});
const actorCapability=professionalId=>({
  decision:'PROFESSIONAL_CAPABILITY_BOUNDARY_SATISFIED',
  professionalId,
  capabilityReferences:['CAP-RUNTIME-REVIEW'],
  credentialReferences:['CRED-RUNTIME-REVIEW'],
  alrCapabilityReferences:[],
  alrPermissionEffect:'NONE',
  accountRolePermissionEffect:'NONE'
});
let securityCounter=0;
const security=(operationCode,professionalId,at,overrides={})=>enforceProfessionalProductionSecurity(
  caseVersion,
  actorAccess(professionalId),
  actorCapability(professionalId),
  {
    operationCode,
    actorProfessionalId:professionalId,
    assignmentReference:caseVersion.assignmentReference,
    workspaceReference:caseVersion.workspaceReference,
    securityEventReference:`PR-SEC-${++securityCounter}-${operationCode}`,
    evaluatedAt:at,
    ...fixture.security,
    ...overrides
  }
);

const revisionSecurity=security('REVISION_CREATE','PRO-001','2026-08-11T13:34:00Z');
const revision=createProfessionalDecisionRevision(initialReleased,revisedMaterialization,revisionSecurity,fixture.revision);
assert.equal(revision.objectClass,'PR_DECISION_REVISION');
assert.equal(revision.previousPackageDigest,initialReleased.packageDigest);
assert.equal(revision.revisedPackageDigest,revisedMaterialization.decisionPackage.packageDigest);
assert.equal(revision.requiresReReview,true);
assert.equal(revision.overwriteAllowed,false);
assert.equal(revision.previousContentPreserved,true);

const reReviewSecurity=security('REREVIEW','PRO-004','2026-08-11T13:59:00Z');
const reReviewResult=reReviewProfessionalDecision(revision,revisedMaterialization.decisionPackage,reReviewSecurity,fixture.reReview);
const revisedReviewed=reReviewResult.reviewedPackage;
assert.equal(revisedReviewed.state,'REVIEWED');
assert.equal(revisedReviewed.review.reviewerProfessionalId,'PRO-004');
assert.equal(reReviewResult.previousApprovalReused,false);
assert.equal(reReviewResult.previousSignatureReused,false);
assert.equal(reReviewResult.previousReleaseReused,false);

const approveSecurity=security('APPROVE','PRO-003','2026-08-11T14:14:00Z');
const revisedApproved=transitionRevisedProfessionalDecision(revision,revisedReviewed,approveSecurity,fixture.approval);
const signSecurity=security('SIGN','PRO-001','2026-08-11T14:29:00Z');
const revisedSigned=transitionRevisedProfessionalDecision(revision,revisedApproved,signSecurity,fixture.signature);
const releaseSecurity=security('RELEASE','PRO-001','2026-08-11T14:44:00Z');
const revisedReleased=transitionRevisedProfessionalDecision(revision,revisedSigned,releaseSecurity,fixture.release);
assert.deepEqual([revisedMaterialization.decisionPackage.state,revisedReviewed.state,revisedApproved.state,revisedSigned.state,revisedReleased.state],['DRAFT','REVIEWED','APPROVED','SIGNED','RELEASED']);
assert.equal(revisedReleased.version,'2.0.0');
assert.notEqual(revisedReleased.approval.approvalReference,initialReleased.approval.approvalReference);
assert.notEqual(revisedReleased.signature.signatureReference,initialReleased.signature.signatureReference);
assert.notEqual(revisedReleased.release.releaseReference,initialReleased.release.releaseReference);
assert.equal(JSON.stringify(initialReleased),initialFrozenSnapshot,'PREVIOUS_RELEASE_MUTATED');

const staleMaterialization=materializeProfessionalDecision(caseContext,caseVersion,resolved,primaryCapability,{
  ...fixture.revisionMaterialization,
  caseVersionDigest:caseVersion.versionDigest,
  observationReference:'PR-OBS-STALE',
  judgmentReference:'PR-JUDGMENT-STALE',
  recommendationReference:'PR-RECOMMENDATION-STALE',
  decisionPackageReference:'PR-DECISION-STALE',
  decisionVersion:'1.0.0'
});
assert.throws(()=>createProfessionalDecisionRevision(initialReleased,staleMaterialization,revisionSecurity,{
  ...fixture.revision,
  revisionReference:'PR-REVISION-STALE'
}),/version must be greater/);

assert.throws(()=>transitionRevisedProfessionalDecision(revision,revisedMaterialization.decisionPackage,approveSecurity,fixture.approval),/REVIEWED before APPROVED/);

assert.throws(()=>security('REVISION_CREATE','PRO-001','2026-08-11T15:00:00Z',{rdgPermissionDecision:'DENY'}),/RDG permission/);
assert.throws(()=>security('REVISION_CREATE','PRO-001','2026-08-11T15:00:01Z',{consentValid:false}),/Consent/);
assert.throws(()=>security('REVISION_CREATE','PRO-001','2026-08-11T15:00:02Z',{crossCaseAccess:true}),/Cross-case/);
assert.throws(()=>security('REVISION_CREATE','PRO-001','2026-08-11T15:00:03Z',{accountRoleUsedAsAuthority:true}),/Account role/);
assert.throws(()=>security('REVISION_CREATE','PRO-001','2026-08-11T15:00:04Z',{aiGrantedPermission:true}),/AI\/provider/);
assert.throws(()=>security('REVISION_CREATE','PRO-001','2026-08-11T15:00:05Z',{providerGrantedPermission:true}),/AI\/provider/);
assert.throws(()=>security('REVISION_CREATE','PRO-001','2026-08-11T15:00:06Z',{customerSurfaceMayReadUnreleasedProfessionalData:true}),/Customer surface/);
assert.throws(()=>security('REVISION_CREATE','PRO-001','2026-08-11T15:00:07Z',{scope:['outside_scope']}),/scope exceeds/);

const pwsHandoff=buildPwsProfessionalDecisionHandoff(revisedMaterialization,revisedReleased,{...e4Fixture.workspace,currentDeliverableState:'released'});
const pwsSecurity=security('PWS_HANDOFF','PRO-001','2026-08-11T14:46:00Z');
const securedPws=bindProfessionalHandoffSecurity(pwsHandoff,pwsSecurity,'PWS_HANDOFF');
assert.equal(securedPws.businessAuthorityChanged,false);
assert.equal(pwsHandoff.executionFlags.pwsOperationExecutedByPr,false);
assert.equal(pwsHandoff.executionFlags.pwsPersistencePerformedByPr,false);

const rrHandoff=buildRrProfessionalApprovalHandoff(revisedMaterialization,revisedReleased,e4Fixture.rr);
const rrSecurity=security('RR_HANDOFF','PRO-001','2026-08-11T14:47:00Z');
const securedRr=bindProfessionalHandoffSecurity(rrHandoff,rrSecurity,'RR_HANDOFF');
assert.equal(securedRr.businessAuthorityChanged,false);
assert.equal(rrHandoff.authorityFlags.rrCreatesProfessionalApproval,false);
assert.equal(rrHandoff.authorityFlags.prCreatesReport,false);

const acceptanceRecord=buildProfessionalProductionAcceptance({
  initialReleasedPackage:initialReleased,
  revision,
  revisedReleasedPackage:revisedReleased,
  securityEnvelopes:[revisionSecurity,reReviewSecurity,approveSecurity,signSecurity,releaseSecurity,pwsSecurity,rrSecurity],
  pwsSecurityBinding:securedPws,
  rrSecurityBinding:securedRr
});
assert.equal(acceptanceRecord.objectClass,'PR_PRODUCTION_ACCEPTANCE');
assert.equal(acceptanceRecord.storageExecutionActive,false);
assert.equal(acceptanceRecord.pwsMutationExecutionActive,false);
assert.equal(acceptanceRecord.previousReleasePreserved,true);
assert.equal(Object.isFrozen(acceptanceRecord),true);

for(const schemaFile of [
  `${base}/schemas/pr-decision-revision-cycle-v1.schema.json`,
  `${base}/schemas/pr-production-security-envelope-v1.schema.json`,
  `${base}/schemas/pr-production-acceptance-v1.schema.json`
]){
  const schema=await read(schemaFile);
  assert.equal(schema.$schema,'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.type,'object');
  assert.equal(schema.additionalProperties,false);
  assert.ok(Array.isArray(schema.required)&&schema.required.length>0);
}

const acceptance=await read(`${base}/acceptance/pr-e7-e10-acceptance-v1.json`);
assert.equal(acceptance.status,'accepted_final_post_freeze_extension');
assert.ok(Object.values(acceptance.requiredAssertions).every(Boolean));

const finalFreeze=await read(`${base}/freeze/pr-production-extension-freeze-v1.json`);
assert.equal(finalFreeze.status,'PR-PRODUCTION-EXTENSION-v1.0.0-FROZEN');
assert.equal(finalFreeze.scope,'PR-E1-E10');
assert.deepEqual(finalFreeze.completedExtensions,['PR-E1','PR-E2','PR-E3','PR-E4','PR-E5','PR-E6','PR-E7','PR-E8','PR-E9','PR-E10']);
assert.equal(finalFreeze.finalExtensionFreeze,true);
assert.equal(finalFreeze.nonActivation.caseStorageExecutionActive,false);
assert.equal(finalFreeze.nonActivation.pwsMutationExecutionActive,false);
assert.equal(finalFreeze.nonActivation.liveCustomerDataActivated,false);
assert.equal(finalFreeze.authorityClosure.report,'RR');
assert.equal(finalFreeze.authorityClosure.workspaceExecution,'PWS');
for(const output of finalFreeze.outputs) await fs.access(path.join(root,output));

const pkg=await read('package.json');
assert.equal(pkg.scripts['check:pr-production'],'npm run check:pr-production-foundation');
assert.equal(pkg.scripts['check:pr-production-e4-e6'],'npm run check:pr-production && npm run check:pr-decision-integration');
assert.equal(pkg.scripts['check:pr-e7-e10'],'node scripts/check-pr-e7-e10-production-final-freeze.mjs');
assert.equal(pkg.scripts['check:pr-production-final'],'npm run check:pr-e7-e10');
assert.equal(pkg.scripts['check:pr-production-complete'],'npm run check:pr && npm run check:pr-production-e4-e6 && npm run check:pr-production-final');
const cmds=String(pkg.scripts.postcheck||'').split('&&').map(x=>x.trim()).filter(Boolean);
const foundationIndex=cmds.indexOf('npm run check:pr-production-foundation');
const integrationIndex=cmds.indexOf('npm run check:pr-decision-integration');
const finalIndex=cmds.indexOf('npm run check:pr-production-final');
assert.ok(foundationIndex>=0&&integrationIndex>foundationIndex&&finalIndex>integrationIndex,'POSTCHECK_PR_PRODUCTION_FINAL_ORDER');
assert.equal(cmds.filter(x=>x==='npm run check:pr-production-final').length,1);

console.log('✓ PR-E7-E10 Revision, security, production acceptance and final extension freeze passed.');
console.log('✓ RELEASED Professional Decisions are immutable; revisions create a higher-version DRAFT and must complete a new Review → Approval → Signature → Release chain.');
console.log('✓ Production operations consume explicit Assignment, Consent, Capability/Credential and RDG ALLOW decisions; role, AI/provider permission, cross-case access and unreleased customer visibility fail closed.');
console.log('✓ PWS and RR handoffs are security-bound by reference while PWS mutation/persistence and RR Professional approval creation remain external.');
console.log('✓ PR Production Extension E1-E10 is frozen without claiming live customer activation, Case storage execution or PWS mutation execution.');
