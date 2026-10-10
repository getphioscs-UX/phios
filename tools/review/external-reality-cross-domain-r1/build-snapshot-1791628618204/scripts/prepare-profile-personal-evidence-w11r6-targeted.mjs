import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='content/profile/successors/personal-evidence-r1/w11r6/targeted-r1/';fs.mkdirSync(dir,{recursive:true});
if(fs.existsSync(dir+'baseline.json'))throw Error('TARGETED_BASELINE_ALREADY_CAPTURED');
const git=(...a)=>execFileSync('git',a,{maxBuffer:64*1024*1024}).toString(),timestamp=new Date().toISOString(),backup='.phios-repair-backups/w11r6-targeted/'+timestamp.replaceAll(':','-')+'/',root='tools/review/personal-evidence-r1/';
const paths=['assets/customer-ui/js/visuals/profile-visual-mvp.js','assets/customer-ui/surfaces/personal-evidence-dossier.css','assets/customer-ui/js/personal-products/personal-evidence-dossier.bundle.js','functions/canonical-presentation-runtime/personal-evidence-bilingual-reading.js','scripts/check-profile-personal-evidence-w11r5.mjs','scripts/check-profile-personal-evidence-w11r6.mjs','scripts/check-profile-personal-evidence-w11r6-browser.mjs','scripts/build-profile-personal-evidence-w11r3.mjs','tools/review/PROFILE-PERSONAL-EVIDENCE-R1-HUMAN-REVIEW.html',root+'portable-evidence-manifest.json'];
for(const file of fs.readdirSync(root).filter(f=>/^CASE-(0[1-9]|1[01])-bilingual-(dossier.html|results.html|trace.json)$/.test(f)))paths.push(root+file);
for(const file of fs.readdirSync('tools/review').filter(f=>f.startsWith('PROFILE-PERSONAL-EVIDENCE-W11R3')))paths.push('tools/review/'+file);
for(const p of paths){fs.mkdirSync(path.dirname(backup+p),{recursive:true});fs.copyFileSync(p,backup+p);}
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const baseline={timestamp,head:git('rev-parse','HEAD').trim(),worktree:git('status','--porcelain=v1'),backup,files:paths.map(p=>({path:p,sha256:hash(fs.readFileSync(p))})),sourceHashes:Array.from({length:11},(_,i)=>{const id='CASE-'+String(i+1).padStart(2,'0');return {id,sha256:hash(fs.readFileSync(root+id+'-source-view.json'))};})};
fs.writeFileSync(dir+'baseline.json',JSON.stringify(baseline,null,2));
fs.writeFileSync(dir+'HUMAN-DECISION.json',JSON.stringify({recordedAt:timestamp,authority:'EXPLICIT_USER_MESSAGE',structuralRepair:'PARTIAL_HUMAN_ACCEPT',wholeReport:'REJECT_PENDING_TARGETED_REPAIR',pfigDecisions:{'PFIG-001':'ACCEPT','PFIG-002':'ACCEPT','PFIG-003':'ACCEPT','PFIG-004':'ACCEPT','PFIG-005':'CONDITIONAL','PFIG-006':'CONDITIONAL','PFIG-007':'ACCEPT','PFIG-008':'ACCEPT','PFIG-009':'CONDITIONAL'},conditionalIsAccept:false,requiredRepairs:['CASE-08 task evidence consistency','CASE-09 cross-source/reality-link reconciliation','11-case deterministic bilingual grammar','three targeted PDFs and publication checks'],w12:'BLOCKED',nextDecision:'PENDING'},null,2));
console.log('Explicit partial human acceptance and whole-report rejection recorded; targeted baseline backed up.');
