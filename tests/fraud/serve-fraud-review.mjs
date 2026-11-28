// Local read-only acceptance server using the real existing API handlers.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {onRequestGet,onRequestPost} from '../../functions/api/customer-contextual-ask.js';
import {onRequestGet as intentGet,onRequestPost as intentPost} from '../../functions/api/client-intent-route.js';
const root=process.cwd(),port=Number(process.env.FRAUD_REVIEW_PORT||4173);
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
async function asset(request){
 const u=new URL(request.url),name=decodeURIComponent(u.pathname),filename=path.resolve(root,'.'+name+(name.endsWith('/')?'index.html':''));
 if(!filename.startsWith(root+path.sep))return new Response('Forbidden',{status:403});
 try{return new Response(await fs.readFile(filename),{headers:{'content-type':types[path.extname(filename)]||'application/octet-stream'}});}catch{return new Response('Not found',{status:404});}
}
const server=http.createServer(async(req,res)=>{
 try{
 const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>16000){res.writeHead(413).end();return;}chunks.push(chunk);}
 const request=new Request(`http://127.0.0.1:${port}${req.url}`,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})});
 const route=new URL(request.url).pathname,context={request,env:{ASSETS:{fetch:asset}}};
 let response;
 if(route==='/api/customer-contextual-ask')response=await(req.method==='POST'?onRequestPost(context):onRequestGet(context));
 else if(route==='/api/client-intent-route')response=await(req.method==='POST'?intentPost(context):intentGet(context));
 else response=await asset(request);
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(error){console.error(error.message);res.writeHead(500).end('Local review unavailable');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Fraud review on http://127.0.0.1:${port}/knowledge/ask/?task=SCAM_CHECK`));
