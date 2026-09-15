import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {previewServer} from './lib/ca-r1-preview-server.mjs';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const server=await previewServer(),browser=await chromium.launch({channel:'msedge',headless:true});
const tests=[];
try{for(const width of [390,1440])for(const locale of ['en','zh-Hans']){
 const page=await browser.newPage({viewport:{width,height:900}});
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===server.origin||u.hostname==='pub-1967bc5812ee4164b19a806fb1427021.r2.dev'?r.continue():r.abort();});
 await page.goto(server.origin+'/articles/book3-article-008?locale='+locale);
 await page.locator('.knowledge-article__header h1').waitFor();
 assert.equal(await page.locator('.cx-shell-header').count(),1);assert.equal(await page.locator('.knowledge-article__hero-visual').count(),1);
 const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,hero:document.querySelector('.knowledge-article__header').getBoundingClientRect().width,heading:document.querySelector('h1').getBoundingClientRect().width,locale:document.documentElement.lang}));
 assert.equal(metrics.overflow,false);assert.ok(metrics.hero>=width*.85);assert.ok(metrics.heading>=width*.4);assert.equal(metrics.locale,locale);
 const title=await page.locator('.knowledge-article__header h1').innerText();
 if(width===390)await page.locator('[data-cx-menu]').click();
 const other=locale==='en'?'zh-Hans':'en';await page.locator(`[data-cx-locale="${other}"]:visible`).first().click();
 await page.waitForFunction(old=>!!document.querySelector('.knowledge-article__header h1')&&document.querySelector('.knowledge-article__header h1').textContent!==old,title);
 assert.equal(await page.locator('html').getAttribute('lang'),other);
 await page.locator('[data-article-slug]:not([aria-busy])').waitFor();
 await page.waitForFunction(()=>{const img=document.querySelector('.knowledge-article__hero-visual img');return img?.complete&&img.naturalWidth>0;});
 assert.equal(await page.locator('.client-visual-masthead').count(),0,'legacy masthead must not duplicate the article hero');
 tests.push({width,locale,status:'PASS',checks:['single current shell','single wide hero','no overflow','live locale rerender'],metrics});
 if(width===1440&&locale==='en')await page.screenshot({path:'docs/qa/customer-activation-r1/article-current-shell-1440.png',fullPage:false});
 await page.close();
}}catch(error){tests.push({status:'FAIL',error:error.message});process.exitCode=1;}finally{await browser.close();await server.close();fs.writeFileSync('docs/qa/customer-activation-r1/article-browser-v1.json',JSON.stringify({environment:'LOCAL_PREVIEW',tests},null,2)+'\n');}
console.log(tests);
