import {
  buildAcademyLessonProjection,
  stableDigest,
  validateAlrPresentationRuntime
} from './alr-presentation-v1.mjs';

const hasOwn = (value, field) => Object.prototype.hasOwnProperty.call(value ?? {}, field);
const sameSet = (left = [], right = []) =>
  left.length === right.length && [...left].sort().every((value, index) =>
    value === [...right].sort()[index]);
const isSemver = value => /^\d+\.\d+\.\d+$/.test(value ?? '');
const isIso = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const indexBy = (items = [], field) => new Map(items.map(item => [item[field], item]));

const hasForbiddenFieldDeep = (value, forbidden) => {
  if (Array.isArray(value)) return value.some(item => hasForbiddenFieldDeep(item, forbidden));
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, nested]) =>
    forbidden.has(key) || hasForbiddenFieldDeep(nested, forbidden));
};

const rgEntries = context => context.rgAliasRegistry?.entries ?? [];
const rgGroups = context => context.rgGroupRegistry?.groups ?? [];

function validateCheckerIntegration(context) {
  const contract = context.alrRgCheckerIntegrationContract;
  const registry = context.alrCheckerAliasRegistry;
  if (!contract || contract.status !== 'active' || !registry || registry.status !== 'canonical') {
    return 'ALR_RG_INTEGRATION_EMPTY_OR_INACTIVE';
  }
  if (contract.operationalIntegration !== 'ACTIVE_RUNTIME_OWNED_RG_CONFORMANT' ||
      contract.centralRgRegistrationState !== 'DEFERRED_TO_RG_AUTHORIZED_EXPANSION' ||
      contract.rules.alrMayMutateFrozenRgV3Registry !== false ||
      contract.rules.alrMayClaimCentralRegistrationBeforeRgExpansion !== false) {
    return 'ALR_RG_AUTHORITY_BOUNDARY_INVALID';
  }
  const entries = registry.entries;
  const expectedWorkCodes = Array.from({length: 47}, (_, index) => `ALR-W${index}`);
  if (!Array.isArray(entries) || entries.length !== 47 ||
      !sameSet(entries.map(entry => entry.workCode), expectedWorkCodes) ||
      new Set(entries.map(entry => entry.checkerId)).size !== 47 ||
      entries.some(entry => entry.runtimeCode !== 'ALR' || entry.status !== 'canonical' ||
        entry.canonicalCommand !== `npm run check:alr -- ${entry.workCode}` ||
        !/^scripts\/check-alr-.+\.mjs$/.test(entry.implementationFile) ||
        !/^[a-f0-9]{64}$/.test(entry.implementationDigest))) {
    return 'ALR_CHECKER_ALIAS_COVERAGE_INVALID';
  }
  if (rgEntries(context).some(entry => entry.runtimeCode === 'ALR') ||
      rgGroups(context).some(group => group.runtimeCodes?.includes?.('ALR') || group.runtimeCode === 'ALR')) {
    return 'FROZEN_RG_V3_FALSE_REGISTRATION_DETECTED';
  }
  return 'VALID_ALR_RG_CHECKER_INTEGRATION';
}

function validateRdgAcceptance(context) {
  const contract = context.alrRdgAcceptanceContract;
  const dataEntry = context.rdgCanonicalDataRegistry?.entries?.find(entry =>
    entry.runtimeCode === 'ALR');
  const learning = context.rdgAlrLearningDataContract;
  const evidence = context.rdgCapabilityEvidenceBoundary;
  if (!contract || contract.status !== 'active' || !dataEntry || !learning || !evidence) {
    return 'ALR_RDG_ACCEPTANCE_EMPTY_OR_INACTIVE';
  }
  if (contract.acceptanceDecision !== 'ACCEPTED_CONTRACT_VALIDATION_ONLY' ||
      contract.rdgActivationState !== 'RESERVED_NOT_IMPLEMENTED' ||
      dataEntry.activationState !== 'RESERVED_NOT_IMPLEMENTED' ||
      !sameSet(contract.allowedPurposes, dataEntry.allowedPurposes) ||
      !sameSet(contract.allowedPersistenceClasses, dataEntry.allowedPersistenceClasses) ||
      !sameSet(contract.producedDataTypes, dataEntry.producedDataTypes) ||
      !sameSet(contract.consumedDataTypes, dataEntry.consumedDataTypes)) {
    return 'ALR_RDG_DATA_CONTRACT_DRIFT';
  }
  if (dataEntry.permissions.evidencePromotion !== 'DENY_REALITY_EVIDENCE' ||
      dataEntry.permissions.professionalDataWrite !== 'DENY' ||
      dataEntry.permissions.analyticsWrite !== 'DENY' ||
      contract.rules.acceptanceActivatesLiveLearningData !== false ||
      contract.rules.acceptanceAuthorizesPersistence !== false ||
      learning.rules.permissionMustBeResolvedBeforePersistence !== true ||
      learning.rules.learningRecordMaySetCapabilityState !== false ||
      evidence.rules.onlyAlrMayDetermineCapabilityState !== true ||
      evidence.rules.capabilityEvidenceIsCapabilityState !== false) {
    return 'ALR_RDG_AUTHORITY_OR_ACTIVATION_DRIFT';
  }
  return 'VALID_ALR_RDG_ACCEPTANCE';
}

