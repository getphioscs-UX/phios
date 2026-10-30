// Existing public handoff routes only; no Ask submission, account save or Navigation case creation.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {loadWorldPlaywright,worldBrowserLaunchOptions} from '../../../../scripts/lib/world-browser-runtime.mjs';
const out=path.dirname(fileURLToPath(import.meta.url));
const identity=JSON.parse(fs.readFileSync(path.join(out,'PREVIEW-IDENTITY.json'),'utf8'));
assert.match(process.env.WORLD_PREVIEW_HEAD||'',/^[a-f0-9]{40}$/);
assert.equal(identity.commitHash,process.env.WORLD_PREVIEW_HEAD);
assert.equal(identity.environment,'preview');assert.equal(identity.latestStage.status,'success');
const rows=[],writeAttempts=[],providerAttempts=[],readOnlyEligibilityProbes=[],errors=[];
const browser=await loadWorldPlaywright().chromium.launch({...worldBrowserLaunchOptions(),args:['--no-proxy-server']});let complete=false;
try {
 for (const locale of ['en','zh-Hans']) {
  const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
  await ctx.route('**/*',route=>{
   const req=route.request(),u=new URL(req.url());
   if (/(^|\.)(openai\.com|anthropic\.com|moomoo\.com|futunn\.com)$/.test(u.hostname)) {providerAttempts.push(u.hostname);return route.abort();}
   if(u.origin===identity.url&&u.pathname.startsWith('/api/')&&!['GET','HEAD'].includes(req.method())) {
    let body;try{body=req.postDataJSON();}catch{}
    // Existing Ask bootstrap performs a read-only eligibility POST. The endpoint permits
    // only action/locale and reads entitlement; World Preview must reject it before execution.
    if(u.pathname==='/api/customer-current-reality'&&req.method()==='POST'&&body?.action==='REPORT_CONTEXT_ELIGIBLE'&&Object.keys(body).every(k=>['action','locale'].includes(k))) return route.continue();
    writeAttempts.push({path:u.pathname,method:req.method(),action:body?.action||null});return route.abort();
   }
   return route.continue();
  });
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  async function company(){await page.goto(identity.url+'/world/?locale='+locale,{waitUntil:'domcontentloaded',timeout:60000});const host=page.locator('[data-world-company]');await host.locator('form').waitFor();await host.locator('button[type=submit]').click();await host.locator('[data-metric=revenue]').waitFor();return host;}
  let host=await company();const ask=host.locator('a[href^="/knowledge/ask/"]');const href=await ask.getAttribute('href'),target=new URL(href,identity.url);
  assert.equal(target.searchParams.get('contextType'),'KNOWLEDGE');assert.equal(target.searchParams.get('contextRef'),'BOOK:BOOK-6');assert.equal(target.searchParams.get('locale'),locale);
  const eligibility=page.waitForResponse(r=>r.url()===identity.url+'/api/customer-current-reality'&&r.request().method()==='POST',{timeout:20000});
  await ask.click();await page.waitForURL(u=>u.pathname==='/knowledge/ask/');await page.locator('[data-cx-surface="CONTEXTUAL_ASK"]').waitFor();await page.locator('[data-cx-contextual-ask-form]').waitFor();assert.equal(new URL(page.url()).searchParams.get('contextRef'),'BOOK:BOOK-6');
  const denied=await eligibility;assert.equal(denied.status(),503);readOnlyEligibilityProbes.push({locale,action:'REPORT_CONTEXT_ELIGIBLE',httpStatus:denied.status(),serverReadOnlyDenied:true});
  rows.push({id:'EXISTING_ASK_HANDOFF',locale,status:'PASS',href,scope:'Existing Knowledge / Book-6 context route and usable form; no company payload transfer claimed',questionSubmitted:false});
  host=await company();const navigation=host.locator('a[href="/reality/"]');assert.equal(await navigation.count(),1);await navigation.click();await page.waitForURL(u=>u.pathname==='/reality/');await page.locator('[data-cx-surface="MY_REALITY"]').waitFor();await page.locator('[data-cx-start-reality]').waitFor();
  rows.push({id:'EXISTING_NAVIGATION_HANDOFF',locale,status:'PASS',href:'/reality/',scope:'Existing My Reality entry only; no case creation or financial fact persistence claimed',caseCreated:false});
  await ctx.close();
 }
 assert.deepEqual(writeAttempts,[]);assert.deepEqual(providerAttempts,[]);assert.deepEqual(errors,[]);complete=true;
}catch(e){errors.push(e.message);throw e;}finally{await browser.close();fs.writeFileSync(path.join(out,'PREVIEW-HANDOFF.json'),JSON.stringify({status:complete?'PASS':'FAIL',head:identity.commitHash,origin:identity.url,rows,writeAttempts,readOnlyEligibilityProbes,providerAttempts,errors,providerCalls:0,productionWrites:0,oldEvidenceUsed:false},null,2)+'\n');}
console.log(JSON.stringify({status:'PASS',head:identity.commitHash,checks:rows.length}));
