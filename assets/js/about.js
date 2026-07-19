(function () {
  "use strict";
  const dictionaries = {
  "en": {
    "nav.home": "HOME",
    "nav.start": "START",
    "nav.myReality": "MY REALITY",
    "nav.explore": "EXPLORE",
    "nav.services": "SERVICES",
    "nav.academy": "ACADEMY",
    "nav.about": "ABOUT",
    "hero.eyebrow": "About PHI OS · Reality Navigation",
    "hero.title": "Intelligence can answer.<br><em>Navigation must continue.</em>",
    "hero.lead": "PHI OS is being developed as a Reality Navigation system: a unified way to understand how a specific reality is forming, changing and continuing through time.",
    "hero.begin": "Begin Reality Navigation",
    "hero.thesis": "Read the Thesis",
    "hero.atlas": "Explore the Reality Atlas",
    "origin.eyebrow": "Architecture Alignment",
    "origin.title": "From research to infrastructure",
    "origin.copy": "The Reality Navigation Thesis establishes the category. The Unified Runtime Framework defines the architecture. PHI OS turns both into an evolving knowledge, experience and platform environment.",
    "origin.link": "See the architecture ↓",
    "why.eyebrow": "01 · Why Reality Navigation",
    "why.title": "We do not lack intelligence. We lack continuity.",
    "why.intro": "More information and more analytical power do not automatically reveal what matters, what is changing or what should happen next.",
    "why.statement": "Reality does not arrive as a single question with a single answer.",
    "why.body1": "A personal transition may involve identity, relationships, resources, timing, health, responsibility and future direction at the same time. An organizational problem may involve people, structure, finance, culture, technology and external conditions.",
    "why.body2": "Knowledge is divided into disciplines. Reality is not. The challenge is therefore not only to produce better answers, but to maintain orientation while multiple parts of reality continue to change together.",
    "difference.eyebrow": "02 · A Different Function",
    "difference.title": "Artificial Intelligence and Reality Navigation",
    "difference.copy": "They are complementary, but they solve different layers of the problem.",
    "difference.ai.title": "Artificial Intelligence",
    "difference.ai.1": "Expands access to reasoning",
    "difference.ai.2": "Answers the question presented",
    "difference.ai.3": "Interprets available context",
    "difference.ai.4": "Produces insight",
    "difference.rn.title": "Reality Navigation",
    "difference.rn.1": "Maintains orientation through change",
    "difference.rn.2": "Examines which question now matters",
    "difference.rn.3": "Preserves continuity across time",
    "difference.rn.4": "Connects insight to direction and adaptation",
    "architecture.eyebrow": "03 · From Research to PHI OS",
    "architecture.title": "One continuous architecture.",
    "architecture.intro": "PHI OS is not a separate idea placed on top of the thesis. It is the operational continuation of the research.",
    "architecture.p1": "The proposed computational category.",
    "architecture.p2": "The research foundation explaining why the category is necessary.",
    "architecture.p3": "The theoretical language for evidence, state, transition and continuity.",
    "architecture.p4": "The integrated reference architecture and implementation.",
    "architecture.p5": "Reading, navigation, professional interpretation and intervention.",
    "architecture.p6": "The future infrastructure for users, practitioners, organizations and developers.",
    "building.eyebrow": "04 · What PHI OS Is Building",
    "building.title": "Research that can be read, experienced and continued.",
    "building.copy": "Each layer serves a different way of entering the same Reality Navigation architecture.",
    "building.b1.title": "Three Books",
    "building.b1.copy": "The human-readable route from how reality forms to how worlds continue.",
    "building.b1.link": "Explore the knowledge route →",
    "building.b2.copy": "A scrollable, layered map of the fourteen-part PHI OS architecture.",
    "building.b2.link": "Enter the Atlas →",
    "building.b3.copy": "Entry, Reconstruction, Reading, Navigation, Review and Continuity.",
    "building.b3.link": "Begin a journey →",
    "building.b4.copy": "Persistent evidence, state versions, reviews and evolving reality records.",
    "building.b4.link": "Enter My Reality →",
    "building.b5.title": "Professional & Academy",
    "building.b5.copy": "Human interpretation, responsible intervention and practitioner learning.",
    "building.b5.link": "Enter the Academy →",
    "building.b6.title": "Enterprise & Developer",
    "building.b6.copy": "Future interoperable infrastructure for organizations, agents and runtime applications.",
    "building.b6.link": "View services →",
    "journeys.eyebrow": "05 · Three Ways to Enter",
    "journeys.title": "Three journeys. One PHI OS.",
    "journeys.copy": "Different users may enter through lived reality, knowledge or platform continuity.",
    "journeys.j1.title": "Reality Journey",
    "journeys.j1.copy": "For a reality that has started to change and needs to be reconstructed, read and navigated.",
    "journeys.j2.title": "Knowledge Journey",
    "journeys.j2.copy": "For readers and learners entering the Thesis, Atlas, books, figures and Academy.",
    "journeys.j3.title": "Platform Journey",
    "journeys.j3.copy": "For preserving Runtime Memory and extending it into reports, services, membership and future infrastructure.",
    "founder.eyebrow": "06 · Founder & Research Origin",
    "founder.title": "Founded by Teresa Lee.",
    "founder.body1": "PHI OS emerged from a long effort to understand why different systems can each reveal something meaningful about a person or situation while still failing to preserve the whole reality across time.",
    "founder.body2": "The research gradually converged around a single problem: intelligence, interpretation and professional knowledge require a shared Runtime architecture if they are to remain oriented to a specific evolving reality.",
    "founder.m1.label": "AUTHOR",
    "founder.m2.label": "RESEARCH",
    "founder.m3.label": "REFERENCE ARCHITECTURE",
    "founder.m4.label": "LOCATION",
    "enter.eyebrow": "Enter PHI OS",
    "enter.title": "Start with the reality, knowledge or pathway that matters now.",
    "enter.copy": "PHI OS is still developing, but its core route is already available: observe what is changing, preserve the evidence and continue from a more coherent position.",
    "enter.begin": "Begin Reality Navigation",
    "enter.thesis": "Read the Thesis",
    "enter.atlas": "Explore the Atlas",
    "footer.copy": "Reality Navigation Platform · Founded by Teresa Lee"
  },
  "zh-Hans": {
    "nav.home": "首页",
    "nav.start": "开始",
    "nav.myReality": "我的现实",
    "nav.explore": "探索",
    "nav.services": "服务",
    "nav.academy": "学院",
    "nav.about": "关于",
    "hero.eyebrow": "关于 PHI OS · 现实导航",
    "hero.title": "智能可以回答。<br><em>导航必须继续。</em>",
    "hero.lead": "PHI OS 正在被发展为一个 Reality Navigation 系统：以统一方式理解一个具体的现实如何形成、改变，并随时间继续运行。",
    "hero.begin": "开始现实导航",
    "hero.thesis": "阅读论文",
    "hero.atlas": "探索现实地图集",
    "origin.eyebrow": "架构对齐",
    "origin.title": "从研究走向基础设施",
    "origin.copy": "Reality Navigation Thesis 建立计算类别；Unified Runtime Framework 定义理论架构；PHI OS 将两者转化为持续发展的知识、体验与平台环境。",
    "origin.link": "查看完整架构 ↓",
    "why.eyebrow": "01 · 为什么需要现实导航",
    "why.title": "我们并不缺少智能。我们缺少连续性。",
    "why.intro": "更多信息与更强分析能力，并不会自动说明什么最重要、什么正在改变，以及下一步应该做什么。",
    "why.statement": "现实并不会以一个问题和一个答案的形式出现。",
    "why.body1": "一段个人转变可能同时涉及身份、关系、资源、时机、健康、责任与未来方向；一个组织问题也可能同时涉及人员、结构、财务、文化、技术与外部条件。",
    "why.body2": "知识被划分为不同学科，现实本身却没有被分割。因此挑战不再只是产生更好的答案，而是在现实多个部分共同变化时，仍然维持方向。",
    "difference.eyebrow": "02 · 不同的功能",
    "difference.title": "人工智能与现实导航",
    "difference.copy": "两者可以互相补充，但解决的是不同层次的问题。",
    "difference.ai.title": "人工智能",
    "difference.ai.1": "扩大获得推理能力的途径",
    "difference.ai.2": "回答已经提出的问题",
    "difference.ai.3": "解释当前可用的情境",
    "difference.ai.4": "产生洞见",
    "difference.rn.title": "现实导航",
    "difference.rn.1": "在变化中维持方向",
    "difference.rn.2": "辨认现在真正重要的问题",
    "difference.rn.3": "跨时间保存连续性",
    "difference.rn.4": "把洞见连接到方向与适应",
    "architecture.eyebrow": "03 · 从研究走向 PHI OS",
    "architecture.title": "一个连续的架构。",
    "architecture.intro": "PHI OS 不是叠加在论文上的另一个概念，而是研究进入运行与实践后的延续。",
    "architecture.p1": "所提出的新计算类别。",
    "architecture.p2": "解释这一类别为何必要的研究基础。",
    "architecture.p3": "关于证据、状态、转变与连续性的理论语言。",
    "architecture.p4": "整合式参考架构与实现。",
    "architecture.p5": "Reading、Navigation、专业读取与介入。",
    "architecture.p6": "面向使用者、专业人员、组织与开发者的未来基础设施。",
    "building.eyebrow": "04 · PHI OS 正在建立什么",
    "building.title": "可以被阅读、体验并持续发展的研究。",
    "building.copy": "每一层都提供进入同一个 Reality Navigation 架构的不同方式。",
    "building.b1.title": "三册书",
    "building.b1.copy": "从现实如何形成，到人与世界共同运行，再到世界如何继续的人类阅读路径。",
    "building.b1.link": "探索知识路径 →",
    "building.b2.copy": "以滚动与逐层探索方式呈现 PHI OS 十四部架构。",
    "building.b2.link": "进入现实地图集 →",
    "building.b3.copy": "Entry、Reconstruction、Reading、Navigation、Review 与 Continuity。",
    "building.b3.link": "开始现实旅程 →",
    "building.b4.copy": "保存证据、状态版本、复盘记录与持续发展的现实档案。",
    "building.b4.link": "进入我的现实 →",
    "building.b5.title": "专业服务与学院",
    "building.b5.copy": "人类专业读取、负责任的介入与实践者学习。",
    "building.b5.link": "进入学院 →",
    "building.b6.title": "企业与开发者",
    "building.b6.copy": "面向组织、Agent 与 Runtime 应用的未来互操作基础设施。",
    "building.b6.link": "查看服务 →",
    "journeys.eyebrow": "05 · 三种进入方式",
    "journeys.title": "三条旅程，一个 PHI OS。",
    "journeys.copy": "不同使用者可以从现实、知识或平台连续性进入。",
    "journeys.j1.title": "现实旅程",
    "journeys.j1.copy": "适合已经开始变化、需要被重建、读取与导航的现实。",
    "journeys.j2.title": "知识旅程",
    "journeys.j2.copy": "适合从 Thesis、Atlas、三册书、图像与 Academy 进入的读者和学习者。",
    "journeys.j3.title": "平台旅程",
    "journeys.j3.copy": "适合保存 Runtime Memory，并延伸到报告、服务、会员与未来基础设施。",
    "founder.eyebrow": "06 · 创办人与研究起点",
    "founder.title": "由 Teresa Lee 创立。",
    "founder.body1": "PHI OS 来自一段长期探索：为什么不同系统都能对一个人或处境揭示有意义的部分，却仍然无法跨时间保存完整现实。",
    "founder.body2": "研究逐渐汇聚到同一个问题：若智能、解释与专业知识要持续对齐一个具体且不断变化的现实，就需要共同的 Runtime 架构。",
    "founder.m1.label": "作者",
    "founder.m2.label": "研究类别",
    "founder.m3.label": "参考架构",
    "founder.m4.label": "所在地",
    "enter.eyebrow": "进入 PHI OS",
    "enter.title": "从此刻真正重要的现实、知识或路径开始。",
    "enter.copy": "PHI OS 仍在发展，但核心路径已经可以使用：观察什么正在改变，保存证据，并从更连贯的位置继续。",
    "enter.begin": "开始现实导航",
    "enter.thesis": "阅读论文",
    "enter.atlas": "探索地图集",
    "footer.copy": "现实导航平台 · Teresa Lee 创立"
  }
};
  const STORAGE_KEY = "phios_locale";

  function normalize(value) {
    return String(value || "").toLowerCase().startsWith("zh") ? "zh-Hans" : "en";
  }

  function applyLanguage(requestedLanguage) {
    const language = normalize(requestedLanguage);
    const dictionary = dictionaries[language];
    if (!dictionary) return;

    document.documentElement.lang = language;
    document.documentElement.dataset.i18nReady = "true";
    document.title = language === "zh-Hans" ? "关于 PHI OS — PHI OS" : "About PHI OS — PHI OS";

    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      const key = node.getAttribute("data-i18n");
      if (Object.prototype.hasOwnProperty.call(dictionary, key)) node.textContent = dictionary[key];
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (node) {
      const key = node.getAttribute("data-i18n-html");
      if (Object.prototype.hasOwnProperty.call(dictionary, key)) node.innerHTML = dictionary[key];
    });
    document.querySelectorAll("[data-language]").forEach(function (button) {
      const active = button.getAttribute("data-language") === language;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    try { localStorage.setItem(STORAGE_KEY, language); } catch (error) { console.warn(error); }
  }

  function initialize() {
    document.addEventListener("click", function (event) {
      const button = event.target.closest("[data-language]");
      if (!button) return;
      event.preventDefault();
      applyLanguage(button.getAttribute("data-language"));
    });

    let saved = "";
    try { saved = localStorage.getItem(STORAGE_KEY) || ""; } catch (error) { console.warn(error); }
    applyLanguage(saved || navigator.language || "en");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once:true });
  else initialize();
})();
