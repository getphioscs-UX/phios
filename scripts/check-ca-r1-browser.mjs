import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {previewServer} from './lib/ca-r1-preview-server.mjs';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const local=process.argv.includes('--production')?null:await previewServer();
const origin=local?.origin||'https://getphios.com';
const evidence={environment:local?'LOCAL_PREVIEW_REAL_BROWSER':'PRODUCTION_REAL_BROWSER',origin,at:new Date().toISOString(),tests:[]};
const browser=await chromium.launch({channel:'msedge',headless:true});
const test=async(name,fn)=>{try{const details=await fn();evidence.tests.push({name,status:'PASS',details});}catch(e){evidence.tests.push({name,status:'FAIL',error:e.message});}console.log(name,evidence.tests.at(-1).status,evidence.tests.at(-1).error||'');};
try{
 const page=await browser.newPage();page.setDefaultTimeout(12000);
 if(local)await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:width===390?844:900});
  for(const action of ['enter','button','full'])await test(`header-${width}-${action}`,async()=>{
   await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
   if(width===390)await page.locator('[data-cx-menu]').click();
   await page.locator('[data-cx-dialog-open="cx-shell-search"]:visible').first().click();
   const input=page.locator('#cx-shell-search input[name=q]');await input.fill('Reality Continuity');
   if(action==='enter')await input.press('Enter');else if(action==='button')await page.locator('#cx-shell-search [type=submit]').click();else await page.locator('#cx-shell-search a').click();
   await page.waitForURL(/\/search\/\?q=Reality/);
   await page.waitForSelector('.cx-knowledge-result h2 a');
   const href=await page.locator('.cx-knowledge-result h2 a').first().getAttribute('href');assert.equal(href,'/books/reality-continuity/');
   return {url:page.url(),first:href,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};
  });
  await test(`escape-focus-${width}`,async()=>{await page.goto(origin+'/');if(width===390)await page.locator('[data-cx-menu]').click();const trigger=page.locator('[data-cx-dialog-open="cx-shell-search"]:visible').first();await trigger.click();await page.keyboard.press('Escape');assert.equal(await page.locator('#cx-shell-search').evaluate(d=>d.open),false);assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);});
 }
 for(const locale of ['en','zh-Hans'])await test(`article-ask-${locale}`,async()=>{
  await page.goto(origin+'/articles/book3-article-008?locale='+locale);await page.waitForSelector('.knowledge-article__header h1');
  const links=await page.locator('a[href*="/knowledge/ask/"]').evaluateAll(xs=>xs.map(x=>x.getAttribute('href')));const href=links.find(s=>s.includes('book3-article-008'))||await page.locator('[data-cka-contextual-entry=ARTICLE]').getAttribute('href');assert.ok(href,'article Ask link missing');
  await page.locator('[data-cka-contextual-entry=ARTICLE]').click();await page.waitForURL(/knowledge/);await page.waitForSelector('[data-cx-seeded-context]:checked',{state:'attached'});
  await page.locator('[name=question]').fill(locale==='en'?"Why can't AI decide what deserves protection?":'为什么 AI 不能决定什么值得保护？');await page.locator('[data-cx-contextual-ask-form] [type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('[data-cx-answer-text]')?.textContent?.length>20);
  const answer=await page.locator('[data-cx-answer-text]').innerText();assert.match(answer,/value|cost|legitimacy|价值|成本|责任/i);
  await page.locator('[data-cx-basis-groups] summary').click();
  const sourceHrefs=await page.locator('[data-cx-basis-groups] a').evaluateAll(xs=>xs.map(x=>x.getAttribute('href')));assert.ok(sourceHrefs.some(s=>s.includes('book3-article-008')));
  return {answer,sourceHrefs,entry:href,locale:await page.locator('html').getAttribute('lang')};
 });
}finally{await browser.close();await local?.close();fs.writeFileSync(`docs/qa/customer-activation-r1/${local?'local':'production'}-browser-retest-v1.json`,JSON.stringify(evidence,null,2)+'\n');}
if(evidence.tests.some(t=>t.status==='FAIL'))process.exitCode=1;
