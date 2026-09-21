PHI OS｜GUIDED REPORT SUCCESSOR R2 — ADDENDUM B
BAZI SECTION REGISTRY + PAGE FAMILY MAPPING
Codex 可执行配置蓝图
0｜执行目标

请基于现有 GUIDED_REPORT_SUCCESSOR_R2 与 ADDENDUM A｜BOOK-LIKE LAYOUT SYSTEM，为 BaZi Full Report 建立一套 section-aware、page-family-aware、LLM-composition-aware 的正式配置蓝图，并据此实现：

BaZi 报告从固定 26 页线性模式升级为 可变页数的 section-based 报告
每个 major section 进入前先有一页 SECTION_OPENER_PAGE
正文页根据内容类型映射到不同 pageFamily
LLM Composer 以 section 为单位生成内容，再拆分页
P01–P06 保留现有 approved 高视觉质量页面，不重做
P07+ 使用统一 report shell、统一 pagination、统一 typography、统一 visual skin
默认时间为 NOW
HTML review 与 PDF export 使用同一 semantic source
1｜BaZi 报告的 canonical section 架构
1.1 Front Matter
FM01 Cover
FM02 Personal Info
FM03 Contents
FM04 How to Read This Report
1.2 Body Sections
S01 命盘总览 / Chart Overview
S02 核心性格 / Core Personality
S03 人生格局 / Life Structure
S04 事业发展 / Career Development
S05 财富运势 / Wealth Outlook
S06 感情婚姻 / Relationships & Marriage
S07 健康养生 / Health & Wellbeing
S08 时间结构 / Timing & Cycles
S09 人生建议 / Guidance & Recommendations
S10 方法与附录 / Method & Appendix
1.3 Back Matter
BM01 Closing / Summary Closure

注：S10 已可吸收大部分 appendix / boundary / notes 内容，因此 BM01 可以很轻，甚至在内容不足时省略。

2｜P01–P06 冻结映射

这一部分继续沿用前面已经冻结的要求。

P01 = Cover
P02 = Personal Info / Intro existing approved page
P03 = Contents existing approved page
P04 = Overview / Intro existing approved page
P05 = How to read existing approved page
P06 = Final approved intro bridge / existing approved page
强制规则
不重做
不重新发明 page family
只做 binding / ordering / locale selection / pagination metadata governance
如果现有 method 的 P02–P06 是多语种变体，继续调用 approved variants
3｜P07+ 的 section-based 逻辑起点

从 P07 开始，进入新的 section-aware 报告系统。

也就是说：

P01–P06 = Existing approved front matter
P07+     = New successor runtime
4｜BaZi page family 定义

Codex 必须支持以下 page family。

4.1 SECTION_OPENER_PAGE

用途：

每个 section 入口
大号章节编号
中英标题
简短导语
主题视觉页

结构：

section number
section title zh/en
short intro
hero visual
subtle motif
page number

执行类：

T1 + T2
4.2 STRUCTURED_ANALYSIS_PAGE

用途：

四柱结构
五行结构
chart summary
key signals
timing matrix

结构：

title
optional lead
visual/chart/table
structured facts
short explanation
boundary note

执行类：

T0 + T1 + T2
4.3 NARRATIVE_ANALYSIS_PAGE

用途：

personality reading
career reading
wealth reading
relationship reading
wellness reading
integrated guidance

结构：

title
intro paragraph
main interpretation
sub insights
practical reflection
boundary / counter-signal

执行类：

T2 + T3
4.4 INSIGHT_LIST_PAGE

用途：

strengths
challenges
opportunities
watch-outs
practical advice

结构：

title
3–6 insight items
optional icons
optional side illustration
short closing insight

执行类：

T1 + T2 + optional T3
4.5 TIMING_PAGE

用途：

当前时间层
current Da Yun / year context
current themes
timing observations

结构：

title
resolved temporal context
timing structure
timing narrative
observation prompts
boundary

执行类：

T0 + T1 + T2 + optional T3
4.6 METHOD_APPENDIX_PAGE

用途：

methodology
boundaries
how to use the report
glossary / appendix

结构：

title
method explanation
interpretive scope
limitations / boundaries
reader guidance

