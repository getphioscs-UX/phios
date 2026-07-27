import {
  bindLocaleControls,
  getLocale,
  initializeI18n,
  onLocaleChange,
  t
} from '../i18n.js';

function cleanText(value) {
  return typeof value === 'string'
    ? value.replace(/<[^>]*>/g, '').trim()
    : '';
}

function escapeHTML(value = '') {
  return String(value).replace(
    /[&<>'"]/g,
    character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[character])
  );
}

const SOURCE_TRANSLATION_KEYS = Object.freeze({
  user_provided: 'professionalWorkspace.sourceUser',
  system_extracted: 'professionalWorkspace.sourceSystem',
  rule_inference: 'professionalWorkspace.sourceRule',
  workers_ai_interpretation: 'professionalWorkspace.sourceWorkersAI',
  professional_observation: 'professionalWorkspace.sourceProfessional',
  external_reader_interpretation: 'professionalWorkspace.sourceExternal'
});

const STAGE_TRANSLATION_KEYS = Object.freeze({
  entry: 'professionalWorkspace.stageEntry',
  reconstruction: 'professionalWorkspace.stageReconstruction',
  reading: 'professionalWorkspace.stageReading',
  navigation: 'professionalWorkspace.stageNavigation',
  runtime_memory: 'professionalWorkspace.stageMemory'
});

const payload = (
  window.__PHIOS_PROFESSIONAL_WORKSPACE_VIEW__ &&
  typeof window.__PHIOS_PROFESSIONAL_WORKSPACE_VIEW__ === 'object'
)
  ? window.__PHIOS_PROFESSIONAL_WORKSPACE_VIEW__
  : null;

function list(value) {
  return Array.isArray(value) ? value : [];
}

function display(value, fallback = '—') {
  return escapeHTML(cleanText(value) || fallback);
}

function date(value) {
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat(getLocale(), {
    dateStyle: 'medium'
  }).format(parsed);
}

function sourceLabel(reference = {}) {
  const key = SOURCE_TRANSLATION_KEYS[reference.source_type];
  return key ? t(key) : t('professionalWorkspace.source');
}

function renderClients() {
  const root = document.querySelector('#professionalClientList');
  if (!root) return;
  const clients = list(payload?.clients);
  if (!clients.length) {
    root.innerHTML = `<p class="professional-workspace-empty">${escapeHTML(t('professionalWorkspace.noClients'))}</p>`;
    return;
  }
  root.innerHTML = `<div class="professional-client-grid">${clients.map(client => `
    <article class="professional-client-card">
      <header>
        <span>${escapeHTML(t('professionalWorkspace.clientName'))}</span>
        <h2>${display(client.display_name)}</h2>
      </header>
      <dl>
        <div><dt>${escapeHTML(t('professionalWorkspace.currentRuntime'))}</dt><dd>${display(client.current_runtime_label)}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.serviceType'))}</dt><dd>${display(client.service_label)}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.professionalStatus'))}</dt><dd>${display(client.professional_status_label)}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.consentStatus'))}</dt><dd>${display(client.consent_status_label)}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.nextAppointment'))}</dt><dd>${date(client.next_appointment_at)}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.pendingMaterials'))}</dt><dd>${Number(client.pending_material_count) || 0}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.reportStatus'))}</dt><dd>${display(client.report_status_label)}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.followUp'))}</dt><dd>${date(client.follow_up_at)}</dd></div>
      </dl>
    </article>
  `).join('')}</div>`;
}

function runtimeItems(stage) {
  if (!stage?.accessible) {
    return `<p class="professional-workspace-empty">${escapeHTML(t('professionalWorkspace.notAuthorised'))}</p>`;
  }
  const items = list(stage.items);
  if (!items.length) {
    return `<p class="professional-workspace-empty">${escapeHTML(t('professionalWorkspace.noRuntime'))}</p>`;
  }
  return `<ul>${items.map(item => `
    <li>
      <p>${display(item.text)}</p>
      <small>${escapeHTML(t('professionalWorkspace.source'))}: ${escapeHTML(sourceLabel(item.source_reference))}</small>
    </li>
  `).join('')}</ul>`;
}

