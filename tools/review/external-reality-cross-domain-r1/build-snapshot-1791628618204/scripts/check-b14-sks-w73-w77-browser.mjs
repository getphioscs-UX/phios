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

 for(const width of [390,1440]){await page.setViewportSize({width,height:900});
 for(const route of ['formation','runtime','continuity','expansion']){await page.goto(origin+'/books/reality-'+route+'/');await page.waitForSelector('#structured-sources details');const actions=page.locator('.knowledge-actions').first();assert.equal(await actions.locator('[data-book-read]').count(),1);assert.equal(await actions.locator('[data-cka-contextual-entry=BOOK]').count(),1);assert.equal(await actions.locator('a[href="#'+({formation:'explorer',runtime:'runtime-atlas',continuity:'maintenance',expansion:'expansion'}[route])+'"]').count(),1);await actions.locator('[data-book-read]').click();await page.locator('#structured-sources summary').click();await page.waitForSelector('#structured-sources [data-lazy-source] a');if(route==='expansion')assert.ok(await page.locator('a[href="/books/reality-differentiation/#atlas"]').count());}
 await page.goto(origin+'/search/');await page.waitForSelector('.cx-knowledge-result');const text=await page.locator('[data-cx-knowledge-search-results]').innerText();for(const type of ['Article','Book','Figure','Structured object','Atlas'])assert.ok(text.includes(type),type+':'+text.slice(0,120));
 await page.locator('[data-cx-knowledge-search-form] [name=q]').fill('SK-B1-CARRIER');await page.locator('[data-cx-knowledge-search-form] button').click();await page.waitForSelector('.cx-knowledge-result h2 a[href*="mechanism=SK-B1-CARRIER"]');await page.locator('.cx-knowledge-result h2 a').first().click();await page.waitForSelector('nav button[data-id="SK-B1-CARRIER"][aria-pressed=true]');
 }
 console.log('✓ W75–W77 full local pages: four book Read/Explore/Ask actions, Book V continuation, five search types and selected-object search navigation at mobile/desktop widths. External media and human comprehension not tested.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}

