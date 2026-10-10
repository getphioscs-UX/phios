export const ARTICLE_PACKAGE_CONTRACT_V2 = 'PHI-OS-PJA-R4E-ARTICLE-PACKAGE-v2.0.0';
export const ARTICLE_PACKAGE_BINDING_FIELDS = Object.freeze([
  'nodeCode','canonicalNodeVersion','publicationBookCode','publicationPartCode',
  'blueprintContract','blueprintDigest','blueprintRegistryContract','blueprintRegistryDigest',
  'canonicalLocale','sourceLocale','productionLocale','targetPublicationLocale',
  'productionWaveCode','productionPackageVersion'
]);

export function buildArticlePackageBinding(record, options = {}) {
  const { binding } = record;
  const authorities = binding?.publicationContext && record?.membership?.blueprint;
  return Object.freeze({
    nodeCode: record.nodeCode,
    canonicalNodeVersion: record.node.version || record.node.nodeVersion || '1.0.0',
    publicationBookCode: binding.publicationContext.publicationBookCode,
    publicationPartCode: binding.publicationContext.publicationPartCode,
    blueprintContract: record.membership?.blueprint?.contract || record.membership?.blueprint?.schemaVersion || null,
    blueprintDigest: options.blueprintDigest || record.membership?.blueprint?.digest || record.blueprintNode?.blueprintDigest || null,
    blueprintRegistryContract: options.blueprintRegistryContract || null,
    blueprintRegistryDigest: options.blueprintRegistryDigest || null,
    canonicalLocale: options.canonicalLocale || 'zh-Hans',
    sourceLocale: options.sourceLocale || 'zh-Hans',
    productionLocale: options.productionLocale || 'zh-Hans',
    targetPublicationLocale: options.targetPublicationLocale || options.productionLocale || 'zh-Hans',
    productionWaveCode: options.productionWaveCode || null,
    productionPackageVersion: options.productionPackageVersion || '2.0.0',
    authorityResolved: Boolean(authorities)
  });
}

export function validateArticlePackageBinding(binding) {
  const missing = ARTICLE_PACKAGE_BINDING_FIELDS.filter(field => binding[field] === undefined);
  return { valid: missing.length === 0, missing };
}
