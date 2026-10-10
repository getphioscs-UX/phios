import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const readJson = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const must = path => { assert.ok(fs.existsSync(path), `Missing: ${path}`); return readJson(path); };
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

const contract = must('content/professional/method-client-delivery/contracts/canonical-birth-input-contract-v1.json');
const schema = must('content/professional/method-client-delivery/schemas/canonical-birth-input-v1.schema.json');
const matrix = must('content/professional/method-client-delivery/registries/method-input-requirement-matrix-v1.json');
const hdr = must('content/professional/method-client-delivery/registries/hdr-input-requirement-profile-v1.json');
const acceptance = must('content/professional/method-client-delivery/acceptance/mcd-3-canonical-input-acceptance-v1.json');
const mcd0 = must('content/professional/method-client-delivery/contracts/mcd-0-method-client-delivery-authority-boundary-v1.json');
const mpaInput = must('content/professional/method-production-activation/contracts/mpa-canonical-method-input-contract-v1.json');
const mpaBirth = must('content/professional/method-production-activation/contracts/mpa-birth-initialization-data-runtime-v1.json');
const mpaTemporal = must('content/professional/method-production-activation/contracts/mpa-temporal-spatial-resolution-v1.json');
const astTz = must('content/professional/method-production-activation/registries/mpa-ast-timezone-authority-resolution-v1.json');
const bzrTz = must('content/professional/method-production-activation/registries/mpa-bzr-timezone-authority-resolution-v1.json');
const astBoundary = must('content/professional/core-method-runtime/ast-runtime-boundary-v1.json');
const bzrBoundary = must('content/professional/core-method-runtime/bzr-runtime-boundary-v1.json');
const numBoundary = must('content/professional/core-method-runtime/num-runtime-boundary-v1.json');
const hdrMcd1 = must('content/professional/method-client-delivery/resolutions/mcd-1-hdr-restricted-method-resolution-v1.json');
const mpaMcd1 = must('content/professional/method-production-activation/successors/mpa-mcd-1-production-authority-successor-v1.json');

assert.equal(contract.schemaVersion, 'PHI-OS-MCD-3-CANONICAL-BIRTH-INPUT-CONTRACT-v1.0.0');
assert.equal(contract.status, 'ACTIVE_SINGLE_BIRTH_INPUT_CONTRACT_NO_EXECUTION_AUTHORITY');
assert.equal(contract.canonicalObject, 'CanonicalBirthInput');
assert.deepEqual(contract.canonicalFields, ['birthDate','birthTime','birthPlace','timezone','timeAccuracy','locale','consent','inputVersion']);
assert.equal(contract.singleEntryRule.clientEntersBirthDataOnce, true);
assert.equal(contract.singleEntryRule.methodSpecificDuplicateEntryRequired, false);
assert.equal(contract.singleEntryRule.canonicalInputMutationByMethodForbidden, true);
assert.equal(mcd0.phaseBoundary.canonicalInputBeginsAt, 'MCD-3');
assert.equal(contract.authorityBoundary.mcd3DoesNotCreateMcd2AdapterAuthority, true);
assert.equal(contract.authorityBoundary.mcd3DoesNotExecuteMethods, true);
assert.equal(contract.authorityBoundary.inputCompletenessDoesNotGrantDispatch, true);

for (const key of ['placeNotCoordinates','coordinatesNotTimezone','timezoneNotUtcOffset','placeNotTimezone','relatedButIndependentValues']) {
  assert.equal(contract.independenceRules[key], true, key);
}
for (const key of ['unknownMustRemainUnknown','unknownBirthTimeRequiresNull','unknownBirthTimeRequiresTimeAccuracyUnknown','unknownCoordinatesRemainNull','unknownTimezoneRemainsNull','unknownUtcOffsetAtBirthRemainsNull','fabricatedDefaultsForbidden','runtimeSuccessMayNotJustifyDefaultFilling']) {
  assert.equal(contract.unknownPreservation[key], true, key);
}
assert.deepEqual(contract.fieldContract.birthTime.forbiddenSyntheticDefaults, ['00:00:00','12:00:00','06:00:00','00:00','12:00','06:00']);
assert.equal(mpaInput.rules.silentDefaultsForbidden, true);
assert.equal(mpaInput.rules.unknownMustRemainExplicit, true);
assert.equal(mpaBirth.rules.unknownBirthTimeMayNotBecome1200, true);
assert.equal(mpaBirth.rules.unknownTimezoneMayNotUseCurrentTimezone, true);
assert.equal(mpaBirth.rules.unknownCoordinatesMayNotUsePlaceCentroidWithoutGovernedResolution, true);

