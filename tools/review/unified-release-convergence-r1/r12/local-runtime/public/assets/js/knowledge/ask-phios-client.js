import '../pages/knowledge-search-c.js';

const cleanObject = value => Object.fromEntries(Object.entries(value || {}).filter(([, item]) => item !== undefined && item !== null && item !== ''));

function renderAsk2Disclosure(payload) {
  const ask2 = payload?.ask2;
  const client = ask2?.client;
  const plan = ask2?.plan;
  if (!ask2 || !plan) return;
  const answer = document.querySelector('[data-cka-answer]');
  if (!answer) return;
  let section = answer.querySelector('[data-ask2-disclosure]');
  if (!section) {
    section = document.createElement('section');
    section.dataset.ask2Disclosure = '';
    section.className = 'cka-answer__ask2-disclosure';
    const firstSection = answer.querySelector('section');
    if (firstSection) answer.insertBefore(section, firstSection);
    else answer.prepend(section);
  }
  const zh = (document.documentElement.lang || '').toLowerCase().startsWith('zh');
  const primary = client?.disclosure?.primary || plan?.lensDisclosure?.primary?.label || '';
  const supporting = client?.disclosure?.supporting || (plan?.lensDisclosure?.supporting || []).map(item => item.label).filter(Boolean);
  const why = client?.disclosure?.why || plan?.whyThisLens?.reason || '';
  const safe = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  section.innerHTML = [
    `<p class="knowledge-eyebrow">${zh ? '运行与视角披露' : 'Runtime & lens disclosure'}</p>`,
    primary ? `<p><strong>${zh ? '使用：' : 'Using:'}</strong> ${safe(primary)}</p>` : '',
    supporting.length ? `<p><strong>${zh ? '辅助：' : 'Supporting:'}</strong> ${safe(supporting.join(' · '))}</p>` : '',
    why ? `<p><strong>${zh ? '为什么使用这个视角：' : 'Why this lens:'}</strong> ${safe(why)}</p>` : '',
    `<p class="cka-empty">${zh ? 'Runtime 结果来自受治理执行；模型不能自行补算结构、位置、周期或动态状态。' : 'Runtime results come from governed execution; the model cannot invent structure, positions, cycles, or dynamic state.'}</p>`
  ].join('');
}


function reconcileAskBoundary() {
  const node = document.querySelector('.cka-entry-boundary p');
  if (!node) return;
  const zh = (document.documentElement.lang || '').toLowerCase().startsWith('zh');
  const desired = zh
    ? 'Guest 可以提问、进行一次有限追问、查看 Related Knowledge，并使用临时上下文。Ask 只会在 capability gate、必要输入与受治理 Runtime 都满足时调用 Runtime；模型不能自行补算 Method，也不会把问题上下文变成 Canonical Reality。历史、保存、持久化与 Journey continuity 仍需要 account。'
    : 'Guests can Ask, receive one limited follow-up, view Related Knowledge and use temporary context. Ask invokes a Runtime only when capability gates, required inputs and governed execution are satisfied; the model cannot invent Method calculations or turn question context into Canonical Reality. History, saving, persistence and Journey continuity still require an account.';
  if (node.textContent !== desired) node.textContent = desired;
}

queueMicrotask(reconcileAskBoundary);
const boundaryNode = document.querySelector('.cka-entry-boundary p');
if (boundaryNode) new MutationObserver(reconcileAskBoundary).observe(boundaryNode, { childList: true, characterData: true, subtree: true });

export async function askPhios({
  query,
  locale,
  depth = 'STANDARD',
  source = 'hybrid',
  entryContext = {},
  followUpContext = {},
  guidedContext = {},
  useCurrentRealityContext = false,
  currentContextSnapshot = null,
  currentExternalEvidence = [],
  runtimeInputs = {},
  runtimeResults = {},
  signal
} = {}) {
  const body = {
    q: String(query ?? ''),
    locale: String(locale || 'zh-Hans'),
    depth: String(depth || 'STANDARD'),
    source: String(source || 'hybrid'),
    entryContext: cleanObject({
      entrySurface: entryContext.entrySurface,
      entryRoute: entryContext.entryRoute,
      contextType: entryContext.contextType,
      contextId: entryContext.contextId,
      bookCode: entryContext.bookCode,
      partCode: entryContext.partCode,
      articleCode: entryContext.articleCode,
      figureCode: entryContext.figureCode,
      mode: entryContext.mode,
      contextLabel: entryContext.contextLabel,
      contextSummary: entryContext.contextSummary,
      readingPath: entryContext.readingPath,
      relatedKnowledgeRef: entryContext.relatedKnowledgeRef
    }),
    followUpContext: cleanObject({
      contextQuestion: followUpContext.contextQuestion,
      parentAnswerId: followUpContext.parentAnswerId,
      groundingBundleId: followUpContext.groundingBundleId,
      followUpDepth: followUpContext.followUpDepth
    }),
    guidedContext: cleanObject({
      whatIsHappening: guidedContext.whatIsHappening,
      howLong: guidedContext.howLong,
      whoOrWhatIsInvolved: guidedContext.whoOrWhatIsInvolved,
      whatChanged: guidedContext.whatChanged,
      whatTried: guidedContext.whatTried,
      whatMattersMostNow: guidedContext.whatMattersMostNow
    }),
    useCurrentRealityContext: useCurrentRealityContext === true,
    currentContextSnapshot,
    currentExternalEvidence: Array.isArray(currentExternalEvidence) ? currentExternalEvidence : [],
    runtimeInputs: runtimeInputs || {},
    runtimeResults: runtimeResults || {}
  };
  const response = await fetch('/api/ask-phios-orchestrated', {
    method: 'POST',
    headers: { Accept: 'application/json', 'content-type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(body),
    signal
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    const code = payload?.error?.code || 'ASK_PHIOS_REQUEST_FAILED';
    const error = new Error(code);
    error.code = code;
    throw error;
  }
  renderAsk2Disclosure(payload);
  reconcileAskBoundary();
  return payload;
}
