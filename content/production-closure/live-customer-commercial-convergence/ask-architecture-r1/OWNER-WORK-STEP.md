# PHI OS · ASK ENTRY + KNOWLEDGE + REALITY + ABOUT CONSOLIDATION R1

完整可执行 Codex Master Work Step

用户确认方向：2026-10-11，马来西亚时间。

## 0｜执行授权、目标与冲突处理

这是执行任务。请在 PHI OS 当前 main 主仓库完成本文件 W0–W14，不停留在分析、方案或占位。目标是让用户从问题进入真实功能和知识，并在主动选择授权资料后继续已有付费现实导航；同时合并 Explore 与 Founder 的重复平台说明，突出 PHI OS 独创的 PHI 构型与 Profile。

用户已同意以下产品方向：

1. 一个主要 Ask 入口，后台按 ENTRY / KNOWLEDGE / REALITY 三类任务处理，而非让所有问题直接默认知识回答。
2. 免费入口分流由 PHI OS deterministic 完成，建立功能索引、领域映射、澄清和明确无匹配结果。
3. 基础知识 Ask 免费并禁止 provider 调用；复杂知识综合可以设计为可选增强，但本轮不启用新付费模型执行，不改价格。
4. 既有付费现实 Ask 和报告生产路径复用，不另建模型、商业权限或报告生产系统。
5. 八类作为客户产品入口，问题领域与产品方法分开；不把八类自动写成规范 Navigation Domain。
6. PHI 构型独立品牌页面、入口与方法身份，可复用原 Personal 输入、计算、报告与权限设施。
7. Explore 的有用说明精简合入 Founder，由一个“关于 PHI OS”入口承载平台与创办人。
8. 功能导航图与个人现实图分开；前者是产品关系，后者必须有真实来源与权限。

当前会话的明确用户指令优先于旧执行文件。更具体的已接受报告/权限规则仍保留。本文件对 Ask 信息架构与 Explore 合并是新授权，不是重做全部既有页面修复。上一轮 LIVE PAGE RECOVERY 的已完成修复复用；未完成、影响本轮的缺图、启动、语言与布局问题顺带闭环，不重复制造一套 R1/R2/R3 注入脚本。

先读 AGENTS.md 和真实治理文件。在当前 main 工作目录工作，保留未提交改动，不 reset、不覆盖其他窗口成果，不自动 commit/push，不扩大清理范围。若另一个窗口正在修改相同文件，检查当前差异并融合本轮最小变更，不能基于过时快照整文件覆盖。

允许本轮代码、索引、页面、测试及零 provider 浏览器验证。禁止新增模型付费调用、真实购买、赠予商业权限、删除客户数据、破坏性数据库迁移、变更桶公开权限、修改已接受报告正文或预算。正常付费服务的既有执行策略不因本轮免费档限制而被全局关闭。

生产发布沿用当前会话及仓库内已明确授权的部署方式和范围。已有适用授权则完成发布与线上验证；没有发布授权则先完成全部本地实现、测试、构建与审阅，再提交具体待发布构建作为最后一步。不得在独立工作未完成时提前询问是否继续。

## W0｜核对当前源码、部署与真实能力

记录仓库路径、分支、HEAD、工作树差异、运行环境、构建方式、公开部署标识（如可取得）和检查时间。区分源码 main、未提交实现、构建产物与线上版本。所有状态必须有当前证据。

以下是上轮已读取的 main 文件线索，执行时核对是否仍存在、是否已修改：

```text
explore/index.html
about/founder/index.html
knowledge/ask/index.html
perspectives/phi-configuration/index.html
functions/public/client-intent-router.js
functions/api/client-intent-route.js
assets/js/pages/client-intent-router.js
assets/customer-ui/js/navigation-intent.js
assets/customer-ui/js/surfaces/contextual-ask.js
functions/api/customer-contextual-ask.js
functions/contextual-ask/contextual-ask-runtime.js
functions/api/ask-phios-orchestrated.js
functions/api/ask-phios-consumption.js
functions/ask2/ask2-consumption-runtime.js
functions/_lib/knowledge-answer-composition.js
functions/_lib/kir-r2-production.js
scripts/knowledge-runtime.mjs
scripts/lib/knowledge-public/published-retrieval-index-v1.mjs
functions/customer-projection/reality-navigation-graph-projection.js
scripts/check-reality-navigation-network.mjs
```

