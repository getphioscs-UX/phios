import {normalizeGuidedReadingRequest,runGuidedReadingEligibility,runGuidedReadingRecomposition} from '../_lib/knowledge-guided-reading.js';
const HEADERS=Object.freeze({'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:HEADERS});}
export async function onRequestPost(context){
  let body;try{body=await context.request.json();}catch{return json({ok:false,error:{code:'INVALID_JSON'}},400);}
  try{
    const input=normalizeGuidedReadingRequest(body);const common={question:input.question,locale:input.locale,depth:input.depth,request:context.request,env:context.env||{},retrievalOptions:{source:'hybrid',mode:'auto'},selectedReadingMode:input.selectedReadingMode,explicitMethodInterest:input.explicitMethodInterest};
    const result=input.action==='ELIGIBILITY'?await runGuidedReadingEligibility(common):await runGuidedReadingRecomposition({...common,clarifyingAnswers:input.clarifyingAnswers,temporaryObservations:input.temporaryObservations,methodConsent:input.methodConsent,methodProjections:input.methodProjections,escalationSignals:input.escalationSignals});
    return json({ok:true,...result});
  }catch(error){const code=String(error?.code||error?.message||'KAP_GUIDED_READING_FAILED');const status=/INVALID|REQUIRED|NOT_ELIGIBLE|FORBIDDEN|MISMATCH/.test(code)?400:500;return json({ok:false,error:{code},governance:{canonicalKnowledgeCreated:false,publicationCreated:false,methodExecutionTriggered:false,realityFactCreated:false,persistentCaseCreated:false}},status);}
}
export async function onRequestGet(){return json({ok:false,error:{code:'KAP_GUIDED_READING_POST_ONLY'}},405);}
