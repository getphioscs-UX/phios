import {BATCHES,SECTIONS,deepFreeze} from './bazi-deep-manuscript-contract.js';
export function projectBaziBatchAuthority(pack,batchId,sectionIds=null){
 const batch=BATCHES.find(b=>b.batchId===batchId);if(!batch||pack.method!=='BAZI')throw Error('BDM_BATCH_INVALID');
 const ids=sectionIds||batch.sectionIds;if(!ids.length||ids.some(id=>!batch.sectionIds.includes(id)))throw Error('BDM_BATCH_SCOPE_INVALID');
 const facts=pack.natal.tenGodFacts;
 const factScope=batchId==='B02'?facts.filter(f=>['偏财','正财','比肩','劫财','偏印','正印','食神','伤官'].includes(f.tenGod)):facts;
 const projection={method:'BAZI',batchId,sectionIds:[...ids],subject:pack.subject,natal:{...pack.natal,tenGodFacts:factScope},globalVerdict:pack.globalVerdict,sections:Object.fromEntries(ids.map(id=>[id,pack.sections[id]])),boundaries:pack.boundaries,lineage:{authorityDigest:pack.authorityDigest,timingDigest:pack.timingDigest,realityDigest:pack.realityDigest}};
 // Timing is owned by CALL 3; reality is included only when explicitly attributed.
 if(batchId==='B03')projection.timing=pack.timing;
 if(pack.reality?.sections)projection.reality=Object.fromEntries(ids.filter(id=>pack.reality.sections[id]).map(id=>[id,pack.reality.sections[id]]));
 return deepFreeze(projection);
}
export function buildPriorSectionSummary(pack,batchId){
 const index=BATCHES.findIndex(b=>b.batchId===batchId);if(index<0)throw Error('BDM_BATCH_INVALID');if(index===0)return '';
 const v=pack.globalVerdict;
 const lines=[`Already established: Day Master ${pack.natal.dayMaster}; month command ${pack.natal.monthBranch}.`,v.dayMasterStrength?.verdictZh,v.primaryPattern?.formationPathZh,v.primaryPattern?.qualifier,v.usefulGod?.primary?.role,v.relationship?.verdict].filter(Boolean);
 if(index===2)lines.push('Career, wealth, intimacy and family have already been covered. Explain only pressure, long-term function and admitted current timing.');
 const text=lines.join('\n');if(text.length>1800)throw Error('BDM_PRIOR_SUMMARY_TOO_LARGE');return text;
}
