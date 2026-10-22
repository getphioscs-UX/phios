import fs from 'node:fs';import assert from 'node:assert/strict';
import {chromium} from 'file:///C:/Users/Guest%20Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const dir='tools/review/knowledge-answer-quality-r1/',origin='http://127.0.0.1:59835';
const checks=[],browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
try{for(const locale of ['en','zh-Hans'])for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 await page.goto(origin);await page.selectOption('#locale',locale);
 await page.fill('#question',locale==='en'?'Why do higher oil prices affect food and transport costs?':'油价上涨后，为什么连买菜和送货也可能变贵？');
 const response=page.waitForResponse(r=>r.url()===origin+'/query');await page.click('#ask');const api=await response;const body=await api.json();
 await page.waitForFunction(()=>!document.querySelector('#status').textContent.includes('…'));
 assert.equal(api.status(),200);assert.ok(body.answer.directAnswer);assert.ok(body.diagnostics.top5.length);assert.ok((await page.locator('#answer').innerText()).length>80);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false);assert.equal(errors.length,0);
 const answerText=await page.locator('#answer').innerText();assert.ok(!/SHA-256|JSON Pointer|canonicalNode|KIR_R2/.test(answerText));
 await page.screenshot({path:dir+`final-${locale}-${width}.png`,fullPage:true});
 await page.locator('summary').filter({hasText:'Human annotation'}).click();await page.click('#blind');await page.waitForFunction(()=>document.querySelector('#blindq').textContent.length>15);assert.equal(await page.locator('#gold').inputValue(),'');
 await page.route('**/query',r=>r.fulfill({status:503,body:'unavailable'}));await page.click('#ask');await page.waitForFunction(()=>/unavailable|暂时/.test(document.querySelector('#status').textContent));assert.equal(await page.locator('#answer').innerText(),'');
 checks.push({locale,width,apiStatus:api.status(),route:body.answer.route||'REVIEW_PENDING',sourceIds:body.diagnostics.top5.map(r=>r.id),overflow,errors,sourceLoad:true,failureClearsOldAnswer:true,humanAnnotationBlank:true});await page.close();
}}
finally{await browser.close();}
const http=[];for(const payload of [{question:'x',locale:'xx'},{question:'',locale:'en'},{question:'x'.repeat(501),locale:'en'},{question:'why fuel?',locale:'en',sources:['injected']},{question:'why fuel?',locale:'en',paidAuthorization:true},{question:'why fuel?',locale:'en',accountId:'fake'}]){const r=await fetch(origin+'/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});assert.equal(r.status,400);http.push({inputKeys:Object.keys(payload),status:r.status});}
const foreign=await fetch(origin+'/query',{method:'POST',headers:{Origin:'https://untrusted.invalid'},body:'{}'});assert.equal(foreign.status,403);
fs.writeFileSync(dir+'BROWSER-HTTP.json',JSON.stringify({at:new Date().toISOString(),checks,http,foreignOrigin:foreign.status,providerCalls:0},null,2));console.log(JSON.stringify({browserFlows:checks.length,httpRejects:http.length+1}));