当时观察到：

- 入口路由器主要识别少量明确产品词，不匹配则进入 ASK；不是完整八类问题索引。
- 部分旧 route 指向 /ask、/library、/personal-runtime、/financial-reality 等；本轮核验重定向和 canonical，不假定全部失效。
- knowledgeNavigationIntent 只覆盖少量完整词句；不能作为任意问题理解器。
- contextual Ask 已支持显式知识对象、服务器授权上下文、方法引导和 Reality handoff；应该复用。
- 知识索引已有 nodes、fragments、aliases、questions、relationships、publications 等。
- 知识回答有 deterministic composition，也有条件 KIR R2 provider 分支；不能仅凭基础 composer 的 providerInvoked=false 宣告整个免费路径零 provider。
- 当前现实图 G1 可呈现有限自述及合格外部参考；关系边为空，G2 未建立，G3 无验证历史；校验拒绝未承认的边。
- PHI 构型已有独立页面与方法定位，开始读取复用 Personal 表单。
- 最新观察的 header 已不含 Explore；必须核对实际导航，不能重复移除不存在入口。

建立能力状态表：EXISTS_SOURCE / LOCAL_VERIFIED / DEPLOYED / LIVE_VERIFIED / NOT_IMPLEMENTED，不能把源码函数存在等同生产可用。

找到既有规范领域 registry、Ask owner、knowledge owner、navigation owner、commercial owner 和公共 route owner。定位真实实现而非猜文件名；使用 rg。不要执行 package.json 中名字像检查、实际含付费生成或数据写入的命令，先读定义。

## W1｜冻结三层任务与辅助服务契约

三层是任务分类，不是只按字数/深度收费：

| 层 | mode | 用户任务 | 输出 | 执行策略 |
| --- | --- | --- | --- | --- |
| 免费入口 | ENTRY | 找功能、找起点、选择要理解什么 | 已验证功能、阅读候选、澄清、无匹配、必要转交 | deterministic；provider 禁止 |
| 免费知识 | KNOWLEDGE_BASIC | 找来源、查概念、读取已有解释、结构化比较 | 有出处片段、已有解释、字段对照、阅读路径 | deterministic；provider 禁止 |
| 可选知识增强 | KNOWLEDGE_ENHANCED | 对已有相关来源作新综合 | 来源约束的综合解释 | 本轮仅定义契约；未获具体执行授权不得启动新 provider 或价格 |
| 既有现实 Ask | REALITY_NAVIGATION | 结合授权报告/处境/连续记录比较下一步 | 复用现有付费导航交付 | 现有 entitlement、consent、预算与 provider owner |
| 辅助支持 | PRODUCT_HELP | 账户、付款状态、报告、下载、预约 | 帮助文档、确定性状态、真实支持入口 | 复用账户/帮助能力；不冒充深度导航 |

客户主要体验仍是三类：找到入口、理解知识、继续现实。辅助支持不是第四个昂贵聊天产品；对象内追问是知识或现实 Ask 的上下文变体。

报告新生产、Tarot 新抽牌读取、I Ching 新起卦读取不是 Ask 自动可执行动作。分流只能提供候选，生成必须进入既有明确输入、同意、权限与执行流程。

用户不需要先理解内部 mode。入口按钮、帮助说明和来源标记使用客户语言，不显示 registry、authority pack、admission 等内部治理词。

产品深度与执行费用分开：复杂度高但无足够来源的请求不能自动变成模型收费。付费不代表证据更真实。

## W2｜两条分类轴：规范领域与八类客户入口

不要新建八个 canonical Navigation Domain 覆盖既有规范领域。先读取原有领域及 owner，建立可追溯映射，允许一问多领域。

轴 A：问题涉及的现实/知识领域，使用现有规范 registry，如工作、关系、财务、健康、世界/公共背景等，准确名称以原系统为准。

轴 B：客户可以进入的产品和方法。

用户接受的八类入口如下，名称可以为双语可读性调整，但职责不应悄悄改变：

