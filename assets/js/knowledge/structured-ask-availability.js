// Match the existing source policy. Discovery titles and private page references
// are not semantic evidence, and another language is never a display fallback.
export function structuredMeaning(object, detail, locale = 'en') {
  if (locale === 'en') return detail?.summaryEn || object?.articles?.find(a => a.locale === 'en')?.summary || '';
  return object?.canonicalMeaning || object?.articles?.find(a => a.locale === 'zh-Hans')?.summary || object?.definition || '';
}
export function canAskStructuredObject(object, detail, locale = 'en') {
  return Boolean(object && ['IN_REVIEW', 'ACCEPTED', 'ACTIVE'].includes(object.status)
    && object.projectionState !== 'WITHHELD'
    && object.sourceRefs?.canonicalNodeCodes?.includes(object.nodeCode)
    && object.sourceRefs?.manuscriptSectionRefs?.length
    && String(structuredMeaning(object, detail, locale)).trim());
}
