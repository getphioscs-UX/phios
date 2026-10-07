// Test harness only: invoke existing RNE owners and their native fixtures. No new navigation implementation.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import {buildCurrentPosition,buildTargetState,buildNavigationConstraintGraph,generateBoundedOptionSet} from './lib/reality-navigation-engine/rne-navigation-foundation-v1.mjs';
import {buildNavigationRiskContext,buildOptionRecoverabilityAssessment,buildDecisionSupportSet,buildScenarioSimulationSet,buildRouteCandidateSet} from './lib/reality-navigation-engine/rne-navigation-decision-support-v1.mjs';
import {buildJrNavigationIntelligenceHandoff,buildProfessionalReviewGate,buildNavigationOutcomeFeedback,buildNavigationValidationRequest} from './lib/reality-navigation-engine/rne-integration-feedback-v1.mjs';
const base='content/runtime/reality-navigation-engine';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const contract=n=>read(base+'/contracts/'+n+'-contract-v1.json'),registry=n=>read(base+'/registries/canonical-'+n+'-registry-v1.json'),fixture=n=>read(base+'/fixtures/'+n+'.request.valid.json');
let providerRequests=0;const originalFetch=globalThis.fetch;globalThis.fetch=async()=>{providerRequests++;throw Error('PROVIDER_FORBIDDEN');};
try{
const position=buildCurrentPosition(fixture('current-position'),contract('current-position'));
const target=buildTargetState(position,fixture('target-state'),registry('target-source'),contract('target-state'));
const graph=buildNavigationConstraintGraph(position,target,fixture('navigation-constraint-graph'),registry('navigation-constraint-role'),contract('navigation-constraint-graph'));
const optionSet=generateBoundedOptionSet(position,target,graph,fixture('bounded-option-generation'),registry('option-class'),contract('bounded-option-generation'));
const risk=buildNavigationRiskContext(position,graph,optionSet,fixture('navigation-risk-context'),contract('navigation-risk-context'));
const recovery=buildOptionRecoverabilityAssessment(optionSet,risk,fixture('option-recoverability'),read('content/runtime/reality-readout-engine/registries/canonical-recovery-reading-registry-v1.json'),registry('recoverability-class'),contract('recovery-window'));
const decision=buildDecisionSupportSet(optionSet,risk,recovery,fixture('decision-support'),registry('decision-support-pattern'),contract('decision-support'));
const scenario=buildScenarioSimulationSet(optionSet,decision,recovery,fixture('scenario-simulation'),registry('scenario-mode'),contract('scenario-simulation'));
const routes=buildRouteCandidateSet(position,target,optionSet,decision,scenario,fixture('route-runtime'),registry('route-stage'),contract('route-runtime'));
const jrContract=read(base+'/contracts/rne-jr-integration-contract-v1.json'),profContract=contract('professional-boundary'),feedbackContract=contract('outcome-feedback'),valContract=contract('navigation-effectiveness-validation');
const jr=buildJrNavigationIntelligenceHandoff(position,target,optionSet,risk,decision,scenario,routes,fixture('jr-navigation-integration'),jrContract);
const prof=buildProfessionalReviewGate(risk,routes,fixture('professional-boundary'),registry('professional-review-trigger'),profContract);
const feedback=buildNavigationOutcomeFeedback(routes,fixture('outcome-feedback'),feedbackContract);
const validation=buildNavigationValidationRequest(jr,prof,feedback,fixture('navigation-validation'),registry('navigation-validation-check'),valContract);
const outputs=[['current-position',position],['target-state',target],['navigation-constraint-graph',graph],['bounded-navigation-option-set',optionSet],['navigation-risk-context',risk],['option-recoverability-assessment',recovery],['decision-support-set',decision],['scenario-simulation-set',scenario],['route-candidate-set',routes],['jr-navigation-intelligence-handoff',jr],['professional-review-gate',prof],['navigation-outcome-feedback',feedback],['navigation-validation-request',validation]];
const ajv=new Ajv2020({strict:true,allErrors:true});for(const [name,record]of outputs){const validate=ajv.compile(read(base+'/schemas/'+name+'-v1.schema.json'));assert.ok(validate(record),name+' '+JSON.stringify(validate.errors));if('productionExecutionActivated' in record)assert.equal(record.productionExecutionActivated,false,name);}
assert.equal(jr.journeyStageMutationCreated,false);assert.equal(jr.rawReadoutCopied,false);assert.equal(prof.professionalResponsibilityCreated,false);assert.equal(prof.assignmentCreated,false);assert.equal(prof.continuationWithoutRequiredReviewAllowed,false);assert.equal(feedback.causalityClaimed,false);assert.equal(feedback.effectivenessDetermined,false);
const badReadout=fixture('jr-navigation-integration');badReadout.canonicalReadoutReference.dataType='RUNTIME_STATE_RECORD';assert.throws(()=>buildJrNavigationIntelligenceHandoff(position,target,optionSet,risk,decision,scenario,routes,badReadout,jrContract),/RNE_CANONICAL_READOUT_REFERENCE_DATA_TYPE_INVALID/);
const wrongAction=fixture('outcome-feedback');wrongAction.actionReference.authorityRuntime='RNE';assert.throws(()=>buildNavigationOutcomeFeedback(routes,wrongAction,feedbackContract),/RNE_ACTION_REFERENCE_AUTHORITY_INVALID/);
const badValidation=fixture('navigation-validation');badValidation.prediction='future fact';assert.throws(()=>buildNavigationValidationRequest(jr,prof,feedback,badValidation,registry('navigation-validation-check'),valContract),/RNE_FORBIDDEN_FIELD:prediction/);
const ungoverned=fixture('professional-boundary');ungoverned.professionalReviewTriggers[0].riskReference='not-governed';assert.throws(()=>buildProfessionalReviewGate(risk,routes,ungoverned,registry('professional-review-trigger'),profContract),/RNE_PROFESSIONAL_TRIGGER_RISK_UNKNOWN/);
assert.equal(providerRequests,0);
fs.writeFileSync('content/knowledge/structured/successors/master-a-v2-batch4/rne-native-fixture-results-v1.json',JSON.stringify({status:'PASS',inputClass:'EXISTING_NATIVE_RNE_FIXTURES_NOT_USER_DATA',nativeOutputsValidated:13,negativeAuthorityCases:4,newRneLogic:false,providerRequests,productionExecutionActivated:false,rawReadoutCopied:false,outputs:outputs.map(([schema,record])=>({schema:base+'/schemas/'+schema+'-v1.schema.json',record}))},null,2)+'\n');
console.log('PASS 13 existing RNE native outputs + 4 authority denials; execution=false, providerRequests=0.');
}finally{globalThis.fetch=originalFetch;}
