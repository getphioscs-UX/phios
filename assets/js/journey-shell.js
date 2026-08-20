import { resolvePublicAssetForWeb } from './runtime/web-production/asset-resolver.js';

import {
  initializeI18n,
  isI18nInitialized,
  onLocaleChange,
  t
} from './i18n.js';

const STAGES = Object.freeze([
  'enter',
  'describe',
  'discover',
  'understand',
  'choose',
  'continue'
]);

const PAGE_CONTRACTS = Object.freeze({
  '/reality-journey': {
    stage: 'enter',
    back: '/',
    modify: '#journey-main',
    primary: 'a[href="/reality-entry"]'
  },
  '/reality-entry': {
    stage: 'describe',
    back: '/reality-journey',
    modify: '#entryWorkspace',
    primary: '#continueButton'
  },
  '/reality-reconstruction': {
    stage: 'discover',
    back: '/reality-entry?mode=revise',
    modify: '/reality-entry?mode=revise',
    primary: '#continueToReading'
  },
  '/reality-reading': {
    stage: 'understand',
    back: '/reality-reconstruction',
    modify: '/reality-reconstruction',
    primary: '#continueToNavigation'
  },
  '/reality-navigation': {
    stage: 'choose',
    back: '/reality-reading',
    modify: '/reality-reading',
    primary: '#navigationPath'
  },
  '/reality-review': {
    stage: 'continue',
    back: '/reality-navigation',
    modify: '/reality-navigation',
    primary: '#saveReview'
  },
  '/my-reality': {
    stage: 'continue',
    back: '/reality-review',
    modify: '#memory',
    primary: '#confirmContinuity'
  }
});

function normalizedPath() {
  const value = window.location.pathname.replace(/\.html$/, '');
  return value || '/';
}

function actionMarkup(contract) {
  return `
    <a class="pds-journey-shell__action" href="${contract.back}" data-journey-action="back"></a>
    <a class="pds-journey-shell__action" href="${contract.modify}" data-journey-action="modify"></a>
    <a class="pds-journey-shell__action" href="/reality-dashboard" data-journey-action="pause"></a>
    <button class="pds-journey-shell__action pds-journey-shell__action--primary" type="button" data-journey-action="primary"></button>
  `;
}

function shellMarkup(contract) {
  const currentIndex = STAGES.indexOf(contract.stage);
  const progress = STAGES.map((stage, index) => `
    <li
      class="${index < currentIndex ? 'is-complete' : ''}"
      ${stage === contract.stage ? 'aria-current="step"' : ''}
      data-journey-stage="${stage}"
    ></li>
  `).join('');

  return `
    <section class="pds-journey-shell" data-journey-state="ready" data-customer-view="true">
      <div class="pds-journey-shell__inner">
        <div class="pds-journey-shell__header">
          <div>
            <p class="pds-journey-shell__eyebrow"></p>
            <p class="pds-journey-shell__status" role="status" aria-live="polite"></p>
          </div>
        </div>
        <ol class="pds-journey-shell__progress" aria-label=""></ol>
        <div class="pds-journey-shell__actions">
          <div class="pds-journey-shell__action-list">${actionMarkup(contract)}</div>
          <p class="pds-journey-shell__handoff"></p>
        </div>
      </div>
    </section>
  `.replace('<ol class="pds-journey-shell__progress" aria-label=""></ol>', `<ol class="pds-journey-shell__progress" aria-label="">${progress}</ol>`);
}

function visible(selector) {
  const element = document.querySelector(selector);
  return Boolean(element && !element.hidden && !element.classList.contains('hidden'));
}

function stateFor(contract) {
  if (visible('[role="alert"]') || visible('.error')) return 'error';
  if ([
    '#emptyState',
    '#readingEmptyState',
    '#navigationEmptyState',
    '#reviewEmpty',
    '#memoryEmpty'
  ].some(visible)) return 'empty';
  if ([
    '#loadingState',
    '#readingLoadingState',
    '#navigationLoadingState',
    '#loadingText'
  ].some(visible)) return 'loading';

  const primary = document.querySelector(contract.primary);
  if (primary?.matches('button:disabled, [aria-disabled="true"]')) return 'blocked';
  return 'ready';
}

