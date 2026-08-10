import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildProfessionalReadinessHandoff,
  evaluateAcademyAccessDeliveryEligibility,
  evaluateAcademyAccessEligibility,
  evaluateCredentialBoundary,
  validateAcademyAccessRuntime,
  validateCredentialBoundaryRuntime,
  validateProfessionalReadinessHandoffRuntime
} from './lib/academy-learning-runtime/alr-access-v1.mjs';

const root = process.cwd();
const base = 'content/academy/academy-learning-runtime';
const read = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const readText = file => fs.readFile(path.join(root, file), 'utf8');
const normalizeText = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const digest = async file => crypto.createHash('sha256')
  .update(normalizeText(await readText(file)), 'utf8')
  .digest('hex');

const audit = await read(`${base}/audits/alr-access-reconciliation-v1.json`);
assert.equal(audit.auditVersion, '1.0.0');
assert.equal(audit.baselineCommit, '07d634195cd7b1d641fbaf5bbba60137b8ca274c');
assert.equal(audit.scope, 'ALR-W33-W35');
assert.deepEqual(audit.implementationDecision, {
  academyAccessScopeCount: 4,
  academyAccessRequirementCount: 5,
  professionalReadinessHandoffRuleCount: 1,
  credentialBoundaryClassificationCount: 6,
  academyAccessRequirementSemanticsOwnedByAlr: true,
  canonicalEntitlementLifecycleOwnedByAlr: false,
  membershipProjectionAcceptedAsCanonicalEntitlement: false,
  professionalReadinessHandoffIsUnmaterializedCandidate: true,
  professionalReadinessHandoffPassesPwsGate: false,
  credentialBoundaryIsAuthorityFirewall: true,
  alrMayIssueVerifyActivateRevokeOrPersistCredential: false,
  learnerDeliveryPersistenceOrProfessionalTransferActivated: false
});
assert.equal(audit.externalImplementationBoundary.validationMode,
  'PRESENCE_AND_BOUNDARY_ASSERTIONS_NOT_ALR_CONTENT_HASH');
assert.equal(audit.externalImplementationBoundary.externalProfessionalOrCommercialImplementationMayAdvanceWithoutAlrHashRefresh, true);
assert.equal(audit.externalImplementationBoundary.packageIntegrationMustPreserveRmoAndWave1Commands, true);
assert.equal(audit.preservation.alrW0W32ContractsRegistriesRuntimeOrFreezeMutated, false);
assert.equal(audit.preservation.programPathCapabilityOrCapabilityStateAuthorityMutated, false);
assert.equal(audit.preservation.rdgPwsProfessionalMembershipRmoWave1CarCprOrIcrAuthorityMutated, false);
assert.equal(audit.preservation.existingRuntimeOrUserDataMutated, false);
for (const source of audit.inspectedAuthorities) {
  await fs.access(path.join(root, source.reference));
  assert.equal(await digest(source.reference), source.sha256, source.reference);
}
for (const reference of [
  audit.externalImplementationBoundary.pwsCapabilityCredentialRegistryReference,
  audit.externalImplementationBoundary.professionalEligibilityReference,
  audit.externalImplementationBoundary.membershipProjectionReference
]) await fs.access(path.join(root, reference));

