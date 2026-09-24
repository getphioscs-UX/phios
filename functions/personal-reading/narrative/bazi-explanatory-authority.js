import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
export const EXPLANATORY_AUTHORITY_VERSION='BAZI_EXPLANATORY_AUTHORITY_V2';
export const RELATION_TYPES=Object.freeze(['EMPHASIS','LIFE_DOMAIN_EXPLANATION','OPERATING_CONDITION','ASSOCIATION','CO_OCCURRING_DIMENSIONS','CONTEXT_MODIFIER','SUPPORT_CONDITION','TENSION','CONTRAST','OPEN_CONDITION','COUNTER_SIGNAL','TEMPORAL_RELEVANCE','CROSS_SECTION_RELEVANCE','BOUNDARY']);
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
  if(narrative.development?.[lang])add('DOMAIN_EXPLANATION','LIFE_DOMAIN_EXPLANATION',topicCode,[topicCode],narrative.development[lang],[`${narrativeRef}/development`,`${topicRef}/leadGroup`,`${topicRef}/relevantTenGods`,`${topicRef}/relationshipInterfaces`,`${topicRef}/carryingContext`,`${topicRef}/priorityRefs`],{conditions:['METHOD_OWNED_MULTI_FACTOR_EXPLANATION','NOT_OBSERVED_REALITY'],explanationScope:'LIFE_DOMAIN'});
  add('DIMENSIONS','CO_OCCURRING_DIMENSIONS',topicCode,[topicCode],narrative.lead[lang],[`${narrativeRef}/lead`],{conditions:['DIMENSIONS_ARE_SIMULTANEOUS_NOT_A_SEQUENCE']});
  // S02's accepted evidence is frozen. Successor sections retain every
  // section-owned relation, including contradictory pairs, without a top-N cap.
  for(const rel of arr(topic.relationshipInterfaces)){
   const i=topic.relationshipInterfaces.indexOf(rel),positions=arr(rel.positions);
   if((positions.length===2||sectionKey!=='S02_PERSONALITY'&&positions.length>2)&&positions.every(x=>POSITION[x])){
    const family={LINK:['symbolic linkage','象征性联结'],TENSION:['structural tension','结构张力'],REPEAT_TENSION:['repeated structural tension','重复的结构张力']}[rel.relationFamily];
    const text=say(`The relation among ${positions.map(x=>POSITION[x][0]).join(', ')} is ${family?.[0]||'a recorded structural relation'}. It modifies how the method reads this topic together with the other chart factors, without establishing an observed behavior.`,`${positions.map(x=>POSITION[x][1]).join('、')}之间呈现${family?.[1]||'已记录的结构关系'}。它会修正本章与其他命盘因素的组合读取方式，但不据此认定已经观察到的行为。`);
    add(`PAIR_${rel.relationId}`,'CONTEXT_MODIFIER',positions[0],positions.slice(1),text,[`${topicRef}/relationshipInterfaces/${i}`],{conditions:['KEEP_THIS_PAIR_DISTINCT','NO_BEHAVIORAL_EFFECT'],relationQualifier:rel.relationFamily});
   }
  }
  const carry=topic.carryingContext;
  if(carry?.supportVisible>0)add('SUPPORT','SUPPORT_CONDITION',topicCode,['STRUCTURAL_SUPPORT'],say('The method records support within the structure. This does not establish how much practical help is available.','方法在结构中记录到支持，但这不能证明现实中有多少帮助可用。'),[`${topicRef}/carryingContext`, 'professionalModules/dayMasterStrength/supportBalance']);
  if(carry?.pressureVisible>0||carry?.outwardVisible>0)add('TENSION','TENSION',topicCode,['SUPPORT','EXPRESSION','EXTERNAL_DEMAND'],say('Support, expression and external demands must be considered together in this reading; the chart does not establish how they are experienced.','这份解读需要把支持、表达与外部要求放在一起考虑；命盘不能证明它们在现实中如何被体验。'),[`${topicRef}/carryingContext`,`${narrativeRef}/condition`],{conditions:['NO_OBSERVED_PRESSURE_ASSERTION']});
  if(narrative.condition?.[lang])add('OPERATING_CONDITION','OPERATING_CONDITION',topicCode,[topicCode],narrative.condition[lang],[`${narrativeRef}/condition`,`${topicRef}/carryingContext`],{conditions:['METHOD_OWNED_OPERATING_CONDITION','NOT_OBSERVED_REALITY']});
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
 let depth=null;
 {
  const bi=arr(p.realityBridge?.topicPrompts).findIndex(t=>t.topicCode===topicCode),nativePrompts=p.realityBridge?.topicPrompts?.[bi]?.prompts||[];
  for(const [index,prompt] of nativePrompts.entries())if(anchor&&prompt.prompt?.[lang]){
   const counter=prompt.promptType==='COUNTEREXAMPLE';
   (counter?counters:questions).push({id:`${sectionKey}:${prompt.promptId}`,kind:counter?'COUNTER_PROMPT':'OBSERVATION_PROMPT',relationType:counter?'COUNTER_SIGNAL':anchor.relationType,claimIds:[anchor.id],text:prompt.prompt[lang],sourceRefs:[`professionalModules/realityBridge/topicPrompts/${bi}/prompts/${index}`],scope:'QUESTION_ONLY_NEVER_OBSERVED_FACT'});
  }
  if(narrative?.condition?.[lang])add('OPERATING_CONDITION','CONTRAST',topicCode,[topicCode],narrative.condition[lang],[`${narrativeRef}/condition`],{conditions:['NATIVE_TOPIC_CONDITION_NOT_OBSERVED_REALITY']});
  for(const priorityRef of arr(topic?.priorityRefs)){
   const ci=arr(p.customerNarrative?.priorityChapters).findIndex(c=>c.priorityRef===priorityRef),chapter=p.customerNarrative?.priorityChapters?.[ci];
   const pi=arr(p.wholeChartPriority?.themes).findIndex(t=>t.priorityId===priorityRef);
   if(chapter?.development?.[lang]&&pi>=0)add(`WHOLE_${priorityRef}`,'CROSS_SECTION_RELEVANCE',priorityRef,[topicCode],chapter.development[lang],[`professionalModules/customerNarrative/priorityChapters/${ci}/development`,`professionalModules/wholeChartPriority/themes/${pi}`,...(chapter.condition?.[lang]?[`professionalModules/customerNarrative/priorityChapters/${ci}/condition`]:[])],{rank:null,wholeChartRank:chapter.rank,conditions:chapter.condition?.[lang]?['NATIVE_PRIORITY_CONDITION']:[],conditionText:chapter.condition?.[lang]||null});
  }
  for(const claim of claims){
   claim.claimId=claim.id;claim.claimType=claim.relationType;claim.priority=claim.rank===1?'PRIMARY':claim.relationType==='TENSION'?'CONTRADICTORY':claim.relationType==='TEMPORAL_RELEVANCE'?'TIMING':claim.relationType==='ASSOCIATION'?'SECONDARY':'SUPPORTING';
   claim.basis=claim.sourceRefs.map(ref=>({ref,value:pathGet(reading,ref)}));
   claim.counterweights=arr(topic?.patternCandidates).filter(c=>c.conclusionState?.startsWith('OPEN')).map(c=>({candidateId:c.candidateId,state:c.conclusionState,sourceRef:`${topicRef}/patternCandidates/${topic.patternCandidates.indexOf(c)}`,scope:'SECTION_CONTEXT_NOT_NEW_RELATION',permission:'UNCERTAINTY_ONLY'}));
   claim.timing=claim.temporalContext?[claim.temporalContext]:[];claim.lifeDomains=[topicCode];claim.observableSignals=questions.filter(q=>q.sourceRefs).map(q=>({questionId:q.id,sourceRefs:q.sourceRefs,scope:'REFLECTION_ONLY_NOT_PREDICTED_MANIFESTATION'}));claim.confidence='BOUNDED_SOURCE_PROJECTION_NOT_EMPIRICAL_CERTAINTY';claim.license={owner:EXPLANATORY_AUTHORITY_VERSION,createsMethodRule:false,allowsObservedReality:false};claim.provenance=claim.sourceRefs;
  }
  const relations=arr(topic?.relationshipInterfaces).map(r=>({relationId:r.relationId,priority:r.relationFamily==='TENSION'||r.relationFamily==='REPEAT_TENSION'?'CONTRADICTORY':r.dayMasterDirect?'PRIMARY':'SUPPORTING',source:r,canonicalRelation:arr(p.relationships?.items).find(x=>x.relationId===r.relationId)||null}));
  const semanticFacts=arr(p.tenGods?.items).filter(t=>arr(topic?.relevantTenGods).some(x=>x.tenGodCode===t.tenGodCode)).map(t=>({sourceRef:`professionalModules/tenGods/items/${p.tenGods.items.indexOf(t)}`,value:t}));
  for(const key of ['supportBalance','seasonalSupport','roots','withheldVerdict'])if(p.dayMasterStrength?.[key])semanticFacts.push({sourceRef:`professionalModules/dayMasterStrength/${key}`,value:p.dayMasterStrength[key]});
  for(const r of relations){const index=arr(p.relationships?.items).findIndex(x=>x.relationId===r.relationId);if(index>=0)semanticFacts.push({sourceRef:`professionalModules/relationships/items/${index}`,value:p.relationships.items[index]});}
  if(sectionKey==='S03_LIFE_STRUCTURE')for(const key of ['candidates','summary','counterEvidenceRefs','qualifierCodes'])if(p.pattern?.[key])semanticFacts.push({sourceRef:`professionalModules/pattern/${key}`,value:p.pattern[key]});
  depth={version:'BAZI_RICH_CLAIM_IR_V2',selection:'FULL_SECTION_RELATIONS_PLUS_METHOD_OWNED_LIFE_LAYER',relations,semanticFacts,patternCandidates:topic?.patternCandidates||[],carryingContext:topic?.carryingContext||null,priorityRefs:topic?.priorityRefs||[],rawFactsAreNotNarrativeLicenses:true,licensedLifeLayerExplanation:true,observableLifeClaims:'QUESTIONS_ONLY_UNLESS_EXPLICIT_NATIVE_SOURCE',missingFacets:['NO_AUTOMATIC_OBSERVED_REALITY']};
 }
 const provenance=await Promise.all([...MODULES,...(depth?['realityBridge']:[])].filter(k=>p[k]).map(async module=>({module:`professionalModules/${module}`,digest:await sha256Stable(p[module])})));
 return deepFreeze({version:EXPLANATORY_AUTHORITY_VERSION,claims,reflectionQuestions:questions,counterPrompts:counters,manifestationLicenses:[],temporalAuthority:['S08_TIMING','S09_GUIDANCE'].includes(sectionKey)?timeline:null,integratedGuidanceIR:guidance,sourceLineage:provenance,...(depth?{depth}: {})});
}
export function buildTemporalRelevanceIR(p){
 const t=p.professionalTimeline,w=t?.currentWindow;
 if(!t?.schemaVersion?.startsWith('PHI-OS-BAZI-CX-PRO-DA-YUN-LIU-NIAN-PROFESSIONAL-TIMELINE')||!w?.available)return {available:false};
 return {available:true,authority:t.schemaVersion,natalPriorityRelations:arr(t.natalPriorityRefs),daYunRelevance:w.currentDaYun?{pillar:w.currentDaYun.pillar,priorityRefs:arr(w.currentDaYunPriorityRefs)}:null,annualRelevance:w.annual?{year:w.annual.year,stem:w.annual.stem,branch:w.annual.branch,priorityRefs:arr(w.annualPriorityRefs)}:null,crossLayerRelevance:w.interactions||{},topicTemporalRelevance:arr(w.topicTimeline).map(x=>({topicCode:x.topicCode,activationState:x.activationState,priorityRefs:x.priorityRefs,daYun:x.daYun,liuNian:x.liuNian})),boundaries:t.boundaries};
}
export function buildIntegratedGuidanceIR(p){
 const topics=arr(p.professionalTopics?.topics),timeline=buildTemporalRelevanceIR(p);
 const themes=arr(p.wholeChartPriority?.themes).slice().sort((a,b)=>a.rank-b.rank).map(t=>({priorityId:t.priorityId,rank:t.rank,themeType:t.themeType,themeKey:t.themeKey,topicCodes:topics.filter(x=>arr(x.priorityRefs).includes(t.priorityId)).map(x=>x.topicCode),temporalRelevance:arr(timeline.topicTemporalRelevance).filter(x=>arr(x.priorityRefs).includes(t.priorityId)).map(x=>({topicCode:x.topicCode,activationState:x.activationState})),sourceRefs:t.sourceRefs}));
 return {version:'BAZI_INTEGRATED_GUIDANCE_IR_V1',themes,primaryThemeId:themes[0]?.priorityId||null,temporalAuthority:timeline.available?timeline.authority:null,methodOwned:true,eventPrediction:false};
}
