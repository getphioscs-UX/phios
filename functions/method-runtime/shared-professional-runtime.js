/**
 * PHI OS MR-W6 Shared Professional Runtime.
 *
 * The single governed route from an MR-W5 Interpretation Candidate to a
 * professionally reviewed, boundary-valid, signed and released deliverable.
 */
import { stableSerialize, sha256 } from './shared-calculation-runtime.js';
import {
  SHARED_INTERPRETATION_RUNTIME_CODE,
  CANONICAL_INTERPRETATION_CANDIDATE_SCHEMA_VERSION
} from './shared-interpretation-runtime.js';

export const SHARED_PROFESSIONAL_RUNTIME_CODE = 'SHARED_PROFESSIONAL_RUNTIME';
export const SHARED_PROFESSIONAL_RUNTIME_VERSION = '1.0.0';
export const CANONICAL_PROFESSIONAL_RELEASE_SCHEMA_VERSION =
  'PHI-OS-CANONICAL-PROFESSIONAL-RELEASE-v1.0.0';

const REQUIRED_SEQUENCE = Object.freeze([
  'PROFESSIONAL_REVIEW',
  'BOUNDARY_VALIDATION',
  'DELIVERABLE_ASSEMBLY',
  'PROFESSIONAL_SIGNATURE',
  'RELEASE'
]);

const FORBIDDEN_INPUT_KEYS = new Set([
  'released', 'releaseStatus', 'professionalSignature',
  'professionalConclusion', 'finalConclusion', 'realityDecision'
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

function assertNoPrematureAuthority(value, path = '$') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_INPUT_KEYS.has(key)) {
      throw new TypeError(`Premature professional authority forbidden at ${path}.${key}`);
    }
    assertNoPrematureAuthority(child, `${path}.${key}`);
  }
}

function assertInterpretationCandidate(candidate) {
  assertObject(candidate, 'Interpretation Candidate is required.');
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
    throw new TypeError('MR-W6 requires an unreleased MR-W5 Interpretation Candidate.');
  }
  for (const key of [
    'candidateCode', 'candidateVersion', 'projectionReference',
    'knowledgeLineage', 'journeyLineage', 'providerLineage', 'interpretation'
  ]) {
    if (!Object.hasOwn(candidate, key)) {
      throw new TypeError(`Interpretation Candidate field missing: ${key}.`);
    }
  }
  assertNoPrematureAuthority(candidate);
}

function assertAdapter(adapter, name) {
  if (!adapter || typeof adapter !== 'object' ||
      typeof adapter.code !== 'string' ||
      typeof adapter.version !== 'string' ||
      typeof adapter.execute !== 'function') {
    throw new TypeError(`${name} adapter is incomplete.`);
  }
}

function assertPassed(result, stage) {
  assertObject(result, `${stage} result is required.`);
  if (result.passed !== true) {
    const reason = typeof result.reason === 'string' ? result.reason : 'unspecified';
    throw new Error(`${stage}_FAILED:${reason}`);
  }
}

