import { parseArgs, reviewCandidate } from './lib/car-production/car-production-v1.mjs';
const { positional, options }=parseArgs(process.argv.slice(2)); const candidateCode=positional[0];
if(!candidateCode||!options.reviewer||!options.decision) throw new Error('USAGE: npm run car:review-candidate -- <CANDIDATE> --reviewer TL --decision accept|changes_required|reject [--semantic pass|fail] [--traceability pass|fail] [--brand pass|fail] [--accessibility pass|fail] [--rights pass|fail]');
const dimensions={semanticAccuracy:options.semantic||'fail',knowledgeTraceability:options.traceability||'fail',brandCompliance:options.brand||'fail',accessibility:options.accessibility||'fail',rightsLicense:options.rights||'fail'};
const review=await reviewCandidate({candidateCode,reviewerCode:options.reviewer,decision:options.decision,dimensions,reviewNotes:options.notes?[options.notes]:[]});
console.log(JSON.stringify({status:'REVIEW_RECORDED',reviewCode:review.reviewCode,reviewDigest:review.reviewDigest,decision:review.decision,approvalCreated:false},null,2));
