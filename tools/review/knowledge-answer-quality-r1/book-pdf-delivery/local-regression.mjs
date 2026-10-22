import fs from 'node:fs';import assert from 'node:assert/strict';import cp from 'node:child_process';import crypto from 'node:crypto';import{DatabaseSync}from'node:sqlite';
import{createSqliteD1Adapter,loadRuntimeMigrations}from'../../../../scripts/runtime-migration-loader.mjs';
import{applyRuntimeMigrations}from'../../../../functions/runtime/migrations/migration-runner.js';
import{commerceApi}from'../../../../functions/commerce/commerce-stripe-api.js';
import{processCommerceStripeEvent}from'../../../../functions/commerce/commerce-stripe-events.js';
import{STRIPE_PRODUCT_REGISTRY}from'../../../../functions/pws/commercial/stripe-product-registry.js';
import{onRequestGet as download}from'../../../../functions/api/book-one-download.js';
import{onRequestPost as callback}from'../../../../functions/api/book-one-watermark-complete.js';
import{hmacHex,verifyHmacHex}from'../../../../functions/commerce/commerce-crypto.js';
import{ensureCommerceProducts}from'../../../../functions/commerce/book-commerce-store.js';
import{onRequestPost as legacyCheckout}from'../../../../functions/api/book-one-checkout.js';
const dir='tools/review/knowledge-answer-quality-r1/book-pdf-delivery/',py='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const pdf=(op,arg='',input)=>cp.execFileSync(py,[dir+'pdf-fixture.py',op,arg],{input,maxBuffer:400e6});const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const sql=new DatabaseSync(':memory:'),db=createSqliteD1Adapter(sql);await applyRuntimeMigrations({db,migrations:loadRuntimeMigrations(process.cwd()).migrations});
const objects=new Map(),sources=new Map(),sourceConfig={},sessions=new Map(),watermarkRequests=[],checks=[];let outbound=0,lastSession;
globalThis.fetch=async()=>{outbound++;throw Error('EXTERNAL_NETWORK_FORBIDDEN')};
const products=STRIPE_PRODUCT_REGISTRY.filter(p=>p.deliveryFormat==='FULL_PDF_DOWNLOAD');
for(const p of products){const bytes=pdf('make',p.productId);const source={binding:'MANUSCRIPTS',objectKey:'local-only/'+p.productId+'.pdf',pageCount:2,byteSize:bytes.length,sourceSha256:sha(bytes)};sourceConfig[p.productId]=source;sources.set(source.objectKey,bytes);}
const env={RUNTIME_DB:db,STRIPE_ENVIRONMENT:'QA',STRIPE_SECRET_KEY:'sk_test_SYNTHETIC_NOT_A_CREDENTIAL',PHIOS_COMMERCE_QA_ENABLED:'true',PHIOS_BOOK_PDF_CHECKOUT_ENABLED:'true',COMMERCE_BOOK_SOURCE_VERSIONS_JSON:JSON.stringify(sourceConfig),BOOK_ACCESS_TOKEN_SECRET:'synthetic-test-only-secret-32-characters-long',BOOK_WATERMARK_SERVICE_TOKEN:'synthetic-watermark-secret',BOOK_WATERMARK_SERVICE_URL:'https://watermark.invalid',BOOKS:{head:async k=>objects.get(k)?{size:objects.get(k).bytes.length,customMetadata:objects.get(k).meta}:null,get:async k=>{const o=objects.get(k);return o?{body:o.bytes,size:o.bytes.length,customMetadata:o.meta}:null;}},MANUSCRIPTS:{head:async k=>{const b=sources.get(k);return b?{size:b.length,customMetadata:{sourceSha256:sha(b)}}:null;}}};
const account=id=>({symbolicAccountIdentity:{userId:id,verified:true,authenticated:true,providerId:'CONTROLLED_QA'}});
const check=(name,condition)=>{assert.ok(condition,name);checks.push({name,pass:true});};
async function fakeFetch(url,opt={}){const u=new URL(url),form=new URLSearchParams(opt.body),body=opt.body;
 if(u.hostname==='watermark.invalid'){
  const payload=JSON.parse(body);assert.ok(await verifyHmacHex(env.BOOK_WATERMARK_SERVICE_TOKEN,`${opt.headers['x-phios-timestamp']}.${body}`,opt.headers['x-phios-signature'],'watermark-service'));
  const original=sources.get(payload.sourceObjectKey);assert.ok(original);assert.equal(sha(original),payload.sourceSha256);assert.equal(payload.sourceBinding,'MANUSCRIPTS');
  const bytes=pdf('stamp',payload.watermark.productId+' '+payload.watermark.purchaseId+' '+payload.watermark.customerId,original);const inspected=JSON.parse(pdf('inspect','',bytes));assert.equal(inspected.pages,payload.expectedPageCount);assert.equal(inspected.watermarkedPages,inspected.pages);
  const meta={productId:payload.watermark.productId,language:payload.language,sourceSha256:payload.sourceSha256,purchaseId:payload.watermark.purchaseId,pageCount:String(inspected.pages)};
  objects.set(payload.destinationObjectKey,{bytes,meta});watermarkRequests.push({sku:meta.productId,pages:inspected.pages,watermarkedPages:inspected.watermarkedPages,sourceBinding:payload.sourceBinding});
  return Response.json({status:'completed',destinationObjectKey:payload.destinationObjectKey});
 }
 if(u.hostname!=='api.stripe.com')throw Error('UNEXPECTED_NETWORK_DESTINATION');
 if(u.pathname==='/v1/account')return Response.json({id:'acct_1UFr0TBEKXJyHMkK'});
 if(u.pathname==='/v1/customers')return Response.json({id:'cus_'+String(form.get('metadata[customer_id]')).replace(/[^A-Za-z0-9]/g,'')});
 if(u.pathname==='/v1/checkout/sessions'){
  const metadata={};for(const[k,v]of form)if(/^metadata\[/.test(k))metadata[k.slice(9,-1)]=v;
  const price=form.get('line_items[0][price]')?{id:form.get('line_items[0][price]')}:{id:'price_synthetic',unit_amount:Number(form.get('line_items[0][price_data][unit_amount]')),currency:'myr',product:form.get('line_items[0][price_data][product]')};
  const session={id:'cs_test_'+crypto.randomBytes(8).toString('hex'),url:'https://checkout.stripe.com/c/pay/synthetic',expires_at:Math.floor(Date.now()/1000)+600,metadata,customer:form.get('customer'),mode:'payment',payment_status:'paid',amount_total:8900,currency:'myr',livemode:false,payment_intent:'pi_synthetic'+sessions.size,line_items:{data:[{quantity:1,price}],has_more:false}};
  sessions.set(session.id,session);lastSession=session;return Response.json(session);
 }
 if(u.pathname.startsWith('/v1/checkout/sessions/'))return Response.json(sessions.get(u.pathname.split('/').pop()));
 throw Error('UNEXPECTED_STRIPE_TEST_DOUBLE_PATH');
}
async function api(action,body,id='synthetic-buyer',settings=env){const request=new Request('http://localhost/api/commerce-'+action,{method:'POST',headers:{origin:'http://localhost','content-type':'application/json','idempotency-key':crypto.randomUUID()},body:JSON.stringify(body)});const r=await commerceApi({request,env:settings,data:id?account(id):{},fetch:fakeFetch},action);return {status:r.status,body:await r.json()};}
async function getPdf(url,id='synthetic-buyer'){return download({request:new Request('http://localhost'+url),env,data:id?account(id):{}});}
const results=[];
await ensureCommerceProducts(env);
for(const p of products){
 const checkout=await api('checkout',{productId:p.productId,acceptDigitalPolicy:true,locale:p.language});if(checkout.status!==201)console.log({checkoutFailure:checkout});check(p.productId+' checkout',checkout.status===201);
 const session=lastSession;check(p.productId+' payment language metadata',session.metadata.book_language===p.language&&session.metadata.commerce_product_id===p.productId);
 await processCommerceStripeEvent({env,event:{id:'evt_'+session.id,type:'checkout.session.completed',livemode:false,data:{object:session}},fetcher:fakeFetch,origin:'http://localhost'});
 const opposite=p.productId.replace(/-(ZH|EN)$/,p.language==='en'?'-ZH':'-EN');if(!results.some(r=>r.productId===opposite))check(p.productId+' never grants opposite language',(await api('book-download',{productId:opposite})).status===403);
 const token=await api('book-download',{productId:p.productId});check(p.productId+' issue',token.status===200&&!!token.body.downloadUrl);
 const other=await getPdf(token.body.downloadUrl,'other-account');check(p.productId+' stolen token denied',other.status===403);
 const res=await getPdf(token.body.downloadUrl);check(p.productId+' real bytes download',res.status===200&&res.headers.get('content-type')==='application/pdf');
 const bytes=Buffer.from(await res.arrayBuffer()),inspected=JSON.parse(pdf('inspect','',bytes));check(p.productId+' complete watermarked PDF',inspected.pages===2&&inspected.watermarkedPages===2&&inspected.sourceSha256===sourceConfig[p.productId].sourceSha256);
 check(p.productId+' bounded second token use',(await getPdf(token.body.downloadUrl)).status===200);check(p.productId+' exhausted token denied',(await getPdf(token.body.downloadUrl)).status===403);
 const re=await api('book-download',{productId:p.productId});check(p.productId+' new verified redownload token',re.status===200&&re.body.downloadUrl!==token.body.downloadUrl);
 results.push({productId:p.productId,language:p.language,amountMinor:p.amountMinor,pages:inspected.pages,watermarkedPages:inspected.watermarkedPages,downloadSHA256:sha(bytes),filename:res.headers.get('content-disposition')});
}
check('eight independent entitlements',sql.prepare('SELECT count(*) AS n FROM digital_entitlements').get().n===8);
check('no cross-language bundled grant',sql.prepare('SELECT count(DISTINCT entitlement_code) AS n FROM digital_entitlements').get().n===8);
const catalogResult=await commerceApi({request:new Request('http://localhost/api/commerce-catalog'),env:{...env,PHIOS_BOOK_PDF_CHECKOUT_ENABLED:'false'}},'catalog');const accountResult=await commerceApi({request:new Request('http://localhost/api/commerce-account'),env,data:account('synthetic-buyer')},'account');fs.writeFileSync(dir+'BROWSER-FIXTURE.json',JSON.stringify({catalog:await catalogResult.json(),account:await accountResult.json(),scope:'ACTUAL_HANDLERS_SYNTHETIC_LOCAL_SQLITE_NO_REAL_ACCOUNT'},null,2));
const englishOnly=await api('checkout',{productId:'COM-BOOK-01-EN',locale:'zh-Hans',amount:1,acceptDigitalPolicy:true},'synthetic-english-only');check('English purchase accepts independent UI language',englishOnly.status===201);const englishSession=lastSession;check('client price ignored and English delivery retained',englishSession.amount_total===8900&&englishSession.metadata.book_language==='en');await processCommerceStripeEvent({env,event:{id:'evt_english_only',type:'checkout.session.completed',livemode:false,data:{object:englishSession}},fetcher:fakeFetch,origin:'http://localhost'});check('English does not grant Chinese',(await api('book-download',{productId:'COM-BOOK-01-ZH'},'synthetic-english-only')).status===403);check('English does not grant another book',(await api('book-download',{productId:'COM-BOOK-02-EN'},'synthetic-english-only')).status===403);
for(const [name,body,id,expected]of [['anonymous',{productId:products[0].productId},null,401],['other-account',{productId:products[0].productId},'other-account',403],['language-override',{productId:products[0].productId,language:'en'},'synthetic-buyer',422]]){const r=await api('book-download',body,id);check(name,r.status===expected);}
const token=await api('book-download',{productId:products[0].productId});sql.prepare('UPDATE digital_entitlements SET expires_at=? WHERE product_id=?').run('2000-01-01',products[0].productId);check('existing token entitlement expiry rechecked',(await getPdf(token.body.downloadUrl)).status===403);
const target=products[1],t=await api('book-download',{productId:target.productId});const key=sql.prepare('SELECT watermarked_object_key k FROM digital_entitlements WHERE product_id=?').get(target.productId).k,object=objects.get(key);object.meta.language=target.language==='en'?'zh-Hans':'en';check('wrong language file rejected',(await getPdf(t.body.downloadUrl)).status===409);object.meta.language=target.language;
const gated=await api('checkout',{productId:products[0].productId,acceptDigitalPolicy:true},'synthetic-buyer',{...env,PHIOS_BOOK_PDF_CHECKOUT_ENABLED:'false'});check('sale closed without PDF readiness gate',gated.status===503);
const malformed=await api('checkout',{productId:products[0].productId,acceptDigitalPolicy:true});check('negative checkout created',malformed.status===201);const wrongSession=structuredClone(lastSession);wrongSession.metadata.book_language='bilingual';const badEvent=await processCommerceStripeEvent({env,event:{id:'evt_wronglang',type:'checkout.session.completed',livemode:false,data:{object:wrongSession}},fetcher:fakeFetch,origin:'http://localhost'});check('wrong payment-language metadata rejected',badEvent.status==='review_required');check('wrong event creates no entitlement',sql.prepare('SELECT count(*) n FROM digital_entitlements WHERE purchase_id=?').get('pur_'+wrongSession.metadata.order_id).n===0);
const callbackJob=sql.prepare('SELECT j.watermark_job_id,j.destination_object_key FROM commerce_watermark_jobs j JOIN digital_entitlements e ON e.entitlement_id=j.entitlement_id WHERE e.product_id=?').get(target.productId);
const callBack=async(raw,signature)=>callback({request:new Request('http://localhost/api/book-one-watermark-complete',{method:'POST',headers:{'x-phios-timestamp':String(Math.floor(Date.now()/1000)),'x-phios-signature':signature},body:raw}),env});
check('unsigned callback denied',(await callBack('{}','wrong')).status===401);
object.meta.pageCount='1';const callbackBody=JSON.stringify({jobId:callbackJob.watermark_job_id,status:'completed',destinationObjectKey:callbackJob.destination_object_key}),stamp=Math.floor(Date.now()/1000);check('incomplete PDF callback rejected',(await callBack(callbackBody,await hmacHex(env.BOOK_WATERMARK_SERVICE_TOKEN,`${stamp}.${callbackBody}`,'watermark-service'))).status===409);object.meta.pageCount='2';
const revokedToken=await api('book-download',{productId:target.productId});sql.prepare("UPDATE digital_entitlements SET entitlement_status='revoked' WHERE product_id=?").run(target.productId);check('revoked existing token denied',(await getPdf(revokedToken.body.downloadUrl)).status===403);
let authorProof=null;
if(process.argv.includes('--full-author')){
 const sku='COM-BOOK-02-EN',path='C:/Users/Guest Account/Desktop/PHI-OS-Book-2-en-v1.pdf',original=fs.readFileSync(path),originalHash=sha(original);
 assert.equal(originalHash,'0a2dc36302c44f5f82c47f74480ab603e5a394895422eef34aa97a5419e5d58c');
 const source={binding:'MANUSCRIPTS',objectKey:'books/book-2/en/PHI-OS-Book-2-en-v1.pdf',pageCount:295,byteSize:original.length,sourceSha256:originalHash};sourceConfig[sku]=source;sources.set(source.objectKey,original);env.COMMERCE_BOOK_SOURCE_VERSIONS_JSON=JSON.stringify(sourceConfig);
 const order=await api('checkout',{productId:sku,acceptDigitalPolicy:true,locale:'en'});check('actual full author source checkout local',order.status===201);const session=lastSession;
 await processCommerceStripeEvent({env,event:{id:'evt_author',type:'checkout.session.completed',livemode:false,data:{object:session}},fetcher:fakeFetch,origin:'http://localhost'});
 const token=await api('book-download',{productId:sku});check('actual author file download authorized',token.status===200);const response=await getPdf(token.body.downloadUrl);check('actual full author PDF delivered',response.status===200);const bytes=Buffer.from(await response.arrayBuffer()),inspection=JSON.parse(pdf('inspect','',bytes));check('all 295 author pages retained and watermarked',inspection.pages===295&&inspection.watermarkedPages===295&&inspection.sourceSha256===originalHash);
 authorProof={sku,sourceSha256:originalHash,sourceBytes:original.length,deliveredBytes:bytes.length,deliveredSha256:sha(bytes),pageCount:inspection.pages,watermarkedPages:inspection.watermarkedPages,originalFileUnchanged:sha(fs.readFileSync(path))===originalHash,storage:'MEMORY_ONLY_NO_PUBLIC_COPY'};
}
check('external network zero',outbound===0);
check('unqualified legacy new checkout retired',(await legacyCheckout()).status===409);
fs.writeFileSync(dir+(authorProof?'FULL-AUTHOR-REGRESSION.json':'LOCAL-REGRESSION.json'),JSON.stringify({at:new Date().toISOString(),status:'PASS_LOCAL_NOT_PRODUCTION_READY',checks,results,watermarkRequests,providerCalls:0,externalNetworkCalls:outbound,realPayments:0,productionWrites:0,watermarkImplementation:'PYTHON_TEST_ADAPTER_FOR_EXISTING_CONTRACT_NOT_PRODUCTION_SERVICE',actualAuthorPdfEndToEnd:authorProof},null,2));
console.log(JSON.stringify({checks:checks.length,variants:results.length,providerCalls:0,realPayments:0}));
