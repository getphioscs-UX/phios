import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  assertReadoutInputDigest,
  buildPatternRuntime,
  buildReadoutInput,
  buildRuntimeSignature,
  extractObservableRuntime
} from './lib/reality-readout-engine/rre-readout-foundation-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readText = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = relative => JSON.parse(readText(relative));
const exists = relative => fs.existsSync(path.join(root, relative));
const clone = value => structuredClone(value);
const expectThrow = (fn, code) => assert.throws(fn, error => error?.message?.startsWith(code), `Expected ${code}`);
const sorted = values => [...values].sort();

const base = 'content/runtime/reality-readout-engine';
const audit = readJson(`${base}/audits/rre-w0-w4-authority-reconciliation-v1.json`);
const boundary = readJson(`${base}/contracts/rre-authority-boundary-v1.json`);
const dataGap = readJson(`${base}/contracts/rre-data-contract-gap-v1.json`);
const inputContract = readJson(`${base}/contracts/reality-readout-input-contract-v1.json`);
const extractionContract = readJson(`${base}/contracts/observable-runtime-extraction-contract-v1.json`);
const signatureContract = readJson(`${base}/contracts/runtime-signature-contract-v1.json`);
const patternContract = readJson(`${base}/contracts/pattern-runtime-contract-v1.json`);
const acceptance = readJson(`${base}/contracts/rre-w0-w4-acceptance-contract-v1.json`);
const dimensionRegistry = readJson(`${base}/registries/canonical-observable-dimension-registry-v1.json`);
const signatureRoleRegistry = readJson(`${base}/registries/canonical-runtime-signature-role-registry-v1.json`);
const patternRegistry = readJson(`${base}/registries/canonical-pattern-runtime-registry-v1.json`);
const freeze = readJson(`${base}/freeze/rre-w0-w4-readout-foundation-freeze-v1.json`);

