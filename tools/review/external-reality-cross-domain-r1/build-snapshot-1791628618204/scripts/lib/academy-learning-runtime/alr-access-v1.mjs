const hasField = (value, field) => {
  if (!Object.prototype.hasOwnProperty.call(value ?? {}, field)) return false;
  const fieldValue = value[field];
  if (fieldValue === undefined || fieldValue === null) return false;
  if (typeof fieldValue === 'string') return fieldValue.trim().length > 0;
  return true;
};

const validateRequired = (value, fields = []) => fields.every(field => hasField(value, field));
const unique = values => new Set(values).size === values.length;
const sorted = values => [...values].sort();
const sameSet = (left = [], right = []) =>
  left.length === right.length && sorted(left).every((value, index) => value === sorted(right)[index]);
const exactInput = (input, fields) => validateRequired(input, fields) && sameSet(Object.keys(input), fields);
const indexBy = (items = [], field) => new Map(items.map(item => [item[field], item]));

const hasForbiddenFieldDeep = (value, forbidden) => {
  if (Array.isArray(value)) return value.some(item => hasForbiddenFieldDeep(item, forbidden));
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, nested]) =>
    forbidden.has(key) || hasForbiddenFieldDeep(nested, forbidden)
  );
};

const canonicalObject = (context, canonicalName) =>
  context.pwsCanonicalObjectRegistry?.objects?.find(item => item.canonicalName === canonicalName);
const canonicalIdentifier = (context, term) =>
  context.pwsCanonicalIdentifiers?.identifiers?.find(item => item.term === term);
const canonicalStateFamily = (context, objectName) =>
  context.pwsCanonicalStates?.stateFamilies?.find(item => item.objectName === objectName);
const canonicalOperation = (context, operationCode) =>
  context.pwsCanonicalOperations?.operations?.find(item => item.operationCode === operationCode);
const canonicalEvent = (context, eventCode) =>
  context.pwsCanonicalEvents?.events?.find(item => item.eventCode === eventCode);

export function validateAcademyAccessRuntime(context) {
  const contract = context.academyEntitlementContract;
  const scopes = context.academyAccessScopeRegistry?.accessScopes;
  const requirements = context.academyAccessRequirementRegistry?.accessRequirements;
  const levels = context.academyLevelRegistry?.levels;
  const paths = context.learningPathRegistry?.learningPaths;
  if (!contract || !Array.isArray(scopes) || !Array.isArray(requirements) ||
      !Array.isArray(levels) || !Array.isArray(paths) || scopes.length === 0 || requirements.length === 0) {
    return 'EMPTY_ACADEMY_ACCESS_RUNTIME';
  }
  const entitlementObject = canonicalObject(context, 'Entitlement');
  const entitlementIdentifier = canonicalIdentifier(context, 'Entitlement');
  const entitlementStates = canonicalStateFamily(context, 'Entitlement');
  const activate = canonicalOperation(context, 'entitlement.activate');
  const revoke = canonicalOperation(context, 'entitlement.revoke');
  const activated = canonicalEvent(context, 'entitlement.activated');
  const revoked = canonicalEvent(context, 'entitlement.revoked');
  if (entitlementObject?.ownerModule !== 'runtime/entitlement' ||
      entitlementIdentifier?.field !== 'entitlement_id' || entitlementIdentifier?.prefix !== 'ent' ||
      !sameSet(entitlementStates?.allowedStates ?? [], contract.canonicalEntitlementStates) ||
      activate?.authority !== 'entitlement.service' || revoke?.authority !== 'entitlement.service' ||
      activated?.subject !== 'Entitlement' || revoked?.subject !== 'Entitlement') {
    return 'DENY_CANONICAL_ENTITLEMENT_AUTHORITY_DRIFT';
  }
  const levelIndex = indexBy(levels, 'levelCode');
  const scopeIndex = indexBy(scopes, 'accessScopeCode');
  if (!unique(scopes.map(item => item.accessScopeCode)) || !unique(scopes.map(item => item.ordinal)) ||
      !unique(scopes.map(item => item.academyLevelCode)) || scopes.length !== levels.length) {
    return 'INVALID_ACADEMY_ACCESS_SCOPE_REGISTRY';
  }
  for (const scope of scopes) {
    const level = levelIndex.get(scope.academyLevelCode);
    if (!level || level.ordinal !== scope.ordinal ||
        (scope.accessScopeCode === 'ACADEMY_PROFESSIONAL_FORMATION' &&
          !scope.boundary.includes('does not grant professional readiness'))) {
      return 'INVALID_ACADEMY_ACCESS_SCOPE_BOUNDARY';
    }
  }
  if (!unique(requirements.map(item => item.accessRequirementCode)) ||
      !unique(requirements.map(item => item.learningPathCode)) ||
      !sameSet(requirements.map(item => item.learningPathCode), paths.map(item => item.learningPathCode))) {
    return 'ACADEMY_ACCESS_REQUIREMENT_COVERAGE_FAILURE';
  }
  const pathIndex = indexBy(paths, 'learningPathCode');
  for (const requirement of requirements) {
    if (!validateRequired(requirement, context.academyAccessRequirementRegistry.requiredFields) ||
        !requirement.accessRequirementCode.startsWith(contract.identityPrefix) ||
        requirement.status !== 'ACTIVE' || requirement.authorityReference !== 'ALR') {
      return 'INVALID_ACADEMY_ACCESS_REQUIREMENT';
    }
    const path = pathIndex.get(requirement.learningPathCode);
    const minimum = scopeIndex.get(requirement.minimumAccessScopeCode);
    if (!path || !minimum || path.academyLevelCode !== requirement.academyLevelCode ||
        minimum.academyLevelCode !== requirement.academyLevelCode) {
      return 'DANGLING_ACADEMY_ACCESS_REQUIREMENT_REFERENCE';
    }
    const expectedAccepted = scopes
      .filter(scope => scope.ordinal >= minimum.ordinal)
      .map(scope => scope.accessScopeCode);
    if (!sameSet(requirement.acceptedAccessScopeCodes, expectedAccepted)) {
      return 'INVALID_ACADEMY_ACCESS_SCOPE_COVERAGE';
    }
  }
  return 'VALID_ACADEMY_ACCESS_RUNTIME';
}

