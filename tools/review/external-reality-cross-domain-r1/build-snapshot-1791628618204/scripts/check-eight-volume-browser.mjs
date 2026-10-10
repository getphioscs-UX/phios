import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {STRIPE_PRODUCT_REGISTRY} from '../functions/pws/commercial/stripe-product-registry.js';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const root=process.cwd();
const server=http.createServer((req,res)=>{try{let p=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!p.startsWith(root+path.sep))throw Error();if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');res.setHeader('content-type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'})[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const books=JSON.parse(fs.readFileSync('content/web-production/registries/wpr-eight-volume-book-production-projection-v1.json')).books;
let browser;const results=[];
try{browser=await chromium.launch({channel:'msedge',headless:true});
 for(const locale of ['en','zh-Hans'])for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:950}}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/commerce-catalog',r=>r.fulfill({json:{products:STRIPE_PRODUCT_REGISTRY,checkoutAvailable:false}}));
  await page.addInitScript(locale=>localStorage.setItem('phiOSLocale',locale),locale);
  for(const b of books){await page.goto(origin+b.route,{waitUntil:'domcontentloaded'});await page.waitForSelector('[data-book-commerce-price]');
   const title=await page.locator('h1').textContent();assert.equal(title,b.title[locale]);
   const p=STRIPE_PRODUCT_REGISTRY.find(p=>p.publicationBookCode===b.bookCode);
   assert.equal(await page.locator('[data-book-commerce-price]').getAttribute('data-book-commerce-price'),p.productId);
   assert.equal(await page.locator('.wpr-part-card').count(),b.parts.length);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,b.route);
   if(b.volume>=6)assert.equal(await page.locator('.wpr-book-cover img').count(),0);
   results.push({route:b.route,locale,width,status:'MACHINE_TESTED',priceSource:'mock catalog / real canonical registry',partCount:b.parts.length});
  }
  await page.goto(origin+'/books/');await page.waitForSelector('.cx-knowledge-book-card');assert.equal(await page.locator('.cx-knowledge-book-card').count(),8);
  await page.goto(origin+'/search/?q=Reality%20Configuration&type=book');await page.waitForSelector('.cx-knowledge-result');assert.equal(await page.locator('.cx-knowledge-result h2 a').first().getAttribute('href'),'/books/reality-configuration/');
  assert.deepEqual(errors,[]);await ctx.close();
 }
 fs.writeFileSync('docs/qa/commerce-stripe-r1/eight-volume-browser.json',JSON.stringify({status:'MACHINE_TESTED',screenshots:false,humanReview:'PENDING',realStripeE2E:'NOT_RUN',results},null,2)+'\n');
 console.log('Eight-volume browser PASS: all volumes, 2 locales × 2 widths, dynamic prices, Part ownership, unavailable successor covers, catalog and search.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
