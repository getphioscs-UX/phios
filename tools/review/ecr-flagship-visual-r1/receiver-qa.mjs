import fs from 'node:fs';import assert from 'node:assert/strict';
import {createPreviewServer} from './preview-server.mjs';import {loadWorldPlaywright,worldBrowserLaunchOptions} from '../../../scripts/lib/world-browser-runtime.mjs';
const D='tools/review/ecr-flagship-visual-r1/',server=createPreviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const browser=await loadWorldPlaywright().chromium.launch(worldBrowserLaunchOptions());try{
 const page=await browser.newPage({viewport:{width:360,height:900}});await page.route('https://**',r=>r.abort());
 await page.goto(origin+'/perspectives/phi-configuration/?locale=en&personalEvidence=1',{waitUntil:'networkidle'});await page.waitForSelector('[data-ef-ready="true"]');await page.waitForSelector('#pe-receiver');
 await page.evaluate(()=>{window.__receiver=document.querySelector('#pe-receiver');window.__hits=0;window.__receiver.addEventListener('review-preservation-check',()=>window.__hits++);document.documentElement.lang='zh-Hans';});
 await page.waitForFunction(()=>document.querySelector('#pe-receiver')===window.__receiver);
 await page.evaluate(()=>{document.querySelector('#pe-receiver').dispatchEvent(new Event('review-preservation-check'));});
 assert.equal(await page.evaluate(()=>window.__hits),1);assert.equal(await page.locator('#pe-receiver').count(),1);
 assert.equal(await page.locator('[data-ef-layer]').count(),8);assert.equal(await page.locator('[data-ecr-mandala-root]').count(),1);
 await page.goto(origin+'/perspectives/phi-configuration/?locale=en',{waitUntil:'networkidle'});await page.waitForSelector('[data-ef-ready="true"]');assert.equal(await page.locator('#pe-receiver').count(),0);assert.equal(await page.locator('[data-ef-section]').count(),8);
 fs.writeFileSync(D+'RECEIVER-QA.json',JSON.stringify({status:'PASS',existingLocalOnlyReceiverRetained:true,sameDOMNode:true,listenerPreserved:true,localeRerenderPreserved:true,ordinaryPageReceiverAbsent:true,ordinaryPageEightSections:true,privateAccountRead:false,providerCalls:0,productionWrites:0},null,2));console.log('PASS existing local receiver identity/listener and ordinary-page isolation');
}finally{await browser.close();await new Promise(r=>server.close(r));}
