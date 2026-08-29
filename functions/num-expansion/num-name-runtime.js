import {NAME_ALPHABET_SYSTEM,NAME_NORMALIZATION_POLICY,NUM_EXPANSION_SCHOOL,reduceSingle,freezeDeep} from './num-expansion-rules.js';
export const NUM_NAME_RUNTIME_SCHEMA='PHI-OS-NUM-R11-NAME-NUMEROLOGY-RESULT-v1.0.0';
const LETTER_VALUES=Object.freeze(Object.fromEntries('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c,i)=>[c,(i%9)+1])));
const VOWELS=new Set(['A','E','I','O','U']);
function normalizeName(value){
  if(typeof value!=='string'||!value.trim())throw new TypeError('NUM_R11_FULL_BIRTH_NAME_REQUIRED');
  const normalized=value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const unsupported=[...normalized].filter(c=>/[A-Z\s\-'/.]/.test(c)===false);
  if(unsupported.length)throw new TypeError('NUM_R11_UNSUPPORTED_NAME_CHARACTERS');
  const letters=[...normalized].filter(c=>/[A-Z]/.test(c));
  if(!letters.length)throw new TypeError('NUM_R11_NO_LATIN_LETTERS');
  return Object.freeze({normalizedDisplay:normalized.replace(/\s+/g,' ').trim(),letters:Object.freeze(letters)});
}
function sumFor(letters,predicate=()=>true){return letters.filter(predicate).reduce((sum,c)=>sum+LETTER_VALUES[c],0)}
export function calculateNumNameProfile({identityInput,lifePathValue}={}){
  if(!identityInput||typeof identityInput!=='object')throw new TypeError('NUM_R11_IDENTITY_INPUT_REQUIRED');
  if(identityInput.customerConfirmed!==true)throw new TypeError('NUM_R11_CUSTOMER_CONFIRMATION_REQUIRED');
  if(identityInput.alphabetSystemId!==NAME_ALPHABET_SYSTEM)throw new TypeError('NUM_R11_ALPHABET_SYSTEM_MISMATCH');
  if(identityInput.nameNormalizationPolicy!==NAME_NORMALIZATION_POLICY)throw new TypeError('NUM_R11_NORMALIZATION_POLICY_MISMATCH');
  const name=normalizeName(identityInput.fullBirthName);
  const expressionRaw=sumFor(name.letters);
  const soulRaw=sumFor(name.letters,c=>VOWELS.has(c));
  const personalityRaw=sumFor(name.letters,c=>!VOWELS.has(c));
  const expression=reduceSingle(expressionRaw),soulUrge=reduceSingle(soulRaw),personality=reduceSingle(personalityRaw);
  const lifePathSingle=reduceSingle(lifePathValue);
  const maturity=reduceSingle(lifePathSingle.reducedValue+expression.reducedValue);
  const letterSequence=name.letters.map(c=>Object.freeze({letter:c,value:LETTER_VALUES[c],vowel:VOWELS.has(c)}));
  return freezeDeep({
    schemaVersion:NUM_NAME_RUNTIME_SCHEMA,workCode:'NUM-R11',schoolAuthorityId:NUM_EXPANSION_SCHOOL,
    input:{fullBirthName:identityInput.fullBirthName,normalizedName:name.normalizedDisplay,customerConfirmed:true,alphabetSystemId:NAME_ALPHABET_SYSTEM,nameNormalizationPolicy:NAME_NORMALIZATION_POLICY},
    values:{expression,soulUrge,personality,maturity},lifePathForMaturity:lifePathSingle,letterSequence,
    semantics:{calculationOnly:true,traitMeaningCreated:false,destinyClaimCreated:false,runtimeUseAllowed:true,customerPublishable:true},
    runtimeUseAllowed:true,customerPublishable:true,state:'CALCULATION_RUNTIME_ACTIVE'
  });
}
export default Object.freeze({calculateNumNameProfile});
