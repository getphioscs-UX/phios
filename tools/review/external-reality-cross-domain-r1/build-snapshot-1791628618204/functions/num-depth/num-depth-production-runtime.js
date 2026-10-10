import {freezeDeep,reducePreserveMaster,NUM_DEPTH_PRODUCTION_ACTIVE,NUM_DEPTH_WESTERN_SCHOOL,NUM_DEPTH_ENERGY_SCHOOL} from './num-depth-rules.js';
import {buildNumSecondaryChart} from './num-secondary-chart-runtime.js';
import {buildNumSecondaryRoleMeanings} from './num-secondary-role-meaning-runtime.js';
import {buildNumNameRoleMeaningCandidate} from './num-name-role-meaning-runtime.js';
import {buildHiddenPassionMeaningCandidate,buildKarmicLessonMeaningCandidate} from './num-missing-repeated-meaning-runtime.js';
import {buildNumLongCycleMeaningCandidate} from './num-long-cycle-meaning-runtime.js';
import {buildNumEnergyPatternMeaningCandidate} from './num-energy-pattern-meaning-runtime.js';
import {composeNumAlternativeTimingMeaning} from './num-alternative-timing-composer.js';
import {buildNumRelationshipMeaningCandidate} from './num-relationship-meaning-engine.js';
import {composeNumDepthCandidate} from './num-depth-composer.js';