const masterWork = await read('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const workEntries = masterWork.entries.filter(entry => /^ALR-W(?:33|34|35)$/.test(entry.workCode));
assert.deepEqual(workEntries.map(entry => entry.workCode), ['ALR-W33', 'ALR-W34', 'ALR-W35']);
assert.deepEqual(workEntries.map(entry => entry.executionOrder), [146, 147, 148]);
assert.ok(workEntries.every(entry => entry.runtimeCode === 'ALR' && entry.status === 'PLANNED'));

const context = {
  academyEntitlementContract: await read(`${base}/contracts/academy-entitlement-contract-v1.json`),
  professionalReadinessHandoffContract: await read(`${base}/contracts/professional-readiness-handoff-contract-v1.json`),
  credentialBoundaryContract: await read(`${base}/contracts/credential-boundary-contract-v1.json`),
  academyAccessScopeRegistry: await read(`${base}/registries/academy-access-scope-registry-v1.json`),
  academyAccessRequirementRegistry: await read(`${base}/registries/academy-access-requirement-registry-v1.json`),
  professionalReadinessHandoffRuleRegistry: await read(`${base}/registries/professional-readiness-handoff-rule-registry-v1.json`),
  credentialBoundaryDecisionRegistry: await read(`${base}/registries/credential-boundary-decision-registry-v1.json`),
  academyLevelRegistry: await read(`${base}/registries/academy-level-registry-v1.json`),
  learningPathRegistry: await read(`${base}/registries/learning-path-registry-v1.json`),
  capabilityRegistry: await read(`${base}/registries/capability-registry-v1.json`),
  capabilityDependencyGraph: await read(`${base}/registries/capability-dependency-graph-v1.json`),
  capabilityStateRegistry: await read(`${base}/registries/capability-state-registry-v1.json`),
  pwsCanonicalObjectRegistry: await read('docs/pws/contracts/pws-canonical-object-registry-v1.json'),
  pwsCanonicalIdentifiers: await read('docs/pws/contracts/pws-canonical-identifiers-v1.json'),
  pwsCanonicalStates: await read('docs/pws/contracts/pws-canonical-states-v1.json'),
  pwsCanonicalOperations: await read('docs/pws/contracts/pws-canonical-operations-v1.json'),
  pwsCanonicalEvents: await read('docs/pws/contracts/pws-canonical-events-v1.json'),
  pwsProfessionalHandoffBoundary: await read('docs/pws/architecture/pws-entry-professional-handoff-boundary-v1.json'),
  rdgDataPermissionContract: await read('content/governance/reality-data-governance/contracts/data-permission-contract-v1.json')
};

assert.equal(validateAcademyAccessRuntime(context), 'VALID_ACADEMY_ACCESS_RUNTIME');
assert.equal(validateProfessionalReadinessHandoffRuntime(context),
  'VALID_PROFESSIONAL_READINESS_HANDOFF_RUNTIME');
assert.equal(validateCredentialBoundaryRuntime(context), 'VALID_CREDENTIAL_BOUNDARY_RUNTIME');
assert.equal(context.academyAccessScopeRegistry.accessScopes.length, 4);
assert.equal(context.academyAccessRequirementRegistry.accessRequirements.length, 5);
assert.equal(context.professionalReadinessHandoffRuleRegistry.handoffRules.length, 1);
assert.equal(context.credentialBoundaryDecisionRegistry.boundaryDecisions.length, 6);

const accessRequirement = context.academyAccessRequirementRegistry.accessRequirements[1];
const accessInput = overrides => ({
  accessRequirementCode: accessRequirement.accessRequirementCode,
  accessRequirementVersion: accessRequirement.accessRequirementVersion,
  entitlementResolution: 'CANONICAL_ENTITLEMENT_RESOLVED',
  entitlementScopeCode: 'ACADEMY_READER',
  entitlementState: 'active',
  entitlementSubjectMatch: true,
  entitlementTargetMatch: true,
  ...overrides
});
const beforeAccessContext = JSON.stringify(context);
const eligible = evaluateAcademyAccessEligibility(context, accessInput({}));
assert.deepEqual(eligible, {
  decision: 'ACADEMY_ACCESS_ELIGIBLE_DELIVERY_INACTIVE',
  accessEligibility: 'ELIGIBLE',
  accessRequirementCode: 'ALR-AER-BOUNDED-READING',
  learningPathCode: 'ALR-LO-PATH-BOUNDED-READING',
  academyLevelCode: 'READER',
  entitlementScopeCode: 'ACADEMY_READER',
  deliveryActivationState: 'STRUCTURE_ONLY',
  entitlementAuthority: 'runtime/entitlement',
  entitlementEffect: 'NONE',
  enrollmentEffect: 'NONE',
  contentUnlockEffect: 'NONE',
  professionalAuthorityEffect: 'NONE',
  persistenceEffect: 'NONE'
});
assert.equal(JSON.stringify(context), beforeAccessContext);
assert.equal(evaluateAcademyAccessEligibility(context,
  accessInput({entitlementResolution: 'NO_CANONICAL_ENTITLEMENT'})).decision,
  'DENY_NO_CANONICAL_ENTITLEMENT');
assert.equal(evaluateAcademyAccessEligibility(context,
  accessInput({entitlementResolution: 'NON_AUTHORITATIVE_MEMBERSHIP_PROJECTION'})).decision,
  'DENY_NON_AUTHORITATIVE_MEMBERSHIP_PROJECTION');
assert.equal(evaluateAcademyAccessEligibility(context,
  accessInput({entitlementResolution: 'MEMBERSHIP_TIER_RESOLVED'})).decision,
  'DENY_UNKNOWN_ENTITLEMENT_RESOLUTION');
for (const state of ['pending', 'suspended', 'expired', 'revoked', 'consumed']) {
  assert.equal(evaluateAcademyAccessEligibility(context,
    accessInput({entitlementState: state})).decision, 'DENY_ENTITLEMENT_INACTIVE');
}
assert.equal(evaluateAcademyAccessEligibility(context,
  accessInput({entitlementState: 'enabled'})).decision, 'DENY_UNKNOWN_ENTITLEMENT_STATE');
assert.equal(evaluateAcademyAccessEligibility(context,
  accessInput({entitlementSubjectMatch: false})).decision,
  'DENY_ENTITLEMENT_SUBJECT_OR_TARGET_MISMATCH');
assert.equal(evaluateAcademyAccessEligibility(context,
  accessInput({entitlementTargetMatch: false})).decision,
  'DENY_ENTITLEMENT_SUBJECT_OR_TARGET_MISMATCH');
assert.equal(evaluateAcademyAccessEligibility(context,
  accessInput({entitlementScopeCode: 'ACADEMY_FOUNDATION'})).decision,
  'DENY_ENTITLEMENT_SCOPE_MISMATCH');
assert.equal(evaluateAcademyAccessEligibility(context,
  accessInput({entitlementScopeCode: 'PROFESSIONAL_SERVICE'})).decision,
  'DENY_UNKNOWN_ACADEMY_ACCESS_SCOPE');
assert.equal(evaluateAcademyAccessEligibility(context,
  accessInput({accessRequirementCode: 'ALR-AER-UNKNOWN'})).decision,
  'DENY_UNKNOWN_ACADEMY_ACCESS_REQUIREMENT');
assert.equal(evaluateAcademyAccessEligibility(context,
  accessInput({accessRequirementVersion: '2.0.0'})).decision,
  'DENY_ACADEMY_ACCESS_REQUIREMENT_VERSION_MISMATCH');
assert.equal(evaluateAcademyAccessEligibility(context,
  {...accessInput({}), membershipTier: 'professional'}).decision,
  'DENY_ENTITLEMENT_DATA_OR_AUTHORITY_FIELD');
assert.equal(evaluateAcademyAccessEligibility(context,
  {...accessInput({}), extra: true}).decision, 'DENY_ACADEMY_ACCESS_INPUT_SHAPE');

const handoffRule = context.professionalReadinessHandoffRuleRegistry.handoffRules[0];
const supportedStates = handoffRule.requiredCapabilityCodes.map(capabilityCode => {
  const capability = context.capabilityRegistry.capabilities.find(item => item.capabilityCode === capabilityCode);
  return {capabilityCode, capabilityVersion: capability.capabilityVersion, stateCode: 'SUPPORTED'};
});
const handoffInput = overrides => ({
  handoffRuleCode: handoffRule.handoffRuleCode,
  handoffRuleVersion: handoffRule.handoffRuleVersion,
  capabilityStateDecisions: structuredClone(supportedStates),
  learnerChoiceDecision: 'EXPLICIT_HANDOFF_REQUESTED',
  professionalServiceDecision: 'SEPARATE_PROFESSIONAL_SERVICE_SELECTED',
  professionalEntitlementDecision: 'SEPARATE_PROFESSIONAL_ENTITLEMENT_ACTIVE',
  serviceConsentDecision: 'ACTIVE_SERVICE_SPECIFIC_CONSENT',
  rdgPermissionDecision: 'ALLOW_MINIMUM_NECESSARY_HANDOFF',
  lineageReferences: ['RDG-CAP-EVIDENCE-1', 'ALR-CAP-STATE-REVIEW-1'],
  ...overrides
});
const beforeHandoffContext = JSON.stringify(context);
const handoff = buildProfessionalReadinessHandoff(context, handoffInput({}));
assert.equal(handoff.decision, 'READY_FOR_EXTERNAL_PROFESSIONAL_READINESS_EVALUATION');
assert.equal(handoff.handoffState, 'READY_FOR_EXTERNAL_PROFESSIONAL_READINESS_EVALUATION');
assert.equal(handoff.materializationState, 'NOT_MATERIALIZED_ALR_HANDOFF_ONLY');
assert.equal(handoff.targetAuthority, 'runtime/workspace/readiness');
assert.equal(handoff.targetOperation, 'readiness.evaluate');
assert.deepEqual(handoff.pwsRequiredGatesSatisfiedByAlr, []);
assert.deepEqual({
  professionalEligibilityEffect: handoff.professionalEligibilityEffect,
  professionalReadinessStateEffect: handoff.professionalReadinessStateEffect,
  readinessEventEffect: handoff.readinessEventEffect,
  assignmentEffect: handoff.assignmentEffect,
  professionalResponsibilityEffect: handoff.professionalResponsibilityEffect,
  credentialEffect: handoff.credentialEffect,
  entitlementEffect: handoff.entitlementEffect,
  persistenceOrTransferEffect: handoff.persistenceOrTransferEffect
}, {
  professionalEligibilityEffect: 'NONE',
  professionalReadinessStateEffect: 'NONE',
  readinessEventEffect: 'NONE',
  assignmentEffect: 'NONE',
  professionalResponsibilityEffect: 'NONE',
  credentialEffect: 'NONE',
  entitlementEffect: 'NONE',
  persistenceOrTransferEffect: 'NONE'
});
assert.equal(JSON.stringify(context), beforeHandoffContext);
const disputedStates = structuredClone(supportedStates);
disputedStates[0].stateCode = 'DISPUTED';
assert.equal(buildProfessionalReadinessHandoff(context,
  handoffInput({capabilityStateDecisions: disputedStates})).decision, 'HOLD_DISPUTED_CAPABILITY');
const unknownStates = structuredClone(supportedStates);
unknownStates[0].stateCode = 'UNKNOWN';
assert.equal(buildProfessionalReadinessHandoff(context,
  handoffInput({capabilityStateDecisions: unknownStates})).decision, 'HOLD_UNKNOWN_CAPABILITY');
for (const state of ['NOT_EVALUATED', 'DEVELOPING', 'EVIDENCE_REVIEW', 'MAINTENANCE_DUE', 'SUSPENDED', 'RETIRED']) {
  const blockedStates = structuredClone(supportedStates);
  blockedStates[0].stateCode = state;
  assert.equal(buildProfessionalReadinessHandoff(context,
    handoffInput({capabilityStateDecisions: blockedStates})).decision,
    'BLOCKED_CAPABILITY_NOT_SUPPORTED');
}
assert.equal(buildProfessionalReadinessHandoff(context,
  handoffInput({learnerChoiceDecision: 'NOT_REQUESTED'})).decision, 'HANDOFF_NOT_REQUESTED');
assert.equal(buildProfessionalReadinessHandoff(context,
  handoffInput({professionalServiceDecision: 'NO_SEPARATE_PROFESSIONAL_SERVICE'})).decision,
  'BLOCKED_SEPARATE_PROFESSIONAL_SERVICE_REQUIRED');
assert.equal(buildProfessionalReadinessHandoff(context,
  handoffInput({professionalEntitlementDecision: 'NO_ACTIVE_PROFESSIONAL_ENTITLEMENT'})).decision,
  'BLOCKED_SEPARATE_PROFESSIONAL_ENTITLEMENT_REQUIRED');
assert.equal(buildProfessionalReadinessHandoff(context,
  handoffInput({serviceConsentDecision: 'NO_ACTIVE_SERVICE_SPECIFIC_CONSENT'})).decision,
  'BLOCKED_SERVICE_SPECIFIC_CONSENT_REQUIRED');
assert.equal(buildProfessionalReadinessHandoff(context,
  handoffInput({rdgPermissionDecision: 'DENY'})).decision, 'DENY_RDG_PERMISSION');
assert.equal(buildProfessionalReadinessHandoff(context,
  handoffInput({lineageReferences: ['DUPLICATE', 'DUPLICATE']})).decision,
  'DENY_MINIMUM_NECESSARY_LINEAGE');
assert.equal(buildProfessionalReadinessHandoff(context,
  {...handoffInput({}), professionalId: 'pro_00000000000000000000000000000000'}).decision,
  'DENY_PROFESSIONAL_OR_LEARNER_DATA_AUTHORITY_FIELD');

for (const boundary of context.credentialBoundaryDecisionRegistry.boundaryDecisions) {
  const result = evaluateCredentialBoundary(context, {
    boundaryCode: boundary.boundaryCode,
    boundaryVersion: boundary.boundaryVersion,
    artifactClass: boundary.artifactClass,
    artifactAuthority: boundary.artifactAuthority,
    requestedCredentialAction: 'CLASSIFY_ONLY'
  });
  assert.equal(result.decision, 'CREDENTIAL_BOUNDARY_CONFIRMED_NO_CREDENTIAL_EFFECT');
  assert.equal(result.classification, 'NOT_CREDENTIAL');
  assert.deepEqual({
    credentialIssueEffect: result.credentialIssueEffect,
    credentialVerificationEffect: result.credentialVerificationEffect,
    pwsCapabilityEffect: result.pwsCapabilityEffect,
    signatureAuthorityEffect: result.signatureAuthorityEffect,
    persistenceEffect: result.persistenceEffect
  }, {
    credentialIssueEffect: 'NONE', credentialVerificationEffect: 'NONE',
    pwsCapabilityEffect: 'NONE', signatureAuthorityEffect: 'NONE', persistenceEffect: 'NONE'
  });
}
const boundary = context.credentialBoundaryDecisionRegistry.boundaryDecisions[0];
const credentialInput = overrides => ({
  boundaryCode: boundary.boundaryCode,
  boundaryVersion: boundary.boundaryVersion,
  artifactClass: boundary.artifactClass,
  artifactAuthority: boundary.artifactAuthority,
  requestedCredentialAction: 'CLASSIFY_ONLY',
  ...overrides
});
for (const action of ['ISSUE', 'VERIFY', 'ACTIVATE', 'REVOKE', 'GRANT_CAPABILITY', 'GRANT_SIGNATURE_AUTHORITY']) {
  assert.equal(evaluateCredentialBoundary(context,
    credentialInput({requestedCredentialAction: action})).decision, 'DENY_ALR_CREDENTIAL_AUTHORITY');
}
assert.equal(evaluateCredentialBoundary(context,
  credentialInput({requestedCredentialAction: 'PRINT_CERTIFICATE'})).decision,
  'DENY_UNKNOWN_CREDENTIAL_ACTION');
assert.equal(evaluateCredentialBoundary(context,
  credentialInput({artifactAuthority: 'ALR_AND_PROFESSIONAL_GOVERNANCE'})).decision,
  'DENY_CREDENTIAL_ARTIFACT_AUTHORITY_MISMATCH');
assert.equal(evaluateCredentialBoundary(context,
  {...credentialInput({}), credentialGranted: true}).decision,
  'DENY_CREDENTIAL_OR_SUBJECT_DATA_AUTHORITY_FIELD');

const accessScopeDrift = structuredClone(context);
accessScopeDrift.academyAccessScopeRegistry.accessScopes[0].ordinal = 4;
assert.equal(validateAcademyAccessRuntime(accessScopeDrift), 'INVALID_ACADEMY_ACCESS_SCOPE_REGISTRY');
const entitlementOwnerDrift = structuredClone(context);
entitlementOwnerDrift.pwsCanonicalObjectRegistry.objects.find(item =>
  item.canonicalName === 'Entitlement').ownerModule = 'ALR';
assert.equal(validateAcademyAccessRuntime(entitlementOwnerDrift),
  'DENY_CANONICAL_ENTITLEMENT_AUTHORITY_DRIFT');
const handoffRuleDrift = structuredClone(context);
handoffRuleDrift.professionalReadinessHandoffRuleRegistry.handoffRules[0].targetAuthority = 'ALR';
assert.equal(validateProfessionalReadinessHandoffRuntime(handoffRuleDrift),
  'INVALID_PROFESSIONAL_READINESS_HANDOFF_RULE');
const readinessOwnerDrift = structuredClone(context);
readinessOwnerDrift.pwsCanonicalObjectRegistry.objects.find(item =>
  item.canonicalName === 'Professional Readiness').ownerModule = 'ALR';
assert.equal(validateProfessionalReadinessHandoffRuntime(readinessOwnerDrift),
  'DENY_CANONICAL_PROFESSIONAL_READINESS_AUTHORITY_DRIFT');
const credentialEffectDrift = structuredClone(context);
credentialEffectDrift.credentialBoundaryDecisionRegistry.credentialEffects.issue = true;
assert.equal(validateCredentialBoundaryRuntime(credentialEffectDrift), 'DENY_CREDENTIAL_EFFECT_ACTIVATION');
const credentialOwnerDrift = structuredClone(context);
credentialOwnerDrift.pwsCanonicalObjectRegistry.objects.find(item =>
  item.canonicalName === 'Credential').ownerModule = 'ALR';
assert.equal(validateCredentialBoundaryRuntime(credentialOwnerDrift),
  'DENY_CANONICAL_CREDENTIAL_AUTHORITY_DRIFT');

assert.equal(evaluateAcademyAccessDeliveryEligibility(context, {
  requestedActivationState: 'SEMANTIC_ACCESS_ELIGIBILITY_READY_DELIVERY_BLOCKED'
}), 'SEMANTIC_ACCESS_ELIGIBILITY_READY_DELIVERY_BLOCKED');
assert.equal(evaluateAcademyAccessDeliveryEligibility(context, {
  requestedActivationState: 'DELIVERY_ELIGIBLE', accessRuntimeReady: true,
  canonicalEntitlementResolved: true, learnerDeliveryReady: true
}), 'DENY_RUNTIME_NOT_ACTIVATED');
assert.equal(evaluateAcademyAccessDeliveryEligibility(context, {
  requestedActivationState: 'DELIVERY_ELIGIBLE', learnerReference: 'learner-1'
}), 'DENY_ENTITLEMENT_DATA_OR_AUTHORITY_FIELD');

const credentialSource = await readText(audit.externalImplementationBoundary.pwsCapabilityCredentialRegistryReference);
assert.match(credentialSource, /issuer_required:\s*true/);
assert.match(credentialSource, /verification_required:\s*true/);
assert.match(credentialSource, /grants_capability:\s*false/);
const professionalEligibilitySource = await readText(audit.externalImplementationBoundary.professionalEligibilityReference);
assert.match(professionalEligibilitySource, /credential_is_permission:\s*false/);
assert.match(professionalEligibilitySource, /grants_workspace_access:\s*false/);
const membershipSource = await readText(audit.externalImplementationBoundary.membershipProjectionReference);
assert.match(membershipSource, /authoritative:\s*false/);
assert.match(membershipSource, /requires_server_validation:\s*true/);

const freeze = await read(`${base}/freeze/alr-w33-w35-access-freeze-v1.json`);
assert.equal(freeze.status, 'frozen');
assert.equal(freeze.baselineCommit, audit.baselineCommit);
assert.deepEqual(freeze.completedWorks, ['ALR-W33', 'ALR-W34', 'ALR-W35']);
assert.equal(freeze.canonicalAcademyAccessScopeCount, 4);
assert.equal(freeze.canonicalLearningPathAccessRequirementCount, 5);
assert.equal(freeze.canonicalProfessionalReadinessHandoffRuleCount, 1);
assert.equal(freeze.canonicalCredentialBoundaryClassificationCount, 6);
assert.equal(freeze.canonicalEntitlementWriteOrAccessEnforcementActivatedFromAlr, false);
assert.equal(freeze.professionalEligibilityReadinessAssignmentWorkspaceQueueOrResponsibilityActivatedFromAlr, false);
assert.equal(freeze.credentialIssuanceVerificationActivationRevocationOrPersistenceActivatedFromAlr, false);
for (const output of freeze.outputs) await fs.access(path.join(root, output));

const pkg = await read('package.json');
assert.equal(pkg.scripts['check:alr-w33-w35'], 'node scripts/check-alr-w33-w35-access.mjs');
assert.equal(pkg.scripts['check:alr-access'], 'npm run check:alr-w33-w35');
const requiredPostcheckPrefix = 'npm run check:governance-data-closure && npm run check:alr-foundation && npm run check:alr-capability && npm run check:alr-learning-architecture && npm run check:car-reconciliation && npm run check:icr-foundation && npm run check:icr-runtime &&  npm run check:rmo && npm run check:alr-knowledge-learning && npm run check:alr-practice && npm run check:alr-assessment && npm run check:alr-progress && npm run check:alr-access && ';
assert.ok(pkg.scripts.postcheck.startsWith(requiredPostcheckPrefix));
assert.match(pkg.scripts.postcheck,
  /npm run check:wave1-production && npm run check:vap-w0 && npm run check:vap-w1(?: && npm run check:vap-w2)?$/);
assert.ok(pkg.scripts.postcheck.indexOf('npm run check:wave1-production') <
  pkg.scripts.postcheck.indexOf('npm run check:vap-w0'));
assert.ok(pkg.scripts.postcheck.indexOf('npm run check:vap-w0') <
  pkg.scripts.postcheck.indexOf('npm run check:vap-w1'));
const vapW2Index = pkg.scripts.postcheck.indexOf('npm run check:vap-w2');
if (vapW2Index >= 0) {
  assert.equal(pkg.scripts['check:vap-w2'],
    'node scripts/check-vap-w2-cloudflare-production-sha.mjs');
  assert.ok(pkg.scripts.postcheck.indexOf('npm run check:vap-w1') < vapW2Index);
}

console.log('✓ ALR-W33～W35 Access passed.');
console.log('✓ Academy access eligibility consumes canonical Entitlement decisions without granting or mutating Entitlement, enrollment, unlock or delivery.');
console.log('✓ Professional Readiness handoff remains an unmaterialized candidate; Credential and every Professional authority stay external and fail closed.');
