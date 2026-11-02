import { initializeI18n, onLocaleChange } from '../i18n.js';
import { SESSION, cleanText, escapeHTML } from '../shared.js';
import { CONTINUITY_KEY, MEMORY_KEY, REVIEW_KEY, WORKSPACE_STATE_KEY } from '../modules/runtime-workspace-state.js';
import { RuntimeKernel } from '../runtime/index.js';
import { buildJourneyDashboardProjection } from '../modules/journey-dashboard-projection.js';
import { buildReadingCustomerProjection } from '../modules/reading-customer-projection.js';
import { buildNavigationCustomerProjection } from '../modules/navigation-customer-projection.js';
import { fetchPublicAssetConfig, resolvePublicAsset, resolvePublicAssetForWeb } from '../runtime/web-production/asset-resolver.js';

const COPY = {
  en: {
    skip:'Skip to Reality Workspace', heroEyebrow:'Reality Workspace', heroTitle:'See your reality clearly enough to move.', heroLead:'Bring one changing situation into focus. Separate what is known from what is uncertain, compare possible directions, then return to see what actually changed.', start:'Start with my reality', resume:'Continue my reality', howItWorks:'How Reality Workspace works', currentEyebrow:'Your current reality', emptyRealityTitle:'No current Reality yet.', emptyRealitySummary:'Start with one change you can describe. You do not need a complete explanation.', continue:'Continue', currentFocus:'Current focus', stillUnresolved:'Still unresolved', lastReviewed:'Last updated', next:'Next', notEstablished:'Not established', beginWithSituation:'Describe what is changing', UNDERSTAND:'Understand', CHOOSE:'Choose', REVIEW:'Review', understandEyebrow:'Understand', understandTitle:'Start with what is supported now.', understandLead:'Keep observations, interpretations and unknowns visibly separate so that the next step does not depend on false certainty.', observed:'Observed', inferred:'Inferred', possible:'Possible', unknown:'Unknown', earlier:'Earlier', yourSituation:'Your situation', noSituation:'No situation has been recorded yet.', noSituationHelp:'Begin with one recent change and describe what it affects.', currentReading:'Current reading', readingNotReady:'A reading is not ready yet.', readingNotReadyHelp:'Once your situation has enough support, the current Reading will appear here with its limits visible.', whatChanged:'What changed', whatMatters:'What appears important', whatConnected:'What may be connected', stillUnknown:'Still unknown', connectedReality:'View connected Reality', relationships:'Relationships', timeline:'Timeline', noRelationships:'No connected relationships are available yet.', noTimeline:'No Reality timeline is available yet.', continuityEyebrow:'Reality keeps moving', continuityVisualTitle:'A useful reading should be able to change when reality changes.', continuityVisualLead:'Observe what is here now, choose a direction you can review, act in the real world, then return with what actually happened.', continuityCaption:'Observation, direction, real-world change and return stay connected without turning the illustration into a technical diagram.', chooseEyebrow:'Choose', chooseTitle:'Compare directions without handing over the decision.', chooseLead:'Each direction should show its reason, constraints, evidence to watch and review point. PHI OS does not automatically select the final action for you.', optionsNotReady:'Directions are not ready yet.', optionsNotReadyHelp:'Complete the current Reading first. Existing Navigation will appear here when bounded paths are available.', continueReading:'Continue Reading', direction:'Direction', reason:'Why this may help', constraint:'Constraint', evidenceToWatch:'What to look for', reviewPoint:'Review when', boundary:'Boundary', choiceRemainsYours:'The choice remains yours.', considerDirection:'Review this direction', myNextStep:'My next step', lookFor:'I will look for', reviewWhen:'Review when', reviewChoice:'Review this choice', reviewEyebrow:'Review', reviewTitle:'Return with what actually happened.', reviewLead:'Compare the signal you expected with what you observed. A later Reality can differ from an earlier one without rewriting the earlier record.', expected:'Expected', observedOutcome:'Observed', changed:'Changed', unchanged:'Unchanged', reviewActionTitle:'Ready to record what happened?', reviewActionCopy:'Use Review to record what happened. Opening this workspace alone does not create a new Reality or rewrite history.', openReview:'Open Review', howEyebrow:'How the workspace moves', howTitle:'One Reality can be understood, acted on and revisited.', howLead:'The workspace presents a simple three-stage client view while more detailed evidence, reading, navigation and continuity processing stays governed behind it.', figureCaption:'Reality Journey structure', continuityBandEyebrow:'Reality continuity', continuityBandTitle:'Keep the past. Record the difference. Continue from what is now true.', continuityBandLead:'Review creates a successor only through an explicit choice. Earlier Reality remains available as history rather than being silently overwritten.', whatChangedShort:'What changed', continueReality:'Continue this Reality', askEyebrow:'Ask PHI OS', askTitle:'Ask about the Reality you are viewing.', askLead:'You can inspect what context would be carried forward before opening Ask PHI OS.', contextSummary:'See what context would be used', contextNone:'No private Reality context is currently available.', askAction:'Ask PHI OS', askBoundary:'Other saved Realities, personal method results and account history are not silently included.', currentSituationContext:'Current situation', currentReadingContext:'Current reading', knownUnknownContext:'Known / unknown boundary', stageEntry:'Describe what is changing', stageReconstruction:'Understand how it formed', stageReading:'Review the current reading', stageNavigation:'Compare available directions', stageReview:'Review what happened', stageMemory:'Review what is retained', stageContinuity:'Decide how to continue', unresolvedNone:'No unresolved items surfaced', changedNotRecorded:'No change comparison recorded yet', mattersNotReady:'Important conditions will appear after Reading', connectedNotReady:'Connections will appear only when supported', situationRecorded:'Current situation recorded', readingReady:'Current reading available', selected:'Selected', expectedNotSet:'No expected signal recorded yet', observedNotSet:'No observed outcome recorded yet', unchangedNotSet:'No unchanged summary recorded yet'
  },
  'zh-Hans': {
    skip:'跳到现实工作区', heroEyebrow:'现实工作区', heroTitle:'看清现实，清楚到足以继续前进。', heroLead:'把一个正在变化的情况带进来。分开已知、推断与未知，比较可复核的方向，然后带着现实中真正发生的变化回来。', start:'从我的现实开始', resume:'继续我的现实', howItWorks:'现实工作区如何运行', currentEyebrow:'你目前的现实', emptyRealityTitle:'目前还没有已建立的现实。', emptyRealitySummary:'从一个你能够描述的变化开始，不需要先拥有完整解释。', continue:'继续', currentFocus:'目前焦点', stillUnresolved:'仍未解决', lastReviewed:'最近更新', next:'下一步', notEstablished:'尚未建立', beginWithSituation:'描述正在发生什么变化', UNDERSTAND:'理解', CHOOSE:'选择', REVIEW:'复核', understandEyebrow:'理解', understandTitle:'先从目前有支持的内容开始。', understandLead:'把观察、解释与未知清楚分开，让下一步不建立在虚假的确定性上。', observed:'已观察', inferred:'推断', possible:'可能', unknown:'未知', earlier:'较早', yourSituation:'你的情况', noSituation:'还没有记录任何情况。', noSituationHelp:'从一个近期变化开始，并说明它影响什么。', currentReading:'目前读取', readingNotReady:'读取还没有准备好。', readingNotReadyHelp:'当情况拥有足够支持后，目前的读取会显示在这里，并保留清楚的限制。', whatChanged:'发生了什么变化', whatMatters:'什么看起来重要', whatConnected:'什么可能有关联', stillUnknown:'仍然未知', connectedReality:'查看关联现实', relationships:'关系', timeline:'时间线', noRelationships:'目前还没有可显示的关联关系。', noTimeline:'目前还没有现实时间线。', continuityEyebrow:'现实会继续变化', continuityVisualTitle:'现实改变时，一次有用的读取也应该能够改变。', continuityVisualLead:'观察现在存在什么，选择一个可复核的方向，在现实中行动，然后带着真正发生的结果回来。', continuityCaption:'观察、方向、现实变化与返回保持连续，同时不把场景插图伪装成技术结构图。', chooseEyebrow:'选择', chooseTitle:'比较方向，但不把决定权交给系统。', chooseLead:'每个方向都应显示理由、限制、需要观察的证据与复核点。PHI OS 不会替你自动选择最终行动。', optionsNotReady:'方向还没有准备好。', optionsNotReadyHelp:'先完成目前的 Reading。当现有 Navigation 形成有边界的路径后，会显示在这里。', continueReading:'继续读取', direction:'方向', reason:'为什么可能有帮助', constraint:'限制', evidenceToWatch:'要观察什么', reviewPoint:'什么时候复核', boundary:'边界', choiceRemainsYours:'选择仍然属于你。', considerDirection:'查看这个方向', myNextStep:'我的下一步', lookFor:'我要观察', reviewWhen:'复核条件', reviewChoice:'查看这个选择', reviewEyebrow:'复核', reviewTitle:'带着现实中真正发生的事情回来。', reviewLead:'比较预期信号与实际观察。下一版现实可以不同于上一版，但不会改写上一版。', expected:'预期', observedOutcome:'已观察', changed:'已改变', unchanged:'未改变', reviewActionTitle:'准备记录实际发生了什么吗？', reviewActionCopy:'通过复核记录实际发生的变化。仅仅打开这个工作区不会建立新现实，也不会改写历史。', openReview:'打开复核', howEyebrow:'工作区如何推进', howTitle:'一个现实可以被理解、行动，并在之后重新复核。', howLead:'工作区只呈现简单的三个客户阶段；更详细的证据、读取、导航与连续性处理继续在后台受到治理。', figureCaption:'现实旅程结构', continuityBandEyebrow:'现实连续性', continuityBandTitle:'保留过去，记录差异，从现在真实存在的状态继续。', continuityBandLead:'只有经过明确选择，复核才会形成下一版。较早的现实继续作为历史存在，不会被静默覆盖。', whatChangedShort:'发生的变化', continueReality:'继续这个现实', askEyebrow:'询问 PHI OS', askTitle:'询问你正在查看的这个现实。', askLead:'打开 Ask PHI OS 前，你可以先看清会带入哪些当前上下文。', contextSummary:'查看会使用哪些上下文', contextNone:'目前没有可使用的私人现实上下文。', askAction:'询问 PHI OS', askBoundary:'其他已保存现实、个人方法结果与账户历史不会被静默加入。', currentSituationContext:'目前情况', currentReadingContext:'目前读取', knownUnknownContext:'已知 / 未知边界', stageEntry:'描述正在发生什么变化', stageReconstruction:'理解它如何形成', stageReading:'查看目前读取', stageNavigation:'比较可用方向', stageReview:'复核实际发生什么', stageMemory:'查看保留了什么', stageContinuity:'决定如何继续', unresolvedNone:'目前没有浮现未解决项目', changedNotRecorded:'还没有记录变化比较', mattersNotReady:'完成 Reading 后才会显示重要条件', connectedNotReady:'只有具备支持时才会显示关联', situationRecorded:'目前情况已记录', readingReady:'目前读取已可用', selected:'已选择', expectedNotSet:'还没有记录预期信号', observedNotSet:'还没有记录实际结果', unchangedNotSet:'还没有记录未改变部分'
  }
};

