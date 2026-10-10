# PHI OS · PAGE CONSOLIDATION + PHI CONFIGURATION + PROFILE VISUAL MARKETING R1

完整、无压缩、可执行 Codex Master Work Step

## 0. 执行目标与授权

在当前 PHI OS 主仓库实施：减少重复的平台解释页面；把可使用的功能、独创 PHI Configuration、Profile 个人证据体验和真实交付物放到前台。重点改善市场理解、视觉识别与体验入口，而不是增加更多平台介绍页。

用户已同意页面精简和两项重点提升。直接完成本地源码、页面、链接、资产绑定、验证和审阅交付；不自动 commit、push 或部署。不要求用户再次确认这些已授权的本地修改。不要触发付费模型、真实支付、发送邮件、预约提交或其他生产写入。本轮 providerCalls=0。

先读取仓库 AGENTS.md 和现有治理规则。保留用户其他窗口的未提交工作；不得 reset、覆盖、stash 或清空它们。若冲突，可在现有代码上整合；无法整合时报告具体文件和冲突内容，继续其他独立工作。

## 1. 本次外部检查的证据范围

2026-10-10，通过公开网站浏览器实际读取：/、/explore/、/perspectives/personal/、/perspectives/profile/、/professional/、/professional/services/、/reality/。检查是英文 Guest 桌面状态；Profile 首屏另外进行了截图观察。没有执行评估、出生计算、登录、购买或预约。没有检查本地仓库，没有宣称所有浏览器和所有页面已通过。

已观察的问题：

1. 首页同时出现任务导航、Six Ways to Begin、Two Flagship Experiences、Perspectives、Knowledge Landscape、How PHI OS Works、Continuity，以及底部多组开始与选择深度说明。不同模块反复通向相同入口。
2. 首页旗舰是 Personal Reality 和 Financial Reality。PHI Configuration 与 Profile 没有独立旗舰展示。
3. Explore 再次解释平台、四个问题、搜索/AI/PHI OS 对比，并多次链接 Why、How、Start。
4. PHI Configuration 位于 /perspectives/personal/#perspective-phi-configuration，长页中与方法说明、来源限制和输入流程混排。
5. Configuration 当前公开说明包含 Structure、Drivers、Usable capacities、Tensions、Field、Phase 六个编辑性阅读问题；页面明确说这六项不能替代 canonical ECR coordinates。不得把六项宣传文案直接做成算法坐标或六项分数。
6. Profile /perspectives/profile/ 当前名称 Personal Evidence，提供七种入口：Quick Self Evidence、Full Self-Assessment、Reasoning Tasks、Import external result、Big Five/IPIP、Career Interests/O*NET、Financial Capability。其用途必须与命盘、象征方法保持区别。
7. Profile 首屏在本次截图中呈现浅色大面积背景、右侧空图框、logo 位置出现破图标识。须复查是加载、资源、resolver、CSP 或 CSS 问题，不能只移除 img 来假装修复。
8. Professional 主页面反复说明 review/advice 区别并通向 Services；Services 内容较薄，Natural Healer、Cash Flow Game 缺少清楚的完整服务展示。
9. My Reality 已有实际工作区和十一项功能导航；下方再次有完整五阶段教学说明。应该保留工作区，将帮助内容收进按需阅读区域。

未在本次打开的页面：Explore 子页、About/Founder、World/Atlas、Knowledge/Academy、报告审阅文件等。以下对它们的处理是执行方案，必须由仓库与本地浏览验证补足，不得在完成报告中写成已观察事实。

## 2. 第一阶段：建立真实页面、功能与资产基线

执行 git status --short、git branch --show-current、git rev-parse HEAD。记录工作区修改，不自动拉取或切换分支。用 rg / rg --files 定位 HTML、路由、导航、页面注入、语言字典、资产 manifest/resolver、构建脚本和检查器。不要假定仓库路径。

