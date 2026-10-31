import { getLocale, onLocaleChange } from '../i18n.js';
import { askPhios } from '../knowledge/ask-phios-client.js';
import { isAnswerQuestionRelevant } from '../knowledge/answer-relevance-guard.js';

const root = document.querySelector('[data-cka-root]');
const form = document.querySelector('[data-cka-composer]');
const input = document.querySelector('[data-cka-question]');
const status = document.querySelector('[data-cka-status]');
const answerRoot = document.querySelector('[data-cka-answer]');
const followUpForm = document.querySelector('[data-cka-follow-up-form]');
const followUpInput = document.querySelector('[data-cka-follow-up-question]');
const followUpStatus = document.querySelector('[data-cka-follow-up-boundary]');
const guidedOpen = document.querySelector('[data-cka-guided-open]');
const guidedForm = document.querySelector('[data-cka-guided-form]');
const guidedStatus = document.querySelector('[data-cka-guided-status]');
const journey = document.querySelector('[data-cka-journey]');
const journeyReason = document.querySelector('[data-cka-journey-reason]');
const journeyPrepare = document.querySelector('[data-cka-journey-prepare]');
const journeyConsent = document.querySelector('[data-cka-journey-consent]');
const journeyConsentCheckbox = document.querySelector('[data-cka-journey-consent-checkbox]');
const journeyHandoff = document.querySelector('[data-cka-journey-handoff]');
const journeyStatus = document.querySelector('[data-cka-journey-status]');
const contextIndicator = document.querySelector('[data-cka-context-indicator]');

const state = {
  firstQuestion: '',
  followUpDepth: 0,
  clientAnswer: null,
  envelope: null,
  payload: null,
  guidedFields: null,
  complexity: null,
  busy: false
};

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const safeHref = value => {
  const href = String(value || '');
  return href.startsWith('/') || /^https:\/\//i.test(href) ? href : null;
};

function copy() {
  if (getLocale() === 'zh-Hans') {
    return {
      contextGlobal: '正在向 PHI OS 提问',
      contextAbout: '正在询问',
      idle: '输入问题即可开始 Simple Ask。',
      loading: '正在读取受治理的 PHI OS 知识…',
      failed: '目前无法完成 Ask PHI OS 回答。',
      notSimple: '这个问题已超出 Simple Ask 边界。请先缩小问题，或从一个知识问题开始；系统不会自动启动 Reality Journey。',
      complete: '回答已准备好',
      followLimit: 'Guest 可进行一次临时追问；不会保存历史。',
      followDone: 'Guest 临时追问已使用；没有保存历史。',
      emptyWhy: '目前没有足够依据补充机制解释。',
      emptyObserve: '目前没有足够依据提出更具体的可观察讯号。',
      emptyUnknown: '仍保留一般不确定性与适用边界。',
      emptyRelated: '目前没有来自受治理关系权威的 Related Knowledge。',
      emptySources: '目前没有可显示的受治理来源。',
      openKnowledge: '打开知识内容',
      preparingContext: '正在以临时 Guided Context 重新检索同一个 Grounded Answer runtime…',
      contextDone: 'Guided Context 已应用；这是分类与路由讯号，不是诊断，也不是完整 ICR。',
      noJourney: '当前结构仍可留在 Ask / Guided Context；未自动建议 Reality Journey。',
      currentAuthority: '这个问题需要当前可靠来源。实时外部来源尚未接入时，PHI OS 不会用不相关的内部资料代替。',
      professional: '这个问题需要专业人员判断。CKA 只呈现边界与 handoff，不作医疗、法律或财务专业判断。',
      prepareFailed: '暂时无法准备 handoff。',
      consentNeeded: '已确认复杂度门槛。若要继续，请显式同意准备临时 entry seed。',
      handoffReady: '临时 Reality entry seed 已准备完毕，等待下游 ICR / RDG 接受；尚未建立案例，也未激活 Reality Journey。',
      relevanceInsufficient: '现有受治理资料与这个问题没有足够直接的匹配。PHI OS 不会用只是在字面上碰巧相似、但实际上无关的内容来回答。请换一个 PHI OS 知识范围内的问题，或补充更具体的上下文。'
    };
  }
  return {
    contextGlobal: 'Asking PHI OS',
    contextAbout: 'Asking about',
    idle: 'Enter a question to begin a Simple Ask.',
    loading: 'Reading governed PHI OS knowledge…',
    failed: 'Ask PHI OS could not complete this answer.',
    notSimple: 'This question is beyond the Simple Ask boundary. Narrow it to a knowledge question first; no Reality Journey starts automatically.',
    complete: 'Answer ready',
    followLimit: 'Guest access includes one temporary follow-up. No history is saved.',
    followDone: 'The Guest follow-up has been used. No history was saved.',
    emptyWhy: 'There is not enough grounding for an additional mechanism explanation.',
    emptyObserve: 'There is not enough grounding for a more specific observable signal.',
    emptyUnknown: 'General uncertainty and application boundaries remain.',
    emptyRelated: 'No Related Knowledge from a governed relationship authority is available.',
    emptySources: 'No governed source can be displayed.',
    openKnowledge: 'Open knowledge',
    preparingContext: 'Re-retrieving through the same Grounded Answer runtime with temporary Guided Context…',
    contextDone: 'Guided Context applied. Its classifications are routing signals, not a diagnosis or a full ICR.',
    noJourney: 'The current structure can remain in Ask / Guided Context; no Reality Journey is recommended automatically.',
    currentAuthority: 'This question needs current reliable sources. Until live external retrieval is connected, PHI OS will not substitute unrelated internal material.',
    professional: 'This question needs professional judgment. CKA presents a boundary and handoff; it does not make medical, legal or financial judgments.',
    prepareFailed: 'The handoff could not be prepared.',
    consentNeeded: 'The complexity threshold is confirmed. Explicitly consent to prepare a temporary entry seed if you want to continue.',
    handoffReady: 'A temporary Reality entry seed is ready for downstream ICR / RDG acceptance. No case or Reality Journey has been activated.',
    relevanceInsufficient: 'The governed sources do not match this question closely enough. PHI OS will not answer with material that is only lexically similar but substantively unrelated. Ask a question within the PHI OS knowledge scope or add more specific context.'
  };
}