export function evaluateAcademyAccessEligibility(context, input = {}) {
  const contract = context.academyEntitlementContract;
  if (validateAcademyAccessRuntime(context) !== 'VALID_ACADEMY_ACCESS_RUNTIME') {
    return {decision: 'DENY_INVALID_ACADEMY_ACCESS_RUNTIME'};
  }
  if (hasForbiddenFieldDeep(input, new Set(contract.forbiddenInputFields))) {
    return {decision: 'DENY_ENTITLEMENT_DATA_OR_AUTHORITY_FIELD'};
  }
  if (!exactInput(input, contract.requiredEvaluationInputFields)) {
    return {decision: 'DENY_ACADEMY_ACCESS_INPUT_SHAPE'};
  }
  const requirement = context.academyAccessRequirementRegistry.accessRequirements.find(item =>
    item.accessRequirementCode === input.accessRequirementCode);
  if (!requirement) return {decision: 'DENY_UNKNOWN_ACADEMY_ACCESS_REQUIREMENT'};
  if (requirement.accessRequirementVersion !== input.accessRequirementVersion) {
    return {decision: 'DENY_ACADEMY_ACCESS_REQUIREMENT_VERSION_MISMATCH'};
  }
  if (!contract.entitlementResolutions.includes(input.entitlementResolution)) {
    return {decision: 'DENY_UNKNOWN_ENTITLEMENT_RESOLUTION'};
  }
  if (input.entitlementResolution === 'NO_CANONICAL_ENTITLEMENT') {
    return {decision: 'DENY_NO_CANONICAL_ENTITLEMENT'};
  }
  if (input.entitlementResolution === 'NON_AUTHORITATIVE_MEMBERSHIP_PROJECTION') {
    return {decision: 'DENY_NON_AUTHORITATIVE_MEMBERSHIP_PROJECTION'};
  }
  if (input.entitlementResolution !== 'CANONICAL_ENTITLEMENT_RESOLVED') {
    return {decision: 'DENY_UNKNOWN_ENTITLEMENT_RESOLUTION'};
  }
  if (!contract.canonicalEntitlementStates.includes(input.entitlementState)) {
    return {decision: 'DENY_UNKNOWN_ENTITLEMENT_STATE'};
  }
  if (input.entitlementState !== 'active') return {decision: 'DENY_ENTITLEMENT_INACTIVE'};
  if (input.entitlementSubjectMatch !== true || input.entitlementTargetMatch !== true) {
    return {decision: 'DENY_ENTITLEMENT_SUBJECT_OR_TARGET_MISMATCH'};
  }
  if (!context.academyAccessScopeRegistry.accessScopes.some(item =>
    item.accessScopeCode === input.entitlementScopeCode)) {
    return {decision: 'DENY_UNKNOWN_ACADEMY_ACCESS_SCOPE'};
  }
  if (!requirement.acceptedAccessScopeCodes.includes(input.entitlementScopeCode)) {
    return {decision: 'DENY_ENTITLEMENT_SCOPE_MISMATCH'};
  }
  const path = context.learningPathRegistry.learningPaths.find(item =>
    item.learningPathCode === requirement.learningPathCode);
  return {
    decision: 'ACADEMY_ACCESS_ELIGIBLE_DELIVERY_INACTIVE',
    accessEligibility: 'ELIGIBLE',
    accessRequirementCode: requirement.accessRequirementCode,
    learningPathCode: requirement.learningPathCode,
    academyLevelCode: requirement.academyLevelCode,
    entitlementScopeCode: input.entitlementScopeCode,
    deliveryActivationState: path.deliveryActivationState,
    entitlementAuthority: 'runtime/entitlement',
    entitlementEffect: 'NONE',
    enrollmentEffect: 'NONE',
    contentUnlockEffect: 'NONE',
    professionalAuthorityEffect: 'NONE',
    persistenceEffect: 'NONE'
  };
}

