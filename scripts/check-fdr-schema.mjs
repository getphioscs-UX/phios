import assert from 'node:assert/strict';
import fs from 'node:fs';
import {base, readJson, requireFile, assertRequired, getFixtures, walkFacts} from './fdr-check-lib.mjs';
const realityContract=readJson(`${base}/contracts/financial-reality-object-contract-v1.json`);
const factContract=readJson(`${base}/contracts/financial-fact-contract-v1.json`);
const evidenceContract=readJson(`${base}/contracts/financial-fact-evidence-contract-v1.json`);
const snapshotContract=readJson(`${base}/contracts/financial-reality-snapshot-contract-v1.json`);
const eventContract=readJson(`${base}/contracts/financial-change-event-contract-v1.json`);
const fixtureRegistry=readJson(`${base}/fixtures/fdr-fixture-registry-v1.json`);
const adapterRegistry=readJson(`${base}/registries/financial-intake-adapter-registry-v1.json`);
const adapterContract=readJson(`${base}/contracts/financial-intake-adapter-contract-v1.json`);
const adapterTypes=adapterRegistry.adapters.map(x=>x.adapterType);
assert.deepEqual(adapterTypes,['FORM','CSV','EXCEL','PROFESSIONAL_INTAKE','DOCUMENT_EXTRACTION']);
assert.equal(adapterRegistry.rules.adapterIsFactAuthority,false); assert.equal(adapterRegistry.rules.adapterMayBypassValidation,false);
assert.equal(adapterContract.rules.validationRequiredBeforeCommit,true); assert.equal(adapterContract.commitGate.requiredValidationState,'VALIDATED'); assert.equal(adapterContract.commitGate.createsNewSnapshot,true);
const domainContracts={people:'financial-person-contract-v1.json',assets:'financial-asset-contract-v1.json',liabilities:'financial-liability-contract-v1.json',incomeStreams:'financial-income-stream-contract-v1.json',expenses:'financial-expense-contract-v1.json',policies:'financial-policy-contract-v1.json',goals:'financial-goal-contract-v1.json',entities:'financial-entity-contract-v1.json',documents:'financial-document-evidence-contract-v1.json'};
for(const item of fixtureRegistry.fixtures) requireFile(item.path);
const fixtureAdapterCoverage=new Set();
for(const {scenario,data} of getFixtures()){
 fixtureAdapterCoverage.add(data.sourceAdapter);
 assert.equal(data.synthetic,true,`${scenario} must be synthetic`); assert.ok(Array.isArray(data.snapshots)&&data.snapshots.length>0,`${scenario} snapshots missing`);
 for(const s of data.snapshots){
  assertRequired(s,snapshotContract.requiredFields,`${scenario} snapshot`); assert.match(s.timepoint,/^t[0-9]+$/); assertRequired(s.snapshotPayload,realityContract.requiredTopLevelFields,`${scenario} reality`);
  for(const [field,file] of Object.entries(domainContracts)){ const c=readJson(`${base}/contracts/${file}`); for(const rec of s.snapshotPayload[field]||[]) assertRequired(rec,c.requiredFields,`${scenario}.${field}`); }
  walkFacts(s.snapshotPayload,(fact,path)=>{assertRequired(fact,factContract.requiredFields,`${scenario}${path}`); assertRequired(fact.evidence,evidenceContract.requiredFields,`${scenario}${path}.evidence`)});
 }
 for(const e of data.changeEvents||[]) assertRequired(e,eventContract.requiredFields,`${scenario} event`);
}
assert.deepEqual([...fixtureAdapterCoverage].sort(),adapterTypes.slice().sort(),'FDR-W21 adapter fixture coverage incomplete');
// Parse every FDR JSON artifact.
const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=`${d}/${e.name}`; if(e.isDirectory())walk(p); else if(e.isFile()&&p.endsWith('.json'))readJson(p)}}; walk(base);
console.log(`✓ FDR schema passed: ${fixtureRegistry.fixtures.length} canonical synthetic scenarios conform to snapshot, Financial Reality, domain and atomic fact contracts.`);
