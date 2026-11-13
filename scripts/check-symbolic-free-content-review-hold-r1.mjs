import assert from 'node:assert/strict';
import {execute,request,tarotBody} from './check-free-read-only-r3.mjs';
import {onRequestGet} from '../functions/api/symbolic-method-execute.js';
const oldFetch=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('SYMBOLIC_REVIEW_TEST_NETWORK_DENIED');};const rows=[];
try{
for(const ids of [['RWS-MAJOR-00'],['RWS-MAJOR-01','RWS-MAJOR-00','RWS-MAJOR-02'],['RWS-MAJOR-01'],['RWS-MAJOR-01','RWS-MAJOR-02','RWS-MAJOR-03']]){
 const containsHeld=ids.includes('RWS-MAJOR-00'),result=await execute(request('/api/symbolic-method-execute',{...tarotBody,spreadId:ids.length===1?'ONE_CARD_FOCUS':'THREE_CARD_SITUATION',selectedCardIds:ids})),body=await result.response.json();assert.equal(result.response.status,containsHeld?409:200,JSON.stringify(body));assert.deepEqual(body.selectionEvidence.drawEvidence.drawOrder,ids);assert.equal(result.response.headers.get('set-cookie'),null);assert.equal(result.counters.dbWrite,0);assert.equal(result.counters.private,0);
 if(containsHeld){assert.equal(body.error.code,'TAROT_SELECTED_CARD_CONTENT_REVIEW_PENDING');assert.equal(body.publicView,undefined);assert.equal(body.readingIr,undefined);assert.equal(body.personalization,undefined);assert.equal(body.production.runAllowed,false);assert.equal(body.production.applicationRunAllowed,true);}else{assert.equal(body.ok,true);assert.ok(body.publicView);assert.equal(body.production.providerUsed,false);}
 rows.push({ids,status:result.response.status,originalOrderPreserved:true});
}
const invalid=await execute(request('/api/symbolic-method-execute',{...tarotBody,selectedCardIds:['RWS-MAJOR-000']}));assert.equal(invalid.response.status,400);assert.equal((await onRequestGet()).status,405);assert.equal(calls,0);console.log(JSON.stringify({scope:'Actual received middleware and native handler; affected output denied, historical source untouched',passed:6,rows,networkCalls:calls,providerCalls:0,productionWrites:0,preview:false,live:false}));
}finally{globalThis.fetch=oldFetch;}
