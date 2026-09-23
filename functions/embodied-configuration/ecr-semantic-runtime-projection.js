import {ECR_V41_AUTHORITIES} from './ecr-v41-authorities.generated.js';
const owners=ECR_V41_AUTHORITIES['content/embodied-configuration/meaning/ecr-semantic-runtime-owner-registry-v2.json'];
const sources=ECR_V41_AUTHORITIES['content/interpretation/source/gate-line-source-registry-v1.json'];
export function validateEcrSemanticOwner(owner){return owners.ownerAddresses.includes(owner);}
export function projectEcrSemanticDepth(driverField){
 return driverField.drivers.flatMap(driver=>[...driver.personalityActivation,...driver.designActivation].filter(a=>a.status==='CALCULATED').map(a=>({semanticUnitId:`${driver.driverId}:${a.layer}:${a.bodyCode}`,gate:a.p64.gate,line:a.p64.line,bodyCode:a.bodyCode,snapshotType:a.layer,driverId:driver.driverId,sourceIdentityRefs:[...sources.baseSpectra,...sources.gateLines].filter(s=>s.gate===a.p64.gate&&(!s.line||s.line===a.p64.line)).map(s=>s.sourceIdentity),runtimeOwners:[],provenanceClass:'UNKNOWN',reviewState:'OWNER_MAPPING_PENDING',customerSurfaceAllowed:false,customerMeaningRef:null,lineage:a.lineage})));
}
