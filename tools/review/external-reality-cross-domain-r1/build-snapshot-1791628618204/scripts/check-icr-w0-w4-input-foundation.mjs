import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  assertCanonicalInputDigest,
  assertVerifiedInputDigest,
  buildCanonicalInput,
  normalizeBirthData,
  projectMethodInput,
  stableDigest,
  verifyCanonicalInput
} from './lib/input-case-runtime/icr-input-foundation-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const hashFile = relative => crypto.createHash('sha256')
  .update(fs.readFileSync(path.join(root, relative)))
  .digest('hex');
const clone = value => structuredClone(value);
const sorted = values => [...values].sort();
const expectThrow = (fn, code) => assert.throws(fn, error => error?.message?.startsWith(code));

const base = 'content/runtime/input-case-runtime';
const audit = readJson(`${base}/audits/icr-input-authority-audit-v1.json`);
const canonicalContract = readJson(`${base}/contracts/canonical-input-contract-v1.json`);
const birthContract = readJson(`${base}/contracts/birth-data-contract-v1.json`);
const verificationContract = readJson(`${base}/contracts/input-verification-contract-v1.json`);
const projectionContract = readJson(`${base}/contracts/method-input-projection-contract-v1.json`);
const inputTypeRegistry = readJson(`${base}/registries/canonical-input-type-registry-v1.json`);
const verificationRegistry = readJson(`${base}/registries/input-verification-state-registry-v1.json`);
const requirementRegistry = readJson(`${base}/registries/method-input-requirement-registry-v1.json`);
const freeze = readJson(`${base}/freeze/icr-w0-w4-input-foundation-freeze-v1.json`);
const canonicalRequest = readJson(`${base}/fixtures/canonical-input.request.valid.json`);
const invalidCanonicalRequest = readJson(`${base}/fixtures/canonical-input.request.invalid.json`);
const verificationRequest = readJson(`${base}/fixtures/input-verification.request.valid.json`);
const projectionRequest = readJson(`${base}/fixtures/method-input-projection.request.valid.json`);

