import {ZIWEI_VFR_R1_GENERATION_VERSION} from './ziwei-vfr-r1-version.js';
export const ZWR_VFR_METHOD_PROFILE=Object.freeze({
 profileVersion:'ZWR-VFR-R1-METHOD-PUBLICATION-PROFILE-v1',
 methodCode:'ZWR',productId:'COM-REPORT-ZIWEI-FULL',generationVersion:ZIWEI_VFR_R1_GENERATION_VERSION,
 compositionVersion:ZIWEI_VFR_R1_GENERATION_VERSION,
 publicationIrVersion:'ZWR-VFR-R1-DEEP-PUBLICATION-IR-v1',
 pagePlanVersion:'ZWR-VFR-R1-ADAPTIVE-LANGUAGE-SEQUENTIAL-v6',pagePlanMode:'ADAPTIVE_REFLOW',expectedPageRule:'PLAN_LENGTH',
 diagramRegistryVersion:'ZWR-VFR-R1-DIAGRAM-DATA-v1',
 rendererVersion:'ZWR-VFR-R1-DEEP-RENDERER-v6',rendererContractVersion:'ZWR_VFR_PHYSICAL_PAGE_CONTRACT_V1',
 presentationMode:'BILINGUAL',contentHumanAcceptance:'EXISTING_ACCEPTED_REFERENCE',
 semanticReviewCalls:0,publicationProviderCalls:0,rerenderProviderCalls:0,reopenProviderCalls:0,
 releaseStatus:'BLOCKED_UNTIL_DEPLOYED_SNAPSHOT_RENDERER_SUCCESSOR',unresolvedFields:[]
});
export function requireZwrVfrProfile(profile=ZWR_VFR_METHOD_PROFILE){
 if(profile!==ZWR_VFR_METHOD_PROFILE||profile.unresolvedFields.length||!profile.profileVersion||profile.generationVersion!==ZIWEI_VFR_R1_GENERATION_VERSION)throw Object.assign(new Error('METHOD_PUBLICATION_PROFILE_UNRESOLVED'),{code:'METHOD_PUBLICATION_PROFILE_UNRESOLVED',status:409});
 return profile;
}

// A deployed native renderer admission is distinct from the shared all-method proof.
// It must exist before a real paid writing attempt; local synthetic dependencies
// exercise the deterministic implementation without granting this admission.
export async function requireZwrVfrGenerationAdmission(env){
 const object=await env.PRIVATE_REPORTS?.get('qa/method-delivery/ZWR/generation-admission.json');
 const receipt=object?await object.json():null;
 if(receipt?.schemaVersion!=='METHOD_GENERATION_ADMISSION_V1'||receipt.methodCode!=='ZWR'||receipt.state!=='ACCEPTED'||receipt.scope!=='DEPLOYED_PRIVATE_BROWSER'||receipt.profileVersion!==ZWR_VFR_METHOD_PROFILE.profileVersion||receipt.rendererVersion!==ZWR_VFR_METHOD_PROFILE.rendererVersion||receipt.sourceAcceptanceDigest!==SOURCE_ACCEPTANCE_DIGEST||typeof receipt.rendererAcceptanceDigest!=='string'||!/^[a-f0-9]{64}$/i.test(receipt.rendererAcceptanceDigest))throw Object.assign(new Error('METHOD_GENERATION_ADMISSION_REQUIRED'),{code:'METHOD_GENERATION_ADMISSION_REQUIRED',status:503});
}
const SOURCE_ACCEPTANCE_DIGEST='81e31ab108602135616965c0c92d838085ddb0f5561c02c02ceb09f8958dc611';
