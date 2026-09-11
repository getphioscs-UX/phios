import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const read=p=>fs.readFileSync(path.join(root,p),'utf8'); const json=p=>JSON.parse(read(p));
const registry=json('content/civilization-atlas/cases/civilization-case-registry-v1.json'); assert.equal(registry.status,'ACTIVE'); assert.equal(registry.cases.length,12);
const ids=new Set();
for(const c of registry.cases){
  assert.match(c.caseId,/^CA-T(?:0[0-9]|1[0-9])-[0-9]{2}$/); assert.ok(!ids.has(c.caseId),`duplicate ${c.caseId}`); ids.add(c.caseId);
  assert.ok(c.title?.en&&c.title?.['zh-Hans']); assert.ok(c.runtimeFamily); assert.ok(c.region?.regionIds?.length); assert.ok(c.region?.label?.en&&c.region?.label?.['zh-Hans']);
  assert.ok(Number.isInteger(c.timeWindow?.startYear)&&Number.isInteger(c.timeWindow?.endYear)); assert.ok(c.timeWindow.startYear<=c.timeWindow.endYear);
  for(const key of ['geographicReach','settlementPattern','politicalArchitecture','economicRuntime','knowledgeSystem','externalNetwork','capacity','load','expansionPattern','successorStructure','legacy']) assert.ok(c[key]?.label?.en&&c[key]?.label?.['zh-Hans'],`${c.caseId} missing ${key}`);
  assert.ok(c.unknown?.state); assert.ok(Array.isArray(c.comparisonFamilies)); assert.ok(Array.isArray(c.snapshots));
}
const required=['CA-T02-01','CA-T02-03','CA-T05-01','CA-T06-01','CA-T06-02','CA-T07-05','CA-T08-01','CA-T08-06','CA-T09-01','CA-T10-06','CA-T11-02','CA-T13-01'];
for(const id of required) assert.ok(ids.has(id),`missing vertical-slice case ${id}`);
const timeline=json('content/civilization-atlas/timeline/timeline-periods-v1.json'); for(const p of timeline.periods) for(const id of p.caseIds||[]) assert.ok(ids.has(id),`${p.periodId} references missing case ${id}`);
const layers=json('content/civilization-atlas/atlas-layers-v1.json'); assert.equal(layers.explorerLayers.find(x=>x.layerId==='cases')?.customerEnabled,true);
const renderer=read('assets/js/pages/civilization-atlas/cases-renderer.js');
for(const token of ['data-case-search','data-open-case','data-compare-case','renderCaseInspector','compareBasket','runtimeFamily']) assert.ok(renderer.includes(token),`missing case behavior: ${token}`);
const state=read('assets/js/pages/civilization-atlas/atlas-state.js'); assert.match(state,/caseSearch/); const url=read('assets/js/pages/civilization-atlas/atlas-url-state.js'); assert.match(url,/caseSearch:'q'/);
const forbidden=JSON.stringify(registry).toLowerCase(); for(const token of ['civilizationscore','collapsescore','declinescore','superiorityrank']) assert.ok(!forbidden.includes(token),`forbidden ranking field ${token}`);
console.log('✓ BOOK-V-CIV-ATLAS-R1-W6 Case Registry Vertical Slice passed.');
console.log('  Twelve representative cases expose searchable bilingual dossiers and a bounded compare basket without ranking.');