交付一份 route inventory，至少覆盖首页、Explore 及子页、About/Founder、Reality、Perspectives/Personal/Profile、各方法、Professional/Services/Financial/Reports/Authority/Appointments、Knowledge/Books/Articles/Figures/Concepts/Academy、World/Atlas、Account 和 Membership。

每行记录：真实路由、源文件、页面用途、主要 H1、主要 CTA、独有功能、重复模块、数据 owner、语言机制、实际绑定资产、推荐处理与依据。

检查最终生成 HTML，查清是否有共享 customer-experience 文案注入造成首页和子页的尾部重复。修复重复源头，避免修改原始 HTML 后构建再次插回旧模块。

建立功能保护表：Configuration 计算、Personal 输入与同意、Profile 七种模式和评分规则、证据保存读取、Reality 导入确认、报告权限、支付、预约与已接受报告生产。记录各功能真实 owner 与验证方式。本轮只重构展示和入口，不重写计算、评分、权限或生产模型策略。

## 3. 第二阶段：页面合并与导航规则

先提交本地 route decision 表，随后按下面规则实施。已授权的常规整合不停止等待确认。

| 当前对象 | 最终职责与动作 |
|---|---|
| 首页 / | 品牌与产品展示入口，精简重复引导，突出 Configuration、Profile 与其他实际用途 |
| /explore/ | 唯一简明平台说明页，集中必要 Why/How/Start 内容 |
| /explore/why-phios/ | 独有内容整合到 Explore 对应锚点，移除重复页并单跳永久重定向 |
| /explore/how-it-works/ | 独有使用说明整合到 Explore；已被用户删除的旧 figures 不得恢复 |
| /explore/start/ | 任务入口整合到首页同一组件；旧地址重定向到有意义的起始位置 |
| /about/ | 独有组织/原则内容保留在 About 或 Founder 合适区域；只有确认纯重复时才合并 |
| /about/founder/ | 保留人物身份、创立缘由、工作立场与已绑定肖像；不再复写平台教程 |
| /reality/ | 保留实际工作区，教学说明折叠或链接到 Explore；不要删除数据或功能页签 |
| /perspectives/ | 方法比较与选择入口，给 Configuration 与 Profile 清楚的位置 |
| /perspectives/personal/ | 个人方法选择、最小必要输入、免费结果和报告入口；减去长篇平台教学 |
| PHI Configuration | 建立一个可直达、可分享的独立产品页；先找现有规范路由，确无独立路由时采用 /perspectives/phi-configuration/ |
| /perspectives/profile/ | 保留规范地址，提升成有主视觉、有示例、有明确使用路径的 Profile 页面 |
| /professional/ | 合并 Services 内容，成为完整服务总入口 |
| /professional/services/ | 若无独有交易功能，合并后永久重定向到 Professional 服务区域；如有 booking 状态则保留薄功能页面 |
| Financial/Reports/Authority/Appointments | 保留实际功能；Authority 作为服务页的进一步说明，不占据每个首屏 |
| Knowledge/Books/Articles/Figures/Concepts/Academy | 共用索引与搜索，保留不同内容用途；本轮不机械删除独立内容详情 |
| World/Atlas | 保留世界与文明读取能力；共用入口，避免第二套平台解释 |

不得把重定向规则用于 Functions/API、资产 URL、账户状态、支付回调或带业务参数的操作路由。旧查询参数的处理需逐项定义，不能丢失 method、locale、returnTo 等合法参数。避免重定向链、循环、软 404；验证带斜杠与不带斜杠版本、旧锚点及站内链接。

Personal 原有 #perspective-phi-configuration 锚点继续提供兼容入口，可保留简短 Configuration 卡片及直达产品页按钮。不要依赖服务端读取 fragment；浏览器片段不会送到服务器。

