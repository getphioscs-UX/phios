import {runFinancialReportJob} from '../functions/financial/holistic-planning-product/factual-report-job.js';
import {FINANCIAL_REPORT_SCOPES} from '../functions/professional/consent/financial-purpose-grants.js';
import {onRequestGet as professionalList,onRequestPost as professionalPacket} from '../functions/api/professional-financial-packet.js';
import {onRequestPost as professionalReview} from '../functions/api/professional-financial-review.js';
import {professionalAccess} from '../tests/financial-preparation/professional-owner-fixture.mjs';
import {sha256Hex} from '../functions/document-assembly/digest.js';
import {createFinancialGrant} from '../functions/professional/consent/financial-purpose-grants.js';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {localAccount} from '../tests/financial-preparation/local-account.mjs';
import {draftApi} from '../functions/account/financial-will-draft-store.js';
import {onRequestPost as summary} from '../functions/api/account-financial-summary.js';
import {onRequestPost as purposeConsent} from '../functions/api/account-financial-consent.js';
import {onRequestPost as willImport} from '../functions/api/account-will-financial-import.js';
import {onRequestPost as preview} from '../functions/api/customer-financial-reality.js';
import {onRequestPost as tools} from '../functions/api/customer-finance-tools.js';
import {onRequestPost as capabilities} from '../functions/api/account-financial-capabilities.js';
import {onRequestPost as report} from '../functions/api/account-financial-report.js';
import {onRequestGet as listReports} from '../functions/api/account-financial-report.js';
import {onRequestPost as handoff} from '../functions/api/account-financial-handoff.js';
import {onRequestPost as willPreparation} from '../functions/api/account-will-preparation.js';
const module=process.env.PHIOS_PLAYWRIGHT_MODULE||'C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const {chromium}=await import(pathToFileURL(module));
const root=process.cwd(),output='docs/financial-preparation/successor-r2/local-closure';fs.mkdirSync(output,{recursive:true});
const a=localAccount(),requests=[],blockedExternal=[];let delayNext=false,releaseDelayed=null,notifyDelayed=null;let origin,currentOwner='synthetic-owner',authorized=true;
const routes={'/api/professional-financial-packet':professionalPacket,'/api/professional-financial-review':professionalReview,'/api/account-financial-will-drafts':draftApi,'/api/account-financial-summary':summary,'/api/account-financial-consent':purposeConsent,'/api/account-will-financial-import':willImport,'/api/customer-financial-reality':preview,'/api/customer-finance-tools':tools,'/api/account-financial-capabilities':capabilities,'/api/account-financial-report':report,'/api/account-financial-handoff':handoff,'/api/account-will-preparation':willPreparation};
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,origin);
 if(url.pathname.startsWith('/api/')){
  const chunks=[];for await(const chunk of req)chunks.push(chunk);const method=req.method;
  const context=a.context(null,{owner:currentOwner});context.request=new Request(url,{method,headers:req.headers,...(method==='POST'?{body:Buffer.concat(chunks)}:{})});
  const handler=url.pathname==='/api/professional-financial-packet'&&method==='GET'?professionalList:url.pathname==='/api/account-financial-report'&&method==='GET'?listReports:routes[url.pathname];if(url.pathname==='/api/professional-financial-packet'&&method==='POST'&&delayNext){delayNext=false;notifyDelayed?.();await new Promise(resolve=>releaseDelayed=resolve);releaseDelayed=null;}const response=!authorized?Response.json({ok:false,code:'ACCOUNT_REQUIRED'},{status:401}):handler?await handler(context):Response.json({ok:false,code:'LOCAL_TEST_ROUTE_UNAVAILABLE'},{status:503});
  requests.push({path:url.pathname,method,status:response.status});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
 }
 let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep))throw Error('PATH_OUTSIDE_ROOT');if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file)){res.writeHead(404);return res.end();}
 const ext=path.extname(file);res.writeHead(200,{'content-type':({'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[ext]||'application/octet-stream','cache-control':'no-store'});res.end(fs.readFileSync(file));
 }catch(e){res.writeHead(500,{'content-type':'application/json'});res.end(JSON.stringify({ok:false,code:e.code||e.message}));}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${server.address().port}`;

a.sql.exec(fs.readFileSync('db/migration-candidates/professional_owner_access_records.sql','utf8'));
const inventory=Object.fromEntries(['people','assets','liabilities','incomeStreams','expenses','guarantees','policies','goals','assumptions'].map(k=>[k,[]]));
inventory.assets=[{recordId:'bank',label:'Customer custom name',type:'BANK_ACCOUNT',value:100,representation:'EXACT',ownershipMode:'SOLE',currency:'MYR'}];
const saved=await(await draftApi(a.context({action:'save',draftType:'FINANCIAL',payload:{asOfDate:'2026-10-19',baseCurrency:'MYR',inventory},purpose:'FINANCIAL_PLANNING',saveConsent:true,retentionConsent:true,expiresAt:new Date(Date.now()+3600000).toISOString()}))).json();assert(saved.ok);
const grant=await createFinancialGrant(a.context({}),{source:saved.savedDraftRef,purpose:'REPORT',scopes:FINANCIAL_REPORT_SCOPES,expiresAt:saved.expiresAt,language:'en'});
const job=await runFinancialReportJob(a.context({}),{savedDraftRef:saved.savedDraftRef,grantId:grant.grantId,language:'en'},{synthetic:true});assert.equal(job.state,'ACCOUNT_AVAILABLE');
const value=structuredClone(professionalAccess('synthetic-owner'));value.identity.subject_id='synthetic-other';
a.sql.prepare('INSERT INTO professional_owner_access_records VALUES(?,?,?,?,?,?,?,?,?)').run('test_access','synthetic-other',JSON.stringify(value),sha256Hex(value),'TEST_ONLY_RECEIPT',new Date().toISOString(),saved.expiresAt,null,1);
const browser=await chromium.launch({channel:'msedge',headless:true}),cases=[];let failure;
try{for(const [lang,width] of [['en',1440],['zh-Hans',360]]){
 currentOwner='synthetic-owner';const context=await browser.newContext({viewport:{width,height:900}});await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());await context.addInitScript(lang=>localStorage.setItem('phios-cx-locale',lang),lang);const page=await context.newPage();
 try{
 await page.goto(origin+'/professional/financial/?lang='+lang);
 // The current customer component is mounted with a real, saved synthetic source;
 // form save/reopen evidence is unchanged and reused from the prior campaign.
 await page.evaluate(async source=>{const {installCustomerPreparationPacket}=await import('/assets/customer-ui/js/surfaces/customer-preparation-packet.js');const host=document.createElement('section');host.id='closure-packet';host.innerHTML='<button data-finance-packet>Preview</button><div data-finance-packet-result></div>';document.querySelector('main').append(host);installCustomerPreparationPacket(host,()=>source,async fn=>{try{await fn();}catch(e){host.dataset.error=e.code||e.message;}});},saved.savedDraftRef);
 await page.evaluate(async()=>{const {renderPreparationPackage,installPreparationReport}=await import('/assets/customer-ui/js/surfaces/financial-preparation-package.js');const test=document.createElement('section');test.id='closure-display';test.innerHTML=renderPreparationPackage({source:{version:1},sections:{position:{source:{version:1},missing:[],data:{currency:'MYR',metrics:{monthlyExpenses:null,liquidityMonths:2,debtServiceRatio:0.2},typedMetrics:{monthlyExpenses:{value:{kind:'UNKNOWN',reason:'DEBT_EXPENSE_LIABILITY_LINK_REQUIRED'}}}}}}});document.querySelector('main').append(test);installPreparationReport(test,{},()=>{});});await page.locator('#closure-display [data-preparation-field]').click();assert.equal(await page.locator('[data-inventory-group="expenses"]').isVisible(),true);assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-inventory-add')||document.activeElement.dataset.inventoryField==='relatedLiabilityRefs'),true);
 const host=page.locator('#closure-packet');await host.locator('[data-finance-packet]').click();await host.locator('[data-complete-preparation]').waitFor();assert.equal(await host.locator('[data-preparation-section]').count(),9);assert.equal(await host.locator('[data-preparation-report-open]').count(),0);
 await host.locator('[data-packet-load-reports]').click();await host.locator('[data-packet-report] option[value="0"]').waitFor({state:'attached'});await host.locator('[data-packet-report]').selectOption('0');
 const previewResponse=page.waitForResponse(r=>r.url().endsWith('/api/account-financial-handoff'));await host.locator('[data-finance-packet]').click();const preview=await(await previewResponse).json();assert(preview.ok);const reportRef=preview.packet.preparation.sections.sources.data.reportRef;assert.deepEqual(Object.keys(reportRef).sort(),['grantId','jobId','language','savedDraftRef']);assert.equal(reportRef.jobId,job.jobId);
 await host.locator('[data-preparation-report-open]').click();await host.frameLocator('[data-preparation-report-view] iframe').locator('section').first().waitFor();assert.equal(await host.frameLocator('[data-preparation-report-view] iframe').locator('section').count(),12);
 assert.equal(await host.locator('[data-preparation-report-view] iframe').getAttribute('sandbox'),'allow-same-origin allow-modals');await host.locator('[data-preparation-section="sources"]').screenshot({path:output+'/report-'+lang+'-'+width+'.png'});
 const html=await host.locator('[data-preparation-report-view] iframe').getAttribute('srcdoc');assert.equal(sha256Hex(html),preview.packet.preparation.sections.sources.data.reportContentDigest);
 await host.locator('details summary').click();await host.locator('[data-packet-recipient]').fill('TEST_ONLY_PRO');await host.locator('[data-packet-service]').fill('FINANCIAL_REVIEW');await host.locator('[data-packet-jurisdiction]').fill('MY_PENINSULAR');await host.locator('[data-packet-expiry]').fill(saved.expiresAt.slice(0,10));
 await host.locator('[data-finance-packet]').click();await host.locator('[data-preparation-report-open]').waitFor();await host.locator('[data-packet-share-confirm]').check();const shareResponse=page.waitForResponse(r=>r.url().endsWith('/api/account-financial-consent'));await host.locator('[data-packet-share]').click();const share=await(await shareResponse).json();assert(share.ok,JSON.stringify(share));
 currentOwner='synthetic-other';const pro=await context.newPage();await pro.goto(origin+'/professional/reports/?lang='+lang);await pro.locator('[data-professional-load]').click();await pro.locator('[data-professional-source] option').first().waitFor({state:'attached'});const options=await pro.locator('[data-professional-source] option').count();await pro.locator('[data-professional-source]').selectOption(String(options-1));await pro.locator('[data-professional-open]').click();await pro.locator('[data-preparation-report-open]').waitFor();await pro.locator('[data-preparation-report-open]').click();await pro.frameLocator('[data-preparation-report-view] iframe').locator('section').first().waitFor();assert.equal(sha256Hex(await pro.locator('[data-preparation-report-view] iframe').getAttribute('srcdoc')),sha256Hex(html));
 currentOwner='synthetic-owner';const revoked=await purposeConsent(a.context({action:'revoke',grantId:share.grant.grantId}));assert.equal(revoked.status,200);currentOwner='synthetic-other';await pro.locator('[data-preparation-report-open]').click();await pro.waitForFunction(()=>document.querySelector('[data-preparation-report-view]')?.querySelectorAll('iframe').length===0);assert(requests.some(r=>r.path==='/api/professional-financial-packet'&&r.status===403));
 assert.equal(await pro.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
 cases.push({lang,width,listSelectPreviewRead:true,selectorFourFields:true,sameHtmlDigest:sha256Hex(html),explicitSharing:true,professionalRead:true,revokedNewReadDenied:true,noReportUsable:true,providerCallsOnReopen:0});await pro.close();
 }catch(e){await page.screenshot({path:output+'/failure-'+lang+'.png'});throw e;}finally{await context.close();}
}}catch(e){failure=e;}finally{await browser.close();server.close();a.sql.close();}
fs.writeFileSync(output+'/REPORT-READ-BROWSER.json',JSON.stringify({status:failure?'FAIL':'PASS_LOCAL',timestamp:new Date().toISOString(),cases,requests,error:failure?.message,providerCalls:0,costUSD:0,externalSends:0,productionMutations:0},null,2)+'\n');if(failure)throw failure;console.log('PASS report selection / controlled customer and professional reading / revocation: '+cases.length);

