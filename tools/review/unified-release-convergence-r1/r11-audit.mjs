import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
const D='C:/phios/tools/review/unified-release-convergence-r1/r11';fs.mkdirSync(D,{recursive:true});
const git=(...a)=>execFileSync('git',a,{cwd:'C:/phios',encoding:'utf8',maxBuffer:100_000_000});
const sha=b=>createHash('sha256').update(b).digest('hex'), json=(n,v)=>fs.writeFileSync(`${D}/${n}.json`,JSON.stringify(v,null,2));
const main=git('rev-parse','origin/main').trim(),prod=git('rev-parse','0d9089af').trim();
const tokens=git('diff','--name-status','-z','--find-renames',prod,main).split('\0').filter(Boolean),rows=[];
const wanted=[];for(let i=0;i<tokens.length;){const s=tokens[i++],p=tokens[i++],f=/^[RC]/.test(s)?tokens[i++]:p;if(!s.startsWith('D')&&/\.(js|mjs|json|html|jsonc)$/.test(f))wanted.push(f);}
const batch=execFileSync('git',['cat-file','--batch'],{cwd:'C:/phios',input:wanted.map(f=>`${main}:${f}\n`).join(''),maxBuffer:200_000_000}),cache=new Map();let offset=0;for(const f of wanted){const e=batch.indexOf(10,offset),header=batch.subarray(offset,e).toString(),n=Number(header.split(' ')[2]);if(!Number.isFinite(n))throw Error(header);cache.set(f,batch.subarray(e+1,e+1+n).toString());offset=e+2+n;}
const commits=git('log','--format=%H%x09%an%x09%aI%x09%s',`${prod}..${main}`).trim().split('\n').map(s=>{const [sha,author,date,...subject]=s.split('\t');return {sha,author,date,subject:subject.join('\t')};});
const touches=new Map();for(const c of commits){for(const f of git('diff-tree','--root','-m','--no-commit-id','--name-only','-r',c.sha).trim().split('\n').filter(Boolean)){const a=touches.get(f)||[];if(!a.includes(c.sha))a.push(c.sha);touches.set(f,a);}}
for(let i=0;i<tokens.length;){const status=tokens[i++],oldPath=tokens[i++],file=/^[RC]/.test(status)?tokens[i++]:oldPath;
 let owner='Unassigned release owner',scope='SHARED',risk='REVIEW_REQUIRED',reason='No current path-specific release acceptance located; merged source is not release approval.';
 if(/^(tools\/review|docs\/|artifacts\/|output\/|content\/production-closure)/.test(file)){owner='Evidence/publication owner';reason='Review artifacts may be copied into static output; confirm exclusion and synthetic/private boundaries.';}
 if(/world|market|wmda/.test(file)){owner='World / WMDA owner';scope='A';}
 if(/profile/.test(file)){owner='Profile owner';scope='A';}
 if(/ecr|phi-configuration/.test(file)){owner='ECR visual / semantic owner';scope='A';}
 if(/perspectives\/personal|method-entry/.test(file)){owner='Method entry owner';scope='A';}
 if(/report|commerce|stripe|entitlement|account|paid|manuscript/.test(file)&&!/^tools\/review\/world/.test(file)){owner='Report Publication / Commerce / Account owner';scope='B';}
 if(/wrangler|migration|d1|r2|stripe|commerce|entitlement|auth|account|_middleware|_redirects|_headers|build-cloudflare|workflow/.test(file)){risk='BLOCKED';reason='Environment, storage, commerce, access or build boundary requires explicit owner acceptance and isolated cloud evidence.';}
 if(/\.(html|js|mjs|css|json)$/.test(file)&&scope==='A')reason='Customer website candidate; page-specific human acceptance and dependency/gate proof required.';
 let content=cache.get(file)||'';
 const gates=[...new Set(content.match(/(?:PHIOS_[A-Z0-9_]+|REPORT_PROVIDER_LIVE_ALLOWED|customerPublishable\s*:\s*false|customerProductionAdmitted\s*:\s*false)/g)||[])];
 if(risk!=='BLOCKED'&&gates.length){risk='GATED';reason='Gate references found; default-closed runtime reachability still needs target-environment proof.';}
 rows.push({status,oldPath:/^[RC]/.test(status)?oldPath:null,path:file,commits:touches.get(file)||touches.get(oldPath)||[],owner,ownerConfirmed:false,scope,risk,reason,gates,exposure:/\.(html)$/.test(file)?'STATIC_DIRECT_URL_REACHABLE_UNLESS_EXCLUDED':/^(functions\/api|assets\/)/.test(file)?'API_OR_ASSET_PUBLIC_PATH_REVIEW':'BUILD_OUTPUT_MAPPING_REVIEW'});
}
json('PRODUCTION-MAIN-DELTA',{at:new Date().toISOString(),production:prod,main,comparison:'LOCAL_GIT_TWO_DOT_FULL_TREE_DIFF_RENAME_DETECTION',count:rows.length,counts:rows.reduce((a,r)=>(a[r.risk]=(a[r.risk]||0)+1,a),{}),limits:'Conservative triage, not semantic acceptance. Owner roles inferred from path; commit authors listed separately. No SAFE_TO_RELEASE inferred from merge or tests.',commits,files:rows});
fs.writeFileSync(`${D}/PRODUCTION-MAIN-DELTA.tsv`,['status\toldPath\tpath\tscope\trisk\towner\tcommits',...rows.map(r=>[r.status,r.oldPath||'',r.path,r.scope,r.risk,r.owner,r.commits.join(',')].join('\t'))].join('\n'));
const manifest=JSON.parse(fs.readFileSync('C:/phios/tools/review/unified-release-convergence-r1/RELEASE-MANIFEST.json'));
const patchChecks=[];
for(const [name,patch,owner,files] of [['ECR','C:/phios/tools/review/unified-release-convergence-r1/ECR-R31-UNAPPLIED.patch','C:/phios',manifest.ecrExactHashes.map(r=>({file:r.path,sha256:r.sha256}))],['REPORT','C:/phios/tools/review/five-method-paid-report-r1/PRODUCTION-CHANGES.patch','C:/phios/.worktrees/five-method-paid-report-production-r1',manifest.reportExactHashes]]){
 const detail=files.map(r=>{const p=path.join(owner,r.file),bytes=fs.existsSync(p)?fs.readFileSync(p):null;let mainBytes;try{mainBytes=Buffer.from(git('show',`${main}:${r.file}`));}catch{}return {path:r.file,expectedSha256:r.sha256,ownerSha256:bytes?sha(bytes):null,ownerMatchesOldPatch:bytes?sha(bytes)===r.sha256:false,mainSha256:mainBytes?sha(mainBytes):null,ownerMatchesMain:!!bytes&&!!mainBytes&&bytes.toString().replaceAll('\r\n','\n')===mainBytes.toString(),ownerStatus:git('-C',owner,'status','--short','--',r.file).trim()};});
 patchChecks.push({name,patch,patchSha256:sha(fs.readFileSync(patch)),owner,ownerHead:git('-C',owner,'rev-parse','HEAD').trim(),files:detail,decision:name==='ECR'?'OLD_R31_SUPERSEDED_BY_MAIN_AND_DIRTY_R4_HOLD_R4_FOR_HUMAN_REVIEW':'EXACT_SOURCE_HANDOFF_CHECK_BEFORE_MINIMAL_APPLY',applied:false});
}
json('PATCH-THREE-WAY',patchChecks);
const old=JSON.parse(fs.readFileSync('C:/phios/tools/review/unified-release-convergence-r1/SOURCE-OWNERSHIP-AND-CONFLICTS.json'));
const shared=[];for(const s of old.shared.filter(x=>x.conflict.startsWith('DIVERGENT'))){const versions=[];for(const o of s.observations){const p=path.join(o.worktree,s.path),b=fs.existsSync(p)?fs.readFileSync(p):null;const diff=spawnSync('git',['diff','--no-ext-diff','HEAD','--',s.path],{cwd:o.worktree,encoding:'utf8',maxBuffer:20_000_000});const id=`shared-${shared.length+1}-${versions.length+1}.patch`;fs.writeFileSync(`${D}/${id}`,diff.stdout||'');versions.push({worktree:o.worktree,head:git('-C',o.worktree,'rev-parse','HEAD').trim(),sha256:b?sha(b):null,changedSinceR1:b?sha(b)!==o.currentSha256:true,status:git('-C',o.worktree,'status','--short','--',s.path).trim(),patch:id,addedLines:(diff.stdout||'').split('\n').filter(l=>l.startsWith('+')&&!l.startsWith('+++')).slice(0,35),removedLines:(diff.stdout||'').split('\n').filter(l=>l.startsWith('-')&&!l.startsWith('---')).slice(0,35)});}
 shared.push({path:s.path,versions,status:'REVIEW_REQUIRED_OWNER_HANDOFF',lostBehaviorRisk:'Either whole-file choice drops the other owner additions; full individual diffs preserved.',plan:'Keep current main. Reconcile additive hooks, routes and imports hunk by hunk after owner handoff; preserve original permissions, localization, event lifecycle and build allowlist. No replacement applied.'});}
json('SHARED-11',shared);console.log(JSON.stringify({main,files:rows.length,patches:patchChecks.map(x=>({name:x.name,matching:x.files.filter(f=>f.ownerMatchesOldPatch).length,total:x.files.length})),shared:shared.length}));
