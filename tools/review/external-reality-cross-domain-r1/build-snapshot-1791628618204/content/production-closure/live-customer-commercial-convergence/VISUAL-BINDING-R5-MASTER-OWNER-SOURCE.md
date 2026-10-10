# PHI OS · VISUAL ASSET FULL-SITE BINDING R5
## 89张已上传新图＋现有Hero／Brand／Icons／商品图的全站实际绑定、回归与人工验收

**执行性质：本地源码实施、R2只读核对、真实浏览器验证、唯一Master交付。不是新一轮设计计划。**

**素材状态：用户本轮明确报告89张图已经设计完成并上传。不得继续按R4的PLANNED／NOT_UPLOADED等待设计；也不得把用户上传报告自动改写为REMOTE_VERIFIED、BROWSER_PASS或生产已发布。**

**本工单版本R5不改变任何图片的v1／v2文件名。**

## W00｜任务完成的定义与权限

继续仓库`getphioscs-UX/phios`的现有唯一Master。目标不止增加Registry：每张新图必须有明确消费者、合适图位、准确来源、实际显示证据和后续维护位置。所有现行页面必须被清点，适合用图的页面实际绑定，不适合的页面给出明确理由。不要把89张图全部塞进每个页面，也不要在底部重建“展开主题总结图”大合集。

本轮授权本地页面、样式、resolver、必要的资产注册后继、绑定配置和测试修复；允许读取已上传公共R2素材，并利用已有受控本地QA验证界面。直接实施可完成的工作，不再停在“建议如何绑定”。

不授权：重新设计或调用模型重画；付费provider调用；真实付款/发邮件/预订；生产数据库迁移；R2重命名、复制、删除、覆盖或重新上传；Cloudflare域名/缓存策略/CORS的生产变更；自动commit/push/deploy；修改冻结报告正文或计算、NAV、账户、权益、同意权威。

页面导航、筛选、弹窗、缩放、折叠、标签切换可以修复；涉及新的业务权限或生产行为必须隔离报告。局部阻塞不能成为停止其余绑定的理由，也不能通过假数据或弱化断言掩盖。

## W01｜唯一输入基线及最新纠正

使用以下输入，不重新手抄资产文件名：

- `PHIOS-NEW-89-R2-MANIFEST-R4.csv`：89张准确主文件名及R2 key的原始底稿。
- `PHIOS-VISUAL-ASSET-MASTER-R4.xlsx`或HTML：原计划、图位、复用与排除边界。
- `PHIOS-VISUAL-BINDING-R5-INPUT.json`：本轮89张执行目标与最新纠正；它是工单输入，不是第二个生产Registry。
- 当前用户消息：设计/上传完成、Brand/Hero/Icon纠正。
- 当前仓库的正式资产、路由、产品和运行权威：确认实际消费者与边界。

最新用户纠正只覆盖对应资产身份、文件名和上传状态，不自动改变其他业务规范。原R4文件保留为历史输入；生成本轮状态后继，不回写伪造旧记录。

### 1. 固定R2位置

```text
Bucket: phios-public-assets

images/figures/Entrance/     81张，E必须大写
images/figures/financial/     8张，仅B04／序号25–32
```

以R4的`object_key`为准，不按文件前缀推断目录。特别是三个新Hero、八册说明图标、Will、现金流游戏和自然体验图仍在`Entrance/`；不移入`images/hero/`、`images/icons/`或财务目录。忽略R4的`r3_object_key`旧路径作为实际下载目标。`(new)`不是文件名的一部分。

### 2. 本轮确定的品牌、Hero与图标身份

| 身份 | 当前正确文件名／含义 | 实施要求 |
|---|---|---|
| BRAND-007 | `PHIOS-BRANDING-BOOK-7-REALITY-OBSERVATION-v1.webp` | 从当前品牌owner核对实际父目录，不用旧Book6 Observation文件替代。 |
| BRAND-008 | `PHIOS-BRANDING-BOOK-8-REALITY-NAVIGATION-v1.webp` | 从当前品牌owner核对实际父目录，不用旧Book7 Navigation文件替代。 |
| HERO-021 | `images/hero/PHIOS-HERO-RELATIONSHIP-v2.webp` | Relationship首屏。 |
| HERO-022 | `images/hero/PHIOS-HERO-PERSONAL-EVIDENCE-v2.webp` | Profile首屏。用户粘贴的尾反引号视为待核格式差异，不擅自拼进URL。 |
| HERO-023 | `images/hero/PHIOS-HERO-MEMBERSHIP-CONTINUITY-v2.webp` | 当前Membership首屏。 |
| EIGHT-BOOKS | `assets/icons/global/`下当前正式八册UI图标 | 查清实际文件名及扩展名；不得猜成某个不存在的SVG。 |

`HERO-019`塔罗、`HERO-020`易经，以及其余未变更Hero，继续使用已核实的现行文件身份。本轮不要恢复R3建议的Profile=HERO-031。

### 3. 必须解决的旧编号冲突

旧附件Book1也曾使用`HERO-023`，更早注册表还存在HERO-019–023对应书册的历史。禁止全局字符串替换或按同号覆盖。

先建立`来源Registry版本＋旧assetId＋消费者→明确语义assetId→objectKey`映射。当前Membership按用户指定使用HERO-023；旧Book1调用迁往既有明确书册身份，若缺少才增设不冲突的书册语义别名。书册文件、书号、书名、购买身份和冻结出版引用不变。未获新的数字编号表前不自行把八册顺延到HERO-024–031。

一个当前全局resolver不能同时让HERO-023代表Membership和Book1。迁移要么先完成全部受影响调用后切换，要么使用明确版本/命名空间的适配入口；禁止按URL猜测同一ID应该显示哪张图。未识别的歧义调用明确报错，不随机返回其中一张。

`PHIOS-ICON-EIGHT-BOOKS-ICON-v1.webp`是89张中的第85项说明素材；它与正式EIGHT-BOOKS UI图标分开注册。小尺寸按钮/导航优先使用正式可读图标；不得将WebP包进SVG冒充矢量。不要仅因旧JS文件名含seven-volume就改名整个脚本，检查的是最终八册语义和实际输出。

## W02｜工作树、并行任务与成本控制

```powershell
Set-Location C:\phios
git rev-parse HEAD
git status --short
git diff --stat
git log -5 --oneline
```

不自动pull、reset、clean或stash。确认当前分支与本地工作树；若另一个窗口正在修改同文件，记录file hash并协调最小合并，不覆盖其内容。测试证据绑定`HEAD＋当前工作树sourceDigest＋素材digest`，不能仅凭HEAD认定相同源码。

只做一次完整输入清点和路由发现，保存机器可读取结果。按B01–B11分区实施、每区保存检查点并继续；不要求用户逐区重新发“继续”。中断后读取检查点，只有文件、依赖、图位或素材hash改变的证据失效，不能反复重跑全部资料。

一次性下载/读取每个素材用于核对，后续复用本地缓存；只重试失败GET，并设并发、超时及重试上限。模型生成调用和真实支付保持0。R2/网络读取按实际请求计数，不能把它们宣称为绝对零基础设施费用。

