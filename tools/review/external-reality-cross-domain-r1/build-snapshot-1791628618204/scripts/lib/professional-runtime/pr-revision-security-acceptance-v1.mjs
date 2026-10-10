import crypto from 'node:crypto';
import {
  approveProfessionalDecision,
  releaseProfessionalDecision,
  reviewProfessionalDecision,
  signProfessionalDecision,
  stableDigest
} from './pr-v2.mjs';

const clean = value => typeof value === 'string' ? value.trim() : '';
const required = (value, field) => { const text = clean(value); if (!text) throw new TypeError(`${field} is required.`); return text; };
const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
const digest = value => crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const iso = (value, field) => { const text=required(value,field); const ms=Date.parse(text); if(!Number.isFinite(ms)) throw new TypeError(`${field} must be ISO date-time.`); return new Date(ms).toISOString(); };
const unique = (value, field) => { if(!Array.isArray(value)||value.length===0) throw new TypeError(`${field} must be non-empty array.`); const out=[...new Set(value.map(x=>required(x,field)))]; if(out.length!==value.length) throw new TypeError(`${field} must be unique.`); return out; };

const SECURITY_OPERATIONS = new Set(['REVISION_CREATE','REREVIEW','APPROVE','SIGN','RELEASE','PWS_HANDOFF','RR_HANDOFF']);

function verifyPackageDigest(record) {
  if (!record || typeof record !== 'object') throw new TypeError('Professional Decision Package required.');
  const copy=structuredClone(record); const actual=clean(copy.packageDigest); delete copy.packageDigest;
  if (!actual || stableDigest(copy)!==actual) throw new TypeError('Professional Decision Package digest is invalid.');
  return true;
}
function semver(value) {
  const match=/^(\d+)\.(\d+)\.(\d+)$/.exec(required(value,'version'));
  if(!match) throw new TypeError('Professional Decision version must be semantic version x.y.z.');
  return match.slice(1).map(Number);
}
function versionGreater(next, previous) {
  const a=semver(next), b=semver(previous);
  for(let i=0;i<3;i++){ if(a[i]>b[i]) return true; if(a[i]<b[i]) return false; }
  return false;
}
function assertSecurity(envelope, operationCode, caseVersionReference=null) {
  if(envelope?.objectClass!=='PR_PRODUCTION_SECURITY_ENVELOPE' || envelope.decision!=='ALLOW_PROFESSIONAL_PRODUCTION_OPERATION') throw new TypeError('Allowed Professional Production Security Envelope required.');
  if(envelope.operationCode!==operationCode) throw new TypeError(`Security Envelope operation mismatch: ${operationCode}.`);
  if(caseVersionReference && envelope.caseVersionReference!==caseVersionReference) throw new TypeError('Security Envelope Case Version mismatch.');
  const copy=structuredClone(envelope); const actual=clean(copy.securityDigest); delete copy.securityDigest;
  if(!actual || digest(copy)!==actual) throw new TypeError('Professional Production Security Envelope digest is invalid.');
  return true;
}

