/**
 * PHI OS AST-W2 Planet Runtime.
 *
 * Resolves versioned planetary ephemeris facts from an AST-W1 astronomy
 * context through a governed adapter and SHARED_CALCULATION_RUNTIME.
 *
 * Planet Set, Node Type, Retrograde and Precision policies must be supplied
 * explicitly. No Astrology policy default is invented by this Runtime.
 */
import {
  createSharedCalculationRuntime,
  SHARED_CALCULATION_RUNTIME_CODE
} from '../method-runtime/shared-calculation-runtime.js';

export const AST_PLANET_RUNTIME_CODE = 'AST_PLANET_RUNTIME';
export const AST_PLANET_RUNTIME_VERSION = '1.0.0';
export const AST_PLANET_ALGORITHM_CODE = 'AST_PLANET_EPHEMERIS';
export const AST_PLANET_ALGORITHM_VERSION = '1.0.0';
export const AST_PLANET_RESULT_SCHEMA_VERSION =
  'PHI-OS-AST-PLANET-RESULT-v1.0.0';

const BODY_CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,47}$/;
const POLICY_CODE_PATTERN = /^[A-Z][A-Z0-9_.-]{2,63}$/;

const FORBIDDEN_KEYS = new Set([
  'house',
  'houses',
  'ascendant',
  'midheaven',
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
      throw new TypeError(`AST-W2 Planet boundary forbidden at ${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}

function findAstronomyRecord(records) {
  return records.find(record => record.recordType === 'AST_ASTRONOMY_CONTEXT');
}

function assertAstronomyRecord(record) {
  if (!record) {
    throw new TypeError('AST_ASTRONOMY_CONTEXT record is required.');
  }
  assertObject(record.payload, 'AST Astronomy context payload is required.');
  const value = record.payload;

  if (value.runtimeCode !== 'AST_ASTRONOMY_RUNTIME' ||
      value.runtimeVersion !== '1.0.0' ||
      value.executionMode !== 'validation' ||
      value.deterministic !== true ||
      value.providerUsed !== false ||
      value.aiUsed !== false ||
      value.planetRuntimeCreated !== false ||
      value.houseRuntimeCreated !== false ||
      value.aspectRuntimeCreated !== false ||
      value.projectionCreated !== false ||
      value.interpretationCreated !== false ||
      value.professionalConclusionCreated !== false ||
      value.productionEligible !== false) {
    throw new TypeError('AST-W1 Astronomy context boundary is invalid.');
  }

  if (typeof value.utcIso !== 'string' ||
      Number.isNaN(Date.parse(value.utcIso)) ||
      !Number.isFinite(value.julianDay) ||
      typeof value.timeScale !== 'string' ||
      typeof value.referenceFrame !== 'string' ||
      typeof value.observerMode !== 'string' ||
      typeof value.outputDigest !== 'string') {
    throw new TypeError('AST-W1 Astronomy context is incomplete.');
  }
}

function assertPolicyCode(value, label) {
  if (typeof value !== 'string' || !POLICY_CODE_PATTERN.test(value)) {
    throw new TypeError(`${label} must be an explicit versioned policy code.`);
  }
}

function assertBodyCodes(bodyCodes) {
  if (!Array.isArray(bodyCodes) || bodyCodes.length === 0) {
    throw new TypeError('Planet bodyCodes are required.');
  }
  if (new Set(bodyCodes).size !== bodyCodes.length) {
    throw new TypeError('Planet bodyCodes must be unique.');
  }
  for (const bodyCode of bodyCodes) {
    if (typeof bodyCode !== 'string' || !BODY_CODE_PATTERN.test(bodyCode)) {
      throw new TypeError(`Invalid Planet bodyCode: ${bodyCode}.`);
    }
  }
}

function assertAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object' ||
      typeof adapter.adapterCode !== 'string' ||
      typeof adapter.adapterVersion !== 'string' ||
      typeof adapter.engineCode !== 'string' ||
      typeof adapter.engineVersion !== 'string' ||
      typeof adapter.licenseCode !== 'string' ||
      typeof adapter.calculateBodies !== 'function') {
    throw new TypeError('Governed Planet ephemeris adapter is incomplete.');
  }
  if (adapter.engineCode !== 'ASTRONOMY_ENGINE_JS' ||
      adapter.licenseCode !== 'MIT') {
    throw new TypeError('AST-W2 requires the governed MIT Astronomy Engine candidate.');
  }
  if (adapter.aiUsed === true || adapter.providerUsed === true) {
    throw new TypeError('AI or Provider Planet calculation is forbidden.');
  }
}

function normalizeLongitude(value, bodyCode) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Invalid ecliptic longitude: ${bodyCode}.`);
  }
  return Number(((((value % 360) + 360) % 360)).toFixed(12));
}

