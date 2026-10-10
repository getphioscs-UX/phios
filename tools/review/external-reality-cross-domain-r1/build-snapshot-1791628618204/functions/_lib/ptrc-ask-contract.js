import {normalizeFormationScope} from './formation-retrieval-scope.js';
const CONTRACT_SCHEMA='PHI-OS-PTRC-ASK-REQUEST-v1.0.0';
const TRACE_SCHEMA='PHI-OS-PTRC-ASK-TRACE-v1.0.0';
const INTENTS=new Set(['DEFINE','EXPLAIN','COMPARE','TRACE','CALCULATE','NAVIGATE','REPORT','CLARIFY']);
const LOCALES=new Set(['zh-Hans','en']);
const questionText=value=>String(value??'').trim().replace(/\s+/g,' ');
const clean=value=>questionText(value).normalize('NFKC');
const object=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const unique=(items,max=24)=>[...new Set((Array.isArray(items)?items:[]).map(clean).filter(Boolean))].slice(0,max);
const scalar=(value,max=160)=>clean(value).slice(0,max)||null;

function freeze(value){
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    Object.freeze(value);
    for(const item of Object.values(value))freeze(item);
  }
  return value;
}

function hash(value){
  let result=0x811c9dc5;
  for(const char of String(value)){result^=char.codePointAt(0);result=Math.imul(result,0x01000193)>>>0;}
  return result.toString(16).padStart(8,'0');
}

function redact(value){
  return clean(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email]')
    .replace(/(?:\+?\d[\s().-]*){8,}/g,'[phone]')
    .replace(/\b\d{6,}\b/g,'[number]');
}

export function classifyPtrcIntent(question,locale='zh-Hans'){
  const q=clean(question).toLocaleLowerCase();
  if(!q)return 'CLARIFY';
  if(locale==='zh-Hans'){
    if(/(?:计算|算出|多少|利率|回报率|复利|现金流|净值|退休|负债比|预算)/.test(q))return 'CALCULATE';
    if(/(?:报告|生成报告|导出|汇总报告|遗嘱|will report)/i.test(q))return 'REPORT';
    if(/(?:比较|区别|差异|不同|vs\.?|对比)/i.test(q))return 'COMPARE';
    if(/(?:追踪|演变|发展过程|历史路径|时间线|从.+到|如何形成|怎样形成)/.test(q))return 'TRACE';
    if(/(?:去哪里|哪个页面|打开|带我到|怎么进入|导航|下一步|怎么办|应该怎么做)/.test(q))return 'NAVIGATE';
    if(/(?:什么是|何谓|是什么意思|定义)/.test(q))return 'DEFINE';
    if(q.length<4||/^(?:这个|那个|它|什么意思|哪一个)[？?]?$/.test(q))return 'CLARIFY';
    return 'EXPLAIN';
  }
  if(/\b(calculate|how much|compound|interest rate|cash flow|net worth|retirement|afford|ratio|budget)\b/.test(q))return 'CALCULATE';
  if(/\b(report|export|generate a report|will report|estate report)\b/.test(q))return 'REPORT';
  if(/\b(compare|difference|different|versus|vs\.?|contrast)\b/.test(q))return 'COMPARE';
  if(/\b(trace|timeline|evolve|evolution|history of|development of|from .+ to|how did .+ form)\b/.test(q))return 'TRACE';
  if(/\b(where do i|which page|open|take me|navigate|next step|what should i do|how should i)\b/.test(q))return 'NAVIGATE';
  if(/\b(what is|what are|define|meaning of|what does .+ mean)\b/.test(q))return 'DEFINE';
  if(q.length<4||/^(this|that|it|which one|what)\??$/.test(q))return 'CLARIFY';
  return 'EXPLAIN';
}

function atlasEntityIds(scope={}){
  return unique([
    scope.timeWindowId,scope.snapshotId,scope.primaryCaseId,scope.comparisonFamilyId,
    scope.transitionWindowId,scope.lossFamilyId,scope.lossTypeId,
    scope.entityId,scope.windowId,scope.dossierId,scope.livedRealityDimensionId,scope.sectionId,
    ...(scope.regionIds||[]),...(scope.caseIds||[]),...(scope.trajectoryIds||[]),...(scope.comparisonIds||[])
  ]);
}

