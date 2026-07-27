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

function selectedValue(selector) {
  return cleanText(document.querySelector(selector)?.value);
}

function humanizeKey(value) {
  return cleanText(value).replaceAll('_', ' ').replace(/\b\w/g, letter =>
    letter.toUpperCase()
  );
}

function financialStatus(value) {
  const status = cleanText(value);
  if (!status) return '—';
  const translated = t(`professionalWorkspace.financialStatuses.${status}`);
  return translated === `professionalWorkspace.financialStatuses.${status}`
    ? humanizeKey(status)
    : translated;
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
  const financialFilter = selectedValue('#professionalFinancialClientFilter');
  const clients = list(payload?.clients).filter(client => {
    if (!financialFilter) return true;
    const matches = {
      awaiting_financial_intake:
        ['not_started', 'awaiting'].includes(client.financial_intake_status),
      awaiting_documents:
        ['not_started', 'awaiting', 'partial'].includes(client.documents_status),
      financial_analysis_in_progress:
        client.financial_review_status === 'analysis_in_progress',
      professional_review_required:
        client.financial_review_status === 'professional_review_required',
      financial_consultation_pending:
        client.financial_review_status === 'consultation_pending',
      navigation_plan_pending:
        client.financial_review_status === 'navigation_plan_pending',
      implementation_review_due:
        client.financial_review_status === 'implementation_review_due',
      annual_review_due:
        client.financial_review_status === 'annual_review_due'
    };
    return matches[financialFilter] === true;
  });
  const count = document.querySelector('#professionalClientResultCount');
  if (count) {
    count.textContent = t('professionalWorkspace.clientResultCount', {
      count: clients.length
    });
  }
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
        <div><dt>${escapeHTML(t('professionalWorkspace.financialServiceType'))}</dt><dd>${display(client.financial_service_label || client.financial_service_type)}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.financialDataDate'))}</dt><dd>${date(client.financial_data_date)}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.householdType'))}</dt><dd>${escapeHTML(financialStatus(client.household_type))}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.financialIntakeStatus'))}</dt><dd>${escapeHTML(financialStatus(client.financial_intake_status))}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.documentsStatus'))}</dt><dd>${escapeHTML(financialStatus(client.documents_status))}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.financialReviewStatus'))}</dt><dd>${escapeHTML(financialStatus(client.financial_review_status))}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.financialRiskLevel'))}</dt><dd>${escapeHTML(financialStatus(client.financial_risk_level))}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.nextFinancialReview'))}</dt><dd>${date(client.next_financial_review)}</dd></div>
        <div><dt>${escapeHTML(t('professionalWorkspace.assignedFinancialProfessional'))}</dt><dd>${display(client.assigned_financial_professional_label || client.assigned_financial_professional)}</dd></div>
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
  const noteClass = selectedValue('#professionalNoteClassFilter');
  const notes = list(payload?.notes).filter(note =>
    !noteClass || note.information_class === noteClass
  );
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
      ${note.information_class ? `<p class="professional-information-class">${escapeHTML(t(`professionalWorkspace.noteClasses.${note.information_class}`))}</p>` : ''}
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
  const financialOnly =
    document.querySelector('#professionalFinancialQueueOnly')?.checked === true;
  const financialTypes = new Set([
    'financial_intake_received', 'bank_records_pending',
    'income_evidence_pending', 'expense_evidence_pending',
    'insurance_documents_pending', 'investment_statements_pending',
    'property_documents_pending', 'liability_details_pending',
    'calculation_review_required', 'financial_recommendation_review',
    'client_clarification_required', 'annual_review_due'
  ]);
  const tasks = list(payload?.tasks).filter(task =>
    !financialOnly || financialTypes.has(task.task_type)
  );
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
      <div>
        <strong>${escapeHTML(t('professionalWorkspace.interpretationOnly'))}</strong>
        <a href="/external-reader-intake">${escapeHTML(t('professionalWorkspace.openReaderIntake'))}</a>
      </div>
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

