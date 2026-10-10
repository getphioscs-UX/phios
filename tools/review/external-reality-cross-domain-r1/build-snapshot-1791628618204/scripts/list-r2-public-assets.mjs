// Read-only inventory using the existing Wrangler login. Never writes credentials.
import fs from 'node:fs';
const bucket='phios-public-assets',account='0b9f36bdf56f38d7d09aebe388f15204';
let token=process.env.CLOUDFLARE_API_TOKEN;
if(!token){
 const path=process.env.APPDATA+'/xdg.config/.wrangler/config/default.toml';
 const config=fs.readFileSync(path,'utf8');token=config.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
}
if(!token)throw Error('Use the existing Wrangler login or CLOUDFLARE_API_TOKEN; do not put credentials in source files.');
const objects=[],seen=new Set();let cursor,pages=0;
do{
 const url=new URL(`https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets/${bucket}/objects`);
 url.searchParams.set('per_page','1000');if(cursor)url.searchParams.set('cursor',cursor);
 const response=await fetch(url,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
 const result=await response.json();if(!response.ok||!result.success)throw Error(`R2 inventory failed: HTTP ${response.status}`);
 for(const o of result.result){if(seen.has(o.key))throw Error('Duplicate inventory key');seen.add(o.key);objects.push({key:o.key,size:o.size,etag:o.etag,lastModified:o.last_modified,contentType:o.http_metadata?.contentType});}
 pages++;cursor=result.result_info?.is_truncated?result.result_info.cursor:null;
 if(result.result_info?.is_truncated&&!cursor)throw Error('Truncated inventory without continuation cursor');
}while(cursor);
const report={bucket,observedAt:new Date().toISOString(),source:'Authenticated Cloudflare REST List Objects, all pages exhausted',complete:true,pages,totalObjects:objects.length,objects};
fs.writeFileSync('docs/assets/r2-public/r2-bucket-inventory-2026-09-19.json',JSON.stringify(report,null,2)+'\n');
console.log({bucket,pages,totalObjects:objects.length});
