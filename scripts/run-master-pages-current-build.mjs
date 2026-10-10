import fs from 'node:fs';import {spawnSync} from 'node:child_process';
import {currentHead,buildInputIdentity,sha256} from './lib/master-build-identity.mjs';
const dir='content/production-closure/live-customer-commercial-convergence',startedAt=new Date().toISOString(),head=currentHead(),before=buildInputIdentity();
function writeGenerated(path,body){
 const temporary=path+'.'+process.pid+'.'+Date.now()+'.tmp';fs.writeFileSync(temporary,body,{flag:'wx'});
 for(let attempt=0;attempt<4;attempt++){try{fs.renameSync(temporary,path);return;}catch(error){if(attempt===3||!['UNKNOWN','EPERM','EBUSY','EACCES'].includes(error.code))throw error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,150*(attempt+1));}}
}
const run=spawnSync(process.execPath,['scripts/run-zero-cost-regression.mjs','build:pages'],{encoding:'utf8',maxBuffer:32*1024*1024});
const logPath=dir+'/OWNER-CORRECTION-PAGES-BUILD.log';writeGenerated(logPath,run.stdout+'\n'+run.stderr);
const after=buildInputIdentity(),endHead=currentHead(),stale=head!==endHead||before.digest!==after.digest;
const output=run.stdout+run.stderr,workerMatch=output.match(/Pages Worker: (\d+) bytes; gzip (\d+) bytes/);
const receipt={result:run.status===0&&!stale?'PASS':run.status===0?'BUILD_PASS_INPUT_CHANGED':'FAIL',command:'node scripts/run-zero-cost-regression.mjs build:pages',currentHead:endHead,evidenceCommit:head,buildAt:new Date().toISOString(),startedAt,exitCode:run.status,stale,inputBefore:before.digest,inputAfter:after.digest,inputScope:before.scope,inputFiles:after.files,buildReceipt:logPath,logSHA256:sha256(logPath),workerBytes:workerMatch?Number(workerMatch[1]):null,gzipBytes:workerMatch?Number(workerMatch[2]):null,providerCalls:0,deployed:false,liveCustomer:false};
const receiptPath=dir+'/MASTER-PAGES-CURRENT-RECEIPT.json';
for(let attempt=0;attempt<4;attempt++){
 try{
  if(fs.existsSync(receiptPath)){const prior=JSON.parse(fs.readFileSync(receiptPath,'utf8'));if(prior.startedAt>startedAt)throw Object.assign(new Error('NEWER_BUILD_RECEIPT_PRESENT'),{code:'NEWER_BUILD_RECEIPT_PRESENT'});}
  writeGenerated(receiptPath,JSON.stringify(receipt,null,2)+'\n');break;
 }catch(error){if(attempt===3||!['UNKNOWN','EPERM','EBUSY','EACCES'].includes(error.code))throw error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,150*(attempt+1));}
}
console.log(JSON.stringify({...receipt,inputFiles:receipt.inputFiles.length}));process.exitCode=run.status===0&&!stale?0:1;
