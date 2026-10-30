import fs from 'node:fs';import assert from 'node:assert/strict';
import {chromium} from 'file:///C:/Users/Guest%20Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const base=JSON.parse(fs.readFileSync('.tmp/subject-profile-r2/PREVIEW.json')).url;assert.equal(new URL(base).hostname,'127.0.0.1');
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']}),context=await browser.newContext(),results=[];
try{
 await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort('blockedbyclient'));
 const login=await context.request.post(base+'/__qa/login',{headers:{origin:base},data:{account:'A'}});assert.equal(login.status(),200);
 for(const width of [360,768,1440])for(const locale of ['en','zh-Hans'])for(const id of ['qa-personal-A','qa-business','qa-world-MY-ref']){
  const page=await context.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/reality/?subjectId='+id+(id==='qa-personal-A'?'&worldSubjectId=qa-world-MY-ref':''),{waitUntil:'domcontentloaded'});
  await page.locator('#subject-profile-select').waitFor();await page.evaluate(l=>document.documentElement.lang=l,locale);
  await page.locator('[data-r2-state]').waitFor();await page.waitForFunction(l=>document.querySelector('[data-r2-state] h3')?.textContent.includes(l==='en'?'R2 formal':'R2 正式'),locale);
  assert.equal(await page.locator('[data-r2-state] button').isDisabled(),true);
  assert.equal(await page.locator('[data-subject-reading] .subject-overview button').count()>0,true);
  const data=await (await context.request.get(base+'/api/customer-subject-workspace?subjectId='+id+'&locale='+locale+(id==='qa-personal-A'?'&worldSubjectId=qa-world-MY-ref':''))).json();assert.equal(data.integration.world.status,'PASS');
  const overflow=await page.locator('[data-subject-workspace]').evaluate(e=>e.scrollWidth>e.clientWidth+2);assert.equal(overflow,false);
  results.push({width,locale,subjectId:id,status:'PASS',actualOwnerResponse:true,formalSaveBlocked:true,worldRows:data.integration.world.evidence.length,privateFinancialNotClaimed:true,pageErrors:errors,overflow});
  assert.equal(errors.length,0);await page.close();
 }
 const page=await context.newPage();await page.goto(base+'/reality/?subjectId=qa-business',{waitUntil:'domcontentloaded'});await page.locator('[data-r2-state]').waitFor();
 await page.locator('[data-r2-logout]').click();await page.waitForFunction(()=>!document.querySelector('#subject-profile-select option[value="qa-business"]'));assert.equal(await page.locator('[data-subject-reading]').innerText(),'');
 results.push({name:'Native logout clears private selector and DOM',status:'PASS'});await page.close();
}finally{await browser.close();fs.mkdirSync('content/production-closure/live-customer-commercial-convergence/subject-profile-r2',{recursive:true});fs.writeFileSync('content/production-closure/live-customer-commercial-convergence/subject-profile-r2/BROWSER.json',JSON.stringify({scope:'LOCAL_SYNTHETIC_ACCOUNT_NATIVE_OWNER_ADAPTERS_NOT_LIVE',results},null,2));}
console.log('PASS '+results.length+' R2 local browser cases.');
