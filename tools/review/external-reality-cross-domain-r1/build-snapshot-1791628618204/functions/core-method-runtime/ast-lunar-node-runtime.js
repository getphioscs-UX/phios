/** AST canonical Lunar Node successor. Calculation authority remains SHARED_CALCULATION_RUNTIME. */
import { createSharedCalculationRuntime, SHARED_CALCULATION_RUNTIME_CODE } from '../method-runtime/shared-calculation-runtime.js';
import { createAstronomyEngineLunarNodeAdapter, AST_TRUE_NODE_CONVENTION } from './ast-lunar-node-adapter.js';

export const AST_LUNAR_NODE_RUNTIME_CODE = 'AST_LUNAR_NODE_RUNTIME';
export const AST_LUNAR_NODE_RUNTIME_VERSION = '1.0.0';
export const AST_LUNAR_NODE_ALGORITHM_CODE = 'AST_TRUE_LUNAR_NODE_EPHEMERIS';
export const AST_LUNAR_NODE_ALGORITHM_VERSION = '1.0.0';
export const AST_LUNAR_NODE_POLICY_CODE = 'PHI_OS_AST_TRUE_NODE_V1';

function byType(records, type) { return records.find(r => r.recordType === type)?.payload; }
function instant(payload, label) {
  const value = payload?.instantUTC || payload?.utcIso;
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) throw new TypeError(`${label}_ASTRONOMY_INSTANT_REQUIRED`);
  return value;
}

export function createAstLunarNodeRuntime({ lunarNodeAdapter } = {}) {
  const adapter = lunarNodeAdapter || createAstronomyEngineLunarNodeAdapter();
  if (adapter.engineCode !== 'ASTRONOMY_ENGINE_JS' || adapter.engineVersion !== '2.1.19' || adapter.licenseCode !== 'MIT' || adapter.providerUsed || adapter.aiUsed || typeof adapter.calculateTrueNode !== 'function') {
    throw new TypeError('GOVERNED_AST_LUNAR_NODE_ADAPTER_REQUIRED');
  }
  const algorithm = Object.freeze({
    algorithmCode: AST_LUNAR_NODE_ALGORITHM_CODE,
    algorithmVersion: AST_LUNAR_NODE_ALGORITHM_VERSION,
    async calculate(records, context) {
      if (context.referenceVersions.nodePolicyCode !== AST_LUNAR_NODE_POLICY_CODE || context.referenceVersions.nodeConvention !== AST_TRUE_NODE_CONVENTION) {
        throw new TypeError('EXPLICIT_TRUE_NODE_POLICY_REQUIRED');
      }
      const personality = byType(records, 'PERSONALITY_ASTRONOMY');
      const design = byType(records, 'DESIGN_ASTRONOMY');
      const p = await adapter.calculateTrueNode(instant(personality, 'PERSONALITY'));
      const d = await adapter.calculateTrueNode(instant(design, 'DESIGN'));
      for (const x of [p,d]) {
        if (x.nodeConvention !== AST_TRUE_NODE_CONVENTION || x.referenceFrame !== 'TRUE_ECLIPTIC_OF_DATE_ECT' || x.observerMode !== 'GEOCENTRIC' || x.engineCode !== 'ASTRONOMY_ENGINE_JS' || x.engineVersion !== '2.1.19' || x.providerUsed || x.aiUsed || !Number.isFinite(x.northNodeLongitude) || !Number.isFinite(x.southNodeLongitude)) {
          throw new TypeError('AST_LUNAR_NODE_RESULT_LINEAGE_INVALID');
        }
        const opposite = ((x.northNodeLongitude + 180) % 360 + 360) % 360;
        if (Math.abs(opposite - x.southNodeLongitude) > 1e-9) throw new TypeError('SOUTH_NODE_MUST_BE_EXACT_OPPOSITE');
      }
      return Object.freeze({
        schemaVersion: 'PHI-OS-AST-LUNAR-NODE-RESULT-v1.0.0', runtimeCode: AST_LUNAR_NODE_RUNTIME_CODE,
        runtimeVersion: AST_LUNAR_NODE_RUNTIME_VERSION, methodCode: 'ASTROLOGY', pluginCode: 'AST',
        nodePolicyCode: AST_LUNAR_NODE_POLICY_CODE, nodeConvention: AST_TRUE_NODE_CONVENTION,
        personality: p, design: d, deterministic: true, providerUsed: false, aiUsed: false,
        projectionCreated: false, interpretationCreated: false, meaningCreated: false, professionalJudgmentCreated: false
      });
    }
  });
  const shared = createSharedCalculationRuntime({ algorithms: [algorithm] });
  return Object.freeze({
    async calculate({ calculationId, inputRecords }) {
      return shared.execute({
        calculationId, runtimeCode: SHARED_CALCULATION_RUNTIME_CODE, methodCode: 'ASTROLOGY', pluginCode: 'AST',
        algorithmCode: AST_LUNAR_NODE_ALGORITHM_CODE, algorithmVersion: AST_LUNAR_NODE_ALGORITHM_VERSION,
        inputRecords, referenceVersions: { nodePolicyCode: AST_LUNAR_NODE_POLICY_CODE, nodeConvention: AST_TRUE_NODE_CONVENTION, engineCode: 'ASTRONOMY_ENGINE_JS', engineVersion: '2.1.19' }
      });
    }
  });
}
