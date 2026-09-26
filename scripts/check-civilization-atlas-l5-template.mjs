import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const slots=json('content/civilization-atlas/visuals/atlas-layer-template-slots-v1.json');
const projection=json('content/civilization-atlas/visuals/atlas-visual-projection-v1.json');
const world=json('content/civilization-atlas/snapshots/world-snapshots-v1.json');
const compositor=read('assets/js/pages/civilization-atlas/atlas-visual-projection.js');
const css=read('assets/css/civilization-atlas.css');

assert.equal(world.snapshots.length,15,'L5 must retain 15 canonical World snapshots.');

const l5=slots.layers.world;
assert.equal(l5.presentationMode,'TEMPLATE_COMPOSITOR');
assert.equal(l5.templateAssetRef,'VIS-B5-ATLAS-L5-TEMPLATE-BASE.webp');
assert.equal(l5.rules.singleTemplateForAllSnapshots,true);
assert.equal(l5.rules.bakedYear,false);
assert.equal(l5.rules.bakedCivilizationNames,false);
assert.equal(l5.rules.bakedCityNames,false);
assert.equal(l5.rules.noInventedGeographicCoordinates,true);
assert.deepEqual(l5.dynamicOverlay,['overview','map','civilizations','cities']);

const p5=projection.layers.find(x=>x.layerId==='world');
assert.equal(p5.mode,'TEMPLATE_BASE_PLUS_DYNAMIC_OVERLAY');
assert.ok(p5.poster,'L5 must use one generic template poster.');
assert.ok(!Object.prototype.hasOwnProperty.call(p5,'posters'),'L5 must not require 15 full-page snapshot posters.');
assert.equal(p5.poster.assetRef,'VIS-B5-ATLAS-L5-TEMPLATE-BASE.webp');

assert.ok(compositor.includes('function worldOverlay'),'L5 generic template overlay missing.');
assert.ok(compositor.includes("'WORLD_SNAPSHOT_ATMOSPHERE'"),'L5 must use accepted World atmosphere assets.');
assert.ok(compositor.includes("'CASE_HERO'"),'L5 civilization panel must use accepted case visuals.');
assert.ok(compositor.includes('data-template-slot="overview"'));
assert.ok(compositor.includes('data-template-slot="map"'));
assert.ok(compositor.includes('data-template-slot="civilizations"'));
assert.ok(compositor.includes('data-template-slot="cities"'));

assert.ok(css.includes('L5 generic World template compositor'),'L5 template CSS missing.');

console.log('L5 template gate PASS: one generic Template Base drives all 15 World snapshots with dynamic Registry + accepted visual overlays.');
