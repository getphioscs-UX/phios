import fs from 'node:fs';
import path from 'node:path';
// Replace only generated review files, never truncate a reader-held artifact.
export function writeReviewFile(file,value){
 fs.mkdirSync(path.dirname(file),{recursive:true});
 const temp=file+'.w11r6-'+process.pid+'.tmp';fs.writeFileSync(temp,value);
 let error;
 for(let n=0;n<8;n++){try{fs.renameSync(temp,file);return;}catch(e){error=e;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,75);}}
 throw error;
}