export function createSharedProfessionalRuntime({
  professionalReview,
  boundaryValidation,
  deliverableAssembly,
  professionalSignature,
  release
} = {}) {
  const adapters = {
    PROFESSIONAL_REVIEW: professionalReview,
    BOUNDARY_VALIDATION: boundaryValidation,
    DELIVERABLE_ASSEMBLY: deliverableAssembly,
    PROFESSIONAL_SIGNATURE: professionalSignature,
    RELEASE: release
  };

  for (const stage of REQUIRED_SEQUENCE) {
    assertAdapter(adapters[stage], stage);
  }

  return Object.freeze({
    runtimeCode: SHARED_PROFESSIONAL_RUNTIME_CODE,
    runtimeVersion: SHARED_PROFESSIONAL_RUNTIME_VERSION,
    sequence: REQUIRED_SEQUENCE,

    async process(request) {
      assertObject(request, 'Professional Runtime request is required.');
      if (request.runtimeCode !== SHARED_PROFESSIONAL_RUNTIME_CODE) {
        throw new TypeError('Invalid professional runtimeCode.');
      }
      assertInterpretationCandidate(request.interpretationCandidate);
      assertString(request.methodCode, 'methodCode is required.');
      assertString(request.pluginCode, 'pluginCode is required.');
      assertString(request.deliverableTypeCode, 'deliverableTypeCode is required.');

      const candidateSnapshot = stableSerialize(request.interpretationCandidate);
      const audit = [];
      const baseContext = Object.freeze({
        methodCode: request.methodCode,
        pluginCode: request.pluginCode,
        deliverableTypeCode: request.deliverableTypeCode,
        professionalId: request.professionalId,
        interpretationCandidate: structuredClone(request.interpretationCandidate)
      });

      const review = await professionalReview.execute(baseContext);
      assertPassed(review, 'PROFESSIONAL_REVIEW');
      assertString(review.reviewId, 'Professional Review reviewId is required.');
      audit.push(Object.freeze({
        stage: 'PROFESSIONAL_REVIEW',
        adapterCode: professionalReview.code,
        adapterVersion: professionalReview.version,
        resultDigest: await sha256(review)
      }));

      const boundary = await boundaryValidation.execute(Object.freeze({
        ...baseContext,
        review: structuredClone(review)
      }));
      assertPassed(boundary, 'BOUNDARY_VALIDATION');
      assertString(boundary.boundaryValidationId, 'Boundary Validation ID is required.');
      audit.push(Object.freeze({
        stage: 'BOUNDARY_VALIDATION',
        adapterCode: boundaryValidation.code,
        adapterVersion: boundaryValidation.version,
        resultDigest: await sha256(boundary)
      }));

      const deliverable = await deliverableAssembly.execute(Object.freeze({
        ...baseContext,
        review: structuredClone(review),
        boundary: structuredClone(boundary)
      }));
      assertPassed(deliverable, 'DELIVERABLE_ASSEMBLY');
      assertString(deliverable.deliverableCode, 'Deliverable code is required.');
      assertString(deliverable.deliverableVersion, 'Deliverable version is required.');
      if (!Object.hasOwn(deliverable, 'content')) {
        throw new TypeError('Deliverable content is required.');
      }
      audit.push(Object.freeze({
        stage: 'DELIVERABLE_ASSEMBLY',
        adapterCode: deliverableAssembly.code,
        adapterVersion: deliverableAssembly.version,
        resultDigest: await sha256(deliverable)
      }));

      const signature = await professionalSignature.execute(Object.freeze({
        ...baseContext,
        review: structuredClone(review),
        boundary: structuredClone(boundary),
        deliverable: structuredClone(deliverable)
      }));
      assertPassed(signature, 'PROFESSIONAL_SIGNATURE');
      for (const key of ['signatureId', 'professionalId', 'credentialCode', 'signedDigest']) {
        assertString(signature[key], `Professional Signature ${key} is required.`);
      }
      const deliverableDigest = await sha256(deliverable);
      if (signature.signedDigest !== deliverableDigest) {
        throw new Error('PROFESSIONAL_SIGNATURE_DIGEST_MISMATCH');
      }
      audit.push(Object.freeze({
        stage: 'PROFESSIONAL_SIGNATURE',
        adapterCode: professionalSignature.code,
        adapterVersion: professionalSignature.version,
        resultDigest: await sha256(signature)
      }));

      const released = await release.execute(Object.freeze({
        ...baseContext,
        review: structuredClone(review),
        boundary: structuredClone(boundary),
        deliverable: structuredClone(deliverable),
        signature: structuredClone(signature)
      }));
      assertPassed(released, 'RELEASE');
      assertString(released.releaseId, 'Release ID is required.');
      if (released.releaseStatus !== 'released') {
        throw new Error('RELEASE_STATUS_INVALID');
      }
      audit.push(Object.freeze({
        stage: 'RELEASE',
        adapterCode: release.code,
        adapterVersion: release.version,
        resultDigest: await sha256(released)
      }));

      if (audit.map(item => item.stage).join('|') !== REQUIRED_SEQUENCE.join('|')) {
        throw new Error('PROFESSIONAL_RUNTIME_SEQUENCE_VIOLATION');
      }
      if (stableSerialize(request.interpretationCandidate) !== candidateSnapshot) {
        throw new Error('INTERPRETATION_CANDIDATE_MUTATION_FORBIDDEN');
      }

      const releaseCode = `PRO-${(await sha256({
        candidateCode: request.interpretationCandidate.candidateCode,
        methodCode: request.methodCode,
        pluginCode: request.pluginCode,
        deliverableCode: deliverable.deliverableCode,
        deliverableVersion: deliverable.deliverableVersion,
        signatureId: signature.signatureId,
        releaseId: released.releaseId,
        audit
      })).slice(0, 24).toUpperCase()}`;

      return Object.freeze({
        schemaVersion: CANONICAL_PROFESSIONAL_RELEASE_SCHEMA_VERSION,
        runtimeCode: SHARED_PROFESSIONAL_RUNTIME_CODE,
        runtimeVersion: SHARED_PROFESSIONAL_RUNTIME_VERSION,
        releaseCode,
        releaseVersion: request.releaseVersion,
        releaseStatus: 'released',
        methodReference: Object.freeze({
          methodCode: request.methodCode,
          pluginCode: request.pluginCode
        }),
        interpretationCandidateReference: Object.freeze({
          runtimeCode: SHARED_INTERPRETATION_RUNTIME_CODE,
          candidateCode: request.interpretationCandidate.candidateCode,
          candidateVersion: request.interpretationCandidate.candidateVersion
        }),
        professionalReview: structuredClone(review),
        boundaryValidation: structuredClone(boundary),
        deliverable: structuredClone(deliverable),
        professionalSignature: structuredClone(signature),
        release: structuredClone(released),
        auditTrail: Object.freeze(audit),
        professionalReviewCompleted: true,
        boundaryValidationCompleted: true,
        deliverableAssemblyCompleted: true,
        professionalSignatureCompleted: true,
        released: true
      });
    }
  });
}