执行类：

T1 + T2
4.7 SUMMARY_PAGE

用途：

integrated guidance
next steps
report closure

结构：

title
summary narrative
3–5 integrated takeaways
next-step prompts
optional closing quote

执行类：

T2 + T3
5｜BaZi section registry（正式配置）

下面是推荐给 Codex 的 section registry。

5.1 S01｜命盘总览 / Chart Overview
目标

建立全书起点，让客户先理解：

这张八字命盘是什么
结构上看见了什么
接下来整本报告如何展开
页面组成
1. SECTION_OPENER_PAGE
2. STRUCTURED_ANALYSIS_PAGE
3. INSIGHT_LIST_PAGE
页面建议
S01-P1
family: SECTION_OPENER_PAGE
title: 01 命盘总览 / Chart Overview
visual: VIS-REPORT-BAZI-SEC-01-OVERVIEW
composition: short intro
executionClass: T2
S01-P2
family: STRUCTURED_ANALYSIS_PAGE
title: 你的八字命盘 / Your Bazi Chart
content:
四柱
日主
五行结构
基本图表
executionClass: T0 + T1 + T2
S01-P3
family: INSIGHT_LIST_PAGE
title: 命盘重点摘要 / Key Insights
content:
日主特质
主要五行倾向
chart structure note
整体观察
executionClass: T1 + T2
5.2 S02｜核心性格 / Core Personality
目标

把命盘中的人格核心、优势、挑战解释成客户能理解的语言。

页面组成
1. SECTION_OPENER_PAGE
2. NARRATIVE_ANALYSIS_PAGE
3. INSIGHT_LIST_PAGE
页面建议
S02-P1
family: SECTION_OPENER_PAGE
title: 02 核心性格 / Core Personality
visual: VIS-REPORT-BAZI-SEC-02-PERSONALITY
executionClass: T2
S02-P2
family: NARRATIVE_ANALYSIS_PAGE
title: 性格特质分析 / Personality Analysis
content:
核心性格逻辑
表现方式
自然倾向
在何种情境下更明显
executionClass: T3
S02-P3
family: INSIGHT_LIST_PAGE
title: 优势与挑战 / Strengths & Challenges
content:
strengths
challenges
inner drive
social style
executionClass: T2 + T3
5.3 S03｜人生格局 / Life Structure
目标

解释命格、结构层、用神/资源支持、整体人生运行方式。

页面组成
1. SECTION_OPENER_PAGE
2. STRUCTURED_ANALYSIS_PAGE
3. STRUCTURED_ANALYSIS_PAGE or NARRATIVE_ANALYSIS_PAGE
页面建议
S03-P1
family: SECTION_OPENER_PAGE
title: 03 人生格局 / Life Structure
visual: VIS-REPORT-BAZI-SEC-03-LIFE-STRUCTURE
executionClass: T2
S03-P2
family: STRUCTURED_ANALYSIS_PAGE
title: 命格与格局 / Chart Structure
content:
chart type
overall level / structure status
useful elements
potential direction
executionClass: T0 + T1 + T2
S03-P3
family: NARRATIVE_ANALYSIS_PAGE
title: 结构如何影响人生节奏 / How Structure Shapes Life Pattern
content:
什么支持你
什么消耗你
哪些条件更关键
executionClass: T3
5.4 S04｜事业发展 / Career Development
目标

把事业、角色、责任、工作环境、发展节奏解释清楚。

页面组成
1. SECTION_OPENER_PAGE
2. NARRATIVE_ANALYSIS_PAGE
3. INSIGHT_LIST_PAGE
4. optional TIMING_PAGE
页面建议
S04-P1
family: SECTION_OPENER_PAGE
title: 04 事业发展 / Career Development
visual: VIS-REPORT-BAZI-SEC-04-CAREER
executionClass: T2
S04-P2
family: NARRATIVE_ANALYSIS_PAGE
title: 事业运势分析 / Career Outlook
content:
事业主题
适合的工作方式
角色类型
发展逻辑
executionClass: T3
S04-P3
family: INSIGHT_LIST_PAGE
title: 适合领域与注意事项 / Suitable Fields & Considerations
content:
suitable fields
key strengths
watch-outs
work pattern advice
executionClass: T2 + T3
S04-P4（可选）
family: TIMING_PAGE
title: 事业关键时间点 / Career Timing
condition:
仅当 timing engine 允许形成有意义输出时启用
executionClass: T2 + T3
5.5 S05｜财富运势 / Wealth Outlook
目标

