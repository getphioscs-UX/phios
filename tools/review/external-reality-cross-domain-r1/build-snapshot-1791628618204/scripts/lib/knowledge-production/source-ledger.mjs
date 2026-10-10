import { deduplicateBy } from './article-package.mjs';

function localizedTitle(source, locale) {
  if (typeof source.title === 'string') return source.title;
  return source.title?.[locale] || source.title?.['zh-Hans'] || null;
}

export function buildSourceLedger(brief, claims) {
  const locale = brief.canonicalIdentity.locale;
  const nodeCode = brief.canonicalIdentity.canonicalNodeCode;
  const referenced = deduplicateBy(
    brief.sourcePlan.sourceReferences || [],
    'sourceCode'
  );
  const sources = referenced.map(source => {
    const claimsSupported = claims
      .filter(claim => claim.sourceCodes.includes(source.sourceCode))
      .map(claim => claim.claimCode);
    return {
      sourceCode: source.sourceCode,
      canonicalNodeCode: nodeCode,
      sourceType: source.sourceType || 'internal_canonical_source',
      title: localizedTitle(source, locale),
      authorOrInstitution:
        source.author ||
        source.organization ||
        source.publisher ||
        null,
      publicationDate: source.publicationDate || null,
      locator: source.locator || null,
      claimsSupported,
      verificationState: 'not_verified',
      citationState: 'draft_not_citable',
      reviewState: 'not_reviewed'
    };
  });
  const mapped = new Set(sources.map(source => source.sourceCode));
  const gaps = claims
    .filter(claim => (
      claim.sourceRequirement === 'required' &&
      claim.sourceCodes.some(sourceCode => !mapped.has(sourceCode))
    ))
    .map(claim => ({
      claimCode: claim.claimCode,
      missingSourceCodes: claim.sourceCodes.filter(code => !mapped.has(code)),
      state: 'source_gap'
    }));
  return {
    schemaVersion: 'PHI-OS-CANONICAL-ARTICLE-SOURCE-LEDGER-v1.0.0',
    canonicalNodeCode: nodeCode,
    articleCode: claims[0]?.articleCode || null,
    locale,
    sourceSetVersion: '1.0.0',
    sources,
    sourceGaps: gaps
  };
}

