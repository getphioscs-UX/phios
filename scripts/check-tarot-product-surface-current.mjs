import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const ROOT=process.cwd();
const BASE='d2c485af29481179d8e4530780148a1d32981e92';
const readJson=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const text=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');
const exists=p=>assert.ok(fs.existsSync(path.join(ROOT,p)),`missing ${p}`);

const P={
  historicalAcceptance:'content/interpretation/tarot/acceptance/tarot-product-surface-acceptance-v1.json',
  historicalSuccessor:'content/interpretation/tarot/reconciliation/tarot-product-surface-current-successor-v1.json',
  j0Freeze:'content/interpretation/tarot/freeze/tarot-product-interpretation-freeze-v1.json',
  humanFreeze:'content/production/symbolic-method/freeze/tarot-human-acceptance-freeze-v3.json',
  browserFreeze:'content/production/symbolic-method/freeze/tarot-live-browser-acceptance-freeze-v1.json',
  browserAcceptance:'content/production/symbolic-method/acceptance/tarot-live-browser-acceptance-v1.json',
  browserSuccessor:'content/production/symbolic-method/reconciliation/tarot-live-browser-current-successor-v1.json',
  html:'readings/symbolic/index.html',
  client:'assets/js/pages/symbolic-perspective.js',
  css:'assets/css/symbolic-perspective.css',
  contextApi:'functions/api/symbolic-method-context.js',
  authority:'functions/tarot-product-runtime/tarot-execution-authority-v1.js',
  pcm:'content/governance/production-capability-matrix/registries/production-capability-registry-v6.json',
  catalog:'content/web-production/px2/successors/public-method-catalog-v2.json'
};
for(const p of Object.values(P))exists(p);

const historicalAcceptance=readJson(P.historicalAcceptance);
const historicalSuccessor=readJson(P.historicalSuccessor);
assert.equal(historicalAcceptance.status,'ACCEPTED_PRODUCT_SURFACE_SOURCE_BINDING_EXECUTION_STILL_CLOSED');
assert.equal(historicalSuccessor.status,'TAROT_PRODUCT_SURFACE_SOURCE_READY_EXECUTION_ACTIVATION_DEFERRED');
assert.equal(historicalSuccessor.productionBoundary.productionCapabilityPromoted,false);
assert.equal(historicalSuccessor.productionBoundary.publicRunAllowedChanged,false);

const j0=readJson(P.j0Freeze);
assert.equal(j0.status,'FROZEN_78_OF_78_PRODUCT_INTERPRETATION_COMPLETE_HUMAN_USEFULNESS_REVIEW_PENDING');
assert.equal(j0.coverage.cards,78);assert.equal(j0.coverage.waiteEditorial,78);assert.equal(j0.coverage.cardSpecificReflective,78);assert.equal(j0.coverage.productComposition,78);

const human=readJson(P.humanFreeze);
assert.equal(human.humanAcceptanceComplete,true);assert.equal(human.current.humanReviewed,24);assert.equal(human.current.accepted,24);assert.equal(human.productionPromotionAllowed,false);assert.equal(human.runAllowedMayChange,false);

const browserFreeze=readJson(P.browserFreeze), browserAcceptance=readJson(P.browserAcceptance), browserSuccessor=readJson(P.browserSuccessor);
assert.equal(browserFreeze.baselineCommit,BASE);assert.equal(browserFreeze.status,'FROZEN_REAL_BROWSER_SOURCE_ACCEPTANCE_LIVE_SHA_AND_PROMOTION_PENDING');
for(const [name,item] of Object.entries(browserFreeze.artifacts)){exists(item.path);assert.equal(item.sha256,sha256(item.path),`Phase K source drift ${name}`);}
assert.equal(browserAcceptance.status,'ACCEPTED_REAL_CHROMIUM_SOURCE_BROWSER_PRODUCTION_ACTIVATION_STILL_CLOSED');
for(const key of ['K_W43','K_W44','K_W45','K_W46','K_W47','K_W48','K_W49','K_W50'])assert.equal(browserAcceptance.accepted[key],true,`${key} not accepted`);
assert.equal(browserSuccessor.status,'CURRENT_HUMAN_AND_REAL_BROWSER_SOURCE_ACCEPTED_LIVE_SHA_PERSISTENCE_AND_PROMOTION_PENDING');
assert.equal(browserSuccessor.current.humanAcceptance.complete,true);assert.equal(browserSuccessor.current.browserAcceptance.complete,true);
assert.equal(browserSuccessor.productionBoundary.liveProductionShaAlignment,false);assert.equal(browserSuccessor.productionBoundary.productionCapabilityPromoted,false);assert.equal(browserSuccessor.productionBoundary.publicRunAllowed,false);

const html=text(P.html),client=text(P.client),css=text(P.css),context=text(P.contextApi),authority=text(P.authority);
for(const token of ['data-symbolic-results hidden tabindex="-1" aria-live="polite"','data-view-sources aria-expanded="false"','data-execution-status','puxr-lang-zh','puxr-lang-en'])assert.ok(html.includes(token),`current public html missing ${token}`);
for(const token of ['claimEn','claimZhHans','productLeadEn','productLeadZhHans','questionEn','questionZhHans','aria-expanded','altTextEn','altTextZhHans'])assert.ok(client.includes(token),`current client missing ${token}`);
for(const bad of ['localStorage','sessionStorage'])assert.equal(client.includes(bad),false,`hidden browser persistence primitive ${bad}`);
assert.ok(css.includes(':focus-visible'));assert.ok(css.includes('@media(max-width:800px)'));assert.ok(css.includes('@media(max-width:520px)'));
assert.ok(context.includes("inspectTarotExecutionAuthority(context)"));assert.ok(authority.includes('clientMayGrantAuthority:false'));assert.ok(authority.includes("state:authorized?'LIMITED_PRODUCTION':'HUMAN_AND_SOURCE_BROWSER_ACCEPTED_LIVE_PERSISTENCE_SHA_PROMOTION_PENDING'"));

const pcm=readJson(P.pcm),tarPcm=pcm.capabilities.find(x=>x.methodRuntime?.methodCode==='TAROT');assert.ok(tarPcm);assert.equal(tarPcm.userExecutable,false);assert.equal(tarPcm.productionAccepted,false);
const catalog=readJson(P.catalog),tarPublic=catalog.methods.find(x=>x.methodCode==='TAROT');assert.ok(tarPublic);assert.equal(tarPublic.runAllowed,false);

console.log('✓ Tarot product-surface current successor passed: historical W27-W30 authority is preserved while the evolved J0/J-R/Phase-K public source is bound to real-browser acceptance evidence.');
console.log('  Human acceptance and real-browser source acceptance are complete; live production SHA, verified persistence authority, PCM promotion and public runAllowed remain closed.');
