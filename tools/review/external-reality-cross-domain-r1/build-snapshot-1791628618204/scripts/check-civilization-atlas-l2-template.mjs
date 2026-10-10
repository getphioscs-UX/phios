import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const periods=json('content/civilization-atlas/timeline/timeline-periods-v1.json');
const macro=json('content/civilization-atlas/timeline/timeline-macro-eras-v1.json');
const slots=json('content/civilization-atlas/visuals/atlas-layer-template-slots-v1.json');
const compositor=read('assets/js/pages/civilization-atlas/atlas-visual-projection.js');
const page=read('assets/js/pages/civilization-atlas.js');
const css=read('assets/css/civilization-atlas.css');

assert.equal(macro.status,'PRESENTATION_ONLY');
assert.equal(macro.authority.changesCanonicalPeriodIdentity,false);
assert.equal(macro.authority.changesHistoricalClaims,false);
assert.equal(macro.macroEras.length,11,'L2 must keep eleven macro-era presentation columns.');

const canonicalIds=periods.periods.map(p=>p.periodId).sort();
const groupedIds=macro.macroEras.flatMap(m=>m.periodIds||[]);
assert.equal(new Set(groupedIds).size,groupedIds.length,'A canonical period may not appear in more than one macro era.');
assert.deepEqual([...groupedIds].sort(),canonicalIds,'L2 macro eras must cover T00–T19 exactly once.');

for(const m of macro.macroEras){
  assert.ok(m.macroEraId,'Macro era missing id.');
  assert.ok(m.title?.en&&m.title?.['zh-Hans'],`${m.macroEraId} missing bilingual title`);
  assert.ok(m.periodIds.length>=1,`${m.macroEraId} must contain canonical periods`);
  const owned=m.periodIds.map(id=>periods.periods.find(p=>p.periodId===id));
  assert.ok(owned.every(Boolean),`${m.macroEraId} references an unknown canonical period`);
  assert.equal(m.startYear,owned[0].startYear,`${m.macroEraId} startYear must come from first canonical period`);
  assert.equal(m.endYear,owned.at(-1).endYear,`${m.macroEraId} endYear must come from last canonical period`);
}

const l2=slots.layers.timeline;
assert.equal(l2.templateAssetRef,'VIS-B5-ATLAS-L2-TIMELINE-TEMPLATE-BASE.webp');
for(const slot of ['headerTitle','timelineSpine','overviewMatrix','footerCaption']){
  assert.ok(l2.slots[slot],`L2 missing template slot: ${slot}`);
  assert.ok(l2.dynamicOverlay.includes(slot),`L2 slot not admitted for dynamic overlay: ${slot}`);
}
assert.equal(l2.rules.fixedPeriodColumns,false);
assert.equal(l2.rules.periodCountComesFromRegistry,true);
assert.equal(l2.rules.bilingualTextFromHtml,true);

assert.ok(page.includes('loadTimelineMacroRegistry'),'Atlas page must load the L2 presentation registry.');
assert.ok(page.includes('timelineMacro:null'),'Atlas runtime must carry timelineMacro data.');
assert.ok(page.includes('onStateChange:(patch,meta)=>store.set(patch,meta)'),'Template compositor must be allowed to update canonical Atlas state.');

assert.ok(compositor.includes('function timelineOverlay'),'L2 template compositor missing timeline overlay.');
assert.ok(compositor.includes('data-template-slot="headerTitle"'));
assert.ok(compositor.includes('data-template-slot="timelineSpine"'));
assert.ok(compositor.includes('data-template-slot="overviewMatrix"'));
assert.ok(compositor.includes('data-template-slot="footerCaption"'));
assert.ok(compositor.includes("source:'template-macro-era'"),'Macro Era click must enter canonical period state.');

assert.ok(css.includes('/* L2 template compositor */'),'L2 overlay CSS missing.');
assert.ok(css.includes('grid-template-columns:repeat(11'),'L2 must retain eleven macro-era columns at the presentation level.');

console.log('L2 template compositor gate PASS: 11 Macro Eras cover T00–T19 exactly once and render through four registered dynamic slots.');
