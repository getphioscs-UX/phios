import fs from 'node:fs';import {spawnSync,execFileSync} from 'node:child_process';
const D='C:/phios/tools/review/unified-release-convergence-r1/r12/commerce-repair',wt='C:/phios/.worktrees/unified-release-convergence-r1',branch='codex/unified-release-preview-r12',sha='786dd7d69bbfb1600ceb49cde7f32a12b3c8934e';
const safety=JSON.parse(fs.readFileSync(D+'/CLOUDFLARE-CONTROL-VERIFIED.json'));if(!safety.targetBranchAutoPreviewExcluded||safety.candidate!==sha)throw Error('PREVIEW_SAFETY_RECEIPT_REQUIRED');
const ref=execFileSync('git',['ls-remote','origin','refs/heads/'+branch],{cwd:wt,encoding:'utf8'}).trim();if(!ref.startsWith(sha+'\t'))throw Error('REMOTE_FROZEN_SHA_MISMATCH');
// Reuse the existing Git credential helper in memory. Never log, export, save,
// or print the helper response, token, authorization header or secret values.
const credential=spawnSync('git',['credential','fill'],{cwd:wt,input:'protocol=https\nhost=github.com\npath=getphioscs-UX/phios.git\n\n',encoding:'utf8',env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'Never'}});if(credential.status!==0)throw Error('EXISTING_GIT_CREDENTIAL_NOT_AVAILABLE');
const fields=Object.fromEntries(credential.stdout.trim().split('\n').map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)];}));if(!fields.password)throw Error('EXISTING_GIT_AUTH_NOT_AVAILABLE');
const endpoint='https://api.github.com/repos/getphioscs-UX/phios/actions/workflows/ptrc-validation.yml/dispatches';
const r=await fetch(endpoint,{method:'POST',headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+fields.password,'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:JSON.stringify({ref:branch}),signal:AbortSignal.timeout(30000)});
fields.password='';credential.stdout='';
const receipt={at:new Date().toISOString(),workflow:'ptrc-validation.yml',ref:branch,remoteSha:sha,event:'workflow_dispatch',httpStatus:r.status,reason:'Existing PR workflow checks a temporary merge ref; this additional run checks out the exact frozen branch commit. No local full npm check.',secretValuesRecorded:false,previewDeploymentAllowed:false};fs.writeFileSync(D+'/EXACT-SHA-CI-DISPATCH.json',JSON.stringify(receipt,null,2));if(r.status!==204)throw Error('EXACT_SHA_CI_DISPATCH_FAILED_HTTP_'+r.status);console.log(JSON.stringify(receipt));
