import {projectFigureEngine} from './ecr-runtime-projection-core.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
export async function projectEcrCarrierArchitecture(driverField){
 if(driverField?.owner!=='K1')throw Error('ECR_CARRIER_REQUIRES_K1');
 const embedding=await projectFigureEngine('FIG-4A',driverField);
 const architecture=await projectFigureEngine('FIG-4B',embedding);
 const {outputDigest,...base}=architecture;
 const baselineConfigurations=(driverField.drivers||[]).flatMap(d=>[...d.personalityActivation,...d.designActivation].filter(a=>a.status==='CALCULATED').map(a=>({driverId:d.driverId,layer:a.layer,bodyCode:a.bodyCode,environment:a.environment,provenance:'DERIVED'})));
 const result={...base,...architecture.outputSignature,embedding,baselineConfigurations,personalScaleEnvelope:['BODY','INDIVIDUAL','RELATIONAL'],scientificCausationClaimed:false};
 return {...result,outputDigest:await sha256Stable(result)};
}
