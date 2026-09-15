# PHI OS｜CUSTOMER ACTIVATION CLOSURE R1

# 全站真实客户体验整改、Sandbox Commerce、浏览器复测与 Production Closure

## MASTER WORK STEP

---

# 0｜WORK AUTHORITY

## 0.1 Current Code Baseline

当前代码基线：

```text
main
5e877958295c40b3df9b0d504cf7db865f184f20
W80
```

本工作以：

```text
aligned main folder
+
PHI OS｜Cloud Browser 全站客户体验走查报告
2026-09-15
```

作为正式输入。

---

## 0.2 Browser Evidence Authority

以下状态优先级正式冻结为：

```text
REAL_BROWSER_CONFIRMED
>
SANDBOX_INTEGRATION_CONFIRMED
>
RUNTIME_CHECK_CONFIRMED
>
STATIC_SOURCE_CONFIRMED
>
INFERENCE
```

因此：

```text
npm checker PASS
```

不能覆盖：

```text
Cloud Browser CONFIRMED FAIL
```

例如：

```text
context 参数存在于 URL
≠
Ask 实际获得了正确 source

shuffleSound() 存在
≠
声音真实可听

Book topic 存在
≠
客户可以理解该概念

Search corpus 存在
≠
搜索结果相关

checkout API 存在
≠
客户真的完成支付
```

---

# 1｜SCOPE BOUNDARY

本工作不创建新的：

```text
LLM Composer
Context Resolver
Article Runtime
Knowledge Master
Reality Runtime
Tarot Runtime
Book Runtime
Financial Runtime
Commerce Runtime
```

只能：

```text
修复现有 runtime 的前台消费
统一 contract
补齐缺失 structured meaning
修复 customer shell
补 QA infrastructure
补 Sandbox integration
补 browser acceptance
```

---

# 2｜CURRENT REAL-BROWSER BASELINE

当前 Work Cloud Browser 已确认：

```text
Public canonical:
https://getphios.com/

visitor:
guest / first-time visitor

browser:
Chrome Cloud Browser

actual viewport:
1363 × 936 CSS px
```

已经实际运行：

```text
click
text input
Browser Back
Refresh
locale switching
Search
Article
Ask
Sources
Book III
Books
Book IV
Book V
Tarot shuffle
Tarot card select
Tarot single-card removal
Tarot replacement
```

---

# 3｜CURRENT ISSUE AUTHORITY

当前正式 issue registry：

```text
P0 = 5
P1 = 7
P2 = 2
```

## P0

```text
PHIOS-QA-003
Article → Ask context/source 丢失并答非所问

PHIOS-QA-005
首页 Header Search overlay 无法提交导航

PHIOS-QA-006
Search ranking / relevance 严重过宽

PHIOS-QA-008
Book III 缺 degradation → signal → recovery → continuity 实际解释

PHIOS-QA-009
Book IV 缺 expansion → constraint → threshold → scale transformation 完整解释
```

## P1

```text
PHIOS-QA-002
sitemap 与 published canonical coverage 未统一

PHIOS-QA-004
Article index/detail 使用不同 customer shell

PHIOS-QA-007
Search “文章在哪里” 缺 navigation intent fallback

PHIOS-QA-010
locale 跨 shell 丢失

PHIOS-QA-011
核心页面 broken image / visual unavailable

PHIOS-QA-012
Search overlay Escape / focus return 失败

PHIOS-QA-013
dynamic loading / timeout / retry customer state 不完整
```

## P2

```text
PHIOS-QA-001
external crawler/cache/index freshness 待专项确认

PHIOS-QA-014
Search result density 过高
```

---

# 4｜FROZEN EXECUTION ORDER

严格按以下顺序执行：

```text
CA-R1-W0
Baseline & Evidence Freeze

↓

CA-R1-W1
Issue Registry Cutover

↓

CA-R1-W2–W6
P0 Contextual Ask Closure

↓

CA-R1-W7–W9
P0 Header Search Closure

↓

CA-R1-W10–W13
P0 Search Ranking Closure

↓

CA-R1-W14–W17
P0 Book III Meaning Closure

↓

CA-R1-W18–W21
P0 Book IV Meaning Closure

↓

CA-R1-W22–W29
P1 Public Experience Closure

↓

CA-R1-W30–W36
Commerce Sandbox Foundation

↓

CA-R1-W37–W41
QA Fixtures & Browser Matrix

↓

CA-R1-W42
P0 Browser Retest Gate

↓

CA-R1-W43
P1 Browser Retest Gate

↓

CA-R1-W44
P2 / UX Retest

↓

CA-R1-W45
Book I Sandbox Commerce E2E

↓

CA-R1-W46
Full Customer Journey Regression

↓

CA-R1-W47
Machine Regression

↓

CA-R1-W48
Production Isolation & Security Gate

↓

CA-R1-W49
Final Customer Capability Registry

↓

CA-R1-W50
Final Acceptance / Freeze
```

不得提前跳到 Final Acceptance。

---

# CA-R1-W0｜BASELINE & EVIDENCE FREEZE

## Objective

冻结当前 repo、production 与真实浏览器报告。

## Required actions

记录：

```text
git commit
branch
Node version
npm version
Cloudflare production project
production deployment ID
canonical domain
current sitemap
current redirects
current environment binding names
```

保存浏览器报告为正式 QA evidence。

禁止修改原始浏览器报告中的：

