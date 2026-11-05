import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {transformSync} from 'esbuild';
import {pagesWorkerCompactionOptions} from '../../../scripts/lib/pages-worker-compaction.mjs';
import {acquirePagesOutputLock} from '../../../scripts/lib/pages-output-lock.mjs';
const out='content/production-closure/live-customer-commercial-convergence/business-financial-transformation-release-r1/r0-final-gate-closure';
fs.mkdirSync(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=(...a)=>execFileSync('git',a,{windowsHide:true,maxBuffer:32*1024*1024});
const write=(n,v)=>fs.writeFileSync(out+'/'+n,JSON.stringify(v,null,2)+'\n');
const sha='2391e4e104269b30d95987dda7f82a00e580227b';
const status=git('status','--porcelain=v1','-uall').toString();
write('WORKSPACE-BASELINE.json',{at:new Date().toISOString(),head:git('rev-parse','HEAD').toString().trim(),branch:git('branch','--show-current').toString().trim(),remoteCached:sha,status,staged:git('diff','--cached','--name-only').toString(),worktrees:git('worktree','list','--porcelain').toString(),dirtyTracked:git('diff','--name-only','-z').toString().split('\0').filter(Boolean).map(p=>({path:p,sha256:fs.existsSync(p)?hash(fs.readFileSync(p)):null})),node:process.version});
const patch='content/production-closure/live-customer-commercial-convergence/business-financial-transformation-release-r1/TASK-ONLY-DIFF.patch';
const dry='.tmp/bft-release-convergence-r1/r0-main-dry-run';fs.mkdirSync(dry,{recursive:true});
const paths=[...fs.readFileSync(patch,'utf8').matchAll(/^\+\+\+ b\/(.+)$/gm)].map(m=>m[1].trim());
for(const p of paths){fs.mkdirSync(path.dirname(dry+'/'+p),{recursive:true});fs.writeFileSync(dry+'/'+p,git('show',sha+':'+p));}
const check=spawnSync('git',['apply','--check','--unsafe-paths',path.resolve(patch)],{cwd:path.resolve(dry),encoding:'utf8',windowsHide:true});
write('PATCH-DRY-RUN.json',{baseline:sha,paths,patchSha256:hash(fs.readFileSync(patch)),exit:check.status,stdout:check.stdout,stderr:check.stderr,worktreeModified:false,indexModified:false});
// Extract only the two checks and their tracked static dependency graph.
const root='.tmp/bft-release-convergence-r1/r0-main-checks';fs.mkdirSync(root,{recursive:true});
const all=git('ls-tree','-r','--name-only',sha).toString().split('\n');const known=new Set(all);const pending=['package.json','scripts/check-ptrc-w9-testamentary-report.mjs','scripts/check-b6-web-e.mjs'];const done=new Set();
while(pending.length){const p=pending.pop();if(done.has(p)||!known.has(p))continue;done.add(p);const b=git('show',sha+':'+p);fs.mkdirSync(path.dirname(root+'/'+p),{recursive:true});fs.writeFileSync(root+'/'+p,b);if(!/\.(?:js|mjs)$/.test(p))continue;const s=b.toString();for(const m of s.matchAll(/(?:from\s*|import\s*\(|import\s*)['"](\.[^'"]+)['"]/g)){const r=path.posix.normalize(path.posix.join(path.posix.dirname(p),m[1]));if(known.has(r))pending.push(r);}for(const m of s.matchAll(/['"]((?:content|test|assets)\/[^'"\n]+\.(?:json|js|html))['"]/g))if(known.has(m[1]))pending.push(m[1]);}
// Bare package imports resolve via the existing repository ancestor node_modules.
const tests=[];for(const name of ['check-ptrc-w9-testamentary-report.mjs','check-b6-web-e.mjs']){const r=spawnSync(process.execPath,['scripts/'+name],{cwd:path.resolve(root),encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});fs.writeFileSync(out+'/BASELINE-'+name+'.log',(r.stdout||'')+(r.stderr||''));tests.push({name,exit:r.status,error:r.error?.message,log:'BASELINE-'+name+'.log'});}
write('CLEAN-MAIN-TARGETED-CHECKS.json',{source:sha,node:process.version,files:done.size,tests,scope:'Exact tracked blobs; no current worktree source; minimal dependency projection',filesSha256:[...done].sort().map(p=>({path:p,sha256:hash(fs.readFileSync(root+'/'+p))}))});
const lease=acquirePagesOutputLock(process.cwd(),'CHECK');try{const p='.wrangler/pages-production-build/index.js',b=fs.readFileSync(p),s=b.toString();const options={...pagesWorkerCompactionOptions,minifySyntax:true};const candidate=transformSync(s,options).code;fs.mkdirSync('.tmp/bft-release-convergence-r1/r0-compaction',{recursive:true});fs.writeFileSync('.tmp/bft-release-convergence-r1/r0-compaction/index.js',candidate);write('COMPACTION-EXPERIMENT.json',{input:p,inputSha256:hash(b),before:{bytes:b.length,gzip:gzipSync(b).length},after:{bytes:Buffer.byteLength(candidate),gzip:gzipSync(candidate).length,sha256:hash(candidate)},limit:3145728,headroom:3145728-gzipSync(candidate).length,options,productionOutputChanged:false});}finally{lease.release();}
console.log('R0 baseline, patch dry-run, clean-main checks and isolated compaction recorded');
