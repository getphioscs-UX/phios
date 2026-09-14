const QUALITY_SCHEMA='PHI-OS-PTRC-KNOWLEDGE-QUALITY-v1.0.0';
const THRESHOLD_VERSION='PTRC-W4-THRESHOLDS-v1.0.0';
const OUTCOMES=new Set(['SUFFICIENT','PARTIAL','AMBIGUOUS','CONTRADICTORY','INSUFFICIENT']);
const clean=value=>String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ');
const unique=items=>[...new Set(items.filter(Boolean))];
const STOP=new Set(['what','why','how','who','when','where','which','the','and','for','are','is','was','were','this','that','with','from','into','about','please','explain','tell','什么','为什么','如何','怎么','怎样','这个','那个','哪些','是否','请问','解释']);
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v;}
function terms(value){const text=clean(value).toLocaleLowerCase();const latin=text.match(/[a-z0-9-]{3,}/g)||[];const runs=text.match(/[\u3400-\u9fff]+/g)||[];const cjk=runs.flatMap(run=>run.length<=4?[run]:Array.from({length:Math.min(run.length-1,20)},(_,i)=>run.slice(i,i+2)));return unique([...latin,...cjk]).filter(x=>!STOP.has(x));}
function languageScore(text,locale){const cjk=/[\u3400-\u9fff]/.test(clean(text));return locale==='zh-Hans'?(cjk?1:.7):(cjk ? .65 : 1);}
function relevanceScore(question,source){const q=terms(question);if(!q.length)return 0;const corpus=clean(source?.text).toLocaleLowerCase();const matched=q.filter(x=>corpus.includes(x));const scoped=source?.scopeMatch===true;return Math.min(1,Number(((matched.length/q.length)+(scoped?.35:0)).toFixed(3)));}
function sourceStateScore(source){if(source?.sourceType==='PUBLISHED_CANONICAL_ARTICLE')return 1;if(source?.sourceType==='CIVILIZATION_ATLAS_EVIDENCE')return .95;if(source?.sourceType==='CIVILIZATION_ATLAS_ENTITY')return .9;if(source?.sourceType==='COMPLETED_MANUSCRIPT')return .78;return .65;}
function sourceStage(source){if(source?.sourceType==='CIVILIZATION_ATLAS_ENTITY')return 'ATLAS_ENTITY';if(source?.sourceType==='CIVILIZATION_ATLAS_EVIDENCE')return 'ATLAS_EVIDENCE';if(source?.bookCode==='BOOK-5'&&source?.partCode==='PART-12')return 'PART_12';return 'BROADER_KNOWLEDGE';}
function explicitContradiction(source){return source?.contradiction===true||source?.contradictory===true||String(source?.authorityClass||'').toUpperCase()==='CONTRADICTORY';}
function requestedDimensions(intent){if(intent==='COMPARE')return ['SIDE_A','SIDE_B'];if(intent==='TRACE')return ['EARLIER','LATER'];if(intent==='CALCULATE')return ['INPUTS','FORMULA_OR_RESULT'];return ['PRIMARY_QUESTION'];}

export function adaptPtrcEvidence(bundle={},contract={}){
  const locale=contract.locale||bundle?.question?.locale||'zh-Hans';
  const question=contract.question||bundle?.question?.text||'';
  return freeze((bundle?.sources||[]).map((source,index)=>({
    evidenceId:source.sourceId||`PTRC-EVIDENCE-${index+1}`,
    objectType:source.sourceType||'GOVERNED_KNOWLEDGE_SOURCE',
    stage:sourceStage(source),
    relationType:source?.sourceType==='CIVILIZATION_ATLAS_EVIDENCE'?'EVIDENCE_FOR_ENTITY':source?.scopeMatch===true?'IN_EXPLICIT_SCOPE':'QUESTION_RETRIEVAL_MATCH',
    sourceState:source?.sourceType==='PUBLISHED_CANONICAL_ARTICLE'?'PUBLISHED':source?.sourceType==='COMPLETED_MANUSCRIPT'?'REVIEWED_MANUSCRIPT':source?.sourceType?.startsWith?.('CIVILIZATION_ATLAS_')?'REGISTERED_ATLAS':'GOVERNED_SOURCE',
    language:locale,
    scores:{
      entityMatch:source?.scopeMatch===true?1:0,
      relevance:relevanceScore(question,source),
      sourceState:sourceStateScore(source),
      language:languageScore(source?.text,locale),
      freshness:1
    },
    contradictory:explicitContradiction(source),
    bookCode:source?.bookCode||null,
    partCode:source?.partCode||null,
    atlasLayer:source?.atlasLayer||null,
    atlasEntityId:source?.atlasEntityId||null,
    source
  })));
}

export function buildPtrcRetrievalStages(bundle={},contract={}){
  const adapted=adaptPtrcEvidence(bundle,contract);
  const existing=Array.isArray(bundle?.retrievalChain)?bundle.retrievalChain:[];
  const order=['ATLAS_ENTITY','ATLAS_EVIDENCE','PART_12','BROADER_KNOWLEDGE'];
  const scope=contract?.retrievalScope||{};
  return freeze(order.map(stage=>{
    const matching=adapted.filter(item=>item.stage===stage);
    const original=existing.find(item=>item.stage===stage||item.stage===(stage==='BROADER_KNOWLEDGE'?'BROADER_GOVERNED_KNOWLEDGE':stage));
    let status=matching.length?'MATCHED':(original?.status||'NO_MATCH');
    if(stage==='BROADER_KNOWLEDGE'&&contract?.answerPolicy?.allowBroaderKnowledge===false)status='DISALLOWED_BY_POLICY';
    if(stage==='PART_12'&&scope?.atlasScope?.bookCode==='BOOK-5'&&!matching.length)status=original?.status||'AUTHORIZED_FALLBACK_NO_MATCH';
    return {stage,status,count:matching.length,evidenceIds:matching.map(item=>item.evidenceId)};
  }));
}