assert.equal(contract.historicalTimezone.authorityBinding.authorityCode, 'IANA_TZDB');
assert.equal(contract.historicalTimezone.authorityBinding.releaseVersion, '2026c');
assert.equal(contract.historicalTimezone.authorityBinding.authorityBindingDigest, astTz.authorityBindingDigest);
assert.equal(astTz.authorityBindingDigest, bzrTz.authorityBindingDigest);
assert.equal(astTz.historicalTimezonePolicy.currentOffsetFallbackForbidden, true);
assert.equal(astTz.historicalTimezonePolicy.unknownTimezoneGuessForbidden, true);
assert.equal(mpaTemporal.rules.currentTimezoneFallbackForbidden, true);
assert.equal(mpaTemporal.rules.unknownTimeMayNotCreateUtcInstant, true);
assert.equal(mpaTemporal.rules.unknownLocationMayNotCreateCoordinates, true);
for (const key of ['utcOffsetAtBirthMustComeFromHistoricalAuthority','dstTransitionMustComeFromPinnedAuthority','currentOffsetFallbackForbidden','browserTimezoneFallbackForbidden','placeNameAloneMayNotGuessTimezone','coordinatesAloneMayNotGuessTimezoneWithoutGovernedResolver','insufficientBirthInstantKeepsOffsetUnknown']) {
  assert.equal(contract.historicalTimezone[key], true, key);
}

assert.equal(schema.type, 'object');
assert.equal(schema.additionalProperties, false);
assert.deepEqual(schema.required, contract.canonicalFields);
assert.equal(schema.properties.inputVersion.const, 'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0');
assert.deepEqual(schema.properties.timeAccuracy.enum, ['EXACT','APPROXIMATE','UNKNOWN']);
assert.deepEqual(schema.properties.locale.enum, ['en','zh-Hans']);
assert.ok(schema.allOf.some(x => x.if?.properties?.timeAccuracy?.const === 'UNKNOWN' && x.then?.properties?.birthTime?.type === 'null'));

assert.equal(matrix.status, 'ACTIVE_CAPABILITY_SCOPED_REQUIREMENTS_NO_EXECUTION_GRANT');
assert.deepEqual(matrix.classificationVocabulary, ['REQUIRED','OPTIONAL','UNKNOWN_SAFE','DEGRADE_SUPPORTED','BLOCKING','POLICY_DEPENDENT']);
assert.deepEqual(matrix.methods.map(x => x.pluginCode), ['AST','BZR','NUM','HDR']);
assert.equal(matrix.globalRules.oneCanonicalInputMayServeMultipleMethods, true);
assert.equal(matrix.globalRules.missingValuesMayNotBeGuessed, true);
assert.equal(matrix.globalRules.inputReadinessDoesNotEqualDispatchAuthority, true);

const byCode = Object.fromEntries(matrix.methods.map(x => [x.pluginCode, x]));
const ast = byCode.AST, bzr = byCode.BZR, num = byCode.NUM, hm = byCode.HDR;
assert.equal(ast.fieldMatrix.date, 'REQUIRED');
assert.equal(ast.fieldMatrix.time, 'REQUIRED');
assert.equal(ast.fieldMatrix.birthTimezone, 'REQUIRED');
assert.equal(ast.fieldMatrix.unknownTime, 'BLOCKING');
assert.equal(ast.currentMcd1Scope, 'CORE_10_PLANET_PROJECTION_NO_HOUSES_NO_ASPECTS_NO_NODES');
assert.equal(astBoundary.inputBoundary.fabricatedBirthTimeAllowed, false);
assert.equal(astBoundary.inputBoundary.unknownBirthTimePolicy, 'fail_closed_for_houses_and_angles');
const mpaAst = mpaInput.methodProfiles.find(x => x.pluginCode === 'AST');
for (const f of ['birthDate','birthTime','birthPlace','timezone']) assert.ok(mpaAst.requiredForCalculation.includes(f), `AST upstream required field missing: ${f}`);