const ACTIVE_JOURNEY_KEYS = Object.freeze([
  SESSION.initial, SESSION.entryState, SESSION.runtimeEntity, SESSION.entry,
  SESSION.reconstruction, SESSION.reconstructionInquiry, SESSION.readingInput,
  SESSION.reading, SESSION.navigationInput, SESSION.navigation, REVIEW_KEY,
  MEMORY_KEY, CONTINUITY_KEY, WORKSPACE_STATE_KEY
]);

const state = { locale: 'en', stage: 'UNDERSTAND', data: null };
const q = (selector, root = document) => root.querySelector(selector);
const qa = (selector, root = document) => [...root.querySelectorAll(selector)];
const get = key => RuntimeKernel.contracts.get(key, null);
const list = value => Array.isArray(value) ? value : [];
const text = value => cleanText(typeof value === 'string' ? value : '');
const firstText = (...values) => values.map(value => {
  if (typeof value === 'string') return text(value);
  if (!value || typeof value !== 'object') return '';
  return text(value.statement || value.summary || value.label || value.title || value.name || value.text || '');
}).find(Boolean) || '';
const t = key => COPY[state.locale]?.[key] ?? COPY.en[key] ?? key;

function localize() {
  document.documentElement.lang = state.locale;
  qa('[data-rw-copy]').forEach(el => { el.textContent = t(el.dataset.rwCopy); });
}

