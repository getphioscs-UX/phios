import {requireSameOrigin} from '../account/oidc-auth.js';
import {personIdentity} from '../account/canonical-person-store.js';
import {generateAndReleaseAccountZiwei,listAccountZiweiMaterials,openAccountZiweiMaterial} from '../account/ziwei-account-delivery.js';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'};
export async function onRequest(context){
 try{
  personIdentity(context);
  if(!['local','qa','preview'].includes(context.env?.PHIOS_ENVIRONMENT))return Response.json({ok:false,code:'METHOD_REPORT_DELIVERY_NOT_ADMITTED'},{status:403,headers});
  if(context.request.method==='GET'){
   const id=new URL(context.request.url).searchParams.get('reportId');
   if(id){const {html}=await openAccountZiweiMaterial(context,id);return new Response(html,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; img-src 'self' data: https://assets.getphios.com https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev; style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'"}});}
   return Response.json({ok:true,reports:await listAccountZiweiMaterials(context)},{headers});
  }
  if(context.request.method!=='POST')return Response.json({ok:false,code:'METHOD_NOT_ALLOWED'},{status:405,headers});
  requireSameOrigin(context.request);
  const reader=context.request.body?.getReader();if(!reader)throw Error('BODY_REQUIRED');let size=0,raw='';const decoder=new TextDecoder();
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();return Response.json({ok:false,code:'REQUEST_TOO_LARGE'},{status:413,headers});}raw+=decoder.decode(value,{stream:true});}
  raw+=decoder.decode();
  return Response.json({ok:true,...await generateAndReleaseAccountZiwei(context,JSON.parse(raw))},{headers,status:201});
 }catch(e){
  if(context.env?.PHIOS_ENVIRONMENT==='qa'){
   const token=v=>typeof v==='string'&&/^[A-Z0-9_:-]{1,120}$/.test(v)?v:null;
   console.warn('METHOD_REPORT_QA_FAILURE',JSON.stringify({code:token(e.code)||'METHOD_REPORT_UNAVAILABLE',sections:(e.details?.sections||[]).map(s=>({sectionId:token(s.sectionId),status:token(s.status),reasons:(s.reasons||[]).map(token).filter(Boolean)}))}));
  }
  return Response.json({ok:false,code:e.status===503?e.code:'METHOD_REPORT_UNAVAILABLE'},{status:e.status??403,headers});
 }
}
