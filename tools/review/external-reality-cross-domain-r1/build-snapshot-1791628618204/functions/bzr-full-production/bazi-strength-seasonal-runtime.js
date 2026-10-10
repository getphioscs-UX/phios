import {sha256,stableSerialize} from '../method-runtime/shared-calculation-runtime.js';
import {elementRelation} from './bazi-structural-registry.js';

export const BAZI_STRENGTH_SEASONAL_SCHEMA='PHI-OS-BAZI-STRENGTH-SEASONAL-EVIDENCE-v1.0.0';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value};
function fail(code){const e=new Error(code);e.code=code;throw e;}
function relationToDay(dayElement,targetElement){
 const raw=elementRelation(dayElement,targetElement);
 return ({SAME_ELEMENT:'PEER_SUPPORT',TARGET_GENERATES_SUBJECT:'RESOURCE_SUPPORT',SUBJECT_GENERATES_TARGET:'OUTPUT_DRAIN',SUBJECT_CONTROLS_TARGET:'CONTROLLED_BY_DAY_MASTER',TARGET_CONTROLS_SUBJECT:'PRESSURE_ON_DAY_MASTER'})[raw];
}
export async function analyzeBaziStrengthSeasonal({chart}={}){
 if(chart?.schemaVersion!=='PHI-OS-BAZI-CANONICAL-CHART-IR-v1.0.0')fail('BAZI_FP_W2_REQUIRES_W1_CHART_IR');
 const snapshot=stableSerialize(chart),day=chart.dayMaster,month=chart.monthCommand;
 const roots=[];
 for(const pillar of chart.pillars){
  for(const hidden of pillar.hiddenStems){
   if(hidden.element===day.element)roots.push({pillar:pillar.position,branchCode:pillar.branch.code,branchZh:pillar.branch.zh,hiddenStemCode:hidden.code,hiddenStemZh:hidden.zh,match:hidden.code===day.code?'EXACT_DAY_STEM':'SAME_DAY_MASTER_ELEMENT',sourceAuthorityState:hidden.sourceAuthorityState});
  }
 }
 const visible=[];
 for(const pillar of chart.pillars){
  if(pillar.position!=='DAY')visible.push({location:`${pillar.position}_STEM`,code:pillar.stem.code,zh:pillar.stem.zh,element:pillar.stem.element,relationToDayMaster:relationToDay(day.element,pillar.stem.element)});
  visible.push({location:`${pillar.position}_BRANCH_PRIMARY_ELEMENT`,code:pillar.branch.code,zh:pillar.branch.zh,element:pillar.branch.element,relationToDayMaster:relationToDay(day.element,pillar.branch.element)});
 }
 const counts={PEER_SUPPORT:0,RESOURCE_SUPPORT:0,OUTPUT_DRAIN:0,CONTROLLED_BY_DAY_MASTER:0,PRESSURE_ON_DAY_MASTER:0};for(const x of visible)counts[x.relationToDayMaster]++;
 const base={schemaVersion:BAZI_STRENGTH_SEASONAL_SCHEMA,work:'BAZI-FP-W2',runtimeVersion:'1.0.0',sourceChartDigest:chart.chartDigest,authorityState:'ENGINEERING_EVIDENCE_ONLY_SOURCE_GATED',
  seasonalContext:{monthBranchCode:month.branch.code,monthBranchZh:month.branch.zh,season:month.season,monthPrimaryElement:month.branch.element,monthElementRelationToDayMaster:relationToDay(day.element,month.branch.element),monthCommandSourceRef:month.sourceRef},
  dayMasterContext:{code:day.code,zh:day.zh,element:day.element,polarity:day.polarity},
  rootEvidence:roots,visibleElementRelations:visible,evidenceSummary:{unweightedVisibleRelationCounts:counts,rootEvidenceCount:roots.length,monthCommandEstablished:true},
  verdict:{strongWeak:null,state:'WITHHELD_PENDING_SOURCE_ADMISSION_AND_VERSIONED_STRENGTH_MODEL',numericalScore:null,usefulGod:null},
  lineage:{sourceStrategyRef:'content/interpretation/bazi/authority/bzr-r1-source-strategy-v1.json',sourceAdmissionRegistry:'content/interpretation/bazi/registries/bazi-source-admission-registry-v1.json'},
  boundaries:{evidenceOnly:true,numericalStrengthScoreCreated:false,strongWeakVerdictCreated:false,usefulGodCreated:false,interpretationCreated:false,fortunePredictionCreated:false,productionEligible:false}};
 const analysisDigest=await sha256(base);if(stableSerialize(chart)!==snapshot)fail('BAZI_FP_W2_CHART_MUTATION_FORBIDDEN');return freeze({...base,analysisDigest});
}
export default Object.freeze({analyzeBaziStrengthSeasonal});
