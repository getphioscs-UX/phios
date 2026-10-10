import {FIELD,assertUnits} from './bazi-deep-manuscript-contract.js';
export function buildBaziManuscriptSchema(units){
 assertUnits(units);const ids=[...new Set(units.map(u=>u.sectionId))];
 // anyOf enforces exact per-section recovery locales without healthy-language fields.
 return {type:'object',additionalProperties:false,required:['sections'],properties:{sections:{type:'array',minItems:ids.length,maxItems:ids.length,items:{anyOf:ids.map(id=>{const fields=units.filter(u=>u.sectionId===id).map(u=>FIELD[u.locale]);return {type:'object',additionalProperties:false,required:['sectionId',...fields],properties:{sectionId:{type:'string',enum:[id]},...Object.fromEntries(fields.map(f=>[f,{type:'string'}]))}};})}}}};
}