const rdg = {
  purposes: readJson('content/governance/reality-data-governance/registries/canonical-data-purpose-registry-v1.json'),
  consents: readJson('content/governance/reality-data-governance/registries/canonical-consent-class-registry-v1.json'),
  persistence: readJson('content/governance/reality-data-governance/registries/canonical-persistence-class-registry-v1.json'),
  retention: readJson('content/governance/reality-data-governance/registries/canonical-data-retention-registry-v1.json'),
  sensitivity: readJson('content/governance/reality-data-governance/registries/canonical-data-sensitivity-registry-v1.json'),
  deletion: readJson('content/governance/reality-data-governance/contracts/deletion-tombstone-runtime-v1.json')
};
const dataContracts = readJson('content/governance/reality-data-governance/registries/canonical-data-contract-registry-v1.json');
const masterWork = readJson('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const crossAuthority = readJson('content/professional/cross-runtime-authority/runtime-authority-registry-v1.json');
const sharedDataAuthority = readJson('content/professional/method-runtime/shared-data-authority-v1.json');
const methodRegistry = readJson('content/professional/method-runtime/method-registry-v1.json');
const packageJson = readJson('package.json');

assert.equal(audit.baselineCommit, 'c1ded91129cea2e9406f49c5066fdf041df0c1eb');
assert.equal(audit.status, 'reconciled');
assert.equal(audit.scope, 'ICR-W0-W4 Input Foundation');
for (const authority of audit.inspectedAuthorities) {
  assert.equal(hashFile(authority.reference), authority.sha256, `audit drift: ${authority.reference}`);
}

const icrWorks = masterWork.entries.filter(entry => entry.runtimeCode === 'ICR');
assert.deepEqual(icrWorks.map(entry => entry.workCode), Array.from({ length: 10 }, (_, index) => `ICR-W${index}`));
assert.deepEqual(icrWorks.map(entry => entry.executionOrder), Array.from({ length: 10 }, (_, index) => 87 + index));
assert.ok(icrWorks.every(entry => entry.status === 'PLANNED'));

const inputAuthority = crossAuthority.authorities.find(entry => entry.authorityCode === 'INPUT_AUTHORITY');
assert.equal(inputAuthority.runtimeAuthority, 'SHARED_DATA_AUTHORITY');
assert.equal(inputAuthority.sourceOfTruth, 'content/professional/method-runtime/shared-data-authority-v1.json');
assert.equal(sharedDataAuthority.authorityCode, 'SHARED_DATA_AUTHORITY');
assert.equal(sharedDataAuthority.status, 'frozen');
assert.equal(sharedDataAuthority.dependencyBoundary.methodPluginsAreConsumersOnly, true);
assert.equal(sharedDataAuthority.dependencyBoundary.methodSpecificCopiesAllowed, false);
assert.equal(sharedDataAuthority.governance.silentInferenceAllowed, false);
assert.equal(sharedDataAuthority.providerAuthorityAllowed, false);
assert.equal(sharedDataAuthority.aiAuthorityAllowed, false);

const icrDataContract = dataContracts.entries.find(entry => entry.runtimeCode === 'ICR');
assert.deepEqual(sorted(icrDataContract.producedDataTypes), ['METHOD_INPUT_RECORD', 'REALITY_INPUT_RECORD']);
assert.deepEqual(sorted(icrDataContract.writeAuthority.dataTypes), ['METHOD_INPUT_RECORD', 'REALITY_INPUT_RECORD']);
assert.equal(icrDataContract.permissions.evidencePromotion, 'DENY');
for (const runtimeCode of ['MR', 'HDR', 'AST', 'BZR', 'NUM']) {
  const entry = dataContracts.entries.find(item => item.runtimeCode === runtimeCode);
  assert.ok(entry.consumedDataTypes.includes('METHOD_INPUT_RECORD'));
  assert.ok(!entry.consumedDataTypes.includes('ACCOUNT_RECORD'));
  assert.ok(!entry.readAuthority.dataTypes.includes('ACCOUNT_RECORD'));
}

assert.equal(canonicalContract.rules.canonicalInputIsVerifiedFactAuthority, false);
assert.equal(canonicalContract.rules.providerMayCreateCanonicalInput, false);
assert.equal(birthContract.authorityHandoff.verifiedBirthFactOwner, 'SHARED_DATA_AUTHORITY');
assert.equal(birthContract.authorityHandoff.privacyAndRetentionOwner, 'RDG');
assert.equal(verificationContract.rules.projectionEligibilityFailsClosed, true);
assert.equal(projectionContract.projectionMode, 'REFERENCE_ONLY_VIA_ICR');
assert.equal(projectionContract.rules.methodMayReadCustomerDatabase, false);
assert.equal(projectionContract.rules.methodMayReadCanonicalInputDirectly, false);
assert.equal(projectionContract.rules.methodSpecificPersistentCopyAllowed, false);
assert.equal(inputTypeRegistry.instances.length, 0);
assert.equal(requirementRegistry.instances.length, 0);
assert.equal(inputTypeRegistry.rules.registryStoresUserInput, false);
assert.equal(requirementRegistry.rules.registryStoresMethodInput, false);

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  strictTypes: false,
  formats: { 'date-time': value => Number.isFinite(Date.parse(value)) }
});
const validateBirth = ajv.compile(readJson(`${base}/schemas/birth-data-v1.schema.json`));
const validateCanonical = ajv.compile(readJson(`${base}/schemas/canonical-input-v1.schema.json`));
const validateVerified = ajv.compile(readJson(`${base}/schemas/verified-input-v1.schema.json`));
const validateProjection = ajv.compile(readJson(`${base}/schemas/method-input-projection-v1.schema.json`));

const canonical = buildCanonicalInput(canonicalRequest, inputTypeRegistry, rdg, canonicalContract);
assert.equal(validateCanonical(canonical), true, JSON.stringify(validateCanonical.errors));
assert.equal(validateBirth(canonical.payload.birthData), true, JSON.stringify(validateBirth.errors));
assertCanonicalInputDigest(canonical);
const reorderedCanonicalRequest = clone(canonicalRequest);
reorderedCanonicalRequest.provenance.sourceReferences.reverse();
reorderedCanonicalRequest.lineage.upstreamIntakeReferences.reverse();
reorderedCanonicalRequest.governanceBindings.purposeCodes.reverse();
const canonicalRepeat = buildCanonicalInput(reorderedCanonicalRequest, inputTypeRegistry, rdg, canonicalContract);
assert.deepEqual(canonicalRepeat, canonical);
assert.equal(canonicalRepeat.canonicalInputDigest, canonical.canonicalInputDigest);

