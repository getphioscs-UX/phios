import {runZwrNativeRendererAcceptance} from './zwr-native-renderer-acceptance.js';
const root='qa/method-delivery/ZWR/';
const fail=(code,status=409)=>Object.assign(new Error(code),{code,status});
const metadata={httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}};
export async function advanceNativeRendererCampaign(env,ownerAccountId,input){
 if(env.PHIOS_ENVIRONMENT!=='qa')throw fail('QA_ONLY',403);
 if(!ownerAccountId)throw fail('ACCOUNT_REQUIRED',401);
 if(input.action==='START'){
  const manifestObject=await env.PRIVATE_REPORTS?.get(root+'renderer-manifest.json');
  const manifest=manifestObject?await manifestObject.json():null;
  if(manifest?.schemaVersion!=='ZWR_NATIVE_RENDERER_QA_MANIFEST_V1'||manifest.authorized!==true||manifest.scope!=='DEPLOYED_PRIVATE_BROWSER'||manifest.candidateKey!==root+'accepted-renderer-candidate.json'||!/^[a-f0-9]{64}$/i.test(manifest.candidateDigest))throw fail('NATIVE_RENDERER_MANIFEST_REQUIRED',403);
  const campaignId=crypto.randomUUID();
  const state={schemaVersion:'ZWR_NATIVE_RENDERER_CAMPAIGN_V1',campaignId,ownerAccountId,candidateDigest:manifest.candidateDigest,status:'READY',measurements:[],createdAt:Date.now()};
  await env.PRIVATE_REPORTS.put(root+'renderer-campaigns/'+campaignId+'.json',JSON.stringify(state),metadata);
  return {ok:true,status:'READY',campaignId,sequentialRuns:0,providerCalls:0};
 }
 if(input.action!=='NEXT'||!/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(input.campaignId||''))throw fail('NATIVE_RENDERER_CAMPAIGN_REQUEST_INVALID',400);
 const key=root+'renderer-campaigns/'+input.campaignId+'.json',object=await env.PRIVATE_REPORTS.get(key);
 if(!object)throw fail('NATIVE_RENDERER_CAMPAIGN_NOT_FOUND',404);
 const state=await object.json();
 if(state.ownerAccountId!==ownerAccountId)throw fail('NATIVE_RENDERER_CAMPAIGN_OWNER_DENIED',403);
 if(state.status!=='READY')throw fail('NATIVE_RENDERER_CAMPAIGN_'+state.status);
 if(Date.now()-state.createdAt>30*60*1000)throw fail('NATIVE_RENDERER_CAMPAIGN_EXPIRED');
 if(input.sequence!==state.measurements.length+1||input.sequence>8)throw fail('NATIVE_RENDERER_CAMPAIGN_SEQUENCE_INVALID');
 const locked=await env.PRIVATE_REPORTS.put(key,JSON.stringify({...state,status:'RUNNING'}),{...metadata,onlyIf:{etagMatches:object.etag}});
 if(!locked)throw fail('NATIVE_RENDERER_CAMPAIGN_BUSY');
 try{
  const result=await runZwrNativeRendererAcceptance(env,{candidateDigest:state.candidateDigest,measurements:state.measurements});
  const complete=result.status==='PASS';
  await env.PRIVATE_REPORTS.put(key,JSON.stringify({...state,status:complete?'PASS':'READY',measurements:result.measurements,completedAt:Date.now(),result:complete?result:null}),metadata);
  const {measurements,...publicResult}=result;
  return {...publicResult,campaignId:state.campaignId};
 }catch(error){
  await env.PRIVATE_REPORTS.put(key,JSON.stringify({...state,status:'FAILED',failedSequence:input.sequence,errorCode:error.code||error.message}),metadata);
  throw error;
 }
}
