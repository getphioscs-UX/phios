import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  evaluateCrossRuntimeWrite,
  evaluateDataDrift,
  evaluateGovernanceAcceptance
} from './lib/reality-data-governance/rdg-governance-acceptance-v1.mjs';

const root = process.cwd();
const base = 'content/governance/reality-data-governance';
const read = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const digest = async file => crypto.createHash('sha256').update(await fs.readFile(path.join(root, file))).digest('hex');

const inventory = await read('content/governance/operational-architecture/runtime-inventory-v1.json');
const contracts = await read(`${base}/registries/canonical-data-contract-registry-v1.json`);
const inventoryFamilies = ['knowledge', 'meaning', 'assetAndPresentation', 'method', 'operational'];
const expectedRuntimeCodes = inventoryFamilies.flatMap(family => inventory.runtimeFamilies[family]).sort();
assert.deepEqual(contracts.entries.map(entry => entry.runtimeCode).sort(), expectedRuntimeCodes);
assert.equal(new Set(contracts.entries.map(entry => entry.runtimeCode)).size, expectedRuntimeCodes.length);
assert.equal(contracts.rules.registryDoesNotActivateRuntime, true);
assert.equal(contracts.rules.cprMayWriteCanonicalRealityData, false);
assert.equal(contracts.rules.alrMayWriteLearningAndCapabilityEvidenceOnly, true);
assert.equal(contracts.rules.alrMayWriteRealityEvidence, false);
assert.equal(contracts.rules.professionalJudgmentAuthorityRuntime, 'PR');

const domains = await read(`${base}/registries/canonical-data-domain-registry-v1.json`);
for (const type of contracts.dataTypes) assert.ok(domains.domains.includes(type.dataDomain), type.dataType);
for (const entry of contracts.entries) {
  for (const field of ['runtimeCode', 'plane', 'activationState', 'producedDataTypes', 'consumedDataTypes', 'readAuthority', 'writeAuthority', 'allowedPurposes', 'allowedPersistenceClasses', 'sensitivityCeiling', 'permissions']) {
    assert.ok(Object.hasOwn(entry, field), `${entry.runtimeCode}:${field}`);
  }
  assert.deepEqual(entry.readAuthority.dataTypes, entry.consumedDataTypes, `${entry.runtimeCode}:readAuthority`);
  assert.deepEqual(entry.writeAuthority.dataTypes, entry.producedDataTypes, `${entry.runtimeCode}:writeAuthority`);
  assert.ok(Object.hasOwn(entry.permissions, 'evidencePromotion'), `${entry.runtimeCode}:evidencePromotion`);
  assert.ok(Object.hasOwn(entry.permissions, 'professionalDataWrite'), `${entry.runtimeCode}:professionalDataWrite`);
  assert.ok(Object.hasOwn(entry.permissions, 'analyticsWrite'), `${entry.runtimeCode}:analyticsWrite`);
}

assert.equal(evaluateCrossRuntimeWrite(contracts, {
  sourceRuntimeCode: 'ICR', targetRuntimeCode: 'RMO', dataType: 'REALITY_INPUT_RECORD',
  purposeCode: 'SERVICE_DELIVERY', persistenceClass: 'SESSION', sensitivityClass: 'HIGHLY_SENSITIVE'
}), 'ALLOW_CONTRACTED_WRITE');
assert.equal(evaluateCrossRuntimeWrite(contracts, {
  sourceRuntimeCode: 'CPR', targetRuntimeCode: 'RMO', dataType: 'REALITY_INPUT_RECORD',
  purposeCode: 'SERVICE_DELIVERY', persistenceClass: 'SESSION', sensitivityClass: 'PERSONAL'
}), 'DENY_SOURCE_WRITE_AUTHORITY');
assert.equal(evaluateCrossRuntimeWrite(contracts, {
  sourceRuntimeCode: 'ALR', targetRuntimeCode: 'RR', dataType: 'CAPABILITY_EVIDENCE_RECORD',
  purposeCode: 'CAPABILITY_TRACKING', persistenceClass: 'SERVICE_SCOPED', sensitivityClass: 'SENSITIVE',
  contractValidationOnly: true
}), 'ALLOW_CONTRACTED_WRITE');
assert.equal(evaluateCrossRuntimeWrite(contracts, {
  sourceRuntimeCode: 'ALR', targetRuntimeCode: 'RMO', dataType: 'REALITY_EVIDENCE_RECORD',
  purposeCode: 'CAPABILITY_TRACKING', persistenceClass: 'SERVICE_SCOPED', sensitivityClass: 'SENSITIVE',
  contractValidationOnly: true, evidencePromotionRequested: true
}), 'DENY_SOURCE_WRITE_AUTHORITY');
assert.equal(evaluateCrossRuntimeWrite(contracts, {
  sourceRuntimeCode: 'PR', targetRuntimeCode: 'RR', dataType: 'PROFESSIONAL_JUDGMENT_RECORD',
  purposeCode: 'PROFESSIONAL_SERVICE', persistenceClass: 'PROFESSIONAL_SCOPED', sensitivityClass: 'RESTRICTED_PROFESSIONAL',
  professionalDataWriteRequested: true
}), 'ALLOW_CONTRACTED_WRITE');
const analyticsWrite = {
  sourceRuntimeCode: 'CPR', targetRuntimeCode: 'KI', dataType: 'ANALYTICS_RECORD',
  purposeCode: 'PRODUCT_ANALYTICS', persistenceClass: 'ANONYMIZED_AGGREGATE', sensitivityClass: 'PERSONAL',
  analyticsWriteRequested: true
};
assert.equal(evaluateCrossRuntimeWrite(contracts, { ...analyticsWrite, analyticsConsentValid: false }), 'REQUIRE_ANALYTICS_PURPOSE_AND_CONSENT');
assert.equal(evaluateCrossRuntimeWrite(contracts, { ...analyticsWrite, analyticsConsentValid: true }), 'ALLOW_CONTRACTED_WRITE');

