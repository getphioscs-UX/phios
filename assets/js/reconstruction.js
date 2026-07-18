/*
 * PHI OS Reality Reconstruction Controller
 * File: assets/js/reconstruction.js
 * Version: 1.1.0
 *
 * This is the single page entry point for:
 *   reality-reconstruction.html
 *
 * It orchestrates:
 *   - reconstruction-loader.js
 *   - reconstruction-render.js
 *   - reconstruction-sidebar.js
 *   - reconstruction-inspector.js
 *   - reconstruction-reading.js
 *
 * This controller does not contain PHI OS reconstruction logic.
 * It coordinates the modules and keeps page state consistent.
 */

import {
  loadRuntimeReconstruction,
  bindReconstructionRetry,
  getReconstructionLoaderStatus
} from './modules/reconstruction-loader.js';

import {
  renderReconstructionResult,
  getReconstructionRendererStatus
} from './modules/reconstruction-render.js';

import {
  initializeReconstructionSidebar,
  refreshReconstructionSidebar,
  destroyReconstructionSidebar,
  getReconstructionSidebarStatus
} from './modules/reconstruction-sidebar.js';

import {
  renderReconstructionInspector,
  createReconstructionDiagnostics,
  getReconstructionInspectorStatus
} from './modules/reconstruction-inspector.js';

import {
  bindContinueToReading,
  updateContinueToReadingButton,
  getReconstructionReadingStatus
} from './modules/reconstruction-reading.js';

import {
  initializeReconstructionDialogue,
  renderReconstructionDialogue,
  getReconstructionDialogueStatus
} from './modules/reconstruction-dialogue.js';

import {
  qs,
  cleanText,
  escapeHTML
} from './shared.js';

import {
  initializeI18n,
  onLocaleChange,
  t
} from './i18n.js';


/* =========================================================
   PAGE STATE
========================================================= */

const pageState = {
  initialized: false,
  loading: false,
  result: null,
  runtimeEntry: null,
  conversation: [],
  sidebarInitialized: false,
  readingBound: false,
  lastError: null,
  lastLoadedAt: null
};


/* =========================================================
   DOM HELPERS
========================================================= */

function showControllerError(
  error,
  options = {}
) {
  const loadingState =
    qs('#loadingState');

  const message =
    cleanText(
      error?.message ||
      error
    ) ||
    t('reconstruction.noReconstruction');

  if (loadingState) {
    loadingState.innerHTML = `
      <div class="loader-error-state">
        <strong>
          ${escapeHTML(
            options.title ||
            t('errors.generic')
          )}
        </strong>

        <p class="error">
          ${escapeHTML(message)}
        </p>

        ${
          options.allowRetry !== false
            ? `
              <button
                class="btn"
                id="retryReconstruction"
                type="button"
              >
                ${escapeHTML(
                  t('common.retry')
                )}
              </button>
            `
            : ''
        }
      </div>
    `;

    loadingState.classList.remove(
      'hidden'
    );
  }

  pageState.lastError =
    message;

  document.dispatchEvent(
    new CustomEvent(
      'phiOS:reconstructionControllerError',
      {
        detail: {
          message,
          error
        }
      }
    )
  );
}


/* =========================================================
   MAIN RENDER FLOW
========================================================= */

function renderLoadedReconstruction(
  loadResult
) {
  if (
    !loadResult?.success ||
    !loadResult?.result
  ) {
    return {
      rendered: false,
      reason:
        loadResult?.reason ||
        'load_failed'
    };
  }

  const result =
    loadResult.result;

  pageState.result =
    result;

  pageState.runtimeEntry =
    result.runtimeEntry ||
    loadResult.runtimeEntry ||
    null;

  pageState.conversation =
    loadResult.conversation ||
    [];

  pageState.lastLoadedAt =
    new Date().toISOString();

  const rendered =
    renderReconstructionResult(
      result
    );

  const inspector =
    renderReconstructionInspector(
      result
    );

  const readingState =
    updateContinueToReadingButton(
      result
    );

  renderReconstructionDialogue(result);

  if (!pageState.sidebarInitialized) {
    initializeReconstructionSidebar({
      restoreBehavior: 'auto'
    });

    pageState.sidebarInitialized =
      true;
  } else {
    refreshReconstructionSidebar();
  }

  if (!pageState.readingBound) {
    bindContinueToReading(
      () => pageState.result,
      {
        readingPage:
          '/reality-reading.html',

        readingMode:
          'initial_integrated_reading',

        provider:
          'auto',

        workersAIPreferred:
          true,

        openAIAllowed:
          true,

        enableInterpretiveReaders:
          false
      }
    );

    pageState.readingBound =
      true;
  }

  document.dispatchEvent(
    new CustomEvent(
      'phiOS:reconstructionRendered',
      {
        detail: {
          runtimeEntityId:
            result.runtimeEntityId ||
            pageState
              .runtimeEntry
              ?.runtimeEntityId ||
            '',

          runtimeEntryId:
            result.runtimeEntryId ||
            pageState
              .runtimeEntry
              ?.runtimeEntryId ||
            '',

          rendered,
          inspector,
          readingState
        }
      }
    )
  );

  return {
    rendered: true,
    renderedResult: rendered,
    inspectorResult: inspector,
    readingState
  };
}


/* =========================================================
   RECONSTRUCTION RUNNER
========================================================= */

