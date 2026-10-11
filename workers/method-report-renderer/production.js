import puppeteer from '@cloudflare/puppeteer';
import {verifyBaziPublication} from './bazi-verification.js';
import {P9_BAZI_FIT_CODE} from './bazi-production-fit.generated.js';
export const P9_RENDERER_VERSION='P9-BZR-RENDERER-1';
export default {async fetch(request,env){
 if(env.PHIOS_ENVIRONMENT!=='production'||request.method!=='POST'||new URL(request.url).pathname!=='/verify'||env.PHIOS_P9_RENDERER_ENABLED!=='true')return new Response(null,{status:404});
 try{if(Number(request.headers.get('content-length'))>8000000)return new Response(null,{status:413});const reader=request.body?.getReader();if(!reader)return new Response(null,{status:400});let size=0,raw='';const decoder=new TextDecoder();for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8000000){await reader.cancel();return new Response(null,{status:413});}raw+=decoder.decode(value,{stream:true});}const payload=JSON.parse(raw+decoder.decode());if(payload.method!=='BZR'||payload.publication?.fixture||payload.publication?.reviewOnly||payload.publication?.customerPublishable!==true)return new Response(null,{status:422});return await verifyBaziPublication(payload.publication,{...env,BAZI_BROWSER_FIT_CODE:P9_BAZI_FIT_CODE},puppeteer);}catch{return Response.json({ok:false,code:'BZR_RENDER_REJECTED'},{status:422});}
}};
