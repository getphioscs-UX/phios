import {
  onLocaleChange,
  t
} from '../i18n.js';

const evidenceCards = Array.from(
  document.querySelectorAll('[data-evidence-title]')
);
const evidenceTitle = document.querySelector('#evidence-explanation-title');
const evidenceCopy = document.querySelector('#evidence-explanation-copy');
const lightTryForm = document.querySelector('#light-try-form');
const lightInput = document.querySelector('#light-change');
const lightError = document.querySelector('#light-try-error');
const lightResult = document.querySelector('#light-try-result');
const lightObserved = document.querySelector('#light-observed');

let activeEvidence = null;

function renderEvidence(card) {
  activeEvidence = card || null;

  evidenceCards.forEach(candidate => {
    candidate.setAttribute(
      'aria-pressed',
      String(candidate === activeEvidence)
    );
  });

  if (!evidenceTitle || !evidenceCopy) {
    return;
  }

  evidenceTitle.textContent = activeEvidence
    ? t(activeEvidence.dataset.evidenceTitle)
    : t('demo.evidence.defaultTitle');

  evidenceCopy.textContent = activeEvidence
    ? t(activeEvidence.dataset.evidenceExplanation)
    : t('demo.evidence.defaultCopy');
}

evidenceCards.forEach(card => {
  card.addEventListener('click', () => renderEvidence(card));
});

lightTryForm?.addEventListener('submit', event => {
  event.preventDefault();

  const observation = lightInput?.value.trim() || '';

  if (!observation) {
    if (lightError) {
      lightError.textContent = t('demo.light.required');
      lightError.hidden = false;
    }
    lightInput?.focus();
    return;
  }

  if (lightError) {
    lightError.hidden = true;
  }

  if (lightObserved) {
    lightObserved.textContent = observation;
  }

  if (lightResult) {
    lightResult.hidden = false;
    lightResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});

onLocaleChange(() => {
  renderEvidence(activeEvidence);

  if (lightError && !lightError.hidden) {
    lightError.textContent = t('demo.light.required');
  }
});
