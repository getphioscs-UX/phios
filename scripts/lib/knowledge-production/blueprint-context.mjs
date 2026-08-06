import { loadKnowledgeBlueprintRegistry } from '../knowledge-blueprint/blueprint-registry-loader.mjs';
import { resolvePublicationContext, resolveSourceLineage } from './publication-context.mjs';
import { resolveProductionState } from './production-resolver.mjs';

export const PJA_BLUEPRINT_REGISTRY_PATH =
  'content/knowledge/blueprints/blueprint-registry.json';

export async function loadPjaBlueprintContext(root, options = {}) {
  const knowledge = options.knowledge || await loadKnowledgeBlueprintRegistry(root, options);
  const nodeBindings = new Map();
  for (const node of knowledge.authorities.nodes.nodes) {
    const blueprintNode = knowledge.byNodeCode.get(node.nodeCode);
    const publicationContext = await resolvePublicationContext(root, node, {
      authorities: knowledge.authorities,
      blueprintNode
    });
    const sourceLineage = await resolveSourceLineage(root, node, {
      authorities: knowledge.authorities,
      blueprintNode
    });
    const productionState = await resolveProductionState(root, node, {
      authorities: knowledge.authorities,
      publicationContext
    });
    nodeBindings.set(node.nodeCode, {
      node,
      blueprintNode,
      publicationContext,
      sourceLineage,
      productionState
    });
  }
  const prefaceCanonicalNodes = [...nodeBindings.keys()].filter(nodeCode =>
    nodeCode.startsWith('KN-PREFACE-')
  ).length;
  const book1 = knowledge.byBookCode.get('BOOK-1') || null;
  return {
    contract: knowledge.registry.contract,
    schemaVersion: knowledge.registry.schemaVersion,
    status: knowledge.registry.status,
    plannedCanonicalNodes: knowledge.totals.nodes,
    prefaceCanonicalNodes,
    activeProductionLimit: book1?.activeProductionLimit || null,
    releaseRecommendation: book1?.releaseRecommendation || null,
    book1,
    parts: knowledge.parts,
    nodes: knowledge.nodes,
    books: knowledge.books,
    byBookCode: knowledge.byBookCode,
    byPartCode: knowledge.byPartCode,
    byNodeCode: knowledge.byNodeCode,
    registry: knowledge.registry,
    authorities: knowledge.authorities,
    nodeBindings,
    resolveNode(nodeCode) {
      return nodeBindings.get(nodeCode) || null;
    },
    inputFiles: [
      PJA_BLUEPRINT_REGISTRY_PATH,
      knowledge.authorityContractPath,
      knowledge.authorities.contract.authorities.bookIdentity.path,
      knowledge.authorities.contract.authorities.partIdentityAndPublicationOwnership.path,
      'content/knowledge/registry/nodes.json',
      'content/knowledge/migrations/node-publication-ownership-v2.json',
      ...knowledge.registry.books.map(entry => entry.blueprintPath)
    ]
  };
}
