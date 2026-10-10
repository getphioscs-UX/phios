# PHI OS · STATIC VISUAL PAGE BINDING R6

完整交予 Codex 执行的 Master Work Step · 2026-10-10

本工单是现有 VISUAL-BINDING-R5 唯一 Master 的继续执行及范围补齐。R6 是工单版本，不改变图片文件名中的 v1 / v2，不创建第二套生产图片权威。

## 0. 直接执行指令

进入实际 `C:\phios`，读取适用 AGENTS.md，保护所有其他窗口修改；在当前 main 工作区继续完成附件静态视觉资产的实际页面绑定。完成可实施的源码、页面、样式、消费者和本地浏览器验证，不再以登记注册表、生成计划、制作联系表或只给建议作为结束。

本轮用户要求：附件资产全部有实际页面用途；只有具体图片不适合时才允许逐项排除并解释。普通 Figure 尽量只在一个 canonical 页面作为一个主要图位展示；Commerce 商品图可复用。已经用于 Founder 的八张图片跳过新增绑定。Civilization Atlas、已完成 Commerce、方法报告出版资产不重做；共享样式或 resolver 改动仍检查这些功能没有回归。

允许本地 reversible 的 HTML、CSS、页面 JS、绑定配置、正式注册表后继及必要验证脚本修改；允许读取现有授权的公共 R2 资源。模型 provider 调用为 0，不重新生成图片或报告，不触发收费 Ask、收费报告、真实支付、邮件、预约、生产迁移或 R2 写操作。不自动 commit、push、deploy，不覆盖其他窗口，不 reset/clean，不修改冻结哈希或弱化业务安全断言制造 PASS。

完成本地 reviewable 结果后停在 READY_FOR_HUMAN_REVIEW。部署与生产上线作为独立后续步骤，不能用本地 PASS 宣称 getphios.com 已更新。

## 1. 本次已核对的远程基线与真实未完成原因

本文件核对的是 `getphioscs-UX/phios` 的远程 main，branch API 返回 HEAD：

`609105c9dc67ac5e8ac1966094ea40f39f8d1922`（commit time 2026-10-10T08:51:37Z）。

本次没有访问 Windows 未提交工作，也没有执行仓库测试、R2 实时字节核验或部署。Codex 必须重新建立本地当前基线。本次尝试读取 getphios.com 公共页面未成功，因此生产状态为 LIVE_UNVERIFIED，不把源代码观察当成线上截图。

已读取并核对：

- `content/customer-experience-rebuild/authority/customer-visual-asset-registry-v4.json`
- `content/production-closure/live-customer-commercial-convergence/VISUAL-BINDING-R5-CLOSURE.json`
- 同目录 `VISUAL-BINDING-R5-ASSET-TO-CONSUMER.json`、`VISUAL-BINDING-R5-89-R2-VERIFICATION.json`、`VISUAL-BINDING-R5-UPLOAD-DELTA-OWNER-RECORD.json`、`VISUAL-BINDING-R5-ROUTE-COVERAGE.json`、`VISUAL-BINDING-R5-MASTER-OWNER-SOURCE.md`、`VISUAL-BINDING-R5-FINAL-BUILD-EVIDENCE-INHERITANCE.json`
- `assets/customer-ui/js/surfaces/visual-binding-r5-guides.js`、`assets/customer-ui/js/public-index-copy.js`、`assets/customer-ui/js/static-atmosphere.js`
- `assets/js/runtime/web-production/asset-resolver.js`、`assets/js/public-v2/unified-public-visual-resolver.js`、`assets/js/pages/knowledge-spine-visuals.js`
- 首页、Reality、Account、Perspectives、Profile、Tarot、I Ching、Knowledge、Ask、Professional、Financial、Services、`about/founder/index.html`、`package.json`、`_redirects`、`wrangler.jsonc` 以及 `scripts/check-visual-binding-r5.mjs`。

### 已有证据如何解释页面仍然空白

| 证据 | 本次结论 | 需要继续的工作 |
|---|---|---|
| R5 closure.status = PARTIAL | 以前交付没有完成全站绑定 | 继续现有 Master，不能重新从零设计或称已完成 |
| 89 records；82 decoded；7 failed；v4 有 82 个 r5Sequence 条目 | 大部分素材已经有取得/解码证据 | 本地核对 hash 和版本，复用有效缓存；对变化和失败素材重新核实 |
| R5 台账：new89Bound=42、new89Pending=47，另有 3 个 Hero correction | 注册成功和实际消费者完成不是同一件事 | 逐资产把剩余消费者、真实状态、UI 位置做完 |
| 通用 guides 只配置首页、Explore、Reality、Account、Profile、Tarot | 并未覆盖全部新图的页面 | 补 I Ching、Knowledge、Ask、Services、Will、Relationship、搜索、Academy、政策等 |
| guides 大多数创建默认未打开的 details，toggle 后才 hydrate | 图被折叠隐藏；“已绑定”也不一定改善默认页面空白 | 重排为正文内可见图；复杂附加说明才折叠 |
| guides 找不到 host 或 asset.available 时直接 continue | selector 漂移/状态未触发可能静默漏图 | 生成缺槽、缺资产、门控与真实显示证据，不靠 source 字符串存在 |
| Financial 7 张 v2 已有数据阶段图位；第 32 张缺失时仍用旧 boundary | 有局部实装，需要保留及优化呈现 | 不重复绑定；核对第 32 张后按 owner 做替换 |
| `/professional/services/` 源 HTML 未见 img；`/knowledge/ask/` 主要是 Logo；I Ching entry 未见新图消费者 | 本次检查到的这些源码确实仍缺相关新素材接线 | 按下文图位表实际实施，不以全部图片在 R2 为完成 |
| closure: DEPLOYED_VERIFIED=NOT_RUN、LIVE_CUSTOMER_VERIFIED=NOT_RUN | 已有工作没有生产显示验证 | 本地完成后单独准备部署候选，不自动发布 |
| 旧 checker 输出“30 ready / 59 missing”，但当前 registry/verification 为 82/7 | 旧验证摘要已经落后于实际资料 | 改为计算当前状态，不重写历史收据；保留业务和图片有效性断言 |

`42/47` 是已读取 R5 台账数，不是本次完整独立浏览器计数。它的 HEAD 及若干收据与当前 main 不同；执行方必须用当前代码重新生成状态。不能只因为 HEAD 改变就重跑一切；也不能不比较被测文件 hash 就继承旧浏览器 PASS。

## 2. W00｜当前工作区、并发保护与输入冻结

先记录：当前时间、HEAD、branch、origin/main、远程 main、git status --short、tracked diff、untracked 清单、影响文件 hash。读取 `C:\AGENTS.md`、`C:\phios\AGENTS.md` 及适用子目录规则（只读存在且适用的文件）。

保护 Founder/Commerce/BaZi/Zi Wei/Astrology/Navigation/Profile/Financial/Tarot/Ask/Book/Pages 修复窗口。不能把本工单开始前已有修改归为本轮，也不能复制旧文件覆盖已经演进的实现。需要触碰同一个文件时先读取当前内容，采用最小增量；不能判断谁在工作时记录 UNKNOWN_CONCURRENT_OWNER，不编造已完成或进行中的事实。普通审查及独立图位实施继续，不因某个共享文件冲突停止全部任务。

附件 `Pasted text(20261010-091228).txt` 是本轮输入。它包含 89 条编号资产之外的 Logo、31 个旧编号 Hero、8 个 Book branding、10 个 illustration、Account SVG、Icons 和背景身份。经本次文本提取，共有 **151 个不同的明确 PHIOS 文件名**，另有未给完整文件名的图标及 8 个背景/装饰身份。不能把“89张”当成整个附件的上限。

原始 R4/R5 CSV、JSON 和旧证据保留。附件出现表格破损、尾反引号、目录大小写以及旧编号冲突时，先建立 reconciliation，再使用实际对象；不将粘贴格式错误写入 URL。新文件保存到现有 Master owner 目录并由一个审阅入口串起来。

## 3. W01｜Founder skip 与一图一次规则

用户明确以下八张已绑定在新 Founder 页面，本轮跳过新增图位：

1. PHIOS-FIGURE-PLATFORM-RELATIONSHIP-NETWORK-v1.webp（序号 07）
2. PHIOS-FIGURE-NAVIGATION-FORMATION-1B-v1.webp（13）
3. PHIOS-FIGURE-OBSERVATION-RETURN-LOOP-v1.webp（17）
4. PHIOS-FIGURE-OBSERVATION-EVIDENCE-KNOWLEDGE-v1.webp（76）
5. PHIOS-FIGURE-HUMAN-SYSTEM-RESPONSIBILITY-v1.webp（77）
6. PHIOS-FIGURE-CROSS-DOMAIN-CONTEXT-LINKS-v1.webp（79）
7. PHIOS-FIGURE-EVIDENCE-INTERPRETATION-NETWORK-v1.webp（12）
8. PHIOS-FIGURE-CUSTOMER-ENTRY-PATHS-v1.webp（08）

记录为 OWNER_CONFIRMED_FOUNDER_BOUND_SKIP。当前远程 `about/founder/index.html` 未足以证明这八张的新接线；新 Founder 可能在本地未提交或另一窗口。此证据差异不能推翻用户 skip，也不能擅自回写 Founder。读取当前 Founder 权威和本地页面取得图位/hash 后更新证据，不重复要求用户确认同一指示。

R5 guides 仍含 07/08/12/13/17 的非 Founder 图位，先列出这些重复。仅针对本轮说明图的重复入口做可撤销禁用/移除；不删除图片、不删除出版图、不清空业务 panel、不修改导航形成核心运行 UI。Founder 主图位保留。如 Founder 窗口仍在写文件，记录该 owner 的完成依赖，不覆盖。