## W03｜重新发现全站路由，不沿用旧走查完成数

从当前sitemap、`_redirects`、Pages发布边界、被跟踪的HTML、公开路由配置、JS生成链接、正式目录和模板枚举建立现行路由目录。排除构建不发布的tests/docs/tools/fixtures等内部文件，不能把所有仓库HTML算成客户网页。

记录canonical路径、别名、模板owner、登录要求、语言、相关资产、待触发状态、检查状态。重定向地址验证目的地但不再制作重复页面。Query/hash驱动的报告、搜索、课程与账户页面作为参数化状态登记，既不漏掉，也不把无限查询组合夸称全部穷尽。

R4的367条路由及54个页内状态只是发现线索，不是当前总数或完成证明。遍历新发现且属于本范围的公开同站链接，记录无法到达、缺凭证或已退役路径；必须继续处理其它路径。

Civilization Atlas及已完成的方法命盘/报告核心图不重画、不强制插89张图；但共享Header/Footer、书册身份、resolver、商业介绍卡和链接回归不能跳过。**Profile、Tarot、I Ching及其输入、结果、保存/重开状态必须单独覆盖。**

## W04｜R2现行字节核对与逐图检查

将89项初始状态记为`OWNER_REPORTED_DESIGNED_AND_UPLOADED`，随后逐项核对，不继承历史`remoteVerified:true`。

公共交付base从现行resolver、环境或已授权配置取得；Cloudflare控制台URL不是图片URL。优先使用已配置的正式媒体域名，不臆造新域名。不凭公共bucket根URL不能列目录而判断bucket为空。

对89张及本轮需要修改绑定的Hero、Brand、Logo、图标执行真实GET/解码：核对状态码、最终URL、Content-Type、WebP/SVG真实类型、字节数、尺寸、SHA-256、取得时间和可见内容。HTTP 200返回HTML、零尺寸或损坏数据判失败；ETag不能直接充当SHA-256。图片尺寸记录实际值，不能用R4目标像素冒充实际生成像素。

同一素材hash出现多个名字时标为复核，不自行删重。检查图片是否为正确主题、是否含中英文/烧录标题、是否有被截断的图例和节点、是否标示示例、是否含未准入的价格/权益/服务承诺。用户完成上传不触发整批重审设计流程；只有具体发现的问题逐项提报，未受影响素材继续绑定。

找不到精确key时先区分网络、403、404、大小写、反引号、旧目录和缓存；可用已授权的存储只读入口核目录。禁止自动移动、重命名或覆盖对象。不能核实的素材写明阻塞原因和受影响图位，不静默换回用户已删旧图。

若现行公共交付仍使用`r2.dev`，记录正式交付可靠性/缓存能力风险；核实已有custom domain后才提出迁移计划，本轮不擅自修改DNS或bucket公开配置。简单`img`展示、JS读取字节和Canvas导出分别测试，不因跨域就无条件加`crossorigin`或开放通配CORS。[T1]

## W05｜统一消费者绑定，保留现有owner

优先扩展现有正式Registry和resolver；本工单JSON、审核台账是证据输入，不是平行生产资产系统。

至少检查现行或后继：

```text
assets/customer-ui/js/assets.js
assets/customer-ui/js/public-index-copy.js
assets/customer-ui/js/public-index-figures.js
assets/customer-ui/js/seven-volume-assets.js
assets/customer-ui/js/shell.js
assets/js/public-shell.js
assets/js/public-v2/unified-public-visual-resolver.js
assets/js/runtime/web-production/asset-resolver.js
content/customer-experience-rebuild/authority/customer-visual-asset-registry-v3.json
content/web-production/registries/current-client-visual-registry.json
content/web-production/registries/wpr-eight-volume-r2-public-assets-v1.json
content/registry/public-assets.json
现行Commerce商品视觉resolver、品牌owner、背景owner和书册owner
```

扫描并处理`data-cx-asset`、`data-cx-asset-role`、`data-px2-asset`、`data-pis-hero`、`data-sc-asset`、`data-cx-seven-volume-asset`、直接`src/srcset`、CSS背景、JS动态创建图像及懒加载图位。不能只扫描HTML里的文件名就宣布无遗漏。

每个实际绑定记录至少包含：`assetIdentity / planId / objectKey / contentHash / route / template / slot / trigger / locale / displayPolicy / sourceFile / businessGate / evidence`。`data-visual-binding`等属性可以作为测试钩子候选，名字按项目统一；存在钩子不等于图已经显示。

一个页面不允许被两个hydrator反复覆写同一img的src或通过隐藏旧图造成新图也不可见。注册表版本、角色到assetId的映射、浏览器缓存与运行注入要一起核对。为已删除的旧站点summary figures建立明确退役/禁用引用记录，生产模板不得再次请求；书中出版图、已接受PFIG和受保护的历史报告不是同一批旧图，不得误删。

## W06｜Hero、Figure、状态图的正确显示策略

**Hero：** 独立媒体容器和文字容器，只让Hero自身文案继承深底文字颜色。正文卡、表单、服务说明不放进自动Hero父容器。不要再依赖`main h1.parentElement`推断完整Hero范围。取消重复Hero注入，按真实构图设置焦点和裁切安全区，不挤出首屏主要操作。[S2]

**Figure：** 使用内容图容器、正常宽度、真实宽高比和`object-fit:contain`。整张节点图、图题、图例、连线必须完整可见，不用背景cover裁图，不套白色硬边掩盖素材，也不把信息密集图缩进窄侧栏。大图全屏/放大是辅助；图内最关键标注在默认布局也应可读。达不到时提供邻接HTML说明和合适的放大入口，不仅设置width:100%就报完成。

**状态图：** 小幅显示，与真实空、无结果、权限不足、加载失败状态分别绑定。网络失败不显示“没有已保存资料”，未登录不显示“没有报告”。状态图片自身失败必须降级到纯文字，不能递归加载另一张失败图。

首屏主要Hero不懒加载；屏下图保留布局盒再延迟加载，不能`display:none`等待懒加载导致永远无法触发。width/height用实际素材尺寸，srcset只列真实存在的导出，保留浏览器缓存及错误重试记录。[T2]

中英标题、caption、alt和按钮随既有语言系统切换；先看图片实际语言，不能假设图片无字。只有已存在语言变体才切换文件；没有英文位图时提供准确英文HTML释义，不制造不存在的`-en.webp` URL，不用CSS遮挡/强行抹掉原图中文。信息图提供简短alt和附近完整文字说明，纯装饰图使用恰当空alt。

普通文案及作为文字使用的图片文字满足最低4.5:1、大号文字3:1对比目标；同时人工检查照片/渐变背景上的可读性。Logo依品牌资产处理，不能用白色Logo混入浅背景；数字对比检测不能替代视觉审阅。[T3]

不统一设置24rem等大最小高度，不把所有图展示成同样大小的海报墙。保留PHI OS已接受配色，不修改已接受图片底色或报告底图来迁就排版。

