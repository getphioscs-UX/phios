import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createAstProfessionalIntegrationRuntime,
  AST_PROFESSIONAL_INTEGRATION_RUNTIME_CODE
} from '../functions/core-method-runtime/ast-professional-integration-runtime.js';
import {
  createSharedProfessionalRuntime,
  SHARED_PROFESSIONAL_RUNTIME_CODE
} from '../functions/method-runtime/shared-professional-runtime.js';
import {
  SHARED_INTERPRETATION_RUNTIME_CODE,
  CANONICAL_INTERPRETATION_CANDIDATE_SCHEMA_VERSION
} from '../functions/method-runtime/shared-interpretation-runtime.js';
import { sha256, stableSerialize } from
  '../functions/method-runtime/shared-calculation-runtime.js';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

const contract = await readJson(
  'content/professional/core-method-runtime/ast-professional-integration-v1.json'
);
const schema = await readJson(
  'content/professional/core-method-runtime/ast-professional-integration-result-v1.schema.json'
);
const projectionContract = await readJson(
  'content/professional/core-method-runtime/ast-projection-runtime-v1.json'
);
const professionalContract = await readJson(
  'content/professional/method-runtime/shared-professional-runtime-v1.json'
);
const eligibilityRegistry = await readJson(
  'content/professional/method-governance/imr-production-eligibility-registry-v1.json'
);

assert.equal(contract.stageCode, 'AST-W6');
assert.deepEqual(contract.input.allowedProjectionTypes, ['PLANET','HOUSE','ASPECT']);
assert.equal(contract.professionalAuthority.runtimeCode, 'SHARED_PROFESSIONAL_RUNTIME');
assert.equal(contract.professionalAuthority.parallelRuntimeAllowed, false);
assert.deepEqual(
  contract.professionalAuthority.requiredSequence,
  ['PROFESSIONAL_REVIEW','BOUNDARY_VALIDATION','DELIVERABLE_ASSEMBLY','PROFESSIONAL_SIGNATURE','RELEASE']
);
assert.equal(contract.currentGovernanceResult.releaseStatus, 'blocked');
assert.equal(contract.boundaries.directReleaseAllowed, false);
assert.equal(contract.nextStage, 'AST-W7');
assert.equal(projectionContract.stageCode, 'AST-W5');
assert.equal(professionalContract.runtimeCode, 'SHARED_PROFESSIONAL_RUNTIME');
assert.equal(schema.properties.sharedProfessionalRuntimeUsed.const, true);

const currentAst = eligibilityRegistry.methods.find(
  item => item.methodCode === 'ASTROLOGY'
);
assert.equal(currentAst.commercialLicensePassed, true);
assert.equal(currentAst.sharedRuntimeImplemented, false);
assert.equal(currentAst.productionReady, false);
assert.equal(currentAst.professionalReady, false);
assert.equal(currentAst.validationPassed, false);
assert.equal(currentAst.regressionPassed, false);

