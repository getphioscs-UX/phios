import fs from 'node:fs';import path from 'node:path';import {syncBuiltinESMExports} from 'node:module';
const original=fs.writeFileSync,root=process.cwd(),review=process.env.PHI_CARD_REVIEW_DIR||'tools/review/phi-card-customer-experience-r2/r23';
fs.writeFileSync=function(file,...args){if(typeof file==='string'||file instanceof URL){const p=path.relative(root,file instanceof URL?file:new String(file).toString()).replaceAll('\\','/');if(p.startsWith('docs/')||p.startsWith('tools/review/')&&!p.startsWith(review+'/')){file=path.join(root,review,'regression-evidence',p);fs.mkdirSync(path.dirname(file),{recursive:true});}}return original.call(fs,file,...args);};
syncBuiltinESMExports();