function hasActiveJourney() {
  return ACTIVE_JOURNEY_KEYS.some(key => RuntimeKernel.contracts.has(key));
}

function collectDashboard() {
  const snapshot = RuntimeKernel.persistence.loadSnapshot();
  const persistedWorkspace = RuntimeKernel.contracts.get(WORKSPACE_STATE_KEY, {});
  const snapshotValidation = snapshot ? RuntimeKernel.persistence.validateSnapshot(snapshot) : { valid:false, reason:'snapshot_missing' };
  return buildJourneyDashboardProjection({
    workspace: RuntimeKernel.workspace.inspect(persistedWorkspace.currentStage || ''),
    lineage: RuntimeKernel.lineage.timeline(), snapshot, snapshotValidation,
    recoveryState: RuntimeKernel.persistence.recoveryState(), hasActiveJourney: hasActiveJourney()
  });
}

function extractReading(raw) {
  const readingRoot = raw?.reading || {};
  const integrated = readingRoot.integratedReading || {};
  const boundary = readingRoot.evidenceBoundary || {};
  const primary = integrated.primaryPattern || {};
  const alternative = integrated.alternativeReading || {};
  const projection = buildReadingCustomerProjection(raw || {});
  const observed = list(integrated.observedEvidence || boundary.observedEvidence).map(firstText).filter(Boolean);
  const unknown = list(integrated.unknownReality || boundary.unknownReality).map(firstText).filter(Boolean);
  const risks = list(integrated.risks).map(firstText).filter(Boolean);
  const watch = list(integrated.evidenceWatch).map(firstText).filter(Boolean);
  return {
    projection,
    summary: firstText(primary.summary, primary.statement, integrated.summary, readingRoot.summary),
    alternative: firstText(alternative.summary, alternative.statement),
    observed, unknown, risks, watch,
    established: Boolean(firstText(primary.summary, primary.statement, integrated.summary, readingRoot.summary) || projection.runtimePattern.established)
  };
}

