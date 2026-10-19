# PHI OS · CUSTOMER ENTRY + ASK RECOVERY + KNOWLEDGE NAVIGATION MASTER R1

## 0. Mission — 本轮唯一目标

在现有 PHI OS 主仓库中，完成 getphios.com 公众入口的实质性修复与重构。

本轮必须解决：

1. 首页文案抽象，首次访问者无法理解网站价值。
2. 手机首页空间分配失衡，真实操作入口不够清楚。
3. 用户输入「爱情」等常见生活主题后，Ask 返回「服务暂时无法完成请求」。
4. Ask 不可用时，没有可继续使用的确定性导航。
5. 已建立的八册知识、个人分析方法、PHI Configuration、Profile、World、Civilization Atlas 与专业服务，没有通过生活问题形成有效连接。
6. 页面工程验收与真实用户体验脱节。
7. 中文与英文页面必须各自形成自然、完整、无语言混杂的客户体验。

本轮不新增理论、不重构八册核心内容、不改变已冻结的报告生成器，也不扩大原有付费与生产权限。

**最终目标：一位从未接触 PHI OS 的手机用户，能够从一个普通问题开始，在不理解内部术语的情况下，获得真实可用的免费体验，并找到合理的下一步。**

---

## 1. Execution Authority & Safety

### 1.1 工作环境

- 在现有 main repository 工作区执行。
- 首先确认实际仓库根目录、branch、HEAD、远程 main 状态及工作区修改。
- 如果远程不可访问，明确记录，不能假定本地 HEAD 等于最新远程 main。
- 不覆盖、不还原、不丢弃其他工作窗口产生的修改。
- 不执行破坏性 reset、clean、force checkout 或强制覆盖。
- 所有文件修改必须在原有项目结构内进行。
- 不生成独立平行网站，不使用 ZIP 或 delta ZIP 交付。
- 如其他窗口正在修改相同文件，先识别冲突，保留双方变更；无法安全合并则停止该文件修改并报告。

### 1.2 生产与费用边界

本轮默认：

- NO COMMIT
- NO PUSH
- NO DEPLOY
- NO PRODUCTION D1 WRITE
- NO PRODUCTION MIGRATION
- NO CHECKOUT OR BILLING MUTATION
- NO PAID PROVIDER CALL
- NO CUSTOMER EMAIL OR EXTERNAL SEND
- NO R2 ASSET MUTATION
- NO SECRET OR TOKEN EXPOSURE

只读检查现有公开网站、仓库源码、已存在的部署证据及安全可读取的日志。

若真实生产错误需要授权访问，先完成本地可证实的部分，并将剩余验证明确标为 BLOCKED 或 UNVERIFIED。

不能为了让本轮通过而打开付费模型、关闭认证、扩大 Cloudflare 或 D1 权限。

---

## 2. Phase A — Repository & Production Reality Audit

不要立即修改首页。

先建立当前事实基线。

### A1. 识别现有入口

定位：

- 首页实际实现文件与路由。
- 中文及英文首页。
- Ask 主入口和知识 Ask 入口。
- 首页表单提交处理函数。
- Intent router。
- H.5/bootstrap 等现有入口初始化逻辑。
- Ask API 及服务端处理链。
- 免费与会员权限识别。
- 错误消息映射。
- Ask 配额及 provider 调用控制。
- 页面内所有通向方法、World、Search、Books 和专业服务的链接。

将实际路径及依赖关系记录到审计文件。

不得根据旧文档假定当前实现仍相同。

### A2. 复现截图中的故障

以中文手机端客户路径复现：

1. 打开首页。
2. 在输入框输入「爱情」。
3. 点击「免费提问」。
4. 记录页面状态、请求路径、HTTP 状态、服务端可见错误、响应类别以及对应处理分支。
5. 判断失败来自哪一层。

至少区分：