```text
PASS
FAIL
PARTIAL
BLOCKED
NOT_RUN
```

只能通过后续 Retest 创建 successor evidence。

## Required output

```text
docs/qa/customer-activation-r1/
  browser-baseline-2026-09-15.md
  baseline-environment-v1.json
```

## Acceptance

```text
CA_R1_BASELINE_FROZEN = true
```

---

# CA-R1-W1｜ISSUE REGISTRY CUTOVER

建立一个唯一 issue registry。

## Required fields

每条 issue：

```text
id
priority
classification
status

route
environment
locale
viewport
authentication

reproductionSteps
expected
actual

browserEvidence
sourceEvidence

customerImpact

ownerSurface
affectedRuntime

fixRequired
retestRequired

openedAt
fixedCommit
retestedAt
closedAt
```

## Allowed statuses

```text
OPEN
IN_PROGRESS
FIXED_PENDING_RETEST
RETEST_PASS
RETEST_FAIL
BLOCKED
CLOSED
```

## Initial state

```text
PHIOS-QA-001 OPEN
PHIOS-QA-002 OPEN
PHIOS-QA-003 OPEN
...
PHIOS-QA-014 OPEN
```

## Output

```text
data/qa/customer-activation-r1/
  issue-registry-v1.json
```

---

# CA-R1-W2｜CONTEXTUAL ASK CONTRACT INVENTORY

对应：

```text
PHIOS-QA-003
P0
```

## Problem

Article URL 已经带有：

```text
entrySurface
mode
contextType
contextId
contextLabel
contextSummary
readingPath
relatedKnowledgeRef
```

但真实 Ask 显示：

```text
Using: PHI OS knowledge
```

而不是 selected article。

Sources 甚至显示：

```text
No selected source supported this answer
No source details are available
```

说明：

```text
URL contract
→ Ask state
→ retrieval scope
→ source injection
```

链路中至少有一个阶段失效。

---

## Required action

枚举所有进入 Ask 的入口：

```text
Home
Search
Article index
Article detail
Book
Book topic
Figure
Knowledge
Explore
Atlas
Reality
Perspectives
```

记录每种入口当前传递：

```text
query parameters
context type
context ID
locale
route
summary
reading path
retrieval scope
```

## Required output

```text
contextual-ask-entry-contract-audit-v1.json
```

---

# CA-R1-W3｜CANONICAL ASK CONTEXT NORMALIZATION

建立一个唯一 normalization 层。

不是新 Runtime。

其职责仅为：

```text
legacy context contract
+
current context contract
+
entry-surface-specific parameters

↓

one canonical Ask context
```

Canonical shape 至少包含：

```text
entrySurface

contextType
contextRef
contextId

contextLabel
contextRoute

contextSummary
readingPath

locale

relatedKnowledgeRef

retrievalScope

sourceAuthority

fallbackPolicy
```

禁止各页面自己决定不同含义。

---

# CA-R1-W4｜ASK SOURCE INJECTION GATE

在回答生成之前，必须验证：

```text
selected context exists

selected context published in locale

selected context retrievable

selected source resolved

retrieval scope populated
```

如果 contextual Ask 是从具体 Article / Book / Figure 进入，而 source resolution 失败：

不得：

```text
退回 generic PHI OS knowledge
然后生成长篇泛化答案
```

必须返回类似状态：

```text
I could not load the selected source.
You can retry, open the source, or ask without source context.
```

Customer UI 应明确：

```text
Selected source unavailable
```

而不是假装 contextual Ask 正常。

---

# CA-R1-W5｜ASK ANSWER RELEVANCE GATE

对 contextual Ask 建立 relevance acceptance：

```text
question
selected source
retrieved evidence
answer claim
```

必须相互对应。

至少增加 regression：

```text
Article:
book3-article-008

Question:
Why can't AI decide what deserves protection?
```

Expected answer 应围绕文章中的：

```text
value
cost
legitimacy
responsibility
protection decision
```

而不是泛化成：

```text
capability
scale
continuity
```

---

# CA-R1-W6｜ASK SOURCE / BACKLINK / RELATED REGRESSION

同一 Article 分别从：

```text
Search result
Article detail
Book topic
```

进入 Ask。

三条路径必须得到相同：

```text
selected context label

source ID

source title

source route

locale

answer relevance

related knowledge

back route
```

Browser Back 必须返回：

```text
原 Article
原 locale
原阅读位置尽可能保持
```

## P0 Closure condition

只有真实浏览器通过后：

```text
PHIOS-QA-003
→ CLOSED
```

---

# CA-R1-W7｜HEADER SEARCH EVENT AUDIT

对应：

```text
PHIOS-QA-005
P0
```

检查 Header Search overlay：

```text
form action
submit listener
preventDefault
button type
query serialization
full-search anchor
overlay click interception
successor navigation
```

当前三种失败路径必须分别修复：

```text
Enter
Search button
Open full search
```

---

# CA-R1-W8｜HEADER SEARCH CANONICAL NAVIGATION

三种交互必须统一产生：

```text
/search/?q=<encoded query>
```

不要三套 navigation logic。

建议：

```text
one canonical submit function
```

负责：

```text
trim query
encode query
close overlay
navigate
```

---

# CA-R1-W9｜HEADER SEARCH BROWSER REGRESSION

Required real browser:

```text
mouse click Search
keyboard Enter
Open full search link
```

Query：

```text
Reality Continuity
```

三条都必须进入 Search results。

另外验证：

