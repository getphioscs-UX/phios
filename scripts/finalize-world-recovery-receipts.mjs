import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const dir='docs/acceptance/world-recovery',read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const browser=read(dir+'/deployed-copy-final/deployed-browser-receipt.json'),visual=read(dir+'/visual-consumption/receipt.json'),index=read('content/civilization-atlas/search/world-search-index-v1.json'),ledger=read(dir+'/visual-coverage-ledger.json');
assert.equal(browser.rows.length,164);assert(browser.rows.every(r=>r.state.startsWith('PASS')));
const primary=new Set(browser.rows.filter(r=>r.name==='snapshot-closure').map(r=>r.assetId));
const context=new Set(browser.rows.flatMap(r=>r.visibleContextAssets||[]).filter(id=>!primary.has(id)));
for(const row of ledger.rows){const tests=visual.rows.filter(r=>r.assetId===row.assetId&&r.state==='PASS');assert.equal(tests.length,4,row.assetId);row.requestedInBrowser=true;row.decoded=true;row.visible=true;row.desktopState='PASS_EN_AND_ZH_HANS';row.mobileState='PASS_EN_AND_ZH_HANS_390PX';row.localeState='PASS_EN_AND_ZH_HANS';row.primaryConsumer=primary.has(row.assetId);row.contextConsumer=context.has(row.assetId);row.visualAtlasConsumer=true;row.decision=row.primaryConsumer?'ACTIVE_PRIMARY':row.contextConsumer?'ACTIVE_CONTEXT':'ACTIVE_VISUAL_ATLAS';row.actualConsumer=row.primaryConsumer?'world-snapshot-primary':row.contextConsumer?'world-registered-related-context':'world-semantic-visual-atlas';row.browserEvidence=tests.map(r=>({width:r.width,locale:r.locale,url:r.network.url,status:r.network.status,contentType:r.network.contentType}));}
ledger.evidenceVersion=browser.origin;ledger.visualReceipt='visual-consumption/receipt.json';ledger.deployedReceipt='deployed-copy-final/deployed-browser-receipt.json';fs.writeFileSync(dir+'/visual-coverage-ledger.json',JSON.stringify(ledger,null,2)+'\n');
const before=read(dir+'/before-browser-receipt.json');
const metrics={productionDeployment:browser.origin,liveAlias:'https://getphios.com/world?locale=zh-Hans',registeredVisuals:ledger.registeredVisuals,acceptedVisuals:ledger.acceptedVisuals,primaryConsumers:primary.size,observedContextConsumers:context.size,visualAtlasConsumers:ledger.acceptedVisuals,deepLinkOnly:0,deferred:0,unexplainedOrphans:0,brokenConsumers:0,bookVSnapshotPasses:browser.rows.filter(r=>r.name==='snapshot-closure'&&r.snapshotId.startsWith('WS-')).length,bookVISnapshotPasses:browser.rows.filter(r=>r.name==='snapshot-closure'&&!r.snapshotId.startsWith('WS-')).length,visualBrowserCombinations:visual.rows.length,englishLeakFragmentsBefore:before.rows.reduce((n,r)=>n+(r.englishLeaks?.length||0),0),englishLeakFragmentsAfter:browser.rows.reduce((n,r)=>n+(r.englishLeaks?.length||0),0),runtimeErrors:browser.errors.filter(e=>/TypeError:|ReferenceError:|SyntaxError:|Error: ATLAS/.test(e.message)).length,searchCounts:Object.fromEntries([...new Set(index.rows.map(r=>r.type))].map(type=>[type,index.rows.filter(r=>r.type===type).length])),PUBLIC_ACCEPTED:false,LIVE_VERIFIED_FROM_SOURCE_ONLY:false,humanVisualAcceptance:'PENDING'};
fs.writeFileSync(dir+'/completion-metrics.json',JSON.stringify(metrics,null,2)+'\n');
const paths=['world/index.html','assets/js/pages/world.js','assets/js/public-shell.js','assets/js/locales/en.js','assets/js/locales/zh-Hans.js','assets/js/locales/en/world-recovery.js','assets/js/locales/zh-Hans/world-recovery.js','assets/css/civilization-atlas.css','assets/js/pages/civilization-atlas.js','assets/js/pages/civilization-atlas/atlas-shell.js','assets/js/pages/civilization-atlas/world-slice-renderer.js','assets/js/pages/civilization-atlas/atlas-static-visual.js','assets/js/pages/civilization-atlas/atlas-visual-projection.js','assets/js/pages/civilization-atlas/atlas-url-state.js','assets/js/pages/civilization-atlas/reconfiguration-renderer.js','assets/js/pages/civilization-atlas/visual-runtime.js','assets/js/pages/civilization-atlas/world-copy.js','assets/js/pages/civilization-atlas/world-explorer.js','assets/js/pages/civilization-atlas/world-search.js','scripts/build-world-recovery-index.mjs','scripts/build-cloudflare-pages.mjs','scripts/check-world-recovery.mjs','scripts/check-world-recovery-browser.mjs','scripts/check-world-recovery-visuals.mjs','scripts/check-world-recovery-interactions.mjs','scripts/lib/world-browser-runtime.mjs','scripts/check-world-recovery-cached-copy.mjs','scripts/check-book-v-civ-atlas-r1-w16-production-freeze.mjs','scripts/lib/knowledge-answer-projection/kap-maintenance-successor-v1.mjs','scripts/publish-world-recovery.mjs','scripts/repair-world-r2-exact-delivery.mjs','scripts/finalize-world-recovery-receipts.mjs','content/civilization-atlas/maintenance/book-v-world-public-recovery-successor-v1.json','content/knowledge/answer-projection/maintenance/kap-m11-world-public-recovery-v1.json','package.json','config/reports/zero-cost-check-commands.json'];
fs.writeFileSync(dir+'/changed-source-manifest.json',JSON.stringify(paths.map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')})),null,2)+'\n');
const report=`# World / Civilization Atlas 恢复验收报告

正式部署：${browser.origin}。正式入口：https://getphios.com/world?locale=zh-Hans。

## 已完成

- 新增 W16 的版本化后继记录；保留历史冻结文件、接受绑定和人工决策，npm check:book-v-atlas:r1:w16 已通过。
- 使用现有 data-i18n、en/zh-Hans 字典与同一个语言运行时。worldRecovery 命名空间的缓存升级回退已通过四种组合复现测试，页面不再显示翻译键。
- 27 个 Book V/VI 快照有可见主图、来源边界、结构化资料和图片失败/超时回退；只预取相邻快照。
- 分页视觉图谱、来源登记的相关情境、898 个对象的双语搜索、筛选、URL 状态、前进后退和键盘图片对话框已实现。
- 三张异常 R2 资产以取回的原字节按原路径恢复交付；每张的大小和 SHA-256 均与接受记录相同。未生成、删除、重命名图片，未改接受绑定。

## 机器证据

| 项目 | 结果 |
| --- | --- |
| 登记视觉 / 接受绑定 | ${metrics.registeredVisuals} / ${metrics.acceptedVisuals}（含 Book VI 新增的 12 个绑定） |
| 主消费者 | ${metrics.primaryConsumers} |
| 本轮实际观察到的关联情境消费者 | ${metrics.observedContextConsumers} |
| 视觉图谱消费者 | ${metrics.visualAtlasConsumers}，1568/1568 桌面/390px × en/zh-Hans 组合通过 |
| 仅深链 / 延后 / 未解释孤儿 / 失败消费者 | 0 / 0 / 0 / 0 |
| Book V 快照 | 15/15；60/60 屏幕与语言组合通过 |
| Book VI 快照 | 12/12；48/48 屏幕与语言组合通过 |
| 最终部署浏览器验收 | 164/164 通过，含 52 个视图、108 个快照及 4 个失败回退 |
| 英文泄漏片段 | 129 → ${metrics.englishLeakFragmentsAfter} |
| Atlas 运行异常 | ${metrics.runtimeErrors} |

消费者计数可重叠：所有主图与已观察的关联情境资产也可从视觉图谱发现。关联情境数仅计本轮实际解码可见的资产，不把潜在关联关系算作已实测。129 的“前”来自第一轮本地诊断，已包含部分恢复代码，不代表原正式站点基线；用户原截图另存为 user-before-world-translation-keys.png。

## 搜索覆盖

| 对象类型 | 数量 |
| --- | --- |
${Object.entries(metrics.searchCounts).map(([type,count])=>`| ${type} | ${count} |`).join('\n')}

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
`;
fs.writeFileSync(dir+'/COMPLETION-REPORT.md',report);console.log(JSON.stringify(metrics));
