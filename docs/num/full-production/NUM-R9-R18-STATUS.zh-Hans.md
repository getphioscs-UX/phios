# NUM-R9–R18｜Numerology Expansion Status

Baseline: `main@d576387f33e2a1ca76f196dba5059e15499d1b4d`

状态：`ENGINEERING_COMPLETE_HUMAN_ADMISSION_PENDING`

## 已完成

- NUM-R9：学习资料与既有 R8 Western/Pythagorean production authority 分离，登记为 `ENERGY_NUMEROLOGY_LEARNING_RECONSTRUCTED_V1`。
- NUM-R10：Missing / Repeated Digit structural runtime。缺失不等于缺陷，重复不等于身份。
- NUM-R11：CanonicalNumerologyIdentityInput + Expression / Soul Urge / Personality / Maturity calculation candidate。
- NUM-R12：Pinnacle / Challenge A–L 值公式以 8 个学习资料案例交叉验证。
- NUM-R13：21–40 / 41–60 / 61–80 三段边界恢复；三位数组合公式未能从现有资料唯一恢复，因此 calculation authority withheld。
- NUM-R14：147 / 258 / 369、13579 / 2468 以及五行数字组只开放 structural counting candidate；人格语义未准入。
- NUM-R15：Feb–May / Jun–Sep / Oct–Jan phase boundary 已恢复；flow-year / phase three-digit formula 未恢复，不制造数值。
- NUM-R16：关系结构可比较 shared / missing / asymmetric digits 与 element-group presence；合盘数公式未恢复，因此不计算兼容分数或关系结果。
- NUM-R17：Expansion Composition IR + semantic dedup 完成；R8 Personal Year/Month/Day 不与 alternative timing school 混合。
- NUM-R18：18-case Human Admission pack 已生成，当前 `0/18 PENDING`。

## Learning corpus defects explicitly preserved

学习资料中的姓名案例并非全部内部一致。至少两个 fixture 的总数与元音/辅音拆分出现算术冲突：

- `Teng Soon Wai`：总数 52 可复现，但学习资料写 26/26；按同页 1–9 字母映射计算为 27/25。
- `Lee Guat Ting/Gwen/Yue Ting`：总数 109 可复现，但学习资料写 44/65；按相同映射计算为 45/64。

系统不得为了“对齐例子”修改算法；不一致 subvalue 被排除为 formula authority evidence，并作为 R18 人审项目。

## Human gate

执行：

```bash
npm run check:num-r9-r18
```

应通过。

执行：

```bash
npm run check:num-r18:admission
```

在人审完成前应 fail closed：`NUM_R18_HUMAN_ADMISSION_PENDING`。

## Existing R8 production

R8 当前 production chain 继续有效，R9–R18 在 NUM-R18 批准前不改变默认客户页面。
