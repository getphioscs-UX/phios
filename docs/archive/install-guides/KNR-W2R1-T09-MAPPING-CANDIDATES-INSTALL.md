# KNR-W2R1-T09｜P1–P5 Controlled Mapping Candidate Generation

## 安装

把本目录中的内容复制到 PHI OS 仓库根目录，允许覆盖 `package.json`。

## 专项检查

```powershell
npm run check:knr-w2r1-t09-mapping-candidates
```

## 每个 Part 的固定执行顺序

P1：

```powershell
npm run knowledge:manuscript:generate-map-p1 -- --dry-run
npm run knowledge:manuscript:generate-map-p1 -- --apply
npm run knowledge:manuscript:review-map-p1 -- --prepare
```

TL 完成 P1 Mapping Review JSON 后：

```powershell
npm run knowledge:manuscript:apply-map-p1 -- --dry-run
npm run knowledge:manuscript:apply-map-p1 -- --apply
```

随后才可执行 P2；P2、P3、P4、P5 使用同一顺序，只替换 Part 编号。

## 受控边界

- 一次只允许一个 Part 从 `unmapped` 进入 `candidate`。
- P2 要求 P1 已是 `candidate` 或 `mapped`；其余依此类推。
- 自动化最高权限仅为 `candidate / automation_candidate`。
- 不自动设置 `mapped`、`human_confirmed` 或 `humanVerified: true`。
- 不写入文章、Production、Runtime、Provider 或公开索引。
- 第二次对同一 Part 执行 `--apply` 为 no-op。
