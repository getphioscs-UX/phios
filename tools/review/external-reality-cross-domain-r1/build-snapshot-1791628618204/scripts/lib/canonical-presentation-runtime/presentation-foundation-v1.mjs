import crypto from 'node:crypto';

const canonicalize = value => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
  return value;
};
export const stableDigest = value => crypto.createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
const uniqueSorted = values => [...new Set(values || [])].sort();

export function buildCanonicalPresentation(input) {
  if (!input?.presentationCode?.startsWith('CPR-PRESENT-')) throw new Error('CPR_PRESENTATION_CODE_INVALID');
  if (!Array.isArray(input.sourceAssetReferences) || input.sourceAssetReferences.length === 0) throw new Error('CPR_PUBLISHED_ASSET_REFERENCE_REQUIRED');
  if ((input.pdsReferences?.tokenReferences || []).some(token => !/^--phi-/.test(token))) throw new Error('CPR_PDS_LITERAL_OR_UNKNOWN_TOKEN_REFERENCE');
  const out = {
    presentationCode: input.presentationCode,
    presentationVersion: input.presentationVersion || '1.0.0',
    surface: input.surface,
    presentationType: input.presentationType,
    sourceAssetReferences: uniqueSorted(input.sourceAssetReferences),
    sourceProjectionReferences: uniqueSorted(input.sourceProjectionReferences),
    locale: input.locale,
    audience: input.audience,
    informationLayer: canonicalize(input.informationLayer),
    pdsReferences: {
      contracts: uniqueSorted(input.pdsReferences?.contracts),
      tokenReferences: uniqueSorted(input.pdsReferences?.tokenReferences),
      themeCode: input.pdsReferences?.themeCode
    },
    accessibilityContract: canonicalize(input.accessibilityContract || {}),
    responsiveContract: canonicalize(input.responsiveContract || {}),
    renderState: input.renderState || 'validation_projection'
  };
  return out;
}

export function resolveInformationLayers({ audience, surface, journeyStage = 'NOT_APPLICABLE', presentationPurpose, informationLayerRegistry, surfaceRegistry }) {
  const audienceCap = informationLayerRegistry.foundationAudienceClasses[audience];
  const surfaceRecord = surfaceRegistry.surfaces.find(record => record.surface === surface);
  const purposeCap = informationLayerRegistry.presentationPurposeMaximumLayer[presentationPurpose];
  const journeyCap = informationLayerRegistry.journeyStageMaximumLayerForCustomerContext[journeyStage];
  if (!audienceCap || !surfaceRecord || !purposeCap || !journeyCap) throw new Error('CPR_INFORMATION_LAYER_INPUT_UNCONTROLLED');
  const caps = [audienceCap, surfaceRecord.maximumInformationLayer, purposeCap];
  if (audience === 'CUSTOMER' && journeyStage !== 'NOT_APPLICABLE') caps.push(journeyCap);
  const maximumLayer = Math.min(...caps);
  const layers = informationLayerRegistry.layers.filter(layer => layer.order <= maximumLayer).sort((a,b) => a.order - b.order).map(layer => layer.layerCode);
  return { maximumLayer, layers, disclosureMode: maximumLayer <= 1 ? 'default' : maximumLayer >= 4 ? 'restricted' : 'progressive' };
}

export function resolveTheme({ themeCode, surface, locale, themeRegistry, tokenRegistry }) {
  const theme = themeRegistry.themes.find(record => record.themeCode === themeCode);
  if (!theme) throw new Error('CPR_THEME_UNKNOWN');
  if (!theme.surfaceEligibility.includes(surface)) throw new Error('CPR_THEME_SURFACE_INELIGIBLE');
  if (!theme.localeCompatibility.includes(locale)) throw new Error('CPR_THEME_LOCALE_INCOMPATIBLE');
  const allowed = new Set(tokenRegistry.categories.flatMap(category => category.tokens));
  for (const token of Object.values(theme.tokenSet)) {
    if (!/^--phi-/.test(token) || !allowed.has(token)) throw new Error('CPR_THEME_TOKEN_NOT_PDS_CONTROLLED');
  }
  return canonicalize({ themeCode: theme.themeCode, tokenSet: theme.tokenSet, contrastRequirement: theme.contrastRequirement, locale });
}
