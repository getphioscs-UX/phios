import {conditions} from '../r61/selection.mjs';
import {checkChartContradictions,evaluateEditorialConditions,retiredSourceIds} from '../field-review.mjs';
import {verifyHdConfirmationSnapshot} from '../../../../../functions/external-profile/hd-report-automation-candidate.js';
import {inspectLowSound} from './low-sound.mjs';
export function inspectParagraph(row,chart,{activeSourceIds,confirmationValid=false,referenceVerified=false,toneBoundaryUncertain=false}={}){
 const all=conditions(row),ordinary=all.all.filter(p=>p.fieldAlias!=='variables.determination.soundSubtype'),requiresSubtype=all.all.length!==ordinary.length;
 const probe=evaluateEditorialConditions(chart,{all:ordinary,extraRequiredClearances:all.extraRequiredClearances}),reasons=[];
 if(!probe.matched)reasons.push('SELECTOR_FALSE_MISSING_OR_UNMAPPED');
 if(checkChartContradictions(chart).length)reasons.push('CONTRADICTORY_CHART');
 if(row.subsectionId==='SEC10.07'||row.activeSourceIds.some(s=>retiredSourceIds.includes(s)))reasons.push('WITHDRAWN_COGNITION');
 if(row.activeSourceIds.some(s=>!activeSourceIds.includes(s))||row.unmappedSourceIds.length)reasons.push('SOURCE_UNREGISTERED');
 if(all.extraRequiredClearances.includes('OPTIONAL_PHS_RIGHTS_CLEARED'))reasons.push('OPTIONAL_PHS_UPSTREAM_ADMISSION_OPEN');
 const low=requiresSubtype?inspectLowSound(chart,{confirmationValid,referenceVerified,toneBoundaryUncertain}):null;
 if(requiresSubtype&&low.value!=='LOW')reasons.push(...(low.reasons.length?low.reasons:['NOT_LOW_SOUND']));
 return {id:row.reviewLocation,language:row.language,selectedForPrivateReview:reasons.length===0,reasons,selectors:probe.states,lowSound:low,requiredClearances:all.extraRequiredClearances,commercialGate:'BLOCKED',customerParagraph:null,semanticApproved:false,rightsCleared:false};
}
export async function selectParagraphs(rows,ctx){
 if(ctx.requestedUse!=='OWNER_REVIEW')throw Error('OWNER_REVIEW_ONLY');
 const bound=verifyHdConfirmationSnapshot(ctx.token,ctx.preview,ctx.options);await ctx.confirmationOwner.assertActive(bound);
 if(rows.some(r=>r.confirmedInputDigest!==bound.inputDigest||r.chartResultDigest!==bound.chartResultDigest||JSON.stringify(r.calculationVersion)!==JSON.stringify(bound.calculationVersion)))throw Error('IMMUTABLE_BINDING_MISMATCH');
 return rows.map(r=>inspectParagraph(r,ctx.preview.chart,{...ctx,confirmationValid:true}));
}
