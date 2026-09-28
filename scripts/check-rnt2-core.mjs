import {SEMANTIC_REVIEW_CHECKS} from '../functions/personal-reading/narrative/report-section-semantic-review.js';
import {createReportSectionNarrativeContract} from '../functions/personal-reading/narrative/report-section-contract.js';
import {buildReportSectionNarrativeBrief} from '../functions/personal-reading/narrative/report-section-brief.js';
import {composeReportSectionT2} from '../functions/personal-reading/narrative/report-section-t2-composer.js';
import {buildReportSectionGenerationIdentity,retryDecision,semanticRepairDecision} from '../functions/personal-reading/narrative/report-narrative-governance.js';
import {createEditorialAcceptanceArtifact,createCustomerDeliverySnapshot,createRenderedArtifactSnapshot} from '../functions/personal-reading/narrative/report-section-snapshot.js';
import {buildReportDeliveryR2} from '../functions/report-delivery/report-delivery-r2.js';
import {createReportSectionGenerationCache} from '../functions/personal-reading/narrative/report-section-generation-cache.js';
import {buildReportPublicationIrV2,assertPublicationIrV2Preservation} from '../functions/personal-reading/narrative/report-publication-ir-v2.js';
import {formatReportCoverFields,assertCoverOverlayValues} from '../functions/canonical-presentation-runtime/report-cover-overlay.js';
import {REPORT_COVER_OVERLAY_REGISTRY} from '../functions/canonical-presentation-runtime/report-cover-overlay-registry.js';
import {createReportSubjectPresentationFromAccountPerson,assertReportSubjectMatch} from '../functions/canonical-presentation-runtime/report-cover-subject.js';

