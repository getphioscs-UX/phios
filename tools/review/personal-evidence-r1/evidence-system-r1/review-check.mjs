import fs from 'node:fs';import assert from 'node:assert/strict';import {start} from './server.mjs';
import {chromium} from 'file:///C:/Users/Guest%20Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const dir='tools/review/personal-evidence-r1/evidence-system-r1/',review='/tools/review/personal-evidence-r1/PERSONAL-EVIDENCE-HUMAN-REVIEW.html',s=await start();
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']}),checks=[];
try{
 for(const width of [390,1440]){const page=await browser.newPage({viewport:{width,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(s.url+review,{waitUntil:'networkidle'});const urls=await page.locator('a[href],img[src],iframe[src]').evaluateAll(es=>es.map(e=>e.getAttribute('href')||e.getAttribute('src')).filter(x=>x&&!/^https?:/.test(x)));for(const link of new Set(urls)){const url=new URL(link,s.url+review);const r=await fetch(url);assert.equal(r.status,200,url.pathname);}const overflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);assert.ok(overflow,'review overflow '+width);assert.equal(errors.length,0);checks.push({width,links:new Set(urls).size,all200:true,overflow:false,errors});await page.close();}
 for(const path of ['/.git/config','/functions/account/profile-evidence-store.js','/content/knowledge/manuscripts/completed/book-2-completed-manuscript-en-v1.json']){const r=await fetch(s.url+path);assert.equal(r.status,404);checks.push({path,status:404});}
 fs.writeFileSync(dir+'REVIEW-CHECK.json',JSON.stringify({at:new Date().toISOString(),checks},null,2));console.log('PASS human review links and isolation');
}finally{await browser.close();await s.close();}
