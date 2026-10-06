# 八字三次调用后确定性修复

新增 provider 调用 **0**，新增费用 **0**。三次调用架构与原始正文保留，未自动验收、生产切换、提交或推送。

已恢复 D01–D15 图示语法及正确页序；增加三模式出版、精确源选段、覆盖检查、实际浏览器字号／边界测量和有界重排。双语版 48 页／15 图通过几何检查和 PDF 选段末尾核对。英文、中文版的动态内容无溢出，但前五页静态资源在本环境返回 403，因此整份检查仍为 FAIL。

正文修订仍待完成：逐段范围见 MANUSCRIPT-REPAIR-MAP.json。事业章七杀缺失会保持覆盖 FAIL；关系／家庭生活解释、时序矛盾与 S10 印杀区分未被自动改写。没有真实 usage JSON，不能核对旧账单 token。

架构 45 组、容量 48 组、修复负例和成本保护通过。全仓 npm run check 超过八分钟停留在 check:vap-w4，未取得最终 PASS；不将其算作已通过。Windows 字体与完整浏览器压力矩阵仍待验证。

## Windows 应用

本补丁是相对于已安装 LIVE-EXPERIMENT-PREPARED 补丁的增量；不覆盖 package.json 或命令注册表。下载补丁到 C:\phios 后，执行整块：

```powershell
& {
    Set-Location C:\phios
    $patch = Join-Path $PWD 'BAZI-POST-3-CALL-ZERO-PROVIDER-REPAIR.patch'
    if (-not (Test-Path -LiteralPath $patch)) { throw '请先把下载的补丁保存到 C:\phios，并使用上述完整文件名。' }
    git apply --check -- "$patch"
    if ($LASTEXITCODE -ne 0) { throw '补丁检查失败，停止应用。' }
    git apply -- "$patch"
    if ($LASTEXITCODE -ne 0) { throw '补丁应用失败。' }
    .\scripts\run-bazi-post-three-call-repair.ps1
}
```

重建入口只导入现有 LIVE 快照（存在时优先）或上传 HTML 的审阅源，安全合并 npm 命令；不会运行付费实验。每次新内容重建后，必须再次执行浏览器 QA 才能得到该快照的有效排版回执。

审阅入口：tools/review/BAZI-PUBLICATION-FIT-R1-HUMAN-REVIEW.html。