const roles=['STRUCTURE','MEANING','CONDITIONS','COUNTERWEIGHTS','OBSERVABLE_EXPRESSION','TIMING_RELEVANCE','NAVIGATION'];
const claims=roles.map((role,i)=>({claimId:'C'+(i+1),id:'C'+(i+1),explanationRole:role,claimType:role==='OBSERVABLE_EXPRESSION'?'QUESTION':'LIFE_DOMAIN_EXPLANATION',text:'Licensed '+role+' meaning '+(i+1),priority:'PRIMARY',semanticOperators:[role==='TIMING_RELEVANCE'?'TIMING_RELEVANCE':role==='OBSERVABLE_EXPRESSION'?'QUESTION':'CONTEXTUALIZES'],conditions:[],counterweights:[],timing:role==='TIMING_RELEVANCE'?[{window:'QA'}]:[],observableSignals:[],certainty:role==='OBSERVABLE_EXPRESSION'?'QUESTION':'BOUNDED',sourceRefs:['professionalModules/qa/'+i],license:{allowsObservedReality:false}}));
const contract=createReportSectionNarrativeContract({methodId:'BZR',sectionKey:'S04_CAREER',customerQuestion:'Career?',customerOutcome:'Understand career.',requiredClaimRoles:roles,timingPolicy:'WHEN_AUTHORITY_PRESENT'});
const richClaimIr={version:'QA-IR-v1',claims,reflectionQuestions:[],counterPrompts:[]};
const brief=await buildReportSectionNarrativeBrief({contract,richClaimIr,locale:'en',sourceAuthorityVersion:'QA-AUTH-v1'});
const candidate={sourceBriefDigest:brief.briefSemanticDigest,blocks:roles.map((role,i)=>({role,text:role==='OBSERVABLE_EXPRESSION'?'What should the customer compare or observe in this licensed QA fixture?':'Customer-readable licensed explanation for '+role.toLowerCase()+' in this governed QA fixture.',claimRefs:['C'+(i+1)],supportRefs:['professionalModules/qa/'+i]}))};
const registry={models:[{providerId:'OPENAI',modelId:'gpt-5.6-luna',capabilityClass:'LIGHT',status:'AVAILABLE',planningCostRank:1}]};
let providerCalls=0;
const providerAdapters={OPENAI:async(request)=>{providerCalls++;if(request.taskType==='REPORT_SECTION_SEMANTIC_VERIFICATION')return {output:{...Object.fromEntries(SEMANTIC_REVIEW_CHECKS.map(k=>[k,true])),candidateDigest:request.payload.candidateDigest,sourceBriefDigest:brief.briefSemanticDigest,meaningfullyUsedClaimRefs:brief.claims.map(c=>c.claimId),reasons:[]}};return {output:candidate,provider:'OPENAI',model:'gpt-5.6-luna',usage:{inputTokens:100,outputTokens:200}}}};
const sectionCache=createReportSectionGenerationCache();
const composed=await composeReportSectionT2({brief,registry,providerAdapters,requestId:'RNT2-CORE-QA',cache:sectionCache});
if(composed.status!=='PASS'||composed.internalOnly.actualTier!=='T2_GOVERNED_NATURAL_COMPOSITION'||composed.verification?.accepted!==true)throw Error('RNT2_CORE_T2_FAILED');
if(composed.verification.claimCoverage!==1)throw Error('RNT2_CORE_CLAIM_COVERAGE_FAILED');
const cached=await composeReportSectionT2({brief,registry,providerAdapters,requestId:'RNT2-CORE-QA-REOPEN',cache:sectionCache});
<<<<<<< HEAD
if(cached.cacheHit!==true||cached.internalOnly.providerCalled!==false||providerCalls!==2)throw Error('RNT2_SECTION_CACHE_REOPEN_FAILED');
=======
if(cached.cacheHit!==true||cached.internalOnly.providerCalled!==false||providerCalls!==1)throw Error('RNT2_SECTION_CACHE_REOPEN_FAILED');
const publicationIr=await buildReportPublicationIrV2({methodId:'BZR',reportVersion:'QA-R1',sectionKey:'S04_CAREER',locale:'en',brief,candidate:composed.candidate,semanticOwner:'QA-AUTH-v1',compositionOwner:'REPORT-NARRATIVE-T2-R1'});
const pubCheck=assertPublicationIrV2Preservation({publicationIr,brief});
if(pubCheck.accepted!==true||publicationIr.blocks.length!==roles.length)throw Error('RNT2_PUBLICATION_IR_V2_FAILED');
>>>>>>> 09bbc9702b202a76c9846cc4d01772e9431a0f6c

const identity=await buildReportSectionGenerationIdentity({methodId:'BZR',sectionKey:'S04_CAREER',locale:'en',compositionVersion:'1',promptVersion:'1',authorityVersion:'1',claimIrVersion:'1',verifierVersion:'1',evidenceDigest:'abc',schemaVersion:'1',provider:'OPENAI',model:'gpt-5.6-luna'});
if(!identity.generationKey.startsWith('RNT2-'))throw Error('RNT2_GENERATION_IDENTITY_FAILED');
if(retryDecision({attemptCount:0,errorClass:'PROVIDER_TIMEOUT'}).retryAllowed!==true)throw Error('RNT2_RETRY_POLICY_FAILED');
if(semanticRepairDecision({verification:{accepted:false},repairCount:0}).repairAllowed!==true)throw Error('RNT2_REPAIR_POLICY_FAILED');

