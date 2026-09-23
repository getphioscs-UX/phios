import assert from 'node:assert/strict';import {bindEcrHumanRuntimeReality} from '../functions/current-reality/ecr-human-runtime-binding.js';
assert.equal(bindEcrHumanRuntimeReality().dynamicRuntime,null);
assert.throws(()=>bindEcrHumanRuntimeReality({rawInput:{observations:[{domain:'DRIFT',text:'Synthetic'}]}}),/OPT_IN/);
for(const domain of ['ENVIRONMENT','RESOURCES','RECOVERY','DRIFT','RELATIONSHIP','LOAD']){
 const r=bindEcrHumanRuntimeReality({rawInput:{optIn:true,purposeCode:'PERSONAL_READING_REALITY_COMPARISON',observations:[{domain,text:'Synthetic self-report only'}]}});
 assert.equal(r.observations[0].objectiveFact,false);assert.equal(r.dynamicRuntime.currentDriverPriority.status,'UNKNOWN');assert.equal(r.dynamicRuntime.runtimeState.status,'UNKNOWN');
}
const candidate={candidateId:'TEST',methodId:'ECR',claimRef:'SYNTHETIC-CLAIM'};
for(const responseState of ['OPEN','CURRENTLY_RESONANT','PARTIALLY_RESONANT','CURRENTLY_NOT_RESONANT']){
 const r=bindEcrHumanRuntimeReality({rawInput:{optIn:true,purposeCode:'PERSONAL_READING_REALITY_COMPARISON',observations:[{domain:'ENVIRONMENT',text:'Synthetic context'}]},candidates:[candidate],responses:[{candidateId:'TEST',state:responseState,observationRefs:['CR-OBS-01']}]});
 assert.equal(r.comparisons.comparisons[0].responseState,responseState);assert.equal(r.comparisons.comparisons[0].methodProvenTrue,false);
}
console.log('PASS V4.1 W10: no evidence -> no claim; self-report, counterevidence, recovery/drift and OPEN remain distinct.');
