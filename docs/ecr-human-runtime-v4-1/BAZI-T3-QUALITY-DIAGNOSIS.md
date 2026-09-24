# BaZi T3 文字质量：当前实现审计

审计范围：当前仓库及已保存的 QA S02 调用证据。未把当前客户 PDF 或线上 Paid 页面当作已逐页核验的证据。本次没有调用模型、生成矩阵、改写 BaZi 方法或开启 Production T3。

## 结论

**T3 集成和真实调用已实现；整本报告的编辑质量与获准内容接入尚未完成。现有证据不支持“无法解决”，也不支持“全书已完成”。**

你提供的方法模块已存在。主要缺口在方法结果转成可供模型使用的解释材料，以及获准快照进入实际报告的链路。API key 已配置，并不表示每一页正在展示 T3。

## 已完成 / 未完成

| 项目 | 当前证据 |
| --- | --- |
| 真实 T3 调用、验证、有限修复、不可变快照 | 已实现；已保存 BASELINE_NOW S02 的真实 QA 调用证据 |
| S02 中文与英文人工接受 | 已记录你的明确 ACCEPT，绑定两份 snapshot / brief digest |
| S03 及后续章节逐章完成 | 尚未完成。你已经授权继续 S03，不应再把“等待 S03 启动许可”当作原因 |
| 八章 baseline 全部人工接受 | false |
| full matrix | false；按 Addendum F 暂停 |
| Paid Production T3 | false；代码明确禁止激活 |
| 当前客户所见每一页的 T2/T3 来源 | 本轮未取得该客户 PDF 的逐页运行证据，不能断言所有弱文字都来自 OpenAI |

## 为什么文字仍然弱

1. **方法含义在输入桥接处被压薄。** `bazi-explanatory-authority.js` 已消费 professionalTopics、tenGods、dayMasterStrength、relationships、pattern、wholeChartPriority、professionalTimeline 等模块，但主次主题常被压成“首先关注／相关主题／结构背景”的通用句。relationshipInterfaces 只取前两项。结构背景句能保证不越界，却没有充分保留各主题之间具体、可解释的差异。
2. **模型只能改写已获准的 claims。** T3 不允许创造因果、事件或现实效果。输入只有抽象主题与边界时，模型不能自行补出缺失的客户意义。仅换模型或继续全矩阵调用，无法保证修复这个上游缺口。
3. **篇幅预算进一步压缩内容。** 当前英文主文上限 230 单位、中文 420，单项上限 40 / 65。这是排版和生成约束，不应被误认为深度质量保证；应在检查实际 brief 与成文时评估是否挤掉必要解释。
4. **Paid 页面可能仍在展示回退文字。** 渲染只消费传入的获准快照，不自动生成八章。缺少快照时记录 `ACCEPTED_SNAPSHOT_REQUIRED`；页面预算不满足时记录 `COMPOSITION_BUDGET_REJECTED`。快照必须匹配该证据、章节、语言与版本，BASELINE_NOW S02 的接受不会自动覆盖任意客户命盘。
5. **机器 PASS 的范围有限。** 六项指标存在，但当前单章 `validateEditorialQuality` 的拒绝条件主要是技术密度、重复数字、模板句重复与边界密度；章节特异性是词项覆盖指标，跨章节相似度需要其他章节作为比较输入。本地机器 PASS 不证明解释已经充分、自然或具有出版质量。

## 可修复的下一步

先为实际 Paid PDF 逐页记录 section / locale / T2-or-T3 / snapshot digest / fallback reason。然后对同一章对照“专业方法结果 → licensed claims → SectionNarrativeBrief → 最终文字”，定位具体丢失的已获准含义，修复桥接与编辑取舍，而非另造方法规则。继续已获准启动的 S03，逐章人工接受；保留 Addendum F 的矩阵与 Production 边界。

## 仓库证据

- `config/reports/bazi-editorial-quality-acceptance.json`：仅 S02 两种语言 ACCEPT；全 baseline、矩阵、Production 均 false。
- `docs/guided-report-successor-r2/editorial-f/s02-live-evidence.json`：实际 S02 调用、候选与 digest。
- `docs/guided-report-successor-r2/editorial-f/STATUS.md`：真实调用和人工接受的阶段记录。
- `functions/personal-reading/narrative/bazi-explanatory-authority.js`：主题压缩、关系截取、许可操作边界。
- `functions/personal-reading/narrative/bazi-editorial-quality.js`：meaning canon / brief 与质量指标。
- `functions/personal-reading/narrative/bazi-t3-composition.js`：生成预算、快照验证、QA 与 Production 准入。
- `functions/personal-reading/bazi-section-publication.js`：快照消费和回退原因。