| display group | 中文 / 英文 | 内容 | 分类性质 |
| --- | --- | --- | --- |
| PERSONAL_METHODS | 个人方法 / Personal methods | 已可用八字、紫微、占星、人类图、数字学等 | 产品方法集合 |
| RELATIONSHIP | 关系 / Relationships | 关系问题与既有关系读取 | 领域与产品 |
| FINANCIAL | 财务 / Financial reality | 现金流、财务现实、规划能力 | 领域与产品 |
| WORLD | 世界 / World | 当前背景、文明结构、Atlas、比较 | 领域与公共内容 |
| HEALTH_CARE | 健康与照护 / Health and care | 当前实际可用健康整理与照护路由 | 领域与有限能力 |
| PROFILE | 个人画像 / Profile | 自陈、任务表现、外部测评与来源结构 | 资料产品 |
| REFLECTION | 问题与反思 / Reflection | 易经、塔罗 | 方法集合 |
| PHI_CONFIGURATION | PHI 构型 / PHI Configuration | PHI OS 独立构型模型 | 独创方法 |

Profile 不等于全部 Evidence。Evidence 是所有领域共享的来源分类，不能只归 Profile。Reflection 不命名成笼统 Question；所有入口都有问题。

额外便捷出口：阅读知识、账户/报告帮助、专业协助、无匹配/澄清。它们不为凑八类而隐藏。

关系、财务、健康等卡片只承诺真实可用能力。尚未完成专项能力时可以引向准确的整理/知识/专业路径，不显示“完整健康报告”之类虚假承诺。

交付当前规范领域→客户产品入口映射表，说明重叠与空缺。系统推算只产生建议候选，不能静默改变规范语义或根据问题替用户选择命理体系。

## W3｜功能索引：建立单一可消费的真实能力清单

优先扩展当前 registry/owner，避免第二份功能目录与路由 resolver。若现有结构不足，新建明确的公共只读 projection，从既有源生成。

建议字段应按真实 owner 适配，不要求机械照抄名称：

```text
capabilityId / productGroupId
displayLabels: zh-Hans, en
canonicalRoute / routeOwner
supportedIntents / nonSupportedIntents
aliases / examples / negativeExamples
canonicalDomainRefs[]
availability / availabilitySource / verifiedAt
inputRequirements[]
sourceRequirements[]
consentRequirement / entitlementRequirement
executionClass / costDisclosureSource
outputKinds[]
handoffContractRef
capabilityVersion / indexVersion
```

每个开放能力必须有有效 canonical route、输入要求、输出承诺和后端支持证据。商品目录决定购买权限，功能索引不能自己授予权限。

方法开放状态从真实 method registry 读取；报告状态由实际报告 owner 读取；预约由服务 owner 读取。不能把营销描述当成执行可用性。

稳定的静态功能目录可构建生成；需要账户状态的能力在服务端按真实权限投影。不要把私有资料、订单、客户报告对象键放入公共索引。

建立 orphan 检查：开放卡片无功能、功能无入口、旧 route、重复 capability、别名污染、无当前语言标题、已关闭商品误暴露。

## W4｜免费入口路由：可解释、多领域、可澄清

改造现有 client-intent-route 与对应客户端，或让它消费新公共 projection。只保留一个 authoritative route owner，旧调用通过兼容层过渡，不能再产生新孤立 Ask 页面。

请求建议包括 question、locale、entrySurface、显式选择的产品/任务 hint 和已选公开 sourceRef。公开 hint 不等同授权，客户端不能提供 paid=true 或 trustedContext 以授予执行权限。

解析顺序：

1. 已明确的帮助请求或专项产品词。
2. 已选对象上下文与明确任务。
3. 领域、行动动词、时间与比较意图。
4. 中英别名、词组及加权规则，支持多领域候选。
5. 高把握且能力真实可用时给主要入口；低把握或冲突时给一个简短澄清问题。
6. 确认没有相关能力/来源时给 NO_MATCH 或 LIMITED_SUPPORT，不强行归类。

评分作为规则匹配强度，不显示“92% 正确”伪概率；阈值用代表样本调试。否定、引用、知识问题与自身请求要区分：例如“我不想抽塔罗”不能被路由到抽牌。

建议 route outcomes：

```text
MATCHED_CAPABILITY
KNOWLEDGE_LOOKUP
MULTI_DOMAIN_CLARIFY
NEEDS_INPUT
PRODUCT_HELP
PROFESSIONAL_HANDOFF
LIMITED_SUPPORT
NO_MATCH
```

用户问题处理覆盖目标是 100% 有明确结果，不是 100% 匹配八类，不是 100% 给出事实答案。空输入/超长输入给合理 validation。

