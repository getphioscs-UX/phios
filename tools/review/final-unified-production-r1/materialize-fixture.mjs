import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const wt='C:/phios/.worktrees/final-unified-production-r1';
for(const p of process.argv.slice(2)){if(!p.startsWith('tools/review/')||p.includes('..'))throw Error('FIXTURE_SCOPE_DENIED');const f=path.join(wt,p);if(fs.existsSync(f))throw Error('WILL_NOT_OVERWRITE_EXISTING_FIXTURE');const bytes=execFileSync('git',['show','HEAD:'+p],{cwd:wt,maxBuffer:20*1024*1024});fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,bytes);console.log('Materialized immutable HEAD fixture: '+p);}
