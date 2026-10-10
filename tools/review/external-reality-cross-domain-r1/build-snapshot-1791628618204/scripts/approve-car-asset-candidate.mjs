import { approveCandidate, parseArgs } from './lib/car-production/car-production-v1.mjs';
const { positional, options }=parseArgs(process.argv.slice(2)); const candidateCode=positional[0];
if(!candidateCode||!options.approver) throw new Error('USAGE: npm run car:approve-candidate -- <CANDIDATE> --approver TL --decision approved|conditionally_approved|rejected|revoked');
const approval=await approveCandidate({candidateCode,approverCode:options.approver,decision:options.decision||'approved',conditions:options.condition?[options.condition]:[]});
console.log(JSON.stringify({status:'APPROVAL_RECORDED',approvalCode:approval.approvalCode,approvalDigest:approval.approvalDigest,decision:approval.decision,publicationCreated:false},null,2));
