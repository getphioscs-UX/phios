import {
  SHARED_PROFESSIONAL_RUNTIME_CODE
} from '../method-runtime/shared-professional-runtime.js';
import {
  SHARED_INTERPRETATION_RUNTIME_CODE,
  CANONICAL_INTERPRETATION_CANDIDATE_SCHEMA_VERSION
} from '../method-runtime/shared-interpretation-runtime.js';
import { stableSerialize } from '../method-runtime/shared-calculation-runtime.js';

export const NUM_PROFESSIONAL_INTEGRATION_RUNTIME_CODE =
  'NUM_PROFESSIONAL_INTEGRATION_RUNTIME';
export const NUM_PROFESSIONAL_INTEGRATION_RUNTIME_VERSION='1.0.0';
const TYPES=new Set(['NUMBER','NUMBER_STRUCTURE','NUMBER_CYCLE']);
const GATES=['productionReady','professionalReady','validationPassed','regressionPassed',
'commercialLicensePassed','sharedRuntimeImplemented','professionalBoundaryPassed','professionalWorkflowPassed'];

function object(v,m){if(!v||typeof v!=='object'||Array.isArray(v))throw new TypeError(m);}
function candidate(v){
  object(v,'NUM Interpretation Candidate is required.');
  if(v.schemaVersion!==CANONICAL_INTERPRETATION_CANDIDATE_SCHEMA_VERSION ||
     v.runtimeCode!==SHARED_INTERPRETATION_RUNTIME_CODE ||
     v.candidateStatus!=='candidate' || v.interpretationCreated!==true ||
     v.finalConclusionCreated!==false || v.professionalReportCreated!==false ||
     v.realityDecisionCreated!==false || v.professionalConclusionCreated!==false ||
     !TYPES.has(v.projectionReference?.projectionType)) {
    throw new TypeError('NUM-W5 requires an unreleased NUM Interpretation Candidate.');
  }
}
function method(d){
  object(d,'NUM Method Eligibility is required.');
  if(d.methodCode!=='NUMEROLOGY'||d.decisionAuthority!=='INTERPRETIVE_METHOD_GOVERNANCE_EXTENSION')
    throw new TypeError('Invalid NUM eligibility authority.');
  const failed=GATES.filter(k=>d[k]!==true);
  if(failed.length) throw new Error(`NUM_METHOD_NOT_PROFESSIONALLY_ELIGIBLE:${failed.join(',')}`);
  if(d.productionAuthorityCreated===true) throw new TypeError('Eligibility cannot create release authority.');
}
function professional(d,id){
  object(d,'Professional Eligibility is required.');
  if(d.contract!=='phi-os.professional-eligibility-decision.v1'||d.eligible!==true||
     d.professional_id!==id||!d.required_capability_codes?.includes('NUMERIC_PROFESSIONAL_REVIEW')||
     d.missing_capability_codes?.length!==0) throw new Error('NUM_PROFESSIONAL_NOT_ELIGIBLE');
}
function workspace(c,id){
  object(c,'Workspace context is required.');
  if(c.professionalId!==id||c.assignmentStatus!=='active'||c.consentStatus!=='active'||
     c.boundaryAcknowledged!==true||c.workspaceAccessGranted!==true)
    throw new Error('NUM_PROFESSIONAL_WORKSPACE_GATE_FAILED');
}

export function createNumProfessionalIntegrationRuntime({
 sharedProfessionalRuntime,methodEligibilityResolver,professionalEligibilityResolver
}={}){
  if(sharedProfessionalRuntime?.runtimeCode!==SHARED_PROFESSIONAL_RUNTIME_CODE ||
     typeof sharedProfessionalRuntime.process!=='function') throw new TypeError('SHARED_PROFESSIONAL_RUNTIME is required.');
  return Object.freeze({
    runtimeCode:NUM_PROFESSIONAL_INTEGRATION_RUNTIME_CODE,
    runtimeVersion:NUM_PROFESSIONAL_INTEGRATION_RUNTIME_VERSION,
    async release(request){
      object(request,'NUM-W5 request is required.'); candidate(request.interpretationCandidate);
      workspace(request.professionalContext,request.professionalId);
      const snap=stableSerialize(request.interpretationCandidate);
      const m=await methodEligibilityResolver({methodCode:'NUMEROLOGY',methodVersion:request.methodVersion});
      method(m);
      const p=await professionalEligibilityResolver({
        professionalId:request.professionalId,
        requiredCapabilityCodes:['NUMERIC_PROFESSIONAL_REVIEW'],
        methodCode:'NUMEROLOGY'
      });
      professional(p,request.professionalId);
      const release=await sharedProfessionalRuntime.process({
        runtimeCode:SHARED_PROFESSIONAL_RUNTIME_CODE,methodCode:'NUMEROLOGY',pluginCode:'NUM',
        deliverableTypeCode:request.deliverableTypeCode,professionalId:request.professionalId,
        interpretationCandidate:request.interpretationCandidate,releaseVersion:request.releaseVersion
      });
      if(stableSerialize(request.interpretationCandidate)!==snap) throw new Error('NUM_CANDIDATE_MUTATION_FORBIDDEN');
      return Object.freeze({
        runtimeCode:NUM_PROFESSIONAL_INTEGRATION_RUNTIME_CODE,runtimeVersion:'1.0.0',
        methodCode:'NUMEROLOGY',pluginCode:'NUM',
        integrationStatus:'released_through_shared_professional_runtime',
        professionalRelease:release,parallelProfessionalRuntimeCreated:false,
        sharedProfessionalRuntimeUsed:true
      });
    }
  });
}
