import {ECR_V41_AUTHORITIES} from './ecr-v41-authorities.generated.js';
const environment=ECR_V41_AUTHORITIES['content/embodied-configuration/ecr-environment-first-configuration-v1.json'];
import {resolveEcrP64} from './ecr-p64-mechanical-adapter.js';
const byGate=new Map(environment.entries.map(entry=>[entry.kingWenNumber,entry]));
export function resolveEcrEnvironment(longitude){
 const p64=resolveEcrP64(longitude),entry=byGate.get(p64.gate);
 if(!entry)throw Error('ECR_P64_ENVIRONMENT_BRIDGE_MISSING');
 return Object.freeze({p64,provenance:'DERIVED',ecrConfigurationRef:entry.configurationId,hexagramRef:entry.hexagramRef,upperTrigramRef:entry.upperTrigramRef,lowerTrigramRef:entry.lowerTrigramRef,environmentPriorityMotionId:entry.environmentPriorityMotionId,embodiedResponseMotionId:entry.embodiedResponseMotionId,semanticAuthorityRef:'content/embodied-configuration/ecr-environment-first-configuration-v1.json',rule:'P64_GATE_TO_EXISTING_HEXAGRAM_IDENTITY',meaningCreated:false});
}
