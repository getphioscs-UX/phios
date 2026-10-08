import {authenticate,digest,requireSameOrigin} from '../account/oidc-auth.js';
import {openAccountZiweiMaterial,listAccountZiweiMaterials} from '../account/ziwei-account-delivery.js';
import contract from '../../content/reports/shared-report-delivery-e2e-contract-v2.json' with {type:'json'};
import {createSharedReportE2eProofV2} from '../report-delivery/shared-report-e2e-v2.js';
const handler=createSharedReportE2eProofV2({contract,authenticate,requireSameOrigin,digest,open:openAccountZiweiMaterial,list:listAccountZiweiMaterials});
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow, noarchive'};
export async function onRequest(context){const response=await handler(context);for(const [k,v] of Object.entries(headers))response.headers.set(k,v);return response;}
