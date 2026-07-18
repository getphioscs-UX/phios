/**
 * PHI OS Reality Navigation contract.
 *
 * Navigation describes bounded, reviewable paths derived after Reality
 * Reading. It does not issue deterministic commands, replace professional
 * judgment, predict outcomes, or convert Interpretation into Observed
 * Evidence.
 */

import {
  SCHEMA_IDS,
  isAcceptedSchema
} from '../shared/schema-registry.js';

export const DEFAULT_NAVIGATION_SCOPE = 'individual';

export const NAVIGATION_PATH_TYPES = Object.freeze([
  'observe',
  'clarify',
  'verify',
  'reposition',
  'reconnect',
  'reconfigure',
  'recover',
  'professional_review'
]);

export const NAVIGATION_PATH_STATUSES = Object.freeze([
  'available',
  'selected',
  'in_review',
  'completed',
  'paused',
  'withdrawn'
]);

export const NAVIGATION_GUARDRAILS = Object.freeze({
  deterministicCommandsAllowed: false,
  outcomePredictionAllowed: false,
  interpretationAsFactAllowed: false,
  professionalJudgmentReplacementAllowed: false,
  prescriptiveRecommendationsAllowed: false,
  boundedPathsOnly: true,
  userChoiceRequired: true,
  reviewConditionsRequired: true,
  evidenceBasisRequired: true,
  unknownRealityPreserved: true
});

export const NAVIGATION_CONTRACT_TEMPLATE = Object.freeze({
  schemaVersion: SCHEMA_IDS.NAVIGATION,
  runtimeEntityId: '',
  runtimeEntryId: '',
  scope: DEFAULT_NAVIGATION_SCOPE,

  currentPosition: Object.freeze({}),
  currentTransition: Object.freeze({}),
  desiredDirection: '',

  constraints: Object.freeze([]),
  availablePaths: Object.freeze([]),

  recommendedDirection: null,
  actionGuidance: null,

  evidenceWatch: Object.freeze([]),
  unknownReality: Object.freeze([]),

  selectedPath: null,

  reviewConditions: Object.freeze([]),
  continuityConditions: Object.freeze([]),

  guardrails: NAVIGATION_GUARDRAILS
});

/**
 * Backward-compatible export.
 */
export const NAVIGATION_CONTRACT =
  NAVIGATION_CONTRACT_TEMPLATE;

function isObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}

