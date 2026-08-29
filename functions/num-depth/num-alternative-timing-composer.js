import {freezeDeep,NUM_DEPTH_ENERGY_SCHOOL} from './num-depth-rules.js';import {buildNumEnergyPatternMeaningCandidate} from './num-energy-pattern-meaning-runtime.js';
export const NUM_D6_TIMING_SCHEMA='PHI-OS-NUM-D6-ALTERNATIVE-TIMING-COMPOSITION-CANDIDATE-v1.0.0';
export function composeNumAlternativeTimingMeaning({lifePeriod,alternativeTiming,locale='en'}={}){
 const periods=lifePeriod?.calculatedPatterns||[];const target=alternativeTiming?.targetDate||'';const year=Number(String(target).slice(0,4));const birthYear=Number(String(lifePeriod?.birthDate||'').slice(0,4));const age=Number.isFinite(year)&&Number.isFinite(birthYear)?year-birthYear:null;
 let baseline=null;if(age!=null){baseline=periods.find(x=>age>=x.startAge&&age<=x.endAge)||null}
 const flowPattern=alternativeTiming?.flowYear?.code||alternativeTiming?.flowYear?.flowYearCode||null;const phasePattern=alternativeTiming?.phasePattern?.canonicalPattern||alternativeTiming?.phasePattern?.displayPattern||null;
 const units=[baseline&&{role:'BASELINE_LIFE_PERIOD',pattern:baseline.pattern},flowPattern&&{role:'FLOW_YEAR',pattern:String(flowPattern)},phasePattern&&{role:'CURRENT_PHASE',pattern:String(phasePattern)}].filter(Boolean).map(x=>freezeDeep({...x,meaning:buildNumEnergyPatternMeaningCandidate({pattern:x.pattern,locale})}));
 const seen=new Map();for(const u of units){if(!seen.has(u.pattern))seen.set(u.pattern,[]);seen.get(u.pattern).push(u.role)}const echoes=[...seen.entries()].filter(([,roles])=>roles.length>1).map(([pattern,roles])=>freezeDeep({pattern,roles,code:'EXACT_PATTERN_ECHO'}));
 return freezeDeep({schemaVersion:NUM_D6_TIMING_SCHEMA,workCode:'NUM-D6',school:NUM_DEPTH_ENERGY_SCHOOL,targetDate:target||null,age,units,echoes,westernPersonalCycleMerged:false,reviewState:'PENDING_D8_HUMAN_ADMISSION',runtimeUseAllowed:false,customerPublishable:false,boundaries:{eventPredictionAllowed:false,financialForecastAllowed:false,unknownMeaningInvented:false}})
}
