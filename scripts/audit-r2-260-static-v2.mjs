import fs from 'node:fs';import {pathToFileURL} from 'node:url';
import {createPublicationReviewServer} from './lib/book-publication-review-server.mjs';
import {json,evidenceDir,writeJson} from './lib/r2-260-evidence.mjs';
const original=json('docs/assets/r2-public/r2-260-display-results-v1.json').rows;
const key=u=>{try{return decodeURIComponent(new URL(u).pathname).slice(1);}catch{return '';}};
const keys=new Set(original.map(r=>r.key));
const redirects=new Map(fs.readFileSync('_redirects','utf8').split(/\r?\n/).map(x=>x.trim().split(/\s+/)).filter(x=>x.length===3&&/^30[1278]$/.test(x[2])).map(x=>[x[0],x[1]]));
function current(route){const seen=new Set();while(redirects.has(route)&&!seen.has(route)){seen.add(route);route=redirects.get(route);}return route;}
const routes=[...new Set([...original.map(r=>r.route).filter(Boolean).map(current),'/account/','/academy/','/knowledge/','/professional/reports/','/professional/appointments/','/professional/services/'])];
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const server=createPublicationReviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;let browser;
const views=[];const jobs=routes.flatMap(route=>[390,1440].flatMap(viewport=>['zh-Hans','en'].map(locale=>({route,viewport,locale}))));
try{browser=await chromium.launch({channel:'msedge',headless:true});let cursor=0;
 await Promise.all(Array.from({length:3},async()=>{while(cursor<jobs.length){const job=jobs[cursor++],{route,viewport,locale}=job;const page=await browser.newPage({viewport:{width:viewport,height:950}});const evidence=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  const response=await page.goto(origin+route+'?locale='+locale,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1000);
  await page.waitForFunction(()=>[...document.querySelectorAll('img[data-px2-asset]')].every(i=>(i.closest('[data-px2-visual]')||i).dataset.assetStatus),{timeout:15000}).catch(()=>{});
  async function capture(trigger){
   const images=page.locator('img');for(let i=0;i<await images.count();i++){const img=images.nth(i);const src=await img.getAttribute('src');if(await img.evaluate(i=>Boolean(i.closest('details:not([open])'))))continue;if(!keys.has(key(new URL(src||'',origin).href)))continue;
    try{await img.evaluate(i=>(i.closest('figure,article')||i).scrollIntoView({block:'center'}));await img.evaluate(i=>Promise.race([i.decode(),new Promise((_,reject)=>setTimeout(()=>reject(Error('DECODE_TIMEOUT')),6000))]));const item=await img.evaluate(i=>{const b=i.getBoundingClientRect();return {resolvedUrl:i.currentSrc||i.src,attached:i.isConnected,visible:i.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}),decoded:i.complete&&i.naturalWidth>0&&i.naturalHeight>0,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,width:b.width,height:b.height,alt:i.alt,component:i.getAttribute('data-px2-asset')||i.closest('[data-pis-context-figures]')?.tagName||i.className};});evidence.push({...item,objectKey:key(item.resolvedUrl),trigger,selector:'img[src='+JSON.stringify(src)+']'});}catch(e){evidence.push({objectKey:key(new URL(src,origin).href),trigger,error:String(e),decoded:false});}
   }
  }
  await capture('PAGE_OPEN_AND_SCROLL');
  for(const s of await page.locator('details:not([open]) > summary').all()){if(await s.isVisible())await s.click();}
  await page.waitForTimeout(300);
  await capture('CUSTOMER_DISCLOSURE_OPEN_AND_SCROLL');
  const icons=await page.locator('link[rel*=icon]').evaluateAll(es=>es.map(e=>({href:e.href,rel:e.rel})));
  for(const icon of icons){if(keys.has(key(icon.href))){const r=await page.request.get(icon.href);evidence.push({objectKey:key(icon.href),resolvedUrl:icon.href,trigger:'BROWSER_ICON_LINK',evidenceClass:'BROWSER_ICON',httpStatus:r.status(),mime:r.headers()['content-type'],resourceBytes:(await r.body()).length,selector:`link[rel="${icon.rel}"]`,rendered:false});}}
  views.push({...job,httpStatus:response.status(),finalRoute:page.url().replace(origin,''),lang:await page.getAttribute('html','lang'),evidence,errors,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)});
 }catch(e){views.push({...job,error:String(e),evidence,errors});}finally{await page.close();console.log('STATIC',route,viewport,locale,evidence.length);writeJson(evidenceDir+'/r2-260-static-browser-v2.json',{scope:'LOCAL_BROWSER_VERIFIED; actual customer routes and disclosures; no audit galleries',routes,routeResolution:original.filter(r=>r.route).map(r=>({from:r.route,to:current(r.route)})),views});}
 }}));
}finally{await browser?.close();await new Promise(r=>server.close(r));}



