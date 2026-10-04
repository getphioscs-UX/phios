import fs from 'node:fs';
import path from 'node:path';
import {buildZwrProW10DeterministicCase,summarizeZwrProW10Campaign} from '../functions/personal-reading/narrative/zwr-pro-w10-controlled-qa.js';
import {buildZwrProBilingualCandidateW4W8} from '../functions/personal-reading/narrative/zwr-pro-w4-w8-pipeline.js';
import {createZwrProImmutableSnapshotW9} from '../functions/personal-reading/narrative/zwr-pro-w9-immutable-snapshot.js';

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
fs.mkdirSync(path.dirname(outPath),{recursive:true});
const results=[];
let providerCalls=0,semanticReviewCalls=0,providerAttempts=0,estimatedProviderCost=0;
for(const id of sentinelIds){
 const row=deterministic.find(x=>x.fixtureId===id);
 console.log('ZWR-PRO W10-B START',id);
 const pipeline=await buildZwrProBilingualCandidateW4W8({
  evidence:row.evidence,env:process.env,
  onProgress:e=>console.log(JSON.stringify({work:'ZWR-PRO-W10-B',fixtureId:id,...e}))
 });
 if(pipeline.status!=='PASS_W4_W8'){
  const failure={schemaVersion:'ZWR-PRO-W10-LIVE-CAMPAIGN-v1',status:'FAIL',failedFixtureId:id,sentinelIds,preflight,partialResults:results,detail:pipeline,productionAdmissionGranted:false};
  fs.writeFileSync(outPath,JSON.stringify(failure,null,2)+'\n');
  throw Error('ZWR_PRO_W10_LIVE_FAIL:'+id+':'+(pipeline.reason||pipeline.detail?.reason||'UNKNOWN'));
 }
 const snapshot=await createZwrProImmutableSnapshotW9({pipelineResult:pipeline,createdAt:new Date().toISOString()});
 const candidates=[...pipeline.zh.candidates,...pipeline.en.candidates];
 for(const c of candidates){
  providerCalls+=Number(c.provider?.transportCalls||0);
  semanticReviewCalls+=Number(c.provider?.semanticReviewCalls||0);
  providerAttempts+=Number(c.provider?.providerAttemptCount||0);
  estimatedProviderCost+=Number(c.provider?.usageRecord?.estimatedProviderCost||0);
  for(const v of c.provider?.verificationUsageRecords||[])estimatedProviderCost+=Number(v?.estimatedProviderCost||0);
 }
 results.push({
  fixtureId:id,subjectId:row.subjectId,inputFingerprint:row.inputFingerprint,
  authorityDigest:row.authorityDigest,structuralSignature:row.structuralSignature,
  reportSnapshotId:snapshot.reportSnapshotId,snapshot,
  pipelineDigest:pipeline.pipelineDigest,
  w8ParityDigest:pipeline.parity.verificationDigest
 });
 console.log('ZWR-PRO W10-B PASS',id,snapshot.reportSnapshotId);
}
const campaign={
 schemaVersion:'ZWR-PRO-W10-LIVE-CAMPAIGN-v1',
 status:'PASS_LIVE_CAMPAIGN',
 referenceSubjectExcluded:'ZPA-CONTROLLED-01',
 sentinelIds,subjectCount:results.length,
 preflightDigest:preflight.campaignDigest,
 providerExecution:'LIVE',
 providerCalls,semanticReviewCalls,providerAttempts,
 estimatedProviderCost:Number(estimatedProviderCost.toFixed(6)),
 results,
 productionAdmissionGranted:false,
 completedAt:new Date().toISOString()
};
fs.writeFileSync(outPath,JSON.stringify(campaign,null,2)+'\n');
console.log('PASS ZWR-PRO W10-B live campaign:',results.length,'subjects; provider calls=',providerCalls,'semantic review calls=',semanticReviewCalls,'estimated provider cost=',campaign.estimatedProviderCost);
console.log('Wrote',outPath);
