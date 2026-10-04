import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildZwrProW10DeterministicCase,summarizeZwrProW10Campaign} from '../functions/personal-reading/narrative/zwr-pro-w10-controlled-qa.js';

const ids=Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0'));
const cases=[];
for(const id of ids){
 const input=JSON.parse(fs.readFileSync(`docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-${id}-input.json`,'utf8'));
 const row=await buildZwrProW10DeterministicCase({fixtureId:id,input});
 assert.equal(row.subjectId,`ZPA-CONTROLLED-${id}`);
 assert.equal(row.sectionCountEn,10,id+' en section count');
 assert.equal(row.sectionCountZhHans,10,id+' zh section count');
 assert(row.timingLayers.every(x=>['NATAL','DA_XIAN','LIU_NIAN'].includes(x)),id+' timing boundary');
 cases.push(row);
}
const summary=await summarizeZwrProW10Campaign(cases);
assert.equal(summary.subjectCount,12);
assert.equal(summary.uniqueInputFingerprints,12,'all controlled inputs must remain distinct');
assert(summary.uniqueAuthorityDigests>=10,'authority packs insufficiently diverse');
assert(summary.uniqueStructuralSignatures>=10,'chart structures insufficiently diverse');
assert.equal(summary.allTenSections,true);
assert.equal(summary.timingLayersBounded,true);
assert.equal(summary.providerCalls,0);
assert.equal(summary.liveCompositionExecuted,false);
assert.equal(summary.productionAdmissionGranted,false);
assert.equal(summary.sentinels.length,4);
assert(summary.sentinels.every(s=>s.fixtureId!=='01'),'gold reference subject must be excluded from live sentinels');
console.log('PASS ZWR-PRO W10-A: 12 controlled charts preserve unique subject/input binding, bilingual authority parity, chart diversity, ten-section scope and bounded timing; provider calls 0; live composition campaign remains pending.');
console.log('W10-B live sentinels:',summary.sentinels.map(s=>s.fixtureId).join(','));
