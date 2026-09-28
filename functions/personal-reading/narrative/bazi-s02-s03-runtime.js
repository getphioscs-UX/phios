import {buildReconciledBaZiBrief} from './bazi-s02-s03-reconciliation.js';
import {composePublicationNarrative} from './narrative-writer.js';
import {careerReviewState} from './bazi-s04-customer-value.js';
import {sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
export async function validateS05OwnerAcceptance(record){
 if(!record)return false;
 const {acceptanceDigest,...seed}=record;
 return acceptanceDigest==='f69e6ea0a417cd7cabedccf6e7ee3f1864d944a43d253ee2d7a63ce47c381ae4'&&await sha256Stable(seed)===acceptanceDigest&&record.decision==='ACCEPT'&&['en','zh-Hans'].every(l=>record.locales?.[l]?.decision==='ACCEPT');
}
export async function buildReconciledBaZiT2({sectionKey,reading,locale,temporalSnapshot,registry,env,providerAdapters,requestId}){
 const brief=await buildReconciledBaZiBrief({sectionKey,reading,locale,temporalSnapshot});
 if(!brief.reconciledNarrativeIR.eligibility.eligible)return {status:'NOT_ELIGIBLE',brief,internalOnly:{providerCalled:false,actualTier:'NOT_RUN'}};
 const r=await composePublicationNarrative({sectionBrief:brief,registry,env,providerAdapters,requestId});
 return {...r,locale,brief,reconciledNarrativeIR:brief.reconciledNarrativeIR,editorialQuality:r.verification?.editorialQuality,reviewState:careerReviewState({technicalPass:r.verification?.technicalAccepted===true,editorialPass:r.verification?.editorialQuality?.accepted===true}),ownerAcceptance:'PENDING',reviewOnly:true};
}
