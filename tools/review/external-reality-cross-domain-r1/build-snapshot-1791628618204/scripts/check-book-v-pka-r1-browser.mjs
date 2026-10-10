import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createPublicationReviewServer} from './lib/book-publication-review-server.mjs';
const {chromium}=await import(process.env.PHIOS_PLAYWRIGHT_MODULE?pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href:'playwright');
const server=createPublicationReviewServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`,results=[];
let browser;
try{
 browser=await chromium.launch({channel:process.env.PHIOS_BROWSER_CHANNEL||'msedge',headless:true});
 const page=await browser.newPage(),bodyRequests=[],errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',r=>{if(r.url().includes('book5-publication-v1/visual-articles/'))bodyRequests.push(r.url());});
 for(const width of [360,390,1440])for(const locale of ['zh-Hans','en']){
  await page.setViewportSize({width,height:950});bodyRequests.length=0;
  await page.goto(origin+'/articles/book5-song-china?locale='+locale);
  await page.waitForSelector('.knowledge-article__header h1');
  await page.waitForFunction(locale=>document.documentElement.lang===locale,locale);
  await page.waitForFunction(()=>document.querySelector('.knowledge-article__header h1')?.textContent.includes(document.documentElement.lang==='en'?'Song':'宋代'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow ${width}/${locale}`);
  assert.ok(bodyRequests.every(url=>url.includes('/book5-song-china.json')),'Only active Book V body fetched');
  assert.equal(await page.locator('.knowledge-article__body p').count(),4);
  const source=page.locator('.knowledge-article__source-reading');await source.locator('summary').click();await source.locator('h3').first().waitFor();assert.ok(await source.locator('p').count()>5);
  await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');
  const hero=page.locator('.knowledge-resolved-visual').first();
  await page.waitForFunction(()=>['ready','unavailable'].includes(document.querySelector('.knowledge-resolved-visual')?.dataset.assetStatus));
  const imageState=await hero.getAttribute('data-asset-status');
  if(imageState==='ready'){
   const expand=hero.locator('button');await expand.focus();await page.keyboard.press('Enter');await page.locator('.knowledge-visual-dialog[open]').waitFor();await page.keyboard.press('Escape');await page.locator('.knowledge-visual-dialog').waitFor({state:'detached'});assert.equal(await expand.evaluate(e=>document.activeElement===e),true);
  }
  const askHref=await page.locator('[data-cka-contextual-entry="ARTICLE"]').getAttribute('href');assert.ok(askHref.includes('ARTICLE%3Abook5-song-china'));
  results.push({surface:'ARTICLE',width,locale,overflow:false,sourceReading:'PASS',imageState,keyboard:imageState==='ready'?'ENTER_ESCAPE_FOCUS_RETURN_PASS':'EXPAND_NOT_AVAILABLE'});
  if(process.env.PHIOS_SCREENSHOT_DIR){fs.mkdirSync(process.env.PHIOS_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.PHIOS_SCREENSHOT_DIR,`book5-article-${locale}-${width}.png`),fullPage:false});}
 }
 await page.setViewportSize({width:390,height:950});
 await page.goto(origin+'/books/reality-differentiation/?locale=zh-Hans');
 await page.waitForFunction(()=>document.querySelectorAll('#book-parts ol a').length===42);
 assert.equal(await page.locator('#book-parts h3').count(),11);
 const bookAsk=await page.locator('[data-cka-contextual-entry="BOOK"]').getAttribute('href');assert.ok(bookAsk.includes('BOOK%3ABOOK-5'));
 assert.equal(await page.locator('#atlas').count(),1);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'book mobile overflow');
 assert.equal(await page.locator('#book-manuscript a').count(),126);
 await page.locator('#book-manuscript summary').first().click();await page.locator('#book-manuscript a').first().click();
 await page.waitForSelector('#manuscript[open] #manuscript-page-3');
 await page.waitForFunction(()=>{const top=document.querySelector('#manuscript-page-3')?.getBoundingClientRect().top;return top>=0&&top<200;});
 await page.goto(origin+'/books/reality-differentiation/?atlas=cases&case=CA-T09-01&locale=zh-Hans#atlas');
 await page.waitForSelector('[data-atlas-article-reading] a[href*="book5-song-china"]');
 await page.locator('[data-atlas-article-reading] a[href*="book5-song-china"]').click();await page.waitForSelector('.knowledge-article__header h1');
 await page.goBack();await page.waitForSelector('[data-atlas-article-reading] a[href*="book5-song-china"]');assert.ok(page.url().includes('case=CA-T09-01'));
 await page.goto(origin+'/articles/?locale=zh-Hans');await page.waitForSelector('select[name="volume"] option[value="5"]',{state:'attached'});await page.locator('select[name="volume"]').selectOption('5');
 assert.equal(await page.locator('[data-cx-article-grid] .cx-knowledge-article-card').count(),42);
 await page.goto(origin+'/search/?q='+encodeURIComponent('宋代')+'&locale=zh-Hans');await page.waitForSelector('.cx-knowledge-result a[href="/articles/book5-song-china"]');
 await page.goto(origin+'/search/?q=1250&type=atlas&locale=en');await page.waitForSelector('.cx-knowledge-result a[href*="snapshot=WS-1250"]');
 await page.goto(origin+bookAsk);await page.waitForSelector('[data-cx-seeded-context][data-context-ref="BOOK:BOOK-5"]:not([disabled])',{state:'attached'});
 await page.locator('[name="question"]').fill('为什么蒙古帝国分裂以后，欧亚连接反而加强？');await page.locator('[data-cx-contextual-ask-form] [type="submit"]').click();await page.waitForFunction(()=>document.querySelector('[data-cx-answer-text]')?.textContent.includes('帝国'));
 await page.waitForSelector('[data-cx-related-knowledge] a[href*="book5-mongol-connections"]');
 results.push({surface:'BOOK_SEARCH_ASK',contents:42,parts:11,manuscriptSections:126,manuscriptPageDeepLink:'PASS',articleIndex:42,atlasArticleHistory:'PASS',bookContext:'BOOK:BOOK-5',searchArticle:'PASS',searchSnapshot:'PASS',actualApiAnswer:'PASS_LOCAL_DETERMINISTIC'});
 await page.goto(origin+'/articles/book5-river-civilizations?locale=en');const inline=page.locator('.knowledge-block--figure img').first();await inline.scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.knowledge-block--figure img')?.naturalWidth>0);
 assert.equal(await inline.getAttribute('loading'),'lazy');assert.equal(await inline.getAttribute('decoding'),'async');
 const inlineButton=page.locator('.knowledge-block--figure button').first();await inlineButton.focus();await page.keyboard.press('Space');await page.locator('.knowledge-visual-dialog[open]').waitFor();await page.keyboard.press('Escape');await page.locator('.knowledge-visual-dialog').waitFor({state:'detached'});
 results.push({surface:'INLINE_R2',realImage:'PASS',keyboardSpaceEscape:'PASS',loading:'lazy',decoding:'async'});
 // Forced failure must retain article text, source reading and Atlas controls.
 await page.route('**/*.r2.dev/**',route=>route.abort());
 await page.goto(origin+'/articles/book5-river-civilizations?locale=en');await page.waitForSelector('.knowledge-article__body');await page.waitForFunction(()=>document.querySelector('.knowledge-resolved-visual')?.dataset.assetStatus==='unavailable');
 assert.ok(await page.locator('.knowledge-article__body p').count()>=4);
 assert.ok(await page.locator('.knowledge-exit-grid a[href*="case="]').count()>0);
 results.push({surface:'VISUAL_FAILURE',structuredFallback:'PASS'});
 assert.deepEqual(errors,[],'Uncaught browser errors');
 fs.writeFileSync('content/books/book-5/maintenance/browser-review-v1.json',JSON.stringify({status:'PASS',engine:'Microsoft Edge / Playwright',scope:'Local current working tree. Real R2 requested where available; forced outage tested. Live LLM answers not tested.',results,humanDecision:'PENDING_HUMAN_REVIEW'},null,2)+'\n');
 console.log('PASS real browser: 360/390/1440px bilingual articles, manuscript expansion, available visual expand/Escape/focus return, 11-part Book index, Article/Atlas search, Book Ask context and image failure fallback.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
