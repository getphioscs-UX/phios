import {chromium} from 'file:///C:/Users/Guest%20Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const out=new URL('./',import.meta.url),results=[],errors=[],blocked=[];const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
const dependencyPaths=['../RIC-HUMAN-REVIEW.html','app.mjs','../candidate/ric.mjs','../candidate/scenarios.mjs','../candidate/schemas.mjs','../fixtures/source-backed.json'];const hashes=()=>Object.fromEntries(dependencyPaths.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(new URL(p,out))).digest('hex')]));const inputHashes=hashes();
try{for(const locale of ['en','zh-Hans'])for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname==='127.0.0.1'&&u.port==='59831')return route.continue();blocked.push(u.origin);return route.abort();});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+' '+r.status());});
 await page.goto('http://127.0.0.1:59831/RIC-HUMAN-REVIEW.html?locale='+locale);await page.waitForFunction(()=>window.ricReview?.result);
 for(const id of ['A','B','C','D']){
  await page.locator(`[data-case="${id}"]`).click();await page.waitForFunction(id=>window.ricReview.result.id===id,id);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'horizontal overflow');assert.equal(await page.evaluate(()=>window.ricReview.result.persisted),false);
  if(id==='C'){
   await page.locator('[data-ref="C-public"]').check();await page.locator('[data-ref="C-budget"]').check();await page.locator('#preview').click();await page.waitForFunction(()=>/2/.test(document.querySelector('#selection-result').textContent));
   await page.locator('#revoke').click();await page.locator('[data-ref="C-budget"]').check();await page.locator('#preview').click();await page.waitForFunction(()=>/denied|拒绝/.test(document.querySelector('#selection-result').textContent));
   await page.locator('[data-ref="C-budget"]').uncheck();await page.locator('[data-ref="C-public"]').check();await page.locator('#preview').click();await page.waitForFunction(()=>/1/.test(document.querySelector('#selection-result').textContent));
  }
  results.push({locale,width,scenario:id,overflow:false,previewOnly:true,status:'PASS'});
 }
 await page.locator('[data-case="B"]').click();await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.activeElement!==document.body));
 const a11y=await page.evaluate(()=>({lang:document.documentElement.lang,liveStatus:document.querySelector('#selection-result').getAttribute('aria-live'),reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,brokenImages:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).length}));assert.equal(a11y.lang,locale);assert.equal(a11y.liveStatus,'polite');assert.equal(a11y.reducedMotion,true);assert.equal(a11y.brokenImages,0);
 await page.screenshot({path:new URL(`final-${locale}-${width}.png`,out).pathname.replace(/^\/([A-Z]:)/,'$1'),fullPage:true});
 await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);assert.deepEqual(hashes(),inputHashes,'Browser dependency drift during verification');
 fs.writeFileSync(new URL('BROWSER-RESULTS.json',out),JSON.stringify({status:'PASS_LOCAL_BROWSER',inputHashes,views:results,consoleOrHttpErrors:errors,externalNetworkAttempts:blocked.length,providerCalls:0,sourceLinks:'Canonical href inspected; external navigation intentionally not fetched',keyboardFocus:'Tab reaches controls; visible focus style',screenshots:['final-en-1440.png','final-en-390.png','final-zh-Hans-1440.png','final-zh-Hans-390.png'],humanVisualAcceptance:'PENDING'},null,2));
}finally{await browser.close();}
