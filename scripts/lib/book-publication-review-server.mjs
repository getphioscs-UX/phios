import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {onRequestGet as askGet,onRequestPost as askPost} from '../../functions/api/customer-contextual-ask.js';
import {onRequestGet as assetConfig} from '../../functions/api/public-asset-config.js';
const root=process.cwd();
function resolveFile(pathname){
 let file=path.resolve(root,'.'+decodeURIComponent(pathname));
 if(!file.startsWith(root+path.sep))return null;
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 else if(!fs.existsSync(file)&&fs.existsSync(file+'.html'))file+='.html';
 return fs.existsSync(file)&&fs.statSync(file).isFile()?file:null;
}
export function createPublicationReviewServer(){
 const bindings=JSON.parse(fs.readFileSync('content/civilization-atlas/visuals/civilization-visual-approved-bindings-v1.json'));
 const env={PHIOS_PUBLIC_ASSET_BASE_URL:new URL(bindings.assets[0].publicUrl).origin,ASSETS:{fetch:async request=>{const file=resolveFile(new URL(request.url).pathname);return file?new Response(fs.readFileSync(file)):new Response('',{status:404});}}};
 return http.createServer(async(req,res)=>{
  try {
   const url=new URL(req.url,'http://127.0.0.1');
   if(url.pathname.startsWith('/api/')){
    const handler=url.pathname==='/api/customer-contextual-ask'?(req.method==='POST'?askPost:askGet):url.pathname==='/api/public-asset-config'?assetConfig:null;
    if(!handler){res.writeHead(503,{'content-type':'application/json'}).end(JSON.stringify({ok:false,error:'NOT_AVAILABLE_IN_LOCAL_REVIEW'}));return;}
    let body='';for await(const chunk of req)body+=chunk;
    const request=new Request(url,{method:req.method,...(req.method==='POST'?{body,headers:{'content-type':'application/json'}}:{})});
    const response=await handler({request,env});res.writeHead(response.status,{'content-type':'application/json'});res.end(await response.text());return;
   }
   const file=resolveFile(url.pathname);
   if(!file){res.writeHead(404).end();return;}
   const mime={'.js':'text/javascript','.css':'text/css','.json':'application/json','.html':'text/html','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.avif':'image/avif'};
   res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(fs.readFileSync(file));
  }catch(error){res.writeHead(500,{'content-type':'text/plain'}).end(String(error));}
 });
}
