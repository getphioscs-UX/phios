import {ECR_FIGURES} from './ecr-figure-authority.js';
import {sha256Stable,deepFreeze} from '../interpretation-runtime/mir7-utils.js';
export function unknownValue(owner,sourceRefs,reason='PERSONAL_RESOLVER_NOT_ADMITTED'){
 return {value:null,provenance:'UNKNOWN',status:'UNKNOWN',unknownReason:reason,runtimeOwner:owner,sourceRefs};
}
export async function projectFigureEngine(figureId,upstream){
 const figure=ECR_FIGURES[figureId];if(!figure)throw Error('ECR_FIGURE_AUTHORITY_REQUIRED');
 if(!upstream||!upstream.outputDigest)throw Error(`ECR_${figure.runtimeOwner}_UPSTREAM_REQUIRED`);
 const refs=[figureId,upstream.outputDigest];
 const internalStages=figure.internalComponents.map(c=>({runtimeOwner:c.runtimeOwner,relationType:c.relationType,components:c.components.map(component=>unknownValue(component.runtimeOwner,refs)),personalValue:unknownValue(c.runtimeOwner,refs),taxonomy:c.taxonomy,personalResolutionRequirements:c.personalResolutionRequirements}));
 const outputSignature=Object.fromEntries(figure.derivedOutputs.map(o=>[o.output,unknownValue(`${figure.runtimeOwner}.${o.output}`,refs)]));
 const result={owner:figure.runtimeOwner,figureId,internalStages,semanticOwnerRefs:internalStages.flatMap(s=>s.components.map(c=>c.runtimeOwner)),outputSignature,unknown:internalStages.flatMap(s=>s.components.map(c=>c.runtimeOwner)),provenance:'INTERPRETED',scope:'ARCHITECTURAL_PROJECTION_NOT_PERSONAL_CONCLUSION',boundRuntimeState:null,lineage:{upstreamOwner:upstream.owner,upstreamDigest:upstream.outputDigest,figureAuthority:figureId},customerSurfaceAllowed:false};
 return deepFreeze({...result,outputDigest:await sha256Stable(result)});
}
