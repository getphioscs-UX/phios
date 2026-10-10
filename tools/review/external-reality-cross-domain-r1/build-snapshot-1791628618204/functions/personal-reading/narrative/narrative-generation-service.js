import {writeNarrative,NARRATIVE_PROMPT_VERSION} from './narrative-writer.js';
import {verifyNarrativeClaims} from './narrative-claim-verifier.js';
import {applyTargetedRepair} from './narrative-targeted-repair.js';
import {buildNarrativeReadingIR} from './narrative-reading-ir.js';
import {buildNarrativeGenerationKey} from './narrative-generation-cache.js';
import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';
function fail(code,details={}){const e=new Error(code);e.code=code;e.details=details;throw e;}
export async function generatePaidNarrative({brief,evidenceWritingRules,factualGuard,purchase,entitlement,product,cache,writer=writeNarrative,writerOptions={},generatedAt='2026-09-01T10:00:00.000Z',generationKeyOverride=null,relationshipProductAuthority=null,relationshipGenerationIdentity=null}={}){
  if(!cache?.get||!cache?.put)fail('W54N1_N8_CACHE_REQUIRED');if(entitlement?.generationAllowed!==true||entitlement?.state!=='ACTIVE')fail('W54N6_GENERATION_ENTITLEMENT_REQUIRED');const key=generationKeyOverride?.generationKey?generationKeyOverride:await buildNarrativeGenerationKey({purchaseId:purchase.purchaseId,sourceSemanticDigest:brief.sourceSemanticDigest,narrativeBriefDigest:brief.briefSemanticDigest,promptVersion:NARRATIVE_PROMPT_VERSION,narrativeProductVersion:product.productVersion});const cached=await cache.get(key);if(cached)return {cacheHit:true,generationKey:key,narrative:cached,writerInvoked:false};
  const initialDraft=await writer({brief,...writerOptions});const firstVerification=await verifyNarrativeClaims({brief,draft:initialDraft,evidenceWritingRules,factualGuard});const repaired=await applyTargetedRepair({draft:initialDraft,verification:firstVerification});const finalVerification=await verifyNarrativeClaims({brief,draft:repaired.draft,evidenceWritingRules,factualGuard});if(finalVerification.summary.passed!==true)fail('W54N2_N3_FINAL_VERIFICATION_FAILED');const narrative=await buildNarrativeReadingIR({brief,draft:repaired.draft,verification:finalVerification,repairLog:repaired.repairLog,purchase,entitlement,product,generatedAt,relationshipProductAuthority,relationshipGenerationIdentity});await cache.put(key,narrative);return {cacheHit:false,generationKey:key,narrative,writerInvoked:true,firstVerification,finalVerification,repairLog:repaired.repairLog};
}
export async function reopenNarrative({cache,generationKey,reason='REOPEN'}={}){return cache.resolve(generationKey,{reason});}
export default Object.freeze({generatePaidNarrative,reopenNarrative});

// Immutable publication snapshots live under the existing generation/cache
// owner. Reopening never calls a writer or resolves NOW again.
export async function generatePublicationSnapshot({reportId,revision,locale,cache,build,reason='CREATE',reviewMode=false,entitlement}={}){
 if(!reportId||!revision||!['en','zh-Hans'].includes(locale)||!cache?.get||!cache?.put)fail('PUBLICATION_SNAPSHOT_IDENTITY_REQUIRED');
 if(!reviewMode&&(entitlement?.state!=='ACTIVE'||entitlement.generationAllowed!==true))fail('PUBLICATION_ENTITLEMENT_REQUIRED');
 const key={generationKey:'PUBR2-'+await sha256Stable(['GUIDED_REPORT_SUCCESSOR_R2',reportId,revision,locale])};
 const cached=await cache.get(key);if(cached)return {snapshot:cached,cacheHit:true};
 if(reason==='REOPEN')fail('PUBLICATION_SNAPSHOT_NOT_FOUND');
 if(!['CREATE','EXPLICIT_REGENERATE','SOURCE_CORRECTED','LOCALE_CHANGED','CUSTOM_TIME_SELECTED','PERMITTED_VERSION_UPGRADE'].includes(reason))fail('PUBLICATION_REGENERATION_REASON_INVALID');
 if(typeof build!=='function')fail('PUBLICATION_BUILDER_REQUIRED');
 const result=await build();if(result?.customer?.schemaVersion!=='GUIDED_REPORT_SUCCESSOR_R2'||result.customer.locale!==locale||result.customer.customerPublishable!==false)fail('PUBLICATION_SNAPSHOT_INVALID');
 const snapshot=deepFreeze({...result,generationState:'READY'});
 await cache.put(key,snapshot);return {snapshot,cacheHit:false};
}
