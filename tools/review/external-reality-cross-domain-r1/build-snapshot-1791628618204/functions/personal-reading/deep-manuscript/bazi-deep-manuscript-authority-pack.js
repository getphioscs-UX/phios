import {SECTIONS,VERSIONS,digest,deepFreeze} from './bazi-deep-manuscript-contract.js';
// Consumes already admitted outputs; never computes a new chart or verdict.
export async function projectBaziDeepManuscriptAuthority({authority,timing,subject={},reality=null,sourceLineage}={}){
 const chart=authority?.chart;
 if(!chart?.pillars||!chart.dayMaster||!Array.isArray(chart.tenGodFacts)||!chart.finalStructuralVerdictR2||!sourceLineage?.authority||!sourceLineage?.timing)throw Error('BDM_GOVERNED_AUTHORITY_REQUIRED');
 if(!['year','month','day','hour'].every(k=>typeof chart.pillars[k]==='string'&&chart.pillars[k].length===2)||chart.pillars.day[0]!==chart.dayMaster)throw Error('BDM_AUTHORITY_IDENTITY_MISMATCH');
 if(timing?.natal&&Object.keys(chart.pillars).some(k=>chart.pillars[k]!==timing.natal[k]))throw Error('BDM_TIMING_IDENTITY_MISMATCH');
 const natal=structuredClone({pillars:chart.pillars,dayMaster:chart.dayMaster,monthBranch:chart.monthBranch,tenGodFacts:chart.tenGodFacts,relationships:chart.relationships||[],unresolvedAuthority:chart.unresolvedAuthority||{}});
 const globalVerdict=structuredClone(chart.finalStructuralVerdictR2);
 const boundaries={...structuredClone(authority.editorialAuthority||{}),noInventedBiography:true,noDeterministicEvents:true,noNewCalculations:true,unknownRemainsUnknown:true,customerFacingProfessionalNote:false};
 const pack={schemaVersion:VERSIONS.authority,method:'BAZI',subject:structuredClone(subject),natal,globalVerdict,timing:structuredClone(timing||{identityState:'UNKNOWN',relations:[]}),reality:structuredClone(reality),sections:Object.fromEntries(SECTIONS.map(s=>[s.sectionId,{purpose:{zh:s.zh,en:s.en},authority:structuredClone(authority.sections?.[s.sectionId]||{}),openState:authority.sections?.[s.sectionId]?'SUPPLIED':'NATAL_ONLY_NO_PERSONAL_BIOGRAPHY'}])),boundaries,lineage:structuredClone(sourceLineage)};
 pack.authorityDigest=await digest({natal,globalVerdict,sections:pack.sections,boundaries});pack.timingDigest=await digest(pack.timing);pack.realityDigest=await digest(pack.reality);pack.digest=await digest(pack);
 return deepFreeze(pack);
}
