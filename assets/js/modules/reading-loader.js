/*
 * PHI OS Reality Reading Loader
 * File: assets/js/modules/reading-loader.js
 * Version: 1.1.0
 *
 * Loads the session-only Reading Input, validates the contract, calls the
 * Runtime Reading API, and controls the loading, empty, and error states.
 */
import {
  isAcceptedSchema
} from '../core/schema-registry.js';
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

import { t } from '../i18n.js';

const READING_INPUT_KEY = SESSION.readingInput;
const READING_RESPONSE_KEY = SESSION.reading;
const READING_REQUEST_KEY = SESSION.readingRequestState;
const API_ENDPOINT = '/api/read-runtime';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function show(element) {
  element?.classList.remove('hidden');
}

function hide(element) {
  element?.classList.add('hidden');
}

function normalizeLocale(value) {
  const locale = cleanText(value);

  if (locale.toLowerCase().startsWith('zh')) {
    return 'zh-Hans';
  }

  return 'en';
}

function normalizeOutputLanguage(value, locale) {
  const language = cleanText(value).toLowerCase();

  if (language === 'zh' || language.startsWith('zh-')) {
    return 'zh';
  }

  if (language === 'en' || language.startsWith('en-')) {
    return 'en';
  }

  return normalizeLocale(locale) === 'zh-Hans' ? 'zh' : 'en';
}

export function readStoredReadingInput() {
  const input = safeJSON(getSession(READING_INPUT_KEY), null);
  return isObject(input) ? input : null;
}

export function readStoredReadingResponse() {
  const response = safeJSON(getSession(READING_RESPONSE_KEY), null);
  return isObject(response) ? response : null;
}

function requestFingerprint(input, options = {}) {
  return JSON.stringify({
    input,
    provider: cleanText(options.provider) || 'auto',
    deepReading: options.deepReading === true,
    locale: normalizeLocale(options.locale),
    outputLanguage: normalizeOutputLanguage(
      options.outputLanguage,
      options.locale
    )
  });
}

function readRequestState() {
  const state = safeJSON(getSession(READING_REQUEST_KEY), null);
  return isObject(state) ? state : null;
}

export function canReuseStoredReading(input, response, options = {}) {
  if (!isObject(input) || !isObject(response) || !isObject(response.reading)) {
    return false;
  }
  if (
    cleanText(response.runtimeEntityId) !== cleanText(input.runtimeEntityId) ||
    cleanText(response.runtimeEntryId) !== cleanText(input.runtimeEntryId)
  ) return false;
  const expectedLocale = normalizeLocale(options.locale);
  const expectedLanguage = normalizeOutputLanguage(
    options.outputLanguage,
    expectedLocale
  );
  if (
    normalizeLocale(response.languageContract?.locale) !== expectedLocale ||
    normalizeOutputLanguage(
      response.languageContract?.outputLanguage,
      response.languageContract?.locale
    ) !== expectedLanguage
  ) return false;
  if (
    Boolean(response.inference?.deepReadingRequested) !==
    (options.deepReading === true)
  ) return false;
  return JSON.stringify(response.readingInput || null) === JSON.stringify(input);
}

