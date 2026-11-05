// Cloudflare-safe projection of the canonical PAI registry for Zi Wei R5.
// R5 deliberately requests the canonical DEEP model because professional
// synthesis is a governed long-form task rather than light paraphrase.
export const ZIWEI_R5_PAI_REGISTRY=Object.freeze({
 version:'ZIWEI-R5-PAI-PRICING-20261102-v2',
 source:'content/ai-economics/providers/ai-provider-cost-registry-v1.json',
 models:Object.freeze([
  Object.freeze({
   providerId:'OPENAI',
   modelId:'gpt-5.6-sol',
   routingCode:'SOL',
   capabilityClass:'DEEP',
   inputPricePerMillion:4,
   cachedInputPricePerMillion:0.4,
   outputPricePerMillion:20,
   longContextInputThresholdTokens:272000,
   longContextPricing:Object.freeze({input:8,cachedInput:0.8,output:30}),
   contextTokens:1050000,
   maxOutputTokens:128000,
   pricingVerified:true,
   verifiedAt:'2026-11-02',
   reviewAfter:'2026-11-21',
   pricingScope:'STANDARD_NO_TOOLS_OR_RESIDENCY_UPLIFT_CACHE_WRITE_CHARGES_NOT_INCLUDED',
   accountAvailabilityVerified:false,
   effectiveFrom:'2026-11-02',
   effectiveTo:null,
   source:'https://developers.openai.com/api/docs/models/gpt-5.6-sol',
   status:'AVAILABLE',
   planningCostRank:3
  })
 ])
});
// Select the full-request price tier; keep the existing PAI cost/usage owner.
export function ziweiR5PricingForInput(model,inputTokens){
 if(!Number.isSafeInteger(inputTokens)||inputTokens<0)throw Error('ZWR_PRICING_INPUT_TOKENS_INVALID');
 if(inputTokens<=model.longContextInputThresholdTokens)return model;
 const rates=model.longContextPricing;
 if(!rates)throw Error('ZWR_LONG_CONTEXT_PRICING_REQUIRED');
 return Object.freeze({...model,inputPricePerMillion:rates.input,cachedInputPricePerMillion:rates.cachedInput,outputPricePerMillion:rates.output,pricingTier:'LONG_CONTEXT'});
}
export default ZIWEI_R5_PAI_REGISTRY;
