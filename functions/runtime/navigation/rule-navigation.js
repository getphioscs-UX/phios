/**
 * PHI OS bounded, rule-first Reality Navigation Engine.
 *
 * Generates a contextual set of bounded and reviewable Navigation paths
 * from an existing Reality Reading.
 *
 * It does not:
 * - diagnose or prescribe;
 * - predict outcomes;
 * - replace professional judgment;
 * - convert Interpretation into Observed Evidence;
 * - automatically choose or execute a path for the user.
 *
 * Runtime-generated copy follows the requested Runtime locale.
 * Original Evidence values remain unchanged and are never translated here.
 */

import {
  isAcceptedSchema
} from '../shared/schema-registry.js';

import {
  resolveNavigationRuntimeCopy,
  resolveRuntimeLanguageContract
} from '../locales/locale-resolver.js';

import {
  NAVIGATION_GUARDRAILS,
  createNavigationContract,
  validateNavigationContract
} from './navigation-contract.js';


/* =========================================================
   BASIC UTILITIES
========================================================= */

function isObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

function list(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function cleanText(value) {
  return typeof value === 'string'
    ? value
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    : '';
}

function unique(
  values,
  maximum = Infinity
) {
  const seen = new Set();
  const output = [];

  for (const value of list(values)) {
    const text = cleanText(
      value?.question ||
      value?.statement ||
      value
    );

    const key =
      text.toLocaleLowerCase();

    if (
      !text ||
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);
    output.push(text);

    if (
      output.length >= maximum
    ) {
      break;
    }
  }

  return output;
}

function clamp(value) {
  return Math.max(
    0,
    Math.min(
      1,
      Number(value) || 0
    )
  );
}

function firstText(
  values,
  fallback = ''
) {
  return (
    unique(values, 1)[0] ||
    fallback
  );
}

function regionText(region) {
  if (!isObject(region)) {
    return '';
  }

  return cleanText(
    region.label ||
    region.name ||
    region.code ||
    region.id
  );
}


/* =========================================================
   PRIORITY
========================================================= */

function buildPriority({
  copy,
  primaryUnknown,
  evidenceWatch,
  transitionLabel,
  risks,
  unknownReality
}) {
  if (primaryUnknown) {
    return {
      focus:
        copy
          .priority
          .unknown
          .focus(primaryUnknown),

      priorityLevel:
        risks.length > 0
          ? 'high'
          : 'medium',

      reason:
        copy
          .priority
          .unknown
          .reason,

      /*
       * Original Evidence remains separate so a renderer may
       * avoid creating mixed-language sentences.
       */
      sourceEvidence:
        unique(
          unknownReality,
          4
        ),

      evidenceClass:
        'interpretation'
    };
  }

  if (evidenceWatch.length > 0) {
    return {
      focus:
        copy
          .priority
          .evidence
          .focus(evidenceWatch[0]),

      priorityLevel:
        risks.length > 0
          ? 'high'
          : 'medium',

      reason:
        copy
          .priority
          .evidence
          .reason,

      sourceEvidence:
        unique(
          evidenceWatch,
          4
        ),

      evidenceClass:
        'interpretation'
    };
  }

  return {
    focus:
      copy
        .priority
        .transition
        .focus(transitionLabel),

    priorityLevel:
      'low',

    reason:
      copy
        .priority
        .transition
        .reason,

    sourceEvidence:
      [],

    evidenceClass:
      'interpretation'
  };
}


/* =========================================================
   INTERNAL PATH LIBRARY
========================================================= */

function buildAvailablePaths({
  copy,
  primaryUnknown,
  transitionLabel,
  evidenceWatch,
  constraints,
  risks,
  boundary,
  primaryRegion,
  alternativeReading
}) {
  const firstEvidenceWatch =
    firstText(
      evidenceWatch,
      copy.defaults.runtimeTransition
    );

  const firstConstraint =
    firstText(
      constraints,
      copy.defaults.knownBoundary
    );

  const firstRisk =
    firstText(
      risks,
      copy.defaults.materialRisk
    );

  /*
   * Original Evidence values stay in their source language.
   */
  const firstReportedExperience =
    firstText(
      boundary.reportedExperience,
      ''
    );

  const firstObservedEvidence =
    firstText(
      boundary.observedEvidence,
      ''
    );

  const firstProfessionalAssessment =
    firstText(
      boundary.professionalAssessment,
      ''
    );

  const alternativeSummary =
    cleanText(
      alternativeReading?.summary
    );

  const primaryRegionValue =
    regionText(primaryRegion);

  const observeEvidenceBasis =
    unique([
      firstObservedEvidence,
      firstReportedExperience,
      firstEvidenceWatch
    ], 4);

  const clarifyEvidenceBasis =
    unique([
      primaryUnknown,
      firstReportedExperience,
      firstEvidenceWatch
    ], 4);

  const verifyEvidenceBasis =
    unique([
      firstObservedEvidence,
      firstReportedExperience,
      alternativeSummary
    ], 4);

  const repositionEvidenceBasis =
    unique([
      transitionLabel,
      firstConstraint,
      primaryRegionValue
    ], 4);

  const reconnectEvidenceBasis =
    unique([
      firstReportedExperience,
      firstConstraint,
      transitionLabel
    ], 4);

  const reconfigureEvidenceBasis =
    unique([
      transitionLabel,
      firstConstraint,
      firstEvidenceWatch
    ], 4);

  const recoverEvidenceBasis =
    unique([
      firstRisk,
      firstConstraint,
      firstReportedExperience
    ], 4);

  const professionalEvidenceBasis =
    unique([
      firstProfessionalAssessment,
      firstRisk,
      primaryUnknown,
      firstConstraint
    ], 5);

  const observe =
    copy.paths.observe;

  const clarify =
    copy.paths.clarify;

  const verify =
    copy.paths.verify;

  const experiment =
    copy.paths.experiment;

  const reposition =
    copy.paths.reposition;

  const reconnect =
    copy.paths.reconnect;

  const recover =
    copy.paths.recover;

  const professionalReview =
    copy.paths.professionalReview;

  const financialProfessionalReview =
    copy.paths.financialProfessionalReview;

  return [
    {
      id:
        'observe-current-runtime',

      pathType:
        'observe',

      label:
        observe.label,

      direction:
        evidenceWatch.length > 0
          ? observe.directionWithEvidence(
              firstEvidenceWatch
            )
          : observe.directionWithoutEvidence,

      boundary:
        observe.boundary,

      rationale:
        observe.rationale,

      evidenceBasis:
        observeEvidenceBasis,

      unknownReality:
        unique([
          primaryUnknown
        ], 4),

      reviewConditions:
        unique([
          observe.reviewEvidence(
            firstEvidenceWatch
          ),
          observe.reviewTransition,
          observe.reviewImpact
        ], 5),

      status:
        'available'
    },

    {
      id:
        'clarify-unknown-reality',

      pathType:
        'clarify',

      label:
        clarify.label,

      direction:
        primaryUnknown
          ? clarify.directionWithUnknown(
              primaryUnknown
            )
          : clarify.directionWithoutUnknown,

      boundary:
        clarify.boundary,

      rationale:
        primaryUnknown
          ? clarify.rationaleWithUnknown
          : clarify.rationaleWithoutUnknown,

      evidenceBasis:
        clarifyEvidenceBasis,

      unknownReality:
        unique([
          primaryUnknown
        ], 5),

      reviewConditions:
        unique([
          primaryUnknown
            ? clarify.reviewUnknown(
                primaryUnknown
              )
            : clarify.reviewPrecision,

          clarify.reviewContradiction,
          clarify.returnObservation
        ], 5),

      status:
        'available'
    },

    {
      id:
        'verify-reading-distinction',

      pathType:
        'verify',

      label:
        verify.label,

      direction:
        alternativeSummary
          ? verify.directionWithAlternative
          : verify.directionWithoutAlternative,

      boundary:
        verify.boundary,

      rationale:
        alternativeSummary
          ? verify.rationaleWithAlternative
          : verify.rationaleWithoutAlternative,

      evidenceBasis:
        verifyEvidenceBasis,

      unknownReality:
        unique([
          primaryUnknown,

          alternativeSummary
            ? verify.alternativeUnknown
            : ''
        ], 5),

      reviewConditions:
        unique([
          verify.reviewPrimary,
          verify.reviewAlternative,
          verify.reviewNeither,
          verify.absenceWarning
        ], 6),

      status:
        'available'
    },

    {
      id:
        'small-reversible-experiment',

      pathType:
        'reconfigure',

      label:
        experiment.label,

      direction:
        experiment.direction,

      boundary:
        experiment.boundary,

      rationale:
        experiment.rationale,

      evidenceBasis:
        reconfigureEvidenceBasis,

      unknownReality:
        unique([
          primaryUnknown,
          experiment.outcomeUnknown
        ], 5),

      reviewConditions:
        unique([
          experiment.defineResult,
          experiment.reviewRisk,
          experiment.reviewWindow,
          experiment.generalizationWarning
        ], 6),

      status:
        'available'
    },

    {
      id:
        'reposition-current-runtime',

      pathType:
        'reposition',

      label:
        reposition.label,

      direction:
        primaryRegion
          ? reposition.directionWithRegion
          : reposition.directionWithoutRegion,

      boundary:
        reposition.boundary,

      rationale:
        reposition.rationale,

      evidenceBasis:
        repositionEvidenceBasis,

      unknownReality:
        unique([
          primaryUnknown,
          reposition.outcomeUnknown
        ], 5),

      reviewConditions:
        unique([
          reposition.reviewState,
          reposition.reviewTransfer,
          reposition.reviewPermanent,
          reposition.returnReading
        ], 6),

      status:
        'available'
    },

    {
      id:
        'reconnect-runtime-relationship',

      pathType:
        'reconnect',

      label:
        reconnect.label,

      direction:
        reconnect.direction,

      boundary:
        reconnect.boundary,

      rationale:
        reconnect.rationale,

      evidenceBasis:
        reconnectEvidenceBasis,

      unknownReality:
        unique([
          primaryUnknown,
          reconnect.outcomeUnknown
        ], 5),

      reviewConditions:
        unique([
          reconnect.reviewReciprocity,
          reconnect.reviewResponsibility,
          reconnect.escalation,
          reconnect.reviewSupport
        ], 6),

      status:
        'available'
    },

    {
      id:
        'recover-runtime-capacity',

      pathType:
        'recover',

      label:
        recover.label,

      direction:
        recover.direction,

      boundary:
        recover.boundary,

      rationale:
        recover.rationale,

      evidenceBasis:
        recoverEvidenceBasis,

      unknownReality:
        unique([
          primaryUnknown,
          recover.causeUnknown
        ], 6),

      reviewConditions:
        unique([
          recover.reviewFunction,
          recover.reviewReturn,
          recover.escalation,
          recover.reliefWarning
        ], 6),

      status:
        'available'
    },

    {
      id:
        'financial-professional-review',

      pathType:
        'professional_review',

      professionalDomain:
        'financial',

      label:
        financialProfessionalReview.label,

      title:
        financialProfessionalReview.label,

      direction:
        financialProfessionalReview.direction,

      boundary:
        financialProfessionalReview.boundary,

      rationale:
        financialProfessionalReview.rationale,

      description:
        financialProfessionalReview.rationale,

      suitableWhen:
        financialProfessionalReview.suitableWhen,

      firstStep:
        financialProfessionalReview.firstStep,

      evidenceBasis:
        professionalEvidenceBasis.length > 0
          ? professionalEvidenceBasis
          : [
              financialProfessionalReview
                .fallbackEvidence
            ],

      evidenceWatch:
        unique([
          firstEvidenceWatch,
          primaryUnknown,
          firstConstraint
        ], 5),

      unknownReality:
        unique([
          primaryUnknown,
          financialProfessionalReview
            .conclusionUnknown
        ], 6),

      reviewConditions:
        financialProfessionalReview
          .reviewConditions,

      requiresProfessionalReview:
        true,

      availability:
        'planned',

      nextRoute:
        '/financial-intake',

      status:
        'available'
    },

    {
      id:
        'professional-review',

      pathType:
        'professional_review',

      label:
        professionalReview.label,

      direction:
        professionalReview.direction,

      boundary:
        professionalReview.boundary,

      rationale:
        professionalReview.rationale,

      evidenceBasis:
        professionalEvidenceBasis.length > 0
          ? professionalEvidenceBasis
          : [
              professionalReview
                .fallbackEvidence
            ],

      unknownReality:
        unique([
          primaryUnknown,
          professionalReview
            .conclusionUnknown
        ], 6),

      reviewConditions:
        unique([
          professionalReview
            .reviewAssessment,

          professionalReview
            .preserveClass,

          professionalReview
            .evidenceWarning,

          professionalReview
            .returnRuntime
        ], 6),

      status:
        'available'
    }
  ];
}

function actionablePath({
  path,
  copy,
  desiredDirection,
  evidenceWatch,
  primaryUnknown,
  constraints
}) {
  const action =
    copy.actions?.[path.pathType] ||
    {};

  const evidence =
    firstText(
      evidenceWatch,
      copy.defaults.runtimeTransition
    );

  const unknown =
    primaryUnknown ||
    copy.defaults.knownBoundary;

  const constraint =
    firstText(
      constraints,
      copy.defaults.knownBoundary
    );

  let nextStep =
    cleanText(action.nextStep);

  let actionSteps =
    list(action.steps);

  if (path.pathType === 'observe') {
    nextStep =
      action.nextStep(evidence);

    actionSteps =
      action.steps(evidence);
  } else if (
    path.pathType === 'clarify'
  ) {
    nextStep =
      action.nextStep(unknown);

    actionSteps =
      action.steps(unknown);
  } else if (
    path.pathType === 'reconfigure'
  ) {
    nextStep =
      action.nextStep(
        desiredDirection,
        evidence
      );
  } else if (
    path.pathType === 'reposition'
  ) {
    nextStep =
      action.nextStep(constraint);
  }

  return {
    ...path,

    nextStep:
      cleanText(nextStep) ||
      cleanText(path.direction),

    source: {
      stage: 'reading',
      evidenceBasis: unique(path.evidenceBasis, 6)
    },

    evidenceActionLink: {
      evidence: firstText(path.evidenceBasis, evidence),
      action: cleanText(nextStep) || cleanText(path.direction),
      explicit: true
    },

    actionSteps:
      unique(actionSteps, 5),

    observationWindow:
      cleanText(
        action.observationWindow
      ),

    completionSignals:
      unique(
        action.completionSignals,
        5
      ),

    stopConditions:
      unique(
        action.stopConditions,
        5
      )
  };
}

function buildRecommendedDirection({
  copy,
  availablePaths,
  priority
}) {
  const startingPath =
    availablePaths[0] ||
    null;

  if (!startingPath) {
    return null;
  }

  return {
    pathId:
      startingPath.id,

    pathType:
      startingPath.pathType,

    label:
      startingPath.label,

    summary:
      copy
        .guidance
        .suggestedDirection(
          startingPath.label
        ),

    reason:
      copy
        .guidance
        .suggestedReason(
          priority.focus
        ),

    userChoiceNotice:
      copy.guidance.userChoice,

    userChoiceRequired:
      true,

    automaticSelection:
      false
  };
}

function buildActionGuidance({
  copy,
  availablePaths,
  recommendedDirection
}) {
  const startingPath =
    availablePaths.find(
      path =>
        path.id ===
        recommendedDirection?.pathId
    ) ||
    null;

  if (!startingPath) {
    return null;
  }

  return {
    sourcePathId:
      startingPath.id,

    nextStep:
      startingPath.nextStep,

    steps:
      startingPath.actionSteps,

    observationWindow:
      startingPath.observationWindow,

    completionSignals:
      startingPath.completionSignals,

    stopConditions:
      startingPath.stopConditions,

    reviewConditions:
      startingPath.reviewConditions,

    continuityInstruction:
      copy.guidance.reviewAfterStep,

    userChoiceRequired:
      true
  };
}


/* =========================================================
   REVIEW / CONTINUITY / READINESS
========================================================= */

function buildReviewConditions({
  copy,
  evidenceWatch,
  risks,
  primaryUnknown
}) {
  return unique([
    evidenceWatch[0]
      ? copy.review.evidence(
          evidenceWatch[0]
        )
      : '',

    copy.review.transition,

    copy.review.highImpact,

    risks.length > 0
      ? copy.review.risk(
          risks[0]
        )
      : '',

    primaryUnknown
      ? copy.review.unknown(
          primaryUnknown
        )
      : ''
  ], 10);
}

function buildContinuityConditions({
  copy,
  storageAllowed
}) {
  return unique([
    copy.continuity.returnResult,

    storageAllowed
      ? copy.continuity.persistAllowed
      : copy.continuity.sessionOnly,

    copy.continuity.reversible,
    copy.continuity.newVersion,
    copy.continuity.preserveUnknown
  ], 10);
}

function buildNavigationReadiness({
  copy,
  availablePaths,
  reviewConditions,
  professionalReviewRecommended,
  unknownReality
}) {
  return {
    ready:
      availablePaths.length > 0 &&
      reviewConditions.length > 0,

    status:
      professionalReviewRecommended
        ? 'bounded_with_professional_review_available'
        : unknownReality.length > 0
          ? 'bounded_with_unknown_reality'
          : 'bounded_paths_available',

    reason:
      professionalReviewRecommended
        ? copy.readiness.professional
        : unknownReality.length > 0
          ? copy.readiness.unknown
          : copy.readiness.ready,

    userChoiceRequired:
      true,

    automaticPathSelectionAllowed:
      false
  };
}


/* =========================================================
   CONTEXTUAL PATH SELECTION
========================================================= */

const PATH_SELECTION_LIMITS =
  Object.freeze({
    minimum: 2,
    preferred: 3,
    maximum: 4
  });

const HIGH_IMPACT_TERMS =
  Object.freeze([
    'medical',
    'health',
    'legal',
    'financial',
    'finance',
    'investment',
    'debt',
    'child',
    'children',
    'safety',
    'abuse',
    'coercion',
    'violence',
    'self-harm',
    'suicide',
    '诊断',
    '医疗',
    '健康',
    '法律',
    '财务',
    '投资',
    '债务',
    '儿童',
    '孩子',
    '安全',
    '虐待',
    '胁迫',
    '暴力',
    '自伤',
    '自杀'
  ]);

const FINANCIAL_TERMS =
  Object.freeze([
    'financial',
    'finance',
    'money',
    'income',
    'expense',
    'cash flow',
    'budget',
    'saving',
    'investment',
    'debt',
    'loan',
    'mortgage',
    'insurance',
    'retirement',
    'tax',
    'estate',
    'asset',
    'liability',
    'property',
    'business finance',
    '财务',
    '金融',
    '金钱',
    '收入',
    '支出',
    '现金流',
    '预算',
    '储蓄',
    '投资',
    '债务',
    '贷款',
    '房贷',
    '保险',
    '保障',
    '退休',
    '税务',
    '遗产',
    '资产',
    '负债',
    '房产',
    '企业财务'
  ]);

const RELATIONAL_TERMS =
  Object.freeze([
    'relationship',
    'family',
    'partner',
    'husband',
    'wife',
    'parent',
    'mother',
    'father',
    'child',
    'team',
    'trust',
    'support',
    'connection',
    'dependency',
    '关系',
    '家庭',
    '伴侣',
    '丈夫',
    '妻子',
    '父母',
    '母亲',
    '父亲',
    '孩子',
    '团队',
    '信任',
    '支持',
    '连接',
    '依赖'
  ]);

const CAPACITY_TERMS =
  Object.freeze([
    'exhaustion',
    'burnout',
    'overload',
    'fatigue',
    'distress',
    'sleep',
    'functioning',
    'capacity',
    'pressure',
    '崩溃',
    '耗竭',
    '倦怠',
    '负荷',
    '疲劳',
    '痛苦',
    '睡眠',
    '功能',
    '能力',
    '压力'
  ]);

const POSITION_TERMS =
  Object.freeze([
    'position',
    'role',
    'boundary',
    'priority',
    'attention',
    'decision weight',
    'resource allocation',
    'constraint',
    '位置',
    '角色',
    '边界',
    '优先',
    '注意力',
    '决策权重',
    '资源分配',
    '约束'
  ]);

const EXPERIMENT_TERMS =
  Object.freeze([
    'test',
    'experiment',
    'try',
    'small change',
    'temporary',
    'reversible',
    '测试',
    '实验',
    '尝试',
    '小改变',
    '暂时',
    '可逆'
  ]);

function corpusText(values) {
  return unique(
    list(values),
    100
  )
    .join(' ')
    .toLocaleLowerCase();
}

function containsAnyTerm(
  corpus,
  terms
) {
  if (!corpus) {
    return false;
  }

  return terms.some(
    term =>
      corpus.includes(
        term.toLocaleLowerCase()
      )
  );
}

function countMatchingTerms(
  corpus,
  terms
) {
  if (!corpus) {
    return 0;
  }

  return terms.reduce(
    (count, term) => (
      corpus.includes(
        term.toLocaleLowerCase()
      )
        ? count + 1
        : count
    ),
    0
  );
}

function pathByType(
  paths,
  pathType
) {
  return (
    list(paths).find(
      path =>
        path?.pathType === pathType
    ) ||
    null
  );
}

function pathById(
  paths,
  pathId
) {
  return (
    list(paths).find(
      path =>
        path?.id === pathId
    ) ||
    null
  );
}

function addCandidate(
  candidates,
  path,
  score,
  reason
) {
  if (!path) {
    return;
  }

  const existing =
    candidates.find(
      candidate =>
        candidate.path.id === path.id
    );

  if (existing) {
    existing.score += score;

    if (
      reason &&
      !existing.reasons.includes(
        reason
      )
    ) {
      existing.reasons.push(reason);
    }

    return;
  }

  candidates.push({
    path,
    score,

    reasons:
      reason
        ? [reason]
        : []
  });
}

function selectContextualPaths({
  allPaths,
  readingConfidence,
  unknownReality,
  evidenceWatch,
  risks,
  constraints,
  currentRuntime,
  transitionLabel,
  alternativeReading,
  professionalReviewRecommended,
  boundary
}) {
  const candidates = [];

  const contextCorpus =
    corpusText([
      currentRuntime,
      transitionLabel,
      ...unknownReality,
      ...evidenceWatch,
      ...risks,
      ...constraints,
      ...list(
        boundary.reportedExperience
      ),
      ...list(
        boundary.interpretation
      ),
      ...list(
        boundary.professionalAssessment
      ),
      cleanText(
        alternativeReading?.summary
      )
    ]);

  const unknownCorpus =
    corpusText(
      unknownReality
    );

  const riskCorpus =
    corpusText(
      risks
    );

  const constraintCorpus =
    corpusText(
      constraints
    );

  const observedEvidenceCount =
    unique(
      boundary.observedEvidence
    ).length;

  const reportedExperienceCount =
    unique(
      boundary.reportedExperience
    ).length;

  const professionalAssessmentCount =
    unique(
      boundary.professionalAssessment
    ).length;

  const alternativeAvailable =
    Boolean(
      cleanText(
        alternativeReading?.summary
      )
    );

  const hasUnknownReality =
    unknownReality.length > 0;

  const hasEvidenceWatch =
    evidenceWatch.length > 0;

  const hasHighImpactContext =
    containsAnyTerm(
      contextCorpus,
      HIGH_IMPACT_TERMS
    );

  const hasFinancialContext =
    containsAnyTerm(
      contextCorpus,
      FINANCIAL_TERMS
    );

  const relationalStrength =
    countMatchingTerms(
      contextCorpus,
      RELATIONAL_TERMS
    );

  const capacityStrength =
    countMatchingTerms(
      contextCorpus,
      CAPACITY_TERMS
    );

  const positionStrength =
    countMatchingTerms(
      contextCorpus,
      POSITION_TERMS
    );

  const experimentStrength =
    countMatchingTerms(
      contextCorpus,
      EXPERIMENT_TERMS
    );

  const observePath =
    pathByType(
      allPaths,
      'observe'
    );

  const clarifyPath =
    pathByType(
      allPaths,
      'clarify'
    );

  const verifyPath =
    pathByType(
      allPaths,
      'verify'
    );

  const experimentPath =
    pathByType(
      allPaths,
      'reconfigure'
    );

  const repositionPath =
    pathByType(
      allPaths,
      'reposition'
    );

  const reconnectPath =
    pathByType(
      allPaths,
      'reconnect'
    );

  const recoverPath =
    pathByType(
      allPaths,
      'recover'
    );

  const professionalPath =
    pathById(
      allPaths,
      'professional-review'
    );

  const financialProfessionalPath =
    pathById(
      allPaths,
      'financial-professional-review'
    );

  /*
   * Observe when direct evidence is absent, confidence is limited,
   * or a future evidence watch is required.
   */
  if (
    hasEvidenceWatch ||
    observedEvidenceCount === 0 ||
    readingConfidence < 0.65
  ) {
    let score = 40;

    if (hasEvidenceWatch) {
      score += 18;
    }

    if (
      observedEvidenceCount === 0
    ) {
      score += 14;
    }

    if (
      readingConfidence < 0.5
    ) {
      score += 12;
    }

    addCandidate(
      candidates,
      observePath,
      score,
      'observable_evidence_needed'
    );
  }

  /*
   * Clarify whenever Unknown Reality is materially present.
   */
  if (hasUnknownReality) {
    let score =
      55 +
      Math.min(
        unknownReality.length * 5,
        20
      );

    if (
      unknownCorpus.includes(
        'cause'
      ) ||
      unknownCorpus.includes(
        'causation'
      ) ||
      unknownCorpus.includes(
        'dependency'
      ) ||
      unknownCorpus.includes(
        'relationship'
      ) ||
      unknownCorpus.includes(
        'counter'
      ) ||
      unknownCorpus.includes(
        '反向证据'
      ) ||
      unknownCorpus.includes(
        '因果'
      ) ||
      unknownCorpus.includes(
        '依赖'
      ) ||
      unknownCorpus.includes(
        '关系'
      ) ||
      unknownCorpus.includes(
        '转变'
      )
    ) {
      score += 18;
    }

    addCandidate(
      candidates,
      clarifyPath,
      score,
      'unknown_reality_requires_clarification'
    );
  }

  /*
   * Verify when interpretations exceed direct evidence,
   * counter-evidence is unresolved, or an alternative exists.
   */
  if (
    alternativeAvailable ||
    reportedExperienceCount >
      observedEvidenceCount ||
    unknownCorpus.includes(
      'evidence'
    ) ||
    unknownCorpus.includes(
      '证据'
    ) ||
    unknownCorpus.includes(
      '反向'
    )
  ) {
    let score = 48;

    if (alternativeAvailable) {
      score += 20;
    }

    if (
      reportedExperienceCount >
      observedEvidenceCount
    ) {
      score += 12;
    }

    if (
      unknownCorpus.includes(
        '反向'
      ) ||
      unknownCorpus.includes(
        'counter'
      ) ||
      unknownCorpus.includes(
        'contradict'
      )
    ) {
      score += 20;
    }

    addCandidate(
      candidates,
      verifyPath,
      score,
      'current_reading_requires_distinguishing_evidence'
    );
  }

  /*
   * Small Experiment is allowed only for low-impact,
   * reversible and sufficiently supported testing.
   */
  if (
    readingConfidence >= 0.55 &&
    !professionalReviewRecommended &&
    !hasHighImpactContext &&
    (
      experimentStrength > 0 ||
      evidenceWatch.length > 0
    )
  ) {
    let score =
      30 +
      Math.min(
        experimentStrength * 8,
        24
      );

    if (
      readingConfidence >= 0.7
    ) {
      score += 10;
    }

    addCandidate(
      candidates,
      experimentPath,
      score,
      'bounded_reversible_test_is_available'
    );
  }

  /*
   * Reposition when roles, boundaries, constraints,
   * priorities or resource allocation are central.
   */
  if (
    positionStrength > 0 ||
    constraintCorpus.includes(
      'constraint'
    ) ||
    constraintCorpus.includes(
      'boundary'
    ) ||
    constraintCorpus.includes(
      '约束'
    ) ||
    constraintCorpus.includes(
      '边界'
    )
  ) {
    addCandidate(
      candidates,
      repositionPath,

      34 +
      Math.min(
        positionStrength * 7,
        21
      ),

      'current_position_or_constraint_requires_adjustment'
    );
  }

  /*
   * Reconnect only when relationship or connection signals
   * are sufficiently prominent.
   */
  if (
    relationalStrength >= 2
  ) {
    addCandidate(
      candidates,
      reconnectPath,

      30 +
      Math.min(
        relationalStrength * 7,
        28
      ),

      'relevant_connection_is_part_of_the_runtime'
    );
  }

  /*
   * Recover only when reduced capacity, distress or overload
   * is materially represented.
   */
  if (
    capacityStrength >= 2 ||
    riskCorpus.includes(
      'distress'
    ) ||
    riskCorpus.includes(
      'burnout'
    ) ||
    riskCorpus.includes(
      '痛苦'
    ) ||
    riskCorpus.includes(
      '耗竭'
    )
  ) {
    addCandidate(
      candidates,
      recoverPath,

      38 +
      Math.min(
        capacityStrength * 8,
        32
      ),

      'runtime_capacity_may_be_reduced'
    );
  }

  /*
   * Professional Review appears only when an actual
   * professional or high-impact boundary is present.
   */
  if (
    professionalReviewRecommended ||
    hasHighImpactContext ||
    professionalAssessmentCount > 0
  ) {
    let score = 75;

    if (hasHighImpactContext) {
      score += 15;
    }

    if (
      professionalAssessmentCount > 0
    ) {
      score += 15;
    }

    if (
      readingConfidence < 0.5
    ) {
      score += 10;
    }

    addCandidate(
      candidates,
      hasFinancialContext
        ? financialProfessionalPath
        : professionalPath,
      score,
      hasFinancialContext
        ? 'financial_professional_boundary_detected'
        : 'professional_boundary_detected'
    );
  }

  /*
   * Navigation always needs at least two bounded candidates.
   */
  if (
    candidates.length === 0
  ) {
    addCandidate(
      candidates,
      observePath,
      50,
      'default_observation_path'
    );

    addCandidate(
      candidates,
      clarifyPath,
      45,
      'default_clarification_path'
    );
  }

  if (
    candidates.length === 1
  ) {
    const fallback =
      candidates[0]
        ?.path
        ?.pathType ===
      'observe'
        ? clarifyPath
        : observePath;

    addCandidate(
      candidates,
      fallback,
      35,
      'minimum_path_requirement'
    );
  }

  candidates.sort(
    (left, right) => {
      if (
        right.score !== left.score
      ) {
        return (
          right.score -
          left.score
        );
      }

      return (
        allPaths.indexOf(
          left.path
        ) -
        allPaths.indexOf(
          right.path
        )
      );
    }
  );

  const professionalIncluded =
    candidates.some(
      candidate =>
        candidate
          .path
          .pathType ===
        'professional_review'
    );

  const limit =
    professionalIncluded
      ? PATH_SELECTION_LIMITS.maximum
      : PATH_SELECTION_LIMITS.preferred;

  const selectedCandidates =
    candidates.slice(
      0,
      Math.max(
        PATH_SELECTION_LIMITS.minimum,
        limit
      )
    );

  /*
   * Keep the professional boundary visible when it is required,
   * even if it falls outside the first score-limited candidates.
   */
  if (
    professionalIncluded &&
    !selectedCandidates.some(
      candidate =>
        candidate
          .path
          .pathType ===
        'professional_review'
    )
  ) {
    const professionalCandidate =
      candidates.find(
        candidate =>
          candidate
            .path
            .pathType ===
          'professional_review'
      );

    if (professionalCandidate) {
      if (
        selectedCandidates.length >=
        PATH_SELECTION_LIMITS.maximum
      ) {
        selectedCandidates[
          selectedCandidates.length - 1
        ] =
          professionalCandidate;
      } else {
        selectedCandidates.push(
          professionalCandidate
        );
      }
    }
  }

  return {
    paths:
      selectedCandidates.map(
        candidate =>
          candidate.path
      ),

    audit:
      selectedCandidates.map(
        candidate => ({
          pathId:
            candidate.path.id,

          pathType:
            candidate.path.pathType,

          score:
            candidate.score,

          reasons:
            candidate.reasons
        })
      )
  };
}


/* =========================================================
   MAIN RULE ENGINE
========================================================= */

export function navigateRuntimeRuleFirst(
  navigationInput
) {
  if (
    !isObject(navigationInput) ||
    !isAcceptedSchema(
      'navigationInput',
      navigationInput.schemaVersion
    )
  ) {
    throw new Error(
      'Navigation input is invalid.'
    );
  }

  const languageContract =
    resolveRuntimeLanguageContract(
      navigationInput
    );

  const copy =
    resolveNavigationRuntimeCopy(
      navigationInput
    );

  const reading =
    isObject(
      navigationInput.reading
    )
      ? navigationInput.reading
      : {};

  const navigationContext =
    isObject(
      navigationInput.navigationContext
    )
      ? navigationInput.navigationContext
      : {};

  const integrated =
    isObject(
      reading.integratedReading
    )
      ? reading.integratedReading
      : {};

  const boundary =
    isObject(
      navigationInput.evidenceBoundary
    )
      ? navigationInput.evidenceBoundary
      : isObject(
          reading.evidenceBoundary
        )
        ? reading.evidenceBoundary
        : {};

  const transition =
    isObject(
      navigationInput.transition
    )
      ? navigationInput.transition
      : {};

  /*
   * Unknown Reality remains unchanged and in its source language.
   */
  const unknownReality =
    unique(
      boundary.unknownReality,
      12
    );

  /*
   * Evidence Watch must represent future observable signals.
   * Unknown Reality is not copied into this list automatically.
   */
  const evidenceWatch =
    unique([
      ...list(
        transition.evidenceWatch
      ),

      ...list(
        integrated.evidenceWatch
      ),

      ...list(
        navigationContext.priorityEvidence
      )
    ], 12);

  const primaryRegion =
    reading.primaryRuntimeRegion ||
    null;

  const currentRuntime =
    cleanText(
      transition.currentRuntime ||
      integrated.currentRuntime
    ) ||
    copy.defaults.currentRuntime;

  const transitionLabel =
    cleanText(
      transition.currentTransition ||
      integrated.currentTransition
    ) ||
    copy.defaults.transitionLabel;

  const currentSituation =
    cleanText(
      navigationContext.currentSituation
    ) ||
    firstText(
      boundary.observedEvidence,
      currentRuntime
    );

  const desiredDirection =
    cleanText(
      navigationContext.desiredDirection
    ) ||
    copy.guidance.desiredFallback;

  const primaryUnknown =
    unknownReality[0] ||
    '';

  const risks =
    unique(
      integrated.risks,
      8
    );

  const constraints =
    unique([
      ...risks,

      ...list(
        navigationContext.activeConstraints
      ),

      ...list(
        integrated.constraints
      ),

      ...list(
        reading.constraints
      )
    ], 12);

  const alternativeReading =
    isObject(
      integrated.alternativeReading
    )
      ? integrated.alternativeReading
      : {};

  const readingConfidence =
    clamp(
      reading.confidence
    );

  const professionalReviewRecommended =
    risks.length >= 2 ||
    readingConfidence < 0.5 ||
    list(
      boundary.professionalAssessment
    ).length > 0;

  const priority =
    buildPriority({
      copy,
      primaryUnknown,
      evidenceWatch,
      transitionLabel,
      risks,
      unknownReality
    });

  /*
   * Build all eight internal library paths first.
   */
  const allAvailablePaths =
    buildAvailablePaths({
      copy,
      primaryUnknown,
      transitionLabel,
      evidenceWatch,
      constraints,
      risks,
      boundary,
      primaryRegion,
      alternativeReading
    });

  /*
   * Select only the paths that fit the current Reading.
   */
  const contextualSelection =
    selectContextualPaths({
      allPaths:
        allAvailablePaths,

      readingConfidence,
      unknownReality,
      evidenceWatch,
      risks,
      constraints,
      currentRuntime,
      transitionLabel,
      alternativeReading,
      professionalReviewRecommended,
      boundary
    });

  const availablePaths =
    contextualSelection.paths
      .map(path =>
        actionablePath({
          path,
          copy,
          desiredDirection,
          evidenceWatch,
          primaryUnknown,
          constraints
        })
      );

  const recommendedDirection =
    buildRecommendedDirection({
      copy,
      availablePaths,
      priority
    });

  const actionGuidance =
    buildActionGuidance({
      copy,
      availablePaths,
      recommendedDirection
    });

  const reviewConditions =
    buildReviewConditions({
      copy,
      evidenceWatch,
      risks,
      primaryUnknown
    });

  const storageAllowed =
    navigationInput
      ?.persistence
      ?.storageAllowed ===
    true;

  const continuityConditions =
    buildContinuityConditions({
      copy,
      storageAllowed
    });

  const navigationReadiness =
    buildNavigationReadiness({
      copy,
      availablePaths,
      reviewConditions,
      professionalReviewRecommended,
      unknownReality
    });

  const contract =
    createNavigationContract({
      runtimeEntityId:
        navigationInput.runtimeEntityId,

      runtimeEntryId:
        navigationInput.runtimeEntryId,

      scope:
        navigationInput.scope,

      currentPosition: {
        runtime:
          currentRuntime,

        situation:
          currentSituation,

        primaryRuntimeRegion:
          primaryRegion,

        priority,

        navigationReadiness,

        status:
          'provisional',

        evidenceClass:
          'interpretation'
      },

      currentTransition: {
        label:
          transitionLabel,

        status:
          'provisional',

        evidenceClass:
          'interpretation'
      },

      desiredDirection,

      recommendedDirection,

      actionGuidance,

      constraints,
      availablePaths,
      evidenceWatch,
      unknownReality,

      selectedPath:
        null,

      reviewConditions,
      continuityConditions
    });

  const validation =
    validateNavigationContract(
      contract
    );

  if (!validation.valid) {
    throw new Error(
      `Navigation Contract is invalid: ${validation.errors.join(' ')}`
    );
  }

  const legacy = {
    currentRuntime,

    currentSituation,

    desiredDirection,

    currentTransition:
      transitionLabel,

    primaryRuntimeRegion:
      primaryRegion,

    priority,

    recommendedDirection,

    actionGuidance,

    navigationReadiness,

    evidenceToWatch:
      contract.evidenceWatch,

    boundedNavigationPaths:
      contract.availablePaths,

    boundedPath:
      contract.availablePaths,

    reviewConditions:
      contract.reviewConditions,

    professionalReview: {
      recommended:
        professionalReviewRecommended,

      reason:
        professionalReviewRecommended
          ? copy
              .professionalReview
              .recommended
          : copy
              .professionalReview
              .notRequired
    },

    continuityPreview: {
      nextStage:
        'review',

      memoryWriteAllowed:
        storageAllowed,

      reviewReturnsToRuntimeEntity:
        true
    }
  };

  return {
    ...contract,

    createdAt:
      new Date().toISOString(),

    navigationMethod:
      'rule_first',

    languageContract,

    navigationReadiness,

    pathSelection: {
      method:
        'contextual_rule_selection',

      libraryPathCount:
        allAvailablePaths.length,

      selectedPathCount:
        availablePaths.length,

      selectedPathTypes:
        availablePaths.map(
          path =>
            path.pathType
        ),

      audit:
        contextualSelection.audit,

      automaticPathExecution:
        false,

      automaticFinalDecision:
        false,

      userChoiceRequired:
        true
    },

    /*
     * Temporary v1 compatibility aliases.
     */
    currentRuntime:
      legacy.currentRuntime,

    currentSituation:
      legacy.currentSituation,

    desiredDirection:
      legacy.desiredDirection,

    currentTransitionLabel:
      legacy.currentTransition,

    primaryRuntimeRegion:
      legacy.primaryRuntimeRegion,

    priority:
      legacy.priority,

    recommendedDirection:
      legacy.recommendedDirection,

    actionGuidance:
      legacy.actionGuidance,

    evidenceToWatch:
      legacy.evidenceToWatch,

    boundedNavigationPaths:
      legacy.boundedNavigationPaths,

    boundedPath:
      legacy.boundedPath,

    professionalReview:
      legacy.professionalReview,

    continuityPreview:
      legacy.continuityPreview,

    guardrails: {
      ...NAVIGATION_GUARDRAILS,

      observedEvidenceSeparated:
        true,

      reportedExperienceSeparated:
        true,

      interpretationSeparated:
        true,

      professionalAssessmentSeparated:
        true,

      unknownRealityPreserved:
        true,

      evidenceTranslationAllowed:
        false,

      automaticPathSelectionAllowed:
        false,

      automaticPathExecutionAllowed:
        false
    },

    legacy
  };
}

export default navigateRuntimeRuleFirst;
