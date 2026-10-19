// Synthetic account / real SQLite adapter. Never imports production credentials.
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';import {createHash} from 'node:crypto';
export function localAccount({databasePath=':memory:',privateDirectory=null}={}){
 const sql=new DatabaseSync(databasePath);sql.exec('CREATE TABLE IF NOT EXISTS users(user_id TEXT PRIMARY KEY); INSERT OR IGNORE INTO users VALUES (\'synthetic-owner\'),(\'synthetic-other\');');
 sql.exec(fs.readFileSync('db/migrations/0008_financial_will_encrypted_drafts.sql','utf8'));
 sql.exec(fs.readFileSync('db/migration-candidates/0019_financial_purpose_grants.sql','utf8'));
 sql.exec(fs.readFileSync('db/migrations/0017_report_generation_state.sql','utf8'));
 sql.exec(fs.readFileSync('db/migration-candidates/financial_preparation_grant_bindings.sql','utf8'));
 const db={prepare(query){return {bind(...args){const statement=sql.prepare(query);return {async first(){return statement.get(...args)||null;},async all(){return {results:statement.all(...args)};},async run(){const result=statement.run(...args);return {meta:{changes:Number(result.changes)}};}};}};},async batch(statements){sql.exec('BEGIN');try{const values=[];for(const statement of statements)values.push(await statement.run());sql.exec('COMMIT');return values;}catch(e){sql.exec('ROLLBACK');throw e;}}};
 const env={RUNTIME_DB:db,FINANCIAL_WILL_DRAFT_ENCRYPTION_KEY:'a'.repeat(64),ASSETS:{async fetch(request){const path=new URL(request.url).pathname;if(!path.startsWith('/content/')||path.includes('..'))return new Response(null,{status:404});return new Response(fs.readFileSync('.'+path),{headers:{'content-type':'application/json'}});}}};
 const objects=new Map();env.PHIOS_ENVIRONMENT='local-test';env.PRIVATE_REPORTS={async put(k,v){objects.set(k,String(v));},async get(k){return objects.has(k)?{text:async()=>objects.get(k)}:null;}};
 if(privateDirectory){fs.mkdirSync(privateDirectory,{recursive:true});const file=k=>path.join(privateDirectory,createHash('sha256').update(k).digest('hex')+'.json');env.PRIVATE_REPORTS={async put(k,v){fs.writeFileSync(file(k),String(v));},async get(k){return fs.existsSync(file(k))?{text:async()=>fs.readFileSync(file(k),'utf8')}:null;}};}
 function context(body,{owner='synthetic-owner',url='/api/account-financial-will-drafts',method='POST'}={}){return {env,data:{symbolicAccountIdentity:{userId:owner,providerId:'LOCAL_SYNTHETIC_ACCOUNT',verified:true,authenticated:true}},request:new Request('http://127.0.0.1'+url,{method,headers:{origin:'http://127.0.0.1','content-type':'application/json'},...(method==='POST'?{body:JSON.stringify(body)}:{})})};}
 return {sql,db,env,context};
}
