PHI OS｜GUIDED REPORT SUCCESSOR R2 — ADDENDUM C
BaZi Static Visual Asset Production List
Codex 可执行视觉资产生产与绑定蓝图

这份 Addendum C 的目标，不是继续“做更多图片”，而是把 BaZi 报告 P07+ 需要哪些 static visual assets、每张图负责什么、哪些必须做、哪些可复用、Codex 如何绑定 一次冻结。

核心原则：

STATIC ASSET
≠
REPORT PAGE

STATIC ASSET
=
visual atmosphere
+ section identity
+ decorative system

所有：

标题
客户资料
八字数据
图表数据
正文
页码
中英文

继续由 HTML / CSS / runtime 生成。

1｜Asset Production Principle

BaZi P07+ 的视觉系统分成四层：

L0 Global Body
L1 Global Motif
L2 Section Style
L3 Section Hero Visual

结构：

REPORT PAGE
│
├── BODY BACKGROUND
├── METHOD MOTIF
├── SECTION HERO / SECTION STYLE
├── HTML TYPOGRAPHY
├── DYNAMIC DATA
└── LLM NARRATIVE
2｜现有资产状态

目前已经有：

VIS-REPORT-BAZI-BODY

用途：

ordinary body page background

该资产继续保留。

不要因为后续 section assets 建立而废弃。

3｜BaZi 最终推荐资产清单

建议完整 registry 为：

VIS-REPORT-BAZI-BODY
VIS-REPORT-BAZI-MOTIF
VIS-REPORT-BAZI-SECTION-STYLE

VIS-REPORT-BAZI-SEC-01-OVERVIEW
VIS-REPORT-BAZI-SEC-02-PERSONALITY
VIS-REPORT-BAZI-SEC-03-LIFE-STRUCTURE
VIS-REPORT-BAZI-SEC-04-CAREER
VIS-REPORT-BAZI-SEC-05-WEALTH
VIS-REPORT-BAZI-SEC-06-RELATIONSHIP
VIS-REPORT-BAZI-SEC-07-HEALTH
VIS-REPORT-BAZI-SEC-08-TIMING
VIS-REPORT-BAZI-SEC-09-GUIDANCE
VIS-REPORT-BAZI-SEC-10-APPENDIX

共：

13 assets

但不需要一开始全部生成。

4｜Production Priority
PRIORITY A｜必须先有
A01 VIS-REPORT-BAZI-BODY
A02 VIS-REPORT-BAZI-MOTIF
A03 VIS-REPORT-BAZI-SECTION-STYLE

这三张已经足够让 Codex 建成完整 layout system。

PRIORITY B｜第一批 Section Hero

优先做最影响客户体验的：

B01 VIS-REPORT-BAZI-SEC-01-OVERVIEW
B02 VIS-REPORT-BAZI-SEC-02-PERSONALITY
B03 VIS-REPORT-BAZI-SEC-04-CAREER
B04 VIS-REPORT-BAZI-SEC-05-WEALTH
B05 VIS-REPORT-BAZI-SEC-06-RELATIONSHIP
PRIORITY C｜第二批
C01 VIS-REPORT-BAZI-SEC-03-LIFE-STRUCTURE
C02 VIS-REPORT-BAZI-SEC-07-HEALTH
C03 VIS-REPORT-BAZI-SEC-08-TIMING
C04 VIS-REPORT-BAZI-SEC-09-GUIDANCE
C05 VIS-REPORT-BAZI-SEC-10-APPENDIX
5｜Global Visual DNA

所有 BaZi P07+ assets 必须共享同一个视觉 DNA。

Palette
Ivory
Warm cream
Champagne gold
Muted bronze
Ink grey
Mist blue-grey
Soft earth beige
Very muted jade / moss where appropriate

不要使用：

high saturation
neon
strong red
bright orange
deep corporate blue
black dashboard background
6｜Material Language

整个 BaZi static visual family 应持续使用：

Chinese ink-wash landscape
mist
mountains
water
soft light
fine gold geometry
Five Element orbit language
Heavenly Stem / Earthly Branch inspired nodes
subtle celestial geometry
refined East Asian editorial atmosphere

但不能做成：

traditional temple tourism poster
Chinese New Year visual
feng shui advertisement
fantasy game
fortune teller poster

目标是：

ancient wisdom
×
modern editorial publishing
×
premium personal intelligence report
7｜Hard Rules for Every Asset

所有 static visual assets：

