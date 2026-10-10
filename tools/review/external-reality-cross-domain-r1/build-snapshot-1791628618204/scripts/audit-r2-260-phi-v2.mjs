import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {buildEcrCanonicalProjectionFromAnchor} from '../functions/embodied-configuration/ecr-canonical-projection-runtime.js';
import {buildAcceptedMethodCustomerResult} from '../functions/customer-projection/method-customer-reading-v2.js';
import {buildPersonalRealityProductRoute} from '../functions/personal-reality-product/product-assembly.js';
import {fixtureInput,reviewEntitlement} from './lib/ecr-full-report-fixture.mjs';
import {createPublicationReviewServer} from './lib/book-publication-review-server.mjs';
import {json,writeJson,evidenceDir} from './lib/r2-260-evidence.mjs';
const probe=json(evidenceDir+'/r2-260-phi-reachability-v2.json');
const outstanding=new Set(Object.keys(probe.witnesses)),selected=[];
while(outstanding.size){const best=probe.cases.map(c=>({...c,gain:c.ids.filter(id=>outstanding.has(id)).length})).sort((a,b)=>b.gain-a.gain)[0];assert.ok(best.gain);selected.push(best);best.ids.forEach(id=>outstanding.delete(id));}
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const server=createPublicationReviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'msedge',headless:true}),views=[];
try{for(const viewport of [390,1440])for(const locale of ['zh-Hans','en']){
 const page=await browser.newPage({viewport:{width:viewport,height:950}});await page.goto(origin+'/perspectives/personal/?locale='+locale,{waitUntil:'domcontentloaded'});
 for(const fixture of selected){
  const projection=await buildEcrCanonicalProjectionFromAnchor({canonicalInput:fixtureInput(locale),anchor:{longitude:fixture.longitude,utcIso:'2000-01-01T04:00:00.000Z',engineCode:'ECR_TEST_ANCHOR',referenceFrame:'TEST_DETERMINISTIC_SOLAR_ANCHOR'},requestId:'R2-260-BROWSER-'+fixture.index});
  const readingMethod=await buildAcceptedMethodCustomerResult({canonicalProjection:projection,locale});
  const route=await buildPersonalRealityProductRoute({selectedKeys:['ecr'],results:[{key:'ecr',ok:true,spec:{methodCode:'EMBODIED_CONFIGURATION'},canonicalProjection:projection,readingMethod}],locale,ecrSharedEntitlement:reviewEntitlement(false)});
  assert.equal(route.primaryProduct?.state,'CUSTOMER_PUBLISHABLE');
  // Existing deterministic QA anchor enters the normal production assembler and renderer.
  // No card IDs, image URLs, forced admission or alternate gallery are injected.
  await page.evaluate(async route=>{const {renderProductRoute}=await import('/assets/customer-ui/js/personal-products/personal-product-renderers.js');document.querySelector('[data-cx-personal-results]').hidden=false;renderProductRoute(route,document.querySelector('[data-cx-specialist-products]'));},route);
  await page.waitForSelector('[data-cx-specialist-products] img[src*="phi-card"]',{timeout:20000,state:'attached'});
  const imgs=page.locator('[data-cx-specialist-products] img[src*="phi-card"]'),evidence=[];
  for(const img of await imgs.all()){await img.evaluate(i=>i.closest('article').scrollIntoView({block:'center'}));await img.evaluate(i=>i.decode());const item=await img.evaluate(i=>{const b=i.getBoundingClientRect();return {resolvedUrl:i.currentSrc||i.src,attached:i.isConnected,visible:i.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}),decoded:i.complete&&i.naturalWidth>0&&i.naturalHeight>0,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,width:b.width,height:b.height,alt:i.alt};});evidence.push({...item,objectKey:decodeURIComponent(new URL(item.resolvedUrl).pathname).slice(1),trigger:'ACCEPTED_CANONICAL_PROJECTION_TO_PRODUCTION_ASSEMBLER_AND_SPECIALIST_RENDERER',selector:'[data-cx-specialist-products] img[src*="phi-card"]'});}
  views.push({route:'/perspectives/personal/',viewport,locale,fixtureIndex:fixture.index,longitude:fixture.longitude,expectedCardIds:fixture.ids,productState:route.primaryProduct.state,evidence});
  writeJson(evidenceDir+'/r2-260-phi-browser-v2.json',{scope:'LOCAL_BROWSER_VERIFIED_WITH_EXISTING_DETERMINISTIC_QA_ANCHOR; normal accepted meaning, production product assembly and approved customer renderer; not live astronomy/API proof',selectedCases:selected,views});console.log('PHI',viewport,locale,fixture.index,evidence.length);
 }await page.close();
}}finally{await browser.close();await new Promise(r=>server.close(r));}

