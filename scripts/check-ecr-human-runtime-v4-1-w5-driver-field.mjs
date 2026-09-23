import fs from 'node:fs';import assert from 'node:assert/strict';
import {initializeEcrAstronomy} from '../functions/embodied-configuration/ecr-astronomical-initialization-runtime-v2.js';
import {projectEcrDriverField} from '../functions/embodied-configuration/ecr-planetary-driver-runtime-v2.js';
const input=JSON.parse(fs.readFileSync('content/embodied-configuration/v4-1/acceptance/birth-fixtures-v1.json')).cases[0].canonicalInput;
const init=await initializeEcrAstronomy(input),field=projectEcrDriverField(init);
assert.equal(field.drivers.length,12);assert.equal(field.drivers.filter(x=>x.status==='CALCULATED').length,11);assert.equal(field.drivers[10].status,'UNKNOWN');assert.deepEqual(field.drivers[11].bodyBinding,['NORTH_NODE','SOUTH_NODE']);assert.equal(field.rankingCreated,false);assert.equal(field.currentDriverPriority.status,'UNKNOWN');
for(const driver of field.drivers)for(const a of [...driver.personalityActivation,...driver.designActivation]){const source=init.activations.find(x=>x.layer===a.layer&&x.bodyCode===a.bodyCode);assert.equal(source.eclipticLongitude,a.eclipticLongitude);assert(!driver.bodyBinding.includes('EARTH'));}
console.log('PASS V4.1 W5: exact D1–D12 body bindings; Earth not a driver; no fabricated priority.');
