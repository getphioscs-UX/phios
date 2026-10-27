// Isolated owner-review projection. No product registry imports this module.
import {evaluateEditorialConditions,checkChartContradictions,retiredSourceIds} from '../field-review.mjs';
import {verifyHdConfirmationSnapshot} from '../../../../../functions/external-profile/hd-report-automation-candidate.js';
export const hierarchy=Object.freeze(['TYPE_AUTHORITY','DEFINITION_CENTERS','COMPLETE_CHANNELS','GATES_LINES_PLANETS_PROFILE','OPTIONAL_SPECIALIST']);
export function conditions(row){return {all:[...row.baseConditions.all,...(row.additionalConditions?.all||[])],extraRequiredClearances:[...(row.baseConditions.extraRequiredClearances||[]),...(row.additionalConditions?.extraRequiredClearances||[])]};}
export function inspectSelection(row,chart,{activeSourceIds,optionalPHSAdmitted=false}={}){
 const reasons=[], c=conditions(row), result=evaluateEditorialConditions(chart,c);
 if(!result.matched)reasons.push('PREDICATE_FALSE_MISSING_OR_UNMAPPED');
 if(checkChartContradictions(chart).length)reasons.push('CHART_CONTRADICTION');
 if(row.subsectionId==='SEC10.07'||row.activeSourceIds.some(s=>retiredSourceIds.includes(s)))reasons.push('WITHDRAWN_INTERPRETATION');
 if(row.activeSourceIds.some(s=>!activeSourceIds.includes(s))||row.unmappedSourceIds.length)reasons.push('SOURCE_NOT_REGISTERED');
 if(c.extraRequiredClearances.some(s=>s==='OPTIONAL_PHS_RIGHTS_CLEARED')&&!optionalPHSAdmitted)reasons.push('OPTIONAL_PHS_NOT_ADMITTED');
 if(c.all.some(p=>p.fieldAlias==='variables.determination.soundSubtype'))reasons.push('LOW_SOUND_MAPPING_UNVERIFIED');
 // Private review is explicitly authorized; it does NOT assert text rights or semantic admission.
 // The unresolved formal Cross name does not prevent reviewing ordered structural matches.
 return {reviewLocation:row.reviewLocation,matched:reasons.length===0,reasons,predicates:result.states,clearances:c.extraRequiredClearances,educational:c.all.length===0,commercialGate:'BLOCKED',customerParagraph:null};
}
export async function selectOwnerReview(rows,ctx){
 if(ctx.requestedUse!=='OWNER_REVIEW')throw Error('OWNER_REVIEW_ONLY');
 const bound=verifyHdConfirmationSnapshot(ctx.token,ctx.preview,ctx.options);
 await ctx.confirmationOwner.assertActive(bound);
 if(rows.some(r=>r.confirmedInputDigest!==bound.inputDigest||r.chartResultDigest!==bound.chartResultDigest||JSON.stringify(r.calculationVersion)!==JSON.stringify(bound.calculationVersion)))throw Error('IMMUTABLE_PARAGRAPH_BINDING_MISMATCH');
 return rows.map(r=>({...inspectSelection(r,ctx.preview.chart,ctx),paragraphSHA256:r.paragraphSHA256,language:r.language}));
}
export function presentationId(id){const [sec,n]=id.split('.');const k=Number(n);return sec==='SEC10'?`10.${k>7?k-1:k}`:`${Number(sec.slice(3))}.${k}`;}
export function rank(row){const f=conditions(row).all.map(p=>p.fieldAlias);if(row.additionalConditions?.extraRequiredClearances?.length||row.sectionId==='SEC10')return 4;if(f.some(x=>x==='type'||x==='authority'))return 0;if(f.some(x=>x==='definition'||x.startsWith('centers.')))return 1;if(f.includes('completeChannel'))return 2;return 3;}
