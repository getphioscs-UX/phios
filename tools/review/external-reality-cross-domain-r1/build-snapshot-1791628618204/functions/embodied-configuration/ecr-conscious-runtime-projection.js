import {projectEcrExperience} from './ecr-experience-c2-projection.js';
import {projectEcrExpression} from './ecr-expression-c3-projection.js';
import {projectEcrAgency} from './ecr-agency-c4-projection.js';
import {projectEcrIdentity} from './ecr-identity-c5-projection.js';
export async function projectEcrConsciousRuntime(c1){const c2=await projectEcrExperience(c1),c3=await projectEcrExpression(c2),c4=await projectEcrAgency(c3),c5=await projectEcrIdentity(c4);return {c2,c3,c4,c5};}
