import fs from 'node:fs';import assert from 'node:assert/strict';import http from 'node:http';
import {verifyBaziPublication,settleBaziReportImages} from '../workers/method-report-renderer/bazi-verification.js';
import {loadWorldPlaywright,worldBrowserLaunchOptions} from './lib/world-browser-runtime.mjs';
const dir='content/production-closure/live-customer-commercial-convergence/bazi-r2-p7/',publication=JSON.parse(fs.readFileSync(dir+'p7r3f-targeted/RENDERER-INPUT-PUBLICATION.json','utf8')),tests={};
let browser,server;
try{
 server=http.createServer((req,res)=>{if(req.url==='/invalid.webp'){res.writeHead(404,{'Content-Type':'text/plain'}).end('missing');}else{res.writeHead(200,{'Content-Type':'image/webp'}).end('invalid image bytes');}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 browser=await loadWorldPlaywright().chromium.launch(worldBrowserLaunchOptions());
 for(const kind of ['A','B','C']){
  const page=await browser.newPage(),responses=[],failures=[];await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());page.on('response',r=>responses.push({url:r.url(),status:r.status()}));page.on('requestfailed',r=>failures.push({url:r.url(),failure:r.failure()}));
  const adapter={async launch(){return {async newPage(){return {on(){},setViewport:v=>page.setViewportSize(v),setRequestInterception:async()=>{},async setContent(){await page.setContent(kind==='C'?'<img id="pending">':`<img src="${origin}/${kind==='A'?'invalid':'corrupt'}.webp">`,{waitUntil:'load'});if(kind==='C')await page.evaluate(()=>{const image=document.querySelector('img');Object.defineProperty(image,'complete',{get:()=>false});image.decode=()=>new Promise(()=>{});});},evaluate(fn,arg){return page.evaluate(fn,fn.name==='settleBaziReportImages'?{timeoutMs:200}:arg);},emulateMediaType:()=>{throw Error('NEGATIVE_MUST_STOP_BEFORE_PRINT');},pdf:()=>{throw Error('NEGATIVE_MUST_STOP_BEFORE_PDF');}};},async close(){await page.close();}};}};
  const response=await verifyBaziPublication(publication,{BROWSER:null},adapter),result=await response.json();assert.equal(response.status,422);assert.equal(result.verification.passed,false);assert.equal(result.verification.assetSettle.status,'FAIL');
  if(kind==='C')assert(result.verification.assetSettle.timedOut);else assert(result.verification.assetSettle.decodeFailures.length>0);
  tests[kind]={status:'PASS',rendererStatus:response.status,assetSettle:result.verification.assetSettle,httpResponses:responses,requestFailures:failures,fixture:kind==='C'?'Unresolved browser image state; bounded settle timeout 200ms':'Actual browser terminal response and native decode failure'};
 }
 fs.writeFileSync(dir+'P7R3G-NEGATIVE-ASSET-TESTS.json',JSON.stringify({status:'PASS_LOCAL',tests,providerCalls:0,providerCostUSD:0,providerNetworkCalls:0,arbitrarySleepUsed:false},null,2)+'\n');console.log('P7R3G A invalid source, B HTTP 200 invalid image decode, C bounded timeout: all renderer 422 PASS_LOCAL.');
}finally{await browser?.close();if(server)await new Promise(r=>server.close(r));}
