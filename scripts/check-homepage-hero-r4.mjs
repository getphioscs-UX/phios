// Real browser regression. Run against the exact candidate URL; no API/provider calls.
import assert from 'node:assert/strict';
import {loadWorldPlaywright,worldBrowserLaunchOptions} from './lib/world-browser-runtime.mjs';
const base=process.env.HOMEPAGE_REVIEW_BASE_URL;
assert.ok(base,'Set HOMEPAGE_REVIEW_BASE_URL to the exact candidate');
const browser=await loadWorldPlaywright().chromium.launch(worldBrowserLaunchOptions());
try{for(const locale of ['en','zh-Hans'])for(const width of [390,768,1440]){
 const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage();
 await page.goto(new URL(`/?locale=${locale}`,base).href,{waitUntil:'networkidle'});
 const image=page.locator('[data-home-hero]');await image.evaluate(n=>n.decode());
 const check=async()=>{
  assert.equal(await image.count(),1);assert.equal(await page.locator('main [data-vr2-role="HERO"]').count(),1);
  assert.equal(await image.isVisible(),true);assert.ok(await image.evaluate(n=>n.naturalWidth>0));
  assert.ok((await image.evaluate(n=>n.currentSrc)).includes(`HOMEPAGE-${width<=600?'M':'D'}-v1.webp`));
  assert.equal(await page.locator('[data-cir-root],[data-cir-form],[data-ask-r1-result]').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 };await check();
 // Existing shared visual owner must yield even on repeated initialization.
 await page.evaluate(async()=>{const m=await import('/assets/js/client-visual-consumption.js');await m.initializeClientVisualConsumption();await m.initializeClientVisualConsumption();});await check();
 await page.evaluate(()=>{document.documentElement.lang=document.documentElement.lang==='en'?'zh-Hans':'en';window.dispatchEvent(new CustomEvent('phios:localechange',{detail:{locale:document.documentElement.lang}}));});await check();
 await page.reload({waitUntil:'networkidle'});await image.evaluate(n=>n.decode());await check();
 await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await check();
 for(const link of await page.locator('.home-r4-actions a').all()){
  await link.focus();assert.ok(await link.evaluate(n=>parseFloat(getComputedStyle(n).outlineWidth)>=2));
  const colors=await link.evaluate(n=>{const s=getComputedStyle(n);return [s.color,s.backgroundColor];});
  const L=s=>s.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
  const [a,b]=colors.map(L);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5);
 }
 await context.close();console.log(`PASS homepage R4 ${locale} ${width}: actual image, owner replay, locale, refresh, restoration, CTA contrast/focus`);
}}finally{await browser.close();}
