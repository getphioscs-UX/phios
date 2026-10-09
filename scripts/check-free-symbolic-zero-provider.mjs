import fs from 'node:fs';
import assert from 'node:assert/strict';
import {executeTarotProductRuntime} from '../functions/tarot-product-runtime/tarot-product-runtime.js';
import {TAROT_PRODUCTION_AUTHORITY_PATHS} from '../functions/api/symbolic-method-execute.js';
import {executeIChingProductRuntime} from '../functions/iching-product-runtime/iching-product-runtime-v1.js';
const json=p=>JSON.parse(fs.readFileSync(p.replace(/^\//,''),'utf8'));
const tarot=Object.fromEntries(Object.entries(TAROT_PRODUCTION_AUTHORITY_PATHS).map(([k,p])=>[k,json(p)]));
const iching={hexagramRegistry:json('content/professional/core-method-runtime/iching-hexagram-registry-v1.json'),sourceRegistry:json('content/interpretation/iching/registries/iching-source-registry-v1.json'),perspectiveRegistry:json('content/interpretation/iching/registries/iching-interpretation-perspective-registry-v1.json'),corpus:json('content/interpretation/iching/corpus/iching-public-domain-minimum-corpus-v1.json')};
const originalFetch=globalThis.fetch;let attemptedCalls=0;const results=[];
globalThis.fetch=async()=>{attemptedCalls++;throw Error('FREE_SYMBOLIC_NETWORK_CALL_FORBIDDEN');};
try{
 for(let i=0;i<5;i++){
  const output=await executeTarotProductRuntime({question:'What can I observe about this situation?',spread:'THREE_CARD_SITUATION'},tarot);
  assert.equal(output.ok,true);assert.equal(output.production.providerUsed,false);
  const draw=output.selectionEvidence.drawEvidence;
  assert.equal(new Set(draw.drawOrder).size,3);
  results.push({method:'TAROT',case:i,providerCalls:attemptedCalls,physicalCardsUnique:true,scope:'CURRENT_SOURCE_RUNTIME_ONLY'});
 }
 for(const lines of [[7,7,7,7,7,7],[8,8,8,8,8,8],[6,9,7,8,6,9]]){
  const request={question:'What can I observe before deciding?',inputMode:'MANUAL_LINES',lines,sessionId:'MASTER-ZERO-PROVIDER',timestamp:'2026-10-09T00:00:00Z'};
  const output=await executeIChingProductRuntime(request,iching);
  assert.deepEqual(output,await executeIChingProductRuntime(request,iching));
  results.push({method:'I_CHING',lines,providerCalls:attemptedCalls,replayEqual:true,scope:'CURRENT_SOURCE_RUNTIME_ONLY'});
 }
 assert.equal(attemptedCalls,0);
}finally{globalThis.fetch=originalFetch;}
fs.writeFileSync('content/production-closure/live-customer-commercial-convergence/FREE-SYMBOLIC-ZERO-PROVIDER.json',JSON.stringify({result:'PASS',providerCalls:attemptedCalls,cases:results,paidSynthesisCostCases:0,liveCustomerPass:false},null,2)+'\n');
console.log(`PASS ${results.length} current free runtime cases; attempted network/provider calls=${attemptedCalls}; not paid synthesis or live customer evidence.`);
