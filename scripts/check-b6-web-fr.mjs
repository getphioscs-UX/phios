import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {normalizeArticleForRenderer} from '../assets/js/knowledge/article-blocks.js';
import {setLocale} from '../assets/js/i18n.js';
import {createReconfigurationAtlasState,RECONFIG_ATLAS_LAYERS} from '../assets/js/pages/civilization-atlas/atlas-state.js';
import {mountReconfigurationAtlas} from '../assets/js/pages/civilization-atlas/reconfiguration-renderer.js';
import {resolveAtlasVisualById} from '../assets/js/pages/civilization-atlas/atlas-static-visual.js';
import {loadAcceptedDossier,clearAtlasDataCache} from '../assets/js/pages/civilization-atlas/atlas-data.js';
import {buildBook6DossierRreProjection} from './lib/civilization-atlas/book6-rre-adapter-v1.mjs';

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
assert.match(renderer,/hydrateDossierRuntimeReadout/);
// The renderer delegates retrieval to the shared source loader. Verify the
// complete call chain, including dossier identity and failure boundaries.
const atlasData=fs.readFileSync('assets/js/pages/civilization-atlas/atlas-data.js','utf8');
assert.match(renderer,/import\s*\{loadAcceptedDossier\}\s*from\s*'\.\/atlas-data\.js'/);
assert.match(renderer,/await loadAcceptedDossier\(dossier\.id\)/);
assert.match(atlasData,/export async function loadAcceptedDossier\(id\)/);
assert.match(atlasData,/const path='\/api\/book6-runtime-readout\?dossier='\+encodeURIComponent\(id\)/);
assert.match(atlasData,/fetch\(path,JSON_HEADERS\)/);
assert.match(atlasData,/if\(!r\.ok\)throw Error\('ATLAS_DATA_HTTP_'\+r\.status\)/);
assert.match(atlasData,/body\.ok&&body\.projection\?\.dossierId!==id/);
assert.match(atlasData,/BOOK6_DOSSIER_IDENTITY_MISMATCH/);
assert.match(atlasData,/ACCEPTED_CACHE\.delete\(path\)/);
// Exercise the delegated loader with an isolated, network-free transport.
const originalFetch=globalThis.fetch,sourceRequests=[];
try{
 for(const [status,body,expected] of [
  [200,{ok:true,projection:{dossierId:'DOSSIER-US'}},'ACCEPTED_SCOPE'],
  [200,{ok:true,projection:{dossierId:'DOSSIER-EU'}},'SERVICE_ERROR'],
  [404,{ok:false},'NOT_ACTIVATED'],
  [503,{ok:false},'SERVICE_ERROR']
 ]){
  clearAtlasDataCache();
  globalThis.fetch=async(url,options)=>{sourceRequests.push({url,options});return Response.json(body,{status});};
  const loaded=await loadAcceptedDossier('DOSSIER-US');
  assert.equal(loaded.currentLoadState,expected);
  if(expected==='ACCEPTED_SCOPE')assert.equal(loaded.acceptedCurrent.dossierId,'DOSSIER-US');
  else assert.equal(loaded.acceptedCurrent,null,'wrong identity and failed sources must never become admitted projections');
 }
 assert.equal(sourceRequests.length,4);
 for(const request of sourceRequests){assert.equal(request.url,'/api/book6-runtime-readout?dossier=DOSSIER-US');assert.equal(request.options.headers.Accept,'application/json');assert.equal(request.options.method,undefined,'source lookup uses GET, never a write');}
}finally{globalThis.fetch=originalFetch;clearAtlasDataCache();}
assert.match(renderer,/data-runtime-readout/);
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
const rreRegistries={
 inputContract:read('content/runtime/reality-readout-engine/contracts/reality-readout-input-contract-v1.json'),
 dimensionRegistry:read('content/runtime/reality-readout-engine/registries/canonical-observable-dimension-registry-v1.json'),
 signatureRegistry:read('content/runtime/reality-readout-engine/registries/canonical-runtime-signature-role-registry-v1.json'),
 patternRegistry:read('content/runtime/reality-readout-engine/registries/canonical-pattern-runtime-registry-v1.json'),
 constraintRegistry:read('content/runtime/reality-readout-engine/registries/canonical-constraint-reading-class-registry-v1.json'),
 loadRegistry:read('content/runtime/reality-readout-engine/registries/canonical-load-reading-state-registry-v1.json'),
 stabilityRegistry:read('content/runtime/reality-readout-engine/registries/canonical-stability-reading-registry-v1.json'),
 driftRegistry:read('content/runtime/reality-readout-engine/registries/canonical-drift-reading-registry-v1.json'),
 recoveryRegistry:read('content/runtime/reality-readout-engine/registries/canonical-recovery-reading-registry-v1.json'),
 resolutionRegistry:read('content/runtime/reality-readout-engine/registries/canonical-resolution-limit-registry-v1.json'),
 confidenceRegistry:read('content/runtime/reality-readout-engine/registries/canonical-confidence-runtime-registry-v1.json'),
 rmoConstraintRegistry:read('content/runtime/reality-model-runtime/registries/canonical-constraint-type-registry-v1.json'),
 rmoUnknownRegistry:read('content/runtime/reality-model-runtime/registries/canonical-unknown-kind-registry-v1.json'),
 successorRegistry:read('content/governance/reality-data-governance/extensions/rre-readout/registries/rre-readout-data-contract-successor-v1.json'),
 targetRegistry:read('content/runtime/reality-readout-engine/registries/rre-cpr-projection-target-registry-v1.json'),
 cprSurfaceRegistry:read('content/professional/canonical-presentation-runtime/registries/cpr-surface-projection-registry-v1.json')
};

