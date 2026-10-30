import assert from 'node:assert/strict';
import { onRequest } from '../functions/_middleware.js';

const origin='https://www.getphios.com';
const tarotBody={method:'TAROT',question:'What should I understand?',spreadId:'THREE_CARD_SITUATION',selectedCardIds:['CARD_A','CARD_B','CARD_C'],useCurrentRealityContext:false};
const fakeDb={
  prepare(sql){
    return {
      bind(){return this;},
      first:async()=>({ok:true,sql}),
      all:async()=>({results:[]}),
      raw:async()=>[]
    };
  }
};
function makeContext({path='/api/symbolic-method-execute',method='POST',body=tarotBody,headers={},mode='READ_ONLY',next}={}){
  const request=new Request(origin+path,{
    method,
    ...(method==='GET'||method==='HEAD'?{}:{body:typeof body==='string'?body:JSON.stringify(body)}),
    headers:{...(method==='GET'||method==='HEAD'?{}:{'content-type':'application/json'}),origin,'sec-fetch-site':'same-origin',...headers}
  });
  const context={request,env:{PHIOS_D1_MAINTENANCE_MODE:mode,RUNTIME_DB:fakeDb}};
  context.next=next?()=>next(context):()=>Response.json({ok:true});
  return context;
}
async function status(options){return (await onRequest(makeContext(options))).status;}
async function main(){
  assert.equal(await status(),200,'same-origin stateless Tarot must work during READ_ONLY');
  assert.equal(await status({method:'GET',path:'/api/tarot-production-status'}),200,'GET is retained');
  assert.equal(await status({body:{...tarotBody,method:'I_CHING'}}),503,'I Ching mutation remains gated');
  assert.equal(await status({path:'/api/commerce-checkout'}),503,'checkout must remain gated');
  assert.equal(await status({path:'/api/symbolic-method-save'}),503,'account saving must remain gated');
  assert.equal(await status({method:'PATCH',path:'/api/symbolic-method-readings'}),503,'PATCH remains gated');
  assert.equal(await status({headers:{origin:'https://external.example'}}),503,'cross-origin must not bypass');
  assert.equal(await status({headers:{'sec-fetch-site':'cross-site'}}),503,'cross-site fetch must not bypass');
  assert.equal(await status({headers:{'content-type':'text/plain'}}),503,'non JSON must not bypass');
  assert.equal(await status({body:{...tarotBody,paymentConfirmed:true}}),503,'unknown fields must not bypass');
  assert.equal(await status({body:'not JSON'}),503,'invalid JSON must not bypass');
  assert.equal(await status({body:{...tarotBody,selectedCardIds:['CARD_A']}}),200,'one card is valid');
  assert.equal(await status({body:{...tarotBody,selectedCardIds:['CARD_A','CARD_A','CARD_B']}}),503,'duplicate cards rejected');
  assert.equal(await status({body:{...tarotBody,question:'x'.repeat(801)}}),503,'oversized question rejected');
  assert.equal(await status({next:ctx=>{try{ctx.env.RUNTIME_DB.prepare('INSERT INTO runtimes VALUES (1)');}catch{}return Response.json({ok:true});}}),503,'D1 write cannot bypass guard even if downstream swallows the exception');
  assert.equal(await status({next:async ctx=>{const row=await ctx.env.RUNTIME_DB.prepare('SELECT 1').first();return Response.json(row);}}),200,'read-only D1 SELECT remains available');
  assert.equal(await status({path:'/api/commerce-checkout',mode:'OFF'}),200,'OFF mode behavior unchanged');
  console.log('TAROT READ_ONLY middleware regression: 17/17 PASS');
}
await main();
