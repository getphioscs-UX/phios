import {
  SESSION,
  cleanText,
  qs,
  setSession,
  getSession,
  safeJSON,
  postJSON,
  escapeHTML,
  createId
} from './shared.js';

import { initializeRuntimeWorkspace } from './modules/runtime-workspace.js';
import { initializeNewRuntimeEntry } from './modules/runtime-revision-initializer.js';
import {
  RUNTIME_PERSISTENCE_KEYS,
  clearPersistedRuntime,
  loadRuntimeSnapshot
} from './modules/runtime-persistence.js';

import {
  initializeI18n,
  onLocaleChange,
  t,
  withLanguageContract
} from './i18n.js';

const EVIDENCE_DEPTHS = Object.freeze({
  quick: { minimum: 3, maximum: 4 },
  guided: { minimum: 5, maximum: 7 },
  deep: { minimum: 7, maximum: 10 }
});

const REALITY_COORDINATES = Object.freeze([
  'body_health',
  'relationships_family',
  'work_career',
  'money_resources',
  'learning_growth',
  'meaning_purpose',
  'environment_place',
  'unsure'
]);

const REALITY_COORDINATE_MAXIMUM = 2;
const REALITY_COORDINATE_UNSURE = 'unsure';
const EXPLICIT_ENTRY_MODES = new Set([
  'resume',
  'revise',
  'new-runtime'
]);

const REALITY_COORDINATE_TRANSLATION_KEYS = Object.freeze({
  body_health: 'entry.guided.coordinates.bodyHealth',
  relationships_family: 'entry.guided.coordinates.relationshipsFamily',
  work_career: 'entry.guided.coordinates.workCareer',
  money_resources: 'entry.guided.coordinates.moneyResources',
  learning_growth: 'entry.guided.coordinates.learningGrowth',
  meaning_purpose: 'entry.guided.coordinates.meaningPurpose',
  environment_place: 'entry.guided.coordinates.environmentPlace',
  unsure: 'entry.guided.coordinates.unsure'
});

function currentDepth() {
  return EVIDENCE_DEPTHS[state?.evidenceDepth] || EVIDENCE_DEPTHS.guided;
}

const TARGET_TRANSLATION_KEYS = Object.freeze({
  reality_change: 'fields.observedChange',
  observed_change: 'fields.observedChange',
  timing: 'fields.timeSignal',
  time_signal: 'fields.timeSignal',
  trigger: 'fields.trigger',
  context: 'fields.context',
  affected_domains: 'fields.affectedReality',
  affected_reality: 'fields.affectedReality',
  evidence: 'fields.evidence',
  counter_evidence: 'fields.counterEvidence',
  dependencies: 'fields.dependencies',
  dependency: 'fields.dependencies',
  reported_experience: 'fields.reportedExperience',
  interpretation: 'fields.interpretation',
  professional_assessment: 'fields.professionalAssessment',
  current_tension: 'fields.currentTension',
  desired_transition: 'fields.desiredTransition',
  unknown_reality: 'fields.unknownReality',
  carrier_coordinates: 'entry.evidenceTargets.carrierCoordinates',
  runtime_conditions: 'entry.evidenceTargets.runtimeConditions',
  experience_style: 'entry.evidenceTargets.experienceStyle',
  expression_style: 'entry.evidenceTargets.expressionStyle',
  agency_style: 'entry.evidenceTargets.agencyStyle',
  identity_style: 'entry.evidenceTargets.identityStyle',
  revision: 'entry.correctOrClarify',
  ready: 'status.complete',
  none: 'status.complete'
});

initializeI18n();
initializeRuntimeWorkspace({ currentStage: 'entry' });
const entryInitialization = initializeNewRuntimeEntry();

