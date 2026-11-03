const fs=require('fs'),crypto=require('crypto'),path=require('path');const root='C:/phios',w=root+'/.worktrees/five-method-paid-report-production-r1',r=__dirname;
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const definitions={
BZR:['tools/review/five-method-paid-report-r1/BZR-COLD-REOPEN-CHECKS.json','tools/review/five-method-paid-report-r1/REFUND-WEBHOOK-CHECKS.json','tools/review/five-method-paid-report-r1/FINAL-VERIFICATION.json','tools/review/r12-acceptance-ziwei-next/HUMAN-DECISIONS-PENDING.json'],
ZWR:['docs/reports/ziwei/vfr-r1/HUMAN-DECISION.json','tools/review/ziwei-r1-4-final-artifact-handoff/FINAL-VERIFICATION.json','tools/review/ziwei-r14-owner-signoff-cloud-qa/HANDOFF-STATUS.json'],
AST:['content/professional/ast-full-production/admission/ast-fp-r4a-professional-semantic-human-admission-v1.json','content/professional/ast-full-production/publication/r1r5/human-publication-system-acceptance.json','content/professional/ast-full-production/publication/r1r5/human-english-manuscript-acceptance.json','content/professional/ast-full-production/publication/r1r5/future-customer-invariants-receipt.json'],
NUM:['tools/review/numerology-r30/production-acceptance/STATUS.json','tools/review/numerology-r30/production-acceptance/HUMAN-DECISION.json'],
HD:['content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/production/HD-PRO-R3-W25-production-cutover-v1.json','tools/review/hd-r6/import-20261027/r611/STATUS.json','tools/review/hd-r6/import-20261027/r611/PRIVATE-DELIVERY-QA.json'],
ECR:['content/customer-experience-rebuild/r12r4b/admission/ecr-production-admission-v1.json','content/reports/ecr/ecr-author-visual-binding-r33.json','tools/review/ecr-flagship-visual-r1/r4/R31-HUMAN-ACCEPTANCE.json']};
const evidence={};for(const [id,files]of Object.entries(definitions))evidence[id]=files.map(p=>{const abs=fs.existsSync(root+'/'+p)?root+'/'+p:w+'/'+p;if(!fs.existsSync(abs))throw Error('Missing evidence '+p);return {path:abs,sha256:hash(abs),scope:'Historical exact scoped receipt; not rerun or promoted to Live acceptance'};});
fs.writeFileSync(r+'/EVIDENCE-INDEX.json',JSON.stringify(evidence,null,2));
const dimensions=['Native calculation / confirmed input','Personalized narrative','Full PDF','Publication / Human Acceptance','Actual OpenAI Provider','Stripe Product / Price / Checkout / Webhook','Entitlement / Account / Subject / Consent','Private artifact / download / reopen','Failure / recovery / refund / cost','Exact blocker / minimal action'];
const commonProvider='NOT_RUN_BUDGET_PENDING: no dedicated project availability, real usage or cost verified; commercial ceilings are not QA spending authorization.';
const commonStripe='IMPLEMENTED_NOT_E2E_VERIFIED: shared product economics, Checkout and verified paid Webhook exist; current Sandbox Product/Price metadata and whole purchase chain not verified. Generic job creation does not prove scheduled execution.';
const rows={
BZR:[
'PASS_WITH_EVIDENCE: native calculation + owned subject snapshot; R1.1 cross-field corrections preserved. Supported time/calendar scope remains mandatory.',
'PASS_WITH_EVIDENCE: R11 approved manuscript retained; native deep writer exists. R1.1 additions/final publication approval remains separate.',
'PASS_WITH_EVIDENCE (local synthetic): 48-page delivery artifact cold reopen 35,640,638 bytes SHA 8ee63665c551505a5c394c210ef403296da8186212926f89eb7003a72b156636. Newer 49/49/50-page candidates are distinct versions.',
'PARTIAL: R11 ACCEPT and P10 visual decision preserved. R1.1/R1.2 complete commercial publication, missing timing scope and commercial watermark require scoped Owner sign-off. Do not silently swap adapter 48-page contract.',
commonProvider+' Durable paid-context/budget implementation exists in bazi-paid-generation.',commonStripe,
'PASS_WITH_EVIDENCE (local): original order/subject/snapshot/consent and entitlement, wrong account/revoked rights fail closed; not Cloud receipt.',
'PASS_WITH_EVIDENCE (local): exact issued binary SHA, cold-process reopen/redownload without renderer/provider. Cloud private storage not verified.',
'PASS_WITH_EVIDENCE (local scoped): recovery/security/refund Webhook receipts. Actual paid Provider cost, durable Cloud recovery and Sandbox refund E2E remain unverified.',
'OWNER + CONFIG + CLOUD: select exact commercial publication/version/watermark; dedicated QA project + budget; trusted scoped Sandbox dispatch; real non-production chain before canary.'
],
ZWR:[
'PASS_WITH_EVIDENCE (local): Native Profile/runtime with verified birth inputs and observation date. Native source 72 pages is not final publication 68 pages.',
'IMPLEMENTED / local personalized evidence: five-call composer + authority pack; accepted 68-page reference source is not a default for unrelated customers. Fresh customer manuscript admission still needed.',
'PASS_WITH_EVIDENCE: exact reference Q87 9,807,509 bytes SHA 2dd6e0b3a4c6fba2a5ab7305afdb1cd2a1d4e9c72b56c63f8ca3677275d578b4; 68 pages. WM V2 independent 9,838,466 bytes SHA 7babe9af729f3f82704dfaaa7265f8019066d8c271fc3f27023ded0bd1950d72; 12 bookmarks.',
'PARTIAL: accepted manuscript/15 diagrams retained. R1.3 reference visual signature and R1.4 commercial watermark signature pending, local visual candidates only.',
commonProvider+' CODE: composer lacks existing durable paid generation context binding; do not bypass assertReportProviderAccess. Pricing corrected in isolated candidate.',commonStripe,
'PASS_WITH_EVIDENCE (local final-file test): snapshot/order/entitlement association and 27 negative cases; not authorized Cloud admission.',
'PASS_WITH_EVIDENCE (local): exact final Q87-to-native Account download/reopen, zero rerender/provider. Existing delivery guard explicitly local-only.',
'PARTIAL: local receipt/idempotency/permission negatives; actual paid reservation/settlement and generic lifecycle/Cloud recovery not closed.',
'CODE + OWNER + CLOUD: reuse createServerPaidReportContext; complete shared lifecycle/dispatch, scoped Cloud artifact policy only after signatures. Do not mark P8 true to remove guard.'
],
AST:[
'PASS_WITH_EVIDENCE: native production adapter and 21/21 professional semantic admission exist; no new engine needed.',
'PASS_WITH_EVIDENCE (accepted reference): English manuscript and bilingual publication accepted; three-case future-input invariant receipt. Three-call experiment exists but no actual unseen-customer run proved.',
'PASS_WITH_EVIDENCE (accepted reference): pinned 64-page bilingual publication system, existing builder/assets/diagrams. Customer paid PDF assembly/store bridge not verified.',
'PASS_WITH_EVIDENCE within exact publication/English scopes. Receipts explicitly exclude production activation, shared E2E, unseen-customer three-call admission.',
commonProvider+' Three-call experiment has explicit authorization gate; actual durable paid-owner integration absent.',commonStripe,
'SHARED OWNER AVAILABLE / method bridge missing: subject/consent/entitlement must feed exact AST authority pack and job; no AST full lifecycle registered.',
'NOT VERIFIED for full customer AST: shared immutable store exists, no receipt proving paid AST bytes through Account and cold reopen.',
'PARTIAL: experiment validation/cache/cost logic exists; paid recovery/refund/usage settlement not verified for AST.',
'CODE + QA AUTH: adapt existing AST composer/publication to shared nine-stage owner, exact source/version binding; admit unseen-customer manuscript then targeted Sandbox chain.'
],
NUM:[
'PASS_WITH_EVIDENCE: native name/Y/number/school rules and 19 chartModels; four structurally different subjects tested in R30.',
'PASS_WITH_EVIDENCE only for admitted offline/replay cases; unseen-customer automation NOT_ACCEPTED. Do not present fixed excerpt replay as general paid generation.',
'PASS_WITH_EVIDENCE (local): 12 PDFs, four subjects × three languages, 33 pages each, 19 dynamic charts. Original fixed visuals preserved.',
'PARTIAL: pilot visual acceptance / continuation preserved; full unseen-customer commercial publication not accepted.',
commonProvider+' Determine if admitted deterministic projections suffice; do not add a paid writer or new interpretations merely for API QA.',commonStripe,
'ISOLATED_QA_INJECTION_ONLY adapter exists, old R20 default; R30 projector can be injected. Not production registered; do not promote old profile/version.',
'PASS_WITH_EVIDENCE (local isolated private checks); exact new customer version and shared formal Account chain not admitted.',
'PARTIAL local negatives/replay; real Provider, generic lifecycle recovery and Sandbox refund E2E unverified.',
'SOURCE + CODE + OWNER: admit current unseen-customer interpretation policy and R30 version; reuse local adapter with shared paid context and current publication projector, then targeted delivery QA.'
],
HD:[
'PASS_WITH_EVIDENCE: R3 external user-confirmed chart/source binding is admitted. Internal calculated R5 candidate remains blocked for precision/interpretation/rights; these are separate paths.',
'PASS_WITH_EVIDENCE: R3 professional deterministic personalized corpus. R611 full 17-section / 503 bilingual paragraphs are review-only; configuration variants need own coverage/admission.',
'PASS_WITH_EVIDENCE (local full candidates): R611 zh 83 / en 95 / bilingual 145 pages, existing PDF files; not a six-page P06 sample or accepted commercial full report.',
'PARTIAL: external R3 96-machine / 12-benchmark / 24-human scope admitted; R611 full visual publication review pending. Do not infer native calculation admission.',
commonProvider+' Accepted deterministic path may require no OpenAI; no mandatory paid call added.',commonStripe,
'PASS_WITH_EVIDENCE (local QA fixture): existing HD entitlement candidate/store; verified external chart ownership is a hard input gate. Formal paid adapter absent.',
'PASS_WITH_EVIDENCE (local R611 full files): byte/SHA isolation/cold reopen with seeded payment; not real Checkout/Webhook or Cloud account proof.',
'PARTIAL: local rights/revocation/idempotent delivery exists; actual purchase/recovery/refund/cost chain unverified.',
'OWNER + CODE: choose admitted external-chart product scope; sign exact full publication/config variants; bridge current runtime/publication into shared owner. No native engine redevelopment.'
],
ECR:[
'PASS_WITH_EVIDENCE: native ECR production adapter; newer R12R4B composition admission 48/48 human and 64 machine cases exists. Older blocked receipt does not invalidate this narrower admitted scope.',
'PARTIAL: accepted composition is not full paid manuscript. R31 author-led twenty language bodies/ten sections are exact author-case source, not approved automatic arbitrary-customer writer.',
'PARTIAL: R33 section visual binding approved; R31 visual-only acceptance. No evidence of general customer full paid PDF through formal pipeline. Historical six-page or mandala sample is not full report.',
'PARTIAL: composition admitted; author visual local-only; predecessor full report rejected. Full paid customer publication acceptance still missing.',
commonProvider+' No established approved full-customer Provider manuscript source; no invented fallback.',commonStripe,
'CODE GAP PARTLY FIXED: ECR now participates in prepayment capability checks and denies SHARED_ADAPTER_ABSENT with/without shared flag; no new entitlement/admission granted.',
'NOT VERIFIED for full customer ECR: existing shared store can be reused only after full publication and adapter admission.',
'NOT VERIFIED method full paid chain; common recovery/refund infrastructure exists. Precharge guard now prevents this missing adapter being skipped.',
'SOURCE + OWNER + CODE: define approved customer full-report source/contract preserving author text and composition boundaries; implement only missing shared adapter after admission, then exact PDF/Account QA.'
]};
if(fs.existsSync(r+'/BZR-BATCH-A-OWNER-AUTHORIZATION.json'))rows.BZR[4]='NOT_RUN_PRECONDITIONS_BLOCKED: Owner conditionally approved one synthetic BaZi report, normal + recovery maximum USD3.60; no followup reserve. Project/secret reference, trusted Job dispatch, publication pin and batch identity remain unverified. See BZR-BATCH-A-STATUS.md. Actual Provider calls/cost: 0 / USD0.';
if(fs.existsSync(r+'/PROVIDER-QA-REVOCATION.json')){
for(const id of Object.keys(rows))rows[id][4]='ZERO_COST_REPLAY_ONLY: Owner cancelled new paid Provider QA; no new project/key or budget requested. Historical evidence must match this method, subject and version; no cross-method substitution. '+(id==='BZR'?'Historical 3-call / 18 bilingual units, 7153 input / 20923 output tokens, recorded USD0.447072; current version has PROVIDER_EVIDENCE_VERSION_GAP. See historical manifest.':'No same-scope actual response receipt established by this bounded search; do not infer absence or general Provider PASS.');
rows.BZR[9]='VERSION + CODE + CLOUD: same-subject replay dispatcher and existing compiler passed in isolation; native Account exact bytes/permissions passed separately. They are distinct publications, not continuous native BZR E2E. Bind one historical source through original producer/adapter/publication then verify Sandbox; new paid API QA not requested.';
}
const matrix={schemaVersion:'SIX_METHOD_PAID_CLOSURE_R1',baseline:JSON.parse(fs.readFileSync(r+'/BASELINE.json')),dimensions,methods:Object.entries(rows).map(([methodId,cells])=>({methodId,status:'BLOCKED_WITH_EXACT_REASON',checks:dimensions.map((dimension,i)=>({dimension,result:cells[i]})),evidence:evidence[methodId]})),paidProviderCalls:0,stripeSandboxE2E:'NOT_RUN',cloudWrites:0,publicSaleAdmission:false};
if(fs.existsSync(r+'/compatibility/PDF-INSPECTION.json')){matrix.BaZiCompatibility={historicalProvider:'HISTORICAL_PROVIDER_PASS',versionFlag:'PROVIDER_EVIDENCE_VERSION_GAP',newPaidQaRequired:false,currentDeterministicReplay:'CURRENT_DETERMINISTIC_REPLAY_PARTIAL_WITH_PUBLICATION_DEFECTS',sourceUnits:18,diagrams:15,pdfPages:48,overflowPages:[17,22,29,33],sameFileAccountAdmission:'BLOCKED_PUBLICATION_FIT_AND_QA_SCOPE',details:'compatibility/COMPATIBILITY-RESULT.md'};}
fs.writeFileSync(r+'/SIX-METHOD-STATUS.json',JSON.stringify(matrix,null,2));
let md='# Six Method Automatic Paid Report Closure R1\n\nScope: current main + Report worktree + read-only unified successor. PASS_WITH_EVIDENCE always retains receipt scope; no Live acceptance inferred. All six currently BLOCKED_WITH_EXACT_REASON.\n\n';
for(const [id,cells]of Object.entries(rows)){md+='## '+id+' — BLOCKED_WITH_EXACT_REASON\n\n| Check | Evidence / result |\n|---|---|\n'+dimensions.map((d,i)=>'| '+d+' | '+cells[i].replaceAll('|','/')+' |').join('\n')+'\n\nEvidence:\n\n'+evidence[id].map(e=>'- ['+path.basename(e.path)+']('+e.path+') — SHA256 `'+e.sha256+'`').join('\n')+'\n\n';}
fs.writeFileSync(r+'/SIX-METHOD-MATRIX.md',md);
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
fs.writeFileSync(r+'/HUMAN-REVIEW.html','<!doctype html><meta charset="utf-8"><title>Six Method Paid Closure R1 — review packet</title><style>body{font:16px/1.65 system-ui;max-width:1180px;margin:40px auto;color:#183044}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bbc9d0;padding:12px;text-align:left}h2{margin-top:50px}a{color:#185ba4}.gate{background:#fff2d4;padding:18px}</style><h1>六方法自动付费报告：证据与待准入项</h1><p class="gate">六项均为 BLOCKED_WITH_EXACT_REASON。此页是专项审阅附件，不是第二个 Master；未修改唯一 Master 或签发任何 ACCEPT。Provider 调用 0，云端写入 0，实际 Sandbox E2E 未运行。</p><p><a href="SIX-METHOD-MATRIX.md">完整矩阵</a> · <a href="TARGETED-ZERO-COST-QA.json">18 项定向 QA</a> · <a href="NEXT-MINIMAL-ACTIONS.md">最小执行清单</a> · <a href="REAL-PROVIDER-QA-PLAN.md">Provider 预算与隔离计划</a> · <a href="INTEGRATION-HANDOFF.md">合入交接</a></p>'+Object.entries(rows).map(([id,cells])=>'<h2>'+id+' — BLOCKED_WITH_EXACT_REASON</h2><table>'+dimensions.map((d,i)=>'<tr><th>'+esc(d)+'</th><td>'+esc(cells[i])+'</td></tr>').join('')+'</table>').join(''));
console.log('Wrote six-method matrix, hash evidence index and review attachment; no Master changed.');
if(fs.existsSync(r+'/BZR-BATCH-A-STATUS.md'))fs.appendFileSync(r+'/HUMAN-REVIEW.html','<h2>BaZi Batch A：条件预算已批准，执行仍拦截</h2><p>最多一份合成报告、正常及恢复累计 US$3.60，不使用追问预留。7/7 定向成本检查通过；Project 引用、可信调度、出版来源和批次绑定仍待验证。Provider 0 / USD0。</p><p><a href="BZR-BATCH-A-STATUS.md">本批次状态</a> · <a href="BZR-BATCH-A-PREFLIGHT.json">零费用检查回执</a> · <a href="BZR-BATCH-A-OWNER-AUTHORIZATION.json">条件授权记录</a></p>');
if(fs.existsSync(r+'/PROVIDER-QA-REVOCATION.json')){let current=fs.readFileSync(r+'/HUMAN-REVIEW.html','utf8');current=current.replace('BaZi Batch A：条件预算已批准，执行仍拦截','历史记录：BaZi Batch A 条件预算已由后续 Owner 决策取消');fs.writeFileSync(r+'/HUMAN-REVIEW.html',current);fs.appendFileSync(r+'/HUMAN-REVIEW.html','<h2>最新决策：取消付费 QA，继续历史来源回放交付</h2><p>Provider Calls = 0 / USD0。历史 3 次真实调用覆盖 18 个双语单元，当前版本差异明确保留。共享调度与 Assembly 回放通过；复制状态中的原生 Account 10 项检查通过；两段 Publication 身份不同，不算商业 E2E。</p><p><a href="ZERO-COST-REPLAY-CONTINUATION.md">完整范围与下一步</a> · <a href="HISTORICAL-PROVIDER-REPLAY-MANIFEST.json">历史来源 Manifest</a> · <a href="REPLAY-JOB-ASSEMBLY-QA.json">调度与 Assembly</a> · <a href="REPLAY-NATIVE-ACCOUNT-CHECKS.json">原生 Account</a> · <a href="PROVIDER-QA-REVOCATION.json">授权取消</a></p>');}
if(fs.existsSync(r+'/compatibility/PDF-INSPECTION.json'))fs.appendFileSync(r+'/HUMAN-REVIEW.html','<h2>BaZi：最小版本兼容性验证</h2><p>HISTORICAL_PROVIDER_PASS 与 PROVIDER_EVIDENCE_VERSION_GAP 独立保留，不要求重复收费。旧 Prompt 和三个 Batch Digest 均匹配真实回执；18 个原始正文单元/Authority 回放，15 图结构通过。实际 48 页 PDF 有 44 个书签，333 个已选正文片段可提取；P17/P22/P29/P33 溢出，整体回放尚不能标 PASS。该候选没有进入正式客户 Artifact Store。</p><p><a href="compatibility/COMPATIBILITY-RESULT.md">准确结论</a> · <a href="compatibility/PROMPT-BATCH-SEMANTIC-DIFF.json">Prompt/Batch 语义差异</a> · <a href="compatibility/PDF-INSPECTION.json">PDF 检查</a> · <a href="compatibility/SYNTHETIC-BZR-HISTORICAL-CURRENT-REPLAY.pdf">实际 QA PDF</a> · <a href="compatibility/PDF-CONTACT.jpg">实际 PDF 截图</a></p>');
const html=fs.readFileSync(r+'/HUMAN-REVIEW.html','utf8');const refs=[...html.matchAll(/href="([^"]+)"/g)].map(x=>x[1]);const missing=refs.filter(x=>!fs.existsSync(path.join(r,x)));for(const f of ['SIX-METHOD-STATUS.json','EVIDENCE-INDEX.json','PROVIDER-QA-CONFIG.json','TARGETED-ZERO-COST-QA.json'])JSON.parse(fs.readFileSync(path.join(r,f)));fs.writeFileSync(r+'/REVIEW-DELIVERY-CHECK.json',JSON.stringify({reviewLinks:refs.length,missing,jsonFilesValid:4,globalMasterModifiedByThisTask:false,providerCalls:0,cloudWrites:0},null,2));if(missing.length)throw Error('Missing review links '+missing);