结果默认至多一个主要方向、两个辅助方向，说明简短匹配理由，用户可以纠正。不要输出八张同样大的营销卡。

普通用户输入保留在 POST/受控会话；不要继续将含个人问题的 q 放进跳转 URL、分析事件或访问日志。页面位置用非敏感 capability/source ID，报告私有上下文按现有安全 handoff 使用服务器授权的 opaque ref；没有授权机制时不要自建公开 token 通道。

入口层不自动保存、不静默读取账户、不生成报告、不启动模型、不决定个人行动。原始问题仍是检索问题，不能把系统推荐标签拼成一段新问题替换它。

## W5｜首页与统一 Ask UI

首页保留用户认可的视觉 Hero 与“你现在想了解什么？”。说明改成真实入口承诺，例如：

中文：说出你想了解的事，我们帮你找到相关功能、知识或下一步。

英文：Tell us what you want to understand. Find a relevant tool, source, or next step.

首页提交按钮使用“开始”或“找到入口”，不暗示任何问题都能获得免费通用回答。不要把“默认从知识开始”继续作为所有问题的统一执行策略。

输入框下面提供少量例题与可展开的八类入口；用户可以直接选产品，也可以先问问题。清楚提供阅读知识与账户帮助。

统一 Ask 可显示三个轻量任务选择：找到入口 / 理解知识 / 继续我的现实。默认由 entry context 和请求意图决定，用户可切换。不要要求先填复杂领域表单，也不把所有层都变成八个页签。

header Ask、首页、搜索结果、知识页、文章/书籍/Atlas、报告和 Reality 的 Ask 入口使用同一任务契约，但不同 context。已有 canonical Ask route 可以保留；不为重命名强制建立多个新路由。

初次进入显示输入与必要上下文；结果按任务输出，基础检索不要固定展示六个巨大空卡。来源与详细限制可展开，关键范围与无来源状态明确可见。

结果保留修改问题、纠正入口、打开来源、直接进入功能的路径。返回不能丢失必要非敏感上下文；个人内容保存必须由用户主动选择。

## W6｜基础知识检索：在既有索引上补齐覆盖与相关性

核对当前 published knowledge authority、私有书稿授权、章节绑定、published retrieval index、structured source capability、Atlas scope 和语言 registry。明确哪些是公共免费、购买可读、授权可检索、仅摘要、未发布或已撤回。

公共文章可按现有索引检索；书籍不能因为可检索就免费输出全文；Atlas 图的资产存在不等于已有解释文本、实时事实或已接受对象。

索引包含对象身份、语言、版本、标题、摘要、段落/字段、批准状态、访问等级、真实 href/anchor、概念别名、关系类型。公共客户端仅拿公开允许的内容。

核对所有八册的实际索引覆盖。已读旧 builder 中存在只列前四册 blueprint 的代码，不代表其他路径都缺失；必须对比实际 authority、universal registry 和 deployed records，避免重复建索引或误判。

检索流程：

1. 保留用户原问和语言，进行中英分词/别名归一化，保留否定、数字、对象和时间。
2. 显式 sourceRef 优先在该对象范围检索；扩展到章节/全库时显示范围改变。
3. 综合标题、概念、问题别名、正文片段与结构化字段匹配，避免只靠某个常见词。
4. 去重相同段落与重复发布版本，优先当前合法版本。
5. 按相关性输出少量证据；明确 PARTIAL / SUFFICIENT / NO_SUPPORTED_RESULT。
6. 下一步阅读仅走现有登记关系或明确内容关系，不能把图上相邻当作因果。

本轮优先用现有 deterministic 搜索能力，必要时补加权词法检索，不新增付费 embedding/模型服务。不把“语义理解”写成已经有完备自然语言能力；未来需额外服务时先单列评估，不能默默调用。

静态可控知识可采用编辑后批准的双语定义、常见问题答案、概念比较与阅读说明，作为稳定免费资产。构建索引不等于重新生成或发布内容。

## W7｜基础知识回答与费用隔离

先明确免费输出模式：

| 问题 | 免费能力 |
| --- | --- |
| 在哪里读到某主题 | 相关文章/章节/图示入口，简短匹配理由 |
| 某概念是什么 | 已批准定义/解释与出处 |
| 这段讲什么 | 已有摘要或相关原文片段；没有时说明仅提供相关材料 |
| 两个概念/Atlas 对象比较 | 结构化字段对照或已批准比较 |
| 接下来读什么 | 既有前置、相关、后继关系 |
| 结合多个来源写新解释 | 免费先提供材料；生成综合属于可选增强 |