- 输入与意图识别失败
- 前端路由失败
- API 网络或运行时失败
- Pages/Worker 绑定或部署问题
- 初始化/bootstrap 失败
- 认证或配额问题
- Provider unavailable
- 数据/知识检索失败
- 预期的能力边界或禁用状态
- 无法证实的生产异常

不得将所有异常统一解释为「AI 不可用」。

也不能因为生产读权限不足就猜测原因。

### A3. 检查实际生产版本

只读比对：

- 本地 HEAD。
- 已知远程 main。
- Cloudflare Pages 当前生产 deployment。
- 构建产物及资产版本。
- 首页实际输出与仓库实现是否一致。

分别记录：

LOCAL / REMOTE / DEPLOYED / UNKNOWN。

如果生产部署落后于仓库，必须分清：

- 代码尚未包含修复；
- 代码已修复但未部署；
- 代码及部署均存在故障。

不得将本地修复声明为线上已修复。

### A4. 形成故障归因报告

生成：

`docs/customer-entry/ENTRY-ASK-ROOT-CAUSE-R1.md`

要求包含：

- 实际复现结果
- 源码证据
- 请求与响应证据
- 生产版本比对
- 已证实根因
- 仍未知部分
- 建议的最小修复
- 回归风险

如果不能取得足够证据，根因状态必须写为 UNKNOWN，而非 PASS。

---

## 3. Phase B — Freeze Customer-Facing Language

本轮对外文案必须从工程语言切换为自然生活语言。

### B1. 首页核心信息

建议中文主文：

**从你正在面对的问题开始，认识自己，理解现实，看见更多可能。**

建议首屏标题：

**生活中有些问题，值得看得更清楚。**

辅助说明：

关于感情、工作、金钱、家庭，或正在改变的世界。你可以从一个问题开始，寻找相关知识、不同视角与可行的下一步。

英文不是逐字翻译，应自然表达同一含义。

建议：

**Start with what matters to you. Understand yourself, make sense of the world, and explore what comes next.**

首屏标题建议：

**Some questions in life deserve a clearer perspective.**

辅助说明：

Whether it's relationships, work, money, family, or a changing world, start with a question and explore relevant knowledge, different perspectives, and possible next steps.

以上作为默认编辑候选，检查现有品牌及正式双语术语后确定，不必机械复制。

### B2. 用户端禁用表达

首页与普通问题导航不应突出：

- deterministic router
- runtime
- carrier
- provenance
- evidence contract
- capability boundary
- bootstrap
- projection
- source namespace
- internal route ID
- provider recovery
- schema
- accepted registry
- semantic verifier

这些概念可以保留在工程层、方法说明或详细可信度说明中，但不能替代普通用户可以理解的功能名称。

不能删除必要的风险提示、来源归属、收费说明、隐私或授权信息。

### B3. 统一用词

客户入口优先采用：

- 开始探索 / Start exploring
- 认识自己 / Understand yourself
- 感情与关系 / Love & relationships
- 工作与方向 / Work & direction
- 金钱与生活 / Money & everyday life
- 家庭与成长 / Family & growth
- 理解世界 / Understand the world
- 阅读知识 / Explore knowledge
- 查看相关方法 / Explore methods
- 寻找下一步 / Explore next steps

不要用「免费提问」承诺尚未实际可用的生成式 Ask 服务。

如果是确定性主题探索，按钮应称为「开始探索」。

如果真正进入生成式 Ask，应明确区分免费使用权限、用户配额与实际可用状态。

---

## 4. Phase C — Mobile-First Homepage Reconstruction

### C1. 首屏原则

保留 PHI OS 已接受的品牌方向：

- 深蓝与深青绿
- 暖金重点色
- 适量米白内容面板
- 清楚的视觉层次
- 不使用大面积单调白底
- 不增加没有意义的装饰线条
- Logo 按已接受品牌母版处理，不擅自重画

手机首屏必须优先显示：

