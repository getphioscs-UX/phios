import fs from 'node:fs';
import crypto from 'node:crypto';
import cp from 'node:child_process';
const dir='content/profile/successors/personal-evidence-r1/w11r5/';
fs.mkdirSync(dir,{recursive:true});
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
if(!fs.existsSync(dir+'baseline.json')){
 const cases=Array.from({length:11},(_,i)=>{const id='CASE-'+String(i+1).padStart(2,'0'),root='tools/review/personal-evidence-r1/'+id;return {id,sourceHash:hash(fs.readFileSync(root+'-source-view.json')),traceHash:hash(fs.readFileSync(root+'-bilingual-trace.json')),beforePages:(fs.readFileSync(root+'-bilingual-dossier.html','utf8').match(/<article class="pub-/g)||[]).length};});
 fs.writeFileSync(dir+'baseline.json',JSON.stringify({head:cp.execSync('git rev-parse HEAD').toString().trim(),worktree:cp.execSync('git status --short').toString(),cases,rootCause:['Dossier retains nine primary figure payloads','Publication projection and IR transport references / prose only','CPR builds narrative and tables without invoking PFIG renderer','W11R3 governance suppresses UNKNOWN and EMPTY'],pdfBaseline:'USER_DECLARED_CASE_01_40_PAGES_PDF_NOT_ATTACHED',w12:'BLOCKED'},null,2));
}
