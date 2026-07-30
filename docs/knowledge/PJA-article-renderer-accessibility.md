# PJA Article Renderer Accessibility

## Semantic Contract

- 页面只能有一个 Article H1。
- Article Section 是 H2。
- Mechanism、Timeline、Comparison 的标题是 H3；Comparison Column 是 H4。
- Mechanism 与 Timeline 使用 `<ol>`，Source 使用 `<ol>`。
- Question 与 Insight 使用非互动 `<aside>`。
- Next Node 使用 `<nav>`；无 Published Node 时不生成空链接。
- Figure 使用 `<figure>`、`<picture>`、`<img>` 与可用 caption。

## Keyboard 与触控

Shell 保留指向 `#article-main` 的 Skip Link。TOC、Source、Back、Save、Next Node 和 Exit Navigation 都使用原生 link/button；非互动 Block 不进入 Tab 顺序。互动目标最小高度为 44px，focus 行为继承 PHI OS 公共组件。

## Images 与文字

正文 Figure 必须有非空 alt。caption 与 credit 是独立文字节点。图片声明 width/height、lazy loading 与 async decoding；Hero 可 eager。长标题、Source 和连续字符串使用 `overflow-wrap`，不得造成页面级横向滚动。

## Responsive、Motion 与 Print

- 360px：单列 Article、Rail、Comparison、Timeline 和 Mechanism。
- 768px：正文单列，Rail 回到文流，Hero 可折叠。
- 1440px：正文与 Header 保持最大宽度，不无限延长行宽。
- Reduced Motion：Loading 动画停止。
- Print：保存、TOC 和 Exit Action 隐藏，正文保持线性顺序。

自动 DOM 测试验证单 H1、Heading 顺序、Question 非 button、列表语义、Figure alt/caption 和 Next Node nav；精确视觉结果必须由受控浏览器在三个断点复核。