const drift = await read(`${base}/contracts/data-drift-control-v1.json`);
const expectedDrifts = [
  'PURPOSE_DRIFT', 'CONSENT_DRIFT', 'RETENTION_DRIFT', 'SENSITIVITY_DRIFT', 'EVIDENCE_DRIFT',
  'AUTHORITY_DRIFT', 'PROFESSIONAL_BOUNDARY_DRIFT', 'INFERENCE_DRIFT', 'ANALYTICS_DRIFT', 'DELETION_DRIFT'
];
assert.deepEqual(drift.driftTypes.map(item => item.driftType), expectedDrifts);
assert.equal(drift.rules.journeyDataMayBeSilentlyReusedForMarketing, false);
const baseline = {
  sourceContext: 'JOURNEY', purposeCodes: ['SERVICE_DELIVERY'], consentClass: 'SERVICE_CONSENT',
  retentionClass: 'SERVICE_LIFECYCLE', sensitivityClass: 'PERSONAL', evidenceState: 'UNKNOWN',
  authorityReference: 'RDG', professionalBoundary: 'NON_PROFESSIONAL', inferenceBoundary: 'UNKNOWN_PRESERVED',
  analyticsLayer: 'RUNTIME_EVENT', deletionState: 'ACTIVE'
};
const noDrift = evaluateDataDrift({ baseline, candidate: { ...baseline } });
assert.equal(noDrift.decision, 'NO_DRIFT');
const mutationByDrift = {
  PURPOSE_DRIFT: ['purposeCodes', ['SERVICE_DELIVERY', 'MARKETING']],
  CONSENT_DRIFT: ['consentClass', 'ANALYTICS_CONSENT'],
  RETENTION_DRIFT: ['retentionClass', 'EXPLICIT_LONG_TERM_MEMORY'],
  SENSITIVITY_DRIFT: ['sensitivityClass', 'SENSITIVE'],
  EVIDENCE_DRIFT: ['evidenceState', 'ACCEPTED_EVIDENCE'],
  AUTHORITY_DRIFT: ['authorityReference', 'CPR'],
  PROFESSIONAL_BOUNDARY_DRIFT: ['professionalBoundary', 'PROFESSIONAL'],
  INFERENCE_DRIFT: ['inferenceBoundary', 'INFERENCE_AS_FACT'],
  ANALYTICS_DRIFT: ['analyticsLayer', 'PRODUCT_ANALYTICS'],
  DELETION_DRIFT: ['deletionState', 'RESTORED']
};
for (const driftType of expectedDrifts) {
  const [field, value] = mutationByDrift[driftType];
  const result = evaluateDataDrift({ baseline, candidate: { ...baseline, [field]: value } });
  assert.equal(result.decision, 'BLOCKED_DRIFT', driftType);
  assert.ok(result.detectedDrifts.includes(driftType), driftType);
}
assert.equal(evaluateDataDrift({
  baseline,
  candidate: { ...baseline, sensitivityClass: 'SENSITIVE' },
  approvedDrifts: ['SENSITIVITY_DRIFT'],
  governedChangeReference: 'RDG-CHANGE-1'
}).decision, 'APPROVED_GOVERNED_CHANGE');
assert.equal(evaluateDataDrift({ baseline }).decision, 'UNRESOLVED');

