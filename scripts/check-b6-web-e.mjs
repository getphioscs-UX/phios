import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {setLocale} from '../assets/js/i18n.js';
import {createReconfigurationAtlasState} from '../assets/js/pages/civilization-atlas/atlas-state.js';
import {mountReconfigurationAtlas} from '../assets/js/pages/civilization-atlas/reconfiguration-renderer.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const renderer=fs.readFileSync('assets/js/pages/civilization-atlas/reconfiguration-renderer.js','utf8');
const page=fs.readFileSync('assets/js/pages/book6-reconfiguration-atlas.js','utf8');
const en=fs.readFileSync('assets/js/locales/en/book6-reconfiguration-atlas.js','utf8');
const zh=fs.readFileSync('assets/js/locales/zh-Hans/book6-reconfiguration-atlas.js','utf8');
const enRoot=fs.readFileSync('assets/js/locales/en.js','utf8');
const zhRoot=fs.readFileSync('assets/js/locales/zh-Hans.js','utf8');

for(const token of ['book6Atlas','resultType','knowledgeState','caseType','entityType','region','field','layer','change','value']){assert.match(en,new RegExp(token));assert.match(zh,new RegExp(token));}
assert.match(enRoot,/book6ReconfigurationAtlas/);assert.match(zhRoot,/book6ReconfigurationAtlas/);
assert.match(renderer,/import \{t\} from '\.\.\/\.\.\/i18n\.js'/);
for(const helper of ['resultTypeLabel','entityTypeLabel','regionLabel','fieldLabel','layerLabel','changeLabel','valueLabel'])assert.match(renderer,new RegExp(helper));
for(const raw of ['<small>\$\{esc\(row\.type\)\}<\/small>','<dt>Prior Runtime<\/dt>','<dt>External Dependency<\/dt>','s\\.asset\\.publicUrl'])assert.doesNotMatch(renderer,new RegExp(raw));
assert.match(renderer,/const PAGE=12,SEARCH_PAGE=24/);
assert.match(renderer,/loading="lazy"/);assert.match(renderer,/decoding="async"/);
assert.match(renderer,/role="tablist"/);assert.match(renderer,/role="tab"/);assert.match(renderer,/role="tabpanel"/);
assert.match(renderer,/ArrowLeft/);assert.match(renderer,/ArrowRight/);assert.match(renderer,/:focus-visible/);
assert.match(renderer,/civ-reconfig-compare-table" role="region" tabindex="0"/);
assert.match(renderer,/@media\(max-width:650px\)/);
assert.match(page,/loadReconfigurationVisualStatus/);assert.match(page,/loadCivilizationVisualBindings/);

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
const {document}=parseHTML('<html><head></head><body><main data-civilization-atlas-root data-atlas-mode="reconfiguration"></main></body></html>');
globalThis.document=document;globalThis.window=document.defaultView;
setLocale('zh-Hans',{persist:false,translate:false,emit:false});
const root=document.querySelector('main');
const store=createReconfigurationAtlasState({locale:'zh-Hans'});
store.set({activeLayer:'search',query:''},{source:'test'});
const off=mountReconfigurationAtlas(root,data,{locale:'zh-Hans',store});
let text=root.textContent||'';
for(const raw of ['BOOK_SECTION','LIVED_REALITY','MULTI_STATE_SYSTEM','CANONICAL_HISTORY','ECONOMIC_RECONFIGURATION','TECHNOLOGICAL_RECONFIGURATION'])assert.ok(!text.includes(raw),'raw enum leaked in zh search: '+raw);
store.set({activeLayer:'dossiers',dossierId:data.dossiers.dossiers?.find(d=>d.entityType==='MULTI_STATE_SYSTEM')?.id||data.dossiers.dossiers?.[0]?.id},{source:'test'});
text=root.textContent||'';
for(const raw of ['MULTI_STATE_SYSTEM','CONTRACT_READY_CURRENT_DATA_NOT_ADMITTED','NOT_CURRENT_DATA'])assert.ok(!text.includes(raw),'raw enum leaked in zh dossier: '+raw);
store.set({activeLayer:'snapshots',snapshotId:'WORLD_RECONFIGURATION_SNAPSHOT_2026'},{source:'test'});
assert.ok(root.querySelector('[data-resolver-state="MISSING"]'),'2026 must render explicit missing state while live probe is not admitted');
off?.();
console.log('PASS: B6-WEB-E canonical EN/zh-Hans labels, no tested raw enums, mobile-safe bounded rendering, keyboard semantics, lazy visuals and resolver gate.');
