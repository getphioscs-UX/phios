import {openProductCostEnvelope,reserveProductCost,settleProductCost} from '../provider-cost/product-cost-envelope.js';
import {digest} from '../account/oidc-auth.js';
// Adapter to the existing SQL cost owner, not a second monetary ledger.
// openProductCostEnvelope verifies existing paid purchase and child entitlement.
export async function createPaidProductCostAuthority(env,binding){
 const {ownerAccountId,purchaseId,productId,reportId,authorityDigest}=binding||{};
 if(!reportId||!authorityDigest)throw Error('PAID_PRODUCT_COST_REPORT_BINDING_REQUIRED');
 const envelope=await openProductCostEnvelope(env,{ownerAccountId,purchaseId,productId});
 const contextId=await digest(JSON.stringify({reportId,authorityDigest}));
 const id=requestId=>digest(JSON.stringify({ownerAccountId,purchaseId,productId,reportId,authorityDigest,requestId}));
 return Object.freeze({ownerAccountId,purchaseId,productId,
  async reserve(request){return reserveProductCost(env,{ownerAccountId,envelopeId:envelope.envelope_id,requestId:await id(request.requestId),contextId,costClass:'MODEL',conservativeMaximumUSD:request.projectedMaximumUsd,payload:{spendStage:request.phase,sourceVersion:authorityDigest}});},
  async settle(request,measuredUSD){return settleProductCost(env,{ownerAccountId,requestId:await id(request.requestId),measuredUSD,costBasis:'PROVIDER_REPORTED_TOKENS_X_VERIFIED_RATES',payload:{spendStage:request.phase,sourceVersion:authorityDigest}});}
 });
}
