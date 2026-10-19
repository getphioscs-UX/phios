import {requireSameOrigin} from '../account/oidc-auth.js';
import {previewSavedWillAssembly,confirmSavedWillAssembly,exportSavedWillAssembly} from '../document-assembly/saved-will-assembly.js';
export async function onRequestPost(context){try{
 requireSameOrigin(context.request);const raw=await context.request.text();if(raw.length>20000)throw Error('REQUEST_TOO_LARGE');const body=JSON.parse(raw);
 if(body.action==='preview')return Response.json({ok:true,...await previewSavedWillAssembly(context,body)},{headers:{'cache-control':'private, no-store'}});
 if(body.action==='confirm')return Response.json({ok:true,...await confirmSavedWillAssembly(context,body)},{headers:{'cache-control':'private, no-store'}});
 if(body.action!=='export')throw Error('ACTION_INVALID');const result=await exportSavedWillAssembly(context,body);
 return new Response(result.bytes,{headers:{'content-type':body.format==='PDF'?'application/pdf':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','content-disposition':`attachment; filename="will-${result.version.documentVersion}.${body.format.toLowerCase()}"`,'cache-control':'private, no-store','x-content-type-options':'nosniff','x-phios-assembly-digest':result.version.assemblyDigest}});
 }catch(e){return Response.json({ok:false,code:e.code||e.message||'WILL_ASSEMBLY_BLOCKED'},{status:e.status||409,headers:{'cache-control':'private, no-store'}});}}
