import {writeVerifiedWatermarkArtifact} from "file:///C:/phios/.worktrees/pr6-ebook-closure/functions/commerce/book-watermark-artifact.js";
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync,spawnSync} from 'node:child_process';import {DatabaseSync} from 'node:sqlite';import {performance} from 'node:perf_hooks';
import {createSqliteD1Adapter,loadRuntimeMigrations} from "file:///C:/phios/.worktrees/pr6-ebook-closure/scripts/runtime-migration-loader.mjs";import {applyRuntimeMigrations} from "file:///C:/phios/.worktrees/pr6-ebook-closure/functions/runtime/migrations/migration-runner.js";import {commerceApi} from "file:///C:/phios/.worktrees/pr6-ebook-closure/functions/commerce/commerce-stripe-api.js";import {onRequestPost as webhook} from "file:///C:/phios/.worktrees/pr6-ebook-closure/functions/api/stripe-webhook.js";import {onRequestPost as callback} from "file:///C:/phios/.worktrees/pr6-ebook-closure/functions/api/book-one-watermark-complete.js";import {createStripeTestSignature} from "file:///C:/phios/.worktrees/pr6-ebook-closure/functions/commerce/stripe-client.js";import {verifyHmacHex,hmacHex} from "file:///C:/phios/.worktrees/pr6-ebook-closure/functions/commerce/commerce-crypto.js";import {STRIPE_PRODUCT_REGISTRY} from "file:///C:/phios/.worktrees/pr6-ebook-closure/functions/pws/commercial/stripe-product-registry.js";
import {onRequestGet as download} from "file:///C:/phios/.worktrees/pr6-ebook-closure/functions/api/book-one-download.js";
const privateRoot='C:/phios/.tmp/seven-book-closure-20261025',out='C:/phios/tools/review/integrated-closure-r25',account='0b9f36bdf56f38d7d09aebe388f15204',bucket='phios-private-books-sandbox';
const sourceInfo=JSON.parse(fs.readFileSync(privateRoot+'/BOOK-3-EN-R3-READ.json')),config=JSON.parse(fs.readFileSync('C:/phios/.worktrees/pr6-ebook-closure/tools/review/seven-book-ebook-closure-r1/COMMERCE-BOOK-SOURCE-VERSIONS-CANDIDATE.json')),p=STRIPE_PRODUCT_REGISTRY.find(x=>x.productId==='COM-BOOK-3-EN');assert(p);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),network=globalThis.fetch;globalThis.fetch=async()=>{throw Error('UNROUTED_NETWORK_FORBIDDEN')};
const local=process.argv.includes('--local-only');let localObject,failOnce=local,stampCount=0;
const auth=local?{}:JSON.parse(execFileSync(process.execPath,['C:/phios/node_modules/wrangler/bin/wrangler.js','auth','token','--json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const base=`https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets/${bucket}/objects`,headers={Authorization:`Bearer ${auth.token}`};
const receipt={at:new Date().toISOString(),scope:'REAL_FULL_SIZE_PDF_LOCAL_EXISTING_ADAPTER_REAL_SANDBOX_R2_NOT_DEPLOYED_SERVICE',account,bucket,productionD1Writes:0,sourceR2Writes:0,realPayments:0,providerCalls:0,remoteUploads:0,checks:[]};
if(local){receipt.scope='REAL_FULL_SIZE_PDF_FORMAL_HANDLERS_LOCAL_SQLITE_AND_FILE_BACKED_R2_ADAPTER';receipt.bucket='LOCAL_ADAPTER_NO_REMOTE_WRITES';}
const check=(name,pass,detail)=>{receipt.checks.push({name,state:pass?'PASS':'FAIL',detail});assert(pass,name);};
const sql=new DatabaseSync(':memory:'),db=createSqliteD1Adapter(sql);await applyRuntimeMigrations({db,migrations:loadRuntimeMigrations(process.cwd()).migrations});let session,job,lastObject;
async function remoteHead(key){assert.match(key,/^private\/books\/com-book-3-en\/watermarked\/pur_ord_[A-Za-z0-9_-]+\.pdf$/);if(local)return localObject?.key===key?{size:localObject.bytes.length,customMetadata:localObject.metadata}:null;const response=await network(base+'?'+new URLSearchParams({prefix:key,per_page:'10'}),{headers});const body=await response.json();if(!response.ok||!body.success)throw Error('QA_R2_LIST_'+response.status);const x=body.result.find(x=>x.key===key);return x?{size:Number(x.size),etag:x.etag,customMetadata:x.custom_metadata||{}}:null;}
const env={RUNTIME_DB:db,STRIPE_ENVIRONMENT:'LIVE',STRIPE_SECRET_KEY:'sk_live_SYNTHETIC_LOCAL_NOT_A_CREDENTIAL',STRIPE_WEBHOOK_SECRET:'whsec_SYNTHETIC_R3',PHIOS_COMMERCE_LIVE_ENABLED:'true',PHIOS_BOOK_PDF_CHECKOUT_ENABLED:'true',BOOK_ACCESS_TOKEN_SECRET:'SYNTHETIC_R3_BOOK_TOKEN_OVER_32_CHARACTERS',BOOK_WATERMARK_SERVICE_TOKEN:'SYNTHETIC_R3_WATERMARK_ONLY',BOOK_WATERMARK_SERVICE_URL:'https://watermark.invalid',COMMERCE_BOOK_SOURCE_VERSIONS_JSON:JSON.stringify(config),MANUSCRIPTS:{head:async key=>key===sourceInfo.key?{size:sourceInfo.bytes,etag:sourceInfo.etag.replaceAll('"',''),customMetadata:{}}:null},BOOKS:{head:remoteHead,get:async()=>{throw Error('DELIVERY_METADATA_MUST_PASS_BEFORE_DOWNLOAD')}}};
const identity=id=>({symbolicAccountIdentity:{userId:id,providerId:'SYNTHETIC_QA',verified:true,authenticated:true}});
if(local)env.BOOKS.get=async key=>localObject?.key===key?{body:localObject.bytes,size:localObject.bytes.length,customMetadata:localObject.metadata}:null;
async function fetcher(url,options={}){
 const u=new URL(url);
 if(u.hostname==='watermark.invalid'){
  if(failOnce){failOnce=false;throw Error('INJECTED_LOCAL_WATERMARK_OUTAGE');}
  check('watermark dispatch HMAC verified',await verifyHmacHex(env.BOOK_WATERMARK_SERVICE_TOKEN,options.headers['x-phios-timestamp']+'.'+options.body,options.headers['x-phios-signature'],'watermark-service'));
  job=JSON.parse(options.body);check('immutable purchased language/source bound',job.sourceSha256===sourceInfo.sha256&&job.expectedPageCount===264&&job.language==='en');
  check('existing sandbox destination not overwritten',!await remoteHead(job.destinationObjectKey));
  const resultFile='C:/phios/.tmp/integrated-closure-r25/private/R25-'+job.watermark.purchaseId+'.pdf',src=fs.openSync(sourceInfo.file,'r'),dest=fs.openSync(resultFile,'wx'),t=performance.now();let run;
  try{run=spawnSync('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',['C:/phios/tools/review/integrated-closure-r25/pdf-watermark-candidate.py','stamp',job.watermark.customerId+' '+job.watermark.purchaseId],{stdio:[src,dest,'pipe'],timeout:300000});}finally{fs.closeSync(src);fs.closeSync(dest);}
  if(run.status!==0)throw Error('LOCAL_FULL_SIZE_STAMP_FAILED');
  const bytes=fs.readFileSync(resultFile);receipt.watermark={elapsedSeconds:(performance.now()-t)/1000,bytes:bytes.length,sha256:sha(bytes),sourceSha256:job.sourceSha256,purchaseId:job.watermark.purchaseId,destinationKey:job.destinationObjectKey};
  const input=fs.openSync(resultFile,'r');let inspection;try{inspection=JSON.parse(execFileSync('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',['C:/phios/tools/review/integrated-closure-r25/pdf-watermark-candidate.py','inspect'],{stdio:[input,'pipe','pipe'],encoding:'utf8'}));}finally{fs.closeSync(input);}
  receipt.watermark.inspection=inspection;check('actual full PDF all264 pages watermarked',inspection.pages===264&&inspection.watermarkedPages===264&&inspection.sourceSha256===sourceInfo.sha256);
  stampCount++;
  if(local){const adapter={head:remoteHead,put:async(key,value,opts)=>{assert.equal(opts.onlyIf.etagDoesNotMatch,'*');if(localObject)return null;localObject={key,bytes:value,metadata:opts.customMetadata};return {key};}};receipt.metadataWrite=await writeVerifiedWatermarkArtifact({bucket:adapter,job,bytes,inspection});check('metadata write idempotent',(await writeVerifiedWatermarkArtifact({bucket:adapter,job,bytes,inspection})).reused);for(const bad of [{...job,language:'zh'},{...job,sourceSha256:'0'.repeat(64)},{...job,destinationObjectKey:'private/other.pdf'}])await assert.rejects(()=>writeVerifiedWatermarkArtifact({bucket:adapter,job:bad,bytes,inspection}));await assert.rejects(()=>writeVerifiedWatermarkArtifact({bucket:adapter,job,bytes,inspection:{...inspection,watermarkedPages:263}}));const saved=localObject.metadata;localObject.metadata={...saved,purchaseId:'OTHER'};await assert.rejects(()=>writeVerifiedWatermarkArtifact({bucket:adapter,job,bytes,inspection}));localObject.metadata=saved;check('forged identity incomplete PDF and metadata conflict rejected',true);return Response.json({status:'processing'});}
  const uploaded=await network(base+'/'+job.destinationObjectKey,{method:'PUT',headers:{...headers,'Content-Type':'application/pdf'},body:bytes,signal:AbortSignal.timeout(600000)});const uploadBody=await uploaded.json();receipt.upload={http:uploaded.status,success:uploadBody.success,result:uploadBody.result,errors:uploadBody.errors};
  if(!uploaded.ok||!uploadBody.success)throw Error('QA_R2_UPLOAD_FAILED_'+uploaded.status);receipt.remoteUploads++;lastObject=await remoteHead(job.destinationObjectKey);receipt.remoteObject=lastObject;
  const read=await network(base+'/'+job.destinationObjectKey,{headers,signal:AbortSignal.timeout(600000)});if(!read.ok)throw Error('QA_R2_READBACK_FAILED_'+read.status);const readback=Buffer.from(await read.arrayBuffer());check('real private R2 full byte readback',sha(readback)===sha(bytes));
  return Response.json({status:'processing'});
 }
 assert.equal(u.hostname,'api.stripe.com');const f=new URLSearchParams(options.body);
 if(u.pathname==='/v1/account')return Response.json({id:'acct_1Pkdz8B2F823WiPt'});
 if(u.pathname==='/v1/customers')return Response.json({id:'cus_r3synthetic'});
 if(u.pathname==='/v1/checkout/sessions'){
  const metadata={};for(const[k,v]of f)if(k.startsWith('metadata['))metadata[k.slice(9,-1)]=v;
  session={id:'cs_r3synthetic',url:'https://checkout.stripe.com/c/pay/SYNTHETIC',expires_at:Math.floor(Date.now()/1000)+600,customer:f.get('customer'),metadata,livemode:true,mode:'payment',currency:'myr',amount_total:p.amountMinor,payment_status:'paid',payment_intent:'pi_r3synthetic',line_items:{has_more:false,data:[{quantity:1,price:{id:p.livePriceId,product:p.liveProductId,currency:'myr',unit_amount:p.amountMinor,recurring:null}}]}};return Response.json(session);
 }
 if(u.pathname.startsWith('/v1/checkout/sessions/'))return Response.json(session);
 throw Error('UNEXPECTED_SYNTHETIC_STRIPE_PATH');
}
async function api(action,body={},owner='qa-r3-A'){
 const response=await commerceApi({request:new Request('http://localhost/api/commerce-'+action,{method:'POST',headers:{origin:'http://localhost','content-type':'application/json','idempotency-key':crypto.randomUUID()},body:JSON.stringify(body)}),env,data:identity(owner),fetch:fetcher},action);return{status:response.status,body:await response.json()};
}
async function event(type,id,object=session){const raw=JSON.stringify({id,type,livemode:true,data:{object}}),sig=await createStripeTestSignature(raw,env.STRIPE_WEBHOOK_SECRET,Math.floor(Date.now()/1000));const response=await webhook({request:new Request('http://localhost/api/stripe-webhook',{method:'POST',headers:{'stripe-signature':sig},body:raw}),env,fetch:fetcher});return{status:response.status,body:await response.json()};}
try{
 const c=await api('checkout',{productId:p.productId,acceptDigitalPolicy:true,locale:'en'});check('formal checkout creates QA order',c.status===201);receipt.checkout=c;
 receipt.payment=await event('checkout.session.completed','evt_r3syntheticpaid');check('signed synthetic payment granted exactly one entitlement',sql.prepare('SELECT count(*) n FROM digital_entitlements').get().n===1);
 if(local){check('watermark outage is not silently delivered',receipt.payment.status===503&&(await api('book-download',{productId:p.productId})).status===409);receipt.recovery=await event('checkout.session.completed','evt_r3syntheticpaid');check('retry recovers same paid order',receipt.recovery.status===200);}
 receipt.replay=await event('checkout.session.completed','evt_r3syntheticpaid');check('payment replay does not regenerate/upload',stampCount===1&&sql.prepare('SELECT count(*) n FROM digital_entitlements').get().n===1);
 const body=JSON.stringify({jobId:job.jobId,status:'completed',destinationObjectKey:job.destinationObjectKey}),timestamp=Math.floor(Date.now()/1000),signature=await hmacHex(env.BOOK_WATERMARK_SERVICE_TOKEN,`${timestamp}.${body}`,'watermark-service');
 const result=await callback({request:new Request('http://localhost/api/book-one-watermark-complete',{method:'POST',headers:{'x-phios-timestamp':String(timestamp),'x-phios-signature':signature},body}),env,fetch:fetcher});receipt.callback={status:result.status,body:await result.json()};
 if(local){
  check('valid callback completes full PDF delivery',result.status===200);
  const get=(url,owner='qa-r3-A')=>download({request:new Request('http://localhost'+url),env,data:identity(owner)});
  receipt.download=await api('book-download',{productId:p.productId});check('owner receives download token',receipt.download.status===200);
  check('cross account token denied',(await get(receipt.download.body.downloadUrl,'qa-r3-B')).status===403);
  let response=await get(receipt.download.body.downloadUrl);check('owner gets actual full watermarked bytes',response.status===200&&sha(Buffer.from(await response.arrayBuffer()))===receipt.watermark.sha256);
  const retryToken=await api('book-download',{productId:p.productId});response=await get(retryToken.body.downloadUrl);check('redownload returns same full PDF without generation',response.status===200&&sha(Buffer.from(await response.arrayBuffer()))===receipt.watermark.sha256&&stampCount===1);
  sql.prepare("UPDATE commerce_download_tokens SET expires_at='2000-01-01T00:00:00.000Z'").run();check('expired token rejected',(await get(retryToken.body.downloadUrl)).status===403);
  const limited=await api('book-download',{productId:p.productId});let successes=0;for(let i=0;i<4;i++){const x=await get(limited.body.downloadUrl);if(x.status===200){successes++;await x.arrayBuffer();}else{check('token use limit enforced',x.status===403);break;}}check('token not unlimited',successes>0&&successes<4);receipt.successfulLimitedTokenUses=successes;
 }else{
  check('callback fails closed on missing REAL R2 identity metadata',result.status===409&&receipt.callback.body.error==='book_pdf_identity_mismatch');
  receipt.download=await api('book-download',{productId:p.productId});check('no download token issued before verified watermark',receipt.download.status===409);
 }
 receipt.crossAccount=await api('book-download',{productId:p.productId},'qa-r3-B');check('cross account denied',receipt.crossAccount.status===403);
 receipt.refund=await event('charge.refunded','evt_r3syntheticrefund',{id:'ch_r3synthetic',livemode:true,payment_intent:session.payment_intent,amount_refunded:session.amount_total,currency:'myr'});check('synthetic refund revokes entitlement',(await api('book-download',{productId:p.productId})).status===403);
 receipt.state=local?'PASS_LOCAL_FULL_SIZE_DELIVERY_NOT_REMOTE_SERVICE_CLOSURE':'BLOCKED_REAL_TARGET_METADATA_AND_SERVICE_NOT_CONFIGURED_FULL_SIZE_LOCAL_AND_R2_ROUNDTRIP_PASS';
}catch(error){receipt.state='FAILED_OR_BLOCKED';receipt.error=error.message;throw error;}finally{fs.writeFileSync(out+(local?'/TRUSTED-METADATA-LOCAL-QA.json':'/FULL-SIZE-R3-QA.json'),JSON.stringify(receipt,null,2));}
console.log(JSON.stringify({state:receipt.state,remoteUploads:receipt.remoteUploads,checks:receipt.checks.length,callback:receipt.callback}));
