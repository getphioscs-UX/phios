import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const routes=['/','/explore/','/knowledge/','/articles/','/articles/book3-article-008','/figures/','/search/?q=Reality%20Continuity','/knowledge/concepts/','/books/','/books/reality-formation/','/books/reality-runtime/','/books/reality-continuity/','/books/reality-expansion/','/books/reality-differentiation/','/books/reality-observation/','/books/reality-navigation/','/knowledge/ask/','/reality/','/perspectives/','/perspectives/personal/','/perspectives/profile/','/perspectives/relationship/','/perspectives/tarot/','/professional/financial/','/account/'];
const tasks=routes.flatMap(route=>[390,1440].map(width=>({route,width}))),results=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
try{await Promise.all(Array.from({length:3},async()=>{let task;while(task=tasks.shift()){
 const page=await browser.newPage({viewport:{width:task.width,height:task.width===390?844:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{const response=await page.goto('https://getphios.com'+task.route,{waitUntil:'domcontentloaded',timeout:25000});await page.waitForTimeout(1500);await page.evaluate(()=>{document.querySelectorAll('img').forEach(i=>i.loading='eager');});await page.waitForTimeout(1500);
  const dom=await page.evaluate(()=>({url:location.href,locale:document.documentElement.lang,title:document.title,overflow:document.documentElement.scrollWidth>innerWidth,h1:[...document.querySelectorAll('h1')].map(e=>e.textContent),images:[...document.images].map(i=>({src:i.currentSrc||i.src,complete:i.complete,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,asset:i.dataset.cxAsset||null,visible:!!i.getClientRects().length})),shell:document.documentElement.dataset.cxShell||null}));
  results.push({...task,httpStatus:response?.status(),...dom,errors,status:response?.ok()&&!dom.overflow&&!errors.length?'PASS':'FAIL',scope:'PAGE_LOAD_LAYOUT_ONLY_NOT_FUNCTIONAL_ACCEPTANCE'});
 }catch(error){results.push({...task,status:'NOT_RUN',error:error.message});}finally{await page.close();}
 console.log('page sweep',results.length,'/50');
}}));}finally{await browser.close();}
fs.writeFileSync('docs/customer-activation-r1/public-browser-coverage-v1.json',JSON.stringify({at:new Date().toISOString(),environment:'PRODUCTION',authentication:'GUEST',routeCount:routes.length,tested:results.length,sampling:'25 listed routes × 390/1440; dynamic article collection sampled at book3-article-008. No authenticated, payment or audible acceptance.',results},null,2)+'\n');
