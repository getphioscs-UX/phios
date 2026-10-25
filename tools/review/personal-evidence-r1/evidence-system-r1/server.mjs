import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {setup,identity} from './local-test.mjs';
import {profileEvidenceApi} from '../../../../functions/account/profile-evidence-store.js';
import {onRequestGet,onRequestPost} from '../../../../functions/api/profile-progressive.js';
export async function start({port=0,file=':memory:'}={}){
 const {env,sql}=await setup(file);const root=process.cwd(),logs=[];
 const server=http.createServer(async(req,res)=>{try{
  const origin='http://'+req.headers.host,url=new URL(req.url,origin);let result;
  if(url.pathname==='/api/account-profile-evidence'||url.pathname==='/api/profile-progressive'){
   const chunks=[];for await(const chunk of req)chunks.push(chunk);const headers={...req.headers};
   const request=new Request(url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
   const context={request,env,data:identity()};
   result=url.pathname.includes('account-profile')?await profileEvidenceApi(context):req.method==='GET'?await onRequestGet(context):await onRequestPost(context);
   // Only route, method and status. No question, source IDs, headers or personal content.
   logs.push({method:req.method,path:url.pathname,status:result.status});
  }else if(url.pathname.startsWith('/api/'))result=Response.json({ok:false,code:'LOCAL_DEPENDENCY_NOT_MOUNTED'},{status:503});
  else{
   const name=url.pathname==='/'?'/perspectives/profile/index.html':url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname;
   const relative=name.slice(1),p=path.resolve(root,relative);
   const allowed=p.startsWith(root+path.sep)&&(relative.startsWith('assets/')||relative==='content/customer-experience-rebuild/authority/customer-visual-asset-registry-v4.json'||relative==='perspectives/profile/index.html'||relative==='tools/review/personal-evidence-r1/PERSONAL-EVIDENCE-HUMAN-REVIEW.html'||relative.startsWith('tools/review/personal-evidence-r1/evidence-system-r1/'));
   if(!allowed||!fs.existsSync(p)||!fs.statSync(p).isFile()||/\.(sqlite|mjs)$/.test(p))result=new Response('Not available',{status:404});
   else{const type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.md':'text/plain; charset=utf-8','.patch':'text/plain; charset=utf-8','.pdf':'application/pdf','.png':'image/png','.svg':'image/svg+xml'}[path.extname(p)]||'application/octet-stream';result=new Response(fs.readFileSync(p),{headers:{'content-type':type,'cache-control':'no-store'}});}
  }
  res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
 }catch{res.writeHead(500,{'content-type':'application/json'});res.end('{"ok":false,"code":"LOCAL_BRIDGE_ERROR"}');}});
 await new Promise(r=>server.listen(port,'127.0.0.1',r));
 return {url:'http://127.0.0.1:'+server.address().port,logs,env,sql,close:async()=>{await new Promise(r=>server.close(r));sql.close();}};
}
if(process.argv[1]?.endsWith('server.mjs')){const file=path.join(os.tmpdir(),'phios-personal-evidence-r1-synthetic.sqlite');const s=await start({port:59836,file});console.log(s.url+'/perspectives/profile/?evidence=1&locale=zh-Hans');console.log('Synthetic identity only; local SQLite outside repository. No production credentials.');}
