import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import path from 'node:path';import {pathToFileURL} from 'node:url';
const root='content/production-closure/batch05',docs='docs/production-closure/batch05',read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const baseline=read(`${root}/baseline.json`);for(const r of [...baseline.protectedFiles,...baseline.inheritedFiles])assert.equal(sha(r.path),r.sha256,r.path);
assert.equal(read(`${root}/focused-results.json`).results.length,24);
assert.equal(read(`${root}/provider-execution-proposal.json`).enabled,false);
await assert.rejects(()=>fetch('https://api.openai.com/v1/responses'),/ZERO_COST_REPLAY_NETWORK_BLOCKED|OPT_IN_REQUIRED/);
const {chromium}=await import('file:///C:/Users/Guest%20Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],blocked=[],errors=[];
fs.mkdirSync(`${docs}/screenshots`,{recursive:true});
try{const c=await browser.newContext();await c.route('**/*',r=>/^(file:|data:|blob:)/.test(r.request().url())?r.continue():(blocked.push(r.request().url()),r.abort()));const page=await c.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve('tools/review/PHI-OS-PRODUCTION-CLOSURE-BATCH-05-HUMAN-REVIEW.html')).href);
 for(const width of [1280,390]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.locator('form').count(),0);const sections=await page.locator('section').count();assert(sections>=13);assert((await page.textContent('main')).includes('READY_FOR_BATCH_05_COMPOSITION_ARCHITECTURE_HUMAN_REVIEW'));const screenshot=`${docs}/screenshots/REVIEW-${width}.png`;await page.screenshot({path:screenshot,fullPage:false});results.push({width,horizontalOverflow:false,sections,forms:0,screenshot,status:'PASS'});}
 assert.equal(blocked.length,0);assert.equal(errors.length,0);await c.close();}finally{await browser.close();}
fs.writeFileSync(`${root}/browser-results.json`,JSON.stringify({results,errors,blocked,externalResources:0,scope:'Actual architecture review rendering; no new customer report visual validation claimed.'},null,2)+'\n');
console.log('PASS 24 recorded focused groups, protected/inherited SHA preservation, external provider transport denied, 1280px and 390px portable review: no overflow, no external resources, no acceptance forms.');
