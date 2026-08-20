import '../pages/knowledge-search-c.js';

const cleanObject = value => Object.fromEntries(Object.entries(value || {}).filter(([, item]) => item !== undefined && item !== null && item !== ''));

export async function askPhios({
  query,
  locale,
  depth = 'STANDARD',
  source = 'hybrid',
  entryContext = {},
  followUpContext = {},
  guidedContext = {},
  useCurrentRealityContext = false,
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
    useCurrentRealityContext: useCurrentRealityContext === true
  };
  const response = await fetch('/api/ask-phios-consumption', {
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
  return payload;
}
