import crypto from 'node:crypto';

const hasOwn = (value, field) => Object.prototype.hasOwnProperty.call(value ?? {}, field);
const isText = value => typeof value === 'string' && value.trim().length > 0;
const unique = values => new Set(values).size === values.length;
const sorted = values => [...values].sort();
const sameSet = (left = [], right = []) =>
  left.length === right.length && sorted(left).every((value, index) => value === sorted(right)[index]);
const clone = value => structuredClone(value);

const stable = value => {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
};

export const stableDigest = value => `sha256:${crypto.createHash('sha256')
  .update(JSON.stringify(stable(value)), 'utf8')
  .digest('hex')}`;

const exactInput = (input, fields) =>
  input && typeof input === 'object' &&
  fields.every(field => hasOwn(input, field)) &&
  sameSet(Object.keys(input), fields);

const hasForbiddenFieldDeep = (value, forbidden) => {
  if (Array.isArray(value)) return value.some(item => hasForbiddenFieldDeep(item, forbidden));
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, nested]) =>
    forbidden.has(key) || hasForbiddenFieldDeep(nested, forbidden)
  );
};

const isSemver = value => /^\d+\.\d+\.\d+$/.test(value ?? '');
const isIso = value => isText(value) && Number.isFinite(Date.parse(value));
const indexBy = (items = [], field) => new Map(items.map(item => [item[field], item]));

const publicationList = context => context.publishedAssetRegistry?.publications ?? [];
const academyPublications = context => publicationList(context).filter(publication =>
  publication.assetType === 'ACADEMY_LESSON' ||
  publication.surface === 'ACADEMY' ||
  publication.surfaces?.includes?.('ACADEMY')
);

const presentationGate = context => academyPublications(context).length > 0
  ? 'READY_FOR_CPR_CANONICAL_VALIDATION'
  : context.cprAcademyContract.sourceAssetGate.emptyPublishedAssetRegistryDecision;

const getView = (context, viewCode) =>
  context.academyPresentationViewRegistry.views.find(view => view.viewCode === viewCode);

const getLocaleProjection = (context, lessonCode, locale) => {
  const set = context.localeLearningProjectionRegistry.projectionSets.find(item =>
    item.lessonCode === lessonCode);
  if (!set || !hasOwn(set.locales, locale)) return null;
  return {set, localized: set.locales[locale]};
};

function validateArchitecture(context) {
  const programs = context.programRegistry?.programs;
  const paths = context.learningPathRegistry?.learningPaths;
  const modules = context.moduleRegistry?.modules;
  const lessons = context.lessonRegistry?.lessons;
  const objectives = context.learningObjectiveRegistry?.learningObjectives;
  if (!Array.isArray(programs) || programs.length !== 1 || !Array.isArray(paths) ||
      !Array.isArray(modules) || !Array.isArray(lessons) || !Array.isArray(objectives) ||
      paths.length === 0 || paths.length !== modules.length || modules.length !== lessons.length) {
    return 'INVALID_ACADEMY_ARCHITECTURE_COUNTS';
  }
  if (![programs, paths, modules, lessons, objectives].every(items =>
    unique(items.map(item => item[Object.keys(item).find(key => key.endsWith('Code'))])))) {
    return 'DUPLICATE_ACADEMY_ARCHITECTURE_IDENTITY';
  }
  const program = programs[0];
  const pathIndex = indexBy(paths, 'learningPathCode');
  const moduleIndex = indexBy(modules, 'moduleCode');
  const lessonIndex = indexBy(lessons, 'lessonCode');
  const objectiveIndex = indexBy(objectives, 'learningObjectiveCode');
  if (!sameSet(program.learningPathCodes, paths.map(item => item.learningPathCode))) {
    return 'PROGRAM_PATH_COVERAGE_INVALID';
  }
  for (const path of paths) {
    if (path.programCode !== program.programCode || path.moduleCodes.length !== 1) {
      return 'PATH_PROGRAM_OR_MODULE_BINDING_INVALID';
    }
    const module = moduleIndex.get(path.moduleCodes[0]);
    if (!module || module.learningPathCode !== path.learningPathCode || module.lessonCodes.length !== 1) {
      return 'MODULE_PATH_OR_LESSON_BINDING_INVALID';
    }
    const lesson = lessonIndex.get(module.lessonCodes[0]);
    if (!lesson || lesson.moduleCode !== module.moduleCode || lesson.learningObjectiveCodes.length === 0) {
      return 'LESSON_MODULE_OR_OBJECTIVE_BINDING_INVALID';
    }
    for (const objectiveCode of lesson.learningObjectiveCodes) {
      if (objectiveIndex.get(objectiveCode)?.lessonCode !== lesson.lessonCode) {
        return 'LESSON_OBJECTIVE_RECIPROCITY_INVALID';
      }
    }
    if (!pathIndex.has(path.learningPathCode)) return 'PATH_REFERENCE_INVALID';
  }
  return 'VALID_ACADEMY_ARCHITECTURE';
}