```text
empty query
whitespace query
Chinese query
English query
```

## Closure

```text
PHIOS-QA-005 CLOSED
```

只允许在 Browser retest 后。

---

# CA-R1-W10｜SEARCH RANKING AUTHORITY

对应：

```text
PHIOS-QA-006
P0
```

当前 production 实际表现：

```text
Reality Continuity
→ 173 results

What is scale transformation?
→ 171

exact article title
→ 222

Reality Expansion
→ 187

FIG 11F
→ 46
```

这说明 semantic expansion 权重高于 navigation accuracy。

正式排序 authority：

```text
1 EXACT_CANONICAL_ID
2 EXACT_TITLE
3 EXACT_ALIAS
4 EXACT_TYPE_MATCH
5 PREFIX_TITLE
6 PHRASE_MATCH
7 STRUCTURED_RELATION
8 SEMANTIC_MATCH
9 BROAD_RELATED
```

---

# CA-R1-W11｜SEARCH RELEVANCE THRESHOLD

不得因为某对象“广义相关”就全部显示。

引入 minimum score / eligibility gate。

至少：

```text
low confidence
→ 不进入 main results
```

可进入：

```text
Related
Explore more
```

但不能淹没 primary result。

---

# CA-R1-W12｜SEARCH TYPE GROUPING

对明确 navigation query：

```text
Book title
Figure ID
Article exact title
Object ID
```

优先显示：

```text
Exact match
```

然后才：

```text
Related articles
Other volumes
Concepts
```

Regression：

```text
Reality Continuity
→ Book III 必须进入第一明确结果区域

Reality Expansion
→ Book IV 必须进入第一明确结果区域

FIG 11F
→ FIG 11F 必须优先

完整 article title
→ 该 article 必须优先
```

---

# CA-R1-W13｜SEARCH P0 RETEST

Required regression query set：

```text
Reality Continuity

Reality Expansion

What is scale transformation?

FIG 11F

exact article title

exact object ID

中文概念

English concept
```

目标对象：

```text
first result
```

或：

```text
first explicit exact-match group
```

## Closure

```text
PHIOS-QA-006 CLOSED
```

---

# CA-R1-W14｜BOOK III SOURCE AUTHORITY

对应：

```text
PHIOS-QA-008
P0
```

当前生产状态：

```text
Architecture only

Definition has not yet been extracted.
Read the source chapter.
```

因此先完成：

```text
Book III manuscript
→ structured meaning extraction
```

而不是先做 UI 美化。

---

# CA-R1-W15｜BOOK III MEANING EXTRACTION

完成 Book III 所有仍处于：

```text
PENDING_PARAGRAPH_EXTRACTION
```

的 governed object。

至少保证以下链完整：

```text
Degradation

↓

Signal

↓

Signal interpretation

↓

Recovery

↓

Resilience

↓

Adaptation

↓

Learning

↓

Coordination Continuity

↓

Shared Maintenance

↓

Continuity
```

每个节点至少需要：

```text
definition

what changes

observable indicators

failure pattern

transition condition

relationship to previous node

relationship to next node

source chapter

source paragraph / page authority

ZH

EN semantic parity status
```

---

# CA-R1-W16｜BOOK III CUSTOMER PROJECTION

Book III customer page必须让第一次客户直接回答：

```text
什么是退化？

什么是讯号？

什么时候讯号被误读？

恢复和暂时缓解有什么不同？

连续性是什么？

这些阶段如何相连？
```

页面不得只显示：

```text
topic name
page number
source chapter
```

应至少有：

```text
short definition

expanded explanation

observable signs

transition

related article

Ask this topic

previous / next
```

---

# CA-R1-W17｜BOOK III REAL BROWSER ACCEPTANCE

实际运行：

```text
Book III
→ degradation
→ signal
→ recovery
→ continuity
```

验收标准：

客户不离开 Book III 页面，也能解释四个概念及关系。

不得使用：

```text
存在 topic title
```

作为通过证据。

## Closure

```text
PHIOS-QA-008 CLOSED
```

---

# CA-R1-W18｜BOOK IV SOURCE AUTHORITY

对应：

```text
PHIOS-QA-009
P0
```

当前 Book IV：

```text
运行扩展
Definition has not yet been extracted
```

虽然存在 article summary，但 summary 不等于 canonical structured definition。

---

# CA-R1-W19｜BOOK IV MEANING CLOSURE

必须完整建立：

```text
Expansion

↓

Expansion Pressure

↓

Replication

↓

Constraint

↓

Threshold

↓

Scale Transformation
```

其中用户核心浏览链至少为：

```text
Expansion
→ Constraint
→ Threshold
→ Scale Transformation
```

每个节点：

```text
definition

mechanism

condition

constraint

transition

example

source

related article
```

---

# CA-R1-W20｜BOOK IV CUSTOMER CHAIN

Book IV UI 必须能顺序走：

```text
Expansion

→ Why expansion creates pressure

→ What constrains expansion

→ What makes a threshold

→ What changes when scale transforms
```

不能让客户自己从 20 个 object 中猜路径。

---

# CA-R1-W21｜BOOK IV → BOOK V BRIDGE

保留已经实际通过的：

```text
Continue to Book V · Civilization Atlas
```

但补：

```text
context continuity
locale persistence
why Book V is next
```

真实浏览器路径：

```text
Book IV
→ Scale Transformation
→ Civilization Threshold
→ Book V Atlas
→ T00–T19
```