数量核对：89 - 8 = **81 条本轮非 Founder 编号资产**。旧台账 42 条 source-bound 内含上述 5 条，因此在其余 81 条中，台账记录约 37 条 source-bound、44 条仍待补齐；这仅用于发现，不作为当前完成证明。

一图一次按“同一 objectKey/hash 的主语义展示槽”检查，不仅按 assetId。必须检查别名、直接 URL、CSS 背景和动态注入。一个普通 Figure 分配一个 canonical 主要页面/组件槽，其他页面用文字链接指向该消费者；同一动态组件重绘不算复用，同一页面同时两个图位算重复。语言切换在同一槽复用同一图不算多次；重定向别名不算第二个页面。Commerce 商品图可复用，记录用途；品牌 Logo/Favicon/UI 图标属于必要界面标识，按共享 shell 角色使用，不强行只出现一次。状态说明图仍各分配一个主要状态消费者，不自动全站复用四张图。

## 4. W02｜七个旧失败 key 与不适用例外

### 七条技术缺口必须局部重查

| 序号 | 旧核验请求 | 本轮处置 |
|---|---|---|
| 09 | images/figures/Entrance/PHIOS-FIGURE-CURRENT-REALITY-NETWORK-v1.webp | 核当前上传对象；成功后绑定 Reality 当前处境说明 |
| 14 | images/figures/Entrance/PHIOS-FIGURE-STRUCTURAL-REINFORCEMENT-EVIDENCE-v1.webp | 核当前上传对象；成功后绑定 Reality 依据/连接强化说明 |
| 32 | images/figures/financial/PHIOS-FIGURE-EVIDENCE-DECISION-BOUNDARY-v2.webp | 核当前上传对象；成功后依 Financial owner 替换对应旧 boundary 槽，不重复追加 |
| 61 | 旧请求 PHIOS-ILLUSTRATION-NATURE-EXPERIENCE-SCOPE-v1.webp | **附件是 PHIOS-ILLUSTRATION-NATURAL-HEALER-SERVICE-SCOPE-v1.webp**。重新核准确 key，不延用旧名字继续等待上传；两个对象若都存在，按本轮正确语义选一份 |
| 68 | images/figures/Entrance/PHIOS-FIGURE-SEARCH-RESULT-RELATIONSHIPS-v1.webp | 上传可能已继续；核当前 key，成功后绑定搜索来源分组说明 |
| 69 | images/figures/Entrance/PHIOS-FIGURE-ACADEMY-LEARNING-NETWORK-v1.webp | 核当前 key，成功后绑定 Academy 学习网络 |
| 70 | images/figures/Entrance/PHIOS-FIGURE-LEARNING-TO-REALITY-APPLICATION-v1.webp | 核当前 key，成功后绑定课程应用模块 |

旧 404 不能表述为今天未上传；新 owner 上传说明也不能自动成为 200/decoded。只重查失败、名字不同、hash 已变化的对象。对 61 的目录仍需按当前 owner 核对 `Entrance`，不要把“自然体验”推断成 Financial 或 Hero。

### 易经两张需具体内容复核

旧 owner record 对 47（SIX-LINES-ORDER）及 48（PRIMARY-CHANGING-RELATING）记录爻数不是规范六爻。这是可解释的实际不适用风险，不是因为没有消费者就排除。

读取本轮实际图片/现有解码缓存，检查六爻从下至上与本卦/之卦是否均为六爻。旧问题仍存在时记 EXCLUDED_WITH_REASON_SEMANTIC_ERROR，附截图、标注及受影响图位；不放入面向客户的教学或起卦 UI，不用 caption 掩盖错误，不修改原图。继续保留真实 deterministic 卦图。修正版尚不存在时仅局部阻塞这两张，不调用 provider 重画，不阻止其他所有合适资产。若新上传 hash 已修正，则解除局部排除并绑定。

其他排除必须逐项有具体可见问题（错误主题、图内承诺与产品不符、实质重复、不能安全显示的敏感信息、损坏等），列 filename/key/hash/截图/原因/替代措施。不能因为前台暂无功能、未部署、没有空槽、需要登录或较复杂就写“不适合”。这些分别是 BLOCKED_DEPENDENCY / GATED / IMPLEMENTATION_PENDING。

## 5. W03｜真实路由与正式资产身份

从当前 `_redirects`、sitemap、Pages filter、被跟踪 HTML、JS links/模板和既有 registry 发现 canonical route。R5 的 314/367 候选数不是当前全站完成数；文档、tools、fixtures、历史快照及不发布 HTML 不计客户页面。不要重新制作 legacy .html 页面；旧链接映射到当前实际入口。

所有图位使用现有正式资产 resolver/registry 或其受治理的后继；审查工单不能成为平行生产资产系统。当前 v4 是 CX 投影 owner，不把它反向伪装成上游所有权。检查现有 `data-cx-asset`、`data-cx-asset-role`、`data-px2-asset`、`data-pis-hero`、`data-cx-seven-volume-asset`、`data-sc-asset`、src/srcset、CSS 和动态 DOM。禁止两个 hydrator 同时改同一个 img.src。

附件 HERO-023 是 Membership，附件 Book I 为 HERO-024；旧注册表还有不同书册编号。以 registry 版本 + 语义 + filename/key + consumer 判断，不全局按数字替换。特别检查 ILL-006、ILL-009 等历史编号曾被不同页面当成其他主题；同样按语义和实际图核对。

89 个精确目录在现有 owner 为：81 个 `images/figures/Entrance/`（大写 E），8 个 `images/figures/financial/`（小写 f）。附件标题 Financial 与旧 owner lowercase 有差异，先核准确存储对象，不能按标题拼出第二个 URL。三张新增 Hero（59、71、78）本身仍在 Entrance，不搬入 images/hero。

获取真实 bytes 时记录 requestedURL/finalURL/status/content-type/actual-format/width/height/bytes/SHA-256/time。200 HTML、损坏解码、零尺寸失败；ETag 不当 SHA。复用已验缓存，记录 R2 GET 次数和实际基础设施操作；零 provider 不等于宣称所有网络基础设施绝对免费。

## 6. W04｜把图布置成页面，而不是隐藏图册

每张图有清楚的内容目的、与上下文相邻的标题/简短文字和真实操作链接。不要在底部重建 13 张“展开主题总结图”合集，不将 89 图堆到首页，不新增无业务的 Gallery 页面来完成计数。

Hero 与文案分离，深蓝/深青绿、暖金与米色质感保持已接受设计；默认首屏可见，eager、高优先级、真实宽高。图不能把主要操作挤出首屏。信息图用 contain + 真实宽高比，图例/节点完整，禁止 cover 裁断。说明图默认可见，不能普遍以折叠、用户滚到页面底部或点开图册才有视觉。功能表单、draw 按钮及结果可读性优先；进入某个真实状态后再显示相关图，不公开隐藏的私人资料。

密集图一般独立主内容宽度：桌面按实际图可读性约 720–1120 px，移动按容器自然宽度；不硬性用一个高度撑出大量空白。图内文字不可读时提供相邻 HTML 释义及可键盘操作放大视图，不能用极小缩略图配“点击放大”当默认设计完成。英文页面使用实际存在的语言变体或提供英文 HTML 等义说明；不能造不存在的 -en 文件，不能遮盖位图中文。Alt、caption、按钮同步既有 locale owner。

普通文本对比度至少 4.5:1、大文本 3:1，渐变/图背景人工复核。深底用合适 mono-light/已接受 Logo，不加白色底板覆盖品牌图。图容器的颜色不能污染表单、Professional 正文或 dialog。

动态图槽要与现有 render lifecycle 一起 mount，重复 render/locale/reset 不叠加；避免依赖全页 MutationObserver 无限扫描。找不到 selector 不静默跳过，输出 MISSING_SLOT；有条件门控写实际触发。hydrate 不能在隐藏懒加载 img 上等待而形成死锁；显示布局盒后加载，失败返回文字，不递归加载另一个失败图片。

## 7. W05｜按页面组直接实施

按附录逐资产执行，并以当前实际 DOM owner 确认准确 selector；附录是完整图位意图，不是假定已存在的 selector。新语义槽按项目规范命名，写入真实模板，不能仅写进审查 JSON。

### A. 首页与 Explore

六个入口插画已经有 R5 动态目标，保留已完成 hash/布局证据，改为六个自然入口卡片的可见媒体；不要重复 Hero-012/015 与新入口图同时挤在同一张卡。Homepage 主 Hero 只选一份；八册总览 Hero 与八册知识网络 Figure 分配不同主题段，不重复堆叠。07/08 属 Founder skip，Explore 用文字入口，不再挂同一张网图。

### B. Reality / Navigation

用户已要求撤销旧总结图大合集，不能恢复。09/10/11/14/15/16分别服务当前处境、方向、变化、依据、限制、未知模块。12/13/17 已用于 Founder，只移除重复说明图消费；实际网络运行 UI、证据及 review panel 保持当前 owner。通过既有公共说明或受控真实页面状态给默认页面适当可见图，不为了展示图片自动建立导航、自动保存或伪造 Observation。

### C. My PHI / Account

18 主账户图，19–24在用途授权、交付、人物权限、版本、临时/保存、访问恢复各自真实区域。合适公开说明可在 guest 页面说明产品；报告列表/人物实际数据仍按 auth 权威。不能将 `#account-drafts` 的临时 selector 当成永久 timeline owner。Account guest、登录空、已有报告、不同权限各测；private 查询用已授权 read-only 或明确本地 fixture，不能直接在 production 注入 QA header。

### D. Financial / Will / Professional

保留 25–31 已有阶段接线，默认布局优化为信息图＋真实 intake。32成功后只替换 boundary 对应图，不再叠加旧版。Financial 静态说明不是客户资产/债务或投资建议；不得修改输入规则、计算、Consent、FCR/HFP/testamentary authority。Will 56/57/59各对应责任、正式成立边界、首屏；Will 与 Profile/Financial 的既有报告保持单份双语，不增加语言商品版本。

