/** PHI OS MR-W5 Shared Interpretation Runtime. */
import { stableSerialize, sha256 } from './shared-calculation-runtime.js';
import {
  SHARED_PROJECTION_RUNTIME_CODE,
  CANONICAL_PROJECTION_SCHEMA_VERSION
} from './shared-projection-runtime.js';

export const SHARED_INTERPRETATION_RUNTIME_CODE = 'SHARED_INTERPRETATION_RUNTIME';
export const SHARED_INTERPRETATION_RUNTIME_VERSION = '1.0.0';
export const CANONICAL_INTERPRETATION_CANDIDATE_SCHEMA_VERSION =
  'PHI-OS-CANONICAL-INTERPRETATION-CANDIDATE-v1.0.0';

const ALLOWED_PROVIDERS = new Set(['WORKERS_AI', 'OPENAI']);
const FORBIDDEN_KEYS = new Set([
  'finalConclusion', 'conclusion', 'professionalConclusion',
  'professionalReport', 'realityDecision', 'realityConclusion',
  'approval', 'approved', 'publication', 'published'
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
      throw new TypeError(`Interpretation Candidate field forbidden at ${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}

function assertProjection(projection) {
  assertObject(projection, 'Canonical Projection is required.');
  if (projection.schemaVersion !== CANONICAL_PROJECTION_SCHEMA_VERSION) {
    throw new TypeError('MR-W5 requires Canonical Projection v1.');
  }
  if (projection.deterministic !== true || projection.providerUsed !== false ||
      projection.aiUsed !== false || projection.interpretationCreated !== false ||
      projection.knowledgeCreated !== false ||
      projection.realityConclusionCreated !== false ||
      projection.professionalConclusionCreated !== false) {
    throw new TypeError('Projection boundary is invalid.');
  }
  for (const key of [
    'projectionType', 'projectionCode', 'projectionVersion',
    'projectionValue', 'projectionSource', 'projectionConfidence'
  ]) {
    if (!Object.hasOwn(projection, key)) {
      throw new TypeError(`Projection field missing: ${key}.`);
    }
  }
  assertNoForbiddenKeys(projection);
}

function assertLookupResult(result) {
  assertObject(result, 'Knowledge Lookup result is required.');
  if (!Array.isArray(result.matches)) {
    throw new TypeError('Knowledge Lookup matches must be an array.');
  }
  if (result.publishedOnly !== true || result.registryLed !== true) {
    throw new TypeError('Knowledge Lookup must be registry-led and published-only.');
  }
  if (typeof result.lookupCode !== 'string' || typeof result.lookupVersion !== 'string' ||
      typeof result.queryDigest !== 'string' || typeof result.resultDigest !== 'string') {
    throw new TypeError('Knowledge Lookup lineage is incomplete.');
  }
  assertNoForbiddenKeys(result);
}

function assertJourneyContext(context) {
  assertObject(context, 'Journey Runtime context is required.');
  if (typeof context.journeyRuntimeCode !== 'string' ||
      typeof context.journeyRuntimeVersion !== 'string' ||
      typeof context.journeyId !== 'string' ||
      typeof context.contextDigest !== 'string') {
    throw new TypeError('Journey Runtime lineage is incomplete.');
  }
  if (context.finalConclusionCreated === true ||
      context.professionalReportCreated === true ||
      context.realityDecisionCreated === true) {
    throw new TypeError('Journey Runtime supplied forbidden final authority.');
  }
  assertNoForbiddenKeys(context);
}

function assertProvider(provider) {
  if (!provider || !ALLOWED_PROVIDERS.has(provider.providerCode) ||
      typeof provider.providerVersion !== 'string' ||
      typeof provider.interpret !== 'function') {
    throw new TypeError('Provider must be governed WORKERS_AI or OPENAI.');
  }
}

export function createSharedInterpretationRuntime({
  knowledgeLookup,
  journeyRuntime,
  providers = []
} = {}) {
  if (typeof knowledgeLookup !== 'function') {
    throw new TypeError('Knowledge Lookup adapter is required.');
  }
  if (typeof journeyRuntime !== 'function') {
    throw new TypeError('Journey Runtime adapter is required.');
  }
  const registry = new Map();
  for (const provider of providers) {
    assertProvider(provider);
    if (registry.has(provider.providerCode)) {
      throw new TypeError(`Duplicate interpretation provider: ${provider.providerCode}`);
    }
    registry.set(provider.providerCode, Object.freeze({ ...provider }));
  }

  return Object.freeze({
    listProviders() {
      return [...registry.values()].map(({ interpret, ...metadata }) => metadata);
    },

    async interpret(request) {
      assertObject(request, 'Interpretation request is required.');
      assertNoForbiddenKeys(request);
      if (request.runtimeCode !== SHARED_INTERPRETATION_RUNTIME_CODE) {
        throw new TypeError('Invalid interpretation runtimeCode.');
      }
      assertProjection(request.projection);
      const provider = registry.get(request.providerCode);
      if (!provider) throw new TypeError(`Unknown governed provider: ${request.providerCode}`);

      const projectionSnapshot = stableSerialize(request.projection);
      const lookupQuery = Object.freeze({
        projectionType: request.projection.projectionType,
        projectionCode: request.projection.projectionCode,
        projectionValue: structuredClone(request.projection.projectionValue),
        locale: request.locale
      });
      const knowledge = await knowledgeLookup(lookupQuery);
      assertLookupResult(knowledge);
      const journey = await journeyRuntime({
        journeyId: request.journeyId,
        projectionCode: request.projection.projectionCode,
        locale: request.locale
      });
      assertJourneyContext(journey);

      const providerInput = Object.freeze({
        projection: structuredClone(request.projection),
        knowledge: structuredClone(knowledge),
        journey: structuredClone(journey),
        locale: request.locale
      });
      const providerOutput = await provider.interpret(providerInput);
      assertObject(providerOutput, 'Provider must return an interpretation object.');
      assertNoForbiddenKeys(providerOutput);
      if (typeof providerOutput.summary !== 'string' || providerOutput.summary.trim() === '') {
        throw new TypeError('Interpretation Candidate summary is required.');
      }
      if (!Array.isArray(providerOutput.observations) ||
          !Array.isArray(providerOutput.knowledgeReferences) ||
          !Array.isArray(providerOutput.limitations)) {
        throw new TypeError('Interpretation Candidate arrays are required.');
      }

      const providerOutputDigest = await sha256(providerOutput);
      const candidateCode = `INT-${(await sha256({
        projectionCode: request.projection.projectionCode,
        knowledgeResultDigest: knowledge.resultDigest,
        journeyContextDigest: journey.contextDigest,
        providerCode: provider.providerCode,
        providerVersion: provider.providerVersion,
        providerOutputDigest
      })).slice(0, 24).toUpperCase()}`;

      const candidate = Object.freeze({
        schemaVersion: CANONICAL_INTERPRETATION_CANDIDATE_SCHEMA_VERSION,
        runtimeCode: SHARED_INTERPRETATION_RUNTIME_CODE,
        runtimeVersion: SHARED_INTERPRETATION_RUNTIME_VERSION,
        candidateCode,
        candidateVersion: request.candidateVersion,
        candidateStatus: 'candidate',
        locale: request.locale,
        projectionReference: Object.freeze({
          runtimeCode: SHARED_PROJECTION_RUNTIME_CODE,
          projectionCode: request.projection.projectionCode,
          projectionVersion: request.projection.projectionVersion,
          projectionType: request.projection.projectionType
        }),
        knowledgeLineage: Object.freeze({
          lookupCode: knowledge.lookupCode,
          lookupVersion: knowledge.lookupVersion,
          queryDigest: knowledge.queryDigest,
          resultDigest: knowledge.resultDigest,
          publishedOnly: true,
          registryLed: true
        }),
        journeyLineage: Object.freeze({
          journeyRuntimeCode: journey.journeyRuntimeCode,
          journeyRuntimeVersion: journey.journeyRuntimeVersion,
          journeyId: journey.journeyId,
          contextDigest: journey.contextDigest
        }),
        providerLineage: Object.freeze({
          providerCode: provider.providerCode,
          providerVersion: provider.providerVersion,
          providerOutputDigest
        }),
        interpretation: Object.freeze({
          summary: providerOutput.summary,
          observations: structuredClone(providerOutput.observations),
          knowledgeReferences: structuredClone(providerOutput.knowledgeReferences),
          limitations: structuredClone(providerOutput.limitations)
        }),
        providerUsed: true,
        aiUsed: true,
        interpretationCreated: true,
        finalConclusionCreated: false,
        professionalReportCreated: false,
        realityDecisionCreated: false,
        professionalConclusionCreated: false
      });

      if (stableSerialize(request.projection) !== projectionSnapshot) {
        throw new Error('PROJECTION_MUTATION_FORBIDDEN');
      }
      return candidate;
    }
  });
}
