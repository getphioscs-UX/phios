const clean=value=>String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ');
const list=value=>Array.isArray(value)?value:[];
const langOf=value=>value==='en'?'en':'zh-Hans';
const loc=(value,lang)=>clean(value?.[lang]||value?.en||value?.['zh-Hans']||value);
const unique=values=>[...new Set(values.map(clean).filter(Boolean))];

export const ATLAS_ASK_INTENTS=Object.freeze([
  'CIVILIZATION_DECLINE','LOSS','COMPARISON','TIMELINE','WORLD_SNAPSHOT',
  'TRANSITION','TRAJECTORY','SUCCESSION','SCALE_SHIFT','NO_SCORE_GOVERNANCE','GENERAL_ATLAS'
]);

export const ATLAS_RETRIEVAL_PRIORITY=Object.freeze([
  'SELECTED_ATLAS_ENTITY',
  'RELATED_ATLAS_REGISTRY_EVIDENCE',
  'PART_12_CANONICAL_NODES',
  'BOOK_5_PUBLISHED_OR_REVIEWED_KNOWLEDGE',
  'BROADER_PHI_OS_KNOWLEDGE'
]);

const INTENT_PATTERNS=Object.freeze([
  ['NO_SCORE_GOVERNANCE',/(?:collapse score|civilization score|superiority score|ranking|rank civilizations|文明评分|崩溃评分|优越评分|文明排名|为什么不.*评分)/i],
  ['CIVILIZATION_DECLINE',/(?:declin|fall of|fallen|collapse|decay|waning|落寞|没落|衰退|衰落|衰败|崩溃|瓦解|灭亡|式微|由盛转衰)/i],
  ['LOSS',/(?:loss|lost|territor|sovereign|urban decline|population decline|损失|失去|领土|主权|人口下降|城市衰退|断裂|退化)/i],
  ['SUCCESSION',/(?:successor|succession|continu|legacy|after.*empire|继任|继承|延续|遗产|文明.*消失|政权.*文明)/i],
  ['COMPARISON',/(?:compare|comparison|versus|\bvs\b|different from|比较|相比|对比|差异)/i],
  ['WORLD_SNAPSHOT',/(?:snapshot|same time|world in|world at|横切面|同一时期|当时.*世界|1000|1250|1500|1750|1850|1914|1945|1980|2000|2026)/i],
  ['TRANSITION',/(?:transition|threshold|turning point|bronze.*iron|industrial threshold|转型|阈值|转折|工业门槛|青铜.*铁)/i],
  ['TRAJECTORY',/(?:trajectory|long[- ]duration|long[- ]term trend|trend over|轨迹|长时段|长期趋势)/i],
  ['SCALE_SHIFT',/(?:scale shift|new scale|artificial intelligence|computational|AI\b|尺度转换|新尺度|人工智能|计算文明)/i],
  ['TIMELINE',/(?:timeline|when|chronolog|before|after|时期|时间线|先后|什么时候)/i]
]);

const REGISTRY_PATHS=Object.freeze({
  timeline:'/content/civilization-atlas/timeline/timeline-periods-v1.json',
  cases:'/content/civilization-atlas/cases/civilization-case-registry-v1.json',
  comparison:'/content/civilization-atlas/comparison/comparison-families-v1.json',
  snapshots:'/content/civilization-atlas/snapshots/world-snapshots-v1.json',
  trajectories:'/content/civilization-atlas/trajectories/long-duration-trajectories-v1.json',
  transitions:'/content/civilization-atlas/transitions/transition-windows-v1.json',
  loss:'/content/civilization-atlas/loss/reversal-loss-atlas-v1.json'
});

const INTENT_REGISTRIES=Object.freeze({
  CIVILIZATION_DECLINE:['loss','cases','transitions'],
  LOSS:['loss','cases','transitions'],
  SUCCESSION:['loss','cases','transitions'],
  COMPARISON:['comparison','cases'],
  WORLD_SNAPSHOT:['snapshots','cases'],
  TRANSITION:['transitions','cases','loss'],
  TRAJECTORY:['trajectories','cases'],
  SCALE_SHIFT:['transitions','trajectories','cases'],
  TIMELINE:['timeline','cases'],
  NO_SCORE_GOVERNANCE:['loss','comparison','cases'],
  GENERAL_ATLAS:['timeline','cases','loss','transitions']
});