function extractNavigation(raw) {
  const nav = raw?.navigation || raw || {};
  const paths = list(nav.availablePaths || nav.boundedNavigationPaths || nav.boundedPath);
  const selected = nav.selectedPath && typeof nav.selectedPath === 'object' ? nav.selectedPath : null;
  return { projection: buildNavigationCustomerProjection(raw || {}), nav, paths, selected };
}

function collectData() {
  const entry = get(SESSION.entry) || {};
  const entryState = get(SESSION.entryState) || {};
  const reconstruction = get(SESSION.reconstruction) || {};
  const readingRaw = get(SESSION.reading) || null;
  const navigationRaw = get(SESSION.navigation) || null;
  const review = get(REVIEW_KEY) || {};
  const memory = get(MEMORY_KEY) || {};
  const continuity = get(CONTINUITY_KEY) || {};
  const dashboard = collectDashboard();
  const reading = extractReading(readingRaw || {});
  const navigation = extractNavigation(navigationRaw || {});
  const situation = firstText(
    entry?.realityChange?.normalizedStatement, entry?.realityChange?.rawStatement,
    entry?.normalizedStatement, entry?.statement, entryState?.summary,
    reconstruction?.summary?.normalizedStatement, reconstruction?.summary,
    reconstruction?.currentReality?.summary, reconstruction?.statement
  );
  const reconstructionSummary = firstText(reconstruction?.summary, reconstruction?.currentReality?.summary, reconstruction?.reconstructionSummary);
  return { entry, entryState, reconstruction, readingRaw, navigationRaw, review, memory, continuity, dashboard, reading, navigation, situation, reconstructionSummary };
}

