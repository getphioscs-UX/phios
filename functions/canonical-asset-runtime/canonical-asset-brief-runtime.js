import crypto from 'node:crypto';
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])])) : value;
export const digest = value => crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
export function buildCanonicalAssetBrief(input, authorities) {
  const assetTypeRegistered = authorities.assetTypes.some(x => x.assetType === input.assetType);
  const localeSupported = authorities.supportedLocales.includes(input.locale);
  const nodeCodes = new Set(authorities.nodes.map(x => x.nodeCode));
  const knowledgeReferencesValid = input.knowledgeReferences.length > 0 && input.knowledgeReferences.every(x => nodeCodes.has(x)) && input.knowledgeReferences.includes(input.nodeCode);
  const meaningCodes = new Set(authorities.meanings.map(x => x.meaningCode));
  const meaningAuthorityValid = input.meaningReferences.length > 0 && input.meaningReferences.every(x => meaningCodes.has(x));
  const matchingFragments = authorities.fragments.filter(x => input.knowledgeReferences.includes(x.nodeCode) && x.locale === input.locale);
  const coveredNodes = new Set(matchingFragments.map(x => x.nodeCode));
  const assemblyValid = authorities.assemblies.some(x => x.locale === input.locale && x.publishedFragmentsOnly === true && input.knowledgeReferences.every(n => x.nodeCodes.includes(n)));
  const publishedCoverageSufficient = matchingFragments.length >= authorities.minimumPublishedFragmentCount && input.knowledgeReferences.every(n => coveredNodes.has(n)) && assemblyValid;
  const authorityValidation = { meaningAuthorityValid, knowledgeReferencesValid, publishedCoverageSufficient, localeSupported, assetTypeRegistered };
  const failed = Object.entries(authorityValidation).filter(([,v]) => !v).map(([k]) => k);
  if (failed.length) throw new Error(`CAR_ASSET_BRIEF_GATE_FAILED:${failed.join(',')}`);
  const body = {
    briefCode: input.briefCode,
    briefVersion: '1.0.0',
    assetType: input.assetType,
    nodeCode: input.nodeCode,
    meaningReferences: [...new Set(input.meaningReferences)].sort(),
    knowledgeReferences: [...new Set(input.knowledgeReferences)].sort(),
    sourceFragmentDigests: [...new Set(matchingFragments.map(x => x.digest))].sort(),
    locale: input.locale,
    audience: input.audience,
    purpose: input.purpose,
    mustEstablish: input.mustEstablish,
    mustInclude: input.mustInclude ?? [],
    mustNotInclude: input.mustNotInclude,
    factualBoundary: { publishedOnly: true, newClaimsAllowed: false, professionalConclusionAllowed: false },
    visualOrNarrativeContract: input.visualOrNarrativeContract,
    brandConstraints: { authority: 'PDS', pdsReferences: authorities.pdsReferences, mustNotInferRuntimeState: true },
    accessibilityRequirements: input.accessibilityRequirements,
    outputContract: { candidateOnly: true, publicationAllowed: false, assetIsBrief: false },
    authorityValidation
  };
  return { ...body, briefDigest: digest(body) };
}