export function filterPtrcSourcesByPolicy(sources=[],contract={}){
  const list=Array.isArray(sources)?sources:[];
  if(contract?.answerPolicy?.allowBroaderKnowledge!==false)return list;
  if(contract?.retrievalScope?.structuredScope)return list.filter(source=>source?.sourceType==='STRUCTURED_KNOWLEDGE_OBJECT'&&source?.bookCode===contract.retrievalScope.structuredScope.bookCode&&source?.scopeMatch===true);
  if(!contract?.retrievalScope?.atlasScope)return list.filter(source=>source?.sourceType==='PUBLISHED_CANONICAL_ARTICLE');
  return list.filter(source=>source?.sourceType?.startsWith?.('CIVILIZATION_ATLAS_')||(source?.bookCode==='BOOK-5'&&source?.partCode==='PART-12'));
}

export function evaluatePtrcKnowledgeQuality({bundle={},contract={}}={}){
  const evidence=adaptPtrcEvidence(bundle,contract);
  const minimumEvidence=Math.max(1,Number(contract?.answerPolicy?.minimumEvidence||2));
  const relevant=evidence.filter(item=>item.scores.relevance>=.18||item.scores.entityMatch===1);
  const contradictions=evidence.filter(item=>item.contradictory);
  const dimensions=requestedDimensions(contract?.intent||'EXPLAIN');
  let covered=0;
  if(dimensions.length===1)covered=relevant.length?1:0;
  else if(contract?.intent==='COMPARE')covered=Math.min(2,new Set(relevant.map(item=>item.atlasEntityId||item.evidenceId)).size);
  else if(contract?.intent==='TRACE')covered=Math.min(2,new Set(relevant.map(item=>item.stage==='ATLAS_ENTITY'?item.atlasEntityId||item.evidenceId:item.stage)).size);
  else covered=Math.min(dimensions.length,relevant.length);
  const coverageRatio=dimensions.length?covered/dimensions.length:0;
  const ambiguous=contract?.intent==='CLARIFY'||(!contract?.question&&relevant.length===0);
  let outcome='INSUFFICIENT';
  const reasons=[];
  if(contradictions.length){outcome='CONTRADICTORY';reasons.push('CONTRARY_GOVERNED_EVIDENCE_PRESENT');}
  else if(ambiguous){outcome='AMBIGUOUS';reasons.push('QUESTION_REQUIRES_CLARIFICATION');}
  else if(relevant.length>=minimumEvidence&&coverageRatio>=1){outcome='SUFFICIENT';reasons.push('MINIMUM_EVIDENCE_AND_DIMENSION_COVERAGE_MET');}
  else if(relevant.length>0){outcome='PARTIAL';reasons.push(relevant.length<minimumEvidence?'MINIMUM_EVIDENCE_NOT_MET':'REQUESTED_DIMENSION_COVERAGE_INCOMPLETE');}
  else {reasons.push(evidence.length?'RETRIEVED_EVIDENCE_NOT_RELEVANT':'NO_GOVERNED_EVIDENCE');}
  const average=relevant.length?Number((relevant.reduce((sum,item)=>sum+item.scores.relevance,0)/relevant.length).toFixed(3)):0;
  return freeze({
    schemaVersion:QUALITY_SCHEMA,
    thresholdVersion:THRESHOLD_VERSION,
    outcome,
    reasonCodes:reasons,
    evidenceCount:evidence.length,
    relevantEvidenceCount:relevant.length,
    minimumEvidence,
    requestedDimensions:dimensions,
    coveredDimensions:covered,
    coverageRatio:Number(coverageRatio.toFixed(3)),
    averageRelevance:average,
    contradictionCount:contradictions.length,
    longFormAllowed:outcome==='SUFFICIENT',
    shortSupportedAnswerAllowed:outcome==='SUFFICIENT'||outcome==='PARTIAL',
    clarificationRequired:outcome==='AMBIGUOUS',
    unconditionalClaimAllowed:outcome==='SUFFICIENT'||outcome==='PARTIAL',
    evidence:relevant.map(item=>({evidenceId:item.evidenceId,objectType:item.objectType,stage:item.stage,relationType:item.relationType,scores:item.scores}))
  });
}

export function applyPtrcQualityToCoverage(legacyCoverage={},quality=null){
  if(!quality||!OUTCOMES.has(quality.outcome))return legacyCoverage;
  const status=quality.outcome==='SUFFICIENT'?'STRONG_COVERAGE':quality.outcome==='PARTIAL'?'PARTIAL_COVERAGE':legacyCoverage?.status==='OUT_OF_SCOPE'?'OUT_OF_SCOPE':'INSUFFICIENT_COVERAGE';
  return freeze({
    ...legacyCoverage,
    schemaVersion:'PHI-OS-KAP-COVERAGE-DECISION-PTRC-v1.0.0',
    status,
    reasonCodes:unique([...(legacyCoverage?.reasonCodes||[]),...quality.reasonCodes]),
    answerCompositionEligible:quality.longFormAllowed===true,
    shortSupportedAnswerEligible:quality.shortSupportedAnswerAllowed===true,
    ptrcQuality:quality
  });
}

export const PTRC_QUALITY_SCHEMA=QUALITY_SCHEMA;
export const PTRC_QUALITY_THRESHOLD_VERSION=THRESHOLD_VERSION;
