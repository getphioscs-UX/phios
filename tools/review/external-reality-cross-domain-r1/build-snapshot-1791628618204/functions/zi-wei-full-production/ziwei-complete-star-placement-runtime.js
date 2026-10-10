import {sha256Stable} from '../zi-wei-runtime/zwr-utils.js';
import {BRANCH_ORDER,FP_EXTENSION_STARS,STAR_ZH,STAR_CLASS,branchIndex,branchAt} from './ziwei-structural-registry.js';

export const ZIWEI_COMPLETE_STAR_PLACEMENT_SCHEMA='PHI-OS-ZIWEI-COMPLETE-STAR-PLACEMENT-v1.0.0';
const LU_CUN_BY_STEM=Object.freeze({JIA:'YIN',YI:'MAO',BING:'SI',DING:'WU',WU:'SI',JI:'WU',GENG:'SHEN',XIN:'YOU',REN:'HAI',GUI:'ZI'});
const TIAN_MA_BY_YEAR_BRANCH=Object.freeze({YIN:'SHEN',WU:'SHEN',XU:'SHEN',SHEN:'YIN',ZI:'YIN',CHEN:'YIN',SI:'HAI',YOU:'HAI',CHOU:'HAI',HAI:'SI',MAO:'SI',WEI:'SI'});
const FIRE_BELL_START=Object.freeze({
 YIN:{HUO_XING:'CHOU',LING_XING:'MAO'},WU:{HUO_XING:'CHOU',LING_XING:'MAO'},XU:{HUO_XING:'CHOU',LING_XING:'MAO'},
 SHEN:{HUO_XING:'YIN',LING_XING:'XU'},ZI:{HUO_XING:'YIN',LING_XING:'XU'},CHEN:{HUO_XING:'YIN',LING_XING:'XU'},
 SI:{HUO_XING:'MAO',LING_XING:'XU'},YOU:{HUO_XING:'MAO',LING_XING:'XU'},CHOU:{HUO_XING:'MAO',LING_XING:'XU'},
 HAI:{HUO_XING:'YOU',LING_XING:'XU'},MAO:{HUO_XING:'YOU',LING_XING:'XU'},WEI:{HUO_XING:'YOU',LING_XING:'XU'}
});
function fail(code){const e=new Error(code);e.code=code;throw e;}
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v;}
function derive(chart){
 const stem=chart?.birthAuthority?.birthYear?.stem,yearBranch=chart?.birthAuthority?.birthYear?.branch,hourIndex=chart?.birthAuthority?.birthHour?.index;
 if(!stem||!yearBranch||!Number.isInteger(hourIndex))fail('ZIWEI_FP_W3_BIRTH_YEAR_AND_HOUR_AUTHORITY_REQUIRED');
 const lu=LU_CUN_BY_STEM[stem];if(!lu)fail('ZIWEI_FP_W3_LU_CUN_AUTHORITY_UNAVAILABLE');
 const starts=FIRE_BELL_START[yearBranch],ma=TIAN_MA_BY_YEAR_BRANCH[yearBranch];if(!starts||!ma)fail('ZIWEI_FP_W3_YEAR_BRANCH_AUTHORITY_UNAVAILABLE');
 return {
  LU_CUN:{branch:lu,basis:'LUNAR_BIRTH_YEAR_STEM',ruleCode:'QILU_YEAR_STEM_V1'},
  QING_YANG:{branch:branchAt(branchIndex(lu)+1),basis:'ONE_PALACE_FORWARD_FROM_LU_CUN',ruleCode:'QING_YANG_AFTER_LU_CUN_V1'},
  TUO_LUO:{branch:branchAt(branchIndex(lu)-1),basis:'ONE_PALACE_BACKWARD_FROM_LU_CUN',ruleCode:'TUO_LUO_BEFORE_LU_CUN_V1'},
  HUO_XING:{branch:branchAt(branchIndex(starts.HUO_XING)+hourIndex),basis:'YEAR_BRANCH_GROUP_START_PLUS_BIRTH_HOUR_FORWARD',ruleCode:'FIRE_STAR_YEAR_BRANCH_HOUR_V1'},
  LING_XING:{branch:branchAt(branchIndex(starts.LING_XING)+hourIndex),basis:'YEAR_BRANCH_GROUP_START_PLUS_BIRTH_HOUR_FORWARD',ruleCode:'BELL_STAR_YEAR_BRANCH_HOUR_V1'},
  DI_KONG:{branch:branchAt(branchIndex('HAI')-hourIndex),basis:'HAI_START_REVERSE_BY_BIRTH_HOUR',ruleCode:'EARTH_VOID_FROM_HAI_REVERSE_HOUR_V1'},
  DI_JIE:{branch:branchAt(branchIndex('HAI')+hourIndex),basis:'HAI_START_FORWARD_BY_BIRTH_HOUR',ruleCode:'EARTH_ROBBERY_FROM_HAI_FORWARD_HOUR_V1'},
  TIAN_MA:{branch:ma,basis:'LUNAR_BIRTH_YEAR_BRANCH_TRINE',ruleCode:'TIAN_MA_YEAR_BRANCH_TRINE_V1'}
 };
}
export function calculateZiweiCompleteStarPlacement({chart}={}){
 if(chart?.schemaVersion!=='PHI-OS-ZIWEI-CANONICAL-CHART-IR-v1.0.0')fail('ZIWEI_FP_W3_CANONICAL_CHART_REQUIRED');
 const derived=derive(chart),palaceByBranch=new Map(chart.palaces.map(x=>[x.branch,x]));
 const existing=chart.stars.map(s=>({...s,authorityTier:'CURRENT_PRODUCTION_FROZEN',placementAuthority:'REUSED_FROM_CANONICAL_PROJECTION'}));
 const extensionStars=FP_EXTENSION_STARS.map(starCode=>{const x=derived[starCode],palace=palaceByBranch.get(x.branch);return {starCode,zh:STAR_ZH[starCode],branch:x.branch,branchZh:palace?.branchZh||x.branch,palaceCode:palace?.palaceCode||null,palaceZh:palace?.zh||null,starClass:STAR_CLASS[starCode],basis:x.basis,ruleCode:x.ruleCode,authorityTier:'FULL_PRODUCTION_ENGINEERING_SUCCESSOR',sourceAdmissionState:'PENDING_HUMAN_ADMISSION',productionEligible:false};});
 const allStars=[...existing,...extensionStars];if(allStars.length!==28||new Set(allStars.map(x=>x.starCode)).size!==28)fail('ZIWEI_FP_W3_PLATFORM_BASELINE_28_STAR_INVARIANT_FAILED');
 const base={schemaVersion:ZIWEI_COMPLETE_STAR_PLACEMENT_SCHEMA,work:'ZIWEI-FP-W3',runtimeVersion:'1.0.0',scopeCode:'PLATFORM_BASELINE_28_STARS_V1',sourceChartDigest:chart.chartDigest,currentProductionStarCount:existing.length,extensionStarCount:extensionStars.length,totalStarCount:allStars.length,existingStars:existing,extensionStars,allStars,coverage:{fourteenMainStars:true,currentSixSupportStars:true,luCun:true,sixMalefics:true,tianMa:true,otherMiscStars:false},authority:{current20:'HUMAN_FROZEN_REUSED',extension8:'ENGINEERING_RULES_SOURCE_ADMISSION_PENDING',schoolAuthorityRef:'content/professional/zi-wei-full-production/authority/ziwei-fp-w2-school-calculation-authority-v1.json'},boundaries:{sourceChartMutated:false,currentProductionProjectionMutated:false,currentProductionStarScopeChanged:false,secondProjectionAuthorityCreated:false,interpretationCreated:false,goodBadScoreCreated:false,productionEligible:false}};
 return freeze({...base,placementDigest:sha256Stable(base)});
}
export const _test=Object.freeze({LU_CUN_BY_STEM,TIAN_MA_BY_YEAR_BRANCH,FIRE_BELL_START,BRANCH_ORDER});
export default Object.freeze({calculateZiweiCompleteStarPlacement});
