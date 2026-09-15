import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {onRequestGet,onRequestPost} from '../../functions/api/customer-contextual-ask.js';
import {onRequestGet as publicAssetConfig} from '../../functions/api/public-asset-config.js';
const root=process.cwd();
export function localAsset(url){
 const pathname=decodeURIComponent(new URL(url).pathname);
 if(pathname.split('/').some(segment=>segment.startsWith('.'))||pathname.startsWith('/functions/'))return new Response('Not found',{status:404});
 let file=path.resolve(root,'.'+pathname);
 if((file!==root&&!file.startsWith(root+path.sep))||!fs.existsSync(file))return new Response('Not found',{status:404});
 if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file))return new Response('Not found',{status:404});
 return new Response(fs.readFileSync(file),{headers:{'content-type':file.endsWith('.json')?'application/json':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.svg')?'image/svg+xml':'application/octet-stream'}});
}
export async function previewServer({candidatePreview=false}={}){
 const packet=candidatePreview?JSON.parse(fs.readFileSync('functions/_source-material/m1-m4-review/m1-m4-review-packet-v1.json')):null;
 const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://preview.local');let response;
  if(url.pathname==='/api/public-asset-config'){
   // Explicit local read-only fixture from the existing public asset registry.
   const registry=JSON.parse(fs.readFileSync('content/web-production/registries/wpr-seven-volume-r2-public-assets-v1.json'));
   response=publicAssetConfig({env:{PHIOS_PUBLIC_ASSET_BASE_URL:registry.publicBaseUrl}});
  }else if(url.pathname==='/api/customer-contextual-ask'){
   let body='';for await(const c of req)body+=c;
   const request=new Request(url,{method:req.method,...(req.method==='POST'?{body}:{} )});
   response=await(req.method==='POST'?onRequestPost:onRequestGet)({request,env:{ASSETS:{fetch:request=>localAsset(request.url)}}});
  }else{response=localAsset(url);if(response.status===404){url.pathname+='.html';response=localAsset(url);}
   if(packet&&response.ok&&url.pathname.startsWith('/content/knowledge/structured/loading/')&&url.pathname.endsWith('.json')){
    const data=await response.json();const id=data.object?.objectId;
    const fields=packet.fieldCandidates.find(x=>x.objectId===id),meaning=packet.meaning.find(x=>x.objectId===id);
    if(fields&&(meaning||fields.definition)){
     data.object.definition=meaning?.finalCandidate||fields.definition.proposedValue;
     data.detail={...(data.detail||{}),summaryEn:null};
     data.reviewPreview={sourceDigest:packet.sourceDigest,sourceVersion:meaning?'REGISTERED_MANUSCRIPT':'DESKTOP_REVISION',semanticParity:'PENDING_M8',properties:fields.properties,productionAdmission:false};
     if(!meaning){const rows=packet.mapping.find(x=>x.bookCode===fields.bookCode)?.rows||[];data.backlink.manuscriptSections=data.backlink.manuscriptSections.map(s=>{const pages=rows.find(r=>r.sectionCode===s.sectionCode)?.candidatePages;return pages?{...s,startPage:pages[0],endPage:pages[1]}:s;});}
    }
    response=new Response(JSON.stringify(data),{headers:{'content-type':'application/json','cache-control':'no-store'}});
   }
  }
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(error){res.writeHead(500,{'content-type':'application/json'}).end(JSON.stringify({ok:false,error:error.message}));}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 return {origin:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(r=>server.close(r))};
}
