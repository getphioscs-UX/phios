import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  classifyProductDataLayer,
  evaluateKnowledgeUsageRecord,
  evaluateLearningRecord,
  evaluateCapabilityEvidence,
  evaluateResearchDataset
} from './lib/reality-data-governance/rdg-analytics-alr-research-v1.mjs';

const root = process.cwd();
const base = 'content/governance/reality-data-governance';
const read = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

const layers = await read(`${base}/registries/data-event-layer-registry-v1.json`);
assert.deepEqual(layers.layers.map(layer => layer.layerCode), [
  'UI_TELEMETRY',
  'PRODUCT_ANALYTICS',
  'RUNTIME_EVENT',
  'CANONICAL_RUNTIME_STATE',
  'REALITY_EVIDENCE'
]);
assert.equal(new Set(layers.layers.map(layer => layer.layerCode)).size, 5);
assert.equal(layers.rules.uiTelemetryIsCanonicalRuntimeEvent, false);
assert.equal(layers.rules.uiTelemetryIsRealityEvidence, false);
assert.equal(layers.rules.successfulGovernedOperationRequiredForCanonicalRuntimeEvent, true);

const analytics = await read(`${base}/contracts/product-analytics-boundary-v1.json`);
assert.equal(analytics.rules.buttonClickedIsUiTelemetry, true);
assert.equal(analytics.rules.uiTelemetryCollectionDefaultEnabled, false);
assert.equal(analytics.rules.analyticsMayCreateRealityEvidence, false);
assert.equal(classifyProductDataLayer({ eventCode: 'button_clicked' }), 'UI_TELEMETRY');
assert.equal(classifyProductDataLayer({ productMetric: true, purposeCode: 'PRODUCT_ANALYTICS' }), 'UI_TELEMETRY');
assert.equal(classifyProductDataLayer({ productMetric: true, purposeCode: 'PRODUCT_ANALYTICS', analyticsConsentValid: true }), 'PRODUCT_ANALYTICS');
assert.equal(classifyProductDataLayer({ formalOperation: true, operationSucceeded: false, operationGoverned: true }), 'NON_CANONICAL_OPERATION_ATTEMPT');
assert.equal(classifyProductDataLayer({ formalOperation: true, operationSucceeded: true, operationGoverned: true, canonicalStateReference: 'STATE-1', causationReference: 'OP-1' }), 'RUNTIME_EVENT_ELIGIBLE');

const usage = await read(`${base}/contracts/knowledge-usage-data-contract-v1.json`);
assert.equal(usage.rules.usageDataIsKnowledgeAuthority, false);
assert.equal(usage.rules.popularityIsTruth, false);
assert.equal(usage.rules.highCompletionIsBetterKnowledge, false);
const usageRecord = { usageRecordCode: 'KU-1', nodeCode: 'KN-PREFACE-001', eventType: 'OPEN', surface: 'ARTICLE', locale: 'en', recordedAt: '2026-08-10T00:00:00Z', purposeCode: 'PRODUCT_ANALYTICS', analyticsConsentValid: true };
assert.equal(evaluateKnowledgeUsageRecord(usageRecord), 'ALLOW_USAGE_RECORD');
assert.equal(evaluateKnowledgeUsageRecord({ ...usageRecord, analyticsConsentValid: false }), 'REQUIRE_ANALYTICS_CONSENT');
assert.equal(evaluateKnowledgeUsageRecord({ ...usageRecord, truthScore: 1 }), 'DENY_FORBIDDEN_FIELD');
assert.equal(evaluateKnowledgeUsageRecord({ ...usageRecord, knowledgeAuthorityMutationRequested: true }), 'DENY_AUTHORITY_EFFECT');

const learning = await read(`${base}/contracts/alr-learning-data-contract-v1.json`);
assert.equal(learning.semanticAuthority, 'ALR Capability Runtime');
assert.equal(learning.rules.assessmentScoreIsCapability, false);
assert.equal(learning.rules.learningRecordMaySetCapabilityState, false);
const learningRecord = { recordCode: 'LR-1', recordType: 'ASSESSMENT_RESPONSE', subjectReference: 'SUB-1', purposeCode: 'CAPABILITY_TRACKING', permissionAllowed: true, response: 'bounded-response', sensitivityClass: 'PERSONAL', retentionClass: 'SERVICE_SCOPED' };
assert.equal(evaluateLearningRecord(learningRecord), 'ALLOW_LEARNING_RECORD');
assert.equal(evaluateLearningRecord({ ...learningRecord, capabilityAchieved: true }), 'DENY_ALR_AUTHORITY');
assert.equal(evaluateLearningRecord({ ...learningRecord, retentionClass: undefined }), 'REQUIRE_CLASSIFICATION');

