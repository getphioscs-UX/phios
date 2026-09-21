import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

// Git deployment uploads tracked repository assets. Check those before Worker
// compilation; untracked local QA captures are not part of a Git deployment.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const result=spawnSync(process.env.PHIOS_GIT_BIN||'git',['ls-files','-z'],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024});
if(result.error||result.status!==0)throw result.error||new Error('Cannot enumerate Git deployment assets');
const ignored=new Set(['functions','node_modules','.git','.wrangler']);
const failures=[];let checked=0;
for(const file of result.stdout.split('\0').filter(Boolean)){
  const absolute=path.join(root,file);
  if(ignored.has(file.split('/')[0])||!fs.existsSync(absolute))continue;
  const stat=fs.statSync(absolute);if(!stat.isFile())continue;
  checked++;
  if(stat.size>25*1024*1024)failures.push(`${file}: ${(stat.size/1024/1024).toFixed(2)} MiB`);
}
if(failures.length)throw new Error(`Pages static assets exceed 25 MiB:\n${failures.join('\n')}`);
console.log(`PASS Pages static asset size: ${checked} tracked files, none exceeds 25 MiB.`);
