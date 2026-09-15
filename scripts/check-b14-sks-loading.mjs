import fs from 'node:fs';
import assert from 'node:assert/strict';
import {loadingFiles,base} from './build-b14-sks-loading.mjs';
import {createStructuredLoader} from '../assets/js/knowledge/structured-loader.js';
const files=loadingFiles();for(const [name,body] of Object.entries(files))assert.equal(fs.readFileSync(base+name,'utf8'),body,`LOADING_PROJECTION_DRIFT:${name}`);
const requests=[];let fail=false;
const loader=createStructuredLoader(async url=>{requests.push(url);if(fail){fail=false;return {ok:false};}return {ok:true,json:async()=>JSON.parse(fs.readFileSync('.'+url))};});
const b=await loader.book('BOOK-1');assert.equal(requests.length,2);
const id=Object.keys(b.objects)[0];const [a,c]=await Promise.all([loader.object('BOOK-1',id),loader.object('BOOK-1',id)]);assert.deepEqual(a,c);assert.equal(requests.length,4);
assert.ok(requests[2].includes('/families/'));assert.ok(requests[3].includes('/objects/'));
await assert.rejects(()=>loader.object('BOOK-2',id),/UNKNOWN_OBJECT/);
const fresh=createStructuredLoader(async url=>{if(fail){fail=false;throw new Error('fixture offline');}return {ok:true,json:async()=>JSON.parse(fs.readFileSync('.'+url))};});
fail=true;await assert.rejects(()=>fresh.book('BOOK-3'));assert.equal((await fresh.book('BOOK-3')).bookCode,'BOOK-3');
assert.equal(Object.keys(files).filter(x=>x.startsWith('objects/')).length,71);
console.log('✓ W62: reproducible 71-object projection, manifest/book/family/object order, concurrent request reuse, retry and cross-book rejection passed.');
if(process.argv.includes('--browser')){
 const {pathToFileURL}=await import('node:url');const {default:http}=await import('node:http');const {chromium}=await import(process.env.PHIOS_PLAYWRIGHT_MODULE?pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href:'playwright');
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://local');if(url.pathname==='/'){res.setHeader('Content-Type','text/html');res.end('<html><body><main id="host"></main></body></html>');return;}try{const path='.'+url.pathname;if(url.pathname.includes('..'))throw Error();res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':'application/json');res.end(fs.readFileSync(path));}catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await chromium.launch({channel:process.env.PHIOS_BROWSER_CHANNEL||'msedge',headless:true});
 for(let n=1;n<=4;n++){
  const page=await browser.newPage({viewport:{width:390,height:844}}),urls=[];page.on('request',r=>{if(r.url().includes('/loading/'))urls.push(r.url());});await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(async code=>{const {mountProgressiveExplorer}=await import('/assets/js/knowledge/progressive-explorer.js');window.dispose=await mountProgressiveExplorer(document.querySelector('main'),code,'zh-Hans');},`BOOK-${n}`);
  assert.equal(urls.length,4);assert.equal(await page.locator('aside h3').count(),1);
  const second=page.locator('nav button').nth(1);if(await second.count()){await second.click();await page.waitForFunction(()=>document.querySelector('aside h3')&&document.querySelector('nav [aria-pressed=true]')?.textContent===document.querySelector('aside h3')?.textContent);assert.equal(urls.length,5);await page.goBack();await page.waitForSelector('aside h3');assert.equal(urls.length,5);}
  await page.evaluate(()=>window.dispose());await page.close();
 }
 console.log('✓ W62 browser: four live progressive mounts, four initial JSON requests each, selected-object lazy load and history cache passed.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
}