## W07｜89项逐图实施，不再增加设计候选

附录A和输入JSON逐项列明完整文件名、目标消费者及图位意图。必须给全部89项明确处置；第60/61项虽然图片完成，业务服务仍须按当前服务owner决定是否开放。

每张可适用素材至少拥有一个真正可达的主要消费者。状态素材可由真实组件状态触发；有业务门控的图必须接入正确门控且在受控本地状态验证。不能只放进人审页就当全站已调用，也不能为了达到89/89公开显示强行开启尚未开放的服务。

生产全站绑定验收与“89张全部公開”是不同口径。任何未绑定、主题不符或缺失图位不得用`NOT_APPLICABLE`消除，必须逐项说明并交人工决定。89张等于`已绑定＋门控绑定＋具体阻塞＋经用户明确批准不使用`，各数字分开报告；其中门控项不能算生产已显示。

## W08｜主要页面的不可省略处理

### 首页、Explore、About

B01六幅场景按实际客户意图分配；首页与`/explore/start/`不强制相同卡数。平台网络、入口图各在有意义的认识/选择章节中使用，删除等价重复占位。共享图可以复用，不复制新文件。About/研究页按实际相关内容引用，不把所有89图放入知识图库刷覆盖率。

### Reality／Navigation

以Figure1B网络表达为中心，保留真实现有网络组件、节点/边来源、当前位置和版本语义；移除“由你评估”重复占位及庞大五阶段说明墙。B02是概念/阅读素材，不自动等于客户实时图谱。不得用WebP截图替换已有可交互网络；不得把图中示例线、方向、节点或未来轨迹写进真实NAV结果。缺数据显示真实边界，不补假方向。

图边若提供热点，热点只是说明导航；不能声称点击的是已确认客户事实。无热点需要时不强造假交互。本轮不为绑定图片新建NAV计算器、图数据库或生产持久化。

### Account／Membership

B03按账户总览、人物、权限、报告、时间和恢复状态分配；保留真实登录与权益。新版账户当前展示使用新My PHI图，不全局把历史FIG-053身份替成另一个对象。Membership绑定最新HERO-023及第80项，不能恢复历史会员等级、价格和未批准权益。Footer保持GETPHIOS-COM正式锁定图，Header/Favicon按各自已接受品牌owner，不用滤镜伪造新Logo。

### Financial／Will

B04八张分别进入财务总览、收入支出、资产债务、现金流、风险限制、方向、复核和证据边界，不保留八图缩略墙。只迁移当前客户图位；不覆盖冻结报告内原SVG引用。Will的56/57/59项仍从Entrance读取，接到现有模块或已准入的正式后继路由，不为了图片创造空的`/will/`。完整报告、资料草稿和法律签署状态保持原边界；不修改Financial/Will单份双语产品约定。

### Profile

首屏用最新HERO-022。七种入口模式、真实作答、已有图形结果/PFIG、导入确认、双语档案、保存重开和证据选择衔接各有对应图位；图的显示不能清空表单或重新触发评分。P01–P05、十章底图、正文背景、既有PFIG及已接受正文不重画不替换。第37项是产品解释图，不是完整档案。不能以静态雷达/示例分数充当客户结果。

### Tarot

首屏绑定HERO-019，不以商品海报代替。六图分别进入问题、牌阵、抽牌、连贯解读、现实反思和保存/重开说明。真实牌面、牌背、牌序、所选牌位和抽牌身份由既有组件保持；图不能覆盖点击区、挡住洗牌按钮或触发重新抽牌。展开说明、语言切换、返回页面不能自动再请求付费解读。付费与四问权益读取真实产品owner，不硬编码新规则。

### I Ching

首屏绑定HERO-020。核对`/perspectives/iching/`、`/run/`、`/consult/`、旧`/readings/i-ching/`及当前路由后继。遵守实际canonical和已准入功能，不把旧页面全部重新启用。六图分别绑定三种起卦方式说明、六爻顺序、本卦/变爻/之卦、阅读层次、现实对照和回看。保持既有六爻值、变爻和castId，不因图示中的卦形改实际结果。四张旧教程可保留局部必要功能，不重复整组显示。

### Professional／Services／Appointments

Hero与浅底卡片分离，修复白字继承到浅卡的范围问题；用第52–55/58项说明真实服务范围和责任，不能仅增加图片却留下无法阅读的内容。预约申请不等于确认；没有业务功能时以真实状态门控。现金流游戏/自然体验第60/61项如未准入，接入服务门控并写明未公开，不把素材完成当服务开放。

### Knowledge／Ask／Books／Academy

Ask首屏第71项保持输入区域优先；第62项是来源解释，不插进每条回答或假造即时来源。搜索、概念、文章、图示详情和书籍阅读器通过现有模板按相关性绑定，不给每篇文章重复塞平台总图。八册Hero、Brand、封面和第64项知识联系图分别保留职责；Book7 Observation与Book8 Navigation正确，不能把品牌名修正误当书名/正文改版。Academy图不是课程视频或认证开放凭证。

### Legal／Contact／支付与共享状态

第80–89项保持轻量，状态由实际响应决定。结账、支付成功/失败、隐私、条款、AI披露、联系页及其canonical别名全部登记。政策正文不被图片替换，支付状态不由跳转或插画决定。对不需要图片的条款段落记为已审且无新增图位，不为了“所有页面”堆Hero。

## W09｜保留现有资产与商业接线

范围不仅89图：重新核对现有Hero、Brand、Logo、背景、图标及真实商业图片的现行消费者。已经正确绑定的保留，只补未接线或错位部分。商业图不能替代免费命盘、实际报告或交互牌桌。

八字、占星、紫微、人类图、数字学、ECR、Profile、Cross分别对应实际完整报告介绍/解锁位；塔罗/易经商品图只负责付费说明。财务报告、财务咨询和遗嘱不混成一项；两份/三份套装只显示获准组合；月度订阅核实图内价格权益；现金流游戏与自然体验按开放状态；5PLUS继续排除、不恢复、不重画。

共享组件改动后，已完成的Atlas和方法页面至少做受影响公共壳与资源回归，不重新进行昂贵整套报告生成。不得向公共bucket、公开JSON或Pages输出中复制客户付费报告、证据、token或会话信息。

## W10｜缓存、性能与故障恢复

首屏只提高真正主视觉优先级，屏下图按需请求，不预加载89张。总表用于构建/审核，不让每页为了几张图读取所有内部证据。静态公共图片与私有数据访问分离，resolver只能输出允许的公共URL，不把任意用户URL当可信资产来源。

使用真实版本或hash处理已更新资源；相同文件名内容变更必须在验证收据中显示。不得靠永久随机timestamp规避缓存；不得在未验证资源稳定性时为全部同名对象开启长期immutable缓存。

若需缩略图/手机版导出而R2尚无对应文件，不伪造srcset，不自动写回R2。先使用正确原件和适合布局；仅具体缺口提出派生文件方案。图过大或图内字过密而无法达到标准时列出单项问题，不把责任转为重新设计全部89张。