deterministic 组合只做可追溯的已有内容提取、排序和受控连接，不能用模板说出来源不支持的新结论。不要把多个相关片段排列后称为已完成深度推理。

免费结果至少包含：命中的内容、它支持什么、来源位置、来源范围、仍缺什么、可继续的路径。无匹配不输出无关哲学段落填充页面。

建立服务端执行 class/policy，让 ENTRY、KNOWLEDGE_BASIC、PRODUCT_HELP 无论从哪个 API/深度参数调用，都不能进入 provider gateway。不能只在前端隐藏付费按钮，不能通过 depth=DEEP 或请求 body 伪造 entitlement 绕过。

审查 knowledge-answer-composition → KIR R2 production → successor/gateway 全链。免费档可以用明确禁止 provider 的策略继续复用其 deterministic 结果，或在该执行 class 下跳过可生成分支；不可全局关闭既有付费任务。

AI 增强仅在有相关证据、真实能力、明确 entitlement、费用披露和用户明确选择时才可设计开放；本轮没有新增执行授权时显示准确状态或不显示按钮，不创建不能兑现的“升级”占位。

相关资料不足不能自动付费升级；源数据无法访问不能付费绕过；健康紧急照护转交不因付费或登录而延迟。

测试使用 provider stub，任何免费路径试图调用 provider 立即失败，并核验结果有 generationMode 与 providerInvoked 的真实记录。零 provider 指未调用模型，不表示没有计算/存储/网络成本。

## W8｜对象内 Ask 与知识闭环

支持实际存在的文章、书籍章节、图示、概念、课程、文明案例、重组案例、snapshot/dossier 等对象；先复用现有 sourceRef/structured-source-capability/atlas-scope owner。

每个对象内 Ask 必须绑定稳定 ID 与版本、当前语言、访问范围、source route/anchor。客户端 label/summary 只能用于显示，服务端按真实 ID 重新解析，不信任任意客户端正文作为已批准来源。

知识闭环：

```text
来源对象 → 问该对象 → 范围内检索 → 有依据结果 → 打开证据位置 → 后续追问
```

结果中的 citation/来源链接必须到相关段落、字段或真实对象详情，不只链接首页。没有现有 anchor 时可以补稳定 anchor，但不改变内容身份。

后续追问保留 parentAnswer/sourceRefs/version/scope 与任务类型；原问题、来源片段和生成回答性质分开。原有匿名深度限制和账户策略先核对，不擅自修改商业限制。

对象删除、版本变化、权限撤销、语言不存在、来源过期、API 失败都需要准确状态和可恢复入口。不要在用户已选某文章时静默回到全库回答。

中英语义一致，不逐字机械翻译；没有目标语言批准内容时明确可用原文范围，不能通过显示英文原文宣告中文纯净。

## W9｜报告 → Reality → 既有付费 Ask

复用现有报告上下文 handoff、授权 source registry、server-resolved contexts、Reality owner、paid Ask entitlement/credits 和生产 provider gateway。

从报告进入时传真实报告 ref、版本、方法身份和被选择的部分，不能默认重新生成报告，也不能把解释自动升级为个人已验证事实。

允许不用报告直接描述现实；报告不是使用 Reality 或付费 Ask 的必备门槛，Profile 和 PHI 构型也不是强制前置。

用户主动选择加入以下范围：报告/个人资料、当前自述、公开知识、当前公共来源、既有连续记录。不同来源保持标签，报告/模型不覆盖现实观察，公开事件不自动确定个人适用性。

来源到 Reality 的交接显示带入内容和范围，主动确认；默认不静默保存。权限服务器核验，不能靠 URL 或 client object 授予第三人资料访问。

已接受的八字/紫微及其他 reference report pipeline、商业目录、normal calls、technical repair、预算上限和 accepted copy 不变。页面分层不是新 provider 开发任务。

本轮用 existing fixture/安全测试账户验证 authorized/denied/stale/version mismatch 和 paid upgrade UI，不真实付款、不扣真实 credits、不发起付费生成。生产付费执行实测若未做，最终明确 NOT_RUN，不能因 stub 成功称为生产通过。