Professional/Services 必须成为有实质内容和图位的页面：52报告与建议区别、53服务交付、54预约状态、55授权、58外部解读者资料、60现金流游戏、61自然体验。不同服务支持图和 Hero 分配对应页面，不新增虚假预约开放或疗效承诺。图片有服务不等于已开放；依当前 service owner 呈现准确可访问说明和状态。

### E. Profile / Tarot / I Ching / Relationship / Perspectives

Profile 33–39在来源、七入口、结果、导入确认、双语 dossier、选择 handoff、差异边界各自环节。保留 PFIG、真实 radar、来源和冻结报告；新说明图不能替代客户数据图。Tarot 40–45分别贴近 question/spread/shuffle/reading/reality/continuity，不能用图片代替洗牌/抽牌功能，也不触发收费报告。I Ching 46/49/50/51绑定 entry/run 当前正确 owner；47/48先视觉纠错复核，不把错误图片接入。象征图不是本次真实卦局。

Perspectives 用78首屏、72同一处境、73来源区别。Relationship 74参与者、75共同权限，保留当前输入及接受的图示。八字/紫微/占星免费 deterministic 命盘和 Accepted Report publication 不重写，不插静态插画冒充真实命盘；共享样式对这些页面抽样回归即可。

### F. Knowledge / Ask / Books / Search / Academy

Ask 用71首屏、62来源网络，紧邻问题与来源控制；不能改回答权限或用图掩盖答非所问。Knowledge 用63发现；Books用64八册、65跨册，66放引导阅读，67放概念/文章/图联系，68搜索真实来源类别，69Academy、70实际课程应用模块。解释图不要伪装实时图谱或搜索结果。

Book Hero 与 Branding 分工：Book detail Hero 用各册Hero；Books listing identity用各册 Branding（已存在正确绑定就保留）。八册图标85单一 Books 总览标识，与正式UI八册SVG身份分开，不假冒可缩放SVG。出版正文图与Civilization Atlas不在本轮重做范围。

### G. Membership / Checkout / Policies / Contact / Status

80会员/单次权益；81付款/权益/交付；82支持入口；83数据处理；84数字内容与服务差异。Commerce已完成商品图片复用现行 resolver，不增改价格、不引入新SKU、不把RM19订阅变成全部报告权益。状态图86/87/88/89各绑定真实状态，分别是无保存、无匹配、缺权限、加载失败；不能把失败当空、把未登录当无报告。

## 8. W06｜Logo、Hero、Brand、Illustration、Icon、Background 范围补齐

附录B完整列出所有明确文件名；不要只做89编号图。

Logo 12变体使用当前正式品牌 owner：Mark、Wordmark、Horizontal、Stacked、Reality Navigation、Getphios锁定式、Mono-Light/Dark、Favicon、App Icon。各自有实际角色和适合明暗背景的条件，不把12张全铺在页面，不为了全部展示新增品牌图库。存在不可同时显示的主题变体，其“实际用途”可由正确主题组件条件触发。共享标识可正常复用；禁止白底板、错误浅色背景、不同viewport重复Logo。

31 Hero按语义分配，旧文件名消费者映射当前 canonical route；未存在的Journey独立阶段页面不能为了Hero强建页面。可以使用当前真实阶段容器的条件主视觉，一个stage一个图；默认内容不堆六个Hero。若图片只有旧体验意义、实质重复且无安全角色，逐项具体排除，不静默漏掉。

8册Brand不得与Hero编号混淆，BRAND-007=Book7 OBSERVATION、BRAND-008=Book8 NAVIGATION。旧两条404证据只代表当时路径；核实际父目录，禁止用Book6/Book7错误图顶替。已有Commerce或Books正确使用记 RETAIN_EXISTING_VERIFIED，不重复布置。

10 Illustration按supporting role，不替换对应Hero；同图已用于首页和Knowledge等多处时选唯一主要语义消费者，其余用图文链接/其他独立合适图位解决密度。没有理由不要任意移走已接受位置。存在重复语义时在副内容实装或提出具体不适用理由。

Icons：附件 global/journey/methods/status列的是语义名字，不是实际文件。逐身份发现完整filename、key、现行owner；不能猜SVG、不能造新文件名、不能把装饰WebP当正式图标。尚未命名的academy/account分组从当前 registry 实际清点，列明发现数，不宣称无限资产“全部完成”。本地上传新SVG若未push，直接读取当前repo文件比对，保留正确版本。

Background：检查8个 VIS-TEX/VIS-DEC身份及 static-atmosphere 的远程验证门控。现有 code要求REMOTE_VERIFIED_ALL_SELECTED及8个active后启用；先核证据和实际CSS变量消费者，不把空CSS变量注册当背景显示。不为了显示降低门控，不在图后叠随机金线，也不能因浅色纹理让文字不可读。装饰允许主题系统共享，不计为普通Figure重复。

## 9. W07｜验证顺序、费用及旧 npm 卡点

从当前package/zero-cost-check-commands解析真实命令，不发明npm alias。优先复用现有检查，记录scope、HEAD、inputHash、exitCode、log。先相关基线，再修改后检查；原失败标BASELINE_FAILURE，新增失败归本轮。不要在失败后用“全部PASS”摘要覆盖。

当前远程已存在以下命令，执行前核本地实现及provider防护：

```powershell
Set-Location -LiteralPath 'C:\phios'
npm run check:report-provider-spend-protection
npm run check:visual-binding:r5
npm run check:client-visual-consumption-current
npm run check:cx-home
npm run check:cx-knowledge
npm run check:production-locale
npm run check:free-symbolic-zero-provider
npm run check:tarot-interaction-source
npm run check:runtime-security-privacy
npm run check:my-reality-saved-sources
npm run check:pc-r1
npm run check:profile:prd-w11r6
npm run build:pages
npm run check:pages-build
```

按影响选择执行，不重复运行昂贵或无关历史campaign；凡可能触发provider的脚本先确认zero-cost preload确实拦截。没有 credentials 不读出secret或要求用户重新贴key。对 build:pages 读取脚本确认只写可再生build output；build不能覆写并发生产源文件。`wrangler.jsonc`当前输出目录为`.pages-output`；使用其真实输出进行preview。

R5 checker的固定“30 / 59”摘要需要改为从当前证据计算，保留unique identity、有效hash、decoded、不得推广失败素材、Financial input未变、predecessor未改等断言。扩充本轮consumer/state/unicity测试，不能只增加source includes断言。

历史PPR W55–W66要求`mountFinalPersonalReadingExperience(view)`，而新产品route renderer退役旧总览，是另一个迁移owner的gate冲突；本工单不得恢复旧总览或删除断言制造PASS。同理PDS Migration acceptance、Book/Health freeze失败单独列明owner和对象；继续完成可独立验证的视觉工作，不把这些失败归视觉绑定。

Pages缺`_worker.js`/`_routes.json`时核build输出/检查路径/生成顺序；不在repo root写假空文件，不弱化publication boundary。各条失败区分源文件问题、构建产物缺失、依赖/服务器环境、真实布局失败和历史gate。

### 必须新增的有意义验收

1. 附件全集覆盖：151明确filename及其余身份都有disposition；89序号逐行无缺失，8Founder skip单列；没有“pending未知”伪PASS。
2. 普通Figure唯一主要consumer：按key/hash/alias而非仅assetId计数；Founder重复已解决，Commerce例外可追踪。
3. 动态真实到达：打开当前canonical route、触发既有form/结果/dialog/tab/state，断言img真实decode、visible bounding box、不被父hidden、不重复、不被另一个hydrator改掉。
4. 默认视觉密度：首页、Perspectives、Professional、Services、Knowledge、Ask、Account适合展示的首屏/内容图默认可见，不靠全部折叠。截图before/after验证空间利用和主要操作可见性，不能只计img数量。
5. 语言与布局：en/zh-Hans，375/768/1280宽；200% zoom；键盘；图放大关闭/焦点返回；打印屏幕无裁切/重复/大片空白，图片decode失败文字fallback。
6. 业务隔离：静态解释图不写客户数据、不自动save、不改auth/consent/entitlement；Tarot绘图操作、IChing六爻、Profile PFIG、Financial计算维持原真实owner。
7. 当前build actual bytes：在.pages-output跑preview，与源SHA、构建digest一致；旧browser receipt只有逐依赖hash相同才继承。

Provider calls=0、realPayments=0、R2writes=0、productionMigrations=0；R2GET/网络请求实际计数。图片和知识内容不重新生产。对已有缓存/截图证据只重跑变化或未覆盖状态，避免浪费quota。

## 10. W08｜同一Master的交付与完成定义

更新现有R5目录，增加R6当前后继证据；不覆写旧收据、不用重新包装计划抹去未完成任务。至少包括：

- CURRENT-BASELINE：HEAD/branch/origin/dirty/hash/并发owner；完成后再次记录终态。
- ASSET-RECONCILIATION：附件151个明确filename＋未命名身份，正确key，旧号/新号/alias，真实图片角色。
- ASSET-TO-CONSUMER：每个asset的完整filename/key/hash/route/sourceFile/准确selector/trigger/locale/displayPolicy/primaryConsumer/reuseException。
- FOUNDER-SKIP-AND-DUPLICATES：八张skip、本地/远程证据差异、重复非Founder图位处置。
- R2-VERIFICATION：旧证据有效性、变化复核、7项新结果、61filename correction、实际GET数。
- UNSUITABLE-ASSETS：具体原因/图像证据/风险/替代措施；无不适用也写0，不使用泛化理由。
- SOURCE-AND-BUILT-BROWSER：route/state/viewport/locale/sourceHash/buildDigest/screenshot/log/visible/decoded。
- RELATED-CHECKS：基线/修改后/真实失败对象/历史gate/owner，不宣称未跑PASS。
- CHANGE-AND-ROLLBACK：本轮文件列表、准确diff、保护的其他window修改、仅本轮hunk恢复方法。
- COMPLETION：完成/保留/skip/不适用/blocked各项数、所有具体缺口，SOURCE_IMPLEMENTED、LOCAL_BROWSER_VERIFIED、DEPLOYED、LIVE_CUSTOMER_VERIFIED分开。

