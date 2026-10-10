import fs from 'node:fs';
import {compileNarrativeBrief} from '../functions/personal-reading/narrative/narrative-brief-compiler.js';
import {compileRelationshipNarrativeBrief} from '../functions/personal-reading/relationship/relationship-narrative-brief.js';
import {briefInput,W53,W54} from './ppr-narrative-w54n0-fixtures.mjs';
import {buildSpecificRelW7Case,buildSelfRelW7Case} from './rel-w7-relationship-narrative-fixtures.mjs';
export const PRODUCT=JSON.parse(fs.readFileSync('content/personal-reading/narrative/registries/paid-narrative-product-registry-v1.json','utf8'));
export {W53,W54};
function arr(v){return Array.isArray(v)?v:[];} function clean(v){return typeof v==='string'?v.trim():'';}
export function governedRefs(brief){const set=new Set();const walk=v=>{if(!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach(walk);return;}for(const [k,x] of Object.entries(v)){if(['refs','supportRefs','claimRefs','observationRefs','relevantMethodRefs'].includes(k))for(const r of arr(x))set.add(String(r));else if(['sourceRef','profileSignalRef'].includes(k)&&clean(x))set.add(clean(x));else walk(x);}};walk(brief);return [...set].filter(Boolean).sort();}
export async function narrativeBriefCase(index){
  if(index<=12)return compileNarrativeBrief(await briefInput(index));
  const relIndex=index-12;
  const input=relIndex>8?await buildSelfRelW7Case(relIndex,{hasProfile:relIndex%2===0,sensitive:relIndex%3===0}):await buildSpecificRelW7Case(relIndex,{hasProfile:relIndex%2===0,realityMode:['SUPPORT','CONTRADICT','OPEN','NONE'][relIndex%4],sensitive:relIndex%5===0,customerContext:relIndex%3===0?`Explicit relationship context for narrative case ${relIndex}.`:null});
  return compileRelationshipNarrativeBrief(input);
}
export function verifiedPayment(index,{askQuotaRemaining=2}={}){return {verified:true,verificationSource:'SERVER_VERIFIED_PAYMENT_EVENT',paymentEventId:`payevt-w54n-${String(index).padStart(2,'0')}`,purchaseId:`pur_w54n_${String(index).padStart(2,'0')}`,subjectRef:`acct_w54n_${String(index).padStart(2,'0')}`,productId:PRODUCT.productId,productVersion:PRODUCT.productVersion,currency:PRODUCT.currency,amountMinor:PRODUCT.amountMinor,paidAt:'2026-09-01T10:00:00.000Z',askQuotaRemaining};}
export function offer(){return {productId:PRODUCT.productId,productVersion:PRODUCT.productVersion,currency:PRODUCT.currency,amountMinor:PRODUCT.amountMinor,purchaseMode:PRODUCT.purchaseMode,priceAuthorityRef:PRODUCT.priceAuthorityRef};}
function block(id,text,claimRefs=[]){return {blockId:id,text,claimRefs};}
export function stubWriterProvider(brief,index,counter){return async ()=>{counter.count+=1;const refs=governedRefs(brief);const r1=refs[0]||'NO_REF',r2=refs[1]||r1;const claims=[
 {claimId:`C-${index}-1`,sentenceRef:`B-${index}-1`,claimClass:'SUPPORTED_FACT',text:`A governed finding in case ${index} remains anchored to the Narrative Brief.`,supportRefs:[r1],sourceClasses:['SYMBOLIC_INTERPRETATION']},
 {claimId:`C-${index}-2`,sentenceRef:`B-${index}-2`,claimClass:'SUPPORTED_SYNTHESIS',text:`The governed evidence can be narrated together without turning agreement into proof in case ${index}.`,supportRefs:[r1,r2],sourceClasses:['SYMBOLIC_INTERPRETATION','CURRENT_REALITY_OBSERVATION']}
 ];
 let bad=null;
 if(index%6===0)bad={claimId:`C-${index}-BAD`,sentenceRef:`B-${index}-BAD`,claimClass:'DIAGNOSIS',text:'This diagnosis is certain.',supportRefs:[],sourceClasses:[]};
 else if(index%5===0)bad={claimId:`C-${index}-BAD`,sentenceRef:`B-${index}-BAD`,claimClass:'SUPPORTED_FACT',text:'This unsupported life fact is certain.',supportRefs:['UNKNOWN-REF'],sourceClasses:[]};
 else if(index>12&&index%4===0)bad={claimId:`C-${index}-BAD`,sentenceRef:`B-${index}-BAD`,claimClass:'PARTNER_HIDDEN_STATE_INFERENCE',text:'B secretly wants to leave.',supportRefs:[r1],sourceClasses:['SYMBOLIC_INTERPRETATION']};
 else if(index%7===0)bad={claimId:`C-${index}-BAD`,sentenceRef:`B-${index}-BAD`,claimClass:'UNDECLARED_CLASS',text:'This claim class cannot be verified.',supportRefs:[r1],sourceClasses:[]};
 if(bad)claims.push(bad);
 const blocks=[block(`B-${index}-1`,claims[0].text,[claims[0].claimId]),block(`B-${index}-2`,claims[1].text,[claims[1].claimId])];if(bad)blocks.push(block(bad.sentenceRef,bad.text,[bad.claimId]));
 return {provider:'fixture-provider',model:'fixture-model-v1',usage:{input_tokens:100,output_tokens:120},output:{opening:block(`OPEN-${index}`,index>12?'This relationship narrative starts from governed interaction evidence.':'This narrative starts from governed evidence.',[]),chapters:[{chapterId:`CH-${index}-1`,title:'Governed synthesis',blocks}],phiOsLensBlocks:[block(`LENS-${index}`,'PHI OS keeps stable structure and current reality distinct.',[])],closing:block(`CLOSE-${index}`,'What remains open stays open.',[]),openQuestions:arr(brief.dynamicCuriosityQuestions).length?brief.dynamicCuriosityQuestions.slice(0,3):arr(brief.openQuestions).slice(0,3),claims}};};}
export function stubAskAnswerer(brief,index){return async ()=>{const ref=governedRefs(brief)[0];return {provider:'fixture-provider',model:'fixture-model-v1',output:{answer:`This answer stays inside the stored narrative and governed evidence for case ${index}.`,supportRefs:ref?[ref]:[],openRefs:[]}};};}
