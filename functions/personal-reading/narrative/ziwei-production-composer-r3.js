import {ZIWEI_REPORT_SECTIONS,ZIWEI_STAR_PROFILES as stars,ZIWEI_PALACE_LENSES as palaces,ZIWEI_TRANSFORMATION_MODIFIERS as modifiers,AUTHORITIES,PROHIBITED} from './ziwei-semantic-canon.js';
import {buildReportPublicationIrV2,assertPublicationIrV2Preservation} from './report-publication-ir-v2.js';
import {sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
export const ZIWEI_PRODUCTION_COMPOSER_VERSION='ZIWEI-CONTENT-DEPTH-R3';
const arr=x=>Array.isArray(x)?x:[],uniq=x=>[...new Set(x)],own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
export const ZIWEI_CONTENT_DEPTH_VERSION='ZIWEI-CONTENT-DEPTH-R3';
export function resolveZiweiProductionStar(placement,dimension,locale){
 if(!placement)return {state:'ABSENT',reason:'NO_PLACEMENT'};
 const profile=own(stars,placement.starCode)?stars[placement.starCode]:null;
 if(!profile||placement.meaningAdmitted!==true)return {state:'NOT_ADMITTED',placementId:placement.entityId,reason:'NO_ADMITTED_SEMANTIC_RECORD'};
 const value=profile.dimensions?.[dimension];
 if(placement.semanticDimensions?.[dimension]==='UNKNOWN'||typeof value?.en!=='string'||typeof value?.['zh-Hans']!=='string')return {state:'UNKNOWN',placementId:placement.entityId,reason:'SEMANTIC_DIMENSION_UNAVAILABLE'};
 return {state:'PRESENT',placementId:placement.entityId,starCode:placement.starCode,name:profile.label[locale],dimension,text:value[locale],sourceRef:AUTHORITIES.semantic[0]+'#ZIWEI_PRO_R2_STAR_PROFILES_V2/'+placement.starCode+'/dimensions/'+dimension};
}
export function ziweiPalaceLabel(code,locale){return palaces[code]?.label?.[locale]||(locale==='en'?'unresolved palace':'宫位未解析');}
export function normalizeZiweiProductionEvidence(input){
 const s=input?.structured||input;
 if(!s?.subjectId||!s.inputFingerprint)throw Error('ZIWEI_PRODUCTION_SUBJECT_REQUIRED');
 return {...s,palaces:arr(s.palaces),placements:arr(s.placements),relationships:arr(s.relationships),transformations:arr(s.transformations),timing:arr(s.timing).filter(t=>['NATAL','DA_XIAN','LIU_NIAN'].includes(t.layer)),unknowns:arr(s.unknowns),sourceRefs:arr(s.sourceRefs)};
}
const fields={S01:'coreFunction',S02:'decisionPattern',S03:'motivatingTendency',S04:'workExpression',S05:'resourceExpression',S06:'relationshipExpression',S07:'relationshipExpression',S08:'pressureMode',S09:'coreFunction',S10:'coreFunction',S11:'decisionPattern',S12:'coreFunction'};
// Stable selection by class and canonical identity, never a sample's star names.
const ordered=xs=>xs.slice().sort((a,b)=>(a.starClass==='MAIN'?0:1)-(b.starClass==='MAIN'?0:1)||String(a.starCode).localeCompare(String(b.starCode))||String(a.entityId).localeCompare(String(b.entityId)));
export async function buildZiweiContentDepthR3Sections({evidence,locale,sourceSections=null}){
 if(!['en','zh-Hans'].includes(locale))throw Error('ZIWEI_PRODUCTION_LOCALE_REQUIRED');
 const s=normalizeZiweiProductionEvidence(evidence),zh=locale==='zh-Hans',t=(cn,en)=>zh?cn:en,label=c=>ziweiPalaceLabel(c,locale),body=s.palaces.find(p=>p.isBodyPalace)?.palaceCode;
 const sections=[];
 for(const reg of ZIWEI_REPORT_SECTIONS){
  const id=reg.sectionId,field=fields[id],layer=id==='S09'?'DA_XIAN':id==='S10'?'LIU_NIAN':null,focus=s.timing.find(x=>x.layer===layer)?.focus;
  const expand=xs=>uniq(xs.flatMap(c=>c==='ALL'?s.palaces.map(p=>p.palaceCode):c==='BODY'?body?[body]:[]:[c]));
  const primary=layer?(focus?.natalDomainCode?[focus.natalDomainCode]:[]):expand(reg.primaryPalaces);
  const context=expand(reg.contextPalaces),codes=uniq(['S01','S11','S12'].includes(id)?s.palaces.map(p=>p.palaceCode):[...primary,...context,...(layer?s.transformations.filter(x=>x.layer===layer).map(x=>x.palaceCode):[])]);
  const usage=codes.map(code=>{
   const placements=ordered(s.placements.filter(p=>p.palaceCode===code)),resolutions=placements.map(p=>resolveZiweiProductionStar(p,field,locale));
   const usable=placements.filter((_,i)=>resolutions[i].state==='PRESENT');
   const intended=primary.includes(code)?primary.indexOf(code)===0?'PRIMARY':'MODIFIER':id==='S11'||id==='S12'||id==='S01'?'CONTEXT':'COUNTERWEIGHT';
   return {palaceCode:code,availability:placements.length?'PRESENT':'ABSENT',role:usable.length?intended:'CONTEXT',intendedRole:intended,reason:usable.length?'Admitted dimension available; remaining placements retain structural context':'Insufficient admitted dimension; structural context only',placements:placements.map((p,i)=>({placementId:p.entityId,state:resolutions[i].state,reason:resolutions[i].reason||'ADMITTED_DIMENSION'})),usable};
  });
  const supporting=[];
  const describe=(code,key=field)=>{
   const rows=ordered(s.placements.filter(p=>p.palaceCode===code)).map(p=>resolveZiweiProductionStar(p,key,locale)),selected=rows.filter(r=>r.state==='PRESENT').slice(0,2);
   supporting.push(...selected);
   if(!selected.length)return `${label(code)}${t('目前只保留结构位置，相关意义仍开放。',' remains structural context here; its meaning stays open.')}`;
   return label(code)+t('：',': ')+selected.map(r=>`${r.name}${t('呈现「',' brings “')}${r.text}${t('」','”')}`).join(t('；','; '))+t('。','. ');
  };
  const tx=s.transformations.filter(x=>(layer?x.layer===layer:x.layer==='NATAL')&&codes.includes(x.palaceCode));
  const txRows=tx.map(x=>{
   const p=s.placements.find(p=>p.starCode===x.targetStarCode&&p.palaceCode===x.palaceCode),r=resolveZiweiProductionStar(p,'coreFunction',locale),m=own(modifiers,x.transformationCode)?modifiers[x.transformationCode]:null;
   return {entityId:x.entityId,state:r.state==='PRESENT'&&m?'PRESENT':!m?'NOT_ADMITTED':r.state,reason:r.state==='PRESENT'&&m?'BOUND_TARGET_AND_MODIFIER':'UNRESOLVED_TARGET_OR_MODIFIER',text:r.state==='PRESENT'&&m?`${label(x.palaceCode)} · ${r.name} · ${m.label[locale]}`:null};
  });
  const rows=[],add=(role,cn,en)=>rows.push({role,text:t(cn,en)});
  const main=primary.length?primary:codes.slice(0,2),descriptions=main.map(c=>describe(c));
  const condition=main.length?describe(main[0],'highExpression'):t('主要领域尚未解析。','The primary domain is unresolved.');
  const counter=main.length?describe(main[0],'strainedExpression'):t('不据缺失资料补写反向表现。','Missing material does not license a counter-expression.');
  const starters={S01:['结构先定位经验领域，身宫保留为所落宫位的标记。','Structure locates domains of experience; Body remains a marker within its host palace.'],S02:['核心取向需同时观察命宫与身宫所在领域。','Core orientation considers Life and the domain containing Body.'],S03:['区分内在满足、自我要求与外部决定。','Distinguish inner satisfaction and expectations from outward decisions.'],S04:['工作章节观察任务功能与环境条件，不指定职业。','Work concerns task functions and environmental conditions, without prescribing an occupation.'],S05:['资源取得、分配与留存需要分别核对。','Check resource acquisition, allocation and retention separately.'],S06:['关系章节区分互动、承诺与边界，不替他人宣告意图。','Distinguish interaction, commitments and boundaries without claiming another person’s intentions.'],S07:['家庭、同辈和朋友的支持需要分别观察。','Observe family, peers and friends as distinct support contexts.'],S08:['疾厄宫用于整理象征性压力主题，不提供医学诊断。','Health organizes symbolic pressure themes and supplies no medical diagnosis.']};
  if(id==='S11'){
   add('WHAT_TO_PROTECT','保护可用资源与恢复空间，并用前文的条件来检验。','Protect available resources and recovery space, using the conditions retained in earlier chapters.');
   add('WHAT_TO_CHANGE','选择一个现实中可核对的决定，澄清责任、边界或交接。','Choose a verifiable decision and clarify responsibilities, boundaries or handoffs.');
   add('WHAT_NOT_TO_OVERCOMMIT','在资源、所有权或责任仍未明确时，不扩大承诺。','Avoid expanding commitments while resources, ownership or responsibilities remain unclear.');
   add('WHAT_TO_OBSERVE_NOW','分别记录长期反复出现的要求与当前年度新增的情境，不把时序焦点当成事件预言。','Record recurring long-cycle demands separately from the current year’s circumstances; timing focus is not an event prediction.');
   add('REVISION_EVIDENCE','保留与读取不同的体验和记录；条件变化后若预期差别没有出现，应修正解释权重。','Keep experiences and records that differ from the reading; revise its weight when changed conditions do not produce the expected difference.');
  }else if(id==='S12'){
   add('SCOPE','范围为现有十二宫与获准星曜。星曜功能只来自受治理的 PRO-R2 语义来源。','The scope is the existing twelve palaces and admitted stars. Star functions come only from the governed PRO-R2 semantic authority.');
   add('TIMING_BOUNDARY','本命、大限和流年分别保留；不启用流月、流日或流时。','Natal, Da Xian and Liu Nian remain separate. Monthly, daily and hourly timing are not activated.');
   add('UNKNOWN','缺失、未知或未获准的语义不补成解释；未知亮度不推断成庙、旺、陷或中性。','Absent, unknown or unadmitted semantics do not become interpretations. Unknown brightness is not inferred as exalted, strong, fallen or neutral.');
   add('BOUNDARY','结构关系不自动等于支持或冲突。解释不保证财富、婚姻、职业或事件，也不诊断疾病。','Structural relationships do not automatically establish support or conflict. Interpretation does not guarantee wealth, marriage, occupations or events, or diagnose illness.');
  }else if(layer){
   const modifierText=txRows.filter(x=>x.text).map(x=>x.text);
   if(id==='S09'){
    add('LONG_CYCLE_FOREGROUND',focus?`大限把${label(focus.natalDomainCode)}推到较长周期的前景，但不会改写本命结构。`:'大限前景尚未解析，因此只保留本命结构。',focus?`Da Xian brings ${label(focus.natalDomainCode)} into the foreground of the longer cycle without rewriting the natal structure.`:'The Da Xian foreground is unresolved, so only the natal structure is retained.');
    rows.push({role:'NATAL_VS_CYCLE',text:t('先把本命长期存在的运行方式与这一阶段被放大的问题分开看：','Separate enduring natal tendencies from what this longer cycle makes more salient: ')+descriptions.join(' ')});
    add('CYCLE_MODIFIERS',modifierText.length?'这一周期已绑定的修饰是：'+modifierText.join('；')+'。它们改变关注点与表达条件，不合并成吉凶分数。':'这一周期没有足够的已绑定修饰；不把缺失当成吉凶信号。',modifierText.length?'Bound modifiers in this cycle are: '+modifierText.join('; ')+'. They alter emphasis and conditions of expression, not a combined good/bad score.':'This cycle has no sufficient bound modifiers; absence is not treated as a good/bad signal.');
    add('PERSISTENT_QUESTION','这一章真正要追踪的是：什么问题在较长周期里反复要求澄清、调整或重新分配注意力？记录重复出现的情境，比寻找单一事件更有用。','The useful question is what keeps asking for clarification, adjustment or redistributed attention across the longer cycle. Repeated situations matter more than a single predicted event.');
   }else{
    add('CURRENT_YEAR_FOREGROUND',focus?`流年把${label(focus.natalDomainCode)}带到当前观察前景，但本命与大限仍是背景条件。`:'流年前景尚未解析，因此不补写年度判断。',focus?`Liu Nian brings ${label(focus.natalDomainCode)} into the current observation foreground while natal and longer-cycle conditions remain in place.`:'The Liu Nian foreground is unresolved, so no annual judgment is supplied.');
    rows.push({role:'YEAR_ONLY_VS_PERSISTENT',text:t('先区分“今年更显眼”与“本来就长期存在”：','Distinguish what is more visible this year from what has been present over the longer term: ')+descriptions.join(' ')});
    add('YEAR_MODIFIERS',modifierText.length?'当前年度已绑定的修饰是：'+modifierText.join('；')+'。这些只描述本年度的强调方式，不把月份或事件从中推算出来。':'当前年度没有足够的已绑定修饰；不据此补写月份或事件。',modifierText.length?'Bound annual modifiers are: '+modifierText.join('; ')+'. They describe this year’s emphasis only; they do not generate uncalculated months or events.':'There are no sufficient bound annual modifiers; months or events are not supplied.');
    add('OBSERVATION_WINDOW','当前最适合记录的是新增情境、责任变化与重复出现的摩擦点；如果这些变化没有出现，就应降低这层时序解释的权重。','Track new circumstances, responsibility shifts and recurring friction points. If those differences do not appear, reduce the weight given to this timing layer.');
   }
  }else{
   const contextText=context.filter(c=>!primary.includes(c)).slice(0,1).map(c=>describe(c)).join(' ');
   if(id==='S01'){
    rows.push({role:'STRUCTURAL_MAP',text:t(...starters.S01)+' '+descriptions.join(' ')});
    add('LIFE_BODY_RELATION','先把命宫当作主轴，再观察身宫所在领域怎样改变这条主轴被实际经历到的方式；两者不是两套互相竞争的结论。','Use Life as the main axis, then observe how the domain containing Body changes the way that axis is actually lived; they are not competing verdicts.');
    add('STRUCTURAL_CHECK',contextText+'这一章只建立坐标，不急着把每个落点都变成人格结论；后续章节再按具体问题调用这些结构。',contextText+'This chapter establishes coordinates rather than turning every placement into a personality verdict; later chapters call on the structure for specific questions.');
   }else if(id==='S02'){
    rows.push({role:'DECISION_SEQUENCE',text:t(...starters.S02)+' '+descriptions.join(' ')});
    add('BODY_MODIFICATION','把“先怎么决定”与“决定之后如何进入关系、责任或现实场景”分开观察，身宫所在领域更适合用来检查后半段。','Separate how a decision is first made from how it enters relationships, responsibilities or lived situations; the Body domain is more useful for checking the latter.');
    add('STRESS_SWITCH',condition+' 当条件不足时，留意是否会从清晰取舍切换成过度压缩、拖延或反复重开问题。',' '+counter);
   }else if(id==='S03'){
    rows.push({role:'INNER_EXPECTATION',text:t(...starters.S03)+' '+descriptions.join(' ')});
    add('SATISFACTION_CONDITIONS','真正值得观察的不是“喜欢什么”，而是什么条件满足时内在张力会下降、注意力会稳定，什么条件缺失时又会持续消耗。','The useful question is not simply what is liked, but which conditions lower inner tension and stabilize attention, and which missing conditions keep consuming it.');
    add('WITHDRAWAL_RECOVERY',condition+' 这可以作为恢复与重新投入的条件线索；相反，'+counter,'Use this as a clue for recovery and re-engagement. In contrast, '+counter);
    add('INNER_OUTER_DISTINCTION','如果外部决定看似合理但内在长期没有恢复感，就把两者分开记录，而不是强迫它们解释成同一个结论。','If an outward decision looks reasonable while inner recovery never follows, record the two separately rather than forcing them into one conclusion.');
   }else if(id==='S04'){
    rows.push({role:'WORK_THESIS',text:t(...starters.S04)+' '+descriptions.join(' ')});
    add('DELIVERY_CONDITIONS','把重点放在任务如何被交付：何时适合拆解旧结构、何时需要持续承载、什么样的责任边界能让结果真正留下来。','Focus on how work is delivered: when an old structure needs dismantling, when continuity is required, and which responsibility boundaries let results endure.');
    add('WORK_FAILURE_MODE',counter+' 如果现实里总在“重启—救火—再重启”之间循环，这比职位名称更值得追踪。',' '+t('如果现实里总在“重启—救火—再重启”之间循环，这比职位名称更值得追踪。','If lived work keeps cycling through restart, firefighting and restart again, that pattern matters more than the job title.'));
    add('WORK_NAVIGATION',contextText+'下一步可核对的是：职责、资源与决定权是否匹配；如果三者长期分离，再强的执行力也容易变成补漏洞。',contextText+'Next, check whether responsibility, resources and decision authority actually match. When they stay separated, even strong execution can become repeated gap-filling.');
   }else if(id==='S05'){
    rows.push({role:'ACQUISITION',text:t(...starters.S05)+' '+descriptions.join(' ')});
    add('ALLOCATION','把“能获得资源”与“资源被放到哪里”分开。机会增加并不自动等于容量增加，分配方式才决定资源是否变成可用余地。','Separate acquiring resources from deciding where they go. More opportunity does not automatically mean more capacity; allocation determines whether resources become usable room.');
    add('RETENTION_OWNERSHIP',condition+' 同时检查哪些资源需要长期维护、谁拥有决定权、哪些承诺会把未来选择提前锁死。',' '+t('同时检查哪些资源需要长期维护、谁拥有决定权、哪些承诺会把未来选择提前锁死。','Also check which resources require long maintenance, who owns the decision, and which commitments lock in future choices too early.'));
    add('OPTIONALITY_TEST',counter+' 当投入开始减少选择空间时，先问“这是必要集中，还是承诺已经超过容量？”',t('','')+counter+t(' 当投入开始减少选择空间时，先问“这是必要集中，还是承诺已经超过容量？”',' When commitments begin reducing optionality, ask whether this is necessary concentration or capacity has already been exceeded.'));
   }else if(id==='S06'){
    rows.push({role:'INTERACTION_STYLE',text:t(...starters.S06)+' '+descriptions.join(' ')});
    add('RECIPROCITY','关系质量更适合看互动是否能往返：谁提出、谁回应、谁承担后果，以及协商之后角色有没有变得更清楚。','Relationship quality is better tested through reciprocity: who initiates, who responds, who carries consequences, and whether roles become clearer after negotiation.');
    add('BOUNDARY_AND_REPAIR',condition+' 若出现压力，'+counter+' 重点不是判断关系好坏，而是看是否还有修复、重谈和重新分工的空间。','Under workable conditions, '+condition+' Under pressure, '+counter+' The question is not whether a relationship is good or bad, but whether repair, renegotiation and redistributed roles remain possible.');
    add('RELATIONSHIP_NETWORK',contextText+'把伴侣、合作、子女或社交网络分开记录，避免把一个领域的互动方式直接套到所有关系上。',contextText+'Keep partnership, collaboration, children and the wider social network distinct rather than applying one interaction pattern to every relationship.');
   }else if(id==='S07'){
    rows.push({role:'SUPPORT_OFFERED',text:t(...starters.S07)+' '+descriptions.join(' ')});
    add('SUPPORT_RECEIVED','除了“我怎样帮助别人”，也要记录“我是否能接住别人给的帮助”。只会输出支持而不接收，久了容易形成单向责任。','Alongside how support is offered, record whether support from others can actually be received. Giving without receiving can gradually become one-way responsibility.');
    add('OWNERSHIP_AND_DEPENDENCY',condition+' 再检查责任归属是否清楚；'+counter,'When support is workable, '+condition+' Then check whether responsibility remains clear. Under strain, '+counter);
    add('SUPPORT_NETWORK_TEST',contextText+'家庭、同辈和朋友不必承担同一种功能。真正稳的支持网络通常来自功能分散，而不是让一个人承担所有位置。',contextText+'Family, peers and friends do not need to serve the same function. A resilient support network often comes from distributed roles rather than one person carrying every position.');
   }else if(id==='S08'){
    rows.push({role:'PRESSURE_LOAD',text:t(...starters.S08)+' '+descriptions.join(' ')});
    add('ACCUMULATION_PATTERN','这里更适合追踪压力怎样累积，而不是给身体下结论：什么会让负荷持续增加，什么迹象表示已经没有恢复余地。','Track how pressure accumulates rather than drawing conclusions about the body: what keeps adding load, and which signs suggest recovery room is disappearing.');
    add('RECOVERY_CONDITION',condition+' 把它当作恢复条件；'+counter,'Treat this as a recovery condition: '+condition+' Under strain, '+counter);
    add('MEDICAL_BOUNDARY','如果出现持续或明显的身体症状，应使用合适的医疗评估；本章只保留象征性压力与恢复线索。','Persistent or significant physical symptoms require appropriate medical evaluation; this chapter retains only symbolic pressure and recovery cues.');
   }else{
    const start=starters[id];rows.push({role:'DOMAIN_FUNCTION',text:t(...start)+' '+descriptions.join(' ')});
    rows.push({role:'CONDITIONAL_EXPRESSION',text:condition});rows.push({role:'COUNTERWEIGHT',text:counter});
    add('OBSERVATION',contextText+t('把这些条件与实际经历核对。','Compare these conditions with lived experience.'));
   }
  }
  const unavailable=usage.flatMap(u=>u.placements.filter(p=>p.state!=='PRESENT'));
  if(unavailable.length||txRows.some(x=>x.state!=='PRESENT'))rows.at(-1).text+=t(' 部分落点或修饰的语义缺失、未知或未获准，已保留结构背景并排除相关解释。',' Some placements or modifiers have absent, unknown or unadmitted meaning; structural context is retained and related interpretation is excluded.');
  const source=sourceSections?.find(x=>x.sectionId===id);
  if(source&&(source.subjectId!==s.subjectId||source.claims.some(c=>c.subjectId!==s.subjectId||c.inputFingerprint!==s.inputFingerprint)))throw Error('ZIWEI_SOURCE_IR_SUBJECT_MISMATCH');
  if(source&&!assertPublicationIrV2Preservation({publicationIr:source.publicationIr,brief:source.brief}).accepted)throw Error('ZIWEI_SOURCE_IR_INVALID');
  const structure={palaces:codes,primaryPalaces:primary,placements:s.placements.filter(p=>codes.includes(p.palaceCode)).map(p=>p.entityId),relationships:s.relationships.filter(r=>codes.includes(r.from)).map(r=>r.entityId),transformations:tx.map(x=>x.entityId),patterns:[],timingLayers:s.timing.filter(x=>reg.timingLayers.includes(x.layer)).map(x=>x.layer)};
  const digest=await sha256Stable({subject:s.subjectId,input:s.inputFingerprint,id,structure});
  const prior=id==='S11'?sections.filter(x=>['S02','S04','S05','S07','S08','S09','S10'].includes(x.sectionId)).flatMap(x=>x.claims):[];
  const claims=source?source.claims:rows.map((r,i)=>({claimId:`ZWR:${s.subjectKey}:${id}:PROD:${digest.slice(0,16)}:${i}`,subjectId:s.subjectId,inputFingerprint:s.inputFingerprint,sectionId:id,claimType:r.role==='UNKNOWN'?'UNKNOWN':id==='S11'?'NAVIGATION_IMPLICATION':'CONDITIONAL_EXPRESSION',structure,meaning:{text:r.text},conditions:supporting.filter(r=>r.dimension==='highExpression').map(r=>r.text),counterweights:supporting.filter(r=>r.dimension==='strainedExpression').map(r=>r.text),sourceRefs:uniq([...s.sourceRefs,...supporting.map(r=>r.sourceRef)]),authority:AUTHORITIES,unknowns:s.unknowns,prohibitedExtensions:PROHIBITED,semanticOperators:[id==='S11'?'QUESTION':'CONTEXTUALIZES'],certainty:unavailable.length?'UNRESOLVED':'CONDITIONAL',timingRelevance:s.timing.filter(x=>reg.timingLayers.includes(x.layer)),priorClaimRefs:prior.map(c=>c.claimId)}));
  const brief={methodId:'ZWR',sectionKey:id,claims:claims.map(c=>({...c,timing:c.timingRelevance})),briefSemanticDigest:digest,sourceSemanticDigest:digest};
  // Semantic source IR precedes the production presentation; optional supplied
  // IR remains an immutable input and is recorded separately in the lineage.
  const sourceIr=source?.publicationIr||await buildReportPublicationIrV2({methodId:'ZWR',reportVersion:ZIWEI_PRODUCTION_COMPOSER_VERSION,sectionKey:id,locale,brief,candidate:{blocks:rows.map((r,i)=>({...r,claimRefs:[claims[i].claimId]}))},semanticOwner:'ZIWEI_PRO_R2_AUTHORITY_V2',compositionOwner:'ZIWEI_NORMALIZED_EVIDENCE_ADAPTER'});
  const publicationIr=await buildReportPublicationIrV2({methodId:'ZWR',reportVersion:ZIWEI_PRODUCTION_COMPOSER_VERSION,sectionKey:id,locale,brief,candidate:{blocks:rows.map(r=>({...r,claimRefs:claims.map(c=>c.claimId)}))},semanticOwner:'ZIWEI_PRO_R2_AUTHORITY_V2',compositionOwner:ZIWEI_PRODUCTION_COMPOSER_VERSION,snapshotLineage:{subjectId:s.subjectId,inputFingerprint:s.inputFingerprint,sourcePublicationIrDigest:sourceIr.publicationIrDigest}});
  if(!assertPublicationIrV2Preservation({publicationIr,brief}).accepted)throw Error('ZIWEI_PRODUCTION_IR_PRESERVATION_FAILED');
  sections.push({subjectId:s.subjectId,sectionId:id,locale,title:reg.title[locale],claims,brief,sourcePublicationIr:sourceIr,publicationIr,paragraphs:publicationIr.blocks.map(b=>b.prose),selectedComposition:{primary:usage.flatMap(u=>u.usable)[0]?.entityId||null},supportingEvidence:supporting,evidenceUtilisation:usage.map(({usable,...u})=>({...u,placements:u.placements.map(p=>({...p,selected:supporting.some(r=>r.placementId===p.placementId),reason:p.state!=='PRESENT'?p.reason:supporting.some(r=>r.placementId===p.placementId)?'ADMITTED_DIMENSION_USED':'RETAINED_STRUCTURAL_CONTEXT_NOT_SELECTED_FOR_THIS_SECTION'}))})),modifierResolution:txRows,optionalEvidence:{body:body?'PRESENT':'UNKNOWN',timing:layer?(focus?'PRESENT':'UNKNOWN'):'ABSENT',transformations:txRows.length?'PRESENT':'ABSENT'},unknowns:s.unknowns,editorialVersion:ZIWEI_CONTENT_DEPTH_VERSION,humanDecision:null,productionAdmissionGranted:false});
 }
 return sections;
}
