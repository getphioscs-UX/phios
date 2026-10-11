// Public projection only; never return upstream diagnostics.
const unavailable=()=>Response.json({ok:false,status:'unavailable'},{status:503,headers:{'cache-control':'no-store'}});
export async function onRequest({request,env}){
 if(request.method!=='GET')return Response.json({ok:false,status:'unavailable'},{status:405,headers:{allow:'GET','cache-control':'no-store'}});
 if(!env.METHOD_REPORT_RENDERER?.fetch)return unavailable();
 let timer;
 try{
  const response=await Promise.race([(async()=>{const upstream=await env.METHOD_REPORT_RENDERER.fetch(new Request('https://renderer.internal/health',{method:'GET'}));return {ok:upstream.ok,health:upstream.ok?await upstream.json():null};})(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('timeout')),3000);})]);
  if(!response.ok)return unavailable();
  const health=response.health;
  if(health?.ok!==true||health.status!=='ready')return unavailable();
  return Response.json({ok:true,status:'ready'},{headers:{'cache-control':'no-store'}});
 }catch{return unavailable();}finally{clearTimeout(timer);}
}
