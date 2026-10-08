import {authenticate,requireSameOrigin} from '../account/oidc-auth.js';
import {advanceNativeRendererCampaign} from '../report-delivery/zwr-native-renderer-campaign.js';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function onRequest(context){
 try{
  if(context.request.method!=='POST')return Response.json({ok:false,code:'METHOD_NOT_ALLOWED'},{status:405,headers});
  requireSameOrigin(context.request);
  const identity=await authenticate(context);
  if(!identity)return Response.json({ok:false,code:'ACCOUNT_REQUIRED'},{status:401,headers});
  if(Number(context.request.headers.get('content-length')||0)>2048)throw Object.assign(new Error('REQUEST_TOO_LARGE'),{status:413});
  const body=await context.request.text();
  if(body.length>2048)throw Object.assign(new Error('REQUEST_TOO_LARGE'),{status:413});
  let input;try{input=JSON.parse(body);}catch{throw Object.assign(new Error('CAMPAIGN_ACTION_REQUIRED'),{code:'CAMPAIGN_ACTION_REQUIRED',status:400});}
  return Response.json(await advanceNativeRendererCampaign(context.env,identity.userId,input),{headers});
 }catch(error){return Response.json({ok:false,code:error.code||'NATIVE_RENDERER_ACCEPTANCE_FAILED',details:error.details||null},{status:error.status||409,headers});}
}