const LAYER_FOR_INTENT=Object.freeze({
  CIVILIZATION_DECLINE:'loss',LOSS:'loss',SUCCESSION:'loss',
  COMPARISON:'comparison',WORLD_SNAPSHOT:'world',TRANSITION:'transitions',
  TRAJECTORY:'trajectories',SCALE_SHIFT:'transitions',TIMELINE:'timeline',
  NO_SCORE_GOVERNANCE:'loss',GENERAL_ATLAS:'timeline'
});

const ENTITY_EXPANSIONS=Object.freeze([
  [/(?:rome|roman|罗马)/i,['Rome','Roman','罗马','政权终止','继任','legacy','successor']],
  [/(?:song|宋朝|宋代|宋中国|\b宋\b)/i,['Song','宋','commercial','knowledge','城市','网络']],
  [/(?:mongol|蒙古)/i,['Mongol','蒙古','fragmentation','connection','network','successor']],
  [/(?:maya|mayan|玛雅)/i,['Maya','玛雅','urban decline','population','network']],
  [/(?:industrial|工业)/i,['industrial','工业','threshold','energy','scale shift']],
  [/(?:artificial intelligence|\bAI\b|人工智能|计算文明)/i,['AI','人工智能','computational','计算','scale shift','尺度转换']]
]);

export function isCivilizationAtlasContext({entryContext={},knowledgeContext={}}={}){
  const corpus=[
    entryContext.contextId,entryContext.bookCode,entryContext.partCode,
    knowledgeContext.contextLabel,knowledgeContext.contextSummary,
    knowledgeContext.readingPath,knowledgeContext.relatedKnowledgeRef
  ].map(clean).join(' ');
  return /(?:BOOK:BOOK-5|\bBOOK-5\b|PART-12|Civilization Atlas|文明图谱|>\s*ATLAS\s*>)/i.test(corpus);
}

export function classifyCivilizationAtlasIntent(question='',knowledgeContext={}){
  const corpus=[question,knowledgeContext?.contextSummary,knowledgeContext?.readingPath].map(clean).join(' ');
  for(const [intent,pattern] of INTENT_PATTERNS) if(pattern.test(corpus)) return intent;
  return 'GENERAL_ATLAS';
}

function parseContextSummary(summary=''){
  const text=clean(summary);
  const take=(label,pattern)=>{const m=text.match(pattern);return m?clean(m[1]):null};
  return Object.freeze({
    layer:take('Layer',/(?:^|·)\s*Layer=([a-z]+)/i),
    caseId:take('Case',/(?:^|·)\s*Case=(CA-T\d{2}-\d{2})/i),
    snapshotId:take('Snapshot',/(?:^|·)\s*Snapshot=(WS-[A-Z0-9-]+)/i),
    familyId:take('Family',/(?:^|·)\s*Family=([A-Z0-9_-]+)/i),
    trajectoryIds:(take('Trajectories',/(?:^|·)\s*Trajectories=([^·]+)/i)||'').split(',').map(clean).filter(Boolean),
    transitionWindowId:take('Transition',/(?:^|·)\s*Transition=(TW-\d{2})/i),
    lossTypeId:take('Loss',/(?:^|·)\s*Loss=(LOSS-[A-Z0-9-]+)/i),
    time:take('Time',/(?:^|·)\s*Time=(-?\d+)/i)
  });
}

function queryTerms(question=''){
  const text=clean(question);
  const terms=[];
  for(const x of text.match(/[A-Za-z][A-Za-z0-9-]{1,}/g)||[]) terms.push(x.toLowerCase());
  for(const seq of text.match(/[\u3400-\u9fff]{2,12}/g)||[]){
    terms.push(seq);
    for(let n=2;n<=Math.min(4,seq.length);n++) for(let i=0;i<=seq.length-n;i++) terms.push(seq.slice(i,i+n));
  }
  for(const [pattern,expansions] of ENTITY_EXPANSIONS) if(pattern.test(text)) terms.push(...expansions);
  return unique(terms).filter(x=>x.length>=2).slice(0,48);
}

function flattenText(value,lang,depth=0){
  if(value==null||depth>4)return [];
  if(typeof value==='string'||typeof value==='number')return [clean(value)];
  if(Array.isArray(value))return value.flatMap(x=>flattenText(x,lang,depth+1));
  if(typeof value==='object'){
    if(Object.prototype.hasOwnProperty.call(value,lang)||Object.prototype.hasOwnProperty.call(value,'en')||Object.prototype.hasOwnProperty.call(value,'zh-Hans')){
      return [loc(value,lang)];
    }
    return Object.values(value).flatMap(x=>flattenText(x,lang,depth+1));
  }
  return [];
}

