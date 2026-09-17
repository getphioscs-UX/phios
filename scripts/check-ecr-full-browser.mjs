import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {previewServer} from './lib/ca-r1-preview-server.mjs';
import {onRequestPost} from '../functions/api/customer-current-reality.js';
const dependency=process.env.PHIOS_PLAYWRIGHT_MODULE;
if(!dependency)throw Error('Set PHIOS_PLAYWRIGHT_MODULE to the installed Playwright index.mjs');
const {chromium}=await import(pathToFileURL(dependency));
const server=await previewServer(),browser=await chromium.launch({channel:'msedge',headless:true}),results=[];
const dir='docs/ecr-full-r1/browser';fs.mkdirSync(dir,{recursive:true});fs.mkdirSync('output/pdf',{recursive:true});
try{
 for(const work of ['core-review','context-review'])for(const locale of ['en','zh-Hans'])for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:960}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/customer-current-reality',async route=>{const response=await onRequestPost({request:new Request(route.request().url(),{method:'POST',headers:{'content-type':'application/json'},body:route.request().postData()})});await route.fulfill({status:response.status,body:await response.text(),headers:Object.fromEntries(response.headers)});});
  await page.goto(server.origin+'/docs/ecr-full-r1/review.html',{waitUntil:'networkidle'});
  if(work!=='core-review'){await page.selectOption('#work',work);await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('ECR-CONTEXT'));}
  const packet=JSON.parse(fs.readFileSync(`docs/ecr-full-r1/${work}/cases.json`));
  const index=packet.cases.findIndex(x=>x.locale===locale&&(work==='core-review'||x.focus==='CURRENT_REALITY_COMPARISON'));
  await page.selectOption('#case',String(index));await page.waitForFunction(id=>document.querySelector('#status').textContent.startsWith(id),packet.cases[index].caseId);
  await page.locator('#reading img').evaluateAll(imgs=>imgs.forEach(i=>i.loading='eager'));
  await page.waitForFunction(()=>[...document.querySelectorAll('#reading img')].every(i=>i.complete));
  assert.equal(await page.locator('[data-ecr-full-section]').count(),work==='core-review'?11:14);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
  const failedImages=await page.locator('#reading img').evaluateAll(imgs=>imgs.filter(i=>!i.naturalWidth).map(i=>i.src));
  await page.locator('#reading').scrollIntoViewIfNeeded();await page.screenshot({path:`${dir}/${work}-${locale}-${width}.png`,fullPage:true});
  if(width===1440){await page.emulateMedia({media:'print'});await page.pdf({path:`output/pdf/ecr-${work}-${locale}.pdf`,format:'A4',printBackground:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="font-size:8px;width:100%;text-align:center;color:#506864">ECR · INTERNAL REVIEW · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',margin:{top:'16mm',bottom:'16mm',left:'16mm',right:'16mm'}});await page.emulateMedia({media:'screen'});}
  await page.selectOption('#depth','free');await page.waitForSelector('[data-ecr-report-depth="FREE"]');
  assert.equal(await page.locator('[data-ecr-full-section]').first().getAttribute('data-ecr-full-section'),'PHI_CARD');
  assert.equal(await page.locator('[data-ecr-full-section="EXPERIENCE_EXPRESSION"]').count(),0);
  assert.equal(await page.locator('.cx-ecr-full-unlock').isDisabled(),true);
  if(work==='context-review'&&locale==='en'&&width===1440){
   await page.locator('details').last().locator('summary').click();await page.locator('[name="CARRIER_CONDITIONS"]').fill('Synthetic capacity observation');await page.locator('#consent').check();
   const download=page.waitForEvent('download');await page.locator('#evidence-form button').click();await download;
   await page.waitForFunction(()=>document.querySelector('#intake-status').textContent.includes('Validated'));
  }
  assert.deepEqual(errors,[]);results.push({work,locale,width,status:'PASS',failedImages,print:width===1440});await page.close();
 }
}finally{await browser.close();await server.close();fs.writeFileSync(`${dir}/results.json`,JSON.stringify(results,null,2)+'\n');}
console.log(JSON.stringify(results,null,2));
