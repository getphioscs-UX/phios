import {createIChingGovernedCast} from '../iching-casting/iching-casting-adapter-v1.js';
import {resolveIChingFullProductionAuthority,ensureIChingGuestSession} from '../iching-full-production/iching-full-production-v1.js';

const headers={
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'referrer-policy':'no-referrer',
  'x-content-type-options':'nosniff'
};
function json(body,status=200,setCookie=null){
  const h=new Headers(headers);
  if(setCookie)h.append('set-cookie',setCookie);
  return new Response(JSON.stringify(body),{status,headers:h});
}
function clean(value){return String(value??'').normalize('NFKC').trim();}

export async function onRequestPost(context){
  let body;
  try{body=await context.request.json();}
  catch{return json({ok:false,error:{code:'INVALID_JSON_BODY'}},400);}

  if(clean(body?.method).toUpperCase()!=='I_CHING')return json({ok:false,error:{code:'UNSUPPORTED_SYMBOLIC_METHOD'}},400);
  if(clean(body?.intent)!=='CREATE_NEW_CAST')return json({ok:false,error:{code:'ICHING_CAST_EXPLICIT_INTENT_REQUIRED'}},400);

  const question=clean(body?.question);
  if(!question)return json({ok:false,error:{code:'ICHING_CAST_QUESTION_REQUIRED'}},400);
  if(question.length>800)return json({ok:false,error:{code:'ICHING_CAST_QUESTION_TOO_LONG'}},400);

  const production=await resolveIChingFullProductionAuthority(context);
  if(!production.authorized||production.runAllowed!==true||production.globalPublicExecution!==true){
    return json({ok:false,error:{code:'ICHING_FULL_PRODUCTION_NOT_PROMOTED'},production},423);
  }

  let guest=null;
  try{guest=await ensureIChingGuestSession(context);}catch{}

  try{
    const cast=await createIChingGovernedCast({question});
    return json({
      ok:true,
      method:'I_CHING',
      cast,
      production:{
        state:'FULL_PRODUCTION',
        runAllowed:true,
        globalPublicExecution:true,
        guestPersistenceAllowed:production.guestPersistenceAllowed===true,
        approvedCommitSha:production.approvedCommitSha,
        releaseId:production.releaseId
      },
      boundaries:{
        castIsSymbolicSamplingEvidence:true,
        questionSemanticsInfluenceSelection:false,
        aiSelected:false,
        favorableOutcomeSelection:false,
        automaticReroll:false,
        calculationMayReroll:false,
        realityEvidence:false,
        predictionAuthority:false,
        diagnosticAuthority:false,
        professionalDirectiveAuthority:false,
        decisionAuthority:'USER'
      }
    },200,guest?.setCookie||null);
  }catch(error){
    return json({ok:false,error:{code:'ICHING_CAST_CREATION_REJECTED',message:String(error?.message||'Cast creation rejected.')}},400,guest?.setCookie||null);
  }
}

export async function onRequestGet(){return json({ok:false,error:{code:'METHOD_NOT_ALLOWED'}},405);}
