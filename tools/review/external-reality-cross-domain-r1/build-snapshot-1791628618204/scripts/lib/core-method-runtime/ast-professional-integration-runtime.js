/**
 * PHI OS AST-W6 Professional Integration.
 *
 * Establishes the only Astrology entry into SHARED_PROFESSIONAL_RUNTIME.
 * Method Governance eligibility and Professional eligibility are independent
 * fail-closed gates. No parallel Astrology review, signature, deliverable or
 * release path is created.
 */
import {
  SHARED_PROFESSIONAL_RUNTIME_CODE
} from '../method-runtime/shared-professional-runtime.js';
import {
  SHARED_INTERPRETATION_RUNTIME_CODE,
  CANONICAL_INTERPRETATION_CANDIDATE_SCHEMA_VERSION
} from '../method-runtime/shared-interpretation-runtime.js';
import { stableSerialize } from '../method-runtime/shared-calculation-runtime.js';

export const AST_PROFESSIONAL_INTEGRATION_RUNTIME_CODE =
  'AST_PROFESSIONAL_INTEGRATION_RUNTIME';
export const AST_PROFESSIONAL_INTEGRATION_RUNTIME_VERSION = '1.0.0';

const AST_PROJECTION_TYPES = new Set(['PLANET', 'HOUSE', 'ASPECT']);
const REQUIRED_METHOD_GATES = Object.freeze([
  'productionReady',
  'professionalReady',
  'validationPassed',
  'regressionPassed',
  'commercialLicensePassed',
  'sharedRuntimeImplemented',
  'professionalBoundaryPassed',
  'professionalWorkflowPassed'
]);
const REQUIRED_CAPABILITY_CODE = 'ASTROLOGY_PROFESSIONAL_REVIEW';
const FORBIDDEN_KEYS = new Set([
  'finalConclusion',
  'realityDecision',
  'realityConclusion',
  'approval',
  'published',
  'publication'
]);

function assertObject(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(message);
  }
}
function assertString(value, message) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(message);
  }
}
function assertNoForbiddenKeys(value, path = '$') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new TypeError(
        `AST-W6 Professional Integration field forbidden at ${path}.${key}`
      );
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}
function assertInterpretationCandidate(candidate) {
  assertObject(candidate, 'AST Interpretation Candidate is required.');
  if (candidate.schemaVersion !== CANONICAL_INTERPRETATION_CANDIDATE_SCHEMA_VERSION ||
      candidate.runtimeCode !== SHARED_INTERPRETATION_RUNTIME_CODE ||
      candidate.candidateStatus !== 'candidate' ||
      candidate.interpretationCreated !== true ||
      candidate.providerUsed !== true ||
      candidate.aiUsed !== true ||
      candidate.finalConclusionCreated !== false ||
      candidate.professionalReportCreated !== false ||
      candidate.realityDecisionCreated !== false ||
      candidate.professionalConclusionCreated !== false) {
    throw new TypeError('AST-W6 requires an unreleased Interpretation Candidate.');
  }
  assertObject(
    candidate.projectionReference,
    'Interpretation Candidate projectionReference is required.'
  );
  if (!AST_PROJECTION_TYPES.has(candidate.projectionReference.projectionType)) {
    throw new TypeError('Interpretation Candidate is not an AST Projection type.');
  }
  assertNoForbiddenKeys(candidate);
}
function assertMethodEligibility(decision) {
  assertObject(decision, 'IMR Method Eligibility decision is required.');
  if (decision.methodCode !== 'ASTROLOGY' ||
      decision.decisionAuthority !== 'INTERPRETIVE_METHOD_GOVERNANCE') {
    throw new TypeError('Invalid Astrology Method Eligibility authority.');
  }
  const failed = REQUIRED_METHOD_GATES.filter(gate => decision[gate] !== true);
  if (failed.length > 0) {
    const reasons = Array.isArray(decision.blockingReasons)
      ? decision.blockingReasons.join(',')
      : failed.join(',');
    throw new Error(`AST_METHOD_NOT_PROFESSIONALLY_ELIGIBLE:${reasons}`);
  }
  if (decision.productionAuthorityCreated === true) {
    throw new TypeError('Method Eligibility cannot create release authority.');
  }
}
function assertProfessionalEligibility(decision, professionalId) {
  assertObject(decision, 'Professional Eligibility decision is required.');
  if (decision.contract !== 'phi-os.professional-eligibility-decision.v1' ||
      decision.eligible !== true ||
      decision.professional_id !== professionalId ||
      !Array.isArray(decision.required_capability_codes) ||
      !decision.required_capability_codes.includes(REQUIRED_CAPABILITY_CODE) ||
      !Array.isArray(decision.missing_capability_codes) ||
      decision.missing_capability_codes.length !== 0) {
    throw new Error('AST_PROFESSIONAL_NOT_ELIGIBLE');
  }
}
function assertWorkspaceContext(context, professionalId) {
  assertObject(context, 'Professional Workspace context is required.');
  if (context.professionalId !== professionalId ||
      context.assignmentStatus !== 'active' ||
      context.consentStatus !== 'active' ||
      context.boundaryAcknowledged !== true ||
      context.workspaceAccessGranted !== true) {
    throw new Error('AST_PROFESSIONAL_WORKSPACE_GATE_FAILED');
  }
  for (const key of ['assignmentId','consentId','workspaceId','boundaryVersion']) {
    assertString(context[key], `Professional Workspace ${key} is required.`);
  }
}
function assertRuntime(runtime) {
  if (!runtime || typeof runtime !== 'object' ||
      runtime.runtimeCode !== SHARED_PROFESSIONAL_RUNTIME_CODE ||
      typeof runtime.process !== 'function') {
    throw new TypeError('SHARED_PROFESSIONAL_RUNTIME is required.');
  }
}