MUST
无文字
无 Logo
无页码
无数字章节号
无标题
无表格
无客户资料
无八字字符作为“内容”
无 baked-in English
无 baked-in Chinese
MAY INCLUDE
抽象五行图形
无文字的干支节点意象
山水
日月
轨道
植物
河流
路径
云雾
纹理
细金线
抽象几何
8｜Recommended Output Specs
BODY
Format:
WebP

Aspect:
portrait report page

Recommended:
1536 × 2048
or
2048 × 2732
SECTION HERO

推荐：

portrait
1536 × 2048 minimum

但视觉主体不要填满整张。

因为 Codex 需要：

crop
position
overlay text
responsive use
MOTIF

优先：

SVG
transparent background

如果生成工具无法稳定输出真正 SVG：

transparent PNG
+
optional manual SVG recreation
9｜Safe Area Contract

所有 section hero 必须预留文字区域。

推荐：

top safe area: 15–25%
center safe area: 45–65%
visual concentration:
bottom
left edge
right edge
or one corner

禁止：

hero subject exactly in center
full-page high-detail texture
busy visual behind title
10｜A01｜VIS-REPORT-BAZI-BODY
Status
EXISTING
Purpose
ordinary body page background
Usage

适合：

STRUCTURED_ANALYSIS_PAGE
NARRATIVE_ANALYSIS_PAGE
INSIGHT_LIST_PAGE
TIMING_PAGE
METHOD_APPENDIX_PAGE
SUMMARY_PAGE
Visual intensity
10–20%

不能抢正文。

11｜A02｜VIS-REPORT-BAZI-MOTIF
Purpose

这是整个 BaZi 报告最重要的 reusable decorative asset。

Codex 可以将它：

scale
rotate
crop
mirror
fade
place top-right
place bottom-left
Visual Brief

画面应该是一组极细、透明的：

Five Element orbital geometry
+
five circular nodes
+
subtle Heaven–Earth connection lines
+
fine gold rings
+
minimal branch-like line network

不要直接写：

木
火
土
金
水

只使用抽象节点。

Appearance
transparent
very thin champagne-gold lines
minimal
precise
calm
high-end editorial
Suggested production prompt
Create a transparent decorative motif for a premium BaZi report.

Use extremely fine champagne-gold linework forming an elegant Five Element-inspired orbital system: five balanced circular nodes connected through subtle concentric rings, fine geometric paths and restrained celestial geometry.

The visual should suggest ancient Chinese cosmology interpreted through modern editorial design.

No Chinese characters.
No English text.
No logo.
No page number.
No solid background.
No symbols that look like a horoscope wheel.
No heavy ornament.

Elegant, minimal, precise, refined, quiet luxury, suitable as a scalable corner or edge motif on an ivory report page.
12｜A03｜VIS-REPORT-BAZI-SECTION-STYLE

这个 asset 不是某一个 section 的主题图。

它是所有 section opener 的 fallback visual system。

Purpose

当某 section 尚未拥有独立 hero 时：

SECTION_OPENER_PAGE
=
SECTION-STYLE
+
BODY
+
MOTIF

仍然可以生成 premium section opener。

Visual Brief

建议：

misty mountain landscape
large negative space
one distant sun/moon
subtle gold orbit
delicate pine silhouette
soft water

比 BODY 强。

但比 Cover 弱。

Visual intensity
35–50%
Suggested prompt
Create a premium vertical section-opening background for a BaZi personal report.

Refined Chinese ink-wash inspired mountain landscape in warm ivory, mist grey, pale stone blue and restrained champagne gold.

Use layered distant mountains, soft mist, a subtle calm body of water and a very faint circular celestial geometry.

Keep large clean negative space for editorial typography.

The image should feel more visually expressive than a normal report body page but clearly quieter than a cover.

No text.
No Chinese characters.
No English.
No logo.
No page number.
No people.
No temples as focal subjects.
No fortune-telling clichés.

Ancient Chinese wisdom interpreted through modern luxury editorial publishing.
13｜B01｜VIS-REPORT-BAZI-SEC-01-OVERVIEW
Section
01 命盘总览
Chart Overview
Concept

这一页应该表达：

出生结构
→
四柱展开
→
人生结构从时间中形成
Visual Language

推荐：

four vertical / spatial anchors
central subtle orbit
morning mist
mountain layers
soft rising light

不能真的把四柱文字写进去。

可以用：

four subtle pillars / beams / markers

来暗示 Four Pillars。

Suggested prompt
Create a premium section hero visual for a BaZi report chapter about Chart Overview.

