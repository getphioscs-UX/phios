import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';

export const ZWR_VFR_REPORT_IR_VERSION='ZWR-VFR-R1-VISUAL-REPORT-IR-v1';
export const ZWR_VFR_SECTION_IDS=Object.freeze(['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11']);

const FORBIDDEN=[
 /\bguaranteed\b|\bwill definitely\b|\bmust happen\b|一定(?:会|能|可以)|必然(?:会|发生|获得|成功|升职|发财)/iu,
 /\bdiagnos(?:e|is|ed)\b|诊断为|确诊|表示患有/u,
 /\b(?:you should|you must)\s+(?:buy|sell|invest|borrow)\b|你应该(?:买入|卖出|投资|借款)/iu,
 /Authoring Pack|semantic verifier|candidate state|claimRefs|sourceRefs|运行时系统|语义验证|权威包/iu
];

function stringsForLocale(localized){
 return [
  localized?.headline,localized?.subheadline,
  ...(localized?.keyInsights||[]).flatMap(x=>[x?.label,x?.text]),
  ...(localized?.interpretation||[]),
  localized?.diagramNarratives?.primary,
  localized?.diagramNarratives?.secondary
 ].filter(Boolean).map(String);
}
function sectionClaims(packSection){return new Set((packSection?.claims||[]).map(c=>c.claimId));}
export function buildZwrVfrProviderSchema(pack){
 const allRefs=[...new Set(pack.sections.flatMap(s=>s.claims.map(c=>c.claimId)))];
 const localized=locale=>{
  const zh=locale==='zhHans';
  return {
   type:'object',additionalProperties:false,
   required:['headline','subheadline','keyInsights','interpretation','diagramNarratives'],
   properties:{
    headline:{type:'string',minLength:1,maxLength:zh?24:50},
    subheadline:{type:'string',minLength:1,maxLength:zh?40:80},
    keyInsights:{type:'array',minItems:3,maxItems:3,items:{type:'object',additionalProperties:false,required:['label','text'],properties:{label:{type:'string',minLength:1,maxLength:zh?12:20},text:{type:'string',minLength:1,maxLength:zh?50:90}}}},
    interpretation:{type:'array',minItems:2,maxItems:2,items:{type:'string',minLength:20,maxLength:zh?100:180}},
    diagramNarratives:{type:'object',additionalProperties:false,required:['primary','secondary'],properties:{primary:{type:'string',minLength:1,maxLength:zh?35:70},secondary:{type:'string',minLength:1,maxLength:zh?35:70}}}
   }
  };
 };
 const thesis=locale=>{
  const zh=locale==='zhHans';
  return {type:'object',additionalProperties:false,required:['headline','summary'],properties:{headline:{type:'string',minLength:1,maxLength:zh?28:60},summary:{type:'string',minLength:1,maxLength:zh?120:220}}};
 };
 return {
  type:'object',additionalProperties:false,
  required:['reportThesis','sections','closingSummary'],
  properties:{
   reportThesis:{type:'object',additionalProperties:false,required:['zhHans','en'],properties:{zhHans:thesis('zhHans'),en:thesis('en')}},
   sections:{type:'array',minItems:10,maxItems:10,items:{type:'object',additionalProperties:false,required:['sectionId','authorityRefs','zhHans','en'],properties:{sectionId:{type:'string',enum:[...ZWR_VFR_SECTION_IDS]},authorityRefs:{type:'array',minItems:1,maxItems:8,items:{type:'string',enum:allRefs}},zhHans:localized('zhHans'),en:localized('en')}}},
   closingSummary:{type:'object',additionalProperties:false,required:['zhHans','en'],properties:{zhHans:{type:'array',minItems:3,maxItems:3,items:{type:'string',minLength:1,maxLength:60}},en:{type:'array',minItems:3,maxItems:3,items:{type:'string',minLength:1,maxLength:110}}}}
  }
 };
}
export async function validateZwrVfrProviderOutput({pack,output}={}){
 const reasons=[];
 if(!pack||pack.schemaVersion!=='ZWR-VFR-R1-COMPACT-AUTHORING-PACK-v1')throw Error('ZWR_VFR_GUARD_PACK_REQUIRED');
 if(!output||typeof output!=='object'||Array.isArray(output))return deepFreeze({accepted:false,reasons:['REPORT_IR_SCHEMA_INVALID']});
 const rows=Array.isArray(output.sections)?output.sections:[];
 const ids=rows.map(x=>x?.sectionId);
 if(rows.length!==10||new Set(ids).size!==10||ZWR_VFR_SECTION_IDS.some(id=>!ids.includes(id)))reasons.push('REPORT_IR_SECTION_SET_INVALID');
 for(const row of rows){
  const ps=pack.sections.find(s=>s.sectionId===row.sectionId);
  if(!ps){reasons.push('REPORT_IR_UNKNOWN_SECTION:'+String(row.sectionId));continue;}
  const allowed=sectionClaims(ps);
  if(!Array.isArray(row.authorityRefs)||!row.authorityRefs.length||row.authorityRefs.some(ref=>!allowed.has(ref)))reasons.push('INVALID_AUTHORITY_REF:'+row.sectionId);
  for(const [locale,localized] of [['zh-Hans',row.zhHans],['en',row.en]]){
   const body=stringsForLocale(localized).join('\n');
   if(!body.trim())reasons.push('REPORT_IR_TEXT_REQUIRED:'+row.sectionId+':'+locale);
   if(FORBIDDEN.some(re=>re.test(body)))reasons.push('FORBIDDEN_CUSTOMER_ASSERTION:'+row.sectionId+':'+locale);
   if((localized?.keyInsights||[]).length<3||(localized?.keyInsights||[]).length>5)reasons.push('REPORT_IR_INSIGHT_COUNT:'+row.sectionId+':'+locale);
   if((localized?.interpretation||[]).length<2||(localized?.interpretation||[]).length>3)reasons.push('REPORT_IR_INTERPRETATION_COUNT:'+row.sectionId+':'+locale);
  }
 }
 const seed={schemaVersion:'ZWR-VFR-R1-DETERMINISTIC-GUARD-v1',accepted:reasons.length===0,reasons:[...new Set(reasons)]};
 return deepFreeze({...seed,verificationDigest:await sha256Stable(seed)});
}
export async function createZwrVfrReportIr({pack,providerOutput,usage}={}){
 const guard=await validateZwrVfrProviderOutput({pack,output:providerOutput});
 if(!guard.accepted)throw Object.assign(new Error('ZWR_VFR_DETERMINISTIC_GUARD_REJECTED'),{details:guard});
 const seed={
  schemaVersion:ZWR_VFR_REPORT_IR_VERSION,
  methodId:'ZWR',
  localeMode:'BILINGUAL',
  subjectBinding:pack.subjectBinding,
  authorityDigest:pack.authorityDigest,
  reportThesis:providerOutput.reportThesis,
  sections:providerOutput.sections,
  closingSummary:providerOutput.closingSummary,
  providerUsage:usage,
  visualFirst:true,
  maxPhysicalPages:50,
  semanticAiReviewCalls:0
 };
 return deepFreeze({...seed,reportIrDigest:await sha256Stable(seed)});
}
export default Object.freeze({buildZwrVfrProviderSchema,validateZwrVfrProviderOutput,createZwrVfrReportIr,ZWR_VFR_REPORT_IR_VERSION});
