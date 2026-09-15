import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {previewServer} from './lib/ca-r1-preview-server.mjs';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const server=await previewServer(),browser=await chromium.launch({channel:'msedge',headless:true});
const evidence={environment:'LOCAL_ONLY',networkScope:'LOCAL_PREVIEW_NO_COMMERCE',tests:[],requirements:[]};
const figures=JSON.parse(fs.readFileSync('content/registry/figures.json')).figures;if(!figures.some(f=>String(f.figure_number).toUpperCase()==='11F'))evidence.requirements.push({requirement:'FIG 11F first exact result',status:'FAIL',reason:'FIG 11F is absent from the canonical figure registry; no figure or alias was invented.'});
try{
 for(const width of [390,1440])for(const locale of ['en','zh-Hans']){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route('**/*',r=>new URL(r.request().url()).origin===server.origin?r.continue():r.abort());
  for(const [query,expected] of [['Reality Continuity','/books/reality-continuity/'],['Reality Expansion','/books/reality-expansion/'],['FIG 0A','/figure?id=figure-0a']]){
   await page.goto(server.origin+'/search/?locale='+locale+'&q='+encodeURIComponent(query));
   const first=page.locator('[data-cx-knowledge-search-results] article h2 a').first();await first.waitFor();assert.equal(await first.getAttribute('href'),expected);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   evidence.tests.push({width,locale,query,status:'PASS'});
  }
  await page.goto(server.origin+'/search/?locale='+locale+'&type=book');await page.locator('[data-search-type]').waitFor();assert.equal(await page.locator('[data-search-type]').inputValue(),'BOOK');
  evidence.tests.push({width,locale,query:'book filter URL',status:'PASS'});
  await page.route('**/content/knowledge/structured/**',r=>r.fulfill({status:503,body:'unavailable'}));
  await page.goto(server.origin+'/search/?locale='+locale+'&q=Reality+Continuity');await page.locator('[data-cx-knowledge-search-summary] button').waitFor();
  assert.ok(await page.locator('[data-cx-knowledge-search-results] article').count());evidence.tests.push({width,locale,query:'partial failure remains explicit',status:'PASS'});
  await page.route('**/content/**',r=>r.fulfill({status:503,body:'unavailable'}));
  await page.reload();await page.locator('[data-cx-knowledge-search-results] button').waitFor();assert.equal(await page.locator('[data-cx-knowledge-search-results] article').count(),0);evidence.tests.push({width,locale,query:'total failure retry',status:'PASS'});
  await page.close();
 }
}catch(error){evidence.tests.push({status:'FAIL',error:error.message});process.exitCode=1;}finally{await browser.close();await server.close();fs.writeFileSync('docs/qa/customer-activation-r1/search-failure-browser-v1.json',JSON.stringify(evidence,null,2)+'\n');}
console.log(JSON.stringify(evidence.tests));
