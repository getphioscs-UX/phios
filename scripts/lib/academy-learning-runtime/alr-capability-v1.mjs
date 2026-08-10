const hasValue = value => {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== undefined && value !== null;
};

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value ?? {}, key);

const unique = values => new Set(values).size === values.length;

export function validateCapabilityRegistry(registry, levelRegistry) {
  if (!registry || !Array.isArray(registry.capabilities) || registry.capabilities.length === 0) {
    return 'EMPTY_CAPABILITY_REGISTRY';
  }
  const levels = new Set((levelRegistry?.levels ?? []).map(level => level.levelCode));
  const kinds = new Set(registry.capabilityKinds ?? []);
  const statuses = new Set(registry.capabilityStatusValues ?? []);
  const criterionStatuses = new Set(registry.criterionStatusValues ?? []);
  const codes = registry.capabilities.map(capability => capability.capabilityCode);
  if (!unique(codes)) return 'DUPLICATE_CAPABILITY_CODE';
  for (const capability of registry.capabilities) {
    if ((registry.requiredCapabilityFields ?? []).some(field => !hasValue(capability[field]))) {
      return 'UNRESOLVED_CAPABILITY_FIELDS';
    }
    if (!/^ALR-CAP-[A-Z0-9-]+$/.test(capability.capabilityCode)) return 'INVALID_CAPABILITY_IDENTITY';
    if (capability.capabilityCode.startsWith('pws.capability.')) return 'PWS_NAMESPACE_COLLISION';
    if (capability.authorityReference !== 'ALR') return 'DENY_NON_ALR_AUTHORITY';
    if (!levels.has(capability.academyLevelCode)) return 'UNKNOWN_ACADEMY_LEVEL';
    if (!kinds.has(capability.capabilityKind)) return 'UNKNOWN_CAPABILITY_KIND';
    if (!statuses.has(capability.status)) return 'UNKNOWN_CAPABILITY_STATUS';
    if (!Array.isArray(capability.requiredEvidenceCriteria) || capability.requiredEvidenceCriteria.length === 0) {
      return 'EMPTY_EVIDENCE_CRITERIA';
    }
    const criteria = capability.requiredEvidenceCriteria.map(criterion => criterion.criterionCode);
    if (!unique(criteria)) return 'DUPLICATE_EVIDENCE_CRITERION';
    if (capability.requiredEvidenceCriteria.some(criterion =>
      !/^[A-Z][A-Z0-9_]+$/.test(criterion.criterionCode) || !hasValue(criterion.definition)
    )) return 'INVALID_EVIDENCE_CRITERION';
  }
  if (!criterionStatuses.has('MET') || !criterionStatuses.has('DISPUTED') || !criterionStatuses.has('UNKNOWN')) {
    return 'INCOMPLETE_CRITERION_STATE_GOVERNANCE';
  }
  return 'VALID_CAPABILITY_REGISTRY';
}

export function validateCapabilityDependencyGraph(capabilityRegistry, graph) {
  const capabilityCodes = (capabilityRegistry?.capabilities ?? []).map(item => item.capabilityCode);
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return 'UNRESOLVED_GRAPH';
  if (!unique(graph.nodes)) return 'DUPLICATE_GRAPH_NODE';
  if (graph.nodes.length !== capabilityCodes.length || graph.nodes.some(node => !capabilityCodes.includes(node))) {
    return 'GRAPH_NODE_REGISTRY_MISMATCH';
  }
  const edgeKeys = [];
  const indegree = new Map(graph.nodes.map(node => [node, 0]));
  const adjacency = new Map(graph.nodes.map(node => [node, []]));
  for (const edge of graph.edges) {
    const { fromCapabilityCode: from, toCapabilityCode: to, edgeType } = edge;
    if (!indegree.has(from) || !indegree.has(to)) return 'UNKNOWN_GRAPH_NODE';
    if (from === to) return 'SELF_DEPENDENCY';
    if (edgeType !== graph.edgeType || edgeType !== 'REQUIRES') return 'UNKNOWN_EDGE_TYPE';
    edgeKeys.push(`${from}->${to}`);
    adjacency.get(from).push(to);
    indegree.set(to, indegree.get(to) + 1);
  }
  if (!unique(edgeKeys)) return 'DUPLICATE_GRAPH_EDGE';
  const queue = graph.nodes.filter(node => indegree.get(node) === 0);
  const order = [];
  while (queue.length > 0) {
    const node = queue.shift();
    order.push(node);
    for (const next of adjacency.get(node)) {
      indegree.set(next, indegree.get(next) - 1);
      if (indegree.get(next) === 0) queue.push(next);
    }
  }
  if (order.length !== graph.nodes.length) return 'CYCLIC_CAPABILITY_GRAPH';
  if (!Array.isArray(graph.topologicalOrder) || graph.topologicalOrder.length !== order.length) {
    return 'UNRESOLVED_TOPOLOGICAL_ORDER';
  }
  const position = new Map(graph.topologicalOrder.map((node, index) => [node, index]));
  if (!unique(graph.topologicalOrder) || graph.topologicalOrder.some(node => !indegree.has(node))) {
    return 'INVALID_TOPOLOGICAL_ORDER';
  }
  if (graph.edges.some(edge => position.get(edge.fromCapabilityCode) >= position.get(edge.toCapabilityCode))) {
    return 'INVALID_TOPOLOGICAL_ORDER';
  }
  return 'VALID_ACYCLIC_GRAPH';
}

