import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {openBftOwner} from './owner.mjs';
const root=fs.realpathSync('.'),owner=await openBftOwner();
globalThis.fetch=async()=>{throw Error('BFT_QA_EXTERNAL_NETWORK_DISABLED');};
const server=http.createServer(async(req,res)=>{
 const send=(status,data,headers={})=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store','x-robots-tag':'noindex',...headers});res.end(typeof data==='string'?data:JSON.stringify(data));};
 try{
  if(req.headers.host!==`127.0.0.1:${server.address().port}`)return send(403,{error:'LOOPBACK_HOST_REQUIRED'});
  const base=`http://${req.headers.host}`,url=new URL(req.url,base);let body={};
  if(req.method==='POST'){if(req.headers.origin!==base)return send(403,{error:'SAME_ORIGIN_REQUIRED'});let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>65536)return send(413,{error:'REQUEST_TOO_LARGE'});}body=JSON.parse(raw||'{}');}
  const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('bft-session='))?.slice(12),nativeCookie=token?'__Host-phios-session='+token:'';
  if(url.pathname==='/api/bft/login'&&req.method==='POST'){const cookie=await owner.login(body.alias);return send(200,{ok:true,synthetic:true},{'set-cookie':'bft-session='+cookie.slice(cookie.indexOf('=')+1)+'; HttpOnly; SameSite=Strict; Path=/'});}
  if(url.pathname==='/api/bft/logout'&&req.method==='POST'){await owner.logout(nativeCookie);return send(200,{ok:true},{'set-cookie':'bft-session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});}
  if(url.pathname.startsWith('/api/bft')){
   const who=await owner.identity(nativeCookie);if(!who)return send(401,{error:'VERIFIED_ACCOUNT_REQUIRED'});
   if(url.pathname==='/api/bft/session')return send(200,{alias:Object.entries(owner.accounts).find(([,id])=>id===who.userId)?.[0],accountId:who.userId,synthetic:true});
   const id=url.searchParams.get('case');if(!['bft-owner','bft-family','bft-team','bft-institution'].includes(id))return send(404,{error:'CASE_NOT_FOUND'});
   if(req.method==='GET'&&url.searchParams.get('view')==='invitations'){const invitations=await owner.workflow.invitation(id,who.userId);if(!invitations.length)return send(403,{error:'INVITATION_DENIED'});return send(200,{invitations,version:(await owner.registry.versionStore.list(id))[0].version_number});}
   if(req.method==='GET')return send(200,await owner.workflow.read(id,who.userId));
   if(req.method==='POST'){if(body.targetAlias){body.targetAccountId=owner.accounts[body.targetAlias];delete body.targetAlias;}if(body.actionOwnerAlias){body.actionOwner=owner.accounts[body.actionOwnerAlias];delete body.actionOwnerAlias;}if(body.accountAlias){body.accountId=owner.accounts[body.accountAlias];delete body.accountAlias;}if(body.operation==='share')body.dataSubjectId=who.userId;
    return send(200,await owner.workflow.mutate(id,who.userId,body));}
   return send(405,{error:'METHOD_NOT_ALLOWED'});
  }
  if(req.method!=='GET')return send(405,{error:'METHOD_NOT_ALLOWED'});
  let rel=decodeURIComponent(url.pathname).replace(/^\//,'');if(!rel||rel==='professional/'||rel==='professional')rel='professional/index.html';
  if(!(rel==='professional/index.html'||rel.startsWith('assets/')||rel.startsWith('content/production-closure/live-customer-commercial-convergence/')))return send(404,{error:'NOT_FOUND'});
  let file=path.resolve(root,rel);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return send(404,{error:'NOT_FOUND'});file=fs.realpathSync(file);if(!file.startsWith(root+path.sep))return send(403,{error:'PATH_DENIED'});
  let bytes=fs.readFileSync(file);if(rel==='professional/index.html'){let html=bytes.toString();html=html.replace('<body','<body data-bft-local-review');html=html.replace('</head>','<link rel="stylesheet" href="/assets/customer-ui/surfaces/bft-r1.css"></head>');html=html.replace('</main>','<section id="bft-r1" data-local-synthetic="true" aria-label="Business and financial local candidate"></section></main>');html=html.replace('</body>','<script type="module" src="/assets/customer-ui/js/surfaces/bft-r1.js"></script></body>');bytes=Buffer.from(html);}
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';
  res.writeHead(200,{'content-type':mime,'cache-control':'no-store','x-robots-tag':'noindex'});res.end(bytes);
 }catch(e){send(e.status||422,{error:e.code||e.message});}
});
server.listen(0,'127.0.0.1',()=>{const base='http://127.0.0.1:'+server.address().port;fs.writeFileSync('.tmp/bft-r1/server.json',JSON.stringify({base,pid:process.pid,syntheticOnly:true}));console.log(base+'/professional/#bft-r1');});
process.on('SIGTERM',()=>server.close(()=>{owner.close();process.exit(0);}));
