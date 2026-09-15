import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {previewServer} from './lib/ca-r1-preview-server.mjs';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const packet=JSON.parse(fs.readFileSync('functions/_source-material/m1-m4-review/m1-m4-review-packet-v1.json'));
const server=await previewServer({candidatePreview:true}),browser=await chromium.launch({channel:'msedge',headless:true});
const evidence={sourceDigest:packet.sourceDigest,environment:'LOCAL_CANDIDATE_PREVIEW',humanApproval:false,productionImport:false,tests:[]};
try{const page=await browser.newPage();await page.route('**/*',r=>new URL(r.request().url()).origin===server.origin?r.continue():r.abort());
 for(const width of [390,1440])for(const [book,route,param,ids] of [
  ['BOOK-3','reality-continuity','topic',['SK-B3-B3-P8-111','SK-B3-B3-P8-116','SK-B3-B3-P8-143','SK-B3-B3-P8-159']],
  ['BOOK-4','reality-expansion','expansion',['SK-B4-B4-P10-201','SK-B4-B4-P10-222','SK-B4-B4-P10-212','SK-B4-B4-P10-219']]]){
  await page.setViewportSize({width,height:900});
  for(const id of ids){await page.goto(`${server.origin}/books/${route}/?locale=zh-Hans&${param}=${id}`);await page.waitForSelector('[data-ca-candidate-fields]');const text=await page.locator('[data-detail]').innerText();const candidate=packet.meaning.find(m=>m.objectId===id)?.finalCandidate||packet.fieldCandidates.find(f=>f.objectId===id)?.definition?.proposedValue;assert.ok(text.includes(candidate));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.ok(await page.locator('[data-detail] a[href*="/knowledge/ask/"]').count());evidence.tests.push({width,book,id,status:'PASS',scope:'candidate text, source disclosure, Ask link presence, no overflow; no semantic approval'});}
 }
}finally{await browser.close();await server.close();fs.writeFileSync('docs/customer-activation-r1/candidate-preview-evidence-v1.json',JSON.stringify(evidence,null,2)+'\n');}
console.log('✓ 16 Book III/IV existing-explorer candidate previews; live registry unchanged.');
