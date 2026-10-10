import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { digest, serialize } from './canonical-brief-v2.mjs';
import { validateZhHansCandidate } from './zh-hans-candidate-v1.mjs';
import { validateHumanReview } from './human-review-v1.mjs';

export const APPROVAL_SCHEMA_VERSION='PHI-OS-APPROVAL-PACKAGE-v1.0.0';
export const APPROVAL_TYPE='canonical_article_human_approval';
export const APPROVAL_DECISIONS=Object.freeze(['approve','decline','defer']);
const fail=(code,message)=>Object.assign(new Error(`${code}: ${message}`),{code});
const exists=file=>fs.access(file).then(()=>true,()=>false);
export function approvalWithoutDigest(approval){const copy=structuredClone(approval);delete copy.approvalDigest;return copy;}
export function computeApprovalDigest(approval){return digest(approvalWithoutDigest(approval));}
function normalizeConditions(conditions=[]){return conditions.map((item,index)=>({conditionCode:`CONDITION-${String(index+1).padStart(3,'0')}`,status:item.status,description:String(item.description||'').trim()}));}
export async function buildHumanApproval(root,{candidate,review,approverCode='TL',decision,summary,conditions=[],approvedAt,successorBriefLineageValidated=false}){
 const candidateValidation=await validateZhHansCandidate(root,candidate,{briefPath:null,validateBriefBinding:!successorBriefLineageValidated});
 if(!candidateValidation.valid)throw fail('APPROVAL_REQUIRES_VALID_CANDIDATE',JSON.stringify(candidateValidation.errors));
 const reviewValidation=validateHumanReview(review,candidate);
 if(!reviewValidation.valid)throw fail('APPROVAL_REQUIRES_VALID_REVIEW',JSON.stringify(reviewValidation.errors));
 if(review.decision!=='accept')throw fail('APPROVAL_REQUIRES_ACCEPTED_REVIEW',review.decision);
 if(!APPROVAL_DECISIONS.includes(decision))throw fail('APPROVAL_DECISION_INVALID',String(decision));
 if(typeof summary!=='string'||!summary.trim())throw fail('APPROVAL_SUMMARY_REQUIRED','summary');
 if(!approvedAt||Number.isNaN(Date.parse(approvedAt)))throw fail('APPROVED_AT_INVALID',String(approvedAt));
 const normalized=normalizeConditions(conditions);
 for(const item of normalized){if(!['satisfied','pending','not_applicable'].includes(item.status))throw fail('APPROVAL_CONDITION_STATUS_INVALID',item.status);if(!item.description)throw fail('APPROVAL_CONDITION_DESCRIPTION_REQUIRED',item.conditionCode);}
 if(decision==='approve'&&normalized.some(x=>x.status==='pending'))throw fail('APPROVAL_PENDING_CONDITION',normalized.find(x=>x.status==='pending').conditionCode);
 const payload={approvalType:APPROVAL_TYPE,approvalSchemaVersion:APPROVAL_SCHEMA_VERSION,approvalCode:`APPROVAL-${review.reviewCode}-V1`,candidate:{candidateCode:candidate.candidateCode,candidateDigest:candidate.candidateDigest,nodeCode:candidate.nodeCode,locale:candidate.locale},review:{reviewCode:review.reviewCode,reviewDigest:review.reviewDigest,decision:review.decision,reviewerCode:review.reviewer.reviewerCode},approver:{approverCode,authority:'TL Human Approval Authority'},decision,summary:summary.trim(),conditions:normalized,authority:{canonicalMeaning:'TL',review:'human_review_accepted',approval:'human_approval_recorded',publication:'not_published'},governance:{candidateMutationAllowed:false,reviewMutationAllowed:false,knowledgeRegistryMutationAllowed:false,publicationRecorded:false,localeStatePromotionAllowed:false},approvedAt:new Date(approvedAt).toISOString()};
 return {...payload,approvalDigest:computeApprovalDigest(payload)};
}
export function validateHumanApproval(approval,candidate,review){
 const errors=[];const add=(code,message)=>errors.push({code,message});
 if(!approval||typeof approval!=='object'||Array.isArray(approval))return {valid:false,errors:[{code:'APPROVAL_NOT_OBJECT',message:'Approval must be an object.'}]};
 if(approval.approvalType!==APPROVAL_TYPE)add('APPROVAL_TYPE_INVALID',String(approval.approvalType));
 if(approval.approvalSchemaVersion!==APPROVAL_SCHEMA_VERSION)add('APPROVAL_SCHEMA_VERSION_INVALID',String(approval.approvalSchemaVersion));
 if(!APPROVAL_DECISIONS.includes(approval.decision))add('APPROVAL_DECISION_INVALID',String(approval.decision));
 if(approval.approvalCode!==`APPROVAL-${approval.review?.reviewCode}-V1`)add('APPROVAL_CODE_INVALID',String(approval.approvalCode));
 if(approval.review?.decision!=='accept')add('APPROVAL_REVIEW_NOT_ACCEPTED',String(approval.review?.decision));
 if(approval.approver?.approverCode!=='TL'||approval.approver?.authority!=='TL Human Approval Authority')add('APPROVER_AUTHORITY_INVALID',JSON.stringify(approval.approver));
 if(typeof approval.summary!=='string'||!approval.summary.trim())add('APPROVAL_SUMMARY_REQUIRED','summary');
 if(!Array.isArray(approval.conditions))add('APPROVAL_CONDITIONS_INVALID','conditions');
 if(approval.decision==='approve'&&Array.isArray(approval.conditions)&&approval.conditions.some(x=>x.status==='pending'))add('APPROVAL_PENDING_CONDITION','conditions');
 if(approval.authority?.canonicalMeaning!=='TL'||approval.authority?.review!=='human_review_accepted'||approval.authority?.approval!=='human_approval_recorded'||approval.authority?.publication!=='not_published')add('APPROVAL_AUTHORITY_INVALID',JSON.stringify(approval.authority));
 for(const key of ['candidateMutationAllowed','reviewMutationAllowed','knowledgeRegistryMutationAllowed','publicationRecorded','localeStatePromotionAllowed'])if(approval.governance?.[key]!==false)add('APPROVAL_GOVERNANCE_INVALID',key);
 if(!approval.approvedAt||Number.isNaN(Date.parse(approval.approvedAt)))add('APPROVED_AT_INVALID',String(approval.approvedAt));
 if(!/^[a-f0-9]{64}$/.test(approval.approvalDigest||''))add('APPROVAL_DIGEST_FORMAT_INVALID',String(approval.approvalDigest));else if(approval.approvalDigest!==computeApprovalDigest(approval))add('APPROVAL_DIGEST_INVALID','approvalDigest');
 if(candidate){for(const key of ['candidateCode','candidateDigest','nodeCode','locale'])if(approval.candidate?.[key]!==candidate[key])add('APPROVAL_CANDIDATE_BINDING_INVALID',key);}
 if(review){for(const key of ['reviewCode','reviewDigest','decision'])if(approval.review?.[key]!==review[key])add('APPROVAL_REVIEW_BINDING_INVALID',key);if(approval.review?.reviewerCode!==review.reviewer?.reviewerCode)add('APPROVAL_REVIEW_BINDING_INVALID','reviewerCode');}
 return {valid:errors.length===0,errors,approvalCode:approval.approvalCode,decision:approval.decision,approvalDigest:approval.approvalDigest};
}
export function buildApprovalRegistryRecord(approval){return {approvalCode:approval.approvalCode,reviewCode:approval.review.reviewCode,reviewDigest:approval.review.reviewDigest,candidateCode:approval.candidate.candidateCode,candidateDigest:approval.candidate.candidateDigest,nodeCode:approval.candidate.nodeCode,locale:approval.candidate.locale,approverCode:approval.approver.approverCode,decision:approval.decision,approvalDigest:approval.approvalDigest,approvedAt:approval.approvedAt,publication:'not_published'};}
export async function registerApprovalProjection(root,record,{apply=false}={}){
 const rel='content/knowledge/production/registry/approval-registry.json',file=path.join(root,rel),registry=JSON.parse(await fs.readFile(file,'utf8'));
 if(registry.records.some(x=>x.approvalCode===record.approvalCode))throw fail('APPROVAL_REGISTRY_RECORD_EXISTS',record.approvalCode);
 const next={...registry,records:[...registry.records,record].sort((a,b)=>a.approvalCode.localeCompare(b.approvalCode))};
 if(apply){const temp=`${file}.tmp-${process.pid}-${crypto.randomUUID()}`;await fs.writeFile(temp,serialize(next),{flag:'wx'});await fs.rename(temp,file);}
 return {mode:apply?'apply':'dry-run',applied:apply,registryPath:rel,record};
}
export async function writeApprovalPackage(root,approval,{apply=false,output}={}){
 const rel=output||`content/knowledge/production/approvals/zh-Hans/${approval.candidate.nodeCode}/approval.v1.json`,target=path.join(root,rel);
 if(await exists(target))throw fail('APPROVAL_TARGET_EXISTS',rel);
 if(apply){await fs.mkdir(path.dirname(target),{recursive:true});const temp=`${target}.tmp-${process.pid}-${crypto.randomUUID()}`;await fs.writeFile(temp,serialize(approval),{flag:'wx'});await fs.rename(temp,target);}
 return {mode:apply?'apply':'dry-run',applied:apply,targetPath:rel,approvalDigest:approval.approvalDigest};
}
