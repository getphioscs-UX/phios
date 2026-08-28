export const NUM_EXPANSION_SCHEMA='PHI-OS-NUM-R9-R18-EXPANSION-RULES-v1.0.0';
export const NUM_EXPANSION_VERSION='1.0.0';
export const NUM_EXPANSION_BASELINE='d576387f33e2a1ca76f196dba5059e15499d1b4d';
export const NUM_EXPANSION_SCHOOL='ENERGY_NUMEROLOGY_LEARNING_RECONSTRUCTED_V1';
export const NUM_EXPANSION_SOURCE='USER_LEARNING_CORPUS_NUMEROLOGY_PDF_V1';
export const NAME_ALPHABET_SYSTEM='PYTHAGOREAN_LATIN_1_9_V1';
export const NAME_NORMALIZATION_POLICY='ASCII_LATIN_LETTERS_ONLY_V1';
export const ENERGY_AXES=Object.freeze({
  THINKING_147:Object.freeze([1,4,7]),
  FEELING_258:Object.freeze([2,5,8]),
  VISION_369:Object.freeze([3,6,9]),
  ACTIVE_ODD:Object.freeze([1,3,5,7,9]),
  PASSIVE_EVEN:Object.freeze([2,4,6,8])
});
export const ENERGY_ELEMENT_GROUPS=Object.freeze({
  METAL:Object.freeze([1,6]),
  WATER:Object.freeze([2,7]),
  FIRE:Object.freeze([3,8]),
  WOOD:Object.freeze([4,9]),
  EARTH:Object.freeze([5])
});
export const ALTERNATIVE_PHASES=Object.freeze([
  Object.freeze({phaseCode:'FEB_MAY',months:Object.freeze([2,3,4,5])}),
  Object.freeze({phaseCode:'JUN_SEP',months:Object.freeze([6,7,8,9])}),
  Object.freeze({phaseCode:'OCT_JAN',months:Object.freeze([10,11,12,1])})
]);
export function digitSum(value){return String(Math.abs(Number(value)||0)).split('').reduce((a,b)=>a+Number(b),0)}
export function reduceSingle(rawValue){
  let current=Math.abs(Number(rawValue));
  if(!Number.isFinite(current))throw new TypeError('NUM_EXPANSION_INVALID_NUMBER');
  const steps=[current];
  while(current>9){current=digitSum(current);steps.push(current)}
  return Object.freeze({rawValue:Number(rawValue),reductionSteps:Object.freeze(steps),reducedValue:current,intermediateMasterNumbers:Object.freeze(steps.filter((x,i)=>i<steps.length-1&&[11,22,33].includes(x)))});
}
export function freezeDeep(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freezeDeep(child)}return value}