const accepted=await createEditorialAcceptanceArtifact({methodId:'BZR',sectionKey:'S04_CAREER',locale:'en',compositionVersion:'1',claimIrVersion:'1',authorityVersion:'1',verifierVersion:'1',editorialVersion:'1',contentDigest:'abc',accepted:true,acceptedAt:'2026-09-28T00:00:00.000Z',acceptedBy:'OWNER-QA'});
const delivery=await createCustomerDeliverySnapshot({methodId:'BZR',locale:'en',subjectFingerprint:'subject-fp',inputFingerprint:'input-fp',compositionVersion:'1',authorityVersion:'1',claimIrVersion:'1',verifierVersion:'1',semanticContent:{acceptedArtifact:accepted.artifactDigest}});
const render=await createRenderedArtifactSnapshot({semanticSnapshotId:delivery.semanticSnapshotId,renderVersion:'1',surface:'PDF',assetBindingVersion:'1',coverBindingVersion:'1',paginationVersion:'1',outputDigest:'abc'});
if(!delivery.immutable||!render.renderSnapshotId)throw Error('RNT2_SNAPSHOT_FAILED');
const envelope=buildReportDeliveryR2({methodId:'BZR',access:{state:'ENTITLED',reason:null},admitted:true,reportAvailable:true,semanticSnapshot:delivery,expectedBinding:{locale:'en',subjectFingerprint:'subject-fp',inputFingerprint:'input-fp'},productionAdmission:{state:'PRODUCTION_ADMITTED',semanticSnapshotId:delivery.semanticSnapshotId}});
if(envelope.access.state!=='FULL_REPORT'||envelope.providerRegenerationOnReopen!==false)throw Error('RNT2_DELIVERY_FAILED');

const canonicalBirthInput={birthDate:'1989-11-15',birthTime:'22:50:00',birthPlace:{displayName:'QA Place',countryCode:'MY',latitude:3.1,longitude:101.7},timezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtBirth:'+08:00',source:'HUMAN_DECLARATION',confidence:'HIGH'},timeAccuracy:'EXACT',locale:'en',consent:{confirmed:true},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
const accountPersonReference={personId:'QA-PERSON',accountOwnerUserId:'QA-ACCOUNT',subjectClass:'SELF',displayName:'QA Client',relationshipToAccountOwner:'SELF',relationshipVerificationState:'SELF_DECLARED',createdAt:'2026-09-28T00:00:00Z',updatedAt:'2026-09-28T00:00:00Z',version:'1'};
const reportSubject=await createReportSubjectPresentationFromAccountPerson({accountPersonReference,canonicalBirthInput,birthSourceRef:'QA-BIRTH'});
assertReportSubjectMatch({presentation:reportSubject,subjectReference:'QA-PERSON',birthDate:'1989-11-15',birthTime:'22:50:00',timeAccuracy:'EXACT'});
let subjectMismatchClosed=false;try{assertReportSubjectMatch({presentation:reportSubject,subjectReference:'WRONG'})}catch(e){subjectMismatchClosed=e.message==='COVER_SUBJECT_MISMATCH'}
if(!subjectMismatchClosed)throw Error('RNT2_REPORT_SUBJECT_FAIL_CLOSED_FAILED');
const exact=reportSubject;
const unknown={...exact,birthTime:null,timeAccuracy:'UNKNOWN'};
for(const methodId of Object.keys(REPORT_COVER_OVERLAY_REGISTRY)){
 const v=formatReportCoverFields({methodId,subject:exact});
 assertCoverOverlayValues({methodId,subject:exact,renderedValues:v});
 const u=formatReportCoverFields({methodId,subject:unknown});
 if(u.birthTime!=='—')throw Error('RNT2_UNKNOWN_TIME_FAILED:'+methodId);
}
console.log(JSON.stringify({status:'PASS',t2:{actualTier:composed.internalOnly.actualTier,claimCoverage:composed.verification.claimCoverage},publicationIr:{version:publicationIr.schemaVersion,blocks:publicationIr.blocks.length,preservation:pubCheck.accepted},reportSubject:{authority:'RDG_ACCOUNT_PERSON_REFERENCE + MCD3_CANONICAL_BIRTH_INPUT',subjectFingerprint:reportSubject.subjectFingerprint,failClosed:subjectMismatchClosed},generationKey:identity.generationKey,snapshots:{editorial:accepted.artifactDigest,semantic:delivery.semanticSnapshotId,render:render.renderSnapshotId},delivery:envelope.access.state,covers:Object.keys(REPORT_COVER_OVERLAY_REGISTRY)},null,2));
