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
  carrier_signatures: 'entry.evidenceTargets.carrierSignatures',
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
    runtimeEntityId: createId('rt'),
    runtimeEntryId: createId('entry')
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
    runtimeEntityId: state.runtimeEntityId,
    runtimeEntryId: state.runtimeEntryId
  });
}

function clearEntrySession() {
  sessionStorage.removeItem(SESSION.entryState);
  sessionStorage.removeItem(SESSION.entry);
  sessionStorage.removeItem(SESSION.reconstruction);
  sessionStorage.removeItem(SESSION.reconstructionInquiry);
}

function addMessage(
  role,
  message,
  includeInConversation = true,
  translationKey = ''
) {
  const value = translationKey
    ? t(translationKey)
    : cleanText(message);

  if (!value) return;

  state.messages.push({
    role,
    message: value,
    includeInConversation,
    translationKey
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
  els.chat.innerHTML = state.messages.map(item => `
    <article class="message ${item.role}">
      <div class="role">
        ${item.role === 'assistant'
          ? escapeHTML(t('entry.assistantRole'))
          : escapeHTML(t('entry.userRole'))}
      </div>
      ${escapeHTML(renderedMessage(item))}
    </article>
  `).join('');

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

function reset() {
  clearEntrySession();
  state = createInitialState();

  els.card.classList.remove('show');
  els.form.classList.remove('hidden');
  els.meter.style.width = '0%';
  els.score.textContent = '0%';
  els.input.value = '';
  els.input.disabled = false;
  els.send.disabled = false;
  els.load.textContent = '';

  renderTarget('observed_change');
  renderRound();
  emptyLiveEntry();

  addMessage(
    'assistant',
    '',
    true,
    'entry.firstQuestion'
  );
}

async function submit(rawMessage) {
  if (state.processing || state.ready) return;

  const message = cleanText(rawMessage);

  if (!message) {
    els.load.textContent = t('entry.emptyMessage');
    return;
  }

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
      evidenceDepth: state.evidenceDepth
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
      'entry.requestFailed'
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

els.new.addEventListener('click', reset);

els.depth?.addEventListener('change', event => {
  const value = cleanText(event.target?.value);
  if (!EVIDENCE_DEPTHS[value]) return;
  state.evidenceDepth = value;
  renderRound();
  persistEntryState();
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
  els.input.focus();
  persistEntryState();
});

els.continue.addEventListener('click', () => {
  persistEntryState();
  location.href = '/reality-reconstruction';
});

onLocaleChange(() => {
  renderChat();
  renderRound();

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

const initial = cleanText(
  getSession(SESSION.initial) || ''
);

if (initial) {
  sessionStorage.removeItem(SESSION.initial);
  reset();
  submit(initial);
} else if (!restoreEntryState()) {
  reset();
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

  if (!result && restoredConversation.length === 0) return false;

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
      createId('entry'),
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
    processing: false,
    revision: revisionRequested,
    ready: revisionRequested ? false : Boolean(result?.entryComplete)
  };

  const depthInput = document.querySelector(
    `input[name="evidenceDepth"][value="${state.evidenceDepth}"]`
  );
  if (depthInput) depthInput.checked = true;

  els.card.classList.remove('show');
  els.form.classList.toggle('hidden', state.ready);
  els.input.value = '';
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
    state.lastQuestionTarget = 'revision';
    const lastMessage = state.messages.at(-1);
    if (lastMessage?.translationKey !== 'entry.correctionQuestion') {
      addMessage('assistant', '', true, 'entry.correctionQuestion');
    }
    els.form.classList.remove('hidden');
    els.input.disabled = false;
    els.send.disabled = false;
    renderTarget('revision');
  }

  if (result && state.ready) {
    setSession(SESSION.entry, result);
  }

  persistEntryState();
  return true;
}
