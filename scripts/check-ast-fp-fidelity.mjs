import assert from 'node:assert/strict';
import Ajv from 'ajv/dist/2020.js';
import {chartFixtures,projectChart,candidateFor,readJson} from './ast-fp-test-support.mjs';
import {createMethodInterpretationCandidate} from '../functions/interpretation-runtime/cx-r12r3b-shared-runtime-v2.js';
import {buildAcceptedMethodCustomerResult} from '../functions/customer-projection/method-customer-reading-v2.js';
import {adaptAstrologyProductionInput} from '../functions/single-method-reading-r2/astrology-production-adapter.js';
import {buildCustomerClaimIR} from '../functions/single-method-reading-r2/customer-claim-ir.js';
import {resolveCustomerPriorities} from '../functions/single-method-reading-r2/customer-priority-resolver.js';
import {composeCustomerThemes} from '../functions/single-method-reading-r2/customer-theme-composer.js';
const validate=new Ajv({strict:false}).compile(readJson('content/customer-experience-rebuild/r12r4b/smr-r2/contracts/customer-reading-claim-ir-v1.schema.json'));
const baseline=readJson('content/professional/ast-full-production/fixtures/ast-fp-legacy-vectors-v1.json');
let checked=0,themeCount=0;
for(const chart of chartFixtures.cases){
 const projection=await projectChart(chart);
 for(const locale of ['en','zh-Hans']){
  const {input,meaningPayload}=await candidateFor(projection,locale);
  const legacy=await createMethodInterpretationCandidate({input,meaningPayload});
  const vector=baseline.vectors.find(v=>v.caseId===chart.id&&v.locale===locale);
  for(const key of ['projectionDigest','semanticDigest','interpretationDigest'])assert.equal(legacy[key],vector[key],`Old admitted version changed: ${chart.id}/${locale}/${key}`);
  const result=await buildAcceptedMethodCustomerResult({canonicalProjection:projection,locale,requestedDepth:'PROFESSIONAL'});
  const envelope=adaptAstrologyProductionInput(result);
  const ir=buildCustomerClaimIR({acceptedMethodReadingEnvelope:envelope});
  for(const original of legacy.interpretationUnits){
   const insight=result.insights.find(x=>x.insightId===original.interpretationUnitId);
   const accepted=envelope.acceptedUnits.find(x=>x.interpretationUnitId===original.interpretationUnitId);
   const claim=ir.claims.find(x=>x.interpretationUnitRefs.includes(original.interpretationUnitId));
   assert.equal(validate(claim),true,JSON.stringify(validate.errors));
   const detail=claim.conditions.find(c=>c?.kind==='UPSTREAM_INTERPRETATION_DETAIL');
   for(const key of ['structuralReason','relationContext','constructiveExpression','frictionExpression','activationConditions','uncertainties','sourceLineage']){
    assert.deepEqual(insight.interpretationDetail[key],original[key]);
    assert.deepEqual(accepted.interpretationDetail[key],original[key]);
    assert.deepEqual(detail[key],original[key]);
   }
   assert.equal(insight.body,original.plainLanguageExplanation);
   assert.equal(claim.structuralMeaning,original.structuralReason);
   assert.deepEqual(detail.observableSignals,original.observableSignals);
   assert.deepEqual(detail.alternativeInterpretations,original.alternativeInterpretations);
   assert.deepEqual(detail.realityComparisonQuestions,original.realityComparisonQuestions);
   assert.deepEqual(claim.counterEvidenceRefs,[],'Do not invent counterevidence during transport');
   checked++;
  }
  const priorities=resolveCustomerPriorities({claimCollection:ir,customerIntent:{intentId:'EXPRESSION'}});
  const themes=composeCustomerThemes({priorityResolution:priorities});
  for(const theme of themes.themes){
   const primary=ir.claims.find(c=>c.claimId===theme.primaryClaimRef),detail=primary.conditions.find(c=>c?.kind==='UPSTREAM_INTERPRETATION_DETAIL');
   assert.equal(theme.whatStandsOut,primary.structuralMeaning);
   assert.equal(theme.whyItMatters,detail.relationContext);
   assert.equal(theme.howItMayShow,detail.constructiveExpression);
   assert.equal(theme.whenItMayDiffer,detail.frictionExpression);
   for(const q of detail.realityComparisonQuestions)assert.ok(theme.realityQuestionRefs.includes(`QUESTION:${q}`));
   themeCount++;
  }
  assert.equal(result.technical.compositionRuleVersion,'CX-R12R3B-COMPOSITION-RULES-v1.0.0');
  assert.equal(result.technical.lifecycle.liveCustomerHumanReviewed,false);
  const noDetail=structuredClone(result);noDetail.insights.forEach(i=>delete i.interpretationDetail);
  const olderIR=buildCustomerClaimIR({acceptedMethodReadingEnvelope:adaptAstrologyProductionInput(noDetail)});
  assert.ok(olderIR.claims.every(c=>c.conditions.length===0),'Old envelopes remain compatible');
  assert.throws(()=>adaptAstrologyProductionInput({...result,state:'HUMAN_REVIEW_REQUIRED'}));
 }
}
console.log(JSON.stringify({status:'PASS',baselineDigestVectors:baseline.vectors.length,acceptedUnitsChecked:checked,themeDetailTransfers:themeCount,existingIRSchema:'PASS',newAdmissionCreated:false},null,2));