function renderHumanDesign() {
  const root = document.querySelector('#professionalHumanDesign');
  if (!root) return;
  const framework = payload?.external_reader_framework;
  const reader = list(framework?.readers).find(item =>
    item.reader_id === 'human_design' || item.reader_type === 'human_design'
  );
  const interpretations = list(framework?.interpretations).filter(item =>
    item.reader_type === 'human_design'
  );
  if (!reader) {
    root.innerHTML = `<p class="professional-workspace-empty">${escapeHTML(t('professionalWorkspace.noHumanDesign'))}</p>`;
    return;
  }
  root.innerHTML = `
    <header class="professional-reader-heading">
      <div><p>${escapeHTML(t('professionalWorkspace.humanDesignView'))}</p><h2>${display(localized(reader.reader_name))}</h2></div>
      <strong>${escapeHTML(t('professionalWorkspace.interpretationOnly'))}</strong>
    </header>
    <dl class="professional-meta-grid">
      <div><dt>${escapeHTML(t('professionalWorkspace.readerVersion'))}</dt><dd>${display(reader.reader_version)}</dd></div>
      <div><dt>${escapeHTML(t('professionalWorkspace.interpretationStatus'))}</dt><dd>${display(reader.interpretation_status)}</dd></div>
    </dl>
    <section class="professional-reader-records">
      <h2>${escapeHTML(t('professionalWorkspace.interpretationDrafts'))}</h2>
      ${interpretations.length
        ? `<ul>${interpretations.map(item => `<li><strong>${display(item.chart_element)}</strong><p>${display(item.interpretation)}</p></li>`).join('')}</ul>`
        : `<p class="professional-workspace-empty">${escapeHTML(t('professionalWorkspace.noInterpretations'))}</p>`}
    </section>
    <p class="professional-contract-boundary">${escapeHTML(t('professionalWorkspace.externalReaderBoundary'))}</p>
  `;
}

function renderFinancialReality() {
  const root = document.querySelector('#professionalFinancialReality');
  if (!root) return;
  const financial = payload?.financial_reality;
  if (!financial) {
    root.innerHTML = `<p class="professional-workspace-empty">${escapeHTML(t('professionalWorkspace.noFinancialReality'))}</p>`;
    return;
  }
  const sections = [
    'overview', 'objectives', 'income', 'expenses', 'assets', 'liabilities',
    'cash_flow', 'net_worth', 'insurance', 'investments', 'properties', 'tax',
    'retirement', 'education', 'estate', 'ratios', 'risks',
    'recommendations', 'documents'
  ];
  const recordValue = value => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'number') {
      return new Intl.NumberFormat(getLocale(), {
        maximumFractionDigits: 2
      }).format(value);
    }
    if (typeof value === 'boolean') return value ? '✓' : '—';
    return display(String(value));
  };
  const sectionContent = section => {
    const value = financial.sections?.[section];
    if (value?.accessible === false) {
      return `<p class="professional-workspace-empty">${escapeHTML(t('professionalWorkspace.notAuthorised'))}</p>`;
    }
    const records = Array.isArray(value) ? value : list(value?.records);
    const summary = cleanText(value?.summary);
    if (!records.length && !summary) {
      return `<p class="professional-workspace-empty">—</p>`;
    }
    return `${summary ? `<p>${display(summary)}</p>` : ''}
      ${records.length ? `<details>
        <summary>${escapeHTML(t('professionalWorkspace.financialRecordCount', { count: records.length }))}</summary>
        <div class="professional-financial-records">${records.map(record => `
          <dl>${Object.entries(record || {}).map(([key, item]) => `
            <div><dt>${escapeHTML(humanizeKey(key))}</dt><dd>${recordValue(item)}</dd></div>
          `).join('')}</dl>`).join('')}</div>
      </details>` : ''}`;
  };
  root.innerHTML = `
    <header class="professional-reader-heading">
      <div><p>${escapeHTML(t('professionalWorkspace.financialDataDate'))}</p><h2>${display(financial.data_date)}</h2></div>
      <strong>${escapeHTML(t('professionalWorkspace.financialEvidenceBoundary'))}</strong>
    </header>
    <div class="professional-reader-grid">${sections.map(section => `
      <article>
        <h3>${escapeHTML(t(`professionalWorkspace.financialSections.${section}`))}</h3>
        ${sectionContent(section)}
      </article>`).join('')}</div>
    <p class="professional-contract-boundary">${escapeHTML(t('professionalWorkspace.financialBoundary'))}</p>
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
  renderHumanDesign();
  renderFinancialReality();
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

function bindOperationalFilters() {
  document.addEventListener('change', event => {
    if (event.target.matches('#professionalFinancialClientFilter')) {
      renderClients();
    }
    if (event.target.matches('#professionalNoteClassFilter')) {
      renderNotes();
    }
    if (event.target.matches('#professionalFinancialQueueOnly')) {
      renderQueue();
    }
  });
}

initializeI18n();
bindLocaleControls();
bindViews();
bindOperationalFilters();
renderAll();
onLocaleChange(renderAll);
