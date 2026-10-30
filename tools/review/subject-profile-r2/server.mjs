// Controlled local harness. Synthetic IdP, actual Account/PWS code; no live login.
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';
import {openLocalOwner} from '../reality-navigation-continuity-r1/local-owner.mjs';
import {seedSubjectFixtures,sqliteAdapter} from '../subject-profile-r1/fixtures.mjs';
import {authApi,authenticate,SESSION_COOKIE} from '../../../functions/account/oidc-auth.js';
import {subjectR2Catalogue,readSubjectOwnerIntegration,rejectUnadmittedSubjectOperation} from '../../../functions/profile/subject-owner-integration-r2.js';
const out='.tmp/subject-profile-r2';fs.mkdirSync(out,{recursive:true});
const owner=await openLocalOwner('.tmp/reality-navigation-continuity-r1/subject-profile-r2.sqlite');
// Node 22's experimental SQLite binding differs from Node 24 for ?1 slots.
// Preserve D1 numbered-parameter semantics in this local transport only,
// including repeated references to a slot. Owner SQL and policies are unchanged.
const localSql={exec:q=>owner.sql.exec(q),prepare(q){
 const slots=[];const query=q.replace(/\?(\d+)/g,(_,n)=>{slots.push(Number(n)-1);return '?';});
 const statement=owner.sql.prepare(query);if(!slots.length)return statement;
 if(/\?(?!\d)/.test(q))throw Error('LOCAL_SQL_MIXED_PLACEHOLDERS_UNSUPPORTED');
 return Object.fromEntries(['run','get','all'].map(method=>[method,(...values)=>statement[method](...slots.map(i=>values[i]))]));
}};
const accounts=Object.fromEntries(await Promise.all(['A','B'].map(async alias=>[alias,await owner.identity(await owner.login(alias))])));
await seedSubjectFixtures(localSql,accounts);
const env={AUTH_PROVIDER:'auth0',AUTH_ISSUER:'https://continuity-qa.example.invalid/',AUTH_CLIENT_ID:'continuity-local-fixture',AUTH_CLIENT_SECRET:'synthetic-only-no-remote-credential',AUTH_SESSION_SECRET:'synthetic-local-session-key-never-used-in-production',RUNTIME_DB:sqliteAdapter(localSql),PHIOS_SUBJECT_R2_MODE:'ISOLATED_OWNER_REVIEW'};
env.ASSETS={fetch:async request=>{const p=new URL(request.url).pathname;if(p!=='/content/civilization-atlas/geography/world-selection-geometry-r2.json')return new Response(null,{status:404});return Response.json(JSON.parse(fs.readFileSync('.'+p)));}};
const localCookie=r=>r.headers.cookie?.match(/(?:^|;\s*)subject-r2-session=([^;]+)/)?.[1]||'';
const context=(req,pathname)=>({env,request:new Request('https://continuity-local.example.invalid'+pathname,{headers:{cookie:SESSION_COOKIE+'='+localCookie(req)}})});
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
globalThis.fetch=async()=>{throw Error('OUTBOUND_DISABLED_SUBJECT_R2');};
const server=http.createServer(async(req,res)=>{
 let response;const origin='http://127.0.0.1:'+server.address().port,u=new URL(req.url,origin);
 try{
  if(req.headers.host!=='127.0.0.1:'+server.address().port)throw Error('LOCAL_HOST_REQUIRED');
  const c=context(req,u.pathname+u.search),locale=u.searchParams.get('locale')==='zh-Hans'?'zh-Hans':'en';
  if(u.pathname==='/__qa/login'&&req.method==='POST'){
   if(req.headers.origin!==origin)throw Object.assign(Error('ORIGIN_REQUIRED'),{status:403});
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>2000)throw Error('BODY_TOO_LARGE');}const alias=JSON.parse(raw).account;
   if(!['A','B'].includes(alias))throw Error('SYNTHETIC_ACCOUNT_REQUIRED');const token=await owner.login(alias);
   response=reply({ok:true,scope:'SYNTHETIC_IDP_NATIVE_ACCOUNT_SESSION'});response.headers.set('Set-Cookie','subject-r2-session='+token+'; HttpOnly; SameSite=Strict; Path=/');
  }else if(u.pathname==='/__qa/logout'&&req.method==='POST'){
   if(req.headers.origin!==origin)throw Object.assign(Error('ORIGIN_REQUIRED'),{status:403});
   c.request=new Request(c.request.url,{method:'POST',headers:{cookie:c.request.headers.get('cookie'),origin:'https://continuity-local.example.invalid',accept:'application/json'}});
   c.fetch=async()=>Response.json({issuer:env.AUTH_ISSUER,authorization_endpoint:env.AUTH_ISSUER+'authorize',token_endpoint:env.AUTH_ISSUER+'token',jwks_uri:env.AUTH_ISSUER+'jwks'});
   response=await authApi(c,'logout');response.headers.set('Set-Cookie','subject-r2-session=; Max-Age=0; HttpOnly; SameSite=Strict; Path=/');
  }else if(u.pathname==='/__qa/revoke'&&req.method==='POST'){
   if(req.headers.origin!==origin)throw Object.assign(Error('ORIGIN_REQUIRED'),{status:403});const identity=await authenticate(c);if(identity?.userId!==accounts.A)throw Object.assign(Error('DENIED'),{status:403});
   owner.sql.prepare("UPDATE pws_registry_relationships SET status='revoked' WHERE relationship_id='access:A:qa-business'").run();response=reply({ok:true,scope:'LOCAL_FIXTURE_GRANT_ONLY'});
  }else if(u.pathname==='/api/customer-subject-workspace'&&req.method==='GET'){
   const id=u.searchParams.get('subjectId'),worldSubjectId=u.searchParams.get('worldSubjectId');response=reply({ok:true,...(id?await readSubjectOwnerIntegration(c,id,{locale,worldSubjectId}):await subjectR2Catalogue(c,{locale})),scope:'R2_ISOLATED_OWNER_REVIEW'});
  }else if(u.pathname==='/api/auth/session')response=reply({ok:true,authenticated:Boolean(await authenticate(c)),verified:Boolean(await authenticate(c))});
  else if(u.pathname==='/api/customer-subject-workspace'&&req.method==='POST'){
   if(req.headers.origin!==origin)throw Object.assign(Error('ORIGIN_REQUIRED'),{status:403});await rejectUnadmittedSubjectOperation(c,u.searchParams.get('subjectId'),'SAVE');
  }else if(u.pathname.startsWith('/api/')||u.pathname.startsWith('/__qa/'))response=reply({ok:false,code:'OUTSIDE_R2_LOCAL_SCOPE'},503);
  else{
   let rel=decodeURIComponent(u.pathname).slice(1);if(!rel||rel.endsWith('/'))rel+='index.html';
   const allowed=rel==='reality/index.html'||rel==='world/index.html'||rel==='content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html'||rel.startsWith('content/production-closure/live-customer-commercial-convergence/subject-profile-r2/')||rel.startsWith('assets/')||rel==='tools/review/subject-profile-r2/boot.js'||rel==='content/customer-experience-rebuild/authority/customer-visual-asset-registry-v4.json';
   const full=path.resolve(rel);if(path.relative(process.cwd(),full).split(path.sep).join('/')!==rel)throw Object.assign(Error('NOT_FOUND'),{status:404});
   if(!allowed||!full.startsWith(process.cwd()+path.sep)||!fs.existsSync(full)||!fs.realpathSync(full).startsWith(fs.realpathSync(process.cwd())+path.sep))throw Object.assign(Error('NOT_FOUND'),{status:404});
   const types={'.js':'text/javascript','.html':'text/html; charset=utf-8','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};if(!types[path.extname(rel)])throw Object.assign(Error('NOT_FOUND'),{status:404});
   let bytes=fs.readFileSync(rel==='assets/customer-ui/js/surfaces/subject-workspace-r1.js'?out+'/subject-browser.js':full);
   if(rel==='reality/index.html')bytes=Buffer.from(bytes.toString().replace('</body>','<script type="module" src="/tools/review/subject-profile-r2/boot.js"></script></body>'));
   response=new Response(bytes,{headers:{'Content-Type':types[path.extname(rel)],'Cache-Control':'no-store'}});
  }
 }catch(error){response=reply({ok:false,code:error.code||error.message||'R2_UNAVAILABLE'},error.status||400);}
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
});
server.listen(0,'127.0.0.1',()=>{const url='http://127.0.0.1:'+server.address().port;fs.writeFileSync(out+'/PREVIEW.json',JSON.stringify({url,scope:'SYNTHETIC_IDP_NATIVE_ACCOUNT_PWS_LOCAL_ONLY'}));console.log(url);});
process.on('SIGINT',()=>server.close(()=>{owner.close();process.exit();}));
