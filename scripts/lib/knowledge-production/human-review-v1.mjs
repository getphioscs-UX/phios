import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { digest, serialize } from './canonical-brief-v2.mjs';
import { validateZhHansCandidate } from './zh-hans-candidate-v1.mjs';

export const REVIEW_SCHEMA_VERSION='PHI-OS-HUMAN-REVIEW-PACKAGE-v1.0.0';
export const REVIEW_TYPE='canonical_article_human_review';
export const REVIEW_DECISIONS=Object.freeze(['accept','changes_required','reject','defer']);
const fail=(code,message)=>Object.assign(new Error(`${code}: ${message}`),{code});
const exists=file=>fs.access(file).then(()=>true,()=>false);
export function reviewWithoutDigest(review){const copy=structuredClone(review);delete copy.reviewDigest;return copy;}
export function computeReviewDigest(review){return digest(reviewWithoutDigest(review));}
function normalizeFindings(findings=[]){return findings.map((item,index)=>({findingCode:`FINDING-${String(index+1).padStart(3,'0')}`,category:item.category,severity:item.severity,comment:String(item.comment||'').trim()}));}
export async function buildHumanReview(root,{candidate,reviewerCode='TL',decision,summary,findings=[],reviewedAt}){
 const candidateValidation=await validateZhHansCandidate(root,candidate,{briefPath:null});
 if(!candidateValidation.valid)throw fail('REVIEW_REQUIRES_VALID_CANDIDATE',JSON.stringify(candidateValidation.errors));
 if(!REVIEW_DECISIONS.includes(decision))throw fail('REVIEW_DECISION_INVALID',String(decision));
 if(typeof summary!=='string'||!summary.trim())throw fail('REVIEW_SUMMARY_REQUIRED','summary');
 if(!reviewedAt||Number.isNaN(Date.parse(reviewedAt)))throw fail('REVIEWED_AT_INVALID',String(reviewedAt));
 const normalized=normalizeFindings(findings);
 if(['changes_required','reject'].includes(decision)&&normalized.length===0)throw fail('REVIEW_FINDING_REQUIRED',decision);
 for(const item of normalized){if(!['canonical_meaning','boundary','structure','terminology','evidence','continuity','language','other'].includes(item.category))throw fail('REVIEW_FINDING_CATEGORY_INVALID',item.category);if(!['note','minor','major','blocking'].includes(item.severity))throw fail('REVIEW_FINDING_SEVERITY_INVALID',item.severity);if(!item.comment)throw fail('REVIEW_FINDING_COMMENT_REQUIRED',item.findingCode);}
 const payload={reviewType:REVIEW_TYPE,reviewSchemaVersion:REVIEW_SCHEMA_VERSION,reviewCode:`REVIEW-${candidate.candidateCode}-V1`,candidate:{candidateCode:candidate.candidateCode,candidateDigest:candidate.candidateDigest,nodeCode:candidate.nodeCode,locale:candidate.locale,candidateState:candidate.candidateState},reviewer:{reviewerCode,authority:'TL Human Review Authority'},decision,summary:summary.trim(),findings:normalized,authority:{canonicalMeaning:'TL',review:'human_review_recorded',approval:'not_approved',publication:'not_published'},governance:{candidateMutationAllowed:false,knowledgeRegistryMutationAllowed:false,approvalRecorded:false,publicationRecorded:false,localeStatePromotionAllowed:false},reviewedAt:new Date(reviewedAt).toISOString()};
 return {...payload,reviewDigest:computeReviewDigest(payload)};
}
export function validateHumanReview(review,candidate){
 const errors=[];const add=(code,message)=>errors.push({code,message});
 if(!review||typeof review!=='object'||Array.isArray(review))return {valid:false,errors:[{code:'REVIEW_NOT_OBJECT',message:'Review must be an object.'}]};
 if(review.reviewType!==REVIEW_TYPE)add('REVIEW_TYPE_INVALID',String(review.reviewType));
 if(review.reviewSchemaVersion!==REVIEW_SCHEMA_VERSION)add('REVIEW_SCHEMA_VERSION_INVALID',String(review.reviewSchemaVersion));
 if(!REVIEW_DECISIONS.includes(review.decision))add('REVIEW_DECISION_INVALID',String(review.decision));
 if(review.reviewCode!==`REVIEW-${review.candidate?.candidateCode}-V1`)add('REVIEW_CODE_INVALID',String(review.reviewCode));
 if(review.reviewer?.reviewerCode!=='TL'||review.reviewer?.authority!=='TL Human Review Authority')add('REVIEWER_AUTHORITY_INVALID',JSON.stringify(review.reviewer));
 if(typeof review.summary!=='string'||!review.summary.trim())add('REVIEW_SUMMARY_REQUIRED','summary');
 if(!Array.isArray(review.findings))add('REVIEW_FINDINGS_INVALID','findings');
 if(['changes_required','reject'].includes(review.decision)&&(!Array.isArray(review.findings)||review.findings.length===0))add('REVIEW_FINDING_REQUIRED',review.decision);
 if(review.authority?.canonicalMeaning!=='TL'||review.authority?.review!=='human_review_recorded'||review.authority?.approval!=='not_approved'||review.authority?.publication!=='not_published')add('REVIEW_AUTHORITY_INVALID',JSON.stringify(review.authority));
 for(const key of ['candidateMutationAllowed','knowledgeRegistryMutationAllowed','approvalRecorded','publicationRecorded','localeStatePromotionAllowed'])if(review.governance?.[key]!==false)add('REVIEW_GOVERNANCE_INVALID',key);
 if(!review.reviewedAt||Number.isNaN(Date.parse(review.reviewedAt)))add('REVIEWED_AT_INVALID',String(review.reviewedAt));
 if(!/^[a-f0-9]{64}$/.test(review.reviewDigest||''))add('REVIEW_DIGEST_FORMAT_INVALID',String(review.reviewDigest));else if(review.reviewDigest!==computeReviewDigest(review))add('REVIEW_DIGEST_INVALID','reviewDigest');
 if(candidate){for(const key of ['candidateCode','candidateDigest','nodeCode','locale','candidateState'])if(review.candidate?.[key]!==candidate[key])add('REVIEW_CANDIDATE_BINDING_INVALID',key);}
 return {valid:errors.length===0,errors,reviewCode:review.reviewCode,decision:review.decision,reviewDigest:review.reviewDigest};
}
export function buildReviewRegistryRecord(review){return {reviewCode:review.reviewCode,candidateCode:review.candidate.candidateCode,candidateDigest:review.candidate.candidateDigest,nodeCode:review.candidate.nodeCode,locale:review.candidate.locale,reviewerCode:review.reviewer.reviewerCode,decision:review.decision,reviewDigest:review.reviewDigest,reviewedAt:review.reviewedAt,approval:'not_approved',publication:'not_published'};}
export async function registerReviewProjection(root,record,{apply=false}={}){
 const rel='content/knowledge/production/registry/review-registry.json',file=path.join(root,rel),registry=JSON.parse(await fs.readFile(file,'utf8'));
 if(registry.records.some(x=>x.reviewCode===record.reviewCode))throw fail('REVIEW_REGISTRY_RECORD_EXISTS',record.reviewCode);
 const next={...registry,records:[...registry.records,record].sort((a,b)=>a.reviewCode.localeCompare(b.reviewCode))};
 if(apply){const temp=`${file}.tmp-${process.pid}-${crypto.randomUUID()}`;await fs.writeFile(temp,serialize(next),{flag:'wx'});await fs.rename(temp,file);}
 return {mode:apply?'apply':'dry-run',applied:apply,registryPath:rel,record};
}
export async function writeReviewPackage(root,review,{apply=false,output}={}){
 const rel=output||`content/knowledge/production/reviews/zh-Hans/${review.candidate.nodeCode}/review.v1.json`,target=path.join(root,rel);
 if(await exists(target))throw fail('REVIEW_TARGET_EXISTS',rel);
 if(apply){await fs.mkdir(path.dirname(target),{recursive:true});const temp=`${target}.tmp-${process.pid}-${crypto.randomUUID()}`;await fs.writeFile(temp,serialize(review),{flag:'wx'});await fs.rename(temp,target);}
 return {mode:apply?'apply':'dry-run',applied:apply,targetPath:rel,reviewDigest:review.reviewDigest};
}
