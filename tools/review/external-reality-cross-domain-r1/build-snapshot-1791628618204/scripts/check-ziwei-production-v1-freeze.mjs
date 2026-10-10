import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const accepted=JSON.parse(fs.readFileSync('content/reports/ziwei/production-v1-acceptance.json'));
assert.equal(accepted.decision,'ACCEPT');assert.equal(accepted.frozen,true);
for(const [path,hash] of Object.entries(accepted.files))assert.equal(createHash('sha256').update(fs.readFileSync(path)).digest('hex'),hash,'Frozen production V1 artifact changed: '+path);
console.log('PASS accepted Zi Wei production V1 freeze: '+Object.keys(accepted.files).length+' files unchanged.');
