// One accounting shape for Reports, symbolic synthesis and contextual Ask.
// The caller persists reservations before sending any paid request.
export function reserveProviderBudget({entries=[],requestId,productClass,productId,contextId,model,inputTokenBound,outputTokenLimit,rates,perRequestMaximumUSD,batchMaximumUSD,maximumCalls}) {
  if(entries.some(e=>e.requestId===requestId))throw Error('PROVIDER_REQUEST_ALREADY_RESERVED');
  if(!Number.isSafeInteger(maximumCalls)||maximumCalls<=0)throw Error('PROVIDER_CALL_LIMIT_REQUIRED');
  if(entries.length>=maximumCalls)throw Error('PROVIDER_CALL_LIMIT');
  if(entries.some(e=>e.state==='RESERVED'||e.state==='USAGE_UNKNOWN'||e.state==='FAILED'))throw Error('PROVIDER_BATCH_STOPPED');
  for(const n of [inputTokenBound,outputTokenLimit])if(!Number.isSafeInteger(n)||n<=0)throw Error('PROVIDER_TOKEN_BOUND_REQUIRED');
  for(const n of [rates.inputBoundPerMillion,rates.outputPerMillion,perRequestMaximumUSD,batchMaximumUSD])if(!Number.isFinite(n)||n<=0)throw Error('PROVIDER_PRICE_BOUND_REQUIRED');
  const estimatedMaximumCostUSD=(inputTokenBound*rates.inputBoundPerMillion+outputTokenLimit*rates.outputPerMillion)/1e6;
  const spent=entries.reduce((n,e)=>n+(e.providerCostUSD??e.estimatedMaximumCostUSD),0);
  if(estimatedMaximumCostUSD>perRequestMaximumUSD||spent+estimatedMaximumCostUSD>batchMaximumUSD)throw Error('PROVIDER_BUDGET_EXCEEDED');
  return {requestId,productClass,productId,contextId,model,state:'RESERVED',inputTokenBound,outputTokenLimit,estimatedMaximumCostUSD,inputTokens:null,cachedTokens:null,outputTokens:null,providerRequests:1,retryCount:0,providerCostUSD:null,providerCostMYR:null,retailPriceMYR:productClass==='TAROT'?9:null,paymentCostEstimate:null,grossMarginEstimate:null,createdAt:new Date().toISOString()};
}
export function settleProviderUsage(reservation,{usage,model,providerRequestId,latencyMs,rates}) {
  if(model!==reservation.model)throw Error('PROVIDER_MODEL_MISMATCH');
  const inputTokens=usage?.input_tokens,outputTokens=usage?.output_tokens,cachedTokens=usage?.input_tokens_details?.cached_tokens??0;
  for(const n of [inputTokens,outputTokens,cachedTokens])if(!Number.isSafeInteger(n)||n<0)throw Error('PROVIDER_USAGE_UNKNOWN');
  if(inputTokens>reservation.inputTokenBound||outputTokens>reservation.outputTokenLimit||cachedTokens>inputTokens)throw Error('PROVIDER_TOKEN_BOUND_EXCEEDED');
  const providerCostUSD=((inputTokens-cachedTokens)*rates.inputPerMillion+cachedTokens*rates.cachedInputPerMillion+outputTokens*rates.outputPerMillion)/1e6;
  if(!Number.isFinite(providerCostUSD)||providerCostUSD<0||providerCostUSD>reservation.estimatedMaximumCostUSD)throw Error('PROVIDER_ACTUAL_COST_EXCEEDS_RESERVATION');
  return {...reservation,state:'METERED',inputTokens,cachedTokens,outputTokens,providerCostUSD,providerRequestId,latencyMs,costBasis:'PROVIDER_REPORTED_TOKENS_X_OFFICIAL_STANDARD_RATES_NOT_INVOICE_RECONCILED',currencyConversionState:'NOT_ESTABLISHED',paymentCostEstimateState:'NOT_ESTABLISHED'};
}