assert.equal(data.visualBindings.assets.length,392,'accepted Civilization Atlas binding census drifted');
const resolved=data.visualBindings.assets.map(a=>resolveAtlasVisualById(data.visualBindings,a.assetId)).filter(Boolean);
assert.equal(resolved.length,392,'all 392 accepted Civilization Atlas bindings must resolve through the existing resolver');

const dossierRre=(data.dossiers.dossiers||[]).map(dossier=>buildBook6DossierRreProjection({dossier,cases:data.cases.cases||[],registries:rreRegistries}));
assert.equal(dossierRre.length,12,'all initial Book VI dossier targets must have a canonical RRE adapter projection');
for(const projection of dossierRre){
 assert.equal(projection.dataClass,'DERIVED_RUNTIME_READOUT');
 assert.equal(projection.currentDataAdmitted,false);
 assert.equal(projection.readoutState,'EVIDENCE_GATE_OPEN');
 assert.equal(projection.confidenceClass,'UNKNOWN');
 assert.ok(projection.resolutionLimitKinds.includes('INPUT_DATA_QUALITY_UNKNOWN'));
 assert.ok(projection.resolutionLimitKinds.includes('MISSING_REQUIRED_INPUT_AUTHORITY'));
 assert.equal(projection.cprHandoff.target.targetCode,'WPR');
 assert.equal(projection.cprHandoff.surfaceActivatedByRre,false);
 assert.equal(projection.boundaries.currentFactsInvented,false);
 assert.equal(projection.boundaries.missingEvidenceFilledByInference,false);
}
const endpointSource=fs.readFileSync('functions/api/book6-runtime-readout.js','utf8');
const adapterSource=fs.readFileSync('scripts/lib/civilization-atlas/book6-rre-adapter-v1.mjs','utf8');
// Accepted current projections supersede the predecessor RRE builder at the
// public endpoint; the historical adapter contracts below remain required.
const currentSource=fs.readFileSync('functions/_lib/book6-current-source.js','utf8');
assert.match(endpointSource,/import \{getAcceptedBook6Projection\} from '\.\.\/_lib\/book6-current-source\.js'/);
assert.match(endpointSource,/import \{publicBook6ProviderBoundary\} from '\.\.\/_lib\/book6-public-provider-boundary\.js'/);
assert.match(endpointSource,/publicBook6ProviderBoundary\(getAcceptedBook6Projection\(id\)\)/);
assert.match(endpointSource,/BOOK6_ACCEPTED_DOSSIER_NOT_FOUND/);
assert.match(endpointSource,/status:404/);
assert.match(currentSource,/export function getAcceptedBook6Projection\(id,/);
assert.match(currentSource,/rows\.find\(r=>r\.accepted\.dossierId===id\)/);
assert.match(currentSource,/row\?projectAcceptedBook6Current\(/);
assert.match(adapterSource,/buildCanonicalRuntimeReadout/);
assert.match(adapterSource,/RRE-READOUT-B6-/);
assert.match(adapterSource,/targetCodes:\['WPR'\]/);
assert.doesNotMatch(endpointSource,/with\s*\{\s*type\s*:\s*['"]json['"]\s*\}/);

const {document}=parseHTML('<html><head></head><body><main data-civilization-atlas-root data-atlas-mode="reconfiguration"></main></body></html>');
globalThis.document=document;globalThis.window=document.defaultView;
globalThis.dispatchEvent=document.defaultView.dispatchEvent.bind(document.defaultView);
globalThis.CustomEvent=document.defaultView.CustomEvent;
// LinkeDOM exposes a getter-only select.value. Model the browser setter in
// the DOM fixture, without changing runtime code or disabling assertions.
const selectPrototype=document.defaultView.HTMLSelectElement.prototype;
const selectValue=Object.getOwnPropertyDescriptor(selectPrototype,'value');
if(!selectValue?.set)Object.defineProperty(selectPrototype,'value',{
 configurable:true,get:selectValue.get,
 set(value){for(const option of this.options)option.selected=option.value===String(value);}
});
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
assert.equal(store.get().activeLayer,'snapshots','legacy visuals entry must resolve to the accepted Book VI snapshot surface');
assert.equal(data.visualBindings.assets.length,392,'the inherited visual census must remain intact');
assert.equal(data.visualBindings.assets.filter(a=>a.family==='WORLD_RECONFIGURATION_SNAPSHOT').length,12,'Book VI retains its exact twelve bound snapshots');
assert.equal(root.querySelectorAll('.is-current [data-snapshot-image]').length,1,'exactly one current snapshot must be shown');
assert.equal(root.querySelectorAll('[data-snapshot-image]').length,2,'initial snapshot comparison renders current and next only, not all twelve or 392 assets');
off?.();

store=createReconfigurationAtlasState({locale:'zh-Hans',activeLayer:'dossiers',dossierId:'DOSSIER-US'});
off=mountReconfigurationAtlas(root,data,{locale:'zh-Hans',store});
text=root.textContent||'';
assert.ok(text.includes('未接入通过时效性验收的当前值，因此不生成数值预测'),'unadmitted dossier must retain the explicit no-forecast evidence boundary');
assert.ok(!text.includes('运行阶段\n未知'),'unadmitted dossier must not present a wall of repeated UNKNOWN runtime fields');
off?.();

store=createReconfigurationAtlasState({locale:'zh-Hans',activeLayer:'lived',dossierId:'DOSSIER-US'});
off=mountReconfigurationAtlas(root,data,{locale:'zh-Hans',store});
assert.ok((root.textContent||'').includes('当前数值层尚未验收'),'unadmitted lived reality must present its current-value evidence boundary');
assert.equal(root.querySelectorAll('.civ-reconfig-lived-key .civ-reconfig-lived-card').length,5,'the accepted bounded structural reading remains available without inventing live values');
assert.equal(root.querySelectorAll('.civ-reconfig-card').length,0,'unadmitted lived reality must not render fourteen UNKNOWN cards');
off?.();

const human=read('content/civilization-atlas/reconfiguration/book-vi-atlas-human-acceptance-v2.json');
const browser=read('content/civilization-atlas/reconfiguration/book-vi-atlas-browser-acceptance-v2.json');
const cutover=read('content/civilization-atlas/reconfiguration/b6-web-f-final-browser-human-cutover-v1.json');
assert.notEqual(human.status,'ACCEPTED','repair must not fabricate human acceptance');
assert.notEqual(browser.status,'ACCEPTED','repair must not fabricate browser acceptance');
assert.equal(cutover.completionBoundary?.completeClaimAllowed,false);
assert.equal(cutover.completionBoundary?.cutover,'BLOCKED');

console.log('PASS: B6-WEB-FR repairs article admission, Atlas card ownership, zh-Hans structural copy, 392-visual customer projection, canonical RRE→CPR/WPR dossier adapter and bounded unadmitted-current-data presentation without fabricating final acceptance.');
