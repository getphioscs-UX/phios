# BAZI-FULL-REPORT-VISUAL-FREEZE-R1

基线：`a21d9ab23d4737849f1857af8fd55526cf407b80`。Batch 6 整本审核材料已完成，视觉冻结**未通过**，人工接受 **PENDING**。没有激活 BAZI REPORT DESIGN SYSTEM R1 后继基线。

[打开全册审核](http://127.0.0.1:8788/docs/guided-report-successor-r1/batch-6/review.html)。可切换中文／英文／双语、跳页、浏览全部桌面及手机截图，并打开 26 页 A4 PDF、P05→P06 对照和全册缩略图。

## 结论

P05→P06 明显从带山水、金色图标的书刊排版切换为数据面板。P06–P26 统一继承这一差异，全部标记 VISUAL_PROMISE_MISMATCH。机器能确认有图、有页、来源一致及不溢出，不能确认 premium visual promise 已兑现。静态图已获用户批准，该状态不变。

### VF-01 · VISUAL_PROMISE_MISMATCH

P05→P06 从山水／纸感、金色徽章及书刊排版，转为纯象牙白圆角数据面板。标题重心、品牌字标、图标语汇及页脚均改变；P06–P26 延续同一动态样式，因此每页继承这一断层。

建议：以已批准 P01–P05 与 M03–M08 为参考，统一动态页的标题、品牌区、装饰性图标／材质、面板边框和页脚；保留现有 Page IR 及有来源的数据，不从示例图复制个人结论。

### VF-02 · VISUAL_PROMISE_MISMATCH

主视觉区域占比通过机器检查，但面板占位不等于有效视觉密度。多个页面把少量数字／短标签放在大块空面板内；P07–P08、P11、P13–P15、P20–P26 尤其明显。P16–P19 使用重复的领域节点构图，尚未达到静态页的书刊层次。

建议：逐页重调主图规模、模块比例和留白节奏，保留缺失资料的真实状态。不得以虚构内容填满空白，也不得只扩大容器满足占比。

### VF-03 · MOBILE_READABILITY_REVIEW_REQUIRED

390px 下静态整页图按比例缩小，文字无法重排；尤其双语 P02–P05 的细字难以直接阅读。动态页会纵向重排，P05→P06 的阅读长度和字号体验突然改变。静态图片的既有用户批准状态保持不变。

建议：在不改原图的前提下设计可放大阅读或可访问的文字伴读，并检查整本移动端阅读流程；不能以无横向溢出代替可读性验收。

### VF-04 · CHROME_CONTINUITY_REVIEW_REQUIRED

逻辑页序 1–26 和三个 A4 26 页文件正确。单语言静态页页码／品牌页脚与动态 NN / 26 不统一；双语静态页自身也有不同页眉安排。静态原图保留全页比例，动态页沿用 15mm 页边距，印刷视觉框架变化明显。手机双语页脚的标语与页码紧贴，缺少明显间距；补充文字矩形测量未发现实际交叠，仍应改善视觉分隔。

建议：确定全册统一的页码、品牌页脚及 A4 内容框；若涉及已批准静态图，只登记变更提案，不擅自重画原图。

### VF-05 · LOCALE_REVIEW_NOTE

英文路径 P01 的已批准封面包含中文大标题与英文副标题；当前按英文 object key 正确绑定，没有跨语言回退。

建议：在整本语言验收时明确这是刻意的双语品牌封面还是将来替换项；现有用户批准不被撤销。

### VF-06 · BILINGUAL_DENSITY_REVIEW_REQUIRED

沿用原批次 Page IR 的保守文字密度 REVIEW_REQUIRED；浏览器区域占比与印刷不重叠检查通过，并不覆盖这一语义级文字预算状态。

建议：人工阅读双语路由卡与提示后再调整文本组织；保留来源、条件和反例边界。

## 全部逐页登记

下表为三语言共同问题；VF-05 仅 en P01，VF-06 仅 bilingual P23–P25。findings.json 包含 78 条 locale/page 记录及每页桌面、手机和 A4 图片路径。

| 页 | 视觉结论 | 问题编号 |
| --- | --- | --- |
| P01 | 静态批准保留；整本情境待确认 | VF-03, VF-04, VF-05 |
| P02 | 静态批准保留；整本情境待确认 | VF-03, VF-04 |
| P03 | 静态批准保留；整本情境待确认 | VF-03, VF-04 |
| P04 | 静态批准保留；整本情境待确认 | VF-03, VF-04 |
| P05 | 静态批准保留；整本情境待确认 | VF-03, VF-04 |
| P06 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04 |
| P07 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04 |
| P08 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04 |
| P09 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04 |
| P10 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04 |
| P11 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04 |
| P12 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04 |
| P13 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04 |
| P14 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04 |
| P15 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04 |
| P16 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04 |
| P17 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04 |
| P18 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04 |
| P19 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04 |
| P20 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04 |
| P21 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04 |
| P22 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04 |
| P23 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04, VF-06 |
| P24 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04, VF-06 |
| P25 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04, VF-06 |
| P26 | VISUAL_PROMISE_MISMATCH | VF-01, VF-02, VF-04 |

## 检查与范围

- P01–P05：15 个原语言 R2 图像在浏览器中全部解码成功；保持原始比例，没有跨语言回退。
- P06–P26：五批来源摘要、projection ID、原始 HTML 哈希一致；生产代码、既有组件、Page IR、token 和样式均未修改。
- 桌面 1440px／手机 390px × 26 页 × 3 语言：156 张逐页截图，无横向溢出；动态主视觉／说明区比例检查通过。
- 三个 A4 文件各 26 页：共 78 页渲染，顺序正确，动态 06 / 26 至 26 / 26 页码文本可核对，静态页包含原图；打印无页面溢出或主图／洞察卡重叠。
- 78 页 PDF 缩略图全部查看，并放大抽查页面及三语言 P05→P06 衔接；此项不是用户人工接受或逐像素验收。
- Batch 1、2、3、4/5 的既有检查全部 PASS。本批只新增审核文件及脚本，未重跑全仓 npm run check；不把前一批结果冒充本批全仓检查。
- review.html 仅为合成测试命盘审核入口，客户发布和 checkout 仍关闭。P21 无指定目标，P22 无独立现实证据，保留真实缺失状态。

## 重现

先运行 node scripts/build-bazi-batch-6-review.mjs。本地静态服务使用 127.0.0.1:8788；设置 PHIOS_PLAYWRIGHT_MODULE 后运行 node scripts/verify-bazi-batch-6-browser.mjs；设置 PHIOS_PDFTOPPM 后用带 Pillow/pypdf 的 Python 运行 scripts/verify-bazi-batch-6-pdf.py。重新查看图像，确认此处判断仍成立，再运行 node scripts/finalize-bazi-batch-6-review.mjs 和 node scripts/check-bazi-batch-6.mjs。

按照附件要求，本批在完整审核包处停止，等待人工确认；没有新增 P27、没有推进其他方法，也没有自动设为 ACCEPTED。下一步应先处理 VF-01 至 VF-04，并重新审核三语言整本衔接。
