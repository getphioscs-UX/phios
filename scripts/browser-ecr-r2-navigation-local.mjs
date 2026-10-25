import fs from 'node:fs';import assert from 'node:assert/strict';
import {chromium} from 'file:///C:/Users/Guest%20Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {start} from './ecr-r2-navigation-test-server.mjs';
import {fixture,call} from '../tools/review/personal-evidence-r1/evidence-system-r1/local-test.mjs';
const out='tools/review/phi-configuration-deep-reading-r2-integrated/continuation-local-20261025',results=[];
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
try{for(const lang of ['en','zh-Hans'])for(const width of [390,1440]){
 const s=await start(),page=await browser.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>route.request().url().startsWith(s.url)?route.continue():route.abort());
 try{
  const saved=await call(s.env,{action:'save',record:{...fixture,claimDirection:'CHALLENGES',outcome:'Synthetic counterexample retained'},requestToken:crypto.randomUUID(),consent:true,retentionConsent:true,expiresAt:new Date(Date.now()+86400000).toISOString()});assert.equal(saved.status,201);
  await page.goto(s.url+'/perspectives/profile/?evidence=1&locale='+lang,{waitUntil:'networkidle'});await page.locator('[data-pe-load]').click();await page.locator('[data-select]').waitFor();await page.locator('[data-select]').check();
  await page.locator('[data-pe-target]').selectOption('NAVIGATION');await page.locator('[data-pe-question]').fill(lang==='en'?'What should I verify next?':'下一步应核实什么？');await page.locator('[data-pe-consent]').check();await page.locator('[data-pe-handoff]').click();
  await page.waitForFunction(()=>/Navigation received|导航已接收/.test(document.querySelector('[data-pe-package]').textContent));
  assert.match(await page.locator('[data-pe-package]').innerText(),/Synthetic counterexample retained/);assert(s.logs.some(l=>l.path==='/api/customer-my-reality'&&l.status===200));
  await page.locator('#pe-area-5').screenshot({path:`${out}/navigation-${lang}-${width}.png`});
  await page.locator('[data-pe-withdraw]').click();assert.equal(await page.locator('[data-pe-package]').innerText(),'');
  // A late response must not reappear after withdrawal.
  let release;const gate=new Promise(r=>release=r);await page.route('**/api/customer-my-reality',async route=>{await gate;await route.continue();});
  await page.locator('[data-pe-consent]').check();await page.locator('[data-pe-handoff]').click();await page.waitForTimeout(150);await page.locator('[data-pe-withdraw]').click();release();await page.waitForTimeout(400);assert.equal(await page.locator('[data-pe-package]').innerText(),'');
  assert.equal(errors.length,0,errors.join('\n'));results.push({lang,width,status:'PASS',actualProfileApi:true,actualNavigationApi:true,counterexample:true,withdrawal:true,lateResponseSuppressed:true,errors,remoteAssets:'BLOCKED_NOT_VERIFIED',providerCalls:0});
 }finally{await page.close();await s.close();}
}}finally{await browser.close();fs.writeFileSync(`${out}/browser-navigation-results.json`,JSON.stringify({results,providerCalls:0,productionWrites:0},null,2));}
console.log(JSON.stringify(results));
