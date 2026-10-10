import {sha256,stableSerialize} from '../method-runtime/shared-calculation-runtime.js';

export const BAZI_FINAL_STRUCTURAL_VERDICT_R2_SCHEMA='PHI-OS-BAZI-FINAL-STRUCTURAL-VERDICT-R2-v1.0.0';
export const BAZI_FINAL_STRUCTURAL_VERDICT_R2_VERSION='1.0.0';

const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const list=v=>Array.isArray(v)?v:[];
const fail=code=>{const e=new Error(code);e.code=code;throw e;};

const ELEMENT_BY_TEN_GOD_GROUP=Object.freeze({
  RESOURCE:{METAL:'EARTH',WOOD:'WATER',WATER:'METAL',FIRE:'WOOD',EARTH:'FIRE'},
  PEER:{METAL:'METAL',WOOD:'WOOD',WATER:'WATER',FIRE:'FIRE',EARTH:'EARTH'},
  OUTPUT:{METAL:'WATER',WOOD:'FIRE',WATER:'WOOD',FIRE:'EARTH',EARTH:'METAL'},
  WEALTH:{METAL:'WOOD',WOOD:'EARTH',WATER:'FIRE',FIRE:'METAL',EARTH:'WATER'},
  OFFICER:{METAL:'FIRE',WOOD:'METAL',WATER:'EARTH',FIRE:'WATER',EARTH:'WOOD'}
});

function threeHarmonyVerdict(relationships){
  return list(relationships?.relations).filter(r=>r.type==='BRANCH_THREE_HARMONY').map(r=>{
    const members=list(r.members);
    const clashes=list(relationships?.relations).filter(x=>x.type==='BRANCH_CLASH'&&list(x.members).some(m=>members.includes(m)));
    return {
      relationType:r.type,
      members,
      element:r.element||null,
      configurationEstablished:members.length===3,
      configurationState:members.length===3?'THREE_HARMONY_CONFIGURATION_ESTABLISHED':'INCOMPLETE',
      fullElementalTransformationEstablished:members.length===3&&clashes.length===0,
      transformationState:members.length!==3?'NOT_APPLICABLE':clashes.length?'CONFIGURATION_ESTABLISHED_FULL_ELEMENTAL_ERASURE_WITHHELD_BY_CLASH_MODIFIER':'QUALIFIED_FULL_TRANSFORMATION_ESTABLISHED',
      modifiers:clashes.map(x=>({type:x.type,members:x.members,positions:x.positions})),
      interpretationBoundary:'A formed three-harmony configuration may increase the configured element\'s structural prominence; original branch contents are not silently erased when a direct clash modifier remains.'
    };
  });
}

function strengthVerdict({chart,strengthSeasonal,relationshipVerdicts}){
  const dayElement=chart.dayMaster.element;
  const counts=strengthSeasonal?.evidenceSummary?.unweightedVisibleRelationCounts||{};
  const rootCount=Number(strengthSeasonal?.evidenceSummary?.rootEvidenceCount||0);
  const exactRoots=list(strengthSeasonal?.rootEvidence).filter(x=>x.match==='EXACT_DAY_STEM').length;
  const seasonal=strengthSeasonal?.seasonalContext?.monthElementRelationToDayMaster;
  const support=Number(counts.PEER_SUPPORT||0)+Number(counts.RESOURCE_SUPPORT||0);
  const burden=Number(counts.OUTPUT_DRAIN||0)+Number(counts.CONTROLLED_BY_DAY_MASTER||0)+Number(counts.PRESSURE_ON_DAY_MASTER||0);
  const configuredDrain=relationshipVerdicts.some(x=>x.configurationEstablished&&x.element&&ELEMENT_BY_TEN_GOD_GROUP.OUTPUT[dayElement]===x.element);
  let label='BALANCED';
  if(['PEER_SUPPORT','RESOURCE_SUPPORT'].includes(seasonal)){
    if(exactRoots>0&&support>=burden)label='STRONG';
    else label=support>=burden?'BALANCED_LEAN_STRONG':'BALANCED';
  }else if(['OUTPUT_DRAIN','PRESSURE_ON_DAY_MASTER','CONTROLLED_BY_DAY_MASTER'].includes(seasonal)){
    if(rootCount===0&&support<burden)label='WEAK';
    else if(configuredDrain)label=support>burden?'BALANCED_LEAN_WEAK':'WEAK';
    else label=support>=burden?'BALANCED_LEAN_WEAK':'WEAK';
  }
  return {
    schoolCode:'DI_TIAN_SUI_MULTI_FACTOR_STRENGTH_R2',
    verdict:label,
    dayMasterElement:dayElement,
    evidenceVector:{
      monthCommandRelation:seasonal,
      exactDayStemRoots:exactRoots,
      rootEvidenceCount:rootCount,
      visibleSupportCount:support,
      visibleBurdenCount:burden,
      configuredOutputDrain:configuredDrain
    },
    qualitativeOnly:true,
    numericalStrengthScore:null,
    boundaries:{
      seasonAloneIsNotVerdict:true,
      occurrenceCountIsNotClassicalWeight:true,
      hiddenAndVisibleEvidenceRemainDistinct:true
    }
  };
}

