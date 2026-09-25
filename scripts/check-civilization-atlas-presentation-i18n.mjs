import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const world=json('content/civilization-atlas/snapshots/world-snapshots-v1.json');
for(const snapshot of world.snapshots||[]){
  for(const group of snapshot.regionalGroups||[]){
    const zh=group.label?.['zh-Hans']||'';
    assert.ok(/[\u3400-\u9fff]/.test(zh), `${snapshot.snapshotId} region ${group.regionId} has non-Chinese zh-Hans label: ${zh}`);
    assert.notEqual(zh,group.label?.en,`${snapshot.snapshotId} region ${group.regionId} duplicates English label in zh-Hans`);
  }
}

const shell=read('assets/js/pages/civilization-atlas/atlas-shell.js');
const timeline=read('assets/js/pages/civilization-atlas/timeline-renderer.js');
const worldRenderer=read('assets/js/pages/civilization-atlas/world-slice-renderer.js');
const cases=read('assets/js/pages/civilization-atlas/cases-renderer.js');
const comparison=read('assets/js/pages/civilization-atlas/comparison-renderer.js');

for(const [name,source] of [['shell',shell],['timeline',timeline],['world',worldRenderer],['cases',cases],['comparison',comparison]]){
  assert.ok(!/Poster asset|图谱海报引用/.test(source),`${name} leaks poster asset reference in customer UI`);
}
assert.ok(!/知识状态|Knowledge state/.test(timeline),'Timeline should not foreground knowledge-state enum.');
assert.ok(!/知识状态|Knowledge state/.test(worldRenderer),'World should not foreground knowledge-state enum.');
assert.ok(!/knowledge-eyebrow[^\n]*caseId/.test(cases),'Cases should not foreground raw case ID.');
assert.ok(!/knowledge-eyebrow[^\n]*familyId/.test(comparison),'Comparison should not foreground raw family ID.');
assert.ok(!/relationType/.test(comparison),'Comparison customer view should not render raw relationType.');
assert.ok(timeline.includes('civ-atlas-detail-table'),'Timeline full table must be progressive disclosure.');
assert.ok(worldRenderer.includes('civ-atlas-evidence-note'),'World evidence boundary must be progressive disclosure.');
assert.ok(cases.includes('civ-atlas-evidence-note'),'Case evidence boundary must be progressive disclosure.');

console.log('Civilization Atlas presentation + zh-Hans i18n gate PASS.');
