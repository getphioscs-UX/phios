/*
 * PHI OS Reality Reconstruction Sidebar
 * File: assets/js/modules/reconstruction-sidebar.js
 * Version: 1.0.0
 *
 * Responsibilities
 * ----------------
 * - Bind the left-side Runtime Chain.
 * - Scroll to the selected Reconstruction section.
 * - Highlight the current visible stage.
 * - Preserve the current stage in the URL hash.
 * - Restore the selected stage after refresh or browser navigation.
 *
 * This module does not:
 * - Load Runtime data.
 * - Call APIs.
 * - Render Reconstruction content.
 */

import {
  qs,
  cleanText
} from '../shared.js';


/* =========================================================
   STAGE REGISTRY
========================================================= */

export const RECONSTRUCTION_STAGES = Object.freeze([
  {
    id: 'entry',
    label: 'Reality Entry',
    sectionId: 'entrySection'
  },
  {
    id: 'formation',
    label: 'Formation Grammar',
    sectionId: 'formationSection'
  },
  {
    id: 'carrier',
    label: 'Carrier Entry',
    sectionId: 'carrierSection'
  },
  {
    id: 'conscious',
    label: 'Conscious Runtime',
    sectionId: 'consciousSection'
  },
  {
    id: 'evidence',
    label: 'Evidence Structure',
    sectionId: 'evidenceSection'
  },
  {
    id: 'direction',
    label: 'Reading Readiness',
    sectionId: 'directionSection'
  }
]);


const STAGE_IDS = new Set(
  RECONSTRUCTION_STAGES.map(
    stage => stage.id
  )
);


/* =========================================================
   INTERNAL STATE
========================================================= */

let observer = null;

let activeStageId = 'entry';

let isProgrammaticScroll = false;

let programmaticScrollTimer = null;


/* =========================================================
   DOM HELPERS
========================================================= */

function getStageLink(stageId) {
  return document.querySelector(
    `[data-stage-link="${stageId}"]`
  );
}


function getStageSection(stageId) {
  const stage =
    RECONSTRUCTION_STAGES.find(
      item => item.id === stageId
    );

  if (!stage) {
    return null;
  }

  return document.getElementById(
    stage.sectionId
  );
}


function getAllStageLinks() {
  return Array.from(
    document.querySelectorAll(
      '[data-stage-link]'
    )
  );
}


function getAllStageSections() {
  return RECONSTRUCTION_STAGES
    .map(stage => ({
      stage,
      element:
        document.getElementById(
          stage.sectionId
        )
    }))
    .filter(
      item => Boolean(item.element)
    );
}


/* =========================================================
   URL HASH
========================================================= */

