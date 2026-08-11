import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  assertAlrFoundationVerticalSliceDigest,
  buildAlrFoundationVerticalSlice,
  validateAlrGovernanceProductionRuntime
} from './lib/academy-learning-runtime/alr-governance-production-v1.mjs';

const root = process.cwd();
const base = 'content/academy/academy-learning-runtime';
const readText = file => fs.readFile(path.join(root, file), 'utf8');
const read = async file => JSON.parse(await readText(file));
const normalizeText = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const digest = async file => crypto.createHash('sha256')
  .update(normalizeText(await readText(file)), 'utf8')
  .digest('hex');

const reconciliation = await read(`${base}/audits/alr-governance-production-reconciliation-v1.json`);
assert.equal(reconciliation.baselineCommit, 'bdd9adf0dd28a6de47488089507228eb165e72db');
assert.equal(reconciliation.scope, 'ALR-W42-W46');
assert.equal(reconciliation.canonicalPhase, 'ALR-J｜Governance / Production');
assert.deepEqual(reconciliation.decisions, {
  rgCheckerIntegration: 'ACTIVE_RUNTIME_OWNED_RG_CONFORMANT',
  centralRgRegistration: 'DEFERRED_TO_RG_AUTHORIZED_EXPANSION',
  rdgAcceptance: 'ACCEPTED_CONTRACT_VALIDATION_ONLY',
  pdsAcceptance: 'STATIC_ACCEPTED_PRODUCTION_REVALIDATION_REQUIRED',
  foundationVerticalSlice: 'FOUNDATION_VALIDATION_ONLY',
  alrFreeze: 'ALR-v2.0.0-FROZEN'
});
assert.deepEqual(reconciliation.implementationCounts, {
  canonicalAlrWorkCodes: 47,
  alrCheckerImplementations: 10,
  foundationVerticalSlices: 1,
  preservedPriorAlrFreezes: 9
});
assert.ok(Object.values(reconciliation.preservation).every(value => value === false));
assert.ok(Object.values(reconciliation.nonActivation).every(value => value === false));

