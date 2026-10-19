export function financialRatio(numerator,denominator,{name='ratio',scale=100,numeratorDefinition}={}){
  const fail=reason=>({name,state:'NOT_COMPARABLE',value:null,reason});
  if(!numerator||!denominator)return fail('INPUT_MISSING');
  for(const k of ['instrument','timestamp'])if(!numerator[k]||numerator[k]!==denominator[k])return fail('PERIOD_OR_INSTRUMENT_MISMATCH');
  for(const k of ['currencyCode','periodText','accountingStandards'])if(!numerator.meta?.[k]||numerator.meta[k]!==denominator.meta?.[k])return fail('BASIS_MISMATCH');
  if(numerator.unit!==denominator.unit)return fail('UNIT_MISMATCH');
  if(!Number.isFinite(numerator.value)||!Number.isFinite(denominator.value)||denominator.value<=0||numerator.value<0)return fail('INVALID_DENOMINATOR_OR_INAPPLICABLE_NEGATIVE');
  return {name,state:'DERIVED',value:numerator.value/denominator.value*scale,formula:`numerator / denominator * ${scale}`,numeratorDefinition,inputs:[numerator,denominator],calculationVersion:'world-financial-ratio-v1',unit:scale===100?'percent':'ratio',nullsAreNotZero:true};
}
export function independentQuarterTTM(rows){
  if(rows.length!==4||rows.some(r=>r.meta?.flowBasis!=='INDEPENDENT_QUARTER'))return {state:'NOT_COMPUTED',reason:'FOUR_INDEPENDENT_QUARTERS_REQUIRED',value:null};
  if(new Set(rows.map(r=>r.meta.periodText)).size!==4||new Set(rows.map(r=>r.meta.currencyCode)).size!==1||new Set(rows.map(r=>r.instrument)).size!==1||rows.some(r=>!Number.isFinite(r.value)))return {state:'NOT_COMPUTED',reason:'PERIOD_OR_CURRENCY_MISMATCH',value:null};
  const times=rows.map(r=>Date.parse(r.timestamp)).sort((a,b)=>a-b);if(times.some((t,i)=>i&&(t-times[i-1]<60*86400000||t-times[i-1]>120*86400000)))return {state:'NOT_COMPUTED',reason:'NON_CONSECUTIVE_QUARTERS',value:null};
  return {state:'DERIVED',value:rows.reduce((n,r)=>n+r.value,0),formula:'sum of four explicitly independent, consecutive quarters',inputs:rows};
}
