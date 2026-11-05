import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {composeAstCustomerPublicationR31,composeHdCustomerPublicationR31,renderCustomerReadingR31,assertCustomerReadableProjection,requireCustomerManuscriptReadyR31,compileBaziCustomerPublicationR31} from '../../../functions/report-delivery/customer-publication-composer-r31.js';
import {compileEcrCustomerSuccessorR31} from '../../../functions/report-delivery/customer-manuscript-contract-r31.js';
import {loadWorldPlaywright,worldBrowserLaunchOptions} from '../../../scripts/lib/world-browser-runtime.mjs';
const root=process.env.PHIOS_R31_QA_RUN;if(!root?.replaceAll('\\','/').startsWith('D:/PHIOS/QA-TEMP/SIX-METHOD-R2/'))throw Error('D_QA_RUN_REQUIRED');
const frozen='D:/PHIOS/QA-TEMP/SIX-METHOD-R2/r3-native-delivery-1793760849772',read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const issued=read(frozen+'/ISSUED.json'),preserved=issued.map(r=>{const p=frozen+'/'+r.method+'-SYNTHETIC-DELIVERY.pdf',b=fs.readFileSync(p);assert.equal(sha(b),r.pdfSHA256);return {method:r.method,path:p,sha256:sha(b),orderId:r.orderId,jobId:r.jobId,output:r.output};});
let networkCalls=0;globalThis.fetch=async()=>{networkCalls++;throw Error('R31_ZERO_NETWORK');};
const loadNative=m=>{const j=issued.find(r=>r.method===m),key='native-qa-r3/'+j.jobId+'/native';return read(frozen+'/persistent/objects/'+sha(key)+'.object');};
const rows=[];let browser;
try{
 for(const [method,compose] of [['AST',composeAstCustomerPublicationR31],['HD',composeHdCustomerPublicationR31]]){
  const p=await compose(loadNative(method));assert.equal(p.customerPublishable,false);assert.equal(p.fullCustomerManuscriptReady,false);assert.throws(()=>requireCustomerManuscriptReadyR31(p),/CUSTOMER_FULL_MANUSCRIPT_SOURCE_INCOMPLETE/);
  const html=renderCustomerReadingR31(p);assert(!/SYNTHETIC|schemaVersion|jobId|Digest|ASPECT_\d+|EDITORIAL-HD-|未准入|模拟章节/i.test(html));
  fs.writeFileSync(root+'/'+method+'-CUSTOMER-READING-REVIEW.html',html);fs.writeFileSync(root+'/'+method+'-COMPOSER-SOURCE.json',JSON.stringify(p,null,2));
  if(!browser)browser=await loadWorldPlaywright().chromium.launch(worldBrowserLaunchOptions());const page=await browser.newPage();await page.route('**/*',r=>r.request().url().startsWith('data:')?r.continue():r.abort());await page.emulateMedia({media:'print'});await page.setContent(html,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
  const bytes=await page.pdf({preferCSSPageSize:true,printBackground:true,tagged:true,outline:true});const pdfPath=root+'/'+method+'-CUSTOMER-READING-REVIEW.pdf';fs.writeFileSync(pdfPath,bytes);await page.close();rows.push({method,status:'READABLE_NATIVE_PROSE_PUBLICATION_PROJECTION_PASS_NOT_FULL_REPORT',pdfPath,pdfBytes:bytes.length,pdfSHA256:sha(bytes),sourceDigest:p.sourceDigest,publicationDigest:p.digest,sections:p.coverage,paragraphs:p.sections.reduce((n,s)=>n+s.paragraphs.length,0),missing:p.missingSections,fullCustomerManuscriptReady:false,publicationAccepted:false});
 }
 assert.throws(()=>assertCustomerReadableProjection({sections:[{paragraphs:[{en:'schemaVersion: private engine', 'zh-Hans':'原始 JSON'}]}]}),/ENGINEERING_CONTENT_FORBIDDEN/);
 await assert.rejects(()=>compileBaziCustomerPublicationR31({snapshot:{fixture:true,model:'SYNTHETIC'},pack:loadNative('BZR').pack,job:issued.find(r=>r.method==='BZR')}),/BZR_CUSTOMER_MANUSCRIPT_SOURCE_REQUIRED/);
 await assert.rejects(()=>compileEcrCustomerSuccessorR31({job:issued.find(r=>r.method==='ECR'),source:read(frozen+'/ECR-PUBLICATION.json'),nativeConfiguration:loadNative('ECR').configuration}),/CUSTOMER_MANUSCRIPT_TRUSTED_HANDOFF_REQUIRED/);
 for(const p of preserved)assert.equal(sha(fs.readFileSync(p.path)),p.sha256);assert.equal(networkCalls,0);
 fs.writeFileSync(root+'/PUBLICATION-RESULT.json',JSON.stringify({status:'ACTUAL_NATIVE_READABLE_PROSE_ASSEMBLED_FULL_SOURCE_GATES_REMAIN',rows,preservedR3:preserved,lifecycleRerun:false,syntheticPdfRerendered:false,baziCompiler:'EXISTING_48_PAGE_COMPILER_CONNECTED; MISSING_SAME_SUBJECT_REAL_MANUSCRIPT_FAILS_CLOSED',ecrSuccessor:'NEW_TEN_CHAPTER_SOURCE_CONTRACT; R3_FIXTURE_REJECTED_NOT_HUMAN_ACCEPTED',providerCalls:0,usd:0,networkCalls},null,2));console.log(JSON.stringify({root,rows,providerCalls:0,usd:0}));
}finally{if(browser)await browser.close();}
