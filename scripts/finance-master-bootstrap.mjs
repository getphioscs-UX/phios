import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const source='C:/Users/Guest Account/Desktop/PHIOS-FINANCE-CODEX-MASTER-R1.md';
const bytes=fs.readFileSync(source),text=bytes.toString('utf8');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const dir='docs/financial-preparation';fs.mkdirSync(dir,{recursive:true});
const evidence={capturedAt:new Date().toISOString(),master:{path:source,bytes:bytes.length,sha256:hash(bytes)},head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),index:execFileSync('git',['diff','--cached','--name-only'],{encoding:'utf8'}).trim(),protected:[]};
for(const line of execFileSync('git',['status','--porcelain=v1','-uall'],{encoding:'utf8'}).split(/\r?\n/).filter(Boolean)){
 const path=line.slice(3);if(path.startsWith(dir+'/')||path==='scripts/finance-master-bootstrap.mjs')continue;
 evidence.protected.push({status:line.slice(0,2),path,sha256:fs.existsSync(path)&&fs.statSync(path).isFile()?hash(fs.readFileSync(path)):null});
}
const baseline=`${dir}/M0-BASELINE.json`;
if(!fs.existsSync(baseline))fs.writeFileSync(baseline,JSON.stringify(evidence,null,2)+'\n');
const hashes={'jurisdiction-capability-reference.mjs':'ad241b4b09ec89a59fd377f863981984be24aae53e8d136e45cb25d808f41536','jurisdiction-capability-reference.test.mjs':'b70aee90afce31f62b57a737a70cc41fd9181cb78836fd123c817b218d4130c5','README.md':'dd6258815309cc6530c30a0893322908d7ea2c7f0306e19c9e95ac7354af0261'};
for(const [name,expected] of Object.entries(hashes)){
 const marker=name==='README.md'?'jurisdiction-capability-reference.README.md':name;
 const start=`<!-- BEGIN FILE: ${marker} -->`,end=`<!-- END FILE: ${marker} -->`;
 const block=text.slice(text.indexOf(start)+start.length,text.indexOf(end)).replace(/\r\n/g,'\n');
 const lines=block.trim().split('\n');if(!lines[0].startsWith('````')||lines.at(-1)!=='````')throw Error(`FENCE_INVALID:${name}`);
 const content=lines.slice(1,-1).join('\n')+'\n';if(hash(content)!==expected)throw Error(`REFERENCE_DIGEST_MISMATCH:${name}`);
 const target=`tests/financial-preparation/reference/${name}`;fs.mkdirSync('tests/financial-preparation/reference',{recursive:true});
 if(fs.existsSync(target)&&hash(fs.readFileSync(target))!==expected)throw Error(`EXISTING_REFERENCE_DIFFERS:${name}`);
 if(!fs.existsSync(target))fs.writeFileSync(target,content);
 console.log(`${name}: VERIFIED ${expected}`);
}
