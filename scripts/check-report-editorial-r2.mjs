// Reads actual object responses. An inaccessible network is unknown, never missing/pass.
import fs from 'node:fs';
import {REPORT_EDITORIAL_ASSETS} from '../functions/canonical-presentation-runtime/report-editorial-registry.js';
const base='https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev';
const rows=[];let cursor=0;
await Promise.all(Array.from({length:8},async()=>{while(cursor<REPORT_EDITORIAL_ASSETS.length){const asset=REPORT_EDITORIAL_ASSETS[cursor++];try{
 const r=await fetch(`${base}/${asset.object_key}`,{method:'HEAD',signal:AbortSignal.timeout(20000)});
 rows.push({...asset,httpStatus:r.status,contentType:r.headers.get('content-type'),objectExists:r.ok,status:r.ok&&r.headers.get('content-type')?.startsWith('image/')?'OBJECT_PRESENT_UNREVIEWED':r.status===404?'STATIC_EDITORIAL_ASSET_MISSING':'UNVERIFIED'});
 }catch(e){rows.push({...asset,status:'NOT_VERIFIED',error:e.name});}}}));
rows.sort((a,b)=>a.object_key.localeCompare(b.object_key));
const report={observedAt:new Date().toISOString(),source:'Public R2 HEAD requests to exact required object keys',expected:120,present:rows.filter(x=>x.objectExists).length,missing:rows.filter(x=>x.status==='STATIC_EDITORIAL_ASSET_MISSING').length,unverified:rows.filter(x=>['NOT_VERIFIED','UNVERIFIED'].includes(x.status)).length,humanReview:'PENDING',productionAccepted:false,rows};
fs.writeFileSync('docs/guided-report-successor-r1/static-asset-coverage.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,rows:undefined}));
if(report.present!==120)process.exitCode=2;
