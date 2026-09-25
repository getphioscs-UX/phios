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
assert.ok(worldRenderer.includes('loc(selected.technologyContext,lang)'),'World technology context must read the localized object directly.');
assert.ok(worldRenderer.includes('loc(selected.energyContext,lang)'),'World energy context must read the localized object directly.');
assert.ok(!timeline.includes("(p.caseIds||[]).join(','"),'Timeline table must not expose raw case ID lists.');
assert.ok(!shell.includes("state.time!==null?"),'Atlas context strip must not expose unformatted raw year state.');
assert.ok(cases.includes('civ-atlas-evidence-note'),'Case evidence boundary must be progressive disclosure.');


const reconfig=read('assets/js/pages/civilization-atlas/reconfiguration-renderer.js');
assert.ok(reconfig.includes("const tabs=[['overview',c.overview],['cases',c.cases],['timeline',c.timeline],['snapshots',c.snapshots],['lived',c.lived],['compare',c.compare]]"),'Book VI primary navigation must stay reduced to six customer reading views.');
assert.ok(reconfig.includes("const tools=[['search',c.search],['windows',c.windows],['dossiers',c.dossiers],['visuals',c.visuals],['dossiercompare',c.compareRuntime]]"),'Book VI secondary tools must remain available behind More tools.');
assert.ok(reconfig.includes('civ-reconfig-more'),'Book VI secondary navigation must use progressive disclosure.');


const firstScreenOrder=[
  shell.indexOf('data-atlas-primary-visual'),
  shell.indexOf('data-atlas-layer-content'),
  shell.indexOf('data-atlas-structured-section'),
  shell.indexOf('data-atlas-visual-resources')
];
assert.ok(firstScreenOrder.every(x=>x>=0),'Atlas first-screen composition placeholders must all exist.');
assert.deepEqual([...firstScreenOrder].sort((a,b)=>a-b),firstScreenOrder,'Atlas first screen must order primary visual → readable content → structured view → visual resources.');
assert.ok(shell.includes('civ-atlas-secondary'),'Structured data view must be progressive disclosure.');

const staticVisual=read('assets/js/pages/civilization-atlas/atlas-static-visual.js');
assert.ok(staticVisual.includes("img.loading='eager'"),'Primary Atlas visual must load eagerly.');
assert.ok(staticVisual.includes("fetchpriority','high'"),'Primary Atlas visual must receive high fetch priority.');
assert.ok(staticVisual.includes("details.className='civ-atlas-visual-resources'"),'Related visuals and full library must remain secondary.');
assert.ok(staticVisual.includes("const [primary,...related]=assets"),'Only one context visual may own the primary slot.');

assert.ok(timeline.includes('casesRegistry'),'Timeline must resolve real civilization titles from the case registry.');
assert.ok(timeline.includes('caseMap.get(id)'),'Timeline representative civilizations must use human-readable titles, not generated ordinal labels.');

console.log('Civilization Atlas presentation + zh-Hans i18n gate PASS.');