function patternVerdict({chart,patterns,strength}){
  const monthCandidates=list(patterns?.patternCandidates);
  const primary=monthCandidates[0]||null;
  if(!primary)return {primaryPattern:null,state:'NO_MONTH_COMMAND_CANDIDATE'};
  const visibleStems=chart.pillars.filter(p=>p.position!=='DAY').map(p=>p.stem.element);
  const dm=chart.dayMaster.element;
  let formationPath=null;
  const wealthElement=ELEMENT_BY_TEN_GOD_GROUP.WEALTH[dm];
  const resourceElement=ELEMENT_BY_TEN_GOD_GROUP.RESOURCE[dm];
  if(primary.patternFamily==='SHANG_GUAN'){
    if(visibleStems.includes(wealthElement))formationPath='SHANG_GUAN_SHENG_CAI';
    else if(visibleStems.includes(resourceElement))formationPath='SHANG_GUAN_PEI_YIN';
    else formationPath='SHANG_GUAN_FAMILY_UNQUALIFIED_PATH';
  }else formationPath=primary.patternFamily;
  const carryingQualifier=['WEAK','BALANCED_LEAN_WEAK'].includes(strength.verdict)?'SUPPORT_REQUIRED':'CARRYING_ADEQUATE';
  return {
    schoolCode:'ZI_PING_MONTH_COMMAND_PATTERN_R2',
    primaryPattern:primary.patternFamily,
    primaryPatternZh:primary.tenGodZh?primary.tenGodZh+'格':primary.patternFamily,
    formationPath,
    state:'ESTABLISHED_WITH_QUALIFIERS',
    carryingQualifier,
    counterEvidenceRetained:true,
    qualityRank:null,
    sourceCandidateId:primary.candidateId
  };
}

function usefulGodVerdict({chart,strength,pattern}){
  const dm=chart.dayMaster.element;
  const weakSide=['WEAK','BALANCED_LEAN_WEAK'].includes(strength.verdict);
  const ziPingFactors=weakSide?['RESOURCE','PEER']:(pattern.formationPath==='SHANG_GUAN_SHENG_CAI'?['WEALTH']:['OUTPUT']);
  const ziPingElements=ziPingFactors.map(k=>ELEMENT_BY_TEN_GOD_GROUP[k][dm]);
  const season=chart.monthCommand?.season;
  const tiaohou=(season==='WINTER'||season==='LATE_WINTER')?['FIRE']:(season==='SUMMER'||season==='LATE_SUMMER')?['WATER']:[];
  return {
    reportingAuthority:'SCHOOL_QUALIFIED_SYNTHESIS_R2',
    primaryReportUse:{
      usefulGod:ziPingElements[0]||null,
      supportingElements:ziPingElements.slice(1),
      basis:weakSide?'DAY_MASTER_SUPPORT_REQUIRED_WITHIN_ESTABLISHED_PATTERN_PATH':'ESTABLISHED_PATTERN_OPERATIVE_FACTOR'
    },
    schoolViews:[
      {schoolCode:'ZI_PING_MONTH_COMMAND_USE_R2',factorClasses:ziPingFactors,elementCandidates:ziPingElements,state:'ESTABLISHED'},
      {schoolCode:'DI_TIAN_SUI_TI_YONG_BALANCE_R2',factorClasses:weakSide?['RESOURCE','PEER']:['OUTPUT','WEALTH','OFFICER'],elementCandidates:(weakSide?['RESOURCE','PEER']:['OUTPUT','WEALTH','OFFICER']).map(k=>ELEMENT_BY_TEN_GOD_GROUP[k][dm]),state:'ESTABLISHED_DIRECTION'},
      {schoolCode:'DI_TIAN_SUI_TIAOHOU_R2',factorClasses:[],elementCandidates:tiaohou,state:tiaohou.length?'CLIMATE_CANDIDATE_ESTABLISHED':'NO_DOMINANT_THERMAL_CANDIDATE'}
    ],
    silentCrossSchoolMerge:false
  };
}

