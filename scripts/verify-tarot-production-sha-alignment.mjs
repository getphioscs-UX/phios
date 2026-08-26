import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {
  CONTRACT_PATH,MANIFEST_PATH,EVIDENCE_PATH,ACCEPTANCE_PATH,FREEZE_PATH,SUCCESSOR_PATH,CURRENT_CHECKER_SUCCESSOR_PATH,
  readJson,writeJson,buildSourceManifest,buildVerifiedArtifacts,normalizeCloudflareDeployments,selectProductionDeployment,isFullGitSha,isSuccessfulStage,
  fileSha256,sha256CanonicalText
} from './lib/tarot/production-sha-alignment-v1.mjs';

const root=process.cwd();
const contract=readJson(root,CONTRACT_PATH);
const manifest=readJson(root,MANIFEST_PATH);
const phaseKFreezePath='content/production/symbolic-method/freeze/tarot-live-browser-acceptance-freeze-v1.json';
const phaseKFreezeSha256=fileSha256(root,phaseKFreezePath);
const fail=(code,message)=>Object.assign(new Error(`${code}: ${message}`),{code});
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe'],windowsHide:true}).trim();

const recomputed=buildSourceManifest(root,contract.baselineCommit);
assert.deepEqual(recomputed,manifest,'TPA-L source manifest drift: regenerate only by intentionally rebasing the Phase-L release candidate.');

try{git('fetch','origin','--quiet');}catch(error){throw fail('TAROT_L_GIT_FETCH_FAILED',error?.stderr?.toString?.().trim()||error.message);}
const originMain=git('rev-parse','origin/main');
const head=git('rev-parse','HEAD');
if(head!==originMain)throw fail('TAROT_L_HEAD_NOT_AT_ORIGIN_MAIN',`HEAD=${head}; origin/main=${originMain}. Verify only from the pushed current main checkout.`);
if(!isFullGitSha(originMain))throw fail('TAROT_L_ORIGIN_MAIN_SHA_INVALID',originMain);

const wrangler=localWrangler(root);
const whoami=runWranglerJson(wrangler,['whoami','--json'],'TAROT_L_CLOUDFLARE_WHOAMI_UNAVAILABLE');
if(whoami?.loggedIn!==true||!Array.isArray(whoami.accounts)||whoami.accounts.length===0)throw fail('TAROT_L_CLOUDFLARE_AUTH_UNAVAILABLE','Wrangler is not authenticated. Run npx wrangler login, then retry.');
const auth=runWranglerJson(wrangler,['auth','token','--json'],'TAROT_L_CLOUDFLARE_AUTH_TOKEN_UNAVAILABLE');
const headers=cloudflareAuthHeaders(auth);
let selectedAccount=null,apiPayload=null,lastApiError=null;
for(const account of whoami.accounts){
  try{apiPayload=await fetchDeployments({accountId:account.id,projectName:contract.cloudflare.projectName,environment:contract.cloudflare.environment,headers});selectedAccount=account;break;}
  catch(error){lastApiError=error;if(error?.code!=='TAROT_L_CLOUDFLARE_PROJECT_NOT_FOUND')throw error;}
}
if(!selectedAccount||!apiPayload)throw fail('TAROT_L_CLOUDFLARE_PROJECT_NOT_FOUND',lastApiError?.message||`Project ${contract.cloudflare.projectName} not found.`);
const deployments=normalizeCloudflareDeployments(apiPayload);
const {deployment,selectionMode}=selectProductionDeployment(deployments,contract);
if(!deployment)throw fail('TAROT_L_NO_PRODUCTION_DEPLOYMENT','No production deployment returned.');

