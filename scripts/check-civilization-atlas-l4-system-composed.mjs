import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const slots=json('content/civilization-atlas/visuals/atlas-layer-template-slots-v1.json');
const projection=json('content/civilization-atlas/visuals/atlas-visual-projection-v1.json');
const registry=json('content/civilization-atlas/comparison/comparison-families-v1.json');
const comparison=read('assets/js/pages/civilization-atlas/comparison-renderer.js');
const css=read('assets/css/civilization-atlas.css');

assert.equal(registry.families.length,6,'L4 must expose six comparison families.');
assert.ok(registry.families.every(f=>(f.crossFamilyRelations||[]).length>0),'Every L4 family must retain cross-family relations.');

const l4=slots.layers.comparison;
assert.equal(l4.presentationMode,'SYSTEM_COMPOSED_FROM_ASSETS');
assert.equal(l4.rules.templateWebPRequired,false);
assert.equal(l4.rules.relationGraphDynamic,true);
assert.equal(l4.rules.comparisonMatrixDynamic,true);
assert.deepEqual(l4.sourceVisualFamilies,['COMPARISON_FAMILY','CASE_HERO']);

const p4=projection.layers.find(x=>x.layerId==='comparison');
assert.equal(p4.mode,'SYSTEM_COMPOSED_FROM_ASSETS');
assert.ok(!Object.prototype.hasOwnProperty.call(p4,'poster'),'L4 must not retain a poster/template dependency.');

assert.ok(comparison.includes('graphPositions'),'L4 relation graph must be system-generated.');
assert.ok(comparison.includes('graphEdges'),'L4 must derive visible relations from crossFamilyRelations.');
assert.ok(comparison.includes('civ-family-network-graph__links'),'L4 SVG relation layer missing.');
assert.ok(comparison.includes("'COMPARISON_FAMILY'"),'L4 family nodes must use accepted comparison visuals.');
assert.ok(comparison.includes("'CASE_HERO'"),'L4 representative civilizations must use accepted case visuals.');
assert.ok(comparison.includes('civ-compare-matrix'),'L4 dynamic comparison matrix missing.');

assert.ok(css.includes('L4 system-generated comparison relation network'),'L4 relation-network CSS missing.');
assert.ok(css.includes('.civ-family-network-graph__links{display:none}'),'L4 mobile must suppress unreadable relationship lines.');
assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'),'L4 mobile/tablet fallback grid missing.');

console.log('L4 system-composed gate PASS: six comparison families render as a dynamic SVG relationship network + HTML comparison matrix with no Template WebP dependency.');
