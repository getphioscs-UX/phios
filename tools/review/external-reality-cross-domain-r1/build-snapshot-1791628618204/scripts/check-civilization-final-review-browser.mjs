import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createPublicationReviewServer} from './lib/book-publication-review-server.mjs';
const {chromium}=await import(process.env.PHIOS_PLAYWRIGHT_MODULE?pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href:'playwright');
const server=createPublicationReviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;let browser;
try {
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/tools/review/BOOK-V-CIV-ATLAS-R1-M1-FINAL-HUMAN-REVIEW.html');
 await page.waitForFunction(()=>document.querySelectorAll('#answers details').length===13);
 const audit=JSON.parse(fs.readFileSync('content/civilization-atlas/maintenance/visual-activation-60247ff/r2-object-audit-v1.json'));
 assert.equal(await page.locator('#articles li').count(),42);assert.equal(await page.locator('#parallel p').count(),8);assert.equal(await page.locator('#missing tr').count(),audit.rows.filter(r=>r.result!=='VERIFIED_WEBP').length);
 await page.waitForFunction(()=>document.querySelectorAll('#gallery img').length===12);
 for(const width of [360,1440]) {await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);if(process.env.PHIOS_SCREENSHOT_DIR)await page.screenshot({path:process.env.PHIOS_SCREENSHOT_DIR+'/review-'+width+'.png'});}
 await page.locator('#family').selectOption('MODERN_FLAG');await page.waitForFunction(()=>document.querySelectorAll('#gallery img').length===12);
 await page.locator('#next').click();await page.waitForFunction(()=>document.querySelector('#page-count').textContent.includes('2 / 2'));
 const button=page.locator('#gallery button').first();await button.focus();await page.keyboard.press('Enter');await page.locator('dialog[open]').waitFor();await page.keyboard.press('Escape');await page.locator('dialog').waitFor({state:'detached'});assert.ok(await button.evaluate(e=>e===document.activeElement));
 await page.goto(origin+'/books/reality-differentiation/?atlas=world&snapshot=WS-1250&locale=zh-Hans#atlas');await page.waitForSelector('[data-atlas-ready="true"] [data-atlas-static-visuals] > figure');
 assert.match(await page.locator('[data-atlas-static-visuals]').innerText(),/文字/);assert.deepEqual(errors,[]);
 fs.writeFileSync('content/civilization-atlas/maintenance/visual-activation-60247ff/final-review-browser-v1.json',JSON.stringify({status:'PASS',checks:['42 bilingual article links','8 representative paragraphs','13 real local Ask answers','current unresolved paths match the bucket audit','360/1440 no overflow','12 image pagination','flag selection','Enter/Escape/focus return','current world caption'],humanDecision:'PENDING_HUMAN_REVIEW'},null,2)+'\n');console.log('PASS consolidated review and current world caption');
} finally {await browser?.close();await new Promise(r=>server.close(r));}