Show an elegant Chinese ink-wash mountain landscape emerging from morning mist, with four subtle vertical structural markers integrated into the composition to symbolically suggest the Four Pillars.

Add very restrained champagne-gold orbital geometry and a soft distant light source.

The concept should communicate: a life structure emerging from time, order and natural cycles.

Large editorial negative space.
No text.
No Chinese characters.
No chart labels.
No logo.
No people.
No literal horoscope wheel.

Quiet, refined, contemporary Chinese editorial design.
14｜B02｜VIS-REPORT-BAZI-SEC-02-PERSONALITY
Section
02 核心性格
Core Personality
Concept
inner core
+
outer expression
+
multiple layers
Visual Language

推荐：

single central light
concentric soft rings
one tree / stone / mountain peak
reflection
mist layers

重点是“内核”。

不要出现人物头像。

Suggested prompt
Create a refined BaZi section hero for Core Personality.

Use a poetic Chinese ink-wash inspired landscape centered around one symbolic core: a solitary pine, stone or mountain peak surrounded by subtle concentric atmospheric layers.

A gentle inner light should suggest an internal center radiating outward into different expressions.

Warm ivory, mist grey, pale jade-grey and champagne gold.

Large clean space for typography.

No people.
No faces.
No text.
No Chinese characters.
No personality icons.
No logo.

Elegant, psychologically reflective, calm and premium.
15｜C01｜VIS-REPORT-BAZI-SEC-03-LIFE-STRUCTURE
Section
03 人生格局
Life Structure
Concept
结构
承载
路径
支撑
张力
Visual Language

推荐：

mountain ridges
bridges / paths
terraced layers
interlocking geological structure
subtle geometric grid
Suggested prompt
Create a premium BaZi section hero representing Life Structure.

Use layered Chinese ink-wash mountain ridges, natural pathways and interlocking landscape formations to communicate support, structure, tension and direction.

Introduce a very subtle champagne-gold geometric framework partially embedded in the landscape.

The visual should suggest that different structural conditions shape different possible routes through life.

Large negative space.
No text.
No Chinese characters.
No people.
No buildings as focal objects.
No logo.

Sophisticated editorial calm, structural and contemplative.
16｜B03｜VIS-REPORT-BAZI-SEC-04-CAREER
Section
04 事业发展
Career Development
Concept

不是：

office
briefcase
businessman
money

而是：

direction
responsibility
development
path
scale
Visual Language

推荐：

mountain pass
ascending path
distant ridge
controlled sunrise
subtle architectural geometry
Suggested prompt
Create a premium BaZi section hero for Career Development.

Show a refined mountain landscape with a clear but elegant upward path moving through layered terrain toward a distant illuminated ridge.

The image should evoke direction, responsibility, capability, growth and long-term development without depicting business offices or corporate clichés.

Use warm ivory, stone grey, muted landscape green and restrained champagne gold.

Subtle geometric line structure may suggest organization and progression.

Large typography-safe area.
No people.
No text.
No corporate icons.
No money imagery.
No logo.
17｜B04｜VIS-REPORT-BAZI-SEC-05-WEALTH
Section
05 财富运势
Wealth Outlook
Concept

财富不要表达成：

gold coins
cash
money rain
gold bars

而应表达：

resource flow
accumulation
retention
exchange
growth
Visual Language

推荐：

river
terraced water
reservoir
flow into basin
subtle branching streams
Suggested prompt
Create a sophisticated BaZi section hero for Wealth Outlook.

Use an elegant Chinese landscape in which streams and rivers flow through layered terrain and gather into a calm basin or lake.

The visual should symbolically express resource flow, accumulation, exchange, retention and sustainable growth.

Use soft ivory, stone, muted jade-grey, water blue-grey and subtle champagne gold.

Include delicate geometric flow lines, but keep them abstract.

No coins.
No currency symbols.
No gold bars.
No business imagery.
No text.
No people.
No logo.

Quiet wealth, not ostentatious wealth.
18｜B05｜VIS-REPORT-BAZI-SEC-06-RELATIONSHIP
Section
06 感情婚姻
Relationships & Marriage
Concept

不要：

couple silhouette
wedding
hearts
rings

推荐表达：

two systems meeting
distance
connection
balance
boundary
Visual Language

推荐：

two mountain forms
two branches
two islands
two streams joining
soft bridge of mist/light
Suggested prompt
Create a premium BaZi section hero for Relationships and Marriage.

Represent relationship dynamics through two distinct natural forms — such as two mountain ridges, two river paths or two elegant branches — approaching and interacting while remaining individually defined.