必须保持主题和语言。

## Closure

```text
PHIOS-QA-009 CLOSED
```

---

# CA-R1-W22｜ARTICLE DETAIL CUSTOMER SHELL CUTOVER

对应：

```text
PHIOS-QA-004
P1
```

当前：

```text
Articles index
= current shell

individual article
= legacy shell
```

需要正式 successor cutover。

Article detail 必须统一：

```text
current Header

current Search

current locale switch

current navigation

current footer

current Ask entry

current customer styles
```

删除客户可见旧入口依赖。

---

# CA-R1-W23｜ARTICLE VOLUME LABEL AUTHORITY

禁止：

```text
Volume 3 article
→ View Book I
```

Book CTA 必须从 canonical volume registry 生成：

```text
volume
book title
book route
```

不允许 hardcoded Book I label。

---

# CA-R1-W24｜LOCALE AUTHORITY CONVERGENCE

对应：

```text
PHIOS-QA-010
P1
```

统一一个 locale authority。

不得：

```text
legacy shell one key
current shell another key
```

规范：

```text
locale storage key
initialization timing
URL propagation policy
navigation propagation
server/client fallback
```

Required chain：

```text
Article ZH
→ Book III ZH
→ Books ZH
→ Book IV ZH
→ Book V ZH
```

全程保持：

```text
zh-Hans
```

---

# CA-R1-W25｜BROKEN VISUAL CLOSURE

对应：

```text
PHIOS-QA-011
P1
```

已知：

```text
CX_ASSET_IMAGE_LOAD_FAILED:ILL-003
```

对以下 production pages 做 asset binding audit：

```text
/
Explore
Knowledge
Articles
Figures
Reality
Perspectives
Personal
Profile
Relationship
Book pages
```

每个 asset 检查：

```text
registry ID
source URL
actual HTTP status
mime type
naturalWidth
naturalHeight
fallback
locale
dark/light suitability
```

---

# CA-R1-W26｜VISUAL FAILURE POLICY

真正缺图时：

不要显示：

```text
broken icon
empty image
collapsed layout
```

有意 fallback 才允许：

```text
Visual unavailable
```

而生产已绑定 asset 失败必须视为 defect。

Acceptance：

```text
all intended production images:
naturalWidth > 0
```

---

# CA-R1-W27｜SEARCH NAVIGATION INTENT

对应：

```text
PHIOS-QA-007
P1
```

加入 navigation intent dictionary。

至少：

```text
文章在哪里
articles
where are articles

书在哪里
books
where are the books

图在哪里
figures

Ask
My Reality
Tarot
I Ching
```

如果 query 明显属于导航意图：

不要返回：

```text
0 results only
```

应返回：

```text
direct destination CTA
```

---

# CA-R1-W28｜SEARCH OVERLAY ACCESSIBILITY

对应：

```text
PHIOS-QA-012
P1
```

Required:

```text
Open overlay

Tab through controls

Escape

Overlay closes

Focus returns to Header Search trigger
```

同时验证：

```text
aria-expanded
aria-hidden / dialog state
focus trap if modal
body scroll policy
```

---

# CA-R1-W29｜DYNAMIC LOADING / ERROR / RETRY

对应：

```text
PHIOS-QA-013
P1
```

适用：

```text
Knowledge
Search
Articles
Article
Figures
Ask
Books dynamic explorer
```

每个动态 surface 必须有：

```text
initial loading

skeleton or explicit progress

maximum reasonable wait

timeout state

error state

retry

retained prior content where applicable
```

禁止无限：

```text
Loading published knowledge…
```

无 timeout。

---

# CA-R1-W30｜SITEMAP PUBLICATION AUTHORITY

对应：

```text
PHIOS-QA-002
P1
```

Sitemap 不再手工维护 publication content。

建立：

```text
published content authority
→ canonical public URLs
→ sitemap generation
```

Included：

```text
public home
public books
published articles
public figures
knowledge
concepts
Atlas
approved public specialist pages
```

Excluded：

```text
account-private
checkout session
payment success token
download token
QA site
review pages
internal tools
```

---

# CA-R1-W31｜SITEMAP DIFFERENCE CHECK

生成：

```text
publishedCanonicalUrls
sitemapUrls
```

比较：

```text
missingFromSitemap

unexpectedInSitemap

duplicateCanonical

nonCanonicalHost

retiredRoute
```

Acceptance：

```text
unexplained difference = 0
```

---

# CA-R1-W32｜SEARCH RESULT DENSITY REFINEMENT

对应：

```text
PHIOS-QA-014
P2
```

不要每一个 result card 都重复：

```text
SOURCE
RELATED
Across other volumes
multiple cross-volume titles
```

Main card 优先：

```text
title

type

why matched

short excerpt

source / volume

primary action
```

Related 默认：

```text
collapsed
```

或：

```text
maximum 1
```

---

# CA-R1-W33｜EXTERNAL INDEX / CACHE专项

对应：

```text
PHIOS-QA-001
P2
```

真实浏览器已经证明 production homepage 为新版。

因此此项只检查：

```text
Google Search Console
search engine indexed snapshot
social preview
Open Graph
canonical
cache
```

不得再把旧 crawler snapshot 当生产浏览器 defect。

---

# CA-R1-W34｜QA CLOUDFLARE PROJECT

创建独立 QA 项目：

```text
getphios-qa
```

Recommended origin：

```text
https://getphios-qa.pages.dev
```

