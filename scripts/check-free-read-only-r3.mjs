import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {onRequest as root} from '../functions/_middleware.js';
import {onRequest as api} from '../functions/api/_middleware.js';
import {onRequestPost as tarot} from '../functions/api/symbolic-method-execute.js';
import {onRequestPost as location} from '../functions/api/location-resolve.js';

export const base = fileURLToPath(new URL('../',import.meta.url));
export const tarotBody = {method:'TAROT',question:'What should I consider when planning a learning project?',spreadId:'ONE_CARD_FOCUS',selectedCardIds:['RWS-MAJOR-00'],useCurrentRealityContext:false};
export const locationBody = {providerRef:'R123',birthDate:'2000-01-15',birthTime:'12:00',locale:'en'};
export function environment() {
  const counters = {dbRead:0,dbWrite:0,private:0,assets:0};
  const denied = () => {counters.private++;throw new Error('UNEXPECTED_PRIVATE_CAPABILITY');};
  const env = {PHIOS_D1_MAINTENANCE_MODE:'READ_ONLY',
    RUNTIME_DB:{prepare(sql){assert.ok(sql.startsWith('SELECT '));return {bind(){return this;},async first(){counters.dbRead++;return null;},async all(){counters.dbRead++;return {results:[]};},async run(){counters.dbWrite++;throw new Error('WRITE');}};},batch(){counters.dbWrite++;throw new Error('WRITE');}},
    PRIVATE_REPORTS:{put:denied,get:denied},MANUSCRIPTS:{put:denied},BOOKS:{put:denied},AI:{run:denied},METHOD_REPORT_RENDERER:{fetch:denied},
    ASSETS:{async fetch(request){counters.assets++;const path=new URL(request.url).pathname;assert.ok(path.startsWith('/content/'));try{return new Response(await readFile(base+path.slice(1)),{headers:{'content-type':'application/json'}});}catch{return new Response(null,{status:404});}}}
  };
  return {env,counters};
}
export async function execute(request,{handler,env:provided}={}) {
  const fixture=provided ? {env:provided,counters:null} : environment();
  const pathname=new URL(request.url).pathname;
  const route=handler || (pathname==='/api/location-resolve'?location:tarot);
  const context={request,env:fixture.env,data:{}};
  context.next=()=>api({...context,next:()=>route(context)});
  return {response:await root(context),counters:fixture.counters,env:fixture.env};
}
export function request(path,body,headers={},method='POST') {
  return new Request('http://localhost:8793'+path,{method,headers:{origin:'http://localhost:8793','content-type':'application/json',...headers},body:method==='GET'?undefined:JSON.stringify(body)});
}
export async function checks() {
  const rows=[];
  async function denied(label,req,options){const result=await execute(req,options);assert.equal(result.response.status,503,label);rows.push({label,status:503});}
  for(const [label,path,body] of [
    ['NUM denied','/api/customer-personal-reality',{methods:['numeric']}],
    ['save denied','/api/symbolic-method-save',tarotBody],['checkout denied','/api/checkout',{}],
    ['IChing denied','/api/symbolic-method-execute',{...tarotBody,method:'I_CHING'}],
    ['client free denied','/api/symbolic-method-execute',{...tarotBody,free:true}],
    ['duplicate cards denied','/api/symbolic-method-execute',{...tarotBody,selectedCardIds:['RWS-MAJOR-00','RWS-MAJOR-00','RWS-MAJOR-01']}],
    ['context not admitted','/api/symbolic-method-execute',{...tarotBody,useCurrentRealityContext:true}],
    ['extra location fields','/api/location-resolve',{...locationBody,save:true}],
    ['invalid date','/api/location-resolve',{...locationBody,birthDate:'2000-02-31'}],
    ['invalid time','/api/location-resolve',{...locationBody,birthTime:'25:00'}]
  ]) await denied(label,request(path,body));
  await denied('cross origin',request('/api/symbolic-method-execute',tarotBody,{origin:'https://foreign.invalid'}));
  const missing=request('/api/symbolic-method-execute',tarotBody);missing.headers.delete('origin');await denied('missing origin',missing);
  await denied('cross site',request('/api/symbolic-method-execute',tarotBody,{'sec-fetch-site':'cross-site'}));
  await denied('non JSON',request('/api/symbolic-method-execute',tarotBody,{'content-type':'text/plain'}));
  await denied('query denied',request('/api/symbolic-method-execute?save=1',tarotBody));
  await denied('PATCH denied',request('/api/symbolic-method-execute',tarotBody,{},'PATCH'));
  await denied('UTF8 byte limit',request('/api/symbolic-method-execute',{...tarotBody,question:'中'.repeat(6000)}));
  // Every approved capability stays sealed even when the downstream catches errors.
  await denied('caught D1 write',request('/api/symbolic-method-execute',tarotBody),{handler:async c=>{try{c.env.RUNTIME_DB.prepare('DELETE FROM users').run();}catch{}return Response.json({ok:true});}});
  await denied('caught R2 write',request('/api/symbolic-method-execute',tarotBody),{handler:async c=>{try{c.env.PRIVATE_REPORTS.put('x','x');}catch{}return Response.json({ok:true});}});
  await denied('caught AI call',request('/api/symbolic-method-execute',tarotBody),{handler:async c=>{try{c.env.AI.run('x',{});}catch{}return Response.json({ok:true});}});
  const changed=environment().env;changed.PHIOS_TIMEZONE_ENDPOINT='https://paid.invalid/';await denied('unaudited endpoint',request('/api/location-resolve',locationBody),{env:changed});
  const authCookie=request('/api/symbolic-method-execute',tarotBody,{cookie:'__Host-phios-session=invalid-local-fixture'});
  await denied('authentication configuration remains fail closed',authCookie);
  const invalidMode=environment().env;invalidMode.PHIOS_D1_MAINTENANCE_MODE='INVALID';await denied('invalid maintenance mode',request('/api/symbolic-method-execute',tarotBody),{env:invalidMode});
  const read=await execute(request('/api/tarot-production-status',undefined,{},'GET'),{handler:async c=>{await c.env.RUNTIME_DB.prepare('SELECT value FROM fixture').first();return Response.json({ok:true});}});
  assert.equal(read.response.status,200);rows.push({label:'existing GET with guarded SELECT preserved',status:200});
  const oldFetch=globalThis.fetch;
  let external=0;
  globalThis.fetch=async()=>{external++;throw new Error('UNEXPECTED_NETWORK');};
  try {
    const result=await execute(request('/api/symbolic-method-execute',tarotBody));const payload=await result.response.json();
    assert.equal(result.response.status,200,JSON.stringify(payload));assert.equal(payload.ok,true);assert.ok(payload.publicView.spreadComposition);
    assert.ok(JSON.stringify(payload).includes(tarotBody.question));assert.ok(JSON.stringify(payload).includes('RWS-MAJOR-00'));
    assert.equal(payload.production.providerUsed,false);assert.equal(result.counters.dbWrite,0);assert.equal(result.counters.private,0);assert.equal(external,0);
    rows.push({label:'real Tarot handler and auth middleware',status:200,counters:result.counters,external});
    const revoked=environment().env;revoked.RUNTIME_DB.prepare=()=>({bind(){return this;},async first(){return {payload:JSON.stringify({methodCode:'TAROT',releaseId:'TAROT-1.1.0',authorityDigest:'4762f2df7ae7bc950ae8e62a6a101c1dd49c18b89b9e664358b16ca67ef6b204',state:'REVOKED',explicitRevocation:true})};}});
    assert.equal((await execute(request('/api/symbolic-method-execute',tarotBody),{env:revoked})).response.status,423);
    rows.push({label:'server revocation preserved',status:423});
    globalThis.fetch=async url=>{
      const parsed=new URL(url);external++;
      if(parsed.origin==='https://nominatim.openstreetmap.org')return Response.json([{osm_type:'relation',osm_id:123,lat:'3.139',lon:'101.687',display_name:'Kuala Lumpur, Malaysia',name:'Kuala Lumpur',address:{city:'Kuala Lumpur',country:'Malaysia',country_code:'my'}}]);
      assert.equal(parsed.origin,'https://timeapi.io');return Response.json({timeZone:'Asia/Kuala_Lumpur'});
    };
    const result2=await execute(request('/api/location-resolve',locationBody));const loc=await result2.response.json();
    assert.equal(result2.response.status,200,JSON.stringify(loc));assert.equal(loc.birthLocationSnapshot.state,'CONFIRMED');
    assert.equal(loc.birthLocationSnapshot.location.timezone.iana,'Asia/Kuala_Lumpur');assert.equal(result2.counters.dbWrite,0);assert.equal(result2.counters.private,0);
    rows.push({label:'real location handler; public lookup fixture, not live provider',status:200,counters:result2.counters});
  } finally {globalThis.fetch=oldFetch;}
  return rows;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) console.log(JSON.stringify(await checks(),null,2));
