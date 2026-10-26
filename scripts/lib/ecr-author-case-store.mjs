import fs from 'node:fs';import path from 'node:path';import {TextDecoder} from 'node:util';
import {exactTextDigest,inspectAuthorCaseManuscript} from './ecr-author-manuscript-version.mjs';
import {ecrReusableVersionDigest,inspectEcrReusableCandidate} from '../../functions/embodied-configuration/ecr-semantic-composition-r2.js';
export function requirePrivateAuthorDirectory(directory){
 const target=path.resolve(directory),root=path.resolve('.'),relative=path.relative(root,target);
 if(relative===''||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)))throw Error('PRIVATE_AUTHOR_STORAGE_MUST_BE_OUTSIDE_REPOSITORY');
 return target;
}
export function ingestEcrAuthorManuscript({privateDirectory,record,inputPath}){
 const directory=requirePrivateAuthorDirectory(privateDirectory);
 const bytes=fs.readFileSync(inputPath),text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);
 if(Buffer.compare(Buffer.from(text,'utf8'),bytes)!==0)throw Error('UTF8_EXACT_BYTE_ROUNDTRIP_REQUIRED');
 if(!/^[A-Za-z0-9_.-]+$/.test(record.manuscriptVersion||''))throw Error('SAFE_VERSION_ID_REQUIRED');
 const digest=exactTextDigest(text);
 if(record.exactTextDigest&&record.exactTextDigest!==digest)throw Error('TEXT_UPDATE_INVALIDATES_PRIOR_ACCEPTANCE');
 if(record.authorState==='AUTHOR_ACCEPTED_TEXT'&&!record.exactTextDigest)throw Error('AUTHOR_ACCEPT_REQUIRES_PREEXISTING_EXACT_DIGEST');
 const material={...record,exactTextDigest:digest,publicationStatus:'DRAFT',authorState:record.authorState||'AUTHOR_DRAFT'};
 const review=inspectAuthorCaseManuscript(material,text);if(!review.valid)throw Error('MANUSCRIPT_RECORD_INVALID:'+review.errors.join(','));
 const folder=path.join(directory,'manuscripts',material.sectionId,material.language,material.manuscriptVersion);fs.mkdirSync(folder,{recursive:true});
 const target=path.join(folder,'exact-text.txt'),metadata=path.join(folder,'record.json');
 if(fs.existsSync(target)||fs.existsSync(metadata)){
  if(!fs.existsSync(target)||!fs.existsSync(metadata)||!fs.readFileSync(target).equals(bytes)||JSON.stringify(JSON.parse(fs.readFileSync(metadata)))!==JSON.stringify(material))throw Error('IMMUTABLE_VERSION_COLLISION');
  return {record:material,review,idempotent:true,folder};
 }
 fs.writeFileSync(target,bytes,{flag:'wx'});fs.writeFileSync(metadata,JSON.stringify(material,null,2),{flag:'wx'});
 return {record:material,review,idempotent:false,folder};
}
const safeId=value=>{if(!/^[A-Za-z0-9_.-]+$/.test(value||''))throw Error('SAFE_ID_REQUIRED');return value;};
function saveImmutableJson(file,value){const bytes=JSON.stringify(value,null,2);fs.mkdirSync(path.dirname(file),{recursive:true});if(fs.existsSync(file)){if(fs.readFileSync(file,'utf8')!==bytes)throw Error('IMMUTABLE_REVIEW_RECORD_COLLISION');return;}fs.writeFileSync(file,bytes,{flag:'wx'});}
export function recordEcrManuscriptDecision({folder,receipt,privateDirectory}){
 const root=requirePrivateAuthorDirectory(privateDirectory),target=path.resolve(folder),relative=path.relative(root,target);
 if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('REVIEW_MUST_REFERENCE_PRIVATE_STORED_VERSION');
 const record=JSON.parse(fs.readFileSync(path.join(target,'record.json'))),text=fs.readFileSync(path.join(target,'exact-text.txt'),'utf8');
 if(!['ACCEPT','REVISE','REJECT'].includes(receipt.decision)||!receipt.reviewer||!receipt.reviewedAt||!receipt.evidenceRef)throw Error('EXPLICIT_AUTHOR_DECISION_REQUIRED_CONTINUE_IS_NOT_ACCEPT');
 if(receipt.sectionId!==record.sectionId||receipt.language!==record.language||receipt.manuscriptVersion!==record.manuscriptVersion||receipt.exactTextDigest!==exactTextDigest(text))throw Error('EXACT_SECTION_LANGUAGE_VERSION_DIGEST_REQUIRED');
 const reviewed={...record,authorState:receipt.decision==='ACCEPT'?'AUTHOR_ACCEPTED_TEXT':'AUTHOR_REVISION_REQUIRED',authorDecision:receipt.decision,decisionDate:receipt.reviewedAt,authorEvidenceRef:receipt.evidenceRef,authorAcceptedVersion:receipt.manuscriptVersion,authorAcceptedLanguage:receipt.language,authorAcceptedSectionId:receipt.sectionId};
 saveImmutableJson(path.join(target,'author-decisions',safeId(receipt.receiptId)+'.json'),receipt);
 return {record:reviewed,review:inspectAuthorCaseManuscript(reviewed,text),reusableSemanticAccepted:false,customerPublishable:false};
}
export async function storeEcrReusableCandidate({privateDirectory,module}){
 const root=requirePrivateAuthorDirectory(privateDirectory),candidate={...module,authorReview:{status:'REUSABLE_CANDIDATE'},rightsReview:null};
 candidate.exactVersionDigest=await ecrReusableVersionDigest(candidate);
 const review=await inspectEcrReusableCandidate(candidate);if(!review.valid)throw Error('INVALID_REUSABLE_CANDIDATE:'+review.errors.join(','));
 const folder=path.join(root,'reusable-candidates',safeId(candidate.moduleId),candidate.exactVersionDigest);saveImmutableJson(path.join(folder,'candidate.json'),candidate);
 return {folder,exactVersionDigest:candidate.exactVersionDigest,semanticAccepted:false,customerPublishable:false};
}
export async function recordEcrReusableDecision({privateDirectory,moduleId,exactVersionDigest,receipt}){
 const root=requirePrivateAuthorDirectory(privateDirectory);if(!/^[a-f0-9]{64}$/.test(exactVersionDigest||''))throw Error('EXACT_REUSABLE_VERSION_REQUIRED');
 const folder=path.join(root,'reusable-candidates',safeId(moduleId),exactVersionDigest),candidate=JSON.parse(fs.readFileSync(path.join(folder,'candidate.json')));
 if(receipt.scope!=='REUSABLE_SEMANTIC'||receipt.moduleId!==moduleId||receipt.exactVersionDigest!==exactVersionDigest||!['ACCEPT','REVISE','REJECT'].includes(receipt.decision)||!receipt.reviewer||!receipt.reviewedAt||!receipt.evidenceRef)throw Error('INDEPENDENT_EXPLICIT_REUSABLE_DECISION_REQUIRED');
 if(await ecrReusableVersionDigest(candidate)!==exactVersionDigest)throw Error('REUSABLE_CANDIDATE_TEXT_CHANGED');
 saveImmutableJson(path.join(folder,'semantic-decisions',safeId(receipt.receiptId)+'.json'),receipt);
 const reviewed={...candidate,authorReview:{...receipt,status:receipt.decision==='ACCEPT'?'REUSABLE_MEANING_ACCEPTED':'SOURCE_REVIEW_REQUIRED'}};
 return {module:reviewed,review:await inspectEcrReusableCandidate(reviewed),customerPublishable:false};
}