解释资源模式、财富逻辑、金钱流动、风险与机会。

页面组成
1. SECTION_OPENER_PAGE
2. NARRATIVE_ANALYSIS_PAGE
3. INSIGHT_LIST_PAGE
页面建议
S05-P1
family: SECTION_OPENER_PAGE
title: 05 财富运势 / Wealth Outlook
visual: VIS-REPORT-BAZI-SEC-05-WEALTH
executionClass: T2
S05-P2
family: NARRATIVE_ANALYSIS_PAGE
title: 财富分析 / Wealth Analysis
content:
财富进入方式
money pattern
resource exchange
现实风险
executionClass: T3
S05-P3
family: INSIGHT_LIST_PAGE
title: 财富机会与理财建议 / Opportunities & Financial Guidance
content:
regular wealth
windfall potential
financial advice
key age bands / timing note
executionClass: T2 + T3
5.6 S06｜感情婚姻 / Relationships & Marriage
目标

解释关系模式、互动风格、感情注意点、相处建议。

页面组成
1. SECTION_OPENER_PAGE
2. NARRATIVE_ANALYSIS_PAGE
3. INSIGHT_LIST_PAGE
页面建议
S06-P1
family: SECTION_OPENER_PAGE
title: 06 感情婚姻 / Relationships & Marriage
visual: VIS-REPORT-BAZI-SEC-06-RELATIONSHIP
executionClass: T2
S06-P2
family: NARRATIVE_ANALYSIS_PAGE
title: 感情模式分析 / Relationship Patterns
content:
情感表达方式
关系中的角色
容易重复的互动模式
executionClass: T3
S06-P3
family: INSIGHT_LIST_PAGE
title: 相处建议与婚姻提示 / Relationship Advice
content:
love traits
ideal partner dynamic
relational advice
favourable period note
executionClass: T2 + T3
5.7 S07｜健康养生 / Health & Wellbeing
目标

解释身心能量、生活习惯建议、长期养护方向。

页面组成
1. SECTION_OPENER_PAGE
2. NARRATIVE_ANALYSIS_PAGE
3. INSIGHT_LIST_PAGE
页面建议
S07-P1
family: SECTION_OPENER_PAGE
title: 07 健康养生 / Health & Wellbeing
visual: VIS-REPORT-BAZI-SEC-07-HEALTH
executionClass: T2
S07-P2
family: NARRATIVE_ANALYSIS_PAGE
title: 健康趋势 / Health Analysis
content:
身体倾向
情绪压力
生活节奏提醒
executionClass: T3
S07-P3
family: INSIGHT_LIST_PAGE
title: 养生建议 / Wellness Advice
content:
possible areas to mind
preventive suggestions
lifestyle balancing tips
executionClass: T2 + T3
5.8 S08｜时间结构 / Timing & Cycles
目标

把默认 NOW 模式真正用起来，输出当前周期、当前年、当前观察重点。

页面组成
1. SECTION_OPENER_PAGE
2. TIMING_PAGE
3. TIMING_PAGE
页面建议
S08-P1
family: SECTION_OPENER_PAGE
title: 08 时间结构 / Timing & Cycles
visual: VIS-REPORT-BAZI-SEC-08-TIMING
executionClass: T2
S08-P2
family: TIMING_PAGE
title: 当前时间层 / Current Timing
content:
reportGeneratedAt
timezone
current Da Yun
current year
current emphasis
executionClass: T0 + T1 + T2
S08-P3
family: TIMING_PAGE
title: 当前流年观察 / Current-Year Insights
content:
current themes
opportunities
caution
observation prompts
executionClass: T2 + T3

如果系统支持 custom time，则本 section 继续适配，但 NOW 是默认入口。

5.9 S09｜人生建议 / Guidance & Recommendations
目标

