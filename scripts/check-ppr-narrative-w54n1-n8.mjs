import assert from 'node:assert/strict';
import fs from 'node:fs';
import {writeNarrative,NARRATIVE_PROMPT_VERSION} from '../functions/personal-reading/narrative/narrative-writer.js';
import {verifyNarrativeClaims} from '../functions/personal-reading/narrative/narrative-claim-verifier.js';
import {applyTargetedRepair} from '../functions/personal-reading/narrative/narrative-targeted-repair.js';
import {buildNarrativeReadingIR} from '../functions/personal-reading/narrative/narrative-reading-ir.js';
import {buildNarrativePreview} from '../functions/personal-reading/narrative/narrative-preview.js';
import {assertNarrativeProductRegistry,createNarrativeCheckoutIntent,admitVerifiedNarrativePurchase} from '../functions/personal-reading/narrative/narrative-commerce-entitlement.js';
import {buildNarrativeGenerationKey,createNarrativeGenerationCache} from '../functions/personal-reading/narrative/narrative-generation-cache.js';
import {generatePaidNarrative,reopenNarrative} from '../functions/personal-reading/narrative/narrative-generation-service.js';
import {buildAskNarrativeContext,askNarrativeReading} from '../functions/personal-reading/narrative/ask-narrative-reading.js';
import {narrativeBriefCase,verifiedPayment,offer,PRODUCT,W53,W54,stubWriterProvider,stubAskAnswerer,governedRefs} from './ppr-narrative-w54n1-n8-fixtures.mjs';
const MODE=(process.argv[2]||'ALL').toUpperCase();
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const contractPaths=['narrative-writer-contract-v1.json','narrative-claim-verification-contract-v1.json','narrative-targeted-repair-contract-v1.json','narrative-reading-ir-contract-v1.json','narrative-preview-contract-v1.json','narrative-commerce-entitlement-contract-v1.json','narrative-cache-idempotency-contract-v1.json','ask-narrative-reading-contract-v1.json'].map(x=>`content/personal-reading/narrative/contracts/${x}`);
for(const p of contractPaths)assert.equal(j(p).status,'ACTIVE_MACHINE_VERIFIED');
assertNarrativeProductRegistry(PRODUCT);assert.equal(PRODUCT.askQuotaDefault,null);assert.equal(PRODUCT.clientSuccessPagePaymentAuthority,false);
const schemaFiles=['narrative-draft-v1.schema.json','narrative-claim-verification-v1.schema.json','narrative-reading-ir-v1.schema.json','narrative-preview-v1.schema.json','ask-narrative-reading-v1.schema.json'];for(const f of schemaFiles){const x=j(`content/personal-reading/narrative/schemas/${f}`);assert.equal(x.$schema,'https://json-schema.org/draft/2020-12/schema');assert(x.$id);}
const stats={cases:0,personal:0,relationship:0,repairCases:0,cacheHits:0,askCases:0,verifiedAiPreview:0,fallbackPreview:0};
for(let i=1;i<=24;i++){
  const brief=await narrativeBriefCase(i);stats.cases++;if(brief.briefType==='RELATIONSHIP')stats.relationship++;else stats.personal++;
  const payment=verifiedPayment(i),admitted=await admitVerifiedNarrativePurchase({paymentEvent:payment,registry:PRODUCT});const checkout=createNarrativeCheckoutIntent({briefDigest:brief.briefSemanticDigest,registry:PRODUCT,checkoutAttemptId:`co_${i}`});assert.equal(checkout.state,'PAYMENT_PENDING');
  const cache=createNarrativeGenerationCache();const counter={count:0};const writer=async ({brief})=>writeNarrative({brief,provider:stubWriterProvider(brief,i,counter)});
  const first=await generatePaidNarrative({brief,evidenceWritingRules:W53,factualGuard:W54,purchase:admitted.purchase,entitlement:admitted.entitlement,product:PRODUCT,cache,writer,generatedAt:'2026-09-01T10:00:00.000Z'});
  assert.equal(first.cacheHit,false);assert.equal(counter.count,1);assert.equal(first.finalVerification.summary.passed,true);assert.equal(first.narrative.generationState,'READY');assert.equal(first.narrative.narrativeBriefDigest,brief.briefSemanticDigest);assert.equal(first.narrative.webProjection.semanticDigest,first.narrative.semanticDigest);assert.equal(first.narrative.printProjection.semanticDigest,first.narrative.semanticDigest);assert.equal(first.narrative.pdfProjection.semanticDigest,first.narrative.semanticDigest);if(first.repairLog.length)stats.repairCases++;
  
  const second=await generatePaidNarrative({brief,evidenceWritingRules:W53,factualGuard:W54,purchase:admitted.purchase,entitlement:admitted.entitlement,product:PRODUCT,cache,writer,generatedAt:'2026-09-01T10:00:00.000Z'});assert.equal(second.cacheHit,true);assert.equal(counter.count,1);assert.equal(second.narrative.semanticDigest,first.narrative.semanticDigest);stats.cacheHits++;
  const key=await buildNarrativeGenerationKey({purchaseId:admitted.purchase.purchaseId,sourceSemanticDigest:brief.sourceSemanticDigest,narrativeBriefDigest:brief.briefSemanticDigest,promptVersion:NARRATIVE_PROMPT_VERSION,narrativeProductVersion:PRODUCT.productVersion});for(const reason of ['PAGE_RELOAD','PRINT','PDF','REOPEN_FROM_LIBRARY']){const reopened=await reopenNarrative({cache,generationKey:key,reason});assert.equal(reopened.cacheHit,true);assert.equal(reopened.regenerationAllowed,false);assert.equal(reopened.narrative.semanticDigest,first.narrative.semanticDigest);}
  const ai=i%4===0?{sourceBriefDigest:brief.briefSemanticDigest,verificationPassed:true,openingPreview:'A short verified AI preview grounded in this Brief.'}:null;const preview=await buildNarrativePreview({brief,offer:offer(),verifiedAiPreview:ai});assert.equal(preview.dynamicCuriosityQuestions.length,3);assert.equal(preview.offer.amountMinor,2800);assert.equal(preview.priceHardcodedInRenderer,false);if(preview.previewMode==='VERIFIED_AI_PREVIEW')stats.verifiedAiPreview++;else stats.fallbackPreview++;
  if(i%2===0){const ref=governedRefs(brief)[0];const context=await buildAskNarrativeContext({narrative:first.narrative,brief,selectedGovernedClaimRefs:ref?[ref]:[],question:'What should I observe next?',currentRealityAdditions:['A new customer-reported observation after the purchased report.'],entitlement:admitted.entitlement});const answer=await askNarrativeReading({context,brief,narrative:first.narrative,answerer:stubAskAnswerer(brief,i)});assert.equal(answer.storedNarrativeMutated,false);assert.equal(answer.sourceBriefMutated,false);assert.equal(answer.quotaConsumption.units,1);stats.askCases++;}
}
assert.equal(stats.cases,24);assert.equal(stats.personal,12);assert.equal(stats.relationship,12);assert.equal(stats.cacheHits,24);assert.equal(stats.askCases,12);assert.equal(stats.verifiedAiPreview,6);assert.equal(stats.fallbackPreview,18);assert.equal(stats.repairCases,15);
// Direct phase tests
{
 const brief=await narrativeBriefCase(1),counter={count:0},draft=await writeNarrative({brief,provider:stubWriterProvider(brief,5,counter)});const v=await verifyNarrativeClaims({brief,draft,evidenceWritingRules:W53,factualGuard:W54});assert(v.summary.repairRequiredCount>=1);const untouched=draft.opening.text;const r=await applyTargetedRepair({draft,verification:v});assert.equal(r.draft.opening.text,untouched);assert(r.repairLog.every(x=>x.fullReportRewrite===false));const final=await verifyNarrativeClaims({brief,draft:r.draft,evidenceWritingRules:W53,factualGuard:W54});assert.equal(final.summary.passed,true);
}
// Negative gates
await assert.rejects(()=>admitVerifiedNarrativePurchase({paymentEvent:{...verifiedPayment(99),verified:false},registry:PRODUCT}),/W54N6_VERIFIED_PAYMENT_EVENT_REQUIRED/);
await assert.rejects(()=>admitVerifiedNarrativePurchase({paymentEvent:{...verifiedPayment(99),verificationSource:'CLIENT_SUCCESS_PAGE'},registry:PRODUCT}),/W54N6_VERIFIED_PAYMENT_EVENT_REQUIRED/);
{
 const brief=await narrativeBriefCase(2),counter={count:0},draft=await writeNarrative({brief,provider:stubWriterProvider(brief,2,counter)}),v=await verifyNarrativeClaims({brief,draft,evidenceWritingRules:W53,factualGuard:W54});const admitted=await admitVerifiedNarrativePurchase({paymentEvent:verifiedPayment(88),registry:PRODUCT});await assert.rejects(()=>buildNarrativeReadingIR({brief,draft,verification:{...v,summary:{...v.summary,passed:false}},purchase:admitted.purchase,entitlement:admitted.entitlement,product:PRODUCT}),/W54N4_FINAL_VERIFICATION_PASS_REQUIRED/);
}
{
 const brief=await narrativeBriefCase(3),admitted=await admitVerifiedNarrativePurchase({paymentEvent:verifiedPayment(77,{askQuotaRemaining:0}),registry:PRODUCT});const cache=createNarrativeGenerationCache(),counter={count:0},writer=async({brief})=>writeNarrative({brief,provider:stubWriterProvider(brief,3,counter)});const g=await generatePaidNarrative({brief,evidenceWritingRules:W53,factualGuard:W54,purchase:admitted.purchase,entitlement:{...admitted.entitlement,askQuotaRemaining:2},product:PRODUCT,cache,writer});await assert.rejects(()=>buildAskNarrativeContext({narrative:g.narrative,brief,selectedGovernedClaimRefs:['UNKNOWN'],question:'Question?',entitlement:{...admitted.entitlement,askQuotaRemaining:2}}),/W54N8_SELECTED_GOVERNED_REF_UNKNOWN/);await assert.rejects(()=>buildAskNarrativeContext({narrative:g.narrative,brief,question:'Question?',entitlement:admitted.entitlement}),/W54N8_ENTITLEMENT_ASK_QUOTA_REQUIRED/);
}
{
 const a=await buildNarrativeGenerationKey({purchaseId:'p',sourceSemanticDigest:'a'.repeat(64),narrativeBriefDigest:'b'.repeat(64),promptVersion:'v1',narrativeProductVersion:'1.0.0'});const b=await buildNarrativeGenerationKey({purchaseId:'p',sourceSemanticDigest:'a'.repeat(64),narrativeBriefDigest:'c'.repeat(64),promptVersion:'v1',narrativeProductVersion:'1.0.0'});assert.notEqual(a.generationKey,b.generationKey);
}
assert.throws(()=>createNarrativeGenerationCache({production:true}),/W54N7_PERSISTENT_ADAPTER_REQUIRED/);
{
 const persistent=new Map();const adapter={async get(k){return persistent.get(k)||null;},async put(k,v){persistent.set(k,v);return v;},async size(){return persistent.size;}};
 const cache=createNarrativeGenerationCache({adapter,production:true});assert.equal(cache.persistenceMode,'PERSISTENT_ADAPTER');assert.equal(cache.productionReady,true);
}
const acceptance=j('content/personal-reading/narrative/acceptance/w54n1-n8-machine-acceptance-v1.json');assert.equal(acceptance.status,'MACHINE_VERIFIED');assert.equal(acceptance.campaign.requiredCases,24);assert.equal(acceptance.campaign.passedCases,24);assert.equal(acceptance.campaign.targetedRepairCases,15);assert.equal(acceptance.verified.persistentProductionCacheAdapterContractRequired,true);assert.equal(acceptance.verified.inMemoryCacheProductionAllowed,false);
console.log(`✓ W54N1–W54N8 shared AI Narrative infrastructure passed (${MODE}).`);console.log(`  24/24 generation cases; personal ${stats.personal}, relationship ${stats.relationship}; repair cases ${stats.repairCases}; cache ${stats.cacheHits}/24; Ask ${stats.askCases}/12.`);console.log('  Writer remains narrative-only; W53/W54 verifier is factual authority; targeted repair is local; Web/Print/PDF reuse one stored NarrativeReadingIR.');console.log('  Commerce requires server-verified payment; client success page has no payment authority; Ask quota remains entitlement-driven.');
