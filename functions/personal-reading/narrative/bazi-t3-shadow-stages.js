import {T3_SECTIONS} from './bazi-editorial-contract.js';
// Addendum F: machine PASS cannot substitute for digest-bound human prose review.
export async function checkBaziShadowStage({profileId,sectionKey,action,stagedProfiles,passed,humanAccepted=async()=>false,parityAccepted=async()=>false}){
 const missing=[];
 if(!T3_SECTIONS.includes(sectionKey))return {allowed:false,stage:'UNKNOWN_SECTION',missing};
 const baselinePair=async section=>{for(const locale of ['en','zh-Hans'])if(!await passed('BASELINE_NOW',locale,section)||!await humanAccepted('BASELINE_NOW',locale,section))missing.push({profileId:'BASELINE_NOW',locale,sectionKey:section,required:'DIGEST_BOUND_HUMAN_EDITORIAL_ACCEPTANCE'});};
 const generating=!action||action==='generate';
 if(generating&&profileId==='BASELINE_NOW'){
  for(const section of T3_SECTIONS.slice(0,T3_SECTIONS.indexOf(sectionKey)))await baselinePair(section);
  return {allowed:!missing.length,stage:sectionKey===T3_SECTIONS[0]?'BASELINE_S02':'BASELINE_SECTION_HUMAN_REVIEW',missing};
 }
 for(const section of T3_SECTIONS)await baselinePair(section);
 if(missing.length)return {allowed:false,stage:'ALL_BASELINE_SECTIONS_HUMAN_REVIEW',missing};
 const strata=Object.values(stagedProfiles);
 if(generating&&strata.includes(profileId))return {allowed:true,stage:'EVIDENCE_STRATA',missing};
 for(const id of strata)for(const section of T3_SECTIONS)for(const locale of ['en','zh-Hans'])if(!await passed(id,locale,section))missing.push({profileId:id,sectionKey:section,locale,required:'MACHINE_PASS'});
 if(missing.length)return {allowed:false,stage:'EVIDENCE_STRATA',missing};
 if(action==='parity')return {allowed:true,stage:'BILINGUAL_PARITY',missing};
 for(const id of ['BASELINE_NOW',...strata])for(const section of T3_SECTIONS)if(!await parityAccepted(id,section))missing.push({profileId:id,sectionKey:section,required:'BILINGUAL_PARITY'});
 return {allowed:!missing.length,stage:'FULL_MATRIX',missing};
}
