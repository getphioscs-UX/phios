import {loadWorldPlaywright,worldBrowserLaunchOptions} from './lib/world-browser-runtime.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
const pw=loadWorldPlaywright();
const b=await build({entryPoints:['scripts/lib/book-publication-review-server.mjs'],bundle:true,write:false,format:'esm',platform:'node'});
const {createPublicationReviewServer}=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
const server=createPublicationReviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const browser=await pw.chromium.launch(worldBrowserLaunchOptions()),rows=[];
try{for(const width of [1280,390])for(const locale of ['en','zh-Hans']){
 const ctx=await browser.newContext({viewport:{width,height:900}}),page=await ctx.newPage();
 // Model a previously cached dictionary composition, keeping the single i18n runtime.
 await ctx.route('**/assets/js/locales/*.js',async route=>{const response=await route.fetch();const oldComposition=(await response.text()).replace(/^import worldRecovery[^\n]*\n/m,'').replace(/\s*\.\.\.worldRecovery,/,'');await route.fulfill({response,body:oldComposition});});
 await page.goto(origin+'/world?locale='+locale,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('h1')?.textContent&&!document.querySelector('h1').textContent.includes('worldRecovery.'));
 assert.equal((await page.locator('body').innerText()).includes('worldRecovery.'),false);
 assert.equal(await page.locator('h1').first().innerText(),locale==='en'?'How did the world get here?':'世界如何走到今天');
 assert.equal(await page.locator('header a[href="/world"]').first().innerText(),locale==='en'?'World':'世界');
 await page.screenshot({path:`docs/acceptance/world-recovery/cached-copy-${width}-${locale}.png`});rows.push({width,locale,state:'PASS_CACHED_DICTIONARY_UPGRADE',rawTranslationKeys:0});await ctx.close();
}}finally{await browser.close();await new Promise(r=>server.close(r));fs.writeFileSync('docs/acceptance/world-recovery/cached-copy-receipt.json',JSON.stringify({origin,rows},null,2)+'\n');}
console.log('PASS cached pre-recovery dictionaries display governed World copy in both locales at desktop/mobile.');
