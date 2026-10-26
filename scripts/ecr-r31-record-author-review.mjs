import fs from 'node:fs';import {recordEcrManuscriptDecision,storeEcrReusableCandidate,recordEcrReusableDecision} from './lib/ecr-author-case-store.mjs';
const request=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));let result;
if(request.action==='MANUSCRIPT_DECISION')result=recordEcrManuscriptDecision(request);
else if(request.action==='STORE_REUSABLE_CANDIDATE')result=await storeEcrReusableCandidate(request);
else if(request.action==='REUSABLE_DECISION')result=await recordEcrReusableDecision(request);
else throw Error('EXPLICIT_REVIEW_ACTION_REQUIRED');
// Never print author prose, private file paths, factors or birth inputs.
console.log(JSON.stringify({recorded:true,customerPublishable:false,reusableSemanticAccepted:result.review?.semanticAccepted===true,authorTextAccepted:result.review?.authorTextAccepted===true,providerCalls:0}));