制作或继续既有唯一审阅入口：`C:\phios\tools\review\PHIOS-STATIC-VISUAL-MASTER-R1-HUMAN-REVIEW.html`（如当前owner已有另一个唯一入口，保留它并让这个地址链接至该入口，不制造互相竞争的Master）。入口必须可直接查看逐页before/after、逐图当前位置、放大图、完整filename、处置及局部错误，不只给CSV或源文件清单。

不得把图片只显示在审阅页就记为客户页消费者。截图或localhost链接要提供实际打开方式；不能把助手不能访问127.0.0.1当成用户不能访问，也不能把source screenshot当deployed screenshot。

READY_FOR_HUMAN_REVIEW条件：所有可适用资产已有实际消费者与本地可达显示证据；Founder重复按本轮要求处理；明确不适用逐项可审；所有剩余技术/业务依赖逐项点名，未验证事实清楚标出。存在遗漏的可实施消费者时保持PARTIAL并继续工作；存在局部素材/owner阻塞时完成其他工作后交PARTIAL_READY_FOR_REVIEW，不能称全站完成。

最终向用户报告：本轮完成哪些实际页面、哪些图已保留/新绑定/移除重复、哪些具体不适用或key仍失败、provider费用、检查结果、当前是否仍未部署。提供可逐项审核的入口和diff，不自动请求Human ACCEPT尚未完成的“全部”。部署获得明确后续授权才执行。

## 附录 A｜89条编号资产完整实施映射

下面使用本轮附件的准确filename；位置是实施指令。已有R5绑定保留并优化，不重复实现。现有selector如不准确，按当前owner实现真实语义槽并记录最终selector。

