import {BAZI_DEEP_MANUSCRIPT_PROMPT} from './bazi-deep-manuscript-prompt.js';
import {buildBaziManuscriptSchema} from './bazi-deep-manuscript-schema.js';
// No verified model-compatible tokenizer exists in this lane. The upper bound
// counts UTF-8 bytes (tokens cannot outnumber bytes in byte-level encodings).
// Include the actual schema and role envelope; reserve extra boundary tokens.
export function estimateBaziTokens(value){
 const text=typeof value==='string'?value:JSON.stringify(value);
 return new TextEncoder().encode(text).length;
}
export function baziPricingTier(model,inputTokens){
 const p=model.pricing;
 if(p)return {rates:inputTokens>p.longContextInputThresholdTokens?p.long:p.short,state:inputTokens>p.longContextInputThresholdTokens?'LONG_CONTEXT_PRICING':'SHORT_CONTEXT_PRICING'};
 return {rates:{input:model.inputPricePerMillion,cachedInput:model.cachedInputPricePerMillion,output:model.outputPricePerMillion},state:'INJECTED_FIXTURE_PRICING'};
}
export function baziTokenCost(model,{inputTokens,cachedInputTokens=0,outputTokens}){
 const {rates}=baziPricingTier(model,inputTokens);
 if(!rates||Object.values(rates).some(x=>!Number.isFinite(x)||x<0)||cachedInputTokens<0||cachedInputTokens>inputTokens)throw Error('BDM_PRICING_REQUIRED');
 return ((inputTokens-cachedInputTokens)*rates.input+cachedInputTokens*rates.cachedInput+outputTokens*rates.output)/1e6;
}
export function planBaziDeepManuscriptOutputBudget({authority,priorSummary='',units,history={},model,policy={},semanticAnchor=null}){
 const payload={authority,priorSummary,requestedUnits:units,...(semanticAnchor?{semanticAnchor}:{})};
 const plannedInputTokens=estimateBaziTokens({input:[{role:'system',content:BAZI_DEEP_MANUSCRIPT_PROMPT},{role:'user',content:JSON.stringify(payload)}],text:{format:{type:'json_schema',name:'bazi_deep_manuscript',strict:true,schema:buildBaziManuscriptSchema(units)}}})+256;
 const density=history.acceptedTokensPerLocale||policy.expectedTokensPerLocale;
 if(!Number.isFinite(density)||density<=0||!model||!Number.isFinite(model.maxOutputTokens)||!Number.isFinite(model.contextTokens))throw Error('BDM_MODEL_CONSTRAINTS_AND_DENSITY_REQUIRED');
 const override=policy.batchOverrides?.[authority.batchId]||{};
 const historicalVisibleTargetTokens=units.reduce((n,u)=>n+(history.historicalUnitTokens?.[u.sectionId+'/'+u.locale]||history.unitOutputTokens?.[u.sectionId+'/'+u.locale]||density),0);
 const expectedOutputTokens=Math.ceil(units.reduce((n,u)=>n+(history.unitOutputTokens?.[u.sectionId+'/'+u.locale]||density),0));
 const reasoningReserveTokens=Math.max(policy.reasoningReserveTokens||25000,override.reasoningReserveTokens||0);
 const structuredOutputReserveTokens=policy.structuredOutputReserveTokens||600;
 const safetyFactor=Math.max(override.safetyFactor||policy.safetyFactor||1.2,history.outputUtilizationRatio>.85?1.3:1);
 const generatedBase=expectedOutputTokens+reasoningReserveTokens+structuredOutputReserveTokens;
 const plannedMaxOutputTokens=Math.ceil(generatedBase*safetyFactor);
 const projectedContextUse=plannedInputTokens+plannedMaxOutputTokens;
 const outputRatio=plannedMaxOutputTokens/model.maxOutputTokens,contextRatio=projectedContextUse/model.contextTokens;
 const limits=policy.capacityThresholds||{nearLimitRatio:.85,elevatedOutputRatio:.5};
 const capacityAdmission=outputRatio>1||contextRatio>1?'UNSAFE':Math.max(outputRatio,contextRatio)>=limits.nearLimitRatio?'NEAR_LIMIT':outputRatio>=limits.elevatedOutputRatio?'SAFE_WITH_ELEVATED_HEADROOM':'SAFE';
 const allowed=['SAFE','SAFE_WITH_ELEVATED_HEADROOM'].includes(capacityAdmission);
 const expectedGeneratedTokens=generatedBase; // conservative expectation pending live telemetry; reserve is not measured usage
 const expectedCost=baziTokenCost(model,{inputTokens:plannedInputTokens,outputTokens:expectedGeneratedTokens});
 const configuredWorstCaseCost=baziTokenCost(model,{inputTokens:plannedInputTokens,outputTokens:plannedMaxOutputTokens});
 const costWarning=Number.isFinite(policy.costTiers?.normalCostTarget)&&expectedCost>policy.costTiers.normalCostTarget;
 return {reasoningEffort:policy.reasoningEffort||'medium',model:model.modelId,authorityInputChars:JSON.stringify(authority).length,estimatedInputTokens:plannedInputTokens,plannedInputTokens,historicalVisibleTargetTokens,netUniqueVisibleTargetTokens:expectedOutputTokens,expectedVisibleTokens:expectedOutputTokens,expectedOutputTokens,reasoningReserveTokens,structuredOutputReserveTokens,safetyFactor,generatedBase,expectedGeneratedTokens,expectedGeneratedAssumption:'Visible target + full reasoning and structure reserve; not measured billed usage',plannedMaxOutputTokens,safetyHeadroom:plannedMaxOutputTokens-expectedOutputTokens,modelMaxOutputTokens:model.maxOutputTokens,contextWindowTokens:model.contextTokens,projectedContextUse,capacityAdmission,truncationRisk:capacityAdmission==='UNSAFE'?'HIGH':capacityAdmission==='NEAR_LIMIT'?'MEDIUM':'LOW',allowed,reason:capacityAdmission==='UNSAFE'?'BATCH_TOO_LARGE_FOR_3_CALL_PLAN':capacityAdmission==='NEAR_LIMIT'?'THREE_CALL_CAPACITY_REVIEW_REQUIRED':null,expectedCost,estimatedCost:expectedCost,configuredWorstCaseCost,configuredWorstCaseOutputCost:baziTokenCost(model,{inputTokens:0,outputTokens:plannedMaxOutputTokens}),costWarning,costState:costWarning?'HIGH':'WITHIN_CONFIGURED_TARGET_OR_UNSET',pricingState:baziPricingTier(model,plannedInputTokens).state,authoritySizeAuditRequired:baziPricingTier(model,plannedInputTokens).state==='LONG_CONTEXT_PRICING',estimationMethod:'UTF8_BYTE_UPPER_BOUND_PLUS_ENVELOPE_256',estimator:'Conservative UTF-8 byte upper bound including actual prompt, schema and payload; 256 boundary tokens',TOKEN_ESTIMATE_CONFIDENCE:'CONSERVATIVE',constraintsVerified:model.constraintsVerified===true,pricingVerified:model.pricingVerified===true};
}
