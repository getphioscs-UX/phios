import fs from 'node:fs';
import path from 'node:path';
const out='docs/assets/r2-public/audit-20261009';fs.mkdirSync(out,{recursive:true});
const bucket='phios-public-assets',account='0b9f36bdf56f38d7d09aebe388f15204';
let token=process.env.CLOUDFLARE_API_TOKEN;
if(!token){const p=path.join(process.env.APPDATA||'','xdg.config/.wrangler/config/default.toml');if(fs.existsSync(p))token=fs.readFileSync(p,'utf8').match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];}
if(!token)throw Error('EXISTING_AUTH_NOT_AVAILABLE');
const objects=[],seen=new Set(),cursors=new Set(),pages=[];let cursor;
try{
 do{
  const url=new URL(`https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets/${bucket}/objects`);url.searchParams.set('per_page','1000');if(cursor)url.searchParams.set('cursor',cursor);
  const r=await fetch(url,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(45000)});const data=await r.json();
  if(!r.ok||!data.success)throw Error('LIST_HTTP_'+r.status+'_CODES_'+(data.errors||[]).map(x=>x.code).join(','));
  if(!Array.isArray(data.result))throw Error('UNRECOGNIZED_OBJECT_LIST_SHAPE');
  for(const o of data.result){if(seen.has(o.key))throw Error('DUPLICATE_KEY');seen.add(o.key);objects.push({key:o.key,size:o.size,lastModified:o.last_modified,etag:o.etag,checksums:o.checksums||null,contentType:o.http_metadata?.contentType||null,digestMeaning:'ETag is server metadata; not assumed SHA256 or content equality proof'});}
  pages.push({count:data.result.length,truncated:Boolean(data.result_info?.is_truncated),observedAt:new Date().toISOString()});cursor=data.result_info?.is_truncated?data.result_info.cursor:null;
  if(data.result_info?.is_truncated&&!cursor)throw Error('MISSING_CONTINUATION_CURSOR');if(cursor&&cursors.has(cursor))throw Error('REPEATED_CURSOR');if(cursor)cursors.add(cursor);
 }while(cursor);
 objects.sort((a,b)=>a.key.localeCompare(b.key));
 const report={bucket,complete:true,observedAt:new Date().toISOString(),source:'Existing Wrangler authorization / previously implemented Cloudflare REST Objects GET; all pages exhausted',objects,pages,totalObjects:objects.length,totalBytes:objects.reduce((s,o)=>s+o.size,0),mutations:0};fs.writeFileSync(out+'/INVENTORY.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({complete:true,pages:pages.length,totalObjects:objects.length,totalBytes:report.totalBytes}));
}catch(e){fs.writeFileSync(out+'/INVENTORY-FAILURE.json',JSON.stringify({complete:false,reason:e.message,pages,observedAt:new Date().toISOString()},null,2)+'\n');console.log('INVENTORY_FAILED '+e.message);process.exitCode=1;}
