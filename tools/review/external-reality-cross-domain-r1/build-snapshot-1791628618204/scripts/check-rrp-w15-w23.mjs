import assert from 'node:assert/strict';
import fs from 'node:fs';

const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const BASE = 'content/products/runtime-reading';
const prefix = '3e4f22c';
const w15 = readJson(`${BASE}/registries/runtime-reading-section-registry-v1.json`);
const w16 = readJson(`${BASE}/contracts/runtime-reading-report-architecture-v1.json`);
const w17 = readJson(`${BASE}/registries/runtime-reading-statement-type-registry-v1.json`);
const w18 = readJson(`${BASE}/contracts/runtime-reading-claim-policy-v1.json`);
const w19 = readJson(`${BASE}/contracts/runtime-reading-unknown-contradiction-contract-v1.json`);
const w20 = readJson(`${BASE}/contracts/runtime-reading-interpretation-composition-v1.json`);
const w21 = readJson(`${BASE}/contracts/runtime-reading-professional-judgment-boundary-v1.json`);
const w22 = readJson(`${BASE}/contracts/runtime-reading-navigation-output-v1.json`);
const w23 = readJson(`${BASE}/contracts/rrp-rr-handoff-contract-v1.json`);
const acceptance = readJson(`${BASE}/acceptance/runtime-reading-w15-w23-acceptance-v1.json`);
const w3 = readJson(`${BASE}/registries/runtime-reading-method-availability-v1.json`);
const w9 = readJson(`${BASE}/contracts/runtime-reading-meaning-admission-v1.json`);
const cmr = readJson('content/professional/canonical-meaning-runtime/contracts/canonical-meaning-runtime-v1.json');
const mirApi = readJson('content/interpretation/integration/canonical-interpretation-api-contract-v1.json');
const mirComposition = readJson('content/interpretation/integration/composition-authority-contract-v1.json');
const pr = readJson('content/runtime/professional-runtime/contracts/professional-judgment-contract-v2.json');
const jrNav = readJson('content/runtime/journey-runtime/contracts/navigation-projection-contract-v1.json');
const rne = readJson('content/runtime/reality-navigation-engine/contracts/rne-authority-boundary-v1.json');
const rrAssembly = readJson('content/runtime/customer-report-runtime/contracts/report-assembly-contract-v2.json');
const rrCandidate = readJson('content/runtime/customer-report-runtime/contracts/report-candidate-contract-v2.json');
const rrLifecycle = readJson('content/runtime/customer-report-runtime/registries/report-lifecycle-state-registry-v2.json');

for (const doc of [w15,w16,w17,w18,w19,w20,w21,w22,w23,acceptance]) {
  assert.ok(String(doc.baselineCommit).startsWith(prefix), `${doc.work ?? doc.workRange}: baseline not aligned to 3e4f22c`);
}

assert.equal(w15.work, 'RRP-W15');
assert.deepEqual(w15.semanticGroups.map(x=>`${x.groupCode} ${x.groupName}`), [
  'A FOUNDATION','B STRUCTURAL_RUNTIME','C CURRENT_REALITY','D CARRIER_AND_ENVIRONMENT','E CROSS_RUNTIME_READING','F NAVIGATION_AND_CONTINUITY'
]);
assert.equal(w15.sections.length, 25);
assert.equal(new Set(w15.sections.map(x=>x.sectionId)).size, 25);
assert.equal(w15.legacyReferenceStructure.structureCode, 'LEGACY_REFERENCE_STRUCTURE');
assert.equal(w15.legacyReferenceStructure.legacySectionCount, 22);
assert.equal(w15.legacyReferenceStructure.canonicalAuthority, false);
assert.equal(w15.legacyReferenceStructure.legacyHeadingsFrozen, false);
assert.equal(w15.legacyReferenceStructure.mayDriveCanonicalAssembly, false);
assert.equal(w15.rules.old22HeadingsAreCanonical, false);
assert.equal(w15.rules.sectionOrderOwnedHere, false);
assert.equal(w15.rules.unknownSectionMayBeSilentlyDropped, false);
assert.equal(w15.rules.presentationLayoutFieldsAllowed, false);
const section8 = w15.sections.find(x=>x.sectionId==='RRP-S08');
assert.deepEqual(section8.methodCodes, ['HDR','ZWR']);
assert.equal(section8.combinedHeadingDoesNotMergeAuthorities, true);
for (const code of ['AST','BZR','NUM','HDR','ZWR']) assert.ok(w3.methods.some(x=>x.methodCode===code), `W15 references unknown method ${code}`);

