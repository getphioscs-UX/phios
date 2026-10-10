# PHI OS · WORLD × CIVILIZATION ATLAS
## UNIFIED READING + EVIDENCE RELATION + MULTI-SCALE VISUAL RECOMPOSITION R1

完整 Codex Master Work Step｜执行授权：本地源码、数据、界面、检查与审阅交付｜不自动 commit / push / deploy

## 0. 直接执行指令

在 getphioscs-UX/phios 当前 main 上完成本文全部整改。先读取当前 AGENTS.md、GOVERNANCE.md、相关 source-owner 与既有验收规则，再核对真实源码。本文授权完成 World 范围内必要的可逆实现与检查，不要仅交计划、新增 resolver、登记资产或运行某个检查后宣布完成。不得覆盖其他窗口的未提交修改；不要 reset、clean、强制 checkout 或自动提交推送。冲突时保留既有工作并采用最小兼容修复；只有实质无法并存的问题才说明阻碍。

任务目标：读者能够在 World 中看懂当前发生的变化、涉及的文明结构、历史形成与不同尺度下的差异；能够独立探索历史，也能从当前问题进入结构阅读。统一入口与阅读上下文，保留第五册和第六册各自的数据、证据、接受记录与解释职责。

本文是全面整改范围，不允许把三个示范议题当作全站完成。三个议题只用于先验证设计，随后必须覆盖所有现有公开 World 对象、视图和可用资产的适配、审计与状态交付。没有证据的对象如实呈现缺口，不能补造关系或事实。

## 1. 基线与已发现问题

本指令依据已读取的 main：b046b206138526ca94bb81e2ae82a7abead9c17c（page combine，2026-10-10 21:12:29 Asia/Kuala_Lumpur）。它是审查基线，不是必须回退的目标。开始执行时记录实际 HEAD、origin/main 和工作区状态；如果 main 已前进，以当前源码重新确认差异，并保留新成果。

已核对文件：

- world/index.html
- assets/js/pages/world.js
- assets/js/pages/civilization-atlas.js
- assets/js/pages/book6-reconfiguration-atlas.js
- assets/js/pages/civilization-atlas/atlas-data.js
- assets/js/pages/civilization-atlas/atlas-shell.js
- assets/js/pages/civilization-atlas/cross-layer-context.js
- assets/js/pages/civilization-atlas/atlas-reading-bridge.js
- assets/js/pages/civilization-atlas/world-explorer.js
- assets/js/pages/civilization-atlas/reconfiguration-renderer.js
- content/civilization-atlas/snapshots/world-snapshots-v1.json
- content/civilization-atlas/reconfiguration/book-vi-atlas-relationships-v2.json
- functions/api/book6-runtime-readout.js
- functions/_lib/book6-current-source.js

审查基线上的具体问题：

1. Current World Snapshot 入口指向 BOOK-5 的 WS-2026；它是开放历史切片，不是独立当前证据读出。
2. WS-2026 的 majorCities 内容是疫情、AI、能源转型、供应链、数字主权、气候适应等议题；这是数据类别错误。
3. WS-2026 的 evidenceRefs 为空；技术、能源与网络字段包含通用描述，不能当作具体 2026 现况。
4. world.js 通过 view=reconfiguration 选择两套渲染器；共用 URL 尚未形成连续阅读。
5. atlas-reading-bridge.js 仅针对 CA-T14-01 → RC-01 → DOSSIER-JP 提供明治日本阅读桥。
6. cross-layer-context.js 已能在 BOOK-5 内关联案例、时间、比较、切片、轨迹、转型与损失；应复用并补齐，不重新造同类状态系统。
7. 当前证据由第六册 /api/book6-runtime-readout 和 W8-I 接受投影读取，不能用 W8-H 接受、历史数据或某个年份替代当前可发布状态。
8. world-explorer.js 在 search 模式无 query 时主动返回空数组，随后展示 0 results 和 No matching sources；这是未开始搜索与无匹配状态混淆。
9. 搜索地区标签缺失时回退 Source object，阅读层直接暴露技术分类。
10. 原线上观察曾出现重复 AI 图片、不可用放大按钮，以及首屏大段平台与边界说明。需用当前源码和实际渲染重新检查，不能直接假定所有图片加载失败。

