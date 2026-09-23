import {projectFigureEngine} from './ecr-runtime-projection-core.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
export async function projectEcrCarrierC1(architecture){
 if(architecture?.owner!=='K2A')throw Error('ECR_C1_REQUIRES_K2A');
 const p=await projectFigureEngine('FIG-4C',architecture);
 const {outputDigest,...base}=p;
 const result={...base,baselineConfigurations:architecture.baselineConfigurations,primaryEngines:Object.fromEntries(p.internalStages.map((s,i)=>[['intake','environment','perceptual','cognitive','biological','regulation'][i],s])),derivedProfiles:{connectivity:p.outputSignature.connectivityProfile,runtimeCost:p.outputSignature.runtimeCostProfile},carrierRuntimeStyle:p.outputSignature.carrierRuntimeStyle};
 return {...result,outputDigest:await sha256Stable(result)};
}
