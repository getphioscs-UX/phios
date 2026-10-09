# World / Civilization Atlas 恢复验收报告

正式部署：https://e0622329.phios-github.pages.dev。正式入口：https://getphios.com/world?locale=zh-Hans。

## 已完成

- 新增 W16 的版本化后继记录；保留历史冻结文件、接受绑定和人工决策，npm check:book-v-atlas:r1:w16 已通过。
- 使用现有 data-i18n、en/zh-Hans 字典与同一个语言运行时。worldRecovery 命名空间的缓存升级回退已通过四种组合复现测试，页面不再显示翻译键。
- 27 个 Book V/VI 快照有可见主图、来源边界、结构化资料和图片失败/超时回退；只预取相邻快照。
- 分页视觉图谱、来源登记的相关情境、898 个对象的双语搜索、筛选、URL 状态、前进后退和键盘图片对话框已实现。
- 三张异常 R2 资产以取回的原字节按原路径恢复交付；每张的大小和 SHA-256 均与接受记录相同。未生成、删除、重命名图片，未改接受绑定。

## 机器证据

| 项目 | 结果 |
| --- | --- |
| 登记视觉 / 接受绑定 | 380 / 392（含 Book VI 新增的 12 个绑定） |
| 主消费者 | 27 |
| 本轮实际观察到的关联情境消费者 | 3 |
| 视觉图谱消费者 | 392，1568/1568 桌面/390px × en/zh-Hans 组合通过 |
| 仅深链 / 延后 / 未解释孤儿 / 失败消费者 | 0 / 0 / 0 / 0 |
| Book V 快照 | 15/15；60/60 屏幕与语言组合通过 |
| Book VI 快照 | 12/12；48/48 屏幕与语言组合通过 |
| 最终部署浏览器验收 | 164/164 通过，含 52 个视图、108 个快照及 4 个失败回退 |
| 英文泄漏片段 | 129 → 0 |
| Atlas 运行异常 | 0 |

消费者计数可重叠：所有主图与已观察的关联情境资产也可从视觉图谱发现。关联情境数仅计本轮实际解码可见的资产，不把潜在关联关系算作已实测。129 的“前”来自第一轮本地诊断，已包含部分恢复代码，不代表原正式站点基线；用户原截图另存为 user-before-world-translation-keys.png。

## 搜索覆盖

| 对象类型 | 数量 |
| --- | --- |
| macro-era | 11 |
| period | 20 |
| civilization | 120 |
| snapshot | 15 |
| comparison | 6 |
| trajectory | 16 |
| transition | 32 |
| scale-shift | 7 |
| loss-family | 6 |
| loss-type | 24 |
| book-section | 85 |
| reconfiguration-case | 60 |
| reconfiguration-window | 24 |
| reconfiguration-snapshot | 12 |
| current-dossier | 12 |
| lived-dimension | 14 |
| visual | 392 |
| runtime-position | 31 |
| admitted-current-evidence | 11 |

## 证据文件与检查

- changed-source-manifest.json：改动源文件及当前摘要。
- visual-coverage-ledger.json：逐资产消费者、桌面/移动/语言结果及实际 HTTP 200 image/webp 请求。
- deployed-copy-final/deployed-browser-receipt.json：最终正式版本截图、快照网络回执及运行诊断。
- visual-consumption/receipt.json：392 个资产的 1568 个请求/解码/可见组合。
- cached-copy-receipt.json、interaction-receipt.json：旧字典缓存、键盘、筛选 URL、前进后退与对话框测试。
- r2-exact-delivery-repair.json：原字节修复证明。
- orphan-report.json、completion-metrics.json：孤儿及汇总。

通过：World 来源/搜索/路由与绑定检查、全部资产浏览器消费、快照浏览器消费、双语副本与390px布局、缓存回归、交互回归、Pages 构建及发布边界、KAP 基础、当前 PDS 边界、CX-R31、无旧选择器、PWS-I2-W5、Zi Wei W15–W16、PVP Zi Wei Phase 9、PPR-C1 W0–W3、CX-R10–R30 及本次 Book V W16。

## 保留的边界

新的人工视觉接受仍待真人决定；本轮不赋予 PUBLIC_ACCEPTED。浏览器证据绑定上述正式部署版本，未以源检查替代正式验收。测试未执行账户保存、付款或付费模型调用。当前档案只消费已有服务端接受的子系统证据；不可用时保留 UNKNOWN，不推导整个地区结论。
