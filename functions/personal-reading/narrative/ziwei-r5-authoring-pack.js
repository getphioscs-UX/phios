import {buildZiweiContentDepthR3Sections} from './ziwei-production-composer-r3.js';
import {buildZiweiSynthesisIrR5,ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION} from './ziwei-professional-synthesis-r5.js';

export const ZIWEI_R5_AUTHORING_PACK_VERSION='ZIWEI-R5-AUTHORING-PACK-v1';
const NATURAL=new Set(['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11']);
const arr=v=>Array.isArray(v)?v:[];

function compactTiming(timing=[]){
 return arr(timing).map(t=>({
  layer:t.layer||null,
  role:t.role||null,
  focus:t.focus||null
 }));
}
function compactClaim(c){
 return Object.freeze({
  claimId:c.claimId,
  role:c.explanationRole,
  claimType:c.claimType,
  headline:c.headline||null,
  text:c.text,
  conditions:Object.freeze(arr(c.conditions)),
  counterweights:Object.freeze(arr(c.counterweights)),
  timing:Object.freeze(compactTiming(c.timing)),
  certainty:c.certainty,
  semanticOperators:Object.freeze(arr(c.semanticOperators)),
  sourceRefs:Object.freeze(arr(c.sourceRefs))
 });
}
function authoringContract(locale,sectionId){
 const zh=locale==='zh-Hans';
 return Object.freeze({
  mode:'CHATGPT_SOL_HUMAN_AUTHORED_CANDIDATE',
  sectionId,
  locale,
  factualAuthority:'ONLY_THIS_AUTHORING_PACK',
  modelRole:'WRITING_ONLY_NOT_CALCULATION_AUTHORITY',
  requiredShape:zh?[
   '先形成整节主论点，不逐颗星逐句解释',
   '把宫位主轴、同宫组合、宫位网络、四化与时序写成同一个综合结构',
   '保留建设条件、压力代价、反例与未知',
   '使用现实场景只能作为条件性比较，不得虚构客户经历',
   '不得新增本包没有提供的紫微规则、亮度、格局结果、月份或事件',
   '专业长文应像付费紫微详批，而不是方法说明书、治理报告或星曜字典'
  ]:[
   'Lead with a section thesis rather than star-by-star definitions',
   'Synthesize palace axis, same-palace composition, palace network, transformations and timing into one integrated reading',
   'Preserve constructive conditions, strain, counterexamples and unknowns',
   'Use lived scenes only as conditional comparisons, never invented biography',
   'Do not add Zi Wei rules, brightness, pattern outcomes, months or events absent from this pack',
   'Write like a paid professional Zi Wei reading, not a methodology memo, governance report or star glossary'
  ],
  targetDepth:sectionId==='S11'?(zh?'约 500–900 中文字，5–7 个完整长段':'about 300–600 English words in 5–7 substantial blocks'):(zh?'约 800–1500 中文字，6–8 个完整长段':'about 500–1000 English words in 6–8 substantial blocks'),
  forbidden:['NEW_METHOD_FACT','NEW_LIFE_EVENT','GUARANTEED_FUTURE_EVENT','DIAGNOSIS','FINANCIAL_RECOMMENDATION','HIDDEN_STATE_INFERENCE','STAR_GLOSSARY_AS_PRIMARY_STRUCTURE']
 });
}
export async function buildZiweiR5AuthoringPack({evidence,locale}={}){
 if(!['en','zh-Hans'].includes(locale))throw Error('ZIWEI_R5_AUTHORING_LOCALE_REQUIRED');
 const base=await buildZiweiContentDepthR3Sections({evidence,locale});
 const prior=[],sections=[];
 for(const section of base){
  if(!NATURAL.has(section.sectionId))continue;
  const synthesisIr=await buildZiweiSynthesisIrR5({evidence,section,locale,priorSynthesis:prior});
  prior.push(synthesisIr);
  sections.push(Object.freeze({
   sectionId:section.sectionId,
   title:section.title,
   locale,
   synthesisVersion:ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION,
   keyInsights:Object.freeze(arr(synthesisIr.keyInsights)),
   primaryPalaces:Object.freeze(arr(synthesisIr.primaryPalaces)),
   contextPalaces:Object.freeze(arr(synthesisIr.contextPalaces)),
   evidenceSummary:synthesisIr.evidenceSummary,
   claims:Object.freeze(arr(synthesisIr.claims).map(compactClaim)),
   authoringContract:authoringContract(locale,section.sectionId)
  }));
 }
 return Object.freeze({
  schemaVersion:ZIWEI_R5_AUTHORING_PACK_VERSION,
  work:'ZIWEI-R5-PROFESSIONAL-SYNTHESIS-AUTHORING',
  locale,
  sourceVersion:ZIWEI_PROFESSIONAL_SYNTHESIS_R5_VERSION,
  sectionCount:sections.length,
  sections:Object.freeze(sections),
  workflow:Object.freeze([
   'DETERMINISTIC_GOVERNED_EVIDENCE',
   'ZIWEI_R5_SYNTHESIS_IR',
   'CHATGPT_SOL_HUMAN_COLLABORATIVE_WRITING',
   'HUMAN_ACCEPT_OR_REJECT',
   'FREEZE_ACCEPTED_CANDIDATE',
   'DETERMINISTIC_PRODUCTION_ASSEMBLY'
  ]),
  apiKeyRequired:false,
  liveProviderRequired:false,
  productionAdmissionGranted:false
 });
}

export default Object.freeze({buildZiweiR5AuthoringPack});