function scoreRecord(record,terms,selectedIds=[]){
  const ids=[
    record.caseId,record.periodId,record.familyId,record.snapshotId,record.trajectoryId,
    record.transitionWindowId,record.lossTypeId,record.scaleShiftId
  ].map(clean).filter(Boolean);
  if(ids.some(id=>selectedIds.includes(id))) return 10000;
  const hay=flattenText(record,'zh-Hans').concat(flattenText(record,'en')).join(' ').toLowerCase();
  let score=0;
  for(const term of terms){
    const t=term.toLowerCase();
    if(!t)continue;
    if(hay.includes(t)) score+=t.length>=4?8:3;
    if(ids.some(id=>id.toLowerCase()===t))score+=100;
  }
  return score;
}

function recordId(record){
  return clean(record.caseId||record.periodId||record.snapshotId||record.trajectoryId||record.transitionWindowId||record.lossTypeId||record.scaleShiftId||record.familyId);
}

function summaryParts(record,lang){
  const candidates=[
    record.summary,record.description,record.definition,record.positionShift,
    record.coreRuntimeProblem,record.pressure,record.threshold,record.transition,
    record.newCapacity,record.newLoad,record.successorReality,record.successorStructure,
    record.legacy,record.load,record.unknown?.note
  ];
  return unique(candidates.flatMap(v=>flattenText(v,lang))).slice(0,3);
}

function evidenceFromRecord(kind,record,lang){
  return Object.freeze({
    kind,
    id:recordId(record),
    title:loc(record.title||record.label||record.name,lang)||recordId(record),
    summary:summaryParts(record,lang).join(' ').slice(0,520),
    authorityClass:clean(record.authorityClass||record.unknown?.state||'ATLAS_REGISTRY'),
    exampleCaseIds:Object.freeze(list(record.exampleCaseIds).map(clean).filter(Boolean)),
    relatedCaseIds:Object.freeze(unique([
      ...list(record.relatedCases),
      ...list(record.caseIds),
      ...list(record.majorCaseIds)
    ]).map(clean).filter(Boolean))
  });
}

function recordsFor(kind,data){
  if(kind==='timeline')return list(data?.periods);
  if(kind==='cases')return list(data?.cases);
  if(kind==='comparison')return list(data?.families);
  if(kind==='snapshots')return list(data?.snapshots);
  if(kind==='trajectories')return list(data?.trajectories);
  if(kind==='transitions')return [...list(data?.transitionWindows),...list(data?.scaleShifts)];
  if(kind==='loss')return [...list(data?.lossTypes),...list(data?.families),...list(data?.caseProfiles)];
  return [];
}

async function fetchRegistry(path,requestUrl,fetcher){
  try{
    const response=await fetcher(new URL(path,requestUrl),{headers:{accept:'application/json'}});
    if(!response?.ok)return null;
    return await response.json();
  }catch{return null}
}

function selectedIds(parsed){
  return unique([
    parsed.caseId,parsed.snapshotId,parsed.familyId,parsed.transitionWindowId,parsed.lossTypeId,
    ...parsed.trajectoryIds
  ]);
}

function deepLink(parsed,intent){
  const params=new URLSearchParams();
  const layer=parsed.layer||LAYER_FOR_INTENT[intent]||'timeline';
  params.set('atlas',layer);
  if(parsed.time)params.set('time',parsed.time);
  if(parsed.caseId)params.set('case',parsed.caseId);
  if(parsed.snapshotId)params.set('snapshot',parsed.snapshotId);
  if(parsed.familyId)params.set('family',parsed.familyId);
  if(parsed.trajectoryIds.length)params.set('trajectories',parsed.trajectoryIds.join(','));
  if(parsed.transitionWindowId)params.set('tw',parsed.transitionWindowId);
  if(parsed.lossTypeId)params.set('lossType',parsed.lossTypeId);
  return `/books/reality-differentiation/?${params.toString()}#atlas`;
}

function lossFamilies(registries,lang){
  return list(registries.loss?.families).map(f=>loc(f.title,lang)).filter(Boolean);
}

function resolveExampleCases(evidence,registries,lang){
  const wanted=unique(evidence.flatMap(item=>[...item.exampleCaseIds,...item.relatedCaseIds])).slice(0,5);
  const caseMap=new Map(list(registries.cases?.cases).map(c=>[c.caseId,c]));
  return wanted.map(id=>{
    const c=caseMap.get(id);
    return c?`${loc(c.title,lang)} (${id})`:id;
  }).filter(Boolean);
}

