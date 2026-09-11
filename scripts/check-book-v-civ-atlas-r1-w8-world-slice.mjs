import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(); const read=p=>fs.readFileSync(path.join(root,p),'utf8'); const json=p=>JSON.parse(read(p));
const registry=json('content/civilization-atlas/snapshots/world-snapshots-v1.json'); assert.equal(registry.status,'ACTIVE'); assert.ok(registry.snapshots.length>=4);
const ids=new Set(registry.snapshots.map(s=>s.snapshotId)); for(const id of ['WS-1000','WS-1500','WS-1850','WS-2026']) assert.ok(ids.has(id),`missing original W8 vertical-slice snapshot ${id}`);
const caseIds=new Set(json('content/civilization-atlas/cases/civilization-case-registry-v1.json').cases.map(c=>c.caseId));
for(const s of registry.snapshots){assert.ok(Number.isInteger(s.year)); assert.ok(s.title?.en&&s.title?.['zh-Hans']); assert.ok(s.summary?.en&&s.summary?.['zh-Hans']); assert.ok(s.regionalGroups.length>=1); assert.ok(s.posterAssetRef?.startsWith('VIS-B5-ATLAS-')); for(const id of s.majorCaseIds) assert.ok(caseIds.has(id),`${s.snapshotId} missing case ${id}`); assert.ok(s.unknown?.state);}
assert.equal(registry.snapshots.find(s=>s.snapshotId==='WS-2026').unknown.state,'PARTIAL'); assert.match(registry.snapshots.find(s=>s.snapshotId==='WS-2026').unknown.note.en,/open historical window/i);
const layers=json('content/civilization-atlas/atlas-layers-v1.json'); assert.equal(layers.explorerLayers.find(x=>x.layerId==='world')?.customerEnabled,true);
const renderer=read('assets/js/pages/civilization-atlas/world-slice-renderer.js'); for(const t of ['data-snapshot-id','data-world-case','tradeNetworks','majorCities','posterAssetRef','Knowledge state']) assert.ok(renderer.includes(t),`missing world slice behavior ${t}`);
console.log('✓ BOOK-V-CIV-ATLAS-R1-W8 World Slice passed.');
console.log(`  Original four W8 slices remain present inside the successor registry (${registry.snapshots.length} snapshots total).`);
