import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createBzrProfessionalIntegrationRuntime,
  BZR_PROFESSIONAL_INTEGRATION_RUNTIME_CODE
} from '../functions/core-method-runtime/bzr-professional-integration-runtime.js';
import {
  createSharedProfessionalRuntime,
  SHARED_PROFESSIONAL_RUNTIME_CODE
} from '../functions/method-runtime/shared-professional-runtime.js';
import {
  SHARED_INTERPRETATION_RUNTIME_CODE,
  CANONICAL_INTERPRETATION_CANDIDATE_SCHEMA_VERSION
} from '../functions/method-runtime/shared-interpretation-runtime.js';
import {
  sha256,
  stableSerialize
} from '../functions/method-runtime/shared-calculation-runtime.js';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(
    await fs.readFile(path.join(root, file), 'utf8')
  );

const contract = await readJson(
  'content/professional/core-method-runtime/bzr-professional-integration-v1.json'
);
const schema = await readJson(
  'content/professional/core-method-runtime/bzr-professional-integration-result-v1.schema.json'
);
const projectionContract = await readJson(
  'content/professional/core-method-runtime/bzr-projection-runtime-v1.json'
);
const professionalContract = await readJson(
  'content/professional/method-runtime/shared-professional-runtime-v1.json'
);
const eligibilityRegistry = await readJson(
  'content/professional/method-governance/imr-production-eligibility-registry-v1.json'
);

assert.equal(contract.stageCode, 'BZR-W5');
assert.deepEqual(
  contract.input.allowedProjectionTypes,
  ['STEM','BRANCH','PILLAR','LUCK_CYCLE']
);
assert.equal(
  contract.professionalAuthority.runtimeCode,
  'SHARED_PROFESSIONAL_RUNTIME'
);
assert.equal(
  contract.professionalAuthority.parallelRuntimeAllowed,
  false
);
assert.deepEqual(
  contract.professionalAuthority.requiredSequence,
  [
    'PROFESSIONAL_REVIEW',
    'BOUNDARY_VALIDATION',
    'DELIVERABLE_ASSEMBLY',
    'PROFESSIONAL_SIGNATURE',
    'RELEASE'
  ]
);
assert.equal(
  contract.currentGovernanceResult.releaseStatus,
  'blocked'
);
assert.equal(
  contract.boundaries.directReleaseAllowed,
  false
);
assert.equal(
  contract.boundaries.medicalDiagnosisAllowed,
  false
);
assert.equal(
  contract.boundaries.identityFactClaimAllowed,
  false
);
assert.equal(contract.nextStage, 'BZR-W6');
assert.equal(projectionContract.stageCode, 'BZR-W4');
assert.equal(
  professionalContract.runtimeCode,
  'SHARED_PROFESSIONAL_RUNTIME'
);
assert.equal(
  schema.properties.sharedProfessionalRuntimeUsed.const,
  true
);

const currentBazi = eligibilityRegistry.methods.find(
  item => item.methodCode === 'BAZI'
);

assert.equal(
  currentBazi.commercialLicensePassed,
  false
);
assert.equal(
  currentBazi.sharedRuntimeImplemented,
  false
);
assert.equal(currentBazi.productionReady, false);
assert.equal(currentBazi.professionalReady, false);
assert.equal(currentBazi.validationPassed, false);
assert.equal(currentBazi.regressionPassed, false);