## W10｜PHI 构型独立定位与产品接线

保持 PHI 构型为独立产品入口和方法身份，与“个人方法”在客户入口中分开。不是将出生模型变成现实领域，不叫事实证据或能力评分。

中文名称：PHI 构型。英文名称：PHI Configuration。上层说明使用“个人构型 / Personal configuration”作为定位说明，不擅自替换真实算法/方法代码。

入口层直接路由到 PHI 构型页面或已存在的对应 method input；保留用户所选身份。复用 Personal 输入组件时从 registry 解析真实 formValue，不能写死猜测代码。

检查出生资料、时间/地点确认、consent、未知时间规则、deterministic 计算、免费图、完整报告目录和 entitlement 的闭环。复制一份表单而没有正确方法参数不算独立接线。

与其他方法和 Profile 的区别简短准确：PHI 构型表达模型内结构；其他方法各有来源；Profile 组织不同类型个人资料。它们可并行使用，不暗示任一是更高证据层。

使用已批准营销图或真实合成示例；示例明确不是客户结果。不得编造 radar、能力比例、诊断或现实关系。

## W11｜功能导航图与个人现实图分离

### W11A 功能导航图：本轮必须完成

从功能索引与知识关系投影只读图。节点可以是问题、领域候选、产品、来源和下一步；边必须有明确类型，如可进入、包含方法、提供来源、可继续。

这是产品路由与内容关系，不是个人因果图。边依据 registry，不能用距离、模型猜测或图形美观创造。隐藏不可用能力或明确标注当前范围。

用户提问后高亮相关小子图，默认只显示少量关键节点；点击节点能打开真实功能/来源。八类总览可以用静态可点击结构，不强制所有图都用复杂力导向布局。

图要有可访问的列表/卡片等价内容、键盘路径、手机布局、双语标签、无重叠和详情入口。新可交互图优先 SVG/HTML，不能用无交互营销图片代替真实功能图。

### W11B 个人现实图：保留真实边界，完成可执行部分

审计当前 G1/G2/G3 与真实 Reality/Navigation owner 是否已有来源级关系、方向/位置、版本历史。存在真实 admitted 对象时补 adapter 和验证；不存在时记录缺口，不能造边。

本轮不得在 renderer 中生成 canonical edge/方向/历史；不得为消除空态把 relation admission 检查删除。不要将 W11A 的功能边写入个人现实图。

客户界面应说明当前有资料、尚未建立哪些连接，给真实下一步；不显示内部 G2_NOT_ESTABLISHED 之类状态码。

若完成个人现实关系需要新 canonical 契约、写入或迁移，本轮交付具体设计与证据，不自动扩大写入权限。该项可以 PARTIAL，但不能阻止功能图、免费索引和知识闭环完成。

## W12｜Explore + Founder 合并与全站导航

目标是减少说明页重复、保留品牌信任，不将长篇 Explore 原封不动追加到 Founder。

以现有 Founder 页面为 canonical 承载，客户入口名“关于 PHI OS / About PHI OS”。保留用户批准 Founder Hero/portrait 和真实生平，不编造资历。

建议最终节奏：

1. 为什么 PHI OS 存在：Founder Hero 与核心价值。
2. 创办经历如何形成系统：具体、真实、精简。
3. 独创能力：PHI 构型、Profile、现实导航，各自真实链接。
4. 怎样开始：找到入口 / 理解知识 / 继续现实三个实际例子。
5. 来源、隐私、责任：必要简洁说明与详情。
6. 少量 FAQ 与进入 Ask/直接产品入口。

整合后清除重复平台比较、重复流程图、重复 CTA。已批准图按作用复用，不能再次丢图或叠加多套注入模块。重要 Hero 直接可加载，深蓝/深青绿、暖金和米色风格一致。

保留功能型主导航与突出的 Ask。“关于 PHI OS”作为品牌项，可放末位/二级菜单，手机同样可到达；不要让 founder 取代世界、知识等实际功能入口。根据当前 header owner 实现，而非向不同 shell 各写一份。

页尾与首页品牌链接同步。处理 about、founder、explore、why/how-it-works 等真实存在路由和引用，避免破坏知识正文引用。

完成内容迁移后将 /explore/ 及已合并说明子路由重定向到对应 canonical/锚点；未合并且仍有独立功能的子路由保留。列出每条旧路径与新目标，检查真实平台支持的 301/308 或框架重定向。

