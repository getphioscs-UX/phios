import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const wt='C:/phios/.worktrees/unified-release-convergence-r1',D='C:/phios/tools/review/unified-release-convergence-r1/r11';
const receipt=JSON.parse(fs.readFileSync('C:/phios/tools/review/five-method-paid-report-r1/SOURCE-CHANGE-RECEIPT.json'));
const files=receipt.source.map(x=>x.file);for(const f of files){if(fs.readFileSync(wt+'/'+f,'utf8').replaceAll('\r\n','\n')!==fs.readFileSync(receipt.worktree+'/'+f,'utf8').replaceAll('\r\n','\n'))throw Error('OWNER_DRIFT '+f);}
const git=(...args)=>execFileSync('git',['-C',wt,...args],{encoding:'utf8',maxBuffer:20_000_000});
git('add','--',...files);const staged=git('diff','--cached','--name-only').trim().split('\n');if(staged.length!==18||staged.some(p=>!files.includes(p)))throw Error('UNEXPECTED_STAGED_PATHS');
console.log(git('commit','-m','integrate: retain gated report PDF delivery handoff for review'));
fs.writeFileSync(D+'/LOCAL-COMMIT.json',JSON.stringify({sha:git('rev-parse','HEAD').trim(),tree:git('rev-parse','HEAD^{tree}').trim(),files,pushed:false,releaseApproved:false},null,2));
