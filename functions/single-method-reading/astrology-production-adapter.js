import {adaptAcceptedMethodReadingEnvelope} from './method-production-adapter-core.js';
import {applyAstMfpRPlanetSignRecovery} from '../ast-full-production/ast-mfp-r-planet-sign-recovery.js';
export const adaptAstrologyProductionInput=methodResult=>adaptAcceptedMethodReadingEnvelope(applyAstMfpRPlanetSignRecovery(methodResult),{expectedMethodId:'AST'});
