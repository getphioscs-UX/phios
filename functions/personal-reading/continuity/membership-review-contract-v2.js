import {digest} from '../../account/oidc-auth.js';
export async function createReviewDocument(answer,binding){
 const units=[];for(const field of ['answer','limitations']){const text=answer[field]||'';let index=0;for(const part of new Intl.Segmenter(answer.locale==='en'?'en':'zh',{granularity:'sentence'}).segment(text)){const value=part.segment.trim();if(value){const start=part.index+part.segment.indexOf(value);units.push({id:`U${units.length+1}`,field,start,end:start+value.length,text:value});}index=part.index+part.segment.length;}if(text&&index!==text.length)throw Error('BODY_UNIT_PARTITION_INVALID');}
 const documentDigest=await digest(JSON.stringify({packDigest:binding.packDigest,bindingDigest:binding.bindingDigest,answer,units}));return {contract:'SERVER_BODY_UNITS_V2',scopeId:'R-'+documentDigest.slice(0,16),documentDigest,packDigest:binding.packDigest,bindingDigest:binding.bindingDigest,units};
}
export function decideUnitReview(answer,binding,document,review){
 if(document.packDigest!==binding.packDigest||document.bindingDigest!==binding.bindingDigest||review?.scopeId!==document.scopeId)throw Error('REVIEW_SCOPE_MISMATCH');
 if(!['DELIVER','REJECT'].includes(review.verdict)||!['COMPLETE','PARTIAL','SOURCE_INSUFFICIENT','FAILED'].includes(review.answerCompleteness)||!Array.isArray(review.checks)||!Array.isArray(review.issues)||!Array.isArray(review.substantiveAnsweredUnitIds)||typeof review.missingScope!=='string')throw Error('REVIEW_SCHEMA_INVALID');
 const checked=new Set();for(const row of review.checks){if(!document.units.some(u=>u.id===row.unitId)||checked.has(row.unitId)||!['SUPPORTED','UNSUPPORTED','UNCERTAIN'].includes(row.assessment)||typeof row.reason!=='string'||!row.reason.trim())throw Error('REVIEW_UNIT_INVALID');checked.add(row.unitId);if(!Array.isArray(row.sourceIds)||!row.sourceIds.length||new Set(row.sourceIds).size!==row.sourceIds.length||row.sourceIds.some(id=>!binding.bindings.some(f=>f.shortId===id)))throw Error('REVIEW_SOURCE_ID_INVALID');}
 if(document.units.some(u=>!checked.has(u.id)))throw Error('REVIEW_BODY_COVERAGE_MISSING');
 if(new Set(review.substantiveAnsweredUnitIds).size!==review.substantiveAnsweredUnitIds.length||review.substantiveAnsweredUnitIds.some(id=>!document.units.some(u=>u.id===id&&u.field==='answer')||!review.checks.some(c=>c.unitId===id&&c.assessment==='SUPPORTED')))throw Error('REVIEW_SUBSTANTIVE_UNITS_INVALID');
 for(const issue of review.issues)if(!document.units.some(u=>u.id===issue.unitId)||!issue.kind||!issue.reason)throw Error('REVIEW_ISSUE_INVALID');
 const supported=review.checks.every(r=>r.assessment==='SUPPORTED'),substantive=review.substantiveAnsweredUnitIds.length>0;
 if(review.verdict==='DELIVER'&&(!supported||review.issues.length))throw Error('REVIEW_DECISION_CONTRADICTION');
 if(review.answerCompleteness==='COMPLETE'&&(!substantive||review.missingScope))throw Error('REVIEW_COMPLETENESS_CONTRADICTION');
 if(review.answerCompleteness==='PARTIAL'&&(!substantive||!review.missingScope||!answer.limitations))throw Error('PARTIAL_SCOPE_NOT_DISCLOSED');
 // Substance and an explicit scoped gap take precedence over an incompatible
 // SOURCE_INSUFFICIENT label. This does not infer entailment from keywords.
 const completeness=substantive&&review.missingScope&&answer.limitations&&review.answerCompleteness==='SOURCE_INSUFFICIENT'?'PARTIAL':review.answerCompleteness;
 if(review.answerCompleteness==='SOURCE_INSUFFICIENT'&&substantive&&completeness!=='PARTIAL')throw Error('REVIEW_COMPLETENESS_CONTRADICTION');
 const deliverable=review.verdict==='DELIVER'&&supported&&review.issues.length===0&&['COMPLETE','PARTIAL'].includes(completeness);
 return {executionState:'COMPLETE',deliverable,answerCompleteness:completeness,review,document,semanticGuarantee:false,policy:'SERVER_UNITS_V2_SAMPLE_CALIBRATION_REQUIRED'};
}
// Historical replay only: exact contiguous character positions, no fuzzy quote
// matching or guessed IDs. Missing old checks remain missing, not fabricated.
export function adaptHistoricalReview(answer,document,legacy){
 const checks=[];for(const row of legacy.checks||[]){const fields=['answer','limitations'].filter(f=>(answer[f]||'').includes(row.statement));if(fields.length!==1)throw Error('LEGACY_STATEMENT_LOCATION_AMBIGUOUS');const field=fields[0],text=answer[field],start=text.indexOf(row.statement);if(text.indexOf(row.statement,start+1)!==-1)throw Error('LEGACY_STATEMENT_LOCATION_AMBIGUOUS');const end=start+row.statement.length;const units=document.units.filter(u=>u.field===field&&u.start>=start&&u.end<=end);if(!units.length||units[0].start!==start||units.at(-1).end!==end||units.slice(1).some((u,i)=>text.slice(units[i].end,u.start).trim()))throw Error('LEGACY_STATEMENT_UNIT_BOUNDARY_MISMATCH');for(const u of units)checks.push({...row,unitId:u.id});}
 return {...legacy,scopeId:document.scopeId,checks,substantiveAnsweredUnitIds:checks.filter(c=>document.units.some(u=>u.id===c.unitId&&u.field==='answer')&&c.assessment==='SUPPORTED').map(c=>c.unitId),issues:(legacy.issues||[]).map(i=>({...i,unitId:''})),adaptation:'EXACT_OFFLINE_POSITION_MAPPING_NOT_NEW_MODEL_OUTPUT'};
}
