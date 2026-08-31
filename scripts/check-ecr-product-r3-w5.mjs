import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildExternalProfileExtractionIr} from '../functions/external-profile/external-profile-extraction-ir.js';
import {buildExternalProfileConfirmationDraft,confirmExternalProfile} from '../functions/external-profile/external-profile-confirmation.js';
import {buildConfirmedHumanDesignContextTransport} from '../functions/external-profile/human-design-context-transport.js';
import {
  ECR_HD_COMPARISON_IR_VERSION,
  ECR_HD_COMPARISON_RULE_VERSION,
  buildEcrHumanDesignComparisonIR
} from '../functions/external-profile/ecr-human-design-comparison-ir.js';
import {buildBenchmark} from './smr-benchmark-support.mjs';

const acceptance=JSON.parse(fs.readFileSync('content/embodied-configuration/product-r3/acceptance/ecr-r3-w5-ecr-human-design-comparison-ir-v1.json','utf8'));
assert.equal(acceptance.baselineCommit,'ccac579a7e81dc27f7f6403df1c6446fba38bc25');
assert.equal(acceptance.status,'ENGINEERING_COMPLETE');
assert.equal(acceptance.runtimeAuthority.comparisonIrSchemaVersion,ECR_HD_COMPARISON_IR_VERSION);
assert.equal(acceptance.runtimeAuthority.comparisonRuleVersion,ECR_HD_COMPARISON_RULE_VERSION);
assert.equal(acceptance.comparisonModel.fieldToFieldMapping,false);
assert.equal(acceptance.comparisonModel.agreementClaimMayBeCreated,false);
assert.equal(acceptance.canonicalCustomerRoute.customerRendererCreated,false);
assert.equal(acceptance.successorBoundary.w7CurrentRealityBridgeCreated,false);

function confirmedProfile({rich=true,intakeId='ECR-R3-W5-HD-COMPARISON'}={}){
  const pastedText=(rich?[
    'Type: Generator',
    'Strategy: Wait to Respond',
    'Authority: Sacral',
    'Profile: 5/1',
    'Definition: Single Definition',
    'Incarnation Cross: Right Angle Cross of W5 Comparison',
    'Signature: Satisfaction',
    'Not-Self Theme: Frustration',
    'Channels: 43-23 | 29-46',
    'Defined Centers: Ajna, Throat, G Center, Sacral',
    'Open Centers: Head, Spleen, Root',
    'Design activated Gates: 29.1 46.2',
    'Personality activated Gates: 43.5 23.5'
  ]:[
    'Type: Generator',
    'Strategy: Wait to Respond'
  ]).join('\n');
  const extraction=buildExternalProfileExtractionIr({
    intakeId,
    sources:[{sourceType:'CUSTOMER_PASTED_TEXT',sourceAuthority:'CUSTOMER'}],
    pastedText,
    manualFields:rich?{environment:'Markets',cognition:'Inner Vision',motivation:'Hope',perspective:'Possibility',determination:'Low Sound',trajectory:'Observer'}:{}
  });
  return confirmExternalProfile({confirmationDraft:buildExternalProfileConfirmationDraft(extraction),confirmedAt:'2026-08-31T00:00:00.000Z'});
}
function contextOf(profile,locale='zh-Hans'){
  return buildConfirmedHumanDesignContextTransport(profile,{locale,intent:'ECR-R3-W5 comparison regression',generatedAt:'2026-08-31T00:01:00.000Z'});
}

