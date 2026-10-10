import fs from 'node:fs';
import path from 'node:path';
import {buildZwrProW10DeterministicCase,summarizeZwrProW10Campaign} from '../functions/personal-reading/narrative/zwr-pro-w10-controlled-qa.js';
import {buildZwrProBilingualCandidateW4W8} from '../functions/personal-reading/narrative/zwr-pro-w4-w8-pipeline.js';
import {createZwrProImmutableSnapshotW9} from '../functions/personal-reading/narrative/zwr-pro-w9-immutable-snapshot.js';

if(process.env.REPORT_PROVIDER_LIVE_ALLOWED!=='true'||process.env.REPORT_ZERO_COST_REPLAY==='true')throw Error('REPORT_PROVIDER_LIVE_OPT_IN_REQUIRED');
if(!String(process.env.OPENAI_API_KEY||'').trim())throw Error('ZWR_PRO_W10_OPENAI_API_KEY_REQUIRED');

const ids=Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0'));
const deterministic=[];
for(const id of ids){
 const input=JSON.parse(fs.readFileSync(`docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-${id}-input.json`,'utf8'));
 deterministic.push(await buildZwrProW10DeterministicCase({fixtureId:id,input}));
}
const preflight=await summarizeZwrProW10Campaign(deterministic);
const sentinelIds=preflight.sentinels.map(s=>s.fixtureId);

const outPath='docs/reports/ziwei/production-admission/zwr-pro-w10-live-campaign.json';
const checkpointPath='docs/reports/ziwei/production-admission/zwr-pro-w10-live-checkpoint.json';
fs.mkdirSync(path.dirname(outPath),{recursive:true});

function freshCheckpoint(){
 return {schemaVersion:'ZWR-PRO-W10-LIVE-CHECKPOINT-v1',preflightDigest:preflight.campaignDigest,sentinelIds,sections:{},completedResults:[],updatedAt:new Date().toISOString()};
}
function writeCheckpoint(cp){
 cp.updatedAt=new Date().toISOString();
 const tmp=checkpointPath+'.tmp';
 fs.writeFileSync(tmp,JSON.stringify(cp,null,2)+'\n');
 fs.renameSync(tmp,checkpointPath);
}
function loadCheckpoint(){
 if(!fs.existsSync(checkpointPath))return freshCheckpoint();
 const cp=JSON.parse(fs.readFileSync(checkpointPath,'utf8'));
 if(cp.schemaVersion!=='ZWR-PRO-W10-LIVE-CHECKPOINT-v1'||cp.preflightDigest!==preflight.campaignDigest||JSON.stringify(cp.sentinelIds)!==JSON.stringify(sentinelIds))throw Error('ZWR_PRO_W10_CHECKPOINT_IDENTITY_DRIFT');
 cp.sections=cp.sections||{};cp.completedResults=cp.completedResults||[];
 return cp;
}
function salvageLegacyFailure(cp){
 if(!fs.existsSync(outPath))return;
 let doc=null;try{doc=JSON.parse(fs.readFileSync(outPath,'utf8'));}catch{return;}
 if(doc?.status!=='FAIL'||!doc.failedFixtureId)return;
 const pipeline=doc.detail||{},localeResult=pipeline.detail||{},savedW4=localeResult.candidate||null;
 const locale=pipeline.failedLocale||localeResult.locale||null,sectionId=localeResult.sectionId||null,id=doc.failedFixtureId;
 if(savedW4?.composition?.candidate&&savedW4?.composition?.governedBrief&&locale&&sectionId){
  const key=id+':'+locale+':'+sectionId;
  if(!cp.sections[key]){
   cp.sections[key]={state:'COMPOSITION_SAVED',fixtureId:id,locale,sectionId,subjectBinding:savedW4.subjectBinding||localeResult.authorityPack?.subjectBinding||null,savedW4,salvagedFrom:'zwr-pro-w10-live-campaign.json',historicalCompositionCalls:1,historicalCompositionUsageUnavailable:true};
   console.log('ZWR-PRO W10-B SALVAGED',key,'composition; next run will request semantic review only.');
  }
 }
 for(const row of doc.partialResults||[]){
  if(!cp.completedResults.some(x=>x.fixtureId===row.fixtureId))cp.completedResults.push(row);
 }
}
function resumeForFixture(cp,id){
 const out={};
 for(const [key,value] of Object.entries(cp.sections||{})){
  if(!key.startsWith(id+':'))continue;
  const [,locale,sectionId]=key.split(':');
  out[locale+':'+sectionId]=value;
 }
 return out;
}
function sectionCheckpoint(cp,id,event){
 const key=id+':'+event.locale+':'+event.sectionId;
 cp.sections[key]={...event,fixtureId:id};
 writeCheckpoint(cp);
 console.log('ZWR-PRO W10-B CHECKPOINT',key,event.state);
}
function usageSummary(cp){
 let providerCalls=0,semanticReviewCalls=0,providerAttempts=0,estimatedProviderCost=0,unpricedHistoricalTransportCalls=0;
 const seen=new Set();
 for(const [key,row] of Object.entries(cp.sections||{})){
  if(row.state!=='SECTION_PASS'||!sentinelIds.some(id=>key.startsWith(id+':')))continue;
  if(seen.has(key))continue;seen.add(key);
  const p=row.candidate?.provider||{};
  providerCalls+=Number(p.transportCalls||0);
  semanticReviewCalls+=Number(p.semanticReviewCalls||0);
  providerAttempts+=Number(p.providerAttemptCount||0);
  const compositionUsage=Array.isArray(p.compositionUsageRecords)&&p.compositionUsageRecords.length?p.compositionUsageRecords:(p.usageRecord?[p.usageRecord]:[]);
  for(const u of compositionUsage)estimatedProviderCost+=Number(u?.estimatedProviderCost||0);
  for(const v of p.verificationUsageRecords||[])estimatedProviderCost+=Number(v?.estimatedProviderCost||0);
  if(p.historicalCompositionUsageUnavailable===true)unpricedHistoricalTransportCalls+=Number(p.historicalCompositionCalls||1);
 }
 return {providerCalls,semanticReviewCalls,providerAttempts,estimatedProviderCost:Number(estimatedProviderCost.toFixed(6)),unpricedHistoricalTransportCalls,estimatedProviderCostIsLowerBound:unpricedHistoricalTransportCalls>0};
}