CSS、JS、图像失败要分别可诊断；错误重试有限次，不形成请求风暴。会话切换、hydration重入和动态插入不造成重复监听/重复图片。公开review页不能意外发布含内部测试数据的审计JSON。

## W11｜浏览器全站逐页、逐状态验证

对本轮发现范围内全部现行canonical页面做可读性、导航和资源检查，重定向单独验证。每个目标图位记录路由、状态、语言、viewport、selector、currentSrc、对应objectKey、可见尺寸、图像解码结果与截图。滚动到懒加载位置，打开相关tabs/details/dialogs；仅有HTTP 200或naturalWidth不等于用户看得见。

所有目标canonical页面至少覆盖中文/英文×桌面1440/手机390。375、768、1067/1280用于共享布局与密集图重点断点；复杂共享模板和所有关键操作追加200%缩放、键盘、焦点及必要的打印预览。必须区分浏览器设备模拟、真机及实际引擎，没运行WebKit/真机不能写已通过。

必测状态包括：访客、已授权账户、缺权限、无保存项、网络错误、图片404、恢复重试；Profile七模式/导入/结果/档案；Tarot牌阵/洗牌/选牌/已选结果；I Ching实际开放的起卦方式/六爻/本变之卦；预约申请/回执；Financial/Will已有资料和阅读状态；Search有结果/无匹配/失败；报告可读/待交付/不可访问。

测试不得产生真实购买、预约、发送消息或provider生成。合法本地fixture可以验证界面但必须标记合成，不能当LIVE客户证据。缺少受控身份则把对应私有状态列BLOCKED，不发明客户记录。为避免复杂操作的视觉修复覆盖已有功能，比较修复前后关键对象ID、输入值、权益与API调用行为。

## W12｜检查脚本、构建与同一快照证据

先读现有`package.json`和脚本实现，选择受影响的资产、品牌、书册、路由、页面、商业展示和安全检查。不存在的命令不能直接执行或声称通过。

需要新入口时，先实现并注册或复用等价脚本，再提供本地准确命令。以下是本工单建议名称，不表示当前仓库已存在：

```text
audit:visual-binding:r5             只读R2核对，记录真实网络请求
check:visual-binding:r5             离线manifest/别名/退役引用/图位检查
qa:visual-binding:r5                本地浏览器路线与状态验证
build:visual-binding:r5:review      生成唯一Master下的可审入口
check:visual-binding:r5:closure     核对89项及路由/证据闭合
```

源码检查沿用现有零provider回归机制；网络审计单独标记为只读网络，不能伪装离线。新增脚本要具备超时、有限并发、失败日志、非零退出码、断点继续与幂等。源码/台账检查既验证正向也验证负向：错Hero身份、已删路径、404伪HTML、重复ID、图位隐藏、空白文案、语言错误、业务门控失效必须能被检测。

完成所有源码修改后，在独占现有Pages构建锁的情况下执行：

```powershell
npm run build:pages
```

以现有builder生成的`.pages-output`及真实Functions/路由产物为准，验证`_worker.js`、`_routes.json`和静态资源发布边界。不得手工创建空文件、移除Functions或删检查绕过构建。验证当前构建输出中所有目标页面、样式、脚本、公共资产投影齐全，审核台账和私有证据未泄漏。

最终浏览器验证应包含当前构建预览，不仅开发服务器。构建、源码检查、浏览器、registry与图片byte receipt必须绑定同一sourceDigest；其它窗口变更后只重跑受影响证明。全量构建在最后做一次，失败修复后再跑，不在每张图后重建整个站点。

## W13｜强制交付：逐资产＋逐页面＋唯一Master

优先在当前Master证据目录下追加本工单子目录，复用既有owner和索引，不新造第二个总Master。至少生成以下真实文件或等价既有产物，最后列出实际路径：

```text
VISUAL-BINDING-R5-OWNER-DECISIONS.json
VISUAL-BINDING-R5-R2-VERIFICATION.json
VISUAL-BINDING-R5-ASSET-TO-CONSUMER.json
VISUAL-BINDING-R5-ROUTE-COVERAGE.json
VISUAL-BINDING-R5-LEGACY-ALIAS-MIGRATION.json
VISUAL-BINDING-R5-DEPRECATED-REFERENCES.json
VISUAL-BINDING-R5-BROWSER-RESULTS.json
VISUAL-BINDING-R5-CLOSURE.json
```

人工子审阅入口建议：

```text
tools/review/PHIOS-VISUAL-ASSET-FULL-SITE-BINDING-R5-HUMAN-REVIEW.html
```

它必须由现有“PHI OS唯一Master验收入口”链接到；同时回写既有`PHIOS-STATIC-VISUAL-MASTER-R1-HUMAN-REVIEW.html`或其它对应历史任务的真实后继状态，不要求用户跳到全新孤立验收系统。需要供无网络审阅时可以在review私有范围保留读取缓存，不改变正式R2路径、不将缓存误计成生产绑定。

审阅页必须能按资产/批次/页面/状态过滤，看到实际图、正确key和验证时间、页面前后对照、中英桌面手机截图、图位触发入口、别名迁移、退役旧图、业务门控和错误。截图存在不代表画面已通过，必须列实际检查结论。

最终数字至少分开：89素材读取成功/失败；源码已绑定/未绑定；公开可见/状态触发/业务门控；新增/纠正Hero与Brand数量；发现canonical总数与已审/未审/阻塞；旧图活动引用数；图片错误数；同快照构建结果；provider/支付/生产操作/R2读取请求数。不能用一行“89/89 PASS”混淆所有阶段。

## W14｜完成门槛与剩余工作

可标`READY_FOR_HUMAN_REVIEW`必须满足：89项都已核对并有明确实际处置；适用图位已真实绑定且可读；Hero/Brand/Icon冲突已迁移闭合；既有功能不退化；本范围所有必需canonical页面完成约定检查；失效/已删旧图不再出现在活动绑定；同一快照构建通过；审阅入口真实存在并进入唯一Master。

存在必需素材GET失败、必需私有状态缺凭证、未绑图、漏审页面、字体不可读或错图，整体标PARTIAL或BLOCKED；仍要提供实际已完成成果的人审入口，不能标全站READY/完成。业务合法门控可以保留，但必须显示“门控绑定已验证，生产未公开”，不能把服务本身标COMPLETE。

以下四个结论永远分别报告：

```text
SOURCE_IMPLEMENTED
LOCAL_BROWSER_VERIFIED
DEPLOYED_VERIFIED
LIVE_CUSTOMER_VERIFIED
```

本轮停在人工审阅。不自动发布。待用户单独授权部署后，使用同一通过快照执行正式发布与线上抽验；在那之前不能声称getphios.com已显示本轮全部修复。

### 给Codex的最后执行要求

