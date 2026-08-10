export const PRODUCTION_ROLES = Object.freeze([
  'ARTICLE','FRAGMENT','FIGURE','DIAGRAM','STRUCTURED_ONLY','JOURNEY_ONLY','ACADEMY','MULTI_ASSET','NO_PUBLIC_ASSET_REQUIRED','DEFERRED'
]);

export function evaluateArticleEligibility(input) {
  const required = [
    'knowledgeCoverageSufficient','standaloneReadingValueSufficient','independentQuestionClear',
    'boundaryStable','narrativeDuplicationAcceptable','entryValueExists','localeSourceAvailable'
  ];
  const missing = required.filter(k => typeof input[k] !== 'boolean');
  if (missing.length) throw new Error(`KPP_ARTICLE_GATE_INPUT_INVALID:${missing.join(',')}`);
  if (!input.knowledgeCoverageSufficient || !input.boundaryStable || !input.localeSourceAvailable) return 'article_blocked';
  if (!input.standaloneReadingValueSufficient || !input.independentQuestionClear) return 'article_not_required';
  if (!input.narrativeDuplicationAcceptable || !input.entryValueExists) return 'article_deferred';
  return 'article_eligible';
}

export function assertPlanningBoundary(action) {
  const forbidden = new Set(['create_node','rewrite_knowledge','write_article','approve_article','publish','create_final_asset']);
  if (forbidden.has(action)) throw new Error(`KPP_AUTHORITY_BOUNDARY_VIOLATION:${action}`);
  return true;
}

export function recommendRole(signals) {
  if (signals.noPublicAssetRequired === true) return 'NO_PUBLIC_ASSET_REQUIRED';
  if (signals.runtimeValue >= 70 && signals.publicReadingValue < 40 && signals.visualValue < 50) return 'STRUCTURED_ONLY';
  if (signals.visualValue >= 75 && signals.independentReadingValue < 60) return signals.diagramPreferred ? 'DIAGRAM' : 'FIGURE';
  if (signals.teachingValue >= 75 && signals.independentReadingValue < 60) return 'ACADEMY';
  if (signals.journeyValue >= 75 && signals.publicReadingValue < 50) return 'JOURNEY_ONLY';
  if (signals.independentReadingValue >= 75 && signals.duplicationRisk <= 40) return signals.visualValue >= 65 ? 'MULTI_ASSET' : 'ARTICLE';
  if (signals.fragmentValue >= 65) return 'FRAGMENT';
  return 'DEFERRED';
}
