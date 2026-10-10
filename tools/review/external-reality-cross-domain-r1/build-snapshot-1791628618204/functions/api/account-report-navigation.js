import {requireSameOrigin} from '../account/oidc-auth.js';
import {saveReportNavigationHandoff} from '../account/report-navigation-handoff.js';
export async function onRequestPost(context){
 try{requireSameOrigin(context.request);const raw=await context.request.text();if(new TextEncoder().encode(raw).length>6000)return Response.json({ok:false,code:'REQUEST_TOO_LARGE'},{status:413});const handoff=await saveReportNavigationHandoff(context,JSON.parse(raw));return Response.json({ok:true,handoff},{headers:{'cache-control':'private, no-store'}});}catch(e){return Response.json({ok:false,code:e.code||'REPORT_NAVIGATION_UNAVAILABLE'},{status:e.status||409,headers:{'cache-control':'private, no-store'}});}
}