不得绑定：

```text
getphios.com
www.getphios.com
```

---

# CA-R1-W35｜QA DATA ISOLATION

创建：

```text
D1
phios-runtime-sandbox

R2
phios-private-books-sandbox
```

QA 环境禁止连接：

```text
production D1
production R2
production entitlement
production customer identity
```

---

# CA-R1-W36｜QA ENVIRONMENT MARKER

QA 页面必须让 operator 明确看到：

```text
TEST ENVIRONMENT
NO REAL PAYMENT
```

同时：

```text
robots noindex

X-Robots-Tag noindex where applicable

no production analytics contamination

no QA canonical URL indexing
```

Public page canonical 如需要 canonical，应仍指向：

```text
https://getphios.com/...
```

而不是 QA host。

---

# CA-R1-W37｜STRIPE SANDBOX

Stripe 创建独立 Sandbox。

QA only：

```text
sk_test_...
whsec_...
sandbox product
sandbox price
sandbox customer
sandbox refund
```

严格禁止：

```text
sk_live
```

进入 QA。

---

# CA-R1-W38｜BOOK I SANDBOX PRODUCT

保留正式产品逻辑：

```text
Book I
one-time purchase
RM89
```

但 Stripe object 使用 sandbox。

验证：

```text
product mapping
amount
currency
success URL
cancel URL
metadata
purchase reference
```

---

# CA-R1-W39｜BOOK I QA SECRETS

QA 环境配置：

```text
PHIOS_BOOK_ONE_SALES_ENABLED=true

STRIPE_SECRET_KEY=<sandbox>

STRIPE_WEBHOOK_SECRET=<sandbox>

BOOK_ACCESS_TOKEN_SECRET=<qa unique>

BOOK_ONE_SOURCE_SHA256=<qa source>

BOOK_WATERMARK_SERVICE_URL=<qa>

BOOK_WATERMARK_SERVICE_TOKEN=<qa>

RESEND_API_KEY=<qa>

BOOK_RECEIPT_FROM_EMAIL=<qa>

PHIOS_PUBLIC_ORIGIN=https://getphios-qa.pages.dev
```

禁止 secret：

```text
commit to repo

render in HTML

log full value
```

---

# CA-R1-W40｜SANDBOX WEBHOOK

Endpoint：

```text
https://getphios-qa.pages.dev/api/stripe-webhook
```

Required event support：

```text
checkout.session.completed

checkout.session.async_payment_succeeded

checkout.session.async_payment_failed

checkout.session.expired

charge.refunded
```

每个 event 必须验证：

```text
signature

environment

idempotency

correct order

correct entitlement

audit record
```

---

# CA-R1-W41｜WATERMARK SANDBOX SERVICE

现有 watermark contract 必须有实际 QA implementation。

Required flow：

```text
sandbox payment success

→ verified webhook

→ sandbox purchase record

→ sandbox entitlement

→ private source PDF

→ buyer-specific watermark

→ derived private PDF

→ callback

→ download eligibility
```

Source PDF 不得覆盖。

Derived asset 必须绑定：

```text
purchase
buyer/test identity
order
source digest
generated digest
timestamp
```

---

# CA-R1-W42｜RECEIPT SANDBOX

使用安全 QA recipient。

不要自动给真实客户发送。

验证：

```text
product
RM89
currency
purchase reference
payment state
download instruction
support path
```

失败支付不得发送成功 receipt。

---

# CA-R1-W43｜AUTHENTICATED TEST ACCOUNT

解决原报告：

```text
Account authenticated BLOCKED
My Reality authenticated BLOCKED
```

创建：

```text
one blank QA customer account
```

不得包含：

```text
Teresa real account
real customer data
real saved Reality
real payment history
```

Required test：

```text
login
logout
refresh
saved state
resume
cross-page persistence
```

---

# CA-R1-W44｜RELEASED REPORT FIXTURE

解决：

```text
Professional Reports BLOCKED
```

建立专用 QA fixture。

至少包含：

```text
report id

test customer

released state

content

sources

history

download / print eligibility
```

不得伪造为 production customer report。

---

# CA-R1-W45｜EXACT VIEWPORT QA HARNESS

当前 Work Cloud Browser 无法切：

```text
390px
1440px
```

因此建立独立 QA browser matrix。

Recommended exact sizes：

```text
390 × 844

1440 × 900
```

这属于 QA tooling，不是新 Runtime。

可以使用：

```text
Playwright
Chrome DevTools automation
CI browser
```

Work Cloud Browser 继续负责：

```text
real customer navigation
reasoning-based usability
interactive flow
```

Exact viewport harness 负责：

```text
layout
overflow
touch target
crop
visual regression
```

---

# CA-R1-W46｜390PX MOBILE MATRIX

至少测试：

```text
Home
Header
Search overlay
Search results
Article
Book III
Book IV
Book V
Ask
Reality
Personal
Profile
Tarot
Financial
Account
Checkout
```

检查：

```text
horizontal overflow

text clipping

hero crop

button width

card overlap

fixed footer/header collision

safe-area

touch target

Tarot edge cards

Tarot overlapping hit areas
```

---

# CA-R1-W47｜1440PX DESKTOP MATRIX

至少测试：

```text
1440 × 900
```

检查：

```text
content width

hero full bleed

empty side space

card density

search layout

book explorer

figure scale

Ask sources

Tarot orbit

financial form
```

---