Use mist, reflected light and subtle champagne-gold connecting geometry to suggest connection, distance, balance and boundaries.

No people.
No couples.
No hearts.
No wedding rings.
No text.
No Chinese characters.
No logo.

Poetic, mature, emotionally intelligent and editorial.
19｜C02｜VIS-REPORT-BAZI-SEC-07-HEALTH
Section
07 健康养生
Health & Wellbeing
Concept

不是 medical illustration。

表达：

rhythm
restoration
balance
breath
environment
renewal
Visual Language

推荐：

water
mist
pine
bamboo
soft light
breathing negative space
Suggested prompt
Create a premium BaZi section hero for Health and Wellbeing.

Use a serene Chinese ink-wash natural environment with gentle water, soft mist, pine or bamboo and a calm rhythm of open space.

The atmosphere should evoke restoration, sustainable rhythm, balance, breath and long-term wellbeing.

Use warm ivory, soft jade-grey, mist blue-grey and restrained champagne gold.

No medical symbols.
No anatomy.
No pills.
No people.
No text.
No logo.

Calm, restorative and sophisticated.
20｜C03｜VIS-REPORT-BAZI-SEC-08-TIMING
Section
08 时间结构
Timing & Cycles
Concept

这一张非常重要。

表达：

cycles
time layers
seasonal movement
current position
transition
Visual Language

推荐：

sun + moon
seasonal landscape gradient
orbital arcs
receding circular layers
river through time

不要像 astrology chart。

Suggested prompt
Create a premium BaZi section hero for Timing and Cycles.

Show a poetic landscape structured by layered cycles of time: subtle sun and moon references, concentric celestial arcs, seasonal atmospheric transitions and a landscape extending through multiple depth layers.

The composition should communicate current position within a larger sequence of time.

Use warm ivory, mist grey, pale blue, muted gold and soft earth tones.

No clock.
No calendar.
No zodiac wheel.
No text.
No dates.
No Chinese characters.
No people.
No logo.

Ancient temporal philosophy expressed through modern editorial design.
21｜C04｜VIS-REPORT-BAZI-SEC-09-GUIDANCE
Section
09 人生建议
Guidance & Recommendations
Concept

表达：

clarity
choice
navigation
possibility
next direction
Visual Language

推荐：

forking path
mountain opening
light horizon
river paths
subtle compass geometry

但不要真的出现 compass icon。

Suggested prompt
Create a premium BaZi section hero for Guidance and Recommendations.

Show an elegant landscape opening toward several subtle possible paths, with mist clearing toward a brighter horizon.

The image should communicate clarity, navigation, thoughtful choice and multiple possibilities rather than destiny or certainty.

Use refined Chinese ink-wash inspired mountains, soft water, pale light and delicate champagne-gold directional geometry.

Large negative space.
No people.
No road signs.
No literal compass.
No text.
No logo.

Hopeful, grounded and sophisticated.
22｜C05｜VIS-REPORT-BAZI-SEC-10-APPENDIX
Section
10 方法与附录
Method & Appendix
Concept

表达：

knowledge
structure
method
traceability
continuity
Visual Language

推荐：

paper texture
fine grid
abstract scroll geometry
archival linework
mountain fragment
subtle diagram system

不能出现可读书中文字。

Suggested prompt
Create a premium BaZi section hero for Method and Appendix.

Combine subtle archival paper texture, refined geometric linework, faint diagram-like structures and restrained Chinese landscape fragments.

The visual should communicate method, structure, traceability, continuity and disciplined interpretation.

Warm ivory, parchment cream, soft ink grey and champagne gold.

No readable writing.
No Chinese characters.
No books with visible text.
No logo.
No people.

Quiet scholarly editorial design, modern and highly refined.
23｜Asset Reuse Rules

Codex 不需要每张 section opener 都 100% 使用不同 visual。

允许：

SEC-01
hero visual A

SEC-03
same visual A
different crop
different motif
different opacity

但以下不得完全一样：

two consecutive section openers
24｜Fallback Matrix

如果专属 hero 缺失：

SECTION HERO EXISTS
→ use section hero

SECTION HERO MISSING
→ use VIS-REPORT-BAZI-SECTION-STYLE

SECTION STYLE MISSING
→ use VIS-REPORT-BAZI-BODY + MOTIF

MOTIF MISSING
→ use BODY only

BODY MISSING
→ CSS premium fallback

永远不允许：

