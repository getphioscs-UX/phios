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
  onLocaleChange,
  t
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
  renderNavigationVisualAlignment
} from './modules/navigation-visual-alignment.js';

import { bindNavigationPathSelection } from './modules/navigation-path-selection.js';
import {
  bindNavigationExecution,
  renderNavigationExecution
} from './modules/navigation-execution-render.js';
import { restoreNavigationState } from './modules/navigation-state.js';
import { initializeRuntimeWorkspace } from './modules/runtime-workspace.js';

const refreshNavigationAlignment = renderNavigationVisualAlignment;

const state = {
  input: null,
  response: null,
  loading: false,
  initialized: false,
  removeLocaleListener: null,
  removePathSelectionListener: null,
  removeExecutionListener: null
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
      state.response = restoreNavigationState(result.response, state.response || result.response);
      renderRealityNavigation(state.response);
      renderNavigationVisualAlignment(state.response);
      renderNavigationExecution(state.response);
      let staleNotice = document.querySelector(
        '[data-reconstruction-stale-notice]'
      );
      if (
        state.response?.status === 'stale' ||
        state.response?.staleness?.status === 'stale'
      ) {
        if (!staleNotice) {
          staleNotice = document.createElement('aside');
          staleNotice.dataset.reconstructionStaleNotice = 'true';
          staleNotice.className = 'runtime-stale-notice';
          staleNotice.setAttribute('role', 'status');
          document.querySelector('main')?.prepend(staleNotice);
        }
        staleNotice.innerHTML = `
          <strong>${t('navigation.reconstructionStaleTitle')}</strong>
          <p>${t('navigation.reconstructionStaleDetail')}</p>
        `;
      } else {
        staleNotice?.remove();
      }
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
  state.removeExecutionListener?.();
  state.removeLocaleListener = null;
  state.removePathSelectionListener = null;
  state.removeExecutionListener = null;
}

async function initializeNavigationPage() {
  if (state.initialized) return;

  state.initialized = true;

  initializeI18n();
  bindLocaleControls();
  initializeRuntimeWorkspace({ currentStage: 'navigation' });
  bindLanguageUpdates();
  state.removePathSelectionListener = bindNavigationPathSelection({
    getResponse: () => state.response,
    onSelectionChange: updatedResponse => {
      state.response = updatedResponse;
      renderRealityNavigation(updatedResponse);
      refreshNavigationAlignment(updatedResponse);
      renderNavigationExecution(updatedResponse);
    }
  });
  state.removeExecutionListener = bindNavigationExecution({
    getResponse: () => state.response,
    onChange: updatedResponse => {
      state.response = updatedResponse;
      renderRealityNavigation(updatedResponse);
      renderNavigationVisualAlignment(updatedResponse);
      renderNavigationExecution(updatedResponse);
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