不要重新规划89张图，不要重新生成图片，不要只更新Registry、组件或review页面。请完成真实消费者绑定及页面排版，逐项核对89张与最新Hero/Brand/Icon，按现有业务边界处理门控，在同一源码快照下完成浏览器、构建和唯一Master验收。保持所有已接受报告、运行与商品规则；把剩余问题写成具体文件、图位和失败原因，而不是要求用户再写一份总工单。


## 附录 A｜89张图逐项绑定矩阵

完整文件名与objectKey来自R4原清单；下面页面/图位为本轮实施目标，须以当前canonical路由、真实模板和运行状态校准，不是当前已绑定证明。除25–32放`images/figures/financial/`，其他全部放`images/figures/Entrance/`。

### B01｜首页与探索入口

| #／计划ID | 完整文件名 | 目标页面／图位与行为 |
|---|---|---|
| 01／`PLAN-HOME-01` | `PHIOS-ILLUSTRATION-HOME-QUESTION-ENTRY-v1.webp` | **/ ; /explore/start/ ; /knowledge/ask/**；对应“我有一个问题”入口卡；Ask空闲介绍区可复用，不挡住提问框。 |
| 02／`PLAN-HOME-02` | `PHIOS-ILLUSTRATION-HOME-READING-ENTRY-v1.webp` | **/ ; /explore/start/ ; /books/**；对应阅读/学习入口；首页与Explore按现有入口数量复用，不增重复大卡。 |
| 03／`PLAN-HOME-03` | `PHIOS-ILLUSTRATION-HOME-REALITY-ENTRY-v1.webp` | **/ ; /explore/start/ ; /reality/**；当前处境入口卡；与现实输入按钮相邻，不当客户网络结果。 |
| 04／`PLAN-HOME-04` | `PHIOS-ILLUSTRATION-HOME-PERSPECTIVE-ENTRY-v1.webp` | **/ ; /explore/start/ ; /perspectives/**；换视角入口卡；保留当前导航与方法准入。 |
| 05／`PLAN-HOME-05` | `PHIOS-ILLUSTRATION-HOME-CONTINUITY-ENTRY-v1.webp` | **/ ; /membership.html**；持续使用入口；不能暗示已自动建立客户历史。 |
| 06／`PLAN-HOME-06` | `PHIOS-ILLUSTRATION-HOME-PROFESSIONAL-ENTRY-v1.webp` | **/ ; /explore/start/ ; /professional/**；真人协助入口；不冒充真实服务人员肖像或资质。 |
| 07／`PLAN-HOME-07` | `PHIOS-FIGURE-PLATFORM-RELATIONSHIP-NETWORK-v1.webp` | **/ ; /about/ ; /explore/why-phios/**；平台联系总览章节；减少原有重复宣言和空白块。 |
| 08／`PLAN-HOME-08` | `PHIOS-FIGURE-CUSTOMER-ENTRY-PATHS-v1.webp` | **/explore/ ; /explore/start/**；任务入口总览；保留四个核心入口和学习支路，不把图内装饰变成假按钮。 |

### B02｜Reality与导航网络

| #／计划ID | 完整文件名 | 目标页面／图位与行为 |
|---|---|---|
| 09／`PLAN-REALITY-01` | `PHIOS-FIGURE-CURRENT-REALITY-NETWORK-v1.webp` | **/reality/**；当前现实网络的概念说明/空状态示例；真实图谱保留独立数据与交互。 |
| 10／`PLAN-REALITY-02` | `PHIOS-FIGURE-DIRECTION-POSITION-NETWORK-v1.webp` | **/reality/**；Directions/Position视图的说明图；不写入真实possibleDirections。 |
| 11／`PLAN-REALITY-03` | `PHIOS-FIGURE-REALITY-EVOLUTION-NETWORK-v1.webp` | **/reality/ ; /account/**；版本与变化视图的阅读说明；无历史时标示示意，不生成客户轨迹。 |
| 12／`PLAN-REALITY-04` | `PHIOS-FIGURE-EVIDENCE-INTERPRETATION-NETWORK-v1.webp` | **/reality/ ; /knowledge/ask/**；来源/证据/解释详情旁；不与事实数据层混为同一权威。 |
| 13／`PLAN-REALITY-05` | `PHIOS-FIGURE-NAVIGATION-FORMATION-1B-v1.webp` | **/reality/ ; /about/reality-navigation/**；导航形成原理区；是Figure1B客户后继，不替换书中原始figure-1b。 |
| 14／`PLAN-REALITY-06` | `PHIOS-FIGURE-STRUCTURAL-REINFORCEMENT-EVIDENCE-v1.webp` | **/reality/**；强化与观察依据的局部说明；不得仅凭线宽判断真实强化。 |
| 15／`PLAN-REALITY-07` | `PHIOS-FIGURE-CHOICE-SPACE-CONSTRAINTS-v1.webp` | **/reality/**；方向比较旁解释选择空间/限制；取代旧A/B/C重复占位。 |
| 16／`PLAN-REALITY-08` | `PHIOS-FIGURE-CURRENT-UNKNOWN-FOCUS-v1.webp` | **/reality/**；资料不足/关键未知说明；不把系统未加载误说成客户没有资料。 |
| 17／`PLAN-REALITY-09` | `PHIOS-FIGURE-OBSERVATION-RETURN-LOOP-v1.webp` | **/reality/**；观察、复核、继续面板；不新增自动保存或行动。 |

### B03｜Account／My PHI

| #／计划ID | 完整文件名 | 目标页面／图位与行为 |
|---|---|---|
| 18／`PLAN-ACCOUNT-01` | `PHIOS-FIGURE-MY-PHI-ACCOUNT-NETWORK-v2.webp` | **/account/ ; 已核实的账户现实入口**；My PHI结构总览；当前账户图位后继，旧FIG-053只保留历史身份。 |
| 19／`PLAN-ACCOUNT-02` | `PHIOS-FIGURE-ACCOUNT-CONSENT-SCOPE-v1.webp` | **/account/ ; 当前授权面板**；资料用途与授权说明；默认简洁，细节按需打开。 |
| 20／`PLAN-ACCOUNT-03` | `PHIOS-FIGURE-REPORT-DELIVERY-CONTINUITY-v1.webp` | **/account/ ; /professional/reports/**；报告交付、重开、下载说明；不得取代真实报告预览。 |
| 21／`PLAN-ACCOUNT-04` | `PHIOS-FIGURE-ACCOUNT-PEOPLE-PERMISSIONS-v1.webp` | **/account/ ; 当前人物管理面板**；本人/受控人物/第三方权限说明，不披露未授权人物。 |
| 22／`PLAN-ACCOUNT-05` | `PHIOS-FIGURE-ACCOUNT-TIMELINE-VERSIONS-v1.webp` | **/account/ ; /reality/**；时间与版本说明；没有时间线功能时仅说明已存在能力，不假设可用。 |
| 23／`PLAN-ACCOUNT-06` | `PHIOS-FIGURE-ACCOUNT-SAVED-VS-SESSION-v1.webp` | **/account/ ; /reality/**；会话与已保存资料区别；保存状态从上游读取。 |
| 24／`PLAN-ACCOUNT-07` | `PHIOS-FIGURE-ACCOUNT-ACCESS-RECOVERY-v1.webp` | **/account/ ; 当前登录/访问恢复状态**；会话过期或访问恢复说明；不新建认证方式。 |