broken image
404
blank visual slot
25｜Section Opener Composition

每张 opener 最终不是 static image 本身。

而是：

static hero
+
HTML section number
+
HTML Chinese title
+
HTML English title
+
LLM section intro
+
pagination

例如：

04

事业发展
CAREER DEVELOPMENT

你的事业结构并不是单纯回答
“适合做什么工作”，而是帮助你理解……

其中只有背景来自 asset。

26｜Recommended Section Opener Layout

推荐布局：

┌─────────────────────────────┐
│                        04   │
│                             │
│   事业发展                   │
│   CAREER DEVELOPMENT        │
│   ─────────────             │
│                             │
│   Section Intro             │
│                             │
│                             │
│                   HERO      │
│                  LANDSCAPE  │
│                             │
│                       15/33 │
└─────────────────────────────┘

也可以左右反转。

27｜Hero Placement Variants

Codex 应支持：

hero-bottom
hero-right
hero-left
hero-full-fade
hero-corner

不要所有 opener 都：

image bottom
text top

否则又变成机械模板。

28｜Section Layout Rotation

推荐循环：

S01 → hero bottom
S02 → hero right
S03 → hero lower-left
S04 → hero full-fade
S05 → hero bottom
S06 → hero right
S07 → hero lower-left
S08 → hero full-fade
S09 → hero bottom
S10 → hero right

仍然统一视觉系统，但有节奏变化。

29｜BODY Page Visual Variation

普通 body page 也不要完全一样。

Codex 可以使用：

BODY_A
BODY_B
BODY_C

这不是三张图。

而是：

same BODY asset
different CSS crop / position / opacity

例如：

BODY_A
mountain bottom-left

BODY_B
mountain bottom-right

BODY_C
motif top-right + faint landscape bottom
30｜Narrative Page Background Rule

对于长文 narrative page：

background visual intensity <= 15%

因为真正价值来自文字。

31｜Insight Page Background Rule

对于 icon / list page：

visual intensity <= 10%

让 cards / icons 有空间。

32｜Section Opener Background Rule
visual intensity 35–55%

这里视觉才是主要节奏工具。

33｜Timing Page Visual Rule

Timing pages 可以额外使用：

VIS-REPORT-BAZI-MOTIF

加强：

orbit
cycle
temporal layering

但不要让它看起来像 astrology。

34｜No Method Confusion

BaZi visuals 必须和：

Astrology
Zi Wei
HD
Numerology

明显区分。

因此 BaZi 不应过度使用：

star maps
constellations
zodiac circle
bodygraph geometry
numerical matrix

BaZi 主视觉语言固定为：

time
five-element dynamics
mountain / water
structural cycles
Chinese natural philosophy
35｜Asset Registry Schema

建议 Codex 建立：

{
  "assetId": "VIS-REPORT-BAZI-SEC-04-CAREER",
  "method": "BAZI",
  "assetType": "SECTION_HERO",
  "section": "S04_CAREER",
  "localeIndependent": true,
  "containsText": false,
  "preferredFormat": "webp",
  "fallback": "VIS-REPORT-BAZI-SECTION-STYLE",
  "safeArea": {
    "top": 0.18,
    "left": 0.12,
    "right": 0.12,
    "bottom": 0.12
  },
  "status": "ACTIVE"
}
36｜R2 Object Key Recommendation

如果继续放 R2，推荐：

reports/
bazi/
r2/
visual/
body/
VIS-REPORT-BAZI-BODY.webp

reports/
bazi/
r2/
visual/
motif/
VIS-REPORT-BAZI-MOTIF.svg

reports/
bazi/
r2/
visual/
section/
VIS-REPORT-BAZI-SECTION-STYLE.webp

reports/
bazi/
r2/
visual/
section/
VIS-REPORT-BAZI-SEC-01-OVERVIEW.webp
...
37｜File Naming Freeze

文件名严格使用：

VIS-REPORT-BAZI-BODY.webp

VIS-REPORT-BAZI-MOTIF.svg

VIS-REPORT-BAZI-SECTION-STYLE.webp

VIS-REPORT-BAZI-SEC-01-OVERVIEW.webp
VIS-REPORT-BAZI-SEC-02-PERSONALITY.webp
VIS-REPORT-BAZI-SEC-03-LIFE-STRUCTURE.webp
VIS-REPORT-BAZI-SEC-04-CAREER.webp
VIS-REPORT-BAZI-SEC-05-WEALTH.webp
VIS-REPORT-BAZI-SEC-06-RELATIONSHIP.webp
VIS-REPORT-BAZI-SEC-07-HEALTH.webp
VIS-REPORT-BAZI-SEC-08-TIMING.webp
VIS-REPORT-BAZI-SEC-09-GUIDANCE.webp
VIS-REPORT-BAZI-SEC-10-APPENDIX.webp