const retention = await read(`${base}/registries/canonical-data-retention-registry-v1.json`);
const persistence = await read(`${base}/registries/canonical-persistence-class-registry-v1.json`);
for (const entry of retention.entries) {
  for (const persistenceClass of entry.allowedPersistenceClasses) assert.ok(persistence.persistenceClasses.includes(persistenceClass));
}
assert.equal(retention.rules.silentIndefiniteRetentionForbidden, true);
assert.equal(retention.rules.concreteDurationRequiredByRuntimeContract, true);

const realityRegistry = await read(`${base}/registries/reality-data-registry-v1.json`);
assert.equal(realityRegistry.registryNature, 'CONTRACT_AND_CLASSIFICATION_INDEX');
assert.equal(realityRegistry.containsUserData, false);
assert.equal(realityRegistry.containsRuntimePayloads, false);
assert.equal(realityRegistry.rules.registryIsDataWarehouse, false);
assert.equal(realityRegistry.rules.secondDataAuthorityCreated, false);
for (const reference of [...Object.values(realityRegistry.registries), ...realityRegistry.runtimeContractReferences]) {
  await fs.access(path.join(root, reference));
}

const alias = await read(`${base}/registries/rdg-checker-alias-registry-v1.json`);
const expectedWorkCodes = Array.from({ length: 31 }, (_, index) => `RDG-W${index}`);
assert.deepEqual(alias.entries.map(entry => entry.workCode), expectedWorkCodes);
assert.equal(new Set(alias.entries.map(entry => entry.checkerId)).size, 31);
assert.equal(alias.rules.workCodeIsStablePublicIdentity, true);
assert.equal(alias.rules.frozenRgV3RegistryMutated, false);
for (const entry of alias.entries) {
  await fs.access(path.join(root, entry.implementationFile));
  assert.equal(await digest(entry.implementationFile), entry.implementationDigest, entry.workCode);
}

const pkg = await read('package.json');
assert.equal(pkg.scripts['check:rdg'], 'node scripts/run-rdg-checker-v1.mjs');
assert.equal(pkg.scripts['check:rdg-w26-w30'], 'node scripts/check-rdg-w26-w30-governance-acceptance-freeze.mjs');
assert.equal(pkg.scripts['check:rdg-governance'], 'npm run check:rdg-w26-w30');
assert.equal(pkg.scripts['check:governance-data-closure'], 'npm run check:governance-access-closure && npm run check:rdg-w21-w25 && npm run check:rdg-w26-w30');
assert.ok(pkg.scripts.postcheck.startsWith('npm run check:governance-data-closure && '));
for (const workCode of expectedWorkCodes) {
  assert.equal(pkg.scripts[`check:${workCode.toLowerCase()}`], `npm run check:rdg -- ${workCode}`);
}

const reconciliation = await read(`${base}/audits/rdg-data-drift-reconciliation-v1.json`);
assert.equal(reconciliation.checkerIntegrationFinding.baselinePostcheckGovernanceIntegrationPresent, false);
assert.equal(reconciliation.checkerIntegrationFinding.resolution, 'REPAIRED_IN_RDG_W28');
assert.equal(reconciliation.rulesVerified.existingRuntimeDataMutated, false);

const acceptance = await read(`${base}/audits/rdg-full-acceptance-v1.json`);
assert.equal(evaluateGovernanceAcceptance(acceptance.acceptanceGates), 'ACCEPTED');
assert.equal(acceptance.secondDataAuthorityCreated, false);
assert.equal(acceptance.existingRuntimeOrUserDataMutated, false);
assert.equal(acceptance.alrRuntimeImplemented, false);

const freeze = await read(`${base}/freeze/reality-data-governance-freeze-v1.json`);
assert.equal(freeze.freezeState, 'Reality Data Governance Frozen v1');
assert.equal(freeze.status, 'frozen');
assert.equal(freeze.scope, 'RDG-W0-W30');
assert.deepEqual(freeze.completedWorks, expectedWorkCodes);
assert.equal(freeze.secondDataAuthorityCreated, false);
assert.equal(freeze.userDataWarehouseCreated, false);
assert.equal(freeze.alrRuntimeImplemented, false);
assert.equal(freeze.existingRuntimeOrUserDataMutated, false);
for (const output of freeze.outputs) await fs.access(path.join(root, output));

console.log('✓ RDG-W26～W30 Governance / Acceptance / Freeze passed.');
console.log('✓ Cross-runtime writes and ten drift classes fail closed; stable RDG work-code routing is registered; Reality Data Governance Frozen v1.');
