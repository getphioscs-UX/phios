import {sha256Hex} from '../../document-assembly/digest.js';
export function inspectOfficialSource(source,bytes,previous=null,now=new Date().toISOString()){
 if(!source?.url?.startsWith('https://')||!(bytes instanceof Uint8Array)||!bytes.length)throw Error('OFFICIAL_SOURCE_INPUT_INVALID');
 const digest=sha256Hex(bytes),changed=!!previous&&previous.digest!==digest;
 return {sourceId:source.id,url:source.url,digest,bytes:bytes.length,fetchedAt:now,state:changed?'CHANGE_DETECTED':'ARCHIVED_PENDING_REVIEW',previousDigest:previous?.digest||null,impact:source.impacts||[],effectiveApproval:false,requiresHumanReview:true};
}
export function reviewOfficialSource(record,review,{now=new Date().toISOString()}={}){
 if(!review?.reviewerRef||!review?.receiptRef||review.sourceDigest!==record.digest||!['APPROVE_EFFECTIVE','WITHDRAW'].includes(review.action))throw Error('SOURCE_REVIEW_RECEIPT_REQUIRED');
 if(review.action==='APPROVE_EFFECTIVE'&&(!review.jurisdiction||!review.effectiveFrom||!review.reviewValidUntil||review.reviewValidUntil<now.slice(0,10)))throw Error('SOURCE_REVIEW_SCOPE_REQUIRED');
 return {...record,state:review.action==='WITHDRAW'?'WITHDRAWN':'VERIFIED_EFFECTIVE',review:structuredClone(review),reviewedAt:now,effectiveApproval:review.action==='APPROVE_EFFECTIVE'};
}
