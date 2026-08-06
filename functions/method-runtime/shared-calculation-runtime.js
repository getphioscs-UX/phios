/** PHI OS MR-W3 Shared Calculation Runtime. */
const FORBIDDEN_KEYS = new Set([
  'prompt', 'provider', 'providerId', 'openai', 'workersAI',
  'interpretation', 'professionalConclusion'
]);

export const SHARED_CALCULATION_RUNTIME_VERSION = '1.0.0';
export const SHARED_CALCULATION_RUNTIME_CODE = 'SHARED_CALCULATION_RUNTIME';

export function stableSerialize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  return `{${Object.keys(value).sort().map(key =>
    `${JSON.stringify(key)}:${stableSerialize(value[key])}`
  ).join(',')}}`;
}

export async function sha256(value) {
  const bytes = new TextEncoder().encode(
    typeof value === 'string' ? value : stableSerialize(value)
  );
  const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)]
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function assertNoForbiddenKeys(value, path = '$') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new TypeError(`Provider/Interpretation field forbidden at ${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}

function assertRecord(record) {
  if (!record || record.authority !== 'SHARED_DATA_AUTHORITY') {
    throw new TypeError('Calculation input must reference Shared Data Authority records.');
  }
  if (!['verified', 'draft'].includes(record.status)) {
    throw new TypeError(`Shared data record is not calculable: ${record.recordId}`);
  }
  if (record.methodOwner !== null || record.pluginOwner !== null) {
    throw new TypeError('Method-owned or Plugin-owned shared data is forbidden.');
  }
}

export function createSharedCalculationRuntime({ algorithms = [] } = {}) {
  const registry = new Map();
  for (const algorithm of algorithms) {
    if (!algorithm?.algorithmCode || !algorithm?.algorithmVersion ||
        typeof algorithm.calculate !== 'function') {
      throw new TypeError('Algorithm requires code, version and calculate function.');
    }
    const identity = `${algorithm.algorithmCode}@${algorithm.algorithmVersion}`;
    if (registry.has(identity)) throw new TypeError(`Duplicate algorithm: ${identity}`);
    registry.set(identity, Object.freeze({ ...algorithm }));
  }

  return Object.freeze({
    listAlgorithms() {
      return [...registry.values()].map(({ calculate, ...metadata }) => metadata);
    },

    async execute(request) {
      assertNoForbiddenKeys(request);
      if (request?.runtimeCode !== SHARED_CALCULATION_RUNTIME_CODE) {
        throw new TypeError('Invalid calculation runtimeCode.');
      }
      const identity = `${request.algorithmCode}@${request.algorithmVersion}`;
      const algorithm = registry.get(identity);
      if (!algorithm) throw new TypeError(`Unknown governed algorithm: ${identity}`);
      const records = request.inputRecords || [];
      if (records.length === 0) throw new TypeError('Calculation requires input records.');
      records.forEach(assertRecord);
      const canonicalInput = records.map(record => ({
        recordId: record.recordId,
        recordType: record.recordType,
        recordVersion: record.recordVersion,
        payload: record.payload
      }));
      const inputDigest = await sha256(canonicalInput);
      const context = Object.freeze({
        algorithmCode: algorithm.algorithmCode,
        algorithmVersion: algorithm.algorithmVersion,
        referenceVersions: Object.freeze({ ...(request.referenceVersions || {}) })
      });
      const first = await algorithm.calculate(structuredClone(canonicalInput), context);
      const second = await algorithm.calculate(structuredClone(canonicalInput), context);
      assertNoForbiddenKeys(first);
      assertNoForbiddenKeys(second);
      if (stableSerialize(first) !== stableSerialize(second)) {
        throw new Error(`NON_DETERMINISTIC_CALCULATION:${identity}`);
      }
      return Object.freeze({
        schemaVersion: 'PHI-OS-SHARED-CALCULATION-RESULT-v1.0.0',
        calculationId: request.calculationId,
        runtimeCode: SHARED_CALCULATION_RUNTIME_CODE,
        runtimeVersion: SHARED_CALCULATION_RUNTIME_VERSION,
        methodCode: request.methodCode,
        pluginCode: request.pluginCode,
        algorithmCode: algorithm.algorithmCode,
        algorithmVersion: algorithm.algorithmVersion,
        inputRecordIds: Object.freeze(records.map(record => record.recordId)),
        inputDigest,
        referenceVersions: Object.freeze({ ...(request.referenceVersions || {}) }),
        deterministic: true,
        aiUsed: false,
        providerUsed: false,
        output: Object.freeze(first),
        outputDigest: await sha256(first),
        projectionCreated: false,
        interpretationCreated: false,
        professionalConclusionCreated: false
      });
    }
  });
}
