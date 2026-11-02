import {adaptAcceptedMethodResultForSmr} from './accepted-method-result-adapter.js';
import {composeSingleMethodReadingIR} from './single-method-reading-ir.js';

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};

/**
 * Mirrored executable admission. It intentionally stays false until the
 * external 48-report campaign is returned as 48/48 HUMAN_ACCEPTED.
 */
export const SMR_PRODUCTION_ADMISSION=freeze({
  schemaVersion:'PHI-OS-SMR-PRODUCTION-ADMISSION-v1.0.0',
  productionAllowed:false,
  customerCutoverAllowed:false,
  methods:{AST:false,BZR:false,NUM:false,ZWR:false},
  blocker:'SMR_48_OF_48_HUMAN_ACCEPTANCE_REQUIRED'
});

export async function maybeBuildProductionSingleMethodReading({methodResult,customerIntent=null,locale='en',availableTimingContext=null,currentRealityRefs=[]}={}){
  if(SMR_PRODUCTION_ADMISSION.productionAllowed!==true||SMR_PRODUCTION_ADMISSION.methods[methodResult?.methodId]!==true)return null;
  const candidate=await composeSingleMethodReadingIR({methodResult,acceptedInterpretationResult:adaptAcceptedMethodResultForSmr(methodResult),customerIntent,locale,availableTimingContext,currentRealityRefs});
  return freeze({...candidate,state:'PRODUCTION',governance:{...candidate.governance,productionAdmission:'HUMAN_REVIEWED_SMR_COMPOSITION_RULESET'}});
}