export function normalizePtrcRetrievalScope(input={},entryContext={}){
  const raw=object(input);
  const entry=object(entryContext);
  const atlas=object(raw.atlasScope||entry.retrievalScope);
  const atlasType=String(atlas.scopeType||'').toUpperCase();
  const atlasBook=String(atlas.bookCode||'').toUpperCase();
  const atlasActive=atlasType==='CIVILIZATION_ATLAS'||atlasType==='CIVILIZATION_RECONFIGURATION_ATLAS'||atlasBook==='BOOK-5'||atlasBook==='BOOK-6';
  const reconfigurationAtlas=atlasType==='CIVILIZATION_RECONFIGURATION_ATLAS'||atlasBook==='BOOK-6';
  const parts=unique(raw.partIds);
  const articleIds=unique(raw.articleIds);
  const knowledgeNodeIds=unique(raw.knowledgeNodeIds);
  const atlasIds=unique(raw.atlasEntityIds);
  const atlasLayers=unique(raw.atlasLayers).map(x=>x.toLowerCase());
  if(entry.partCode&&!parts.includes(entry.partCode))parts.push(clean(entry.partCode));
  if(entry.articleCode&&!articleIds.includes(entry.articleCode))articleIds.push(clean(entry.articleCode));
  if(entry.contextId&&/^NODE:/i.test(entry.contextId)&&!knowledgeNodeIds.includes(entry.contextId.slice(5)))knowledgeNodeIds.push(entry.contextId.slice(5));
  if(atlasActive){
    for(const id of atlasEntityIds(atlas))if(!atlasIds.includes(id))atlasIds.push(id);
    if(atlas.activeLayer&&!atlasLayers.includes(String(atlas.activeLayer).toLowerCase()))atlasLayers.push(String(atlas.activeLayer).toLowerCase());
    const ownerPart=reconfigurationAtlas?'PART-13':'PART-12';
    if(!parts.includes(ownerPart))parts.push(ownerPart);
  }
  const allowedCollections=unique(raw.allowedCollections);
  if(atlasActive&&!allowedCollections.includes('CIVILIZATION_ATLAS'))allowedCollections.push('CIVILIZATION_ATLAS');
  if(!allowedCollections.length)allowedCollections.push('GOVERNED_KNOWLEDGE');
  return freeze({
    atlasEntityIds:atlasIds,
    atlasLayers,
    partIds:parts,
    knowledgeNodeIds,
    articleIds,
    timeScope:raw.timeScope??(atlas.timeWindowId||atlas.time||null),
    jurisdiction:scalar(raw.jurisdiction,80),
    allowedCollections,
    atlasScope:atlasActive?freeze({...atlas}):null,
    structuredScope:normalizeFormationScope(raw.structuredScope||entry.retrievalScope)
  });
}

export function createPtrcAskRequestContract(payload={}){
  const body=object(payload);
  const question=questionText(body.question??body.q);
  if(!question)throw Object.assign(new Error('PTRC_QUESTION_REQUIRED'),{status:400});
  if(question.length>500)throw Object.assign(new Error('PTRC_QUESTION_TOO_LONG'),{status:400});
  const locale=LOCALES.has(body.locale)?body.locale:'zh-Hans';
  const explicitIntent=String(body.intent||'').toUpperCase();
  const intent=INTENTS.has(explicitIntent)?explicitIntent:classifyPtrcIntent(question,locale);
  const entry=object(body.entryContext);
  const rawScope=body.retrievalScope||entry.retrievalScope||{};
  const retrievalScope=normalizePtrcRetrievalScope(rawScope,entry);
  const policy=object(body.answerPolicy);
  const minimumEvidence=Number.isFinite(Number(policy.minimumEvidence))?Math.max(1,Math.min(8,Math.trunc(Number(policy.minimumEvidence)))):2;
  return freeze({
    schemaVersion:CONTRACT_SCHEMA,
    question,
    locale,
    intent,
    retrievalScope,
    answerPolicy:{
      citationRequired:policy.citationRequired!==false,
      minimumEvidence,
      allowBroaderKnowledge:policy.allowBroaderKnowledge!==false
    }
  });
}

export function createPtrcAskTrace({contract,route='UNRESOLVED',retrievalStages=[],gateResult=null,answerMode='UNRESOLVED'}={}){
  if(contract?.schemaVersion!==CONTRACT_SCHEMA)throw new Error('PTRC_REQUEST_CONTRACT_REQUIRED');
  const redacted=redact(contract.question);
  return freeze({
    schemaVersion:TRACE_SCHEMA,
    request:{
      normalizedQuestion:redacted,
      questionHash:hash(contract.question),
      questionLength:contract.question.length,
      locale:contract.locale,
      intent:contract.intent,
      retrievalScope:contract.retrievalScope
    },
    route,
    retrievalStages:Array.isArray(retrievalStages)?retrievalStages:[],
    gateResult:gateResult||null,
    answerMode,
    privacy:{rawUnredactedQuestionPersisted:false,entryContextProseAppendedToQuestion:false,priorAnswerTextAppendedToQuestion:false}
  });
}

export const PTRC_ASK_CONTRACT_SCHEMA=CONTRACT_SCHEMA;
export const PTRC_ASK_TRACE_SCHEMA=TRACE_SCHEMA;
export const PTRC_ASK_INTENTS=Object.freeze([...INTENTS]);