主导航建议保留功能入口：World、My Reality、Personal、Knowledge、Services；Personal 菜单内突出 PHI Configuration、Profile 和其他 Perspectives。Explore 与 Founder 放到易找到的次级导航/页脚。若共享 shell 约束不支持此名称，采用最小兼容改造并说明。导航不是扩大成更多顶级项目。

## 4. 第三阶段：首页重组

顺序固定为：品牌首屏 → 两项 PHI OS 重点体验 → 一个任务入口区 → 世界与知识内容预览 → 人工服务 → 一个结束 CTA。

首屏保留 Ask 输入与已有 intent routing。用真实可加载的 hero 支持页面，不放空 figure。不把新的 marketing 图与 Ask 计算耦合。

两项重点体验各包含：产品名、一句用途、清楚的示例主图、一个查看示例按钮、一个进入真实体验按钮。Configuration 用真实构型预览；Profile 用个人证据/报告预览。使用虚构公开 fixture，不展示私人资料。

一个任务入口区覆盖：提出问题、了解个人、关系问题、财务处境、世界背景、阅读学习。Tarot/I Ching 可作为个人/问题入口的具体可用工具。复用现有 router；不得让所有入口默认到同一页，也不能改成付费必经。

删除重复 Six Ways、Flagship、Continuity 和多个尾部引导之间的冗余内容；保留独有功能。八册在首页做简明内容预览，完整八册目录留在 Books。不要重复完整方法目录和完整知识目录。

首屏与主要 CTA 文案不得出现 governed、authority pack、canonical coordinates、admission、source class 等内部用语。必要的来源与限制用正常语言放在相关结果或说明处。

## 5. 第四阶段：PHI Configuration 独立旗舰页面

页面必须实际实现以下区块，不能只交文案：

1. 首屏：PHI Configuration / PHI OS 个人构型。大幅构型图占据主要视觉位置；清楚标记“示例构型 / Example configuration”。主按钮进入既有 Configuration 输入流程，次按钮打开示例。
2. 一张构型如何阅读：使用同一 fixture，将主图与可聚焦的图例联动。读取真实算法输出字段与计算 provenance；每个显示坐标、关系、值都能追溯到 owner。默认先显示少量重点，再展开详细图例。
3. 模型与生活：以工作安排、环境变化或关系互动等两至三个情境解释阅读用途。分别注明哪些来自模型、哪些是示例现实输入；不把模型输出说成已证实的现实能力。
4. 与其他方法的关系：简明比较输入、图形语言与输出用途；不宣传优于或取代所有传统方法。用户可以继续到 BaZi、Zi Wei 等既有入口。
5. 输入与交付：显示真实需要的出生信息、精度限制、免费可见内容及当前确实支持的付费内容。沿用已存在的商业目录与 entitlement，不编造价格和可用状态。
6. 进入体验：按钮预选 Configuration，再进入既有输入流程。优先复用现有参数/API/组件，不创建第二套出生表单状态。验证未知出生时间、地点/时区未确认、无同意情况下仍按原规则处理。
7. 简短阅读说明：方法性质、来源、未知项与资料处理。以正常语言说明一次，不在每张卡重复整段。

六项 Structure/Drivers/Capacities/Tensions/Field/Phase 可以作为编辑导读，但必须与真实 ECR 坐标分开显示。不要创造六角能力分数、百分比、科学验证标记、诊断等级或事件预测。没有数据的节点不得用 0 代替未知。

建议首屏文案方向，须按真实功能修订：

中文：看见你的构型，理解你与处境的互动。
英文：Explore your configuration in the context of your life.

中文说明：PHI Configuration 将个人构型整理成可阅读的关系图，让你从结构与联系出发，比较自身经验与正在面对的处境。
英文说明：PHI Configuration presents a readable map of relationships within its model, giving you a structured perspective to compare with your experience and current circumstances.

## 6. 第五阶段：Profile 旗舰页面