const productionUrl=new URL(contract.cloudflare.productionUrl);
const reachability=await fetchText(productionUrl.href);
const runtimeWitness=await fetchJson(new URL(contract.cloudflare.runtimeShaWitness,productionUrl).href);
const remoteAssets=[];
for(const item of manifest.remoteAssets){
  const response=await fetchText(new URL(item.publicPath,productionUrl).href);
  remoteAssets.push({id:item.id,publicPath:item.publicPath,status:response.status,finalUrl:response.finalUrl,canonicalTextSha256:sha256CanonicalText(response.body),expectedCanonicalTextSha256:item.canonicalTextSha256,match:sha256CanonicalText(response.body)===item.canonicalTextSha256});
}
const checks={
  exactProductionCommit:deployment.commitHash===originMain,
  productionCommitIsFullGitSha:isFullGitSha(deployment.commitHash),
  productionBranchMain:deployment.branch===contract.cloudflare.productionBranch,
  productionEnvironment:deployment.environment===contract.cloudflare.environment,
  deploymentSuccessful:isSuccessfulStage(deployment.stageStatus),
  deploymentCommitClean:deployment.commitDirty===false,
  runtimeWitnessShaMatch:runtimeWitness.payload?.deployedSha===deployment.commitHash&&runtimeWitness.payload?.deployedSha===originMain,
  remoteRuntimeAssetsMatch:remoteAssets.every(x=>x.match&&x.status>=200&&x.status<400),
  productionUrlReachable:reachability.status>=200&&reachability.status<400
};
const verified=Object.values(checks).every(Boolean);
const evidence={
  schemaVersion:'PHI-OS-TAROT-PRODUCTION-SHA-ALIGNMENT-EVIDENCE-v1.0.0',phase:'TPA-L',work:'L-W51-L-W56',baselineCommit:contract.baselineCommit,
  status:verified?'VERIFIED_CURRENT_MAIN_DEPLOYED_EXACT_SHA_AND_RUNTIME_ASSETS_ALIGNED':'LIVE_PRODUCTION_ALIGNMENT_FAILED',verifiedAt:new Date().toISOString(),
  repository:{head,originMain,branch:git('branch','--show-current')||'DETACHED'},
  cloudflare:{projectName:contract.cloudflare.projectName,environment:contract.cloudflare.environment,productionUrl:contract.cloudflare.productionUrl,metadataAuthority:contract.cloudflare.metadataAuthority,accountId:selectedAccount.id,accountName:selectedAccount.name??null,authenticationType:auth.type??whoami.authType??null,rawDeploymentCount:deployments.length,selectionMode,deployment},
  runtimeWitness:{path:contract.cloudflare.runtimeShaWitness,status:runtimeWitness.status,deployedSha:runtimeWitness.payload?.deployedSha??null,sourceBaselineSha:runtimeWitness.payload?.sourceBaselineSha??null,contentType:runtimeWitness.contentType},
  reachability:{status:reachability.status,finalUrl:reachability.finalUrl,server:reachability.server,cfRayObserved:reachability.cfRayObserved},
  remoteAssets,checks,
  alignment:{verified,deployedCommit:deployment.commitHash??null,originMainCommit:originMain,exactCommitMatch:deployment.commitHash===originMain},
  security:{credentialPersisted:false,credentialLogged:false,cloudflareMutationPerformed:false},
  effects:{deploymentCreated:false,deploymentChanged:false,rollbackPerformed:false,productionCapabilityPromoted:false,publicRunAllowedChanged:false},
  productionBoundary:{verifiedPersistenceProvider:false,productionCapabilityPromoted:false,publicRunAllowed:false}
};
writeJson(root,EVIDENCE_PATH,evidence);
if(!verified){console.error('TPA-L production SHA alignment failed. Evidence was written fail-closed.');for(const [k,v] of Object.entries(checks))console.error(`  ${k}: ${v}`);process.exit(2);}
const derived=buildVerifiedArtifacts({contract,manifest,evidence,phaseKFreezeSha256});
writeJson(root,ACCEPTANCE_PATH,derived.acceptance);writeJson(root,FREEZE_PATH,derived.freeze);writeJson(root,SUCCESSOR_PATH,derived.successor);
writeCurrentCheckerSuccessor({verified:true,deployedCommit:evidence.alignment.deployedCommit});
console.log('✓ TPA-L Production SHA Alignment verified.');
console.log(`  origin/main:    ${originMain}`);
console.log(`  Cloudflare SHA: ${deployment.commitHash}`);
console.log(`  runtime witness:${runtimeWitness.payload?.deployedSha??'missing'}`);
console.log(`  remote assets:  ${remoteAssets.length}/${remoteAssets.length} exact canonical-text matches`);
console.log('  PCM promotion, verified persistence authority and public runAllowed remain closed.');

