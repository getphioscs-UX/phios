/*
 * PHI OS Reality Reading Controller
 * File: assets/js/reading.js
 * Version: 1.1.0
 *
 * Coordinates the Reading loader, renderer, sidebar,
 * navigation bridge, and interface language runtime.
 */

import {
  loadRealityReading,
  bindReadingRetry,
  getReadingLoaderStatus
} from './modules/reading-loader.js';

import {
  renderRealityReading,
  getReadingRendererStatus
} from './modules/reading-render.js';

import {
  initializeReadingSidebar,
  destroyReadingSidebar
} from './modules/reading-sidebar.js';

import {
  bindContinueToNavigation
} from './modules/reading-navigation.js';

import { initializeRuntimeWorkspace } from './modules/runtime-workspace.js';
import { initializeReadingRevision } from './modules/runtime-revision-initializer.js';

import {
  getLanguage,
  getLocale,
  initializeI18n,
  onLocaleChange,
  t
} from './i18n.js';


/* =========================================================
   PAGE STATE
========================================================= */

const state = {
  initialized: false,
  loading: false,
  response: null,
  readingInput: null,
  error: null,
  sidebarInitialized: false,
  navigationBinding: null,
  removeLocaleListener: null
};


/* =========================================================
   READING OPTIONS
========================================================= */

function readingOptions() {
  const parameters =
    new URLSearchParams(
      location.search
    );

  return {
    deepReading:
      parameters.get('deep') === '1',

    provider:
      parameters.get('provider') ||
      'auto',

    locale:
      getLocale(),

    outputLanguage:
      getLanguage(),

    loadingTitle:
      t('reading.loading'),

    loadingMessage:
      t('reading.subtitle')
  };
}


/* =========================================================
   RENDER FLOW
========================================================= */

function renderCurrentReading() {
  if (!state.response) {
    return {
      rendered: false,
      reason:
        'reading_response_missing'
    };
  }

  const rendered =
    renderRealityReading(
      state.response
    );

  if (!state.sidebarInitialized) {
    initializeReadingSidebar();

    state.sidebarInitialized = true;
  }

  if (!state.navigationBinding) {
    state.navigationBinding =
      bindContinueToNavigation(
        () => state.response
      );
  } else {
    state.navigationBinding
      ?.refresh?.();
  }

  return rendered;
}


/* =========================================================
   READING RUNNER
========================================================= */

export async function runRealityReading({
  forceRefresh = false
} = {}) {
  if (state.loading) {
    return {
      success: false,
      reason:
        'reading_already_loading'
    };
  }

  state.loading = true;
  state.error = null;

  document.body.classList.add(
    'is-reading'
  );

  try {
    const result =
      await loadRealityReading(
        {
          ...readingOptions(),
          forceRefresh
        }
      );

    if (!result.success) {
      state.error =
        result.error ||
        result.reason ||
        null;

      return result;
    }

    state.response =
      result.response;

    state.readingInput =
      result.readingInput;

    const rendered =
      renderCurrentReading();

    document.body.dataset
      .readingInitialized =
      'true';

    return {
      ...result,
      rendered
    };

  } catch (error) {
    state.error = error;

    throw error;

  } finally {
    state.loading = false;

    document.body.classList.remove(
      'is-reading'
    );
  }
}


/* =========================================================
   LANGUAGE UPDATES
========================================================= */

function bindReadingLanguageUpdates() {
  state.removeLocaleListener =
    onLocaleChange(async () => {
      /*
       * Static labels are updated by i18n.js, but the Reading also contains
       * server-generated prose. Re-run the Reading so that prose follows the
       * newly selected language instead of re-rendering the old response.
       */
      await runRealityReading({
        forceRefresh: true
      });
    });
}


/* =========================================================
   CLEANUP
========================================================= */

function destroyRealityReadingPage() {
  if (state.sidebarInitialized) {
    destroyReadingSidebar();
  }

  state.removeLocaleListener?.();
  state.removeLocaleListener = null;
}


/* =========================================================
   INITIALIZATION
========================================================= */

export async function initializeRealityReadingPage() {
  initializeReadingRevision();
  if (state.initialized) {
    return {
      initialized: true,
      repeated: true
    };
  }

  state.initialized = true;

  initializeI18n();
  initializeRuntimeWorkspace({ currentStage: 'reading' });
  bindReadingLanguageUpdates();

  bindReadingRetry(() => runRealityReading({
    forceRefresh: true
  }));

  window.addEventListener(
    'beforeunload',
    destroyRealityReadingPage,
    {
      once: true
    }
  );

  const result =
    await runRealityReading();

  return {
    initialized: true,
    repeated: false,
    result
  };
}


/* =========================================================
   DEVELOPMENT STATUS
========================================================= */

export function getRealityReadingStatus() {
  return {
    state: {
      initialized:
        state.initialized,

      loading:
        state.loading,

      responseAvailable:
        Boolean(state.response),

      readingInputAvailable:
        Boolean(state.readingInput),

      sidebarInitialized:
        state.sidebarInitialized,

      navigationBound:
        Boolean(
          state.navigationBinding
            ?.bound
        ),

      locale:
        getLocale(),

      outputLanguage:
        getLanguage(),

      error:
        state.error
          ?.message ||
        state.error ||
        null
    },

    loader:
      getReadingLoaderStatus(),

    renderer:
      getReadingRendererStatus()
  };
}


/* =========================================================
   BOOT
========================================================= */

function boot() {
  initializeRealityReadingPage()
    .catch(error => {
      console.error(
        'PHI OS Reality Reading initialization failed:',
        error
      );
    });
}


if (
  document.readyState ===
  'loading'
) {
  document.addEventListener(
    'DOMContentLoaded',
    boot,
    {
      once: true
    }
  );
} else {
  boot();
}
