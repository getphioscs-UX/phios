import {deepFreeze,list,localeOf,safeUrl,text} from './projection-common.js';
import {safeSources,publicSourceUrl,customerText,customerSourceLabel,NO_SUPPORT_COPY} from '../_lib/knowledge-source-eligibility.js';

// PUBLIC schema: no raw runtime result, governance, hashes or source versions.
// sectionCode is a backward-compatible opaque public citation reference; never an internal section ID.
export const KNOWLEDGE_CUSTOMER_PUBLIC_FIELDS=Object.freeze(['surface','locale','state','question','answer','basedOn','limits','relatedKnowledge','possibleNextStep','currentFacts','handoff','atlas']);
const ref=value=>{let n=2166136261;for(const c of String(value))n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return 'ref-'+n.toString(16).padStart(8,'0');};
const finite=value=>Number.isFinite(value)?value:null;
const range=value=>value&&typeof value==='object'?{start:finite(value.start),end:finite(value.end)}:null;
export function projectKnowledgeAnswerForCustomer(payload={}, {locale='en',currentFacts=null}={}){
 payload=payload&&typeof payload==='object'&&!Array.isArray(payload)?payload:{};
 const lang=localeOf(locale),cka=payload.cka||payload,answer=cka.clientAnswer||payload.ask2?.client||{};
 const denied=['NO_SUPPORTED_ANSWER','COMPARATIVE_EXPLANATION_UNIT_REQUIRED'].includes(payload.grounding?.answerAssessment?.state);
 const prediction=payload.grounding?.answerAssessment?.state==='UNSUPPORTED_PREDICTION';
 let evidence=safeSources(payload.sources||payload.groundingBundle?.sources||[]);
 // Only bounded source bodies/identities are support. Metadata alone cannot support a claim.
 const sourceEvidence=list(payload.grounding?.sourceEvidence);
 if(!evidence.length){
  evidence=safeSources(list(answer.sourcesGrounding).map(s=>({...s,sourceType:s.sourceType,sourceId:s.sourceId,text:s.excerpt})));
 }
 if(denied||prediction)evidence=[];
 let candidate=customerText(answer.directAnswer||payload.answer?.content?.directAnswer);
 if(lang==='en'&&/[\u3400-\u9fff]/u.test(candidate))candidate='';
 if(lang==='zh-Hans'&&!/[\u3400-\u9fff]/u.test(candidate)&&/[a-z]{3}/i.test(candidate))candidate='';
 const supported=evidence.length>0&&Boolean(candidate);
 if(!supported)evidence=[];
 const sources=evidence.map(s=>{
  const meta=sourceEvidence.find(m=>m.sectionCode===s.sectionCode)||s;
  const heading=customerText(meta.heading||s.title);
  const title=lang==='en'&&/[\u3400-\u9fff]/u.test(heading)?'':heading;
  return {label:customerSourceLabel(s.sourceType,lang)+(title?' · '+title:''),excerpt:customerText(s.text)||null,href:publicSourceUrl(s.href),...(s.sectionCode?{sectionCode:ref(s.sourceId||s.sectionCode),pageRange:range(meta.pageRange),supportRange:meta.supportRange?{startOffset:finite(meta.supportRange.startOffset),endOffset:finite(meta.supportRange.endOffset)}:null}:{})};
 });
 let direct=supported?candidate:'';
 if(lang==='en'&&/[\u3400-\u9fff]/u.test(direct))direct='';
 if(lang==='zh-Hans'&&!/[\u3400-\u9fff]/u.test(direct)&&/[a-z]{3}/i.test(direct))direct='';
 const content=prediction?text(lang,'These sources cannot support a certain prediction.','这些来源不能支持确定预测。'):(direct||NO_SUPPORT_COPY[lang]);
 const localized=value=>{const s=customerText(value);return lang==='en'&&/[\u3400-\u9fff]/u.test(s)||lang==='zh-Hans'&&!/[\u3400-\u9fff]/u.test(s)&&/[a-z]{3}/i.test(s)?'':s;};
 const related=supported?list(answer.relatedKnowledgeCards).map(c=>({title:localized(c.concept||c.title),description:localized(c.description)||null,href:publicSourceUrl(c.href)})).filter(c=>c.title&&c.href):[];
 const atlasHref=supported&&evidence.some(s=>/ATLAS/.test(s.sourceType))?publicSourceUrl(cka.atlas?.deepLink):null;
 if(atlasHref)related.unshift({title:text(lang,'Explore Civilization Atlas','浏览文明图谱'),description:null,href:atlasHref});
 const structured=supported&&answer.structuredAnswer&&typeof answer.structuredAnswer==='object'?{mechanismOrState:localized(answer.structuredAnswer.mechanismOrState),conditions:list(answer.structuredAnswer.conditions).map(localized).filter(Boolean),relatedFactors:list(answer.structuredAnswer.relatedFactors).map(localized).filter(Boolean),possibleTransition:localized(answer.structuredAnswer.possibleTransition)||null,boundaryUnknown:localized(answer.structuredAnswer.boundaryUnknown),exploreInBook:publicSourceUrl(answer.structuredAnswer.exploreInBook)}:null;
 const facts=currentFacts?.state==='AVAILABLE'?safeSources(list(currentFacts.evidence).map(f=>({...f,sourceType:'EXTERNAL_AUTHORITY',sourceId:f.sourceId||f.sourceUrl,text:f.claimText,eligible:f.eligible===false?false:true}))):[];
 return deepFreeze({
  surface:'ASK',locale:lang,state:prediction?'SOURCE_LIMIT':supported?(cka.w5w17?.answerState==='PARTIALLY_ANSWERED'?'PARTIALLY_ANSWERED':'ANSWERED'):'SOURCE_INSUFFICIENT',
  question:customerText(answer.question||payload.answer?.question)||null,
  answer:{text:content,supporting:supported?list(answer.whyThisMayHappen).map(localized).filter(Boolean):[],...(structured?{structuredAnswer:structured}:{})},
  basedOn:{sources,statement:text(lang,'Sources used for this answer.','本次回答使用的来源。')},
  limits:{items:supported?list(answer.unknown?.details).map(localized).filter(Boolean):[]},
  relatedKnowledge:related,
  possibleNextStep:{kind:related.length?'RELATED_KNOWLEDGE':'OBSERVE',label:text(lang,'Explore available material','浏览现有资料')},
  currentFacts:{state:facts.length?'AVAILABLE':'NOT_USED',evidence:facts.map(f=>({claim:customerText(f.text),source:customerText(f.publisher||f.title)||customerSourceLabel('EXTERNAL_AUTHORITY',lang),sourceUrl:publicSourceUrl(f.sourceUrl)}))},
  handoff:{available:supported,question:customerText(answer.question)||null,externalEvidence:facts.map(f=>({statement:customerText(f.text),sourceUrl:publicSourceUrl(f.sourceUrl)})),unknown:[]},
  atlas:atlasHref?{deepLink:atlasHref,evidenceCount:evidence.filter(s=>/ATLAS/.test(s.sourceType)).length}:null
 });
}