export function resolveCapabilityPrerequisites(graph, capabilityCode) {
  if (!graph?.nodes?.includes(capabilityCode)) return null;
  return graph.edges
    .filter(edge => edge.toCapabilityCode === capabilityCode && edge.edgeType === 'REQUIRES')
    .map(edge => edge.fromCapabilityCode);
}

export function evaluateCapabilityDependencies(graph, capabilityCode, currentCapabilityStates = []) {
  const prerequisites = resolveCapabilityPrerequisites(graph, capabilityCode);
  if (prerequisites === null) return 'UNKNOWN';
  if (prerequisites.length === 0) return 'SATISFIED';
  if (!Array.isArray(currentCapabilityStates)) return 'UNKNOWN';
  const codes = currentCapabilityStates.map(entry => entry.capabilityCode);
  if (!unique(codes)) return 'UNKNOWN';
  const states = new Map(currentCapabilityStates.map(entry => [entry.capabilityCode, entry.state]));
  const prerequisiteStates = prerequisites.map(code => states.get(code));
  if (prerequisiteStates.includes('DISPUTED')) return 'DISPUTED';
  if (prerequisiteStates.includes('UNKNOWN')) return 'UNKNOWN';
  return prerequisiteStates.every(state => state === 'SUPPORTED') ? 'SATISFIED' : 'UNSATISFIED';
}

export function evaluateCapabilityEvidence(capabilityRegistry, contract, input = {}) {
  if ((contract?.forbiddenAuthorityFields ?? []).some(field => hasOwn(input, field))) {
    return 'DENY_AUTHORITY_FIELD';
  }
  if ((contract?.requiredEvidenceFields ?? []).some(field => !hasValue(input[field]))) {
    return 'UNRESOLVED_REQUIRED_FIELDS';
  }
  if (!new RegExp(`^${contract.evidenceIdentityPrefix}[A-Z0-9-]+$`).test(input.capabilityEvidenceCode)) {
    return 'INVALID_EVIDENCE_IDENTITY';
  }
  const capability = capabilityRegistry?.capabilities?.find(
    item => item.capabilityCode === input.capabilityReference
  );
  if (!capability) return 'DENY_UNREGISTERED_CAPABILITY';
  if (!(contract.acceptedRdgEligibilityDecisions ?? []).includes(input.rdgEligibilityDecision)) {
    return 'DENY_UNKNOWN_RDG_DECISION';
  }
  const rdgDecisionMap = {
    INSUFFICIENT: 'INSUFFICIENT_EVIDENCE',
    INELIGIBLE: 'INELIGIBLE_EVIDENCE',
    DISPUTED: 'DISPUTED',
    UNKNOWN: 'UNKNOWN',
    DENY_ALR_AUTHORITY: 'DENY_ALR_AUTHORITY'
  };
  if (input.rdgEligibilityDecision !== 'ELIGIBLE_FOR_ALR_REVIEW') {
    return rdgDecisionMap[input.rdgEligibilityDecision];
  }
  if (!Array.isArray(input.criterionResults) || !Array.isArray(input.lineageReferences)) {
    return 'UNRESOLVED_REQUIRED_FIELDS';
  }
  const criterionCodes = input.criterionResults.map(result => result.criterionCode);
  if (!unique(criterionCodes)) return 'DENY_DUPLICATE_CRITERION';
  if (input.criterionResults.some(result =>
    (contract.requiredCriterionResultFields ?? []).some(field => !hasValue(result[field]))
  )) return 'UNRESOLVED_CRITERION_FIELDS';
  if (input.criterionResults.some(result =>
    !(contract.acceptedCriterionStatusValues ?? []).includes(result.status)
  )) return 'DENY_UNKNOWN_CRITERION_STATUS';
  const requiredCriteria = capability.requiredEvidenceCriteria.map(criterion => criterion.criterionCode);
  if (criterionCodes.some(code => !requiredCriteria.includes(code))) return 'DENY_UNKNOWN_CRITERION';
  const results = new Map(input.criterionResults.map(result => [result.criterionCode, result.status]));
  const requiredStatuses = requiredCriteria.map(code => results.get(code));
  if (requiredStatuses.includes('DISPUTED')) return 'DISPUTED';
  if (requiredStatuses.includes('UNKNOWN')) return 'UNKNOWN';
  if (requiredStatuses.some(status => status !== 'MET')) return 'INSUFFICIENT_EVIDENCE';
  return 'READY_FOR_CAPABILITY_STATE_REVIEW';
}

