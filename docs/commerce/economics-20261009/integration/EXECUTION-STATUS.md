# 实际集成结果与剩余工作

执行日期：2026-10-09。

实际修改仓库：`/workspace/scratch/56437cedc27b/phios`。本会话不能访问 Windows `C:\phios`，未修改该 Windows 工作树。

当前分支：main；HEAD：08413ff8。本轮 fetch 后，采用备份 stash 和经检查的内部转移差异，将 main 快进到 origin/main，再带回全部已审查修改。未创建提交、未 push。已保留最新 NAV 批次与其源文件。没有 AGENTS.md。原未提交修改已保留。原商业补丁反向检查通过，说明该可访问仓库已包含补丁，未重复应用。

阶段 A：16 项检查全部退出码 0，见 main-final-checks.json 与 main-* 逐项日志。新经济规则、严格商品 schema、BaZi 精确 successor 哈希、新方法生命周期预算及 Pages 构建均通过。没有复制附件 PASS。书籍价格未调整。Stripe 商品未重新创建或修改。Pages 增加独占构建锁及有限删除重试；竞争构建实测在清理目录前被拒绝。Windows 文件占用原因无法在 Linux 上直接复现。

阶段 B：部分完成，不能标记全部接线完成。

已实现：

- 迁移17提案：SQL 生成状态与跨 worker 持久锁，不新增成本池。仅 SQLite 验证，未执行远程迁移。
- 服务器 paid context：核验购买、账户、订单和 QA/LIVE 环境，再复用已有 ProductCostEnvelope。
- BaZi producer 适配入口：每次主调用或局部修复按稳定 requestId 与最坏成本建立 transport；仍保留原命盘与内容准入。
- 付费四问适配入口：复用现有历史存储和同一报告成本池；领域校验后保存；缓存回答校验摘要；第五问拒绝；会员额外问题需独立权限。
- SQLite 重开后状态保留、不同 worker 互斥、环境和跨账户拒绝、同请求缓存、四答持久化、第五问拒绝、未知用量冻结均通过。

实证限制：测试仅使用合成 SQL 订单与本地 Response fixture。没有真实模型调用、真实支付、上线交付或手机验收。测试中的定价与双语回答为 fixture，不证明真实模型价格或正文质量。

尚未完成的源码工作（不是统称“等生产批准”）：

1. account-method-reports.js 的客户 producer 当前仍只有受控 Ziwei 路径，未调用新增 BaZi 适配入口。需接入认证身份、canonical person/authority、真实模型注册与领域验证器。
2. 其余11方法未逐项绑定真实生产 producer。共享适配器可复用，但不能替代每个方法的权威输入、专业验证与交付入口。
3. 已在 persistMethodReportMaterial 接入预算关闭 hook：仅对携带服务器 paidReportBinding 且已保存匹配材料的报告关闭生命周期。现有 producer 尚未全面产生该绑定，旧报告返回 LEGACY_UNBOUND，不能伪造历史成本。
4. 已实现 account-report-questions.js POST、服务器来源与订单绑定、双语来源引用校验以及账户报告卡片的追问 UI。受控 local/qa/preview 仍须明确开启 generation flag、提供已核验模型配置，且报告已有 delivered 生命周期。旧报告缺少成本 lineage 时拒绝生成。当前材料读取仍由 Ziwei owner 执行，因此未宣称全部方法可追问。来源引用与问题摘要可机械校验；实际回答的专业质量与相关性仍须人审。
5. 未验证完整 BaZi 主生成→局部修复→双语专业正文→renderer→不可变保存的付费生产链；既有45组 prelive检查仍为零 provider。

状态：SOURCE = STAGE_A_PASS / STAGE_B_PARTIAL；DEPLOYED = NOT_DEPLOYED；LIVE_CUSTOMER = NOT_RUN。providerCalls = 0；actualPayments = 0；productionMigrationApplied = false；gitCommit = false；gitPush = false。

本轮没有改写任何已接受客户正文或图。后续正文更换、专业审核和生产开关继续依照现有明确关卡处理；付费测试与发布不在本轮授权范围。

## main 后续接线补充

- 真实服务级 fixture 验证覆盖：4次双语回答、保存、重放、第五问、无效引用、未知用量、退款与无授权预检。共6次本地 Response fixture，真实 provider 仍为0。
- POST 边界检查覆盖：未认证、跨来源、非法JSON、过大正文与未启用生产环境。
- 配置不足在费用或追问槽预留之前拒绝；真实成本池拒绝、尚未调用模型的请求记为已知0费用，不伪称未知模型用量。
- BaZi config/reports/bazi-deep-manuscript-r2/policy.json 仍为 productionActivated:false 且 humanAcceptReceipt:null。方法 renderer registry 当前仅含 ZWR；BaZi accepted reference copy 不可转移到其他命盘。必须完成实际命盘的权威映射、正文准入、renderer与native release，不能用参考命盘或通用模板补造交付。
- 远端 check-nav-accepted-batch-03.mjs 当前断言 registry 总数15，但最新 registry已有20，实际失败20!=15；batch01和02检查通过。该失败属于另一窗口新增导航批次的检查器滞后，本轮记录并保留，未修改导航断言。
- 本地 main 与 origin/main 同一 HEAD，但本轮修改尚未提交，所以远程 main 和 Windows C:\phios 尚未获得这些代码。本会话不能直接操作 Windows 工作树。
