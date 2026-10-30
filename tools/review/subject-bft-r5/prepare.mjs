import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const dir='content/production-closure/live-customer-commercial-convergence/subject-bft-r5';
export const sha=b=>createHash('sha256').update(b).digest('hex');
export const json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
export const write=(name,data)=>fs.writeFileSync(dir+'/'+name,JSON.stringify(data,null,2)+'\n');
fs.mkdirSync(dir,{recursive:true});
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const r4=json(path.dirname(dir)+'/subject-bft-r4/INDEX.json'),r3=json(path.dirname(dir)+'/subject-bft-r3/INDEX.json');
const sources=[...new Set([...r3.sourceFiles,...r4.sourceFiles].map(x=>x.path))];
const inherited=sources.map(p=>({path:p,sha256:fs.existsSync(p)?sha(fs.readFileSync(p)):null,
  r3Sha:r3.sourceFiles.find(x=>x.path===p)?.sha256??null,r4Sha:r4.sourceFiles.find(x=>x.path===p)?.sha256??null,
  category:r4.sourceFiles.some(x=>x.path===p)?'R4 Candidate':'R3 Inherited',owner:p.startsWith('functions/')?p:'LOCAL_QA',
  dependency:fs.existsSync(p)?[...fs.readFileSync(p,'utf8').matchAll(/from\s*['"]([^'"]+)['"]/g)].map(m=>m[1]):[],
  consumers:[],testEvidence:'See R4 INDEX and hash-reuse reconciliation',integrationRisk:'No overwrite; local admission remains false'}));
for(const row of inherited){row.reuse=row.sha256===(row.r4Sha||row.r3Sha);row.consumers=sources.filter(p=>p!==row.path&&fs.existsSync(p)&&fs.readFileSync(p,'utf8').includes(path.basename(row.path).replace(/\.js$/,'')));}
const status=git('status','--porcelain=v1','--untracked-files=all').split('\n').filter(Boolean);
write('R5-RELEVANT-SOURCE-MANIFEST.json',{at:new Date().toISOString(),head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),
  status,staged:git('diff','--cached','--name-only'),initialUserFiles:['tools/review/world-main-production-continuity-r1/R1-PRODUCTION-PUBLIC-BOUNDARIES.json','tools/review/world-main-production-continuity-r1/production-en-1440.png','tools/review/world-main-production-continuity-r1/production-zh-Hans-360.png','tools/review/world-main-production-continuity-r1/verify-public-entrances.py'],
  inherited,unknownOwnership:'All unrelated PDFs untouched; no source import',ignored:git('status','--short','--ignored','.tmp/subject-bft-r5'),
  note:'Initial read-only status had four World untracked files. World smoke log became dirty during audit; preserved.'});
const review=json(path.dirname(dir)+'/subject-bft-r4/FIVE-OWNER-ADMISSION-REVIEW.json');
write('OWNER-ADMISSION-RECONCILIATION.json',{status:'PARTIAL',duplicatePackagesCreated:false,decisions:review.decisions.map((d,i)=>({
  owner:['Subject','Financial','Reading','Navigation','Continuity'][i],state:i===1?'CONFLICT_BLOCKED':'READY_FOR_OWNER_DECISION',
  existingPackage:d.existingPackage,expectedPackageSha:d.packageSha256,currentPackageSha:sha(fs.readFileSync(d.existingPackage)),
  currentContract:d.compatibility,proposedDelta:d.requestedChange,securityImpact:d.boundary,existingEvidence:d.tests,
  requiredDecision:d.humanDecision,whyNeeded:d.risk,affectedScope:d.existingOwner,reversibility:d.rollback,
  recommendation:'Accept local additive projection for engineering review only; do not activate real Subject provisioning or data access.',
  technicalImplementation:'SAFE_LOCAL_CANDIDATE',ownerAccepted:false,userApproved:'Local R5 engineering only; no formal-policy approval inferred',
  externalAuthority:d.external,production:'PRODUCTION_AUTHORIZATION_REQUIRED'
}))});
write('EXECUTION-CHECKPOINT.json',{phase:'W0_W1_COMPLETE_LOCAL_ADAPTER_WRITTEN',head:git('rev-parse','HEAD'),next:'Run isolated Node22 R5 delta tests; reuse only exact inherited hashes',production:false});
console.log(JSON.stringify({head:git('rev-parse','HEAD'),inherited:inherited.length,drift:inherited.filter(x=>!x.reuse).map(x=>x.path),statusCount:status.length}));
