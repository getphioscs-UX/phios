import fs from 'node:fs';
import cp from 'node:child_process';
import crypto from 'node:crypto';
const dir='tools/review/personal-evidence-r1/evidence-system-r1/';
const git=(...args)=>cp.execFileSync('git',args,{encoding:'utf8'}).trim();
const paths=['functions/account/profile-evidence-store.js','functions/profile/profile-foundation-runtime.js','functions/profile/academic-bridge-runtime.js','functions/profile/personal-evidence-handoffs.js','functions/profile/profile-person-evidence-adapter.js','functions/profile/profile-production-authority.js','functions/api/profile-progressive.js','assets/customer-ui/js/surfaces/profile-progressive.js','perspectives/profile/index.html','content/registry/master-governance.json'];
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
if(fs.existsSync(dir+'BASELINE.json'))throw Error('BASELINE_ALREADY_RECORDED');
fs.writeFileSync(dir+'BASELINE.json',JSON.stringify({at:new Date().toISOString(),head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),status:git('status','--short'),upstream:git('rev-parse','--abbrev-ref','@{upstream}'),remoteTrackingMain:git('rev-parse','origin/main'),agents:'No AGENTS.md found by rg --files --hidden excluding .git and node_modules; parent paths separately checked.',files:paths.map(path=>({path,sha256:sha(path)})),changeClass:'EXPLICIT_CONTRACT_VERSION_UPGRADE_LOCAL_ONLY',production:'RUNTIME_UNVERIFIED'},null,2));
const checks=[];
for(const name of ['check-profile-customer-full-production','check-profile-personal-evidence-prd-w6-w8','check-profile-personal-evidence-prd-w10','check-profile-personal-evidence-prd-w9']){
 const cmd=['--import','./scripts/lib/pages-json-import-preload.mjs',`scripts/${name}.mjs`];
 const r=cp.spawnSync(process.execPath,cmd,{encoding:'utf8',timeout:180000,maxBuffer:2e6});
 checks.push({command:'node '+cmd.join(' '),exitCode:r.status,signal:r.signal,error:r.error?.message||null,stdout:r.stdout,stderr:r.stderr,status:r.status===0?'PASS_LOCAL':'BASELINE_FAILURE'});
 fs.writeFileSync(dir+'BASELINE-CHECKS.json',JSON.stringify(checks,null,2));
 console.log(name,r.status);
}
