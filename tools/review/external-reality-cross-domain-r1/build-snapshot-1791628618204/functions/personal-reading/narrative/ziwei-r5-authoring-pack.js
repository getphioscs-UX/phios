import {buildZiweiContentDepthR3Sections,normalizeZiweiProductionEvidence} from './ziwei-production-composer-r3.js';
import {buildZiweiSynthesisIrR5,ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION} from './ziwei-professional-synthesis-r5.js';
import {ZIWEI_PRO_R2_STAR_PROFILES_V2 as STAR_PROFILES,ZIWEI_PRO_R2_COMBINATION_RULES_V2 as COMBINATIONS,ZIWEI_PRO_R2_TRANSFORMATION_MODIFIERS as MODIFIERS,ziweiProR2LocaleValue as lv,ziweiProR2StarLabel,ziweiProR2PalaceLabel} from '../../zi-wei-full-production/ziwei-professional-reading-r2-authority-v2.js';
import {ZIWEI_ADMITTED_PATTERN_RULE_REGISTRY} from '../../zi-wei-full-production/ziwei-pattern-rule-authority-v1.js';
import {STAR_STATE_VOCABULARY,BRANCH_ZH,STAR_CLASS} from '../../zi-wei-full-production/ziwei-structural-registry.js';

export const ZIWEI_R5_AUTHORING_PACK_VERSION='ZIWEI-R5-AUTHORING-PACK-v2';
const NATURAL=new Set(['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11']);
const arr=v=>Array.isArray(v)?v:[];

