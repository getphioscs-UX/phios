import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';import crypto from 'node:crypto';
const out='C:/phios/tools/review/integrated-closure-r25',book='C:/phios/.worktrees/pr6-ebook-closure',sum=x=>crypto.createHash('sha256').update(x).digest('hex');
const old='tools/review/report-visual-asset-convergence-r2/recovery-r24/continuation-20261027';
let s=fs.readFileSync(old+'/integration-current.mjs','utf8').replaceAll("const d='"+old+"/'","const d='tools/review/integrated-closure-r25/'");fs.writeFileSync(out+'/report-lifecycle-current.mjs',s);
const deps=['functions/commerce/book-product-registry.js','functions/commerce/book-delivery.js','functions/commerce/book-watermark-artifact.js'];
const dependencies=deps.map(p=>{const a=fs.readFileSync(book+'/'+p),target=out+'/dependencies/'+p;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,a);return{path:p,source:book+'/'+p,sha256:sum(a),candidatePath:path.relative('C:/phios',target).replaceAll('\\','/')};});
fs.writeFileSync(out+'/REQUIRED-PR6-DEPENDENCIES.json',JSON.stringify({scope:'Isolated import prerequisites, not copied into main source',dependencies},null,2));
const source=book+'/tools/review/seven-book-ebook-closure-r1/trusted-metadata-qa-source.mjs.txt';s=fs.readFileSync(source,'utf8').replace(/from ['"](\.\.\/\.\.\/(?:functions|scripts)\/[^'"]+)['"]/g,(_,p)=>'from '+JSON.stringify(pathToFileURL(path.resolve(book,p.slice(6))).href));
// The captured script originally ran below PR6/.tmp; retain exact original roots
// for imports while rerouting output and private watermark destination only.
s=s.replaceAll("out='tools/review/seven-book-ebook-closure-r1'","out='C:/phios/tools/review/integrated-closure-r25'");
s=s.replace("config=JSON.parse(fs.readFileSync(out+'/COMMERCE-BOOK-SOURCE-VERSIONS-CANDIDATE.json'))","config=JSON.parse(fs.readFileSync('"+book+"/tools/review/seven-book-ebook-closure-r1/COMMERCE-BOOK-SOURCE-VERSIONS-CANDIDATE.json'))");
// Correct captured relative imports explicitly to their owning PR6 modules.
s=s.replaceAll('file:///C:/phios/functions/','file:///C:/phios/.worktrees/pr6-ebook-closure/functions/').replaceAll('file:///C:/phios/scripts/','file:///C:/phios/.worktrees/pr6-ebook-closure/scripts/');
fs.mkdirSync('C:/phios/.tmp/integrated-closure-r25/private',{recursive:true});
s=s.replace("resultFile=privateRoot+'/private/revisions/R3-'","resultFile='C:/phios/.tmp/integrated-closure-r25/private/R25-'");
fs.writeFileSync(out+'/pr6-full-size-local.mjs',s);
console.log('Prepared isolated current lifecycle and PR6 full-size replay; originals unchanged.');
