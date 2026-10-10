import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PHIOS_PLAYWRIGHT_MODULE?pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href:'playwright');
const root=process.cwd();
const configs=[['formation-explorer','renderFormationExplorer','mechanism','SK-B1-CONSTRAINT'],['runtime-interaction-atlas','renderRuntimeAtlas','pattern','SK-B2-B2-P6-002'],['maintenance-explorer','renderMaintenanceExplorer','topic','SK-B3-B3-P8-137'],['expansion-explorer','renderExpansionExplorer','expansion','SK-B4-B4-P10-219']];
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://local');
 if(url.pathname==='/fixture'){
  const index=Number(url.searchParams.get('book')),locale=url.searchParams.get('locale'),[name,render]=configs[index];
  res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html lang="${locale}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/css/${name}.css"><link rel="stylesheet" href="/assets/css/structured-explorer.css"></head><body><main><section class="${name}"></section></main><script type="module">
  import {${render}} from '/assets/js/knowledge/${name}.js';
  const load=async p=>(await fetch('/content/knowledge/structured/'+p)).json();let props;
  if(${index}===0)props={registry:await load('book-1/book-1-mechanism-registry-v1.json'),chains:await load('book-1/book-1-formation-chain-registry-v1.json'),comparisons:await load('book-1/book-1-mechanism-comparison-families-v1.json')};
  if(${index}===1)props=await load('book-2/book-2-runtime-pattern-registry-v1.json');
  if(${index}===2)props=await load('book-3/book-3-maintenance-signal-registry-v1.json');
  if(${index}===3)props={...(await load('book-4/book-4-expansion-mode-registry-v1.json')),chains:await load('book-4/book-4-expansion-chain-registry-v1.json'),bridge:await load('bridges/book-4-to-book-5-civilization-threshold-v1.json')};
  window.dispose=${render}(document.querySelector('section'),{...props,locale:'${locale}'});window.ready=true;
  </script></body></html>`);return;
 }
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/json');res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({channel:process.env.PHIOS_BROWSER_CHANNEL||'chrome',headless:true});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));let cases=0;
 for(const locale of ['en','zh-Hans'])for(let book=0;book<4;book++)for(const width of [360,390,768,1440]){
  await page.setViewportSize({width,height:1000});await page.goto(`http://127.0.0.1:${server.address().port}/fixture?book=${book}&locale=${locale}`);await page.waitForFunction(()=>window.ready);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${book}/${locale}/${width} overflow`);
  assert.equal(await page.locator('.structured-explorer').count(),1);
  const controls=page.locator(book===2?'.maintenance-topics summary':book===0?'nav [data-object]':'nav button');
  await controls.first().focus();await page.keyboard.press('ArrowDown');assert.equal(await controls.nth(1).evaluate(e=>e===document.activeElement),true);
  await controls.nth(1).click();const selected=new URL(page.url()).searchParams.get(configs[book][2]);assert.ok(selected);
  await page.waitForFunction(id=>document.querySelector('[data-explorer-ask]')?.getAttribute('href')?.includes(id.toLowerCase()),selected);
  await controls.nth(2).click();await page.goBack();assert.equal(new URL(page.url()).searchParams.get(configs[book][2]),selected);
  const filter=page.locator('.structured-explorer-filter select');await filter.selectOption('selected');
  assert.equal(await controls.evaluateAll(items=>items.filter(e=>e.getClientRects().length>0).length),1);
  await filter.selectOption('all');
  await page.reload();await page.waitForFunction(()=>window.ready);assert.equal(new URL(page.url()).searchParams.get(configs[book][2]),selected);
  const search=page.locator('input[type=search]');await search.fill('no-such-topic-987');assert.ok(await page.locator('[role=status]').count());await search.fill('');
  await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});await controls.first().focus();assert.notEqual(await controls.first().evaluate(e=>getComputedStyle(e).outlineStyle),'none');await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'});
  if(process.env.PHIOS_SCREENSHOT_DIR&&locale==='zh-Hans'&&book===3&&[360,1440].includes(width))await page.screenshot({path:path.join(process.env.PHIOS_SCREENSHOT_DIR,`phios-explorer-${width}.png`),fullPage:true});
  cases++;
 }
 for(const [book,alias] of [[2,'degradation'],[3,'scale']]){await page.goto(`http://127.0.0.1:${server.address().port}/fixture?book=${book}&locale=en&${alias}=${configs[book][3]}`);await page.waitForFunction(()=>window.ready);await page.waitForFunction(id=>document.querySelector('[data-explorer-ask]')?.getAttribute('href')?.includes(id.toLowerCase()),configs[book][3]);}
 assert.deepEqual(errors,[]);console.log(`✓ W41–W44 component browser matrix: ${cases} book/locale/viewport cases, overflow, keyboard, history, empty search and forced-color focus passed. Full-page and paid journeys are separate.`);
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