function renderRuntime() {
  const root = document.querySelector('#professionalRuntimeView');
  if (!root) return;
  const runtime = payload?.runtime;
  if (!runtime) {
    root.innerHTML = `<p class="professional-workspace-empty">${escapeHTML(t('professionalWorkspace.noRuntime'))}</p>`;
    return;
  }
  const stages = runtime.stages || {};
  root.innerHTML = `<div class="professional-runtime-grid">
    ${Object.entries(STAGE_TRANSLATION_KEYS).map(([stage, key]) => `
      <article>
        <h2>${escapeHTML(t(key))}</h2>
        ${runtimeItems(stages[stage])}
      </article>
    `).join('')}
    <article class="professional-runtime-external">
      <h2>${escapeHTML(t('professionalWorkspace.externalPerspective'))}</h2>
      ${runtimeItems({
        accessible: true,
        items: runtime.external_perspectives
      })}
    </article>
  </div>`;
}

function renderNotes() {
  const root = document.querySelector('#professionalNotes');
  if (!root) return;
  const notes = list(payload?.notes);
  if (!notes.length) {
    root.innerHTML = `<p class="professional-workspace-empty">${escapeHTML(t('professionalWorkspace.noNotes'))}</p>`;
    return;
  }
  root.innerHTML = `<div class="professional-note-list">${notes.map(note => `
    <article>
      <header>
        <strong>${display(note.note_type_label)}</strong>
        <span>${escapeHTML(note.client_visible
          ? t('professionalWorkspace.noteClientVisible')
          : t('professionalWorkspace.notePrivate'))}</span>
      </header>
      <p>${display(note.content)}</p>
      <footer>
        <span>${escapeHTML(t('professionalWorkspace.source'))}: ${escapeHTML(sourceLabel(note.source_reference))}</span>
        <span>v${Number(note.version) || 1}</span>
      </footer>
    </article>
  `).join('')}</div>`;
}

function renderQueue() {
  const root = document.querySelector('#professionalReviewQueue');
  if (!root) return;
  const tasks = list(payload?.tasks);
  if (!tasks.length) {
    root.innerHTML = `<p class="professional-workspace-empty">${escapeHTML(t('professionalWorkspace.noTasks'))}</p>`;
    return;
  }
  root.innerHTML = `<div class="professional-queue-list">${tasks.map(task => `
    <article>
      <header>
        <div><span>${escapeHTML(t('professionalWorkspace.task'))}</span><h2>${display(task.task_type_label)}</h2></div>
        <strong data-priority="${display(task.priority)}">${display(task.priority_label)}</strong>
      </header>
      <dl>
        <div><dt>${escapeHTML(t('professionalWorkspace.assignedProfessional'))}</dt><dd>${display(task.assigned_professional_label)}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.dueDate'))}</dt><dd>${date(task.due_at)}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.consentStatus'))}</dt><dd>${display(task.consent_status_label)}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.dataCompleteness'))}</dt><dd>${Number(task.data_completeness) || 0}%</dd></div>
      </dl>
      ${list(task.boundary_flags).map(flag => `<p class="professional-boundary-flag">${escapeHTML(t('professionalWorkspace.boundaryFlag'))}: ${display(flag)}</p>`).join('')}
    </article>
  `).join('')}</div>`;
}

function renderAll() {
  document.body.dataset.workspaceStatus = payload
    ? 'authorised-projection'
    : 'unavailable';
  const unavailable = document.querySelector('[data-workspace-unavailable]');
  if (unavailable) unavailable.hidden = Boolean(payload);
  renderClients();
  renderRuntime();
  renderNotes();
  renderQueue();
}

function bindViews() {
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-professional-view]');
    if (!button) return;
    const view = button.dataset.professionalView;
    document.querySelectorAll('[data-professional-view]').forEach(item => {
      item.setAttribute(
        'aria-pressed',
        String(item.dataset.professionalView === view)
      );
    });
    document.querySelectorAll('[data-professional-panel]').forEach(panel => {
      panel.hidden = panel.dataset.professionalPanel !== view;
    });
  });
}

initializeI18n();
bindLocaleControls();
bindViews();
renderAll();
onLocaleChange(renderAll);
