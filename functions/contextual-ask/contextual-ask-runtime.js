import {ASK_CONTEXT_SOURCE_REGISTRY,contextDefinition} from './context-source-registry.js';
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const clean=v=>String(v??'').trim();
const list=v=>Array.isArray(v)?v:[];
const fail=(code,status=422)=>{const e=new Error(code);e.code=code;e.status=status;throw e};
const hasGuidedContext=value=>Boolean(value&&typeof value==='object'&&Object.values(value).some(x=>clean(x)));
function publicDefinition(row,locale='en'){return freeze({contextType:row.contextType,label:row.customerDisclosureLabel[locale==='zh-Hans'?'zh':'en'],sourceClass:row.sourceClass,participantScope:row.participantScope,caseScope:row.caseScope,consentRequired:row.consentRequired,entitlementRequired:row.entitlementRequired,freshnessPolicy:row.freshnessPolicy})}
export function buildAskContextAvailability({locale='en',requestedContextSeed=null}={}){
 const base=[
  {...publicDefinition(contextDefinition('KNOWLEDGE'),locale),availability:'AVAILABLE',reason:'PUBLIC_GOVERNED_SOURCE'},
  {...publicDefinition(contextDefinition('CURRENT_REALITY'),locale),availability:'AVAILABLE_WITH_EXPLICIT_INPUT',reason:'CUSTOMER_MAY_SUPPLY_QUESTION_SCOPED_CURRENT_CONTEXT'}
 ];
 const seedType=clean(requestedContextSeed?.contextType).toUpperCase();
 if(seedType&&seedType!=='KNOWLEDGE'&&seedType!=='CURRENT_REALITY'){
  const row=contextDefinition(seedType);if(row)base.push({...publicDefinition(row,locale),availability:'REQUIRES_SERVER_AUTHORIZED_CONTEXT',reason:'NO_SILENT_ACCOUNT_SWEEP',requestedContextRef:clean(requestedContextSeed?.contextRef)||null});
 }
 return freeze(base);
}
function normalizeResolvedContext(item,locale){
 const type=clean(item?.contextType).toUpperCase(),row=contextDefinition(type);if(!row)fail('ASK_CONTEXT_TYPE_NOT_REGISTERED',400);
 if(item?.serverAuthorized!==true)fail('ASK_CONTEXT_SERVER_AUTHORIZATION_REQUIRED',403);
 if(row.entitlementRequired&&item?.entitlementState!=='ENTITLED')fail('ASK_CONTEXT_ENTITLEMENT_REQUIRED',403);
 if(row.consentRequired&&item?.consent?.accepted!==true)fail('ASK_CONTEXT_CONSENT_REQUIRED',403);
 const ref=clean(item?.contextRef);if(!ref)fail('ASK_CONTEXT_REF_REQUIRED',400);
 return freeze({contextType:type,contextRef:ref,label:clean(item?.label)||row.customerDisclosureLabel[locale==='zh-Hans'?'zh':'en'],sourceAuthority:row.sourceAuthority,sourceClass:row.sourceClass,participant:clean(item?.participant)||row.participantScope,caseScope:clean(item?.caseScope)||row.caseScope,whyUsed:clean(item?.whyUsed)||'CUSTOMER_SELECTED_CONTEXT',saved:Boolean(item?.saved),generatedAt:clean(item?.generatedAt)||null,freshness:clean(item?.freshness)||null,limitations:list(item?.limitations).map(clean).filter(Boolean),selectedRefs:list(item?.selectedRefs).map(clean).filter(Boolean),summary:clean(item?.summary)||null,entitlementState:row.entitlementRequired?item.entitlementState:'NOT_REQUIRED',consentAccepted:row.consentRequired?true:'NOT_REQUIRED',answerUseBoundary:row.answerUseBoundary});
}
export function resolveExplicitAskContexts({requested=[],guidedContext={},contextConsent={},resolvedContexts=[],locale='en'}={}){
 const requests=list(requested).map(x=>({contextType:clean(x?.contextType).toUpperCase(),contextRef:clean(x?.contextRef)||null})).filter(x=>x.contextType);
 const accepted=[];const seen=new Set();
 for(const request of requests){
  if(request.contextType==='NONE')continue;
  if(seen.has(`${request.contextType}:${request.contextRef||''}`))continue;seen.add(`${request.contextType}:${request.contextRef||''}`);
  const row=contextDefinition(request.contextType);if(!row)fail('ASK_CONTEXT_TYPE_NOT_REGISTERED',400);
  if(request.contextType==='KNOWLEDGE'){
   accepted.push(freeze({contextType:'KNOWLEDGE',contextRef:'PHIOS_GOVERNED_KNOWLEDGE',label:row.customerDisclosureLabel[locale==='zh-Hans'?'zh':'en'],sourceAuthority:row.sourceAuthority,sourceClass:row.sourceClass,participant:'SELF',caseScope:'QUESTION',whyUsed:'DEFAULT_OR_CUSTOMER_SELECTED_GOVERNED_KNOWLEDGE',saved:false,generatedAt:null,freshness:'VERSIONED',limitations:[],selectedRefs:[],summary:null,entitlementState:'NOT_REQUIRED',consentAccepted:'NOT_REQUIRED',answerUseBoundary:row.answerUseBoundary}));continue;
  }
  if(request.contextType==='CURRENT_REALITY'&&!request.contextRef){
   if(!hasGuidedContext(guidedContext))fail('ASK_CURRENT_REALITY_CONTEXT_INPUT_REQUIRED',400);
   if(contextConsent?.CURRENT_REALITY!==true)fail('ASK_CONTEXT_CONSENT_REQUIRED',403);
   accepted.push(freeze({contextType:'CURRENT_REALITY',contextRef:'ASK_EPHEMERAL_CURRENT_CONTEXT',label:row.customerDisclosureLabel[locale==='zh-Hans'?'zh':'en'],sourceAuthority:'CUSTOMER_REPORTED_CONTEXT',sourceClass:'SELF_REPORTED_CURRENT_REALITY',participant:'SELF',caseScope:'QUESTION',whyUsed:'CUSTOMER_SELECTED_CURRENT_CONTEXT',saved:false,generatedAt:null,freshness:'CURRENT_SESSION',limitations:['SELF_REPORTED_CONTEXT_NOT_CANONICAL_REALITY'],selectedRefs:[],summary:Object.entries(guidedContext).filter(([,v])=>clean(v)).map(([k,v])=>`${k}: ${clean(v)}`).join(' · '),entitlementState:'NOT_REQUIRED',consentAccepted:true,answerUseBoundary:'CONTEXT_ONLY_NO_TRUTH_ELEVATION'}));continue;
  }
  const match=list(resolvedContexts).find(x=>clean(x?.contextType).toUpperCase()===request.contextType&&clean(x?.contextRef)===request.contextRef);
  if(!match)fail(`ASK_CONTEXT_NOT_AUTHORIZED:${request.contextType}`,403);
  accepted.push(normalizeResolvedContext(match,locale));
 }
 return freeze(accepted);
}
export function contextualAskDisclosure(contexts=[],currentFacts=null){
 const used=list(contexts);const groups={};for(const item of used){const key=item.sourceClass||'OTHER';(groups[key]??=[]).push(item)}
 const current=[];const stable=[];for(const item of used){if(['CURRENT_REALITY','CONTINUITY_CONTEXT'].includes(item.contextType))current.push(item);else stable.push(item)}
 if(currentFacts?.state==='AVAILABLE')current.push(freeze({contextType:'CURRENT_FACTS',contextRef:'CURRENT_FACTS_GATEWAY',label:'Current public facts',sourceAuthority:'CURRENT_FACTS_GATEWAY',sourceClass:'CURRENT_PUBLIC_FACT',participant:'PUBLIC',caseScope:'QUESTION',whyUsed:'QUESTION_REQUIRES_CURRENT_FACT',saved:false,generatedAt:currentFacts.retrievedAt||null,freshness:currentFacts.freshness||null,limitations:list(currentFacts.limitations),selectedRefs:[],summary:null,entitlementState:'NOT_REQUIRED',consentAccepted:'NOT_REQUIRED',answerUseBoundary:'CURRENT_FACT_ONLY_NOT_CANONICAL_KNOWLEDGE'}));
 return freeze({schemaVersion:'PHI-OS-CX-R9-R2-CONTEXT-DISCLOSURE-v1.0.0',contexts:used,groups:Object.entries(groups).map(([sourceClass,items])=>freeze({sourceClass,items})),currentVsStable:{current,stable},noSilentAccountSweep:true,sourceClassesEqualScientificStatus:false});
}
export function contextRegistryForAudit(){return ASK_CONTEXT_SOURCE_REGISTRY}
