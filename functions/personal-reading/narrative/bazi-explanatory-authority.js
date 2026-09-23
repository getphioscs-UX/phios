import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
export const EXPLANATORY_AUTHORITY_VERSION='BAZI_EXPLANATORY_AUTHORITY_V1';
export const RELATION_TYPES=Object.freeze(['EMPHASIS','ASSOCIATION','CO_OCCURRING_DIMENSIONS','CONTEXT_MODIFIER','SUPPORT_CONDITION','TENSION','CONTRAST','OPEN_CONDITION','COUNTER_SIGNAL','TEMPORAL_RELEVANCE','CROSS_SECTION_RELEVANCE','BOUNDARY']);
export const PROHIBITED_OPERATORS=Object.freeze(['CAUSE','SEQUENCE','BEHAVIORAL_EFFECT','EVENT_INFERENCE','REALITY_ASSERTION']);
export const BLOCK_KINDS=Object.freeze(['CUSTOMER_CLAIM','OBSERVATION_PROMPT','COUNTER_PROMPT','BOUNDARY','TECHNICAL_NOTE']);
export const COMPOSER_OPERATORS=Object.freeze(['PARAPHRASE','PLAIN_LANGUAGE_ABSTRACTION','RANK_PRESERVING_SUMMARY','CONDITIONAL_REFRAME','CONTRAST','QUESTION_GENERATION']);
export const DEFECT_CODES=Object.freeze(['UNLICENSED_CAUSAL','UNLICENSED_SEQUENCE','UNLICENSED_MANIFESTATION','COUNTERSIGNAL_EXPANSION','QUESTION_TO_FACT_PROMOTION','PAIRWISE_RELATION_COLLAPSE','RANK_FLATTENING','RANK_INVERSION','TECHNICAL_LANGUAGE_LEAK','REALITY_INFERENCE','UNLICENSED_CLAIM','CONDITION_OMISSION','TEMPORAL_CONFLICT']);
const GROUP={PEER:['peer relationships and self-position','同类关系与自我位置'],OUTPUT:['expression and output','表达与输出'],WEALTH:['resources and exchange','资源与交换'],OFFICER:['rules, responsibility and pressure','规则、责任与压力'],RESOURCE:['learning, support and absorption','学习、支持与吸收']};
const POSITION={YEAR:['outer context','外部背景'],MONTH:['environment','环境'],DAY:['self-position','自我位置'],HOUR:['expression','表达']};
const TOPICS={S02_PERSONALITY:'CAPABILITY',S03_LIFE_STRUCTURE:'LIFE_OPERATION',S04_CAREER:'CAREER',S05_WEALTH:'WEALTH',S06_RELATIONSHIP:'RELATIONSHIPS',S07_HEALTH:'PRESSURE',S08_TIMING:'TIMING',S09_GUIDANCE:'GUIDANCE'};
const MODULES=['tenGods','dayMasterStrength','relationships','pattern','wholeChartPriority','professionalTopics','professionalTimeline','customerNarrative'];
const arr=x=>Array.isArray(x)?x:[];
const pathGet=(root,path)=>path.split('/').reduce((v,k)=>v?.[k],root);

