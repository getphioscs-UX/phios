# 最小共同输出合同与实施顺序（提案，未实施）

## 一个合同，不是一个新报告引擎

沿用现有 native calculation/manuscript/IR/renderer/storage owners。共用的是派生资产编码与输出描述：source report/artifact/version + owner/person/entitlement + locale + source asset registry revision/SHA + renderer/font/profile versions + pages/boxes + output bytes/digest/objectKey + existing acceptance provenance。不得据编码优化自动补齐 SOURCE_HUMAN_ACCEPTED、Human ACCEPT 或生产准入。

HTML 默认原 WebP；PDF 从相同不可变源生成兼容派生图。派生缓存键至少包含 source SHA、encoder/library version、quality、subsampling、ICC/alpha policy、dimensions。原 WebP 和 registry 不改。当前实测 Q87/444/no-resize 为保守人审候选；Q82 只在单独获准的照片/纯纹理背景考虑；Q76 不作为六方法的自动全局默认。透明、细线/小字高风险或不支持的色彩样本保留无损，不能为了预算模糊或截断内容。

## 实际所有者与接点

| 方法 | 现有生成接点 | 最小未来改变 |
| --- | --- | --- |
| AST | functions/ast-full-production/ast-fixed-asset-r21-candidate.js; tools/review/report-visual-asset-convergence-r2/render-r21.mjs | 在现有 Chromium PDF asset resolver 中提供已验证的 PDF 图像派生物；HTML 仍用原 WebP，不改 paginator 或文案。 |
| BZR | functions/personal-reading/deep-manuscript/bazi-deep-manuscript-publication.js; scripts/lib/bazi-r2-p7-terminal-harness.mjs; workers/method-report-renderer/bazi-verification.js | 在现有 Chromium PDF asset resolver 中提供已验证的 PDF 图像派生物；HTML 仍用原 WebP，不改 paginator 或文案。 |
| ZWR | assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js; tools/review/report-visual-asset-convergence-r2/render-r22.mjs | 在现有 Chromium PDF asset resolver 中提供已验证的 PDF 图像派生物；HTML 仍用原 WebP，不改 paginator 或文案。 |
| NUM | tools/review/numerology-r30/build.mjs; functions/personal-reading/narrative/numerology-publication-system.js; functions/canonical-presentation-runtime/report-fixed-publication-assembler.js | NUM: 把现有 sharp quality100 编码配置为受版本约束的派生策略；保留 assembler 的 SHA 缓存。 |
| HD | tools/review/hd-r6/import-20261027/r611/render.py; tools/review/hd-r6/import-20261027/r68/render.py; tools/review/hd-r6/import-20261027/r65/render.py | HD: 向既有 ReportLab ImageReader 提供已编码 JPEG 字节，而非每次 RGB -> ASCII85/Flate；不改 Flowable。 |
| ECR | scripts/ecr-r31-render-synthetic-pdf.mjs; assets/customer-ui/js/specialists/ecr/full-report-sections-renderer.js | 在现有 Chromium PDF asset resolver 中提供已验证的 PDF 图像派生物；HTML 仍用原 WebP，不改 paginator 或文案。 |


不要直接运行旧 render 脚本来“修复”：它们会覆盖原有 PDF/HTML/receipt，并有网络或其他源写入副作用，本轮只读其代码。只执行本目录新建的 audit/optimize/visual/finish 验证程序。真实 owner 的接口仍须在后续受准许实施中逐一验证 JPEG 是否直通 DCT；同质量数字跨编码器不能推定效果一样。

主 R2 registry 有 AST/ZWR/NUM/ECR 资产条目，BZR 和 HD 当前没有条目；它们已有 native editorial / R611 selected-front-matter 等所有者。后续先绑定既有准确来源，不能伪造全局 registry 完备或新批准资产。SOURCE-OWNERS.json 和 R2-ASSET-REGISTRY-ANALYSIS.json 给出现存路径/哈希。

## 页数和画作预算

不是统一 10MB/32MB/每页固定数。先测唯一静态画作派生字节和字体；按该模板实际页数与 native 图表复杂度估算动态流开销。仅作为 warning 的样本校准公式：

`sum(unique approved artwork derived bytes) + current embedded-font bytes + 1.30 * observed residual stream/catalogue bytes + 64KiB`

| 方法 | 实际页数 | 唯一图像 | Q87 实际 MiB | 校准预警 MiB |
| --- | --- | --- | --- | --- |
| AST | 64 | 16 | 8.21 | 8.36 |
| BZR | 48 | 15 | 5.96 | 6.15 |
| ZWR | 68 | 16 | 9.01 | 9.51 |
| NUM | 33 | 15 | 9.62 | 10.21 |
| HD | 145 | 23 | 11.60 | 11.79 |
| ECR | 6 | 1 | 0.61 | 0.68 |


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