1. PHI OS 品牌和可操作菜单。
2. 一句明确的价值主张。
3. 简短辅助说明。
4. 用户主题选择。
5. 开始探索入口。

删除重复解释和无意义的大量留白。

不要让巨大的表单或长段抽象文字主导首屏。

### C2. 六个问题入口

默认设计六个生活主题：

1. 感情与关系
2. 工作与方向
3. 金钱与生活
4. 家庭与成长
5. 认识自己
6. 世界正在发生什么

桌面可以采用 3×2 布局。

手机默认采用 2×3 布局，确保可点击区域充足，文字不截断、不溢出。

主题选择后允许用户继续输入自由问题。

### C3. 不把所有内容塞进首屏

首屏以下按照用户理解顺序组织：

**Section 1 — 从一个问题开始**

问题导航及自由输入。

**Section 2 — 用不同方式理解问题**

知识阅读、个人探索、世界观察、专业支持。

**Section 3 — 认识自己**

介绍 Profile、PHI Configuration 及现有个人方法，不向普通客户展示一串没有说明的技术名称。

**Section 4 — 理解世界**

介绍 World、Civilization Atlas，以及已接入并实际可用的公共现实信息。

**Section 5 — 探索八册知识**

以生活议题、核心问题和阅读路线呈现已发布内容。

**Section 6 — 需要进一步帮助？**

连接已有的专业服务与账户功能。

每个 section 必须有真实目标页面及可理解的用途。

对未完成能力，不创建假入口。

### C4. 视觉资产使用

读取现有 R2 bucket asset manifest 与仓库中的资产映射。

优先复用已经批准的：

- PHI OS 品牌资源
- Eight-Volume System
- Perspectives
- Personal methods
- World / Civilization Atlas
- Profile / PHI Configuration

复用前检查：

- 对象路径真实存在
- 公开 URL 有效
- 画面与页面主题相符
- 手机裁切合理
- 文字对比及可读性足够

不以随机金线、抽象粒子图代替有意义的视觉内容。

不得未经需要重新生成已经批准的资产。

---

## 5. Phase D — Question Navigation Architecture

这是本轮最重要的新增闭环。

### D1. 先导航，再决定是否调用 Ask

用户输入普通生活主题时：

`User Question → Intent Identification → Relevant Pathways → Available Content → Optional Deeper Ask`

不能将所有输入直接送入生成式 AI。

导航本身必须在 provider 不可用时仍可正常运行。

### D2. 主题识别

至少支持：

- 单词或短语
- 完整自然语言问题
- 中文输入
- 英文输入
- 无效或空白输入
- 模糊问题
- 同一问题关联多个主题

例如：

「爱情」

不应该直接生成空洞答案或触发错误，而应展示进一步选择：

- 为什么关系总出现相似问题？
- 如何更好理解这段关系？
- 为什么我们总是沟通困难？
- 想通过个人方法了解关系？

每个选择必须能继续进入已验证的实际内容。

### D3. 不以关键词硬套方法

不要出现：

爱情 → 自动占星

工作 → 自动八字

经济 → 自动 World

正确方式是根据用户真正意图选择：

- 阅读知识
- 认识自己的运行特点
- 使用某种个人分析方法
- 查看与问题相关的公共现实信息
- 探索可供采取的下一步
- 进一步向 Ask 提问

对于健康、法律、金融、诈骗等现实风险议题，优先展示有来源的现实信息、合理的风险说明和专业资源，不利用预测性方法代替事实判断。

### D4. 复用现有索引

优先调查并接入：

- Eight-Volume knowledge index
- Academy
- Articles
- Figures
- Search
- PHI Configuration
- Profile
- BaZi
- Zi Wei
- Astrology
- Human Design
- I Ching
- Tarot
- World
- Civilization Atlas
- Professional Services

实际仓库中不存在或未完成的部分，应记录缺口，不创建虚假内容。

### D5. 路由必须可维护

