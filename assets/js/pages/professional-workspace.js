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

const EXTERNAL_SOURCE_TRANSLATION_KEYS = Object.freeze({
  user_provided: 'professionalWorkspace.readerSourceUser',
  uploaded_chart: 'professionalWorkspace.readerSourceChart',
  uploaded_external_chart: 'professionalWorkspace.readerSourceChart',
  manually_entered_chart_data: 'professionalWorkspace.readerSourceManual',
  phi_os_generated: 'professionalWorkspace.readerSourcePhiOS',
  third_party_api: 'professionalWorkspace.readerSourceAPI',
  registry_source: 'professionalWorkspace.readerSourceRegistry',
  rule_inference: 'professionalWorkspace.sourceRule',
  professional_interpretation:
    'professionalWorkspace.sourceProfessional',
  ai_draft: 'professionalWorkspace.readerSourceAI',
  ai_assisted_draft: 'professionalWorkspace.readerSourceAI',
  client_confirmed_correspondence:
    'professionalWorkspace.readerSourceClientConfirmed',
  professionally_supported_correspondence:
    'professionalWorkspace.readerSourceProfessionalSupported',
  unverified_correspondence:
    'professionalWorkspace.readerSourceUnverified'
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

function localized(value = {}) {
  const locale = getLocale();
  const normalized = locale === 'zh-Hans' ? 'zh_Hans' : locale;
  return cleanText(value[locale]) ||
    cleanText(value[normalized]) ||
    cleanText(value.en);
}

function date(value) {
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat(getLocale(), {
    dateStyle: 'medium'
  }).format(parsed);
}

function dateTime(value) {
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat(getLocale(), {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(parsed);
}

function sourceLabel(reference = {}) {
  const key = SOURCE_TRANSLATION_KEYS[reference.source_type];
  return key ? t(key) : t('professionalWorkspace.source');
}

function externalSourceLabel(reference = {}) {
  const key = EXTERNAL_SOURCE_TRANSLATION_KEYS[
    reference.source_label
  ];
  return key ? t(key) : t('professionalWorkspace.sourceExternal');
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

function renderReadingRevisions() {
  const root = document.querySelector('#professionalReadingRevisions');
  if (!root) return;
  const revisions = list(payload?.reading_revisions);
  if (!revisions.length) {
    root.innerHTML = `<p class="professional-workspace-empty">${escapeHTML(t('professionalWorkspace.noReadingRevisions'))}</p>`;
    return;
  }
  root.innerHTML = `<div class="professional-revision-list">${revisions.map(revision => `
    <article>
      <header>
        <div>
          <span>${escapeHTML(t('professionalWorkspace.revisionAction'))}</span>
          <h2>${display(revision.action_label)}</h2>
        </div>
        <strong>${escapeHTML(t('professionalWorkspace.versionTransition', {
          original: Number(revision.original_version) || 1,
          revised: Number(revision.revised_version) || 2
        }))}</strong>
      </header>
      <div class="professional-comparison">
        <section>
          <h3>${escapeHTML(t('professionalWorkspace.originalVersion'))}</h3>
          <p>${display(revision.original_text)}</p>
        </section>
        <section>
          <h3>${escapeHTML(t('professionalWorkspace.revisedVersion'))}</h3>
          <p>${display(revision.revised_text)}</p>
        </section>
      </div>
      <dl class="professional-meta-grid">
        <div><dt>${escapeHTML(t('professionalWorkspace.changedBy'))}</dt><dd>${display(revision.changed_by_label)}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.changedAt'))}</dt><dd>${dateTime(revision.changed_at)}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.reason'))}</dt><dd>${display(revision.reason)}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.clientVisibility'))}</dt><dd>${escapeHTML(revision.client_visible ? t('professionalWorkspace.noteClientVisible') : t('professionalWorkspace.notePrivate'))}</dd></div>
      </dl>
      <p class="professional-contract-boundary">${escapeHTML(t('professionalWorkspace.readingOverlayBoundary'))}</p>
    </article>
  `).join('')}</div>`;
}

function labelledList(labelKey, values) {
  const items = list(values);
  return `<section>
    <h3>${escapeHTML(t(labelKey))}</h3>
    ${items.length
      ? `<ul>${items.map(value => `<li>${display(value)}</li>`).join('')}</ul>`
      : `<p class="professional-workspace-empty">—</p>`}
  </section>`;
}

function renderNavigationConsiderations() {
  const root = document.querySelector(
    '#professionalNavigationConsiderations'
  );
  if (!root) return;
  const considerations = list(payload?.navigation_considerations);
  if (!considerations.length) {
    root.innerHTML = `<p class="professional-workspace-empty">${escapeHTML(t('professionalWorkspace.noNavigationConsiderations'))}</p>`;
    return;
  }
  root.innerHTML = `<div class="professional-consideration-list">${considerations.map(item => `
    <article>
      <header>
        <div>
          <span>${escapeHTML(t('professionalWorkspace.currentRuntimePosition'))}</span>
          <h2>${display(item.current_runtime_position)}</h2>
        </div>
        ${item.includes_external_reader
          ? `<strong class="professional-interpretation-badge">${escapeHTML(t('professionalWorkspace.interpretationOnly'))}</strong>`
          : ''}
      </header>
      <div class="professional-consideration-grid">
        ${labelledList('professionalWorkspace.availablePaths', item.available_paths)}
        ${labelledList('professionalWorkspace.constraints', item.constraints)}
        ${labelledList('professionalWorkspace.requiredEvidence', item.required_evidence)}
        ${labelledList('professionalWorkspace.lowRiskNextStep', [item.low_risk_next_step])}
        ${labelledList('professionalWorkspace.reviewPoint', [item.review_point])}
        ${labelledList('professionalWorkspace.stopCondition', [item.stop_condition])}
        ${labelledList('professionalWorkspace.escalationCondition', [item.escalation_condition])}
      </div>
      <p class="professional-contract-boundary">${escapeHTML(t('professionalWorkspace.navigationChoiceBoundary'))}</p>
    </article>
  `).join('')}</div>`;
}

function renderFollowUpTimeline() {
  const root = document.querySelector('#professionalFollowUpTimeline');
  if (!root) return;
  const events = list(payload?.follow_up_timeline?.events);
  if (!events.length) {
    root.innerHTML = `<p class="professional-workspace-empty">${escapeHTML(t('professionalWorkspace.noFollowUpEvents'))}</p>`;
    return;
  }
  root.innerHTML = `<ol class="professional-follow-up-list">${events.map(event => `
    <li>
      <span class="professional-follow-up-dot" aria-hidden="true"></span>
      <article>
        <header>
          <h2>${display(event.event_label)}</h2>
          <time datetime="${display(event.occurred_at)}">${dateTime(event.occurred_at)}</time>
        </header>
        <p>${escapeHTML(event.client_visible
          ? t('professionalWorkspace.noteClientVisible')
          : t('professionalWorkspace.professionalRecord'))}</p>
      </article>
    </li>
  `).join('')}</ol>
  <p class="professional-contract-boundary">${escapeHTML(t('professionalWorkspace.timelineBoundary'))}</p>`;
}

function renderExternalReaders() {
  const root = document.querySelector('#professionalExternalReaders');
  if (!root) return;
  const framework = payload?.external_reader_framework;
  if (!framework) {
    root.innerHTML = `<p class="professional-workspace-empty">${escapeHTML(t('professionalWorkspace.noReaderRegistry'))}</p>`;
    return;
  }
  const readers = list(framework.readers);
  const interpretations = list(framework.interpretations);
  const correspondences = list(framework.correspondences);
  root.innerHTML = `
    <header class="professional-reader-heading">
      <div>
        <p>${escapeHTML(t('professionalWorkspace.readerRegistry'))}</p>
        <h2>${escapeHTML(t('professionalWorkspace.readerWorkspace'))}</h2>
      </div>
      <strong>${escapeHTML(t('professionalWorkspace.interpretationOnly'))}</strong>
    </header>
    <div class="professional-reader-grid">
      ${readers.map(reader => `
        <article>
          <header>
            <h3>${display(localized(reader.reader_name))}</h3>
            <span data-reader-active="${String(reader.active === true)}">${escapeHTML(reader.active
              ? t('professionalWorkspace.readerAvailable')
              : t('professionalWorkspace.readerInfrastructureReady'))}</span>
          </header>
          <dl>
            <div><dt>${escapeHTML(t('professionalWorkspace.readerVersion'))}</dt><dd>${display(reader.reader_version)}</dd></div>
            <div><dt>${escapeHTML(t('professionalWorkspace.rendererStatus'))}</dt><dd>${display(reader.renderer_status)}</dd></div>
            <div><dt>${escapeHTML(t('professionalWorkspace.interpretationStatus'))}</dt><dd>${display(reader.interpretation_status)}</dd></div>
          </dl>
          ${reader.active ? '' : `<p>${escapeHTML(t('professionalWorkspace.readerNotAvailable'))}</p>`}
        </article>
      `).join('')}
    </div>
    <section class="professional-reader-records">
      <h2>${escapeHTML(t('professionalWorkspace.interpretationDrafts'))}</h2>
      ${interpretations.length
        ? `<ul>${interpretations.map(item => `
          <li>
            <strong>${display(item.chart_element)}</strong>
            <p>${display(item.interpretation)}</p>
            <small>${escapeHTML(t('professionalWorkspace.source'))}: ${escapeHTML(externalSourceLabel(item.source_reference))}</small>
          </li>`).join('')}</ul>`
        : `<p class="professional-workspace-empty">${escapeHTML(t('professionalWorkspace.noInterpretations'))}</p>`}
    </section>
    <section class="professional-reader-records">
      <h2>${escapeHTML(t('professionalWorkspace.correspondenceReview'))}</h2>
      ${correspondences.length
        ? `<ul>${correspondences.map(item => `
          <li><strong>${display(item.status_label || item.status)}</strong><p>${display(item.summary)}</p></li>
        `).join('')}</ul>`
        : `<p class="professional-workspace-empty">${escapeHTML(t('professionalWorkspace.noCorrespondences'))}</p>`}
    </section>
    <p class="professional-contract-boundary">${escapeHTML(t('professionalWorkspace.externalReaderBoundary'))}</p>
  `;
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
  renderReadingRevisions();
  renderNavigationConsiderations();
  renderFollowUpTimeline();
  renderExternalReaders();
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
