/*
 * PHI OS Reality Navigation Loader
 * File: assets/js/modules/navigation-loader.js
 * Version: 1.0.0
 *
 * Loads and validates the session-only Navigation Input, reuses a compatible
 * session response when possible, calls the Runtime Navigation API, and owns
 * the loading, empty, and error states. It does not render Navigation data.
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

const NAVIGATION_INPUT_KEY = SESSION.navigationInput;
const NAVIGATION_RESPONSE_KEY = SESSION.navigation;
const NAVIGATION_REQUEST_KEY = SESSION.navigationRequestState;
const API_ENDPOINT = '/api/navigate-runtime';
const NAVIGATION_RUNTIME_COPY_VERSION = '1.1.0';

function isObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}

function show(element) {
  element?.classList.remove('hidden');
}

function hide(element) {
  element?.classList.add('hidden');
}

function normalizeLocale(value) {
  const locale = cleanText(value)
    .toLowerCase()
    .replaceAll('_', '-');

  return locale.startsWith('zh')
    ? 'zh-Hans'
    : 'en';
}

function normalizeOutputLanguage(value, locale) {
  const language = cleanText(value)
    .toLowerCase()
    .replaceAll('_', '-');

  if (language === 'zh' || language.startsWith('zh-')) {
    return 'zh';
  }

  if (language === 'en' || language.startsWith('en-')) {
    return 'en';
  }

  return normalizeLocale(locale) === 'zh-Hans'
    ? 'zh'
    : 'en';
}

function languageContract(options = {}) {
  const locale = normalizeLocale(options.locale);
  const outputLanguage = normalizeOutputLanguage(
    options.outputLanguage,
    locale
  );

  return {
    locale,
    outputLanguage
  };
}

function withLanguageContract(input, contract) {
  return {
    ...input,
    languageContract: contract
  };
}

export function readStoredNavigationInput() {
  const input = safeJSON(
    getSession(NAVIGATION_INPUT_KEY),
    null
  );

  return isObject(input) ? input : null;
}

export function readStoredNavigationResponse() {
  const response = safeJSON(
    getSession(NAVIGATION_RESPONSE_KEY),
    null
  );

  return isObject(response) ? response : null;
}

function requestFingerprint(input, options = {}) {
  const contract = languageContract(options);
  return JSON.stringify({
    input,
    locale: contract.locale,
    outputLanguage: contract.outputLanguage
  });
}

function readRequestState() {
  const state = safeJSON(
    getSession(NAVIGATION_REQUEST_KEY),
    null
  );
  return isObject(state) ? state : null;
}

export function validateNavigationInput(input) {
  const errors = [];

  if (!isObject(input)) {
    return {
      valid: false,
      errors: ['No Reality Navigation input was found.']
    };
  }

  if (
    !isAcceptedSchema(
      'navigationInput',
      cleanText(input.schemaVersion)
    )
  ) {
    errors.push('Navigation input schemaVersion is invalid.');
  }

  if (!cleanText(input.runtimeEntityId)) {
    errors.push('Runtime Entity ID is missing.');
  }

  if (!cleanText(input.runtimeEntryId)) {
    errors.push('Runtime Entry ID is missing.');
  }

  if (!isObject(input.reading)) {
    errors.push('Reality Reading is missing.');
  }

  if (!isObject(input.evidenceBoundary)) {
    errors.push('Evidence Boundary is missing.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function canReuseStoredNavigation(
  input,
  response,
  options = {}
) {
  if (
    !isObject(input) ||
    !isObject(response) ||
    !isObject(response.navigation)
  ) {
    return false;
  }

  if (
    !isAcceptedSchema(
      'navigation',
      cleanText(response.navigation.schemaVersion)
    )
  ) {
    return false;
  }

  if (
    cleanText(response.runtimeEntityId) !==
      cleanText(input.runtimeEntityId) ||
    cleanText(response.runtimeEntryId) !==
      cleanText(input.runtimeEntryId)
  ) {
    return false;
  }

  /*
   * Do not reuse a response generated before the Navigation language
   * normalization boundary was introduced. This refreshes an existing
   * browser session once after deployment without deleting user evidence.
   */
  if (
    cleanText(response.runtimeCopyVersion) !==
    NAVIGATION_RUNTIME_COPY_VERSION
  ) {
    return false;
  }

  const inputCreatedAt = cleanText(input.createdAt);
  const storedInputCreatedAt = cleanText(
    response.navigationInput?.createdAt
  );

  if (
    !inputCreatedAt ||
    !storedInputCreatedAt ||
    inputCreatedAt !== storedInputCreatedAt
  ) {
    return false;
  }

  const expected = languageContract(options);
  const stored = response.languageContract;

  return isObject(stored) &&
    normalizeLocale(stored.locale) === expected.locale &&
    normalizeOutputLanguage(
      stored.outputLanguage,
      stored.locale
    ) === expected.outputLanguage;
}

export function showNavigationEmptyState() {
  show(qs('#navigationEmptyState'));
  hide(qs('#navigationWorkspaceBody'));
}

export function showNavigationWorkspace() {
  hide(qs('#navigationEmptyState'));
  show(qs('#navigationWorkspaceBody'));
}