function validatePdsAcceptance(context) {
  const contract = context.alrPdsAcceptanceContract;
  const pds = context.pdsFullSiteAcceptance;
  if (!contract || contract.status !== 'active' || !pds) return 'ALR_PDS_ACCEPTANCE_EMPTY_OR_INACTIVE';
  if (contract.acceptanceDecision !== 'STATIC_ACCEPTED_PRODUCTION_REVALIDATION_REQUIRED' ||
      pds.status !== 'implementation-complete-production-revalidation-required' ||
      !sameSet(contract.acceptanceViewportsPx, pds.scope.viewports) ||
      !sameSet(contract.supportedLocales, pds.scope.locales) ||
      !sameSet(contract.requiredStates, pds.scope.stateCoverage) ||
      contract.minimumTouchTargetPx !== pds.scope.minimumTouchTargetPx ||
      contract.rules.keyboardOperationRequired !== pds.scope.keyboardOperationRequired ||
      contract.rules.visibleFocusRequired !== pds.scope.focusVisibilityRequired ||
      contract.rules.horizontalScrollAtAcceptanceViewportsAllowed !== pds.scope.horizontalPageScrollAllowed ||
      contract.rules.localOrPreviewAcceptanceEqualsProductionAcceptance !== false ||
      contract.rules.productionMatrixMustBeRevalidatedAfterDeployment !== true) {
    return 'ALR_PDS_ACCEPTANCE_SCOPE_DRIFT';
  }
  return 'VALID_ALR_PDS_ACCEPTANCE';
}

export function validateAlrGovernanceProductionRuntime(context) {
  const validations = [
    validateCheckerIntegration(context),
    validateRdgAcceptance(context),
    validatePdsAcceptance(context),
    validateAlrPresentationRuntime(context)
  ];
  const expected = [
    'VALID_ALR_RG_CHECKER_INTEGRATION',
    'VALID_ALR_RDG_ACCEPTANCE',
    'VALID_ALR_PDS_ACCEPTANCE',
    'VALID_ALR_PRESENTATION_RUNTIME'
  ];
  const failed = validations.find((value, index) => value !== expected[index]);
  return failed ?? 'VALID_ALR_GOVERNANCE_PRODUCTION_RUNTIME';
}

const deny = decision => ({decision});
const find = (items, field, value) => items.find(item => item[field] === value);