assert.equal(w16.work, 'RRP-W16');
assert.equal(w16.architecture.length, 6);
assert.deepEqual(w16.architecture.map(x=>x.partLabel), ['Reality Snapshot','Structural Runtime','Carrier','Reality Dynamics','Convergence','Navigation']);
assert.deepEqual(w16.architecture.map(x=>x.sectionIds.length), [3,5,5,5,3,4]);
assert.equal(w16.canonicalSectionCount, 25);
const assembledIds = w16.architecture.flatMap(x=>x.sectionIds);
assert.equal(new Set(assembledIds).size, 25);
assert.deepEqual(assembledIds, Array.from({length:25},(_,i)=>`RRP-S${String(i+1).padStart(2,'0')}`));
assert.deepEqual(w16.architecture[1].sectionIds, ['RRP-S04','RRP-S05','RRP-S06','RRP-S07','RRP-S08']);
assert.equal(w16.rules.twentyTwoFlatLegacyHeadingsFrozen, false);
assert.equal(w16.rules.partsAreSemanticCompositionNotPageLayout, true);
assert.equal(w16.rules.pdfPaginationOwnedByRrp, false);
assert.equal(w16.rules.customerPresentationOwnedByRrp, false);

assert.equal(w17.work, 'RRP-W17');
assert.deepEqual(w17.statementTypes.map(x=>x.statementType), ['CALCULATED_FACT','USER_REPORTED_FACT','CANONICAL_MEANING','SYSTEM_INTERPRETATION','PROFESSIONAL_JUDGMENT','NAVIGATION_OPTION','UNKNOWN']);
assert.equal(w17.rules.canonicalMeaningRequiresMeaningAuthority, true);
assert.equal(w17.rules.systemInterpretationRequiresGovernedInterpretationAuthority, true);
assert.equal(w17.rules.professionalJudgmentRequiresPR, true);
assert.equal(w17.rules.navigationOptionIsDecision, false);
assert.equal(w17.rules.unknownMayBeOmittedForCompleteness, false);

assert.equal(w18.work, 'RRP-W18');
assert.ok(w18.preferredAutomaticFraming.en.includes('The available evidence suggests...'));
assert.ok(w18.preferredAutomaticFraming['zh-Hans'].includes('在目前输入与已选择方法中……'));
assert.equal(w18.exampleRejectedClaim, '你的财富不是普通工资型');
assert.ok(w18.prohibitedAutomaticPatterns.includes('METHOD_READING_AS_OBJECTIVE_FACT'));
assert.ok(w18.prohibitedAutomaticPatterns.includes('CONVERGENCE_AS_OBJECTIVE_TRUTH'));
assert.equal(w18.rules.systemInterpretationMustBeEvidenceQualified, true);
assert.equal(w18.rules.llmStylingMayIncreaseCertainty, false);

assert.equal(w19.work, 'RRP-W19');
assert.deepEqual(w19.canonicalStates, ['UNKNOWN','CONTRADICTION','INSUFFICIENT_EVIDENCE']);
assert.ok(w19.reasonCodes.includes('METHOD_NOT_PRODUCTION_AVAILABLE'));
assert.equal(w19.neutralCustomerProjectionExamples.METHOD_NOT_PRODUCTION_AVAILABLE, 'This method was not included.');
assert.equal(w19.rules.unknownIsFirstClass, true);
assert.equal(w19.rules.contradictionMayBeForcedIntoConvergence, false);
assert.equal(w19.rules.missingMethodMayBeBackfilledByLLM, false);
assert.equal(w19.rules.manyUnknownsInvalidateWholeReport, false);

assert.equal(w20.work, 'RRP-W20');
assert.deepEqual(w20.allowedCompositionInputs, ['APPROVED_MEANINGS','CURRENT_REALITY','CARRIER','TIMELINE']);
assert.equal(w20.existingInterpretationAuthority.canonicalApi, 'content/interpretation/integration/canonical-interpretation-api-contract-v1.json');
assert.equal(mirApi.output, 'CanonicalInterpretationResult');
assert.equal(mirComposition.compositionOwnsCanonicalMeaning, false);
assert.equal(cmr.productionStatus, 'validation_only');
assert.equal(w9.currentAuthorityState.automaticMethodMeaningAdmission, 'UNAVAILABLE');
assert.equal(w20.currentMethodMeaningState, 'AUTOMATIC_METHOD_MEANING_UNAVAILABLE_WHILE_CMR_VALIDATION_ONLY');
assert.equal(w20.rules.rrpCreatesSecondInterpretationRuntime, false);
assert.equal(w20.rules.rawPlanetaryLongitudeMayEnterComposition, false);
assert.equal(w20.rules.rawMethodEnginePayloadMayEnterComposition, false);
assert.equal(w20.rules.rawProjectionMayBecomeLifeAdvice, false);
assert.equal(w20.rules.missingMeaningMayBeInvented, false);

