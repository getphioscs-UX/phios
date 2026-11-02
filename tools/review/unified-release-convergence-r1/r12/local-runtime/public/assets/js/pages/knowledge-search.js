import { getLocale, onLocaleChange } from '../i18n.js';
import { askPhios } from '../knowledge/ask-phios-client.js';

const root = document.querySelector('[data-cka-root]');
const form = document.querySelector('[data-cka-composer]');
const input = document.querySelector('[data-cka-question]');
const status = document.querySelector('[data-cka-status]');
const answerRoot = document.querySelector('[data-cka-answer]');
const followUpForm = document.querySelector('[data-cka-follow-up-form]');
const followUpInput = document.querySelector('[data-cka-follow-up-question]');
const followUpStatus = document.querySelector('[data-cka-follow-up-status]');
const contextIndicator = document.querySelector('[data-cka-context-indicator]');

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

const state = {
  firstQuestion: null,
  followUpDepth: 0,
  lastClientAnswer: null,
  lastPayload: null,
  busy: false
};

function copy() {
  if (getLocale() === 'zh-Hans') {
    return {
      heroEyebrow: 'Ask PHI OS · 客户知识问答',
      title: '你想了解什么？',
      lead: '在受治理的 PHI OS 知识范围内提问。Simple Ask 不建立案例、不执行 Method，也不会启动 Reality Journey。',
      contextGlobal: '正在向 PHI OS 提问',
      contextAbout: '正在询问：',
      contextFigure: '正在询问这张 Figure',
      contextRealityBlocked: 'Reality-aware Ask 需要已验证的许可、隐私与 entitlement',
      composerLabel: '你想了解什么？',
      ask: '向 PHI OS 提问',
      idle: '输入问题即可开始 Simple Ask。',
      loading: '正在读取受治理的 PHI OS 知识…',
      failed: '目前无法完成 Ask PHI OS 回答。',
      notSimple: '这个问题已经超出 Simple Ask 边界；本阶段不会自动进入 Guided Context 或 Reality Journey。',
      followLimit: 'Guest 可进行一次临时追问。本次不会保存历史。',
      followDone: 'Guest 临时追问已使用；没有保存问答历史。',
      question: '问题',
      direct: '直接回答',
      why: '为什么可能会这样',
      whyBoundary: '有依据或有边界的解释 · 不是已观察事实',
      observe: '可以观察什么',
      unknown: 'PHI OS 目前还不知道什么',
      related: '相关知识',
      sources: '来源 / 依据',
      followTitle: '继续追问',
      followLabel: '可以澄清、比较、扩展、询问应用方式或可观察讯号。',
      followAction: '继续追问',
      emptyWhy: '目前没有足够依据补充机制解释。',
      emptyObserve: '目前没有足够依据提出更具体的可观察讯号。',
      emptyUnknown: '仍保留一般的不确定性与适用边界。',
      emptyRelated: '目前没有可安全投射的相关知识卡片。',
      emptySources: '目前没有可显示的受治理来源。',
      openKnowledge: '打开知识内容',
      volume: '卷册',
      part: '部分',
      contentType: '内容类型',
      boundaryTitle: '回答边界',
      sourceAuthority: '知识权威',
      complete: '已完成受治理回答',
      simpleBoundaryTitle: 'Simple Ask 边界',
      simpleBoundary: '回答是问题范围内、有依据的投射，不会发布 Article、建立 Canonical Knowledge、建立 Reality Reading、公开完整手稿、静默建立账户或持久化案例。'
    };
  }
  return {
    heroEyebrow: 'Ask PHI OS · Client Knowledge Ask',
    title: 'What would you like to understand?',
    lead: 'Ask within governed PHI OS knowledge. A Simple Ask does not create a case, execute a Method or start a Reality Journey.',
    contextGlobal: 'Asking PHI OS',
    contextAbout: 'Asking about:',
    contextFigure: 'Asking about this figure',
    contextRealityBlocked: 'Reality-aware Ask requires verified permission, privacy and entitlement',
    composerLabel: 'What would you like to understand?',
    ask: 'Ask PHI OS',
    idle: 'Enter a question to begin a Simple Ask.',
    loading: 'Reading governed PHI OS knowledge…',
    failed: 'Ask PHI OS could not complete this answer.',
    notSimple: 'This question is beyond the Simple Ask boundary. This stage does not automatically start Guided Context or a Reality Journey.',
    followLimit: 'Guest access includes one temporary follow-up. No history is saved.',
    followDone: 'The Guest follow-up has been used. No answer history was saved.',
    question: 'Question',
    direct: 'Direct Answer',
    why: 'Why This May Happen',
    whyBoundary: 'Grounded or bounded explanation · not an observed fact',
    observe: 'What To Observe',
    unknown: 'What PHI OS Does Not Yet Know',
    related: 'Related Knowledge',
    sources: 'Sources / Grounding',
    followTitle: 'Ask a follow-up',
    followLabel: 'Clarify, compare, expand, ask an application question or ask what to observe.',
    followAction: 'Ask follow-up',
    emptyWhy: 'There is not enough grounding for an additional mechanism explanation.',
    emptyObserve: 'There is not enough grounding for a more specific observable signal.',
    emptyUnknown: 'General uncertainty and application boundaries still remain.',
    emptyRelated: 'No related knowledge card can be safely projected yet.',
    emptySources: 'No governed source can be displayed yet.',
    openKnowledge: 'Open knowledge',
    volume: 'Volume',
    part: 'Part',
    contentType: 'Content type',
    boundaryTitle: 'Answer boundary',
    sourceAuthority: 'Knowledge authority',
    complete: 'Governed answer complete',
    simpleBoundaryTitle: 'Simple Ask boundary',
    simpleBoundary: 'Answers are question-scoped, grounded projections. They do not publish an Article, create Canonical Knowledge, create a Reality Reading, expose the full manuscript, silently create an account or persist a case.'
  };
}

