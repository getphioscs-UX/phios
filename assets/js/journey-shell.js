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

initializeJourneyShell();