function writeCurrentCheckerSuccessor({verified,deployedCommit}){
  const checkers={phaseK:{path:'scripts/check-tarot-live-browser-acceptance.mjs'},readiness:{path:'scripts/check-tarot-production-sha-readiness.mjs'},strict:{path:'scripts/check-tarot-production-sha-alignment.mjs'},current:{path:'scripts/check-tarot-current-v2.mjs'},verifier:{path:'scripts/verify-tarot-production-sha-alignment.mjs'}};
  for(const item of Object.values(checkers))item.sha256=fileSha256(root,item.path);
  const value={schemaVersion:'PHI-OS-TAROT-CURRENT-CHECKER-SUCCESSOR-v2.0.0',phase:'TPA-L',work:'L-W56_CURRENT_CHECKER_RECONCILIATION',baselineCommit:contract.baselineCommit,status:verified?'CURRENT_MACHINE_HUMAN_BROWSER_AND_PRODUCTION_SHA_ACCEPTED_PERSISTENCE_AND_PROMOTION_PENDING':'CURRENT_PHASE_L_ALIGNMENT_PENDING',successorOf:{path:'content/production/symbolic-method/reconciliation/tarot-current-checker-successor-v1.json',preserved:true},checkers,current:{machineAcceptanceComplete:true,humanAcceptance24Of24:true,browserAcceptanceComplete:true,productionShaAlignment:verified,deployedCommit:deployedCommit??null},productionBoundary:{verifiedPersistenceProvider:false,productionCapabilityPromoted:false,publicRunAllowed:false,clientMayGrantAuthority:false},nextAction:verified?'PHASE_M_PERSISTENCE_AND_CAPABILITY_PROMOTION':'RUN_VERIFY_TAROT_PRODUCTION_SHA_ALIGNMENT'};
  writeJson(root,CURRENT_CHECKER_SUCCESSOR_PATH,value);
}
function localWrangler(rootDir){const js=path.join(rootDir,'node_modules','wrangler','bin','wrangler.js');if(!fs.existsSync(js))throw fail('TAROT_L_WRANGLER_NOT_INSTALLED','Local Wrangler is missing. Run npm ci before production SHA verification.');return {command:process.execPath,prefixArgs:[js]};}
function runWranglerJson(info,args,code){let stdout;try{stdout=execFileSync(info.command,[...info.prefixArgs,...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe'],env:process.env,windowsHide:true});}catch(error){const detail=[error?.stderr?.toString?.().trim(),error?.stdout?.toString?.().trim()].filter(Boolean).join('\n');throw fail(code,detail||`Wrangler command failed: ${args.join(' ')}`);}try{return parseJson(stdout);}catch{throw fail(`${code}_JSON_INVALID`,String(stdout).slice(0,500));}}
function cloudflareAuthHeaders(payload){if((payload?.type==='oauth'||payload?.type==='api_token')&&typeof payload.token==='string'&&payload.token)return {Authorization:`Bearer ${payload.token}`};if(payload?.type==='api_key'&&payload.key&&payload.email)return {'X-Auth-Key':payload.key,'X-Auth-Email':payload.email};throw fail('TAROT_L_CLOUDFLARE_AUTH_FORMAT_UNSUPPORTED',`Unsupported credential type: ${payload?.type??'missing'}`);}
async function fetchDeployments({accountId,projectName,environment,headers}){const u=new URL(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(projectName)}/deployments`);u.searchParams.set('env',environment);const response=await timedFetch(u,{headers:{...headers,Accept:'application/json','user-agent':'PHI-OS-TPA-L/1.0.0'}});let payload;try{payload=await response.json();}catch{throw fail('TAROT_L_CLOUDFLARE_API_JSON_INVALID',`HTTP ${response.status}`);}if(response.status===404||(payload?.errors??[]).some(x=>/not found|unknown project/i.test(String(x?.message??''))))throw fail('TAROT_L_CLOUDFLARE_PROJECT_NOT_FOUND',`Project ${projectName} not found in account ${accountId}.`);if(!response.ok||payload?.success===false){const detail=(payload?.errors??[]).map(x=>x?.message||x?.code).filter(Boolean).join('; ')||`HTTP ${response.status}`;throw fail('TAROT_L_CLOUDFLARE_METADATA_UNAVAILABLE',detail);}if(!Array.isArray(payload?.result))throw fail('TAROT_L_CLOUDFLARE_API_RESULT_INVALID','Pages deployments API returned no result array.');return payload;}
async function fetchText(url){const response=await timedFetch(url,{headers:{accept:'text/html,text/css,application/javascript;q=0.9,*/*;q=0.8','user-agent':'PHI-OS-TPA-L/1.0.0'},redirect:'follow'});const body=await response.text();return {status:response.status,body,finalUrl:response.url,server:response.headers.get('server'),cfRayObserved:Boolean(response.headers.get('cf-ray'))};}
async function fetchJson(url){const response=await timedFetch(url,{headers:{accept:'application/json','user-agent':'PHI-OS-TPA-L/1.0.0'},redirect:'follow'});let payload=null;try{payload=await response.json();}catch{}return {status:response.status,payload,contentType:response.headers.get('content-type')};}
async function timedFetch(url,options){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),20000);try{return await fetch(url,{...options,signal:controller.signal});}catch(error){throw fail('TAROT_L_NETWORK_UNAVAILABLE',error?.name==='AbortError'?`Timeout fetching ${url}`:error.message);}finally{clearTimeout(timer);}}
function parseJson(value){const text=String(value).replace(/^\uFEFF/,'').trim();try{return JSON.parse(text);}catch{}const starts=[text.indexOf('['),text.indexOf('{')].filter(i=>i>=0).sort((a,b)=>a-b);for(const start of starts){try{return JSON.parse(text.slice(start));}catch{}}throw new Error('invalid json');}
