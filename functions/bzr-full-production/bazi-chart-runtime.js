import {sha256,stableSerialize} from '../method-runtime/shared-calculation-runtime.js';
import {STEMS,BRANCHES,SEASON_BY_MONTH_BRANCH,stemIdentity,branchIdentity,BAZI_STRUCTURAL_REGISTRY_VERSION} from './bazi-structural-registry.js';

export const BAZI_CHART_IR_SCHEMA='PHI-OS-BAZI-CANONICAL-CHART-IR-v1.0.0';
const ORDER=['YEAR','MONTH','DAY','HOUR'];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value};
function fail(code){const e=new Error(code);e.code=code;throw e;}
function group(p,code){return (p?.calculation?.structures||[]).find(x=>x.code===code)}
function itemMap(p){return new Map((group(p,'FOUR_PILLARS')?.items||[]).map(x=>[x.code,x]));}
function count(list,key){const out={WOOD:0,FIRE:0,EARTH:0,METAL:0,WATER:0};for(const x of list){const v=x[key];if(v in out)out[v]++}return out;}
function identityCopy(x){return {code:x.code,zh:x.zh,element:x.element,polarity:x.polarity};}
function branchCopy(x){return {code:x.code,zh:x.zh,element:x.element};}

export async function buildCanonicalBaziChartIR({canonicalProjection}={}){
  const p=canonicalProjection;
  if(p?.method?.publicMethodCode!=='BAZI_PROJECTION')fail('BAZI_FP_W1_REQUIRES_BAZI_PROJECTION');
  if(!p.projectionId)fail('BAZI_FP_W1_PROJECTION_ID_REQUIRED');
  const snapshot=stableSerialize(p),items=itemMap(p),unknownCodes=(p.unknown||[]).map(x=>x.code);
  const pillars=[];
  for(const position of ORDER){
    const s=items.get(`${position}_STEM`),b=items.get(`${position}_BRANCH`);
    if(!s&&!b)continue;
    if(!s||!b)fail(`BAZI_FP_W1_INCOMPLETE_PILLAR:${position}`);
    const stem=stemIdentity(s.value),branch=branchIdentity(b.value);
    pillars.push({
      position,
      stem:{...identityCopy(stem),sourceRef:`${p.projectionId}#FOUR_PILLARS:${s.code}`},
      branch:{...branchCopy(branch),sourceRef:`${p.projectionId}#FOUR_PILLARS:${b.code}`},
      hiddenStems:branch.hiddenStems.map((code,index)=>({...identityCopy(STEMS[code]),order:index+1,sourceClass:'BZR_STRUCTURAL_REGISTRY_DERIVATION',sourceAuthorityState:'SOURCE_GATED'}))
    });
  }
  if(pillars.length<3)fail('BAZI_FP_W1_REQUIRES_THREE_OR_FOUR_PILLARS');
  const day=pillars.find(x=>x.position==='DAY'),month=pillars.find(x=>x.position==='MONTH');
  if(!day||!month)fail('BAZI_FP_W1_DAY_AND_MONTH_REQUIRED');
  const visibleStemFacts=pillars.map(x=>x.stem),visibleBranchFacts=pillars.map(x=>x.branch),hiddenFacts=pillars.flatMap(x=>x.hiddenStems);
  const base={
    schemaVersion:BAZI_CHART_IR_SCHEMA,work:'BAZI-FP-W1',runtimeVersion:'1.0.0',methodCode:'BAZI',
    authorityState:'ENGINEERING_SOURCE_GATED',
    sourceProjection:{projectionId:p.projectionId,publicMethodCode:p.method.publicMethodCode,methodVersion:p.method.version,calculationStatus:p.calculation?.status,projectionStatus:p.projection?.status},
    pillars,
    dayMaster:{...identityCopy(day.stem),pillar:'DAY',sourceRef:day.stem.sourceRef},
    monthCommand:{branch:{...month.branch},season:SEASON_BY_MONTH_BRANCH[month.branch.code],sourceRef:month.branch.sourceRef},
    fiveElementInventory:{visibleStems:count(visibleStemFacts,'element'),visibleBranches:count(visibleBranchFacts,'element'),hiddenStemsUnweighted:count(hiddenFacts,'element'),weightedHiddenStemScoringApplied:false},
    yinYangInventory:{visibleStems:{YANG:visibleStemFacts.filter(x=>x.polarity==='YANG').length,YIN:visibleStemFacts.filter(x=>x.polarity==='YIN').length}},
    unknowns:(p.unknown||[]).map(x=>({code:x.code,category:x.category,scope:x.scope,reasonCodes:x.reasonCodes||[]})),
    lineage:{structuralRegistryVersion:BAZI_STRUCTURAL_REGISTRY_VERSION,sourceStrategyRef:'content/interpretation/bazi/authority/bzr-r1-source-strategy-v1.json',sourceAdmissionState:'NO_PRODUCTION_RULE_CLAIMS_ADMITTED'},
    boundaries:{canonicalProjectionReused:true,secondProjectionAuthorityCreated:false,fourPillarsRecalculated:false,interpretationCreated:false,fortunePredictionCreated:false,professionalJudgmentCreated:false,hiddenStemWeightsInvented:false,productionEligible:false}
  };
  const chartDigest=await sha256(base);
  if(stableSerialize(p)!==snapshot)fail('BAZI_FP_W1_SOURCE_PROJECTION_MUTATION_FORBIDDEN');
  return freeze({...base,chartDigest,executionCompleteness:unknownCodes.length?'PARTIAL':'COMPLETE'});
}
export default Object.freeze({buildCanonicalBaziChartIR});
