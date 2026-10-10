import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createPublicationReviewServer} from './lib/book-publication-review-server.mjs';
import {STRIPE_PRODUCT_REGISTRY} from '../functions/pws/commercial/stripe-product-registry.js';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const server=createPublicationReviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;let browser;
const results=[];
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/commerce-catalog',route=>route.fulfill({json:{products:STRIPE_PRODUCT_REGISTRY,eligibleBundleProducts:[],checkoutAvailable:false}}));
 await page.route('**/api/commerce-account',route=>route.fulfill({status:401,json:{success:false}}));
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:1000});
  await page.goto(origin+'/docs/assets/r2-public/R2-ALL-VISUAL-ASSETS-REVIEW.html');
  assert.equal(await page.locator('#grid article').count(),12);
  await page.locator('#query').fill('玛雅');assert.equal(await page.locator('#grid article').count(),2);
  await page.locator('#query').fill('WORLD_RECONFIGURATION_SNAPSHOT_2026');assert.equal(await page.locator('#grid article').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  for(const [slug,number] of [['reality-differentiation',5],['reality-configuration',6],['reality-observation',7],['reality-navigation',8]]){
   await page.goto(origin+'/books/'+slug+'/?locale=zh-Hans');await page.locator('#free-samples').waitFor();
   const cover=page.locator('#free-samples img').first();await cover.scrollIntoViewIfNeeded();await cover.evaluate(image=>image.decode());assert.ok(await cover.evaluate(image=>image.naturalWidth>0));
   if(number===5){assert.equal(await page.locator('#free-samples option').count(),50);await page.locator('#free-samples select').selectOption('49');const preview=page.locator('#free-samples img').nth(1);await preview.scrollIntoViewIfNeeded();await preview.evaluate(image=>image.decode());assert.match(await preview.getAttribute('src'),/page-50.webp$/);assert.equal(await page.locator('#free-samples details').count(),6);}
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   results.push({width,book:number,cover:'DECODED',preview:number===5?'50 pages selectable':'not applicable'});
   console.log('PASS book visual',width,number);
  }
 }
 await page.goto(origin+'/books/reality-differentiation/?atlas=cases&case=CA-T07-01&visual=VIS-CIV-CA-T07-01-HERO&locale=zh-Hans#atlas');
 await page.waitForSelector('[data-atlas-visual-selection] img');assert.equal(await page.locator('[data-atlas-visual-choice]').inputValue(),'VIS-CIV-CA-T07-01-HERO');await page.locator('[data-atlas-visual-selection] img').evaluate(image=>image.decode());
 await page.goto(origin+'/books/reality-differentiation/?atlas=cases&case=CA-T07-02&locale=zh-Hans#atlas');
 const hero=page.locator('[data-atlas-static-visuals] > figure img').first();await hero.waitFor();await hero.scrollIntoViewIfNeeded();await hero.evaluate(image=>image.decode());assert.equal(await hero.getAttribute('data-asset-id'),'VIS-CIV-CA-T07-02-HERO');
 results.push({maya:'DECODED',earlyByzantine:'DECODED',visualDeepLink:'PASS'});
 await page.goto(origin+'/books/reality-differentiation/?visual=WORLD_RECONFIGURATION_SNAPSHOT_2026&locale=zh-Hans#atlas');
 const reconfiguration=page.locator('[data-atlas-visual-selection] img');await reconfiguration.waitFor();await reconfiguration.evaluate(image=>image.decode());assert.equal(await reconfiguration.getAttribute('data-asset-id'),'WORLD_RECONFIGURATION_SNAPSHOT_2026');
 results.push({reconfiguration2026:'DECODED_IN_ACTUAL_ATLAS_LIBRARY'});
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:1000});await page.goto(origin+'/books/reality-formation/?locale=zh-Hans');await page.locator('#free-samples details').first().waitFor();
  const summaries=page.locator('#free-samples details');assert.equal(await summaries.count(),12);
  for(let i=0;i<12;i++){const detail=summaries.nth(i);await detail.locator('summary').click();const image=detail.locator('img');await image.waitFor();await image.scrollIntoViewIfNeeded();await image.evaluate(image=>image.decode());assert.ok(await image.evaluate(image=>image.naturalWidth>0));await detail.locator('summary').click();}
  assert.equal(await summaries.nth(11).locator('img').count(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  results.push({book:1,width,originalFigures:12,decoded:'PASS',missing:null});
 }
 await page.goto(origin+'/account/');await page.locator('[data-commerce-form]').waitFor({state:'attached'});await page.locator('[data-commerce-account] details summary').click();
 const visuals=JSON.parse(fs.readFileSync('content/web-production/registries/commerce-product-visuals-v1.json')).assets;
 for(const visual of visuals){const product=STRIPE_PRODUCT_REGISTRY.find(p=>p.productId===visual.productId);assert.ok(product,visual.productId);await page.locator('[name=category]').selectOption(product.category);await page.locator('[name=product]').selectOption(product.productId);const image=page.locator('[data-commerce-product-visual]');assert.equal(await image.getAttribute('src'),visual.publicUrl);await image.scrollIntoViewIfNeeded();await image.evaluate(image=>image.decode());}
 await page.locator('[name=category]').selectOption('BOOK');assert.equal(await page.locator('[data-commerce-product-visual]').isVisible(),false);
 assert.equal(await page.locator('[data-commerce-form] [type=submit]').isDisabled(),true);
 results.push({commerceImages:visuals.length,decode:'PASS',checkout:'DISABLED_FIXTURE_NO_TRANSACTIONS'});
 assert.deepEqual(errors,[]);
 fs.writeFileSync('docs/assets/r2-public/r2-usage-browser-2026-09-19.json',JSON.stringify({status:'PASS',scope:'Local worktree browser, real R2 images; Commerce catalog fixture and signed-out account; no checkout or production deployment',results},null,2)+'\n');
 console.log(JSON.stringify(results));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
