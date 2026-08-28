import {reduceSingle,freezeDeep} from './num-expansion-rules.js';
export const NUM_PINNACLE_CROSSCHECK_SCHEMA='PHI-OS-NUM-R12-PINNACLE-CHALLENGE-CROSSCHECK-v1.0.0';
function parts(date){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date));if(!m)throw new TypeError('NUM_R12_DATE_REQUIRED');return {year:Number(m[1]),month:Number(m[2]),day:Number(m[3])}}
export function calculateLearningCorpusPinnacleChallenge({birthDate}={}){
  const p=parts(birthDate);const A=reduceSingle(p.month).reducedValue;const B=reduceSingle(p.day).reducedValue;const C=reduceSingle(p.year).reducedValue;const D=reduceSingle([...String(p.year),...String(p.month).padStart(2,'0'),...String(p.day).padStart(2,'0')].reduce((s,c)=>s+Number(c),0)).reducedValue;
  const E=reduceSingle(A+B).reducedValue,F=reduceSingle(B+C).reducedValue,G=reduceSingle(E+F).reducedValue,H=reduceSingle(A+C).reducedValue;
  const I=Math.abs(A-B),J=Math.abs(B-C),K=Math.abs(I-J),L=Math.abs(A-C);
  return freezeDeep({schemaVersion:NUM_PINNACLE_CROSSCHECK_SCHEMA,workCode:'NUM-R12',birthDate,base:{A,B,C,D},pinnacles:[E,F,G,H],challenges:[I,J,K,L],formulaRefs:{E:'A+B',F:'B+C',G:'E+F',H:'A+C',I:'ABS(A-B)',J:'ABS(B-C)',K:'ABS(I-J)',L:'ABS(A-C)'},ageBoundaryValidation:'NOT_SUPPORTED_BY_LEARNING_CORPUS_EVIDENCE',state:'FORMULA_VALUES_RECOVERED'});
}
export default Object.freeze({calculateLearningCorpusPinnacleChallenge});