function entryContext() {
  const params = new URLSearchParams(location.search);
  const contextual = params.get('contextId') || params.get('bookCode') || params.get('articleCode') || params.get('figureCode');
  return {
    entrySurface: String(params.get('entrySurface') || root?.dataset.ckaEntrySurface || 'KNOWLEDGE_SEARCH').toUpperCase(),
    entryRoute: location.pathname,
    contextType: params.get('contextType'),
    contextId: params.get('contextId'),
    bookCode: params.get('bookCode'),
    partCode: params.get('partCode'),
    articleCode: params.get('articleCode'),
    figureCode: params.get('figureCode'),
    contextLabel: params.get('contextLabel'),
    contextSummary: params.get('contextSummary'),
    readingPath: params.get('readingPath'),
    relatedKnowledgeRef: params.get('relatedKnowledgeRef'),
    realityCaseId: params.get('realityCaseId'),
    mode: String(params.get('mode') || (contextual ? 'CONTEXTUAL' : 'GLOBAL')).toUpperCase()
  };
}

function setStatus(message, phase = 'idle') {
  status.textContent = message;
  status.dataset.state = phase;
}

function renderItems(target, items, emptyText) {
  const records = Array.isArray(items) ? items.filter(Boolean) : [];
  target.innerHTML = records.length
    ? `<ul>${records.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : `<p class="cka-empty">${escapeHtml(emptyText)}</p>`;
}

function renderCards(cards) {
  const target = answerRoot.querySelector('[data-cka-related-knowledge]');
  const records = Array.isArray(cards) ? cards : [];
  if (!records.length) {
    target.innerHTML = `<p class="cka-empty">${escapeHtml(copy().emptyRelated)}</p>`;
    return;
  }
  target.innerHTML = records.map(card => {
    const href = safeHref(card.href);
    return `<article class="cka-card">
      <p class="knowledge-eyebrow">${escapeHtml(card.concept)}</p>
      <dl>
        <div><dt>Volume</dt><dd>${escapeHtml(card.volume)}</dd></div>
        <div><dt>Part</dt><dd>${escapeHtml(card.part)}</dd></div>
        <div><dt>Content type</dt><dd>${escapeHtml(card.contentType)}</dd></div>
      </dl>
      <p>${escapeHtml(card.description)}</p>
      ${href ? `<a class="knowledge-action" href="${escapeHtml(href)}">${escapeHtml(copy().openKnowledge)}</a>` : ''}
    </article>`;
  }).join('');
}

function renderSources(envelope) {
  const target = answerRoot.querySelector('[data-cka-sources]');
  const groups = envelope?.record?.retrievalContext?.authorityGroups || [];
  const available = groups.filter(group => group.sources?.length);
  if (!available.length) {
    target.innerHTML = `<p class="cka-empty">${escapeHtml(copy().emptySources)}</p>`;
    return;
  }
  target.innerHTML = available.map(group => `
    <section class="cka-source-group">
      <h3>${escapeHtml(group.authorityClass === 'GOVERNED_EXTERNAL_AUTHORITY' ? (getLocale() === 'zh-Hans' ? '当前可靠来源' : 'Current reliable sources') : group.authorityClass === 'REVIEWED_MANUSCRIPT_OR_KSAR' ? (getLocale() === 'zh-Hans' ? 'PHI OS 书稿资料' : 'PHI OS manuscript sources') : (getLocale() === 'zh-Hans' ? 'PHI OS 已发布知识' : 'Published PHI OS knowledge'))}</h3>
      ${group.sources.map(source => {
        const href = safeHref(source.href);
        return `<article class="cka-source">
          <p><strong>${escapeHtml(source.authorityLabel)}</strong></p>
          <p>${escapeHtml(source.description)}</p>
          ${source.volume || source.part ? `<p class="cka-source__meta">${escapeHtml(source.volume)} · ${escapeHtml(source.part)}</p>` : ''}
          ${href ? `<a href="${escapeHtml(href)}">${escapeHtml(copy().openKnowledge)}</a>` : ''}
        </article>`;
      }).join('')}
    </section>
  `).join('');
}

function publicDirectAnswer(answer, envelope, relevant = true) {
  if (envelope.answerState === 'NEEDS_CURRENT_AUTHORITY') return copy().currentAuthority;
  if (envelope.answerState === 'PROFESSIONAL_HANDOFF') return copy().professional;
  if (!relevant) return copy().relevanceInsufficient;
  return answer.directAnswer;
}

function renderAnswer(payload) {
  const answer = payload?.cka?.clientAnswer;
  const envelope = payload?.cka?.w5w17;
  if (!answer || !envelope) throw new Error('CKA_CLIENT_PROJECTION_MISSING');
  answerRoot.querySelector('[data-cka-answer-question]').textContent = answer.question;
  const relevant = isAnswerQuestionRelevant(answer, envelope);
  answerRoot.querySelector('[data-cka-answer-state]').textContent = relevant ? envelope.answerState : 'INSUFFICIENT_RELEVANCE';
  const needsCurrentAuthority = envelope.answerState === 'NEEDS_CURRENT_AUTHORITY';
  const suppressGrounding = !relevant && ['ANSWERED', 'PARTIALLY_ANSWERED'].includes(envelope.answerState);
  answerRoot.querySelector('[data-cka-direct-answer]').innerHTML = `<p>${escapeHtml(publicDirectAnswer(answer, envelope, relevant))}</p>`;
  answerRoot.querySelector('[data-cka-unknown-state]').textContent = suppressGrounding ? 'INSUFFICIENT_RELEVANCE' : envelope.record.unknownState;
  renderItems(answerRoot.querySelector('[data-cka-why]'), (needsCurrentAuthority || suppressGrounding) ? [] : answer.whyThisMayHappen, copy().emptyWhy);
  renderItems(answerRoot.querySelector('[data-cka-observe]'), (needsCurrentAuthority || suppressGrounding) ? [] : answer.whatToObserve, copy().emptyObserve);
  renderItems(answerRoot.querySelector('[data-cka-unknown]'), suppressGrounding ? [copy().relevanceInsufficient] : answer.unknown?.details, copy().emptyUnknown);
  renderCards(suppressGrounding ? [] : envelope.relatedKnowledgeCards);
  if (suppressGrounding) {
    const sourceTarget = answerRoot.querySelector('[data-cka-sources]');
    if (sourceTarget) sourceTarget.innerHTML = `<p class="cka-empty">${escapeHtml(copy().emptySources)}</p>`;
  } else {
    renderSources(envelope);
  }

  const boundary = [
    suppressGrounding ? copy().relevanceInsufficient : null,
    ...(!suppressGrounding ? (answer.unknown?.details || []) : []),
    envelope.externalAuthority.required ? copy().currentAuthority : null,
    envelope.externalAuthority.professionalJudgmentRequested ? copy().professional : null
  ].filter(Boolean);
  answerRoot.querySelector('[data-cka-answer-boundary]').innerHTML = `<strong>Answer boundary</strong>${boundary.map(item => `<p>${escapeHtml(item)}</p>`).join('')}`;

  state.clientAnswer = answer;
  state.envelope = envelope;
  state.payload = payload;
  state.followUpDepth = Number(payload.cka?.followUp?.followUpDepth || 0);
  followUpForm.hidden = state.followUpDepth >= 1;
  followUpStatus.textContent = state.followUpDepth >= 1 ? copy().followDone : copy().followLimit;
  const searchMore = answerRoot.querySelector('[data-cka-search-more]');
  searchMore.href = `/library?query=${encodeURIComponent(state.firstQuestion)}`;
  answerRoot.hidden = false;
  setStatus(copy().complete, 'complete');
}

function formFields(formElement) {
  const data = new FormData(formElement);
  return Object.fromEntries([
    'whatIsHappening',
    'howLong',
    'whoOrWhatIsInvolved',
    'whatChanged',
    'whatTried',
    'whatMattersMostNow'
  ].map(key => [key, String(data.get(key) || '').trim()]));
}

function handoffGuidedContext() {
  const guided = state.envelope?.guidedContext;
  const fields = guided?.fields || state.guidedFields || {};
  return {
    originalQuestion: state.firstQuestion,
    clarifyingAnswers: Object.entries(fields)
      .filter(([, response]) => response)
      .map(([questionId, response]) => ({ questionId, response, selectedOptionCodes: [] })),
    temporaryObservations: [fields.whatIsHappening, fields.whatChanged, fields.whatTried].filter(Boolean),
    unknownMechanisms: state.clientAnswer?.unknown?.details || [],
    candidateMechanisms: [],
    escalationSignals: guided?.signals || {}
  };
}

function complexityBody() {
  const guided = state.envelope?.guidedContext;
  const fields = guided?.fields || state.guidedFields || {};
  const hasList = value => /,|、| and |与|和/.test(String(value || ''));
  return {
    question: state.firstQuestion,
    guidedContext: handoffGuidedContext(),
    structuredContext: {
      notes: Object.values(fields).filter(Boolean),
      longTimeline: guided?.signals?.persistent === true,
      persistentUnresolvedState: guided?.signals?.persistent === true,
      repeatPattern: guided?.signals?.persistent === true,
      unclearCausalStructure: guided?.signals?.multiFactor === true,
      multiplePeople: hasList(fields.whoOrWhatIsInvolved),
      multipleRelationships: hasList(fields.whoOrWhatIsInvolved),
      multipleGoals: hasList(fields.whatMattersMostNow),
      multipleConstraints: guided?.signals?.multiFactor === true,
      multipleInterventions: hasList(fields.whatTried),
      highConsequenceDecision: guided?.signals?.realityDependent === true,
      feedbackLoopPresence: /feedback loop|反馈循环|恶性循环/i.test(Object.values(fields).join(' '))
    }
  };
}

async function evaluateComplexity() {
  const response = await fetch('/api/reality-complexity', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(complexityBody())
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) throw new Error(payload?.error?.code || 'CKA_COMPLEXITY_GATE_FAILED');
  state.complexity = payload;
  const eligible = payload.realityModelRequirement?.requirement === 'YES'
    && payload.route === 'REALITY_JOURNEY_CANDIDATE';
  journey.hidden = !eligible;
  journeyConsent.hidden = true;
  journeyConsentCheckbox.checked = false;
  if (eligible) {
    journeyReason.textContent = 'KAP W24 confirms that persistent, interdependent structure requires a Reality Model. This is a routing decision, not a diagnosis.';
  } else {
    guidedStatus.textContent = `${guidedStatus.textContent} ${copy().noJourney}`;
  }
}

async function runQuestion(query, { followUp = false, guidedFields = null } = {}) {
  if (state.busy) return;
  state.busy = true;
  setStatus(guidedFields ? copy().preparingContext : copy().loading, 'loading');
  if (!followUp) {
    state.firstQuestion = query;
    state.followUpDepth = 0;
    state.guidedFields = guidedFields;
    state.complexity = null;
    journey.hidden = true;
    answerRoot.hidden = true;
  }
  const followUpContext = followUp ? {
    contextQuestion: state.firstQuestion,
    parentAnswerId: state.clientAnswer?.answerContext?.answerId,
    groundingBundleId: state.clientAnswer?.knowledgeContext?.groundingBundleId,
    followUpDepth: state.followUpDepth + 1
  } : { followUpDepth: 0 };
  try {
    const payload = await askPhios({
      query,
      locale: getLocale(),
      depth: 'STANDARD',
      source: 'hybrid',
      entryContext: entryContext(),
      followUpContext,
      guidedContext: guidedFields || {}
    });
    renderAnswer(payload);
    if (followUp) followUpInput.value = '';
    if (guidedFields) {
      guidedStatus.textContent = `${copy().contextDone} ${payload.cka.w5w17.guidedContext.classifications.join(' · ')}`;
      await evaluateComplexity();
    }
  } catch (error) {
    const message = error?.code === 'CKA_NOT_SIMPLE_ASK' ? copy().notSimple : `${copy().failed}${error?.code ? ` (${error.code})` : ''}`;
    if (followUp) followUpStatus.textContent = message;
    else setStatus(message, 'error');
  } finally {
    state.busy = false;
  }
}

async function handoffRequest(action, consent = {}) {
  const body = {
    action,
    locale: getLocale(),
    complexityEvaluation: state.complexity,
    guidedContext: handoffGuidedContext(),
    knowledgeGroundingBundle: {
      bundleId: state.envelope?.record?.groundingBundleId,
      sources: []
    },
    methodProjections: [],
    methodConsentCodes: [],
    consent
  };
  const response = await fetch('/api/reality-handoff', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) throw new Error(payload?.error?.code || 'CKA_REALITY_HANDOFF_FAILED');
  return payload;
}

form?.addEventListener('submit', event => {
  event.preventDefault();
  const query = input.value.trim();
  if (query) runQuestion(query);
});

followUpForm?.addEventListener('submit', event => {
  event.preventDefault();
  const query = followUpInput.value.trim();
  if (query && state.followUpDepth < 1) runQuestion(query, { followUp: true });
});

guidedOpen?.addEventListener('click', () => {
  guidedForm.hidden = !guidedForm.hidden;
  if (!guidedForm.hidden) guidedForm.querySelector('textarea')?.focus();
});

guidedForm?.addEventListener('submit', event => {
  event.preventDefault();
  const fields = formFields(guidedForm);
  if (!Object.values(fields).some(Boolean)) {
    guidedForm.querySelector('textarea')?.focus();
    return;
  }
  runQuestion(state.firstQuestion, { guidedFields: fields });
});

journeyPrepare?.addEventListener('click', async () => {
  try {
    const prepared = await handoffRequest('PREPARE');
    journeyReason.textContent = prepared.escalationReason?.summary || journeyReason.textContent;
    journeyConsent.hidden = false;
    journeyStatus.textContent = copy().consentNeeded;
  } catch (error) {
    journeyStatus.textContent = `${copy().prepareFailed} ${error.message}`;
  }
});

journeyHandoff?.addEventListener('click', async () => {
  if (!journeyConsentCheckbox.checked) {
    journeyConsentCheckbox.focus();
    return;
  }
  try {
    const payload = await handoffRequest('HANDOFF', {
      explicit: true,
      accepted: true,
      scope: 'REALITY_JOURNEY_PERSISTENT_CASE_HANDOFF',
      consentTextVersion: 'CKA-W6-v1.0.0',
      recordedAt: new Date().toISOString()
    });
    journeyStatus.textContent = payload.status === 'HANDOFF_READY' ? copy().handoffReady : copy().prepareFailed;
    journeyHandoff.disabled = payload.status === 'HANDOFF_READY';
  } catch (error) {
    journeyStatus.textContent = `${copy().prepareFailed} ${error.message}`;
  }
});

function applyLocale() {
  const context = entryContext();
  document.documentElement.lang = getLocale() === 'zh-Hans' ? 'zh-Hans' : 'en';
  const contextValue = context.contextId || context.articleCode || context.bookCode || context.figureCode;
  contextIndicator.textContent = contextValue ? `${copy().contextAbout}: ${contextValue}` : copy().contextGlobal;
  if (!state.payload) {
    setStatus(copy().idle);
    followUpStatus.textContent = copy().followLimit;
  }
}

onLocaleChange(() => {
  const question = state.firstQuestion;
  applyLocale();
  if (question) runQuestion(question, { guidedFields: state.guidedFields });
});

applyLocale();
const initialQuery = new URLSearchParams(location.search).get('q');
if (initialQuery) {
  input.value = initialQuery.slice(0, 500);
  queueMicrotask(() => runQuestion(input.value.trim()));
}
