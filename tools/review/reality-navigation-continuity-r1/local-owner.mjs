// Development-only adapter onto existing runtime_entities/runtime_entries and OIDC.
// No D1 binding, remote fetch, migration registration or production handler.
import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {authApi,authenticate,SESSION_COOKIE} from '../../../functions/account/oidc-auth.js';
import {createContinuityCase,updateContinuityCase,buildContinuityContext,restoreContinuityCheckpoint} from '../../../functions/customer-projection/ric-navigation-continuity.js';
const need=(v,code,status=400)=>{if(!v)throw Object.assign(new Error(code),{code,status});};
export async function openLocalOwner(filename,{validateEvidence=null,clock=()=>new Date().toISOString()}={}){
 const allowed=path.resolve('.tmp/reality-navigation-continuity-r1');const full=path.resolve(filename);need(full.startsWith(allowed+path.sep),'LOCAL_DB_PATH_REQUIRED');fs.mkdirSync(allowed,{recursive:true});
 const sql=new DatabaseSync(full);sql.exec('PRAGMA busy_timeout=2000');
 for(const file of ['db/migrations/0001_runtime.sql','db/migrations/0007_account_oidc_sessions.sql']){
  // Resolve the actual first migration filename rather than assuming an old alias.
  const actual=fs.existsSync(file)?file:'db/migrations/'+fs.readdirSync('db/migrations').find(n=>n.startsWith('0001')&&n.endsWith('.sql'));
  sql.exec(fs.readFileSync(actual,'utf8'));
 }
 const db={prepare(q){let values=[];return {bind(...v){values=v;return this;},async first(){return sql.prepare(q).get(...values)||null;},async run(){return sql.prepare(q).run(...values);}};},async batch(rows){sql.exec('BEGIN');try{const out=[];for(const r of rows)out.push(await r.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}};
 const issuer='https://continuity-qa.example.invalid/',origin='https://continuity-local.example.invalid';
 const env={AUTH_PROVIDER:'auth0',AUTH_ISSUER:issuer,AUTH_CLIENT_ID:'continuity-local-fixture',AUTH_CLIENT_SECRET:'synthetic-only-no-remote-credential',AUTH_SESSION_SECRET:'synthetic-local-session-key-never-used-in-production',RUNTIME_DB:db};
 const {publicKey,privateKey}=await generateKeyPair('RS256');const publicJwk=await exportJWK(publicKey),keyId='local-'+createHash('sha256').update(JSON.stringify(publicJwk)).digest('hex').slice(0,16);const jwk={...publicJwk,kid:keyId,alg:'RS256',use:'sig'};
 const context=(pathname,headers={},fetcher)=>({env,request:new Request(origin+pathname,{headers}),fetch:fetcher});
 async function login(subject){
  need(['A','B'].includes(subject),'SYNTHETIC_ACCOUNT_ONLY');let nonce;
  const fetcher=async url=>{
   if(url===issuer+'.well-known/openid-configuration')return Response.json({issuer,authorization_endpoint:issuer+'authorize',token_endpoint:issuer+'token',jwks_uri:issuer+'jwks',id_token_signing_alg_values_supported:['RS256']});
   if(url===issuer+'jwks')return Response.json({keys:[jwk]});
   if(url===issuer+'token')return Response.json({id_token:await new SignJWT({nonce,email_verified:true}).setProtectedHeader({alg:'RS256',kid:keyId}).setIssuer(issuer).setAudience(env.AUTH_CLIENT_ID).setSubject('synthetic-'+subject).setIssuedAt().setExpirationTime('5m').sign(privateKey)});
   throw Error('REMOTE_AUTH_NOT_ALLOWED');
  };
  const a=await authApi(context('/api/auth/login',{},fetcher),'login');const u=new URL(a.headers.get('location'));nonce=u.searchParams.get('nonce');
  const b=await authApi(context('/api/auth/callback?code=synthetic&state='+encodeURIComponent(u.searchParams.get('state')),{cookie:a.headers.get('set-cookie').split(';')[0]},fetcher),'callback');
  need(b.status===302,'LOCAL_AUTH_FAILED');return b.headers.getSetCookie().find(c=>c.startsWith(SESSION_COOKIE+'=')).split(';')[0].slice(SESSION_COOKIE.length+1);
 }
 async function identity(token){const v=token?await authenticate(context('/api/continuity',{cookie:SESSION_COOKIE+'='+token})):null;need(v?.verified,'AUTH_REQUIRED',401);return v.userId;}
 function read(userId,caseId){const r=sql.prepare('SELECT entry_json FROM runtime_entries e JOIN runtime_entities t ON t.runtime_entity_id=e.runtime_entity_id WHERE e.runtime_entry_id=? AND t.owner_user_id=?').get(caseId,userId);need(r,'CASE_NOT_FOUND',404);return JSON.parse(r.entry_json);}
 function project(c,userId){const options={userId,at:clock(),validateEvidence};return {case:c,context:buildContinuityContext(c,options),restore:c.checkpoints.length?restoreContinuityCheckpoint(c,options):null,storage:'ISOLATED_LOCAL_SQLITE_EXISTING_RUNTIME_SCHEMA',syntheticIdentity:true};}
 function list(userId){return sql.prepare('SELECT e.runtime_entry_id,e.entry_json FROM runtime_entries e JOIN runtime_entities t ON t.runtime_entity_id=e.runtime_entity_id WHERE t.owner_user_id=? AND e.schema_version=? ORDER BY e.updated_at DESC').all(userId,'RIC-CONTINUITY-LOCAL-v1').map(r=>{const c=JSON.parse(r.entry_json);return {id:c.case_id,title:c.title,status:c.status,version:c.version};});}
 function create(userId,input){
  need(input.consent===true,'PERSISTENCE_CONSENT_REQUIRED',403);const c=createContinuityCase({...input,userId});c._requests=[];
  sql.exec('BEGIN');try{sql.prepare('INSERT INTO runtime_entities(runtime_entity_id,owner_user_id,entity_type,status,canonical_version,consent_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').run(c.case_id,userId,'REALITY_CASE','active',1,JSON.stringify({syntheticOnly:true,explicitSave:true}),c.created_at,c.updated_at);
  sql.prepare('INSERT INTO runtime_entries(runtime_entry_id,runtime_entity_id,schema_version,status,entry_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').run(c.case_id,c.case_id,c.schemaVersion,c.status,JSON.stringify(c),c.created_at,c.updated_at);sql.exec('COMMIT');}catch(e){sql.exec('ROLLBACK');throw e;}return project(c,userId);
 }
 function update(userId,caseId,input,{resolvedEvidence=null}={}){
  need(typeof input.requestId==='string'&&input.requestId.length<=100,'REQUEST_ID_REQUIRED');const c=read(userId,caseId);const hash=createHash('sha256').update(JSON.stringify(input)).digest('hex'),prior=c._requests.find(r=>r.id===input.requestId);
  if(prior){need(prior.hash===hash,'REQUEST_ID_CONFLICT',409);return {...project(c,userId),replayed:true};}
  // Evidence is deliberately not accepted from client claims. World is a read handoff.
  const n=updateContinuityCase(c,input,{userId,resolvedEvidence,at:clock(),validateEvidence});n._requests=[...c._requests,{id:input.requestId,hash}].slice(-256);
  const r=sql.prepare('UPDATE runtime_entries SET entry_json=?,status=?,updated_at=? WHERE runtime_entry_id=? AND entry_json=?').run(JSON.stringify(n),n.status,n.updated_at,caseId,JSON.stringify(c));need(r.changes===1,'VERSION_CONFLICT',409);return project(n,userId);
 }
 return {sql,login,identity,list,create,update,read:(u,c)=>project(read(u,c),u),close:()=>sql.close()};
}
