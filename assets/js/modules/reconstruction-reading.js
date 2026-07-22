/*
 * PHI OS Reconstruction → Reading Bridge
 * File: assets/js/modules/reconstruction-reading.js
 * Version: 1.0.0
 *
 * Responsibilities
 * ----------------
 * - Evaluate whether the current Reconstruction can enter Reality Reading.
 * - Preserve the Reconstruction result for the next page.
 * - Build a stable Reading Input object.
 * - Control the "Continue to Reality Reading" action.
 * - Keep verified evidence separate from interpretive reading inputs.
 * - Redirect to reality-reading.html only when the Reading contract is valid.
 *
 * This module does not:
 * - Perform the Reality Reading itself.
 * - Call OpenAI or Workers AI.
 * - Generate recommendations.
 * - Persist Runtime data.
 */
import {
  SCHEMA_IDS
} from '../core/schema-registry.js';
import {
  SESSION,
  getSession,
  safeJSON,
  setSession,
  qs,
  cleanText
} from '../shared.js';
import { t } from '../i18n.js';


/* =========================================================
   CONSTANTS
========================================================= */

const READING_PAGE =
  '/reality-reading.html';

const READING_INPUT_SESSION_KEY =
  'phiOSRealityReadingInput';


/* =========================================================
   HELPERS
========================================================= */

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}


function arrayValue(value) {
  return Array.isArray(value)
    ? value
    : [];
}


function numberValue(value, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}


function clampScore(value) {
  return Math.max(
    0,
    Math.min(
      1,
      numberValue(value)
    )
  );
}


function normalizeListItem(item) {
  if (typeof item === 'string') {
    return cleanText(item);
  }

  if (!isPlainObject(item)) {
    return '';
  }

  return cleanText(
    item.statement ||
    item.question ||
    item.summary ||
    item.evidenceNeed ||
    item.label ||
    item.name ||
    item.effect ||
    item.source ||
    ''
  );
}


function uniqueTextList(value) {
  const seen = new Set();

  return arrayValue(value)
    .map(normalizeListItem)
    .filter(item => {
      if (!item) {
        return false;
      }

      const key = item.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    });
}


function normalizeGrammarStates(reconstruction) {
  const direct =
    arrayValue(
      reconstruction?.grammarStates
    );

  if (direct.length > 0) {
    return direct
      .filter(isPlainObject)
      .map(item => ({
        code:
          cleanText(item.code)
            .toUpperCase(),

        label:
          cleanText(item.label),

        arc:
          cleanText(item.arc),

        status:
          cleanText(item.status) ||
          'not_established',

        confidence:
          clampScore(item.confidence),

        summary:
          cleanText(item.summary)
      }))
      .filter(item => item.code);
  }

  const legacy =
    arrayValue(
      reconstruction
        ?.formation
        ?.activeGrammars
    );

  return legacy
    .filter(isPlainObject)
    .map(item => ({
      code:
        cleanText(item.code)
          .toUpperCase(),

      label:
        cleanText(item.label),

      arc:
        cleanText(item.arc),

      status:
        item.confidence >= 0.75
          ? 'active'
          : 'provisional',

      confidence:
        clampScore(item.confidence),

      summary:
        cleanText(
          item.reason ||
          item.summary
        )
    }))
    .filter(item => item.code);
}


function normalizeEvidenceBoundary(
  reconstruction,
  runtimeEntry
) {
  const boundary =
    reconstruction?.evidenceBoundary ||
    {};

  const legacy =
    reconstruction?.evidence ||
    {};

  return {
    observedEvidence:
      arrayValue(
        boundary.observedEvidence
      ).length > 0
        ? boundary.observedEvidence
        : arrayValue(
            legacy.knownReality
          ).length > 0
          ? legacy.knownReality
          : arrayValue(
              runtimeEntry?.knownReality
            ),

    reportedExperience:
      arrayValue(
        boundary.reportedExperience
      ).length > 0
        ? boundary.reportedExperience
        : arrayValue(
            legacy.reportedExperience
          ),

    interpretation:
      arrayValue(
        boundary.interpretation
      ).length > 0
        ? boundary.interpretation
        : arrayValue(
            legacy.interpretiveMaterial
          ).length > 0
          ? legacy.interpretiveMaterial
          : runtimeEntry?.userInterpretation
            ? [runtimeEntry.userInterpretation]
            : [],

    unknownReality:
      arrayValue(
        boundary.unknownReality
      ).length > 0
        ? boundary.unknownReality
        : arrayValue(
            legacy.unknownReality
          ).length > 0
          ? legacy.unknownReality
          : arrayValue(
              runtimeEntry?.unknownReality
            )
  };
}


