import {onRequestPost as navigate} from '../functions/api/customer-my-reality.js';
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {setup,identity} from '../tools/review/personal-evidence-r1/evidence-system-r1/local-test.mjs';
import {profileEvidenceApi} from '../functions/account/profile-evidence-store.js';
import {onRequestGet,onRequestPost} from '../functions/api/profile-progressive.js';
export async function start({port=0,file=':memory:',extraApi=null,inject=''}={}){
 const {env,sql}=await setup(file);const root=process.cwd(),logs=[];
 const server=http.createServer(async(req,res)=>{try{
  const origin='http://'+req.headers.host,url=new URL(req.url,origin);let result;
  if(extraApi&&url.pathname==='/api/account-ecr-section11-local'){
   const chunks=[];for await(const c of req)chunks.push(c);const request=new Request(url,{method:req.method,headers:req.headers,body:req.method==='GET'?undefined:Buffer.concat(chunks)});
   result=await extraApi({request,env,data:identity()});logs.push({method:req.method,path:url.pathname,status:result.status});
  }else
  if(url.pathname==='/api/account-profile-evidence'||url.pathname==='/api/profile-progressive'||url.pathname==='/api/customer-my-reality'){
   const chunks=[];for await(const chunk of req)chunks.push(chunk);const headers={...req.headers};
   const request=new Request(url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
   const context={request,env,data:identity()};
   result=url.pathname==='/api/customer-my-reality'?await navigate(context):url.pathname.includes('account-profile')?await profileEvidenceApi(context):req.method==='GET'?await onRequestGet(context):await onRequestPost(context);
   // Only route, method and status. No question, source IDs, headers or personal content.
   logs.push({method:req.method,path:url.pathname,status:result.status});
  }else if(url.pathname.startsWith('/api/'))result=Response.json({ok:false,code:'LOCAL_DEPENDENCY_NOT_MOUNTED'},{status:503});
  else{
   const name=url.pathname==='/'?'/perspectives/profile/index.html':url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname;
   const relative=name.slice(1),p=path.resolve(root,relative);
   const allowed=p.startsWith(root+path.sep)&&(relative.startsWith('assets/')||relative==='content/customer-experience-rebuild/authority/customer-visual-asset-registry-v4.json'||relative==='perspectives/profile/index.html'||relative==='tools/review/personal-evidence-r1/PERSONAL-EVIDENCE-HUMAN-REVIEW.html'||relative.startsWith('tools/review/personal-evidence-r1/evidence-system-r1/'));
   if(!allowed||!fs.existsSync(p)||!fs.statSync(p).isFile()||/\.(sqlite|mjs)$/.test(p))result=new Response('Not available',{status:404});
   else{const type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.md':'text/plain; charset=utf-8','.patch':'text/plain; charset=utf-8','.pdf':'application/pdf','.png':'image/png','.svg':'image/svg+xml'}[path.extname(p)]||'application/octet-stream';const content=inject&&relative==='perspectives/profile/index.html'?fs.readFileSync(p,'utf8').replace('</body>',inject+'</body>'):fs.readFileSync(p);result=new Response(content,{headers:{'content-type':type,'cache-control':'no-store'}});}
  }
  res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
 }catch{res.writeHead(500,{'content-type':'application/json'});res.end('{"ok":false,"code":"LOCAL_BRIDGE_ERROR"}');}});
 await new Promise(r=>server.listen(port,'127.0.0.1',r));
 return {url:'http://127.0.0.1:'+server.address().port,logs,env,sql,close:async()=>{await new Promise(r=>server.close(r));sql.close();}};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/ecr-r2-navigation-test-server.mjs')){
 const folder='tools/review/phi-configuration-deep-reading-r2-integrated/continuation-local-20261025';
 fs.mkdirSync(folder,{recursive:true});
 const s=await start({port:59837,file:folder+'/human-session.sqlite'});
 const {call,fixture}=await import('../tools/review/personal-evidence-r1/evidence-system-r1/local-test.mjs');
 const current=await call(s.env);
 if(!current.body.records?.length)await call(s.env,{action:'save',record:{...fixture,title:'Synthetic Navigation handoff review',claimDirection:'CHALLENGES',outcome:'A synthetic counterexample; no verified capability conclusion'},requestToken:crypto.randomUUID(),consent:true,retentionConsent:true,expiresAt:new Date(Date.now()+86400000).toISOString()});
 console.log(s.url+'/perspectives/profile/?evidence=1&locale=zh-Hans');
 console.log('LOCAL SYNTHETIC ACCOUNT ONLY. No production credentials, paid provider, or external requests.');
}
