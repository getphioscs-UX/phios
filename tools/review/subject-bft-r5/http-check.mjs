import fs from 'node:fs';import assert from 'node:assert/strict';
import {loadWorldPlaywright,worldBrowserLaunchOptions} from '../../../scripts/lib/world-browser-runtime.mjs';
const dir='content/production-closure/live-customer-commercial-convergence/subject-bft-r5',base=JSON.parse(fs.readFileSync('.tmp/subject-bft-r5/server.json')).base,
 state=JSON.parse(fs.readFileSync('.tmp/subject-bft-r5/restart.json')),results=[];
const {chromium}=await loadWorldPlaywright();const browser=await chromium.launch(worldBrowserLaunchOptions());
const page=await browser.newPage();await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
const test=async(name,fn)=>{try{await fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',reason:e.message});throw e;}};
const url=base+'/api/r5/read?'+new URLSearchParams({subject:state.subject,intakeRef:JSON.parse(fs.readFileSync('.tmp/subject-bft-r5/restart.json')).intakeRef||'',sourceVersion:state.sourceVersion});
try{
 await test('Anonymous real HTTP projection denied',async()=>assert.equal((await page.request.get(url)).status(),401));
 await page.request.post(base+'/api/r3/login',{headers:{origin:base},data:{alias:'A'}});
 const snap=await page.request.post(base+'/api/r4/reopen?subject='+encodeURIComponent(state.subject),{headers:{origin:base},data:{referenceId:state.referenceId}});assert.equal(snap.status(),200);const saved=await snap.json();
 const sourceUrl=base+'/api/r5/read?'+new URLSearchParams({subject:state.subject,intakeRef:saved.payload.intakeRef,sourceVersion:state.sourceVersion});
 await test('Authenticated native HTTP read returns exact source/profile/Reading/Navigation projection',async()=>{const response=await page.request.get(sourceUrl);assert.equal(response.status(),200);const p=await response.json();assert.equal(p.source.sourceVersion,state.sourceVersion);assert.equal(p.navigation.family,'FINANCIAL');assert.equal(p.reading.formalFiveOutputAdmission,false);assert.equal(response.headers()['cache-control'],'private, no-store');});
 await test('HTTP missing confirmation rejected; cross-account fresh login rejected',async()=>{assert.equal((await page.request.get(sourceUrl.replace(state.sourceVersion,'0'.repeat(64)))).status(),409);await page.request.post(base+'/api/r3/login',{headers:{origin:base},data:{alias:'B'}});assert.equal((await page.request.get(sourceUrl)).status(),403);});
 await page.request.post(base+'/api/r3/login',{headers:{origin:base},data:{alias:'A'}});
 for(const lang of ['en','zh-Hans'])for(const width of [390,1440])await test('Existing R4 product UI and R5 authenticated source '+lang+' '+width,async()=>{
   await page.setViewportSize({width,height:1000});const p=new URL(base+'/reality/');p.search=new URLSearchParams({subjectId:state.subject,intakeRef:saved.payload.intakeRef,locale:lang,r4Record:state.referenceId}).toString();
   await page.goto(p.href,{waitUntil:'domcontentloaded'});await page.locator('[data-r4="analyze"]').waitFor();
   const response=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/r4/diagnosis');await page.locator('[data-r4="analyze"]').click();assert.equal((await response).status(),200);
   await page.locator('#business-liquidity-r4 h3').first().waitFor();assert.equal(await page.locator('#business-liquidity-r4').evaluate(n=>n.scrollWidth>n.clientWidth+2),false);
   const x=await page.request.get(sourceUrl+'&locale='+lang);assert.equal(x.status(),200);assert.equal((await x.json()).source.sourceVersion,state.sourceVersion);
 });
}catch(e){if(!results.some(x=>x.status==='FAIL'))results.push({name:'setup',status:'FAIL',reason:e.message});console.error(e.stack);process.exitCode=1;}finally{await browser.close();fs.writeFileSync(dir+'/HTTP-BROWSER-TESTS.json',JSON.stringify({status:process.exitCode?'FAIL':'PASS',results,base,node:process.version,newScreenshots:0,visualEvidence:'R4 exact unchanged UI/CSS screenshots reused; R5 delta is private source API only',providerCalls:0,production:false},null,2));console.log(JSON.stringify(results));}
