# PHI Card Reading · PHI 配置卡片阅读

Parent: PHI Configuration R3.3 Publication Integration. Local candidate / READ_ONLY. Provider 0. No commit, push or deploy.

## 实际差异（先盘点，再实现）

| Owner / 接线 | 当前事实 | 本次增量 |
|---|---|---|
| Registry / Copy / Admission | v2 固定 48 张，六组各八张，12/12 既有接受；原始文件不改 | 双语公开 Gallery 消费相同固定原义，不产生个人结果 |
| Mapping Matrix v2 | 确定性选卡；TENSION 有条件且允许不选 | 复用原选择器，候选允许五张或六张；不改冻结矩阵 |
| 旧 reading composer | 强制六张；证据匹配失败回退首条解释 | 新本地候选不调用该回退；只能使用结果 owner 显式绑定的 unit IDs，无绑定显示未知 |
| v4.1 runtime cards | CARRIER 等六个运行槽位，many-to-many，不等于六组 deck 分类 | 未建立新的槽位→六组语义映射；缺合法 coordinate 或语义准入时阻断 |
| 现有 renderer | 旧报告有 PHI_CARD / 六卡摘要；新旧计算和权益边界各自存在 | 新候选独立于旧 Section ID，不改历史报告或其权益 |
| 图片 | 冻结登记不含网络字节证明 | GET-only 下载原始 48 张；解码与尺寸见 ASSET-BYTES / BROWSER-CHECKS，未改艺术资产 |
| My Reading | R3.3 私人作者出版 ≠ 已准入可复用客户结果 | 候选通过 server-side resolveOwnedResult 读取；实际账户适配器未接，网页私人入口保持关闭 |
| Profile reflection | 既有 Personal Evidence 需用户明确同意保存经历 | 一张／三张自愿选择，仅本页临时状态；无证据写入，无六维映射 |
| 商品与价格 | 既有 ECR_FULL_REPORT / PHI Configuration owner | 无新增 Card 商品、Checkout 或价格修改 |

## 本地候选范围

`scripts/lib/phi-card-reading-candidate.mjs` 是离线兼容性候选，不被 functions、生产客户页面或自动发布构建引用。授权结果必须来自现有 owner 的服务器解析器；浏览器不能用一个 paid / publishable 标志授权自己。

公开 Gallery 展示固定意义；My Reading 在真实适配器缺席时显示阻断；Synthetic 示例明确标为历史合成测试，不是作者私人配置，也不是当前客户结果。卡片详情区分原义、出现原因、可绑定解释、自愿现实对照。技术来源折叠显示，不作为卡片正面语言。

测试中的保存／重开是本地 owner fixture 的不可变结果文件往返，验证相同版本、同一 owner 与跨账户拒绝；没有声称生产登录、数据库持久化或客户重登通过。语言切换只切换已有固定文案及同一结果；没有计算或模型调用。

DRIVER 明确要求出生基线分类，拒绝当前现实优先级。PHASE 只描述出生激活位置，不预测未来。TENSION 不满足现有条件就不显示，不添加负面补位。

## 十章优先与剩余客户闭环

R3.3 现有 STATUS 是 PARTIAL / COMPLETE_PENDING_HUMAN_REVIEW。20/20 作者接受凭证与 40/40 正文校验已有记录，但最终出版质量仍待独立作者验收：SEC-07 原图局部英文重叠、人工 A4 打印、源图分辨率和双语编辑审阅。卡片候选不阻断该审阅，不改正文、PDF 或其接受状态。

以下项目仍 BLOCKED / NOT_VERIFIED：

- 当前 v4.1 已准入解释与冻结 Matrix v2 输入之间的正式 owner 适配关系；不能用章节关键词或旧兼容投影伪造。
- 当前解释的显式 cardContextUnitIds 双语来源绑定。没有绑定时不复制章节，不取首条解释兜底。
- 实际客户 ECR 付款权益与已准入结果解析器接线、保存／退出／真实重登重开、历史版本保留及撤销后的访问控制。
- Profile → 既有 Personal Evidence 的明确同意保存经历接线；目前反思仅临时选卡，不写入。
- 新页面／48 张艺术图的人工放大可读性接受。实际字节和浏览器解码成功不代替人审。
- 生产发布、通用新语义准入及任何新付费模型调用均未授权。

唯一 Master 是既有 `content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html`。本目录只是该 Master 下的本地审阅子入口，不创建第二份 Master。

## 运行

`node scripts/check-phi-card-reading-candidate.mjs`：离线兼容性及拒绝测试。

`node scripts/verify-phi-card-public-bytes.mjs`：只读公开 R2 GET，绝不写 R2。

`node scripts/check-phi-card-reading-browser.mjs`：离线服务已下载图片，390px / 1440px 自动交互、放大解码与截图。浏览器外部请求全部拒绝。

VAP 附带卡点修复：`check:vap-w15-w19` 不再复制整仓库。明确输入白名单排除嵌套 worktree、tmp 和审阅快照；测试夹具位于本仓库 .tmp，结束仅清理自己新建的夹具，不清理用户既存文件。
