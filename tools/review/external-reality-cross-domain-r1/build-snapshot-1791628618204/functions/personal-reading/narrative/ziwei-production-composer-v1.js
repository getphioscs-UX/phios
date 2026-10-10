import {ZIWEI_REPORT_SECTIONS,ZIWEI_STAR_PROFILES as stars,ZIWEI_PALACE_LENSES as palaces,ZIWEI_TRANSFORMATION_MODIFIERS as modifiers,AUTHORITIES,PROHIBITED} from './ziwei-semantic-canon.js';
import {buildReportPublicationIrV2,assertPublicationIrV2Preservation} from './report-publication-ir-v2.js';
import {sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
export const ZIWEI_PRODUCTION_COMPOSER_VERSION='ZIWEI-PRODUCTION-COMPOSER-V1';
const arr=x=>Array.isArray(x)?x:[],uniq=x=>[...new Set(x)],own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
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
export async function buildZiweiProductionSections({evidence,locale,sourceSections=null}){
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
   const use=usage.find(u=>u.palaceCode===code),rows=ordered(s.placements.filter(p=>p.palaceCode===code)).map(p=>resolveZiweiProductionStar(p,key,locale)),selected=rows.filter(r=>r.state==='PRESENT').slice(0,2);
   supporting.push(...selected);
   if(!selected.length)return `${label(code)}${t('保留为结构背景：此维度没有足够的已获准语义，不补写解释。',' remains structural context: this dimension has insufficient admitted meaning; no interpretation is supplied.')}`;
   return label(code)+t('：',': ')+selected.map(r=>`${r.name}${t('对应「',' corresponds to “')}${r.text}${t('」','”')}`).join(t('；','; '))+t('。','. ')+(rows.length>selected.length?t('其余落点保留在结构与证据记录中，未据此扩大解释。','Other placements remain in the structural and evidence records without extending this interpretation.'):'');
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
   add('FOREGROUND',focus?`${layer==='DA_XIAN'?'大限':'流年'}焦点在${label(focus.natalDomainCode)}，本命落点不因此改变。`:'当前时间层焦点未知，不补写周期或年度判断。',focus?`${layer==='DA_XIAN'?'Da Xian':'Liu Nian'} foregrounds ${label(focus.natalDomainCode)} without changing natal placements.`:'This time layer’s foreground is unknown; no cycle or annual interpretation is supplied.');
   rows.push({role:'NATAL_CONDITIONS',text:descriptions.join(' ')});
   add('TRANSFORMATIONS',txRows.filter(x=>x.text).length?'已绑定的修饰落点：'+txRows.filter(x=>x.text).map(x=>x.text).join('；')+'。修饰不能相加为吉凶分数。':'此领域没有可用的已绑定修饰；缺失或未解析不等于吉凶判断。',txRows.filter(x=>x.text).length?'Bound modifier locations: '+txRows.filter(x=>x.text).map(x=>x.text).join('; ')+'. Modifiers are not added into a good/bad score.':'This domain has no usable bound modifier; absent or unresolved evidence is not a good/bad judgment.');
   add('TEMPORAL_BOUNDARY','观察重点不等于事件确定性。保留本命条件、未知和较长周期背景，不拆成未计算的月份或日期。','A focus of observation does not establish event certainty. Retain natal conditions, unknowns and the longer context; do not infer uncalculated months or dates.');
  }else{
   const start=starters[id];rows.push({role:'DOMAIN_FUNCTION',text:t(...start)+' '+descriptions.join(' ')});
   rows.push({role:'CONDITIONAL_EXPRESSION',text:condition});rows.push({role:'COUNTERWEIGHT',text:counter});
   const contextText=context.filter(c=>!primary.includes(c)).slice(0,1).map(c=>describe(c)).join(' ');
   add('OBSERVATION',`${contextText}把这些条件与实际经历核对。证据不足的部分保持开放，不作为确定结论。`,`${contextText}Compare these conditions with lived experience. Insufficient evidence remains open rather than becoming a certain conclusion.`);
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
  sections.push({subjectId:s.subjectId,sectionId:id,locale,title:reg.title[locale],claims,brief,sourcePublicationIr:sourceIr,publicationIr,paragraphs:publicationIr.blocks.map(b=>b.prose),selectedComposition:{primary:usage.flatMap(u=>u.usable)[0]?.entityId||null},supportingEvidence:supporting,evidenceUtilisation:usage.map(({usable,...u})=>({...u,placements:u.placements.map(p=>({...p,selected:supporting.some(r=>r.placementId===p.placementId),reason:p.state!=='PRESENT'?p.reason:supporting.some(r=>r.placementId===p.placementId)?'ADMITTED_DIMENSION_USED':'RETAINED_STRUCTURAL_CONTEXT_NOT_SELECTED_FOR_THIS_SECTION'}))})),modifierResolution:txRows,optionalEvidence:{body:body?'PRESENT':'UNKNOWN',timing:layer?(focus?'PRESENT':'UNKNOWN'):'ABSENT',transformations:txRows.length?'PRESENT':'ABSENT'},unknowns:s.unknowns,editorialVersion:ZIWEI_PRODUCTION_COMPOSER_VERSION,humanDecision:null,productionAdmissionGranted:false});
 }
 return sections;
}
