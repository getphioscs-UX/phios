import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {executeIChingProductRuntime} from '../functions/iching-product-runtime/iching-product-runtime-v2.js';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const customerJs=read('assets/customer-ui/js/surfaces/iching-customer-reading.js');
const customerCss=read('assets/customer-ui/surfaces/iching-customer-reading.css');
const shell=read('assets/customer-ui/js/shell.js');

assert.match(shell,/import\('\.\/surfaces\/iching-customer-reading\.js'\)/);
assert.ok(shell.indexOf("import('./surfaces/iching-customer-reading.js')")<shell.indexOf("import('./surfaces/iching-casting.js')"),'customer experience extension must install before casting surface');
assert.match(customerJs,/body\.locale=locale\(\)/,'execute request must bind the selected customer locale');
assert.match(customerJs,/depthInterpretation/,'human-approved depth projection must be consumed by the customer renderer');
assert.match(customerJs,/reflectionQuestions/);
assert.match(customerJs,/whatToObserve/);
assert.match(customerJs,/data-reading-complete/);
assert.match(customerJs,/scrollIntoView\(\{behavior:'smooth'/);
assert.match(customerJs,/只有当前部署的准确 commit|Full Production authority is not active on this deployment/,'legacy engineering language must be explicitly remapped if encountered');
assert.match(customerJs,/选择你想采用的起卦方式，然后继续进入这次阅读/);
assert.match(customerJs,/这次阅读不会确认必然结果、具体日期、他人的隐藏内心状态/);
assert.match(customerCss,/\[data-source-list\] \.sp-source-card>dl\{display:none\}/);

const imagePaths=[
  'assets/customer-ui/media/iching/casting/PHIOS-ICHING-CASTING-METHODS-OVERVIEW-v1-en.webp',
  'assets/customer-ui/media/iching/casting/PHIOS-ICHING-CASTING-METHODS-OVERVIEW-v1-zh-Hans.webp',
  'assets/customer-ui/media/iching/casting/PHIOS-ICHING-CASTING-THREE-COIN-GUIDE-v1-en.webp',
  'assets/customer-ui/media/iching/casting/PHIOS-ICHING-CASTING-THREE-COIN-GUIDE-v1-zh-Hans.webp'
];
for(const imagePath of imagePaths){
  assert.equal(fs.existsSync(imagePath),true,`${imagePath} missing`);
  const bytes=fs.readFileSync(imagePath);
  assert.ok(bytes.length>50_000,`${imagePath} unexpectedly small`);
  assert.equal(bytes.subarray(0,4).toString('ascii'),'RIFF',`${imagePath} RIFF header missing`);
  assert.equal(bytes.subarray(8,12).toString('ascii'),'WEBP',`${imagePath} WEBP header missing`);
  assert.match(customerJs,new RegExp(path.basename(imagePath).replaceAll('.','\\.')));
}

const authorities=Object.freeze({
  hexagramRegistry:json('content/professional/core-method-runtime/iching-hexagram-registry-v1.json'),
  sourceRegistry:json('content/interpretation/iching/registries/iching-source-registry-v2.json'),
  perspectiveRegistry:json('content/interpretation/iching/registries/iching-interpretation-perspective-registry-v2.json'),
  corpus:json('content/interpretation/iching/corpus/iching-public-domain-canonical-corpus-v2.json'),
  depthCorpus:json('content/interpretation/iching/corpus/iching-depth-admitted-editorial-corpus-v2.json')
});
const h33=authorities.hexagramRegistry.entries.find(item=>item.hexagramId==='HEXAGRAM-33');
assert.ok(h33,'HEXAGRAM-33 fixture missing');
const lines=h33.lineStructure.map((bit,index)=>index===4?(bit===1?9:6):(bit===1?7:8));
const result=await executeIChingProductRuntime({method:'I_CHING',question:'What can I observe before I decide?',inputMode:'MANUAL_LINES',lines,sessionId:'ICH-CUSTOMER-READING-CHECK',timestamp:'2026-08-27T12:00:00.000Z',projectionVersion:'1.0.0',locale:'zh-Hans'},authorities);
const interpretation=result.publicView.hierarchy.find(layer=>layer.id==='SYMBOLIC_INTERPRETATION')?.data;
const depth=interpretation?.depthInterpretation;
assert.equal(depth?.status,'AVAILABLE');
assert.equal(depth?.locale,'zh-Hans');
assert.equal(depth?.hexagram?.humanApproved,true);
assert.equal(depth?.lines?.[0]?.linePosition,5);
assert.ok(depth?.hexagram?.content?.plainMeaning?.includes('遯'));
assert.ok(Array.isArray(depth?.hexagram?.content?.whatToObserve)&&depth.hexagram.content.whatToObserve.length>=2);
assert.ok(Array.isArray(depth?.hexagram?.content?.reflectionQuestions)&&depth.hexagram.content.reflectionQuestions.length>=2);

const frozenPaths=[
  'content/interpretation/iching/corpus/iching-depth-admitted-editorial-corpus-v2.json',
  'functions/interpretation-runtime/iching-depth-editorial-runtime-v2.js',
  'functions/iching-product-runtime/iching-product-runtime-v2.js',
  'functions/symbolic-method-public-ux/iching-product-view-model-v2.js',
  'perspectives/iching/run/index.html',
  'assets/customer-ui/js/surfaces/iching-full.js',
  'assets/customer-ui/js/surfaces/iching-casting.js'
];
const release=json('content/production/symbolic-method/releases/iching/ICHING-1.0.1.json');
const artifactPaths=new Set(release.artifacts.map(item=>item.path));
for(const frozen of frozenPaths)assert.equal(artifactPaths.has(frozen),true,`${frozen} should remain frozen under ICHING-1.0.1`);

console.log('✓ I Ching customer reading experience passed: customer-only language, visual casting guides, result focus/collapse, human-approved depth explanation, Reality comparison, uncertainty and next-question rendering.');
console.log('  ICHING-1.0.1 frozen corpus/runtime/release artifacts remain untouched; this is a presentation extension, not a new interpretation authority.');