export function showNavigationLoading(title, message) {
  const loading = qs('#navigationLoadingState');

  if (!loading) return;

  const loadingTitle = cleanText(title) ||
    t('navigation.loadingTitle');
  const loadingMessage = cleanText(message) ||
    t('navigation.loadingMessage');

  loading.innerHTML = `
    <span class="navigation-spinner" aria-hidden="true"></span>
    <div>
      <strong>${escapeHTML(loadingTitle)}</strong>
      <p>${escapeHTML(loadingMessage)}</p>
    </div>
  `;

  show(loading);
  hide(qs('#navigationSections'));
}

export function showNavigationError(error) {
  const loading = qs('#navigationLoadingState');

  if (!loading) return;

  console.error('PHI OS Reality Navigation request failed:', error);

  loading.innerHTML = `
    <div class="navigation-error-state">
      <strong>${escapeHTML(t('navigation.errorTitle'))}</strong>
      <p class="error">${escapeHTML(
        cleanText(error?.message) ||
        t('navigation.generationFailed')
      )}</p>
      <button class="btn" id="retryNavigation" type="button">
        ${escapeHTML(t('reading.dynamic.retry'))}
      </button>
    </div>
  `;

  show(loading);
  hide(qs('#navigationSections'));
}

export function showNavigationRecoveryState() {
  const loading = qs('#navigationLoadingState');

  if (!loading) return;

  loading.innerHTML = `
    <div class="navigation-error-state">
      <strong>${escapeHTML(
        t('navigation.errorTitle')
      )}</strong>
      <p>${escapeHTML(
        t('navigation.generationFailed')
      )}</p>
      <button class="btn" id="retryNavigation" type="button">
        ${escapeHTML(t('reading.dynamic.retry'))}
      </button>
    </div>
  `;

  show(loading);
  hide(qs('#navigationSections'));
}

export async function requestRealityNavigation(
  navigationInput,
  options = {}
) {
  const contract = languageContract(options);
  const localizedInput = withLanguageContract(
    navigationInput,
    contract
  );

  const response = await postJSON(API_ENDPOINT, {
    navigationInput: localizedInput,
    options: contract
  });

  return {
    localizedInput,
    response
  };
}

export async function loadRealityNavigation(options = {}) {
  const input = readStoredNavigationInput();
  const validation = validateNavigationInput(input);

  if (!validation.valid) {
    showNavigationEmptyState();

    return {
      success: false,
      reason: 'navigation_input_missing',
      errors: validation.errors
    };
  }

  const contract = languageContract(options);
  const localizedInput = withLanguageContract(input, contract);
  const storedResponse = readStoredNavigationResponse();
  const fingerprint = requestFingerprint(
    localizedInput,
    contract
  );
  const requestState = readRequestState();

  setSession(NAVIGATION_INPUT_KEY, localizedInput);
  showNavigationWorkspace();

  if (
    options.forceRefresh !== true &&
    canReuseStoredNavigation(
      localizedInput,
      storedResponse,
      contract
    )
  ) {
    hide(qs('#navigationLoadingState'));
    show(qs('#navigationSections'));

    return {
      success: true,
      source: 'session_cache',
      navigationInput: localizedInput,
      response: storedResponse
    };
  }

  if (
    options.forceRefresh !== true &&
    requestState?.status === 'pending' &&
    requestState?.fingerprint === fingerprint
  ) {
    showNavigationRecoveryState();

    return {
      success: false,
      reason: 'navigation_request_interrupted',
      navigationInput: localizedInput,
      providerCalled: false,
      regenerated: false
    };
  }

  showNavigationLoading(
    options.loadingTitle,
    options.loadingMessage
  );
  setSession(NAVIGATION_REQUEST_KEY, {
    status: 'pending',
    fingerprint,
    startedAt: new Date().toISOString(),
    automaticRetry: false
  });

  try {
    const result = await requestRealityNavigation(
      localizedInput,
      contract
    );

    if (!isObject(result.response?.navigation)) {
      throw new Error(
        'The Navigation API returned no Reality Navigation.'
      );
    }

    setSession(NAVIGATION_INPUT_KEY, result.localizedInput);
    setSession(NAVIGATION_RESPONSE_KEY, result.response);
    setSession(NAVIGATION_REQUEST_KEY, {
      status: 'completed',
      fingerprint,
      completedAt: new Date().toISOString(),
      automaticRetry: false
    });
    hide(qs('#navigationLoadingState'));
    show(qs('#navigationSections'));

    return {
      success: true,
      source: 'runtime_api',
      navigationInput: result.localizedInput,
      response: result.response
    };
  } catch (error) {
    setSession(NAVIGATION_REQUEST_KEY, {
      status: 'failed',
      fingerprint,
      failedAt: new Date().toISOString(),
      automaticRetry: false
    });
    showNavigationError(error);

    return {
      success: false,
      reason: 'navigation_request_failed',
      navigationInput: localizedInput,
      error
    };
  }
}

export function bindNavigationRetry(handler) {
  document.addEventListener('click', event => {
    const button = event.target?.closest?.('#retryNavigation');

    if (!button) return;

    event.preventDefault();
    handler?.();
  });
}

export function getNavigationLoaderStatus() {
  return {
    module: 'PHI OS Reality Navigation Loader',
    inputFound: Boolean(readStoredNavigationInput()),
    cachedResponseFound: Boolean(readStoredNavigationResponse()),
    endpoint: API_ENDPOINT,
    defaultProvider: 'rule_engine',
    sessionCacheEnabled: true,
    languageContractForwarded: true,
    requestRecoveryEnabled: true,
    automaticRetry: false
  };
}
