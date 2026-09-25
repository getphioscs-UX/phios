import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {normalizeArticleForRenderer} from '../assets/js/knowledge/article-blocks.js';
import {setLocale} from '../assets/js/i18n.js';
import {createReconfigurationAtlasState,RECONFIG_ATLAS_LAYERS} from '../assets/js/pages/civilization-atlas/atlas-state.js';
import {mountReconfigurationAtlas} from '../assets/js/pages/civilization-atlas/reconfiguration-renderer.js';
import {resolveAtlasVisualById} from '../assets/js/pages/civilization-atlas/atlas-static-visual.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const renderer=fs.readFileSync('assets/js/pages/civilization-atlas/reconfiguration-renderer.js','utf8');
const articleBlocks=fs.readFileSync('assets/js/knowledge/article-blocks.js','utf8');
const en=fs.readFileSync('assets/js/locales/en/book6-reconfiguration-atlas.js','utf8');
const zh=fs.readFileSync('assets/js/locales/zh-Hans/book6-reconfiguration-atlas.js','utf8');

const articleBase='content/knowledge/public/successors/book6-publication-v1/visual-articles';
for(const locale of ['en','zh-Hans']){
 const files=fs.readdirSync(`${articleBase}/${locale}`).filter(x=>x.endsWith('.json')).sort();
 assert.equal(files.length,28,`Book VI ${locale} publication article count drifted`);
 for(const file of files){
  const article=read(`${articleBase}/${locale}/${file}`);
  assert.doesNotThrow(()=>normalizeArticleForRenderer(article),`Book VI ${locale} article must pass canonical renderer: ${file}`);
 }
}
assert.match(articleBlocks,/\^\(\?:KN\|ART\)-/);

assert.ok(RECONFIG_ATLAS_LAYERS.includes('visuals'),'Book VI Atlas must expose the visual library as a governed layer');
assert.doesNotMatch(renderer,/wpr-part-card/,'Book VI Atlas must not reuse the narrow generic WPR card layout');
assert.match(renderer,/civ-reconfig-card/);
assert.match(renderer,/minmax\(min\(100%,280px\),1fr\)/);
assert.match(renderer,/overflow-wrap:anywhere/);
assert.match(renderer,/function renderVisualLibrary/);
assert.match(renderer,/activeLayer==='visuals'/);
assert.match(renderer,/currentDataNotAdmitted/);
assert.match(renderer,/currentDataBoundary/);
assert.match(renderer,/PHRASE_KEY_BY_TEXT/);
for(const token of ['visualLibrary','visualFamily','visualSubject','currentDataNotAdmitted','currentDataBoundary','CASE_PRESSURE_BOUNDARY','WINDOW_PRESSURE_BOUNDARY']) {
 assert.match(en,new RegExp(token));
 assert.match(zh,new RegExp(token));
}

const data={
 sections:read('content/civilization-atlas/reconfiguration/book-vi-sections-v1.json'),
 cases:read('content/civilization-atlas/reconfiguration/reconfiguration-case-registry-v1.json'),
 windows:read('content/civilization-atlas/reconfiguration/reconfiguration-windows-v1.json'),
 snapshots:read('content/civilization-atlas/reconfiguration/world-reconfiguration-snapshots-v1.json'),
 dossiers:read('content/civilization-atlas/reconfiguration/contemporary-runtime-dossiers-v1.json'),
 lived:read('content/civilization-atlas/reconfiguration/lived-reality-dimensions-v1.json'),
 relationships:read('content/civilization-atlas/reconfiguration/book-vi-atlas-relationships-v2.json'),
 knowledgeStates:read('content/civilization-atlas/reconfiguration/knowledge-state-contract-v1.json'),
 visualStatus:read('content/civilization-atlas/reconfiguration/book-vi-visual-asset-status-v1.json'),
 visualBindings:read('content/civilization-atlas/visuals/civilization-visual-approved-bindings-v2.json')
};

