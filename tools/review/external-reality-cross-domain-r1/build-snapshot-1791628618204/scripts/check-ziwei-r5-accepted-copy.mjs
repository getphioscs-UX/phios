import fs from 'node:fs';
import assert from 'node:assert/strict';

const zh=JSON.parse(fs.readFileSync('content/professional/ziwei-r5/accepted-copy-zh-Hans-v1.json','utf8'));
const en=JSON.parse(fs.readFileSync('content/professional/ziwei-r5/accepted-copy-en-v1.json','utf8'));
const reg=JSON.parse(fs.readFileSync('content/professional/ziwei-r5/accepted-candidates-v1.json','utf8'));
const ids=['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11'];
for(const [label,doc] of [['zh-Hans',zh],['en',en]]){
 assert.equal(doc.schemaVersion,'ZIWEI-R5-ACCEPTED-COPY-v1');
 assert.equal(doc.locale,label);
 assert.equal(doc.humanDecision,'ACCEPT');
 assert.equal(doc.productionUse,false);
 assert.deepEqual(doc.sections.map(s=>s.id),ids);
 for(const s of doc.sections){
  assert(s.title&&Array.isArray(s.paragraphs)&&s.paragraphs.length>=5,s.id+': accepted copy too thin');
  const body=s.paragraphs.join('\n');
  for(const forbidden of ['Authoring Pack','Candidate','ZIWEI-R5'])assert(!body.includes(forbidden),s.id+': internal token leaked '+forbidden);
 }
}
assert.equal(reg.status,'BILINGUAL_HUMAN_REVIEW_COMPLETE');
assert.equal(reg.acceptedCountZhHans,10);
assert.equal(reg.acceptedCountEn,10);
assert.equal(reg.productionAdmissionGranted,false);
console.log('PASS Zi Wei accepted copy freeze: zh-Hans 10/10 + en 10/10, customer-facing prose frozen, production still closed.');
