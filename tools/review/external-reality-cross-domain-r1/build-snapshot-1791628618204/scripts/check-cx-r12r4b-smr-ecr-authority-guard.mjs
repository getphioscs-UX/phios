import assert from 'node:assert/strict';
import fs from 'node:fs';

const theory=JSON.parse(fs.readFileSync('content/embodied-configuration/ecr-book-core-theory-projection-v1.json','utf8'));
const atomic=JSON.parse(fs.readFileSync('content/embodied-configuration/meaning/ecr-atomic-meaning-registry-v1.json','utf8'));
const drivers=theory.drivers||theory.coreTheory?.drivers||[];
const d11=drivers.find(x=>Array.isArray(x)?x[0]==='D11':x.id==='D11');
const d11Id=Array.isArray(d11)?d11[1]:(d11?.label||d11?.name||d11?.identity);
assert.equal(d11Id,'Earth','ECR benchmark authority is stale: D11 must be Earth before benchmark replay');
const m=atomic.entries.find(x=>x.coordinate==='D11');
assert(m,'ECR D11 atomic meaning missing');
assert.equal(m.label,'Embodiment','ECR benchmark authority is stale: D11 meaning must be Embodiment');
assert.equal(m.status,'PRODUCTION');
console.log('✓ ECR benchmark authority guard: D11 Earth / Embodiment.');
