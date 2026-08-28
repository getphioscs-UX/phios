import {sha256,stableSerialize} from '../method-runtime/shared-calculation-runtime.js';
import {tenGodFor} from './bazi-structural-registry.js';
export const BAZI_TEN_GOD_SCHEMA='PHI-OS-BAZI-TEN-GOD-STRUCTURAL-IR-v1.0.0';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value};
export async function analyzeBaziTenGods({chart}={}){
 if(chart?.schemaVersion!=='PHI-OS-BAZI-CANONICAL-CHART-IR-v1.0.0')throw new Error('BAZI_FP_W4_REQUIRES_W1_CHART_IR');
 const snapshot=stableSerialize(chart),day=chart.dayMaster,visible=[],hidden=[];
 for(const pillar of chart.pillars){
  if(pillar.position==='DAY')visible.push({location:'DAY_STEM',pillar:'DAY',stemCode:pillar.stem.code,stemZh:pillar.stem.zh,classification:'DAY_MASTER',tenGodCode:null,tenGodZh:'日主',tenGodEn:'Day Master'});
  else {const tg=tenGodFor(day.code,pillar.stem.code);visible.push({location:`${pillar.position}_STEM`,pillar:pillar.position,stemCode:pillar.stem.code,stemZh:pillar.stem.zh,classification:'TEN_GOD',tenGodCode:tg.code,tenGodZh:tg.zh,tenGodEn:tg.en});}
  for(const hs of pillar.hiddenStems){const tg=tenGodFor(day.code,hs.code);hidden.push({location:`${pillar.position}_BRANCH_HIDDEN_${hs.order}`,pillar:pillar.position,branchCode:pillar.branch.code,branchZh:pillar.branch.zh,hiddenStemCode:hs.code,hiddenStemZh:hs.zh,order:hs.order,tenGodCode:tg.code,tenGodZh:tg.zh,tenGodEn:tg.en});}
 }
 const counts={};for(const x of [...visible.filter(x=>x.tenGodCode),...hidden])counts[x.tenGodCode]=(counts[x.tenGodCode]||0)+1;
 const visibleCounts={};for(const x of visible.filter(x=>x.tenGodCode))visibleCounts[x.tenGodCode]=(visibleCounts[x.tenGodCode]||0)+1;
 const base={schemaVersion:BAZI_TEN_GOD_SCHEMA,work:'BAZI-FP-W4',runtimeVersion:'1.0.0',sourceChartDigest:chart.chartDigest,authorityState:'ENGINEERING_STRUCTURAL_CLASSIFICATION_SOURCE_GATED',dayMaster:{code:day.code,zh:day.zh,element:day.element,polarity:day.polarity},visibleStems:visible,hiddenStems:hidden,distribution:{visibleUnweighted:visibleCounts,visiblePlusHiddenUnweighted:counts,weightsApplied:false},
  lineage:{sourceStrategyRef:'content/interpretation/bazi/authority/bzr-r1-source-strategy-v1.json'},boundaries:{structuralClassificationOnly:true,personalityMeaningCreated:false,wealthOutcomeCreated:false,careerOutcomeCreated:false,relationshipOutcomeCreated:false,interpretationCreated:false,productionEligible:false}};
 const tenGodDigest=await sha256(base);if(stableSerialize(chart)!==snapshot)throw new Error('BAZI_FP_W4_CHART_MUTATION_FORBIDDEN');return freeze({...base,tenGodDigest});
}
export default Object.freeze({analyzeBaziTenGods});