export function enforceProfessionalProductionSecurity(caseVersion, accessDecision, capabilityBoundary, input={}) {
  if(caseVersion?.objectClass!=='PR_CASE_VERSION' || !clean(caseVersion.versionDigest)) throw new TypeError('Canonical PR Case Version required.');
  if(accessDecision?.decision!=='ALLOW_MINIMUM_NECESSARY_PROFESSIONAL_ACCESS') throw new TypeError('Professional access must be explicitly allowed.');
  if(capabilityBoundary?.decision!=='PROFESSIONAL_CAPABILITY_BOUNDARY_SATISFIED') throw new TypeError('Professional Capability/Credential boundary must be satisfied.');
  const operationCode=required(input.operationCode,'operationCode'); if(!SECURITY_OPERATIONS.has(operationCode)) throw new TypeError('Unknown Professional production security operation.');
  const professionalReference=required(input.actorProfessionalId,'actorProfessionalId');
  if(professionalReference!==accessDecision.professionalId || professionalReference!==capabilityBoundary.professionalId) throw new TypeError('Professional actor authority mismatch.');
  if(accessDecision.customerId!==caseVersion.customerReference) throw new TypeError('Professional access customer mismatch.');
  if(required(input.assignmentReference,'assignmentReference')!==caseVersion.assignmentReference || accessDecision.assignmentReference!==caseVersion.assignmentReference) throw new TypeError('Professional Assignment mismatch.');
  if(required(input.workspaceReference,'workspaceReference')!==caseVersion.workspaceReference) throw new TypeError('Professional Workspace mismatch.');
  const consentReference=required(input.consentReference,'consentReference'); if(!caseVersion.consentReferences.includes(consentReference) || accessDecision.consentReference!==consentReference) throw new TypeError('Professional Consent reference mismatch.');
  if(input.professionalAssignmentValid!==true) throw new TypeError('Active Professional Assignment required.');
  if(input.consentValid!==true) throw new TypeError('Active Professional Consent required.');
  if(required(input.professionalAuthority,'professionalAuthority')!=='PR') throw new TypeError('Professional authority must be PR.');
  if(required(input.rdgPermissionDecision,'rdgPermissionDecision')!=='ALLOW') throw new TypeError('RDG permission must explicitly ALLOW.');
  const purpose=required(input.purpose,'purpose'); if(purpose!=='PROFESSIONAL_SERVICE' || accessDecision.purpose!==purpose) throw new TypeError('Professional Service purpose mismatch.');
  const scopes=unique(input.scope,'scope'); if(scopes.some(scope=>!caseVersion.scope.includes(scope) || !accessDecision.scopes.includes(scope))) throw new TypeError('Professional production scope exceeds authorization.');
  if(input.isolatedStorageBoundary!==true) throw new TypeError('Professional data isolation boundary required.');
  if(input.payloadFreeAccessAudit!==true) throw new TypeError('Payload-free Professional access audit required.');
  if(input.crossCaseAccess===true) throw new TypeError('Cross-case Professional access is forbidden.');
  if(input.customerSurfaceMayReadUnreleasedProfessionalData===true) throw new TypeError('Customer surface may not read unreleased Professional data.');
  if(input.accountRoleUsedAsAuthority===true) throw new TypeError('Account role cannot grant Professional production authority.');
  if(input.aiGrantedPermission===true || input.providerGrantedPermission===true) throw new TypeError('AI/provider cannot grant Professional production permission.');
  const record={
    objectClass:'PR_PRODUCTION_SECURITY_ENVELOPE',
    securityEventReference:required(input.securityEventReference,'securityEventReference'),
    operationCode,
    caseVersionReference:`${caseVersion.caseReference}:v${caseVersion.caseVersion}`,
    professionalReference,
    assignmentReference:caseVersion.assignmentReference,
    workspaceReference:caseVersion.workspaceReference,
    consentReference,
    purpose,
    rdgPermissionDecision:'ALLOW',
    decision:'ALLOW_PROFESSIONAL_PRODUCTION_OPERATION',
    payloadCopied:false,
    evaluatedAt:iso(input.evaluatedAt,'evaluatedAt'),
    securityDigest:null
  };
  const copy={...record}; delete copy.securityDigest; record.securityDigest=digest(copy);
  return freeze(record);
}