const checkpoint=loadCheckpoint();
salvageLegacyFailure(checkpoint);
writeCheckpoint(checkpoint);

const results=[...(checkpoint.completedResults||[])];
for(const id of sentinelIds){
 if(results.some(x=>x.fixtureId===id)){
  console.log('ZWR-PRO W10-B RESUME SUBJECT PASS',id);
  continue;
 }
 const row=deterministic.find(x=>x.fixtureId===id);
 console.log('ZWR-PRO W10-B START',id);
 const pipeline=await buildZwrProBilingualCandidateW4W8({
  evidence:row.evidence,
  env:process.env,
  resumeSections:resumeForFixture(checkpoint,id),
  onCheckpoint:e=>sectionCheckpoint(checkpoint,id,e),
  onProgress:e=>console.log(JSON.stringify({work:'ZWR-PRO-W10-B',fixtureId:id,...e}))
 });
 if(pipeline.status!=='PASS_W4_W8'){
  const failure={schemaVersion:'ZWR-PRO-W10-LIVE-CAMPAIGN-v1',status:'FAIL',failedFixtureId:id,sentinelIds,preflight,partialResults:results,checkpointPath,usage:usageSummary(checkpoint),detail:pipeline,productionAdmissionGranted:false};
  fs.writeFileSync(outPath,JSON.stringify(failure,null,2)+'\n');
  throw Error('ZWR_PRO_W10_LIVE_FAIL:'+id+':'+(pipeline.reason||pipeline.detail?.reason||'UNKNOWN'));
 }
 const snapshot=await createZwrProImmutableSnapshotW9({pipelineResult:pipeline,createdAt:new Date().toISOString()});
 const result={
  fixtureId:id,subjectId:row.subjectId,inputFingerprint:row.inputFingerprint,
  authorityDigest:row.authorityDigest,structuralSignature:row.structuralSignature,
  reportSnapshotId:snapshot.reportSnapshotId,snapshot,
  pipelineDigest:pipeline.pipelineDigest,
  w8ParityDigest:pipeline.parity.verificationDigest
 };
 results.push(result);
 checkpoint.completedResults=results;
 writeCheckpoint(checkpoint);
 console.log('ZWR-PRO W10-B PASS',id,snapshot.reportSnapshotId);
}

const usage=usageSummary(checkpoint);
const campaign={
 schemaVersion:'ZWR-PRO-W10-LIVE-CAMPAIGN-v1',
 status:'PASS_LIVE_CAMPAIGN',
 referenceSubjectExcluded:'ZPA-CONTROLLED-01',
 sentinelIds,subjectCount:results.length,
 preflightDigest:preflight.campaignDigest,
 providerExecution:'LIVE',
 ...usage,
 results,
 checkpointPath,
 productionAdmissionGranted:false,
 completedAt:new Date().toISOString()
};
fs.writeFileSync(outPath,JSON.stringify(campaign,null,2)+'\n');
console.log('PASS ZWR-PRO W10-B live campaign:',results.length,'subjects; provider calls=',usage.providerCalls,'semantic review calls=',usage.semanticReviewCalls,'estimated provider cost=',usage.estimatedProviderCost,usage.estimatedProviderCostIsLowerBound?'(LOWER BOUND; historical call usage unavailable)':'');
console.log('Wrote',outPath);