### B04｜Financial八图后继

| #／计划ID | 完整文件名 | 目标页面／图位与行为 |
|---|---|---|
| 25／`PLAN-FIN-029` | `PHIOS-FIGURE-FINANCIAL-REALITY-SYSTEM-MAP-v2.webp` | **/professional/financial/**；财务总览章节，当前页FIG-029对应v2后继。 |
| 26／`PLAN-FIN-030` | `PHIOS-FIGURE-INCOME-EXPENSE-FLOW-v2.webp` | **/professional/financial/**；收入/支出栏目，当前页FIG-030对应v2后继。 |
| 27／`PLAN-FIN-031` | `PHIOS-FIGURE-ASSETS-LIABILITIES-STRUCTURE-v2.webp` | **/professional/financial/**；资产/债务/权属栏目，当前页FIG-031对应v2后继。 |
| 28／`PLAN-FIN-032` | `PHIOS-FIGURE-CASHFLOW-RUNTIME-v2.webp` | **/professional/financial/**；现金流栏目，当前页FIG-032对应v2后继。 |
| 29／`PLAN-FIN-033` | `PHIOS-FIGURE-RISK-CONSTRAINT-MAP-v2.webp` | **/professional/financial/**；风险/限制栏目，当前页FIG-033对应v2后继。 |
| 30／`PLAN-FIN-034` | `PHIOS-FIGURE-FINANCIAL-DECISION-FLOW-v2.webp` | **/professional/financial/**；方向条件/导航栏目，当前页FIG-034对应v2后继。 |
| 31／`PLAN-FIN-035` | `PHIOS-FIGURE-FINANCIAL-CONTINUITY-v2.webp` | **/professional/financial/**；变化/复核栏目，当前页FIG-035对应v2后继。 |
| 32／`PLAN-FIN-036` | `PHIOS-FIGURE-EVIDENCE-DECISION-BOUNDARY-v2.webp` | **/professional/financial/ ; /professional/authority/**；资料、计算与建议区别，当前页FIG-036对应v2后继。 |

### B05｜Profile全路径

| #／计划ID | 完整文件名 | 目标页面／图位与行为 |
|---|---|---|
| 33／`PLAN-PROFILE-01` | `PHIOS-FIGURE-PROFILE-EVIDENCE-SOURCES-v1.webp` | **/perspectives/profile/**；首屏后的证据来源说明；不取代真实评估结果。 |
| 34／`PLAN-PROFILE-02` | `PHIOS-FIGURE-PROFILE-SEVEN-ENTRY-MODES-v1.webp` | **/perspectives/profile/**；七种证据模式选择区；保留实际可用性、模式按钮和表单。 |
| 35／`PLAN-PROFILE-03` | `PHIOS-FIGURE-PROFILE-RESULT-READING-KEY-v1.webp` | **/perspectives/profile/**；真实结果旁的“怎样读”说明；保留动态雷达、来源与PFIG。 |
| 36／`PLAN-PROFILE-04` | `PHIOS-FIGURE-PROFILE-EXTERNAL-CONFIRMATION-v1.webp` | **/perspectives/profile/**；导入外部结果/确认界面；不得替用户确认输入。 |
| 37／`PLAN-PROFILE-05` | `PHIOS-FIGURE-PROFILE-BILINGUAL-DOSSIER-ACCESS-v1.webp` | **/perspectives/profile/ ; /account/**；单份双语完整档案介绍与访问说明；不拆中英商品，不改冻结正文。 |
| 38／`PLAN-PROFILE-06` | `PHIOS-FIGURE-PROFILE-SELECTIVE-REALITY-HANDOFF-v1.webp` | **/perspectives/profile/**；选择证据带入现实的授权面板。 |
| 39／`PLAN-PROFILE-07` | `PHIOS-FIGURE-PROFILE-SOURCE-DIFFERENCES-v1.webp` | **/perspectives/profile/**；来源相似/差异/缺口说明；不制造常模、总分或人格事实。 |

### B06｜Tarot全路径

| #／计划ID | 完整文件名 | 目标页面／图位与行为 |
|---|---|---|
| 40／`PLAN-TAROT-01` | `PHIOS-FIGURE-TAROT-QUESTION-FOCUS-v1.webp` | **/perspectives/tarot/**；提问区，短说明/可展开图，不推远问题输入。 |
| 41／`PLAN-TAROT-02` | `PHIOS-FIGURE-TAROT-SPREAD-POSITIONS-v1.webp` | **/perspectives/tarot/**；选牌阵区，仅解释当前正式牌位；不改牌阵registry。 |
| 42／`PLAN-TAROT-03` | `PHIOS-FIGURE-TAROT-SHUFFLE-SELECT-v1.webp` | **/perspectives/tarot/**；洗牌/亲选区说明；不能覆盖牌面、牌背和触摸目标。 |
| 43／`PLAN-TAROT-04` | `PHIOS-FIGURE-TAROT-CONNECTED-READING-v1.webp` | **/perspectives/tarot/**；结果中的连贯阅读说明；不替代抽到的实际牌。 |
| 44／`PLAN-TAROT-05` | `PHIOS-FIGURE-TAROT-REALITY-REFLECTION-v1.webp` | **/perspectives/tarot/**；现实反思区；不自动导入个人资料。 |
| 45／`PLAN-TAROT-06` | `PHIOS-FIGURE-TAROT-READING-CONTINUITY-v1.webp` | **/perspectives/tarot/ ; /account/**；保存/重开/后续提问说明；同一牌局身份不改变。 |

### B07｜I Ching全路径

| #／计划ID | 完整文件名 | 目标页面／图位与行为 |
|---|---|---|
| 46／`PLAN-ICHING-01` | `PHIOS-FIGURE-ICHING-QUESTION-AND-CAST-v1.webp` | **/perspectives/iching/ ; /perspectives/iching/consult/**；问题与起卦方式说明；核对现有四张教程，避免重复显示。 |
| 47／`PLAN-ICHING-02` | `PHIOS-FIGURE-ICHING-SIX-LINES-ORDER-v1.webp` | **/perspectives/iching/consult/ ; /perspectives/iching/run/**；六爻输入或起卦区，从下到上的阅读说明。 |
| 48／`PLAN-ICHING-03` | `PHIOS-FIGURE-ICHING-PRIMARY-CHANGING-RELATING-v1.webp` | **/perspectives/iching/consult/ ; /perspectives/iching/run/**；结果区本卦/变爻/之卦关系说明；实际卦形来自原计算器。 |
| 49／`PLAN-ICHING-04` | `PHIOS-FIGURE-ICHING-READING-LAYERS-v1.webp` | **/perspectives/iching/consult/ ; /perspectives/iching/run/**；解释层次说明；不重复整套长流程。 |
| 50／`PLAN-ICHING-05` | `PHIOS-FIGURE-ICHING-REALITY-COMPARISON-v1.webp` | **/perspectives/iching/consult/ ; /perspectives/iching/run/**；现实对照区；解释不自动升级为事实。 |
| 51／`PLAN-ICHING-06` | `PHIOS-FIGURE-ICHING-CAST-CONTINUITY-v1.webp` | **/perspectives/iching/consult/ ; /perspectives/iching/run/ ; /account/**；同一卦局保存和回看；保留castId与六爻身份。 |

### B08｜Professional／Will／Services

| #／计划ID | 完整文件名 | 目标页面／图位与行为 |
|---|---|---|
| 52／`PLAN-SERVICE-01` | `PHIOS-FIGURE-PROFESSIONAL-REPORT-REVIEW-ADVICE-v1.webp` | **/professional/ ; /professional/services/ ; /professional/authority/**；报告/人工复核/建议区别的内容章节，不画成自动升级销售流程。 |
| 53／`PLAN-SERVICE-02` | `PHIOS-FIGURE-SERVICE-SCOPE-DELIVERABLES-v1.webp` | **/professional/services/**；真实服务范围与交付内容区；实际产品状态由已有owner控制。 |
| 54／`PLAN-SERVICE-03` | `PHIOS-FIGURE-APPOINTMENT-REQUEST-LIFECYCLE-v1.webp` | **/professional/appointments/ ; /account/**；预约申请表/回执/账户查询的说明；申请不等于确认。 |
| 55／`PLAN-SERVICE-04` | `PHIOS-FIGURE-PROFESSIONAL-CONSENT-HANDOFF-v1.webp` | **/professional/external-readers/ ; 已核实的专业同意/隐私入口**；专业资料交接与授权区，不改变同意范围。 |
| 56／`PLAN-SERVICE-05` | `PHIOS-FIGURE-WILL-ESTATE-RESPONSIBILITY-v1.webp` | **/professional/financial/ 的现有Will模块或其当前正式后继**；遗产、权属和责任章节，不新造独立/Will路由。 |
| 57／`PLAN-SERVICE-06` | `PHIOS-FIGURE-WILL-DRAFT-REVIEW-EXECUTION-v1.webp` | **当前Will模块及合法报告阅读器**；文稿、复核、签署等区别说明；不承诺法律有效性。 |
| 58／`PLAN-SERVICE-07` | `PHIOS-FIGURE-EXTERNAL-READER-SOURCE-INTAKE-v1.webp` | **/professional/external-readers/ ; 已核实的外部资料提交入口**；外部解读资料提交/确认区；保留来源身份与权限。 |
| 59／`PLAN-HERO-03` | `PHIOS-HERO-WILL-ESTATE-PREPARATION-v1.webp` | **当前Will入口模块或已存在的正式独立入口**；遗嘱资料准备主视觉；位置按真实页面确定，仍存Entrance。 |
| 60／`PLAN-SERVICE-08` | `PHIOS-ILLUSTRATION-CASHFLOW-GAME-LEARNING-CONTEXT-v1.webp` | **/professional/services/ 中已准入的现金流游戏服务卡**；服务开放时正式显示；未开放时注册/门控/本地预览，不伪造可预约或治疗效果。 |
| 61／`PLAN-SERVICE-09` | `PHIOS-ILLUSTRATION-NATURE-EXPERIENCE-SCOPE-v1.webp` | **/professional/services/ 中已准入的自然体验服务卡**；服务开放时正式显示；未开放时注册/门控/本地预览，不暗示疗效。 |