采用已有项目认可的数据或配置组织方式，形成可追踪的主题映射。

每个映射至少表达：

- 主题身份
- 中文/英文名称
- 适用问题
- 对应已存在内容
- 实际目标路径
- 可用状态
- 后续探索类型
- 必要权限
- 无法使用时的替代入口

不在前端写死无法审核的大段 if/else。

不能把没有来源或没有业务意义的关联写成已验证事实。

---

## 6. Phase E — Ask Failure Recovery

### E1. 真实修复

根据 Phase A 的证据，修复导致当前首页 Ask 失败的实际问题。

优先最小范围修复。

不得为了修复入口而大规模改造鉴权、账务、D1 或 provider 架构。

### E2. 四类用户结果

所有请求至少明确区分：

**SUCCESS**

用户获得真正支持的回答或相关内容。

**NEEDS_CLARIFICATION**

问题过于宽泛，系统协助用户明确方向。

**CAPABILITY_UNAVAILABLE**

相关服务目前不可用，解释能继续使用的替代功能。

**REQUEST_FAILED**

请求发生技术错误，给出明确可恢复操作。

这些可以作为内部语义分类，具体字段名应复用现有系统契约。

不能把错误改写成假成功。

### E3. 失败后保留用户工作

如果 Ask 请求失败：

- 保留用户输入。
- 不丢失已选主题。
- 不出现无限加载。
- 不制造重复提交。
- 不自动触发第二次付费调用。
- 提供重试或继续阅读的合理选择。
- 明确区分「当前服务异常」和「此功能尚未提供」。

### E4. 无模型降级能力

即使生成式 Ask 不可用，用户仍然应该可以：

- 浏览相关知识
- 打开已发布页面
- 选择问题方向
- 查找已索引内容
- 进入已验证方法页
- 查看现有免费报告入口
- 继续探索 World

降级不等于自动生成假答案。

---

## 7. Phase F — Connect the Existing PHI OS System

建立从生活问题进入现有系统的真实连接，而不是再制作一批展示卡片。

### F1. Books → Knowledge

用户选择议题时，显示与其相关的实际已发布知识内容。

链接必须可访问，标题必须来自真实内容。

保留中文及英文出版对应关系。

不得自动公开仍属私有的 PDF、未接受正文或未授权内容。

### F2. Profile & PHI Configuration

个人入口应解释：

- 用户能认识什么
- 需要输入什么
- 免费能看到什么
- 更深入的分析包含什么
- PHI Configuration 与其他个人方法的关系

不要将 PHI Configuration 简化成另一套占卜工具。

不要擅自改变其现有计算、术语或方法边界。

### F3. Eight Personal Methods

接入实际存在的方法入口，包括八字、紫微、占星、人类图、易经、塔罗及其他现有方法。

以仓库的真实方法清单为准，避免错误数量或重复。

每个入口必须对应真实可用功能或真实介绍页面。

免费图表与付费长文报告分清楚，不能在导航阶段自动触发付费生成。

### F4. World & Civilization Atlas

World 不应被缩减成一张装饰性世界地图。

应作为另一条独立但可关联的探索路径，连接：

- 地理与现实条件
- 人口与经济
- 资源与基础设施
- 制度与社会结构
- 已存在的文明图谱视觉资产
- 可确认来源的公共资料

只显示实际已接入并可核对的能力。

保留不同阅读尺度，不要因为首页重构而覆盖现有 World 设计。

### F5. Professional Services

按实际存在的服务和客户流程展示：

- Cash Flow
- Financial Planning
- Healing
- 其他已确认服务

入口必须说明适用场景、服务形式和下一步。

不可用的预约或支付能力不得伪装为可以完成交易。

---

## 8. Phase G — Five Mandatory Customer Journeys

这五项是本轮不可跳过的端到端验收。

### Journey 01 — 爱情

Input：`爱情`

Expected：

