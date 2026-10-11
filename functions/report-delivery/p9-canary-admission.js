// Private deployment bindings are the only authority. HTTP input cannot supply
// policy or gate receipts. Defaults deny every canary action.
export const P9_CANARY_POLICY_VERSION='P9-CANARY-1';
const deny=code=>{throw Object.assign(Error(code),{code,status:403});};
const parse=(raw,code)=>{try{return JSON.parse(raw);}catch{deny(code);}};
export function p9Policy(env,{clock=Date.now,allowExpired=false}={}){
 if(env?.PHIOS_ENVIRONMENT!=='production'||env.STRIPE_ENVIRONMENT!=='LIVE'||!allowExpired&&env.PHIOS_P9_CANARY_ENABLED!=='true'||env.PHIOS_SHARED_PAID_REPORT_ENABLED!=='true')deny('P9_CANARY_DISABLED');
 const p=parse(env.PHIOS_P9_CANARY_POLICY,'P9_POLICY_INVALID'),start=Date.parse(p.startsAt),end=Date.parse(p.expiresAt);
 if(p.version!==P9_CANARY_POLICY_VERSION||p.environment!=='LIVE'||p.method!=='BZR'||p.product!=='COM-REPORT-BAZI-FULL'||typeof p.ownerAccountId!=='string'||!p.ownerAccountId||!/^\w{64}$/.test(p.ownerOpaqueRef||'')||!p.personId||!p.readinessId||p.maximumPurchases!==1||p.publicGeneralSale!==false||!/^[a-f0-9]{64}$/.test(p.releaseCandidateDigest||'')||p.releaseCandidateDigest!==env.PHIOS_P9_RELEASE_DIGEST||!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>7*86400000||clock()<start||!allowExpired&&clock()>=end)deny('P9_POLICY_SCOPE_INVALID');
 return p;
}
export function p9Gate(env,gate,{ownerId,readinessId,clock=Date.now,allowExpired=false}={}){
 const p=p9Policy(env,{clock,allowExpired}),receipts=parse(env.PHIOS_P9_AUTHORIZATION_RECEIPTS,'P9_GATE_RECEIPTS_INVALID'),r=receipts?.[gate];
 if(ownerId!==undefined&&ownerId!==p.ownerAccountId||readinessId!==undefined&&readinessId!==p.readinessId)deny('P9_CANARY_OWNER_OR_READINESS_DENIED');
 if(!r||r.gate!==gate||r.scope!=='ONE_BAZI_CANARY'||r.releaseCandidateDigest!==p.releaseCandidateDigest||r.method!==p.method||r.product!==p.product||r.ownerOpaqueRef!==p.ownerOpaqueRef||r.readinessId!==p.readinessId||r.authoritySource!=='EXPLICIT_USER_IN_THIS_CONVERSATION'||!Number.isFinite(Date.parse(r.authorizedAt))||!Number.isFinite(Date.parse(r.expiresAt))||Date.parse(r.authorizedAt)>clock()||Date.parse(r.expiresAt)>Date.parse(p.expiresAt)||!allowExpired&&Date.parse(r.expiresAt)<=clock())deny('P9_'+gate+'_NOT_AUTHORIZED');
 if(gate==='G4'&&(r.model!=='gpt-5.6-sol'||r.normalCalls!==3||r.maxStandardTechnicalRecoveries!==2||r.lifecycleHardCapUSD!==4||r.followupReserveUSD!==0.4||r.semanticVerifierCalls!==0||r.semanticReviewCalls!==0||r.editorialRewriteCalls!==0)||gate==='G5'&&r.conditionalFailureOnly!==true||gate==='G6'&&r.maximumPurchases!==1)deny('P9_GATE_BUDGET_OR_SCOPE_INVALID');
 return p;
}
export function requireP9Owner(env,ownerId,{clock=Date.now,allowExpired=false}={}){return p9Gate(env,'G3',{ownerId,clock,allowExpired});}
export function requireP9Job(env,job){const p=requireP9Owner(env,job?.ownerAccountId,{allowExpired:true});if(job?.environment!=='LIVE'||job.methodCode!==p.method||job.productId!==p.product||job.personId!==p.personId||job.readinessId!==p.readinessId)deny('P9_JOB_SCOPE_DENIED');return p;}
export async function requireP9Payment(context,{productId,readinessId,presentation,clock=Date.now}){
 const owner=context.data?.symbolicAccountIdentity?.userId,p=p9Gate(context.env,'G3',{ownerId:owner,readinessId,clock});
 if(context.env.PHIOS_P9_CHECKOUT_ENABLED!=='true'||context.env.REPORT_PROVIDER_LIVE_ALLOWED!=='true'||productId!==p.product||presentation?.reportLocale!=='bilingual'||presentation?.reportLanguageMode!=='BILINGUAL')deny('P9_PAYMENT_DISABLED');
 for(const gate of ['G4','G5','G6'])p9Gate(context.env,gate,{ownerId:owner,readinessId,clock});
 const row=await context.env.RUNTIME_DB.prepare("SELECT count(*) n FROM commerce_purchases p JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id WHERE p.customer_id=? AND p.product_id=? AND o.environment='LIVE' AND json_extract(o.context_json,'$.p9Canary.releaseCandidateDigest')=?").bind(owner,productId,p.releaseCandidateDigest).first();
 if(row?.n!==0)deny('P9_MAXIMUM_PURCHASES_REACHED');
 return {releaseCandidateDigest:p.releaseCandidateDigest,ownerOpaqueRef:p.ownerOpaqueRef,readinessId:p.readinessId,expiresAt:p.expiresAt,maximumPurchases:1,publicGeneralSale:false};
}
export function requireP9Provider(env,ownerId){if(env.REPORT_PROVIDER_LIVE_ALLOWED!=='true')deny('P9_PROVIDER_DISABLED');return p9Gate(env,'G4',{ownerId});}
export function requireP9Refund(env,ownerId){if(env.PHIOS_P9_REFUND_ENABLED!=='true')deny('P9_REFUND_DISABLED');return p9Gate(env,'G5',{ownerId,allowExpired:true});}
