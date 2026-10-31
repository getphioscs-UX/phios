import {STEMS,BRANCHES,SEASON_BY_MONTH_BRANCH} from '../../bzr-full-production/bazi-structural-registry.js';
import {digest} from '../deep-manuscript/bazi-deep-manuscript-contract.js';
import {assertBaziNativeAuthorityComplete} from '../../report-delivery/bazi-customer-native-inputs.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
// Cross-field validation of existing native outputs, never a second calculator.
export async function assertBaziPublicationConsistency(pack,source){
 if(!source?.chart||!source.tenGods||!source.relationships||!source.projection)fail('BZR_PUBLICATION_NATIVE_SOURCE_REQUIRED');
 const {chart,tenGods,relationships,projection}=source;
 if(await digest(projection)!==await digest(source.execution?.canonicalProjection))fail('BZR_PUBLICATION_EXECUTION_SNAPSHOT_MISMATCH');
 const time=source.execution.execution.partialExecution.coreResults.find(r=>r.output?.trueSolarTime)?.output,input=source.input;
 if(!time||time.recordedCivilTime.localDate!==input?.birthDate||time.recordedCivilTime.localTime!==input.birthTime||time.timezone.timezoneId!==input.timezone.iana||time.coordinate.longitude!==input.birthPlace.longitude||time.coordinate.latitude!==input.birthPlace.latitude)fail('BZR_PUBLICATION_TIME_SOURCE_MISMATCH');
 if(pack.subject.birthDate!==input.birthDate||pack.subject.birthTime!==input.birthTime)fail('BZR_PUBLICATION_COVER_INPUT_MISMATCH');
 assertBaziNativeAuthorityComplete({chart,tenGods,relationships,projection:pack.natal});
 if(chart.sourceProjection.projectionId!==projection.projectionId||pack.natal.dayMaster!==chart.dayMaster.zh||pack.natal.monthBranch!==chart.monthCommand.branch.zh||pack.natal.monthBranch!==pack.natal.pillars.month[1])fail('BZR_PUBLICATION_CROSS_FIELD_IDENTITY');
 if(chart.monthCommand.season!==SEASON_BY_MONTH_BRANCH[chart.monthCommand.branch.code])fail('BZR_PUBLICATION_SEASON_MISMATCH');
 const hidden=pack.natal.tenGodFacts.filter(f=>f.position.endsWith('_BRANCH_HIDDEN'));
 for(const position of ['year','month','day','hour']){
  const branch=Object.values(BRANCHES).find(x=>x.zh===pack.natal.pillars[position][1]);
  const expected=branch.hiddenStems.map(x=>STEMS[x].zh),actual=hidden.filter(x=>x.position===position.toUpperCase()+'_BRANCH_HIDDEN').map(x=>x.token);
  if(JSON.stringify(expected)!==JSON.stringify(actual))fail('BZR_PUBLICATION_HIDDEN_STEM_MISMATCH');
 }
 const visible=chart.fiveElementInventory.visibleStems,hiddenCounts=chart.fiveElementInventory.hiddenStemsUnweighted;
 const inventory=Object.fromEntries(Object.keys(visible).map(e=>[e,visible[e]+hiddenCounts[e]]));
 const tenGodRecords=pack.natal.tenGodFacts.filter(f=>f.position!=='DAY_STEM');
 if(Object.values(inventory).reduce((a,b)=>a+b,0)!==4+hidden.length||tenGodRecords.length!==3+hidden.length)fail('BZR_PUBLICATION_INVENTORY_CONSERVATION');
 return {version:'BZR-PUBLICATION-CONSISTENCY-1',sourceDigest:await digest(source),projectionId:projection.projectionId,chartDigest:chart.chartDigest,tenGodDigest:tenGods.tenGodDigest,pillars:pack.natal.pillars,dayMaster:pack.natal.dayMaster,tenGodCounts:tenGodRecords.reduce((o,f)=>(o[f.tenGod]=(o[f.tenGod]||0)+1,o),{}),monthBranch:chart.monthCommand.branch.zh,season:chart.monthCommand.season,inventoryDefinition:'VISIBLE_STEMS_PLUS_HIDDEN_STEMS_UNWEIGHTED',visibleStemCount:4,hiddenStemCount:hidden.length,totalStemOccurrences:4+hidden.length,separateBranchCount:4,weighted:false,tenGodOccurrencesExcludingDayMaster:tenGodRecords.length,inventory,timeBasis:{recordedCivilTime:time.recordedCivilTime,coordinate:time.coordinate,timezone:time.timezone,trueSolarTime:time.trueSolarTime,policy:time.lineage,solarCalendar:time.solarCalendar}};
}

export function assertBaziPublicationDiagramConsistency(ir){
 const c=ir.consistency,diagrams=ir.technical.diagrams,d1=diagrams.find(d=>d.id==='D01'),d2=diagrams.find(d=>d.id==='D02'),d3=diagrams.find(d=>d.id==='D03');
 if(d1.nodes.some((n,i)=>n.value!==c.pillars[['year','month','day','hour'][i]])||ir.identity.dayMaster!==c.dayMaster)fail('BZR_PUBLICATION_PILLAR_RENDER_MISMATCH');
 if(d2.nodes.some(n=>n.value!==c.inventory[n.element])||!d2.caption.zh.includes(c.monthBranch+'月'))fail('BZR_PUBLICATION_ELEMENT_RENDER_MISMATCH');
 if(d3.nodes.some(n=>n.value!==(c.tenGodCounts[n.label.split(' / ')[0]]||0)||n.visible+n.hidden!==n.value))fail('BZR_PUBLICATION_TEN_GOD_RENDER_MISMATCH');
 return true;
}

// Complete, paired paragraph partition. No ranking, truncation or empty tail page.
export function partitionBaziPublicationUnits(units,profile){
 if(!units?.length)fail('BZR_PUBLICATION_NO_APPROVED_BODY');
 const sizes=units.map(u=>Math.max(...profile.locales.map(l=>u[l].text.length/profile.bodyBudget[l])));
 if(sizes.some(x=>x>1))fail('BZR_PUBLICATION_SOURCE_UNIT_EXCEEDS_PAGE');
 const n=units.length;let solution;
 for(let pages=1;pages<=n;pages++){
  const target=sizes.reduce((a,b)=>a+b,0)/pages,memo=new Map();
  const solve=(i,k)=>{if(k===0)return i===n?{cost:0,groups:[]}:null;const key=i+':'+k;if(memo.has(key))return memo.get(key);let best=null;
   for(let end=i+1;end<=n-k+1;end++){const part=units.slice(i,end);if(profile.locales.some(l=>part.reduce((s,u)=>s+u[l].text.length,0)>profile.bodyBudget[l]))break;const rest=solve(end,k-1);if(!rest)continue;const size=sizes.slice(i,end).reduce((a,b)=>a+b,0),cost=(size-target)**2+rest.cost;if(!best||cost<best.cost)best={cost,groups:[part,...rest.groups]};}memo.set(key,best);return best;};
  solution=solve(0,pages);if(solution)break;
 }
 if(!solution||solution.groups.some(g=>!g.length))fail('BZR_PUBLICATION_PARTITION_FAILED');
 return solution.groups;
}
