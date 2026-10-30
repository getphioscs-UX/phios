"""Human-review delivery only. No source edits, acceptance or deployment."""
import json,math,hashlib,subprocess,html,sys
from pathlib import Path
from audit import ROOT,read,save,sha
from pypdf import PdfReader
NAMES={'AST':'Astrology 占星','BZR':'BaZi 八字','ZWR':'ZiWei 紫微','NUM':'Numerology 数字学','HD':'Human Design 人类图','ECR':'PHI Configuration 构型'}
def mib(n):return f'{n/1048576:.2f}'
def mdtable(headers,rows):return'| '+' | '.join(headers)+' |\n| '+' | '.join(['---']*len(headers))+' |\n'+''.join('| '+' | '.join(map(str,r))+' |\n'for r in rows)
def textfile(name,s):(ROOT/name).write_text(s,encoding='utf-8')
def main():
 audit=read(ROOT/'SIZE-AUDIT.json');results=read(ROOT/'OPTIMIZATION-RESULTS.json')['rows'];visual=read(ROOT/'VISUAL-COMPARISON.json');owners=read(ROOT/'SOURCE-OWNERS.json');pricing=read(ROOT/'PRICING-SOURCE.json');primary=[r for r in audit['reports']if r.get('primary')];q87={r['reportId']:r for r in results if r['quality']==87}
 assert len(results)==24 and all(r['passStructural']for r in results)
 assert len(visual['rows'])==60 and all(r['metrics']['pixelIdentical']for r in visual['rows']if r['quality']is None)
 drift=[r['path']for r in audit['reports']if sha(Path(r['path']).read_bytes())!=r['sha256']];source_drift=[x['path']for x in owners['sourceFiles']if x['exists']and sha(Path(x['path']).read_bytes())!=x['sha256']]
 recheck=read(ROOT/'CONCURRENT-SOURCE-RECHECK.json')if(ROOT/'CONCURRENT-SOURCE-RECHECK.json').exists()else{'changes':[]};reconciled={x['path']:x['currentSHA256']for x in recheck['changes']if x.get('reconciledForFrozenPdfAudit')};unreconciled=[p for p in source_drift if reconciled.get(p)!=sha(Path(p).read_bytes())]
 budgets=[];provenance=[]
 for r in primary:
  opt=q87[r['id']];detail=read(ROOT/'proofs'/r['method']/(Path(opt['output']).stem+'-DETAIL.json'));other=max(0,r['fileBytes']-r['totalEncodedImageBytes']-r['fontStreamBytes']);budget=math.ceil(detail['totalEncodedImageBytes']+r['fontStreamBytes']+other*1.30+65536)
  budgets.append({'id':r['id'],'method':r['method'],'pages':r['pageCount'],'uniqueImages':r['imageObjectCount'],'optimizedImageBytes':detail['totalEncodedImageBytes'],'fontBytes':r['fontStreamBytes'],'observedNonImageNonFontBytes':other,'illustrativeWarningBudgetBytes':budget,'optimizedBytes':opt['optimizedBytes'],'withinWarningBudget':opt['optimizedBytes']<=budget,'definition':'Unique Q87 artwork payload + current font payload + 1.30 * observed residual streams/catalogue + 64KiB. Specimen-calibrated warning, NOT a universal limit or production admission.'})
 for opt in results:
  a=PdfReader(opt['source']);b=PdfReader(opt['output']);old={str(k):str(v)for k,v in(a.metadata or{}).items()};new={str(k):str(v)for k,v in(b.metadata or{}).items()};meta=all(new.get(k)==v for k,v in old.items());boxes=all(all([float(v)for v in getattr(x,box)]==[float(v)for v in getattr(y,box)]for box in['mediabox','cropbox','trimbox','bleedbox','artbox'])and x.get('/UserUnit',1)==y.get('/UserUnit',1)for x,y in zip(a.pages,b.pages));annots=all(len(x.get('/Annots',[]))==len(y.get('/Annots',[]))for x,y in zip(a.pages,b.pages));provenance.append({'id':opt['reportId'],'quality':opt['quality'],'allOriginalMetadataValuesRetained':meta,'allFivePageBoxesAndUserUnitExact':boxes,'annotationCountsRetained':annots,'derivativeSourceSHA256':str(b.metadata.get('/PHIOSOptimizationSourceSHA256')),'sourceSHA256Bound':str(b.metadata.get('/PHIOSOptimizationSourceSHA256'))==opt['sourceSHA256'],'pass':meta and boxes and annots})
 assert all(p['pass']for p in provenance);save('PROVENANCE-AND-BOUNDARIES.json',{'rows':provenance,'scope':'All original document metadata, all five page boxes/UserUnit, annotation counts and source SHA. No claim of new customer authorization or cryptographic signature validation.'});save('PAGE-AND-ARTWORK-BUDGETS.json',{'rows':budgets,'currentTransportLimitsNotChanged':True})
 economic=[]
 for r in primary:
  opt=q87[r['id']]
  for count in[1000,10000,100000]:
   cost=lambda gb:round(math.ceil(max(0,gb-10))*.015,4)
   before=count*r['fileBytes']/1e9;after=count*opt['optimizedBytes']/1e9;both=before+after
   economic.append({'method':r['method'],'specimen':r['id'],'reports':count,'originalGB':round(before,6),'compactGB':round(after,6),'legacyPlusCompactGB':round(both,6),'originalStorageUsdMonth':cost(before),'newCompactStorageUsdMonth':cost(after),'legacyPlusCompactStorageUsdMonth':cost(both),'scope':'One specimen repeated, stable 30-day storage, exclusive full 10GB free allowance; actual account mix/billing unknown. No render CPU, IR/HTML, other account objects or taxes included.'})
 save('STORAGE-COST-SCENARIOS.json',{'priceSource':pricing,'rows':economic})
 qrows=[]
 for r in primary:
  for q in[None,76,82,87]:
   o=next(x for x in results if x['reportId']==r['id']and x['quality']==q);vv=[x for x in visual['rows']if x['reportId']==r['id']and x['quality']==q];ps=[x['metrics']['psnrRGBdB']for x in vv if isinstance(x['metrics']['psnrRGBdB'],(int,float))];ss=[x['metrics']['ssim8x8LuminanceMean']for x in vv];qrows.append([r['method'],r['pageCount'],'无损结构整理'if q is None else f'JPEG {q}/444',mib(r['fileBytes']),mib(o['optimizedBytes']),f"{o['reductionPercent']:.2f}%",f"{o['encoderWallSeconds']:.3f}/{o['encoderCpuSeconds']:.3f}",'pixel exact'if q is None else f'{min(ps):.2f} / {min(ss):.5f}'])
 summary=mdtable(['方法','页数','原始 MiB','图片占比','唯一图片/绘制引用','字体 KiB','Q87 MiB','Q87 减少'],[[r['method'],r['pageCount'],mib(r['fileBytes']),f"{r['imageShareOfFile']*100:.2f}%",f"{r['imageObjectCount']}/{r['imageDrawReferences']}",f"{r['fontStreamBytes']/1024:.1f}",mib(q87[r['id']]['optimizedBytes']),f"{q87[r['id']]['reductionPercent']:.2f}%"]for r in primary])
 textfile('OPTIMIZATION-BEFORE-AFTER.md',f'''# PHIOS-REPORT-STORAGE-OPTIMIZATION-R1 — 实测结果

状态：LOCAL OPTIMIZATION PROOF / HUMAN REVIEW REQUIRED。不是 Human ACCEPT、生产接入或 Live Customer 验收。

## 范围和原始事实

只读检查 {len(audit['reports'])} 份明确选定的现有 PDF，覆盖六个报告家族及不同历史/语言版本。不是整个仓库或生产 R2 的全量存储盘点。六个优化代表共 {sum(r['pageCount']for r in primary)} 页；每个代表生成无损整理、JPEG 76、82、87 四份独立副本，共 24 份。所有原 PDF 保持原路径和 SHA，全部输出仅在本目录。

{summary}
## 原因分别确认

- AST：16 个 Flate 图片对象，共 {mib(primary[0]['totalEncodedImageBytes'])} MiB；BODY 引用复用。WebP 经当前 Chromium 形成 RGB/ICC Flate 样本。
- BZR：受控 P7 原生报告 48 页，15 个 Flate 图片，BODY 在多页复用。原生导出链与主 R2 清单并非同一资产入口；不把四页 BODY 诊断当完整报告。
- ZWR：68 页当前本地组合，16 个 Flate 图片；不是 68 份背景。
- NUM：33 页，15 个 JPEG 图片；既有转换显式 quality100 / 4:4:4。BODY 存一份并绘制 19 次。已有资源复用，不需要重新发明去重器。
- HD：145 页双语样本，23 个 ASCII85+Flate 图片；Pillow RGB/ImageReader 经 ReportLab 进入 PDF。BODY 已复用 140 次。不能沿用 NUM 的编码诊断解释这个文件。
- ECR：当前作者渲染 QA 是 6 页合成样本，只嵌入一张 Flate BODY，多次绘制含裁切片段。历史完整双语审阅稿仅 10 页、0 张图片、256,801 bytes；JPEG 对它没有收益。R2 fixed-only 的 13 页文件也不是完整作者稿。

15 份文件的精确编码重复、解码像素重复均为 0 组。重复绘制不等于重复存储；同页多次裁切绘制也不自动等于可删除的冗余背景。字体不构成当前六个代表的主要负载。具体对象和页引用见 IMAGE-OBJECT-ANALYSIS.csv 与 forensics/。

## 全部质量与时间实测

单位 MiB = 1,048,576 bytes。时间列为编码/克隆/写出 wall 秒 / 当前进程 CPU 秒，不含随后逐页验证；渲染子进程 CPU、等待时间另见 VISUAL-COMPARISON.json。不同编码器的同名 quality 不等价。

{mdtable(['方法','页','策略','原 MiB','后 MiB','减少','wall/CPU s','样本最差 PSNR / SSIM'],qrows)}
## 保持内容的方法与验证

仅替换大面积不透明背景/整页图像的编码流，不缩小像素、不栅格化动态文本或向量图，不更换字体、顺序、版式、主题身份或作者文字。ICC/颜色空间保持；不支持的透明/非八位编码保持原样。原始 Producer、Title 及全部已有 metadata 保留；加入来源 SHA 和 LOCAL_PROOF_NOT_HUMAN_ACCEPTED 标识。

24 份副本逐页检验页数、五种页面框/UserUnit、原始动态内容流、可提取文字、字体字节集合/字体名、metadata 和来源 SHA。所有均通过。现有文字和向量指令完全相同，含原有主体身份；这不是对原始输入正确性的重新认证。

初次 NUM 写出发现 pypdf 默认浮点精度把 A4 边界舍入约 0.0000005 pt；该轮判为 FAIL，未忽略。只在本地副本处理器中提升序列化精度后重做 NUM，现五种页面框严格相等。FIRST-PASS 记录保留。

## 实际视觉范围与限制

每个家族取首页、向量路径最多页、可提取文字最多页：18 个原始页面，对比 54 个 JPEG 页面和 6 个无损控制页面，共 78 次单页实际渲染。六个无损控制像素一致。Q87 的 18 个样本最差整页 PSNR 约 {min(x['metrics']['psnrRGBdB']for x in visual['rows']if x['quality']==87):.2f} dB，平均式 8x8 亮度 SSIM 最低 {min(x['metrics']['ssim8x8LuminanceMean']for x in visual['rows']if x['quality']==87):.6f}。不是“87% 相似度”。

已目视检查六家族封面和各自的结构/正文样本总览；没有发现新裁切、位置改变或动态字形模糊。静态图中的细字、纹理有有损差异；全页指标不能证明每个小字或每张图均可接受。ECR 的六页样本没有真正的方法图表，所以 ECR 方法图可读性尚未由这个样本覆盖。Q87 可作为保守人审候选；Q82/76 不是统一自动默认。详情提供原图、三个质量版本和差分放大，仍需人审静态细字。

**仅证明副本尺寸减少。本轮没有减少任何生产 R2 对象、没有改变旧下载，也不把这些合成/本地证据当商业生产通过。**
''')
 textfile('STORAGE-ECONOMICS.md',f'''# 长期存储经济性与交付设计

## 已有真实所有者

`functions/report-delivery/customer-report-artifact.js` 的 CUSTOMER_REPORT_ARTIFACT_V1 已要求 input/calculation snapshots、publicationIR、generatedSections、authority/content/renderer versions、entitlement 身份和 HTML/render-state 引用，冻结 generatedCopy/contentDigest/artifactDigest，明确 pdfPolicy=ON_DEMAND_DERIVATIVE、sharedAssetsEmbedded=false，并拒绝 data:image/。`customer-artifact-store.js` 已用既有 SQL 状态锁及 PRIVATE_REPORTS 读写不可替换的快照，open 不调用 provider。复用这些所有者，不能新建竞争的 Canonical Report Registry。

现有 `generatedSections` 和 `generatedCopy` 同时保留有正文重复，但属于既有 schema/digest，不在本轮删改；相对数十 MB 图片负载，应排在后面。现有 released-report、BZR/ZWR material、NUM local adapter、HD candidate 和 large-PDF 入口并不相同，不能宣称已统一上线。

`local-private-pdf-artifact.js` 是受限本地小文件路线，含 Base64/加密 payload；大文件路线 `local-large-private-pdf-artifact.js` 已把字节流放入 PRIVATE_REPORTS，SQL 只保元数据，当前技术上限 128 MiB。NUM 本地 owner 的 32 MiB 防线是另一个入口。不要把这些传输限制当六方法的统一生成预算。

## A / B / C

| 方案 | 好处 | 风险/约束 | 结论 |
|---|---|---|---|
| A 永久紧凑 PDF + 冻结 IR | 下载快、精确原字节、可恢复、无渲染器漂移 | 每份独立 PDF 仍需包含静态图；保留旧版不能省旧对象 | 对已经生成/约定即时交付的付费 PDF 最安全 |
| B 首次导出生成 + 持久不可变缓存 | 与现有 ON_DEMAND_DERIVATIVE 符合；未导出时省 PDF 空间 | 首次等待、并发锁、固定渲染依赖、失败恢复；不能重跑 AI | 现有该策略保持；一旦导出按 A 缓存，而不是每次下载重渲染 |
| C HTML-only | 文本和共享 WebP 开销小，响应式可读 | 不可移除已售 PDF 权益；离线/归档和资产长期可用性不同 | 只适合未来明确约定且另行批准的新产品 |

建议默认：**付费 PDF 交付保持原时点和权益；生成一次紧凑 PDF 后，在合同保留期内持久缓存，同时保留既有不可变 IR/HTML。既有 ON_DEMAND 路线维持首次导出触发，随后返回缓存原字节。** 不为节省少量存储破坏可重开、可追溯及历史下载，也不改现有 pdfPolicy 字符串。

HTML Reader 使用原始已批准 WebP 的版本化 SHA URL；PDF 使用绑定同一个 source asset SHA 的 JPEG/PNG 派生物。HTML 不为每位客户嵌入相同资产的 Base64。PDF 必须可离线自包含，不能把外部 R2 图片 URL 当成可打印图像字节。派生缓存跨报告复用可省编码 CPU，不能消除每份独立 PDF 自身的图像字节。

## 版本、鉴权、水印和旧下载

报告内容版本、输入/计算/正文快照和 accepted authority 保持不可变。编码变化是新的 rendition/profile/version/outputDigest，不覆盖 report content version，也不替换旧 artifactDigest。原 PDF objectKey/outputDigest 继续可用，历史链接/下载授权仍返回原来的原字节。可选紧凑版本只能加为清楚标注的旁支。

每次 Reader、reopen、redownload 仍走现有账户、person/consent、购买、locale、报告版本、状态和 entitlement 验证；短期 header grant 绑定 report + owner + rendition digest。私有 PDF 不进入公共资产 bucket。退款/撤销阻止后续在线访问，不承诺追回已经下载的离线文件。

如商业条款要求水印，在首次冻结 PDF 前按既有 renderer 的受准许覆盖区域一次生成并纳入 digest，使用既有 policy 版本；后续重复下载不追加新时间戳造成“原件”漂移。本轮没有加水印、改版式或实现新水印系统。现有所有路线的水印覆盖不能仅凭文件存在认定一致，须后续单独核对。

**重开/重新下载不得调用 AI、姓名计算或解释工厂。** 缓存缺失先修复既有精确对象；如准许确定性 PDF 重建，只用冻结正文、已固定资产/字体/渲染器版本，且不得把不一致的新字节冒充旧 outputDigest。

## 费用来源和算例

仅使用 [Cloudflare R2 官方价格](https://developers.cloudflare.com/r2/pricing/)（读取 2026-10-29）：Standard $0.015/GB-month，Class A $4.50/百万，Class B $0.36/百万，公网 egress 免费；Standard 免费额度为 10 GB-month、A 100 万、B 1000 万。按官方计费单位向上取整。不是实际账户账单，没有查询私有 R2 或 D1；读取官网价格不调用付费模型/渲染服务。

以每个样本独立复制 10,000 份、稳定存 30 天且独享全部免费存储额度为示例：

{mdtable(['样本','原始 GB','未来紧凑 GB','原始 USD/月','紧凑 USD/月','旧+紧凑 USD/月'],[[NAMES[r['method']],next(e for e in economic if e['method']==r['method']and e['reports']==10000)['originalGB'],next(e for e in economic if e['method']==r['method']and e['reports']==10000)['compactGB'],next(e for e in economic if e['method']==r['method']and e['reports']==10000)['originalStorageUsdMonth'],next(e for e in economic if e['method']==r['method']and e['reports']==10000)['newCompactStorageUsdMonth'],next(e for e in economic if e['method']==r['method']and e['reports']==10000)['legacyPlusCompactStorageUsdMonth']]for r in primary])}
完整 1,000 / 10,000 / 100,000 份算例见 STORAGE-COST-SCENARIOS.json。GB 为十进制计费单位；各行不能相加后重复扣六次免费额度。ECR 行仅是六页合成样本，不是完整作者报告或客户群平均。未计 IR、HTML、索引、编码/渲染 CPU、其他账户对象、税或实际产品组合。CPU 秒已实测，生产计算单价未确认，不能虚构按需生成总成本。

**保留历史原 PDF 再增一个紧凑副本，会增加存储，不会释放旧存储。** 本表紧凑节省只对应未来新生成 PDF 或经单独批准的存储策略；本轮及计划均不自动删除、覆盖或迁移历史对象。R2 出网免费，压缩首先改善下载体验、内存、吞吐及后续存储，而不是虚构的 R2 egress 节省。
''')
 textfile('SHARED-IMPLEMENTATION-PLAN.md',f'''# 最小共同输出合同与实施顺序（提案，未实施）

## 一个合同，不是一个新报告引擎

沿用现有 native calculation/manuscript/IR/renderer/storage owners。共用的是派生资产编码与输出描述：source report/artifact/version + owner/person/entitlement + locale + source asset registry revision/SHA + renderer/font/profile versions + pages/boxes + output bytes/digest/objectKey + existing acceptance provenance。不得据编码优化自动补齐 SOURCE_HUMAN_ACCEPTED、Human ACCEPT 或生产准入。

HTML 默认原 WebP；PDF 从相同不可变源生成兼容派生图。派生缓存键至少包含 source SHA、encoder/library version、quality、subsampling、ICC/alpha policy、dimensions。原 WebP 和 registry 不改。当前实测 Q87/444/no-resize 为保守人审候选；Q82 只在单独获准的照片/纯纹理背景考虑；Q76 不作为六方法的自动全局默认。透明、细线/小字高风险或不支持的色彩样本保留无损，不能为了预算模糊或截断内容。

## 实际所有者与接点

{mdtable(['方法','现有生成接点','最小未来改变'],[[k,'; '.join(owners['owners'][k]['renderers']),'NUM: 把现有 sharp quality100 编码配置为受版本约束的派生策略；保留 assembler 的 SHA 缓存。'if k=='NUM'else'HD: 向既有 ReportLab ImageReader 提供已编码 JPEG 字节，而非每次 RGB -> ASCII85/Flate；不改 Flowable。'if k=='HD'else'在现有 Chromium PDF asset resolver 中提供已验证的 PDF 图像派生物；HTML 仍用原 WebP，不改 paginator 或文案。']for k in NAMES])}

不要直接运行旧 render 脚本来“修复”：它们会覆盖原有 PDF/HTML/receipt，并有网络或其他源写入副作用，本轮只读其代码。只执行本目录新建的 audit/optimize/visual/finish 验证程序。真实 owner 的接口仍须在后续受准许实施中逐一验证 JPEG 是否直通 DCT；同质量数字跨编码器不能推定效果一样。

主 R2 registry 有 AST/ZWR/NUM/ECR 资产条目，BZR 和 HD 当前没有条目；它们已有 native editorial / R611 selected-front-matter 等所有者。后续先绑定既有准确来源，不能伪造全局 registry 完备或新批准资产。SOURCE-OWNERS.json 和 R2-ASSET-REGISTRY-ANALYSIS.json 给出现存路径/哈希。

## 页数和画作预算

不是统一 10MB/32MB/每页固定数。先测唯一静态画作派生字节和字体；按该模板实际页数与 native 图表复杂度估算动态流开销。仅作为 warning 的样本校准公式：

`sum(unique approved artwork derived bytes) + current embedded-font bytes + 1.30 * observed residual stream/catalogue bytes + 64KiB`

{mdtable(['方法','实际页数','唯一图像','Q87 实际 MiB','校准预警 MiB'],[[b['method'],b['pages'],b['uniqueImages'],mib(b['optimizedBytes']),mib(b['illustrativeWarningBudgetBytes'])]for b in budgets])}

见 PAGE-AND-ARTWORK-BUDGETS.json。145 页 HD 的 BODY 只计一份图像，不按 145 倍图片算；新增页主要增加文字/向量流。既有技术传输 caps 单独保留。超预算时解释对象负载和版式原因，不能缩字体、减页、删章或自动换内容。

## 并行源码变化

审计期间共用 private-pdf-renderer.js 出现新指纹，记录于 CONCURRENT-SOURCE-RECHECK.json。原 PDF 和主 R2 registry 未变；本轮优化只消费原 PDF 字节，未执行这个 renderer，因此冻结文件实测有效。当前 renderer 已只读重查，不自动认可新代码；后续接入需绑定最新 SHA 后重验。未覆盖、回滚或修改它。

## 最小顺序和边界

1. **人审编码样本**：选择静态细字、封面、BODY 和 native 图表的可接受质量；只批准新的 rendition profile，不改原 source acceptance。ECR 完整作者稿尚不是本次六页样本；扩展应用前需要对应完整文件验证。
2. **共用纯编码/派生缓存边界**：拟放在现有 canonical-presentation-runtime 相邻 helper，复用当前 assembler/asset resolver；不另建 renderer、source registry 或报告数据库。先接 NUM 明确的 Q100 调用点；逐个接其余既有 owners，HD 保持现有 ReportLab。此步尚未实施。
3. **保留正确的现有复用**：当前没有发现重复背景对象，保留每源 hash 的 image cache。PDF 合并按每个来源一次 copy/embed 多页，避免再次复制相同资源。可选孤儿清理/无损整理先做控制，但实测只有约 -0.02% 至 +0.96% 的变化，不能作为主要收益承诺。
4. **只增加 rendition 描述**：扩展既有 customer artifact/material 引用；新 outputDigest、codec/profile version 与原 reportContentVersion 分离。现有 ON_DEMAND_DERIVATIVE 保持，不静默改为其他商业条款。历史 metadata/digest 不重写。
5. **私有存储与 Library**：新报告按现有交付时点生成一次紧凑 PDF；按需路线首次导出生成后持久缓存。复用 PRIVATE_REPORTS、现有状态锁、Account Library/entitlement/consent/revocation。历史原件保留，可选紧凑旁支不替换原下载。
6. **针对性校验后再另行集成审阅**：六家族各真实模板至少一个，多语言受影响时各一个；逐页文本/字体/identity/boxes/links、实际图文渲染、实际 private-delivery 的精确 bytes。默认不得对全部历史客户重跑稿件或 paid providers。随后才可提出单独 commit / integration / deployment 授权，当前全部未执行。

## 已知需要人决定的事项

- Q87 静态图细字/纹理是否获准作为新编码候选；哪些资产要保留无损。没有自动 Human ACCEPT。
- 新报告的派生 profile 和 warning budget；不改变既有价格、问题额度、水印权益或下载保留期。
- 既有 on-demand 策略是否只增加持久缓存描述；不因成本推定改动商业承诺。
- 历史紧凑旁支是否确有用户体验价值：保留原件时会新增存储，不默认批量回填。

停止在人审。本轮不修改任何生产 source、资产、D1/R2、Stripe、其他 worktree，不执行 npm run check 或全量回归，不提交/推送/合并/部署。
''')
 status={'workId':'PHIOS-REPORT-STORAGE-OPTIMIZATION-R1','result':'LOCAL_FORENSIC_AND_OPTIMIZATION_PROOF_COMPLETE_PENDING_HUMAN_REVIEW','actualPdfFilesAudited':len(audit['reports']),'reportFamilies':6,'optimizationCopies':24,'representativeOriginalPages':sum(r['pageCount']for r in primary),'copiesPagesVerified':sum(r['pageCount']for r in results),'visualOriginalPages':18,'visualComparisons':60,'actualPageRenders':78,'losslessPixelControlsPassed':6,'structuralParityAll':True,'currentOriginalPdfDrift':drift,'inspectedSourceDrift':source_drift,'unreconciledSourceDrift':unreconciled,'concurrentChangesRecord':'CONCURRENT-SOURCE-RECHECK.json','mainRegistryUnchanged':sha(Path('content/reports/shared/report-visual-assets-r2.json').read_bytes())==audit['registrySHA256'],'primaryQ87Savings':[{'method':r['method'],'oldBytes':r['fileBytes'],'newBytes':q87[r['id']]['optimizedBytes'],'reductionPercent':q87[r['id']]['reductionPercent']}for r in primary],'productionStorageReduced':False,'paidProviderCalls':0,'productionD1Writes':0,'productionR2Writes':0,'StripeChanges':0,'globalMasterWrites':0,'commit':False,'push':False,'merge':False,'deploy':False,'npmRunCheck':False,'fullRegression':False,'humanAcceptWritten':False,'visualCertification':'Bounded representative renders and model visual review; final static-artwork readability and profile acceptance remain human decisions','ECRScope':'Current six-page synthetic author-renderer sample, historical full 10-page vector review and fixed-only sample separately audited; no complete current author manuscript PDF fabricated'}
 save('STATUS.json',status)
 esc=html.escape;links=lambda p:'../../../'+p;table='<div class="scroll"><table><thead><tr>'+''.join('<th>'+x+'</th>'for x in['Method','Pages','Original MiB','Q76','Q82','Q87','Q87 reduction'])+'</tr></thead><tbody>'+''.join('<tr><td>'+NAMES[r['method']]+'</td><td>'+str(r['pageCount'])+'</td><td>'+mib(r['fileBytes'])+'</td>'+''.join('<td><a href="'+str(Path(next(x for x in results if x['reportId']==r['id']and x['quality']==q)['output']).relative_to(ROOT.relative_to(Path.cwd()))).replace('\\','/')+'">'+mib(next(x for x in results if x['reportId']==r['id']and x['quality']==q)['optimizedBytes'])+'</a></td>'for q in[76,82,87])+'<td>'+str(q87[r['id']]['reductionPercent'])+'%</td></tr>'for r in primary)+'</tbody></table></div>'
 sections=[]
 for r in primary:
  vr=[x for x in visual['rows']if x['reportId']==r['id']and x['quality']==87];s=f'<section id="{r["method"]}"><h2>{NAMES[r["method"]]} · {r["pageCount"]} pages</h2><p>{esc(r["scope"])}<br>Producer: {esc(r["producer"]or"unknown")} · Images {r["imageObjectCount"]}, encoded {mib(r["totalEncodedImageBytes"])} MiB · Fonts {r["fontStreamBytes"]/1024:.1f} KiB · Selectable text {r["pagesWithExtractableText"]}/{r["pageCount"]} pages.</p><p>{esc(owners["owners"][r["method"]]["conversion"])}</p><p><a href="{links(r["path"])}">原始 PDF / read-only original</a> · <a href="forensics/{r["id"]}.json">完整对象取证与页级哈希</a></p>'
  for x in vr:
   stats=x['metrics'];s+=f'<details {"open"if x["page"]==1 else""}><summary>Page {x["page"]} · Q87 · PSNR {stats["psnrRGBdB"]} dB · SSIM8 {stats["ssim8x8LuminanceMean"]}</summary><div class="pair"><figure><figcaption>Original actual PDF</figcaption><a href="{x["originalImage"]}"><img loading="lazy" src="{x["originalImage"]}"></a></figure><figure><figcaption>Q87 actual PDF · not Human ACCEPT</figcaption><a href="{x["optimizedImage"]}"><img loading="lazy" src="{x["optimizedImage"]}"></a></figure></div><p>'+''.join(f'<a href="{z["optimizedImage"]}">Q{q} 实际页面</a> · 'for q in[76,82]for z in visual['rows']if z['reportId']==r['id']and z['page']==x['page']and z['quality']==q)+f'<a href="visual/{r["method"]}/p{x["page"]:03}-detail.png">100% 局部对照</a> · <a href="visual/{r["method"]}/p{x["page"]:03}-diff-x8.png">差分 ×8</a></p></details>'
  s+='</section>';sections.append(s)
 docs=['SIZE-AUDIT.json','IMAGE-OBJECT-ANALYSIS.csv','OPTIMIZATION-BEFORE-AFTER.md','STORAGE-ECONOMICS.md','SHARED-IMPLEMENTATION-PLAN.md','OPTIMIZATION-RESULTS.json','VISUAL-COMPARISON.json','DECODED-IMAGE-AND-ASSET-ANALYSIS.json','PROVENANCE-AND-BOUNDARIES.json','PAGE-AND-ARTWORK-BUDGETS.json','STORAGE-COST-SCENARIOS.json','SOURCE-OWNERS.json','R2-ASSET-REGISTRY-ANALYSIS.json','CONCURRENT-SOURCE-RECHECK.json','STATUS.json']
 page='''<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PHI OS · Report Storage Optimization R1 · Human Review</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f0e8;color:#193442;font:16px/1.65 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1440px;margin:auto;padding:24px}h1{font-size:clamp(24px,4vw,38px)}h2{margin-top:32px}nav{display:flex;flex-wrap:wrap;gap:12px}a{color:#245e68;overflow-wrap:anywhere}section{border-top:1px solid #bda578;padding:20px 0}.notice{background:#fff8e8;border-left:5px solid #a57835;padding:16px}.scroll{overflow:auto}table{border-collapse:collapse;width:100%;min-width:780px}td,th{padding:10px;text-align:left;border:1px solid #d2c3a7}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0}img{width:100%;height:auto}summary{cursor:pointer;padding:12px;background:#e9e2d5}details{margin:18px 0}code{overflow-wrap:anywhere}@media(max-width:700px){main{padding:14px}.pair{grid-template-columns:1fr}body{font-size:15px}}</style><main>'''+f'<h1>PDF 存储优化 R1 · 人审候选</h1><p>WORK ID: PHIOS-REPORT-STORAGE-OPTIMIZATION-R1 · Isolated local forensic audit + optimization proof.</p><div class="notice"><strong>未改原 PDF／原 WebP／生产系统；没有自动 Human ACCEPT。</strong><p>对象取证覆盖 15 份实际 PDF；六个代表共 364 页，生成 24 份独立副本。所有动态文字、内容流、字体、metadata 和页面边界验证通过。Q87 是有损人审候选，不能等同于像素无损、完整产品验收或生产准入。</p></div><nav>'+''.join(f'<a href="#{k}">{NAMES[k]}</a>'for k in NAMES)+'</nav><h2>实际字节对照 / tested copies</h2>'+table+'<div class="notice"><strong>并行源码变化已单列。</strong>共用 private-pdf-renderer.js 在审计期间变化；原 PDF / R2 清单 SHA 未变。本次冻结 PDF 的取证与优化仍有效，后续接入必须按新源码 SHA 复验，未覆盖或回滚别人的工作。<a href="CONCURRENT-SOURCE-RECHECK.json">新旧指纹与影响范围</a></div><h2>确认的主要原因</h2><p>不是重复背景对象：精确编码与解码重复均未发现，背景已在多页复用。主要负载来自 Chromium 的 Flate 图像、HD 的 ASCII85+Flate，以及 NUM 的 JPEG 100。不同版本不能混为一谈：历史 ECR 完整审阅稿只有 0.24 MiB、零图片；本次 ECR 主样本仅六页合成渲染 QA，没有实际方法图可读性覆盖。</p><h2>最安全的默认与实施次序</h2><p>沿用现有冻结 report artifact/IR 与 PRIVATE_REPORTS。已生成付费 PDF 保持永久紧凑缓存及原交付时点；既有 ON_DEMAND_DERIVATIVE 保持首次导出触发，随后持久缓存，重新下载不重跑 AI。历史原下载保留；另外加压缩版会增加旧存储，不自动回填或删除。</p><ol><li>人审静态细字和编码 profile。</li><li>在现有转换/asset resolver 接点共用纯编码缓存，先 NUM，再逐个 native owner；不新建引擎。</li><li>保留正确的 image reuse、当前字体和 vector/text。</li><li>按唯一画作、字体和真实页数设置预警预算。</li><li>仅以新的 rendition descriptor 挂接原 artifact，保持旧 objectKey/outputDigest。</li><li>获准后才实施 targeted QA、集成或部署；本轮停在人审。</li></ol><h2>证据 / evidence</h2><ul>'+''.join(f'<li><a href="{d}">{d}</a></li>'for d in docs)+'</ul>'+''.join(sections)+'<section><h2>安全回执</h2><p>付费 Provider 0；生产 D1/R2/Stripe 写入 0；应用源文件和原始资产改动 0；全局 Master 改动 0；commit/push/merge/deploy 0；npm run check 与全量回归 0。所有输出只在本目录。官网价格是只读公共资料，非实际账单。</p><p>需要你决定：Q87 静态画作细字是否可接受；哪些素材保留无损；是否授权最小编码接点实施；未来新报告缓存策略和历史可选旁支。没有自动源准入或商业权益变更。</p></section></main></html>'
 textfile('HUMAN-REVIEW.html',page)
 save('FINAL-SAFETY-RECEIPT.json',{'originalPdfHashesUnchanged':not drift,'sourceHashesUnchangedSinceOwnerInventory':not source_drift,'registryUnchanged':status['mainRegistryUnchanged'],'sourceDrift':source_drift,'unreconciledSourceDrift':unreconciled,'frozenPdfProofUnaffectedByReconciledSourceDrift':not unreconciled,'originalDrift':drift,'gitHead':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'writesRestrictedTo':str(ROOT),'allCreatedPdfOutputs':[x['output']for x in results],'paidProviderCalls':0,'productionWrites':0,'globalMasterModifiedByThisWork':False})
 if drift or unreconciled:raise SystemExit('SOURCE_DRIFT_REQUIRES_REVIEW')
 print(json.dumps(status,ensure_ascii=False))
if __name__=='__main__':main()