function validateLocaleRuntime(context) {
  const contract = context.localeLearningProjectionContract;
  const registry = context.localeLearningProjectionRegistry;
  const lessons = context.lessonRegistry?.lessons ?? [];
  if (!contract || !registry || !sameSet(contract.supportedLocales, registry.supportedLocales) ||
      !sameSet(registry.supportedLocales, ['en', 'zh-Hans']) ||
      registry.projectionSets.length !== lessons.length ||
      !unique(registry.projectionSets.map(item => item.lessonCode)) ||
      !unique(registry.projectionSets.map(item => item.sequence))) {
    return 'INVALID_LOCALE_LEARNING_PROJECTION_COVERAGE';
  }
  const lessonIndex = indexBy(lessons, 'lessonCode');
  const pathIndex = indexBy(context.learningPathRegistry.learningPaths, 'learningPathCode');
  const moduleIndex = indexBy(context.moduleRegistry.modules, 'moduleCode');
  const objectiveIndex = indexBy(context.learningObjectiveRegistry.learningObjectives,
    'learningObjectiveCode');
  for (const set of registry.projectionSets) {
    const lesson = lessonIndex.get(set.lessonCode);
    const path = pathIndex.get(set.learningPathCode);
    const module = moduleIndex.get(set.moduleCode);
    if (!lesson || !path || !module || lesson.moduleCode !== module.moduleCode ||
        module.learningPathCode !== path.learningPathCode ||
        !sameSet(Object.keys(set.locales), registry.supportedLocales)) {
      return 'DANGLING_LOCALE_LEARNING_PROJECTION';
    }
    for (const locale of registry.supportedLocales) {
      const localized = set.locales[locale];
      if (!contract.requiredLocaleFields.every(field => hasOwn(localized, field)) ||
          !isText(localized.pathTitle) || !isText(localized.moduleTitle) ||
          !isText(localized.lessonTitle) || !isText(localized.summary) ||
          localized.objectives.length !== lesson.learningObjectiveCodes.length ||
          localized.objectives.some((objective, index) =>
            objective.objectiveCode !== lesson.learningObjectiveCodes[index] ||
            !objectiveIndex.has(objective.objectiveCode) ||
            !isText(objective.title) || !isText(objective.statement))) {
        return 'INVALID_LOCALIZED_LESSON_CONTENT';
      }
    }
  }
  if (!registry.supportedLocales.every(locale => isText(registry.programLabels?.[locale]))) {
    return 'MISSING_LOCALIZED_PROGRAM_LABEL';
  }
  return 'VALID_LOCALE_LEARNING_RUNTIME';
}

