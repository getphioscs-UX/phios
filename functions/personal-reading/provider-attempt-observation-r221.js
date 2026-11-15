const coded=(code,details={})=>Object.assign(Error(code),{code,details});
const networkCode=e=>e?.cause?.code||e?.code||e?.name||null;
export async function persistProviderObservation(store,request,observation,stage,extra={}){
 Object.assign(observation,extra,{lastStage:stage});observation.events.push({stage,at:new Date().toISOString()});
 try{await store.put('provider-observation:'+request.requestId,observation);}catch{throw coded('NARRATIVE_PROVIDER_EVIDENCE_PERSIST_FAILED',{phase:stage,usageState:'USAGE_UNKNOWN',dispatchState:'UNKNOWN',responseHeadersReceived:observation.responseHeadersReceived===true});}
}
export async function observeReportProviderAttempt({store,request,invoke}){
 const observation={version:'R221_PHASE_OBSERVATION',dispatchState:'UNKNOWN',dispatchEvidence:'NOT_INDEPENDENTLY_ATTESTED',providerInvokedMeaning:'LOCAL_INVOKE_CALLBACK_ONLY_NOT_NETWORK_DISPATCH_PROOF',internalRequestId:request.requestId,providerRequestId:null,providerResponseId:null,responseHeadersReceived:false,usageState:'RESERVED',providerInvoked:false,events:[]};
 await persistProviderObservation(store,request,observation,'RESERVATION_CONFIRMED');
 // REQUEST_STARTED records local invoke intent. It never proves dispatch or no-dispatch.
 await persistProviderObservation(store,request,observation,'REQUEST_STARTED',{invokeState:'INTENT_RECORDED_DISPATCH_UNKNOWN'});observation.providerInvoked=true;let response;
 try{response=await invoke();}catch(e){const timeout=['AbortError','TimeoutError'].includes(e?.name)||['ETIMEDOUT','UND_ERR_CONNECT_TIMEOUT'].includes(networkCode(e));throw coded(timeout?'NARRATIVE_PROVIDER_TIMEOUT':'NARRATIVE_PROVIDER_NETWORK_FAILED',{phase:'REQUEST',networkErrorCode:networkCode(e),responseHeadersReceived:false,usageState:'USAGE_UNKNOWN'});}
 await persistProviderObservation(store,request,observation,'RESPONSE_HEADERS_RECEIVED',{httpStatus:response.status,providerRequestId:response.headers?.get('x-request-id')||null,responseHeadersReceived:true});let raw;
 try{raw=await response.clone().text();}catch(e){throw coded('NARRATIVE_PROVIDER_RESPONSE_READ_FAILED',{phase:'RESPONSE_BODY',networkErrorCode:networkCode(e),responseHeadersReceived:true,usageState:'USAGE_UNKNOWN'});}
 await persistProviderObservation(store,request,observation,'BODY_READ');
 try{await store.put('provider-raw:'+request.requestId,{httpStatus:response.status,providerRequestId:observation.providerRequestId,raw});}catch{throw coded('NARRATIVE_PROVIDER_EVIDENCE_PERSIST_FAILED',{phase:'RAW_RESPONSE_PERSIST',responseHeadersReceived:true,usageState:'USAGE_UNKNOWN'});}
 await persistProviderObservation(store,request,observation,'RAW_RESPONSE_PERSISTED');let body;
 try{body=JSON.parse(raw);}catch{throw coded('NARRATIVE_PROVIDER_UNREADABLE_RESPONSE',{phase:'RESPONSE_PARSE',responseHeadersReceived:true,usageState:'USAGE_UNKNOWN'});}
 await persistProviderObservation(store,request,observation,'BODY_PARSED',{providerResponseId:typeof body?.id==='string'?body.id:null});
 return {body,status:response.status,budgetUsage:body?.usage,attemptObservation:observation};
}
