// Existing Academy owns this public media projection. Private doctrine is never
// a video asset; upload and publication acceptance remain explicit prerequisites.
export const NAVIGATION_ACADEMY_TOPICS=Object.freeze([
 ['01','Define the Decision','确定决策'],['02','Time Changes the Decision','时间改变决策'],
 ['03','Know When Reality Has Changed','辨认现实变化'],['04','Capacity Before Ambition','能力先于抱负'],
 ['05','Protect What Actually Matters','保护真正重要的条件'],['06','Think in Scenarios, Not Predictions','用情景思考'],
 ['07','When Do You Know Enough?','何时知道得足够'],['08','Who Actually Gets to Decide?','谁有权决定'],
 ['09','Turn Decision Into Action','将决定转为行动'],['10','Let Reality Correct You','让现实纠正你']
].map(([topicId,titleEn,titleZh])=>Object.freeze({topicId,titleEn,titleZh})));
const primary=['01','01','05','02','02','05','02','08','03','03','03','04','03','04','04','04','05','02','05','05','05','05','06','06','07','07','08','08','09','10'];
const fail=()=>{throw Object.assign(Error('ONE_PUBLIC_VIDEO_ONE_CANONICAL_ASSET_VIOLATION'),{code:'PUBLIC_VIDEO_MANIFEST_INVALID',status:503});};
export function buildNavigationPublicVideoRegistry(contracts,media={}){
 if(!media||typeof media!=='object'||Array.isArray(media))fail();
 const videoIds=new Set(),assetIds=new Set(),youtubeIds=new Set();
 const records=contracts.map((c,index)=>{
  const videoId=`PHIOS-NAVIGATION-${c.moduleId}-PUBLIC-v1`,v=media[videoId];
  const record={videoId,titleZh:c.titleZh,titleEn:c.titleEn,summaryZh:null,summaryEn:null,primaryAcademyTopic:primary[index],secondaryAcademyTopics:[],doctrineSources:[{moduleId:c.moduleId,sourceSHA256:c.sourceSHA256}],bookFoundationRefs:['/books/reality-continuity/','/books/reality-expansion/','/books/reality-observation/'],methodTags:['NAVIGATION'],canonicalVideoAssetId:null,youtubeVideoId:null,youtubePublicationState:'AWAITING_UPLOAD',academyPublicationState:'AWAITING_UPLOAD',transcriptState:'MISSING',publishedAt:null,duration:null,status:'AWAITING_UPLOAD'};
  if(v){
   if(v.videoIdentity!==videoId||v.publicationDecision!=='PUBLIC_VIDEO_ACCEPTED'||'youtubeVideoAsset' in v||'academyVideoAsset' in v||!v.canonicalVideoAssetId||!/^[A-Za-z0-9_-]{11}$/.test(v.youtubeVideoId||'')||!['PUBLISHED','UNLISTED'].includes(v.youtubePublicationState)||v.academyPublicationState!=='PUBLISHED'||typeof v.duration!=='number'||v.duration<=0||!Number.isFinite(Date.parse(v.publishedAt))||!v.summaryZh||!v.summaryEn||!['ACCEPTED','PENDING'].includes(v.transcriptState))fail();
   if(assetIds.has(v.canonicalVideoAssetId)||youtubeIds.has(v.youtubeVideoId))fail();
   assetIds.add(v.canonicalVideoAssetId);youtubeIds.add(v.youtubeVideoId);
   for(const k of ['canonicalVideoAssetId','youtubeVideoId','youtubePublicationState','academyPublicationState','transcriptState','publishedAt','duration','summaryZh','summaryEn'])record[k]=v[k];
   record.status='AVAILABLE';
  }
  if(videoIds.has(videoId))fail();videoIds.add(videoId);return Object.freeze(record);
 });
 if(Object.keys(media).some(k=>!videoIds.has(k)))fail();
 return Object.freeze({invariant:'ONE_PUBLIC_VIDEO_ONE_CANONICAL_ASSET',access:'FREE',visibility:'PUBLIC',format:'VIDEO_BASED',topics:NAVIGATION_ACADEMY_TOPICS,records});
}
