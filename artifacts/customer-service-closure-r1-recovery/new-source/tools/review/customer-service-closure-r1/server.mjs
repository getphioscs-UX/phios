import {draftApi as financialWillDraftApi} from '../../../functions/account/financial-will-draft-store.js';
import * as financialReality from '../../../functions/api/customer-financial-reality.js';
import * as estatePlanning from '../../../functions/api/customer-estate-planning.js';
import {createLocalWorldRevalidator} from './world-revalidation-adapter.mjs';
import {answerWorldSession} from '../../../functions/customer-projection/ric-world-session.js';
import * as worldObservations from '../../../functions/api/world-observations.js';
import * as worldExplanation from '../../../functions/api/world-question-explanation.js';
import * as navigationHandoff from '../../../functions/api/customer-navigation-handoff.js';
import {persistentPrivateReportsQa} from '../../../scripts/lib/persistent-private-reports-qa.mjs';
import {createWorldR4Engine} from '../world-ux-r1/world-r4/engine.mjs';
import {createWorldR4LocalExtension} from '../world-ux-r1/world-r4/server.mjs';
// Local synthetic integration only. Never imported by Pages/production.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {setup,identity} from '../personal-evidence-r1/evidence-system-r1/local-test.mjs';
import {openLocalOwner} from '../reality-navigation-continuity-r1/local-owner.mjs';
import * as profile from '../../../functions/api/profile-progressive.js';
import * as personal from '../../../functions/api/customer-personal-reality.js';
import * as hd from '../../../functions/api/customer-hd-chart-preview.js';
import * as search from '../../../functions/api/location-search.js';
import * as resolve from '../../../functions/api/location-resolve.js';
import * as current from '../../../functions/api/customer-current-reality.js';
import {profileEvidenceApi} from '../../../functions/account/profile-evidence-store.js';
import * as handoff from '../../../functions/api/customer-reality-handoff.js';
import * as reality from '../../../functions/api/customer-my-reality.js';
import * as network from '../../../functions/api/profile-context-network.js';
import * as relationship from '../../../functions/api/customer-relationship-intake.js';
import {appointmentRequestApi} from '../../../functions/professional/appointments/appointment-request-store.js';
const root=process.cwd(),out=path.resolve('.tmp/customer-service-closure-r1');fs.mkdirSync(out,{recursive:true});
const store=await setup(path.join(out,'profile.sqlite'));
// Existing schema, isolated file only. No production migration or second account store.
store.sql.exec(fs.readFileSync('db/migrations/0012_report_context_admission.sql','utf8'));
store.sql.exec(fs.readFileSync('db/migrations/0008_financial_will_encrypted_drafts.sql','utf8'));
store.env.FINANCIAL_WILL_DRAFT_ENCRYPTION_KEY='52'.repeat(32); // Synthetic local key, never a production credential.