| 序号 | 完整文件名 / 准确R2 key | 唯一主要消费者与图位 | 实施 / 已有证据 |
|---|---|---|---|
| 01 | `images/figures/Entrance/PHIOS-ILLUSTRATION-HOME-QUESTION-ENTRY-v1.webp` | `/` · 问题入口卡 | R5台账source-bound；保留/优化并补当前显示证据；直接可见；去Ask |
| 02 | `images/figures/Entrance/PHIOS-ILLUSTRATION-HOME-READING-ENTRY-v1.webp` | `/` · 阅读入口卡 | R5台账source-bound；保留/优化并补当前显示证据；直接可见；去Knowledge |
| 03 | `images/figures/Entrance/PHIOS-ILLUSTRATION-HOME-REALITY-ENTRY-v1.webp` | `/` · 当前处境入口卡 | R5台账source-bound；保留/优化并补当前显示证据；直接可见；去Reality |
| 04 | `images/figures/Entrance/PHIOS-ILLUSTRATION-HOME-PERSPECTIVE-ENTRY-v1.webp` | `/` · 换个视角入口卡 | R5台账source-bound；保留/优化并补当前显示证据；直接可见；去Perspectives |
| 05 | `images/figures/Entrance/PHIOS-ILLUSTRATION-HOME-CONTINUITY-ENTRY-v1.webp` | `/` · 持续观察入口卡 | R5台账source-bound；保留/优化并补当前显示证据；直接可见；去Account或当前continuity入口 |
| 06 | `images/figures/Entrance/PHIOS-ILLUSTRATION-HOME-PROFESSIONAL-ENTRY-v1.webp` | `/` · 专业帮助入口卡 | R5台账source-bound；保留/优化并补当前显示证据；直接可见；去Professional |
| 07 | `images/figures/Entrance/PHIOS-FIGURE-PLATFORM-RELATIONSHIP-NETWORK-v1.webp` | `/about/founder/` · Founder现行图位 | FOUNDER_SKIP；本轮不新增绑定；SKIP；取消其他页面重复图位 |
| 08 | `images/figures/Entrance/PHIOS-FIGURE-CUSTOMER-ENTRY-PATHS-v1.webp` | `/about/founder/` · Founder现行图位 | FOUNDER_SKIP；本轮不新增绑定；SKIP；Explore保留文字链接 |
| 09 | `images/figures/Entrance/PHIOS-FIGURE-CURRENT-REALITY-NETWORK-v1.webp` | `/reality/` · 当前处境说明 | 旧核验失败待重查；当前context区域；不假冒客户实际网络 |
| 10 | `images/figures/Entrance/PHIOS-FIGURE-DIRECTION-POSITION-NETWORK-v1.webp` | `/reality/` · 方向与位置说明 | R5台账source-bound；保留/优化并补当前显示证据；Navigation区域；与运行图分开 |
| 11 | `images/figures/Entrance/PHIOS-FIGURE-REALITY-EVOLUTION-NETWORK-v1.webp` | `/reality/` · 变化与版本说明 | R5台账source-bound；保留/优化并补当前显示证据；history区域；不自动建立记录 |
| 12 | `images/figures/Entrance/PHIOS-FIGURE-EVIDENCE-INTERPRETATION-NETWORK-v1.webp` | `/about/founder/` · Founder现行图位 | FOUNDER_SKIP；本轮不新增绑定；SKIP；Reading保留其他独立说明 |
| 13 | `images/figures/Entrance/PHIOS-FIGURE-NAVIGATION-FORMATION-1B-v1.webp` | `/about/founder/` · Founder现行图位 | FOUNDER_SKIP；本轮不新增绑定；SKIP；保留Reality真实network UI |
| 14 | `images/figures/Entrance/PHIOS-FIGURE-STRUCTURAL-REINFORCEMENT-EVIDENCE-v1.webp` | `/reality/` · 连接与依据说明 | 旧核验失败待重查；证据support区域；核失败key |
| 15 | `images/figures/Entrance/PHIOS-FIGURE-CHOICE-SPACE-CONSTRAINTS-v1.webp` | `/reality/` · 选择与限制说明 | R5台账source-bound；保留/优化并补当前显示证据；Navigation条件区域；与10各有不同解释 |
| 16 | `images/figures/Entrance/PHIOS-FIGURE-CURRENT-UNKNOWN-FOCUS-v1.webp` | `/reality/` · 未知与待确认说明 | R5台账source-bound；保留/优化并补当前显示证据；当前context缺口区域 |
| 17 | `images/figures/Entrance/PHIOS-FIGURE-OBSERVATION-RETURN-LOOP-v1.webp` | `/about/founder/` · Founder现行图位 | FOUNDER_SKIP；本轮不新增绑定；SKIP；Review保留真实运行UI |
| 18 | `images/figures/Entrance/PHIOS-FIGURE-MY-PHI-ACCOUNT-NETWORK-v2.webp` | `/account/` · My PHI账户总览 | R5台账source-bound；保留/优化并补当前显示证据；公开产品说明可见，私有数据依auth |
| 19 | `images/figures/Entrance/PHIOS-FIGURE-ACCOUNT-CONSENT-SCOPE-v1.webp` | `/account/` · 资料授权说明 | R5台账source-bound；保留/优化并补当前显示证据；当前consent/用途区域 |
| 20 | `images/figures/Entrance/PHIOS-FIGURE-REPORT-DELIVERY-CONTINUITY-v1.webp` | `/account/` · 报告交付与重开说明 | R5台账source-bound；保留/优化并补当前显示证据；报告区域；下载权限保持现状 |
| 21 | `images/figures/Entrance/PHIOS-FIGURE-ACCOUNT-PEOPLE-PERMISSIONS-v1.webp` | `/account/` · 人物与访问说明 | R5台账source-bound；保留/优化并补当前显示证据；persons区域；真实权限门控 |
| 22 | `images/figures/Entrance/PHIOS-FIGURE-ACCOUNT-TIMELINE-VERSIONS-v1.webp` | `/account/` · 时间和版本说明 | R5台账source-bound；保留/优化并补当前显示证据；实际timeline/version owner，不盲用drafts槽 |
| 23 | `images/figures/Entrance/PHIOS-FIGURE-ACCOUNT-SAVED-VS-SESSION-v1.webp` | `/account/` · 临时与保存说明 | R5台账source-bound；保留/优化并补当前显示证据；实际saved/session区域 |
| 24 | `images/figures/Entrance/PHIOS-FIGURE-ACCOUNT-ACCESS-RECOVERY-v1.webp` | `/account/` · 登录和恢复说明 | R5台账source-bound；保留/优化并补当前显示证据；auth/recovery区域 |
| 25 | `images/figures/financial/PHIOS-FIGURE-FINANCIAL-REALITY-SYSTEM-MAP-v2.webp` | `/professional/financial/` · 财务整体关系说明 | R5台账source-bound；保留/优化并补当前显示证据；已有household阶段槽保留 |
| 26 | `images/figures/financial/PHIOS-FIGURE-INCOME-EXPENSE-FLOW-v2.webp` | `/professional/financial/` · 收入与支出说明 | R5台账source-bound；保留/优化并补当前显示证据；已有income阶段槽保留 |
| 27 | `images/figures/financial/PHIOS-FIGURE-ASSETS-LIABILITIES-STRUCTURE-v2.webp` | `/professional/financial/` · 资产债务与权属说明 | R5台账source-bound；保留/优化并补当前显示证据；已有assets阶段槽保留 |
| 28 | `images/figures/financial/PHIOS-FIGURE-CASHFLOW-RUNTIME-v2.webp` | `/professional/financial/` · 现金流时间结构 | R5台账source-bound；保留/优化并补当前显示证据；已有expenses阶段槽核语义适配 |
| 29 | `images/figures/financial/PHIOS-FIGURE-RISK-CONSTRAINT-MAP-v2.webp` | `/professional/financial/` · 风险与约束说明 | R5台账source-bound；保留/优化并补当前显示证据；已有protection阶段槽保留 |
| 30 | `images/figures/financial/PHIOS-FIGURE-FINANCIAL-DECISION-FLOW-v2.webp` | `/professional/financial/` · 可能方向与条件 | R5台账source-bound；保留/优化并补当前显示证据；已有goals阶段槽保留 |
| 31 | `images/figures/financial/PHIOS-FIGURE-FINANCIAL-CONTINUITY-v2.webp` | `/professional/financial/` · 变化与复核说明 | R5台账source-bound；保留/优化并补当前显示证据；已有documents阶段槽核owner |
| 32 | `images/figures/financial/PHIOS-FIGURE-EVIDENCE-DECISION-BOUNDARY-v2.webp` | `/professional/financial/` · 证据决策边界 | 旧核验失败待重查；替换既有boundary图位；核失败key |
| 33 | `images/figures/Entrance/PHIOS-FIGURE-PROFILE-EVIDENCE-SOURCES-v1.webp` | `/perspectives/profile/` · 个人证据来源 | R5台账source-bound；保留/优化并补当前显示证据；输入前可见说明；不是客户PFIG |
| 34 | `images/figures/Entrance/PHIOS-FIGURE-PROFILE-SEVEN-ENTRY-MODES-v1.webp` | `/perspectives/profile/` · 七入口模式 | R5台账source-bound；保留/优化并补当前显示证据；模式选择旁可见；与33不同内容段 |
| 35 | `images/figures/Entrance/PHIOS-FIGURE-PROFILE-RESULT-READING-KEY-v1.webp` | `/perspectives/profile/` · 怎样读结果 | R5台账source-bound；保留/优化并补当前显示证据；真实结果状态说明 |
| 36 | `images/figures/Entrance/PHIOS-FIGURE-PROFILE-EXTERNAL-CONFIRMATION-v1.webp` | `/perspectives/profile/` · 外部来源确认 | R5台账source-bound；保留/优化并补当前显示证据；真实import/workbench可见时 |
| 37 | `images/figures/Entrance/PHIOS-FIGURE-PROFILE-BILINGUAL-DOSSIER-ACCESS-v1.webp` | `/perspectives/profile/` · 单份双语dossier | R5台账source-bound；保留/优化并补当前显示证据；实际dossier访问dialog，不生成新语言SKU |
| 38 | `images/figures/Entrance/PHIOS-FIGURE-PROFILE-SELECTIVE-REALITY-HANDOFF-v1.webp` | `/perspectives/profile/` · 选择后交接Reality | R5台账source-bound；保留/优化并补当前显示证据；真实handoff选择panel |
| 39 | `images/figures/Entrance/PHIOS-FIGURE-PROFILE-SOURCE-DIFFERENCES-v1.webp` | `/perspectives/profile/` · 差异和缺口 | R5台账source-bound；保留/优化并补当前显示证据；结果边界区域；不掩盖来源差异 |
| 40 | `images/figures/Entrance/PHIOS-FIGURE-TAROT-QUESTION-FOCUS-v1.webp` | `/perspectives/tarot/` · 问题聚焦 | R5台账source-bound；保留/优化并补当前显示证据；question阶段可见 |
| 41 | `images/figures/Entrance/PHIOS-FIGURE-TAROT-SPREAD-POSITIONS-v1.webp` | `/perspectives/tarot/` · 牌阵牌位说明 | R5台账source-bound；保留/优化并补当前显示证据；spread阶段；不是本次牌面 |
| 42 | `images/figures/Entrance/PHIOS-FIGURE-TAROT-SHUFFLE-SELECT-v1.webp` | `/perspectives/tarot/` · 洗牌和选牌说明 | R5台账source-bound；保留/优化并补当前显示证据；draw阶段；保留真实shuffle/select交互 |
| 43 | `images/figures/Entrance/PHIOS-FIGURE-TAROT-CONNECTED-READING-v1.webp` | `/perspectives/tarot/` · 连贯阅读说明 | R5台账source-bound；保留/优化并补当前显示证据；真实interpretation阶段；零费用fixture QA |
| 44 | `images/figures/Entrance/PHIOS-FIGURE-TAROT-REALITY-REFLECTION-v1.webp` | `/perspectives/tarot/` · 现实对照说明 | R5台账source-bound；保留/优化并补当前显示证据；真实Reality阶段 |
| 45 | `images/figures/Entrance/PHIOS-FIGURE-TAROT-READING-CONTINUITY-v1.webp` | `/perspectives/tarot/` · 保存与后续说明 | R5台账source-bound；保留/优化并补当前显示证据；真实next阶段；依consent不自动save |
| 46 | `images/figures/Entrance/PHIOS-FIGURE-ICHING-QUESTION-AND-CAST-v1.webp` | `/perspectives/iching/` · 问题与起卦方式 | 已登记解码，R5消费者台账未绑定；本轮必须补；入口说明；保留run gate |
| 47 | `images/figures/Entrance/PHIOS-FIGURE-ICHING-SIX-LINES-ORDER-v1.webp` | `/perspectives/iching/run/` · 六爻顺序说明 | 已登记解码；旧视觉语义问题待核；先查当前图片六爻正确；错误则局部排除 |
| 48 | `images/figures/Entrance/PHIOS-FIGURE-ICHING-PRIMARY-CHANGING-RELATING-v1.webp` | `/perspectives/iching/run/` · 本卦变爻之卦说明 | 已登记解码；旧视觉语义问题待核；先查三个结构六爻正确；错误则局部排除 |
| 49 | `images/figures/Entrance/PHIOS-FIGURE-ICHING-READING-LAYERS-v1.webp` | `/perspectives/iching/run/` · 阅读层次说明 | 已登记解码，R5消费者台账未绑定；本轮必须补；真实reading区域，不假冒本次解读 |
| 50 | `images/figures/Entrance/PHIOS-FIGURE-ICHING-REALITY-COMPARISON-v1.webp` | `/perspectives/iching/run/` · 象征与现实核对 | 已登记解码，R5消费者台账未绑定；本轮必须补；reflection区域 |
| 51 | `images/figures/Entrance/PHIOS-FIGURE-ICHING-CAST-CONTINUITY-v1.webp` | `/perspectives/iching/run/` · 同卦保存与回看 | 已登记解码，R5消费者台账未绑定；本轮必须补；真实continuity/history区域 |
| 52 | `images/figures/Entrance/PHIOS-FIGURE-PROFESSIONAL-REPORT-REVIEW-ADVICE-v1.webp` | `/professional/` · 报告复核建议区别 | 已登记解码，R5消费者台账未绑定；本轮必须补；服务说明正文可见 |
| 53 | `images/figures/Entrance/PHIOS-FIGURE-SERVICE-SCOPE-DELIVERABLES-v1.webp` | `/professional/services/` · 范围与实际交付 | 已登记解码，R5消费者台账未绑定；本轮必须补；服务范围段可见 |
| 54 | `images/figures/Entrance/PHIOS-FIGURE-APPOINTMENT-REQUEST-LIFECYCLE-v1.webp` | `/professional-appointments` · 预约申请与确认 | 已登记解码，R5消费者台账未绑定；本轮必须补；沿_redirects核canonical；真实状态说明 |
| 55 | `images/figures/Entrance/PHIOS-FIGURE-PROFESSIONAL-CONSENT-HANDOFF-v1.webp` | `/professional-consent-sharing` · 专业资料授权交接 | 已登记解码，R5消费者台账未绑定；本轮必须补；沿_redirects核canonical；consent说明 |
| 56 | `images/figures/Entrance/PHIOS-FIGURE-WILL-ESTATE-RESPONSIBILITY-v1.webp` | `当前Will canonical入口` · 遗产所有权责任 | 已登记解码，R5消费者台账未绑定；本轮必须补；从现有Will owner发现route，不新建重复页 |
| 57 | `images/figures/Entrance/PHIOS-FIGURE-WILL-DRAFT-REVIEW-EXECUTION-v1.webp` | `当前Will canonical入口` · 草稿复核正式成立 | 已登记解码，R5消费者台账未绑定；本轮必须补；现有draft/review说明，非法律成立承诺 |
| 58 | `images/figures/Entrance/PHIOS-FIGURE-EXTERNAL-READER-SOURCE-INTAKE-v1.webp` | `/external-reader-intake` · 外部解读者来源提交 | 已登记解码，R5消费者台账未绑定；本轮必须补；核canonical；保留真实intake gate |
| 59 | `images/figures/Entrance/PHIOS-HERO-WILL-ESTATE-PREPARATION-v1.webp` | `当前Will canonical入口` · 遗嘱准备Hero | 已登记解码，R5消费者台账未绑定；本轮必须补；首屏；文件仍在Entrance |
| 60 | `images/figures/Entrance/PHIOS-ILLUSTRATION-CASHFLOW-GAME-LEARNING-CONTEXT-v1.webp` | `/professional/services/` · 现金流游戏服务段 | 已登记解码，R5消费者台账未绑定；本轮必须补；明确学习体验；现有服务状态 |
| 61 | `images/figures/Entrance/PHIOS-ILLUSTRATION-NATURAL-HEALER-SERVICE-SCOPE-v1.webp` | `/professional/services/` · 自然体验服务段 | 旧核验使用不同filename，必须纠正请求；使用附件NATURAL-HEALER文件名；非旧NATURE key |
| 62 | `images/figures/Entrance/PHIOS-FIGURE-ASK-SOURCE-NETWORK-v1.webp` | `/knowledge/ask/` · 问题与来源联系 | 已登记解码，R5消费者台账未绑定；本轮必须补；来源控制旁可见；不更改Ask权限 |
| 63 | `images/figures/Entrance/PHIOS-FIGURE-KNOWLEDGE-DISCOVERY-NETWORK-v1.webp` | `/knowledge/` · 知识发现网络 | 已登记解码，R5消费者台账未绑定；本轮必须补；公开知识入口正文可见 |
| 64 | `images/figures/Entrance/PHIOS-FIGURE-EIGHT-VOLUME-KNOWLEDGE-NETWORK-v1.webp` | `/books/` · 八册知识联系 | 已登记解码，R5消费者台账未绑定；本轮必须补；总览段；与封面identity分工 |
| 65 | `images/figures/Entrance/PHIOS-FIGURE-CROSS-VOLUME-READING-PATH-v1.webp` | `/books/` · 跨册阅读路径 | 已登记解码，R5消费者台账未绑定；本轮必须补；reading-path段；不是强制顺序 |
| 66 | `images/figures/Entrance/PHIOS-FIGURE-QUESTION-TO-READING-PATH-v1.webp` | `/guided-reading` · 问题进入阅读 | 已登记解码，R5消费者台账未绑定；本轮必须补；核canonical；实际阅读引导段 |
| 67 | `images/figures/Entrance/PHIOS-FIGURE-CONCEPT-ARTICLE-FIGURE-MAP-v1.webp` | `/knowledge/concepts/ 或当前概念canonical` · 概念文章图示联系 | 已登记解码，R5消费者台账未绑定；本轮必须补；选择唯一现行概念入口，不复制两处 |
| 68 | `images/figures/Entrance/PHIOS-FIGURE-SEARCH-RESULT-RELATIONSHIPS-v1.webp` | `/search/` · 来源类别与结果 | 旧核验失败待重查；真实搜索结果说明；核失败key |
| 69 | `images/figures/Entrance/PHIOS-FIGURE-ACADEMY-LEARNING-NETWORK-v1.webp` | `/academy/` · 学习与阅读网络 | 旧核验失败待重查；Academy正文说明；核失败key |
| 70 | `images/figures/Entrance/PHIOS-FIGURE-LEARNING-TO-REALITY-APPLICATION-v1.webp` | `/academy/lesson/` · 学习回到现实 | 旧核验失败待重查；现有Lesson应用模块；核失败key |
| 71 | `images/figures/Entrance/PHIOS-HERO-ASK-KNOWLEDGE-SOURCES-v1.webp` | `/knowledge/ask/` · 知识来源Hero | 已登记解码，R5消费者台账未绑定；本轮必须补；首屏；不要与62重复挤在同一块 |
| 72 | `images/figures/Entrance/PHIOS-FIGURE-PERSPECTIVES-SAME-SITUATION-v1.webp` | `/perspectives/` · 同处境不同视角 | 已登记解码，R5消费者台账未绑定；本轮必须补；正文说明，不是命盘或结果 |
| 73 | `images/figures/Entrance/PHIOS-FIGURE-PERSPECTIVES-SOURCE-BOUNDARIES-v1.webp` | `/perspectives/` · 来源区别 | 已登记解码，R5消费者台账未绑定；本轮必须补；方法选择前说明 |
| 74 | `images/figures/Entrance/PHIOS-FIGURE-RELATIONSHIP-PARTICIPANT-NETWORK-v1.webp` | `/perspectives/relationship/` · 参与者与条件 | 已登记解码，R5消费者台账未绑定；本轮必须补；关系输入与同意相邻 |
| 75 | `images/figures/Entrance/PHIOS-FIGURE-RELATIONSHIP-SHARED-AUTHORITY-v1.webp` | `/perspectives/relationship/` · 共同决定与各自授权 | 已登记解码，R5消费者台账未绑定；本轮必须补；真实shared authority说明 |
| 76 | `images/figures/Entrance/PHIOS-FIGURE-OBSERVATION-EVIDENCE-KNOWLEDGE-v1.webp` | `/about/founder/` · Founder现行图位 | FOUNDER_SKIP；本轮不新增绑定；SKIP |
| 77 | `images/figures/Entrance/PHIOS-FIGURE-HUMAN-SYSTEM-RESPONSIBILITY-v1.webp` | `/about/founder/` · Founder现行图位 | FOUNDER_SKIP；本轮不新增绑定；SKIP |
| 78 | `images/figures/Entrance/PHIOS-HERO-PERSPECTIVES-MULTIPLE-LENSES-v1.webp` | `/perspectives/` · 多视角Hero | 已登记解码，R5消费者台账未绑定；本轮必须补；首屏；与旧PIS视觉做明确替换而非叠加 |
| 79 | `images/figures/Entrance/PHIOS-FIGURE-CROSS-DOMAIN-CONTEXT-LINKS-v1.webp` | `/about/founder/` · Founder现行图位 | FOUNDER_SKIP；本轮不新增绑定；SKIP |
| 80 | `images/figures/Entrance/PHIOS-FIGURE-MEMBERSHIP-ACCESS-BOUNDARIES-v1.webp` | `/membership` · 会员单次权益区别 | 已登记解码，R5消费者台账未绑定；本轮必须补；核canonical；使用当前Commerce权威 |
| 81 | `images/figures/Entrance/PHIOS-FIGURE-PAYMENT-ENTITLEMENT-DELIVERY-v1.webp` | `/checkout` · 付款权益交付 | 已登记解码，R5消费者台账未绑定；本轮必须补；核canonical；说明不更改支付流程 |
| 82 | `images/figures/Entrance/PHIOS-FIGURE-CONTACT-SUPPORT-ROUTING-v1.webp` | `/contact` · 支持入口 | 已登记解码，R5消费者台账未绑定；本轮必须补；核canonical；真实三个contact入口 |
| 83 | `images/figures/Entrance/PHIOS-FIGURE-PRIVACY-DATA-LIFECYCLE-v1.webp` | `/privacy` · 处理保留撤回 | 已登记解码，R5消费者台账未绑定；本轮必须补；核canonical；保持实际隐私政策 |
| 84 | `images/figures/Entrance/PHIOS-FIGURE-DIGITAL-PRODUCT-EXPECTATIONS-v1.webp` | `/digital-product-policy` · 数字内容服务区别 | 已登记解码，R5消费者台账未绑定；本轮必须补；核canonical；不造交付承诺 |
| 85 | `images/figures/Entrance/PHIOS-ICON-EIGHT-BOOKS-ICON-v1.webp` | `/books/` · 八册总览标识 | 已登记解码，R5消费者台账未绑定；本轮必须补；单一页级说明图标；不冒充正式SVG |
| 86 | `images/figures/Entrance/PHIOS-ILLUSTRATION-EMPTY-NO-SAVED-CONTENT-v1.webp` | `/account/` · 真正无已保存内容 | 已登记解码，R5消费者台账未绑定；本轮必须补；登录后真实empty state；网络失败不能触发 |
| 87 | `images/figures/Entrance/PHIOS-ILLUSTRATION-NO-MATCHING-RESULTS-v1.webp` | `/search/` · 真正无匹配来源 | 已登记解码，R5消费者台账未绑定；本轮必须补；真实no-match；与68说明区不同 |
| 88 | `images/figures/Entrance/PHIOS-ILLUSTRATION-ACCESS-REQUIRES-PERMISSION-v1.webp` | `/account/` · 真正需权限状态 | 已登记解码，R5消费者台账未绑定；本轮必须补；guest/permission gate；不暗示账号操作成功 |
| 89 | `images/figures/Entrance/PHIOS-ILLUSTRATION-TEMPORARY-LOAD-FAILURE-v1.webp` | `/knowledge/ask/` · 暂时加载失败 | 已登记解码，R5消费者台账未绑定；本轮必须补；真实来源加载失败；其它页面用文字fallback |