/* =========================================================
   SESSION ACCESS
========================================================= */

export function readStoredReconstruction() {
  const raw =
    getSession(
      SESSION.reconstruction
    );

  if (!raw) {
    return null;
  }

  const result =
    safeJSON(raw, null);

  return (
    isPlainObject(result)
      ? result
      : null
  );
}


export function readStoredRuntimeEntry() {
  const raw =
    getSession(
      SESSION.entry
    );

  if (!raw) {
    return null;
  }

  const payload =
    safeJSON(raw, null);

  if (!isPlainObject(payload)) {
    return null;
  }

  const candidates = [
    payload.runtimeEntry,
    payload.runtime_entry,
    payload.entry,
    payload?.result?.runtimeEntry,
    payload?.latestResult?.runtimeEntry
  ];

  return (
    candidates.find(
      item => isPlainObject(item)
    ) ||
    null
  );
}


/* =========================================================
   READING READINESS
========================================================= */

export function evaluateReadingReadiness(
  result
) {
  if (!isPlainObject(result)) {
    return {
      ready: false,
      status: 'missing_reconstruction',
      score: 0,
      reasons: [
        'No Reality Reconstruction result is available.'
      ]
    };
  }

  const reconstruction =
    result.reconstruction || {};

  const runtimeEntry =
    result.runtimeEntry ||
    readStoredRuntimeEntry() ||
    {};

  const grammarStates =
    normalizeGrammarStates(
      reconstruction
    );

  const evidence =
    normalizeEvidenceBoundary(
      reconstruction,
      runtimeEntry
    );

  const activeGrammars =
    grammarStates.filter(
      item =>
        item.confidence >= 0.45
    );

  const hasDifference =
    activeGrammars.some(
      item => item.code === 'G1'
    );

  const hasFormationContext =
    activeGrammars.some(
      item =>
        [
          'G2',
          'G3',
          'G4'
        ].includes(item.code)
    );

  const hasActivationOrRuntime =
    activeGrammars.some(
      item =>
        [
          'G5',
          'G6',
          'G7'
        ].includes(item.code)
    );

  const hasExperienceOrAction =
    activeGrammars.some(
      item =>
        [
          'G8',
          'G9',
          'G10',
          'G11'
        ].includes(item.code)
    );

  const observedCount =
    uniqueTextList(
      evidence.observedEvidence
    ).length;

  const reportedCount =
    uniqueTextList(
      evidence.reportedExperience
    ).length;

  const unknownCount =
    uniqueTextList(
      evidence.unknownReality
    ).length;

  const backendScore =
    clampScore(
      reconstruction.maturityScore
    );

  const grammarScore =
    clampScore(
      activeGrammars.length /
      8
    );

  const evidenceScore =
    clampScore(
      (
        observedCount * 1.3 +
        reportedCount * 0.6
      ) /
      5
    );

  const score =
    clampScore(
      backendScore * 0.45 +
      grammarScore * 0.35 +
      evidenceScore * 0.2
    );

  const backendReady =
    reconstruction
      ?.nextStage
      ?.ready === true ||
    reconstruction
      ?.readingBoundary
      ?.readyForInitialReading === true;

  const inquiryComplete =
    !reconstruction?.inquiry ||
    reconstruction.inquiry.complete === true;

  const ruleReady =
    (
      score >= 0.38 &&
      activeGrammars.length >= 4 &&
      hasDifference &&
      (
        hasFormationContext ||
        hasActivationOrRuntime ||
        hasExperienceOrAction
      )
    );

  const ready =
    inquiryComplete &&
    (
      backendReady ||
      ruleReady
    );

  const reasons = [];

  if (!inquiryComplete) {
    reasons.push(
      t('reconstruction.inquiryRequiredBeforeReading')
    );
  }

  if (!hasDifference) {
    reasons.push(
      'G1 Difference has not been established.'
    );
  }

  if (
    !hasFormationContext &&
    !hasActivationOrRuntime &&
    !hasExperienceOrAction
  ) {
    reasons.push(
      'The current Runtime lacks sufficient formation, activation, or experience structure.'
    );
  }

  if (
    activeGrammars.length < 4
  ) {
    reasons.push(
      'Fewer than four Runtime Grammars currently meet the provisional Reading threshold.'
    );
  }

  if (
    observedCount === 0 &&
    reportedCount === 0
  ) {
    reasons.push(
      'No observed evidence or reported experience is available.'
    );
  }

  if (score < 0.38) {
    reasons.push(
      'Reconstruction maturity remains below the initial Reading threshold.'
    );
  }

  return {
    ready,

    status:
      ready
        ? (
            unknownCount > 0
              ? 'ready_with_unknowns'
              : 'ready'
          )
        : 'not_ready',

    score:
      Number(
        score.toFixed(2)
      ),

    backendScore:
      Number(
        backendScore.toFixed(2)
      ),

    grammarScore:
      Number(
        grammarScore.toFixed(2)
      ),

    evidenceScore:
      Number(
        evidenceScore.toFixed(2)
      ),

    activeGrammarCount:
      activeGrammars.length,

    observedEvidenceCount:
      observedCount,

    reportedExperienceCount:
      reportedCount,

    unknownRealityCount:
      unknownCount,

    reasons
  };
}