export function validateAlrPresentationRuntime(context) {
  const contracts = [
    context.cprAcademyContract,
    context.academyDashboardContract,
    context.lessonExperienceContract,
    context.responsiveAcademyContract,
    context.academyAccessibilityContract,
    context.localeLearningProjectionContract
  ];
  if (contracts.some(contract => !contract || contract.status !== 'active')) {
    return 'EMPTY_OR_INACTIVE_ALR_PRESENTATION_CONTRACT';
  }
  if (context.cprAcademyContract.surface !== 'ACADEMY' ||
      context.cprAcademyContract.semanticAuthority !== 'ALR' ||
      context.cprAcademyContract.presentationAuthority !== 'CPR' ||
      context.cprAcademyContract.assetAuthority !== 'CAR') {
    return 'ALR_CPR_CAR_AUTHORITY_BOUNDARY_INVALID';
  }
  const academySurface = context.cprSurfaceRegistry?.surfaces?.find(item => item.surface === 'ACADEMY');
  const academyProjection = context.cprSurfaceProjectionRegistry?.entries?.find(item =>
    item.projectionCode === 'ACADEMY');
  const cprTypes = context.cprPresentationTypeRegistry?.presentationTypes?.map(item =>
    item.presentationType) ?? [];
  if (!academySurface || academySurface.presentationMode !== 'interactive_learning' ||
      !academyProjection || academyProjection.publishedOnly !== true ||
      !sameSet(academyProjection.presentationTypes,
        context.cprAcademyContract.allowedCprPresentationTypes) ||
      academyProjection.presentationTypes.some(type => !cprTypes.includes(type))) {
    return 'CPR_ACADEMY_PRESENTATION_AUTHORITY_DRIFT';
  }
  const views = context.academyPresentationViewRegistry?.views;
  if (!Array.isArray(views) || views.length !== 2 ||
      !unique(views.map(item => item.viewCode)) || !unique(views.map(item => item.route)) ||
      views.some(view => view.surface !== 'ACADEMY' || view.renderState !== 'validation_projection' ||
        view.compositionTypes.some(type => !cprTypes.includes(type)))) {
    return 'ACADEMY_PRESENTATION_VIEW_REGISTRY_INVALID';
  }
  if (validateArchitecture(context) !== 'VALID_ACADEMY_ARCHITECTURE') {
    return validateArchitecture(context);
  }
  if (validateLocaleRuntime(context) !== 'VALID_LOCALE_LEARNING_RUNTIME') {
    return validateLocaleRuntime(context);
  }
  if (!sameSet(context.responsiveAcademyContract.profiles,
    context.cprResponsiveContract?.modes ?? []) ||
    !sameSet(context.localeLearningProjectionContract.supportedLocales,
      context.cprLocaleContract?.supportedLocales ?? []) ||
    context.pdsDesignTokenContract?.responsiveContract?.acceptanceViewportsPx?.join(',') !== '360,768,1440' ||
    context.pdsFullSiteAcceptance?.scope?.minimumTouchTargetPx !== 44 ||
    context.pdsFullSiteAcceptance?.scope?.keyboardOperationRequired !== true) {
    return 'CPR_PDS_PRESENTATION_CONTRACT_DRIFT';
  }
  if (!Array.isArray(publicationList(context)) ||
      context.publishedAssetRegistry?.invariants?.fixtureRecordsAreProductionRecords !== false) {
    return 'CAR_PUBLISHED_ASSET_AUTHORITY_INVALID';
  }
  return 'VALID_ALR_PRESENTATION_RUNTIME';
}

function validateCommonInput(context, input, requiredFields) {
  if (validateAlrPresentationRuntime(context) !== 'VALID_ALR_PRESENTATION_RUNTIME') {
    return 'DENY_INVALID_ALR_PRESENTATION_RUNTIME';
  }
  if (hasForbiddenFieldDeep(input, new Set(context.cprAcademyContract.forbiddenInputFields))) {
    return 'DENY_LEARNER_DATA_OR_EXTERNAL_AUTHORITY_FIELD';
  }
  if (!exactInput(input, requiredFields)) return 'DENY_PRESENTATION_INPUT_SHAPE';
  if (!isSemver(input.projectionVersion) || !isIso(input.generatedAt)) {
    return 'DENY_PRESENTATION_VERSION_OR_TIME_INVALID';
  }
  if (input.providerUsed !== false || input.aiUsed !== false) {
    return 'DENY_PROVIDER_OR_AI_PRESENTATION_AUTHORITY';
  }
  if (!context.localeLearningProjectionContract.supportedLocales.includes(input.locale)) {
    return 'DENY_UNSUPPORTED_LEARNING_LOCALE';
  }
  return 'VALID_PRESENTATION_INPUT';
}