不要自动改成：

career-v2-final-new.webp
38｜Generation Acceptance Checklist

每张资产生成后至少人工检查：

[ ] 无文字
[ ] 无拼写
[ ] 无随机汉字
[ ] 无假 Logo
[ ] 无人物
[ ] 无明显 AI artifact
[ ] 有安全排字空间
[ ] 与 BaZi visual DNA 一致
[ ] 不像 Astrology
[ ] 不像旅游海报
[ ] 不像命理广告
[ ] 不过度复杂
[ ] 适合 print
39｜Codex Visual Asset Checker

Codex 应检测：

asset exists
asset decodes
correct extension
correct registry binding
fallback exists
localeIndependent = true
containsText = false

containsText=false 无法自动完全证明时，至少 registry 强制登记并进入 human visual acceptance。

40｜Do Not Block Runtime

这些 asset 的完成顺序不能阻塞：

LLM Composer
NOW timing
section registry
page families
pagination
ZH/EN

开发顺序：

runtime first
visual binding second
final polish third
41｜第一批你真正需要生成的图

我建议不要现在一次生成全部 12 张。

先做下面 7 张：

01 VIS-REPORT-BAZI-MOTIF
02 VIS-REPORT-BAZI-SECTION-STYLE
03 VIS-REPORT-BAZI-SEC-01-OVERVIEW
04 VIS-REPORT-BAZI-SEC-02-PERSONALITY
05 VIS-REPORT-BAZI-SEC-04-CAREER
06 VIS-REPORT-BAZI-SEC-05-WEALTH
07 VIS-REPORT-BAZI-SEC-06-RELATIONSHIP

因为：

BODY 已经有了
+
这 7 张
=
足够做出非常完整的 BaZi 第一版

其余：

03 LIFE STRUCTURE
07 HEALTH
08 TIMING
09 GUIDANCE
10 APPENDIX

可以在看到第一版 PDF 后再生成。

42｜最终 Asset Matrix
Asset ID	类型	优先级	专属 Section	可复用	推荐格式
VIS-REPORT-BAZI-BODY	Body BG	A	全部	是	WebP
VIS-REPORT-BAZI-MOTIF	Motif	A	全部	是	SVG
VIS-REPORT-BAZI-SECTION-STYLE	Section fallback	A	全部	是	WebP
SEC-01-OVERVIEW	Hero	B	Overview	有限	WebP
SEC-02-PERSONALITY	Hero	B	Personality	有限	WebP
SEC-03-LIFE-STRUCTURE	Hero	C	Life Structure	有限	WebP
SEC-04-CAREER	Hero	B	Career	有限	WebP
SEC-05-WEALTH	Hero	B	Wealth	有限	WebP
SEC-06-RELATIONSHIP	Hero	B	Relationship	有限	WebP
SEC-07-HEALTH	Hero	C	Health	有限	WebP
SEC-08-TIMING	Hero	C	Timing	有限	WebP
SEC-09-GUIDANCE	Hero	C	Guidance	有限	WebP
SEC-10-APPENDIX	Hero	C	Appendix	有限	WebP
43｜给 Codex 的执行指令

将下面这一段连同 Addendum B 一起交给 Codex：

Implement ADDENDUM C as the canonical BaZi report visual asset contract.

Do not treat section hero assets as complete pages.

All static assets are locale-independent decorative visual layers only.

The following must remain HTML/runtime generated:

- section numbers
- titles
- Chinese/English content
- user data
- diagrams
- charts
- pagination
- narrative
- methodology text

Bind:

VIS-REPORT-BAZI-BODY
VIS-REPORT-BAZI-MOTIF
VIS-REPORT-BAZI-SECTION-STYLE

as global BaZi report assets.

Bind optional section-specific assets through the section registry.

When a section-specific asset is unavailable, fall back in this order:

SECTION HERO
→ SECTION STYLE
→ BODY + MOTIF
→ BODY
→ CSS premium fallback

Never render a broken image or empty hero slot.

Use the same assets for zh-Hans and en.

Section opener visual placement must support multiple variants rather than one repeated layout.

Do not block runtime, Composer, pagination or temporal implementation while optional section assets are unavailable.
接下来最适合直接生成的顺序