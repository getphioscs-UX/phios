# Five Method Paid Report Production Closure R1 — 本地交付回执

本轮**没有完成五方法正式上线闭环**。已完成 Ownership Audit、既有压缩核对，以及 BaZi 首次 PDF 字节保存/账户下载的隔离代码候选与定向零费用验证。没有将本地合成、参考 PDF、HTML 或通用适配器测试称为 Live Customer PASS。

代码权威：`getphioscs-UX/phios main 3c197c509e01e95cc18651cb2a05bf63a1259dc4`。实现仅在 `C:/phios/.worktrees/five-method-paid-report-production-r1`；18 个源文件的完整 SHA 与 patch 见 SOURCE-CHANGE-RECEIPT.json / PRODUCTION-CHANGES.patch。根目录 13 个受保护生产 owner 的 SHA 与 P0 相同；未改 Pre-Entry、视觉 registry、WebP 或其他窗口源码。人工创建的 sparse checkout 可用；早先 app worktree 初始化未完成，未清理或覆盖它。

## 实际修复

- 原 native Worker 已生成 48 页 PDF，但只返回验证 JSON、丢弃 PDF 字节；`download=1` 实际返回 HTML。现在首次验证通过即以私有 multipart 传回原始 PDF，存入既有 Customer Artifact Store / PRIVATE_REPORTS，再允许 release。不是重下载时重新打印。
- `format=pdf` 为现有账户路由的新增格式；原 HTML 与历史下载保持。私有文件以 artifact/publication/html/version/SHA 绑定，条件首次写入和 R2 SHA-256 校验，新增签发记录封存 pdfRef。没有新建报告引擎、存储表或权益系统。
- 账户每次下载重查原始购买、artifact entitlement、到期、账户、Subject Consent 和存储 SHA。另一个有效购买不能解锁已撤销的原始报告。缺失或损坏返回失败，不生成、收费或自动替换。
- Job 固定 checkout 时服务端验证过的 Subject version/input/authority；恢复被清理的 readiness 只在已验证购买后写 PAYMENT_CAPTURED，不伪装 READY_TO_PAY。native prepare 使用当前 worker Job 的 purchase，而不是账户最新一笔购买。
- 修复 BaZi economics 仍比较 RM59 的旧 guard，复用当前 owner 的 RM89 基价；双语 +RM10、USD4 总 cap、USD3.6 generation / USD0.4 follow-up reserve、4 次 follow-up 不变。
- 五产品目录增加不授予权益的 capability 信息；新 checkout 在 setup 关闭时不能绕过 readiness。BZR 独立评估，未完成的方法继续关闭；其他产品不进入这条 guard。
- Account Library 仅在私有已签发 PDF 存在时显示按钮。实际原组件 + 本地真实 API 验证英文手机/中文桌面、失败重试、原字节下载；未改 Pre-Entry 页面或 Design System。

## 五个 PDF 状态（BaZi）

| 状态 | 证据和界限 |
|---|---|
| PDF_RENDER | 本地一次真实 Edge/native Worker 渲染；48 A4 页、15 图、全部冻结中英段落可提取且存在。稿件为零费用合成夹具，不是付费模型生产稿件。 |
| PDF_OPTIMIZATION | 现有 Q87 proof 已核对，humanAccepted=false；未接入、未重跑、未开发第二套压缩。 |
| PRIVATE_STORAGE | 本地既有私有 store 的首次保存、checksum/conditional ACK、冷读 SHA 通过。Cloud R2 未验证。 |
| ACCOUNT_PDF_DOWNLOAD | 实际账户 API 与浏览器下载均为 application/pdf，35,640,638 bytes，SHA 8ee63665c551505a5c394c210ef403296da8186212926f89eb7003a72b156636。 |
| REOPEN | 独立冷进程 10 项验证通过；包含重复下载、原购买撤销/过期且另有购买、匿名、撤回 Consent、缺失/损坏文件；重下载 rendererCalls=0。 |

原生签发字节只保留为隔离 QA 取证。对人审提供 `SYNTHETIC-BZR-REVIEW-WATERMARKED.pdf`，48 页均有可见 SYNTHETIC 标记；此额外审核副本不替换原字节，映射及不同 SHA 见 REVIEW-WATERMARK-PROVENANCE.json。它不是客户发行文件。原 native PDF **0 书签、0 链接注释**；商业水印尚未独立验证，不能称出版完整验收。屏幕与 A4/print-fit 检查不等于实体打印机验收。

## 压缩核对

原 optimizer 为 `tools/review/report-storage-optimization-r1/optimize.py`，离线 pypdf/Pillow；正式 functions/workers/scripts 未引用。既有 BZR Q87 原 35,600,261 → 6,246,797 bytes，减少 82.453%；源/输出 SHA 实测符合旧证据。记录明确 humanAccepted=false、视觉待人审。它对应旧受控合成材料，不能替换本轮不同 SHA 的个人报告。其他方法旧候选同样不是新客户发行文件；NUM 旧 33 页与现 39 页不自动兼容。详见 OPTIMIZER-RECONCILIATION.json。

只有批准既有 rendition profile，且对当前版本新输出验证内容、Subject、水印、页数、书签、边界、可打印性和 SHA 后，才能进入受控生成后交付链。不会因下载重新压缩。现有 optimizer 为离线工具，不能声称已能在 Worker 直接运行；实施必须复用其现有 owner/受控产物方案。

