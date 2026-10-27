import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const d='tools/review/hd-r6/import-20261027/r63/',master='content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html';
const j=p=>JSON.parse(fs.readFileSync(p)),hash=b=>createHash('sha256').update(b).digest('hex'),sha=p=>hash(fs.readFileSync(p)),git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim(),out=(p,v)=>fs.writeFileSync(d+p,JSON.stringify(v,null,2)+'\n');
const at=new Date().toISOString(),baseline=j(d+'BASELINE.json'),delta=j(d+'SOURCE-DELTA.json'),pdf=j(d+'PDF-MANIFEST.json');
assert.equal(git('rev-parse','HEAD'),baseline.head,'HEAD drift; re-evaluate before closure');
assert.equal(sha(delta.file),delta.afterSHA256,'Renderer source drift');
assert.equal(git('diff','--cached','--name-only'),'','Index changed');
const preservation=baseline.files.map(f=>({path:f.path,before:f.sha256,after:sha(f.path),intentionalCurrentSourceSuccessor:f.path===delta.file,unchanged:sha(f.path)===f.sha256}));
const unexpected=preservation.filter(f=>!f.unchanged&&!f.intentionalCurrentSourceSuccessor);
assert.deepEqual(unexpected,[],'Historical artifact drift');
for(const f of pdf.files)assert.equal(sha(f.path),f.sha256);
const parallel=git('diff','--name-only').split('\n').filter(p=>p&&p!==delta.file&&p!==master).map(p=>({path:p,sha256:sha(p)}));
const review={at,status:'PASS_LOCAL_PARTIAL_LAYOUT_REVIEW',method:'Actual inspection of all11 final contact sheets covering85pages, plus6 full-size representative pages; machine per-paragraph geometry/text checks independently retained',pages:85,formats:pdf.files.map(f=>({format:f.format,pages:f.pages,sha256:f.sha256})),contacts:fs.readdirSync(d).filter(p=>p.startsWith('pdf-contact-')),fullSize:fs.readdirSync(d).filter(p=>p.startsWith('final-')&&p.endsWith('.png')),observed:{clipping:false,overlap:false,tofuGlyphs:false,pageNumberMismatch:false,abnormallyShortContinuation:false,bodyHierarchy:'Consistent teal headings and embedded Chinese/Latin text; appendix deliberately10pt; source manuscript prose unchanged',bilingual:'Actual Chinese and English per section; same3 fixed bilingual candidate artworks',lastAppendix:'English final appendix page has normal end-of-section whitespace, not an orphan continuation defect'},priorFailure:'PDF-QA-FIRST.json retained; original2+3-line appendix split corrected without prose edits',semanticAndVisualPublication:'NOT_APPROVED_BY_LAYOUT_QA',artworkHolds:['SEC02 malformed label needs visual owner','SEC10 Cognition fixed artwork withheld','SEC11 fresh public object unchanged, Inner Vision/sensory mapping unresolved'],physicalA4MicrotextAcceptance:'PENDING_OWNER; contact rendering does not prove physical print readability',noNewImagesGenerated:true};
out('VISUAL-QA.json',review);
out('PRESERVATION-CHECK.json',{at,total:preservation.length,unchanged:preservation.filter(f=>f.unchanged).length,intentionalSourceSuccessors:preservation.filter(f=>!f.unchanged&&f.intentionalCurrentSourceSuccessor),unexpected,files:preservation,parallelSourcePins:parallel,scope:'Historical receipts, manuscripts and PDFs unchanged; one expressly authorized current renderer layout successor, no frozen receipt hash rewritten'});
const blockers=[
 {id:'PARAGRAPH_SEMANTIC_AND_ORIGINALITY',owner:'Owner/editorial rights reviewer + qualified HD semantic reviewer',needed:'Independently review exact226 paragraph ledger and211 legacy meaning-module scope; standard terminology alone does not require chapter-wide third-party permission. New expression is not automatically legally cleared. Bridge external-confirmed-chart meanings to actual internally calculated source explicitly.'},
 {id:'CONFIGURATION_CONTENT_GAPS',owner:'HD content author and semantic reviewer',needed:'Provide missing accepted original connective/conditional content in13 bounded briefs; observed calculation diversity is not interpretation coverage. Preserve5 existing relationship findings and6 reality question structures.'},
 {id:'CALCULATION_PRECISION',owner:'Existing deterministic calculation owner',needed:'Resolve independent frozen Venus46.2/46.3 and Tone precision exceptions. Preserve779/780 and117/120 historical partial accuracy evidence; do not repair through prose.'},
 {id:'CROSS_SHORT_NAME_FALLBACK',owner:'Owner product authority',needed:'Explicitly decide whether future product may show verified ordered four-Gate identity plus approved original narrative when short name is unverified. Current namedCross=null; no feature promise silently removed.'},
 {id:'HD_FIXED_ARTWORK',owner:'Visual/semantic/rights owner',needed:'ResolveSEC02 malformed label, SEC10 withdrawn Cognition, SEC11 Inner Vision/seven-entry sensory mapping. Supply exact revised key/SHA if revised. Shared registry still has0 HD assets/mappings; cached17 and freshSEC11 read do not establish production admission.'},
 {id:'OPTIONAL_PHS',owner:'Existing PHS semantic/rights owner',needed:'Two SEC15.11/P3 language paragraphs remain held on optionalPHS consent/semantic/rights admission; no substitute paragraph generated.'},
 {id:'FULL_CUSTOMER_RELEASE',owner:'Existing commerce/account/release owners',needed:'All17 substantive accepted applicable bodies, exact calculation/semantic/rights gates, full authorized delivery and separately approved production release. Local seededQA is not a real paid-customer proof.'}
];
out('REMAINING-BLOCKERS.json',{at,blockers,nextSmallestStep:'Review FIRST-CHATGPT-WRITING-BATCH.md: only SEC02 Generator + SEC03 Emotional Authority missing original connective paragraphs, preserving9/11 existing source pairs and four accepted chapters. No provider invocation performed.'});
const states={CONTENT_READY:'PARTIAL',CALCULATION_READY:'PARTIAL',PDF_READY:'PASS_LOCAL_PARTIAL_REPORTS',ENTITLEMENT_READY:'PARTIAL_ISOLATED_QA',PAYMENT_READY:'PARTIAL_PRICE_AND_SEEDED_QA_NO_REAL',COMMERCIAL_RIGHTS_READY:'BLOCKED',PRODUCTION_READY:'BLOCKED_NOT_DEPLOYED',FULL_17_SECTION_REPORT:'BLOCKED'};
out('READINESS.json',{at,candidateId:baseline.candidateId,status:'READY_FOR_LOCAL_HUMAN_REVIEW_WITH_NAMED_BLOCKERS',states,coverage:{R51UniqueBilingualExcerptObjects:240,R51Sections:9,R62LanguageParagraphs:226,R62Selected:224,longBodyOrExcerptSections:11,additionalSEC12BilingualFindings:5,sourceBoundRealityQuestions:6,customerEligibleSections:0},providerCalls:0,costUSD:0,realPayments:0,realRefunds:0,productionWrites:0,remoteR2Writes:0,commits:0,pushes:0,deployments:0});
const link=(file,label)=>`<a href="../../../${d}${file}">${label}</a>`,pLink=f=>`<a href="../../../${f.path}">${f.format} · ${f.pages}页 · RM${f.amountMinor/100}</a>`;
const deliveries=[['A','HD-R63-17-SECTION-COVERAGE-MATRIX.json','17章逐语言覆盖矩阵'],['B','CONFIGURATION_COVERAGE_GAPS.json','配置与内容缺口'],['C','R51-R62-REUSE-DISPOSITION.json','R5.1／R6.2去重复用'],['D','PRESERVATION-CHECK.json','已接受原文／历史PDF保留'],['E','CONFIGURATION-COVERAGE-TESTS.json','SEC10退出及实际96图测试'],['F','BOOK-AND-COGNITION-EXCLUSION-PROOF.json','Book of Destinies边界证明'],['G','SEMANTIC-RIGHTS-ADMISSION.json','逐段语义／权利台账'],['H','CROSS-ORIGINAL-CONTENT-STRATEGY.json','四Gate身份／待批短名回退'],['I','VISUAL-ASSET-AUDIT.json','17张实际资产审计'],['J','PDF-QA.json','分页及逐段文字验证'],['K','PDF-MANIFEST.json','三语真实样张／摘要'],['L','HD-R63-REMAINING-AUTHORING-HANDOFF.md','13份依赖顺序写作简报'],['M','REMAINING-BLOCKERS.json','责任Owner与准确阻断'],['N','FIRST-CHATGPT-WRITING-BATCH.md','下一最小写作批次']];
const section=`\n<!-- HD-R63-20261027:BEGIN -->
<section id="HD-R63-17-SECTION-CONVERGENCE" style="margin:24px;padding:24px;border:2px solid #a68a4c;background:#f5f8f7;color:#143c4b;overflow-wrap:anywhere">
<h2>Human Design R6.3 · 17章内容收敛与出版准备</h2>
<p><strong>READY_FOR_LOCAL_HUMAN_REVIEW_WITH_NAMED_BLOCKERS · FULL_17_SECTION_REPORT = BLOCKED</strong></p>
<p>候选 ${baseline.candidateId}；HEAD ${baseline.head}。四章中英编辑接受保持；不扩大为版权、语义或商业发布通过。未制作假完整17章报告。</p>
<h3>实际内容与复用</h3><p>R5.1有240个唯一双语来源摘录对象、涉及9章；R6.2有226个逐语言段落、涉及4章，实际选用224段。两者单位不同，不相加为完成率。去重后11章具备长正文或来源摘录；另有SEC12的5条真实双语条件应用结果、SEC16/17可复用6条绑定来源的问题结构。标题和海报不算正文，一种命盘文本不算全配置。当前可商业准入章节仍为0。</p>
<p>实际96个合成客户调用既有确定性计算、签名快照及R5选择器；观察5种Type、6种Authority、4种Definition、10种Profile、36条Channel、64个Gate、379种Gate.Line、94个有序Cross。它们证明结构／选择边界，不证明所有解释已写成或天文精度全部通过。</p>
<h3>真实PDF与交付验证</h3><p>${pdf.files.map(pLink).join(' · ')}。均为SEC07/09/10/15四章私人审阅样张，非可售完整产品；三语复用同3张固定双语候选图。双语含原始中英正文。原始R5.1和R6.2样张未覆盖。</p>
<p>85页已生成、逐段原文及顺序核对、11张联系表和6张原尺寸代表页已查看。${link('PDF-QA-FIRST.json','首次2＋3行失败')}保留；修复后无孤行失败、无异常短续页。${link('VISUAL-QA.json','画面复核')}不代替版权、语义或物理A4小字人审。</p>
<p>唯一源码改动是既有private-pdf-renderer的显式reviewOnly＋HD_R63_BALANCED_V1分支。${link('RENDERER-REGRESSION.json','编译及默认路径几何对照')}通过，默认／发布路径不变。${link('SOURCE-DIFF.patch','精确源码差异')}；${link('SOURCE-DELTA.json','前后摘要')}。现有存储／权益／下载owner的隔离QA通过保存、新实例重开、精确字节下载、免生成重下及越权／错语言／过期／撤销／不可变替换拒绝。${link('COMMERCIAL-DELIVERY-QA.json','真实本地执行回执')}；仅合成订单，未真实收费。</p>
<h3>权利与视觉边界</h3><p>${link('SEC09-OWNER-RIGHTS-DECISION.json','Owner明确决定')}：Book of Destinies长篇不得用于商业正文、翻译、近似改写、prompt、vector、fallback或192项重建；历史私有出处保留。静态扫描1542文件未发现该书／作者引用，不等于原创性法律证明。numeric Tone保留，Cognition语义退出；两个可选PHS段落继续hold。</p>
<p>17张缓存图的SHA及1024×1536解码已核对；共享正式登记当前HD资产／映射仍为0。SEC11新鲜公开GET=200，但SHA与旧版相同，未确认修订图；Inner Vision与七项感官映射仍待核对。SEC02错字／重叠、SEC10 Cognition、SEC11均有具体hold，不进入本轮新PDF。${link('VISUAL-DISPOSITIONS.json','逐图处置')}；${link('SEC11-FRESH-READ.json','SEC11实际读取')}。三张附录固定图也不冒充客户计算图或生产视觉批准。</p>
<h3>A–N交付</h3><ol>${deliveries.map(([id,f,label])=>`<li>${id}. ${link(f,label)}</li>`).join('')}</ol>
<h3>独立状态</h3><table border="1" cellpadding="7" style="border-collapse:collapse"><tbody>${Object.entries(states).map(([k,v])=>`<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</tbody></table>
<h3>准确剩余阻断</h3><ul>${blockers.map(b=>`<li><strong>${b.id}</strong> — ${b.owner}：${b.needed}</li>`).join('')}</ul>
<p>下一最小执行项：${link('FIRST-CHATGPT-WRITING-BATCH.md','SEC02 Generator＋SEC03 Emotional Authority写作包')}，仅补原始衔接解释，保留9／11组既有来源和四章长段原稿。未调用ChatGPT／Provider。首批不要求重写全部13章。</p>
<p>本轮Provider 0／USD0，真实付款／退款0／0，生产／远端R2写入0，Stripe变更0，commit／push／deploy0。其他窗口Numerology改动保留，未合并为本轮证据。${link('FINAL-CHECKPOINT.json','可恢复接续记录')}。</p>
</section>
<!-- HD-R63-20261027:END -->\n`;
const before=fs.readFileSync(master,'utf8');assert(!before.includes('<!-- HD-R63-20261027:BEGIN -->'),'R63 already appended; do not duplicate');
fs.writeFileSync(master,before+section);
assert.equal(fs.readFileSync(master,'utf8').slice(0,before.length),before);
for(const p of parallel)assert.equal(sha(p.path),p.sha256,'Concurrent source changed while closing');
out('MASTER-APPEND-PROOF.json',{at,path:master,beforeSHA256:hash(before),afterSHA256:sha(master),previousBytesPreserved:true,addedBlock:'HD-R63-20261027',historicalBlocksUnchanged:true});
const localLinks=[...section.matchAll(/href="([^"]+)"/g)].map(m=>path.resolve(path.dirname(master),m[1]));
// Checkpoint is written below; all other exact links must already exist.
assert.deepEqual(localLinks.filter(p=>!p.endsWith('FINAL-CHECKPOINT.json')&&!fs.existsSync(p)),[]);
const sourcePins=[delta.file,...parallel.map(p=>p.path)].map(p=>({path:p,sha256:sha(p)}));
out('FINAL-CHECKPOINT.json',{at,status:'R63_LOCAL_HUMAN_REVIEW_READY_COMMERCIAL_BLOCKED',head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),index:git('diff','--cached','--name-only'),gitStatus:git('status','--short'),candidateId:baseline.candidateId,masterAnchor:'HD-R63-17-SECTION-CONVERGENCE',sourcePins,protectedArtifacts:preservation.length,protectedUnchanged:preservation.filter(f=>f.unchanged).length,intentionalRendererSuccessor:delta,tests:{configuration:'96 actual snapshots /15 grouped checks',pdf:'85 pages / all224 language paragraphs retained / no new widow-orphan or sparse continuation failures',defaultRenderer:'Exact text and geometry before/after controls + compile',delivery:'3formats existing isolated owner save/reopen/download/redownload + denials'},resume:'Human review exact rights/semantic/visual blockers; next original authoring SEC02 Generator andSEC03 Emotional only. Do not rerun unchanged history or overwrite parallel work.',states,providerCalls:0,costUSD:0,realPayments:0,realRefunds:0,productionWrites:0,remoteR2Writes:0,commits:0,pushes:0,deployments:0});
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
out('DELIVERY-MANIFEST.json',{at,head:baseline.head,files:[...walk(d.slice(0,-1)),...pdf.files.map(f=>f.path),master,delta.file].filter(p=>!p.endsWith('/DELIVERY-MANIFEST.json')).map(p=>({path:p,bytes:fs.statSync(p).size,sha256:sha(p)})),scope:'Exact final local candidate, no full17 publication claim'});
console.log(JSON.stringify({status:'R63_LOCAL_HUMAN_REVIEW_READY_COMMERCIAL_BLOCKED',protected:preservation.length,unchanged:preservation.filter(f=>f.unchanged).length,parallel:parallel.length,pdfPages:85,masterLinksChecked:localLinks.length}));
