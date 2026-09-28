import {createReportSectionNarrativeContract} from '../functions/personal-reading/narrative/report-section-contract.js';
import {buildReportSectionNarrativeBrief} from '../functions/personal-reading/narrative/report-section-brief.js';
import {composeReportSectionT2} from '../functions/personal-reading/narrative/report-section-t2-composer.js';
import {buildReportSectionGenerationIdentity,retryDecision,semanticRepairDecision} from '../functions/personal-reading/narrative/report-narrative-governance.js';
import {createEditorialAcceptanceArtifact,createCustomerDeliverySnapshot,createRenderedArtifactSnapshot} from '../functions/personal-reading/narrative/report-section-snapshot.js';
import {buildReportDeliveryR2} from '../functions/report-delivery/report-delivery-r2.js';
import {formatReportCoverFields,assertCoverOverlayValues} from '../functions/canonical-presentation-runtime/report-cover-overlay.js';
import {REPORT_COVER_OVERLAY_REGISTRY} from '../functions/canonical-presentation-runtime/report-cover-overlay-registry.js';

const roles=['STRUCTURE','MEANING','CONDITIONS','COUNTERWEIGHTS','OBSERVABLE_EXPRESSION','TIMING_RELEVANCE','NAVIGATION'];
const claims=roles.map((role,i)=>({claimId:'C'+(i+1),id:'C'+(i+1),explanationRole:role,claimType:role==='OBSERVABLE_EXPRESSION'?'QUESTION':'LIFE_DOMAIN_EXPLANATION',text:'Licensed '+role+' meaning '+(i+1),priority:'PRIMARY',semanticOperators:[role==='TIMING_RELEVANCE'?'TIMING_RELEVANCE':role==='OBSERVABLE_EXPRESSION'?'QUESTION':'CONTEXTUALIZES'],conditions:[],counterweights:[],timing:role==='TIMING_RELEVANCE'?[{window:'QA'}]:[],observableSignals:[],certainty:role==='OBSERVABLE_EXPRESSION'?'QUESTION':'BOUNDED',sourceRefs:['professionalModules/qa/'+i],license:{allowsObservedReality:false}}));
const contract=createReportSectionNarrativeContract({methodId:'BZR',sectionKey:'S04_CAREER',customerQuestion:'Career?',customerOutcome:'Understand career.',requiredClaimRoles:roles,timingPolicy:'WHEN_AUTHORITY_PRESENT'});
const richClaimIr={version:'QA-IR-v1',claims,reflectionQuestions:[],counterPrompts:[]};
const brief=await buildReportSectionNarrativeBrief({contract,richClaimIr,locale:'en',sourceAuthorityVersion:'QA-AUTH-v1'});
const candidate={blocks:roles.map((role,i)=>({role,text:'Customer-readable licensed explanation for '+role.toLowerCase()+' in this governed QA fixture.',claimRefs:['C'+(i+1)]}))};
const registry={models:[{providerId:'OPENAI',modelId:'qa-light',capabilityClass:'LIGHT',status:'AVAILABLE',planningCostRank:1}]};
const providerAdapters={OPENAI:async()=>({output:candidate,provider:'OPENAI',model:'qa-light',usage:{inputTokens:100,outputTokens:200}})};
const composed=await composeReportSectionT2({brief,registry,providerAdapters,requestId:'RNT2-CORE-QA'});
if(composed.status!=='PASS'||composed.internalOnly.actualTier!=='T2_GOVERNED_NATURAL_COMPOSITION'||composed.verification?.accepted!==true)throw Error('RNT2_CORE_T2_FAILED');
if(composed.verification.claimCoverage!==1)throw Error('RNT2_CORE_CLAIM_COVERAGE_FAILED');

const identity=await buildReportSectionGenerationIdentity({methodId:'BZR',sectionKey:'S04_CAREER',locale:'en',compositionVersion:'1',promptVersion:'1',authorityVersion:'1',claimIrVersion:'1',verifierVersion:'1',evidenceDigest:'abc',schemaVersion:'1',provider:'OPENAI',model:'qa-light'});
if(!identity.generationKey.startsWith('RNT2-'))throw Error('RNT2_GENERATION_IDENTITY_FAILED');
if(retryDecision({attemptCount:0,errorClass:'PROVIDER_TIMEOUT'}).retryAllowed!==true)throw Error('RNT2_RETRY_POLICY_FAILED');
if(semanticRepairDecision({verification:{accepted:false},repairCount:0}).repairAllowed!==true)throw Error('RNT2_REPAIR_POLICY_FAILED');

const accepted=await createEditorialAcceptanceArtifact({methodId:'BZR',sectionKey:'S04_CAREER',locale:'en',compositionVersion:'1',claimIrVersion:'1',authorityVersion:'1',verifierVersion:'1',editorialVersion:'1',contentDigest:'abc',accepted:true,acceptedAt:'2026-09-28T00:00:00.000Z',acceptedBy:'OWNER-QA'});
const delivery=await createCustomerDeliverySnapshot({methodId:'BZR',locale:'en',subjectFingerprint:'subject-fp',inputFingerprint:'input-fp',compositionVersion:'1',authorityVersion:'1',claimIrVersion:'1',verifierVersion:'1',semanticContent:{acceptedArtifact:accepted.artifactDigest}});
const render=await createRenderedArtifactSnapshot({semanticSnapshotId:delivery.semanticSnapshotId,renderVersion:'1',surface:'PDF',assetBindingVersion:'1',coverBindingVersion:'1',paginationVersion:'1',outputDigest:'abc'});
if(!delivery.immutable||!render.renderSnapshotId)throw Error('RNT2_SNAPSHOT_FAILED');
const envelope=buildReportDeliveryR2({methodId:'BZR',access:{state:'ENTITLED',reason:null},admitted:true,reportAvailable:true,semanticSnapshot:delivery});
if(envelope.access.state!=='FULL_REPORT'||envelope.providerRegenerationOnReopen!==false)throw Error('RNT2_DELIVERY_FAILED');

const exact={displayName:'QA Client',birthDate:'1989-11-15',birthTime:'22:50:00',timeAccuracy:'EXACT'};
const unknown={...exact,birthTime:null,timeAccuracy:'UNKNOWN'};
for(const methodId of Object.keys(REPORT_COVER_OVERLAY_REGISTRY)){
 const v=formatReportCoverFields({methodId,subject:exact});
 assertCoverOverlayValues({methodId,subject:exact,renderedValues:v});
 const u=formatReportCoverFields({methodId,subject:unknown});
 if(u.birthTime!=='—')throw Error('RNT2_UNKNOWN_TIME_FAILED:'+methodId);
}
console.log(JSON.stringify({status:'PASS',t2:{actualTier:composed.internalOnly.actualTier,claimCoverage:composed.verification.claimCoverage},generationKey:identity.generationKey,snapshots:{editorial:accepted.artifactDigest,semantic:delivery.semanticSnapshotId,render:render.renderSnapshotId},delivery:envelope.access.state,covers:Object.keys(REPORT_COVER_OVERLAY_REGISTRY)},null,2));
