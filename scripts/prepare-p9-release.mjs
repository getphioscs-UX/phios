import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

// Preparation only. No network, Git mutation, migration, or provider execution.
const base='content/production-closure/shared-paid-report-delivery/';
const out='content/production-closure/live-customer-commercial-convergence/bazi-p9/';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const ref=p=>({path:p,sha256:sha(p)});
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const write=(name,value)=>fs.writeFileSync(out+name,JSON.stringify(value,null,2)+'\n');
fs.mkdirSync(out,{recursive:true});
const handoffPath=base+'P8-TO-P9-HANDOFF.json',handoff=read(handoffPath);
const receiptPath=base+'P8-SHARED-PAID-REPORT-DELIVERY-CORE-R1.json',receipt=read(receiptPath);
const matrixPath=base+'P8R1-FULL-LOCAL-MATRIX.json',matrix=read(matrixPath);
assert.equal(receipt.status,'PASS_LOCAL');assert.equal(matrix.status,'PASS_LOCAL');
const acceptedManifest=matrix.sourceHashManifest;
const drift=Object.entries(acceptedManifest).filter(([p,h])=>!fs.existsSync(p)||sha(p)!==h).map(([p,h])=>({path:p,acceptedSha256:h,currentSha256:fs.existsSync(p)?sha(p):null}));
const acceptancePath=base+'P8-R1-HUMAN-ACCEPTANCE.json';
const acceptance={statement:'HUMAN ACCEPT P8 R1 · SHARED PAID REPORT DELIVERY CORE',authority:'EXPLICIT_USER_IN_THIS_CONVERSATION',acceptedAt:new Date().toISOString(),acceptedAtMeaning:'Recorded at preparation; no earlier timestamp asserted',authorizationSource:'User supplied P9 Master Work sections 0, 4, 76',receipt:ref(receiptPath),review:ref('tools/review/P8-SHARED-PAID-REPORT-DELIVERY-CORE-R1.html'),sharedCoreSourceManifest:acceptedManifest,sourceManifestAuthority:ref(matrixPath),migration0018:ref(handoff.migration0018.file),baziAdapter:ref(handoff.baziAdapter),currentSourceDrift:drift,scope:'P8 R1 local architecture only; no production or paid execution authorization'};
if(fs.existsSync(acceptancePath)){const prior=read(acceptancePath);assert.equal(prior.statement,acceptance.statement);assert.equal(prior.receipt.sha256,acceptance.receipt.sha256);assert.equal(prior.review.sha256,acceptance.review.sha256);}else fs.writeFileSync(acceptancePath,JSON.stringify(acceptance,null,2)+'\n',{flag:'wx'});
const head=git('rev-parse','HEAD'),branch=git('branch','--show-current');
const status=git('status','--porcelain=v1','-uall').split(/\r?\n/).filter(Boolean);
const entries=['functions/report-delivery/paid-report-delivery-core.js','functions/report-delivery/paid-report-watchdog.js','functions/report-delivery/paid-report-refund-events.js','functions/commerce/paid-report-refund-transport.js','functions/api/account-paid-report-setup.js','functions/api/commerce-checkout.js','functions/api/stripe-webhook.js','functions/api/account-method-reports.js','functions/api/_middleware.js','assets/customer-ui/js/surfaces/commerce-account.js','assets/customer-ui/js/shell.js','account/index.html','workers/method-report-renderer/index.js','wrangler.jsonc','workers/method-report-renderer/wrangler.jsonc','package.json','package-lock.json','content/registry/runtime-migrations.json'];
const files=new Map(),unresolved=[];const aliases=read('package.json').imports||{};
function add(p,reason){p=p.replaceAll('\\','/').replace(/^\//,'');if(!fs.existsSync(p)||!fs.statSync(p).isFile()){unresolved.push({path:p,reason});return;}if(files.has(p))return;files.set(p,reason);if(!/\.(js|mjs|html|css)$/.test(p))return;const s=fs.readFileSync(p,'utf8');
 for(const m of s.matchAll(/(?:from\s*|import\s*\(|import\s*)['"]([^'"]+)['"]/g)){let target=m[1];if(target.startsWith('#'))target=aliases[target];if(target?.startsWith('.'))add(path.relative(process.cwd(),path.resolve(path.dirname(p),target)),'Import from '+p);}
 if(/\.(html|css)$/.test(p))for(const m of s.matchAll(/(?:src|href)=["']([^"'#?]+)|url\(["']?([^"')]+)["']?\)/g)){const target=m[1]||m[2];if(/^(?:https?:|data:|mailto:)/.test(target))continue;const local=target.startsWith('/')?target.slice(1):path.join(path.dirname(p),target);if(fs.existsSync(local)&&fs.statSync(local).isFile())add(local,'HTML/CSS asset from '+p);}
 for(const m of s.matchAll(/['"]((?:content|config|assets|db)\/[^'"\n]+\.(?:json|css|js|svg|webp))['"]/g))if(fs.existsSync(m[1]))add(m[1],'Runtime manifest/asset literal from '+p);
}
entries.forEach(p=>add(p,'Release entry owner'));
for(const m of read('content/registry/runtime-migrations.json').migrations)add(m.file,'Governed migration required for fresh and upgrade validation');
for(const p of Object.keys(acceptedManifest))if(!p.startsWith('scripts/'))add(p,'Accepted P8 dependency; preserves original runtime closure');
const rows=[...files].sort(([a],[b])=>a.localeCompare(b)).map(([p,reason])=>({path:p,SHA256:sha(p),reason,requiredForP9:true}));
const workingChanges=status.map(line=>({status:line.slice(0,2),path:line.slice(3),classification:files.has(line.slice(3))?'P9_DEPENDENCY_CHANGED':/bazi-p9|P9-|P8-R1-HUMAN-ACCEPTANCE|prepare-p9|check-p9/.test(line)?'P9_PREPARATION_OUTPUT':'UNRELATED_CONCURRENT_CHANGE'}));
const manifest={head,branch,generatedAt:new Date().toISOString(),files:rows,unresolved,analysisLimits:['Computed imports and assets generated from runtime data require explicit runtime/configuration review','Deployed SHA unavailable in local authoritative handoff; changed-since-deployed comparison remains RUNTIME_UNVERIFIED'],excludedArtifacts:['screenshots','PDF derivatives','QA SQLite','private QA objects','transient logs']};
write('P9-RELEASE-DEPENDENCY-MANIFEST.json',manifest);
write('P9-A-WORKTREE-AUDIT.json',{head,branch,initialStatus:status,workingChanges,p8AcceptedSourceDrift:drift,applicableAgents:[],agentsSearch:'rg --files --hidden -g AGENTS.md plus C:/AGENTS.md and C:/phios/AGENTS.md',remoteHead:'NOT_FETCHED_PREPARATION_LOCAL_ONLY',lastDeployedSHA:'RUNTIME_UNVERIFIED'});
const config=read('wrangler.jsonc'),renderer=read('workers/method-report-renderer/wrangler.jsonc');
const gaps=[{id:'PRODUCTION_RENDERER_BINDING_MISSING',owner:'wrangler.jsonc',evidence:'METHOD_REPORT_RENDERER exists only in preview and points to QA worker; production services absent'},{id:'PRODUCTION_RENDERER_TARGET_MISSING',owner:'workers/method-report-renderer/wrangler.jsonc',evidence:'Only QA worker target exists; no governed production renderer target defined'},{id:'WATCHDOG_PRODUCTION_TRIGGER_MISSING',owner:'functions/report-delivery/paid-report-watchdog.js',evidence:'Exports scheduler port only; no Cron/Queue handler or governed scheduler configuration found'},{id:'LIVE_SHARED_ADMISSION_NOT_IMPLEMENTED',owner:'functions/report-delivery/paid-report-readiness.js',evidence:'requireSharedPaidReportLocal allows local/qa/preview only; production denied'},{id:'LIVE_REFUND_NOT_ARMED',owner:'functions/commerce/paid-report-refund-transport.js',evidence:'Existing transport is QA-only; live transport/webhook financial proof not admitted'},{id:'CANARY_SERVER_ADMISSION_MISSING',owner:'functions/commerce/controlled-purchase-candidate.js',evidence:'Existing controlled purchase requires discounted coupons; does not implement canonical-price BZR P9 admission. No policy activated.'},{id:'CANARY_IDENTITY_AND_EXPIRY_UNSELECTED',owner:'Human',evidence:'No authorized real account/person, readinessId or bounded expiry supplied'},{id:'LIVE_SECRET_PRESENCE_UNVERIFIED',owner:'Production configuration',evidence:'No secret values read; production presence must be checked through authorized metadata-only inspection'},{id:'DEPLOYED_SOURCE_UNVERIFIED',owner:'Deployment records',evidence:'Local handoff explicitly reports not deployed; no verified production source SHA obtained'}];
const audit={status:'VALID_HANDOFF_WITH_PRODUCTION_GAPS',handoff:ref(handoffPath),handoffPreserved:true,sharedCoreVersion:handoff.sharedCoreVersion,adapter:ref(handoff.baziAdapter),migration:handoff.migration0018,actualTargets:{pages:config.name,database:config.d1_databases,privateReports:config.r2_buckets.find(x=>x.binding==='PRIVATE_REPORTS'),productionRenderer:null,qaRenderer:renderer.name,qaBrowser:renderer.browser,watchdog:null},requiredBindings:handoff.requiredWorkerBindings,secretPresencePlan:['OPENAI_API_KEY','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','CANONICAL_PERSON_ENCRYPTION_KEY','AUTH_SESSION_SECRET'].map(name=>({name,state:'RUNTIME_UNVERIFIED',operation:'Metadata names/presence only; never values'})),rollbackPlan:handoff.rollbackPlan,gaps};
write('P9-A-HANDOFF-AUDIT.json',audit);
const candidate={status:'PREPARATION_EVIDENCE_GAPS_OPEN',head,immutableSourceCommit:head,releaseReady:false,dependencyManifest:ref(out+'P9-RELEASE-DEPENDENCY-MANIFEST.json'),p7Baseline:ref(receipt.protectedP7.path),p8Receipt:ref(receiptPath),p8HumanAcceptance:ref(acceptancePath),handoff:ref(handoffPath),migration0018:ref(handoff.migration0018.file),cloudflareConfig:ref('wrangler.jsonc'),rendererConfig:ref('workers/method-report-renderer/wrangler.jsonc'),watchdog:ref('functions/report-delivery/paid-report-watchdog.js'),commerceEconomics:ref('functions/pws/commercial/commerce-economics-policy.js'),generationPolicy:ref('functions/personal-reading/deep-manuscript/bazi-production-generation-config.js'),gaps,authorization:{G1:'NOT_AUTHORIZED',G2:'NOT_AUTHORIZED',G3:'NOT_AUTHORIZED',G4:'NOT_AUTHORIZED',G5:'NOT_AUTHORIZED',G6:'NOT_AUTHORIZED',G7:'NOT_AUTHORIZED'},providerCalls:0,realPayments:0,realRefunds:0,deploy:false,remoteMigration:false};
const digest=crypto.createHash('sha256').update(JSON.stringify(candidate)).digest('hex');candidate.P9_RC_DIGEST=digest;candidate.digestAlgorithm='SHA256 of JSON.stringify(candidate before P9_RC_DIGEST and digestAlgorithm fields)';
write('P9-RELEASE-CANDIDATE.json',candidate);
assert.equal(git('rev-parse','HEAD'),head,'HEAD_CHANGED_DURING_PREPARATION');
for(const row of rows)assert.equal(sha(row.path),row.SHA256,'DEPENDENCY_CHANGED_DURING_PREPARATION:'+row.path);
console.log(JSON.stringify({head,dependencyFiles:rows.length,p8SourceDrift:drift.length,unresolved:unresolved.length,P9_RC_DIGEST:digest,gaps:gaps.length}));

