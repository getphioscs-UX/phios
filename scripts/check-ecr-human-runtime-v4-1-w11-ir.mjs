import fs from 'node:fs';import assert from 'node:assert/strict';import Ajv from 'ajv';
import {buildEcrHumanRuntime,projectEcrLegacyCompatibility} from '../functions/embodied-configuration/ecr-canonical-projection-runtime-v2.js';
const input=JSON.parse(fs.readFileSync('content/embodied-configuration/v4-1/acceptance/birth-fixtures-v1.json')).cases[0].canonicalInput;
const a=await buildEcrHumanRuntime({canonicalInput:input}),b=await buildEcrHumanRuntime({canonicalInput:input});assert.deepEqual(a,b);
const validate=new Ajv({strict:false}).compile(JSON.parse(fs.readFileSync('content/embodied-configuration/v4-1/ecr-human-runtime-v4-1-ir.schema.json')));assert(validate(a),JSON.stringify(validate.errors));assert.equal(a.currentReality.status,'UNBOUND');assert.equal(a.currentReality.dynamicRuntime,null);assert.notDeepEqual(a.feedback.consciousRealitySelectionLoop.architecture,a.feedback.carrierContinuityLoop.architecture);
const changed=await buildEcrHumanRuntime({canonicalInput:input,currentReality:{rawInput:{optIn:true,purposeCode:'PERSONAL_READING_REALITY_COMPARISON',observations:[{domain:'RECOVERY',text:'Synthetic observation'}]}}});assert.equal(a.baselineDigest,changed.baselineDigest);
const legacy=await projectEcrLegacyCompatibility(a,input);assert.equal(legacy.schemaVersion,'PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0');assert.equal(a.boundaries.customerProductionAdmitted,false);
fs.mkdirSync('.tmp/ecr-v4-1',{recursive:true});fs.writeFileSync('.tmp/ecr-v4-1/runtime-proof.json',JSON.stringify(a,null,2)+'\n');
console.log('PASS V4.1 W11: schema, deterministic lineage, baseline/current isolation and legacy compatibility.');
