/**
 * PHI OS AST-W4B Aspect Runtime.
 *
 * Detects governed Astrology aspects from AST-W2 Planet Result through
 * AST-W4A Aspect Governance and SHARED_CALCULATION_RUNTIME.
 *
 * This Runtime contains no Aspect angles, Orb values or priority order.
 * All such rules are read from the supplied frozen Governance Registry.
 */
import {
  createSharedCalculationRuntime,
  SHARED_CALCULATION_RUNTIME_CODE
} from '../method-runtime/shared-calculation-runtime.js';

export const AST_ASPECT_RUNTIME_CODE = 'AST_ASPECT_RUNTIME';
export const AST_ASPECT_RUNTIME_VERSION = '1.0.0';
export const AST_ASPECT_ALGORITHM_CODE = 'AST_GOVERNED_ASPECT_DETECTION';
export const AST_ASPECT_ALGORITHM_VERSION = '1.0.0';
export const AST_ASPECT_RESULT_SCHEMA_VERSION =
  'PHI-OS-AST-ASPECT-RESULT-v1.0.0';

const POLICY_CODE_PATTERN = /^[A-Z][A-Z0-9_.-]{2,63}$/;
const CLASSIFICATIONS = new Set([
  'APPLYING',
  'SEPARATING',
  'EXACT',
  'UNDETERMINED'
]);

const FORBIDDEN_KEYS = new Set([
  'projection',
  'interpretation',
  'knowledge',
  'professionalConclusion',
  'professionalReport',
  'realityDecision',
  'realityConclusion',
  'release'
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
      throw new TypeError(`AST-W4B Aspect boundary forbidden at ${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}

function assertPolicyCode(value, label) {
  if (typeof value !== 'string' || !POLICY_CODE_PATTERN.test(value)) {
    throw new TypeError(`${label} must be an explicit governed policy code.`);
  }
}

function normalizeLongitude(value, label) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Invalid longitude: ${label}.`);
  }
  return Number(((((value % 360) + 360) % 360)).toFixed(12));
}

function shortestSeparation(longitudeA, longitudeB) {
  const raw = Math.abs(longitudeA - longitudeB) % 360;
  return Number(Math.min(raw, 360 - raw).toFixed(12));
}

function findPlanetRecord(records) {
  return records.find(record => record.recordType === 'AST_PLANET_RESULT');
}

function assertPlanetResult(record) {
  if (!record) {
    throw new TypeError('AST_PLANET_RESULT record is required.');
  }
  assertObject(record.payload, 'AST Planet Result payload is required.');
  const value = record.payload;

  if (value.runtimeCode !== 'AST_PLANET_RUNTIME' ||
      value.runtimeVersion !== '1.0.0' ||
      value.executionMode !== 'validation' ||
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
      typeof value.outputDigest !== 'string' ||
      !Array.isArray(value.bodies) ||
      value.bodies.length < 2) {
    throw new TypeError('AST-W2 Planet Result is not Aspect-ready.');
  }

  const bodyCodes = new Set();
  for (const body of value.bodies) {
    assertObject(body, 'AST Planet body is invalid.');
    if (typeof body.bodyCode !== 'string' ||
        bodyCodes.has(body.bodyCode) ||
        !Number.isFinite(body.longitude) ||
        !Number.isFinite(body.speedLongitudeDegreesPerDay)) {
      throw new TypeError('AST Planet body identity or motion is invalid.');
    }
    bodyCodes.add(body.bodyCode);
  }
}

function findByCode(items, key, value, label) {
  const matches = items.filter(item => item[key] === value);
  if (matches.length !== 1) {
    throw new TypeError(`${label} must resolve to exactly one Registry entry.`);
  }
  return matches[0];
}

