/**
 * PHI OS Reading → Navigation Bridge.
 *
 * Creates the canonical Navigation Input from a completed Reality Reading,
 * stores it within the current browser session, and continues to the
 * Reality Navigation Workspace.
 */

import {
  SCHEMA_IDS
} from '../core/schema-registry.js';

import {
  getLanguage,
  getLocale,
  t
} from '../i18n.js';

import {
  SESSION,
  setSession,
  qs,
  cleanText
} from '../shared.js';

const NAVIGATION_INPUT_KEY =
  SESSION.navigationInput;

const NAVIGATION_PAGE =
  '/reality-navigation.html';

function isObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}

function list(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function itemText(value) {
  if (typeof value === 'string') {
    return cleanText(value);
  }

  if (!isObject(value)) {
    return '';
  }

  return cleanText(
    value.statement ||
    value.normalizedStatement ||
    value.rawStatement ||
    value.summary ||
    value.question ||
    value.label ||
    value.name ||
    value.domain ||
    value.sourceText
  );
}

function uniqueText(
  values,
  maximum = Infinity
) {
  const seen = new Set();
  const output = [];

  for (const value of list(values)) {
    const text = itemText(value);
    const key = text.toLocaleLowerCase();

    if (!text || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(text);

    if (output.length >= maximum) {
      break;
    }
  }

  return output;
}

function normalizeOutputLanguage(value) {
  const language = cleanText(value)
    .toLowerCase()
    .replaceAll('_', '-');

  return (
    language === 'zh' ||
    language.startsWith('zh-')
  )
    ? 'zh'
    : 'en';
}

function normalizeLocale(
  locale,
  outputLanguage
) {
  const normalized = cleanText(locale)
    .toLowerCase()
    .replaceAll('_', '-');

  if (
    outputLanguage === 'zh' ||
    normalized === 'zh' ||
    normalized.startsWith('zh-')
  ) {
    return 'zh-Hans';
  }

  return 'en';
}

function resolveLanguageContract(response) {
  const sourceContract =
    isObject(
      response
        ?.readingInput
        ?.languageContract
    )
      ? response
          .readingInput
          .languageContract
      : {};

  const outputLanguage =
    normalizeOutputLanguage(
      getLanguage() ||
      sourceContract.outputLanguage ||
      response
        ?.languageContract
        ?.outputLanguage
    );

  const locale =
    normalizeLocale(
      getLocale() ||
      sourceContract.locale ||
      response
        ?.languageContract
        ?.locale,
      outputLanguage
    );

  return {
    locale,
    outputLanguage
  };
}

function readingEvidenceBoundary(
  reading
) {
  return isObject(
    reading?.evidenceBoundary
  )
    ? reading.evidenceBoundary
    : {
        observedEvidence: [],
        reportedExperience: [],
        interpretation: [],
        professionalAssessment: [],
        unknownReality: []
      };
}

function transitionFromReading(
  reading
) {
  const integrated =
    isObject(
      reading?.integratedReading
    )
      ? reading.integratedReading
      : {};

  return {
    currentRuntime:
      cleanText(
        integrated.currentRuntime
      ),

    currentTransition:
      cleanText(
        integrated.currentTransition
      ),

    evidenceWatch:
      list(
        integrated.evidenceWatch
      )
  };
}

function navigationContextFromResponse(
  response,
  reading,
  evidenceBoundary
) {
  const readingInput =
    isObject(response?.readingInput)
      ? response.readingInput
      : {};

  const runtimeEntry =
    isObject(readingInput.runtimeEntry)
      ? readingInput.runtimeEntry
      : {};

  const reconstruction =
    isObject(readingInput.reconstruction)
      ? readingInput.reconstruction
      : {};

  const integrated =
    isObject(reading?.integratedReading)
      ? reading.integratedReading
      : {};

  const competingForces =
    uniqueText(
      runtimeEntry
        ?.emergingTension
        ?.competingForces,
      4
    );

  const currentSituation =
    itemText(
      runtimeEntry.realityChange
    ) ||
    itemText(
      evidenceBoundary.observedEvidence?.[0]
    ) ||
    cleanText(
      integrated.currentRuntime
    );

  const currentTension =
    itemText(
      runtimeEntry.emergingTension
    ) ||
    competingForces[0] ||
    cleanText(
      integrated.currentTransition
    );

  /*
   * Entry currently preserves the Desired Transition as either an explicit
   * field or the second competing force. Keep the original user wording.
   */
  const desiredDirection =
    itemText(
      runtimeEntry.desiredTransition
    ) ||
    cleanText(
      runtimeEntry
        ?.extractedFields
        ?.desiredTransition
    ) ||
    competingForces[1] ||
    itemText(
      reconstruction.desiredDirection
    ) ||
    cleanText(
      integrated.currentTransition
    );

  const activeConstraints =
    uniqueText([
      ...list(integrated.constraints),
      ...list(reading?.constraints),
      ...list(reconstruction.constraints),
      ...list(integrated.risks),
      currentTension
    ], 8);

  return {
    currentSituation,
    currentTension,
    desiredDirection,
    activeConstraints,

    priorityEvidence:
      uniqueText([
        ...list(integrated.evidenceWatch),
        ...list(
          reconstruction
            ?.direction
            ?.priorityEvidence
        ),
        ...list(
          runtimeEntry
            ?.reconstructionDirection
            ?.priorityEvidence
        )
      ], 8),

    handoffComplete:
      Boolean(
        currentSituation &&
        desiredDirection
      )
  };
}

export function createNavigationInput(
  response
) {
  const reading =
    response?.reading;

  if (
    !isObject(reading) ||
    reading
      ?.navigationReadiness
      ?.ready !==
    true
  ) {
    throw new Error(
      cleanText(
        reading
          ?.navigationReadiness
          ?.reason
      ) ||
      'Reality Reading is not ready for Navigation.'
    );
  }

  const runtimeEntityId =
    cleanText(
      response.runtimeEntityId ||
      reading.runtimeEntityId
    );

  const runtimeEntryId =
    cleanText(
      response.runtimeEntryId ||
      reading.runtimeEntryId
    );

  if (
    !runtimeEntityId ||
    !runtimeEntryId
  ) {
    throw new Error(
      'Reality Reading is missing its Runtime identity.'
    );
  }

  const evidenceBoundary =
    readingEvidenceBoundary(
      reading
    );

  const languageContract =
    resolveLanguageContract(
      response
    );

  const navigationContext =
    navigationContextFromResponse(
      response,
      reading,
      evidenceBoundary
    );

  const storageAllowed =
    response
      ?.readingInput
      ?.persistence
      ?.storageAllowed ===
    true;

  return {
    schemaVersion:
      SCHEMA_IDS.NAVIGATION_INPUT,

    createdAt:
      new Date().toISOString(),

    runtimeEntityId,
    runtimeEntryId,

    sourceStage:
      'reality_reading',

    scope:
      cleanText(
        response
          ?.readingInput
          ?.scope
      ) ||
      'individual',

    reading,

    /*
     * Preserve the Reading Evidence Boundary exactly.
     * Navigation may reference it but may not rewrite it.
     */
    evidenceBoundary,

    transition:
      transitionFromReading(
        reading
      ),

    /*
     * Formal Reading → Navigation handoff. This prevents Navigation from
     * receiving only an abstract Runtime label and a generic transition.
     */
    navigationContext,

    interpretationPolicy: {
      evidenceBeforeInterpretation:
        true,

      preserveUnknownReality:
        true
    },

    navigationPolicy: {
      recommendationListDisabled:
        true,

      evidenceWatchRequired:
        true,

      reviewConditionsRequired:
        true,

      professionalAssessmentSeparated:
        true,

      userChoiceRequired:
        true,

      automaticPathSelectionAllowed:
        false,

      deterministicCommandsAllowed:
        false,

      outcomePredictionAllowed:
        false,

      professionalJudgmentReplacementAllowed:
        false
    },

    languageContract,

    persistence: {
      storageAllowed,

      performed:
        false,

      mode:
        'session_only'
    }
  };
}

export function bindContinueToNavigation(
  getResponse
) {
  const button =
    qs('#continueToNavigation');

  if (!button) {
    return {
      bound: false
    };
  }

  const currentResponse = () => (
    typeof getResponse === 'function'
      ? getResponse()
      : getResponse
  );

  const refresh = () => {
    const response =
      currentResponse();

    const ready =
      response
        ?.reading
        ?.navigationReadiness
        ?.ready ===
      true;

    const blockers = list(
      response?.reading?.navigationReadiness?.blockers
    ).map(cleanText).filter(Boolean);
    const advisories = list(
      response?.reading?.navigationReadiness?.advisories
    ).map(cleanText).filter(Boolean);

    button.dataset.navigationReady = ready ? 'true' : 'false';
    button.dataset.navigationBlockers = blockers.join(',');
    button.dataset.navigationAdvisories = advisories.join(',');

    button.disabled =
      !ready;

    button.setAttribute(
      'aria-disabled',
      ready
        ? 'false'
        : 'true'
    );

    button.title =
      ready
        ? t(
            'reading.continueButton'
          )
        : cleanText(
            response
              ?.reading
              ?.navigationReadiness
              ?.reason
          ) ||
          t(
            'reading.noReading'
          );
  };

  button.addEventListener(
    'click',
    event => {
      event.preventDefault();

      if (button.disabled) {
        return;
      }

      try {
        const input =
          createNavigationInput(
            currentResponse()
          );

        setSession(
          NAVIGATION_INPUT_KEY,
          input
        );

        location.assign(
          NAVIGATION_PAGE
        );
      } catch (error) {
        console.error(
          'PHI OS Navigation Input creation failed:',
          error
        );

        button.title =
          cleanText(
            error?.message
          ) ||
          'Reality Navigation could not be prepared.';
      }
    }
  );

  refresh();

  return {
    bound: true,
    refresh
  };
}
