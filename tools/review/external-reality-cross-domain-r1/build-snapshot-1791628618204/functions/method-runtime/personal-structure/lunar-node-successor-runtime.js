/**
 * MIR-3 node successor orchestration.
 * Calculates AST-owned Lunar Nodes first, then feeds those facts into the frozen
 * Personal Structure calculation, which continues to own Gate/Line/SCU structure.
 */
import { createAstLunarNodeRuntime, AST_LUNAR_NODE_POLICY_CODE } from '../../core-method-runtime/ast-lunar-node-runtime.js';
import { AST_TRUE_NODE_CONVENTION } from '../../core-method-runtime/ast-lunar-node-adapter.js';
import { calculatePersonalStructure } from './personal-structure-runtime.js';

function cloneRecord(record) { return structuredClone(record); }
function enrich(record, layer, node) {
  const copy = cloneRecord(record);
  copy.payload = { ...copy.payload, longitudes: { ...(copy.payload?.longitudes || {}), NORTH_NODE: node.northNodeLongitude, SOUTH_NODE: node.southNodeLongitude }, astronomyRef: `${copy.payload?.astronomyRef || copy.payload?.sourceRef || layer}_ASTRONOMY+AST_LUNAR_NODE@2.1.19`, nodePolicyCode: AST_LUNAR_NODE_POLICY_CODE, nodeConvention: AST_TRUE_NODE_CONVENTION, nodeLineage: { engineCode: node.engineCode, engineVersion: node.engineVersion, referenceFrame: node.referenceFrame, observerMode: node.observerMode } };
  return copy;
}

export function createPersonalStructureLunarNodeSuccessor({ lunarNodeAdapter } = {}) {
  const nodeRuntime = createAstLunarNodeRuntime({ lunarNodeAdapter });
  return Object.freeze({
    async calculate({ calculationId, inputRecords, referenceVersions = {} }) {
      const personalityRecord = inputRecords.find(r => r.recordType === 'PERSONALITY_ASTRONOMY');
      const designRecord = inputRecords.find(r => r.recordType === 'DESIGN_ASTRONOMY');
      if (!personalityRecord || !designRecord) throw new TypeError('PERSONALITY_AND_DESIGN_ASTRONOMY_REQUIRED');
      const nodeCalculation = await nodeRuntime.calculate({ calculationId: `${calculationId}:AST-NODES`, inputRecords: [personalityRecord, designRecord] });
      const output = nodeCalculation.output;
      const enriched = inputRecords.map(record => {
        if (record === personalityRecord) return enrich(record, 'PERSONALITY', output.personality);
        if (record === designRecord) return enrich(record, 'DESIGN', output.design);
        return cloneRecord(record);
      });
      const structure = await calculatePersonalStructure({ calculationId, inputRecords: enriched, nodeConvention: AST_TRUE_NODE_CONVENTION, referenceVersions: { ...referenceVersions, nodePolicyCode: AST_LUNAR_NODE_POLICY_CODE, nodeCalculationDigest: nodeCalculation.outputDigest } });
      return Object.freeze({ nodeCalculation, structure });
    }
  });
}
