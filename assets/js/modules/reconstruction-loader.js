/*
 * PHI OS Reality Reconstruction Loader
 * File: assets/js/modules/reconstruction-loader.js
 * Version: 1.0.0
 *
 * Responsibilities
 * ----------------
 * - Read Runtime Entry from sessionStorage.
 * - Validate the minimum front-end contract.
 * - Call POST /api/reconstruct-runtime.
 * - Preserve the returned reconstruction in sessionStorage.
 * - Manage loading, empty and error states.
 * - Return a stable result to the main reconstruction controller.
 *
 * This module does not render PHI OS Reconstruction sections.
 * Rendering belongs to reconstruction-render.js.
 */

import {
  SESSION,
  getSession,
  safeJSON,
  setSession,
  postJSON,
  qs,
  cleanText,
  escapeHTML
} from '../shared.js';

import { t, withLanguageContract } from '../i18n.js';


/* =========================================================
   CONSTANTS
========================================================= */

const API_ENDPOINT = '/api/reconstruct-runtime';

const defaultErrorMessage = () =>
  t('reconstruction.generationFailed');

const SELECTORS = Object.freeze({
  emptyState: '#emptyState',
  workspace: '#workspace',
  loadingState: '#loadingState',
  reconstructionSections: '#reconstructionSections'
});


/* =========================================================
   DOM HELPERS
========================================================= */

function getElement(selector) {
  return qs(selector);
}


function showElement(element) {
  element?.classList.remove('hidden');
}


function hideElement(element) {
  element?.classList.add('hidden');
}


function getPageElements() {
  return {
    emptyState:
      getElement(SELECTORS.emptyState),

    workspace:
      getElement(SELECTORS.workspace),

    loadingState:
      getElement(SELECTORS.loadingState),

    reconstructionSections:
      getElement(
        SELECTORS.reconstructionSections
      )
  };
}


/* =========================================================
   SESSION READING
========================================================= */

export function readRuntimeEntrySession() {
  const rawValue =
    getSession(SESSION.entry);

  if (!rawValue) {
    return {
      found: false,
      payload: null,
      runtimeEntry: null,
      conversation: []
    };
  }

  const payload =
    safeJSON(rawValue, null);

  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    return {
      found: false,
      payload: null,
      runtimeEntry: null,
      conversation: []
    };
  }

  const runtimeEntry =
    normalizeRuntimeEntryPayload(payload);

  const conversation =
    normalizeConversation(
      payload.conversation
    );

  return {
    found: Boolean(runtimeEntry),
    payload,
    runtimeEntry,
    conversation
  };
}


function normalizeRuntimeEntryPayload(payload) {
  const candidates = [
    payload.runtimeEntry,
    payload.runtime_entry,
    payload.entry,
    payload?.result?.runtimeEntry,
    payload?.latestResult?.runtimeEntry
  ];

  const selected =
    candidates.find(candidate => {
      return (
        candidate &&
        typeof candidate === 'object' &&
        !Array.isArray(candidate)
      );
    });

  if (!selected) {
    return null;
  }

  return selected;
}


function normalizeConversation(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(item => {
      return (
        item &&
        typeof item === 'object' &&
        (
          item.role === 'user' ||
          item.role === 'assistant'
        ) &&
        typeof item.content === 'string' &&
        item.content.trim().length > 0
      );
    })
    .map(item => ({
      role: item.role,
      content:
        cleanText(item.content)
          .slice(0, 4000)
    }))
    .slice(-20);
}

export function readReconstructionInquirySession() {
  const saved = safeJSON(
    getSession(SESSION.reconstructionInquiry),
    []
  );

  const answers = Array.isArray(saved)
    ? saved
    : Array.isArray(saved?.answers)
      ? saved.answers
      : [];

  return answers
    .filter(item =>
      item &&
      typeof item === 'object' &&
      cleanText(item.target) &&
      cleanText(item.statement || item.content)
    )
    .map(item => ({
      target: cleanText(item.target),
      statement: cleanText(item.statement || item.content).slice(0, 2000),
      answeredAt: cleanText(item.answeredAt)
    }))
    .slice(0, 6);
}


/* =========================================================
   FRONT-END CONTRACT VALIDATION
========================================================= */

