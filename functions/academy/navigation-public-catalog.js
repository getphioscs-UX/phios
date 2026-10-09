import {NAV_BATCH_01_CONTRACT} from '../runtime/navigation/nav-accepted-batch-01-contract.js';
import {NAV_BATCH_02_CONTRACT} from '../runtime/navigation/nav-accepted-batch-02-contract.js';
import {NAV_BATCH_03_CONTRACT} from '../runtime/navigation/nav-accepted-batch-03-contract.js';
import {NAV_BATCH_04_CONTRACT} from '../runtime/navigation/nav-accepted-batch-04-contract.js';
import {NAV_BATCH_05_CONTRACT} from '../runtime/navigation/nav-accepted-batch-05-contract.js';
import {NAV_BATCH_06_CONTRACT} from '../runtime/navigation/nav-accepted-batch-06-contract.js';
const contracts=[...NAV_BATCH_01_CONTRACT,...NAV_BATCH_02_CONTRACT,...NAV_BATCH_03_CONTRACT,...NAV_BATCH_04_CONTRACT,...NAV_BATCH_05_CONTRACT,...NAV_BATCH_06_CONTRACT];
// Explicit public teaching projection. No private definitions, input contracts,
// forbidden inference, internal source text or runtime assessment is serialized.
export function navigationPublicCatalog(media={}){
 return {access:'FREE_PUBLIC',membershipRequired:false,checkoutRequired:false,items:contracts.map(c=>{
  const videoIdentity=`PHIOS-NAVIGATION-${c.moduleId}-PUBLIC-v1`,v=media[videoIdentity];
  const ready=v?.videoIdentity===videoIdentity&&v?.publicationDecision==='PUBLIC_VIDEO_ACCEPTED'&&/^[A-Za-z0-9_-]{11}$/.test(v?.youtubeVideoId||'');
  return {moduleId:c.moduleId,title:{en:c.titleEn,zh:c.titleZh},videoIdentity,teachingProjectionVersion:`NAV-PUBLIC-TITLE-${c.sourceSHA256}`,status:ready?'AVAILABLE':'AWAITING_UPLOAD',youtubeVideoId:ready?v.youtubeVideoId:null,youtubeUrl:ready?`https://www.youtube.com/watch?v=${v.youtubeVideoId}`:null,embedUrl:ready?`https://www.youtube-nocookie.com/embed/${v.youtubeVideoId}`:null};
 })};
}
