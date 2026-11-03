// Cloudflare-safe projection of the canonical PAI registry for Zi Wei R5.
// R5 deliberately requests the canonical DEEP model because professional
// synthesis is a governed long-form task rather than light paraphrase.
export const ZIWEI_R5_PAI_REGISTRY=Object.freeze({
 version:'ZIWEI-R5-PAI-PROJECTION-v1',
 source:'content/ai-economics/providers/ai-provider-cost-registry-v1.json',
 models:Object.freeze([
  Object.freeze({
   providerId:'OPENAI',
   modelId:'gpt-5.6-sol',
   routingCode:'SOL',
   capabilityClass:'DEEP',
   inputPricePerMillion:2.5,
   cachedInputPricePerMillion:0.25,
   outputPricePerMillion:15,
   effectiveFrom:'2026-09-10',
   effectiveTo:null,
   source:'PAI_R1_CONSERVATIVE_PLANNING_ASSUMPTION',
   status:'AVAILABLE',
   planningCostRank:3
  })
 ])
});
export default ZIWEI_R5_PAI_REGISTRY;
