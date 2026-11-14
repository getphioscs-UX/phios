// Free public composition consumes the existing KIR gateway and the one shared
// cost ledger. It owns neither retrieval authority nor a second Ask/ledger.
import {createKirR2ModelGateway} from '../_lib/kir-r2-model-gateway.js';
import {safeSources,publicSourceUrl} from '../_lib/knowledge-source-eligibility.js';
import {createFreeAskMonthlyBudget,FREE_ASK_MONTHLY_POLICY} from '../provider-cost/free-ask-monthly-budget-r1.js';
import {freeAskModelAdmission,FREE_ASK_MODEL} from './ask-task-policy.js';

const clean=v=>String(v??'').normalize('NFKC').trim().replace(/\s+/g,' ');
const sha=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(n=>n.toString(16).padStart(2,'0')).join('');
const stop=code=>{throw Object.assign(Error(code),{code});};
const publicKinds=/^(PUBLISHED_CANONICAL_ARTICLE|REGISTERED_FIGURE_SEMANTICS|REGISTERED_CONCEPT|PUBLIC_CONTEXT|CIVILIZATION_ATLAS_[A-Z_]+)$/;
const privateQuestion=/\b(?:my|mine|our|ours)\b|我的|我最近|我现在|我们家|本人|账户|帳戶/i;

export function freeAskPublicSources(bundle={}){
 return safeSources(bundle.sources).filter(s=>publicKinds.test(s.sourceType)&&
  (s.sourceType==='PUBLISHED_CANONICAL_ARTICLE'||s.public===true||s.publiclyAccessible===true||['ADMITTED','ACTIVATED'].includes(s.currentAdmission||s.admissionStatus))&&
  !['BOOK-7','BOOK-8'].includes(s.bookCode||s.bookId)&&!s.wholeChapterCandidate&&
  s.private!==true&&s.isPrivate!==true&&!s.accountId&&!s.ownerAccountId&&!s.subjectId&&
  (!s.participant||s.participant==='PUBLIC')&&(!s.accessScope||s.accessScope==='PUBLIC')&&
  Boolean(publicSourceUrl(s.href||s.sourceUrl)));
}
export function freeAskOrganizationNeeded({question,bundle={},projection={},coverageDecision={},sourceNativeAnswered=false}={}){
 if(sourceNativeAnswered||projection.answer?.generation?.sourceNativeExtractiveUnitConsumed||projection.answer?.epistemicReading)return false;
 if(coverageDecision.answerCompositionEligible!==true||bundle.normalization?.hints?.containsPersonalContextHint||privateQuestion.test(question||''))return false;
 // Existing numeric facts and independent source-native answers remain direct.
 if(/多少|几成|股价|总资产|今天|今日|最新|当前|实时|\b(?:how (?:much|many)|price|total assets|when|date|today|latest|current|now|live)\b/i.test(question||''))return false;
 return /为什么|为何|解释|比较|如何.*关系|\b(?:why|explain|compare)\b|how.*relat/i.test(question||'')&&freeAskPublicSources(bundle).length>=2;
}

