import * as ziwei from './ziwei-vfr-method-profile.js';
// Each adapter owns its native versions, pagination and diagram policies.
// Additional methods are admitted only after their own delivery delta resolves.
const adapters=Object.freeze({ZWR:ziwei});
function adapter(candidate){
 const selected=adapters[candidate?.snapshot?.methodId];
 if(!selected)throw Object.assign(new Error('METHOD_RENDER_CONTRACT_UNADMITTED'),{code:'METHOD_RENDER_CONTRACT_UNADMITTED',status:409});
 return selected;
}
export const resolveMethodRenderContract=candidate=>adapter(candidate).resolveMethodRenderContract(candidate);
export const resolveMethodDeliveryDelta=resolveMethodRenderContract;
export const assertMethodRenderReceipt=(candidate,receipt)=>adapter(candidate).assertMethodRenderReceipt(candidate,receipt);
export const methodMaterialIdentity=(candidate,receipt)=>adapter(candidate).methodMaterialIdentity(candidate,receipt);
export const assertMethodGeneration=candidate=>adapter(candidate).assertMethodGeneration(candidate);
export function assertMethodPresentationMode(methodCode,mode){
 if(['PROFILE','FINANCIAL','WILL'].includes(methodCode)&&mode!=='BILINGUAL')throw Object.assign(new Error('METHOD_BILINGUAL_ONLY'),{code:'METHOD_BILINGUAL_ONLY',status:409});
}
