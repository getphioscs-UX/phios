import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {authenticatedFixture} from './test.mjs';
export async function start(port=0){
 const f=await authenticatedFixture();const pages=['/perspectives/profile/','/knowledge/ask/','/world/','/professional/financial/','/perspectives/phi-configuration/'];
 const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://'+req.headers.host);if(['/api/account-profile-evidence','/api/profile-progressive','/api/account-financial-will-drafts'].includes(url.pathname)){
  const buffers=[];for await(const c of req)buffers.push(c);const body=req.method==='POST'?JSON.parse(Buffer.concat(buffers).toString()):null;
  const response=await f.request(body,{path:url.pathname+url.search,origin:!req.headers.origin||req.headers.origin===url.origin?'https://localhost':'https://untrusted.invalid'});res.writeHead(response.status,response.headers);res.end(response.raw);return;
 }
 if(url.pathname.startsWith('/api/')){res.writeHead(503,{'content-type':'application/json'});res.end('{"ok":false,"code":"LOCAL_DEPENDENCY_NOT_MOUNTED"}');return;}
 const name=pages.includes(url.pathname)?url.pathname+'index.html':url.pathname;
 const relative=name.slice(1),absolute=path.resolve(relative),root=process.cwd()+path.sep;
 const allowed=absolute.startsWith(root)&&(pages.some(p=>relative===p.slice(1)+'index.html')||relative.startsWith('assets/')||relative.startsWith('tools/review/personal-evidence-r1/')||relative==='content/customer-experience-rebuild/authority/customer-visual-asset-registry-v4.json');
 if(!allowed||!fs.existsSync(absolute)||!fs.statSync(absolute).isFile()||/\.(mjs|sqlite)$/.test(absolute)){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'content-type':({'.js':'text/javascript','.html':'text/html; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.pdf':'application/pdf','.md':'text/plain; charset=utf-8'}[path.extname(absolute)]||'application/octet-stream'),'cache-control':'no-store'});res.end(fs.readFileSync(absolute));
 }catch{res.writeHead(500,{'content-type':'application/json'});res.end('{"ok":false,"code":"LOCAL_BRIDGE_ERROR"}');}});
 await new Promise(r=>server.listen(port,'127.0.0.1',r));return {url:'http://127.0.0.1:'+server.address().port,fixture:f,close:async()=>{await new Promise(r=>server.close(r));f.close();}};
}
if(process.argv[1]?.endsWith('/receiver-closure/server.mjs')||process.argv[1]?.endsWith('\\receiver-closure\\server.mjs')){const s=await start(59838);console.log(s.url+'/tools/review/personal-evidence-r1/PERSONAL-EVIDENCE-HUMAN-REVIEW.html');console.log('Synthetic cookie fixture through actual middleware; no real IDP login or production storage.');}
