import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const base=json('content/civilization-atlas/cases/civilization-case-registry-v1.json');
const shardPaths=[
  'content/civilization-atlas/cases/depth/fr5-f1-remaining-11-v1.json',
  'content/civilization-atlas/cases/depth/fr5-f2-remaining-11-v1.json',
  'content/civilization-atlas/cases/depth/fr5-f3-remaining-11-v1.json',
  'content/civilization-atlas/cases/depth/fr5-f4-remaining-11-v1.json',
  'content/civilization-atlas/cases/depth/fr5-f5-remaining-11-v1.json'
];
const shards=shardPaths.map(json);
const fields=['populationBase','settlementPattern','resourceBase','beliefSystem','technology','militaryStructure','civilizationDensity','capacity','load','alignment','expansionPattern'];
const loader=read('assets/js/pages/civilization-atlas/atlas-data.js');
const evidence=json('content/civilization-atlas/evidence/civ-atlas-fr5-f-remaining-11-completion-v1.json');

assert.equal(base.cases.length,120,'Base registry must retain 120 case identities.');
assert.equal(evidence.status,'FULL_19_FIELD_DOSSIER_DEPTH_READY_FOR_REVIEW');

const rows=shards.flatMap(s=>{
  assert.equal(s.status,'ACTIVE_OVERLAY');
  assert.equal(s.authority.caseIdentityOwnedByBaseRegistry,true);
  assert.equal(s.authority.overlayOwnsRemaining11SemanticFields,true);
  return s.records||[];
});
assert.equal(rows.length,120,'Five FR5-F shards must cover exactly 120 case records.');
const ids=rows.map(r=>r.caseId);
assert.equal(new Set(ids).size,120,'Depth shards must not duplicate caseId.');
const baseIds=new Set(base.cases.map(c=>c.caseId));
for(const id of ids) assert.ok(baseIds.has(id),`Depth shard references unknown case: ${id}`);

for(const field of fields){
  const zh=rows.map(r=>r[field]?.label?.['zh-Hans']||'');
  const en=rows.map(r=>r[field]?.label?.en||'');
  assert.equal(zh.filter(Boolean).length,120,`${field} zh-Hans missing values`);
  assert.equal(en.filter(Boolean).length,120,`${field} en missing values`);
  assert.equal(new Set(zh).size,120,`${field} zh-Hans must be case-specific across all 120 cases`);
  assert.equal(new Set(en).size,120,`${field} en must be case-specific across all 120 cases`);
}

for(const p of shardPaths){
  const webPath='/'+p;
  assert.ok(loader.includes(webPath),`Runtime loader missing FR5-F shard: ${webPath}`);
}
assert.ok(loader.includes('const overlay=new Map'),'Case loader must merge depth overlays deterministically by caseId.');
assert.ok(loader.includes('return {...base,cases:(base.cases||[]).map'),'Merged case registry must preserve base identity records.');

console.log('CIV-ATLAS-FR5-F PASS: five depth shards cover 120/120 cases and all remaining 11 dossier fields are bilingual, case-specific, and merged into the runtime registry.');
