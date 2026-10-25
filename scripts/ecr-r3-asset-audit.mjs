import fs from 'node:fs';import crypto from 'node:crypto';
const out='tools/review/phi-configuration-deep-reading-r2-integrated/r3-author-led';
fs.mkdirSync(out+'/assets',{recursive:true});
const names=['RPT-ECR-P01-COVER-v1.webp','RPT-ECR-P02-METHOD-INTRO-v1.webp','RPT-ECR-P03-ORIGIN-v1.webp','RPT-ECR-P04-PHIOS-LENS-v1.webp','RPT-ECR-P05-HOW-TO-READ-v1.webp'];
const keys=['zh-Hans','en','bilingual'].flatMap(lang=>names.map(name=>({lang,name,key:`images/reports/ecr/editorial/${lang}/${name}`})));
const results=[];let next=0;
async function worker(){while(next<keys.length){const a=keys[next++];try{const r=await fetch('https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/'+a.key,{signal:AbortSignal.timeout(25000)}),b=Buffer.from(await r.arrayBuffer());const mime=r.headers.get('content-type'),valid=r.ok&&mime?.includes('image/webp')&&b.toString('ascii',8,12)==='WEBP';const file=`assets/${a.lang}-${a.name}`;if(valid)fs.writeFileSync(out+'/'+file,b);results.push({...a,file:valid?file:null,status:valid?'PASS_BYTES':'BLOCKED_OBJECT',http:r.status,mime,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex'),etag:r.headers.get('etag'),lastModified:r.headers.get('last-modified'),versionId:r.headers.get('x-amz-version-id'),visualApproval:'PENDING',editableSource:'NOT_YET_VERIFIED'});}catch(e){results.push({...a,status:'BLOCKED_NETWORK',reason:e.cause?.code||e.name});}}}
await Promise.all(Array.from({length:4},worker));results.sort((a,b)=>a.key.localeCompare(b.key));
fs.writeFileSync(out+'/asset-http-evidence.json',JSON.stringify({operation:'READ_ONLY_GET',providerCalls:0,r2Writes:0,results},null,2));
console.log(JSON.stringify({objects:results.length,passBytes:results.filter(x=>x.status==='PASS_BYTES').length,blocked:results.filter(x=>x.status!=='PASS_BYTES').length}));