/* =========================================================
   READING INPUT CONTRACT
========================================================= */

export function createReadingInput(
  result,
  options = {}
) {
  if (!isPlainObject(result)) {
    throw new Error(
      'Cannot create a Reality Reading input without a Reconstruction result.'
    );
  }

  const reconstruction =
    result.reconstruction || {};

  const runtimeEntry =
    result.runtimeEntry ||
    readStoredRuntimeEntry();

  if (!isPlainObject(runtimeEntry)) {
    throw new Error(
      'The Runtime Entry required for Reality Reading is missing.'
    );
  }

  const readiness =
    evaluateReadingReadiness(
      result
    );

  if (
    !readiness.ready &&
    options.allowPartial !== true
  ) {
    throw new Error(
      readiness.reasons.join(' ') ||
      'The current Runtime is not ready for Reality Reading.'
    );
  }

  const grammarStates =
    normalizeGrammarStates(
      reconstruction
    );

  const evidenceBoundary =
    normalizeEvidenceBoundary(
      reconstruction,
      runtimeEntry
    );

  const primaryArc =
    cleanText(
      reconstruction.primaryArc
    ) ||
    cleanText(
      reconstruction
        ?.formation
        ?.primaryArc
    ) ||
    'formation';

  const readingInput = {
  schemaVersion:
    SCHEMA_IDS.READING_INPUT,
    createdAt:
      new Date().toISOString(),

    runtimeEntityId:
      cleanText(
        result.runtimeEntityId ||
        runtimeEntry.runtimeEntityId
      ),

    runtimeEntryId:
      cleanText(
        result.runtimeEntryId ||
        runtimeEntry.runtimeEntryId
      ),

    sourceStage:
      'reality_reconstruction',

    readingMode:
      options.readingMode ||
      'initial_integrated_reading',

    runtimeEntry,

    reconstruction: {
      schemaVersion:
  cleanText(
    reconstruction.schemaVersion
  ) ||
  SCHEMA_IDS.RECONSTRUCTION,

      reconstructionMethod:
        cleanText(
          reconstruction.reconstructionMethod ||
          reconstruction.method
        ) ||
        'rule_first',

      primaryArc,

      arcScores:
        isPlainObject(
          reconstruction.arcScores
        )
          ? reconstruction.arcScores
          : {},

      grammarStates,

      maturityScore:
        clampScore(
          reconstruction.maturityScore
        ),

      carrier:
        isPlainObject(
          reconstruction.carrier
        )
          ? reconstruction.carrier
          : {
              initializationCoordinates: []
            },

      conscious:
        isPlainObject(
          reconstruction.conscious
        )
          ? reconstruction.conscious
          : {
              stages: []
            },

      direction:
        isPlainObject(
          reconstruction.direction
        )
          ? reconstruction.direction
          : (
              isPlainObject(
                runtimeEntry.reconstructionDirection
              )
                ? runtimeEntry.reconstructionDirection
                : {
                    focus: '',
                    rationale: '',
                    priorityEvidence: []
                  }
            )
    },

    evidenceBoundary: {
      observedEvidence:
        uniqueTextList(
          evidenceBoundary.observedEvidence
        ),

      reportedExperience:
        uniqueTextList(
          evidenceBoundary.reportedExperience
        ),

      interpretation:
        uniqueTextList(
          evidenceBoundary.interpretation
        ),

      unknownReality:
        uniqueTextList(
          evidenceBoundary.unknownReality
        )
    },

    readingReadiness:
      readiness,

    interpretationPolicy: {
      evidenceBeforeInterpretation: true,

      preserveUnknownReality: true,

      alternativeReadingRequired: true,

      confidenceRequired: true,

      interpretiveReadersSeparated: true,

      professionalAssessmentSeparated: true,

      predictionDisabled: true,

      recommendationsDisabled: true,

      navigationUsesTransition: true
    },

    interpretiveReaders: {
      enabled:
        options.enableInterpretiveReaders === true,

      selected:
        Array.isArray(
          options.selectedInterpretiveReaders
        )
          ? options.selectedInterpretiveReaders
              .filter(Boolean)
          : [],

      evidenceStatus:
        'interpretive_reading',

      note:
        'Human Design, Astrology, BaZi, Zi Wei and Gene Keys must remain separate from verified Runtime evidence.'
    },

    inferencePreference: {
      provider:
        options.provider ||
        'auto',

      ruleFirst:
        true,

      workersAIPreferred:
        options.workersAIPreferred !== false,

      openAIAllowed:
        options.openAIAllowed !== false,

      paidInferenceOnlyWhenNecessary:
        true
    },

    persistence: {
      storageAllowed:
        runtimeEntry
          ?.consent
          ?.storageAllowed === true,

      performed:
        false,

      mode:
        'session_only'
    }
  };

  const validation =
    validateReadingInput(
      readingInput
    );

  if (!validation.valid) {
    throw new Error(
      validation.errors.join(' ')
    );
  }

  return readingInput;
}


