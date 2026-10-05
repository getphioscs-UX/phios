import fs from 'node:fs';
import path from 'node:path';
import {buildZwrVfrCompactAuthoringPack} from '../functions/personal-reading/visual-first/ziwei-vfr-authoring-pack.js';
import {composeZwrFiveCallExperiment,planZwrFiveCallExperiment} from '../functions/personal-reading/visual-first/ziwei-vfr-five-call-composer.js';

const root='docs/reports/ziwei/vfr-r1/five-call-experiment';
fs.mkdirSync(root,{recursive:true});
if(String(process.env.REPORT_PROVIDER_LIVE_ALLOWED||'').toLowerCase()!=='true')throw Error('VFR_REPORT_PROVIDER_LIVE_NOT_ALLOWED');
if(!String(process.env.OPENAI_API_KEY||'').trim())throw Error('OPENAI_API_KEY_REQUIRED');

const fixture=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-02-en.json','utf8'));
const pack=await buildZwrVfrCompactAuthoringPack({evidence:fixture.evidence});
const plan=planZwrFiveCallExperiment({pack});
fs.writeFileSync(path.join(root,'PLAN.json'),JSON.stringify(plan,null,2)+'\n');
if(!plan.allowed)throw Error('ZWR_FIVE_CALL_EXPERIMENT_BUDGET_PRECHECK_BLOCKED');

const checkpointPath=path.join(root,'CHECKPOINT.json');
const resume=fs.existsSync(checkpointPath)?JSON.parse(fs.readFileSync(checkpointPath,'utf8')):null;
let result;
try{
 result=await composeZwrFiveCallExperiment({
  pack,
  env:process.env,
  resume,
  onBatchCompleted:async state=>{
   fs.writeFileSync(checkpointPath,JSON.stringify({
    schemaVersion:'ZWR-VFR-R1-FIVE-CALL-CHECKPOINT-v1',
    recordedAt:new Date().toISOString(),
    ...state
   },null,2)+'\n');
  }
 });
}catch(error){
 fs.writeFileSync(path.join(root,'FAILURE.json'),JSON.stringify({
  schemaVersion:'ZWR-VFR-R1-FIVE-CALL-FAILURE-v1',
  recordedAt:new Date().toISOString(),
  errorCode:error?.code||error?.message||'UNKNOWN',
  details:error?.details||null,
  checkpointAvailable:fs.existsSync(checkpointPath)
 },null,2)+'\n');
 throw error;
}
fs.writeFileSync(path.join(root,'RESULT.json'),JSON.stringify(result,null,2)+'\n');
if(fs.existsSync(checkpointPath))fs.unlinkSync(checkpointPath);
fs.writeFileSync(path.join(root,'PACK.json'),JSON.stringify(pack,null,2)+'\n');
console.log('PASS ZWR-VFR five-call deep manuscript experiment: calls='+result.providerUsage.providerCalls+'; cost=$'+result.providerUsage.estimatedProviderCost+'; input='+result.providerUsage.inputTokens+'; output='+result.providerUsage.outputTokens+'; sections='+result.sections.length+'.');