assert.equal(bzr.fieldMatrix.time, 'POLICY_DEPENDENT');
assert.equal(bzr.fieldMatrix.unknownTime, 'DEGRADE_SUPPORTED');
assert.ok(bzr.unknownSafe.some(x => x.includes('THREE_PILLARS')));
assert.equal(bzrBoundary.inputBoundary.unknownBirthTimePolicy, 'three_pillars_only_hour_unresolved');
assert.equal(bzrBoundary.inputBoundary.fabricatedHourPillarAllowed, false);
const mpaBzr = mpaInput.methodProfiles.find(x => x.pluginCode === 'BZR');
assert.ok(mpaBzr.conditional.some(x => x.capability === 'THREE_PILLARS' && x.unknownBirthTimeAllowed === true && x.hourPillarMustRemainUnresolved === true));
assert.ok(mpaBzr.conditional.some(x => x.capability === 'FOUR_PILLARS' && x.birthTimeRequired === true));
assert.ok(mpaBzr.conditional.some(x => x.capability === 'LUCK_CYCLE' && x.birthTimeRequired === true));

assert.equal(num.fieldMatrix.date, 'REQUIRED');
assert.equal(num.fieldMatrix.time, 'OPTIONAL');
assert.equal(num.fieldMatrix.unknownTime, 'UNKNOWN_SAFE');
assert.equal(num.fieldMatrix.birthTimezone, 'POLICY_DEPENDENT');
assert.equal(numBoundary.inputBoundary.timezoneRequiredForDateSelection, true);
const mpaNum = mpaInput.methodProfiles.find(x => x.pluginCode === 'NUM');
assert.deepEqual(mpaNum.requiredForCalculation, ['birthDate','calendarCode']);
assert.ok(mpaNum.optional.includes('birthTime'));

assert.equal(hdr.status, 'REGISTERED_INPUT_PROFILE_PRODUCTION_BLOCKED');
assert.equal(hdr.requirementProfile.birthTime.classification, 'REQUIRED');
assert.equal(hdr.requirementProfile.birthTime.unknownPolicy, 'FAIL_CLOSED_FOR_FULL_INTERNAL_PATH');
assert.equal(hdr.requirementProfile.coordinates.classification, 'REQUIRED');
assert.equal(hm.fieldMatrix.coordinates, 'REQUIRED');
assert.equal(hdr.authorityGate.state, 'BLOCKED');
assert.equal(hdr.authorityGate.productionEligible, false);
assert.equal(hdr.authorityGate.professionalEligible, false);
assert.equal(hdr.authorityGate.dispatchAllowed, false);
assert.equal(hdr.authorityGate.executionMode, 'validation_only');
assert.equal(hdr.authorityGate.inputCompleteDoesNotEqualExecutable, true);
assert.equal(hdr.authorityGate.mpaBlockPrecedesInputReadiness, true);
assert.equal(hdr.authorityGate.productionCoreInvocationAllowed, false);
assert.equal(hdr.controlledPublicLabelReservedForFutureGovernanceOnly.currentlyRenderable, false);
assert.equal(hdrMcd1.currentAuthority.state, 'BLOCKED');
assert.equal(hdrMcd1.currentAuthority.dispatchAllowed, false);
const mpaHdr = mpaMcd1.methods.find(x => x.pluginCode === 'HDR');
assert.equal(mpaHdr.state, 'BLOCKED');
assert.equal(mpaHdr.dispatchAllowed, false);
assert.ok(hm.blocking.includes('MPA_POLICY_BLOCKED'));

// Preserve every upstream input / authority artifact byte-for-byte.
for (const {path, sha256: expected} of Object.values(contract.preservedEvidence)) {
  assert.equal(sha256(path), expected, `MCD-3 must not rewrite upstream authority: ${path}`);
}

assert.equal(acceptance.status, 'ACCEPTED_CANONICAL_INPUT_CONTRACT_NO_EXECUTION');
for (const key of ['singleBirthInputEstablished','historicalTimezoneAuthorityPinned','unknownBirthTimeRemainsNull','methodRequirementMatrixEstablished','hdrRequirementProfileRegistered','hdrInputCompletenessCannotBypassMpaBlock','hdrProductionDispatchStillForbidden','mcd3CreatesNoMethodExecution','mcd3CreatesNoMcd2AdapterClaim']) {
  assert.equal(acceptance.acceptedFacts[key], true, key);
}
assert.equal(contract.nextWork, 'MCD-4');
assert.equal(matrix.nextWork, 'MCD-4');
assert.equal(acceptance.nextWork, 'MCD-4');

console.log('✓ MCD-3 Single Canonical Birth Input passed.');
console.log('  One CanonicalBirthInput now preserves Date / Time / Place / Coordinates / Historical Timezone as independent governed values; unknowns cannot be filled with synthetic defaults.');
console.log('  AST / BZR / NUM requirements are capability-scoped; HDR requirements are fully registered but MPA BLOCKED remains prior to input readiness, so HDR Production invocation is still impossible.');