const evidence = await read(`${base}/contracts/capability-evidence-boundary-v1.json`);
assert.deepEqual(evidence.sequence, ['LEARNING_EXPOSURE', 'PRACTICE', 'ASSESSMENT', 'CAPABILITY_EVIDENCE', 'CAPABILITY_STATE']);
assert.equal(evidence.finalCapabilityAuthority, 'ALR Capability Runtime');
assert.equal(evidence.rules.watchedLessonIsCapabilityAchieved, false);
const evidenceRecord = { capabilityEvidenceCode: 'CE-1', learningRecordReference: 'LR-1', practiceReference: 'PR-1', assessmentReference: 'AS-1', criterionResults: ['SUPPORTED'], lineageReferences: ['LR-1', 'AS-1'], recordedAt: '2026-08-10T00:00:00Z' };
assert.equal(evaluateCapabilityEvidence(evidenceRecord), 'ELIGIBLE_FOR_ALR_REVIEW');
assert.equal(evaluateCapabilityEvidence({ watchedLessonOnly: true }), 'INELIGIBLE');
assert.equal(evaluateCapabilityEvidence({ ...evidenceRecord, disputed: true }), 'DISPUTED');
assert.equal(evaluateCapabilityEvidence({ ...evidenceRecord, capabilityState: 'ACHIEVED' }), 'DENY_ALR_AUTHORITY');

const research = await read(`${base}/contracts/aggregated-research-dataset-contract-v1.json`);
assert.equal(research.activation.default, 'DISABLED');
assert.equal(research.rules.reidentificationForbidden, true);
assert.equal(research.rules.collectionOrMaterializationActivatedByThisContract, false);
const dataset = { activationApproved: true, rdgApprovalReference: 'RDG-APPROVAL-1', datasetCode: 'DATASET-1', researchPurposeReference: 'RP-1', purposeCode: 'RESEARCH_AGGREGATION', purposeLimited: true, sourceContractReferences: ['SOURCE-CONTRACT-1'], aggregationSpecReference: 'AGG-1', anonymized: true, aggregated: true, governedMinimumCohortSize: 20, cohortSize: 25, anonymizationProofReference: 'AP-1', consentOrLegalBasisReferences: ['LB-1'], retentionClass: 'ANONYMIZED_AGGREGATE', createdAt: '2026-08-10T00:00:00Z' };
assert.equal(evaluateResearchDataset({ ...dataset, activationApproved: false }), 'COLLECTION_DISABLED');
assert.equal(evaluateResearchDataset({ ...dataset, rdgApprovalReference: undefined }), 'REQUIRE_RDG_APPROVAL');
assert.equal(evaluateResearchDataset({ ...dataset, cohortSize: 19 }), 'DENY_MINIMUM_COHORT');
assert.equal(evaluateResearchDataset({ ...dataset, containsDirectIdentifiers: true }), 'DENY_REIDENTIFICATION_RISK');
assert.equal(evaluateResearchDataset({ ...dataset, sourceIncludesPrivateOrProfessionalData: true }), 'REQUIRE_RESEARCH_CONSENT_AND_LAWFUL_BASIS');
assert.equal(evaluateResearchDataset({ ...dataset, sourceIncludesPrivateOrProfessionalData: true, researchConsentValid: true, legalBasisReference: 'LB-1' }), 'ELIGIBLE_FOR_GOVERNED_MATERIALIZATION');

const reconciliation = await read(`${base}/audits/rdg-analytics-learning-research-reconciliation-v1.json`);
for (const reference of reconciliation.existingAuthorityReferences) await fs.access(path.join(root, reference));
assert.equal(reconciliation.findings.alrV2RuntimePresent, false);
assert.equal(reconciliation.findings.liveProductAnalyticsCollectionIntroduced, false);
assert.equal(reconciliation.findings.liveResearchDatasetIntroduced, false);

const freeze = await read(`${base}/freeze/rdg-w21-w25-analytics-alr-research-freeze-v1.json`);
assert.equal(freeze.status, 'frozen');
assert.deepEqual(freeze.completedWorks, ['RDG-W21', 'RDG-W22', 'RDG-W23', 'RDG-W24', 'RDG-W25']);
assert.equal(freeze.researchCollectionActivated, false);
assert.equal(freeze.alrRuntimeImplemented, false);
assert.equal(freeze.existingDataMutated, false);

const pkg = await read('package.json');
assert.equal(pkg.scripts['check:rdg-w21-w25'], 'node scripts/check-rdg-w21-w25-analytics-alr-research.mjs');
assert.equal(pkg.scripts['check:rdg-analytics'], 'npm run check:rdg-w21-w25');
assert.equal(pkg.scripts['check:governance-data-closure'], 'npm run check:governance-access-closure && npm run check:rdg-w21-w25');
assert.ok(pkg.scripts.postcheck.startsWith('npm run check:governance-data-closure && '));

console.log('✓ RDG-W21～W25 Analytics / ALR / Research passed.');
console.log('✓ Telemetry, analytics, Runtime state and Evidence remain separate; ALR capability authority is reserved; research collection stays disabled.');
