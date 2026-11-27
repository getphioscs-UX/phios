import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.FRAUD_PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.FRAUD_REVIEW_ORIGIN||'http://127.0.0.1:4173';
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),headless:true,args:['--no-sandbox']});
const rows=[];
try{
 for(const locale of ['en','zh-Hans'])for(const width of [360,768,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}}),errors=[],posts=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  page.on('request',request=>{if(request.method()==='POST')posts.push({url:request.url(),body:request.postDataJSON()});});
  await page.goto(origin+'/knowledge/ask/?task=SCAM_CHECK&locale='+locale);
  const form=page.locator('[data-cx-contextual-ask-form]');
  await form.locator('[name="askTask"] option[value="SCAM_CHECK"]').waitFor({state:'attached'});
  await form.locator('[data-scam-ask-controls]').waitFor({state:'visible'});
  await form.locator('[name="jurisdiction"]').selectOption('SG');
  await form.locator('[name="bankJurisdiction"]').selectOption('US');
  await form.locator('[name="scamExposure"][value="PAID_OR_LOST"]').check();
  await form.locator('[name="scamExposure"][value="CREDENTIALS_SHARED"]').check();
  await form.locator('[name="scamExposure"][value="SCREEN_SHARED"]').check();
  await form.locator('[name="question"]').fill(locale==='en'?'The platform says I must pay first before I withdraw investment profits.':'平台要求我先付款才能提取投资盈利。');
  await form.locator('button[type="submit"]').click();
  const review=page.locator('[data-scam-ask-review]');await review.locator('ol li').first().waitFor();
  const text=await review.innerText();assert(!text.includes('997'));assert(text.includes('1799'));assert.equal(await review.locator('ol li').count(),6);
  const payload=posts.find(x=>x.url.endsWith('/api/customer-contextual-ask'))?.body;assert(payload);assert.equal(payload.task,'SCAM_CHECK');assert.deepEqual(payload.contexts,[]);assert.equal(payload.questionOnly,true);assert.equal(payload.exposure.length,3);assert.equal(payload.jurisdiction,'SG');
  // Focus and keyboard access stay on native controls; download contains review, not raw submission.
  await review.locator('button').focus();const download=page.waitForEvent('download');await page.keyboard.press('Enter');const file=await download;const summary=await fs.readFile(await file.path(),'utf8');assert(summary.includes('ScamShield'));assert(!summary.includes('The platform says'));assert(!summary.includes('平台要求'));
  assert.equal(await page.locator('form[data-cx-contextual-ask-form]').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
  assert.deepEqual(errors,[]);
  if(width===360){await fs.mkdir('/tmp/phios-fraud-review',{recursive:true});await review.screenshot({path:`/tmp/phios-fraud-review/${locale}-360.png`});}
  rows.push({locale,width,state:'PASS',postCount:posts.length});
  // Unknown-country insufficient evidence still produces a deterministic review.
  await form.locator('[name="jurisdiction"]').selectOption('UNKNOWN');await form.locator('[name="bankJurisdiction"]').selectOption('UNKNOWN');
  for(const box of await form.locator('[name="scamExposure"]').all())await box.uncheck();await form.locator('[name="question"]').fill(locale==='en'?'Is this genuine?':'这是真的吗？');await form.locator('button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-cx-answer-text]')?.textContent.includes(document.documentElement.lang==='zh-Hans'?'不足':'does not establish'));
  assert(!(await review.innerText()).includes('997'));
  await page.close();
 }
 console.log(JSON.stringify({rows,scope:'Actual local Ask UI and real handlers; external assets blocked; synthetic cases; no production or accuracy certification'},null,2));
}finally{await browser.close();}
