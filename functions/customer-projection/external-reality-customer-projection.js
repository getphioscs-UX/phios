import {personIdentity} from '../account/canonical-person-store.js';
import {resolveExternalRealityInputs} from '../external-reality-impact/external-reality-impact-runtime.js';
const states={LIVE_SOURCE_UNAVAILABLE:['No admitted current external source is available.','当前没有可准入的外部来源。'],AUTHORITY_NOT_MAPPED:['The source authority has not been verified for this jurisdiction and topic.','尚未核实该来源在此辖区与主题下的权威性。'],JURISDICTION_UNKNOWN:['Confirm the jurisdiction relevant to this question; language does not establish it.','请确认与此问题相关的辖区；界面语言不能确定辖区。'],SOURCE_STALE:['This source is stale; it cannot be used as current evidence.','该来源已过时，不能作为当前证据。'],SOURCE_CONFLICTED:['The sources conflict; applicability remains unresolved.','来源存在冲突；适用性尚未解决。'],APPLICABILITY_UNKNOWN:['Applicability to your jurisdiction has not been established.','尚未确定该信息是否适用于你的辖区。'],CONSENT_REQUIRED:['Your explicit consent is required to compare this source with your current situation.','将此来源与你的当前处境比较前，需要你的明确同意。'],NO_MATERIAL_CASE_RELEVANCE:['No material relevance to this question has been established.','尚未建立它与本次问题的实质关联。'],IMPACT_CANDIDATES_AVAILABLE:['A possible relevance is available for review; no facts or decisions were changed.','有一项可能关联可供复核；没有更改事实或决定。']};
export function projectExternalRealityForCustomer(inputs={}, {locale='en',now}={}){
 const r=resolveExternalRealityInputs(inputs,{now});const zh=locale==='zh-Hans',i=r.items?.[0],e=r.event;
 return {schemaVersion:'PHI-OS-CX-EXTERNAL-REALITY-R1',state:r.state,message:(states[r.state]||states.LIVE_SOURCE_UNAVAILABLE)[zh?1:0],items:e&&i?[{eventId:e.eventId,statement:e.title,sourceId:e.sourceReferences[0].sourceId,sourceUrl:e.sourceReferences[0].sourceUrl,sourceVersion:e.sourceReferences[0].sourceVersion,publisher:e.sourceReferences[0].publisher,originalTitle:e.sourceReferences[0].originalTitle,sourceLocale:e.sourceReferences[0].sourceLocale,customerLocale:zh?'zh-Hans':'en',translationState:'ORIGINAL_SOURCE_TEXT_NOT_SYSTEM_TRANSLATED',authorityClass:e.authorityClass,jurisdiction:e.jurisdiction,publishedAt:e.publishedAt,effectiveAt:e.effectiveAt,retrievedAt:e.retrievedAt,freshness:e.freshnessState,eventState:e.eventState,relevanceState:i.relevanceState,affectedDomains:i.affectedDomains,unknowns:i.unknowns,consentRequirement:i.requiredConsent,professionalGate:i.professionalEscalations,reviewTriggerState:r.reviewTriggers[0]?.triggerState||null,edgeMeaning:'POSSIBLE_RELATIONSHIP_NOT_CAUSATION',personalFact:false}]:[],governance:r.governance};
}

export function projectExternalRealityContext(context,{locale='en',now,realityRef,realityVersion}={}){
 const input=context?.data?.externalRealityInputs;
 if(!input)return projectExternalRealityForCustomer({},{locale,now});
 const fixture=input.eventInput?.authorityCoverage?.state==='CONTROLLED_FIXTURE';
 const local=context.env?.EXTERNAL_REALITY_FIXTURE_MODE==='LOCAL_ONLY'&&['localhost','127.0.0.1'].includes(new URL(context.request.url).hostname);
 if(fixture&&!local)return projectExternalRealityForCustomer({},{locale,now});
 let identity;try{identity=personIdentity(context);}catch{}
 const bundle=context.data?.cxRealitySources?.bundle;
 const ref=realityRef===undefined?bundle?.bundleId:realityRef,version=realityVersion===undefined?bundle?.version:realityVersion;
 if(!identity||!ref||!version||input.caseContext?.currentRealityRef!==ref||input.caseContext?.sourceVersion!==version||input.caseContext?.ownerId!==identity.userId||input.processingConsent!==true)return projectExternalRealityForCustomer({eventInput:input.eventInput,processingConsent:false},{locale,now});
 return projectExternalRealityForCustomer(input,{locale,now});
}
