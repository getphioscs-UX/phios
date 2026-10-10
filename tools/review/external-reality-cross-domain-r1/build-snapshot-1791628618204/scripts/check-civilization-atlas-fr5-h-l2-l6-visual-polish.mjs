import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const compositor=read('assets/js/pages/civilization-atlas/atlas-visual-projection.js');
const css=read('assets/css/civilization-atlas.css');
const evidence=JSON.parse(read('content/civilization-atlas/evidence/civ-atlas-fr5-h-l2-l6-visual-polish-v1.json'));

assert.equal(evidence.status,'IMPLEMENTED_READY_FOR_HUMAN_REVIEW');
assert.ok(compositor.includes('civ-template-slot--timeline-summary'),'L2 active era summary missing.');
assert.ok(compositor.includes('civ-template-timeline-summary__periods'),'L2 period summary list missing.');
assert.ok(!compositor.includes('civ-template-matrix-row civ-template-matrix-row--head'),'Dense L2 matrix must be removed.');
assert.ok(compositor.includes('civ-template-trajectory-head'),'L6 graph header missing.');
assert.ok(compositor.includes('Relative index · not a unified civilization score'),'L6 reading note missing.');
assert.ok(compositor.includes('civ-template-trajectory-range'),'L6 start/end range missing.');
assert.ok(compositor.includes('civ-template-trajectory-legend'),'L6 legend missing.');

assert.ok(css.includes('CIV-ATLAS-FR5-H L2/L6 customer visual polish'),'FR5-H CSS missing.');
assert.ok(css.includes('.civ-template-slot--timeline-spine .civ-template-macro-grid{display:flex'),'L2 horizontal era rail styling missing.');
assert.ok(css.includes('.civ-template-slot--trajectory-detail{display:grid'),'L6 detail graph hierarchy missing.');

console.log('CIV-ATLAS-FR5-H PASS: L2 is a browsable era rail with active summary and L6 is a labeled readable trajectory chart.');
