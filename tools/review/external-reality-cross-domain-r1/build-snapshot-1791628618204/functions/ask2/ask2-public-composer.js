function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function list(value) { return Array.isArray(value) ? value.map(text).filter(Boolean) : []; }

function extractGovernedText(readingIr) {
  if (!readingIr || typeof readingIr !== 'object') return [];
  const direct = [readingIr.summary, readingIr.directAnswer, readingIr.reading, readingIr.interpretation, readingIr.meaning]
    .map(text).filter(Boolean);
  const arrays = [readingIr.highlights, readingIr.observations, readingIr.findings, readingIr.sections]
    .flatMap(value => Array.isArray(value) ? value : [])
    .map(item => typeof item === 'string' ? item : text(item?.summary || item?.text || item?.description))
    .filter(Boolean);
  return [...new Set([...direct, ...arrays])].slice(0, 8);
}

export function buildAsk2ClientProjection({ plan, composition = null, execution = null, locale = 'zh-Hans' } = {}) {
  const zh = locale === 'zh-Hans';
  const primary = plan?.lensDisclosure?.primary?.label || null;
  const supporting = (plan?.lensDisclosure?.supporting || []).map(item => item.label).filter(Boolean);
  const pending = execution?.pending || [];
  const governed = composition?.runtimeResults || execution?.governedResults || [];
  const governedText = governed.flatMap(item => extractGovernedText(item.readingIr));
  let answerState = 'ASK2_BOUNDED';
  let directAnswer = zh ? 'PHI OS 已建立受治理的运行计划。' : 'PHI OS has built a governed runtime plan.';
  let unknown = [];
  let observe = [];

  if (plan?.orchestrationState === 'CURRENT_CONTEXT_REQUIRED') {
    answerState = 'NEEDS_CONTEXT';
    if (plan?.taxonomy === 'RELATIONSHIP') {
      directAnswer = zh
        ? '仅凭“脾气坏”或一段关系描述，PHI OS 不能判断对方为什么会这样，也不会猜测对方隐藏的感受或意图。先补充具体互动情境，才能区分这是重复的互动模式、特定触发情境，还是仍然没有足够证据解释。'
        : 'A label such as “bad temper” is not enough to establish why another person behaves that way, and PHI OS will not infer hidden feelings or intentions. Add the concrete interaction context first so the answer can distinguish a repeated pattern, a specific trigger, or a genuine evidence gap.';
      unknown = [zh ? '目前没有足够的关系情境证据来解释原因。' : 'There is not enough relationship-context evidence to explain the cause yet.'];
      observe = zh
        ? ['什么时候最容易发生？','发生前通常出现什么事情或压力？','这种情况是否只发生在你们之间，还是其他场景也会出现？','最近有没有明显变化？']
        : ['When does it happen most often?','What usually happens or changes just before it?','Does it happen mainly between you two, or in other settings as well?','Has anything changed recently?'];
    } else {
      directAnswer = zh ? '这个问题需要先理解你当前现实中实际发生了什么，再调用相应 Runtime。' : 'This question needs current reality context before a runtime is used.';
      unknown = [zh ? '目前没有足够的 Current Context evidence。' : 'Current Context evidence is not yet available.'];
      observe = [zh ? '补充正在发生什么、持续多久、什么发生了变化，以及现在最重要的是什么。' : 'Add what is happening, how long it has been happening, what changed, and what matters most now.'];
    }
  } else if (plan?.orchestrationState === 'CURRENT_EXTERNAL_EVIDENCE_REQUIRED') {
    answerState = 'NEEDS_CURRENT_AUTHORITY';
    directAnswer = zh ? '这个问题需要当前外部权威资料。PHI OS 不会用模型记忆代替 Current Authority。' : 'This question requires current external authority. PHI OS will not substitute model memory.';
    unknown = [zh ? '当前受治理的 CWA evidence 尚未提供。' : 'Governed CWA evidence has not been provided.'];
  } else if (plan?.orchestrationState === 'PROFESSIONAL_HANDOFF_REQUIRED') {
    answerState = 'PROFESSIONAL_HANDOFF';
    directAnswer = zh ? '这个问题需要专业判断；symbolic lens 不能替代专业人员。' : 'This question requires professional judgment; a symbolic lens cannot replace a professional.';
  } else if (pending.length) {
    answerState = 'ASK2_INPUT_REQUIRED';
    directAnswer = zh
      ? `PHI OS 已选择${primary ? `「${primary}」` : '相应 Runtime'}，但还需要受治理的 Runtime 输入或既有 Runtime 结果，不能由模型自行补算。`
      : `PHI OS selected ${primary || 'the governed runtime'}, but governed runtime input or an existing runtime result is still required; the model cannot calculate it.`;
    unknown = pending.map(item => `${item.routeKey}: ${item.state}`);
  } else if (governedText.length) {
    answerState = 'ANSWERED';
    directAnswer = governedText[0];
    observe = governedText.slice(1);
  } else if (plan?.orchestrationState === 'REALITY_EVIDENCE_ONLY') {
    answerState = 'PARTIALLY_ANSWERED';
    const external = plan?.currentReality?.external || [];
    directAnswer = external.length
      ? (zh ? '已取得受治理的 Current External Evidence；没有使用 symbolic lens 改写事实。' : 'Governed current external evidence is available; no symbolic lens was used to rewrite it.')
      : (zh ? '这个问题以现实证据为主，不需要 symbolic lens。' : 'This question is primarily about reality evidence and does not require a symbolic lens.');
  }

  const whyThisMayHappen = plan?.orchestrationState === 'CURRENT_CONTEXT_REQUIRED' && plan?.taxonomy === 'RELATIONSHIP'
    ? [zh
      ? '你的问题涉及两个人之间的互动，因此这里先按关系情境处理；在没有具体互动资料前，不推断对方的隐藏感受、意图或心理状态。'
      : 'Your question concerns interaction between two people, so it is handled as relationship context first; without concrete interaction evidence, hidden feelings, intentions or mental states are not inferred.']
    : (plan?.whyThisLens?.reason ? [plan.whyThisLens.reason] : []);
  return Object.freeze({
    answerState,
    question: plan?.question || '',
    directAnswer,
    whyThisMayHappen,
    whatToObserve: observe,
    unknown: Object.freeze({ details: Object.freeze(unknown) }),
    disclosure: Object.freeze({ primary, supporting, why: plan?.whyThisLens?.reason || null }),
    boundaries: Object.freeze({ runtimeFirst: true, modelMayCalculate: false, currentEvidenceMayBeMutatedByLens: false })
  });
}
