/**
 * PHI OS AST-W3 House Runtime.
 *
 * Resolves versioned House cusps, Angles and Planet house placements from
 * AST-W1 Astronomy Context + AST-W2 Planet Result through a governed adapter.
 *
 * House System and Zodiac policies must be explicit. No default Placidus,
 * Whole Sign, Tropical or Sidereal policy is invented by this Runtime.
 */
import {
  createSharedCalculationRuntime,
  SHARED_CALCULATION_RUNTIME_CODE
} from '../method-runtime/shared-calculation-runtime.js';

export const AST_HOUSE_RUNTIME_CODE = 'AST_HOUSE_RUNTIME';
export const AST_HOUSE_RUNTIME_VERSION = '1.0.0';
export const AST_HOUSE_ALGORITHM_CODE = 'AST_HOUSE_STRUCTURE';
export const AST_HOUSE_ALGORITHM_VERSION = '1.0.0';
export const AST_HOUSE_RESULT_SCHEMA_VERSION =
  'PHI-OS-AST-HOUSE-RESULT-v1.0.0';

const POLICY_CODE_PATTERN = /^[A-Z][A-Z0-9_.-]{2,63}$/;
const HOUSE_NUMBERS = Object.freeze(
  Array.from({ length: 12 }, (_, index) => index + 1)
);

const FORBIDDEN_KEYS = new Set([
  'aspect',
  'aspects',
  'orb',
  'projection',
  'interpretation',
  'professionalConclusion',
  'professionalReport',
  'realityDecision'
]);

function assertObject(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(message);
  }
}

function assertNoForbiddenKeys(value, path = '$') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new TypeError(`AST-W3 House boundary forbidden at ${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}

function normalizeLongitude(value, label) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Invalid longitude: ${label}.`);
  }
  return Number(((((value % 360) + 360) % 360)).toFixed(12));
}

function assertPolicyCode(value, label) {
  if (typeof value !== 'string' || !POLICY_CODE_PATTERN.test(value)) {
    throw new TypeError(`${label} must be an explicit versioned policy code.`);
  }
}

function findRecord(records, recordType) {
  return records.find(record => record.recordType === recordType);
}

function assertAstronomyContext(record) {
  if (!record) {
    throw new TypeError('AST_ASTRONOMY_CONTEXT record is required.');
  }
  assertObject(record.payload, 'AST Astronomy Context payload is required.');
  const value = record.payload;
  if (value.runtimeCode !== 'AST_ASTRONOMY_RUNTIME' ||
      value.runtimeVersion !== '1.0.0' ||
      value.executionMode !== 'validation' ||
      value.observerMode !== 'TOPOCENTRIC' ||
      !value.observer ||
      !Number.isFinite(value.observer.latitude) ||
      !Number.isFinite(value.observer.longitude) ||
      value.deterministic !== true ||
      value.providerUsed !== false ||
      value.aiUsed !== false ||
      value.houseRuntimeCreated !== false ||
      value.aspectRuntimeCreated !== false ||
      value.projectionCreated !== false ||
      value.interpretationCreated !== false ||
      value.professionalConclusionCreated !== false ||
      value.productionEligible !== false) {
    throw new TypeError('AST-W1 Astronomy Context is not House-ready.');
  }
}

function assertPlanetResult(record, astronomy) {
  if (!record) {
    throw new TypeError('AST_PLANET_RESULT record is required.');
  }
  assertObject(record.payload, 'AST Planet Result payload is required.');
  const value = record.payload;
  if (value.runtimeCode !== 'AST_PLANET_RUNTIME' ||
      value.runtimeVersion !== '1.0.0' ||
      value.executionMode !== 'validation' ||
      value.utcIso !== astronomy.payload.utcIso ||
      value.timeScale !== astronomy.payload.timeScale ||
      value.referenceFrame !== astronomy.payload.referenceFrame ||
      value.observerMode !== astronomy.payload.observerMode ||
      value.deterministic !== true ||
      value.providerUsed !== false ||
      value.aiUsed !== false ||
      value.planetRuntimeCreated !== true ||
      value.houseRuntimeCreated !== false ||
      value.aspectRuntimeCreated !== false ||
      value.projectionCreated !== false ||
      value.interpretationCreated !== false ||
      value.professionalConclusionCreated !== false ||
      value.productionEligible !== false ||
      !Array.isArray(value.bodies) ||
      value.bodies.length === 0) {
    throw new TypeError('AST-W2 Planet Result is not House-ready.');
  }
}

function assertAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object' ||
      typeof adapter.adapterCode !== 'string' ||
      typeof adapter.adapterVersion !== 'string' ||
      typeof adapter.engineCode !== 'string' ||
      typeof adapter.engineVersion !== 'string' ||
      typeof adapter.licenseCode !== 'string' ||
      typeof adapter.calculateHouses !== 'function') {
    throw new TypeError('Governed House adapter is incomplete.');
  }
  if (adapter.engineCode !== 'ASTRONOMY_ENGINE_JS' ||
      adapter.licenseCode !== 'MIT') {
    throw new TypeError('AST-W3 requires the governed MIT Astronomy Engine candidate.');
  }
  if (adapter.aiUsed === true || adapter.providerUsed === true) {
    throw new TypeError('AI or Provider House calculation is forbidden.');
  }
}

function normalizeCusps(cusps) {
  if (!Array.isArray(cusps) || cusps.length !== 12) {
    throw new TypeError('House cusps must contain exactly 12 entries.');
  }

  const seen = new Set();
  const normalized = cusps.map(cusp => {
    assertObject(cusp, 'Invalid House cusp.');
    if (!HOUSE_NUMBERS.includes(cusp.houseNumber) ||
        seen.has(cusp.houseNumber)) {
      throw new TypeError('House cusp numbers must be unique from 1 to 12.');
    }
    seen.add(cusp.houseNumber);
    return Object.freeze({
      houseNumber: cusp.houseNumber,
      longitude: normalizeLongitude(
        cusp.longitude,
        `HOUSE_${cusp.houseNumber}`
      )
    });
  }).sort((a, b) => a.houseNumber - b.houseNumber);

  if (normalized.some((cusp, index) => cusp.houseNumber !== index + 1)) {
    throw new TypeError('House cusp sequence is incomplete.');
  }
  return Object.freeze(normalized);
}

function normalizePlacements(placements, bodies) {
  if (!Array.isArray(placements) || placements.length !== bodies.length) {
    throw new TypeError('Planet house placements are incomplete.');
  }

  const bodyCodes = bodies.map(body => body.bodyCode);
  const byCode = new Map(
    placements.map(placement => [placement.bodyCode, placement])
  );
  if (byCode.size !== placements.length) {
    throw new TypeError('Planet house placement bodyCode values must be unique.');
  }

  return Object.freeze(bodyCodes.map(bodyCode => {
    const placement = byCode.get(bodyCode);
    assertObject(placement, `House placement missing: ${bodyCode}.`);
    if (placement.bodyCode !== bodyCode ||
        !HOUSE_NUMBERS.includes(placement.houseNumber)) {
      throw new TypeError(`Invalid House placement: ${bodyCode}.`);
    }
    return Object.freeze({
      bodyCode,
      houseNumber: placement.houseNumber
    });
  }));
}