# CA-R1-W48｜AUDIO ACCEPTANCE BOUNDARY

当前 Work 无法证明“声音真的听见”。

因此：

```text
Work Cloud Browser
→ 可验证 control/state

human audible verification
→ 验证实际 audible output
```

必须明确分开。

Required audio test：

```text
sound ON
→ Shuffle
→ human confirms audible shuffle sound

sound OFF
→ Shuffle
→ human confirms silence
```

并记录：

```text
browser
device
OS
volume state
test timestamp
```

没有人耳确认不得写：

```text
AUDIO_PASS
```

---

# CA-R1-W49｜SLOW NETWORK / FAILURE HARNESS

QA 环境允许制造：

```text
slow response

timeout

HTTP 500

network failure

empty payload

malformed optional payload
```

不得在 production 故意制造。

测试：

```text
Knowledge
Articles
Search
Ask
Figures
Tarot API
I Ching API
Financial API
Checkout
```

验证：

```text
loading
timeout
error
retry
no duplicate request
no duplicate entitlement
```

---

# CA-R1-W50｜P0 REAL BROWSER RETEST GATE

P0 必须一次性全部复测。

## PHIOS-QA-003

Run：

```text
Search
→ book3-article-008
→ Ask about this article
→ same question
→ Sources
→ Related
→ Back
```

Must pass：

```text
selected article visible
source resolved
answer relevant
source details visible
related usable
back route correct
```

---

## PHIOS-QA-005

Run：

```text
Header Search
→ Enter

Header Search
→ Search button

Header Search
→ Open full search
```

三种都导航。

---

## PHIOS-QA-006

Run fixed query suite。

Exact target must rank correctly。

---

## PHIOS-QA-008

Run：

```text
Book III
→ degradation
→ signal
→ recovery
→ continuity
```

Customer-readable definitions required。

---

## PHIOS-QA-009

Run：

```text
Book IV
→ expansion
→ constraint
→ threshold
→ scale transformation
→ Book V
```

完整通过。

---

## P0 Gate

只有：

```text
5 / 5 RETEST_PASS
```

才允许：

```text
P0_GATE_PASS = true
```

任何一个失败：

```text
STOP
→ remediation
→ retest again
```

---

# CA-R1-W51｜P1 REAL BROWSER RETEST

逐项：

```text
PHIOS-QA-002 sitemap

PHIOS-QA-004 article shell

PHIOS-QA-007 search navigation fallback

PHIOS-QA-010 locale continuity

PHIOS-QA-011 images

PHIOS-QA-012 Escape/focus

PHIOS-QA-013 loading/error/retry
```

不能只运行 checker。

---

# CA-R1-W52｜P2 RETEST

## PHIOS-QA-001

检查外部 index freshness。

## PHIOS-QA-014

5 秒 usability test：

```text
exact Book
exact Article
exact Figure
exact Object
```

用户应快速定位。

---

# CA-R1-W53｜BOOK I SANDBOX PAYMENT SUCCESS

QA only：

```text
Book I

→ Buy

→ Stripe Sandbox Checkout

→ successful test card

→ payment-success

→ webhook

→ D1 purchase

→ entitlement

→ watermark

→ receipt

→ download token

→ download
```

每一步保存 evidence。

---

# CA-R1-W54｜PAYMENT FAILURE

Run sandbox decline。

Expected：

```text
no purchase success

no entitlement

no PDF delivery

clear failure message

retry path
```

---

# CA-R1-W55｜EXPIRED CHECKOUT

Create session。

Allow / force sandbox expiration。

Expected：

```text
no entitlement

no success receipt

customer can restart checkout
```

---

# CA-R1-W56｜REFUND

Run：

```text
successful sandbox purchase

→ refund

→ webhook

→ entitlement policy applied
```

验证：

```text
revocation

audit

receipt / notification policy

download policy
```

按现有 product contract 执行。

---

# CA-R1-W57｜WEBHOOK IDEMPOTENCY

Replay same valid sandbox event。

Expected：

```text
purchase count unchanged

entitlement count unchanged

no duplicate PDF

no duplicate receipt

no duplicate side effect
```

---

# CA-R1-W58｜W80 CONTINUITY SUBSCRIPTION GUARD

继续冻结：

```text
amountMinor = null

stripePriceId = null

quota = null

customerCheckoutEnabled = false

liveRecurringPaymentSmoke = false

productionCutover = false
```

Book I Sandbox 完成不代表 subscription 自动启用。

禁止：

```text
临时随便定价格

复用 Book I one-time price

假装 subscription live
```

---

# CA-R1-W59｜FULL CUSTOMER JOURNEY A

```text
Home

→ Header Search

→ Search result

→ Article

→ Ask

→ Sources

→ Related Knowledge

→ Back to Article

→ Explore
```

Required：

```text
correct locale
correct context
correct source
correct navigation
```

---

# CA-R1-W60｜FULL CUSTOMER JOURNEY B

```text
Home

→ Book III

→ degradation

→ signal

→ recovery

→ continuity

→ Ask
```

---

# CA-R1-W61｜FULL CUSTOMER JOURNEY C

```text
Home

→ Book IV

→ expansion

→ constraint

→ threshold

→ scale transformation

→ Book V Atlas

→ T00–T19
```

---

# CA-R1-W62｜FULL CUSTOMER JOURNEY D

```text
Home

→ Tarot

→ question

→ shuffle

→ select 3

→ remove 1

→ replace 1

→ read

→ Ask
```

