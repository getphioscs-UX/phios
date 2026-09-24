import {ECR_V41_AUTHORITIES} from './ecr-v41-authorities.generated.js';
import {resolveEcrSemanticComposition} from './ecr-semantic-composition-r2.js';
const owners=ECR_V41_AUTHORITIES['content/embodied-configuration/meaning/ecr-semantic-runtime-owner-registry-v2.json'];
const sources=ECR_V41_AUTHORITIES['content/interpretation/source/gate-line-source-registry-v1.json'];
const policy=ECR_V41_AUTHORITIES['content/embodied-configuration/v4-1/semantic-admission-r2/composition-policy.json'];
export function validateEcrSemanticOwner(owner){return owners.ownerAddresses.includes(owner);}
export function projectEcrSemanticDepth(driverField){
 return driverField.drivers.flatMap(driver=>[...driver.personalityActivation,...driver.designActivation].filter(a=>a.status==='CALCULATED').map(a=>{
  const composition=resolveEcrSemanticComposition({gate:a.p64.gate,line:a.p64.line,driverId:driver.driverId,layer:a.layer},policy,owners.ownerAddresses);
  return {semanticUnitId:`${driver.driverId}:${a.layer}:${a.bodyCode}`,gate:a.p64.gate,line:a.p64.line,bodyCode:a.bodyCode,snapshotType:a.layer,driverId:driver.driverId,sourceIdentityRefs:[...sources.baseSpectra,...sources.gateLines].filter(s=>s.gate===a.p64.gate&&(!s.line||s.line===a.p64.line)).map(s=>s.sourceIdentity),...composition,provenanceClass:composition.customerSurfaceAllowed?'INTERPRETED':'UNKNOWN',reviewState:composition.customerSurfaceAllowed?'ADMITTED_COMPOSITION':'COMPOSITION_ADMISSION_PENDING',customerMeaningRef:composition.customerMeaningRefs[0]||null,lineage:a.lineage};
 }));
}