## 附录 B｜其他62个明确文件名的完整图位分配

这是附件其余文件，不是重新生成任务。已绑定正确的消费者保留并验证；旧编号/父目录必须查当前正式owner，不猜路径。表格中的canonical待核项由执行方在W03落实为真实route与selector。

| 完整文件名 | 主要用途与消费者 | 具体处理 |
|---|---|---|
| `PHIOS-LOGO-MARK-v1.svg` | 全站Header紧凑标识 | 复用共享shell role；不把普通Figure一次规则用于Logo |
| `PHIOS-LOGO-WORDMARK-v1.svg` | Header桌面文字标识 | 与Mark组合遵守品牌spacing；避免重复锁定式Logo |
| `PHIOS-LOGO-PRIMARY-HORIZONTAL-v1.svg` | 桌面Header主锁定式 | 现行theme owner选择；浅底版本只在适配浅底时显示 |
| `PHIOS-LOGO-PRIMARY-STACKED-v1.svg` | Footer品牌段 | 与Header角色不同；正式品牌间距 |
| `PHIOS-LOGO-REALITY-NAVIGATION-LOCKUP-v1.svg` | /about/reality-navigation/品牌身份 | 专题身份，不另增大图版式 |
| `PHIOS-LOGO-GETPHIOS-COM-LOCKUP-v1.svg` | Footer域名品牌身份 | 遵守用户不可白底要求；与stacked按角色择一，不叠满 |
| `PHIOS-LOGO-MARK-MONO-DARK-v1.svg` | 共享Mark浅底/打印条件 | 真实明暗条件触发；不在深底使用 |
| `PHIOS-LOGO-MARK-MONO-LIGHT-v1.svg` | 共享Mark深底条件 | 真实深底Header可见；检查Logo背景相似问题 |
| `PHIOS-LOGO-PRIMARY-MONO-DARK-v1.svg` | 共享Primary浅底/打印条件 | 与primary light互斥，测试实际主题 |
| `PHIOS-LOGO-PRIMARY-MONO-LIGHT-v1.svg` | 共享Primary深底条件 | 与primary dark互斥，测试实际主题 |
| `PHIOS-FAVICON-v1.svg` | link rel=icon | 沿当前favicon authority；核浏览器可取得 |
| `PHIOS-APP-ICON-v1.svg` | site.webmanifest图标 | 核正式manifest与实际尺寸用途；不假称已安装PWA |
| `PHIOS-HERO-REALITY-NAVIGATION-v1.webp` | / | 主页Hero；About/Founder不得重复主图，已接受位置变化先列diff |
| `PHIOS-HERO-KNOWLEDGE-LIBRARY-v1.webp` | /knowledge/ | 保留现行知识Hero；legacy library映射canonical |
| `PHIOS-HERO-EIGHT-VOLUME-SYSTEM-v1.webp` | /books/ | 八册系统总览首屏；不是64网络图 |
| `PHIOS-HERO-KNOWLEDGE-READING-v1.webp` | /articles/ | 文章阅读入口Hero；Glossary不重复同一Hero |
| `PHIOS-HERO-VISUAL-KNOWLEDGE-v1.webp` | /figures/ | 可视知识入口Hero；单图detail保留真实图 |
| `PHIOS-HERO-REALITY-JOURNEY-v1.webp` | 当前Journey总览canonical | 核实际route；不复活legacy页面 |
| `PHIOS-HERO-REALITY-ENTRY-v1.webp` | 当前Reality ENTER阶段容器 | 条件stage Hero；与09情境图不同 |
| `PHIOS-HERO-REALITY-RECONSTRUCTION-v1.webp` | 当前Reality RECONSTRUCT阶段容器 | 条件stage Hero，不新建重复页面 |
| `PHIOS-HERO-REALITY-READING-v1.webp` | 当前Reality READ阶段容器 | 条件stage Hero，不覆盖reading业务 |
| `PHIOS-HERO-REALITY-NAVIGATION-STAGE-v1.webp` | 当前Reality NAVIGATE阶段容器 | 条件stage Hero，不恢复旧summary图 |
| `PHIOS-HERO-REALITY-CONTINUITY-v1.webp` | 当前Reality CONTINUE阶段容器 | 条件stage Hero；依review/continuity owner |
| `PHIOS-HERO-PERSONAL-REALITY-v1.webp` | /perspectives/personal/ | 方法入口Hero；旧personal-runtime重定向 |
| `PHIOS-HERO-ACADEMY-v1.webp` | /academy/ | Academy首屏 |
| `PHIOS-HERO-PROFESSIONAL-v1.webp` | /professional/ | 专业协助首屏；保留当前已接受presentation |
| `PHIOS-HERO-FINANCIAL-REALITY-v1.webp` | /professional/financial/ | 财务入口首屏；不改intake |
| `PHIOS-HERO-SERVICES-v1.webp` | /professional/services/ | 服务说明首屏；不再空白 |
| `PHIOS-HERO-ACCOUNT-CONTINUITY-v1.webp` | /account/ | 账户首屏；与18说明图分工 |
| `PHIOS-HERO-DIGITAL-BOOK-ACCESS-v1.webp` | /book-one-preview | 核现行preview canonical；Membership有独立Hero不用此图重复 |
| `PHIOS-HERO-TAROT-READING-v2.webp` | /perspectives/tarot/ | 塔罗首屏v2；不能替代互动牌背 |
| `PHIOS-HERO-ICHING-READING-v2.webp` | /perspectives/iching/ | 易经首屏v2；run用真实卦局 |
| `PHIOS-HERO-RELATIONSHIP-v2.webp` | /perspectives/relationship/ | v2首屏已R5 correction，保留 |
| `PHIOS-HERO-PERSONAL-EVIDENCE-v2.webp` | /perspectives/profile/ | v2首屏已R5 correction，保留 |
| `PHIOS-HERO-MEMBERSHIP-CONTINUITY-v2.webp` | /membership | v2首屏已R5 correction，保留 |
| `PHIOS-HERO-BOOK-1-REALITY-FORMATION-v1.webp` | /books/reality-formation/ | 该册唯一Hero；编号按语义映射，不冲突Membership HERO-023 |
| `PHIOS-HERO-BOOK-2-REALITY-RUNTIME-v1.webp` | /books/reality-runtime/ | 该册唯一Hero；编号按语义映射，不冲突Membership HERO-023 |
| `PHIOS-HERO-BOOK-3-REALITY-CONTINUITY-v1.webp` | /books/reality-continuity/ | 该册唯一Hero；编号按语义映射，不冲突Membership HERO-023 |
| `PHIOS-HERO-BOOK-4-REALITY-EXPANSION-v1.webp` | /books/reality-expansion/ | 该册唯一Hero；编号按语义映射，不冲突Membership HERO-023 |
| `PHIOS-HERO-BOOK-5-REALITY-DIFFERENTIATION-v1.webp` | /books/reality-differentiation/ | 该册唯一Hero；编号按语义映射，不冲突Membership HERO-023 |
| `PHIOS-HERO-BOOK-6-REALITY-RECONFIGURATION-v1.webp` | /books/reality-reconfiguration/ | 该册唯一Hero；编号按语义映射，不冲突Membership HERO-023 |
| `PHIOS-HERO-BOOK-7-REALITY-OBSERVATION-v1.webp` | /books/reality-observation/ | 该册唯一Hero；编号按语义映射，不冲突Membership HERO-023 |
| `PHIOS-HERO-BOOK-8-REALITY-NAVIGATION-v1.webp` | /books/reality-navigation/ | 该册唯一Hero；编号按语义映射，不冲突Membership HERO-023 |
| `PHIOS-FIGURE-ACCOUNT-REALITY-STRUCTURE-v1.svg` | /account/ 的账户结构说明槽 | 先与18实际内容比较；相同信息导致多余网络图则逐项具体排除，未比较前不能忽略 |
| `PHIOS-BRANDING-BOOK-1-REALITY-FORMATION-v1.webp` | /books/ 的Book 1 identity卡 | 现有Commerce已正确绑定则RETAIN_EXISTING_VERIFIED；不新增重复卡。Book7/8核当前父目录和旧404 |
| `PHIOS-BRANDING-BOOK-2-REALITY-RUNTIME-v1.webp` | /books/ 的Book 2 identity卡 | 现有Commerce已正确绑定则RETAIN_EXISTING_VERIFIED；不新增重复卡。Book7/8核当前父目录和旧404 |
| `PHIOS-BRANDING-BOOK-3-REALITY-CONTINUITY-v1.webp` | /books/ 的Book 3 identity卡 | 现有Commerce已正确绑定则RETAIN_EXISTING_VERIFIED；不新增重复卡。Book7/8核当前父目录和旧404 |
| `PHIOS-BRANDING-BOOK-4-REALITY-EXPANSION-v1.webp` | /books/ 的Book 4 identity卡 | 现有Commerce已正确绑定则RETAIN_EXISTING_VERIFIED；不新增重复卡。Book7/8核当前父目录和旧404 |
| `PHIOS-BRANDING-BOOK-5-REALITY-DIFFERENTIATION-v1.webp` | /books/ 的Book 5 identity卡 | 现有Commerce已正确绑定则RETAIN_EXISTING_VERIFIED；不新增重复卡。Book7/8核当前父目录和旧404 |
| `PHIOS-BRANDING-BOOK-6-REALITY-RECONFIGURATION-v1.webp` | /books/ 的Book 6 identity卡 | 现有Commerce已正确绑定则RETAIN_EXISTING_VERIFIED；不新增重复卡。Book7/8核当前父目录和旧404 |
| `PHIOS-BRANDING-BOOK-7-REALITY-OBSERVATION-v1.webp` | /books/ 的Book 7 identity卡 | 现有Commerce已正确绑定则RETAIN_EXISTING_VERIFIED；不新增重复卡。Book7/8核当前父目录和旧404 |
| `PHIOS-BRANDING-BOOK-8-REALITY-NAVIGATION-v1.webp` | /books/ 的Book 8 identity卡 | 现有Commerce已正确绑定则RETAIN_EXISTING_VERIFIED；不新增重复卡。Book7/8核当前父目录和旧404 |
| `PHIOS-ILLUSTRATION-LIBRARY-KNOWLEDGE-LANDSCAPE-v1.webp` | /knowledge/ | 知识空间supporting段；现首页/Knowledge重复选择唯一，保留合适既有位置 |
| `PHIOS-ILLUSTRATION-READING-PATH-LANDSCAPE-v1.webp` | /guided-reading | 阅读路径supporting段，与66结构说明分工 |
| `PHIOS-ILLUSTRATION-VISUAL-KNOWLEDGE-DISCOVERY-v1.webp` | /figures/ | 知识发现体验supporting段；不是实时图谱 |
| `PHIOS-ILLUSTRATION-MEMBERSHIP-EXPERIENCE-LANDSCAPE-v1.webp` | /membership | 会员使用场景supporting段；不表述全部报告免费 |
| `PHIOS-ILLUSTRATION-PERSONAL-REALITY-SCENE-v1.webp` | /perspectives/personal/ | 方法内容中段；免费命盘仍是真实deterministic |
| `PHIOS-ILLUSTRATION-FINANCIAL-REALITY-SCENE-v1.webp` | /professional/financial/ | 财务supporting段；已有ILL-006核语义后保留 |
| `PHIOS-ILLUSTRATION-ACADEMY-LEARNING-SCENE-v1.webp` | /academy/ | 学习模块内部supporting段 |
| `PHIOS-ILLUSTRATION-PROFESSIONAL-WORKSPACE-SCENE-v1.webp` | /professional/ | 专业supporting段；已存在正确img保留不叠加 |
| `PHIOS-ILLUSTRATION-DIGITAL-READING-EXPERIENCE-v1.webp` | /read/ 当前reader | 阅读/下载载体说明，核准确reader route |
| `PHIOS-ILLUSTRATION-REALITY-WORKSPACE-CONTINUITY-v1.webp` | /reality/ | 工作区延续supporting段，既有Earlier illustration核是否应默认展示 |