## 2. W00｜建立任务基线和完成台账

在实际仓库根目录执行，Windows 可用 PowerShell，其他环境使用对应 shell：

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
git log -1 --format=fuller
git diff --stat
rg --files -g AGENTS.md -g GOVERNANCE.md
rg -n 'world|civilization|reconfiguration|atlas' package.json
```

若需更新远端信息，先 git fetch origin main；fetch 不代表可以 pull 覆盖本地工作。确认 main 差异后在用户指定 main 工作区继续，不自动创建另一套生产目录。

建立任务记录目录，遵守仓库已有文档命名规范。拟定名称如与 owner 规范冲突可调整，但交付内容不得省略：

- WORLD-R1-BASELINE.md：SHA、脏工作区、相关文件与既有修改。
- WORLD-R1-OBJECT-COVERAGE.json：所有公开对象、数据类型、视图、证据状态、关系与整改结果。
- WORLD-R1-ASSET-COVERAGE.json：逐资产绑定、适配、不适用理由与实际加载结果。
- WORLD-R1-VALIDATION.json：同一最终源码快照的检查、构建与浏览器记录。
- WORLD-R1-CLOSURE.md：完成、缺口、部署状态和用户验收入口。

完成标准：台账覆盖真实 registry，不能手工挑选三个对象形成假全覆盖。

## 3. W01｜确认 owner、对象类型与现有能力

逐项读取 loader 指向的 registry、schema、renderer、URL state、Ask context、搜索索引生成脚本与相关检查。读取 functions/_lib/book6-accepted-current.js 及实际 W8-I 对象，确认当前发布规则、freshness、accepted scope 和未激活状态。不要根据历史记忆推定某地区已激活。

绘制并记录现有能力映射：

| 能力 | 复用范围 |
|---|---|
| BOOK-5 | 历史时期、文明案例、世界历史切片、比较、长时段轨迹、转型、逆转与损失 |
| BOOK-6 | 重组案例、窗口、切片、地区档案、日常现实维度、已接受当前子系统 |
| 视觉 | approved bindings、static visual resolver、projection、template slots、visual-runtime |
| 阅读 | 既有 store、URL state、跨层上下文、固定链接、Ask retrieval scope |
| 用户后续 | 已有公共来源保存、账户接口与 My Reality 引用 |

必须区分历史文明、现代国家、区域、当代议题、基础设施、网络、事件、切片与来源。相同 registry 中历史遗留混合对象可兼容保留 ID，但公开类型、筛选与栏目必须准确。不能仅把所有“文明”改成“议题”，损失历史语义。

完成标准：每个新组件都有明确既有 owner；没有平行接受系统、第二套当前证据 registry 或重复搜索服务。

## 4. W02｜统一 World 产品结构

World 保留 /world/ 作为主入口；旧固定链接和书籍中的 Atlas 嵌入继续可用。不要新建重复解释平台的页面。

主入口提供三种阅读意图：

1. 世界现况 / Current World：从有时间与来源的地区或系统变化进入。
2. 文明结构 / Civilization Structures：从历史对象、基础设施、形成与延续进入。
3. 比较与变化 / Compare & Change：跨地区、时期、系统、轨迹、转型与损失阅读。

主入口不是固定线性步骤；用户可任选进入并双向继续。BOOK-5 和 BOOK-6 是来源职责，不要求客户先理解书籍编号才能使用。

页面实际结构：

| 位置 | 内容与交互 |
|---|---|
| 首屏 | 深蓝／深青绿、暖金的具体世界视觉；中文“世界正在怎样变化？这些变化从何而来？”及语义对应英文；三入口；可见资料日期与覆盖范围 |
| 当前阅读条 | 当前对象、地区／范围、系统、时间、阅读方向；允许回退和清除，保留可分享 URL |
| 主阅读区 | 对象专属图示、简洁解释、相关变化、结构关系、明确后继对象 |
| 关系区 | 已登记的关系及一到两句机制解释，可打开另一对象并返回 |
| 来源详情 | 来源、日期、证据范围、未知与争议，展开查看 |
| 后续操作 | 带当前对象提问、保存公共引用、进入已有相关现实维度 |
| 搜索 | 明确搜索入口；筛选展开；视觉目录仍可独立浏览 |

首页预览现有证据支持的代表对象，而非空壳。如果没有可展示的当前投影，呈现具体可读历史／结构入口并说明当前覆盖缺口，不能展示假当前卡片。

首屏不要再叠加 World intro、Atlas intro、search intro 三套大段说明。源头边界保留在相应事实旁与详情层；不能删掉会改变理解的日期和证据状态。

## 5. W03｜修复历史切片、现况入口和类型错误

保留 WS-2026 ID 与已有引用，将公共名称／说明明确为“2026：开放历史窗口”或同等准确表达。它不能独自承担 Current World。

处理 majorCities：审计所有切片，不只 WS-2026。错误议题从城市字段移出；真实城市只有在已有可信资料支持时保留。无城市数据时隐藏该栏目或简洁说明暂无资料，不能从议题名称推造城市。更新衍生索引、投影与检查，避免修正源文件后缓存继续显示旧值。

处理通用描述：将其识别为解释框架或待补内容，不能包装成时代事实。有具体来源则替换为该对象的真实内容；没有则收起空栏目并显示恰当缺口。禁止为了看起来完整自动填充文字。

Current World 复用 BOOK-6 accepted projection。默认入口可以是已接受子系统的跨地区摘要，但每项必须可追溯到具体 dossier 和来源；不能把不同日期证据拼成“全球今日统一读出”。

对每项呈现：对象、范围、具体已支持陈述、证据截至日期、来源更新时间、可见 freshness、覆盖局限。过期证据保留为有日期的历史记录；API 失败不得静默变成“未知所以没有事情发生”。区分服务失败、未激活、无证据、过期和部分覆盖。

当前数据以现有 accepted owner 为准。本文不授权 Codex 自动 Human ACCEPT、激活未接受位置、变更 W8 决策或产生预测。

完成标准：现况入口不再只靠年份识别当前；城市栏目没有议题；所有“当前”陈述可追溯到 accepted scope 与证据日期。

## 6. W04｜建立可解释的跨图谱关系

复用现有关系 registry 和明治阅读桥，扩展为共享关系投影。优先补公共显示与既有关系消费；只有 schema 确实不足时才在既有 owner 下增量扩展。

一条关系至少需要：稳定 relation ID、两端对象引用与类型、关系类型、适用时间／范围、依据引用、中英解释、发布资格／状态。现有登记只支持“相关”时保留为阅读关联，不升级成因果证据。

建议公共关系类型：

| 关系 | 意义 |
|---|---|
| 历史形成 | 某结构形成路径可帮助理解另一对象 |
| 延续与继承 | 有资料支持的制度、基础设施或网络延续 |
| 重组与替代 | 已登记的系统调整、替代或重新连接 |
| 网络依赖 | 有来源支持的贸易、能源、物流、支付等联系 |
| 比较参照 | 有共同维度的比较，不暗示相同发展路径 |
| 阅读关联 | 主题上可继续阅读，不构成事实机制判断 |

必须明确：关系 ≠ 因果；历史相似 ≠ 今日重复；来源登记 ≠ 当前已接受；当前子系统 ≠ 整个国家结论。

逐对象审计：已有关系消费、遗漏关系补接、仅有主题关系标记、无关系显示缺口。不能从标题相似、国旗相同或 AI 猜测生成当前机制。

先选三个真实支持的议题作为垂直验证，建议从现有能源、生产／物流、数字／支付能力中选择，具体由当前 registry 决定。每个必须实现现况 → 系统 → 历史 → 比较 → 返回。随后把共享实现适配到全部已有公开对象。

完成标准：用户看得到“为什么相关”；明治专用硬编码不再是唯一桥；所有关系保留来源资格。

## 7. W05｜尺度、系统与阅读方向

将选择分为不同轴，避免把年代、国家、系统与阅读方式放在同一个菜单：

- 范围：全球／区域／国家／地方；只有数据支持的层级可用。
- 系统：能源、生产、物流、金融、制度、知识、生态及现有 registry 支持的其他类别。
- 方向：现况／形成／比较／变化。
- 时间：当前证据时点／选定时期／跨时期。
- 生活关联：已有工作、成本、住房、健康等日常现实维度。

复用既有 state 与 URL codec；必要时新增一个轻量公共上下文适配层，不另外建立平行 store。BOOK-5 和 BOOK-6 原生状态仍作为各自 renderer 的输入。

切换规则：

1. 同对象切换方向，保留兼容的地区、系统、时期和来源引用。
2. 不同尺度有真实对应对象时才切换；没有对应时保留原对象并说明该尺度暂无资料，或请求用户选择明确候选。
3. 不默认跳到 registry 第一个对象来假装保留上下文。
4. 多个对应对象显示选择，不能自动挑选一个制造唯一关系。
5. 比较需显示时间、维度与证据可比性；禁止合成普遍国家排名。
6. 前进／后退、刷新、固定链接、中英切换还原相同阅读状态。
7. 历史轨迹、转型、逆转与损失仍可直接访问，不能整改后只剩三入口和三议题。

生活关联作为公共影响路径或观察维度；不把国家结构推定为用户个人事实。复用既有同意与引用流程，不在浏览 World 时自动写入个人档案。

## 8. W06｜视觉与资产全面接线

使用已有 R2 approved bindings 与 resolver，审计真实对象和字节可达性。不要再批量生成新图，也不要下载近 400 张图进源码。新增精确关系图优先使用 HTML／SVG，文字由网页与 i18n 承载。

主视觉规范：

- 深蓝、深青绿、暖金、有色彩的地区／系统强调，保持 PHI OS 一致性；不使用大片白底。
- 每条连线要有对象、关系意义与来源资格；不能用随机金线表示复杂性。
- 大幅图旁有可读解释与可操作入口；海报式图片不能替代结构化内容。
- 历史插画与精确数据图区别清楚；图内文字与国界不能成为未经验证的证据。
- 避免重复同一 asset 或同一对象卡；保留真正不同视角并说明用途。
- 按实际图片比例处理 contain／crop；不能裁掉关键地图或图中文字。
- 手机改为可阅读的分区、列表或局部关系视图；不把整张密集图缩成无法读的小图。
- 关系图附文本等价阅读；颜色不承担唯一含义。
- 加载失败提供对象信息、具体状态和正常后续入口；不得出现空资源节点。
- 放大成功则可操作；资源不可用时明确说明，不能留下无解释的 disabled 按钮。

逐资产台账字段：assetId、bucketKey、publicUrl、关联对象、实际公共位置、用途、加载状态、去重处理、未采用理由。所有现有目标资产均需有处理结果；不适用可以不展示，但必须解释具体原因。不得以 asset registry 存在代替页面已绑定。

打印：当前对象、关系解释、证据日期和来源可打印；隐藏无用筛选、弹窗与重复导航；无截字、叠字或分页切断。长图可有打印专用布局。不要把全站截图输出到生产目录。

## 9. W07｜搜索与 Visual Atlas

复用 world-search-index-v1.json 的真实生成 owner，修复索引源与展示，不另建搜索后端。

未输入搜索词：显示“搜索世界资料”及少量已有可读推荐／浏览入口，不显示 0 results 或 No matching sources。

执行查询后：显示匹配对象及为什么匹配；无结果才显示无匹配提示；服务失败显示无法加载，不能与无结果混淆。

公开筛选优先只显示搜索、地区、时期／当前、对象类别；系统与证据等展开查看。技术 layer、raw enum 和 Source object 不能成为公共标签。地区缺翻译修复源映射，不把所有地区改成同一个占位名。

Visual Atlas 保留独立图片浏览，但每张图必须可打开真实关联对象；没有对象关系的图不能假造。图片计数、分页、family 与 subject 选择准确；重复项从生成或投影层去重，不靠隐藏 DOM。

检查旧参数 q、explore、searchBook、searchType、searchRegion、searchState、familyFilter、subjectFilter、searchLayer、searchPeriod、hasVisual、resultPage 的兼容性，保留可用深链接。

## 10. W08｜Ask、保存与来源详情

沿用现有 Ask 接口与 retrievalScope。不要靠读取第一个 Ask anchor 再从 DOM 反推活动对象作为唯一状态来源；改为从真实活动 store／明确上下文事件投影，兼容原有接口。

Ask 必须包含当前对象、时期／证据日期、地区、系统与相关来源的准确范围；链接名称直接说明对象，不能所有按钮都只有泛泛“Ask with World context”。

无真实当前证据时仍可提出历史／结构问题，但 scope 不得暗示 current 已接受。语义导航到另一对象后，Ask 与固定链接同步更新。

保存复用 /api/account-world-contexts、身份验证与既有 consent。保存的是公共引用，不是个人事实；未同意不发 POST；401、失败、成功分开显示。保存成功后保留返回原阅读位置的能力。

主读区用简洁来源标签；技术 ID、registry、schema、W8、admission enum、内部验收旁白置于必要的技术详情，客户正文使用准确日常表达。

## 11. W09｜双语与可访问性

中文主界面与英文语义对应，不能逐词拼接。沿用现有 i18n owner，避免再叠加另一套全文替换 observer。检查 localizeWorldCopy 与 renderer 的双重替换、重复 render 和 MutationObserver 循环。

标题、关系、系统、地区、筛选、空态、错误、日期、图片说明、Ask 和保存均覆盖中英。来源原标题可保留原文并标注来源，但不能把未翻译系统标签伪装成来源英文。

键盘、焦点、selected／pressed 状态、图示文本替代、对比度、弹窗关闭、手机触控尺寸按既有 accessibility 实现修复。切换语言不清空对象和筛选。

## 12. W10｜性能、加载和部署兼容

审计 world.js 顶层 relatedData await 与 Atlas import 的依赖，独立加载允许独立成功；一个辅助关系 registry 失败不能导致整个 World 空白。

BOOK-6 dossier 加载目前逐地区请求 API。根据现有接口与真实性能优化请求和缓存，不扩大当前证据权限；在需要地区详情时按需加载，首页摘要如需批量投影必须继续复用现有 accepted owner。

图片 lazy load、响应式尺寸、固定空间和按视图加载，避免重渲染重新请求所有资产。保留明确 loading、partial、error 状态。

Cloudflare Functions import 规范、Pages 文件大小、静态资源路径、cache busting、旧固定链接和 _redirects 都必须检查。任何发布数据同步必须走现有构建流程，不直接修改生成物掩盖 owner 问题。

## 13. W11｜测试与全覆盖验收

先读取 package.json，发现真实脚本再执行。下面新增名称是拟定，不声称仓库已有这些脚本。将必要新增检查接入既有 zero-cost regression owner；不得绕过 spend protection 或调用付费 provider。本文无需 OpenAI key。

建议新增或扩展：

- check:world-r1:object-integrity：类型、城市字段、当前资格、重复和引用完整性。
- check:world-r1:relations：两端引用、类型、时间、依据、发布资格。
- check:world-r1:context：跨图谱切换、缺映射、多候选、URL 往返。
- check:world-r1:search：未搜索／无匹配／加载失败／地区标签及索引消费。
- check:world-r1:publication：双语字段、资产绑定、当前日期与证据范围。

重点行为测试：

1. WS-2026 不能标为独立当前证据；majorCities 没有议题。
2. 当前 accepted、未激活、过期、部分覆盖、API 失败显示不同状态。
3. 明治和至少三个非明治真实关系路径可进入、返回、分享。
4. 同对象不同方向与尺度不静默跳到无关对象。
5. 历史图谱全部既有阅读方向保留。
6. 搜索空输入没有假无结果；输入、筛选、分页及 visual 模式正确。
7. 图片失效不会丢失对象信息；重复资产消除；放大正常。
8. Ask scope 与活动对象一致；保存没有同意时无写请求。
9. 中英、刷新、back／forward 保留状态。
10. 关系缺证据时不产生因果陈述或国家／个人判断。

浏览器验证矩阵：桌面约 1440px、手机 390px；中文／英文；World 首页、现况、历史案例、历史切片、比较、轨迹、转型、损失、地区 dossier、日常现实、搜索、Visual Atlas；至少一处打印预览。

对 registry 做全部对象结构检查，对浏览器使用代表场景及边界场景，不为近 400 图生成几百张截图。仅保存能证明关键布局和修复的少量截图；临时截图、浏览器 trace 和缓存留在已忽略的临时目录，审阅页引用必要压缩证明。不要大规模删除历史证据，先依已有保留规则整理。

运行现有相关 Atlas／World／W8 accepted-current／Ask／账户保存／i18n／asset resolver 检查和 Pages 构建。全站 required checks 如因其他任务失败，要列明归属与错误；不得写全站 PASS，也不能因此省略本任务已授权可独立完成的工作。

## 14. W12｜审阅与最终交付

创建 tools/review/PHIOS-WORLD-CIVILIZATION-R1-HUMAN-REVIEW.html（若已有对应文件则更新）。审阅页必须由最终真实实现和台账产生，不能独立做一个漂亮 mockup 冒充修复。

审阅页内容：

- 当前基线和最终源码摘要；与其他窗口工作的兼容说明。
- 三种主入口的实际页面链接。
- 三个完整关系示例及其来源。
- 所有现有视图、对象、地区和资产处理覆盖统计。
- 手机／桌面、中英与打印的代表证据。
- 城市错配、现况入口、搜索空态等修复前后说明。
- 数据缺口、无对应关系、未激活接受状态与具体原因。
- 所有检查和构建结果，失败项目不可改写成 PASS。
- 部署与线上验证状态分别列出。

交付源码、必要数据变更、检查、台账、审阅入口和简明 closure。不要 delta zip；不要自动 commit、push、部署或修改外部接受状态。

最终回复必须区分：IMPLEMENTED、VALIDATED_LOCAL、READY_FOR_HUMAN_REVIEW、DEPLOYED、LIVE_VERIFIED。未部署明确写 NOT_DEPLOYED；本地 PASS 不能代表线上已修好。若用户随后明确授权发布，再执行既有部署流程并验证同一提交的线上页面。

## 15. 整体完成判据

只有以下全部成立，才可宣布本地整改完成：

- World 三种阅读入口都有真实内容和后续操作。
- Current World 读取既有当前证据 owner，历史年份不替代当前资格。
- 全部现有对象完成类型、关系、显示和状态审计；不存在议题冒充城市。
- 历史与当前职责保留，跨图谱关系明确且有依据。
- 范围、系统、方向、时间与生活关联可理解；没有不支持的伪尺度切换。
- 已有轨迹、转型、损失、比较等能力仍可使用。
- 资产逐项有真实绑定或具体不适用理由；无重复堆图和空节点。
- 搜索未开始、无匹配与失败状态区分。
- Ask、保存、来源详情与真实当前对象一致。
- 中英、手机、桌面、打印和必要检查验证完成。
- 审阅文件真实存在，台账和验证对应同一最终源码快照。

任何一项未完成，交付 PARTIAL 和剩余清单，不把“新增模块”“registry 已登记”“某项脚本 PASS”写成全面完成。

## 16. 给执行 Codex 的最终约束

请直接执行 W00–W12，直到所有可以在本地完成的整改和验证完成。不要停在架构说明或请求用户重复授权。本任务的产品方案已确认；日常布局、组件拆分、旧参数兼容与共享模块复用由你依据仓库作实现判断。发现已完成部分先验证复用，避免重做。历史与当前事实必须由真实资料支撑；资料不足时完成界面、状态、导航与缺口呈现，不用新事实填满页面。提交最终可审阅结果，而不是下一轮工作建议。