export function validateRuntimeEntryForReconstruction(
  runtimeEntry
) {
  const errors = [];

  if (
    !runtimeEntry ||
    typeof runtimeEntry !== 'object' ||
    Array.isArray(runtimeEntry)
  ) {
    return {
      valid: false,
      errors: [
        'Runtime Entry is missing.'
      ]
    };
  }

  if (
    !cleanText(
      runtimeEntry.runtimeEntityId
    )
  ) {
    errors.push(
      'runtimeEntityId is missing.'
    );
  }

  if (
    !cleanText(
      runtimeEntry.runtimeEntryId
    )
  ) {
    errors.push(
      'runtimeEntryId is missing.'
    );
  }

  const rawStatement =
    cleanText(
      runtimeEntry
        ?.realityChange
        ?.rawStatement
    );

  const normalizedStatement =
    cleanText(
      runtimeEntry
        ?.realityChange
        ?.normalizedStatement
    );

  if (
    !rawStatement &&
    !normalizedStatement
  ) {
    errors.push(
      'Reality Change is missing.'
    );
  }

  if (
    runtimeEntry
      ?.consent
      ?.reconstructionAllowed === false
  ) {
    errors.push(
      'Reconstruction permission is disabled.'
    );
  }

  return {
    valid:
      errors.length === 0,

    errors
  };
}


/* =========================================================
   PAGE STATE
========================================================= */

export function showEmptyState() {
  const elements =
    getPageElements();

  hideElement(
    elements.workspace
  );

  hideElement(
    elements.reconstructionSections
  );

  showElement(
    elements.emptyState
  );
}


export function showWorkspaceState() {
  const elements =
    getPageElements();

  hideElement(
    elements.emptyState
  );

  showElement(
    elements.workspace
  );
}


export function showLoadingState(
  options = {}
) {
  const loadingState =
    getElement(
      SELECTORS.loadingState
    );

  if (!loadingState) {
    return;
  }

  const title =
    cleanText(options.title) ||
    t('reconstruction.loading');

  const message =
    cleanText(options.message) ||
    t('reconstruction.loadingDetail');

  loadingState.innerHTML = `
    <div
      class="reconstruction-spinner"
      aria-hidden="true"
    ></div>

    <div>
      <strong>
        ${escapeHTML(title)}
      </strong>

      <p>
        ${escapeHTML(message)}
      </p>
    </div>
  `;

  showElement(loadingState);
}


export function hideLoadingState() {
  hideElement(
    getElement(
      SELECTORS.loadingState
    )
  );
}


export function showReconstructionSections() {
  showElement(
    getElement(
      SELECTORS.reconstructionSections
    )
  );
}


export function hideReconstructionSections() {
  hideElement(
    getElement(
      SELECTORS.reconstructionSections
    )
  );
}


export function showLoaderError(
  error,
  options = {}
) {
  const loadingState =
    getElement(
      SELECTORS.loadingState
    );

  if (!loadingState) {
    return;
  }

  const title =
    cleanText(options.title) ||
    t('reconstruction.generationFailed');

  const message =
    cleanText(
      error?.message ||
      error
    ) ||
    defaultErrorMessage();

  const allowRetry =
    options.allowRetry !== false;

  loadingState.innerHTML = `
    <div class="loader-error-state">
      <strong>
        ${escapeHTML(title)}
      </strong>

      <p class="error">
        ${escapeHTML(message)}
      </p>

      ${
        allowRetry
          ? `
            <button
              class="btn"
              id="retryReconstruction"
              type="button"
            >
              Try reconstruction again
            </button>
          `
          : ''
      }
    </div>
  `;

  showElement(loadingState);
}


/* =========================================================
   API REQUEST
========================================================= */

export async function requestRuntimeReconstruction({
  runtimeEntry,
  conversation = [],
  reconstructionAnswers = []
}) {
  const validation =
    validateRuntimeEntryForReconstruction(
      runtimeEntry
    );

  if (!validation.valid) {
    throw new Error(
      validation.errors.join(' ')
    );
  }

  return postJSON(
    API_ENDPOINT,
    withLanguageContract({
      runtimeEntry,
      conversation,
      reconstructionAnswers
    }, runtimeEntry?.realityChange?.rawStatement || '')
  );
}


/* =========================================================
   SESSION WRITING
========================================================= */

export function storeReconstructionResult(
  result
) {
  if (
    !result ||
    typeof result !== 'object' ||
    Array.isArray(result)
  ) {
    throw new Error(
      'The reconstruction result is invalid.'
    );
  }

  setSession(
    SESSION.reconstruction,
    result
  );

  return result;
}


