import {stable} from '../functions/personal-reading/deep-manuscript/bazi-deep-manuscript-contract.js';
import fs from 'node:fs';
import {generateBaziDeepManuscript} from '../functions/personal-reading/deep-manuscript/bazi-deep-manuscript-runtime.js';
import {ROOT,read,write,loadBaziReviewAuthority,loadBaziPlanningConfig} from './lib/bazi-deep-manuscript-review.mjs';
import {createBaziFileStore} from './lib/bazi-deep-manuscript-store.mjs';
// Explicit separate command; never registered in zero-cost command registry.
if(process.env.REPORT_PROVIDER_LIVE_ALLOWED!=='true'||process.env.REPORT_ZERO_COST_REPLAY==='true')throw Error('REPORT_PROVIDER_LIVE_OPT_IN_REQUIRED');
if(!process.env.OPENAI_API_KEY)throw Error('OPENAI_API_KEY_NOT_CONFIGURED__NO_REQUEST_RESERVED');
const arg=name=>{const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:null;};
const approvalPath=arg('--approval'),modelPath=arg('--verified-model'),candidateId=arg('--candidate');
if(!approvalPath||!modelPath||!candidateId||!/^[A-Za-z0-9_-]{1,80}$/.test(candidateId))throw Error('BDM_EXPLICIT_APPROVAL_MODEL_AND_CANDIDATE_REQUIRED');
const approval=read(approvalPath),verifiedModel=read(modelPath),pack=await loadBaziReviewAuthority(),{model:planningModel,policy,history}=loadBaziPlanningConfig();
if(approval.candidateId!==candidateId)throw Error('BDM_APPROVAL_CANDIDATE_MISMATCH');
if(stable(verifiedModel)!==stable(planningModel)||Date.now()>Date.parse(planningModel.reviewAfter)||verifiedModel.modelId!==planningModel.modelId||!verifiedModel.verificationSource||!verifiedModel.verifiedAt||verifiedModel.pricingVerified!==true||verifiedModel.constraintsVerified!==true)throw Error('BDM_VERIFIED_MODEL_RECORD_REQUIRED');
const result=await generateBaziDeepManuscript({mode:'EXPERIMENT',controlledSequentialExperiment:true,env:process.env,approval,pack,model:verifiedModel,policy,history,candidateId,experimentId:candidateId,subjectId:pack.subject.subjectId,store:createBaziFileStore('.runtime-evidence/bazi-deep-manuscript-r2/'+candidateId)});
if(result.snapshot)write(ROOT+'LIVE-MANUSCRIPT-SNAPSHOT.json',result.snapshot);
write(ROOT+'LIVE-EXPERIMENT-RESULT.json',{candidateId,authorityDigest:pack.digest,state:result.snapshot?'MANUSCRIPT_COMPLETE':result.state,providerCalls:result.providerCalls,cacheHit:result.cacheHit||false,snapshotDigest:result.snapshot?.digest||null,checkpointedUnits:result.checkpoint?Object.keys(result.checkpoint.units):null});
console.log(JSON.stringify({candidateId,state:result.snapshot?'READY_FOR_HUMAN_REVIEW':result.state,providerCalls:result.providerCalls,snapshotPath:result.snapshot?ROOT+'LIVE-MANUSCRIPT-SNAPSHOT.json':null}));
