/**
 * AST Lunar Node adapter for the already-governed Astronomy Engine JS 2.1.19.
 * Ephemeris authority stays with AST/Shared Calculation; this module only derives
 * the instantaneous ascending orbital-plane intersection from governed Moon state.
 */
export const AST_LUNAR_NODE_ADAPTER_CODE = 'ASTRONOMY_ENGINE_TRUE_LUNAR_NODE_ADAPTER';
export const AST_LUNAR_NODE_ADAPTER_VERSION = '1.0.0';
export const AST_LUNAR_NODE_ENGINE_VERSION = '2.1.19';
export const AST_TRUE_NODE_CONVENTION = 'TRUE_NODE.V1';

export function normalize360(value) {
  if (!Number.isFinite(value)) throw new TypeError('LUNAR_NODE_LONGITUDE_MUST_BE_FINITE');
  return ((value % 360) + 360) % 360;
}

function finiteState(state) {
  const keys = ['x','y','z','vx','vy','vz'];
  return !!state && keys.every(key => Number.isFinite(state[key]));
}

/** Pure geometry: ascending-node longitude from Moon state already expressed in ECT. */
export function trueNodeLongitudeFromEclipticState(state) {
  if (!finiteState(state)) throw new TypeError('LUNAR_NODE_ECLIPTIC_STATE_INVALID');
  const hx = state.y * state.vz - state.z * state.vy;
  const hy = state.z * state.vx - state.x * state.vz;
  const hz = state.x * state.vy - state.y * state.vx;
  const hnorm = Math.hypot(hx, hy, hz);
  const nodeNorm = Math.hypot(-hy, hx);
  if (!(hnorm > 0) || !(nodeNorm > 1e-15)) throw new TypeError('LUNAR_NODE_ORBITAL_PLANE_DEGENERATE');
  return Number(normalize360(Math.atan2(hx, -hy) * 180 / Math.PI).toFixed(12));
}

function normalizeModule(module) {
  if (!module || typeof module !== 'object') return module;
  if (module.default && typeof module.default.GeoMoonState === 'function') return module.default;
  return module;
}

function assertEngine(engine) {
  for (const fn of ['GeoMoonState','Rotation_EQJ_ECT','RotateState']) {
    if (typeof engine?.[fn] !== 'function') throw new TypeError(`ASTRONOMY_ENGINE_FUNCTION_REQUIRED:${fn}`);
  }
}

export function createAstronomyEngineLunarNodeAdapter({ astronomyEngine, moduleLoader } = {}) {
  const loader = moduleLoader || (async () => import('astronomy-engine'));
  if (astronomyEngine != null) assertEngine(normalizeModule(astronomyEngine));
  let loaded = astronomyEngine ? Promise.resolve(normalizeModule(astronomyEngine)) : null;
  async function engine() {
    if (!loaded) loaded = loader().then(normalizeModule);
    const value = await loaded; assertEngine(value); return value;
  }
  return Object.freeze({
    adapterCode: AST_LUNAR_NODE_ADAPTER_CODE,
    adapterVersion: AST_LUNAR_NODE_ADAPTER_VERSION,
    engineCode: 'ASTRONOMY_ENGINE_JS',
    engineVersion: AST_LUNAR_NODE_ENGINE_VERSION,
    licenseCode: 'MIT',
    providerUsed: false,
    aiUsed: false,
    async calculateTrueNode(utcIso) {
      if (typeof utcIso !== 'string' || Number.isNaN(Date.parse(utcIso))) throw new TypeError('LUNAR_NODE_VALID_UTC_INSTANT_REQUIRED');
      const api = await engine();
      const date = new Date(utcIso);
      const time = typeof api.MakeTime === 'function' ? api.MakeTime(date) : date;
      const eqj = api.GeoMoonState(time);
      const rotation = api.Rotation_EQJ_ECT(time);
      const ect = api.RotateState(rotation, eqj);
      const northNodeLongitude = trueNodeLongitudeFromEclipticState(ect);
      const southNodeLongitude = Number(normalize360(northNodeLongitude + 180).toFixed(12));
      return Object.freeze({
        nodeConvention: AST_TRUE_NODE_CONVENTION,
        northNodeLongitude,
        southNodeLongitude,
        referenceFrame: 'TRUE_ECLIPTIC_OF_DATE_ECT',
        observerMode: 'GEOCENTRIC',
        engineCode: 'ASTRONOMY_ENGINE_JS',
        engineVersion: AST_LUNAR_NODE_ENGINE_VERSION,
        deterministic: true,
        providerUsed: false,
        aiUsed: false
      });
    }
  });
}