整合前面各 section，形成更完整的人生建议，不是机械总结。

页面组成
1. SECTION_OPENER_PAGE
2. SUMMARY_PAGE
3. INSIGHT_LIST_PAGE
页面建议
S09-P1
family: SECTION_OPENER_PAGE
title: 09 人生建议 / Guidance & Recommendations
visual: VIS-REPORT-BAZI-SEC-09-GUIDANCE
executionClass: T2
S09-P2
family: SUMMARY_PAGE
title: 综合建议 / Integrated Guidance
content:
综合解读
关键主题
你的人生节奏如何更顺
executionClass: T3
S09-P3
family: INSIGHT_LIST_PAGE
title: 下一步建议 / Next Steps
content:
reflect
act
review
adjust
executionClass: T2 + T3
5.10 S10｜方法与附录 / Method & Appendix
目标

解释方法、边界、如何正确使用这份报告，同时保持客户可读性。

页面组成
1. SECTION_OPENER_PAGE
2. METHOD_APPENDIX_PAGE
3. METHOD_APPENDIX_PAGE
页面建议
S10-P1
family: SECTION_OPENER_PAGE
title: 10 方法与附录 / Method & Appendix
visual: VIS-REPORT-BAZI-SEC-10-APPENDIX
executionClass: T2
S10-P2
family: METHOD_APPENDIX_PAGE
title: 如何理解这份报告 / How to Read This Report
content:
方法作用
不是什么
如何在现实中使用
executionClass: T2
S10-P3
family: METHOD_APPENDIX_PAGE
title: 分析方法 / Methodology
content:
八字基础
interpretation approach
boundary and notes
executionClass: T1 + T2
6｜建议总页数（BaZi reference implementation）

这是推荐的 reference implementation，不是固定死。

方案 A｜标准版
P01–P06 Existing Front Matter = 6
S01 = 3
S02 = 3
S03 = 3
S04 = 3
S05 = 3
S06 = 3
S07 = 3
S08 = 3
S09 = 3
S10 = 3

Total = 33 pages
方案 B｜较精简版

可将部分 section 压缩为 opener + 1 body page：

6 + 24 = 30 pages左右
方案 C｜按内容自适应
28–36 pages
正式要求
不固定 26
允许不同 method 页数不同
允许同一个 method 因数据充分度略有不同
但 section 结构必须完整
7｜BaZi section registry 的 JSON 配置建议

下面是 Codex 可以直接落地成配置文件的形式。

建议文件：

config/reports/bazi-section-registry.json

示例：

{
  "reportType": "BAZI_FULL_REPORT",
  "version": "GUIDED_REPORT_SUCCESSOR_R2",
  "frontMatter": [
    { "key": "FM01", "binding": "existing_p01_cover", "fixed": true },
    { "key": "FM02", "binding": "existing_p02_info", "fixed": true },
    { "key": "FM03", "binding": "existing_p03_contents", "fixed": true },
    { "key": "FM04", "binding": "existing_p04_intro", "fixed": true },
    { "key": "FM05", "binding": "existing_p05_how_to_read", "fixed": true },
    { "key": "FM06", "binding": "existing_p06_intro_bridge", "fixed": true }
  ],
  "sections": [
    {
      "key": "S01_OVERVIEW",
      "number": "01",
      "title": { "zh-Hans": "命盘总览", "en": "Chart Overview" },
      "enabled": true,
      "pages": [
        {
          "key": "S01_P1",
          "family": "SECTION_OPENER_PAGE",
          "executionClass": "T2",
          "visualAsset": "VIS-REPORT-BAZI-SEC-01-OVERVIEW"
        },
        {
          "key": "S01_P2",
          "family": "STRUCTURED_ANALYSIS_PAGE",
          "executionClass": "T0_T1_T2",
          "dataModules": ["baziChart", "dayMaster", "fiveElements"]
        },
        {
          "key": "S01_P3",
          "family": "INSIGHT_LIST_PAGE",
          "executionClass": "T1_T2",
          "dataModules": ["chartHighlights"]
        }
      ]
    },
    {
      "key": "S02_PERSONALITY",
      "number": "02",
      "title": { "zh-Hans": "核心性格", "en": "Core Personality" },
      "enabled": true,
      "pages": [
        {
          "key": "S02_P1",
          "family": "SECTION_OPENER_PAGE",
          "executionClass": "T2",
          "visualAsset": "VIS-REPORT-BAZI-SEC-02-PERSONALITY"
        },
        {
          "key": "S02_P2",
          "family": "NARRATIVE_ANALYSIS_PAGE",
          "executionClass": "T3",
          "dataModules": ["personalityNarrative"]
        },
        {
          "key": "S02_P3",
          "family": "INSIGHT_LIST_PAGE",
          "executionClass": "T2_T3",
          "dataModules": ["strengths", "challenges", "socialStyle"]
        }
      ]
    }
  ],
  "backMatter": [
    {
      "key": "BM01",
      "family": "SUMMARY_PAGE",
      "enabled": false
    }
  ]
}
8｜page family 与 data modules 的映射