expectThrow(() => buildCanonicalInput(invalidCanonicalRequest, inputTypeRegistry, rdg, canonicalContract), 'ICR_FORBIDDEN_INPUT_FIELD:');
const providerRequest = clone(canonicalRequest);
providerRequest.provenance.providerUsed = true;
expectThrow(() => buildCanonicalInput(providerRequest, inputTypeRegistry, rdg, canonicalContract), 'ICR_PROVIDER_OR_AI_CANONICAL_INPUT_FORBIDDEN');
const wrongRetentionRequest = clone(canonicalRequest);
wrongRetentionRequest.governanceBindings.retentionClass = 'UNKNOWN_RETENTION';
expectThrow(() => buildCanonicalInput(wrongRetentionRequest, inputTypeRegistry, rdg, canonicalContract), 'ICR_RDG_RETENTION_INVALID');
const tamperedCanonical = clone(canonical);
tamperedCanonical.payload.birthData.localTime = '11:30:00';
expectThrow(() => assertCanonicalInputDigest(tamperedCanonical), 'ICR_CANONICAL_INPUT_DIGEST_INVALID');
const unknownBirth = normalizeBirthData({
  localDate: null,
  localTime: null,
  precision: 'unknown',
  calendarCode: 'PROLEPTIC_GREGORIAN',
  placeName: null,
  sourceTimezoneText: null,
  uncertaintyMinutes: null,
  coordinate: null,
  subjectConfirmed: false,
  evidenceReferences: []
});
assert.equal(unknownBirth.localTime, null);
assert.equal(unknownBirth.precision, 'unknown');
expectThrow(() => normalizeBirthData({ ...unknownBirth, localTime: '00:00:00' }), 'ICR_BIRTH_UNKNOWN_REPRESENTATION_INVALID');

const verified = verifyCanonicalInput(canonical, verificationRequest, inputTypeRegistry, rdg);
assert.equal(validateVerified(verified), true, JSON.stringify(validateVerified.errors));
assert.equal(verified.verificationState, 'VERIFIED');
assert.equal(verified.projectionEligibility, 'ELIGIBLE');
assert.equal(Object.hasOwn(verified, 'payload'), false);
assertVerifiedInputDigest(verified);
const reorderedVerification = clone(verificationRequest);
reorderedVerification.fieldDecisions.reverse();
reorderedVerification.authorityBindings.reverse();
const verifiedRepeat = verifyCanonicalInput(canonical, reorderedVerification, inputTypeRegistry, rdg);
assert.deepEqual(verifiedRepeat, verified);

const partialRequest = clone(verificationRequest);
partialRequest.fieldDecisions.find(entry => entry.fieldPath === 'birthData.localTime').state = 'UNKNOWN';
partialRequest.fieldDecisions.find(entry => entry.fieldPath === 'birthData.localTime').evidenceReferences = [];
const partial = verifyCanonicalInput(canonical, partialRequest, inputTypeRegistry, rdg);
assert.equal(partial.verificationState, 'PARTIALLY_VERIFIED');
assert.equal(partial.projectionEligibility, 'BLOCKED');
expectThrow(() => projectMethodInput(partial, projectionRequest, requirementRegistry, rdg), 'ICR_VERIFIED_INPUT_REQUIRED');
const optionalUnknownRequest = clone(verificationRequest);
optionalUnknownRequest.fieldDecisions.push({
  fieldPath: 'birthData.coordinate',
  state: 'UNKNOWN',
  evidenceReferences: []
});
assert.equal(
  verifyCanonicalInput(canonical, optionalUnknownRequest, inputTypeRegistry, rdg).verificationState,
  'PARTIALLY_VERIFIED'
);
const missingDecision = clone(verificationRequest);
missingDecision.fieldDecisions.pop();
expectThrow(() => verifyCanonicalInput(canonical, missingDecision, inputTypeRegistry, rdg), 'ICR_REQUIRED_FIELD_DECISION_MISSING:');
const aiVerification = { ...clone(verificationRequest), verifierClass: 'AI' };
expectThrow(() => verifyCanonicalInput(canonical, aiVerification, inputTypeRegistry, rdg), 'ICR_PROVIDER_VERIFIER_FORBIDDEN');
const duplicateBindingCodeRequest = clone(verificationRequest);
duplicateBindingCodeRequest.authorityBindings[1].bindingCode = duplicateBindingCodeRequest.authorityBindings[0].bindingCode;
expectThrow(
  () => verifyCanonicalInput(canonical, duplicateBindingCodeRequest, inputTypeRegistry, rdg),
  'ICR_DUPLICATE_BINDING_CODE'
);

