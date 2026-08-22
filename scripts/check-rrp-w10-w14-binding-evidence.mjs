import assert from 'node:assert/strict';
import fs from 'node:fs';

const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const BASE = 'content/products/runtime-reading';
const prefix = '812d7c8';
const w10 = readJson(`${BASE}/contracts/runtime-reading-convergence-contract-v1.json`);
const w11 = readJson(`${BASE}/contracts/runtime-reading-reality-binding-v1.json`);
const w12 = readJson(`${BASE}/contracts/runtime-reading-carrier-boundary-v1.json`);
const w13 = readJson(`${BASE}/contracts/runtime-reading-timeline-binding-v1.json`);
const w14 = readJson(`${BASE}/contracts/runtime-reading-evidence-label-v1.json`);
const acceptance = readJson(`${BASE}/acceptance/runtime-reading-w0-w14-acceptance-v1.json`);
const rmo = readJson('content/runtime/reality-model-runtime/contracts/canonical-reality-object-v1.json');
const rre = readJson('content/runtime/reality-readout-engine/contracts/rre-authority-boundary-v1.json');
const pr = readJson('content/runtime/professional-runtime/contracts/professional-authority-boundary-v2.json');
const cmrCross = readJson('content/professional/canonical-meaning-runtime/schemas/cross-method-meaning-convergence-v1.schema.json');
const pkg = readJson('package.json');

for (const doc of [w10,w11,w12,w13,w14]) assert.ok(String(doc.baselineCommit).startsWith(prefix), `${doc.work} baseline drift`);

assert.equal(w10.work, 'RRP-W10');
assert.deepEqual(w10.classificationValues, ['CONVERGENT','DIVERGENT','INSUFFICIENT','NOT_COMPARABLE']);
assert.equal(w10.requiredInputState, 'ADMITTED_CANONICAL_MEANING_REFERENCES_ONLY');
assert.equal(cmrCross.properties.status.const, 'validation_only');
assert.equal(w10.rules.convergentMeansObjectiveTruth, false);
assert.equal(w10.rules.divergentSignalsMayBeCollapsed, false);
assert.equal(w10.rules.rawProjectionComparisonMayCreateMeaning, false);
assert.equal(w10.rules.insufficientEvidenceMustRemainExplicit, true);
assert.equal(w10.rules.notComparableMustRemainExplicit, true);
assert.equal(w10.rules.sourceIndependenceMustBePreserved, true);

assert.equal(w11.work, 'RRP-W11');
assert.deepEqual(Object.keys(w11.layers), ['STRUCTURAL_ORIGIN','CURRENT_REALITY']);
assert.equal(w11.layers.STRUCTURAL_ORIGIN.doesNotRepresent, 'CURRENT_REALITY_STATE');
assert.equal(w11.layers.CURRENT_REALITY.doesNotRepresent, 'INITIAL_BIRTH_STRUCTURE');
assert.equal(w11.rules.birthStructureAndCurrentRealityMustRemainDistinct, true);
assert.equal(w11.rules.currentRealityMayBeInferredFromBirthStructure, false);
assert.equal(w11.rules.birthStructureMayOverwriteCurrentReality, false);
assert.equal(w11.rules.currentRealityReadsCurrentOperatingStateNotInitialStructure, true);
assert.equal(w11.rules.realityTruthCreatedByRrp, false);
assert.equal(rmo.rules.realityCreationDoesNotCreateInterpretation, true);

assert.equal(w12.work, 'RRP-W12');
for (const dimension of ['STRUCTURE','INPUT','RHYTHM','SENSITIVITY']) assert.ok(w12.allowedCarrierDimensions.includes(dimension));
for (const forbidden of ['PERSONALITY_INFERENCE','VALUE_JUDGMENT','DESTINY_INTERPRETATION','MEDICAL_DIAGNOSIS']) assert.ok(w12.forbiddenInferences.includes(forbidden), `W12 missing ${forbidden}`);
assert.equal(w12.rules.carrierIsPersonality, false);
assert.equal(w12.rules.carrierIsMedicalDiagnosis, false);
assert.equal(w12.rules.missingCarrierInputMayBeGuessed, false);
assert.equal(w12.rules.methodProjectionMaySubstituteCarrierInput, false);
assert.ok(rre.forbidden.includes('MEDICAL_DIAGNOSIS'));

