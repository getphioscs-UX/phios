import fs from 'node:fs';import path from 'node:path';import {randomUUID} from 'node:crypto';
const transient=new Set(['EPERM','EACCES','EBUSY','UNKNOWN']);
export function acquireGeneratedWriter(root,scope){
 const directory=path.join(root,'.tmp','generated-writers');fs.mkdirSync(directory,{recursive:true});
 const lock=path.join(directory,scope+'.lock'),token=randomUUID();let fd;
 try{fd=fs.openSync(lock,'wx');}catch(error){if(error.code==='EEXIST')throw Object.assign(Error('GENERATED_WRITER_BUSY:'+scope),{code:'GENERATED_WRITER_BUSY',lock});throw error;}
 fs.writeFileSync(fd,JSON.stringify({pid:process.pid,token,scope,at:new Date().toISOString()}));let released=false;
 const release=()=>{if(released)return;released=true;fs.closeSync(fd);if(JSON.parse(fs.readFileSync(lock,'utf8')).token!==token)throw Error('GENERATED_WRITER_OWNER_CHANGED');fs.unlinkSync(lock);};process.once('exit',release);return {release};
}
// Generation content is checked before writing; unchanged bytes never acquire a
// destination write handle. Atomic replacement exposes no partially written JSON.
export function writeGeneratedFile(file,content,{io=fs,pause=ms=>Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms),maxAttempts=3}={}){
 const bytes=Buffer.from(content);if(io.existsSync(file)&&io.readFileSync(file).equals(bytes))return {state:'UNCHANGED',attempts:0};
 io.mkdirSync(path.dirname(file),{recursive:true});const temporary=file+'.generated-'+process.pid+'-'+randomUUID()+'.tmp';let attempts=0;
 try{for(;attempts<maxAttempts;attempts++){try{io.writeFileSync(temporary,bytes,{flag:'wx'});io.renameSync(temporary,file);return {state:'REPLACED_ATOMICALLY',attempts:attempts+1};}catch(error){if(io.existsSync(temporary))io.unlinkSync(temporary);if(!transient.has(error.code)||attempts+1===maxAttempts)throw Object.assign(error,{generatedTarget:file,generatedStage:'ATOMIC_REPLACE',generatedAttempts:attempts+1});pause(75*(attempts+1));}}}finally{if(io.existsSync(temporary))io.unlinkSync(temporary);}
}