const ecr=await buildBenchmark('ECR');
const richContext=contextOf(confirmedProfile());
const ir=buildEcrHumanDesignComparisonIR({acceptedEcrReading:ecr.methodResult,humanDesignContext:richContext,locale:'zh-Hans'});
const repeated=buildEcrHumanDesignComparisonIR({acceptedEcrReading:ecr.methodResult,humanDesignContext:richContext,locale:'zh-Hans'});
assert.equal(ir.schemaVersion,ECR_HD_COMPARISON_IR_VERSION);
assert.equal(ir.comparisonRuleVersion,ECR_HD_COMPARISON_RULE_VERSION);
assert.equal(ir.publicationState,'COMPARISON_IR_READY');
assert.equal(ir.comparisonDigest,repeated.comparisonDigest,'W5 comparison IR must be deterministic for identical governed inputs');
assert.equal(ir.sourceLineage.ecr.interpretationResultId,ecr.methodResult.technical.interpretationResultId);
assert.equal(ir.sourceLineage.ecr.semanticDigest,ecr.methodResult.technical.semanticDigest);
assert.equal(ir.sourceLineage.humanDesign.profileDigest,richContext.sourceProfileDigest);
assert.equal(ir.sourceLineage.humanDesign.readingDigest,richContext.humanDesignReading.readingDigest);
assert.equal(ir.sourceLineage.humanDesign.authorityClass,'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT');
assert.deepEqual(ir.dimensions.map(item=>[item.dimensionId,item.relationClass]),[
  ['DECISION_NAVIGATION','SHARED_OBSERVATION_DOMAIN'],
  ['CARRIER_ACTION_RESPONSE','COMPLEMENTARY_LENSES'],
  ['ENVIRONMENT_CONTEXT','SHARED_OBSERVATION_DOMAIN'],
  ['EXPRESSION_RELATIONSHIP_INTEGRATION','COMPLEMENTARY_LENSES'],
  ['CHANGE_TIMING_NON_EQUIVALENCE','NO_DIRECT_EQUIVALENCE']
]);
assert.equal(ir.dimensions.every(item=>item.status==='READY'),true);
assert.deepEqual(ir.summary.sharedObservationDomainIds,['DECISION_NAVIGATION','ENVIRONMENT_CONTEXT']);
assert.deepEqual(ir.summary.complementaryLensIds,['CARRIER_ACTION_RESPONSE','EXPRESSION_RELATIONSHIP_INTEGRATION']);
assert.deepEqual(ir.summary.noDirectEquivalenceIds,['CHANGE_TIMING_NON_EQUIVALENCE']);
assert.deepEqual(ir.summary.unmappedEcrInterpretationUnitRefs,[]);
assert.deepEqual(ir.summary.unmappedHumanDesignClaimRefs,[]);

const decision=ir.dimensions.find(item=>item.dimensionId==='DECISION_NAVIGATION');
assert(decision.ecr.interpretationUnitRefs.length>=2);
assert(decision.humanDesign.claimRefs.includes('HD.STRATEGY'));
assert(decision.humanDesign.claimRefs.includes('HD.AUTHORITY'));
assert.equal(decision.relationBoundary.directFieldEquivalence,false);
const timing=ir.dimensions.find(item=>item.dimensionId==='CHANGE_TIMING_NON_EQUIVALENCE');
assert.equal(timing.relationClass,'NO_DIRECT_EQUIVALENCE');
assert(timing.ecr.units.some(unit=>unit.derivationRefs.includes('COMPOSITION_RULE:CX-COMP-ECR-CONFIGURATION-ACTIVATION-v1')));
assert(timing.humanDesign.claimRefs.includes('HD.AUTHORITY'));
assert.equal(timing.relationBoundary.ecrCoordinateMappedToHumanDesignField,false);
for(const dimension of ir.dimensions){
  assert.equal(dimension.relationBoundary.sharedObservationDomainIsNotAgreement,true);
  assert.equal(dimension.relationBoundary.humanDesignFieldMappedToEcrCoordinate,false);
  for(const unit of dimension.ecr.units){
    assert(unit.interpretationUnitId);
    assert(unit.derivationRefs.length);
    assert(unit.meaningRefs.length);
    assert(unit.projectionRefs.length);
  }
  for(const claim of dimension.humanDesign.claims){
    assert.equal(claim.customerConfirmed,true);
    assert.equal(claim.phiosCalculated,false);
    assert.equal(claim.authorityClass,'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT');
    assert(claim.sourceRef);
  }
}
for(const [key,expected] of Object.entries({
  comparisonIrCreated:true,
  customerRendererCreated:false,
  ecrRemainsPhiOsNative:true,
  humanDesignRemainsCustomerSuppliedExternalContext:true,
  phiosHumanDesignCalculationAuthorityCreated:false,
  humanDesignRecalculated:false,
  hdrPublicExecutionUsed:false,
  directFieldEquivalenceCreated:false,
  ecrCoordinateToHumanDesignFieldMappingCreated:false,
  humanDesignFieldToEcrCoordinateMappingCreated:false,
  methodAgreementClaimed:false,
  convergenceClaimed:false,
  compatibilityScoreCreated:false,
  methodVoteCreated:false,
  xpfCountsTowardMethodAgreement:false,
  newEcrMeaningCreated:false,
  newHumanDesignMeaningCreated:false,
  currentRealityEvidenceCreated:false,
  currentRealityConclusionCreated:false,
  rendererCreatesMeaning:false,
  persisted:false,
  runtimeMemoryWritten:false
}))assert.equal(ir.boundaries[key],expected,`W5 boundary drift: ${key}`);