### B09｜Knowledge／Ask／Books／Academy

| #／计划ID | 完整文件名 | 目标页面／图位与行为 |
|---|---|---|
| 62／`PLAN-KNOW-01` | `PHIOS-FIGURE-ASK-SOURCE-NETWORK-v1.webp` | **/knowledge/ask/**；空闲介绍或来源详情；不插进每条回答，不替代实时引用。 |
| 63／`PLAN-KNOW-02` | `PHIOS-FIGURE-KNOWLEDGE-DISCOVERY-NETWORK-v1.webp` | **/knowledge/ ; /search/ ; /figures/**；知识入口概览；搜索结果页只在有用的说明位置复用。 |
| 64／`PLAN-KNOW-03` | `PHIOS-FIGURE-EIGHT-VOLUME-KNOWLEDGE-NETWORK-v1.webp` | **/books/ ; 首页八册区；/explore/**；八册知识联系图；不替代八册Hero或出版正文，不按旧五册编号绑定。 |
| 65／`PLAN-KNOW-04` | `PHIOS-FIGURE-CROSS-VOLUME-READING-PATH-v1.webp` | **当前正式书籍阅读器；/articles/**；相关阅读/跨册关系说明；文章正文不强制重复插入。 |
| 66／`PLAN-KNOW-05` | `PHIOS-FIGURE-QUESTION-TO-READING-PATH-v1.webp` | **/explore/start/ ; /books/ ; /knowledge/ask/**；读者问题进入知识的入口说明。 |
| 67／`PLAN-KNOW-06` | `PHIOS-FIGURE-CONCEPT-ARTICLE-FIGURE-MAP-v1.webp` | **/knowledge/concepts/ ; 当前图示详情模板**；概念/文章/图示关联说明；只有实际关联的页面才显示。 |
| 68／`PLAN-KNOW-07` | `PHIOS-FIGURE-SEARCH-RESULT-RELATIONSHIPS-v1.webp` | **/search/**；结果来源分组说明；与无结果错误图不同。 |
| 69／`PLAN-KNOW-08` | `PHIOS-FIGURE-ACADEMY-LEARNING-NETWORK-v1.webp` | **/academy/ ; /academy/lesson/**；学习与阅读路径；课程图不代表课程视频/证书开放。 |
| 70／`PLAN-KNOW-09` | `PHIOS-FIGURE-LEARNING-TO-REALITY-APPLICATION-v1.webp` | **/academy/lesson/ ; /reality/**；学习后与现实对照的适用内容区。 |
| 71／`PLAN-HERO-01` | `PHIOS-HERO-ASK-KNOWLEDGE-SOURCES-v1.webp` | **/knowledge/ask/**；知识来源首屏，保持提问框首屏可达；不因前缀HERO迁出Entrance。 |

### B10｜Perspectives／Relationship／跨领域

| #／计划ID | 完整文件名 | 目标页面／图位与行为 |
|---|---|---|
| 72／`PLAN-CROSS-01` | `PHIOS-FIGURE-PERSPECTIVES-SAME-SITUATION-v1.webp` | **/perspectives/**；同一现实不同读取的主题结构区。 |
| 73／`PLAN-CROSS-02` | `PHIOS-FIGURE-PERSPECTIVES-SOURCE-BOUNDARIES-v1.webp` | **/perspectives/ ; 当前相关研究说明页**；不同来源的边界说明，不把所有方法当同类证据。 |
| 74／`PLAN-CROSS-03` | `PHIOS-FIGURE-RELATIONSHIP-PARTICIPANT-NETWORK-v1.webp` | **/perspectives/relationship/**；参与者与现实条件说明；不重画已接受关系方法结果。 |
| 75／`PLAN-CROSS-04` | `PHIOS-FIGURE-RELATIONSHIP-SHARED-AUTHORITY-v1.webp` | **/perspectives/relationship/ ; /reality/**；共同决定权/各自授权的局部说明。 |
| 76／`PLAN-CROSS-05` | `PHIOS-FIGURE-OBSERVATION-EVIDENCE-KNOWLEDGE-v1.webp` | **/about/reality-navigation/ ; 当前相关研究说明页**；观察到证据/知识状态的原理区；不覆盖BookVII原图。 |
| 77／`PLAN-CROSS-06` | `PHIOS-FIGURE-HUMAN-SYSTEM-RESPONSIBILITY-v1.webp` | **/about/ ; /professional/authority/ ; 当前AI披露页**；人和系统职责说明；不泛化为资质或合规认证。 |
| 78／`PLAN-HERO-02` | `PHIOS-HERO-PERSPECTIVES-MULTIPLE-LENSES-v1.webp` | **/perspectives/**；视角总览主视觉；独立Hero容器，仍存Entrance。 |
| 79／`PLAN-CROSS-07` | `PHIOS-FIGURE-CROSS-DOMAIN-CONTEXT-LINKS-v1.webp` | **/reality/ ; /professional/financial/ ; /perspectives/relationship/ ; Profile衔接**；跨领域资料的显式选择与边界；不自动传送隐私。 |

