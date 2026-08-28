import {ENERGY_AXES,ENERGY_ELEMENT_GROUPS,freezeDeep} from './num-expansion-rules.js';
export const NUM_ENERGY_GROUPING_SCHEMA='PHI-OS-NUM-R14-ENERGY-GROUPING-v1.0.0';
function count(group,f){return group.reduce((s,n)=>s+Number(f[n]||0),0)}
export function buildNumEnergyGrouping({frequency,inputScope='SUPPLIED_DIGIT_FREQUENCY'}={}){
 if(!frequency||typeof frequency!=='object')throw new TypeError('NUM_R14_FREQUENCY_REQUIRED');
 const axes=Object.fromEntries(Object.entries(ENERGY_AXES).map(([code,group])=>[code,{digits:group,count:count(group,frequency)}]));
 const elements=Object.fromEntries(Object.entries(ENERGY_ELEMENT_GROUPS).map(([code,group])=>[code,{digits:group,count:count(group,frequency)}]));
 return freezeDeep({schemaVersion:NUM_ENERGY_GROUPING_SCHEMA,workCode:'NUM-R14',inputScope,axes,elements,interpretationState:'UNADMITTED_LEARNING_SCHOOL_SEMANTICS',structuralCountsRuntimeReady:true,customerTraitInferenceAllowed:false,state:'STRUCTURAL_CANDIDATE_R18_ADMISSION_PENDING'});
}
export default Object.freeze({buildNumEnergyGrouping});
