import {assertReportProviderAccess} from '../report-provider-access.js';
// The legacy structured helper rejects incomplete envelopes wholesale. This
// transport retains raw text and usage so healthy section/locale units survive.
export async function invokeBaziDeepManuscript({env,request,fetcher=globalThis.fetch}){
 if(env?.REPORT_PROVIDER_LIVE_ALLOWED!=='true'||env?.REPORT_ZERO_COST_REPLAY==='true'||(typeof process!=='undefined'&&process.env.REPORT_ZERO_COST_REPLAY==='true'))throw Error('REPORT_PROVIDER_LIVE_OPT_IN_REQUIRED');
 const paidContext=assertReportProviderAccess({env,accessTier:request?.accessTier});
 if(!env.OPENAI_API_KEY)throw Error('OPENAI_API_KEY_NOT_CONFIGURED');
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),request.timeoutMs||180000);
 let response;
 try{response=await paidContext.invokeBudgeted(()=>fetcher('https://api.openai.com/v1/responses',{method:'POST',signal:controller.signal,headers:{'content-type':'application/json',authorization:`Bearer ${env.OPENAI_API_KEY}`},body:JSON.stringify({model:request.model,store:false,reasoning:{effort:request.plan.reasoningEffort||'medium'},input:[{role:'system',content:request.systemPrompt},{role:'user',content:JSON.stringify(request.payload)}],text:{format:{type:'json_schema',name:'bazi_deep_manuscript',strict:true,schema:request.schema}},max_output_tokens:request.plan.plannedMaxOutputTokens})}));}
 catch(e){const error=Error(e?.name==='AbortError'?'BDM_TRANSPORT_TIMEOUT':'BDM_TRANSPORT_NETWORK');error.code=error.message;error.usageUnknown=true;throw error;}finally{clearTimeout(timer);}
 let data;try{data=JSON.parse(await response.text());}catch{const e=Error('BDM_TRANSPORT_UNREADABLE');e.usageUnknown=true;throw e;}
 if(!response.ok){const e=Error('BDM_PROVIDER_HTTP_ERROR');e.httpStatus=response.status;e.requestId=data.id||response.headers.get('x-request-id');e.usage=data.usage;e.usageUnknown=!data.usage&&response.status>=500;throw e;}
 const rawText=data.output_text||data.output?.filter(x=>x.type==='message').flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('')||'';
 let output=null;try{output=JSON.parse(rawText);}catch{}
 return {requestId:data.id||response.headers.get('x-request-id'),rawText,output,usage:data.usage||null,completionStatus:data.status||'UNKNOWN',incompleteReason:data.incomplete_details?.reason||null,finishReason:data.incomplete_details?.reason||data.status||'UNKNOWN'};
}
