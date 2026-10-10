import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {inspectTarotExecutionAuthority} from '../functions/tarot-product-runtime/tarot-execution-authority-v1.js';

const ROOT=process.cwd();
const BASE='d2c485af29481179d8e4530780148a1d32981e92';
const readJson=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');
const exists=p=>assert.ok(fs.existsSync(path.join(ROOT,p)),`missing ${p}`);
const P={
  fixtures:'content/production/symbolic-method/browser/tarot-live-browser-fixtures-v1.json',
  evidence:'content/production/symbolic-method/browser/tarot-live-browser-evidence-v1.json',
  contract:'content/production/symbolic-method/contracts/tarot-live-browser-acceptance-contract-v1.json',
  acceptance:'content/production/symbolic-method/acceptance/tarot-live-browser-acceptance-v1.json',
  freeze:'content/production/symbolic-method/freeze/tarot-live-browser-acceptance-freeze-v1.json',
  successor:'content/production/symbolic-method/reconciliation/tarot-live-browser-current-successor-v1.json',
  humanFreeze:'content/production/symbolic-method/freeze/tarot-human-acceptance-freeze-v3.json',
  html:'readings/symbolic/index.html',client:'assets/js/pages/symbolic-perspective.js',css:'assets/css/symbolic-perspective.css',contextApi:'functions/api/symbolic-method-context.js',authority:'functions/tarot-product-runtime/tarot-execution-authority-v1.js',
  pcm:'content/governance/production-capability-matrix/registries/production-capability-registry-v6.json',catalog:'content/web-production/px2/successors/public-method-catalog-v2.json'
};
for(const p of Object.values(P))exists(p);
const fixtures=readJson(P.fixtures),evidence=readJson(P.evidence),contract=readJson(P.contract),acceptance=readJson(P.acceptance),freeze=readJson(P.freeze),successor=readJson(P.successor),human=readJson(P.humanFreeze);

assert.equal(contract.baselineCommit,BASE);assert.equal(contract.phase,'TPA-K');assert.equal(contract.productionBoundary.publicRunAllowed,false);assert.equal(contract.fixtureRules.acceptanceHarnessMayGrantProductionAuthority,false);assert.equal(contract.fixtureRules.acceptanceHarnessMayChangeRunAllowed,false);
assert.equal(human.humanAcceptanceComplete,true);assert.equal(human.current.humanReviewed,24);assert.equal(human.current.accepted,24);
assert.equal(fixtures.baselineCommit,BASE);assert.equal(fixtures.caseCount,24);assert.equal(fixtures.normal,8);assert.equal(fixtures.sensitive,8);assert.equal(fixtures.adversarial,8);assert.equal(fixtures.cases.length,24);assert.equal(fixtures.cases.filter(x=>x.group==='NORMAL').length,8);assert.equal(fixtures.cases.filter(x=>x.group==='SENSITIVE').length,8);assert.equal(fixtures.cases.filter(x=>x.group==='ADVERSARIAL').length,8);

assert.equal(evidence.baselineCommit,BASE);assert.equal(evidence.status,'REAL_CHROMIUM_SOURCE_BROWSER_ACCEPTED_PRODUCTION_SHA_AND_PROMOTION_REMAIN_CLOSED');
assert.match(evidence.browser.product,/Chrome|Chromium/i);assert.match(evidence.browser.userAgent,/HeadlessChrome|Chrome|Chromium/i);assert.ok(evidence.browser.protocolVersion);assert.ok(evidence.browser.executable);
assert.ok(['INLINE_SOURCE_BROWSER_HARNESS','DEPLOYED_URL_REPLAY'].includes(evidence.target.mode));assert.equal(evidence.target.deployedShaVerified,false);
const expectedSource={fixtures:P.fixtures,html:P.html,client:P.client,css:P.css,contextApi:P.contextApi,humanAcceptanceFreeze:P.humanFreeze};for(const [name,p] of Object.entries(expectedSource))assert.equal(evidence.sourceDigests[name],sha256(p),`browser evidence source drift ${name}`);

const r=evidence.results;
assert.equal(r.KW43.methodPressed,true);assert.equal(r.KW43.executeEnabled,true);assert.equal(r.KW43.sourceRunAllowed,false);assert.match(r.KW43.contextText,/does not establish facts|不建立事实/i);assert.match(r.KW43.boundaryText,/decision remains yours|决定/i);
for(const [name,count] of [['KW44',1],['KW45',3]]){assert.equal(r[name].cardCount,count);assert.equal(r[name].layerCount,7);assert.equal(r[name].activeIsResults,true);assert.equal(r[name].sourceButton,true);assert.equal(r[name].artworkCount,count);assert.equal(r[name].artworkAltOk,true);assert.equal(r[name].hasRealityBoundary,true);assert.equal(r[name].hasUncertainty,true);assert.equal(r[name].hasAgency,true);assert.equal(r[name].hasProductLead,true);assert.equal(r[name].hasReflection,true);}
assert.equal(r.KW46.enDynamic,true);assert.equal(r.KW46.zhHansDynamic,true);assert.equal(r.KW46.productLead,true);assert.equal(r.KW46.waiteEditorial,true);assert.equal(r.KW46.cardSpecificReflection,true);
assert.ok(r.KW47.sourceCards>=1);assert.equal(r.KW47.sourceLinks,true);assert.equal(r.KW47.rightsVisible,true);assert.equal(r.KW47.artworkVisible,true);assert.equal(r.KW47.rccVisible,true);assert.equal(r.KW47.uncertaintyVisible,true);assert.equal(r.KW47.agencyVisible,true);
assert.equal(r.KW48.sensitive.length,8);assert.equal(r.KW48.adversarial.length,8);assert.equal(r.KW48.sensitive.every(x=>x.passed),true);assert.equal(r.KW48.adversarial.every(x=>x.passed),true);
assert.ok(r.KW49.keyboardTabEvents>0);for(const v of Object.values(r.KW49.focusablesPresent))assert.equal(v,true);assert.equal(r.KW49.mobileViewport.noHorizontalOverflow,true);assert.equal(r.KW49.mobileViewport.resultsFocused,true);assert.equal(r.KW49.mobileViewport.allImagesHaveAlt,true);assert.equal(r.KW49.mobileViewport.ariaLive,true);assert.equal(r.KW49.mobileViewport.sourceToggleAria,true);assert.equal(r.KW49.focusVisibleCss,true);
assert.deepEqual(evidence.consoleErrors,[]);for(const key of ['kw43','kw44','kw45','kw46','kw47','kw48','kw49','realBrowserEngineUsed','humanAcceptance24Preserved'])assert.equal(evidence.aggregate[key],true,`${key} aggregate false`);assert.equal(evidence.aggregate.publicRunAllowed,false);assert.equal(evidence.aggregate.productionCapabilityPromoted,false);assert.equal(evidence.aggregate.liveProductionShaVerified,false);

