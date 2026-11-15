import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';
import {loadWorldPlaywright,worldBrowserLaunchOptions} from './lib/world-browser-runtime.mjs';
const root=process.cwd();let signed=false;const observations=[];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost');
 if(u.pathname==='/api/account-financial-will-drafts'){
  const wasSigned=signed;await new Promise(r=>setTimeout(r,wasSigned?30:1800));res.writeHead(wasSigned?200:401,{'content-type':'application/json'});res.end(JSON.stringify(wasSigned?{ok:true,accountOwnerRef:'SYNTHETIC_SESSION_OWNER',drafts:[]}:{ok:false,code:'ACCOUNT_REQUIRED'}));return;
 }
 if(u.pathname.startsWith('/api/')){res.writeHead(404,{'content-type':'application/json'});res.end('{}');return;}
 let p=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(u.pathname.endsWith('/'))p=path.join(p,'index.html');else if(!fs.existsSync(p)&&fs.existsSync(p+'.html'))p+='.html';if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end('');return;}res.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'});fs.createReadStream(p).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const {chromium}=loadWorldPlaywright(),browser=await chromium.launch({...worldBrowserLaunchOptions(),args:['--no-proxy-server']});
try{
 const context=await browser.newContext();await context.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());const page=await context.newPage();
 await page.goto(origin+'/professional/financial/?locale=en');await page.locator('[data-loan-tool] [name="principal"]').fill('120000');await page.waitForTimeout(2500);let value=await page.locator('[data-loan-tool] [name="principal"]').inputValue();observations.push({case:'Initial delayed guest 401',principal:value});assert.equal(value,'120000','A delayed anonymous check must not erase freshly entered values');
 await page.evaluate(()=>window.dispatchEvent(new Event('phios:account-logout')));assert.equal(await page.locator('[data-loan-tool] [name="principal"]').inputValue(),'','Explicit logout must still clear sensitive inputs');
 signed=true;await page.reload();await page.waitForSelector('[data-secure-draft="FINANCIAL"] [data-save-secure]',{state:'attached'});await page.locator('[data-loan-tool] [name="principal"]').fill('120000');signed=false;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForTimeout(2500);value=await page.locator('[data-loan-tool] [name="principal"]').inputValue();observations.push({case:'Previously authenticated session expires',principal:value});assert.equal(value,'','An expired previously authenticated session must clear the inputs');
 for(const locale of ['en','zh-Hans'])for(const width of [360,768,1440]){await page.setViewportSize({width,height:1000});await page.goto(origin+'/articles/book3-article-023?locale='+locale);await page.locator('h1:visible').first().waitFor();assert.equal(await page.locator('.knowledge-article__hero-visual [data-ks-asset="HERO-004"]').count(),0);const top=await page.locator('h1:visible').first().evaluate(n=>n.getBoundingClientRect().top);assert(top<500,'An unavailable decorative hero must not push the title below an empty screen');observations.push({case:'Article without approved hero',locale,width,titleTop:top});}
 await context.close();console.log('PASS delayed guest check preserves new inputs; logout/session expiry still erase them; article text-first layout passes six variants.');
}finally{fs.mkdirSync('E:/audit-r2',{recursive:true});fs.writeFileSync('E:/audit-r2/guest-input-race.json',JSON.stringify(observations,null,2));await browser.close();await new Promise(r=>server.close(r));}
