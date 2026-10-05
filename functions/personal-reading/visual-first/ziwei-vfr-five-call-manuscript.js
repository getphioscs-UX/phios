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

function localeManuscriptSchema(locale){
 const zh=locale==='zhHans';
 return {
  type:'string',
  minLength:zh?700:1600,
  maxLength:zh?2200:5200,
  description:zh
   ?'Write one coherent publication-quality Chinese Zi Wei Dou Shu chapter in 6-9 substantial paragraphs. Integrate structural mechanism, concrete lived situations, constructive expression, pressure distortion, counterweights, timing where admitted, and section-specific reality navigation naturally. Do not use headings or bullet lists inside the manuscript.'
   :'Write one coherent publication-quality English Zi Wei Dou Shu chapter in 6-9 substantial paragraphs, semantically equivalent to the Chinese but naturally written in English. Integrate structural mechanism, concrete lived situations, constructive expression, pressure distortion, counterweights, timing where admitted, and section-specific reality navigation naturally. Do not use headings or bullet lists inside the manuscript.'
 };
}
export function buildZwrFiveCallBatchSchema(batchPack){
 const ids=batchPack.sections.map(s=>s.sectionId);
 return {
  type:'object',additionalProperties:false,
  required:['sections'],
  properties:{
   sections:{type:'array',minItems:ids.length,maxItems:ids.length,items:{
    type:'object',additionalProperties:false,
    required:['sectionId','zhHansManuscript','enManuscript'],
    properties:{
     sectionId:{type:'string',enum:ids},
     zhHansManuscript:localeManuscriptSchema('zhHans'),
     enManuscript:localeManuscriptSchema('en')
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
 const split=t=>String(t||'').split(/\n\s*\n/u).map(x=>x.trim()).filter(Boolean);
 return pack.sections.map(ps=>{
  const row=by.get(ps.sectionId);
  if(!row)throw Error('FIVE_CALL_SECTION_MISSING:'+ps.sectionId);
  const project=(locale,text)=>{
   const paragraphs=split(text);
   return {
    headline:locale==='zhHans'?ps.titleZh:ps.titleEn,
    subheadline:locale==='zhHans'?ps.purposeZh:ps.purposeEn,
    keyInsights:[],
    interpretation:paragraphs,
    manuscript:text
   };
  };
  return {
   sectionId:ps.sectionId,
   authorityRefs:ps.claims.map(c=>c.claimId),
   zhHans:project('zhHans',row.zhHansManuscript),
   en:project('en',row.enManuscript)
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
