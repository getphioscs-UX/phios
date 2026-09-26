import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const world=json('content/civilization-atlas/snapshots/world-snapshots-v1.json');
const caseRegistry=json('content/civilization-atlas/cases/civilization-case-registry-v1.json');
for(const snapshot of world.snapshots||[]){
  for(const group of snapshot.regionalGroups||[]){
    const zh=group.label?.['zh-Hans']||'';
    assert.ok(/[\u3400-\u9fff]/.test(zh), `${snapshot.snapshotId} region ${group.regionId} has non-Chinese zh-Hans label: ${zh}`);
    assert.notEqual(zh,group.label?.en,`${snapshot.snapshotId} region ${group.regionId} duplicates English label in zh-Hans`);
  }
}


for(const c of caseRegistry.cases||[]){
  for(const [field,obj] of [['region',c.region],['geographicReach',c.geographicReach]]){
    const zh=obj?.label?.['zh-Hans']||'';
    assert.ok(zh,`${c.caseId} ${field} missing zh-Hans label`);
    assert.ok(!/[A-Za-z]/.test(zh),`${c.caseId} ${field} leaks Latin text into zh-Hans: ${zh}`);
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
assert.ok(cases.includes("knowledge-eyebrow\">${esc(loc(c.region?.label,lang)||formatRange(c.timeWindow,lang))}"),'Cases must foreground region/time, not raw case ID.');
assert.ok(!cases.includes('knowledge-eyebrow\">${esc(c.caseId)}'),'Cases should not foreground raw case ID.');
assert.ok(comparison.includes("lang==='zh-Hans'?'比较家族':'Comparison families'"),'Comparison must foreground a human-readable family-map label.');
assert.ok(!comparison.includes('knowledge-eyebrow\">${esc(selected.familyId)}'),'Comparison should not foreground raw family ID.');
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
  shell.indexOf('data-atlas-template-projection'),
  shell.indexOf('civ-template-controls'),
  shell.indexOf('data-atlas-structured-section'),
  shell.indexOf('data-atlas-visual-resources')
];
assert.ok(firstScreenOrder.every(x=>x>=0),'Atlas FR3 first-screen composition placeholders must all exist.');
assert.deepEqual([...firstScreenOrder].sort((a,b)=>a-b),firstScreenOrder,'Atlas FR3 first screen must order Library template → interactive controls → structured fallback → visual resources.');
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
assert.ok(comparison.includes('civ-compare-case-strip'),'FR2 comparison must foreground representative civilization cards before the matrix.');
assert.ok(comparison.includes('civ-compare-matrix'),'FR2 comparison must use the responsive comparison board.');
assert.ok(comparison.includes('data-case-label'),'FR2 mobile matrix cells must preserve civilization labels.');

const trajectories=read('assets/js/pages/civilization-atlas/trajectory-renderer.js');
const transitions=read('assets/js/pages/civilization-atlas/transition-renderer.js');
const loss=read('assets/js/pages/civilization-atlas/loss-renderer.js');

assert.ok(trajectories.includes('civ-trajectory-panel-grid'),'L6 must render the full system-composed trajectory panel grid.');
assert.ok(trajectories.includes('items.map(t=>'),'L6 must project all canonical trajectories from the registry.');
assert.ok(!trajectories.includes('slice(0,5)'),'L6 must not regress to the old five-trajectory subset.');
assert.ok(trajectories.includes('<polyline class="civ-trajectory-panel__line'),'Each L6 trajectory must own a dynamic SVG curve.');
assert.ok(trajectories.includes('civ-trajectory-panel__details'),'Method and uncertainty must remain progressive disclosure within each trajectory panel.');

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

const accessibility=read('assets/js/pages/civilization-atlas/atlas-accessibility.js');
assert.ok(!shell.includes('role="tablist"'),'Atlas mixed destination navigation must not use tablist semantics.');
assert.ok(!shell.includes('role="tabpanel"'),'Atlas content region must not pretend the Reconfiguration link is a tab.');
assert.ok(shell.includes('data-atlas-entry'),'All five Atlas entrances must participate in one navigation model.');
assert.ok(shell.includes('aria-pressed'),'In-page Atlas entrance buttons must expose pressed state.');
assert.ok(accessibility.includes("querySelectorAll('[data-atlas-entry]')"),'Keyboard navigation must include the Reconfiguration link as a focusable entrance.');
assert.ok(accessibility.includes("if(entry?.dataset.atlasLayer)"),'Keyboard navigation must not fake-activate the Reconfiguration link.');

const askContext=read('assets/js/pages/civilization-atlas/atlas-ask-context.js');
const crossLayer=read('assets/js/pages/civilization-atlas/cross-layer-context.js');
assert.ok(crossLayer.includes('trajectoryMap'),'Ask summary must resolve trajectory titles instead of exposing raw IDs.');
assert.ok(!crossLayer.includes('Case=${current.caseId}'),'Ask summary must not expose raw case IDs.');
assert.ok(!crossLayer.includes('Snapshot=${snapshot.snapshotId}'),'Ask summary must not expose raw snapshot IDs.');
assert.ok(!crossLayer.includes('Transition=${transition.transitionWindowId}'),'Ask summary must not expose raw transition IDs.');
assert.ok(askContext.includes('primaryCaseId:state.primaryCaseId||null'),'Machine retrieval scope must retain precise case identity.');
assert.ok(askContext.includes('snapshotId:state.snapshotId||null'),'Machine retrieval scope must retain precise snapshot identity.');
assert.ok(!askContext.includes('sourceReading')&&!askContext.includes('manuscriptPath'),'Atlas Ask context must not carry private manuscript paths.');

console.log('Civilization Atlas presentation + zh-Hans i18n gate PASS.');