## 逐方法实际状态

| 方法 | 已存在的 native 能力 | 尚未闭环的真实原因 |
|---|---|---|
| AST | 正式计算与独立 admitted customer reading；64 页 owner PDF | Frozen full publication 使用 TL 专属稿件，customerPublicationAllowed=false。必须 subject-bound 全文/IR，不可替换封面姓名交付。Shared paid adapter 未接。 |
| BZR | Native P8 shared lifecycle；本轮私有原始 PDF 交付候选通过本地测试 | Cloud QA、Stripe QA/readback、商业水印/书签处理、人审与授权部署未完成。 |
| ZWR | Native 计算、68 页 PDF、resolved VFR profile、旧账户读取 | 需显式 targetContext；当前准入要求私有浏览器真实 receipt、精确 profile/renderer/source acceptance digest。不能改 p8Admitted 布尔值替代。 |
| NUM | Native 计算；最新 Owner SEC01–10 + Integration 为39页 | main 编译器仍 localReview-only。39 页 owner successor 已进入最新 main，但仍需正式发行绑定。P06 已接受，直接绑定，不重新审稿。不得提升 isolated replay 为生产。 |
| HD | R3 professional reading CUSTOMER_PUBLISHED / 已接受模块；145页 R611 owner PDF | Confirm endpoint 尚未持久化经认证的 account-owned Subject/chart/Consent 绑定。R611 标示非商业发行；需正式全文 publication 与外部图表存储接线，内部 chart 不启用。 |

各方法 SOURCE / PUBLICATION / ADAPTER / COMMERCIAL / LOCAL QA / CLOUD QA / HUMAN ACCEPT / DEPLOYED / LIVE CUSTOMER 分列于 OWNERSHIP-AND-GATES.json，无新 Human ACCEPT。通用 artifact transport 测试不能替代这些 native 方法的交付测试。现有 P9 是 BZR 单 owner/单购买 canary，其他方法需要真实有证据的 successor，不能直接放开。

## 商业与定向测试

Canonical 基价/总 provider cap：AST RM89/$3；BZR RM89/$4；ZWR RM89/$3；NUM RM59/$2；HD RM129/$5；双语各 +RM10。总 cap 包含双语、技术恢复、修复和4次 follow-up，预留10%。本轮真实 provider calls=0，未测付费模型实际生成成本。

- 34 capability/真实 checkout negative；11 shared-core；12 security/watchdog；16 signed refund/replay/identity/race：通过。
- 7 frozen Subject snapshot；21 canonical person/Consent cases；native 首次 PDF/shared Job；独立冷进程10项；atomic storage ACK/readonly reuse：通过。
- 浏览器手机390/en、桌面1440/zh：无横向溢出、无 pageerror；一次模拟503后重试，实际下载 SHA 一致。夹具主动阻断4个既有 `/api/customer-current-reality` POST，未写这些服务；不声称完整 Account/My Reality 集成验收。
- 五个既有实际 PDF 的页数/SHA/text/producer 与来源检查已保存；NUM 以最新39页核对。新增48页合成 PDF与所有冻结段落比对。代表图/正文截图已目视检查，未标 Human ACCEPT。
- Stripe connector 三次均返回“认证已接受，请重试”，没有可用账户 readback；未验证实际 Sandbox checkout、Cloud webhook 或 invoice。当前本地 commerce receipt merchant 为 PHI OS，未找到可据此证明 LGS 法律发票 owner/编号配置已完成的证据；不将内部 receipt/report ID 当作 Stripe invoice 或 MyInvois 验证。

测试细项以各 JSON 为准；没有运行 npm run check、全量回归、commit/push/merge/deploy、生产 D1/R2/Stripe 写入或收费调用。

## 最小后续实施顺序 / 待决定

1. 人审 isolated 18-file patch、BaZi 水印审核副本、账户截图及权限证据；决定原生书签/商业水印的正式 owner 要求。现阶段不是 production release candidate。
2. 对既有 Q87 rendition 候选作单独人审决定。未批准前保持原始 PDF；批准后仅对当前发行版本新文件做兼容性证明，不批量重制、不复用旧个人文件。
3. 完成 NUM39正式发行绑定及 Subject/external-chart 契约；为 AST、ZWR、HD 补齐上述具体缺口，再按方法独立验证和准入，不阻塞已完成方法。
4. 解开 Stripe QA 认证后核对现有产品/价格/receipt/invoice owner，再做授权的真实 Sandbox 流程。无需创建第二套商品或调整 Live。
5. 另行授权 Cloud QA/部署：先私有 renderer protocol health，再现有 Pages/bindings；本轮无新增 schema migration。正式购买前 readiness 必须确认 renderer 支持原字节传输。验证冷下载、权限、内存/CPU 和原生水印后才申请生产发布，所有生产写入仍需明确授权。

R2 条件写入协议依据：https://developers.cloudflare.com/r2/api/workers/workers-api-reference/ 。本地 ACK 测试不等于真实 Cloud R2 强一致性验收。

交付前 main 由初始60e2a4d前进到3c197c5；新增1150个路径与本轮18源文件零重叠。已在本任务隔离工作树无覆盖切换最新main，源码SHA全部保留；BZR资产行不变。NUM39与Subject workspace源码现已进入main，后者仍是loopback/local GET candidate，不代表外部图表商业持久化已完成。详见MAIN-SUCCESSOR-RECONCILIATION.json。