assert.equal(w13.work, 'RRP-W13');
assert.deepEqual(w13.canonicalSlots, ['t-2','t-1','t0']);
assert.equal(w13.turningPointField, 'turningPoint[]');
assert.deepEqual(w13.provenanceTypes, ['USER_REPORTED','SYSTEM_CALCULATED','SYSTEM_INTERPRETED','PROFESSIONAL_OBSERVED']);
assert.equal(w13.rules.chronologyMayBeInvented, false);
assert.equal(w13.rules.missingTurningPointMayBeInferred, false);
assert.equal(w13.rules.calculatedAndInterpretedMayBeMerged, false);
assert.equal(w13.rules.professionalObservedMayBeSystemGenerated, false);
assert.equal(pr.rules.professionalJudgmentRequiresHumanAttribution, true);

assert.equal(w14.work, 'RRP-W14');
assert.deepEqual(w14.minimumInternalFields, ['sourceType','sourceAuthority','confidence','evidenceStatus']);
assert.equal(w14.rules.everyReportStatementRequiresInternalProvenance, true);
assert.equal(w14.rules.customerPresentationMaySimplifyLabelsDownstream, true);
assert.equal(w14.rules.internalTraceMayBeDeletedByPresentation, false);
assert.equal(w14.rules.evidenceLabelCreatesTruth, false);
assert.equal(w14.rules.confidenceMayBeInvented, false);
assert.equal(w14.rules.professionalSourceRequiresPR, true);
assert.equal(w14.rules.fullStatementTypeRegistryDeferredTo, 'RRP-W17');

assert.equal(acceptance.status, 'FOUNDATION_ACCEPTED_NOT_FINAL_PRODUCT_FREEZE');
assert.equal(acceptance.completedWork.length, 15);
assert.deepEqual(acceptance.completedWork.map(x=>x.work), Array.from({length:15},(_,i)=>`RRP-W${i}`));
for (const item of acceptance.completedWork) {
  assert.equal(item.result, 'PASS');
  assert.ok(fs.existsSync(item.artifact), `Acceptance artifact missing: ${item.artifact}`);
}
assert.equal(acceptance.nextWork, 'RRP-W15');
assert.ok(acceptance.currentLimitations.includes('RRP_NOT_YET_REGISTERED_IN_MRM_S_UNTIL_W27'));
assert.ok(acceptance.currentLimitations.includes('CANONICAL_REPORT_CANDIDATE_DEFINED_AT_W24'));

assert.equal(pkg.scripts['check:rrp-w0-w4'], 'node scripts/check-rrp-w0-w4-authority-product-consent.mjs');
assert.equal(pkg.scripts['check:rrp-w5-w9'], 'node scripts/check-rrp-w5-w9-input-projection-meaning.mjs');
assert.equal(pkg.scripts['check:rrp-w10-w14'], 'node scripts/check-rrp-w10-w14-binding-evidence.mjs');
assert.equal(pkg.scripts['check:rrp-w0-w14'], 'npm run check:rrp-w0-w4 && npm run check:rrp-w5-w9 && npm run check:rrp-w10-w14');
assert.equal(pkg.scripts['check:rrp-foundation'], 'npm run check:rrp-w0-w14');
assert.equal(Object.hasOwn(pkg.scripts, 'check:rrp'), false, 'Do not claim a full RRP checker before W15-W28');

console.log('✓ RRP-W10–W14 Cross-Method, Reality, Carrier, Timeline and Evidence Binding passed.');
console.log('  Convergence cannot become objective truth; current reality remains separate from birth structure; Carrier remains non-personality/non-medical; timeline provenance is typed; every future report statement must remain internally traceable.');
