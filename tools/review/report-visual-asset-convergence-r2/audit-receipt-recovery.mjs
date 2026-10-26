import fs from 'node:fs';import cp from 'node:child_process';import {createHash} from 'node:crypto';
const root='tools/review/report-visual-asset-convergence-r2/recovery-r22/',dir=root+'authorized-receipt-recovery/';fs.mkdirSync(dir,{recursive:true});
const baseline=JSON.parse(fs.readFileSync(root+'BASELINE.json')),head=cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),hash=b=>createHash('sha256').update(b).digest('hex');
const names=['NATIVE-READING-EVIDENCE.json',...['tarot','i_ching'].flatMap(m=>['zh','en','bilingual'].map(l=>m+'-'+l+'.html'))],rows=[];
for(const name of names){const path='tools/review/personal-evidence-r1/commerce-r1-2/'+name,current=fs.readFileSync(path),target=cp.execFileSync('git',['show',baseline.head+':'+path]);
fs.writeFileSync(dir+name+'.before',current);fs.writeFileSync(dir+name+'.baseline-head',target);fs.writeFileSync(dir+name+'.diff',cp.execFileSync('git',['diff','--',path]));
const a=target.toString(),b=current.toString();let start=0,end=0;while(start<Math.min(a.length,b.length)&&a[start]===b[start])start++;while(end<Math.min(a.length,b.length)-start&&a[a.length-1-end]===b[b.length-1-end])end++;
rows.push({path,name,baselineAt:baseline.at,baselineHead:baseline.head,currentHead:head,initiallyClean:!baseline.status.includes(path),beforeSha256:hash(current),targetSha256:hash(target),beforeBytes:current.length,targetBytes:target.length,beforeMtime:fs.statSync(path).mtime.toISOString(),difference:{old:a.slice(start,a.length-end),current:b.slice(start,b.length-end)}});
}
fs.writeFileSync(dir+'AUDIT.json',JSON.stringify({at:new Date().toISOString(),authorization:'Explicit user approval limited to seven generated evidence files; skip if provenance unproven',rows},null,2));
console.log(JSON.stringify(rows.map(({name,initiallyClean,beforeMtime,difference})=>({name,initiallyClean,beforeMtime,difference})),null,2));