export function evaluateAcademyAccessDeliveryEligibility(context, input = {}) {
  const forbidden = new Set(context.academyEntitlementContract?.forbiddenInputFields ?? []);
  if (hasForbiddenFieldDeep(input, forbidden)) return 'DENY_ENTITLEMENT_DATA_OR_AUTHORITY_FIELD';
  if (input.requestedActivationState === 'SEMANTIC_ACCESS_ELIGIBILITY_READY_DELIVERY_BLOCKED') {
    return 'SEMANTIC_ACCESS_ELIGIBILITY_READY_DELIVERY_BLOCKED';
  }
  return 'DENY_RUNTIME_NOT_ACTIVATED';
}

export function validateProfessionalReadinessHandoffRuntime(context) {
  const contract = context.professionalReadinessHandoffContract;
  const rules = context.professionalReadinessHandoffRuleRegistry?.handoffRules;
  const capabilities = context.capabilityRegistry?.capabilities;
  const states = context.capabilityStateRegistry?.states;
  if (!contract || !Array.isArray(rules) || rules.length !== 1 ||
      !Array.isArray(capabilities) || !Array.isArray(states)) {
    return 'EMPTY_PROFESSIONAL_READINESS_HANDOFF_RUNTIME';
  }
  const readinessObject = canonicalObject(context, 'Professional Readiness');
  const readinessIdentifier = canonicalIdentifier(context, 'Professional Readiness');
  const readinessState = canonicalStateFamily(context, 'Professional Readiness');
  const readinessOperation = canonicalOperation(context, 'readiness.evaluate');
  const passedEvent = canonicalEvent(context, 'readiness.passed');
  if (readinessObject?.ownerModule !== 'runtime/workspace/readiness' ||
      readinessIdentifier?.prefix !== 'prdy' || !readinessState?.allowedStates?.includes('ready') ||
      readinessOperation?.authority !== 'professional.readiness_service' ||
      passedEvent?.causedBy?.[0] !== 'readiness.evaluate') {
    return 'DENY_CANONICAL_PROFESSIONAL_READINESS_AUTHORITY_DRIFT';
  }
  if (context.pwsProfessionalHandoffBoundary?.requiredGates?.length !== 8 ||
      context.pwsProfessionalHandoffBoundary?.handoffPolicy?.journeyCompletionMayCreateAssignment !== false ||
      context.pwsProfessionalHandoffBoundary?.handoffPolicy?.professionalResponsibilityStartsBeforeAcceptance !== false ||
      context.rdgDataPermissionContract?.outputs?.includes('ALLOW') !== true) {
    return 'DENY_PROFESSIONAL_HANDOFF_OR_RDG_AUTHORITY_DRIFT';
  }
  const rule = rules[0];
  const capabilityCodes = capabilities.map(item => item.capabilityCode);
  if (!rule.handoffRuleCode.startsWith(contract.identityPrefix) || rule.status !== 'ACTIVE' ||
      rule.authorityReference !== 'ALR' || rule.targetAuthority !== 'runtime/workspace/readiness' ||
      rule.targetOperation !== 'readiness.evaluate' || rule.requiredCapabilityState !== 'SUPPORTED' ||
      !sameSet(rule.requiredCapabilityCodes, capabilityCodes) ||
      !sameSet(rule.requiredCapabilityCodes, context.capabilityDependencyGraph?.topologicalOrder ?? []) ||
      rule.sourceCapabilityCode !== capabilityCodes.at(-1) ||
      !states.some(item => item.stateCode === rule.requiredCapabilityState)) {
    return 'INVALID_PROFESSIONAL_READINESS_HANDOFF_RULE';
  }
  return 'VALID_PROFESSIONAL_READINESS_HANDOFF_RUNTIME';
}

