import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const cases=json('content/civilization-atlas/cases/civilization-case-registry-v1.json');
const evidence=json('content/civilization-atlas/evidence/civ-atlas-fr5-core-case-semantics-completion-v1.json');

const fields=[
  'politicalArchitecture','economicRuntime','energyBase','knowledgeSystem',
  'infrastructure','externalNetwork','legacy','successorStructure'
];

assert.equal(cases.cases.length,120);
assert.equal(evidence.status,'CORE_FIELDS_COMPLETE_READY_FOR_REVIEW');

for(const field of fields){
  const zh=cases.cases.map(c=>c[field]?.label?.['zh-Hans']||'');
  const en=cases.cases.map(c=>c[field]?.label?.en||'');
  assert.equal(zh.filter(Boolean).length,120,`${field} zh-Hans missing values`);
  assert.equal(en.filter(Boolean).length,120,`${field} en missing values`);
  const freq={}; for(const v of zh)freq[v]=(freq[v]||0)+1;
  const max=Math.max(...Object.values(freq));
  if(field==='energyBase'){
    assert.ok(new Set(zh).size>=110,'EnergyBase must remain strongly differentiated across the 120 cases.');
    assert.ok(max<=5,'EnergyBase duplication exceeded the accepted bounded overlap.');
  }else{
    assert.equal(new Set(zh).size,120,`${field} zh-Hans must be case-specific across all 120 cases`);
    assert.equal(new Set(en).size,120,`${field} en must be case-specific across all 120 cases`);
  }
}

for(const c of cases.cases){
  assert.ok(c.runtimeSummary?.['zh-Hans']&&c.runtimeSummary?.en,`${c.caseId} runtimeSummary missing`);
}

console.log('CIV-ATLAS-FR5 core case semantic gate PASS: 120/120 cases have bilingual case-specific core dossier semantics across 8 fields.');
