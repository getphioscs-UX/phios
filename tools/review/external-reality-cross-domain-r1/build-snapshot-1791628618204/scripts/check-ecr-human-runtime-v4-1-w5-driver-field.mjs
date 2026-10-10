import fs from 'node:fs';import assert from 'node:assert/strict';
import {initializeEcrAstronomy} from '../functions/embodied-configuration/ecr-astronomical-initialization-runtime-v2.js';
import {projectEcrDriverField} from '../functions/embodied-configuration/ecr-planetary-driver-runtime-v2.js';
const input=JSON.parse(fs.readFileSync('content/embodied-configuration/v4-1/acceptance/birth-fixtures-v1.json')).cases[0].canonicalInput;
const init=await initializeEcrAstronomy(input),field=projectEcrDriverField(init);
assert.equal(field.drivers.length,12);assert.equal(field.drivers.filter(x=>x.status==='CALCULATED').length,12);
assert.equal(field.drivers[10].driverId,'D11');assert.deepEqual(field.drivers[10].bodyBinding,['EARTH']);assert.equal(field.drivers[10].status,'CALCULATED');
assert.deepEqual(field.drivers[11].bodyBinding,['NORTH_NODE','SOUTH_NODE']);assert.equal(field.rankingCreated,false);assert.equal(field.currentDriverPriority.status,'UNKNOWN');
for(const driver of field.drivers)for(const a of [...driver.personalityActivation,...driver.designActivation]){const source=init.activations.find(x=>x.layer===a.layer&&x.bodyCode===a.bodyCode);assert(source);assert.equal(source.eclipticLongitude,a.eclipticLongitude);}
console.log('PASS V4.1 W5: D1-D12 calculated with D11 Earth opposition binding; no fabricated current priority.');
