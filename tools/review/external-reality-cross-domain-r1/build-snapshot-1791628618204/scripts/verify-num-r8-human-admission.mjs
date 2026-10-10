import assert from 'node:assert/strict'; import fs from 'node:fs';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8')), b='content/professional/num-production/full-production/rich-meaning';
const r3=j(`${b}/review/num-r3-source-claim-human-review-results-v1.json`),r7=j(`${b}/review/num-r7-human-review-results-v1.json`);
assert.equal(r3.status,'HUMAN_ADMITTED'); assert.equal(r3.admitted,48); assert(r3.results.every(x=>x.decision==='ADMIT'&&Object.values(x.criteria).every(Boolean)));
assert.equal(r7.status,'HUMAN_ACCEPTED'); assert.equal(r7.accepted,12); assert(r7.results.every(x=>x.decision==='ACCEPT'&&Object.values(x.criteria).every(Boolean)));
console.log('✓ NUM-R8 human admission evidence verified: R3 48/48, R7 12/12, all criteria true.');
