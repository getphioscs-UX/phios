import {freezeDeep} from './num-expansion-rules.js';
export const NUM_DIGIT_DISTRIBUTION_SCHEMA='PHI-OS-NUM-R10-DIGIT-DISTRIBUTION-v1.0.0';
function normalize(input){
  if(Array.isArray(input)){
    const out=Object.fromEntries(Array.from({length:9},(_,i)=>[i+1,0]));
    for(const raw of input){const n=Number(raw);if(Number.isInteger(n)&&n>=1&&n<=9)out[n]+=1}
    return out;
  }
  if(input&&typeof input==='object'){
    const out={};for(let n=1;n<=9;n++){const v=Number(input[n]??input[String(n)]??0);if(!Number.isInteger(v)||v<0)throw new TypeError('NUM_R10_INVALID_FREQUENCY');out[n]=v}return out;
  }
  throw new TypeError('NUM_R10_FREQUENCY_REQUIRED');
}
export function buildNumDigitDistribution({digits,frequency,inputScope='SUPPLIED_DIGIT_FREQUENCY'}={}){
  const f=normalize(frequency??digits);
  const missing=[],repeated=[],present=[];
  for(let n=1;n<=9;n++){
    if(f[n]===0)missing.push(n); else present.push(n);
    if(f[n]>=2)repeated.push(Object.freeze({digit:n,count:f[n]}));
  }
  return freezeDeep({
    schemaVersion:NUM_DIGIT_DISTRIBUTION_SCHEMA,
    workCode:'NUM-R10',inputScope,frequency:f,presentDigits:present,missingDigits:missing,repeatedDigits:repeated,
    semantics:{missingMeansDeficit:false,repetitionMeansIdentity:false,customerTraitInferenceAllowed:false,learningCorpusLabelBlackHoleRuntimeAllowed:false},
    state:'STRUCTURAL_RUNTIME_READY_R18_ADMISSION_PENDING'
  });
}
export default Object.freeze({buildNumDigitDistribution});
