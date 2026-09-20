# BAZI-DYNAMIC-VISUAL-REFERENCE-FREEZE-R1

基线：`main 16028adfafe37bd501bf4279faa04a766d5a2a1c`。

本批范围：登记参考、共享 token、组件归属、页码映射、禁止漂移规则与检查器。按附件“本批完成后停止，不继续制作动态报告页面”，停在 Batch 0；没有新增 P06–P26 动态页面，也没有开始其他方法。

## 已交付

1. `content/registry/report-visual-reference-freeze-r1.json`：唯一登记，包含 15 类视觉要求、6 个组件归属、26 页映射、15 条禁止漂移规则。
2. `assets/css/tokens.css`：在既有全局 token owner 中登记 28 个 `--phi-report-*` 值。字体、间距引用现有基础 token；没有另建全局设计系统。Batch 0 没有将它们批量套用到旧候选页面。
3. M03–M08 六张本地原图已逐张查看，路径保留为 `assets/images/report/*.webp`；只作构图参考，不作为客户页面、计算依据或默认数据。
4. `scripts/check-report-design-drift.mjs`：检查唯一 token 定义、原图存在、26 页映射、限定卡片／图标／样式；含 17 个错误 Page IR 用例与 5 个 CSS 拒绝用例。可用 `--page-ir` 验证后续批次现有 Page IR 的视觉扩展，不生成第二套报告结构。
5. `BAZI-BATCH-0-REFERENCE-FREEZE.html`：15 张八字静态语言参考及 6 张动态构图参考，与共享规范并列展示。

## 静态图状态

- 用户已明确批准全部 120 张静态图，登记为 `USER_APPROVED_2026_09_20`，不再要求重复人工图片审核。
- 补齐后逐个 GET 核验：**120/120 可读取；0 个 404；0 个未验证**。已记录实际尺寸、对象 ETag 和检查时间。
- 三个八字 P01 路径实际都是 PNG 内容，但文件名及 HTTP 类型标为 WebP；浏览器可解码，实际格式已记录为 PNG，没有擅自重编码或覆盖 R2。
- `en/P01` 当前图片包含中文及英文标题。保留用户视觉批准，另记语言内容与路径的差异，不以另一张图替换。
- 修复了静态渲染绑定使用 `asset.url` 的错误：既有解析器实际返回 `asset.src`。同时使用已测量的原始尺寸，不再假设每张都是 2480×3508。
- 静态图批准不等于动态页面、完整报告或生产发布批准。

## 参考协调

- M04 原图为横版：冻结其中心结构与辅助面板层级，后续以 A4 重排，不能把整张横图缩成纵向页面。
- M07 原图的示例年份、干支与“能量曲线”不得进入客户数据；无真实连续量时使用时期带／阶段时间轴。
- M08 原图页码 24 不覆盖现有最终 26 页蓝图：Reality Navigation 仍为 P25。
- 静态锚点与动态参考的具体构图不同；冻结共同的字体层级、金／海军蓝／象牙白、细边框、半透明面板、低对比山水材料及一致页眉页脚。不是逐像素复刻。
- 下一批需要实际截图、DOM 密度测量和参考并排检查；当前检查器通过不证明动态页面已经达到品质要求。

## npm 卡点

原因是上一轮将 `check-guided-report-successor.mjs` 追加到 `scripts.check` 末尾，破坏 PTRC 的固定收尾链。现将新增检查移到前部，完整保留末尾 `check:ptrc:w9-testamentary-report && check:ptrc:w10-consolidation`；没有放宽、删除或改写 PTRC 原断言。

已通过：PTRC-W10、PDS-W2、PDS-W3、Guided Report successor、Design Drift Guard、`git diff --check`。完整 `npm run check` 已通过（退出码 0），结果见 `batch-0-validation.json`；运行日志位于 `.tmp/bazi-batch0-full-check.log`。

所有改动留在工作区。没有 commit、push、部署、R2 写入或 ZIP。`assets/images/report` 是用户提供的原始参考文件，未修改。
