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
  showReadingLoading(
    options.loadingTitle,
    options.loadingMessage
  );

  try {
    const response = await requestRealityReading(readingInput, options);

    if (!isObject(response?.reading)) {
      throw new Error('The Reading API returned no Reality Reading.');
    }

    setSession(SESSION.reading, response);
    hide(qs('#readingLoadingState'));
    show(qs('#readingSections'));

    return {
      success: true,
      readingInput,
      response
    };
  } catch (error) {
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
    endpoint: API_ENDPOINT,
    defaultProvider: 'rule_engine',
    languageContractForwarded: true
  };
}