### B11｜会员／支付／隐私／共享状态

| #／计划ID | 完整文件名 | 目标页面／图位与行为 |
|---|---|---|
| 80／`PLAN-SYSTEM-01` | `PHIOS-FIGURE-MEMBERSHIP-ACCESS-BOUNDARIES-v1.webp` | **/membership.html ; 当前会员介绍及结账说明**；会员与单次购买区别；不得烧录或恢复未批准套餐权益。 |
| 81／`PLAN-SYSTEM-02` | `PHIOS-FIGURE-PAYMENT-ENTITLEMENT-DELIVERY-v1.webp` | **/checkout.html ; 当前付款成功/失败/待确认页面 ; /account/**；支付/权益/交付层次说明；重定向不授予权益。 |
| 82／`PLAN-SYSTEM-03` | `PHIOS-FIGURE-CONTACT-SUPPORT-ROUTING-v1.webp` | **当前Contact/Support正式入口**；支持渠道说明，只展示已存在渠道，保留实际联系操作。 |
| 83／`PLAN-SYSTEM-04` | `PHIOS-FIGURE-PRIVACY-DATA-LIFECYCLE-v1.webp` | **当前Privacy页；专业隐私/账户授权页**；资料处理、保留、撤回说明；不修改正式政策。 |
| 84／`PLAN-SYSTEM-05` | `PHIOS-FIGURE-DIGITAL-PRODUCT-EXPECTATIONS-v1.webp` | **当前数字产品政策与Terms页**；轻量内容类型/交付说明，不用大Hero挡正文。 |
| 85／`PLAN-SYSTEM-06` | `PHIOS-ICON-EIGHT-BOOKS-ICON-v1.webp` | **全站知识/八册入口**；89张中的WebP说明图；与本轮更新的正式EIGHT-BOOKS UI图标分开登记。 |
| 86／`PLAN-SYSTEM-07` | `PHIOS-ILLUSTRATION-EMPTY-NO-SAVED-CONTENT-v1.webp` | **/account/ 与共享已保存内容空状态**；只在真正查询成功且列表为空时显示；不是加载失败。 |
| 87／`PLAN-SYSTEM-08` | `PHIOS-ILLUSTRATION-NO-MATCHING-RESULTS-v1.webp` | **/search/ ; /knowledge/ask/ 的无匹配来源状态**；只在检索成功但无匹配时显示；不是未登录或网络错误。 |
| 88／`PLAN-SYSTEM-09` | `PHIOS-ILLUSTRATION-ACCESS-REQUIRES-PERMISSION-v1.webp` | **需要登录/授权的共享状态**；登录/授权不足时显示；不得暴露对象名、节点或私人图。 |
| 89／`PLAN-SYSTEM-10` | `PHIOS-ILLUSTRATION-TEMPORARY-LOAD-FAILURE-v1.webp` | **共享图片/数据暂时加载失败状态**；网络/服务故障时显示且可重试；自身图片失败仍有纯文字后备，防递归。 |


## 附录 B｜来源、核对范围与技术依据

本工单以用户本轮上传完成报告、Hero/Brand/Icon纠正和R4原manifest为输入。本轮只制作交付工单、精确89项绑定输入和审阅用HTML；没有执行R2 GET、网站部署或仓库写入，也没有验证89张的实际画面。与R4相比新增的逐图图位和执行门槛属于实施要求，不是“当前网站已经如此”的事实陈述。

- [S1] 本会话附件`PHIOS-NEW-89-R2-MANIFEST-R4.csv`：89行原清单，81 Entrance＋8 financial。文件名、planId、entryId和objectKey保持原样；原PLANNED／NOT_UPLOADED仅保留为历史字段，不代表本轮用户状态。
- [S2] 本轮GitHub读取`assets/customer-ui/js/public-index-copy.js`：blob `9cb25ae69aa23882434c3a6f912567b36e612971`；仍以`main h1`父元素附加Hero，调用统一公共视觉hydrator。是本次要排查的结构线索，不是已完成CSS故障复现。
- [S3] 本轮GitHub读取`assets/customer-ui/js/assets.js`：blob `f84f1ede0fba4f004fed7d2ab0e6df299325bc54`；当前客户Registry路径、assetId与role映射分开，存在force-cache读取。
- [S4] 本轮GitHub读取`assets/customer-ui/js/seven-volume-assets.js`：blob `2f5b69f6cafc073dd6e2bd1e2a5550bf3eeac936`；文件虽名seven-volume，实际读取八册Registry，不能凭文件名全局重构。
- [S5] 历史附件仍把HERO-023用于Book1，并列旧Brand7/8文件。新的HERO-023=Membership及Brand7/8纠正来自本轮用户消息；工作单要求显式迁移，未私自改动书册编号。

技术验收依据，仅用于浏览器/交付质量，不替代PHI OS产品权威：

- [T1] Cloudflare R2 Public buckets：r2.dev面向开发、受限流，custom domain提供缓存等正式交付能力；根URL不是对象目录索引。官方文档读取于2026-10-10。
- [T2] MDN `<img>`：实际width/height、lazy、alt、srcset和CORS行为用于实现验收。官方文档读取于2026-10-10。
- [T3] W3C WCAG 2.2 Understanding 1.4.3：普通文字4.5:1、大号文字3:1；Logo有规则例外，但本工单仍要求肉眼可辨与正确品牌版本。官方文档读取于2026-10-10。

```text
T1 https://developers.cloudflare.com/r2/buckets/public-buckets/
T2 https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img
T3 https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum
```
