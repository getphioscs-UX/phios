import {contextualAskDisclosure} from '../contextual-ask/contextual-ask-runtime.js';
import {resolveExplicitAskContexts,routeGuidedAsk} from '../contextual-ask/contextual-ask-runtime.js';

// Deterministic source-specific consumer in the existing Ask projection owner.
// Past accounts remain past self-reports, not observed present facts or model answers.
export function receivePersonalEvidenceQuestion({references,question,locale='en'}){
 const zh=locale==='zh-Hans';
 const contexts=resolveExplicitAskContexts({requested:[{contextType:'CURRENT_REALITY'}],guidedContext:{selectedHistoricalAccounts:references.map(r=>`${r.observationPeriod.start}: ${r.action}; ${r.outcome}; ${r.unknowns}`).join('\n')},contextConsent:{CURRENT_REALITY:true},locale});
 const route=routeGuidedAsk({question,confirmedReality:true});
 return projectContextualAskForCustomer({surface:'ASK',locale,question,
  answer:{text:zh?'所选经历表明你曾承担以下工作；它们支持“做过这些事”的自述，尚不能独立证明能力水平、成果归因或职业资格。':'Your selected accounts describe work you have carried out. They support your account of these activities, but do not independently establish proficiency, causal impact or occupational qualification.',supporting:references.map(r=>r.action+(r.outcome?' — '+r.outcome:''))},
  basedOn:{sources:references.map(r=>({label:r.observationPeriod.start,excerpt:r.action,sourceClass:'SELF_REPORTED',sourceAuthority:'PROFILE_EVIDENCE_RECORD',href:null})),statement:zh?'仅使用这次选择的过去经历。':'Only the historical accounts selected for this question are used.'},
  limits:{items:references.map(r=>r.unknowns)},relatedKnowledge:[],possibleNextStep:{kind:'VERIFY_SELECTED_EVIDENCE',label:zh?'针对这个问题，核对实际负责范围、可观察成果及一个反例。':'For this question, verify your actual responsibility, observable results and one counterexample.'},route,
  sourceReferences:references,execution:{providerCalls:0,generationMode:'DETERMINISTIC_SELECTED_EVIDENCE'},governance:{pastAccountsAreCurrentFacts:false,privateEvidenceIndexed:false,automaticallySaved:false}}, {contexts,locale});
}
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