assert.equal(data.visualBindings.assets.length,392,'accepted Civilization Atlas binding census drifted');
const resolved=data.visualBindings.assets.map(a=>resolveAtlasVisualById(data.visualBindings,a.assetId)).filter(Boolean);
assert.equal(resolved.length,392,'all 392 accepted Civilization Atlas bindings must resolve through the existing resolver');

const {document}=parseHTML('<html><head></head><body><main data-civilization-atlas-root data-atlas-mode="reconfiguration"></main></body></html>');
globalThis.document=document;globalThis.window=document.defaultView;
setLocale('zh-Hans',{persist:false,translate:false,emit:false});
const root=document.querySelector('main');

let store=createReconfigurationAtlasState({locale:'zh-Hans',activeLayer:'cases',primaryCaseId:'RC-01'});
let off=mountReconfigurationAtlas(root,data,{locale:'zh-Hans',store});
let text=root.textContent||'';
for(const leak of [
 'Existing institutional configuration before reform',
 'Governed reform and policy reconfiguration',
 'See manuscript-grounded case scope',
 'Revised institutional and economic configuration',
 'registry window; not a causal-duration claim',
 'Granular causal attribution'
]) assert.ok(!text.includes(leak),'zh-Hans case surface leaks English structural copy: '+leak);
for(const expected of ['改革前既有制度配置','受治理的改革与政策重组','修订后的制度与经济配置','登记窗口；不代表因果持续时长']) {
 assert.ok(text.includes(expected),'zh-Hans case projection missing: '+expected);
}
off?.();

store=createReconfigurationAtlasState({locale:'zh-Hans',activeLayer:'visuals'});
off=mountReconfigurationAtlas(root,data,{locale:'zh-Hans',store});
text=root.textContent||'';
assert.ok(text.includes('392'),'visual library must expose the accepted visual census');
assert.equal(root.querySelectorAll('[data-visual-preview] img').length,1,'visual library must lazy-project one selected image, not mass render 392');
off?.();

store=createReconfigurationAtlasState({locale:'zh-Hans',activeLayer:'dossiers',dossierId:'DOSSIER-US'});
off=mountReconfigurationAtlas(root,data,{locale:'zh-Hans',store});
text=root.textContent||'';
assert.ok(text.includes('尚未接入已获准的当前资料'),'unadmitted dossier must present a bounded customer explanation');
assert.ok(!text.includes('运行阶段\n未知'),'unadmitted dossier must not present a wall of repeated UNKNOWN runtime fields');
off?.();

store=createReconfigurationAtlasState({locale:'zh-Hans',activeLayer:'lived',dossierId:'DOSSIER-US'});
off=mountReconfigurationAtlas(root,data,{locale:'zh-Hans',store});
assert.ok((root.textContent||'').includes('当前资料结构已经就绪'),'unadmitted lived reality must present one evidence boundary');
assert.equal(root.querySelectorAll('.civ-reconfig-card').length,0,'unadmitted lived reality must not render fourteen UNKNOWN cards');
off?.();

const human=read('content/civilization-atlas/reconfiguration/book-vi-atlas-human-acceptance-v2.json');
const browser=read('content/civilization-atlas/reconfiguration/book-vi-atlas-browser-acceptance-v2.json');
const cutover=read('content/civilization-atlas/reconfiguration/b6-web-f-final-browser-human-cutover-v1.json');
assert.notEqual(human.status,'ACCEPTED','repair must not fabricate human acceptance');
assert.notEqual(browser.status,'ACCEPTED','repair must not fabricate browser acceptance');
assert.equal(cutover.completionBoundary?.completeClaimAllowed,false);
assert.equal(cutover.completionBoundary?.cutover,'BLOCKED');

console.log('PASS: B6-WEB-FR repairs article admission, Atlas card ownership, zh-Hans structural copy, 392-visual customer projection and bounded unadmitted-current-data presentation without fabricating final acceptance.');
