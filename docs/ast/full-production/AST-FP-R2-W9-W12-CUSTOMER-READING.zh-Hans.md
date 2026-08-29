# AST-FP｜R2-W9～W12 Customer Reading Engineering

基线：`a30a38d45a273fa0de603dcb9da827bf4c4ca307`。

本轮不修改 shared SMR v2 的 live cutover；建立 AST 专属的 customer-reading successor engineering IR，供 R2-W13 使用。

## R2-W9

固定唯一顺序：`OVERVIEW → CORE_THEMES → SUPPORT_TENSION → INTENT → TIMING → DEEP_DIVE → TECHNICAL`。每个 section 只有一个 purpose。`TIMING` 在没有独立受管 AST temporal authority 时必须 fail closed。

## R2-W10

完整解释只能由 `narrativeRef + renderOwnerId` 的唯一 owner 持有。Overview 与 Core Themes 是完整正文 owner；Support/Tension、Intent、Deep Dive 与 Technical 只能引用、摘要或展示结构事实。Exact 与 normalized full-text duplicate gate 均为 `0`。

## R2-W11

Desktop 内容上限 920px、正文 72ch、主题卡最小 260px；首屏最多 6 blocks / 3 themes。Mobile 单栏、禁止横向溢出；Print 使用同一 IA，主题卡避免跨页拆分。Technical 默认折叠。

## R2-W12

客户标题从 ontology 风格转换为读者语言。`Grand Cross / T-Square / applying / separating / raw body codes / authority refs` 等技术词保留在 Deep Dive / Technical；主阅读只显示经 R4A 21/21 人工准入语义和 R5 结构事实的 editorial transformation。Renderer 不得创造新含义。

## 当前边界

R4A 已 21/21 human admitted；R5 whole-chart engineering 可消费这些语义。但 R5 最终客户报告尚未进行 digest-bound human acceptance，因此本轮 `customerPublicationAllowed=false`、`customerCutoverAllowed=false`。R2-W13 才负责真实 customer surface cutover。
