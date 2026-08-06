import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createSharedProfessionalRuntime,
  SHARED_PROFESSIONAL_RUNTIME_CODE,
  CANONICAL_PROFESSIONAL_RELEASE_SCHEMA_VERSION
} from '../functions/method-runtime/shared-professional-runtime.js';
import {
  SHARED_INTERPRETATION_RUNTIME_CODE,
  CANONICAL_INTERPRETATION_CANDIDATE_SCHEMA_VERSION
} from '../functions/method-runtime/shared-interpretation-runtime.js';
import { sha256, stableSerialize } from '../functions/method-runtime/shared-calculation-runtime.js';

const root = process.cwd();
const readJson = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

const contract = await readJson(
  'content/professional/method-runtime/shared-professional-runtime-v1.json'
);
const schema = await readJson(
  'content/professional/method-runtime/canonical-professional-release-v1.schema.json'
);

assert.equal(contract.runtimeCode, SHARED_PROFESSIONAL_RUNTIME_CODE);
assert.equal(contract.schemaVersion, CANONICAL_PROFESSIONAL_RELEASE_SCHEMA_VERSION);
assert.deepEqual(contract.requiredSequence, [
  'PROFESSIONAL_REVIEW',
  'BOUNDARY_VALIDATION',
  'DELIVERABLE_ASSEMBLY',
  'PROFESSIONAL_SIGNATURE',
  'RELEASE'
]);
assert.equal(schema.properties.releaseStatus.const, 'released');
assert.equal(schema.properties.released.const, true);

const candidate = {
  schemaVersion: CANONICAL_INTERPRETATION_CANDIDATE_SCHEMA_VERSION,
  runtimeCode: SHARED_INTERPRETATION_RUNTIME_CODE,
  runtimeVersion: '1.0.0',
  candidateCode: 'INT-0123456789ABCDEF01234567',
  candidateVersion: '1.0.0',
  candidateStatus: 'candidate',
  locale: 'zh-Hans',
  projectionReference: {
    runtimeCode: 'SHARED_PROJECTION_RUNTIME',
    projectionCode: 'PRJ-TEST',
    projectionVersion: '1.0.0',
    projectionType: 'GATE'
  },
  knowledgeLineage: {
    lookupCode: 'KNOWLEDGE_RUNTIME',
    lookupVersion: '1.0.0',
    queryDigest: 'a'.repeat(64),
    resultDigest: 'b'.repeat(64),
    publishedOnly: true,
    registryLed: true
  },
  journeyLineage: {
    journeyRuntimeCode: 'JOURNEY_RUNTIME',
    journeyRuntimeVersion: '1.0.0',
    journeyId: 'JOURNEY-001',
    contextDigest: 'c'.repeat(64)
  },
  providerLineage: {
    providerCode: 'OPENAI',
    providerVersion: '1.0.0',
    providerOutputDigest: 'd'.repeat(64)
  },
  interpretation: {
    summary: 'Candidate only.',
    observations: [],
    knowledgeReferences: [],
    limitations: ['Professional review required.']
  },
  providerUsed: true,
  aiUsed: true,
  interpretationCreated: true,
  finalConclusionCreated: false,
  professionalReportCreated: false,
  realityDecisionCreated: false,
  professionalConclusionCreated: false
};

const calls = [];
const adapter = (code, execute) => ({ code, version: '1.0.0', execute });
let assembled;
const runtime = createSharedProfessionalRuntime({
  professionalReview: adapter('PROFESSIONAL_REVIEW_V1', async () => {
    calls.push('PROFESSIONAL_REVIEW');
    return { passed: true, reviewId: 'REVIEW-001', findings: [] };
  }),
  boundaryValidation: adapter('BOUNDARY_VALIDATION_V1', async context => {
    calls.push('BOUNDARY_VALIDATION');
    assert.equal(context.review.reviewId, 'REVIEW-001');
    return { passed: true, boundaryValidationId: 'BOUNDARY-001', violations: [] };
  }),
  deliverableAssembly: adapter('DELIVERABLE_ASSEMBLY_V1', async context => {
    calls.push('DELIVERABLE_ASSEMBLY');
    assert.equal(context.boundary.boundaryValidationId, 'BOUNDARY-001');
    assembled = {
      passed: true,
      deliverableCode: 'DELIVERABLE-001',
      deliverableVersion: '1.0.0',
      content: { sections: ['reviewed interpretation'] }
    };
    return assembled;
  }),
  professionalSignature: adapter('PROFESSIONAL_SIGNATURE_V1', async context => {
    calls.push('PROFESSIONAL_SIGNATURE');
    return {
      passed: true,
      signatureId: 'SIGNATURE-001',
      professionalId: 'PROFESSIONAL-001',
      credentialCode: 'CREDENTIAL-001',
      signedDigest: await sha256(context.deliverable)
    };
  }),
  release: adapter('RELEASE_V1', async context => {
    calls.push('RELEASE');
    assert.equal(context.signature.signatureId, 'SIGNATURE-001');
    return { passed: true, releaseId: 'RELEASE-001', releaseStatus: 'released' };
  })
});

