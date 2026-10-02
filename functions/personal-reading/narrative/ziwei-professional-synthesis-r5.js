import {buildZiweiContentDepthR3Sections,normalizeZiweiProductionEvidence,resolveZiweiProductionStar,ziweiPalaceLabel} from './ziwei-production-composer-r3.js';
import {ZIWEI_REPORT_SECTIONS,AUTHORITIES,PROHIBITED} from './ziwei-semantic-canon.js';
import {ZIWEI_PRO_R2_STAR_PROFILES_V2 as STAR_PROFILES,ZIWEI_PRO_R2_COMBINATION_RULES_V2 as COMBINATIONS,ZIWEI_PRO_R2_TRANSFORMATION_MODIFIERS as MODIFIERS,ziweiProR2LocaleValue as lv,ziweiProR2StarLabel} from '../../zi-wei-full-production/ziwei-professional-reading-r2-authority-v2.js';
import {createReportSectionNarrativeContract} from './report-section-contract.js';
import {buildReportSectionNarrativeBrief} from './report-section-brief.js';
import {composeReportSectionT3} from './report-section-t3-composer.js';
import {buildReportPublicationIrV2,assertPublicationIrV2Preservation} from './report-publication-ir-v2.js';

export const ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION='ZIWEI-PROFESSIONAL-SYNTHESIS-R5';
const NATURAL=new Set(['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11']);
const FIELD={S02:'decisionPattern',S03:'motivatingTendency',S04:'workExpression',S05:'resourceExpression',S06:'relationshipExpression',S07:'relationshipExpression',S08:'pressureMode',S09:'coreFunction',S10:'coreFunction'};
const arr=v=>Array.isArray(v)?v:[],uniq=v=>[...new Set(arr(v).filter(Boolean).map(String))],text=v=>String(v??'').trim();
const HEAD={
 S02:['命身共同形成从决定到落地的轴线','压力下核对速度、边界与责任是否脱节','身宫说明核心取向怎样进入现实关系'],
 S03:['内在恢复取决于标准、投入与停止条件','张力来自继续与退出之间的判断','恢复必须让注意力重新稳定'],
 S04:['事业主轴是重组能力怎样变成可持续成果','迁移与资源背景决定重建能否被承载','时序只放大议题，不预测职位'],
 S05:['财富要分开读取取得、分配、留存与选择空间','资源增加不等于容量增加','四化改变关注重点，不替代现实财务判断'],
 S06:['关系重点是互惠、位置、边界与修复','夫妻宫必须放回关系网络一起读取','压力下观察角色与责任是否僵化'],
 S07:['稳定支持来自功能分散','给予支持与接收支持是不同能力','责任归属清楚才能避免代偿'],
 S08:['压力读取关注负荷累积而非疾病','恢复同时取决于容量与撤退空间','医疗问题仍由医疗评估处理'],
 S09:['大限改变读取优先级但不改写本命','大限四化要作为一组修饰读取','长期主题通过重复情境核对'],
 S10:['流年只增加年度新强调','年度四化要组成年度主线','现实无差异时应降低年度解释权重'],
 S11:['先保护可用资源、边界与恢复空间','只选择少数现实决定验证','用30–90天复盘让现实修正解释']
};
const QUESTION={
 S02:['命宫与身宫怎样共同组织决定、责任与现实落地？','How do Life and Body jointly organize decisions, responsibility and lived implementation?'],
 S03:['内在满足、恢复与张力怎样共同运作？','How do inner satisfaction, recovery and tension operate together?'],
 S04:['官禄、迁移、命身与资源背景怎样共同形成事业价值与可持续交付？','How do Career, Travel, Life/Body and resource context combine into work value and sustainable delivery?'],
 S05:['财帛、田宅、事业与命宫怎样共同组织资源取得、分配、留存与选择空间？','How do Wealth, Property, Career and Life jointly organize acquisition, allocation, retention and optionality?'],
 S06:['夫妻宫与关系网络怎样共同组织互惠、边界与修复？','How do the Spouse palace and relationship network organize reciprocity, boundaries and repair?'],
 S07:['父母、兄弟、朋友与命宫怎样形成支持与责任网络？','How do Parents, Siblings, Friends and Life form a support and responsibility network?'],
 S08:['疾厄、福德与命宫怎样共同描述压力、容量与恢复？','How do Health, Wellbeing and Life jointly describe pressure, capacity and recovery?'],
 S09:['当前大限怎样重新排列整张盘的读取优先级？','How does the current Da Xian reorder whole-chart reading priority?'],
 S10:['当前流年怎样在本命与大限上形成年度新强调？','How does Liu Nian add annual emphasis over natal and Da Xian structure?'],
 S11:['整盘重新收拢后，现在最值得保护、调整与复盘的是什么？','After integrating the chart, what is most worth protecting, adjusting and reviewing now?']
};
function scope(sectionId,s){
 const reg=ZIWEI_REPORT_SECTIONS.find(x=>x.sectionId===sectionId),body=s.palaces.find(p=>p.isBodyPalace)?.palaceCode;
 if(sectionId==='S09'||sectionId==='S10'){
  const layer=sectionId==='S09'?'DA_XIAN':'LIU_NIAN',focus=s.timing.find(t=>t.layer===layer)?.focus?.natalDomainCode;
  return {primary:uniq([focus]),context:uniq(s.transformations.filter(t=>t.layer===layer).map(t=>t.palaceCode).filter(x=>x!==focus))};
 }
 const expand=list=>uniq(list.flatMap(c=>c==='BODY'?(body?[body]:[]):c==='ALL'?s.palaces.map(p=>p.palaceCode):[c]));
 return {primary:expand(reg.primaryPalaces),context:expand(reg.contextPalaces)};
}
function refs(s,codes){
 return uniq([...s.placements.filter(p=>codes.includes(p.palaceCode)).flatMap(p=>p.sourceRefs),
  ...s.relationships.filter(r=>codes.includes(r.from)||r.to.some(x=>codes.includes(x))).flatMap(r=>r.sourceRefs),
  ...s.transformations.filter(t=>codes.includes(t.palaceCode)).flatMap(t=>t.sourceRefs),...s.sourceRefs,...AUTHORITIES.semantic]);
}
function stars(s,code){return s.placements.filter(p=>p.palaceCode===code&&p.meaningAdmitted===true);}
function meanings(s,code,key,locale){return stars(s,code).map(p=>resolveZiweiProductionStar(p,key,locale)).filter(r=>r.state==='PRESENT');}
function combinationText(s,code,locale){
 const set=new Set(stars(s,code).map(p=>p.starCode));
 return COMBINATIONS.filter(r=>r.customerRuntimeAllowed===true&&r.stars.every(x=>set.has(x))).map(r=>lv(r.interaction,locale));
}
function networkText(s,primary,context,locale){
 const zh=locale==='zh-Hans',rows=[];
 for(const code of primary)for(const r of s.relationships.filter(x=>x.from===code)){
  const hit=r.to.filter(x=>context.includes(x));if(!hit.length)continue;
  const type=r.entityType==='OPPOSITION'?(zh?'对宫':'opposite'):r.entityType==='TRIAD'?(zh?'三方':'triad'):(zh?'夹宫':'flank');
  rows.push((zh?ziweiPalaceLabel(code,locale)+'通过'+type+'连接':ziweiPalaceLabel(code,locale)+' has a '+type+' link to ')+hit.map(x=>ziweiPalaceLabel(x,locale)).join(zh?'、':', '));
 }
 return zh?(rows.length?rows.join('；')+'。':'相关宫位仅作为共同阅读背景。')+'这些几何关系要求把相关生活领域一起阅读，但本身不证明支持、冲突或吉凶。':
  (rows.length?rows.join('; ')+'. ':'The related palaces remain shared reading context. ')+'These geometric links require the domains to be read together but do not by themselves prove support, conflict or fortune.';
}
function transformationText(s,codes,layers,locale){
 const zh=locale==='zh-Hans',rows=[];
 for(const t of s.transformations.filter(x=>codes.includes(x.palaceCode)&&layers.includes(x.layer))){
  const m=MODIFIERS[t.transformationCode],p=STAR_PROFILES[t.targetStarCode];if(!m||!p)continue;
  const layer=t.layer==='NATAL'?(zh?'本命':'natal'):t.layer==='DA_XIAN'?(zh?'大限':'Da Xian'):(zh?'流年':'Liu Nian');
  rows.push(zh?layer+'：'+ziweiPalaceLabel(t.palaceCode,locale)+'的'+ziweiProR2StarLabel(t.targetStarCode,locale)+'受'+lv(m.label,locale)+'修饰，重点为「'+lv(m.function,locale)+'」':
   layer+': '+ziweiProR2StarLabel(t.targetStarCode,locale)+' in '+ziweiPalaceLabel(t.palaceCode,locale)+' carries '+lv(m.label,locale)+', emphasizing '+lv(m.function,locale));
 }
 return rows.length?rows.join(zh?'；':'; '):(zh?'相关宫位没有新增可用四化修饰；未直接激活不构成好坏结论。':'No additional admitted transformation lands in the relevant palaces; non-activation is not a verdict.');
}
function expressionRows(s,codes,key,locale,limit=5){
 const out=[];for(const code of codes)for(const p of stars(s,code)){const r=resolveZiweiProductionStar(p,key,locale);if(r.state==='PRESENT')out.push({code,name:r.name,text:r.text});}
 return out.slice(0,limit);
}
function claim(s,sectionId,role,type,value,headline,sourceRefs,extra={}){
 const operators=uniq(extra.operators||['CONTEXTUALIZES']);
 return Object.freeze({id:'ZWR-R5:'+s.subjectKey+':'+sectionId+':'+type,claimId:'ZWR-R5:'+s.subjectKey+':'+sectionId+':'+type,claimType:type,explanationRole:role,text:text(value),headline,sourceRefs:Object.freeze(uniq(sourceRefs)),semanticOperators:Object.freeze(operators),conditions:Object.freeze(arr(extra.conditions).map(String)),counterweights:Object.freeze(arr(extra.counterweights).map(String)),timing:Object.freeze(arr(extra.timing)),observableSignals:Object.freeze([]),certainty:'SYMBOLIC_CONDITIONAL',license:Object.freeze({allowsObservedReality:false,allowedSemanticOperators:Object.freeze(operators)})});
}
function buildNormal(s,section,locale){
 const id=section.sectionId,zh=locale==='zh-Hans',sc=scope(id,s),codes=uniq([...sc.primary,...sc.context]),sourceRefs=refs(s,codes),field=FIELD[id]||'coreFunction',head=HEAD[id];
 const primaryNames=sc.primary.map(x=>ziweiPalaceLabel(x,locale)),contextNames=sc.context.map(x=>ziweiPalaceLabel(x,locale));
 const palaceRows=[...sc.primary,...sc.context].map(code=>{
  const ms=meanings(s,code,field,locale),combos=combinationText(s,code,locale),name=ziweiPalaceLabel(code,locale);
  const base=ms.length?(zh?name+'同时承载「'+ms.map(x=>x.text).join('」与「')+'」':name+' carries '+ms.map(x=>'“'+x.text+'”').join(' alongside ')):(zh?name+'目前只保留结构位置':name+' remains structural context');
  return base+(combos.length?(zh?'；已获准同宫组合进一步限定为：'+combos.join('；'):'; admitted same-palace composition further constrains this as '+combos.join(' ')):'');
 });
 const high=expressionRows(s,sc.primary,'highExpression',locale),low=expressionRows(s,sc.primary,'strainedExpression',locale);
 const dx=s.timing.find(t=>t.layer==='DA_XIAN'),yr=s.timing.find(t=>t.layer==='LIU_NIAN'),timingRequired=['S02','S04','S05','S09','S10'].includes(id);
 const thesis=zh?'以'+primaryNames.join('、')+'为主轴'+(contextNames.length?'，并把'+contextNames.join('、')+'纳入同一读取网络':'')+'。这一节要回答：'+QUESTION[id][0]:
  'Read '+primaryNames.join(', ')+' as the focal axis'+(contextNames.length?', with '+contextNames.join(', ')+' in the same network':'')+'. The section asks: '+QUESTION[id][1];
 const composition=palaceRows.join(zh?'。':' ');
 const conditions=zh?'建设性表达需要这些条件共同可用：'+high.map(x=>ziweiPalaceLabel(x.code,locale)+'／'+x.name+'：'+x.text).join('；')+'。不能把其中一条独立写成固定人格。':
  'Constructive expression depends on these conditions being available together: '+high.map(x=>ziweiPalaceLabel(x.code,locale)+' / '+x.name+': '+x.text).join('; ')+'. No single condition is a fixed personality verdict.';
 const counter=zh?'压力升高时核对这些反向表现：'+low.map(x=>ziweiPalaceLabel(x.code,locale)+'／'+x.name+'：'+x.text).join('；')+'。它们是条件性张力，不是必然结果。':
  'Under strain, test these counter-expressions: '+low.map(x=>ziweiPalaceLabel(x.code,locale)+' / '+x.name+': '+x.text).join('; ')+'. They are conditional tensions, not guaranteed outcomes.';
 const timing=timingRequired?(zh?'本命仍是基线；当前大限焦点为'+(dx?.focus?.natalDomainCode?ziweiPalaceLabel(dx.focus.natalDomainCode,locale):'未解析')+'，流年焦点为'+(yr?.focus?.natalDomainCode?ziweiPalaceLabel(yr.focus.natalDomainCode,locale):'未解析')+'。'+transformationText(s,codes,id==='S09'?['DA_XIAN']:id==='S10'?['LIU_NIAN']:['NATAL','DA_XIAN','LIU_NIAN'],locale)+'。时间层只改变读取优先级与表达条件。':
  'Natal structure remains the baseline; current Da Xian foregrounds '+(dx?.focus?.natalDomainCode?ziweiPalaceLabel(dx.focus.natalDomainCode,locale):'an unresolved domain')+', while Liu Nian foregrounds '+(yr?.focus?.natalDomainCode?ziweiPalaceLabel(yr.focus.natalDomainCode,locale):'an unresolved domain')+'. '+transformationText(s,codes,id==='S09'?['DA_XIAN']:id==='S10'?['LIU_NIAN']:['NATAL','DA_XIAN','LIU_NIAN'],locale)+'. Timing changes reading priority and expression conditions only.'):null;
 const reality=zh?'现实核对时，不问单颗星准不准，而问：在'+primaryNames.join('、')+'相关场景里，哪些条件让这些功能能够协同，哪些情境让责任、资源、边界或恢复开始失配？保留不符合的经验作为反例。':
  'For lived comparison, do not ask whether one star is “accurate.” Ask which situations in '+primaryNames.join(', ')+' let these functions work together, and which make responsibility, resources, boundaries or recovery fall out of alignment. Keep counterexamples.';
 const nav=zh?'先保护仍然有效的条件，再选择一个与'+primaryNames.join('、')+'有关的现实决定，明确责任、资源、边界与复盘时间；如果现实没有出现预期差异，就降低解释权重。':
  'Protect workable conditions, then choose one real decision linked to '+primaryNames.join(', ')+', clarify responsibility, resources, boundaries and a review window, and reduce the reading’s weight if the expected differences do not appear.';
 const claims=[
  claim(s,id,'MEANING','SECTION_THESIS',thesis,head[0],sourceRefs),
  claim(s,id,'STRUCTURE','PALACE_STAR_SYNTHESIS',composition,head[0],sourceRefs,{operators:['CO_OCCURS_WITH','CONTEXTUALIZES']}),
  claim(s,id,'MEANING','PALACE_NETWORK_SYNTHESIS',networkText(s,sc.primary,sc.context,locale),head[1],sourceRefs),
  claim(s,id,'CONDITIONS','CONSTRUCTIVE_CONDITIONS',conditions,head[1],sourceRefs,{conditions:high.map(x=>x.text)}),
  claim(s,id,'COUNTERWEIGHTS','STRAINED_COUNTERWEIGHTS',counter,head[2],sourceRefs,{counterweights:low.map(x=>x.text)}),
  ...(timing?[claim(s,id,'TIMING_RELEVANCE','TIMING_SYNTHESIS',timing,head[2],sourceRefs,{timing:s.timing.filter(t=>['DA_XIAN','LIU_NIAN'].includes(t.layer)),operators:['TIMING_RELEVANCE','CONTEXTUALIZES']})]:[]),
  claim(s,id,'OBSERVABLE_EXPRESSION','REALITY_COMPARISON',reality,head[2],sourceRefs,{operators:['QUESTION','CONTEXTUALIZES']}),
  claim(s,id,'NAVIGATION','BOUNDED_NAVIGATION',nav,head[2],sourceRefs,{operators:['QUESTION','CONTEXTUALIZES']})
 ];
 return Object.freeze({version:ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION,sectionId:id,locale,primaryPalaces:Object.freeze(sc.primary),contextPalaces:Object.freeze(sc.context),keyInsights:Object.freeze(head),evidenceSummary:Object.freeze({palaces:codes.length,placements:s.placements.filter(p=>codes.includes(p.palaceCode)).length,relationships:s.relationships.filter(r=>codes.includes(r.from)||r.to.some(x=>codes.includes(x))).length,transformations:s.transformations.filter(t=>codes.includes(t.palaceCode)).length}),claims:Object.freeze(claims),reflectionQuestions:Object.freeze([])});
}
function buildNavigation(s,locale,prior){
 const zh=locale==='zh-Hans',head=HEAD.S11,sourceRefs=uniq(prior.flatMap(x=>x.claims.flatMap(c=>c.sourceRefs))),themes=prior.filter(x=>['S02','S04','S05','S06','S08','S09','S10'].includes(x.sectionId)).map(x=>x.keyInsights[0]);
 const timing=prior.filter(x=>['S09','S10'].includes(x.sectionId)).flatMap(x=>x.claims.filter(c=>c.explanationRole==='TIMING_RELEVANCE').flatMap(c=>c.timing));
 const rows=[
  ['STRUCTURE','WHOLE_CHART_PRIORITIES',zh?'整盘反复出现的优先主题包括：'+themes.join('；')+'。这些主题保持各自来源，不合并成强弱分数。':'Recurring whole-chart priorities include: '+themes.join('; ')+'. Keep their separate sources rather than collapsing them into one score.'],
  ['MEANING','INTEGRATED_MEANING',zh?'整盘导航要同时核对决策边界、责任资源、关系互惠、压力恢复，以及时序是否真的让某些问题比平时更显眼。':'Whole-chart navigation checks decision boundaries, responsibility/resources, reciprocity, recovery and whether timing truly makes some questions more salient.'],
  ['CONDITIONS','WHAT_TO_PROTECT',zh?'先保护现实中已经证明可用的资源、边界、恢复空间与互惠关系；命盘符号不是主动破坏有效结构的理由。':'Protect resources, boundaries, recovery room and reciprocal relationships already shown to work in reality; a chart symbol is not a reason to dismantle functioning structure.'],
  ['COUNTERWEIGHTS','WHAT_NOT_TO_OVERCOMMIT',zh?'当资源、决定权、责任归属或恢复空间仍不清楚时，不扩大承诺；不要把“能承担”写成“应该继续承担”。':'Do not expand commitments while resources, authority, responsibility ownership or recovery room remain unclear; do not turn “can carry” into “should keep carrying.”'],
  ['TIMING_RELEVANCE','TIMING_PRIORITY',zh?'大限与流年只改变观察优先级；长期反复问题与今年新增情境必须分开记录。':'Da Xian and Liu Nian only change observation priority; recurring long-cycle questions and genuinely new annual circumstances must be recorded separately.'],
  ['OBSERVABLE_EXPRESSION','REVIEW_WINDOW',zh?'选择一到两个现实决定作为30–90天观察窗口，记录条件变化、实际结果与反例；反例用于修正解释权重。':'Choose one or two real decisions for a 30–90 day window and record changed conditions, actual outcomes and counterexamples; counterexamples revise the reading’s weight.'],
  ['NAVIGATION','BOUNDED_NAVIGATION',zh?'最后只形成有限导航：下一步决定、责任人、可用资源、不可跨越的边界与复盘日期。命盘提供观察框架，现实拥有最终修正权。':'End with bounded navigation only: next decision, responsibility owner, available resources, non-negotiable boundaries and review date. The chart supplies an observation frame; reality retains final revision authority.']
 ];
 const claims=rows.map((r,i)=>claim(s,'S11',r[0],r[1],r[2],head[Math.min(i,2)],sourceRefs,{timing:r[0]==='TIMING_RELEVANCE'?timing:[],operators:r[0]==='TIMING_RELEVANCE'?['TIMING_RELEVANCE','CONTEXTUALIZES']:r[0]==='OBSERVABLE_EXPRESSION'||r[0]==='NAVIGATION'?['QUESTION','CONTEXTUALIZES']:['CONTEXTUALIZES']}));
 return Object.freeze({version:ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION,sectionId:'S11',locale,primaryPalaces:Object.freeze([]),contextPalaces:Object.freeze([]),keyInsights:Object.freeze(head),evidenceSummary:Object.freeze({priorSections:prior.length}),claims:Object.freeze(claims),reflectionQuestions:Object.freeze([])});
}
export async function buildZiweiSynthesisIrR5({evidence,section,locale,priorSynthesis=[]}={}){
 const s=normalizeZiweiProductionEvidence(evidence);
 if(!NATURAL.has(section?.sectionId))throw Error('ZIWEI_R5_SYNTHESIS_SECTION_NOT_SUPPORTED');
 return section.sectionId==='S11'?buildNavigation(s,locale,priorSynthesis):buildNormal(s,section,locale);
}
function units(v,l){const x=text(v);return l==='en'?x.split(/\s+/).filter(Boolean).length:[...x.replace(/\s/g,'')].length;}
function sentences(v,l){const x=text(v);return l==='en'?(x.match(/[.!?](?:\s|$)/g)||[]).length:(x.match(/[。！？]/g)||[]).length;}
export function evaluateZiweiR5Editorial(blocks,{locale,sectionId}={}){
 const rows=arr(blocks),nav=sectionId==='S11',reasons=[],total=rows.reduce((n,r)=>n+units(r?.text,locale),0),min=locale==='en'?(nav?280:480):(nav?430:760),max=locale==='en'?(nav?650:1050):(nav?950:1650);
 if(rows.length<(nav?5:6)||rows.length>(nav?7:8))reasons.push('R5_BLOCK_COUNT');
 if(total<min)reasons.push('R5_LONG_FORM_TOO_THIN');if(total>max)reasons.push('R5_LONG_FORM_TOO_DENSE');
 if(rows.some(r=>units(r?.text,locale)<(locale==='en'?45:70)))reasons.push('R5_BLOCK_TOO_THIN');
 if(rows.some(r=>sentences(r?.text,locale)<2))reasons.push('R5_BLOCK_NOT_DEVELOPED');
 const joined=rows.map(r=>text(r?.text)).join('\n'),glossary=locale==='en'?(joined.match(/\b[A-Z][A-Za-z ]{1,18}\s+brings\b/g)||[]).length:(joined.match(/[^。；\n]{0,14}呈现「/g)||[]).length;
 if(glossary>1)reasons.push('R5_STAR_GLOSSARY_PATTERN');
 if(!nav&&!/(三方|对宫|夹宫|network|opposite|triad|flank)/iu.test(joined))reasons.push('R5_NETWORK_SYNTHESIS_MISSING');
 if(['S02','S04','S05','S09','S10'].includes(sectionId)&&!/(大限|流年|Da Xian|Liu Nian)/iu.test(joined))reasons.push('R5_TIMING_SYNTHESIS_MISSING');
 return Object.freeze({accepted:reasons.length===0,reasons:Object.freeze(reasons),blockCount:rows.length,totalUnits:total,minTotal:min,maxTotal:max,unitSystem:locale==='en'?'WORDS':'CJK_CHARS',glossaryHits:glossary});
}
function contractFor(section,ir,locale){
 const q=QUESTION[section.sectionId],outcome=locale==='zh-Hans'?'形成整合宫位、组合、网络、四化与时序的专业长文读取。':'Produce a professional long-form reading integrating palaces, compositions, networks, transformations and timing.';
 return createReportSectionNarrativeContract({methodId:'ZWR',sectionKey:section.sectionId,customerQuestion:locale==='zh-Hans'?q[0]:q[1],customerOutcome:outcome,requiredClaimRoles:uniq(ir.claims.map(c=>c.explanationRole)),optionalClaimRoles:['CONDITIONS','COUNTERWEIGHTS','OBSERVABLE_EXPRESSION','TIMING_RELEVANCE','NAVIGATION'],timingPolicy:'WHEN_AUTHORITY_PRESENT',boundaryPolicy:'KEEP_UNCERTAINTY_LOCAL_NOT_DISCLAIMER_HEAVY',realityBridgePolicy:'QUESTIONS_AND_COMPARISONS_ONLY_UNLESS_OBSERVED_REALITY_SOURCE_ADMITTED',forbiddenInferenceClasses:['PROFESSION_PREDICTION','WEALTH_EVENT_PREDICTION','MARRIAGE_EVENT_PREDICTION','HEALTH_EVENT_PREDICTION',...PROHIBITED],depthTarget:{minimumMeaningfulUnits:0,maximumMeaningfulUnits:0,calibrationState:'ZIWEI_R5_HUMAN_REVIEW_REQUIRED'}});
}
export async function buildZiweiProfessionalSynthesisR5({evidence,locale,registry,env={},fetcher,providerAdapters=null,requestIdPrefix='ZIWEI-R5'}={}){
 if(!['en','zh-Hans'].includes(locale))throw Error('ZIWEI_R5_LOCALE_REQUIRED');
 const base=await buildZiweiContentDepthR3Sections({evidence,locale}),out=[],prior=[];
 for(const section of base){
  if(!NATURAL.has(section.sectionId)){out.push({...section,editorialVersion:ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION,professionalSynthesis:{status:'NOT_REQUESTED',reason:'STRUCTURAL_OR_APPENDIX_SECTION'}});continue;}
  const synthesisIr=await buildZiweiSynthesisIrR5({evidence,section,locale,priorSynthesis:prior});prior.push(synthesisIr);
  const contract=contractFor(section,synthesisIr,locale);
  const brief=await buildReportSectionNarrativeBrief({contract,richClaimIr:synthesisIr,locale,sourceAuthorityVersion:ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION,styleIntent:{tone:'PROFESSIONAL_ZIWEI_PERSONAL_READING',depth:'LONG_FORM_PROFESSIONAL_SYNTHESIS',customerReadable:true,explanationFirst:true,methodStyleProfile:'ZIWEI_PROFESSIONAL_SYNTHESIS_R5',sectionSpecific:true,avoidGlossaryProse:true,synthesizePalaceNetwork:true,synthesizeTransformations:true,timingLayersStayDistinct:true}});
  const composition=await composeReportSectionT3({brief,registry,env,fetcher,providerAdapters,requestId:requestIdPrefix+'-'+section.sectionId+'-'+locale,timeoutMs:180000});
  const candidate=composition.status==='PASS'?arr(composition.candidate?.blocks):[],quality=candidate.length?evaluateZiweiR5Editorial(candidate,{locale,sectionId:section.sectionId}):Object.freeze({accepted:false,reasons:Object.freeze(['R5_COMPOSER_NOT_PASS'])});
  const status=composition.status==='PASS'&&quality.accepted?'PASS':composition.status==='PASS'?'EDITORIAL_REJECTED':composition.status;
  let publicationIr=section.publicationIr,paragraphs=section.paragraphs;
  if(candidate.length){
   publicationIr=await buildReportPublicationIrV2({methodId:'ZWR',reportVersion:ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION,sectionKey:section.sectionId,locale,brief,candidate:{blocks:candidate},semanticOwner:'ZIWEI_R5_SYNTHESIS_IR',compositionOwner:ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION,snapshotLineage:{subjectId:section.subjectId,inputFingerprint:(evidence?.structured||evidence)?.inputFingerprint||null}});
   if(!assertPublicationIrV2Preservation({publicationIr,brief}).accepted)throw Error('ZIWEI_R5_PUBLICATION_IR_PRESERVATION_FAILED');
   paragraphs=publicationIr.blocks.map(b=>b.prose);
  }
  out.push({...section,paragraphs,publicationIr,synthesisIr,editorialVersion:ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION,professionalSynthesis:{status,composerStatus:composition.status,providerCalled:composition.internalOnly?.providerCalled===true,provider:composition.internalOnly?.provider||null,model:composition.internalOnly?.model||null,actualTier:composition.internalOnly?.actualTier||null,verificationAccepted:composition.verification?.accepted===true,editorialQuality:quality,providerAttemptCount:composition.internalOnly?.providerAttemptCount||0,transportCalls:composition.internalOnly?.transportCalls||0,semanticReviewCalls:composition.internalOnly?.semanticReviewCalls||0,compositionDigest:composition.compositionDigest||null,fallbackReason:composition.internalOnly?.fallbackReason||null,usageRecord:composition.usageRecord||null}});
 }
 return out;
}
export default Object.freeze({buildZiweiSynthesisIrR5,buildZiweiProfessionalSynthesisR5,evaluateZiweiR5Editorial});