export async function analyzeBaziFinalStructuralVerdictR2({chart,relationships,strengthSeasonal,patterns}={}){
  if(chart?.schemaVersion!=='PHI-OS-BAZI-CANONICAL-CHART-IR-v1.0.0')fail('BAZI_FP_R2_CHART_REQUIRED');
  if(relationships?.schemaVersion!=='PHI-OS-BAZI-STEM-BRANCH-RELATIONSHIPS-v1.0.0')fail('BAZI_FP_R2_RELATIONSHIPS_REQUIRED');
  if(strengthSeasonal?.schemaVersion!=='PHI-OS-BAZI-STRENGTH-SEASONAL-EVIDENCE-v1.0.0')fail('BAZI_FP_R2_STRENGTH_EVIDENCE_REQUIRED');
  if(patterns?.schemaVersion!=='PHI-OS-BAZI-PATTERN-CANDIDATE-IR-v1.0.0')fail('BAZI_FP_R2_PATTERN_CANDIDATES_REQUIRED');
  const snapshots=[chart,relationships,strengthSeasonal,patterns].map(stableSerialize);
  const relationshipVerdicts=threeHarmonyVerdict(relationships);
  const strength=strengthVerdict({chart,strengthSeasonal,relationshipVerdicts});
  const pattern=patternVerdict({chart,patterns,strength});
  const usefulGod=usefulGodVerdict({chart,strength,pattern});
  const base={
    schemaVersion:BAZI_FINAL_STRUCTURAL_VERDICT_R2_SCHEMA,
    runtimeVersion:BAZI_FINAL_STRUCTURAL_VERDICT_R2_VERSION,
    work:'BAZI-FP-R2',
    sourceChartDigest:chart.chartDigest,
    relationshipVerdicts,
    strength,
    pattern,
    usefulGod,
    authority:{
      contractRef:'content/professional/bzr-production/contracts/bazi-final-structural-verdict-r2-v1.json',
      patternRulesetRef:'content/interpretation/bazi/rulesets/bazi-pattern-ruleset-v2.json',
      ziPingUseRulesetRef:'content/interpretation/bazi/rulesets/bazi-zi-ping-month-command-use-ruleset-v2.json',
      tiYongRulesetRef:'content/interpretation/bazi/rulesets/bazi-di-tian-sui-ti-yong-ruleset-v2.json',
      tiaohouRulesetRef:'content/interpretation/bazi/rulesets/bazi-di-tian-sui-tiaohou-ruleset-v2.json'
    },
    boundaries:{
      schoolQualified:true,
      crossSchoolSilentMerge:false,
      eventPredictionCreated:false,
      goodBadScoreCreated:false,
      originalBranchContentsErased:false
    }
  };
  const verdictDigest=await sha256(base);
  const current=[chart,relationships,strengthSeasonal,patterns].map(stableSerialize);
  if(current.some((x,i)=>x!==snapshots[i]))fail('BAZI_FP_R2_INPUT_MUTATION_FORBIDDEN');
  return freeze({...base,verdictDigest});
}

export default Object.freeze({analyzeBaziFinalStructuralVerdictR2});