export function createProfessionalDecisionRevision(previousReleasedPackage, revisedMaterialization, securityEnvelope, input={}) {
  verifyPackageDigest(previousReleasedPackage);
  if(previousReleasedPackage.state!=='RELEASED' || !previousReleasedPackage.release?.releaseReference) throw new TypeError('Revision requires a RELEASED Professional Decision Package predecessor.');
  if(revisedMaterialization?.objectClass!=='PR_DECISION_MATERIALIZATION') throw new TypeError('Revised Professional Decision Materialization required.');
  const revisedPackage=revisedMaterialization.decisionPackage; verifyPackageDigest(revisedPackage);
  if(revisedPackage.state!=='DRAFT') throw new TypeError('Revised Professional Decision Package must start DRAFT.');
  const caseVersionReference=required(revisedMaterialization.caseVersionReference,'caseVersionReference');
  assertSecurity(securityEnvelope,'REVISION_CREATE',caseVersionReference);
  if(revisedPackage.caseReference!==previousReleasedPackage.caseReference || revisedPackage.caseReference!==caseVersionReference.split(':v')[0]) throw new TypeError('Revision Case reference mismatch.');
  if(revisedPackage.professionalId!==previousReleasedPackage.professionalId || revisedPackage.professionalId!==securityEnvelope.professionalReference) throw new TypeError('Revision Professional reference mismatch.');
  if(revisedPackage.packageReference===previousReleasedPackage.packageReference) throw new TypeError('Revision cannot overwrite previous Professional Decision Package reference.');
  if(!versionGreater(revisedPackage.version, previousReleasedPackage.version)) throw new TypeError('Revised Professional Decision version must be greater than previous version.');
  const changedBy=required(input.changedBy,'changedBy'); if(changedBy!==securityEnvelope.professionalReference) throw new TypeError('Revision changedBy must be attributable Professional.');
  const record={
    objectClass:'PR_DECISION_REVISION',
    revisionReference:required(input.revisionReference,'revisionReference'),
    caseReference:previousReleasedPackage.caseReference,
    professionalReference:previousReleasedPackage.professionalId,
    previousPackageReference:previousReleasedPackage.packageReference,
    previousPackageDigest:previousReleasedPackage.packageDigest,
    previousReleaseReference:previousReleasedPackage.release.releaseReference,
    previousVersion:previousReleasedPackage.version,
    revisedPackageReference:revisedPackage.packageReference,
    revisedPackageDigest:revisedPackage.packageDigest,
    revisedVersion:revisedPackage.version,
    reason:required(input.reason,'reason'),
    changedBy,
    createdAt:iso(input.createdAt,'createdAt'),
    requiresReReview:true,
    overwriteAllowed:false,
    previousContentPreserved:true,
    revisionDigest:null
  };
  const copy={...record}; delete copy.revisionDigest; record.revisionDigest=digest(copy);
  return freeze(record);
}

export function reReviewProfessionalDecision(revision, revisedPackage, securityEnvelope, input={}) {
  if(revision?.objectClass!=='PR_DECISION_REVISION') throw new TypeError('Professional Decision Revision required.');
  verifyPackageDigest(revisedPackage);
  if(revisedPackage.packageReference!==revision.revisedPackageReference || revisedPackage.packageDigest!==revision.revisedPackageDigest || revisedPackage.state!=='DRAFT') throw new TypeError('Revision DRAFT package binding mismatch.');
  assertSecurity(securityEnvelope,'REREVIEW');
  if(securityEnvelope.professionalReference!==required(input.reviewerProfessionalId,'reviewerProfessionalId')) throw new TypeError('Re-review security actor mismatch.');
  const reviewed=reviewProfessionalDecision(revisedPackage,input);
  const record={
    objectClass:'PR_REVISION_REREVIEW_RESULT',
    revisionReference:revision.revisionReference,
    revisionDigest:revision.revisionDigest,
    reviewedPackage:reviewed,
    previousPackageMutated:false,
    previousApprovalReused:false,
    previousSignatureReused:false,
    previousReleaseReused:false,
    resultDigest:null
  };
  const copy={...record}; delete copy.resultDigest; record.resultDigest=digest(copy);
  return freeze(record);
}

export function transitionRevisedProfessionalDecision(revision, packageRecord, securityEnvelope, input={}) {
  if(revision?.objectClass!=='PR_DECISION_REVISION') throw new TypeError('Professional Decision Revision required.');
  verifyPackageDigest(packageRecord);
  const operationCode=required(securityEnvelope?.operationCode,'securityEnvelope.operationCode');
  assertSecurity(securityEnvelope,operationCode);
  if(packageRecord.packageReference!==revision.revisedPackageReference) throw new TypeError('Revision lifecycle package reference mismatch.');
  if(operationCode==='APPROVE') {
    if(securityEnvelope.professionalReference!==required(input.approverProfessionalId,'approverProfessionalId')) throw new TypeError('Approval security actor mismatch.');
    return approveProfessionalDecision(packageRecord,input);
  }
  if(operationCode==='SIGN') {
    if(securityEnvelope.professionalReference!==required(input.signerProfessionalId,'signerProfessionalId')) throw new TypeError('Signature security actor mismatch.');
    return signProfessionalDecision(packageRecord,input);
  }
  if(operationCode==='RELEASE') {
    if(securityEnvelope.professionalReference!==required(input.releasedBy,'releasedBy')) throw new TypeError('Release security actor mismatch.');
    return releaseProfessionalDecision(packageRecord,input);
  }
  throw new TypeError('Unsupported secured revision lifecycle transition.');
}

