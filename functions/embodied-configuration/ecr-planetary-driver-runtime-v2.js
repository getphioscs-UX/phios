import {ECR_V41_AUTHORITIES} from './ecr-v41-authorities.generated.js';
const binding=ECR_V41_AUTHORITIES['content/embodied-configuration/ecr-planetary-driver-binding-v1.json'];
import {resolveEcrEnvironment} from './ecr-p64-environment-bridge-runtime.js';
export function projectEcrDriverField(initialization){
 const drivers=binding.entries.map(entry=>{
  const activations=layer=>entry.mechanicalSourceBodies.map(body=>{
   const activation=initialization.activations.find(a=>a.layer===layer&&a.bodyCode===body);
   return activation?{...activation,environment:activation.status==='CALCULATED'?resolveEcrEnvironment(activation.eclipticLongitude):null}:{layer,bodyCode:body,status:'UNKNOWN',provenance:'UNKNOWN',unknownReason:initialization.unknownReason||'SHARED_ASTRONOMY_CAPABILITY_NOT_AVAILABLE'};
  });
  const personalityActivation=activations('PERSONALITY'),designActivation=activations('DESIGN');
  return {driverId:entry.driverId,bodyBinding:entry.mechanicalSourceBodies,personalityActivation,designActivation,status:[...personalityActivation,...designActivation].every(a=>a.status==='CALCULATED')?'CALCULATED':'UNKNOWN',provenance:'DERIVED',semanticDepthRefs:entry.semanticSourceRefs,runtimeOwnerRefs:entry.runtimeOwnerRefs,baselineThemes:[],lineage:{bindingAuthority:'content/embodied-configuration/ecr-planetary-driver-binding-v1.json',initializationDigest:initialization.calculationDigest||null}};
 });
 return {classification:'BASELINE_DRIVER_FIELD',drivers,currentDriverPriority:{status:'UNKNOWN',value:null,reason:'K4_EVIDENCE_REQUIRED'},rankingCreated:false};
}
