import {projectFigureEngine} from './ecr-runtime-projection-core.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
export async function projectEcrCarrierArchitecture(driverField){
 if(driverField?.owner!=='K1')throw Error('ECR_CARRIER_REQUIRES_K1');
 const embedding=await projectFigureEngine('FIG-4A',driverField);
 const architecture=await projectFigureEngine('FIG-4B',embedding);
 const {outputDigest,...base}=architecture;
 const baselineConfigurations=(driverField.drivers||[]).flatMap(d=>[...d.personalityActivation,...d.designActivation].filter(a=>a.status==='CALCULATED').map(a=>({driverId:d.driverId,layer:a.layer,bodyCode:a.bodyCode,environment:a.environment,provenance:'DERIVED'})));
 const stage=name=>architecture.internalStages.find(s=>s.runtimeOwner===`K2A.${name}`);
 const group=(field,name)=>({...architecture.outputSignature[field],dimensions:Object.fromEntries(stage(name).components.map(c=>[c.runtimeOwner.split('.').at(-1),c]))});
 const result={...base,...architecture.outputSignature,hierarchy:{levels:stage('HIERARCHY').components.map(c=>c.runtimeOwner.split('.').at(-1)),provenance:'INTERPRETED',authority:'FIG-4B',personalScaleInferred:false},capacity:group('capacity','CAPACITY'),constraint:group('constraint','CONSTRAINT'),integrity:group('integrity','INTEGRITY'),functionalConnectivity:group('functionalConnectivity','FUNCTIONAL_CONNECTIVITY'),embedding,baselineConfigurations,personalScaleEnvelope:['BODY','INDIVIDUAL','RELATIONAL'],scientificCausationClaimed:false};
 return {...result,outputDigest:await sha256Stable(result)};
}
