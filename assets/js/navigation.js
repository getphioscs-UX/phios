/**
 * PHI OS Reality Navigation Workspace Controller.
 *
 * Coordinates i18n, loading, rendering, retry, and language refresh. Data
 * loading and DOM rendering remain isolated in their respective modules.
 */

import {
  initializeI18n,
  bindLocaleControls,
  getLocale,
  getLanguage,
  onLocaleChange
} from './i18n.js';

import {
  loadRealityNavigation,
  bindNavigationRetry,
  showNavigationError
} from './modules/navigation-loader.js';

import {
  renderRealityNavigation
} from './modules/navigation-render.js';

import {
  bindNavigationPathSelection,
  preserveNavigationPathSelection
} from './modules/navigation-path-selection.js';

const state = {
  input: null,
  response: null,
  loading: false,
  initialized: false,
  removeLocaleListener: null,
  removePathSelectionListener: null
};

async function runNavigation({
  forceRefresh = false
} = {}) {
  if (state.loading) return;

  state.loading = true;

  try {
    const result = await loadRealityNavigation({
      locale: getLocale(),
      outputLanguage: getLanguage(),
      forceRefresh
    });

    state.input = result.navigationInput || null;

    if (result.success) {
      state.response = preserveNavigationPathSelection(
        result.response,
        state.response
      );
      renderRealityNavigation(state.response);
    }
  } finally {
    state.loading = false;
  }
}

function bindLanguageUpdates() {
  state.removeLocaleListener = onLocaleChange(async () => {
    /*
     * Interface labels are translated locally. The Navigation API is called
     * again because bounded path copy is generated in the output language.
     */
    await runNavigation({
      forceRefresh: true
    });
  });
}

function destroyNavigationPage() {
  state.removeLocaleListener?.();
  state.removePathSelectionListener?.();
  state.removeLocaleListener = null;
  state.removePathSelectionListener = null;
}

async function initializeNavigationPage() {
  if (state.initialized) return;

  state.initialized = true;

  initializeI18n();
  bindLocaleControls();
  bindLanguageUpdates();
  state.removePathSelectionListener = bindNavigationPathSelection({
    getResponse: () => state.response,
    onSelectionChange: updatedResponse => {
      state.response = updatedResponse;
      renderRealityNavigation(updatedResponse);
    }
  });
  bindNavigationRetry(() => {
    runNavigation({
      forceRefresh: true
    });
  });

  window.addEventListener(
    'beforeunload',
    destroyNavigationPage,
    { once: true }
  );

  await runNavigation();
}

function boot() {
  initializeNavigationPage().catch(error => {
    console.error(
      'PHI OS Reality Navigation initialization failed:',
      error
    );

    showNavigationError(error);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    boot,
    { once: true }
  );
} else {
  boot();
}