Desktop：

```text
1363
1440
```

Mobile：

```text
390
```

---

# CA-R1-W63｜FULL CUSTOMER JOURNEY E

```text
Home

→ My Reality

→ guest empty state

→ login test account

→ save QA evidence

→ refresh

→ resume

→ logout
```

---

# CA-R1-W64｜FULL CUSTOMER JOURNEY F

```text
Professional

→ Financial

→ QA input

→ calculation

→ explanation

→ next action
```

不得使用真实个人财务资料。

---

# CA-R1-W65｜FULL CUSTOMER JOURNEY G

```text
Professional

→ Reports

→ QA released report

→ Sources

→ History

→ Print / PDF
```

---

# CA-R1-W66｜FULL CUSTOMER JOURNEY H

```text
Book I

→ Buy

→ Stripe Sandbox

→ entitlement

→ receipt

→ download
```

---

# CA-R1-W67｜BILINGUAL FULL REGRESSION

至少对关键旅程 A–D 各执行：

```text
English

zh-Hans
```

Locale 切换后：

```text
Refresh
Back
Book navigation
Ask
Search
```

不得丢语言。

---

# CA-R1-W68｜ACCESSIBILITY REGRESSION

Required：

```text
Tab

Shift+Tab

Enter

Space

Escape

focus-visible

focus return

menu open/close

search overlay

modal if present
```

Mobile touch 与 keyboard 分开记录。

---

# CA-R1-W69｜IMAGE REGRESSION

Browser script / Playwright 检查：

```text
document.images

naturalWidth

naturalHeight

currentSrc
```

所有 intended production images：

```text
naturalWidth > 0
```

Broken count：

```text
0
```

有意 fallback 必须在 registry 中说明。

---

# CA-R1-W70｜RUNTIME / MACHINE REGRESSION

Browser fixes完成后：

```text
npm run check
```

以及 relevant targeted suites：

```text
Ask
Search
Books
Atlas
Tarot
Financial
Commerce
Continuity
Customer UI
Publication
Sitemap
```

所有原有 frozen production behavior 不得 regression。

---

# CA-R1-W71｜CUSTOMER CAPABILITY FINAL REGISTRY

对全部 PHI OS 能力建立最终状态：

```text
ACTIVE

CONDITIONAL

INTERNAL_ONLY

QA_ONLY

BLOCKED

FUTURE

RETIRED
```

至少包含：

```text
Search
Knowledge
Articles
Figures
Books I–VII
Ask
Reality
Personal
Profile
Relationship
I Ching
Tarot
Financial
Reports
Appointments
Account
Academy
Book I commerce
Paid Ask
Continuity subscription
Health-related internal capability
```

---

# CA-R1-W72｜NO FALSE PUBLIC CLAIM CHECK

任何 customer-facing copy 不得声称：

```text
available
active
ready
purchase now
book now
save
resume
```

除非对应 capability 在 registry 中允许。

例如：

```text
Appointments

Reports

Subscription
```

若尚未 E2E，则必须准确表达：

```text
conditional
manual
coming later
requires release
```

---

# CA-R1-W73｜PRODUCTION DATA ISOLATION CHECK

QA 与 Production 必须确认：

```text
different D1

different R2

different Stripe key

different webhook secret

different access-token secret

different test identity

different receipt recipient

different environment origin
```

禁止任何 test record 进入 production。

---

# CA-R1-W74｜PRODUCTION CANONICAL CLOSURE

Final：

```text
https://getphios.com
```

确认：

```text
https://www.getphios.com
→ 301
→ https://getphios.com
```

同时：

```text
sitemap apex only

canonical apex only

no pages.dev production canonical

no QA canonical leakage
```

---

# CA-R1-W75｜FINAL WORK CLOUD BROWSER RUN

重新运行同一 Cloud Browser 全站任务。

继续沿用：

```text
PHIOS-QA-001 onward
```

禁止重新编号。

报告必须明确：

```text
PASS

FAIL

NOT_RUN

BLOCKED
```

Dynamic collection 必须报告：

```text
total

tested

sampling rule

untested
```

---

# CA-R1-W76｜FINAL COVERAGE REQUIREMENTS

Minimum required：

```text
25 current canonical public routes
```

加：

```text
authenticated Account QA
authenticated My Reality QA
released Report fixture
sandbox checkout
sandbox payment success
sandbox payment failure
sandbox refund
sandbox entitlement
sandbox download
```

---

# CA-R1-W77｜FINAL P0 RULE

Final acceptance：

```text
P0 OPEN = 0
```

绝无例外。

---

# CA-R1-W78｜FINAL P1 RULE

目标：

```text
P1 OPEN = 0
```

若仍存在 P1：

必须有：

```text
explicit owner

customer impact

accepted reason

temporary mitigation

closure date
```

不能默认为 accepted。

---

# CA-R1-W79｜FINAL NOT_RUN RULE

以下不得被隐藏：

```text
audio

specific viewport

payment edge cases

authenticated flow

network failure
```

如果仍未运行：

必须保留：

```text
NOT_RUN
```

不能改成 PASS。

---

# CA-R1-W80｜FINAL EVIDENCE PACKAGE

生成：

```text
customer-activation-r1-final-report.md

customer-activation-r1-issue-registry.json

customer-capability-final-registry.json

browser-coverage-matrix.json

commerce-sandbox-evidence.json

sitemap-diff.json

image-health-report.json

locale-regression-report.json

search-regression-report.json

ask-context-regression-report.json
```

