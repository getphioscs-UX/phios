import {buildWealthBrief} from './bazi-s05-market-reading.js';
import {composePublicationNarrative} from './narrative-writer.js';
import {sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {careerReviewState} from './bazi-s04-customer-value.js';
export const WEALTH_RUNTIME_VERSION='RNT2-BZR-S05-v1.0.0';
export async function validateS04OwnerAcceptance(record){
 if(!record)return false;
 const {acceptanceDigest,...seed}=record;
 return acceptanceDigest==='9678188c3d1b1a37f8b472f27fe95cb53a4a8a9ef6e796e2938ff096e0956872'&&await sha256Stable(seed)===acceptanceDigest&&record.decision==='ACCEPT'&&['zh-Hans','en'].every(l=>record.locales?.[l]?.decision==='ACCEPT');
}
export async function buildBaZiS05T2({reading,locale,temporalSnapshot,registry,env,providerAdapters,requestId}){
 const brief=await buildWealthBrief({reading,locale,temporalSnapshot});
 if(!brief.wealthNarrativeIR.eligibility.eligible)return {status:'NOT_ELIGIBLE',brief,internalOnly:{providerCalled:false,actualTier:'NOT_RUN',reasons:brief.wealthNarrativeIR.eligibility.reasons}};
 const r=await composePublicationNarrative({sectionBrief:brief,registry,env,providerAdapters,requestId});
 return {...r,locale,brief,wealthNarrativeIR:brief.wealthNarrativeIR,editorialQuality:r.verification?.editorialQuality,reviewState:careerReviewState({technicalPass:r.verification?.technicalAccepted===true,editorialPass:r.verification?.editorialQuality?.accepted===true}),ownerAcceptance:'PENDING',reviewOnly:true};
}
