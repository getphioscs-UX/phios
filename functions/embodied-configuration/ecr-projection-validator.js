import {getEcrCanonicalOntology} from './ecr-ontology-registry.js';
const list=v=>Array.isArray(v)?v:[];const group=(p,c)=>list(p?.calculation?.structures).find(x=>x?.code===c);const uniq=x=>[...new Set(x)];
export function validateEcrCanonicalProjection(p){
 const failures=[],o=getEcrCanonicalOntology();
 if(p?.schemaVersion!=='PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0')failures.push('SCHEMA_INVALID');
 if(p?.method?.publicMethodCode!=='EMBODIED_CONFIGURATION_PROJECTION')failures.push('METHOD_INVALID');
 if(p?.calculation?.status!=='COMPLETE'||p?.calculation?.deterministic!==true)failures.push('CALCULATION_INCOMPLETE');
 if(p?.interpretation?.included!==false||p?.interpretation?.meaningAuthorityCreated!==false)failures.push('INTERPRETATION_BOUNDARY_INVALID');
 const expected=[['ECR_CONTEXT',12,'contextId'],['ECR_GRAMMAR',16,'code'],['ECR_QUESTION',16,'questionId'],['ECR_MOTION',8,'motionId'],['ECR_CONFIGURATION',64,'configurationId'],['ECR_ACTIVATION',8,'activationId']];
 for(const [code] of expected)if(list(group(p,code)?.items).length!==1)failures.push(`${code}_SINGLE_ITEM_REQUIRED`);
 const caps=list(group(p,'ECR_CAPABILITIES')?.items);if(!caps.length||caps.filter(x=>x.value==='PRIMARY').length!==1)failures.push('CAPABILITY_PRIMARY_INVALID');
 const drivers=list(group(p,'ECR_DRIVER_PRIORITY')?.items);if(drivers.length!==12||uniq(drivers.map(x=>x.code)).length!==12||uniq(drivers.map(x=>x.meta?.rank)).length!==12)failures.push('DRIVER_PRIORITY_INVALID');
 const c=group(p,'ECR_CONTEXT')?.items?.[0]?.code,g=group(p,'ECR_GRAMMAR')?.items?.[0]?.code,q=group(p,'ECR_QUESTION')?.items?.[0]?.code,m=group(p,'ECR_MOTION')?.items?.[0]?.code,h=group(p,'ECR_CONFIGURATION')?.items?.[0]?.code,a=group(p,'ECR_ACTIVATION')?.items?.[0]?.code;
 if(!o.ecrSpecific.cosmologicalContext.some(x=>x.contextId===c))failures.push('CONTEXT_UNKNOWN');if(!o.coreTheory.grammarCodes.includes(g))failures.push('GRAMMAR_UNKNOWN');if(!o.coreTheory.questionCodes.includes(q))failures.push('QUESTION_UNKNOWN');if(!o.ecrSpecific.motions.some(x=>x.motionId===m))failures.push('MOTION_UNKNOWN');if(!o.ecrSpecific.configurations.some(x=>x.configurationId===h))failures.push('CONFIGURATION_UNKNOWN');if(!o.ecrSpecific.activations.some(x=>x.activationId===a))failures.push('ACTIVATION_UNKNOWN');
 const hi=o.ecrSpecific.configurations.find(x=>x.configurationId===h);if(hi&&hi.environmentPriorityMotionId!==m)failures.push('MOTION_CONFIGURATION_UPPER_MISMATCH');
 const ratio=p?.calculation?.coordinates?.position?.withinConfigurationRatio;if(!Number.isFinite(ratio)||ratio<0||ratio>1)failures.push('CONFIGURATION_RATIO_INVALID');
 if(!p?.projectionId)failures.push('PROJECTION_ID_REQUIRED');
 return Object.freeze({valid:failures.length===0,failures:Object.freeze(failures)});
}
export default validateEcrCanonicalProjection;
