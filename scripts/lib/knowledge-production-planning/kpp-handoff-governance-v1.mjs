export const KPP_HANDOFF_ROLES = Object.freeze({
  PJA: Object.freeze(['ARTICLE','FRAGMENT']),
  CAR: Object.freeze(['FIGURE','DIAGRAM','MULTI_ASSET','ACADEMY'])
});

export function evaluateFragmentEligibility(input) {
  const required=['publicKnowledgeValueExists','knowledgeCoverageSufficient','boundaryStable','fragmentCanStandAlone','localeSourceAvailable'];
  const missing=required.filter(k=>typeof input[k] !== 'boolean');
  if (missing.length) throw new Error(`KPP_FRAGMENT_GATE_INPUT_INVALID:${missing.join(',')}`);
  if (!input.knowledgeCoverageSufficient || !input.boundaryStable || !input.localeSourceAvailable) return 'fragment_blocked';
  if (!input.publicKnowledgeValueExists) return 'fragment_not_required';
  if (!input.fragmentCanStandAlone) return 'fragment_deferred';
  return 'fragment_eligible';
}

export function evaluateVisualEligibility(input) {
  const required=['knowledgeCoverageSufficient','visualStructurePresent','knowledgeBoundaryStable','localeSupported','carAssetTypeRegistered'];
  const missing=required.filter(k=>typeof input[k] !== 'boolean');
  if (missing.length) throw new Error(`KPP_VISUAL_GATE_INPUT_INVALID:${missing.join(',')}`);
  if (!input.knowledgeCoverageSufficient || !input.knowledgeBoundaryStable || !input.localeSupported || !input.carAssetTypeRegistered) return 'visual_blocked';
  if (!input.visualStructurePresent) return 'visual_not_required';
  return 'visual_eligible';
}

export function assertCrossNodeAssembly(input) {
  if (!input.primaryNode || !Array.isArray(input.supportingNodes) || input.supportingNodes.length<1) throw new Error('KPP_CROSS_NODE_ASSEMBLY_INVALID');
  if (input.supportingNodes.includes(input.primaryNode)) throw new Error('KPP_PRIMARY_NODE_DUPLICATED');
  if (new Set(input.supportingNodes).size !== input.supportingNodes.length) throw new Error('KPP_SUPPORTING_NODE_DUPLICATED');
  return true;
}

export function assertHandoff(role,target) {
  const allowed=KPP_HANDOFF_ROLES[target];
  if (!allowed) throw new Error(`KPP_HANDOFF_TARGET_INVALID:${target}`);
  if (!allowed.includes(role)) throw new Error(`KPP_HANDOFF_ROLE_INVALID:${target}:${role}`);
  return true;
}

export function isNoPublicAssetComplete(input) {
  return input.productionRole==='NO_PUBLIC_ASSET_REQUIRED' && input.canonicalKnowledgeExists===true && input.authorityValid===true && input.runtimeUsable===true && input.articleNotRequired===true && input.publicAssetNotRequired===true && input.humanProductionDecisionRecorded===true;
}
