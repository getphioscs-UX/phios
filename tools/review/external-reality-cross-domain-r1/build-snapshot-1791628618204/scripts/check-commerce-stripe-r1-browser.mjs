import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {STRIPE_PRODUCT_REGISTRY,standardBundleProducts} from '../functions/pws/commercial/stripe-product-registry.js';
const modulePath=process.env.PHIOS_PLAYWRIGHT_MODULE;
if(!modulePath)throw new Error('PHIOS_PLAYWRIGHT_MODULE required');
const {chromium}=await import(pathToFileURL(modulePath).href);
const root=process.cwd(),results=[];
const server=http.createServer((req,res)=>{try{let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);p=path.resolve(root,'.'+p);if(p!==root&&!p.startsWith(root+path.sep))throw Error();if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');const ext=path.extname(p);res.setHeader('content-type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'})[ext]||'application/octet-stream');res.end(fs.readFileSync(p));}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 for(const locale of (process.argv.includes('--review-only')?[]:['en','zh-Hans']))for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
  let checkoutBody=null;
  await page.route('**/api/**',async route=>{const url=new URL(route.request().url());let body={ok:true,available:false};
    if(url.pathname==='/api/commerce-catalog')body={success:true,checkoutAvailable:true,environment:'QA',liveEnabled:false,products:STRIPE_PRODUCT_REGISTRY,eligibleBundleProducts:standardBundleProducts()};
    if(url.pathname==='/api/commerce-account')body={success:true,orders:[{orderId:'ord_fixture',productId:'COM-REPORT-BAZI-FULL',state:'FULFILLED'}],entitlements:[{productId:'COM-REPORT-BAZI-FULL',entitlementCode:'REPORT_BAZI_FULL'}],subscriptions:[],services:[]};
    if(url.pathname==='/api/commerce-checkout'){checkoutBody=route.request().postDataJSON();return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({success:false})});}
    return route.fulfill({contentType:'application/json',body:JSON.stringify(body)});
  });
  await page.goto(origin+'/account/?commerce_order=ord_fixture&checkout=cancelled');
  await page.waitForSelector('[data-commerce-form]',{state:'attached'});await page.evaluate(async locale=>{const {applyCustomerLocale}=await import('/assets/customer-ui/js/locale.js');applyCustomerLocale(locale);},locale);
  await page.locator('[data-commerce-account] summary').click();
  await page.locator('[name=product]').selectOption('COM-REPORT-BUNDLE-2');
  await page.locator('[name=selected]').nth(0).check();await page.locator('[name=selected]').nth(1).check();await page.locator('[name=terms]').check();
  await page.locator('[data-commerce-form] [type=submit]').click();
  await page.waitForFunction(()=>!document.querySelector('[data-commerce-form] [type=submit]').disabled);
  assert.equal(checkoutBody.productId,'COM-REPORT-BUNDLE-2');assert.equal(checkoutBody.selectedProducts.length,2);assert(!('priceId'in checkoutBody));assert(!('amount'in checkoutBody));
  await page.locator('[name=category]').selectOption('HUMAN_SERVICE');await page.locator('[name=product]').selectOption('COM-SERVICE-CASH-FLOW-GAME');assert.match(await page.locator('[data-price]').textContent(),locale==='en'?/2-hour/:/两小时/);
  await page.locator('[name=product]').selectOption('COM-SERVICE-NATURAL-HEALER');assert.match(await page.locator('[data-product-note]').textContent(),locale==='en'?/not medical/:/不属于医疗/);
  await page.keyboard.press('Tab');assert(await page.evaluate(()=>document.activeElement!==document.body));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,`${locale}/${width} horizontal overflow`);
  await page.evaluate(()=>scrollTo(0,0));if(process.env.PHIOS_REVIEW_CAPTURE==='1')await page.screenshot({path:`docs/qa/commerce-stripe-r1/browser-${locale}-${width}.png`,fullPage:true});
  await page.reload();await page.waitForSelector('[data-commerce-form]',{state:'attached'});assert.equal(await page.locator('[name=terms]').isChecked(),false);
  assert.deepEqual(errors,[]);results.push({surface:'account',locale,width,status:'MOCK_ACCEPTED',checks:['canonical grouping','bundle body without price','cash flow duration','wellness boundary','keyboard','no horizontal overflow','cancel return does not grant','reload resets purchase form']});await context.close();
 }
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],failures=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});page.on('requestfailed',r=>failures.push(r.url()));
 await page.goto(pathToFileURL(path.join(root,'docs/qa/commerce-stripe-r1/UNIFIED-HUMAN-REVIEW.html')).href,{timeout:60000});
 await page.waitForSelector('body[data-ready=true]',{timeout:60000});
 const itemCount=await page.locator('#item option').count();assert.equal(itemCount,239);
 assert.equal(await page.locator('img,iframe').count(),0);
 await page.locator('#base').fill(origin);await page.locator('#base').dispatchEvent('change');
 for(let i=0;i<itemCount;i++){await page.locator('#item').selectOption(String(i));const url=await page.locator('#open').getAttribute('href');assert(url.startsWith(origin));const response=await context.request.get(url);assert.equal(response.status(),200,url);}
 await page.locator('#item').selectOption('0');await page.locator('#reviewer').fill('AUTOMATED_INTERFACE_TEST_NOT_HUMAN_REVIEW');await page.locator('#notes').fill('Fixture only; no acceptance.');await page.locator('#decision').selectOption('PENDING');await page.locator('#save').click();
 const download=page.waitForEvent('download');await page.locator('#export').click();assert.equal((await download).suggestedFilename(),'PHIOS-UNIFIED-HUMAN-REVIEW.json');
 await page.reload();await page.waitForSelector('body[data-ready=true]');assert.match(await page.locator('#saved').textContent(),/PENDING/);
 await page.setViewportSize({width:390,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
 results.push({surface:'unified-review',status:'MACHINE_TESTED',offlineIndex:true,runtimeRequiresLocalOrPreview:true,reportCases:46,crossCases:90,pisPages:46,checks:['lightweight offline index','239 live target routes return 200','no embedded media','draft persistence','single JSON export','mobile overflow'],humanAcceptance:false});await context.close();
 fs.writeFileSync('docs/qa/commerce-stripe-r1/browser-results.json',JSON.stringify({status:'MOCK_ACCEPTED',realStripeE2E:'NOT_RUN',results},null,2)+'\n');console.log('Commerce browser + offline unified review checks passed.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
