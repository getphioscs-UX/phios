import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createPublicationReviewServer} from './lib/book-publication-review-server.mjs';
const {chromium}=await import(process.env.PHIOS_PLAYWRIGHT_MODULE?pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href:'playwright');
const server=createPublicationReviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`,results=[];let browser;
const routes=['atlas=timeline&period=T00','atlas=cases&case=CA-T09-01','atlas=comparison&family=CONTINENTAL_EMPIRE','atlas=world&snapshot=WS-1250','atlas=trajectories&trajectories=POPULATION','atlas=transitions&tw=TW-01','atlas=loss&lossType=LOSS-REGIME-END'];
try{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of (process.argv.includes('--focus')?[]:[360,390,1440]))for(const locale of ['zh-Hans','en'])for(const route of routes){
  await page.setViewportSize({width,height:950});const images=[];const requested=r=>{if(r.url().includes('/images/civilization-atlas/'))images.push(r.url());};page.on('request',requested);
  await page.goto(origin+'/books/reality-differentiation/?'+route+'&locale='+locale+'#atlas');
  await page.waitForSelector('[data-atlas-ready="true"] [data-atlas-static-visuals] > figure');
  const figure=page.locator('[data-atlas-static-visuals] > figure').first();await figure.scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('[data-atlas-static-visuals] > figure')?.dataset.imageState==='ready');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow ${width}/${route}`);
  assert.ok(new Set(images).size<=2,'Only active context visuals should load');page.off('request',requested);
  assert.ok(await page.locator('[data-atlas-structured-visual] svg').count()>0);
  results.push({width,locale,route,render:'PASS',activeImageRequests:new Set(images).size});
  if(process.env.PHIOS_SCREENSHOT_DIR&&locale==='zh-Hans'&&(route.startsWith('atlas=world')||route.startsWith('atlas=cases'))){fs.mkdirSync(process.env.PHIOS_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:process.env.PHIOS_SCREENSHOT_DIR+'/'+route.split('&')[0].split('=')[1]+'-'+width+'.png'});}
  console.log('PASS viewport',width,locale,route);
 }
 await page.setViewportSize({width:360,height:950});
 await page.goto(origin+'/books/reality-differentiation/?atlas=cases&case=CA-T09-01&locale=zh-Hans#atlas');
 await page.waitForSelector('[data-atlas-ready="true"] .civ-visual-library');
 await page.locator('.civ-visual-library summary').click();
 const before=await page.locator('.civ-atlas-ask a').getAttribute('href');
 for(const [family,id] of [['MODERN_FLAG','VIS-CIV-FLAG-08'],['HISTORICAL_FIGURE','VIS-CIV-HF-03'],['GEOGRAPHIC_BASE','VIS-CIV-MAP-01'],['CIVILIZATION_INFRASTRUCTURE','VIS-CIV-INF-01'],['SCALE_SHIFT','VIS-CIV-SS-01'],['WORLD_RECONFIGURATION_SNAPSHOT','WORLD_RECONFIGURATION_SNAPSHOT_1945']]){
  await page.locator('[data-atlas-visual-family]').selectOption(family);await page.locator('[data-atlas-visual-choice]').selectOption(id);
  const image=page.locator('[data-atlas-visual-selection] img');await image.scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('[data-atlas-visual-selection] figure')?.dataset.imageState==='ready');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Supplemental mobile overflow');
  assert.equal(await image.getAttribute('data-asset-id'),id);assert.equal(await page.locator('.civ-atlas-ask a').getAttribute('href'),before,'Illustration browsing must not contaminate Ask context');
  const button=page.locator('[data-atlas-visual-selection] button');assert.equal(await button.isEnabled(),true);await button.focus();await page.keyboard.press(family==='MODERN_FLAG'?'Space':'Enter');await page.locator('.civ-visual-dialog[open]').waitFor();await page.keyboard.press('Escape');await page.locator('.civ-visual-dialog').waitFor({state:'detached'});assert.equal(await button.evaluate(e=>e===document.activeElement),true);
 }
 if(process.argv.includes('--focus')){console.log('PASS focused supplemental keyboard/mobile checks');process.exitCode=0;}
 else {
 // Every verified object is also decoded by the actual browser, through the shared resolver.
 const decode=await page.evaluate(async()=>{
  const {resolveUnifiedPublicVisual}=await import('/assets/js/public-v2/unified-public-visual-resolver.js');
  const {ATLAS_VISUAL_BINDINGS_PATH}=await import('/assets/js/pages/civilization-atlas/atlas-static-visual.js');
  const bindings=await (await fetch(ATLAS_VISUAL_BINDINGS_PATH)).json();let cursor=0;const out=[];
  await Promise.all(Array.from({length:4},async()=>{while(cursor<bindings.assets.length){const a=bindings.assets[cursor++];try{const r=await resolveUnifiedPublicVisual(a.assetId);const image=new Image();image.src=r.src;await image.decode();out.push({assetId:a.assetId,width:image.naturalWidth,height:image.naturalHeight,status:'PASS'});image.src='';}catch(error){out.push({assetId:a.assetId,status:'FAIL',error:String(error)});}}}));return out;
 });
 assert.ok(decode.every(r=>r.status==='PASS'&&r.width>0&&r.height>0));
 await page.route('**/*.r2.dev/**',r=>r.abort());await page.goto(origin+'/books/reality-differentiation/?atlas=world&snapshot=WS-1250&locale=en#atlas');await page.waitForSelector('[data-atlas-ready="true"] [data-atlas-structured-visual] svg');
 assert.ok(await page.locator('[data-atlas-layer-content]').innerText());assert.ok(await page.locator('.civ-atlas-ask a').getAttribute('href'));
 assert.deepEqual(errors,[]);
 fs.writeFileSync('content/civilization-atlas/maintenance/visual-activation-60247ff/browser-results-v1.json',JSON.stringify({status:'PASS',engine:'Microsoft Edge / Playwright',scope:'Local candidate implementation; real R2 and existing Ask links; not production or human acceptance',viewports:results,decodedObjects:decode,supplementalContextIsolation:'PASS',keyboardExpandEscapeFocus:'PASS',forcedImageFailureFallback:'PASS',humanDecision:'PENDING_HUMAN_REVIEW'},null,2)+'\n');
 console.log(`PASS ${results.length} bilingual viewport/layer views; ${decode.length} real WebP decodes through shared resolver; context isolation, keyboard and outage fallback.`);
}
}finally{await browser?.close();await new Promise(r=>server.close(r));}
