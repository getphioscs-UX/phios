import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {executeIChingProductRuntime} from '../functions/iching-product-runtime/iching-product-runtime-v2.js';
const read=p=>JSON.parse(fs.readFileSync(p)),authorities={hexagramRegistry:read('content/professional/core-method-runtime/iching-hexagram-registry-v1.json'),sourceRegistry:read('content/interpretation/iching/registries/iching-source-registry-v2.json'),perspectiveRegistry:read('content/interpretation/iching/registries/iching-interpretation-perspective-registry-v2.json'),corpus:read('content/interpretation/iching/corpus/iching-public-domain-canonical-corpus-v2.json'),depthCorpus:read('content/interpretation/iching/corpus/iching-depth-admitted-editorial-corpus-v2.json')};
const {chromium}=await import(pathToFileURL('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href),browser=await chromium.launch({channel:'msedge',headless:true}),checks=[];
try{for(const locale of ['en','zh-Hans']){
const context=await browser.newContext({viewport:{width:390,height:900}});let submissions=0,unexpectedWrites=0,lastBody;
await context.route('**/api/**',async route=>{const request=route.request(),path=new URL(request.url()).pathname;
// Explicit isolated UI fixture. This does not activate or alter production authority.
if(path==='/api/iching-full-production-status')return route.fulfill({json:{production:{runAllowed:true,globalPublicExecution:true}}});
if(path==='/api/iching-full-context')return route.fulfill({json:{guest:{saveContractAvailable:false}}});
if(path==='/api/iching-full-execute'&&request.method()==='POST'){lastBody=request.postDataJSON();submissions++;if(submissions===1)return route.fulfill({status:503,json:{error:{code:'RECOVERY_TEST_FAILURE'}}});const result=await executeIChingProductRuntime(lastBody,authorities);return route.fulfill({json:result});}
if(request.method()!=='GET'){unexpectedWrites++;return route.abort();}return route.continue();});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:50420/perspectives/iching/consult/?locale='+locale);await page.waitForLoadState('networkidle');
await page.locator('[data-method="MANUAL_LINES"]').click();await page.locator('[data-read-manual]').click();assert.equal(submissions,0);assert.ok(await page.locator('[data-service-message]').isVisible());
await page.locator('[data-consult-question]').fill(locale==='en'?'What should I understand before acting?':'采取行动前，我需要先理解什么？');const lines=[7,7,7,6,8,7];for(let i=0;i<6;i++)await page.locator('[data-manual-line]').nth(i).selectOption(String(lines[i]));
await page.locator('[data-read-manual]').click();await page.waitForFunction(()=>document.body.dataset.ichingBusy==='false');assert.match(await page.locator('[data-service-message]').innerText(),/RECOVERY_TEST_FAILURE/);assert.equal(await page.locator('[data-read-manual]').isEnabled(),true);
await page.locator('[data-read-manual]').click();await page.locator('[data-reading-content] .icx-answer-lead').waitFor();await page.waitForFunction(()=>document.body.dataset.ichingBusy==='false');assert.deepEqual(lastBody.lines,lines);assert.equal(lastBody.locale,locale);assert.equal(submissions,2);assert.equal(unexpectedWrites,0);assert.equal(errors.length,0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
page.on('dialog',d=>d.accept());await page.locator('[data-new-reading]').click();await page.waitForFunction(()=>document.querySelector('[data-reading]').hidden);assert.equal(await page.locator('[data-workflow-body]').isVisible(),true);assert.equal(await page.locator('[data-reading]').isVisible(),false);
checks.push({locale,status:'PASS',mode:'ISOLATED_UI_FIXTURE_WITH_REAL_EXISTING_DETERMINISTIC_RUNTIME',manualLines:lines,primaryHexagram:26,changingLines:[4],blankInputBlocked:true,errorRetryPassed:true,resultRendered:true,returnPassed:true,unexpectedWrites,providerCalls:0,productionAuthorityModified:false});await context.close();
}}finally{await browser.close();fs.writeFileSync('artifacts/live-page-recovery-r1/ICHING-UI-CHECKS.json',JSON.stringify({checks,providerCalls:0,liveQualityVerified:false},null,2));}console.log(checks);