function customerStage(runtimeStage) {
  if (['navigation'].includes(runtimeStage)) return 'CHOOSE';
  if (['review','memory','continuity'].includes(runtimeStage)) return 'REVIEW';
  return 'UNDERSTAND';
}

function formatDate(value) {
  if (!value) return t('notEstablished');
  const d = new Date(value); if (Number.isNaN(d.getTime())) return t('notEstablished');
  return new Intl.DateTimeFormat(state.locale === 'zh-Hans' ? 'zh-CN' : 'en', { dateStyle:'medium' }).format(d);
}

function setText(selector, value, fallbackKey = 'notEstablished') {
  const el = q(selector); if (el) el.textContent = text(value) || t(fallbackKey);
}

function setStage(stage) {
  state.stage = ['UNDERSTAND','CHOOSE','REVIEW'].includes(stage) ? stage : 'UNDERSTAND';
  qa('[data-rw-stage]').forEach(button => {
    const active = button.dataset.rwStage === state.stage;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current','step'); else button.removeAttribute('aria-current');
  });
  qa('[data-rw-panel]').forEach(panel => { panel.hidden = panel.dataset.rwPanel !== state.stage; });
}

function renderSummary(data) {
  const { dashboard, situation, reading } = data;
  const current = q('.rw-current');
  current.dataset.rwState = dashboard.hasActiveJourney ? 'active' : 'empty';
  const action = q('[data-rw-resume]');
  const primary = q('#rwPrimaryAction');
  if (dashboard.hasActiveJourney) {
    setText('[data-rw-current-title]', situation || reading.summary, 'situationRecorded');
    setText('[data-rw-current-summary]', reading.summary || data.reconstructionSummary || situation, 'readingNotReadyHelp');
    setText('[data-rw-focus]', t(`stage${dashboard.currentStage[0].toUpperCase()}${dashboard.currentStage.slice(1)}`), 'notEstablished');
    setText('[data-rw-unknowns]', reading.unknown.slice(0,2).join(' · '), 'unresolvedNone');
    setText('[data-rw-updated]', formatDate(dashboard.latestUpdate));
    setText('[data-rw-next]', t(`stage${dashboard.nextStepStage[0].toUpperCase()}${dashboard.nextStepStage.slice(1)}`), 'notEstablished');
    action.href = dashboard.resumeRoute || '/reality-entry?mode=resume';
    primary.href = dashboard.resumeRoute || '/reality-entry?mode=resume';
    q('#rwPrimaryAction span:first-child').textContent = t('resume');
  } else {
    setText('[data-rw-current-title]', '', 'emptyRealityTitle');
    setText('[data-rw-current-summary]', '', 'emptyRealitySummary');
    setText('[data-rw-focus]', '', 'notEstablished');
    setText('[data-rw-unknowns]', '', 'notEstablished');
    setText('[data-rw-updated]', '', 'notEstablished');
    setText('[data-rw-next]', '', 'beginWithSituation');
    action.href = '/reality-entry'; primary.href = '/reality-entry';
    q('#rwPrimaryAction span:first-child').textContent = t('start');
  }
  setStage(customerStage(dashboard.currentStage));
}

