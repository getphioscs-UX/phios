import {pathToFileURL} from 'node:url';import assert from 'node:assert/strict';
import {createPublicationReviewServer} from './lib/book-publication-review-server.mjs';
import {json,evidenceDir,writeJson} from './lib/r2-260-evidence.mjs';
import {TAROT_PRODUCTION_AUTHORITY_PATHS} from '../functions/api/symbolic-method-execute.js';
import {executeTarotProductRuntime} from '../functions/tarot-product-runtime/tarot-product-runtime.js';
const authorities=Object.fromEntries(Object.entries(TAROT_PRODUCTION_AUTHORITY_PATHS).map(([name,path])=>[name,json('.'+path)]));
const delivery=json('content/public-ux/symbolic-method/registries/tarot-r2-asset-delivery-registry-v1.json');
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const server=createPublicationReviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;let browser;const observations=[],runs=[];
try{browser=await chromium.launch({channel:'msedge',headless:true});
 for(const viewport of [390,1440])for(const locale of ['zh-Hans','en']){
  const page=await browser.newPage({viewport:{width:viewport,height:950},reducedMotion:'reduce'});const errors=[],executions=[];page.on('pageerror',e=>errors.push(e.message));
  // Test-only transport seam: status/context authorize local execution, while
  // the actual governed runtime resolves selected card IDs and artwork URLs.
  for(const endpoint of ['symbolic-method-context','tarot-production-status'])await page.route('**/api/'+endpoint+'*',r=>r.fulfill({json:{ok:true,production:{runAllowed:true},currentRealityAvailable:false}}));
  await page.route('**/api/symbolic-method-execute',async route=>{try{const input=route.request().postDataJSON(),result=await executeTarotProductRuntime(input,authorities);executions.push({selectedCardIds:input.selectedCardIds,spreadId:input.spreadId,runtimeVersion:result.runtimeVersion,sessionId:result.selectionEvidence.sessionId});await route.fulfill({json:result});}catch(e){executions.push({error:String(e)});await route.fulfill({status:400,json:{ok:false,error:{code:e.message}}});}});
  await page.goto(origin+'/perspectives/tarot/?locale='+locale);await page.locator('[data-spread="THREE_CARD_SITUATION"]').waitFor();
  await page.locator('[data-symbolic-question]').fill(locale==='en'?'What should I understand about my current work situation?':'关于目前的工作处境，我需要看清什么？');
  await page.locator('[data-spread="THREE_CARD_SITUATION"]').click();await page.locator('[data-start-draw]').click();console.log('TAROT actual 120-second shuffle',viewport,locale);await page.locator('[data-card-id]').first().waitFor({timeout:135000});
  const back=page.locator('.cx-tarot-card-back').first();await back.scrollIntoViewIfNeeded();
  const bg=await back.evaluate(async e=>{const s=getComputedStyle(e),b=e.getBoundingClientRect(),url=s.backgroundImage.match(/url\(["']?([^"')]+)/)?.[1];const image=new Image();image.src=url;await image.decode();return {resolvedUrl:url,backgroundImage:s.backgroundImage,attached:e.isConnected,visible:e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}),width:b.width,height:b.height,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,decoded:true,resourceLoaded:performance.getEntriesByName(url).length>0};});
  assert.equal(bg.resolvedUrl,delivery.cardBack.url);observations.push({...bg,objectKey:new URL(bg.resolvedUrl).pathname.slice(1),route:'/perspectives/tarot/',viewport,locale,selector:'.cx-tarot-card-back__art',trigger:'QUESTION → SPREAD → SHUFFLE → FACEDOWN_SELECTION',evidenceClass:'CUSTOMER_CSS_BACKGROUND'});
  let previous=[];
  for(let start=0;start<delivery.cards.length;start+=3){const cards=delivery.cards.slice(start,start+3);for(const id of previous)await page.locator(`[data-card-id="${id}"]`).click();for(const card of cards)await page.locator(`[data-card-id="${card.cardId}"]`).click();
   await page.locator('[data-symbolic-execute]').click();await page.waitForFunction(url=>document.querySelector('[data-draw-display] img')?.src===url,cards[0].url);
   for(const card of cards){const img=page.locator('[data-draw-display] img').filter({hasNot:page.locator('nonexistent')}).nth(cards.indexOf(card));await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());
    const record=await img.evaluate(i=>{const b=i.getBoundingClientRect();return {resolvedUrl:i.currentSrc||i.src,attached:i.isConnected,visible:i.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}),decoded:i.complete&&i.naturalWidth>0&&i.naturalHeight>0,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,width:b.width,height:b.height};});assert.equal(record.resolvedUrl,card.url);assert.ok(record.visible&&record.decoded&&record.width>0&&record.height>0);
    observations.push({...record,objectKey:new URL(card.url).pathname.slice(1),route:'/perspectives/tarot/',viewport,locale,selector:'[data-draw-display] img',trigger:'QUESTION → THREE_CARD_SITUATION → SHUFFLE → SELECT/REPLACE '+cards.map(c=>c.cardId).join(',')+' → READING',evidenceClass:'CUSTOMER_INTERACTION',cardId:card.cardId,execution:executions.at(-1)});
   }previous=cards.map(c=>c.cardId);console.log('TAROT',viewport,locale,start+3);
  }
  assert.deepEqual(errors,[]);runs.push({viewport,locale,executions:executions.length,errors,lang:await page.getAttribute('html','lang')});await page.close();writeJson(evidenceDir+'/r2-260-tarot-browser-v2.json',{scope:'LOCAL_BROWSER_VERIFIED; actual /perspectives/tarot/ UI with test-only authority status transport; production selection, interpretation, resolver and customer renderer; no URLs injected into UI',observations,runs});
 }
}finally{await browser?.close();await new Promise(r=>server.close(r));}
