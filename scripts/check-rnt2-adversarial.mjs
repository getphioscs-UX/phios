import assert from 'node:assert/strict';
import {createReportSectionNarrativeContract} from '../functions/personal-reading/narrative/report-section-contract.js';
import {buildReportSectionNarrativeBrief} from '../functions/personal-reading/narrative/report-section-brief.js';
import {verifyReportSectionComposition} from '../functions/personal-reading/narrative/report-section-semantic-verifier.js';
import {composeReportSectionT2} from '../functions/personal-reading/narrative/narrative-writer.js';
import {createReportSubjectPresentation,assertReportSubjectBinding} from '../functions/canonical-presentation-runtime/report-cover-subject.js';
import {formatReportCoverFields,renderReportCoverOverlay} from '../functions/canonical-presentation-runtime/report-cover-overlay.js';
import {classifyProviderFailure,retryDecision} from '../functions/personal-reading/narrative/report-narrative-governance.js';
import {verifyReportLocaleParity} from '../functions/personal-reading/narrative/report-locale-parity.js';
import {buildReportDeliveryR2} from '../functions/report-delivery/report-delivery-r2.js';
import {SEMANTIC_REVIEW_CHECKS} from '../functions/personal-reading/narrative/report-section-semantic-review.js';

const roles=['STRUCTURE','MEANING','CONDITIONS','COUNTERWEIGHTS'];
const contract=createReportSectionNarrativeContract({methodId:'BZR',sectionKey:'TEST',requiredClaimRoles:roles});
const ir={version:'QA',claims:roles.map((role,i)=>({claimId:'C'+i,explanationRole:role,text:'Only a conditional source meaning for '+role,sourceRefs:['source/'+i],conditions:['Needs support'],certainty:'SYMBOLIC_CONDITIONAL'}))};
const brief=await buildReportSectionNarrativeBrief({contract,richClaimIr:ir,locale:'en'});
const candidate={sourceBriefDigest:brief.briefSemanticDigest,blocks:brief.claims.map(c=>({role:c.role,text:c.text,claimRefs:[c.claimId],supportRefs:c.sourceRefs}))};
const reviewer=async({brief,candidateDigest})=>({...Object.fromEntries(SEMANTIC_REVIEW_CHECKS.map(k=>[k,true])),candidateDigest,sourceBriefDigest:brief.briefSemanticDigest,meaningfullyUsedClaimRefs:brief.claims.map(c=>c.claimId),reasons:[]});
assert.equal((await verifyReportSectionComposition({brief,candidate})).accepted,false,'No semantic review must fail closed');
assert.equal((await verifyReportSectionComposition({brief,candidate,semanticReview:reviewer})).accepted,true);
for(const mutate of [
 c=>{c.sourceBriefDigest='wrong'},
 c=>{c.blocks[0].supportRefs=['someone-else']},
 c=>{c.blocks[0].text='This causes you to become the director next year.'},
 c=>{c.blocks[0].claimRefs=['unknown']}
]){
 const c=structuredClone(candidate);mutate(c);
 assert.equal((await verifyReportSectionComposition({brief,candidate:c,semanticReview:reviewer})).accepted,false);
}
assert.equal((await verifyReportSectionComposition({brief:{...brief,claims:brief.claims.map(c=>({...c,conditions:[]}))},candidate,semanticReview:reviewer})).accepted,false);
assert.equal((await verifyReportSectionComposition({brief,candidate,semanticReview:async args=>({...await reviewer(args),boundariesPreserved:false})})).accepted,false);
assert.equal((await verifyReportSectionComposition({brief,candidate,semanticReview:async args=>({...await reviewer(args),meaningfullyUsedClaimRefs:[]})})).accepted,false);
const changed=await buildReportSectionNarrativeBrief({contract,richClaimIr:{...ir,claims:ir.claims.map(c=>({...c,conditions:['Different condition']}))},locale:'en'});
assert.notEqual(changed.sourceSemanticDigest,brief.sourceSemanticDigest);
const registry={models:[{providerId:'OPENAI',modelId:'qa-model',capabilityClass:'LIGHT',status:'AVAILABLE',planningCostRank:1}]};
let networkCalls=0;
const missing=await composeReportSectionT2({brief,registry,env:{},fetcher:()=>{networkCalls++;throw Error('not reachable')}});
assert.equal(networkCalls,0);assert.equal(missing.internalOnly.providerCalled,false);
assert.equal(missing.internalOnly.actualTier,'DETERMINISTIC_FALLBACK');
let generationCalls=0;
const failed=await composeReportSectionT2({brief,registry,providerAdapters:{OPENAI:async()=>{generationCalls++;return {output:{...candidate,sourceBriefDigest:'bad'}}}}});
assert.equal(failed.status,'FALLBACK');assert.equal(generationCalls,2);assert.equal(failed.internalOnly.repairCount,1);
assert.equal(classifyProviderFailure({code:'NARRATIVE_PROVIDER_REQUEST_FAILED',details:{status:429}}),'PROVIDER_RATE_LIMIT');
assert.equal(retryDecision({attemptCount:0,errorClass:classifyProviderFailure({details:{status:503}})}).retryAllowed,true);
assert.equal(retryDecision({attemptCount:0,errorClass:classifyProviderFailure({details:{status:401}})}).retryAllowed,false);
assert.equal(verifyReportLocaleParity({zhBrief:{...brief,locale:'zh-Hans'},enBrief:brief}).accepted,false);