const els = {
  chat: qs('#chat'),
  form: qs('#chatForm'),
  input: qs('#messageInput'),
  send: qs('#sendButton'),
  load: qs('#loadingText'),
  new: qs('#newSessionButton'),
  meter: qs('#maturityMeter'),
  score: qs('#maturityScore'),
  target: qs('#nextTarget'),
  round: qs('#roundIndicator'),
  depth: qs('#evidenceDepth'),
  guided: qs('#guidedEntry'),
  coordinates: qs('#realityCoordinates'),
  coordinateStatus: qs('#coordinateStatus'),
  coordinateContinue: qs('#coordinateContinueButton'),
  sendLabel: qs('#sendButtonLabel'),
  questionLabel: qs('#entryQuestionLabel'),
  recoveryGate: qs('#entryRecoveryGate'),
  recoverySavedAt: qs('#entryRecoverySavedAt'),
  resumeEntry: qs('#resumeEntryButton'),
  startFreshEntry: qs('#startFreshEntryButton'),
  runtimeWorkspaceLayout: qs('#runtimeWorkspaceLayout'),
  card: qs('#entryCard'),
  cardBody: qs('#entryCardBody'),
  continue: qs('#continueButton'),
  revise: qs('#reviseButton'),
  live: {
    change: qs('#liveChange'),
    timing: qs('#liveTiming'),
    domains: qs('#liveDomains'),
    known: qs('#liveKnown'),
    unknown: qs('#liveUnknown'),
    tension: qs('#liveTension'),
    direction: qs('#liveDirection')
  }
};

let state = createInitialState();
let entryBooted = false;

function createInitialState() {
  return {
    messages: [],
    round: 0,
    processing: false,
    revision: false,
    latest: null,
    ready: false,
    lastQuestionTarget: 'observed_change',
    askedTargets: ['observed_change'],
    answerBindings: [],
    evidenceDepth: 'guided',
    realityCoordinates: [],
    guidedStep: 'coordinate',
    pendingObservation: '',
    runtimeEntityId: entryInitialization?.runtimeEntityId || createId('rt'),
    runtimeEntryId: entryInitialization?.runtimeEntryId || createId('entry'),
    runtimeId: entryInitialization?.runtimeId || createId('runtime'),
    continuityHandoff: entryInitialization?.continuityContext || null
  };
}

function persistEntryState() {
  setSession(SESSION.entryState, {
    messages: state.messages,
    round: state.round,
    revision: state.revision,
    latest: state.latest,
    ready: state.ready,
    lastQuestionTarget: state.lastQuestionTarget,
    askedTargets: state.askedTargets,
    answerBindings: state.answerBindings,
    evidenceDepth: state.evidenceDepth,
    realityCoordinates: state.realityCoordinates,
    guidedStep: state.guidedStep,
    pendingObservation: state.pendingObservation,
    runtimeEntityId: state.runtimeEntityId,
    runtimeEntryId: state.runtimeEntryId,
    runtimeId: state.runtimeId,
    continuityHandoff: state.continuityHandoff
  });
}

function clearEntrySession() {
  sessionStorage.removeItem(SESSION.entryState);
  sessionStorage.removeItem(SESSION.entry);
  sessionStorage.removeItem(SESSION.reconstruction);
  sessionStorage.removeItem(SESSION.reconstructionInquiry);
}

function clearBrowserRuntimeRecovery() {
  RUNTIME_PERSISTENCE_KEYS.forEach(key => {
    sessionStorage.removeItem(key);
  });
  clearPersistedRuntime();
}

function currentEntryMode() {
  return cleanText(
    new URLSearchParams(location.search).get('mode')
  );
}

function hasRecoverableEntry() {
  return Boolean(
    getSession(SESSION.entryState) ||
    getSession(SESSION.entry)
  );
}

function recoverySavedAt() {
  const snapshot = loadRuntimeSnapshot();
  return cleanText(snapshot?.updatedAt || snapshot?.savedAt);
}

function formatRecoveryDate(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    return t('entry.recoveryGate.savedUnknown');
  }

  return t('entry.recoveryGate.savedAt', {
    date: new Intl.DateTimeFormat(
      document.documentElement.lang || 'en',
      {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    ).format(date)
  });
}

function renderRecoveryGate() {
  if (els.recoverySavedAt) {
    els.recoverySavedAt.textContent = formatRecoveryDate(
      recoverySavedAt()
    );
  }
}

function showRecoveryGate() {
  document.body.dataset.entryRecovery = 'awaiting-consent';
  els.recoveryGate?.classList.remove('hidden');
  els.runtimeWorkspaceLayout?.setAttribute('aria-hidden', 'true');
  renderRecoveryGate();
  els.resumeEntry?.focus();
}

function openEntryWorkspace() {
  document.body.dataset.entryRecovery = 'ready';
  els.recoveryGate?.classList.add('hidden');
  els.runtimeWorkspaceLayout?.removeAttribute('aria-hidden');
}

