// Immutable JSON is bundled by Pages, never read through Node fs or a private binding.
import dictionary from '../../content/world/world-evidence-series-v1.json';
import snapshot from '../../content/world/world-evidence-observations-v1.json';
export const EVIDENCE_COUNTRIES=Object.freeze(['USA','MYS','CHN','JPN','GBR','EA','GLOBAL']);
export function evidenceRequest(input){
 if(Object.keys(input).some(k=>!['country','series','period'].includes(k))||Object.values(input).some(v=>typeof v!=='string'||v.length>40))throw Error('PUBLIC_ENUMS_ONLY');
 if(!EVIDENCE_COUNTRIES.includes(input.country)||!dictionary.series[input.series]||!(/^(?:19\d{2}|20\d{2}|2100)(?:-Q[1-4])?$/.test(input.period)||input.period==='GENERAL'))throw Error('EVIDENCE_INPUT_INVALID');
 return {country:input.country,series:input.series,period:input.period};
}
export function observationQuality(row,definition,query){
 if(row.countryCode!==query.country||row.seriesId!==query.series||!row.observationPeriod.startsWith(query.period))return 'DEFINITION_MISMATCH';
 if(row.unit!==definition.unit||row.frequency!==definition.frequency||row.populationOrInstitutionCoverage!==definition.populationOrInstitutionCoverage||row.measurementDefinition!==definition.measurementDefinition)return 'INCOMPARABLE';
 if(!['FEDERAL_PUBLIC_DATA','CC_BY_4_0'].includes(row.licenseState)||row.licenseState!==definition.licenseState)return 'NO_ACCESS';
 if(!definition.allowedRawHashes.includes(row.rawArtifactHash)||!definition.sourceUrls.includes(row.sourceUrl))return 'SOURCE_ERROR';
 if(row.value===null)return row.qualityState==='OBSERVED'?'SOURCE_ERROR':row.qualityState;
 if(typeof row.value!=='number'||!Number.isFinite(row.value)||row.value<0)return 'SOURCE_ERROR';
 if(!['OBSERVED','NO_RELEASE','NO_ACCESS','MISSING_PERIOD','DEFINITION_MISMATCH','INCOMPARABLE','SOURCE_ERROR','STALE'].includes(row.qualityState))return 'SOURCE_ERROR';
 return row.qualityState;
}
export function calculateHmda(rows){
 const counts=Object.fromEntries(rows.map(r=>[r.actionCode,r.value]));
 if(rows.length!==3||Object.keys(counts).length!==3||![1,2,3].every(k=>Number.isSafeInteger(counts[k])&&counts[k]>=0))throw Error('ACTION_COUNTS_INVALID');
 const denominator=counts[1]+counts[2]+counts[3];if(!denominator||!Number.isSafeInteger(denominator))throw Error('ZERO_OR_UNSAFE_DENOMINATOR');
 return {metric:'denial_share_in_defined_hmda_scope',value:counts[3]/denominator,unit:'share',numerator:counts[3],denominator,formula:'action3 / (action1 + action2 + action3)',actionCounts:counts,loanPurpose:1,excludedActions:[4,5,6,7,8],population:'Reported home-purchase action records; not unique applicants or a matched application cohort'};
}
export function readWorldEvidence(input,{definitions=dictionary,snapshots=snapshot,now=()=>new Date().toISOString()}={}){
 const query=evidenceRequest(input),definition=definitions.series[query.series];
 const result={...query,state:'OBSERVED',definition,observations:[],derivedMetrics:[],explanations:definitions.explanations,mechanismSources:definitions.mechanismSources,version:snapshots.vintage,computedAt:now(),providerUsed:false,accountDataUsed:false,limits:snapshots.limits};
 if(!definition)return {...result,state:'SOURCE_ERROR'};
 if(definition.countryCode!==query.country)return {...result,state:'DEFINITION_MISMATCH'};
 if(['MY_COHORT','MECHANISM','COMPARISON'].includes(query.series))return {...result,state:query.series==='COMPARISON'?'INCOMPARABLE':'NO_RELEASE',nullReason:query.series==='MY_COHORT'?'MATCHED_APPLICATION_COHORT_COUNTS_UNAVAILABLE':query.series==='COMPARISON'?'HARMONISED_DENOMINATOR_UNAVAILABLE':'GENERAL_EXPLANATION_ONLY'};
 const rows=snapshots.observations.filter(r=>r.seriesId===query.series&&r.observationPeriod.startsWith(query.period));
 if(!rows.length)return {...result,state:'MISSING_PERIOD'};
 for(const row of rows){const quality=observationQuality(row,definition,query);if(quality!=='OBSERVED')return {...result,state:quality,nullReason:'EVIDENCE_QUALITY_GATE'};}
 if(query.series==='US_HMDA'&&(JSON.stringify(definition.filters?.actions_taken)!=='[1,2,3]'||JSON.stringify(definition.filters?.loan_purposes)!=='[1]'))return {...result,state:'DEFINITION_MISMATCH'};
 result.observations=rows;
 try{
  if(query.series==='US_HMDA')result.derivedMetrics=[calculateHmda(rows)];
  if(query.series==='US_SLOOS')result.derivedMetrics=rows.map(r=>{
   if(!Number.isSafeInteger(r.respondentCount)||r.respondentCount<=0||!Number.isSafeInteger(r.oppositeCount)||r.oppositeCount<0||r.value+r.oppositeCount>r.respondentCount)throw Error('SURVEY_COUNTS_INVALID');
   return {metric:r.surveyMeasure==='standards'?'net_tightening':'net_stronger_demand',questionCode:r.questionCode,value:(r.value-r.oppositeCount)/r.respondentCount*100,unit:'percent_respondent_banks',numerator:r.value-r.oppositeCount,denominator:r.respondentCount,formula:r.surveyMeasure==='standards'?'(tightened - eased) / respondents * 100':'(stronger - weaker) / respondents * 100',positiveCount:r.value,oppositeCount:r.oppositeCount};
  });
 }catch{return {...result,state:'SOURCE_ERROR',observations:[],derivedMetrics:[],nullReason:'DERIVATION_INVALID'};}
 return result;
}