function commonProjection(context, input, view) {
  return {
    schemaVersion: 'PHI-OS-ALR-ACADEMY-PRESENTATION-PROJECTION-v1.0.0',
    projectionVersion: input.projectionVersion,
    viewCode: view.viewCode,
    route: view.route,
    surface: 'ACADEMY',
    renderState: 'validation_projection',
    canonicalPresentationState: presentationGate(context),
    locale: input.locale,
    generatedAt: input.generatedAt,
    semanticAuthority: 'ALR',
    presentationAuthority: 'CPR',
    sourceAssetAuthority: 'CAR',
    designAuthority: 'PDS',
    dataAuthority: 'RDG',
    providerOrAiAuthorityUsed: false,
    networkCallPerformed: false,
    persistencePerformed: false,
    learnerDataCreated: false,
    academyDeliveryActivated: false
  };
}

export function buildAcademyDashboardProjection(context, input = {}) {
  const contract = context.academyDashboardContract;
  const decision = validateCommonInput(context, input, contract?.requiredInputFields ?? []);
  if (decision !== 'VALID_PRESENTATION_INPUT') return {decision};
  const view = getView(context, input.viewCode);
  if (!view || view.viewCode !== contract.viewCode) return {decision: 'DENY_UNKNOWN_ACADEMY_DASHBOARD_VIEW'};
  if (!contract.progressProjectionStates.includes(input.progressProjectionState) ||
      !Array.isArray(input.progressReferences) || !unique(input.progressReferences) ||
      input.progressReferences.some(reference => !isText(reference))) {
    return {decision: 'DENY_PROGRESS_REFERENCE_SHAPE'};
  }
  if ((input.progressProjectionState === 'NOT_PROVIDED' && input.progressReferences.length !== 0) ||
      (input.progressProjectionState === 'GOVERNED_REFERENCES_PROVIDED' &&
        input.progressReferences.length === 0)) {
    return {decision: 'DENY_PROGRESS_REFERENCE_STATE_MISMATCH'};
  }
  const program = context.programRegistry.programs[0];
  const pathIndex = indexBy(context.learningPathRegistry.learningPaths, 'learningPathCode');
  const moduleIndex = indexBy(context.moduleRegistry.modules, 'moduleCode');
  const lessonIndex = indexBy(context.lessonRegistry.lessons, 'lessonCode');
  const paths = [...context.localeLearningProjectionRegistry.projectionSets]
    .sort((left, right) => left.sequence - right.sequence)
    .map(set => {
      const path = pathIndex.get(set.learningPathCode);
      const module = moduleIndex.get(set.moduleCode);
      const lesson = lessonIndex.get(set.lessonCode);
      const localized = set.locales[input.locale];
      return {
        sequence: set.sequence,
        learningPathCode: path.learningPathCode,
        moduleCode: module.moduleCode,
        lessonCode: lesson.lessonCode,
        academyLevelCode: lesson.academyLevelCode,
        pathTitle: localized.pathTitle,
        lessonTitle: localized.lessonTitle,
        summary: localized.summary,
        progressProjectionState: input.progressProjectionState === 'NOT_PROVIDED'
          ? 'NOT_PROVIDED'
          : 'REFERENCE_PROVIDED_NOT_INTERPRETED',
        deliveryState: 'STRUCTURE_AVAILABLE_DELIVERY_BLOCKED'
      };
    });
  const base = {
    ...commonProjection(context, input, view),
    projectionCode: 'ALR-ACADEMY-DASHBOARD-PROJECTION',
    presentationTypes: clone(view.compositionTypes),
    sectionOrder: clone(contract.sectionOrder),
    program: {
      programCode: program.programCode,
      title: context.localeLearningProjectionRegistry.programLabels[input.locale],
      pathCount: context.learningPathRegistry.learningPaths.length,
      moduleCount: context.moduleRegistry.modules.length,
      lessonCount: context.lessonRegistry.lessons.length,
      objectiveCount: context.learningObjectiveRegistry.learningObjectives.length
    },
    learningPaths: paths,
    progressProjection: {
      state: input.progressProjectionState,
      references: clone(input.progressReferences),
      interpretedByPresentation: false,
      inferredNotStarted: false
    },
    primaryAction: view.primaryAction,
    automaticNextLessonSelected: false,
    enrollmentEffect: 'NONE',
    unlockEffect: 'NONE',
    completionEffect: 'NONE',
    recommendationEffect: 'NONE',
    capabilityStateEffect: 'NONE',
    entitlementEffect: 'NONE',
    credentialEffect: 'NONE',
    professionalAuthorityEffect: 'NONE'
  };
  return {...base, projectionDigest: stableDigest(base)};
}

