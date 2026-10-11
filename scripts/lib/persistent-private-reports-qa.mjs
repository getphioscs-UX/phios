import fs from 'node:fs';
import path from 'node:path';
import {randomBytes,createHash} from 'node:crypto';

// QA transport only. Object bytes remain immutable unless the caller explicitly puts.
export function persistentPrivateReportsQa(root){
 const absolute=path.resolve(root);fs.mkdirSync(absolute,{recursive:true});
 const objectPath=key=>{if(typeof key!=='string'||!key||key.split(/[\\/]/).includes('..'))throw Error('QA_OBJECT_KEY_UNSAFE');return path.join(absolute,createHash('sha256').update(key).digest('hex')+'.object');};
 return {async put(key,value,options={}){let bytes;if(typeof value==='string')bytes=Buffer.from(value);else if(value instanceof ArrayBuffer)bytes=Buffer.from(value);else if(ArrayBuffer.isView(value))bytes=Buffer.from(value.buffer,value.byteOffset,value.byteLength);else if(value?.arrayBuffer)bytes=Buffer.from(await value.arrayBuffer());else throw Error('QA_OBJECT_VALUE_UNSUPPORTED');const p=objectPath(key);fs.writeFileSync(p,bytes);if(Object.keys(options).length)fs.writeFileSync(p+'.metadata.json',JSON.stringify(options));},async get(key){const p=objectPath(key);if(!fs.existsSync(p))return null;const bytes=fs.readFileSync(p);return {async text(){return bytes.toString('utf8');},async json(){return JSON.parse(bytes.toString('utf8'));},async arrayBuffer(){return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);},size:bytes.length};}};
}
export function p7r3jStorage({create=false,rootPath='tmp/bazi-r2-p7r3j-r1'}={}){
 const root=path.resolve(rootPath),configPath=path.join(root,'qa-crypto.json');
 fs.mkdirSync(root,{recursive:true});
 fs.writeFileSync(path.join(root,'.gitignore'),'*\n');
 if(create){if(fs.existsSync(configPath)||fs.existsSync(path.join(root,'runtime.sqlite')))throw Error('P7R3J_EXISTING_STORE_DO_NOT_OVERWRITE');fs.writeFileSync(configPath,JSON.stringify({AUTH_SESSION_SECRET:randomBytes(32).toString('hex'),CANONICAL_PERSON_ENCRYPTION_KEY:randomBytes(32).toString('hex')}),{mode:0o600});}
 const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
 return {root,configPath,databasePath:path.join(root,'runtime.sqlite'),privateReportsRoot:path.join(root,'private-reports'),config,privateReports:persistentPrivateReportsQa(path.join(root,'private-reports'))};
}
