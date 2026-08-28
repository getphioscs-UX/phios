import {adaptAcceptedMethodReadingEnvelope} from './method-production-adapter-core.js';
export const adaptEcrProductionInput=methodResult=>adaptAcceptedMethodReadingEnvelope(methodResult,{expectedMethodId:'ECR'});
