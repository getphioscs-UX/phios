import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
const config=fs.readFileSync(path.join(process.env.APPDATA,'xdg.config/.wrangler/config/default.toml'),'utf8');
const token=config.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
if(!token)throw Error('EXISTING_OAUTH_UNAVAILABLE');
const base='https://api.cloudflare.com/client/v4/accounts/0b9f36bdf56f38d7d09aebe388f15204/r2/buckets/phios-private-manuscripts/objects';
const records=[];
for(const prefix of ['books/book-4/','books/book-6/']){
 const response=await fetch(base+'?'+new URLSearchParams({prefix,per_page:'1000'}),{headers:{Authorization:`Bearer ${token}`}});
 const raw=await response.text();let body;try{body=JSON.parse(raw)}catch{body={error:'NON_JSON_RESPONSE'}};
 records.push({prefix,status:response.status,body});
 console.log(prefix,response.status,body.success,JSON.stringify(body.errors||[]));
}
fs.mkdirSync('tools/review/free-ask-manuscript-r1',{recursive:true});
fs.writeFileSync('tools/review/free-ask-manuscript-r1/PRIVATE-R2-READONLY-LIST.json',JSON.stringify({at:new Date().toISOString(),bucket:'phios-private-manuscripts',method:'GET',records},null,2));
const downloads=[];
for(const row of records)for(const object of row.body.result||[]){
 if(!object.key.endsWith('.pdf'))continue;
 const target=path.join('.tmp/free-ask-manuscripts/source-candidates',object.key);
 fs.mkdirSync(path.dirname(target),{recursive:true});
 const response=await fetch(base+'/'+object.key,{headers:{Authorization:`Bearer ${token}`}});
 if(!response.ok){downloads.push({key:object.key,status:response.status});continue;}
 await pipeline(Readable.fromWeb(response.body),fs.createWriteStream(target));
 const hash=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(target))hash.update(chunk);
 const sha256=hash.digest('hex');
 downloads.push({key:object.key,status:response.status,path:target,byteSize:fs.statSync(target).size,sha256});
 console.log(object.key,sha256);
}
fs.writeFileSync('tools/review/free-ask-manuscript-r1/PRIVATE-R2-DOWNLOAD-BYTE-IDENTITY.json',JSON.stringify({at:new Date().toISOString(),bucket:'phios-private-manuscripts',method:'GET',downloads},null,2));
