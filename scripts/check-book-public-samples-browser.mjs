import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {previewServer} from './lib/ca-r1-preview-server.mjs';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const server=await previewServer(),browser=await chromium.launch({channel:'msedge',headless:true});const results=[];
try{for(const width of [390,1440])for(const slug of ['reality-runtime','reality-observation','reality-navigation']){
 const page=await browser.newPage({viewport:{width,height:900}});
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===server.origin||u.hostname==='pub-1967bc5812ee4164b19a806fb1427021.r2.dev'?r.continue():r.abort()});
 await page.goto(server.origin+'/books/'+slug+'/?locale=zh-Hans');await page.locator('#free-samples').waitFor();
 const cover=page.locator('#free-samples img').first();await cover.scrollIntoViewIfNeeded();await page.waitForFunction(()=>{const i=document.querySelector('#free-samples img');return i.complete&&i.naturalWidth>0});
 if(slug==='reality-runtime'){await page.locator('#free-samples select').selectOption('1');assert.match(await page.locator('#free-samples img').nth(1).getAttribute('src'),/page-02.webp$/);await page.locator('#free-samples details summary').first().click();await page.locator('#free-samples details img').first().waitFor();assert.equal(await page.locator('#free-samples details img').count(),1);}
 assert.equal(await page.evaluate(()=>{const e=document.querySelector('#free-samples');return e.scrollWidth>e.clientWidth+1}),false);
 results.push({slug,width,status:'PASS'});await page.close();
}}finally{await browser.close();await server.close();fs.writeFileSync('docs/customer-activation-r1/book-public-samples-browser-v1.json',JSON.stringify({scope:'LOCAL_BROWSER_NOT_DEPLOYED',results},null,2)+'\n');}
console.log(results);
