const MODEL_URL = '/content/runtime/journey-runtime/phase19/rjx-phase19-workspace-review-model-v1.json';

const COPY = {
  en: {
    eyebrow: 'PHI OS · Phase 19 technical review candidate',
    title: 'Reality Workspace',
    lede: 'One case, three client stages. Understand what is supported, choose among bounded options, then review what actually changed.',
    boundary: 'Review projection only. This surface does not own Reality state, Reading, Navigation, Method, Professional Judgment or persistence authority.',
    complexityLabel: 'Case view',
    complexityHint: 'Complexity is progressive disclosure. Simple cases do not load a graph or timeline by default.',
    SIMPLE: 'Simple',
    COMPLEX: 'Complex',
    UNDERSTAND: 'Understand',
    CHOOSE: 'Choose',
    REVIEW: 'Review',
    stageUnderstand: 'Understand the current situation without turning interpretation into fact.',
    stageChoose: 'Compare bounded, reviewable options. PHI OS does not select the final action for you.',
    stageReview: 'Compare expected signals with observed outcomes and create a successor Reality candidate without rewriting the past.',
    classifications: 'Evidence classes',
    OBSERVED: 'Observed',
    DERIVED: 'Derived',
    CALCULATED: 'Calculated',
    PROJECTED: 'Projected',
    UNKNOWN: 'Unknown',
    CONFLICTING: 'Conflicting',
    HISTORICAL: 'Historical',
    reading: 'Reading',
    complexity: 'What May Be Connected',
    relationships: 'Relationships',
    timeline: 'Timeline',
    options: 'What You Can Explore',
    option: 'Possible option',
    rationale: 'Rationale',
    constraint: 'Constraint',
    risk: 'Risk',
    expected: 'Expected signal',
    reversibility: 'Reversibility',
    reviewCondition: 'Review condition',
    alternative: 'Alternative option',
    choiceRequired: 'Your choice is required. No option is automatically selected.',
    review: 'Review',
    realityNext: 'Reality Next',
    technicalTrace: 'Technical trace',
    sourceRefs: 'Source refs',
    unknownRefs: 'Unknown refs',
    loading: 'Loading governed review model…',
    loadError: 'The governed review model could not be loaded. No fallback inference was generated.',
    footer: 'Phase 19 technical review candidate. Human UX acceptance and Phase 20 runtime consumption integration remain pending.',
    redirectState: 'legacy redirects inactive · legacy pages preserved'
  },
  'zh-Hans': {
    eyebrow: 'PHI OS · 第19阶段技术审阅候选',
    title: '现实工作区',
    lede: '一个案例，三个客户阶段：先理解目前有支持的内容，再从有边界的选项中选择，最后复核现实真正发生了什么变化。',
    boundary: '仅为审阅投影。这个页面不拥有现实状态、读取、导航、方法、专业判断或持久化权限。',
    complexityLabel: '案例视图',
    complexityHint: '复杂度采用渐进展开。简单案例默认不会载入关系图或时间线。',
    SIMPLE: '简单',
    COMPLEX: '复杂',
    UNDERSTAND: '理解',
    CHOOSE: '选择',
    REVIEW: '复核',
    stageUnderstand: '理解目前的情况，同时避免把解释当成事实。',
    stageChoose: '比较有边界、可复核的选项。PHI OS 不会替你选择最终行动。',
    stageReview: '比较预期信号与实际结果，并建立下一版现实候选，而不改写过去。',
    classifications: '证据分类',
    OBSERVED: '已观察',
    DERIVED: '推导',
    CALCULATED: '计算',
    PROJECTED: '投影',
    UNKNOWN: '未知',
    CONFLICTING: '冲突',
    HISTORICAL: '历史',
    reading: '读取',
    complexity: '什么可能有关联',
    relationships: '关系',
    timeline: '时间线',
    options: '你可以探索什么',
    option: '可能的选项',
    rationale: '理由',
    constraint: '限制',
    risk: '风险',
    expected: '预期信号',
    reversibility: '可逆性',
    reviewCondition: '复核条件',
    alternative: '替代选项',
    choiceRequired: '必须由你选择；系统不会自动替你选择任何选项。',
    review: '复核',
    realityNext: '下一版现实',
    technicalTrace: '技术追踪',
    sourceRefs: '来源引用',
    unknownRefs: '未知引用',
    loading: '正在载入受治理的审阅模型……',
    loadError: '无法载入受治理的审阅模型。系统没有生成任何替代推断。',
    footer: '第19阶段技术审阅候选。人工体验验收与第20阶段 runtime consumption integration 仍待完成。',
    redirectState: '旧路由跳转未启用 · 旧页面继续保留'
  }
};

const state = {
  locale: new URLSearchParams(location.search).get('lang') === 'zh-Hans' ? 'zh-Hans' : 'en',
  stage: 'UNDERSTAND',
  complexity: 'SIMPLE',
  model: null
};

const workspace = document.querySelector('#workspace');

