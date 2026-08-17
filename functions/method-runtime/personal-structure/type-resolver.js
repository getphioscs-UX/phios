/** MIR-3 Type resolver from the defined-center graph. */
import {MOTOR_CENTERS,anyDefinedMotorHasPathToThroat} from './center-graph.js';
export function resolveType(graph){
  if(graph.definedCenters.length===0)return 'REFLECTOR';
  if(graph.definedCenters.includes('SACRAL')) return anyDefinedMotorHasPathToThroat(graph)?'MANIFESTING_GENERATOR':'GENERATOR';
  if(MOTOR_CENTERS.some(m=>graph.definedCenters.includes(m))&&anyDefinedMotorHasPathToThroat(graph)) return 'MANIFESTOR';
  return 'PROJECTOR';
}
export function resolveProjectorSubtype(graph,typeCode){if(typeCode!=='PROJECTOR')return null;const upper=new Set(['HEAD','AJNA','THROAT']);const mental=graph.definedCenters.length>0&&graph.definedCenters.every(c=>upper.has(c));if(mental)return 'MENTAL_PROJECTOR';const motor=MOTOR_CENTERS.some(m=>graph.definedCenters.includes(m));return motor?'ENERGY_PROJECTOR':'CLASSIC_PROJECTOR';}
