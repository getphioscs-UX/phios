// Restore only the eleven exact historic sample figures; never substitute for 4E.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const revision='61e4f513077e24a859e4c93c34ea03e46d5cd178^';
const numbers=['0A','1A','1B','2A','3A','3B','3C','4A','4B','4C','4D'];
const dir='.tmp/book-one-recovery';fs.mkdirSync(dir,{recursive:true});
const rows=numbers.map(number=>{
 const sourcePath=`assets/images/figures/book-1/web/${number}.webp`;
 const bytes=execFileSync('git',['show',`${revision}:${sourcePath}`],{maxBuffer:5e6});
 if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw Error('Invalid original '+number);
 const file=`${dir}/${number}.webp`;fs.writeFileSync(file,bytes);
 return {number,revision,sourcePath,file,key:`images/figures/books/book-1/${number}.webp`,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
});
fs.writeFileSync('docs/assets/r2-public/book-one-recovery-v1.json',JSON.stringify({status:'ORIGINALS_RECOVERED_UPLOAD_PENDING',source:'Git history before deletion; unchanged original WebP bytes',missing:['4E'],rows},null,2)+'\n');
console.log(`Recovered ${rows.length} original WebP images (${rows.reduce((n,r)=>n+r.bytes,0)} bytes). 4E has no historical original.`);
