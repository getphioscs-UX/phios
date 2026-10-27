import fs from 'node:fs';import {createHash} from 'node:crypto';
const urls=[
 'https://jovianarchive.com/blogs/deeper-mechanics-system-theory/radical-transformation-is-it-correct-for-me-part-1-transforming-the-body-experience',
 'https://humandesign.so/incarnation-crosses/left-angle-cross-of-dedication-2',
 'https://humandesign.tools/incarnation-crosses/the-left-angle-cross-of-dedication-2',
 'https://jovianarchive.com/products/incarnation-crosses-by-profile-iv-the-quarter-of-mutation'
];
const results=[];for(const url of urls){try{const r=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{'User-Agent':'PHIOS-local-read-only-source-verification/1.0'}}),b=Buffer.from(await r.arrayBuffer()),s=b.toString();results.push({url,at:new Date().toISOString(),http:r.status,finalURL:r.url,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),contentType:r.headers.get('content-type'),title:s.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()||null,lowSoundClassificationPresent:/5th Color[\s\S]{0,150}Right variable[\s\S]{0,100}Low Sound/i.test(s),orderedCrossPresent:/43\s*\/\s*23\s*\|\s*29\s*\/\s*30/.test(s),angleTitlePresent:/Left Angle Cross of Dedication 2/i.test(s),responseBodyPersisted:false});}catch(e){results.push({url,at:new Date().toISOString(),http:null,error:e.name+': '+e.message,responseBodyPersisted:false});}}
fs.writeFileSync('tools/review/hd-r6/import-20261027/r62/'+(process.argv[2]||'HTTP-SOURCE-READS.json'),JSON.stringify({scope:'Public GET only; full copyrighted bodies not stored or admitted',results},null,2)+'\n');console.log(results.map(r=>({url:r.url,http:r.http,error:r.error})));
