import {sha256,stableSerialize} from '../method-runtime/shared-calculation-runtime.js';
import {BZR_TEMPORAL_PROJECTION_SCHEMA} from '../bzr-temporal/temporal-runtime.js';
import {
  STEMS,BRANCHES,STEM_COMBINATIONS,BRANCH_SIX_COMBINATIONS,BRANCH_CLASHES,
  BRANCH_HARMS,BRANCH_BREAKS,THREE_HARMONIES,THREE_MEETINGS,
  THREE_PUNISHMENT_GROUPS,SELF_PUNISHMENT_BRANCHES,tenGodFor
} from './bazi-structural-registry.js';
import {BAZI_DA_YUN_STRUCTURAL_SCHEMA} from './bazi-da-yun-runtime.js';

export const BAZI_LIU_NIAN_INTERACTION_SCHEMA='PHI-OS-BAZI-NATAL-DA-YUN-LIU-NIAN-INTERACTION-IR-v1.0.0';
export const BAZI_LIU_NIAN_INTERACTION_RUNTIME_VERSION='1.0.0';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value};
const pairKey=(a,b)=>[a,b].sort().join('|');
const pairSet=defs=>new Set(defs.map(x=>pairKey(x[0],x[1])));
const STEM_COMBO=pairSet(STEM_COMBINATIONS),BRANCH_COMBO=pairSet(BRANCH_SIX_COMBINATIONS),CLASH=pairSet(BRANCH_CLASHES),HARM=pairSet(BRANCH_HARMS),BREAK=pairSet(BRANCH_BREAKS);
function fail(code){const e=new Error(code);e.code=code;throw e;}
function identityPillar({stemCode,branchCode},actor,position=null){
 const stem=STEMS[stemCode],branch=BRANCHES[branchCode];if(!stem||!branch)fail(`BAZI_FP_W8_UNKNOWN_PILLAR:${actor}`);
 return {actor,position,stem:{code:stem.code,zh:stem.zh,element:stem.element,polarity:stem.polarity},branch:{code:branch.code,zh:branch.zh,element:branch.element}};
}
function pairRelations(left,right,scope){
 const out=[],sp=pairKey(left.stem.code,right.stem.code),bp=pairKey(left.branch.code,right.branch.code);
 if(left.stem.code===right.stem.code)out.push({type:'STEM_REPEAT',members:[left.stem.code,right.stem.code]});
 if(STEM_COMBO.has(sp))out.push({type:'STEM_COMBINATION',members:[left.stem.code,right.stem.code],transformationEstablished:false});
 if(left.branch.code===right.branch.code)out.push({type:'BRANCH_REPEAT',members:[left.branch.code,right.branch.code]});
 if(BRANCH_COMBO.has(bp))out.push({type:'BRANCH_SIX_COMBINATION',members:[left.branch.code,right.branch.code],transformationEstablished:false});
 if(CLASH.has(bp))out.push({type:'BRANCH_CLASH',members:[left.branch.code,right.branch.code]});
 if(HARM.has(bp))out.push({type:'BRANCH_HARM',members:[left.branch.code,right.branch.code]});
 if(BREAK.has(bp))out.push({type:'BRANCH_BREAK',members:[left.branch.code,right.branch.code]});
 if(bp===pairKey('ZI','MAO'))out.push({type:'BRANCH_PUNISHMENT_PAIR',members:[left.branch.code,right.branch.code]});
 if(left.branch.code===right.branch.code&&SELF_PUNISHMENT_BRANCHES.includes(left.branch.code))out.push({type:'BRANCH_SELF_PUNISHMENT',members:[left.branch.code,right.branch.code]});
 return out.map(x=>({...x,scope,leftActor:left.actor,rightActor:right.actor,leftPosition:left.position,rightPosition:right.position,sourceAuthorityState:'W3_STRUCTURAL_RELATION_DERIVATION_NO_TRANSFORMATION_VERDICT'}));
}
function groupRelations(entries){
 const out=[];
 const defs=[...THREE_HARMONIES.map(x=>({...x,type:'BRANCH_THREE_HARMONY'})),...THREE_MEETINGS.map(x=>({...x,type:'BRANCH_THREE_MEETING'})),...THREE_PUNISHMENT_GROUPS.map(x=>({...x,type:'BRANCH_PUNISHMENT_GROUP'}))];
 for(const d of defs){
   const matched=d.branches.map(code=>entries.filter(e=>e.branch.code===code));
   if(matched.some(xs=>xs.length===0))continue;
   const chosen=matched.map(xs=>xs[0]);
   if(!chosen.some(e=>e.actor==='LIU_NIAN'))continue;
   const actors=[...new Set(chosen.map(e=>e.actor))];
   const spansThreeLayers=actors.includes('LIU_NIAN')&&actors.includes('DA_YUN')&&actors.some(x=>x.startsWith('NATAL_'));
   out.push({type:`${d.type}_WITH_LIU_NIAN`,members:d.branches,element:d.element??null,groupCode:d.code??null,actors:chosen.map(e=>e.actor),positions:chosen.map(e=>e.position).filter(Boolean),spansThreeLayers,transformationEstablished:false,sourceAuthorityState:'W3_STRUCTURAL_RELATION_DERIVATION_NO_TRANSFORMATION_VERDICT'});
 }
 return out;
}
function annualStructural(annual,dayMasterCode){
 if(!annual)return null;
 const p=identityPillar(annual,'LIU_NIAN');const tg=tenGodFor(dayMasterCode,p.stem.code);
 return {...p,year:annual.year??null,sexagenaryIndex:annual.sexagenaryIndex??null,stemTenGod:{code:tg.code,zh:tg.zh,en:tg.en},branchHiddenTenGods:p.branch.code?BRANCHES[p.branch.code].hiddenStems.map((code,index)=>{const h=STEMS[code],x=tenGodFor(dayMasterCode,code);return {order:index+1,stemCode:code,stemZh:h.zh,tenGodCode:x.code,tenGodZh:x.zh,tenGodEn:x.en};}):[]};
}
function matchCurrentDaYun(daYunStructural,currentLuckCycle){
 if(currentLuckCycle?.state!=='ACTIVE'||!currentLuckCycle.current)return {state:currentLuckCycle?.state||'UNAVAILABLE',record:null,candidates:[],reasonCodes:currentLuckCycle?.reasonCodes||[]};
 const c=currentLuckCycle.current,record=daYunStructural.cycles.find(x=>x.cycleNumber===c.cycleNumber);if(!record)fail('BAZI_FP_W8_ACTIVE_DA_YUN_NOT_FOUND_IN_W7');
 const s=c.pillar?.stemCode,b=c.pillar?.branchCode;if(record.pillar.stem.code!==s||record.pillar.branch.code!==b)fail('BAZI_FP_W8_DA_YUN_TEMPORAL_W7_PILLAR_MISMATCH');
 return {state:'ACTIVE',record,candidates:[],reasonCodes:[]};
}
export async function buildBaziLiuNianInteractionIR({chart,daYunStructural,temporalProjection}={}){
 if(chart?.schemaVersion!=='PHI-OS-BAZI-CANONICAL-CHART-IR-v1.0.0')fail('BAZI_FP_W8_REQUIRES_W1_CHART_IR');
 if(daYunStructural?.schemaVersion!==BAZI_DA_YUN_STRUCTURAL_SCHEMA)fail('BAZI_FP_W8_REQUIRES_W7_DA_YUN_STRUCTURAL_IR');
 if(temporalProjection?.schemaVersion!==BZR_TEMPORAL_PROJECTION_SCHEMA)fail('BAZI_FP_W8_REQUIRES_GOVERNED_BZR_TEMPORAL_PROJECTION');
 if(daYunStructural.sourceChartDigest!==chart.chartDigest)fail('BAZI_FP_W8_DA_YUN_CHART_LINEAGE_MISMATCH');
 if(temporalProjection.sourceNatalProjectionId!==chart.sourceProjection.projectionId)fail('BAZI_FP_W8_TEMPORAL_NATAL_PROJECTION_LINEAGE_MISMATCH');
 const snaps=[stableSerialize(chart),stableSerialize(daYunStructural),stableSerialize(temporalProjection)];
 const annualFact=temporalProjection.annualContext?.annualPillar||null,annual=annualStructural(annualFact,chart.dayMaster.code);
 const current=matchCurrentDaYun(daYunStructural,temporalProjection.currentLuckCycle);
 const natal=chart.pillars.map(p=>({actor:`NATAL_${p.position}`,position:p.position,stem:p.stem,branch:p.branch}));
 const annualToNatal=annual?natal.flatMap(p=>pairRelations(annual,p,`LIU_NIAN_TO_NATAL_${p.position}`)):[];
 let currentDaYun=null,annualToDaYun=[];
 if(current.record){currentDaYun={cycleNumber:current.record.cycleNumber,startAge:current.record.startAge,endAge:current.record.endAge,pillar:current.record.pillar,stemTenGod:current.record.stemTenGod,branchHiddenTenGods:current.record.branchHiddenTenGods,natalInteractions:current.record.natalInteractions};const dy={actor:'DA_YUN',position:`CYCLE_${current.record.cycleNumber}`,stem:current.record.pillar.stem,branch:current.record.pillar.branch};if(annual)annualToDaYun=pairRelations(annual,dy,'LIU_NIAN_TO_CURRENT_DA_YUN');}
 const groupEntries=[...natal];if(current.record)groupEntries.push({actor:'DA_YUN',position:`CYCLE_${current.record.cycleNumber}`,stem:current.record.pillar.stem,branch:current.record.pillar.branch});if(annual)groupEntries.push(annual);
 const crossLayerGroups=annual?groupRelations(groupEntries):[];
 const unknownCodes=[];
 for(const x of temporalProjection.unknown||[])unknownCodes.push(x.code);
 if(!annual)unknownCodes.push('BAZI_FP_W8_LIU_NIAN_UNAVAILABLE_FROM_TEMPORAL_AUTHORITY');
 if(temporalProjection.currentLuckCycle?.state==='TRANSITION_DAY')unknownCodes.push('BAZI_FP_W8_CURRENT_DA_YUN_AMBIGUOUS_TRANSITION_DAY');
 else if(temporalProjection.currentLuckCycle?.state!=='ACTIVE')unknownCodes.push('BAZI_FP_W8_CURRENT_DA_YUN_NOT_ACTIVE_OR_UNAVAILABLE');
 const interactionCount=annualToNatal.length+annualToDaYun.length+crossLayerGroups.length;
 const base={schemaVersion:BAZI_LIU_NIAN_INTERACTION_SCHEMA,work:'BAZI-FP-W8',runtimeVersion:BAZI_LIU_NIAN_INTERACTION_RUNTIME_VERSION,authorityState:'GOVERNED_TEMPORAL_ANNUAL_FACT_PLUS_W7_DA_YUN_STRUCTURAL_INTERACTION',source:{chartDigest:chart.chartDigest,daYunDigest:daYunStructural.daYunDigest,temporalProjectionId:temporalProjection.projectionId,natalProjectionId:chart.sourceProjection.projectionId,targetContext:temporalProjection.targetContext},liuNian:annual,currentDaYun:{state:current.state,record:currentDaYun,candidates:temporalProjection.currentLuckCycle?.candidates||[],reasonCodes:current.reasonCodes},interactions:{liuNianToNatal:annualToNatal,liuNianToCurrentDaYun:annualToDaYun,currentDaYunToNatal:currentDaYun?.natalInteractions||[],crossLayerGroups},summary:{interactionCount,liuNianToNatalCount:annualToNatal.length,liuNianToDaYunCount:annualToDaYun.length,crossLayerGroupCount:crossLayerGroups.length,threeLayerGroupCount:crossLayerGroups.filter(x=>x.spansThreeLayers).length},unknowns:[...new Set(unknownCodes)].map(code=>({code,rendererMustDisplay:true})),lineage:{annualFactOwner:'BZR_TEMPORAL_RUNTIME_V2_EXACT_LI_CHUN_ANNUAL_AUTHORITY',currentDaYunSelectorOwner:'BZR_TEMPORAL_RUNTIME_V2_CIVIL_DATE_LUCK_BOUNDARY_AUTHORITY',daYunStructuralOwner:'BAZI-FP-W7',natalChartOwner:'BAZI-FP-W1',relationshipDerivationPredecessor:'BAZI-FP-W3',tenGodDerivationPredecessor:'BAZI-FP-W4',w5W6RulesConsumed:false,w9FindingRegistryCreated:false},boundaries:{annualPillarRecalculated:false,currentDaYunReselected:false,luckCycleRecalculated:false,natalRecalculated:false,combinationTransformationVerdictCreated:false,patternVerdictCreated:false,usefulGodVerdictCreated:false,goodBadScoreCreated:false,eventPredictionCreated:false,fortunePredictionCreated:false,customerInterpretationCreated:false,w9FindingRegistryCreated:false,customerProductionEligible:false}};
 const interactionDigest=await sha256(base);
 if(stableSerialize(chart)!==snaps[0]||stableSerialize(daYunStructural)!==snaps[1]||stableSerialize(temporalProjection)!==snaps[2])fail('BAZI_FP_W8_INPUT_MUTATION_FORBIDDEN');
 return freeze({...base,interactionDigest,executionCompleteness:annual&&current.record?'COMPLETE':'PARTIAL'});
}
export default Object.freeze({buildBaziLiuNianInteractionIR});
