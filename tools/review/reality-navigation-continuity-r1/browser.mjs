import fs from 'node:fs';import assert from 'node:assert/strict';
import {loadWorldPlaywright,worldBrowserLaunchOptions} from '../../../scripts/lib/world-browser-runtime.mjs';
import {startContinuityServer} from './server.mjs';
const base='tools/review/reality-navigation-continuity-r1',s=await startContinuityServer({filename:'.tmp/reality-navigation-continuity-r1/browser-'+Date.now()+'.sqlite'}),browser=await loadWorldPlaywright().chromium.launch(worldBrowserLaunchOptions()),rows=[];
try{
 for(const locale of ['zh-Hans','en'])for(const width of [390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:1000}});await context.route('**/*',r=>new URL(r.request().url()).origin===s.origin?r.continue():r.abort());let page=await context.newPage();const errors=[],calls=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>calls.push({path:new URL(r.url()).pathname,method:r.method()}));
  await page.goto(s.origin+'/reality/?locale='+locale+'&baseline=1');await page.screenshot({path:base+`/before-${locale}-${width}.png`});
  await page.goto(s.origin+'/?locale='+locale);const entry=page.locator('a[href$="#continue-question"]').last();await entry.click();
  const panel=page.locator('#continue-question');await panel.waitFor();await panel.locator('[data-login=A]').click();await panel.locator('[data-status]').filter({hasText:locale==='en'?'verified':'已验证'}).waitFor();
  await panel.locator('[name=question]').fill(locale==='en'?'How can I organize a change in my work?':'怎样整理下一阶段工作的变化？');await panel.locator('[name=goal]').fill(locale==='en'?'Clarify experience, limits and evidence':'厘清经历、限制与证据');await panel.locator('[name=consent]').check();await panel.locator('[data-create] button').click();await panel.locator('[data-record]').waitFor();
  const cid=new URL(page.url()).searchParams.get('caseId');assert(cid);
  for(const [kind,content] of [['FACT',locale==='en'?'I participated in process coordination; not full ERP implementation.':'参与流程协调，并非独立实施完整 ERP。'],['UNKNOWN',locale==='en'?'Current job requirements need verification.':'实际岗位要求仍需核实。'],['NEXT_ACTION',locale==='en'?'Compare two real job descriptions against documented experience.':'用两份真实岗位要求对照可核验经历。']]){
   await panel.locator('[name=kind]').selectOption(kind);await panel.locator('[name=content]').fill(content);await panel.locator('[data-record] [name=consent]').check();await panel.locator('[data-record] button').click();await panel.locator('[data-confirm]').last().click();await page.waitForFunction(()=>[...document.querySelectorAll('#continue-question [data-select]')].every(e=>!e.disabled));
  }
  for(const cb of await panel.locator('[data-select]').all())await cb.check();await panel.locator('[data-checkpoint]').click();await panel.locator('[data-revoke-checkpoint]').waitFor();
  await panel.locator('[data-world] [name=question]').fill('What is the US HMDA home-purchase denial share in 2024?');await panel.locator('[data-world] [name=consent]').check();await panel.locator('[data-world] button').click();await panel.locator('[data-world-result]').filter({hasText:'14.45'}).waitFor();
  await panel.locator('[data-branch]').evaluate(el=>el.dataset.testBranch='true');page.once('dialog',d=>d.accept(locale==='en'?'Family time':'家庭时间'));await panel.locator('[data-branch]').click();await panel.locator('[data-return]').click();
  await panel.locator('a[href^="/world/"]').click();await page.goBack();await page.locator('[data-revoke-checkpoint]').waitFor();
  await page.close();page=await context.newPage();await page.goto(s.origin+'/reality/?locale='+locale+'&caseId='+cid);await page.locator('[data-revoke-checkpoint]').waitFor();const restored=await page.locator('#continue-question').textContent();assert(restored.includes(locale==='en'?'restored':'恢复'));
  const first=page.locator('[data-correct]').first();page.once('dialog',d=>d.accept(locale==='en'?'Participation only; job seniority needs confirmation.':'仅参与工作，具体职级仍需确认。'));await first.click();await page.getByText(locale==='en'?'Information changed; review needed':'信息改变，需要重审',{exact:false}).first().waitFor();
  await page.locator('[data-confirm]').first().click();await page.locator('[data-withdraw]').first().click();await page.reload();await page.locator('[data-revoke-checkpoint]').waitFor();
  const final=page.locator('#continue-question');const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false);
  await page.route('**/__local/continuity?*',r=>r.abort(),{times:1});await final.locator('[data-reload]').click();await final.locator('[data-status]').filter({hasText:locale==='en'?'retry':'重试'}).waitFor();await final.locator('[data-reload]').click();await page.locator('[data-revoke-checkpoint]').waitFor();
  await final.evaluate(el=>el.scrollIntoView({block:'start'}));await page.waitForTimeout(120);await page.screenshot({path:base+`/after-${locale}-${width}.png`});await page.keyboard.press('Tab');assert(await page.evaluate(()=>document.activeElement!==document.body));
  rows.push({locale,width,state:'PASS_LOCAL_BROWSER',caseId:cid,entry:'EXISTING_HOMEPAGE_TO_EXISTING_REALITY',saveAndNewPageRestore:true,branchReturn:true,worldReturn:true,correctionWithdrawal:true,keyboard:true,overflow,errors,requests:calls.length,remoteAssets:'BLOCKED_UNVERIFIED',originalProjectionApi:'UNMOUNTED_503_NOT_PRODUCTION',screenshot:`after-${locale}-${width}.png`});await context.close();
 }
 fs.writeFileSync(base+'/BROWSER-RESULTS.json',JSON.stringify({rows,providerCalls:0,syntheticIdentity:true,actualExistingPage:true},null,2));console.log(JSON.stringify({pass:rows.length,errors:rows.map(r=>r.errors)}));
}catch(e){fs.writeFileSync(base+'/BROWSER-FAILURE-'+Date.now()+'.json',JSON.stringify({error:e.stack,rows},null,2));throw e;}finally{await browser.close();await s.stop();}
