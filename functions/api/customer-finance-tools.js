import {calculateLoan,calculateRental,validateToolScenarios,calculateRentalAreaShare} from '../financial/calculation-runtime/customer-finance-tools.js';
import {loadOwnedDraft} from '../account/financial-will-draft-store.js';
import {requireSameOrigin} from '../account/oidc-auth.js';
export async function onRequestPost(context){try{
 requireSameOrigin(context.request);const raw=await context.request.text();if(raw.length>100000)throw Error('REQUEST_TOO_LARGE');const body=JSON.parse(raw);
 const kind=body.kind;if(kind==='rental-area'){if(!body.input||Object.keys(body.input).some(k=>!['totalArea','rentalArea'].includes(k)))throw Error('AREA_INPUT_INVALID');return Response.json({ok:true,result:calculateRentalAreaShare(body.input)},{headers:{'cache-control':'no-store'}});}if(!['loan','rental'].includes(kind))throw Error('TOOL_KIND_REQUIRED');
 let input=body.input,source={sourceKind:'EPHEMERAL'};
 if(body.savedDraftRef){const ref=body.savedDraftRef;if(!Number.isInteger(ref.version))throw Error('EXACT_VERSION_REQUIRED');const saved=await loadOwnedDraft(context,{draftId:ref.draftId,version:ref.version,expectedRef:ref,kind:'FINANCIAL'});input=saved.payload.toolScenarios?.[kind];source=saved.savedDraftRef;}
 validateToolScenarios({[kind]:input});const result=(kind==='loan'?calculateLoan:calculateRental)(input);
 return Response.json({ok:true,input,result,source},{headers:{'cache-control':'private, no-store'}});
 }catch(e){return Response.json({ok:false,code:e.code||e.message||'TOOL_FAILED'},{status:e.status||422,headers:{'cache-control':'private, no-store'}});}}
