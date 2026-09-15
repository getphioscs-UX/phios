import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {validateDraft} from './lib/sks-review-draft.mjs';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const root='functions/_source-material/m1-m4-review/',packet=JSON.parse(fs.readFileSync(root+'m1-m4-review-packet-v1.json'));
const browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const width of [390,1440]){const page=await browser.newPage({viewport:{width,height:900},acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve(root+'M1-M4-UNIFIED-REVIEW.html')).href);assert.equal(await page.locator('article').count(),packet.decisions.length);
 await page.selectOption('#stage','M2');await page.selectOption('#book','BOOK-3');assert.equal(await page.locator('article:visible').count(),28);await page.locator('article:visible > details > summary').first().click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.fill('#reviewer','BROWSER TEST ONLY');const pending=page.waitForEvent('download');await page.click('#export');const download=await pending,stream=await download.createReadStream();let bytes='';for await(const chunk of stream)bytes+=chunk;const draft=JSON.parse(bytes);assert.equal(validateDraft(packet,draft).validDraft,true);assert.equal(draft.humanAcceptanceApplied,false);assert.equal(draft.decisions.length,packet.decisions.length);assert.equal(draft.decisions.every(d=>d.decision==='NOT_REVIEWED'),true);assert.deepEqual(errors,[]);await page.close();}
 console.log('✓ Unified review at 390/1440px: filtering, expanded evidence, no horizontal overflow or JS errors, complete source-bound draft export. No review decisions applied.');
}finally{await browser.close();}
