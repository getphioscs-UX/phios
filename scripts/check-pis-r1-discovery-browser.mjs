import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {previewServer} from './lib/ca-r1-preview-server.mjs';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const booksOnly=process.env.PHIOS_PIS_BOOKS_ONLY==='1';
const pages=booksOnly?Object.fromEntries(JSON.parse(fs.readFileSync('content/web/index-surfaces/pis-r1-book-context-v1.json')).books.map(b=>[b.file,[]])):JSON.parse(fs.readFileSync('content/web/index-surfaces/pis-r1-discovery-copy-v1.json')).pages;
if(process.env.PHIOS_PIS_FILES)for(const file of Object.keys(pages))if(!process.env.PHIOS_PIS_FILES.split(',').includes(file))delete pages[file];
const server=await previewServer(),browser=await chromium.launch({channel:'msedge',headless:true});
const results=[];
const testedFiles=[...Object.keys(pages),'assets/customer-ui/js/public-index-copy.js','assets/customer-ui/surfaces/public-index.css','assets/js/public-v2/unified-public-visual-resolver.js','assets/js/client-visual-consumption.js','assets/js/public-shell.js','assets/customer-ui/js/surfaces/academy.js','assets/js/pages/service-continuity-visuals.js','assets/js/pages/brand-research-commerce-legal.js','assets/js/locales/en/thesis.js','assets/js/locales/zh-Hans/thesis.js','assets/js/locales/en/knowledge.js','assets/js/locales/zh-Hans/knowledge.js','assets/js/locales/en/public.js','assets/js/locales/zh-Hans/public.js','assets/customer-ui/js/public-index-figures.js','assets/customer-ui/surfaces/public-book-context.css',...(pages['membership.html']?['assets/js/locales/en/account.js','assets/js/locales/zh-Hans/account.js']:[])].map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));
try{
 for(const width of [360,390,768,1440])for(const file of Object.keys(pages)){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===server.origin||u.hostname==='pub-1967bc5812ee4164b19a806fb1427021.r2.dev'?r.continue():r.abort();});
  const route=file==='index.html'?'/':'/'+file.replace(/index\.html$/,'');
  console.log(`PIS browser: ${width} ${file}`);
  await page.goto(server.origin+route,{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('.pis-editorial').first().waitFor();
  await page.locator('main h1').waitFor();
  for(const locale of ['en','zh-Hans']){
   // Exercise the existing visible shell language controls, not a synthetic DOM state.
   await page.evaluate(()=>window.scrollTo(0,0));
   const toggle=page.locator(`button[data-cx-locale="${locale}"]:visible, button[data-locale="${locale}"]:visible, button[data-puxr-locale-button="${locale}"]:visible`).first();
   if(!await toggle.count()){const menu=page.locator('button[data-cx-menu]:visible, .public-menu-toggle:visible').first();await menu.waitFor();await menu.click();}
   await toggle.waitFor();await toggle.click();await page.keyboard.press('Escape');
   // Native dialog close events restore opener focus asynchronously. Wait for that
   // existing lifecycle before checking the next keyboard target.
   await page.waitForFunction(()=>!document.querySelector('dialog[open]')&&!document.documentElement.dataset.cxDialogOpen);
   await page.waitForFunction(locale=>[...document.querySelectorAll('[data-pis-copy]')].every(n=>n.textContent===n.getAttribute(locale==='en'?'data-cx-en':'data-cx-zh')),locale);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const overflow=await page.evaluate(()=>[...document.querySelectorAll('.pis-editorial')].some(n=>n.scrollWidth>n.clientWidth+1));
   assert.equal(overflow,false,`${file} ${width} ${locale}: editorial overflow`);
   const pageOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
   if(pageOverflow){
    const elements=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+2}).slice(0,20).map(e=>({tag:e.tagName,class:e.className,left:e.getBoundingClientRect().left,width:e.getBoundingClientRect().width,text:e.textContent.slice(0,80)})));
    fs.writeFileSync('docs/public-index-successor/browser-overflow-diagnostic.json',JSON.stringify({file,width,locale,elements},null,2));
   }
   assert.equal(pageOverflow,false,`${file} ${width} ${locale}: page overflow`);
   if(await page.locator('body[data-pis-hero]').count())assert.equal(await page.locator('.client-visual-masthead').count(),0,'PIS hero must not receive a second automatic masthead');
   assert.equal(await page.locator('h1').count(),1);
   const target=page.locator('.pis-editorial a').first();await target.focus();
   assert.ok(await target.evaluate(n=>document.activeElement===n));
   results.push({file,width,locale,editorialOverflow:false,pageOverflow:false,keyboardFocus:true,status:'PASS'});
   if(width===390||width===1440){
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.waitForFunction(()=>[...document.querySelectorAll('.pis-landing-hero__image')].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:30000});
    fs.mkdirSync('docs/public-index-successor/screenshots',{recursive:true});
    await page.screenshot({path:`docs/public-index-successor/screenshots/${file.replace(/[^a-z0-9]/gi,'-')}-${width}-${locale}.png`});
   }
  }
  if((file==='index.html'&&width===390)||(file==='about/index.html'&&width===1440)){await page.evaluate(()=>window.scrollTo(0,0));await page.waitForFunction(()=>{const img=document.querySelector('img[data-cx-asset="HERO-001"]');return !img||(img.complete&&img.naturalWidth>0)});await page.screenshot({path:`docs/public-index-successor/${file==='index.html'?'home-mobile':'about-desktop'}.png`,fullPage:true});}
  await page.close();
 }
}finally{
 await browser.close();await server.close();
 fs.writeFileSync(`docs/public-index-successor/pis-r1-${process.env.PHIOS_PIS_FILES?'filtered':booksOnly?'books':'discovery'}-browser-v1.json`,JSON.stringify({scope:'LOCAL_EDITORIAL_LAYOUT_LOCALE_AND_FOCUS_NOT_PRODUCTION_E2E',testedFiles,expectedCases:Object.keys(pages).length*8,complete:results.length===Object.keys(pages).length*8,results},null,2)+'\n');
}
console.log(`PASS PIS local browser: ${results.length} page/viewport/locale cases.`);
