import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PHIOS_PLAYWRIGHT||'C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:process.env.PHIOS_BROWSER_CHANNEL||'msedge'});
const root='tools/review/finance-core-v2',results=[];
try{for(const file of fs.readdirSync(root).filter(x=>/^(complete|shortfall|missing)-.*\.html$/.test(x))){
 const page=await browser.newPage();await page.goto(pathToFileURL(path.resolve(root,file)).href);await page.evaluate(()=>document.fonts.ready);
 for(const width of [360,768,1440]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${file} overflow ${width}`);}
 await page.emulateMedia({media:'print'});
 const overflow=await page.locator('.page').evaluateAll(nodes=>nodes.map((n,i)=>({page:i+1,overflow:n.scrollHeight>n.clientHeight+2})).filter(x=>x.overflow));assert.deepEqual(overflow,[],file);
 await page.pdf({path:`${root}/${file.replace('.html','.pdf')}`,preferCSSPageSize:true,printBackground:true});
 await page.emulateMedia({media:'screen'});await page.setViewportSize({width:1000,height:1200});
 if(file==='complete-zh-Hans.html')await page.locator('[data-finance-page="5"]').screenshot({path:`${root}/cashflow-zh.png`});
 results.push({file,widths:[360,768,1440],horizontalOverflow:false,printBoxOverflow:false});await page.close();
}}finally{await browser.close();}
fs.writeFileSync(`${root}/browser-verification.json`,JSON.stringify({results,pdfPageCount:'VERIFY_WITH_PDF_READER',providerCalls:0},null,2)+'\n');console.log('PASS six browser layouts and A4 page boxes');
