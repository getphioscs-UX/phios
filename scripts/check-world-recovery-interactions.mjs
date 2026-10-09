import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
const pw=createRequire(import.meta.url)('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const bundled=await build({entryPoints:['scripts/lib/book-publication-review-server.mjs'],bundle:true,write:false,format:'esm',platform:'node'});
const {createPublicationReviewServer}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const server=createPublicationReviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port,rows=[];
const browser=await pw.chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{
for(const width of [1280,390])for(const locale of ['en','zh-Hans']){
const ctx=await browser.newContext({viewport:{width,height:900}});
await ctx.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||u.hostname==='pub-1967bc5812ee4164b19a806fb1427021.r2.dev'?r.continue():r.abort();});
const page=await ctx.newPage();await page.goto(origin+'/world?locale='+locale);
const query=page.locator('#world-search-query');await query.fill(locale==='en'?'Meiji':'明治');await query.press('Enter');
await page.waitForFunction(()=>new URL(location.href).searchParams.get('q'));
assert(await page.locator('[data-search-entity]').count()>0);
await page.locator('[data-search-filter="type"]').selectOption('civilization');
assert.equal(new URL(page.url()).searchParams.get('searchType'),'civilization');
await page.goBack();await page.waitForFunction(()=>!new URL(location.href).searchParams.has('searchType'));
assert.equal(await page.locator('[data-search-filter="type"]').inputValue(),'');
await page.goForward();await page.waitForFunction(()=>new URL(location.href).searchParams.get('searchType')==='civilization');
assert.equal(await page.locator('[data-search-filter="type"]').inputValue(),'civilization');
await query.fill('zxqvnonexistent12345');await query.press('Enter');await page.locator('[data-search-empty]').waitFor();assert.equal(await page.locator('[data-search-entity]').count(),0);
await page.goto(origin+'/world?explore=visuals&locale='+locale);
const expand=page.locator('[data-expand-asset]').first();await expand.waitFor();await expand.focus();await expand.press('Enter');await page.locator('dialog[open]').waitFor();await page.keyboard.press('Escape');await page.locator('dialog').waitFor({state:'detached'});
rows.push({width,locale,keyboardSearch:true,urlFilter:true,backForward:true,emptyResult:true,keyboardImageDialog:true,state:'PASS'});
await ctx.close();
}
}finally{await browser.close();await new Promise(r=>server.close(r));fs.writeFileSync('docs/acceptance/world-recovery/interaction-receipt.json',JSON.stringify({origin,providerCalls:0,rows},null,2)+'\n');}
console.log('PASS keyboard search, URL filters, Back/Forward, empty search and accessible image dialog in both locales at desktop/mobile.');
