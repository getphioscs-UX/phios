import fs from 'node:fs';
import crypto from 'node:crypto';
import {requireDiskSpace} from '../../../scripts/lib/disk-space-guard.mjs';
requireDiskSpace({estimatedBytes:160_000_000,label:'ECR flagship public asset read cache'});
const D='tools/review/ecr-flagship-visual-r1/',cache='.tmp/ecr-flagship-visual-r1/public-assets';fs.mkdirSync(cache,{recursive:true});
const data=JSON.parse(fs.readFileSync('assets/customer-ui/media/ecr-deep-r2/public-explorer.json')),p=JSON.parse(fs.readFileSync('assets/customer-ui/media/ecr-flagship-r1/presentation.json'));
const list=[...data.assets.map(a=>({id:a.cardId,objectKey:a.objectKey})),...p.preview.map(a=>({id:'ECR:'+a.pageId,objectKey:a.objectKey,expectedSHA256:a.sha256}))],rows=[];
for(const a of list){
 const url='https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/'+a.objectKey,file=cache+'/'+a.objectKey.split('/').at(-1);
 try{
  let b,status=200,origin='EXISTING_LOCAL_CURRENT_CACHE';
  if(fs.existsSync(file))b=fs.readFileSync(file);else{const r=await fetch(url,{signal:AbortSignal.timeout(20000)});status=r.status;if(status===429){rows.push({...a,url,httpStatus:429,status:'RATE_LIMIT_STOP'});break;}if(!r.ok)throw Error('HTTP_'+status);b=Buffer.from(await r.arrayBuffer());fs.writeFileSync(file,b);origin='PUBLIC_GET';}
  const sha256=crypto.createHash('sha256').update(b).digest('hex');if(a.expectedSHA256&&a.expectedSHA256!==sha256)throw Error('REGISTERED_ASSET_BYTE_DRIFT');
  rows.push({...a,url,file,httpStatus:status,sha256,bytes:b.length,origin,observedAt:new Date().toISOString(),status:a.expectedSHA256?'REGISTERED_SHA_MATCH':'PUBLIC_BYTES_OBSERVED_NO_REGISTRY_BYTE_PIN'});
 }catch(e){rows.push({...a,url,status:'READ_UNVERIFIED',reason:e.message});}
 fs.writeFileSync(D+'PUBLIC-ASSET-READS.json',JSON.stringify({rows,managementAPIUsed:false,R2Writes:0,providerCalls:0},null,2));
 console.log(a.id,rows.at(-1).status);
}