assert.equal(w21.work, 'RRP-W21');
assert.equal(w21.productModes['RRP-SELF'].professionalJudgmentAllowed, false);
assert.equal(w21.productModes['RRP-PRO'].professionalJudgmentAllowed, true);
assert.equal(w21.productModes['RRP-PRO'].explicitHumanAttributionRequired, true);
assert.equal(w21.productModes['RRP-PRO'].separateLabellingRequired, true);
assert.equal(pr.rules.onlyPrJudgmentAuthorityCreatesRecord, true);
assert.equal(pr.rules.humanProfessionalAttributable, true);
assert.equal(w21.rules.systemMayImpersonateProfessional, false);
assert.equal(w21.rules.professionalJudgmentMayBeMergedIntoSystemInterpretation, false);

assert.equal(w22.work, 'RRP-W22');
assert.deepEqual(w22.navigationLoop, ['OBSERVE','CLARIFY','CHOOSE','ACT','REVIEW','CONTINUE']);
assert.deepEqual(w22.requiredOutputFields, ['currentReality','majorSignals','uncertainties','possibleDirections','nextObservation','reviewWindow']);
assert.equal(jrNav.rules.chooseForClient, false);
assert.equal(jrNav.rules.automaticSelection, false);
assert.equal(rne.productionStatus, 'validation_only');
assert.equal(w22.rules.navigationIsFortuneTellingConclusion, false);
assert.equal(w22.rules.rrpChoosesForUser, false);
assert.equal(w22.rules.rrpCommandsAction, false);
assert.equal(w22.rules.reviewWindowMayBeInvented, false);
assert.equal(w22.rules.rneValidationOnlyStatusMayBeSilentlyPromoted, false);

assert.equal(w23.work, 'RRP-W23');
assert.deepEqual(w23.authorityFlow, ['RRP','REPORT_CANDIDATE_PACKAGE','RR','REVIEW','APPROVAL','RELEASE']);
assert.equal(w23.handoffObject, 'RuntimeReadingReportCandidate');
assert.equal(w23.payloadContractDeferredTo, 'RRP-W24');
assert.equal(w23.submissionContractCompletionDeferredTo, 'RRP-W28');
assert.equal(rrAssembly.runtimeCode, 'RR');
assert.equal(rrCandidate.runtimeCode, 'RR');
assert.ok(rrLifecycle.states.includes('CANDIDATE'));
assert.ok(rrLifecycle.states.includes('APPROVED'));
assert.ok(rrLifecycle.states.includes('RELEASED'));
assert.deepEqual(w23.rrOwnsStates, rrLifecycle.states);
assert.equal(w23.rules.rrpCreatesSecondReportRuntime, false);
assert.equal(w23.rules.rrpMayFinalizeReport, false);
assert.equal(w23.rules.rrpMayApproveReport, false);
assert.equal(w23.rules.rrpMayReleaseReport, false);
assert.equal(w23.rules.rrpMaySetCustomerVisible, false);
assert.equal(w23.rules.rrpMayOwnPdfRendering, false);
assert.equal(w23.rules.sourceTraceMustSurviveHandoff, true);
assert.equal(w23.rules.unknownsAndContradictionsMustSurviveHandoff, true);

assert.equal(acceptance.status, 'ARCHITECTURE_AND_COMPOSITION_BOUNDARIES_ACCEPTED_NOT_CANDIDATE_PAYLOAD_FREEZE');
assert.deepEqual(acceptance.completedWork.map(x=>x.work), Array.from({length:9},(_,i)=>`RRP-W${i+15}`));
for (const item of acceptance.completedWork) {
  assert.equal(item.result, 'PASS');
  assert.ok(fs.existsSync(item.artifact), `Acceptance artifact missing: ${item.artifact}`);
}
assert.equal(acceptance.nextWork, 'RRP-W24');
assert.ok(acceptance.currentLimitations.includes('RRP_W24_CANONICAL_REPORT_CANDIDATE_PAYLOAD_NOT_YET_FROZEN'));
assert.ok(acceptance.currentLimitations.includes('RRP_W27_MRM_S_REGISTRATION_NOT_YET_COMPLETE'));

console.log('✓ RRP-W15–W23 Section Registry, Architecture, Statement Safety, Uncertainty, Interpretation, Professional Boundary, Navigation and RR Handoff passed.');
console.log('  22 legacy headings remain reference-only; canonical composition is 6 parts / 25 semantic sections; unknowns and contradictions remain first-class; RRP stops at RR handoff and owns neither approval nor release.');