export function buildAlrFoundationVerticalSlice(context, input) {
  if (validateAlrGovernanceProductionRuntime(context) !==
      'VALID_ALR_GOVERNANCE_PRODUCTION_RUNTIME') {
    return deny('DENY_INVALID_ALR_GOVERNANCE_PRODUCTION_RUNTIME');
  }
  const contract = context.alrFoundationVerticalSliceContract;
  if (!contract || contract.status !== 'active' ||
      contract.sliceMode !== 'FOUNDATION_VALIDATION_ONLY') {
    return deny('DENY_INVALID_FOUNDATION_VERTICAL_SLICE_CONTRACT');
  }
  if (hasForbiddenFieldDeep(input, new Set(contract.forbiddenInputFields))) {
    return deny('DENY_LEARNER_DATA_OR_EXTERNAL_AUTHORITY_FIELD');
  }
  if (!input || typeof input !== 'object' ||
      !sameSet(Object.keys(input), contract.requiredInputFields)) {
    return deny('DENY_FOUNDATION_VERTICAL_SLICE_INPUT_SHAPE');
  }
  if (input.sliceCode !== contract.sliceCode || !isSemver(input.sliceVersion) ||
      !isSemver(input.projectionVersion) || !isIso(input.generatedAt)) {
    return deny('DENY_FOUNDATION_VERTICAL_SLICE_IDENTITY_VERSION_OR_TIME');
  }
  if (input.providerUsed !== false || input.aiUsed !== false) {
    return deny('DENY_PROVIDER_OR_AI_FOUNDATION_VERTICAL_SLICE');
  }
  const refs = contract.canonicalReferences;
  if (input.lessonCode !== refs.lessonCode) return deny('DENY_NON_CANONICAL_FOUNDATION_LESSON');

  const program = find(context.programRegistry.programs, 'programCode', refs.programCode);
  const learningPath = find(context.learningPathRegistry.learningPaths,
    'learningPathCode', refs.learningPathCode);
  const module = find(context.moduleRegistry.modules, 'moduleCode', refs.moduleCode);
  const lesson = find(context.lessonRegistry.lessons, 'lessonCode', refs.lessonCode);
  const objectives = refs.learningObjectiveCodes.map(code => find(
    context.learningObjectiveRegistry.learningObjectives, 'learningObjectiveCode', code));
  const capability = find(context.capabilityRegistry.capabilities,
    'capabilityCode', refs.capabilityCode);
  const knowledge = find(context.knowledgeToLearningProjectionRegistry.projections,
    'projectionCode', refs.knowledgeProjectionCode);
  const practice = find(context.practiceRegistry.practices, 'practiceCode', refs.practiceCode);
  const assessment = find(context.assessmentRegistry.assessments,
    'assessmentCode', refs.assessmentCode);
  const progress = find(context.learningProgressScopeRegistry.progressScopes,
    'progressCode', refs.progressCode);
  if ([program, learningPath, module, lesson, capability, knowledge, practice, assessment, progress,
    ...objectives].some(item => !item)) {
    return deny('DENY_FOUNDATION_VERTICAL_SLICE_REFERENCE_MISSING');
  }
  if (learningPath.programCode !== program.programCode ||
      module.learningPathCode !== learningPath.learningPathCode ||
      lesson.moduleCode !== module.moduleCode ||
      !sameSet(lesson.learningObjectiveCodes, refs.learningObjectiveCodes) ||
      objectives.some(objective => objective.lessonCode !== lesson.lessonCode ||
        objective.capabilityCode !== capability.capabilityCode) ||
      !sameSet(capability.requiredEvidenceCriteria.map(item => item.criterionCode),
        objectives.map(objective => objective.evidenceCriterionCode)) ||
      knowledge.lessonCode !== lesson.lessonCode ||
      practice.lessonCode !== lesson.lessonCode ||
      assessment.lessonCode !== lesson.lessonCode ||
      assessment.practiceCode !== practice.practiceCode ||
      assessment.capabilityCode !== capability.capabilityCode ||
      progress.lessonCode !== lesson.lessonCode || progress.practiceCode !== practice.practiceCode ||
      progress.assessmentCode !== assessment.assessmentCode ||
      progress.capabilityCode !== capability.capabilityCode) {
    return deny('DENY_FOUNDATION_VERTICAL_SLICE_LINEAGE_DRIFT');
  }

  const presentation = buildAcademyLessonProjection(context, {
    viewCode: input.viewCode,
    projectionVersion: input.projectionVersion,
    locale: input.locale,
    lessonCode: input.lessonCode,
    generatedAt: input.generatedAt,
    providerUsed: input.providerUsed,
    aiUsed: input.aiUsed
  });
  if (presentation.decision?.startsWith?.('DENY_')) {
    return deny('DENY_FOUNDATION_VERTICAL_SLICE_PRESENTATION');
  }

  const result = {
    schemaVersion: 'PHI-OS-ALR-FOUNDATION-VERTICAL-SLICE-v1.0.0',
    sliceCode: input.sliceCode,
    sliceVersion: input.sliceVersion,
    sliceMode: contract.sliceMode,
    decision: 'ACCEPT_FOUNDATION_VERTICAL_SLICE_VALIDATION',
    generatedAt: input.generatedAt,
    locale: input.locale,
    academyLevelCode: contract.academyLevelCode,
    lineage: {
      programCode: program.programCode,
      learningPathCode: learningPath.learningPathCode,
      moduleCode: module.moduleCode,
      lessonCode: lesson.lessonCode,
      learningObjectiveCodes: objectives.map(item => item.learningObjectiveCode),
      capabilityCode: capability.capabilityCode,
      knowledgeProjectionCode: knowledge.projectionCode,
      practiceCode: practice.practiceCode,
      assessmentCode: assessment.assessmentCode,
      progressCode: progress.progressCode
    },
    learningProjection: {
      localizedLessonTitle: presentation.lesson.title,
      localizedObjectiveCount: presentation.lesson.objectives.length,
      sourceAuthority: presentation.sourceReading.authority,
      sourceContentCopied: presentation.sourceReading.contentCopiedIntoProjection,
      teachingDeliveryState: presentation.teachingStructure.deliveryState,
      practiceState: presentation.practiceState,
      assessmentState: presentation.assessmentState,
      canonicalPresentationState: presentation.canonicalPresentationState
    },
    effects: {
      learnerDataAccepted: false,
      responseCapture: 'INACTIVE',
      assessmentExecution: 'INACTIVE',
      progressWrite: 'NONE',
      capabilityStateWrite: 'NONE',
      enrollmentOrDelivery: 'NONE',
      canonicalPresentationOrPublishedAsset: 'NONE',
      credentialOrProfessionalAuthority: 'NONE',
      providerAiNetworkOrPersistence: 'NONE'
    }
  };
  return {...result, sliceDigest: stableDigest(result)};
}

export function assertAlrFoundationVerticalSliceDigest(slice) {
  if (!slice || !hasOwn(slice, 'sliceDigest')) return false;
  const {sliceDigest, ...unsigned} = slice;
  return sliceDigest === stableDigest(unsigned);
}