// Incomplete confirmed external charts must stay partial rather than being back-filled or inferred.
const partialContext=contextOf(confirmedProfile({rich:false,intakeId:'ECR-R3-W5-HD-PARTIAL'}));
const partial=buildEcrHumanDesignComparisonIR({acceptedEcrReading:ecr.methodResult,humanDesignContext:partialContext,locale:'en'});
assert.equal(partial.dimensions.find(item=>item.dimensionId==='DECISION_NAVIGATION').status,'READY');
assert.equal(partial.dimensions.find(item=>item.dimensionId==='ENVIRONMENT_CONTEXT').status,'ECR_ONLY');
assert.equal(partial.dimensions.find(item=>item.dimensionId==='EXPRESSION_RELATIONSHIP_INTEGRATION').status,'ECR_ONLY');
assert.equal(partial.dimensions.find(item=>item.dimensionId==='CHANGE_TIMING_NON_EQUIVALENCE').status,'ECR_ONLY');
assert(partial.summary.unmappedHumanDesignClaimRefs.length===0);
assert.equal(partial.boundaries.humanDesignRecalculated,false);

// Fail closed if either authority is not customer publishable.
const badEcr=structuredClone(ecr.methodResult);
badEcr.technical.acceptanceBasis='MACHINE_ONLY';
assert.throws(()=>buildEcrHumanDesignComparisonIR({acceptedEcrReading:badEcr,humanDesignContext:richContext}),error=>error?.code==='ECR_HD_COMPARISON_ECR_PUBLICATION_AUTHORITY_REQUIRED');
const badHd=structuredClone(richContext);
badHd.readingAvailability.customerPublishable=false;
assert.throws(()=>buildEcrHumanDesignComparisonIR({acceptedEcrReading:ecr.methodResult,humanDesignContext:badHd}),error=>error?.code==='ECR_HD_COMPARISON_HD_PUBLICATION_AUTHORITY_REQUIRED');

// W5 must not mutate the W4 transport into a comparison authority; it composes a new downstream IR.
assert.equal(richContext.boundary.ecrHumanDesignComparisonComposed,false);
assert.equal(richContext.boundary.comparisonIrCreated,false);
assert.equal(richContext.boundary.xpfCountsTowardMethodAgreement,false);

const api=fs.readFileSync('functions/api/customer-personal-reality.js','utf8');
for(const token of [
  "from '../external-profile/ecr-human-design-comparison-ir.js'",
  'let ecrHumanDesignComparison=null',
  "result.spec?.methodCode==='EMBODIED_CONFIGURATION'",
  'buildEcrHumanDesignComparisonIR({acceptedEcrReading:ecrAcceptedReading,humanDesignContext,locale})',
  'humanDesignContext,ecrHumanDesignComparison'
])assert(api.includes(token),`W5 canonical API comparison binding missing: ${token}`);
assert.equal(api.includes('ecrHumanDesignComparison=humanDesignContext'),false);

console.log('✓ ECR-R3-W5 ECR × Human Design Comparison IR passed.');
console.log('  Five governed comparison dimensions preserve shared domains, complementary lenses and explicit non-equivalence without field-to-field mapping.');
console.log('  ECR remains PHI OS native; Human Design remains confirmed external context; no agreement score, method vote, reality evidence or customer renderer is created in W5.');
