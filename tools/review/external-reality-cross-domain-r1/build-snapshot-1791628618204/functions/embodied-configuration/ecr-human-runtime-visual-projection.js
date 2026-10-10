import {ECR_V41_AUTHORITIES} from './ecr-v41-authorities.generated.js';
const bridge=ECR_V41_AUTHORITIES['content/embodied-configuration/ecr-p64-environment-bridge-v1.json'];
const environments=ECR_V41_AUTHORITIES['content/embodied-configuration/ecr-environment-first-configuration-v1.json'];
export function projectEcrHumanRuntimeVisual(ir,locale='en'){
 if(ir?.schemaVersion!=='PHI-OS-ECR-HUMAN-RUNTIME-CONFIGURATION-v4.1')throw Error('ECR_V41_IR_REQUIRED');
 const labels=locale==='zh-Hans'?['载体','体验','表达','行动','身份','反馈']:['Carrier','Experience','Expression','Agency','Identity','Feedback'];
 return {schemaVersion:'PHI-OS-ECR-MANDALA-PROJECTION-v4.1',locale,projectionId:ir.configurationId,sectors:bridge.entries.map(s=>{const e=environments.entries.find(e=>e.configurationId===s.ecrConfigurationRef);return {...s,label:locale==='zh-Hans'?e.chineseNameZhHans:e.canonicalName};}),markers:ir.initialization.activations.filter(a=>a.status==='CALCULATED').map(a=>({longitude:a.eclipticLongitude,layer:a.layer,bodyCode:a.bodyCode,gate:a.p64.gate,line:a.p64.line,activationStage:a.p64.activationStage})),pipeline:labels,continuity:locale==='zh-Hans'?['稳定','适应','维护','恢复','漂移','重组']:['Stability','Adaptation','Maintenance','Recovery','Drift','Reorganization'],currentReality:ir.currentReality.status,drivers:ir.driverField.drivers.map(d=>({driverId:d.driverId,status:d.status,bodies:d.bodyBinding})),boundaries:{rendererRecalculates:false,rendererCreatesMeaning:false,currentStateInferred:false}};
}
