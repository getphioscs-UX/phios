import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PHIOS_PLAYWRIGHT||'C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root='tools/review/financial-publication-r3',publicRoot='professional/financial/report-preview',generatePdf=process.argv.includes('--pdf'),results=[],errors=[];
if(generatePdf)fs.mkdirSync('output/pdf/financial-r3',{recursive:true});
const state=JSON.parse(fs.readFileSync(`${root}/execution-state.json`,'utf8'));const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 for(const entry of state.results){const page=await browser.newPage({viewport:{width:1100,height:1200}});let network=0;page.on('pageerror',error=>errors.push(error.message));await page.route('http**://**',route=>{network++;return route.abort();});
  await page.goto(pathToFileURL(path.resolve(publicRoot,entry.file)).href);await page.evaluate(()=>document.fonts.ready);await page.locator('.r3-background').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
  assert.equal(await page.locator('[data-finance-page]').count(),entry.corePages);assert.equal(await page.locator('[data-deepening-slot]').count(),entry.tier==='PAID'?14:0);assert.equal(network,0);
  const assets=await page.locator('.r3-background').evaluateAll(images=>images.map(img=>({role:img.dataset.r3Asset,width:img.naturalWidth,height:img.naturalHeight,embedded:img.src.startsWith('data:image/webp;base64,')})));assert(assets.every(a=>a.embedded&&a.width===1055&&a.height===1491));assert.equal(assets[0].role,entry.tier==='PAID'?'cover':'body');assert(assets.slice(1).every(a=>a.role==='body'));
  const texts=await page.locator('.r3-content,.r3-footer,.r3-cover-meta,.r3-cover-flag').allTextContents();if(entry.language==='en')assert(!/[\u3400-\u9fff]/u.test(texts.join('')),entry.file+' Chinese body leak');
  await page.emulateMedia({media:'print'});
  const overflow=await page.locator('.r3-content').evaluateAll(nodes=>nodes.map(node=>{const box=node.getBoundingClientRect();return {page:node.closest('[data-finance-page]').dataset.financePage,scroll:node.scrollHeight,height:node.clientHeight,lastBottom:Math.max(...[...node.children].map(child=>child.getBoundingClientRect().bottom)),bottom:box.bottom};}).filter(x=>x.scroll>x.height+2||x.lastBottom>x.bottom+2));
  assert.deepEqual(overflow,[],`${entry.file}: content overflow`);
  if(generatePdf)await page.pdf({path:`output/pdf/financial-r3/${entry.file.replace('.html','.pdf')}`,preferCSSPageSize:true,printBackground:true});
  await page.emulateMedia({media:'screen'});if(entry.tier==='PAID'&&entry.state==='complete')for(const number of [1,2,4,7,12,13])await page.locator(`[data-finance-page="${number}"]`).screenshot({path:`${root}/${entry.language}-p${String(number).padStart(2,'0')}.png`});
  for(const width of [360,768,1440]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),entry.file+' mobile overflow '+width);}
  results.push({...entry,allAssetsEmbedded:true,remoteRequests:network,contentOverflow:false,pdfGenerated:generatePdf,screenWidths:[360,768,1440],deepeningSlots:entry.tier==='PAID'?14:0});await page.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.goto(pathToFileURL(path.resolve(publicRoot,'index.html')).href);await page.selectOption('#tier','FREE');await page.selectOption('#lang','en');await page.selectOption('#state','missing');await page.waitForFunction(()=>document.querySelector('#report').src.endsWith('free-missing-en.html'));await page.frameLocator('#report').locator('[data-finance-page="8"]').waitFor({state:'attached'});await page.screenshot({path:`${root}/preview-index.png`,fullPage:false});await page.close();
 assert.deepEqual(errors,[]);fs.writeFileSync(`${root}/browser-${generatePdf?'pdf':'layout'}-verification.json`,JSON.stringify({results,indexSwitch:true,pageErrors:errors,providerCalls:0},null,2)+'\n');console.log(`PASS R3 ${generatePdf?'PDF + ':''}browser: 12 candidates, assets, page ordering, localized text and layout.`);
}finally{await browser.close();}