export function buildAcademyLessonProjection(context, input = {}) {
  const contract = context.lessonExperienceContract;
  const decision = validateCommonInput(context, input, contract?.requiredInputFields ?? []);
  if (decision !== 'VALID_PRESENTATION_INPUT') return {decision};
  const view = getView(context, input.viewCode);
  if (!view || view.viewCode !== contract.viewCode) return {decision: 'DENY_UNKNOWN_ACADEMY_LESSON_VIEW'};
  const projection = getLocaleProjection(context, input.lessonCode, input.locale);
  const lesson = context.lessonRegistry.lessons.find(item => item.lessonCode === input.lessonCode);
  if (!projection || !lesson || lesson.status !== 'APPROVED') {
    return {decision: 'DENY_UNKNOWN_LESSON_OR_LOCALE_PROJECTION'};
  }
  const binding = context.knowledgeLearningBindingRegistry.bindings.find(item =>
    item.lessonCode === lesson.lessonCode);
  const knowledgeProjection = context.knowledgeToLearningProjectionRegistry.projections.find(item =>
    binding?.knowledgeProjectionCodes?.includes(item.projectionCode));
  const sourceReading = knowledgeProjection?.sourceArticleReferences?.find(item =>
    item.locale === input.locale);
  if (!binding || !knowledgeProjection || !sourceReading ||
      knowledgeProjection.sourceAuthorityReference !== 'PUBLISHED_KNOWLEDGE_AUTHORITY') {
    return {decision: 'DENY_PUBLISHED_SOURCE_LINEAGE_UNAVAILABLE'};
  }
  const base = {
    ...commonProjection(context, input, view),
    projectionCode: `ALR-ACADEMY-LESSON-PROJECTION-${lesson.lessonCode}`,
    presentationTypes: clone(view.compositionTypes),
    sectionOrder: clone(contract.sectionOrder),
    lesson: {
      lessonCode: lesson.lessonCode,
      academyLevelCode: lesson.academyLevelCode,
      pathCode: projection.set.learningPathCode,
      moduleCode: projection.set.moduleCode,
      sequence: projection.set.sequence,
      title: projection.localized.lessonTitle,
      summary: projection.localized.summary,
      objectives: clone(projection.localized.objectives)
    },
    sourceReading: {
      articleCode: sourceReading.articleCode,
      locale: sourceReading.locale,
      version: sourceReading.version,
      href: sourceReading.href,
      authority: 'PUBLISHED_KNOWLEDGE_AUTHORITY',
      contentCopiedIntoProjection: false
    },
    teachingStructure: {
      bindingCode: binding.bindingCode,
      teachingExplanationReferences: clone(binding.teachingExplanationCodes),
      exampleReferences: clone(binding.exampleCodes),
      caseStudyReferences: clone(binding.caseStudyCodes),
      deliveryState: 'REFERENCE_ONLY_DELIVERY_BLOCKED'
    },
    practiceState: 'DEFINITION_AVAILABLE_RESPONSE_CAPTURE_INACTIVE',
    assessmentState: 'DEFINITION_AVAILABLE_EXECUTION_INACTIVE',
    primaryAction: view.primaryAction,
    mixedLocaleContentUsed: false,
    sourceKnowledgeMutated: false,
    learnerResponseEffect: 'NONE',
    assessmentResultEffect: 'NONE',
    completionEffect: 'NONE',
    capabilityStateEffect: 'NONE',
    credentialEffect: 'NONE',
    professionalAuthorityEffect: 'NONE'
  };
  return {...base, projectionDigest: stableDigest(base)};
}

export function assertAcademyProjectionDigest(projection) {
  if (!projection || !isText(projection.projectionDigest)) return false;
  const {projectionDigest, ...base} = projection;
  return stableDigest(base) === projectionDigest;
}