const methodInput = projectMethodInput(verified, projectionRequest, requirementRegistry, rdg);
assert.equal(validateProjection(methodInput), true, JSON.stringify(validateProjection.errors));
assert.equal(methodInput.dataAccessMode, 'REFERENCE_ONLY_VIA_ICR');
assert.equal(methodInput.customerDatabaseReadAllowed, false);
assert.equal(methodInput.canonicalInputDirectReadAllowed, false);
assert.equal(methodInput.productionExecutionAllowed, false);
assert.equal(Object.hasOwn(methodInput, 'payload'), false);
assert.deepEqual(methodInput.bindingReferences.map(binding => binding.recordType), ['BIRTH_RECORD', 'COORDINATE', 'TIMEZONE']);
const { methodInputDigest, ...methodInputBase } = methodInput;
assert.equal(methodInputDigest, stableDigest(methodInputBase));
assert.deepEqual(projectMethodInput(verified, projectionRequest, requirementRegistry, rdg), methodInput);
expectThrow(
  () => projectMethodInput(verified, { ...projectionRequest, methodCode: 'NUMEROLOGY' }, requirementRegistry, rdg),
  'ICR_METHOD_INPUT_REQUIREMENT_UNRESOLVED'
);
expectThrow(
  () => projectMethodInput(verified, { ...projectionRequest, customerRecord: {} }, requirementRegistry, rdg),
  'ICR_METHOD_DIRECT_DATA_FIELD_FORBIDDEN:'
);
const missingBinding = clone(verified);
missingBinding.authorityBindings = missingBinding.authorityBindings.filter(binding => binding.recordType !== 'TIMEZONE');
delete missingBinding.verifiedInputDigest;
missingBinding.verifiedInputDigest = stableDigest(missingBinding);
expectThrow(() => projectMethodInput(missingBinding, projectionRequest, requirementRegistry, rdg), 'ICR_METHOD_BINDING_REQUIRED:TIMEZONE');

for (const methodCode of ['HUMAN_DESIGN', 'ASTROLOGY', 'BAZI']) {
  const requirement = requirementRegistry.entries.find(entry => entry.methodCode === methodCode);
  const method = methodRegistry.methods.find(entry => entry.methodCode === methodCode);
  assert.equal(requirement.pluginCode, method.pluginCode);
  assert.equal(requirement.foundationProjectionAllowed, true);
  assert.equal(requirement.productionExecutionAllowed, false);
}
assert.equal(methodRegistry.methods.some(entry => entry.methodCode === 'NUMEROLOGY'), false);
assert.equal(requirementRegistry.entries.find(entry => entry.methodCode === 'NUMEROLOGY').foundationProjectionAllowed, false);
assert.ok(requirementRegistry.entries.every(entry => entry.productionExecutionAllowed === false));

assert.equal(freeze.status, 'FROZEN_FOUNDATION');
assert.deepEqual(freeze.completedWork, ['ICR-W0', 'ICR-W1', 'ICR-W2', 'ICR-W3', 'ICR-W4']);
assert.equal(freeze.authorityReconciliation.operationalIntakePreserved, true);
assert.equal(freeze.authorityReconciliation.customerDatabaseReadByMethodAllowed, false);
assert.ok(Object.values(freeze.nonActivation).every(value => value === false));
for (const output of freeze.frozenOutputs) assert.ok(fs.existsSync(path.join(root, output)), `missing freeze output: ${output}`);

assert.equal(packageJson.scripts['check:icr-w0-w4'], 'node scripts/check-icr-w0-w4-input-foundation.mjs');
assert.equal(packageJson.scripts['check:icr-foundation'], 'npm run check:icr-w0-w4');
assert.ok(packageJson.scripts.postcheck.startsWith(
  'npm run check:governance-data-closure && npm run check:alr-foundation && npm run check:alr-capability && npm run check:alr-learning-architecture && npm run check:car-reconciliation && npm run check:icr-foundation && '
));

console.log('ICR-W0-W4 input foundation check passed.');