const masterWork = readJson('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const runtimeInventory = readJson('content/governance/operational-architecture/runtime-inventory-v1.json');
const rdgDataContracts = readJson('content/governance/reality-data-governance/registries/canonical-data-contract-registry-v1.json');
const rmoEvidenceContract = readJson('content/runtime/reality-model-runtime/contracts/evidence-binding-runtime-contract-v1.json');
const packageJson = readJson('package.json');

assert.equal(audit.baselineCommit, '1d4bc9e98d38c743b44f9659fd89d75bdbb1c0f7');
assert.equal(audit.status, 'reconciled_with_legacy_evidence_compatibility');
assert.equal(audit.authorityDecision.legacyEvidenceAuthorityPreserved, true);
assert.equal(audit.authorityDecision.legacyEvidenceAuthorityMutationByThisBatch, false);
assert.equal(audit.authorityDecision.rdgCanonicalDataContractMutationByThisBatch, false);
assert.equal(audit.authorityDecision.readoutMayMasqueradeAsEvidenceRecord, false);
assert.equal(audit.authorityDecision.readoutMayMasqueradeAsRuntimeStateRecord, false);
assert.equal(audit.circularityResolution.runtimeLevelCircularAuthorityCreated, false);
for (const entry of audit.inspectedAuthorities) assert.ok(exists(entry.reference), `missing audited authority: ${entry.reference}`);

assert.ok(runtimeInventory.runtimeFamilies.operational.includes('RRE'));
const rreWorks = masterWork.entries.filter(entry => entry.runtimeCode === 'RRE');
assert.deepEqual(rreWorks.map(entry => entry.workCode), Array.from({ length: 17 }, (_, index) => `RRE-W${index}`));
assert.ok(rreWorks.every(entry => entry.status === 'PLANNED'));

const currentRreData = rdgDataContracts.entries.find(entry => entry.runtimeCode === 'RRE');
assert.ok(currentRreData, 'RRE RDG data contract missing');
assert.deepEqual(currentRreData.producedDataTypes, ['REALITY_EVIDENCE_RECORD']);
assert.deepEqual(sorted(currentRreData.consumedDataTypes), sorted(['REALITY_INPUT_RECORD', 'GOVERNANCE_RECORD']));
assert.equal(currentRreData.permissions.evidencePromotion, 'ALLOW_GOVERNED');
assert.ok(!currentRreData.producedDataTypes.includes('REALITY_READOUT_RECORD'));
assert.ok(rmoEvidenceContract.authorityBoundary.rreOwns.includes('REALITY_EVIDENCE_RECORD identity'));
assert.ok(rmoEvidenceContract.authorityBoundary.rreOwns.includes('governed Evidence production'));
assert.equal(rmoEvidenceContract.rules.acceptedRreEvidenceRequired, true);
assert.equal(rmoEvidenceContract.rules.bindingCreatesEvidence, false);

assert.equal(boundary.work, 'RRE-W0');
assert.equal(boundary.runtimeName, 'Reality Readout Engine');
assert.equal(boundary.objectFamily, 'RRE_READOUT');
assert.equal(boundary.legacyEvidenceCompatibility.currentRreEvidenceAuthorityPreserved, true);
assert.equal(boundary.legacyEvidenceCompatibility.readoutIsEvidence, false);
assert.equal(boundary.legacyEvidenceCompatibility.readoutWritesEvidenceRecord, false);
assert.equal(boundary.readoutPersistence.activated, false);
assert.equal(boundary.readoutPersistence.requiredFutureDataType, 'REALITY_READOUT_RECORD');
assert.ok(boundary.forbidden.includes('MEDICAL_DIAGNOSIS'));
assert.ok(boundary.forbidden.includes('PROFESSIONAL_JUDGMENT'));
assert.ok(boundary.forbidden.includes('NAVIGATION_COMMAND'));

assert.equal(dataGap.status, 'governance_extension_required_before_persistence');
assert.deepEqual(dataGap.currentCanonicalRdgContract.producedDataTypes, currentRreData.producedDataTypes);
assert.deepEqual(sorted(dataGap.currentCanonicalRdgContract.consumedDataTypes), sorted(currentRreData.consumedDataTypes));
assert.equal(dataGap.requiredReadoutContractSuccessor.newDataType, 'REALITY_READOUT_RECORD');
assert.equal(dataGap.rules.thisFileDoesNotAmendRdgAuthority, true);
assert.equal(dataGap.rules.w11PersistentCanonicalReadoutBlockedUntilGovernanceExtension, true);

assert.equal(inputContract.work, 'RRE-W1');
assert.equal(inputContract.rules.rdgGovernedReferencesOnly, true);
assert.equal(inputContract.rules.rawArbitraryDataAccepted, false);
assert.equal(extractionContract.work, 'RRE-W2');
assert.equal(extractionContract.rules.supportedItemsOnly, true);
assert.equal(signatureContract.work, 'RRE-W3');
assert.equal(signatureContract.rules.personalityProfile, false);
assert.equal(patternContract.work, 'RRE-W4');
assert.equal(patternContract.rules.insufficientEvidenceMustRemainExplicit, true);

assert.deepEqual(dimensionRegistry.observableDimensions.map(entry => entry.dimension), ['STATE','TRANSITION','DEPENDENCY','PERSISTENCE','LOAD','CONSTRAINT']);
assert.deepEqual(signatureRoleRegistry.signatureRoles.map(entry => entry.role), ['PERSISTS','REPEATS','ACTIVATES','DEACTIVATES','REMAINS_UNSTABLE']);
assert.deepEqual(patternRegistry.patternTypes.map(entry => entry.patternType), ['RECURRENT','TEMPORAL','RELATIONSHIP','LOAD','RECOVERY']);
assert.deepEqual(patternRegistry.evidenceStates, ['OBSERVED_PATTERN','CANDIDATE_PATTERN','INSUFFICIENT_EVIDENCE']);
assert.equal(dimensionRegistry.containsUserData, false);
assert.equal(signatureRoleRegistry.containsUserData, false);
assert.equal(patternRegistry.containsUserData, false);

const ajv = new Ajv2020({ allErrors: true, strict: false, formats: { 'date-time': value => Number.isFinite(Date.parse(value)) } });
const validateInput = ajv.compile(readJson(`${base}/schemas/reality-readout-input-v1.schema.json`));
const validateExtraction = ajv.compile(readJson(`${base}/schemas/observable-runtime-extraction-v1.schema.json`));
const validateSignature = ajv.compile(readJson(`${base}/schemas/runtime-signature-v1.schema.json`));
const validatePattern = ajv.compile(readJson(`${base}/schemas/pattern-runtime-v1.schema.json`));

const validInputRequest = readJson(`${base}/fixtures/readout-input.request.valid.json`);
const input = buildReadoutInput(validInputRequest, inputContract);
assert.equal(validateInput(input), true, JSON.stringify(validateInput.errors));
assertReadoutInputDigest(input);
assert.equal(input.validationOnly, true);
assert.equal(input.persistentStoreWriteAllowed, false);
assert.equal(input.productionExecutionAllowed, false);
assert.equal(Object.hasOwn(input, 'rawData'), false);
assert.equal(Object.hasOwn(input, 'payload'), false);
assert.deepEqual(buildReadoutInput(clone(validInputRequest), inputContract), input);

const invalidRaw = readJson(`${base}/fixtures/readout-input.request.invalid-raw-data.json`);
expectThrow(() => buildReadoutInput(invalidRaw, inputContract), 'RRE_FORBIDDEN_INPUT_FIELD:');
const badQuality = { ...clone(validInputRequest), dataQuality: 'PERFECT' };
expectThrow(() => buildReadoutInput(badQuality, inputContract), 'RRE_DATA_QUALITY_INVALID');
const duplicateEvidence = clone(validInputRequest);
duplicateEvidence.evidenceReferences.push(duplicateEvidence.evidenceReferences[0]);
expectThrow(() => buildReadoutInput(duplicateEvidence, inputContract), 'RRE_EVIDENCE_DUPLICATE_REFERENCE');

const realityView = readJson(`${base}/fixtures/observable-reality-view.valid.json`);
const extraction = extractObservableRuntime(input, realityView, dimensionRegistry);
assert.equal(validateExtraction(extraction), true, JSON.stringify(validateExtraction.errors));
assert.equal(extraction.observableStates.length, 1);
assert.equal(extraction.observableTransitions.length, 1);
assert.equal(extraction.observableDependencies.length, 1);
assert.equal(extraction.observablePersistence.length, 1);
assert.equal(extraction.observableLoad.length, 1);
assert.equal(extraction.observableConstraints.length, 1);
assert.equal(extraction.omittedUnsupported, 1);
assert.equal(extraction.supportOnly, true);
assert.equal(extraction.interpretationCreated, false);
assert.equal(extraction.diagnosisCreated, false);
const wrongView = clone(realityView);
wrongView.realityReference.digest = 'c'.repeat(64);
expectThrow(() => extractObservableRuntime(input, wrongView, dimensionRegistry), 'RRE_REALITY_VIEW_REFERENCE_MISMATCH');

const signature = buildRuntimeSignature(extraction, readJson(`${base}/fixtures/runtime-signature.request.valid.json`), signatureRoleRegistry);
assert.equal(validateSignature(signature), true, JSON.stringify(validateSignature.errors));
assert.equal(signature.personalityProfile, false);
assert.equal(signature.identityTruth, false);
assert.equal(signature.whatPersists.length, 1);
assert.equal(signature.whatRepeats.length, 1);
assert.equal(signature.whatActivates.length, 1);
assert.equal(signature.whatDeactivates.length, 1);
assert.equal(signature.whatRemainsUnstable.length, 1);
const badSignature = readJson(`${base}/fixtures/runtime-signature.request.valid.json`);
badSignature.fragments[0].observableReferences = ['OBS-UNKNOWN'];
expectThrow(() => buildRuntimeSignature(extraction, badSignature, signatureRoleRegistry), 'RRE_SIGNATURE_OBSERVABLE_UNKNOWN:OBS-UNKNOWN');

const pattern = buildPatternRuntime(extraction, readJson(`${base}/fixtures/pattern-runtime.request.valid.json`), patternRegistry);
assert.equal(validatePattern(pattern), true, JSON.stringify(validatePattern.errors));
assert.equal(pattern.observedPatternCount, 1);
assert.equal(pattern.candidatePatternCount, 1);
assert.equal(pattern.insufficientEvidenceCount, 1);
assert.equal(pattern.diagnosisCreated, false);
assert.equal(pattern.recommendationCreated, false);
const unsupportedObserved = readJson(`${base}/fixtures/pattern-runtime.request.valid.json`);
unsupportedObserved.patterns[0].observableReferences = ['OBS-CONSTRAINT-001'];
expectThrow(() => buildPatternRuntime(extraction, unsupportedObserved, patternRegistry), 'RRE_PATTERN_OBSERVED_SUPPORT_INSUFFICIENT');

assert.equal(acceptance.status, 'accept_validation_only_foundation');
assert.equal(freeze.status, 'FROZEN_VALIDATION_ONLY_FOUNDATION');
assert.deepEqual(freeze.completedWork, ['RRE-W0','RRE-W1','RRE-W2','RRE-W3','RRE-W4']);
assert.equal(freeze.authorityReconciliation.legacyRreEvidenceAuthorityPreserved, true);
assert.equal(freeze.blockingGate.persistentCanonicalReadoutAllowed, false);
assert.ok(Object.values(freeze.nonActivation).every(value => value === false));
for (const output of freeze.frozenOutputs) assert.ok(exists(output), `missing frozen output: ${output}`);

assert.equal(packageJson.scripts['check:rre-w0-w4'], 'node scripts/check-rre-w0-w4-readout-foundation.mjs');
assert.equal(packageJson.scripts['check:rre-foundation'], 'npm run check:rre-w0-w4');
assert.equal(packageJson.scripts['check:rre'], 'npm run check:rre-foundation');

console.log('✓ RRE-W0-W4 Reality Readout Engine foundation passed.');
console.log('✓ Existing RRE Evidence authority and RMO evidence binding remain preserved.');
console.log('✓ Readout input, observable extraction, runtime signature and governed pattern runtime are validation-only.');
console.log('✓ Persistent Canonical Readout remains blocked pending versioned RDG REALITY_READOUT_RECORD authority.');