export function createAstHouseRuntime({ houseAdapter } = {}) {
  assertAdapter(houseAdapter);

  const algorithm = Object.freeze({
    algorithmCode: AST_HOUSE_ALGORITHM_CODE,
    algorithmVersion: AST_HOUSE_ALGORITHM_VERSION,

    async calculate(records, context) {
      const policies = context.referenceVersions;
      if (policies.executionMode !== 'validation') {
        throw new Error('AST_HOUSE_PRODUCTION_EXECUTION_FORBIDDEN');
      }

      assertPolicyCode(policies.houseSystemCode, 'houseSystemCode');
      assertPolicyCode(policies.zodiacPolicyCode, 'zodiacPolicyCode');
      assertPolicyCode(policies.anglePolicyCode, 'anglePolicyCode');
      assertPolicyCode(policies.precisionPolicyCode, 'precisionPolicyCode');

      const astronomy = findRecord(records, 'AST_ASTRONOMY_CONTEXT');
      const planets = findRecord(records, 'AST_PLANET_RESULT');
      assertAstronomyContext(astronomy);
      assertPlanetResult(planets, astronomy);

      const adapterResult = await houseAdapter.calculateHouses({
        astronomyContext: structuredClone(astronomy.payload),
        planetResult: structuredClone(planets.payload),
        houseSystemCode: policies.houseSystemCode,
        zodiacPolicyCode: policies.zodiacPolicyCode,
        anglePolicyCode: policies.anglePolicyCode,
        precisionPolicyCode: policies.precisionPolicyCode,
        engineVersion: houseAdapter.engineVersion
      });

      assertObject(adapterResult, 'House adapter result is required.');
      assertNoForbiddenKeys(adapterResult);

      if (adapterResult.engineCode !== houseAdapter.engineCode ||
          adapterResult.engineVersion !== houseAdapter.engineVersion ||
          adapterResult.licenseCode !== houseAdapter.licenseCode ||
          adapterResult.houseSystemCode !== policies.houseSystemCode ||
          adapterResult.zodiacPolicyCode !== policies.zodiacPolicyCode ||
          adapterResult.anglePolicyCode !== policies.anglePolicyCode ||
          adapterResult.precisionPolicyCode !== policies.precisionPolicyCode) {
        throw new TypeError('House adapter lineage or policy mismatch.');
      }

      const cusps = normalizeCusps(adapterResult.cusps);
      const placements = normalizePlacements(
        adapterResult.placements,
        planets.payload.bodies
      );

      return Object.freeze({
        schemaVersion: AST_HOUSE_RESULT_SCHEMA_VERSION,
        runtimeCode: AST_HOUSE_RUNTIME_CODE,
        runtimeVersion: AST_HOUSE_RUNTIME_VERSION,
        methodCode: 'ASTROLOGY',
        pluginCode: 'AST',
        calculationType: 'HOUSE_STRUCTURE',
        executionMode: 'validation',
        utcIso: astronomy.payload.utcIso,
        timeScale: astronomy.payload.timeScale,
        referenceFrame: astronomy.payload.referenceFrame,
        observerMode: astronomy.payload.observerMode,
        observer: Object.freeze({
          latitude: astronomy.payload.observer.latitude,
          longitude: astronomy.payload.observer.longitude,
          elevationMeters: astronomy.payload.observer.elevationMeters,
          datum: astronomy.payload.observer.datum
        }),
        houseSystemCode: policies.houseSystemCode,
        zodiacPolicyCode: policies.zodiacPolicyCode,
        anglePolicyCode: policies.anglePolicyCode,
        precisionPolicyCode: policies.precisionPolicyCode,
        ascendantLongitude: normalizeLongitude(
          adapterResult.ascendantLongitude,
          'ASCENDANT'
        ),
        midheavenLongitude: normalizeLongitude(
          adapterResult.midheavenLongitude,
          'MIDHEAVEN'
        ),
        descendantLongitude: normalizeLongitude(
          adapterResult.descendantLongitude,
          'DESCENDANT'
        ),
        imumCoeliLongitude: normalizeLongitude(
          adapterResult.imumCoeliLongitude,
          'IMUM_COELI'
        ),
        cusps,
        placements,
        lineage: Object.freeze({
          astronomyRuntimeCode: 'AST_ASTRONOMY_RUNTIME',
          astronomyRuntimeVersion: astronomy.payload.runtimeVersion,
          astronomyOutputDigest: astronomy.payload.outputDigest,
          planetRuntimeCode: 'AST_PLANET_RUNTIME',
          planetRuntimeVersion: planets.payload.runtimeVersion,
          planetOutputDigest: planets.payload.outputDigest,
          adapterCode: houseAdapter.adapterCode,
          adapterVersion: houseAdapter.adapterVersion,
          engineCode: houseAdapter.engineCode,
          engineVersion: houseAdapter.engineVersion,
          licenseCode: houseAdapter.licenseCode,
          noticeRequired: true,
          validationReferenceCode: 'NASA_JPL_HORIZONS',
          validationReferenceRole: 'validation_only',
          referenceVersions: Object.freeze({ ...policies })
        }),
        deterministic: true,
        providerUsed: false,
        aiUsed: false,
        houseRuntimeCreated: true,
        aspectRuntimeCreated: false,
        projectionCreated: false,
        interpretationCreated: false,
        professionalConclusionCreated: false,
        productionEligible: false
      });
    }
  });

  const sharedRuntime = createSharedCalculationRuntime({
    algorithms: [algorithm]
  });

  return Object.freeze({
    runtimeCode: AST_HOUSE_RUNTIME_CODE,
    runtimeVersion: AST_HOUSE_RUNTIME_VERSION,

    async calculate(request) {
      assertObject(request, 'AST House request is required.');
      assertNoForbiddenKeys(request);

      if (request.runtimeCode !== AST_HOUSE_RUNTIME_CODE) {
        throw new TypeError('Invalid AST House runtimeCode.');
      }
      if (request.executionMode !== 'validation') {
        throw new Error('AST_HOUSE_PRODUCTION_EXECUTION_FORBIDDEN');
      }

      return sharedRuntime.execute({
        calculationId: request.calculationId,
        runtimeCode: SHARED_CALCULATION_RUNTIME_CODE,
        methodCode: 'ASTROLOGY',
        pluginCode: 'AST',
        algorithmCode: AST_HOUSE_ALGORITHM_CODE,
        algorithmVersion: AST_HOUSE_ALGORITHM_VERSION,
        inputRecords: request.inputRecords,
        referenceVersions: {
          executionMode: request.executionMode,
          houseSystemCode: request.houseSystemCode,
          zodiacPolicyCode: request.zodiacPolicyCode,
          anglePolicyCode: request.anglePolicyCode,
          precisionPolicyCode: request.precisionPolicyCode,
          houseAdapter: houseAdapter.adapterVersion,
          engineCode: houseAdapter.engineCode,
          engineVersion: houseAdapter.engineVersion,
          licenseCode: houseAdapter.licenseCode,
          ...(request.referenceVersions || {})
        }
      });
    }
  });
}
