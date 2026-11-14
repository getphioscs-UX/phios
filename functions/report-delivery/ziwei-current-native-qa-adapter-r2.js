import {createZiweiPaidProviderContext} from './ziwei-paid-provider-context.js';
import {ziweiPaidReportAdapter,evaluateZiweiNativePaidInputs} from './paid-report-ziwei-adapter.js';
import {generateAndReleaseAccountZiwei} from '../account/ziwei-account-delivery.js';
import {assertMethodGeneration} from './method-render-contract.js';
import {personIdentity} from '../account/canonical-person-store.js';
import {resolveZiweiLiveTargetContext} from '../zi-wei-full-production/ziwei-live-target-context-runtime.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
// Existing native/shared Job/Renderer/Account owners, opt-in local execution only.
// This adapter is not registered in PAID_REPORT_METHODS and grants no sales.
export function createZiweiCurrentNativeQaAdapterR2({loadGeneratedCandidate}){
 if(typeof loadGeneratedCandidate!=='function')fail('ZWR_CURRENT_SOURCE_LOADER_REQUIRED');
 const local=(c,j)=>{if(c.env.PHIOS_ENVIRONMENT!=='local'||c.env.STRIPE_ENVIRONMENT!=='QA'||c.env.PHIOS_LOCAL_ZWR_CURRENT_NATIVE_QA!=='true'||personIdentity(c).userId!==j.ownerAccountId)fail('ZWR_CURRENT_NATIVE_LOCAL_QA_ONLY');};
 return Object.freeze({...ziweiPaidReportAdapter,version:'ZWR-CURRENT-NATIVE-LOCAL-QA-R2',p8Admitted:true,admissionScope:'ISOLATED_CURRENT_SUBJECT_QA_NOT_COMMERCIAL',
 async readiness(c,j){local(c,j);const native=await evaluateZiweiNativePaidInputs(c,j);return {...native,productionConfigReady:true,localExecutionOnly:true};},
 async prepare(c,j){const r=await this.readiness(c,j);if(r.personVersion!==j.personVersion||r.inputDigest!==j.inputDigest||r.authorityDigest!==j.authorityDigest)fail('ZWR_CURRENT_JOB_SOURCE_MISMATCH');return {personId:j.personId,locale:'zh-Hans'};},
 async generate(c,j,selection){local(c,j);const candidate=await loadGeneratedCandidate(c,j);await assertMethodGeneration(candidate);const s=candidate?.snapshot?.semanticContent;
 if(candidate.schemaVersion!=='ZWR-VFR-R1-AUTO-DEEP-CANDIDATE-v3'||candidate.customerId!==j.ownerAccountId||candidate.personId!==j.personId||candidate.personVersion!==j.personVersion||candidate.purchaseId!==j.purchaseId||candidate.productionAdmissionGranted!==false||s.vfrCompactAuthoringPackDigest!==j.authorityDigest||await sha256Stable(resolveZiweiLiveTargetContext(s.evidence.targetContext))!==await sha256Stable(resolveZiweiLiveTargetContext(j.methodInputs?.targetContext)))fail('ZWR_CURRENT_CANDIDATE_JOB_MISMATCH');
 const paidReportBinding={ownerAccountId:j.ownerAccountId,purchaseId:j.purchaseId,orderId:j.orderId,productId:j.productId,reportId:j.reportId,authorityDigest:j.authorityDigest};
 const bound={...candidate,paidReportBinding};await createZiweiPaidProviderContext({context:c,candidate:bound,authorityDigest:j.authorityDigest,semanticKey:'LOCAL_CURRENT_SUBJECT_BODY_REPLAY:'+s.vfrDeepManuscriptDigest});const r=await generateAndReleaseAccountZiwei(c,{...selection,targetContext:resolveZiweiLiveTargetContext(j.methodInputs.targetContext)},{generateCandidate:async()=>bound});return {reportId:r.reportId};}
 });
}
