# BaZi R1.1 — Publication closure candidate

本轮是新出版候选的人审交付，**不是正式商业发行完成**。R1 Delivery 本地技术修复按用户本次明确决定为 ACCEPTED；此前48页正文不获商业出版批准。R11既有内容来源按用户回复为 ACCEPT；本轮新增条件化编辑、出版版本、商业水印和Q87发行准入均未自动接受。

## P0：已接受交付链保留

沿用 `C:/phios/.worktrees/five-method-paid-report-production-r1`，基线 main `3c197c509e01e95cc18651cb2a05bf63a1259dc4`。未创建另一个Master。R1的18个源文件SHA完全不变；对原私有冻结IR重新生成HTML的摘要仍精确等于原签发摘要。没有重跑交付长套件或重建Account/PDF/Artifact Store/Consent/Entitlement链。详见R1-COMPATIBILITY-CHECK.json。

本轮仅9个BaZi出版/原Narrative owner源文件；独立patch和SHA见R1-1-PUBLICATION-CHANGES.patch、R1-1-SOURCE-CHANGE-RECEIPT.json。没有修改其他方法、Pre-Entry、Design System、WebP、Stripe、生产R2/D1或其他工作树。

## P1：数据一致性

- 原“五行20”包含4个天干、4个地支本气与12个藏干，不是加权分数。新图采用4干+12藏干=16次，地支不重复加入；底层native三类原始inventory仍完整保存，不重算命盘。
- A：申月/秋令，16次五行干记录；十神为三他干+12藏干=15，排除日主自身。B、C随实际藏干数量变化，分别为11/10、12/11，非硬编码16。
- 原图例“子月·冬令”写死在diagram fidelity层；R1.1按同一native chart的月支/season生成。日主、四柱、藏干、十神、图表总数、封面日期/时间与source digest均交叉断言。
- A出生输入为吉隆坡3.139/101.6869、Asia/Kuala_Lumpur、UTC+08:00、1991-08-17 09:20。native APPARENT_SOLAR_TIME_V1：经度修正-73.2524min、均时差-4.231996418min，总计-77.484396418min，真太阳时08:02:30.936215，故辰时不修改。
- 地点/时区是合成canonical input的声明；本轮另用已安装ICU 78.3核对三个UTC offset。不把这种本地核对称为真实客户出生地点或出生时间证据核验。
- 21项交叉来源/篡改拒绝；辰巳边界、立秋换月、立春换年、真太阳时前一日期等7个native案例。精确太阳节气边界取自同版本native输出，不使用人工覆盖时柱。