const candidate = {
  schemaVersion:
    CANONICAL_INTERPRETATION_CANDIDATE_SCHEMA_VERSION,
  runtimeCode:
    SHARED_INTERPRETATION_RUNTIME_CODE,
  runtimeVersion: '1.0.0',
  candidateCode: 'INT-BZR-001',
  candidateVersion: '1.0.0',
  candidateStatus: 'candidate',
  locale: 'zh-Hans',
  projectionReference: {
    runtimeCode: 'SHARED_PROJECTION_RUNTIME',
    projectionCode: 'PRJ-BZR-PILLAR-001',
    projectionVersion: '1.0.0',
    projectionType: 'PILLAR'
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
    limitations: [
      'Professional review required.',
      'BaZi projection is not an identity fact.'
    ]
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

const adapter = (code, execute) => ({
  code,
  version: '1.0.0',
  execute
});

const sharedProfessional =
  createSharedProfessionalRuntime({
    professionalReview: adapter(
      'BZR_REVIEW',
      async () => ({
        passed: true,
        reviewId: 'REVIEW-001',
        findings: []
      })
    ),
    boundaryValidation: adapter(
      'BZR_BOUNDARY',
      async context => ({
        passed:
          context.review.reviewId === 'REVIEW-001',
        boundaryValidationId: 'BOUNDARY-001',
        violations: []
      })
    ),
    deliverableAssembly: adapter(
      'BZR_ASSEMBLY',
      async context => ({
        passed: true,
        deliverableCode:
          'BZR-DELIVERABLE-001',
        deliverableVersion: '1.0.0',
        content: {
          candidateCode:
            context.interpretationCandidate.candidateCode,
          status: 'professionally_reviewed',
          identityFactClaimed: false
        }
      })
    ),
    professionalSignature: adapter(
      'BZR_SIGNATURE',
      async context => ({
        passed: true,
        signatureId: 'SIGNATURE-001',
        professionalId: 'PROFESSIONAL-001',
        credentialCode: 'BZR-CREDENTIAL-001',
        signedDigest:
          await sha256(context.deliverable)
      })
    ),
    release: adapter(
      'BZR_RELEASE',
      async context => ({
        passed:
          context.signature.signatureId ===
            'SIGNATURE-001',
        releaseId: 'RELEASE-001',
        releaseStatus: 'released'
      })
    )
  });

const blockedRuntime =
  createBzrProfessionalIntegrationRuntime({
    sharedProfessionalRuntime: sharedProfessional,
    methodEligibilityResolver:
      async () => currentBazi,
    professionalEligibilityResolver:
      async () => ({
        contract:
          'phi-os.professional-eligibility-decision.v1',
        eligible: true,
        professional_id: 'PROFESSIONAL-001',
        required_capability_codes: [
          'BAZI_PROFESSIONAL_REVIEW'
        ],
        missing_capability_codes: []
      })
  });

await assert.rejects(
  () => blockedRuntime.release({
    runtimeCode:
      BZR_PROFESSIONAL_INTEGRATION_RUNTIME_CODE,
    professionalId: 'PROFESSIONAL-001',
    methodVersion: '0.1.0',
    deliverableTypeCode:
      'BAZI_PROFESSIONAL_REPORT',
    releaseVersion: '1.0.0',
    interpretationCandidate: candidate,
    professionalContext: workspace
  }),
  /BZR_METHOD_NOT_PROFESSIONALLY_ELIGIBLE/
);

const approvedMethod = {
  ...currentBazi,
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

const integration =
  createBzrProfessionalIntegrationRuntime({
    sharedProfessionalRuntime: sharedProfessional,
    methodEligibilityResolver:
      async () => approvedMethod,
    professionalEligibilityResolver:
      async ({ professionalId }) => ({
        contract:
          'phi-os.professional-eligibility-decision.v1',
        eligible: true,
        professional_id: professionalId,
        required_capability_codes: [
          'BAZI_PROFESSIONAL_REVIEW'
        ],
        missing_capability_codes: []
      })
  });

const before = stableSerialize(candidate);

const result = await integration.release({
  runtimeCode:
    BZR_PROFESSIONAL_INTEGRATION_RUNTIME_CODE,
  professionalId: 'PROFESSIONAL-001',
  methodVersion: '0.1.0',
  deliverableTypeCode:
    'BAZI_PROFESSIONAL_REPORT',
  releaseVersion: '1.0.0',
  interpretationCandidate: candidate,
  professionalContext: workspace
});

assert.equal(stableSerialize(candidate), before);
assert.equal(
  result.runtimeCode,
  'BZR_PROFESSIONAL_INTEGRATION_RUNTIME'
);
assert.equal(result.methodCode, 'BAZI');
assert.equal(result.pluginCode, 'BZR');
assert.equal(
  result.parallelProfessionalRuntimeCreated,
  false
);
assert.equal(
  result.sharedProfessionalRuntimeUsed,
  true
);
assert.equal(
  result.professionalRelease.runtimeCode,
  SHARED_PROFESSIONAL_RUNTIME_CODE
);
assert.equal(
  result.professionalRelease.releaseStatus,
  'released'
);
assert.deepEqual(
  result.professionalRelease.auditTrail.map(
    item => item.stage
  ),
  contract.professionalAuthority.requiredSequence
);

await assert.rejects(
  () => integration.release({
    runtimeCode:
      BZR_PROFESSIONAL_INTEGRATION_RUNTIME_CODE,
    professionalId: 'PROFESSIONAL-001',
    methodVersion: '0.1.0',
    deliverableTypeCode:
      'BAZI_PROFESSIONAL_REPORT',
    releaseVersion: '1.0.0',
    interpretationCandidate: {
      ...candidate,
      projectionReference: {
        ...candidate.projectionReference,
        projectionType: 'PLANET'
      }
    },
    professionalContext: workspace
  }),
  /not a BZR Projection type/
);

await assert.rejects(
  () => integration.release({
    runtimeCode:
      BZR_PROFESSIONAL_INTEGRATION_RUNTIME_CODE,
    professionalId: 'PROFESSIONAL-001',
    methodVersion: '0.1.0',
    deliverableTypeCode:
      'BAZI_PROFESSIONAL_REPORT',
    releaseVersion: '1.0.0',
    interpretationCandidate: candidate,
    professionalContext: {
      ...workspace,
      consentStatus: 'withdrawn'
    }
  }),
  /BZR_PROFESSIONAL_WORKSPACE_GATE_FAILED/
);

await assert.rejects(
  () => integration.release({
    runtimeCode:
      BZR_PROFESSIONAL_INTEGRATION_RUNTIME_CODE,
    professionalId: 'PROFESSIONAL-001',
    methodVersion: '0.1.0',
    deliverableTypeCode:
      'BAZI_PROFESSIONAL_REPORT',
    releaseVersion: '1.0.0',
    interpretationCandidate: candidate,
    professionalContext: workspace,
    identityFact: true
  }),
  /Professional Integration field forbidden/
);

console.log('✓ BZR-W5 Professional Integration passed.');
console.log(
  '  Method Eligibility + Professional Eligibility + Workspace gates → SHARED_PROFESSIONAL_RUNTIME.'
);
console.log(
  '  Current BaZi Governance blocks Release; no parallel BZR professional path exists.'
);
console.log(
  '  BaZi Projection cannot become identity fact, medical/legal/financial decision or automatic conclusion.'
);
