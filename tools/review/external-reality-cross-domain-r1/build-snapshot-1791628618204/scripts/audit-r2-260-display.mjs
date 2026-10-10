import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createPublicationReviewServer} from './lib/book-publication-review-server.mjs';
const dir='docs/assets/r2-public/';
const queue=JSON.parse(fs.readFileSync(dir+'r2-260-display-verification-queue-v1.json'));
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const server=createPublicationReviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const routes=[...new Set([...queue.rows.map(r=>r.route).filter(Boolean),'/account/','/academy/','/knowledge/figures/'])];
const pages=[];let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 for(const route of routes){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];const onError=e=>errors.push(e.message);page.on('pageerror',onError);
  try{
   const response=await page.goto(origin+route,{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForTimeout(1200);
   // Scroll through the actual page to trigger lazy images; do not inject assets.
   for(let y=0;y<await page.evaluate(()=>Math.min(document.documentElement.scrollHeight,30000));y+=800){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(80);}
   await page.waitForTimeout(700);
   const evidence=await page.evaluate(()=>{
    const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true});};
    return {images:[...document.images].filter(e=>visible(e)&&e.complete&&e.naturalWidth>0).map(e=>({url:e.currentSrc||e.src,width:e.naturalWidth,height:e.naturalHeight,alt:e.alt})),backgrounds:[...document.querySelectorAll('body *')].filter(visible).flatMap(e=>[...getComputedStyle(e).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m=>m[1])),icons:[...document.querySelectorAll('link[rel*=icon]')].map(e=>e.href)};
   });
   pages.push({route,httpStatus:response.status(),finalRoute:page.url().replace(origin,''),...evidence,errors});console.log('SCANNED',route,evidence.images.length);
  }catch(error){pages.push({route,error:String(error),errors});}
  page.off('pageerror',onError);await page.close();
 }
 const key=url=>{try{return decodeURIComponent(new URL(url).pathname).replace(/^\//,'');}catch{return '';}};
 const rows=queue.rows.map(r=>{const displayed=pages.filter(p=>p.images?.some(i=>key(i.url)===r.key));const backgrounds=pages.filter(p=>p.backgrounds?.some(u=>key(u)===r.key));const icons=pages.filter(p=>p.icons?.some(u=>key(u)===r.key));return {...r,displayStatus:displayed.length?'PAGE_IMAGE_DECODED':backgrounds.length?'CSS_REFERENCE_OBSERVED':icons.length?'BROWSER_ICON_LINK':r.key.includes('tarot')||r.key.includes('phi-card')?'INTERACTIVE_FLOW_NOT_VERIFIED':'NOT_OBSERVED',observedRoutes:displayed.map(p=>p.route),cssRoutes:backgrounds.map(p=>p.route),iconRoutes:icons.map(p=>p.route)};});
 const counts=rows.reduce((a,r)=>(a[r.displayStatus]=(a[r.displayStatus]||0)+1,a),{});
 fs.writeFileSync(dir+'r2-260-display-results-v1.json',JSON.stringify({observedAt:new Date().toISOString(),scope:'Original 260 cohort; local worktree, desktop signed-out routes, scrolling and natural image decode. Authenticated and interactive report flows not simulated. CSS/icon links are not decoded-page-image proof.',total:rows.length,counts,pages,rows},null,2)+'\n');
 console.log(counts);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
