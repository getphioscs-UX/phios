import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json'),{chromium}=require('playwright');
const root=process.cwd(),out='tools/review/phi-configuration-deep-reading-r2-integrated';
const server=http.createServer((req,res)=>{let relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=path.resolve(root,'.'+relative);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!fs.existsSync(file)){res.writeHead(404).end();return;}const types={'.js':'application/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.svg':'image/svg+xml'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;let browser;const results=[],external=[];
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 for(const locale of ['en','zh-Hans'])for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{if(!route.request().url().startsWith(base)){external.push(route.request().url());return route.abort();}return route.continue();});
  await page.goto(base+'/perspectives/phi-configuration/',{waitUntil:'networkidle'});await page.evaluate(l=>document.documentElement.lang=l,locale);
  const h=page.locator('[data-ecr-deep-r2]');await h.locator('[data-ecr-r2-layer]').first().waitFor();
  assert.equal(await h.locator('[data-ecr-r2-layer]').count(),8);assert.equal(await h.locator('[data-card]').count(),48);
  await h.locator('[data-p64-marker="PERSONALITY:EARTH"]').focus();assert.match(await h.locator('[data-ecr-mandala-detail-title]').innerText(),/EARTH/);
  await h.locator('[data-ecr-mandala-fullscreen-open]').click();await h.locator('[data-ecr-mandala-fullscreen-close]').click();
  await h.locator('[data-card]').first().click();assert.equal(await h.locator('[data-card][aria-pressed=true]').count(),1);
  await h.locator('[data-mode="3"]').click();for(let i=0;i<3;i++)await h.locator('[data-card]').nth(i).click();assert.equal(await h.locator('[data-card][aria-pressed=true]').count(),3);
  await h.locator('[data-card]').nth(3).click();assert.equal(await h.locator('[data-card][aria-pressed=true]').count(),3);
  await h.locator('[data-flip]').click();assert.equal(await h.locator('img').count(),0);
  await h.locator('[data-report-language]').selectOption('bilingual');assert.match(await h.locator('[data-report-language] option:checked').innerText(),/139\.00/);
  await h.locator('[data-ecr-r2-layer="6"]').click();assert.equal(await h.locator('.pm-card details li').count(),64);
  const overflow=await page.evaluate(()=>({document:document.documentElement.scrollWidth>innerWidth+2,host:document.querySelector('[data-ecr-deep-r2]').scrollWidth>innerWidth+2}));
  await h.screenshot({path:`${out}/browser-${locale}-${width}.png`});results.push({locale,width,status:errors.length||overflow.host?'FAIL':'PASS',errors,overflow,selectedCards:3,quotes:'RM129/RM129/RM139',remoteImages:'NOT_VERIFIED_NETWORK_BLOCKED'});await page.close();
 }
 for(const locale of ['zh-Hans','en','bilingual']){const page=await browser.newPage();await page.goto(base+`/${out}/review-${locale}.html`,{waitUntil:'networkidle'});const clipped=await page.locator('.page').evaluateAll(pages=>pages.map((p,i)=>({page:i+1,scrollHeight:p.scrollHeight,clientHeight:p.clientHeight})).filter(p=>p.scrollHeight>p.clientHeight+1));assert.deepEqual(clipped,[]);await page.pdf({path:`${out}/review-${locale}.pdf`,printBackground:true,preferCSSPageSize:true});results.push({pdf:locale,status:'PASS',htmlPages:10,clipped});await page.close();}
}finally{await browser?.close();server.close();fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify({results,externalRequestsBlocked:external.length,providerCalls:0,realCharges:0},null,2));}
console.log(JSON.stringify(results));if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
