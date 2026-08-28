import {freezeDeep} from './num-expansion-rules.js';
export const NUM_EXPANSION_COMPOSITION_SCHEMA='PHI-OS-NUM-R17-EXPANSION-COMPOSITION-IR-v1.0.0';
function key(item){return JSON.stringify([item?.type,item?.code,item?.digit,item?.value,item?.phaseCode,item?.role])}
export function composeNumExpansion({digitDistribution,nameProfile,pinnacleCrosscheck,lifePeriod,energyGrouping,alternativeTiming,relationship}={}){
 const evidence=[];
 if(digitDistribution){for(const x of digitDistribution.repeatedDigits||[])evidence.push({type:'REPEATED_DIGIT',digit:x.digit,value:x.count});for(const digit of digitDistribution.missingDigits||[])evidence.push({type:'MISSING_DIGIT',digit})}
 if(nameProfile){for(const [code,v] of Object.entries(nameProfile.values||{}))evidence.push({type:'NAME_NUMBER',code,value:v.reducedValue,rawValue:v.rawValue})}
 if(pinnacleCrosscheck){(pinnacleCrosscheck.pinnacles||[]).forEach((value,i)=>evidence.push({type:'PINNACLE_VALUE',code:`P${i+1}`,value}));(pinnacleCrosscheck.challenges||[]).forEach((value,i)=>evidence.push({type:'CHALLENGE_VALUE',code:`C${i+1}`,value}))}
 if(alternativeTiming)evidence.push({type:'ALT_TIMING_PHASE',phaseCode:alternativeTiming.phaseCode});
 if(relationship){for(const digit of relationship.sharedPresentDigits||[])evidence.push({type:'RELATIONSHIP_SHARED_DIGIT',digit})}
 const seen=new Set();const deduped=[];for(const item of evidence){const k=key(item);if(seen.has(k))continue;seen.add(k);deduped.push(item)}
 return freezeDeep({schemaVersion:NUM_EXPANSION_COMPOSITION_SCHEMA,workCode:'NUM-R17',publicationState:'HUMAN_ADMISSION_PENDING',customerPublishable:false,runtimeUseAllowed:false,sections:{digitDistribution:digitDistribution||null,nameNumbers:nameProfile||null,pinnacleChallenge:pinnacleCrosscheck||null,lifePeriod:lifePeriod||null,energyGrouping:energyGrouping||null,alternativeTiming:alternativeTiming||null,relationship:relationship||null},evidence:deduped,deduplication:{before:evidence.length,after:deduped.length,suppressed:evidence.length-deduped.length},boundaries:{learningCorpusIsEmpiricalTruth:false,fortunePredictionCreated:false,healthClaimCreated:false,financialOutcomeClaimCreated:false,relationshipOutcomeClaimCreated:false,unresolvedFormulaInvented:false},state:'R17_ENGINEERING_READY_R18_PENDING'});
}
export default Object.freeze({composeNumExpansion});
