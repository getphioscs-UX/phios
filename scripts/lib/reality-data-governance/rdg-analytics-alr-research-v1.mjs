const KNOWLEDGE_USAGE_EVENTS = new Set([
  'EXPOSURE',
  'OPEN',
  'EXPAND',
  'COMPLETE',
  'REVISIT',
  'READING_POSITION',
  'READING_DURATION',
  'RELATED_NODE_FOLLOW',
  'READING_PATH_REFERENCE'
]);

const LEARNING_RECORD_TYPES = new Set([
  'LEARNING_EXPOSURE',
  'LESSON_PROGRESS',
  'PRACTICE_ATTEMPT',
  'ASSESSMENT_RESPONSE',
  'ASSESSMENT_RESULT',
  'REFLECTION',
  'CAPABILITY_EVIDENCE_REFERENCE'
]);

const present = value => value !== undefined && value !== null && value !== '';

export function classifyProductDataLayer(input = {}) {
  if (input.formalOperation === true) {
    const eligible = input.operationSucceeded === true &&
      input.operationGoverned === true &&
      present(input.canonicalStateReference) &&
      present(input.causationReference);
    return eligible ? 'RUNTIME_EVENT_ELIGIBLE' : 'NON_CANONICAL_OPERATION_ATTEMPT';
  }
  if (
    input.productMetric === true &&
    input.purposeCode === 'PRODUCT_ANALYTICS' &&
    input.analyticsConsentValid === true
  ) return 'PRODUCT_ANALYTICS';
  return 'UI_TELEMETRY';
}

export function evaluateKnowledgeUsageRecord(input = {}) {
  const forbidden = ['rawArticleContent', 'freeTextQuery', 'knowledgeAuthorityMutation', 'truthScore'];
  if (forbidden.some(field => present(input[field]))) return 'DENY_FORBIDDEN_FIELD';
  const required = ['usageRecordCode', 'eventType', 'surface', 'locale', 'recordedAt', 'purposeCode'];
  if (required.some(field => !present(input[field]))) return 'UNRESOLVED';
  if (!present(input.nodeCode) && !present(input.assetCode)) return 'UNRESOLVED';
  if (!KNOWLEDGE_USAGE_EVENTS.has(input.eventType)) return 'DENY_EVENT_TYPE';
  if (input.purposeCode !== 'PRODUCT_ANALYTICS') return 'DENY_PURPOSE';
  if (input.analyticsConsentValid !== true) return 'REQUIRE_ANALYTICS_CONSENT';
  if (input.knowledgeAuthorityMutationRequested === true) return 'DENY_AUTHORITY_EFFECT';
  return 'ALLOW_USAGE_RECORD';
}

export function evaluateLearningRecord(input = {}) {
  const forbidden = ['capabilityState', 'capabilityAchieved', 'capabilityLevel', 'credentialGranted'];
  if (forbidden.some(field => present(input[field]))) return 'DENY_ALR_AUTHORITY';
  const required = ['recordCode', 'recordType', 'subjectReference', 'purposeCode'];
  if (required.some(field => !present(input[field]))) return 'UNRESOLVED';
  if (!LEARNING_RECORD_TYPES.has(input.recordType)) return 'DENY_RECORD_TYPE';
  if (!['LEARNING_DELIVERY', 'CAPABILITY_TRACKING'].includes(input.purposeCode)) return 'DENY_PURPOSE';
  if (input.permissionAllowed !== true) return 'DENY_PERMISSION';
  if (present(input.response) && (!present(input.sensitivityClass) || !present(input.retentionClass))) {
    return 'REQUIRE_CLASSIFICATION';
  }
  return 'ALLOW_LEARNING_RECORD';
}

export function evaluateCapabilityEvidence(input = {}) {
  if (present(input.capabilityState) || input.capabilityAchieved === true) return 'DENY_ALR_AUTHORITY';
  if (input.watchedLessonOnly === true || input.assessmentScoreOnly === true) return 'INELIGIBLE';
  if (input.disputed === true) return 'DISPUTED';
  if (input.unknown === true) return 'UNKNOWN';
  const required = [
    'capabilityEvidenceCode',
    'learningRecordReference',
    'practiceReference',
    'assessmentReference',
    'criterionResults',
    'lineageReferences',
    'recordedAt'
  ];
  if (required.some(field => !present(input[field]))) return 'INSUFFICIENT';
  if (!Array.isArray(input.criterionResults) || input.criterionResults.length === 0) return 'INSUFFICIENT';
  if (!Array.isArray(input.lineageReferences) || input.lineageReferences.length === 0) return 'INSUFFICIENT';
  return 'ELIGIBLE_FOR_ALR_REVIEW';
}

export function evaluateResearchDataset(input = {}) {
  if (input.activationApproved !== true) return 'COLLECTION_DISABLED';
  if (!present(input.rdgApprovalReference)) return 'REQUIRE_RDG_APPROVAL';
  const required = [
    'datasetCode',
    'researchPurposeReference',
    'sourceContractReferences',
    'aggregationSpecReference',
    'anonymizationProofReference',
    'consentOrLegalBasisReferences',
    'retentionClass',
    'createdAt'
  ];
  if (required.some(field => !present(input[field]))) return 'UNRESOLVED';
  if (!Array.isArray(input.sourceContractReferences) || input.sourceContractReferences.length === 0) return 'UNRESOLVED';
  if (!Array.isArray(input.consentOrLegalBasisReferences) || input.consentOrLegalBasisReferences.length === 0) return 'UNRESOLVED';
  if (input.purposeCode !== 'RESEARCH_AGGREGATION' || input.purposeLimited !== true) return 'DENY_PURPOSE';
  if (input.anonymized !== true || input.aggregated !== true) return 'DENY_GOVERNANCE';
  if (
    input.reidentificationPossible === true ||
    input.containsDirectIdentifiers === true ||
    input.containsRowLevelData === true
  ) return 'DENY_REIDENTIFICATION_RISK';
  const threshold = input.governedMinimumCohortSize;
  if (!Number.isInteger(threshold) || threshold <= 1) return 'UNRESOLVED_MINIMUM_COHORT';
  if (!Number.isInteger(input.cohortSize) || input.cohortSize < threshold) return 'DENY_MINIMUM_COHORT';
  if (
    input.sourceIncludesPrivateOrProfessionalData === true &&
    (input.researchConsentValid !== true || !present(input.legalBasisReference))
  ) return 'REQUIRE_RESEARCH_CONSENT_AND_LAWFUL_BASIS';
  return 'ELIGIBLE_FOR_GOVERNED_MATERIALIZATION';
}