function continuationNotes(evidence,registries,lang){
  const ids=unique(evidence.flatMap(item=>[...item.exampleCaseIds,...item.relatedCaseIds])).slice(0,4);
  const caseMap=new Map(list(registries.cases?.cases).map(c=>[c.caseId,c]));
  return unique(ids.flatMap(id=>{
    const c=caseMap.get(id); if(!c)return [];
    return [
      loc(c.successorStructure?.label,lang),
      loc(c.legacy?.label,lang)
    ];
  })).slice(0,3);
}

function directFraming(intent,registries,lang){
  const zh=lang==='zh-Hans';
  if(intent==='CIVILIZATION_DECLINE'||intent==='LOSS'||intent==='NO_SCORE_GOVERNANCE'){
    const families=lossFamilies(registries,lang);
    const dimensions=families.length?families.join(zh?'、':', '):(zh?'政治边界、人口城市、知识制度、网络基础设施、意义身份载体、继任与未来':'political boundary, population/urban, knowledge/institutional, network/infrastructure, meaning/identity/carrier, and succession/future');
    return zh
      ?`文明或国家的「落寞」不是一个单一总分。文明图谱把它拆成多维位置变化：${dimensions}；因此政权结束、领土缩小或城市衰退都不能自动等同于整个文明消失。`
      :`Civilizational or national decline is not one total score. The Atlas separates it into multidimensional position changes—${dimensions}; regime end, territorial contraction, or urban decline therefore does not automatically equal the disappearance of a civilization.`;
  }
  if(intent==='COMPARISON')return zh?'文明图谱的比较用于识别不同 Runtime 的结构差异，不形成文明强弱或优越排名。':'Atlas comparison identifies structural differences between runtimes; it does not produce a strength or superiority ranking.';
  if(intent==='WORLD_SNAPSHOT')return zh?'世界横切面把同一时间点的多个文明放在同一视野中，比较的是位置、网络与运行条件，而不是现代国界排名。':'A world snapshot places multiple civilizations in the same time slice to compare position, networks, and operating conditions—not modern-border rankings.';
  if(intent==='TRANSITION'||intent==='SCALE_SHIFT')return zh?'文明转型不是单一事件，而是压力、阈值、转型、新能力、新负载与继任结构共同形成的窗口。':'Civilizational transition is not a single event; it is a window shaped by pressure, threshold, transition, new capacity, new load, and successor structure.';
  if(intent==='TRAJECTORY')return zh?'长时段轨迹描述能力如何形成、扩展、饱和、断裂、转移与重构，并明确区分资料系列、历史重建与概念轨迹。':'Long-duration trajectories describe formation, expansion, saturation, break, transfer, and reconstruction while keeping evidence series, historical reconstruction, and conceptual trajectories distinct.';
  if(intent==='SUCCESSION')return zh?'旧政权或旧载体终止以后，人口、制度、知识、语言、网络、记忆或基础设施仍可能进入后继 Runtime。':'After an old regime or carrier ends, population, institutions, knowledge, language, networks, memory, or infrastructure may continue into successor runtimes.';
  if(intent==='TIMELINE')return zh?'历史脊柱用于把事件放回长期时期结构，避免把一个转折点误当成整个文明的全部历史。':'The timeline spine places events back into long-duration period structure so one turning point is not mistaken for the whole history of a civilization.';
  return zh?'文明图谱会先确定你正在问的时间、案例、比较、轨迹、转型或损失位置，再进入更广泛的 PHI OS 解释。':'The Civilization Atlas first locates the relevant time, case, comparison, trajectory, transition, or loss position before broader PHI OS interpretation.';
}

function answerSections(intent,evidence,registries,lang){
  const zh=lang==='zh-Hans';
  const summaries=unique(evidence.map(x=>x.summary).filter(Boolean));
  const losses=evidence.filter(x=>x.kind==='loss').map(x=>x.title).filter(Boolean);
  const examples=resolveExampleCases(evidence,registries,lang);
  const continued=continuationNotes(evidence,registries,lang);
  const unknowns=unique(evidence.map(x=>x.authorityClass).filter(Boolean).map(x=>zh?`证据状态：${x}`:`Evidence state: ${x}`));
  return Object.freeze({
    whatChanged:Object.freeze(summaries.slice(0,3)),
    lossDimensions:Object.freeze((losses.length?losses:lossFamilies(registries,lang)).slice(0,6)),
    examples:Object.freeze(examples.slice(0,4)),
    whatContinued:Object.freeze((continued.length?continued:[
      zh?'结束一种政治或组织载体，不自动等于语言、制度、知识、记忆与网络同时归零。':'Ending one political or organizational carrier does not automatically erase language, institutions, knowledge, memory, and networks at the same time.'
    ]).slice(0,3)),
    evidenceUnknown:Object.freeze(unknowns.slice(0,4))
  });
}

