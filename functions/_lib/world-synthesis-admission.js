// Decision only. The existing KIR gateway remains the sole model composer.
import {getKirR2W16R2BProductionAdmission} from './kir-r2-production-admission.js';
export function assessWorldSynthesis({answer,authorization=null,env={},rates=null,inputTokens=null}={}){
 const local=answer?.quality==='DIRECT_USEFUL_BOUNDED',sourceReady=!!answer?.sources?.length&&answer?.segments?.every(p=>p.sourceRefs?.length);
 const outputCap=900,estimate=rates&&Number.isFinite(inputTokens)?(inputTokens*rates.inputPerMillion+outputCap*rates.outputPerMillion)/1e6:null;
 const admission=getKirR2W16R2BProductionAdmission(env);
 const authorized=!!authorization?.reference&&authorization.maxCalls===1&&Number.isFinite(authorization.maxUSD)&&authorization.maxUSD>0;
 return {mode:local?'ZERO_PROVIDER_BOUNDED_EXPLANATION':'MODEL_SYNTHESIS_NOT_EXECUTED',providerCalls:0,sourceReady,authorizationPresent:authorized,productionAdmission:admission.allowed,estimatedUSD:estimate,estimateBasis:rates?'CALLER_SUPPLIED_PLANNING_RATES_NOT_VERIFIED_PRICE':'NO_VERIFIED_RATE_CARD',maxOutputTokens:outputCap,mayInvoke:!local&&sourceReady&&authorized&&admission.allowed&&estimate!==null&&estimate<=authorization.maxUSD,blockers:[...(!sourceReady?['EVIDENCE_NOT_SUFFICIENT']:[]),...(!authorized?['INDEPENDENT_FEE_AUTHORIZATION_REQUIRED']:[]),...(!admission.allowed?['EXISTING_KIR_RUNTIME_ADMISSION_OFF']:[]),...(estimate===null?['VERIFIED_MODEL_RATE_AND_INPUT_BUDGET_REQUIRED']:[])],modelOwner:'EXISTING_KIR_MODEL_GATEWAY',newAskEngine:false};
}
