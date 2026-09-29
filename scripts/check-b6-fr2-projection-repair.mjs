import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const figurePage=read('figure.html');
const figureCss=read('assets/css/knowledge-release.css');
const renderer=read('assets/js/pages/civilization-atlas/reconfiguration-renderer.js');
const atlasCss=read('assets/css/civilization-atlas.css');
const state=read('assets/js/pages/civilization-atlas/atlas-state.js');
const dossiers=json('content/civilization-atlas/reconfiguration/contemporary-runtime-dossiers-v1.json');
const lived=json('content/civilization-atlas/reconfiguration/lived-reality-dimensions-v1.json');

assert.ok(!figurePage.includes('<section class="ks-hero"'),'Figure detail page must not render the generic hero above the canonical figure.');
assert.ok(figurePage.includes('figure-detail-page'),'Figure detail page must use the de-duplicated detail shell.');
assert.ok(figureCss.includes('B6-FR2-A figure detail de-duplication'),'Figure detail de-duplication CSS missing.');

assert.ok(atlasCss.includes('B6-FR2-B contrast and action normalization'),'Book VI contrast normalization missing.');
assert.ok(atlasCss.includes('--b6-text:#eef3f6'),'Readable Book VI primary text token missing.');
assert.ok(atlasCss.includes('--b6-text-soft:#c7d2da'),'Readable Book VI secondary text token missing.');

assert.ok(renderer.includes('changeFallback=zh'),'Case structural-change fallback must provide readable known scope before the evidence boundary.');
assert.ok(renderer.includes('consequenceFallback=zh'),'Case consequence fallback must state the registered successor before limiting quantitative claims.');
assert.ok(renderer.includes("id+' · '+(zh?'相关图解':'Related figure')"),'Related figure links must include the concrete figure ID.');

assert.equal(dossiers.dossiers.length,12);
assert.ok(renderer.includes('knownBackground=uniq(recentHistorical.map'),'Current dossiers must project known historical structure before current data admission.');
assert.ok(renderer.includes('最近已登记历史节点')&&renderer.includes('Latest registered historical node'),'Current dossier historical fallback missing.');
assert.ok(renderer.includes('当前资料层尚未验收')&&renderer.includes('current-data layer has not yet been admitted'),'Current evidence boundary must remain explicit.');

assert.equal(lived.dimensions.length,14);
assert.ok(renderer.includes('const LIVED_GUIDE=Object.freeze'),'Lived-reality reading guide missing.');
for(const id of ['livingEnvironment','employmentOpportunity','incomeCostBalance','housingPressure','personalFutureCapacity']) assert.ok(renderer.includes(id+':{'),id+' reading guide missing');
assert.ok(!renderer.includes("zh?'等待当前资料':'Awaiting current evidence'"),'Primary lived-reality cards must not repeat empty waiting-state copy.');

assert.ok(state.includes("activeLayer:'windows'"),'Book VI default customer entry must be reconfiguration windows.');
assert.ok(renderer.includes("const tabs=[['windows'"),'Windows must be the first primary navigation entry.');
assert.ok(renderer.includes("['snapshots',l==='zh-Hans'?'世界变化':'World shifts']"),'World shifts must remain the second primary entry.');

console.log('B6-FR2 PASS: duplicate figure hero removed, contrast normalized, thin case/dossier/lived projections repaired, and mature windows/world-shifts are prioritized.');