// Projection of admitted professional reading only. No birth calculation,
// reassignment of ranks, new pattern verdict or causal rule is performed here.
export async function buildBaZiNarrativeClaimIR({reading,sectionKey,locale,temporalSnapshot}){
 const p=reading?.professionalModules;if(!p||!TOPICS[sectionKey])throw Error('EXPLANATORY_AUTHORITY_INPUT_REQUIRED');
 const zh=locale==='zh-Hans',lang=zh?'zhHans':'en',say=(en,cn)=>zh?cn:en,group=code=>GROUP[code]?.[zh?1:0];
 const topicCode=TOPICS[sectionKey],topicIndex=arr(p.professionalTopics?.topics).findIndex(t=>t.topicCode===topicCode),topic=p.professionalTopics?.topics?.[topicIndex];
 const narrativeIndex=arr(p.customerNarrative?.topicNarratives).findIndex(t=>t.topicCode===topicCode),narrative=p.customerNarrative?.topicNarratives?.[narrativeIndex];
 const claims=[];
 function add(key,relationType,subject,objects,text,sourceRefs,options={}){
  if(!RELATION_TYPES.includes(relationType)||!sourceRefs.length||sourceRefs.some(ref=>!MODULES.some(m=>ref.startsWith(`professionalModules/${m}/`))||pathGet(reading,ref)===undefined))return null;
  const claim={id:`${sectionKey}:${key}`,sectionKey,domain:topicCode,subject,relationType,objects,rank:null,modality:'SYMBOLIC_CONDITIONAL',sourceRefs,allowParaphrase:true,allowConditionalLanguage:true,allowCausalLanguage:false,allowSequenceLanguage:false,allowManifestation:false,allowObservedRealityClaim:false,conditions:[],openConditions:[],text,...options};
  claims.push(claim);return claim;
 }
 const topicRef=`professionalModules/professionalTopics/topics/${topicIndex}`,narrativeRef=`professionalModules/customerNarrative/topicNarratives/${narrativeIndex}`;
 if(topic&&narrative){
  if(group(topic.leadGroup?.groupCode))add('PRIMARY','EMPHASIS',topicCode,[topic.leadGroup.groupCode],say(`Within this topic, ${group(topic.leadGroup.groupCode)} receives the first emphasis. This is a reading priority, not a measured trait.`,`在这个主题中，${group(topic.leadGroup.groupCode)}是首先关注的内容。这表示解读重点，不是测得的人格特质。`),[`${topicRef}/leadGroup`,`${narrativeRef}/development`],{rank:1});
  const secondary=arr(topic.relevantGroups).filter(g=>g.groupCode!==topic.leadGroup?.groupCode&&group(g.groupCode));
  if(secondary.length)add('SECONDARY','ASSOCIATION',topicCode,secondary.map(g=>g.groupCode),say(`Other associated themes are ${secondary.map(g=>group(g.groupCode)).join('; ')}. They do not replace the topic's first emphasis.`,`同时相关的主题包括${secondary.map(g=>group(g.groupCode)).join('、')}，它们不取代本章的首要重点。`),[`${topicRef}/relevantGroups`,`${topicRef}/leadGroup`]);
  add('DIMENSIONS','CO_OCCURRING_DIMENSIONS',topicCode,[topicCode],narrative.lead[lang],[`${narrativeRef}/lead`],{conditions:['DIMENSIONS_ARE_SIMULTANEOUS_NOT_A_SEQUENCE']});
  // Preserve each pair separately. A display cap selects the same first two
  // source relations in both locales; it never merges their endpoints.
  for(const rel of arr(topic.relationshipInterfaces).slice(0,2)){
   const i=topic.relationshipInterfaces.indexOf(rel),positions=arr(rel.positions);
   if(positions.length===2&&positions.every(x=>POSITION[x]))add(`PAIR_${rel.relationId}`,'CONTEXT_MODIFIER',positions[0],[positions[1]],say(`The structural relation between ${POSITION[positions[0]][0]} and ${POSITION[positions[1]][0]} is part of the context for this topic. It does not establish a real-life effect.`,`${POSITION[positions[0]][1]}与${POSITION[positions[1]][1]}之间的结构关系，是理解本章时需要保留的背景，不能由此认定现实中的作用。`),[`${topicRef}/relationshipInterfaces/${i}`],{conditions:['KEEP_THIS_PAIR_DISTINCT','NO_BEHAVIORAL_EFFECT'],relationQualifier:rel.relationFamily});
  }
  const carry=topic.carryingContext;
  if(carry?.supportVisible>0)add('SUPPORT','SUPPORT_CONDITION',topicCode,['STRUCTURAL_SUPPORT'],say('The method records support within the structure. This does not establish how much practical help is available.','方法在结构中记录到支持，但这不能证明现实中有多少帮助可用。'),[`${topicRef}/carryingContext`, 'professionalModules/dayMasterStrength/supportBalance']);
  if(carry?.pressureVisible>0||carry?.outwardVisible>0)add('TENSION','TENSION',topicCode,['SUPPORT','EXPRESSION','EXTERNAL_DEMAND'],say('Support, expression and external demands must be considered together in this reading; the chart does not establish how they are experienced.','这份解读需要把支持、表达与外部要求放在一起考虑；命盘不能证明它们在现实中如何被体验。'),[`${topicRef}/carryingContext`,`${narrativeRef}/condition`],{conditions:['NO_OBSERVED_PRESSURE_ASSERTION']});
 }
 if(topic&&p.dayMasterStrength?.withheldVerdict?.strongWeakLabelCreated===false)add('OPEN_STRENGTH','OPEN_CONDITION','FINAL_STRENGTH',[],say('The reading leaves a final strong-or-weak judgment open; it is not a fixed identity.','解读保留最终强弱判断，不据此定义固定身份。'),['professionalModules/dayMasterStrength/withheldVerdict'],{modality:'UNRESOLVED',openConditions:['FINAL_STRENGTH_WITHHELD']});
 if(sectionKey==='S03_LIFE_STRUCTURE'&&p.pattern?.summary?.primaryPatternEstablished===false)add('OPEN_PATTERN','OPEN_CONDITION','PRIMARY_PATTERN',[],say('A final primary pattern has not been established; visible candidates remain conditional.','最终主格局尚未成立；可见候选仍须保留条件。'),['professionalModules/pattern/summary','professionalModules/pattern/state'],{modality:'UNRESOLVED',openConditions:arr(p.pattern.qualifierCodes)});
 const timeline=buildTemporalRelevanceIR(p);
 if(sectionKey==='S08_TIMING'){
  if(timeline.available){
   for(const [key,value] of Object.entries(timeline).filter(([key])=>key.endsWith('Relevance')||key==='natalPriorityRelations')){
    if(!value||Array.isArray(value)&&!value.length)continue;
    add(`TIME_${key}`,'TEMPORAL_RELEVANCE',key,[value],say(`The saved ${key==='natalPriorityRelations'?'natal priorities':key==='daYunRelevance'?'Da Yun layer':key==='annualRelevance'?'annual layer':key==='topicTemporalRelevance'?'topic relevance':'cross-layer relations'} provide a structural comparison for the selected observation window. Relevance does not predict events.`,`保存的${key==='natalPriorityRelations'?'本命重点':key==='daYunRelevance'?'大运层':key==='annualRelevance'?'流年层':key==='topicTemporalRelevance'?'主题关联':'跨层关系'}用于所选观察窗口中的结构比较，相关性不等于事件预测。`),['professionalModules/professionalTimeline/currentWindow','professionalModules/professionalTimeline/natalPriorityRefs'],{conditions:['NATAL_REMAINS_BASELINE','NO_EVENT_CERTAINTY'],temporalContext:temporalSnapshot});
   }
  }else add('OPEN_TIME','OPEN_CONDITION','TEMPORAL_WINDOW',[],say('The available reading does not establish a complete time comparison.','现有读取未建立完整的时间层比较。'),['professionalModules/professionalTimeline/state'],{modality:'UNRESOLVED'});
 }
 const guidance=sectionKey==='S09_GUIDANCE'?buildIntegratedGuidanceIR(p):null;
 if(guidance)for(const theme of guidance.themes){
  const index=arr(p.wholeChartPriority.themes).findIndex(t=>t.priorityId===theme.priorityId),chapter=arr(p.customerNarrative.priorityChapters).find(c=>c.priorityRef===theme.priorityId),ci=arr(p.customerNarrative.priorityChapters).indexOf(chapter);
  if(chapter)add(`GUIDANCE_${theme.priorityId}`,'CROSS_SECTION_RELEVANCE',theme.priorityId,theme.topicCodes,chapter.development[lang],[`professionalModules/wholeChartPriority/themes/${index}`,`professionalModules/customerNarrative/priorityChapters/${ci}/development`],{rank:theme.rank,conditions:['PRIORITY_IS_READING_ORDER_NOT_FATE'],temporalRelevance:theme.temporalRelevance});
 }
 const boundary=add('BOUNDARY','BOUNDARY','SYMBOLIC_READING',[],say('This is a conditional symbolic reading, not a claim about observed behavior or a prediction of events.','这是一份有条件的象征性解读，不代表已经观察到的行为，也不预测事件。'),['professionalModules/customerNarrative/boundaries'],{allowConditionalLanguage:false});
 // Questions are licensed as questions, never as new counterexamples or facts.
 const anchor=claims.find(c=>c.id.endsWith(':DIMENSIONS'))||claims.find(c=>!['BOUNDARY','OPEN_CONDITION'].includes(c.relationType));
 const questions=anchor?[{id:`${sectionKey}:OBSERVE`,kind:'OBSERVATION_PROMPT',relationType:anchor.relationType,claimIds:[anchor.id],text:say('Which of these themes fits a concrete experience, and which does not?','这些主题中，哪些符合你的一段具体经历，哪些并不符合？')}]:[];
 const counters=boundary?[{id:`${sectionKey}:COUNTER`,kind:'COUNTER_PROMPT',relationType:'COUNTER_SIGNAL',claimIds:[boundary.id],text:say('What in your experience does not fit this reading?','你的经历中，有哪些部分并不符合这份解读？')}]:[];
 const provenance=await Promise.all(MODULES.filter(k=>p[k]).map(async module=>({module:`professionalModules/${module}`,digest:await sha256Stable(p[module])})));
 return deepFreeze({version:EXPLANATORY_AUTHORITY_VERSION,claims,reflectionQuestions:questions,counterPrompts:counters,manifestationLicenses:[],temporalAuthority:['S08_TIMING','S09_GUIDANCE'].includes(sectionKey)?timeline:null,integratedGuidanceIR:guidance,sourceLineage:provenance});
}
export function buildTemporalRelevanceIR(p){
 const t=p.professionalTimeline,w=t?.currentWindow;
 if(!t?.schemaVersion?.startsWith('PHI-OS-BAZI-CX-PRO-DA-YUN-LIU-NIAN-PROFESSIONAL-TIMELINE')||!w?.available)return {available:false};
 return {available:true,authority:t.schemaVersion,natalPriorityRelations:arr(t.natalPriorityRefs),daYunRelevance:w.currentDaYun?{pillar:w.currentDaYun.pillar,priorityRefs:arr(w.currentDaYunPriorityRefs)}:null,annualRelevance:w.annual?{year:w.annual.year,stem:w.annual.stem,branch:w.annual.branch,priorityRefs:arr(w.annualPriorityRefs)}:null,crossLayerRelevance:w.interactions||{},topicTemporalRelevance:arr(w.topicTimeline).map(x=>({topicCode:x.topicCode,activationState:x.activationState,priorityRefs:x.priorityRefs,daYun:x.daYun,liuNian:x.liuNian})),boundaries:t.boundaries};
}
export function buildIntegratedGuidanceIR(p){
 const topics=arr(p.professionalTopics?.topics),timeline=buildTemporalRelevanceIR(p);
 const themes=arr(p.wholeChartPriority?.themes).slice().sort((a,b)=>a.rank-b.rank).slice(0,3).map(t=>({priorityId:t.priorityId,rank:t.rank,themeType:t.themeType,themeKey:t.themeKey,topicCodes:topics.filter(x=>arr(x.priorityRefs).includes(t.priorityId)).map(x=>x.topicCode),temporalRelevance:arr(timeline.topicTemporalRelevance).filter(x=>arr(x.priorityRefs).includes(t.priorityId)).map(x=>({topicCode:x.topicCode,activationState:x.activationState})),sourceRefs:t.sourceRefs}));
 return {version:'BAZI_INTEGRATED_GUIDANCE_IR_V1',themes,primaryThemeId:themes[0]?.priorityId||null,temporalAuthority:timeline.available?timeline.authority:null,methodOwned:true,eventPrediction:false};
}
