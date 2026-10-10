import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const read=p=>fs.readFileSync(path.join(root,p),'utf8'); const json=p=>JSON.parse(read(p));
const timeline=json('content/civilization-atlas/timeline/timeline-periods-v1.json');
assert.equal(timeline.status,'ACTIVE'); assert.equal(timeline.periods.length,20);
assert.deepEqual(timeline.periods.map(x=>x.periodId),Array.from({length:20},(_,i)=>`T${String(i).padStart(2,'0')}`));
for(const [i,p] of timeline.periods.entries()){
  assert.equal(p.order,i); assert.ok(Number.isInteger(p.startYear)&&Number.isInteger(p.endYear)); assert.ok(p.startYear<=p.endYear);
  assert.ok(p.title?.en&&p.title?.['zh-Hans']); assert.ok(p.summary?.en&&p.summary?.['zh-Hans']); assert.ok(p.unknown?.state);
  for(const id of p.caseIds||[]) assert.match(id,/^CA-T(?:0[0-9]|1[0-9])-[0-9]{2}$/);
}
const layers=json('content/civilization-atlas/atlas-layers-v1.json');
assert.equal(layers.explorerLayers.find(x=>x.layerId==='timeline')?.customerEnabled,true);
// Successor-aware: later Atlas waves W7–W11 may activate without invalidating the frozen W5 timeline.
const data=read('assets/js/pages/civilization-atlas/atlas-data.js'); assert.match(data,/loadTimelineRegistry/);
const renderer=read('assets/js/pages/civilization-atlas/timeline-renderer.js');
for(const token of ['data-atlas-timeline','data-period-id','civ-atlas-table','formatHistoricalRange','onPeriodSelect','onCaseSelect']) assert.ok(renderer.includes(token),`missing timeline behavior: ${token}`);
const shell=read('assets/js/pages/civilization-atlas/atlas-shell.js'); assert.match(shell,/renderTimeline/); assert.match(shell,/timeline-period/); assert.match(shell,/timeline-case/);
console.log('✓ BOOK-V-CIV-ATLAS-R1-W5 Timeline Vertical Slice passed.');
console.log('  T00–T19 remain active and successor-aware; W7–W11 activation no longer creates historical checker drift.');
