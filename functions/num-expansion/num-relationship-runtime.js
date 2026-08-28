import {ENERGY_ELEMENT_GROUPS,freezeDeep} from './num-expansion-rules.js';
export const NUM_RELATIONSHIP_SCHEMA='PHI-OS-NUM-R16-RELATIONSHIP-STRUCTURE-v1.0.0';
function present(f){return Array.from({length:9},(_,i)=>i+1).filter(n=>Number(f?.[n]||0)>0)}
function missing(f){return Array.from({length:9},(_,i)=>i+1).filter(n=>Number(f?.[n]||0)===0)}
function elementPresence(f){return Object.fromEntries(Object.entries(ENERGY_ELEMENT_GROUPS).map(([k,g])=>[k,g.filter(n=>Number(f?.[n]||0)>0)]))}
export function buildNumRelationshipStructure({left,right}={}){
 if(!left?.frequency||!right?.frequency)throw new TypeError('NUM_R16_TWO_FREQUENCY_PROFILES_REQUIRED');
 const lp=present(left.frequency),rp=present(right.frequency),lm=missing(left.frequency),rm=missing(right.frequency);
 const shared=lp.filter(n=>rp.includes(n));const mutualMissing=lm.filter(n=>rm.includes(n));
 return freezeDeep({schemaVersion:NUM_RELATIONSHIP_SCHEMA,workCode:'NUM-R16',leftRef:left.ref||'LEFT',rightRef:right.ref||'RIGHT',sharedPresentDigits:shared,mutualMissingDigits:mutualMissing,leftOnlyDigits:lp.filter(n=>!rp.includes(n)),rightOnlyDigits:rp.filter(n=>!lp.includes(n)),elementPresence:{left:elementPresence(left.frequency),right:elementPresence(right.frequency)},relationshipNumber:{availability:'BLOCKED_FORMULA_NOT_RECOVERED'},compatibilityJudgmentCreated:false,relationshipOutcomePredicted:false,state:'STRUCTURAL_COMPARISON_READY_R18_ADMISSION_PENDING'});
}
export default Object.freeze({buildNumRelationshipStructure});
