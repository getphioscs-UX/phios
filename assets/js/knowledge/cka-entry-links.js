const clean = value => String(value ?? '').trim();

export function buildCkaEntryHref({
  entrySurface,
  contextType,
  contextId,
  bookCode,
  partCode,
  articleCode,
  figureCode,
  contextLabel,
  contextSummary,
  readingPath,
  relatedKnowledgeRef
} = {}) {
  const params = new URLSearchParams({
    entrySurface: clean(entrySurface).toUpperCase(),
    mode: 'CONTEXTUAL'
  });
  for (const [key, value] of Object.entries({
    contextType,
    contextId,
    bookCode,
    partCode,
    articleCode,
    figureCode,
    contextLabel,
    contextSummary,
    readingPath,
    relatedKnowledgeRef
  })) {
    if (clean(value)) params.set(key, clean(value));
  }
  return `/knowledge-search?${params}`;
}

export function ckaEntryLabel(kind, locale = 'en') {
  const labels = {
    ARTICLE: locale === 'zh-Hans' ? '询问这篇文章' : 'Ask about this article',
    BOOK: locale === 'zh-Hans' ? '询问这册书' : 'Ask about this volume',
    FIGURE: locale === 'zh-Hans' ? '询问这张图' : 'Ask about this figure',
    KNOWLEDGE: locale === 'zh-Hans' ? '向 PHI OS 询问' : 'Ask PHI OS about this'
  };
  return labels[String(kind || 'KNOWLEDGE').toUpperCase()] || labels.KNOWLEDGE;
}

export function createCkaEntryAction(documentRef, context, { kind = 'KNOWLEDGE', locale = 'en' } = {}) {
  const anchor = documentRef.createElement('a');
  anchor.className = 'knowledge-action';
  anchor.dataset.ckaContextualEntry = kind;
  anchor.href = buildCkaEntryHref(context);
  anchor.textContent = ckaEntryLabel(kind, locale);
  return anchor;
}