function addMessage(
  role,
  message,
  includeInConversation = true,
  translationKey = '',
  tone = ''
) {
  const value = translationKey
    ? t(translationKey)
    : cleanText(message);

  if (!value) return;

  state.messages.push({
    role,
    message: value,
    includeInConversation,
    translationKey,
    tone
  });

  renderChat();
  persistEntryState();
}

function renderedMessage(item) {
  return item.translationKey
    ? t(item.translationKey)
    : item.message;
}

function renderChat() {
  els.chat.innerHTML = state.messages.map(item => {
    const tone = item.tone === 'error' ? ' is-error' : '';
    const alert = item.tone === 'error'
      ? ' role="alert" aria-atomic="true"'
      : '';

    return `
    <article class="message ${item.role}${tone}"${alert}>
      <div class="role">
        ${item.tone === 'error'
          ? escapeHTML(t('entry.errorLabel'))
          : item.role === 'assistant'
          ? escapeHTML(t('entry.assistantRole'))
          : escapeHTML(t('entry.userRole'))}
      </div>
      ${escapeHTML(renderedMessage(item))}
    </article>
  `;
  }).join('');

  els.chat.scrollTop = els.chat.scrollHeight;
}

function conversation() {
  return state.messages
    .filter(item => item.includeInConversation !== false)
    .map(item => ({
      role: item.role,
      content: renderedMessage(item)
    }));
}

function setBusy(value, text = '') {
  state.processing = value;
  els.input.disabled = value || state.ready;
  els.send.disabled = value || state.ready;
  els.load.textContent = text;
  els.load.dataset.tone = value && text ? 'loading' : '';
  renderRealityCoordinates();
}

function normalizeRealityCoordinates(values) {
  const normalized = Array.isArray(values)
    ? [...new Set(values.map(cleanText))]
        .filter(value => REALITY_COORDINATES.includes(value))
    : [];

  if (normalized.includes(REALITY_COORDINATE_UNSURE)) {
    return [REALITY_COORDINATE_UNSURE];
  }

  return normalized.slice(0, REALITY_COORDINATE_MAXIMUM);
}

function renderPrimaryAction() {
  if (!els.sendLabel) return;

  els.sendLabel.textContent =
    state.round === 0 && !state.revision
      ? t('entry.guided.beginAction')
      : t('common.continue');
}

function realityCoordinateName(value) {
  const key = REALITY_COORDINATE_TRANSLATION_KEYS[value];
  return key
    ? t(key)
    : '';
}

function renderEntryQuestion() {
  if (!els.questionLabel) return;

  const coordinates = state.realityCoordinates
    .filter(value => value !== REALITY_COORDINATE_UNSURE)
    .map(realityCoordinateName)
    .filter(Boolean)
    .join(' · ');

  els.questionLabel.textContent = coordinates
    ? t('entry.guided.questionWithCoordinate', { coordinates })
    : t('entry.guided.question');
}

function renderEntryPhase() {
  const opening =
    state.guidedStep === 'coordinate' &&
    state.round === 0 &&
    !state.revision &&
    !state.ready;

  els.guided?.classList.toggle('hidden', !opening);
  els.depth?.classList.toggle('hidden', opening);
  els.chat?.classList.toggle('hidden', opening);
  els.form?.classList.toggle('hidden', opening || state.ready);
}

function renderRealityCoordinates(notice = '') {
  if (!els.coordinates) return;

  const selected = new Set(state.realityCoordinates);
  const unsureSelected = selected.has(REALITY_COORDINATE_UNSURE);
  const maximumReached =
    selected.size >= REALITY_COORDINATE_MAXIMUM &&
    !unsureSelected;
  const legacyRoundLock =
    state.round > 0 || state.revision || state.ready;
  const locked =
    state.guidedStep !== 'coordinate' ||
    legacyRoundLock ||
    state.processing;

  els.coordinates
    .querySelectorAll('input[name="realityCoordinate"]')
    .forEach(input => {
      const isSelected = selected.has(input.value);
      const unavailable =
        locked ||
        (unsureSelected && input.value !== REALITY_COORDINATE_UNSURE) ||
        (maximumReached && !isSelected);

      input.checked = isSelected;
      input.disabled = unavailable;
      input.closest('label')?.classList.toggle('is-selected', isSelected);
      input.closest('label')?.classList.toggle('is-disabled', unavailable);
    });

  renderEntryPhase();
  renderEntryQuestion();

  if (!els.coordinateStatus) return;

  els.coordinateStatus.dataset.tone =
    notice === 'required' ? 'error' :
    notice === 'limit' ? 'limit' :
    '';

  if (notice === 'required') {
    els.coordinateStatus.textContent = t(
      'entry.guided.requiredStatus'
    );
  } else if (notice === 'limit') {
    els.coordinateStatus.textContent = t('entry.guided.limitStatus', {
      max: REALITY_COORDINATE_MAXIMUM
    });
  } else if (unsureSelected) {
    els.coordinateStatus.textContent = t('entry.guided.unsureStatus');
  } else if (selected.size > 0) {
    els.coordinateStatus.textContent = t('entry.guided.selectedStatus', {
      count: selected.size,
      max: REALITY_COORDINATE_MAXIMUM
    });
  } else {
    els.coordinateStatus.textContent = t('entry.guided.optionalStatus');
  }
}

