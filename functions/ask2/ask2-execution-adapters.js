import { validateRuntimeExecutionResult } from './ask2-orchestrator.js';

export const ASK2_ADAPTER_RESULT_SCHEMA = 'PHI-OS-ASK2-EXECUTION-ADAPTER-RESULT-v1.0.0';

const ENDPOINTS = Object.freeze({
  'AST.NATAL': '/api/ast-structural-execute',
  'AST.CURRENT_DYNAMIC': '/api/ast-transit-execute',
  'BZR.TEMPORAL': '/api/bzr-temporal-execute',
  'ZWR.NATAL': '/api/zi-wei-execute',
  'ZWR.DYNAMIC_DOMAIN': '/api/zi-wei-dynamic-execute',
  'NUM': '/api/method-execute'
});

function fail(code, status = 422) {
  const error = new Error(code);
  error.code = code;
  error.status = status;
  throw error;
}

function normalizePrecomputed(result, request) {
  return validateRuntimeExecutionResult({ ...result, requestId: request.requestId }, request);
}

function endpointFor(routeKey) {
  return ENDPOINTS[routeKey] || null;
}

async function executeEndpoint(request, input, { requestUrl, fetcher = fetch } = {}) {
  const endpoint = endpointFor(request.routeKey);
  if (!endpoint) return { state: 'PRECOMPUTED_RESULT_REQUIRED', requestId: request.requestId, routeKey: request.routeKey };
  if (!input || typeof input !== 'object') return { state: 'INPUT_REQUIRED', requestId: request.requestId, routeKey: request.routeKey, endpoint };
  if (!requestUrl) fail('ASK2_REQUEST_URL_REQUIRED_FOR_ENDPOINT_EXECUTION', 500);
  const target = new URL(endpoint, requestUrl);
  const response = await fetcher(target, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-phios-ask2-runtime-dispatch': '1'
    },
    cache: 'no-store',
    body: JSON.stringify(input)
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    return {
      state: 'RUNTIME_EXECUTION_REJECTED',
      requestId: request.requestId,
      routeKey: request.routeKey,
      endpoint,
      errorCode: payload?.error?.code || payload?.error || 'ASK2_BOUND_RUNTIME_EXECUTION_FAILED'
    };
  }
  const readingIr = payload.result ?? payload.projection ?? payload;
  const schemaVersion = String(readingIr?.schemaVersion || payload?.schemaVersion || ASK2_ADAPTER_RESULT_SCHEMA);
  const governed = {
    requestId: request.requestId,
    origin: request.originRequired,
    sourceArtifactId: `API:${endpoint}:${request.requestId}`,
    sourceSchemaVersion: schemaVersion,
    readingIr,
    modelGeneratedCalculation: false
  };
  return { state: 'EXECUTED', endpoint, result: validateRuntimeExecutionResult(governed, request) };
}

export async function executeAsk2RuntimeRequests(plan, {
  runtimeInputs = {},
  runtimeResults = {},
  requestUrl,
  fetcher = fetch
} = {}) {
  const requests = Array.isArray(plan?.executionRequests) ? plan.executionRequests : [];
  const records = [];
  for (const request of requests) {
    const precomputed = runtimeResults?.[request.requestId] || runtimeResults?.[request.routeKey];
    if (precomputed) {
      records.push({ state: 'PRECOMPUTED_ACCEPTED', requestId: request.requestId, routeKey: request.routeKey, result: normalizePrecomputed(precomputed, request) });
      continue;
    }
    records.push(await executeEndpoint(request, runtimeInputs?.[request.requestId] || runtimeInputs?.[request.routeKey], { requestUrl, fetcher }));
  }
  const governedResults = records.filter(record => record.result).map(record => record.result);
  const pending = records.filter(record => !record.result);
  return Object.freeze({
    schemaVersion: 'PHI-OS-ASK2-EXECUTION-BATCH-v1.0.0',
    executionState: pending.length ? 'INPUT_OR_GOVERNED_RESULT_REQUIRED' : 'EXECUTION_COMPLETE',
    records: Object.freeze(records),
    governedResults: Object.freeze(governedResults),
    pending: Object.freeze(pending),
    boundaries: Object.freeze({ modelMayExecuteRuntime: false, modelMayCalculate: false, endpointBindingIsGoverned: true })
  });
}
