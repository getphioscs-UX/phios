import {normalizeKirGroundingSources,rerankKirContentFragments,deduplicateKirContentEvidence,buildKirContentEvidencePack,composeKirContentGroundedAnswer,guardKirSemanticAnswer,projectKirMaterialSourceUsage} from './kir-r2-answer-intelligence.js';
const clean=v=>String(v??'').normalize('NFKC').trim().replace(/\s+/g,' ');
const low=v=>clean(v).toLocaleLowerCase();
const uniq=a=>[...new Set((a||[]).filter(Boolean))];
const latinStop=new Set(['what','why','how','when','where','which','the','and','for','with','from','this','that','does','can','could','would','should','about','into','your','you','are','was','were','have','has','had','not','but']);
const cjkStop=['为什么','为何','什么','怎么','怎样','如何','是否','是不是','这个','那个','这些','那些','我的','我们','自己','可以','能够','需要','没有','请问','解释','告诉'];
export function tokenizeKir(text){
  const raw=low(text); const out=[];
  for(const m of raw.matchAll(/[a-z0-9][a-z0-9-]{1,}|[\u3400-\u9fff]{2,8}/g)){
    const t=m[0]; if(/^[a-z0-9-]+$/.test(t)){if(t.length>=3&&!latinStop.has(t))out.push(t)}
    else if(t.length>=2&&!cjkStop.some(x=>t===x))out.push(t);
  }
  return uniq(out);
}
const has=(s,re)=>re.test(low(s));
export function understandKirQuestion(input={}){
  const question=clean(typeof input==='string'?input:input.question); const locale=typeof input==='string'?'zh-Hans':(input.locale||'zh-Hans');
  if(!question||question.length>500) throw new Error('KIR_R2_QUESTION_INVALID');
  const q=low(question); let intent='KNOWLEDGE';
  if(/伴侣|丈夫|妻子|对象|婚姻|我和.{0,8}(?:关系|相处)|partner|my relationship|relationship with/.test(q)) intent='RELATIONSHIP';
  else if(/钱|财务|投资|保险|预算|financial|money|investment|insurance/.test(q)) intent='FINANCIAL';
  else if(/紫微|八字|占星|人类图|numerology|tarot|i ching|astrology|bazi|zi wei|human design/.test(q)) intent='SINGLE_METHOD';
  else if(/我|我的|自己|现实|现在|目前|最近|my |current|right now|lately/.test(q)) intent='REALITY';
  const questionType=has(q,/为什么|为何|\bwhy\b/)?'CAUSAL':has(q,/如何|怎么|怎样|\bhow\b/)?'HOW':has(q,/区别|比较|差异|\bcompare\b|\bdifference\b|\bvs\b/)?'COMPARISON':has(q,/什么是|是什么意思|\bwhat is\b|\bmean\b/)?'DEFINITION':'OTHER';
  const personalization=/我|我的|自己|我们|my | me | i |our |we /.test(q);
  const professionalDepth=/专业|技术|证据|机制|研究|professional|technical|evidence|mechanism|research/.test(q);
  const domains=[]; for(const [d,re] of [['relationship',/关系|伴侣|partner|relationship/],['work',/工作|职业|career|work/],['resources',/钱|资源|财务|money|resource|financial/],['organization',/组织|公司|团队|organization|company|team/],['decision',/决定|选择|decision|choice/],['continuity',/维持|持续|连续|恢复|maintenance|continuity|recover|sustain/]]) if(re.test(q))domains.push(d);
  return Object.freeze({schemaVersion:'PHI-OS-KIR-R2-QUESTION-UNDERSTANDING-v1.0.0',question,locale,intent,questionType,domains:domains.length?domains:['reality'],tokens:tokenizeKir(question),personalizationNeed:personalization?'CONTEXT_MAY_HELP':'NONE_REQUIRED',professionalDepth:professionalDepth?'HIGH':'STANDARD',ambiguity:tokenizeKir(question).length<2?'HIGH':'NORMAL',authority:{createsMeaning:false,createsRealityTruth:false}});
}
function profileText(p){return low([p.nodeCode,p.canonicalName?.['zh-Hans'],p.canonicalName?.en,p.canonicalMeaning?.canonicalQuestionKey,...(p.userLanguage||[]),...(p.naturalQuestions||[]),...(p.mechanisms||[]),...(p.conditions||[]),...(p.patterns||[]),...(p.aliases||[]),...(p.realityDomains||[])].join(' '));}
export function expandKirQuery(understanding,profiles=[]){
  const tokens=understanding.tokens||[]; const scored=[];
  for(const p of profiles){const text=profileText(p); let score=0; const matched=[]; for(const t of tokens){if(text.includes(low(t))){score+=t.length>3?4:2;matched.push(t)}} if(understanding.domains?.some(d=>(p.realityDomains||[]).includes(d)))score+=2; if(score>0)scored.push({profileId:p.profileId,nodeCode:p.nodeCode,bookCode:p.bookCode,score,matchedTerms:matched});}
  scored.sort((a,b)=>b.score-a.score||a.nodeCode.localeCompare(b.nodeCode));
  const candidates=scored.slice(0,8); const byNode=new Map(profiles.map(p=>[p.nodeCode,p]));
  const expansions=uniq(candidates.flatMap(c=>{const p=byNode.get(c.nodeCode);return [p?.canonicalName?.['zh-Hans'],p?.canonicalName?.en,...(p?.mechanisms||[]),...(p?.aliases||[])];})).filter(Boolean).slice(0,24);
  return Object.freeze({schemaVersion:'PHI-OS-KIR-R2-QUERY-EXPANSION-v1.0.0',originalQuestion:understanding.question,locale:understanding.locale,canonicalCandidates:candidates,expandedTerms:expansions,mixedLanguageSupported:true,authority:{createsMeaning:false}});
}
export function hybridKirRetrieve({understanding,expansion,profiles=[]}){
  const byNode=new Map(profiles.map(p=>[p.nodeCode,p])); const results=[];
  for(const c of expansion.canonicalCandidates||[]){const p=byNode.get(c.nodeCode); if(!p)continue;
    const base={nodeCode:p.nodeCode,bookCode:p.bookCode,partCode:p.partCode,canonicalName:p.canonicalName,canonicalMeaning:p.canonicalMeaning,score:c.score,authorityRefs:p.authorityRefs||[]};
    results.push({...base,sourceType:'CANONICAL_NODE',sourceId:`NODE:${p.nodeCode}`,text:p.canonicalName?.['zh-Hans']||p.canonicalName?.en||p.nodeCode});
    for(const q of (p.naturalQuestions||[]).slice(0,1))results.push({...base,sourceType:'CANONICAL_QUESTION',sourceId:`QUESTION:${p.nodeCode}`,text:q,score:c.score-0.1});
    for(const a of (p.articleSources||[]).slice(0,1))results.push({...base,sourceType:'PUBLISHED_ARTICLE',sourceId:`ARTICLE:${p.nodeCode}:${a.articleCode||a.slug||'REF'}`,text:a.title||a.slug||p.canonicalName?.['zh-Hans'],score:c.score-0.2});
    results.push({...base,sourceType:'BOOK_PROFILE',sourceId:`BOOK:${p.bookCode}:${p.nodeCode}`,text:[p.canonicalName?.['zh-Hans'],...(p.userLanguage||[]).slice(0,1)].filter(Boolean).join(' — '),score:c.score-0.15});
    for(const r of (p.relatedNodes||[]).slice(0,2))results.push({...base,sourceType:'CANONICAL_RELATIONSHIP',sourceId:`REL:${p.nodeCode}:${r}`,relatedNodeCode:r,text:`${p.nodeCode} → ${r}`,score:c.score-0.5});
    for(const alias of (p.aliases||[]).filter(Boolean).slice(0,1))results.push({...base,sourceType:'ALIAS',sourceId:`ALIAS:${p.nodeCode}`,text:alias,score:c.score-0.3});
  }
  return Object.freeze({schemaVersion:'PHI-OS-KIR-R2-HYBRID-RETRIEVAL-v1.0.0',query:understanding.question,sourceClasses:['BOOK_PROFILE','CANONICAL_NODE','PUBLISHED_ARTICLE','CANONICAL_QUESTION','CANONICAL_RELATIONSHIP','ALIAS'],results});
}
export function rerankKirEvidence({understanding,retrieval}){
  const terms=understanding.tokens||[]; const ranked=(retrieval.results||[]).map(r=>{const text=low(r.text); const direct=terms.filter(t=>text.includes(low(t))).length; const authority=r.sourceType==='CANONICAL_NODE'?4:r.sourceType==='BOOK_PROFILE'?3:r.sourceType==='PUBLISHED_ARTICLE'?3:r.sourceType==='CANONICAL_QUESTION'?2:1; const specificity=Math.min(3,Math.max(0,clean(r.text).length/40)); return {...r,features:{keyword:direct,authority,specificity},rerankScore:Number(r.score||0)+direct*2+authority+specificity};}).sort((a,b)=>b.rerankScore-a.rerankScore||a.sourceId.localeCompare(b.sourceId));
  return Object.freeze({schemaVersion:'PHI-OS-KIR-R2-SEMANTIC-RERANK-v1.0.0',keywordIsFeatureOnly:true,results:ranked});
}
export function deduplicateKirEvidence(ranked){
  const owner=new Map(); const merged=[];
  for(const r of ranked.results||[]){const key=r.nodeCode||r.sourceId; if(!owner.has(key)){const item={...r,representedSourceTypes:[r.sourceType],supportingSourceIds:[r.sourceId]};owner.set(key,item);merged.push(item)}else{const item=owner.get(key);item.representedSourceTypes=uniq([...item.representedSourceTypes,r.sourceType]);item.supportingSourceIds=uniq([...item.supportingSourceIds,r.sourceId]);item.rerankScore=Math.max(item.rerankScore,r.rerankScore)}}
  return Object.freeze({schemaVersion:'PHI-OS-KIR-R2-EVIDENCE-DEDUP-v1.0.0',results:merged,removedCount:(ranked.results||[]).length-merged.length});
}
export function buildKirEvidencePack({understanding,deduplicated}){
  const all=deduplicated.results||[]; const primary=all.slice(0,2); const supporting=all.slice(2,5); const counter=all.filter(x=>x.sourceType==='COUNTER_EVIDENCE').slice(0,2); const books=uniq([...primary,...supporting].map(x=>x.bookCode));
  return Object.freeze({schemaVersion:'PHI-OS-KNOWLEDGE-EVIDENCE-PACK-v1.0.0',objectType:'knowledgeEvidencePack',question:understanding.question,primaryEvidence:primary,supportingEvidence:supporting,counterEvidence:counter,sourceAuthority:uniq([...primary,...supporting].flatMap(x=>x.authorityRefs||[])),coverage:primary.length>=2?'STRONG':primary.length?'PARTIAL':'NONE',confidence:primary.length>=2?'HIGH':primary.length?'MEDIUM':'LOW',unknowns:primary.length?[]:['NO_GROUNDED_EVIDENCE'],whichBooksUsed:books,governance:{createsMeaning:false,rawBookBodyIncluded:false}});
}
export function evaluateKirModel({understanding,evidencePack}){
  const evidenceCount=(evidencePack.primaryEvidence?.length||0)+(evidencePack.supportingEvidence?.length||0); let complexity='T0',model='DETERMINISTIC';
  if(evidencePack.coverage==='NONE') {complexity='T0';model='DETERMINISTIC'}
  else if(understanding.professionalDepth==='HIGH'&&evidenceCount>=4){complexity='T3';model='SOL'}
  else if(understanding.personalizationNeed!=='NONE_REQUIRED'&&evidenceCount>=3){complexity='T2';model='TERRA'}
  else if(evidenceCount>=3){complexity='T1';model='LUNA'}
  return Object.freeze({schemaVersion:'PHI-OS-KIR-R2-AI-ELIGIBILITY-MODEL-COMPLEXITY-v1.0.0',complexity,requestedModel:model,providerInvocationRequired:model!=='DETERMINISTIC',entitlementStillRequired:model!=='DETERMINISTIC',evidenceCoverage:evidencePack.coverage,knowledgeAuthorityOwnedByModel:false});
}
function evidenceSentence(e){const zh=e.canonicalName?.['zh-Hans']; const en=e.canonicalName?.en; return zh||en||clean(e.text);}
export async function composeKirGroundedAnswer({understanding,evidencePack,modelDecision,allowedContext=null,provider=null,upstreamGroundedAnswer=null}){
  const primary=evidencePack.primaryEvidence||[]; const supported=primary.length>0; let text=''; let providerInvoked=false;
  let providerMeta=null;
  if(supported&&provider&&modelDecision.requestedModel!=='DETERMINISTIC'){
    const payload={question:understanding.question,locale:understanding.locale,evidencePack,allowedContext,routingContext:{professionalDepth:understanding.professionalDepth,personalizationNeed:understanding.personalizationNeed,ambiguity:understanding.ambiguity},answerContract:{directFirst:true,questionType:understanding.questionType,noNewPhiMeaning:true,noMethodHijack:true,noInternalJargonDump:true}};
    const response=await provider({model:modelDecision.requestedModel,payload});
    if(response&&typeof response==='object'){text=clean(response.text);providerMeta={providerId:response.providerId||null,providerModel:response.providerModel||null,route:response.route||null,usage:response.usage||null,rawId:response.rawId||null};}
    else text=clean(response);
    providerInvoked=Boolean(text);
  }
  if(!text&&supported){const lead=evidenceSentence(primary[0]); const second=primary[1]?evidenceSentence(primary[1]):''; text=understanding.locale==='zh-Hans'?`这个问题首先指向「${lead}」${second?`，同时与「${second}」有关。`: '。'} 这些判断只来自当前获准的书籍 / canonical evidence；如果你的问题包含个人情境，还需要把实际事实与限制另外带入，不能从知识材料直接推断你的现实。`:`The strongest grounded match is “${lead}”${second?`, with supporting relevance from “${second}”`:''}. This answer uses only currently admitted book / canonical evidence; personal facts must be supplied separately rather than inferred from knowledge.`;}
  if(!text) text=understanding.locale==='zh-Hans'?'目前的获准知识证据不足以直接回答这个问题。':'The currently admitted knowledge evidence is insufficient to answer this question directly.';
  return Object.freeze({schemaVersion:'PHI-OS-KIR-R2-GROUNDED-COMPOSER-v1.1.0',text,providerInvoked,model:modelDecision.requestedModel,providerMeta,knowledgeEvidencePackConsumed:true,upstreamGroundedAnswerPresent:Boolean(upstreamGroundedAnswer),upstreamGroundedAnswerConsumed:Boolean(upstreamGroundedAnswer),usedEvidenceIds:primary.map(x=>x.sourceId),allowedContextConsumed:Boolean(allowedContext),authority:{createsPhiMeaning:false,createsMethodMeaning:false,createsRealityTruth:false}});
}
export function guardKirAnswer({understanding,evidencePack,answer}){
  const qterms=understanding.tokens||[]; const a=low(answer.text); const etext=low([...(evidencePack.primaryEvidence||[]),...(evidencePack.supportingEvidence||[])].map(x=>[x.text,x.canonicalName?.['zh-Hans'],x.canonicalName?.en].filter(Boolean).join(' ')).join(' ')); const overlap=qterms.filter(t=>a.includes(low(t))||etext.includes(low(t))); const methodHijack=understanding.intent!=='SINGLE_METHOD'&&/紫微|八字|占星|塔罗|人类图|zi wei|bazi|astrology|tarot|human design/.test(a); const jargonDump=/(KIR-R2|KAP-W|canonicalNode|groundingBundleId|runtime authority|registry object)/i.test(answer.text); const supported=answer.usedEvidenceIds.length>0?answer.usedEvidenceIds.every(id=>[...(evidencePack.primaryEvidence||[]),...(evidencePack.supportingEvidence||[])].some(x=>x.sourceId===id)):evidencePack.coverage==='NONE';
  const direct=understanding.tokens.length<2||overlap.length>0||evidencePack.coverage==='NONE';
  return Object.freeze({schemaVersion:'PHI-OS-KIR-R2-ANSWER-RELEVANCE-GUARD-v1.0.0',DIRECTLY_ANSWERS_USER_QUESTION:direct,SOURCE_SUPPORTED:supported,NO_UNGROUNDED_PHI_CONCEPT:supported,NO_INTERNAL_JARGON_DUMP:!jargonDump,NO_METHOD_HIJACK:!methodHijack,passed:direct&&supported&&!jargonDump&&!methodHijack});
}
export function projectKirBookUsage(evidencePack){const items=[...(evidencePack.primaryEvidence||[]),...(evidencePack.supportingEvidence||[])];return Object.freeze({schemaVersion:'PHI-OS-KIR-R2-BOOK-USAGE-EVIDENCE-v1.0.0',whichBookUsed:uniq(items.map(x=>x.bookCode)),whichNodesUsed:uniq(items.map(x=>x.nodeCode)),whichArticlesUsed:uniq(items.filter(x=>x.sourceType==='PUBLISHED_ARTICLE').map(x=>x.sourceId)),customerDefaultVisible:false});}
export async function runKirR2Pipeline({question,locale='zh-Hans',profiles,provider=null,allowedContext=null,upstreamGroundedAnswer=null,groundingBundle=null,articleSources=[]}){
  const understanding=understandKirQuestion({question,locale});
  const expansion=expandKirQuery(understanding,profiles);
  const retrieval=hybridKirRetrieve({understanding,expansion,profiles});
  const canonicalReranked=rerankKirEvidence({understanding,retrieval});
  const canonicalDedup=deduplicateKirEvidence(canonicalReranked);
  const contentSources=normalizeKirGroundingSources({groundingBundle,articleSources});
  if(contentSources.length){
    const reranked=rerankKirContentFragments({understanding,expansion,contentSources});
    const dedup=deduplicateKirContentEvidence(reranked);
    const evidencePack=buildKirContentEvidencePack({understanding,deduplicated:dedup,canonicalFallback:canonicalDedup.results});
    const model=evaluateKirModel({understanding,evidencePack});
    const answer=await composeKirContentGroundedAnswer({understanding,evidencePack,modelDecision:model,allowedContext,provider,upstreamGroundedAnswer});
    const guard=guardKirSemanticAnswer({understanding,evidencePack,answer});
    const usage=projectKirMaterialSourceUsage({evidencePack,answer});
    return {schemaVersion:'PHI-OS-KIR-R2-ANSWER-INTELLIGENCE-PIPELINE-v2.0.0',understanding,expansion,retrieval,canonicalReranked,canonicalDedup,reranked,dedup,evidencePack,model,answer,guard,usage};
  }
  const evidencePack=buildKirEvidencePack({understanding,deduplicated:canonicalDedup});
  const model=evaluateKirModel({understanding,evidencePack});
  const answer=await composeKirGroundedAnswer({understanding,evidencePack,modelDecision:model,allowedContext,provider,upstreamGroundedAnswer});
  const guard=guardKirAnswer({understanding,evidencePack,answer});
  const usage=projectKirBookUsage(evidencePack);
  return {schemaVersion:'PHI-OS-KIR-R2-PIPELINE-v1.0.0',understanding,expansion,retrieval,reranked:canonicalReranked,dedup:canonicalDedup,evidencePack,model,answer,guard,usage};
}
