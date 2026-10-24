import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
import {openLocalOwner} from './local-owner.mjs';
import {answerWorldSession} from '../../../functions/customer-projection/ric-world-session.js';
import {onRequest as observations} from '../../../functions/api/world-observations.js';
import {onRequestPost as explainWorld} from '../../../functions/api/world-question-explanation.js';
const root=process.cwd(),base='tools/review/reality-navigation-continuity-r1';
export async function startContinuityServer({port=0,filename='.tmp/reality-navigation-continuity-r1/preview.sqlite',extension=null,decoratePage=null,validateEvidence=null,clock}={}){
 const owner=await openLocalOwner(filename,{validateEvidence,clock}),requests=[];let origin;
 const publicAssets={fetch:async request=>{const p=new URL(request.url).pathname;const f=path.resolve(root,'.'+p);if(!p.startsWith('/content/knowledge/public/')||!f.startsWith(path.resolve(root,'content/knowledge/public')+path.sep)||!fs.existsSync(f))return new Response(null,{status:404});return new Response(fs.readFileSync(f),{headers:{'content-type':'application/json'}});}};
 const worldFetch=async(url,options={})=>{const u=new URL(url,'http://local');const request=new Request('http://local'+u.pathname+u.search,options);if(u.pathname==='/api/world-observations'&&u.searchParams.has('series'))return observations({request});if(u.pathname==='/api/world-question-explanation')return explainWorld({request,env:{PHIOS_ENVIRONMENT:'local',PHIOS_WORLD_EXPLANATION_LOCAL_ENABLED:'true',ASSETS:publicAssets}});return new Response(null,{status:503});};
 const server=http.createServer(async(req,res)=>{const u=new URL(req.url,'http://localhost');const row={method:req.method,path:u.pathname};requests.push(row);
 const send=(status,data,headers={})=>{row.status=status;res.writeHead(status,{'cache-control':'no-store','content-type':'application/json','x-content-type-options':'nosniff',...headers});res.end(typeof data==='string'||Buffer.isBuffer(data)?data:JSON.stringify(data));};
 try{
  if(extension&&await extension({req,u,owner,origin,send}))return;
  if(u.pathname.startsWith('/__local/continuity')){
   if(req.method==='POST'&&req.headers.origin!==origin)return send(403,{code:'ORIGIN_REQUIRED'});
   let input={};if(req.method==='POST'){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>24000)return send(413,{code:'BODY_TOO_LARGE'});}try{input=JSON.parse(raw);}catch{return send(400,{code:'INVALID_JSON'});}}
   if(u.pathname==='/__local/continuity/login'&&req.method==='POST'){const token=await owner.login(input.account);return send(200,{ok:true,synthetic:true},{'set-cookie':'qa-continuity='+token+'; Path=/; HttpOnly; SameSite=Strict'});}
   const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('qa-continuity='))?.slice(14);const userId=await owner.identity(token);
   if(u.pathname==='/__local/continuity/world'&&req.method==='POST'){
    if(input.consent!==true)return send(403,{code:'SOURCE_LOOKUP_CONSENT_REQUIRED'});
    const result=await answerWorldSession({question:input.question,locale:input.locale==='en'?'en':'zh-Hans',fetcher:worldFetch});
    return send(200,{answer:result.answer,sources:Object.values(result.sources),permissions:result.permissions,version:result.version,providerCalls:0,persisted:false,saveState:'EXISTING_SOURCE_PERMISSION_SESSION_ONLY'});
   }
   if(req.method==='GET')return send(200,u.searchParams.has('caseId')?owner.read(userId,u.searchParams.get('caseId')):{items:owner.list(userId)});
   if(req.method==='POST')return send(200,input.action==='create'?owner.create(userId,input):owner.update(userId,input.caseId,input));
   return send(405,{code:'METHOD_NOT_ALLOWED'});
  }
  // No production APIs are forwarded. The exact existing projection endpoint remains unmounted.
  if(u.pathname.startsWith('/api/'))return send(503,{ok:false,code:'PRODUCTION_API_NOT_MOUNTED'});
  let name=decodeURIComponent(u.pathname);if(name==='/')name='/index.html';
  if(name.endsWith('/'))name+='index.html';
  const file=path.resolve(root,'.'+name),within=dir=>file.startsWith(path.resolve(root,dir)+path.sep);const publicAsset=name.startsWith('/assets/')&&within('assets');const review=name.startsWith('/'+base+'/')&&within(base);
  const pages=['/index.html','/explore/index.html','/knowledge/ask/index.html','/reality/index.html','/world/index.html','/perspectives/profile/index.html','/perspectives/personal/index.html','/professional/financial/index.html'];
  const publicJson=name==='/content/customer-experience-rebuild/authority/customer-visual-asset-registry-v4.json'||name.startsWith('/content/knowledge/public/')&&within('content/knowledge/public')||name.startsWith('/content/world/')&&within('content/world');
  if(!file.startsWith(root+path.sep)||!(publicAsset||review||pages.includes(name)||publicJson))return send(403,{code:'STATIC_SCOPE_DENIED'});
  if(!fs.existsSync(file)||!fs.statSync(file).isFile())return send(404,{code:'NOT_FOUND'});
  const ext=path.extname(file),mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.md':'text/plain'}[ext]||'application/octet-stream';let bytes=fs.readFileSync(file);
  if(!u.searchParams.has('baseline')&&pages.includes(name)&&['/index.html','/reality/index.html'].includes(name))bytes=Buffer.from(bytes.toString().replace('</body>',`<link rel="stylesheet" href="/${base}/style.css"><script type="module" src="/${base}/boot.mjs"></script></body>`));
  if(decoratePage&&pages.includes(name)&&!u.searchParams.has('baseline'))bytes=Buffer.from(decoratePage(name,bytes.toString()));
  return send(200,bytes,{'content-type':mime});
 }catch(e){return send(e.status||(e.code==='VERSION_CONFLICT'?409:400),{code:e.code||'LOCAL_SERVICE_FAILED'});}});
 await new Promise(r=>server.listen(port,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;return {origin,requests,owner,stop:()=>new Promise(r=>{server.closeAllConnections();server.close(()=>{owner.close();r();});})};
}
if(process.argv.includes('--serve')&&path.resolve(process.argv[1]||'')===path.resolve('tools/review/reality-navigation-continuity-r1/server.mjs')){const s=await startContinuityServer({port:63951});console.log(s.origin+'/reality/?locale=zh-Hans');}
