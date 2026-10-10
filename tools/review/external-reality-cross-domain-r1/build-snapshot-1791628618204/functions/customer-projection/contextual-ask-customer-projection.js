import {contextualAskDisclosure} from '../contextual-ask/contextual-ask-runtime.js';
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const clean=v=>String(v??'').trim();
const list=v=>Array.isArray(v)?v:[];
const safeHref=v=>{const s=clean(v);if(!s)return null;if(s.startsWith('/'))return s;try{const u=new URL(s);return u.protocol==='https:'?u.href:null}catch{return null}};
function contextSourceCards(contexts,answerPayload){
 const ask2Internal=answerPayload?.ask2?.plan?.currentReality?.internal;
 return list(contexts).filter(item=>item.contextType!=='KNOWLEDGE').map(item=>freeze({
   label:item.label,sourceClass:item.sourceClass,sourceAuthority:item.sourceAuthority,participant:item.participant,caseScope:item.caseScope,
   excerpt:item.summary||null,href:null,retrievedAt:item.generatedAt||null,freshness:item.freshness||null,limitations:item.limitations,
   answerUseState:item.contextType==='CURRENT_REALITY'&&ask2Internal?'CONSUMED_BY_CURRENT_CONTEXT_RUNTIME':'SELECTED_CONTEXT_DISCLOSED',contextRef:item.contextRef
 }));
}
export function projectContextualAskForCustomer(baseView={}, {contexts=[],currentFacts=null,answerPayload=null,locale='en'}={}){
 const disclosure=contextualAskDisclosure(contexts,currentFacts,locale);
 const runtimeSources=list(baseView?.basedOn?.sources).map(s=>freeze({label:clean(s?.label)||'Source',sourceClass:clean(s?.sourceClass)||'GOVERNED_SOURCE',sourceAuthority:clean(s?.sourceAuthority)||null,participant:clean(s?.participant)||null,caseScope:clean(s?.caseScope)||null,excerpt:clean(s?.excerpt)||null,href:safeHref(s?.href),retrievedAt:clean(s?.retrievedAt)||null,freshness:clean(s?.freshness)||null,limitations:list(s?.limitations),answerUseState:'RUNTIME_GROUNDING',contextRef:null}));
 const contextCards=contextSourceCards(contexts,answerPayload);
 const allSources=[...runtimeSources,...contextCards];
 const groups=[];for(const source of allSources){let group=groups.find(x=>x.sourceClass===source.sourceClass);if(!group){group={sourceClass:source.sourceClass,sources:[]};groups.push(group)}group.sources.push(source)}
 return freeze({...baseView,schemaVersion:'PHI-OS-CX-R9-R2-CONTEXTUAL-ASK-CUSTOMER-v2.0.0',surface:'CONTEXTUAL_ASK',canonicalRoute:'/knowledge/ask/',selectedContext:disclosure,answerStructure:{answer:baseView?.answer||null,basedOnGroups:groups,currentVsStable:disclosure.currentVsStable,limits:baseView?.limits||{items:[]},related:baseView?.relatedKnowledge||[],nextStep:baseView?.possibleNextStep||null},provenance:{groups,collapsedByDefault:true,internalLifecycleCodesVisibleByDefault:false},governance:{...(baseView?.governance||{}),oneContextualAsk:true,genericChatbotSurface:false,silentContextInjection:false,selectedContextEqualsProof:false,profileConvergenceIsProof:false,relationshipHiddenStateInference:false,professionalRecommendationCreatedByAsk:false,entitlementOwnedByAsk:false}});
}
