# PHI OS Volume I Foundation

本目录完成以下开发里程碑，并以 2026-07-21 版《现实形成与体验》第一册 PDF 为唯一内容基线。

- M0-W2-T04：Book Manifest
- M0-W3-T01：PHI OS Core Language
- M0-W3-T03：术语状态
- M0-W3-T04：同义词漂移约束
- M0-W4-T01：Figure Registry
- M0-W4-T02：Figure 命名冻结
- M0-W4-T03：Figure 文件夹
- M0-W4-T04：Figure 输出规格
- M0-W5：Research Registry
- M0-W6：Foundation Validation 已建立；总冻结须等待三册、Thesis 与 Blueprint v4.0 完成总验收

`content/registry/` 是网站、Reality Atlas、搜索、阅读引擎与未来 API 的研究单一真源；`content/glossary/` 提供网站语言层；`assets/images/figures/` 是正式图像资产入口。`data/` 只保留 Schema、迁移或运行数据。任何界面文案可以改变，但不得绕过 `concepts.json` 与 `synonym-policy.json` 自行创造核心术语。

运行 `node scripts/validate-foundation.mjs` 可执行 M0 基础验证。
