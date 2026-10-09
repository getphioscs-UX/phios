const fail=code=>{throw Object.assign(Error(code),{code,status:403});};
// Server-only transport admission. The caller must bind the durable budget
// executor after loading the existing payment + entitlement. A browser's tier,
// purchase-success URL, or client-supplied amount is never sufficient.
export function assertReportProviderAccess({env={},accessTier,fixtureTransport=false}={}){
 if(accessTier==='FREE'||env.REPORT_ACCESS_TIER==='FREE')fail('FREE_REPORT_PROVIDER_FORBIDDEN');
 if(fixtureTransport&&env.REPORT_ZERO_COST_REPLAY==='true')return {fixture:true};
 const context=env.REPORT_PAID_GENERATION_CONTEXT;
 if(!context||context.purpose!=='PAID_UNLOCKED_REPORT'||typeof context.invokeBudgeted!=='function')fail('PAID_REPORT_DURABLE_BUDGET_CONTEXT_REQUIRED');
 return context;
}
