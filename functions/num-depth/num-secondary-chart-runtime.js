import {freezeDeep,reduceSingle,reducePreserveMaster,NUM_DEPTH_WESTERN_SCHOOL} from './num-depth-rules.js';
export const NUM_D3_SECONDARY_SCHEMA='PHI-OS-NUM-D3-SECONDARY-CHART-IR-v1.0.0';
const LETTER_VALUES=Object.freeze(Object.fromEntries('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c,i)=>[c,(i%9)+1])));
const LEVELS=Object.freeze({PHYSICAL:new Set(['D','E','M','W']),MENTAL:new Set(['A','G','H','J','L','N','P']),EMOTIONAL:new Set(['B','I','O','R','S','T','X','Z']),INTUITIVE:new Set(['C','F','K','Q','U','V','Y'])});
const GROUPS=Object.freeze({GROUNDED:new Set(['C','D','G','L','M','V']),VACILLATING:new Set(['B','F','H','J','N','P','Q','S','T','U','W','X','Y']),CREATIVE:new Set(['A','E','I','K','O','R','Z'])});
const VOWELS=new Set(['A','E','I','O','U']);
function normalize(fullBirthName){
 if(typeof fullBirthName!=='string'||!fullBirthName.trim())throw new TypeError('NUM_D3_FULL_BIRTH_NAME_REQUIRED');
 const raw=fullBirthName.toUpperCase().replace(/\s+/g,' ').trim();
 if(/[\/]/.test(raw))return freezeDeep({state:'BLOCKED_ALIAS_OR_MULTIPLE_NAME_MARKER',display:raw,parts:[],letters:[],yClassificationRequired:false});
 if([...raw].some(c=>!/[A-Z\s\-']/i.test(c)))return freezeDeep({state:'BLOCKED_NON_ASCII_OR_UNSUPPORTED_NAME_CHARACTERS',display:raw,parts:[],letters:[],yClassificationRequired:false});
 const n=raw;
 const parts=n.split(/[\s-]+/).map(x=>x.replace(/'/g,'')).filter(Boolean);const letters=parts.join('').split('');
 if(!letters.length)throw new TypeError('NUM_D3_NO_NAME_LETTERS');
 return freezeDeep({state:letters.includes('Y')?'Y_CLASSIFICATION_REQUIRED_FOR_CORE_NAME_ALIGNMENT':'READY',display:n,parts,letters,yClassificationRequired:letters.includes('Y')});
}
function sumLetters(letters){return letters.reduce((s,c)=>s+LETTER_VALUES[c],0)}
function perPartValue(parts,predicate=()=>true){const partResults=parts.map(part=>reducePreserveMaster(sumLetters([...part].filter(predicate))));return freezeDeep({parts:partResults,final:reducePreserveMaster(partResults.reduce((s,x)=>s+x.value,0))})}
function sourceAlignedCore(name,lifePathValue){
 if(name.state!=='READY')return freezeDeep({availability:name.state,eligible:false});
 const expression=perPartValue(name.parts);const soulUrge=perPartValue(name.parts,c=>VOWELS.has(c));const personality=perPartValue(name.parts,c=>!VOWELS.has(c));const maturity=reducePreserveMaster(reduceSingle(lifePathValue)+expression.final.value);
 return freezeDeep({availability:'AVAILABLE',eligible:true,expression:expression.final,soulUrge:soulUrge.final,personality:personality.final,maturity});
}
function frequencies(letters){const f=Object.fromEntries(Array.from({length:9},(_,i)=>[i+1,0]));for(const c of letters)f[LETTER_VALUES[c]]++;return f}
function plane(letters,set){const xs=letters.filter(c=>set.has(c));const raw=sumLetters(xs);return freezeDeep({letters:xs,count:xs.length,rawValue:raw,reduction:reducePreserveMaster(raw)})}
export function buildNumSecondaryChart({fullBirthName,birthDayNumber,lifePathValue,expressionValue,soulUrgeValue,personalityValue}={}){
 const name=normalize(fullBirthName);if(name.state.startsWith('BLOCKED_'))return freezeDeep({schemaVersion:NUM_D3_SECONDARY_SCHEMA,workCode:'NUM-D3',school:NUM_DEPTH_WESTERN_SCHOOL,availability:name.state,runtimeUseAllowed:false,customerPublishable:false});
 const letters=name.letters,parts=name.parts;const f=frequencies(letters);const max=Math.max(...Object.values(f));const hiddenPassions=Object.entries(f).filter(([,v])=>v===max).map(([k])=>Number(k));const karmicLessons=Object.entries(f).filter(([,v])=>v===0).map(([k])=>Number(k));
 const initials=parts.map(p=>p[0]);const balance=reduceSingle(sumLetters(initials));const firstNameLetters=[...parts[0]];const rationalThought=reduceSingle(sumLetters(firstNameLetters)+reduceSingle(birthDayNumber));const subconsciousSelf=9-karmicLessons.length;
 const bridges={lifePathExpression:expressionValue==null||lifePathValue==null?null:Math.abs(reduceSingle(lifePathValue)-reduceSingle(expressionValue)),soulUrgePersonality:soulUrgeValue==null||personalityValue==null?null:Math.abs(reduceSingle(soulUrgeValue)-reduceSingle(personalityValue))};
 const planes=Object.fromEntries(Object.entries(LEVELS).map(([k,set])=>[k,plane(letters,set)]));const groups=Object.fromEntries(Object.entries(GROUPS).map(([k,set])=>[k,plane(letters,set)]));
 const sourceCore=sourceAlignedCore(name,lifePathValue);
 return freezeDeep({schemaVersion:NUM_D3_SECONDARY_SCHEMA,workCode:'NUM-D3',school:NUM_DEPTH_WESTERN_SCHOOL,availability:'AVAILABLE',nameState:name.state,name:{normalized:name.display,parts,letterCount:letters.length},frequency:f,hiddenPassions,karmicLessons,subconsciousSelf,balance:{value:balance,initials},rationalThought:{value:rationalThought,firstName:parts[0],birthdayDay:reduceSingle(birthDayNumber)},bridges,planes,groups,sourceAlignedCore:sourceCore,
  boundaries:{calculationOnly:true,traitFactCreated:false,medicalInferenceCreated:false,bridgeCompatibilityScoreCreated:false,yClassificationRequired:name.yClassificationRequired},runtimeUseAllowed:true,customerPublishable:true});
}
export default Object.freeze({buildNumSecondaryChart});