- 能识别为感情与关系主题。
- 展示可理解的进一步问题。
- 用户可以进入真实相关知识。
- 能继续探索方法或 Ask。
- 即使 provider 不可用，也不会走入死路。

### Journey 02 — 工作

Input：`工作`

Expected：

- 能区分职业方向、职场压力、工作与收入等子问题。
- 关联有实际依据的内容。
- 不强制推荐命理报告。
- 能进入可用的继续探索路径。

### Journey 03 — 钱不够用

Input：`钱不够用`

Expected：

- 识别日常财务压力与可能的预算问题。
- 优先连接合适的财务知识或已验证的准备工具。
- 不虚构个人财务评估。
- 不在未授权情况下读取账户或金融资料。
- 不向用户承诺收益或投资结果。

### Journey 04 — 马来西亚经济

Input：`马来西亚经济`

Expected：

- 识别为公共现实与经济问题。
- 优先连接 World 相关区域及可信来源。
- 不把历史资料冒充实时数据。
- 区分 GDP、价格、人口、政策等不同问题。
- 需要实时更新而缺少数据时，明确说明缺口。

### Journey 05 — 八字

Input：`八字`

Expected：

- 展示八字是什么、能探索什么。
- 进入实际 BaZi 方法页。
- 说明免费内容和付费内容区别。
- 不因为只是点击入口就触发生成费用。
- 不把未完成或未验证的报告能力写成已上线。

每个 Journey 必须在中文和英文界面各验证一次。

额外测试空白输入、超长输入、网络失败、重复点击和移动设备浏览。

---

## 9. Phase H — Bilingual & Accessibility Quality

### H1. 语言

中文界面：

- 导航、按钮、说明、错误信息完整中文化。
- 用户自由输入的英文及正式品牌名称可以原样保留。
- 不出现内部开发术语或未翻译的占位符。

英文界面：

- 完整自然英文。
- 不出现中文残留、中文错误提示或拼接语言。
- PHI OS 正式术语按已接受 Glossary 保留。

避免中文和英文语义不一致。

### H2. 手机实际体验

至少验证：

- iPhone 小屏
- 标准手机宽度
- 大屏手机
- 桌面

检查：

- 菜单打开与关闭
- 标题是否溢出
- 表单键盘遮挡
- 按钮点击区域
- 错误提示可读性
- 页面滚动
- 横向溢出
- 图像加载
- 字体与背景对比
- 真实链接和返回路径

不要只依赖静态截图。

### H3. Accessibility

满足现有设计系统的无障碍规范，重点检查：

- Keyboard navigation
- Focus visibility
- Accessible labels
- Appropriate heading structure
- Form error association
- Touch target size
- Screen reader announcements
- Reduced-motion preference

---

## 10. Phase I — Tests & Evidence

本轮不能只输出 `PASS`。

至少提供：

1. 根因复现证据。
2. 修复前后结果。
3. 五条客户旅程的真实测试。
4. 中文及英文截图。
5. 小屏和桌面截图。
6. 失败降级测试。
7. 原有 Ask 与 Intent router 回归。
8. 相关构建及测试结果。
9. 现有页面链接有效性。
10. 未解决的问题及其影响。

必须区分：

- IMPLEMENTED
- TESTED_LOCALLY
- VERIFIED_IN_PREVIEW
- VERIFIED_IN_PRODUCTION
- BLOCKED
- NOT_IMPLEMENTED

不得以 IMPLEMENTED 代替生产可用。

无法启动预览浏览器时，可以完成源码和测试审查，但不得宣称视觉或交互已验证。

保留原有历史失败，不为了让本轮通过而修改无关检查或加入宽泛豁免。

---

## 11. Deliverables — 无压缩、原地交付

所有成果在现有仓库内形成真实可维护的源文件。

建立或更新：

`docs/customer-entry/ENTRY-ASK-ROOT-CAUSE-R1.md`