Codex 不应在每页内写死内容来源，而应由 dataModules 组合内容。

推荐 data modules
baziChart
dayMaster
fiveElements
chartHighlights
personalityNarrative
strengths
challenges
socialStyle
chartStructure
usefulElements
careerNarrative
careerFields
wealthNarrative
financialAdvice
relationshipNarrative
relationshipAdvice
healthNarrative
wellnessAdvice
timingContext
currentYearInsight
integratedGuidance
nextSteps
methodology
boundaries
9｜LLM Composer 的 section 级输入 contract

Codex 必须让 LLM Composer 吃的不是“单页 prompt”，而是 section composition object。

建议文件逻辑：

runtime/report-composition/build-bazi-section-composition.ts

每个 section 输出：

{
  "sectionKey": "S04_CAREER",
  "title": {
    "zh-Hans": "事业发展",
    "en": "Career Development"
  },
  "openerIntro": "...",
  "keyThemes": ["...", "..."],
  "pageBlocks": [
    {
      "pageFamily": "NARRATIVE_ANALYSIS_PAGE",
      "title": "...",
      "contentBlocks": [...]
    },
    {
      "pageFamily": "INSIGHT_LIST_PAGE",
      "title": "...",
      "contentBlocks": [...]
    }
  ],
  "boundaryNotes": ["..."],
  "practicalObservations": ["..."]
}
10｜各 page family 的 composition budget
SECTION_OPENER_PAGE
zh: 50–110 字
en: 40–90 words
STRUCTURED_ANALYSIS_PAGE
title + short lead + 2–4 fact blocks + 1 short explanation
zh main explainer: 60–160 字
en main explainer: 40–120 words
NARRATIVE_ANALYSIS_PAGE
zh: 180–360 字
en: 130–260 words
INSIGHT_LIST_PAGE
3–6 items
zh each: 18–60 字
en each: 12–40 words
TIMING_PAGE
1 structured timing module + 1 narrative block + 2–4 observation prompts
METHOD_APPENDIX_PAGE
zh: 120–240 字
en: 90–180 words
SUMMARY_PAGE
1 integrated narrative + 3–5 takeaways
11｜时间 section 的正式规则

BaZi timing section 必须遵守：

默认
targetTimeMode = NOW
输入来源
customer timezone
or resolved timezone
report generated time
current supported time layers
不得再出现默认空白状态

例如：

未选择目标时间
当前周期不可用
所选流年不可用
正确替代
当前时间层已解析
当前周期重点
当前观察窗口
当前年提示
值得留意的现实信号
12｜visual asset binding 蓝图

建议配置文件：

config/reports/bazi-visual-assets.json

示例：

