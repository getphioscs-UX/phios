import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
if(!process.argv.includes('--upload'))throw Error('Pass --upload only for the authorized restoration of original Book I figures.');
const dir='docs/assets/r2-public/',file=dir+'book-one-recovery-v1.json';
const recovery=JSON.parse(fs.readFileSync(file));
const base='https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/';
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const audit=JSON.parse(fs.readFileSync(dir+'r2-image-http-audit-2026-09-19.json'));
for(const row of recovery.rows){
 const bytes=fs.readFileSync(row.file);if(digest(bytes)!==row.sha256)throw Error('Recovered bytes changed');
 const url=base+row.key;
 let response=await fetch(url,{signal:AbortSignal.timeout(30000)});
 if(response.ok){if(digest(Buffer.from(await response.arrayBuffer()))!==row.sha256)throw Error('Existing different object; refusing overwrite '+row.key);}
 else{
  if(response.status!==404)throw Error(`Cannot establish missing object ${row.key}: ${response.status}`);
  execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','r2','object','put','phios-public-assets/'+row.key,'--file',row.file,'--content-type','image/webp','--remote'],{stdio:'inherit',timeout:120000});
 }
 response=await fetch(url+'?restoration='+row.sha256.slice(0,12),{signal:AbortSignal.timeout(30000)});
 if(!response.ok||digest(Buffer.from(await response.arrayBuffer()))!==row.sha256)throw Error('Public original verification failed '+row.key);
 row.status='PUBLIC_ORIGINAL_BYTES_VERIFIED';row.verifiedAt=new Date().toISOString();row.url=url;
 const evidence={key:row.key,size:row.bytes,url,httpStatus:200,mime:'image/webp',httpImagePass:true,observedAt:row.verifiedAt,sha256:row.sha256,source:'Restored original Git bytes; public GET hash verified'};
 const index=audit.results.findIndex(r=>r.key===row.key);if(index<0)audit.results.push(evidence);else audit.results[index]=evidence;
 fs.writeFileSync(file,JSON.stringify(recovery,null,2)+'\n');
 console.log('VERIFIED ORIGINAL',row.number);
}
recovery.status='11_ORIGINALS_RESTORED_AND_PUBLICLY_VERIFIED_4E_MISSING';
fs.writeFileSync(file,JSON.stringify(recovery,null,2)+'\n');
audit.total=audit.results.length;audit.httpImagePass=audit.results.filter(r=>r.httpImagePass).length;audit.latestIncrementalCheck=new Date().toISOString();
fs.writeFileSync(dir+'r2-image-http-audit-2026-09-19.json',JSON.stringify(audit,null,2)+'\n');
const samplesPath='content/web-production/registries/book-public-samples-v1.json',samples=JSON.parse(fs.readFileSync(samplesPath));
for(const figure of samples.books[0].figures){if(recovery.rows.some(r=>r.number===figure.number&&r.status==='PUBLIC_ORIGINAL_BYTES_VERIFIED'))figure.deliveryState='VERIFIED_PUBLIC_IMAGE';}
samples.bookOneRecoveryEvidence=file;
fs.writeFileSync(samplesPath,JSON.stringify(samples,null,2)+'\n');
