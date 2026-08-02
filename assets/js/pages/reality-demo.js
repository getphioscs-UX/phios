import {
  onLocaleChange,
  t
} from '../i18n.js';
import {
  deriveEvidenceLab
} from '../modules/evidence-boundary-lab.js';

const evidenceCards = Array.from(
  document.querySelectorAll('[data-evidence-title]')
);
const evidenceReading = document.querySelector('#evidence-reading-summary');
const evidenceConfidence = document.querySelector('#evidence-confidence');
const evidenceNavigation = document.querySelector('#evidence-navigation-direction');
const evidenceUnknowns = document.querySelector('#evidence-unknowns');
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
const lightReset = document.querySelector('#light-reset');
const lightReroute = document.querySelector('#light-reroute');
const lightContinue = document.querySelector('#light-continue');

let selectedEvidence = ['meeting', 'approvals', 'notice'];
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

function renderEvidence() {
  const result = deriveEvidenceLab(selectedEvidence);
  evidenceCards.forEach(card => {
    const enabled = result.selected.includes(card.dataset.evidenceId);
    card.setAttribute('aria-pressed', String(enabled));
    const toggle = card.querySelector('.evidence-card__toggle');
    if (toggle) {
      toggle.textContent = t(
        enabled ? 'demo.evidence.enabled' : 'demo.evidence.disabled'
      );
    }
  });
  if (evidenceReading) {
    evidenceReading.textContent = t(
      `demo.evidence.dynamic.reading.${result.readingKey}`
    );
  }
  if (evidenceConfidence) {
    evidenceConfidence.textContent = `${result.confidence}%`;
  }
  if (evidenceNavigation) {
    evidenceNavigation.textContent = t(
      `demo.evidence.dynamic.navigation.${result.navigationKey}`
    );
  }
  if (evidenceUnknowns) {
    evidenceUnknowns.textContent = t(
      `demo.evidence.dynamic.unknown.${result.unknownKey}`
    );
  }
}

evidenceCards.forEach(card => {
  card.addEventListener('click', () => {
    const id = card.dataset.evidenceId;
    selectedEvidence = selectedEvidence.includes(id)
      ? selectedEvidence.filter(item => item !== id)
      : [...selectedEvidence, id];
    renderEvidence();
  });
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

lightReset?.addEventListener('click', () => {
  lightTryForm?.reset();
  selectedCoordinates = [];
  if (lightResult) lightResult.hidden = true;
  if (lightObservationStep) lightObservationStep.hidden = true;
  if (lightCoordinateStep) lightCoordinateStep.hidden = false;
  renderLightCoordinates('');
});

lightReroute?.addEventListener('click', () => {
  lightTryForm?.requestSubmit();
});

onLocaleChange(() => {
  renderEvidence();
  renderLightCoordinates();

  if (lightError && !lightError.hidden) {
    lightError.textContent = t('demo.light.required');
  }
});

renderLightCoordinates('');
renderEvidence();
