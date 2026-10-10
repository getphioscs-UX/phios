// ECR coordinates delegate to the single shared P64 authority.
import {resolveGateLine} from '../method-runtime/personal-structure/gate-line.js';
import {GATE_SPAN_DEG} from '../method-runtime/personal-structure/gate-wheel.js';
export const P64_MAPPING_VERSION='ECR-P64-SHARED-v4.1';
export function resolveEcrP64(longitude){
 const p=resolveGateLine(longitude),stageSpan=GATE_SPAN_DEG/8;
 const index=Math.min(7,Math.floor(p.positionWithinGateDeg/stageSpan));
 const within=p.positionWithinGateDeg-index*stageSpan;
 return Object.freeze({...p,wheelSlotIndex:p.gateIndex,provenanceClass:'CALCULATED',lineBoundaryExact:p.boundaryExact,activationStage:`A${index+1}`,positionWithinActivationStageDeg:within,activationStageBoundaryExact:within===0,mappingVersion:P64_MAPPING_VERSION,sourceAuthorityRefs:['functions/method-runtime/personal-structure/gate-wheel.js','functions/method-runtime/personal-structure/gate-line.js','content/embodied-configuration/ecr-activation-registry-v1.json']});
}
