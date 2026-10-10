import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createPublicationReviewServer} from './lib/book-publication-review-server.mjs';
import {onRequestPost as reality} from '../functions/api/customer-current-reality.js';
import {commerceApi} from '../functions/commerce/commerce-stripe-api.js';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const server=createPublicationReviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const root='docs/guided-report-successor-r1',results=[];fs.mkdirSync(root+'/browser',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const locale of ['en','zh-Hans'])for(const width of [390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}});
  await page.addInitScript(l=>{localStorage.setItem('phios-cx-locale',l);},locale);
  await page.route('**/api/customer-current-reality',async route=>{const r=await reality({request:new Request(route.request().url(),{method:'POST',headers:{'content-type':'application/json'},body:route.request().postData()})});await route.fulfill({status:r.status,contentType:'application/json',body:await r.text()});});
  await page.goto(base+'/perspectives/personal/');await page.locator('[data-guided-reality]').waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'),locale);
  await page.locator('[data-guided-reality] [data-start]').click();await page.locator('[data-mode]').waitFor();
  await page.locator('[data-mode]').selectOption('QUICK');await page.waitForFunction(()=>document.querySelectorAll('[data-intake] textarea').length===3);
  await page.locator('[data-intake] [name=happening]').fill('My team changed last week.');await page.locator('[data-summary]').click();await page.locator('[data-confirm]').waitFor();
  await page.locator('[data-edit]').click();await page.locator('[name=happening]').fill('My team changed two weeks ago.');await page.locator('[data-summary]').click();await page.locator('[data-confirm]').click();
  await page.waitForFunction(()=>document.querySelector('[data-guided-reality] [data-intake]').hidden);
  assert.match(await page.locator('[data-guided-reality] [data-status]').textContent(),/Confirmed|已确认/);
  await page.locator('[data-guided-reality] [data-status] button').click();
  await page.waitForFunction(()=>document.querySelectorAll('[data-guided-reality] [data-status] button').length>=1 && !/Suggest a useful|建议一个/.test(document.querySelector('[data-guided-reality] [data-status] button').textContent));
  await page.locator('[data-guided-reality] [data-status] button').first().click();
  assert.equal(await page.locator('[name=methods]:checked').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
  results.push({kind:'REALITY_CONFIRM_EDIT',locale,width,status:'PASS'});await page.close();
 }
 for(const width of [390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}});
  await page.route('**/api/commerce-catalog',async route=>{const r=await commerceApi({request:new Request(route.request().url()),env:{}},'catalog');await route.fulfill({contentType:'application/json',body:await r.text()});});
  await page.route('**/api/commerce-account',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({success:true,orders:[],entitlements:[],subscriptions:[],services:[]})}));
  await page.goto(base+'/account/');await page.locator('[data-commerce-form]').waitFor({state:'attached'});await page.locator('details').filter({has:page.locator('[data-commerce-form]')}).locator('summary').click();
  await page.locator('[name=product]').selectOption('COM-REPORT-BUNDLE-3');await page.locator('[name=reportLocale]').selectOption('bilingual');assert.match(await page.locator('[data-price]').textContent(),/109/);
  await page.evaluate(()=>{document.documentElement.lang='zh-Hans';window.dispatchEvent(new Event('phios:localechange'));});
  assert.equal(await page.locator('[name=reportLocale]').inputValue(),'bilingual');assert.match(await page.locator('[data-price]').textContent(),/109/);
  results.push({kind:'BUNDLE_PRICE_LANGUAGE_PERSISTENCE',width,status:'PASS'});await page.close();
 }
 const manifest=JSON.parse(fs.readFileSync(root+'/cases.json'));
 for(const sample of manifest.cases)for(const width of [390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/'+root+'/review.html?case='+sample.path);await page.waitForSelector('body[data-ready=true]');await page.evaluate(()=>document.fonts.ready);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert.equal(overflow,false,`${sample.path} width ${width}`);assert.deepEqual(errors,[]);
  const panels=await page.locator('.vrpt-locale-page').count();assert(panels>0);results.push({kind:'DYNAMIC_LAYOUT_ONLY',...sample,width,panels,status:'PASS',semanticParity:'NOT_ACCEPTED',staticArtwork:'MISSING'});
  if(width===390)await page.screenshot({path:`${root}/browser/${sample.method}-${sample.reportLocale}-390.png`,fullPage:false});await page.close();
 }
}finally{await browser.close();await new Promise(r=>server.close(r));fs.writeFileSync(root+'/browser-results.json',JSON.stringify({results,productionE2E:'NOT_RUN',humanReview:'PENDING'},null,2)+'\n');}
console.log(`Guided report browser: ${results.length} interaction/layout cases passed.`);
