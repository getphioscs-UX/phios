import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {publicCountryHistoryBinding,PENDING_R4_RECORD_IDS,PENDING_R4_SOURCE_IDS} from '../assets/js/pages/civilization-atlas/country-history-public-admission-r4.js';
import {countryHistoricalReading} from '../assets/js/pages/civilization-atlas/world-history-coverage-r1.js';
import {emitPublicCountryHistoryAssets} from './lib/country-history-publication-r4.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const relative='content/civilization-atlas/evidence/country-history-source-bindings-r1.json';
const candidate=JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const old=JSON.parse(execFileSync('git',['show','2166de8e1bf2cc5e5a33926145c8d7f4bbbe68ae:'+relative],{cwd:root}));
const pub=publicCountryHistoryBinding(candidate);
assert.equal(candidate.records.length,96);assert.equal(candidate.sources.length,57);
assert.deepEqual(pub,old,'Existing main publication must remain unchanged');
assert.equal(new Set(candidate.records.map(x=>x.id)).size,96);
assert.equal(new Set(candidate.sources.map(x=>x.id)).size,57);
for(const r of candidate.records)assert.ok(candidate.sources.some(s=>s.id===r.sourceRef));
for(const id of PENDING_R4_RECORD_IDS)assert.ok(candidate.records.some(r=>r.id===id)&&!pub.records.some(r=>r.id===id));
for(const id of PENDING_R4_SOURCE_IDS)assert.ok(candidate.sources.some(s=>s.id===id)&&!pub.sources.some(s=>s.id===id));
for(const countryCode of ['BGR','SRB','ARG','CHL'])for(const locale of ['en','zh-Hans']){
  const answer=countryHistoricalReading({countryCode,locale});
  assert.equal(answer.records.length,0);assert.equal(answer.productionAdmissionGranted,false);
}
for(const locale of ['en','zh-Hans'])assert.ok(countryHistoricalReading({countryCode:'MYS',locale}).records.length>0);
// A disposable output proves the public assets contain neither the pending IDs nor prose.
const output=fs.mkdtempSync(path.join(os.tmpdir(),'phios-country-public-r4-'));
const result=emitPublicCountryHistoryAssets(root,output);
assert.equal(result.publicRecords,80);assert.equal(result.publicSources,53);
for(const relative of ['content/civilization-atlas/evidence/country-history-source-bindings-r1.json','assets/js/pages/civilization-atlas/world-history-sources.generated.js']) {
  const text=fs.readFileSync(path.join(output,relative),'utf8');
  for(const id of [...PENDING_R4_RECORD_IDS,...PENDING_R4_SOURCE_IDS])assert.ok(!text.includes(id));
}
console.log(JSON.stringify({status:'PASS_PUBLIC_ADMISSION_GUARD',...result,legacyRecordsUnchanged:true,pendingRecords:16,pendingSources:4,consumerLocaleChecks:10}));
