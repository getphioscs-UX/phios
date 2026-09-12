const clean=v=>String(v??'').normalize('NFKC').replace(/\u000c/g,'\n').replace(/[\t ]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
const plain=v=>clean(v).replace(/\*\*([^*]+)\*\*/g,'$1').replace(/__([^_]+)__/g,'$1').replace(/`([^`]+)`/g,'$1');
const low=v=>plain(v).toLocaleLowerCase();
const uniq=a=>[...new Set((a||[]).filter(Boolean))];
const cjkStop=new Set(['为什么','为何','什么','怎么','怎样','如何','是否','这个','那个','这些','那些','可以','能够','需要','解释','请问','意思','现实','问题']);
const latinStop=new Set(['what','why','how','when','where','which','the','and','for','with','from','this','that','does','can','could','would','should','about','into','your','you','are','was','were','have','has','had','not','but','mean','explain']);

function terms(text){
  const input=low(text); const out=[];
  for(const m of input.matchAll(/[a-z0-9][a-z0-9-]{1,}|[\u3400-\u9fff]+/g)){
    const token=m[0];
    if(/^[a-z0-9-]+$/.test(token)){if(token.length>=3&&!latinStop.has(token))out.push(token);continue;}
    if(token.length>=2&&!cjkStop.has(token))out.push(token);
    const max=Math.min(token.length-1,24); for(let i=0;i<max;i++){const bi=token.slice(i,i+2);if(!cjkStop.has(bi))out.push(bi)}
  }
  return uniq(out).slice(0,64);
}
function splitSentences(text){return clean(text).match(/[^。！？!?]+[。！？!?]?/g)?.map(clean).filter(x=>x.length>=10)||[]}
function similarity(a,b){const A=new Set(terms(a)),B=new Set(terms(b));if(!A.size||!B.size)return 0;let n=0;for(const x of A)if(B.has(x))n++;return n/Math.max(1,Math.min(A.size,B.size))}
function questionTypeBoost(type,s){
  const t=low(s); if(type==='CAUSAL')return /因为|因此|所以|依赖|建立在|形成|导致|使得|反馈|条件|基础|并不意味着|不是.*而是|because|therefore|depends|forms|leads/.test(t)?4:0;
  if(type==='HOW')return /首先|然后|进一步|通过|进入|转化|形成|过程|路径|机制|when|through|process|first|then/.test(t)?4:0;
  if(type==='COMPARISON')return /区别|不同|相比|一方面|另一方面|不是.*而是|而|difference|whereas|rather than/.test(t)?4:0;
  if(type==='DEFINITION')return /是指|意味着|可以理解为|定义|不是.*而是|refers to|means|is a/.test(t)?3:0;
  return 0;
}
function authorityBoost(source){return source.sourceType==='PUBLISHED_CANONICAL_ARTICLE'?7:source.sourceType==='COMPLETED_MANUSCRIPT'?6:1}

export function articleAuthorityToKirSources(articleAuthority,bookCode=null){
  const article=articleAuthority?.article||{}; const nodeCode=articleAuthority?.nodeCode; const locale=articleAuthority?.locale||'zh-Hans';
  if(!nodeCode||!article.title||articleAuthority?.eligibility?.published!==true)return [];
  const base={sourceType:'PUBLISHED_CANONICAL_ARTICLE',nodeCode,bookCode,locale,articleCode:article.articleCode||null,href:article.href||null,authorityDigest:articleAuthority.authorityDigest||null,title:article.title};
  const records=[];
  if(article.summary)records.push({...base,sourceId:`ARTICLE:${nodeCode}:SUMMARY`,fragmentCode:`ARTICLE-${nodeCode}-${locale}-SUMMARY`,kind:'summary',ordinal:0,text:plain(article.summary),contentBearing:true});
  const blocks=clean(article.bodyMarkdown).split(/\n\s*\n/).map(clean).filter(Boolean); let ordinal=1;
  for(const block of blocks){if(/^#{1,6}\s+/.test(block))continue;records.push({...base,sourceId:`ARTICLE:${nodeCode}:P${String(ordinal).padStart(3,'0')}`,fragmentCode:`ARTICLE-${nodeCode}-${locale}-P${String(ordinal).padStart(3,'0')}`,kind:'paragraph',ordinal,text:plain(block),contentBearing:true});ordinal++;}
  return records;
}

export function normalizeKirGroundingSources({groundingBundle=null,articleSources=[]}={}){
  const fromBundle=(groundingBundle?.sources||[]).map((s,i)=>({
    sourceId:s.sourceId||`${s.sourceType||'SOURCE'}:${s.nodeCode||s.sectionCode||i}`,
    sourceType:s.sourceType,
    nodeCode:s.nodeCode||s.canonicalBinding?.nodeCodes?.[0]||null,
    bookCode:s.bookCode||null,
    partCode:s.partCode||null,
    fragmentCode:s.fragmentCode||null,
    sectionCode:s.sectionCode||null,
    pageRange:s.pageRange||null,
    title:s.title||null,
    href:s.href||null,
    digest:s.digest||s.sourceDigest||null,
    text:plain(s.text||s.excerpt),
    kind:s.fragmentCode?'fragment':'excerpt',
    ordinal:Number(s.ordinal||i+1),
    contentBearing:Boolean(plain(s.text||s.excerpt)),
    scopeMatch:s.scopeMatch===true,
    upstreamAuthority:s.sourceType==='PUBLISHED_CANONICAL_ARTICLE'?'PUBLISHED_ARTICLE_AUTHORITY':s.sourceType?.startsWith('CIVILIZATION_ATLAS_')?'STRUCTURED_ATLAS_AUTHORITY':'REVIEWED_MANUSCRIPT_AUTHORITY'
  })).filter(x=>x.contentBearing);
  return [...fromBundle,...(articleSources||[])];
}

export function rerankKirContentFragments({understanding,expansion,contentSources=[]}){
  const qTerms=terms(understanding.question); const candidateScore=new Map((expansion?.canonicalCandidates||[]).map((x,i)=>[x.nodeCode,Math.max(1,12-i)]));
  const ranked=contentSources.map(source=>{
    const text=low([source.title,source.text].filter(Boolean).join(' ')); let lexical=0; const matched=[];
    for(const t of qTerms){if(text.includes(t)){lexical+=t.length>2?2.5:1;matched.push(t)}}
    const canonical=candidateScore.get(source.nodeCode)||0; const exactTitle=source.title&&low(understanding.question).includes(low(source.title).replace(/[？?。！!]/g,''))?12:0;
    const typeBoost=questionTypeBoost(understanding.questionType,source.text); const kindBoost=source.kind==='summary'?2:source.kind==='paragraph'?1:0;
    const score=authorityBoost(source)+canonical+exactTitle+lexical+typeBoost+kindBoost;
    return {...source,features:{lexical:Number(lexical.toFixed(2)),canonical,exactTitle,typeBoost,authority:authorityBoost(source),kindBoost,matchedTerms:uniq(matched)},rerankScore:Number(score.toFixed(3))};
  }).filter(x=>x.features.lexical>0||x.features.canonical>0||x.features.exactTitle>0).sort((a,b)=>b.rerankScore-a.rerankScore||(a.ordinal||0)-(b.ordinal||0)||String(a.sourceId).localeCompare(String(b.sourceId)));
  return Object.freeze({schemaVersion:'PHI-OS-KIR-R2-FRAGMENT-SEMANTIC-RERANK-v2.0.0',results:ranked,contentBearingOnly:true});
}

export function deduplicateKirContentEvidence(ranked){
  const seenText=[]; const results=[]; let removed=0;
  for(const item of ranked?.results||[]){const normalized=low(item.text);if(!normalized){removed++;continue;}let duplicate=false;for(const prev of seenText){if(normalized===prev||similarity(normalized,prev)>.92){duplicate=true;break}}if(duplicate){removed++;continue;}seenText.push(normalized);results.push({...item,canonicalOwnerKey:item.nodeCode||item.sectionCode||item.sourceId});}
  return Object.freeze({schemaVersion:'PHI-OS-KIR-R2-CROSS-SOURCE-EVIDENCE-DEDUP-v2.0.0',results,removedCount:removed,duplicateSourcesMaySupportButNotMultiplyMeaning:true});
}

export function buildKirContentEvidencePack({understanding,deduplicated,canonicalFallback=[]}){
  const all=(deduplicated?.results||[]).slice(0,10); const primary=all.slice(0,4); const supporting=all.slice(4,8);
  const fallback=(canonicalFallback||[]).slice(0,3);
  const chars=[...primary,...supporting].reduce((n,x)=>n+clean(x.text).length,0);
  const articleCount=[...primary,...supporting].filter(x=>x.sourceType==='PUBLISHED_CANONICAL_ARTICLE').length;
  const manuscriptCount=[...primary,...supporting].filter(x=>x.sourceType==='COMPLETED_MANUSCRIPT').length;
  return Object.freeze({schemaVersion:'PHI-OS-KNOWLEDGE-EVIDENCE-PACK-v2.0.0',objectType:'knowledgeEvidencePack',question:understanding.question,primaryEvidence:primary,supportingEvidence:supporting,canonicalFallback:fallback,coverage:primary.length>=2?'STRONG':primary.length?'PARTIAL':fallback.length?'CANONICAL_ONLY':'NONE',confidence:primary.length>=2?'HIGH':primary.length?'MEDIUM':fallback.length?'LOW':'LOW',unknowns:primary.length?[]:['NO_CONTENT_BEARING_GROUNDED_EVIDENCE'],contentMateriality:{contentBearingEvidenceCount:primary.length+supporting.length,contentCharsAvailable:chars,articleFragmentCount:articleCount,manuscriptExcerptCount:manuscriptCount,articleContentAvailable:articleCount>0,bookContentAvailable:manuscriptCount>0},governance:{createsMeaning:false,rawFullBookIncluded:false,unpublishedArticleContentIncluded:false}});
}

function sentenceCandidates(evidencePack,understanding){
  const qTerms=terms(understanding.question); const list=[];
  for(const source of [...(evidencePack.primaryEvidence||[]),...(evidencePack.supportingEvidence||[])]){
    for(const sentence of splitSentences(source.text)){
      let score=source.rerankScore||0,lexicalHits=0; const s=low(sentence); for(const t of qTerms)if(s.includes(t)){lexicalHits++;score+=t.length>2?2:0.7} score+=questionTypeBoost(understanding.questionType,sentence);
      if(source.kind==='summary')score+=2;
      list.push({sentence,source,score,lexicalHits});
    }
  }
  list.sort((a,b)=>b.lexicalHits-a.lexicalHits||b.score-a.score||a.sentence.length-b.sentence.length);
  return list;
}
function selectDiverseSentences(candidates,max=5){const out=[];for(const c of candidates){if(c.sentence.length>420)continue;if(out.some(x=>similarity(x.sentence,c.sentence)>.82))continue;out.push(c);if(out.length>=max)break}return out}
function makeDeterministicAnswer({understanding,evidencePack}){
  const candidates=sentenceCandidates(evidencePack,understanding); const selected=selectDiverseSentences(candidates,understanding.questionType==='DEFINITION'?4:5);
  if(!selected.length)return null;
  const locale=understanding.locale; const direct=selected[0].sentence; const rest=selected.slice(1);
  let text;
  if(locale==='zh-Hans'){
    if(understanding.questionType==='CAUSAL') text=`${direct}\n\n具体来看，${rest.map(x=>x.sentence).join(' ')}`;
    else if(understanding.questionType==='HOW') text=`${direct}\n\n可以沿着这条过程理解：${rest.map(x=>x.sentence).join(' ')}`;
    else if(understanding.questionType==='COMPARISON') text=`${direct}\n\n关键差异还体现在：${rest.map(x=>x.sentence).join(' ')}`;
    else text=[direct,...rest.map(x=>x.sentence)].join('\n\n');
  }else{
    const join=rest.map(x=>x.sentence).join(' '); text=understanding.questionType==='CAUSAL'?`${direct} More specifically, ${join}`:[direct,join].filter(Boolean).join(' ');
  }
  return {text:clean(text),selected};
}

export async function composeKirContentGroundedAnswer({understanding,evidencePack,modelDecision,allowedContext=null,provider=null,upstreamGroundedAnswer=null}){
  const hasContent=(evidencePack.contentMateriality?.contentBearingEvidenceCount||0)>0; let text=''; let providerInvoked=false; let selected=[];
  let providerMeta=null;
  if(hasContent&&provider&&modelDecision?.requestedModel!=='DETERMINISTIC'){
    const payload={question:understanding.question,locale:understanding.locale,evidencePack,allowedContext,routingContext:{professionalDepth:understanding.professionalDepth,personalizationNeed:understanding.personalizationNeed,ambiguity:understanding.ambiguity},answerContract:{directFirst:true,questionType:understanding.questionType,useContentNotTitles:true,explainMechanism:true,noNewPhiMeaning:true,noMethodHijack:true,noInternalJargonDump:true,doNotRepeatGovernanceBoilerplate:true}};
    const response=await provider({model:modelDecision.requestedModel,payload});
    if(response&&typeof response==='object'){text=clean(response.text);providerMeta={providerId:response.providerId||null,providerModel:response.providerModel||null,route:response.route||null,usage:response.usage||null,rawId:response.rawId||null};}
    else text=clean(response);
    providerInvoked=Boolean(text);
  }
  if(!text&&hasContent){const deterministic=makeDeterministicAnswer({understanding,evidencePack});if(deterministic){text=deterministic.text;selected=deterministic.selected}}
  if(!text) text=understanding.locale==='zh-Hans'?'目前找到的受治理知识只有概念定位，还缺少足够的正文证据来可靠解释这个问题。':'The governed knowledge currently identifies the concept, but there is not enough content-bearing evidence to explain it reliably.';
  const usedEvidenceIds=uniq((providerInvoked?[...(evidencePack.primaryEvidence||[])]:selected.map(x=>x.source)).map(x=>x.sourceId));
  const usedItems=[...(evidencePack.primaryEvidence||[]),...(evidencePack.supportingEvidence||[])].filter(x=>usedEvidenceIds.includes(x.sourceId));
  const chars=usedItems.reduce((n,x)=>n+clean(x.text).length,0);
  return Object.freeze({schemaVersion:'PHI-OS-KIR-R2-CONTENT-GROUNDED-COMPOSER-v2.1.0',text,providerInvoked,model:modelDecision?.requestedModel||'DETERMINISTIC',providerMeta,knowledgeEvidencePackConsumed:hasContent,materialGroundedContentConsumed:usedItems.length>0,upstreamGroundedAnswerPresent:Boolean(upstreamGroundedAnswer),upstreamGroundedAnswerConsumed:false,usedEvidenceIds,consumedContentChars:chars,articleContentConsumed:usedItems.some(x=>x.sourceType==='PUBLISHED_CANONICAL_ARTICLE'),bookContentConsumed:usedItems.some(x=>x.sourceType==='COMPLETED_MANUSCRIPT'),allowedContextConsumed:Boolean(allowedContext),authority:{createsPhiMeaning:false,createsMethodMeaning:false,createsRealityTruth:false}});
}

export function guardKirSemanticAnswer({understanding,evidencePack,answer}){
  const text=clean(answer.text); const oldTemplate=/这个问题首先指向|strongest grounded match is/i.test(text); const internal=/(KIR-R2|KAP-W|canonicalNode|groundingBundleId|runtime authority|registry object|Book I–III \/ canonical evidence)/i.test(text); const hijack=understanding.intent!=='SINGLE_METHOD'&&/紫微|八字|占星|塔罗|人类图|zi wei|bazi|astrology|tarot|human design/.test(text);
  const q=clean(understanding.question).replace(/[？?。！!"“”']/g,''); const emptyRephrase=low(text).startsWith(low(q))&&text.length<Math.max(120,q.length*2.2);
  const material=answer.materialGroundedContentConsumed===true&&answer.consumedContentChars>=80;
  const mechanismRequired=['CAUSAL','HOW'].includes(understanding.questionType); const mechanismExplained=!mechanismRequired||splitSentences(text).length>=3;
  const sourceSupported=answer.usedEvidenceIds.length>0&&answer.usedEvidenceIds.every(id=>[...(evidencePack.primaryEvidence||[]),...(evidencePack.supportingEvidence||[])].some(x=>x.sourceId===id));
  const direct=text.length>=60&&!emptyRephrase&&!oldTemplate;
  return Object.freeze({schemaVersion:'PHI-OS-KIR-R2-SEMANTIC-ANSWER-QUALITY-GUARD-v2.0.0',DIRECTLY_ANSWERS_USER_QUESTION:direct,SOURCE_SUPPORTED:sourceSupported,MATERIAL_GROUNDED_CONTENT_CONSUMED:material,QUESTION_TYPE_SATISFIED:mechanismExplained,MECHANISM_EXPLAINED:mechanismExplained,NO_EMPTY_REPHRASE:!emptyRephrase,NO_REPETITIVE_LEGACY_TEMPLATE:!oldTemplate,NO_INTERNAL_JARGON_DUMP:!internal,NO_METHOD_HIJACK:!hijack,passed:direct&&sourceSupported&&material&&mechanismExplained&&!oldTemplate&&!internal&&!hijack});
}

export function projectKirMaterialSourceUsage({evidencePack,answer}){
  const identified=[...(evidencePack.primaryEvidence||[]),...(evidencePack.supportingEvidence||[])]; const consumed=identified.filter(x=>answer.usedEvidenceIds.includes(x.sourceId));
  return Object.freeze({schemaVersion:'PHI-OS-KIR-R2-MATERIAL-SOURCE-USAGE-v2.0.0',whichBooksIdentified:uniq(identified.map(x=>x.bookCode)),whichBooksContentConsumed:uniq(consumed.filter(x=>x.sourceType==='COMPLETED_MANUSCRIPT').map(x=>x.bookCode)),whichNodesIdentified:uniq(identified.map(x=>x.nodeCode)),whichArticlesIdentified:uniq(identified.filter(x=>x.sourceType==='PUBLISHED_CANONICAL_ARTICLE').map(x=>x.articleCode||x.nodeCode)),whichArticlesContentConsumed:uniq(consumed.filter(x=>x.sourceType==='PUBLISHED_CANONICAL_ARTICLE').map(x=>x.articleCode||x.nodeCode)),articleContentConsumed:answer.articleContentConsumed,bookContentConsumed:answer.bookContentConsumed,materialContentConsumed:answer.materialGroundedContentConsumed,consumedContentChars:answer.consumedContentChars,customerDefaultVisible:false});
}