export async function runRealityReconstruction(
  options = {}
) {
  if (pageState.loading) {
    return {
      success: false,
      reason:
        'reconstruction_already_loading'
    };
  }

  pageState.loading = true;
  pageState.lastError = null;

  document.body.classList.add(
    'is-reconstructing'
  );

  try {
    const loadResult =
      await loadRuntimeReconstruction({
        loadingTitle:
          options.loadingTitle ||
          t('reconstruction.loading'),

        loadingMessage:
          options.loadingMessage ||
          t('reconstruction.subtitle')
      });

    if (!loadResult.success) {
      return loadResult;
    }

    const renderResult =
      renderLoadedReconstruction(
        loadResult
      );

    return {
      ...loadResult,
      renderResult
    };

  } catch (error) {
    showControllerError(
      error,
      {
        allowRetry: true
      }
    );

    return {
      success: false,
      reason:
        'controller_failure',
      error
    };

  } finally {
    pageState.loading = false;

    document.body.classList.remove(
      'is-reconstructing'
    );
  }
}


/* =========================================================
   RETRY
========================================================= */

function initializeRetryBinding() {
  bindReconstructionRetry(
    async () => {
      await runRealityReconstruction({
        loadingTitle:
          t('reconstruction.loading'),

        loadingMessage:
          t('reconstruction.subtitle')
      });
    }
  );
}


/* =========================================================
   PAGE EVENTS
========================================================= */

function bindControllerEvents() {
  document.addEventListener(
    'phiOS:reconstructionStageChanged',
    event => {
      const stageId =
        cleanText(
          event?.detail?.stageId
        );

      if (!stageId) {
        return;
      }

      document.body.dataset
        .reconstructionStage =
        stageId;
    }
  );

  document.addEventListener(
    'phiOS:readingInputCreated',
    event => {
      const detail =
        event?.detail || {};

      document.body.dataset
        .readingInputReady =
        'true';

      document.body.dataset
        .readingRuntimeEntity =
        cleanText(
          detail.runtimeEntityId
        );
    }
  );

  document.addEventListener(
    'phiOS:readingNavigationError',
    event => {
      showControllerError(
        event?.detail?.error ||
        t('reading.generationFailed'),
        {
          title:
            t('reading.noReading'),
          allowRetry: false
        }
      );
    }
  );

  window.addEventListener(
    'beforeunload',
    () => {
      if (
        pageState.sidebarInitialized
      ) {
        destroyReconstructionSidebar();
      }
    }
  );
}


/* =========================================================
   DEVELOPMENT DIAGNOSTICS
========================================================= */

export function getRealityReconstructionStatus() {
  return {
    controller: {
      module:
        'PHI OS Reality Reconstruction Controller',

      version:
        '1.1.0',

      initialized:
        pageState.initialized,

      loading:
        pageState.loading,

      resultAvailable:
        Boolean(pageState.result),

      runtimeEntryAvailable:
        Boolean(
          pageState.runtimeEntry
        ),

      conversationMessageCount:
        pageState.conversation.length,

      sidebarInitialized:
        pageState.sidebarInitialized,

      readingBound:
        pageState.readingBound,

      lastError:
        pageState.lastError,

      lastLoadedAt:
        pageState.lastLoadedAt
    },

    loader:
      getReconstructionLoaderStatus(),

    renderer:
      getReconstructionRendererStatus(),

    sidebar:
      getReconstructionSidebarStatus(),

    inspector:
      getReconstructionInspectorStatus(),

    readingBridge:
      getReconstructionReadingStatus(),

    dialogue:
      getReconstructionDialogueStatus(),

    diagnostics:
      pageState.result
        ? createReconstructionDiagnostics(
            pageState.result
          )
        : null
  };
}


/* =========================================================
   GLOBAL DEBUG ACCESS
========================================================= */

function exposeDebugInterface() {
  const isLocal =
    location.hostname ===
      'localhost' ||
    location.hostname ===
      '127.0.0.1';

  const debugRequested =
    new URLSearchParams(
      location.search
    ).get('debug') === '1';

  if (
    !isLocal &&
    !debugRequested
  ) {
    return;
  }

  window.PHI_OS_RECONSTRUCTION = {
    getStatus:
      getRealityReconstructionStatus,

    rerun:
      runRealityReconstruction,

    getResult:
      () => pageState.result,

    getRuntimeEntry:
      () => pageState.runtimeEntry
  };
}


/* =========================================================
   INITIALIZATION
========================================================= */

export async function initializeRealityReconstructionPage() {
  if (pageState.initialized) {
    return {
      initialized: true,
      repeated: true
    };
  }

  pageState.initialized = true;

  initializeI18n();

  onLocaleChange(async () => {
    /*
     * Reconstruction contains server-generated Runtime copy in addition to
     * static interface labels. Re-run it with the current language contract
     * instead of rendering the response produced for the previous locale.
     */
    await runRealityReconstruction();
  });

  initializeRetryBinding();
  bindControllerEvents();
  exposeDebugInterface();

  initializeReconstructionDialogue({
    getRuntimeEntry:
      () => pageState.runtimeEntry,
    getConversation:
      () => pageState.conversation,
    onResult:
      result => renderLoadedReconstruction({
        success: true,
        result,
        runtimeEntry: result.runtimeEntry,
        conversation: pageState.conversation
      })
  });

  const result =
    await runRealityReconstruction();

  document.body.dataset
    .reconstructionInitialized =
    'true';

  return {
    initialized: true,
    repeated: false,
    result
  };
}


/* =========================================================
   BOOT
========================================================= */

function boot() {
  initializeRealityReconstructionPage()
    .catch(error => {
      showControllerError(
        error,
        {
          allowRetry: true
        }
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
