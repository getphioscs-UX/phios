// Explicit local QA adapter. Reuses native OIDC and the existing SQLite continuity Owner.
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';
import {openLocalOwner} from '../reality-navigation-continuity-r1/local-owner.mjs';
import {createSubjectWorkspaceHandler} from '../../../functions/api/customer-subject-workspace.js';
import {readSubjectWorkspace} from '../../../functions/profile/subject-context-r1.js';
import {seedSubjectFixtures,sqliteAdapter,sha} from './fixtures.mjs';
const out='.tmp/subject-profile-r1';fs.mkdirSync(out,{recursive:true});
const owner=await openLocalOwner('.tmp/reality-navigation-continuity-r1/subject-profile-r1.sqlite');
const tokens={A:await owner.login('A'),B:await owner.login('B')},accounts=Object.fromEntries(await Promise.all(Object.entries(tokens).map(async([key,t])=>[key,await owner.identity(t)])));
const registry=await seedSubjectFixtures(owner.sql,accounts),env={PHIOS_SUBJECT_PROFILE_LOCAL:'true',RUNTIME_DB:sqliteAdapter(owner.sql)};
const token=request=>request.headers.get('cookie')?.match(/(?:^|;\s*)subject-qa-session=([^;]+)/)?.[1];
const identity=async context=>{try{return {verified:true,userId:await owner.identity(token(context.request))};}catch{return null;}};
const handler=createSubjectWorkspaceHandler(identity),logs=[];
const json=(b,s=200)=>Response.json(b,{status:s,headers:{'Cache-Control':'no-store'}});
globalThis.fetch=async()=>{throw Error('OUTBOUND_DISABLED_SUBJECT_QA');};
const server=http.createServer(async(req,res)=>{
 const origin='http://127.0.0.1:'+server.address().port,u=new URL(req.url,origin);let answer;
 try{
  if(!['127.0.0.1:'+server.address().port].includes(req.headers.host))throw Error('HOST_REQUIRED');
  const request=new Request(u,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:await new Promise(resolve=>{let b='';req.on('data',c=>{b+=c;if(b.length>6000)req.destroy();});req.on('end',()=>resolve(b));})}:{})});
  if(u.pathname==='/__qa/login'&&req.method==='POST'){
   if(req.headers.origin!==origin)answer=json({ok:false,code:'ORIGIN_REQUIRED'},403);
   else{const alias=(await request.json()).account;if(!tokens[alias])answer=json({ok:false},400);else{tokens[alias]=await owner.login(alias);answer=new Response(JSON.stringify({ok:true,synthetic:true}),{headers:{'Content-Type':'application/json','Set-Cookie':'subject-qa-session='+tokens[alias]+'; HttpOnly; SameSite=Strict; Path=/','Cache-Control':'no-store'}});}}
  }else if(u.pathname==='/api/customer-subject-workspace')answer=await handler({request,env});
  else if(u.pathname==='/api/auth/session')answer=json({ok:true,authenticated:!!await identity({request}),verified:!!await identity({request}),providerConfigured:false});
  else if(u.pathname==='/__qa/navigation'&&req.method==='POST'){
   if(req.headers.origin!==origin)answer=json({ok:false},403);
   else{
    const who=await identity({request});if(!who)throw Object.assign(Error('AUTH_REQUIRED'),{status:401});
    const body=await request.json(),workspace=await readSubjectWorkspace(registry,body.subjectId,who.userId);
    if(body.consent!==true||body.sourceVersion!==workspace.sourceVersion||!workspace.navigation.options.some(o=>o.id===body.optionId))throw Object.assign(Error('SELECTION_OR_VERSION_REQUIRED'),{status:409});
    const question=String(body.question||'').trim();if(!question||question.length>800)throw Error('QUESTION_REQUIRED');
    const result=await owner.create(who.userId,{question,consent:true,goal:workspace.navigation.options.find(o=>o.id===body.optionId).label,topic:workspace.subjectType.toLowerCase()});
    const caseId=result.case_id||result.case?.case_id;
    if(!caseId)throw Error('CASE_OWNER_RESPONSE_UNEXPECTED');
    const id='nav-ref:'+caseId,context={actor_id:who.userId,correlation_id:'SUBJECT-QA-NAVIGATION'};
    await registry.registerObject({object_id:id,object_code:id,object_type:'SUBJECT_NAVIGATION_REFERENCE',canonical_name:'Private navigation reference',owner_module:'REALITY_NAVIGATION',metadata:{ownerAccountId:who.userId,subjectId:workspace.subjectId,subjectType:workspace.subjectType,sourceVersion:workspace.sourceVersion,caseId,decision:body.optionId,automaticAction:false}},context);
    answer=json({ok:true,caseId,referenceId:id,subjectId:workspace.subjectId,sourceVersion:workspace.sourceVersion,persisted:'EXISTING_LOCAL_CONTINUITY_OWNER',automaticAction:false});
   }
  }else if(u.pathname==='/__qa/navigation'&&req.method==='GET'){
   const who=await identity({request}),ref=await registry.query.getObject(u.searchParams.get('referenceId'));
   if(!who||ref?.metadata.ownerAccountId!==who.userId)throw Object.assign(Error('NOT_FOUND'),{status:404});
   if(u.searchParams.has('subjectId')&&u.searchParams.get('subjectId')!==ref.metadata.subjectId)throw Object.assign(Error('SUBJECT_REFERENCE_MISMATCH'),{status:409});
   const w=await readSubjectWorkspace(registry,ref.metadata.subjectId,who.userId),c=await owner.read(who.userId,ref.metadata.caseId);
   answer=json({ok:true,case:c,subjectId:w.subjectId,sourceState:w.sourceVersion===ref.metadata.sourceVersion?'SAME_SOURCE':'SOURCE_RECHECK_REQUIRED'});
  }else if(u.pathname==='/api/customer-my-reality')answer=json({ok:false,code:'LEGACY_SOURCE_ADAPTER_NOT_BOUND_IN_THIS_QA'},503);
  else if(u.pathname.startsWith('/api/')||u.pathname.startsWith('/__qa/'))answer=json({ok:false,code:'CLOSED_IN_THIS_QA'},503);
  else{
   let rel=decodeURIComponent(u.pathname).replace(/^\//,'');if(!rel||rel.endsWith('/'))rel+='index.html';
   const full=path.resolve(rel),root=process.cwd()+path.sep;
   if(path.relative(process.cwd(),full).replaceAll('\\','/')!==rel)throw Object.assign(Error('NOT_FOUND'),{status:404});
   const published=path.resolve('.pages-output',rel),worldPublic=/^(content\/world\/|content\/civilization-atlas\/|config\/world-|data\/world-)/.test(rel)&&fs.existsSync(published)&&fs.existsSync(full)&&sha(fs.readFileSync(published))===sha(fs.readFileSync(full));
   if(!full.startsWith(root)||rel.startsWith('.')||!(worldPublic||rel==='world/index.html'||rel==='tools/review/subject-profile-r1/boot.js'||rel==='content/customer-experience-rebuild/authority/customer-visual-asset-registry-v4.json'||(/^(assets\/|reality\/|perspectives\/profile\/|content\/production-closure\/live-customer-commercial-convergence\/subject-profile-r1\/)/.test(rel)))||!['.html','.js','.css','.svg','.webp','.png','.json'].includes(path.extname(full)))throw Object.assign(Error('NOT_FOUND'),{status:404});
   if(!fs.realpathSync(full).startsWith(fs.realpathSync(process.cwd())+path.sep))throw Object.assign(Error('NOT_FOUND'),{status:404});
   let content=fs.readFileSync(rel==='assets/customer-ui/js/surfaces/subject-workspace-r1.js'?'.tmp/subject-profile-r1/build/subject-browser.js':full);if(rel==='reality/index.html')content=Buffer.from(content.toString().replace('</body>','<script type="module" src="/tools/review/subject-profile-r1/boot.js"></script></body>'));
   answer=new Response(content,{headers:{'Cache-Control':'no-store','Content-Type':({'.js':'text/javascript','.css':'text/css','.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.webp':'image/webp'}[path.extname(full)]||'application/octet-stream')}});
  }
 }catch(e){answer=json({ok:false,code:e.code||e.message||'LOCAL_ERROR'},e.status||400);}
 logs.push({path:u.pathname,method:req.method,status:answer.status});fs.writeFileSync(out+'/REQUESTS.json',JSON.stringify(logs));
 res.writeHead(answer.status,Object.fromEntries(answer.headers));res.end(Buffer.from(await answer.arrayBuffer()));
});
server.listen(Number(process.env.PHIOS_SUBJECT_QA_PORT||0),'127.0.0.1',()=>{const url='http://127.0.0.1:'+server.address().port;fs.writeFileSync(out+'/PREVIEW.json',JSON.stringify({url,reality:url+'/reality/',scope:'SYNTHETIC_ACCOUNTS_EXISTING_OWNERS',database:'.tmp/reality-navigation-continuity-r1/subject-profile-r1.sqlite',providerCalls:0,remoteWrites:0}));console.log(url);});
process.on('SIGINT',()=>server.close(()=>{owner.close();process.exit();}));
