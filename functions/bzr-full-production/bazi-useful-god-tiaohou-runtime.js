import {sha256,stableSerialize} from '../method-runtime/shared-calculation-runtime.js';

export const BAZI_USEFUL_GOD_TIAOHOU_SCHEMA='PHI-OS-BAZI-USEFUL-GOD-TIAOHOU-MULTI-SCHOOL-IR-v1.0.0';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value};
function fail(code){const e=new Error(code);e.code=code;throw e;}
function seasonalClimate(season){
 if(season==='WINTER'||season==='LATE_WINTER')return {thermalContext:'COLD_SEASON_CONTEXT',moistureContext:'NOT_DECIDABLE_FROM_SEASON_ALONE'};
 if(season==='SUMMER'||season==='LATE_SUMMER')return {thermalContext:'WARM_SEASON_CONTEXT',moistureContext:'NOT_DECIDABLE_FROM_SEASON_ALONE'};
 return {thermalContext:'TRANSITIONAL_SEASON_CONTEXT',moistureContext:'NOT_DECIDABLE_FROM_SEASON_ALONE'};
}
export async function analyzeBaziUsefulGodTiaohouViews({chart,strengthSeasonal,patterns}={}){
 if(chart?.schemaVersion!=='PHI-OS-BAZI-CANONICAL-CHART-IR-v1.0.0')fail('BAZI_FP_W6_REQUIRES_W1_CHART_IR');
 if(strengthSeasonal?.schemaVersion!=='PHI-OS-BAZI-STRENGTH-SEASONAL-EVIDENCE-v1.0.0')fail('BAZI_FP_W6_REQUIRES_W2_STRENGTH_EVIDENCE');
 if(patterns?.schemaVersion!=='PHI-OS-BAZI-PATTERN-CANDIDATE-IR-v1.0.0')fail('BAZI_FP_W6_REQUIRES_W5_PATTERN_CANDIDATES');
 if(strengthSeasonal.sourceChartDigest!==chart.chartDigest||patterns.sourceChartDigest!==chart.chartDigest)fail('BAZI_FP_W6_INPUT_DIGEST_MISMATCH');
 const snapshots=[stableSerialize(chart),stableSerialize(strengthSeasonal),stableSerialize(patterns)];
 const climate=seasonalClimate(chart.monthCommand.season);
 const schoolViews=[
  {schoolCode:'ZI_PING_MONTH_COMMAND_USE_v1',sourceClaimRefs:['BZR-CLM-ZPZQ-08-MONTH-COMMAND-001','BZR-CLM-ZPZQ-09-CONDITIONAL-FORMATION-003','BZR-CLM-ZPZQ-10-VARIATION-004','BZR-CLM-ZPZQ-14-CLIMATE-CROSSCHECK-006'],evidence:{monthCommandBranch:chart.monthCommand.branch.code,patternCandidateIds:patterns.patternCandidates.map(x=>x.candidateId),variationEvidencePresent:patterns.variationEvidence.monthBranchRelations.length>0||patterns.variationEvidence.visibleStemMatches.length>0},verdict:{usefulGod:null,state:'WITHHELD_PENDING_HUMAN_ADMISSION_AND_ZI_PING_RULESET'}},
  {schoolCode:'DI_TIAN_SUI_TI_YONG_BALANCE_v1',sourceClaimRefs:['BZR-CLM-DTS-TIYONG-MULTI-USE-008','BZR-CLM-DTS-YUELING-CONTEXT-010','BZR-CLM-DTS-STRENGTH-NON-SINGLE-FACTOR-011'],evidence:{monthElementRelationToDayMaster:strengthSeasonal.seasonalContext.monthElementRelationToDayMaster,unweightedVisibleRelationCounts:strengthSeasonal.evidenceSummary.unweightedVisibleRelationCounts,rootEvidenceCount:strengthSeasonal.evidenceSummary.rootEvidenceCount,strongWeakVerdictAvailable:strengthSeasonal.verdict.strongWeak!==null},verdict:{usefulGodCandidates:[],priorityOrder:[],state:'WITHHELD_PENDING_HUMAN_ADMISSION_AND_VERSIONED_TI_YONG_RULESET'}},
  {schoolCode:'DI_TIAN_SUI_CLIMATE_TIAOHOU_v1',sourceClaimRefs:['BZR-CLM-DTS-HANNUAN-ZAOSHI-009'],evidence:{season:chart.monthCommand.season,...climate,visibleElementInventory:chart.fiveElementInventory.visibleStems,visibleBranchInventory:chart.fiveElementInventory.visibleBranches},verdict:{tiaohouElementCandidates:[],thermalBalanceVerdict:null,moistureBalanceVerdict:null,state:'EVIDENCE_ONLY_NO_TIAOHOU_SELECTION'}}
 ];
 const base={schemaVersion:BAZI_USEFUL_GOD_TIAOHOU_SCHEMA,work:'BAZI-FP-W6',runtimeVersion:'1.0.0',sourceChartDigest:chart.chartDigest,sourceStrengthDigest:strengthSeasonal.analysisDigest,sourcePatternDigest:patterns.patternDigest,authorityState:'ENGINEERING_MULTI_SCHOOL_EVIDENCE_SOURCE_GATED',schoolViews,crossSchoolSynthesis:{created:false,selectedSchool:null,mergedUsefulGod:null,conflictResolution:null,reason:'SILENT_SCHOOL_BLENDING_FORBIDDEN'},lineage:{schoolRegistryRef:'content/interpretation/bazi/registries/bazi-useful-god-school-registry-v1.json',claimBatchRef:'content/interpretation/bazi/claims/bazi-source-claim-batch-bzr-r1-v1.json'},boundaries:{schoolQualifiedTerminologyRequired:true,numericUsefulGodScoreCreated:false,strongWeakVerdictInvented:false,usefulGodVerdictCreated:false,tiaohouVerdictCreated:false,crossSchoolSynthesisCreated:false,customerInterpretationCreated:false,fortunePredictionCreated:false,productionEligible:false}};
 const usefulGodTiaohouDigest=await sha256(base);
 if(stableSerialize(chart)!==snapshots[0]||stableSerialize(strengthSeasonal)!==snapshots[1]||stableSerialize(patterns)!==snapshots[2])fail('BAZI_FP_W6_INPUT_MUTATION_FORBIDDEN');
 return freeze({...base,usefulGodTiaohouDigest});
}
export default Object.freeze({analyzeBaziUsefulGodTiaohouViews});
