import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';

export const ZWR_PRO_W8_BILINGUAL_PARITY_VERSION='ZWR-PRO-W8-BILINGUAL-PARITY-v1';
const IDS=['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11'];
const set=a=>new Set((Array.isArray(a)?a:[]).map(String));
function jac(a,b){const A=set(a),B=set(b);if(!A.size&&!B.size)return 1;let hit=0;for(const x of A)if(B.has(x))hit++;return hit/(A.size+B.size-hit);}
function roles(c){return [...new Set((c.paragraphs||[]).map(p=>p.role))];}
export async function verifyZwrProBilingualParityW8({zhCandidates,enCandidates,zhAuthorityPack,enAuthorityPack}={}){
 const reasons=[],sections=[];
 if(zhAuthorityPack?.subjectBinding?.subjectId!==enAuthorityPack?.subjectBinding?.subjectId||zhAuthorityPack?.subjectBinding?.inputFingerprint!==enAuthorityPack?.subjectBinding?.inputFingerprint)reasons.push('AUTHORITY_PACK_SUBJECT_MISMATCH');
 const zh=new Map((zhCandidates||[]).map(c=>[c.sectionId,c])),en=new Map((enCandidates||[]).map(c=>[c.sectionId,c]));
 for(const id of IDS){
  const a=zh.get(id),b=en.get(id);
  if(!a||!b){reasons.push('BILINGUAL_SECTION_MISSING:'+id);continue;}
  if(a.subjectBinding?.inputFingerprint!==b.subjectBinding?.inputFingerprint)reasons.push('CANDIDATE_SUBJECT_MISMATCH:'+id);
  const claimParity=jac(a.usedClaimRefs,b.usedClaimRefs),palaceParity=jac(a.usedPalaceCodes,b.usedPalaceCodes),txParity=jac(a.usedTransformationKeys,b.usedTransformationKeys),roleParity=jac(roles(a),roles(b));
  sections.push({sectionId:id,claimParity:Number(claimParity.toFixed(3)),palaceParity:Number(palaceParity.toFixed(3)),transformationParity:Number(txParity.toFixed(3)),roleParity:Number(roleParity.toFixed(3)),zhParagraphs:a.paragraphs.length,enParagraphs:b.paragraphs.length});
  if(claimParity<.75)reasons.push('CLAIM_PARITY_LOW:'+id);
  if(id!=='S11'&&palaceParity<.75)reasons.push('PALACE_PARITY_LOW:'+id);
  if((a.usedTransformationKeys.length||b.usedTransformationKeys.length)&&txParity<.67)reasons.push('TRANSFORMATION_PARITY_LOW:'+id);
  if(roleParity<.6)reasons.push('PARAGRAPH_FUNCTION_PARITY_LOW:'+id);
  if(Math.abs(a.paragraphs.length-b.paragraphs.length)>3)reasons.push('PARAGRAPH_COUNT_PARITY_DRIFT:'+id);
 }
 const seed={schemaVersion:'ZWR-PRO-W8-BILINGUAL-PARITY-VERIFICATION-v1',verifierVersion:ZWR_PRO_W8_BILINGUAL_PARITY_VERSION,subjectBinding:zhAuthorityPack?.subjectBinding||null,accepted:reasons.length===0,sections,reasons};
 return deepFreeze({...seed,verificationDigest:await sha256Stable(seed)});
}
export default Object.freeze({verifyZwrProBilingualParityW8,ZWR_PRO_W8_BILINGUAL_PARITY_VERSION});
