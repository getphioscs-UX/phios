// Cloudflare-safe projection of the canonical PAI registry for Zi Wei R4.
// Keep this JS projection in sync with content/ai-economics/providers/ai-provider-cost-registry-v1.json.
// JSON import assertions are intentionally avoided for Pages/esbuild compatibility.
export const ZIWEI_R4_PAI_REGISTRY=Object.freeze({
 version:'ZIWEI-R4-PAI-PROJECTION-v1',
 source:'content/ai-economics/providers/ai-provider-cost-registry-v1.json',
 models:Object.freeze([
  Object.freeze({
   providerId:'OPENAI',
   modelId:'gpt-5.6-luna',
   routingCode:'LUNA',
   capabilityClass:'LIGHT',
   inputPricePerMillion:0.25,
   cachedInputPricePerMillion:0.025,
   outputPricePerMillion:2,
   effectiveFrom:'2026-09-10',
   effectiveTo:null,
   source:'PAI_R1_CONSERVATIVE_PLANNING_ASSUMPTION',
   status:'AVAILABLE',
   planningCostRank:1
  })
 ])
});
export default ZIWEI_R4_PAI_REGISTRY;