注意 HTTP redirect 无法在服务端读取 fragment。旧 Explore hash 需要通过客户端兼容或目标页保留相应 anchor 实现，不得假写 _redirects 规则匹配 #how。目标页不得多次跳转或循环。

canonical、title、description、OG、schema、sitemap、内部链接、导航选中状态及中英元信息一致。不要在源码存在 www 与非 www 时再引入新 canonical 分叉。

## W13｜功能、安全、语言与成本验证

新增测试针对真实失败，不测试模板实现本身。复用已有 regression runner，先读真实命令定义；不要求不存在脚本、不更新旧冻结哈希掩盖失败。

### W13.1 双语问题样本

以下是最低必测情景，扩展同义词、否定、混合领域和上下文，不做只覆盖固定字符串的测试：

| 输入意图 | 应有结果 |
| --- | --- |
| 我想看八字 / I want a BaZi chart | 个人方法的八字入口；不直接生成/收费 |
| 我想看 PHI 构型 | 独立 PHI 构型入口，保留方法身份 |
| Profile 和八字有什么不同 | 知识/产品比较，不能自动开始任一报告 |
| 我不想抽塔罗，想读有关选择的文章 | 知识结果，不能路由抽牌 |
| 我想换工作，收入会少，丈夫不支持 | 多领域候选与简短重点澄清 |
| 什么是现金流 | 知识解释，不默认要求填财务账户 |
| 帮我整理每月收入支出 | 真实财务功能与输入要求 |
| 今天某项政策怎样影响我 | 当前来源与辖区要求，不能用旧书知识冒充当前事实 |
| 有关文明重组在哪里读 | 已可用知识/Atlas 入口 |
| 当前文章中的“结构”是什么意思 | 优先文章范围，返回对应片段 |
| 比较两个已选择 Atlas 案例 | 真实字段与来源比较，不创造因果 |
| 我需要下载已买报告 | 产品帮助与服务器权限，不进入泛知识 |
| 我的报告和当前经历不一致 | 选择报告与处境，保留来源区别，提供既有现实 Ask 路径 |
| 一个系统完全没有覆盖的问题 | 明确 NO_MATCH/LIMITED_SUPPORT，不伪答 |
| 紧急健康信号并含收入/费用词 | 健康照护优先，不被财务匹配压过，不付费拦截 |

health 分类优先级必须审查。旧 classifyAsk2Consumption 中 strong financial signal 可能先影响 health bridge，不能让费用词覆盖明显紧急信号。仅使用现有受治理照护规则和测试，不新增临床诊断/治疗文案。

覆盖边界：免费请求 depth 伪造、client entitlement 伪造、私有 sourceRef、过期报告、第三人上下文、无来源、来源版本变动、重复点击、切换语言、索引不可用、网络失败。

### W13.2 明确验收门槛

- 有效问题均产生合法 outcome；无 silent fallback 空白、循环跳转或错误收费。
- 所有开放 capability 有有效路由和真实输入/输出。
- 所有免费样本 providerCalls=0；stub 禁止网络 gateway，通过服务端策略验证。
- 当前 source-ref 到证据位置可打开，结果与用户问题相关。
- 低把握/多领域给可回答的澄清，不强制匹配。
- 支持来源不足准确说明，不给无关长文或自动付费。
- 公开索引无私有资料；账户/报告权限由服务器决定。
- 付费既有流程未被免费策略全局关闭，无新 model/预算/报告回归。
- PHI 构型独立入口正确接真实计算方法，示例与个人结果分开。
- 功能图有真实可点击关系；个人现实图无伪造关系/历史。
- Explore 迁移后内容、旧链接、重定向和导航闭环。

### W13.3 浏览器与布局

首页、统一 Ask、对象内 Ask、PHI 构型、Founder、Reality 和产品帮助：中文/英文×桌面/手机。至少检查 390 和 1440 宽度、键盘焦点、菜单、返回、来源展开、无结果和错误恢复。

没有缺图、模块启动异常、巨大空卡、重复注入、图字重叠、客户可见内部代码或未解释混合语言。原文资料/品牌例外明确列出，不用例外跳过整段界面翻译。

截图保留关键模板/状态和失败证据，不为每个样本产生多份截图。运行日志/生成索引/大规模测试产物放仓库约定忽略目录，不能再次制造数千待提交文件；交付摘要和必要代表证据即可。

