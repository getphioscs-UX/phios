import assert from 'node:assert/strict';import fs from 'node:fs';
process.argv.push('--check');
await import('./generate-ecr-v4-p64-environment-bridge.mjs');
import {resolveEcrEnvironment} from '../functions/embodied-configuration/ecr-p64-environment-bridge-runtime.js';
const bridge=JSON.parse(fs.readFileSync('content/embodied-configuration/ecr-p64-environment-bridge-v1.json'));
const semantic=JSON.parse(fs.readFileSync('content/embodied-configuration/ecr-environment-first-configuration-v1.json'));
assert.equal(bridge.entries.length,64);assert.equal(new Set(bridge.entries.map(x=>x.gate)).size,64);assert.equal(new Set(bridge.entries.map(x=>x.ecrConfigurationRef)).size,64);
for(const x of bridge.entries){const s=semantic.entries.find(s=>s.kingWenNumber===x.gate);assert.equal(s.configurationId,x.ecrConfigurationRef);for(const key of ['upperTrigramRef','lowerTrigramRef','environmentPriorityMotionId','embodiedResponseMotionId'])assert.equal(x[key],s[key]);}
const x=resolveEcrEnvironment(302);assert.equal(x.ecrConfigurationRef,'ECR-H48');assert.equal(x.environmentPriorityMotionId,'M6');assert.equal(x.embodiedResponseMotionId,'M8');assert.equal(resolveEcrEnvironment(0).ecrConfigurationRef,'ECR-H50');
console.log('PASS V4.1 W4: reproducible 64/64 semantic bridge; 302° -> 41 -> H48 -> M6/M8.');