export function evaluateCapabilityTransition(stateRegistry, capabilityRegistry, input = {}) {
  const forbidden = [
    'learnerReference', 'accountReference', 'subjectReference', 'persist',
    'credentialGranted', 'academyEntitlement', 'professionalEligibility', 'professionalJudgment'
  ];
  if (forbidden.some(field => hasOwn(input, field))) return 'DENY_PERSISTENCE_OR_AUTHORITY_FIELD';
  if (!capabilityRegistry?.capabilities?.some(item => item.capabilityCode === input.capabilityCode)) {
    return 'DENY_UNREGISTERED_CAPABILITY';
  }
  const states = new Set((stateRegistry?.states ?? []).map(state => state.stateCode));
  if (!states.has(input.fromState) || !states.has(input.toState)) return 'DENY_UNKNOWN_STATE';
  if (input.decisionAuthority !== 'ALR') return 'DENY_NON_ALR_AUTHORITY';
  const transition = stateRegistry.transitions.find(
    item => item.from === input.fromState && item.to === input.toState
  );
  if (!transition) return 'DENY_TRANSITION';
  if (input.transitionConditions !== undefined && !Array.isArray(input.transitionConditions)) {
    return 'DENY_TRANSITION_CONDITION';
  }
  const protectedConditions = new Set([
    ...Object.values(stateRegistry.semanticEvidenceDecisionMapping ?? {}),
    ...Object.values(stateRegistry.dependencyDecisionMapping ?? {})
  ]);
  if ((input.transitionConditions ?? []).some(condition => protectedConditions.has(condition))) {
    return 'DENY_UNTRUSTED_TRANSITION_CONDITION';
  }
  const conditions = new Set(input.transitionConditions ?? []);
  const evidenceCondition = stateRegistry.semanticEvidenceDecisionMapping[input.evidenceDecision];
  const dependencyCondition = stateRegistry.dependencyDecisionMapping[input.dependencyDecision];
  if (evidenceCondition) conditions.add(evidenceCondition);
  if (dependencyCondition) conditions.add(dependencyCondition);
  const missing = transition.requires.filter(condition => !conditions.has(condition));
  if (missing.includes('READY_FOR_CAPABILITY_STATE_REVIEW')) return 'DENY_EVIDENCE';
  if (missing.includes('DEPENDENCIES_SATISFIED')) return 'DENY_DEPENDENCY';
  if (missing.length > 0) return 'DENY_TRANSITION_CONDITION';
  return 'TRANSITION_ELIGIBLE';
}

const gapForState = state => {
  if (state === 'DISPUTED') return 'DISPUTED_GAP';
  if (state === 'UNKNOWN') return 'UNKNOWN_GAP';
  if (state === 'MAINTENANCE_DUE') return 'MAINTENANCE_GAP';
  return null;
};

