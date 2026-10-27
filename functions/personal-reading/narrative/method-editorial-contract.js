// Local candidate contract. No route, provider SDK, entitlement writer or live switch.
import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';
export const METHOD_EDITORIAL_VERSION='METHOD-EDITORIAL-R1-LOCAL';
export const EDITORIAL_SYSTEM_PROMPT=`Write one bilingual PHI OS report page from the frozen semantic plan. Do not calculate, add a meaning, infer an event, diagnose, predict, infer a partner or transfer meanings between roles or schools. Use only the supplied facts and exact eligible role/value claims. Return matching Chinese and English paragraph units with the same IDs. Keep conditions and exceptions. Illustrations must be explicitly hypothetical in both languages, not client history. Answer the page's reader question naturally, then offer one optional observation question. Internal IDs belong only in claimUsage. Do not print runtime, native owner, D8, R18, semantic IR, sourceClaimId, admitted, fallback, provider, binding, payload, candidate or production. If support is missing return CONTENT_SOURCE_GAP; never use filler. Return JSON only; no repairs or retries are automatic.`;
const forbidden=/\b(?:runtime|native owner|D8|R18|semantic IR|sourceClaimId|admitted|fallback|provider|binding|payload|candidate|production|schemaVersion)\b|原生运行|生产准入|来源声明编号|本次附件/iu;
const fail=code=>{throw Object.assign(Error(code),{code});};
export async function freezeEditorialRequest({methodId,inputDigest,semanticPlan,entitlementId,accountId,promptVersion=METHOD_EDITORIAL_VERSION,localOnly=true}){
 if(!localOnly||!accountId||!entitlementId||!inputDigest)fail('EDITORIAL_LOCAL_AUTHORITY_REQUIRED');
 if(!semanticPlan?.calculatedFacts||!semanticPlan?.roleSemantics||!semanticPlan?.meaningBoundaries||!semanticPlan?.publicationContext)fail('EDITORIAL_SEMANTIC_PLAN_REQUIRED');
 for(const c of semanticPlan.roleSemantics)if(c.runtimeUseAllowed!==true||!c.id||!c.sourceDigest||!c.school||!c.role)fail('EDITORIAL_INELIGIBLE_SOURCE');
 if((semanticPlan.customerRealityEvidence||[]).some(e=>e.consentGranted!==true||!e.sourceVersion))fail('EDITORIAL_REALITY_CONSENT_REQUIRED');
 const body={methodId,inputDigest,semanticPlan,accountId,entitlementId,promptVersion,systemPrompt:EDITORIAL_SYSTEM_PROMPT};
 return deepFreeze({...body,requestDigest:await sha256Stable(body)});
}
export async function verifyEditorialRequest(request){const {requestDigest,...body}=request;if(await sha256Stable(body)!==requestDigest)fail('EDITORIAL_REQUEST_TAMPERED');return true;}
export function validateEditorialResponse(request,response){
 const errors=[];const add=x=>errors.push(x);const plan=request.semanticPlan,allowed=new Map([...plan.roleSemantics,...(plan.factEvidence||[])].map(c=>[c.id,c]));
 if(response?.status==='CONTENT_SOURCE_GAP')return{valid:false,errors:['CONTENT_SOURCE_GAP'],semanticQuality:'NOT_VERIFIED'};
 if(!response||!Array.isArray(response.claimUsage)||!Array.isArray(response.illustrations))return{valid:false,errors:['EDITORIAL_RESPONSE_STRUCTURE'],semanticQuality:'NOT_VERIFIED'};
 if(Object.keys(response).some(k=>!['headline','zhHans','en','claimUsage','illustrations','uncertaintyNotes'].includes(k)))add('EDITORIAL_UNEXPECTED_FIELD');
 const ids={};for(const lang of ['zhHans','en']){const b=response[lang];if(!b||!Array.isArray(b.paragraphs)||!b.paragraphs.length||typeof b.question!=='string'){add('EDITORIAL_LANGUAGE_MISSING:'+lang);continue;}
  if(!b.question.trim()||Object.keys(b).some(k=>!['paragraphs','question'].includes(k)))add('EDITORIAL_LANGUAGE_STRUCTURE');
  ids[lang]=b.paragraphs.map(p=>p?.id);if(new Set(ids[lang]).size!==ids[lang].length)add('EDITORIAL_DUPLICATE_UNIT');
  for(const p of b.paragraphs){if(!p||typeof p.id!=='string'||typeof p.text!=='string'||!p.text.trim()||Object.keys(p).some(k=>!['id','text'].includes(k))){add('EDITORIAL_UNIT_STRUCTURE');continue;}if(forbidden.test(p.text))add('EDITORIAL_INTERNAL_JARGON:'+p.id);if(/必然发财|你注定|will definitely|guaranteed wealth/i.test(p.text))add('EDITORIAL_CERTAINTY_RISK:'+p.id);}
  if(forbidden.test(b.question))add('EDITORIAL_INTERNAL_JARGON:question');
 }
 if(JSON.stringify(ids.zhHans)!==JSON.stringify(ids.en))add('EDITORIAL_BILINGUAL_UNIT_MISMATCH');
 for(const u of response.claimUsage){if(!u||typeof u.paragraphId!=='string'||typeof u.claimId!=='string'||typeof u.scope!=='string'){add('EDITORIAL_USAGE_STRUCTURE');continue;}if(!ids.zhHans?.includes(u.paragraphId)||!allowed.has(u.claimId))add('EDITORIAL_UNKNOWN_CLAIM_OR_UNIT');else if(u.scope!==allowed.get(u.claimId).scope)add('EDITORIAL_SCOPE_MISMATCH');}
 for(const id of ids.zhHans||[])if(!response.claimUsage.some(u=>u.paragraphId===id)&&!response.illustrations.some(x=>x.paragraphId===id&&x.status==='HYPOTHETICAL'))add('EDITORIAL_UNMAPPED_UNIT:'+id);
 for(const x of response.illustrations){if(!x||x.status!=='HYPOTHETICAL'||!ids.zhHans?.includes(x.paragraphId))add('EDITORIAL_ILLUSTRATION_INVALID');else for(const lang of ['zhHans','en']){const t=response[lang]?.paragraphs.find(p=>p.id===x.paragraphId)?.text||'';if(!(lang==='zhHans'?/例如|假设|设想|示范|可能/:/imagine|hypothetical|for example|might|could/i).test(t))add('EDITORIAL_ILLUSTRATION_UNMARKED:'+lang);}}
 // Structural/source identity checks cannot prove paraphrase support or bilingual semantic parity.
 return{valid:errors.length===0,errors,semanticQuality:'NOT_VERIFIED_BY_STRUCTURAL_CHECKS',publicationAllowed:false,knownLimitations:['Valid claim IDs cannot establish that prose is entailed.','Negation, qualifier and cross-language meaning require separate semantic evaluation.']};
}
export function editorialBudgetPlan({inputTokens,maxOutputTokens,inputMicroUSDPerMillion,outputMicroUSDPerMillion,previousCostMicroUSD=0,reservedFollowupMicroUSD,repairReserveMicroUSD=0}){
 const all=[inputTokens,maxOutputTokens,inputMicroUSDPerMillion,outputMicroUSDPerMillion,previousCostMicroUSD,reservedFollowupMicroUSD,repairReserveMicroUSD];if(all.some(x=>!Number.isSafeInteger(x)||x<0))fail('EDITORIAL_VERIFIED_COST_INPUT_REQUIRED');
 const maximumMicroUSD=Math.ceil(inputTokens*inputMicroUSDPerMillion/1e6)+Math.ceil(maxOutputTokens*outputMicroUSDPerMillion/1e6),total=maximumMicroUSD+previousCostMicroUSD+reservedFollowupMicroUSD+repairReserveMicroUSD;
 return{maximumMicroUSD,totalOrderMaximumMicroUSD:total,capMicroUSD:2000000,allowed:total<=2000000,autoRetry:0};
}
export function createLocalEditorialRunner({store,adapter}){
 const inFlight=new Map();return async request=>{await verifyEditorialRequest(request);if(adapter?.mode!=='OFFLINE_REPLAY'&&adapter?.mode!=='SYNTHETIC_MOCK')fail('EDITORIAL_PROVIDER_DISABLED');const key='editorial/'+request.accountId+'/'+request.entitlementId+'/'+request.requestDigest;const old=await store.get(key);if(old)return old;if(inFlight.has(key))return inFlight.get(key);
  const work=(async()=>{const response=await adapter.generate(request);const validation=validateEditorialResponse(request,response);const record=deepFreeze({requestDigest:request.requestDigest,response,validation,origin:adapter.mode,providerCalls:0,publicationAllowed:false});await store.putIfAbsent(key,record);return await store.get(key);})();inFlight.set(key,work);try{return await work;}finally{inFlight.delete(key);}};
}
