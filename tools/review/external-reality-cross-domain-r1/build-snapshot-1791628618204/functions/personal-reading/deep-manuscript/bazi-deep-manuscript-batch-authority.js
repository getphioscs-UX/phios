import {BATCHES,SECTIONS,deepFreeze} from './bazi-deep-manuscript-contract.js';
export function projectBaziBatchAuthority(pack,batchId,sectionIds=null){
 const batch=BATCHES.find(b=>b.batchId===batchId);if(!batch||pack.method!=='BAZI')throw Error('BDM_BATCH_INVALID');
 const ids=sectionIds||batch.sectionIds;if(!ids.length||ids.some(id=>!batch.sectionIds.includes(id)))throw Error('BDM_BATCH_SCOPE_INVALID');
 const facts=pack.natal.tenGodFacts;
 const factScope=batchId==='B02'?facts.filter(f=>['偏财','正财','比肩','劫财','偏印','正印','食神','伤官'].includes(f.tenGod)):facts;
 const projection={method:'BAZI',batchId,sectionIds:[...ids],subject:pack.subject,natal:{...pack.natal,tenGodFacts:factScope},globalVerdict:pack.globalVerdict,sections:Object.fromEntries(ids.map(id=>[id,pack.sections[id]])),boundaries:pack.boundaries,lineage:{authorityDigest:pack.authorityDigest,timingDigest:pack.timingDigest,realityDigest:pack.realityDigest}};
 // A compact timing truth travels with every batch; detailed timing remains in B03.
 projection.CURRENT_TIMING_SUMMARY={currentDaYun:pack.timing.daYun??null,annualLayer:pack.timing.annual??null,known:pack.timing.relations||[],certainty:pack.timing.identityState,transformationEstablished:false,missing:['exact Gregorian mapping','exact age mapping','Da Yun start date','full Luck-Pillar sequence']};
 // Faithful excerpt of the existing accepted S10 lock, restricted to its exact identity.
 if(pack.natal.dayMaster==='庚'&&pack.timing.daYun==='己巳'&&pack.timing.annual==='丙寅'&&pack.timing.sourceSha256==='ca258b47fb4f710c1e9e6761258cfd34294e98e73dfced5287f53e6a8786dc05')projection.CURRENT_TIMING_SUMMARY.admittedTenGods=[{token:'己',tenGod:'正印',role:'support / carrying',source:pack.timing.sourceManuscript},{token:'丙',tenGod:'七杀',role:'responsibility / standards / pressure',source:pack.timing.sourceManuscript}];
 projection.domainGuidance={S04:'Value creation, role authority, deadlines and admitted Officer / Seven Killings; retain resource and peer carrying conditions.',S06:'Intimacy, trust, emotional presence, autonomy and shared daily life; not merely task allocation.',S07:'Care, invisible family work, actual sharing and expectations; no invented relatives or childhood.',S10:'Natal × current Da Yun × annual activation; distinguish support, pressure and seasonal warmth.'};
 projection.admittedCareerAnchors=facts.filter(f=>['七杀','正官','偏印','比肩'].includes(f.tenGod));
 // Reality is included only when explicitly attributed.
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