`docs/customer-entry/CUSTOMER-JOURNEY-MATRIX-R1.md`

`docs/customer-entry/HOMEPAGE-UX-ACCEPTANCE-R1.md`

`docs/customer-entry/BILINGUAL-COPY-R1.md`

`docs/customer-entry/EXECUTION-STATE.md`

如仓库已有对应规范或目录，优先复用，避免重复权威文件。

同时完成实际需要的：

- 首页组件和样式
- 导航映射
- Ask 错误处理
- 中英文文案资源
- 回归测试
- Playwright 或现有端到端测试
- 审阅截图
- 可在本地访问的 Human Review 页面

不要生成 ZIP、delta ZIP 或脱离仓库的单独站点。

Human Review 必须读取本轮真实实现，而不是只展示一个与生产组件无关的概念 HTML。

---

## 12. Stop Conditions

以下情况需要停止相关破坏性或高风险操作：

- 需要生产 D1 写入或 schema migration。
- 需要扩大认证或计费权限。
- 需要开启真实付费 provider 调用。
- 涉及未批准的报告生成器变更。
- 需要修改或删除已批准的 R2 资产。
- 生产操作需要额外权限。
- 发现与其他工作窗口无法安全合并的冲突。
- 测试显示可能泄漏客户资料或私有知识。
- 发现修复会改变现有付费权益。

停止风险操作不意味着整个任务停止。

继续完成可安全实施的部分，并清楚列出 BLOCKED 项目。

---

## 13. Final Human Acceptance Gate

最终报告必须回答以下问题：

### A. 故障

用户输入「爱情」时为什么失败？

是否已找到真实原因？

本地是否修复？

线上是否已修复？

### B. 首页

首次访问者是否能够理解 PHI OS？

手机首屏是否真正容易使用？

抽象文案是否已替换？

### C. 导航

五个测试问题是否都能到达合理内容？

是否仍存在死路、假按钮或空页面？

### D. 资产利用

是否真正复用了八册、个人方法、World 和现有视觉资产？

哪些能力已有但尚未连接？

哪些能力实际不存在？

### E. 双语

中文和英文是否各自完整？

是否存在内部术语、混合语言和错误文案？

### F. 生产差距

当前本地、远程 main 与生产部署各是什么状态？

要让真实用户使用，还缺少什么？

哪些行动需要 Human Approval？

### G. 验收结果

只能在证据充分时报告：

`HUMAN_REVIEW_READY`

不能擅自写成：

`HUMAN_ACCEPTED`

也不能将预览测试成功写成生产已上线。

---

## 14. Execution Order

按以下顺序执行：

**A → B → C → D → E → F → G → H → I**

其中：

- A 必须先完成事实审计。
- B 完成文案候选并进入实际实现。
- C 和 D 建立可用的手机首页及问题导航。
- E 修复或明确隔离 Ask 故障。
- F 连接现有内容，不增加无意义新系统。
- G、H、I 完成客户体验与证据验收。

不要每完成一个小文件就暂停等待。

在安全权限内连续执行、验证及修复。

只有遇到真正需要授权的事项、不可安全处理的冲突，或必须由人决定的产品取舍时，才暂停相应部分。

## 15. Final Required Output

最后用中文输出：

1. 本轮实际修改文件。
2. 「爱情」故障的证实原因与解决状态。
3. 首页修改前后对比。
4. 五个真实问题的中英文验收结果。
5. 八册、个人方法、World 及服务的连接状态。
6. 测试通过、失败和未验证项目。
7. Human Review 的本地入口。
8. 生产上线前的剩余阻碍。
9. 是否触及费用、生产写入或现有工作区变更。
10. 明确给出下一步需要我批准的事项。

本轮交付标准不是更多技术文档，而是**可操作、可理解、有实际内容、具备明确失败恢复方式的 PHI OS 客户入口**。

Do not commit, push, deploy, migrate, charge, or publish without explicit approval.