import fs from 'node:fs';
import {createHash} from 'node:crypto';
const dir='tools/review/numerology-r20',master='content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html';
const read=n=>JSON.parse(fs.readFileSync(`${dir}/${n}.json`,'utf8'));
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pdf=read('PDF-RESULTS'),qa=read('PDF-PAGE-QA'),delivery=read('DELIVERY-QA'),compile=read('COMPILE-RECEIPT');
if(qa.reports.some(r=>r.pdfSHA256!==pdf.results.find(p=>p.locale===r.locale)?.sha256))throw Error('STALE_PDF_QA');
for(const p of pdf.results)if(!delivery.rows.find(r=>r.details?.pdfSHA256===p.sha256&&r.status==='PASS'))throw Error('STALE_DELIVERY_QA');
const gaps=[
 ['SEMANTIC / BILINGUAL','PARTIAL','19页复用真实计算与已准入含义，但新增组织、图表和观察问题为本地编辑候选，未取得作者正文接受。P17不把姓名平面分布扩写为职业能力结论。'],
 ['CALCULATION','PARTIAL','原生 Energy 流年在闰日出生、非闰年目标日期上生成无效派生日期；该分支保持未知，独立 Western 周期保留。Y及未核定姓名规则不补造。'],
 ['CLOUD / ENTITLEMENT','BLOCKED','本轮为现有PWS、PRIVATE_REPORTS和下载授权接口的隔离注入，生产NUM适配器未登记。订单付款状态由合成QA SQL提供，不是Stripe签名Webhook自动发放验证。'],
 ['PRIVATE / DEPLOYED / LIVE','NOT_EXECUTED','未执行云端水印、正式账户、生产部署或真实支付；新出版内容与现有生产composer/profile准入需一致核定。'],
 ['VISUAL PRINT','PARTIAL','源图约128 dpi；PDF采用原尺寸JPEG quality100 4:4:4编码以满足既有32MiB上限。原WebP字节保留，PDF不是像素无损；PSNR证据单列。尚无实体印刷打样。']
];
const receipt={status:'PARTIAL_LOCAL_REVIEW_CANDIDATE',SOURCE:'PASS_EXISTING_ACCEPTED_SOURCES_REUSED_NOT_NEW_EDITORIAL_ACCEPTANCE',CALCULATION:'PARTIAL_ENERGY_DERIVED_DATE_GAP',SEMANTIC:'PARTIAL_EDITORIAL_CANDIDATE',BILINGUAL:'PARTIAL_ALIGNED_UNITS_NOT_AUTHOR_ACCEPTED',ASSETS:'PASS_26_SOURCE_BYTES_9_SHARED_INSERTS',PDF:'PASS_THREE_33_PAGE_LOCAL_PDFS_NOT_PRINT_PROOF',CLOUD:'NOT_EXECUTED',ENTITLEMENT:'PASS_ISOLATED_QA_ONLY',PRIVATE:'PASS_LOCAL_TRANSPORT_ONLY',DEPLOYED:'NO',LIVE:'NOT_EXECUTED',commercialContract:{singleLanguageMYR:39,bilingualAddOnMYR:10,bilingualMYR:49,modelBudgetUSD:2,includedFollowups:4,productionActivated:false},providerCalls:0,productionWrites:0,r2Writes:0,stripeMutations:0,commit:0,push:0,deploy:0,gaps,inputs:compile.inputDigest,pdfs:pdf.results};
fs.writeFileSync(`${dir}/CURRENT-STATUS.json`,JSON.stringify(receipt,null,2));
const link=(path,label)=>`<a href="../../../${path}">${esc(label)}</a>`;
let section=`<section id="numerology-r20"><h2>Numerology R2.0 · 本地出版与隔离交付候选</h2><p><strong>PARTIAL — 不是生产发布或 Human ACCEPT。</strong>保留24个逻辑页，九张双语固定插页位于6、9、11、16、19、22、25、28、31；三版各33张A4。固定图不叠加客户结果，正文使用BODY。所有示例为合成资料。</p><p>本轮读取已确认的R2 public-assets目录；9张插页均取得真实WebP并核对SHA、尺寸和解码。原401列举失败保留；没有将列举失败写成文件缺失。</p><ul>`;
for(const p of pdf.results)section+=`<li>${link(p.file,p.locale+' 完整PDF')} — ${p.pages}页，${p.bytes} bytes；SHA256 <code>${p.sha256}</code> · ${link(`output/pdf/numerology-r20/${p.locale}/REPORT.html`,'完整正文/版面HTML')}</li>`;
section+='</ul><p>正文使用原生NUM与既有含义，不通过AI生成。真实输出、十九页全文、来源单元及图表分别保留；不以图示或计算通过冒充全文语义验收。</p><table><thead><tr><th>范围</th><th>状态</th><th>限制 / 下一动作</th></tr></thead><tbody>';
for(const g of gaps)section+=`<tr><td>${g[0]}</td><td>${g[1]}</td><td>${esc(g[2])}</td></tr>`;
section+=`</tbody></table><h3>实际检查与历史失败</h3><p>聚焦检查37项通过；现有客户主入口64例通过。7项隔离交付通过：三版真实PDF保存、下载与重开字节一致，跨账户、错误语言、过期、退款撤权及失败恢复受控；既有四问权益幂等发放。付款状态为合成QA，不能作为自动收款交付证据。</p><p>历史check:num-production缺少personal-runtime.html、rich检查旧命令摘要失败保留；后者仅按现有零费用wrapper解析做successor校验，原断言未放宽。初轮大PDF超过32MiB、双语溢出、字体提取及最终P24缺英文状态的失败与修补均保留，不改写为首次成功。</p><ul>`;
for(const [f,l] of [['ASSET-CHECKS','九张来源资产'],['ASSET-VISUAL-REVIEW','资产目视核对'],['CONTENT-COVERAGE','正文范围与缺口'],['FOCUSED-CHECKS','37项聚焦检查'],['BASE-REGRESSIONS','历史回归原结果'],['RICH-WRAPPER-SUCCESSOR','Wrapper successor'],['PDF-PAGE-QA','99页核对'],['PDF-ENCODING-FIDELITY','PDF编码与源字节区别'],['DELIVERY-QA','隔离交付7项'],['COMPILE-RECEIPT','当前352输入编译收据'],['CURRENT-STATUS','当前状态']])section+=`<li>${link(`${dir}/${f}.json`,l)}</li>`;
section+=`<li>${link('output/pdf/numerology-r20/CONTENT-19-BILINGUAL.json','十九页完整双语单元')}</li></ul><details><summary>当前99页截图</summary>`;
for(const p of pdf.results){section+=`<h4>${p.locale}</h4>`;for(let i=1;i<=3;i++)section+=`<a href="../../../output/pdf/numerology-r20/${p.locale}/contact-${i}.png"><img loading="lazy" style="max-width:100%;width:700px" src="../../../output/pdf/numerology-r20/${p.locale}/contact-${i}.png" alt="${p.locale} pages ${i}"></a>`;}
section+='</details><p>Provider、生产/R2写入、Stripe变更、commit/push/deploy均为0。其他窗口HD与清理修改保留，按UNRELATED_CONCURRENT_CHANGE处理；相关输入摘要代替全工作树新鲜度。编译为本地四入口bundle，不冒充Pages发布构建。</p></section>';
let html=fs.readFileSync(master,'utf8');const a='<!-- NUM_R20_CURRENT_START -->',b='<!-- NUM_R20_CURRENT_END -->';if(html.includes(a)){const start=html.indexOf(a),end=html.indexOf(b,start)+b.length;html=html.slice(0,start)+a+section+b+html.slice(end);}else html=html.replace('<main>','<main>'+a+section+b);fs.writeFileSync(master,html);
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const stable=compile.inputs.every(x=>hash(x.path)===x.sha256);if(!stable)throw Error('RELEVANT_COMPILE_INPUT_CHANGED');
fs.writeFileSync(`${dir}/CHECKPOINT.json`,JSON.stringify({state:'LOCAL_REVIEW_DELIVERED_PARTIAL',master,relatedCompileInputsStable:stable,pdfHashes:pdf.results.map(p=>p.sha256),providerCalls:0,productionWrites:0},null,2));console.log('Updated existing Master; relevant compile inputs stable.');