function normalizeLatitude(value, bodyCode) {
  if (!Number.isFinite(value) || value < -90 || value > 90) {
    throw new TypeError(`Invalid ecliptic latitude: ${bodyCode}.`);
  }
  return Number(value.toFixed(12));
}

function normalizeBody(body, expectedCode, policies) {
  assertObject(body, `Planet result required: ${expectedCode}.`);
  if (body.bodyCode !== expectedCode) {
    throw new TypeError(`Planet result identity mismatch: ${expectedCode}.`);
  }
  if (!Number.isFinite(body.distanceAu) || body.distanceAu < 0 ||
      !Number.isFinite(body.speedLongitudeDegreesPerDay)) {
    throw new TypeError(`Planet distance or speed is invalid: ${expectedCode}.`);
  }

  const computedRetrograde = body.speedLongitudeDegreesPerDay < 0;
  if (typeof body.retrograde !== 'boolean' ||
      body.retrograde !== computedRetrograde) {
    throw new TypeError(`Planet retrograde status is inconsistent: ${expectedCode}.`);
  }

  if (typeof body.nodeType !== 'string') {
    throw new TypeError(`Planet nodeType is required: ${expectedCode}.`);
  }
  if (body.nodeType !== 'NONE' &&
      body.nodeType !== policies.nodePolicyCode) {
    throw new TypeError(`Planet node policy mismatch: ${expectedCode}.`);
  }

  return Object.freeze({
    bodyCode: expectedCode,
    longitude: normalizeLongitude(body.longitude, expectedCode),
    latitude: normalizeLatitude(body.latitude, expectedCode),
    distanceAu: Number(body.distanceAu.toFixed(12)),
    speedLongitudeDegreesPerDay: Number(
      body.speedLongitudeDegreesPerDay.toFixed(12)
    ),
    retrograde: body.retrograde,
    nodeType: body.nodeType
  });
}

