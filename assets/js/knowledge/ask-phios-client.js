const appendOptional = (params, values) => {
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  return params;
};

export async function askPhios({
  query,
  locale,
  depth = 'STANDARD',
  source = 'hybrid',
  entryContext = {},
  followUpContext = {},
  guidedContext = {},
  signal
} = {}) {
  const params = appendOptional(new URLSearchParams({
    q: String(query ?? ''),
    locale: String(locale || 'zh-Hans'),
    depth: String(depth || 'STANDARD'),
    source: String(source || 'hybrid')
  }), {
    entrySurface: entryContext.entrySurface,
    entryRoute: entryContext.entryRoute,
    contextType: entryContext.contextType,
    contextId: entryContext.contextId,
    bookCode: entryContext.bookCode,
    partCode: entryContext.partCode,
    articleCode: entryContext.articleCode,
    figureCode: entryContext.figureCode,
    realityCaseId: entryContext.realityCaseId,
    mode: entryContext.mode,
    contextLabel: entryContext.contextLabel,
    contextSummary: entryContext.contextSummary,
    readingPath: entryContext.readingPath,
    relatedKnowledgeRef: entryContext.relatedKnowledgeRef,
    contextQuestion: followUpContext.contextQuestion,
    parentAnswerId: followUpContext.parentAnswerId,
    groundingBundleId: followUpContext.groundingBundleId,
    followUpDepth: followUpContext.followUpDepth,
    whatIsHappening: guidedContext.whatIsHappening,
    howLong: guidedContext.howLong,
    whoOrWhatIsInvolved: guidedContext.whoOrWhatIsInvolved,
    whatChanged: guidedContext.whatChanged,
    whatTried: guidedContext.whatTried,
    whatMattersMostNow: guidedContext.whatMattersMostNow
  });
  const response = await fetch(`/api/ask-phios?${params}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
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
