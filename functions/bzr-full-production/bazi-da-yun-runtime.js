import {sha256,stableSerialize} from '../method-runtime/shared-calculation-runtime.js';
import {
  STEMS,BRANCHES,STEM_COMBINATIONS,BRANCH_SIX_COMBINATIONS,BRANCH_CLASHES,
  BRANCH_HARMS,BRANCH_BREAKS,THREE_HARMONIES,THREE_MEETINGS,
  THREE_PUNISHMENT_GROUPS,SELF_PUNISHMENT_BRANCHES,tenGodFor
} from './bazi-structural-registry.js';

export const BAZI_DA_YUN_STRUCTURAL_SCHEMA='PHI-OS-BAZI-DA-YUN-STRUCTURAL-IR-v1.0.0';
export const BAZI_DA_YUN_STRUCTURAL_RUNTIME_VERSION='1.0.0';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value};
const pairKey=(a,b)=>[a,b].sort().join('|');
const pairSet=defs=>new Set(defs.map(x=>pairKey(x[0],x[1])));
const STEM_COMBO=pairSet(STEM_COMBINATIONS),BRANCH_COMBO=pairSet(BRANCH_SIX_COMBINATIONS),CLASH=pairSet(BRANCH_CLASHES),HARM=pairSet(BRANCH_HARMS),BREAK=pairSet(BRANCH_BREAKS);
function fail(code){const e=new Error(code);e.code=code;throw e;}
function parsePillar(value){
  if(typeof value!=='string')fail('BAZI_FP_W7_LUCK_CYCLE_PILLAR_VALUE_REQUIRED');
  const m=/^([A-Z]+)-([A-Z]+)$/.exec(value.trim());if(!m)fail('BAZI_FP_W7_LUCK_CYCLE_PILLAR_FORMAT_INVALID');
  const stem=STEMS[m[1]],branch=BRANCHES[m[2]];if(!stem||!branch)fail('BAZI_FP_W7_LUCK_CYCLE_PILLAR_CODE_INVALID');
  return {stem,branch};
}
function pairRelations(cycle,natal){
  const out=[],sp=pairKey(cycle.stem.code,natal.stem.code),bp=pairKey(cycle.branch.code,natal.branch.code);
  if(cycle.stem.code===natal.stem.code)out.push({type:'STEM_REPEAT',members:[cycle.stem.code,natal.stem.code]});
  if(STEM_COMBO.has(sp))out.push({type:'STEM_COMBINATION',members:[cycle.stem.code,natal.stem.code],transformationEstablished:false});
  if(cycle.branch.code===natal.branch.code)out.push({type:'BRANCH_REPEAT',members:[cycle.branch.code,natal.branch.code]});
  if(BRANCH_COMBO.has(bp))out.push({type:'BRANCH_SIX_COMBINATION',members:[cycle.branch.code,natal.branch.code],transformationEstablished:false});
  if(CLASH.has(bp))out.push({type:'BRANCH_CLASH',members:[cycle.branch.code,natal.branch.code]});
  if(HARM.has(bp))out.push({type:'BRANCH_HARM',members:[cycle.branch.code,natal.branch.code]});
  if(BREAK.has(bp))out.push({type:'BRANCH_BREAK',members:[cycle.branch.code,natal.branch.code]});
  if(bp===pairKey('ZI','MAO'))out.push({type:'BRANCH_PUNISHMENT_PAIR',members:[cycle.branch.code,natal.branch.code]});
  if(cycle.branch.code===natal.branch.code&&SELF_PUNISHMENT_BRANCHES.includes(cycle.branch.code))out.push({type:'BRANCH_SELF_PUNISHMENT',members:[cycle.branch.code,natal.branch.code]});
  return out.map(x=>({...x,natalPosition:natal.position,sourceAuthorityState:'W3_STRUCTURAL_RELATION_PREDECESSOR_NO_TRANSFORMATION_VERDICT'}));
}
function groupRelations(cycle,chart){
  const natalCodes=new Set(chart.pillars.map(x=>x.branch.code)),out=[];
  for(const d of THREE_HARMONIES){if(d.branches.includes(cycle.branch.code)&&d.branches.every(x=>x===cycle.branch.code||natalCodes.has(x)))out.push({type:'BRANCH_THREE_HARMONY_WITH_DA_YUN',members:d.branches,element:d.element,transformationEstablished:false});}
  for(const d of THREE_MEETINGS){if(d.branches.includes(cycle.branch.code)&&d.branches.every(x=>x===cycle.branch.code||natalCodes.has(x)))out.push({type:'BRANCH_THREE_MEETING_WITH_DA_YUN',members:d.branches,element:d.element,transformationEstablished:false});}
  for(const d of THREE_PUNISHMENT_GROUPS){if(d.branches.includes(cycle.branch.code)&&d.branches.every(x=>x===cycle.branch.code||natalCodes.has(x)))out.push({type:'BRANCH_PUNISHMENT_GROUP_WITH_DA_YUN',members:d.branches,groupCode:d.code});}
  return out.map(x=>({...x,natalPositions:chart.pillars.filter(p=>x.members.includes(p.branch.code)).map(p=>p.position),sourceAuthorityState:'W3_STRUCTURAL_RELATION_PREDECESSOR_NO_TRANSFORMATION_VERDICT'}));
}
function normalizeCycle(c,chart){
  if(c?.code!=='LUCK_CYCLE'||c.certainty!=='DETERMINISTIC'||!Number.isInteger(c.cycleNumber)||c.cycleNumber<1||typeof c.startAge!=='number'||typeof c.endAge!=='number'||!(c.endAge>c.startAge))fail('BAZI_FP_W7_CANONICAL_LUCK_CYCLE_FACT_INVALID');
  const {stem,branch}=parsePillar(c.value);const stemTg=tenGodFor(chart.dayMaster.code,stem.code);
  const hiddenTenGods=branch.hiddenStems.map((code,index)=>{const tg=tenGodFor(chart.dayMaster.code,code),hs=STEMS[code];return {order:index+1,stemCode:code,stemZh:hs.zh,tenGodCode:tg.code,tenGodZh:tg.zh};});
  const cycle={stem:{code:stem.code,zh:stem.zh,element:stem.element,polarity:stem.polarity},branch:{code:branch.code,zh:branch.zh,element:branch.element}};
  const pairwise=chart.pillars.flatMap(p=>pairRelations(cycle,p));const groups=groupRelations(cycle,chart);const all=[...pairwise,...groups];
  return {cycleNumber:c.cycleNumber,startAge:c.startAge,endAge:c.endAge,certainty:'DETERMINISTIC',pillar:cycle,stemTenGod:{code:stemTg.code,zh:stemTg.zh,en:stemTg.en},branchHiddenTenGods:hiddenTenGods,natalInteractions:all,activationEvidence:{interactionCount:all.length,natalPositions:[...new Set(all.flatMap(x=>x.natalPosition?[x.natalPosition]:(x.natalPositions||[])))]},sourceFact:{code:c.code,value:c.value}};
}
export async function buildBaziDaYunStructuralIR({chart,canonicalProjection}={}){
  if(chart?.schemaVersion!=='PHI-OS-BAZI-CANONICAL-CHART-IR-v1.0.0')fail('BAZI_FP_W7_REQUIRES_W1_CHART_IR');
  if(canonicalProjection?.method?.publicMethodCode!=='BAZI_PROJECTION')fail('BAZI_FP_W7_REQUIRES_BAZI_CANONICAL_PROJECTION');
  if(canonicalProjection.projectionId!==chart.sourceProjection?.projectionId)fail('BAZI_FP_W7_PROJECTION_CHART_LINEAGE_MISMATCH');
  const chartSnap=stableSerialize(chart),projectionSnap=stableSerialize(canonicalProjection);
  const cycleFacts=(canonicalProjection.calculation?.cycles||[]).filter(x=>x.code==='LUCK_CYCLE').slice().sort((a,b)=>a.cycleNumber-b.cycleNumber);
  const seen=new Set();for(const c of cycleFacts){if(seen.has(c.cycleNumber))fail('BAZI_FP_W7_DUPLICATE_CYCLE_NUMBER');seen.add(c.cycleNumber);}
  const records=cycleFacts.map(c=>normalizeCycle(c,chart));
  for(let i=1;i<records.length;i++){if(records[i].cycleNumber!==records[i-1].cycleNumber+1)fail('BAZI_FP_W7_NON_CONTIGUOUS_CYCLE_NUMBER');if(Math.abs((records[i].startAge-records[i-1].startAge)-10)>1e-9)fail('BAZI_FP_W7_NON_TEN_YEAR_SEQUENCE');}
  const unavailableUnknowns=(canonicalProjection.unknown||[]).filter(x=>x.scope==='BZR_LUCK_CYCLE'||String(x.code||'').includes('LUCK_CYCLE')).map(x=>({code:x.code,reasonCodes:x.reasonCodes||[]}));
  const base={schemaVersion:BAZI_DA_YUN_STRUCTURAL_SCHEMA,work:'BAZI-FP-W7',runtimeVersion:BAZI_DA_YUN_STRUCTURAL_RUNTIME_VERSION,sourceChartDigest:chart.chartDigest,sourceProjection:{projectionId:canonicalProjection.projectionId,publicMethodCode:canonicalProjection.method.publicMethodCode,projectionStatus:canonicalProjection.projection?.status,calculationStatus:canonicalProjection.calculation?.status},authorityState:records.length?'CANONICAL_PROJECTION_DA_YUN_FACTS_INTEGRATED':'CANONICAL_PROJECTION_DA_YUN_FACTS_UNAVAILABLE',availability:records.length?'AVAILABLE':'NOT_CALCULATED',cycleCount:records.length,cycles:records,unknowns:unavailableUnknowns,lineage:{calculationAuthority:'BZR_LUCK_CYCLE_RUNTIME',projectionAuthority:'MCD_CANONICAL_PROJECTION_RUNTIME',chartAuthority:'BAZI-FP-W1_CANONICAL_CHART_IR',relationshipPredecessor:'BAZI-FP-W3_STEM_BRANCH_RELATIONSHIP_ENGINE',tenGodPredecessor:'BAZI-FP-W4_TEN_GOD_STRUCTURAL_RUNTIME',sourceProjectionReused:true},boundaries:{luckCycleRecalculated:false,directionInferred:false,exactStartAgeReconstructed:false,currentActiveCycleSelected:false,targetDateUsed:false,liuNianCreated:false,w9FindingRegistryCreated:false,patternVerdictCreated:false,usefulGodVerdictCreated:false,interpretationCreated:false,eventPredictionCreated:false,fortunePredictionCreated:false,customerProductionEligible:false}};
  const daYunDigest=await sha256(base);
  if(stableSerialize(chart)!==chartSnap||stableSerialize(canonicalProjection)!==projectionSnap)fail('BAZI_FP_W7_INPUT_MUTATION_FORBIDDEN');
  return freeze({...base,daYunDigest});
}
export default Object.freeze({buildBaziDaYunStructuralIR});
