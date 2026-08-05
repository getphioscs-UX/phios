import { loadKnowledgeBlueprintRegistry } from '../knowledge-blueprint/blueprint-registry-loader.mjs';

export const PJA_BLUEPRINT_REGISTRY_PATH =
  'content/knowledge/blueprints/blueprint-registry.json';

export async function loadPjaBlueprintContext(root, options = {}) {
  const knowledge = options.knowledge || await loadKnowledgeBlueprintRegistry(root, options);
  const book1 = knowledge.byBookCode.get('BOOK-1');
  if (!book1) throw new Error('BOOK-1 Knowledge Blueprint is not registered.');
  const prefaceCanonicalNodes = knowledge.nodes.filter(node =>
    node.nodeCode.startsWith('KN-PREFACE-')
  ).length;
  return {
    contract: knowledge.registry.contract,
    schemaVersion: knowledge.registry.schemaVersion,
    status: knowledge.registry.status,
    plannedCanonicalNodes: knowledge.totals.nodes,
    prefaceCanonicalNodes,
    activeProductionLimit: book1.activeProductionLimit,
    releaseRecommendation: book1.releaseRecommendation,
    parts: knowledge.parts,
    nodes: knowledge.nodes,
    books: knowledge.books,
    byBookCode: knowledge.byBookCode,
    byPartCode: knowledge.byPartCode,
    byNodeCode: knowledge.byNodeCode,
    registry: knowledge.registry,
    book1,
    inputFiles: [
      PJA_BLUEPRINT_REGISTRY_PATH,
      ...knowledge.registry.books.map(entry => entry.blueprintPath)
    ]
  };
}
