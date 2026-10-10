import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const dir=process.env.W11R6_REPAIR_AUDIT||'content/profile/successors/personal-evidence-r1/w11r6/targeted-r1/',read=n=>JSON.parse(fs.readFileSync(dir+n)),hash=x=>crypto.createHash('sha256').update(x).digest('hex'),git=(...args)=>execFileSync('git',args,{maxBuffer:64*1024*1024}).toString(),baseline=read('baseline.json'),human=read('HUMAN-DECISION.json');
const checks=read('PRD-W11R6-REGRESSION-RESULTS.json'),browser=read('browser-results.json'),machine=read('machine-results.json'),pdfs=read('pdf-results.json'),targeted=read('targeted-results.json'),review=read('review-browser-results.json'),grammar=read('eleven-case-grammar-audit.json');
assert.equal(human.wholeReport,'REJECT_PENDING_TARGETED_REPAIR');assert.equal(human.conditionalIsAccept,false);assert.equal(human.w12,'BLOCKED');for(const r of [browser,machine,targeted,review])assert.equal(r.status,'PASS');assert.equal(browser.results.length,11);assert.equal(grammar.length,11);assert.equal(pdfs.length,3);
for(const k of ['check:profile:pfig-authority','check:profile:personal-evidence-prd-w3-w5','check:profile:personal-evidence-prd-w6','check:profile:personal-evidence-prd-w7','check:profile:personal-evidence-prd-w8','check:rr-v2','check:rmo','check:profile','check:ppr-current-shared-owner','check:relationship:w0-w8','check:runtime-position-48','check:cloudflare-function-import-compat','check:profile:pfig-semantic-grammar','check:profile:pfig-provenance-preservation','check:profile:prd-w11r5','check:profile:pfig-publication-legibility','check:profile:pfig-review-browser','check:pages-build'])assert.equal(checks.find(r=>r.command===k)?.status,'PASS',k);
const cpr=checks.find(r=>r.command==='check:cpr-w0-w6');assert.equal(cpr.status,'FAIL');const oldLog=fs.readFileSync('content/profile/successors/personal-evidence-r1/w11r6/check-cpr.log','utf8'),newLog=fs.readFileSync(cpr.log,'utf8'),digests=s=>({actual:s.match(/actual: '([a-f0-9]{64})'/)?.[1],expected:s.match(/expected: '([a-f0-9]{64})'/)?.[1]});assert.deepEqual(digests(newLog),digests(oldLog));assert(digests(newLog).actual);
const frozenPaths=['content/registry/public-assets.json','content/professional/canonical-presentation-runtime/audits/cpr-baseline-audit-v1.json','content/professional/canonical-presentation-runtime/freeze/cpr-w0-w6-foundation-freeze-v1.json'];
const frozen=frozenPaths.map(p=>{const original=execFileSync('git',['show',baseline.head+':'+p],{maxBuffer:64*1024*1024}),current=fs.readFileSync(p);assert.equal(hash(current),hash(original),p+' frozen original changed');return {path:p,sha256:hash(current),unchanged:true};});
fs.writeFileSync(dir+'CPR-BASELINE-EXTERNAL.json',JSON.stringify({classification:'BASELINE_EXTERNAL',failure:'public-assets digest mismatch',historicalLog:'content/profile/successors/personal-evidence-r1/w11r6/check-cpr.log',currentLog:cpr.log,...digests(newLog),frozenFiles:frozen,digestsAmended:false},null,2));
const cost=fs.readFileSync(dir+'zero-cost-processes.jsonl','utf8').trim().split('\n').map(JSON.parse),sum=key=>cost.reduce((n,x)=>n+x[key],0);assert.equal(sum('providerCalls'),0);assert.equal(sum('openAiCalls'),0);assert.equal(browser.networkEvidence.remoteRequestsBlocked,0);assert.equal(review.externalRequests,0);
const zero={timestamp:new Date().toISOString(),providerCalls:0,openAiCalls:0,processesRecorded:cost.length,externalAttemptsBlockedBeforeNetwork:sum('externalAttemptsBlocked'),blockedRecords:cost.filter(x=>x.externalAttemptsBlocked).map(x=>({...x,duringChecks:checks.filter(r=>x.timestamp>=r.startedAt&&x.timestamp<=r.finishedAt).map(r=>r.command)})),browserPublicationRemoteRequests:0,reviewExternalRequests:0,localArtworkDecoded:true,evidence:'zero-cost-processes.jsonl',noProviderCredentialsLogged:true};fs.writeFileSync(dir+'ZERO-COST-EVIDENCE.json',JSON.stringify(zero,null,2));
const retries={unknownCommandAttempt:{command:'check:cpr:prd-w0-w6',log:'check-cpr-prd-w0-w6.log',result:'ZERO_COST_COMMAND_UNKNOWN',resolution:'Correct existing check:cpr-w0-w6 alias used; baseline failure preserved'},playwrightResolution:{log:'attempt-01-w11r5-missing-local-playwright.log',initial:'ERR_MODULE_NOT_FOUND',resolution:'Existing bundled workspace runtime supplied by optional local resolver; final W11R5 PASS; no download'},reviewImageWait:{initial:'Lazy images left decode pending; only this test process terminated',resolution:'Reviewer checker explicitly requests eager image loading; final desktop/390px check PASS'}};fs.writeFileSync(dir+'EXECUTION-ATTEMPTS.json',JSON.stringify(retries,null,2));
const files=[];function walk(p){for(const e of fs.readdirSync(p,{withFileTypes:true})){const q=p+e.name;if(e.isDirectory())walk(q+'/');else files.push(q);}}walk(dir);walk('output/pdf/w11r6/targeted-r1/');
const backed=[];function originals(p,rel=''){for(const e of fs.readdirSync(p,{withFileTypes:true})){const r=rel+e.name;if(e.isDirectory())originals(p+e.name+'/',r+'/');else if(fs.existsSync(r)&&hash(fs.readFileSync(p+e.name))!==hash(fs.readFileSync(r)))backed.push(r);}}originals(baseline.backup);
const newCode=['assets/customer-ui/js/visuals/personal-evidence-grammar.js','scripts/capture-profile-personal-evidence-w11r6-targeted.mjs','scripts/check-profile-personal-evidence-w11r6-targeted.mjs','scripts/lib/w11r6-workspace-dependencies.mjs','scripts/lib/w11r6-review-paths.mjs','scripts/select-profile-personal-evidence-w11r6-receipts.mjs','scripts/preserve-profile-personal-evidence-w11r6-original-cost-log.mjs','scripts/prepare-profile-personal-evidence-w11r6-targeted.mjs','scripts/repair-profile-personal-evidence-w11r6-targeted.mjs','scripts/scope-profile-personal-evidence-w11r6-review.mjs','scripts/build-profile-personal-evidence-w11r6-targeted-review.mjs','scripts/finalize-profile-personal-evidence-w11r6-targeted.mjs'];
const originalRecords=new Map(baseline.files.map(f=>[f.path,f.sha256]));for(const p of backed)if(!originalRecords.has(p))originalRecords.set(p,hash(fs.readFileSync(baseline.backup+p)));
const entries=[...new Set([...backed,...newCode,...files])].sort().filter(p=>!['REPAIR-MANIFEST.json','EXECUTION-RESULT.md'].some(n=>p===dir+n)).map(p=>({path:p,change:originalRecords.has(p)?'MODIFIED':'ADDED',beforeSha256:originalRecords.get(p)||null,afterSha256:hash(fs.readFileSync(p)),sizeBytes:fs.statSync(p).size}));
const originalSources=baseline.sourceHashes.map(({id,sha256})=>{assert.equal(hash(fs.readFileSync('tools/review/personal-evidence-r1/'+id+'-source-view.json')),sha256);return {id,sha256,unchanged:true};});
const repoChanges=git('diff','--name-only',baseline.head).trim().split('\n').filter(Boolean),ours=new Set([...entries.map(x=>x.path),dir+'REPAIR-MANIFEST.json',dir+'EXECUTION-RESULT.md']);
const manifest={timestamp:new Date().toISOString(),status:'READY_FOR_HUMAN_REVIEW',wholeReportHumanAccepted:false,humanDecision:human,startHead:baseline.head,endHead:git('rev-parse','HEAD').trim(),externalHeadChangeObserved:git('rev-parse','HEAD').trim()!==baseline.head,agentGitMutations:{commit:false,push:false,deploy:false,reset:false},backupRoot:baseline.backup,backupInventory:'Exact original snapshots, retained; excluded from public Pages output',files:entries,sourceViews:originalSources,otherRepositoryChangesPreserved:repoChanges.filter(p=>!ours.has(p)&&!p.startsWith(baseline.backup)),selfReferentialReceipts:[dir+'REPAIR-MANIFEST.json',dir+'EXECUTION-RESULT.md']};fs.writeFileSync(dir+'REPAIR-MANIFEST.json',JSON.stringify(manifest,null,2));
const pass=checks.filter(x=>x.status==='PASS'),pairs=grammar.reduce((n,x)=>n+x.changedPairs.length,0),tables=grammar.reduce((n,x)=>n+x.changedTableFields.length,0);
fs.writeFileSync(dir+'NONBLOCKING-DIAGNOSTICS.json',JSON.stringify({pagesBuild:{status:'PASS',exitCode:0,workerCompiled:true,publicationBoundaryPassed:true,diagnostic:'Wrangler could not write its debug log under AppData (EPERM from filesystem sandbox)',sourceLog:'check-pages-build.log',deploymentPerformed:false},receiptSelection:{originalAuditSnapshotsPreserved:true,currentDefaultCheckDirectory:dir,w11r5CurrentFrozenBaseline:'w11r6/baseline.json',costRelocationEvidence:'cost-log-relocation.json'}},null,2));
const report=`# W11R6 Targeted Repair · READY_FOR_HUMAN_REVIEW

本轮完成 R1–R7 指定修复与审核证据。Whole report 仍为 REJECT_PENDING_TARGETED_REPAIR；W12 BLOCKED。PFIG-001/002/003/004/007/008 的人工 ACCEPT 保留；PFIG-005/006/009 仍为 CONDITIONAL，不等于 ACCEPT。等待下一次明确 ACCEPT / REJECT。

## 精确修复范围

- CASE-08：五项现有推理任务样本及 signalRef/native values/provenance 原样保留；工作图展示已记录任务样本，兴趣输入缺失、实际工作场所观察缺失、持续职业适配未知。没有从任务样本推断职业适配。
- CASE-09：两条对照，SOURCE_TENSION 与 CURRENTLY_CONTRADICTED 原样保留；现有分类均为 CONTEXT_DEPENDENT（0/2/0/0）；只有第二条含一个已准入现实关联。认知导航当前不一致；PFIG-004 UNKNOWN；PFIG-005/009 READY 仅为对照资料准入，不为重复情境观察或解释就绪。
- 十一例英文语法审计通过：${pairs} 个段落与 ${tables} 个表格字段做确定性单复数/谓语一致修复；中文、数值、来源与权威字段不变。没有重开已批准的稿件解释。

## 出版验证

十一例均为一案一份双语报告，九图各渲染一次；原始 P01–P05 与 SEC01–SEC10 Masters 的15项资源/DOM保留；九种结构、章节绑定、原生量尺分离及 UNKNOWN/EMPTY 保留。A4与390px检查通过，无图形裁切、文字溢出或页脚碰撞。图表不可见字段不改变原始 payload 与状态。

${pdfs.map(p=>'- '+p.caseId+': '+p.pageCount+' 页 · '+p.path+' · SHA256 '+p.sha256).join('\n')}

已从三份真实 PDF 用 Poppler 渲染并视觉检查 CASE-01 p32、CASE-08 p36、CASE-09 p41/p42；完整页测量见 browser-results.json，PDF元数据及正文非空校验见 pdf-results.json。原40页历史PDF不可用，未声称像素等价。

## 实际回归结果

${pass.length} 个受影响回归命令 PASS；R1/R2/R3 针对性检查 PASS；十一例浏览器及三份PDF验证 PASS。实际命令、退出码、时间及输出均在 PRD-W11R6-REGRESSION-RESULTS.json / 对应 .log。

${checks.map(c=>'- '+c.command+': '+(c.command==='check:cpr-w0-w6'?'BASELINE_EXTERNAL':c.command==='check:cpr:prd-w0-w6'?'INVOCATION_ERROR（已改用正确别名）':c.status)+' · '+c.log).join('\n')}

CPR历史失败仍为 BASELINE_EXTERNAL：actual ${digests(newLog).actual}；expected ${digests(newLog).expected}。与上轮相同，原 registry、audit 和 freeze 文件保持起始SHA256，未改冻结 digest 强制 PASS。此前 Book-W1F/WPR 历史失败未在本轮重跑或修复，本轮不声称全仓库 npm check PASS。首次本地 Playwright 缺失和审核懒加载等待已修正，原始尝试及处理记录见 EXECUTION-ATTEMPTS.json。Pages Worker 编译及发布边界检查通过（退出码0），另有沙箱不允许写 AppData Wrangler 调试日志的 EPERM 非阻断提示；完整原文保留在 check-pages-build.log / NONBLOCKING-DIAGNOSTICS.json。没有执行部署。

## 零费用与仓库状态

Provider calls = 0；OpenAI API calls = 0。${cost.length} 条进程计数；${sum('externalAttemptsBlocked')} 次外部尝试在网络前拦截；出版/审核浏览器实际外部请求 = 0。详见 ZERO-COST-EVIDENCE.json 与 zero-cost-processes.jsonl。

起始 HEAD ${baseline.head}；结束 HEAD ${manifest.endHead}。期间共享 main 发生外部提交/合并；本代理没有执行 commit、push、deploy、reset 或生产冻结。原始 W11R5/W11R6 审核包、备份和不相关共享修改均保留。REPAIR-MANIFEST.json 区分本轮精确文件变化与其他仓库变化；不以最终 git status 代替本轮清单。

## 审核入口与证据

- 本机：http://127.0.0.1:8807/w11r6/
- PRD-W11R6-PFIG-HUMAN-REVIEW.html：人工决定、CASE-08 前后、CASE-09 逐行对账、十一例语法及九图保留对比。
- CASE-08-task-before-after.json / CASE-09-reconciliation.json / eleven-case-grammar-audit.json。
- before/、after/、pdf-render/ 与 screenshot-provenance.json：针对性 A4、全页、390px 和真实 PDF 截图。
- REPAIR-MANIFEST.json / HUMAN-DECISION.json / CPR-BASELINE-EXTERNAL.json / ZERO-COST-EVIDENCE.json。

停在 READY_FOR_HUMAN_REVIEW。整份报告未 ACCEPTED，三项 CONDITIONAL 未提升为 ACCEPT；不执行 PRD-W12、冻结、提交、推送或部署。
`;
fs.writeFileSync(dir+'EXECUTION-RESULT.md',report);console.log('READY_FOR_HUMAN_REVIEW: exact manifest, actual regressions, PDFs, zero-cost evidence; whole report remains rejected and W12 blocked.');
