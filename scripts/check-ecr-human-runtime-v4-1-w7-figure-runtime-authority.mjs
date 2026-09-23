import assert from 'node:assert/strict';import {ECR_FIGURES} from '../functions/embodied-configuration/ecr-figure-authority.js';
assert.equal(Object.keys(ECR_FIGURES).length,10);
for(const figure of Object.values(ECR_FIGURES)){
 assert.equal(figure.sourceClass,'FIGURE_ARCHITECTURE_AUTHORITY');assert.equal(figure.scientificCausationClaimed,false);
 for(const component of figure.internalComponents){assert(component.runtimeOwner);assert(component.inputs.length);assert(component.evidenceRequired);assert.equal(component.personalResolutionRequirements.fallbackPolicy,'UNKNOWN');for(const child of component.components){assert(child.runtimeOwner);assert(child.inputs.length);assert(child.outputs.length);assert(child.evidenceRequired);assert.equal(child.personalValue,'UNKNOWN');}}
 for(const output of figure.derivedOutputs){assert(output.upstreamInputs.length);assert.equal(output.provenance,'UNKNOWN');}
}
assert.equal(ECR_FIGURES['FIG-4C'].internalComponents.length,6);assert.equal(ECR_FIGURES['FIG-5C'].internalComponents.length,8);
console.log('PASS V4.1 W7: ten figure contracts, precise owners and explicit personal/current evidence requirements.');
