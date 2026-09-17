import assert from 'node:assert/strict';
import fs from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import {METHODS,diversityCases,buildDiversityCase} from './smr-diversity-support.mjs';
import {buildAcceptedMethodCustomerResult} from '../functions/customer-projection/method-customer-reading-v2.js';
import {adaptAcceptedMethodReadingEnvelope} from '../functions/single-method-reading/method-production-adapter-core.js';
import {buildCustomerClaimIR} from '../functions/single-method-reading/customer-claim-ir.js';
import {visualHdFixture} from './lib/visual-hd-fixture.mjs';
import {visualProfileFixtures} from './lib/visual-profile-fixtures.mjs';
import {adaptHdCrossEnvelope,adaptProfileCrossEnvelope} from '../functions/runtime-reading/cross-hd-profile-adapters.js';
import {buildCrossPerspectiveInputIR} from '../functions/runtime-reading/cross-perspective-input-ir.js';
import {buildCrossSuccessorReview,maybeBuildProductionCombinedReading} from '../functions/runtime-reading/cross-reading-production.js';
import {classifyCrossDimension} from '../functions/runtime-reading/cross-method-reading-ir-v2.js';
import {CROSS_SUCCESSOR_MAPPING} from '../functions/runtime-reading/cross-successor-semantic-mapping.js';
import {CROSS_INPUT_SUCCESSOR_ADMISSION} from '../functions/runtime-reading/cross-input-successor-admission.js';
import {SHARED_SEMANTIC_DIMENSIONS} from '../functions/runtime-reading/cross-semantic-registry-v2.js';
const root='content/customer-experience-rebuild/r12r4b/cross/successors/hd-profile-r1',docs='docs/visual-report-r1/cross-successor';
fs.mkdirSync(root,{recursive:true});fs.mkdirSync(`${docs}/cases`,{recursive:true});
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const validate=new Ajv2020({strict:false}).compile(JSON.parse(fs.readFileSync('content/customer-experience-rebuild/r12r4b/cross/contracts/cross-perspective-input-ir-v1.schema.json')));
for(const dimensions of Object.values(CROSS_SUCCESSOR_MAPPING).flatMap(Object.values))for(const d of dimensions)assert(SHARED_SEMANTIC_DIMENSIONS.some(s=>s.code===d));
const seeds={};for(const id of METHODS)seeds[id]=await buildDiversityCase(id,diversityCases[id][0]);
const rows=[],gaps=new Map();let index=0;
for(const locale of ['en','zh-Hans']){
 const pairs={},methodResults=[];
 for(const id of METHODS){const result=await buildAcceptedMethodCustomerResult({canonicalProjection:seeds[id].projection,locale});methodResults.push(result);const envelope=adaptAcceptedMethodReadingEnvelope(result,{expectedMethodId:id});pairs[id]={envelope,claimCollection:buildCustomerClaimIR({acceptedMethodReadingEnvelope:envelope})};}
 const hd=await visualHdFixture(locale),profiles=await visualProfileFixtures(locale);
 pairs.HD=await adaptHdCrossEnvelope({product:hd});pairs.PROFILE=await adaptProfileCrossEnvelope({...profiles[1],locale});
 const baseline=await maybeBuildProductionCombinedReading({acceptedMethodReadings:methodResults});assert.equal(baseline.publicationState,'CUSTOMER_PUBLISHABLE_CROSS_READING');assert.equal(await maybeBuildProductionCombinedReading({acceptedMethodReadings:[methodResults[0],{state:'READY_TO_READ',methodId:'HD'}]}),null);
 const run=async(ids,focus,override={},currentRealityRef=null)=>{
  const selected=ids.map(id=>override[id]||pairs[id]);const result=await buildCrossSuccessorReview({acceptedMethodReadingEnvelopes:selected.map(x=>x.envelope),claimCollections:selected.map(x=>x.claimCollection),currentRealityRef});
  assert(validate(result.crossInput),JSON.stringify(validate.errors));assert.equal(result.productionAdmission.customerPublishable,false);assert.equal(result.reading.boundaries.customerCutoverActivated,false);assert.equal(result.reading.boundaries.methodVotingPerformed,false);assert.equal(result.currentReality.influencedCrossClaims,false);
  for(const c of result.reading.claims){assert(['COMMON','COMPLEMENTARY','TENSION','CONTEXT_DEPENDENT','OPEN'].includes(c.supportType));assert(c.boundary.methodAgreementIsNotProof);assert(!c.boundary.percentageMatchCreated);assert(c.claimRefs.every(ref=>result.crossInput.methodInputs.some(m=>m.claimRefs.includes(ref))));}
  for(const c of result.crossInput.methodInputs.filter(m=>['HD','PROFILE'].includes(m.methodId)).flatMap(m=>m.claims)){assert(c.evidenceConditions.length);assert(c.lineage.ruleRefs.length);if(c.confidenceClass==='LOW_CONFIDENCE_HYPOTHESIS')assert.equal(c.claimType,'OPEN');}
  for(const gap of result.unmappedClaims)gaps.set(`${gap.methodId}:${gap.subject}`,gap);
  const caseId=`CROSS-HP-${String(++index).padStart(3,'0')}-${locale}`;write(`${docs}/cases/${caseId}.json`,{caseId,locale,synthetic:true,focus,...result});rows.push({caseId,locale,focus,methodIds:ids,status:'PASS',path:`cases/${caseId}.json`,unmappedCount:result.unmappedClaims.length,crossClaimCount:result.reading.claims.length});return result;
 };
 for(const id of METHODS){await run(['HD',id],'REQUIRED_PAIR');await run(['PROFILE',id],'REQUIRED_PAIR');}
 await run(['HD','PROFILE'],'HD_PROFILE_DISTINCTION');
 for(const candidate of ['HD','PROFILE'])for(let i=0;i<METHODS.length;i++)for(let j=i+1;j<METHODS.length;j++)await run([candidate,METHODS[i],METHODS[j]],'THREE_METHOD');
 for(const ids of [['AST','BZR','ZWR','HD','PROFILE'],['AST','BZR','ZWR','NUM','HD','PROFILE'],[...METHODS,'HD','PROFILE']])await run(ids,'FIVE_TO_SEVEN_METHOD_REVIEW_NOT_PRODUCTION');
 for(const profile of profiles)await run(['HD','PROFILE'],'PROFILE_ENTRY_'+profile.mode,{PROFILE:await adaptProfileCrossEnvelope({...profile,locale})});
 const absent=await adaptHdCrossEnvelope({product:await visualHdFixture(locale,{advanced:false})});assert(absent.envelope.acceptedUnits.every(u=>u.subject!=='ADVANCED_MODIFIER'));await run(['HD','AST'],'HD_OPTIONAL_ABSENCE',{HD:absent});
 await run(['HD','PROFILE','ECR'],'CURRENT_REALITY_PRESENT_SEPARATE',{},'SYNTHETIC_CURRENT_REALITY_REVIEW_OBSERVATION');
 // Negative trust-boundary cases never become accepted campaign source claims.
 await assert.rejects(()=>buildCrossPerspectiveInputIR({acceptedMethodReadingEnvelopes:[pairs.AST.envelope,pairs.HD.envelope],claimCollections:[pairs.AST.claimCollection,pairs.HD.claimCollection]}),/PUBLIC_METHOD_NOT_ALLOWED/);
 await assert.rejects(()=>adaptHdCrossEnvelope({product:{...hd,publicationDecision:{customerPublishable:false}}}),/AUTHORITY_REQUIRED/);
 await assert.rejects(()=>adaptHdCrossEnvelope({product:{...hd,professionalProductDigest:'tampered'}}),/DIGEST_MISMATCH/);
 const tampered=structuredClone(profiles[0]);tampered.signals[0].value=999;await assert.rejects(()=>adaptProfileCrossEnvelope({...tampered,locale}),/DIGEST_MISMATCH/);
 const noLineage=structuredClone(pairs.HD.claimCollection);noLineage.claims[0].lineage.ruleRefs=[];await assert.rejects(()=>buildCrossPerspectiveInputIR({acceptedMethodReadingEnvelopes:[pairs.AST.envelope,pairs.HD.envelope],claimCollections:[pairs.AST.claimCollection,noLineage]},{successorReview:true}),/COMPLETE_CLAIM_LINEAGE/);
 const unsupported=await run(['AST','PROFILE'],'IMPORTED_RESULT_UNMAPPED',{PROFILE:await adaptProfileCrossEnvelope({...profiles.find(p=>p.mode==='IMPORT_EXTERNAL_RESULT'),locale})});assert.equal(unsupported.methodCoverage.find(m=>m.methodId==='PROFILE').state,'SEPARATE_UNMAPPED');
}
// Conflict and classification regressions: explicit synthetic classifier inputs,
// never materialized as human-accepted method evidence or a customer reading.
const claimA={claimId:'SYNTHETIC-HD',methodId:'HD',claimType:'CONDITION'},claimB={claimId:'SYNTHETIC-PROFILE',methodId:'PROFILE',claimType:'OPEN'};
const idx=new Map([[claimA.claimId,claimA],[claimB.claimId,claimB]]),row={methodClaimRefs:[...idx.keys()],tensions:[claimB.claimId],open:[claimB.claimId]};assert.equal(classifyCrossDimension(row,idx),'TENSION');assert.equal(classifyCrossDimension({...row,tensions:[]},idx),'OPEN');
const result={status:'PASS',cases:rows.length,passed:rows.length,beforeAdmittedMethods:METHODS,candidateMethods:['HD','PROFILE'],uniqueSharedDimensions:SHARED_SEMANTIC_DIMENSIONS.length,newSharedDimensions:0,humanAcceptance:'PENDING',productionAdmission:false,unmappedDomains:[...gaps.values()],conflictClassification:'PASS_SYNTHETIC_UNIT_INPUTS',currentReality:'PRESERVED_SEPARATELY_EXISTING_CROSS_GATE_CLOSED',historicalPdfUsedAsEvidence:false,rows};
write(`${root}/machine-results.json`,result);write(`${root}/production-admission.json`,CROSS_INPUT_SUCCESSOR_ADMISSION);write(`${root}/semantic-mapping-matrix.json`,{status:'REVIEW_CANDIDATE',mapping:CROSS_SUCCESSOR_MAPPING,unmapped:[...gaps.values()],newDimensions:[]});write(`${docs}/cases.json`,result);console.log(JSON.stringify({status:result.status,cases:rows.length,unmappedDomains:gaps.size,productionAdmission:false}));
