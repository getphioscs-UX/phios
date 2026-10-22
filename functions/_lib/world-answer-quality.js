// Local successor of World explanation assembly. No model, new index or storage owner.
import {evaluateKapQuestionSourceRelevance} from './knowledge-answer-grounding.js';
const PATH='/content/world/local-answer-quality-r1.json';
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
export function classifyWorldQuestion(question){
 const q=question.normalize('NFKC');
 if(/多少|几成|具体.*数值|概率|最新|实时|\bhow (?:many|much)\b|\b(?:latest|current value|probability)\b|what (?:is|was|are|were).*?(?:rate|share|percentage|value)/i.test(q))return 'FACT_OR_NUMERIC';
 if(/比较|差别|\bcompar|difference|versus|\bvs\b/i.test(q))return 'COMPARISON';
 if(/我该|我的|换工作|\bmy\b|\bshould I\b|career|job change/i.test(q))return 'PERSONAL_CONDITIONS';
 return 'MECHANISM';
}
export function assessWorldProposition({proposition,sourceId,unit,sources}){
 const source=sources[sourceId];
 if(!source)return {classification:'NEEDS_VERIFICATION',reason:'SOURCE_MISSING'};
 if(proposition.contradiction===true)return {classification:'CONTRADICTED',reason:'REVIEWED_CONTRADICTION'};
 const known=[unit.direct,...unit.reasons].find(p=>JSON.stringify(p)===JSON.stringify(proposition));
 if(!known)return {classification:'IRRELEVANT',reason:'NOT_THE_REVIEWED_PROPOSITION'};
 if(!known.sourceIds.includes(sourceId))return {classification:'BACKGROUND_ONLY',reason:'NO_PROPOSITION_LINK'};
 if(known.support!=='DIRECT_SUPPORT')return {classification:'PARTIAL_SUPPORT',reason:'SUPPORT_SCOPE_INCOMPLETE'};
 if(source.verification!=='OFFICIAL_WEB_READ'||source.access!=='PUBLIC')return {classification:'NEEDS_VERIFICATION',reason:'SOURCE_NOT_ADMITTED'};
 const facets=known.sourceFacets?.[sourceId]||[],complete=known.requiredFacets?.every(f=>facets.includes(f));
 return {classification:complete?'DIRECT_SUPPORT':'PARTIAL_SUPPORT',facets,reason:complete?'REVIEWED_PROPOSITION_SOURCE_LINK':'SUPPORTS_DEFINED_PART_OF_COMPOUND_PROPOSITION',scope:source.scope};
}
export async function loadWorldQualityAnswer({question,locale,env}){
 const r=await env.ASSETS.fetch(new Request('https://assets.local'+PATH));if(!r.ok)return null;
 const bytes=await r.text(),catalog=JSON.parse(bytes);if(catalog.authority!=='LOCAL_REVIEW_ONLY_NOT_CANONICAL_KNOWLEDGE')throw Error('SOURCE_AUTHORITY_INVALID');
 const kind=classifyWorldQuestion(question),matched=catalog.units.filter(u=>u.matchGroups.every(group=>group.some(pattern=>new RegExp(pattern,'i').test(question))));
 if(!matched.length)return null;
 // Exact country statistics and forecasts must still use the typed World owner.
 if(kind==='FACT_OR_NUMERIC'&&!/why|为什么|为何|如何影响|怎样影响|how.*affect/i.test(question))return {state:'NUMERIC_EVIDENCE_REQUIRED',question,locale,sources:[],segments:[],directAnswer:locale==='en'?'A reliable number needs a defined measure, place and observation period. This local explanation path has not retrieved that observation, so it cannot give you a value or personal probability.':'可靠数值需要明确指标、地区与观察期。这个本地解释入口没有取到相应观测，不能给出数字或个人概率。',reasons:[],impact:locale==='en'?'A general mechanism cannot substitute for the requested measurement.':'通用机制不能替代你所要求的测量。',nextSteps:locale==='en'?['Specify the measure, place and period, then query the relevant statistical source.','If the number is unavailable, ask separately about the mechanism or comparison method.']:['明确指标、地区和时期，再查对应统计来源。','若数值不存在，可另问机制或比较方法。'],boundary:locale==='en'?'No missing value has been estimated or invented.':'没有估算或补造缺失数值。',providerCalls:0,providerUsed:false,quality:'NUMERIC_LIMITATION',questionType:kind};
 const unit=matched[0],segments=[],sources=[],relevance=[];
 const proportional=unit.id==='oil-costs'&&/同一比例|同比例|same proportion|same percentage/i.test(question);
 const selectedPropositions=proportional?[unit.reasons[1],unit.direct,unit.reasons[0]]:[unit.direct,...unit.reasons];
 for(const [i,p]of selectedPropositions.entries()){
  const refs=[],supported=new Set();
  for(const id of p.sourceIds){const source=catalog.sources[id],decision=assessWorldProposition({proposition:p,sourceId:id,unit,sources:catalog.sources});relevance.push({unit:unit.id,proposition:i,sourceId:id,...decision});if(!['DIRECT_SUPPORT','PARTIAL_SUPPORT'].includes(decision.classification))continue;for(const f of decision.facets||[])supported.add(f);
   if(await hash(source.quote)!==source.excerptSha256)throw Error('SOURCE_EXCERPT_CHANGED');if(!/^https:\/\//.test(source.url))throw Error('SOURCE_URL_INVALID');
   if(!sources.some(s=>s.sourceId===id))sources.push({sourceId:id,fragmentCode:source.locator,sourceVersion:source.excerptSha256,sourceType:'PUBLIC_AUTHORITY_EXPLANATION',title:source.title,href:source.url,text:source.quote,sourceDigest:source.excerptSha256,publishedAt:source.publishedAt,retrievedAt:source.retrievedAt,publisher:source.publisher,language:source.language,scope:source.scope,publicationOwner:'EXISTING_WORLD_LOCAL_SOURCE_OWNER',sourcePath:PATH,matchedTerms:[unit.id],admission:source.admission});refs.push(id);
  }
  if(!refs.length||!p.requiredFacets.every(f=>supported.has(f)))throw Error('PROPOSITION_WITHOUT_SUPPORT');segments.push({role:i?'reason':'direct',text:p.text[locale],sourceRefs:refs,support:'JOINT_SUPPORT_COMPLETE',nature:['manufacturing-comparison','career-conditions'].includes(unit.id)?'METHOD_GUIDANCE':'MECHANISM_EXPLANATION'});
 }
 // Existing Ask lexical relevance remains diagnostic; curated links, not keyword overlap, admit claims.
 const askGate=evaluateKapQuestionSourceRelevance({sources:sources.map(s=>({...s,scopeMatch:false})),normalization:{tokens:question.toLowerCase().match(/[a-z]{4,}/g)||[]}});
 if(kind==='FACT_OR_NUMERIC')segments[0].text=(locale==='en'?'The requested number has not been retrieved. The supported mechanism is: ':'所问数值尚未取得；能够解释的机制是：')+segments[0].text;
 return {state:'SOURCE_SUPPORTED_ANSWER',question,locale,sources,segments,directAnswer:segments[0].text,reasons:segments.slice(1).map(p=>p.text),impact:unit.impact[locale],nextSteps:unit.nextSteps[locale],boundary:unit.boundary[locale],gaps:unit.gaps[locale],coverage:unit.coverage,answerDigest:await hash(JSON.stringify({unit,sourceVersions:sources.map(s=>s.sourceDigest)})),questionType:kind,quality:kind==='FACT_OR_NUMERIC'?'NUMERIC_LIMITATION_WITH_MECHANISM':'DIRECT_USEFUL_BOUNDED',unitId:unit.id,relevance,diagnostics:{askGate},providerUsed:false,providerCalls:0,paidSynthesis:'NOT_INVOKED'};
}
