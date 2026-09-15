export function validateQaEnvironment(c,e={}){
 const errors=[];
 const require=(ok,code)=>{if(!ok)errors.push(code);};
 require(c.project==='getphios-qa','QA_PROJECT_REQUIRED');
 require(c.origin==='https://getphios-qa.pages.dev','QA_ORIGIN_REQUIRED');
 require(c.productionFallbackAllowed===false,'PRODUCTION_FALLBACK_FORBIDDEN');
 require(c.stripe?.mode==='sandbox','STRIPE_SANDBOX_REQUIRED');
 require(c.initialVars?.PHIOS_BOOK_ONE_SALES_ENABLED==='false','INITIAL_CHECKOUT_MUST_BE_DISABLED');
 require(c.initialVars?.PHIOS_PUBLIC_ORIGIN===c.origin,'PUBLIC_ORIGIN_MISMATCH');
 for(const [key,b] of Object.entries(c.bindings||{})){
  require(/sandbox/.test(b.name||''),key+'_SANDBOX_RESOURCE_REQUIRED');
  if(b.kind==='R2')require(b.private===true,key+'_PRIVATE_REQUIRED');
 }
 require(c.bindings?.RUNTIME_DB?.kind==='D1'&&c.bindings?.BOOKS?.kind==='R2'&&c.bindings?.MANUSCRIPTS?.kind==='R2','BINDINGS_REQUIRED');
 const pending=[];
 if(!e.deploymentVerified)pending.push('QA_DEPLOYMENT');
 if(!c.bindings?.RUNTIME_DB?.id||c.bindings.RUNTIME_DB.id==='073639fa-01e4-4868-af10-6ed032637dab')pending.push('DISTINCT_D1_ID');
 for(const key of ['stripeSandboxVerified','privateBucketsVerified','independentSecretsVerified','testIdentityVerified','receiptRecipientVerified','watermarkServiceVerified','migrationsApplied','sourceBookChecksumVerified'])if(e[key]!==true)pending.push(key);
 if(!c.testAccount||!c.testReceiptRecipient||c.testAccount===e.productionAccount||c.testReceiptRecipient===e.productionRecipient)pending.push('TEST_IDENTITIES');
 return {contractValid:errors.length===0,errors,pending,status:errors.length?'INVALID_CONFIGURATION':pending.length?'BLOCKED_PENDING_QA_DEPLOYMENT':'READY_FOR_SANDBOX_E2E',e2ePassed:false};
}
export function requireQaTarget(url){
 const target=new URL(url);
 if(target.origin!=='https://getphios-qa.pages.dev'||target.username||target.password)throw new Error('QA_ONLY_TARGET_REQUIRED');
 return target;
}