const masterWork = await read('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const workEntries = masterWork.entries.filter(entry => /^ALR-W(?:42|43|44|45|46)$/.test(entry.workCode));
assert.deepEqual(workEntries.map(entry => entry.workCode),
  ['ALR-W42', 'ALR-W43', 'ALR-W44', 'ALR-W45', 'ALR-W46']);
assert.deepEqual(workEntries.map(entry => entry.executionOrder), [155, 156, 157, 158, 159]);
assert.ok(workEntries.every(entry => entry.runtimeCode === 'ALR' && entry.status === 'PLANNED'));

const rgAuditAuthorities = [
  ['content/governance/runtime-checker-governance/contracts/checker-identity-contract-v1.json',
    '32859ce6bfd3e1d52d5f9f7976e4ace4bdfd11cceb627841979052c576a460a7'],
  ['content/governance/runtime-checker-governance/contracts/checker-ci-integration-contract-v1.json',
    '46ef75267d4253293dcd12faa9c7017e8da8ec970a5729ec3dac820d2de19858'],
  ['content/governance/runtime-checker-governance/contracts/checker-no-mutation-contract-v1.json',
    '37e5a89d97610b7c3b7a3300bf939840a36a14db2cbaa70122127a9fa9640d3f'],
  ['content/governance/runtime-checker-governance/registries/runtime-checker-alias-registry-v3.json',
    '30b7f6d2b4b588cba737e02cd9b3ebde7e4daad7132e6654788eec39bd661060'],
  ['content/governance/runtime-checker-governance/registries/runtime-checker-group-registry-v1.json',
    'd4f466a140527a5efe852041e80458b35d63b2664ac3a44256e8d07cb3cc3947']
];
for (const [reference, sha256] of rgAuditAuthorities) {
  assert.equal(await digest(reference), sha256, reference);
}

const rdgAudit = await read(`${base}/audits/alr-rdg-acceptance-v1.json`);
assert.equal(rdgAudit.decision, 'ACCEPTED_CONTRACT_VALIDATION_ONLY');
for (const authority of rdgAudit.authorities) {
  assert.equal(await digest(authority.reference), authority.sha256, authority.reference);
}
assert.deepEqual(rdgAudit.acceptedState, {
  rdgActivationState: 'RESERVED_NOT_IMPLEMENTED',
  evidencePromotion: 'DENY_REALITY_EVIDENCE',
  professionalDataWrite: 'DENY',
  analyticsWrite: 'DENY',
  liveLearningDataActivated: false,
  persistenceAuthorized: false
});

const pdsAudit = await read(`${base}/audits/alr-pds-acceptance-v1.json`);
assert.equal(pdsAudit.decision, 'STATIC_ACCEPTED_PRODUCTION_REVALIDATION_REQUIRED');
for (const authority of pdsAudit.authorities) {
  assert.equal(await digest(authority.reference), authority.sha256, authority.reference);
}
assert.equal(pdsAudit.productionAcceptanceClaimed, false);
assert.equal(pdsAudit.productionRevalidationRequiredAfterDeployment, true);

const preservation = await read(`${base}/freeze/alr-w0-w41-content-preservation-manifest-v1.json`);
assert.equal(preservation.preservedFreezes.length, 9);
for (const item of preservation.preservedFreezes) {
  assert.equal(await digest(item.reference), item.sha256, item.reference);
}
assert.equal(preservation.rules.successorFreezeMayRewritePriorFreeze, false);
assert.equal(preservation.rules.digestDriftFailsClosed, true);

const context = {
  alrRgCheckerIntegrationContract: await read(`${base}/contracts/alr-rg-checker-integration-contract-v1.json`),
  alrRdgAcceptanceContract: await read(`${base}/contracts/alr-rdg-acceptance-contract-v1.json`),
  alrPdsAcceptanceContract: await read(`${base}/contracts/alr-pds-acceptance-contract-v1.json`),
  alrFoundationVerticalSliceContract: await read(`${base}/contracts/alr-foundation-vertical-slice-contract-v1.json`),
  alrCheckerAliasRegistry: await read(`${base}/registries/alr-checker-alias-registry-v1.json`),
  rgAliasRegistry: await read('content/governance/runtime-checker-governance/registries/runtime-checker-alias-registry-v3.json'),
  rgGroupRegistry: await read('content/governance/runtime-checker-governance/registries/runtime-checker-group-registry-v1.json'),
  rdgCanonicalDataRegistry: await read('content/governance/reality-data-governance/registries/canonical-data-contract-registry-v1.json'),
  rdgAlrLearningDataContract: await read('content/governance/reality-data-governance/contracts/alr-learning-data-contract-v1.json'),
  rdgCapabilityEvidenceBoundary: await read('content/governance/reality-data-governance/contracts/capability-evidence-boundary-v1.json'),
  cprAcademyContract: await read(`${base}/contracts/cpr-academy-contract-v1.json`),
  academyDashboardContract: await read(`${base}/contracts/academy-dashboard-contract-v1.json`),
  lessonExperienceContract: await read(`${base}/contracts/lesson-experience-contract-v1.json`),
  responsiveAcademyContract: await read(`${base}/contracts/responsive-academy-contract-v1.json`),
  academyAccessibilityContract: await read(`${base}/contracts/academy-accessibility-contract-v1.json`),
  localeLearningProjectionContract: await read(`${base}/contracts/locale-learning-projection-contract-v1.json`),
  academyPresentationViewRegistry: await read(`${base}/registries/academy-presentation-view-registry-v1.json`),
  localeLearningProjectionRegistry: await read(`${base}/registries/locale-learning-projection-registry-v1.json`),
  programRegistry: await read(`${base}/registries/program-registry-v1.json`),
  learningPathRegistry: await read(`${base}/registries/learning-path-registry-v1.json`),
  moduleRegistry: await read(`${base}/registries/module-registry-v1.json`),
  lessonRegistry: await read(`${base}/registries/lesson-registry-v1.json`),
  learningObjectiveRegistry: await read(`${base}/registries/learning-objective-registry-v1.json`),
  capabilityRegistry: await read(`${base}/registries/capability-registry-v1.json`),
  knowledgeLearningBindingRegistry: await read(`${base}/registries/knowledge-learning-binding-registry-v1.json`),
  knowledgeToLearningProjectionRegistry: await read(`${base}/registries/knowledge-to-learning-projection-registry-v1.json`),
  practiceRegistry: await read(`${base}/registries/practice-registry-v1.json`),
  assessmentRegistry: await read(`${base}/registries/assessment-registry-v1.json`),
  learningProgressScopeRegistry: await read(`${base}/registries/learning-progress-scope-registry-v1.json`),
  cprSurfaceRegistry: await read('content/professional/canonical-presentation-runtime/registries/surface-registry-v1.json'),
  cprPresentationTypeRegistry: await read('content/professional/canonical-presentation-runtime/registries/presentation-type-registry-v1.json'),
  cprSurfaceProjectionRegistry: await read('content/professional/canonical-presentation-runtime/registries/cpr-surface-projection-registry-v1.json'),
  cprResponsiveContract: await read('content/professional/canonical-presentation-runtime/contracts/cpr-responsive-presentation-runtime-v1.json'),
  cprAccessibilityContract: await read('content/professional/canonical-presentation-runtime/contracts/cpr-accessibility-presentation-runtime-v1.json'),
  cprLocaleContract: await read('content/professional/canonical-presentation-runtime/contracts/cpr-locale-presentation-runtime-v1.json'),
  publishedAssetRegistry: await read('content/professional/canonical-asset-runtime/registries/published-asset-registry-v1.json'),
  pdsDesignTokenContract: await read('content/registry/pds-w2-design-token-contract.json'),
  pdsFullSiteAcceptance: await read('content/registry/pds-w10-full-site-acceptance.json')
};

assert.equal(validateAlrGovernanceProductionRuntime(context),
  'VALID_ALR_GOVERNANCE_PRODUCTION_RUNTIME');
assert.equal(context.alrCheckerAliasRegistry.entries.length, 47);
assert.equal(new Set(context.alrCheckerAliasRegistry.entries.map(entry =>
  entry.implementationFile)).size, 10);
assert.equal(context.alrRgCheckerIntegrationContract.centralRgRegistrationState,
  'DEFERRED_TO_RG_AUTHORIZED_EXPANSION');
assert.equal(context.rdgCanonicalDataRegistry.entries.find(entry =>
  entry.runtimeCode === 'ALR').activationState, 'RESERVED_NOT_IMPLEMENTED');
assert.equal(context.pdsFullSiteAcceptance.status,
  'implementation-complete-production-revalidation-required');

const checkerReconciliation = await read(
  'docs/alr/reconciliation/alr-post-freeze-checker-reconciliation-v1.json'
);
assert.equal(
  checkerReconciliation.reconciliationCode,
  'PHI-OS-ALR-POST-FREEZE-CHECKER-RECONCILIATION-v1',
  'ALR_POST_FREEZE_CHECKER_RECONCILIATION'
);
assert.equal(checkerReconciliation.status, 'ACCEPTED_SUCCESSOR_RECONCILIATION');
assert.equal(checkerReconciliation.frozenAliasRegistryRewritten, false);
assert.equal(checkerReconciliation.authorityExpansionGranted, false);

for (const entry of context.alrCheckerAliasRegistry.entries) {
  await fs.access(path.join(root, entry.implementationFile));
  const actualDigest = await digest(entry.implementationFile);
  if (actualDigest === entry.implementationDigest) continue;

  const successor = checkerReconciliation.entries.find(item =>
    item.implementationFile === entry.implementationFile
  );

  assert.ok(successor, `${entry.workCode} checker digest`);
  assert.equal(successor.frozenDigest, entry.implementationDigest,
    `${entry.workCode} frozen checker digest`);
  assert.equal(actualDigest, successor.successorDigest,
    `${entry.workCode} successor checker digest`);
  assert.equal(successor.authorityExpansionGranted, false);
  assert.equal(successor.runtimeSemanticAuthorityChanged, false);
}

const sliceAudit = await read(`${base}/audits/alr-foundation-vertical-slice-acceptance-v1.json`);
const sliceRequest = await read(sliceAudit.fixtureReference);
const beforeContext = JSON.stringify(context);
const slice = buildAlrFoundationVerticalSlice(context, sliceRequest);
assert.equal(slice.decision, 'ACCEPT_FOUNDATION_VERTICAL_SLICE_VALIDATION');
assert.equal(slice.sliceMode, 'FOUNDATION_VALIDATION_ONLY');
assert.deepEqual(slice.lineage, sliceAudit.expectedLineage);
assert.deepEqual(slice.effects, sliceAudit.expectedEffects);
assert.equal(slice.learningProjection.localizedLessonTitle, '区分证据与推断');
assert.equal(slice.learningProjection.localizedObjectiveCount, 2);
assert.equal(slice.learningProjection.sourceAuthority, 'PUBLISHED_KNOWLEDGE_AUTHORITY');
assert.equal(slice.learningProjection.sourceContentCopied, false);
assert.equal(slice.learningProjection.teachingDeliveryState, 'REFERENCE_ONLY_DELIVERY_BLOCKED');
assert.equal(slice.learningProjection.practiceState,
  'DEFINITION_AVAILABLE_RESPONSE_CAPTURE_INACTIVE');
assert.equal(slice.learningProjection.assessmentState,
  'DEFINITION_AVAILABLE_EXECUTION_INACTIVE');
assert.equal(slice.learningProjection.canonicalPresentationState,
  'VALIDATION_PROJECTION_SOURCE_ASSET_BLOCKED');
assert.equal(assertAlrFoundationVerticalSliceDigest(slice), true);
assert.equal(JSON.stringify(context), beforeContext);

assert.equal(buildAlrFoundationVerticalSlice(context, {
  ...sliceRequest,
  learnerReference: 'ALR-LEARNER-NOT-ACCEPTED'
}).decision, 'DENY_LEARNER_DATA_OR_EXTERNAL_AUTHORITY_FIELD');
assert.equal(buildAlrFoundationVerticalSlice(context, {
  ...sliceRequest,
  providerUsed: true
}).decision, 'DENY_PROVIDER_OR_AI_FOUNDATION_VERTICAL_SLICE');
assert.equal(buildAlrFoundationVerticalSlice(context, {
  ...sliceRequest,
  lessonCode: 'ALR-LO-LESSON-UNKNOWN'
}).decision, 'DENY_NON_CANONICAL_FOUNDATION_LESSON');
assert.equal(buildAlrFoundationVerticalSlice(context, {
  ...sliceRequest,
  locale: 'zh-Hant'
}).decision, 'DENY_FOUNDATION_VERTICAL_SLICE_PRESENTATION');

const rdgActivationDrift = structuredClone(context);
rdgActivationDrift.rdgCanonicalDataRegistry.entries.find(entry =>
  entry.runtimeCode === 'ALR').activationState = 'ACTIVE';
assert.equal(validateAlrGovernanceProductionRuntime(rdgActivationDrift),
  'ALR_RDG_DATA_CONTRACT_DRIFT');
const pdsProductionClaimDrift = structuredClone(context);
pdsProductionClaimDrift.pdsFullSiteAcceptance.status = 'production-accepted';
assert.equal(validateAlrGovernanceProductionRuntime(pdsProductionClaimDrift),
  'ALR_PDS_ACCEPTANCE_SCOPE_DRIFT');
const rgFalseRegistration = structuredClone(context);
rgFalseRegistration.rgAliasRegistry.entries.push({runtimeCode: 'ALR'});
assert.equal(validateAlrGovernanceProductionRuntime(rgFalseRegistration),
  'FROZEN_RG_V3_FALSE_REGISTRATION_DETECTED');

const packageJson = await read('package.json');
assert.equal(packageJson.scripts['check:alr'], 'node scripts/run-alr-checker-v1.mjs');
assert.equal(packageJson.scripts['check:alr-w42-w46'],
  'node scripts/check-alr-w42-w46-governance-production-freeze.mjs');
assert.equal(packageJson.scripts['check:alr-governance'], 'npm run check:alr-w42-w46');
const postcheck = packageJson.scripts.postcheck;
const presentationIndex = postcheck.indexOf('npm run check:alr-presentation');
const governanceIndex = postcheck.indexOf('npm run check:alr-governance');
const expIndex = postcheck.indexOf('node scripts/check-exp-w4-reconstruction-customer-projection.mjs');
assert.ok(presentationIndex >= 0 && governanceIndex > presentationIndex && expIndex > governanceIndex);

const freeze = await read(`${base}/freeze/alr-v2-freeze-v1.json`);
assert.equal(freeze.scope, 'ALR-W0-W46');
assert.equal(freeze.status, 'frozen');
assert.equal(freeze.freezeDecision, 'ALR-v2.0.0-FROZEN');
assert.equal(freeze.acceptance.centralRgRegistration,
  'DEFERRED_TO_RG_AUTHORIZED_EXPANSION');
assert.equal(freeze.acceptance.rdg, 'ACCEPTED_CONTRACT_VALIDATION_ONLY');
assert.equal(freeze.acceptance.pds,
  'STATIC_ACCEPTED_PRODUCTION_REVALIDATION_REQUIRED');
assert.equal(freeze.activationState.governedAlrDefinitionAndValidationRuntime, true);
assert.equal(freeze.activationState.academyValidationProjection, true);
assert.ok(Object.entries(freeze.activationState)
  .filter(([key]) => !['governedAlrDefinitionAndValidationRuntime',
    'academyValidationProjection'].includes(key))
  .every(([, value]) => value === false));
assert.equal(freeze.productionRevalidationRequired, true);
assert.equal(freeze.nextPhase, 'RRE-W0 Authority Boundary');

console.log('✓ ALR-W42～W46 governance, acceptance, vertical slice and ALR v2 freeze passed');
