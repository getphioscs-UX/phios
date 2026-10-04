import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';

export const ZWR_PRO_W5_SEMANTIC_VERIFIER_VERSION='ZWR-PRO-W5-SEMANTIC-VERIFIER-v1';
const INTERNAL=/\b(?:Authoring Pack|Candidate|ZIWEI-R5|ZWR-R5|S0[2-9]|S1[01])\b/iu;
const GUARANTEE=/\b(?:guaranteed|definitely|certainly|will happen|will become rich|will marry|will divorce)\b|(?:一定会|必然会|注定|必定发财|必定结婚|必定离婚)/iu;
const MEDICAL=/\b(?:diagnos(?:e|is|ed)|disease|treatment)\b|(?:诊断|疾病|治疗)/iu;
const FINANCIAL=/\b(?:buy|sell|invest|borrow)\s+(?:now|immediately)|(?:应该|必须)(?:买入|卖出|投资|借款)/iu;
const MONTH=/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b|(?:一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月)/iu;
const STATE_WORDS=['庙','旺','得','利','平','陷','Miao','Wang','De','Li','Ping','Xian'];
const uniq=a=>[...new Set((Array.isArray(a)?a:[]).map(String))];
const txKey=t=>[t.layer,t.palaceCode,t.targetStarCode,t.transformationCode].join(':');

function unknownStateLeak(text,section){
 const unknown=(section?.technicalEvidence?.palaces||[]).flatMap(p=>(p.stars||[]).filter(s=>!s.stateKnown));
 for(const star of unknown){
  const pos=text.indexOf(star.label);if(pos<0)continue;
  const window=text.slice(Math.max(0,pos-8),pos+String(star.label).length+12);
  if(STATE_WORDS.some(x=>window.includes(x)))return star.starCode;
 }
 return null;
}
function unboundTransformation(candidate,section){
 const allowed=new Set((section?.technicalEvidence?.transformations||[]).map(txKey));
 return (candidate.usedTransformationKeys||[]).find(k=>!allowed.has(k))||null;
}
export async function verifyZwrProSectionW5({authorityPack,candidate}={}){
 const reasons=[];
 if(authorityPack?.schemaVersion!=='ZIWEI-R5-AUTHORING-PACK-v2')throw Error('ZWR_PRO_W5_AUTHORITY_PACK_REQUIRED');
 if(candidate?.schemaVersion!=='ZWR-PRO-W4-CANDIDATE-v1')throw Error('ZWR_PRO_W5_CANDIDATE_REQUIRED');
 if(candidate.locale!==authorityPack.locale)reasons.push('LOCALE_MISMATCH');
 const section=authorityPack.sections.find(s=>s.sectionId===candidate.sectionId);
 if(!section)reasons.push('SECTION_NOT_IN_AUTHORITY_PACK');
 const allowedClaims=new Set((section?.claims||[]).map(c=>c.claimId));
 const allowedPalaces=new Set((section?.technicalEvidence?.palaces||[]).map(p=>p.palaceCode));
 const paragraphRefs=uniq((candidate.paragraphs||[]).flatMap(p=>p.claimRefs||[]));
 for(const ref of paragraphRefs)if(!allowedClaims.has(ref))reasons.push('UNKNOWN_CLAIM_REF:'+ref);
 for(const ref of candidate.usedClaimRefs||[])if(!allowedClaims.has(ref))reasons.push('UNBOUND_USED_CLAIM:'+ref);
 for(const code of candidate.usedPalaceCodes||[])if(!allowedPalaces.has(code))reasons.push('UNBOUND_PALACE:'+code);
 const badTx=unboundTransformation(candidate,section);if(badTx)reasons.push('UNBOUND_TRANSFORMATION:'+badTx);
 const union=uniq(paragraphRefs).sort(),declared=uniq(candidate.usedClaimRefs||[]).sort();
 if(JSON.stringify(union)!==JSON.stringify(declared))reasons.push('CLAIM_LINEAGE_UNION_MISMATCH');
 const body=(candidate.paragraphs||[]).map(p=>p.text).join('\n');
 if(INTERNAL.test(body))reasons.push('INTERNAL_WORKFLOW_TOKEN_LEAK');
 if(GUARANTEE.test(body))reasons.push('GUARANTEED_OUTCOME');
 if(MEDICAL.test(body)&&candidate.sectionId==='S08')reasons.push('MEDICAL_DIAGNOSIS_OR_TREATMENT');
 if(FINANCIAL.test(body)&&candidate.sectionId==='S05')reasons.push('FINANCIAL_RECOMMENDATION');
 if(MONTH.test(body)&&['S09','S10'].includes(candidate.sectionId)&&!(section?.technicalEvidence?.timing||[]).some(t=>t.layer==='LIU_YUE'))reasons.push('UNADMITTED_MONTH_TIMING');
 const stateLeak=unknownStateLeak(body,section);if(stateLeak)reasons.push('UNKNOWN_BRIGHTNESS_INFERENCE:'+stateLeak);
 if(candidate.sectionId==='S11'&&(candidate.usedPalaceCodes||[]).length)reasons.push('S11_NEW_FOCAL_PALACE_NOT_ALLOWED');
 const material=(section?.claims||[]).filter(c=>c.claimType!=='BOUNDARY');
 const used=new Set(candidate.usedClaimRefs||[]);
 const coverage=material.length?material.filter(c=>used.has(c.claimId)).length/material.length:0;
 if(coverage<.6)reasons.push('CLAIM_COVERAGE_TOO_LOW');
 const seed={schemaVersion:'ZWR-PRO-W5-SEMANTIC-VERIFICATION-v1',verifierVersion:ZWR_PRO_W5_SEMANTIC_VERIFIER_VERSION,subjectBinding:authorityPack.subjectBinding,locale:candidate.locale,sectionId:candidate.sectionId,candidateDigest:candidate.candidateDigest,accepted:reasons.length===0,claimCoverage:Number(coverage.toFixed(4)),usedClaimRefs:declared,usedPalaceCodes:uniq(candidate.usedPalaceCodes||[]),usedTransformationKeys:uniq(candidate.usedTransformationKeys||[]),reasons};
 return deepFreeze({...seed,verificationDigest:await sha256Stable(seed)});
}
export default Object.freeze({verifyZwrProSectionW5,ZWR_PRO_W5_SEMANTIC_VERIFIER_VERSION});
