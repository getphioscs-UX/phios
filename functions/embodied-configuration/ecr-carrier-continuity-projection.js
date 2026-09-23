import {projectFigureEngine} from './ecr-runtime-projection-core.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
export async function projectEcrCarrierContinuity(c1){
 if(c1?.owner!=='C1')throw Error('ECR_CONTINUITY_REQUIRES_C1');
 const stabilization=await projectFigureEngine('FIG-4D',c1),continuous=await projectFigureEngine('FIG-4E',stabilization);
 const {outputDigest,...base}=continuous;
 const result={...base,stabilizationArchitecture:stabilization,continuityBaseline:stabilization.outputSignature.continuityBaseline,continuityState:{currentState:'UNBOUND',provenance:'UNKNOWN',evidenceRefs:[],dynamicConfidence:null}};
 return {...result,outputDigest:await sha256Stable(result)};
}
