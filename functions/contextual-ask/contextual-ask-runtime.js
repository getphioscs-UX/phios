import {ASK_CONTEXT_SOURCE_REGISTRY,contextDefinition} from './context-source-registry.js';
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const clean=v=>String(v??'').trim();
const list=v=>Array.isArray(v)?v:[];
const fail=(code,status=422)=>{const e=new Error(code);e.code=code;e.status=status;throw e};
const hasGuidedContext=value=>Boolean(value&&typeof value==='object'&&Object.values(value).some(x=>clean(x)));
export function routeGuidedAsk({question='',selectedMethod=null,confirmedReality=null,methodGuidanceRequested=false,registry}={}){
 const methods=list(registry?.guidedReportMethods).length?list(registry.guidedReportMethods):list(registry?.methods), selected=[...methods,...list(registry?.methods)].find(m=>m.methodId===selectedMethod);
 if(selectedMethod){if(!selected)fail('ASK_SELECTED_METHOD_INVALID');return {mode:'USER_SELECTED_METHOD',method:selected.methodId,executionGranted:false};}
 if(methodGuidanceRequested){
  const interests=[];
  for(const [tag,pattern] of [['TIMING',/period|cycle|when|周期|阶段|何时/i],['CURRENT_OPERATION',/tired|exhaust|operat|消耗|疲惫|运行/i],['ENVIRONMENT',/environment|环境/i],['DECISION_OBSERVATION',/decision|decid|选择|决定/i],['REPEATED_THEMES',/repeat|反复|重复/i],['ASSESSMENT_COMPARISON',/assessment|profile|测评|侧写/i],['MULTIPLE_READINGS',/different reports|compare readings|多个报告|不同报告/i],['LIFE_DOMAINS',/career|relationship|work|事业|关系|工作/i]])if(pattern.test(question))interests.push(tag);
  if(!interests.length)interests.push('CURRENT_REALITY');
  const eligible=methods.filter(m=>(m.routingOnly===true||m.experienceState==='AVAILABLE_IN_THIS_READING')&&m.publicSelectionAllowed!==false&&m.routingProfile?.supportsDecisionObservation)
   .map(m=>({m,score:interests.filter(x=>m.routingProfile.strongFor.includes(x)).length})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).map(x=>x.m);
  return {mode:'METHOD_GUIDANCE',primary:eligible[0]?.methodId||null,alternatives:eligible.slice(1,3).map(m=>m.methodId),interests,requires:eligible[0]?.routingProfile.requires||[],wording:'A possible starting point; you can choose another method.',executionGranted:false};
 }
 const personal=/(?:我(?:最近|现在|该|应该|正在|的处境)|\b(?:I am|I feel|my situation|should I)\b)/i.test(question);
 if(personal&&!confirmedReality)return {mode:'CLARIFY',question:'What is happening, and what would be useful to understand?',evidencePromoted:false};
 return {mode:confirmedReality?'REALITY_BASED_RESPONSE':'DIRECT_ANSWER',recommendMethod:false};
}
const PUBLIC_KNOWLEDGE_REF=/^(?:ARTICLE:[a-z0-9][a-z0-9-]{0,119}|BOOK:BOOK-[1-8]|FIGURE:figure-[a-z0-9-]{1,79}|CONCEPT:[a-z0-9][a-z0-9-]{0,79})$/;
export function isPublicKnowledgeContextRef(value){return PUBLIC_KNOWLEDGE_REF.test(clean(value))}
function publicDefinition(row,locale='en'){return freeze({contextType:row.contextType,label:row.customerDisclosureLabel[locale==='zh-Hans'?'zh':'en'],sourceClass:row.sourceClass,participantScope:row.participantScope,caseScope:row.caseScope,consentRequired:row.consentRequired,entitlementRequired:row.entitlementRequired,freshnessPolicy:row.freshnessPolicy})}
export function buildAskContextAvailability({locale='en',requestedContextSeed=null}={}){
 const base=[
  {...publicDefinition(contextDefinition('KNOWLEDGE'),locale),availability:'AVAILABLE',reason:'PUBLIC_GOVERNED_SOURCE'},
  {...publicDefinition(contextDefinition('CURRENT_REALITY'),locale),availability:'AVAILABLE_WITH_EXPLICIT_INPUT',reason:'CUSTOMER_MAY_SUPPLY_QUESTION_SCOPED_CURRENT_CONTEXT'}
 ];
 const seedType=clean(requestedContextSeed?.contextType).toUpperCase(),seedRef=clean(requestedContextSeed?.contextRef);
 if(seedType==='KNOWLEDGE'&&seedRef&&isPublicKnowledgeContextRef(seedRef)){
  const knowledge=base.find(item=>item.contextType==='KNOWLEDGE');
  knowledge.requestedContextRef=seedRef;knowledge.reason='CUSTOMER_SELECTED_PUBLISHED_KNOWLEDGE_REF';
 }
 if(seedType&&seedType!=='KNOWLEDGE'&&seedType!=='CURRENT_REALITY'){
  const row=contextDefinition(seedType);if(row)base.push({...publicDefinition(row,locale),availability:'REQUIRES_SERVER_AUTHORIZED_CONTEXT',reason:'NO_SILENT_ACCOUNT_SWEEP',requestedContextRef:seedRef||null});
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
   if(request.contextRef&&!isPublicKnowledgeContextRef(request.contextRef))fail('ASK_PUBLIC_KNOWLEDGE_REF_INVALID',400);
   const specific=request.contextRef||null;
   accepted.push(freeze({contextType:'KNOWLEDGE',contextRef:specific||'PHIOS_GOVERNED_KNOWLEDGE',label:row.customerDisclosureLabel[locale==='zh-Hans'?'zh':'en'],sourceAuthority:row.sourceAuthority,sourceClass:row.sourceClass,participant:'PUBLIC',caseScope:specific?'SOURCE':'QUESTION',whyUsed:specific?'CUSTOMER_SELECTED_PUBLISHED_KNOWLEDGE_REF':'DEFAULT_OR_CUSTOMER_SELECTED_GOVERNED_KNOWLEDGE',saved:false,generatedAt:null,freshness:'VERSIONED',limitations:[],selectedRefs:specific?[specific]:[],summary:null,entitlementState:'NOT_REQUIRED',consentAccepted:'NOT_REQUIRED',answerUseBoundary:row.answerUseBoundary}));continue;
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
export function contextualAskDisclosure(contexts=[],currentFacts=null,locale='en'){
 const used=list(contexts);const groups={};for(const item of used){const key=item.sourceClass||'OTHER';(groups[key]??=[]).push(item)}
 const current=[];const stable=[];for(const item of used){if(['CURRENT_REALITY','CONTINUITY_CONTEXT'].includes(item.contextType))current.push(item);else stable.push(item)}
 if(currentFacts?.state==='AVAILABLE'){const currentFactsDefinition=contextDefinition('CURRENT_FACTS');current.push(freeze({contextType:'CURRENT_FACTS',contextRef:'CURRENT_FACTS_GATEWAY',label:currentFactsDefinition.customerDisclosureLabel[locale==='zh-Hans'?'zh':'en'],sourceAuthority:'CURRENT_FACTS_GATEWAY',sourceClass:'CURRENT_PUBLIC_FACT',participant:'PUBLIC',caseScope:'QUESTION',whyUsed:'QUESTION_REQUIRES_CURRENT_FACT',saved:false,generatedAt:currentFacts.retrievedAt||null,freshness:currentFacts.freshness||null,limitations:list(currentFacts.limitations),selectedRefs:[],summary:null,entitlementState:'NOT_REQUIRED',consentAccepted:'NOT_REQUIRED',answerUseBoundary:'CURRENT_FACT_ONLY_NOT_CANONICAL_KNOWLEDGE'}));}
 return freeze({schemaVersion:'PHI-OS-CX-R9-R2-CONTEXT-DISCLOSURE-v1.0.0',contexts:used,groups:Object.entries(groups).map(([sourceClass,items])=>freeze({sourceClass,items})),currentVsStable:{current,stable},noSilentAccountSweep:true,sourceClassesEqualScientificStatus:false});
}
export function contextRegistryForAudit(){return ASK_CONTEXT_SOURCE_REGISTRY}

// Resolve the existing published-article projection; never use URL-supplied prose as evidence.
export async function resolveSelectedArticle(env,slug,locale='en') {
 if(!/^[a-zA-Z0-9_-]+$/.test(slug||'')||!env?.ASSETS?.fetch)return null;
 const read=async path=>{const r=await env.ASSETS.fetch(new Request('https://assets.local'+path));return r.ok?r.json():null;};
 try{
  const paths=['/content/knowledge/public/visual-article-release.json','/content/knowledge/public/abl-bilingual-release.json','/content/knowledge/public/successors/book4-publication-v1/visual-article-release.json','/content/knowledge/public/successors/book5-publication-v1/visual-article-release.json'];
  const manifests=await Promise.all(paths.map(read));
  const row=manifests.flatMap(m=>m?.records||[]).find(r=>(r.slug===slug||r.nodeCode?.toLowerCase()===slug.toLowerCase())&&r.locale===locale&&r.status==='published');
  if(!row?.path?.startsWith('/content/knowledge/public/'))return null;
  const article=await read(row.path);
  if(article?.publicationStatus!=='published'||article?.reviewStatus!=='approved'||article?.locale!==locale||article?.slug!==row.slug)return null;
  const paragraphs=(article.sections||[]).flatMap(s=>(s.blocks||[]).map(b=>b.text||b.statement||'')).filter(Boolean);
  if(!paragraphs.length)return null;
  const href=article.publicHref||row.href;
  if(!href?.startsWith('/articles/')||href.startsWith('//'))return null;
  const bookCode=article.publicationContext?.bookCode || (article.nodeCode?.match(/^KN-B([1-8])/i)?.[1]?'BOOK-'+article.nodeCode.match(/^KN-B([1-8])/i)[1]:null);
  return {slug:article.slug,title:article.title,href,locale,nodeCode:article.nodeCode,bookCode,articleContext:article.askContext||null,sourceReading:article.sourceReading||null,atlasLinks:article.connections?.relatedAtlasEntries||[],sources:paragraphs.map((text,i)=>({sourceId:'ARTICLE:'+slug+':'+i,fragmentCode:slug+'-'+i,sourceType:'PUBLISHED_CANONICAL_ARTICLE',authorityClass:'PUBLISHED_ARTICLE_AUTHORITY',nodeCode:article.nodeCode,bookCode,title:article.title,href,locale,text,scopeMatch:true,selected:true,articleSlug:slug}))};
 }catch{return null;}
}
