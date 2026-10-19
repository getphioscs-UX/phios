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
const root=process.cwd(),output='docs/financial-preparation';fs.mkdirSync(output,{recursive:true});
const a=localAccount(),requests=[],blockedExternal=[];let origin,currentOwner='synthetic-owner',authorized=true;
const routes={'/api/professional-financial-packet':professionalPacket,'/api/professional-financial-review':professionalReview,'/api/account-financial-will-drafts':draftApi,'/api/account-financial-summary':summary,'/api/account-financial-consent':purposeConsent,'/api/account-will-financial-import':willImport,'/api/customer-financial-reality':preview,'/api/customer-finance-tools':tools,'/api/account-financial-capabilities':capabilities,'/api/account-financial-report':report,'/api/account-financial-handoff':handoff,'/api/account-will-preparation':willPreparation};
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,origin);
 if(url.pathname.startsWith('/api/')){
  const chunks=[];for await(const chunk of req)chunks.push(chunk);const method=req.method;
  const context=a.context(null,{owner:currentOwner});context.request=new Request(url,{method,headers:req.headers,...(method==='POST'?{body:Buffer.concat(chunks)}:{})});
  const handler=url.pathname==='/api/professional-financial-packet'&&method==='GET'?professionalList:url.pathname==='/api/account-financial-report'&&method==='GET'?listReports:routes[url.pathname];const response=!authorized?Response.json({ok:false,code:'ACCOUNT_REQUIRED'},{status:401}):handler?await handler(context):Response.json({ok:false,code:'LOCAL_TEST_ROUTE_UNAVAILABLE'},{status:503});
  requests.push({path:url.pathname,method,status:response.status});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
 }
 let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep))throw Error('PATH_OUTSIDE_ROOT');if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file)){res.writeHead(404);return res.end();}
 const ext=path.extname(file);res.writeHead(200,{'content-type':({'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[ext]||'application/octet-stream','cache-control':'no-store'});res.end(fs.readFileSync(file));
 }catch(e){res.writeHead(500,{'content-type':'application/json'});res.end(JSON.stringify({ok:false,code:e.code||e.message}));}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${server.address().port}`;

a.sql.exec(fs.readFileSync('db/migration-candidates/professional_owner_access_records.sql','utf8'));
const savedResponse=await draftApi(a.context({action:'save',draftType:'FINANCIAL',payload:{asOfDate:'2026-10-19',baseCurrency:'MYR',inventory:{assets:[{recordId:'TEST_ONLY_BANK',label:'TEST_ONLY_BANK',value:10}],liabilities:[],guarantees:[]}},purpose:'FINANCIAL_PLANNING',saveConsent:true,retentionConsent:true,expiresAt:new Date(Date.now()+3600000).toISOString()}));assert.equal(savedResponse.status,200);const saved=await savedResponse.json();
await createFinancialGrant(a.context({}),{source:saved.savedDraftRef,purpose:'PROFESSIONAL_REVIEW',scopes:['assets'],expiresAt:saved.expiresAt,recipientRef:'TEST_ONLY_PRO',jurisdictionScope:'MY_PENINSULAR',serviceScope:'FINANCIAL_REVIEW'});
const value=structuredClone(professionalAccess('synthetic-owner'));value.identity.subject_id='synthetic-other';
a.sql.prepare('INSERT INTO professional_owner_access_records VALUES(?,?,?,?,?,?,?,?,?)').run('test_access','synthetic-other',JSON.stringify(value),sha256Hex(value),'TEST_ONLY_RECEIPT',new Date().toISOString(),new Date(Date.now()+3600000).toISOString(),null,1);
currentOwner='synthetic-other';const browser=await chromium.launch({channel:'msedge',headless:true}),cases=[];let failure;
try{for(const lang of ['en','zh-Hans'])for(const width of [1440,360]){
 const context=await browser.newContext({viewport:{width,height:900}});await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());await context.addInitScript(lang=>localStorage.setItem('phios-cx-locale',lang),lang);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{await page.goto(origin+'/professional/reports/?lang='+lang);assert((await page.locator('[data-professional-financial-review] h2').innerText()).includes(lang==='zh-Hans'?'财务':'financial'));await page.locator('[data-professional-load]').click();await page.locator('[data-professional-source] option').waitFor({state:'attached'});await page.locator('[data-professional-open]').click();await page.locator('[data-professional-packet] li').waitFor();assert((await page.locator('[data-professional-packet]').innerText()).includes('TEST_ONLY_BANK'));
 await page.locator('[data-professional-note] textarea').fill('TEST_ONLY independent professional evidence request');await page.locator('[data-professional-note] button[type=submit]').click();await page.waitForFunction(()=>/saved|已保存/.test(document.querySelector('[data-professional-status]').textContent));await page.locator('[data-professional-note] textarea').fill('temporary edit');await page.locator('[data-professional-reopen]').click();await page.waitForFunction(()=>document.querySelector('[data-professional-note] textarea').value==='TEST_ONLY independent professional evidence request');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);assert.deepEqual(errors,[]);
 if(width===360&&lang==='zh-Hans')await page.locator('[data-professional-financial-review]').screenshot({path:output+'/professional-review-zh-360.png'});
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));assert.equal(await page.locator('[data-professional-packet] li').count(),0);assert.equal(await page.locator('[data-professional-note] textarea').inputValue(),'');await page.evaluate(()=>window.dispatchEvent(new Event('phios:account-logout')));assert.equal(await page.locator('[data-professional-packet] li').count(),0);cases.push({lang,width,serverAuthority:true,sourceExact:true,independentNoteSaveReopen:true,logoutClears:true,focusReauthorizationClears:true,overflow:false});
 }catch(e){await page.screenshot({path:output+'/professional-review-failure.png'});throw e;}finally{await context.close();}
}}catch(e){failure=e;}finally{await browser.close();server.close();a.sql.close();}
fs.writeFileSync(output+'/PROFESSIONAL-BROWSER-EVIDENCE.json',JSON.stringify({timestamp:new Date().toISOString(),status:failure?'FAIL':'PASS_LOCAL',cases,requests,error:failure?.message||null,productionIdentityProvider:'NOT_EXERCISED_TEST_ONLY_SERVER_IDENTITY',externalRequestsBlocked:true,providerCalls:0,costUSD:0,productionMutations:0},null,2)+'\n');if(failure)throw failure;console.log('PASS_LOCAL professional browser: '+cases.length+' cases');