export function bindProfessionalHandoffSecurity(handoff, securityEnvelope, operationCode) {
  if(!handoff || typeof handoff!=='object') throw new TypeError('Professional handoff artifact required.');
  assertSecurity(securityEnvelope,operationCode);
  if(!['PWS_HANDOFF','RR_HANDOFF'].includes(operationCode)) throw new TypeError('Security binding only supports PWS/RR handoffs.');
  const handoffReference=required(handoff.handoffReference,'handoffReference');
  const handoffDigest=required(handoff.handoffDigest,'handoffDigest');
  const record={
    objectClass:'PR_SECURED_PRODUCTION_HANDOFF',
    operationCode,
    handoffReference,
    handoffDigest,
    securityEventReference:securityEnvelope.securityEventReference,
    securityDigest:securityEnvelope.securityDigest,
    businessAuthorityChanged:false,
    payloadCopied:false,
    bindingDigest:null
  };
  const copy={...record}; delete copy.bindingDigest; record.bindingDigest=digest(copy);
  return freeze(record);
}

export function buildProfessionalProductionAcceptance(input={}) {
  const initial=required(input.initialReleasedPackage?.packageReference,'initialReleasedPackage.packageReference');
  const revised=required(input.revisedReleasedPackage?.packageReference,'revisedReleasedPackage.packageReference');
  verifyPackageDigest(input.initialReleasedPackage); verifyPackageDigest(input.revisedReleasedPackage);
  if(input.initialReleasedPackage.state!=='RELEASED' || input.revisedReleasedPackage.state!=='RELEASED') throw new TypeError('Production Acceptance requires both initial and revised RELEASED packages.');
  if(input.revision?.objectClass!=='PR_DECISION_REVISION' || input.revision.previousPackageReference!==initial || input.revision.revisedPackageReference!==revised) throw new TypeError('Production Acceptance revision chain mismatch.');
  const securityEvents=Array.isArray(input.securityEnvelopes)?input.securityEnvelopes:[];
  if(securityEvents.length<5 || securityEvents.some(item=>item?.decision!=='ALLOW_PROFESSIONAL_PRODUCTION_OPERATION')) throw new TypeError('Production Acceptance requires governed security events.');
  const pws=input.pwsSecurityBinding, rr=input.rrSecurityBinding;
  if(pws?.objectClass!=='PR_SECURED_PRODUCTION_HANDOFF' || pws.operationCode!=='PWS_HANDOFF') throw new TypeError('Secured PWS handoff required.');
  if(rr?.objectClass!=='PR_SECURED_PRODUCTION_HANDOFF' || rr.operationCode!=='RR_HANDOFF') throw new TypeError('Secured RR handoff required.');
  const record={
    objectClass:'PR_PRODUCTION_ACCEPTANCE',
    initialReleasedPackageReference:initial,
    initialReleasedPackageDigest:input.initialReleasedPackage.packageDigest,
    revisionReference:input.revision.revisionReference,
    revisedReleasedPackageReference:revised,
    revisedReleasedPackageDigest:input.revisedReleasedPackage.packageDigest,
    securityEventReferences:freeze(securityEvents.map(item=>item.securityEventReference)),
    pwsHandoffReference:pws.handoffReference,
    rrHandoffReference:rr.handoffReference,
    storageExecutionActive:false,
    pwsMutationExecutionActive:false,
    previousReleasePreserved:true,
    acceptanceDigest:null
  };
  const copy={...record}; delete copy.acceptanceDigest; record.acceptanceDigest=digest(copy);
  return freeze(record);
}

export const PR_E7_E10_SECURITY_OPERATIONS=freeze([...SECURITY_OPERATIONS]);