export function evaluateCapabilityGaps(capabilityRegistry, graph, stateRegistry, contract, input = {}) {
  if ((contract?.forbiddenInputFields ?? []).some(field => hasOwn(input, field))) {
    return { decision: 'DENY_AUTHORITY_OR_USER_DATA_FIELD', gaps: [] };
  }
  if (!hasValue(input.targetCapabilityCode) ||
      !Array.isArray(input.currentCapabilityStates) ||
      !Array.isArray(input.evidenceDecisions)) {
    return { decision: 'UNRESOLVED_REQUIRED_FIELDS', gaps: [] };
  }
  const capabilityCodes = new Set((capabilityRegistry?.capabilities ?? []).map(item => item.capabilityCode));
  if (!capabilityCodes.has(input.targetCapabilityCode)) {
    return { decision: 'DENY_UNREGISTERED_CAPABILITY', gaps: [] };
  }
  const stateCodes = new Set((stateRegistry?.states ?? []).map(item => item.stateCode));
  const stateEntries = input.currentCapabilityStates;
  if (!unique(stateEntries.map(entry => entry.capabilityCode))) {
    return { decision: 'DENY_DUPLICATE_CAPABILITY_STATE', gaps: [] };
  }
  if (stateEntries.some(entry => !capabilityCodes.has(entry.capabilityCode))) {
    return { decision: 'DENY_UNREGISTERED_CAPABILITY_STATE', gaps: [] };
  }
  if (stateEntries.some(entry => !stateCodes.has(entry.state))) {
    return { decision: 'DENY_UNKNOWN_CAPABILITY_STATE', gaps: [] };
  }
  if (!unique(input.evidenceDecisions.map(entry => entry.capabilityCode))) {
    return { decision: 'DENY_DUPLICATE_EVIDENCE_DECISION', gaps: [] };
  }
  if (input.evidenceDecisions.some(entry => !capabilityCodes.has(entry.capabilityCode))) {
    return { decision: 'DENY_UNREGISTERED_EVIDENCE_CAPABILITY', gaps: [] };
  }
  if (input.evidenceDecisions.some(entry => !(contract.acceptedEvidenceDecisions ?? []).includes(entry.decision))) {
    return { decision: 'DENY_UNKNOWN_EVIDENCE_DECISION', gaps: [] };
  }
  const states = new Map(stateEntries.map(entry => [entry.capabilityCode, entry.state]));
  const evidence = new Map(input.evidenceDecisions.map(entry => [entry.capabilityCode, entry.decision]));
  const gaps = [];
  for (const prerequisite of resolveCapabilityPrerequisites(graph, input.targetCapabilityCode) ?? []) {
    const state = states.get(prerequisite);
    const governedGap = gapForState(state);
    gaps.push({
      gapType: governedGap ?? (state === 'SUPPORTED' ? null : 'PREREQUISITE_GAP'),
      capabilityCode: prerequisite,
      relation: 'DIRECT_PREREQUISITE'
    });
  }
  const targetState = states.get(input.targetCapabilityCode);
  const targetGovernedGap = gapForState(targetState);
  if (targetGovernedGap) {
    gaps.push({ gapType: targetGovernedGap, capabilityCode: input.targetCapabilityCode, relation: 'TARGET' });
  } else if (targetState === 'EVIDENCE_REVIEW') {
    const evidenceDecision = evidence.get(input.targetCapabilityCode);
    const evidenceGap = evidenceDecision === 'DISPUTED'
      ? 'DISPUTED_GAP'
      : evidenceDecision === 'UNKNOWN'
        ? 'UNKNOWN_GAP'
        : evidenceDecision === 'READY_FOR_CAPABILITY_STATE_REVIEW'
          ? 'STATE_GAP'
          : 'EVIDENCE_GAP';
    gaps.push({ gapType: evidenceGap, capabilityCode: input.targetCapabilityCode, relation: 'TARGET' });
  } else if (targetState !== 'SUPPORTED') {
    gaps.push({ gapType: 'STATE_GAP', capabilityCode: input.targetCapabilityCode, relation: 'TARGET' });
  }
  const priority = new Map(contract.gapPriority.map((type, index) => [type, index]));
  const canonicalGaps = gaps
    .filter(gap => gap.gapType)
    .filter((gap, index, all) => all.findIndex(item =>
      item.gapType === gap.gapType && item.capabilityCode === gap.capabilityCode && item.relation === gap.relation
    ) === index)
    .sort((a, b) =>
      priority.get(a.gapType) - priority.get(b.gapType) ||
      a.capabilityCode.localeCompare(b.capabilityCode) ||
      a.relation.localeCompare(b.relation)
    );
  return {
    decision: canonicalGaps.length === 0 ? 'NO_GAP' : 'GAPS_IDENTIFIED',
    targetCapabilityCode: input.targetCapabilityCode,
    gaps: canonicalGaps
  };
}
