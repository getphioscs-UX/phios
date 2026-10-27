import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadWorldPlaywright,worldBrowserLaunchOptions} from './lib/world-browser-runtime.mjs';
const out='.tmp/ecr-r33-binding-closure-20261027';
const image=pathToFileURL(path.resolve(out+'/latest-sec07.png')).href;
const html=out+'/sec07-scale-review.html';
fs.writeFileSync(html,`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;background:#122633;color:#f1deb5;font:16px sans-serif}main{max-width:820px;margin:auto}img{display:block;width:100%;height:auto}a{color:inherit}</style><main><p lang="zh-Hans">SEC-07 PDF 呈现 · 固定示范页面，非客户计算</p><p lang="en">SEC-07 PDF presentation · Fixed example, not a customer chart</p><img alt="Rendered A4 SEC-07 PDF" src="${image}"></main>`);
const browser=await loadWorldPlaywright().chromium.launch(worldBrowserLaunchOptions());
const rows=[];
try{for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
 const page=await browser.newPage({viewport:{width,height}});await page.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve(html)).href);await page.locator('img').evaluate(e=>e.decode());
 const check=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,imageWidth:document.querySelector('img').clientWidth,loaded:document.querySelector('img').naturalWidth>0}));
 if(check.scroll>width||!check.loaded||errors.length)throw Error('PREVIEW_LAYOUT_FAILED');await page.screenshot({path:out+'/'+name+'-sec07.png',fullPage:true});
 if(name==='mobile'){await page.locator('main').evaluate(e=>{e.style.width='780px';e.style.maxWidth='none'});await page.screenshot({path:out+'/mobile-sec07-200pct.png',fullPage:true});}
 rows.push({name,...check,errors,status:'PASS',scope:'Actual PDF raster shown at fit width; mobile 200% zoom screenshot also retained; fine text requires zoom'});await page.close();
 }}finally{await browser.close();}
fs.writeFileSync('tools/review/phi-configuration-deep-reading-r2-integrated/r33-publication/binding-closure-20261027/BROWSER-SCALE-QA.json',JSON.stringify({rows,networkRequests:0,customerRouteTest:false},null,2));console.log('Desktop and 390px PDF-presentation checks PASS');
