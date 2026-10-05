import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';

export const ZWR_VFR_FIVE_CALL_MANUSCRIPT_VERSION='ZWR-VFR-R1-FIVE-CALL-DEEP-MANUSCRIPT-v1';
export const ZWR_VFR_FIVE_CALL_BATCHES=Object.freeze([
 Object.freeze(['S02','S03']),
 Object.freeze(['S04','S05']),
 Object.freeze(['S06','S07']),
 Object.freeze(['S08','S09']),
 Object.freeze(['S10','S11'])
]);

const HARD_FORBIDDEN=[
 /\bguaranteed\b|\bwill definitely\b|\bmust happen\b|一定(?:会|能|可以)|必然(?:会|发生|获得|成功|升职|发财)/iu,
 /Authoring Pack|semantic verifier|candidate state|claimRefs|sourceRefs|authorityRefs|运行时系统|语义验证|权威包/iu
];
function hasForbiddenMedicalAssertion(text){
 const t=String(text||'');
 const zh=t.match(/(?:诊断为|确诊|表示患有)/gu)||[];
 for(const hit of zh){
  const i=t.indexOf(hit),pre=t.slice(Math.max(0,i-8),i);
  if(!/(?:不|并不|不能|不可|并非|不等于|无法|勿|不应)\s*$/u.test(pre))return true;
 }
 const en=[...t.matchAll(/\bdiagnos(?:e|es|ed|is|ing)\b/giu)];
 for(const m of en){
  const pre=t.slice(Math.max(0,m.index-24),m.index);
  if(!/(?:does\s+not|do\s+not|did\s+not|cannot|can't|is\s+not|not\s+a|should\s+not|must\s+not)\s*$/iu.test(pre))return true;
 }
 return false;
}
function forbiddenReason(text){
 const t=String(text||'');
 const hard=HARD_FORBIDDEN.find(re=>re.test(t));
 if(hard)return 'HARD_ASSERTION';
 if(hasForbiddenMedicalAssertion(t))return 'MEDICAL_ASSERTION';
 return null;
}

function paragraphSchema(zh){
 return {type:'string',minLength:zh?45:90,maxLength:zh?420:760};
}
function localeSchema(locale){
 const zh=locale==='zhHans',p=paragraphSchema(zh);
 return {
  type:'object',additionalProperties:false,
  required:['sectionThesis','structuralMechanism','livedScenarios','constructiveExpression','pressureDistortion','counterweight','timingOverlay','realityNavigation'],
  properties:{
   sectionThesis:{type:'string',minLength:zh?30:70,maxLength:zh?220:420},
   structuralMechanism:{type:'array',minItems:2,maxItems:2,items:{type:'string',minLength:zh?45:90,maxLength:zh?220:420}},
   livedScenarios:{type:'array',minItems:3,maxItems:3,items:{type:'string',minLength:zh?30:65,maxLength:zh?170:320}},
   constructiveExpression:{type:'array',minItems:1,maxItems:1,items:{type:'string',minLength:zh?45:90,maxLength:zh?220:420}},
   pressureDistortion:{type:'array',minItems:1,maxItems:1,items:{type:'string',minLength:zh?45:90,maxLength:zh?220:420}},
   counterweight:{type:'array',minItems:1,maxItems:1,items:{type:'string',minLength:zh?45:90,maxLength:zh?220:420}},
   timingOverlay:{type:'array',minItems:1,maxItems:1,items:{type:'string',minLength:zh?35:75,maxLength:zh?190:360}},
   realityNavigation:{type:'array',minItems:1,maxItems:1,items:{type:'string',minLength:zh?40:85,maxLength:zh?210:390}}
  }
 };
}
export function buildZwrFiveCallBatchSchema(batchPack){
 const ids=batchPack.sections.map(s=>s.sectionId);
 const refs=[...new Set(batchPack.sections.flatMap(s=>s.claims.map(c=>c.claimId)))];
 return {
  type:'object',additionalProperties:false,
  required:['sections'],
  properties:{
   sections:{type:'array',minItems:ids.length,maxItems:ids.length,items:{
    type:'object',additionalProperties:false,
    required:['sectionId','authorityRefs','zhHans','en'],
    properties:{
     sectionId:{type:'string',enum:ids},
     authorityRefs:{type:'array',minItems:1,maxItems:10,items:{type:'string',enum:refs}},
     zhHans:localeSchema('zhHans'),
     en:localeSchema('en')
    }
   }}
  }
 };
}
function allStrings(x){
 if(typeof x==='string')return [x];
 if(Array.isArray(x))return x.flatMap(allStrings);
 if(x&&typeof x==='object')return Object.values(x).flatMap(allStrings);
 return [];
}
export async function validateZwrFiveCallBatch({batchPack,output}={}){
 const reasons=[];
 if(!batchPack||!Array.isArray(batchPack.sections)||!batchPack.sections.length)throw Error('ZWR_FIVE_CALL_BATCH_PACK_REQUIRED');
 const expected=new Set(batchPack.sections.map(s=>s.sectionId));
 const rows=Array.isArray(output?.sections)?output.sections:[];
 if(rows.length!==expected.size||rows.some(r=>!expected.has(r?.sectionId))||new Set(rows.map(r=>r.sectionId)).size!==expected.size)reasons.push('FIVE_CALL_SECTION_SET_INVALID');
 for(const row of rows){
  const ps=batchPack.sections.find(s=>s.sectionId===row.sectionId);
  const allowed=new Set((ps?.claims||[]).map(c=>c.claimId));
  if(!Array.isArray(row.authorityRefs)||!row.authorityRefs.length||row.authorityRefs.some(x=>!allowed.has(x)))reasons.push('FIVE_CALL_AUTHORITY_REF_INVALID:'+row.sectionId);
  for(const locale of ['zhHans','en']){
   const copy=row?.[locale];
   const strings=allStrings(copy);
   if(!strings.length)reasons.push('FIVE_CALL_COPY_REQUIRED:'+row.sectionId+':'+locale);
   for(const t of strings){
    const why=forbiddenReason(t);
    if(why)reasons.push('FIVE_CALL_FORBIDDEN_ASSERTION:'+row.sectionId+':'+locale+':'+why+':'+t.slice(0,180));
   }
   for(const k of ['structuralMechanism','livedScenarios','constructiveExpression','pressureDistortion','counterweight','timingOverlay','realityNavigation']){
    if(!Array.isArray(copy?.[k])||!copy[k].length)reasons.push('FIVE_CALL_FIELD_REQUIRED:'+row.sectionId+':'+locale+':'+k);
   }
  }
 }
 const seed={schemaVersion:'ZWR-VFR-R1-FIVE-CALL-GUARD-v1',accepted:reasons.length===0,reasons:[...new Set(reasons)]};
 return deepFreeze({...seed,verificationDigest:await sha256Stable(seed)});
}
export function projectFiveCallManuscriptToReportSections({pack,manuscriptSections}={}){
 const by=new Map(manuscriptSections.map(s=>[s.sectionId,s]));
 return pack.sections.map(ps=>{
  const row=by.get(ps.sectionId);
  if(!row)throw Error('FIVE_CALL_SECTION_MISSING:'+ps.sectionId);
  const project=(locale,src)=>({
   headline:locale==='zhHans'?ps.titleZh:ps.titleEn,
   subheadline:locale==='zhHans'?ps.purposeZh:ps.purposeEn,
   keyInsights:[
    {label:locale==='zhHans'?'结构主轴':'Structural axis',text:src.sectionThesis},
    {label:locale==='zhHans'?'现实场景':'Lived scenarios',text:src.livedScenarios.join(' ')},
    {label:locale==='zhHans'?'压力与制衡':'Pressure & counterweight',text:[...src.pressureDistortion,...src.counterweight].join(' ')}
   ],
   interpretation:[
    ...src.structuralMechanism,
    ...src.constructiveExpression,
    ...src.livedScenarios,
    ...src.pressureDistortion,
    ...src.counterweight,
    ...src.timingOverlay,
    ...src.realityNavigation
   ],
   manuscript:src
  });
  return {
   sectionId:ps.sectionId,
   authorityRefs:row.authorityRefs,
   zhHans:project('zhHans',row.zhHans),
   en:project('en',row.en)
  };
 });
}
export default Object.freeze({
 ZWR_VFR_FIVE_CALL_MANUSCRIPT_VERSION,
 ZWR_VFR_FIVE_CALL_BATCHES,
 buildZwrFiveCallBatchSchema,
 validateZwrFiveCallBatch,
 projectFiveCallManuscriptToReportSections
});
