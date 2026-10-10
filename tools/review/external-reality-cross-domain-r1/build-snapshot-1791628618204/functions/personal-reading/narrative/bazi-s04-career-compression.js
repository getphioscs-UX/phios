import {sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
// Only exact repeated sentences inside the same paragraph are safe to delete
// without another authoring request. Semantic repetition is reviewed and, if
// needed, repaired through the existing single bounded repair path.
export async function compressCareerCandidate(candidate){
 const beforeDigest=await sha256Stable(candidate),copy=structuredClone(candidate);let removed=0;
 for(const b of copy.blocks||[]){const seen=new Set();b.text=String(b.text).split(/(?<=[.!?。！？])\s*|\n+/u).filter(s=>{if(!s.trim())return false;if(seen.has(s.trim())){removed++;return false;}seen.add(s.trim());return true;}).join(' ');}
 return {candidate:copy,audit:{version:'CAREER_COMPRESSION-v1.0.0',beforeDigest,afterDigest:await sha256Stable(copy),exactRepeatedSentencesRemoved:removed,mechanismClaimsPreserved:true,additionalModelCalls:0,semanticCompression:'INDEPENDENT_REVIEW_AND_EXISTING_BOUNDED_REPAIR'}};
}

// Closed, method-owned wording substitutions for the two internal English
// labels observed in source-bound evidence bridges. They add no interpretation.
// The derived candidate must still pass full independent semantic review.
export async function naturalizeCareerLabels(candidate,locale){
 const copy=structuredClone(candidate),changes=[];
 const replacements=locale==='en'?[
  ['self-position','personal decision ownership'],
  ['carrying picture','account of work demands and backing'],
  ['delivery proves judgment','delivery makes judgment visible']
 ]:[];
 for(const [blockIndex,b] of (copy.blocks||[]).entries())for(const [from,to] of replacements){const count=b.text.split(from).length-1;if(count){b.text=b.text.split(from).join(to);changes.push({blockIndex,from,to,count});}}
 return {candidate:copy,audit:{version:'CAREER_LABEL_NATURALIZATION-v1.0.0',beforeDigest:await sha256Stable(candidate),afterDigest:await sha256Stable(copy),changes,additionalComposerCalls:0,requiresIndependentSemanticReview:true}};
}