assert.equal(acceptance.baselineCommit,BASE);assert.equal(acceptance.status,'ACCEPTED_REAL_CHROMIUM_SOURCE_BROWSER_PRODUCTION_ACTIVATION_STILL_CLOSED');for(const k of ['K_W43','K_W44','K_W45','K_W46','K_W47','K_W48','K_W49','K_W50'])assert.equal(acceptance.accepted[k],true);assert.equal(acceptance.productionBoundary.deployedShaVerified,false);assert.equal(acceptance.productionBoundary.productionCapabilityPromoted,false);assert.equal(acceptance.productionBoundary.publicRunAllowed,false);
assert.equal(freeze.baselineCommit,BASE);assert.equal(freeze.status,'FROZEN_REAL_BROWSER_SOURCE_ACCEPTANCE_LIVE_SHA_AND_PROMOTION_PENDING');for(const [name,item] of Object.entries(freeze.artifacts)){exists(item.path);assert.equal(item.sha256,sha256(item.path),`freeze drift ${name}`);}assert.equal(freeze.productionBoundary.humanAcceptanceComplete,true);assert.equal(freeze.productionBoundary.browserSourceAcceptanceComplete,true);assert.equal(freeze.productionBoundary.deployedProductionShaVerified,false);assert.equal(freeze.productionBoundary.verifiedPersistenceProvider,false);assert.equal(freeze.productionBoundary.productionCapabilityPromoted,false);assert.equal(freeze.productionBoundary.publicRunAllowed,false);
assert.equal(successor.status,'CURRENT_HUMAN_AND_REAL_BROWSER_SOURCE_ACCEPTED_LIVE_SHA_PERSISTENCE_AND_PROMOTION_PENDING');assert.equal(successor.current.humanAcceptance.accepted,24);assert.equal(successor.current.browserAcceptance.complete,true);assert.equal(successor.productionBoundary.liveProductionShaAlignment,false);assert.equal(successor.productionBoundary.productionCapabilityPromoted,false);assert.equal(successor.productionBoundary.publicRunAllowed,false);

const denied=inspectTarotExecutionAuthority({data:{symbolicExecutionAuthority:{TAROT:{methodCode:'TAROT',state:'LIMITED_PRODUCTION',runAllowed:true,humanAcceptance:true,verifiedPersistenceIdentity:true,liveBrowserAcceptance:true,liveProductionShaVerified:true,liveProductionSha:'abc'}}},env:{CF_PAGES_COMMIT_SHA:'different'}});assert.equal(denied.authorized,false);assert.equal(denied.runAllowed,false);assert.equal(denied.clientMayGrantAuthority,false);
const exact=inspectTarotExecutionAuthority({data:{symbolicExecutionAuthority:{TAROT:{methodCode:'TAROT',state:'LIMITED_PRODUCTION',runAllowed:true,humanAcceptance:true,verifiedPersistenceIdentity:true,liveBrowserAcceptance:true,liveProductionShaVerified:true,liveProductionSha:'abc'}}},env:{CF_PAGES_COMMIT_SHA:'abc'}});assert.equal(exact.authorized,true);assert.equal(exact.runAllowed,true);assert.equal(exact.clientMayGrantAuthority,false);
const pcm=readJson(P.pcm),tarPcm=pcm.capabilities.find(x=>x.methodRuntime?.methodCode==='TAROT');assert.ok(tarPcm);assert.equal(tarPcm.userExecutable,false);assert.equal(tarPcm.productionAccepted,false);const catalog=readJson(P.catalog),tarPublic=catalog.methods.find(x=>x.methodCode==='TAROT');assert.ok(tarPublic);assert.equal(tarPublic.runAllowed,false);

console.log('✓ K-W43 Live Tarot entry / method-context browser acceptance passed.');
console.log('✓ K-W44 One-card real-browser execution passed.');
console.log('✓ K-W45 Three-card real-browser execution passed.');
console.log('✓ K-W46 EN / zh-Hans dynamic browser rendering passed.');
console.log('✓ K-W47 Source / artwork / RCC / uncertainty / agency browser visibility passed.');
console.log('✓ K-W48 Sensitive + adversarial browser campaign passed: 8/8 sensitive + 8/8 adversarial.');
console.log('✓ K-W49 Keyboard / focus / responsive / accessibility browser acceptance passed.');
console.log('✓ K-W50 Live Browser Aggregate Gate passed: real Chromium source-browser evidence is frozen while deployed SHA, verified persistence, PCM promotion and public runAllowed remain closed.');
