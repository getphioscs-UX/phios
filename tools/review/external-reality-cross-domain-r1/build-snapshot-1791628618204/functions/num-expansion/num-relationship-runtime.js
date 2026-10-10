import {ENERGY_ELEMENT_GROUPS,freezeDeep,reduceSingle} from './num-expansion-rules.js';
import {buildNumEnergyHologram} from './num-energy-hologram-runtime.js';
import {buildNumDigitDistribution} from './num-digit-distribution-runtime.js';
export const NUM_RELATIONSHIP_SCHEMA='PHI-OS-NUM-R16-RELATIONSHIP-STRUCTURE-v2.0.0';
function present(f){return Array.from({length:9},(_,i)=>i+1).filter(n=>Number(f?.[n]||0)>0)}
function missing(f){return Array.from({length:9},(_,i)=>i+1).filter(n=>Number(f?.[n]||0)===0)}
function elementPresence(f){return Object.fromEntries(Object.entries(ENERGY_ELEMENT_GROUPS).map(([k,g])=>[k,g.filter(n=>Number(f?.[n]||0)>0)]))}
function profile(side,label){
  if(!side||typeof side!=='object')throw new TypeError(`NUM_R16_${label}_PROFILE_REQUIRED`);
  let frequency=side.frequency||null;let mainNumber=side.mainNumber??null;let birthDate=side.birthDate||null;
  if(birthDate){
    const triangle=buildNumEnergyHologram({birthDate});mainNumber=triangle.mainNumber;
    if(!frequency)frequency=buildNumDigitDistribution({digits:birthDate.replace(/\D/g,'').split('').map(Number),inputScope:'CANONICAL_BIRTH_DATE_DIGITS'}).frequency;
  }
  if(!frequency)throw new TypeError(`NUM_R16_${label}_FREQUENCY_REQUIRED`);
  const reducedMain=mainNumber==null?null:reduceSingle(mainNumber).reducedValue;
  return Object.freeze({ref:side.ref||label,birthDate,frequency,mainNumber:reducedMain});
}
export function buildNumRelationshipStructure({left,right}={}){
 const l=profile(left,'LEFT'),r=profile(right,'RIGHT');const lp=present(l.frequency),rp=present(r.frequency),lm=missing(l.frequency),rm=missing(r.frequency);
 const shared=lp.filter(n=>rp.includes(n));const mutualMissing=lm.filter(n=>rm.includes(n));
 const relationshipNumber=l.mainNumber!=null&&r.mainNumber!=null?freezeDeep({availability:'AVAILABLE',formula:'reduceSingle(left.mainNumber + right.mainNumber)',leftMainNumber:l.mainNumber,rightMainNumber:r.mainNumber,...reduceSingle(l.mainNumber+r.mainNumber),runtimeUseAllowed:true}):freezeDeep({availability:'BLOCKED_MAIN_NUMBERS_REQUIRED',runtimeUseAllowed:false});
 return freezeDeep({schemaVersion:NUM_RELATIONSHIP_SCHEMA,workCode:'NUM-R16',schoolAuthorityId:'ENERGY_NUMEROLOGY_LEARNING_RECONSTRUCTED_V1',leftRef:l.ref,rightRef:r.ref,
  sharedPresentDigits:shared,mutualMissingDigits:mutualMissing,leftOnlyDigits:lp.filter(n=>!rp.includes(n)),rightOnlyDigits:rp.filter(n=>!lp.includes(n)),elementPresence:{left:elementPresence(l.frequency),right:elementPresence(r.frequency)},
  relationshipNumber,relationshipNumberMeaningAuthorityGranted:false,compatibilityScoreCreated:false,compatibilityJudgmentCreated:false,relationshipOutcomePredicted:false,
  runtimeUseAllowed:true,customerPublishable:true,state:'STRUCTURAL_RELATIONSHIP_RUNTIME_ACTIVE'});
}
export default Object.freeze({buildNumRelationshipStructure});