function c(key) {
  return COPY[state.locale]?.[key] ?? COPY.en[key] ?? key;
}

function localized(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[state.locale] ?? value.en ?? '';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function traceMarkup(item) {
  const sourceRefs = item.evidenceRefs || item.sourceRefs || [];
  const unknownRefs = item.unknownRefs || item.Unknown || [];
  if (!sourceRefs.length && !unknownRefs.length && !item.ruleRefs) return '';
  const trace = {
    classification: item.classification || null,
    sourceRefs,
    ruleRefs: item.ruleRefs || [],
    unknownRefs
  };
  return `<details class="rjx19-trace"><summary>${escapeHtml(c('technicalTrace'))}</summary><code>${escapeHtml(JSON.stringify(trace, null, 2))}</code></details>`;
}

function card(item, wide = false) {
  return `<article class="rjx19-card${wide ? ' rjx19-card--wide' : ''}" data-classification="${escapeHtml(item.classification || 'HISTORICAL')}">
    <span class="rjx19-class">${escapeHtml(c(item.classification || 'HISTORICAL'))}</span>
    <h3>${escapeHtml(localized(item.title))}</h3>
    <p>${escapeHtml(localized(item.text))}</p>
    ${traceMarkup(item)}
  </article>`;
}

function legend() {
  return `<div class="rjx19-legend" aria-label="${escapeHtml(c('classifications'))}">${state.model.classifications.map(k => `<span><i></i>${escapeHtml(c(k))}</span>`).join('')}</div>`;
}

function stageIntro(title, description) {
  return `<div class="rjx19-stage-intro"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div></div>${legend()}`;
}

function complexityMarkup() {
  const complexity = state.model.workspace.complexity;
  const relationships = complexity.relationships.map(rel => {
    const from = complexity.entities.find(x => x.id === rel.from);
    const to = complexity.entities.find(x => x.id === rel.to);
    return `<div class="rjx19-relationship" data-classification="${escapeHtml(rel.classification)}">
      <strong>${escapeHtml(localized(from.label))}</strong>
      <span class="rjx19-relationship__edge">${escapeHtml(localized(rel.label))} · ${escapeHtml(c(rel.classification))}</span>
      <strong>${escapeHtml(localized(to.label))}</strong>
    </div>`;
  }).join('');
  const timeline = complexity.timeline.map(event => `<div class="rjx19-timeline__event">
    <div class="rjx19-timeline__time">${escapeHtml(localized(event.time))} · ${escapeHtml(event.timeType)}</div>
    <strong>${escapeHtml(localized(event.label))}</strong>
    ${traceMarkup({classification:event.classification, sourceRefs:event.sourceRefs})}
  </div>`).join('');
  return `<section class="rjx19-complexity" ${state.complexity === 'COMPLEX' ? '' : 'hidden'}>
    <h3>${escapeHtml(c('complexity'))}</h3>
    <div class="rjx19-section"><h4 class="rjx19-section__title">${escapeHtml(c('relationships'))}</h4><div class="rjx19-relationship-list">${relationships}</div></div>
    <div class="rjx19-section"><h4 class="rjx19-section__title">${escapeHtml(c('timeline'))}</h4><div class="rjx19-timeline">${timeline}</div></div>
  </section>`;
}

function renderUnderstand() {
  const {situation, reading} = state.model.workspace;
  const oneSentence = {
    classification: reading.oneSentence.classification,
    title: {en: 'One-sentence Reading', 'zh-Hans': '一句话读取'},
    text: reading.oneSentence.text,
    evidenceRefs: reading.oneSentence.evidenceRefs,
    unknownRefs: reading.oneSentence.unknownRefs
  };
  workspace.innerHTML = `${stageIntro(c('UNDERSTAND'), c('stageUnderstand'))}
    <div class="rjx19-grid">${card(situation)}${card(oneSentence)}</div>
    <section class="rjx19-section"><h3 class="rjx19-section__title">${escapeHtml(c('reading'))}</h3><div class="rjx19-grid">${reading.sections.map(x => card(x)).join('')}</div></section>
    ${complexityMarkup()}`;
}

function optionMarkup(option, index) {
  const fact = (label, value) => `<div class="rjx19-fact"><b>${escapeHtml(label)}</b>${escapeHtml(localized(value))}</div>`;
  return `<article class="rjx19-card rjx19-card--wide" data-classification="PROJECTED">
    <span class="rjx19-class">${escapeHtml(c('PROJECTED'))}</span>
    <div class="rjx19-option">
      <h3>${escapeHtml(c('option'))} ${index + 1}: ${escapeHtml(localized(option['Possible Action']))}</h3>
      <div class="rjx19-option__facts">
        ${fact(c('rationale'), option.Rationale)}
        ${fact(c('constraint'), option.Constraint)}
        ${fact(c('risk'), option.Risk)}
        ${fact(c('expected'), option['Expected Signal'])}
        ${fact(c('reversibility'), option.reversibility)}
        ${fact(c('reviewCondition'), option.reviewDateOrCondition)}
        ${fact(c('alternative'), option.alternativeOption)}
        ${fact(c('technicalTrace'), option.evidenceBasis.join(', '))}
      </div>
      <p class="rjx19-choice">${escapeHtml(c('choiceRequired'))}</p>
    </div>
  </article>`;
}

function renderChoose() {
  const navigation = state.model.workspace.navigation;
  workspace.innerHTML = `${stageIntro(c('CHOOSE'), c('stageChoose'))}
    <section class="rjx19-section"><h3 class="rjx19-section__title">${escapeHtml(c('options'))}</h3><div class="rjx19-grid">${navigation.options.map(optionMarkup).join('')}</div></section>`;
}

function renderReview() {
  const review = state.model.workspace.review;
  const next = {
    classification: 'DERIVED',
    title: {en: 'Reality Next', 'zh-Hans': '下一版现实'},
    text: {
      en: `${review.realityVNext.versionId} is a candidate successor of ${review.realityVNext.predecessorVersionId} through ${review.realityVNext.diffId}.`,
      'zh-Hans': `${review.realityVNext.versionId} 是 ${review.realityVNext.predecessorVersionId} 通过 ${review.realityVNext.diffId} 形成的候选下一版本。`
    },
    sourceRefs: [review.realityVNext.predecessorVersionId, review.realityVNext.diffId]
  };
  workspace.innerHTML = `${stageIntro(c('REVIEW'), c('stageReview'))}
    <div class="rjx19-grid">
      ${card({classification:review.changeSummary.classification,title:{en:'What Changed','zh-Hans':'发生了什么变化'},text:review.changeSummary.text,evidenceRefs:review.changeSummary.evidenceRefs})}
      ${card({classification:review.unchangedSummary.classification,title:{en:'What Did Not Change','zh-Hans':'什么没有改变'},text:review.unchangedSummary.text,evidenceRefs:review.unchangedSummary.evidenceRefs})}
      ${card({classification:review.expectedSignalComparison.classification,title:{en:'Expected Signal Comparison','zh-Hans':'预期信号比较'},text:review.expectedSignalComparison.text,evidenceRefs:review.expectedSignalComparison.evidenceRefs})}
      ${card(next)}
    </div>
    <section class="rjx19-section rjx19-card rjx19-card--wide" data-classification="HISTORICAL">
      <span class="rjx19-class">${escapeHtml(c('HISTORICAL'))}</span>
      <h3>${escapeHtml(c('realityNext'))}</h3>
      <div class="rjx19-version-flow"><span>${escapeHtml(review.previousRealityVersion)}</span><b>→</b><span>${escapeHtml(review.realityDiff.diffId)}</span><b>→</b><span>${escapeHtml(review.realityVNext.versionId)} · candidate</span></div>
      <p class="rjx19-choice">${escapeHtml(review.closure.status)} · ${escapeHtml(review.closure.continuationPolicy)} · ${escapeHtml(review.closure.reopenPolicy)}</p>
    </section>`;
}

function render() {
  document.documentElement.lang = state.locale;
  document.querySelectorAll('[data-copy]').forEach(el => { el.textContent = c(el.dataset.copy); });
  document.querySelectorAll('[data-locale]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.locale === state.locale));
  });
  document.querySelectorAll('[data-stage]').forEach(button => {
    button.textContent = c(button.dataset.stage);
    const active = button.dataset.stage === state.stage;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
  });
  document.querySelectorAll('[data-complexity]').forEach(button => {
    button.textContent = c(button.dataset.complexity);
    const active = button.dataset.complexity === state.complexity;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  if (!state.model) return;
  workspace.setAttribute('aria-busy', 'false');
  if (state.stage === 'UNDERSTAND') renderUnderstand();
  if (state.stage === 'CHOOSE') renderChoose();
  if (state.stage === 'REVIEW') renderReview();
}

document.querySelectorAll('[data-locale]').forEach(button => button.addEventListener('click', () => {
  state.locale = button.dataset.locale;
  render();
}));

document.querySelectorAll('[data-stage]').forEach(button => button.addEventListener('click', () => {
  state.stage = button.dataset.stage;
  render();
}));

document.querySelectorAll('[data-complexity]').forEach(button => button.addEventListener('click', () => {
  state.complexity = button.dataset.complexity;
  render();
}));

workspace.innerHTML = `<div class="rjx19-loading">${escapeHtml(c('loading'))}</div>`;
render();

fetch(MODEL_URL, {credentials:'same-origin'})
  .then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(model => {
    if (model.runtimeWriteAuthority !== false || model.persistenceAllowed !== false || model.reviewOnly !== true) {
      throw new Error('Unsafe review model authority state');
    }
    state.model = model;
    state.complexity = model.defaultComplexity;
    render();
  })
  .catch(error => {
    console.error('RJX Phase 19 review model load failed', error);
    workspace.setAttribute('aria-busy', 'false');
    workspace.innerHTML = `<div class="rjx19-error" role="alert">${escapeHtml(c('loadError'))}</div>`;
  });
