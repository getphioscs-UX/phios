import {sha256,stableSerialize} from '../method-runtime/shared-calculation-runtime.js';
import {tenGodFor} from './bazi-structural-registry.js';

export const BAZI_PATTERN_SCHEMA='PHI-OS-BAZI-PATTERN-CANDIDATE-IR-v1.0.0';
export const BAZI_PATTERN_RUNTIME_VERSION='1.1.0';
export const BAZI_PATTERN_RULESET_ID='BAZI-W5-ZI-PING-MONTH-COMMAND-RULESET-v1';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value};
const FAMILY_BY_TEN_GOD=Object.freeze({
 ZHENG_GUAN:'ZHENG_GUAN',QI_SHA:'QI_SHA',ZHENG_CAI:'CAI',PIAN_CAI:'CAI',ZHENG_YIN:'YIN',PIAN_YIN:'YIN',SHI_SHEN:'SHI_SHEN',SHANG_GUAN:'SHANG_GUAN',BI_JIAN:'PEER_MONTH_COMMAND_REQUIRES_SPECIAL_RULE',JIE_CAI:'PEER_MONTH_COMMAND_REQUIRES_SPECIAL_RULE'
});
const TREATMENT_BY_FAMILY=Object.freeze({
 ZHENG_GUAN:'SHUN_USE',CAI:'SHUN_USE',YIN:'SHUN_USE',SHI_SHEN:'SHUN_USE',QI_SHA:'NI_USE',SHANG_GUAN:'NI_USE',PEER_MONTH_COMMAND_REQUIRES_SPECIAL_RULE:'SPECIAL_JIANLU_YUEJIE_REVIEW'
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
   const tg=tenGodFor(chart.dayMaster.code,hidden.code),matches=visible.filter(x=>x.code===hidden.code).map(x=>x.position),patternFamily=FAMILY_BY_TEN_GOD[tg.code];
   return {candidateId:`MONTH_COMMAND_${hidden.code}`,hiddenStemCode:hidden.code,hiddenStemZh:hidden.zh,hiddenOrder:hidden.order,tenGodCode:tg.code,tenGodZh:tg.zh,patternFamily,treatmentClass:TREATMENT_BY_FAMILY[patternFamily],visibleStemMatch:matches.length>0,visiblePillars:matches,priorityVerdict:null,sourceAuthorityState:'HUMAN_ADMITTED_FOUNDATION_RULESET_FROZEN_V1'};
 });
 const monthRelations=relationships.relations.filter(r=>(r.positions||[]).includes('MONTH')).map(r=>({type:r.type,members:r.members,positions:r.positions,element:r.element??null,transformationEstablished:r.transformationEstablished}));
 const peerSpecialRuleRequired=candidates.some(x=>x.patternFamily==='PEER_MONTH_COMMAND_REQUIRES_SPECIAL_RULE');
 const base={
  schemaVersion:BAZI_PATTERN_SCHEMA,work:'BAZI-FP-W5',runtimeVersion:BAZI_PATTERN_RUNTIME_VERSION,sourceChartDigest:chart.chartDigest,sourceTenGodDigest:tenGods.tenGodDigest,sourceRelationshipDigest:relationships.relationshipDigest,
  authorityState:'SOURCE_ADMITTED_FOUNDATION_RULESET_FROZEN',schoolCode:'ZI_PING_MONTH_COMMAND_PATTERN_v1',rulesetId:BAZI_PATTERN_RULESET_ID,
  monthCommand:{branchCode:month.branch.code,branchZh:month.branch.zh,hiddenStemCount:month.hiddenStems.length},patternCandidates:candidates,
  variationEvidence:{visibleStemMatches:candidates.filter(x=>x.visibleStemMatch).map(x=>x.candidateId),monthBranchRelations:monthRelations,variationRuleEvaluated:true,combinationTransformationAssumed:false},
  ruleEvaluation:{monthCommandStartingContextApplied:true,candidateFamiliesClassified:true,shunNiOrSpecialTreatmentExposed:true,fourPillarSupportDamageRescueEvidenceRequired:true,detailedFormationConditionCoverage:'NOT_EXHAUSTIVE_IN_BZR_R1_BATCH_001',peerMonthCommandSpecialRuleRequired:peerSpecialRuleRequired,automaticQualityRankForbidden:true},
  verdict:{primaryPattern:null,secondaryPatterns:[],formationState:'UNRESOLVED_FROZEN_RULESET_REQUIRES_ADDITIONAL_DETAILED_FORMATION_CONDITION_AUTHORITY',quality:null},
  lineage:{schoolRegistryRef:'content/interpretation/bazi/registries/bazi-pattern-school-registry-v1.1.json',rulesetRef:'content/interpretation/bazi/rulesets/bazi-pattern-ruleset-v1.json',sourceAdmissionRegistryRef:'content/interpretation/bazi/registries/bazi-source-admission-registry-v1.1.json',claimBatchRef:'content/interpretation/bazi/claims/bazi-source-claim-batch-bzr-r1-v1.1.json',admissionRecordRef:'content/interpretation/bazi/admission/bzr-r1-claim-batch-001-admission-v1.json',requiredSourceClaimRefs:['BZR-CLM-ZPZQ-08-MONTH-COMMAND-001','BZR-CLM-ZPZQ-08-SHUN-NI-002','BZR-CLM-ZPZQ-09-CONDITIONAL-FORMATION-003','BZR-CLM-ZPZQ-10-VARIATION-004','BZR-CLM-ZPZQ-12-NO-AUTO-RANK-005','BZR-CLM-ZPZQ-45-JIANLU-YUEJIE-007']},
  boundaries:{candidateExtractionOnly:false,sourceAdmittedRuleEvaluationCreated:true,monthLookupVerdictCreated:false,primaryPatternAssignmentCreated:false,patternFormationVerdictCreated:false,qualityScoreCreated:false,lifeOutcomeCreated:false,interpretationCreated:false,governedIntermediateEligible:true,customerProductionEligible:false}
 };
 const patternDigest=await sha256(base);
 if(stableSerialize(chart)!==snapshots[0]||stableSerialize(tenGods)!==snapshots[1]||stableSerialize(relationships)!==snapshots[2])fail('BAZI_FP_W5_INPUT_MUTATION_FORBIDDEN');
 return freeze({...base,patternDigest});
}
export default Object.freeze({analyzeBaziPatternCandidates});
