# AST Full Production｜工程增量 01

基线：[2211d9b · ast](https://github.com/getphioscs-UX/phios/commit/2211d9bd1cdecb2d238f4c05d1f58345efd11804)。日期：2026-08-28。

本批交付实际代码、回归测试和新审阅案例，不再只是阶段计划。但 **AST Full Production 及专业平台水准尚未验收完成**：当前是已准入内容的传递修复，以及严格隔离的新组合候选。没有推送、部署或修改人工批准。

## 已完成的改变

| 问题 | 本批实现 | 权限状态 |
|---|---|---|
| 整宫旧检查误判当前 Placidus 默认 | 旧测试显式请求 Whole Sign；同时执行现有 Placidus reconciliation | 检查修复，不改变计算策略 |
| W2 检查把后来 main 的合法变更当成历史损坏 | 新 current checker 逐文件承接 64 项指纹；旧 checker、W0/W1/W2、07d 计划均保留 | 57 项历史未变、4 项 main 既有承接、3 项本批显式升级 |
| 建设性表现、摩擦、条件与不确定性在客户/R2 链丢失 | 新增版本化 interpretationDetail，经现有 adapter、Claim IR conditions 传至主题；复制上游字段，不新建意义 | 保留现有组合版本与准入；R2 客户切换仍未开启 |
| 只取前三个对象，星座层次不明确 | 显式候选 profile 逐一生成十二个行星/交点的功能×星座×宫位单元；缺少必要意义时省略并记录 | 新规则未准入，不影响默认生产路径 |
| 关联对象可能不是相位真正端点 | 每个已记录行星对只生成一条关系；核验两端、真实经度几何、偏差、容许度政策 | 不发明相位，不使用无关相位补位 |
| 合相被一概归为支持 | 候选政策将合相设为有条件关联；六合/三合、刑相/对分相分别保留差别 | 原创项目组合提案，待专家审阅 |
| 同一行星的其他线索没有保留 | 附带共享端点、关系类别不同的 balancingAspectRefs | 不把这些线索冒充现实反证或独立验证 |

十二个落位是十行星加真实南北交点；ASC 不是偷偷加入的第十三个已有意义。四轴已经计算，但四轴专属解释未在现有 41 条意义中准入。

现有 shared composition 仍是唯一组合 owner。新文件只是该 owner 的 AST strategy，不创建第二套计算、meaning、Claim IR、客户优先级或章节 renderer。SMR-R2 W3–W5 的权重、领域和去重政策未改。

## 可执行入口

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check:ast-full-production
npm run check:cx-r12r3b
npm run check:cx-r12r4b:smr
npm run check:cx-r12r4b:smr-r2-w0-w5
```

新 AST 检查已加入 `npm run check` 的主检查链。其名称覆盖“通往 Full Production 的工程检查”，PASS 不表示人工准入或上线成功。

新候选通过原有入口显式调用：

```js
await createMethodInterpretationCandidate({
  input,
  meaningPayload,
  compositionVersion: 'AST-FP-COMPOSITION-CANDIDATE-v1.0.0'
});
```

默认参数仍使用 `CX-R12R3B-COMPOSITION-RULES-v1.0.0`。新 profile 不接受 inline humanReview，也不能通过旧 admission resolver 或旧 promote 函数变为客户报告。将来需要真正的版本化准入 successor，不能只把布尔值改为 true。

## 统一验证结果

| 检查 | 结果 |
|---|---|
| AST production 历史兼容＋当前宫制 | PASS |
| AST current baseline / 五来源 25 卡完整性 | PASS；23 份研究/计划文件保持原字节语义 |
| 已准入字段保真与现有 IR schema | PASS；16 组原版 digest 向量、48 个已准入单元、46 次主题字段传递 |
| 新 AST 候选 | PASS；8 组独立合成出生输入、16 个宫制投射、32 个双语候选 |
| 不完整输入 | PASS；近似时间、缺坐标、极地 Placidus 均不补造宫位；缺失时间及冲突时间输入保持 BLOCKED_INPUT |
| 错误结构与准入边界 | PASS；21 种坏结构拒绝，另含无相位、孤立对象、星座边界、缺意义、错误 locale、陈旧投射引用、伪造 inline review 等测试 |
| 可复现的新审阅包 | PASS；8 个出生输入 × 双语 = 16 个审阅面，0 accepted / 16 pending |
| 共享解释层 | PASS |
| SMR 历史机器 campaign | PASS 64/64；原有人工 0 accepted / 48 pending 未变 |
| SMR-R2 W0–W5 | PASS，含 AST/BZR/ZWR/NUM/ECR |
| 整库 `npm run check` | **未通过**：precheck 中 PJA-W2E 安全文档 fixture 清理触发 EACCES，退出 1；后续主链未跑完 |
| 修改文件 whitespace 检查 | PASS |

上面的 48 个“字段保真单元”不是旧 48-case 人工批准，也不是 48 个独立星盘。新 32 个机器候选同样不能说成 32 个独立出生盘。

原版 digest 向量是执行与 2211d9b Git blob 一致的旧 shared runtime 得到的，并非用新结果回填旧预期。测试只固定执行时间元数据以排除时钟造成的 bundle digest 变化；生产时间行为未改。真实计算调用现有 Astronomy Engine 2.1.19，但这些测试不构成独立天文历表精度认证。

整库权限失败发生在 PJA 安全 fixture 的清理过程。本批没有改权限、强制删除保护目录、修改该测试或绕过它。需在有正常权限的本地/CI 环境重跑；即使本批所有专项 PASS，也不能声称整库全绿。

## 和专业平台目标的距离

[Astrodienst 的心理报告介绍](https://www.astro.com/prod/pr_ph_e.htm)强调多层面人格主题、关系模式及发展方向；[TimePassages 功能页](https://astrograph.com/timepassages/features)列出了逐行星/相位及整盘解读。本批据此将“关系、综合、可读性和审阅”作为验收维度，而不是按页数定义专业能力。平台网页仅作能力比较，不是 PHI OS 的意义授权或文本来源。

目前新样例每盘有 20–34 个可追溯单元，但仍不足以证明专业水准：

- 全盘主轴、矛盾整合与有依据的取舍尚未形成经审生产规则；“覆盖所有对象”不是“理解了整张盘”。
- 元素/模式权重、守护链、图形、四轴专属含义仍未准入；不把缺失项写成默认结论。
- 新关系措辞和中英文消费端语言需专家逐项审阅；已有 canonical 定义仍含内部术语。
- R2 的客户意图排序与新候选尚不能在生产中连通，因为新候选未获准入。候选并未被伪装成 AcceptedMethodReadingEnvelope。
- 独立 ASTT 现有时机能力保持原样；本批未增加推运、返照、合盘或新的预测权限。

## 阶段停点

| 原计划阶段 | 本批真实状态 |
|---|---|
| P01 检查承接 | AST 专项完成；整库权限阻断未解除 |
| P02 五来源用途与专家审阅 | 仍待实际负责人/审阅者决策；5 本来源、25 卡没有新增批准 |
| P03/P04 意义覆盖与高阶上游 | 本批只使用现有意义；高阶范围未完成 |
| P05 关系组合 | 工程候选完成；不是生产准入完成 |
| P06 全盘综合 | 仅补全证据覆盖和关系交叉引用；综合解释未完成 |
| P07 字段保真 | 工程完成，复用既有准入内容 |
| P08 报告接入 | 现有 R2 字段传递完成；新候选未客户切换 |
| P09 机器回归 | 本批范围 PASS；不覆盖所有未来能力 |
| P10 人工验收 | 新审阅材料已生成，16 个审阅面全部 PENDING |
| P11 发布与现场验证 | 未执行 |

这是一份显式工程 successor，不改写上一批“未执行”的历史计划。来源相关的顺序门槛没有被工程样例替代。

## 下一步需要的输入

1. 项目负责人确认五本来源各自的允许用途依据，以及负责专业内容和中英文表达的实际审阅者。
2. 先审新两条组合规则、五种相位措辞，以及样例是否仍是术语拼接；对准确 digest 留下修订/拒绝/接受意见。
3. 由既有 owner 继续补全全盘综合与高阶范围，再接入 R2，生成新版本客户验收集。
4. 在正常权限 CI 跑完整主链；完成新的人工准入后再安排受授权的部署、现场 smoke 与回退验证。

## 合入说明

增量包以仓库根目录为根，包含本批新增文件及七个已有文件的修改，不包含 node_modules、原书 PDF/OCR、临时安全 fixture 或完整仓库。以 2211d9b 为应用基线；若 main 已有新改动，请逐文件合并，不覆盖别的线程变更。包内 delivery manifest 提供逐文件 SHA-256。

没有删除既有材料；旧 W0/W1/W2、五书来源身份、旧 24-case 准入、旧 48-case 人工结果、其他方法生产权威和 ASTT 文件均保留。