const candidate = {
  schemaVersion: CANONICAL_INTERPRETATION_CANDIDATE_SCHEMA_VERSION,
  runtimeCode: SHARED_INTERPRETATION_RUNTIME_CODE,
  runtimeVersion: '1.0.0',
  candidateCode: 'INT-AST-001',
  candidateVersion: '1.0.0',
  candidateStatus: 'candidate',
  locale: 'zh-Hans',
  projectionReference: {
    runtimeCode: 'SHARED_PROJECTION_RUNTIME',
    projectionCode: 'PRJ-AST-ASPECT-001',
    projectionVersion: '1.0.0',
    projectionType: 'ASPECT'
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
    summary: 'Validation candidate.',
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

const workspace = {
  professionalId: 'PROFESSIONAL-001',
  assignmentId: 'ASSIGNMENT-001',
  assignmentStatus: 'active',
  consentId: 'CONSENT-001',
  consentStatus: 'active',
  workspaceId: 'WORKSPACE-001',
  workspaceAccessGranted: true,
  boundaryVersion: '1.0.0',
  boundaryAcknowledged: true
};

const adapter = (code, execute) => ({ code, version: '1.0.0', execute });
const sharedProfessional = createSharedProfessionalRuntime({
  professionalReview: adapter('AST_REVIEW', async () => ({
    passed: true, reviewId: 'REVIEW-001', findings: []
  })),
  boundaryValidation: adapter('AST_BOUNDARY', async context => ({
    passed: context.review.reviewId === 'REVIEW-001',
    boundaryValidationId: 'BOUNDARY-001',
    violations: []
  })),
  deliverableAssembly: adapter('AST_ASSEMBLY', async context => ({
    passed: true,
    deliverableCode: 'AST-DELIVERABLE-001',
    deliverableVersion: '1.0.0',
    content: {
      candidateCode: context.interpretationCandidate.candidateCode,
      status: 'professionally_reviewed'
    }
  })),
  professionalSignature: adapter('AST_SIGNATURE', async context => ({
    passed: true,
    signatureId: 'SIGNATURE-001',
    professionalId: 'PROFESSIONAL-001',
    credentialCode: 'AST-CREDENTIAL-001',
    signedDigest: await sha256(context.deliverable)
  })),
  release: adapter('AST_RELEASE', async context => ({
    passed: context.signature.signatureId === 'SIGNATURE-001',
    releaseId: 'RELEASE-001',
    releaseStatus: 'released'
  }))
});

const blockedRuntime = createAstProfessionalIntegrationRuntime({
  sharedProfessionalRuntime: sharedProfessional,
  methodEligibilityResolver: async () => currentAst,
  professionalEligibilityResolver: async () => ({
    contract: 'phi-os.professional-eligibility-decision.v1',
    eligible: true,
    professional_id: 'PROFESSIONAL-001',
    required_capability_codes: ['ASTROLOGY_PROFESSIONAL_REVIEW'],
    missing_capability_codes: []
  })
});

await assert.rejects(
  () => blockedRuntime.release({
    runtimeCode: AST_PROFESSIONAL_INTEGRATION_RUNTIME_CODE,
    professionalId: 'PROFESSIONAL-001',
    methodVersion: '0.1.0',
    deliverableTypeCode: 'ASTROLOGY_PROFESSIONAL_REPORT',
    releaseVersion: '1.0.0',
    interpretationCandidate: candidate,
    professionalContext: workspace
  }),
  /AST_METHOD_NOT_PROFESSIONALLY_ELIGIBLE/
);

const approvedMethod = {
  ...currentAst,
  productionReady: true,
  professionalReady: true,
  validationPassed: true,
  regressionPassed: true,
  commercialLicensePassed: true,
  sharedRuntimeImplemented: true,
  professionalBoundaryPassed: true,
  professionalWorkflowPassed: true,
  blockingReasons: [],
  productionAuthorityCreated: false
};

const integration = createAstProfessionalIntegrationRuntime({
  sharedProfessionalRuntime: sharedProfessional,
  methodEligibilityResolver: async () => approvedMethod,
  professionalEligibilityResolver: async ({ professionalId }) => ({
    contract: 'phi-os.professional-eligibility-decision.v1',
    eligible: true,
    professional_id: professionalId,
    required_capability_codes: ['ASTROLOGY_PROFESSIONAL_REVIEW'],
    missing_capability_codes: []
  })
});

const before = stableSerialize(candidate);
const result = await integration.release({
  runtimeCode: AST_PROFESSIONAL_INTEGRATION_RUNTIME_CODE,
  professionalId: 'PROFESSIONAL-001',
  methodVersion: '0.1.0',
  deliverableTypeCode: 'ASTROLOGY_PROFESSIONAL_REPORT',
  releaseVersion: '1.0.0',
  interpretationCandidate: candidate,
  professionalContext: workspace
});

assert.equal(stableSerialize(candidate), before);
assert.equal(result.runtimeCode, 'AST_PROFESSIONAL_INTEGRATION_RUNTIME');
assert.equal(result.methodCode, 'ASTROLOGY');
assert.equal(result.pluginCode, 'AST');
assert.equal(result.parallelProfessionalRuntimeCreated, false);
assert.equal(result.sharedProfessionalRuntimeUsed, true);
assert.equal(result.professionalRelease.runtimeCode, SHARED_PROFESSIONAL_RUNTIME_CODE);
assert.equal(result.professionalRelease.releaseStatus, 'released');
assert.deepEqual(
  result.professionalRelease.auditTrail.map(item => item.stage),
  contract.professionalAuthority.requiredSequence
);

await assert.rejects(
  () => integration.release({
    runtimeCode: AST_PROFESSIONAL_INTEGRATION_RUNTIME_CODE,
    professionalId: 'PROFESSIONAL-001',
    methodVersion: '0.1.0',
    deliverableTypeCode: 'ASTROLOGY_PROFESSIONAL_REPORT',
    releaseVersion: '1.0.0',
    interpretationCandidate: {
      ...candidate,
      projectionReference: {
        ...candidate.projectionReference,
        projectionType: 'GATE'
      }
    },
    professionalContext: workspace
  }),
  /not an AST Projection type/
);

await assert.rejects(
  () => integration.release({
    runtimeCode: AST_PROFESSIONAL_INTEGRATION_RUNTIME_CODE,
    professionalId: 'PROFESSIONAL-001',
    methodVersion: '0.1.0',
    deliverableTypeCode: 'ASTROLOGY_PROFESSIONAL_REPORT',
    releaseVersion: '1.0.0',
    interpretationCandidate: candidate,
    professionalContext: { ...workspace, consentStatus: 'withdrawn' }
  }),
  /AST_PROFESSIONAL_WORKSPACE_GATE_FAILED/
);

console.log('✓ AST-W6 Professional Integration passed.');
console.log('  Method Eligibility + Professional Eligibility + Workspace gates → SHARED_PROFESSIONAL_RUNTIME.');
console.log('  Current Astrology Governance blocks Release; no parallel AST professional path exists.');
