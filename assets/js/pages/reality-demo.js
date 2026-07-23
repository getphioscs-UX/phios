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
const lightCoordinateStep = document.querySelector('#light-coordinate-step');
const lightObservationStep = document.querySelector('#light-observation-step');
const lightCoordinates = document.querySelector('#light-reality-coordinates');
const lightCoordinateStatus = document.querySelector('#light-coordinate-status');
const lightCoordinateContinue = document.querySelector('#light-coordinate-continue');
const lightCoordinateBack = document.querySelector('#light-coordinate-back');
const lightCoordinateSummary = document.querySelector('#light-coordinate-summary');

let activeEvidence = null;
let selectedCoordinates = [];
let coordinateNotice = '';

const COORDINATE_MAXIMUM = 2;
const COORDINATE_UNSURE = 'unsure';
const COORDINATE_KEYS = Object.freeze({
  body_health: 'bodyHealth',
  relationships_family: 'relationshipsFamily',
  work_career: 'workCareer',
  money_resources: 'moneyResources',
  learning_growth: 'learningGrowth',
  meaning_purpose: 'meaningPurpose',
  environment_place: 'environmentPlace',
  unsure: 'unsure'
});

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

function coordinateName(value) {
  const key = COORDINATE_KEYS[value];
  return key ? t(`demo.light.coordinates.${key}`) : '';
}

function renderCoordinateSummary() {
  if (!lightCoordinateSummary) return;
  lightCoordinateSummary.textContent = selectedCoordinates
    .map(coordinateName)
    .filter(Boolean)
    .join(' · ');
}

function renderLightCoordinates(notice = coordinateNotice) {
  coordinateNotice = notice;
  const selected = new Set(selectedCoordinates);
  const unsureSelected = selected.has(COORDINATE_UNSURE);
  const maximumReached =
    selected.size >= COORDINATE_MAXIMUM &&
    !unsureSelected;

  lightCoordinates
    ?.querySelectorAll('input[name="lightRealityCoordinate"]')
    .forEach(input => {
      const isSelected = selected.has(input.value);
      const unavailable =
        (unsureSelected && input.value !== COORDINATE_UNSURE) ||
        (maximumReached && !isSelected);

      input.checked = isSelected;
      input.disabled = unavailable;
      input.closest('label')?.classList.toggle('is-selected', isSelected);
      input.closest('label')?.classList.toggle('is-disabled', unavailable);
    });

  if (lightCoordinateStatus) {
    lightCoordinateStatus.dataset.tone =
      notice === 'required' ? 'error' :
      notice === 'limit' ? 'limit' :
      '';

    lightCoordinateStatus.textContent =
      notice === 'required'
        ? t('demo.light.coordinateRequired')
        : notice === 'limit'
          ? t('demo.light.coordinateLimit', { max: COORDINATE_MAXIMUM })
          : selected.size
            ? t('demo.light.selectedStatus', {
                count: selected.size,
                max: COORDINATE_MAXIMUM
              })
            : '';
  }

  renderCoordinateSummary();
}

function updateLightCoordinate(input) {
  const value = input?.value || '';
  if (!COORDINATE_KEYS[value]) return;

  if (value === COORDINATE_UNSURE && input.checked) {
    selectedCoordinates = [COORDINATE_UNSURE];
  } else {
    const selected = new Set(
      selectedCoordinates.filter(item => item !== COORDINATE_UNSURE)
    );

    if (input.checked) selected.add(value);
    else selected.delete(value);

    if (selected.size > COORDINATE_MAXIMUM) {
      input.checked = false;
      renderLightCoordinates('limit');
      return;
    }

    selectedCoordinates = [...selected];
  }

  renderLightCoordinates('');
}

lightCoordinates?.addEventListener('change', event => {
  const input = event.target.closest(
    'input[name="lightRealityCoordinate"]'
  );
  if (input) updateLightCoordinate(input);
});

lightCoordinateContinue?.addEventListener('click', () => {
  if (!selectedCoordinates.length) {
    renderLightCoordinates('required');
    lightCoordinates
      ?.querySelector('input[name="lightRealityCoordinate"]')
      ?.focus();
    return;
  }

  lightCoordinateStep.hidden = true;
  lightObservationStep.hidden = false;
  renderCoordinateSummary();
  lightInput?.focus();
});

lightCoordinateBack?.addEventListener('click', () => {
  lightObservationStep.hidden = true;
  lightCoordinateStep.hidden = false;
  renderLightCoordinates('');
  lightCoordinates
    ?.querySelector('input[name="lightRealityCoordinate"]:checked')
    ?.focus();
});

lightTryForm?.addEventListener('submit', event => {
  event.preventDefault();

  if (!selectedCoordinates.length) {
    lightObservationStep.hidden = true;
    lightCoordinateStep.hidden = false;
    renderLightCoordinates('required');
    return;
  }

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
  renderLightCoordinates();

  if (lightError && !lightError.hidden) {
    lightError.textContent = t('demo.light.required');
  }
});

renderLightCoordinates('');
