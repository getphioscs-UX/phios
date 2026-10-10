import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const dir='content/knowledge/structured/successors/master-a-v2-batch6';
const temp='.tmp/master-a-batch6-check-original-bytes';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const paths=['content/knowledge/book-vii/v2-cutover/ask-acceptance-v2.json','content/knowledge/book-vii/production-admission/evidence/r1-current-runtime-regression-v1.json','tools/review/KAP-BOOK-VII-PRODUCTION-ADMISSION-R1-REGRESSION-REVIEW.html','docs/acceptance/bazi-paid-report/visual-first-r1/ZERO-COST-GUARD-EVIDENCE.json','docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-CHECK-all.json'];
if(process.argv[2]==='snapshot'){
 assert.equal(fs.existsSync(temp),false,'Do not overwrite original bytes');fs.mkdirSync(temp,{recursive:true});
 const records=paths.filter(p=>fs.existsSync(p)).map((path,i)=>{const b=fs.readFileSync(path),copy=temp+'/'+i+'.bin';fs.writeFileSync(copy,b);return {path,copy,originalSha256:hash(b)};});fs.writeFileSync(temp+'/manifest.json',JSON.stringify(records,null,2)+'\n');console.log('Known checker-generated outputs snapshotted; no worktree reset or stash.');
}else if(process.argv[2]==='capture-and-preserve'){
 const records=JSON.parse(fs.readFileSync(temp+'/manifest.json','utf8')).map((r,i)=>{const current=fs.readFileSync(r.path),original=fs.readFileSync(r.copy);assert.equal(hash(original),r.originalSha256);if(hash(current)===r.originalSha256)return {...r,changed:false};const capture=r.path.endsWith('.html')?`tools/review/MASTER-A-V2-FINAL-VALIDATION-CAPTURE-${i}.html`:`${dir}/validation-capture-generated-${i}.json`;fs.writeFileSync(capture,current);fs.writeFileSync(r.path,original);assert.equal(hash(fs.readFileSync(r.path)),r.originalSha256);return {...r,changed:true,runCapture:capture,captureSha256:hash(current),originalBytesPreserved:true};});
 fs.writeFileSync(dir+'/check-generated-output-preservation-v1.json',JSON.stringify({status:'PASS',records,noReset:true,noStash:true,scope:'Only enumerated known diagnostic outputs rewritten by requested checks; actual new outputs retained as separate run captures.'},null,2)+'\n');console.log('Actual check outputs captured; original receipt bytes preserved.');
}else throw Error('Use snapshot or capture-and-preserve');