const before = stableSerialize(candidate);
const first = await runtime.process({
  runtimeCode: SHARED_PROFESSIONAL_RUNTIME_CODE,
  releaseVersion: '1.0.0',
  methodCode: 'HUMAN_DESIGN',
  pluginCode: 'HD-CORE',
  deliverableTypeCode: 'METHOD_REPORT',
  professionalId: 'PROFESSIONAL-001',
  interpretationCandidate: candidate
});
const second = await runtime.process({
  runtimeCode: SHARED_PROFESSIONAL_RUNTIME_CODE,
  releaseVersion: '1.0.0',
  methodCode: 'HUMAN_DESIGN',
  pluginCode: 'HD-CORE',
  deliverableTypeCode: 'METHOD_REPORT',
  professionalId: 'PROFESSIONAL-001',
  interpretationCandidate: candidate
});

assert.equal(stableSerialize(candidate), before);
assert.equal(first.releaseCode, second.releaseCode);
assert.equal(first.releaseStatus, 'released');
assert.equal(first.released, true);
assert.deepEqual(first.auditTrail.map(item => item.stage), contract.requiredSequence);
assert.deepEqual(calls.slice(0, 5), contract.requiredSequence);
assert.equal(first.interpretationCandidateReference.candidateCode, candidate.candidateCode);
assert.equal(first.professionalSignature.signedDigest, await sha256(assembled));

await assert.rejects(
  () => runtime.process({
    runtimeCode: SHARED_PROFESSIONAL_RUNTIME_CODE,
    releaseVersion: '1.0.0',
    methodCode: 'TAROT',
    pluginCode: 'TAROT-CORE',
    deliverableTypeCode: 'METHOD_REPORT',
    professionalId: 'PROFESSIONAL-001',
    interpretationCandidate: { ...candidate, candidateStatus: 'approved' }
  }),
  /unreleased MR-W5 Interpretation Candidate/
);

const blocked = createSharedProfessionalRuntime({
  professionalReview: adapter('R', async () => ({ passed: false, reason: 'human review incomplete' })),
  boundaryValidation: adapter('B', async () => { throw new Error('MUST_NOT_RUN'); }),
  deliverableAssembly: adapter('D', async () => { throw new Error('MUST_NOT_RUN'); }),
  professionalSignature: adapter('S', async () => { throw new Error('MUST_NOT_RUN'); }),
  release: adapter('X', async () => { throw new Error('MUST_NOT_RUN'); })
});
await assert.rejects(
  () => blocked.process({
    runtimeCode: SHARED_PROFESSIONAL_RUNTIME_CODE,
    releaseVersion: '1.0.0',
    methodCode: 'ASTROLOGY',
    pluginCode: 'ASTROLOGY-CORE',
    deliverableTypeCode: 'METHOD_REPORT',
    professionalId: 'PROFESSIONAL-001',
    interpretationCandidate: candidate
  }),
  /PROFESSIONAL_REVIEW_FAILED/
);

const badSignature = createSharedProfessionalRuntime({
  professionalReview: adapter('R', async () => ({ passed: true, reviewId: 'R1' })),
  boundaryValidation: adapter('B', async () => ({ passed: true, boundaryValidationId: 'B1' })),
  deliverableAssembly: adapter('D', async () => ({
    passed: true, deliverableCode: 'D1', deliverableVersion: '1', content: {}
  })),
  professionalSignature: adapter('S', async () => ({
    passed: true, signatureId: 'S1', professionalId: 'P1',
    credentialCode: 'C1', signedDigest: '0'.repeat(64)
  })),
  release: adapter('X', async () => ({ passed: true, releaseId: 'X1', releaseStatus: 'released' }))
});
await assert.rejects(
  () => badSignature.process({
    runtimeCode: SHARED_PROFESSIONAL_RUNTIME_CODE,
    releaseVersion: '1.0.0',
    methodCode: 'BAZI',
    pluginCode: 'BAZI-CORE',
    deliverableTypeCode: 'METHOD_REPORT',
    professionalId: 'P1',
    interpretationCandidate: candidate
  }),
  /PROFESSIONAL_SIGNATURE_DIGEST_MISMATCH/
);

console.log('✓ MR-W6 Shared Professional Runtime passed.');
console.log('  Professional Review → Boundary Validation → Deliverable Assembly → Professional Signature → Release.');
console.log('  Every Method uses one fail-closed professional release path.');