function createRegistrySnapshot(governance) {
  assertObject(governance, 'AST-W4A Aspect Governance Registry is required.');
  if (governance.schemaVersion !==
        'PHI-OS-AST-ASPECT-GOVERNANCE-v1.0.0' ||
      governance.stageCode !== 'AST-W4A' ||
      governance.governanceCode !== 'AST_ASPECT_GOVERNANCE' ||
      governance.status !== 'governance_frozen_runtime_not_started' ||
      governance.methodCode !== 'ASTROLOGY' ||
      governance.pluginCode !== 'AST' ||
      governance.authority?.runtimeAuthority !== false ||
      governance.authority?.productionAuthority !== false ||
      governance.runtimeContract?.runtimeStage !== 'AST-W4B' ||
      governance.runtimeContract?.registryReadRequired !== true ||
      governance.runtimeContract?.hardCodedAspectAnglesAllowed !== false ||
      governance.runtimeContract?.hardCodedOrbAllowed !== false ||
      governance.runtimeContract?.hardCodedPriorityAllowed !== false ||
      governance.runtimeContract?.localPolicyOverrideAllowed !== false ||
      governance.runtimeContract?.sharedCalculationRuntimeRequired !== true ||
      governance.runtimeContract?.providerAllowed !== false ||
      governance.runtimeContract?.aiAllowed !== false ||
      governance.validationBoundary?.executionMode !== 'validation' ||
      governance.validationBoundary?.runtimeMayInventPolicy !== false) {
    throw new TypeError('AST-W4A Aspect Governance boundary is invalid.');
  }

  const aspectCodes = new Set();
  for (const aspect of governance.aspectRegistry || []) {
    if (typeof aspect.aspectCode !== 'string' ||
        aspectCodes.has(aspect.aspectCode) ||
        !Number.isFinite(aspect.angleDegrees) ||
        aspect.angleDegrees < 0 ||
        aspect.angleDegrees > 180 ||
        aspect.status !== 'registered' ||
        aspect.symmetry !== 'unordered_pair') {
      throw new TypeError('Aspect Registry entry is invalid.');
    }
    aspectCodes.add(aspect.aspectCode);
  }

  return Object.freeze(structuredClone(governance));
}

function resolvePolicies(governance, references) {
  assertPolicyCode(references.aspectSetCode, 'aspectSetCode');
  assertPolicyCode(references.orbPolicyCode, 'orbPolicyCode');
  assertPolicyCode(references.applyingPolicyCode, 'applyingPolicyCode');
  assertPolicyCode(references.priorityPolicyCode, 'priorityPolicyCode');
  assertPolicyCode(
    references.normalizationPolicyCode,
    'normalizationPolicyCode'
  );

  const aspectSet = findByCode(
    governance.aspectSets,
    'aspectSetCode',
    references.aspectSetCode,
    'Aspect Set'
  );
  const orbPolicy = findByCode(
    governance.orbPolicies,
    'orbPolicyCode',
    references.orbPolicyCode,
    'Orb Policy'
  );
  const applyingPolicy = findByCode(
    governance.applyingPolicies,
    'applyingPolicyCode',
    references.applyingPolicyCode,
    'Applying Policy'
  );
  const priorityPolicy = findByCode(
    governance.priorityPolicies,
    'priorityPolicyCode',
    references.priorityPolicyCode,
    'Priority Policy'
  );
  const normalizationPolicy = governance.normalizationPolicy;

  if (normalizationPolicy.normalizationPolicyCode !==
      references.normalizationPolicyCode) {
    throw new TypeError('Normalization Policy is not registered.');
  }
  if (aspectSet.status !== 'candidate_validation_only' ||
      aspectSet.productionApproved !== false ||
      orbPolicy.status !== 'approved_for_validation_only' ||
      orbPolicy.productionApproved !== false ||
      applyingPolicy.status !== 'candidate_validation_only' ||
      applyingPolicy.productionApproved !== false ||
      priorityPolicy.status !== 'candidate_validation_only' ||
      priorityPolicy.productionApproved !== false) {
    throw new TypeError('Aspect Governance policy is not validation-authorized.');
  }
  if (orbPolicy.defaultOrbDegrees >
        governance.validationBoundary.maximumAuthorizedOrbDegrees ||
      orbPolicy.defaultOrbDegrees <
        governance.validationBoundary.minimumAuthorizedOrbDegrees) {
    throw new TypeError('Orb Policy exceeds the authorized validation boundary.');
  }
  if (governance.validationBoundary.exactOnly === true &&
      orbPolicy.defaultOrbDegrees !== 0) {
    throw new TypeError('Exact-only validation requires zero-degree Orb.');
  }
  if (normalizationPolicy.formulaCode !==
        'MIN_ABSOLUTE_MODULAR_SEPARATION' ||
      normalizationPolicy.bodyPairOrdering !==
        'LEXICOGRAPHIC_BODY_CODE' ||
      normalizationPolicy.duplicatePairAllowed !== false) {
    throw new TypeError('Aspect normalization policy is unsupported.');
  }

  const registry = new Map(
    governance.aspectRegistry.map(aspect => [aspect.aspectCode, aspect])
  );
  const aspects = aspectSet.aspectCodes.map(code => {
    const aspect = registry.get(code);
    if (!aspect) {
      throw new TypeError(`Aspect Set references unknown Aspect: ${code}.`);
    }
    return aspect;
  });

  const priority = new Map(
    priorityPolicy.orderedAspectCodes.map((code, index) => [code, index])
  );
  if (new Set(priorityPolicy.orderedAspectCodes).size !==
      priorityPolicy.orderedAspectCodes.length ||
      aspects.some(aspect => !priority.has(aspect.aspectCode))) {
    throw new TypeError('Priority Policy does not cover the Aspect Set.');
  }

  return Object.freeze({
    aspectSet,
    orbPolicy,
    applyingPolicy,
    priorityPolicy,
    normalizationPolicy,
    aspects: Object.freeze(aspects.map(item => Object.freeze({ ...item }))),
    priority
  });
}