{
  "method": "BAZI",
  "global": {
    "bodyBackground": "VIS-REPORT-BAZI-BODY",
    "motifLayer": "VIS-REPORT-BAZI-MOTIF",
    "sectionStyle": "VIS-REPORT-BAZI-SECTION-STYLE"
  },
  "sections": {
    "S01_OVERVIEW": "VIS-REPORT-BAZI-SEC-01-OVERVIEW",
    "S02_PERSONALITY": "VIS-REPORT-BAZI-SEC-02-PERSONALITY",
    "S03_LIFE_STRUCTURE": "VIS-REPORT-BAZI-SEC-03-LIFE-STRUCTURE",
    "S04_CAREER": "VIS-REPORT-BAZI-SEC-04-CAREER",
    "S05_WEALTH": "VIS-REPORT-BAZI-SEC-05-WEALTH",
    "S06_RELATIONSHIP": "VIS-REPORT-BAZI-SEC-06-RELATIONSHIP",
    "S07_HEALTH": "VIS-REPORT-BAZI-SEC-07-HEALTH",
    "S08_TIMING": "VIS-REPORT-BAZI-SEC-08-TIMING",
    "S09_GUIDANCE": "VIS-REPORT-BAZI-SEC-09-GUIDANCE",
    "S10_APPENDIX": "VIS-REPORT-BAZI-SEC-10-APPENDIX"
  }
}
13｜最低可运行资产集

如果你还没准备齐所有图，Codex 也必须先能跑。

Minimum viable visual assets
VIS-REPORT-BAZI-BODY
VIS-REPORT-BAZI-MOTIF
VIS-REPORT-BAZI-SECTION-STYLE
Optional first batch
VIS-REPORT-BAZI-SEC-01-OVERVIEW
VIS-REPORT-BAZI-SEC-02-PERSONALITY
VIS-REPORT-BAZI-SEC-04-CAREER
VIS-REPORT-BAZI-SEC-05-WEALTH
VIS-REPORT-BAZI-SEC-06-RELATIONSHIP

没有 section visual 时：

使用 SECTION-STYLE + BODY + MOTIF fallback
不可出现 broken image / empty slot
14｜渲染顺序蓝图

Codex 的正式渲染顺序应该是：

1. Load report registry
2. Bind fixed front matter P01–P06
3. Resolve enabled sections
4. Build section composition objects
5. Expand section pages by pageFamily
6. Bind visual assets
7. Render semantic page blocks
8. Paginate globally
9. Generate HTML review
10. Generate PDF export
11. Run checkers
15｜建议实现文件结构

下面是建议给 Codex 的文件组织方向。

config/
  reports/
    bazi-section-registry.json
    bazi-visual-assets.json
    report-page-families.json

src/
  report-runtime/
    section-engine/
      build-section-registry.ts
      expand-section-pages.ts
      resolve-bazi-sections.ts
    composition/
      build-bazi-section-composition.ts
      compose-section-opener.ts
      compose-structured-analysis.ts
      compose-narrative-analysis.ts
      compose-insight-list.ts
      compose-timing-page.ts
      compose-method-appendix.ts
      compose-summary-page.ts
    render/
      render-report-shell.ts
      render-page-family.ts
      render-section-opener-page.ts
      render-structured-analysis-page.ts
      render-narrative-analysis-page.ts
      render-insight-list-page.ts
      render-timing-page.ts
      render-method-appendix-page.ts
      render-summary-page.ts
    assets/
      bind-method-visual-assets.ts
    pagination/
      build-global-pagination.ts

scripts/
  check-report-section-registry.mjs
  check-report-page-family-binding.mjs
  check-report-pagination.mjs
  check-report-visual-continuity.mjs
  check-report-no-internal-metadata-leak.mjs
16｜必须实现的 checker
16.1 Section checker

检查：

every enabled section has opener
page families valid
section numbering valid
page order valid
16.2 Visual continuity checker

检查：

P01–P06 approved binding preserved
P07+ uses section system
section opener exists
background/motif available or valid fallback
no broken assets
16.3 Pagination checker

检查：

cover no page number
all subsequent pages exactly one page number
total pages correct
no duplicate page number blocks
16.4 Content checker

检查：

no placeholder repetition
no internal IDs
no “未选择目标时间” default state
no raw debug copy
no repeated mechanical disclaimer overflow
17｜BaZi first-pass human acceptance checklist

Codex 完成后，人审必须至少看这些：

视觉
P06 → P07 是否自然
每个 section opener 是否真的像进入新章
正文是否保持统一
是否有书感
内容
personality / career / wealth / relationship 是否有真正 narrative
timing 是否不是空状态
guidance 是否是整合而不是重复
结构
页数不固定但合理
pagination 正确
中英文版结构一致