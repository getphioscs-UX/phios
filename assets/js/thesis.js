(function () {
  "use strict";

  const dictionaries = {
    en: {
      "nav.home":"HOME","nav.start":"START","nav.myReality":"MY REALITY","nav.explore":"EXPLORE","nav.services":"SERVICES","nav.academy":"ACADEMY","nav.about":"ABOUT",
      "hero.back":"← About PHI OS","hero.eyebrow":"Research Foundation · Reality Navigation","hero.title":"The Reality Navigation <em>Thesis</em>","hero.lead":"A research foundation for representing, reading and navigating realities that continue to change — and the theoretical origin of PHI OS.","hero.read":"Read the full thesis","hero.atlas":"Enter the Reality Atlas","hero.begin":"Begin a Reality Journey",
      "route.position":"Research Position","route.runtime":"Runtime Layer","route.journey":"Reality Journey","route.implementation":"PHI OS Implementation",
      "position.eyebrow":"01 · Research Position","position.title":"From category to implementation.","position.copy":"The thesis establishes the research category. PHI OS turns that category into a readable and operational environment.","position.statement":"Reality Navigation is the computational category. The Unified Runtime Framework is its theoretical architecture. PHI OS is its integrated reference implementation.",
      "position.l1.label":"Computational Category","position.l1.copy":"Maintaining coherent orientation while reality continues to change.","position.l2.label":"Research Foundation","position.l2.copy":"Explains why the category is required and how evolving reality can become observable and computable.","position.l3.label":"Theoretical Architecture","position.l3.copy":"Provides a shared language for reality, runtime, evidence, state, transition and continuity.","position.l4.label":"Reference Implementation","position.l4.copy":"Connects the books, Reality Atlas, Reality Journey, runtime services and future platform infrastructure.",
      "runtime.eyebrow":"02 · The Missing Layer","runtime.title":"The Runtime Layer.","runtime.copy":"Intelligence can produce answers. Navigation requires a persistent representation of the reality those answers are meant to serve.","runtime.statement":"A person, organization or society does not operate as a single prompt. Reality accumulates history, constraints, resources, relationships, residues and unfinished transitions.","runtime.body":"Without a Runtime Layer, each interaction begins from a partial snapshot. A system may reason well while still losing the continuity of the reality it is meant to support.","runtime.quote":"Reality becomes navigable when change leaves evidence that can be reconstructed, read, acted upon and reviewed over time.",
      "journey.eyebrow":"03 · Operational Route","journey.title":"The Reality Journey","journey.copy":"The platform translates the thesis into a continuous route rather than a one-time answer.","journey.s1":"Capture what started to change and what remains unclear.","journey.s2":"Organize sequence, conditions, evidence and gaps.","journey.s3":"Interpret the current Runtime without treating interpretation as fact.","journey.s4":"Identify position, priority, constraints and viable movement.","journey.s5":"Compare expectation, action and observed change.","journey.s6":"Preserve learning and update the Runtime over time.",
      "books.eyebrow":"Human Reading Route","books.title":"Three books. One architecture.","books.copy":"The three books form the human-readable route through the fourteen-part PHI OS architecture.","books.b1.no":"BOOK I · PARTS 1–5","books.b1.title":"How Reality Forms","books.b1.copy":"From structure, field and projection to temporal dynamics, initialization and conscious Runtime.","books.b1.status":"Foundation completed · Current figures available","books.b2.no":"BOOK II · PARTS 6–9","books.b2.title":"How Humans and Worlds Operate Together","books.b2.copy":"From relational and collective Runtime to governance, maintenance and shared reality.","books.b2.status":"Architecture in development","books.b3.no":"BOOK III · PARTS 10–14","books.b3.title":"How the World Will Continue","books.b3.copy":"From civilization dynamics and ecology to diagnostics, reading architecture and continuity mechanics.","books.b3.status":"Structural route established",
      "implementation.eyebrow":"04 · Reference Implementation","implementation.title":"From thesis to PHI OS.","implementation.copy":"PHI OS does not reduce the research to a chatbot. It builds a connected Reality Navigation environment.","implementation.a1":"A scrollable and explorable map of the fourteen-part knowledge architecture.","implementation.a2":"The operational route from Entry through Reconstruction, Reading, Navigation, Review and Continuity.","implementation.a3":"Persistent evidence, state versions, reviews and evolving reality records.","implementation.a4.title":"Services and Infrastructure","implementation.a4.copy":"Rule, AI and professional layers operating under a shared evidence contract.",
      "reader.eyebrow":"Full Research Document","reader.title":"Read the thesis.","reader.open":"Open PDF","reader.download":"Download PDF","reader.fallback":"If the embedded reader does not appear, use “Open PDF” above.","footer.copy":"Reality Navigation Thesis · Research Foundation"
    },
    "zh-Hans": {
      "nav.home":"首页","nav.start":"开始","nav.myReality":"我的现实","nav.explore":"探索","nav.services":"服务","nav.academy":"学院","nav.about":"关于",
      "hero.back":"← 返回 PHI OS 简介","hero.eyebrow":"研究基础 · 现实导航","hero.title":"<em>现实导航论文</em>","hero.lead":"为持续变化的现实建立可表征、可读取与可导航的研究基础，也是 PHI OS 的理论起点。","hero.read":"阅读完整论文","hero.atlas":"进入现实地图集","hero.begin":"开始现实旅程",
      "route.position":"研究定位","route.runtime":"Runtime 层","route.journey":"现实旅程","route.implementation":"PHI OS 实现",
      "position.eyebrow":"01 · 研究定位","position.title":"从计算类别走向实现。","position.copy":"论文建立研究类别；PHI OS 把这一类别转化为可阅读、可操作的现实导航环境。","position.statement":"Reality Navigation 是计算类别；Unified Runtime Framework 是其理论架构；PHI OS 是其整合式参考实现。",
      "position.l1.label":"计算类别","position.l1.copy":"在现实持续变化时维持连贯方向。","position.l2.label":"研究基础","position.l2.copy":"解释这一类别为何必要，以及变化中的现实如何变得可观察与可计算。","position.l3.label":"理论架构","position.l3.copy":"为 Reality、Runtime、Evidence、State、Transition 与 Continuity 提供共同语言。","position.l4.label":"参考实现","position.l4.copy":"连接三册书、Reality Atlas、Reality Journey、Runtime 服务与未来平台基础设施。",
      "runtime.eyebrow":"02 · 缺失的一层","runtime.title":"Runtime Layer。","runtime.copy":"智能可以产生答案；导航则需要持续保存这些答案所服务的现实。","runtime.statement":"个人、组织或社会并不是一次性的 Prompt。现实会累积历史、约束、资源、关系、残留与尚未完成的转变。","runtime.body":"缺少 Runtime Layer 时，每次互动都只能从局部快照重新开始。系统或许能够很好地推理，却仍会失去它本应支持的现实连续性。","runtime.quote":"当变化留下的证据能够被重建、读取、行动并随时间复盘，现实才开始变得可导航。",
      "journey.eyebrow":"03 · 运行路径","journey.title":"现实旅程","journey.copy":"平台把论文转化为一条持续路径，而不是一次性的答案。","journey.s1":"捕捉什么开始改变，以及什么仍不清楚。","journey.s2":"组织发展序列、条件、证据与缺口。","journey.s3":"解释当前 Runtime，同时不把解释当作事实。","journey.s4":"辨认位置、优先次序、约束与可行移动。","journey.s5":"比较预期、行动与实际观察到的变化。","journey.s6":"保存学习，并随时间持续更新 Runtime。",
      "books.eyebrow":"人类阅读路径","books.title":"三册书，一个连续架构。","books.copy":"三册书构成人类理解 PHI OS 十四部架构的连续阅读路径。","books.b1.no":"第一册 · 第 1–5 部","books.b1.title":"现实如何形成","books.b1.copy":"从结构、场域与投射进入时间动力、初始化与意识 Runtime。","books.b1.status":"理论基础已完成 · 当前图像可用","books.b2.no":"第二册 · 第 6–9 部","books.b2.title":"人与世界如何共同运行","books.b2.copy":"从关系与集体 Runtime 进入治理、维护与共同现实。","books.b2.status":"架构发展中","books.b3.no":"第三册 · 第 10–14 部","books.b3.title":"世界将如何继续","books.b3.copy":"从文明动力与生态进入诊断、读取架构与连续性机制。","books.b3.status":"结构路径已建立",
      "implementation.eyebrow":"04 · 参考实现","implementation.title":"从论文走向 PHI OS。","implementation.copy":"PHI OS 并没有把研究缩减为一个聊天机器人，而是在建立相互连接的 Reality Navigation 环境。","implementation.a1":"以可滚动、可逐层探索的方式呈现十四部知识架构。","implementation.a2":"从 Entry 经 Reconstruction、Reading、Navigation、Review 到 Continuity 的运行路径。","implementation.a3":"保存证据、状态版本、复盘记录与持续发展的现实档案。","implementation.a4.title":"服务与基础设施","implementation.a4.copy":"Rule、AI 与专业服务在共同 Evidence Contract 下运行。",
      "reader.eyebrow":"完整研究文件","reader.title":"阅读论文。","reader.open":"打开 PDF","reader.download":"下载 PDF","reader.fallback":"若内嵌阅读器没有显示，请使用上方“打开 PDF”。","footer.copy":"现实导航论文 · PHI OS 研究基础"
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
    document.title = language === "zh-Hans"
      ? "现实导航论文 — PHI OS"
      : "Reality Navigation Thesis — PHI OS";

    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      const key = node.getAttribute("data-i18n");
      if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
        node.textContent = dictionary[key];
      }
    });

    document.querySelectorAll("[data-i18n-html]").forEach(function (node) {
      const key = node.getAttribute("data-i18n-html");
      if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
        node.innerHTML = dictionary[key];
      }
    });

    document.querySelectorAll("[data-language]").forEach(function (button) {
      const active = button.getAttribute("data-language") === language;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      console.warn("PHI OS language preference could not be saved.", error);
    }
  }

  function initialize() {
    document.addEventListener("click", function (event) {
      const button = event.target.closest("[data-language]");
      if (!button) return;
      event.preventDefault();
      applyLanguage(button.getAttribute("data-language"));
    });

    let savedLanguage = "";
    try {
      savedLanguage = localStorage.getItem(STORAGE_KEY) || "";
    } catch (error) {
      console.warn("PHI OS language preference could not be read.", error);
    }

    applyLanguage(savedLanguage || navigator.language || "en");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