function updateRealityCoordinate(input) {
  const value = cleanText(input?.value);
  if (!REALITY_COORDINATES.includes(value)) return;

  if (value === REALITY_COORDINATE_UNSURE && input.checked) {
    state.realityCoordinates = [REALITY_COORDINATE_UNSURE];
  } else {
    const selected = new Set(
      state.realityCoordinates.filter(
        coordinate => coordinate !== REALITY_COORDINATE_UNSURE
      )
    );

    if (input.checked) selected.add(value);
    else selected.delete(value);

    if (selected.size > REALITY_COORDINATE_MAXIMUM) {
      input.checked = false;
      renderRealityCoordinates('limit');
      return;
    }

    state.realityCoordinates = [...selected];
  }

  /*
   * Client-only reported orientation. It is intentionally excluded from
   * the Runtime Entry API payload, answer bindings and Entry question count.
   */
  renderRealityCoordinates();
  persistEntryState();
}

function continueFromRealityCoordinate() {
  if (!state.realityCoordinates.length) {
    renderRealityCoordinates('required');
    els.coordinates
      ?.querySelector('input[name="realityCoordinate"]')
      ?.focus();
    return;
  }

  state.guidedStep = 'observation';
  renderRealityCoordinates();

  if (!state.messages.length) {
    addMessage(
      'assistant',
      '',
      true,
      'entry.firstQuestion'
    );
  }

  if (state.pendingObservation) {
    els.input.value = state.pendingObservation;
  }

  renderEntryQuestion();
  renderEntryPhase();
  persistEntryState();
  els.input.focus();
}

function normalizedText(
  value,
  fallback = t('entry.notYetEstablished')
) {
  const text = cleanText(value);
  return text || fallback;
}

function toList(items, kind = 'statement') {
  if (!Array.isArray(items) || items.length === 0) {
    return `<p>${escapeHTML(t('entry.notYetEstablished'))}</p>`;
  }

  const values = items
    .map(item => (
      typeof item === 'string'
        ? item
        : item?.[kind] ||
          item?.question ||
          item?.domain ||
          item?.sourceText ||
          ''
    ))
    .filter(Boolean);

  if (!values.length) {
    return `<p>${escapeHTML(t('entry.notYetEstablished'))}</p>`;
  }

  return `
    <ul>
      ${values
        .map(value => `<li>${escapeHTML(value)}</li>`)
        .join('')}
    </ul>
  `;
}

