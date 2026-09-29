import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const cases=json('content/civilization-atlas/reconfiguration/reconfiguration-case-registry-v1.json');
const windows=json('content/civilization-atlas/reconfiguration/reconfiguration-windows-v1.json');
const snapshots=json('content/civilization-atlas/reconfiguration/world-reconfiguration-snapshots-v1.json');
const dossiers=json('content/civilization-atlas/reconfiguration/contemporary-runtime-dossiers-v1.json');
const lived=json('content/civilization-atlas/reconfiguration/lived-reality-dimensions-v1.json');
const relationships=json('content/civilization-atlas/reconfiguration/book-vi-atlas-relationships-v2.json');
const visuals=json('content/civilization-atlas/reconfiguration/book-vi-visual-asset-status-v1.json');
const renderer=read('assets/js/pages/civilization-atlas/reconfiguration-renderer.js');
const state=read('assets/js/pages/civilization-atlas/atlas-state.js');
const css=read('assets/css/civilization-atlas.css');

assert.equal(cases.cases.length,60);
assert.equal(windows.windows.length,24);
assert.equal(snapshots.snapshots.length,12);
assert.equal(dossiers.dossiers.length,12);
assert.equal(lived.dimensions.length,14);
assert.equal(relationships.relationships.length,85);
assert.equal(visuals.coreSummary.present,23);
assert.equal(visuals.coreSummary.missing,0);
assert.equal(visuals.coreSummary.unverified,0);

assert.ok(renderer.includes("['cases',l==='zh-Hans'?'重组案例':'Cases']"));
assert.ok(renderer.includes("['windows',l==='zh-Hans'?'重组窗口':'Windows']"));
assert.ok(renderer.includes("['snapshots',l==='zh-Hans'?'世界变化':'World shifts']"));
assert.ok(renderer.includes("['dossiers',l==='zh-Hans'?'当前档案':'Current dossiers']"));
assert.ok(renderer.includes("['lived',l==='zh-Hans'?'日常现实':'Lived reality']"));
assert.ok(!renderer.includes("['visuals',c.visuals]"));
assert.ok(!renderer.includes("['timeline',c.timeline]"));
assert.ok(!renderer.includes("['overview',c.overview]"));

assert.ok(state.includes("legacyLayerMap={overview:'cases',timeline:'windows',visuals:'snapshots'}"));
assert.ok(state.includes("activeLayer:'cases'"));

for(const token of ['civ-reconfig-case-reader','原有结构','触发与压力','结构变化','继任结构','可观察结果','Evidence & unknown']) assert.ok(renderer.includes(token),'Case reader missing: '+token);
assert.ok(!renderer.includes("<small>${esc(x.id)} · ${badge(x.knowledgeState||x.dataClass,l)}</small>"));

for(const token of ['civ-reconfig-window-reader','重组时间脊柱','Before','Pressure','During','After']) assert.ok(renderer.includes(token),'Window reader missing: '+token);
for(const token of ['civ-reconfig-shift-reader','World shifts','New in this snapshot','Continuing','Leaving by next snapshot']) assert.ok(renderer.includes(token),'World shift reader missing: '+token);
for(const token of ['civ-reconfig-dossier-reader','Current configuration','Historical formation','Current pressures','Active reconfiguration','Observed signals','Not yet known','Conditional projection']) assert.ok(renderer.includes(token),'Dossier reader missing: '+token);
const dossierBlock=renderer.slice(renderer.indexOf('function renderDossiers('),renderer.indexOf('function renderLived('));
assert.ok(!dossierBlock.includes('hydrateDossierRuntimeReadout'));

for(const token of ['civ-reconfig-lived-reader','Lived reality','livingEnvironment','employmentOpportunity','incomeCostBalance','housingPressure','personalFutureCapacity']) assert.ok(renderer.includes(token),'Lived reality reader missing: '+token);
assert.ok(renderer.includes('otherDims=dims.filter'));

assert.equal((visuals.assets||[]).filter(a=>a.kind==='STATIC_ATLAS_BASE_VISUAL'&&a.status==='PRESENT').length,12);
for(const fig of ['FIG_13A','FIG_13B','FIG_13C','FIG_13D','FIG_13E','FIG_13F','FIG_13G','FIG_13H']) assert.ok(visuals.assets.some(a=>a.assetId===fig&&a.status==='PRESENT'),fig+' must remain present');
assert.ok(renderer.includes('Related figure')&&renderer.includes('相关图解'));

for(const marker of ['B6-FR1-W1-W2 reconfiguration customer reader','B6-FR1-W3 reconfiguration window reader','B6-FR1-W4 world shift compare reader','B6-FR1-W5 current runtime dossier reader','B6-FR1-W6 lived reality contextual reader']) assert.ok(css.includes(marker),'Missing responsive customer CSS: '+marker);

console.log('B6-FR1 W1-W8 PASS: five customer readers are active over the complete Book VI data baseline and 23/23 core visuals remain present without a gallery entry.');
