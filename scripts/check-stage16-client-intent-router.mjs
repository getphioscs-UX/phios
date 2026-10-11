import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const contract=json('content/public/client-intent-router/contracts/stage16-client-intent-router-contract-v1.json');
const intents=json('content/public/client-intent-router/registries/client-intent-registry-v1.json');
const surfaces=json('content/public/client-intent-router/registries/public-surface-registry-v1.json');
const acceptance=json('content/public/client-intent-router/acceptance/stage16-client-intent-router-acceptance-v1.json');
const freeze=json('content/public/client-intent-router/freeze/stage16-client-intent-router-freeze-v1.json');
assert.equal(contract.baselineCommit,'306b84652102583690a7f7665167f8dfdbb82541');
assert.deepEqual(contract.questionTaxonomy,['CURRENT','DECISION','RELATIONSHIP','TIME','DOMAIN','STRUCTURE']);
assert.equal(contract.rules.homepageMethodButtonsAllowed,false);assert.equal(contract.rules.ordinaryUserChoosesMethod,false);assert.equal(contract.rules.lensRouterOwnsMethodSelection,true);
assert.equal(intents.intents.length,6);assert.equal(new Set(intents.intents.map(x=>x.code)).size,6);assert.ok(intents.intents.every(x=>x.route==='/ask'));
assert.equal(surfaces.surfaces.length,7);for(const route of ['/ask','/library','/personal-runtime','/financial-reality','/my-reality','/reality-journey'])assert.ok(surfaces.surfaces.some(x=>x.route===route));
assert.deepEqual(surfaces.hiddenBehindOrchestration,['AST','BZR','ZI_WEI','NUM','HDR','CCR','CWA','RLR']);assert.equal(surfaces.realityJourneyIsFirstVisitDefault,false);
const index=read('index.html');
if(index.includes('data-page-consolidation="R1"')){
 const {consolidationSuccessor,historicalPisBytes}=await import('./lib/page-consolidation-successor-r1.mjs');
 assert(consolidationSuccessor());historicalPisBytes('index.html');
 for(const selector of ['data-cir-root','data-cir-form','data-cir-question','data-cir-status','src="/assets/js/pages/client-intent-router.js"','id="start"'])assert(index.includes(selector));
 const {parseHTML}=await import('linkedom');const {document}=parseHTML(index);
 const form=document.querySelector('[data-cir-form]');assert.equal(form.getAttribute('action'),'/knowledge/ask/');assert.equal(form.getAttribute('method'),'get');
 if(document.querySelector('#start [data-vr2-guide]')){
  const entries=[...document.querySelectorAll('#start a[data-vr2-guide]')];assert.equal(entries.length,6);
  const routes=['/knowledge/ask/','/knowledge/','/reality/','/perspectives/','/account/','/professional/'];
  entries.forEach((entry,i)=>{assert.equal(entry.getAttribute('data-vr2-guide'),'PLAN-HOME-'+String(i+1).padStart(2,'0'));assert.equal(entry.getAttribute('href'),routes[i]);assert(entry.querySelector('img[data-approved-visual]'));assert(entry.querySelector('[data-vr2-en][data-vr2-zh]'));});
  assert(index.includes('/assets/js/global-visual-r2.js'));
 }else{
  assert.equal(document.querySelectorAll('#start .pm-card').length,6);
  for(const href of ['/knowledge/ask/','/perspectives/personal/','/perspectives/relationship/','/professional/financial/','/world','/knowledge/'])assert(document.querySelector(`#start a[href="${href}"]`));
 }
 for(const forbidden of ['data-method','ASTROLOGY_PROJECTION','BAZI_PROJECTION','ZI_WEI_PROJECTION','HDR.OPERATING_READING'])assert(!form.outerHTML.includes(forbidden));
}else{
const index=read('index.html');assert.ok(index.includes('data-cir-root'));assert.equal((index.match(/data-cir-intent=/g)||[]).length,6);assert.ok(index.includes('你不需要先选择 Astrology、BaZi、Zi Wei 或 Numerology'));assert.ok(index.includes('七个客户入口'));assert.ok(index.includes('href="/personal-runtime"'));assert.ok(index.includes('href="/financial-reality"'));assert.ok(index.includes('href="/my-reality"'));assert.ok(index.includes('href="/reality-journey"'));
const cirBlock=index.slice(index.indexOf('data-cir-root'),index.indexOf('data-cir-status'));
for(const forbidden of ['data-method','ASTROLOGY_PROJECTION','BAZI_PROJECTION','ZI_WEI_PROJECTION','HDR.OPERATING_READING'])assert.ok(!cirBlock.includes(forbidden),`homepage intent block leaked ${forbidden}`);
}
const shell=read('assets/js/public-shell-v2.js');for(const route of ['/ask','/library','/personal-runtime','/financial-reality','/my-reality','/reality-journey'])assert.ok(shell.includes(`href: '${route}'`));assert.ok(!shell.includes("href: '/readings/'"));assert.ok(!shell.includes("href: '/professional/financial/'"));
const ux=read('assets/js/pages/ux-lens.js');assert.ok(ux.includes("params.get('intent')"));assert.ok(ux.includes("['CURRENT','DECISION','RELATIONSHIP','TIME','DOMAIN','STRUCTURE']"));
assert.ok(read('assets/js/pages/ux-lens.js').includes('openRealityEntryWithBundle'));
assert.ok(fs.existsSync(path.join(root,'functions/api/client-intent-route.js')));assert.ok(fs.existsSync(path.join(root,'functions/public/client-intent-router.js')));
const {routeClientIntent}=await import(pathToFileURL(path.join(root,'functions/public/client-intent-router.js')).href+`?t=${Date.now()}`);
// The frozen Stage 16 registry above remains historical evidence. Current Ask R1
// returns bounded capability choices without sending the question to a destination.
let r=routeClientIntent({q:'为什么我最近想换工作？',intent:'CURRENT'});
assert.equal(r.outcome,'KNOWLEDGE_LOOKUP');assert.equal(r.task,'KNOWLEDGE_BASIC');
assert.equal(r.generalExplanation,true);assert.equal(r.href,'/knowledge/');
assert.deepEqual(r.candidates.map(c=>c.capabilityId),['KNOWLEDGE']);
assert.equal(r.boundaries.methodChosenByClientRouter,false);
r=routeClientIntent({q:'我想建立财务快照'});assert.equal(r.outcome,'MATCHED_CAPABILITY');assert.equal(r.surface,'FINANCIAL');assert.equal(r.href,'/professional/financial/');
r=routeClientIntent({q:'什么是 Reality Drift?'});assert.equal(r.outcome,'KNOWLEDGE_LOOKUP');assert.equal(r.task,'KNOWLEDGE_BASIC');assert.equal(r.surface,'KNOWLEDGE');assert.equal(r.href,'/knowledge/');
for(const question of ['为什么我最近想换工作？','我想建立财务快照','什么是 Reality Drift?']){
 const route=routeClientIntent({q:question,intent:'CURRENT',depth:'DEEP',paid:true,entitlement:true});
 assert.equal(route.providerCalls,0);assert.equal(route.providerInvoked,false);
 for(const boundary of ['methodChosenByClientRouter','lensExecutionAllowed','modelCalculationAllowed','persistenceAllowed','automaticRealityCase','automaticJourneyActivation'])assert.equal(route.boundaries[boundary],false);
 assert(route.candidates.length<=3);assert(!route.href.includes('q='));
}
assert.equal(acceptance.status,'STAGE16_CLIENT_INTENT_ROUTER_SOURCE_ACCEPTED_LIVE_BROWSER_PENDING');assert.equal(acceptance.notPromoted.liveBrowserAccepted,false);assert.equal(freeze.status,'STAGE16_CLIENT_INTENT_ROUTER_SOURCE_FROZEN');
console.log('✓ STAGE 16 Client Intent Router / Public UX passed.');
console.log('  Historical six-intent evidence is preserved; current Ask R1 clarifies capability choices and routes knowledge lookup without provider execution.');
console.log('  Stage 15 Reality handoff remains explicit; no automatic case, Journey or persistence.');
