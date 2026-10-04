import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {buildZiweiR5AuthoringPack} from './ziwei-r5-authoring-pack.js';
import {composeZwrProSectionW4} from './zwr-pro-w4-composer.js';
import {verifyZwrProSectionW5} from './zwr-pro-w5-semantic-verifier.js';
import {verifyZwrProReferenceQualityW6} from './zwr-pro-w6-reference-quality-verifier.js';
import {verifyZwrProCrossSectionDuplicationW7} from './zwr-pro-w7-duplication-verifier.js';
import {verifyZwrProBilingualParityW8} from './zwr-pro-w8-bilingual-parity.js';

export const ZWR_PRO_W4_W8_PIPELINE_VERSION='ZWR-PRO-W4-W8-PIPELINE-v1';
const IDS=['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11'];

async function runLocale({evidence,locale,env,fetcher,providerAdapters,registry,cache,onProgress}){
 const authorityPack=await buildZiweiR5AuthoringPack({evidence,locale});
 const candidates=[],sectionVerifications=[];
 for(const sectionId of IDS){
  onProgress?.({phase:'SECTION_START',locale,sectionId});
  const candidate=await composeZwrProSectionW4({authorityPack,sectionId,locale,env,fetcher,providerAdapters,registry,cache});
  if(candidate?.status!=='PASS') return {status:'CONTROLLED_NOT_READY',locale,sectionId,authorityPack,candidates,sectionVerifications,reason:'W4_COMPOSER_NOT_PASS',candidate};
  const semantic=await verifyZwrProSectionW5({authorityPack,candidate});
  if(!semantic.accepted) return {status:'CONTROLLED_NOT_READY',locale,sectionId,authorityPack,candidates,sectionVerifications,reason:'W5_SEMANTIC_REJECT',candidate,semantic};
  const quality=await verifyZwrProReferenceQualityW6({authorityPack,candidate});
  if(!quality.accepted) return {status:'CONTROLLED_NOT_READY',locale,sectionId,authorityPack,candidates,sectionVerifications,reason:'W6_REFERENCE_QUALITY_REJECT',candidate,semantic,quality};
  candidates.push(candidate);sectionVerifications.push({sectionId,semantic,quality});
  onProgress?.({phase:'SECTION_PASS',locale,sectionId,model:candidate.provider?.model||null,transportCalls:candidate.provider?.transportCalls||0,semanticReviewCalls:candidate.provider?.semanticReviewCalls||0});
 }
 const duplication=await verifyZwrProCrossSectionDuplicationW7({candidates,locale});
 if(!duplication.accepted)return {status:'CONTROLLED_NOT_READY',locale,authorityPack,candidates,sectionVerifications,duplication,reason:'W7_DUPLICATION_REJECT'};
 return {status:'PASS',locale,authorityPack,candidates,sectionVerifications,duplication};
}

export async function buildZwrProBilingualCandidateW4W8({evidence,env={},fetcher,providerAdapters,registry,cache,onProgress}={}){
 const zh=await runLocale({evidence,locale:'zh-Hans',env,fetcher,providerAdapters,registry,cache,onProgress});
 if(zh.status!=='PASS')return deepFreeze({schemaVersion:ZWR_PRO_W4_W8_PIPELINE_VERSION,status:'CONTROLLED_NOT_READY',failedLocale:'zh-Hans',detail:zh,productionAdmissionGranted:false});
 const en=await runLocale({evidence,locale:'en',env,fetcher,providerAdapters,registry,cache,onProgress});
 if(en.status!=='PASS')return deepFreeze({schemaVersion:ZWR_PRO_W4_W8_PIPELINE_VERSION,status:'CONTROLLED_NOT_READY',failedLocale:'en',detail:en,productionAdmissionGranted:false});
 const parity=await verifyZwrProBilingualParityW8({zhCandidates:zh.candidates,enCandidates:en.candidates,zhAuthorityPack:zh.authorityPack,enAuthorityPack:en.authorityPack});
 if(!parity.accepted)return deepFreeze({schemaVersion:ZWR_PRO_W4_W8_PIPELINE_VERSION,status:'CONTROLLED_NOT_READY',reason:'W8_BILINGUAL_PARITY_REJECT',zh,en,parity,productionAdmissionGranted:false});
 const seed={schemaVersion:ZWR_PRO_W4_W8_PIPELINE_VERSION,status:'PASS_W4_W8',subjectBinding:zh.authorityPack.subjectBinding,zh:{candidates:zh.candidates,sectionVerifications:zh.sectionVerifications,duplication:zh.duplication},en:{candidates:en.candidates,sectionVerifications:en.sectionVerifications,duplication:en.duplication},parity,productionAdmissionGranted:false};
 return deepFreeze({...seed,pipelineDigest:await sha256Stable(seed)});
}
export default Object.freeze({buildZwrProBilingualCandidateW4W8,ZWR_PRO_W4_W8_PIPELINE_VERSION});
