import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(); const read=p=>fs.readFileSync(path.join(root,p),'utf8'); const json=p=>JSON.parse(read(p));
const registry=json('content/civilization-atlas/comparison/comparison-families-v1.json'); assert.equal(registry.status,'ACTIVE'); assert.equal(registry.families.length,6);
const cases=json('content/civilization-atlas/cases/civilization-case-registry-v1.json'); const caseIds=new Set(cases.cases.map(c=>c.caseId)); const familyIds=new Set(registry.families.map(f=>f.familyId));
for(const id of ['CONTINENTAL_EMPIRE','POLYCENTRIC_CIVILIZATION','MARITIME_CIVILIZATION','KNOWLEDGE_EXPANSION','COMMERCIAL_NETWORK','INDUSTRIAL_MODERN_TRANSFORMATION']) assert.ok(familyIds.has(id),`missing family ${id}`);
for(const f of registry.families){assert.ok(f.title?.en&&f.title?.['zh-Hans']); assert.ok(f.coreRuntimeProblem?.en&&f.coreRuntimeProblem?.['zh-Hans']); assert.ok(f.comparisonDimensions.length>=3); for(const id of f.caseIds) assert.ok(caseIds.has(id),`${f.familyId} missing case ${id}`); for(const r of f.crossFamilyRelations) assert.ok(familyIds.has(r.targetFamilyId),`${f.familyId} missing target ${r.targetFamilyId}`);}
const layers=json('content/civilization-atlas/atlas-layers-v1.json'); assert.equal(layers.explorerLayers.find(x=>x.layerId==='comparison')?.customerEnabled,true); assert.equal(layers.explorerLayers.find(x=>x.layerId==='trajectories')?.customerEnabled,false);
const renderer=read('assets/js/pages/civilization-atlas/comparison-renderer.js'); for(const t of ['data-family-id','data-comparison-case','data-comparison-toggle','civ-family-relations','civ-comparison-matrix','comparisonDimensions','Comparison is not ranking']) assert.ok(renderer.includes(t),`missing comparison behavior ${t}`);
const forbidden=JSON.stringify(registry).toLowerCase(); for(const token of ['civilizationscore','overallwinner','superiorityrank','collapsescore']) assert.ok(!forbidden.includes(token));
console.log('✓ BOOK-V-CIV-ATLAS-R1-W7 Comparison Families passed.');
console.log('  Six stable comparison families are active with explicit dimensions, case links, and no ranking score.');