Profile 定位须保持真实：个人证据与评估的组织、阅读与比较。IPIP、O*NET 和外部评估不是 PHI OS 独创测试；PHI OS 可宣传其证据组织、视觉呈现与现实联系方式。不可宣传 PHI OS 发明 Big Five、RIASEC、IQ 或 MBTI。

页面实现顺序：

1. 首屏：Profile / 个人画像；以完整证据画像主图替代空图框。主按钮“开始我的 Profile”，次按钮“查看示例”。清楚说明可独立使用，也可以跳过，不成为命盘必填。
2. 结果先行：展示一个连续的示例画像，包含来源卡、适用图表、解释段落及当前问题联系。先让访客看到结果，再进入七种工具选择。
3. 选择开始方式：七种模式全部保留，但按用户目的组织成易读卡片。可建议轻量开始，不未经源码验证承诺几分钟完成。模式点选直接打开原组件，保留 scoring/version/source identity。
4. 画像可视化：已有 PFIG 能力必须查找并复用。Radar 只用于确有可比较量尺的同一来源维度；不同量尺和来源分别画。不把七种测试分数混成一个总分，不把象征方法叠进测量 radar。
5. 当前处境联系：展示由用户选择加入现实问题后的对照。导入前显式确认目标与内容；不自动读取 Ask 历史、账户其他资料或把测试结果写成现实事实。
6. 报告预览：若已具备报告交付，复用 accepted renderer/Publication IR 与 PFIG 输出，展示双语报告的真实结构。只保留一份双语 Profile 版本。没有 verified 交付时先完成真实本地预览，不宣称已生产可购买。
7. 继续与管理：保存、读取、返回 Personal/Reality 的动作保留既有权限与用户选择。入口标签跟页面语言一致，修复当前英文页中“Read saved evidence / 读取已保存证据”混合标签。

保留 Quick Self Evidence、Full Self-Assessment、Reasoning Tasks、Import external result、IPIP、O*NET、Financial Capability 七种真实工具。Reasoning Tasks 仍为任务样本，不改写为 IQ。外部工具名称、计分与许可引用保持正确。

建议首屏文案方向：

中文：把关于自己的线索，整理成看得懂的个人画像。
英文：Bring what you know about yourself into a readable profile.

说明用具体用途：从自述、实际任务或已有评估开始，看清各项结果的来源，再与自己选择加入的当前处境比较。避免“洞悉真正的你”“全面测出潜能”等未经证实的宣传。

## 7. 第六阶段：视觉系统与已有 R2 资产接线

采用深蓝/深青绿大底、暖金重点、米色正文，加有意义的青绿、紫、珊瑚等内容色；不把整个页面保留为白底，不用随机金线填空白。可以用少量温暖浅色报告细节面板，但主视觉身份保持深色。

建立共享 page tokens，作用域限于此次 marketing shell；别改变已接受报告打印样式、评分组件和其他工作区可读性。明确文字、按钮、边框、focus、hover、selected 状态。普通正文达到 WCAG AA 对比；文字不会与背景融为一体。

视觉比例建议：桌面首屏主图约占 45%–55%，移动端文案后立即显示可辨认主图；不要用巨大空白代替资源。标题和 CTA 由网页承载，图中仅保留必要坐标和标签。图像 detail 提供放大、关闭、Esc 和焦点返回。移动端不把全部复杂图硬缩到 360px 中。

先扫描现有 R2 inventory、manifest、resolver 和已绑定资产。必须使用真实 object key、字节和 MIME；不得根据名称猜 URL。为每个相关资产建立：名称、实际 key、尺寸、用途、目标路由/区块、状态、排除原因。

用户先前要求所有适合的新增资产绑定；本轮合并不是撤销资产使用授权。把图分配到合并后的相关内容、示例详情、学习内容或功能帮助，避免塞成图库。无合适用途、已过时或会误导的图逐项说明，不静默丢弃。

