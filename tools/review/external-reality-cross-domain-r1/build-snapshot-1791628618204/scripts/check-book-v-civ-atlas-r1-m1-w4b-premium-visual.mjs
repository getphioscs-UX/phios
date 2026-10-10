import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const visual=read('assets/js/pages/civilization-atlas/atlas-structured-visual.js');

for(const token of [
  '--atlas-navy','--atlas-gold','--atlas-gold-soft','radial-gradient','linear-gradient',
  'atlasSoftGlow','civ-structured__badge','civ-svg-interactive',
  'data-structured-layer="timeline"','data-structured-layer="cases"',
  'data-structured-layer="comparison"','data-structured-layer="world"',
  'data-structured-layer="trajectories"','data-structured-layer="transitions"',
  'data-structured-layer="loss"'
]) assert.ok(visual.includes(token),`W4B visual-language token missing: ${token}`);

assert.ok(visual.includes('Comparison Family Network'),'comparison network visual missing');
assert.ok(visual.includes('Schematic world civilization network'),'world schematic network visual missing');
assert.ok(visual.includes('Network view'),'world non-geographic boundary label missing');
assert.ok(visual.includes('EVIDENCE_SERIES')&&visual.includes('HISTORICAL_RECONSTRUCTION')&&visual.includes('CONCEPTUAL_TRAJECTORY'),'trajectory authority grammar missing');
assert.ok(visual.includes('prefers-reduced-motion'),'reduced-motion contract missing');
assert.ok(visual.includes('forced-colors'),'forced-colors contract missing');
assert.ok(!visual.includes('<img'),'W4B must remain independent of raster posters');
assert.ok(!visual.includes('/images/atlas/'),'W4B must not restore R2 Atlas image dependency');
for(const forbidden of ['civilizationScore','collapseScore','superiorityScore','overallWinner']) assert.ok(!visual.includes(forbidden),`forbidden score token: ${forbidden}`);

console.log('✓ BOOK-V-CIV-ATLAS-R1-M1-W4B Premium Dynamic Visual Styling passed.');
console.log('  WebP visual language is translated into HTML/SVG/CSS; raster posters remain non-required.');
