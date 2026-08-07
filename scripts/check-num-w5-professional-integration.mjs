import assert from 'node:assert/strict';
import {createNumProfessionalIntegrationRuntime,NUM_PROFESSIONAL_INTEGRATION_RUNTIME_CODE}
from '../functions/core-method-runtime/num-professional-integration-runtime.js';
const shared={runtimeCode:'SHARED_PROFESSIONAL_RUNTIME',async process(){return{
runtimeCode:'SHARED_PROFESSIONAL_RUNTIME',methodReference:{methodCode:'NUMEROLOGY',pluginCode:'NUM'},
releaseStatus:'released',professionalReviewCompleted:true,boundaryValidationCompleted:true,
deliverableAssemblyCompleted:true,professionalSignatureCompleted:true,released:true};}};
const blocked=createNumProfessionalIntegrationRuntime({sharedProfessionalRuntime:shared,
methodEligibilityResolver:async()=>({methodCode:'NUMEROLOGY',decisionAuthority:'INTERPRETIVE_METHOD_GOVERNANCE_EXTENSION',
productionReady:false,professionalReady:false,validationPassed:false,regressionPassed:false,
commercialLicensePassed:false,sharedRuntimeImplemented:false,professionalBoundaryPassed:false,
professionalWorkflowPassed:false,productionAuthorityCreated:false}),
professionalEligibilityResolver:async()=>({})});
const candidate={schemaVersion:'PHI-OS-CANONICAL-INTERPRETATION-CANDIDATE-v1.0.0',
runtimeCode:'SHARED_INTERPRETATION_RUNTIME',candidateStatus:'candidate',interpretationCreated:true,
finalConclusionCreated:false,professionalReportCreated:false,realityDecisionCreated:false,
professionalConclusionCreated:false,projectionReference:{projectionType:'NUMBER'}};
const req={runtimeCode:NUM_PROFESSIONAL_INTEGRATION_RUNTIME_CODE,professionalId:'P1',
deliverableTypeCode:'NUMERIC_REPORT',releaseVersion:'1.0.0',interpretationCandidate:candidate,
professionalContext:{professionalId:'P1',assignmentStatus:'active',consentStatus:'active',
boundaryAcknowledged:true,workspaceAccessGranted:true}};
await assert.rejects(()=>blocked.release(req),/NUM_METHOD_NOT_PROFESSIONALLY_ELIGIBLE/);
console.log('✓ NUM-W5 Professional Integration passed.');
console.log('  Current governance blocks release; no parallel professional authority exists.');
