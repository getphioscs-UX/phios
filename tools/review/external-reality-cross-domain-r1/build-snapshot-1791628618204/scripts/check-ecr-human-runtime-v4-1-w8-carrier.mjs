import assert from 'node:assert/strict';
import {projectEcrCarrierArchitecture} from '../functions/embodied-configuration/ecr-carrier-architecture-projection.js';
import {projectEcrCarrierC1} from '../functions/embodied-configuration/ecr-carrier-c1-projection.js';
import {projectEcrCarrierContinuity} from '../functions/embodied-configuration/ecr-carrier-continuity-projection.js';
await assert.rejects(()=>projectEcrCarrierArchitecture(null),/REQUIRES_K1/);
const architecture=await projectEcrCarrierArchitecture({owner:'K1',outputDigest:'SYNTHETIC-TEST'}),c1=await projectEcrCarrierC1(architecture),continuity=await projectEcrCarrierContinuity(c1);
assert.equal(architecture.structuralConnectivity.provenance,'UNKNOWN');assert.equal(architecture.scientificCausationClaimed,false);assert.equal(c1.lineage.upstreamDigest,architecture.outputDigest);
assert.deepEqual(Object.keys(c1.primaryEngines),['intake','environment','perceptual','cognitive','biological','regulation']);assert.equal(c1.carrierRuntimeStyle.status,'UNKNOWN');assert.equal(continuity.continuityState.currentState,'UNBOUND');
console.log('PASS V4.1 W8: Carrier Architecture -> C1 -> continuity; no personal taxonomy invented.');