/* =========================================================
   CONTRACT VALIDATION
========================================================= */

export function validateReadingInput(
  readingInput
) {
  const errors = [];

  if (!isPlainObject(readingInput)) {
    return {
      valid: false,
      errors: [
        'Reality Reading input must be an object.'
      ]
    };
  }

  if (
  cleanText(
    readingInput.schemaVersion
  ) !==
  SCHEMA_IDS.READING_INPUT
) {
    errors.push(
      'Reality Reading input schemaVersion is invalid.'
    );
  }

  if (
    !cleanText(
      readingInput.runtimeEntityId
    )
  ) {
    errors.push(
      'runtimeEntityId is required.'
    );
  }

  if (
    !cleanText(
      readingInput.runtimeEntryId
    )
  ) {
    errors.push(
      'runtimeEntryId is required.'
    );
  }

  if (
    !isPlainObject(
      readingInput.runtimeEntry
    )
  ) {
    errors.push(
      'Runtime Entry is required.'
    );
  }

  if (
    !isPlainObject(
      readingInput.reconstruction
    )
  ) {
    errors.push(
      'Reconstruction data is required.'
    );
  }

  if (
    !Array.isArray(
      readingInput
        ?.reconstruction
        ?.grammarStates
    )
  ) {
    errors.push(
      'Grammar states must be an array.'
    );
  }

  if (
    !isPlainObject(
      readingInput.evidenceBoundary
    )
  ) {
    errors.push(
      'Evidence Boundary is required.'
    );
  }

  if (
    readingInput
      ?.interpretationPolicy
      ?.evidenceBeforeInterpretation !== true
  ) {
    errors.push(
      'Evidence Before Interpretation must remain enabled.'
    );
  }

  if (
    readingInput
      ?.interpretationPolicy
      ?.preserveUnknownReality !== true
  ) {
    errors.push(
      'Unknown Reality preservation must remain enabled.'
    );
  }

  return {
    valid:
      errors.length === 0,

    errors
  };
}