Founder 已绑定的 portrait 和图像保留，除非需要更新链接。How-it-works 已删除旧图、Reality 已要求撤销的十三图总结组不得恢复。已接受的 Civilization Atlas、方法报告静态版式与视觉不在本轮重画范围。

Configuration、Profile 如缺少准确示例图，使用既有计算/评分输出和 SVG/HTML 绘制；不使用 AI 图像编造计算结果。缺少装饰性 hero 时使用真实可解释的构图与已有资产，不增加 provider 费用。

查清空 figure/logo 的根因：img currentSrc、naturalWidth、响应码、CSP、资源地址、resolver slot、加载策略、容器尺寸及背景对比。所有关键首屏图实际加载；故障回退要有合理说明和替代布局，不能隐藏错误后记 PASS。

## 8. 第七阶段：服务、Explore 与My Reality内容落实

Explore 合并后控制为一个连贯说明页：一句平台用途 → 一幅有意义关系图 → 一次简短使用示例 → 实际功能入口 → 少量 FAQ。不重复完整首页产品目录。

Professional 直接展示 Cash Flow、Financial Planning、Healing 的已确认服务资料与合适已上传视觉。各服务清楚说明面向谁、过程、交付、实际负责人/资质、价格及预约状态。不得填造负责人、开放时段、疗效或价格；资料缺失以具体缺失项交付，不用大段“须确认”占据整个销售页。

保留预约与 Financial 工作流。报告库是交付查看功能，不混成预约服务。Cash Flow Game 的教育用途与财务规划保持正确区别；Healing 使用既有确认名称和服务范围。

My Reality 保留工作区，零资料时显示简明、正常语言的空状态、一个主要开始按钮和可选示例。不要给用户显示内部 EMPTY 枚举。五阶段教学作为按需帮助，避免与主工作区并列形成第二套流程。World context 继续由用户选择，不自动成为个人事实。

## 9. 第八阶段：双语与国际市场推广

中文与英文具有相同功能、价值和可用状态，表达自然，不要求逐字翻译。遵守现有 locale 和 URL 机制，不新建一套语言路由。中文页不出现大段未翻译的普通说明；品牌、标准工具名可保留英文。

新产品页设置准确 title、description、H1、canonical、已有语言对应机制与 social preview。只对有真实内容的页面加适合 schema；不伪造 review、rating、认证和效果。

市场面向亚洲、美国、欧洲；页面不能默认所有访客都是马来西亚用户。沿用真实 RM 目录价格，若显示换算必须遵循已有实现，不编造国际币种结算。不能恢复 legacy RM39 Profile 或被删除的 5PLUS 商品。此次不自行改变价格、优惠或 subscription。

首页、Perspectives、Founder 和相关阅读页为两项旗舰添加少量上下文相关入口；避免每页都复制同一广告大块。分享卡应使用适合裁切的实际资产，文字在网页/metadata 中保持完整。

## 10. 第九阶段：兼容治理和检查器

先定位既有 homepage intent router、H.5 bootstrap、PIS-040 Hero 和相关检查。它们在其他工作中曾被报告失败，本轮以当前源码为准。凡此次直接触及的故障要修到真实通过；独立失败记录具体 command、assertion 与 owner，不归咎于“历史问题”而不查证。

如旧检查器把冗余模块的字面存在作为 invariant，先确认它保护的实际功能，更新为新结构的行为验证。保留必要业务 invariant；禁止注释断言、吞异常、强行改 hash 或伪造 receipt。

保留八字/紫微已接受文稿、renderer、生产 calls/recovery/budget 与统一报告治理。仅修改展示接线时，不触碰 accepted content digest；如共享文件不可避免变化，按仓库当前受控流程登记影响，不自动重置验收证据。

## 11. 第十阶段：测试与实际验收

对改动范围先运行已有相关零费用 checks，再运行仓库规定的全局检查与 Pages build；从 package.json 找到真实命令，不发明 npm script。构建失败必须解决或记录具体未完成事项。

功能验收至少包括：

