// Isolated experiment preflight; not a customer wallet and not report/Tarot authority.
const rates=Object.freeze({'gpt-5.6-luna':{inputNanoUSD:200,cachedNanoUSD:20,outputNanoUSD:1200},'gpt-5.6-terra':{inputNanoUSD:2000,cachedNanoUSD:200,outputNanoUSD:12000}});
export function admittedExperimentMaximum(model,inputTokens=12000,outputTokens=1800){
 const r=rates[model];if(!r||!Number.isSafeInteger(inputTokens)||inputTokens<0||inputTokens>12000||!Number.isSafeInteger(outputTokens)||outputTokens<0||outputTokens>1800)throw Error('EXPERIMENT_REQUEST_NOT_ADMITTED');
 // Conservative: all input may incur the documented 1.25x cache-write rate.
 return Math.ceil((Math.ceil(inputTokens*r.inputNanoUSD*5/4)+outputTokens*r.outputNanoUSD)/1000);
}
export function createOfflineExperimentBudget(){
 const requests=new Map();let allocated=0;
 return Object.freeze({reserve({requestId,packDigest,model,inputTokens=12000,outputTokens=1800}){
  const maximum=admittedExperimentMaximum(model,inputTokens,outputTokens),prior=requests.get(requestId);
  if(prior){if(prior.packDigest!==packDigest||prior.model!==model||prior.maximumMicroUSD!==maximum)throw Error('EXPERIMENT_IDENTITY_CONFLICT');return prior;}
  if(!requestId||!packDigest||requests.size>=20||[...requests.values()].filter(r=>r.model===model).length>=10||allocated+maximum>600000)throw Error('EXPERIMENT_BUDGET_LIMIT');
  const entry={requestId,packDigest,model,maximumMicroUSD:maximum,state:'OFFLINE_RESERVATION_SIMULATION_NOT_REAL_SPEND'};requests.set(requestId,entry);allocated+=maximum;return entry;
 },snapshot(){return {entries:[...requests.values()],maximumAllocatedMicroUSD:allocated,hardBudgetMicroUSD:600000,actualProviderCalls:0,actualCostMicroUSD:0,automaticRetry:0,paidAuthorization:false,memberCreditsCharged:false};},invoke(){throw Error('INDEPENDENT_PAID_AUTHORIZATION_REQUIRED');}});
}
