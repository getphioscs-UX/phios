import fs from 'node:fs';import assert from 'node:assert/strict';
import {validateEcrSemanticOwner} from '../functions/embodied-configuration/ecr-semantic-runtime-projection.js';
const registry=JSON.parse(fs.readFileSync('content/embodied-configuration/meaning/ecr-semantic-runtime-owner-registry-v2.json'));
for(const domain of ['K2A','C1','C2','C3','C4','C5','CONTINUITY','FEEDBACK'])assert(registry.ownerAddresses.some(a=>a.startsWith(domain+'.')));
assert(validateEcrSemanticOwner('C2.EXPERIENCE_SELECTION.ATTENTION'));assert(validateEcrSemanticOwner('C3.COGNITIVE_TRANSLATION.PATTERN_DETECTION'));
assert.equal(validateEcrSemanticOwner('PERSONALITY'),false);assert.equal(validateEcrSemanticOwner('GENERAL'),false);
assert(registry.units.every(u=>u.customerCopyAllowed===false&&u.reviewState==='HUMAN_REVIEW_REQUIRED'));
const sources=JSON.parse(fs.readFileSync(registry.sourceIdentityAuthority));assert.equal(sources.baseSpectra.length,64);assert.equal(sources.gateLines.length,384);
console.log('PASS V4.1 W6: granular semantic owners; 64/384 source identity retained without invented personal mappings.');
