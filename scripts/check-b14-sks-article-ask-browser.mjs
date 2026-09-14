import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
import {onRequestGet,onRequestPost} from '../functions/api/customer-contextual-ask.js';
const {chromium}=await import(process.env.PHIOS_PLAYWRIGHT_MODULE?pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href:'playwright');const root=process.cwd();
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://local');if(url.pathname==='/api/timeout'){setTimeout(()=>res.end('{}'),500);return;}
 if(url.pathname==='/api/customer-contextual-ask'){let body='';for await(const c of req)body+=c;const request=new Request(url,{method:req.method,...(req.method==='POST'?{body}:{} )});const response=await(req.method==='POST'?onRequestPost:onRequestGet)({request,env:{}});res.writeHead(response.status,{'Content-Type':'application/json'});res.end(await response.text());return;}
 let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');else if(!fs.existsSync(file)&&fs.existsSync(file+'.html'))file+='.html';
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':file.endsWith('.svg')?'image/svg+xml':'image/webp');res.end(fs.readFileSync(file));
 }catch(error){res.writeHead(500).end(String(error));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{browser=await chromium.launch({channel:process.env.PHIOS_BROWSER_CHANNEL||'msedge',headless:true});const page=await browser.newPage();const origin=`http://127.0.0.1:${server.address().port}`;
 await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 for(const width of [360,1440]){await page.setViewportSize({width,height:1000});await page.goto(origin+'/articles/book4-article-001');await page.waitForSelector('.knowledge-article__header h1');
 assert.equal(await page.locator('.ks-article-hero__media').count(),0);assert.equal(await page.locator('.knowledge-article__hero-visual').count(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.ok(await page.locator('h1').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=28));
 if(process.env.PHIOS_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.PHIOS_SCREENSHOT_DIR,`phios-article-repair-${width}.png`),fullPage:true});
 }
 await page.goto(origin+'/knowledge/ask/');await page.locator('[name=question]').fill('文章');await page.locator('[data-cx-contextual-ask-form] [type=submit]').click();await page.waitForFunction(()=>document.querySelector('[data-cx-related-knowledge] a')?.getAttribute('href')==='/articles');assert.equal(await page.locator('[data-cx-answer-text]').innerText().then(s=>s.length<100),true);assert.equal(await page.locator('form[aria-busy=true]').count(),0);
 await page.context().setOffline(true);
 await page.waitForFunction(()=>document.querySelector('[data-cx-contextual-ask-form]').dataset.askState==='OFFLINE');
 await page.context().setOffline(false);
 await page.waitForFunction(()=>document.querySelector('[data-cx-contextual-ask-form]').dataset.askState==='IDLE');
 await page.locator('[name=question]').fill('test question');
 assert.equal(await page.locator('[data-cx-contextual-ask-form]').getAttribute('data-ask-state'),'COMPOSING');
 const result=await page.evaluate(async()=>{const {postJson}=await import('/assets/customer-ui/js/surfaces/runtime-ui.js');try{await postJson('/api/timeout',{}, {timeoutMs:50});return 'unexpected';}catch(e){return e.code;}});assert.equal(result,'REQUEST_TIMEOUT');
 console.log('✓ Full local article pages at 360/1440px: single hero, readable title, no overflow. Ask article navigation and bounded request timeout passed. External media and paid journeys were not tested.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
