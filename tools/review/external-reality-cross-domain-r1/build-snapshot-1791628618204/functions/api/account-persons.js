import {listCanonicalPersons,loadCanonicalPerson,saveCanonicalPerson,personIdentity} from '../account/canonical-person-store.js';
import {requireSameOrigin} from '../account/oidc-auth.js';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
export async function onRequest(context){
 try{
  const identity=personIdentity(context),url=new URL(context.request.url);
  if(context.request.method==='GET'){
   const id=url.searchParams.get('personId');
   return Response.json({ok:true,...(id?{person:await loadCanonicalPerson(context.env,identity.userId,id)}:{persons:await listCanonicalPersons(context)})},{headers});
  }
  if(context.request.method!=='POST')return Response.json({ok:false,code:'METHOD_NOT_ALLOWED'},{status:405,headers});
  requireSameOrigin(context.request);
  const reader=context.request.body?.getReader();if(!reader)throw Error('BODY_REQUIRED');
  let size=0,raw='';const decoder=new TextDecoder();
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16384){await reader.cancel();return Response.json({ok:false,code:'REQUEST_TOO_LARGE'},{status:413,headers});}raw+=decoder.decode(value,{stream:true});}
  raw+=decoder.decode();
  return Response.json({ok:true,person:await saveCanonicalPerson(context,JSON.parse(raw))},{headers});
 }catch(e){return Response.json({ok:false,code:e.code??'PERSON_REQUEST_INVALID'},{status:e.status??400,headers});}
}