/* =========================================================
   RESULT VALIDATION
========================================================= */

export function validateReconstructionResult(
  result
) {
  const errors = [];

  if (
    !result ||
    typeof result !== 'object' ||
    Array.isArray(result)
  ) {
    return {
      valid: false,
      errors: [
        'The server returned no reconstruction result.'
      ]
    };
  }

  if (
    result.success !== true
  ) {
    errors.push(
      cleanText(result.error) ||
      DEFAULT_ERROR_MESSAGE
    );
  }

  if (
    !result.reconstruction ||
    typeof result.reconstruction !== 'object'
  ) {
    errors.push(
      'The reconstruction object is missing.'
    );
  }

  if (
    !cleanText(
      result.runtimeEntityId
    )
  ) {
    errors.push(
      'The reconstructed Runtime Entity ID is missing.'
    );
  }

  if (
    !cleanText(
      result.runtimeEntryId
    )
  ) {
    errors.push(
      'The reconstructed Runtime Entry ID is missing.'
    );
  }

  return {
    valid:
      errors.length === 0,

    errors
  };
}


/* =========================================================
   COMPLETE LOADING FLOW
========================================================= */

export async function loadRuntimeReconstruction(
  options = {}
) {
  const sessionState =
    readRuntimeEntrySession();

  const reconstructionAnswers =
    readReconstructionInquirySession();

  if (!sessionState.found) {
    showEmptyState();

    return {
      success: false,
      reason: 'runtime_entry_missing',
      runtimeEntry: null,
      conversation: [],
      result: null
    };
  }

  const validation =
    validateRuntimeEntryForReconstruction(
      sessionState.runtimeEntry
    );

  if (!validation.valid) {
    showWorkspaceState();

    showLoaderError(
      validation.errors.join(' '),
      {
        title:
          'The Runtime Entry cannot enter Reconstruction.',
        allowRetry: false
      }
    );

    return {
      success: false,
      reason: 'runtime_entry_invalid',
      runtimeEntry:
        sessionState.runtimeEntry,
      conversation:
        sessionState.conversation,
      result: null,
      errors:
        validation.errors
    };
  }

  showWorkspaceState();
  hideReconstructionSections();

  showLoadingState({
    title:
      options.loadingTitle,

    message:
      options.loadingMessage
  });

  try {
      const result =
      await requestRuntimeReconstruction({
        runtimeEntry:
          sessionState.runtimeEntry,

        conversation:
          sessionState.conversation,

        reconstructionAnswers
      });

    const resultValidation =
      validateReconstructionResult(
        result
      );

    if (!resultValidation.valid) {
      throw new Error(
        resultValidation.errors.join(' ')
      );
    }

    storeReconstructionResult(
      result
    );

    hideLoadingState();
    showReconstructionSections();

    return {
      success: true,
      reason: 'reconstruction_loaded',
      runtimeEntry:
        sessionState.runtimeEntry,
      conversation:
        sessionState.conversation,
      reconstructionAnswers,
      result
    };

  } catch (error) {
    showLoaderError(
      error,
      {
        allowRetry: true
      }
    );

    return {
      success: false,
      reason: 'reconstruction_request_failed',
      runtimeEntry:
        sessionState.runtimeEntry,
      conversation:
        sessionState.conversation,
      reconstructionAnswers,
      result: null,
      error
    };
  }
}


/* =========================================================
   RETRY BINDING
========================================================= */

export function bindReconstructionRetry(
  handler
) {
  document.addEventListener(
    'click',
    event => {
      const retryButton =
        event.target.closest(
          '#retryReconstruction'
        );

      if (!retryButton) {
        return;
      }

      if (
        typeof handler !== 'function'
      ) {
        return;
      }

      retryButton.disabled = true;

      Promise.resolve(
        handler()
      ).finally(() => {
        retryButton.disabled = false;
      });
    }
  );
}


/* =========================================================
   DIAGNOSTIC EXPORT
========================================================= */

export function getReconstructionLoaderStatus() {
  const sessionState =
    readRuntimeEntrySession();

  return {
    module:
      'PHI OS Reality Reconstruction Loader',

    version:
      '1.0.0',

    endpoint:
      API_ENDPOINT,

    runtimeEntryFound:
      sessionState.found,

    openAIRequired:
      false,

    workersAIRequired:
      false,

    persistentStorageRequired:
      false
  };
}
