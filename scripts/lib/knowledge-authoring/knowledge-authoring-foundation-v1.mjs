export function matchExistingNode(candidate, nodeCodes, supportingQuestionCodes = new Set()) {
  const exact = (candidate.possibleExistingNodes || []).filter(code => nodeCodes.has(code));
  const sq = (candidate.possibleSupportingQuestions || []).filter(code => supportingQuestionCodes.has(code));
  if (exact.length) return { matchClass: 'exact_existing_node', nodeMatches: exact, supportingQuestionMatches: sq, automaticCreationAllowed: false };
  if (sq.length) return { matchClass: 'supporting_question', nodeMatches: [], supportingQuestionMatches: sq, automaticCreationAllowed: false };
  return { matchClass: 'no_match', nodeMatches: [], supportingQuestionMatches: [], automaticCreationAllowed: false };
}

export function assertProposalOnly(operation) {
  const forbidden = new Set(['create_canonical_node','mutate_nodes_registry','approve_knowledge','publish_article']);
  if (forbidden.has(operation)) throw new Error(`KAU_AUTHORITY_BOUNDARY_DENIED:${operation}`);
  return true;
}

export function projectSectionMappings(sectionInventory, legacyMappings) {
  const byPart = new Map(sectionInventory.sections.map(s => [s.partCode, s.sectionCode]));
  return legacyMappings.mappings.map(m => ({ sectionCode: byPart.get(m.partCode), nodeCode: m.nodeCode, authorityMode: 'proposal_only' }));
}
