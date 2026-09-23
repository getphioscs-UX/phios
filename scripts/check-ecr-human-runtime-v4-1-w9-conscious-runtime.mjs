import assert from 'node:assert/strict';import {projectEcrConsciousRuntime} from '../functions/embodied-configuration/ecr-conscious-runtime-projection.js';
const c1={owner:'C1',outputDigest:'SYNTHETIC-C1'};await assert.rejects(()=>projectEcrConsciousRuntime({owner:'C2',outputDigest:'WRONG'}),/REQUIRES_C1/);
const result=await projectEcrConsciousRuntime(c1);let prior=c1;
for(const [key,stages] of [['c2',4],['c3',7],['c4',8],['c5',5]]){const p=result[key];assert.equal(p.lineage.upstreamDigest,prior.outputDigest);assert.equal(p.lineage.upstreamOwner,prior.owner);assert.equal(p.internalStages.length,stages);assert(Object.values(p.outputSignature).every(v=>v.provenance==='UNKNOWN'));prior=p;}
console.log('PASS V4.1 W9: sequential C1 -> C2 -> C3 -> C4 -> C5 and exact internal stages.');
