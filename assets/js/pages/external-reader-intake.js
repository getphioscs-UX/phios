import { bindLocaleControls, initializeI18n, onLocaleChange, t } from '../i18n.js';

const state = { file: null, handoff: null };
const allowed = new Set(['png', 'jpg', 'jpeg', 'webp', 'pdf']);
const esc = value => String(value || '').replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
const formValue = (form, name) => String(new FormData(form).get(name) || '').trim();
const ext = file => file?.name.split('.').pop().toLowerCase();

function updateReader() {
  const reader = document.querySelector('#externalReaderType').value;
  document.querySelector('#humanDesignFields').hidden = reader !== 'human_design';
  document.querySelector('#genericReaderFields').hidden = reader === 'human_design';
  document.querySelector('#externalReaderAvailability').textContent = reader === 'human_design'
    ? t('externalReaderIntake.humanDesignAvailable')
    : t('externalReaderIntake.infrastructureReady');
}
function updateFile() {
  const root = document.querySelector('#externalReaderFilePreview');
  root.innerHTML = state.file
    ? `<strong>${esc(state.file.name)}</strong><p>${esc(t('externalReaderIntake.fileNotUploaded'))}</p>`
    : `<p>${esc(t('externalReaderIntake.noFile'))}</p>`;
}
function knownFields(form, reader) {
  if (reader === 'human_design') {
    return Object.fromEntries(['type','authority','profile','definition'].map(key => [key, formValue(form, `known_${key}`)]).filter(([, value]) => value));
  }
  return Object.fromEntries(formValue(form, 'known_generic_fields').split(/\r?\n/).map((line, index) => {
    const parts = line.split(':'); return [parts[0]?.trim() || `field_${index + 1}`, parts.slice(1).join(':').trim()];
  }).filter(([, value]) => value));
}
function renderHandoff() {
  const root = document.querySelector('#externalReaderHandoff');
  if (!state.handoff) return;
  root.hidden = false;
  root.innerHTML = `<h2>${esc(t('externalReaderIntake.handoffReady'))}</h2><strong>${esc(t('externalReaderIntake.reviewRequired'))}</strong><ol>${state.handoff.tasks.map(task => `<li>${esc(t(`externalReaderIntake.${task}`))}</li>`).join('')}</ol><p>${esc(t('externalReaderIntake.handoffBoundary'))}</p>`;
}
function submit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const error = document.querySelector('#externalReaderIntakeError');
  if (!form.reportValidity()) return;
  const reader = formValue(form, 'reader_type');
  const fields = knownFields(form, reader);
  if (!state.file && !Object.keys(fields).length) {
    error.hidden = false; error.textContent = t('externalReaderIntake.chartRequiredError'); return;
  }
  if (state.file && !allowed.has(ext(state.file))) {
    error.hidden = false; error.textContent = t('externalReaderIntake.fileTypeError'); return;
  }
  error.hidden = true;
  const tasks = ['queueIntakeReceived'];
  if (state.file) tasks.push('queueChartReview');
  if (Object.keys(fields).length) tasks.push('queueDataVerification');
  state.handoff = {
    tasks,
    interpretation_available: reader === 'human_design',
    runtime_evidence_written: false,
    runtime_memory_written: false,
    automatic_calculation_used: false
  };
  renderHandoff();
}
initializeI18n();
bindLocaleControls();
document.querySelector('#externalReaderType').addEventListener('change', updateReader);
document.querySelector('#externalReaderChartFile').addEventListener('change', event => { state.file = event.target.files?.[0] || null; updateFile(); });
document.querySelector('#externalReaderIntakeForm').addEventListener('submit', submit);
document.querySelector('#externalReaderIntakeForm').addEventListener('reset', () => { state.file = null; state.handoff = null; setTimeout(() => { updateReader(); updateFile(); document.querySelector('#externalReaderHandoff').hidden = true; }); });
updateReader();
updateFile();
onLocaleChange(() => { updateReader(); updateFile(); renderHandoff(); });
