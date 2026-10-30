import fs from 'node:fs';
import assert from 'node:assert/strict';
import {loadWorldPlaywright,worldBrowserLaunchOptions} from '../../../scripts/lib/world-browser-runtime.mjs';
const root='tools/review/five-method-preentry-r5', {origin}=JSON.parse(fs.readFileSync(root+'/PREVIEW-SERVER.json'));
const browser=await loadWorldPlaywright().chromium.launch(worldBrowserLaunchOptions()),context=await browser.newContext(),results=[];
try{for(const method of ['ziwei','astrology','bazi','numerology','human-design']){
 const page=await context.newPage();await page.goto(origin+'/perspectives/personal/'+method+'/?locale=en',{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('[data-preentry-state="ready"]'));
 await page.evaluate(async()=>{const images=[...document.images].filter(i=>i.getAttribute('src'));for(const i of images)i.loading='eager';await Promise.race([Promise.allSettled(images.map(i=>i.decode())),new Promise(r=>setTimeout(r,10000))]);});
 const result=await page.evaluate(()=>({unbound:[...document.images].filter(i=>!i.getAttribute('src')).map(i=>({html:i.outerHTML,closedDialog:!!i.closest('dialog:not([open])'),width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height})),brokenURLImages:[...document.images].filter(i=>i.getAttribute('src')&&(!i.complete||!i.naturalWidth)).map(i=>i.getAttribute('src'))}));
 assert.equal(result.unbound.length,1);assert.ok(result.unbound.every(i=>i.closedDialog&&i.width===0&&i.height===0&&i.html.includes('data-cx-figure-image')));assert.deepEqual(result.brokenURLImages,[]);results.push({method,...result,passed:true});await page.close();
}}finally{await browser.close();}
fs.writeFileSync(root+'/IMAGE-RESOURCE-CHECKS.json',JSON.stringify({sourceOwner:'assets/customer-ui/js/figure-viewer.js',reason:'The shared closed figure dialog has one intentionally unbound img. A null src is not an image resource; preserve raw matrix nulls and validate actual URLs separately.',results},null,2));console.log('5 shared closed-viewer placeholders checked; no broken URL images');