## 附录 C｜未给完整文件名的Icons与背景身份

下列身份全部纳入发现及核对范围。执行方填写实际filename/key/owner/consumer，不按名称推断扩展名。图标是界面功能标识，不当普通Figure海报；academy/account未列条目，按正式registry枚举当前实际身份。

| 分组 | 附件身份 | 实际角色 |
|---|---|---|
| global | `HOME` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `LIBRARY` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `EIGHT-BOOKS` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `ARTICLE` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `FIGURE` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `KNOWLEDGE` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `PERSONAL-REALITY` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `FINANCIAL-REALITY` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `REALITY-JOURNEY` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `READING` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `EVIDENCE` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `PROJECTION` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `INTERPRETATION` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `GOVERNANCE` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `NAVIGATION` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `NAVIGATION-THRESHOLD` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `CONTINUITY` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `ACADEMY` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `PROFESSIONAL` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `REPORT` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `ACCOUNT` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| global | `SEARCH` | 对应共享navigation、目录、模块或真实入口role；EIGHT-BOOKS正式SVG与89中的WebP85分开 |
| journey | `ENTER` | 现行Journey阶段导航，当前阶段条件与unknown状态真实反映 |
| journey | `OBSERVE` | 现行Journey阶段导航，当前阶段条件与unknown状态真实反映 |
| journey | `RECONSTRUCT` | 现行Journey阶段导航，当前阶段条件与unknown状态真实反映 |
| journey | `READ` | 现行Journey阶段导航，当前阶段条件与unknown状态真实反映 |
| journey | `NAVIGATE` | 现行Journey阶段导航，当前阶段条件与unknown状态真实反映 |
| journey | `ACT` | 现行Journey阶段导航，当前阶段条件与unknown状态真实反映 |
| journey | `REVIEW` | 现行Journey阶段导航，当前阶段条件与unknown状态真实反映 |
| journey | `CONTINUE` | 现行Journey阶段导航，当前阶段条件与unknown状态真实反映 |
| journey | `UNKNOWN` | 现行Journey阶段导航，当前阶段条件与unknown状态真实反映 |
| methods | `ASTROLOGY` | 现行方法入口/选择；不修改计算、Accepted Registry与报告图 |
| methods | `BAZI` | 现行方法入口/选择；不修改计算、Accepted Registry与报告图 |
| methods | `ZIWEI` | 现行方法入口/选择；不修改计算、Accepted Registry与报告图 |
| methods | `NUMEROLOGY` | 现行方法入口/选择；不修改计算、Accepted Registry与报告图 |
| methods | `HUMAN-DESIGN` | 现行方法入口/选择；不修改计算、Accepted Registry与报告图 |
| methods | `I-CHING` | 现行方法入口/选择；不修改计算、Accepted Registry与报告图 |
| methods | `TAROT` | 现行方法入口/选择；不修改计算、Accepted Registry与报告图 |
| status | `AVAILABLE` | 真实能力与状态chip；不能把未开放标available |
| status | `PARTIAL` | 真实能力与状态chip；不能把未开放标available |
| status | `SEPARATE` | 真实能力与状态chip；不能把未开放标available |
| status | `UNAVAILABLE` | 真实能力与状态chip；不能把未开放标available |
| status | `TEMPORARY` | 真实能力与状态chip；不能把未开放标available |
| academy | 未提供条目 | 核正式registry实际发现集；不臆造课程已开放 |
| account | 未提供条目 | 核正式registry实际发现集；权限/人物/交付真实role |