store.env.PHIOS_ENVIRONMENT='local';store.env.STRIPE_ENVIRONMENT='QA';
store.env.APPOINTMENT_REQUEST_ENCRYPTION_KEY='synthetic-only-appointment-key-32-characters';
store.env.PHIOS_HD_INTERNAL_CONFIRMATION_LOCAL='true';
store.env.PHIOS_GEOCODING_SEARCH_ENDPOINT='https://geocoding-qa.example.invalid/search';store.env.PHIOS_GEOCODING_LOOKUP_ENDPOINT='https://geocoding-qa.example.invalid/lookup';store.env.PHIOS_TIMEZONE_ENDPOINT='https://geocoding-qa.example.invalid/timezone';
store.env.PHIOS_CANONICAL_NAVIGATION_HANDOFF_ENABLED='true';store.env.REPORT_CONTEXT_ENCRYPTION_KEY='11'.repeat(32);store.env.PRIVATE_REPORTS=persistentPrivateReportsQa(path.join(out,'private-objects'));
const sharedReadRoot=path.resolve(root,'../..'),worldReadManifest=new Map();
const worldEngine=createWorldR4Engine({readFile:(file,...options)=>{requireLocalWorldPath(file);const full=path.resolve(sharedReadRoot,file),bytes=fs.readFileSync(full);worldReadManifest.set(file,{path:full,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});return options.length?bytes.toString(typeof options[0]==='string'?options[0]:options[0]?.encoding||'utf8'):bytes;}});
function requireLocalWorldPath(file){if(!/^(?:\.tmp\/world-r4\/|tools\/review\/world-ux-r1\/world-r4\/|content\/world\/)/.test(String(file)))throw Error('WORLD_SOURCE_READ_SCOPE');}
fs.writeFileSync(out+'/WORLD-SOURCE-READ-MANIFEST.json',JSON.stringify([...worldReadManifest.values()]));
const sourceStates=new Map(),sha=s=>createHash('sha256').update(s).digest('hex');
const owner=await openLocalOwner('.tmp/reality-navigation-continuity-r1/customer-service-closure.sqlite',{validateEvidence:source=>source.profileObjectId?{state:sourceStates.get(source.sourceRef)===source.sourceVersion?'VALID':'SOURCE_RECHECK_REQUIRED'}:worldEngine.validateEvidence(source)});
let outboundAttempts=0,offlineGeoFixtureRequests=0,localPolicyReads=0;const logs=[];
globalThis.fetch=async(input,init={})=>{const u=new URL(input instanceof Request?input.url:String(input));const method=input instanceof Request?input.method:(init.method||'GET');
 if(u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname)&&u.pathname==='/content/financial/analysis-runtime/policies/financial-analysis-policy-set-base-v1.json'&&!u.search&&method==='GET'){const rel=u.pathname.slice(1),bytes=fs.readFileSync(path.resolve(root,rel));localPolicyReads++;fs.writeFileSync(out+'/LOCAL-POLICY-READS.json',JSON.stringify({path:rel,sha256:sha(bytes),reads:localPolicyReads,scope:'EXACT_PACKAGED_PUBLIC_POLICY_READ_NO_NETWORK_OR_REPLACEMENT'}));return new Response(bytes,{headers:{'content-type':'application/json'}});}
 if(u.hostname==='geocoding-qa.example.invalid'){
 offlineGeoFixtureRequests++;const row={osm_type:'node',osm_id:999999999999,name:'Synthetic QA Singapore',display_name:'Synthetic QA Singapore — offline test fixture',lat:'1.3521',lon:'103.8198',address:{city:'Synthetic QA Singapore',country:'Singapore (QA fixture)',country_code:'sg'},namedetails:{'name:en':'Synthetic QA Singapore','name:zh':'合成QA新加坡'}};
 if(u.pathname==='/timezone')return Response.json({timeZone:'Asia/Singapore',fixture:true});if(u.pathname==='/search')return Response.json(/synthetic|合成|QA/i.test(u.searchParams.get('q')||'')?[row]:[]);if(u.pathname==='/lookup')return Response.json(u.searchParams.get('osm_ids')==='N999999999999'?[row]:[]);
 }outboundAttempts++;throw Error('OUTBOUND_NOT_AUTHORIZED');};
const publicAssets={fetch:async request=>{const rel=new URL(request.url).pathname.slice(1),file=path.resolve(root,rel);if(!rel.startsWith('content/knowledge/public/')||!file.startsWith(path.resolve(root,'content/knowledge/public')+path.sep)||!fs.existsSync(file))return new Response(null,{status:404});return new Response(fs.readFileSync(file),{headers:{'content-type':'application/json'}});}};
store.env.ASSETS=publicAssets;store.env.PHIOS_WORLD_EXPLANATION_LOCAL_ENABLED='true';store.env.PHIOS_WORLD_R4_LOCAL_ENABLED='true';store.env.WORLD_R4_READ=worldEngine.query;
const worldFetch=async(url,options={})=>{const u=new URL(url,'http://local'),request=new Request('http://local'+u.pathname+u.search,options);if(u.pathname==='/api/world-observations')return worldObservations.onRequest({request,env:store.env});if(u.pathname==='/api/world-question-explanation')return worldExplanation.onRequestPost({request,env:store.env});return new Response(null,{status:503});};
const revalidationFile='content/production-closure/live-customer-commercial-convergence/customer-service-closure-r1/WORLD-PUBLIC-REVALIDATION.json';const revalidationBytes=fs.existsSync(revalidationFile)?fs.readFileSync(revalidationFile):null;const resolveSourceRevalidation=createLocalWorldRevalidator(worldEngine,revalidationBytes?JSON.parse(revalidationBytes):null,revalidationBytes?sha(revalidationBytes):null);
const worldExtension=createWorldR4LocalExtension({engine:worldEngine,cookieName:'phios_closure_qa',resolveSourceRevalidation});

