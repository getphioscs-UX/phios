import fs from 'node:fs';import assert from 'node:assert/strict';
import {chromium} from 'file:///C:/Users/Guest%20Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {start} from './server.mjs';import {fixture} from './local-test.mjs';
const dir='tools/review/personal-evidence-r1/evidence-system-r1/';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']}),results=[];
try{
 for(const lang of ['en','zh-Hans'])for(const width of [390,768,1024,1440]){
  const s=await start(),context=await browser.newContext({viewport:{width,height:960},acceptDownloads:true}),page=await context.newPage();const errors=[];
  await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort('blockedbyclient'));
  page.on('pageerror',e=>errors.push(e.message));
  const checks=[];const check=(name,ok)=>{assert.ok(ok,`${lang} ${width}: ${name}`);checks.push({name,pass:true});};
  try{
   await page.goto(s.url+'/perspectives/profile/?locale='+lang+'&evidence=1',{waitUntil:'networkidle'});
   await page.locator('[data-pe-form]').waitFor();
   check('correct language',await page.locator('html').getAttribute('lang')===lang);
   if(lang==='en'&&width===390){
    await page.locator('[data-pe-assess]').click();await page.locator('[data-prf-mode="QUICK_PROFILE"]').click();await page.waitForFunction(()=>document.querySelectorAll('[data-prf-fields] input[type=radio]').length>0);
    await page.locator('[data-prf-form] [name=participantRef]').selectOption({index:0});await page.locator('[data-prf-form] [name=assessmentDate]').fill('2026-10-25');
    const radios=page.locator('[data-prf-fields] input[type=radio]');const seen=new Set();for(let i=0;i<await radios.count();i++){const r=radios.nth(i),name=await r.getAttribute('name');if(!seen.has(name)){await r.check();seen.add(name);}}
    await page.locator('[data-prf-form] [name=consent]').check();const sensitive=page.locator('[data-prf-form] [name=sensitiveConsent]');if(await sensitive.count())await sensitive.check();
    await page.locator('[data-prf-form] [type=submit]').click();await page.waitForFunction(()=>document.querySelector('[data-prf-results]')?.hidden===false);
    check('reused real Quick assessment UI and API',s.logs.some(x=>x.path==='/api/profile-progressive'&&x.method==='POST'&&x.status===200));await page.locator('[data-pe-assessment-owner]').evaluate(e=>e.open=false);
   }
   await page.locator('[data-pe-load]').click();await page.waitForFunction(()=>document.querySelector('[data-pe-overview]').textContent.includes('0'));
   const inputs={...fixture,title:lang==='en'?'Synthetic coordination experience':'合成协调经历',context:lang==='en'?'Synthetic factory':'合成工厂',role:lang==='en'?'Coordinator':'协调员',responsibility:lang==='en'?fixture.responsibility:'协调两个部门的资料收集',action:lang==='en'?fixture.action:'设计共享生产资料表',outcome:lang==='en'?fixture.outcome:'两个部门开始使用共同记录',unknowns:lang==='en'?fixture.unknowns:'尚未核实效率及团队成果',claim:lang==='en'?fixture.claim:'协调经验',reflection:lang==='en'?fixture.reflection:'我不确定自己是否擅长领导'};
   const fill=async()=>{for(const k of ['title','context','role','periodStart','periodEnd','responsibility','action','outcome','unknowns'])await page.locator(`[data-pe-form] [name=${k}]`).fill(inputs[k]);await page.locator('[data-pe-form] details').evaluate(e=>e.open=true);for(const k of ['claim','reflection'])await page.locator(`[data-pe-form] [name=${k}]`).fill(inputs[k]);await page.locator('[name=claimDirection]').selectOption('SUPPORTS');await page.locator('[name=capabilities][value=COORDINATION]').check();await page.locator('[name=saveConsent]').check();};
   await fill();await page.locator('[data-pe-form] [type=submit]').click();await page.waitForFunction(()=>document.querySelectorAll('[data-edit]').length===1);
   check('actual account API save',s.logs.some(x=>x.path.includes('account-profile')&&x.method==='POST'&&x.status===201));
   await page.reload({waitUntil:'networkidle'});await page.locator('[data-pe-load]').click();await page.locator('[data-edit]').waitFor();
   check('reload and actual API reopen',await page.locator('[data-pe-records]').textContent().then(x=>x.includes(inputs.action)));
   await page.locator('[data-edit]').click();await page.waitForFunction(()=>document.querySelector('[name=action]').value.length>0);
   check('correct record reopened',await page.locator('[data-pe-form] [name=action]').inputValue()===inputs.action);
   await page.locator('[name=unknowns]').fill(inputs.unknowns+' '+(lang==='en'?'Add voluntary feedback.':'需补充自愿反馈。'));await page.locator('[name=saveConsent]').check();await page.locator('[data-pe-form] [type=submit]').click();await page.waitForFunction(()=>document.querySelector('[data-pe-records]').textContent.includes('2'));
   if(width===390&&lang==='zh-Hans'){
    await fill();await page.locator('[name=periodEnd]').fill('2023-01-01');await page.locator('[data-pe-form] [type=submit]').click();await page.waitForFunction(()=>document.querySelector('[data-pe-status]').textContent.includes('未能完成'));
    check('failed save retains input',await page.locator('[name=action]').inputValue()===inputs.action);
    await page.locator('[name=periodEnd]').fill(inputs.periodEnd);await page.locator('[name=title]').fill('合成反例');await page.locator('[name=claimDirection]').selectOption('CHALLENGES');await page.locator('[data-pe-form] [type=submit]').click();await page.waitForFunction(()=>document.querySelectorAll('[data-edit]').length===2);
    await page.locator('[data-select]').nth(0).check();await page.locator('[data-select]').nth(1).check();await page.locator('[data-pe-compare]').click();await page.waitForFunction(()=>document.querySelector('[data-pe-comparison]').textContent.includes('不同方向'));
    check('actual UI conflict preserves difference',await page.locator('[data-pe-comparison]').textContent().then(x=>x.includes('不同方向')));
    page.once('dialog',d=>d.accept());await page.locator('[data-revoke]').nth(1).click();await page.waitForFunction(()=>document.querySelectorAll('[data-edit]').length===1);
   }
   await page.locator('[data-select]').check();await page.locator('[data-pe-question]').fill(lang==='en'?'Which career evidence should I verify next?':'下一步应该核实哪些职业证据？');
   await page.locator('[data-pe-handoff]').click();await page.waitForFunction(()=>document.querySelector('[data-pe-status]').textContent.length>0);
   check('default handoff not consented',(await page.locator('[data-pe-package]').textContent())==='');
   await page.locator('[data-pe-consent]').check();await page.locator('[data-pe-handoff]').click();await page.waitForFunction(()=>document.querySelector('[data-pe-package]').textContent.length>0);
   check('explicit selection projected',s.logs.some(x=>x.method==='POST'&&x.status===200));
   await page.locator('[data-pe-withdraw]').click();check('withdrawal clears package',(await page.locator('[data-pe-package]').textContent())==='');
   await page.locator('[data-pe-report-consent]').check();await page.locator('[data-pe-report]').click();await page.locator('[data-pe-dialog][open]').waitFor();
   const frame=page.frameLocator('[data-pe-frame]');await frame.locator('h1').waitFor();check('real bilingual report source',await frame.locator('body').textContent().then(x=>x.includes(inputs.action)&&x.includes('Personal Evidence Dossier')&&x.includes('个人现实证据档案')));
   if(width===390&&lang==='zh-Hans'){
    await page.frameLocator('[data-pe-frame]').locator('body').screenshot({path:dir+'dossier-zh-390.png'});
    const reportFrame=page.frames().find(f=>f.url().includes('&report='));const pdfPage=await context.newPage();await pdfPage.goto(reportFrame.url(),{waitUntil:'networkidle'});await pdfPage.pdf({path:dir+'SYNTHETIC-BILINGUAL-DOSSIER.pdf',format:'A4',printBackground:true});await pdfPage.close();
   }
   await page.locator('[data-pe-close]').click();
   const overflow=await page.locator('.pe-experience').evaluate(e=>({scroll:e.scrollWidth,client:e.clientWidth,body:document.documentElement.scrollWidth,viewport:innerWidth}));
   check('candidate no horizontal overflow',overflow.scroll<=overflow.client+1);
   check('six areas',await page.locator('.pe-experience>section').count()===6);
   if(lang==='en'&&width===390){await page.locator('[name=title]').fill('Unsaved synthetic draft');await page.evaluate(()=>{document.documentElement.lang='zh-Hans';dispatchEvent(new Event('phios:localechange'));});await page.waitForFunction(()=>document.querySelector('.pe-experience h1').textContent==='认识真实的自己');check('language switch retains draft',await page.locator('[name=title]').inputValue()==='Unsaved synthetic draft');check('source language not silently changed',await page.locator('[name=sourceLanguage]').inputValue()==='en');await page.evaluate(()=>{document.documentElement.lang='en';dispatchEvent(new Event('phios:localechange'));});await page.waitForFunction(()=>document.querySelector('.pe-experience h1').textContent.includes('Understand'));}
   if([390,1440].includes(width)){await page.locator('.pe-experience').screenshot({path:dir+`final-${lang}-${width}.png`});}
   page.once('dialog',d=>d.accept());await page.locator('[data-revoke]').click();await page.waitForFunction(()=>document.querySelectorAll('[data-edit]').length===0);
   check('revoke removes active record',await page.locator('[data-edit]').count()===0);
   check('no runtime JS errors',errors.length===0);
   results.push({lang,width,checks,overflow,errors,http:s.logs,externalAssets:'BLOCKED_BY_TEST_POLICY_NOT_VISUALLY_VERIFIED',authentication:'SYNTHETIC_TRUSTED_SERVER_CONTEXT_NOT_REAL_LOGIN'});
  }catch(e){await page.screenshot({path:dir+`failure-${lang}-${width}.png`,fullPage:true});fs.writeFileSync(dir+'BROWSER-FAILURE.json',JSON.stringify({lang,width,error:e.stack,errors,logs:s.logs},null,2));throw e;}
  finally{await context.close();await s.close();}
 }
 fs.writeFileSync(dir+'BROWSER.json',JSON.stringify({at:new Date().toISOString(),results,providerCalls:0,productionWrites:0},null,2));console.log('PASS browser',results.length);
}finally{await browser.close();}
