import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createSqliteD1Adapter,loadRuntimeMigrations} from './runtime-migration-loader.mjs';
import {applyRuntimeMigrations} from '../functions/runtime/migrations/migration-runner.js';
import {STRIPE_PRODUCT_REGISTRY} from '../functions/pws/commercial/stripe-product-registry.js';
import {commerceApi} from '../functions/commerce/commerce-stripe-api.js';
import {fiveMethodReportCapability} from '../functions/report-delivery/paid-report-production-capabilities.js';

// Injected Price GET only; any customer/session request fails this test.
const sql=new DatabaseSync(':memory:'),db=createSqliteD1Adapter(sql);
await applyRuntimeMigrations({db,migrations:loadRuntimeMigrations(process.cwd()).migrations});
const env={RUNTIME_DB:db,PHIOS_ENVIRONMENT:'local',STRIPE_ENVIRONMENT:'QA',STRIPE_SECRET_KEY:'sk_test_fixture_only',PHIOS_COMMERCE_QA_ENABLED:'true'};
const identity={userId:'user_owner',providerId:'QA_TEST_FIXTURE',authenticated:true,verified:true};
let cases=0;
const counts=()=>Object.fromEntries(['commerce_checkout_attempts','commerce_customer_bindings','commerce_purchases','digital_entitlements'].map(t=>[t,sql.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n]));
async function check(productId,{patch={},flag='false',status=409,error,body={},data={symbolicAccountIdentity:identity},origin='https://phios.test',gets=1}={}){
 const p=STRIPE_PRODUCT_REGISTRY.find(p=>p.productId===productId),before=counts();let reads=0;
 const fetcher=async(url,options)=>{reads++;assert.equal(options.method,'GET');assert.equal(String(url),'https://api.stripe.com/v1/prices/'+p.qaPriceId);return Response.json({id:p.qaPriceId,product:p.qaProductId,unit_amount:p.amountMinor,currency:'myr',active:true,livemode:false,...patch});};
 const response=await commerceApi({env:{...env,PHIOS_SHARED_PAID_REPORT_ENABLED:flag},data,fetch:fetcher,request:new Request('https://phios.test/api/commerce-checkout',{method:'POST',headers:{origin,'content-type':'application/json','idempotency-key':'admission-regression-0001'},body:JSON.stringify({productId,acceptDigitalPolicy:true,reportLanguageMode:'SINGLE',reportLocale:'en',...body})})},'checkout');
 assert.equal(response.status,status,productId);const result=await response.json();if(error)assert.equal(result.error,error);
 assert.equal(reads,gets,'only required readonly Price GETs');assert.deepEqual(counts(),before,'no order/customer/purchase/entitlement writes');cases++;
}
const num='COM-REPORT-NUMEROLOGY-FULL',bzr='COM-REPORT-BAZI-FULL';
for(const patch of [{id:'price_wrong'},{product:'prod_wrong'},{unit_amount:1},{currency:'usd'},{active:false},{livemode:true},{recurring:{interval:'month'}}])await check(num,{patch,status:503,error:'stripe_qa_price_binding_mismatch'});
await check(num,{flag:'true',error:'SHARED_ADAPTER_ABSENT'});
await check(bzr,{error:'SHARED_REPORT_SETUP_DISABLED'});
await check(bzr,{flag:'true',error:'PAID_REPORT_READINESS_REQUIRED'});
await check(num,{data:{},status:401,gets:0});
await check(num,{origin:'https://attacker.test',status:403,gets:0});
await check(num,{body:{priceId:'tamper'},status:422,gets:0});
await check(num,{body:{reportLocale:'invalid'},status:422,gets:0});
await check(num,{body:{acceptDigitalPolicy:false},status:422,gets:0});
for(const id of ['ASTROLOGY','BAZI','ZIWEI','NUMEROLOGY','HD']){const capability=fiveMethodReportCapability(`COM-REPORT-${id}-FULL`,env);assert(capability);assert.equal(capability.setupAvailable,false);assert.equal(capability.grantsEntitlement,false);cases++;}
sql.close();console.log(`Commerce QA price / report admission: ${cases} focused cases PASS; injected GET only, zero mutations, no live network.`);