function compactTiming(timing=[]){
 return arr(timing).map(t=>({layer:t.layer||null,role:t.role||null,focus:t.focus||null}));
}
function compactClaim(c){
 return Object.freeze({
  claimId:c.claimId,role:c.explanationRole,claimType:c.claimType,headline:c.headline||null,text:c.text,
  conditions:Object.freeze(arr(c.conditions)),counterweights:Object.freeze(arr(c.counterweights)),
  timing:Object.freeze(compactTiming(c.timing)),certainty:c.certainty,
  semanticOperators:Object.freeze(arr(c.semanticOperators)),sourceRefs:Object.freeze(arr(c.sourceRefs))
 });
}
function stateLabel(p,locale){
 if(!p?.state)return null;
 return locale==='zh-Hans'?(STAR_STATE_VOCABULARY[p.state]?.zh||p.state):p.state;
}
function starTechnical(s,palaceCode,locale){
 const palace=s.palaces.find(x=>x.palaceCode===palaceCode);
 return s.placements.filter(p=>p.palaceCode===palaceCode).map(p=>{
  const profile=STAR_PROFILES[p.starCode]||null,d=profile?.dimensions||{};
  return Object.freeze({
   starCode:p.starCode,label:ziweiProR2StarLabel(p.starCode,locale),
   starClass:p.starClass||STAR_CLASS[p.starCode]||null,
   stateCode:p.state||null,stateLabel:stateLabel(p,locale),
   stateAuthority:p.stateAuthority||null,stateKnown:Boolean(p.state),
   palaceCode,palaceLabel:ziweiProR2PalaceLabel(palaceCode,locale),
   branch:palace?.branch||null,branchLabel:locale==='zh-Hans'?(BRANCH_ZH[palace?.branch]||palace?.branch):palace?.branch||null,
   coreFunction:lv(d.coreFunction,locale),motivatingTendency:lv(d.motivatingTendency,locale),
   decisionPattern:lv(d.decisionPattern,locale),relationshipExpression:lv(d.relationshipExpression,locale),
   resourceExpression:lv(d.resourceExpression,locale),workExpression:lv(d.workExpression,locale),
   pressureMode:lv(d.pressureMode,locale),highExpression:lv(d.highExpression,locale),
   strainedExpression:lv(d.strainedExpression,locale),boundary:lv(profile?.boundary,locale)
  });
 });
}
function combinationsForPalace(s,palaceCode,locale){
 const codes=new Set(s.placements.filter(p=>p.palaceCode===palaceCode).map(p=>p.starCode));
 return COMBINATIONS.filter(r=>r.customerRuntimeAllowed===true&&r.stars.every(code=>codes.has(code))).map(r=>Object.freeze({
  combinationId:r.combinationId,label:lv(r.label,locale),stars:Object.freeze(arr(r.stars)),
  interaction:lv(r.interaction,locale),patternQualificationCreated:r.patternQualificationCreated===true
 }));
}
function relationshipRows(s,codes,locale){
 return s.relationships.filter(r=>codes.includes(r.from)||arr(r.to).some(x=>codes.includes(x))).map(r=>Object.freeze({
  entityType:r.entityType,from:r.from,fromLabel:ziweiProR2PalaceLabel(r.from,locale),
  to:Object.freeze(arr(r.to)),toLabels:Object.freeze(arr(r.to).map(x=>ziweiProR2PalaceLabel(x,locale))),
  topologyOnly:r.topologyOnly===true,semanticOperator:r.semanticOperator||null
 }));
}
function transformationRows(s,codes,locale){
 return s.transformations.filter(t=>codes.includes(t.palaceCode)).map(t=>{
  const m=MODIFIERS[t.transformationCode]||{};
  return Object.freeze({
   layer:t.layer,palaceCode:t.palaceCode,palaceLabel:ziweiProR2PalaceLabel(t.palaceCode,locale),
   targetStarCode:t.targetStarCode,targetStarLabel:ziweiProR2StarLabel(t.targetStarCode,locale),
   transformationCode:t.transformationCode,label:lv(m.label,locale),
   function:lv(m.function,locale),boundary:lv(m.boundary,locale)
  });
 });
}
function patternRows(s,codes){
 const byCode=new Map(ZIWEI_ADMITTED_PATTERN_RULE_REGISTRY.rules.map(r=>[r.patternCode,r]));
 return arr(s.patterns).filter(p=>arr(p.palaceCodes).some(c=>codes.includes(c))).map(p=>{
  const rule=byCode.get(p.patternCode)||null;
  return Object.freeze({
   patternCode:p.patternCode,labelZh:rule?.labelZh||p.patternCode,
   palaceCodes:Object.freeze(arr(p.palaceCodes)),
   admissionState:rule?.admissionState||'HUMAN_ADMITTED',
   qualificationOnly:true,outcomeTextIncluded:false,sourceClaimId:rule?.sourceClaimId||null
  });
 });
}
function palaceTechnical(s,code,locale){
 const p=s.palaces.find(x=>x.palaceCode===code);
 return Object.freeze({
  palaceCode:code,label:ziweiProR2PalaceLabel(code,locale),
  branch:p?.branch||null,branchLabel:locale==='zh-Hans'?(BRANCH_ZH[p?.branch]||p?.branch):p?.branch||null,
  isLifePalace:p?.isLifePalace===true,isBodyPalace:p?.isBodyPalace===true,
  stars:Object.freeze(starTechnical(s,code,locale)),
  combinations:Object.freeze(combinationsForPalace(s,code,locale))
 });
}
function buildWholeChartTechnicalSnapshot(s,locale){
 return Object.freeze({
  palaces:Object.freeze(s.palaces.map(p=>palaceTechnical(s,p.palaceCode,locale))),
  timing:Object.freeze(compactTiming(s.timing)),
  transformations:Object.freeze(transformationRows(s,s.palaces.map(p=>p.palaceCode),locale)),
  qualifiedPatterns:Object.freeze(patternRows(s,s.palaces.map(p=>p.palaceCode))),
  unknowns:Object.freeze(arr(s.unknowns))
 });
}
function authoringContract(locale,sectionId){
 const zh=locale==='zh-Hans';
 return Object.freeze({
  mode:'CHATGPT_SOL_HUMAN_AUTHORED_CANDIDATE',sectionId,locale,
  factualAuthority:'ONLY_THIS_AUTHORING_PACK',modelRole:'WRITING_ONLY_NOT_CALCULATION_AUTHORITY',
  requiredShape:zh?[
   '先用紫微斗数术语建立命盘主轴：宫位、主星、身宫、三方四正、四化、时序',
   '星曜名称与宫位名称必须在正文中保持可见，不能全部翻译成普通心理文章',
   '先形成整节主论点，再把星曜组合与宫位网络写成同一个综合结构',
   '已知庙旺平陷状态可以写；未知状态必须明确保持未知，不得补推',
   '已成立格局只能写“资格成立”和本包提供的结构意义，不补传统富贵吉凶结果',
   '保留建设条件、压力代价、反例与未知',
   '现实场景只能作为条件性比较，不得虚构客户经历',
   '不得新增本包没有提供的紫微规则、月份或事件',
   '专业长文必须像付费紫微斗数详批，而不是方法说明书、治理报告或普通心理文章'
  ]:[
   'Establish the Zi Wei technical axis first: palaces, main stars, Body palace, San Fang Si Zheng, transformations and timing',
   'Keep star and palace names visibly present in the prose rather than translating everything into generic psychology',
   'Lead with a section thesis, then synthesize star combinations and palace network into one integrated reading',
   'Known brightness/state may be used; unknown state must remain unknown',
   'Qualified patterns may be named only as qualifications with the supplied structural meaning, never imported traditional outcome promises',
   'Preserve constructive conditions, strain, counterexamples and unknowns',
   'Use lived scenes only as conditional comparisons, never invented biography',
   'Do not add Zi Wei rules, months or events absent from this pack',
   'Write like a paid professional Zi Wei reading, not a methodology memo, governance report or generic psychology article'
  ],
  targetDepth:sectionId==='S11'?(zh?'约 500–900 中文字，5–7 个完整长段':'about 300–600 English words in 5–7 substantial blocks'):(zh?'约 900–1800 中文字，6–9 个完整长段':'about 600–1200 English words in 6–9 substantial blocks'),
  forbidden:['NEW_METHOD_FACT','NEW_LIFE_EVENT','GUARANTEED_FUTURE_EVENT','DIAGNOSIS','FINANCIAL_RECOMMENDATION','HIDDEN_STATE_INFERENCE','UNADMITTED_BRIGHTNESS','UNADMITTED_PATTERN_OUTCOME','GENERIC_PSYCHOLOGY_AS_PRIMARY_STRUCTURE']
 });
}
export async function buildZiweiR5AuthoringPack({evidence,locale}={}){
 if(!['en','zh-Hans'].includes(locale))throw Error('ZIWEI_R5_AUTHORING_LOCALE_REQUIRED');
 const s=normalizeZiweiProductionEvidence(evidence);
 const base=await buildZiweiContentDepthR3Sections({evidence,locale});
 const prior=[],sections=[];
 for(const section of base){
  if(!NATURAL.has(section.sectionId))continue;
  const synthesisIr=await buildZiweiSynthesisIrR5({evidence,section,locale,priorSynthesis:prior});prior.push(synthesisIr);
  const codes=[...new Set([...arr(synthesisIr.primaryPalaces),...arr(synthesisIr.contextPalaces)])];
  const technicalEvidence=Object.freeze({
   palaces:Object.freeze(codes.map(code=>palaceTechnical(s,code,locale))),
   relationships:Object.freeze(relationshipRows(s,codes,locale)),
   transformations:Object.freeze(transformationRows(s,codes,locale)),
   qualifiedPatterns:Object.freeze(patternRows(s,codes)),
   timing:Object.freeze(compactTiming(s.timing)),
   unknowns:Object.freeze(arr(s.unknowns).filter(u=>!u.placementId||s.placements.some(p=>p.entityId===u.placementId&&codes.includes(p.palaceCode))))
  });
  sections.push(Object.freeze({
   sectionId:section.sectionId,title:section.title,locale,synthesisVersion:ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION,
   keyInsights:Object.freeze(arr(synthesisIr.keyInsights)),primaryPalaces:Object.freeze(arr(synthesisIr.primaryPalaces)),
   contextPalaces:Object.freeze(arr(synthesisIr.contextPalaces)),evidenceSummary:synthesisIr.evidenceSummary,
   technicalEvidence,claims:Object.freeze(arr(synthesisIr.claims).map(compactClaim)),
   authoringContract:authoringContract(locale,section.sectionId)
  }));
 }
 return Object.freeze({
  schemaVersion:ZIWEI_R5_AUTHORING_PACK_VERSION,work:'ZIWEI-R5-PROFESSIONAL-SYNTHESIS-AUTHORING',locale,
  subjectBinding:Object.freeze({subjectId:s.subjectId,subjectKey:s.subjectKey,inputFingerprint:s.inputFingerprint,targetContext:s.targetContext||null,sourceDigests:Object.freeze({...s.sourceDigests})}),
  sourceVersion:ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION,sectionCount:sections.length,
  wholeChartTechnicalSnapshot:buildWholeChartTechnicalSnapshot(s,locale),
  sections:Object.freeze(sections),
  workflow:Object.freeze(['DETERMINISTIC_GOVERNED_EVIDENCE','ZIWEI_TECHNICAL_AUTHORING_VIEW','ZIWEI_R5_SYNTHESIS_IR','CHATGPT_SOL_HUMAN_COLLABORATIVE_WRITING','HUMAN_ACCEPT_OR_REJECT','FREEZE_ACCEPTED_CANDIDATE','DETERMINISTIC_PRODUCTION_ASSEMBLY']),
  apiKeyRequired:false,liveProviderRequired:false,productionAdmissionGranted:false
 });
}
export default Object.freeze({buildZiweiR5AuthoringPack});