function getStageFromHash() {
  const rawHash =
    cleanText(
      window.location.hash
        .replace(/^#/, '')
    );

  return STAGE_IDS.has(rawHash)
    ? rawHash
    : '';
}


function updateHash(
  stageId,
  mode = 'replace'
) {
  if (!STAGE_IDS.has(stageId)) {
    return;
  }

  const nextUrl =
    `${window.location.pathname}${window.location.search}#${stageId}`;

  const state = {
    ...(history.state || {}),
    reconstructionStage:
      stageId
  };

  if (mode === 'push') {
    history.pushState(
      state,
      '',
      nextUrl
    );

    return;
  }

  history.replaceState(
    state,
    '',
    nextUrl
  );
}


/* =========================================================
   ACTIVE STATE
========================================================= */

export function setActiveReconstructionStage(
  stageId,
  options = {}
) {
  if (!STAGE_IDS.has(stageId)) {
    return false;
  }

  activeStageId = stageId;

  getAllStageLinks()
    .forEach(link => {
      const isActive =
        link.dataset.stageLink ===
        stageId;

      link.classList.toggle(
        'is-active',
        isActive
      );

      link.setAttribute(
        'aria-current',
        isActive
          ? 'step'
          : 'false'
      );
    });

  if (
    options.updateHash !== false
  ) {
    updateHash(
      stageId,
      options.hashMode || 'replace'
    );
  }

  document.dispatchEvent(
    new CustomEvent(
      'phiOS:reconstructionStageChanged',
      {
        detail: {
          stageId,
          source:
            options.source ||
            'sidebar'
        }
      }
    )
  );

  return true;
}


export function getActiveReconstructionStage() {
  return activeStageId;
}


/* =========================================================
   SCROLLING
========================================================= */

function getScrollOffset() {
  const header =
    qs('.reconstruction-header') ||
    qs('.site-header');

  const headerHeight =
    header
      ? header.getBoundingClientRect().height
      : 0;

  return Math.max(
    90,
    Math.round(
      headerHeight + 18
    )
  );
}


export function scrollToReconstructionStage(
  stageId,
  options = {}
) {
  if (!STAGE_IDS.has(stageId)) {
    return false;
  }

  const section =
    getStageSection(stageId);

  if (!section) {
    return false;
  }

  const offset =
    getScrollOffset();

  const top =
    window.scrollY +
    section
      .getBoundingClientRect()
      .top -
    offset;

  isProgrammaticScroll = true;

  window.scrollTo({
    top:
      Math.max(0, top),

    behavior:
      options.behavior ||
      'smooth'
  });

  setActiveReconstructionStage(
    stageId,
    {
      updateHash:
        options.updateHash !== false,

      hashMode:
        options.hashMode ||
        'push',

      source:
        options.source ||
        'sidebar_click'
    }
  );

  if (programmaticScrollTimer) {
    clearTimeout(
      programmaticScrollTimer
    );
  }

  programmaticScrollTimer =
    window.setTimeout(
      () => {
        isProgrammaticScroll = false;
      },
      options.behavior === 'auto'
        ? 100
        : 700
    );

  return true;
}


/* =========================================================
   LINK BINDING
========================================================= */

function bindStageLinks() {
  getAllStageLinks()
    .forEach(link => {
      const stageId =
        cleanText(
          link.dataset.stageLink
        );

      if (!STAGE_IDS.has(stageId)) {
        return;
      }

      link.setAttribute(
        'role',
        link.getAttribute('role') ||
        'button'
      );

      link.setAttribute(
        'tabindex',
        link.getAttribute('tabindex') ||
        '0'
      );

      link.addEventListener(
        'click',
        event => {
          event.preventDefault();

          scrollToReconstructionStage(
            stageId,
            {
              behavior: 'smooth',
              hashMode: 'push',
              source:
                'sidebar_click'
            }
          );
        }
      );

      link.addEventListener(
        'keydown',
        event => {
          if (
            event.key !== 'Enter' &&
            event.key !== ' '
          ) {
            return;
          }

          event.preventDefault();

          scrollToReconstructionStage(
            stageId,
            {
              behavior: 'smooth',
              hashMode: 'push',
              source:
                'sidebar_keyboard'
            }
          );
        }
      );
    });
}


/* =========================================================
   INTERSECTION OBSERVER
========================================================= */

function createStageObserver() {
  if (
    typeof IntersectionObserver !==
    'function'
  ) {
    return null;
  }

  const offset =
    getScrollOffset();

  return new IntersectionObserver(
    entries => {
      if (isProgrammaticScroll) {
        return;
      }

      const visible =
        entries
          .filter(
            entry =>
              entry.isIntersecting
          )
          .sort(
            (a, b) =>
              b.intersectionRatio -
              a.intersectionRatio
          );

      if (visible.length === 0) {
        return;
      }

      const sectionId =
        visible[0]
          .target
          .id;

      const stage =
        RECONSTRUCTION_STAGES.find(
          item =>
            item.sectionId ===
            sectionId
        );

      if (!stage) {
        return;
      }

      setActiveReconstructionStage(
        stage.id,
        {
          updateHash: true,
          hashMode: 'replace',
          source:
            'intersection_observer'
        }
      );
    },
    {
      root: null,

      rootMargin:
        `-${offset}px 0px -58% 0px`,

      threshold: [
        0.08,
        0.2,
        0.4,
        0.65
      ]
    }
  );
}


function observeSections() {
  if (observer) {
    observer.disconnect();
  }

  observer =
    createStageObserver();

  if (!observer) {
    bindScrollFallback();
    return;
  }

  getAllStageSections()
    .forEach(item => {
      observer.observe(
        item.element
      );
    });
}


/* =========================================================
   FALLBACK SCROLL DETECTION
========================================================= */

let fallbackBound = false;

function detectStageByScroll() {
  if (isProgrammaticScroll) {
    return;
  }

  const offset =
    getScrollOffset();

  const candidates =
    getAllStageSections()
      .map(item => ({
        stageId:
          item.stage.id,

        distance:
          Math.abs(
            item.element
              .getBoundingClientRect()
              .top -
            offset
          ),

        top:
          item.element
            .getBoundingClientRect()
            .top
      }))
      .filter(
        item =>
          item.top <
          window.innerHeight * 0.8
      )
      .sort(
        (a, b) =>
          a.distance -
          b.distance
      );

  const candidate =
    candidates[0];

  if (!candidate) {
    return;
  }

  setActiveReconstructionStage(
    candidate.stageId,
    {
      updateHash: true,
      hashMode: 'replace',
      source:
        'scroll_fallback'
    }
  );
}


function bindScrollFallback() {
  if (fallbackBound) {
    return;
  }

  fallbackBound = true;

  let scheduled = false;

  window.addEventListener(
    'scroll',
    () => {
      if (scheduled) {
        return;
      }

      scheduled = true;

      window.requestAnimationFrame(
        () => {
          detectStageByScroll();
          scheduled = false;
        }
      );
    },
    {
      passive: true
    }
  );
}


/* =========================================================
   BROWSER HISTORY
========================================================= */

function bindHistoryNavigation() {
  window.addEventListener(
    'popstate',
    () => {
      const stageId =
        getStageFromHash() ||
        history
          ?.state
          ?.reconstructionStage ||
        'entry';

      scrollToReconstructionStage(
        stageId,
        {
          behavior: 'auto',
          updateHash: false,
          source:
            'browser_history'
        }
      );
    }
  );

  window.addEventListener(
    'hashchange',
    () => {
      const stageId =
        getStageFromHash();

      if (!stageId) {
        return;
      }

      scrollToReconstructionStage(
        stageId,
        {
          behavior: 'auto',
          updateHash: false,
          source:
            'hash_change'
        }
      );
    }
  );
}


/* =========================================================
   RESTORE INITIAL STAGE
========================================================= */

export function restoreReconstructionStage(
  options = {}
) {
  const requestedStage =
    cleanText(
      options.stageId
    );

  const stageFromHash =
    getStageFromHash();

  const historyStage =
    cleanText(
      history
        ?.state
        ?.reconstructionStage
    );

  const stageId =
    (
      STAGE_IDS.has(requestedStage)
        ? requestedStage
        : ''
    ) ||
    stageFromHash ||
    (
      STAGE_IDS.has(historyStage)
        ? historyStage
        : ''
    ) ||
    'entry';

  window.requestAnimationFrame(
    () => {
      scrollToReconstructionStage(
        stageId,
        {
          behavior:
            options.behavior ||
            'auto',

          hashMode:
            'replace',

          source:
            'initial_restore'
        }
      );
    }
  );

  return stageId;
}


/* =========================================================
   PUBLIC INITIALIZATION
========================================================= */

export function initializeReconstructionSidebar(
  options = {}
) {
  bindStageLinks();
  bindHistoryNavigation();
  observeSections();

  const restoredStage =
    restoreReconstructionStage({
      stageId:
        options.stageId,

      behavior:
        options.restoreBehavior ||
        'auto'
    });

  return {
    initialized: true,
    activeStage:
      restoredStage,

    stageCount:
      RECONSTRUCTION_STAGES.length,

    observerEnabled:
      Boolean(observer)
  };
}


/* =========================================================
   REFRESH OBSERVER
========================================================= */

export function refreshReconstructionSidebar() {
  observeSections();

  const stageId =
    getStageFromHash() ||
    activeStageId ||
    'entry';

  setActiveReconstructionStage(
    stageId,
    {
      updateHash: false,
      source:
        'sidebar_refresh'
    }
  );

  return {
    refreshed: true,
    activeStage: stageId
  };
}


/* =========================================================
   CLEANUP
========================================================= */

export function destroyReconstructionSidebar() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (programmaticScrollTimer) {
    clearTimeout(
      programmaticScrollTimer
    );

    programmaticScrollTimer =
      null;
  }

  return {
    destroyed: true
  };
}


/* =========================================================
   STATUS
========================================================= */

export function getReconstructionSidebarStatus() {
  return {
    module:
      'PHI OS Reality Reconstruction Sidebar',

    version:
      '1.0.0',

    activeStage:
      activeStageId,

    stages:
      RECONSTRUCTION_STAGES.map(
        stage => ({
          id: stage.id,
          label: stage.label,
          sectionId:
            stage.sectionId
        })
      ),

    observerEnabled:
      Boolean(observer)
  };
}