export function buildProfessionalReadinessHandoff(context, input = {}) {
  const contract = context.professionalReadinessHandoffContract;
  if (validateProfessionalReadinessHandoffRuntime(context) !==
      'VALID_PROFESSIONAL_READINESS_HANDOFF_RUNTIME') {
    return {decision: 'DENY_INVALID_PROFESSIONAL_READINESS_HANDOFF_RUNTIME'};
  }
  if (hasForbiddenFieldDeep(input, new Set(contract.forbiddenInputFields))) {
    return {decision: 'DENY_PROFESSIONAL_OR_LEARNER_DATA_AUTHORITY_FIELD'};
  }
  if (!exactInput(input, contract.requiredEvaluationInputFields)) {
    return {decision: 'DENY_PROFESSIONAL_READINESS_HANDOFF_INPUT_SHAPE'};
  }
  const rule = context.professionalReadinessHandoffRuleRegistry.handoffRules.find(item =>
    item.handoffRuleCode === input.handoffRuleCode);
  if (!rule) return {decision: 'DENY_UNKNOWN_PROFESSIONAL_READINESS_HANDOFF_RULE'};
  if (rule.handoffRuleVersion !== input.handoffRuleVersion) {
    return {decision: 'DENY_PROFESSIONAL_READINESS_HANDOFF_VERSION_MISMATCH'};
  }
  if (!Array.isArray(input.capabilityStateDecisions) ||
      input.capabilityStateDecisions.some(item =>
        !exactInput(item, contract.requiredCapabilityDecisionFields)) ||
      !unique(input.capabilityStateDecisions.map(item => item.capabilityCode)) ||
      !sameSet(input.capabilityStateDecisions.map(item => item.capabilityCode), rule.requiredCapabilityCodes)) {
    return {decision: 'DENY_CAPABILITY_STATE_DECISION_COVERAGE'};
  }
  const capabilityIndex = indexBy(context.capabilityRegistry.capabilities, 'capabilityCode');
  const stateCodes = context.capabilityStateRegistry.states.map(item => item.stateCode);
  for (const decision of input.capabilityStateDecisions) {
    const capability = capabilityIndex.get(decision.capabilityCode);
    if (!capability || capability.capabilityVersion !== decision.capabilityVersion ||
        !stateCodes.includes(decision.stateCode)) {
      return {decision: 'DENY_UNKNOWN_CAPABILITY_VERSION_OR_STATE'};
    }
  }
  const decisionStates = input.capabilityStateDecisions.map(item => item.stateCode);
  if (decisionStates.includes('DISPUTED')) return {decision: 'HOLD_DISPUTED_CAPABILITY'};
  if (decisionStates.includes('UNKNOWN')) return {decision: 'HOLD_UNKNOWN_CAPABILITY'};
  if (decisionStates.some(state => state !== rule.requiredCapabilityState)) {
    return {decision: 'BLOCKED_CAPABILITY_NOT_SUPPORTED'};
  }
  if (!contract.learnerChoiceDecisions.includes(input.learnerChoiceDecision) ||
      !contract.professionalServiceDecisions.includes(input.professionalServiceDecision) ||
      !contract.professionalEntitlementDecisions.includes(input.professionalEntitlementDecision) ||
      !contract.serviceConsentDecisions.includes(input.serviceConsentDecision) ||
      !contract.rdgPermissionDecisions.includes(input.rdgPermissionDecision)) {
    return {decision: 'DENY_UNKNOWN_HANDOFF_GATE_DECISION'};
  }
  if (input.learnerChoiceDecision === 'UNKNOWN') return {decision: 'HOLD_UNKNOWN_LEARNER_CHOICE'};
  if (input.learnerChoiceDecision !== 'EXPLICIT_HANDOFF_REQUESTED') return {decision: 'HANDOFF_NOT_REQUESTED'};
  if (input.professionalServiceDecision === 'UNKNOWN') return {decision: 'HOLD_UNKNOWN_PROFESSIONAL_SERVICE'};
  if (input.professionalServiceDecision !== 'SEPARATE_PROFESSIONAL_SERVICE_SELECTED') {
    return {decision: 'BLOCKED_SEPARATE_PROFESSIONAL_SERVICE_REQUIRED'};
  }
  if (input.professionalEntitlementDecision === 'UNKNOWN') return {decision: 'HOLD_UNKNOWN_PROFESSIONAL_ENTITLEMENT'};
  if (input.professionalEntitlementDecision !== 'SEPARATE_PROFESSIONAL_ENTITLEMENT_ACTIVE') {
    return {decision: 'BLOCKED_SEPARATE_PROFESSIONAL_ENTITLEMENT_REQUIRED'};
  }
  if (input.serviceConsentDecision === 'UNKNOWN') return {decision: 'HOLD_UNKNOWN_SERVICE_CONSENT'};
  if (input.serviceConsentDecision !== 'ACTIVE_SERVICE_SPECIFIC_CONSENT') {
    return {decision: 'BLOCKED_SERVICE_SPECIFIC_CONSENT_REQUIRED'};
  }
  if (input.rdgPermissionDecision === 'UNKNOWN') return {decision: 'HOLD_UNKNOWN_RDG_PERMISSION'};
  if (input.rdgPermissionDecision !== 'ALLOW_MINIMUM_NECESSARY_HANDOFF') {
    return {decision: 'DENY_RDG_PERMISSION'};
  }
  if (!Array.isArray(input.lineageReferences) || input.lineageReferences.length === 0 ||
      !unique(input.lineageReferences) ||
      input.lineageReferences.some(reference => typeof reference !== 'string' || !reference.trim())) {
    return {decision: 'DENY_MINIMUM_NECESSARY_LINEAGE'};
  }
  return {
    decision: 'READY_FOR_EXTERNAL_PROFESSIONAL_READINESS_EVALUATION',
    handoffRuleCode: rule.handoffRuleCode,
    sourceCapabilityCode: rule.sourceCapabilityCode,
    capabilityStateDecisions: structuredClone(input.capabilityStateDecisions),
    lineageReferences: [...input.lineageReferences],
    handoffState: 'READY_FOR_EXTERNAL_PROFESSIONAL_READINESS_EVALUATION',
    materializationState: 'NOT_MATERIALIZED_ALR_HANDOFF_ONLY',
    targetAuthority: rule.targetAuthority,
    targetOperation: rule.targetOperation,
    pwsRequiredGatesSatisfiedByAlr: [],
    professionalEligibilityEffect: 'NONE',
    professionalReadinessStateEffect: 'NONE',
    readinessEventEffect: 'NONE',
    assignmentEffect: 'NONE',
    professionalResponsibilityEffect: 'NONE',
    credentialEffect: 'NONE',
    entitlementEffect: 'NONE',
    persistenceOrTransferEffect: 'NONE'
  };
}

