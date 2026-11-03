import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const wt='C:/phios/.worktrees/final-unified-production-r1',dir=wt+'/docs/commerce/economics-20261009',needed=new Set();
function scan(v){if(typeof v==='string'&&v.startsWith('tools/review/')&&!v.includes('..')&&!fs.existsSync(wt+'/'+v))needed.add(v);else if(Array.isArray(v))v.forEach(scan);else if(v&&typeof v==='object')Object.values(v).forEach(scan);}
for(const file of fs.readdirSync(dir).filter(p=>/^bazi-.*successor.*\.json$/.test(p)))scan(JSON.parse(fs.readFileSync(dir+'/'+file)));
for(const p of needed){let b;try{b=execFileSync('git',['show','HEAD:'+p],{cwd:wt,maxBuffer:25*1024*1024,stdio:['ignore','pipe','pipe']});}catch{continue;}const f=wt+'/'+p;fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,b);console.log('Immutable fixture: '+p);}
