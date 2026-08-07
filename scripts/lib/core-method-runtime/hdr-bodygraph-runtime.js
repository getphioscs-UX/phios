/**
 * PHI OS HDR-W4 BodyGraph Runtime.
 *
 * Resolves a governed HDR-W3 Gate/Line result into structural BodyGraph facts
 * through a versioned adapter. No channel, center, Type, Authority, Profile or
 * definition table is embedded in this Runtime.
 */
import {
  createSharedCalculationRuntime,
  SHARED_CALCULATION_RUNTIME_CODE
} from '../method-runtime/shared-calculation-runtime.js';

export const HDR_BODYGRAPH_RUNTIME_CODE = 'HDR_BODYGRAPH_RUNTIME';
export const HDR_BODYGRAPH_RUNTIME_VERSION = '1.0.0';
export const HDR_BODYGRAPH_ALGORITHM_CODE = 'HDR_BODYGRAPH_STRUCTURE_RESOLUTION';
export const HDR_BODYGRAPH_ALGORITHM_VERSION = '1.0.0';
export const HDR_BODYGRAPH_RESULT_SCHEMA_VERSION =
  'PHI-OS-HDR-BODYGRAPH-RESULT-v1.0.0';

const CENTER_CODES = Object.freeze([
  'HEAD',
  'AJNA',
  'THROAT',
  'G',
  'EGO',
  'SACRAL',
  'SPLEEN',
  'SOLAR_PLEXUS',
  'ROOT'
]);

const TYPE_CODES = Object.freeze([
  'GENERATOR',
  'MANIFESTING_GENERATOR',
  'PROJECTOR',
  'MANIFESTOR',
  'REFLECTOR'
]);

const AUTHORITY_CODES = Object.freeze([
  'EMOTIONAL',
  'SACRAL',
  'SPLENIC',
  'EGO_MANIFESTED',
  'EGO_PROJECTED',
  'SELF_PROJECTED',
  'MENTAL',
  'LUNAR'
]);

const DEFINITION_CODES = Object.freeze([
  'NO_DEFINITION',
  'SINGLE',
  'SPLIT',
  'TRIPLE_SPLIT',
  'QUADRUPLE_SPLIT'
]);

