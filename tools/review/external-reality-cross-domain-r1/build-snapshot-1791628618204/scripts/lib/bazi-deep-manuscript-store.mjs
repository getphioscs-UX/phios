import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
// Durable local experiment adapter. An order runtime must inject its own durable
// transaction/lease implementation; this filesystem is NOT customer production.
export function createBaziFileStore(root){
 const filename=key=>path.join(root,createHash('sha256').update(key).digest('hex')+'.json');
 return {
  async get(key){try{return JSON.parse(await fs.readFile(filename(key),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}},
  async put(key,value){await fs.mkdir(root,{recursive:true});const file=filename(key),tmp=file+'.'+randomUUID()+'.tmp';await fs.writeFile(tmp,JSON.stringify(value,null,2));await fs.rename(tmp,file);},
  async putIfAbsent(key,value){await fs.mkdir(root,{recursive:true});try{await fs.writeFile(filename(key),JSON.stringify(value,null,2),{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;const prev=JSON.parse(await fs.readFile(filename(key),'utf8'));if(prev.digest!==value.digest)throw Error('BDM_IMMUTABLE_STORE_CONFLICT');}},
  async withLock(key,fn){await fs.mkdir(root,{recursive:true});const lock=filename(key)+'.lock';try{await fs.mkdir(lock);}catch(e){if(e.code==='EEXIST')throw Error('BDM_GENERATION_ALREADY_LOCKED');throw e;}try{return await fn();}finally{await fs.rm(lock,{recursive:true,force:true});}}
 };
}