function renderUnderstand(data) {
  const { situation, reconstructionSummary, reading } = data;
  setText('[data-rw-situation-title]', situation, 'noSituation');
  setText('[data-rw-situation-text]', reconstructionSummary || situation, 'noSituationHelp');
  setText('[data-rw-reading-title]', reading.summary, 'readingNotReady');
  setText('[data-rw-reading-text]', reading.alternative || (reading.established ? reading.summary : ''), 'readingNotReadyHelp');
  setText('[data-rw-changed]', reconstructionSummary || firstText(data.review?.changeSummary, data.review?.customerReport?.changeSummary), 'changedNotRecorded');
  setText('[data-rw-matters]', [...reading.risks, ...reading.watch].slice(0,3).join(' · '), 'mattersNotReady');
  setText('[data-rw-connected]', reading.alternative, 'connectedNotReady');
  setText('[data-rw-still-unknown]', reading.unknown.slice(0,4).join(' · '), 'unresolvedNone');

  const relationshipTarget = q('[data-rw-relationships]');
  const entities = list(data.reconstruction?.entities || data.reconstruction?.relationships?.entities);
  const relationships = list(data.reconstruction?.relationships?.relationships || data.reconstruction?.relationships);
  if (relationships.length) {
    relationshipTarget.innerHTML = relationships.slice(0,8).map(rel => `<p>${escapeHTML(firstText(rel.fromLabel, rel.from, rel.source))} <span aria-hidden="true">↔</span> ${escapeHTML(firstText(rel.toLabel, rel.to, rel.target))}${firstText(rel.label, rel.relationship) ? ` · ${escapeHTML(firstText(rel.label, rel.relationship))}` : ''}</p>`).join('');
  } else if (entities.length > 1) {
    relationshipTarget.innerHTML = entities.slice(0,8).map(entity => `<p>${escapeHTML(firstText(entity.label, entity.name, entity.title))}</p>`).join('');
  } else relationshipTarget.innerHTML = `<p>${escapeHTML(t('noRelationships'))}</p>`;

  const timelineTarget = q('[data-rw-timeline]');
  if (data.dashboard.timeline.length) {
    timelineTarget.innerHTML = data.dashboard.timeline.slice(0,8).map(event => `<li><strong>${escapeHTML(firstText(event.summary, event.title, event.type) || 'Update')}</strong><br><small>${escapeHTML(formatDate(event.occurredAt))}</small></li>`).join('');
  } else timelineTarget.innerHTML = `<li>${escapeHTML(t('noTimeline'))}</li>`;
}

function pathDetail(path, keyCandidates) {
  return firstText(...keyCandidates.map(key => path?.[key]));
}

