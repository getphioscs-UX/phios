import {NAV_BATCH_01_CONTRACT} from '../runtime/navigation/nav-accepted-batch-01-contract.js';
import {NAV_BATCH_02_CONTRACT} from '../runtime/navigation/nav-accepted-batch-02-contract.js';
import {NAV_BATCH_03_CONTRACT} from '../runtime/navigation/nav-accepted-batch-03-contract.js';
import {NAV_BATCH_04_CONTRACT} from '../runtime/navigation/nav-accepted-batch-04-contract.js';
import {NAV_BATCH_05_CONTRACT} from '../runtime/navigation/nav-accepted-batch-05-contract.js';
import {NAV_BATCH_06_CONTRACT} from '../runtime/navigation/nav-accepted-batch-06-contract.js';
import {buildNavigationPublicVideoRegistry} from './navigation-public-video-registry.js';
const contracts=[...NAV_BATCH_01_CONTRACT,...NAV_BATCH_02_CONTRACT,...NAV_BATCH_03_CONTRACT,...NAV_BATCH_04_CONTRACT,...NAV_BATCH_05_CONTRACT,...NAV_BATCH_06_CONTRACT];
// Explicit public teaching projection. No private definitions, input contracts,
// forbidden inference, internal source text or runtime assessment is serialized.
export function navigationPublicCatalog(media={}){
 const registry=buildNavigationPublicVideoRegistry(contracts,media);
 return {access:'FREE_PUBLIC',membershipRequired:false,checkoutRequired:false,invariant:registry.invariant,topics:registry.topics,items:registry.records.map(record=>{
  const c=contracts.find(c=>c.moduleId===record.doctrineSources[0].moduleId),ready=record.status==='AVAILABLE';
  return {...record,moduleId:c.moduleId,title:{en:record.titleEn,zh:record.titleZh},videoIdentity:record.videoId,teachingProjectionVersion:`NAV-PUBLIC-TITLE-${c.sourceSHA256}`,youtubeUrl:ready?`https://www.youtube.com/watch?v=${record.youtubeVideoId}`:null,embedUrl:ready?`https://www.youtube-nocookie.com/embed/${record.youtubeVideoId}`:null};
 })};
}