function entryContext() {
  const params = new URLSearchParams(location.search);
  const figureCode = params.get('figureCode');
  const contextType = params.get('contextType');
  const contextId = params.get('contextId');
  const bookCode = params.get('bookCode');
  const articleCode = params.get('articleCode');
  return {
    entrySurface: String(params.get('entrySurface') || root?.dataset.ckaEntrySurface || 'KNOWLEDGE_SEARCH').toUpperCase(),
    entryRoute: location.pathname,
    contextType,
    contextId,
    bookCode,
    partCode: params.get('partCode'),
    articleCode,
    figureCode,
    realityCaseId: params.get('realityCaseId'),
    mode: String(params.get('mode') || (figureCode || contextType || contextId || bookCode || articleCode ? 'CONTEXTUAL' : 'GLOBAL')).toUpperCase()
  };
}

function publicContextLabel(context, c) {
  if (context.mode === 'REALITY_AWARE') return c.contextRealityBlocked;
  if (context.figureCode || context.entrySurface === 'FIGURE') return c.contextFigure;
  const publicContext = context.contextId || context.articleCode || context.bookCode;
  return publicContext ? `${c.contextAbout} ${publicContext}` : c.contextGlobal;
}

function setStatus(message, phase = 'idle') {
  status.textContent = message;
  status.dataset.state = phase;
}