export const NUM_D8_PRODUCTION_SCHEMA='PHI-OS-NUM-D8-DEPTH-PRODUCTION-IR-v1.0.0';
function mapValues(projection){return new Map((projection?.calculation?.values||[]).map(x=>[x.code,x]));}
function parseBirthDate(v){const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return null;return {year:Number(m[1]),month:Number(m[2]),day:Number(m[3])};}
function periodCycles(birthDate){
 const d=parseBirthDate(birthDate);if(!d)return [];
 return [
  {cycleNumber:1,component:'BIRTH_MONTH',rawValue:d.month,value:reducePreserveMaster(d.month).value},
  {cycleNumber:2,component:'BIRTH_DAY',rawValue:d.day,value:reducePreserveMaster(d.day).value},
  {cycleNumber:3,component:'BIRTH_YEAR',rawValue:d.year,value:reducePreserveMaster(d.year).value}
 ].map(x=>freezeDeep({...x,role:'PERIOD_CYCLE'}));
}
function longCycles(projection,birthDate,locale){
 const items=[];
 for(const x of periodCycles(birthDate)){const m=buildNumLongCycleMeaningCandidate({role:'PERIOD_CYCLE',value:x.value,locale});if(m)items.push(freezeDeep({...m,cycleNumber:x.cycleNumber,component:x.component,rawValue:x.rawValue}));}
 for(const x of projection?.calculation?.cycles||[]){
  if(!['PINNACLE_CYCLE','CHALLENGE_CYCLE'].includes(x.code))continue;
  const m=buildNumLongCycleMeaningCandidate({role:x.code,value:x.value,locale});if(m)items.push(freezeDeep({...m,cycleNumber:x.cycleNumber??null,startAge:x.startAge??null,endAge:x.endAge??null,rawValue:x.rawValue??null}));
 }
 return freezeDeep(items);
}
function uniqueEnergyMeanings(expansion,locale){
 const patterns=[];
 for(const x of expansion?.sections?.lifePeriod?.calculatedPatterns||[])patterns.push(x.pattern);
 const alt=expansion?.sections?.alternativeTiming;
 if(alt?.flowYear?.code)patterns.push(String(alt.flowYear.code));
 if(alt?.phasePattern?.canonicalPattern)patterns.push(String(alt.phasePattern.canonicalPattern));
 const out=[];const seen=new Set();
 for(const pattern of patterns){const m=buildNumEnergyPatternMeaningCandidate({pattern,locale});if(!m||seen.has(m.canonicalClaimPattern||pattern))continue;seen.add(m.canonicalClaimPattern||pattern);out.push(m);}
 return freezeDeep(out);
}
function nameDepth({projection,expansionInput,expansion,locale}){
 const identity=expansionInput?.identityInput;
 if(identity?.customerConfirmed!==true||!identity?.fullBirthName||!expansion?.sections?.nameNumbers)return freezeDeep({availability:'CONFIRMED_NAME_REQUIRED',secondaryChart:null,nameRoleMeanings:[],hiddenPassionMeanings:[],karmicLessonMeanings:[],secondaryRoleMeanings:[]});
 const vals=mapValues(projection),name=expansion.sections.nameNumbers;
 const secondary=buildNumSecondaryChart({
  fullBirthName:identity.fullBirthName,
  birthDayNumber:vals.get('BIRTHDAY_NUMBER')?.rawValue??vals.get('BIRTHDAY_NUMBER')?.value,
  lifePathValue:vals.get('LIFE_PATH')?.value,
  expressionValue:name.values?.expression?.reducedValue,
  soulUrgeValue:name.values?.soulUrge?.reducedValue,
  personalityValue:name.values?.personality?.reducedValue
 });
 if(secondary.availability!=='AVAILABLE')return freezeDeep({availability:secondary.availability,secondaryChart:secondary,nameRoleMeanings:[],hiddenPassionMeanings:[],karmicLessonMeanings:[],secondaryRoleMeanings:[]});
 const roles=[['EXPRESSION','expression'],['SOUL_URGE','soulUrge'],['PERSONALITY','personality'],['MATURITY','maturity']];
 const nameRoleMeanings=roles.map(([role,key])=>buildNumNameRoleMeaningCandidate({role,value:name.values?.[key]?.reducedValue,locale,secondaryChart:secondary,currentNameProfile:name})).filter(x=>x?.runtimeUseAllowed===true);
 const hiddenPassionMeanings=(secondary.hiddenPassions||[]).map(v=>buildHiddenPassionMeaningCandidate(v,{locale})).filter(Boolean);
 const karmicLessonMeanings=(secondary.karmicLessons||[]).map(v=>buildKarmicLessonMeaningCandidate(v,{locale})).filter(Boolean);
 const secondaryRoleMeanings=buildNumSecondaryRoleMeanings({secondaryChart:secondary,locale});
 return freezeDeep({availability:'AVAILABLE',secondaryChart:secondary,nameRoleMeanings,hiddenPassionMeanings,karmicLessonMeanings,secondaryRoleMeanings});
}
export function buildNumDepthProductionIR({projection,expansionInput={},expansion,locale='en'}={}){
 if(!NUM_DEPTH_PRODUCTION_ACTIVE)return freezeDeep({schemaVersion:NUM_D8_PRODUCTION_SCHEMA,state:'NUM_D8_NOT_ACTIVE',runtimeUseAllowed:false,customerPublishable:false});
 const birthDate=String(expansionInput?.birthDate||'').trim();
 const name=nameDepth({projection,expansionInput,expansion,locale});
 const longCycleMeanings=longCycles(projection,birthDate,locale);
 const alternativeTiming=(expansion?.sections?.lifePeriod&&expansion?.sections?.alternativeTiming)?composeNumAlternativeTimingMeaning({lifePeriod:expansion.sections.lifePeriod,alternativeTiming:expansion.sections.alternativeTiming,locale}):null;
 const energyPatternMeanings=uniqueEnergyMeanings(expansion,locale);
 const relationship=expansion?.sections?.relationship?buildNumRelationshipMeaningCandidate({left:{},right:{},energyRelationship:expansion.sections.relationship}):null;
 const composition=composeNumDepthCandidate({
  nameRoleMeanings:name.nameRoleMeanings,
  hiddenPassionMeanings:name.hiddenPassionMeanings,
  karmicLessonMeanings:name.karmicLessonMeanings,
  secondaryChart:name.secondaryChart,
  longCycleMeanings,
  alternativeTiming,
  relationship
 });
 return freezeDeep({
  schemaVersion:NUM_D8_PRODUCTION_SCHEMA,
  workCode:'NUM-D8',
  state:'NUM_D8_FULL_PRODUCTION_ACTIVE',
  publicationState:'CUSTOMER_PUBLISHABLE',
  runtimeUseAllowed:true,
  customerPublishable:true,
  schools:{western:NUM_DEPTH_WESTERN_SCHOOL,energy:NUM_DEPTH_ENERGY_SCHOOL},
  availability:{nameDepth:name.availability,longCycles:longCycleMeanings.length?'AVAILABLE':'BIRTH_DATE_CONTEXT_REQUIRED',energyPatterns:energyPatternMeanings.length?'SOURCE_WITNESSED_MEANINGS_AVAILABLE':'NO_ADMITTED_PATTERN_MATCH',alternativeTiming:alternativeTiming?'AVAILABLE':'TARGET_DATE_CONTEXT_REQUIRED',relationship:relationship?'STRUCTURAL_AVAILABLE':'NOT_REQUESTED'},
  sections:{
   nameRoleMeanings:name.nameRoleMeanings,
   hiddenPassionMeanings:name.hiddenPassionMeanings,
   karmicLessonMeanings:name.karmicLessonMeanings,
   secondaryChart:name.secondaryChart,
   secondaryRoleMeanings:name.secondaryRoleMeanings,
   longCycleMeanings,
   energyPatternMeanings,
   alternativeTiming,
   relationship,
   composition
  },
  semanticDepth:{D1:'HUMAN_ADMITTED',D2:'HUMAN_ADMITTED',D3:'HUMAN_ADMITTED_ROLE_LAYER',D4:'HUMAN_ADMITTED',D5:'HUMAN_ADMITTED_SOURCE_WITNESSED_ONLY',D6:'HUMAN_ADMITTED_COMPOSITION',D7:'HUMAN_ADMITTED_STRUCTURAL_NO_SCORE',D8:'HUMAN_ADMITTED_DEDUP_PRIORITY'},
  boundaries:{fortunePredictionCreated:false,compatibilityScoreCreated:false,empiricalTraitFactCreated:false,unknownEnergyPatternMeaningInvented:false,crossSchoolSilentMergeCreated:false,secondPersonWesternRoleComparisonRequiresSecondCanonicalProjection:true}
 });
}
export default Object.freeze({buildNumDepthProductionIR});
