import {createHash} from 'node:crypto';
export const AUTHOR_PUBLICATION_STATES=Object.freeze(['DRAFT','AUTHOR_REVISION','AUTHOR_ACCEPTED_TEXT','SEMANTIC_ADMISSION_PENDING','RIGHTS_REVIEW_REQUIRED','CUSTOMER_PUBLISHABLE']);
export const exactTextDigest=text=>createHash('sha256').update(text,'utf8').digest('hex');
// A version record is evidence, never a substitute for the existing customer admission gate.
export function inspectAuthorVersion(record,text,{semanticReceipt=null,rightsReceipt=null,customerAdmission=false}={}){
 const required=['sectionId','language','manuscriptVersion','exactTextDigest','calculationRef','sourcePackVersion','claimRefs','rightsStatus','authorDecision','decisionDate','replacedVersion','publicationStatus'];
 const errors=required.filter(k=>!Object.hasOwn(record,k)).map(k=>'MISSING:'+k);
 if(!/^(0[1-9]|10)$/.test(record.sectionId||''))errors.push('SECTION_INVALID');
 if(!['zh-Hans','en'].includes(record.language))errors.push('LANGUAGE_INVALID');
 if(!AUTHOR_PUBLICATION_STATES.includes(record.publicationStatus))errors.push('STATE_INVALID');
 const bound=record.exactTextDigest===exactTextDigest(text);
 if(!bound)errors.push('TEXT_DIGEST_CHANGED_ACCEPTANCE_INVALID');
 const accepted=bound&&record.authorDecision==='ACCEPT'&&Boolean(record.decisionDate)&&Boolean(record.authorEvidenceRef);
 const receiptBound=r=>r?.decision==='ACCEPT'&&r?.exactTextDigest===record.exactTextDigest&&Boolean(r?.evidenceRef);
 const publishable=errors.length===0&&record.publicationStatus==='CUSTOMER_PUBLISHABLE'&&accepted&&receiptBound(semanticReceipt)&&receiptBound(rightsReceipt)&&record.rightsStatus==='CLEARED'&&customerAdmission===true;
 if(record.publicationStatus==='CUSTOMER_PUBLISHABLE'&&!publishable)errors.push('CUSTOMER_PUBLICATION_GATES_NOT_MET');
 if(record.publicationStatus==='AUTHOR_ACCEPTED_TEXT'&&!accepted)errors.push('AUTHOR_ACCEPTANCE_EVIDENCE_REQUIRED');
 return {valid:errors.length===0,authorTextAccepted:accepted,customerPublishable:publishable,errors};
}
export function inspectBilingualVersions(zh,en){return {ready:zh?.valid===true&&en?.valid===true&&zh?.customerPublishable===true&&en?.customerPublishable===true};}