export function validateCredentialBoundaryRuntime(context) {
  const contract = context.credentialBoundaryContract;
  const boundaries = context.credentialBoundaryDecisionRegistry?.boundaryDecisions;
  if (!contract || !Array.isArray(boundaries) || boundaries.length === 0) {
    return 'EMPTY_CREDENTIAL_BOUNDARY_RUNTIME';
  }
  const credentialObject = canonicalObject(context, 'Credential');
  const credentialIdentifier = canonicalIdentifier(context, 'Credential');
  if (credentialObject?.ownerModule !== 'runtime/credential' ||
      credentialIdentifier?.field !== 'credential_id' || credentialIdentifier?.prefix !== 'cred') {
    return 'DENY_CANONICAL_CREDENTIAL_AUTHORITY_DRIFT';
  }
  if (!unique(boundaries.map(item => item.boundaryCode)) ||
      !unique(boundaries.map(item => item.artifactClass)) ||
      !sameSet(boundaries.map(item => item.artifactClass), contract.artifactClasses) ||
      boundaries.some(item => !item.boundaryCode.startsWith(contract.identityPrefix) ||
        item.classification !== 'NOT_CREDENTIAL')) {
    return 'INVALID_CREDENTIAL_BOUNDARY_DECISION_REGISTRY';
  }
  if (Object.values(context.credentialBoundaryDecisionRegistry.credentialEffects).some(Boolean)) {
    return 'DENY_CREDENTIAL_EFFECT_ACTIVATION';
  }
  return 'VALID_CREDENTIAL_BOUNDARY_RUNTIME';
}