const json=(x,status=200)=>Response.json(x,{status,headers:{'cache-control':'private, no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'}});
const requireIt=(x,code,status=400)=>{if(!x)throw Object.assign(Error(code),{code,status});};
function profileContext(url,user){return {request:new Request(url),env:store.env,data:identity(user)};}
async function readProfile(origin,user,id){const response=await profileEvidenceApi(profileContext(origin+'/api/account-profile-evidence?id='+encodeURIComponent(id),user));const value=await response.json();requireIt(response.ok,value.code||'PROFILE_SOURCE_UNAVAILABLE',response.status);return value;}
function sourceFor(saved,signal){const version=sha(JSON.stringify([saved.view.profileViewId,saved.accountObject.version,signal]));return {sourceRef:'PROFILE:'+saved.accountObject.objectId+'#'+signal.signalRef,sourceVersion:version,validUntil:saved.accountObject.expiresAt,profileObjectId:saved.accountObject.objectId,signalRef:signal.signalRef,sourceClass:'SELF_REPORTED_ASSESSMENT',statement:JSON.stringify({sourceClass:signal.sourceClass,assessmentDate:signal.assessmentDate,domainId:signal.domainId,value:signal.nativeValue??signal.value,realityFact:false}),geography:'NOT_APPLICABLE',period:signal.assessmentDate,applicabilityReason:'Explicitly selected by the account owner; not a current personal fact'};}
async function reopen(origin,user,id){const initial=owner.read(user,id);for(const r of initial.case.records){const source=r.source_reference;if(!source?.profileObjectId)continue;sourceStates.delete(source.sourceRef);try{const saved=await readProfile(origin,user,source.profileObjectId),signal=saved.view.signalCards.find(s=>s.signalRef===source.signalRef);if(signal){const current=sourceFor(saved,signal);sourceStates.set(current.sourceRef,current.sourceVersion);}}catch{/* Exclude unavailable/expired/changed sources. */}}return owner.read(user,id);}
const apis={'/api/customer-financial-reality':financialReality,'/api/customer-estate-planning':estatePlanning,'/api/customer-navigation-handoff':navigationHandoff,'/api/world-observations':worldObservations,'/api/world-question-explanation':worldExplanation,'/api/customer-personal-reality':personal,'/api/customer-hd-chart-preview':hd,'/api/location-search':search,'/api/location-resolve':resolve,'/api/customer-current-reality':current,'/api/profile-progressive':profile,'/api/customer-reality-handoff':handoff,'/api/customer-my-reality':reality,'/api/profile-context-network':network,'/api/customer-relationship-intake':relationship};
const server=http.createServer(async(req,res)=>{let answer;try{
 const origin='http://'+req.headers.host,url=new URL(req.url,origin);
 requireIt(['127.0.0.1','localhost'].includes(url.hostname),'LOOPBACK_ONLY',403);
 const token=/phios_closure_qa=([^;]+)/.exec(req.headers.cookie||'')?.[1];let user=null;try{user=await owner.identity(token);}catch{}
 const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;requireIt(bytes<=200000,'REQUEST_TOO_LARGE',413);chunks.push(chunk);}const raw=Buffer.concat(chunks);
 const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:raw}:{})}),ctx={request,env:store.env,data:user?identity(user):{}};
 if(url.pathname.startsWith('/tools/review/world-ux-r1/world-r4/')||url.pathname.startsWith('/__local/world-r4')||url.pathname==='/api/world-observations'&&url.searchParams.get('dataset')==='MY_CPI'){const handled=await worldExtension({req,u:url,owner,origin,rawBody:raw.toString(),send:(status,data,headers={})=>{answer=new Response(typeof data==='string'||Buffer.isBuffer(data)?data:JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store',...headers}});}});requireIt(handled,'LOCAL_ROUTE_UNAVAILABLE',404);}
 else if(url.pathname.startsWith('/__qa/login/')){requireIt(req.method==='POST'&&req.headers.origin===origin,'ORIGIN_REQUIRED',403);const account=url.pathname.split('/').at(-1);requireIt(['A','B'].includes(account),'SYNTHETIC_ACCOUNT_REQUIRED');const session=await owner.login(account);const verifiedUserId=await owner.identity(session),timestamp=Date.now();
 // Mirror the existing oidc-auth.js Account projection, using the same verified canonical ID. No second identity or paid grant.
 store.sql.prepare("INSERT OR IGNORE INTO users(user_id,email,display_name,role,status,created_at,updated_at) VALUES(?,NULL,NULL,'explorer','active',?,?)").run(verifiedUserId,timestamp,timestamp);answer=json({ok:true,scope:'LOCAL_SYNTHETIC_ONLY'});answer.headers.set('set-cookie','phios_closure_qa='+session+'; HttpOnly; SameSite=Strict; Path=/');}
 else if(url.pathname==='/__qa/logout'){requireIt(req.method==='POST'&&req.headers.origin===origin,'ORIGIN_REQUIRED',403);const revoked=await owner.logout(token);requireIt(revoked.ok,'LOCAL_LOGOUT_NOT_COMPLETED',503);answer=json({ok:true,scope:'LOCAL_SYNTHETIC_NATIVE_SESSION_REVOKED'});answer.headers.set('set-cookie','phios_closure_qa=; Max-Age=0; HttpOnly; SameSite=Strict; Path=/');}
 else if(url.pathname==='/__qa/shutdown'){requireIt(req.method==='POST'&&req.headers.origin===origin,'ORIGIN_REQUIRED',403);answer=json({ok:true});res.once('finish',()=>server.close(()=>{store.sql.close();owner.close();process.exit();}));}
 else if(url.pathname==='/__qa/metrics')answer=json({outboundAttempts,offlineGeoFixtureRequests,localPolicyReads,worldObservationsCount:worldEngine.observations.length,productionWrites:0,logs});
 else if(url.pathname==='/api/auth/session'){const native=await owner.session(token),value=await native.json();answer=json({...value,providerConfigured:false,scope:'LOCAL_SYNTHETIC_ONLY'});}
 else if(url.pathname.startsWith('/__local/continuity')){
  requireIt(user,'AUTH_REQUIRED',401);
  if(req.method==='GET'){const id=url.searchParams.get('caseId');answer=json(id?await reopen(origin,user,id):{items:owner.list(user)});}
  else{requireIt(req.headers.origin===origin,'AUTH_ORIGIN_REQUIRED',403);const body=JSON.parse(raw);
   if(url.pathname.endsWith('/world')){requireIt(body.consent===true,'SOURCE_LOOKUP_CONSENT_REQUIRED',403);const result=await answerWorldSession({question:body.question,locale:body.locale==='zh-Hans'?'zh-Hans':'en',fetcher:worldFetch});answer=json({answer:result.answer,sources:Object.values(result.sources),permissions:result.permissions,version:result.version,providerCalls:0,persisted:false,saveState:'EXISTING_SOURCE_PERMISSION_SESSION_ONLY'});}
   else if(url.pathname.endsWith('/profile')){requireIt(body.consent===true&&Array.isArray(body.signalRefs)&&body.signalRefs.length===1,'ONE_EXPLICIT_SOURCE_REQUIRED',403);const saved=await readProfile(origin,user,body.objectId),signal=saved.view.signalCards.find(s=>s.signalRef===body.signalRefs[0]);requireIt(signal,'PROFILE_SELECTION_INVALID');const source=sourceFor(saved,signal);sourceStates.set(source.sourceRef,source.sourceVersion);answer=json(owner.update(user,body.caseId,{action:'record',kind:'EVIDENCE',content:source.statement,consent:true,expectedVersion:body.expectedVersion,requestId:body.requestId},{resolvedEvidence:source}));}
   else answer=json(body.action==='create'?owner.create(user,body):owner.update(user,body.caseId,body));
  }
 }
 else if(url.pathname==='/api/account-profile-evidence')answer=await profileEvidenceApi(ctx);
 else if(url.pathname==='/api/account-appointment-requests')answer=await appointmentRequestApi(ctx);
 else if(url.pathname==='/api/account-financial-will-drafts')answer=await financialWillDraftApi(ctx);
 else if(apis[url.pathname]){const fn=apis[url.pathname][req.method==='GET'?'onRequestGet':'onRequestPost'];answer=fn?await fn(ctx):json({ok:false,code:'METHOD_NOT_ALLOWED'},405);}
 else if(url.pathname.startsWith('/api/'))answer=json({ok:false,code:'QA_DEPENDENCY_NOT_CONNECTED'},503);
 else{let rel=decodeURIComponent(url.pathname).replace(/^\//,'');if(!rel)rel='perspectives/profile/';if(rel.endsWith('/'))rel+='index.html';const file=path.resolve(root,rel);requireIt(file.startsWith(root+path.sep)&&!rel.startsWith('.')&&!/\.(sqlite|pdf|zip|mjs|py|md)$/i.test(file)&&!/(^|\/)(_source-material|private|source)\//.test(rel),'NOT_FOUND',404);requireIt(fs.existsSync(file)&&fs.statSync(file).isFile(),'NOT_FOUND',404);let content=fs.readFileSync(file);const reviewed=rel==='tools/review/customer-service-closure-r1/boot.js'||rel.startsWith('content/production-closure/live-customer-commercial-convergence/customer-service-closure-r1/');requireIt(reviewed||fs.existsSync(path.resolve(root,'.pages-output',rel)),'NOT_IN_PUBLICATION_SCOPE',404);if(rel==='world/index.html')content=Buffer.from(content.toString().replace('</body>','<script type="module" src="/tools/review/world-ux-r1/world-r4/boot.mjs"></script></body>'));if(file.endsWith('.html')&&/^(perspectives\/profile|reality\/)/.test(rel))content=Buffer.from(content.toString().replace('</body>','<script type="module" src="/tools/review/customer-service-closure-r1/boot.js"></script></body>'));answer=new Response(content,{headers:{'content-type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.json':'application/json'}[path.extname(file)]||'application/octet-stream'),'cache-control':'no-store'}});}
 }catch(error){answer=json({ok:false,code:error.code||'LOCAL_REQUEST_FAILED'},error.status||400);}
 logs.push({path:new URL(req.url,'http://localhost').pathname,method:req.method,status:answer.status});res.writeHead(answer.status,Object.fromEntries(answer.headers));res.end(Buffer.from(await answer.arrayBuffer()));
});
server.listen(Number(process.env.PHIOS_CUSTOMER_QA_PORT||0),'127.0.0.1',()=>{const url='http://127.0.0.1:'+server.address().port;fs.writeFileSync(out+'/PREVIEW.json',JSON.stringify({url,profile:url+'/perspectives/profile/',reality:url+'/reality/',scope:'LOCAL_SYNTHETIC_ONLY',providerCalls:0}));console.log(url);});
process.on('SIGINT',()=>server.close(()=>{store.sql.close();owner.close();process.exit();}));