export async function createFreeAskPublicProvider({env={},question,locale='en',bundle={},projection={},coverageDecision={},sourceNativeAnswered=false,clock=Date.now,fetcher=globalThis.fetch,budgetFactory=createFreeAskMonthlyBudget}={}){
 const admission=freeAskModelAdmission(env,clock());
 if(!admission||!freeAskOrganizationNeeded({question,bundle,projection,coverageDecision,sourceNativeAnswered}))return null;
 if(typeof env.OPENAI_API_KEY!=='string'||!env.OPENAI_API_KEY||await sha(env.OPENAI_API_KEY)!==admission.keySha256)return null;
 let budget;try{budget=budgetFactory(env,{clock});}catch{return null;}
 if(!budget||!['reserve','claim','settle','unknown','read'].every(k=>typeof budget[k]==='function'))return null;
 if(FREE_ASK_MONTHLY_POLICY.model!==FREE_ASK_MODEL||FREE_ASK_MONTHLY_POLICY.maximumMicroUSD!==10000000)return null;
 const admitted=freeAskPublicSources(bundle).map(s=>({...s,text:clean(s.text)}));
 const byId=new Map(admitted.map(s=>[s.sourceId,s]));
 const actorDigest=await sha('FREE_ASK_GLOBAL_ANONYMOUS_R1'); // One conservative anonymous bucket across entrances.
 let invoked=false,usageState='NOT_INVOKED';
 const budgetedFetch=async(url,init={})=>{
  if(invoked)stop('FREE_ASK_NO_AUTOMATIC_RETRY');
  if(url!=='https://api.openai.com/v1/responses'||init.method!=='POST')stop('FREE_ASK_PROVIDER_ENDPOINT_INVALID');
  const original=JSON.parse(init.body||'null');
  if(!original||original.model!==FREE_ASK_MODEL||original.store!==false||original.tools?.length||original.reasoning?.effort!=='none')stop('FREE_ASK_REQUEST_NOT_ADMITTED');
  if(Object.keys(original).some(k=>!['model','store','reasoning','input','max_output_tokens','tools','service_tier','stream'].includes(k)))stop('FREE_ASK_EXTRA_PROVIDER_OPTION_DENIED');
  if(!Array.isArray(original.input)||original.input.length!==2||original.input[0]?.role!=='system'||original.input[1]?.role!=='user'||original.input.some(m=>typeof m.content!=='string'))stop('FREE_ASK_INPUT_NOT_ADMITTED');
  const body={...original,model:FREE_ASK_MODEL,store:false,reasoning:{effort:'none'},max_output_tokens:1024,tools:[],service_tier:'default',stream:false};
  // UTF-8 bytes upper-bound ordinary text tokens; reserve additional framing.
  if(new TextEncoder().encode(JSON.stringify(body.input)).length+1024>8192)stop('FREE_ASK_INPUT_BOUND_EXCEEDED');
  const contextDigest=await sha(JSON.stringify({version:FREE_ASK_MONTHLY_POLICY.version,release:admission.deploymentSha,body}));
  const identity={requestId:'FASK_R1:'+await sha(contextDigest+':'+actorDigest),contextDigest,actorDigest};
  await budget.reserve({...identity,inputTokenBound:8192,outputTokenLimit:1024});
  const claim=await budget.claim(identity);
  if(claim?.mayInvoke!==true||!claim.claimToken)stop('FREE_ASK_ALREADY_RESERVED_OR_EXECUTED');
  const binding={...identity,claimToken:claim.claimToken};
  invoked=true;usageState='CLAIMED';
  try{
   const response=await fetcher(url,{method:'POST',headers:init.headers,body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(45000)});
   let data;try{data=await response.clone().json();}catch{stop('FREE_ASK_PROVIDER_RESPONSE_UNREADABLE');}
   const settled=await budget.settle({...binding,usage:data.usage,model:data.service_tier&&data.service_tier!=='default'?'UNADMITTED_SERVICE_TIER':data.model,providerRequestId:data.id||null});
   usageState=settled?.state||'USAGE_UNKNOWN';
   if(settled?.state!=='METERED'||!response.ok||data.status!=='completed')stop('FREE_ASK_USAGE_OR_RESPONSE_NOT_COMPLETE');
   return response;
  }catch(error){if(usageState==='CLAIMED')usageState='USAGE_UNKNOWN';try{await budget.unknown(binding);}catch{/* Existing RESERVED/UNKNOWN liability is never released here. */}throw error;}
 };
 // Force the existing gateway; never enter its alternate-provider or model-upgrade routing.
 const gateway=createKirR2ModelGateway({env:{OPENAI_API_KEY:env.OPENAI_API_KEY,PHIOS_KIR_R2_OPENAI_MODEL:FREE_ASK_MODEL},fetcher:budgetedFetch,forceProvider:'OPENAI_LUNA'});
 const provider=async({payload={}}={})=>{
  const rows=[...(payload.evidencePack?.primaryEvidence||[]),...(payload.evidencePack?.supportingEvidence||[])];
  const selected=[...new Map(rows.filter(r=>{const trusted=byId.get(r.sourceId);return trusted&&clean(r.text).length>=6&&trusted.text.includes(clean(r.text));}).map(r=>[r.sourceId,byId.get(r.sourceId)])).values()];
  if(selected.length<2)stop('FREE_ASK_INSUFFICIENT_ADMITTED_PUBLIC_EVIDENCE');
  // No private allowedContext or unverified profile expansion reaches the model.
  return gateway({model:'LUNA',payload:{question,locale,evidencePack:{primaryEvidence:selected.slice(0,2),supportingEvidence:selected.slice(2)},allowedContext:null,answerContract:{questionType:payload.answerContract?.questionType||'OTHER'}}});
 };
 Object.defineProperty(provider,'freeAskReceipt',{value:()=>Object.freeze({providerCalls:invoked?1:0,providerInvoked:invoked,model:invoked?FREE_ASK_MODEL:null,usageState})});
 return provider;
}