function renderChoose(data) {
  const { navigation } = data;
  const target = q('[data-rw-options]');
  const empty = q('[data-rw-options-empty]');
  const paths = navigation.paths;
  target.innerHTML = '';
  empty.hidden = paths.length > 0;
  if (paths.length) {
    target.innerHTML = paths.slice(0,6).map((path, index) => {
      const title = firstText(path.title, path.label, path.name, path.summary, path.id) || `${t('direction')} ${index + 1}`;
      const reason = pathDetail(path, ['rationale','reason','description']);
      const constraint = pathDetail(path, ['constraint','boundary','limitation']);
      const evidence = list(path.evidenceWatch || path.evidenceBasis || path.evidenceToWatch).map(firstText).filter(Boolean).join(' · ');
      const review = list(path.reviewConditions || path.reviewPoint).map(firstText).filter(Boolean).join(' · ') || firstText(path.reviewCondition, path.reviewDateOrCondition);
      return `<article class="rw-option-card">
        <span class="rw-evidence-tag is-possible">${escapeHTML(t('possible'))}</span>
        <h3>${escapeHTML(title)}</h3>
        <dl>
          <div><dt>${escapeHTML(t('reason'))}</dt><dd>${escapeHTML(reason || t('notEstablished'))}</dd></div>
          <div><dt>${escapeHTML(t('constraint'))}</dt><dd>${escapeHTML(constraint || t('notEstablished'))}</dd></div>
          <div><dt>${escapeHTML(t('evidenceToWatch'))}</dt><dd>${escapeHTML(evidence || t('notEstablished'))}</dd></div>
          <div><dt>${escapeHTML(t('reviewPoint'))}</dt><dd>${escapeHTML(review || t('notEstablished'))}</dd></div>
        </dl>
        <p><strong>${escapeHTML(t('choiceRemainsYours'))}</strong></p>
        <a class="rw-text-link" href="/reality-navigation">${escapeHTML(t('considerDirection'))} →</a>
      </article>`;
    }).join('');
  }
  const selected = navigation.selected;
  const next = q('[data-rw-next-step]');
  next.hidden = !selected;
  if (selected) {
    setText('[data-rw-selected-title]', firstText(selected.title, selected.label, selected.name, selected.id), 'selected');
    setText('[data-rw-selected-action]', firstText(selected.firstStep, selected.nextStep, selected.rationale), 'notEstablished');
    setText('[data-rw-selected-evidence]', list(selected.evidenceWatch || selected.evidenceBasis).map(firstText).filter(Boolean).join(' · '), 'notEstablished');
    setText('[data-rw-selected-review]', list(selected.reviewConditions).map(firstText).filter(Boolean).join(' · ') || firstText(selected.reviewDateOrCondition), 'notEstablished');
  }
}

function renderReview(data) {
  const review = data.review || {};
  const selected = data.navigation.selected || {};
  const expected = firstText(
    review.expectedSignal, review.reviewScope?.expectedSignal, review.customerReport?.expectedSignal,
    selected.expectedSignal, selected['Expected Signal']
  );
  const observed = firstText(review.observedOutcome, review.outcome, review.reviewOutcome?.summary, review.customerReport?.outcomeSummary, data.memory?.outcomeMemory?.summary);
  const changed = firstText(review.changeSummary, review.customerReport?.changeSummary, review.reviewOutcome?.changeSummary, data.continuity?.realityDiff?.summary);
  const unchanged = firstText(review.unchangedSummary, review.customerReport?.unchangedSummary, review.reviewOutcome?.unchangedSummary);
  setText('[data-rw-expected]', expected, 'expectedNotSet');
  setText('[data-rw-observed-outcome]', observed, 'observedNotSet');
  setText('[data-rw-review-changed]', changed, 'changedNotRecorded');
  setText('[data-rw-review-unchanged]', unchanged, 'unchangedNotSet');
  setText('[data-rw-version-before]', firstText(data.continuity?.previousRealityVersion, review.previousRealityVersion, data.memory?.predecessorVersionId) || (data.dashboard.hasActiveJourney ? 'Reality earlier' : '—'));
  setText('[data-rw-version-diff]', firstText(data.continuity?.realityDiff?.summary, data.continuity?.diffId, review.realityDiff?.diffId), 'whatChangedShort');
  setText('[data-rw-version-next]', firstText(data.continuity?.realityVNext?.versionId, review.realityVNext?.versionId, data.continuity?.nextRealityVersion) || (data.dashboard.hasActiveJourney ? 'Reality next' : '—'));
}

