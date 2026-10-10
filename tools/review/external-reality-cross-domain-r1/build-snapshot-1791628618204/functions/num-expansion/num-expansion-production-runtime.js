import {freezeDeep,reduceSingle,NAME_ALPHABET_SYSTEM,NAME_NORMALIZATION_POLICY} from './num-expansion-rules.js';
import {buildNumEnergyHologram} from './num-energy-hologram-runtime.js';
import {buildNumDigitDistribution} from './num-digit-distribution-runtime.js';
import {buildNumEnergyGrouping} from './num-energy-grouping-runtime.js';
import {calculateNumNameProfile} from './num-name-runtime.js';
import {calculateLearningCorpusPinnacleChallenge} from './num-pinnacle-challenge-crosscheck.js';
import {recoverLifePeriod} from './num-life-period-recovery.js';
import {resolveAlternativeTimingPhase} from './num-alternative-timing-runtime.js';
import {buildNumRelationshipStructure} from './num-relationship-runtime.js';
import {composeNumExpansion} from './num-expansion-composer.js';

export const NUM_EXPANSION_PRODUCTION_SCHEMA='PHI-OS-NUM-R18-EXPANSION-PRODUCTION-IR-v1.0.0';
function fail(code){const e=new Error(code);e.code=code;throw e}
function values(projection){return new Map((projection?.calculation?.values||[]).map(x=>[x.code,x]))}
function single(v){return v==null?null:reduceSingle(v).reducedValue}
function frequencyFromProjection(projection){
 const structure=(projection?.calculation?.structures||[]).find(x=>x.code==='DIGIT_FREQUENCY');if(!structure)return null;
 const out={};for(let n=1;n<=9;n++){const x=(structure.items||[]).find(i=>i.code===`DIGIT_${n}`);out[n]=Number(x?.value||0)}return out;
}
function bindBirthDate(projection,birthDate){
 const triangle=buildNumEnergyHologram({birthDate});const map=values(projection);
 const expected={LIFE_PATH:triangle.positions.O,BIRTHDAY_NUMBER:triangle.positions.I,ATTITUDE_NUMBER:triangle.positions.M,BIRTH_YEAR_NUMBER:triangle.positions.N,BIRTH_MONTH_NUMBER:triangle.positions.J,BIRTH_DAY_NUMBER:triangle.positions.I};
 const compared=[];for(const [role,want] of Object.entries(expected)){const row=map.get(role);if(!row||row.value==null)continue;const got=single(row.value);compared.push({role,projectionSingle:got,birthDateSingle:want});if(got!==want)fail('NUM_R18_EXPANSION_BIRTH_DATE_LINEAGE_MISMATCH')}
 if(compared.length<3)fail('NUM_R18_EXPANSION_BIRTH_DATE_LINEAGE_INSUFFICIENT');
 return freezeDeep({bound:true,compared,triangle});
}
function clean(v){return typeof v==='string'?v.trim():''}
function identityFrom(input){
 const fullBirthName=clean(input?.fullBirthName);if(!fullBirthName)return null;
 return {fullBirthName,customerConfirmed:input?.customerConfirmed===true,alphabetSystemId:input?.alphabetSystemId||NAME_ALPHABET_SYSTEM,nameNormalizationPolicy:input?.nameNormalizationPolicy||NAME_NORMALIZATION_POLICY};
}
export function buildNumExpansionProductionIR({projection,expansionInput={}}={}){
 if(projection?.method?.publicMethodCode!=='NUMEROLOGY_PROJECTION')fail('NUM_R18_NUM_PROJECTION_REQUIRED');
 const birthDate=clean(expansionInput?.birthDate);const targetDate=clean(expansionInput?.targetDate);const comparisonBirthDate=clean(expansionInput?.relationship?.comparisonBirthDate);
 const inputFrequency=frequencyFromProjection(projection);
 const digitDistribution=inputFrequency?buildNumDigitDistribution({frequency:inputFrequency,inputScope:'CANONICAL_PROJECTION_DIGIT_FREQUENCY'}):null;
 const energyGrouping=digitDistribution?buildNumEnergyGrouping({frequency:digitDistribution.frequency,inputScope:'CANONICAL_PROJECTION_DIGIT_FREQUENCY'}):null;
 let binding=null,pinnacleCrosscheck=null,lifePeriod=null,alternativeTiming=null,nameProfile=null,relationship=null;
 if(birthDate){
   binding=bindBirthDate(projection,birthDate);pinnacleCrosscheck=calculateLearningCorpusPinnacleChallenge({birthDate});lifePeriod=recoverLifePeriod({birthDate});
   if(targetDate)alternativeTiming=resolveAlternativeTimingPhase({birthDate,targetDate});
   const identity=identityFrom(expansionInput?.identityInput);
   if(identity?.customerConfirmed===true){const lp=values(projection).get('LIFE_PATH')?.value;nameProfile=calculateNumNameProfile({identityInput:identity,lifePathValue:lp})}
   if(comparisonBirthDate)relationship=buildNumRelationshipStructure({left:{ref:'PRIMARY',birthDate},right:{ref:'COMPARISON',birthDate:comparisonBirthDate}});
 }
 const composition=composeNumExpansion({digitDistribution,nameProfile,pinnacleCrosscheck,lifePeriod,energyGrouping,alternativeTiming,relationship});
 const nameAvailability=nameProfile?'AVAILABLE':clean(expansionInput?.identityInput?.fullBirthName)?'BLOCKED_NAME_CONFIRMATION_REQUIRED':'NOT_REQUESTED';
 return freezeDeep({schemaVersion:NUM_EXPANSION_PRODUCTION_SCHEMA,workCode:'NUM-R18',publicationState:'CUSTOMER_PUBLISHABLE',customerPublishable:true,runtimeUseAllowed:true,
  inputLineage:{birthDateProvided:Boolean(birthDate),birthDateBoundToProjection:binding?.bound===true,targetDateProvided:Boolean(targetDate),nameInputState:nameAvailability,comparisonBirthDateProvided:Boolean(comparisonBirthDate)},
  sections:composition.sections,evidence:composition.evidence,deduplication:composition.deduplication,
  availability:{digitDistribution:digitDistribution?'AVAILABLE':'UNAVAILABLE_PROJECTION_STRUCTURE',energyGrouping:energyGrouping?'AVAILABLE':'UNAVAILABLE_PROJECTION_STRUCTURE',nameNumbers:nameAvailability,pinnacleChallenge:pinnacleCrosscheck?'AVAILABLE':'BIRTH_DATE_CONTEXT_REQUIRED',lifePeriod:lifePeriod?'AVAILABLE':'BIRTH_DATE_CONTEXT_REQUIRED',alternativeTiming:alternativeTiming?'AVAILABLE':targetDate?'BIRTH_DATE_CONTEXT_REQUIRED':'TARGET_DATE_NOT_SUPPLIED',relationship:relationship?'AVAILABLE':comparisonBirthDate?'BIRTH_DATE_CONTEXT_REQUIRED':'NOT_REQUESTED'},
  boundaries:{...composition.boundaries,birthDateNotPersisted:true,nameNotPersisted:true,comparisonBirthDateNotPersisted:true,formulaAuthorityDoesNotEqualEmpiricalValidity:true},state:'NUM_R18_FULL_PRODUCTION_ACTIVE'});
}
export default Object.freeze({buildNumExpansionProductionIR});