const birth={inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0',birthDate:'2001-02-03',birthTime:null,timeAccuracy:'UNKNOWN',locale:'en',consent:{},birthPlace:{displayName:null,countryCode:null,latitude:null,longitude:null},timezone:{iana:null,utcOffsetAtBirth:null,source:'UNKNOWN',confidence:'UNKNOWN'}};
const subject=await createReportSubjectPresentation({subjectReference:'QA-A',displayName:'客户 <QA>',canonicalBirthInput:birth,identitySourceRef:'QA-person',birthSourceRef:'QA-birth'});
const expectedBinding={subjectReference:'QA-A',inputSubjectFingerprint:subject.subjectFingerprint,semanticSubjectFingerprint:subject.subjectFingerprint};
await assertReportSubjectBinding({presentation:subject,expectedBinding});
await assert.rejects(assertReportSubjectBinding({presentation:{...subject,displayName:'QA-B'},expectedBinding}),/COVER_SUBJECT_MISMATCH/);
await assert.rejects(assertReportSubjectBinding({presentation:subject,expectedBinding:{...expectedBinding,semanticSubjectFingerprint:'other'}}),/COVER_SUBJECT_MISMATCH/);
await assert.rejects(assertReportSubjectBinding({presentation:subject}),/REPORT_SUBJECT_MATCH_REQUIRED/);
for(const methodId of ['BZR','ZWR','AST','NUM','PROFILE','ECR','HD','CROSS']){
 assert.equal(formatReportCoverFields({methodId,subject}).birthTime,'—');
 assert.throws(()=>formatReportCoverFields({methodId,subject:{...subject,birthTime:'00:00:00'}}),/COVER_UNKNOWN_TIME_FABRICATED/);
 assert.equal(formatReportCoverFields({methodId,subject:{...subject,timeAccuracy:'APPROXIMATE',birthTime:'22:50:12'}}).birthTime,'≈ 22 : 50');
 assert.ok(renderReportCoverOverlay({methodId,subject}).includes('&lt;QA&gt;'));
}
assert.equal(formatReportCoverFields({methodId:'HD',subject}).birthDate,'03 / 02 / 2001');
assert.throws(()=>buildReportDeliveryR2({methodId:'BZR',access:{state:'ENTITLED'},admitted:true,reportAvailable:true,semanticSnapshot:{immutable:true}}),/SNAPSHOT_BINDING_MISMATCH/);
const noSnapshot=buildReportDeliveryR2({methodId:'BZR',access:{state:'ENTITLED'},admitted:true,reportAvailable:true});
assert.equal(noSnapshot.availability.fullReport,false);
console.log('PASS: RNT2 adversarial semantics, missing-key evidence, repair limit, source digests, eight-cover identity/unknown-time, locale and delivery gates. Injected fixtures only; no live provider proof.');