| 背景/装饰ID | 附件语义名 | 使用要求 |
|---|---|---|
| `VIS-TEX-001` | `PHI-OS-IVORY-GRAIN` | 现行static-atmosphere CSS变量及scope，先核REMOTE_VERIFIED证据与可见应用；明暗/文本对比复核，不降门控 |
| `VIS-TEX-002` | `PHI-OS-CHAMPAGNE-GLOW` | 现行static-atmosphere CSS变量及scope，先核REMOTE_VERIFIED证据与可见应用；明暗/文本对比复核，不降门控 |
| `VIS-TEX-003` | `PHI-OS-SOFT-MIST` | 现行static-atmosphere CSS变量及scope，先核REMOTE_VERIFIED证据与可见应用；明暗/文本对比复核，不降门控 |
| `VIS-TEX-004` | `PHI-OS-PREMIUM-HALO` | 现行static-atmosphere CSS变量及scope，先核REMOTE_VERIFIED证据与可见应用；明暗/文本对比复核，不降门控 |
| `VIS-DEC-001` | `PHI-OS-MOUNTAIN-MIST` | 现行static-atmosphere CSS变量及scope，先核REMOTE_VERIFIED证据与可见应用；明暗/文本对比复核，不降门控 |
| `VIS-DEC-002` | `PHI-OS-CELESTIAL-MOTIF` | 现行static-atmosphere CSS变量及scope，先核REMOTE_VERIFIED证据与可见应用；明暗/文本对比复核，不降门控 |
| `VIS-DEC-003` | `PHI-OS-GEOMETRIC-MOTIF` | 现行static-atmosphere CSS变量及scope，先核REMOTE_VERIFIED证据与可见应用；明暗/文本对比复核，不降门控 |
| `VIS-DEC-004` | `PHI-OS-METHOD-TRANSITION-MOTIF` | 现行static-atmosphere CSS变量及scope，先核REMOTE_VERIFIED证据与可见应用；明暗/文本对比复核，不降门控 |

## 附录 D｜逐项处置状态与计数模板

| 状态 | 允许代表的事实 | 不允许代表的事实 |
|---|---|---|
| RETAIN_EXISTING_VERIFIED | 当前实际consumer保留且证据有效 | 旧receipt未核hash就继承PASS |
| SOURCE_IMPLEMENTED | 当前HTML/JS真实消费槽已经实施 | 图片已在getphios.com出现 |
| LOCAL_BROWSER_VERIFIED | 当前source/build真实图显示通过 | 已部署或真实生产账号通过 |
| OWNER_CONFIRMED_FOUNDER_BOUND_SKIP | 用户确认Founder绑定，本轮不新增 | 助手已观察Founder线上页面 |
| EXCLUDED_WITH_REASON | 具体图像或语义缺陷可审，局部排除 | 无消费者、难实施、零引用等于不适合 |
| BLOCKED_ASSET | 精确key/解码仍失败，局部消费者待素材 | 整批暂停，或猜地址绑定 |
| BLOCKED_DEPENDENCY | 真实业务/owner/权限依赖具体点名 | 解除生产门控只为显示图片 |
| BASELINE_FAILURE | 修改前同对象断言失败 | 清理/本轮视觉导致失败 |
| DEPLOYED_UNVERIFIED / LIVE_UNVERIFIED | 没有对应生产证据 | 本地PASS等于上线完成 |

计数必须相斥：编号图89 = Founder skip8 + 其余81；其余81 = 当前已完成 + 明确不适用 + 具体阻塞 + 待实施。151明确filename = 编号89 + 其余62。Icons/Background身份另计，不把名字或角色重复当新文件。一个图的registered、decoded、source-bound、browser-pass属于多层证据，不相加成为完成总数。

旧82 decoded内含8 Founder skip，剩74项有旧解码证据；其中两项易经语义问题待核。按旧台账其余37已source-bound、44待补齐（35有旧解码但未绑定＋7技术缺口＋2易经语义问题）。这些分组必须在当前基线重算，不用旧数字制造当前结论。

## 附录 E｜远程证据索引与本次限制

下列链接固定到本次已核对commit，不随main推进而悄悄改变。Windows执行方必须读取自己的当前基线，完成后提供当前HEAD与diff。

- [content/production-closure/live-customer-commercial-convergence/VISUAL-BINDING-R5-CLOSURE.json](https://github.com/getphioscs-UX/phios/blob/609105c9dc67ac5e8ac1966094ea40f39f8d1922/content/production-closure/live-customer-commercial-convergence/VISUAL-BINDING-R5-CLOSURE.json)
- [content/production-closure/live-customer-commercial-convergence/VISUAL-BINDING-R5-ASSET-TO-CONSUMER.json](https://github.com/getphioscs-UX/phios/blob/609105c9dc67ac5e8ac1966094ea40f39f8d1922/content/production-closure/live-customer-commercial-convergence/VISUAL-BINDING-R5-ASSET-TO-CONSUMER.json)
- [content/production-closure/live-customer-commercial-convergence/VISUAL-BINDING-R5-UPLOAD-DELTA-OWNER-RECORD.json](https://github.com/getphioscs-UX/phios/blob/609105c9dc67ac5e8ac1966094ea40f39f8d1922/content/production-closure/live-customer-commercial-convergence/VISUAL-BINDING-R5-UPLOAD-DELTA-OWNER-RECORD.json)
- [assets/customer-ui/js/surfaces/visual-binding-r5-guides.js](https://github.com/getphioscs-UX/phios/blob/609105c9dc67ac5e8ac1966094ea40f39f8d1922/assets/customer-ui/js/surfaces/visual-binding-r5-guides.js)
- [content/customer-experience-rebuild/authority/customer-visual-asset-registry-v4.json](https://github.com/getphioscs-UX/phios/blob/609105c9dc67ac5e8ac1966094ea40f39f8d1922/content/customer-experience-rebuild/authority/customer-visual-asset-registry-v4.json)
- [scripts/check-visual-binding-r5.mjs](https://github.com/getphioscs-UX/phios/blob/609105c9dc67ac5e8ac1966094ea40f39f8d1922/scripts/check-visual-binding-r5.mjs)

本次交付为可执行工单与基于远程源码/现有记录的检查结论，没有宣称对Windows仓库实施修复，没有进行自动提交、推送或生产部署，没有付费provider调用。真实图片解码、语义缺陷、selector到达、已登录状态、完整当前回归和生产调用由执行方依工单补齐。
