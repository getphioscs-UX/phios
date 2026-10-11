import fs from 'node:fs';import path from 'node:path';
const config=fs.readFileSync(path.join(process.env.APPDATA,'xdg.config/.wrangler/config/default.toml'),'utf8');const token=config.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];if(!token)throw Error('EXISTING_OAUTH_UNAVAILABLE');
const base='https://api.cloudflare.com/client/v4/accounts/0b9f36bdf56f38d7d09aebe388f15204/r2/buckets/phios-private-manuscripts/objects';
let cursor;const objects=[];const pages=[];
for(let i=0;i<20;i++){
 const params=new URLSearchParams({per_page:'1000'});if(cursor)params.set('cursor',cursor);
 const r=await fetch(base+'?'+params,{headers:{Authorization:`Bearer ${token}`}});const b=await r.json();if(!r.ok||!b.success)throw Error('READONLY_INVENTORY_FAILED_'+r.status);
 objects.push(...(b.result||[]).map(o=>({key:o.key,size:o.size})));pages.push({status:r.status,count:b.result?.length,cursorPresent:Boolean(b.result_info?.cursor),truncated:b.result_info?.is_truncated});
 cursor=b.result_info?.cursor;if(!cursor)break;if(i===19)throw Error('INVENTORY_PAGINATION_LIMIT');
}
const candidates=objects.filter(o=>/(book[-_ ]?(4|6|iv|vi)(?![a-z0-9])|世界如何(扩展|重组)|181cb98e|23df5e1d)/i.test(o.key));
fs.writeFileSync('tools/review/free-ask-manuscript-r1/PRIVATE-R2-ALL-OBJECT-INVENTORY.json',JSON.stringify({at:new Date().toISOString(),authorization:'Owner selected full-bucket names and sizes only, Book IV/VI candidate downloads only',bucket:'phios-private-manuscripts',method:'GET',pages,objects,candidates,bodyReads:0},null,2));console.log(JSON.stringify({objects:objects.length,pages,candidates},null,2));
