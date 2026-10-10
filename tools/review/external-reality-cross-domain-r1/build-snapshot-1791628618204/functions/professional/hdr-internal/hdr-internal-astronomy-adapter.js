import { createAstronomyEngineProductionAdapters } from '../../method-client-delivery/production-adapters/astronomy-engine-production-adapter.js';
import { createAstronomyEngineLunarNodeAdapter } from '../../core-method-runtime/ast-lunar-node-adapter.js';

export const HDR_INTERNAL_ASTRONOMY_ADAPTER_CODE = 'HDR_INTERNAL_SHARED_AST_ASTRONOMY_ADAPTER';
export const HDR_INTERNAL_ASTRONOMY_ADAPTER_VERSION = '1.0.0';
export const HDR_INTERNAL_ASTRONOMY_ENGINE = 'ASTRONOMY_ENGINE_JS';
export const HDR_INTERNAL_ASTRONOMY_ENGINE_VERSION = '2.1.19';
export const HDR_INTERNAL_NODE_CONVENTION = 'TRUE_NODE.V1';

const CORE_BODIES = Object.freeze([
  'SUN', 'MOON', 'MERCURY', 'VENUS', 'MARS', 'JUPITER',
  'SATURN', 'URANUS', 'NEPTUNE', 'PLUTO'
]);

function normalize360(value) {
  if (!Number.isFinite(value)) throw new TypeError('HDR_INTERNAL_LONGITUDE_INVALID');
  return Number((((value % 360) + 360) % 360).toFixed(12));
}

function assertUtcIso(value) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new TypeError('HDR_INTERNAL_VALID_UTC_REQUIRED');
  }
}

export function createHdrInternalAstronomyAdapter({ astronomyModuleLoader } = {}) {
  const ast = createAstronomyEngineProductionAdapters({ astronomyModuleLoader });
  const node = createAstronomyEngineLunarNodeAdapter({ moduleLoader: astronomyModuleLoader });

  return Object.freeze({
    adapterCode: HDR_INTERNAL_ASTRONOMY_ADAPTER_CODE,
    adapterVersion: HDR_INTERNAL_ASTRONOMY_ADAPTER_VERSION,
    engineCode: HDR_INTERNAL_ASTRONOMY_ENGINE,
    engineVersion: HDR_INTERNAL_ASTRONOMY_ENGINE_VERSION,
    licenseCode: 'MIT',
    nodeConvention: HDR_INTERNAL_NODE_CONVENTION,
    authoritySource: 'EXISTING_SHARED_AST_ASTRONOMY_AUTHORITY',
    providerUsed: false,
    aiUsed: false,

    async calculateLongitudesAt(utcIso) {
      assertUtcIso(utcIso);
      const planetResult = await ast.planetEphemerisAdapter.calculateBodies({
        astronomyContext: { utcIso },
        bodyCodes: [...CORE_BODIES],
        planetSetCode: 'PHI_OS_AST_PLANET_SET_CORE_10_V1',
        nodePolicyCode: 'PHI_OS_AST_NODE_NONE_V1',
        retrogradePolicyCode: 'PHI_OS_AST_LONGITUDE_SPEED_RETROGRADE_V1',
        precisionPolicyCode: 'PHI_OS_AST_DECIMAL_12_V1'
      });
      const longitudes = Object.fromEntries(
        planetResult.bodies.map(body => [body.bodyCode, normalize360(body.longitude)])
      );
      longitudes.EARTH = normalize360(longitudes.SUN + 180);
      const nodes = await node.calculateTrueNode(utcIso);
      longitudes.NORTH_NODE = normalize360(nodes.northNodeLongitude);
      longitudes.SOUTH_NODE = normalize360(nodes.southNodeLongitude);
      return Object.freeze({
        utcIso,
        longitudes: Object.freeze(longitudes),
        engineCode: HDR_INTERNAL_ASTRONOMY_ENGINE,
        engineVersion: HDR_INTERNAL_ASTRONOMY_ENGINE_VERSION,
        nodeConvention: HDR_INTERNAL_NODE_CONVENTION,
        referenceFrame: 'TRUE_ECLIPTIC_OF_DATE_ECT',
        observerMode: 'GEOCENTRIC',
        deterministic: true,
        providerUsed: false,
        aiUsed: false
      });
    },

    async sunLongitudeAt({ utcIso }) {
      const result = await this.calculateLongitudesAt(utcIso);
      return Object.freeze({
        ephemerisVersion: HDR_INTERNAL_ASTRONOMY_ENGINE_VERSION,
        sunLongitude: result.longitudes.SUN
      });
    }
  });
}
