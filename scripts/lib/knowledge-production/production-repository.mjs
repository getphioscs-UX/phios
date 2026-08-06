import { loadPjaBlueprintContext } from './blueprint-context.mjs';
import { loadKnowledgeInventory, resolveKnowledgeScope } from './readiness-system.mjs';
import { isProductionEligible } from './production-resolver.mjs';

export const PRODUCTION_REPOSITORY_CONTRACT = 'PHI-OS-PJA-R4B-PRODUCTION-REPOSITORY-v1.0.0';

export async function loadProductionRepository(root, options = {}) {
  const [blueprintContext, knowledge] = await Promise.all([
    loadPjaBlueprintContext(root, options),
    loadKnowledgeInventory(root)
  ]);
  const records = knowledge.inventory.map(item => {
    const binding = blueprintContext.resolveNode(item.nodeCode);
    return Object.freeze({ ...item, binding, publicationContext: binding.publicationContext, productionState: binding.productionState });
  });
  const byNodeCode = new Map(records.map(record => [record.nodeCode, record]));
  return Object.freeze({
    contract: PRODUCTION_REPOSITORY_CONTRACT,
    authority: 'blueprint-registry+canonical-node-registry+publication-context+production-state',
    bookScopeAuthority: false,
    blueprintContext,
    knowledge: { ...knowledge, inventory: records },
    records,
    byNodeCode,
    resolveScope(scope = 'ALL') { return resolveKnowledgeScope({ ...knowledge, inventory: records }, { scope }); },
    resolveNode(nodeCode) { return byNodeCode.get(nodeCode) || null; },
    eligible(scope = 'ALL') { return this.resolveScope(scope).filter(record => isProductionEligible(record.binding)); }
  });
}