---

# CA-R1-W81｜FINAL PRODUCTION READINESS DECISION

分别做决定：

```text
PUBLIC_SITE_READY

BOOK_I_COMMERCE_READY

ACCOUNT_CONTINUITY_READY

PROFESSIONAL_REPORTS_READY

PAID_ASK_READY

CONTINUITY_SUBSCRIPTION_READY
```

不能用一个总 PASS 自动覆盖所有 subsystem。

---

# CA-R1-W82｜BOOK I LIVE COMMERCE CUTOVER GATE

只有 Sandbox：

```text
success
failure
expiration
refund
webhook
idempotency
watermark
receipt
download
```

全部通过后，才允许另立 controlled production cutover。

Sandbox PASS：

不等于：

```text
live Stripe enabled
```

---

# CA-R1-W83｜CONTINUITY SUBSCRIPTION SUCCESSOR GATE

只有未来正式确定：

```text
price

currency

billing period

quota

entitlement

cancellation

refund

failed payment

renewal

Stripe recurring price

subscription webhook

customer UX
```

才允许进入新的 subscription activation work。

在那之前：

```text
customerCheckoutEnabled = false
```

继续冻结。

---

# CA-R1-W84｜FINAL FREEZE CONDITIONS

全部满足才允许：

```text
PHI_OS_CUSTOMER_ACTIVATION_ACCEPTED = true
```

Required：

```text
P0 = 0

P1 = 0
or formally accepted with explicit written exception

PHIOS-QA-003 CLOSED

PHIOS-QA-005 CLOSED

PHIOS-QA-006 CLOSED

PHIOS-QA-008 CLOSED

PHIOS-QA-009 CLOSED

Ask contextual source chain PASS

Header Search PASS

Search relevance PASS

Book III meaning chain PASS

Book IV meaning chain PASS

Book IV → V PASS

Article shell PASS

locale continuity PASS

broken image count = 0

Escape/focus PASS

loading/error/retry PASS

390px PASS

1440px PASS

EN PASS

zh-Hans PASS

Tarot desktop PASS

Tarot 390 PASS

Tarot sound human verified

authenticated QA account PASS

released report fixture PASS

Stripe Sandbox PASS

entitlement PASS

watermark PASS

receipt PASS

download PASS

sitemap diff explained = 0

production data isolation PASS

npm run check PASS

final Work Cloud Browser report complete
```

---

# 5｜CURRENT PRIORITY EXECUTION BLOCK

现在不要先做 Stripe。

正确的立即执行顺序是：

```text
FIRST

PHIOS-QA-003
Contextual Ask

↓

PHIOS-QA-005
Header Search

↓

PHIOS-QA-006
Search ranking

↓

PHIOS-QA-008
Book III structured meaning

↓

PHIOS-QA-009
Book IV structured meaning

↓

P0 REAL BROWSER RETEST
```

只有 5 个 P0 清零后：

```text
Article shell
locale
visuals
navigation fallback
Escape
loading
sitemap
```

之后再进入：

```text
QA Cloudflare environment

Stripe Sandbox

Watermark Sandbox

Account fixture

Report fixture

390 / 1440 browser matrix

Commerce E2E
```

---

# 6｜WHY THIS ORDER IS FROZEN

当前最大风险不是：

```text
付款不能测试
```

而是：

```text
用户甚至还不能稳定找到正确内容

找到文章后 Ask 会丢掉文章 source

Book III / IV 的核心理论还不能被客户真正理解
```

因此不能先花主要时间完善 payment，然后保留：

```text
broken Search
broken contextual Ask
unfinished core books
```

Customer acquisition path 必须先正确：

```text
Discover

→ Understand

→ Ask

→ Trust

→ Continue

→ Purchase
```

而不是：

```text
Purchase infrastructure complete

but product understanding broken
```

---

# 7｜FINAL TARGET CUSTOMER EXPERIENCE

最终第一次客户应该可以：

```text
打开 getphios.com

→ 一眼理解 PHI OS 是什么

→ 搜索一个问题

→ 找到正确 Book / Article / Figure

→ 阅读内容

→ 针对当前内容 Ask

→ 看见真实 selected source

→ 得到真正回答当前问题的答案

→ 查看 Sources

→ 回到原内容

→ 继续 Explore

→ 进入自己的 Reality

→ 使用 Perspectives

→ 使用 I Ching / Tarot

→ 理解 Books I–VII

→ 从 Book III 理解维持与连续

→ 从 Book IV 理解扩展与尺度转换

→ 进入 Book V Civilization Atlas

→ 如果需要购买 Book I

→ 安全完成付款

→ 获得 entitlement

→ 收到 receipt

→ 下载属于自己的文件

→ 日后登录继续
```

全过程不得出现：

```text
假 source

错误 Book label

泛化 Ask

搜索结果噪声淹没 exact result

语言突然切回 English

broken images

永久 Loading

不可退出 overlay

fake booking

fake report availability

test payment 污染 production

未验证却声称 PASS
```

---

# 8｜FINAL GOVERNANCE STATEMENT

本工作完成以后，PHI OS 的验收标准不再是：

```text
后台有没有这个能力
```

而是：

```text
一个真实客户
是否能够找到它
理解它
使用它
相信它
继续它
并在需要时安全购买它
```

只有真实浏览器证明这一点，能力才算真正进入 Production Customer Experience。