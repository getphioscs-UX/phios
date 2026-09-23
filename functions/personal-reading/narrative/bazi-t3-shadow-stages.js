import {T3_SECTIONS} from './bazi-editorial-contract.js';
// Sequential admission is enforced server-side, not by hiding a browser button.
export async function checkBaziShadowStage({profileId,sectionKey,action,stagedProfiles,passed}){
 const missing=[];const pair=async(id,section)=>{for(const locale of ['en','zh-Hans'])if(!await passed(id,locale,section))missing.push({profileId:id,locale,sectionKey:section});};
 if(action!=='matrix-status'&&profileId==='BASELINE_NOW'&&sectionKey===T3_SECTIONS[0])return {allowed:true,stage:'BASELINE_S02'};
 await pair('BASELINE_NOW',T3_SECTIONS[0]);
 if(missing.length)return {allowed:false,stage:'BASELINE_S02',missing};
 const strata=Object.values(stagedProfiles);
 if(action!=='matrix-status'&&strata.includes(profileId)&&sectionKey===T3_SECTIONS[0])return {allowed:true,stage:'S02_EVIDENCE_STRATA'};
 for(const id of strata)await pair(id,T3_SECTIONS[0]);
 if(missing.length)return {allowed:false,stage:'S02_EVIDENCE_STRATA',missing};
 const current=T3_SECTIONS.indexOf(sectionKey);
 const required=action==='matrix-status'||profileId!=='BASELINE_NOW'?T3_SECTIONS:T3_SECTIONS.slice(0,current);
 for(const section of required)await pair('BASELINE_NOW',section);
 return missing.length?{allowed:false,stage:'SEQUENTIAL_SECTIONS',missing}:{allowed:true,stage:profileId==='BASELINE_NOW'&&action!=='matrix-status'?'SEQUENTIAL_SECTIONS':'FULL_MATRIX'};
}
