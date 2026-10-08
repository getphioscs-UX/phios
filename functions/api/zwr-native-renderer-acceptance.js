import {authenticate,requireSameOrigin} from '../account/oidc-auth.js';
import {runZwrNativeRendererAcceptance} from '../report-delivery/zwr-native-renderer-acceptance.js';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function onRequest(context){
 try{
  if(context.request.method!=='POST')return Response.json({ok:false,code:'METHOD_NOT_ALLOWED'},{status:405,headers});
  requireSameOrigin(context.request);
  if(!await authenticate(context))return Response.json({ok:false,code:'ACCOUNT_REQUIRED'},{status:401,headers});
  return Response.json(await runZwrNativeRendererAcceptance(context.env),{headers});
 }catch(error){return Response.json({ok:false,code:error.code||'NATIVE_RENDERER_ACCEPTANCE_FAILED',details:error.details||null},{status:error.status||409,headers});}
}