export function evaluateCredentialBoundary(context, input = {}) {
  const contract = context.credentialBoundaryContract;
  if (validateCredentialBoundaryRuntime(context) !== 'VALID_CREDENTIAL_BOUNDARY_RUNTIME') {
    return {decision: 'DENY_INVALID_CREDENTIAL_BOUNDARY_RUNTIME'};
  }
  if (hasForbiddenFieldDeep(input, new Set(contract.forbiddenInputFields))) {
    return {decision: 'DENY_CREDENTIAL_OR_SUBJECT_DATA_AUTHORITY_FIELD'};
  }
  if (!exactInput(input, contract.requiredEvaluationInputFields)) {
    return {decision: 'DENY_CREDENTIAL_BOUNDARY_INPUT_SHAPE'};
  }
  const boundary = context.credentialBoundaryDecisionRegistry.boundaryDecisions.find(item =>
    item.boundaryCode === input.boundaryCode);
  if (!boundary) return {decision: 'DENY_UNKNOWN_CREDENTIAL_BOUNDARY'};
  if (boundary.boundaryVersion !== input.boundaryVersion) {
    return {decision: 'DENY_CREDENTIAL_BOUNDARY_VERSION_MISMATCH'};
  }
  if (!contract.artifactClasses.includes(input.artifactClass) ||
      boundary.artifactClass !== input.artifactClass ||
      boundary.artifactAuthority !== input.artifactAuthority) {
    return {decision: 'DENY_CREDENTIAL_ARTIFACT_AUTHORITY_MISMATCH'};
  }
  if (!contract.requestedCredentialActions.includes(input.requestedCredentialAction)) {
    return {decision: 'DENY_UNKNOWN_CREDENTIAL_ACTION'};
  }
  if (input.requestedCredentialAction !== 'CLASSIFY_ONLY') {
    return {decision: 'DENY_ALR_CREDENTIAL_AUTHORITY'};
  }
  return {
    decision: 'CREDENTIAL_BOUNDARY_CONFIRMED_NO_CREDENTIAL_EFFECT',
    boundaryCode: boundary.boundaryCode,
    artifactClass: boundary.artifactClass,
    classification: boundary.classification,
    credentialAuthority: 'runtime/credential and PROFESSIONAL_GOVERNANCE',
    credentialIssueEffect: 'NONE',
    credentialVerificationEffect: 'NONE',
    pwsCapabilityEffect: 'NONE',
    signatureAuthorityEffect: 'NONE',
    persistenceEffect: 'NONE'
  };
}
