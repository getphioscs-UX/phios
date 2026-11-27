import {assertPaidReportWorkerFence} from './paid-report-worker-fence.js';
import {paidReportStateStore} from './paid-report-state-store.js';
import {verifyCustomerReportArtifact} from './customer-report-artifact.js';
const verified=new WeakMap();
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
// New issuance only. Read the existing shared Job/fence; never create a Job,
// infer its ID from a report ID, or mutate historical candidate bindings.
export async function resolveActiveReportIssuanceBindingR2(env,legacyBinding,artifact){
 const fence=await assertPaidReportWorkerFence(env);
 if(!fence||fence.ownerAccountId!==legacyBinding?.ownerAccountId)fail('ISSUANCE_ACTIVE_JOB_REQUIRED');
 await verifyCustomerReportArtifact(artifact,{customerId:legacyBinding.ownerAccountId,reportArtifactId:legacyBinding.reportId});
 const job=await paidReportStateStore(env,fence.clock).job(fence.jobId,fence.ownerAccountId);
 if(!job||job.jobId!==fence.jobId||job.claimedBy!==fence.claimToken||job.leaseExpiresAt<=fence.clock()||['REFUNDED','DELIVERED'].includes(job.state))fail('ISSUANCE_JOB_FENCE_MISMATCH');
 for(const key of ['environment','ownerAccountId','orderId','purchaseId','productId'])if(!legacyBinding[key]||legacyBinding[key]!==job[key])fail('ISSUANCE_PURCHASE_BINDING_MISMATCH');
 if(legacyBinding.jobId&&legacyBinding.jobId!==job.jobId)fail('ISSUANCE_JOB_ID_MISMATCH');
 if(!['BZR','ZWR'].includes(job.methodCode)||artifact.methodCode!==job.methodCode||artifact.productCode!==job.productId||artifact.personId!==job.personId||artifact.inputDigest!==job.inputDigest||artifact.authorityPackVersion!==job.authorityDigest||!job.personVersion||(artifact.personVersion!==undefined&&artifact.personVersion!==job.personVersion))fail('ISSUANCE_SOURCE_BINDING_MISMATCH');
 const binding=Object.freeze({...legacyBinding,jobId:job.jobId,subjectId:job.personId,personVersion:job.personVersion,methodCode:job.methodCode,inputDigest:job.inputDigest,authorityDigest:job.authorityDigest,publicationDigest:artifact.publicationIR.digest||artifact.artifactDigest,publicationVersion:artifact.reportContentVersion,artifactDigest:artifact.artifactDigest});
 verified.set(binding,{env,jobId:job.jobId,ownerAccountId:job.ownerAccountId,claimToken:fence.claimToken});return binding;
}
export async function assertVerifiedIssuanceBindingR2(binding){const witness=verified.get(binding);if(!witness)fail('ISSUANCE_RESOLVED_JOB_WITNESS_REQUIRED');const fence=await assertPaidReportWorkerFence(witness.env);if(!fence||fence.jobId!==witness.jobId||fence.ownerAccountId!==witness.ownerAccountId||fence.claimToken!==witness.claimToken)fail('ISSUANCE_JOB_WITNESS_STALE');return binding;}
