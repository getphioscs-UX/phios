import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {onRequestPost} from '../functions/api/customer-contextual-ask.js';
const sandbox={};vm.createContext(sandbox);vm.runInContext(fs.readFileSync('scripts/lib/master-a-batch3-observation-request-fixture.js','utf8'),sandbox);
let providers=0,writes=0;const oldFetch=globalThis.fetch;globalThis.fetch=async()=>{providers++;throw Error('NO_PROVIDER');};
const env={ASSETS:{fetch:async req=>{const p=new URL(typeof req==='string'?req:req.url).pathname.slice(1);return fs.existsSync(p)&&!p.includes('..')?new Response(fs.readFileSync(p)):new Response('missing',{status:404});}},PHIOS_ENVIRONMENT:'qa',PHIOS_MANUSCRIPT_RETRIEVAL_ENABLED:'false',REPORT_PROVIDER_LIVE_ALLOWED:'false',REALITY:{put:async()=>{writes++;throw Error('NO_WRITE');}}};
const evidence=[];
try{for(const [mode,contextType]of [['CURRENT_REALITY_REFERENCE','CURRENT_REALITY'],['PROFESSIONAL_REFERENCE','PROFESSIONAL_CASE_CONTEXT']]){const contextRef='DEMO_SERVER_RESOLVED_'+contextType;
 const body=sandbox.ObservationInteractionFixture.buildAskRequest({mode,question:'为什么没有观察到不代表不存在？',selectedNodeRefs:['KN-B7-14-086'],authorizedContext:{source:'EXISTING_SERVER_RESOLVED_CONTEXT',contextType,contextRef}});
 const serverContext={serverAuthorized:true,contextType,contextRef,consent:{accepted:true},entitlementState:'ENTITLED',summary:'NON_PRODUCTION_AUTHORIZATION_TEST_FIXTURE',saved:false,freshness:'DEMO_ONLY',selectedRefs:[]};
 const response=await onRequestPost({request:new Request('http://localhost/api/customer-contextual-ask',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),env,data:{resolvedAskContexts:[serverContext]}});
 assert.equal(response.status,200);const result=await response.json();assert.equal(result.ok,true);assert.ok(JSON.stringify(result.view).includes(contextRef));assert.equal(serverContext.saved,false);
 evidence.push({mode,contextType,status:'PASS',serverResolvedFixtureOnly:true,productionAuthorizationGranted:false,contextAppearsInDisclosure:true,persistentWrites:0});}}
finally{globalThis.fetch=oldFetch;}
assert.equal(providers,0);assert.equal(writes,0);
fs.writeFileSync('content/knowledge/structured/successors/master-a-v2-batch3/reference-context-validation-v1.json',JSON.stringify({status:'PASS',scope:'NON_PRODUCTION_AUTHORIZATION_FIXTURES_ONLY',realUserRealityRead:false,realProfessionalCaseRead:false,newAuthorizationOwner:false,evidence,providerRequests:providers,persistentWrites:writes},null,2)+'\n');console.log('PASS existing server-resolved Reality/professional authorization transport, explicit disclosure, no write.');
