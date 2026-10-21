import {retrieveWorldExplanation} from '../_lib/world-published-explanation.js';
export async function onRequestPost({request,env={}}){
 const reply=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store','referrer-policy':'no-referrer'}});
 if(env.PHIOS_ENVIRONMENT!=='local'||env.PHIOS_WORLD_EXPLANATION_LOCAL_ENABLED!=='true')return reply({ok:false,code:'LOCAL_SOURCE_LOOKUP_NOT_ENABLED'},503);
 try{const raw=await request.text();if(raw.length>6000)throw Error();const input=JSON.parse(raw);if(Object.keys(input).some(k=>!['question','locale'].includes(k)))throw Error();return reply({ok:true,explanation:await retrieveWorldExplanation({...input,env})});}catch{return reply({ok:false,code:'PUBLIC_SOURCE_LOOKUP_UNAVAILABLE'},422);}
}