数据全文与逐柱对照见DATA-SOURCE-MAPPING.csv、CALCULATION-AND-CONTENT-CHECKS.json、BOUNDARY-AND-CROSS-FIELD-CHECKS.json及cases/*/source.json。

## P2：原9张近空白续页

原14/18/22/26/30/34/38/42/46正文选段均为0字符：固定两页计划在短合成稿被第一页全部取完后仍输出第二页。

R1.1按完整中英配对段落分区，所有来源单元保持可见，没有截断/隐藏或用删除页掩盖正文遗漏。八个主题有新增实质正文；当前时序按资料范围完整排入一页，不再强制第二张空页。原固定图片/九个主题不改。多关系图按实际数据另排一张动态技术页，避免多边/双语标签重叠。

最终页数为A49/B49/C50，差异来自正文与原局关系数量；不是要求所有客户固定同一页数。逐旧页处置见BLANK-PAGE-DISPOSITION.md/json。

## P3：成熟阅读正文与来源边界

没有第二套Narrative Runtime。复用现有native professionalTopics、customerNarrative、Reality Bridge、R11 editorial bridge与Ten-God说明；只在原 `bazi-customer-narrative-composer.js` 扩展条件化深度及周期机制。R11原参考投影包含特定命盘的字面断语，没有把这些断语直接移植给其他命盘。

七个生活主题分别由相应功能组合、透藏、柱位接口及承载条件出发；实际情境写成比较/观察问题，不伪造职业、财富、伴侣或家庭经历。长期篇保留真实大运顺序/角色，并解释支持与输出、责任与支持、交换与留存等不同条件组合；相同机制只出现一次。列出的年龄是native年龄参考，不替代精确交运日期或边界日准入。

A没有目标日期/时间/时区，因此S10明确为 CURRENT_TIMING_UNAVAILABLE_EXPLICIT_BOUNDARY。B/C使用明确目标context及同一次native execution生成当前大运/年度层，不以出生时间或系统当前时间兜底。

九主题正文旧夹具64段跨主题重复（超过首现的重复段数），三新稿均为0；此指标不统计固定页、目录、章节卡片/正文复用、图注和品牌页脚。三组在事业、财富、人生结构的条件性解释路径产生不同分支，其他四主题在本组资料上可能共享同一条件分支；不能把这称为穷尽全部组合。命盘机制、角色、接口及周期也随native资料变化。详见CONTENT-DIFFERENTIATION-AND-REPETITION.json。机器指标不代替对成熟度的Human Review。

## P4：目录、书签、引用与水印

PDF采用原生outline/tagged输出，封存时补齐固定目录入口，P06使用用户新指定的既有R2原图，并叠加13个数字槽/导航热点；封存和Q87必须保持书签树与目的页完全一致。报告、Subject、Order、chart/source/publication/manuscript摘要封存到metadata；文件名只有不含生日等私人字段的合成case引用。

所有审核页保留可见SYNTHETIC QA。当前不存在可据以宣称已批准的BaZi商业水印回执，因此没有伪造商业水印通过，也没有把本批文件签发给客户。建议方案及待决定事项见COMMERCIAL-WATERMARK-PROPOSAL.md。正式客户版本必须用真实服务端Subject/Order绑定、批准水印及重新验证的新字节；不能剥掉本批合成标签直接交付。

B/C原生字体ToUnicode将“巳”映射成U+2E92部首。封存仅将对应映射恢复U+5DF3，保留图形、字体轮廓与内容流；[Unicode官方对照](https://www.unicode.org/charts/PDF/U2E80.pdf#page=3)。原始打印文件保留。QA再比对每页完整来源正文，修正不是扩大字符串容差来掩盖漏文。

## P5：现有Q87流程

只调用原 `tools/review/report-storage-optimization-r1/optimize.py` 的既有optimize/inspect函数，对这三份确切封存字节做Q87；未修改原optimizer，未重压其他方法、旧R1或历史客户文件。保留raw print、sealed、Q87三阶段SHA。

逐页校验页数/纸张边界、内容流、提取文字、字体payload/名称、identity metadata；另核对完整书签树、链接、SYNTHETIC标记及Subject/Order绑定。对所有最终页面渲染PNG并计算实际像素差。详细bytes/CPU/视觉值由FINAL-CANDIDATE-MANIFEST.json及PDF-QA-A/B/C.json提供。

Q87仍为 LOCAL_PROOF_NOT_HUMAN_ACCEPTED，没有正式Artifact Store写入。人审接受出版与水印后，真正客户文件的字节会不同，必须重新完成同等验证和最终SHA封存。

## P6：验收范围与仍关闭的门

三组明显不同合成资料；全部真实native计算、真实Edge印刷、实际PDF提取/书签/全页PNG/Q87，无收费模型调用。新稿的冻结段落逐物理页全部存在。原R1冷进程Reopen、权限与撤销已被用户接受，本轮仅作18源SHA及原HTML摘要的必要兼容检查，未重复长套件。

| 状态 | R1已接受技术修复 | R1.1候选 |
|---|---|---|
| PDF_RENDER | 保留 | 本地真实PDF/来源完整/fit通过 |
| PDF_OPTIMIZATION | 旧候选不替换 | 新确切封存字节的Q87机器验证，待人审 |
| PRIVATE_STORAGE | 既有本地证明保留 | 未签发、未写正式Artifact Store |
| ACCOUNT_PDF_DOWNLOAD | 既有通过保留 | 不把本批合成候选接到客户账户 |
| REOPEN | 既有通过保留 | 未签发；不冒充新客户重开通过 |

没有运行npm run check、全量回归、commit/push/merge/deploy、生产D1/R2/Stripe写入或付费Provider。Stripe Sandbox认证属于独立未验证状态，没有把本轮本地出版测试称作真实客户发行通过。

## 最小后续实施顺序

1. 人审本次完整中英PDF、逐页PNG、正文差异/来源和周期边界；决定商业水印策略与R1.1正式出版版本。
2. 在既有renderer内按已批准版本读取IR实际页数、outline/tagged及正式标记；保留旧R1的48页/default行为和原字节读回。当前R1 worker/账户交付代码故意没有被覆盖。
3. 原生PDF→封存→批准的Q87形成一个受控provenance receipt，保留raw/sealed/optimized SHA；不能把优化字节直接冒充当前R1 raw verifier digest。现有Artifact Store接收经过验证的最终pdfRef，旧已签发文件保持原样。
4. 再做获授权的Cloud QA与实际账户权限/下载；重新下载只读已签发最终对象，绝不重生成、重压或重收费。新出版/商业水印/Q87/生产部署均无自动ACCEPT。

最新P06指示已执行：附件、R2、既有registry SHA均为9ab82efc1756b34f810b12a82b542a5df835fb53000d1438c7c1fccc58f243d5。保留既有13行图面，不重写文字或生成新目录图；页码来自最终layout。人生结构正文与书签保留。计算时间说明移到P07。动态目录草稿已废弃。P06-SOURCE-BINDING.json保留原有槽位来源；商业出版状态不因绑定原图自动改变。
