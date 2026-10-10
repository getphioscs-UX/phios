import fs from 'node:fs';import crypto from 'node:crypto';
const source='content/web-production/registries/client-visual-asset-registry-v1.8.json',registry=JSON.parse(fs.readFileSync(source));
const assets=registry.assets.filter(a=>!a.assetCode.startsWith('PIS-'));const results=[];
const base='https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev';
for(let i=0;i<assets.length;i+=6){await Promise.all(assets.slice(i,i+6).map(async a=>{
 const key=a.r2?.objectKey;if(!key){results.push({code:a.assetCode,state:'NO_OBJECT_KEY'});return}
 try{const response=await fetch(base+'/'+key.split('/').map(encodeURIComponent).join('/'),{signal:AbortSignal.timeout(45000)});const bytes=Buffer.from(await response.arrayBuffer());const isImage=(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')||/<svg\b/i.test(bytes.subarray(0,2048).toString())||bytes.subarray(1,4).toString()==='PNG'||bytes.subarray(0,2).equals(Buffer.from([255,216]));results.push({code:a.assetCode,key,httpStatus:response.status,bytes:bytes.length,imageSignature:isImage,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),state:response.ok&&isImage?'REMOTE_GET_VERIFIED':'NOT_ACTIVATABLE'});}catch(e){results.push({code:a.assetCode,key,state:'UNVERIFIED_NETWORK_ERROR',error:e.message})}
 }));console.log(`Checked ${results.length}/${assets.length} existing visual objects.`)}
results.sort((a,b)=>a.code.localeCompare(b.code));fs.writeFileSync('docs/public-index-successor/pis-r1-inherited-remote-evidence-v1.json',JSON.stringify({scope:'READ_ONLY_PUBLIC_R2_BYTES_NOT_HUMAN_OR_PRODUCTION_ACCEPTANCE',source,verifiedAt:new Date().toISOString(),results},null,2)+'\n');console.log(results.reduce((r,x)=>(r[x.state]=(r[x.state]||0)+1,r),{}));
