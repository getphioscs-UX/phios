import {
  getLocale,
  onLocaleChange,
  t
} from '../i18n.js';
import {
  clearAllFreeObservations,
  clearFreeObservation,
  createFreeObservation,
  FREE_OBSERVATION_RETENTION_DAYS,
  loadFreeObservations,
  saveFreeObservation
} from '../modules/free-observation-local.js';

const form = document.querySelector('#free-observation-form');
const result = document.querySelector('[data-free-observation-result]');
const savedList = document.querySelector('[data-free-observation-saved-list]');
const savedEmpty = document.querySelector('[data-free-observation-empty]');
const savedCount = document.querySelector('[data-free-observation-count]');
const clearAll = document.querySelector('[data-free-observation-clear-all]');
const status = document.querySelector('[data-free-observation-status]');
const privacyStatus = document.querySelector('[data-free-observation-privacy-status]');

let currentObservation = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function selectedValue(name) {
  return form?.querySelector(`input[name="${name}"]:checked`)?.value || '';
}

function selectionLabel(group, value) {
  return t(`freeObservation.options.${group}.${value}`);
}

function renderResult() {
  if (!result || !currentObservation) return;

  const { selection, orientation } = currentObservation;
  result.hidden = false;
  result.querySelector('[data-result-focus]').textContent =
    selectionLabel('focus', selection.focus);
  result.querySelector('[data-result-signal]').textContent =
    selectionLabel('signal', selection.signal);
  result.querySelector('[data-result-horizon]').textContent =
    selectionLabel('horizon', selection.horizon);
  result.querySelector('[data-result-orientation]').textContent =
    t(orientation.focusKey);
  result.querySelector('[data-result-evidence]').textContent =
    t(orientation.signalKey);
  result.querySelector('[data-result-next]').textContent =
    t(orientation.nextStepKey);
}

function formatExpiry(value) {
  return new Intl.DateTimeFormat(
    getLocale() === 'zh-Hans' ? 'zh-CN' : 'en',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }
  ).format(new Date(value));
}

function savedCard(record) {
  return `
    <article class="free-observation-saved-card">
      <div>
        <span class="free-observation-chip">
          ${escapeHtml(selectionLabel('focus', record.selection.focus))}
        </span>
        <span class="free-observation-chip">
          ${escapeHtml(selectionLabel('signal', record.selection.signal))}
        </span>
        <span class="free-observation-chip">
          ${escapeHtml(selectionLabel('horizon', record.selection.horizon))}
        </span>
      </div>
      <p>${escapeHtml(t(record.orientation.focusKey))}</p>
      <small>
        ${escapeHtml(t('freeObservation.saved.expires', {
          date: formatExpiry(record.expiresAt)
        }))}
      </small>
      <button
        class="free-observation-delete"
        type="button"
        data-delete-observation="${escapeHtml(record.observationId)}"
      >
        ${escapeHtml(t('freeObservation.saved.delete'))}
      </button>
    </article>
  `;
}

function renderSaved() {
  let records = [];

  try {
    records = loadFreeObservations();
  } catch {
    setStatus('freeObservation.form.storageUnavailable', 'error');
  }

  if (savedList) {
    savedList.innerHTML = records.map(savedCard).join('');
  }
  if (savedEmpty) {
    savedEmpty.hidden = records.length !== 0;
  }
  if (savedCount) {
    savedCount.textContent = t('freeObservation.saved.count', {
      count: records.length
    });
  }
  if (clearAll) {
    clearAll.hidden = records.length === 0;
    clearAll.dataset.confirming = 'false';
    clearAll.textContent = t('freeObservation.saved.clearAll');
  }
}

function setStatus(key, tone = '') {
  if (!status) return;
  status.textContent = key ? t(key) : '';
  status.dataset.tone = tone;
}

form?.addEventListener('submit', event => {
  event.preventDefault();

  try {
    currentObservation = createFreeObservation({
      focus: selectedValue('observationFocus'),
      signal: selectedValue('observationSignal'),
      horizon: selectedValue('observationHorizon')
    });
    setStatus('');
    renderResult();
    const reducedMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    )?.matches;
    result?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'nearest'
    });
  } catch {
    setStatus('freeObservation.form.required', 'error');
  }
});

result?.querySelector('[data-save-observation]')?.addEventListener('click', () => {
  if (!currentObservation) return;

  try {
    saveFreeObservation(currentObservation);
    setStatus('freeObservation.form.saved', 'success');
    renderSaved();
  } catch {
    setStatus('freeObservation.form.storageUnavailable', 'error');
  }
});

result?.querySelector('[data-reset-observation]')?.addEventListener('click', () => {
  form?.reset();
  currentObservation = null;
  result.hidden = true;
  setStatus('');
  form?.querySelector('input')?.focus();
});

savedList?.addEventListener('click', event => {
  const button = event.target.closest('[data-delete-observation]');

  if (!button) return;

  try {
    clearFreeObservation(button.dataset.deleteObservation);
    setStatus('freeObservation.saved.deleted', 'success');
    renderSaved();
  } catch {
    setStatus('freeObservation.form.storageUnavailable', 'error');
  }
});

clearAll?.addEventListener('click', () => {
  if (clearAll.dataset.confirming !== 'true') {
    clearAll.dataset.confirming = 'true';
    clearAll.textContent = t('freeObservation.saved.confirmClearAll');
    return;
  }

  try {
    clearAllFreeObservations();
    setStatus('freeObservation.saved.cleared', 'success');
    renderSaved();
  } catch {
    setStatus('freeObservation.form.storageUnavailable', 'error');
  }
});

onLocaleChange(() => {
  renderResult();
  renderSaved();
  if (privacyStatus) {
    privacyStatus.textContent = t('freeObservation.privacy.retention', {
      days: FREE_OBSERVATION_RETENTION_DAYS
    });
  }
});

if (privacyStatus) {
  privacyStatus.textContent = t('freeObservation.privacy.retention', {
    days: FREE_OBSERVATION_RETENTION_DAYS
  });
}

renderSaved();
