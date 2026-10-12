import {digest} from '../../account/oidc-auth.js';
export async function createReviewDocument(answer,binding){
 const units=[];for(const field of ['answer','limitations']){const text=answer[field]||'';let index=0;for(const part of new Intl.Segmenter(answer.locale==='en'?'en':'zh',{granularity:'sentence'}).segment(text)){const value=part.segment.trim();if(value){const start=part.index+part.segment.indexOf(value);units.push({id:`U${units.length+1}`,field,start,end:start+value.length,text:value});}index=part.index+part.segment.length;}if(text&&index!==text.length)throw Error('BODY_UNIT_PARTITION_INVALID');}
 const documentDigest=await digest(JSON.stringify({packDigest:binding.packDigest,bindingDigest:binding.bindingDigest,answer,units}));return {contract:'SERVER_BODY_UNITS_V2',scopeId:'R-'+documentDigest.slice(0,16),documentDigest,packDigest:binding.packDigest,bindingDigest:binding.bindingDigest,units};
}
export const COMPACT_REVIEW_CONTRACT='COMPACT_BODY_REVIEW_V3';
export const REVIEW_TASK_LIMITS=Object.freeze({maxBodyUnits:8,maxAnswerBytes:12000,maxOutputTokens:1400});
export function reviewCapacity(document){
 const unitCount=document.units.length;
 // This is an explicit candidate capacity estimate, not measured model usage.
 // Every body/limitations unit and a possible issue for each have space. A
 // larger document is rejected, never sampled or silently truncated.
 const estimatedVisibleTokens=180+unitCount*130,minimumOutputTokens=Math.max(600,estimatedVisibleTokens);
 if(!unitCount||unitCount>REVIEW_TASK_LIMITS.maxBodyUnits||minimumOutputTokens>REVIEW_TASK_LIMITS.maxOutputTokens)throw Error('REVIEW_FULL_BODY_CAPACITY_NOT_ADMITTED');
 return {unitCount,estimatedVisibleTokens,maxOutputTokens:minimumOutputTokens,reasoningEffort:'none',modelCapacityValidated:false,fullBodyCovered:true};
}
export function decideUnitReview(answer,binding,document,review){
 if(document.packDigest!==binding.packDigest||document.bindingDigest!==binding.bindingDigest||review?.scopeId!==document.scopeId)throw Error('REVIEW_SCOPE_MISMATCH');
 if(!['DELIVER','REJECT'].includes(review.verdict)||!['COMPLETE','PARTIAL','SOURCE_INSUFFICIENT','FAILED'].includes(review.answerCompleteness)||!Array.isArray(review.checks)||!Array.isArray(review.issues)||!Array.isArray(review.substantiveAnsweredUnitIds)||typeof review.missingScope!=='string')throw Error('REVIEW_SCHEMA_INVALID');
 const compact=review.contract===COMPACT_REVIEW_CONTRACT;if(review.contract&&!compact)throw Error('REVIEW_CONTRACT_VERSION_INVALID');
 const checked=new Set();for(const row of review.checks){if(!document.units.some(u=>u.id===row.unitId)||checked.has(row.unitId)||!['SUPPORTED','UNSUPPORTED','UNCERTAIN'].includes(row.assessment)||(!compact&&(typeof row.reason!=='string'||!row.reason.trim()))||compact&&Object.keys(row).some(k=>!['unitId','sourceIds','assessment'].includes(k)))throw Error('REVIEW_UNIT_INVALID');checked.add(row.unitId);if(!Array.isArray(row.sourceIds)||!row.sourceIds.length||new Set(row.sourceIds).size!==row.sourceIds.length||row.sourceIds.some(id=>!binding.bindings.some(f=>f.shortId===id)))throw Error('REVIEW_SOURCE_ID_INVALID');}
 if(document.units.some(u=>!checked.has(u.id)))throw Error('REVIEW_BODY_COVERAGE_MISSING');
 if(new Set(review.substantiveAnsweredUnitIds).size!==review.substantiveAnsweredUnitIds.length||review.substantiveAnsweredUnitIds.some(id=>!document.units.some(u=>u.id===id&&u.field==='answer')||!review.checks.some(c=>c.unitId===id&&c.assessment==='SUPPORTED')))throw Error('REVIEW_SUBSTANTIVE_UNITS_INVALID');
 for(const issue of review.issues)if(!document.units.some(u=>u.id===issue.unitId)||typeof issue.kind!=='string'||!issue.kind.trim()||typeof issue.reason!=='string'||!issue.reason.trim()||compact&&issue.reason.length>120)throw Error('REVIEW_ISSUE_INVALID');
 const supported=review.checks.every(r=>r.assessment==='SUPPORTED'),substantive=review.substantiveAnsweredUnitIds.length>0;
 if(review.verdict==='DELIVER'&&(!supported||review.issues.length))throw Error('REVIEW_DECISION_CONTRADICTION');
 if(review.answerCompleteness==='COMPLETE'&&(!substantive||review.missingScope))throw Error('REVIEW_COMPLETENESS_CONTRADICTION');
 if(review.answerCompleteness==='PARTIAL'&&(!substantive||!review.missingScope||!answer.limitations))throw Error('PARTIAL_SCOPE_NOT_DISCLOSED');
 // Never repair contradictory labels or delete unsupported prose to deliver it.
 if(review.answerCompleteness==='SOURCE_INSUFFICIENT'&&substantive)throw Error('REVIEW_COMPLETENESS_CONTRADICTION');
 if(review.verdict==='DELIVER'&&!['COMPLETE','PARTIAL'].includes(review.answerCompleteness))throw Error('REVIEW_DECISION_CONTRADICTION');
 const completeness=review.verdict==='REJECT'&&(!supported||review.issues.length)?'FAILED':review.answerCompleteness;
 const deliverable=review.verdict==='DELIVER'&&supported&&review.issues.length===0&&['COMPLETE','PARTIAL'].includes(completeness);
 return {executionState:'COMPLETE',deliverable,answerCompleteness:completeness,reviewedAnswerCompleteness:review.answerCompleteness,review,document,semanticGuarantee:false,reasonCode:deliverable?'AUTOMATIC_REVIEW_DELIVERED':!supported||review.issues.length?'AUTOMATIC_REVIEW_UNSUPPORTED_BODY':'AUTOMATIC_REVIEW_SOURCE_INSUFFICIENT',policy:'SERVER_UNITS_COMPACT_V3_MODEL_CALIBRATION_PENDING'};
}
// Historical replay only: exact contiguous character positions, no fuzzy quote
// matching or guessed IDs. Missing old checks remain missing, not fabricated.
export function adaptHistoricalReview(answer,document,legacy){
 const checks=[];for(const row of legacy.checks||[]){const fields=['answer','limitations'].filter(f=>(answer[f]||'').includes(row.statement));if(fields.length!==1)throw Error('LEGACY_STATEMENT_LOCATION_AMBIGUOUS');const field=fields[0],text=answer[field],start=text.indexOf(row.statement);if(text.indexOf(row.statement,start+1)!==-1)throw Error('LEGACY_STATEMENT_LOCATION_AMBIGUOUS');const end=start+row.statement.length;const units=document.units.filter(u=>u.field===field&&u.start>=start&&u.end<=end);if(!units.length||units[0].start!==start||units.at(-1).end!==end||units.slice(1).some((u,i)=>text.slice(units[i].end,u.start).trim()))throw Error('LEGACY_STATEMENT_UNIT_BOUNDARY_MISMATCH');for(const u of units)checks.push({...row,unitId:u.id});}
 return {...legacy,scopeId:document.scopeId,checks,substantiveAnsweredUnitIds:checks.filter(c=>document.units.some(u=>u.id===c.unitId&&u.field==='answer')&&c.assessment==='SUPPORTED').map(c=>c.unitId),issues:(legacy.issues||[]).map(i=>({...i,unitId:''})),adaptation:'EXACT_OFFLINE_POSITION_MAPPING_NOT_NEW_MODEL_OUTPUT'};
}