function cleanText(value) {
  return typeof value === 'string'
    ? value
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    : '';
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueText(values, maximum = Infinity) {
  const seen = new Set();
  const output = [];

  for (const value of list(values)) {
    const text = cleanText(
      value?.statement ||
      value?.question ||
      value
    );

    const key = text.toLocaleLowerCase();

    if (!text || seen.has(key)) continue;

    seen.add(key);
    output.push(text);

    if (output.length >= maximum) break;
  }

  return output;
}

function normalizePathType(value) {
  const type = cleanText(value)
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_');

  const aliases = {
    escalation: 'professional_review',
    escalate: 'professional_review',
    professional: 'professional_review',
    professional_assessment: 'professional_review'
  };

  const normalized = aliases[type] || type;

  return NAVIGATION_PATH_TYPES.includes(normalized)
    ? normalized
    : '';
}

function normalizePathStatus(value) {
  const status = cleanText(value)
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_');

  return NAVIGATION_PATH_STATUSES.includes(status)
    ? status
    : 'available';
}

function normalizeEvidenceBasis(values) {
  return uniqueText(values, 8);
}

function normalizeReviewConditions(values) {
  return uniqueText(values, 8);
}

function normalizePath(path) {
  if (!isObject(path)) return null;

  const id = cleanText(path.id);
  const pathType = normalizePathType(
    path.pathType ||
    path.type
  );
  const label = cleanText(
    path.label ||
    path.title
  );
  const direction = cleanText(path.direction);
  const boundary = cleanText(path.boundary);

  if (
    !id ||
    !pathType ||
    !label ||
    !direction ||
    !boundary
  ) {
    return null;
  }

  return {
    id,
    pathType,
    label,
    title:
      cleanText(path.title) ||
      label,
    direction,
    boundary,

    rationale: cleanText(path.rationale),
    description:
      cleanText(path.description) ||
      cleanText(path.rationale),

    suitableWhen:
      uniqueText(
        path.suitableWhen,
        6
      ),

    nextStep:
      cleanText(path.nextStep),

    firstStep:
      cleanText(path.firstStep) ||
      cleanText(path.nextStep),

    actionSteps:
      uniqueText(
        path.actionSteps,
        5
      ),

    observationWindow:
      cleanText(
        path.observationWindow
      ),

    completionSignals:
      uniqueText(
        path.completionSignals,
        5
      ),

    stopConditions:
      uniqueText(
        path.stopConditions,
        5
      ),

    evidenceBasis:
      normalizeEvidenceBasis(
        path.evidenceBasis
      ),

    evidenceWatch:
      normalizeEvidenceBasis(
        path.evidenceWatch ||
        path.evidenceBasis
      ),

    unknownReality:
      uniqueText(
        path.unknownReality,
        8
      ),

    reviewConditions:
      normalizeReviewConditions(
        path.reviewConditions
      ),

    status:
      normalizePathStatus(
        path.status
      ),

    deterministicCommand: false,
    outcomePrediction: false,
    userChoiceRequired: true,
    professionalReviewRequired:
      pathType === 'professional_review',

    requiresProfessionalReview:
      path.requiresProfessionalReview === true ||
      pathType === 'professional_review',

    professionalDomain:
      cleanText(path.professionalDomain),

    availability:
      cleanText(path.availability) ||
      'available',

    nextRoute:
      cleanText(path.nextRoute)
  };
}

function normalizePaths(paths) {
  const seen = new Set();
  const output = [];

  for (const path of list(paths)) {
    const normalized = normalizePath(path);

    if (!normalized) continue;

    const key = normalized.id.toLocaleLowerCase();

    if (seen.has(key)) continue;

    seen.add(key);
    output.push(normalized);
  }

  return output;
}

function normalizeSelectedPath(
  selectedPath,
  availablePaths
) {
  if (!isObject(selectedPath)) return null;

  const selectedId = cleanText(
    selectedPath.id
  );

  if (!selectedId) return null;

  const matchedPath = availablePaths.find(
    path => path.id === selectedId
  );

  if (!matchedPath) return null;

  return {
    ...matchedPath,
    status: 'selected',
    selectedAt:
      cleanText(selectedPath.selectedAt),
    selectionSource:
      cleanText(selectedPath.selectionSource) ||
      'user_choice',
    selectionNote:
      cleanText(selectedPath.selectionNote)
  };
}

function normalizeRecommendedDirection(
  value,
  availablePaths
) {
  if (!isObject(value)) {
    return null;
  }

  const pathId =
    cleanText(value.pathId);

  const matchedPath =
    availablePaths.find(
      path => path.id === pathId
    );

  if (!matchedPath) {
    return null;
  }

  return {
    pathId,
    pathType:
      matchedPath.pathType,
    label:
      cleanText(value.label) ||
      matchedPath.label,
    summary:
      cleanText(value.summary),
    reason:
      cleanText(value.reason),
    userChoiceNotice:
      cleanText(
        value.userChoiceNotice
      ),
    userChoiceRequired:
      true,
    automaticSelection:
      false
  };
}

function normalizeActionGuidance(
  value,
  availablePaths
) {
  if (!isObject(value)) {
    return null;
  }

  const sourcePathId =
    cleanText(value.sourcePathId);

  const matchedPath =
    availablePaths.find(
      path => path.id === sourcePathId
    );

  if (!matchedPath) {
    return null;
  }

  return {
    sourcePathId,
    nextStep:
      cleanText(value.nextStep) ||
      matchedPath.nextStep,
    steps:
      uniqueText(
        value.steps,
        5
      ),
    observationWindow:
      cleanText(
        value.observationWindow
      ) ||
      matchedPath.observationWindow,
    completionSignals:
      uniqueText(
        value.completionSignals,
        5
      ),
    stopConditions:
      uniqueText(
        value.stopConditions,
        5
      ),
    reviewConditions:
      uniqueText(
        value.reviewConditions,
        8
      ),
    continuityInstruction:
      cleanText(
        value.continuityInstruction
      ),
    userChoiceRequired:
      true
  };
}

export function createNavigationContract(
  source = {}
) {
  const input = isObject(source)
    ? source
    : {};

  const availablePaths =
    normalizePaths(
      input.availablePaths
    );

  const recommendedDirection =
    normalizeRecommendedDirection(
      input.recommendedDirection,
      availablePaths
    );

  return {
    schemaVersion:
      SCHEMA_IDS.NAVIGATION,

    runtimeEntityId:
      cleanText(
        input.runtimeEntityId
      ),

    runtimeEntryId:
      cleanText(
        input.runtimeEntryId
      ),

    scope:
      cleanText(input.scope) ||
      DEFAULT_NAVIGATION_SCOPE,

    currentPosition:
      isObject(input.currentPosition)
        ? { ...input.currentPosition }
        : {},

    currentTransition:
      isObject(input.currentTransition)
        ? { ...input.currentTransition }
        : {},

    desiredDirection:
      cleanText(
        input.desiredDirection
      ),

    constraints:
      uniqueText(
        input.constraints,
        12
      ),

    availablePaths,

    recommendedDirection,

    actionGuidance:
      normalizeActionGuidance(
        input.actionGuidance,
        availablePaths
      ),

    evidenceWatch:
      uniqueText(
        input.evidenceWatch,
        12
      ),

    unknownReality:
      uniqueText(
        input.unknownReality,
        12
      ),

    selectedPath:
      normalizeSelectedPath(
        input.selectedPath,
        availablePaths
      ),

    reviewConditions:
      uniqueText(
        input.reviewConditions,
        12
      ),

    continuityConditions:
      uniqueText(
        input.continuityConditions,
        12
      ),

    guardrails:
      NAVIGATION_GUARDRAILS
  };
}

export function validateNavigationContract(
  value
) {
  const errors = [];

  if (!isObject(value)) {
    return {
      valid: false,
      errors: [
        'Navigation must be an object.'
      ]
    };
  }

  if (
    !isAcceptedSchema(
      'navigation',
      value.schemaVersion
    )
  ) {
    errors.push(
      'Navigation schemaVersion is invalid.'
    );
  }

  if (!cleanText(value.runtimeEntityId)) {
    errors.push(
      'runtimeEntityId is required.'
    );
  }

  if (!cleanText(value.runtimeEntryId)) {
    errors.push(
      'runtimeEntryId is required.'
    );
  }

  if (!cleanText(value.scope)) {
    errors.push(
      'Navigation scope is required.'
    );
  }

  if (!isObject(value.currentPosition)) {
    errors.push(
      'currentPosition must be an object.'
    );
  }

  if (!isObject(value.currentTransition)) {
    errors.push(
      'currentTransition must be an object.'
    );
  }

  if (!cleanText(value.desiredDirection)) {
    errors.push(
      'desiredDirection is required.'
    );
  }

  for (const field of [
    'constraints',
    'availablePaths',
    'evidenceWatch',
    'unknownReality',
    'reviewConditions',
    'continuityConditions'
  ]) {
    if (!Array.isArray(value[field])) {
      errors.push(
        `${field} must be an array.`
      );
    }
  }

  const pathIds = new Set();

  list(value.availablePaths).forEach(
    (path, index) => {
      const normalized =
        normalizePath(path);

      if (!normalized) {
        errors.push(
          `availablePaths[${index}] must include id, pathType, label, direction, and boundary.`
        );

        return;
      }

      const idKey =
        normalized.id.toLocaleLowerCase();

      if (pathIds.has(idKey)) {
        errors.push(
          `availablePaths[${index}] has a duplicate id.`
        );
      }

      pathIds.add(idKey);

      if (
        path?.deterministicCommand ===
        true
      ) {
        errors.push(
          `availablePaths[${index}] cannot be a deterministic command.`
        );
      }

      if (
        path?.outcomePrediction ===
        true
      ) {
        errors.push(
          `availablePaths[${index}] cannot predict an outcome.`
        );
      }

      if (
        normalized.evidenceBasis
          .length === 0 &&
        normalized.pathType !==
          'clarify' &&
        normalized.pathType !==
          'observe'
      ) {
        errors.push(
          `availablePaths[${index}] requires an evidenceBasis.`
        );
      }

      if (
        normalized.reviewConditions
          .length === 0
      ) {
        errors.push(
          `availablePaths[${index}] requires at least one review condition.`
        );
      }

      if (
        !normalized.nextStep ||
        normalized.actionSteps.length === 0 ||
        !normalized.observationWindow ||
        normalized.completionSignals.length === 0 ||
        normalized.stopConditions.length === 0
      ) {
        errors.push(
          `availablePaths[${index}] requires nextStep, actionSteps, observationWindow, completionSignals, and stopConditions.`
        );
      }
    }
  );

  if (!isObject(value.recommendedDirection)) {
    errors.push(
      'recommendedDirection must reference a suggested starting path.'
    );
  } else if (
    !pathIds.has(
      cleanText(
        value.recommendedDirection.pathId
      ).toLocaleLowerCase()
    )
  ) {
    errors.push(
      'recommendedDirection.pathId must reference an available path.'
    );
  }

  if (!isObject(value.actionGuidance)) {
    errors.push(
      'actionGuidance is required.'
    );
  } else {
    if (
      !cleanText(
        value.actionGuidance.nextStep
      ) ||
      uniqueText(
        value.actionGuidance.steps,
        5
      ).length === 0 ||
      !cleanText(
        value.actionGuidance
          .observationWindow
      ) ||
      uniqueText(
        value.actionGuidance
          .stopConditions,
        5
      ).length === 0
    ) {
      errors.push(
        'actionGuidance requires nextStep, steps, observationWindow, and stopConditions.'
      );
    }
  }

  if (
    value.selectedPath !== null &&
    !isObject(value.selectedPath)
  ) {
    errors.push(
      'selectedPath must be an object or null.'
    );
  }

  if (isObject(value.selectedPath)) {
    const selectedId =
      cleanText(
        value.selectedPath.id
      );

    if (!selectedId) {
      errors.push(
        'selectedPath.id is required.'
      );
    } else if (!pathIds.has(
      selectedId.toLocaleLowerCase()
    )) {
      errors.push(
        'selectedPath must reference an available path.'
      );
    }
  }

  return {
    valid:
      errors.length === 0,
    errors
  };
}

export function isNavigationContract(
  value
) {
  return validateNavigationContract(
    value
  ).valid;
}

export default NAVIGATION_CONTRACT_TEMPLATE;
