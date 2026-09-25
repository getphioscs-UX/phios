import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const shell=read('assets/js/pages/civilization-atlas/atlas-shell.js');
const timeline=read('assets/js/pages/civilization-atlas/timeline-renderer.js');
const cases=read('assets/js/pages/civilization-atlas/cases-renderer.js');
const comparison=read('assets/js/pages/civilization-atlas/comparison-renderer.js');
const world=read('assets/js/pages/civilization-atlas/world-slice-renderer.js');
const trajectories=read('assets/js/pages/civilization-atlas/trajectory-renderer.js');
const transitions=read('assets/js/pages/civilization-atlas/transition-renderer.js');
const loss=read('assets/js/pages/civilization-atlas/loss-renderer.js');
const staticVisual=read('assets/js/pages/civilization-atlas/atlas-static-visual.js');
const css=read('assets/css/civilization-atlas.css');
const rejection=json('content/civilization-atlas/evidence/b6-web-f-human-rejection-v1.json');

assert.equal(rejection.status,'HUMAN_REJECTED');
assert.equal(rejection.successor,'B6-WEB-FR2');

assert.ok(!comparison.includes('<table class="civ-atlas-table civ-comparison-matrix"'),'FR2 comparison must not regress to the rejected generic table.');
assert.ok(comparison.includes('class="civ-compare-matrix"'),'FR2 comparison board missing.');
assert.ok(comparison.includes('data-case-label='),'Mobile comparison cells must carry explicit civilization labels.');
assert.ok(css.includes('FR2 comparison board'),'FR2 comparison CSS missing.');
assert.ok(css.includes('grid-template-columns:minmax(11.5rem,14rem) repeat(var(--compare-cols),minmax(11rem,1fr))'),'Desktop comparison matrix must preserve a readable dimension column.');
assert.ok(css.includes('.civ-compare-matrix__cell::before{content:attr(data-case-label)'),'Mobile comparison must label each civilization cell.');
assert.ok(css.includes('@media(max-width:700px)'),'Comparison mobile breakpoint missing.');

for(const [name,source,family] of [
 ['timeline',timeline,'TIMELINE_ANCHOR'],
 ['cases',cases,'CASE_HERO'],
 ['world',world,'CASE_HERO'],
 ['trajectories',trajectories,'TRAJECTORY_MOTIF'],
 ['transitions',transitions,'TRANSITION_WINDOW'],
 ['loss',loss,'LOSS_FAMILY']
]){
 assert.ok(source.includes("resolveAtlasVisualById"),`${name} must consume the canonical Atlas visual resolver.`);
 assert.ok(source.includes(family),`${name} must activate ${family} inside its customer interface.`);
 assert.ok(source.includes('visualBindings'),`${name} must receive accepted visual bindings.`);
}
assert.ok(comparison.includes("resolveAtlasVisualById"),'comparison must consume the canonical Atlas visual resolver.');
assert.ok(comparison.includes("'COMPARISON_FAMILY'"),'comparison family visuals must be structural UI assets.');
assert.ok(comparison.includes("'CASE_HERO'"),'comparison representative cases must use case visuals.');

for(const token of [
 'renderTimeline(content,{registry:data.timeline,casesRegistry:data.cases,visualBindings:data.staticVisuals',
 'renderCases(content,{registry:data.cases,visualBindings:data.staticVisuals',
 'renderComparison(content,{registry:data.comparison,casesRegistry:data.cases,transitionsRegistry:data.transitions,worldRegistry:data.world,visualBindings:data.staticVisuals',
 'renderWorldSlice(content,{registry:data.world,casesRegistry:data.cases,visualBindings:data.staticVisuals',
 'renderTrajectories(content,{registry:data.trajectories,visualBindings:data.staticVisuals',
 'renderTransitions(content,{registry:data.transitions,visualBindings:data.staticVisuals',
 'renderLossAtlas(content,{registry:data.loss,casesRegistry:data.cases,visualBindings:data.staticVisuals'
]) assert.ok(shell.includes(token),`Shell missing FR2 visual binding: ${token}`);

assert.ok(staticVisual.includes("const componentOwned=new Set(['timeline','world','cases','comparison','trajectories','transitions','loss'])"),'All seven Book V layers must own their visuals inside the layer interface.');
assert.ok(css.includes('FR2 asset-led layer interfaces'),'FR2 asset-led CSS missing.');


assert.ok(cases.includes("'CASE_SECONDARY'"),'Active civilization cards must use accepted CASE_SECONDARY visuals when available.');
assert.ok(cases.includes('civ-case-secondary'),'CASE_SECONDARY must be projected as a customer-facing secondary visual layer.');
assert.ok(transitions.includes("'SCALE_SHIFT'"),'Transition scale shifts must use accepted SCALE_SHIFT visuals.');
assert.ok(transitions.includes('civ-scale-shift-card'),'Scale shifts must render as visual interface cards.');
assert.ok(css.includes('FR2 secondary case + scale shift visuals'),'FR2 secondary visual CSS missing.');


assert.ok(timeline.includes('civ-timeline__focus-visual'),'Timeline anchor visual must live inside the era reader.');
assert.ok(world.includes("'WORLD_SNAPSHOT_ATMOSPHERE'"),'World snapshot atmosphere must be consumed inside the World interface.');
assert.ok(world.includes('civ-world__globe'),'World snapshot visual must occupy the map field, not a detached hero.');
assert.ok(css.includes('FR2 atlas-board visual language'),'FR2 Atlas board theme missing.');
assert.ok(css.includes('--phi-action-knowledge:#d5b36c'),'FR2 Atlas board must retain the gold interaction language.');


assert.ok(comparison.includes('const factRows=['),'FR2 comparison must use case-specific fact rows.');
assert.ok(comparison.includes("'关联转型':'Linked transitions'"),'FR2 comparison must resolve linked transitions.');
assert.ok(comparison.includes("'世界横切面':'World snapshots'"),'FR2 comparison must resolve world snapshots.');
assert.ok(comparison.includes('civ-compare-dimension-grid'),'Comparison dimensions must be presented separately from case fact cells.');

console.log('B6-WEB-FR2 asset-led Atlas UI gate PASS: comparison board repaired and accepted visuals are structural layer components.');