const FORBIDDEN_KEYS = new Set([
  'projection',
  'interpretation',
  'professionalConclusion',
  'professionalReport',
  'realityDecision',
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
      throw new TypeError(`HDR-W4 BodyGraph boundary forbidden at ${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}

function findGateRecord(records) {
  return records.find(record => record.recordType === 'HDR_GATE_RESULT');
}

function assertGateRecord(record) {
  if (!record) throw new TypeError('HDR_GATE_RESULT record is required.');
  assertObject(record.payload, 'HDR Gate payload is required.');

  if (record.payload.runtimeCode !== 'HDR_GATE_RUNTIME' ||
      record.payload.runtimeVersion !== '1.0.0' ||
      record.payload.executionMode !== 'validation' ||
      record.payload.deterministic !== true ||
      record.payload.providerUsed !== false ||
      record.payload.aiUsed !== false ||
      record.payload.gateMappingCreated !== true ||
      record.payload.channelCreated !== false ||
      record.payload.centerCreated !== false ||
      record.payload.bodyGraphCreated !== false ||
      record.payload.projectionCreated !== false ||
      record.payload.interpretationCreated !== false ||
      record.payload.professionalConclusionCreated !== false ||
      record.payload.productionEligible !== false) {
    throw new TypeError('HDR-W3 Gate Result boundary is invalid.');
  }

  if (!Array.isArray(record.payload.activations) ||
      record.payload.activations.length !== 26) {
    throw new TypeError('HDR Gate Result requires 26 activations.');
  }

  const identities = new Set();
  for (const activation of record.payload.activations) {
    assertObject(activation, 'HDR Gate activation is invalid.');
    if (!['PERSONALITY', 'DESIGN'].includes(activation.layer) ||
        typeof activation.bodyCode !== 'string' ||
        !Number.isInteger(activation.gate) ||
        activation.gate < 1 ||
        activation.gate > 64 ||
        !Number.isInteger(activation.line) ||
        activation.line < 1 ||
        activation.line > 6) {
      throw new TypeError('HDR Gate activation boundary is invalid.');
    }
    const identity = `${activation.layer}:${activation.bodyCode}`;
    if (identities.has(identity)) {
      throw new TypeError(`Duplicate HDR Gate activation: ${identity}.`);
    }
    identities.add(identity);
  }
}

function assertAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object' ||
      typeof adapter.adapterCode !== 'string' ||
      typeof adapter.adapterVersion !== 'string' ||
      typeof adapter.structureVersion !== 'string' ||
      typeof adapter.sourceAuthorityCode !== 'string' ||
      typeof adapter.licenseStatus !== 'string' ||
      typeof adapter.resolveBodyGraph !== 'function') {
    throw new TypeError('Governed BodyGraph adapter is incomplete.');
  }
  if (adapter.aiUsed === true || adapter.providerUsed === true) {
    throw new TypeError('AI or Provider BodyGraph resolution is forbidden.');
  }
  if (!['restricted', 'approved'].includes(adapter.licenseStatus)) {
    throw new TypeError('BodyGraph license status is not governed.');
  }
}

function normalizeGatePair(value, label) {
  if (!Array.isArray(value) ||
      value.length !== 2 ||
      !value.every(gate => Number.isInteger(gate) && gate >= 1 && gate <= 64) ||
      value[0] === value[1]) {
    throw new TypeError(`Invalid channel gate pair: ${label}.`);
  }
  return Object.freeze([...value].sort((a, b) => a - b));
}

function normalizeChannel(channel, index) {
  assertObject(channel, `Invalid channel at index ${index}.`);
  if (typeof channel.channelCode !== 'string' || channel.channelCode === '') {
    throw new TypeError(`Channel code is required at index ${index}.`);
  }
  const gates = normalizeGatePair(channel.gates, channel.channelCode);
  if (!Array.isArray(channel.centers) ||
      channel.centers.length !== 2 ||
      !channel.centers.every(center => CENTER_CODES.includes(center)) ||
      channel.centers[0] === channel.centers[1]) {
    throw new TypeError(`Invalid channel centers: ${channel.channelCode}.`);
  }
  return Object.freeze({
    channelCode: channel.channelCode,
    gates,
    centers: Object.freeze([...channel.centers]),
    activationLayers: Object.freeze(
      [...new Set(channel.activationLayers || [])].sort()
    )
  });
}

function normalizeProfile(profile) {
  assertObject(profile, 'BodyGraph Profile is required.');
  if (!Number.isInteger(profile.personalityLine) ||
      profile.personalityLine < 1 ||
      profile.personalityLine > 6 ||
      !Number.isInteger(profile.designLine) ||
      profile.designLine < 1 ||
      profile.designLine > 6) {
    throw new TypeError('BodyGraph Profile lines must be 1–6.');
  }
  return Object.freeze({
    personalityLine: profile.personalityLine,
    designLine: profile.designLine,
    profileCode: `${profile.personalityLine}/${profile.designLine}`
  });
}

function normalizeBodyGraph(result) {
  assertObject(result, 'BodyGraph adapter result is required.');
  assertNoForbiddenKeys(result);

  if (!Array.isArray(result.channels)) {
    throw new TypeError('BodyGraph channels are required.');
  }
  const channels = result.channels
    .map(normalizeChannel)
    .sort((a, b) => a.channelCode.localeCompare(b.channelCode));
  if (new Set(channels.map(channel => channel.channelCode)).size !== channels.length) {
    throw new TypeError('Duplicate BodyGraph channelCode.');
  }

  if (!Array.isArray(result.definedCenters) ||
      !result.definedCenters.every(center => CENTER_CODES.includes(center))) {
    throw new TypeError('BodyGraph definedCenters are invalid.');
  }
  const definedCenters = [...new Set(result.definedCenters)].sort();
  if (definedCenters.length !== result.definedCenters.length) {
    throw new TypeError('Duplicate BodyGraph defined center.');
  }
  const undefinedCenters = CENTER_CODES
    .filter(center => !definedCenters.includes(center))
    .sort();

  if (!TYPE_CODES.includes(result.typeCode)) {
    throw new TypeError('BodyGraph Type is invalid.');
  }
  if (!AUTHORITY_CODES.includes(result.humanDesignAuthorityCode)) {
    throw new TypeError('BodyGraph Authority is invalid.');
  }
  if (!DEFINITION_CODES.includes(result.definitionCode)) {
    throw new TypeError('BodyGraph Definition is invalid.');
  }

  return Object.freeze({
    channels: Object.freeze(channels),
    definedCenters: Object.freeze(definedCenters),
    undefinedCenters: Object.freeze(undefinedCenters),
    typeCode: result.typeCode,
    humanDesignAuthorityCode: result.humanDesignAuthorityCode,
    profile: normalizeProfile(result.profile),
    definitionCode: result.definitionCode
  });
}

export function createHdrBodyGraphRuntime({ bodyGraphAdapter } = {}) {
  assertAdapter(bodyGraphAdapter);

  const algorithm = Object.freeze({
    algorithmCode: HDR_BODYGRAPH_ALGORITHM_CODE,
    algorithmVersion: HDR_BODYGRAPH_ALGORITHM_VERSION,

    async calculate(records, context) {
      if (context.referenceVersions.executionMode !== 'validation') {
        throw new Error('HDR_BODYGRAPH_PRODUCTION_EXECUTION_FORBIDDEN');
      }

      const gateRecord = findGateRecord(records);
      assertGateRecord(gateRecord);

      const adapterResult = await bodyGraphAdapter.resolveBodyGraph({
        activations: structuredClone(gateRecord.payload.activations),
        structureVersion: bodyGraphAdapter.structureVersion,
        executionMode: 'validation'
      });

      const bodyGraph = normalizeBodyGraph(adapterResult);

      return Object.freeze({
        schemaVersion: HDR_BODYGRAPH_RESULT_SCHEMA_VERSION,
        runtimeCode: HDR_BODYGRAPH_RUNTIME_CODE,
        runtimeVersion: HDR_BODYGRAPH_RUNTIME_VERSION,
        methodCode: 'HUMAN_DESIGN',
        pluginCode: 'HDR',
        calculationType: 'BODYGRAPH_STRUCTURE_RESOLUTION',
        executionMode: 'validation',
        activations: Object.freeze(
          structuredClone(gateRecord.payload.activations)
        ),
        channels: bodyGraph.channels,
        definedCenters: bodyGraph.definedCenters,
        undefinedCenters: bodyGraph.undefinedCenters,
        typeCode: bodyGraph.typeCode,
        humanDesignAuthorityCode: bodyGraph.humanDesignAuthorityCode,
        profile: bodyGraph.profile,
        definitionCode: bodyGraph.definitionCode,
        lineage: Object.freeze({
          gateRuntimeCode: 'HDR_GATE_RUNTIME',
          gateRuntimeVersion: gateRecord.payload.runtimeVersion,
          gateOutputDigest: gateRecord.payload.outputDigest,
          adapterCode: bodyGraphAdapter.adapterCode,
          adapterVersion: bodyGraphAdapter.adapterVersion,
          structureVersion: bodyGraphAdapter.structureVersion,
          sourceAuthorityCode: bodyGraphAdapter.sourceAuthorityCode,
          licenseStatus: bodyGraphAdapter.licenseStatus,
          referenceVersions: Object.freeze({
            ...(context.referenceVersions || {})
          })
        }),
        deterministic: true,
        providerUsed: false,
        aiUsed: false,
        bodyGraphCreated: true,
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
    runtimeCode: HDR_BODYGRAPH_RUNTIME_CODE,
    runtimeVersion: HDR_BODYGRAPH_RUNTIME_VERSION,

    async resolve(request) {
      assertObject(request, 'HDR BodyGraph request is required.');
      assertNoForbiddenKeys(request);
      if (request.runtimeCode !== HDR_BODYGRAPH_RUNTIME_CODE) {
        throw new TypeError('Invalid HDR BodyGraph runtimeCode.');
      }
      if (request.executionMode !== 'validation') {
        throw new Error('HDR_BODYGRAPH_PRODUCTION_EXECUTION_FORBIDDEN');
      }

      return sharedRuntime.execute({
        calculationId: request.calculationId,
        runtimeCode: SHARED_CALCULATION_RUNTIME_CODE,
        methodCode: 'HUMAN_DESIGN',
        pluginCode: 'HDR',
        algorithmCode: HDR_BODYGRAPH_ALGORITHM_CODE,
        algorithmVersion: HDR_BODYGRAPH_ALGORITHM_VERSION,
        inputRecords: request.inputRecords,
        referenceVersions: {
          executionMode: request.executionMode,
          bodyGraphAdapter: bodyGraphAdapter.adapterVersion,
          structureVersion: bodyGraphAdapter.structureVersion,
          sourceAuthorityCode: bodyGraphAdapter.sourceAuthorityCode,
          licenseStatus: bodyGraphAdapter.licenseStatus,
          ...(request.referenceVersions || {})
        }
      });
    }
  });
}
