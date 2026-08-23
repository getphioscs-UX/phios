import assert from 'node:assert/strict';
import {readJson,buildPfrBase,recommendationInput,reviewFinancialFact,reviewFinancialFinding,createProfessionalFinancialRecommendation,amendProfessionalFinancialRecommendation,transitionProfessionalFinancialReviewCase,createProfessionalFinancialReviewSignature,createProfessionalFinancialReviewContribution,fullSignedContribution} from './lib/pfr/pfr-check-lib.mjs';
const names=['accept-finding','reject-finding','missing-information','no-action','strategic-recommendation','product-recommendation','tax-escalation','legal-escalation','unsigned','wrong-professional','superseded'];
for(const n of names) assert.equal(readJson(`content/financial/professional-review/fixtures/${n}.json`).scenario,n);
{
 const b=await buildPfrBase(); const r=await reviewFinancialFinding(b.caseInReview,b.upstream.input.farResult,{reviewId:'FX-ACC',professionalId:b.professionalId,findingReference:b.findingReference,action:'ACCEPT',reviewedAt:'2026-08-23T08:10:00Z'}); assert.equal(r.action,'ACCEPT');
}
{
 const b=await buildPfrBase(); const before=structuredClone(b.upstream.input.farResult.findings); const r=await reviewFinancialFinding(b.caseInReview,b.upstream.input.farResult,{reviewId:'FX-REJ',professionalId:b.professionalId,findingReference:b.findingReference,action:'REJECT',reviewedAt:'2026-08-23T08:11:00Z'}); assert.equal(r.action,'REJECT'); assert.deepEqual(b.upstream.input.farResult.findings,before);
}
{
 const b=await buildPfrBase(); const r=await reviewFinancialFact(b.caseInReview,b.upstream.input.fdrSnapshot,{reviewId:'FX-MISS',professionalId:b.professionalId,factReference:b.factReference,action:'REQUEST_EVIDENCE',reviewedAt:'2026-08-23T08:12:00Z'}); assert.equal(r.correctionRoute,'FDR_EVIDENCE_UPDATE_REQUIRED'); const state=await transitionProfessionalFinancialReviewCase(b.caseInReview,'NEEDS_MORE_INFORMATION',{eventId:'FX-MISS-EVT',actorProfessionalId:b.professionalId,occurredAt:'2026-08-23T08:13:00Z'}); assert.equal(state.state,'NEEDS_MORE_INFORMATION');
}
{
 const b=await buildPfrBase(); const r=await createProfessionalFinancialRecommendation(b.caseInReview,recommendationInput(b,{type:'NO_ACTION_RECOMMENDED',id:'FX-NO',text:'No action is recommended at present.'})); assert.equal(r.recommendationType,'NO_ACTION_RECOMMENDED');
 const s=await createProfessionalFinancialRecommendation(b.caseInReview,recommendationInput(b,{type:'STRATEGIC_RECOMMENDATION',id:'FX-STRAT'})); assert.ok(s.alternatives.length&&s.disadvantages.length);
 const p=await createProfessionalFinancialRecommendation(b.caseInReview,recommendationInput(b,{type:'PRODUCT_RECOMMENDATION',id:'FX-PROD'})); assert.equal(p.recommendationType,'PRODUCT_RECOMMENDATION'); assert.equal(p.conflictDisclosureRecorded,true);
 const t=await createProfessionalFinancialRecommendation(b.caseInReview,recommendationInput(b,{type:'TAX_CONSIDERATION',id:'FX-TAX',specialistEscalation:'TAX_PROFESSIONAL_REVIEW_REQUIRED',text:'Obtain specialist tax review before implementation.'})); assert.equal(t.legalOrTaxAuthorityClaimed,false);
 const l=await createProfessionalFinancialRecommendation(b.caseInReview,recommendationInput(b,{type:'LEGAL_REVIEW_REQUIRED',id:'FX-LEGAL',specialistEscalation:'LEGAL_PROFESSIONAL_REVIEW_REQUIRED',text:'Obtain legal review of the estate implementation step.'})); assert.equal(l.legalOrTaxAuthorityClaimed,false);
 await assert.rejects(()=>createProfessionalFinancialRecommendation(b.caseInReview,recommendationInput(b,{type:'STRATEGIC_RECOMMENDATION',id:'FX-WRONG',professionalId:'PRO-OTHER'})),/must match/);
 const v1=await createProfessionalFinancialRecommendation(b.caseInReview,recommendationInput(b,{id:'FX-SUP'})); const v2=await amendProfessionalFinancialRecommendation(b.caseInReview,v1,{professionalId:b.professionalId,recommendation:'Amended strategy.',rationale:'Amended human rationale.',authoredAt:'2026-08-23T08:15:00Z'}); assert.equal(v2.supersedesRecommendationDigest,v1.recommendationDigest);
}
{
 const x=await fullSignedContribution(); await assert.rejects(()=>createProfessionalFinancialReviewContribution(x.approved,{recommendations:[x.recommendation],suitability:x.suitability,affordability:x.affordability,actions:x.actions,signature:x.signature,contributionId:'UNSIGNED-BLOCK',createdAt:'2026-08-23T08:20:00Z'}),/requires SIGNED/);
}
console.log(`✓ PFR-W22 fixtures passed: ${names.length} governed scenarios.`);
