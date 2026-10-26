import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
const out='tools/review/report-visual-asset-convergence-r2/recovery-r22/';fs.mkdirSync(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const cp=JSON.parse(fs.readFileSync('tools/review/report-visual-asset-convergence-r2/owner-inventory-followup/CHECKPOINT-R21.json'));
const source=cp.sourceFiles.map(path=>({path,sha256:hash(fs.readFileSync(path))}));
fs.writeFileSync(out+'BASELINE.json',JSON.stringify({at:new Date().toISOString(),head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),status:git('status','--short'),source},null,2));
fs.writeFileSync(out+'WORKTREE-BEFORE.diff',execFileSync('git',['diff','--binary'],{maxBuffer:30*1024*1024}));
const base='https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/';
const targets=[['PROFILE','images/reports/profile/editorial/VIS-REPORT-PROFILE-BODY.webp'],['ECR','images/reports/ecr/editorial/shared/VIS-REPORT-ECR-SEC-05-REALITY-GRAMMAR-QUESTIONS.webp'],['ECR','images/reports/ecr/editorial/shared/VIS-REPORT-ECR-SEC-07-CARRIER-ENVIRONMENT.webp'],['ZWR','images/reports/ziwei/editorial/shared/VIS-REPORT-ZIWEI-SEC-08-PRESSURE-VULNERABILITY.webp'],['BZR','images/reports/bazi/editorial/shared/VIS-REPORT-BAZI-BODY.webp']];
const rows=[];
for(const [report,key]of targets){const probes=[];for(const [method,suffix]of [['HEAD',''],['GET',''],['GET','?r22='+Date.now()]]){const url=base+key+suffix,at=new Date().toISOString();try{const r=await fetch(url,{method,redirect:'manual',signal:AbortSignal.timeout(25000)});const b=Buffer.from(await r.arrayBuffer());const p={at,method,url,status:r.status,headers:Object.fromEntries(['content-type','content-length','cache-control','age','cf-cache-status','cf-ray','server','location','etag','last-modified'].map(k=>[k,r.headers.get(k)])),bytes:b.length};if(method==='GET'&&r.ok){const m=await sharp(b).metadata();Object.assign(p,{sha256:hash(b),width:m.width,height:m.height,decoded:true});fs.writeFileSync(out+hash(b)+'.webp',b);}probes.push(p);}catch(e){probes.push({at,method,url,status:null,error:e.code||e.cause?.code||e.name});}}rows.push({report,key,probes});}
fs.writeFileSync(out+'PUBLIC-DIAGNOSTICS.json',JSON.stringify({at:new Date().toISOString(),credentialAccess:false,managementApiRetried:false,productionWrites:0,rows},null,2));
console.log(rows.map(r=>r.report+' '+r.key+' '+r.probes.map(p=>p.status??p.error).join('/')).join('\n'));