## W14｜构建、发布、交付与状态

同一源码快照执行受影响回归、仓库要求检查和 Pages 构建。新增 index/registry/projection 必须真实进入构建产物和部署，不只在本地 content 中存在。

部署前核验当前 main/工作树未被其他窗口改变；相关变化出现时重跑受影响检查。必要 Pages 路由/Functions/worker 产物按实际构建模式核对。

已有适用部署授权则发布，再检查线上首页分流、免费知识对象、PHI 构型入口、About/Explore 重定向及新 provider 禁止策略。生产线上免费执行只做非敏感样本并确认当前版本已带零 provider 策略；付费路径本轮使用 fixture，不触发真实付费。

没有部署授权：完成 READY_FOR_DEPLOYMENT 和可审阅构建，再提出具体发布动作。线上未更新就明确未更新，不能写 LIVE_VERIFIED。

建议交付放在仓库现有规范目录；下面命名可适配，但文件必须存在：

```text
tools/review/PHIOS-ASK-ARCHITECTURE-R1-HUMAN-REVIEW.html
PHIOS-ASK-R1-CAPABILITY-LEDGER.csv
PHIOS-ASK-R1-DOMAIN-PRODUCT-MAPPING.csv
PHIOS-ASK-R1-SOURCE-CLOSURE-LEDGER.csv
PHIOS-ASK-R1-ROUTE-MIGRATION.csv
PHIOS-ASK-R1-VALIDATION.json
```

审核页面包含：三层用户路径、八类入口、功能图、知识对象闭环、PHI 构型独立接线、合并后的 About 页面、旧路径映射、关键视觉结果、免费 provider 禁止验证、未完成项与真实线上链接。

记录：HEAD/工作树摘要、indexVersion、index coverage、规则版本、构建/部署标识、测试时间、providerCalls、路由/源对象失败清单。复杂知识增强未启用、付费生产实测 NOT_RUN、个人现实图尚缺 admitted owner 时如实列出。

状态：WORK_COMPLETED / VALIDATED_LOCALLY / READY_FOR_DEPLOYMENT / DEPLOYED / LIVE_VERIFIED / PARTIAL / BLOCKED。状态不混用；只能对具体 scope 宣告通过。

本轮核心 DONE：

1. 三层任务契约实际被客户端与服务端消费。
2. 免费功能索引和入口分流实际工作，多领域与无匹配有明确结果。
3. 八类产品入口与既有规范领域有可追溯映射。
4. 基础知识索引、相关结果与对象来源/追问闭环。
5. 免费路径服务端明确禁止 provider；既有付费路径保留。
6. PHI 构型独立身份和真实输入/图/权限接线。
7. 功能导航图实际可用；个人现实图保留依据边界并记录缺口。
8. Explore/Founder 完成精简合并，导航、链接和重定向一致。
9. 双语、手机、缺图、错误状态和必要回归完成。
10. 审核文件和台账真实可打开；部署/线上状态分别有证据。

最终回复先说明是否核心 DONE 与是否 LIVE_VERIFIED，再列功能变化、费用策略、验证和残留项。禁止用“创建 registry”“新增图组件”“通过部分检查”代替完整用户路径。

## 直接交给 Codex 的启动指令

请执行附件 PHIOS-ASK-ENTRY-KNOWLEDGE-REALITY-AND-ABOUT-CONSOLIDATION-R1-MASTER-WORK-STEP.md 的 W0–W14，在当前 main 主工作目录完成实现和验收。复用现有路由、知识检索、上下文、报告、Reality 和付费 Ask owner；建立免费 deterministic 入口索引与知识闭环，服务端禁止免费路径调用 provider。八类是客户产品入口，不能覆盖既有规范领域；PHI 构型独立推广并正确接原计算身份。完成功能导航图，并保留个人现实图的真实关系/历史边界。把 Explore 的有用内容精简并入 Founder，统一“关于 PHI OS”与旧路由迁移。保留其他窗口未提交改动，不自动 commit/push、不真实付款、不新增付费调用或重写 accepted reports。按既有真实授权完成部署，否则先完成全部本地工作再提交具体发布方案。最终交付真实审核 HTML、逐能力/领域/来源/路由台账，并分别报告本地验证、部署和线上验收；不得停在方案或占位。
