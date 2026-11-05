// Execute the original stale-price assertions, then stop before the separate
// synthetic full-commerce child suite. No expected status/assertion is changed.
const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module'),{spawnSync}=require('node:child_process');
const owner=path.resolve(__dirname,'../../..'),entry=path.join(owner,'scripts/check-commerce-stripe-r1.mjs');
const base='D:/PHIOS/QA-TEMP/SIX-METHOD-R2',run=path.join(base,'r25-commerce-price-'+Date.now());
if(fs.statfsSync(base,{bigint:true}).bavail*fs.statfsSync(base,{bigint:true}).bsize<50_000_000_000n)throw Error('D_SPACE_REQUIREMENT');
fs.mkdirSync(run);
let source=fs.readFileSync(entry,'utf8');
const stop="    const child=spawnSync(process.execPath,";
if(source.split(stop).length!==2||!source.includes("assert.equal(response.status,503,p.productId)"))throw Error('ORIGINAL_ASSERTION_ANCHOR_DRIFT');
source=source.replace(stop,"    console.log(JSON.stringify({status:'PASS_ORIGINAL_STALE_QA_PRICE_BOUNDARY_ONLY',cases,realStripeCalls:0,fullCommerceSuiteRun:false}));process.exit(0);\n"+stop);
const beforeReceipt="    fs.mkdirSync('docs/qa/commerce-stripe-r1',{recursive:true});";
if(source.split(beforeReceipt).length!==2)throw Error('COMMERCE_RECEIPT_ANCHOR_DRIFT');
source=source.replace(beforeReceipt,`
    for(const productId of ['COM-REPORT-ZIWEI-FULL','COM-REPORT-ASTROLOGY-FULL','COM-REPORT-NUMEROLOGY-FULL','COM-REPORT-HD-FULL','COM-REPORT-ECR-FULL','COM-REPORT-BAZI-FULL']){
      await test(productId+' valid QA price cannot bypass closed report admission',async()=>{
        const product=STRIPE_PRODUCT_REGISTRY.find(p=>p.productId===productId);assert(product);
        const before=sqlite.prepare('SELECT COUNT(*) n FROM commerce_checkout_attempts').get().n;let reads=0;
        const readOnly=async(url,options)=>{assert.equal(options.method,'GET');assert.equal(new URL(url).pathname,'/v1/prices/'+product.qaPriceId);reads++;return respond({id:product.qaPriceId,product:product.qaProductId,unit_amount:product.amountMinor,currency:'myr',active:true,livemode:false});};
        const disabled=productId==='COM-REPORT-BAZI-FULL';
        for(const enabled of disabled?[false]:[false,true]){
          const response=await commerceApi(context({productId},{env:{...env,PHIOS_SHARED_PAID_REPORT_ENABLED:String(enabled)},fetch:readOnly}),'checkout');
          assert.equal(response.status,409);assert.match((await response.json()).error,/METHOD_ADMISSION_CLOSED|SHARED_ADAPTER_ABSENT|SHARED_REPORT_SETUP_DISABLED/);
          assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM commerce_checkout_attempts').get().n,before);
        }
        assert.equal(reads,product.qaPriceVerificationRequired?(disabled?1:2):0);
      });
    }
`+beforeReceipt);
source=source.replaceAll('docs/qa/commerce-stripe-r1',run.replaceAll('\\','/'));
const esbuild=createRequire('C:/phios/package.json')('esbuild'),out=path.join(run,'test.mjs');
esbuild.buildSync({stdin:{contents:source,resolveDir:path.join(owner,'scripts'),sourcefile:'original-commerce-price-boundary.mjs'},bundle:true,platform:'node',format:'esm',outfile:out,logLevel:'silent'});
const env={...process.env,TEMP:run,TMP:run,REPORT_ZERO_COST_REPLAY:'true',REPORT_PROVIDER_LIVE_ALLOWED:'false'};
for(const key of Object.keys(env))if(/^(OPENAI|ANTHROPIC|DEEPSEEK|GEMINI|GOOGLE_AI|OPENROUTER).*(API_KEY|ACCESS_TOKEN|SECRET)$/.test(key))delete env[key];
const result=spawnSync(process.execPath,['--import','file:///C:/phios/scripts/lib/report-zero-cost-preload.mjs',out],{cwd:owner,env,encoding:'utf8',timeout:180000});
fs.writeFileSync(path.join(run,'stdout.log'),result.stdout||'');fs.writeFileSync(path.join(run,'stderr.log'),result.stderr||'');
console.log(JSON.stringify({run,exitCode:result.status,scope:'ORIGINAL_STALE_PRICE_ASSERTIONS_ONLY'}));
if(result.status!==0){console.error(result.stderr);process.exit(result.status||1);}
console.log(result.stdout);
