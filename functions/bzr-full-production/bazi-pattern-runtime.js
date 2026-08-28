import {sha256,stableSerialize} from '../method-runtime/shared-calculation-runtime.js';
import {tenGodFor} from './bazi-structural-registry.js';

export const BAZI_PATTERN_SCHEMA='PHI-OS-BAZI-PATTERN-CANDIDATE-IR-v1.0.0';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value};
const FAMILY_BY_TEN_GOD=Object.freeze({
 ZHENG_GUAN:'ZHENG_GUAN',QI_SHA:'QI_SHA',ZHENG_CAI:'CAI',PIAN_CAI:'CAI',ZHENG_YIN:'YIN',PIAN_YIN:'YIN',SHI_SHEN:'SHI_SHEN',SHANG_GUAN:'SHANG_GUAN',BI_JIAN:'PEER_MONTH_COMMAND_REQUIRES_SPECIAL_RULE',JIE_CAI:'PEER_MONTH_COMMAND_REQUIRES_SPECIAL_RULE'
});
function fail(code){const e=new Error(code);e.code=code;throw e;}
export async function analyzeBaziPatternCandidates({chart,tenGods,relationships}={}){
 if(chart?.schemaVersion!=='PHI-OS-BAZI-CANONICAL-CHART-IR-v1.0.0')fail('BAZI_FP_W5_REQUIRES_W1_CHART_IR');
 if(tenGods?.schemaVersion!=='PHI-OS-BAZI-TEN-GOD-STRUCTURAL-IR-v1.0.0')fail('BAZI_FP_W5_REQUIRES_W4_TEN_GODS');
 if(relationships?.schemaVersion!=='PHI-OS-BAZI-STEM-BRANCH-RELATIONSHIPS-v1.0.0')fail('BAZI_FP_W5_REQUIRES_W3_RELATIONSHIPS');
 if(tenGods.sourceChartDigest!==chart.chartDigest||relationships.sourceChartDigest!==chart.chartDigest)fail('BAZI_FP_W5_INPUT_DIGEST_MISMATCH');
 const snapshots=[stableSerialize(chart),stableSerialize(tenGods),stableSerialize(relationships)];
 const month=chart.pillars.find(x=>x.position==='MONTH');if(!month)fail('BAZI_FP_W5_MONTH_PILLAR_REQUIRED');
 const visible=chart.pillars.filter(x=>x.position!=='DAY').map(x=>({position:x.position,code:x.stem.code,zh:x.stem.zh}));
 const candidates=month.hiddenStems.map(hidden=>{
   const tg=tenGodFor(chart.dayMaster.code,hidden.code),matches=visible.filter(x=>x.code===hidden.code).map(x=>x.position);
   return {candidateId:`MONTH_COMMAND_${hidden.code}`,hiddenStemCode:hidden.code,hiddenStemZh:hidden.zh,hiddenOrder:hidden.order,tenGodCode:tg.code,tenGodZh:tg.zh,patternFamily:FAMILY_BY_TEN_GOD[tg.code],visibleStemMatch:matches.length>0,visiblePillars:matches,priorityVerdict:null,sourceAuthorityState:'SOURCE_CLAIM_EXTRACTED_HUMAN_ADMISSION_PENDING'};
 });
 const monthRelations=relationships.relations.filter(r=>(r.positions||[]).includes('MONTH')).map(r=>({type:r.type,members:r.members,positions:r.positions,element:r.element??null,transformationEstablished:r.transformationEstablished}));
 const base={schemaVersion:BAZI_PATTERN_SCHEMA,work:'BAZI-FP-W5',runtimeVersion:'1.0.0',sourceChartDigest:chart.chartDigest,sourceTenGodDigest:tenGods.tenGodDigest,sourceRelationshipDigest:relationships.relationshipDigest,authorityState:'ENGINEERING_PATTERN_CANDIDATES_SOURCE_GATED',schoolCode:'ZI_PING_MONTH_COMMAND_PATTERN_v1',monthCommand:{branchCode:month.branch.code,branchZh:month.branch.zh,hiddenStemCount:month.hiddenStems.length},patternCandidates:candidates,variationEvidence:{visibleStemMatches:candidates.filter(x=>x.visibleStemMatch).map(x=>x.candidateId),monthBranchRelations:monthRelations,variationRequiresRuleEvaluation:true,combinationTransformationAssumed:false},verdict:{primaryPattern:null,secondaryPatterns:[],formationState:'WITHHELD_PENDING_HUMAN_ADMISSION_AND_VERSIONED_PATTERN_RULESET',quality:null},lineage:{schoolRegistryRef:'content/interpretation/bazi/registries/bazi-pattern-school-registry-v1.json',claimBatchRef:'content/interpretation/bazi/claims/bazi-source-claim-batch-bzr-r1-v1.json',requiredSourceClaimRefs:['BZR-CLM-ZPZQ-08-MONTH-COMMAND-001','BZR-CLM-ZPZQ-09-CONDITIONAL-FORMATION-003','BZR-CLM-ZPZQ-10-VARIATION-004']},boundaries:{candidateExtractionOnly:true,monthLookupVerdictCreated:false,patternFormationVerdictCreated:false,qualityScoreCreated:false,lifeOutcomeCreated:false,interpretationCreated:false,productionEligible:false}};
 const patternDigest=await sha256(base);
 if(stableSerialize(chart)!==snapshots[0]||stableSerialize(tenGods)!==snapshots[1]||stableSerialize(relationships)!==snapshots[2])fail('BAZI_FP_W5_INPUT_MUTATION_FORBIDDEN');
 return freeze({...base,patternDigest});
}
export default Object.freeze({analyzeBaziPatternCandidates});