function renderAsk(data) {
  const listTarget = q('[data-rw-context-list]');
  const context = [];
  if (data.situation) context.push(t('currentSituationContext'));
  if (data.reading.established) context.push(t('currentReadingContext'));
  if (data.reading.unknown.length) context.push(t('knownUnknownContext'));
  listTarget.innerHTML = context.length ? context.map(item => `<li>${escapeHTML(item)}</li>`).join('') : `<li>${escapeHTML(t('contextNone'))}</li>`;
  const ask = q('[data-rw-ask]');
  ask.href = data.dashboard.hasActiveJourney
    ? '/knowledge-search?entrySurface=REALITY_WORKSPACE&mode=REALITY_CONTEXT'
    : '/knowledge-search?entrySurface=REALITY_WORKSPACE&mode=GLOBAL';
}

async function resolveRealityWorkspaceIllustration() {
  const [response, publicConfig] = await Promise.all([
    fetch('/content/web-production/registries/client-visual-asset-registry-v1.7.json', { headers:{ Accept:'application/json' } }),
    fetchPublicAssetConfig()
  ]);
  if (!response.ok) throw new Error('reality_workspace_visual_successor_unavailable');
  const registry = await response.json();
  const illustration = registry.assets?.find(asset => asset.sequence === 'ILL-010');
  if (!illustration?.r2?.ownerReportedUploaded || !illustration?.r2?.objectKey) throw new Error('illustration_not_registered');
  return resolvePublicAsset({
    registry:{
      bucket:'phios-public-assets',
      assets:[{
        asset_code:'ILL-010', category:'illustration', family:'ILLUSTRATION',
        object_key:illustration.r2.objectKey, format:'webp', content_type:'image/webp',
        verification:'verified-owner-reported-upload', width:illustration.productionSpec?.width || 2400,
        height:illustration.productionSpec?.height || 1350, loading:'lazy', fetchPriority:'auto'
      }]
    },
    assetCode:'ILL-010', publicBaseUrl:publicConfig.publicAssetBaseUrl,
    surface:'REALITY_WORKSPACE', locale:state.locale
  });
}

function setAssetUnavailable(image) {
  image.classList.add('is-unavailable');
  const media = image.closest('figure');
  if (media) {
    media.hidden = true;
    media.parentElement?.classList.add('is-media-unavailable');
  }
}

function setAssetReady(image) {
  image.classList.add('is-ready');
  const media = image.closest('figure');
  if (media) {
    media.hidden = false;
    media.parentElement?.classList.remove('is-media-unavailable');
  }
}

async function hydrateAsset(code, image) {
  try {
    const asset = code === 'ILL-010'
      ? await resolveRealityWorkspaceIllustration()
      : await resolvePublicAssetForWeb(code, { surface:'REALITY_WORKSPACE', locale:state.locale });
    if (!asset.renderable) throw new Error('asset_not_renderable');
    image.src = asset.src;
    if (asset.srcset) image.srcset = asset.srcset;
    if (asset.sizes) image.sizes = asset.sizes;
    if (asset.width) image.width = asset.width;
    if (asset.height) image.height = asset.height;
    if (image.complete && image.naturalWidth > 0) setAssetReady(image);
    else image.addEventListener('load', () => setAssetReady(image), { once:true });
    image.addEventListener('error', () => setAssetUnavailable(image), { once:true });
  } catch {
    setAssetUnavailable(image);
  }
}

async function hydrateAssets() {
  await Promise.all(qa('[data-rw-asset]').map(img => hydrateAsset(img.dataset.rwAsset, img)));
}

function render() {
  state.data = collectData();
  localize();
  renderSummary(state.data);
  renderUnderstand(state.data);
  renderChoose(state.data);
  renderReview(state.data);
  renderAsk(state.data);
}

function boot() {
  initializeI18n();
  state.locale = document.documentElement.lang === 'zh-Hans' ? 'zh-Hans' : 'en';
  qa('[data-rw-stage]').forEach(button => button.addEventListener('click', () => setStage(button.dataset.rwStage)));
  render();
  void hydrateAssets();
  onLocaleChange(detail => {
    state.locale = detail?.locale === 'zh-Hans' ? 'zh-Hans' : 'en';
    render();
    void hydrateAssets();
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true }); else boot();
