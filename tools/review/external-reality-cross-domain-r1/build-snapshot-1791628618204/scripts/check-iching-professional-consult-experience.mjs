import assert from 'node:assert/strict';
import fs from 'node:fs';
import {executeIChingProductRuntime} from '../functions/iching-product-runtime/iching-product-runtime-v2.js';
import {renderIChingCustomerReading,createIChingCustomerReadingModel} from '../assets/customer-ui/js/surfaces/iching-consult-renderer.js';
import {composeIChingCustomerReading} from '../assets/customer-ui/js/surfaces/iching-consult-composition.js';
const read=p=>fs.readFileSync(p,'utf8');const json=p=>JSON.parse(read(p));
const page=read('perspectives/iching/consult/index.html');
const entryPage=read('perspectives/iching/index.html');
const client=read('assets/customer-ui/js/surfaces/iching-consult.js');
const renderer=read('assets/customer-ui/js/surfaces/iching-consult-renderer.js');
const compositionSource=read('assets/customer-ui/js/surfaces/iching-consult-composition.js');
const compositionContract=json('content/production/symbolic-method/contracts/iching-customer-reading-composition-v1.json');
const css=read('assets/customer-ui/surfaces/iching-consult.css');
const entry=read('assets/customer-ui/js/surfaces/iching-customer-entry.js');
const cutover=read('assets/customer-ui/js/surfaces/iching-run-cutover.js');
const shell=read('assets/customer-ui/js/shell.js');
for(const marker of ['data-consult-question','data-start-system-cast','data-method="COIN_CAST"','data-method="MANUAL_LINES"','data-method-guide','data-reading-content'])assert.ok(page.includes(marker),`consult page missing ${marker}`);
for(const marker of ['/api/iching-full-cast','/api/iching-full-execute','/api/iching-full-save','SYSTEM_RANDOM','COIN_CAST','MANUAL_LINES','scrollIntoView','locale:locale()'])assert.ok(client.includes(marker),`consult client missing ${marker}`);
assert.ok(css.includes('pointer-events:auto!important'),'question input must be explicitly interactive');
assert.ok(shell.includes("import('./surfaces/iching-run-cutover.js')"));
assert.ok(shell.includes("import('./surfaces/iching-casting.js')"),'frozen casting checker compatibility must remain');
assert.ok(entry.includes('/perspectives/iching/consult/'));
assert.equal(entryPage.includes('CURRENT AVAILABILITY'),false);assert.equal(entryPage.includes('Full Production'),false);assert.ok(entryPage.includes('开始易经阅读'));
assert.ok(cutover.includes("location.replace('/perspectives/iching/consult/')"));
for(const phrase of ['Full Production','server authority','exact deployed commit','准确 commit','服务器权限'])assert.equal(page.includes(phrase),false,`customer consult page leaks operational phrase: ${phrase}`);
const images=['PHIOS-ICHING-CASTING-METHODS-OVERVIEW-v1-en.webp','PHIOS-ICHING-CASTING-METHODS-OVERVIEW-v1-zh-Hans.webp','PHIOS-ICHING-CASTING-THREE-COIN-GUIDE-v1-en.webp','PHIOS-ICHING-CASTING-THREE-COIN-GUIDE-v1-zh-Hans.webp'];
for(const name of images){const p=`assets/customer-ui/media/iching/casting/${name}`;const b=fs.readFileSync(p);assert.equal(b.subarray(0,4).toString('ascii'),'RIFF');assert.equal(b.subarray(8,12).toString('ascii'),'WEBP');assert.ok(client.includes(name));}
assert.equal(compositionContract.status,'ACTIVE_PRESENTATION_ONLY');
assert.equal(compositionContract.presentationRules.humanReviewGovernanceLabelVisibleToCustomer,false);
assert.equal(compositionContract.presentationRules.newCanonicalMeaningMayBeCreated,false);
assert.equal(compositionContract.presentationRules.primaryCustomerPriority,'UNDERSTAND_THE_READING_FIRST');
assert.ok(renderer.includes('composeIChingCustomerReading'), 'customer renderer must consume the governed customer composition layer');
for(const forbidden of ['HUMAN-REVIEWED INTERPRETATION','人工审核解释'])assert.equal(renderer.includes(forbidden),false,`customer renderer exposes governance label: ${forbidden}`);
assert.ok(compositionSource.includes('newMeaningCreated:false'));
assert.ok(css.includes('.icx-answer-lead'));
assert.ok(css.includes('.icx-answer-grid'));

const authorities={hexagramRegistry:json('content/professional/core-method-runtime/iching-hexagram-registry-v1.json'),sourceRegistry:json('content/interpretation/iching/registries/iching-source-registry-v2.json'),perspectiveRegistry:json('content/interpretation/iching/registries/iching-interpretation-perspective-registry-v2.json'),corpus:json('content/interpretation/iching/corpus/iching-public-domain-canonical-corpus-v2.json'),depthCorpus:json('content/interpretation/iching/corpus/iching-depth-admitted-editorial-corpus-v2.json')};

// Customer regression: Da Xu + changing line 4 should read as a clear customer answer,
// not as governance prose. These lines are bottom-to-top and preserve the same
// structural/runtime authority as the release.
const result=await executeIChingProductRuntime({method:'I_CHING',question:'这段关系现在最需要我看清什么？',inputMode:'MANUAL_LINES',lines:[7,7,7,6,8,7],sessionId:'ICH-PRO-CONSULT-CHECK-DAXU',timestamp:'2026-08-28T00:00:00.000Z',projectionVersion:'1.0.0',locale:'zh-Hans'},authorities);
const model=createIChingCustomerReadingModel(result.publicView,'zh-Hans');
assert.equal(model.primary.number,26);
assert.deepEqual(model.changing,[4]);
assert.equal(model.depthAvailable,true);
const composed=composeIChingCustomerReading({locale:'zh-Hans',question:model.question,primary:model.primary,relating:model.relating,changing:model.changing,hexContent:model.hexContent,lineDepth:model.lineDepth});
assert.ok(composed.answerLead.includes('先提醒你看清'));
assert.ok(composed.practicalLead.includes('真正要判断的是'));
assert.ok(composed.situation.includes('下卦乾'));
assert.ok(composed.direction.includes('现在更适合'));
assert.ok(composed.lineSummaries[0].stage.includes('进入位置'));
assert.ok(composed.lineSummaries[0].direction.includes('先确认现实条件'));
const html=renderIChingCustomerReading(result.publicView,'zh-Hans');
for(const phrase of ['大畜','这次卦象的重点','真正要判断的是什么','现在更适合怎么做','第 4 爻 · 变化点','这次变化说明什么','把它放回你的问题','进入位置'])assert.ok(html.includes(phrase),`clear customer result missing ${phrase}`);
for(const bad of ['人工审核解释','HUMAN-REVIEWED INTERPRETATION','[object Object]','>UNKNOWN<','HEXAGRAM-26','ICH-SRC-','候选解释把','候选逐爻解释','这次阅读不会替你决定什么'])assert.equal(html.includes(bad),false,`customer result leaks internal/over-defensive copy ${bad}`);
assert.equal(html.includes('童牛之牿'),true,'canonical changing-line text should remain available only inside source details');

console.log('✓ I Ching customer interpretation composition passed: governance labels are hidden, the primary answer leads with situation + key judgment + clearer direction, changing lines explain the active change, reality prompts remain useful, and provenance/boundaries are secondary rather than the main reading.');
