import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {executeIChingProductRuntime} from '../functions/iching-product-runtime/iching-product-runtime-v2.js';
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const shell=read('assets/customer-ui/js/shell.js');
const entry=read('assets/customer-ui/js/surfaces/iching-entry.js');
const customerEntry=read('assets/customer-ui/js/surfaces/iching-customer-entry.js');
const customer=read('assets/customer-ui/js/surfaces/iching-customer-reading.js');
const css=read('assets/customer-ui/surfaces/iching-customer-reading.css');
assert.ok(shell.indexOf("import('./surfaces/iching-casting.js')")<shell.indexOf("import('./surfaces/iching-customer-reading.js')"),'casting must install before customer humanization');
assert.match(shell,/import\('\.\/surfaces\/iching-customer-entry\.js'\)/);
assert.match(customerEntry,/card\)card\.remove\(\)/);
assert.match(customerEntry,/operational production wording/);
assert.match(entry,/fetch\('\/api\/iching-full-production-status'/,'frozen entry authority check must remain intact');
assert.match(customer,/boundary\.remove\(\)/,'method-boundary card must be removed from customer run page');
assert.match(customer,/question\.disabled=false/);
assert.match(customer,/question\.readOnly=false/);
assert.match(customer,/data-customer-reading-action/);
assert.match(customer,/gateSection\.hidden=true/,'engineering gate section must remain customer-hidden');
assert.match(customer,/data-self-casting-guide/);
assert.match(customer,/guide\.open=true/,'self-casting guide must open when manual or coin mode is chosen');
assert.match(customer,/body\.locale=locale\(\)/,'execute request must bind customer locale');
assert.match(customer,/depthInterpretation/);
assert.match(customer,/reflectionQuestions/);
assert.match(customer,/whatToObserve/);
assert.match(customer,/data-reading-complete/);
assert.match(customer,/scrollIntoView\(\{behavior:'smooth'/);
assert.match(customer,/这次阅读不会确认必然结果、具体日期、他人的隐藏内心状态/);
assert.match(css,/\.cx-reading-action-bar/);
assert.match(css,/\.cx-iching-boundary\{display:none!important\}/);
const imagePaths=[
 'assets/customer-ui/media/iching/casting/PHIOS-ICHING-CASTING-METHODS-OVERVIEW-v1-en.webp',
 'assets/customer-ui/media/iching/casting/PHIOS-ICHING-CASTING-METHODS-OVERVIEW-v1-zh-Hans.webp',
 'assets/customer-ui/media/iching/casting/PHIOS-ICHING-CASTING-THREE-COIN-GUIDE-v1-en.webp',
 'assets/customer-ui/media/iching/casting/PHIOS-ICHING-CASTING-THREE-COIN-GUIDE-v1-zh-Hans.webp'
];
for(const imagePath of imagePaths){const bytes=fs.readFileSync(imagePath);assert.ok(bytes.length>50000);assert.equal(bytes.subarray(0,4).toString('ascii'),'RIFF');assert.equal(bytes.subarray(8,12).toString('ascii'),'WEBP');assert.match(customer,new RegExp(path.basename(imagePath).replaceAll('.','\\.')));}
const authorities=Object.freeze({
 hexagramRegistry:json('content/professional/core-method-runtime/iching-hexagram-registry-v1.json'),
 sourceRegistry:json('content/interpretation/iching/registries/iching-source-registry-v2.json'),
 perspectiveRegistry:json('content/interpretation/iching/registries/iching-interpretation-perspective-registry-v2.json'),
 corpus:json('content/interpretation/iching/corpus/iching-public-domain-canonical-corpus-v2.json'),
 depthCorpus:json('content/interpretation/iching/corpus/iching-depth-admitted-editorial-corpus-v2.json')
});
const h33=authorities.hexagramRegistry.entries.find(item=>item.hexagramId==='HEXAGRAM-33');
const lines=h33.lineStructure.map((bit,index)=>index===4?(bit===1?9:6):(bit===1?7:8));
const result=await executeIChingProductRuntime({method:'I_CHING',question:'What can I observe before I decide?',inputMode:'MANUAL_LINES',lines,sessionId:'ICH-CUSTOMER-UX-CHECK',timestamp:'2026-08-27T12:00:00.000Z',projectionVersion:'1.0.0',locale:'zh-Hans'},authorities);
const depth=result.publicView.hierarchy.find(layer=>layer.id==='SYMBOLIC_INTERPRETATION')?.data?.depthInterpretation;
assert.equal(depth?.status,'AVAILABLE');assert.equal(depth?.locale,'zh-Hans');assert.equal(depth?.hexagram?.humanApproved,true);assert.equal(depth?.lines?.[0]?.linePosition,5);
const forbiddenDeltaPrefixes=['functions/runtime/'];
const declared=[
 'assets/customer-ui/js/shell.js','assets/customer-ui/js/surfaces/iching-customer-entry.js','assets/customer-ui/js/surfaces/iching-customer-reading.js','assets/customer-ui/surfaces/iching-customer-reading.css',...imagePaths,'scripts/check-iching-customer-reading-experience.mjs','package.json'
];
assert.equal(declared.some(p=>forbiddenDeltaPrefixes.some(prefix=>p.startsWith(prefix))),false,'customer UX delta must not touch PDS runtime protected path');
console.log('✓ I Ching consolidated customer reading UX passed: casting-first load order, editable question, PHI OS cast/self-casting guide, hidden operational/method-boundary cards, result collapse/focus and human-approved interpretation rendering.');