export function createAstPlanetRuntime({ planetEphemerisAdapter } = {}) {
  assertAdapter(planetEphemerisAdapter);

  const algorithm = Object.freeze({
    algorithmCode: AST_PLANET_ALGORITHM_CODE,
    algorithmVersion: AST_PLANET_ALGORITHM_VERSION,

    async calculate(records, context) {
      const policies = context.referenceVersions;
      if (policies.executionMode !== 'validation') {
        throw new Error('AST_PLANET_PRODUCTION_EXECUTION_FORBIDDEN');
      }

      assertPolicyCode(policies.planetSetCode, 'planetSetCode');
      assertPolicyCode(policies.nodePolicyCode, 'nodePolicyCode');
      assertPolicyCode(policies.retrogradePolicyCode, 'retrogradePolicyCode');
      assertPolicyCode(policies.precisionPolicyCode, 'precisionPolicyCode');
      assertBodyCodes(policies.bodyCodes);

      const astronomy = findAstronomyRecord(records);
      assertAstronomyRecord(astronomy);

      const adapterResult = await planetEphemerisAdapter.calculateBodies({
        astronomyContext: structuredClone(astronomy.payload),
        bodyCodes: [...policies.bodyCodes],
        planetSetCode: policies.planetSetCode,
        nodePolicyCode: policies.nodePolicyCode,
        retrogradePolicyCode: policies.retrogradePolicyCode,
        precisionPolicyCode: policies.precisionPolicyCode,
        engineVersion: planetEphemerisAdapter.engineVersion
      });

      assertObject(adapterResult, 'Planet ephemeris result is required.');
      assertNoForbiddenKeys(adapterResult);

      if (adapterResult.engineCode !== planetEphemerisAdapter.engineCode ||
          adapterResult.engineVersion !== planetEphemerisAdapter.engineVersion ||
          adapterResult.licenseCode !== planetEphemerisAdapter.licenseCode ||
          adapterResult.planetSetCode !== policies.planetSetCode ||
          adapterResult.nodePolicyCode !== policies.nodePolicyCode ||
          adapterResult.retrogradePolicyCode !== policies.retrogradePolicyCode ||
          adapterResult.precisionPolicyCode !== policies.precisionPolicyCode) {
        throw new TypeError('Planet ephemeris lineage or policy mismatch.');
      }

      if (!Array.isArray(adapterResult.bodies) ||
          adapterResult.bodies.length !== policies.bodyCodes.length) {
        throw new TypeError('Planet ephemeris body set is incomplete.');
      }
      const byCode = new Map(
        adapterResult.bodies.map(body => [body.bodyCode, body])
      );
      if (byCode.size !== adapterResult.bodies.length) {
        throw new TypeError('Planet ephemeris bodyCode values must be unique.');
      }

      const bodies = policies.bodyCodes.map(bodyCode =>
        normalizeBody(byCode.get(bodyCode), bodyCode, policies)
      );

      return Object.freeze({
        schemaVersion: AST_PLANET_RESULT_SCHEMA_VERSION,
        runtimeCode: AST_PLANET_RUNTIME_CODE,
        runtimeVersion: AST_PLANET_RUNTIME_VERSION,
        methodCode: 'ASTROLOGY',
        pluginCode: 'AST',
        calculationType: 'PLANET_EPHEMERIS',
        executionMode: 'validation',
        utcIso: astronomy.payload.utcIso,
        timeScale: astronomy.payload.timeScale,
        referenceFrame: astronomy.payload.referenceFrame,
        observerMode: astronomy.payload.observerMode,
        planetSetCode: policies.planetSetCode,
        nodePolicyCode: policies.nodePolicyCode,
        retrogradePolicyCode: policies.retrogradePolicyCode,
        precisionPolicyCode: policies.precisionPolicyCode,
        bodies: Object.freeze(bodies),
        lineage: Object.freeze({
          astronomyRuntimeCode: 'AST_ASTRONOMY_RUNTIME',
          astronomyRuntimeVersion: astronomy.payload.runtimeVersion,
          astronomyOutputDigest: astronomy.payload.outputDigest,
          adapterCode: planetEphemerisAdapter.adapterCode,
          adapterVersion: planetEphemerisAdapter.adapterVersion,
          engineCode: planetEphemerisAdapter.engineCode,
          engineVersion: planetEphemerisAdapter.engineVersion,
          licenseCode: planetEphemerisAdapter.licenseCode,
          noticeRequired: true,
          validationReferenceCode: 'NASA_JPL_HORIZONS',
          validationReferenceRole: 'validation_only',
          referenceVersions: Object.freeze({ ...policies })
        }),
        deterministic: true,
        providerUsed: false,
        aiUsed: false,
        planetRuntimeCreated: true,
        houseRuntimeCreated: false,
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
    runtimeCode: AST_PLANET_RUNTIME_CODE,
    runtimeVersion: AST_PLANET_RUNTIME_VERSION,

    async calculate(request) {
      assertObject(request, 'AST Planet request is required.');
      assertNoForbiddenKeys(request);

      if (request.runtimeCode !== AST_PLANET_RUNTIME_CODE) {
        throw new TypeError('Invalid AST Planet runtimeCode.');
      }
      if (request.executionMode !== 'validation') {
        throw new Error('AST_PLANET_PRODUCTION_EXECUTION_FORBIDDEN');
      }

      return sharedRuntime.execute({
        calculationId: request.calculationId,
        runtimeCode: SHARED_CALCULATION_RUNTIME_CODE,
        methodCode: 'ASTROLOGY',
        pluginCode: 'AST',
        algorithmCode: AST_PLANET_ALGORITHM_CODE,
        algorithmVersion: AST_PLANET_ALGORITHM_VERSION,
        inputRecords: request.inputRecords,
        referenceVersions: {
          executionMode: request.executionMode,
          planetSetCode: request.planetSetCode,
          nodePolicyCode: request.nodePolicyCode,
          retrogradePolicyCode: request.retrogradePolicyCode,
          precisionPolicyCode: request.precisionPolicyCode,
          bodyCodes: request.bodyCodes,
          planetAdapter: planetEphemerisAdapter.adapterVersion,
          engineCode: planetEphemerisAdapter.engineCode,
          engineVersion: planetEphemerisAdapter.engineVersion,
          licenseCode: planetEphemerisAdapter.licenseCode,
          ...(request.referenceVersions || {})
        }
      });
    }
  });
}