1. 新主导航及首页每个任务到正确 destination，Ask 提交保留原语义和错误处理，不能进入无关默认回答。
2. Configuration 主按钮正确预选 ECR/真实方法代码，示例与真实用户结果明确区分；输入精度、时区和同意规则不变。
3. Profile 七种入口与现有评分/导入正常；有资料和缺资料状态正确；保存读取沿用既有授权；没有资料时 radar 不绘伪分数。
4. Profile 与 Current Reality 的联系是选择和确认行为；Profile 不成为其他方法使用门槛。
5. 免费 diagram 与付费报告权益正确，legacy 商品不恢复，未购买不触发模型生成。
6. 预约入口、Financial、报告库可到达；本轮不提交真实交易。
7. 所有旧路由单跳至相关内容；没有把 API 或合法参数破坏；站内无旧删除资源引用。
8. 中文/英文、桌面/手机分别验证关键改动页，首屏及正文无重叠、截断、横向溢出、空资源块。
9. 键盘、focus、modal 关闭、reduced motion、图片 alternative text、语言切换、刷新与返回正常。
10. marketing 页打印清楚，无固定导航覆盖；Profile 报告双语打印复用既有版式，不改动已经接受的其他报告。

实际浏览矩阵：至少 1440px 与 390px；Configuration 复杂图另测 360px；两种语言。只对不同版式/状态截取必要的代表性画面。不要复制整仓库到 tools/review/build-snapshot-*，不要生成大量重复全站截图。临时浏览资产放仓库外短路径，只保留足够判断的最终证据与索引。

资源验收记录关键图片 resolved URL、HTTP 状态、natural dimensions 与容器布局。失败时区分对象不存在、阻止访问、解码错误、resolver 未消费和纯 CSS 布局错误。

仓库 PASS、本地浏览 PASS、DEPLOYED、LIVE_VERIFIED 分开记录。未部署不宣称线上已完成。构建成功不能代替功能验收。

## 12. 交付物与完成报告

在遵守仓库现有目录组织下，交付以下可审阅内容。命名可沿用既有规范，但不得省略内容：

- PHIOS-PAGE-CONSOLIDATION-R1-ROUTE-DECISIONS：逐路由去向及合并依据。
- PHIOS-CONFIGURATION-PROFILE-R1-ASSET-BINDINGS：逐资产真实绑定与排除原因。
- PHIOS-CONFIGURATION-PROFILE-R1-FUNCTION-PROTECTION：数据/计算/评分/生产 owner 与验证结果。
- PHIOS-CONFIGURATION-PROFILE-R1-VALIDATION：真实 command、结果、范围和阻塞项。
- PHIOS-CONFIGURATION-PROFILE-R1-HUMAN-REVIEW.html：一个主审阅入口，展示实际本地页面链接、桌面/手机/中英文代表图、页面结构与真实示例。不要只交 marketing 文案；用户必须能检查完整页面。

最终报告明确列出：哪些页合并、哪些保留、新 Configuration 规范路由、Profile 视觉与工具变化、实际绑定资产、测试结果、未完成项和源码文件。给出可打开的本地审阅地址/启动命令。没有 git commit、push、部署或付费调用。

如单项阻塞，继续完成独立阶段，报告 PARTIAL 与剩余具体项。禁止把“已新增组件但页面未导入”“只有资产清单”“只有 screenshot”“未跑完整检查”写成完成。

## 13. 最终完成标准

用户从首页能立即看到 PHI Configuration 与 Profile 的独有价值和可读视觉；两页能直达、分享并进入真实体验。Explore 只有一份核心解释；My Reality 是工作区；Professional 是真实服务入口。重复说明减少，既有可使用功能完整，新增适合资产有实际位置，关键图片加载正常，两种语言/移动端可读。所有生产和个人资料边界保持原有规则。达到这些标准后提交审阅，不以进一步新增平台介绍页结束本轮。
