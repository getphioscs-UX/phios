import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {PDFDocument} from 'pdf-lib';
import {ROOT,write} from './lib/bazi-deep-manuscript-review.mjs';
const require=createRequire(import.meta.url);let playwright;try{playwright=require('playwright');}catch{if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw Error('BDM_BROWSER_RUNTIME_REQUIRED');playwright=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));}
const sourceRoot=process.cwd();const server=http.createServer((req,res)=>{if(req.url==='/qa-font.ttf'&&process.env.REPORT_QA_FONT_PATH){res.setHeader('Content-Type','font/ttf');res.end(fs.readFileSync(process.env.REPORT_QA_FONT_PATH));return;}const file=path.resolve(sourceRoot,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(sourceRoot+path.sep)){res.writeHead(403);res.end();return;}try{const bytes=fs.readFileSync(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html; charset=utf-8');res.end(bytes);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const evidence={status:'FAILED',printStatus:'NOT_VERIFIED',pdfStatus:'NOT_VERIFIED',providerCalls:0,fixtureOnly:!process.env.BDM_QA_REVIEW_PATH};let browser;
try{
 browser=await playwright.chromium.launch({headless:true,...(process.env.REPORT_BROWSER_EXECUTABLE?{executablePath:process.env.REPORT_BROWSER_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{} )});
 const context=await browser.newContext({viewport:{width:1280,height:1400}});
 if(process.env.BDM_QA_ASSET_MANIFEST){const assets=JSON.parse(fs.readFileSync(process.env.BDM_QA_ASSET_MANIFEST,'utf8'));assert(assets.every(a=>a.validImage));evidence.assetReceipts=assets;await context.route('https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/**',route=>{const a=assets.find(a=>a.url===route.request().url());return a?route.fulfill({status:200,contentType:a.mime,body:fs.readFileSync(a.path)}):route.continue();});}
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/${process.env.BDM_QA_REVIEW_PATH||'tools/review/BAZI-DEEP-MANUSCRIPT-R2-HUMAN-REVIEW.html'}`,{waitUntil:'networkidle',timeout:60000});if(process.env.REPORT_QA_FONT_PATH){await page.addStyleTag({content:'@font-face{font-family:"Microsoft YaHei";src:url(/qa-font.ttf);font-weight:100 900}'});await page.evaluate(()=>document.fonts.load('16px "Microsoft YaHei"'));evidence.cjkFontLoaded=true;}await page.evaluate(()=>document.fonts.ready);
 evidence.screen=await page.evaluate(async()=>{const {inspectBaziDeepLayout}=await import('/assets/customer-ui/js/personal-products/bazi-deep-manuscript-pages.js');return inspectBaziDeepLayout(document);});
 fs.mkdirSync(ROOT+'browser',{recursive:true});await page.locator('[data-page-number="2"]').screenshot({path:ROOT+'browser/P02-SCREEN.png'});await page.locator('[data-page-number="4"]').screenshot({path:ROOT+'browser/P04-SCREEN.png'});await page.locator('[data-page-number="5"]').screenshot({path:ROOT+'browser/P05-SCREEN.png'});await page.locator('[data-page-number="11"]').screenshot({path:ROOT+'browser/P11-SCREEN.png'});await page.locator('[data-page-number="12"]').screenshot({path:ROOT+'browser/P12-SCREEN.png'});await page.locator('[data-page-number="13"]').screenshot({path:ROOT+'browser/P13-SCREEN.png'});
 await page.emulateMedia({media:'print'});evidence.print=await page.evaluate(async()=>{const {inspectBaziDeepLayout}=await import('/assets/customer-ui/js/personal-products/bazi-deep-manuscript-pages.js');return inspectBaziDeepLayout(document);});
 const pdfPath=process.env.BDM_QA_PDF_PATH||ROOT+'BAZI-DEEP-MANUSCRIPT-R2-TECHNICAL-FIXTURE.pdf';const bytes=await page.pdf({path:pdfPath,printBackground:true,preferCSSPageSize:true});const pdf=await PDFDocument.load(bytes);evidence.pdfPages=pdf.getPageCount();evidence.pdfPath=pdfPath;evidence.consoleErrors=errors;
 evidence.nonwhiteFallback=await page.locator('.bdm-page').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).backgroundColor!=='rgb(255, 255, 255)'));evidence.backgroundPrint=await page.locator('.bdm-page').first().evaluate(n=>getComputedStyle(n).printColorAdjust);
 evidence.status=evidence.screen.browserReady&&evidence.print.browserReady&&evidence.pdfPages===48&&!errors.length&&evidence.nonwhiteFallback?'PASS':'FAILED';evidence.pdfStatus=evidence.pdfPages===48?'PASS_PAGE_COUNT':'FAILED';evidence.printStatus=evidence.print.browserReady?'PASS_GEOMETRY':'FAILED';
 write(process.env.BDM_QA_EVIDENCE_PATH||ROOT+'BROWSER-QA.json',evidence);console.log(JSON.stringify(evidence));assert.equal(evidence.status,'PASS');
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