function classifyMotion(bodyA, bodyB, aspect, separation, applyingPolicy) {
  if (separation === aspect.angleDegrees) return 'EXACT';
  if (applyingPolicy.requiresLongitudeSpeed !== true) return 'UNDETERMINED';

  const speedA = bodyA.speedLongitudeDegreesPerDay;
  const speedB = bodyB.speedLongitudeDegreesPerDay;
  if (!Number.isFinite(speedA) || !Number.isFinite(speedB)) {
    return applyingPolicy.unknownSpeedPolicy;
  }

  const futureA = normalizeLongitude(bodyA.longitude + speedA, bodyA.bodyCode);
  const futureB = normalizeLongitude(bodyB.longitude + speedB, bodyB.bodyCode);
  const futureSeparation = shortestSeparation(futureA, futureB);
  const currentError = Math.abs(separation - aspect.angleDegrees);
  const futureError = Math.abs(futureSeparation - aspect.angleDegrees);

  if (futureError < currentError) return 'APPLYING';
  if (futureError > currentError) return 'SEPARATING';
  return 'UNDETERMINED';
}

function detectPair(bodyA, bodyB, policies, governance) {
  const longitudeA = normalizeLongitude(bodyA.longitude, bodyA.bodyCode);
  const longitudeB = normalizeLongitude(bodyB.longitude, bodyB.bodyCode);
  const separationDegrees = shortestSeparation(longitudeA, longitudeB);

  const matches = policies.aspects
    .map(aspect => {
      const override = policies.orbPolicy.perAspectOverrides?.[
        aspect.aspectCode
      ];
      const authorizedOrb = override ?? policies.orbPolicy.defaultOrbDegrees;
      const orbDegrees = Number(
        Math.abs(separationDegrees - aspect.angleDegrees).toFixed(12)
      );
      return {
        aspect,
        authorizedOrb,
        orbDegrees
      };
    })
    .filter(match => match.orbDegrees <= match.authorizedOrb)
    .sort((a, b) =>
      a.orbDegrees - b.orbDegrees ||
      policies.priority.get(a.aspect.aspectCode) -
        policies.priority.get(b.aspect.aspectCode)
    );

  if (matches.length === 0) return null;
  if (matches.length > 1 &&
      governance.validationBoundary.ambiguousMatchPolicy === 'FAIL_CLOSED') {
    throw new Error(
      `AST_ASPECT_AMBIGUOUS_MATCH:${bodyA.bodyCode}:${bodyB.bodyCode}`
    );
  }

  const selected = matches[0];
  const classification = classifyMotion(
    bodyA,
    bodyB,
    selected.aspect,
    separationDegrees,
    policies.applyingPolicy
  );
  if (!CLASSIFICATIONS.has(classification)) {
    throw new TypeError('Applying Policy returned an invalid classification.');
  }

  return Object.freeze({
    pairCode: `${bodyA.bodyCode}__${bodyB.bodyCode}`,
    bodyA: bodyA.bodyCode,
    bodyB: bodyB.bodyCode,
    longitudeA,
    longitudeB,
    separationDegrees,
    aspectCode: selected.aspect.aspectCode,
    exactAngleDegrees: selected.aspect.angleDegrees,
    orbDegrees: selected.orbDegrees,
    authorizedOrbDegrees: selected.authorizedOrb,
    motionClassification: classification,
    priorityRank: policies.priority.get(selected.aspect.aspectCode) + 1
  });
}

