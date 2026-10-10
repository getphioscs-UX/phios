export const PROVIDER_INTERFACE_VERSION = 'phi-os.provider-result.v1';

const cleanText = value => typeof value === 'string' ? value.trim() : '';
const list = value => Array.isArray(value) ? value : [];

export function createProviderResult({
  provider,
  model = null,
  stage,
  output,
  confidence = null,
  missingEvidence = [],
  warnings = [],
  usage = null,
  extra = {}
}) {
  if (!cleanText(provider)) throw new Error('Provider result requires provider.');
  if (!cleanText(stage)) throw new Error('Provider result requires stage.');
  if (output === undefined || output === null) throw new Error('Provider result requires output.');

  return {
    success: true,
    provider: cleanText(provider),
    model: cleanText(model) || null,
    stage: cleanText(stage),
    output,
    confidence: Number.isFinite(Number(confidence)) ? Number(confidence) : null,
    missing_evidence: list(missingEvidence),
    warnings: list(warnings),
    usage: usage && typeof usage === 'object' ? usage : null,
    enrichment: output,
    ...extra
  };
}

export function createProviderFailure({ provider, model = null, stage, code, warning }) {
  return {
    success: false,
    provider: cleanText(provider),
    model: cleanText(model) || null,
    stage: cleanText(stage),
    output: null,
    confidence: null,
    missing_evidence: [],
    warnings: [cleanText(warning || code)].filter(Boolean),
    usage: null,
    error: { code: cleanText(code) || 'provider_unavailable' }
  };
}