function renderItems(target, items, emptyCopy) {
  const values = Array.isArray(items) ? items.filter(Boolean) : [];
  target.innerHTML = values.length
    ? `<ul>${values.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : `<p class="cka-empty">${escapeHtml(emptyCopy)}</p>`;
}

function renderCards(target, cards, c) {
  const records = Array.isArray(cards) ? cards : [];
  if (!records.length) {
    target.innerHTML = `<p class="cka-empty">${escapeHtml(c.emptyRelated)}</p>`;
    return;
  }
  target.innerHTML = records.map(card => {
    const href = safeHref(card.href);
    return `<article class="cka-card">
      <p class="knowledge-eyebrow">${escapeHtml(card.concept)}</p>
      <dl>
        <div><dt>${escapeHtml(c.volume)}</dt><dd>${escapeHtml(card.volume)}</dd></div>
        <div><dt>${escapeHtml(c.part)}</dt><dd>${escapeHtml(card.part)}</dd></div>
        <div><dt>${escapeHtml(c.contentType)}</dt><dd>${escapeHtml(card.contentType)}</dd></div>
      </dl>
      <p>${escapeHtml(card.description)}</p>
      ${href ? `<a class="knowledge-action" href="${escapeHtml(href)}">${escapeHtml(c.openKnowledge)}</a>` : ''}
    </article>`;
  }).join('');
}

function renderSources(target, sources, c) {
  const records = Array.isArray(sources) ? sources : [];
  if (!records.length) {
    target.innerHTML = `<p class="cka-empty">${escapeHtml(c.emptySources)}</p>`;
    return;
  }
  target.innerHTML = records.map(source => {
    const href = safeHref(source.href);
    return `<article class="cka-source">
      <p class="knowledge-eyebrow">${escapeHtml(c.sourceAuthority)} · ${escapeHtml(source.authorityLabel)}</p>
      <p>${escapeHtml(source.description)}</p>
      <p class="cka-source__meta">${escapeHtml(source.volume)} · ${escapeHtml(source.part)}</p>
      ${href ? `<a class="knowledge-action" href="${escapeHtml(href)}">${escapeHtml(c.openKnowledge)}</a>` : ''}
    </article>`;
  }).join('');
}

function renderAnswer(payload) {
  const c = copy();
  const answer = payload?.cka?.clientAnswer;
  if (!answer) throw new Error('CKA_CLIENT_PROJECTION_MISSING');

  answerRoot.querySelector('[data-cka-answer-question]').textContent = answer.question;
  answerRoot.querySelector('[data-cka-direct-answer]').innerHTML = `<p>${escapeHtml(answer.directAnswer)}</p>`;
  answerRoot.querySelector('[data-cka-unknown-state]').textContent = answer.unknown?.state || 'UNKNOWN';

  renderItems(answerRoot.querySelector('[data-cka-why]'), answer.whyThisMayHappen?.items, c.emptyWhy);
  renderItems(answerRoot.querySelector('[data-cka-observe]'), answer.whatToObserve, c.emptyObserve);
  renderItems(answerRoot.querySelector('[data-cka-unknown]'), answer.unknown?.items, c.emptyUnknown);
  renderCards(answerRoot.querySelector('[data-cka-related-knowledge]'), answer.relatedKnowledgeCards, c);
  renderSources(answerRoot.querySelector('[data-cka-sources]'), answer.grounding?.sources, c);

  const limits = Array.isArray(answer.boundary) ? answer.boundary : [];
  answerRoot.querySelector('[data-cka-boundary]').innerHTML = `<strong>${escapeHtml(c.boundaryTitle)}</strong>${limits.map(item => `<p>${escapeHtml(item)}</p>`).join('')}`;

  state.lastClientAnswer = answer;
  state.lastPayload = payload;
  state.followUpDepth = Number(payload.cka?.followUp?.followUpDepth || 0);
  followUpForm.hidden = state.followUpDepth >= 1;
  followUpStatus.textContent = state.followUpDepth >= 1 ? c.followDone : c.followLimit;
  answerRoot.hidden = false;
  setStatus(`${c.complete} · ${escapeHtml(answer.unknown?.state || 'UNKNOWN')}`, 'complete');
}

async function runQuestion(query, followUp = false) {
  const c = copy();
  if (state.busy) return;
  state.busy = true;
  setStatus(c.loading, 'loading');
  if (!followUp) {
    state.firstQuestion = query;
    state.followUpDepth = 0;
    answerRoot.hidden = true;
  }

  const followUpContext = followUp ? {
    contextQuestion: state.firstQuestion,
    parentAnswerId: state.lastClientAnswer?.answerContext?.answerId,
    groundingBundleId: state.lastClientAnswer?.knowledgeContext?.groundingBundleId,
    followUpDepth: state.followUpDepth + 1
  } : { followUpDepth: 0 };

  try {
    const payload = await askPhios({
      query,
      locale: getLocale(),
      depth: 'STANDARD',
      source: 'hybrid',
      entryContext: entryContext(),
      followUpContext
    });
    renderAnswer(payload);
    if (followUp) followUpInput.value = '';
  } catch (error) {
    const message = error?.code === 'CKA_NOT_SIMPLE_ASK' ? c.notSimple : `${c.failed}${error?.code ? ` (${error.code})` : ''}`;
    if (followUp) followUpStatus.textContent = message;
    else setStatus(message, 'error');
  } finally {
    state.busy = false;
  }
}

function applyLocale() {
  const c = copy();
  const context = entryContext();
  document.documentElement.lang = getLocale() === 'zh-Hans' ? 'zh-Hans' : 'en';
  document.querySelector('.cka-hero .knowledge-eyebrow').textContent = c.heroEyebrow;
  document.querySelector('.cka-hero h1').textContent = c.title;
  document.querySelector('.cka-hero .knowledge-hero__lead').textContent = c.lead;
  contextIndicator.textContent = publicContextLabel(context, c);
  form.querySelector('label').textContent = c.composerLabel;
  form.querySelector('button').textContent = c.ask;
  answerRoot.querySelector('.cka-answer__question .knowledge-eyebrow').textContent = c.question;
  answerRoot.querySelector('[data-cka-section="DIRECT_ANSWER"] .knowledge-eyebrow').textContent = c.direct;
  answerRoot.querySelector('[data-cka-section="WHY_THIS_MAY_HAPPEN"] h3').textContent = c.why;
  answerRoot.querySelector('[data-cka-section="WHY_THIS_MAY_HAPPEN"] .cka-answer__heading span').textContent = c.whyBoundary;
  answerRoot.querySelector('[data-cka-section="WHAT_TO_OBSERVE"] h3').textContent = c.observe;
  answerRoot.querySelector('[data-cka-section="WHAT_PHIOS_DOES_NOT_YET_KNOW"] h3').textContent = c.unknown;
  answerRoot.querySelector('[data-cka-section="RELATED_KNOWLEDGE"] h3').textContent = c.related;
  answerRoot.querySelector('[data-cka-grounding] summary').textContent = c.sources;
  answerRoot.querySelector('[data-cka-follow-up] .knowledge-eyebrow').textContent = c.followTitle;
  followUpForm.querySelector('label').textContent = c.followLabel;
  followUpForm.querySelector('button').textContent = c.followAction;
  document.querySelector('.cka-entry-boundary strong').textContent = c.simpleBoundaryTitle;
  document.querySelector('.cka-entry-boundary p').textContent = c.simpleBoundary;
  if (!state.lastPayload) {
    setStatus(c.idle);
    followUpStatus.textContent = c.followLimit;
  }
}

form?.addEventListener('submit', event => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) {
    input.focus();
    return;
  }
  runQuestion(query, false);
});

followUpForm?.addEventListener('submit', event => {
  event.preventDefault();
  const query = followUpInput.value.trim();
  if (!query || state.followUpDepth >= 1) return;
  runQuestion(query, true);
});

onLocaleChange(() => {
  const question = state.firstQuestion;
  applyLocale();
  if (question) runQuestion(question, false);
});

applyLocale();

const initialQuery = new URLSearchParams(location.search).get('q');
if (initialQuery) {
  input.value = initialQuery.slice(0, 500);
  queueMicrotask(() => runQuestion(input.value.trim(), false));
}

