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


const timelineFocus=timeline.indexOf('civ-timeline__focus--reader');
const timelineNav=timeline.indexOf('civ-timeline__navigator');
assert.ok(timelineFocus>=0&&timelineNav>timelineFocus,'Timeline must present the current era before the period navigator.');
const worldReader=worldRenderer.indexOf('civ-world__slice--reader');
const worldNav=worldRenderer.indexOf('civ-world__navigator');
assert.ok(worldReader>=0&&worldNav>worldReader,'World must present the current snapshot before the snapshot navigator.');
assert.ok(worldRenderer.includes('civ-world__featured'),'World reader must foreground representative civilizations.');
assert.ok(worldRenderer.includes('civ-world__deep-dive'),'World map and networks must use progressive disclosure.');
assert.ok(worldRenderer.indexOf('civ-world__featured')<worldRenderer.indexOf('civ-world__deep-dive'),'Representative civilizations must appear before deep world data.');
assert.ok(timeline.includes('About this periodization')||timeline.includes('关于这个分期'),'Timeline evidence note must remain secondary.');


assert.ok(cases.includes('const PAGE=12'),'Civilizations must retain a bounded first batch.');
assert.ok(cases.includes('data-case-more'),'Civilizations must progressively reveal additional cases.');
assert.ok(cases.includes("visible+PAGE"),'Civilizations show-more must advance by bounded batches.');
assert.ok(comparison.includes('const PAGE=12'),'Comparison families must retain a bounded first batch.');
assert.ok(comparison.includes('data-family-more'),'Comparison families must progressively reveal additional civilizations.');
assert.ok(comparison.includes("basket.length>=2?' open':''"),'Comparison matrix should auto-open only after an intentional multi-case selection.');

const trajectories=read('assets/js/pages/civilization-atlas/trajectory-renderer.js');
const transitions=read('assets/js/pages/civilization-atlas/transition-renderer.js');
const loss=read('assets/js/pages/civilization-atlas/loss-renderer.js');

assert.ok(trajectories.includes('items.slice(0,1)'),'Long trends must default to one readable trajectory, not a multi-chart dashboard.');
assert.ok(trajectories.indexOf('civ-trajectory-card--reader')<trajectories.indexOf('civ-trajectory-navigator'),'Long trends must present reading before controls.');
assert.ok(trajectories.includes('civ-trajectory-data'),'Trajectory curve and method must be progressive disclosure.');

assert.ok(transitions.indexOf('civ-transition-reader')<transitions.indexOf('civ-transition-navigator'),'Transitions must present the active story before the selector.');
assert.ok(transitions.includes('civ-transition-story'),'Transitions must foreground before → transition → successor reality.');
assert.ok(transitions.includes('civ-transition-mechanism'),'Full transition mechanics must be progressive disclosure.');
assert.ok(!transitions.includes('authorityClass}</dd>'),'Transition inspector must not expose raw authority enums.');

assert.ok(loss.indexOf('civ-loss-reader')<loss.indexOf('civ-loss-navigator'),'Loss must present the active interpretation before taxonomy controls.');
assert.ok(loss.includes('casesRegistry'),'Loss examples must resolve civilization names from the case registry.');
assert.ok(loss.includes('civ-loss-examples'),'Loss case profiles must be progressive disclosure.');
assert.ok(!loss.includes('p.caseId}</strong>'),'Loss customer UI must not foreground raw case IDs.');

const css=read('assets/css/civilization-atlas.css');
assert.ok(css.includes('Lightweight current-reading + Ask rail'),'Atlas must keep the lightweight current-reading rail styles.');
assert.ok(css.includes('.civ-atlas-inspector__summary{display:none}'),'Mobile must hide repeated inspector summary content.');
assert.ok(css.includes('.civ-atlas-ask .knowledge-action{width:100%'),'Mobile Ask must remain a full-width bottom action.');
assert.ok(shell.includes('Ask using the current reading context.')&&shell.includes('使用当前阅读情境提问。'),'Ask helper copy must remain concise and context-specific.');

for(const [name,source] of [['cases',cases],['comparison',comparison],['world',worldRenderer],['trajectories',trajectories],['transitions',transitions],['loss',loss]]){
 assert.ok(source.includes('civ-atlas-inspector__summary'),`${name} inspector must use the lightweight summary wrapper.`);
}
assert.ok(!cases.includes("'政治结构':'Political architecture',label(caseRecord.politicalArchitecture"),'Case inspector must not repeat the full dossier field set.');

console.log('Civilization Atlas presentation + zh-Hans i18n gate PASS.');
