import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const base=process.env.PHIOS_REVIEW_URL||'http://127.0.0.1:54705',root='docs/visual-report-r1';
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[];
try{for(const width of [1440,390])for(const surface of ['catalog','final-review','cross-successor/review']){
 const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}/${root}/${surface}.html`);await page.evaluate(()=>document.fonts.ready);
 if(surface==='catalog'){
  await page.waitForSelector('.card');assert.equal(await page.locator('.card').count(),11);await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));assert.equal(await page.locator('button:not(:disabled)').count(),0);
  const bundle=page.locator('#bundles .card').nth(2);assert.equal(await bundle.locator('input').count(),6);for(const i of await bundle.locator('input').all())await i.check();assert.equal(await bundle.locator('[role=status]').getAttribute('data-valid'),'true');assert.match(await bundle.innerText(),/MYR 159/);assert.doesNotMatch(await bundle.innerText(),/HD FULL REPORT|CROSS FULL REPORT/);
 }
 if(surface==='final-review'){
  await page.waitForSelector('#rows tr');assert.equal(await page.locator('#rows tr').count(),8);
  await page.locator('#product').selectOption('CROSS_HD_PROFILE_SUCCESSOR');await page.locator('#reviewer').fill('SYNTHETIC VALIDATION ONLY');await page.locator('#notes').fill('Incomplete checklist must not create acceptance.');await page.locator('#decision').selectOption('ACCEPTED');await page.locator('#save').click();assert.match(await page.locator('#message').innerText(),/核对/);
  for(const href of await page.locator('a').evaluateAll(a=>a.map(n=>n.href))){const response=await page.request.get(href);assert.equal(response.status(),200,href);}
 }
 if(surface==='cross-successor/review'){
  await page.waitForSelector('body[data-ready=true]');assert.equal(await page.locator('.method').count(),7);assert.equal(await page.locator('.method[data-state=REVIEW_ONLY_NOT_CROSS_ADMITTED]').count(),2);
  const options=await page.locator('#cases option').evaluateAll(o=>o.map(n=>n.value));assert.equal(options.length,90);
  for(const option of options){await page.locator('#cases').selectOption(option);await page.waitForFunction(id=>document.getElementById('context').textContent.includes(id),option.split('/').pop().replace('.json',''));assert.equal(await page.locator('.method').count(),7);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,option);}
  // Show the bilingual seven-method candidate for the saved overview.
  const manifest=JSON.parse(fs.readFileSync(`${root}/cross-successor/cases.json`));const last=manifest.rows.find(r=>r.methodIds.length===7&&r.locale==='zh-Hans');await page.locator('#cases').selectOption(last.path);await page.waitForFunction(id=>document.getElementById('context').textContent.includes(id),last.caseId);
 }
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert.equal(overflow,false,`${surface}:${width}`);assert.deepEqual(errors,[]);
 await page.screenshot({path:`${root}/browser/surface-${surface.replace('/','-')}-${width}.png`,fullPage:true});results.push({surface,width,status:'PASS',errors,overflow});await page.close();
}}finally{await browser.close();}
fs.writeFileSync(`${root}/review-surface-results.json`,JSON.stringify({status:'PASS',surfaces:results,crossCaseViewportChecks:180,acceptanceRecordsCreated:0,realOrdersCreated:0},null,2)+'\n');console.log('PASS six review surfaces; 180 Cross scenario viewports; no acceptance, orders or payments created.');
