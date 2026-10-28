/**
 * Profile Visual R1 candidate screenshot: latest PR HTML over existing public
 * asset/API endpoints. NOT deployed production, no user input or writes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';

const OUTPUT='artifacts/profile-visitor-r1/browser-capture';
fs.mkdirSync(OUTPUT,{recursive:true});
const BASE='https://getphios.com/perspectives/profile/';
const localPaths=new Set([
 '/perspectives/profile/',
 '/assets/customer-ui/surfaces/profile-visitor-r1.css',
 '/assets/customer-ui/js/surfaces/profile-visitor-r1.js',
 '/assets/images/branding/PHIOS-LOGO-MARK-v1.png'
]);
for(const name of fs.readdirSync('assets/icons/profile-r1'))
 localPaths.add('/assets/icons/profile-r1/'+name);
function findChrome(){
 for(const item of [process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean))
   if(fs.existsSync(item))return item;
 try{return execFileSync('which',['google-chrome'],{encoding:'utf8'}).trim();}catch{}
 throw new Error('NO_CHROMIUM_EXECUTABLE: install Chromium on the runner rather than marking visual QA passed');
}
const browser=await chromium.launch({executablePath:findChrome(),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const report={kind:'PR_11_BROWSER_CANDIDATE_OVER_PUBLIC_ASSETS_NOT_DEPLOYED',branch:process.env.GITHUB_HEAD_REF||'',sha:process.env.GITHUB_SHA||'',baseUrl:BASE,viewports:[],errors:[],noProductionWrites:true};
let failCount=0;
try{
 for(const width of [1440,1024,768,390]){
  for(const loc of ['zh-Hans','en']){
   const height=width===390?844:width===768?900:width===1024?768:900;
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,locale:loc==='en'?'en-US':'zh-CN',colorScheme:'light'});
   const page=await context.newPage();
   const errors=[],failedRequests=[];
   page.on('pageerror',e=>errors.push(String(e.message).slice(0,300)));
   page.on('requestfailed',r=>failedRequests.push({url:r.url().slice(0,250),error:r.failure()?.errorText||'failed'}));
   page.on('response',r=>{if(r.status()>=400&&r.url().includes('getphios.com'))failedRequests.push({url:r.url().slice(0,250),status:r.status()});});
   await page.route('**/*',async route=>{
    const u=new URL(route.request().url());
    if(!['getphios.com','www.getphios.com'].includes(u.hostname)||!localPaths.has(u.pathname))return route.continue();
    const file=u.pathname==='/perspectives/profile/'?'perspectives/profile/index.html':u.pathname.slice(1);
    if(!fs.existsSync(file))return route.continue();
    let body=fs.readFileSync(file);
    if(u.pathname==='/perspectives/profile/'){
     let html=body.toString('utf8');
     html=html.replace('<html lang="en">','<html lang="'+loc+'">');
     body=Buffer.from(html,'utf8');
    }
    const type=file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':file.endsWith('.svg')?'image/svg+xml':'text/html';
    return route.fulfill({status:200,contentType:type,body});
   });
   let status='NOT_RENDERED',details={};
   try{
    await page.goto(BASE+'?locale='+loc,{waitUntil:'domcontentloaded',timeout:55000});
    await page.waitForFunction(()=>document.body?.dataset?.prfVisitorR1==='ready',{timeout:22000}).catch(()=>{});
    await page.waitForTimeout(900);
    if(loc==='zh-Hans') await page.evaluate(()=>{
      document.documentElement.lang='zh-Hans';
      window.dispatchEvent(new Event('phios:localechange'));
    });
    else await page.evaluate(()=>{
      document.documentElement.lang='en';
      window.dispatchEvent(new Event('phios:localechange'));
    });
    await page.waitForTimeout(300);
    details=await page.evaluate(()=>({
     initialized:document.body?.dataset?.prfVisitorR1==='ready',
     language:document.documentElement.lang,
     wheelLenses:document.querySelectorAll('.prf-visitor-wheel__lens').length,
     methodOptions:document.querySelectorAll('[data-prf-mode]').length,
     savedConsentDefault:document.querySelector('[data-prf-account-save]')?.checked,
     heroAsset:document.querySelector('[data-vr2-role="HERO"] img')?.dataset?.approvedVisual,
     scrollWidth:document.documentElement.scrollWidth,
     viewportWidth:document.documentElement.clientWidth,
     figureCount:document.querySelectorAll('figure').length,
     heroText:document.querySelector('.pm-hero h1')?.textContent?.trim(),
     shownMethod:document.querySelector('#profile-modes .prf-section-head h2')?.textContent?.trim(),
     loadedImages:[...document.querySelectorAll('.prf-visitor-wheel img,.prf-mode-grid img')].filter(x=>x.complete&&x.naturalWidth>0).length,
     overflowItems:[...document.querySelectorAll('body *')].filter(el=>{
       const r=el.getBoundingClientRect();const st=getComputedStyle(el);
       return st.position!=='fixed'&&r.width>0&&r.right>innerWidth+3&&r.left<innerWidth+100;
     }).slice(0,10).map(el=>({tag:el.tagName,cls:String(el.className||'').slice(0,100),right:Math.round(el.getBoundingClientRect().right)}))
    }));
    const id='profile-r1-'+(loc==='en'?'en':'zh')+'-'+width;
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:path.join(OUTPUT,id+'-hero.png'),fullPage:false,animations:'disabled'});
    await page.evaluate(()=>{
      const el=document.getElementById('profile-modes');
      if(el)window.scrollTo(0,Math.max(0,el.getBoundingClientRect().top+window.scrollY-88));
    });
    await page.waitForTimeout(650);
    await page.screenshot({path:path.join(OUTPUT,id+'-methods.png'),fullPage:false,animations:'disabled'});
    if([1440,390].includes(width)){
      await page.evaluate(()=>window.scrollTo(0,0));
      await page.screenshot({path:path.join(OUTPUT,id+'-full.png'),fullPage:true,animations:'disabled',timeout:60000});
    }
    status=details.initialized&&details.wheelLenses===6&&details.methodOptions===7&&details.savedConsentDefault===false?'DOM_PASS':'DOM_FAIL';
    if(status==='DOM_FAIL')failCount++;
   }catch(e){status='BROWSER_ERROR';errors.push(String(e.stack||e).slice(0,1100));failCount++;}
   report.viewports.push({width,height,locale:loc,status,details,errors,failedRequests:failedRequests.slice(0,20)});
   console.log(width,loc,status,JSON.stringify(details).slice(0,350),errors.slice(0,2));
   await context.close();
  }
 }
}finally{await browser.close();}
report.failCount=failCount;
report.warning='Screenshots show PR candidate HTML/CSS/JS locally over public live resources; this is NOT deployed main or account/customer-flow acceptance. Some external CDN assets may not load.';
fs.writeFileSync(path.join(OUTPUT,'CAPTURE-REPORT.json'),JSON.stringify(report,null,2));
if(failCount)process.exitCode=1;