export function validateReadingInput(input) {
  const errors = [];

  if (!isObject(input)) {
    return {
      valid: false,
      errors: ['No Reality Reading input was found.']
    };
  }

  if (
  !isAcceptedSchema(
    'readingInput',
    cleanText(input.schemaVersion)
  )
) {
    errors.push('Reading input schemaVersion is invalid.');
  }

  if (!cleanText(input.runtimeEntityId)) {
    errors.push('Runtime Entity ID is missing.');
  }

  if (!cleanText(input.runtimeEntryId)) {
    errors.push('Runtime Entry ID is missing.');
  }

  if (!isObject(input.runtimeEntry)) {
    errors.push('Runtime Entry is missing.');
  }

  if (!isObject(input.reconstruction)) {
    errors.push('Reconstruction is missing.');
  }

  if (!isObject(input.evidenceBoundary)) {
    errors.push('Evidence Boundary is missing.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function showReadingEmptyState() {
  show(qs('#readingEmptyState'));
  hide(qs('#readingWorkspaceBody'));
}

export function showReadingWorkspace() {
  hide(qs('#readingEmptyState'));
  show(qs('#readingWorkspaceBody'));
}

export function showReadingLoading(title, message) {
  const loading = qs('#readingLoadingState');

  if (!loading) return;

  const loadingTitle = cleanText(title) || t('reading.loading');
  const loadingMessage = cleanText(message) || t('reading.loadingDetail');

  loading.innerHTML = `
    <div class="reading-spinner" aria-hidden="true"></div>
    <div>
      <strong>${escapeHTML(loadingTitle)}</strong>
      <p>${escapeHTML(loadingMessage)}</p>
    </div>
  `;

  show(loading);
  hide(qs('#readingSections'));
}

export function showReadingError(error) {
  const loading = qs('#readingLoadingState');

  if (!loading) return;

  console.error('PHI OS Reality Reading request failed:', error);

  loading.innerHTML = `
    <div class="reading-error-state">
      <strong>${escapeHTML(t('reading.generationFailed'))}</strong>
      <p class="error">${escapeHTML(t('reading.dynamic.unknownError'))}</p>
      <button class="btn" id="retryReading" type="button">
        ${escapeHTML(t('reading.dynamic.retry'))}
      </button>
    </div>
  `;

  show(loading);
  hide(qs('#readingSections'));
}

export function showReadingRecoveryState() {
  const loading = qs('#readingLoadingState');
  if (!loading) return;
  loading.innerHTML = `
    <div class="reading-error-state">
      <strong>${escapeHTML(t('reading.generationFailed'))}</strong>
      <p>${escapeHTML(t('reading.dynamic.unknownError'))}</p>
      <button class="btn" id="retryReading" type="button">
        ${escapeHTML(t('reading.dynamic.retry'))}
      </button>
    </div>
  `;
  show(loading);
  hide(qs('#readingSections'));
}

export async function requestRealityReading(readingInput, options = {}) {
  const locale = normalizeLocale(options.locale);
  const outputLanguage = normalizeOutputLanguage(
    options.outputLanguage,
    locale
  );

  return postJSON(API_ENDPOINT, {
    readingInput,
    options: {
      provider:
        cleanText(options.provider) ||
        readingInput?.inferencePreference?.provider ||
        'auto',

      deepReading: options.deepReading === true,

      locale,
      outputLanguage
    }
  });
}

export async function loadRealityReading(options = {}) {
  const readingInput = readStoredReadingInput();
  const validation = validateReadingInput(readingInput);

  if (!validation.valid) {
    showReadingEmptyState();

    return {
      success: false,
      reason: 'reading_input_missing',
      errors: validation.errors
    };
  }

  showReadingWorkspace();

  const storedResponse = readStoredReadingResponse();
  if (
    options.forceRefresh !== true &&
    canReuseStoredReading(readingInput, storedResponse, options)
  ) {
    hide(qs('#readingLoadingState'));
    show(qs('#readingSections'));
    return {
      success: true,
      source: 'session_cache',
      readingInput,
      response: storedResponse
    };
  }

  const fingerprint = requestFingerprint(readingInput, options);
  const priorRequest = readRequestState();
  if (
    options.forceRefresh !== true &&
    priorRequest?.status === 'pending' &&
    priorRequest?.fingerprint === fingerprint
  ) {
    showReadingRecoveryState();
    return {
      success: false,
      reason: 'reading_request_interrupted',
      readingInput,
      automaticRetry: false
    };
  }

  showReadingLoading(
    options.loadingTitle,
    options.loadingMessage
  );
  setSession(READING_REQUEST_KEY, {
    schemaVersion: 'phi-os.runtime-provider-request.v1',
    status: 'pending',
    fingerprint,
    startedAt: new Date().toISOString(),
    automaticRetry: false
  });

  try {
    const response = await requestRealityReading(readingInput, options);

    if (!isObject(response?.reading)) {
      throw new Error('The Reading API returned no Reality Reading.');
    }

    setSession(READING_RESPONSE_KEY, response);
    setSession(READING_REQUEST_KEY, {
      schemaVersion: 'phi-os.runtime-provider-request.v1',
      status: 'completed',
      fingerprint,
      completedAt: new Date().toISOString(),
      automaticRetry: false
    });
    hide(qs('#readingLoadingState'));
    show(qs('#readingSections'));

    return {
      success: true,
      readingInput,
      response
    };
  } catch (error) {
    setSession(READING_REQUEST_KEY, {
      schemaVersion: 'phi-os.runtime-provider-request.v1',
      status: 'failed',
      fingerprint,
      failedAt: new Date().toISOString(),
      automaticRetry: false
    });
    showReadingError(error);

    return {
      success: false,
      reason: 'reading_request_failed',
      readingInput,
      error
    };
  }
}

export function bindReadingRetry(handler) {
  document.addEventListener('click', event => {
    const button = event.target?.closest?.('#retryReading');

    if (!button) return;

    event.preventDefault();
    handler?.();
  });
}

export function getReadingLoaderStatus() {
  return {
    module: 'PHI OS Reality Reading Loader',
    inputFound: Boolean(readStoredReadingInput()),
    cachedResponseFound: Boolean(readStoredReadingResponse()),
    endpoint: API_ENDPOINT,
    defaultProvider: 'rule_engine',
    refreshCacheEnabled: true,
    automaticProviderRetry: false,
    languageContractForwarded: true
  };
}
