import {loadOwnedDraft} from '../account/financial-will-draft-store.js';
import {requireSameOrigin} from '../account/oidc-auth.js';
import {runFinancialProduct} from '../financial/product-activation/financial-product-runtime.js';
import {projectFinancialForCustomer} from '../customer-projection/financial-customer-projection.js';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
export async function onRequestPost(context){
 try{
  requireSameOrigin(context.request);const raw=await context.request.text();if(raw.length>20000)return reply({ok:false,code:'REQUEST_TOO_LARGE'},413);
  const body=JSON.parse(raw);if(body.consent!==true) return reply({ok:false,code:'FINANCIAL_REALITY_PROCESSING_CONSENT_REQUIRED'},403);
  const ref=body.savedDraftRef;if(!ref||ref.sourceKind!=='SAVED_INTAKE'||!Number.isInteger(ref.version))return reply({ok:false,code:'SAVED_DRAFT_REFERENCE_REQUIRED'},422);
  const source=await loadOwnedDraft(context,{draftId:ref.draftId,version:ref.version,expectedRef:ref,kind:'FINANCIAL'});
  const policyResponse=await context.env.ASSETS.fetch(new Request(new URL('/content/financial/analysis-runtime/policies/financial-analysis-policy-set-base-v1.json',context.request.url)));
  if(!policyResponse.ok)return reply({ok:false,code:'FAR_POLICY_UNAVAILABLE'},503);
  const result=await runFinancialProduct({input:source.payload,calculationPolicy:'CUSTOMER_NET_DEBT_V2',analysisPolicySet:await policyResponse.json()});
  return reply({ok:true,savedDraftRef:source.savedDraftRef,view:projectFinancialForCustomer(result,{intake:source.payload,locale:body.locale}),lineage:{snapshot:result.snapshot,calculation:result.calculation,sourceKind:'SAVED_INTAKE'},governance:{providerCalls:0,canonicalFdrWrite:false,exactSavedRevision:true}});
 }catch(e){return reply({ok:false,code:e.code||'FINANCIAL_SUMMARY_FAILED'},e.status||422);}
}
export const onRequestGet=()=>reply({ok:false,code:'METHOD_NOT_ALLOWED'},405);
