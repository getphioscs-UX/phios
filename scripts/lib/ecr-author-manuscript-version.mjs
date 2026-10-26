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

export const CASE_MANUSCRIPT_STATES=Object.freeze(['AUTHOR_DRAFT','AUTHOR_REVISION_REQUIRED','AUTHOR_ACCEPTED_TEXT']);
export function inspectAuthorCaseManuscript(record,text){
 const mapped={...record,publicationStatus:record.authorState==='AUTHOR_DRAFT'?'DRAFT':record.authorState==='AUTHOR_REVISION_REQUIRED'?'AUTHOR_REVISION':record.authorState};
 const review=inspectAuthorVersion(mapped,text);
 const errors=[...review.errors];
 if(!CASE_MANUSCRIPT_STATES.includes(record.authorState))errors.push('AUTHOR_CASE_STATE_INVALID');
 if(record.authorState==='AUTHOR_ACCEPTED_TEXT'&&(record.authorAcceptedVersion!==record.manuscriptVersion||record.authorAcceptedLanguage!==record.language||record.authorAcceptedSectionId!==record.sectionId))errors.push('EXACT_SECTION_LANGUAGE_VERSION_ACCEPTANCE_REQUIRED');
 if(!text.trim())errors.push('COMPLETE_TEXT_REQUIRED');
 return {...review,valid:errors.length===0,authorTextAccepted:errors.length===0&&review.authorTextAccepted,errors,customerPublishable:false,reusableSemanticAccepted:false};
}
export function auditAuthorBilingualPair(zh,en,{calculationRows=[],glossary=[]}={}){
 if(!zh?.text||!en?.text)return {status:'BLOCKED_MISSING_FULL_TEXT',customerPublishable:false};
 const errors=[],a=zh.claims||[],b=en.claims||[];
 const key=c=>JSON.stringify({positions:[...(c.positions||[])].sort(),conditions:[...(c.conditions||[])].sort(),limitations:[...(c.limitations||[])].sort(),prohibitedInferences:[...(c.prohibitedInferences||[])].sort(),factorRefs:[...(c.factorRefs||[])].sort()});
 if(new Set(a.map(c=>c.claimId)).size!==a.length||new Set(b.map(c=>c.claimId)).size!==b.length)errors.push('DUPLICATE_CLAIM_ID');
 const ids=[...new Set([...a,...b].map(c=>c.claimId))];
 for(const id of ids){const c=a.find(c=>c.claimId===id),d=b.find(c=>c.claimId===id);if(!c||!d||key(c)!==key(d))errors.push('CLAIM_CONDITIONS_OR_LIMITATIONS_DIFFER:'+id);}
 const coordinates=text=>[...text.matchAll(/(?<![\d.])([1-9]|[1-5]\d|6[0-4])\.([1-6])(?![\d.])/g)].map(m=>m[0]).sort();
 if(JSON.stringify(coordinates(zh.text))!==JSON.stringify(coordinates(en.text)))errors.push('GATE_LINE_TEXT_DIFFER');
 for(const claim of [...a,...b])for(const position of claim.positions||[]){const [layer,bodyCode,coordinate]=position.split(':');if(!calculationRows.some(r=>r.Layer===layer&&r.BodyCode===bodyCode&&`${r.P64Gate}.${r.Line}`===coordinate))errors.push('POSITION_NOT_IN_VERIFIED_CALCULATION:'+claim.claimId);}
 const termChecks=glossary.map(t=>({id:t.id,zhPresent:zh.text.includes(t.zh),enPresent:en.text.includes(t.en)}));
 if(termChecks.some(t=>t.zhPresent!==t.enPresent))errors.push('GLOSSARY_COVERAGE_DIFFERS');
 // Claims and numbers are checks, not a semantic equivalence oracle.
 return {status:errors.length?'FAIL':'PARTIAL_HUMAN_SEMANTIC_REVIEW_REQUIRED',errors,alignedClaimCount:ids.length,claimAnnotationsComplete:ids.length>0&&zh.claimCoverageComplete===true&&en.claimCoverageComplete===true,termChecks,humanSemanticApproval:false,customerPublishable:false};
}
