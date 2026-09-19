import fs from 'node:fs';
import {createHash} from 'node:crypto';

const dir='docs/assets/r2-public/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const inventory=read(dir+'r2-bucket-inventory-2026-09-19.json');
if(!inventory.complete)throw Error('Full bucket inventory required');
const base='https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/';
const images=inventory.objects.filter(o=>/\.(webp|png|jpe?g|svg|gif|avif)$/i.test(o.key));
const results=[];let cursor=0;
await Promise.all(Array.from({length:8},async()=>{while(cursor<images.length){
 const object=images[cursor++],url=base+object.key.split('/').map(encodeURIComponent).join('/');
 const row={...object,url};
 for(let attempt=0;attempt<2;attempt++)try{
  const response=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(20000)});
  row.httpStatus=response.status;row.mime=response.headers.get('content-type');row.httpImagePass=response.ok&&!!row.mime?.startsWith('image/');
  row.observedAt=new Date().toISOString();if(row.httpImagePass)break;
 }catch(error){row.httpImagePass=false;row.error=error.message;}
 results.push(row);if(results.length%100===0)console.log(`Verified ${results.length}/${images.length}`);
}}));
results.sort((a,b)=>a.key.localeCompare(b.key));
fs.writeFileSync(dir+'r2-image-http-audit-2026-09-19.json',JSON.stringify({observedAt:new Date().toISOString(),inventory:dir+'r2-bucket-inventory-2026-09-19.json',total:results.length,httpImagePass:results.filter(r=>r.httpImagePass).length,results},null,2)+'\n');

// Repair only previously unresolved Atlas rows, using keys from the complete bucket listing.
const auditPath='content/civilization-atlas/maintenance/visual-activation-60247ff/r2-object-audit-v1.json';
const audit=read(auditPath);
for(const row of audit.rows.filter(r=>r.result!=='VERIFIED_WEBP')){
 const actual=results.find(r=>r.key===row.candidateKey);
 row.recheckedAt=new Date().toISOString();row.inventoryEvidence=dir+'r2-bucket-inventory-2026-09-19.json';
 if(!actual){row.bucketObjectPresent=false;continue;}
 if(!actual.httpImagePass)continue;
 const response=await fetch(actual.url,{signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('Atlas GET failed: '+row.assetId);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes.subarray(0,4).toString()!=='RIFF'||bytes.subarray(8,12).toString()!=='WEBP')throw Error('Invalid WebP: '+row.assetId);
 row.previousObservation={result:row.result,httpStatus:row.httpStatus};
 Object.assign(row,{bucketObjectPresent:true,httpStatus:response.status,contentType:response.headers.get('content-type'),bytes:bytes.length,webpSignature:true,result:'VERIFIED_WEBP',sha256:createHash('sha256').update(bytes).digest('hex'),bucketKey:actual.key,publicUrl:actual.url});
}
audit.recheckedAt=new Date().toISOString();audit.currentBucketInventory=dir+'r2-bucket-inventory-2026-09-19.json';
fs.writeFileSync(auditPath,JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({images:results.length,passed:results.filter(r=>r.httpImagePass).length,failed:results.filter(r=>!r.httpImagePass).map(r=>r.key),atlasUnresolved:audit.rows.filter(r=>r.result!=='VERIFIED_WEBP').map(r=>r.assetId)}));
