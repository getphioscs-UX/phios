import assert from 'node:assert/strict';
import fs from 'node:fs';
import {composeAstPlanetSignMeaning} from '../functions/ast-full-production/ast-planet-sign-composition-runtime.js';
import {buildAstMfpRPlanetSignEvidenceUnits} from '../functions/ast-full-production/ast-mfp-r-planet-sign-recovery.js';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ontology=j('content/professional/ast-production/meaning/ast-meaning-ontology-v1.json');
const baseRule=j('content/professional/ast-production/contracts/ast-composite-meaning-rules-v1.json');
const rule=j('content/professional/ast-full-production/recovery/ast-mfp-r-planet-sign-composition-rule-v1.json');
const campaign=j('content/professional/ast-full-production/recovery/ast-mfp-r-planet-sign-machine-campaign-v1.json');
const review=j('content/professional/ast-full-production/recovery/ast-mfp-r-planet-sign-human-review-v1.json');
const admission=j('content/professional/ast-full-production/recovery/ast-mfp-r-planet-sign-production-admission-v1.json');
assert.equal(ontology.entries.filter(x=>x.meaningFamily==='AST_FUNCTIONAL_DRIVER').length,10);
assert.equal(ontology.entries.filter(x=>x.meaningFamily==='AST_DIRECTION_MODE').length,12);
assert.ok(baseRule.components.body.includes('AST_FUNCTIONAL_DRIVER'));assert.ok(baseRule.components.body.includes('AST_DIRECTION_MODE'));
assert.equal(rule.ownerProgram,'AST_FULL_PRODUCTION');assert.equal(rule.rules.humanAdmissionRequiredBeforeCustomerRuntime,true);
assert.equal(rule.status,'PRODUCTION_ADMITTED');assert.equal(rule.productionAdmission,'content/professional/ast-full-production/recovery/ast-mfp-r-planet-sign-production-admission-v1.json');
assert.deepEqual(campaign.coverage,{planetCount:10,signCount:12,localeCount:2,totalCases:240,expectedCases:240});
assert.equal(campaign.actual.passed,240);assert.equal(campaign.actual.failed,0);assert.equal(campaign.actual.deterministicReplayCases,240);
assert.equal(campaign.governance.humanAccepted,true);assert.equal(campaign.governance.productionAdmitted,true);assert.equal(campaign.governance.customerRuntimeUseAllowed,true);
for(const x of campaign.cases){assert.equal(x.status,'PASS');assert.equal(x.boundaries.rendererCreatedMeaning,false);assert.equal(x.boundaries.customerRuntimeUseAllowed,false);assert.equal(x.sourceRefs.length,5)}
for(const locale of ['en','zh-Hans']){const out=composeAstPlanetSignMeaning({planetCode:'SUN',signCode:'ARIES',locale,meaningOntology:ontology,compositionRule:rule});assert.equal(out.state,'MACHINE_CANDIDATE_HUMAN_REVIEW_REQUIRED');assert.equal(out.boundaries.humanAdmissionRequired,true);assert.equal(out.boundaries.customerRuntimeUseAllowed,false);assert.doesNotMatch(out.customerText,/guaranteed outcome|fixed personality|命中注定|必然会发生/i)}
assert.equal(review.status,'HUMAN_ACCEPTED');assert.equal(review.requiredCases,24);assert.equal(review.pending,0);assert.equal(review.accepted,24);assert.equal(review.rejected,0);assert.ok(review.cases.every(x=>x.decision==='ACCEPTED'));
assert.equal(admission.status,'PRODUCTION_ADMITTED');assert.equal(admission.machineEvidence.passed,240);assert.equal(admission.machineEvidence.failed,0);assert.equal(admission.humanEvidence.accepted,24);assert.equal(admission.humanEvidence.rejected,0);assert.equal(admission.humanEvidence.pending,0);assert.equal(admission.productionAllowed,true);assert.equal(admission.customerRuntimeUseAllowed,true);assert.equal(admission.customerPublicationAllowed,true);assert.equal(admission.boundaries.rendererMeaningCreated,false);
const fixture={methodId:'AST',state:'READY_TO_READ',locale:'en',visualModel:{nodes:['SUN','MOON','MERCURY','VENUS','MARS','JUPITER','SATURN','URANUS','NEPTUNE','PLUTO'].map((label,i)=>({role:'BODY',label,value:i*30+5}))},insights:[],technical:{projectionId:'MFP-R-CHECK-PROJECTION',interpretationUnits:[{unitId:'PRIMARY-SUN',semanticTags:['AST','SUN','PRIMARY']}]}};
const productionUnits=buildAstMfpRPlanetSignEvidenceUnits(fixture);assert.equal(productionUnits.length,10);assert.ok(productionUnits.every(x=>x.state==='CUSTOMER_PUBLISHABLE'&&x.boundaries.customerRuntimeUseAllowed===true&&x.boundaries.rendererCreatedMeaning===false));
console.log('✓ MFP-R-AST-001 production successor passed: 240/240 deterministic machine cases + 24/24 human accepted + production admission; base machine candidates remain non-customer, while the method-owned admitted wrapper enables runtime use without renderer meaning.');
