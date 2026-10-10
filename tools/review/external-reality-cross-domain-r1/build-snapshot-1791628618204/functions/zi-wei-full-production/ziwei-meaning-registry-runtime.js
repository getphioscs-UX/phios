import {ZIWEI_FP_W11_MEANING_REGISTRY,assertZiweiMeaningAuthority} from './ziwei-meaning-authority-v1.js';
export const ZIWEI_FP_W11_MEANING_RUNTIME_VERSION='1.0.0';
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v;}
function fail(code){const e=new Error(code);e.code=code;throw e;}
const byCode=new Map(ZIWEI_FP_W11_MEANING_REGISTRY.items.map(x=>[x.meaningCode,x]));
const blocked=new Set(ZIWEI_FP_W11_MEANING_REGISTRY.coverage.blockedStandaloneStarCodes);
export function resolveZiweiMeaning(meaningCode,locale='zh-Hans'){
 assertZiweiMeaningAuthority();const x=byCode.get(meaningCode);if(!x)fail(`ZIWEI_FP_W11_MEANING_NOT_FOUND:${meaningCode}`);
 const label=x.label?.[locale]??x.label?.en??null,definition=x.definition?.[locale]??x.definition?.en??null;
 return freeze({meaningCode:x.meaningCode,meaningVersion:x.meaningVersion,kind:x.kind,sourceCode:x.sourceCode,meaningType:x.meaningType,label,definition,authorityClass:x.authorityClass,semanticDigest:x.semanticDigest,sourceRefs:x.sourceRefs,boundaries:x.boundaries||null});
}
export function resolveZiweiStandaloneStarMeaning(starCode,locale='zh-Hans'){
 const code=`CM-ZWR-STAR-${starCode}`;if(byCode.has(code))return freeze({state:'AVAILABLE',starCode,meaning:resolveZiweiMeaning(code,locale)});
 if(blocked.has(starCode))return freeze({state:'BLOCKED_SOURCE_MEANING_NOT_ADMITTED',starCode,meaning:null,reason:'W3_PLACEMENT_AND_W4_STATE_ADMISSION_DO_NOT_ESTABLISH_STANDALONE_INTERPRETIVE_SEMANTICS'});
 fail(`ZIWEI_FP_W11_UNKNOWN_STAR_MEANING_SCOPE:${starCode}`);
}
export function buildZiweiMeaningContext({chart,starStates,relationships,combinations,admittedPatterns,daXianIntegration=null,liuNianIntegration=null,locale='zh-Hans'}={}){
 assertZiweiMeaningAuthority();
 if(chart?.schemaVersion!=='PHI-OS-ZIWEI-CANONICAL-CHART-IR-v1.0.0')fail('ZIWEI_FP_W11_CANONICAL_CHART_REQUIRED');
 if(starStates?.schemaVersion!=='PHI-OS-ZIWEI-STAR-STATE-RESULT-v1.0.0')fail('ZIWEI_FP_W11_STAR_STATE_LINEAGE_REQUIRED');
 if(relationships?.schemaVersion!=='PHI-OS-ZIWEI-PALACE-RELATIONSHIP-ENGINE-v1.0.0'||relationships.sourceChartDigest!==chart.chartDigest)fail('ZIWEI_FP_W11_RELATIONSHIP_LINEAGE_REQUIRED');
 if(combinations?.schemaVersion!=='PHI-OS-ZIWEI-STAR-COMBINATION-RUNTIME-v1.0.0'||combinations.sourceChartDigest!==chart.chartDigest||combinations.sourceStarStateDigest!==starStates.stateDigest)fail('ZIWEI_FP_W11_COMBINATION_LINEAGE_REQUIRED');
 if(admittedPatterns?.schemaVersion!=='PHI-OS-ZIWEI-PATTERN-RUNTIME-v1.0.0'||admittedPatterns.ruleState!=='ADMITTED_TRADITIONAL_RULESET_ACTIVE')fail('ZIWEI_FP_W11_ADMITTED_PATTERN_REQUIRED');
 const bodyPalace=chart.palaces.find(x=>x.isBodyPalace);if(!bodyPalace)fail('ZIWEI_FP_W11_BODY_PALACE_REQUIRED');
 const palaceMeanings=chart.palaces.map(p=>freeze({palaceCode:p.palaceCode,meaning:resolveZiweiMeaning(`CM-ZWR-PALACE-${p.palaceCode}`,locale)}));
 const allStars=combinations.palaceCombinations.flatMap(p=>p.stars).filter((s,i,a)=>a.findIndex(x=>x.starCode===s.starCode)===i).sort((a,b)=>a.starCode.localeCompare(b.starCode));
 const starMeanings=allStars.map(s=>resolveZiweiStandaloneStarMeaning(s.starCode,locale));
 const stateMeanings=(starStates.stars||[]).map(s=>freeze({starCode:s.starCode,palaceCode:s.palaceCode,stateCode:s.state?.stateCode||'UNSPECIFIED',meaning:resolveZiweiMeaning(`CM-ZWR-STATE-${s.state?.stateCode||'UNSPECIFIED'}`,locale)}));
 const transformations=[...new Set(chart.transformations.map(x=>x.transformationCode))].sort().map(code=>resolveZiweiMeaning(`CM-ZWR-TRANSFORMATION-${code}`,locale));
 const relationCodes=['OPPOSITE','TRIAD','SAN_FANG_SI_ZHENG','FLANK','EMPTY_PALACE_OPPOSITE_REFERENCE'];
 const relationshipMeanings=relationCodes.map(code=>resolveZiweiMeaning(`CM-ZWR-RELATION-${code}`,locale));
 const patternMeanings=(admittedPatterns.traditionalPatterns||[]).map(p=>freeze({patternCode:p.patternCode,qualificationStatus:p.qualificationStatus,meaning:resolveZiweiMeaning(`CM-ZWR-PATTERN-${p.patternCode}`,locale)}));
 const temporalMeanings=[];
 if(daXianIntegration)temporalMeanings.push(resolveZiweiMeaning('CM-ZWR-TEMPORAL-DA_XIAN_DOMAIN',locale));
 if(liuNianIntegration){temporalMeanings.push(resolveZiweiMeaning('CM-ZWR-TEMPORAL-LIU_NIAN_DOMAIN',locale));temporalMeanings.push(resolveZiweiMeaning(liuNianIntegration.temporalFocus?.sameNatalDomainFocus?'CM-ZWR-TEMPORAL-LAYERED_DOMAIN_EMPHASIS':'CM-ZWR-TEMPORAL-DISTINCT_DOMAIN_EMPHASIS',locale));}
 return freeze({schemaVersion:'PHI-OS-ZIWEI-FP-W11-MEANING-CONTEXT-v1.0.0',work:'ZIWEI-FP-W11',registryVersion:ZIWEI_FP_W11_MEANING_REGISTRY.registryVersion,registryDigest:ZIWEI_FP_W11_MEANING_REGISTRY.registryDigest,locale,sourceChartDigest:chart.chartDigest,foundation:{lifePalace:{palaceCode:chart.lifePalace.palaceCode,domainMeaning:resolveZiweiMeaning(`CM-ZWR-PALACE-${chart.lifePalace.palaceCode}`,locale)},bodyPalace:{palaceCode:bodyPalace.palaceCode,domainMeaning:resolveZiweiMeaning(`CM-ZWR-PALACE-${bodyPalace.palaceCode}`,locale),emphasisMeaning:resolveZiweiMeaning('CM-ZWR-EMPHASIS-BODY_PALACE',locale)}},palaceMeanings,starMeanings,stateMeanings,transformations,relationshipMeanings,patternMeanings,temporalMeanings,coverage:{activeRegistryMeanings:ZIWEI_FP_W11_MEANING_REGISTRY.meaningCount,availableStandaloneStarMeanings:starMeanings.filter(x=>x.state==='AVAILABLE').length,blockedStandaloneStarMeanings:starMeanings.filter(x=>x.state!=='AVAILABLE').length,matchedPatternMeanings:patternMeanings.length,temporalMeaningCount:temporalMeanings.length},boundaries:{atomicMeaningIsFinding:false,atomicMeaningIsCustomerInterpretation:false,extensionStarFallbackInvented:false,patternOutcomeMeaningCreated:false,supportChallengeClassificationCreated:false,fortunePredictionCreated:false,eventPredictionCreated:false,professionalJudgmentCreated:false,customerCutoverAllowed:false}});
}
export default Object.freeze({resolveZiweiMeaning,resolveZiweiStandaloneStarMeaning,buildZiweiMeaningContext});
