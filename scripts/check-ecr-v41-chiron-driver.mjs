import fs from 'node:fs';import assert from 'node:assert/strict';
import {buildEcrHumanRuntime} from '../functions/embodied-configuration/ecr-canonical-projection-runtime-v2.js';
const input=JSON.parse(fs.readFileSync('content/embodied-configuration/v4-1/acceptance/birth-fixtures-v1.json')).cases[0].canonicalInput;
const ir=await buildEcrHumanRuntime({canonicalInput:input});
const rows=ir.initialization.activations.filter(a=>a.bodyCode==='CHIRON');
assert.equal(rows.length,2);assert.deepEqual(rows.map(a=>a.layer),['PERSONALITY','DESIGN']);
for(const row of rows){assert.equal(row.status,'UNKNOWN');assert.equal(row.p64,null);assert.equal(row.eclipticLongitude,undefined);}
assert.notEqual(rows[0].instantUTC,rows[1].instantUTC);assert.equal(ir.driverField.drivers[10].status,'UNKNOWN');
assert.equal(ir.initialization.activations.filter(a=>a.status==='CALCULATED').length,26);
console.log('PASS ECR D11 fail-closed regression: two distinct instants, UNKNOWN without longitude; 26 existing body activations preserved. SUPPORTED Chiron integration remains NOT_RUN until provider freeze.');
