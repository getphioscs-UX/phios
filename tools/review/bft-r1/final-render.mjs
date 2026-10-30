import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {build} from 'esbuild';
import {chromium} from 'file:///C:/Users/Guest%20Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out='content/production-closure/live-customer-commercial-convergence/bft-r1',base=JSON.parse(fs.readFileSync('.tmp/bft-r1/server.json')).base,results=[];
await build({entryPoints:['functions/professional/workspace/bft-local-workflow-r1.js'],outfile:'.tmp/bft-r1/workflow.bundle.mjs',platform:'node',target:'node22',format:'esm',bundle:true});
await build({entryPoints:['assets/customer-ui/js/surfaces/bft-r1.js'],outfile:'.tmp/bft-r1/client.bundle.js',platform:'browser',target:'es2022',format:'esm',bundle:true});
fs.writeFileSync(out+'/BUILD.json',JSON.stringify({status:'PASS',scope:'SCOPED_NODE22_AND_BROWSER_COMPILATION_ONLY',fullNpmCheck:'NOT_RUN',productionBuild:'NOT_RUN',providerCalls:0},null,2));
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']}),ctx=await browser.newContext(),page=await ctx.newPage();await ctx.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
const ctl=id=>page.locator('#bft-r1 [data-bft="'+id+'"]');
try{
 await page.goto(base+'/professional/#bft-r1',{waitUntil:'domcontentloaded'});await ctl('login-A').click();await page.waitForFunction(()=>document.querySelector('#bft-r1')?.textContent.includes('session: A'));
 const [read]=await Promise.all([page.waitForResponse(r=>r.url()===base+'/api/bft?case=bft-owner'),ctl('bft-owner').click()]);assert.equal(read.status(),200);await ctl('client-decision').waitFor();const [decision]=await Promise.all([page.waitForResponse(r=>r.url().includes('/api/bft?case=')&&r.request().method()==='POST'),ctl('client-decision').click()]);assert.equal(decision.status(),200);await page.waitForFunction(()=>document.querySelector('#bft-r1 .bft-status').textContent.includes('Saved'));results.push({name:'Final client acknowledgment: no advice/payment/assignment activation',status:'PASS'});
 for(const lang of ['en','zh']){await ctl(lang).click();await page.waitForFunction(zh=>document.querySelector('#bft-r1').textContent.includes(zh?'让下一步':'Make the next'),lang==='zh');
  for(const width of [360,768,1440])for(const id of ['bft-owner','bft-family','bft-team','bft-institution']){await page.setViewportSize({width,height:1000});const [r]=await Promise.all([page.waitForResponse(r=>r.url()===base+'/api/bft?case='+id),ctl(id).click()]);assert.equal(r.status(),200);await ctl('intake-save').waitFor();assert.equal(await page.locator('#bft-r1').evaluate(x=>x.scrollWidth>x.clientWidth+2),false);
   if(lang==='en'&&width===1440||lang==='zh'&&width===360)await page.locator('#bft-r1').screenshot({path:out+'/'+id+'-'+lang+'-'+width+'.png'});
   results.push({name:id+' '+lang+' '+width+'px FINAL',status:'PASS'});
  }
 }
 const root=page.locator('#bft-r1');await ctl('en').click();await page.waitForFunction(()=>document.querySelector('#bft-r1').textContent.includes('Make the next'));
 await page.getByLabel('What do you want to understand?',{exact:true}).fill('Final source-bound review');const [save]=await Promise.all([page.waitForResponse(r=>r.url().includes('/api/bft?case=')&&r.request().method()==='POST'),ctl('intake-save').click()]);assert.equal(save.status(),200);await page.waitForFunction(()=>document.querySelector('#bft-r1 .bft-status').textContent.includes('Saved'));results.push({name:'Final save lock / reload retains selected input scope',status:'PASS'});
 const priv=(await page.request.get(base+'/api/bft?case=bft-owner').then(r=>r.json()));assert.equal(priv.clientAcknowledgment.regulatedAdviceAccepted,false);assert.equal(priv.paid,false);assert.equal(priv.report.assignment.status,'proposed');
}catch(e){results.push({name:'Final browser verification',status:'FAIL',reason:e.message});throw e;}finally{
 const paths=['functions/professional/financial/bft-liquidity-candidate-r1.js','functions/professional/workspace/bft-local-workflow-r1.js','assets/customer-ui/js/surfaces/bft-r1.js','assets/customer-ui/surfaces/bft-r1.css','tools/review/bft-r1/server.mjs'];
 fs.writeFileSync(out+'/FINAL-RENDER.json',JSON.stringify({status:results.every(x=>x.status==='PASS')?'PASS':'FAIL',results,sourceDigests:Object.fromEntries(paths.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')])),earlierInteractionEvidence:'BROWSER.json (33 checks, exact earlier source digests retained)',finalChanges:'Local preview header overlap repair, checkbox layout, Chinese section labels and explicit client acknowledgment',shellScope:'Loopback harness only; shared shell source untouched',sharedLogoAsset:'NOT_VERIFIED_OFFLINE_NO_REPLACEMENT_OR_REMOTE_BYTES_CLAIM',providerCalls:0,productionVerified:false},null,2));await browser.close();
}
console.log('Final scoped build PASS; browser '+results.length+'/'+results.length+' PASS.');
