import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';

export const ZWR_VFR_DEEP_PUBLICATION_IR_VERSION='ZWR-VFR-R1-DEEP-PUBLICATION-IR-v1';

function paragraphs(text){
 return String(text||'').trim().split(/\n\s*\n/u).map(x=>x.trim()).filter(Boolean);
}
export async function buildZwrVfrDeepPublicationIr({pack,repairedResult}={}){
 if(pack?.schemaVersion!=='ZWR-VFR-R1-COMPACT-AUTHORING-PACK-v1')throw Error('ZWR_DEEP_PUBLICATION_PACK_REQUIRED');
 if(repairedResult?.schemaVersion!=='ZWR-VFR-R1-TARGETED-REPAIRED-RESULT-v1')throw Error('ZWR_DEEP_PUBLICATION_REPAIRED_RESULT_REQUIRED');
 if(repairedResult.authorityDigest!==pack.authorityDigest)throw Error('ZWR_DEEP_PUBLICATION_AUTHORITY_DRIFT');

 const by=new Map((repairedResult.rawManuscriptSections||[]).map(x=>[x.sectionId,x]));
 const sections=pack.sections.map(ps=>{
  const row=by.get(ps.sectionId);
  if(!row)throw Error('ZWR_DEEP_PUBLICATION_SECTION_MISSING:'+ps.sectionId);
  const zh=paragraphs(row.zhHansManuscript);
  const en=paragraphs(row.enManuscript);
  if(!zh.length||!en.length)throw Error('ZWR_DEEP_PUBLICATION_MANUSCRIPT_REQUIRED:'+ps.sectionId);
  return {
   sectionId:ps.sectionId,
   authorityRefs:ps.claims.map(c=>c.claimId),
   zhHans:{
    headline:ps.titleZh,
    subheadline:ps.purposeZh,
    manuscript:row.zhHansManuscript,
    paragraphs:zh
   },
   en:{
    headline:ps.titleEn,
    subheadline:ps.purposeEn,
    manuscript:row.enManuscript,
    paragraphs:en
   }
  };
 });
 const s11=sections.find(s=>s.sectionId==='S11');
 const seed={
  schemaVersion:ZWR_VFR_DEEP_PUBLICATION_IR_VERSION,
  methodId:'ZWR',
  localeMode:'BILINGUAL',
  subjectBinding:pack.subjectBinding,
  authorityDigest:pack.authorityDigest,
  sourceResultDigest:repairedResult.resultDigest,
  sections,
  closingSummary:{
   zhHans:s11.zhHans.paragraphs.slice(-3),
   en:s11.en.paragraphs.slice(-3)
  },
  providerUsage:{
   source:'REPAIRED_DEEP_MANUSCRIPT',
   providerCalls:repairedResult.providerUsage.originalProviderCalls+repairedResult.providerUsage.repairProviderCalls,
   semanticReviewCalls:0,
   estimatedProviderCost:repairedResult.providerUsage.totalEstimatedProviderCost
  },
  visualFirst:true,
  maxPhysicalPages:60
 };
 return deepFreeze({...seed,publicationIrDigest:await sha256Stable(seed)});
}
export default Object.freeze({buildZwrVfrDeepPublicationIr,ZWR_VFR_DEEP_PUBLICATION_IR_VERSION});