export async function resolveCivilizationAtlasAsk({
  question='',locale='zh-Hans',entryContext={},knowledgeContext={},requestUrl='https://phios.test/',fetcher=fetch
}={}){
  if(!isCivilizationAtlasContext({entryContext,knowledgeContext}))return null;
  const lang=langOf(locale);
  const intent=classifyCivilizationAtlasIntent(question,knowledgeContext);
  const parsed=parseContextSummary(knowledgeContext.contextSummary);
  const kinds=INTENT_REGISTRIES[intent]||INTENT_REGISTRIES.GENERAL_ATLAS;
  const loaded=await Promise.all(kinds.map(async kind=>[kind,await fetchRegistry(REGISTRY_PATHS[kind],requestUrl,fetcher)]));
  const registries=Object.fromEntries(loaded);
  const terms=queryTerms(question);
  const chosenIds=selectedIds(parsed);
  const evidence=[];
  for(const kind of kinds){
    const ranked=recordsFor(kind,registries[kind])
      .map(record=>({record,score:scoreRecord(record,terms,chosenIds)}))
      .filter(x=>x.score>0||chosenIds.includes(recordId(x.record)))
      .sort((a,b)=>b.score-a.score||recordId(a.record).localeCompare(recordId(b.record)))
      .slice(0,kind==='cases'?3:2);
    evidence.push(...ranked.map(x=>evidenceFromRecord(kind,x.record,lang)));
  }
  if(!evidence.length){
    for(const kind of kinds){
      const first=recordsFor(kind,registries[kind])[0];
      if(first)evidence.push(evidenceFromRecord(kind,first,lang));
      if(evidence.length>=3)break;
    }
  }
  const selectedEvidence=Object.freeze(evidence.slice(0,8));
  const link=deepLink(parsed,intent);
  const direct=directFraming(intent,registries,lang);
  const sections=answerSections(intent,selectedEvidence,registries,lang);
  return Object.freeze({
    schemaVersion:'PHI-OS-BOOK-V-CIV-ATLAS-R1-M1-W5-W6-ASK-CONTEXT-v1.0.0',
    intent,
    selected:parsed,
    retrievalPriority:ATLAS_RETRIEVAL_PRIORITY,
    evidence:selectedEvidence,
    directFraming:direct,
    sections,
    deepLink:link,
    route:'/books/reality-differentiation/',
    governance:Object.freeze({
      existingAskRuntimeReused:true,
      secondAskRuntimeCreated:false,
      secondRetrievalRuntimeCreated:false,
      atlasRegistryIsEvidenceContext:true,
      registryBecomesCanonicalKnowledge:false,
      posterUsedAsEvidence:false,
      civilizationScoreCreated:false
    })
  });
}

export function composeCivilizationAtlasRetrievalQuestion(question,atlas){
  const current=clean(question);
  if(!atlas)return current;
  const selected=Object.entries(atlas.selected||{}).filter(([,v])=>Array.isArray(v)?v.length:Boolean(v)).map(([k,v])=>`${k}=${Array.isArray(v)?v.join(','):v}`);
  const evidence=atlas.evidence.slice(0,6).map(x=>`${x.kind}:${x.id} ${x.title} ${x.summary}`.trim());
  return `${current}

Civilization Atlas retrieval contract:
Intent: ${atlas.intent}
Priority:
${atlas.retrievalPriority.map((x,i)=>`${i+1}. ${x}`).join('\n')}
Selected Atlas context: ${selected.join(' · ')||'BOOK-5 / PART-12 / ATLAS'}
Registry evidence cues:
${evidence.join('\n')||'No selected registry record; use Part 12 / Book V before broader PHI OS knowledge.'}
Answer ordering: history/Atlas evidence first for historical questions; theory second. For theory questions, theory may lead but must use Atlas examples when available.
Do not substitute a generic differentiation mechanism when Civilization Atlas evidence is available.
Do not create a civilization ranking, collapse score, or superiority score.`;
}
