import fs from 'node:fs';import path from 'node:path';
const source=path.resolve('docs/acceptance/bazi-paid-report/r11');
const destination='C:/phios/tools/review/unified-release-convergence-r1/r11/json-import-correction/root-review-build';
const mkdir=fs.mkdirSync.bind(fs),write=fs.writeFileSync.bind(fs);
function redirect(p){if(typeof p!=='string')return p;const full=path.resolve(p);return full===source||full.startsWith(source+path.sep)?path.join(destination,path.relative(source,full)):p;}
fs.mkdirSync=(p,...args)=>mkdir(redirect(p),...args);
fs.writeFileSync=(p,...args)=>{const target=redirect(p);if(target!==p)mkdir(path.dirname(target),{recursive:true});return write(target,...args);};