export function createAstProfessionalIntegrationRuntime({
  sharedProfessionalRuntime,
  methodEligibilityResolver,
  professionalEligibilityResolver
} = {}) {
  assertRuntime(sharedProfessionalRuntime);
  if (typeof methodEligibilityResolver !== 'function') {
    throw new TypeError('Method Eligibility resolver is required.');
  }
  if (typeof professionalEligibilityResolver !== 'function') {
    throw new TypeError('Professional Eligibility resolver is required.');
  }

  return Object.freeze({
    runtimeCode: AST_PROFESSIONAL_INTEGRATION_RUNTIME_CODE,
    runtimeVersion: AST_PROFESSIONAL_INTEGRATION_RUNTIME_VERSION,

    async release(request) {
      assertObject(request, 'AST Professional Integration request is required.');
      assertNoForbiddenKeys(request);
      if (request.runtimeCode !== AST_PROFESSIONAL_INTEGRATION_RUNTIME_CODE) {
        throw new TypeError('Invalid AST Professional Integration runtimeCode.');
      }
      assertString(request.professionalId, 'professionalId is required.');
      assertString(request.deliverableTypeCode, 'deliverableTypeCode is required.');
      assertString(request.releaseVersion, 'releaseVersion is required.');
      assertInterpretationCandidate(request.interpretationCandidate);
      assertWorkspaceContext(request.professionalContext, request.professionalId);

      const candidateSnapshot = stableSerialize(request.interpretationCandidate);

      const methodEligibility = await methodEligibilityResolver({
        methodCode: 'ASTROLOGY',
        methodVersion: request.methodVersion
      });
      assertMethodEligibility(methodEligibility);

      const professionalEligibility = await professionalEligibilityResolver({
        professionalId: request.professionalId,
        requiredCapabilityCodes: [REQUIRED_CAPABILITY_CODE],
        methodCode: 'ASTROLOGY'
      });
      assertProfessionalEligibility(professionalEligibility, request.professionalId);

      const released = await sharedProfessionalRuntime.process({
        runtimeCode: SHARED_PROFESSIONAL_RUNTIME_CODE,
        methodCode: 'ASTROLOGY',
        pluginCode: 'AST',
        deliverableTypeCode: request.deliverableTypeCode,
        professionalId: request.professionalId,
        interpretationCandidate: request.interpretationCandidate,
        releaseVersion: request.releaseVersion
      });

      if (stableSerialize(request.interpretationCandidate) !== candidateSnapshot) {
        throw new Error('AST_INTERPRETATION_CANDIDATE_MUTATION_FORBIDDEN');
      }
      if (released.runtimeCode !== SHARED_PROFESSIONAL_RUNTIME_CODE ||
          released.methodReference?.methodCode !== 'ASTROLOGY' ||
          released.methodReference?.pluginCode !== 'AST' ||
          released.releaseStatus !== 'released' ||
          released.professionalReviewCompleted !== true ||
          released.boundaryValidationCompleted !== true ||
          released.deliverableAssemblyCompleted !== true ||
          released.professionalSignatureCompleted !== true ||
          released.released !== true) {
        throw new Error('AST_SHARED_PROFESSIONAL_RELEASE_INVALID');
      }

      return Object.freeze({
        runtimeCode: AST_PROFESSIONAL_INTEGRATION_RUNTIME_CODE,
        runtimeVersion: AST_PROFESSIONAL_INTEGRATION_RUNTIME_VERSION,
        methodCode: 'ASTROLOGY',
        pluginCode: 'AST',
        integrationStatus: 'released_through_shared_professional_runtime',
        methodEligibilityVersion: methodEligibility.eligibilityVersion,
        professionalEligibilityContract: professionalEligibility.contract,
        workspaceLineage: Object.freeze({
          assignmentId: request.professionalContext.assignmentId,
          consentId: request.professionalContext.consentId,
          workspaceId: request.professionalContext.workspaceId,
          boundaryVersion: request.professionalContext.boundaryVersion
        }),
        professionalRelease: released,
        parallelProfessionalRuntimeCreated: false,
        sharedProfessionalRuntimeUsed: true
      });
    }
  });
}
