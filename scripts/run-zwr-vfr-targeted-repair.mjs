import fs from 'node:fs';
import path from 'node:path';
import {buildZwrVfrCompactAuthoringPack} from '../functions/personal-reading/visual-first/ziwei-vfr-authoring-pack.js';
import {buildTargetedRepairPlan,runTargetedRepair} from '../functions/personal-reading/visual-first/ziwei-vfr-targeted-repair.js';

const root='docs/reports/ziwei/vfr-r1/five-call-experiment';
if(String(process.env.REPORT_PROVIDER_LIVE_ALLOWED||'').toLowerCase()!=='true')throw Error('VFR_REPORT_PROVIDER_LIVE_NOT_ALLOWED');
if(!String(process.env.OPENAI_API_KEY||'').trim())throw Error('OPENAI_API_KEY_REQUIRED');

const result=JSON.parse(fs.readFileSync(path.join(root,'RESULT.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'COMPLETENESS-MANIFEST.json'),'utf8'));
const fixture=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-02-en.json','utf8'));
const pack=await buildZwrVfrCompactAuthoringPack({evidence:fixture.evidence});
const plan=buildTargetedRepairPlan({pack,result,manifest});
fs.writeFileSync(path.join(root,'REPAIR-PLAN.json'),JSON.stringify(plan,null,2)+'\n');
if(!plan.allowed)throw Error('ZWR_TARGETED_REPAIR_BUDGET_PRECHECK_BLOCKED');

const checkpointPath=path.join(root,'REPAIR-CHECKPOINT.json');
const resume=fs.existsSync(checkpointPath)?JSON.parse(fs.readFileSync(checkpointPath,'utf8')):null;

let repaired;
try{
 repaired=await runTargetedRepair({
  pack,result,manifest,env:process.env,resume,
  onRepairCompleted:async state=>{
   fs.writeFileSync(checkpointPath,JSON.stringify({
    schemaVersion:'ZWR-VFR-R1-TARGETED-REPAIR-CHECKPOINT-v1',
    recordedAt:new Date().toISOString(),
    ...state
   },null,2)+'\n');
  }
 });
}catch(error){
 fs.writeFileSync(path.join(root,'REPAIR-FAILURE.json'),JSON.stringify({
  schemaVersion:'ZWR-VFR-R1-TARGETED-REPAIR-FAILURE-v1',
  recordedAt:new Date().toISOString(),
  errorCode:error?.code||error?.message||'UNKNOWN',
  details:error?.details||null,
  checkpointAvailable:fs.existsSync(checkpointPath)
 },null,2)+'\n');
 throw error;
}

fs.writeFileSync(path.join(root,'REPAIRED-RESULT.json'),JSON.stringify(repaired,null,2)+'\n');
if(fs.existsSync(checkpointPath))fs.unlinkSync(checkpointPath);
console.log(
 'PASS ZWR-VFR targeted completeness repair: repairCalls='+repaired.providerUsage.repairProviderCalls+
 '; repairCost=$'+repaired.providerUsage.repairEstimatedProviderCost+
 '; totalExperimentCost=$'+repaired.providerUsage.totalEstimatedProviderCost+
 '; sections='+repaired.rawManuscriptSections.length+'.'
);
