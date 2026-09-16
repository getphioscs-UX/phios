import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {previewServer} from './lib/ca-r1-preview-server.mjs';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const pages=JSON.parse(fs.readFileSync('content/web/index-surfaces/pis-r1-discovery-copy-v1.json')).pages;
const server=await previewServer(),browser=await chromium.launch({channel:'msedge',headless:true});
const results=[];
const testedFiles=[...Object.keys(pages),'assets/customer-ui/js/public-index-copy.js','assets/customer-ui/surfaces/public-index.css'].map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));
try{
 for(const width of [360,390,768,1440])for(const file of Object.keys(pages)){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===server.origin||u.hostname==='pub-1967bc5812ee4164b19a806fb1427021.r2.dev'?r.continue():r.abort();});
  const route=file==='index.html'?'/':'/'+file.replace(/index\.html$/,'');
  await page.goto(server.origin+route,{waitUntil:'domcontentloaded'});
  await page.locator('.pis-editorial').first().waitFor();
  for(const locale of ['en','zh-Hans']){
   // Exercise the existing visible shell language controls, not a synthetic DOM state.
   await page.evaluate(()=>window.scrollTo(0,0));
   const toggle=page.locator(`button[data-cx-locale="${locale}"]:visible, button[data-locale="${locale}"]:visible, button[data-puxr-locale-button="${locale}"]:visible`).first();
   if(!await toggle.count()){const menu=page.locator('button[data-cx-menu]:visible, .public-menu-toggle:visible').first();await menu.waitFor();await menu.click();}
   await toggle.waitFor();await toggle.click();await page.keyboard.press('Escape');
   await page.waitForFunction(locale=>[...document.querySelectorAll('[data-pis-copy]')].every(n=>n.textContent===n.getAttribute(locale==='en'?'data-cx-en':'data-cx-zh')),locale);
   const overflow=await page.evaluate(()=>[...document.querySelectorAll('.pis-editorial')].some(n=>n.scrollWidth>n.clientWidth+1));
   assert.equal(overflow,false,`${file} ${width} ${locale}: editorial overflow`);
   assert.equal(await page.locator('h1').count(),1);
   const target=page.locator('.pis-editorial a').first();await target.focus();
   assert.ok(await target.evaluate(n=>document.activeElement===n));
   results.push({file,width,locale,editorialOverflow:false,keyboardFocus:true,status:'PASS'});
  }
  if((file==='index.html'&&width===390)||(file==='about/index.html'&&width===1440)){await page.evaluate(()=>window.scrollTo(0,0));await page.waitForFunction(()=>{const img=document.querySelector('img[data-cx-asset="HERO-001"]');return !img||(img.complete&&img.naturalWidth>0)});await page.screenshot({path:`docs/public-index-successor/${file==='index.html'?'home-mobile':'about-desktop'}.png`,fullPage:true});}
  await page.close();
 }
}finally{
 await browser.close();await server.close();
 fs.writeFileSync('docs/public-index-successor/pis-r1-discovery-browser-v1.json',JSON.stringify({scope:'LOCAL_EDITORIAL_LAYOUT_LOCALE_AND_FOCUS_NOT_PRODUCTION_E2E',testedFiles,expectedCases:72,complete:results.length===72,results},null,2)+'\n');
}
console.log(`PASS PIS local browser: ${results.length} page/viewport/locale cases.`);