export function createAstAspectRuntime({ aspectGovernance } = {}) {
  const governance = createRegistrySnapshot(aspectGovernance);

  const algorithm = Object.freeze({
    algorithmCode: AST_ASPECT_ALGORITHM_CODE,
    algorithmVersion: AST_ASPECT_ALGORITHM_VERSION,

    async calculate(records, context) {
      const references = context.referenceVersions;
      if (references.executionMode !== 'validation') {
        throw new Error('AST_ASPECT_PRODUCTION_EXECUTION_FORBIDDEN');
      }

      const policies = resolvePolicies(governance, references);
      const planetRecord = findPlanetRecord(records);
      assertPlanetResult(planetRecord);

      const sortedBodies = structuredClone(planetRecord.payload.bodies)
        .sort((a, b) => a.bodyCode.localeCompare(b.bodyCode));

      const aspects = [];
      for (let left = 0; left < sortedBodies.length; left += 1) {
        for (let right = left + 1; right < sortedBodies.length; right += 1) {
          const detected = detectPair(
            sortedBodies[left],
            sortedBodies[right],
            policies,
            governance
          );
          if (detected) aspects.push(detected);
        }
      }

      const pairCodes = aspects.map(item => item.pairCode);
      if (new Set(pairCodes).size !== pairCodes.length) {
        throw new Error('AST_ASPECT_DUPLICATE_PAIR_FORBIDDEN');
      }

      return Object.freeze({
        schemaVersion: AST_ASPECT_RESULT_SCHEMA_VERSION,
        runtimeCode: AST_ASPECT_RUNTIME_CODE,
        runtimeVersion: AST_ASPECT_RUNTIME_VERSION,
        methodCode: 'ASTROLOGY',
        pluginCode: 'AST',
        calculationType: 'GOVERNED_ASPECT_DETECTION',
        executionMode: 'validation',
        utcIso: planetRecord.payload.utcIso,
        timeScale: planetRecord.payload.timeScale,
        referenceFrame: planetRecord.payload.referenceFrame,
        observerMode: planetRecord.payload.observerMode,
        aspectSetCode: policies.aspectSet.aspectSetCode,
        orbPolicyCode: policies.orbPolicy.orbPolicyCode,
        applyingPolicyCode: policies.applyingPolicy.applyingPolicyCode,
        priorityPolicyCode: policies.priorityPolicy.priorityPolicyCode,
        normalizationPolicyCode:
          policies.normalizationPolicy.normalizationPolicyCode,
        evaluatedBodyCount: sortedBodies.length,
        evaluatedPairCount:
          (sortedBodies.length * (sortedBodies.length - 1)) / 2,
        aspects: Object.freeze(aspects),
        lineage: Object.freeze({
          planetRuntimeCode: 'AST_PLANET_RUNTIME',
          planetRuntimeVersion: planetRecord.payload.runtimeVersion,
          planetOutputDigest: planetRecord.payload.outputDigest,
          aspectGovernanceCode: governance.governanceCode,
          aspectGovernanceVersion: governance.governanceVersion,
          aspectGovernanceBaselineCommit: governance.baseline.commit,
          referenceVersions: Object.freeze({ ...references })
        }),
        deterministic: true,
        providerUsed: false,
        aiUsed: false,
        aspectRuntimeCreated: true,
        projectionCreated: false,
        interpretationCreated: false,
        knowledgeCreated: false,
        realityConclusionCreated: false,
        professionalConclusionCreated: false,
        productionEligible: false
      });
    }
  });

  const sharedRuntime = createSharedCalculationRuntime({
    algorithms: [algorithm]
  });

  return Object.freeze({
    runtimeCode: AST_ASPECT_RUNTIME_CODE,
    runtimeVersion: AST_ASPECT_RUNTIME_VERSION,

    async calculate(request) {
      assertObject(request, 'AST Aspect request is required.');
      assertNoForbiddenKeys(request);

      if (request.runtimeCode !== AST_ASPECT_RUNTIME_CODE) {
        throw new TypeError('Invalid AST Aspect runtimeCode.');
      }
      if (request.executionMode !== 'validation') {
        throw new Error('AST_ASPECT_PRODUCTION_EXECUTION_FORBIDDEN');
      }

      return sharedRuntime.execute({
        calculationId: request.calculationId,
        runtimeCode: SHARED_CALCULATION_RUNTIME_CODE,
        methodCode: 'ASTROLOGY',
        pluginCode: 'AST',
        algorithmCode: AST_ASPECT_ALGORITHM_CODE,
        algorithmVersion: AST_ASPECT_ALGORITHM_VERSION,
        inputRecords: request.inputRecords,
        referenceVersions: {
          executionMode: request.executionMode,
          aspectSetCode: request.aspectSetCode,
          orbPolicyCode: request.orbPolicyCode,
          applyingPolicyCode: request.applyingPolicyCode,
          priorityPolicyCode: request.priorityPolicyCode,
          normalizationPolicyCode: request.normalizationPolicyCode,
          aspectGovernanceVersion: governance.governanceVersion,
          ...(request.referenceVersions || {})
        }
      });
    }
  });
}
