# CX-R12R4B-SMR：W0＋W1 检查点

基线：abab6b358bff574c65b9dfacc7985d5de564d674（BAZI-FP-W0-W4）。本包只新增研究/检查文件，不覆盖任何原有代码、package.json、BaZi内容或生产准入。

## 已完成与未完成

W0：当前AST/SMR权威审计，64个相关原有文件哈希冻结，9项发现，48例正文深度统计。

W1：五本Drive PDF重新下载并校验SHA-256，五个版权页视觉复核，作者/译者/版本/ISBN/页数及来源登记完成。

W2：此检查点尚未交付；后续每本一个独立增量包，不能把之前丢失的152页OCR算成本包成果。W3不在授权范围。

## W0：为什么48例显得薄

| 方法（中文） | 单元 | 段落 | 唯一段落 | 最大重复 | 正文种类/意图数 |
|---|---:|---:|---:|---:|---:|
| AST | 3 | 32 | 16 | 5 | 1/6 |
| BZR | 4 | 46 | 20 | 7 | 1/6 |
| NUM | 5 | 44 | 18 | 8 | 1/6 |
| ZWR | 3 | 37 | 16 | 7 | 1/6 |

统计只看有序section paragraph正文，排除ID/标题/意图元数据；不是语义相似度分数，也不自动判人工拒绝。六种意图的正文相同，且测试使用每方法缓存的合成投射，不能把变体数当独立盘数。

关键问题包括：AST最多3项候选；已准入建设性/压力/不确定性字段在传递中丢失；章节复用同一文字；具体性标签不保证具体内容；星座表达检查缺位；相位无关联时存在回退风险。补书不能替代后续对这些链路的修正。

保留 canonical projection → meaning mapping/bundle → admitted composition → accepted customer result → SMR 的唯一权威链。当前AST41映射是10行星、12星座、12宫位、5相位、2节点，不代表元素聚合、图形、守护、ASC专用意义已准入。

## W1：来源登记

| ID | 书 | 本版 | ISBN | PDF页数 | 版权PDF页 |
|---|---|---|---|---:|---:|
| AST-S01 | 当代占星研究 | 2010-08，第1版第1次印刷 | 9787222067158 | 409 | 3 |
| AST-S02 | 内在的天空：占星学入门 | 2012-03，第1版第1次印刷 | 9787222088849 | 353 | 3 |
| AST-S03 | 占星圖形相位全書 | 2018-11-01，初版 | 9789579439473 | 548 | 547 |
| AST-S04 | 內行星：從水星、金星、火星看內在真實 | 2019-03，初版一刷 | 9789863571469 | 401 | 400 |
| AST-S05 | 生命四元素：占星与心理学 | 2008-11，第1版第1次印刷 | 9787222056367 | 223 | 3 |

所有书均为 EXTERNAL_REFERENCE_MANUSCRIPT / RESEARCH_REGISTERED。版权页存在不等于获得出版、再分发或生产使用许可；rights状态为NOT_ESTABLISHED，productionAdmitted=false。不改变PHI OS Book1/2完成稿登记，不上传原书或OCR全文。内行星按版权页登记两位作者。

## 使用

将ZIP内相对路径文件加入abab6b3仓库；本包没有应覆盖的旧文件。运行：

```sh
node scripts/check-cx-smr-enrichment-w01.mjs
node scripts/audit-cx-smr-enrichment-depth.mjs
npm run check:cx-r12r4b:smr
npm run check:bazi-fp-w0-w4
```

原有文件变更会让历史基线校验失败；应另建新版本审计，不倒改此检查点。完整npm run check并非本包通过声明，实际执行结果另见验证记录。

下一步按AST-S01→S05逐本交付页码概念卡。每卡明确原书观点、项目改写建议、所需权威和禁止推断；专家审阅待办，不把占星理论当科学验证。当前SMR：0接受、0拒绝、48待审；productionAllowed=false，customerCutoverAllowed=false。
