import fs from 'node:fs';
const url='https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/hero/books/PHIOS-HERO-BOOK-5-REALITY-NAVIGATION-v1.webp';
const startedAt=new Date().toISOString();let result;
try{const r=await fetch(url,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(15000)});result={url,method:'HEAD',status:r.status,contentType:r.headers.get('content-type'),location:r.headers.get('location'),timestamp:startedAt,result:r.status===200?'HTTP_AVAILABLE_DECODE_NOT_YET_VERIFIED':r.status===404?'MISSING_ASSET':'EXTERNAL_HTTP_FAILURE',paidApi:false,externalWrite:false};}catch(e){result={url,method:'HEAD',timestamp:startedAt,result:'TEST_ENVIRONMENT_NETWORK_LIMITATION',error:e.name,paidApi:false,externalWrite:false};}
fs.writeFileSync('content/production-closure/batch02/asset-http-probe.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