function entryUnderstanding(entry = {}) {
  const values = [
    ...(Array.isArray(entry.knownReality)
      ? entry.knownReality
      : []),
    ...(Array.isArray(entry.initialContext?.relevantConditions)
      ? entry.initialContext.relevantConditions
      : [])
  ];

  const seen = new Set();

  return values.filter(item => {
    const value = cleanText(
      typeof item === 'string'
        ? item
        : item?.statement ||
          item?.summary ||
          item?.sourceText ||
          ''
    );

    const key = value.toLowerCase();
    if (!value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function revisionBindingStatements(bindings = []) {
  const seen = new Set();

  return (Array.isArray(bindings) ? bindings : [])
    .filter(binding =>
      binding &&
      typeof binding === 'object' &&
      (
        binding.revision === true ||
        cleanText(binding.target) === 'revision'
      )
    )
    .map(binding => cleanText(binding.content))
    .filter(value => {
      const key = value.toLowerCase();
      if (!value || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function captureBoundRevisions(result, bindings = []) {
  const entry = result?.runtimeEntry;
  const statements = revisionBindingStatements(bindings);

  if (!entry || statements.length === 0) return result;

  const itemValue = item => cleanText(
    typeof item === 'string'
      ? item
      : item?.statement || item?.summary || ''
  );

  const mergeItems = (...collections) => {
    const seen = new Set();

    return collections
      .flatMap(items => Array.isArray(items) ? items : [])
      .filter(item => {
        const key = itemValue(item).toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  };

  const entryEvidence = mergeItems(
    entry.entryEvidence,
    statements.map(statement => ({
      evidenceType: 'user_statement',
      source: 'entry_revision_session',
      statement,
      confidence: 1
    }))
  ).map((item, index) => ({
    ...item,
    evidenceId: `ev_${String(index + 1).padStart(3, '0')}`
  }));

  return {
    ...result,
    runtimeEntry: {
      ...entry,
      knownReality: mergeItems(
        entry.knownReality,
        statements.map(statement => ({
          statement,
          supportedBy: [],
          confidence: 1
        }))
      ),
      entryEvidence,
      evidenceBoundary: {
        ...(entry.evidenceBoundary || {}),
        reportedExperience: mergeItems(
          entry.evidenceBoundary?.reportedExperience,
          statements
        )
      }
    }
  };
}

function humanizeMachineValue(value) {
  return cleanText(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

function translateTarget(value) {
  const normalized = cleanText(value).toLowerCase();
  const key = TARGET_TRANSLATION_KEYS[normalized];

  return key
    ? t(key)
    : humanizeMachineValue(normalized) || t('common.unknown');
}

function translateDomain(value) {
  const normalized = cleanText(value).toLowerCase();

  if (!normalized) {
    return t('common.unknown');
  }

  return t(
    `domains.${normalized}`,
    {},
    humanizeMachineValue(normalized)
  );
}

function renderRound() {
  els.round.textContent = t('entry.roundProgress', {
    current: state.round,
    max: currentDepth().maximum
  });
  renderPrimaryAction();
  renderRealityCoordinates();
}

function renderTarget(target = 'observed_change') {
  els.target.dataset.runtimeTarget = target;
  els.target.textContent = translateTarget(target);
}

function setFieldState(field, hasValue) {
  const block = document.querySelector(
    `[data-live-field="${field}"]`
  );

  if (block) {
    block.classList.toggle('is-empty', !hasValue);
  }
}

function emptyLiveEntry() {
  els.live.change.textContent = t('entry.waitingForObservation');
  els.live.timing.textContent = t('entry.notYetEstablished');
  els.live.domains.innerHTML = `
    <span>${escapeHTML(t('entry.notYetEstablished'))}</span>
  `;
  els.live.known.innerHTML = `
    <p>${escapeHTML(t('entry.unclassifiedEvidence'))}</p>
  `;
  els.live.unknown.innerHTML = `
    <p>${escapeHTML(t('entry.unresolvedPreserved'))}</p>
  `;
  els.live.tension.textContent = t('entry.notYetEstablished');
  els.live.direction.textContent = t('entry.directionPending');

  document
    .querySelectorAll('.live-entry-block')
    .forEach(block => block.classList.add('is-empty'));
}

function renderLiveEntry(entry = {}) {
  const change =
    entry.realityChange?.normalizedStatement ||
    entry.realityChange?.rawStatement ||
    '';

  const timing =
    entry.timing?.normalizedTiming ||
    entry.timing?.statedTiming ||
    '';

  const domains = Array.isArray(entry.affectedDomains)
    ? entry.affectedDomains
    : [];

  const known = Array.isArray(entry.knownReality)
    ? entry.knownReality
    : [];

  const unknown = Array.isArray(entry.unknownReality)
    ? entry.unknownReality
    : [];

  const tension = entry.emergingTension?.summary || '';
  const direction = entry.reconstructionDirection?.focus || '';

  els.live.change.textContent = normalizedText(
    change,
    t('entry.waitingForObservation')
  );

  els.live.timing.textContent = normalizedText(timing);

  els.live.domains.innerHTML = domains.length
    ? domains
        .map(item => `
          <span>${escapeHTML(translateDomain(item.domain))}</span>
        `)
        .join('')
    : `<span>${escapeHTML(t('entry.notYetEstablished'))}</span>`;

  els.live.known.innerHTML = toList(known);
  els.live.unknown.innerHTML = toList(unknown, 'question');
  els.live.tension.textContent = normalizedText(tension);
  els.live.direction.textContent = normalizedText(
    direction,
    t('entry.directionPending')
  );

  setFieldState('change', Boolean(change));
  setFieldState('timing', Boolean(timing));
  setFieldState('domains', domains.length > 0);
  setFieldState('known', known.length > 0);
  setFieldState('unknown', unknown.length > 0);
  setFieldState('tension', Boolean(tension));
  setFieldState('direction', Boolean(direction));
}

function renderReadyCard(entry = {}) {
  const domains = (entry.affectedDomains || [])
    .map(item => translateDomain(item.domain))
    .filter(Boolean);

  els.cardBody.innerHTML = `
    <div class="data-block">
      <h4>${escapeHTML(t('entry.card.observedChange'))}</h4>
      <p>${escapeHTML(normalizedText(
        entry.realityChange?.normalizedStatement
      ))}</p>
    </div>

    <div class="data-block">
      <h4>${escapeHTML(t('entry.card.timeSignal'))}</h4>
      <p>${escapeHTML(normalizedText(
        entry.timing?.normalizedTiming || entry.timing?.statedTiming,
        t('common.unknown')
      ))}</p>
    </div>

    <div class="data-block">
      <h4>${escapeHTML(t('entry.card.affectedReality'))}</h4>
      <p>${escapeHTML(
        domains.join(' · ') || t('entry.notYetEstablished')
      )}</p>
    </div>

    <div class="data-block">
      <h4>${escapeHTML(t('entry.card.currentUnderstanding'))}</h4>
      ${toList(entryUnderstanding(entry))}
    </div>

    <div class="data-block">
      <h4>${escapeHTML(t('entry.card.evidence'))}</h4>
      ${toList(entry.entryEvidence)}
    </div>

    <div class="data-block">
      <h4>${escapeHTML(t('entry.card.unresolvedReality'))}</h4>
      ${toList(entry.unknownReality, 'question')}
    </div>

    <div class="data-block">
      <h4>${escapeHTML(t('entry.card.emergingTension'))}</h4>
      <p>${escapeHTML(normalizedText(
        entry.emergingTension?.summary
      ))}</p>
    </div>

    <div class="data-block">
      <h4>${escapeHTML(t('entry.card.nextDirection'))}</h4>
      <p>${escapeHTML(normalizedText(
        entry.reconstructionDirection?.focus
      ))}</p>
    </div>
  `;

  els.card.classList.add('show');
}

function renderResultState(result) {
  const entry = result.runtimeEntry || {};
  const maturity = Math.round(
    (
      entry.entryAssessment?.maturityScore ||
      result.assessment?.entry_completeness ||
      0
    ) * 100
  );

  els.meter.style.width = `${maturity}%`;
  els.score.textContent = `${maturity}%`;

  renderTarget(
    result.assessment?.next_question_target || 'ready'
  );

  renderRound();
  renderLiveEntry(entry);

  if (state.ready) {
    renderReadyCard(entry);
  }
}

function applyResult(result) {
  result = captureBoundRevisions(
    result,
    state.answerBindings
  );

  state.latest = result;
  state.ready = Boolean(result.entryComplete);

  const nextTarget = cleanText(
    result.assessment?.next_question_target
  );

  if (!state.ready && nextTarget && nextTarget !== 'none') {
    state.lastQuestionTarget = nextTarget;
    if (!state.askedTargets.includes(nextTarget)) {
      state.askedTargets.push(nextTarget);
    }
  }

  renderResultState(result);

  if (state.ready) {
    els.form.classList.add('hidden');
    setSession(SESSION.entry, result);
    persistEntryState();
    return;
  }

  addMessage(
    'assistant',
    result.reply || result.assistant_message
  );
}

function reset(pendingObservation = '') {
  clearEntrySession();
  state = createInitialState();
  state.pendingObservation = cleanText(pendingObservation);

  els.card.classList.remove('show');
  els.meter.style.width = '0%';
  els.score.textContent = '0%';
  els.input.value = '';
  els.input.disabled = false;
  els.send.disabled = false;
  els.load.textContent = '';

  renderTarget('observed_change');
  renderChat();
  renderRound();
  emptyLiveEntry();
}

async function submit(rawMessage) {
  if (state.processing || state.ready) return;
  if (state.guidedStep === 'coordinate') {
    continueFromRealityCoordinate();
    return;
  }

  const message = cleanText(rawMessage);

  if (!message) {
    els.load.textContent = t('entry.emptyMessage');
    els.load.dataset.tone = 'error';
    els.input.setAttribute('aria-invalid', 'true');
    els.input.focus();
    return;
  }

  els.load.dataset.tone = '';
  els.input.removeAttribute('aria-invalid');
  state.messages = state.messages.filter(item => item.tone !== 'error');
  state.pendingObservation = '';

  state.answerBindings.push({
    target: state.lastQuestionTarget,
    content: message,
    revision: state.revision
  });

  addMessage('user', message);
  els.input.value = '';
  setBusy(true, t('entry.sending'));

  try {
    const attemptedRound = state.revision
      ? state.round
      : Math.min(currentDepth().maximum, state.round + 1);

    const payload = withLanguageContract({
      conversation: conversation(),
      entryRound: attemptedRound,
      mode: state.revision ? 'revision' : 'guided',
      currentReading: state.latest,
      runtimeEntityId: state.runtimeEntityId,
      runtimeEntryId: state.runtimeEntryId,
      answerTarget: state.lastQuestionTarget,
      lastQuestionTarget: state.lastQuestionTarget,
      askedTargets: state.askedTargets,
      answerBindings: state.answerBindings,
      evidenceDepth: state.evidenceDepth,
      continuityContext: state.continuityHandoff
    }, message);

    const result = await postJSON(
      '/api/reconstruct-reality',
      payload
    );

    state.round = result.entry_round ?? attemptedRound;
    state.revision = false;
    applyResult(result);
  } catch (error) {
    console.error('Reality Entry request failed:', error);

    addMessage(
      'assistant',
      '',
      false,
      'entry.requestFailed',
      'error'
    );
  } finally {
    setBusy(false);
  }
}

els.form.addEventListener('submit', event => {
  event.preventDefault();
  submit(els.input.value);
});

els.input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    els.form.requestSubmit();
  }
});

els.input.addEventListener('input', () => {
  if (els.load.dataset.tone !== 'error') return;
  els.load.textContent = '';
  els.load.dataset.tone = '';
  els.input.removeAttribute('aria-invalid');
});

els.new.addEventListener('click', () => {
  clearBrowserRuntimeRecovery();
  location.replace('/reality-entry');
});

els.depth?.addEventListener('change', event => {
  const value = cleanText(event.target?.value);
  if (!EVIDENCE_DEPTHS[value]) return;
  state.evidenceDepth = value;
  renderRound();
  persistEntryState();
});

els.coordinates?.addEventListener('change', event => {
  const input = event.target.closest(
    'input[name="realityCoordinate"]'
  );
  if (input) updateRealityCoordinate(input);
});

els.coordinateContinue?.addEventListener(
  'click',
  continueFromRealityCoordinate
);

els.resumeEntry?.addEventListener('click', () => {
  openEntryWorkspace();
  bootEntry();
});

els.startFreshEntry?.addEventListener('click', () => {
  clearBrowserRuntimeRecovery();
  location.replace('/reality-entry');
});

els.revise.addEventListener('click', () => {
  state.ready = false;
  state.revision = true;
  state.lastQuestionTarget = 'revision';

  els.card.classList.remove('show');
  els.form.classList.remove('hidden');

  addMessage(
    'assistant',
    '',
    true,
    'entry.correctionQuestion'
  );

  els.input.disabled = false;
  els.send.disabled = false;
  renderTarget('revision');
  renderPrimaryAction();
  renderRealityCoordinates();
  els.input.focus();
  persistEntryState();
});

els.continue.addEventListener('click', () => {
  persistEntryState();
  location.href = '/reality-reconstruction';
});

onLocaleChange(() => {
  if (!entryBooted) {
    renderRecoveryGate();
    return;
  }

  renderChat();
  renderRound();
  renderPrimaryAction();
  renderRealityCoordinates();

  if (state.latest) {
    renderResultState(state.latest);
  } else {
    renderTarget('observed_change');
    emptyLiveEntry();
  }

  if (state.processing) {
    els.load.textContent = t('entry.sending');
  }
});

function bootEntry() {
  if (entryBooted) return;
  entryBooted = true;
  openEntryWorkspace();

  const initial = cleanText(
    getSession(SESSION.initial) || ''
  );

  if (initial) {
    sessionStorage.removeItem(SESSION.initial);
    reset(initial);
  } else if (!restoreEntryState()) {
    reset();
  }
}

function restoreEntryState() {
  const saved = safeJSON(
    getSession(SESSION.entryState),
    null
  );

  const savedResult = safeJSON(
    getSession(SESSION.entry),
    null
  );

  if (!saved && !savedResult) return false;

  const revisionRequested =
    new URLSearchParams(location.search).get('mode') === 'revise';

  const result = captureBoundRevisions(
    saved?.latest || savedResult,
    saved?.answerBindings
  );
  const restoredConversation = Array.isArray(saved?.messages)
    ? saved.messages
    : (Array.isArray(result?.conversation)
        ? result.conversation.map(item => ({
            role: item.role,
            message: item.content,
            includeInConversation: true,
            translationKey: ''
          }))
        : []);

  const hasOpeningState = Boolean(
    saved &&
    (
      Array.isArray(saved.realityCoordinates) ||
      saved.guidedStep ||
      cleanText(saved.pendingObservation)
    )
  );

  if (
    !result &&
    restoredConversation.length === 0 &&
    !hasOpeningState
  ) return false;

  state = {
    ...createInitialState(),
    ...saved,
    messages: restoredConversation,
    latest: result || null,
    runtimeEntityId:
      saved?.runtimeEntityId ||
      result?.runtimeEntry?.runtimeEntityId ||
      createId('rt'),
    runtimeEntryId:
      saved?.runtimeEntryId ||
      result?.runtimeEntry?.runtimeEntryId ||
      entryInitialization?.runtimeEntryId ||
      createId('entry'),
    runtimeId:
      saved?.runtimeId ||
      entryInitialization?.runtimeId ||
      createId('runtime'),
    continuityHandoff:
      saved?.continuityHandoff ||
      entryInitialization?.continuityContext ||
      null,
    round:
      Number(saved?.round ?? result?.entry_round ?? 0),
    askedTargets:
      Array.isArray(saved?.askedTargets)
        ? [...new Set(saved.askedTargets)]
        : [],
    answerBindings:
      Array.isArray(saved?.answerBindings)
        ? saved.answerBindings
        : [],
    realityCoordinates: normalizeRealityCoordinates(
      saved?.realityCoordinates
    ),
    guidedStep:
      revisionRequested ||
      result ||
      Number(saved?.round || 0) > 0 ||
      saved?.guidedStep === 'observation'
        ? 'observation'
        : 'coordinate',
    pendingObservation: cleanText(saved?.pendingObservation),
    processing: false,
    revision: revisionRequested,
    ready: revisionRequested ? false : Boolean(result?.entryComplete)
  };

  const depthInput = document.querySelector(
    `input[name="evidenceDepth"][value="${state.evidenceDepth}"]`
  );
  if (depthInput) depthInput.checked = true;

  els.card.classList.remove('show');
  els.input.value =
    state.guidedStep === 'observation'
      ? state.pendingObservation
      : '';
  els.input.disabled = state.ready;
  els.send.disabled = state.ready;
  els.load.textContent = '';

  renderChat();
  renderRound();

  if (result) {
    renderResultState(result);
  } else {
    renderTarget(state.lastQuestionTarget || 'observed_change');
    emptyLiveEntry();
  }

  if (revisionRequested) {
    const requestedTarget = cleanText(
      new URLSearchParams(location.search).get('target')
    );
    state.lastQuestionTarget = requestedTarget || 'revision';
    const lastMessage = state.messages.at(-1);
    if (lastMessage?.translationKey !== 'entry.correctionQuestion') {
      addMessage('assistant', '', true, 'entry.correctionQuestion');
    }
    els.form.classList.remove('hidden');
    els.input.disabled = false;
    els.send.disabled = false;
    renderTarget(state.lastQuestionTarget);
  }

  if (result && state.ready) {
    setSession(SESSION.entry, result);
  }

  persistEntryState();
  return true;
}

if (
  hasRecoverableEntry() &&
  !EXPLICIT_ENTRY_MODES.has(currentEntryMode())
) {
  showRecoveryGate();
} else {
  bootEntry();
}