/* =========================================================
   STORAGE
========================================================= */

export function storeReadingInput(
  readingInput
) {
  const validation =
    validateReadingInput(
      readingInput
    );

  if (!validation.valid) {
    throw new Error(
      validation.errors.join(' ')
    );
  }

  setSession(
    READING_INPUT_SESSION_KEY,
    readingInput
  );

  return readingInput;
}


export function readStoredReadingInput() {
  const raw =
    getSession(
      READING_INPUT_SESSION_KEY
    );

  if (!raw) {
    return null;
  }

  const value =
    safeJSON(raw, null);

  if (!isPlainObject(value)) {
    return null;
  }

  const validation =
    validateReadingInput(
      value
    );

  return validation.valid
    ? value
    : null;
}


/* =========================================================
   BUTTON STATE
========================================================= */

export function updateContinueToReadingButton(
  result
) {
  const button =
    qs('#continueToReading');

  if (!button) {
    return {
      found: false,
      readiness: null
    };
  }

  const readiness =
    evaluateReadingReadiness(
      result
    );

  button.disabled =
    readiness.ready !== true;

  button.setAttribute(
    'aria-disabled',
    readiness.ready
      ? 'false'
      : 'true'
  );

  button.dataset.readingStatus =
    readiness.status;

  if (readiness.ready) {
    button.title =
      readiness.status ===
      'ready_with_unknowns'
        ? t('reconstruction.continueReadingUnknownsTitle')
        : t('reconstruction.continueReadingTitle');
  } else {
    button.title =
      readiness.reasons.join(' ') ||
      t('reconstruction.moreRequired');
  }

  return {
    found: true,
    readiness
  };
}


/* =========================================================
   NAVIGATION
========================================================= */

export function continueToRealityReading(
  result,
  options = {}
) {
  const readingInput =
    createReadingInput(
      result,
      options
    );

  storeReadingInput(
    readingInput
  );

  document.dispatchEvent(
    new CustomEvent(
      'phiOS:readingInputCreated',
      {
        detail: {
          runtimeEntityId:
            readingInput.runtimeEntityId,

          runtimeEntryId:
            readingInput.runtimeEntryId,

          readingMode:
            readingInput.readingMode,

          readiness:
            readingInput.readingReadiness
        }
      }
    )
  );

  if (
    options.navigate !== false
  ) {
    window.location.assign(
      options.readingPage ||
      READING_PAGE
    );
  }

  return readingInput;
}


/* =========================================================
   EVENT BINDING
========================================================= */

export function bindContinueToReading(
  getResult,
  options = {}
) {
  const button =
    qs('#continueToReading');

  if (!button) {
    return {
      bound: false,
      reason:
        'continue_button_missing'
    };
  }

  button.addEventListener(
    'click',
    event => {
      event.preventDefault();

      if (button.disabled) {
        return;
      }

      const result =
        typeof getResult ===
        'function'
          ? getResult()
          : getResult;

      if (!isPlainObject(result)) {
        button.disabled = true;
        button.title =
          t('reconstruction.resultUnavailable');
        return;
      }

      button.disabled = true;

      try {
        continueToRealityReading(
          result,
          options
        );
      } catch (error) {
        button.disabled = false;

        button.title =
          cleanText(
            error?.message
          ) ||
          t('reconstruction.readingOpenFailed');

        document.dispatchEvent(
          new CustomEvent(
            'phiOS:readingNavigationError',
            {
              detail: {
                error:
                  error?.message ||
                  String(error)
              }
            }
          )
        );
      }
    }
  );

  return {
    bound: true
  };
}


/* =========================================================
   READING BRIDGE STATUS
========================================================= */

export function getReconstructionReadingStatus() {
  const reconstruction =
    readStoredReconstruction();

  const storedInput =
    readStoredReadingInput();

  return {
    module:
      'PHI OS Reconstruction Reading Bridge',

    version:
      '1.0.0',

    reconstructionFound:
      Boolean(reconstruction),

    readingInputFound:
      Boolean(storedInput),

    readingPage:
      READING_PAGE,

    readingContractVersion:
  SCHEMA_IDS.READING_INPUT,

    openAIRequired:
      false,

    workersAIRequired:
      false,

    persistentStorageRequired:
      false
  };
}