function update(shell, contract) {
  const state = stateFor(contract);
  if (shell.dataset.journeyState !== state) {
    shell.dataset.journeyState = state;
  }
  shell.querySelector('.pds-journey-shell__eyebrow').textContent = t('journeyShell.label');
  shell.querySelector('.pds-journey-shell__status').textContent = t(
    `journeyShell.status.${state === 'ready' ? contract.stage : state}`
  );
  shell.querySelector('.pds-journey-shell__progress').setAttribute(
    'aria-label',
    t('journeyShell.progressLabel')
  );
  shell.querySelectorAll('[data-journey-stage]').forEach(item => {
    item.textContent = t(`journeyShell.stages.${item.dataset.journeyStage}`);
  });
  shell.querySelectorAll('[data-journey-action]').forEach(item => {
    item.textContent = t(`journeyShell.actions.${item.dataset.journeyAction}`);
  });
  shell.querySelector('.pds-journey-shell__handoff').textContent = t(
    `journeyShell.handoff.${contract.stage}`
  );
}


const JOURNEY_BRAND_ASSET_CODE = 'LOGO-010';
const JOURNEY_FAVICON_ASSET_CODE = 'LOGO-011';

function ensureJourneyBrandTargets() {
  document.querySelectorAll('a.brand').forEach(brand => {
    if (brand.querySelector('[data-journey-brand-asset]')) return;
    const image = document.createElement('img');
    image.className = 'journey-brand__logo';
    image.dataset.journeyBrandAsset = JOURNEY_BRAND_ASSET_CODE;
    image.alt = '';
    image.hidden = true;
    brand.append(image);
  });

  document.querySelectorAll('.runtime-workspace-brand').forEach(brand => {
    if (brand.querySelector('[data-journey-brand-asset]')) return;
    const image = document.createElement('img');
    image.className = 'runtime-workspace-brand__logo';
    image.dataset.journeyBrandAsset = JOURNEY_BRAND_ASSET_CODE;
    image.alt = '';
    image.hidden = true;
    brand.prepend(image);
  });
}

async function hydrateJourneyBrandImage(image) {
  if (image.dataset.brandHydration === 'pending' || image.dataset.brandHydration === 'ready') return;
  image.dataset.brandHydration = 'pending';

  try {
    const resolved = await resolvePublicAssetForWeb(image.dataset.journeyBrandAsset, {
      surface: 'REALITY_JOURNEY_SHELL'
    });
    if (!resolved?.renderable) {
      image.dataset.brandHydration = 'fallback';
      return;
    }

    await new Promise((resolve, reject) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', reject, { once: true });
      image.src = resolved.src;
    });

    image.removeAttribute('hidden');
    image.dataset.brandHydration = 'ready';
    image.closest('a.brand, .runtime-workspace-brand')?.classList.add('is-canonical-logo-ready');
  } catch {
    image.dataset.brandHydration = 'fallback';
  }
}

async function hydrateJourneyFavicon() {
  try {
    const favicon = await resolvePublicAssetForWeb(JOURNEY_FAVICON_ASSET_CODE, {
      surface: 'REALITY_JOURNEY_BROWSER_CHROME'
    });
    if (!favicon?.renderable) return;

    let link = document.querySelector('link[rel="icon"][data-phios-journey-branding]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.dataset.phiosJourneyBranding = 'true';
      document.head.append(link);
    }
    link.type = favicon.contentType || 'image/svg+xml';
    link.href = favicon.src;
  } catch {
    // Fail closed to browser default / existing icon.
  }
}

function hydrateJourneyBranding() {
  ensureJourneyBrandTargets();
  document.querySelectorAll('[data-journey-brand-asset]').forEach(image => {
    void hydrateJourneyBrandImage(image);
  });
  void hydrateJourneyFavicon();
}

function observeJourneyBranding() {
  const observer = new MutationObserver(() => hydrateJourneyBranding());
  observer.observe(document.body, { childList: true, subtree: true });
  return observer;
}

function initializeJourneyShell() {
  const contract = PAGE_CONTRACTS[normalizedPath()];
  if (!contract || document.querySelector('.pds-journey-shell')) return;

  if (!isI18nInitialized()) initializeI18n();

  const template = document.createElement('template');
  template.innerHTML = shellMarkup(contract).trim();
  const shell = template.content.firstElementChild;
  const header = document.querySelector('body > header, body > .site-header');

  if (header) header.insertAdjacentElement('afterend', shell);
  else document.body.prepend(shell);

  shell.querySelector('[data-journey-action="primary"]').addEventListener('click', () => {
    document.querySelector(contract.primary)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'center'
    });
  });

  const refresh = () => update(shell, contract);
  refresh();
  onLocaleChange(refresh);

  const observer = new MutationObserver(refresh);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class', 'hidden', 'disabled', 'aria-disabled'],
    subtree: true
  });
}

hydrateJourneyBranding();
observeJourneyBranding();
initializeJourneyShell();
