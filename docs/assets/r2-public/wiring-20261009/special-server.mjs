// scripts/lib/book-publication-review-server.mjs
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

// functions/contextual-ask/context-source-registry.js
var ASK_CONTEXT_TYPES = Object.freeze([
  "KNOWLEDGE",
  "CURRENT_FACTS",
  "CURRENT_REALITY",
  "PERSONAL_GOVERNED_READING",
  "PERSONAL_PAID_NARRATIVE",
  "RELATIONSHIP_GOVERNED_READING",
  "RELATIONSHIP_PAID_NARRATIVE",
  "EXTERNAL_PROFILE",
  "PHI_SELF_ASSESSMENT",
  "REASONING_TASK_PERFORMANCE",
  "CONTINUITY_CONTEXT",
  "PROFESSIONAL_CASE_CONTEXT"
]);
var rows = [
  ["KNOWLEDGE", "CKA_KAP_KNOWLEDGE", "GOVERNED_KNOWLEDGE", "SELF", "NONE", false, false, "VERSIONED_KNOWLEDGE", "ANSWER_GROUNDING", "Knowledge", "\u77E5\u8BC6"],
  ["CURRENT_FACTS", "CURRENT_FACTS_GATEWAY", "CURRENT_PUBLIC_FACT", "PUBLIC", "QUESTION", false, false, "RETRIEVED_AT_REQUIRED", "CURRENT_FACT_ONLY_NOT_CANONICAL_KNOWLEDGE", "Current public facts", "\u5F53\u524D\u516C\u5171\u4E8B\u5B9E"],
  ["CURRENT_REALITY", "CURRENT_REALITY_CUSTOMER_VIEW_OR_EXPLICIT_USER_REPORT", "CURRENT_REALITY", "SELF", "QUESTION", true, false, "OBSERVED_AT_WHEN_KNOWN", "CONTEXT_ONLY_NO_TRUTH_ELEVATION", "My current reality", "\u6211\u7684\u5F53\u524D\u73B0\u5B9E"],
  ["PERSONAL_GOVERNED_READING", "PERSONAL_READING_PRODUCT_AUTHORITY", "SYMBOLIC_INTERPRETIVE", "SELF", "READING", true, false, "READING_GENERATED_AT", "SELECTED_REFS_ONLY", "My reading", "\u6211\u7684\u8BFB\u53D6"],
  ["PERSONAL_PAID_NARRATIVE", "NARRATIVE_READING_IR", "SYMBOLIC_INTERPRETIVE", "SELF", "READING", true, true, "STORED_ARTIFACT_VERSION", "STORED_NARRATIVE_NO_REGENERATION", "My narrative", "\u6211\u7684\u53D9\u4E8B"],
  ["RELATIONSHIP_GOVERNED_READING", "RELATIONSHIP_PRODUCT_AUTHORITY", "SYMBOLIC_INTERPRETIVE", "A_AND_B", "RELATIONSHIP", true, false, "READING_GENERATED_AT", "SELECTED_REFS_AND_EXPLICIT_PARTICIPANT_SCOPE_ONLY", "This relationship", "\u8FD9\u6BB5\u5173\u7CFB"],
  ["RELATIONSHIP_PAID_NARRATIVE", "RELATIONSHIP_NARRATIVE_IR", "SYMBOLIC_INTERPRETIVE", "A_AND_B", "RELATIONSHIP", true, true, "STORED_ARTIFACT_VERSION", "STORED_NARRATIVE_NO_REGENERATION", "Relationship narrative", "\u5173\u7CFB\u53D9\u4E8B"],
  ["EXTERNAL_PROFILE", "PROFILE_SIGNAL_ENVELOPE", "EXTERNAL_PROFILE", "SELF", "PROFILE", true, false, "ASSESSMENT_DATE_WHEN_KNOWN", "SIGNALS_ONLY_NO_OBJECTIVE_PERSONALITY_FACT", "External profile", "\u5916\u90E8 Profile"],
  ["PHI_SELF_ASSESSMENT", "SELF_ASSESSMENT_RESULT_IR", "SELF_REPORTED", "SELF", "PROFILE", true, false, "ASSESSMENT_DATE_REQUIRED", "SELF_REPORTED_SIGNALS_ONLY", "PHI self-assessment", "PHI \u81EA\u6211\u8BC4\u4F30"],
  ["REASONING_TASK_PERFORMANCE", "REASONING_TASK_PERFORMANCE_IR", "MEASURED_TASK_BASED", "SELF", "PROFILE", true, false, "ASSESSMENT_DATE_REQUIRED", "TASK_PERFORMANCE_ONLY_NO_IQ_INFERENCE", "Reasoning task performance", "\u63A8\u7406\u4EFB\u52A1\u8868\u73B0"],
  ["CONTINUITY_CONTEXT", "JR_LRM_CONTINUITY_AUTHORITY", "CONTINUITY", "SELF", "REALITY", true, true, "CURRENT_ENTITLEMENT_REQUIRED", "ENTITLED_SELECTED_CONTEXT_ONLY", "Continuity context", "\u8FDE\u7EED\u6027\u60C5\u5883"],
  ["PROFESSIONAL_CASE_CONTEXT", "PROFESSIONAL_CASE_AUTHORITY", "PROFESSIONAL_EVIDENCE", "CASE_PARTICIPANTS", "PROFESSIONAL_CASE", true, true, "CASE_DATE_AND_REVIEW_STATE", "ATTRIBUTABLE_PROFESSIONAL_CONTEXT_ONLY", "Professional case context", "\u4E13\u4E1A\u4E2A\u6848\u60C5\u5883"]
];
var ASK_CONTEXT_SOURCE_REGISTRY = Object.freeze(rows.map(([contextType, sourceAuthority, sourceClass, participantScope, caseScope, consentRequired, entitlementRequired, freshnessPolicy, answerUseBoundary, en, zh]) => Object.freeze({ contextType, sourceAuthority, sourceClass, participantScope, caseScope, consentRequired, entitlementRequired, freshnessPolicy, answerUseBoundary, customerDisclosureLabel: Object.freeze({ en, zh }) })));
function contextDefinition(contextType) {
  return ASK_CONTEXT_SOURCE_REGISTRY.find((row) => row.contextType === contextType) || null;
}

// functions/contextual-ask/contextual-ask-runtime.js
var freeze = (v) => {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v)) freeze(x);
  }
  return v;
};
var clean = (v) => String(v ?? "").trim();
var list = (v) => Array.isArray(v) ? v : [];
var fail = (code, status = 422) => {
  const e = new Error(code);
  e.code = code;
  e.status = status;
  throw e;
};
var hasGuidedContext = (value) => Boolean(value && typeof value === "object" && Object.values(value).some((x) => clean(x)));
function routeGuidedAsk({ question = "", selectedMethod = null, confirmedReality = null, methodGuidanceRequested = false, registry: registry2 } = {}) {
  const methods = list(registry2?.guidedReportMethods).length ? list(registry2.guidedReportMethods) : list(registry2?.methods), selected = [...methods, ...list(registry2?.methods)].find((m) => m.methodId === selectedMethod);
  if (selectedMethod) {
    if (!selected) fail("ASK_SELECTED_METHOD_INVALID");
    return { mode: "USER_SELECTED_METHOD", method: selected.methodId, executionGranted: false };
  }
  if (methodGuidanceRequested) {
    const interests = [];
    for (const [tag, pattern] of [["TIMING", /period|cycle|when|周期|阶段|何时/i], ["CURRENT_OPERATION", /tired|exhaust|operat|消耗|疲惫|运行/i], ["ENVIRONMENT", /environment|环境/i], ["DECISION_OBSERVATION", /decision|decid|选择|决定/i], ["REPEATED_THEMES", /repeat|反复|重复/i], ["ASSESSMENT_COMPARISON", /assessment|profile|测评|侧写/i], ["MULTIPLE_READINGS", /different reports|compare readings|多个报告|不同报告/i], ["LIFE_DOMAINS", /career|relationship|work|事业|关系|工作/i]]) if (pattern.test(question)) interests.push(tag);
    if (!interests.length) interests.push("CURRENT_REALITY");
    const eligible2 = methods.filter((m) => (m.routingOnly === true || m.experienceState === "AVAILABLE_IN_THIS_READING") && m.publicSelectionAllowed !== false && m.routingProfile?.supportsDecisionObservation).map((m) => ({ m, score: interests.filter((x) => m.routingProfile.strongFor.includes(x)).length })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).map((x) => x.m);
    return { mode: "METHOD_GUIDANCE", primary: eligible2[0]?.methodId || null, alternatives: eligible2.slice(1, 3).map((m) => m.methodId), interests, requires: eligible2[0]?.routingProfile.requires || [], wording: "A possible starting point; you can choose another method.", executionGranted: false };
  }
  const personal = /(?:我(?:最近|现在|该|应该|正在|的处境)|\b(?:I am|I feel|my situation|should I)\b)/i.test(question);
  if (personal && !confirmedReality) return { mode: "CLARIFY", question: "What is happening, and what would be useful to understand?", evidencePromoted: false };
  return { mode: confirmedReality ? "REALITY_BASED_RESPONSE" : "DIRECT_ANSWER", recommendMethod: false };
}
var PUBLIC_KNOWLEDGE_REF = /^(?:ARTICLE:[a-z0-9][a-z0-9-]{0,119}|BOOK:BOOK-[1-8]|FIGURE:figure-[a-z0-9-]{1,79}|CONCEPT:[a-z0-9][a-z0-9-]{0,79})$/;
function isPublicKnowledgeContextRef(value) {
  return PUBLIC_KNOWLEDGE_REF.test(clean(value));
}
function publicDefinition(row, locale = "en") {
  return freeze({ contextType: row.contextType, label: row.customerDisclosureLabel[locale === "zh-Hans" ? "zh" : "en"], sourceClass: row.sourceClass, participantScope: row.participantScope, caseScope: row.caseScope, consentRequired: row.consentRequired, entitlementRequired: row.entitlementRequired, freshnessPolicy: row.freshnessPolicy });
}
function buildAskContextAvailability({ locale = "en", requestedContextSeed = null } = {}) {
  const base = [
    { ...publicDefinition(contextDefinition("KNOWLEDGE"), locale), availability: "AVAILABLE", reason: "PUBLIC_GOVERNED_SOURCE" },
    { ...publicDefinition(contextDefinition("CURRENT_REALITY"), locale), availability: "AVAILABLE_WITH_EXPLICIT_INPUT", reason: "CUSTOMER_MAY_SUPPLY_QUESTION_SCOPED_CURRENT_CONTEXT" }
  ];
  const seedType = clean(requestedContextSeed?.contextType).toUpperCase(), seedRef = clean(requestedContextSeed?.contextRef);
  if (seedType === "KNOWLEDGE" && seedRef && isPublicKnowledgeContextRef(seedRef)) {
    const knowledge = base.find((item) => item.contextType === "KNOWLEDGE");
    knowledge.requestedContextRef = seedRef;
    knowledge.reason = "CUSTOMER_SELECTED_PUBLISHED_KNOWLEDGE_REF";
  }
  if (seedType && seedType !== "KNOWLEDGE" && seedType !== "CURRENT_REALITY") {
    const row = contextDefinition(seedType);
    if (row) base.push({ ...publicDefinition(row, locale), availability: "REQUIRES_SERVER_AUTHORIZED_CONTEXT", reason: "NO_SILENT_ACCOUNT_SWEEP", requestedContextRef: seedRef || null });
  }
  return freeze(base);
}
function normalizeResolvedContext(item, locale) {
  const type = clean(item?.contextType).toUpperCase(), row = contextDefinition(type);
  if (!row) fail("ASK_CONTEXT_TYPE_NOT_REGISTERED", 400);
  if (item?.serverAuthorized !== true) fail("ASK_CONTEXT_SERVER_AUTHORIZATION_REQUIRED", 403);
  if (row.entitlementRequired && item?.entitlementState !== "ENTITLED") fail("ASK_CONTEXT_ENTITLEMENT_REQUIRED", 403);
  if (row.consentRequired && item?.consent?.accepted !== true) fail("ASK_CONTEXT_CONSENT_REQUIRED", 403);
  const ref = clean(item?.contextRef);
  if (!ref) fail("ASK_CONTEXT_REF_REQUIRED", 400);
  return freeze({ contextType: type, contextRef: ref, label: clean(item?.label) || row.customerDisclosureLabel[locale === "zh-Hans" ? "zh" : "en"], sourceAuthority: row.sourceAuthority, sourceClass: row.sourceClass, participant: clean(item?.participant) || row.participantScope, caseScope: clean(item?.caseScope) || row.caseScope, whyUsed: clean(item?.whyUsed) || "CUSTOMER_SELECTED_CONTEXT", saved: Boolean(item?.saved), generatedAt: clean(item?.generatedAt) || null, freshness: clean(item?.freshness) || null, limitations: list(item?.limitations).map(clean).filter(Boolean), selectedRefs: list(item?.selectedRefs).map(clean).filter(Boolean), summary: clean(item?.summary) || null, entitlementState: row.entitlementRequired ? item.entitlementState : "NOT_REQUIRED", consentAccepted: row.consentRequired ? true : "NOT_REQUIRED", answerUseBoundary: row.answerUseBoundary });
}
function resolveExplicitAskContexts({ requested = [], guidedContext = {}, contextConsent = {}, resolvedContexts = [], locale = "en" } = {}) {
  const requests = list(requested).map((x) => ({ contextType: clean(x?.contextType).toUpperCase(), contextRef: clean(x?.contextRef) || null })).filter((x) => x.contextType);
  const accepted = [];
  const seen = /* @__PURE__ */ new Set();
  for (const request of requests) {
    if (request.contextType === "NONE") continue;
    if (seen.has(`${request.contextType}:${request.contextRef || ""}`)) continue;
    seen.add(`${request.contextType}:${request.contextRef || ""}`);
    const row = contextDefinition(request.contextType);
    if (!row) fail("ASK_CONTEXT_TYPE_NOT_REGISTERED", 400);
    if (request.contextType === "KNOWLEDGE") {
      if (request.contextRef && !isPublicKnowledgeContextRef(request.contextRef)) fail("ASK_PUBLIC_KNOWLEDGE_REF_INVALID", 400);
      const specific = request.contextRef || null;
      accepted.push(freeze({ contextType: "KNOWLEDGE", contextRef: specific || "PHIOS_GOVERNED_KNOWLEDGE", label: row.customerDisclosureLabel[locale === "zh-Hans" ? "zh" : "en"], sourceAuthority: row.sourceAuthority, sourceClass: row.sourceClass, participant: "PUBLIC", caseScope: specific ? "SOURCE" : "QUESTION", whyUsed: specific ? "CUSTOMER_SELECTED_PUBLISHED_KNOWLEDGE_REF" : "DEFAULT_OR_CUSTOMER_SELECTED_GOVERNED_KNOWLEDGE", saved: false, generatedAt: null, freshness: "VERSIONED", limitations: [], selectedRefs: specific ? [specific] : [], summary: null, entitlementState: "NOT_REQUIRED", consentAccepted: "NOT_REQUIRED", answerUseBoundary: row.answerUseBoundary }));
      continue;
    }
    if (request.contextType === "CURRENT_REALITY" && !request.contextRef) {
      if (!hasGuidedContext(guidedContext)) fail("ASK_CURRENT_REALITY_CONTEXT_INPUT_REQUIRED", 400);
      if (contextConsent?.CURRENT_REALITY !== true) fail("ASK_CONTEXT_CONSENT_REQUIRED", 403);
      accepted.push(freeze({ contextType: "CURRENT_REALITY", contextRef: "ASK_EPHEMERAL_CURRENT_CONTEXT", label: row.customerDisclosureLabel[locale === "zh-Hans" ? "zh" : "en"], sourceAuthority: "CUSTOMER_REPORTED_CONTEXT", sourceClass: "SELF_REPORTED_CURRENT_REALITY", participant: "SELF", caseScope: "QUESTION", whyUsed: "CUSTOMER_SELECTED_CURRENT_CONTEXT", saved: false, generatedAt: null, freshness: "CURRENT_SESSION", limitations: ["SELF_REPORTED_CONTEXT_NOT_CANONICAL_REALITY"], selectedRefs: [], summary: Object.entries(guidedContext).filter(([, v]) => clean(v)).map(([k, v]) => `${k}: ${clean(v)}`).join(" \xB7 "), entitlementState: "NOT_REQUIRED", consentAccepted: true, answerUseBoundary: "CONTEXT_ONLY_NO_TRUTH_ELEVATION" }));
      continue;
    }
    const match = list(resolvedContexts).find((x) => clean(x?.contextType).toUpperCase() === request.contextType && clean(x?.contextRef) === request.contextRef);
    if (!match) fail(`ASK_CONTEXT_NOT_AUTHORIZED:${request.contextType}`, 403);
    accepted.push(normalizeResolvedContext(match, locale));
  }
  return freeze(accepted);
}
function contextualAskDisclosure(contexts = [], currentFacts = null, locale = "en") {
  const used = list(contexts);
  const groups = {};
  for (const item of used) {
    const key = item.sourceClass || "OTHER";
    (groups[key] ??= []).push(item);
  }
  const current = [];
  const stable = [];
  for (const item of used) {
    if (["CURRENT_REALITY", "CONTINUITY_CONTEXT"].includes(item.contextType)) current.push(item);
    else stable.push(item);
  }
  if (currentFacts?.state === "AVAILABLE") {
    const currentFactsDefinition = contextDefinition("CURRENT_FACTS");
    current.push(freeze({ contextType: "CURRENT_FACTS", contextRef: "CURRENT_FACTS_GATEWAY", label: currentFactsDefinition.customerDisclosureLabel[locale === "zh-Hans" ? "zh" : "en"], sourceAuthority: "CURRENT_FACTS_GATEWAY", sourceClass: "CURRENT_PUBLIC_FACT", participant: "PUBLIC", caseScope: "QUESTION", whyUsed: "QUESTION_REQUIRES_CURRENT_FACT", saved: false, generatedAt: currentFacts.retrievedAt || null, freshness: currentFacts.freshness || null, limitations: list(currentFacts.limitations), selectedRefs: [], summary: null, entitlementState: "NOT_REQUIRED", consentAccepted: "NOT_REQUIRED", answerUseBoundary: "CURRENT_FACT_ONLY_NOT_CANONICAL_KNOWLEDGE" }));
  }
  return freeze({ schemaVersion: "PHI-OS-CX-R9-R2-CONTEXT-DISCLOSURE-v1.0.0", contexts: used, groups: Object.entries(groups).map(([sourceClass, items]) => freeze({ sourceClass, items })), currentVsStable: { current, stable }, noSilentAccountSweep: true, sourceClassesEqualScientificStatus: false });
}
async function resolveSelectedArticle(env, slug, locale = "en") {
  if (!/^[a-zA-Z0-9_-]+$/.test(slug || "") || !env?.ASSETS?.fetch) return null;
  const read = async (path2) => {
    const r = await env.ASSETS.fetch(new Request("https://assets.local" + path2));
    return r.ok ? r.json() : null;
  };
  try {
    const paths = ["/content/knowledge/public/visual-article-release.json", "/content/knowledge/public/abl-bilingual-release.json", "/content/knowledge/public/successors/book4-publication-v1/visual-article-release.json", "/content/knowledge/public/successors/book5-publication-v1/visual-article-release.json", "/content/knowledge/public/successors/book6-publication-v1/visual-article-release.json"];
    const manifests = await Promise.all(paths.map(read));
    const row = manifests.flatMap((m) => m?.records || []).find((r) => (r.slug === slug || r.nodeCode?.toLowerCase() === slug.toLowerCase()) && r.locale === locale && r.status === "published");
    if (!row?.path?.startsWith("/content/knowledge/public/")) return null;
    const article = await read(row.path);
    if (article?.publicationStatus !== "published" || article?.reviewStatus !== "approved" || article?.locale !== locale || article?.slug !== row.slug) return null;
    const paragraphs = (article.sections || []).flatMap((s) => (s.blocks || []).map((b) => b.text || b.statement || "")).filter(Boolean);
    if (!paragraphs.length) return null;
    const href = article.publicHref || row.href;
    if (!href?.startsWith("/articles/") || href.startsWith("//")) return null;
    const bookCode = article.publicationContext?.bookCode || (article.nodeCode?.match(/^KN-B([1-8])/i)?.[1] ? "BOOK-" + article.nodeCode.match(/^KN-B([1-8])/i)[1] : null);
    return { slug: article.slug, title: article.title, href, locale, nodeCode: article.nodeCode, bookCode, articleContext: article.askContext || null, sourceReading: article.sourceReading || null, atlasLinks: article.connections?.relatedAtlasEntries || [], sources: paragraphs.map((text5, i) => ({ sourceId: "ARTICLE:" + slug + ":" + i, fragmentCode: slug + "-" + i, sourceType: "PUBLISHED_CANONICAL_ARTICLE", authorityClass: "PUBLISHED_ARTICLE_AUTHORITY", nodeCode: article.nodeCode, bookCode, title: article.title, href, locale, text: text5, scopeMatch: true, selected: true, articleSlug: slug })) };
  } catch {
    return null;
  }
}

// assets/customer-ui/js/ask-context-contract.js
function normalizeAskContext(input = {}) {
  const get = (k) => String(typeof input.get === "function" ? input.get(k) || "" : input[k] || "").trim();
  let contextRef = get("contextRef") || get("contextId");
  const kind = (get("entrySurface") || get("contextType")).toUpperCase().replace("PUBLISHED_ARTICLE", "ARTICLE");
  if (contextRef && !contextRef.includes(":") && ["ARTICLE", "BOOK", "FIGURE", "CONCEPT", "NODE"].includes(kind)) contextRef = `${kind}:${contextRef}`;
  if (contextRef.startsWith("ARTICLE:")) contextRef = "ARTICLE:" + contextRef.slice(8).toLowerCase();
  const publicRef = /^(ARTICLE|BOOK|FIGURE|CONCEPT|NODE):[a-zA-Z0-9_-]+$/.test(contextRef);
  const route = get("contextRoute") || get("entryRoute");
  return { entrySurface: get("entrySurface"), contextType: publicRef ? "KNOWLEDGE" : get("contextType"), contextRef, contextId: contextRef, contextLabel: get("contextLabel").slice(0, 160), contextRoute: route.startsWith("/") && !route.startsWith("//") ? route : "/knowledge/", contextSummary: get("contextSummary").slice(0, 320), readingPath: get("readingPath"), relatedKnowledgeRef: get("relatedKnowledgeRef"), retrievalScope: get("retrievalScope"), locale: get("locale"), fallbackPolicy: contextRef ? "EXPLICIT_SOURCE_ONLY" : "GENERAL_KNOWLEDGE" };
}

// assets/customer-ui/js/navigation-intent.js
function knowledgeNavigationIntent(question, locale = "en") {
  const q = String(question || "").trim().toLowerCase().replace(/[?？。.!！]+$/, "");
  const zh = locale === "zh-Hans";
  const routes = [[/^(?:文章|找文章|看文章|阅读文章|文章在哪(?:里)?|打开文章(?:页面)?|articles?|show (?:me )?(?:the )?articles?|browse articles|where are (?:the )?articles)$/, "/articles", zh ? "\u6D4F\u89C8\u6587\u7AE0" : "Browse articles"], [/^(?:书籍|书籍在哪|书在哪里|书在哪|打开书籍|books|browse books|where are (?:the )?books)$/, "/books", zh ? "\u6D4F\u89C8\u4E66\u7C4D" : "Browse books"], [/^(?:图示|图在哪里|查看图示|figures|browse figures|where are (?:the )?figures)$/, "/figures", zh ? "\u67E5\u770B\u56FE\u793A" : "Browse figures"]];
  routes.push([/^(?:ask|ask phi os)$/, "/knowledge/ask/", zh ? "\u63D0\u95EE" : "Ask PHI OS"], [/^(?:my reality|我的现实)$/, "/reality/", zh ? "\u6211\u7684\u73B0\u5B9E" : "My Reality"], [/^(?:tarot|塔罗)$/, "/perspectives/tarot/", zh ? "\u5854\u7F57" : "Tarot"], [/^(?:i ching|易经)$/, "/perspectives/iching/", zh ? "\u6613\u7ECF" : "I Ching"]);
  for (const [pattern, href, title] of routes) if (pattern.test(q)) return { href, title, text: zh ? `\u53EF\u4EE5\uFF0C\u70B9\u51FB\u4E0B\u65B9\u300C${title}\u300D\u3002` : `Sure\u2014open \u201C${title}\u201D below.` };
  return null;
}

// functions/_lib/knowledge-epistemic-reading.js
var KNOWLEDGE_STATES = Object.freeze(["KNOWN", "RECONSTRUCTED", "PROJECTED", "CONTESTED", "UNKNOWN"]);
var OBSERVATION_TIME_CLASSES = Object.freeze(["CURRENT", "LONGITUDINAL", "STRUCTURAL"]);
var UNKNOWN_REASONS = Object.freeze(["INSUFFICIENT_EVIDENCE", "LOW_RESOLUTION", "TIME_WINDOW_TOO_SHORT", "SOURCE_CONFLICT", "CONTESTED", "MODEL_BLIND_SPOT", "IRREDUCIBLE_UNCERTAINTY"]);
var CLAIM_AUTHORITIES = Object.freeze({ POLICY_FACT: ["POLICY_ISSUER"], OFFICIAL_STATISTIC: ["STATISTICAL_AGENCY"], COMPANY_FINANCIAL_FACT: ["AUDITED_FILING", "REGULATORY_FILING"], MARKET_REACTION: ["MARKET_DATA"], LONGITUDINAL_PATTERN: ["REPEATED_EVIDENCE"], STRUCTURAL_RECONFIGURATION: ["RELATION_CARRIER_ROUTING_CONSTRAINT_EVIDENCE"], HISTORICAL_RECONSTRUCTION: ["HISTORICAL_ARCHIVE"], FUTURE_PROJECTION: ["CONDITIONAL_MODEL"], LIVED_EXPERIENCE: ["FIRST_PERSON_ACCOUNT"] });
function evaluateClaimAuthorityMatch({ claimType, authorityType } = {}) {
  return { claimType, authorityType, matched: (CLAIM_AUTHORITIES[claimType] || []).includes(authorityType), globalSourceRanking: false };
}
function isBookViiManuscriptRequest(question = "") {
  const q = String(question).normalize("NFKC");
  return /世界如何被观察|book\s*(?:vii|7)|第七册/i.test(q) && /页|pages?|全文|完整|pdf|下载|手稿|manuscript|full\s*(?:text|source)/i.test(q);
}
var validSource = (s) => s?.bookId === "BOOK-7" && s.sourceType === "PUBLISHED_CANONICAL_ARTICLE" && s.publicationStatus === "PUBLISHED" && /^KN-B7-14-\d{3}$/.test(s.nodeCode || "") && Number(s.nodeCode.slice(-3)) >= 1 && Number(s.nodeCode.slice(-3)) <= 100 && s.authorityOwner === "BOOK_VII_OBSERVATION_SCIENCE" && typeof s.text === "string" && s.text.trim() && s.epistemicEvidence;
function excludeProtectedBookViiSources(bundle = {}) {
  const original = bundle.sources || [];
  const sources = original.filter((s) => {
    const bookVii = s.bookId === "BOOK-7" || s.bookCode === "BOOK-7" || /^KN-B7-/.test(s.nodeCode || "");
    if (!bookVii) return true;
    return s.publicationStatus === "PUBLISHED" && (s.sourceType === "PUBLISHED_CANONICAL_ARTICLE" || s.sourceType === "REGISTERED_FIGURE_SEMANTICS" && s.canonicalProseAuthority === false && s.ocrAuthority === false);
  });
  return { ...bundle, sources, bookViiProtectedSourceRejected: bundle.bookViiProtectedSourceRejected === true || sources.length !== original.length };
}
var cleanText = (t) => typeof t === "string" && !/https?:\/\/|r2ObjectKey|objectKey|private\/|signedUrl/i.test(t) ? t.trim() : "";
function supportedReadings(e = {}) {
  return (e.readings || []).filter((r) => cleanText(r.text) && r.material === true && r.highQuality === true && Array.isArray(r.evidenceRefs) && r.evidenceRefs.length > 0 && r.evidenceRefs.every((ref) => (e.evidenceRefs || []).includes(ref)));
}
function deriveKnowledgeState(e = {}) {
  if (e.future === true) return "PROJECTED";
  if (e.conceptualState === "CONTESTED" && e.evidenceScope === "CONCEPTUAL_BOUNDARY_NOT_ACTUAL_WORLD_EVIDENCE") return "CONTESTED";
  const readings = supportedReadings(e);
  if (readings.length > 1 && (e.discriminated !== true || !readings.some((r) => r.id === e.primaryReadingId))) return "CONTESTED";
  if (e.claimType && !evaluateClaimAuthorityMatch(e).matched) return "UNKNOWN";
  if (e.sufficient !== true || !Array.isArray(e.evidenceRefs) || !e.evidenceRefs.length) return "UNKNOWN";
  if (e.pastInferred === true) return "RECONSTRUCTED";
  return e.observedRealized === true ? "KNOWN" : "UNKNOWN";
}
function deriveObservationTimeClass(e = {}) {
  if (e.repeatedEvidence === true && e.distinctTimeWindows >= 2 && e.structuralChangeEvidence === true && ["relation", "carrier", "routing", "constraint"].some((k) => (e.changedDimensions || []).includes(k))) return "STRUCTURAL";
  return e.repeatedEvidence === true && e.distinctTimeWindows >= 2 ? "LONGITUDINAL" : "CURRENT";
}
function derivePrimaryReading(e = {}) {
  const readings = supportedReadings(e);
  if (readings.length > 1 && (e.discriminated !== true || !readings.some((r) => r.id === e.primaryReadingId))) return "";
  return cleanText(readings.find((r) => r.id === e.primaryReadingId)?.text || (readings.length === 1 ? readings[0].text : ""));
}
function deriveAlternativeReadings(e = {}) {
  if (e.conceptualState === "CONTESTED" && e.evidenceScope === "CONCEPTUAL_BOUNDARY_NOT_ACTUAL_WORLD_EVIDENCE") return (e.conceptualReadings || []).map(cleanText).filter(Boolean);
  const primary = derivePrimaryReading(e);
  return supportedReadings(e).map((r) => cleanText(r.text)).filter((t) => t !== primary);
}
function deriveUnknownBoundary(e = {}) {
  return [.../* @__PURE__ */ new Set([...(e.unknownReasons || []).filter((r) => UNKNOWN_REASONS.includes(r)), ...deriveKnowledgeState(e) === "UNKNOWN" ? ["INSUFFICIENT_EVIDENCE"] : [], ...deriveKnowledgeState(e) === "CONTESTED" ? ["CONTESTED"] : []])];
}
function deriveConfidenceBoundary(e = {}, locale = "zh-Hans") {
  const state = deriveKnowledgeState(e);
  return locale === "zh-Hans" ? `${state}\uFF1A\u8BC1\u636E\u53EA\u652F\u6301\u5176\u9002\u7528\u8303\u56F4\uFF1B\u6295\u5F71\u4E0D\u662F\u4E8B\u5B9E\uFF0C\u6A21\u578B\u4E0D\u662F\u73B0\u5B9E\uFF0C\u73B0\u5B9E\u4FDD\u7559\u6700\u7EC8\u7EA0\u6B63\u6743\u3002` : `${state}: Evidence supports only its scope; projection is not fact, model is not reality, and reality retains final correction authority.`;
}
function deriveEpistemicReading(bundle = {}, coverage = {}) {
  if (coverage.answerCompositionEligible !== true || isBookViiManuscriptRequest(bundle.question?.text)) return null;
  const sources = (bundle.sources || []).filter(validSource);
  if (!sources.length) return null;
  const question = String(bundle.question?.text || "").normalize("NFKC").replace(/[\p{P}\p{S}\s]+/gu, "");
  const records = sources.map((s) => {
    const e2 = { ...s.epistemicEvidence };
    if (e2.applicableQuestions && !e2.applicableQuestions.some((q) => q.normalize("NFKC").replace(/[\p{P}\p{S}\s]+/gu, "") === question)) {
      delete e2.conceptualState;
      delete e2.conceptualReadings;
    }
    return e2;
  });
  const first = records[0];
  const readings = [...new Map(records.flatMap((e2) => e2.readings || []).map((r) => [r.text, r])).values()];
  const e = { ...first, readings, evidenceRefs: [...new Set(records.flatMap((e2) => e2.evidenceRefs || []))], unknownReasons: [...new Set(records.flatMap((e2) => e2.unknownReasons || []))], counterEvidence: records.flatMap((e2) => e2.counterEvidence || []), future: records.some((e2) => e2.future === true), sufficient: records.every((e2) => e2.sufficient === true), discriminated: records.every((e2) => e2.discriminated === true) };
  const refs = new Set(sources.flatMap((s) => s.epistemicEvidence.evidenceRefs || []));
  if ((e.evidenceRefs || []).some((ref) => !refs.has(ref))) return null;
  return { knowledgeState: deriveKnowledgeState(e), observationTimeClass: deriveObservationTimeClass(e), primaryReading: derivePrimaryReading(e), alternativeReadings: deriveAlternativeReadings(e), counterEvidence: (e.counterEvidence || []).filter((c) => c.evidenceRef && refs.has(c.evidenceRef)).map((c) => cleanText(c.text)).filter(Boolean), confidenceBoundary: deriveConfidenceBoundary(e, bundle.question?.locale), unknownBoundary: deriveUnknownBoundary(e) };
}

// functions/_lib/kir-r2-answer-intelligence.js
var clean2 = (v) => String(v ?? "").normalize("NFKC").replace(/\u000c/g, "\n").replace(/[\t ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
var plain = (v) => clean2(v).replace(/\*\*([^*]+)\*\*/g, "$1").replace(/__([^_]+)__/g, "$1").replace(/`([^`]+)`/g, "$1");
var low = (v) => plain(v).toLocaleLowerCase();
var uniq = (a) => [...new Set((a || []).filter(Boolean))];
var cjkStop = /* @__PURE__ */ new Set(["\u4E3A\u4EC0\u4E48", "\u4E3A\u4F55", "\u4EC0\u4E48", "\u600E\u4E48", "\u600E\u6837", "\u5982\u4F55", "\u662F\u5426", "\u8FD9\u4E2A", "\u90A3\u4E2A", "\u8FD9\u4E9B", "\u90A3\u4E9B", "\u53EF\u4EE5", "\u80FD\u591F", "\u9700\u8981", "\u89E3\u91CA", "\u8BF7\u95EE", "\u610F\u601D", "\u73B0\u5B9E", "\u95EE\u9898"]);
var latinStop = /* @__PURE__ */ new Set(["what", "why", "how", "when", "where", "which", "the", "and", "for", "with", "from", "this", "that", "does", "can", "could", "would", "should", "about", "into", "your", "you", "are", "was", "were", "have", "has", "had", "not", "but", "mean", "explain"]);
function terms(text5) {
  const input = low(text5);
  const out = [];
  for (const m of input.matchAll(/[a-z0-9][a-z0-9-]{1,}|[\u3400-\u9fff]+/g)) {
    const token = m[0];
    if (/^[a-z0-9-]+$/.test(token)) {
      if (token.length >= 3 && !latinStop.has(token)) out.push(token);
      continue;
    }
    if (token.length >= 2 && !cjkStop.has(token)) out.push(token);
    const max = Math.min(token.length - 1, 24);
    for (let i = 0; i < max; i++) {
      const bi = token.slice(i, i + 2);
      if (!cjkStop.has(bi)) out.push(bi);
    }
  }
  return uniq(out).slice(0, 64);
}
function splitSentences(text5) {
  return clean2(text5).split(/(?<=[。！？!?])\s*|(?<=\.)\s+(?=[A-Z])/u).map(clean2).filter((x) => x.length >= 10);
}
function similarity(a, b) {
  const A = new Set(terms(a)), B = new Set(terms(b));
  if (!A.size || !B.size) return 0;
  let n = 0;
  for (const x of A) if (B.has(x)) n++;
  return n / Math.max(1, Math.min(A.size, B.size));
}
function questionTypeBoost(type, s) {
  const t = low(s);
  if (type === "CAUSAL") return /因为|因此|所以|依赖|建立在|形成|导致|使得|反馈|条件|基础|并不意味着|不是.*而是|because|therefore|depends|forms|leads/.test(t) ? 4 : 0;
  if (type === "HOW") return /首先|然后|进一步|通过|进入|转化|形成|过程|路径|机制|when|through|process|first|then/.test(t) ? 4 : 0;
  if (type === "COMPARISON") return /区别|不同|相比|一方面|另一方面|不是.*而是|而|difference|whereas|rather than/.test(t) ? 4 : 0;
  if (type === "DEFINITION") return /是指|意味着|可以理解为|定义|不是.*而是|refers to|means|is a/.test(t) ? 3 : 0;
  return 0;
}
function authorityBoost(source) {
  return source.sourceType === "PUBLISHED_CANONICAL_ARTICLE" ? 7 : source.sourceType === "COMPLETED_MANUSCRIPT" ? 6 : 1;
}
function normalizeKirGroundingSources({ groundingBundle = null, articleSources = [] } = {}) {
  const fromBundle = (groundingBundle?.sources || []).map((s, i) => ({
    sourceId: s.sourceId || `${s.sourceType || "SOURCE"}:${s.nodeCode || s.sectionCode || i}`,
    sourceType: s.sourceType,
    nodeCode: s.nodeCode || s.canonicalBinding?.nodeCodes?.[0] || null,
    bookCode: s.bookCode || null,
    partCode: s.partCode || null,
    fragmentCode: s.fragmentCode || null,
    sectionCode: s.sectionCode || null,
    pageRange: s.pageRange || null,
    title: s.title || null,
    href: s.href || null,
    digest: s.digest || s.sourceDigest || null,
    text: plain(s.text || s.excerpt),
    kind: s.fragmentCode ? "fragment" : "excerpt",
    ordinal: Number(s.ordinal || i + 1),
    contentBearing: Boolean(plain(s.text || s.excerpt)),
    scopeMatch: s.scopeMatch === true,
    ...Number.isInteger(s.retrievalTier) && s.retrievalTier >= 0 && s.retrievalTier <= 3 ? { retrievalTier: s.retrievalTier } : {},
    upstreamAuthority: s.sourceType === "PUBLISHED_CANONICAL_ARTICLE" ? "PUBLISHED_ARTICLE_AUTHORITY" : s.sourceType?.startsWith("CIVILIZATION_ATLAS_") ? "STRUCTURED_ATLAS_AUTHORITY" : "REVIEWED_MANUSCRIPT_AUTHORITY"
  })).filter((x) => x.contentBearing);
  return [...fromBundle, ...articleSources || []];
}
function rerankKirContentFragments({ understanding, expansion, contentSources = [] }) {
  const qTerms = terms(understanding.question);
  const candidateScore = new Map((expansion?.canonicalCandidates || []).map((x, i) => [x.nodeCode, Math.max(1, 12 - i)]));
  const ranked = contentSources.map((source) => {
    const text5 = low([source.title, source.text].filter(Boolean).join(" "));
    let lexical = 0;
    const matched = [];
    for (const t of qTerms) {
      if (text5.includes(t)) {
        lexical += t.length > 2 ? 2.5 : 1;
        matched.push(t);
      }
    }
    const canonical = candidateScore.get(source.nodeCode) || 0;
    const exactTitle = source.title && low(understanding.question).includes(low(source.title).replace(/[？?。！!]/g, "")) ? 12 : 0;
    const typeBoost = questionTypeBoost(understanding.questionType, source.text);
    const kindBoost = source.kind === "summary" ? 2 : source.kind === "paragraph" ? 1 : 0;
    const score = authorityBoost(source) + canonical + exactTitle + lexical + typeBoost + kindBoost;
    return { ...source, features: { lexical: Number(lexical.toFixed(2)), canonical, exactTitle, typeBoost, authority: authorityBoost(source), kindBoost, matchedTerms: uniq(matched) }, rerankScore: Number(score.toFixed(3)) };
  }).filter((x) => x.features.lexical > 0 || x.features.canonical > 0 || x.features.exactTitle > 0).sort((a, b) => (a.retrievalTier ?? 3) - (b.retrievalTier ?? 3) || b.rerankScore - a.rerankScore || (a.ordinal || 0) - (b.ordinal || 0) || String(a.sourceId).localeCompare(String(b.sourceId)));
  return Object.freeze({ schemaVersion: "PHI-OS-KIR-R2-FRAGMENT-SEMANTIC-RERANK-v2.0.0", results: ranked, contentBearingOnly: true });
}
function deduplicateKirContentEvidence(ranked) {
  const seenText = [];
  const results = [];
  let removed = 0;
  for (const item of ranked?.results || []) {
    const normalized2 = low(item.text);
    if (!normalized2) {
      removed++;
      continue;
    }
    let duplicate = false;
    for (const prev of seenText) {
      if (normalized2 === prev || similarity(normalized2, prev) > 0.92) {
        duplicate = true;
        break;
      }
    }
    if (duplicate) {
      removed++;
      continue;
    }
    seenText.push(normalized2);
    results.push({ ...item, canonicalOwnerKey: item.nodeCode || item.sectionCode || item.sourceId });
  }
  return Object.freeze({ schemaVersion: "PHI-OS-KIR-R2-CROSS-SOURCE-EVIDENCE-DEDUP-v2.0.0", results, removedCount: removed, duplicateSourcesMaySupportButNotMultiplyMeaning: true });
}
function buildKirContentEvidencePack({ understanding, deduplicated, canonicalFallback = [] }) {
  const all = (deduplicated?.results || []).slice(0, 10);
  const primary = all.slice(0, 4);
  const supporting = all.slice(4, 8);
  const fallback = (canonicalFallback || []).slice(0, 3);
  const chars = [...primary, ...supporting].reduce((n, x) => n + clean2(x.text).length, 0);
  const articleCount = [...primary, ...supporting].filter((x) => x.sourceType === "PUBLISHED_CANONICAL_ARTICLE").length;
  const manuscriptCount = [...primary, ...supporting].filter((x) => x.sourceType === "COMPLETED_MANUSCRIPT").length;
  return Object.freeze({ schemaVersion: "PHI-OS-KNOWLEDGE-EVIDENCE-PACK-v2.0.0", objectType: "knowledgeEvidencePack", question: understanding.question, primaryEvidence: primary, supportingEvidence: supporting, canonicalFallback: fallback, coverage: primary.length >= 2 ? "STRONG" : primary.length ? "PARTIAL" : fallback.length ? "CANONICAL_ONLY" : "NONE", confidence: primary.length >= 2 ? "HIGH" : primary.length ? "MEDIUM" : fallback.length ? "LOW" : "LOW", unknowns: primary.length ? [] : ["NO_CONTENT_BEARING_GROUNDED_EVIDENCE"], contentMateriality: { contentBearingEvidenceCount: primary.length + supporting.length, contentCharsAvailable: chars, articleFragmentCount: articleCount, manuscriptExcerptCount: manuscriptCount, articleContentAvailable: articleCount > 0, bookContentAvailable: manuscriptCount > 0 }, governance: { createsMeaning: false, rawFullBookIncluded: false, unpublishedArticleContentIncluded: false } });
}
function sentenceCandidates(evidencePack, understanding) {
  const qTerms = terms(understanding.question);
  const list7 = [];
  for (const source of [...evidencePack.primaryEvidence || [], ...evidencePack.supportingEvidence || []]) {
    for (const sentence of splitSentences(source.text)) {
      let score = source.rerankScore || 0, lexicalHits = 0;
      const s = low(sentence);
      for (const t of qTerms) if (s.includes(t)) {
        lexicalHits++;
        score += t.length > 2 ? 2 : 0.7;
      }
      score += questionTypeBoost(understanding.questionType, sentence);
      if (source.kind === "summary") score += 2;
      list7.push({ sentence, source, score, lexicalHits });
    }
  }
  list7.sort((a, b) => (a.source.retrievalTier ?? 3) - (b.source.retrievalTier ?? 3) || b.lexicalHits - a.lexicalHits || b.score - a.score || a.sentence.length - b.sentence.length);
  return list7;
}
function selectDiverseSentences(candidates, max = 5) {
  const out = [];
  for (const c of candidates) {
    if (c.sentence.length > 420) continue;
    if (out.some((x) => similarity(x.sentence, c.sentence) > 0.82)) continue;
    out.push(c);
    if (out.length >= max) break;
  }
  return out;
}
function makeDeterministicAnswer({ understanding, evidencePack }) {
  const candidates = sentenceCandidates(evidencePack, understanding);
  const selected = selectDiverseSentences(candidates, understanding.questionType === "DEFINITION" ? 4 : 5);
  if (!selected.length) return null;
  const locale = understanding.locale;
  const direct = selected[0].sentence;
  const rest = selected.slice(1);
  let text5;
  if (locale === "zh-Hans") {
    if (understanding.questionType === "CAUSAL") text5 = `${direct}

\u5177\u4F53\u6765\u770B\uFF0C${rest.map((x) => x.sentence).join(" ")}`;
    else if (understanding.questionType === "HOW") text5 = `${direct}

\u53EF\u4EE5\u6CBF\u7740\u8FD9\u6761\u8FC7\u7A0B\u7406\u89E3\uFF1A${rest.map((x) => x.sentence).join(" ")}`;
    else if (understanding.questionType === "COMPARISON") text5 = `${direct}

\u5173\u952E\u5DEE\u5F02\u8FD8\u4F53\u73B0\u5728\uFF1A${rest.map((x) => x.sentence).join(" ")}`;
    else text5 = [direct, ...rest.map((x) => x.sentence)].join("\n\n");
  } else {
    const join = rest.map((x) => x.sentence).join(" ");
    text5 = understanding.questionType === "CAUSAL" ? `${direct} More specifically, ${join}` : [direct, join].filter(Boolean).join(" ");
  }
  return { text: clean2(text5), selected };
}
async function composeKirContentGroundedAnswer({ understanding, evidencePack, modelDecision, allowedContext = null, provider = null, upstreamGroundedAnswer = null }) {
  const hasContent = (evidencePack.contentMateriality?.contentBearingEvidenceCount || 0) > 0;
  let text5 = "";
  let providerInvoked = false;
  let selected = [];
  let providerMeta = null;
  if (hasContent && provider && modelDecision?.requestedModel !== "DETERMINISTIC") {
    const payload = { question: understanding.question, locale: understanding.locale, evidencePack, allowedContext, routingContext: { professionalDepth: understanding.professionalDepth, personalizationNeed: understanding.personalizationNeed, ambiguity: understanding.ambiguity }, answerContract: { directFirst: true, questionType: understanding.questionType, useContentNotTitles: true, explainMechanism: true, noNewPhiMeaning: true, noMethodHijack: true, noInternalJargonDump: true, doNotRepeatGovernanceBoilerplate: true } };
    const response2 = await provider({ model: modelDecision.requestedModel, payload });
    if (response2 && typeof response2 === "object") {
      text5 = clean2(response2.text);
      providerMeta = { providerId: response2.providerId || null, providerModel: response2.providerModel || null, route: response2.route || null, usage: response2.usage || null, rawId: response2.rawId || null };
    } else text5 = clean2(response2);
    providerInvoked = Boolean(text5);
  }
  if (!text5 && hasContent) {
    const deterministic = makeDeterministicAnswer({ understanding, evidencePack });
    if (deterministic) {
      text5 = deterministic.text;
      selected = deterministic.selected;
    }
  }
  if (!text5) text5 = understanding.locale === "zh-Hans" ? "\u76EE\u524D\u627E\u5230\u7684\u53D7\u6CBB\u7406\u77E5\u8BC6\u53EA\u6709\u6982\u5FF5\u5B9A\u4F4D\uFF0C\u8FD8\u7F3A\u5C11\u8DB3\u591F\u7684\u6B63\u6587\u8BC1\u636E\u6765\u53EF\u9760\u89E3\u91CA\u8FD9\u4E2A\u95EE\u9898\u3002" : "The governed knowledge currently identifies the concept, but there is not enough content-bearing evidence to explain it reliably.";
  const usedEvidenceIds = uniq((providerInvoked ? [...evidencePack.primaryEvidence || []] : selected.map((x) => x.source)).map((x) => x.sourceId));
  const usedItems = [...evidencePack.primaryEvidence || [], ...evidencePack.supportingEvidence || []].filter((x) => usedEvidenceIds.includes(x.sourceId));
  const chars = usedItems.reduce((n, x) => n + clean2(x.text).length, 0);
  return Object.freeze({ schemaVersion: "PHI-OS-KIR-R2-CONTENT-GROUNDED-COMPOSER-v2.1.0", text: text5, providerInvoked, model: modelDecision?.requestedModel || "DETERMINISTIC", providerMeta, knowledgeEvidencePackConsumed: hasContent, materialGroundedContentConsumed: usedItems.length > 0, upstreamGroundedAnswerPresent: Boolean(upstreamGroundedAnswer), upstreamGroundedAnswerConsumed: false, usedEvidenceIds, consumedContentChars: chars, articleContentConsumed: usedItems.some((x) => x.sourceType === "PUBLISHED_CANONICAL_ARTICLE"), bookContentConsumed: usedItems.some((x) => x.sourceType === "COMPLETED_MANUSCRIPT"), allowedContextConsumed: Boolean(allowedContext), authority: { createsPhiMeaning: false, createsMethodMeaning: false, createsRealityTruth: false } });
}
function guardKirSemanticAnswer({ understanding, evidencePack, answer }) {
  const text5 = clean2(answer.text);
  const oldTemplate = /这个问题首先指向|strongest grounded match is/i.test(text5);
  const internal = /(KIR-R2|KAP-W|canonicalNode|groundingBundleId|runtime authority|registry object|Book I–III \/ canonical evidence)/i.test(text5);
  const hijack = understanding.intent !== "SINGLE_METHOD" && /紫微|八字|占星|塔罗|人类图|zi wei|bazi|astrology|tarot|human design/.test(text5);
  const q = clean2(understanding.question).replace(/[？?。！!"“”']/g, "");
  const emptyRephrase = low(text5).startsWith(low(q)) && text5.length < Math.max(120, q.length * 2.2);
  const material = answer.materialGroundedContentConsumed === true && answer.consumedContentChars >= 80;
  const mechanismRequired = ["CAUSAL", "HOW"].includes(understanding.questionType);
  const mechanismExplained = !mechanismRequired || splitSentences(text5).length >= 3;
  const sourceSupported = answer.usedEvidenceIds.length > 0 && answer.usedEvidenceIds.every((id) => [...evidencePack.primaryEvidence || [], ...evidencePack.supportingEvidence || []].some((x) => x.sourceId === id));
  const direct = text5.length >= 60 && !emptyRephrase && !oldTemplate;
  return Object.freeze({ schemaVersion: "PHI-OS-KIR-R2-SEMANTIC-ANSWER-QUALITY-GUARD-v2.0.0", DIRECTLY_ANSWERS_USER_QUESTION: direct, SOURCE_SUPPORTED: sourceSupported, MATERIAL_GROUNDED_CONTENT_CONSUMED: material, QUESTION_TYPE_SATISFIED: mechanismExplained, MECHANISM_EXPLAINED: mechanismExplained, NO_EMPTY_REPHRASE: !emptyRephrase, NO_REPETITIVE_LEGACY_TEMPLATE: !oldTemplate, NO_INTERNAL_JARGON_DUMP: !internal, NO_METHOD_HIJACK: !hijack, passed: direct && sourceSupported && material && mechanismExplained && !oldTemplate && !internal && !hijack });
}
function projectKirMaterialSourceUsage({ evidencePack, answer }) {
  const identified = [...evidencePack.primaryEvidence || [], ...evidencePack.supportingEvidence || []];
  const consumed = identified.filter((x) => answer.usedEvidenceIds.includes(x.sourceId));
  return Object.freeze({ schemaVersion: "PHI-OS-KIR-R2-MATERIAL-SOURCE-USAGE-v2.0.0", whichBooksIdentified: uniq(identified.map((x) => x.bookCode)), whichBooksContentConsumed: uniq(consumed.filter((x) => x.sourceType === "COMPLETED_MANUSCRIPT").map((x) => x.bookCode)), whichNodesIdentified: uniq(identified.map((x) => x.nodeCode)), whichArticlesIdentified: uniq(identified.filter((x) => x.sourceType === "PUBLISHED_CANONICAL_ARTICLE").map((x) => x.articleCode || x.nodeCode)), whichArticlesContentConsumed: uniq(consumed.filter((x) => x.sourceType === "PUBLISHED_CANONICAL_ARTICLE").map((x) => x.articleCode || x.nodeCode)), articleContentConsumed: answer.articleContentConsumed, bookContentConsumed: answer.bookContentConsumed, materialContentConsumed: answer.materialGroundedContentConsumed, consumedContentChars: answer.consumedContentChars, customerDefaultVisible: false });
}

// functions/_lib/kir-r2-intelligence.js
var clean3 = (v) => String(v ?? "").normalize("NFKC").trim().replace(/\s+/g, " ");
var low2 = (v) => clean3(v).toLocaleLowerCase();
var uniq2 = (a) => [...new Set((a || []).filter(Boolean))];
var latinStop2 = /* @__PURE__ */ new Set(["what", "why", "how", "when", "where", "which", "the", "and", "for", "with", "from", "this", "that", "does", "can", "could", "would", "should", "about", "into", "your", "you", "are", "was", "were", "have", "has", "had", "not", "but"]);
var cjkStop2 = ["\u4E3A\u4EC0\u4E48", "\u4E3A\u4F55", "\u4EC0\u4E48", "\u600E\u4E48", "\u600E\u6837", "\u5982\u4F55", "\u662F\u5426", "\u662F\u4E0D\u662F", "\u8FD9\u4E2A", "\u90A3\u4E2A", "\u8FD9\u4E9B", "\u90A3\u4E9B", "\u6211\u7684", "\u6211\u4EEC", "\u81EA\u5DF1", "\u53EF\u4EE5", "\u80FD\u591F", "\u9700\u8981", "\u6CA1\u6709", "\u8BF7\u95EE", "\u89E3\u91CA", "\u544A\u8BC9"];
function tokenizeKir(text5) {
  const raw = low2(text5);
  const out = [];
  for (const m of raw.matchAll(/[a-z0-9][a-z0-9-]{1,}|[\u3400-\u9fff]{2,8}/g)) {
    const t = m[0];
    if (/^[a-z0-9-]+$/.test(t)) {
      if (t.length >= 3 && !latinStop2.has(t)) out.push(t);
    } else if (t.length >= 2 && !cjkStop2.some((x) => t === x)) out.push(t);
  }
  return uniq2(out);
}
var has = (s, re) => re.test(low2(s));
function understandKirQuestion(input = {}) {
  const question = clean3(typeof input === "string" ? input : input.question);
  const locale = typeof input === "string" ? "zh-Hans" : input.locale || "zh-Hans";
  if (!question || question.length > 500) throw new Error("KIR_R2_QUESTION_INVALID");
  const q = low2(question);
  let intent = "KNOWLEDGE";
  if (/伴侣|丈夫|妻子|对象|婚姻|我和.{0,8}(?:关系|相处)|partner|my relationship|relationship with/.test(q)) intent = "RELATIONSHIP";
  else if (/钱|财务|投资|保险|预算|financial|money|investment|insurance/.test(q)) intent = "FINANCIAL";
  else if (/紫微|八字|占星|人类图|numerology|tarot|i ching|astrology|bazi|zi wei|human design/.test(q)) intent = "SINGLE_METHOD";
  else if (/我|我的|自己|现实|现在|目前|最近|my |current|right now|lately/.test(q)) intent = "REALITY";
  const questionType = has(q, /为什么|为何|\bwhy\b/) ? "CAUSAL" : has(q, /如何|怎么|怎样|\bhow\b/) ? "HOW" : has(q, /区别|比较|差异|\bcompare\b|\bdifference\b|\bvs\b/) ? "COMPARISON" : has(q, /什么是|是什么意思|\bwhat is\b|\bmean\b/) ? "DEFINITION" : "OTHER";
  const personalization = /我|我的|自己|我们|my | me | i |our |we /.test(q);
  const professionalDepth = /专业|技术|证据|机制|研究|professional|technical|evidence|mechanism|research/.test(q);
  const domains = [];
  for (const [d, re] of [["relationship", /关系|伴侣|partner|relationship/], ["work", /工作|职业|career|work/], ["resources", /钱|资源|财务|money|resource|financial/], ["organization", /组织|公司|团队|organization|company|team/], ["decision", /决定|选择|decision|choice/], ["continuity", /维持|持续|连续|恢复|maintenance|continuity|recover|sustain/]]) if (re.test(q)) domains.push(d);
  return Object.freeze({ schemaVersion: "PHI-OS-KIR-R2-QUESTION-UNDERSTANDING-v1.0.0", question, locale, intent, questionType, domains: domains.length ? domains : ["reality"], tokens: tokenizeKir(question), personalizationNeed: personalization ? "CONTEXT_MAY_HELP" : "NONE_REQUIRED", professionalDepth: professionalDepth ? "HIGH" : "STANDARD", ambiguity: tokenizeKir(question).length < 2 ? "HIGH" : "NORMAL", authority: { createsMeaning: false, createsRealityTruth: false } });
}
function profileText(p) {
  return low2([p.nodeCode, p.canonicalName?.["zh-Hans"], p.canonicalName?.en, p.canonicalMeaning?.canonicalQuestionKey, ...p.userLanguage || [], ...p.naturalQuestions || [], ...p.mechanisms || [], ...p.conditions || [], ...p.patterns || [], ...p.aliases || [], ...p.realityDomains || []].join(" "));
}
function expandKirQuery(understanding, profiles = []) {
  const tokens2 = understanding.tokens || [];
  const scored = [];
  for (const p of profiles) {
    const text5 = profileText(p);
    let score = 0;
    const matched = [];
    for (const t of tokens2) {
      if (text5.includes(low2(t))) {
        score += t.length > 3 ? 4 : 2;
        matched.push(t);
      }
    }
    if (understanding.domains?.some((d) => (p.realityDomains || []).includes(d))) score += 2;
    if (score > 0) scored.push({ profileId: p.profileId, nodeCode: p.nodeCode, bookCode: p.bookCode, score, matchedTerms: matched });
  }
  scored.sort((a, b) => b.score - a.score || a.nodeCode.localeCompare(b.nodeCode));
  const candidates = scored.slice(0, 8);
  const byNode = new Map(profiles.map((p) => [p.nodeCode, p]));
  const expansions = uniq2(candidates.flatMap((c) => {
    const p = byNode.get(c.nodeCode);
    return [p?.canonicalName?.["zh-Hans"], p?.canonicalName?.en, ...p?.mechanisms || [], ...p?.aliases || []];
  })).filter(Boolean).slice(0, 24);
  return Object.freeze({ schemaVersion: "PHI-OS-KIR-R2-QUERY-EXPANSION-v1.0.0", originalQuestion: understanding.question, locale: understanding.locale, canonicalCandidates: candidates, expandedTerms: expansions, mixedLanguageSupported: true, authority: { createsMeaning: false } });
}
function hybridKirRetrieve({ understanding, expansion, profiles = [] }) {
  const byNode = new Map(profiles.map((p) => [p.nodeCode, p]));
  const results = [];
  for (const c of expansion.canonicalCandidates || []) {
    const p = byNode.get(c.nodeCode);
    if (!p) continue;
    const base = { nodeCode: p.nodeCode, bookCode: p.bookCode, partCode: p.partCode, canonicalName: p.canonicalName, canonicalMeaning: p.canonicalMeaning, score: c.score, authorityRefs: p.authorityRefs || [] };
    results.push({ ...base, sourceType: "CANONICAL_NODE", sourceId: `NODE:${p.nodeCode}`, text: p.canonicalName?.["zh-Hans"] || p.canonicalName?.en || p.nodeCode });
    for (const q of (p.naturalQuestions || []).slice(0, 1)) results.push({ ...base, sourceType: "CANONICAL_QUESTION", sourceId: `QUESTION:${p.nodeCode}`, text: q, score: c.score - 0.1 });
    for (const a of (p.articleSources || []).slice(0, 1)) results.push({ ...base, sourceType: "PUBLISHED_ARTICLE", sourceId: `ARTICLE:${p.nodeCode}:${a.articleCode || a.slug || "REF"}`, text: a.title || a.slug || p.canonicalName?.["zh-Hans"], score: c.score - 0.2 });
    results.push({ ...base, sourceType: "BOOK_PROFILE", sourceId: `BOOK:${p.bookCode}:${p.nodeCode}`, text: [p.canonicalName?.["zh-Hans"], ...(p.userLanguage || []).slice(0, 1)].filter(Boolean).join(" \u2014 "), score: c.score - 0.15 });
    for (const r of (p.relatedNodes || []).slice(0, 2)) results.push({ ...base, sourceType: "CANONICAL_RELATIONSHIP", sourceId: `REL:${p.nodeCode}:${r}`, relatedNodeCode: r, text: `${p.nodeCode} \u2192 ${r}`, score: c.score - 0.5 });
    for (const alias of (p.aliases || []).filter(Boolean).slice(0, 1)) results.push({ ...base, sourceType: "ALIAS", sourceId: `ALIAS:${p.nodeCode}`, text: alias, score: c.score - 0.3 });
  }
  return Object.freeze({ schemaVersion: "PHI-OS-KIR-R2-HYBRID-RETRIEVAL-v1.0.0", query: understanding.question, sourceClasses: ["BOOK_PROFILE", "CANONICAL_NODE", "PUBLISHED_ARTICLE", "CANONICAL_QUESTION", "CANONICAL_RELATIONSHIP", "ALIAS"], results });
}
function rerankKirEvidence({ understanding, retrieval }) {
  const terms3 = understanding.tokens || [];
  const ranked = (retrieval.results || []).map((r) => {
    const text5 = low2(r.text);
    const direct = terms3.filter((t) => text5.includes(low2(t))).length;
    const authority = r.sourceType === "CANONICAL_NODE" ? 4 : r.sourceType === "BOOK_PROFILE" ? 3 : r.sourceType === "PUBLISHED_ARTICLE" ? 3 : r.sourceType === "CANONICAL_QUESTION" ? 2 : 1;
    const specificity = Math.min(3, Math.max(0, clean3(r.text).length / 40));
    return { ...r, features: { keyword: direct, authority, specificity }, rerankScore: Number(r.score || 0) + direct * 2 + authority + specificity };
  }).sort((a, b) => b.rerankScore - a.rerankScore || a.sourceId.localeCompare(b.sourceId));
  return Object.freeze({ schemaVersion: "PHI-OS-KIR-R2-SEMANTIC-RERANK-v1.0.0", keywordIsFeatureOnly: true, results: ranked });
}
function deduplicateKirEvidence(ranked) {
  const owner = /* @__PURE__ */ new Map();
  const merged = [];
  for (const r of ranked.results || []) {
    const key = r.nodeCode || r.sourceId;
    if (!owner.has(key)) {
      const item = { ...r, representedSourceTypes: [r.sourceType], supportingSourceIds: [r.sourceId] };
      owner.set(key, item);
      merged.push(item);
    } else {
      const item = owner.get(key);
      item.representedSourceTypes = uniq2([...item.representedSourceTypes, r.sourceType]);
      item.supportingSourceIds = uniq2([...item.supportingSourceIds, r.sourceId]);
      item.rerankScore = Math.max(item.rerankScore, r.rerankScore);
    }
  }
  return Object.freeze({ schemaVersion: "PHI-OS-KIR-R2-EVIDENCE-DEDUP-v1.0.0", results: merged, removedCount: (ranked.results || []).length - merged.length });
}
function buildKirEvidencePack({ understanding, deduplicated }) {
  const all = deduplicated.results || [];
  const primary = all.slice(0, 2);
  const supporting = all.slice(2, 5);
  const counter = all.filter((x) => x.sourceType === "COUNTER_EVIDENCE").slice(0, 2);
  const books = uniq2([...primary, ...supporting].map((x) => x.bookCode));
  return Object.freeze({ schemaVersion: "PHI-OS-KNOWLEDGE-EVIDENCE-PACK-v1.0.0", objectType: "knowledgeEvidencePack", question: understanding.question, primaryEvidence: primary, supportingEvidence: supporting, counterEvidence: counter, sourceAuthority: uniq2([...primary, ...supporting].flatMap((x) => x.authorityRefs || [])), coverage: primary.length >= 2 ? "STRONG" : primary.length ? "PARTIAL" : "NONE", confidence: primary.length >= 2 ? "HIGH" : primary.length ? "MEDIUM" : "LOW", unknowns: primary.length ? [] : ["NO_GROUNDED_EVIDENCE"], whichBooksUsed: books, governance: { createsMeaning: false, rawBookBodyIncluded: false } });
}
function evaluateKirModel({ understanding, evidencePack }) {
  const evidenceCount = (evidencePack.primaryEvidence?.length || 0) + (evidencePack.supportingEvidence?.length || 0);
  let complexity = "T0", model = "DETERMINISTIC";
  if (evidencePack.coverage === "NONE") {
    complexity = "T0";
    model = "DETERMINISTIC";
  } else if (understanding.professionalDepth === "HIGH" && evidenceCount >= 4) {
    complexity = "T3";
    model = "SOL";
  } else if (understanding.personalizationNeed !== "NONE_REQUIRED" && evidenceCount >= 3) {
    complexity = "T2";
    model = "TERRA";
  } else if (evidenceCount >= 3) {
    complexity = "T1";
    model = "LUNA";
  }
  return Object.freeze({ schemaVersion: "PHI-OS-KIR-R2-AI-ELIGIBILITY-MODEL-COMPLEXITY-v1.0.0", complexity, requestedModel: model, providerInvocationRequired: model !== "DETERMINISTIC", entitlementStillRequired: model !== "DETERMINISTIC", evidenceCoverage: evidencePack.coverage, knowledgeAuthorityOwnedByModel: false });
}
function evidenceSentence(e) {
  const zh = e.canonicalName?.["zh-Hans"];
  const en = e.canonicalName?.en;
  return zh || en || clean3(e.text);
}
async function composeKirGroundedAnswer({ understanding, evidencePack, modelDecision, allowedContext = null, provider = null, upstreamGroundedAnswer = null }) {
  const primary = evidencePack.primaryEvidence || [];
  const supported = primary.length > 0;
  let text5 = "";
  let providerInvoked = false;
  let providerMeta = null;
  if (supported && provider && modelDecision.requestedModel !== "DETERMINISTIC") {
    const payload = { question: understanding.question, locale: understanding.locale, evidencePack, allowedContext, routingContext: { professionalDepth: understanding.professionalDepth, personalizationNeed: understanding.personalizationNeed, ambiguity: understanding.ambiguity }, answerContract: { directFirst: true, questionType: understanding.questionType, noNewPhiMeaning: true, noMethodHijack: true, noInternalJargonDump: true } };
    const response2 = await provider({ model: modelDecision.requestedModel, payload });
    if (response2 && typeof response2 === "object") {
      text5 = clean3(response2.text);
      providerMeta = { providerId: response2.providerId || null, providerModel: response2.providerModel || null, route: response2.route || null, usage: response2.usage || null, rawId: response2.rawId || null };
    } else text5 = clean3(response2);
    providerInvoked = Boolean(text5);
  }
  if (!text5 && supported) {
    const lead = evidenceSentence(primary[0]);
    const second = primary[1] ? evidenceSentence(primary[1]) : "";
    text5 = understanding.locale === "zh-Hans" ? `\u8FD9\u4E2A\u95EE\u9898\u9996\u5148\u6307\u5411\u300C${lead}\u300D${second ? `\uFF0C\u540C\u65F6\u4E0E\u300C${second}\u300D\u6709\u5173\u3002` : "\u3002"} \u8FD9\u4E9B\u5224\u65AD\u53EA\u6765\u81EA\u5F53\u524D\u83B7\u51C6\u7684\u4E66\u7C4D / canonical evidence\uFF1B\u5982\u679C\u4F60\u7684\u95EE\u9898\u5305\u542B\u4E2A\u4EBA\u60C5\u5883\uFF0C\u8FD8\u9700\u8981\u628A\u5B9E\u9645\u4E8B\u5B9E\u4E0E\u9650\u5236\u53E6\u5916\u5E26\u5165\uFF0C\u4E0D\u80FD\u4ECE\u77E5\u8BC6\u6750\u6599\u76F4\u63A5\u63A8\u65AD\u4F60\u7684\u73B0\u5B9E\u3002` : `The strongest grounded match is \u201C${lead}\u201D${second ? `, with supporting relevance from \u201C${second}\u201D` : ""}. This answer uses only currently admitted book / canonical evidence; personal facts must be supplied separately rather than inferred from knowledge.`;
  }
  if (!text5) text5 = understanding.locale === "zh-Hans" ? "\u76EE\u524D\u7684\u83B7\u51C6\u77E5\u8BC6\u8BC1\u636E\u4E0D\u8DB3\u4EE5\u76F4\u63A5\u56DE\u7B54\u8FD9\u4E2A\u95EE\u9898\u3002" : "The currently admitted knowledge evidence is insufficient to answer this question directly.";
  return Object.freeze({ schemaVersion: "PHI-OS-KIR-R2-GROUNDED-COMPOSER-v1.1.0", text: text5, providerInvoked, model: modelDecision.requestedModel, providerMeta, knowledgeEvidencePackConsumed: true, upstreamGroundedAnswerPresent: Boolean(upstreamGroundedAnswer), upstreamGroundedAnswerConsumed: Boolean(upstreamGroundedAnswer), usedEvidenceIds: primary.map((x) => x.sourceId), allowedContextConsumed: Boolean(allowedContext), authority: { createsPhiMeaning: false, createsMethodMeaning: false, createsRealityTruth: false } });
}
function guardKirAnswer({ understanding, evidencePack, answer }) {
  const qterms = understanding.tokens || [];
  const a = low2(answer.text);
  const etext = low2([...evidencePack.primaryEvidence || [], ...evidencePack.supportingEvidence || []].map((x) => [x.text, x.canonicalName?.["zh-Hans"], x.canonicalName?.en].filter(Boolean).join(" ")).join(" "));
  const overlap = qterms.filter((t) => a.includes(low2(t)) || etext.includes(low2(t)));
  const methodHijack = understanding.intent !== "SINGLE_METHOD" && /紫微|八字|占星|塔罗|人类图|zi wei|bazi|astrology|tarot|human design/.test(a);
  const jargonDump = /(KIR-R2|KAP-W|canonicalNode|groundingBundleId|runtime authority|registry object)/i.test(answer.text);
  const supported = answer.usedEvidenceIds.length > 0 ? answer.usedEvidenceIds.every((id) => [...evidencePack.primaryEvidence || [], ...evidencePack.supportingEvidence || []].some((x) => x.sourceId === id)) : evidencePack.coverage === "NONE";
  const direct = understanding.tokens.length < 2 || overlap.length > 0 || evidencePack.coverage === "NONE";
  return Object.freeze({ schemaVersion: "PHI-OS-KIR-R2-ANSWER-RELEVANCE-GUARD-v1.0.0", DIRECTLY_ANSWERS_USER_QUESTION: direct, SOURCE_SUPPORTED: supported, NO_UNGROUNDED_PHI_CONCEPT: supported, NO_INTERNAL_JARGON_DUMP: !jargonDump, NO_METHOD_HIJACK: !methodHijack, passed: direct && supported && !jargonDump && !methodHijack });
}
function projectKirBookUsage(evidencePack) {
  const items = [...evidencePack.primaryEvidence || [], ...evidencePack.supportingEvidence || []];
  return Object.freeze({ schemaVersion: "PHI-OS-KIR-R2-BOOK-USAGE-EVIDENCE-v1.0.0", whichBookUsed: uniq2(items.map((x) => x.bookCode)), whichNodesUsed: uniq2(items.map((x) => x.nodeCode)), whichArticlesUsed: uniq2(items.filter((x) => x.sourceType === "PUBLISHED_ARTICLE").map((x) => x.sourceId)), customerDefaultVisible: false });
}
async function runKirR2Pipeline({ question, locale = "zh-Hans", profiles, provider = null, allowedContext = null, upstreamGroundedAnswer = null, groundingBundle = null, articleSources = [] }) {
  const understanding = understandKirQuestion({ question, locale });
  const expansion = expandKirQuery(understanding, profiles);
  const retrieval = hybridKirRetrieve({ understanding, expansion, profiles });
  const canonicalReranked = rerankKirEvidence({ understanding, retrieval });
  const canonicalDedup = deduplicateKirEvidence(canonicalReranked);
  const contentSources = normalizeKirGroundingSources({ groundingBundle, articleSources });
  if (contentSources.length) {
    const reranked = rerankKirContentFragments({ understanding, expansion, contentSources });
    const dedup = deduplicateKirContentEvidence(reranked);
    const evidencePack2 = buildKirContentEvidencePack({ understanding, deduplicated: dedup, canonicalFallback: canonicalDedup.results });
    const model2 = evaluateKirModel({ understanding, evidencePack: evidencePack2 });
    const answer2 = await composeKirContentGroundedAnswer({ understanding, evidencePack: evidencePack2, modelDecision: model2, allowedContext, provider, upstreamGroundedAnswer });
    const guard2 = guardKirSemanticAnswer({ understanding, evidencePack: evidencePack2, answer: answer2 });
    const usage2 = projectKirMaterialSourceUsage({ evidencePack: evidencePack2, answer: answer2 });
    return { schemaVersion: "PHI-OS-KIR-R2-ANSWER-INTELLIGENCE-PIPELINE-v2.0.0", understanding, expansion, retrieval, canonicalReranked, canonicalDedup, reranked, dedup, evidencePack: evidencePack2, model: model2, answer: answer2, guard: guard2, usage: usage2 };
  }
  const evidencePack = buildKirEvidencePack({ understanding, deduplicated: canonicalDedup });
  const model = evaluateKirModel({ understanding, evidencePack });
  const answer = await composeKirGroundedAnswer({ understanding, evidencePack, modelDecision: model, allowedContext, provider, upstreamGroundedAnswer });
  const guard = guardKirAnswer({ understanding, evidencePack, answer });
  const usage = projectKirBookUsage(evidencePack);
  return { schemaVersion: "PHI-OS-KIR-R2-PIPELINE-v1.0.0", understanding, expansion, retrieval, reranked: canonicalReranked, dedup: canonicalDedup, evidencePack, model, answer, guard, usage };
}

// functions/_lib/pai-r1-economics.js
var EXECUTION_CLASSES = Object.freeze([
  "T0_DETERMINISTIC",
  "T1_CANONICAL_ASSEMBLY",
  "T2_LIGHT_COMPOSITION",
  "T3_DEEP_COMPOSITION"
]);
var clean4 = (value) => String(value ?? "").trim();
var finite = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
var freeze2 = (value) => Object.freeze(value);
function fail2(code, details = {}) {
  const error = new Error(code);
  error.code = code;
  error.details = details;
  throw error;
}
function selectPaiRoute(input = {}, registry2 = {}) {
  const executionClass = clean4(input.aiExecutionClass);
  if (!EXECUTION_CLASSES.includes(executionClass)) fail2("PAI_EXECUTION_CLASS_REQUIRED");
  const requiresProvider = executionClass === "T2_LIGHT_COMPOSITION" || executionClass === "T3_DEEP_COMPOSITION" || executionClass === "T1_CANONICAL_ASSEMBLY" && input.canonicalAssemblyQualityInsufficient === true;
  if (!requiresProvider) return freeze2({
    aiExecutionClass: executionClass,
    providerRequired: false,
    selectedProvider: null,
    selectedModel: null,
    providerAttemptLimit: 0,
    fallbackAllowed: false,
    routingReason: executionClass === "T0_DETERMINISTIC" ? "DETERMINISTIC_SUFFICIENT" : "CANONICAL_ASSEMBLY_SUFFICIENT"
  });
  const capabilityClass = executionClass === "T3_DEEP_COMPOSITION" ? "DEEP" : "LIGHT";
  const available = (registry2.models || []).filter(
    (model) => model.status === "AVAILABLE" && (model.capabilityClass === capabilityClass || model.capabilityClass === "GENERAL")
  ).sort((a, b) => finite(a.planningCostRank) - finite(b.planningCostRank));
  const selected = available[0];
  if (!selected) return freeze2({
    aiExecutionClass: executionClass,
    providerRequired: true,
    selectedProvider: null,
    selectedModel: null,
    providerAttemptLimit: 0,
    fallbackAllowed: false,
    degradedDisposition: input.deterministicFallbackAvailable ? "DETERMINISTIC_FALLBACK" : "CONTROLLED_UNAVAILABLE",
    routingReason: "NO_ADMITTED_PROVIDER_AVAILABLE"
  });
  return freeze2({
    aiExecutionClass: executionClass,
    providerRequired: true,
    selectedProvider: selected.providerId,
    selectedModel: selected.modelId,
    providerAttemptLimit: 1,
    fallbackAllowed: true,
    fallbackCapabilityClass: capabilityClass,
    routingReason: executionClass === "T1_CANONICAL_ASSEMBLY" ? "RECORDED_T1_QUALITY_UPGRADE" : "MINIMUM_SUFFICIENT_CAPABILITY"
  });
}

// functions/_lib/kir-r2-model-gateway.js
var OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
var DEEPSEEK_CHAT_URL = "https://api.deepseek.com/chat/completions";
var DEFAULT_OPENAI_MODEL = "gpt-5.6-luna";
var DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";
var clean5 = (v) => String(v ?? "").normalize("NFKC").replace(/\u000c/g, "\n").replace(/[\t ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
var yes = (v) => ["1", "true", "yes", "on", "enabled"].includes(clean5(v).toLowerCase());
function fail3(code, details = {}) {
  const error = new Error(code);
  error.code = code;
  error.details = details;
  throw error;
}
function parseJson(raw, code) {
  try {
    return JSON.parse(raw);
  } catch {
    fail3(code);
  }
}
function openAIText(data) {
  if (clean5(data?.output_text)) return clean5(data.output_text);
  for (const item of Array.isArray(data?.output) ? data.output : []) {
    if (item?.type !== "message") continue;
    for (const c of Array.isArray(item.content) ? item.content : []) {
      if (c?.type === "refusal") fail3("KIR_R2_MODEL_PROVIDER_REFUSAL", { provider: "OPENAI_LUNA" });
      if (c?.type === "output_text" && clean5(c.text)) return clean5(c.text);
    }
  }
  fail3("KIR_R2_MODEL_PROVIDER_EMPTY_OUTPUT", { provider: "OPENAI_LUNA" });
}
function deepSeekText(data) {
  const text5 = clean5(data?.choices?.[0]?.message?.content);
  if (text5) return text5;
  fail3("KIR_R2_MODEL_PROVIDER_EMPTY_OUTPUT", { provider: "DEEPSEEK_V4_FLASH" });
}
function evidenceText(evidencePack) {
  const rows3 = [...evidencePack?.primaryEvidence || [], ...evidencePack?.supportingEvidence || []];
  return rows3.map((row, index) => `[E${index + 1}] ${clean5(row.text)}`).filter((x) => x.length > 5).join("\n\n");
}
function systemPrompt(locale = "zh-Hans") {
  if (locale !== "zh-Hans") return "You are the PHI OS answer composer. PHI OS, not the language model, owns knowledge authority. Answer only from supplied evidence. Explain the user question directly and naturally. Do not expose internal registry, canonical-node, runtime-governance, routing, provider, benchmark, or evidence-pack terminology. Do not invent external facts, examples, methods, diagnoses, scores, or claims. If evidence is insufficient, say so. Return answer text only.";
  return "\u4F60\u662F PHI OS \u7684\u7B54\u6848\u7EC4\u7EC7\u5C42\uFF0C\u4E0D\u662F\u77E5\u8BC6\u6743\u5A01\u3002\u53EA\u80FD\u4F7F\u7528\u968F\u8BF7\u6C42\u63D0\u4F9B\u7684\u8BC1\u636E\u6B63\u6587\u56DE\u7B54\u3002\u76F4\u63A5\u56DE\u7B54\u7528\u6237\u7684\u95EE\u9898\uFF0C\u7528\u81EA\u7136\u3001\u6E05\u6670\u3001\u9762\u5411\u5BA2\u6237\u7684\u7B80\u4F53\u4E2D\u6587\u89E3\u91CA\u673A\u5236\u4E0E\u5173\u7CFB\uFF1B\u4E0D\u8981\u590D\u8FF0\u95EE\u9898\uFF0C\u4E0D\u8981\u628A\u6587\u7AE0\u6807\u9898\u6216\u77E5\u8BC6\u8282\u70B9\u4E32\u6210\u6D41\u7A0B\u3002\u4E0D\u5F97\u66B4\u9732\u5185\u90E8 registry\u3001canonical node\u3001Runtime\u3001KIR\u3001KAP\u3001\u6A21\u578B\u8DEF\u7531\u3001benchmark\u3001Evidence Pack\u3001governance \u7B49\u6280\u672F\u8BCD\u3002\u4E0D\u5F97\u81EA\u884C\u8865\u5145\u5916\u90E8\u4E8B\u5B9E\u3001\u6848\u4F8B\u3001\u533B\u5B66\u65AD\u8A00\u3001\u5FC3\u7406\u6A21\u5F0F\u3001\u65B9\u6CD5\u7ED3\u8BBA\u3001\u8BC4\u5206\u3001\u81EA\u6211\u8BCA\u65AD\u5EFA\u8BAE\u6216\u6765\u6E90\u4E2D\u6CA1\u6709\u7684\u5177\u4F53\u56E0\u679C\uFF1B\u5C24\u5176\u4E0D\u8981\u628A\u8BC1\u636E\u6CA1\u6709\u786E\u8BA4\u7684\u53EF\u80FD\u6027\u5199\u6210\u201C\u53EA\u80FD\u201D\u201C\u5FC5\u7136\u201D\u201C\u53CD\u800C\u4F1A\u201D\u201C\u6700\u7EC8\u53EA\u4F1A\u201D\u7B49\u5F3A\u56E0\u679C\u3002\u7B80\u4F53\u4E2D\u6587\u56DE\u7B54\u4E2D\uFF0C\u9664\u7528\u6237\u95EE\u9898\u6216\u8BC1\u636E\u5DF2\u51FA\u73B0\u7684\u4E13\u540D\u4EE5\u53CA AI\u3001PHI OS \u5916\uFF0C\u4E0D\u65B0\u589E\u82F1\u6587\u8BCD\u3002\u4E0D\u5F97\u8F93\u51FA reasoning\u3001E1/E2\u3001\u8BC4\u5206\u6807\u7B7E\u6216\u4EFB\u4F55\u6A21\u578B\u5185\u90E8\u6B8B\u7247\u3002\u5BF9\u4E8E\u201C\u4E3A\u4EC0\u4E48/\u673A\u5236\u201D\u95EE\u9898\uFF0C\u5FC5\u987B\u4F18\u5148\u590D\u8FF0\u5E76\u89E3\u91CA\u8BC1\u636E\u5DF2\u7ECF\u660E\u786E\u7ED9\u51FA\u7684\u539F\u56E0\uFF1B\u4E0D\u5F97\u7528\u81EA\u5DF1\u63A8\u65AD\u7684\u5FC3\u7406\u72B6\u6001\u3001\u7ADE\u4E89\u5173\u7CFB\u3001\u672A\u8D70\u8DEF\u5F84\u3001\u540E\u6094\u3001\u5F20\u529B\u6216\u5176\u4ED6\u65B0\u56E0\u679C\u66FF\u6362\u8BC1\u636E\u4E2D\u7684\u5DF2\u8F7D\u660E\u673A\u5236\u3002\u82E5\u8BC1\u636E\u53EA\u8BF4\u660E\u76F8\u5173\u6216\u6761\u4EF6\u5173\u7CFB\uFF0C\u5C31\u4FDD\u6301\u8FD9\u79CD\u5F3A\u5EA6\u3002\u8BC1\u636E\u4E0D\u8DB3\u65F6\u660E\u786E\u8BF4\u660E\u4E0D\u8DB3\u3002\u53EA\u8F93\u51FA\u6700\u7EC8\u7B54\u6848\u6B63\u6587\u3002";
}
function userPrompt(payload = {}) {
  const locale = payload?.locale || "zh-Hans";
  const question = clean5(payload?.question);
  const evidence = evidenceText(payload?.evidencePack);
  const contract = payload?.answerContract || {};
  return `${locale === "zh-Hans" ? "\u7528\u6237\u95EE\u9898" : "User question"}:
${question}

${locale === "zh-Hans" ? "\u4EC5\u53EF\u4F7F\u7528\u7684 PHI OS \u8BC1\u636E" : "Only admitted PHI OS evidence"}:
${evidence}

${locale === "zh-Hans" ? "\u8F93\u51FA\u8981\u6C42" : "Output requirements"}:
${locale === "zh-Hans" ? "- \u5148\u7ED9\u76F4\u63A5\u89E3\u91CA\uFF0C\u518D\u8865\u5145\u5FC5\u8981\u673A\u5236\uFF1B\u901A\u5E38 180\u2013520 \u4E2A\u4E2D\u6587\u5B57\u7B26\uFF0C\u8BC1\u636E\u9700\u8981\u65F6\u53EF\u7A0D\u957F\u3002\n- \u4E0D\u8981\u4F7F\u7528\u201C\u6839\u636E\u7CFB\u7EDF\u6846\u67B6\u201D\u201C\u524D\u4E00\u72B6\u6001\u6210\u4E3A\u540E\u4E00\u72B6\u6001\u8F93\u5165\u201D\u201C\u8FD9\u4E2A\u95EE\u9898\u9996\u5148\u6307\u5411\u201D\u7B49\u6A21\u677F\u3002\n- \u4E0D\u8981\u8F93\u51FA\u5185\u90E8\u82F1\u6587\u672F\u8BED\u6216\u5143\u8BF4\u660E\uFF1B\u9664\u95EE\u9898/\u8BC1\u636E\u5DF2\u6709\u4E13\u540D\u4EE5\u53CA AI\u3001PHI OS \u5916\uFF0C\u4E0D\u65B0\u589E\u82F1\u6587\u8BCD\u3002\n- \u4E0D\u8981\u8F93\u51FA reasoning\u3001E1/E2\u3001\u8BC4\u5206\u6807\u7B7E\u3001\u6A21\u578B\u75D5\u8FF9\uFF0C\u4E5F\u4E0D\u8981\u81EA\u884C\u52A0\u5165\u8BC1\u636E\u4E4B\u5916\u7684\u5FC3\u7406\u6A21\u5F0F\u3001\u5668\u5B98\u3001\u81EA\u6211\u8BCA\u65AD\u5EFA\u8BAE\u6216\u5F3A\u56E0\u679C\u3002\n- \u5BF9\u201C\u4E3A\u4EC0\u4E48/\u673A\u5236\u201D\u95EE\u9898\uFF0C\u5148\u627E\u8BC1\u636E\u4E2D\u660E\u786E\u5199\u51FA\u7684\u539F\u56E0\u5E76\u4FDD\u7559\u5B83\uFF1B\u4E0D\u8981\u53E6\u9020\u201C\u5F20\u529B\u3001\u7ADE\u4E89\u3001\u672A\u8D70\u8DEF\u5F84\u3001\u540E\u6094\u201D\u7B49\u89E3\u91CA\u3002" : "- Direct answer first, then only necessary mechanism.\n- Avoid framework/meta templates and internal terminology."}
- questionType=${clean5(contract.questionType || "OTHER")}`;
}
function normalizeUsageOpenAI(usage = {}) {
  return { input: Number(usage.input_tokens || 0), cachedInput: Number(usage.input_tokens_details?.cached_tokens || 0), output: Number(usage.output_tokens || 0), total: Number(usage.total_tokens || 0) };
}
function normalizeUsageDeepSeek(usage = {}) {
  return { input: Number(usage.prompt_tokens || 0), cachedInput: Number(usage.prompt_cache_hit_tokens || 0), output: Number(usage.completion_tokens || 0), total: Number(usage.total_tokens || 0) };
}
function kirR2ModelGatewayEnabled(env = {}) {
  return yes(env.PHIOS_KIR_R2_MODEL_GATEWAY_ENABLED);
}
function evaluateKirR2ModelBackedRoute({ understanding, evidencePack, env = {}, forceProvider = null } = {}) {
  if (forceProvider) return Object.freeze({ schemaVersion: "PHI-OS-KIR-R2-W16R2-MODEL-ROUTE-v1.0.0", tier: "FORCED", providerId: forceProvider, reasonCodes: ["FORCED_BY_SUCCESSOR_OR_TEST"], knowledgeAuthorityOwnedByProvider: false });
  const rows3 = [...evidencePack?.primaryEvidence || [], ...evidencePack?.supportingEvidence || []];
  const nodes = new Set(rows3.map((x) => x.nodeCode).filter(Boolean));
  const professional = understanding?.professionalDepth === "HIGH";
  const personalized = understanding?.personalizationNeed !== "NONE_REQUIRED";
  const multiNode = nodes.size >= 2;
  const comparison = understanding?.questionType === "COMPARISON";
  const ambiguity = understanding?.ambiguity === "HIGH";
  const deepSeekAvailable = Boolean(clean5(env.DEEPSEEK_API_KEY));
  const reasons = [];
  if (professional) reasons.push("PROFESSIONAL_DEPTH");
  if (comparison && multiNode) reasons.push("MULTI_NODE_COMPARISON");
  if (personalized && multiNode) reasons.push("MULTI_NODE_PERSONALIZED_SYNTHESIS");
  if (ambiguity && multiNode) reasons.push("AMBIGUOUS_MULTI_NODE_SYNTHESIS");
  const escalate = deepSeekAvailable && reasons.length > 0;
  const aiExecutionClass = escalate ? "T3_DEEP_COMPOSITION" : "T2_LIGHT_COMPOSITION";
  const paiRoute = selectPaiRoute({ aiExecutionClass }, { models: [
    { providerId: "OPENAI_LUNA", modelId: DEFAULT_OPENAI_MODEL, capabilityClass: "LIGHT", status: "AVAILABLE", planningCostRank: 1 },
    { providerId: "DEEPSEEK_V4_FLASH", modelId: DEFAULT_DEEPSEEK_MODEL, capabilityClass: "DEEP", status: deepSeekAvailable ? "AVAILABLE" : "UNAVAILABLE", planningCostRank: 1 }
  ] });
  return Object.freeze({ schemaVersion: "PHI-OS-KIR-R2-W16R2-MODEL-ROUTE-v1.0.0", tier: escalate ? "T2_COMPLEX" : "T1_DEFAULT", aiExecutionClass, providerId: paiRoute.selectedProvider, selectedModel: paiRoute.selectedModel, providerSelectionOwner: "PAI_R1", reasonCodes: reasons.length ? reasons : ["DEFAULT_CUSTOMER_COMPOSER"], knowledgeAuthorityOwnedByProvider: false });
}
function createKirR2ModelGateway({ env = {}, fetcher = globalThis.fetch, forceProvider = null } = {}) {
  if (typeof fetcher !== "function") fail3("KIR_R2_MODEL_FETCH_UNAVAILABLE");
  return async ({ model, payload } = {}) => {
    const route = evaluateKirR2ModelBackedRoute({ understanding: { questionType: payload?.answerContract?.questionType, professionalDepth: payload?.routingContext?.professionalDepth, personalizationNeed: payload?.routingContext?.personalizationNeed, ambiguity: payload?.routingContext?.ambiguity }, evidencePack: payload?.evidencePack, env, forceProvider });
    if (route.providerId === "OPENAI_LUNA") {
      if (!clean5(env.OPENAI_API_KEY)) fail3("KIR_R2_OPENAI_API_KEY_NOT_CONFIGURED");
      const providerModel = clean5(env.PHIOS_KIR_R2_OPENAI_MODEL) || DEFAULT_OPENAI_MODEL;
      let response2;
      try {
        response2 = await fetcher(OPENAI_RESPONSES_URL, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: providerModel, store: false, reasoning: { effort: "none" }, input: [{ role: "system", content: systemPrompt(payload?.locale) }, { role: "user", content: userPrompt(payload) }], max_output_tokens: 900 }) });
      } catch (error) {
        fail3("KIR_R2_MODEL_PROVIDER_NETWORK_FAILED", { provider: "OPENAI_LUNA", message: clean5(error?.message) });
      }
      const raw = await response2.text();
      const data = parseJson(raw, "KIR_R2_OPENAI_UNREADABLE_RESPONSE");
      if (!response2.ok) fail3("KIR_R2_MODEL_PROVIDER_REQUEST_FAILED", { provider: "OPENAI_LUNA", status: response2.status, message: data?.error?.message || null });
      return Object.freeze({ text: openAIText(data), providerId: "OPENAI_LUNA", providerModel, route, usage: normalizeUsageOpenAI(data?.usage), rawId: data?.id || null });
    }
    if (route.providerId === "DEEPSEEK_V4_FLASH") {
      if (!clean5(env.DEEPSEEK_API_KEY)) fail3("KIR_R2_DEEPSEEK_API_KEY_NOT_CONFIGURED");
      const providerModel = clean5(env.PHIOS_KIR_R2_DEEPSEEK_MODEL) || DEFAULT_DEEPSEEK_MODEL;
      let response2;
      try {
        response2 = await fetcher(DEEPSEEK_CHAT_URL, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${env.DEEPSEEK_API_KEY}` }, body: JSON.stringify({ model: providerModel, messages: [{ role: "system", content: systemPrompt(payload?.locale) }, { role: "user", content: userPrompt(payload) }], thinking: { type: "disabled" }, max_tokens: 900 }) });
      } catch (error) {
        fail3("KIR_R2_MODEL_PROVIDER_NETWORK_FAILED", { provider: "DEEPSEEK_V4_FLASH", message: clean5(error?.message) });
      }
      const raw = await response2.text();
      const data = parseJson(raw, "KIR_R2_DEEPSEEK_UNREADABLE_RESPONSE");
      if (!response2.ok) fail3("KIR_R2_MODEL_PROVIDER_REQUEST_FAILED", { provider: "DEEPSEEK_V4_FLASH", status: response2.status, message: data?.error?.message || null });
      return Object.freeze({ text: deepSeekText(data), providerId: "DEEPSEEK_V4_FLASH", providerModel, route, usage: normalizeUsageDeepSeek(data?.usage), rawId: data?.id || null });
    }
    fail3("KIR_R2_MODEL_PROVIDER_UNSUPPORTED", { provider: route.providerId, requestedModel: model });
  };
}

// functions/_lib/kir-r2-production-admission.js
var clean6 = (v) => String(v ?? "").normalize("NFKC").trim();
var yes2 = (v) => ["1", "true", "yes", "on", "enabled"].includes(clean6(v).toLowerCase());
var KIR_R2_W16R2B_BUILD_ADMITTED = true;
var KIR_R2_W16R2B_ADMISSION_SCHEMA = "PHI-OS-KIR-R2-W16R2B-PRODUCTION-ADMISSION-v1.0.0";
function getKirR2W16R2BProductionAdmission(env = {}) {
  const requested = yes2(env.PHIOS_KIR_R2_W16R2B_PRODUCTION_ADMITTED);
  const gatewayRequested = yes2(env.PHIOS_KIR_R2_MODEL_GATEWAY_ENABLED);
  const allowed = KIR_R2_W16R2B_BUILD_ADMITTED && requested && gatewayRequested;
  return Object.freeze({
    schemaVersion: KIR_R2_W16R2B_ADMISSION_SCHEMA,
    buildAdmitted: KIR_R2_W16R2B_BUILD_ADMITTED,
    requested,
    gatewayRequested,
    allowed,
    status: allowed ? "PRODUCTION_ADMITTED" : "PRODUCTION_ADMITTED_RUNTIME_FLAG_OFF"
  });
}
function kirR2W16R2BProductionCutoverEnabled(env = {}) {
  return getKirR2W16R2BProductionAdmission(env).allowed;
}

// functions/_lib/kir-r2-w16r2-successor.js
var clean7 = (v) => String(v ?? "").normalize("NFKC").trim();
function hasUnexpectedScript(text5) {
  for (const ch of clean7(text5)) {
    if (!/\p{L}/u.test(ch)) continue;
    if (/\p{Script=Han}|\p{Script=Latin}/u.test(ch)) continue;
    return true;
  }
  return false;
}
function evidenceCorpus(question, evidencePack) {
  const rows3 = [...evidencePack?.primaryEvidence || [], ...evidencePack?.supportingEvidence || []];
  return clean7([question, ...rows3.map((x) => x?.text)].filter(Boolean).join("\n")).toLowerCase();
}
function hasUnexpectedLatin(text5, { locale = "zh-Hans", question = "", evidencePack = null } = {}) {
  if (locale !== "zh-Hans") return false;
  const corpus = evidenceCorpus(question, evidencePack);
  const allow = /* @__PURE__ */ new Set(["ai", "phi", "os"]);
  for (const m of clean7(text5).matchAll(/[A-Za-z][A-Za-z0-9-]*/g)) {
    const token = m[0].toLowerCase();
    if (allow.has(token)) continue;
    if (corpus.includes(token)) continue;
    return true;
  }
  return false;
}
function hasModelArtifact(text5) {
  const t = clean7(text5);
  return /(?:^|\s)(?:-?reasoning|analysis|assistant|final)\b/i.test(t) || /\bE\d+(?:\s*,\s*E\d+){1,}\b/.test(t) || /_[\p{L}\p{N}]{2,16}\s*$/u.test(t);
}
function hasUnsupportedHighRiskExpansion(text5, { question = "", evidencePack = null } = {}) {
  const t = clean7(text5);
  const corpus = evidenceCorpus(question, evidencePack);
  const riskyTerms = ["\u5927\u8111", "\u795E\u7ECF\u751F\u7406", "\u707E\u96BE\u5316", "\u538B\u6291", "\u6291\u90C1", "\u521B\u4F24", "\u8BCA\u65AD", "\u75C7\u72B6"];
  if (riskyTerms.some((term) => t.includes(term) && !corpus.includes(term))) return true;
  const selfDiagnostic = [/识别自己.{0,18}卡在/u, /自己当前.{0,18}卡在/u, /你当前.{0,18}卡在/u, /建议你/u, /你可以先/u, /应该先/u];
  if (selfDiagnostic.some((r) => r.test(t) && !r.test(corpus))) return true;
  const strongNovel = [/只能通过.{0,28}(?:被迫|显现|现身)/u, /反而会更.{0,24}(?:清晰|明显|容易|强烈)/u, /最终只(?:会)?(?:留|剩)/u, /并未消失.{0,36}(?:隐性|需求|残余)/u];
  if (strongNovel.some((r) => r.test(t) && !r.test(corpus))) return true;
  return false;
}
function hasUnsupportedNovelCausalTerm(text5, { question = "", evidencePack = null } = {}) {
  const t = clean7(text5);
  const corpus = evidenceCorpus(question, evidencePack);
  const riskyTerms = ["\u672A\u88AB\u5904\u7406\u7684\u5F20\u529B", "\u5F20\u529B", "\u76F8\u4E92\u7ADE\u4E89", "\u5F7C\u6B64\u7ADE\u4E89", "\u8FDF\u7591", "\u540E\u6094", "\u672A\u8D70\u4E4B\u8DEF", "\u6536\u5C3E\u4E0D\u5E72\u51C0", "\u672A\u8868\u8FBE\u7684\u4F59\u91CF", "\u8FDE\u7EED\u52A8\u529B", "\u88AB\u63A8\u5F00\u7684\u90E8\u5206", "\u91CD\u65B0\u5192\u51FA\u6765"];
  return riskyTerms.some((term) => t.includes(term) && !corpus.includes(term));
}
function guardKirR2ModelBackedAnswer({ understanding, answer, baseGuard, question = "", evidencePack = null } = {}) {
  const text5 = clean7(answer?.text);
  const internal = /(?:\bKIR(?:-R2)?\b|\bKAP(?:-W\d+)?\b|\bRuntime\b|\bEvidence Pack\b|\bcanonical(?: node)?\b|\bregistry\b|\bbenchmark\b|\bgovernance\b|groundingBundle|provider routing)/i.test(text5);
  const metaTemplate = /根据(?:系统|PHI OS)?框架(?:的)?(?:理解|解释)|前一(?:层|状态|环节).{0,16}(?:后一|下一)(?:层|状态|环节).{0,16}(?:输入|条件)|这个问题首先指向|strongest grounded match/i.test(text5);
  const wrongScript = hasUnexpectedScript(text5);
  const unexpectedLatin = hasUnexpectedLatin(text5, { locale: understanding?.locale, question, evidencePack });
  const modelArtifact = hasModelArtifact(text5);
  const unsupportedExpansion = hasUnsupportedHighRiskExpansion(text5, { question, evidencePack });
  const unsupportedNovelCausal = hasUnsupportedNovelCausalTerm(text5, { question, evidencePack });
  const excessiveHeading = (text5.match(/(?:^|\n)\s*(?:\d+[.、]|第[一二三四五六七八九十]+[、：:]|\*\*[^*]+\*\*)/g) || []).length >= 5;
  const lengthOk = understanding?.locale === "zh-Hans" ? text5.length >= 80 : text5.length >= 120;
  const passed = baseGuard?.passed === true && lengthOk && !internal && !metaTemplate && !wrongScript && !unexpectedLatin && !modelArtifact && !unsupportedExpansion && !unsupportedNovelCausal && !excessiveHeading;
  return Object.freeze({ schemaVersion: "PHI-OS-KIR-R2-W16R2A-MODEL-BACKED-ANSWER-GUARD-v1.0.0", BASE_SEMANTIC_GUARD_PASSED: baseGuard?.passed === true, CUSTOMER_LANGUAGE_LENGTH_OK: lengthOk, NO_INTERNAL_TERMINOLOGY_LEAK: !internal, NO_KNOWLEDGE_CHAIN_META_TEMPLATE: !metaTemplate, NO_UNEXPECTED_SCRIPT_CONTAMINATION: !wrongScript, NO_UNEXPECTED_LATIN_LEAK: !unexpectedLatin, NO_MODEL_ARTIFACT_LEAK: !modelArtifact, NO_UNSUPPORTED_HIGH_RISK_EXPANSION: !unsupportedExpansion, NO_UNSUPPORTED_NOVEL_CAUSAL_TERM: !unsupportedNovelCausal, NO_EXCESSIVE_NODE_STYLE_HEADINGS: !excessiveHeading, passed });
}
async function runKirR2W16R2Successor({ question, locale = "zh-Hans", profiles, groundingBundle = null, articleSources = [], allowedContext = null, upstreamGroundedAnswer = null, env = {}, fetcher = globalThis.fetch, provider = null } = {}) {
  if (!kirR2ModelGatewayEnabled(env) && !provider) return { status: "KIR_R2_W16R2_GATEWAY_DISABLED", applied: false };
  const primaryProvider = provider || createKirR2ModelGateway({ env, fetcher });
  let first;
  try {
    first = await runKirR2Pipeline({ question, locale, profiles, groundingBundle, articleSources, allowedContext, upstreamGroundedAnswer, provider: primaryProvider });
  } catch (error) {
    return { status: "KIR_R2_W16R2_PROVIDER_ERROR", applied: false, errorCode: error?.code || String(error?.message || "KIR_R2_W16R2_PROVIDER_ERROR") };
  }
  const firstGuard = guardKirR2ModelBackedAnswer({ understanding: first.understanding, answer: first.answer, baseGuard: first.guard, question, evidencePack: first.evidencePack });
  if (firstGuard.passed) return { status: "KIR_R2_W16R2_APPLIED", applied: true, result: first, successorGuard: firstGuard, escalated: false, attempts: 1 };
  const alreadyDeep = first.answer?.providerMeta?.providerId === "DEEPSEEK_V4_FLASH";
  if (alreadyDeep || !clean7(env.DEEPSEEK_API_KEY)) return { status: "KIR_R2_W16R2_GUARD_REJECTED", applied: false, result: first, successorGuard: firstGuard, escalated: false, attempts: 1 };
  let second;
  try {
    second = await runKirR2Pipeline({ question, locale, profiles, groundingBundle, articleSources, allowedContext, upstreamGroundedAnswer, provider: createKirR2ModelGateway({ env, fetcher, forceProvider: "DEEPSEEK_V4_FLASH" }) });
  } catch (error) {
    return { status: "KIR_R2_W16R2_ESCALATION_ERROR", applied: false, result: first, successorGuard: firstGuard, errorCode: error?.code || String(error?.message || "KIR_R2_W16R2_ESCALATION_ERROR"), escalated: true, attempts: 2 };
  }
  const secondGuard = guardKirR2ModelBackedAnswer({ understanding: second.understanding, answer: second.answer, baseGuard: second.guard, question, evidencePack: second.evidencePack });
  return { status: secondGuard.passed ? "KIR_R2_W16R2_APPLIED_AFTER_ESCALATION" : "KIR_R2_W16R2_GUARD_REJECTED_AFTER_ESCALATION", applied: secondGuard.passed, result: second, successorGuard: secondGuard, firstAttempt: { providerMeta: first.answer?.providerMeta || null, guard: firstGuard }, escalated: true, attempts: 2 };
}

// functions/_lib/kir-r2-production.js
var PROFILE_PATH = "content/knowledge/knowledge-intelligence-r2/semantic-profiles/successors/book4-a6/kir-r2-book-i-iv-semantic-retrieval-profiles-v2.json";
var ARTICLE_BINDING_PATH = "content/knowledge/knowledge-intelligence-r2/registries/successors/book4-publication-v1/kir-r2-book-i-iv-published-article-binding-registry-v3.json";
var BOOK5_ARTICLE_BINDING_PATH = "content/knowledge/knowledge-intelligence-r2/registries/successors/book5-publication-v1/published-article-bindings-v1.json";
var BOOK5_PROFILE_PATH = "content/knowledge/knowledge-intelligence-r2/semantic-profiles/successors/book5-publication-v1/semantic-retrieval-profiles-v1.json";
async function readAsset(env, path2) {
  if (!env?.ASSETS?.fetch) return null;
  const r = await env.ASSETS.fetch(new Request(`https://assets.local/${path2}`));
  return r.ok ? r.json() : null;
}
function enrichProfiles(profiles, bindings = []) {
  const byNode = /* @__PURE__ */ new Map();
  for (const b of bindings) {
    if (!byNode.has(b.nodeCode)) byNode.set(b.nodeCode, []);
    byNode.get(b.nodeCode).push(b);
  }
  return profiles.map((p) => {
    const rows3 = byNode.get(p.nodeCode) || [];
    if (!rows3.length) return p;
    return { ...p, articleSources: rows3.map((r) => ({ articleCode: r.articleCode, slug: r.slug, href: r.href, title: r.title, locale: r.locale, authorityDigest: r.authorityDigest })), aliases: [...p.aliases || [], ...rows3.flatMap((r) => [r.title, r.slug])], userLanguage: [...p.userLanguage || [], ...rows3.map((r) => r.title)] };
  });
}
async function loadProfiles(env) {
  const [doc, binding, book5, book5Profiles] = await Promise.all([readAsset(env, PROFILE_PATH), readAsset(env, ARTICLE_BINDING_PATH), readAsset(env, BOOK5_ARTICLE_BINDING_PATH), readAsset(env, BOOK5_PROFILE_PATH)]);
  if (!Array.isArray(doc?.profiles) || doc.profiles.length < 348) return null;
  if (Number.isInteger(doc.profileCount) && doc.profileCount !== doc.profiles.length) return null;
  const profiles = [...new Map([...doc.profiles, ...book5Profiles?.profiles || []].map((p) => [p.nodeCode, p])).values()];
  return enrichProfiles(profiles, [...binding?.records || [], ...book5?.records || []]);
}
async function runKirR2ProductionProjection({ question, locale = "zh-Hans", env = {}, allowedContext = null, upstreamGroundedAnswer = null, upstreamGroundingBundle = null, provider = null } = {}) {
  try {
    const profiles = await loadProfiles(env);
    if (!profiles) return { status: "KIR_R2_PROFILES_UNAVAILABLE", applied: false };
    if (!provider && kirR2W16R2BProductionCutoverEnabled(env)) {
      const successor = await runKirR2W16R2Successor({ question, locale, profiles, allowedContext, upstreamGroundedAnswer, groundingBundle: upstreamGroundingBundle, env });
      if (successor.applied) return { status: successor.status, applied: true, result: successor.result, w16r2: { successorGuard: successor.successorGuard, escalated: successor.escalated, attempts: successor.attempts } };
      if (successor.result) return { status: successor.status, applied: false, result: successor.result, w16r2: { successorGuard: successor.successorGuard, escalated: successor.escalated, attempts: successor.attempts } };
      return { status: successor.status, applied: false, errorCode: successor.errorCode || null };
    }
    const admission = getKirR2W16R2BProductionAdmission(env);
    const result = await runKirR2Pipeline({ question, locale, profiles, allowedContext, upstreamGroundedAnswer, groundingBundle: upstreamGroundingBundle, provider });
    if (!result.guard.passed) return { status: "KIR_R2_GUARD_REJECTED", applied: false, result };
    return { status: kirR2ModelGatewayEnabled(env) && !admission.allowed ? "KIR_R2_W16R2B_PRODUCTION_BLOCKED_FALLBACK" : "KIR_R2_APPLIED", applied: true, result, w16r2b: { admission } };
  } catch (error) {
    return { status: "KIR_R2_RUNTIME_ERROR", applied: false, errorCode: String(error?.message || "KIR_R2_RUNTIME_ERROR") };
  }
}

// functions/_lib/structured-ask-policy.js
var OWNERS = {
  "BOOK-1": ["book-1/book-1-mechanism-registry-v1.json", "objects"],
  "BOOK-2": ["book-2/book-2-runtime-pattern-registry-v1.json", "patterns"],
  "BOOK-3": ["book-3/book-3-maintenance-signal-registry-v1.json", "entries"],
  "BOOK-4": ["book-4/book-4-expansion-mode-registry-v1.json", "objects"]
};
function normalizeStructuredScope(value) {
  if (value?.scopeType !== "STRUCTURED_KNOWLEDGE" || !OWNERS[value.bookCode] || !/^SK-B[1-4]-[A-Z0-9-]{1,80}$/.test(value.objectId || "") || !value.objectId.startsWith(`SK-B${value.bookCode.slice(-1)}-`)) return null;
  return { scopeType: "STRUCTURED_KNOWLEDGE", bookCode: value.bookCode, objectId: value.objectId };
}
async function load(env, path2) {
  try {
    const r = await env?.ASSETS?.fetch(new Request("https://assets.local/content/knowledge/structured/" + path2));
    return r?.ok ? await r.json() : null;
  } catch {
    return null;
  }
}
async function loadStructuredObject(env, scope) {
  const s = normalizeStructuredScope(scope);
  if (!s) return null;
  const [path2, key] = OWNERS[s.bookCode], data = await load(env, path2);
  const object3 = data?.[key]?.find((o) => o.objectId === s.objectId && o.bookCode === s.bookCode);
  if (!object3 || !["IN_REVIEW", "ACCEPTED", "ACTIVE"].includes(object3.status) || !object3.sourceRefs?.canonicalNodeCodes?.includes(object3.nodeCode) || !object3.sourceRefs?.manuscriptSectionRefs?.length || object3.projectionState === "WITHHELD") return null;
  return { object: object3, data };
}
async function resolveStructuredEntry(ref, env) {
  const id = String(ref).replace(/^CONCEPT:/, "").toUpperCase();
  const bookCode = `BOOK-${id[4]}`;
  const result = await loadStructuredObject(env, { scopeType: "STRUCTURED_KNOWLEDGE", bookCode, objectId: id });
  return result ? { bookCode, partCode: result.object.partCode, retrievalScope: { scopeType: "STRUCTURED_KNOWLEDGE", bookCode, objectId: id } } : null;
}
function classifyStructuredIntent(question) {
  const q = String(question || "").toLowerCase();
  for (const [intent, re] of [["SCALE_TRANSITION", /scale (?:shift|transition)|尺度(?:转|跨)/], ["PATTERN_COMPARISON", /compar|\bversus\b|\bvs\b|比较|对比/], ["RUNTIME_INTERACTION", /relationship|interaction|关系|互动/], ["RECOVERY", /recover|restore|恢复|修复/], ["DEGRADATION", /degrad|failure|退化|失效/], ["CONTINUITY", /continuity|continuous|连续|持续/], ["EXPANSION", /expan|扩展/], ["CONSTRAINT_ANALYSIS", /constraint|限制|约束/], ["STATE_TRANSITION", /transition|状态.*变|转换/]]) if (re.test(q)) return intent;
  return "MECHANISM_EXPLANATION";
}
function structuredIntentRelevant(intent, source) {
  const tags = String(source.structuredTags || "");
  const rules = { RECOVERY: /RECOVERY|ADAPTATION|恢复|修复/, DEGRADATION: /DEGRADATION|FAILURE|退化|失效/, CONTINUITY: /CONTINUITY|连续|持续/, EXPANSION: /EXPANSION|REPLICATION|DISTRIBUTION|扩展/, SCALE_TRANSITION: /SCALE_SHIFT|尺度转换/, CONSTRAINT_ANALYSIS: /CONSTRAINT|约束|限制/, RUNTIME_INTERACTION: /RELATIONSHIP|COORDINATION|FEEDBACK|关系|互动/, STATE_TRANSITION: /TRANSITION|STATE|状态/ };
  if (intent === "PATTERN_COMPARISON") return false;
  if (intent === "EXPANSION" && source.bookCode === "BOOK-4" && /\b(?:MAINTENANCE_COST|SCALE_SHIFT)\b/.test(tags)) return true;
  return !rules[intent] || rules[intent].test(tags);
}
async function retrieveStructuredObject({ env, scope, locale = "zh-Hans" }) {
  const found = await loadStructuredObject(env, scope);
  if (!found) return { sources: [], nodeCodes: [], chain: [] };
  const { object: o } = found;
  const text5 = o.canonicalMeaning || o.articles?.find((a) => a.locale === locale)?.summary || o.definition;
  if (!text5) return { sources: [], nodeCodes: [], chain: [{ stage: "SELECTED_STRUCTURED_OBJECT", status: "SEMANTIC_CONTENT_UNAVAILABLE" }] };
  const discovery = await load(env, "structured-knowledge-registry-v1.json");
  const href = discovery?.objects?.find((x) => x.objectId === o.objectId)?.explorerHref;
  if (!href) return { sources: [], nodeCodes: [], chain: [] };
  return { sources: [{ sourceId: `STRUCTURED:${o.objectId}`, sourceType: "STRUCTURED_KNOWLEDGE_OBJECT", authorityClass: "GOVERNED_PROJECTION", bookCode: o.bookCode, partCode: o.partCode, nodeCode: o.nodeCode, structuredObjectId: o.objectId, structuredTags: `${o.objectType} ${o.family || ""} ${o.title}`, scopeMatch: true, selected: true, href, text: text5, sourceRefs: o.sourceRefs, humanAcceptanceComplete: false }], nodeCodes: [o.nodeCode], chain: [{ stage: "SELECTED_STRUCTURED_OBJECT", status: "MATCHED" }, { stage: "RELATED_STRUCTURED_OBJECTS", status: "NO_ADMITTED_EDGES" }, { stage: "CANONICAL_NODE", status: "SOURCE_REFS_BOUND" }, { stage: "MANUSCRIPT_OR_PUBLISHED_ARTICLE", status: "EXISTING_RETRIEVAL_FALLBACK" }, { stage: "BROADER_KNOWLEDGE", status: "RELEVANCE_GATED" }] };
}
function structuredAnswerShape(bundle, directAnswer) {
  const source = bundle?.sources?.find((s) => s.sourceType === "STRUCTURED_KNOWLEDGE_OBJECT" && s.selected);
  if (!source) return null;
  return { directAnswer, mechanismOrState: source.text, conditions: [], relatedFactors: [], possibleTransition: null, boundaryUnknown: bundle.question?.locale === "en" ? "Structured classification awaits review; conditions and transitions are not established." : "\u7ED3\u6784\u5316\u5206\u7C7B\u5F85\u5BA1\u6838\uFF1B\u6761\u4EF6\u4E0E\u8F6C\u6362\u5173\u7CFB\u5C1A\u672A\u786E\u7ACB\u3002", exploreInBook: source.href, sourceIds: [source.sourceId] };
}

// functions/_lib/book-vii-published-admission.js
var BOOK_VII_ADMISSION_PATH = "content/knowledge/public/successors/book-vii-v2-source-refresh-v1/published-projection.json";
var hash = async (text5) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text5)))).map((b) => b.toString(16).padStart(2, "0")).join("");
async function loadBookViiPublishedAdmission(readJson2) {
  let release;
  try {
    release = await readJson2(BOOK_VII_ADMISSION_PATH);
  } catch {
    return null;
  }
  const refresh = release?.status === "CURRENT_SOURCE_REFRESH_PENDING_HUMAN_REVIEW" && release.sourceRefreshAuthorization?.kind === "EXPLICIT_USER_REQUEST_CANONICAL_V2_CUTOVER" && release.sourceRefreshAuthorization?.sourceVersion === "v2" && /^[a-f0-9]{64}$/.test(release.sourceRefreshAuthorization?.sourceDigest || "") && release.sourceRefreshAuthorization?.newHumanAcceptance === null;
  if (!release || !refresh && release.status !== "ADMITTED_FOR_PRODUCTION" || release.humanAcceptance?.decision !== "ACCEPT" || release.humanAcceptance?.source !== "EXPLICIT_USER_HUMAN_ACCEPT") return null;
  const nodes = release.projections?.nodes || [], fragments = release.projections?.fragments || [];
  if (!nodes.length || !fragments.length) return null;
  for (const node of nodes) {
    const packet = release.packages?.find((p) => p.nodeCode === node.nodeCode && p.locale === node.locale);
    const authorizedRefresh = refresh && release.sourceRefreshAuthorization.affectedNodeCodes.includes(node.nodeCode) && packet?.sourceVersion === "v2" && packet?.sourceDigest === release.sourceRefreshAuthorization.sourceDigest && packet?.review?.decision === "pending" && packet?.approval?.decision === "authorized_source_refresh" && packet?.publication?.decision === "current_source_refresh";
    const acceptedPredecessor = packet?.review?.decision === "accept" && packet?.approval?.decision === "approve" && packet?.publication?.decision === "publish";
    if (node.bookCode !== "BOOK-7" || node.locale !== "zh-Hans" || !/^KN-B7-14-\d{3}$/.test(node.nodeCode) || !authorizedRefresh && !acceptedPredecessor || packet.authorizationRef !== release.humanAcceptance.recordCode || node.title !== packet.title) return null;
    if (node.authorityDigest !== await hash(JSON.stringify(packet))) return null;
  }
  for (const fragment of fragments) {
    const packet = release.packages.find((p) => p.nodeCode === fragment.nodeCode && p.locale === fragment.locale);
    if (!nodes.some((n) => n.nodeCode === fragment.nodeCode && n.locale === fragment.locale) || !packet?.content.split("\n").includes(fragment.text) || !packet.approvedFragments?.some((f) => JSON.stringify(f) === JSON.stringify(fragment)) || fragment.digest !== await hash(fragment.text) || /phios-private-manuscripts|books\/book-7\/source|signedUrl|fixture-a|fixture-b/i.test(fragment.text)) return null;
  }
  for (const question of release.projections.questions || []) {
    const packet = release.packages.find((p) => p.nodeCode === question.nodeCode && p.locale === question.locale);
    if (!packet?.approvedQuestions.includes(question.question)) return null;
  }
  for (const alias of release.projections.aliases || []) {
    const packet = release.packages.find((p) => p.nodeCode === alias.nodeCode && p.locale === alias.locale);
    if (!packet?.approvedQuestions.includes(alias.value)) return null;
  }
  return release;
}
async function appendBookViiProjection(base, name, release) {
  if (!release) return base;
  const additional = release.projections?.[name] || [];
  const records = [...base.records || [], ...additional];
  return { ...base, records, recordCount: records.length, predecessorDigest: base.digest, digest: await hash(JSON.stringify(records)), digestScheme: "SHA256_JSON_RECORDS_V1", additiveSuccessor: release.releaseCode };
}

// functions/_lib/public-knowledge-api.js
var SUPPORTED_LOCALES = /* @__PURE__ */ new Set(["zh-Hans", "en"]);
var SUPPORTED_MODES = /* @__PURE__ */ new Set(["auto", "overview", "focused", "full_article", "continuity"]);
var MAX_QUERY_LENGTH = 500;
var jsonResponse = (body, status = 200, cache = "no-store") => Response.json(body, {
  status,
  headers: {
    "Cache-Control": cache,
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff"
  }
});
var normalize = (value) => String(value ?? "").normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");
var tokens = (value) => normalize(value).split(/[^\p{L}\p{N}-]+/u).filter((token) => token.length > 1);
async function readProjection(env, name) {
  if (!env?.ASSETS?.fetch) throw new Error("PUBLIC_KNOWLEDGE_ASSETS_UNAVAILABLE");
  const response2 = await env.ASSETS.fetch(new Request(`https://assets.local/content/knowledge/public/retrieval/${name}.json`));
  if (!response2.ok) throw new Error(`PUBLIC_KNOWLEDGE_PROJECTION_UNAVAILABLE:${name}`);
  const original = await response2.json();
  if (name === "published-retrieval-index") return original;
  const release = await loadBookViiPublishedAdmission(async (path2) => {
    const r = await env.ASSETS.fetch(new Request(`https://assets.local/${path2}`));
    if (!r.ok) return null;
    return r.json();
  });
  return appendBookViiProjection(original, name, release);
}
function scoreNode({ query, node, aliases, questions, fragments }) {
  const q = normalize(query);
  const qTokens = new Set(tokens(query));
  let score = 0;
  const evidence = [];
  const add = (points, type, value) => {
    score += points;
    evidence.push({ type, value });
  };
  if (normalize(node.title) === q) add(1e3, "exact_title", node.title);
  for (const item of questions) {
    if (normalize(item.question) === q) add(item.questionType === "canonical" ? 950 : 700, "exact_question", item.question);
  }
  for (const item of aliases) {
    if (normalize(item.value) === q || normalize(item.normalized) === q) add(900, "exact_alias", item.value);
  }
  const candidates = [node.title, node.summary, ...questions.map((x) => x.question), ...aliases.map((x) => x.value)];
  for (const value of candidates) {
    const valueTokens = new Set(tokens(value));
    const matched = [...qTokens].filter((token) => valueTokens.has(token)).length;
    if (matched) add(matched * 25, "token_match", value);
  }
  for (const fragment of fragments) {
    const valueTokens = new Set(tokens(fragment.text));
    const matched = [...qTokens].filter((token) => valueTokens.has(token)).length;
    if (matched) add(matched * 5, "fragment_match", fragment.fragmentCode);
  }
  return { score, evidence };
}
function coverageFor(score, exact) {
  if (exact) return "exact";
  if (score >= 200) return "strong";
  if (score >= 100) return "partial";
  if (score > 0) return "limited";
  return "none";
}
function selectFragments(mode, fragments, query) {
  const ordered = [...fragments].sort((a, b) => a.ordinal - b.ordinal);
  if (mode === "full_article") return ordered;
  if (mode === "continuity") return ordered.length <= 3 ? ordered : [ordered[0], ...ordered.slice(-2)];
  if (mode === "overview") return ordered.length <= 3 ? ordered : [ordered[0], ordered[1], ordered.at(-1)];
  if (mode === "focused") {
    const qTokens = new Set(tokens(query));
    let bestIndex = 0, bestScore = -1;
    ordered.forEach((fragment, index) => {
      const fTokens = new Set(tokens(fragment.text));
      const score = [...qTokens].filter((token) => fTokens.has(token)).length;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    return ordered.filter((_, index) => Math.abs(index - bestIndex) <= 1 || index === 0);
  }
  return ordered.length <= 5 ? ordered : [ordered[0], ordered[1], ordered[2], ordered.at(-1)];
}
async function handlePublicKnowledgeRequest(request, env = {}) {
  if (request.method !== "GET") return jsonResponse({ ok: false, error: { code: "METHOD_NOT_ALLOWED" } }, 405);
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim();
  const locale = url.searchParams.get("locale") || "en";
  const requestedMode = url.searchParams.get("mode") || "auto";
  if (!query || query.length > MAX_QUERY_LENGTH) return jsonResponse({ ok: false, error: { code: "QUERY_INVALID" } }, 400);
  if (!SUPPORTED_LOCALES.has(locale)) return jsonResponse({ ok: false, error: { code: "LOCALE_UNSUPPORTED" } }, 400);
  if (!SUPPORTED_MODES.has(requestedMode)) return jsonResponse({ ok: false, error: { code: "MODE_UNSUPPORTED" } }, 400);
  const [nodesP, aliasesP, questionsP, fragmentsP, relationshipsP, localeP, index] = await Promise.all([
    readProjection(env, "nodes"),
    readProjection(env, "aliases"),
    readProjection(env, "questions"),
    readProjection(env, "fragments"),
    readProjection(env, "relationships"),
    readProjection(env, "locale-availability"),
    readProjection(env, "published-retrieval-index")
  ]);
  const nodes = nodesP.records.filter((x) => x.locale === locale);
  const ranked = nodes.map((node) => {
    const aliases = aliasesP.records.filter((x) => x.locale === locale && x.nodeCode === node.nodeCode);
    const questions = questionsP.records.filter((x) => x.locale === locale && x.nodeCode === node.nodeCode);
    const fragments = fragmentsP.records.filter((x) => x.locale === locale && x.nodeCode === node.nodeCode && (!x.questionScope || x.questionScope.some((q) => normalize(q) === normalize(query))));
    const scored = scoreNode({ query, node, aliases, questions, fragments });
    return { node, aliases, questions, fragments, ...scored };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score || a.node.nodeCode.localeCompare(b.node.nodeCode));
  if (!ranked.length) return jsonResponse({
    ok: true,
    query: { text: query, locale, mode: requestedMode },
    coverage: { level: "none", answerGenerationAllowed: false },
    results: [],
    projection: null,
    readingPath: null,
    indexDigest: index.indexDigest
  }, 200, "public, max-age=60, stale-while-revalidate=300");
  const top = ranked[0];
  const exact = top.evidence.some((x) => x.type.startsWith("exact_"));
  const coverage = coverageFor(top.score, exact);
  const mode = requestedMode === "auto" ? coverage === "exact" || coverage === "strong" ? "focused" : "overview" : requestedMode;
  const selected = selectFragments(mode, top.fragments, query);
  if (top.node.bookCode === "BOOK-7" && exact) {
    const support = relationshipsP.records.filter((r) => r.sourceNodeCode === top.node.nodeCode && r.locale === locale && r.targetPublished && r.includeInGrounding);
    for (const relationship of support) selected.push(...fragmentsP.records.filter((f) => f.nodeCode === relationship.targetNodeCode && f.locale === locale && (!f.questionScope || f.questionScope.some((q) => normalize(q) === normalize(query)))));
  }
  const localeAvailability = localeP.records.find((x) => x.nodeCode === top.node.nodeCode);
  const relationships = relationshipsP.records.filter((x) => x.locale === locale && x.sourceNodeCode === top.node.nodeCode);
  const steps = [{ type: "entry", nodeCode: top.node.nodeCode, locale, href: top.node.href, title: top.node.title }];
  const blockedContinuations = relationships.filter((x) => !x.targetPublished).map((x) => ({
    targetNodeCode: x.targetNodeCode,
    type: x.type,
    reason: "target_not_published_in_requested_locale",
    navigable: false
  }));
  const localeSwitches = (localeAvailability?.locales || []).filter((x) => x.available && x.locale !== locale).map((x) => ({
    nodeCode: top.node.nodeCode,
    locale: x.locale,
    available: true
  }));
  return jsonResponse({
    ok: true,
    query: { text: query, locale, mode: requestedMode },
    coverage: { level: coverage, score: top.score, answerGenerationAllowed: false },
    results: ranked.slice(0, 5).map((x) => ({ nodeCode: x.node.nodeCode, locale, title: x.node.title, summary: x.node.summary, href: x.node.href, score: x.score })),
    projection: { nodeCode: top.node.nodeCode, locale, mode, fragments: selected.map(({ fragmentCode, ordinal, kind, text: text5, digest, ...metadata }) => ({ fragmentCode, ordinal, kind, text: text5, digest, ...metadata, ...metadata.bookId === "BOOK-7" ? { scopeMatch: exact, bookCode: "BOOK-7", partCode: "PART-14" } : {} })) },
    readingPath: { steps, localeSwitches, blockedContinuations },
    indexDigest: index.indexDigest
  }, 200, "public, max-age=60, stale-while-revalidate=300");
}

// functions/knowledge-runtime/manuscript-source-runtime.js
var MAX_RESULTS = 4;
var MAX_EXCERPT_CHARS = 1200;
var MAX_TOTAL_EXCERPT_CHARS = 3600;
var clean8 = (value) => String(value ?? "").normalize("NFKC").replace(/\u000c/g, "\n").replace(/[\t ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
var normalized = (value) => clean8(value).toLocaleLowerCase();
function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
function queryTerms(value) {
  const input = normalized(value);
  const latin = input.match(/[a-z0-9][a-z0-9-]{1,}/g) || [];
  const cjkRuns = input.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/gu) || [];
  const cjk = [];
  for (const run of cjkRuns) {
    if (run.length <= 8) cjk.push(run);
    const max = Math.min(run.length - 1, 24);
    for (let index = 0; index < max; index += 1) cjk.push(run.slice(index, index + 2));
  }
  return unique([...latin, ...cjk]).slice(0, 40);
}
function correctionRows(sectionCode, corrections) {
  return (corrections?.records || []).filter(
    (record) => record.sectionCode === sectionCode && String(record.status || "").toUpperCase() === "APPROVED"
  );
}
function correctedRecord(record, corrections) {
  const rows3 = correctionRows(record.sectionCode, corrections);
  if (!rows3.length) return { ...record, editorialCorrections: [] };
  let heading = String(record.heading ?? "");
  let text5 = String(record.text ?? "");
  for (const row of rows3) {
    if (row.field === "heading" && (!row.rawValue || heading === row.rawValue)) {
      heading = row.correctedValue || heading;
    }
    const from = row.textReplacement?.from;
    const to = row.textReplacement?.to;
    if (from && to) text5 = text5.split(from).join(to);
  }
  return {
    ...record,
    heading,
    text: text5,
    editorialCorrections: rows3.map((row) => ({
      correctionCode: row.correctionCode,
      status: "APPROVED",
      rawSourcePreserved: row.rawSourcePreserved !== false
    }))
  };
}
function scoreRecord(record, query, terms3) {
  if (record.retrievalEligible === false || record.segmentType === "FRONT_MATTER") return 0;
  const heading = normalized(record.heading);
  const text5 = normalized(record.text);
  const q = normalized(query);
  let score = 0;
  if (q && heading.includes(q)) score += 1200;
  if (q && text5.includes(q)) score += 800;
  for (const term of terms3) {
    if (heading.includes(term)) score += 70;
    if (text5.includes(term)) score += 12;
  }
  return score;
}
function excerptFor(record, query, terms3, maximum = MAX_EXCERPT_CHARS) {
  const text5 = clean8(record.text);
  if (text5.length <= maximum) return text5;
  let anchor = text5.indexOf(clean8(query));
  if (anchor < 0) {
    for (const term of terms3) {
      anchor = text5.toLocaleLowerCase().indexOf(term);
      if (anchor >= 0) break;
    }
  }
  if (anchor < 0) anchor = 0;
  const before = Math.floor(maximum * 0.35);
  let start = Math.max(0, anchor - before);
  let end = Math.min(text5.length, start + maximum);
  start = Math.max(0, end - maximum);
  const prefix = start > 0 ? "\u2026" : "";
  const suffix = end < text5.length ? "\u2026" : "";
  return `${prefix}${text5.slice(start, end).trim()}${suffix}`;
}
function bindingFor(sectionCode, bindings) {
  const rows3 = (bindings?.records || []).filter(
    (record) => record.sectionCode === sectionCode && String(record.status || record.authorityStatus || "").toUpperCase() === "APPROVED"
  );
  if (!rows3.length) return { status: "PENDING", nodeCodes: [] };
  return {
    status: "APPROVED",
    nodeCodes: unique(rows3.map((row) => row.nodeCode)),
    mappingCodes: unique(rows3.map((row) => row.mappingCode))
  };
}
function searchManuscriptCorpus({
  corpus,
  source,
  bindings = { records: [] },
  corrections = { records: [] },
  query,
  maximumResults = MAX_RESULTS,
  maximumExcerptChars = MAX_EXCERPT_CHARS,
  maximumTotalExcerptChars = MAX_TOTAL_EXCERPT_CHARS
}) {
  if (!corpus || !Array.isArray(corpus.records)) return [];
  const terms3 = queryTerms(query);
  const ranked = corpus.records.map((rawRecord) => {
    const record = correctedRecord(rawRecord, corrections);
    return { record, score: scoreRecord(record, query, terms3) };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.record.sequence - b.record.sequence);
  const results = [];
  let totalChars = 0;
  for (const item of ranked) {
    if (results.length >= maximumResults || totalChars >= maximumTotalExcerptChars) break;
    const allowance = Math.min(maximumExcerptChars, maximumTotalExcerptChars - totalChars);
    if (allowance <= 0) break;
    const excerpt = excerptFor(item.record, query, terms3, allowance);
    totalChars += excerpt.length;
    results.push({
      sourceType: "COMPLETED_MANUSCRIPT",
      sourceCode: source.sourceCode,
      bookCode: source.bookCode,
      bookTitle: source.title,
      bookTitleEn: source.titleEn,
      bookRoute: source.bookRoute,
      partCode: item.record.partCode,
      sectionCode: item.record.sectionCode,
      heading: item.record.heading,
      pageRange: { start: item.record.startPage, end: item.record.endPage },
      sourceDigest: item.record.textSha256,
      sourceMaterializationDigest: item.record.sourceTextSha256 || item.record.textSha256,
      humanReadabilityStatus: item.record.reviewStatus || source.humanReadabilityStatus || "UNKNOWN",
      corpusAuthority: source.activeCorpusAuthority || source.sourceAuthority,
      score: item.score,
      excerpt,
      canonicalBinding: bindingFor(item.record.sectionCode, bindings),
      editorialCorrections: item.record.editorialCorrections,
      publicationState: "SOURCE_NOT_CANONICAL_ARTICLE"
    });
  }
  return results;
}
async function loadR2RetrievalCorpus(binding, source) {
  if (!binding?.get) {
    const error = new Error("MANUSCRIPT_SOURCE_STORAGE_UNAVAILABLE");
    error.code = "MANUSCRIPT_SOURCE_STORAGE_UNAVAILABLE";
    throw error;
  }
  const object3 = await binding.get(source.r2ObjectKey);
  if (!object3?.body) {
    const error = new Error("MANUSCRIPT_RETRIEVAL_CORPUS_NOT_FOUND");
    error.code = "MANUSCRIPT_RETRIEVAL_CORPUS_NOT_FOUND";
    error.sourceCode = source.sourceCode;
    throw error;
  }
  const text5 = await new Response(object3.body).text();
  const actualBytesSha256 = [...new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text5))
  )].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  if (source.retrievalCorpusSha256 && actualBytesSha256 !== source.retrievalCorpusSha256) {
    const error = new Error("MANUSCRIPT_RETRIEVAL_CORPUS_BYTES_MISMATCH");
    error.code = "MANUSCRIPT_RETRIEVAL_CORPUS_BYTES_MISMATCH";
    throw error;
  }
  const corpus = JSON.parse(text5);
  if (corpus.bookCode !== source.bookCode || corpus.locale !== source.locale) {
    const error = new Error("MANUSCRIPT_RETRIEVAL_CORPUS_IDENTITY_MISMATCH");
    error.code = "MANUSCRIPT_RETRIEVAL_CORPUS_IDENTITY_MISMATCH";
    throw error;
  }
  if (corpus.sourceSha256 !== source.sourceSha256 || corpus.corpusSha256 !== source.corpusSha256) {
    const error = new Error("MANUSCRIPT_RETRIEVAL_CORPUS_SOURCE_MISMATCH");
    error.code = "MANUSCRIPT_RETRIEVAL_CORPUS_SOURCE_MISMATCH";
    throw error;
  }
  if (Number(corpus.recordCount) !== Number(source.recordCount)) {
    const error = new Error("MANUSCRIPT_RETRIEVAL_CORPUS_COUNT_MISMATCH");
    error.code = "MANUSCRIPT_RETRIEVAL_CORPUS_COUNT_MISMATCH";
    throw error;
  }
  return corpus;
}
var MANUSCRIPT_SOURCE_LIMITS = Object.freeze({
  maximumResults: MAX_RESULTS,
  maximumExcerptCharsPerResult: MAX_EXCERPT_CHARS,
  maximumTotalExcerptChars: MAX_TOTAL_EXCERPT_CHARS
});

// content/registry/runtime-position-48-v1.json
var runtime_position_48_v1_default = {
  schemaVersion: "PHI-OS-48-RUNTIME-POSITION-BACKBONE-v1.0.0",
  version: "1.0.0",
  status: "R1_STRUCTURAL_CANON_ACTIVE__SOURCE_DETAIL_TRANSCRIPTION_PENDING",
  owner: "content/registry/concepts.json",
  authority: {
    grammarOwner: "content/registry/concepts.json",
    principle: "16 Reality Grammar \xD7 3 Reality Domains = 48 runtime observation positions",
    positionIsNot: "civilization rank, deterministic stage, prediction, destiny timeline",
    realityPriority: "Observed reality can revise or reject any position correspondence."
  },
  domains: [
    {
      id: "P1",
      en: "Reality Formation",
      "zh-Hans": "\u73B0\u5B9E\u5F62\u6210",
      bookCode: "BOOK-1",
      phaseRange: "1-16",
      sourceContexts: [
        {
          id: "M1",
          en: "Physical",
          "zh-Hans": "\u7269\u7406"
        },
        {
          id: "M2",
          en: "Safety",
          "zh-Hans": "\u5B89\u5168"
        },
        {
          id: "M3",
          en: "Stability",
          "zh-Hans": "\u7A33\u5B9A"
        },
        {
          id: "M4",
          en: "Load & Scheduling",
          "zh-Hans": "\u8D1F\u8F7D\u4E0E\u8C03\u5EA6"
        }
      ]
    },
    {
      id: "P2",
      en: "Reality Runtime",
      "zh-Hans": "\u73B0\u5B9E\u8FD0\u884C",
      bookCode: "BOOK-2",
      phaseRange: "17-32",
      sourceContexts: [
        {
          id: "M5",
          en: "Interface",
          "zh-Hans": "\u63A5\u53E3"
        },
        {
          id: "M6",
          en: "Routing",
          "zh-Hans": "\u8DEF\u5F84"
        },
        {
          id: "M7",
          en: "Function",
          "zh-Hans": "\u529F\u80FD"
        },
        {
          id: "M8",
          en: "Runtime",
          "zh-Hans": "\u8FD0\u884C"
        }
      ]
    },
    {
      id: "P3",
      en: "Reality Continuity",
      "zh-Hans": "\u73B0\u5B9E\u7EF4\u6301",
      bookCode: "BOOK-3",
      phaseRange: "33-48",
      sourceContexts: [
        {
          id: "M9",
          en: "Modelling",
          "zh-Hans": "\u5EFA\u6A21"
        },
        {
          id: "M10",
          en: "Calibration",
          "zh-Hans": "\u6821\u51C6"
        },
        {
          id: "M11",
          en: "Topology",
          "zh-Hans": "\u62D3\u6251"
        },
        {
          id: "M12",
          en: "Governance",
          "zh-Hans": "\u6CBB\u7406"
        }
      ]
    }
  ],
  lockPositions: [
    "RP-08",
    "RP-16",
    "RP-24",
    "RP-32",
    "RP-40",
    "RP-48"
  ],
  positions: [
    {
      id: "RP-01",
      phase: 1,
      grammarId: "G1",
      grammarKey: "difference",
      grammar: {
        en: "Difference",
        "zh-Hans": "\u5DEE\u5F02"
      },
      arc: "FORMATION",
      realityDomainId: "P1",
      realityDomain: {
        en: "Reality Formation",
        "zh-Hans": "\u73B0\u5B9E\u5F62\u6210"
      },
      bookAlignment: {
        bookCode: "BOOK-1",
        titleZh: "\u4E16\u754C\u5982\u4F55\u5F62\u6210"
      },
      sourceContext: {
        id: "M1",
        en: "Physical",
        "zh-Hans": "\u7269\u7406"
      },
      accessState: "KEY",
      crossTheme: "Cross of the 4 Ways",
      shortLabel: {
        en: "Difference \xB7 Physical",
        "zh-Hans": "\u5DEE\u5F02 \xB7 \u7269\u7406"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-02",
      phase: 2,
      grammarId: "G2",
      grammarKey: "constraint",
      grammar: {
        en: "Constraint",
        "zh-Hans": "\u7EA6\u675F"
      },
      arc: "FORMATION",
      realityDomainId: "P1",
      realityDomain: {
        en: "Reality Formation",
        "zh-Hans": "\u73B0\u5B9E\u5F62\u6210"
      },
      bookAlignment: {
        bookCode: "BOOK-1",
        titleZh: "\u4E16\u754C\u5982\u4F55\u5F62\u6210"
      },
      sourceContext: {
        id: "M1",
        en: "Physical",
        "zh-Hans": "\u7269\u7406"
      },
      accessState: "KEY",
      crossTheme: "Cross of the Unexpected",
      shortLabel: {
        en: "Constraint \xB7 Physical",
        "zh-Hans": "\u7EA6\u675F \xB7 \u7269\u7406"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-03",
      phase: 3,
      grammarId: "G3",
      grammarKey: "structure",
      grammar: {
        en: "Structure",
        "zh-Hans": "\u7ED3\u6784"
      },
      arc: "FORMATION",
      realityDomainId: "P1",
      realityDomain: {
        en: "Reality Formation",
        "zh-Hans": "\u73B0\u5B9E\u5F62\u6210"
      },
      bookAlignment: {
        bookCode: "BOOK-1",
        titleZh: "\u4E16\u754C\u5982\u4F55\u5F62\u6210"
      },
      sourceContext: {
        id: "M1",
        en: "Physical",
        "zh-Hans": "\u7269\u7406"
      },
      accessState: "KEY",
      crossTheme: "Cross of Laws",
      shortLabel: {
        en: "Structure \xB7 Physical",
        "zh-Hans": "\u7ED3\u6784 \xB7 \u7269\u7406"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-04",
      phase: 4,
      grammarId: "G4",
      grammarKey: "field",
      grammar: {
        en: "Field",
        "zh-Hans": "\u573A\u57DF"
      },
      arc: "FORMATION",
      realityDomainId: "P1",
      realityDomain: {
        en: "Reality Formation",
        "zh-Hans": "\u73B0\u5B9E\u5F62\u6210"
      },
      bookAlignment: {
        bookCode: "BOOK-1",
        titleZh: "\u4E16\u754C\u5982\u4F55\u5F62\u6210"
      },
      sourceContext: {
        id: "M1",
        en: "Physical",
        "zh-Hans": "\u7269\u7406"
      },
      accessState: "KEY",
      crossTheme: "Cross of Maya",
      shortLabel: {
        en: "Field \xB7 Physical",
        "zh-Hans": "\u573A\u57DF \xB7 \u7269\u7406"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-05",
      phase: 5,
      grammarId: "G5",
      grammarKey: "activation",
      grammar: {
        en: "Activation",
        "zh-Hans": "\u6FC0\u6D3B"
      },
      arc: "ACTIVATION",
      realityDomainId: "P1",
      realityDomain: {
        en: "Reality Formation",
        "zh-Hans": "\u73B0\u5B9E\u5F62\u6210"
      },
      bookAlignment: {
        bookCode: "BOOK-1",
        titleZh: "\u4E16\u754C\u5982\u4F55\u5F62\u6210"
      },
      sourceContext: {
        id: "M2",
        en: "Safety",
        "zh-Hans": "\u5B89\u5168"
      },
      accessState: "KEY",
      crossTheme: "Cross of Penetration",
      shortLabel: {
        en: "Activation \xB7 Safety",
        "zh-Hans": "\u6FC0\u6D3B \xB7 \u5B89\u5168"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-06",
      phase: 6,
      grammarId: "G6",
      grammarKey: "carrier",
      grammar: {
        en: "Carrier",
        "zh-Hans": "\u8F7D\u4F53"
      },
      arc: "ACTIVATION",
      realityDomainId: "P1",
      realityDomain: {
        en: "Reality Formation",
        "zh-Hans": "\u73B0\u5B9E\u5F62\u6210"
      },
      bookAlignment: {
        bookCode: "BOOK-1",
        titleZh: "\u4E16\u754C\u5982\u4F55\u5F62\u6210"
      },
      sourceContext: {
        id: "M2",
        en: "Safety",
        "zh-Hans": "\u5B89\u5168"
      },
      accessState: "KEY",
      crossTheme: "Cross of Tension",
      shortLabel: {
        en: "Carrier \xB7 Safety",
        "zh-Hans": "\u8F7D\u4F53 \xB7 \u5B89\u5168"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-07",
      phase: 7,
      grammarId: "G7",
      grammarKey: "runtime",
      grammar: {
        en: "Runtime",
        "zh-Hans": "\u8FD0\u884C"
      },
      arc: "ACTIVATION",
      realityDomainId: "P1",
      realityDomain: {
        en: "Reality Formation",
        "zh-Hans": "\u73B0\u5B9E\u5F62\u6210"
      },
      bookAlignment: {
        bookCode: "BOOK-1",
        titleZh: "\u4E16\u754C\u5982\u4F55\u5F62\u6210"
      },
      sourceContext: {
        id: "M2",
        en: "Safety",
        "zh-Hans": "\u5B89\u5168"
      },
      accessState: "KEY",
      crossTheme: "Cross of Service",
      shortLabel: {
        en: "Runtime \xB7 Safety",
        "zh-Hans": "\u8FD0\u884C \xB7 \u5B89\u5168"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-08",
      phase: 8,
      grammarId: "G8",
      grammarKey: "experience",
      grammar: {
        en: "Experience",
        "zh-Hans": "\u4F53\u9A8C"
      },
      arc: "INTERNALIZATION",
      realityDomainId: "P1",
      realityDomain: {
        en: "Reality Formation",
        "zh-Hans": "\u73B0\u5B9E\u5F62\u6210"
      },
      bookAlignment: {
        bookCode: "BOOK-1",
        titleZh: "\u4E16\u754C\u5982\u4F55\u5F62\u6210"
      },
      sourceContext: {
        id: "M2",
        en: "Safety",
        "zh-Hans": "\u5B89\u5168"
      },
      accessState: "LOCK",
      crossTheme: "Cross of the Vessel of Love",
      shortLabel: {
        en: "Experience \xB7 Safety",
        "zh-Hans": "\u4F53\u9A8C \xB7 \u5B89\u5168"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-09",
      phase: 9,
      grammarId: "G9",
      grammarKey: "expression",
      grammar: {
        en: "Expression",
        "zh-Hans": "\u8868\u8FBE"
      },
      arc: "INTERNALIZATION",
      realityDomainId: "P1",
      realityDomain: {
        en: "Reality Formation",
        "zh-Hans": "\u73B0\u5B9E\u5F62\u6210"
      },
      bookAlignment: {
        bookCode: "BOOK-1",
        titleZh: "\u4E16\u754C\u5982\u4F55\u5F62\u6210"
      },
      sourceContext: {
        id: "M3",
        en: "Stability",
        "zh-Hans": "\u7A33\u5B9A"
      },
      accessState: "KEY",
      crossTheme: "Cross of Eden",
      shortLabel: {
        en: "Expression \xB7 Stability",
        "zh-Hans": "\u8868\u8FBE \xB7 \u7A33\u5B9A"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-10",
      phase: 10,
      grammarId: "G10",
      grammarKey: "agency",
      grammar: {
        en: "Agency",
        "zh-Hans": "\u884C\u52A8"
      },
      arc: "INTERNALIZATION",
      realityDomainId: "P1",
      realityDomain: {
        en: "Reality Formation",
        "zh-Hans": "\u73B0\u5B9E\u5F62\u6210"
      },
      bookAlignment: {
        bookCode: "BOOK-1",
        titleZh: "\u4E16\u754C\u5982\u4F55\u5F62\u6210"
      },
      sourceContext: {
        id: "M3",
        en: "Stability",
        "zh-Hans": "\u7A33\u5B9A"
      },
      accessState: "KEY",
      crossTheme: "Cross of Rulership",
      shortLabel: {
        en: "Agency \xB7 Stability",
        "zh-Hans": "\u884C\u52A8 \xB7 \u7A33\u5B9A"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-11",
      phase: 11,
      grammarId: "G11",
      grammarKey: "identity",
      grammar: {
        en: "Identity",
        "zh-Hans": "\u8EAB\u4EFD"
      },
      arc: "INTERNALIZATION",
      realityDomainId: "P1",
      realityDomain: {
        en: "Reality Formation",
        "zh-Hans": "\u73B0\u5B9E\u5F62\u6210"
      },
      bookAlignment: {
        bookCode: "BOOK-1",
        titleZh: "\u4E16\u754C\u5982\u4F55\u5F62\u6210"
      },
      sourceContext: {
        id: "M3",
        en: "Stability",
        "zh-Hans": "\u7A33\u5B9A"
      },
      accessState: "KEY",
      crossTheme: "Cross of Consciousness",
      shortLabel: {
        en: "Identity \xB7 Stability",
        "zh-Hans": "\u8EAB\u4EFD \xB7 \u7A33\u5B9A"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-12",
      phase: 12,
      grammarId: "G12",
      grammarKey: "feedback",
      grammar: {
        en: "Feedback",
        "zh-Hans": "\u53CD\u9988"
      },
      arc: "INTERNALIZATION",
      realityDomainId: "P1",
      realityDomain: {
        en: "Reality Formation",
        "zh-Hans": "\u73B0\u5B9E\u5F62\u6210"
      },
      bookAlignment: {
        bookCode: "BOOK-1",
        titleZh: "\u4E16\u754C\u5982\u4F55\u5F62\u6210"
      },
      sourceContext: {
        id: "M3",
        en: "Stability",
        "zh-Hans": "\u7A33\u5B9A"
      },
      accessState: "KEY",
      crossTheme: "Cross of Planning",
      shortLabel: {
        en: "Feedback \xB7 Stability",
        "zh-Hans": "\u53CD\u9988 \xB7 \u7A33\u5B9A"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-13",
      phase: 13,
      grammarId: "G13",
      grammarKey: "settlement",
      grammar: {
        en: "Settlement",
        "zh-Hans": "\u6C89\u6DC0"
      },
      arc: "REORGANIZATION",
      realityDomainId: "P1",
      realityDomain: {
        en: "Reality Formation",
        "zh-Hans": "\u73B0\u5B9E\u5F62\u6210"
      },
      bookAlignment: {
        bookCode: "BOOK-1",
        titleZh: "\u4E16\u754C\u5982\u4F55\u5F62\u6210"
      },
      sourceContext: {
        id: "M4",
        en: "Load & Scheduling",
        "zh-Hans": "\u8D1F\u8F7D\u4E0E\u8C03\u5EA6"
      },
      accessState: "KEY",
      crossTheme: "Cross of the Sleeping Phoenix",
      shortLabel: {
        en: "Settlement \xB7 Load & Scheduling",
        "zh-Hans": "\u6C89\u6DC0 \xB7 \u8D1F\u8F7D\u4E0E\u8C03\u5EA6"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-14",
      phase: 14,
      grammarId: "G14",
      grammarKey: "reconfiguration",
      grammar: {
        en: "Reconfiguration",
        "zh-Hans": "\u91CD\u7EC4"
      },
      arc: "REORGANIZATION",
      realityDomainId: "P1",
      realityDomain: {
        en: "Reality Formation",
        "zh-Hans": "\u73B0\u5B9E\u5F62\u6210"
      },
      bookAlignment: {
        bookCode: "BOOK-1",
        titleZh: "\u4E16\u754C\u5982\u4F55\u5F62\u6210"
      },
      sourceContext: {
        id: "M4",
        en: "Load & Scheduling",
        "zh-Hans": "\u8D1F\u8F7D\u4E0E\u8C03\u5EA6"
      },
      accessState: "KEY",
      crossTheme: "Cross of Contagion",
      shortLabel: {
        en: "Reconfiguration \xB7 Load & Scheduling",
        "zh-Hans": "\u91CD\u7EC4 \xB7 \u8D1F\u8F7D\u4E0E\u8C03\u5EA6"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-15",
      phase: 15,
      grammarId: "G15",
      grammarKey: "emergence",
      grammar: {
        en: "Emergence",
        "zh-Hans": "\u6D8C\u73B0"
      },
      arc: "REORGANIZATION",
      realityDomainId: "P1",
      realityDomain: {
        en: "Reality Formation",
        "zh-Hans": "\u73B0\u5B9E\u5F62\u6210"
      },
      bookAlignment: {
        bookCode: "BOOK-1",
        titleZh: "\u4E16\u754C\u5982\u4F55\u5F62\u6210"
      },
      sourceContext: {
        id: "M4",
        en: "Load & Scheduling",
        "zh-Hans": "\u8D1F\u8F7D\u4E0E\u8C03\u5EA6"
      },
      accessState: "KEY",
      crossTheme: "Cross of Explanation",
      shortLabel: {
        en: "Emergence \xB7 Load & Scheduling",
        "zh-Hans": "\u6D8C\u73B0 \xB7 \u8D1F\u8F7D\u4E0E\u8C03\u5EA6"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-16",
      phase: 16,
      grammarId: "G16",
      grammarKey: "continuity",
      grammar: {
        en: "Continuity",
        "zh-Hans": "\u6301\u7EED"
      },
      arc: "REORGANIZATION",
      realityDomainId: "P1",
      realityDomain: {
        en: "Reality Formation",
        "zh-Hans": "\u73B0\u5B9E\u5F62\u6210"
      },
      bookAlignment: {
        bookCode: "BOOK-1",
        titleZh: "\u4E16\u754C\u5982\u4F55\u5F62\u6210"
      },
      sourceContext: {
        id: "M4",
        en: "Load & Scheduling",
        "zh-Hans": "\u8D1F\u8F7D\u4E0E\u8C03\u5EA6"
      },
      accessState: "LOCK",
      crossTheme: "Cross of the Sphinx",
      shortLabel: {
        en: "Continuity \xB7 Load & Scheduling",
        "zh-Hans": "\u6301\u7EED \xB7 \u8D1F\u8F7D\u4E0E\u8C03\u5EA6"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-17",
      phase: 17,
      grammarId: "G1",
      grammarKey: "difference",
      grammar: {
        en: "Difference",
        "zh-Hans": "\u5DEE\u5F02"
      },
      arc: "FORMATION",
      realityDomainId: "P2",
      realityDomain: {
        en: "Reality Runtime",
        "zh-Hans": "\u73B0\u5B9E\u8FD0\u884C"
      },
      bookAlignment: {
        bookCode: "BOOK-2",
        titleZh: "\u4E16\u754C\u5982\u4F55\u8FD0\u884C"
      },
      sourceContext: {
        id: "M5",
        en: "Interface",
        "zh-Hans": "\u63A5\u53E3"
      },
      accessState: "KEY",
      crossTheme: "Cross of the 4 Ways",
      shortLabel: {
        en: "Difference \xB7 Interface",
        "zh-Hans": "\u5DEE\u5F02 \xB7 \u63A5\u53E3"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-18",
      phase: 18,
      grammarId: "G2",
      grammarKey: "constraint",
      grammar: {
        en: "Constraint",
        "zh-Hans": "\u7EA6\u675F"
      },
      arc: "FORMATION",
      realityDomainId: "P2",
      realityDomain: {
        en: "Reality Runtime",
        "zh-Hans": "\u73B0\u5B9E\u8FD0\u884C"
      },
      bookAlignment: {
        bookCode: "BOOK-2",
        titleZh: "\u4E16\u754C\u5982\u4F55\u8FD0\u884C"
      },
      sourceContext: {
        id: "M5",
        en: "Interface",
        "zh-Hans": "\u63A5\u53E3"
      },
      accessState: "KEY",
      crossTheme: "Cross of the Unexpected",
      shortLabel: {
        en: "Constraint \xB7 Interface",
        "zh-Hans": "\u7EA6\u675F \xB7 \u63A5\u53E3"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-19",
      phase: 19,
      grammarId: "G3",
      grammarKey: "structure",
      grammar: {
        en: "Structure",
        "zh-Hans": "\u7ED3\u6784"
      },
      arc: "FORMATION",
      realityDomainId: "P2",
      realityDomain: {
        en: "Reality Runtime",
        "zh-Hans": "\u73B0\u5B9E\u8FD0\u884C"
      },
      bookAlignment: {
        bookCode: "BOOK-2",
        titleZh: "\u4E16\u754C\u5982\u4F55\u8FD0\u884C"
      },
      sourceContext: {
        id: "M5",
        en: "Interface",
        "zh-Hans": "\u63A5\u53E3"
      },
      accessState: "KEY",
      crossTheme: "Cross of Laws",
      shortLabel: {
        en: "Structure \xB7 Interface",
        "zh-Hans": "\u7ED3\u6784 \xB7 \u63A5\u53E3"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-20",
      phase: 20,
      grammarId: "G4",
      grammarKey: "field",
      grammar: {
        en: "Field",
        "zh-Hans": "\u573A\u57DF"
      },
      arc: "FORMATION",
      realityDomainId: "P2",
      realityDomain: {
        en: "Reality Runtime",
        "zh-Hans": "\u73B0\u5B9E\u8FD0\u884C"
      },
      bookAlignment: {
        bookCode: "BOOK-2",
        titleZh: "\u4E16\u754C\u5982\u4F55\u8FD0\u884C"
      },
      sourceContext: {
        id: "M5",
        en: "Interface",
        "zh-Hans": "\u63A5\u53E3"
      },
      accessState: "KEY",
      crossTheme: "Cross of Maya",
      shortLabel: {
        en: "Field \xB7 Interface",
        "zh-Hans": "\u573A\u57DF \xB7 \u63A5\u53E3"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-21",
      phase: 21,
      grammarId: "G5",
      grammarKey: "activation",
      grammar: {
        en: "Activation",
        "zh-Hans": "\u6FC0\u6D3B"
      },
      arc: "ACTIVATION",
      realityDomainId: "P2",
      realityDomain: {
        en: "Reality Runtime",
        "zh-Hans": "\u73B0\u5B9E\u8FD0\u884C"
      },
      bookAlignment: {
        bookCode: "BOOK-2",
        titleZh: "\u4E16\u754C\u5982\u4F55\u8FD0\u884C"
      },
      sourceContext: {
        id: "M6",
        en: "Routing",
        "zh-Hans": "\u8DEF\u5F84"
      },
      accessState: "KEY",
      crossTheme: "Cross of Penetration",
      shortLabel: {
        en: "Activation \xB7 Routing",
        "zh-Hans": "\u6FC0\u6D3B \xB7 \u8DEF\u5F84"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-22",
      phase: 22,
      grammarId: "G6",
      grammarKey: "carrier",
      grammar: {
        en: "Carrier",
        "zh-Hans": "\u8F7D\u4F53"
      },
      arc: "ACTIVATION",
      realityDomainId: "P2",
      realityDomain: {
        en: "Reality Runtime",
        "zh-Hans": "\u73B0\u5B9E\u8FD0\u884C"
      },
      bookAlignment: {
        bookCode: "BOOK-2",
        titleZh: "\u4E16\u754C\u5982\u4F55\u8FD0\u884C"
      },
      sourceContext: {
        id: "M6",
        en: "Routing",
        "zh-Hans": "\u8DEF\u5F84"
      },
      accessState: "KEY",
      crossTheme: "Cross of Tension",
      shortLabel: {
        en: "Carrier \xB7 Routing",
        "zh-Hans": "\u8F7D\u4F53 \xB7 \u8DEF\u5F84"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-23",
      phase: 23,
      grammarId: "G7",
      grammarKey: "runtime",
      grammar: {
        en: "Runtime",
        "zh-Hans": "\u8FD0\u884C"
      },
      arc: "ACTIVATION",
      realityDomainId: "P2",
      realityDomain: {
        en: "Reality Runtime",
        "zh-Hans": "\u73B0\u5B9E\u8FD0\u884C"
      },
      bookAlignment: {
        bookCode: "BOOK-2",
        titleZh: "\u4E16\u754C\u5982\u4F55\u8FD0\u884C"
      },
      sourceContext: {
        id: "M6",
        en: "Routing",
        "zh-Hans": "\u8DEF\u5F84"
      },
      accessState: "KEY",
      crossTheme: "Cross of Service",
      shortLabel: {
        en: "Runtime \xB7 Routing",
        "zh-Hans": "\u8FD0\u884C \xB7 \u8DEF\u5F84"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-24",
      phase: 24,
      grammarId: "G8",
      grammarKey: "experience",
      grammar: {
        en: "Experience",
        "zh-Hans": "\u4F53\u9A8C"
      },
      arc: "INTERNALIZATION",
      realityDomainId: "P2",
      realityDomain: {
        en: "Reality Runtime",
        "zh-Hans": "\u73B0\u5B9E\u8FD0\u884C"
      },
      bookAlignment: {
        bookCode: "BOOK-2",
        titleZh: "\u4E16\u754C\u5982\u4F55\u8FD0\u884C"
      },
      sourceContext: {
        id: "M6",
        en: "Routing",
        "zh-Hans": "\u8DEF\u5F84"
      },
      accessState: "LOCK",
      crossTheme: "Cross of the Vessel of Love",
      shortLabel: {
        en: "Experience \xB7 Routing",
        "zh-Hans": "\u4F53\u9A8C \xB7 \u8DEF\u5F84"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-25",
      phase: 25,
      grammarId: "G9",
      grammarKey: "expression",
      grammar: {
        en: "Expression",
        "zh-Hans": "\u8868\u8FBE"
      },
      arc: "INTERNALIZATION",
      realityDomainId: "P2",
      realityDomain: {
        en: "Reality Runtime",
        "zh-Hans": "\u73B0\u5B9E\u8FD0\u884C"
      },
      bookAlignment: {
        bookCode: "BOOK-2",
        titleZh: "\u4E16\u754C\u5982\u4F55\u8FD0\u884C"
      },
      sourceContext: {
        id: "M7",
        en: "Function",
        "zh-Hans": "\u529F\u80FD"
      },
      accessState: "KEY",
      crossTheme: "Cross of Eden",
      shortLabel: {
        en: "Expression \xB7 Function",
        "zh-Hans": "\u8868\u8FBE \xB7 \u529F\u80FD"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-26",
      phase: 26,
      grammarId: "G10",
      grammarKey: "agency",
      grammar: {
        en: "Agency",
        "zh-Hans": "\u884C\u52A8"
      },
      arc: "INTERNALIZATION",
      realityDomainId: "P2",
      realityDomain: {
        en: "Reality Runtime",
        "zh-Hans": "\u73B0\u5B9E\u8FD0\u884C"
      },
      bookAlignment: {
        bookCode: "BOOK-2",
        titleZh: "\u4E16\u754C\u5982\u4F55\u8FD0\u884C"
      },
      sourceContext: {
        id: "M7",
        en: "Function",
        "zh-Hans": "\u529F\u80FD"
      },
      accessState: "KEY",
      crossTheme: "Cross of Rulership",
      shortLabel: {
        en: "Agency \xB7 Function",
        "zh-Hans": "\u884C\u52A8 \xB7 \u529F\u80FD"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-27",
      phase: 27,
      grammarId: "G11",
      grammarKey: "identity",
      grammar: {
        en: "Identity",
        "zh-Hans": "\u8EAB\u4EFD"
      },
      arc: "INTERNALIZATION",
      realityDomainId: "P2",
      realityDomain: {
        en: "Reality Runtime",
        "zh-Hans": "\u73B0\u5B9E\u8FD0\u884C"
      },
      bookAlignment: {
        bookCode: "BOOK-2",
        titleZh: "\u4E16\u754C\u5982\u4F55\u8FD0\u884C"
      },
      sourceContext: {
        id: "M7",
        en: "Function",
        "zh-Hans": "\u529F\u80FD"
      },
      accessState: "KEY",
      crossTheme: "Cross of Consciousness",
      shortLabel: {
        en: "Identity \xB7 Function",
        "zh-Hans": "\u8EAB\u4EFD \xB7 \u529F\u80FD"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-28",
      phase: 28,
      grammarId: "G12",
      grammarKey: "feedback",
      grammar: {
        en: "Feedback",
        "zh-Hans": "\u53CD\u9988"
      },
      arc: "INTERNALIZATION",
      realityDomainId: "P2",
      realityDomain: {
        en: "Reality Runtime",
        "zh-Hans": "\u73B0\u5B9E\u8FD0\u884C"
      },
      bookAlignment: {
        bookCode: "BOOK-2",
        titleZh: "\u4E16\u754C\u5982\u4F55\u8FD0\u884C"
      },
      sourceContext: {
        id: "M7",
        en: "Function",
        "zh-Hans": "\u529F\u80FD"
      },
      accessState: "KEY",
      crossTheme: "Cross of Planning",
      shortLabel: {
        en: "Feedback \xB7 Function",
        "zh-Hans": "\u53CD\u9988 \xB7 \u529F\u80FD"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-29",
      phase: 29,
      grammarId: "G13",
      grammarKey: "settlement",
      grammar: {
        en: "Settlement",
        "zh-Hans": "\u6C89\u6DC0"
      },
      arc: "REORGANIZATION",
      realityDomainId: "P2",
      realityDomain: {
        en: "Reality Runtime",
        "zh-Hans": "\u73B0\u5B9E\u8FD0\u884C"
      },
      bookAlignment: {
        bookCode: "BOOK-2",
        titleZh: "\u4E16\u754C\u5982\u4F55\u8FD0\u884C"
      },
      sourceContext: {
        id: "M8",
        en: "Runtime",
        "zh-Hans": "\u8FD0\u884C"
      },
      accessState: "KEY",
      crossTheme: "Cross of the Sleeping Phoenix",
      shortLabel: {
        en: "Settlement \xB7 Runtime",
        "zh-Hans": "\u6C89\u6DC0 \xB7 \u8FD0\u884C"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-30",
      phase: 30,
      grammarId: "G14",
      grammarKey: "reconfiguration",
      grammar: {
        en: "Reconfiguration",
        "zh-Hans": "\u91CD\u7EC4"
      },
      arc: "REORGANIZATION",
      realityDomainId: "P2",
      realityDomain: {
        en: "Reality Runtime",
        "zh-Hans": "\u73B0\u5B9E\u8FD0\u884C"
      },
      bookAlignment: {
        bookCode: "BOOK-2",
        titleZh: "\u4E16\u754C\u5982\u4F55\u8FD0\u884C"
      },
      sourceContext: {
        id: "M8",
        en: "Runtime",
        "zh-Hans": "\u8FD0\u884C"
      },
      accessState: "KEY",
      crossTheme: "Cross of Contagion",
      shortLabel: {
        en: "Reconfiguration \xB7 Runtime",
        "zh-Hans": "\u91CD\u7EC4 \xB7 \u8FD0\u884C"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-31",
      phase: 31,
      grammarId: "G15",
      grammarKey: "emergence",
      grammar: {
        en: "Emergence",
        "zh-Hans": "\u6D8C\u73B0"
      },
      arc: "REORGANIZATION",
      realityDomainId: "P2",
      realityDomain: {
        en: "Reality Runtime",
        "zh-Hans": "\u73B0\u5B9E\u8FD0\u884C"
      },
      bookAlignment: {
        bookCode: "BOOK-2",
        titleZh: "\u4E16\u754C\u5982\u4F55\u8FD0\u884C"
      },
      sourceContext: {
        id: "M8",
        en: "Runtime",
        "zh-Hans": "\u8FD0\u884C"
      },
      accessState: "KEY",
      crossTheme: "Cross of Explanation",
      shortLabel: {
        en: "Emergence \xB7 Runtime",
        "zh-Hans": "\u6D8C\u73B0 \xB7 \u8FD0\u884C"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-32",
      phase: 32,
      grammarId: "G16",
      grammarKey: "continuity",
      grammar: {
        en: "Continuity",
        "zh-Hans": "\u6301\u7EED"
      },
      arc: "REORGANIZATION",
      realityDomainId: "P2",
      realityDomain: {
        en: "Reality Runtime",
        "zh-Hans": "\u73B0\u5B9E\u8FD0\u884C"
      },
      bookAlignment: {
        bookCode: "BOOK-2",
        titleZh: "\u4E16\u754C\u5982\u4F55\u8FD0\u884C"
      },
      sourceContext: {
        id: "M8",
        en: "Runtime",
        "zh-Hans": "\u8FD0\u884C"
      },
      accessState: "LOCK",
      crossTheme: "Cross of the Sphinx",
      shortLabel: {
        en: "Continuity \xB7 Runtime",
        "zh-Hans": "\u6301\u7EED \xB7 \u8FD0\u884C"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-33",
      phase: 33,
      grammarId: "G1",
      grammarKey: "difference",
      grammar: {
        en: "Difference",
        "zh-Hans": "\u5DEE\u5F02"
      },
      arc: "FORMATION",
      realityDomainId: "P3",
      realityDomain: {
        en: "Reality Continuity",
        "zh-Hans": "\u73B0\u5B9E\u7EF4\u6301"
      },
      bookAlignment: {
        bookCode: "BOOK-3",
        titleZh: "\u4E16\u754C\u5982\u4F55\u7EF4\u6301"
      },
      sourceContext: {
        id: "M9",
        en: "Modelling",
        "zh-Hans": "\u5EFA\u6A21"
      },
      accessState: "KEY",
      crossTheme: "Cross of the 4 Ways",
      shortLabel: {
        en: "Difference \xB7 Modelling",
        "zh-Hans": "\u5DEE\u5F02 \xB7 \u5EFA\u6A21"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-34",
      phase: 34,
      grammarId: "G2",
      grammarKey: "constraint",
      grammar: {
        en: "Constraint",
        "zh-Hans": "\u7EA6\u675F"
      },
      arc: "FORMATION",
      realityDomainId: "P3",
      realityDomain: {
        en: "Reality Continuity",
        "zh-Hans": "\u73B0\u5B9E\u7EF4\u6301"
      },
      bookAlignment: {
        bookCode: "BOOK-3",
        titleZh: "\u4E16\u754C\u5982\u4F55\u7EF4\u6301"
      },
      sourceContext: {
        id: "M9",
        en: "Modelling",
        "zh-Hans": "\u5EFA\u6A21"
      },
      accessState: "KEY",
      crossTheme: "Cross of the Unexpected",
      shortLabel: {
        en: "Constraint \xB7 Modelling",
        "zh-Hans": "\u7EA6\u675F \xB7 \u5EFA\u6A21"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-35",
      phase: 35,
      grammarId: "G3",
      grammarKey: "structure",
      grammar: {
        en: "Structure",
        "zh-Hans": "\u7ED3\u6784"
      },
      arc: "FORMATION",
      realityDomainId: "P3",
      realityDomain: {
        en: "Reality Continuity",
        "zh-Hans": "\u73B0\u5B9E\u7EF4\u6301"
      },
      bookAlignment: {
        bookCode: "BOOK-3",
        titleZh: "\u4E16\u754C\u5982\u4F55\u7EF4\u6301"
      },
      sourceContext: {
        id: "M9",
        en: "Modelling",
        "zh-Hans": "\u5EFA\u6A21"
      },
      accessState: "KEY",
      crossTheme: "Cross of Laws",
      shortLabel: {
        en: "Structure \xB7 Modelling",
        "zh-Hans": "\u7ED3\u6784 \xB7 \u5EFA\u6A21"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-36",
      phase: 36,
      grammarId: "G4",
      grammarKey: "field",
      grammar: {
        en: "Field",
        "zh-Hans": "\u573A\u57DF"
      },
      arc: "FORMATION",
      realityDomainId: "P3",
      realityDomain: {
        en: "Reality Continuity",
        "zh-Hans": "\u73B0\u5B9E\u7EF4\u6301"
      },
      bookAlignment: {
        bookCode: "BOOK-3",
        titleZh: "\u4E16\u754C\u5982\u4F55\u7EF4\u6301"
      },
      sourceContext: {
        id: "M9",
        en: "Modelling",
        "zh-Hans": "\u5EFA\u6A21"
      },
      accessState: "KEY",
      crossTheme: "Cross of Maya",
      shortLabel: {
        en: "Field \xB7 Modelling",
        "zh-Hans": "\u573A\u57DF \xB7 \u5EFA\u6A21"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-37",
      phase: 37,
      grammarId: "G5",
      grammarKey: "activation",
      grammar: {
        en: "Activation",
        "zh-Hans": "\u6FC0\u6D3B"
      },
      arc: "ACTIVATION",
      realityDomainId: "P3",
      realityDomain: {
        en: "Reality Continuity",
        "zh-Hans": "\u73B0\u5B9E\u7EF4\u6301"
      },
      bookAlignment: {
        bookCode: "BOOK-3",
        titleZh: "\u4E16\u754C\u5982\u4F55\u7EF4\u6301"
      },
      sourceContext: {
        id: "M10",
        en: "Calibration",
        "zh-Hans": "\u6821\u51C6"
      },
      accessState: "KEY",
      crossTheme: "Cross of Penetration",
      shortLabel: {
        en: "Activation \xB7 Calibration",
        "zh-Hans": "\u6FC0\u6D3B \xB7 \u6821\u51C6"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-38",
      phase: 38,
      grammarId: "G6",
      grammarKey: "carrier",
      grammar: {
        en: "Carrier",
        "zh-Hans": "\u8F7D\u4F53"
      },
      arc: "ACTIVATION",
      realityDomainId: "P3",
      realityDomain: {
        en: "Reality Continuity",
        "zh-Hans": "\u73B0\u5B9E\u7EF4\u6301"
      },
      bookAlignment: {
        bookCode: "BOOK-3",
        titleZh: "\u4E16\u754C\u5982\u4F55\u7EF4\u6301"
      },
      sourceContext: {
        id: "M10",
        en: "Calibration",
        "zh-Hans": "\u6821\u51C6"
      },
      accessState: "KEY",
      crossTheme: "Cross of Tension",
      shortLabel: {
        en: "Carrier \xB7 Calibration",
        "zh-Hans": "\u8F7D\u4F53 \xB7 \u6821\u51C6"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-39",
      phase: 39,
      grammarId: "G7",
      grammarKey: "runtime",
      grammar: {
        en: "Runtime",
        "zh-Hans": "\u8FD0\u884C"
      },
      arc: "ACTIVATION",
      realityDomainId: "P3",
      realityDomain: {
        en: "Reality Continuity",
        "zh-Hans": "\u73B0\u5B9E\u7EF4\u6301"
      },
      bookAlignment: {
        bookCode: "BOOK-3",
        titleZh: "\u4E16\u754C\u5982\u4F55\u7EF4\u6301"
      },
      sourceContext: {
        id: "M10",
        en: "Calibration",
        "zh-Hans": "\u6821\u51C6"
      },
      accessState: "KEY",
      crossTheme: "Cross of Service",
      shortLabel: {
        en: "Runtime \xB7 Calibration",
        "zh-Hans": "\u8FD0\u884C \xB7 \u6821\u51C6"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-40",
      phase: 40,
      grammarId: "G8",
      grammarKey: "experience",
      grammar: {
        en: "Experience",
        "zh-Hans": "\u4F53\u9A8C"
      },
      arc: "INTERNALIZATION",
      realityDomainId: "P3",
      realityDomain: {
        en: "Reality Continuity",
        "zh-Hans": "\u73B0\u5B9E\u7EF4\u6301"
      },
      bookAlignment: {
        bookCode: "BOOK-3",
        titleZh: "\u4E16\u754C\u5982\u4F55\u7EF4\u6301"
      },
      sourceContext: {
        id: "M10",
        en: "Calibration",
        "zh-Hans": "\u6821\u51C6"
      },
      accessState: "LOCK",
      crossTheme: "Cross of the Vessel of Love",
      shortLabel: {
        en: "Experience \xB7 Calibration",
        "zh-Hans": "\u4F53\u9A8C \xB7 \u6821\u51C6"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-41",
      phase: 41,
      grammarId: "G9",
      grammarKey: "expression",
      grammar: {
        en: "Expression",
        "zh-Hans": "\u8868\u8FBE"
      },
      arc: "INTERNALIZATION",
      realityDomainId: "P3",
      realityDomain: {
        en: "Reality Continuity",
        "zh-Hans": "\u73B0\u5B9E\u7EF4\u6301"
      },
      bookAlignment: {
        bookCode: "BOOK-3",
        titleZh: "\u4E16\u754C\u5982\u4F55\u7EF4\u6301"
      },
      sourceContext: {
        id: "M11",
        en: "Topology",
        "zh-Hans": "\u62D3\u6251"
      },
      accessState: "KEY",
      crossTheme: "Cross of Eden",
      shortLabel: {
        en: "Expression \xB7 Topology",
        "zh-Hans": "\u8868\u8FBE \xB7 \u62D3\u6251"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-42",
      phase: 42,
      grammarId: "G10",
      grammarKey: "agency",
      grammar: {
        en: "Agency",
        "zh-Hans": "\u884C\u52A8"
      },
      arc: "INTERNALIZATION",
      realityDomainId: "P3",
      realityDomain: {
        en: "Reality Continuity",
        "zh-Hans": "\u73B0\u5B9E\u7EF4\u6301"
      },
      bookAlignment: {
        bookCode: "BOOK-3",
        titleZh: "\u4E16\u754C\u5982\u4F55\u7EF4\u6301"
      },
      sourceContext: {
        id: "M11",
        en: "Topology",
        "zh-Hans": "\u62D3\u6251"
      },
      accessState: "KEY",
      crossTheme: "Cross of Rulership",
      shortLabel: {
        en: "Agency \xB7 Topology",
        "zh-Hans": "\u884C\u52A8 \xB7 \u62D3\u6251"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-43",
      phase: 43,
      grammarId: "G11",
      grammarKey: "identity",
      grammar: {
        en: "Identity",
        "zh-Hans": "\u8EAB\u4EFD"
      },
      arc: "INTERNALIZATION",
      realityDomainId: "P3",
      realityDomain: {
        en: "Reality Continuity",
        "zh-Hans": "\u73B0\u5B9E\u7EF4\u6301"
      },
      bookAlignment: {
        bookCode: "BOOK-3",
        titleZh: "\u4E16\u754C\u5982\u4F55\u7EF4\u6301"
      },
      sourceContext: {
        id: "M11",
        en: "Topology",
        "zh-Hans": "\u62D3\u6251"
      },
      accessState: "KEY",
      crossTheme: "Cross of Consciousness",
      shortLabel: {
        en: "Identity \xB7 Topology",
        "zh-Hans": "\u8EAB\u4EFD \xB7 \u62D3\u6251"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-44",
      phase: 44,
      grammarId: "G12",
      grammarKey: "feedback",
      grammar: {
        en: "Feedback",
        "zh-Hans": "\u53CD\u9988"
      },
      arc: "INTERNALIZATION",
      realityDomainId: "P3",
      realityDomain: {
        en: "Reality Continuity",
        "zh-Hans": "\u73B0\u5B9E\u7EF4\u6301"
      },
      bookAlignment: {
        bookCode: "BOOK-3",
        titleZh: "\u4E16\u754C\u5982\u4F55\u7EF4\u6301"
      },
      sourceContext: {
        id: "M11",
        en: "Topology",
        "zh-Hans": "\u62D3\u6251"
      },
      accessState: "KEY",
      crossTheme: "Cross of Planning",
      shortLabel: {
        en: "Feedback \xB7 Topology",
        "zh-Hans": "\u53CD\u9988 \xB7 \u62D3\u6251"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-45",
      phase: 45,
      grammarId: "G13",
      grammarKey: "settlement",
      grammar: {
        en: "Settlement",
        "zh-Hans": "\u6C89\u6DC0"
      },
      arc: "REORGANIZATION",
      realityDomainId: "P3",
      realityDomain: {
        en: "Reality Continuity",
        "zh-Hans": "\u73B0\u5B9E\u7EF4\u6301"
      },
      bookAlignment: {
        bookCode: "BOOK-3",
        titleZh: "\u4E16\u754C\u5982\u4F55\u7EF4\u6301"
      },
      sourceContext: {
        id: "M12",
        en: "Governance",
        "zh-Hans": "\u6CBB\u7406"
      },
      accessState: "KEY",
      crossTheme: "Cross of the Sleeping Phoenix",
      shortLabel: {
        en: "Settlement \xB7 Governance",
        "zh-Hans": "\u6C89\u6DC0 \xB7 \u6CBB\u7406"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-46",
      phase: 46,
      grammarId: "G14",
      grammarKey: "reconfiguration",
      grammar: {
        en: "Reconfiguration",
        "zh-Hans": "\u91CD\u7EC4"
      },
      arc: "REORGANIZATION",
      realityDomainId: "P3",
      realityDomain: {
        en: "Reality Continuity",
        "zh-Hans": "\u73B0\u5B9E\u7EF4\u6301"
      },
      bookAlignment: {
        bookCode: "BOOK-3",
        titleZh: "\u4E16\u754C\u5982\u4F55\u7EF4\u6301"
      },
      sourceContext: {
        id: "M12",
        en: "Governance",
        "zh-Hans": "\u6CBB\u7406"
      },
      accessState: "KEY",
      crossTheme: "Cross of Contagion",
      shortLabel: {
        en: "Reconfiguration \xB7 Governance",
        "zh-Hans": "\u91CD\u7EC4 \xB7 \u6CBB\u7406"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-47",
      phase: 47,
      grammarId: "G15",
      grammarKey: "emergence",
      grammar: {
        en: "Emergence",
        "zh-Hans": "\u6D8C\u73B0"
      },
      arc: "REORGANIZATION",
      realityDomainId: "P3",
      realityDomain: {
        en: "Reality Continuity",
        "zh-Hans": "\u73B0\u5B9E\u7EF4\u6301"
      },
      bookAlignment: {
        bookCode: "BOOK-3",
        titleZh: "\u4E16\u754C\u5982\u4F55\u7EF4\u6301"
      },
      sourceContext: {
        id: "M12",
        en: "Governance",
        "zh-Hans": "\u6CBB\u7406"
      },
      accessState: "KEY",
      crossTheme: "Cross of Explanation",
      shortLabel: {
        en: "Emergence \xB7 Governance",
        "zh-Hans": "\u6D8C\u73B0 \xB7 \u6CBB\u7406"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    },
    {
      id: "RP-48",
      phase: 48,
      grammarId: "G16",
      grammarKey: "continuity",
      grammar: {
        en: "Continuity",
        "zh-Hans": "\u6301\u7EED"
      },
      arc: "REORGANIZATION",
      realityDomainId: "P3",
      realityDomain: {
        en: "Reality Continuity",
        "zh-Hans": "\u73B0\u5B9E\u7EF4\u6301"
      },
      bookAlignment: {
        bookCode: "BOOK-3",
        titleZh: "\u4E16\u754C\u5982\u4F55\u7EF4\u6301"
      },
      sourceContext: {
        id: "M12",
        en: "Governance",
        "zh-Hans": "\u6CBB\u7406"
      },
      accessState: "LOCK",
      crossTheme: "Cross of the Sphinx",
      shortLabel: {
        en: "Continuity \xB7 Governance",
        "zh-Hans": "\u6301\u7EED \xB7 \u6CBB\u7406"
      },
      knowledgeState: "STRUCTURAL_KNOWLEDGE",
      currentCorrespondenceRule: "DERIVED_RUNTIME_READOUT_ONLY",
      projectionRule: "CONDITIONAL_PROJECTION_ONLY",
      historicalRule: "HISTORICAL_ALIGNMENT_IS_PRECEDENT_NOT_DESTINY",
      sourceSemanticsStatus: "STRUCTURAL_FIELDS_ADMITTED__FULL_SOURCE_TRANSCRIPTION_PENDING"
    }
  ]
};

// assets/js/pages/civilization-atlas/atlas-state.js
var ATLAS_LAYERS = Object.freeze([
  "timeline",
  "cases",
  "comparison",
  "world",
  "trajectories",
  "transitions",
  "loss"
]);
var DEFAULT_ATLAS_STATE = Object.freeze({
  version: "1.0.0",
  activeLayer: "timeline",
  time: null,
  timeWindowId: null,
  snapshotId: null,
  regionIds: [],
  caseIds: [],
  primaryCaseId: null,
  comparisonFamilyId: null,
  trajectoryIds: [],
  transitionWindowId: null,
  lossFamilyId: null,
  lossTypeId: null,
  evidenceClasses: [],
  compareBasket: [],
  caseSearch: "",
  locale: "en"
});
var EVIDENCE_CLASSES = /* @__PURE__ */ new Set(["EVIDENCE_SERIES", "HISTORICAL_RECONSTRUCTION", "CONCEPTUAL_TRAJECTORY"]);
var LOCALES = /* @__PURE__ */ new Set(["en", "zh-Hans"]);
var asString = (v) => typeof v === "string" && v.trim() ? v.trim() : null;
var asArray = (v) => Array.isArray(v) ? [...new Set(v.map(asString).filter(Boolean))] : [];
var asTime = (v) => {
  if (v === null || v === void 0 || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= -1e4 && n <= 9999 ? Math.trunc(n) : null;
};
function normalizeAtlasState(input = {}) {
  const activeLayer = ATLAS_LAYERS.includes(input.activeLayer) ? input.activeLayer : DEFAULT_ATLAS_STATE.activeLayer;
  const locale = LOCALES.has(input.locale) ? input.locale : DEFAULT_ATLAS_STATE.locale;
  const caseIds = asArray(input.caseIds);
  const compareBasket = asArray(input.compareBasket).slice(0, 6);
  const primaryCandidate = asString(input.primaryCaseId);
  const primaryCaseId = primaryCandidate || caseIds[0] || null;
  return {
    version: "1.0.0",
    activeLayer,
    time: asTime(input.time),
    timeWindowId: asString(input.timeWindowId),
    snapshotId: asString(input.snapshotId),
    regionIds: asArray(input.regionIds),
    caseIds,
    primaryCaseId,
    comparisonFamilyId: asString(input.comparisonFamilyId),
    trajectoryIds: asArray(input.trajectoryIds).slice(0, 5),
    transitionWindowId: asString(input.transitionWindowId),
    lossFamilyId: asString(input.lossFamilyId),
    lossTypeId: asString(input.lossTypeId),
    evidenceClasses: asArray(input.evidenceClasses).filter((v) => EVIDENCE_CLASSES.has(v)),
    compareBasket,
    caseSearch: typeof input.caseSearch === "string" ? input.caseSearch.slice(0, 120) : "",
    locale
  };
}
var RECONFIG_ATLAS_LAYERS = Object.freeze([
  "overview",
  "search",
  "cases",
  "timeline",
  "windows",
  "snapshots",
  "dossiers",
  "lived",
  "positions",
  "visuals",
  "compare",
  "dossiercompare"
]);
var DEFAULT_RECONFIGURATION_ATLAS_STATE = Object.freeze({
  version: "2.0.0",
  activeLayer: "windows",
  query: "",
  caseSearch: "",
  primaryCaseId: null,
  compareCaseIds: [],
  windowId: null,
  snapshotId: null,
  snapshotLayer: "political",
  dossierId: null,
  compareDossierIds: [],
  livedRealityDimensionId: null,
  positionId: null,
  sectionId: null,
  regionId: null,
  caseType: null,
  filterWindowId: null,
  triggerQuery: "",
  pressureQuery: "",
  changeFilter: null,
  casePage: 1,
  searchPage: 1,
  locale: "en"
});

// assets/js/pages/civilization-atlas/atlas-url-state.js
var PARAMS = Object.freeze({
  activeLayer: "atlas",
  time: "time",
  timeWindowId: "period",
  snapshotId: "snapshot",
  regionIds: "regions",
  caseIds: "cases",
  primaryCaseId: "case",
  comparisonFamilyId: "family",
  trajectoryIds: "trajectories",
  transitionWindowId: "tw",
  lossFamilyId: "lossFamily",
  lossTypeId: "lossType",
  evidenceClasses: "evidence",
  compareBasket: "compare",
  caseSearch: "q"
});
function atlasUrlFromState(urlLike, state, { includeHash = true } = {}) {
  const url = urlLike instanceof URL ? new URL(urlLike.href) : new URL(String(urlLike), "https://example.invalid");
  const normalized2 = normalizeAtlasState(state);
  for (const param of Object.values(PARAMS)) url.searchParams.delete(param);
  const set = (param, value) => {
    if (value !== null && value !== void 0 && value !== "" && (!Array.isArray(value) || value.length)) url.searchParams.set(param, Array.isArray(value) ? value.join(",") : String(value));
  };
  set(PARAMS.activeLayer, normalized2.activeLayer);
  set(PARAMS.time, normalized2.time);
  set(PARAMS.timeWindowId, normalized2.timeWindowId);
  set(PARAMS.snapshotId, normalized2.snapshotId);
  set(PARAMS.regionIds, normalized2.regionIds);
  set(PARAMS.caseIds, normalized2.caseIds);
  set(PARAMS.primaryCaseId, normalized2.primaryCaseId);
  set(PARAMS.comparisonFamilyId, normalized2.comparisonFamilyId);
  set(PARAMS.trajectoryIds, normalized2.trajectoryIds);
  set(PARAMS.transitionWindowId, normalized2.transitionWindowId);
  set(PARAMS.lossFamilyId, normalized2.lossFamilyId);
  set(PARAMS.lossTypeId, normalized2.lossTypeId);
  set(PARAMS.evidenceClasses, normalized2.evidenceClasses);
  set(PARAMS.compareBasket, normalized2.compareBasket);
  set(PARAMS.caseSearch, normalized2.caseSearch);
  if (includeHash) url.hash = "atlas";
  return url;
}
var RECONFIG_PARAMS = Object.freeze({
  activeLayer: "atlas",
  query: "q",
  caseSearch: "caseQ",
  primaryCaseId: "case",
  compareCaseIds: "cases",
  windowId: "window",
  snapshotId: "snapshot",
  snapshotLayer: "layer",
  dossierId: "dossier",
  compareDossierIds: "dossiers",
  livedRealityDimensionId: "lived",
  positionId: "position",
  sectionId: "section",
  regionId: "region",
  caseType: "caseType",
  filterWindowId: "period",
  triggerQuery: "trigger",
  pressureQuery: "pressure",
  changeFilter: "change",
  casePage: "casePage",
  searchPage: "searchPage"
});

// content/civilization-atlas/reconfiguration/runtime-position-w8c-current-evidence-ir-v1.json
var runtime_position_w8c_current_evidence_ir_v1_default = {
  schemaVersion: "PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8C-CURRENT-EVIDENCE-IR-v1.0.0",
  version: "1.0.0",
  status: "CURRENT_EVIDENCE_ADMITTED",
  work: "PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8C",
  owner: "CURRENT_WEB_AUTHORITY",
  records: [
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "US-DEMOGRAPHY-2026-001",
      claimText: "U.S. population growth slowed to 0.5% between July 1, 2024 and July 1, 2025.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "US-CENSUS-VINTAGE-2025-NATIONAL-STATE",
      sourceUrl: "https://www.census.gov/newsroom/press-kits/2026/national-state-population-estimates.html",
      authorityClass: "OFFICIAL_PRIMARY",
      publisher: "U.S. Census Bureau",
      title: "Vintage 2025 National and State Population Estimates",
      publishedAt: "2026-01-27T00:00:00.000Z",
      retrievedAt: "2026-10-02T02:47:00.000Z",
      sourceVersion: "VINTAGE-2025-NATIONAL-STATE-20260127",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "GENERAL_CURRENT",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "US-DEMOGRAPHY-2026-001",
      dossierId: "DOSSIER-US",
      laneId: "DEMOGRAPHY",
      sourceLocator: {
        type: "SECTION",
        value: "News Release > Population Growth Slows Due to Decline in Net International Migration"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "OFFICIAL_PRIMARY",
        domain: "GENERAL_CURRENT",
        reviewedAt: "2026-10-02T02:58:00.000Z",
        reviewerRole: "PHI_OS_SOURCE_AUTHORITY_REVIEW",
        decisionBasis: "U.S. Census Bureau is the primary federal statistical authority for the cited national population estimate release."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "US-INDUSTRY-2026-001",
      claimText: "In the second quarter of 2026, real value added increased 2.5% for private services-producing industries, 2.3% for private goods-producing industries, and less than 0.1% for government; real GDP increased at a 2.2% annual rate.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "US-BEA-GDP-BY-INDUSTRY-2026Q2",
      sourceUrl: "https://www.bea.gov/data/gdp/gdp-industry",
      authorityClass: "OFFICIAL_PRIMARY",
      publisher: "U.S. Bureau of Economic Analysis",
      title: "GDP by Industry",
      publishedAt: "2026-09-30T00:00:00.000Z",
      retrievedAt: "2026-10-02T02:47:00.000Z",
      sourceVersion: "2026Q2-THIRD-ESTIMATE-20260930",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "GENERAL_CURRENT",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "US-INDUSTRY-2026-001",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "SECTION",
        value: "GDP by Industry > current release summary, September 30, 2026"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "OFFICIAL_PRIMARY",
        domain: "GENERAL_CURRENT",
        reviewedAt: "2026-10-02T02:58:00.000Z",
        reviewerRole: "PHI_OS_SOURCE_AUTHORITY_REVIEW",
        decisionBasis: "U.S. Bureau of Economic Analysis is the primary federal producer of the cited GDP-by-industry statistics."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "US-INFRASTRUCTURE-2026-001",
      claimText: "The September 30, 2026 National Transportation Statistics update added new data to the Number of U.S. Airports and U.S. Vehicle-Miles tables.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "US-BTS-NTS-UPDATE-20260930",
      sourceUrl: "https://www.bts.gov/newsroom/bts-updates-national-transportation-statistics-93026",
      authorityClass: "OFFICIAL_PRIMARY",
      publisher: "U.S. Bureau of Transportation Statistics",
      title: "BTS Updates National Transportation Statistics 9/30/26",
      publishedAt: "2026-09-30T00:00:00.000Z",
      retrievedAt: "2026-10-02T02:47:00.000Z",
      sourceVersion: "NTS-UPDATE-20260930",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "GENERAL_CURRENT",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "US-INFRASTRUCTURE-2026-001",
      dossierId: "DOSSIER-US",
      laneId: "INFRASTRUCTURE",
      sourceLocator: {
        type: "SECTION",
        value: "This month, the following tables received new data"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "OFFICIAL_PRIMARY",
        domain: "GENERAL_CURRENT",
        reviewedAt: "2026-10-02T02:58:00.000Z",
        reviewerRole: "PHI_OS_SOURCE_AUTHORITY_REVIEW",
        decisionBasis: "U.S. Bureau of Transportation Statistics is the federal statistical agency publishing the cited National Transportation Statistics update."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "US-TECHNOLOGY-2026-001",
      claimText: "U.S. gross domestic R&D expenditures were $1.009 trillion in 2024 on a purchasing-power-parity basis, equal to 3.4% of U.S. GDP; the United States accounted for 29% of global R&D performance.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "US-NSF-NSB-SEP-2026-1",
      sourceUrl: "https://ncses.nsf.gov/pubs/nsbsep20261/executive-summary",
      authorityClass: "OFFICIAL_PRIMARY",
      publisher: "National Center for Science and Engineering Statistics, U.S. National Science Foundation",
      title: "The State of U.S. Science and Engineering 2026",
      publishedAt: "2026-05-04T00:00:00.000Z",
      retrievedAt: "2026-10-02T02:47:00.000Z",
      sourceVersion: "NSB-SEP-2026-1",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "GENERAL_CURRENT",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "US-TECHNOLOGY-2026-001",
      dossierId: "DOSSIER-US",
      laneId: "TECHNOLOGY",
      sourceLocator: {
        type: "SECTION",
        value: "Executive Summary > Discovery: R&D Activity and Research Publications > R&D Activity"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "OFFICIAL_PRIMARY",
        domain: "GENERAL_CURRENT",
        reviewedAt: "2026-10-02T02:58:00.000Z",
        reviewerRole: "PHI_OS_SOURCE_AUTHORITY_REVIEW",
        decisionBasis: "NSF NCSES is the official U.S. statistical authority publishing the cited Science and Engineering Indicators data."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "US-EXTERNAL-DEPENDENCY-2026-001",
      claimText: "In July 2026, U.S. goods and services exports were $310.7 billion, imports were $399.3 billion, and the goods and services deficit was $88.6 billion.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "US-BEA-TRADE-GOODS-SERVICES-JULY-2026",
      sourceUrl: "https://www.bea.gov/news/2026/us-international-trade-goods-and-services-july-2026",
      authorityClass: "OFFICIAL_PRIMARY",
      publisher: "U.S. Bureau of Economic Analysis and U.S. Census Bureau",
      title: "U.S. International Trade in Goods and Services, July 2026",
      publishedAt: "2026-09-03T00:00:00.000Z",
      retrievedAt: "2026-10-02T02:47:00.000Z",
      sourceVersion: "BEA-26-40_CB-26-142_JULY-2026",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "GENERAL_CURRENT",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "US-EXTERNAL-DEPENDENCY-2026-001",
      dossierId: "DOSSIER-US",
      laneId: "EXTERNAL_DEPENDENCY",
      sourceLocator: {
        type: "TABLE",
        value: "U.S. International Trade in Goods and Services Deficit / Exports, Imports, and Balance (exhibit 1)"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "OFFICIAL_PRIMARY",
        domain: "GENERAL_CURRENT",
        reviewedAt: "2026-10-02T02:58:00.000Z",
        reviewerRole: "PHI_OS_SOURCE_AUTHORITY_REVIEW",
        decisionBasis: "BEA and the U.S. Census Bureau jointly publish the official U.S. international trade release cited by this claim."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "US-CARRIER-STRUCTURE-2026-001",
      claimText: "As of February 2026, the United States had 36,207,130 small businesses, and U.S. small businesses employed 62.3 million people, or 45.9% of private-sector workers.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "US-SBA-FAQ-SMALL-BUSINESS-2026",
      sourceUrl: "https://advocacy.sba.gov/2026/02/03/frequently-asked-questions-about-small-business-2026/",
      authorityClass: "GOVERNMENT",
      publisher: "U.S. Small Business Administration, Office of Advocacy",
      title: "Frequently Asked Questions About Small Business 2026",
      publishedAt: "2026-02-03T00:00:00.000Z",
      retrievedAt: "2026-10-02T02:47:00.000Z",
      sourceVersion: "SBA-ADVOCACY-FAQ-SMALL-BUSINESS-2026-02",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "GENERAL_CURRENT",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "US-CARRIER-STRUCTURE-2026-001",
      dossierId: "DOSSIER-US",
      laneId: "CARRIER_STRUCTURE",
      sourceLocator: {
        type: "SECTION",
        value: "Frequently Asked Questions About Small Business 2026 > key statistics"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "GOVERNMENT",
        domain: "GENERAL_CURRENT",
        reviewedAt: "2026-10-02T02:58:00.000Z",
        reviewerRole: "PHI_OS_SOURCE_AUTHORITY_REVIEW",
        decisionBasis: "SBA Office of Advocacy is a U.S. government source publishing the cited small-business composition and employment statistics."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "US-PRESSURE-FIELD-2026-001",
      claimText: "The Federal Reserve's May 2026 Financial Stability Report assessed U.S. financial-system vulnerabilities across valuation pressures, borrowing by businesses and households, financial-sector leverage, and funding risks, using market conditions and data as of April 23, 2026.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "US-FED-FSR-MAY-2026",
      sourceUrl: "https://www.federalreserve.gov/publications/2026-may-financial-stability-report-overview.htm",
      authorityClass: "REGULATOR",
      publisher: "Board of Governors of the Federal Reserve System",
      title: "Financial Stability Report - May 2026",
      publishedAt: null,
      retrievedAt: "2026-10-02T02:47:00.000Z",
      sourceVersion: "FED-FSR-MAY-2026",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "US-PRESSURE-FIELD-2026-001",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "SECTION",
        value: "Overview > Overview of financial system vulnerabilities"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "REGULATOR",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T02:58:00.000Z",
        reviewerRole: "PHI_OS_SOURCE_AUTHORITY_REVIEW",
        decisionBasis: "The Board of Governors of the Federal Reserve System is the relevant U.S. financial regulator publishing the cited Financial Stability Report."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "CN-DEMOGRAPHY-2026-001",
      claimText: "According to China's 2025 1% National Population Sample Survey, the national population was 1,405.45 million; 22.86% were aged 60 and over and 15.87% were aged 65 and over.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "CN-NBS-1PCT-POP-2025",
      sourceUrl: "https://www.stats.gov.cn/sj/zxfb/202605/t20260522_1963788.html",
      authorityClass: "OFFICIAL_PRIMARY",
      publisher: "\u56FD\u5BB6\u7EDF\u8BA1\u5C40",
      title: "2025\u5E74\u5168\u56FD1%\u4EBA\u53E3\u62BD\u6837\u8C03\u67E5\u4E3B\u8981\u6570\u636E\u516C\u62A5",
      publishedAt: "2026-05-22T07:00:00.000Z",
      retrievedAt: "2026-10-08T04:20:00.000Z",
      sourceVersion: "NBS-1PCT-POP-2025-20260522",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "CN",
      domain: "GENERAL_CURRENT",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "CN-DEMOGRAPHY-2026-001",
      dossierId: "DOSSIER-CN",
      laneId: "DEMOGRAPHY",
      sourceLocator: {
        type: "SECTION",
        value: "2025\u5E74\u5168\u56FD1%\u4EBA\u53E3\u62BD\u6837\u8C03\u67E5\u4E3B\u8981\u6570\u636E\u516C\u62A5 > \u4E00\u3001\u5168\u56FD\u4EBA\u53E3 / \u4E09\u3001\u5E74\u9F84\u6784\u6210"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "OFFICIAL_PRIMARY",
        domain: "GENERAL_CURRENT",
        reviewedAt: "2026-10-08T04:35:00.000Z",
        reviewerRole: "PHI_OS_SOURCE_AUTHORITY_REVIEW",
        decisionBasis: "\u56FD\u5BB6\u7EDF\u8BA1\u5C40\u662F\u4E2D\u56FD\u4EBA\u53E3\u7EDF\u8BA1\u4E0E\u5168\u56FD\u4EBA\u53E3\u62BD\u6837\u8C03\u67E5\u7684\u5B98\u65B9\u7EDF\u8BA1\u53D1\u5E03\u673A\u6784\uFF1B\u8BE5\u516C\u62A5\u4E3A\u4EBA\u53E3\u89C4\u6A21\u548C\u5E74\u9F84\u7ED3\u6784\u7684\u76F4\u63A5\u5B98\u65B9\u6765\u6E90\u3002"
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "CN-INDUSTRY-2026-001",
      claimText: "In August 2026, China's value added of industrial enterprises above designated size increased 5.2% year on year; manufacturing increased 6.1%, and computer, communication and other electronic equipment manufacturing increased 17.2%.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "CN-NBS-INDUSTRY-AUG-2026",
      sourceUrl: "https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202609/t20260915_1965308.html",
      authorityClass: "OFFICIAL_PRIMARY",
      publisher: "\u56FD\u5BB6\u7EDF\u8BA1\u5C40",
      title: "2026\u5E748\u6708\u4EFD\u89C4\u6A21\u4EE5\u4E0A\u5DE5\u4E1A\u589E\u52A0\u503C",
      publishedAt: "2026-09-15T00:00:00.000Z",
      retrievedAt: "2026-10-08T04:20:00.000Z",
      sourceVersion: "NBS-INDUSTRY-2026-08-20260915",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "CN",
      domain: "GENERAL_CURRENT",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "CN-INDUSTRY-2026-001",
      dossierId: "DOSSIER-CN",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "SECTION",
        value: "8\u6708\u4EFD\u89C4\u6A21\u4EE5\u4E0A\u5DE5\u4E1A\u589E\u52A0\u503C > \u5206\u4E09\u5927\u95E8\u7C7B / \u5206\u884C\u4E1A"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "OFFICIAL_PRIMARY",
        domain: "GENERAL_CURRENT",
        reviewedAt: "2026-10-08T04:35:00.000Z",
        reviewerRole: "PHI_OS_SOURCE_AUTHORITY_REVIEW",
        decisionBasis: "\u56FD\u5BB6\u7EDF\u8BA1\u5C40\u76F4\u63A5\u53D1\u5E03\u89C4\u6A21\u4EE5\u4E0A\u5DE5\u4E1A\u589E\u52A0\u503C\u53CA\u884C\u4E1A\u5206\u9879\u6570\u636E\uFF0C\u662F\u6240\u5F15\u5DE5\u4E1A\u8FD0\u884C\u6570\u636E\u7684\u5B98\u65B9\u7EDF\u8BA1\u6765\u6E90\u3002"
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "CN-INFRASTRUCTURE-2026-001",
      claimText: "From September 21 to 27, 2026, China's monitored transport and logistics system carried 83.026 million tonnes by national railway, recorded 55.325 million expressway truck trips, and handled 278.781 million tonnes of cargo at monitored ports.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "CN-MOT-LOGISTICS-20260921-27",
      sourceUrl: "https://www.mot.gov.cn/zhuanti/wuliubtbc/qingkuangtongbao_wuliu/202609/t20260928_4225051.html",
      authorityClass: "GOVERNMENT",
      publisher: "\u4E2D\u534E\u4EBA\u6C11\u5171\u548C\u56FD\u4EA4\u901A\u8FD0\u8F93\u90E8",
      title: "9\u670821\u65E5\u20149\u670827\u65E5\u5168\u56FD\u7269\u6D41\u4FDD\u901A\u4FDD\u7545\u8FD0\u884C\u60C5\u51B5",
      publishedAt: "2026-09-28T07:26:00.000Z",
      retrievedAt: "2026-10-08T04:20:00.000Z",
      sourceVersion: "MOT-LOGISTICS-20260921-27",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "CN",
      domain: "GENERAL_CURRENT",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "CN-INFRASTRUCTURE-2026-001",
      dossierId: "DOSSIER-CN",
      laneId: "INFRASTRUCTURE",
      sourceLocator: {
        type: "SECTION",
        value: "9\u670821\u65E5\u20149\u670827\u65E5\u5168\u56FD\u7269\u6D41\u4FDD\u901A\u4FDD\u7545\u8FD0\u884C\u6570\u636E"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "GOVERNMENT",
        domain: "GENERAL_CURRENT",
        reviewedAt: "2026-10-08T04:35:00.000Z",
        reviewerRole: "PHI_OS_SOURCE_AUTHORITY_REVIEW",
        decisionBasis: "\u4E2D\u534E\u4EBA\u6C11\u5171\u548C\u56FD\u4EA4\u901A\u8FD0\u8F93\u90E8\u76F4\u63A5\u53D1\u5E03\u5168\u56FD\u7269\u6D41\u4FDD\u901A\u4FDD\u7545\u5468\u5EA6\u8FD0\u884C\u6570\u636E\uFF0C\u662F\u6240\u5F15\u94C1\u8DEF\u3001\u516C\u8DEF\u3001\u6E2F\u53E3\u7B49\u8FD0\u8F93\u8FD0\u884C\u6570\u636E\u7684\u653F\u5E9C\u6765\u6E90\u3002"
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "CN-TECHNOLOGY-2026-001",
      claimText: "China's R&D expenditure reached 3.9262 trillion yuan in 2025, with R&D intensity at 2.80% of GDP; basic research expenditure reached 277.8 billion yuan.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "CN-NBS-RD-2025-ACHIEVEMENT",
      sourceUrl: "https://www.stats.gov.cn/sj/sjjd/202606/t20260602_1963863.html",
      authorityClass: "OFFICIAL_PRIMARY",
      publisher: "\u56FD\u5BB6\u7EDF\u8BA1\u5C40",
      title: "\u521B\u65B0\u9A71\u52A8\u63D0\u8D28\u589E\u6548 \u53D1\u5C55\u52A8\u80FD\u7115\u65B0\u5347\u7EA7\u2014\u2014\u201C\u5341\u56DB\u4E94\u201D\u7ECF\u6D4E\u793E\u4F1A\u53D1\u5C55\u6210\u5C31\u7CFB\u5217\u62A5\u544A\u4E4B\u4E8C",
      publishedAt: "2026-06-02T00:00:00.000Z",
      retrievedAt: "2026-10-08T04:20:00.000Z",
      sourceVersion: "NBS-RD-2025-ACHIEVEMENT-20260602",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "CN",
      domain: "GENERAL_CURRENT",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "CN-TECHNOLOGY-2026-001",
      dossierId: "DOSSIER-CN",
      laneId: "TECHNOLOGY",
      sourceLocator: {
        type: "SECTION",
        value: "\uFF08\u4E00\uFF09\u7814\u53D1\u6295\u5165\u89C4\u6A21\u4E0E\u5F3A\u5EA6\u53CC\u63D0\u5347"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "OFFICIAL_PRIMARY",
        domain: "GENERAL_CURRENT",
        reviewedAt: "2026-10-08T04:35:00.000Z",
        reviewerRole: "PHI_OS_SOURCE_AUTHORITY_REVIEW",
        decisionBasis: "\u56FD\u5BB6\u7EDF\u8BA1\u5C40\u53D1\u5E03\u5168\u793E\u4F1AR&D\u6295\u5165\u89C4\u6A21\u3001\u5F3A\u5EA6\u4E0E\u57FA\u7840\u7814\u7A76\u6295\u5165\u7EDF\u8BA1\uFF0C\u662F\u6240\u5F15\u79D1\u6280\u6295\u5165\u6570\u636E\u7684\u5B98\u65B9\u7EDF\u8BA1\u6765\u6E90\u3002"
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "CN-EXTERNAL-DEPENDENCY-2026-001",
      claimText: "In August 2026, China's international trade in goods and services recorded exports of RMB 2,879.3 billion and imports of RMB 2,238.6 billion, for a surplus of RMB 640.7 billion.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "CN-SAFE-TRADE-GS-AUG-2026",
      sourceUrl: "https://www.safe.gov.cn/en/2026/0929/2456.html",
      authorityClass: "REGULATOR",
      publisher: "State Administration of Foreign Exchange",
      title: "SAFE Releases Data on International Trade in Goods and Services of China in August 2026",
      publishedAt: "2026-09-29T00:00:00.000Z",
      retrievedAt: "2026-10-08T04:20:00.000Z",
      sourceVersion: "SAFE-TRADE-GS-2026-08-20260929",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "CN",
      domain: "GENERAL_CURRENT",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "CN-EXTERNAL-DEPENDENCY-2026-001",
      dossierId: "DOSSIER-CN",
      laneId: "EXTERNAL_DEPENDENCY",
      sourceLocator: {
        type: "SECTION",
        value: "SAFE Releases Data on International Trade in Goods and Services of China in August 2026"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "REGULATOR",
        domain: "GENERAL_CURRENT",
        reviewedAt: "2026-10-08T04:35:00.000Z",
        reviewerRole: "PHI_OS_SOURCE_AUTHORITY_REVIEW",
        decisionBasis: "\u56FD\u5BB6\u5916\u6C47\u7BA1\u7406\u5C40\u76F4\u63A5\u53D1\u5E03\u4E2D\u56FD\u56FD\u9645\u8D27\u7269\u548C\u670D\u52A1\u8D38\u6613\u6708\u5EA6\u6570\u636E\uFF0C\u662F\u6240\u5F15\u8DE8\u5883\u8D27\u7269\u4E0E\u670D\u52A1\u4EA4\u6362\u6570\u636E\u7684\u5B98\u65B9\u5916\u6C47\u7BA1\u7406\u6765\u6E90\u3002"
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "CN-CARRIER-STRUCTURE-2026-001",
      claimText: "In 2025, China recorded 25.74 million newly established business entities, with an average of 26,000 enterprises newly established per day.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "CN-NBS-STAT-COMMUNIQUE-2025",
      sourceUrl: "https://www.stats.gov.cn/sj/zxfbhjd/202602/t20260228_1962662.html",
      authorityClass: "OFFICIAL_PRIMARY",
      publisher: "\u56FD\u5BB6\u7EDF\u8BA1\u5C40",
      title: "\u4E2D\u534E\u4EBA\u6C11\u5171\u548C\u56FD2025\u5E74\u56FD\u6C11\u7ECF\u6D4E\u548C\u793E\u4F1A\u53D1\u5C55\u7EDF\u8BA1\u516C\u62A5",
      publishedAt: "2026-02-28T01:30:00.000Z",
      retrievedAt: "2026-10-08T04:20:00.000Z",
      sourceVersion: "NBS-STAT-COMMUNIQUE-2025-20260228",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "CN",
      domain: "GENERAL_CURRENT",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "CN-CARRIER-STRUCTURE-2026-001",
      dossierId: "DOSSIER-CN",
      laneId: "CARRIER_STRUCTURE",
      sourceLocator: {
        type: "SECTION",
        value: "\u4E2D\u534E\u4EBA\u6C11\u5171\u548C\u56FD2025\u5E74\u56FD\u6C11\u7ECF\u6D4E\u548C\u793E\u4F1A\u53D1\u5C55\u7EDF\u8BA1\u516C\u62A5 > \u7ECF\u8425\u4E3B\u4F53"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "OFFICIAL_PRIMARY",
        domain: "GENERAL_CURRENT",
        reviewedAt: "2026-10-08T04:35:00.000Z",
        reviewerRole: "PHI_OS_SOURCE_AUTHORITY_REVIEW",
        decisionBasis: "\u56FD\u5BB6\u7EDF\u8BA1\u5C40\u5E74\u5EA6\u56FD\u6C11\u7ECF\u6D4E\u548C\u793E\u4F1A\u53D1\u5C55\u7EDF\u8BA1\u516C\u62A5\u76F4\u63A5\u53D1\u5E03\u7ECF\u8425\u4E3B\u4F53\u5F62\u6210\u6307\u6807\uFF0C\u53EF\u4F5C\u4E3A\u7EC4\u7EC7\u8F7D\u4F53\u7ED3\u6784\u7684\u5B98\u65B9\u7EDF\u8BA1\u6765\u6E90\u3002"
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "CN-PRESSURE-FIELD-2026-001",
      claimText: "China's 2026 government work report identified stabilizing the real estate market, defusing local government debt risks, and prudently defusing financial risks as key risk-prevention tasks.",
      claimType: "POLICY_OR_REGULATION",
      sourceId: "CN-GOV-WORK-REPORT-RISK-2026",
      sourceUrl: "https://english.www.gov.cn/2026special/2026npcandcpcc/202603/05/content_WS69a8f1dec6d00ca5f9a098ae.html",
      authorityClass: "GOVERNMENT",
      publisher: "The State Council of the People's Republic of China",
      title: "China to strengthen risk prevention, mitigation in key areas",
      publishedAt: "2026-03-05T03:00:00.000Z",
      retrievedAt: "2026-10-08T04:20:00.000Z",
      sourceVersion: "STATE-COUNCIL-2026-GOV-WORK-RISK",
      freshnessState: "FRESH_UNTIL_SUPERSEDED",
      supportLevel: "DIRECT",
      jurisdiction: "CN",
      domain: "GENERAL_CURRENT",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "CN-PRESSURE-FIELD-2026-001",
      dossierId: "DOSSIER-CN",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "SECTION",
        value: "Strengthening risk prevention and mitigation and enhancing security capacity in key areas"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "GOVERNMENT",
        domain: "GENERAL_CURRENT",
        reviewedAt: "2026-10-08T04:35:00.000Z",
        reviewerRole: "PHI_OS_SOURCE_AUTHORITY_REVIEW",
        decisionBasis: "\u4E2D\u56FD\u653F\u5E9C\u7F51\u53D1\u5E03\u76842026\u653F\u5E9C\u5DE5\u4F5C\u62A5\u544A\u76F8\u5173\u5185\u5BB9\u660E\u786E\u5217\u51FA\u623F\u5730\u4EA7\u3001\u5730\u65B9\u653F\u5E9C\u503A\u52A1\u4E0E\u91D1\u878D\u98CE\u9669\u9632\u8303\u4EFB\u52A1\uFF0C\u662F\u56FD\u5BB6\u5C42\u9762\u5F53\u524D\u98CE\u9669\u538B\u529B\u7684\u653F\u5E9C\u653F\u7B56\u6765\u6E90\u3002"
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    }
  ]
};

// content/civilization-atlas/reconfiguration/dossier-af-w8c-current-authority-admission-v1.json
var dossier_af_w8c_current_authority_admission_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-AF-W8C-CURRENT-AUTHORITY-ADMISSION-v1.0.0",
  status: "REQUIRED_LANES_ADMITTED",
  dossierId: "DOSSIER-AF",
  stage: "W8-C",
  asOfDate: "2026-10-08",
  admittedLaneIds: [
    "DEMOGRAPHY",
    "INDUSTRY",
    "INFRASTRUCTURE",
    "TECHNOLOGY",
    "EXTERNAL_DEPENDENCY",
    "CARRIER_STRUCTURE",
    "PRESSURE_FIELD"
  ],
  records: [
    {
      claimId: "AF-DEMOGRAPHY-2026-001",
      laneId: "DEMOGRAPHY",
      source: "UN World Population Highlights 2026",
      url: "https://www.un.org/development/desa/pd/content/world-population-highlights-2026-youth-1",
      text: "Africa remains the world's youngest major region, with rapid population and labour-force growth creating both capacity and employment pressure.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "AF-INDUSTRY-2026-001",
      laneId: "INDUSTRY",
      source: "AfDB African Economic Outlook 2026",
      url: "https://www.afdb.org/en/news-and-events/press-releases/africas-growth-holds-firm-amid-global-turbulence-says-2026-african-economic-outlook-93626",
      text: "Africa is projected to grow 4.2% in 2026, but performance is heterogeneous and transformation still depends on stronger productivity, regional value chains and private investment.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "AF-INFRASTRUCTURE-2026-001",
      laneId: "INFRASTRUCTURE",
      source: "World Bank Integrating Africa 2026",
      url: "https://www.worldbank.org/en/news/press-release/2026/08/28/whats-next-for-africas-integration-agenda",
      text: "Africa's integration agenda requires functioning transport corridors, power markets, digital networks and interoperable border systems; infrastructure fragmentation remains a central operating constraint.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "AF-TECHNOLOGY-2026-001",
      laneId: "TECHNOLOGY",
      source: "GSMA Mobile Economy Africa 2026",
      url: "https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-economy/africa/",
      text: "Mobile technologies and services contributed about USD 240 billion to Africa's economy in 2025, while nearly one billion people still did not use mobile internet, showing both large digital scale and a major usage gap.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "AF-EXTERNAL-DEPENDENCY-2026-001",
      laneId: "EXTERNAL_DEPENDENCY",
      source: "IMF SSA REO April 2026",
      url: "https://www.imf.org/en/publications/reo/ssa/issues/2026/04/16/regional-economic-outlook-for-sub-saharan-africa-april-2026",
      text: "Sub-Saharan Africa entered 2026 vulnerable to external fuel, fertilizer and financing shocks, with Middle East conflict raising key commodity prices and downside risks.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "AF-CARRIER-STRUCTURE-2026-001",
      laneId: "CARRIER_STRUCTURE",
      source: "PAPSS / Afreximbank 2026",
      url: "https://www.afreximbank.com/pesalink-and-papss-unlock-cross-border-payments-in-local-currencies-in-kenya/",
      text: "PAPSS is functioning as a pan-African cross-border payment carrier, with 160-plus participating banks and local-currency instant settlement links expanding through national networks such as Pesalink.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "AF-PRESSURE-FIELD-2026-001",
      laneId: "PRESSURE_FIELD",
      source: "IMF / World Bank Africa 2026",
      url: "https://www.imf.org/en/news/articles/2026/05/21/cf-africa-needs-a-growth-reset",
      text: "High debt, expensive borrowing, falling aid and weak productivity constrain the region's fiscal and investment capacity even as aggregate growth remains positive.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "AF-INTEGRATION-RECONFIGURATION-2026-001",
      laneId: "INFRASTRUCTURE",
      source: "World Bank Integrating Africa 2026",
      url: "https://www.worldbank.org/en/news/press-release/2026/08/28/whats-next-for-africas-integration-agenda",
      text: "AfCFTA implementation is shifting from treaty architecture toward production hubs, interoperable systems and regional public goods.",
      admissionDecision: "REFERENCE_ONLY",
      reason: "Supports reconfiguration direction but does not yet prove a continent-wide P3 mechanism mature enough for admission."
    }
  ],
  counts: {
    totalClaims: 8,
    admittedClaims: 7,
    admittedUniqueSources: 7,
    referenceOnly: 1,
    rreEligible: 7
  },
  conflictsAndUnknowns: [
    "Continental aggregates conceal large country and subregional differences.",
    "Mobile coverage and payment innovation do not imply universal digital access.",
    "Growth resilience coexists with debt, financing, commodity and infrastructure constraints."
  ],
  boundary: "Evidence count is not voting; no RP is admitted at W8-C."
};

// content/civilization-atlas/reconfiguration/dossier-eu-w8c-current-authority-admission-v1.json
var dossier_eu_w8c_current_authority_admission_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-EU-W8C-CURRENT-AUTHORITY-ADMISSION-v1.0.0",
  status: "REQUIRED_LANES_ADMITTED",
  dossierId: "DOSSIER-EU",
  stage: "W8-C",
  asOfDate: "2026-10-08",
  requiredLaneIds: [
    "DEMOGRAPHY",
    "INDUSTRY",
    "INFRASTRUCTURE",
    "TECHNOLOGY",
    "EXTERNAL_DEPENDENCY",
    "CARRIER_STRUCTURE",
    "PRESSURE_FIELD"
  ],
  admittedLaneIds: [
    "DEMOGRAPHY",
    "INDUSTRY",
    "INFRASTRUCTURE",
    "TECHNOLOGY",
    "EXTERNAL_DEPENDENCY",
    "CARRIER_STRUCTURE",
    "PRESSURE_FIELD"
  ],
  records: [
    {
      claimId: "EU-DEMOGRAPHY-2026-001",
      laneId: "DEMOGRAPHY",
      sourceId: "EU-EUROSTAT-POP-2026",
      authorityClass: "OFFICIAL_PRIMARY",
      publishedAt: "2026-07-10T00:00:00.000Z",
      sourceUrl: "https://ec.europa.eu/eurostat/en/web/products-eurostat-news/w/ddn-20260710-3",
      claimText: "On 1 January 2026, the EU population was estimated at 452.0 million, up by 706,000 over the previous year; since 2012, positive net migration has offset negative natural population change.",
      sourceVersion: "EUROSTAT-POP-2026-20260710",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      dossierId: "DOSSIER-EU",
      entity: {
        en: "European Union",
        zhHans: "\u6B27\u76DF"
      },
      retrievedAt: "2026-10-08T06:58:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "EU-INDUSTRY-2026-001",
      laneId: "INDUSTRY",
      sourceId: "EU-EUROSTAT-IP-JUL-2026",
      authorityClass: "OFFICIAL_PRIMARY",
      publishedAt: "2026-09-16T00:00:00.000Z",
      sourceUrl: "https://ec.europa.eu/eurostat/de/web/products-euro-indicators/w/4-16092026-ap",
      claimText: "In July 2026, seasonally adjusted industrial production fell 0.3% month on month in the EU while remaining 0.3% above July 2025, indicating an operating but low-growth industrial runtime.",
      sourceVersion: "EUROSTAT-IP-2026-07-20260916",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      dossierId: "DOSSIER-EU",
      entity: {
        en: "European Union",
        zhHans: "\u6B27\u76DF"
      },
      retrievedAt: "2026-10-08T06:58:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "EU-INFRASTRUCTURE-2026-001",
      laneId: "INFRASTRUCTURE",
      sourceId: "EU-TENT-WORKPLANS-SEP-2026",
      authorityClass: "GOVERNMENT",
      publishedAt: "2026-09-30T00:00:00.000Z",
      sourceUrl: "https://transport.ec.europa.eu/news-events/news/work-plans-ten-t-european-coordinators-published-2026-09-30_en",
      claimText: "The 2026 TEN-T European Transport Corridor work plans document progress to date, remaining investment needs, infrastructure-compliance gaps and persistent bottlenecks across the European transport network.",
      sourceVersion: "TEN-T-WORKPLANS-20260930",
      freshnessState: "FRESH",
      supportLevel: "DIRECT_OFFICIAL_SYNTHESIS",
      dossierId: "DOSSIER-EU",
      entity: {
        en: "European Union",
        zhHans: "\u6B27\u76DF"
      },
      retrievedAt: "2026-10-08T06:58:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "EU-TECHNOLOGY-2026-001",
      laneId: "TECHNOLOGY",
      sourceId: "EU-DIGITAL-DECADE-2026",
      authorityClass: "GOVERNMENT",
      publishedAt: "2026-06-17T00:00:00.000Z",
      sourceUrl: "https://commission.europa.eu/news-and-media/news/state-digital-decade-report-progress-made-gaps-remain-2026-06-17_en",
      claimText: "The 2026 State of the Digital Decade reports basic 5G coverage of 96.8% of EU households, while fibre deployment, semiconductors and computing capacity remain below 2030 targets.",
      sourceVersion: "DIGITAL-DECADE-2026-20260617",
      freshnessState: "FRESH_UNTIL_SUPERSEDED",
      supportLevel: "DIRECT_OFFICIAL_SYNTHESIS",
      dossierId: "DOSSIER-EU",
      entity: {
        en: "European Union",
        zhHans: "\u6B27\u76DF"
      },
      retrievedAt: "2026-10-08T06:58:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "EU-EXTERNAL-DEPENDENCY-2026-001",
      laneId: "EXTERNAL_DEPENDENCY",
      sourceId: "EU-EUROSTAT-ENERGY-2026",
      authorityClass: "OFFICIAL_PRIMARY",
      publishedAt: "2026-03-18T00:00:00.000Z",
      sourceUrl: "https://ec.europa.eu/eurostat/en/web/products-eurostat-news/w/wdn-20260318-1",
      claimText: "The EU energy-import dependency rate was 57% in 2024, meaning that nearly 60% of EU energy needs were met by net imports; oil and petroleum products accounted for 67% of energy imports and natural gas for 24%.",
      sourceVersion: "EUROSTAT-ENERGY-DEPENDENCY-2026",
      freshnessState: "FRESH_UNTIL_SUPERSEDED",
      supportLevel: "DIRECT",
      dossierId: "DOSSIER-EU",
      entity: {
        en: "European Union",
        zhHans: "\u6B27\u76DF"
      },
      retrievedAt: "2026-10-08T06:58:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "EU-CARRIER-STRUCTURE-2026-001",
      laneId: "CARRIER_STRUCTURE",
      sourceId: "EU-ECB-TARGET-AR-2025",
      authorityClass: "REGULATOR",
      publishedAt: "2026-06-12T00:00:00.000Z",
      sourceUrl: "https://www.ecb.europa.eu/press/targetservar/html/ecb.targetservar2025.en.html",
      claimText: "TARGET Services operated at large scale in 2025: T2 averaged 431,067 euro payments per day, T2S 922,533 transactions, and euro TIPS 2,735,053 instant-payment transactions; ECMS completed the integrated TARGET Services suite.",
      sourceVersion: "ECB-TARGET-SERVICES-AR-2025-20260612",
      freshnessState: "FRESH_UNTIL_SUPERSEDED",
      supportLevel: "DIRECT",
      dossierId: "DOSSIER-EU",
      entity: {
        en: "European Union",
        zhHans: "\u6B27\u76DF"
      },
      retrievedAt: "2026-10-08T06:58:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "EU-PRESSURE-FIELD-2026-001",
      laneId: "PRESSURE_FIELD",
      sourceId: "EU-EUROSTAT-PPI-AUG-2026",
      authorityClass: "OFFICIAL_PRIMARY",
      publishedAt: "2026-10-05T00:00:00.000Z",
      sourceUrl: "https://ec.europa.eu/eurostat/en/web/products-euro-indicators/w/4-05102026-ap",
      claimText: "In August 2026, EU industrial producer prices rose 1.9% month on month and 8.0% year on year; the energy component increased 5.6% month on month, evidencing active industrial cost pressure.",
      sourceVersion: "EUROSTAT-PPI-2026-08-20261005",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      dossierId: "DOSSIER-EU",
      entity: {
        en: "European Union",
        zhHans: "\u6B27\u76DF"
      },
      retrievedAt: "2026-10-08T06:58:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "EU-ENERGY-RECONFIGURATION-2026-001",
      laneId: "EXTERNAL_DEPENDENCY",
      sourceId: "EU-EUROSTAT-ENERGY-IMPORTS-2025",
      authorityClass: "OFFICIAL_PRIMARY",
      publishedAt: "2026-03-25T00:00:00.000Z",
      sourceUrl: "https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20260325-3",
      claimText: "EU energy imports continued to shift in 2025: total energy-import value fell 11.1%, petroleum-oil volume fell 6.1%, while LNG volume rose 24.4%.",
      sourceVersion: "EUROSTAT-ENERGY-IMPORTS-2025-20260325",
      freshnessState: "FRESH_UNTIL_SUPERSEDED",
      admissionDecision: "REFERENCE_ONLY",
      reason: "Directly supports an ongoing change in supply composition, but by itself does not establish a full P3 continuity/reconfiguration mechanism across the whole EU energy system.",
      dossierId: "DOSSIER-EU",
      entity: {
        en: "European Union",
        zhHans: "\u6B27\u76DF"
      },
      retrievedAt: "2026-10-08T06:58:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      evidenceState: "REFERENCE_ONLY",
      rreEligibility: "REFERENCE_ONLY"
    }
  ],
  counts: {
    totalClaims: 8,
    admittedClaims: 7,
    admittedUniqueSources: 7,
    rejected: 0,
    stale: 0,
    scopeMismatch: 0,
    entityMismatch: 0,
    insufficientAuthority: 0,
    referenceOnly: 1,
    rreEligible: 7
  },
  conflictsAndUnknowns: [
    "EU aggregate evidence masks substantial differences in population ageing, energy mix, infrastructure compliance and industrial conditions across Member States.",
    "High 5G coverage does not establish equivalent fibre, semiconductor or computing-capacity maturity.",
    "TARGET Services operate at euro-area/Eurosystem scale and are used as an EU-system carrier observation only within their actual institutional scope; they do not imply uniform participation conditions across every EU activity.",
    "Energy-import dependence and 2026 producer-price pressure do not establish deterministic economic decline."
  ],
  boundary: "Admission preserves authority, entity, time and scope matching. Evidence count is not voting and no grammar/domain/RP semantics are admitted at W8-C."
};

// content/civilization-atlas/reconfiguration/dossier-in-w8c-current-authority-admission-v1.json
var dossier_in_w8c_current_authority_admission_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-IN-W8C-CURRENT-AUTHORITY-ADMISSION-v1.0.0",
  status: "REQUIRED_LANES_ADMITTED",
  dossierId: "DOSSIER-IN",
  stage: "W8-C",
  asOfDate: "2026-10-08",
  requiredLaneIds: [
    "DEMOGRAPHY",
    "INDUSTRY",
    "INFRASTRUCTURE",
    "TECHNOLOGY",
    "EXTERNAL_DEPENDENCY",
    "CARRIER_STRUCTURE",
    "PRESSURE_FIELD"
  ],
  admittedLaneIds: [
    "DEMOGRAPHY",
    "INDUSTRY",
    "INFRASTRUCTURE",
    "TECHNOLOGY",
    "EXTERNAL_DEPENDENCY",
    "CARRIER_STRUCTURE",
    "PRESSURE_FIELD"
  ],
  records: [
    {
      claimId: "IN-DEMOGRAPHY-2026-001",
      laneId: "DEMOGRAPHY",
      sourceId: "IN-ECONOMIC-SURVEY-DEMOGRAPHY-2025-26",
      authorityClass: "GOVERNMENT",
      publishedAt: "2026-01-29T00:00:00.000Z",
      sourceUrl: "https://www.indiabudget.gov.in/economicsurvey/",
      claimText: "India's Economic Survey 2025-26 states that the demographic dividend is expected to peak around 2030, when nearly 65% of the population will be aged 15-59, while fertility decline and rising life expectancy are also moving India gradually toward population ageing.",
      sourceVersion: "ECONOMIC-SURVEY-2025-26-CH12",
      freshnessState: "FRESH_UNTIL_SUPERSEDED",
      supportLevel: "DIRECT_OFFICIAL_SYNTHESIS",
      dossierId: "DOSSIER-IN",
      entity: {
        en: "India",
        zhHans: "\u5370\u5EA6"
      },
      retrievedAt: "2026-10-08T06:25:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "IN-INDUSTRY-2026-001",
      laneId: "INDUSTRY",
      sourceId: "IN-MOSPI-IIP-AUG-2026",
      authorityClass: "OFFICIAL_PRIMARY",
      publishedAt: "2026-09-28T16:00:00.000Z",
      sourceUrl: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2315957&lang=1&reg=3",
      claimText: "India's Index of Industrial Production grew 8.0% year on year in August 2026, with manufacturing up 9.0%; manufacturing recorded growth of 8% or more for three consecutive months.",
      sourceVersion: "MOSPI-IIP-2026-08-20260928",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      dossierId: "DOSSIER-IN",
      entity: {
        en: "India",
        zhHans: "\u5370\u5EA6"
      },
      retrievedAt: "2026-10-08T06:25:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "IN-INFRASTRUCTURE-2026-001",
      laneId: "INFRASTRUCTURE",
      sourceId: "IN-RAILWAYS-GCT-JUL-2026",
      authorityClass: "GOVERNMENT",
      publishedAt: "2026-07-23T17:14:00.000Z",
      sourceUrl: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2288380&lang=1&reg=20",
      claimText: "By July 2026, 142 Gati Shakti Cargo Terminals were operational with 224 MTPA freight-handling capacity and about \u20B910,000 crore private investment; 310 additional terminals had been approved.",
      sourceVersion: "RAILWAYS-GCT-20260723",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      dossierId: "DOSSIER-IN",
      entity: {
        en: "India",
        zhHans: "\u5370\u5EA6"
      },
      retrievedAt: "2026-10-08T06:25:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "IN-TECHNOLOGY-2026-001",
      laneId: "TECHNOLOGY",
      sourceId: "IN-MEITY-DIGITAL-INFRA-AUG-2026",
      authorityClass: "GOVERNMENT",
      publishedAt: "2026-08-06T18:07:00.000Z",
      sourceUrl: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2295635&lang=1&reg=48",
      claimText: "As of August 2026, 2.21 lakh Gram Panchayats were service-ready under BharatNet and 5.01 lakh Common Service Centres were delivering digital services nationwide.",
      sourceVersion: "MEITY-DIGITAL-INFRA-20260806",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      dossierId: "DOSSIER-IN",
      entity: {
        en: "India",
        zhHans: "\u5370\u5EA6"
      },
      retrievedAt: "2026-10-08T06:25:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "IN-EXTERNAL-DEPENDENCY-2026-001",
      laneId: "EXTERNAL_DEPENDENCY",
      sourceId: "IN-MOPNG-SAMUDRA-MANTHAN-2026",
      authorityClass: "GOVERNMENT",
      publishedAt: "2026-08-03T18:02:00.000Z",
      sourceUrl: "https://www.pib.gov.in/PressNoteDetails.aspx?ModuleId=3&NoteId=159415&lang=2&reg=48",
      claimText: "India is the world's third-largest crude-oil consumer and carries an annual crude-oil import bill of nearly USD 144 billion; the government identifies reducing oil and gas import dependence as a central energy-security objective.",
      sourceVersion: "MOPNG-SAMUDRA-MANTHAN-20260803",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      dossierId: "DOSSIER-IN",
      entity: {
        en: "India",
        zhHans: "\u5370\u5EA6"
      },
      retrievedAt: "2026-10-08T06:25:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "IN-CARRIER-STRUCTURE-2026-001",
      laneId: "CARRIER_STRUCTURE",
      sourceId: "IN-UPI-10Y-AUG-2026",
      authorityClass: "GOVERNMENT",
      publishedAt: "2026-08-24T13:57:00.000Z",
      sourceUrl: "https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2302657&lang=1&reg=3",
      claimText: "UPI processed over 24,162 crore transactions worth about \u20B9314 lakh crore in FY 2025-26, with 703 banks live on the platform, evidencing a large-scale operating digital payments carrier.",
      sourceVersion: "UPI-10Y-20260824",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      dossierId: "DOSSIER-IN",
      entity: {
        en: "India",
        zhHans: "\u5370\u5EA6"
      },
      retrievedAt: "2026-10-08T06:25:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "IN-PRESSURE-FIELD-2026-001",
      laneId: "PRESSURE_FIELD",
      sourceId: "IN-WPI-AUG-2026",
      authorityClass: "GOVERNMENT",
      publishedAt: "2026-09-14T12:01:00.000Z",
      sourceUrl: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2309977&lang=2&reg=48",
      claimText: "India's August 2026 wholesale-price inflation was 9.92% year on year, while Fuel and Power inflation reached 22.93%, indicating an active cost pressure on the current production and energy runtime.",
      sourceVersion: "WPI-2026-08-20260914",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      dossierId: "DOSSIER-IN",
      entity: {
        en: "India",
        zhHans: "\u5370\u5EA6"
      },
      retrievedAt: "2026-10-08T06:25:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "IN-EXTERNAL-CONTEXT-2025-001",
      laneId: "EXTERNAL_DEPENDENCY",
      sourceId: "IN-MOPNG-OALP-APR-2025",
      authorityClass: "GOVERNMENT",
      publishedAt: "2025-04-15T20:12:00.000Z",
      sourceUrl: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2121952&lang=2&reg=48",
      claimText: "In April 2025 the Ministry of Petroleum and Natural Gas stated that India relied on imports for 88% of crude oil and 50% of natural gas needs.",
      sourceVersion: "MOPNG-OALP-20250415",
      freshnessState: "CURRENT_CONTEXT_NOT_PRIMARY",
      admissionDecision: "REFERENCE_ONLY",
      reason: "Strong structural dependency context but older than the preferred 2026 current-evidence claim; retained as corroborating context rather than primary W8-C admission.",
      dossierId: "DOSSIER-IN",
      retrievedAt: "2026-10-08T06:25:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      evidenceState: "NOT_PRIMARY_ADMISSION",
      rreEligibility: "REFERENCE_ONLY"
    }
  ],
  counts: {
    totalClaims: 8,
    admittedClaims: 7,
    admittedUniqueSources: 7,
    rejected: 0,
    stale: 0,
    scopeMismatch: 0,
    entityMismatch: 0,
    insufficientAuthority: 0,
    referenceOnly: 1,
    rreEligible: 7
  },
  conflictsAndUnknowns: [
    "Demographic advantage is transitional: a large working-age population coexists with declining fertility and gradual ageing.",
    "Current industrial growth does not establish uniform growth across all sectors or states.",
    "Digital carrier scale does not imply equal digital access or service quality across all populations.",
    "High fuel-price pressure and crude-import exposure do not establish deterministic collapse or a single economy-wide constraint state."
  ],
  boundary: "Admission preserves authority, entity, time and scope matching. Evidence count is not voting and no grammar/domain/RP semantics are admitted at W8-C."
};

// content/civilization-atlas/reconfiguration/dossier-jp-w8c-current-authority-admission-v1.json
var dossier_jp_w8c_current_authority_admission_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-JP-W8C-CURRENT-AUTHORITY-ADMISSION-v1.0.0",
  status: "REQUIRED_LANES_ADMITTED",
  dossierId: "DOSSIER-JP",
  stage: "W8-C",
  asOfDate: "2026-10-08",
  admittedLaneIds: [
    "DEMOGRAPHY",
    "INDUSTRY",
    "INFRASTRUCTURE",
    "TECHNOLOGY",
    "EXTERNAL_DEPENDENCY",
    "CARRIER_STRUCTURE",
    "PRESSURE_FIELD"
  ],
  records: [
    {
      claimId: "JP-DEMOGRAPHY-2026-001",
      dossierId: "DOSSIER-JP",
      laneId: "DEMOGRAPHY",
      sourceUrl: "https://www.stat.go.jp/data/topics/topi1490.html",
      claimText: "Japan's population aged 65 and over reached 36.24 million in 2026, equal to 29.6% of the total population and a record high; employment among people aged 65 and over also reached a record high.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "FRESH_OR_CURRENT_STRUCTURAL_BASELINE"
    },
    {
      claimId: "JP-INDUSTRY-2026-001",
      dossierId: "DOSSIER-JP",
      laneId: "INDUSTRY",
      sourceUrl: "https://www.meti.go.jp/statistics/toppage/report/archive/kako/20260630_1.html",
      claimText: "Japan's industrial production index rose 0.5% month on month in May 2026 to 103.0, its second consecutive increase, while METI maintained the assessment that production was moving back and forth rather than in sustained expansion.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "FRESH_OR_CURRENT_STRUCTURAL_BASELINE"
    },
    {
      claimId: "JP-INFRASTRUCTURE-2026-001",
      dossierId: "DOSSIER-JP",
      laneId: "INFRASTRUCTURE",
      sourceUrl: "https://www.mlit.go.jp/report/press/port02_hh_000231.html",
      claimText: "MLIT issued September 2026 guidelines to accelerate automation and remote operation of port cargo-handling equipment in response to labour shortages and continuity concerns in port logistics.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "FRESH_OR_CURRENT_STRUCTURAL_BASELINE"
    },
    {
      claimId: "JP-TECHNOLOGY-2026-001",
      dossierId: "DOSSIER-JP",
      laneId: "TECHNOLOGY",
      sourceUrl: "https://www.mlit.go.jp/report/press/kanbo08_hh_001361.html",
      claimText: "MLIT adopted a 2026 infrastructure AI implementation policy and interim physical-AI strategy for construction, aimed at implementation and productivity in infrastructure operations.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "FRESH_OR_CURRENT_STRUCTURAL_BASELINE"
    },
    {
      claimId: "JP-EXTERNAL-DEPENDENCY-2026-001",
      dossierId: "DOSSIER-JP",
      laneId: "EXTERNAL_DEPENDENCY",
      sourceUrl: "https://www.enecho.meti.go.jp/about/whitepaper/2025/html/2-1-1.html",
      claimText: "Japan relies on overseas imports for almost all oil and natural gas, with around 90% of crude oil imports sourced from the Middle East, creating an ongoing supply-security dependency.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "FRESH_OR_CURRENT_STRUCTURAL_BASELINE"
    },
    {
      claimId: "JP-CARRIER-STRUCTURE-2026-001",
      dossierId: "DOSSIER-JP",
      laneId: "CARRIER_STRUCTURE",
      sourceUrl: "https://www.boj.or.jp/en/statistics/set/kess/release/2026/kess2608.pdf",
      claimText: "BOJ payment and settlement statistics show BOJ-NET and the Zengin System continuing to operate at large scale; the 2025 baseline recorded 94,602 BOJ-NET current-account settlements per business day with average value of 232.6 trillion yen.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "FRESH_OR_CURRENT_STRUCTURAL_BASELINE"
    },
    {
      claimId: "JP-PRESSURE-FIELD-2026-001",
      dossierId: "DOSSIER-JP",
      laneId: "PRESSURE_FIELD",
      sourceUrl: "https://www.stat.go.jp/data/cpi/sokuhou/tsuki/index-z.html",
      claimText: "Japan's August 2026 CPI rose 1.9% year on year overall and 1.7% excluding fresh food, indicating ongoing price pressure even as headline inflation moderated.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "FRESH_OR_CURRENT_STRUCTURAL_BASELINE"
    },
    {
      claimId: "JP-INFRA-AUTOMATION-CONTINUITY-2026-001",
      dossierId: "DOSSIER-JP",
      laneId: "INFRASTRUCTURE",
      sourceUrl: "https://www.mlit.go.jp/report/press/port02_hh_000231.html",
      claimText: "Port automation is explicitly framed as a response to labour shortages threatening stable cargo-handling continuity.",
      admissionDecision: "REFERENCE_ONLY",
      evidenceState: "REFERENCE_ONLY",
      rreEligibility: "REFERENCE_ONLY",
      reason: "Supports adaptation/continuity context but not a complete whole-system P3 continuity mechanism."
    }
  ],
  counts: {
    totalClaims: 8,
    admittedClaims: 7,
    admittedUniqueSources: 7,
    rejected: 0,
    stale: 0,
    scopeMismatch: 0,
    entityMismatch: 0,
    insufficientAuthority: 0,
    referenceOnly: 1,
    rreEligible: 7
  },
  boundary: "Evidence count is not voting; no grammar/domain/RP semantics are admitted at W8-C."
};

// content/civilization-atlas/reconfiguration/dossier-kr-w8c-current-authority-admission-v1.json
var dossier_kr_w8c_current_authority_admission_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-KR-W8C-CURRENT-AUTHORITY-ADMISSION-v1.0.0",
  status: "REQUIRED_LANES_ADMITTED",
  dossierId: "DOSSIER-KR",
  stage: "W8-C",
  asOfDate: "2026-10-08",
  admittedLaneIds: [
    "DEMOGRAPHY",
    "INDUSTRY",
    "INFRASTRUCTURE",
    "TECHNOLOGY",
    "EXTERNAL_DEPENDENCY",
    "CARRIER_STRUCTURE",
    "PRESSURE_FIELD"
  ],
  records: [
    {
      claimId: "KR-DEMOGRAPHY-2026-001",
      dossierId: "DOSSIER-KR",
      laneId: "DEMOGRAPHY",
      sourceId: "KR-KOSTAT-ELDERLY-2025",
      authorityClass: "OFFICIAL_PRIMARY",
      sourceUrl: "https://kostat.go.kr/board.es?act=view&bid=10820&list_no=438832&mid=a10301060100",
      claimText: "Statistics Korea reported that people aged 65 and over accounted for 20.3% of Korea's population in 2025, marking an established super-aged population structure.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "CURRENT_STRUCTURAL_BASELINE"
    },
    {
      claimId: "KR-INDUSTRY-2026-001",
      dossierId: "DOSSIER-KR",
      laneId: "INDUSTRY",
      sourceId: "KR-BOK-OUTLOOK-AUG-2026",
      authorityClass: "REGULATOR",
      sourceUrl: "https://www.bok.or.kr/eng/bbs/E0000634/view.do?menuNo=400423&nttId=11064205",
      claimText: "The Bank of Korea's August 2026 outlook states that Korea's semiconductor boom continues and its spillover effects are broadening, supporting high 2026 growth despite external uncertainty.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "FRESH"
    },
    {
      claimId: "KR-INFRASTRUCTURE-2026-001",
      dossierId: "DOSSIER-KR",
      laneId: "INFRASTRUCTURE",
      sourceId: "KR-MOLIT-AUTOMATED-FREIGHT-2026",
      authorityClass: "GOVERNMENT",
      sourceUrl: "https://www.molit.go.kr/english/USR/BORD0201/m_28286/DTL.jsp?id=eng_mltm_new&idx=3367&mode=view",
      claimText: "MOLIT authorized Korea's first freight-transport permit using automated trucks on expressways beginning in June 2026, showing active implementation of AI-enabled logistics infrastructure.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "FRESH"
    },
    {
      claimId: "KR-TECHNOLOGY-2026-001",
      dossierId: "DOSSIER-KR",
      laneId: "TECHNOLOGY",
      sourceId: "KR-BOK-PAYMENT-REPORT-2025-2026",
      authorityClass: "REGULATOR",
      sourceUrl: "https://www.bok.or.kr/eng/bbs/E0000866/view.do?depth=400223&menuNo=400223&nttId=11064840",
      claimText: "In 2026 the Bank of Korea extended BOK-Wire+ operating hours, advanced BOK-Wire Int and ISO 20022 adoption, and supported new cross-border QR payment connectivity, evidencing active modernization of core payment technology.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "FRESH"
    },
    {
      claimId: "KR-EXTERNAL-DEPENDENCY-2026-001",
      dossierId: "DOSSIER-KR",
      laneId: "EXTERNAL_DEPENDENCY",
      sourceId: "KR-KEA-ENERGY-IMPORT-DEPENDENCE",
      authorityClass: "GOVERNMENT",
      sourceUrl: "https://tips.energy.or.kr/statistics/statistics_view0210.do",
      claimText: "Korea's energy import dependence was 93.7% in the latest 2024 provisional annual series, with KESIS December 2025 energy-flow data still showing dependence on imports above 93%.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "CURRENT_STRUCTURAL_BASELINE"
    },
    {
      claimId: "KR-CARRIER-STRUCTURE-2026-001",
      dossierId: "DOSSIER-KR",
      laneId: "CARRIER_STRUCTURE",
      sourceId: "KR-BOK-PAYMENT-CARRIER-2026",
      authorityClass: "REGULATOR",
      sourceUrl: "https://www.bok.or.kr/portal/main/contents.do?menuNo=200727",
      claimText: "BOK-Wire+ remains Korea's only large-value settlement system and provides final settlement for interbank funds transfers, retail-payment obligations, securities settlement and foreign-exchange PvP flows.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "CURRENT"
    },
    {
      claimId: "KR-PRESSURE-FIELD-2026-001",
      dossierId: "DOSSIER-KR",
      laneId: "PRESSURE_FIELD",
      sourceId: "KR-BOK-OUTLOOK-AUG-2026",
      authorityClass: "REGULATOR",
      sourceUrl: "https://www.bok.or.kr/eng/bbs/E0000634/view.do?menuNo=400423&nttId=11064205",
      claimText: "The Bank of Korea projects 2026 CPI inflation at 2.7% and identifies continuing cost-shock pass-through and Middle East uncertainty as major current risks to Korea's economic path.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "FRESH"
    },
    {
      claimId: "KR-DEMOGRAPHIC-ADAPTATION-2026-001",
      dossierId: "DOSSIER-KR",
      laneId: "DEMOGRAPHY",
      sourceId: "KR-KOSTAT-ELDERLY-LABOUR-2025",
      authorityClass: "OFFICIAL_PRIMARY",
      sourceUrl: "https://kostat.go.kr/board.es?act=view&bid=210&list_no=437914&mid=a10301010000",
      claimText: "Korea's older population remains highly engaged in labour markets, with 55-79 employment participation and desired working ages extending well beyond conventional retirement ages.",
      admissionDecision: "REFERENCE_ONLY",
      evidenceState: "REFERENCE_ONLY",
      rreEligibility: "REFERENCE_ONLY",
      reason: "Supports demographic adaptation context but does not establish a complete P3 continuity mechanism across labour, welfare and industrial systems."
    }
  ],
  counts: {
    totalClaims: 8,
    admittedClaims: 7,
    admittedUniqueSources: 6,
    rejected: 0,
    stale: 0,
    scopeMismatch: 0,
    entityMismatch: 0,
    insufficientAuthority: 0,
    referenceOnly: 1,
    rreEligible: 7
  },
  conflictsAndUnknowns: [
    "Semiconductor-led growth is strong but does not imply uniform industrial strength across all sectors.",
    "High energy-import dependence is structural, while current price transmission varies with exchange rates, fuel mix and policy response.",
    "Payment infrastructure is mature and expanding internationally, but payment modernization does not by itself establish whole-economy digital maturity.",
    "Population ageing is established, but a complete cross-system adaptation mechanism is not yet demonstrated."
  ],
  boundary: "Evidence count is not voting; no grammar/domain/RP semantics are admitted at W8-C."
};

// content/civilization-atlas/reconfiguration/dossier-latam-w8c-current-authority-admission-v1.json
var dossier_latam_w8c_current_authority_admission_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-LATAM-W8C-CURRENT-AUTHORITY-ADMISSION-v1.0.0",
  status: "REQUIRED_LANES_ADMITTED",
  dossierId: "DOSSIER-LATAM",
  stage: "W8-C",
  asOfDate: "2026-10-08",
  admittedLaneIds: [
    "DEMOGRAPHY",
    "INDUSTRY",
    "INFRASTRUCTURE",
    "TECHNOLOGY",
    "EXTERNAL_DEPENDENCY",
    "CARRIER_STRUCTURE",
    "PRESSURE_FIELD"
  ],
  records: [
    {
      claimId: "LATAM-DEMOGRAPHY-2026-001",
      laneId: "DEMOGRAPHY",
      source: "ECLAC Demographic Change 2026",
      url: "https://www.cepal.org/en/publications/90226-impacts-demographic-change-latin-america-and-caribbean-public-policy-challenges",
      text: "Latin America and the Caribbean is undergoing declining fertility, increasing life expectancy, rapid population ageing, changing household structures and significant migration.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "LATAM-INDUSTRY-2026-001",
      laneId: "INDUSTRY",
      source: "World Bank LAC Economic Update Oct 2026",
      url: "https://www.worldbank.org/en/news/press-release/2026/10/06/latin-america-caribbean-economic-update",
      text: "Latin America and the Caribbean is projected to grow 2.2% in 2026, with country performance diverging and productivity, investment and policy quality determining stronger outcomes.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "LATAM-INFRASTRUCTURE-2026-001",
      laneId: "INFRASTRUCTURE",
      source: "IDB Infrastructure Gaps LAC 2021-2026",
      url: "https://publications.iadb.org/en/eppur-si-muove-evolution-infrastructure-gaps-lac-2021-2026",
      text: "LAC continues to face material infrastructure gaps across transport, electricity, water and telecommunications despite measurable progress since 2021.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "LATAM-TECHNOLOGY-2026-001",
      laneId: "TECHNOLOGY",
      source: "GSMA Mobile Economy Latin America 2026",
      url: "https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-economy/latam/",
      text: "Mobile technologies and services generated about USD 600 billion in Latin America in 2025, equivalent to 8.6% of GDP, while 5G, AI, cloud and data-centre investment continue to expand.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "LATAM-EXTERNAL-DEPENDENCY-2026-001",
      laneId: "EXTERNAL_DEPENDENCY",
      source: "IMF Western Hemisphere REO Apr 2026",
      url: "https://www.imf.org/en/publications/reo/wh/issues/2026/04/17/regional-economic-outlook-western-hemisphere-april-2026",
      text: "The Middle East energy shock affects Latin American countries asymmetrically: oil producers benefit while energy/food importers with high debt, low reserves and external-financing reliance face clear negative impacts.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "LATAM-CARRIER-STRUCTURE-2026-001",
      laneId: "CARRIER_STRUCTURE",
      source: "GSMA Latin America 2026 / regional digital networks",
      url: "https://www.gsma.com/about-us/regions/latin-america-and-the-caribbean/gsma_resources/the-mobile-economy-latin-america-2026/",
      text: "Latin America's mobile networks, digital payments, cloud and increasingly software-defined infrastructure form a large-scale operating digital carrier layer across the region.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "LATAM-PRESSURE-FIELD-2026-001",
      laneId: "PRESSURE_FIELD",
      source: "World Bank / IMF LAC 2026",
      url: "https://www.worldbank.org/en/news/press-release/2026/04/08/lac-economic-update-april-2026",
      text: "High borrowing costs, weak external demand, geopolitical uncertainty and limited fiscal space continue to constrain investment and policy flexibility across the region.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "LATAM-DEMOGRAPHIC-CONTINUITY-2026-001",
      laneId: "DEMOGRAPHY",
      source: "ECLAC demographic transition 2026",
      url: "https://www.cepal.org/en/pressreleases/rapid-and-profound-demographic-changes-latin-america-and-caribbean-public-policies-are",
      text: "Population ageing, low fertility and migration require new long-term governance and social-protection architectures.",
      admissionDecision: "REFERENCE_ONLY",
      reason: "Supports continuity/adaptation context but does not establish one region-wide P3 mechanism."
    }
  ],
  counts: {
    totalClaims: 8,
    admittedClaims: 7,
    admittedUniqueSources: 7,
    referenceOnly: 1,
    rreEligible: 7
  },
  conflictsAndUnknowns: [
    "Regional averages conceal large country-level differences in growth, fiscal space and commodity exposure.",
    "Digital scale does not imply equal productive use or connectivity quality.",
    "Commodity exporters and importers experience external shocks differently."
  ],
  boundary: "Evidence count is not voting; no RP is admitted at W8-C."
};

// content/civilization-atlas/reconfiguration/dossier-me-w8c-current-authority-admission-v1.json
var dossier_me_w8c_current_authority_admission_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-ME-W8C-CURRENT-AUTHORITY-ADMISSION-v1.0.0",
  status: "REQUIRED_LANES_ADMITTED",
  dossierId: "DOSSIER-ME",
  stage: "W8-C",
  asOfDate: "2026-10-08",
  admittedLaneIds: [
    "DEMOGRAPHY",
    "INDUSTRY",
    "INFRASTRUCTURE",
    "TECHNOLOGY",
    "EXTERNAL_DEPENDENCY",
    "CARRIER_STRUCTURE",
    "PRESSURE_FIELD"
  ],
  records: [
    {
      claimId: "ME-DEMOGRAPHY-2026-001",
      laneId: "DEMOGRAPHY",
      source: "UN / regional demographic baseline",
      url: "https://www.un.org/development/desa/pd/content/world-population-highlights-2026-youth-1",
      text: "The Middle East contains sharply different demographic structures, from young and rapidly growing populations to ageing high-income states; demographic heterogeneity must be preserved.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "ME-INDUSTRY-2026-001",
      laneId: "INDUSTRY",
      source: "World Bank MENAAP Economic Update Oct 2026",
      url: "https://www.worldbank.org/en/region/mena/publication/middle-east-north-africa-afghanistan-and-pakistan-economic-update",
      text: "Regional output is projected to contract in 2026 because conflict and disrupted energy/trade routes hit oil production, tourism, aviation and logistics, while some developing oil importers remain more resilient.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "ME-INFRASTRUCTURE-2026-001",
      laneId: "INFRASTRUCTURE",
      source: "IMF Saudi Article IV 2026",
      url: "https://www.imf.org/en/news/articles/2026/07/29/pr26267-saudi-arabia-imf-concludes-2026-aiv",
      text: "Strategic oil and logistics infrastructure, including East-West rerouting capacity, materially reduced losses from shipping disruption, showing functioning regional transport/energy-routing infrastructure.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "ME-TECHNOLOGY-2026-001",
      laneId: "TECHNOLOGY",
      source: "GSMA MENA 2025 current regional baseline",
      url: "https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-economy/mena/",
      text: "MENA had 308 million mobile internet users and accelerating 5G adoption, with Gulf economies investing heavily in AI, data and digital infrastructure, although readiness remains highly uneven.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "ME-EXTERNAL-DEPENDENCY-2026-001",
      laneId: "EXTERNAL_DEPENDENCY",
      source: "World Bank / IMF 2026 Middle East conflict assessments",
      url: "https://www.worldbank.org/en/news/press-release/2026/10/06/middle-east-conflict-further-weakens-regional-outlook-with-gulf-oil-exporters-hit",
      text: "The near closure of the Strait of Hormuz disrupted energy exports, tourism, aviation and logistics, demonstrating strong dependence on maritime chokepoints and external trade routes.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "ME-CARRIER-STRUCTURE-2026-001",
      laneId: "CARRIER_STRUCTURE",
      source: "Buna Arab Regional Payments",
      url: "https://one.buna.co/",
      text: "Buna operates as a centralized cross-border, multi-currency payment and settlement system supported by Arab central banks, providing a functioning regional financial carrier.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "ME-PRESSURE-FIELD-2026-001",
      laneId: "PRESSURE_FIELD",
      source: "IMF/IEA/WBG joint statements 2026",
      url: "https://www.imf.org/en/news/articles/2026/04/01/pr-26100-joint-statement-by-the-heads-of-the-iea-imf-and-wb-group",
      text: "The 2026 Middle East war generated severe regional energy, transport, trade and inflation shocks, including large disruptions to Hormuz traffic and supply chains.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE"
    },
    {
      claimId: "ME-AI-TRANSITION-2026-001",
      laneId: "TECHNOLOGY",
      source: "World Bank MENAAP Oct 2026",
      url: "https://www.worldbank.org/en/region/mena/publication/middle-east-north-africa-afghanistan-and-pakistan-economic-update",
      text: "AI adoption is advancing at very different speeds across the region, with Gulf economies moving fastest while fragile economies still face foundational electricity and connectivity gaps.",
      admissionDecision: "REFERENCE_ONLY",
      reason: "Supports transition/reconfiguration context but not a mature cross-region P3 mechanism."
    }
  ],
  counts: {
    totalClaims: 8,
    admittedClaims: 7,
    admittedUniqueSources: 7,
    referenceOnly: 1,
    rreEligible: 7
  },
  conflictsAndUnknowns: [
    "Middle East regional aggregates mask large differences between GCC oil exporters, oil importers and conflict-affected economies.",
    "Buna covers the Arab region and is used as a bounded regional financial-carrier observation, not proof of uniform use across every Middle Eastern economy.",
    "War-related disruptions are current shocks and do not by themselves establish permanent continuity semantics."
  ],
  boundary: "Evidence count is not voting; no RP is admitted at W8-C."
};

// content/civilization-atlas/reconfiguration/dossier-ru-w8c-current-authority-admission-v1.json
var dossier_ru_w8c_current_authority_admission_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-RU-W8C-CURRENT-AUTHORITY-ADMISSION-v1.0.0",
  status: "REQUIRED_LANES_ADMITTED",
  dossierId: "DOSSIER-RU",
  stage: "W8-C",
  asOfDate: "2026-10-08",
  admittedLaneIds: [
    "DEMOGRAPHY",
    "INDUSTRY",
    "INFRASTRUCTURE",
    "TECHNOLOGY",
    "EXTERNAL_DEPENDENCY",
    "CARRIER_STRUCTURE",
    "PRESSURE_FIELD"
  ],
  records: [
    {
      claimId: "RU-DEMOGRAPHY-2026-001",
      dossierId: "DOSSIER-RU",
      laneId: "DEMOGRAPHY",
      sourceId: "RU-ROSSTAT-POP-BASELINE",
      authorityClass: "OFFICIAL_PRIMARY",
      sourceUrl: "https://eng.rosstat.gov.ru/",
      claimText: "Rosstat's current official indicator page gives the resident population estimate at 146.1199 million as of 1 January 2025, the latest headline national population estimate exposed on the current statistics portal.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "CURRENT_STRUCTURAL_BASELINE"
    },
    {
      claimId: "RU-INDUSTRY-2026-001",
      dossierId: "DOSSIER-RU",
      laneId: "INDUSTRY",
      sourceId: "RU-ROSSTAT-IIP-AUG-2026",
      authorityClass: "OFFICIAL_PRIMARY",
      sourceUrl: "https://rosstat.gov.ru/storage/mediabank/146_23-09-2026.html",
      claimText: "Russia's industrial production index in August 2026 was 99.4% of August 2025 and 99.4% of July 2026; January-August 2026 was 100.0% of the same period of 2025, indicating an operating but essentially flat industrial runtime.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "FRESH"
    },
    {
      claimId: "RU-INFRASTRUCTURE-2026-001",
      dossierId: "DOSSIER-RU",
      laneId: "INFRASTRUCTURE",
      sourceId: "RU-GOV-NORTH-SOUTH-MAR-2026",
      authorityClass: "GOVERNMENT",
      sourceUrl: "https://government.ru/en/news/57977/",
      claimText: "The Russian Government and Azerbaijan reaffirmed in March 2026 their intention to continue developing the North-South international transport corridor and regional lines of communication, evidencing active transport-logistics infrastructure coordination.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "FRESH_UNTIL_SUPERSEDED"
    },
    {
      claimId: "RU-TECHNOLOGY-2026-001",
      dossierId: "DOSSIER-RU",
      laneId: "TECHNOLOGY",
      sourceId: "RU-CBR-DIGITAL-RUBLE-LAUNCH-2026",
      authorityClass: "REGULATOR",
      sourceUrl: "https://www.cbr.ru/eng/press/event/?id=32808",
      claimText: "The Bank of Russia launched broad digital-ruble use from 1 September 2026, requiring major banks and large retailers to make infrastructure available for digital-ruble accounts, transfers and payments.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "FRESH"
    },
    {
      claimId: "RU-EXTERNAL-DEPENDENCY-2026-001",
      dossierId: "DOSSIER-RU",
      laneId: "EXTERNAL_DEPENDENCY",
      sourceId: "RU-CBR-BOP-JUL-2026",
      authorityClass: "REGULATOR",
      sourceUrl: "https://www.cbr.ru/eng/statistics/macro_itm/external_sector/pb/bop-eval/",
      claimText: "Russia's January-July 2026 current-account surplus reached USD 33.9 billion and trade surplus USD 79.0 billion, with the increase driven mainly by goods-export growth and global commodity prices, showing material dependence of external-sector performance on export and commodity-market conditions.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "FRESH"
    },
    {
      claimId: "RU-CARRIER-STRUCTURE-2026-001",
      dossierId: "DOSSIER-RU",
      laneId: "CARRIER_STRUCTURE",
      sourceId: "RU-CBR-NPS-Q2-2026",
      authorityClass: "REGULATOR",
      sourceUrl: "https://cbr.ru/eng/Psystem/?Prtid=reestr&ch=Root",
      claimText: "Russia's national payment system had 31 payment systems and 353 money-transfer operators as of 1 January 2026; cashless payments represented 88.4% of retail turnover in Q2 2026, and 520.6 million Mir cards had been issued by 1 July 2026.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "FRESH"
    },
    {
      claimId: "RU-PRESSURE-FIELD-2026-001",
      dossierId: "DOSSIER-RU",
      laneId: "PRESSURE_FIELD",
      sourceId: "RU-CBR-KEY-RATE-SEP-2026",
      authorityClass: "REGULATOR",
      sourceUrl: "https://www.cbr.ru/eng/dkp/mp_dec/decision_key_rate/summary_key_rate_23092026/",
      claimText: "The Bank of Russia kept the key rate at 14% in September 2026 after current price growth accelerated sharply; refinery disruptions and fuel-price increases generated direct and second-round inflation effects, while annual inflation is forecast at 6-7% for 2026.",
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      freshnessState: "FRESH"
    },
    {
      claimId: "RU-EXTERNAL-RECONFIGURATION-2026-001",
      dossierId: "DOSSIER-RU",
      laneId: "EXTERNAL_DEPENDENCY",
      sourceId: "RU-CBR-MPG-2026-2028",
      authorityClass: "REGULATOR",
      sourceUrl: "https://www.cbr.ru/eng/about_br/publ/ondkp/on_2026_2028/",
      claimText: "The Bank of Russia's 2026-2028 monetary-policy baseline states that existing sanctions will continue to constrain exports and imports, while current transport policy continues development of alternative regional corridors.",
      admissionDecision: "REFERENCE_ONLY",
      evidenceState: "REFERENCE_ONLY",
      rreEligibility: "REFERENCE_ONLY",
      reason: "Supports external-trade and routing reconfiguration context but does not by itself establish a complete P3 cross-time adaptation mechanism."
    }
  ],
  counts: {
    totalClaims: 8,
    admittedClaims: 7,
    admittedUniqueSources: 7,
    rejected: 0,
    stale: 0,
    scopeMismatch: 0,
    entityMismatch: 0,
    insufficientAuthority: 0,
    referenceOnly: 1,
    rreEligible: 7
  },
  conflictsAndUnknowns: [
    "Official Russian data provide current operational measures but do not remove uncertainty created by sanctions, wartime conditions or data-access asymmetry.",
    "Industrial production is essentially flat in January-August 2026 even while external trade values and domestic demand remain material.",
    "Payment-system domestic continuity does not establish external financial integration.",
    "Digital-ruble launch establishes activation and implementation, not mature nationwide usage."
  ],
  boundary: "Evidence count is not voting; no grammar/domain/RP semantics are admitted at W8-C."
};

// content/civilization-atlas/reconfiguration/dossier-sea-w8c-current-authority-admission-v1.json
var dossier_sea_w8c_current_authority_admission_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-SEA-W8C-CURRENT-AUTHORITY-ADMISSION-v1.0.0",
  status: "REQUIRED_LANES_ADMITTED",
  dossierId: "DOSSIER-SEA",
  stage: "W8-C",
  asOfDate: "2026-10-08",
  requiredLaneIds: [
    "DEMOGRAPHY",
    "INDUSTRY",
    "INFRASTRUCTURE",
    "TECHNOLOGY",
    "EXTERNAL_DEPENDENCY",
    "CARRIER_STRUCTURE",
    "PRESSURE_FIELD"
  ],
  admittedLaneIds: [
    "DEMOGRAPHY",
    "INDUSTRY",
    "INFRASTRUCTURE",
    "TECHNOLOGY",
    "EXTERNAL_DEPENDENCY",
    "CARRIER_STRUCTURE",
    "PRESSURE_FIELD"
  ],
  records: [
    {
      claimId: "SEA-DEMOGRAPHY-2026-001",
      laneId: "DEMOGRAPHY",
      sourceId: "SEA-ASEANSTATS-POP-2025",
      authorityClass: "OFFICIAL_PRIMARY",
      publishedAt: "2026-04-17T00:00:00.000Z",
      sourceUrl: "https://data.aseanstats.org/",
      claimText: "ASEANstats reports a 2025 ASEAN population of 693.20 million, with the data updated in August 2026.",
      sourceVersion: "ASEANSTATS-DASHBOARD-2025-UPDATED-2026-08",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      dossierId: "DOSSIER-SEA",
      entity: {
        en: "Southeast Asia / ASEAN",
        zhHans: "\u4E1C\u5357\u4E9A\uFF0F\u4E1C\u76DF"
      },
      retrievedAt: "2026-10-08T06:00:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "SEA-INDUSTRY-2026-001",
      laneId: "INDUSTRY",
      sourceId: "SEA-ASEAN-UNCTAD-INVESTMENT-REPORT-2025",
      authorityClass: "OFFICIAL_PRIMARY",
      publishedAt: "2025-10-01T00:00:00.000Z",
      sourceUrl: "https://investmentpolicy.unctad.org/publications/1314/asean-investment-report-2025",
      claimText: "ASEAN FDI inflows rose 8% to USD 226 billion, while manufacturing FDI grew nearly 150% to USD 44 billion, with supply-chain-intensive industries and the digital economy important drivers.",
      sourceVersion: "ASEAN-INVESTMENT-REPORT-2025",
      freshnessState: "FRESH_UNTIL_SUPERSEDED",
      supportLevel: "DIRECT",
      dossierId: "DOSSIER-SEA",
      entity: {
        en: "Southeast Asia / ASEAN",
        zhHans: "\u4E1C\u5357\u4E9A\uFF0F\u4E1C\u76DF"
      },
      retrievedAt: "2026-10-08T06:00:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "SEA-INFRASTRUCTURE-2026-001",
      laneId: "INFRASTRUCTURE",
      sourceId: "SEA-ASEAN-APG-FINANCING-2025",
      authorityClass: "OFFICIAL_PRIMARY",
      publishedAt: "2025-10-15T00:00:00.000Z",
      sourceUrl: "https://asean.org/adb-and-world-bank-group-launch-the-asean-power-grid-financing-initiative-with-the-asean-secretariat-and-the-asean-centre-for-energy-ace/",
      claimText: "ASEAN's Power Grid programme is advancing regional electricity-network connectivity and explicitly includes cross-border connectors, domestic grid upgrades and subsea power cables.",
      sourceVersion: "ASEAN-APG-FINANCING-INITIATIVE-20251015",
      freshnessState: "FRESH_UNTIL_SUPERSEDED",
      supportLevel: "DIRECT",
      dossierId: "DOSSIER-SEA",
      entity: {
        en: "Southeast Asia / ASEAN",
        zhHans: "\u4E1C\u5357\u4E9A\uFF0F\u4E1C\u76DF"
      },
      retrievedAt: "2026-10-08T06:00:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "SEA-TECHNOLOGY-2026-001",
      laneId: "TECHNOLOGY",
      sourceId: "SEA-ASEAN-DEFA-CONCLUSION-2026",
      authorityClass: "OFFICIAL_PRIMARY",
      publishedAt: "2026-06-01T00:00:00.000Z",
      sourceUrl: "https://asean.org/statement-of-the-chairperson-of-the-asean-senior-economic-officials-seom-on-the-conclusion-of-asean-defa-negotiations/",
      claimText: "ASEAN Senior Economic Officials resolved all outstanding DEFA negotiating issues in May 2026, concluding negotiations on ASEAN's first region-wide digital economy agreement aimed at a digitally integrated, secure and interoperable regional economy.",
      sourceVersion: "ASEAN-DEFA-SEOM-CONCLUSION-20260601",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      dossierId: "DOSSIER-SEA",
      entity: {
        en: "Southeast Asia / ASEAN",
        zhHans: "\u4E1C\u5357\u4E9A\uFF0F\u4E1C\u76DF"
      },
      retrievedAt: "2026-10-08T06:00:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "SEA-EXTERNAL-DEPENDENCY-2026-001",
      laneId: "EXTERNAL_DEPENDENCY",
      sourceId: "SEA-IEA-ENERGY-OUTLOOK-2026",
      authorityClass: "ACADEMIC",
      publishedAt: "2026-06-16T00:00:00.000Z",
      sourceUrl: "https://www.iea.org/reports/southeast-asia-energy-outlook-2026/executive-summary",
      claimText: "Before the 2026 energy crisis, about 60% of Southeast Asia's crude oil imports and one-third of its gas imports came from the Middle East, while 45% of oil-product supply was linked to Middle Eastern crude.",
      sourceVersion: "IEA-SOUTHEAST-ASIA-ENERGY-OUTLOOK-2026",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      dossierId: "DOSSIER-SEA",
      entity: {
        en: "Southeast Asia / ASEAN",
        zhHans: "\u4E1C\u5357\u4E9A\uFF0F\u4E1C\u76DF"
      },
      retrievedAt: "2026-10-08T06:00:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "SEA-CARRIER-STRUCTURE-2026-001",
      laneId: "CARRIER_STRUCTURE",
      sourceId: "SEA-ASEAN-UNCTAD-INVESTMENT-REPORT-2025",
      authorityClass: "OFFICIAL_PRIMARY",
      publishedAt: "2025-10-01T00:00:00.000Z",
      sourceUrl: "https://investmentpolicy.unctad.org/publications/1314/asean-investment-report-2025",
      claimText: "The ASEAN Investment Report 2025 documents investment and supply-chain development across ASEAN and identifies supply-chain-intensive industries as a material driver of regional investment growth.",
      sourceVersion: "ASEAN-INVESTMENT-REPORT-2025",
      freshnessState: "FRESH_UNTIL_SUPERSEDED",
      supportLevel: "DIRECT",
      dossierId: "DOSSIER-SEA",
      entity: {
        en: "Southeast Asia / ASEAN",
        zhHans: "\u4E1C\u5357\u4E9A\uFF0F\u4E1C\u76DF"
      },
      retrievedAt: "2026-10-08T06:00:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "SEA-PRESSURE-FIELD-2026-001",
      laneId: "PRESSURE_FIELD",
      sourceId: "SEA-IEA-ENERGY-OUTLOOK-2026",
      authorityClass: "ACADEMIC",
      publishedAt: "2026-06-16T00:00:00.000Z",
      sourceUrl: "https://www.iea.org/reports/southeast-asia-energy-outlook-2026/executive-summary",
      claimText: "The 2026 Middle East energy crisis exposed structural Southeast Asian vulnerabilities from import dependence, limited diversification and concentrated supply routes, with higher energy bills, inflation and fiscal pressure transmitted into regional operation.",
      sourceVersion: "IEA-SOUTHEAST-ASIA-ENERGY-OUTLOOK-2026",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      dossierId: "DOSSIER-SEA",
      entity: {
        en: "Southeast Asia / ASEAN",
        zhHans: "\u4E1C\u5357\u4E9A\uFF0F\u4E1C\u76DF"
      },
      retrievedAt: "2026-10-08T06:00:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: true,
      admissionDecision: "ADMITTED",
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      boundaries: {
        grammarAssigned: false,
        realityDomainAssigned: false,
        runtimePositionAssigned: false,
        predictionCreated: false
      }
    },
    {
      claimId: "SEA-PRESSURE-FIELD-ADB-2026-001",
      laneId: "PRESSURE_FIELD",
      sourceId: "SEA-ADB-ADO-SEPT-2026",
      authorityClass: "ACADEMIC",
      publishedAt: "2026-09-01T00:00:00.000Z",
      sourceUrl: "https://www.adb.org/outlook/editions/september-2026",
      claimText: "ADB's September 2026 Developing Southeast Asia aggregate projects 4.7% growth in 2026 and describes uneven performance and differentiated pressures across economies.",
      sourceVersion: "ADB-ADO-SEPTEMBER-2026",
      freshnessState: "FRESH",
      admissionDecision: "SCOPE_MISMATCH",
      reason: "ADB's 2026 'Developing Southeast Asia' grouping explicitly excludes Singapore, so it is not admitted as whole-DOSSIER-SEA authority for the 11-member ASEAN regional object. It remains contextual evidence only.",
      dossierId: "DOSSIER-SEA",
      retrievedAt: "2026-10-08T06:00:00.000Z",
      entityMatch: true,
      timeMatch: true,
      scopeMatch: false,
      evidenceState: "NOT_ADMITTED",
      rreEligibility: "REFERENCE_ONLY"
    }
  ],
  counts: {
    totalClaims: 8,
    admittedClaims: 7,
    admittedUniqueSources: 5,
    rejected: 0,
    stale: 0,
    scopeMismatch: 1,
    entityMismatch: 0,
    insufficientAuthority: 0,
    rreEligible: 7
  },
  conflictsAndUnknowns: [
    "ASEAN is a regional object with material member-state heterogeneity; aggregate evidence cannot be projected as a uniform national condition.",
    "DEFA negotiation conclusion does not by itself establish mature region-wide digital runtime implementation.",
    "ASEAN Power Grid programme evidence establishes active connectivity development and coordination, not completion of a single fully integrated regional grid.",
    "Current energy vulnerability evidence does not establish a deterministic future transition."
  ],
  boundary: "Admission preserves authority, entity, time and scope matching. Evidence count is not voting and no grammar/domain/RP semantics are admitted at W8-C."
};

// functions/_lib/book6-accepted-current.js
var fail4 = (code) => {
  throw Object.assign(Error(code), { code, status: 409 });
};
function projectAcceptedBook6Current({ accepted, humanDecisions, readout, externalEvidence: externalEvidence2 = [], sourceEvidence = [], asOf = (/* @__PURE__ */ new Date()).toISOString() }) {
  if (accepted?.status !== "ACCEPTED_CURRENT_DOSSIER" || accepted.stage !== "W8-I" || accepted.dossierId !== humanDecisions?.dossierId || humanDecisions.status !== "HUMAN_DECISIONS_RECORDED" || readout?.dossierId !== accepted.dossierId) fail4("BOOK6_ACCEPTED_CURRENT_LINEAGE_REQUIRED");
  const positions = accepted.admittedPositions || [];
  for (const p of positions) {
    if (!humanDecisions.records.some((r) => r.decision === "ACCEPT" && r.candidateId === p.candidateId && r.runtimePositionId === p.runtimePositionId && r.scope === p.scope && r.subsystem === p.subsystem) || !p.grammarId || !p.realityDomainId || p.scope !== "SUBSYSTEM" || !p.evidenceRefs?.length) fail4("BOOK6_POSITION_NOT_HUMAN_ACCEPTED");
    const ref = p.readoutReference || accepted.readoutReference;
    if (!ref || ref.digest !== readout.readoutReference?.digest || ref.code !== readout.readoutReference?.code) fail4("BOOK6_ACCEPTED_READOUT_DIGEST_MISMATCH");
    if (p.evidenceRefs.some((id) => !readout.evidenceRefs?.includes(id))) fail4("BOOK6_ACCEPTED_EVIDENCE_REFERENCE_MISSING");
  }
  const validSources = sourceEvidence.filter((r) => readout.evidenceRefs.includes(r.claimId));
  const covered = new Set(validSources.map((r) => r.claimId)), missingTimestampEvidence = readout.evidenceRefs.filter((id) => !covered.has(id));
  const latest = validSources.map((r) => r.retrievedAt).sort().at(-1) || readout.latestEvidenceAt || null;
  return { ...structuredClone(readout), schemaVersion: "BOOK6_ACCEPTED_CURRENT_CUSTOMER_PROJECTION_V1", dossierId: accepted.dossierId, sourceVersion: accepted.schemaVersion, acceptance: "HUMAN_ACCEPTED_SUBSYSTEM_POSITIONS_ONLY", acceptedAt: accepted.acceptedAt || humanDecisions.decidedAt, acceptedPositions: structuredClone(positions), wholeDossierPosition: "UNKNOWN", unknowns: structuredClone(accepted.preservedUnknowns || accepted.unresolvedSemanticBasis || accepted.preservedReferenceOnly || []), conflicts: structuredClone(accepted.preservedConflicts || []), currentTimestamp: asOf, sourceTimestamp: latest, sourceEvidence: structuredClone(validSources), missingTimestampEvidence, currentness: latest ? "SOURCE_TIMESTAMPS_BOUND_CURRENT_FRESHNESS_NOT_INFERRED" : "CURRENTNESS_UNKNOWN", currentEvidenceRefreshRequired: !latest, currentFreshnessAssessment: "UNKNOWN_UNLESS_SOURCE_SPECIFIC_CURRENT_POLICY_VERIFIED", externalEvidence: structuredClone(externalEvidence2), boundaries: { ...accepted.projectionBoundary, noPositionRederivation: true, noWholeDossierPromotion: true, providerObservationIsNotPositionAuthority: true }, providerCalls: 0 };
}

// content/civilization-atlas/reconfiguration/runtime-position-w8d-rre-readouts-v1.json
var runtime_position_w8d_rre_readouts_v1_default = {
  schemaVersion: "PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8D-RRE-READOUTS-v1.0.0",
  version: "1.0.0",
  status: "RRE_CURRENT_EVIDENCE_CONSUMED",
  work: "PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8D",
  contract: "content/civilization-atlas/reconfiguration/runtime-position-w8d-rre-consumption-contract-v1.json",
  records: [
    {
      dossierId: "DOSSIER-US",
      entity: {
        en: "United States",
        "zh-Hans": "\u7F8E\u56FD"
      },
      state: "RRE_REQUIRED_LANES_CONSUMED",
      dataClass: "DERIVED_RUNTIME_READOUT",
      evidenceRefs: [
        "US-CARRIER-STRUCTURE-2026-001",
        "US-DEMOGRAPHY-2026-001",
        "US-EXTERNAL-DEPENDENCY-2026-001",
        "US-INDUSTRY-2026-001",
        "US-INFRASTRUCTURE-2026-001",
        "US-PRESSURE-FIELD-2026-001",
        "US-TECHNOLOGY-2026-001"
      ],
      sourceIds: [
        "US-BEA-GDP-BY-INDUSTRY-2026Q2",
        "US-BEA-TRADE-GOODS-SERVICES-JULY-2026",
        "US-BTS-NTS-UPDATE-20260930",
        "US-CENSUS-VINTAGE-2025-NATIONAL-STATE",
        "US-FED-FSR-MAY-2026",
        "US-NSF-NSB-SEP-2026-1",
        "US-SBA-FAQ-SMALL-BUSINESS-2026"
      ],
      admittedLaneIds: [
        "CARRIER_STRUCTURE",
        "DEMOGRAPHY",
        "EXTERNAL_DEPENDENCY",
        "INDUSTRY",
        "INFRASTRUCTURE",
        "PRESSURE_FIELD",
        "TECHNOLOGY"
      ],
      requiredLaneIds: [
        "DEMOGRAPHY",
        "INDUSTRY",
        "INFRASTRUCTURE",
        "TECHNOLOGY",
        "EXTERNAL_DEPENDENCY",
        "CARRIER_STRUCTURE",
        "PRESSURE_FIELD"
      ],
      missingRequiredLanes: [],
      evidenceCount: 7,
      latestEvidenceAt: "2026-10-02T02:47:00.000Z",
      readoutReference: {
        code: "RRE-READOUT-B6-US-2026-1-CONTRACT",
        version: "2026.1-contract",
        digest: "bdcd2690aba53b0dee677c7458174a575a9475b947e7e3b50aca67d54b74ffc7"
      },
      confidenceClass: "LOW",
      missingLineageDimensions: [
        "OBSERVATION",
        "PRIOR_READOUT",
        "PROJECTION"
      ],
      resolutionLimitKinds: [
        "MISSING_REQUIRED_INPUT_AUTHORITY"
      ],
      historicalKnowledgeReferences: [
        "RC-19",
        "RC-20",
        "RC-38",
        "RC-39",
        "RC-42",
        "RC-53",
        "RC-54"
      ],
      meaningReferences: [
        "13.25",
        "13.26",
        "13.27",
        "13.51",
        "13.52",
        "13.60"
      ],
      boundaries: {
        currentFactsInvented: false,
        missingEvidenceFilledByInference: false,
        canonicalDossierMutated: false,
        grammarDerived: false,
        realityDomainDerived: false,
        runtimePositionCandidateCreated: false,
        runtimePositionAdmitted: false
      }
    },
    {
      dossierId: "DOSSIER-CN",
      entity: {
        en: "China",
        "zh-Hans": "\u4E2D\u56FD"
      },
      state: "RRE_REQUIRED_LANES_CONSUMED",
      dataClass: "DERIVED_RUNTIME_READOUT",
      evidenceRefs: [
        "CN-CARRIER-STRUCTURE-2026-001",
        "CN-DEMOGRAPHY-2026-001",
        "CN-EXTERNAL-DEPENDENCY-2026-001",
        "CN-INDUSTRY-2026-001",
        "CN-INFRASTRUCTURE-2026-001",
        "CN-PRESSURE-FIELD-2026-001",
        "CN-TECHNOLOGY-2026-001"
      ],
      sourceIds: [
        "CN-GOV-WORK-REPORT-RISK-2026",
        "CN-MOT-LOGISTICS-20260921-27",
        "CN-NBS-1PCT-POP-2025",
        "CN-NBS-INDUSTRY-AUG-2026",
        "CN-NBS-RD-2025-ACHIEVEMENT",
        "CN-NBS-STAT-COMMUNIQUE-2025",
        "CN-SAFE-TRADE-GS-AUG-2026"
      ],
      admittedLaneIds: [
        "CARRIER_STRUCTURE",
        "DEMOGRAPHY",
        "EXTERNAL_DEPENDENCY",
        "INDUSTRY",
        "INFRASTRUCTURE",
        "PRESSURE_FIELD",
        "TECHNOLOGY"
      ],
      requiredLaneIds: [
        "DEMOGRAPHY",
        "INDUSTRY",
        "INFRASTRUCTURE",
        "TECHNOLOGY",
        "EXTERNAL_DEPENDENCY",
        "CARRIER_STRUCTURE",
        "PRESSURE_FIELD"
      ],
      missingRequiredLanes: [],
      evidenceCount: 7,
      latestEvidenceAt: "2026-10-08T04:20:00.000Z",
      readoutReference: {
        code: "RRE-READOUT-B6-CN-2026-1-CONTRACT",
        version: "2026.1-contract",
        digest: "dd903415622cf8390634eeaf758b432489868352eb6a79a5f3e024e67c7fe871"
      },
      confidenceClass: "LOW",
      missingLineageDimensions: [
        "OBSERVATION",
        "PRIOR_READOUT",
        "PROJECTION"
      ],
      resolutionLimitKinds: [
        "MISSING_REQUIRED_INPUT_AUTHORITY"
      ],
      historicalKnowledgeReferences: [
        "RC-02",
        "RC-03",
        "RC-24",
        "RC-43"
      ],
      meaningReferences: [
        "13.15",
        "13.16",
        "13.32",
        "13.33",
        "13.47",
        "13.49"
      ],
      boundaries: {
        currentFactsInvented: false,
        missingEvidenceFilledByInference: false,
        canonicalDossierMutated: false,
        grammarDerived: false,
        realityDomainDerived: false,
        runtimePositionCandidateCreated: false,
        runtimePositionAdmitted: false
      }
    }
  ]
};

// content/civilization-atlas/reconfiguration/moomoo-provider-validated-claims-v1.json
var moomoo_provider_validated_claims_v1_default = {
  schemaVersion: "PHI-OS-MOOMOO-PROVIDER-VALIDATED-CLAIMS-v1.0.0",
  version: "1.0.0",
  status: "PROVIDER_CLAIM_CANDIDATES_VALIDATED",
  work: "PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8A-P2-P3",
  records: [
    {
      claimCandidateId: "MOOMOO-HISTORY-US-SPY-f159349bd998",
      sourceId: "MOOMOO-HISTORY_KLINE-US.SPY-f159349bd998",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI HISTORY_KLINE for US.SPY contains 1000 close observations spanning 2021-01-04 to 2024-12-23, with first observed close 341.586033056 and last observed close 583.23253892.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.SPY close observations 2021-01-04..2024-12-23; snapshot=MOOMOO-US-HISTORY-KLINE-01-US-SPY-2026-10-02T05-57-49-314Z; digest=f159349bd998fa4edbdf89447d6ce6faa04bafb994a77acff2c2b60e929c53d3"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive provider-series claim only. No trend, causality, pressure, constraint, reconfiguration, persistence or continuity interpretation is asserted.",
      observedAt: "2024-12-23T05:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-HISTORY_KLINE-US.SPY-f159349bd998",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.SPY/history-kline",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo HISTORY_KLINE provider snapshot for US.SPY",
        publishedAt: null,
        retrievedAt: "2026-10-02T05:57:49.314Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "f159349bd998fa4edbdf89447d6ce6faa04bafb994a77acff2c2b60e929c53d3"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-HISTORY-US-QQQ-7ed38bb436d6",
      sourceId: "MOOMOO-HISTORY_KLINE-US.QQQ-7ed38bb436d6",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI HISTORY_KLINE for US.QQQ contains 1000 close observations spanning 2021-01-04 to 2024-12-23, with first observed close 298.71961342 and last observed close 518.465518281.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.QQQ close observations 2021-01-04..2024-12-23; snapshot=MOOMOO-US-HISTORY-KLINE-01-US-QQQ-2026-10-02T05-57-49-314Z; digest=7ed38bb436d6fa2180869a5feda125b2c611f806a70beac0683da428be3086d8"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive provider-series claim only. No trend, causality, pressure, constraint, reconfiguration, persistence or continuity interpretation is asserted.",
      observedAt: "2024-12-23T05:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-HISTORY_KLINE-US.QQQ-7ed38bb436d6",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.QQQ/history-kline",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo HISTORY_KLINE provider snapshot for US.QQQ",
        publishedAt: null,
        retrievedAt: "2026-10-02T05:57:49.314Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "7ed38bb436d6fa2180869a5feda125b2c611f806a70beac0683da428be3086d8"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-HISTORY-US-XLK-38b43e0def10",
      sourceId: "MOOMOO-HISTORY_KLINE-US.XLK-38b43e0def10",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI HISTORY_KLINE for US.XLK contains 1000 close observations spanning 2021-01-04 to 2024-12-23, with first observed close 61.281734979 and last observed close 117.874054501.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLK close observations 2021-01-04..2024-12-23; snapshot=MOOMOO-US-HISTORY-KLINE-01-US-XLK-2026-10-02T05-57-49-314Z; digest=38b43e0def100c2f3679ffc5a11981d1acb9dd3c41586020f4f1e07f6bc7b0b3"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive provider-series claim only. No trend, causality, pressure, constraint, reconfiguration, persistence or continuity interpretation is asserted.",
      observedAt: "2024-12-23T05:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-HISTORY_KLINE-US.XLK-38b43e0def10",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.XLK/history-kline",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo HISTORY_KLINE provider snapshot for US.XLK",
        publishedAt: null,
        retrievedAt: "2026-10-02T05:57:49.314Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "38b43e0def100c2f3679ffc5a11981d1acb9dd3c41586020f4f1e07f6bc7b0b3"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-HISTORY-US-XLF-4ffdd091ef10",
      sourceId: "MOOMOO-HISTORY_KLINE-US.XLF-4ffdd091ef10",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI HISTORY_KLINE for US.XLF contains 1000 close observations spanning 2021-01-04 to 2024-12-23, with first observed close 26.350626575 and last observed close 47.178439732.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLF close observations 2021-01-04..2024-12-23; snapshot=MOOMOO-US-HISTORY-KLINE-01-US-XLF-2026-10-02T05-57-49-314Z; digest=4ffdd091ef1064b2add3526eacba101dd6891a5deb8ce807e4b302130de1fc06"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive provider-series claim only. No trend, causality, pressure, constraint, reconfiguration, persistence or continuity interpretation is asserted.",
      observedAt: "2024-12-23T05:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-HISTORY_KLINE-US.XLF-4ffdd091ef10",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.XLF/history-kline",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo HISTORY_KLINE provider snapshot for US.XLF",
        publishedAt: null,
        retrievedAt: "2026-10-02T05:57:49.314Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "4ffdd091ef1064b2add3526eacba101dd6891a5deb8ce807e4b302130de1fc06"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-HISTORY-US-XLI-a06d1db8fb7e",
      sourceId: "MOOMOO-HISTORY_KLINE-US.XLI-a06d1db8fb7e",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI HISTORY_KLINE for US.XLI contains 1000 close observations spanning 2021-01-04 to 2024-12-23, with first observed close 79.414059408 and last observed close 130.276876554.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLI close observations 2021-01-04..2024-12-23; snapshot=MOOMOO-US-HISTORY-KLINE-01-US-XLI-2026-10-02T05-57-49-314Z; digest=a06d1db8fb7ee8596dc12636fc04aa0bb90cb6bebeaa25759a5265a95e77e07d"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive provider-series claim only. No trend, causality, pressure, constraint, reconfiguration, persistence or continuity interpretation is asserted.",
      observedAt: "2024-12-23T05:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-HISTORY_KLINE-US.XLI-a06d1db8fb7e",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.XLI/history-kline",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo HISTORY_KLINE provider snapshot for US.XLI",
        publishedAt: null,
        retrievedAt: "2026-10-02T05:57:49.314Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "a06d1db8fb7ee8596dc12636fc04aa0bb90cb6bebeaa25759a5265a95e77e07d"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-HISTORY-US-XLY-9731ca840f2a",
      sourceId: "MOOMOO-HISTORY_KLINE-US.XLY-9731ca840f2a",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI HISTORY_KLINE for US.XLY contains 1000 close observations spanning 2021-01-04 to 2024-12-23, with first observed close 76.091729709 and last observed close 112.900261557.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLY close observations 2021-01-04..2024-12-23; snapshot=MOOMOO-US-HISTORY-KLINE-01-US-XLY-2026-10-02T05-57-49-314Z; digest=9731ca840f2a4047e8936197e3d696ce0b54af2752291dcb457d0546b51a9df5"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive provider-series claim only. No trend, causality, pressure, constraint, reconfiguration, persistence or continuity interpretation is asserted.",
      observedAt: "2024-12-23T05:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-HISTORY_KLINE-US.XLY-9731ca840f2a",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.XLY/history-kline",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo HISTORY_KLINE provider snapshot for US.XLY",
        publishedAt: null,
        retrievedAt: "2026-10-02T05:57:49.314Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "9731ca840f2a4047e8936197e3d696ce0b54af2752291dcb457d0546b51a9df5"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-HISTORY-US-XLE-e2653235fef6",
      sourceId: "MOOMOO-HISTORY_KLINE-US.XLE-e2653235fef6",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI HISTORY_KLINE for US.XLE contains 1000 close observations spanning 2021-01-04 to 2024-12-23, with first observed close 15.406290419 and last observed close 39.819054007.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLE close observations 2021-01-04..2024-12-23; snapshot=MOOMOO-US-HISTORY-KLINE-01-US-XLE-2026-10-02T05-57-49-314Z; digest=e2653235fef62ac7218caa51b1da78e95581eca64c477b4dd6016f03a6996631"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive provider-series claim only. No trend, causality, pressure, constraint, reconfiguration, persistence or continuity interpretation is asserted.",
      observedAt: "2024-12-23T05:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-HISTORY_KLINE-US.XLE-e2653235fef6",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.XLE/history-kline",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo HISTORY_KLINE provider snapshot for US.XLE",
        publishedAt: null,
        retrievedAt: "2026-10-02T05:57:49.314Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "e2653235fef62ac7218caa51b1da78e95581eca64c477b4dd6016f03a6996631"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-HISTORY-US-XLV-eb3652f6f62f",
      sourceId: "MOOMOO-HISTORY_KLINE-US.XLV-eb3652f6f62f",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI HISTORY_KLINE for US.XLV contains 1000 close observations spanning 2021-01-04 to 2024-12-23, with first observed close 103.002881822 and last observed close 134.681972655.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLV close observations 2021-01-04..2024-12-23; snapshot=MOOMOO-US-HISTORY-KLINE-01-US-XLV-2026-10-02T05-57-49-314Z; digest=eb3652f6f62f0a26e27211ebe9e28b9b615fe5c05b1a141ed756ba32b6d215ff"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive provider-series claim only. No trend, causality, pressure, constraint, reconfiguration, persistence or continuity interpretation is asserted.",
      observedAt: "2024-12-23T05:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-HISTORY_KLINE-US.XLV-eb3652f6f62f",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.XLV/history-kline",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo HISTORY_KLINE provider snapshot for US.XLV",
        publishedAt: null,
        retrievedAt: "2026-10-02T05:57:49.314Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "eb3652f6f62f0a26e27211ebe9e28b9b615fe5c05b1a141ed756ba32b6d215ff"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-SPY-af2addfaea49",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.SPY-af2addfaea49",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI CAPITAL_FLOW for US.SPY contains 251 net-flow observations spanning 2025-10-02 to 2026-10-01, with first observed in_flow 996855751.512 and last observed in_flow 1899603790.752.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.SPY in_flow 2025-10-02..2026-10-01; snapshot=MOOMOO-US-CAPITAL-FLOW-01-US-SPY-2026-10-02T09-35-39-292Z; digest=af2addfaea49da24984b411e3497b680eb379bef624648323bd1ce00e2a18f83"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive capital-flow series claim only. No direction, persistence, causal pressure or allocation interpretation is asserted.",
      observedAt: "2026-10-01T04:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-CAPITAL_FLOW-US.SPY-af2addfaea49",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.SPY/capital-flow/history",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo CAPITAL_FLOW provider snapshot for US.SPY",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "af2addfaea49da24984b411e3497b680eb379bef624648323bd1ce00e2a18f83"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-QQQ-c736b3c5b706",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.QQQ-c736b3c5b706",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI CAPITAL_FLOW for US.QQQ contains 251 net-flow observations spanning 2025-10-02 to 2026-10-01, with first observed in_flow -99924400.547 and last observed in_flow 319462467.954.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.QQQ in_flow 2025-10-02..2026-10-01; snapshot=MOOMOO-US-CAPITAL-FLOW-01-US-QQQ-2026-10-02T09-35-39-292Z; digest=c736b3c5b7066cd269dac69ea8af99915b29b8d31b8dea383f6838a06f9931d4"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive capital-flow series claim only. No direction, persistence, causal pressure or allocation interpretation is asserted.",
      observedAt: "2026-10-01T04:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-CAPITAL_FLOW-US.QQQ-c736b3c5b706",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.QQQ/capital-flow/history",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo CAPITAL_FLOW provider snapshot for US.QQQ",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "c736b3c5b7066cd269dac69ea8af99915b29b8d31b8dea383f6838a06f9931d4"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-XLK-303fde7c04a7",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.XLK-303fde7c04a7",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI CAPITAL_FLOW for US.XLK contains 251 net-flow observations spanning 2025-10-02 to 2026-10-01, with first observed in_flow 3136766.618 and last observed in_flow 49073192.804.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLK in_flow 2025-10-02..2026-10-01; snapshot=MOOMOO-US-CAPITAL-FLOW-01-US-XLK-2026-10-02T09-35-39-292Z; digest=303fde7c04a758c25539c557920e5b3a6492a2997013c520c6a185bda1194ae2"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive capital-flow series claim only. No direction, persistence, causal pressure or allocation interpretation is asserted.",
      observedAt: "2026-10-01T04:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-CAPITAL_FLOW-US.XLK-303fde7c04a7",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.XLK/capital-flow/history",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo CAPITAL_FLOW provider snapshot for US.XLK",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "303fde7c04a758c25539c557920e5b3a6492a2997013c520c6a185bda1194ae2"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-XLF-ef5988702834",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.XLF-ef5988702834",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI CAPITAL_FLOW for US.XLF contains 251 net-flow observations spanning 2025-10-02 to 2026-10-01, with first observed in_flow -1785697.132 and last observed in_flow 85293592.269.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLF in_flow 2025-10-02..2026-10-01; snapshot=MOOMOO-US-CAPITAL-FLOW-01-US-XLF-2026-10-02T09-35-39-292Z; digest=ef59887028344ce6a30fdf458dedfb98f4c51b070a8947e6169686e22c4f3f9f"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive capital-flow series claim only. No direction, persistence, causal pressure or allocation interpretation is asserted.",
      observedAt: "2026-10-01T04:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-CAPITAL_FLOW-US.XLF-ef5988702834",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.XLF/capital-flow/history",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo CAPITAL_FLOW provider snapshot for US.XLF",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "ef59887028344ce6a30fdf458dedfb98f4c51b070a8947e6169686e22c4f3f9f"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-XLI-3d5b79033370",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.XLI-3d5b79033370",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI CAPITAL_FLOW for US.XLI contains 251 net-flow observations spanning 2025-10-02 to 2026-10-01, with first observed in_flow 1987075.573 and last observed in_flow 52663447.278.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLI in_flow 2025-10-02..2026-10-01; snapshot=MOOMOO-US-CAPITAL-FLOW-01-US-XLI-2026-10-02T09-35-39-292Z; digest=3d5b790333700732b5dff29967565828571cba8ea91bddfbf975c699511cf046"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive capital-flow series claim only. No direction, persistence, causal pressure or allocation interpretation is asserted.",
      observedAt: "2026-10-01T04:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-CAPITAL_FLOW-US.XLI-3d5b79033370",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.XLI/capital-flow/history",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo CAPITAL_FLOW provider snapshot for US.XLI",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "3d5b790333700732b5dff29967565828571cba8ea91bddfbf975c699511cf046"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-XLY-214848ca8020",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.XLY-214848ca8020",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI CAPITAL_FLOW for US.XLY contains 251 net-flow observations spanning 2025-10-02 to 2026-10-01, with first observed in_flow 7864067.558 and last observed in_flow -22343931.89.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLY in_flow 2025-10-02..2026-10-01; snapshot=MOOMOO-US-CAPITAL-FLOW-01-US-XLY-2026-10-02T09-35-39-292Z; digest=214848ca8020c32151435e041d6826366c964483f45b322dbadf3df717f877c7"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive capital-flow series claim only. No direction, persistence, causal pressure or allocation interpretation is asserted.",
      observedAt: "2026-10-01T04:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-CAPITAL_FLOW-US.XLY-214848ca8020",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.XLY/capital-flow/history",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo CAPITAL_FLOW provider snapshot for US.XLY",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "214848ca8020c32151435e041d6826366c964483f45b322dbadf3df717f877c7"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-XLE-b3a889fce7db",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.XLE-b3a889fce7db",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI CAPITAL_FLOW for US.XLE contains 251 net-flow observations spanning 2025-10-02 to 2026-10-01, with first observed in_flow 33921877.12 and last observed in_flow 32539948.187.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLE in_flow 2025-10-02..2026-10-01; snapshot=MOOMOO-US-CAPITAL-FLOW-01-US-XLE-2026-10-02T09-35-39-292Z; digest=b3a889fce7db5ab7d00849b7747a22f3eff6d1ca04e29fe5c289927759c2231d"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive capital-flow series claim only. No direction, persistence, causal pressure or allocation interpretation is asserted.",
      observedAt: "2026-10-01T04:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-CAPITAL_FLOW-US.XLE-b3a889fce7db",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.XLE/capital-flow/history",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo CAPITAL_FLOW provider snapshot for US.XLE",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "b3a889fce7db5ab7d00849b7747a22f3eff6d1ca04e29fe5c289927759c2231d"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-XLV-1d33a605f2db",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.XLV-1d33a605f2db",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI CAPITAL_FLOW for US.XLV contains 251 net-flow observations spanning 2025-10-02 to 2026-10-01, with first observed in_flow -67708712.838 and last observed in_flow 17097346.103.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLV in_flow 2025-10-02..2026-10-01; snapshot=MOOMOO-US-CAPITAL-FLOW-01-US-XLV-2026-10-02T09-35-39-292Z; digest=1d33a605f2dbeca301be4907d811005e7fc629fcf683acc2b4aabf5b07f42bc9"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive capital-flow series claim only. No direction, persistence, causal pressure or allocation interpretation is asserted.",
      observedAt: "2026-10-01T04:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-CAPITAL_FLOW-US.XLV-1d33a605f2db",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.XLV/capital-flow/history",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo CAPITAL_FLOW provider snapshot for US.XLV",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "1d33a605f2dbeca301be4907d811005e7fc629fcf683acc2b4aabf5b07f42bc9"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-AAPL-PE-3c29c842432f",
      sourceId: "MOOMOO-VALUATION-US.AAPL-3c29c842432f",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI VALUATION PE for US.AAPL reports current value 37.88, interval average 31.209, historical percentile 91.5470494, historical observations 1254.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AAPL valuation PE; snapshot=MOOMOO-US-VALUATION-01-US-AAPL-PE-2026-10-02T09-35-39-292Z; digest=3c29c842432f5786b94d892b863b459d85902f11676148144782b20937741bb7"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive valuation claim only. No overvaluation, undervaluation, pressure or constraint conclusion is asserted.",
      observedAt: "2026-10-02T09:35:49.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-VALUATION-US.AAPL-3c29c842432f",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.AAPL/valuation/detail",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo VALUATION provider snapshot for US.AAPL",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "3c29c842432f5786b94d892b863b459d85902f11676148144782b20937741bb7"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-AAPL-PB-f4706caecf82",
      sourceId: "MOOMOO-VALUATION-US.AAPL-f4706caecf82",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI VALUATION PB for US.AAPL reports current value 44.837, interval average 45.571, historical percentile 46.7304625, historical observations 1254.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AAPL valuation PB; snapshot=MOOMOO-US-VALUATION-01-US-AAPL-PB-2026-10-02T09-35-39-292Z; digest=f4706caecf825971bd267f1af9be901249f222397a9e74f03ac271dc2261b2dc"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive valuation claim only. No overvaluation, undervaluation, pressure or constraint conclusion is asserted.",
      observedAt: "2026-10-02T09:35:50.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-VALUATION-US.AAPL-f4706caecf82",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.AAPL/valuation/detail",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo VALUATION provider snapshot for US.AAPL",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "f4706caecf825971bd267f1af9be901249f222397a9e74f03ac271dc2261b2dc"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-AAPL-PS-9f9dc4dd8a19",
      sourceId: "MOOMOO-VALUATION-US.AAPL-9f9dc4dd8a19",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI VALUATION PS for US.AAPL reports current value 10.326, interval average 7.852, historical percentile 98.0063795, historical observations 1254.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AAPL valuation PS; snapshot=MOOMOO-US-VALUATION-01-US-AAPL-PS-2026-10-02T09-35-39-292Z; digest=9f9dc4dd8a190388564e461afac95a6184bc9cda1a689abd4a57a8f0e1a1e729"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive valuation claim only. No overvaluation, undervaluation, pressure or constraint conclusion is asserted.",
      observedAt: "2026-10-02T09:35:51.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-VALUATION-US.AAPL-9f9dc4dd8a19",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.AAPL/valuation/detail",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo VALUATION provider snapshot for US.AAPL",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "9f9dc4dd8a190388564e461afac95a6184bc9cda1a689abd4a57a8f0e1a1e729"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-MSFT-PE-1c269a237a05",
      sourceId: "MOOMOO-VALUATION-US.MSFT-1c269a237a05",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI VALUATION PE for US.MSFT reports current value 28.568, interval average 32.429, historical percentile 27.7511961, historical observations 1254.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.MSFT valuation PE; snapshot=MOOMOO-US-VALUATION-01-US-MSFT-PE-2026-10-02T09-35-39-292Z; digest=1c269a237a05f94d9551e1f2bc85239a1243964b502aa6bcd083e3932c4f22c3"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive valuation claim only. No overvaluation, undervaluation, pressure or constraint conclusion is asserted.",
      observedAt: "2026-10-02T09:35:52.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-VALUATION-US.MSFT-1c269a237a05",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.MSFT/valuation/detail",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo VALUATION provider snapshot for US.MSFT",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "1c269a237a05f94d9551e1f2bc85239a1243964b502aa6bcd083e3932c4f22c3"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-MSFT-PB-d97df01f3fb6",
      sourceId: "MOOMOO-VALUATION-US.MSFT-d97df01f3fb6",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI VALUATION PB for US.MSFT reports current value 8.607, interval average 11.334, historical percentile 13.3173843, historical observations 1254.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.MSFT valuation PB; snapshot=MOOMOO-US-VALUATION-01-US-MSFT-PB-2026-10-02T09-35-39-292Z; digest=d97df01f3fb601dbee36027d7a62b4068a0e7c348d7c21f5f9991fdd24aff273"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive valuation claim only. No overvaluation, undervaluation, pressure or constraint conclusion is asserted.",
      observedAt: "2026-10-02T09:35:53.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-VALUATION-US.MSFT-d97df01f3fb6",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.MSFT/valuation/detail",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo VALUATION provider snapshot for US.MSFT",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "d97df01f3fb601dbee36027d7a62b4068a0e7c348d7c21f5f9991fdd24aff273"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-MSFT-PS-05b72a5eafa4",
      sourceId: "MOOMOO-VALUATION-US.MSFT-05b72a5eafa4",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI VALUATION PS for US.MSFT reports current value 11.474, interval average 11.668, historical percentile 42.3444976, historical observations 1254.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.MSFT valuation PS; snapshot=MOOMOO-US-VALUATION-01-US-MSFT-PS-2026-10-02T09-35-39-292Z; digest=05b72a5eafa4cec42ff6a43c580151049d09fc4b0ef4211c1cbd87da3e7d5c52"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive valuation claim only. No overvaluation, undervaluation, pressure or constraint conclusion is asserted.",
      observedAt: "2026-10-02T09:35:54.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-VALUATION-US.MSFT-05b72a5eafa4",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.MSFT/valuation/detail",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo VALUATION provider snapshot for US.MSFT",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "05b72a5eafa4cec42ff6a43c580151049d09fc4b0ef4211c1cbd87da3e7d5c52"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-AMZN-PE-e6c727c266ae",
      sourceId: "MOOMOO-VALUATION-US.AMZN-e6c727c266ae",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI VALUATION PE for US.AMZN reports current value 19.97, interval average 40.114, historical percentile 18.9792663, historical observations 1254.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AMZN valuation PE; snapshot=MOOMOO-US-VALUATION-01-US-AMZN-PE-2026-10-02T09-35-39-292Z; digest=e6c727c266ae740a9ccc9033b92193af58753be5d854d3702acce78a87956d6b"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive valuation claim only. No overvaluation, undervaluation, pressure or constraint conclusion is asserted.",
      observedAt: "2026-10-02T09:35:55.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-VALUATION-US.AMZN-e6c727c266ae",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.AMZN/valuation/detail",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo VALUATION provider snapshot for US.AMZN",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "e6c727c266ae740a9ccc9033b92193af58753be5d854d3702acce78a87956d6b"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-AMZN-PB-b4bd35f5f4b2",
      sourceId: "MOOMOO-VALUATION-US.AMZN-b4bd35f5f4b2",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI VALUATION PB for US.AMZN reports current value 4.853, interval average 6.604, historical percentile 14.3540669, historical observations 1254.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AMZN valuation PB; snapshot=MOOMOO-US-VALUATION-01-US-AMZN-PB-2026-10-02T09-35-39-292Z; digest=b4bd35f5f4b28fdd4286ae8a74bb0ce0b35d2ca5ee25c2de639d5bb7607451d1"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive valuation claim only. No overvaluation, undervaluation, pressure or constraint conclusion is asserted.",
      observedAt: "2026-10-02T09:35:56.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-VALUATION-US.AMZN-b4bd35f5f4b2",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.AMZN/valuation/detail",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo VALUATION provider snapshot for US.AMZN",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "b4bd35f5f4b28fdd4286ae8a74bb0ce0b35d2ca5ee25c2de639d5bb7607451d1"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-AMZN-PS-cbf4e81dcb13",
      sourceId: "MOOMOO-VALUATION-US.AMZN-cbf4e81dcb13",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI VALUATION PS for US.AMZN reports current value 3.451, interval average 2.613, historical percentile 73.444976, historical observations 1254.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AMZN valuation PS; snapshot=MOOMOO-US-VALUATION-01-US-AMZN-PS-2026-10-02T09-35-39-292Z; digest=cbf4e81dcb131b1493e6e11775bd7486fea11d07e98ea9659e24bfdd7ddf565c"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive valuation claim only. No overvaluation, undervaluation, pressure or constraint conclusion is asserted.",
      observedAt: "2026-10-02T09:35:57.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-VALUATION-US.AMZN-cbf4e81dcb13",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.AMZN/valuation/detail",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo VALUATION provider snapshot for US.AMZN",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "cbf4e81dcb131b1493e6e11775bd7486fea11d07e98ea9659e24bfdd7ddf565c"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-NVDA-PE-d9c7cc989693",
      sourceId: "MOOMOO-VALUATION-US.NVDA-d9c7cc989693",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI VALUATION PE for US.NVDA reports current value 29.185, interval average 72.386, historical percentile 2.15311, historical observations 1254.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.NVDA valuation PE; snapshot=MOOMOO-US-VALUATION-01-US-NVDA-PE-2026-10-02T09-35-39-292Z; digest=d9c7cc98969363a0b0de1bebd13b2004ad2606ab600240030e910082ea9d1b49"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive valuation claim only. No overvaluation, undervaluation, pressure or constraint conclusion is asserted.",
      observedAt: "2026-10-02T09:35:58.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-VALUATION-US.NVDA-d9c7cc989693",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.NVDA/valuation/detail",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo VALUATION provider snapshot for US.NVDA",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "d9c7cc98969363a0b0de1bebd13b2004ad2606ab600240030e910082ea9d1b49"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-NVDA-PB-d808f14aa5be",
      sourceId: "MOOMOO-VALUATION-US.NVDA-d808f14aa5be",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI VALUATION PB for US.NVDA reports current value 24.298, interval average 35.98, historical percentile 21.4513556, historical observations 1254.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.NVDA valuation PB; snapshot=MOOMOO-US-VALUATION-01-US-NVDA-PB-2026-10-02T09-35-39-292Z; digest=d808f14aa5be25c6f3ef48ad09aa9882ec3798f40fd3995a8d8699533a0e621a"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive valuation claim only. No overvaluation, undervaluation, pressure or constraint conclusion is asserted.",
      observedAt: "2026-10-02T09:35:59.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-VALUATION-US.NVDA-d808f14aa5be",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.NVDA/valuation/detail",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo VALUATION provider snapshot for US.NVDA",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "d808f14aa5be25c6f3ef48ad09aa9882ec3798f40fd3995a8d8699533a0e621a"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-NVDA-PS-2c3b0489ae98",
      sourceId: "MOOMOO-VALUATION-US.NVDA-2c3b0489ae98",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI VALUATION PS for US.NVDA reports current value 18.363, interval average 26.031, historical percentile 18.2615629, historical observations 1254.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.NVDA valuation PS; snapshot=MOOMOO-US-VALUATION-01-US-NVDA-PS-2026-10-02T09-35-39-292Z; digest=2c3b0489ae9814781c4e1c5652220ac142de40c3d75a0c428e70790c89791223"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive valuation claim only. No overvaluation, undervaluation, pressure or constraint conclusion is asserted.",
      observedAt: "2026-10-02T09:35:59.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-VALUATION-US.NVDA-2c3b0489ae98",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.NVDA/valuation/detail",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo VALUATION provider snapshot for US.NVDA",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "2c3b0489ae9814781c4e1c5652220ac142de40c3d75a0c428e70790c89791223"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-JPM-PE-00b1b7654c0a",
      sourceId: "MOOMOO-VALUATION-US.JPM-00b1b7654c0a",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI VALUATION PE for US.JPM reports current value 14.275, interval average 11.924, historical percentile 76.076555, historical observations 1254.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.JPM valuation PE; snapshot=MOOMOO-US-VALUATION-01-US-JPM-PE-2026-10-02T09-35-39-292Z; digest=00b1b7654c0aa8340ece078e254355462d9812f5c42158f4f03c8782cfe4b35e"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive valuation claim only. No overvaluation, undervaluation, pressure or constraint conclusion is asserted.",
      observedAt: "2026-10-02T09:36:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-VALUATION-US.JPM-00b1b7654c0a",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.JPM/valuation/detail",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo VALUATION provider snapshot for US.JPM",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "00b1b7654c0aa8340ece078e254355462d9812f5c42158f4f03c8782cfe4b35e"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-JPM-PB-9351604c22ff",
      sourceId: "MOOMOO-VALUATION-US.JPM-9351604c22ff",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI VALUATION PB for US.JPM reports current value 2.504, interval average 1.898, historical percentile 90.7496012, historical observations 1254.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.JPM valuation PB; snapshot=MOOMOO-US-VALUATION-01-US-JPM-PB-2026-10-02T09-35-39-292Z; digest=9351604c22ff142c67197c1d7926dfebb4f4f4de8de3dd5e2d746800460a24bd"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive valuation claim only. No overvaluation, undervaluation, pressure or constraint conclusion is asserted.",
      observedAt: "2026-10-02T09:36:01.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-VALUATION-US.JPM-9351604c22ff",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.JPM/valuation/detail",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo VALUATION provider snapshot for US.JPM",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "9351604c22ff142c67197c1d7926dfebb4f4f4de8de3dd5e2d746800460a24bd"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-JPM-PS-dc08bcbc4299",
      sourceId: "MOOMOO-VALUATION-US.JPM-dc08bcbc4299",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI VALUATION PS for US.JPM reports current value 4.441, interval average 3.674, historical percentile 79.5853269, historical observations 1254.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.JPM valuation PS; snapshot=MOOMOO-US-VALUATION-01-US-JPM-PS-2026-10-02T09-35-39-292Z; digest=dc08bcbc4299b932f6988c604127cf5d73bb3b2001812867f444d3ee15de4cc7"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive valuation claim only. No overvaluation, undervaluation, pressure or constraint conclusion is asserted.",
      observedAt: "2026-10-02T09:36:02.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-VALUATION-US.JPM-dc08bcbc4299",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.JPM/valuation/detail",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo VALUATION provider snapshot for US.JPM",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "dc08bcbc4299b932f6988c604127cf5d73bb3b2001812867f444d3ee15de4cc7"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-AAPL-S1-3c8df0dee6b3",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AAPL-3c8df0dee6b3",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.AAPL statement type 1 contains 50 reporting periods and 22 distinct reported fields across 1040 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AAPL financial statements S1; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q3; snapshot=MOOMOO-US-FINANCIALS-01-US-AAPL-S1-2026-10-02T09-35-39-292Z; digest=3c8df0dee6b37169d56d96affa0d2b16d3e662fe46312bd3b6efa587c57478fe"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-06-26T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.AAPL-3c8df0dee6b3",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.AAPL/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.AAPL",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "3c8df0dee6b37169d56d96affa0d2b16d3e662fe46312bd3b6efa587c57478fe"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-AAPL-S2-8ef3f09a181e",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AAPL-8ef3f09a181e",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.AAPL statement type 2 contains 50 reporting periods and 45 distinct reported fields across 1818 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AAPL financial statements S2; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q3; snapshot=MOOMOO-US-FINANCIALS-01-US-AAPL-S2-2026-10-02T09-35-39-292Z; digest=8ef3f09a181eadbaeff85099bbcb56ab00b629c59917f48a5de597513a7e3c4e"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-06-26T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.AAPL-8ef3f09a181e",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.AAPL/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.AAPL",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "8ef3f09a181eadbaeff85099bbcb56ab00b629c59917f48a5de597513a7e3c4e"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-AAPL-S3-3f28163636d0",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AAPL-3f28163636d0",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.AAPL statement type 3 contains 50 reporting periods and 30 distinct reported fields across 1373 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AAPL financial statements S3; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q3; snapshot=MOOMOO-US-FINANCIALS-01-US-AAPL-S3-2026-10-02T09-35-39-292Z; digest=3f28163636d0b75f53b91c69b26728aadd4dd2277a5793746f1e55852038809c"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-06-26T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.AAPL-3f28163636d0",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.AAPL/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.AAPL",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "3f28163636d0b75f53b91c69b26728aadd4dd2277a5793746f1e55852038809c"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-AAPL-S4-3b758143ba4c",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AAPL-3b758143ba4c",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.AAPL statement type 4 contains 50 reporting periods and 39 distinct reported fields across 1370 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AAPL financial statements S4; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q3; snapshot=MOOMOO-US-FINANCIALS-01-US-AAPL-S4-2026-10-02T09-35-39-292Z; digest=3b758143ba4c6d2b614d9225ba1fd5aea14ecad6520d401a1a17fb290e65d80b"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-06-26T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.AAPL-3b758143ba4c",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.AAPL/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.AAPL",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "3b758143ba4c6d2b614d9225ba1fd5aea14ecad6520d401a1a17fb290e65d80b"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-MSFT-S1-a54658d106ce",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.MSFT-a54658d106ce",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.MSFT statement type 1 contains 50 reporting periods and 28 distinct reported fields across 1318 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.MSFT financial statements S1; periodCount=50; firstPeriod=2017/FY; lastPeriod=2026/Q4; snapshot=MOOMOO-US-FINANCIALS-01-US-MSFT-S1-2026-10-02T09-35-39-292Z; digest=a54658d106ceb28930e983e67186e4b4125ecd64e865f178483698dcfa532f6b"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-06-29T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.MSFT-a54658d106ce",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.MSFT/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.MSFT",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "a54658d106ceb28930e983e67186e4b4125ecd64e865f178483698dcfa532f6b"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-MSFT-S2-53ecfdf6b3bf",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.MSFT-53ecfdf6b3bf",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.MSFT statement type 2 contains 50 reporting periods and 44 distinct reported fields across 2061 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.MSFT financial statements S2; periodCount=50; firstPeriod=2017/FY; lastPeriod=2026/Q4; snapshot=MOOMOO-US-FINANCIALS-01-US-MSFT-S2-2026-10-02T09-35-39-292Z; digest=53ecfdf6b3bff22ba91911517b402d7ef5e20058a063d46e977344b30281517d"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-06-29T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.MSFT-53ecfdf6b3bf",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.MSFT/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.MSFT",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "53ecfdf6b3bff22ba91911517b402d7ef5e20058a063d46e977344b30281517d"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-MSFT-S3-cc7be48456b3",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.MSFT-cc7be48456b3",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.MSFT statement type 3 contains 50 reporting periods and 31 distinct reported fields across 1493 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.MSFT financial statements S3; periodCount=50; firstPeriod=2017/FY; lastPeriod=2026/Q4; snapshot=MOOMOO-US-FINANCIALS-01-US-MSFT-S3-2026-10-02T09-35-39-292Z; digest=cc7be48456b36eb996632e1256ab4aedd4a9550cb45db1673d0df6d7c5e96309"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-06-29T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.MSFT-cc7be48456b3",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.MSFT/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.MSFT",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "cc7be48456b36eb996632e1256ab4aedd4a9550cb45db1673d0df6d7c5e96309"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-MSFT-S4-701db431959c",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.MSFT-701db431959c",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.MSFT statement type 4 contains 50 reporting periods and 41 distinct reported fields across 1490 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.MSFT financial statements S4; periodCount=50; firstPeriod=2017/FY; lastPeriod=2026/Q4; snapshot=MOOMOO-US-FINANCIALS-01-US-MSFT-S4-2026-10-02T09-35-39-292Z; digest=701db431959c5a0371a570cd3fb0ede01a2ae8dec4a6ad20d9f77f1f925f5f8d"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-06-29T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.MSFT-701db431959c",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.MSFT/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.MSFT",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "701db431959c5a0371a570cd3fb0ede01a2ae8dec4a6ad20d9f77f1f925f5f8d"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-AMZN-S1-7e7caab530d4",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AMZN-7e7caab530d4",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.AMZN statement type 1 contains 50 reporting periods and 25 distinct reported fields across 1232 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AMZN financial statements S1; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-AMZN-S1-2026-10-02T09-35-39-292Z; digest=7e7caab530d49afa469648f834a19d0a1393589bf57b0819df8e463c63e745d6"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-06-29T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.AMZN-7e7caab530d4",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.AMZN/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.AMZN",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "7e7caab530d49afa469648f834a19d0a1393589bf57b0819df8e463c63e745d6"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-AMZN-S2-c52c3ba75470",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AMZN-c52c3ba75470",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.AMZN statement type 2 contains 50 reporting periods and 38 distinct reported fields across 1736 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AMZN financial statements S2; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-AMZN-S2-2026-10-02T09-35-39-292Z; digest=c52c3ba7547029e485c78282ebec8858597490d3a569629dbff97cc8ea70ee5a"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-06-29T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.AMZN-c52c3ba75470",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.AMZN/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.AMZN",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "c52c3ba7547029e485c78282ebec8858597490d3a569629dbff97cc8ea70ee5a"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-AMZN-S3-53cb070505ce",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AMZN-53cb070505ce",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.AMZN statement type 3 contains 50 reporting periods and 27 distinct reported fields across 1233 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AMZN financial statements S3; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-AMZN-S3-2026-10-02T09-35-39-292Z; digest=53cb070505ce2ffea719de21fd64b332a21eeeb11d9d86c7b0a47100ffcaf0d0"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-06-29T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.AMZN-53cb070505ce",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.AMZN/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.AMZN",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "53cb070505ce2ffea719de21fd64b332a21eeeb11d9d86c7b0a47100ffcaf0d0"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-AMZN-S4-bff326051ec7",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AMZN-bff326051ec7",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.AMZN statement type 4 contains 50 reporting periods and 37 distinct reported fields across 1366 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AMZN financial statements S4; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-AMZN-S4-2026-10-02T09-35-39-292Z; digest=bff326051ec73fcb81576875b84ecedfb59b68f76e8dfb8f1694576092750126"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-06-29T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.AMZN-bff326051ec7",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.AMZN/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.AMZN",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "bff326051ec73fcb81576875b84ecedfb59b68f76e8dfb8f1694576092750126"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-NVDA-S1-af8404f86a79",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.NVDA-af8404f86a79",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.NVDA statement type 1 contains 50 reporting periods and 25 distinct reported fields across 1124 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.NVDA financial statements S1; periodCount=50; firstPeriod=2017/FY; lastPeriod=2027/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-NVDA-S1-2026-10-02T09-35-39-292Z; digest=af8404f86a79b9dd9520bbb4ee07cc40f5e0e5eed1253fae15b7bd5fc5052106"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-07-25T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.NVDA-af8404f86a79",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.NVDA/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.NVDA",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "af8404f86a79b9dd9520bbb4ee07cc40f5e0e5eed1253fae15b7bd5fc5052106"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-NVDA-S2-1a23b9f36576",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.NVDA-1a23b9f36576",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.NVDA statement type 2 contains 50 reporting periods and 55 distinct reported fields across 2264 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.NVDA financial statements S2; periodCount=50; firstPeriod=2017/FY; lastPeriod=2027/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-NVDA-S2-2026-10-02T09-35-39-292Z; digest=1a23b9f36576a5927f01c9729e151f6511832ea8b7bddd02346bfd7d691a749d"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-07-25T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.NVDA-1a23b9f36576",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.NVDA/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.NVDA",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "1a23b9f36576a5927f01c9729e151f6511832ea8b7bddd02346bfd7d691a749d"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-NVDA-S3-56fb80c85a76",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.NVDA-56fb80c85a76",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.NVDA statement type 3 contains 50 reporting periods and 30 distinct reported fields across 1408 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.NVDA financial statements S3; periodCount=50; firstPeriod=2017/FY; lastPeriod=2027/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-NVDA-S3-2026-10-02T09-35-39-292Z; digest=56fb80c85a76ec3d40372e87036a35c435f1456f99dc8541b26dfa399e1a6b49"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-07-25T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.NVDA-56fb80c85a76",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.NVDA/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.NVDA",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "56fb80c85a76ec3d40372e87036a35c435f1456f99dc8541b26dfa399e1a6b49"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-NVDA-S4-33463c5ceec7",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.NVDA-33463c5ceec7",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.NVDA statement type 4 contains 50 reporting periods and 39 distinct reported fields across 1372 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.NVDA financial statements S4; periodCount=50; firstPeriod=2017/FY; lastPeriod=2027/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-NVDA-S4-2026-10-02T09-35-39-292Z; digest=33463c5ceec7e7b7b6bc91ac94f32dd56eea4ef17d4fd13e5b74d15558e4fad7"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-07-25T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.NVDA-33463c5ceec7",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.NVDA/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.NVDA",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "33463c5ceec7e7b7b6bc91ac94f32dd56eea4ef17d4fd13e5b74d15558e4fad7"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-JPM-S1-d19774bcd7dc",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.JPM-d19774bcd7dc",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.JPM statement type 1 contains 50 reporting periods and 35 distinct reported fields across 1642 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.JPM financial statements S1; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-JPM-S1-2026-10-02T09-35-39-292Z; digest=d19774bcd7dc4622b1d2aea0d9204856bc92af54f9a0c1344b8b4827bce83448"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-06-29T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.JPM-d19774bcd7dc",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.JPM/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.JPM",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "d19774bcd7dc4622b1d2aea0d9204856bc92af54f9a0c1344b8b4827bce83448"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-JPM-S2-9d0af479d394",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.JPM-9d0af479d394",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.JPM statement type 2 contains 50 reporting periods and 44 distinct reported fields across 2005 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.JPM financial statements S2; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-JPM-S2-2026-10-02T09-35-39-292Z; digest=9d0af479d3946dd243dc0ef9336f506ac3a69eaecc7c80581be5d4a9875f15a0"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-06-29T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.JPM-9d0af479d394",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.JPM/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.JPM",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "9d0af479d3946dd243dc0ef9336f506ac3a69eaecc7c80581be5d4a9875f15a0"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-JPM-S3-4d0fb94c1ddf",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.JPM-4d0fb94c1ddf",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.JPM statement type 3 contains 50 reporting periods and 33 distinct reported fields across 1511 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.JPM financial statements S3; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-JPM-S3-2026-10-02T09-35-39-292Z; digest=4d0fb94c1ddf6a8635b2ff86d1ed02e785dc5ef84b3205cd6cea62e81193ce2c"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-06-29T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.JPM-4d0fb94c1ddf",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.JPM/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.JPM",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "4d0fb94c1ddf6a8635b2ff86d1ed02e785dc5ef84b3205cd6cea62e81193ce2c"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-JPM-S4-0c6cf1014aa8",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.JPM-0c6cf1014aa8",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.JPM statement type 4 contains 50 reporting periods and 27 distinct reported fields across 757 normalized field observations.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.JPM financial statements S4; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-JPM-S4-2026-10-02T09-35-39-292Z; digest=0c6cf1014aa820923a6712d98f69e9d07e9cf82c4779bb88521a96955e3b6cba"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.",
      observedAt: "2026-06-29T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-FINANCIAL_STATEMENTS-US.JPM-0c6cf1014aa8",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.JPM/financials/statements",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.JPM",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "0c6cf1014aa820923a6712d98f69e9d07e9cf82c4779bb88521a96955e3b6cba"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-REVENUE-BREAKDOWN-US-AAPL-685aae881d35",
      sourceId: "MOOMOO-REVENUE_BREAKDOWN-US.AAPL-685aae881d35",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI REVENUE_BREAKDOWN for US.AAPL contains 11 distinct breakdown items across 2 breakdown dimensions for reporting period(s) 2025/FY.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AAPL revenue breakdown; periods=2025/FY; snapshot=MOOMOO-US-REVENUE-BREAKDOWN-01-US-AAPL-2026-10-02T09-35-39-292Z; digest=685aae881d3542e3b7716c48f2cd93bc1849da6394c14aa015d4e91529324a26"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer revenue-composition claim only. No structural change, reconfiguration or continuity conclusion is asserted.",
      observedAt: "2025-09-26T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-REVENUE_BREAKDOWN-US.AAPL-685aae881d35",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.AAPL/financials/revenue-breakdown",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo REVENUE_BREAKDOWN provider snapshot for US.AAPL",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "685aae881d3542e3b7716c48f2cd93bc1849da6394c14aa015d4e91529324a26"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-REVENUE-BREAKDOWN-US-MSFT-ed4dfc0eaf45",
      sourceId: "MOOMOO-REVENUE_BREAKDOWN-US.MSFT-ed4dfc0eaf45",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI REVENUE_BREAKDOWN for US.MSFT contains 5 distinct breakdown items across 2 breakdown dimensions for reporting period(s) 2026/FY.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.MSFT revenue breakdown; periods=2026/FY; snapshot=MOOMOO-US-REVENUE-BREAKDOWN-01-US-MSFT-2026-10-02T09-35-39-292Z; digest=ed4dfc0eaf452602cec127d342120cb403ea709a7ebb297b3ead619f425926a3"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer revenue-composition claim only. No structural change, reconfiguration or continuity conclusion is asserted.",
      observedAt: "2026-06-29T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-REVENUE_BREAKDOWN-US.MSFT-ed4dfc0eaf45",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.MSFT/financials/revenue-breakdown",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo REVENUE_BREAKDOWN provider snapshot for US.MSFT",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "ed4dfc0eaf452602cec127d342120cb403ea709a7ebb297b3ead619f425926a3"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-REVENUE-BREAKDOWN-US-AMZN-d04cbc0a3af5",
      sourceId: "MOOMOO-REVENUE_BREAKDOWN-US.AMZN-d04cbc0a3af5",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI REVENUE_BREAKDOWN for US.AMZN contains 8 distinct breakdown items across 2 breakdown dimensions for reporting period(s) 2025/FY.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AMZN revenue breakdown; periods=2025/FY; snapshot=MOOMOO-US-REVENUE-BREAKDOWN-01-US-AMZN-2026-10-02T09-35-39-292Z; digest=d04cbc0a3af5759411b384e455165a40216ccab3ffec1fb498ffe307f569659c"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer revenue-composition claim only. No structural change, reconfiguration or continuity conclusion is asserted.",
      observedAt: "2025-12-30T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-REVENUE_BREAKDOWN-US.AMZN-d04cbc0a3af5",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.AMZN/financials/revenue-breakdown",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo REVENUE_BREAKDOWN provider snapshot for US.AMZN",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "d04cbc0a3af5759411b384e455165a40216ccab3ffec1fb498ffe307f569659c"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-REVENUE-BREAKDOWN-US-NVDA-94da861559a8",
      sourceId: "MOOMOO-REVENUE_BREAKDOWN-US.NVDA-94da861559a8",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI REVENUE_BREAKDOWN for US.NVDA contains 6 distinct breakdown items across 2 breakdown dimensions for reporting period(s) 2026/FY.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.NVDA revenue breakdown; periods=2026/FY; snapshot=MOOMOO-US-REVENUE-BREAKDOWN-01-US-NVDA-2026-10-02T09-35-39-292Z; digest=94da861559a8e3d28c31f85f16a45343303a34211ea1bdf05c404e3257640687"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer revenue-composition claim only. No structural change, reconfiguration or continuity conclusion is asserted.",
      observedAt: "2026-01-24T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-REVENUE_BREAKDOWN-US.NVDA-94da861559a8",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.NVDA/financials/revenue-breakdown",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo REVENUE_BREAKDOWN provider snapshot for US.NVDA",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "94da861559a8e3d28c31f85f16a45343303a34211ea1bdf05c404e3257640687"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    },
    {
      claimCandidateId: "MOOMOO-REVENUE-BREAKDOWN-US-JPM-7f1bc205f22f",
      sourceId: "MOOMOO-REVENUE_BREAKDOWN-US.JPM-7f1bc205f22f",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      claimType: "GENERAL_CURRENT_FACT",
      claimText: "Moomoo OpenAPI REVENUE_BREAKDOWN for US.JPM contains 9 distinct breakdown items across 2 breakdown dimensions for reporting period(s) 2025/FY.",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.JPM revenue breakdown; periods=2025/FY; snapshot=MOOMOO-US-REVENUE-BREAKDOWN-01-US-JPM-2026-10-02T09-35-39-292Z; digest=7f1bc205f22ffa90dc7b1a79978ceb16e0aee7df2bdd9c060c00e01922c3d62a"
      },
      supportLevel: "DIRECT",
      supportNote: "Descriptive issuer revenue-composition claim only. No structural change, reconfiguration or continuity conclusion is asserted.",
      observedAt: "2025-12-30T16:00:00.000Z",
      conflictGroup: null,
      jurisdiction: "US",
      sourceLineage: {
        intakeId: "W8A-PROVIDER-MOOMOO-REVENUE_BREAKDOWN-US.JPM-7f1bc205f22f",
        url: "https://webapi.moomoo.com/api/v1.0/quote/US.JPM/financials/revenue-breakdown",
        publisher: "Moomoo OpenAPI",
        title: "Moomoo REVENUE_BREAKDOWN provider snapshot for US.JPM",
        publishedAt: null,
        retrievedAt: "2026-10-02T09:35:39.292Z",
        authorityClassHint: "MARKET_DATA_PROVIDER",
        sourceVersionOrDigest: "7f1bc205f22ffa90dc7b1a79978ceb16e0aee7df2bdd9c060c00e01922c3d62a"
      },
      claimState: "SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED",
      boundaries: {
        isAdmittedEvidence: false,
        isCurrentData: false,
        sourceVotingUsed: false,
        derivedReadingCreated: false,
        runtimePositionCreated: false
      }
    }
  ],
  rejected: []
};

// content/civilization-atlas/reconfiguration/moomoo-provider-w8c-admission-results-v1.json
var moomoo_provider_w8c_admission_results_v1_default = {
  schemaVersion: "PHI-OS-MOOMOO-PROVIDER-W8C-ADMISSION-RESULTS-v1.0.0",
  version: "1.0.0",
  status: "PROVIDER_ADMISSION_EVALUATED",
  work: "PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8C-P2",
  decisionValidationRejected: [],
  records: [
    {
      claimCandidateId: "MOOMOO-HISTORY-US-SPY-f159349bd998",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-HISTORY_KLINE-US.SPY-f159349bd998",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 16432,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-HISTORY-US-QQQ-7ed38bb436d6",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-HISTORY_KLINE-US.QQQ-7ed38bb436d6",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 16432,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-HISTORY-US-XLK-38b43e0def10",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-HISTORY_KLINE-US.XLK-38b43e0def10",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 16432,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-HISTORY-US-XLF-4ffdd091ef10",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-HISTORY_KLINE-US.XLF-4ffdd091ef10",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 16432,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-HISTORY-US-XLI-a06d1db8fb7e",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-HISTORY_KLINE-US.XLI-a06d1db8fb7e",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 16432,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-HISTORY-US-XLY-9731ca840f2a",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-HISTORY_KLINE-US.XLY-9731ca840f2a",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 16432,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-HISTORY-US-XLE-e2653235fef6",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-HISTORY_KLINE-US.XLE-e2653235fef6",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 16432,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-HISTORY-US-XLV-eb3652f6f62f",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-HISTORY_KLINE-US.XLV-eb3652f6f62f",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 16432,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-SPY-af2addfaea49",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.SPY-af2addfaea49",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-QQQ-c736b3c5b706",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.QQQ-c736b3c5b706",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-XLK-303fde7c04a7",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.XLK-303fde7c04a7",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-XLF-ef5988702834",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.XLF-ef5988702834",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-XLI-3d5b79033370",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.XLI-3d5b79033370",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-XLY-214848ca8020",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.XLY-214848ca8020",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-XLE-b3a889fce7db",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.XLE-b3a889fce7db",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-XLV-1d33a605f2db",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.XLV-1d33a605f2db",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-AAPL-PE-3c29c842432f",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-VALUATION-US.AAPL-3c29c842432f",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-AAPL-PB-f4706caecf82",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-VALUATION-US.AAPL-f4706caecf82",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-AAPL-PS-9f9dc4dd8a19",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-VALUATION-US.AAPL-9f9dc4dd8a19",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-MSFT-PE-1c269a237a05",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-VALUATION-US.MSFT-1c269a237a05",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-MSFT-PB-d97df01f3fb6",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-VALUATION-US.MSFT-d97df01f3fb6",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-MSFT-PS-05b72a5eafa4",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-VALUATION-US.MSFT-05b72a5eafa4",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-AMZN-PE-e6c727c266ae",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-VALUATION-US.AMZN-e6c727c266ae",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-AMZN-PB-b4bd35f5f4b2",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-VALUATION-US.AMZN-b4bd35f5f4b2",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-AMZN-PS-cbf4e81dcb13",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-VALUATION-US.AMZN-cbf4e81dcb13",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-NVDA-PE-d9c7cc989693",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-VALUATION-US.NVDA-d9c7cc989693",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-NVDA-PB-d808f14aa5be",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-VALUATION-US.NVDA-d808f14aa5be",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-NVDA-PS-2c3b0489ae98",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-VALUATION-US.NVDA-2c3b0489ae98",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-JPM-PE-00b1b7654c0a",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-VALUATION-US.JPM-00b1b7654c0a",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-JPM-PB-9351604c22ff",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-VALUATION-US.JPM-9351604c22ff",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-VALUATION-US-JPM-PS-dc08bcbc4299",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceId: "MOOMOO-VALUATION-US.JPM-dc08bcbc4299",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-AAPL-S1-3c8df0dee6b3",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AAPL-3c8df0dee6b3",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-AAPL-S2-8ef3f09a181e",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AAPL-8ef3f09a181e",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-AAPL-S3-3f28163636d0",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AAPL-3f28163636d0",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-AAPL-S4-3b758143ba4c",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AAPL-3b758143ba4c",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-MSFT-S1-a54658d106ce",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.MSFT-a54658d106ce",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-MSFT-S2-53ecfdf6b3bf",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.MSFT-53ecfdf6b3bf",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-MSFT-S3-cc7be48456b3",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.MSFT-cc7be48456b3",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-MSFT-S4-701db431959c",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.MSFT-701db431959c",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-AMZN-S1-7e7caab530d4",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AMZN-7e7caab530d4",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-AMZN-S2-c52c3ba75470",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AMZN-c52c3ba75470",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-AMZN-S3-53cb070505ce",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AMZN-53cb070505ce",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-AMZN-S4-bff326051ec7",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AMZN-bff326051ec7",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-NVDA-S1-af8404f86a79",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.NVDA-af8404f86a79",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-NVDA-S2-1a23b9f36576",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.NVDA-1a23b9f36576",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-NVDA-S3-56fb80c85a76",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.NVDA-56fb80c85a76",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-NVDA-S4-33463c5ceec7",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.NVDA-33463c5ceec7",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-JPM-S1-d19774bcd7dc",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.JPM-d19774bcd7dc",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-JPM-S2-9d0af479d394",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.JPM-9d0af479d394",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-JPM-S3-4d0fb94c1ddf",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.JPM-4d0fb94c1ddf",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-FINANCIALS-US-JPM-S4-0c6cf1014aa8",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.JPM-0c6cf1014aa8",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-REVENUE-BREAKDOWN-US-AAPL-685aae881d35",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-REVENUE_BREAKDOWN-US.AAPL-685aae881d35",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-REVENUE-BREAKDOWN-US-MSFT-ed4dfc0eaf45",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-REVENUE_BREAKDOWN-US.MSFT-ed4dfc0eaf45",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-REVENUE-BREAKDOWN-US-AMZN-d04cbc0a3af5",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-REVENUE_BREAKDOWN-US.AMZN-d04cbc0a3af5",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-REVENUE-BREAKDOWN-US-NVDA-94da861559a8",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-REVENUE_BREAKDOWN-US.NVDA-94da861559a8",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    },
    {
      claimCandidateId: "MOOMOO-REVENUE-BREAKDOWN-US-JPM-7f1bc205f22f",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceId: "MOOMOO-REVENUE_BREAKDOWN-US.JPM-7f1bc205f22f",
      admissionState: "ADMITTED",
      reason: null,
      freshness: {
        freshnessState: "FRESH",
        mode: "TTL",
        ageSeconds: 3362,
        ttlSeconds: 604800
      },
      authorityClass: "MARKET_DATA_PROVIDER",
      domain: "FINANCIAL_MARKETS"
    }
  ]
};

// content/civilization-atlas/reconfiguration/moomoo-provider-rre-eligible-handoff-v1.json
var moomoo_provider_rre_eligible_handoff_v1_default = {
  schemaVersion: "PHI-OS-MOOMOO-PROVIDER-RRE-ELIGIBLE-HANDOFF-v1.0.0",
  version: "1.0.0",
  status: "PROVIDER_RRE_ELIGIBLE_EVIDENCE_READY",
  work: "PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8C-P2",
  successorWork: "PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8D-P2",
  records: [
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-HISTORY-US-SPY-f159349bd998",
      claimText: "Moomoo OpenAPI HISTORY_KLINE for US.SPY contains 1000 close observations spanning 2021-01-04 to 2024-12-23, with first observed close 341.586033056 and last observed close 583.23253892.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-HISTORY_KLINE-US.SPY-f159349bd998",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.SPY/history-kline",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo HISTORY_KLINE provider snapshot for US.SPY",
      publishedAt: null,
      retrievedAt: "2026-10-02T05:57:49.314Z",
      sourceVersion: "f159349bd998fa4edbdf89447d6ce6faa04bafb994a77acff2c2b60e929c53d3",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-HISTORY-US-SPY-f159349bd998",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.SPY close observations 2021-01-04..2024-12-23; snapshot=MOOMOO-US-HISTORY-KLINE-01-US-SPY-2026-10-02T05-57-49-314Z; digest=f159349bd998fa4edbdf89447d6ce6faa04bafb994a77acff2c2b60e929c53d3"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-HISTORY-US-QQQ-7ed38bb436d6",
      claimText: "Moomoo OpenAPI HISTORY_KLINE for US.QQQ contains 1000 close observations spanning 2021-01-04 to 2024-12-23, with first observed close 298.71961342 and last observed close 518.465518281.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-HISTORY_KLINE-US.QQQ-7ed38bb436d6",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.QQQ/history-kline",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo HISTORY_KLINE provider snapshot for US.QQQ",
      publishedAt: null,
      retrievedAt: "2026-10-02T05:57:49.314Z",
      sourceVersion: "7ed38bb436d6fa2180869a5feda125b2c611f806a70beac0683da428be3086d8",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-HISTORY-US-QQQ-7ed38bb436d6",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.QQQ close observations 2021-01-04..2024-12-23; snapshot=MOOMOO-US-HISTORY-KLINE-01-US-QQQ-2026-10-02T05-57-49-314Z; digest=7ed38bb436d6fa2180869a5feda125b2c611f806a70beac0683da428be3086d8"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-HISTORY-US-XLK-38b43e0def10",
      claimText: "Moomoo OpenAPI HISTORY_KLINE for US.XLK contains 1000 close observations spanning 2021-01-04 to 2024-12-23, with first observed close 61.281734979 and last observed close 117.874054501.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-HISTORY_KLINE-US.XLK-38b43e0def10",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.XLK/history-kline",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo HISTORY_KLINE provider snapshot for US.XLK",
      publishedAt: null,
      retrievedAt: "2026-10-02T05:57:49.314Z",
      sourceVersion: "38b43e0def100c2f3679ffc5a11981d1acb9dd3c41586020f4f1e07f6bc7b0b3",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-HISTORY-US-XLK-38b43e0def10",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLK close observations 2021-01-04..2024-12-23; snapshot=MOOMOO-US-HISTORY-KLINE-01-US-XLK-2026-10-02T05-57-49-314Z; digest=38b43e0def100c2f3679ffc5a11981d1acb9dd3c41586020f4f1e07f6bc7b0b3"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-HISTORY-US-XLF-4ffdd091ef10",
      claimText: "Moomoo OpenAPI HISTORY_KLINE for US.XLF contains 1000 close observations spanning 2021-01-04 to 2024-12-23, with first observed close 26.350626575 and last observed close 47.178439732.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-HISTORY_KLINE-US.XLF-4ffdd091ef10",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.XLF/history-kline",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo HISTORY_KLINE provider snapshot for US.XLF",
      publishedAt: null,
      retrievedAt: "2026-10-02T05:57:49.314Z",
      sourceVersion: "4ffdd091ef1064b2add3526eacba101dd6891a5deb8ce807e4b302130de1fc06",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-HISTORY-US-XLF-4ffdd091ef10",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLF close observations 2021-01-04..2024-12-23; snapshot=MOOMOO-US-HISTORY-KLINE-01-US-XLF-2026-10-02T05-57-49-314Z; digest=4ffdd091ef1064b2add3526eacba101dd6891a5deb8ce807e4b302130de1fc06"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-HISTORY-US-XLI-a06d1db8fb7e",
      claimText: "Moomoo OpenAPI HISTORY_KLINE for US.XLI contains 1000 close observations spanning 2021-01-04 to 2024-12-23, with first observed close 79.414059408 and last observed close 130.276876554.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-HISTORY_KLINE-US.XLI-a06d1db8fb7e",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.XLI/history-kline",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo HISTORY_KLINE provider snapshot for US.XLI",
      publishedAt: null,
      retrievedAt: "2026-10-02T05:57:49.314Z",
      sourceVersion: "a06d1db8fb7ee8596dc12636fc04aa0bb90cb6bebeaa25759a5265a95e77e07d",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-HISTORY-US-XLI-a06d1db8fb7e",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLI close observations 2021-01-04..2024-12-23; snapshot=MOOMOO-US-HISTORY-KLINE-01-US-XLI-2026-10-02T05-57-49-314Z; digest=a06d1db8fb7ee8596dc12636fc04aa0bb90cb6bebeaa25759a5265a95e77e07d"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-HISTORY-US-XLY-9731ca840f2a",
      claimText: "Moomoo OpenAPI HISTORY_KLINE for US.XLY contains 1000 close observations spanning 2021-01-04 to 2024-12-23, with first observed close 76.091729709 and last observed close 112.900261557.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-HISTORY_KLINE-US.XLY-9731ca840f2a",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.XLY/history-kline",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo HISTORY_KLINE provider snapshot for US.XLY",
      publishedAt: null,
      retrievedAt: "2026-10-02T05:57:49.314Z",
      sourceVersion: "9731ca840f2a4047e8936197e3d696ce0b54af2752291dcb457d0546b51a9df5",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-HISTORY-US-XLY-9731ca840f2a",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLY close observations 2021-01-04..2024-12-23; snapshot=MOOMOO-US-HISTORY-KLINE-01-US-XLY-2026-10-02T05-57-49-314Z; digest=9731ca840f2a4047e8936197e3d696ce0b54af2752291dcb457d0546b51a9df5"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-HISTORY-US-XLE-e2653235fef6",
      claimText: "Moomoo OpenAPI HISTORY_KLINE for US.XLE contains 1000 close observations spanning 2021-01-04 to 2024-12-23, with first observed close 15.406290419 and last observed close 39.819054007.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-HISTORY_KLINE-US.XLE-e2653235fef6",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.XLE/history-kline",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo HISTORY_KLINE provider snapshot for US.XLE",
      publishedAt: null,
      retrievedAt: "2026-10-02T05:57:49.314Z",
      sourceVersion: "e2653235fef62ac7218caa51b1da78e95581eca64c477b4dd6016f03a6996631",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-HISTORY-US-XLE-e2653235fef6",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLE close observations 2021-01-04..2024-12-23; snapshot=MOOMOO-US-HISTORY-KLINE-01-US-XLE-2026-10-02T05-57-49-314Z; digest=e2653235fef62ac7218caa51b1da78e95581eca64c477b4dd6016f03a6996631"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-HISTORY-US-XLV-eb3652f6f62f",
      claimText: "Moomoo OpenAPI HISTORY_KLINE for US.XLV contains 1000 close observations spanning 2021-01-04 to 2024-12-23, with first observed close 103.002881822 and last observed close 134.681972655.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-HISTORY_KLINE-US.XLV-eb3652f6f62f",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.XLV/history-kline",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo HISTORY_KLINE provider snapshot for US.XLV",
      publishedAt: null,
      retrievedAt: "2026-10-02T05:57:49.314Z",
      sourceVersion: "eb3652f6f62f0a26e27211ebe9e28b9b615fe5c05b1a141ed756ba32b6d215ff",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-HISTORY-US-XLV-eb3652f6f62f",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLV close observations 2021-01-04..2024-12-23; snapshot=MOOMOO-US-HISTORY-KLINE-01-US-XLV-2026-10-02T05-57-49-314Z; digest=eb3652f6f62f0a26e27211ebe9e28b9b615fe5c05b1a141ed756ba32b6d215ff"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-CAPITAL-FLOW-US-SPY-af2addfaea49",
      claimText: "Moomoo OpenAPI CAPITAL_FLOW for US.SPY contains 251 net-flow observations spanning 2025-10-02 to 2026-10-01, with first observed in_flow 996855751.512 and last observed in_flow 1899603790.752.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.SPY-af2addfaea49",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.SPY/capital-flow/history",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo CAPITAL_FLOW provider snapshot for US.SPY",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "af2addfaea49da24984b411e3497b680eb379bef624648323bd1ce00e2a18f83",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-SPY-af2addfaea49",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.SPY in_flow 2025-10-02..2026-10-01; snapshot=MOOMOO-US-CAPITAL-FLOW-01-US-SPY-2026-10-02T09-35-39-292Z; digest=af2addfaea49da24984b411e3497b680eb379bef624648323bd1ce00e2a18f83"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-CAPITAL-FLOW-US-QQQ-c736b3c5b706",
      claimText: "Moomoo OpenAPI CAPITAL_FLOW for US.QQQ contains 251 net-flow observations spanning 2025-10-02 to 2026-10-01, with first observed in_flow -99924400.547 and last observed in_flow 319462467.954.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.QQQ-c736b3c5b706",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.QQQ/capital-flow/history",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo CAPITAL_FLOW provider snapshot for US.QQQ",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "c736b3c5b7066cd269dac69ea8af99915b29b8d31b8dea383f6838a06f9931d4",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-QQQ-c736b3c5b706",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.QQQ in_flow 2025-10-02..2026-10-01; snapshot=MOOMOO-US-CAPITAL-FLOW-01-US-QQQ-2026-10-02T09-35-39-292Z; digest=c736b3c5b7066cd269dac69ea8af99915b29b8d31b8dea383f6838a06f9931d4"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-CAPITAL-FLOW-US-XLK-303fde7c04a7",
      claimText: "Moomoo OpenAPI CAPITAL_FLOW for US.XLK contains 251 net-flow observations spanning 2025-10-02 to 2026-10-01, with first observed in_flow 3136766.618 and last observed in_flow 49073192.804.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.XLK-303fde7c04a7",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.XLK/capital-flow/history",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo CAPITAL_FLOW provider snapshot for US.XLK",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "303fde7c04a758c25539c557920e5b3a6492a2997013c520c6a185bda1194ae2",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-XLK-303fde7c04a7",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLK in_flow 2025-10-02..2026-10-01; snapshot=MOOMOO-US-CAPITAL-FLOW-01-US-XLK-2026-10-02T09-35-39-292Z; digest=303fde7c04a758c25539c557920e5b3a6492a2997013c520c6a185bda1194ae2"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-CAPITAL-FLOW-US-XLF-ef5988702834",
      claimText: "Moomoo OpenAPI CAPITAL_FLOW for US.XLF contains 251 net-flow observations spanning 2025-10-02 to 2026-10-01, with first observed in_flow -1785697.132 and last observed in_flow 85293592.269.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.XLF-ef5988702834",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.XLF/capital-flow/history",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo CAPITAL_FLOW provider snapshot for US.XLF",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "ef59887028344ce6a30fdf458dedfb98f4c51b070a8947e6169686e22c4f3f9f",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-XLF-ef5988702834",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLF in_flow 2025-10-02..2026-10-01; snapshot=MOOMOO-US-CAPITAL-FLOW-01-US-XLF-2026-10-02T09-35-39-292Z; digest=ef59887028344ce6a30fdf458dedfb98f4c51b070a8947e6169686e22c4f3f9f"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-CAPITAL-FLOW-US-XLI-3d5b79033370",
      claimText: "Moomoo OpenAPI CAPITAL_FLOW for US.XLI contains 251 net-flow observations spanning 2025-10-02 to 2026-10-01, with first observed in_flow 1987075.573 and last observed in_flow 52663447.278.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.XLI-3d5b79033370",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.XLI/capital-flow/history",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo CAPITAL_FLOW provider snapshot for US.XLI",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "3d5b790333700732b5dff29967565828571cba8ea91bddfbf975c699511cf046",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-XLI-3d5b79033370",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLI in_flow 2025-10-02..2026-10-01; snapshot=MOOMOO-US-CAPITAL-FLOW-01-US-XLI-2026-10-02T09-35-39-292Z; digest=3d5b790333700732b5dff29967565828571cba8ea91bddfbf975c699511cf046"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-CAPITAL-FLOW-US-XLY-214848ca8020",
      claimText: "Moomoo OpenAPI CAPITAL_FLOW for US.XLY contains 251 net-flow observations spanning 2025-10-02 to 2026-10-01, with first observed in_flow 7864067.558 and last observed in_flow -22343931.89.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.XLY-214848ca8020",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.XLY/capital-flow/history",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo CAPITAL_FLOW provider snapshot for US.XLY",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "214848ca8020c32151435e041d6826366c964483f45b322dbadf3df717f877c7",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-XLY-214848ca8020",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLY in_flow 2025-10-02..2026-10-01; snapshot=MOOMOO-US-CAPITAL-FLOW-01-US-XLY-2026-10-02T09-35-39-292Z; digest=214848ca8020c32151435e041d6826366c964483f45b322dbadf3df717f877c7"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-CAPITAL-FLOW-US-XLE-b3a889fce7db",
      claimText: "Moomoo OpenAPI CAPITAL_FLOW for US.XLE contains 251 net-flow observations spanning 2025-10-02 to 2026-10-01, with first observed in_flow 33921877.12 and last observed in_flow 32539948.187.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.XLE-b3a889fce7db",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.XLE/capital-flow/history",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo CAPITAL_FLOW provider snapshot for US.XLE",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "b3a889fce7db5ab7d00849b7747a22f3eff6d1ca04e29fe5c289927759c2231d",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-XLE-b3a889fce7db",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLE in_flow 2025-10-02..2026-10-01; snapshot=MOOMOO-US-CAPITAL-FLOW-01-US-XLE-2026-10-02T09-35-39-292Z; digest=b3a889fce7db5ab7d00849b7747a22f3eff6d1ca04e29fe5c289927759c2231d"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-CAPITAL-FLOW-US-XLV-1d33a605f2db",
      claimText: "Moomoo OpenAPI CAPITAL_FLOW for US.XLV contains 251 net-flow observations spanning 2025-10-02 to 2026-10-01, with first observed in_flow -67708712.838 and last observed in_flow 17097346.103.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-CAPITAL_FLOW-US.XLV-1d33a605f2db",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.XLV/capital-flow/history",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo CAPITAL_FLOW provider snapshot for US.XLV",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "1d33a605f2dbeca301be4907d811005e7fc629fcf683acc2b4aabf5b07f42bc9",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-CAPITAL-FLOW-US-XLV-1d33a605f2db",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.XLV in_flow 2025-10-02..2026-10-01; snapshot=MOOMOO-US-CAPITAL-FLOW-01-US-XLV-2026-10-02T09-35-39-292Z; digest=1d33a605f2dbeca301be4907d811005e7fc629fcf683acc2b4aabf5b07f42bc9"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-VALUATION-US-AAPL-PE-3c29c842432f",
      claimText: "Moomoo OpenAPI VALUATION PE for US.AAPL reports current value 37.88, interval average 31.209, historical percentile 91.5470494, historical observations 1254.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-VALUATION-US.AAPL-3c29c842432f",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.AAPL/valuation/detail",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo VALUATION provider snapshot for US.AAPL",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "3c29c842432f5786b94d892b863b459d85902f11676148144782b20937741bb7",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-VALUATION-US-AAPL-PE-3c29c842432f",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AAPL valuation PE; snapshot=MOOMOO-US-VALUATION-01-US-AAPL-PE-2026-10-02T09-35-39-292Z; digest=3c29c842432f5786b94d892b863b459d85902f11676148144782b20937741bb7"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-VALUATION-US-AAPL-PB-f4706caecf82",
      claimText: "Moomoo OpenAPI VALUATION PB for US.AAPL reports current value 44.837, interval average 45.571, historical percentile 46.7304625, historical observations 1254.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-VALUATION-US.AAPL-f4706caecf82",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.AAPL/valuation/detail",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo VALUATION provider snapshot for US.AAPL",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "f4706caecf825971bd267f1af9be901249f222397a9e74f03ac271dc2261b2dc",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-VALUATION-US-AAPL-PB-f4706caecf82",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AAPL valuation PB; snapshot=MOOMOO-US-VALUATION-01-US-AAPL-PB-2026-10-02T09-35-39-292Z; digest=f4706caecf825971bd267f1af9be901249f222397a9e74f03ac271dc2261b2dc"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-VALUATION-US-AAPL-PS-9f9dc4dd8a19",
      claimText: "Moomoo OpenAPI VALUATION PS for US.AAPL reports current value 10.326, interval average 7.852, historical percentile 98.0063795, historical observations 1254.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-VALUATION-US.AAPL-9f9dc4dd8a19",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.AAPL/valuation/detail",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo VALUATION provider snapshot for US.AAPL",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "9f9dc4dd8a190388564e461afac95a6184bc9cda1a689abd4a57a8f0e1a1e729",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-VALUATION-US-AAPL-PS-9f9dc4dd8a19",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AAPL valuation PS; snapshot=MOOMOO-US-VALUATION-01-US-AAPL-PS-2026-10-02T09-35-39-292Z; digest=9f9dc4dd8a190388564e461afac95a6184bc9cda1a689abd4a57a8f0e1a1e729"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-VALUATION-US-MSFT-PE-1c269a237a05",
      claimText: "Moomoo OpenAPI VALUATION PE for US.MSFT reports current value 28.568, interval average 32.429, historical percentile 27.7511961, historical observations 1254.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-VALUATION-US.MSFT-1c269a237a05",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.MSFT/valuation/detail",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo VALUATION provider snapshot for US.MSFT",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "1c269a237a05f94d9551e1f2bc85239a1243964b502aa6bcd083e3932c4f22c3",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-VALUATION-US-MSFT-PE-1c269a237a05",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.MSFT valuation PE; snapshot=MOOMOO-US-VALUATION-01-US-MSFT-PE-2026-10-02T09-35-39-292Z; digest=1c269a237a05f94d9551e1f2bc85239a1243964b502aa6bcd083e3932c4f22c3"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-VALUATION-US-MSFT-PB-d97df01f3fb6",
      claimText: "Moomoo OpenAPI VALUATION PB for US.MSFT reports current value 8.607, interval average 11.334, historical percentile 13.3173843, historical observations 1254.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-VALUATION-US.MSFT-d97df01f3fb6",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.MSFT/valuation/detail",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo VALUATION provider snapshot for US.MSFT",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "d97df01f3fb601dbee36027d7a62b4068a0e7c348d7c21f5f9991fdd24aff273",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-VALUATION-US-MSFT-PB-d97df01f3fb6",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.MSFT valuation PB; snapshot=MOOMOO-US-VALUATION-01-US-MSFT-PB-2026-10-02T09-35-39-292Z; digest=d97df01f3fb601dbee36027d7a62b4068a0e7c348d7c21f5f9991fdd24aff273"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-VALUATION-US-MSFT-PS-05b72a5eafa4",
      claimText: "Moomoo OpenAPI VALUATION PS for US.MSFT reports current value 11.474, interval average 11.668, historical percentile 42.3444976, historical observations 1254.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-VALUATION-US.MSFT-05b72a5eafa4",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.MSFT/valuation/detail",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo VALUATION provider snapshot for US.MSFT",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "05b72a5eafa4cec42ff6a43c580151049d09fc4b0ef4211c1cbd87da3e7d5c52",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-VALUATION-US-MSFT-PS-05b72a5eafa4",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.MSFT valuation PS; snapshot=MOOMOO-US-VALUATION-01-US-MSFT-PS-2026-10-02T09-35-39-292Z; digest=05b72a5eafa4cec42ff6a43c580151049d09fc4b0ef4211c1cbd87da3e7d5c52"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-VALUATION-US-AMZN-PE-e6c727c266ae",
      claimText: "Moomoo OpenAPI VALUATION PE for US.AMZN reports current value 19.97, interval average 40.114, historical percentile 18.9792663, historical observations 1254.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-VALUATION-US.AMZN-e6c727c266ae",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.AMZN/valuation/detail",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo VALUATION provider snapshot for US.AMZN",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "e6c727c266ae740a9ccc9033b92193af58753be5d854d3702acce78a87956d6b",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-VALUATION-US-AMZN-PE-e6c727c266ae",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AMZN valuation PE; snapshot=MOOMOO-US-VALUATION-01-US-AMZN-PE-2026-10-02T09-35-39-292Z; digest=e6c727c266ae740a9ccc9033b92193af58753be5d854d3702acce78a87956d6b"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-VALUATION-US-AMZN-PB-b4bd35f5f4b2",
      claimText: "Moomoo OpenAPI VALUATION PB for US.AMZN reports current value 4.853, interval average 6.604, historical percentile 14.3540669, historical observations 1254.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-VALUATION-US.AMZN-b4bd35f5f4b2",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.AMZN/valuation/detail",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo VALUATION provider snapshot for US.AMZN",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "b4bd35f5f4b28fdd4286ae8a74bb0ce0b35d2ca5ee25c2de639d5bb7607451d1",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-VALUATION-US-AMZN-PB-b4bd35f5f4b2",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AMZN valuation PB; snapshot=MOOMOO-US-VALUATION-01-US-AMZN-PB-2026-10-02T09-35-39-292Z; digest=b4bd35f5f4b28fdd4286ae8a74bb0ce0b35d2ca5ee25c2de639d5bb7607451d1"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-VALUATION-US-AMZN-PS-cbf4e81dcb13",
      claimText: "Moomoo OpenAPI VALUATION PS for US.AMZN reports current value 3.451, interval average 2.613, historical percentile 73.444976, historical observations 1254.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-VALUATION-US.AMZN-cbf4e81dcb13",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.AMZN/valuation/detail",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo VALUATION provider snapshot for US.AMZN",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "cbf4e81dcb131b1493e6e11775bd7486fea11d07e98ea9659e24bfdd7ddf565c",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-VALUATION-US-AMZN-PS-cbf4e81dcb13",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AMZN valuation PS; snapshot=MOOMOO-US-VALUATION-01-US-AMZN-PS-2026-10-02T09-35-39-292Z; digest=cbf4e81dcb131b1493e6e11775bd7486fea11d07e98ea9659e24bfdd7ddf565c"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-VALUATION-US-NVDA-PE-d9c7cc989693",
      claimText: "Moomoo OpenAPI VALUATION PE for US.NVDA reports current value 29.185, interval average 72.386, historical percentile 2.15311, historical observations 1254.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-VALUATION-US.NVDA-d9c7cc989693",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.NVDA/valuation/detail",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo VALUATION provider snapshot for US.NVDA",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "d9c7cc98969363a0b0de1bebd13b2004ad2606ab600240030e910082ea9d1b49",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-VALUATION-US-NVDA-PE-d9c7cc989693",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.NVDA valuation PE; snapshot=MOOMOO-US-VALUATION-01-US-NVDA-PE-2026-10-02T09-35-39-292Z; digest=d9c7cc98969363a0b0de1bebd13b2004ad2606ab600240030e910082ea9d1b49"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-VALUATION-US-NVDA-PB-d808f14aa5be",
      claimText: "Moomoo OpenAPI VALUATION PB for US.NVDA reports current value 24.298, interval average 35.98, historical percentile 21.4513556, historical observations 1254.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-VALUATION-US.NVDA-d808f14aa5be",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.NVDA/valuation/detail",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo VALUATION provider snapshot for US.NVDA",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "d808f14aa5be25c6f3ef48ad09aa9882ec3798f40fd3995a8d8699533a0e621a",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-VALUATION-US-NVDA-PB-d808f14aa5be",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.NVDA valuation PB; snapshot=MOOMOO-US-VALUATION-01-US-NVDA-PB-2026-10-02T09-35-39-292Z; digest=d808f14aa5be25c6f3ef48ad09aa9882ec3798f40fd3995a8d8699533a0e621a"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-VALUATION-US-NVDA-PS-2c3b0489ae98",
      claimText: "Moomoo OpenAPI VALUATION PS for US.NVDA reports current value 18.363, interval average 26.031, historical percentile 18.2615629, historical observations 1254.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-VALUATION-US.NVDA-2c3b0489ae98",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.NVDA/valuation/detail",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo VALUATION provider snapshot for US.NVDA",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "2c3b0489ae9814781c4e1c5652220ac142de40c3d75a0c428e70790c89791223",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-VALUATION-US-NVDA-PS-2c3b0489ae98",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.NVDA valuation PS; snapshot=MOOMOO-US-VALUATION-01-US-NVDA-PS-2026-10-02T09-35-39-292Z; digest=2c3b0489ae9814781c4e1c5652220ac142de40c3d75a0c428e70790c89791223"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-VALUATION-US-JPM-PE-00b1b7654c0a",
      claimText: "Moomoo OpenAPI VALUATION PE for US.JPM reports current value 14.275, interval average 11.924, historical percentile 76.076555, historical observations 1254.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-VALUATION-US.JPM-00b1b7654c0a",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.JPM/valuation/detail",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo VALUATION provider snapshot for US.JPM",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "00b1b7654c0aa8340ece078e254355462d9812f5c42158f4f03c8782cfe4b35e",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-VALUATION-US-JPM-PE-00b1b7654c0a",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.JPM valuation PE; snapshot=MOOMOO-US-VALUATION-01-US-JPM-PE-2026-10-02T09-35-39-292Z; digest=00b1b7654c0aa8340ece078e254355462d9812f5c42158f4f03c8782cfe4b35e"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-VALUATION-US-JPM-PB-9351604c22ff",
      claimText: "Moomoo OpenAPI VALUATION PB for US.JPM reports current value 2.504, interval average 1.898, historical percentile 90.7496012, historical observations 1254.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-VALUATION-US.JPM-9351604c22ff",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.JPM/valuation/detail",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo VALUATION provider snapshot for US.JPM",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "9351604c22ff142c67197c1d7926dfebb4f4f4de8de3dd5e2d746800460a24bd",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-VALUATION-US-JPM-PB-9351604c22ff",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.JPM valuation PB; snapshot=MOOMOO-US-VALUATION-01-US-JPM-PB-2026-10-02T09-35-39-292Z; digest=9351604c22ff142c67197c1d7926dfebb4f4f4de8de3dd5e2d746800460a24bd"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-VALUATION-US-JPM-PS-dc08bcbc4299",
      claimText: "Moomoo OpenAPI VALUATION PS for US.JPM reports current value 4.441, interval average 3.674, historical percentile 79.5853269, historical observations 1254.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-VALUATION-US.JPM-dc08bcbc4299",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.JPM/valuation/detail",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo VALUATION provider snapshot for US.JPM",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "dc08bcbc4299b932f6988c604127cf5d73bb3b2001812867f444d3ee15de4cc7",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-VALUATION-US-JPM-PS-dc08bcbc4299",
      dossierId: "DOSSIER-US",
      laneId: "PRESSURE_FIELD",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.JPM valuation PS; snapshot=MOOMOO-US-VALUATION-01-US-JPM-PS-2026-10-02T09-35-39-292Z; digest=dc08bcbc4299b932f6988c604127cf5d73bb3b2001812867f444d3ee15de4cc7"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-AAPL-S1-3c8df0dee6b3",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.AAPL statement type 1 contains 50 reporting periods and 22 distinct reported fields across 1040 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AAPL-3c8df0dee6b3",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.AAPL/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.AAPL",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "3c8df0dee6b37169d56d96affa0d2b16d3e662fe46312bd3b6efa587c57478fe",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-AAPL-S1-3c8df0dee6b3",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AAPL financial statements S1; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q3; snapshot=MOOMOO-US-FINANCIALS-01-US-AAPL-S1-2026-10-02T09-35-39-292Z; digest=3c8df0dee6b37169d56d96affa0d2b16d3e662fe46312bd3b6efa587c57478fe"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-AAPL-S2-8ef3f09a181e",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.AAPL statement type 2 contains 50 reporting periods and 45 distinct reported fields across 1818 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AAPL-8ef3f09a181e",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.AAPL/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.AAPL",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "8ef3f09a181eadbaeff85099bbcb56ab00b629c59917f48a5de597513a7e3c4e",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-AAPL-S2-8ef3f09a181e",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AAPL financial statements S2; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q3; snapshot=MOOMOO-US-FINANCIALS-01-US-AAPL-S2-2026-10-02T09-35-39-292Z; digest=8ef3f09a181eadbaeff85099bbcb56ab00b629c59917f48a5de597513a7e3c4e"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-AAPL-S3-3f28163636d0",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.AAPL statement type 3 contains 50 reporting periods and 30 distinct reported fields across 1373 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AAPL-3f28163636d0",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.AAPL/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.AAPL",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "3f28163636d0b75f53b91c69b26728aadd4dd2277a5793746f1e55852038809c",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-AAPL-S3-3f28163636d0",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AAPL financial statements S3; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q3; snapshot=MOOMOO-US-FINANCIALS-01-US-AAPL-S3-2026-10-02T09-35-39-292Z; digest=3f28163636d0b75f53b91c69b26728aadd4dd2277a5793746f1e55852038809c"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-AAPL-S4-3b758143ba4c",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.AAPL statement type 4 contains 50 reporting periods and 39 distinct reported fields across 1370 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AAPL-3b758143ba4c",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.AAPL/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.AAPL",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "3b758143ba4c6d2b614d9225ba1fd5aea14ecad6520d401a1a17fb290e65d80b",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-AAPL-S4-3b758143ba4c",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AAPL financial statements S4; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q3; snapshot=MOOMOO-US-FINANCIALS-01-US-AAPL-S4-2026-10-02T09-35-39-292Z; digest=3b758143ba4c6d2b614d9225ba1fd5aea14ecad6520d401a1a17fb290e65d80b"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-MSFT-S1-a54658d106ce",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.MSFT statement type 1 contains 50 reporting periods and 28 distinct reported fields across 1318 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.MSFT-a54658d106ce",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.MSFT/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.MSFT",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "a54658d106ceb28930e983e67186e4b4125ecd64e865f178483698dcfa532f6b",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-MSFT-S1-a54658d106ce",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.MSFT financial statements S1; periodCount=50; firstPeriod=2017/FY; lastPeriod=2026/Q4; snapshot=MOOMOO-US-FINANCIALS-01-US-MSFT-S1-2026-10-02T09-35-39-292Z; digest=a54658d106ceb28930e983e67186e4b4125ecd64e865f178483698dcfa532f6b"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-MSFT-S2-53ecfdf6b3bf",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.MSFT statement type 2 contains 50 reporting periods and 44 distinct reported fields across 2061 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.MSFT-53ecfdf6b3bf",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.MSFT/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.MSFT",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "53ecfdf6b3bff22ba91911517b402d7ef5e20058a063d46e977344b30281517d",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-MSFT-S2-53ecfdf6b3bf",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.MSFT financial statements S2; periodCount=50; firstPeriod=2017/FY; lastPeriod=2026/Q4; snapshot=MOOMOO-US-FINANCIALS-01-US-MSFT-S2-2026-10-02T09-35-39-292Z; digest=53ecfdf6b3bff22ba91911517b402d7ef5e20058a063d46e977344b30281517d"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-MSFT-S3-cc7be48456b3",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.MSFT statement type 3 contains 50 reporting periods and 31 distinct reported fields across 1493 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.MSFT-cc7be48456b3",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.MSFT/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.MSFT",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "cc7be48456b36eb996632e1256ab4aedd4a9550cb45db1673d0df6d7c5e96309",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-MSFT-S3-cc7be48456b3",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.MSFT financial statements S3; periodCount=50; firstPeriod=2017/FY; lastPeriod=2026/Q4; snapshot=MOOMOO-US-FINANCIALS-01-US-MSFT-S3-2026-10-02T09-35-39-292Z; digest=cc7be48456b36eb996632e1256ab4aedd4a9550cb45db1673d0df6d7c5e96309"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-MSFT-S4-701db431959c",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.MSFT statement type 4 contains 50 reporting periods and 41 distinct reported fields across 1490 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.MSFT-701db431959c",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.MSFT/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.MSFT",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "701db431959c5a0371a570cd3fb0ede01a2ae8dec4a6ad20d9f77f1f925f5f8d",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-MSFT-S4-701db431959c",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.MSFT financial statements S4; periodCount=50; firstPeriod=2017/FY; lastPeriod=2026/Q4; snapshot=MOOMOO-US-FINANCIALS-01-US-MSFT-S4-2026-10-02T09-35-39-292Z; digest=701db431959c5a0371a570cd3fb0ede01a2ae8dec4a6ad20d9f77f1f925f5f8d"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-AMZN-S1-7e7caab530d4",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.AMZN statement type 1 contains 50 reporting periods and 25 distinct reported fields across 1232 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AMZN-7e7caab530d4",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.AMZN/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.AMZN",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "7e7caab530d49afa469648f834a19d0a1393589bf57b0819df8e463c63e745d6",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-AMZN-S1-7e7caab530d4",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AMZN financial statements S1; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-AMZN-S1-2026-10-02T09-35-39-292Z; digest=7e7caab530d49afa469648f834a19d0a1393589bf57b0819df8e463c63e745d6"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-AMZN-S2-c52c3ba75470",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.AMZN statement type 2 contains 50 reporting periods and 38 distinct reported fields across 1736 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AMZN-c52c3ba75470",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.AMZN/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.AMZN",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "c52c3ba7547029e485c78282ebec8858597490d3a569629dbff97cc8ea70ee5a",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-AMZN-S2-c52c3ba75470",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AMZN financial statements S2; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-AMZN-S2-2026-10-02T09-35-39-292Z; digest=c52c3ba7547029e485c78282ebec8858597490d3a569629dbff97cc8ea70ee5a"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-AMZN-S3-53cb070505ce",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.AMZN statement type 3 contains 50 reporting periods and 27 distinct reported fields across 1233 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AMZN-53cb070505ce",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.AMZN/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.AMZN",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "53cb070505ce2ffea719de21fd64b332a21eeeb11d9d86c7b0a47100ffcaf0d0",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-AMZN-S3-53cb070505ce",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AMZN financial statements S3; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-AMZN-S3-2026-10-02T09-35-39-292Z; digest=53cb070505ce2ffea719de21fd64b332a21eeeb11d9d86c7b0a47100ffcaf0d0"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-AMZN-S4-bff326051ec7",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.AMZN statement type 4 contains 50 reporting periods and 37 distinct reported fields across 1366 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.AMZN-bff326051ec7",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.AMZN/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.AMZN",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "bff326051ec73fcb81576875b84ecedfb59b68f76e8dfb8f1694576092750126",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-AMZN-S4-bff326051ec7",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AMZN financial statements S4; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-AMZN-S4-2026-10-02T09-35-39-292Z; digest=bff326051ec73fcb81576875b84ecedfb59b68f76e8dfb8f1694576092750126"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-NVDA-S1-af8404f86a79",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.NVDA statement type 1 contains 50 reporting periods and 25 distinct reported fields across 1124 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.NVDA-af8404f86a79",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.NVDA/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.NVDA",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "af8404f86a79b9dd9520bbb4ee07cc40f5e0e5eed1253fae15b7bd5fc5052106",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-NVDA-S1-af8404f86a79",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.NVDA financial statements S1; periodCount=50; firstPeriod=2017/FY; lastPeriod=2027/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-NVDA-S1-2026-10-02T09-35-39-292Z; digest=af8404f86a79b9dd9520bbb4ee07cc40f5e0e5eed1253fae15b7bd5fc5052106"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-NVDA-S2-1a23b9f36576",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.NVDA statement type 2 contains 50 reporting periods and 55 distinct reported fields across 2264 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.NVDA-1a23b9f36576",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.NVDA/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.NVDA",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "1a23b9f36576a5927f01c9729e151f6511832ea8b7bddd02346bfd7d691a749d",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-NVDA-S2-1a23b9f36576",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.NVDA financial statements S2; periodCount=50; firstPeriod=2017/FY; lastPeriod=2027/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-NVDA-S2-2026-10-02T09-35-39-292Z; digest=1a23b9f36576a5927f01c9729e151f6511832ea8b7bddd02346bfd7d691a749d"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-NVDA-S3-56fb80c85a76",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.NVDA statement type 3 contains 50 reporting periods and 30 distinct reported fields across 1408 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.NVDA-56fb80c85a76",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.NVDA/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.NVDA",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "56fb80c85a76ec3d40372e87036a35c435f1456f99dc8541b26dfa399e1a6b49",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-NVDA-S3-56fb80c85a76",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.NVDA financial statements S3; periodCount=50; firstPeriod=2017/FY; lastPeriod=2027/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-NVDA-S3-2026-10-02T09-35-39-292Z; digest=56fb80c85a76ec3d40372e87036a35c435f1456f99dc8541b26dfa399e1a6b49"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-NVDA-S4-33463c5ceec7",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.NVDA statement type 4 contains 50 reporting periods and 39 distinct reported fields across 1372 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.NVDA-33463c5ceec7",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.NVDA/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.NVDA",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "33463c5ceec7e7b7b6bc91ac94f32dd56eea4ef17d4fd13e5b74d15558e4fad7",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-NVDA-S4-33463c5ceec7",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.NVDA financial statements S4; periodCount=50; firstPeriod=2017/FY; lastPeriod=2027/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-NVDA-S4-2026-10-02T09-35-39-292Z; digest=33463c5ceec7e7b7b6bc91ac94f32dd56eea4ef17d4fd13e5b74d15558e4fad7"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-JPM-S1-d19774bcd7dc",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.JPM statement type 1 contains 50 reporting periods and 35 distinct reported fields across 1642 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.JPM-d19774bcd7dc",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.JPM/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.JPM",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "d19774bcd7dc4622b1d2aea0d9204856bc92af54f9a0c1344b8b4827bce83448",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-JPM-S1-d19774bcd7dc",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.JPM financial statements S1; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-JPM-S1-2026-10-02T09-35-39-292Z; digest=d19774bcd7dc4622b1d2aea0d9204856bc92af54f9a0c1344b8b4827bce83448"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-JPM-S2-9d0af479d394",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.JPM statement type 2 contains 50 reporting periods and 44 distinct reported fields across 2005 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.JPM-9d0af479d394",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.JPM/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.JPM",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "9d0af479d3946dd243dc0ef9336f506ac3a69eaecc7c80581be5d4a9875f15a0",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-JPM-S2-9d0af479d394",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.JPM financial statements S2; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-JPM-S2-2026-10-02T09-35-39-292Z; digest=9d0af479d3946dd243dc0ef9336f506ac3a69eaecc7c80581be5d4a9875f15a0"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-JPM-S3-4d0fb94c1ddf",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.JPM statement type 3 contains 50 reporting periods and 33 distinct reported fields across 1511 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.JPM-4d0fb94c1ddf",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.JPM/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.JPM",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "4d0fb94c1ddf6a8635b2ff86d1ed02e785dc5ef84b3205cd6cea62e81193ce2c",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-JPM-S3-4d0fb94c1ddf",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.JPM financial statements S3; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-JPM-S3-2026-10-02T09-35-39-292Z; digest=4d0fb94c1ddf6a8635b2ff86d1ed02e785dc5ef84b3205cd6cea62e81193ce2c"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-FINANCIALS-US-JPM-S4-0c6cf1014aa8",
      claimText: "Moomoo OpenAPI FINANCIAL_STATEMENTS for US.JPM statement type 4 contains 50 reporting periods and 27 distinct reported fields across 757 normalized field observations.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-FINANCIAL_STATEMENTS-US.JPM-0c6cf1014aa8",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.JPM/financials/statements",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo FINANCIAL_STATEMENTS provider snapshot for US.JPM",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "0c6cf1014aa820923a6712d98f69e9d07e9cf82c4779bb88521a96955e3b6cba",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-FINANCIALS-US-JPM-S4-0c6cf1014aa8",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.JPM financial statements S4; periodCount=50; firstPeriod=2016/FY; lastPeriod=2026/Q2; snapshot=MOOMOO-US-FINANCIALS-01-US-JPM-S4-2026-10-02T09-35-39-292Z; digest=0c6cf1014aa820923a6712d98f69e9d07e9cf82c4779bb88521a96955e3b6cba"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-REVENUE-BREAKDOWN-US-AAPL-685aae881d35",
      claimText: "Moomoo OpenAPI REVENUE_BREAKDOWN for US.AAPL contains 11 distinct breakdown items across 2 breakdown dimensions for reporting period(s) 2025/FY.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-REVENUE_BREAKDOWN-US.AAPL-685aae881d35",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.AAPL/financials/revenue-breakdown",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo REVENUE_BREAKDOWN provider snapshot for US.AAPL",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "685aae881d3542e3b7716c48f2cd93bc1849da6394c14aa015d4e91529324a26",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-REVENUE-BREAKDOWN-US-AAPL-685aae881d35",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AAPL revenue breakdown; periods=2025/FY; snapshot=MOOMOO-US-REVENUE-BREAKDOWN-01-US-AAPL-2026-10-02T09-35-39-292Z; digest=685aae881d3542e3b7716c48f2cd93bc1849da6394c14aa015d4e91529324a26"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-REVENUE-BREAKDOWN-US-MSFT-ed4dfc0eaf45",
      claimText: "Moomoo OpenAPI REVENUE_BREAKDOWN for US.MSFT contains 5 distinct breakdown items across 2 breakdown dimensions for reporting period(s) 2026/FY.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-REVENUE_BREAKDOWN-US.MSFT-ed4dfc0eaf45",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.MSFT/financials/revenue-breakdown",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo REVENUE_BREAKDOWN provider snapshot for US.MSFT",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "ed4dfc0eaf452602cec127d342120cb403ea709a7ebb297b3ead619f425926a3",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-REVENUE-BREAKDOWN-US-MSFT-ed4dfc0eaf45",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.MSFT revenue breakdown; periods=2026/FY; snapshot=MOOMOO-US-REVENUE-BREAKDOWN-01-US-MSFT-2026-10-02T09-35-39-292Z; digest=ed4dfc0eaf452602cec127d342120cb403ea709a7ebb297b3ead619f425926a3"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-REVENUE-BREAKDOWN-US-AMZN-d04cbc0a3af5",
      claimText: "Moomoo OpenAPI REVENUE_BREAKDOWN for US.AMZN contains 8 distinct breakdown items across 2 breakdown dimensions for reporting period(s) 2025/FY.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-REVENUE_BREAKDOWN-US.AMZN-d04cbc0a3af5",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.AMZN/financials/revenue-breakdown",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo REVENUE_BREAKDOWN provider snapshot for US.AMZN",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "d04cbc0a3af5759411b384e455165a40216ccab3ffec1fb498ffe307f569659c",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-REVENUE-BREAKDOWN-US-AMZN-d04cbc0a3af5",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.AMZN revenue breakdown; periods=2025/FY; snapshot=MOOMOO-US-REVENUE-BREAKDOWN-01-US-AMZN-2026-10-02T09-35-39-292Z; digest=d04cbc0a3af5759411b384e455165a40216ccab3ffec1fb498ffe307f569659c"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-REVENUE-BREAKDOWN-US-NVDA-94da861559a8",
      claimText: "Moomoo OpenAPI REVENUE_BREAKDOWN for US.NVDA contains 6 distinct breakdown items across 2 breakdown dimensions for reporting period(s) 2026/FY.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-REVENUE_BREAKDOWN-US.NVDA-94da861559a8",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.NVDA/financials/revenue-breakdown",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo REVENUE_BREAKDOWN provider snapshot for US.NVDA",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "94da861559a8e3d28c31f85f16a45343303a34211ea1bdf05c404e3257640687",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-REVENUE-BREAKDOWN-US-NVDA-94da861559a8",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.NVDA revenue breakdown; periods=2026/FY; snapshot=MOOMOO-US-REVENUE-BREAKDOWN-01-US-NVDA-2026-10-02T09-35-39-292Z; digest=94da861559a8e3d28c31f85f16a45343303a34211ea1bdf05c404e3257640687"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    },
    {
      schemaVersion: "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0",
      claimId: "MOOMOO-REVENUE-BREAKDOWN-US-JPM-7f1bc205f22f",
      claimText: "Moomoo OpenAPI REVENUE_BREAKDOWN for US.JPM contains 9 distinct breakdown items across 2 breakdown dimensions for reporting period(s) 2025/FY.",
      claimType: "GENERAL_CURRENT_FACT",
      sourceId: "MOOMOO-REVENUE_BREAKDOWN-US.JPM-7f1bc205f22f",
      sourceUrl: "https://webapi.moomoo.com/api/v1.0/quote/US.JPM/financials/revenue-breakdown",
      authorityClass: "MARKET_DATA_PROVIDER",
      publisher: "Moomoo OpenAPI",
      title: "Moomoo REVENUE_BREAKDOWN provider snapshot for US.JPM",
      publishedAt: null,
      retrievedAt: "2026-10-02T09:35:39.292Z",
      sourceVersion: "7f1bc205f22ffa90dc7b1a79978ceb16e0aee7df2bdd9c060c00e01922c3d62a",
      freshnessState: "FRESH",
      supportLevel: "DIRECT",
      jurisdiction: "US",
      domain: "FINANCIAL_MARKETS",
      conflicts: [],
      boundaries: {
        searchRankUsedAsAuthority: false,
        sourceVotingUsed: false,
        lensMutationAllowed: false,
        proseGenerationAllowed: false
      },
      claimCandidateId: "MOOMOO-REVENUE-BREAKDOWN-US-JPM-7f1bc205f22f",
      dossierId: "DOSSIER-US",
      laneId: "INDUSTRY",
      sourceLocator: {
        type: "PROVIDER_SERIES_WINDOW",
        value: "US.JPM revenue breakdown; periods=2025/FY; snapshot=MOOMOO-US-REVENUE-BREAKDOWN-01-US-JPM-2026-10-02T09-35-39-292Z; digest=7f1bc205f22ffa90dc7b1a79978ceb16e0aee7df2bdd9c060c00e01922c3d62a"
      },
      conflictGroup: null,
      authorityDecision: {
        authorityClass: "MARKET_DATA_PROVIDER",
        domain: "FINANCIAL_MARKETS",
        reviewedAt: "2026-10-02T10:31:41.584Z",
        reviewerRole: "PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY",
        decisionBasis: "Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position."
      },
      evidenceState: "CWA_ADMITTED",
      rreEligibility: "RRE_ELIGIBLE",
      conflictDisposition: {
        conflictState: "NO_CONFLICT",
        selected: true
      }
    }
  ],
  boundary: "Only DIRECT, CWA-admitted, non-conflicted selected provider evidence is present. This does not execute RRE or promote W8E."
};

// content/civilization-atlas/reconfiguration/dossier-af-w8i-accepted-current-dossier-v1.json
var dossier_af_w8i_accepted_current_dossier_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-AF-W8I-ACCEPTED-CURRENT-DOSSIER-v1.0.0",
  status: "ACCEPTED_CURRENT_DOSSIER",
  dossierId: "DOSSIER-AF",
  stage: "W8-I",
  acceptedAt: "2026-10-08",
  humanDecisionReference: "content/civilization-atlas/reconfiguration/dossier-af-w8h-human-decisions-v1.json",
  readoutReference: {
    code: "RRE-READOUT-B6-AF-2026-1-CONTRACT",
    version: "2026.1-contract",
    digest: "af2026b6a1eac3c887d1da7e53af6eb848fa6fd96f87d07c3db7ab1fe823251"
  },
  admittedPositions: [
    {
      candidateId: "AF-RP-22-AF-W8F-SEM-PAN-AFRICAN-PAYMENT-MOBILE-CARRIER",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "PAN_AFRICAN_PAYMENT_MOBILE_CARRIER",
      grammarId: "G6",
      realityDomainId: "P2",
      evidenceRefs: [
        "AF-CARRIER-STRUCTURE-2026-001",
        "AF-TECHNOLOGY-2026-001"
      ]
    },
    {
      candidateId: "AF-RP-23-AF-W8F-SEM-REGIONAL-PRODUCTION-INTEGRATION-RUNTIME",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "REGIONAL_PRODUCTION_INTEGRATION_RUNTIME",
      grammarId: "G7",
      realityDomainId: "P2",
      evidenceRefs: [
        "AF-INDUSTRY-2026-001",
        "AF-INFRASTRUCTURE-2026-001"
      ]
    },
    {
      candidateId: "AF-RP-18-AF-W8F-SEM-DEBT-FINANCING-EXTERNAL-PRICE-CONSTRAINT",
      runtimePositionId: "RP-18",
      scope: "SUBSYSTEM",
      subsystem: "DEBT_FINANCING_EXTERNAL_PRICE_RUNTIME",
      grammarId: "G2",
      realityDomainId: "P2",
      evidenceRefs: [
        "AF-EXTERNAL-DEPENDENCY-2026-001",
        "AF-PRESSURE-FIELD-2026-001"
      ]
    }
  ],
  preservedReferenceOnly: [
    {
      semanticBasisId: "AF-W8E-SEM-CONTINENTAL-INTEGRATION-RECONFIGURATION",
      state: "REFERENCE_ONLY"
    }
  ],
  projectionBoundary: {
    subsystemPositionsDoNotImplySingleWholeDossierPosition: true,
    priorDossierPositionReuse: false,
    prediction: false,
    historicalPositionShortcut: false,
    continentalIntegrationReconfigurationNotAdmitted: true
  },
  providerCalls: 0
};

// content/civilization-atlas/reconfiguration/dossier-af-w8h-human-decisions-v1.json
var dossier_af_w8h_human_decisions_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-AF-W8H-HUMAN-DECISIONS-v1.0.0",
  status: "HUMAN_DECISIONS_RECORDED",
  dossierId: "DOSSIER-AF",
  stage: "W8-H",
  decidedAt: "2026-10-08",
  decisionAuthority: "OWNER_HUMAN_REVIEW",
  sourceHumanDecision: "Human ACCEPT W8-H",
  records: [
    {
      candidateId: "AF-RP-22-AF-W8F-SEM-PAN-AFRICAN-PAYMENT-MOBILE-CARRIER",
      decision: "ACCEPT",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "PAN_AFRICAN_PAYMENT_MOBILE_CARRIER",
      boundary: "Accepted only for the named AF subsystem; it does not establish one whole-dossier AF position."
    },
    {
      candidateId: "AF-RP-23-AF-W8F-SEM-REGIONAL-PRODUCTION-INTEGRATION-RUNTIME",
      decision: "ACCEPT",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "REGIONAL_PRODUCTION_INTEGRATION_RUNTIME",
      boundary: "Accepted only for the named AF subsystem; it does not establish one whole-dossier AF position."
    },
    {
      candidateId: "AF-RP-18-AF-W8F-SEM-DEBT-FINANCING-EXTERNAL-PRICE-CONSTRAINT",
      decision: "ACCEPT",
      runtimePositionId: "RP-18",
      scope: "SUBSYSTEM",
      subsystem: "DEBT_FINANCING_EXTERNAL_PRICE_RUNTIME",
      boundary: "Accepted only for the named AF subsystem; it does not establish one whole-dossier AF position."
    }
  ],
  boundary: "Only explicitly accepted AF W8-G candidates may advance into W8-I. Prior dossier positions are not decision authority."
};

// content/civilization-atlas/reconfiguration/dossier-af-w8d-rre-readout-v1.json
var dossier_af_w8d_rre_readout_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-AF-W8D-RRE-READOUT-v1.0.0",
  status: "RRE_REQUIRED_LANES_CONSUMED",
  dossierId: "DOSSIER-AF",
  stage: "W8-D",
  readoutReference: {
    code: "RRE-READOUT-B6-AF-2026-1-CONTRACT",
    version: "2026.1-contract",
    digest: "af2026b6a1eac3c887d1da7e53af6eb848fa6fd96f87d07c3db7ab1fe823251"
  },
  readout: "REGIONAL_INTEGRATION_MOBILE_PAYMENT_AND_PRODUCTION_RUNTIME_UNDER_DEBT_INFRASTRUCTURE_AND_EXTERNAL_PRICE_PRESSURE",
  summary: "Current evidence supports an operating African growth and integration runtime carried by mobile networks, PAPSS-linked payments and expanding regional production/trade infrastructure. Yet fragmented infrastructure, high debt-service burdens, financing constraints and exposure to external fuel/fertilizer shocks remain active constraints. No single whole-Africa position is established.",
  evidenceRefs: [
    "AF-DEMOGRAPHY-2026-001",
    "AF-INDUSTRY-2026-001",
    "AF-INFRASTRUCTURE-2026-001",
    "AF-TECHNOLOGY-2026-001",
    "AF-EXTERNAL-DEPENDENCY-2026-001",
    "AF-CARRIER-STRUCTURE-2026-001",
    "AF-PRESSURE-FIELD-2026-001"
  ],
  unknowns: [
    "AfCFTA implementation depth remains uneven.",
    "Digital usage gaps remain very large.",
    "No single whole-dossier Africa position is established."
  ],
  conflicts: [
    "Strong demographic and digital scale coexist with infrastructure fragmentation, debt stress and large cross-country divergence."
  ],
  boundaries: {
    wholeDossierPositionImplied: false
  }
};

// content/civilization-atlas/reconfiguration/dossier-cn-w8i-accepted-current-dossier-v1.json
var dossier_cn_w8i_accepted_current_dossier_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-CN-W8I-ACCEPTED-CURRENT-DOSSIER-v1.0.0",
  status: "ACCEPTED_CURRENT_DOSSIER",
  dossierId: "DOSSIER-CN",
  stage: "W8-I",
  entity: {
    en: "China",
    "zh-Hans": "\u4E2D\u56FD"
  },
  admittedPositions: [
    {
      runtimePositionId: "RP-23",
      phase: 23,
      arc: "ACTIVATION",
      shortLabel: {
        en: "Runtime \xB7 Routing",
        "zh-Hans": "\u8FD0\u884C \xB7 \u8DEF\u5F84"
      },
      scope: "SUBSYSTEM",
      subsystem: "ECONOMIC_LOGISTICS_RUNTIME",
      grammarId: "G7",
      realityDomainId: "P2",
      evidenceRefs: [
        "CN-CARRIER-STRUCTURE-2026-001",
        "CN-EXTERNAL-DEPENDENCY-2026-001",
        "CN-INDUSTRY-2026-001",
        "CN-INFRASTRUCTURE-2026-001"
      ],
      readoutReference: {
        code: "RRE-READOUT-B6-CN-2026-1-CONTRACT",
        version: "2026.1-contract",
        digest: "dd903415622cf8390634eeaf758b432489868352eb6a79a5f3e024e67c7fe871"
      },
      candidateId: "CN-RP-23-CN-W8F-SEM-ECONOMIC-LOGISTICS-RUNTIME",
      humanDecisionReference: "content/civilization-atlas/reconfiguration/dossier-cn-w8h-human-decisions-v1.json"
    },
    {
      runtimePositionId: "RP-22",
      phase: 22,
      arc: "ACTIVATION",
      shortLabel: {
        en: "Carrier \xB7 Routing",
        "zh-Hans": "\u8F7D\u4F53 \xB7 \u8DEF\u5F84"
      },
      scope: "SUBSYSTEM",
      subsystem: "BUSINESS_LOGISTICS_CARRIER",
      grammarId: "G6",
      realityDomainId: "P2",
      evidenceRefs: [
        "CN-CARRIER-STRUCTURE-2026-001",
        "CN-INDUSTRY-2026-001",
        "CN-INFRASTRUCTURE-2026-001"
      ],
      readoutReference: {
        code: "RRE-READOUT-B6-CN-2026-1-CONTRACT",
        version: "2026.1-contract",
        digest: "dd903415622cf8390634eeaf758b432489868352eb6a79a5f3e024e67c7fe871"
      },
      candidateId: "CN-RP-22-CN-W8F-SEM-BUSINESS-LOGISTICS-CARRIER",
      humanDecisionReference: "content/civilization-atlas/reconfiguration/dossier-cn-w8h-human-decisions-v1.json"
    }
  ],
  projectionBoundary: {
    subsystemPositionsDoNotImplySingleWholeDossierPosition: true,
    evidenceRefsPreserved: true,
    currentDossierOnly: true,
    prediction: false,
    historicalPositionShortcut: false,
    usPositionReuse: false,
    unresolvedSemanticBasisRemainExcluded: true
  },
  unresolvedSemanticBasis: [
    "CN-W8F-SEM-DEMOGRAPHIC-CONTINUITY",
    "CN-W8F-SEM-TECHNOLOGY-CAPABILITY",
    "CN-W8F-SEM-STRUCTURAL-PRESSURE"
  ],
  lineage: {
    source: "W8-A",
    claims: "W8-B",
    cwa: "W8-C",
    observableFeatures: "W8-D",
    rre: "W8-E",
    grammarDomain: "W8-F",
    rpCandidates: "W8-G",
    humanReview: "W8-H"
  }
};

// content/civilization-atlas/reconfiguration/dossier-cn-w8h-human-decisions-v1.json
var dossier_cn_w8h_human_decisions_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-CN-W8H-HUMAN-DECISIONS-v1.0.0",
  status: "HUMAN_DECISIONS_RECORDED",
  dossierId: "DOSSIER-CN",
  stage: "W8-H",
  decidedAt: "2026-10-08",
  decisionAuthority: "OWNER_HUMAN_REVIEW",
  records: [
    {
      candidateId: "CN-RP-23-CN-W8F-SEM-ECONOMIC-LOGISTICS-RUNTIME",
      decision: "ACCEPT",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "ECONOMIC_LOGISTICS_RUNTIME",
      boundary: "Accepted only for the named China economic/logistics subsystem; it does not establish a single whole-China runtime position."
    },
    {
      candidateId: "CN-RP-22-CN-W8F-SEM-BUSINESS-LOGISTICS-CARRIER",
      decision: "ACCEPT",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "BUSINESS_LOGISTICS_CARRIER",
      boundary: "Accepted only for the named China business/logistics carrier subsystem; it does not exhaust China's full carrier structure or imply one whole-dossier position."
    }
  ],
  boundary: "Only explicitly accepted CN W8-G candidates may advance into W8-I. US precedent is not decision authority."
};

// content/civilization-atlas/reconfiguration/dossier-eu-w8i-accepted-current-dossier-v1.json
var dossier_eu_w8i_accepted_current_dossier_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-EU-W8I-ACCEPTED-CURRENT-DOSSIER-v1.0.0",
  status: "ACCEPTED_CURRENT_DOSSIER",
  dossierId: "DOSSIER-EU",
  stage: "W8-I",
  acceptedAt: "2026-10-08",
  humanDecisionReference: "content/civilization-atlas/reconfiguration/dossier-eu-w8h-human-decisions-v1.json",
  readoutReference: {
    code: "RRE-READOUT-B6-EU-2026-1-CONTRACT",
    version: "2026.1-contract",
    digest: "6fe8d9d2b675f8b1548b1a0b43f8ce80f8fa41af1d968425de6fb0d6ee2040c2"
  },
  admittedPositions: [
    {
      candidateId: "EU-RP-22-EU-W8F-SEM-FINANCIAL-SETTLEMENT-CARRIER",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "FINANCIAL_SETTLEMENT_CARRIER",
      grammarId: "G6",
      realityDomainId: "P2",
      evidenceRefs: [
        "EU-CARRIER-STRUCTURE-2026-001"
      ]
    },
    {
      candidateId: "EU-RP-23-EU-W8F-SEM-INDUSTRIAL-SYSTEM-RUNTIME",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "INDUSTRIAL_SYSTEM_RUNTIME",
      grammarId: "G7",
      realityDomainId: "P2",
      evidenceRefs: [
        "EU-INDUSTRY-2026-001",
        "EU-INFRASTRUCTURE-2026-001",
        "EU-TECHNOLOGY-2026-001"
      ]
    },
    {
      candidateId: "EU-RP-18-EU-W8F-SEM-ENERGY-IMPORT-COST-CONSTRAINT",
      runtimePositionId: "RP-18",
      scope: "SUBSYSTEM",
      subsystem: "ENERGY_IMPORT_COST_RUNTIME",
      grammarId: "G2",
      realityDomainId: "P2",
      evidenceRefs: [
        "EU-EXTERNAL-DEPENDENCY-2026-001",
        "EU-PRESSURE-FIELD-2026-001"
      ]
    }
  ],
  preservedReferenceOnly: [
    {
      semanticBasisId: "EU-W8E-SEM-ENERGY-SUPPLY-RECONFIGURATION",
      state: "REFERENCE_ONLY",
      reason: "Current evidence shows changing energy-import composition but does not yet establish a direct P3 continuity/reconfiguration mechanism across the EU energy system."
    },
    {
      claimId: "EU-ENERGY-RECONFIGURATION-2026-001",
      state: "REFERENCE_ONLY",
      reason: "Supply-composition change is retained as context, not position admission."
    }
  ],
  preservedUnknowns: [
    "The persistence of current 2026 industrial and producer-price conditions is not established.",
    "TEN-T work plans identify progress and bottlenecks but do not establish uniform network completion.",
    "Digital infrastructure maturity differs materially between basic 5G coverage and fibre/computing/semiconductor capacity.",
    "No single whole-dossier EU runtime position is established."
  ],
  preservedConflicts: [
    "Mature institutional carriers coexist with weak industrial momentum, infrastructure bottlenecks, uneven digital depth and energy-cost vulnerability."
  ],
  projectionBoundary: {
    subsystemPositionsDoNotImplySingleWholeDossierPosition: true,
    cnPositionReuse: false,
    seaPositionReuse: false,
    inPositionReuse: false,
    usPositionReuse: false,
    prediction: false,
    historicalPositionShortcut: false,
    memberStateHeterogeneityPreserved: true,
    eurosystemScopePreserved: true,
    energySupplyReconfigurationNotAdmitted: true
  },
  providerCalls: 0
};

// content/civilization-atlas/reconfiguration/dossier-eu-w8h-human-decisions-v1.json
var dossier_eu_w8h_human_decisions_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-EU-W8H-HUMAN-DECISIONS-v1.0.0",
  status: "HUMAN_DECISIONS_RECORDED",
  dossierId: "DOSSIER-EU",
  stage: "W8-H",
  decidedAt: "2026-10-08",
  decisionAuthority: "OWNER_HUMAN_REVIEW",
  sourceHumanDecision: "Human ACCEPT W8-H",
  records: [
    {
      candidateId: "EU-RP-22-EU-W8F-SEM-FINANCIAL-SETTLEMENT-CARRIER",
      decision: "ACCEPT",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "FINANCIAL_SETTLEMENT_CARRIER",
      boundary: "Accepted only for the EU financial-settlement carrier subsystem; it does not imply uniform participation across all EU member-state activity or one whole-EU runtime position."
    },
    {
      candidateId: "EU-RP-23-EU-W8F-SEM-INDUSTRIAL-SYSTEM-RUNTIME",
      decision: "ACCEPT",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "INDUSTRIAL_SYSTEM_RUNTIME",
      boundary: "Accepted only for the EU industrial-system runtime subsystem; it does not establish industrial expansion, uniform Member-State performance, or completed infrastructure integration."
    },
    {
      candidateId: "EU-RP-18-EU-W8F-SEM-ENERGY-IMPORT-COST-CONSTRAINT",
      decision: "ACCEPT",
      runtimePositionId: "RP-18",
      scope: "SUBSYSTEM",
      subsystem: "ENERGY_IMPORT_COST_RUNTIME",
      boundary: "Accepted only for the EU energy-import/cost constraint subsystem; it does not imply collapse, permanent high inflation, or uniform vulnerability across Member States."
    }
  ],
  boundary: "Only explicitly accepted EU W8-G candidates may advance into W8-I. Matching CN, SEA, IN or US runtime-position numbers do not constitute reused decision authority."
};

// content/civilization-atlas/reconfiguration/dossier-eu-w8d-rre-readout-v1.json
var dossier_eu_w8d_rre_readout_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-EU-W8D-RRE-READOUT-v1.0.0",
  status: "RRE_REQUIRED_LANES_CONSUMED",
  dossierId: "DOSSIER-EU",
  stage: "W8-D",
  readoutReference: {
    code: "RRE-READOUT-B6-EU-2026-1-CONTRACT",
    version: "2026.1-contract",
    digest: "6fe8d9d2b675f8b1548b1a0b43f8ce80f8fa41af1d968425de6fb0d6ee2040c2"
  },
  readout: "MATURE_SETTLEMENT_AND_INDUSTRIAL_RUNTIME_UNDER_ENERGY_IMPORT_AND_COST_PRESSURE",
  summary: "Current admitted evidence supports a mature European institutional and settlement carrier operating alongside a low-growth but active industrial runtime and an incompletely upgraded transport/digital infrastructure base. The EU remains materially dependent on imported energy, while 2026 energy-linked producer-price increases impose active cost pressure. Demographic ageing and migration-supported population growth remain structural context rather than a single runtime position.",
  evidenceRefs: [
    "EU-DEMOGRAPHY-2026-001",
    "EU-INDUSTRY-2026-001",
    "EU-INFRASTRUCTURE-2026-001",
    "EU-TECHNOLOGY-2026-001",
    "EU-EXTERNAL-DEPENDENCY-2026-001",
    "EU-CARRIER-STRUCTURE-2026-001",
    "EU-PRESSURE-FIELD-2026-001"
  ],
  supportLanes: [
    "CARRIER_STRUCTURE",
    "DEMOGRAPHY",
    "EXTERNAL_DEPENDENCY",
    "INDUSTRY",
    "INFRASTRUCTURE",
    "PRESSURE_FIELD",
    "TECHNOLOGY"
  ],
  conflicts: [
    "Mature institutional carriers coexist with weak industrial momentum, infrastructure bottlenecks, uneven digital depth and energy-cost vulnerability."
  ],
  unknowns: [
    "The persistence of current 2026 industrial and producer-price conditions is not established.",
    "TEN-T work plans identify progress and bottlenecks but do not establish uniform network completion.",
    "Digital infrastructure maturity differs materially between basic 5G coverage and fibre/computing/semiconductor capacity.",
    "No single whole-dossier EU runtime position is established."
  ],
  freshness: {
    asOfDate: "2026-10-08",
    state: "CURRENT_WITH_SOURCE_SPECIFIC_FRESHNESS"
  },
  scopeBoundary: "European Union multi-state-system readout. Member-state heterogeneity and Eurosystem-specific institutional scope are preserved.",
  boundaries: {
    rpCandidateCreated: false,
    grammarAssigned: false,
    realityDomainAssigned: false,
    wholeDossierPositionImplied: false
  }
};

// content/civilization-atlas/reconfiguration/dossier-in-w8i-accepted-current-dossier-v1.json
var dossier_in_w8i_accepted_current_dossier_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-IN-W8I-ACCEPTED-CURRENT-DOSSIER-v1.0.0",
  status: "ACCEPTED_CURRENT_DOSSIER",
  dossierId: "DOSSIER-IN",
  stage: "W8-I",
  acceptedAt: "2026-10-08",
  humanDecisionReference: "content/civilization-atlas/reconfiguration/dossier-in-w8h-human-decisions-v1.json",
  readoutReference: {
    code: "RRE-READOUT-B6-IN-2026-1-CONTRACT",
    version: "2026.1-contract",
    digest: "c8ca419d414b51ca8aaf08491566e0fd5212db790690989243a1c5d74df848f8"
  },
  admittedPositions: [
    {
      candidateId: "IN-RP-22-IN-W8F-SEM-DIGITAL-PUBLIC-INFRASTRUCTURE-CARRIER",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "DIGITAL_PUBLIC_INFRASTRUCTURE_CARRIER",
      grammarId: "G6",
      realityDomainId: "P2",
      evidenceRefs: [
        "IN-TECHNOLOGY-2026-001",
        "IN-CARRIER-STRUCTURE-2026-001"
      ]
    },
    {
      candidateId: "IN-RP-23-IN-W8F-SEM-INDUSTRIAL-LOGISTICS-RUNTIME",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "INDUSTRIAL_LOGISTICS_RUNTIME",
      grammarId: "G7",
      realityDomainId: "P2",
      evidenceRefs: [
        "IN-INDUSTRY-2026-001",
        "IN-INFRASTRUCTURE-2026-001"
      ]
    },
    {
      candidateId: "IN-RP-18-IN-W8F-SEM-ENERGY-IMPORT-COST-CONSTRAINT",
      runtimePositionId: "RP-18",
      scope: "SUBSYSTEM",
      subsystem: "ENERGY_IMPORT_COST_RUNTIME",
      grammarId: "G2",
      realityDomainId: "P2",
      evidenceRefs: [
        "IN-EXTERNAL-DEPENDENCY-2026-001",
        "IN-PRESSURE-FIELD-2026-001"
      ]
    }
  ],
  preservedReferenceOnly: [
    {
      semanticBasisId: "IN-W8E-SEM-DEMOGRAPHIC-CONTINUITY",
      state: "REFERENCE_ONLY",
      reason: "Projection-based demographic evidence does not by itself establish the direct continuity mechanism required for RP admission."
    },
    {
      claimId: "IN-EXTERNAL-CONTEXT-2025-001",
      state: "REFERENCE_ONLY",
      reason: "Older crude-import dependency percentages remain corroborating context; fresher 2026 authority is primary."
    }
  ],
  preservedUnknowns: [
    "The duration of August 2026 industrial growth is not established beyond the observed sequence.",
    "Current evidence does not establish uniform infrastructure or digital-service quality across all states and populations.",
    "The long-run effect of energy import reduction programmes is not yet observed.",
    "No single whole-dossier India runtime position is established."
  ],
  preservedConflicts: [
    "Industrial and infrastructure expansion coexist with energy-input exposure, price pressure, uneven access and heterogeneous state-level conditions."
  ],
  projectionBoundary: {
    subsystemPositionsDoNotImplySingleWholeDossierPosition: true,
    cnPositionReuse: false,
    seaPositionReuse: false,
    usPositionReuse: false,
    prediction: false,
    historicalPositionShortcut: false,
    stateLevelHeterogeneityPreserved: true,
    demographicContinuityNotAdmitted: true
  },
  providerCalls: 0
};

// content/civilization-atlas/reconfiguration/dossier-in-w8h-human-decisions-v1.json
var dossier_in_w8h_human_decisions_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-IN-W8H-HUMAN-DECISIONS-v1.0.0",
  status: "HUMAN_DECISIONS_RECORDED",
  dossierId: "DOSSIER-IN",
  stage: "W8-H",
  decidedAt: "2026-10-08",
  decisionAuthority: "OWNER_HUMAN_REVIEW",
  sourceHumanDecision: "Human ACCEPT W8-H",
  records: [
    {
      candidateId: "IN-RP-22-IN-W8F-SEM-DIGITAL-PUBLIC-INFRASTRUCTURE-CARRIER",
      decision: "ACCEPT",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "DIGITAL_PUBLIC_INFRASTRUCTURE_CARRIER",
      boundary: "Accepted only for India's digital public infrastructure carrier subsystem; it does not establish universal equal access, uniform service quality, or a single whole-India runtime position."
    },
    {
      candidateId: "IN-RP-23-IN-W8F-SEM-INDUSTRIAL-LOGISTICS-RUNTIME",
      decision: "ACCEPT",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "INDUSTRIAL_LOGISTICS_RUNTIME",
      boundary: "Accepted only for India's industrial/logistics runtime subsystem; it does not establish uniform sector/state growth, permanent growth rates, or one whole-India position."
    },
    {
      candidateId: "IN-RP-18-IN-W8F-SEM-ENERGY-IMPORT-COST-CONSTRAINT",
      decision: "ACCEPT",
      runtimePositionId: "RP-18",
      scope: "SUBSYSTEM",
      subsystem: "ENERGY_IMPORT_COST_RUNTIME",
      boundary: "Accepted only for India's energy-import/cost constraint subsystem; it does not imply collapse, permanent inflation, or uniform exposure across sectors."
    }
  ],
  boundary: "Only explicitly accepted India W8-G candidates may advance into W8-I. Matching CN, SEA or US runtime-position numbers do not constitute reused decision authority."
};

// content/civilization-atlas/reconfiguration/dossier-in-w8d-rre-readout-v1.json
var dossier_in_w8d_rre_readout_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-IN-W8D-RRE-READOUT-v1.0.0",
  status: "RRE_REQUIRED_LANES_CONSUMED",
  dossierId: "DOSSIER-IN",
  stage: "W8-D",
  readoutReference: {
    code: "RRE-READOUT-B6-IN-2026-1-CONTRACT",
    version: "2026.1-contract",
    digest: "c8ca419d414b51ca8aaf08491566e0fd5212db790690989243a1c5d74df848f8"
  },
  readout: "INDUSTRIAL_LOGISTICS_AND_DIGITAL_RUNTIME_UNDER_ENERGY_IMPORT_AND_COST_PRESSURE",
  summary: "Current admitted evidence supports an operating Indian industrial and logistics runtime with large-scale physical and digital carrier systems. Manufacturing output, rail-linked cargo infrastructure and UPI/BharatNet demonstrate active functioning rather than merely planned formation. At the same time, crude-oil import exposure and elevated fuel-and-power prices impose a direct external-input constraint. Demographic scale remains a source of capacity but is itself transitioning toward lower fertility and gradual ageing.",
  evidenceRefs: [
    "IN-DEMOGRAPHY-2026-001",
    "IN-INDUSTRY-2026-001",
    "IN-INFRASTRUCTURE-2026-001",
    "IN-TECHNOLOGY-2026-001",
    "IN-EXTERNAL-DEPENDENCY-2026-001",
    "IN-CARRIER-STRUCTURE-2026-001",
    "IN-PRESSURE-FIELD-2026-001"
  ],
  supportLanes: [
    "CARRIER_STRUCTURE",
    "DEMOGRAPHY",
    "EXTERNAL_DEPENDENCY",
    "INDUSTRY",
    "INFRASTRUCTURE",
    "PRESSURE_FIELD",
    "TECHNOLOGY"
  ],
  conflicts: [
    "Industrial and infrastructure expansion coexist with energy-input exposure, price pressure, uneven access and heterogeneous state-level conditions."
  ],
  unknowns: [
    "The duration of August 2026 industrial growth is not established beyond the observed sequence.",
    "Current evidence does not establish uniform infrastructure or digital-service quality across all states and populations.",
    "The long-run effect of energy import reduction programmes is not yet observed.",
    "No single whole-dossier India runtime position is established."
  ],
  freshness: {
    asOfDate: "2026-10-08",
    state: "CURRENT_WITH_SOURCE_SPECIFIC_FRESHNESS"
  },
  scopeBoundary: "National India readout. State-level heterogeneity and sectoral variation are preserved.",
  boundaries: {
    rpCandidateCreated: false,
    grammarAssigned: false,
    realityDomainAssigned: false,
    wholeDossierPositionImplied: false
  }
};

// content/civilization-atlas/reconfiguration/dossier-jp-w8i-accepted-current-dossier-v1.json
var dossier_jp_w8i_accepted_current_dossier_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-JP-W8I-ACCEPTED-CURRENT-DOSSIER-v1.0.0",
  status: "ACCEPTED_CURRENT_DOSSIER",
  dossierId: "DOSSIER-JP",
  stage: "W8-I",
  acceptedAt: "2026-10-08",
  humanDecisionReference: "content/civilization-atlas/reconfiguration/dossier-jp-w8h-human-decisions-v1.json",
  readoutReference: {
    code: "RRE-READOUT-B6-JP-2026-1-CONTRACT",
    version: "2026.1-contract",
    digest: "49d9af5f5299315450262148980236301041f614b7000cfcc6a47ad873d8aca6"
  },
  admittedPositions: [
    {
      candidateId: "JP-RP-22-JP-W8F-SEM-PAYMENT-SETTLEMENT-CARRIER",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "PAYMENT_SETTLEMENT_CARRIER",
      grammarId: "G6",
      realityDomainId: "P2",
      evidenceRefs: [
        "JP-CARRIER-STRUCTURE-2026-001"
      ]
    },
    {
      candidateId: "JP-RP-23-JP-W8F-SEM-INDUSTRIAL-INFRASTRUCTURE-RUNTIME",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "INDUSTRIAL_INFRASTRUCTURE_RUNTIME",
      grammarId: "G7",
      realityDomainId: "P2",
      evidenceRefs: [
        "JP-INDUSTRY-2026-001",
        "JP-INFRASTRUCTURE-2026-001",
        "JP-TECHNOLOGY-2026-001"
      ]
    },
    {
      candidateId: "JP-RP-18-JP-W8F-SEM-ENERGY-IMPORT-DEPENDENCY-CONSTRAINT",
      runtimePositionId: "RP-18",
      scope: "SUBSYSTEM",
      subsystem: "ENERGY_IMPORT_DEPENDENCY_RUNTIME",
      grammarId: "G2",
      realityDomainId: "P2",
      evidenceRefs: [
        "JP-EXTERNAL-DEPENDENCY-2026-001",
        "JP-PRESSURE-FIELD-2026-001"
      ]
    }
  ],
  preservedReferenceOnly: [
    {
      semanticBasisId: "JP-W8E-SEM-DEMOGRAPHIC-ADAPTATION-CONTINUITY",
      state: "REFERENCE_ONLY",
      reason: "Ageing and selected automation responses are observed but do not yet establish a complete cross-system P3 continuity mechanism."
    }
  ],
  preservedUnknowns: [
    "Industrial improvement persistence is not established.",
    "Automation implementation is not uniform nationwide.",
    "A complete cross-system demographic-continuity mechanism is not established.",
    "No single whole-dossier Japan runtime position is established."
  ],
  preservedConflicts: [
    "Mature carriers coexist with ageing, labour shortages, energy vulnerability and uneven modernization depth."
  ],
  projectionBoundary: {
    subsystemPositionsDoNotImplySingleWholeDossierPosition: true,
    cnPositionReuse: false,
    seaPositionReuse: false,
    inPositionReuse: false,
    euPositionReuse: false,
    usPositionReuse: false,
    prediction: false,
    historicalPositionShortcut: false,
    regionalAndSectorHeterogeneityPreserved: true,
    demographicAdaptationContinuityNotAdmitted: true
  },
  providerCalls: 0
};

// content/civilization-atlas/reconfiguration/dossier-jp-w8h-human-decisions-v1.json
var dossier_jp_w8h_human_decisions_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-JP-W8H-HUMAN-DECISIONS-v1.0.0",
  status: "HUMAN_DECISIONS_RECORDED",
  dossierId: "DOSSIER-JP",
  stage: "W8-H",
  decidedAt: "2026-10-08",
  decisionAuthority: "OWNER_HUMAN_REVIEW",
  sourceHumanDecision: "Human ACCEPT W8-H",
  records: [
    {
      candidateId: "JP-RP-22-JP-W8F-SEM-PAYMENT-SETTLEMENT-CARRIER",
      decision: "ACCEPT",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "PAYMENT_SETTLEMENT_CARRIER",
      boundary: "Accepted only for Japan's payment-settlement carrier subsystem; it does not establish one whole-Japan position or exhaust all financial-market infrastructure."
    },
    {
      candidateId: "JP-RP-23-JP-W8F-SEM-INDUSTRIAL-INFRASTRUCTURE-RUNTIME",
      decision: "ACCEPT",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "INDUSTRIAL_INFRASTRUCTURE_RUNTIME",
      boundary: "Accepted only for Japan's industrial/infrastructure runtime subsystem; it does not establish industrial expansion, uniform modernization, or one whole-Japan position."
    },
    {
      candidateId: "JP-RP-18-JP-W8F-SEM-ENERGY-IMPORT-DEPENDENCY-CONSTRAINT",
      decision: "ACCEPT",
      runtimePositionId: "RP-18",
      scope: "SUBSYSTEM",
      subsystem: "ENERGY_IMPORT_DEPENDENCY_RUNTIME",
      boundary: "Accepted only for Japan's energy-import dependency constraint subsystem; it does not imply a current energy crisis, collapse, or permanent high inflation."
    }
  ],
  boundary: "Only explicitly accepted Japan W8-G candidates may advance into W8-I. Matching CN, SEA, IN, EU or US runtime-position numbers do not constitute reused decision authority."
};

// content/civilization-atlas/reconfiguration/dossier-jp-w8d-rre-readout-v1.json
var dossier_jp_w8d_rre_readout_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-JP-W8D-RRE-READOUT-v1.0.0",
  status: "RRE_REQUIRED_LANES_CONSUMED",
  dossierId: "DOSSIER-JP",
  stage: "W8-D",
  readoutReference: {
    code: "RRE-READOUT-B6-JP-2026-1-CONTRACT",
    version: "2026.1-contract",
    digest: "49d9af5f5299315450262148980236301041f614b7000cfcc6a47ad873d8aca6"
  },
  readout: "MATURE_PAYMENT_AND_INDUSTRIAL_RUNTIME_UNDER_ENERGY_IMPORT_AND_DEMOGRAPHIC_ADAPTATION_PRESSURE",
  summary: "Current admitted evidence supports a mature Japanese payment-settlement carrier and an active but non-expansionary industrial runtime. BOJ-NET and Zengin remain functioning at large scale, industrial production continues but METI characterizes the trend as back-and-forth rather than sustained growth, and port/infrastructure systems are actively introducing automation and AI. Structural energy-import dependence and record population ageing impose continuing adaptation pressure, while these pressures do not establish a single whole-Japan position.",
  evidenceRefs: [
    "JP-DEMOGRAPHY-2026-001",
    "JP-INDUSTRY-2026-001",
    "JP-INFRASTRUCTURE-2026-001",
    "JP-TECHNOLOGY-2026-001",
    "JP-EXTERNAL-DEPENDENCY-2026-001",
    "JP-CARRIER-STRUCTURE-2026-001",
    "JP-PRESSURE-FIELD-2026-001"
  ],
  unknowns: [
    "Industrial improvement persistence is not established.",
    "Automation implementation is not uniform nationwide.",
    "A complete cross-system demographic-continuity mechanism is not established.",
    "No single whole-dossier Japan runtime position is established."
  ],
  conflicts: [
    "Mature carriers coexist with ageing, labour shortages, energy vulnerability and uneven modernization depth."
  ],
  boundaries: {
    rpCandidateCreated: false,
    wholeDossierPositionImplied: false
  }
};

// content/civilization-atlas/reconfiguration/dossier-kr-w8i-accepted-current-dossier-v1.json
var dossier_kr_w8i_accepted_current_dossier_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-KR-W8I-ACCEPTED-CURRENT-DOSSIER-v1.0.0",
  status: "ACCEPTED_CURRENT_DOSSIER",
  dossierId: "DOSSIER-KR",
  stage: "W8-I",
  acceptedAt: "2026-10-08",
  humanDecisionReference: "content/civilization-atlas/reconfiguration/dossier-kr-w8h-human-decisions-v1.json",
  readoutReference: {
    code: "RRE-READOUT-B6-KR-2026-1-CONTRACT",
    version: "2026.1-contract",
    digest: "a0b6ef2eb56d53ca2f5fc1d48c1b8d83c72edc984ce447f45ba16ea14dbb13ea"
  },
  admittedPositions: [
    {
      candidateId: "KR-RP-22-KR-W8F-SEM-DIGITAL-PAYMENT-SETTLEMENT-CARRIER",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "DIGITAL_PAYMENT_SETTLEMENT_CARRIER",
      grammarId: "G6",
      realityDomainId: "P2",
      evidenceRefs: [
        "KR-TECHNOLOGY-2026-001",
        "KR-CARRIER-STRUCTURE-2026-001"
      ]
    },
    {
      candidateId: "KR-RP-23-KR-W8F-SEM-SEMICONDUCTOR-INDUSTRIAL-RUNTIME",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "SEMICONDUCTOR_INDUSTRIAL_RUNTIME",
      grammarId: "G7",
      realityDomainId: "P2",
      evidenceRefs: [
        "KR-INDUSTRY-2026-001",
        "KR-INFRASTRUCTURE-2026-001"
      ]
    },
    {
      candidateId: "KR-RP-18-KR-W8F-SEM-ENERGY-IMPORT-GEOPOLITICAL-CONSTRAINT",
      runtimePositionId: "RP-18",
      scope: "SUBSYSTEM",
      subsystem: "ENERGY_IMPORT_GEOPOLITICAL_RUNTIME",
      grammarId: "G2",
      realityDomainId: "P2",
      evidenceRefs: [
        "KR-EXTERNAL-DEPENDENCY-2026-001",
        "KR-PRESSURE-FIELD-2026-001"
      ]
    }
  ],
  preservedReferenceOnly: [
    {
      semanticBasisId: "KR-W8E-SEM-DEMOGRAPHIC-ADAPTATION-CONTINUITY",
      state: "REFERENCE_ONLY"
    }
  ],
  projectionBoundary: {
    subsystemPositionsDoNotImplySingleWholeDossierPosition: true,
    priorDossierPositionReuse: false,
    prediction: false,
    historicalPositionShortcut: false,
    demographicAdaptationContinuityNotAdmitted: true
  },
  providerCalls: 0
};

// content/civilization-atlas/reconfiguration/dossier-kr-w8h-human-decisions-v1.json
var dossier_kr_w8h_human_decisions_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-KR-W8H-HUMAN-DECISIONS-v1.0.0",
  status: "HUMAN_DECISIONS_RECORDED",
  dossierId: "DOSSIER-KR",
  stage: "W8-H",
  decidedAt: "2026-10-08",
  decisionAuthority: "OWNER_HUMAN_REVIEW",
  sourceHumanDecision: "Human ACCEPT W8-H",
  records: [
    {
      candidateId: "KR-RP-22-KR-W8F-SEM-DIGITAL-PAYMENT-SETTLEMENT-CARRIER",
      decision: "ACCEPT",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "DIGITAL_PAYMENT_SETTLEMENT_CARRIER",
      boundary: "Accepted only for Korea's digital payment-settlement carrier subsystem; it does not establish one whole-Korea position."
    },
    {
      candidateId: "KR-RP-23-KR-W8F-SEM-SEMICONDUCTOR-INDUSTRIAL-RUNTIME",
      decision: "ACCEPT",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "SEMICONDUCTOR_INDUSTRIAL_RUNTIME",
      boundary: "Accepted only for Korea's semiconductor-led industrial runtime; it does not imply uniform industrial strength or permanence of the current cycle."
    },
    {
      candidateId: "KR-RP-18-KR-W8F-SEM-ENERGY-IMPORT-GEOPOLITICAL-CONSTRAINT",
      decision: "ACCEPT",
      runtimePositionId: "RP-18",
      scope: "SUBSYSTEM",
      subsystem: "ENERGY_IMPORT_GEOPOLITICAL_RUNTIME",
      boundary: "Accepted only for Korea's energy-import/geopolitical constraint subsystem; it does not imply collapse or permanent high inflation."
    }
  ],
  boundary: "Only explicitly accepted KR W8-G candidates may advance into W8-I; prior dossiers are not decision authority."
};

// content/civilization-atlas/reconfiguration/dossier-kr-w8d-rre-readout-v1.json
var dossier_kr_w8d_rre_readout_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-KR-W8D-RRE-READOUT-v1.0.0",
  status: "RRE_REQUIRED_LANES_CONSUMED",
  dossierId: "DOSSIER-KR",
  stage: "W8-D",
  readoutReference: {
    code: "RRE-READOUT-B6-KR-2026-1-CONTRACT",
    version: "2026.1-contract",
    digest: "a0b6ef2eb56d53ca2f5fc1d48c1b8d83c72edc984ce447f45ba16ea14dbb13ea"
  },
  readout: "SEMICONDUCTOR_LED_INDUSTRIAL_AND_DIGITAL_PAYMENT_RUNTIME_UNDER_ENERGY_IMPORT_AND_GEOPOLITICAL_COST_PRESSURE",
  summary: "Current admitted evidence supports a semiconductor-led Korean industrial runtime alongside a mature and actively modernizing payment-settlement carrier. Automated freight and AI-enabled logistics are entering operational deployment. Korea's very high energy-import dependence and current Middle East/cost-shock exposure impose a direct external constraint, while super-aged demographics add adaptation pressure without by themselves establishing a single continuity position.",
  evidenceRefs: [
    "KR-DEMOGRAPHY-2026-001",
    "KR-INDUSTRY-2026-001",
    "KR-INFRASTRUCTURE-2026-001",
    "KR-TECHNOLOGY-2026-001",
    "KR-EXTERNAL-DEPENDENCY-2026-001",
    "KR-CARRIER-STRUCTURE-2026-001",
    "KR-PRESSURE-FIELD-2026-001"
  ],
  unknowns: [
    "The durability of the semiconductor boom is not established beyond the current cycle.",
    "Automated freight implementation remains limited relative to the full national logistics system.",
    "A complete demographic adaptation continuity mechanism is not established.",
    "No single whole-dossier Korea runtime position is established."
  ],
  conflicts: [
    "Strong semiconductor-led growth coexists with high external energy dependence, geopolitical uncertainty and demographic pressure."
  ],
  boundaries: {
    rpCandidateCreated: false,
    wholeDossierPositionImplied: false
  }
};

// content/civilization-atlas/reconfiguration/dossier-latam-w8i-accepted-current-dossier-v1.json
var dossier_latam_w8i_accepted_current_dossier_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-LATAM-W8I-ACCEPTED-CURRENT-DOSSIER-v1.0.0",
  status: "ACCEPTED_CURRENT_DOSSIER",
  dossierId: "DOSSIER-LATAM",
  stage: "W8-I",
  acceptedAt: "2026-10-08",
  humanDecisionReference: "content/civilization-atlas/reconfiguration/dossier-latam-w8h-human-decisions-v1.json",
  readoutReference: {
    code: "RRE-READOUT-B6-LATAM-2026-1-CONTRACT",
    version: "2026.1-contract",
    digest: "latam2026b6f7f4b87f6e9d4497b1fb55916c4a4e62937d72742dfb9cfced3f2d1"
  },
  admittedPositions: [
    {
      candidateId: "LATAM-RP-22-LATAM-W8F-SEM-DIGITAL-NETWORK-CARRIER",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "DIGITAL_NETWORK_CARRIER",
      grammarId: "G6",
      realityDomainId: "P2",
      evidenceRefs: [
        "LATAM-TECHNOLOGY-2026-001",
        "LATAM-CARRIER-STRUCTURE-2026-001"
      ]
    },
    {
      candidateId: "LATAM-RP-23-LATAM-W8F-SEM-PRODUCTIVE-ECONOMIC-RUNTIME",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "PRODUCTIVE_ECONOMIC_RUNTIME",
      grammarId: "G7",
      realityDomainId: "P2",
      evidenceRefs: [
        "LATAM-INDUSTRY-2026-001",
        "LATAM-INFRASTRUCTURE-2026-001"
      ]
    },
    {
      candidateId: "LATAM-RP-18-LATAM-W8F-SEM-FISCAL-FINANCING-EXTERNAL-PRICE-CONSTRAINT",
      runtimePositionId: "RP-18",
      scope: "SUBSYSTEM",
      subsystem: "FISCAL_FINANCING_EXTERNAL_PRICE_RUNTIME",
      grammarId: "G2",
      realityDomainId: "P2",
      evidenceRefs: [
        "LATAM-EXTERNAL-DEPENDENCY-2026-001",
        "LATAM-PRESSURE-FIELD-2026-001"
      ]
    }
  ],
  preservedReferenceOnly: [
    {
      semanticBasisId: "LATAM-W8E-SEM-DEMOGRAPHIC-ADAPTATION-CONTINUITY",
      state: "REFERENCE_ONLY"
    }
  ],
  projectionBoundary: {
    subsystemPositionsDoNotImplySingleWholeDossierPosition: true,
    priorDossierPositionReuse: false,
    prediction: false,
    historicalPositionShortcut: false,
    demographicAdaptationContinuityNotAdmitted: true
  },
  providerCalls: 0
};

// content/civilization-atlas/reconfiguration/dossier-latam-w8h-human-decisions-v1.json
var dossier_latam_w8h_human_decisions_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-LATAM-W8H-HUMAN-DECISIONS-v1.0.0",
  status: "HUMAN_DECISIONS_RECORDED",
  dossierId: "DOSSIER-LATAM",
  stage: "W8-H",
  decidedAt: "2026-10-08",
  decisionAuthority: "OWNER_HUMAN_REVIEW",
  sourceHumanDecision: "Human ACCEPT W8-H",
  records: [
    {
      candidateId: "LATAM-RP-22-LATAM-W8F-SEM-DIGITAL-NETWORK-CARRIER",
      decision: "ACCEPT",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "DIGITAL_NETWORK_CARRIER",
      boundary: "Accepted only for the named LATAM subsystem; it does not establish one whole-dossier LATAM position."
    },
    {
      candidateId: "LATAM-RP-23-LATAM-W8F-SEM-PRODUCTIVE-ECONOMIC-RUNTIME",
      decision: "ACCEPT",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "PRODUCTIVE_ECONOMIC_RUNTIME",
      boundary: "Accepted only for the named LATAM subsystem; it does not establish one whole-dossier LATAM position."
    },
    {
      candidateId: "LATAM-RP-18-LATAM-W8F-SEM-FISCAL-FINANCING-EXTERNAL-PRICE-CONSTRAINT",
      decision: "ACCEPT",
      runtimePositionId: "RP-18",
      scope: "SUBSYSTEM",
      subsystem: "FISCAL_FINANCING_EXTERNAL_PRICE_RUNTIME",
      boundary: "Accepted only for the named LATAM subsystem; it does not establish one whole-dossier LATAM position."
    }
  ],
  boundary: "Only explicitly accepted LATAM W8-G candidates may advance into W8-I. Prior dossier positions are not decision authority."
};

// content/civilization-atlas/reconfiguration/dossier-latam-w8d-rre-readout-v1.json
var dossier_latam_w8d_rre_readout_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-LATAM-W8D-RRE-READOUT-v1.0.0",
  status: "RRE_REQUIRED_LANES_CONSUMED",
  dossierId: "DOSSIER-LATAM",
  stage: "W8-D",
  readoutReference: {
    code: "RRE-READOUT-B6-LATAM-2026-1-CONTRACT",
    version: "2026.1-contract",
    digest: "latam2026b6f7f4b87f6e9d4497b1fb55916c4a4e62937d72742dfb9cfced3f2d1"
  },
  readout: "MATURE_DIGITAL_AND_LOW_GROWTH_PRODUCTIVE_RUNTIME_UNDER_FISCAL_FINANCING_AND_EXTERNAL_PRICE_PRESSURE",
  summary: "Current evidence supports a large-scale Latin American digital carrier and a continuing but modest-growth productive runtime. Infrastructure gaps, high borrowing costs, constrained fiscal space and asymmetric exposure to external energy/commodity shocks limit investment and policy flexibility. Demographic ageing is structural context but does not establish one whole-region continuity position.",
  evidenceRefs: [
    "LATAM-DEMOGRAPHY-2026-001",
    "LATAM-INDUSTRY-2026-001",
    "LATAM-INFRASTRUCTURE-2026-001",
    "LATAM-TECHNOLOGY-2026-001",
    "LATAM-EXTERNAL-DEPENDENCY-2026-001",
    "LATAM-CARRIER-STRUCTURE-2026-001",
    "LATAM-PRESSURE-FIELD-2026-001"
  ],
  unknowns: [
    "Productive performance diverges widely by country.",
    "Infrastructure gap closure remains incomplete.",
    "No single whole-dossier Latin America position is established."
  ],
  conflicts: [
    "Strong digital scale and strategic resource endowments coexist with weak investment, modest growth and fiscal constraints."
  ],
  boundaries: {
    wholeDossierPositionImplied: false
  }
};

// content/civilization-atlas/reconfiguration/dossier-me-w8i-accepted-current-dossier-v1.json
var dossier_me_w8i_accepted_current_dossier_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-ME-W8I-ACCEPTED-CURRENT-DOSSIER-v1.0.0",
  status: "ACCEPTED_CURRENT_DOSSIER",
  dossierId: "DOSSIER-ME",
  stage: "W8-I",
  acceptedAt: "2026-10-08",
  humanDecisionReference: "content/civilization-atlas/reconfiguration/dossier-me-w8h-human-decisions-v1.json",
  readoutReference: {
    code: "RRE-READOUT-B6-ME-2026-1-CONTRACT",
    version: "2026.1-contract",
    digest: "me2026b6b9c6c11c2b384de54bf6e9f17a81f4f1ce7ca2d3ce49d19cb8d75e1"
  },
  admittedPositions: [
    {
      candidateId: "ME-RP-22-ME-W8F-SEM-CROSS-BORDER-PAYMENT-CARRIER",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "CROSS_BORDER_PAYMENT_CARRIER",
      grammarId: "G6",
      realityDomainId: "P2",
      evidenceRefs: [
        "ME-CARRIER-STRUCTURE-2026-001"
      ]
    },
    {
      candidateId: "ME-RP-23-ME-W8F-SEM-ENERGY-LOGISTICS-RUNTIME",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "ENERGY_LOGISTICS_RUNTIME",
      grammarId: "G7",
      realityDomainId: "P2",
      evidenceRefs: [
        "ME-INDUSTRY-2026-001",
        "ME-INFRASTRUCTURE-2026-001",
        "ME-EXTERNAL-DEPENDENCY-2026-001"
      ]
    },
    {
      candidateId: "ME-RP-18-ME-W8F-SEM-CHOKEPOINT-CONFLICT-CONSTRAINT",
      runtimePositionId: "RP-18",
      scope: "SUBSYSTEM",
      subsystem: "CHOKEPOINT_CONFLICT_RUNTIME",
      grammarId: "G2",
      realityDomainId: "P2",
      evidenceRefs: [
        "ME-EXTERNAL-DEPENDENCY-2026-001",
        "ME-PRESSURE-FIELD-2026-001"
      ]
    }
  ],
  preservedReferenceOnly: [
    {
      semanticBasisId: "ME-W8E-SEM-DIGITAL-AI-TRANSITION",
      state: "REFERENCE_ONLY"
    }
  ],
  projectionBoundary: {
    subsystemPositionsDoNotImplySingleWholeDossierPosition: true,
    priorDossierPositionReuse: false,
    prediction: false,
    historicalPositionShortcut: false,
    digitalAiTransitionNotAdmitted: true
  },
  providerCalls: 0
};

// content/civilization-atlas/reconfiguration/dossier-me-w8h-human-decisions-v1.json
var dossier_me_w8h_human_decisions_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-ME-W8H-HUMAN-DECISIONS-v1.0.0",
  status: "HUMAN_DECISIONS_RECORDED",
  dossierId: "DOSSIER-ME",
  stage: "W8-H",
  decidedAt: "2026-10-08",
  decisionAuthority: "OWNER_HUMAN_REVIEW",
  sourceHumanDecision: "Human ACCEPT W8-H",
  records: [
    {
      candidateId: "ME-RP-22-ME-W8F-SEM-CROSS-BORDER-PAYMENT-CARRIER",
      decision: "ACCEPT",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "CROSS_BORDER_PAYMENT_CARRIER",
      boundary: "Accepted only for the named ME subsystem; it does not establish one whole-dossier ME position."
    },
    {
      candidateId: "ME-RP-23-ME-W8F-SEM-ENERGY-LOGISTICS-RUNTIME",
      decision: "ACCEPT",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "ENERGY_LOGISTICS_RUNTIME",
      boundary: "Accepted only for the named ME subsystem; it does not establish one whole-dossier ME position."
    },
    {
      candidateId: "ME-RP-18-ME-W8F-SEM-CHOKEPOINT-CONFLICT-CONSTRAINT",
      decision: "ACCEPT",
      runtimePositionId: "RP-18",
      scope: "SUBSYSTEM",
      subsystem: "CHOKEPOINT_CONFLICT_RUNTIME",
      boundary: "Accepted only for the named ME subsystem; it does not establish one whole-dossier ME position."
    }
  ],
  boundary: "Only explicitly accepted ME W8-G candidates may advance into W8-I. Prior dossier positions are not decision authority."
};

// content/civilization-atlas/reconfiguration/dossier-me-w8d-rre-readout-v1.json
var dossier_me_w8d_rre_readout_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-ME-W8D-RRE-READOUT-v1.0.0",
  status: "RRE_REQUIRED_LANES_CONSUMED",
  dossierId: "DOSSIER-ME",
  stage: "W8-D",
  readoutReference: {
    code: "RRE-READOUT-B6-ME-2026-1-CONTRACT",
    version: "2026.1-contract",
    digest: "me2026b6b9c6c11c2b384de54bf6e9f17a81f4f1ce7ca2d3ce49d19cb8d75e1"
  },
  readout: "REGIONAL_ENERGY_LOGISTICS_AND_CROSS_BORDER_PAYMENT_RUNTIME_UNDER_CHOKEPOINT_AND_CONFLICT_PRESSURE",
  summary: "Current evidence supports functioning regional energy, logistics and cross-border payment carriers that continue to route flows under severe conflict and maritime-chokepoint pressure. Regional digital and AI capacity is expanding but highly uneven. No single whole-Middle-East position is established.",
  evidenceRefs: [
    "ME-DEMOGRAPHY-2026-001",
    "ME-INDUSTRY-2026-001",
    "ME-INFRASTRUCTURE-2026-001",
    "ME-TECHNOLOGY-2026-001",
    "ME-EXTERNAL-DEPENDENCY-2026-001",
    "ME-CARRIER-STRUCTURE-2026-001",
    "ME-PRESSURE-FIELD-2026-001"
  ],
  unknowns: [
    "Conflict duration and normalization path are unknown.",
    "Digital and AI maturity is highly heterogeneous.",
    "No single whole-dossier Middle East position is established."
  ],
  conflicts: [
    "Oil-export infrastructure resilience coexists with severe chokepoint exposure and deep cross-country divergence."
  ],
  boundaries: {
    wholeDossierPositionImplied: false
  }
};

// content/civilization-atlas/reconfiguration/dossier-ru-w8i-accepted-current-dossier-v1.json
var dossier_ru_w8i_accepted_current_dossier_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-RU-W8I-ACCEPTED-CURRENT-DOSSIER-v1.0.0",
  status: "ACCEPTED_CURRENT_DOSSIER",
  dossierId: "DOSSIER-RU",
  stage: "W8-I",
  acceptedAt: "2026-10-08",
  humanDecisionReference: "content/civilization-atlas/reconfiguration/dossier-ru-w8h-human-decisions-v1.json",
  readoutReference: {
    code: "RRE-READOUT-B6-RU-2026-1-CONTRACT",
    version: "2026.1-contract",
    digest: "e54f03481e51ab8b69bc6624aecaa4f94c114c0b6be838496d1f5d6e6c9c24ab"
  },
  admittedPositions: [
    {
      candidateId: "RU-RP-22-RU-W8F-SEM-DOMESTIC-PAYMENT-CARRIER",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "DOMESTIC_PAYMENT_CARRIER",
      grammarId: "G6",
      realityDomainId: "P2",
      evidenceRefs: [
        "RU-CARRIER-STRUCTURE-2026-001",
        "RU-TECHNOLOGY-2026-001"
      ]
    },
    {
      candidateId: "RU-RP-23-RU-W8F-SEM-INDUSTRIAL-EXTERNAL-TRADE-RUNTIME",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "INDUSTRIAL_EXTERNAL_TRADE_RUNTIME",
      grammarId: "G7",
      realityDomainId: "P2",
      evidenceRefs: [
        "RU-INDUSTRY-2026-001",
        "RU-EXTERNAL-DEPENDENCY-2026-001",
        "RU-INFRASTRUCTURE-2026-001"
      ]
    },
    {
      candidateId: "RU-RP-18-RU-W8F-SEM-INFLATION-FUEL-MONETARY-CONSTRAINT",
      runtimePositionId: "RP-18",
      scope: "SUBSYSTEM",
      subsystem: "INFLATION_FUEL_MONETARY_RUNTIME",
      grammarId: "G2",
      realityDomainId: "P2",
      evidenceRefs: [
        "RU-PRESSURE-FIELD-2026-001"
      ]
    }
  ],
  preservedReferenceOnly: [
    {
      semanticBasisId: "RU-W8E-SEM-EXTERNAL-ROUTING-RECONFIGURATION",
      state: "REFERENCE_ONLY",
      reason: "Directional rerouting and sanctions constraint are observed, but a complete P3 cross-time reconfiguration mechanism is not established."
    }
  ],
  projectionBoundary: {
    subsystemPositionsDoNotImplySingleWholeDossierPosition: true,
    priorDossierPositionReuse: false,
    prediction: false,
    historicalPositionShortcut: false,
    externalRoutingReconfigurationNotAdmitted: true
  },
  providerCalls: 0
};

// content/civilization-atlas/reconfiguration/dossier-ru-w8h-human-decisions-v1.json
var dossier_ru_w8h_human_decisions_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-RU-W8H-HUMAN-DECISIONS-v1.0.0",
  status: "HUMAN_DECISIONS_RECORDED",
  dossierId: "DOSSIER-RU",
  stage: "W8-H",
  decidedAt: "2026-10-08",
  decisionAuthority: "OWNER_HUMAN_REVIEW",
  sourceHumanDecision: "Human ACCEPT W8-H",
  records: [
    {
      candidateId: "RU-RP-22-RU-W8F-SEM-DOMESTIC-PAYMENT-CARRIER",
      decision: "ACCEPT",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "DOMESTIC_PAYMENT_CARRIER",
      boundary: "Accepted only for Russia's domestic payment carrier subsystem; it does not establish a single whole-Russia runtime position."
    },
    {
      candidateId: "RU-RP-23-RU-W8F-SEM-INDUSTRIAL-EXTERNAL-TRADE-RUNTIME",
      decision: "ACCEPT",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "INDUSTRIAL_EXTERNAL_TRADE_RUNTIME",
      boundary: "Accepted only for Russia's industrial/external-trade runtime subsystem; it does not establish industrial expansion or one whole-Russia position."
    },
    {
      candidateId: "RU-RP-18-RU-W8F-SEM-INFLATION-FUEL-MONETARY-CONSTRAINT",
      decision: "ACCEPT",
      runtimePositionId: "RP-18",
      scope: "SUBSYSTEM",
      subsystem: "INFLATION_FUEL_MONETARY_RUNTIME",
      boundary: "Accepted only for Russia's inflation/fuel/monetary constraint subsystem; it does not imply collapse, permanence, or whole-economy determinism."
    }
  ],
  boundary: "Only explicitly accepted RU W8-G candidates may advance into W8-I. Sanctions and prior dossier positions are not decision authority."
};

// content/civilization-atlas/reconfiguration/dossier-ru-w8d-rre-readout-v1.json
var dossier_ru_w8d_rre_readout_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-RU-W8D-RRE-READOUT-v1.0.0",
  status: "RRE_REQUIRED_LANES_CONSUMED",
  dossierId: "DOSSIER-RU",
  stage: "W8-D",
  readoutReference: {
    code: "RRE-READOUT-B6-RU-2026-1-CONTRACT",
    version: "2026.1-contract",
    digest: "e54f03481e51ab8b69bc6624aecaa4f94c114c0b6be838496d1f5d6e6c9c24ab"
  },
  readout: "DOMESTIC_PAYMENT_AND_LOW_GROWTH_INDUSTRIAL_EXTERNAL_TRADE_RUNTIME_UNDER_INFLATION_FUEL_AND_SANCTIONS_PRESSURE",
  summary: "Current admitted evidence supports a highly domesticized Russian payment carrier and an active but near-flat industrial runtime, alongside a still-material commodity-export external sector. The digital ruble has entered broad implementation, while fuel-market disruptions, elevated inflation and a 14% policy rate impose direct operating constraints. Sanctions and alternative transport corridors shape external reconfiguration context but do not by themselves establish one whole-Russia runtime position.",
  evidenceRefs: [
    "RU-DEMOGRAPHY-2026-001",
    "RU-INDUSTRY-2026-001",
    "RU-INFRASTRUCTURE-2026-001",
    "RU-TECHNOLOGY-2026-001",
    "RU-EXTERNAL-DEPENDENCY-2026-001",
    "RU-CARRIER-STRUCTURE-2026-001",
    "RU-PRESSURE-FIELD-2026-001"
  ],
  unknowns: [
    "Current official population headline remains anchored to the latest exposed national estimate rather than a newer 2026 census-level estimate.",
    "The durability of the 2026 export-value increase depends materially on commodity prices.",
    "Digital-ruble adoption depth after the September 2026 launch is not yet established.",
    "No single whole-dossier Russia runtime position is established."
  ],
  conflicts: [
    "Domestic payment-system continuity and export surplus coexist with flat industrial production, elevated inflation, fuel disruptions and sanctions-related external constraints."
  ],
  boundaries: {
    rpCandidateCreated: false,
    wholeDossierPositionImplied: false
  }
};

// content/civilization-atlas/reconfiguration/dossier-sea-w8i-accepted-current-dossier-v1.json
var dossier_sea_w8i_accepted_current_dossier_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-SEA-W8I-ACCEPTED-CURRENT-DOSSIER-v1.0.0",
  status: "ACCEPTED_CURRENT_DOSSIER",
  dossierId: "DOSSIER-SEA",
  stage: "W8-I",
  acceptedAt: "2026-10-08",
  humanDecisionReference: "content/civilization-atlas/reconfiguration/dossier-sea-w8h-human-decisions-v1.json",
  readoutReference: {
    code: "RRE-READOUT-B6-SEA-2026-1-CONTRACT",
    version: "2026.1-contract",
    digest: "61adf35a8205ca5ab493c9136466a9cdc0a457df6ed9fd55832875b127bdb88b"
  },
  admittedPositions: [
    {
      candidateId: "SEA-RP-22-SEA-W8F-SEM-SUPPLY-CHAIN-INVESTMENT-CARRIER",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "SUPPLY_CHAIN_INVESTMENT_CARRIER",
      grammarId: "G6",
      realityDomainId: "P2",
      evidenceRefs: [
        "SEA-INDUSTRY-2026-001",
        "SEA-CARRIER-STRUCTURE-2026-001"
      ]
    },
    {
      candidateId: "SEA-RP-23-SEA-W8F-SEM-REGIONAL-ECONOMIC-CONNECTIVITY-RUNTIME",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "REGIONAL_ECONOMIC_CONNECTIVITY_RUNTIME",
      grammarId: "G7",
      realityDomainId: "P2",
      evidenceRefs: [
        "SEA-INDUSTRY-2026-001",
        "SEA-INFRASTRUCTURE-2026-001",
        "SEA-CARRIER-STRUCTURE-2026-001",
        "SEA-EXTERNAL-DEPENDENCY-2026-001"
      ]
    },
    {
      candidateId: "SEA-RP-18-SEA-W8F-SEM-ENERGY-EXTERNAL-CONSTRAINT",
      runtimePositionId: "RP-18",
      scope: "SUBSYSTEM",
      subsystem: "ENERGY_EXTERNAL_DEPENDENCY_RUNTIME",
      grammarId: "G2",
      realityDomainId: "P2",
      evidenceRefs: [
        "SEA-EXTERNAL-DEPENDENCY-2026-001",
        "SEA-PRESSURE-FIELD-2026-001"
      ]
    }
  ],
  preservedReferenceOnly: [
    {
      semanticBasisId: "SEA-W8E-SEM-DIGITAL-INTEGRATION-CARRIER",
      state: "REFERENCE_ONLY",
      reason: "DEFA negotiation conclusion does not establish mature current region-wide digital carrier operation."
    }
  ],
  preservedUnknowns: [
    "DEFA implementation depth across all member states is not established by negotiation conclusion alone.",
    "ASEAN Power Grid completion and uniform operational integration are not established.",
    "No single whole-dossier runtime position is established."
  ],
  preservedConflicts: [
    "Regional expansion and integration coexist with substantial cross-country differences in structure, income, infrastructure and exposure."
  ],
  preservedScopeMismatch: [
    "SEA-PRESSURE-FIELD-ADB-2026-001"
  ],
  projectionBoundary: {
    subsystemPositionsDoNotImplySingleWholeDossierPosition: true,
    cnPositionReuse: false,
    usPositionReuse: false,
    prediction: false,
    historicalPositionShortcut: false,
    memberStateHeterogeneityPreserved: true
  },
  providerCalls: 0
};

// content/civilization-atlas/reconfiguration/dossier-sea-w8h-human-decisions-v1.json
var dossier_sea_w8h_human_decisions_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-SEA-W8H-HUMAN-DECISIONS-v1.0.0",
  status: "HUMAN_DECISIONS_RECORDED",
  dossierId: "DOSSIER-SEA",
  stage: "W8-H",
  decidedAt: "2026-10-08",
  decisionAuthority: "OWNER_HUMAN_REVIEW",
  sourceHumanDecision: "Human ACCEPT W8-H",
  records: [
    {
      candidateId: "SEA-RP-22-SEA-W8F-SEM-SUPPLY-CHAIN-INVESTMENT-CARRIER",
      decision: "ACCEPT",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "SUPPLY_CHAIN_INVESTMENT_CARRIER",
      boundary: "Accepted only for the named SEA supply-chain/investment carrier subsystem; it does not establish a single whole-SEA runtime position or uniform member-state structure."
    },
    {
      candidateId: "SEA-RP-23-SEA-W8F-SEM-REGIONAL-ECONOMIC-CONNECTIVITY-RUNTIME",
      decision: "ACCEPT",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "REGIONAL_ECONOMIC_CONNECTIVITY_RUNTIME",
      boundary: "Accepted only for the named SEA regional economic-connectivity runtime subsystem; it does not assert a fully integrated or homogeneous ASEAN economy."
    },
    {
      candidateId: "SEA-RP-18-SEA-W8F-SEM-ENERGY-EXTERNAL-CONSTRAINT",
      decision: "ACCEPT",
      runtimePositionId: "RP-18",
      scope: "SUBSYSTEM",
      subsystem: "ENERGY_EXTERNAL_DEPENDENCY_RUNTIME",
      boundary: "Accepted only for the named SEA energy/external-dependency runtime constraint subsystem; it does not imply collapse, inevitability, or uniform vulnerability across member states."
    }
  ],
  boundary: "Only explicitly accepted SEA W8-G candidates may advance into W8-I. Matching CN/US runtime-position numbers do not constitute reused decision authority."
};

// content/civilization-atlas/reconfiguration/dossier-sea-w8d-rre-readout-v1.json
var dossier_sea_w8d_rre_readout_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-SEA-W8D-RRE-READOUT-v1.0.0",
  status: "RRE_REQUIRED_LANES_CONSUMED",
  dossierId: "DOSSIER-SEA",
  stage: "W8-D",
  readoutReference: {
    code: "RRE-READOUT-B6-SEA-2026-1-CONTRACT",
    version: "2026.1-contract",
    digest: "61adf35a8205ca5ab493c9136466a9cdc0a457df6ed9fd55832875b127bdb88b"
  },
  readout: "REGIONAL_PRODUCTION_SUPPLY_CHAIN_AND_CONNECTIVITY_RUNTIME_UNDER_EXTERNAL_ENERGY_DEPENDENCY_PRESSURE",
  summary: "Current admitted evidence supports an operating Southeast Asian regional production, investment and supply-chain system with active connectivity-building mechanisms, while external fuel dependence and concentrated energy supply routes impose direct runtime pressure. Regional digital integration is institutionally advancing, but implementation maturity remains bounded and member-state heterogeneity must be preserved.",
  evidenceRefs: [
    "SEA-DEMOGRAPHY-2026-001",
    "SEA-INDUSTRY-2026-001",
    "SEA-INFRASTRUCTURE-2026-001",
    "SEA-TECHNOLOGY-2026-001",
    "SEA-EXTERNAL-DEPENDENCY-2026-001",
    "SEA-CARRIER-STRUCTURE-2026-001",
    "SEA-PRESSURE-FIELD-2026-001"
  ],
  supportLanes: [
    "CARRIER_STRUCTURE",
    "DEMOGRAPHY",
    "EXTERNAL_DEPENDENCY",
    "INDUSTRY",
    "INFRASTRUCTURE",
    "PRESSURE_FIELD",
    "TECHNOLOGY"
  ],
  observableFeatures: [
    {
      featureId: "SEA-OBS-001",
      laneId: "DEMOGRAPHY",
      observation: "ASEANstats reports a 2025 ASEAN population of 693.20 million."
    },
    {
      featureId: "SEA-OBS-002",
      laneId: "INDUSTRY",
      observation: "ASEAN FDI and manufacturing FDI remained material and expanded in the latest investment report."
    },
    {
      featureId: "SEA-OBS-003",
      laneId: "INFRASTRUCTURE",
      observation: "ASEAN Power Grid work includes cross-border connectors, domestic grid upgrades and subsea cables."
    },
    {
      featureId: "SEA-OBS-004",
      laneId: "TECHNOLOGY",
      observation: "DEFA negotiations concluded in 2026 around a region-wide digital integration framework."
    },
    {
      featureId: "SEA-OBS-005",
      laneId: "EXTERNAL_DEPENDENCY",
      observation: "Southeast Asian oil and gas operation remains materially exposed to Middle Eastern supply."
    },
    {
      featureId: "SEA-OBS-006",
      laneId: "CARRIER_STRUCTURE",
      observation: "Supply-chain-intensive industries are documented as material carriers of regional investment growth."
    },
    {
      featureId: "SEA-OBS-007",
      laneId: "PRESSURE_FIELD",
      observation: "The 2026 energy shock exposed import, route-concentration, inflation and fiscal vulnerabilities."
    }
  ],
  conflicts: [
    "Regional expansion and integration coexist with substantial cross-country differences in structure, income, infrastructure and exposure."
  ],
  unknowns: [
    "DEFA implementation depth across all member states is not established by negotiation conclusion alone.",
    "ASEAN Power Grid completion and uniform operational integration are not established.",
    "No single whole-dossier runtime position is established."
  ],
  freshness: {
    asOfDate: "2026-10-08",
    state: "CURRENT_WITH_SOURCE_SPECIFIC_FRESHNESS"
  },
  scopeBoundary: "Regional ASEAN/Southeast Asia readout only. Member-state variation is retained; no national-level uniformity is inferred.",
  boundaries: {
    rpCandidateCreated: false,
    grammarAssigned: false,
    realityDomainAssigned: false,
    wholeDossierPositionImplied: false
  }
};

// content/civilization-atlas/reconfiguration/dossier-us-w8i-accepted-current-dossier-v1.json
var dossier_us_w8i_accepted_current_dossier_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-US-W8I-ACCEPTED-CURRENT-DOSSIER-v1.0.0",
  status: "ACCEPTED_CURRENT_DOSSIER",
  dossierId: "DOSSIER-US",
  stage: "W8-I",
  entity: {
    en: "United States",
    "zh-Hans": "\u7F8E\u56FD"
  },
  admittedPositions: [
    {
      runtimePositionId: "RP-23",
      phase: 23,
      arc: "ACTIVATION",
      shortLabel: {
        en: "Runtime \xB7 Routing",
        "zh-Hans": "\u8FD0\u884C \xB7 \u8DEF\u5F84"
      },
      scope: "SUBSYSTEM",
      subsystem: "ECONOMIC_RUNTIME",
      grammarId: "G7",
      realityDomainId: "P2",
      evidenceRefs: [
        "US-CARRIER-STRUCTURE-2026-001",
        "US-EXTERNAL-DEPENDENCY-2026-001",
        "US-INDUSTRY-2026-001",
        "US-INFRASTRUCTURE-2026-001"
      ],
      readoutReference: {
        code: "RRE-READOUT-B6-US-2026-1-CONTRACT",
        version: "2026.1-contract",
        digest: "bdcd2690aba53b0dee677c7458174a575a9475b947e7e3b50aca67d54b74ffc7"
      },
      candidateId: "US-RP-23-US-W8E-SEM-ECONOMIC-RUNTIME",
      humanDecisionReference: "content/civilization-atlas/reconfiguration/dossier-us-w8h-human-decisions-v1.json"
    },
    {
      runtimePositionId: "RP-22",
      phase: 22,
      arc: "ACTIVATION",
      shortLabel: {
        en: "Carrier \xB7 Routing",
        "zh-Hans": "\u8F7D\u4F53 \xB7 \u8DEF\u5F84"
      },
      scope: "SUBSYSTEM",
      subsystem: "BUSINESS_INFRASTRUCTURE_CARRIER",
      grammarId: "G6",
      realityDomainId: "P2",
      evidenceRefs: [
        "US-CARRIER-STRUCTURE-2026-001",
        "US-INDUSTRY-2026-001",
        "US-INFRASTRUCTURE-2026-001"
      ],
      readoutReference: {
        code: "RRE-READOUT-B6-US-2026-1-CONTRACT",
        version: "2026.1-contract",
        digest: "bdcd2690aba53b0dee677c7458174a575a9475b947e7e3b50aca67d54b74ffc7"
      },
      candidateId: "US-RP-22-US-W8E-SEM-BUSINESS-INFRASTRUCTURE-CARRIER",
      humanDecisionReference: "content/civilization-atlas/reconfiguration/dossier-us-w8h-human-decisions-v1.json"
    }
  ],
  projectionBoundary: {
    subsystemPositionsDoNotImplySingleWholeDossierPosition: true,
    evidenceRefsPreserved: true,
    currentDossierOnly: true,
    prediction: false,
    historicalPositionShortcut: false,
    unresolvedSemanticBasisRemainExcluded: true
  },
  unresolvedSemanticBasis: [
    "US-W8E-SEM-FINANCIAL-CONSTRAINT",
    "US-W8E-SEM-MACRO-RECONFIGURATION",
    "US-W8E-SEM-SYSTEM-CONTINUITY"
  ],
  lineage: {
    source: "W8-A",
    claims: "W8-B",
    cwa: "W8-C",
    observableFeatures: "W8-D",
    rre: "W8-E",
    grammarDomain: "W8-F",
    rpCandidates: "W8-G",
    humanReview: "W8-H"
  }
};

// content/civilization-atlas/reconfiguration/dossier-us-w8h-human-decisions-v1.json
var dossier_us_w8h_human_decisions_v1_default = {
  schemaVersion: "PHI-OS-DOSSIER-US-W8H-HUMAN-DECISIONS-v1.0.0",
  status: "HUMAN_DECISIONS_RECORDED",
  dossierId: "DOSSIER-US",
  stage: "W8-H",
  decidedAt: "2026-10-08",
  decisionAuthority: "OWNER_HUMAN_REVIEW",
  records: [
    {
      candidateId: "US-RP-23-US-W8E-SEM-ECONOMIC-RUNTIME",
      decision: "ACCEPT",
      runtimePositionId: "RP-23",
      scope: "SUBSYSTEM",
      subsystem: "ECONOMIC_RUNTIME",
      boundary: "Accepted only for the named subsystem; does not establish a single whole-dossier U.S. position."
    },
    {
      candidateId: "US-RP-22-US-W8E-SEM-BUSINESS-INFRASTRUCTURE-CARRIER",
      decision: "ACCEPT",
      runtimePositionId: "RP-22",
      scope: "SUBSYSTEM",
      subsystem: "BUSINESS_INFRASTRUCTURE_CARRIER",
      boundary: "Accepted only for the named subsystem; does not exhaust the full U.S. carrier structure or imply one whole-dossier position."
    }
  ],
  boundary: "Only explicitly accepted W8-G candidates may advance into W8-I accepted current dossier projection."
};

// functions/_lib/book6-current-source.js
var rows2 = [{ accepted: dossier_af_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_af_w8h_human_decisions_v1_default, readout: dossier_af_w8d_rre_readout_v1_default }, { accepted: dossier_cn_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_cn_w8h_human_decisions_v1_default, readout: runtime_position_w8d_rre_readouts_v1_default.records.find((r) => r.dossierId === dossier_cn_w8i_accepted_current_dossier_v1_default.dossierId) }, { accepted: dossier_eu_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_eu_w8h_human_decisions_v1_default, readout: dossier_eu_w8d_rre_readout_v1_default }, { accepted: dossier_in_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_in_w8h_human_decisions_v1_default, readout: dossier_in_w8d_rre_readout_v1_default }, { accepted: dossier_jp_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_jp_w8h_human_decisions_v1_default, readout: dossier_jp_w8d_rre_readout_v1_default }, { accepted: dossier_kr_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_kr_w8h_human_decisions_v1_default, readout: dossier_kr_w8d_rre_readout_v1_default }, { accepted: dossier_latam_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_latam_w8h_human_decisions_v1_default, readout: dossier_latam_w8d_rre_readout_v1_default }, { accepted: dossier_me_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_me_w8h_human_decisions_v1_default, readout: dossier_me_w8d_rre_readout_v1_default }, { accepted: dossier_ru_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_ru_w8h_human_decisions_v1_default, readout: dossier_ru_w8d_rre_readout_v1_default }, { accepted: dossier_sea_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_sea_w8h_human_decisions_v1_default, readout: dossier_sea_w8d_rre_readout_v1_default }, { accepted: dossier_us_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_us_w8h_human_decisions_v1_default, readout: runtime_position_w8d_rre_readouts_v1_default.records.find((r) => r.dossierId === dossier_us_w8i_accepted_current_dossier_v1_default.dossierId) }];
function externalEvidence(dossierId, asOf) {
  return (moomoo_provider_rre_eligible_handoff_v1_default.records || []).filter((e) => e.dossierId === dossierId).filter((e) => (moomoo_provider_validated_claims_v1_default.records || []).some((v) => v.claimCandidateId === e.claimId && v.sourceId === e.sourceId) && (moomoo_provider_w8c_admission_results_v1_default.records || []).some((a) => a.claimCandidateId === e.claimId && a.sourceId === e.sourceId && a.admissionState === "ADMITTED")).map((e) => {
    const admission = moomoo_provider_w8c_admission_results_v1_default.records.find((a) => a.claimCandidateId === e.claimId), ageSeconds = (Date.parse(asOf) - Date.parse(e.retrievedAt)) / 1e3, ttl = admission.freshness?.ttlSeconds;
    return { claimId: e.claimId, sourceId: e.sourceId, sourceVersion: e.sourceVersion, sourceUrl: e.sourceUrl, claimText: e.claimText, retrievedAt: e.retrievedAt, validated: true, admission: "HISTORICALLY_ADMITTED_EXTERNAL_EVIDENCE", currentFreshness: Number.isFinite(ageSeconds) && Number.isFinite(ttl) && ageSeconds >= 0 ? ageSeconds <= ttl ? "CURRENT" : "STALE" : "UNKNOWN", ttlSeconds: ttl ?? null, positionAuthority: false };
  });
}
var timestampAdmissions = [dossier_af_w8c_current_authority_admission_v1_default, dossier_eu_w8c_current_authority_admission_v1_default, dossier_in_w8c_current_authority_admission_v1_default, dossier_jp_w8c_current_authority_admission_v1_default, dossier_kr_w8c_current_authority_admission_v1_default, dossier_latam_w8c_current_authority_admission_v1_default, dossier_me_w8c_current_authority_admission_v1_default, dossier_ru_w8c_current_authority_admission_v1_default, dossier_sea_w8c_current_authority_admission_v1_default];
function admittedTimestampSources(row, asOf) {
  const a = timestampAdmissions.find((a2) => a2.dossierId === row.accepted.dossierId) || { records: runtime_position_w8c_current_evidence_ir_v1_default.records, asOfDate: row.readout.freshness?.asOfDate };
  return (a.records || []).filter((r) => row.readout.evidenceRefs.includes(r.claimId) && (r.admissionDecision === "ADMITTED" || r.evidenceState === "CWA_ADMITTED" && r.rreEligibility === "RRE_ELIGIBLE") && (r.dossierId || a.dossierId) === row.accepted.dossierId && Number.isFinite(Date.parse(r.retrievedAt)) && Date.parse(r.retrievedAt) <= Date.parse(asOf)).map((r) => ({ claimId: r.claimId, sourceId: r.sourceId, sourceVersion: r.sourceVersion, sourceUrl: r.sourceUrl, authorityClass: r.authorityClass, publishedAt: r.publishedAt || null, retrievedAt: r.retrievedAt, recordedFreshness: r.freshnessState, timestampKind: "SOURCE_RETRIEVAL_NOT_ACCEPTANCE", admittedAsOf: a.asOfDate }));
}
function getAcceptedBook6Projection(id, asOf = (/* @__PURE__ */ new Date()).toISOString()) {
  const row = rows2.find((r) => r.accepted.dossierId === id);
  return row ? projectAcceptedBook6Current({ ...row, asOf, externalEvidence: externalEvidence(id, asOf), sourceEvidence: admittedTimestampSources(row, asOf) }) : null;
}

// functions/_lib/atlas-retrieval-scope.js
var clean9 = (value) => String(value ?? "").normalize("NFKC").trim();
var scalar = (value, max = 120) => clean9(value).slice(0, max) || null;
var list2 = (value, max = 8) => [...new Set((Array.isArray(value) ? value : []).map((item) => scalar(item)).filter(Boolean))].slice(0, max);
var LAYERS = /* @__PURE__ */ new Set(["timeline", "cases", "comparison", "world", "trajectories", "transitions", "loss"]);
var RECONFIG_LAYERS = /* @__PURE__ */ new Set(["overview", "search", "cases", "timeline", "windows", "snapshots", "dossiers", "lived", "positions", "compare", "dossiercompare", "sections"]);
var EVIDENCE_CLASSES2 = /* @__PURE__ */ new Set(["EVIDENCE_SERIES", "HISTORICAL_RECONSTRUCTION", "CONCEPTUAL_TRAJECTORY"]);
function normalizeAtlasRetrievalScope(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const bookCode = scalar(input.bookCode)?.toUpperCase();
  const partCode = scalar(input.partCode)?.toUpperCase();
  const activeLayer = scalar(input.activeLayer)?.toLowerCase();
  const scopeType = scalar(input.scopeType)?.toUpperCase();
  const isReconfiguration = scopeType === "CIVILIZATION_RECONFIGURATION_ATLAS" || bookCode === "BOOK-6";
  if (isReconfiguration) {
    if (bookCode !== "BOOK-6" || partCode !== "PART-13" || !RECONFIG_LAYERS.has(activeLayer)) return null;
    return Object.freeze({
      schemaVersion: "PHI-OS-ATLAS-RETRIEVAL-SCOPE-v2.0.0",
      scopeType: "CIVILIZATION_RECONFIGURATION_ATLAS",
      bookCode,
      partCode,
      activeLayer,
      entityId: scalar(input.entityId),
      caseIds: Object.freeze(list2(input.caseIds, 4)),
      windowId: scalar(input.windowId || input.transitionWindowId),
      snapshotId: scalar(input.snapshotId),
      dossierId: scalar(input.dossierId),
      livedRealityDimensionId: scalar(input.livedRealityDimensionId),
      positionId: scalar(input.positionId),
      sectionId: scalar(input.sectionId),
      comparisonIds: Object.freeze(list2(input.comparisonIds, 4)),
      evidenceClasses: Object.freeze(list2(input.evidenceClasses).filter((item) => EVIDENCE_CLASSES2.has(item)))
    });
  }
  if (bookCode !== "BOOK-5" || partCode !== "PART-12" || !LAYERS.has(activeLayer)) return null;
  return Object.freeze({
    schemaVersion: "PHI-OS-ATLAS-RETRIEVAL-SCOPE-v1.0.0",
    scopeType: "CIVILIZATION_ATLAS",
    bookCode,
    partCode,
    activeLayer,
    time: input.time == null || input.time === "" ? null : Number.isFinite(Number(input.time)) ? Math.trunc(Number(input.time)) : null,
    timeWindowId: scalar(input.timeWindowId),
    snapshotId: scalar(input.snapshotId),
    regionIds: Object.freeze(list2(input.regionIds)),
    caseIds: Object.freeze(list2(input.caseIds)),
    primaryCaseId: scalar(input.primaryCaseId),
    comparisonFamilyId: scalar(input.comparisonFamilyId),
    trajectoryIds: Object.freeze(list2(input.trajectoryIds, 5)),
    transitionWindowId: scalar(input.transitionWindowId),
    lossFamilyId: scalar(input.lossFamilyId),
    lossTypeId: scalar(input.lossTypeId),
    evidenceClasses: Object.freeze(list2(input.evidenceClasses).filter((item) => EVIDENCE_CLASSES2.has(item)))
  });
}
var readJson = async (env, path2) => {
  if (!env?.ASSETS?.fetch) return null;
  const response2 = await env.ASSETS.fetch(new Request(`https://assets.local/${path2}`));
  return response2.ok ? response2.json() : null;
};
var localized = (value, locale) => value && typeof value === "object" && !Array.isArray(value) ? clean9(value[locale] || value.en || value["zh-Hans"]) : clean9(value);
var questionTerms = (value) => {
  const text5 = clean9(value).toLocaleLowerCase();
  const latin = text5.match(/[a-z0-9-]{3,}/g) || [];
  const cjk = (text5.match(/[\u3400-\u9fff]+/g) || []).flatMap((run) => run.length <= 4 ? [run] : Array.from({ length: run.length - 1 }, (_, i) => run.slice(i, i + 2)));
  return [.../* @__PURE__ */ new Set([...latin, ...cjk])];
};
var FIELD_LABELS = { pressure: ["\u538B\u529B", "Pressure"], threshold: ["\u9608\u503C", "Threshold"], beforeState: ["\u4E4B\u524D\u72B6\u6001", "Before state"], transition: ["\u8F6C\u578B", "Transition"], newCapacity: ["\u65B0\u627F\u8F7D\u80FD\u529B", "New capacity"], newLoad: ["\u65B0\u589E\u8D1F\u8F7D", "New load"], irreversibility: ["\u4E0D\u53EF\u9006\u6027", "Irreversibility"], successorReality: ["\u540E\u7EE7\u73B0\u5B9E", "Successor reality"], definition: ["\u5B9A\u4E49", "Definition"], coreRuntimeProblem: ["\u6838\u5FC3\u8FD0\u884C\u95EE\u9898", "Core runtime problem"], runtimeSummary: ["\u8FD0\u884C\u6982\u51B5", "Runtime summary"] };
var readableAtlasRecord = (value) => {
  if (Array.isArray(value)) return value.map(readableAtlasRecord).filter((v) => v != null);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([k]) => !/(?:Ids?|Refs?|Codes?|Version)$/i.test(k) && !["assetRef", "runtimeFamily", "authorityClass", "unitMode", "status", "version"].includes(k)).map(([k, v]) => [k, FIELD_LABELS[k] && v?.en ? { "zh-Hans": FIELD_LABELS[k][0] + "\uFF1A" + (v["zh-Hans"] || v.en), en: FIELD_LABELS[k][1] + ": " + v.en } : readableAtlasRecord(v)]));
  return typeof value === "string" && /^(?:CA-T|WS-|TW-|VIS-|RP-|LOSS-|T[0-9])/.test(value) ? null : value;
};
var flattenLocalized = (record, locale, question = "") => {
  const selected = [];
  const visit = (value) => {
    if (value == null) return;
    if (Array.isArray(value)) {
      value.slice(0, 20).forEach(visit);
      return;
    }
    if (typeof value === "object") {
      if ("en" in value || "zh-Hans" in value) {
        const text5 = localized(value, locale);
        if (text5) selected.push(text5);
        return;
      }
      Object.values(value).forEach(visit);
      return;
    }
    if (typeof value === "string" && value.length > 2) selected.push(clean9(value));
  };
  visit(record);
  const terms3 = questionTerms(question), unique7 = [...new Set(selected)];
  unique7.sort((a, b) => terms3.filter((term) => b.toLocaleLowerCase().includes(term)).length - terms3.filter((term) => a.toLocaleLowerCase().includes(term)).length);
  return unique7.join(locale === "zh-Hans" ? "\u3002" : ". ").slice(0, 1800);
};
var CONFIG = Object.freeze({
  timeline: { path: "content/civilization-atlas/timeline/timeline-periods-v1.json", array: "periods", id: "periodId", scope: ["timeWindowId"] },
  cases: { path: "content/civilization-atlas/cases/civilization-case-registry-v1.json", array: "cases", id: "caseId", scope: ["primaryCaseId", "caseIds"] },
  comparison: { path: "content/civilization-atlas/comparison/comparison-families-v1.json", array: "families", id: "familyId", scope: ["comparisonFamilyId"] },
  world: { path: "content/civilization-atlas/snapshots/world-snapshots-v1.json", array: "snapshots", id: "snapshotId", scope: ["snapshotId"] },
  trajectories: { path: "content/civilization-atlas/trajectories/long-duration-trajectories-v1.json", array: "trajectories", id: "trajectoryId", scope: ["trajectoryIds"] },
  transitions: { path: "content/civilization-atlas/transitions/transition-windows-v1.json", array: "transitionWindows", id: "transitionWindowId", scope: ["transitionWindowId"] },
  loss: { path: "content/civilization-atlas/loss/reversal-loss-atlas-v1.json", arrays: ["families", "lossTypes"], ids: ["familyId", "lossTypeId"], scope: ["lossFamilyId", "lossTypeId"] }
});
var wantedIds = (scope, keys) => [...new Set(keys.flatMap((key) => Array.isArray(scope[key]) ? scope[key] : [scope[key]]).filter(Boolean))];
var RECONFIG_CONFIG = Object.freeze({
  cases: { path: "content/civilization-atlas/reconfiguration/reconfiguration-case-registry-v1.json", array: "cases", id: "id", stage: "RECONFIGURATION_CASE" },
  windows: { path: "content/civilization-atlas/reconfiguration/reconfiguration-windows-v1.json", array: "windows", id: "id", stage: "RECONFIGURATION_WINDOW" },
  snapshots: { path: "content/civilization-atlas/reconfiguration/world-reconfiguration-snapshots-v1.json", array: "snapshots", id: "id", stage: "WORLD_RECONFIGURATION_SNAPSHOT" },
  dossiers: { path: "content/civilization-atlas/reconfiguration/contemporary-runtime-dossiers-v1.json", array: "dossiers", id: "id", stage: "CONTEMPORARY_RUNTIME_DOSSIER" },
  lived: { path: "content/civilization-atlas/reconfiguration/lived-reality-dimensions-v1.json", array: "dimensions", id: "id", stage: "LIVED_REALITY_LAYER" },
  positions: { path: "content/registry/runtime-position-48-v1.json", array: "positions", id: "id", stage: "RUNTIME_POSITION" },
  sections: { path: "content/civilization-atlas/reconfiguration/book-vi-sections-v1.json", array: "sections", id: "id", stage: "BOOK_VI_CANONICAL_SECTION" }
});
var reconfigSelection = (scope) => [...new Set([
  scope.entityId,
  scope.windowId,
  scope.snapshotId,
  scope.dossierId,
  scope.livedRealityDimensionId,
  scope.positionId,
  scope.sectionId,
  ...scope.caseIds || [],
  ...scope.comparisonIds || []
].filter(Boolean))];
var sourceFor = (record, idKey, stage, locale, question) => ({
  sourceType: "CIVILIZATION_ATLAS_ENTITY",
  sourceId: `ATLAS:BOOK-6:${stage}:${record[idKey]}`,
  bookCode: "BOOK-6",
  partCode: "PART-13",
  atlasLayer: stage.toLowerCase(),
  atlasEntityId: record[idKey],
  authorityClass: record.knowledgeState || record.evidenceQuality || record.dataClass || "HISTORICAL_RECONSTRUCTION",
  scopeMatch: true,
  href: "/books/reality-reconfiguration/#atlas",
  text: flattenLocalized(readableAtlasRecord(record), locale, question)
});
async function retrieveReconfigurationScope({ env, scope, locale, question }) {
  const ordered = ["cases", "windows", "snapshots", "dossiers", "lived", "positions", "sections"], loaded = {};
  await Promise.all([
    ...ordered.map(async (key) => {
      loaded[key] = await readJson(env, RECONFIG_CONFIG[key].path);
    }),
    readJson(env, "content/civilization-atlas/reconfiguration/book-vi-atlas-relationships-v2.json").then((v) => loaded.relationships = v),
    readJson(env, "content/civilization-atlas/reconfiguration/runtime-position-book5-historical-alignment-v1.json").then((v) => loaded.positionHistory = v)
  ]);
  const selected = Object.fromEntries(ordered.map((k) => [k, /* @__PURE__ */ new Set()])), wanted = reconfigSelection(scope);
  const rowsByKey = Object.fromEntries(ordered.map((k) => {
    const cfg = RECONFIG_CONFIG[k];
    return [k, loaded[k]?.[cfg.array] || []];
  }));
  rowsByKey.dossiers = rowsByKey.dossiers.map((row) => {
    const p = getAcceptedBook6Projection(row.id);
    return p ? { id: row.id, label: row.label, knowledgeState: "HUMAN_ACCEPTED_SUBSYSTEM_POSITIONS_ONLY", wholeDossierPosition: "UNKNOWN", acceptedPositions: p.acceptedPositions, unknowns: p.unknowns, readoutReference: p.readoutReference, sourceTimestamp: p.sourceTimestamp, currentness: p.currentness } : row;
  });
  for (const id of wanted) for (const key of ordered) {
    const cfg = RECONFIG_CONFIG[key];
    if (rowsByKey[key].some((row) => row?.[cfg.id] === id)) selected[key].add(id);
  }
  const initial = Object.fromEntries(ordered.map((k) => [k, [...selected[k]]]));
  const add = (key, ids) => {
    for (const id of ids || []) if (rowsByKey[key].some((row) => row?.[RECONFIG_CONFIG[key].id] === id)) selected[key].add(id);
  };
  for (const id of initial.cases) {
    const c = rowsByKey.cases.find((x) => x.id === id);
    add("windows", c?.relatedWindows);
    add("snapshots", c?.relatedSnapshots);
    add("dossiers", c?.relatedDossiers);
    add("sections", c?.relatedBookSections);
  }
  for (const id of initial.windows) {
    const w = rowsByKey.windows.find((x) => x.id === id);
    add("cases", w?.majorCases);
    add("snapshots", w?.relatedSnapshots);
  }
  for (const id of initial.snapshots) {
    const s = rowsByKey.snapshots.find((x) => x.id === id);
    add("cases", s?.majorReconfigurationCases);
  }
  for (const id of initial.sections) {
    const r = (loaded.relationships?.relationships || []).find((x) => x.bookSection === id);
    add("cases", r?.relatedCases);
    add("windows", r?.relatedWindows);
    add("snapshots", r?.relatedSnapshots);
    add("dossiers", r?.relatedDossiers);
    add("lived", r?.relatedLivedRealityDimensions);
  }
  for (const id of initial.dossiers) for (const r of loaded.relationships?.relationships || []) if ((r.relatedDossiers || []).includes(id)) {
    add("sections", [r.bookSection]);
    add("cases", r.relatedCases);
    add("lived", r.relatedLivedRealityDimensions);
  }
  for (const id of initial.lived) for (const r of loaded.relationships?.relationships || []) if ((r.relatedLivedRealityDimensions || []).includes(id)) {
    add("sections", [r.bookSection]);
    add("dossiers", r.relatedDossiers);
  }
  const directIds = [...new Set(wanted)];
  const directSources = [];
  for (const id of directIds) {
    for (const key of ordered) {
      const cfg = RECONFIG_CONFIG[key], record = rowsByKey[key].find((row) => row?.[cfg.id] === id);
      if (record) {
        const source = sourceFor(record, cfg.id, cfg.stage, locale, question);
        if (source.text) directSources.push(source);
        break;
      }
    }
  }
  const expandedSources = [], stageRows = [];
  for (const key of ordered) {
    const cfg = RECONFIG_CONFIG[key];
    const rows3 = rowsByKey[key].filter((row) => selected[key].has(row?.[cfg.id])).slice(0, 8);
    const projected = rows3.map((row) => sourceFor(row, cfg.id, cfg.stage, locale, question)).filter((source) => source.text);
    expandedSources.push(...projected.filter((source) => !directIds.includes(source.atlasEntityId)));
    stageRows.push({ stage: cfg.stage, status: projected.length ? "MATCHED" : "NO_EXPLICIT_ENTITY_SELECTED", count: projected.length });
  }
  const sources = [...directSources, ...expandedSources];
  if (scope.positionId) {
    const alignment = (loaded.positionHistory?.alignments || []).find((x) => x.positionId === scope.positionId);
    if (alignment) {
      const text5 = flattenLocalized(alignment, locale, question);
      if (text5) sources.push({
        sourceType: "CIVILIZATION_ATLAS_POSITION_ALIGNMENT",
        sourceId: "ATLAS:BOOK-6:RUNTIME_POSITION_ALIGNMENT:" + scope.positionId,
        bookCode: "BOOK-6",
        partCode: "PART-13",
        atlasLayer: "runtime_position_alignment",
        atlasEntityId: scope.positionId,
        authorityClass: alignment.knowledgeState || "HISTORICAL_RECONSTRUCTION",
        scopeMatch: true,
        href: "/books/reality-reconfiguration/#atlas",
        text: text5
      });
    }
  }
  if (scope.dossierId) {
    const accepted = getAcceptedBook6Projection(scope.dossierId);
    if (accepted) {
      sources.push({ sourceType: "BOOK6_ACCEPTED_CURRENT_DOSSIER", sourceId: "ATLAS:BOOK-6:W8-I:" + scope.dossierId, bookCode: "BOOK-6", partCode: "PART-13", atlasEntityId: scope.dossierId, authorityClass: "HUMAN_ACCEPTED_SUBSYSTEM_POSITIONS_ONLY", scopeMatch: true, href: "/books/reality-reconfiguration/?atlas=dossiers&dossier=" + scope.dossierId, acceptedPositions: accepted.acceptedPositions, wholeDossierPosition: "UNKNOWN", readoutReference: accepted.readoutReference, sourceEvidence: accepted.sourceEvidence, text: (() => {
        const labels = accepted.acceptedPositions.map((p) => localized(p.shortLabel || runtime_position_48_v1_default.positions.find((r) => r.id === p.runtimePositionId)?.shortLabel, locale) || p.runtimePositionId).join(locale === "zh-Hans" ? "\u3001" : ", ");
        return locale === "zh-Hans" ? "\u5B50\u7CFB\u7EDF\u5DF2\u63A5\u53D7\u4F4D\u7F6E\uFF1A" + labels + "\u3002\u6574\u5730\u533A\u4F4D\u7F6E\uFF1A\u672A\u77E5\uFF08UNKNOWN\uFF09\u3002\u8FD9\u4E9B\u63A5\u53D7\u53EA\u8986\u76D6\u6240\u5217\u5B50\u7CFB\u7EDF\uFF0C\u4E0D\u5C06\u6574\u5730\u533A\u81EA\u52A8\u5347\u7EA7\u3002\u6765\u6E90\u8BC1\u636E\u65F6\u95F4\uFF1A" + (accepted.sourceTimestamp || "\u672A\u77E5") + "\u3002\u8BB0\u5F55\u65F6\u95F4\u4E0D\u81EA\u52A8\u8BC1\u660E\u5F53\u524D\u65F6\u6548\u6027\u3002" : "Accepted subsystem positions: " + labels + ". Whole dossier position: UNKNOWN. These accepted positions cover only the listed subsystems; no whole-dossier promotion is allowed. Source evidence timestamp: " + (accepted.sourceTimestamp || "UNKNOWN") + ". A recorded timestamp does not automatically establish current freshness.";
      })() });
      for (const e of accepted.externalEvidence.filter((e2) => e2.currentFreshness === "CURRENT")) sources.push({ sourceType: "BOOK6_VALIDATED_ADMITTED_PROVIDER_EVIDENCE", sourceId: e.claimId, bookCode: "BOOK-6", partCode: "PART-13", atlasEntityId: scope.dossierId, authorityClass: "EXTERNAL_EVIDENCE_NOT_POSITION_AUTHORITY", scopeMatch: true, href: e.sourceUrl, text: JSON.stringify(e) });
    }
  }
  if (scope.dossierId) {
    const accepted = getAcceptedBook6Projection(scope.dossierId);
    const bound = sources.filter((s) => ["BOOK6_ACCEPTED_CURRENT_DOSSIER", "BOOK6_VALIDATED_ADMITTED_PROVIDER_EVIDENCE"].includes(s.sourceType));
    if (!accepted) bound.push({ sourceType: "BOOK6_UNACCEPTED_DOSSIER_UNKNOWN", sourceId: "ATLAS:BOOK-6:UNKNOWN:" + scope.dossierId, bookCode: "BOOK-6", partCode: "PART-13", atlasEntityId: scope.dossierId, authorityClass: "UNKNOWN", scopeMatch: true, href: "/books/reality-reconfiguration/?atlas=dossiers&dossier=" + scope.dossierId, text: locale === "zh-Hans" ? "\u8BE5\u5730\u533A\u6CA1\u6709\u9002\u7528\u7684 W8-I \u63A5\u53D7\u8BB0\u5F55\u3002\u5DF2\u63A5\u53D7\u4F4D\u7F6E\u672A\u77E5\uFF0C\u6574\u5730\u533A\u4F4D\u7F6E\u4FDD\u6301 UNKNOWN\uFF0C\u4E0D\u4EE5\u5386\u53F2\u6848\u4F8B\u6216\u5176\u4ED6\u5730\u533A\u8865\u5168\u3002" : "No applicable W8-I acceptance exists for this region. Accepted positions are UNKNOWN; the whole dossier remains UNKNOWN. Historical cases and other regions cannot fill this gap." });
    sources.splice(0, sources.length, ...bound);
  }
  const entityCount = directSources.length;
  return { scope, sources, chain: [{ stage: "ATLAS_ENTITY", status: entityCount ? "MATCHED" : "NO_EXPLICIT_ENTITY_SELECTED", count: entityCount }, ...stageRows, { stage: "PART_13", status: "AUTHORIZED_FALLBACK" }, { stage: "BROADER_KNOWLEDGE", status: "AUTHORIZED_FALLBACK" }] };
}
async function retrieveAtlasScope({ env = {}, scope, locale = "zh-Hans", question = "" } = {}) {
  const normalized2 = normalizeAtlasRetrievalScope(scope);
  if (!normalized2) return { scope: null, sources: [], chain: [] };
  if (normalized2.scopeType === "CIVILIZATION_RECONFIGURATION_ATLAS") return retrieveReconfigurationScope({ env, scope: normalized2, locale, question });
  const config = CONFIG[normalized2.activeLayer];
  const [registry2, evidence] = await Promise.all([
    readJson(env, config.path),
    readJson(env, "content/civilization-atlas/evidence/evidence-authority-v1.json")
  ]);
  const arrays = config.arrays || [config.array], ids = config.ids || [config.id];
  const wanted = wantedIds(normalized2, config.scope);
  let records = [];
  arrays.forEach((arrayName, index) => records.push(...(registry2?.[arrayName] || []).map((record) => ({ record, idKey: ids[index] }))));
  if (wanted.length) records = records.filter(({ record, idKey }) => wanted.includes(record?.[idKey]));
  else records = [];
  const entitySources = records.slice(0, 8).map(({ record, idKey }) => {
    const entityId = record[idKey];
    return { sourceType: "CIVILIZATION_ATLAS_ENTITY", sourceId: `ATLAS:${normalized2.activeLayer}:${entityId}`, bookCode: "BOOK-5", partCode: "PART-12", atlasLayer: normalized2.activeLayer, atlasEntityId: entityId, authorityClass: record.authorityClass || config.defaultAuthority || "HISTORICAL_RECONSTRUCTION", scopeMatch: true, href: (() => {
      const u = atlasUrlFromState("/books/reality-differentiation/", normalized2);
      return u.pathname + u.search + u.hash;
    })(), text: flattenLocalized(readableAtlasRecord(record), locale, question) };
  }).filter((source) => source.text);
  const evidenceIds = [...new Set(records.flatMap(({ record }) => (record.evidence || record.evidenceIds || []).map((item) => typeof item === "string" ? item : item?.evidenceId)).filter(Boolean))];
  const evidenceSources = (evidence?.records || []).filter((record) => evidenceIds.includes(record.evidenceId)).slice(0, 12).map((record) => ({ sourceType: "CIVILIZATION_ATLAS_EVIDENCE", sourceId: `ATLAS:EVIDENCE:${record.evidenceId}`, bookCode: "BOOK-5", partCode: "PART-12", atlasLayer: normalized2.activeLayer, atlasEntityId: record.evidenceId, authorityClass: record.authorityClass || "EVIDENCE_SERIES", scopeMatch: true, href: "/books/reality-differentiation/", text: flattenLocalized(readableAtlasRecord(record), locale, question) })).filter((source) => source.text);
  return {
    scope: normalized2,
    sources: [...entitySources, ...evidenceSources],
    chain: [
      { stage: "ATLAS_ENTITY", status: entitySources.length ? "MATCHED" : "NO_EXPLICIT_ENTITY_SELECTED", count: entitySources.length },
      { stage: "ATLAS_EVIDENCE", status: evidenceSources.length ? "MATCHED" : "NO_LINKED_EVIDENCE_RECORD", count: evidenceSources.length },
      { stage: "PART_12", status: "AUTHORIZED_FALLBACK" },
      { stage: "BROADER_KNOWLEDGE", status: "AUTHORIZED_FALLBACK" }
    ]
  };
}

// functions/_lib/knowledge-access-api.js
var MODES = /* @__PURE__ */ new Set(["auto", "overview", "focused", "full_article", "continuity"]);
var SOURCES = /* @__PURE__ */ new Set(["auto", "hybrid", "published", "manuscript"]);
var LOCALES2 = /* @__PURE__ */ new Set(["zh-Hans", "en"]);
var MAX_QUERY_LENGTH2 = 500;
var MAX_ANSWER_CHARS = 1600;
var response = (body, status = 200) => Response.json(body, {
  status,
  headers: {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff"
  }
});
async function readAssetJson(env, path2) {
  if (!env?.ASSETS?.fetch) throw new Error("KNOWLEDGE_ACCESS_ASSETS_UNAVAILABLE");
  const result = await env.ASSETS.fetch(new Request(`https://assets.local/${path2}`));
  if (!result.ok) throw new Error(`KNOWLEDGE_ACCESS_ASSET_UNAVAILABLE:${path2}`);
  return result.json();
}
async function publishedProjection({ request, env, query, locale, mode }) {
  const url = new URL(request.url);
  url.pathname = "/api/public-knowledge";
  url.search = new URLSearchParams({ q: query, locale, mode }).toString();
  const result = await handlePublicKnowledgeRequest(new Request(url, { method: "GET" }), env);
  return result.json();
}
async function manuscriptProjection({ env, query, locale }) {
  if (env?.PHIOS_ENVIRONMENT === "qa" && env.PHIOS_MANUSCRIPT_RETRIEVAL_ENABLED !== "true") {
    return { status: "disabled_in_preview", records: [], errors: [] };
  }
  const [registry2, reviewedRegistry, bindings, corrections] = await Promise.all([
    readAssetJson(env, "content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v1.json"),
    readAssetJson(env, "content/knowledge/source-access/registries/manuscript-reviewed-corpus-registry-v1.json"),
    readAssetJson(env, "content/knowledge/source-access/registries/manuscript-section-canonical-binding-v1.json"),
    readAssetJson(env, "content/knowledge/source-access/registries/manuscript-editorial-correction-v1.json")
  ]);
  const sources = registry2.records.filter((source) => source.locale === locale).map((source) => {
    const reviewed = reviewedRegistry.records.find((record) => record.sourceCode === source.sourceCode && record.locale === source.locale);
    if (!reviewed || reviewed.humanReadabilityStatus !== "HUMAN_REVIEW_COMPLETE") return null;
    return {
      ...source,
      r2ObjectKey: reviewed.r2ObjectKey,
      retrievalCorpusSha256: reviewed.retrievalCorpusSha256,
      activeCorpusAuthority: reviewed.corpusAuthority,
      humanReadabilityStatus: reviewed.humanReadabilityStatus
    };
  }).filter(Boolean);
  if (!sources.length) return { status: "locale_unavailable", records: [], errors: [] };
  if (!env?.MANUSCRIPTS?.get) return { status: "storage_unavailable", records: [], errors: ["MANUSCRIPT_SOURCE_STORAGE_UNAVAILABLE"] };
  const settled = await Promise.allSettled(sources.map(async (source) => {
    const corpus = await loadR2RetrievalCorpus(env.MANUSCRIPTS, source);
    return searchManuscriptCorpus({ corpus, source, bindings, corrections, query });
  }));
  const records = settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const errors = settled.filter((result) => result.status === "rejected").map((result) => result.reason?.code || "MANUSCRIPT_SOURCE_QUERY_FAILED");
  records.sort((a, b) => b.score - a.score || a.sectionCode.localeCompare(b.sectionCode));
  return {
    status: records.length ? "covered" : errors.length === sources.length ? "unavailable" : "no_match",
    records: records.slice(0, MANUSCRIPT_SOURCE_LIMITS.maximumResults),
    errors
  };
}
function groundingFrom(published, manuscript) {
  const sources = [];
  for (const fragment of published?.projection?.fragments || []) {
    sources.push({
      sourceType: "PUBLISHED_CANONICAL_ARTICLE",
      nodeCode: published.projection.nodeCode,
      fragmentCode: fragment.fragmentCode,
      digest: fragment.digest,
      text: fragment.text,
      // BOOK_VII_ADMISSION_METADATA: preserve governed projection metadata only.
      ...fragment.bookId === "BOOK-7" ? { nodeCode: fragment.nodeCode || published.projection.nodeCode, bookId: fragment.bookId, bookCode: fragment.bookCode, partCode: fragment.partCode, scopeMatch: fragment.scopeMatch, publicationStatus: fragment.publicationStatus, authorityOwner: fragment.authorityOwner, sourceType: fragment.sourceType, epistemicEvidence: fragment.epistemicEvidence, canonicalProseAuthority: fragment.canonicalProseAuthority, ocrAuthority: fragment.ocrAuthority } : {}
    });
  }
  for (const record of manuscript?.records || []) {
    sources.push({
      sourceType: record.sourceType,
      bookCode: record.bookCode,
      partCode: record.partCode,
      sectionCode: record.sectionCode,
      pageRange: record.pageRange,
      sourceDigest: record.sourceDigest,
      canonicalBinding: record.canonicalBinding,
      text: record.excerpt
    });
  }
  return {
    allowed: sources.length > 0,
    generatedAnswerPresent: false,
    policy: "DOWNSTREAM_SUMMARY_OR_ANSWER_MUST_USE_ONLY_RETURNED_GROUNDING_AND_PRESERVE_SOURCE_BOUNDARIES",
    sources
  };
}
function splitSentences2(text5) {
  return String(text5 || "").replace(/\s+/g, " ").match(/[^。！？!?]+[。！？!?]?/g)?.map((value) => value.trim()).filter((value) => value.length >= 12) || [];
}
function deterministicGroundedAnswer(query, grounding, locale) {
  if (!grounding?.allowed) return null;
  const terms3 = queryTerms(query);
  const candidates = [];
  for (const source of grounding.sources || []) {
    const sourceId = source.sourceId || (source.sourceType === "PUBLISHED_CANONICAL_ARTICLE" ? `PUBLISHED:${source.nodeCode}:${source.fragmentCode}` : `MANUSCRIPT:${source.sectionCode}`);
    for (const sentence of splitSentences2(source.text)) {
      const normalized2 = sentence.toLocaleLowerCase();
      let score = source.sourceType === "PUBLISHED_CANONICAL_ARTICLE" ? 2 : 0;
      for (const term of terms3) if (normalized2.includes(term)) score += term.length > 2 ? 3 : 1;
      candidates.push({ sentence, score, sourceId });
    }
  }
  candidates.sort((left, right) => right.score - left.score || left.sentence.length - right.sentence.length);
  const selected = [];
  const seen = /* @__PURE__ */ new Set();
  let characters = 0;
  for (const candidate of candidates) {
    const key = candidate.sentence.normalize("NFKC");
    if (seen.has(key) || selected.length && candidate.score <= 0) continue;
    if (characters + candidate.sentence.length > MAX_ANSWER_CHARS && selected.length) continue;
    seen.add(key);
    selected.push(candidate);
    characters += candidate.sentence.length;
    if (selected.length >= 4 || characters >= MAX_ANSWER_CHARS) break;
  }
  if (!selected.length && candidates.length) selected.push(candidates[0]);
  if (!selected.length) return null;
  return {
    present: true,
    projectionType: "DETERMINISTIC_EXTRACTIVE_GROUNDED_ANSWER",
    generativeModelUsed: false,
    locale,
    text: selected.map((item) => item.sentence).join(locale === "zh-Hans" ? "\n\n" : " "),
    sourceReferences: [...new Set(selected.map((item) => item.sourceId))],
    authorityNotice: "This answer is a question-scoped extractive projection from returned governed sources. It does not create Canonical Node or Published Article authority."
  };
}
async function handleKnowledgeAccessRequest(request, env = {}, options = {}) {
  if (request.method !== "GET") return response({ ok: false, error: { code: "METHOD_NOT_ALLOWED" } }, 405);
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim();
  const locale = url.searchParams.get("locale") || "zh-Hans";
  const mode = url.searchParams.get("mode") || "auto";
  const sourceMode = url.searchParams.get("source") || "hybrid";
  if (!query || query.length > MAX_QUERY_LENGTH2) return response({ ok: false, error: { code: "QUERY_INVALID" } }, 400);
  if (!LOCALES2.has(locale)) return response({ ok: false, error: { code: "LOCALE_UNSUPPORTED" } }, 400);
  if (!MODES.has(mode)) return response({ ok: false, error: { code: "MODE_UNSUPPORTED" } }, 400);
  if (!SOURCES.has(sourceMode)) return response({ ok: false, error: { code: "SOURCE_MODE_UNSUPPORTED" } }, 400);
  let published = null;
  let manuscript = { status: "not_requested", records: [], errors: [] };
  if (sourceMode !== "manuscript") published = await publishedProjection({ request, env, query, locale, mode });
  if (sourceMode !== "published") manuscript = await manuscriptProjection({ env, query, locale });
  const publishedCovered = published?.coverage?.level && published.coverage.level !== "none";
  const manuscriptCovered = manuscript.records.length > 0;
  const coverage = publishedCovered && manuscriptCovered ? "hybrid" : publishedCovered ? "published" : manuscriptCovered ? "manuscript" : "none";
  if (sourceMode === "manuscript" && manuscript.status === "storage_unavailable") {
    return response({ ok: false, error: { code: "MANUSCRIPT_SOURCE_STORAGE_UNAVAILABLE" } }, 503);
  }
  const atlas = await retrieveAtlasScope({ env, scope: options.retrievalScope, locale, question: query });
  const answerGrounding = groundingFrom(published, manuscript);
  answerGrounding.sources = atlas.scope ? atlas.sources : [...atlas.sources, ...answerGrounding.sources];
  if (atlas.scope) {
    published = { ...published, results: [] };
    manuscript = { ...manuscript, records: [] };
  }
  answerGrounding.allowed = answerGrounding.sources.length > 0;
  const groundedAnswer = deterministicGroundedAnswer(query, answerGrounding, locale);
  answerGrounding.generatedAnswerPresent = Boolean(groundedAnswer);
  return response({
    ok: true,
    query: { text: query, locale, mode, source: sourceMode },
    coverage: {
      level: coverage,
      published: published?.coverage?.level || "not_requested",
      manuscript: manuscript.status,
      answerGroundingAllowed: publishedCovered || manuscriptCovered
    },
    groundedAnswer,
    published,
    manuscript: {
      status: manuscript.status,
      records: manuscript.records,
      errors: manuscript.errors,
      exposure: {
        rawFullBookAvailable: false,
        rawSectionBodyAvailable: false,
        maximumExcerptCharsPerResult: MANUSCRIPT_SOURCE_LIMITS.maximumExcerptCharsPerResult,
        maximumTotalExcerptChars: MANUSCRIPT_SOURCE_LIMITS.maximumTotalExcerptChars
      }
    },
    retrievalScope: atlas.scope,
    retrievalChain: atlas.chain,
    answerGrounding,
    authorityBoundary: {
      publishedArticleAuthorityUnchanged: true,
      completedManuscriptIsValidKnowledgeSource: true,
      activeManuscriptCorpusIsHumanReviewed: true,
      sourceNativeSectionMayAnswerWithoutCanonicalNodeClaim: true,
      pendingCanonicalBindingIsNotCanonicalAuthority: true,
      bookPurchaseAndKnowledgeQueryAreSeparateCapabilities: true
    }
  });
}

// functions/_lib/formation-retrieval-scope.js
var REGISTRY = "content/knowledge/structured/book-1/book-1-mechanism-registry-v1.json";
function normalizeFormationScope(value) {
  if (value?.bookCode !== "BOOK-1") return normalizeStructuredScope(value);
  if (value?.scopeType !== "STRUCTURED_KNOWLEDGE" || value?.bookCode !== "BOOK-1" || !/^SK-B1-[A-Z-]{1,70}$/.test(value?.objectId || "")) return null;
  return { scopeType: "STRUCTURED_KNOWLEDGE", bookCode: "BOOK-1", objectId: value.objectId };
}
async function registry(env) {
  if (!env?.ASSETS?.fetch) return null;
  try {
    const response2 = await env.ASSETS.fetch(new Request(`https://assets.local/${REGISTRY}`));
    if (!response2.ok) return null;
    const data = await response2.json();
    return Array.isArray(data?.objects) && data.details ? data : null;
  } catch {
    return null;
  }
}
function eligible(object3) {
  return object3?.bookCode === "BOOK-1" && ["IN_REVIEW", "ACCEPTED", "ACTIVE"].includes(object3.status) && ["CANDIDATE", "REVIEWED", "ACTIVE"].includes(object3.projectionState) && ["SUPPORTED_SOURCE", "CANONICAL_SOURCE"].includes(object3.evidenceState) && object3.sourceRefs?.canonicalNodeCodes?.includes(object3.nodeCode) && object3.sourceRefs?.manuscriptSectionRefs?.length > 0;
}
async function resolveFormationEntry(ref, env = {}) {
  if (/^CONCEPT:sk-b[1-4]-/.test(String(ref))) return resolveStructuredEntry(ref, env);
  if (!String(ref).startsWith("CONCEPT:")) return null;
  const data = await registry(env);
  if (!data) return null;
  const object3 = data.objects?.find((o) => `CONCEPT:${data.details?.[o.objectId]?.conceptId?.replaceAll("_", "-")}` === ref);
  if (!eligible(object3)) return null;
  return { bookCode: "BOOK-1", partCode: object3.partCode, retrievalScope: { scopeType: "STRUCTURED_KNOWLEDGE", bookCode: "BOOK-1", objectId: object3.objectId } };
}
async function retrieveFormationScope({ env = {}, scope, locale = "zh-Hans" } = {}) {
  if (scope?.bookCode !== "BOOK-1") return retrieveStructuredObject({ env, scope, locale });
  const normalized2 = normalizeFormationScope(scope);
  if (!normalized2) return { sources: [], nodeCodes: [], chain: [] };
  const data = await registry(env);
  const selected = data?.objects?.find((o) => o.objectId === normalized2.objectId);
  if (!eligible(selected)) return { sources: [], nodeCodes: [], chain: [{ stage: "SELECTED_STRUCTURED_OBJECT", status: "UNAVAILABLE" }] };
  const relatedIds = data.details?.[selected.objectId]?.relatedMechanisms || [];
  const objects = [selected, ...[...new Set(relatedIds)].filter((id) => id !== selected.objectId).map((id) => data.objects.find((o) => o.objectId === id)).filter(eligible)].slice(0, 6);
  return { sources: objects.map((o, index) => ({ sourceId: `STRUCTURED:${o.objectId}`, sourceType: "STRUCTURED_KNOWLEDGE_OBJECT", authorityClass: "GOVERNED_PROJECTION", bookCode: o.bookCode, partCode: o.partCode, nodeCode: o.nodeCode, structuredObjectId: o.objectId, scopeMatch: true, selected: index === 0, href: `/books/reality-formation/?mechanism=${o.objectId}#explorer`, text: `${o.title}: ${o.canonicalMeaning}${locale === "en" ? `
Draft English translation: ${data.details[o.objectId].summaryEn}` : ""}
Boundary: source-based preview; structured classification and translation await human review. No automatic personal diagnosis.`, sourceRefs: o.sourceRefs, humanAcceptanceComplete: false })), nodeCodes: [...new Set(objects.map((o) => o.nodeCode))], chain: [{ stage: "SELECTED_STRUCTURED_OBJECT", status: "MATCHED", count: 1 }, { stage: "RELATED_STRUCTURED_OBJECTS", status: "MATCHED", count: objects.length - 1 }, { stage: "CANONICAL_NODE", status: "SOURCE_REFS_BOUND" }, { stage: "MANUSCRIPT_OR_PUBLISHED_ARTICLE", status: "EXISTING_RETRIEVAL_FALLBACK" }, { stage: "BROADER_KNOWLEDGE", status: "EXISTING_POLICY_FALLBACK" }] };
}

// functions/_lib/ptrc-knowledge-quality.js
var QUALITY_SCHEMA = "PHI-OS-PTRC-KNOWLEDGE-QUALITY-v1.0.0";
var THRESHOLD_VERSION = "PTRC-W4-THRESHOLDS-v1.0.0";
var OUTCOMES = /* @__PURE__ */ new Set(["SUFFICIENT", "PARTIAL", "AMBIGUOUS", "CONTRADICTORY", "INSUFFICIENT"]);
var clean10 = (value) => String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ");
var unique2 = (items) => [...new Set(items.filter(Boolean))];
var STOP = /* @__PURE__ */ new Set(["what", "why", "how", "who", "when", "where", "which", "the", "and", "for", "are", "is", "was", "were", "this", "that", "with", "from", "into", "about", "please", "explain", "tell", "\u4EC0\u4E48", "\u4E3A\u4EC0\u4E48", "\u5982\u4F55", "\u600E\u4E48", "\u600E\u6837", "\u8FD9\u4E2A", "\u90A3\u4E2A", "\u54EA\u4E9B", "\u662F\u5426", "\u8BF7\u95EE", "\u89E3\u91CA"]);
function freeze3(v) {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v)) freeze3(x);
  }
  return v;
}
function terms2(value) {
  const text5 = clean10(value).toLocaleLowerCase();
  const latin = text5.match(/[a-z0-9-]{3,}/g) || [];
  const runs = text5.match(/[\u3400-\u9fff]+/g) || [];
  const cjk = runs.flatMap((run) => run.length <= 4 ? [run] : Array.from({ length: Math.min(run.length - 1, 20) }, (_, i) => run.slice(i, i + 2)));
  return unique2([...latin, ...cjk]).filter((x) => !STOP.has(x));
}
function languageScore(text5, locale) {
  const cjk = /[\u3400-\u9fff]/.test(clean10(text5));
  return locale === "zh-Hans" ? cjk ? 1 : 0.7 : cjk ? 0.65 : 1;
}
function relevanceScore(question, source) {
  const q = terms2(question);
  if (!q.length) return 0;
  const corpus = clean10(source?.text).toLocaleLowerCase();
  const matched = q.filter((x) => corpus.includes(x));
  const scoped = source?.scopeMatch === true;
  return Math.min(1, Number((matched.length / q.length + (scoped ? 0.35 : 0)).toFixed(3)));
}
function sourceStateScore(source) {
  if (source?.sourceType === "PUBLISHED_CANONICAL_ARTICLE") return 1;
  if (source?.sourceType === "CIVILIZATION_ATLAS_EVIDENCE") return 0.95;
  if (source?.sourceType === "CIVILIZATION_ATLAS_ENTITY") return 0.9;
  if (source?.sourceType === "COMPLETED_MANUSCRIPT") return 0.78;
  return 0.65;
}
function sourceStage(source) {
  if (source?.sourceType === "CIVILIZATION_ATLAS_ENTITY") return "ATLAS_ENTITY";
  if (source?.sourceType === "CIVILIZATION_ATLAS_EVIDENCE") return "ATLAS_EVIDENCE";
  if (source?.bookCode === "BOOK-5" && source?.partCode === "PART-12") return "PART_12";
  return "BROADER_KNOWLEDGE";
}
function explicitContradiction(source) {
  return source?.contradiction === true || source?.contradictory === true || String(source?.authorityClass || "").toUpperCase() === "CONTRADICTORY";
}
function requestedDimensions(intent) {
  if (intent === "COMPARE") return ["SIDE_A", "SIDE_B"];
  if (intent === "TRACE") return ["EARLIER", "LATER"];
  if (intent === "CALCULATE") return ["INPUTS", "FORMULA_OR_RESULT"];
  return ["PRIMARY_QUESTION"];
}
function adaptPtrcEvidence(bundle = {}, contract = {}) {
  const locale = contract.locale || bundle?.question?.locale || "zh-Hans";
  const question = contract.question || bundle?.question?.text || "";
  return freeze3((bundle?.sources || []).map((source, index) => ({
    evidenceId: source.sourceId || `PTRC-EVIDENCE-${index + 1}`,
    objectType: source.sourceType || "GOVERNED_KNOWLEDGE_SOURCE",
    stage: sourceStage(source),
    relationType: source?.sourceType === "CIVILIZATION_ATLAS_EVIDENCE" ? "EVIDENCE_FOR_ENTITY" : source?.scopeMatch === true ? "IN_EXPLICIT_SCOPE" : "QUESTION_RETRIEVAL_MATCH",
    sourceState: source?.sourceType === "PUBLISHED_CANONICAL_ARTICLE" ? "PUBLISHED" : source?.sourceType === "COMPLETED_MANUSCRIPT" ? "REVIEWED_MANUSCRIPT" : source?.sourceType?.startsWith?.("CIVILIZATION_ATLAS_") ? "REGISTERED_ATLAS" : "GOVERNED_SOURCE",
    language: locale,
    scores: {
      entityMatch: source?.scopeMatch === true ? 1 : 0,
      relevance: relevanceScore(question, source),
      sourceState: sourceStateScore(source),
      language: languageScore(source?.text, locale),
      freshness: 1
    },
    contradictory: explicitContradiction(source),
    bookCode: source?.bookCode || null,
    partCode: source?.partCode || null,
    atlasLayer: source?.atlasLayer || null,
    atlasEntityId: source?.atlasEntityId || null,
    source
  })));
}
function buildPtrcRetrievalStages(bundle = {}, contract = {}) {
  const adapted = adaptPtrcEvidence(bundle, contract);
  const existing = Array.isArray(bundle?.retrievalChain) ? bundle.retrievalChain : [];
  const order = ["ATLAS_ENTITY", "ATLAS_EVIDENCE", "PART_12", "BROADER_KNOWLEDGE"];
  const scope = contract?.retrievalScope || {};
  return freeze3(order.map((stage) => {
    const matching = adapted.filter((item) => item.stage === stage);
    const original = existing.find((item) => item.stage === stage || item.stage === (stage === "BROADER_KNOWLEDGE" ? "BROADER_GOVERNED_KNOWLEDGE" : stage));
    let status = matching.length ? "MATCHED" : original?.status || "NO_MATCH";
    if (stage === "BROADER_KNOWLEDGE" && contract?.answerPolicy?.allowBroaderKnowledge === false) status = "DISALLOWED_BY_POLICY";
    if (stage === "PART_12" && scope?.atlasScope?.bookCode === "BOOK-5" && !matching.length) status = original?.status || "AUTHORIZED_FALLBACK_NO_MATCH";
    return { stage, status, count: matching.length, evidenceIds: matching.map((item) => item.evidenceId) };
  }));
}
function filterPtrcSourcesByPolicy(sources = [], contract = {}) {
  const list7 = Array.isArray(sources) ? sources : [];
  if (contract?.answerPolicy?.allowBroaderKnowledge !== false) return list7;
  if (contract?.retrievalScope?.structuredScope) return list7.filter((source) => source?.sourceType === "STRUCTURED_KNOWLEDGE_OBJECT" && source?.bookCode === contract.retrievalScope.structuredScope.bookCode && source?.scopeMatch === true);
  if (!contract?.retrievalScope?.atlasScope) return list7.filter((source) => source?.sourceType === "PUBLISHED_CANONICAL_ARTICLE");
  return list7.filter((source) => source?.sourceType?.startsWith?.("CIVILIZATION_ATLAS_") || source?.bookCode === "BOOK-5" && source?.partCode === "PART-12");
}
function evaluatePtrcKnowledgeQuality({ bundle = {}, contract = {} } = {}) {
  const evidence = adaptPtrcEvidence(bundle, contract);
  const minimumEvidence = Math.max(1, Number(contract?.answerPolicy?.minimumEvidence || 2));
  const relevant = evidence.filter((item) => item.scores.relevance >= 0.18 || item.scores.entityMatch === 1);
  const contradictions = evidence.filter((item) => item.contradictory);
  const dimensions = requestedDimensions(contract?.intent || "EXPLAIN");
  let covered = 0;
  if (dimensions.length === 1) covered = relevant.length ? 1 : 0;
  else if (contract?.intent === "COMPARE") covered = Math.min(2, new Set(relevant.map((item) => item.atlasEntityId || item.evidenceId)).size);
  else if (contract?.intent === "TRACE") covered = Math.min(2, new Set(relevant.map((item) => item.stage === "ATLAS_ENTITY" ? item.atlasEntityId || item.evidenceId : item.stage)).size);
  else covered = Math.min(dimensions.length, relevant.length);
  const coverageRatio = dimensions.length ? covered / dimensions.length : 0;
  const ambiguous = contract?.intent === "CLARIFY" || !contract?.question && relevant.length === 0;
  let outcome = "INSUFFICIENT";
  const reasons = [];
  if (contradictions.length) {
    outcome = "CONTRADICTORY";
    reasons.push("CONTRARY_GOVERNED_EVIDENCE_PRESENT");
  } else if (ambiguous) {
    outcome = "AMBIGUOUS";
    reasons.push("QUESTION_REQUIRES_CLARIFICATION");
  } else if (relevant.length >= minimumEvidence && coverageRatio >= 1) {
    outcome = "SUFFICIENT";
    reasons.push("MINIMUM_EVIDENCE_AND_DIMENSION_COVERAGE_MET");
  } else if (relevant.length > 0) {
    outcome = "PARTIAL";
    reasons.push(relevant.length < minimumEvidence ? "MINIMUM_EVIDENCE_NOT_MET" : "REQUESTED_DIMENSION_COVERAGE_INCOMPLETE");
  } else {
    reasons.push(evidence.length ? "RETRIEVED_EVIDENCE_NOT_RELEVANT" : "NO_GOVERNED_EVIDENCE");
  }
  const average = relevant.length ? Number((relevant.reduce((sum, item) => sum + item.scores.relevance, 0) / relevant.length).toFixed(3)) : 0;
  return freeze3({
    schemaVersion: QUALITY_SCHEMA,
    thresholdVersion: THRESHOLD_VERSION,
    outcome,
    reasonCodes: reasons,
    evidenceCount: evidence.length,
    relevantEvidenceCount: relevant.length,
    minimumEvidence,
    requestedDimensions: dimensions,
    coveredDimensions: covered,
    coverageRatio: Number(coverageRatio.toFixed(3)),
    averageRelevance: average,
    contradictionCount: contradictions.length,
    longFormAllowed: outcome === "SUFFICIENT",
    shortSupportedAnswerAllowed: outcome === "SUFFICIENT" || outcome === "PARTIAL",
    clarificationRequired: outcome === "AMBIGUOUS",
    unconditionalClaimAllowed: outcome === "SUFFICIENT" || outcome === "PARTIAL",
    evidence: relevant.map((item) => ({ evidenceId: item.evidenceId, objectType: item.objectType, stage: item.stage, relationType: item.relationType, scores: item.scores }))
  });
}
function applyPtrcQualityToCoverage(legacyCoverage = {}, quality = null) {
  if (!quality || !OUTCOMES.has(quality.outcome)) return legacyCoverage;
  const status = quality.outcome === "SUFFICIENT" ? "STRONG_COVERAGE" : quality.outcome === "PARTIAL" ? "PARTIAL_COVERAGE" : legacyCoverage?.status === "OUT_OF_SCOPE" ? "OUT_OF_SCOPE" : "INSUFFICIENT_COVERAGE";
  return freeze3({
    ...legacyCoverage,
    schemaVersion: "PHI-OS-KAP-COVERAGE-DECISION-PTRC-v1.0.0",
    status,
    reasonCodes: unique2([...legacyCoverage?.reasonCodes || [], ...quality.reasonCodes]),
    answerCompositionEligible: quality.longFormAllowed === true,
    shortSupportedAnswerEligible: quality.shortSupportedAnswerAllowed === true,
    ptrcQuality: quality
  });
}

// functions/_lib/knowledge-answer-grounding.js
var SUPPORTED_LOCALES2 = /* @__PURE__ */ new Set(["zh-Hans", "en"]);
var MAX_QUERY_LENGTH3 = 500;
var DEFAULT_SOURCE_MODE = "hybrid";
var DEFAULT_RETRIEVAL_MODE = "auto";
var MAX_NODE_MATCHES = 8;
var MAX_RELATIONSHIPS = 8;
var MAX_MECHANISM_FACETS = 12;
var canonicalText = (value) => String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ");
var searchText = (value) => canonicalText(value).toLocaleLowerCase();
var unique3 = (values) => [...new Set(values.filter(Boolean))];
var RELEVANCE_STOP_LATIN = /* @__PURE__ */ new Set(["what", "why", "how", "who", "when", "where", "which", "is", "are", "was", "were", "be", "been", "being", "do", "does", "did", "can", "could", "would", "should", "the", "a", "an", "my", "me", "i", "we", "our", "you", "your", "it", "this", "that", "these", "those", "so", "very", "please", "explain", "tell", "about"]);
var RELEVANCE_STOP_CJK = /* @__PURE__ */ new Set(["\u4E3A\u4EC0", "\u4EC0\u4E48", "\u4E3A\u4F55", "\u600E\u4E48", "\u600E\u6837", "\u5982\u4F55", "\u662F\u5426", "\u662F\u4E0D\u662F", "\u8FD9\u4E2A", "\u90A3\u4E2A", "\u8FD9\u4E9B", "\u90A3\u4E9B", "\u6211\u7684", "\u6211\u4EEC", "\u81EA\u5DF1", "\u53EF\u4EE5", "\u80FD\u591F", "\u9700\u8981", "\u6CA1\u6709", "\u90A3\u4E48", "\u4E00\u4E0B", "\u8BF7\u95EE", "\u544A\u8BC9", "\u89E3\u91CA"]);
function relevanceTerms(tokens2 = []) {
  return unique3(tokens2.map(searchText).filter((term) => {
    if (!term) return false;
    if (/^[a-z0-9-]+$/i.test(term)) return term.length >= 3 && !RELEVANCE_STOP_LATIN.has(term);
    return term.length >= 2 && !RELEVANCE_STOP_CJK.has(term);
  }));
}
function evaluateKapQuestionSourceRelevance(bundle = {}) {
  const sources = Array.isArray(bundle?.sources) ? bundle.sources : [];
  const terms3 = relevanceTerms(bundle?.normalization?.tokens || []);
  if (!sources.length) return Object.freeze({ state: "NO_SOURCES", established: false, informativeTerms: terms3, matchedTerms: [] });
  if (!terms3.length) return Object.freeze({ state: "NOT_ENOUGH_QUERY_TERMS_TO_GATE", established: false, informativeTerms: [], matchedTerms: [], matchRatio: 0 });
  const corpus = sources.map((source) => searchText(source?.text || "")).join("\n");
  const matched = terms3.filter((term) => corpus.includes(term));
  const scoped = sources.some((source) => source?.scopeMatch === true);
  const required = terms3.length === 1 ? 1 : 2;
  const established = scoped ? matched.length >= 1 : matched.length >= required;
  return Object.freeze({ state: established ? "QUESTION_SOURCE_RELEVANCE_ESTABLISHED" : "QUESTION_SOURCE_RELEVANCE_NOT_ESTABLISHED", established, informativeTerms: terms3, matchedTerms: matched, matchRatio: Number((matched.length / terms3.length).toFixed(3)), requiredMatches: scoped ? 1 : required, structuredScopeMatch: scoped });
}
function compactObject(value = {}, allowed = []) {
  const output = {};
  for (const key of allowed) {
    const current = value?.[key];
    if (current !== void 0 && current !== null && current !== "") output[key] = current;
  }
  return output;
}
function stableHash(value) {
  let hash3 = 2166136261;
  for (const char of String(value)) {
    hash3 ^= char.codePointAt(0);
    hash3 = Math.imul(hash3, 16777619) >>> 0;
  }
  return hash3.toString(16).padStart(8, "0");
}
function createKapQuestionIntake(input = {}) {
  const rawQuestion = typeof input === "string" ? input : input.question;
  const question = canonicalText(rawQuestion);
  const locale = typeof input === "string" ? "zh-Hans" : input.locale || "zh-Hans";
  if (!question || question.length > MAX_QUERY_LENGTH3) throw new Error("KAP_QUESTION_INVALID");
  if (!SUPPORTED_LOCALES2.has(locale)) throw new Error("KAP_LOCALE_UNSUPPORTED");
  const surfaceContext = compactObject(typeof input === "string" ? {} : input.surfaceContext, [
    "surfaceType",
    "articleSlug",
    "bookCode",
    "nodeCode"
  ]);
  const sessionRef = canonicalText(typeof input === "string" ? "" : input.sessionRef).slice(0, 128) || null;
  const requestContract = typeof input === "string" ? null : input.requestContract || null;
  const retrievalScope = normalizeAtlasRetrievalScope(requestContract?.retrievalScope?.atlasScope || (typeof input === "string" ? null : input.retrievalScope)) || normalizeFormationScope(requestContract?.retrievalScope?.structuredScope);
  return {
    schemaVersion: "PHI-OS-KAP-QUESTION-INTAKE-v1.0.0",
    capability: "ASK_PHIOS",
    question: {
      originalText: String(rawQuestion ?? ""),
      canonicalText: question
    },
    locale,
    sessionRef,
    surfaceContext,
    ...retrievalScope ? { retrievalScope } : {},
    ...requestContract ? { requestContract } : {},
    governance: {
      createsCanonicalKnowledge: false,
      createsPublication: false,
      createsRealityReading: false,
      createsPersistentCase: false,
      requiresBirthInput: false,
      requiresMethodExecution: false
    }
  };
}
function questionTypeFor(text5, locale) {
  const v = searchText(text5);
  if (locale === "zh-Hans") {
    if (/为什么|为何/.test(v)) return "CAUSAL";
    if (/如何|怎么|怎样/.test(v)) return "HOW";
    if (/什么是|何谓|是什么意思/.test(v)) return "DEFINITION";
    if (/区别|差异|比较|不同/.test(v)) return "COMPARISON";
  } else {
    if (/\bwhy\b/.test(v)) return "CAUSAL";
    if (/\bhow\b/.test(v)) return "HOW";
    if (/\bwhat is\b|\bwhat does\b.*\bmean\b/.test(v)) return "DEFINITION";
    if (/\bdifference\b|\bcompare\b|\bversus\b|\bvs\b/.test(v)) return "COMPARISON";
  }
  return "OTHER";
}
function subjectHintFor(text5, locale) {
  const v = searchText(text5);
  if (locale === "zh-Hans") {
    if (/我|我的|我们|自己/.test(v)) return "SELF";
    if (/团队|公司|组织|家庭|伴侣|关系/.test(v)) return "GROUP_OR_RELATIONSHIP";
  } else {
    if (/\b(i|me|my|mine|myself)\b/.test(v)) return "SELF";
    if (/\b(team|company|organization|family|partner|relationship)\b/.test(v)) return "GROUP_OR_RELATIONSHIP";
  }
  return "GENERAL";
}
function timeScopeFor(text5, locale) {
  const v = searchText(text5);
  if (locale === "zh-Hans") {
    if (/最近|近期|这几天|这段时间/.test(v)) return "RECENT";
    if (/长期|一直|多年|这些年/.test(v)) return "LONG_TERM";
  } else {
    if (/\brecent(ly)?\b|\blately\b|\bthese days\b/.test(v)) return "RECENT";
    if (/\blong[- ]term\b|\bfor years\b|\balways\b/.test(v)) return "LONG_TERM";
  }
  return "UNSPECIFIED";
}
function normalizeKapQuestion(intake) {
  if (!intake?.question?.canonicalText) throw new Error("KAP_INTAKE_REQUIRED");
  const text5 = canonicalText(intake.question.canonicalText);
  return {
    schemaVersion: "PHI-OS-KAP-NORMALIZED-QUESTION-v1.0.0",
    capability: "ASK_PHIOS",
    locale: intake.locale,
    originalText: intake.question.originalText,
    canonicalText: text5,
    searchText: searchText(text5),
    tokens: queryTerms(text5),
    hints: {
      intent: "UNDERSTAND_KNOWLEDGE",
      questionType: questionTypeFor(text5, intake.locale),
      subject: subjectHintFor(text5, intake.locale),
      timeScope: timeScopeFor(text5, intake.locale),
      containsPersonalContextHint: subjectHintFor(text5, intake.locale) !== "GENERAL"
    },
    authority: {
      hintsAreMeaningAuthority: false,
      hintsAreRealityEvidence: false,
      normalizationCreatesKnowledge: false,
      normalizationCreatesReading: false
    }
  };
}
function buildKapRetrievalRequest(normalized2, options = {}) {
  if (!normalized2?.canonicalText) throw new Error("KAP_NORMALIZED_QUESTION_REQUIRED");
  const source = options.source || DEFAULT_SOURCE_MODE;
  const mode = options.mode || DEFAULT_RETRIEVAL_MODE;
  return {
    authority: "KSAR_KNOWLEDGE_ACCESS",
    endpoint: "/api/knowledge-access",
    method: "GET",
    params: {
      q: normalized2.canonicalText,
      locale: normalized2.locale,
      mode,
      source
    },
    governance: {
      directCanonicalRegistryScanAllowed: false,
      rawFullBookRequested: false,
      answerCompositionRequested: false,
      aiRequested: false,
      publicationRequested: false,
      realityReadingRequested: false
    }
  };
}
async function retrievePublishedBookSources({ env, bookCode, locale = "zh-Hans", question = "" }) {
  const empty = { sources: [], articles: [], chain: [] };
  if (bookCode !== "BOOK-5" || !env?.ASSETS?.fetch) return empty;
  const read = async (path2) => {
    const r = await env.ASSETS.fetch(new Request("https://assets.local" + path2));
    if (!r.ok) throw Error("BOOK_SOURCE_UNAVAILABLE");
    return r.json();
  };
  const manifest = await read("/content/knowledge/public/successors/book5-publication-v1/visual-article-release.json");
  const rows3 = manifest.records.filter((r) => r.locale === locale && r.status === "published");
  const text5 = searchText(question);
  const years = new Set(text5.match(/\b\d{3,4}\b/g) || text5.match(/\d{3,4}/g) || []);
  const explicitSnapshots = manifest.atlasDiscovery.filter((r) => r.locale === locale && /^WS-\d+$/.test(r.slug) && years.has(r.slug.slice(3)));
  const terms3 = unique3([...text5.match(/[a-z0-9]{3,}/g) || [], ...(text5.match(/[\u3400-\u9fff]+/g) || []).flatMap((run) => Array.from({ length: Math.max(0, run.length - 1) }, (_, i) => run.slice(i, i + 2)))]).filter((t) => !["\u4E3A\u4EC0\u4E48", "\u4E3A\u4EC0", "\u4EC0\u4E48", "\u6587\u660E", "\u4E0D\u80FD", "\u4E0D\u662F", "\u6CA1\u6709", "\u4EE5\u540E", "\u4E4B\u540E", "\u7B80\u5355", "\u7406\u89E3", "\u540C\u4E00", "\u4E0D\u540C", "\u6240\u6709", "\u4E00\u79CD", "\u5F62\u6210", "\u600E\u4E48", "\u5982\u4F55", "\u4E3A\u4F55", "\u53EF\u4EE5", "\u4E16\u754C", "\u4E00\u4E2A", "\u540E\u6765", "the", "why", "how", "and", "does", "did", "was", "were"].includes(t));
  const weights = new Map(terms3.map((t) => [t, Math.log(1 + rows3.length / (1 + rows3.filter((r) => searchText(r.searchText).includes(t)).length))]));
  const rank = (value) => terms3.reduce((sum, t) => sum + (searchText(value).includes(t) ? weights.get(t) : 0), 0);
  const ranked = rows3.map((r) => ({ ...r, score: rank(r.title) * 3 + rank(r.searchText) + (r.searchAliases || []).filter((alias) => text5.includes(searchText(alias))).reduce((n, alias) => n + alias.length * 2, 0) })).filter((r) => r.score > 0 && (!explicitSnapshots.length || r.connections.relatedAtlasEntries.some((link) => explicitSnapshots.some((s) => link.href.includes("snapshot=" + s.slug))))).sort((a, b) => b.score - a.score).slice(0, 3);
  if (!ranked.length) return empty;
  while (ranked.length > 1 && ranked.at(-1).score < ranked[0].score * 0.55) ranked.pop();
  const anchors = terms3.filter((t) => searchText(ranked[0].title).includes(t) && rows3.filter((r) => searchText(r.searchText).includes(t)).length <= 2);
  const onTopic = (value) => !anchors.length || anchors.some((t) => searchText(value).includes(t));
  const articles = await Promise.all(ranked.map((r) => resolveSelectedArticle(env, r.slug, locale)));
  const valid = articles.filter(Boolean), sources = valid.flatMap((a, i) => {
    const relevant = a.sources.filter((s) => onTopic(s.text));
    return i === 0 && !relevant.length ? a.sources : relevant;
  });
  sources.sort((a, b) => rank(b.text) - rank(a.text));
  for (const article of valid.slice(0, 2)) {
    if (!article.sourceReading?.path?.startsWith("/content/knowledge/public/successors/book5-publication-v1/source-readings/")) continue;
    const source = await read(article.sourceReading.path);
    const paragraphs = source.pages.flatMap((p) => p.paragraphs.flatMap((text6) => (text6.match(/[^。！？.!?]+[。！？.!?]?/gu) || []).filter((text7) => text7.trim().length > 20 && onTopic(text7)).map((text7) => ({ text: text7, page: p.page }))));
    paragraphs.sort((a, b) => rank(b.text) - rank(a.text));
    for (const [i, p] of paragraphs.slice(0, 2).entries()) sources.push({ sourceId: `MANUSCRIPT:${article.slug}:${p.page}:${i}`, sourceType: "COMPLETED_MANUSCRIPT", authorityClass: "COMPLETED_MANUSCRIPT", bookCode: "BOOK-5", partCode: "PART-12", nodeCode: article.nodeCode, title: article.title, locale: "zh-Hans", text: p.text.slice(0, 2500), href: article.href + "#article-body", scopeMatch: true, selected: true, sourcePdfSha256: source.sourcePdfSha256 });
  }
  const links = [...new Map([...explicitSnapshots.map((r) => ({ href: r.href, label: r.title })), ...valid.flatMap((a) => a.atlasLinks)].map((link) => [link.href, link])).values()].slice(0, 6);
  for (const link of links) {
    const u = new URL(link.href, "https://assets.local");
    const scope = { bookCode: "BOOK-5", partCode: "PART-12", activeLayer: u.searchParams.get("atlas"), primaryCaseId: u.searchParams.get("case"), snapshotId: u.searchParams.get("snapshot"), transitionWindowId: u.searchParams.get("tw"), lossTypeId: u.searchParams.get("lossType"), comparisonFamilyId: u.searchParams.get("family"), trajectoryIds: (u.searchParams.get("trajectories") || "").split(",").filter(Boolean) };
    const related = await retrieveAtlasScope({ env, scope, locale, question });
    const deep = atlasUrlFromState("/books/reality-differentiation/", scope);
    sources.push(...related.sources.map((s) => {
      const explicit = explicitSnapshots.find((r) => r.slug === s.atlasEntityId);
      return { ...s, ...explicit ? { text: explicit.title + "\uFF1A" + explicit.summary, explicitQuestionEntity: true } : {}, href: deep.pathname + deep.search + deep.hash, title: link.label };
    }));
  }
  const ordered = sources.map((s, i) => ({ ...s, selected: true, selectedRelevanceRank: i, retrievalTier: s.explicitQuestionEntity ? 0 : s.sourceType === "PUBLISHED_CANONICAL_ARTICLE" ? explicitSnapshots.length || s.articleSlug !== ranked[0].slug ? 1 : 0 : s.sourceType === "COMPLETED_MANUSCRIPT" ? 1 : 2 })).sort((a, b) => a.retrievalTier - b.retrievalTier);
  return { sources: ordered, articles: ranked.map((r) => ({ nodeCode: r.nodeCode, slug: r.slug, title: r.title, href: r.href, score: r.score, bookCode: "BOOK-5" })), chain: [...explicitSnapshots.length ? [{ stage: "EXPLICIT_SNAPSHOT", status: "QUESTION_IDENTIFIED", count: explicitSnapshots.length }] : [], { stage: "BOOK_ARTICLE", status: "MATCHED", count: valid.length }, { stage: "FINAL_MANUSCRIPT", status: "SOURCE_GROUNDED" }, { stage: "RELATED_ATLAS", status: links.length ? "RELATED_ENTITIES" : "NO_EXPLICIT_RELATION" }, { stage: "BROADER_KNOWLEDGE", status: "FALLBACK" }] };
}
async function retrieveKapKnowledge({ request, env = {}, normalized: normalized2, options = {} }) {
  const retrievalRequest = buildKapRetrievalRequest(normalized2, options);
  const baseUrl = request?.url || "https://kap.local/";
  const url = new URL("/api/knowledge-access", baseUrl);
  url.search = new URLSearchParams(retrievalRequest.params).toString();
  const response2 = await handleKnowledgeAccessRequest(new Request(url, { method: "GET" }), env, { retrievalScope: options.retrievalScope });
  const payload = await response2.json();
  if (options.selectedArticle) {
    const selected = await resolveSelectedArticle(env, options.selectedArticle, normalized2.locale);
    if (!selected) throw Object.assign(new Error("SELECTED_SOURCE_UNAVAILABLE"), { status: 422 });
    const terms3 = relevanceTerms(normalized2.tokens);
    const fragments = selected.sources.flatMap((source) => (source.text.match(/[^。！？.!?]+[。！？.!?]?/gu) || []).filter((text5) => text5.trim().length > 15).map((text5, i) => ({ ...source, text: text5.trim(), sourceId: source.sourceId + ":S" + i, fragmentCode: source.fragmentCode + "-S" + i })));
    const rank = (s) => terms3.filter((term) => searchText(s.text).includes(term)).length;
    fragments.sort((a, b) => rank(b) - rank(a));
    payload.answerGrounding = { sources: fragments.map((s, i) => ({ ...s, selectedRelevanceRank: i })) };
    payload.published = { ...payload.published || {}, results: (payload.published?.results || []).filter((r) => r.slug === selected.slug) };
    payload.manuscript = { status: "not_requested", records: [], errors: [] };
  }
  if (options.selectedBook === "BOOK-5" && !options.selectedArticle && options.retrievalScope?.scopeType !== "CIVILIZATION_ATLAS") {
    const selected = await retrievePublishedBookSources({ env, bookCode: "BOOK-5", locale: normalized2.locale, question: normalized2.originalQuestion || normalized2.searchText });
    if (selected.sources.length) {
      payload.answerGrounding = { ...payload.answerGrounding || {}, sources: [...selected.sources, ...payload.answerGrounding?.sources || []] };
      payload.published = { ...payload.published || {}, results: [...selected.articles, ...payload.published?.results || []] };
      payload.retrievalChain = [...selected.chain, ...payload.retrievalChain || []];
    }
  }
  const formation = await retrieveFormationScope({ env, scope: options.retrievalScope, locale: normalized2.locale });
  if (options.retrievalScope?.scopeType === "STRUCTURED_KNOWLEDGE") {
    const intent = classifyStructuredIntent(normalized2.searchText || normalized2.originalQuestion || normalized2.question);
    formation.sources = formation.sources.filter((s) => structuredIntentRelevant(intent, { ...s, structuredTags: s.structuredTags || s.text }));
    payload.answerGrounding = { ...payload.answerGrounding || {}, sources: (payload.answerGrounding?.sources || []).filter((s) => formation.sources.length && formation.nodeCodes.includes(s.nodeCode)) };
  }
  if (formation.sources.length) {
    const existing = payload.answerGrounding?.sources || [];
    const scoped = existing.filter((s) => formation.nodeCodes.includes(s.nodeCode));
    const broader = existing.filter((s) => !formation.nodeCodes.includes(s.nodeCode));
    payload.answerGrounding = { ...payload.answerGrounding || {}, sources: [...formation.sources, ...scoped, ...broader] };
    payload.retrievalChain = [...formation.chain, ...payload.retrievalChain || []];
  }
  if (!response2.ok || !payload?.ok) {
    return {
      ok: false,
      status: response2.status,
      error: payload?.error || { code: "KAP_KNOWLEDGE_RETRIEVAL_FAILED" },
      retrievalRequest,
      upstreamGroundedAnswerConsumed: false
    };
  }
  return {
    ok: true,
    status: response2.status,
    authority: "KSAR_KNOWLEDGE_ACCESS",
    retrievalRequest,
    query: payload.query,
    coverage: payload.coverage,
    published: payload.published ? {
      coverage: payload.published.coverage,
      results: payload.published.results || [],
      projection: payload.published.projection,
      readingPath: payload.published.readingPath,
      indexDigest: payload.published.indexDigest
    } : null,
    manuscript: payload.manuscript || { status: "not_requested", records: [], errors: [] },
    groundingSources: payload.answerGrounding?.sources || [],
    retrievalScope: payload.retrievalScope || null,
    retrievalChain: payload.retrievalChain || [],
    authorityBoundary: payload.authorityBoundary || {},
    upstreamGroundedAnswerPresent: Boolean(payload.groundedAnswer),
    upstreamGroundedAnswerConsumed: false,
    governance: {
      rawFullBookAvailable: payload.manuscript?.exposure?.rawFullBookAvailable === true,
      rawSectionBodyAvailable: payload.manuscript?.exposure?.rawSectionBodyAvailable === true,
      answerComposedByKapPhase2: false,
      canonicalAuthorityCreated: false
    }
  };
}
function deriveKapNodeMatches(retrieval) {
  if (!retrieval?.ok) return {
    primaryNodes: [],
    supportingNodes: [],
    matchedNodeCodes: [],
    pendingManuscriptSections: [],
    canonicalAuthorityCreated: false
  };
  const byCode = /* @__PURE__ */ new Map();
  const pendingManuscriptSections = [];
  for (const [index, result] of (retrieval.published?.results || []).entries()) {
    const record = byCode.get(result.nodeCode) || {
      nodeCode: result.nodeCode,
      title: result.title || null,
      score: Number(result.score || 0),
      sources: [],
      published: true,
      approvedManuscriptBinding: false,
      relationshipExpansionEligible: true
    };
    record.score = Math.max(record.score, Number(result.score || 0));
    record.sources.push({ sourceType: "PUBLISHED_RETRIEVAL", rank: index + 1, href: result.href || null });
    byCode.set(result.nodeCode, record);
  }
  for (const record of retrieval.manuscript?.records || []) {
    const binding = record.canonicalBinding || { status: "PENDING", nodeCodes: [] };
    if (binding.status !== "APPROVED" || !Array.isArray(binding.nodeCodes) || !binding.nodeCodes.length) {
      pendingManuscriptSections.push({ sectionCode: record.sectionCode, canonicalBindingStatus: binding.status || "PENDING" });
      continue;
    }
    for (const nodeCode of binding.nodeCodes) {
      const node = byCode.get(nodeCode) || {
        nodeCode,
        title: null,
        score: Number(record.score || 0),
        sources: [],
        published: false,
        approvedManuscriptBinding: true,
        relationshipExpansionEligible: false
      };
      node.score = Math.max(node.score, Number(record.score || 0));
      node.approvedManuscriptBinding = true;
      node.sources.push({ sourceType: "APPROVED_MANUSCRIPT_BINDING", sectionCode: record.sectionCode, mappingCodes: binding.mappingCodes || [] });
      byCode.set(nodeCode, node);
    }
  }
  const ranked = [...byCode.values()].sort((a, b) => b.score - a.score || Number(b.published) - Number(a.published) || a.nodeCode.localeCompare(b.nodeCode)).slice(0, MAX_NODE_MATCHES);
  return {
    primaryNodes: ranked.length ? [{ ...ranked[0], matchRole: "PRIMARY" }] : [],
    supportingNodes: ranked.slice(1).map((node) => ({ ...node, matchRole: "SUPPORTING" })),
    matchedNodeCodes: ranked.map((node) => node.nodeCode),
    pendingManuscriptSections,
    canonicalAuthorityCreated: false,
    automaticSemanticBindingUsed: false
  };
}
function expandKapRelationships({ nodeMatches, relationshipRecords = [], mechanismExpansions = [], locale, limits = {} }) {
  const maxRelationships = Math.min(Number(limits.maximumRelationships || MAX_RELATIONSHIPS), MAX_RELATIONSHIPS);
  const maxFacets = Math.min(Number(limits.maximumMechanismFacets || MAX_MECHANISM_FACETS), MAX_MECHANISM_FACETS);
  const eligibleSourceNodes = new Set([
    ...nodeMatches?.primaryNodes || [],
    ...nodeMatches?.supportingNodes || []
  ].filter((node) => node.relationshipExpansionEligible && node.published).map((node) => node.nodeCode));
  const selectedRelationships = relationshipRecords.filter((row) => row.locale === locale && eligibleSourceNodes.has(row.sourceNodeCode)).slice(0, maxRelationships);
  const relatedPublishedNodes = unique3(selectedRelationships.filter((row) => row.targetPublished).map((row) => row.targetNodeCode));
  const blockedContinuations = selectedRelationships.filter((row) => !row.targetPublished).map((row) => ({
    relationshipCode: row.relationshipCode,
    sourceNodeCode: row.sourceNodeCode,
    targetNodeCode: row.targetNodeCode,
    type: row.type,
    reason: "TARGET_NOT_PUBLISHED_IN_REQUESTED_LOCALE",
    groundingEligible: false
  }));
  const mechanismFacets = [];
  for (const expansion of mechanismExpansions) {
    if (expansion.locale !== locale || !eligibleSourceNodes.has(expansion.nodeCode)) continue;
    if (expansion.providerUsed || expansion.unsupportedInferenceAllowed) continue;
    for (const facet of expansion.mechanismFacets || []) {
      mechanismFacets.push({
        nodeCode: expansion.nodeCode,
        facetCode: facet.facetCode,
        facetKind: facet.facetKind,
        evidenceMode: facet.evidenceMode,
        evidenceFragmentCodes: facet.evidenceFragmentCodes || [],
        groundingEligible: true
      });
      if (mechanismFacets.length >= maxFacets) break;
    }
    if (mechanismFacets.length >= maxFacets) break;
  }
  return {
    depth: 1,
    authority: "PUBLISHED_GRAPH_ONLY_WITH_CONTROLLED_EVIDENCE_BACKED_MECHANISM_FACETS",
    relatedPublishedNodes,
    relationships: selectedRelationships.filter((row) => row.targetPublished).map((row) => ({ ...row, groundingEligible: true })),
    blockedContinuations,
    mechanismFacets,
    providerUsed: false,
    unsupportedInferenceUsed: false,
    unpublishedTargetContentInjected: false,
    transitiveExpansionUsed: false
  };
}
async function readAssetJson2(env, path2) {
  if (!env?.ASSETS?.fetch) return null;
  const response2 = await env.ASSETS.fetch(new Request(`https://assets.local/${path2}`));
  if (!response2.ok) return null;
  return response2.json();
}
async function loadKapRelationshipAuthority(env = {}) {
  const [relationships, expansions] = await Promise.all([
    readAssetJson2(env, "content/knowledge/public/retrieval/relationships.json"),
    readAssetJson2(env, "content/knowledge/intelligence/expansion/relationship-mechanism-expansion.json")
  ]);
  return {
    relationshipRecords: relationships?.records || [],
    mechanismExpansions: expansions?.records || [],
    relationshipProjectionDigest: relationships?.digest || null,
    mechanismExpansionDigest: expansions?.digest || null
  };
}
function groundingSourceId(source) {
  if (source.sourceId) return source.sourceId;
  if (source.sourceType === "PUBLISHED_CANONICAL_ARTICLE") return `PUBLISHED:${source.nodeCode}:${source.fragmentCode}`;
  return `MANUSCRIPT:${source.sectionCode}`;
}
function buildKnowledgeGroundingBundle({ intake, normalized: normalized2, retrieval, nodeMatches, expansion }) {
  const rawSources = (retrieval?.groundingSources || []).map((source) => ({
    sourceId: groundingSourceId(source),
    ...source
  }));
  const sources = filterPtrcSourcesByPolicy(rawSources, intake?.requestContract || null).filter((source) => !(intake?.retrievalScope?.bookCode === "BOOK-5" && source?.sourceType === "COMPLETED_MANUSCRIPT" && source?.bookCode === "BOOK-5"));
  const unknowns = [];
  if (intake?.retrievalScope?.bookCode === "BOOK-5") {
    unknowns.push({ code: "BOOK_V_MANUSCRIPT_SOURCE_UNAVAILABLE" });
    unknowns.push({ code: "BOOK_V_PRODUCTION_ARTICLE_BODY_UNAVAILABLE" });
  }
  for (const item of nodeMatches?.pendingManuscriptSections || []) unknowns.push({ code: "CANONICAL_BINDING_PENDING", ...item });
  for (const item of expansion?.blockedContinuations || []) unknowns.push({
    code: "RELATED_TARGET_NOT_PUBLISHED",
    targetNodeCode: item.targetNodeCode,
    relationshipCode: item.relationshipCode
  });
  for (const error of retrieval?.manuscript?.errors || []) unknowns.push({ code: error });
  if (!sources.length) unknowns.push({ code: "NO_GROUNDED_SOURCE_MATCH" });
  const key = `${normalized2.locale}|${normalized2.searchText}|${sources.map((source) => source.sourceId).join("|")}`;
  return {
    schemaVersion: "PHI-OS-KNOWLEDGE-GROUNDING-BUNDLE-v1.0.0",
    objectType: "KnowledgeGroundingBundle",
    bundleId: `KGB-v1-${stableHash(key)}`,
    authorityClass: "GROUNDED_NON_AUTHORITATIVE_INPUT",
    question: {
      capability: intake.capability,
      text: normalized2.canonicalText,
      locale: normalized2.locale
    },
    normalization: {
      searchText: normalized2.searchText,
      tokens: normalized2.tokens,
      hints: normalized2.hints,
      hintsAreMeaningAuthority: false
    },
    retrieval: {
      authority: retrieval?.authority || "KSAR_KNOWLEDGE_ACCESS",
      sourceMode: retrieval?.retrievalRequest?.params?.source || DEFAULT_SOURCE_MODE,
      upstreamCoverage: retrieval?.coverage || null,
      upstreamGroundedAnswerPresent: Boolean(retrieval?.upstreamGroundedAnswerPresent),
      upstreamGroundedAnswerConsumed: false
    },
    ...intake.retrievalScope ? { retrievalScope: intake.retrievalScope } : {},
    retrievalScope: intake.retrievalScope || null,
    requestContract: intake.requestContract || null,
    retrievalChain: retrieval?.retrievalChain || [],
    nodeMatches: {
      primaryNodes: nodeMatches?.primaryNodes || [],
      supportingNodes: nodeMatches?.supportingNodes || [],
      relatedPublishedNodeCodes: expansion?.relatedPublishedNodes || [],
      canonicalAuthorityCreated: false,
      automaticSemanticBindingUsed: false
    },
    relationships: expansion || {
      depth: 0,
      relationships: [],
      blockedContinuations: [],
      mechanismFacets: [],
      providerUsed: false,
      unsupportedInferenceUsed: false,
      unpublishedTargetContentInjected: false,
      transitiveExpansionUsed: false
    },
    sources,
    unknowns,
    excludedMaterial: [
      "RAW_FULL_BOOK",
      "RAW_SECTION_BODY",
      "UNPUBLISHED_RELATIONSHIP_TARGET_CONTENT",
      "UPSTREAM_GROUNDED_ANSWER_TEXT",
      "CLIENT_REALITY_EVIDENCE",
      "METHOD_CALCULATION_RESULT",
      "AI_GENERATED_KNOWLEDGE"
    ],
    governance: {
      answerComposed: false,
      aiUsed: false,
      canonicalAuthorityCreated: false,
      publicationCreated: false,
      realityReadingCreated: false,
      persistentCaseCreated: false,
      rawFullBookExposed: false,
      unpublishedTargetContentInjected: false
    }
  };
}
function evaluateKapCoverage({ bundle, retrieval, scopeDisposition = "KNOWLEDGE_QUERY" }) {
  const sourceCount = bundle?.sources?.length || 0;
  const publishedLevel = retrieval?.published?.coverage?.level || retrieval?.coverage?.published || "none";
  const manuscriptCount = (retrieval?.manuscript?.records || []).length;
  const questionSourceRelevance = evaluateKapQuestionSourceRelevance(bundle);
  let status;
  const reasonCodes = [];
  if (scopeDisposition === "OUT_OF_SCOPE") {
    status = "OUT_OF_SCOPE";
    reasonCodes.push("EXPLICIT_SCOPE_DISPOSITION_OUT_OF_SCOPE");
  } else if (!sourceCount) {
    status = "INSUFFICIENT_COVERAGE";
    reasonCodes.push("NO_GROUNDED_SOURCE_MATCH");
  } else if (!questionSourceRelevance.established) {
    status = "INSUFFICIENT_COVERAGE";
    reasonCodes.push("QUESTION_SOURCE_RELEVANCE_NOT_ESTABLISHED");
  } else if (["exact", "strong"].includes(publishedLevel)) {
    status = "STRONG_COVERAGE";
    reasonCodes.push("PUBLISHED_MATCH_STRONG_OR_EXACT");
  } else if (retrieval?.coverage?.level === "hybrid" && manuscriptCount > 0 && publishedLevel !== "none" && publishedLevel !== "not_requested") {
    status = "STRONG_COVERAGE";
    reasonCodes.push("HYBRID_GROUNDED_COVERAGE");
  } else {
    status = "PARTIAL_COVERAGE";
    reasonCodes.push(manuscriptCount > 0 ? "MANUSCRIPT_GROUNDING_AVAILABLE" : "LIMITED_PUBLISHED_GROUNDING_AVAILABLE");
  }
  return {
    schemaVersion: "PHI-OS-KAP-COVERAGE-DECISION-v1.0.0",
    status,
    reasonCodes,
    sourceCount,
    publishedCoverage: publishedLevel,
    manuscriptResultCount: manuscriptCount,
    answerCompositionEligible: status === "STRONG_COVERAGE" || status === "PARTIAL_COVERAGE",
    unknownDisclosureRequired: status !== "STRONG_COVERAGE" || Boolean(bundle?.unknowns?.length),
    realityJourneyRequired: false,
    guidedReadingRequired: false,
    aiRequired: false,
    createsAuthority: false
  };
}
async function runKapGroundingPipeline({ input, request, env = {}, retrievalOptions = {}, scopeDisposition = "KNOWLEDGE_QUERY" }) {
  const intake = createKapQuestionIntake(input);
  const normalized2 = normalizeKapQuestion(intake);
  const retrieval = await retrieveKapKnowledge({ request, env, normalized: normalized2, options: { ...retrievalOptions, retrievalScope: intake.retrievalScope, selectedArticle: intake.surfaceContext?.articleSlug, selectedBook: intake.surfaceContext?.bookCode } });
  const nodeMatches = deriveKapNodeMatches(retrieval);
  const relationshipAuthority = await loadKapRelationshipAuthority(env);
  const expansion = expandKapRelationships({ nodeMatches, locale: normalized2.locale, ...relationshipAuthority });
  const groundingBundle = buildKnowledgeGroundingBundle({ intake, normalized: normalized2, retrieval, nodeMatches, expansion });
  const legacyCoverageDecision = evaluateKapCoverage({ bundle: groundingBundle, retrieval, scopeDisposition });
  const ptrcQuality = intake.requestContract ? evaluatePtrcKnowledgeQuality({ bundle: groundingBundle, contract: intake.requestContract }) : null;
  const coverageDecision = ptrcQuality ? applyPtrcQualityToCoverage(legacyCoverageDecision, ptrcQuality) : legacyCoverageDecision;
  return {
    phase: "KAP-W4-W10",
    answerCompositionPerformed: false,
    intake,
    normalized: normalized2,
    retrieval,
    nodeMatches,
    relationshipExpansion: expansion,
    groundingBundle,
    ptrcQuality,
    coverageDecision
  };
}
var KAP_GROUNDING_LIMITS = Object.freeze({
  maximumQueryLength: MAX_QUERY_LENGTH3,
  maximumNodeMatches: MAX_NODE_MATCHES,
  maximumRelationships: MAX_RELATIONSHIPS,
  maximumMechanismFacets: MAX_MECHANISM_FACETS
});

// functions/_lib/ptrc-ask-contract.js
var CONTRACT_SCHEMA = "PHI-OS-PTRC-ASK-REQUEST-v1.0.0";
var TRACE_SCHEMA = "PHI-OS-PTRC-ASK-TRACE-v1.0.0";
var INTENTS = /* @__PURE__ */ new Set(["DEFINE", "EXPLAIN", "COMPARE", "TRACE", "CALCULATE", "NAVIGATE", "REPORT", "CLARIFY"]);
var LOCALES3 = /* @__PURE__ */ new Set(["zh-Hans", "en"]);
var questionText = (value) => String(value ?? "").trim().replace(/\s+/g, " ");
var clean11 = (value) => questionText(value).normalize("NFKC");
var object = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
var unique4 = (items, max = 24) => [...new Set((Array.isArray(items) ? items : []).map(clean11).filter(Boolean))].slice(0, max);
var scalar2 = (value, max = 160) => clean11(value).slice(0, max) || null;
function freeze4(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) freeze4(item);
  }
  return value;
}
function hash2(value) {
  let result = 2166136261;
  for (const char of String(value)) {
    result ^= char.codePointAt(0);
    result = Math.imul(result, 16777619) >>> 0;
  }
  return result.toString(16).padStart(8, "0");
}
function redact(value) {
  return clean11(value).replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]").replace(/(?:\+?\d[\s().-]*){8,}/g, "[phone]").replace(/\b\d{6,}\b/g, "[number]");
}
function classifyPtrcIntent(question, locale = "zh-Hans") {
  const q = clean11(question).toLocaleLowerCase();
  if (!q) return "CLARIFY";
  if (locale === "zh-Hans") {
    if (/(?:计算|算出|多少|利率|回报率|复利|现金流|净值|退休|负债比|预算)/.test(q)) return "CALCULATE";
    if (/(?:报告|生成报告|导出|汇总报告|遗嘱|will report)/i.test(q)) return "REPORT";
    if (/(?:比较|区别|差异|不同|vs\.?|对比)/i.test(q)) return "COMPARE";
    if (/(?:追踪|演变|发展过程|历史路径|时间线|从.+到|如何形成|怎样形成)/.test(q)) return "TRACE";
    if (/(?:去哪里|哪个页面|打开|带我到|怎么进入|导航|下一步|怎么办|应该怎么做)/.test(q)) return "NAVIGATE";
    if (/(?:什么是|何谓|是什么意思|定义)/.test(q)) return "DEFINE";
    if (q.length < 4 || /^(?:这个|那个|它|什么意思|哪一个)[？?]?$/.test(q)) return "CLARIFY";
    return "EXPLAIN";
  }
  if (/\b(calculate|how much|compound|interest rate|cash flow|net worth|retirement|afford|ratio|budget)\b/.test(q)) return "CALCULATE";
  if (/\b(report|export|generate a report|will report|estate report)\b/.test(q)) return "REPORT";
  if (/\b(compare|difference|different|versus|vs\.?|contrast)\b/.test(q)) return "COMPARE";
  if (/\b(trace|timeline|evolve|evolution|history of|development of|from .+ to|how did .+ form)\b/.test(q)) return "TRACE";
  if (/\b(where do i|which page|open|take me|navigate|next step|what should i do|how should i)\b/.test(q)) return "NAVIGATE";
  if (/\b(what is|what are|define|meaning of|what does .+ mean)\b/.test(q)) return "DEFINE";
  if (q.length < 4 || /^(this|that|it|which one|what)\??$/.test(q)) return "CLARIFY";
  return "EXPLAIN";
}
function atlasEntityIds(scope = {}) {
  return unique4([
    scope.timeWindowId,
    scope.snapshotId,
    scope.primaryCaseId,
    scope.comparisonFamilyId,
    scope.transitionWindowId,
    scope.lossFamilyId,
    scope.lossTypeId,
    scope.entityId,
    scope.windowId,
    scope.dossierId,
    scope.livedRealityDimensionId,
    scope.sectionId,
    ...scope.regionIds || [],
    ...scope.caseIds || [],
    ...scope.trajectoryIds || [],
    ...scope.comparisonIds || []
  ]);
}
function normalizePtrcRetrievalScope(input = {}, entryContext = {}) {
  const raw = object(input);
  const entry = object(entryContext);
  const atlas = object(raw.atlasScope || entry.retrievalScope);
  const atlasType = String(atlas.scopeType || "").toUpperCase();
  const atlasBook = String(atlas.bookCode || "").toUpperCase();
  const atlasActive = atlasType === "CIVILIZATION_ATLAS" || atlasType === "CIVILIZATION_RECONFIGURATION_ATLAS" || atlasBook === "BOOK-5" || atlasBook === "BOOK-6";
  const reconfigurationAtlas = atlasType === "CIVILIZATION_RECONFIGURATION_ATLAS" || atlasBook === "BOOK-6";
  const parts = unique4(raw.partIds);
  const articleIds = unique4(raw.articleIds);
  const knowledgeNodeIds = unique4(raw.knowledgeNodeIds);
  const atlasIds = unique4(raw.atlasEntityIds);
  const atlasLayers = unique4(raw.atlasLayers).map((x) => x.toLowerCase());
  if (entry.partCode && !parts.includes(entry.partCode)) parts.push(clean11(entry.partCode));
  if (entry.articleCode && !articleIds.includes(entry.articleCode)) articleIds.push(clean11(entry.articleCode));
  if (entry.contextId && /^NODE:/i.test(entry.contextId) && !knowledgeNodeIds.includes(entry.contextId.slice(5))) knowledgeNodeIds.push(entry.contextId.slice(5));
  if (atlasActive) {
    for (const id of atlasEntityIds(atlas)) if (!atlasIds.includes(id)) atlasIds.push(id);
    if (atlas.activeLayer && !atlasLayers.includes(String(atlas.activeLayer).toLowerCase())) atlasLayers.push(String(atlas.activeLayer).toLowerCase());
    const ownerPart = reconfigurationAtlas ? "PART-13" : "PART-12";
    if (!parts.includes(ownerPart)) parts.push(ownerPart);
  }
  const allowedCollections = unique4(raw.allowedCollections);
  if (atlasActive && !allowedCollections.includes("CIVILIZATION_ATLAS")) allowedCollections.push("CIVILIZATION_ATLAS");
  if (!allowedCollections.length) allowedCollections.push("GOVERNED_KNOWLEDGE");
  return freeze4({
    atlasEntityIds: atlasIds,
    atlasLayers,
    partIds: parts,
    knowledgeNodeIds,
    articleIds,
    timeScope: raw.timeScope ?? (atlas.timeWindowId || atlas.time || null),
    jurisdiction: scalar2(raw.jurisdiction, 80),
    allowedCollections,
    atlasScope: atlasActive ? freeze4({ ...atlas }) : null,
    structuredScope: normalizeFormationScope(raw.structuredScope || entry.retrievalScope)
  });
}
function createPtrcAskRequestContract(payload = {}) {
  const body = object(payload);
  const question = questionText(body.question ?? body.q);
  if (!question) throw Object.assign(new Error("PTRC_QUESTION_REQUIRED"), { status: 400 });
  if (question.length > 500) throw Object.assign(new Error("PTRC_QUESTION_TOO_LONG"), { status: 400 });
  const locale = LOCALES3.has(body.locale) ? body.locale : "zh-Hans";
  const explicitIntent = String(body.intent || "").toUpperCase();
  const intent = INTENTS.has(explicitIntent) ? explicitIntent : classifyPtrcIntent(question, locale);
  const entry = object(body.entryContext);
  const rawScope = body.retrievalScope || entry.retrievalScope || {};
  const retrievalScope = normalizePtrcRetrievalScope(rawScope, entry);
  const policy = object(body.answerPolicy);
  const minimumEvidence = Number.isFinite(Number(policy.minimumEvidence)) ? Math.max(1, Math.min(8, Math.trunc(Number(policy.minimumEvidence)))) : 2;
  return freeze4({
    schemaVersion: CONTRACT_SCHEMA,
    question,
    locale,
    intent,
    retrievalScope,
    answerPolicy: {
      citationRequired: policy.citationRequired !== false,
      minimumEvidence,
      allowBroaderKnowledge: policy.allowBroaderKnowledge !== false
    }
  });
}
function createPtrcAskTrace({ contract, route = "UNRESOLVED", retrievalStages = [], gateResult = null, answerMode = "UNRESOLVED" } = {}) {
  if (contract?.schemaVersion !== CONTRACT_SCHEMA) throw new Error("PTRC_REQUEST_CONTRACT_REQUIRED");
  const redacted = redact(contract.question);
  return freeze4({
    schemaVersion: TRACE_SCHEMA,
    request: {
      normalizedQuestion: redacted,
      questionHash: hash2(contract.question),
      questionLength: contract.question.length,
      locale: contract.locale,
      intent: contract.intent,
      retrievalScope: contract.retrievalScope
    },
    route,
    retrievalStages: Array.isArray(retrievalStages) ? retrievalStages : [],
    gateResult: gateResult || null,
    answerMode,
    privacy: { rawUnredactedQuestionPersisted: false, entryContextProseAppendedToQuestion: false, priorAnswerTextAppendedToQuestion: false }
  });
}
var PTRC_ASK_CONTRACT_SCHEMA = CONTRACT_SCHEMA;
var PTRC_ASK_INTENTS = Object.freeze([...INTENTS]);

// functions/_lib/knowledge-answer-composition.js
var DEPTHS = Object.freeze({
  QUICK: Object.freeze({ directSentences: 1, mechanismItems: 1, whyItems: 0, relatedItems: 2, sourceItems: 3 }),
  STANDARD: Object.freeze({ directSentences: 1, mechanismItems: 3, whyItems: 1, relatedItems: 4, sourceItems: 6 }),
  DEEP: Object.freeze({ directSentences: 2, mechanismItems: 4, whyItems: 2, relatedItems: 6, sourceItems: 10 })
});
var DEFAULT_DEPTH = "STANDARD";
var SUPPORTED_DEPTHS = new Set(Object.keys(DEPTHS));
var canonicalText2 = (value) => String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ");
var unique5 = (values) => [...new Set(values.map(canonicalText2).filter(Boolean))];
function stableHash2(value) {
  let hash3 = 2166136261;
  for (const char of String(value)) {
    hash3 ^= char.codePointAt(0);
    hash3 = Math.imul(hash3, 16777619) >>> 0;
  }
  return hash3.toString(16).padStart(8, "0");
}
function splitSentences3(text5) {
  const source = canonicalText2(text5);
  if (!source) return [];
  return unique5(source.match(/(?:[^。！？.!?]|(?<=\d)\.(?=\d))+[。！？.!?]?/g) || [source]);
}
function localeCopy(locale) {
  if (locale === "zh-Hans") {
    return Object.freeze({
      insufficient: "PHI OS \u76EE\u524D\u6CA1\u6709\u8DB3\u591F\u7684\u53D7\u6CBB\u7406\u77E5\u8BC6\u6765\u53EF\u9760\u56DE\u7B54\u8FD9\u4E2A\u95EE\u9898\u3002",
      outOfScope: "\u8FD9\u4E2A\u95EE\u9898\u76EE\u524D\u8D85\u51FA PHI OS \u5DF2\u6CBB\u7406\u7684\u77E5\u8BC6\u8303\u56F4\u3002",
      questionScopedBoundary: "\u8FD9\u662F\u57FA\u4E8E\u53D7\u6CBB\u7406 PHI OS Knowledge \u7684\u95EE\u9898\u8303\u56F4\u56DE\u7B54\uFF0C\u4E0D\u662F Published Article\uFF0C\u4E5F\u4E0D\u662F Reality Reading\u3002",
      personalBoundary: "\u4E00\u822C\u77E5\u8BC6\u673A\u5236\u4E0D\u80FD\u8BC1\u660E\u8FD9\u5C31\u662F\u4F60\u73B0\u5B9E\u91CC\u6B63\u5728\u53D1\u751F\u7684\u60C5\u51B5\uFF1B\u4E2A\u4EBA\u7ED3\u8BBA\u9700\u8981\u989D\u5916\u8BC1\u636E\u3002",
      observe: "\u5982\u679C\u8FD9\u4E2A\u95EE\u9898\u4E0E\u4F60\u672C\u4EBA\u6709\u5173\uFF0C\u53EF\u4EE5\u5148\u89C2\u5BDF\u4E0A\u8FF0\u673A\u5236\u662F\u5426\u771F\u7684\u51FA\u73B0\u5728\u4F60\u7684\u60C5\u5883\u4E2D\uFF0C\u800C\u4E0D\u8981\u628A\u4E00\u822C\u673A\u5236\u76F4\u63A5\u5F53\u4F5C\u4E2A\u4EBA\u7ED3\u8BBA\u3002",
      pendingBinding: "\u6709\u76F8\u5173\u624B\u7A3F\u5185\u5BB9\u4ECD\u5728\u7B49\u5F85 Canonical binding\uFF0C\u56E0\u6B64\u6CA1\u6709\u88AB\u63D0\u5347\u4E3A Canonical Node \u7ED3\u8BBA\u3002",
      unpublishedRelated: "\u5B58\u5728\u76F8\u5173\u77E5\u8BC6\u5173\u7CFB\uFF0C\u4F46\u76EE\u6807\u77E5\u8BC6\u5C1A\u672A\u5728\u5F53\u524D\u8BED\u8A00\u53D1\u5E03\uFF0C\u56E0\u6B64\u6CA1\u6709\u88AB\u6CE8\u5165\u672C\u6B21\u56DE\u7B54\u3002",
      sourceUnavailable: "\u5F53\u524D\u6CA1\u6709\u53EF\u7528\u4E8E\u56DE\u7B54\u7684\u53D7\u6CBB\u7406\u6765\u6E90\u3002",
      bookVManuscriptUnavailable: "\u5F53\u524D\u57FA\u7EBF\u6CA1\u6709\u53EF\u4F9B\u68C0\u7D22\u7684\u7B2C\u4E94\u518C\u6B63\u6587\u624B\u7A3F\u6765\u6E90\uFF1B\u672C\u6B21\u56DE\u7B54\u4E0D\u4F1A\u4F2A\u9020\u7B2C\u4E94\u518C\u6BB5\u843D\u6216\u5F15\u6587\u3002",
      bookVArticleUnavailable: "\u5F53\u524D\u57FA\u7EBF\u6CA1\u6709\u7B2C\u4E94\u518C Production Article \u6B63\u6587\uFF1B\u672C\u6B21\u56DE\u7B54\u53EA\u4F7F\u7528\u5DF2\u6CE8\u518C\u7684\u6587\u660E\u56FE\u8C31\u8BC1\u636E\u4E0E\u5176\u4ED6\u83B7\u51C6\u7684\u53D7\u6CBB\u7406\u77E5\u8BC6\u3002",
      partial: "\u73B0\u6709\u77E5\u8BC6\u53EF\u4EE5\u56DE\u7B54\u4E00\u90E8\u5206\uFF0C\u4F46\u4ECD\u6709\u91CD\u8981\u8FB9\u754C\u6216\u672A\u77E5\u9700\u8981\u4FDD\u7559\u3002"
    });
  }
  return Object.freeze({
    insufficient: "PHI OS does not currently have enough governed knowledge to answer this question reliably.",
    outOfScope: "This question is currently outside the governed PHI OS knowledge scope.",
    questionScopedBoundary: "This is a question-scoped answer grounded in governed PHI OS Knowledge; it is not a Published Article or a Reality Reading.",
    personalBoundary: "A general knowledge mechanism does not establish that it is what is happening in your reality; a personal conclusion requires additional evidence.",
    observe: "If this question is personal, observe whether the mechanisms above are actually present in your situation rather than treating a general mechanism as a personal conclusion.",
    pendingBinding: "Relevant manuscript material still has a pending Canonical binding, so it was not promoted into a Canonical Node claim.",
    unpublishedRelated: "A governed knowledge relationship exists, but the target is not published in this locale and was not injected into this answer.",
    sourceUnavailable: "No governed source is currently available for this answer.",
    bookVManuscriptUnavailable: "This baseline has no retrievable Book V manuscript source; this answer will not fabricate Book V passages or quotations.",
    bookVArticleUnavailable: "This baseline has no Book V Production Article body; the answer uses only registered Civilization Atlas evidence and other permitted governed knowledge.",
    partial: "The available knowledge can answer part of the question, but important boundaries or unknowns remain."
  });
}
function sourcePriority(source) {
  if (source?.sourceType === "CIVILIZATION_ATLAS_ENTITY") return 0;
  if (source?.sourceType === "CIVILIZATION_ATLAS_EVIDENCE") return 1;
  if (source?.sourceType === "PUBLISHED_CANONICAL_ARTICLE") return 0;
  if (source?.sourceType === "COMPLETED_MANUSCRIPT") return 2;
  return 3;
}
function groundedSentences(bundle) {
  return (bundle?.sources || []).slice().sort((a, b) => (a.retrievalTier ?? 3) - (b.retrievalTier ?? 3) || (a.selected === true && b.selected === true ? a.selectedRelevanceRank - b.selectedRelevanceRank : 0) || sourcePriority(a) - sourcePriority(b) || String(a.sourceId).localeCompare(String(b.sourceId))).filter((source) => !/^#{1,6}\s+/.test(canonicalText2(source.text))).flatMap((source) => splitSentences3(source.text).map((text5) => ({ text: text5, source })));
}
function facetBackedSentences(bundle, allSentences) {
  const fragmentCodes = new Set(
    (bundle?.relationships?.mechanismFacets || []).filter((facet) => facet.groundingEligible).flatMap((facet) => facet.evidenceFragmentCodes || [])
  );
  return allSentences.filter((item) => item.source?.fragmentCode && fragmentCodes.has(item.source.fragmentCode));
}
function mapUnknowns(bundle, locale) {
  const copy = localeCopy(locale);
  return unique5((bundle?.unknowns || []).map((item) => {
    switch (item.code) {
      case "CANONICAL_BINDING_PENDING":
        return copy.pendingBinding;
      case "RELATED_TARGET_NOT_PUBLISHED":
        return copy.unpublishedRelated;
      case "NO_GROUNDED_SOURCE_MATCH":
        return copy.sourceUnavailable;
      case "BOOK_V_MANUSCRIPT_SOURCE_UNAVAILABLE":
        return copy.bookVManuscriptUnavailable;
      case "BOOK_V_PRODUCTION_ARTICLE_BODY_UNAVAILABLE":
        return copy.bookVArticleUnavailable;
      default:
        return canonicalText2(item.code).replaceAll("_", " ").toLowerCase();
    }
  }));
}
function relatedKnowledge(bundle, maximum) {
  const candidates = [
    ...(bundle?.nodeMatches?.supportingNodes || []).map((node) => node.title || node.nodeCode),
    ...bundle?.nodeMatches?.relatedPublishedNodeCodes || []
  ];
  return unique5(candidates).slice(0, maximum);
}
function normalizeAnswerDepth(value) {
  const depth = canonicalText2(value || DEFAULT_DEPTH).toUpperCase();
  if (!SUPPORTED_DEPTHS.has(depth)) throw new Error("KAP_ANSWER_DEPTH_UNSUPPORTED");
  return depth;
}
function evaluateKapAiEligibility({ bundle, coverageDecision, depth = DEFAULT_DEPTH }) {
  const normalizedDepth = normalizeAnswerDepth(depth);
  const sourceCount = bundle?.sources?.length || 0;
  const nodeCount = (bundle?.nodeMatches?.primaryNodes?.length || 0) + (bundle?.nodeMatches?.supportingNodes?.length || 0);
  const relationshipCount = bundle?.relationships?.relationships?.length || 0;
  let status = "AI_NOT_REQUIRED";
  const reasonCodes = [];
  if (!coverageDecision?.answerCompositionEligible) {
    reasonCodes.push("NO_COMPOSITION_BENEFIT_WITHOUT_GROUNDED_COVERAGE");
  } else if (normalizedDepth === "DEEP" && (sourceCount > 5 || nodeCount > 3 || relationshipCount > 3)) {
    status = "AI_RECOMMENDED";
    reasonCodes.push("DEEP_MULTI_SOURCE_SYNTHESIS");
  } else if (sourceCount > 3 || nodeCount > 1 || relationshipCount > 1) {
    status = "AI_OPTIONAL";
    reasonCodes.push("MULTI_SOURCE_OR_MULTI_NODE_SYNTHESIS");
  } else {
    reasonCodes.push("DETERMINISTIC_COMPOSITION_SUFFICIENT");
  }
  return {
    schemaVersion: "PHI-OS-KAP-AI-ELIGIBILITY-DECISION-v1.0.0",
    status,
    reasonCodes,
    aiRequired: false,
    aiIsKnowledgeAuthority: false,
    providerInvocationAuthorizedByPhase3: false,
    deterministicFallbackRequired: true
  };
}
function routeKapAiCost({ eligibility }) {
  const requestedTier = eligibility?.status === "AI_RECOMMENDED" ? "TIER_2_ADVANCED_SYNTHESIS" : eligibility?.status === "AI_OPTIONAL" ? "TIER_1_LOW_COST_SYNTHESIS" : "TIER_0_DETERMINISTIC";
  return {
    schemaVersion: "PHI-OS-KAP-AI-COST-ROUTING-v1.0.0",
    requestedTier,
    activeTier: "TIER_0_DETERMINISTIC",
    providerInvoked: false,
    paidProviderRequired: false,
    fallbackReason: requestedTier === "TIER_0_DETERMINISTIC" ? null : "PHASE3_PROVIDER_INVOCATION_NOT_ACTIVATED",
    answerMayStillBeDelivered: true
  };
}
function projectKapSources(bundle, depth = DEFAULT_DEPTH) {
  const profile = DEPTHS[normalizeAnswerDepth(depth)];
  const hrefByNode = /* @__PURE__ */ new Map();
  for (const node of [...bundle?.nodeMatches?.primaryNodes || [], ...bundle?.nodeMatches?.supportingNodes || []]) {
    const href = (node.sources || []).find((source) => source.href)?.href || null;
    if (href) hrefByNode.set(node.nodeCode, href);
  }
  return (bundle?.sources || []).slice(0, profile.sourceItems).map((source) => Object.freeze({
    sourceId: source.sourceId,
    sourceType: source.sourceType,
    title: source.title || null,
    authorityLabel: source.sourceType === "PUBLISHED_CANONICAL_ARTICLE" ? "PUBLISHED_CANONICAL_KNOWLEDGE" : source.sourceType === "REGISTERED_FIGURE_SEMANTICS" ? "GOVERNED_PUBLICATION_FIGURE_SEMANTICS" : source.sourceType === "BOOK6_ACCEPTED_CURRENT_DOSSIER" ? "HUMAN_ACCEPTED_SUBSYSTEM_DOSSIER" : source.sourceType === "BOOK6_UNACCEPTED_DOSSIER_UNKNOWN" ? "UNACCEPTED_DOSSIER_UNKNOWN" : source.sourceType === "BOOK6_VALIDATED_ADMITTED_PROVIDER_EVIDENCE" ? "VALIDATED_ADMITTED_EXTERNAL_EVIDENCE" : source.sourceType?.startsWith("CIVILIZATION_ATLAS_") ? "STRUCTURED_ATLAS_KNOWLEDGE" : "REVIEWED_MANUSCRIPT_KNOWLEDGE",
    nodeCode: source.nodeCode || null,
    fragmentCode: source.fragmentCode || null,
    sectionCode: source.sectionCode || null,
    bookCode: source.bookCode || null,
    partCode: source.partCode || null,
    pageRange: source.pageRange || null,
    href: source.href || (source.nodeCode ? hrefByNode.get(source.nodeCode) || null : null),
    questionScopedExcerpt: canonicalText2(source.text),
    rawFullSourceExposed: false
  }));
}
function projectKapUnknownBoundary({ bundle, coverageDecision, locale }) {
  const copy = localeCopy(locale);
  const unknowns = mapUnknowns(bundle, locale);
  const status = coverageDecision?.status || "INSUFFICIENT_COVERAGE";
  const knowledgeStatus = status === "STRONG_COVERAGE" ? "KNOWN_WITH_DECLARED_BOUNDARIES" : status === "PARTIAL_COVERAGE" ? "PARTIALLY_KNOWN" : status === "OUT_OF_SCOPE" ? "OUT_OF_SCOPE" : "INSUFFICIENT";
  const limits = [copy.questionScopedBoundary];
  if (bundle?.normalization?.hints?.containsPersonalContextHint) limits.push(copy.personalBoundary);
  if (status === "PARTIAL_COVERAGE") limits.push(copy.partial);
  return {
    schemaVersion: "PHI-OS-KAP-UNKNOWN-BOUNDARY-PROJECTION-v1.0.0",
    knowledgeStatus,
    coverageStatus: status,
    knownSourceCount: bundle?.sources?.length || 0,
    unknowns,
    limits: unique5(limits),
    guidedReadingRoutingActivated: false,
    realityJourneyRoutingActivated: false
  };
}
function composeDeterministicKapAnswer({ bundle, coverageDecision, depth = DEFAULT_DEPTH, now = /* @__PURE__ */ new Date() }) {
  if (!bundle?.bundleId) throw new Error("KAP_GROUNDING_BUNDLE_REQUIRED");
  bundle = excludeProtectedBookViiSources(bundle);
  if (isBookViiManuscriptRequest(bundle.question?.text)) bundle = { bundleId: bundle.bundleId, question: bundle.question, sources: [], unknowns: [{ code: "PROTECTED_MANUSCRIPT_ACCESS_DENIED" }] };
  const normalizedDepth = normalizeAnswerDepth(depth);
  const profile = DEPTHS[normalizedDepth];
  const locale = bundle.question?.locale || "zh-Hans";
  const copy = localeCopy(locale);
  const manuscriptDenied = isBookViiManuscriptRequest(bundle.question?.text);
  const all = manuscriptDenied ? [] : groundedSentences(bundle);
  const direct = all.slice(0, profile.directSentences);
  const directTexts = new Set(direct.map((item) => item.text));
  const mechanismPool = unique5([
    ...facetBackedSentences(bundle, all).map((item) => item.text),
    ...all.map((item) => item.text)
  ]).filter((text5) => !directTexts.has(text5));
  const mechanisms = mechanismPool.slice(0, profile.mechanismItems);
  const used = /* @__PURE__ */ new Set([...directTexts, ...mechanisms]);
  const remaining = all.map((item) => item.text).filter((text5) => !used.has(text5));
  const whyItMatters = remaining.slice(0, profile.whyItems);
  const unknowns = mapUnknowns(bundle, locale);
  const boundaries = [copy.questionScopedBoundary];
  if (bundle?.normalization?.hints?.containsPersonalContextHint) boundaries.push(copy.personalBoundary);
  const eligible2 = !manuscriptDenied && (!bundle.bookViiProtectedSourceRejected || bundle.sources.length > 0) && coverageDecision?.answerCompositionEligible === true;
  const ptrcOutcome = coverageDecision?.ptrcQuality?.outcome || null;
  const partialSupported = !manuscriptDenied && ptrcOutcome === "PARTIAL" && coverageDecision?.shortSupportedAnswerEligible === true && direct.length > 0;
  const relevanceRejected = (coverageDecision?.reasonCodes || []).includes("QUESTION_SOURCE_RELEVANCE_NOT_ESTABLISHED");
  const directAnswer = manuscriptDenied ? locale === "zh-Hans" ? "\u4E0D\u80FD\u901A\u8FC7 Ask PHI OS \u63D0\u53D6\u53D7\u4FDD\u62A4\u7684\u5B8C\u6574\u4E66\u9875\u6216\u624B\u7A3F\uFF1B\u77E5\u8BC6\u8BBF\u95EE\u4E0D\u7B49\u4E8E\u624B\u7A3F\u8BBF\u95EE\u3002" : "Ask PHI OS cannot extract protected book pages or manuscript; knowledge access is not manuscript access." : eligible2 ? direct.map((item) => item.text).join(locale === "zh-Hans" ? "" : " ") : partialSupported ? `${direct[0].text}${locale === "zh-Hans" ? "" : " "}${copy.partial}` : coverageDecision?.status === "OUT_OF_SCOPE" ? copy.outOfScope : copy.insufficient;
  const whatToObserve = eligible2 && bundle?.normalization?.hints?.containsPersonalContextHint && normalizedDepth !== "QUICK" ? [copy.observe] : [];
  const primaryNodeCodes = (bundle?.nodeMatches?.primaryNodes || []).map((node) => node.nodeCode);
  const supportingNodeCodes = (bundle?.nodeMatches?.supportingNodes || []).map((node) => node.nodeCode);
  const relatedNodeCodes = bundle?.nodeMatches?.relatedPublishedNodeCodes || [];
  const manuscriptRefs = (bundle?.sources || []).filter((source) => source.sourceType === "COMPLETED_MANUSCRIPT").map((source) => source.sectionCode).filter(Boolean);
  const publishedRefs = (bundle?.sources || []).filter((source) => source.sourceType === "PUBLISHED_CANONICAL_ARTICLE").map((source) => source.fragmentCode || source.nodeCode).filter(Boolean);
  const answerIdKey = `${bundle.bundleId}|${normalizedDepth}|${coverageDecision?.status || "UNKNOWN"}`;
  const epistemicReading = deriveEpistemicReading(bundle, coverageDecision);
  return {
    schemaVersion: "PHI-OS-QUESTION-SCOPED-KNOWLEDGE-ANSWER-v1.0.0",
    answerId: `KAP-A-v1-${stableHash2(answerIdKey)}`,
    question: bundle.question?.text || "",
    normalizedQuestion: bundle.normalization?.searchText || bundle.question?.text || "",
    locale,
    answerMode: "KNOWLEDGE_ANSWER",
    authorityClass: "QUESTION_SCOPED_NON_AUTHORITATIVE_PROJECTION",
    coverageStatus: coverageDecision?.status || "INSUFFICIENT_COVERAGE",
    ...ptrcOutcome ? { qualityOutcome: ptrcOutcome } : {},
    groundingBundleId: bundle.bundleId,
    ...epistemicReading ? { epistemicReading } : {},
    knowledgeRefs: {
      primaryNodeCodes,
      supportingNodeCodes,
      relatedNodeCodes,
      manuscriptRefs,
      publishedRefs
    },
    content: {
      directAnswer,
      ...(eligible2 || partialSupported) && structuredAnswerShape(bundle, directAnswer) ? { structuredAnswer: structuredAnswerShape(bundle, directAnswer) } : {},
      mechanism: eligible2 ? mechanisms : [],
      whyItMatters: eligible2 ? whyItMatters : [],
      whatToObserve,
      boundaries: unique5(boundaries),
      unknowns,
      relatedKnowledge: relevanceRejected ? [] : relatedKnowledge(bundle, profile.relatedItems)
    },
    generation: {
      generationMode: "DETERMINISTIC",
      generativeModelUsed: false,
      modelRef: null
    },
    lifecycle: {
      createdAt: now.toISOString(),
      expiresAt: null,
      persistentCaseCreated: false
    },
    governance: {
      publicationStatus: "NOT_PUBLICATION",
      canonicalAuthorityStatus: "NONE",
      realityReadingStatus: "NOT_REALITY_READING"
    }
  };
}
function composeKapAnswerProjection({ bundle, coverageDecision, depth = DEFAULT_DEPTH, now = /* @__PURE__ */ new Date() }) {
  bundle = excludeProtectedBookViiSources(bundle);
  if (bundle.bookViiProtectedSourceRejected && !bundle.sources.length) coverageDecision = { ...coverageDecision, status: "INSUFFICIENT_COVERAGE", answerCompositionEligible: false, shortSupportedAnswerEligible: false, reasonCodes: [...coverageDecision?.reasonCodes || [], "PROTECTED_BOOK_VII_SOURCE_REJECTED"] };
  if (isBookViiManuscriptRequest(bundle.question?.text)) {
    bundle = { bundleId: bundle.bundleId, question: bundle.question, sources: [], unknowns: [{ code: "PROTECTED_MANUSCRIPT_ACCESS_DENIED" }] };
    coverageDecision = { status: "INSUFFICIENT_COVERAGE", answerCompositionEligible: false, reasonCodes: ["PROTECTED_MANUSCRIPT_ACCESS_DENIED"] };
  }
  const normalizedDepth = normalizeAnswerDepth(depth);
  const aiEligibility = evaluateKapAiEligibility({ bundle, coverageDecision, depth: normalizedDepth });
  const aiRouting = routeKapAiCost({ eligibility: aiEligibility });
  const answer = composeDeterministicKapAnswer({ bundle, coverageDecision, depth: normalizedDepth, now });
  const relevanceRejected = (coverageDecision?.reasonCodes || []).includes("QUESTION_SOURCE_RELEVANCE_NOT_ESTABLISHED");
  const sources = relevanceRejected || isBookViiManuscriptRequest(bundle.question?.text) ? [] : projectKapSources(bundle, normalizedDepth);
  const boundary2 = projectKapUnknownBoundary({ bundle, coverageDecision, locale: answer.locale });
  return {
    schemaVersion: "PHI-OS-ASK-PHIOS-RESPONSE-v1.0.0",
    capability: "ASK_PHIOS",
    answerDepth: normalizedDepth,
    answer,
    sources,
    boundary: boundary2,
    coverage: coverageDecision,
    ai: {
      eligibility: aiEligibility,
      routing: aiRouting,
      providerInvoked: false,
      generativeModelUsed: false
    },
    production: {
      independentlyDeliverable: true,
      requiresMcd: false,
      requiresGuidedReading: false,
      requiresRealityJourney: false,
      deterministicFallbackAvailable: true
    },
    governance: {
      knowledgeAuthorityUnchanged: true,
      publicationAuthorityUnchanged: true,
      realityReadingAuthorityUnchanged: true,
      persistentCaseCreated: false,
      upstreamGroundedAnswerConsumed: false
    }
  };
}
async function runAskPhiosPipeline({ input, request, env = {}, depth = DEFAULT_DEPTH, retrievalOptions = {}, scopeDisposition = "KNOWLEDGE_QUERY", now = /* @__PURE__ */ new Date() }) {
  if (isBookViiManuscriptRequest(input?.question)) {
    const bundle = { bundleId: "KAP-BOOK-VII-MANUSCRIPT-DENIED", question: { text: input.question, locale: input.locale || "zh-Hans" }, sources: [], unknowns: [{ code: "PROTECTED_MANUSCRIPT_ACCESS_DENIED" }], retrieval: {} };
    return { ...composeKapAnswerProjection({ bundle, coverageDecision: { status: "INSUFFICIENT_COVERAGE", answerCompositionEligible: false, reasonCodes: ["PROTECTED_MANUSCRIPT_ACCESS_DENIED"] }, depth, now }), kirR2: { status: "KIR_R2_NOT_APPLIED", applied: false } };
  }
  const grounding = await runKapGroundingPipeline({ input, request, env, retrievalOptions, scopeDisposition });
  const projection = composeKapAnswerProjection({
    bundle: grounding.groundingBundle,
    coverageDecision: grounding.coverageDecision,
    depth,
    now
  });
  const relevanceEstablished = grounding.coverageDecision?.answerCompositionEligible === true && !projection.answer?.epistemicReading && !grounding.groundingBundle?.sources?.some((s) => s.sourceType === "STRUCTURED_KNOWLEDGE_OBJECT" || s.bookId === "BOOK-7" || s.bookCode === "BOOK-7" || /^KN-B7-/.test(s.nodeCode || ""));
  const kir = relevanceEstablished ? await runKirR2ProductionProjection({
    question: input?.question || grounding.groundingBundle?.question?.text || "",
    locale: input?.locale || grounding.groundingBundle?.question?.locale || "zh-Hans",
    env,
    upstreamGroundedAnswer: projection?.answer?.content?.directAnswer || null,
    upstreamGroundingBundle: grounding.groundingBundle
  }) : { status: "KIR_R2_BLOCKED_BY_RELEVANCE_GATE", applied: false };
  const kirApplied = kir?.applied === true;
  const kirAnswer = kirApplied ? kir.result.answer.text : null;
  const ptrcContract = grounding.intake?.requestContract || null;
  const ptrcStages = ptrcContract ? buildPtrcRetrievalStages(grounding.groundingBundle, ptrcContract) : [];
  const ptrcTrace = ptrcContract ? createPtrcAskTrace({
    contract: ptrcContract,
    route: "CKA",
    retrievalStages: ptrcStages,
    gateResult: grounding.ptrcQuality,
    answerMode: grounding.ptrcQuality?.outcome === "SUFFICIENT" ? "LONG_FORM_ALLOWED" : grounding.ptrcQuality?.outcome === "PARTIAL" ? "SHORT_SUPPORTED_ONLY" : "ABSTAIN_OR_CLARIFY"
  }) : null;
  const answer = kirApplied ? {
    ...projection.answer,
    content: { ...projection.answer.content, directAnswer: kirAnswer },
    generation: { ...projection.answer.generation, generationMode: kir.result.answer.providerInvoked ? "KIR_R2_GROUNDED_AI" : "KIR_R2_GROUNDED_DETERMINISTIC", generativeModelUsed: kir.result.answer.providerInvoked, modelRef: kir.result.answer.providerInvoked ? kir.result.answer.model : null }
  } : projection.answer;
  return {
    ...projection,
    answer,
    ...ptrcContract ? { ptrc: { requestContract: ptrcContract, quality: grounding.ptrcQuality, retrievalStages: ptrcStages, trace: ptrcTrace } } : {},
    kirR2: kirApplied ? {
      status: kir.status,
      schemaVersion: kir.result.schemaVersion,
      evidencePack: kir.result.evidencePack,
      model: kir.result.model,
      guard: kir.result.guard,
      usage: kir.result.usage,
      governance: {
        knowledgeEvidencePackConsumed: kir.result.answer.knowledgeEvidencePackConsumed,
        upstreamGroundedAnswerPresent: kir.result.answer.upstreamGroundedAnswerPresent,
        upstreamGroundedAnswerConsumed: kir.result.answer.upstreamGroundedAnswerConsumed,
        createsKnowledgeAuthority: false
      }
    } : { status: kir?.status || "KIR_R2_NOT_APPLIED", applied: false },
    grounding: {
      bundleId: grounding.groundingBundle.bundleId,
      retrievalAuthority: grounding.retrieval?.authority || "KSAR_KNOWLEDGE_ACCESS",
      sourceCount: grounding.groundingBundle.sources.length,
      upstreamGroundedAnswerPresent: grounding.groundingBundle.retrieval.upstreamGroundedAnswerPresent,
      upstreamGroundedAnswerConsumed: kirApplied ? kir.result.answer.upstreamGroundedAnswerConsumed : false,
      groundedEvidencePackConsumed: kirApplied ? kir.result.answer.knowledgeEvidencePackConsumed : false
    },
    governance: {
      ...projection.governance,
      upstreamGroundedAnswerConsumed: kirApplied ? kir.result.answer.upstreamGroundedAnswerConsumed : false,
      groundedEvidencePackConsumed: kirApplied ? kir.result.answer.knowledgeEvidencePackConsumed : false,
      kirR2Applied: kirApplied
    }
  };
}
var KAP_ANSWER_DEPTHS = Object.freeze(Object.keys(DEPTHS));

// functions/_lib/client-knowledge-ask.js
var canonicalText3 = (value) => String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ");
var CKA_ENTRY_SURFACES = Object.freeze([
  "HOMEPAGE",
  "KNOWLEDGE_SEARCH",
  "LIBRARY",
  "ARTICLE",
  "BOOK",
  "ACCOUNT",
  "REALITY_DASHBOARD",
  "FIGURE"
]);
var CKA_ENTRY_MODES = Object.freeze(["GLOBAL", "CONTEXTUAL", "REALITY_AWARE"]);
var CKA_UNKNOWN_STATES = Object.freeze([
  "UNKNOWN",
  "INSUFFICIENT_EVIDENCE",
  "CONFLICTING_EVIDENCE",
  "OUTSIDE_AUTHORITY",
  "CURRENT_DATA_REQUIRED"
]);
var CKA_GUEST_MAX_FOLLOW_UP_DEPTH = 1;
var surfaceSet = new Set(CKA_ENTRY_SURFACES);
var modeSet = new Set(CKA_ENTRY_MODES);
var cardForbiddenPattern = /(?:node|fragment|section|source)[-_ ]?code|sourceId|pipelineState|candidatePublicationState|\bKN-[A-Z0-9-]+\b|\bFRAGMENT-[A-Z0-9-]+\b/i;
var optionalText = (value) => canonicalText3(value) || null;
function normalizeCkaEntryContext(input = {}) {
  const entrySurface = canonicalText3(input.entrySurface || "KNOWLEDGE_SEARCH").toUpperCase();
  if (!surfaceSet.has(entrySurface)) throw new Error("CKA_ENTRY_SURFACE_UNSUPPORTED");
  const inferredMode = entrySurface === "REALITY_DASHBOARD" ? "REALITY_AWARE" : entrySurface === "HOMEPAGE" || entrySurface === "KNOWLEDGE_SEARCH" || entrySurface === "ACCOUNT" ? "GLOBAL" : "CONTEXTUAL";
  const mode = canonicalText3(input.mode || inferredMode).toUpperCase();
  if (!modeSet.has(mode)) throw new Error("CKA_ENTRY_MODE_UNSUPPORTED");
  const figureCode = optionalText(input.figureCode);
  if (entrySurface === "FIGURE" && !figureCode) throw new Error("CKA_FIGURE_CONTEXT_REQUIRED");
  const authorization = Object.freeze({
    permissionVerified: input.permission === true,
    privacyVerified: input.privacy === true,
    entitlementVerified: input.entitlement === true,
    accountVerified: canonicalText3(input.accountState).toUpperCase() === "ACCOUNT",
    realityCaseBound: Boolean(optionalText(input.realityCaseId))
  });
  if (mode === "REALITY_AWARE" && !Object.values(authorization).every(Boolean)) {
    throw new Error("CKA_REALITY_CONTEXT_NOT_AUTHORIZED");
  }
  return Object.freeze({
    entrySurface,
    entryRoute: optionalText(input.entryRoute),
    contextType: optionalText(input.contextType),
    contextId: optionalText(input.contextId),
    bookCode: optionalText(input.bookCode),
    partCode: optionalText(input.partCode),
    articleCode: optionalText(input.articleCode),
    figureCode,
    realityCaseId: optionalText(input.realityCaseId),
    accountState: canonicalText3(input.accountState || "GUEST").toUpperCase(),
    locale: input.locale === "en" ? "en" : "zh-Hans",
    mode,
    authorization,
    governance: Object.freeze({
      createsPersistentCase: false,
      createsShadowAccount: false,
      executesMethod: false,
      startsRealityJourney: false
    })
  });
}
function createCkaFollowUpContext(input = {}) {
  const followUpDepth = Number.parseInt(input.followUpDepth ?? 0, 10);
  if (!Number.isInteger(followUpDepth) || followUpDepth < 0) throw new Error("CKA_FOLLOW_UP_DEPTH_INVALID");
  const accountState = canonicalText3(input.accountState || "GUEST").toUpperCase();
  if (accountState === "GUEST" && followUpDepth > CKA_GUEST_MAX_FOLLOW_UP_DEPTH) {
    throw new Error("CKA_GUEST_FOLLOW_UP_LIMIT_REACHED");
  }
  return Object.freeze({
    currentQuestion: canonicalText3(input.currentQuestion),
    contextQuestion: optionalText(input.contextQuestion),
    parentAnswerId: optionalText(input.parentAnswerId),
    groundingBundleId: optionalText(input.groundingBundleId),
    followUpDepth,
    answerContext: Object.freeze({
      parentAnswerId: optionalText(input.parentAnswerId)
    }),
    knowledgeContext: Object.freeze({
      groundingBundleId: optionalText(input.groundingBundleId)
    }),
    temporaryOnly: true,
    historyPersisted: false,
    createsPersistentCase: false,
    accountState
  });
}
function classifyCkaFollowUpBoundary(question) {
  const normalized2 = canonicalText3(question).toLowerCase();
  const stopPatterns = [
    /(?:reconstruct|rebuild|map).*(?:my|personal).*(?:case|reality)/,
    /(?:persist|save|remember).*(?:context|case|history)/,
    /(?:track|monitor).*(?:action|outcome|result)/,
    /(?:review|compare).*(?:my )?(?:outcome|result).*(?:over time|later|next)/
  ];
  const simpleAskAllowed = !stopPatterns.some((pattern) => pattern.test(normalized2));
  return Object.freeze({
    simpleAskAllowed,
    classification: simpleAskAllowed ? "SIMPLE_ASK" : "REALITY_COMPLEXITY_BOUNDARY",
    automaticEscalation: false,
    persistentCaseCreated: false
  });
}
var unknownStateFor = (payload) => {
  const status = canonicalText3(payload?.answer?.coverageStatus || payload?.coverage?.status).toUpperCase();
  if (status === "INSUFFICIENT_COVERAGE") return "INSUFFICIENT_EVIDENCE";
  if (status === "OUT_OF_SCOPE") return "OUTSIDE_AUTHORITY";
  if (status === "CONFLICTING_EVIDENCE") return "CONFLICTING_EVIDENCE";
  if (status === "CURRENT_DATA_REQUIRED") return "CURRENT_DATA_REQUIRED";
  return "UNKNOWN";
};
var safeCardText = (value, fallback) => {
  const text5 = canonicalText3(value);
  return text5 && !cardForbiddenPattern.test(text5) ? text5 : fallback;
};
var relatedKnowledgeCards = (payload) => {
  const related = Array.isArray(payload?.answer?.content?.relatedKnowledge) ? payload.answer.content.relatedKnowledge : [];
  const publicSources = (payload?.sources || []).filter((source) => source?.href);
  const count = Math.max(related.length, publicSources.length);
  return Array.from({ length: count }, (_, index) => {
    const source = publicSources[index] || publicSources[0] || {};
    const contentType = source.href ? "ARTICLE" : "CONCEPT";
    return Object.freeze({
      concept: safeCardText(source.title, "Related PHI OS knowledge"),
      part: safeCardText(source.partLabel || source.partCode, "Knowledge"),
      volume: safeCardText(source.volumeLabel || source.bookCode, "PHI OS"),
      description: safeCardText(source.questionScopedExcerpt, "Continue with governed related knowledge."),
      contentType,
      href: source.href || null
    });
  });
};
function projectCkaClientAnswer(payload, { entryContext, followUpContext, displayQuestion } = {}) {
  const content = payload?.answer?.content || {};
  const whyThisMayHappen = [...content.mechanism || [], ...content.whyItMatters || []].map(canonicalText3).filter(Boolean);
  const unknownDetails = [...content.unknowns || [], ...content.boundaries || []].map(canonicalText3).filter(Boolean);
  return Object.freeze({
    schemaVersion: "PHI-OS-CKA-CLIENT-ANSWER-v1.0.0",
    question: canonicalText3(displayQuestion || followUpContext?.currentQuestion || payload?.answer?.question),
    directAnswer: canonicalText3(content.directAnswer),
    ...content.structuredAnswer ? { structuredAnswer: content.structuredAnswer } : {},
    whyThisMayHappen: Object.freeze(whyThisMayHappen),
    whatToObserve: Object.freeze((content.whatToObserve || []).map(canonicalText3).filter(Boolean)),
    unknown: Object.freeze({
      state: unknownStateFor(payload),
      details: Object.freeze(unknownDetails)
    }),
    relatedKnowledgeCards: Object.freeze(relatedKnowledgeCards(payload)),
    sourcesGrounding: Object.freeze((payload?.sources || []).map((source) => Object.freeze({
      authorityLabel: canonicalText3(source.authorityLabel),
      excerpt: canonicalText3(source.questionScopedExcerpt),
      href: source.href || null
    }))),
    entryContext: entryContext || null,
    followUpDepth: followUpContext?.followUpDepth || 0,
    governance: Object.freeze({
      createsCanonicalAuthority: false,
      createsRealityReading: false,
      createsPersistentCase: false,
      internalNodeCodesProjectedToCards: false
    })
  });
}

// functions/_lib/client-knowledge-ask-b.js
var clean12 = (value) => String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ");
var optional = (value) => clean12(value) || null;
var unique6 = (values) => [...new Set((Array.isArray(values) ? values : []).map(clean12).filter(Boolean))];
var CKA_ANSWER_STATES = Object.freeze([
  "ANSWERED",
  "PARTIALLY_ANSWERED",
  "UNKNOWN",
  "OUTSIDE_SCOPE",
  "NEEDS_CONTEXT",
  "NEEDS_CURRENT_AUTHORITY",
  "PROFESSIONAL_HANDOFF"
]);
var CKA_AUTHORITY_PRIORITY = Object.freeze([
  "CANONICAL_OR_PUBLISHED_PHI_OS",
  "REVIEWED_MANUSCRIPT_OR_KSAR",
  "GOVERNED_EXTERNAL_AUTHORITY",
  "AUTHORIZED_CLIENT_CONTEXT"
]);
var CKA_ACCOUNT_BOUNDARY = Object.freeze({
  guestAllowed: Object.freeze([
    "ASK",
    "ANSWER",
    "ONE_LIMITED_FOLLOW_UP",
    "RELATED_KNOWLEDGE",
    "TEMPORARY_GUIDED_CONTEXT"
  ]),
  accountRequired: Object.freeze([
    "ANSWER_HISTORY",
    "SAVE_RESULT_OR_KNOWLEDGE",
    "METHOD_RESULT_PERSISTENCE",
    "CASE_PERSISTENCE",
    "REALITY_VERSION_HISTORY",
    "JOURNEY_CONTINUITY"
  ]),
  featureGates: Object.freeze(["ENTITLEMENT", "PRIVACY", "CONSENT", "RETENTION"]),
  shadowAccountCreated: false,
  guestHistoryPersisted: false
});
var CKA_GUIDED_FIELDS = Object.freeze([
  "whatIsHappening",
  "howLong",
  "whoOrWhatIsInvolved",
  "whatChanged",
  "whatTried",
  "whatMattersMostNow"
]);
function normalizeCkaKnowledgeContext(input = {}) {
  const context = Object.freeze({
    contextLabel: optional(input.contextLabel)?.slice(0, 180) || null,
    contextSummary: optional(input.contextSummary)?.slice(0, 320) || null,
    readingPath: optional(input.readingPath)?.slice(0, 240) || null,
    relatedKnowledgeRef: optional(input.relatedKnowledgeRef)?.slice(0, 180) || null
  });
  return Object.freeze({
    ...context,
    temporaryOnly: true,
    authorityChanged: false,
    realityCaseCreated: false
  });
}
var currentAuthorityPattern = /(?:\b(?:today|current|currently|latest|now|live|price|rate|law|regulation|market|election|product availability)\b|今天|目前|现在|最新|即时|价格|利率|法律|法规|市场|选举|产品现况)/i;
var unstableDomainPattern = /(?:\b(?:medical|medicine|legal|financial|tax|regulatory|current affairs|product specification)\b|医疗|医学|法律|财务|金融|税务|监管|时事|产品规格)/i;
var professionalJudgmentPattern = /(?:\b(?:diagnose|prescribe|legal advice|investment advice|should i (?:buy|sell)|medical emergency)\b|诊断|处方|法律意见|投资建议|我该(?:买|卖)|医疗急症)/i;
var persistencePattern = /(?:\b(?:for years|for months|long[- ]?term|persistent|recurring|keeps happening|still unresolved)\b|多年|几个月|长期|持续|反复|一直没有解决)/i;
var multiFactorPattern = /(?:\b(?:multiple|several|conflicting|interdependent|feedback loop|many factors)\b|多个|多方|冲突|互相影响|反馈循环|很多因素)/i;
var caseSpecificPattern = /(?:\b(?:my|me|our|personally|in my situation)\b|我的|我现在|我们|在我的情况)/i;
var realityDependentPattern = /(?:\b(?:track over time|case history|reality model|journey continuity)\b|持续追踪|案例历史|现实模型|旅程连续性)/i;
function stableHash3(value) {
  let hash3 = 2166136261;
  for (const character of String(value)) {
    hash3 ^= character.codePointAt(0);
    hash3 = Math.imul(hash3, 16777619) >>> 0;
  }
  return hash3.toString(16).padStart(8, "0");
}
function normalizeCkaGuidedContext(input = {}) {
  const fields = Object.fromEntries(CKA_GUIDED_FIELDS.map((key) => [key, optional(input[key])?.slice(0, 240) || null]));
  const filled = CKA_GUIDED_FIELDS.filter((key) => fields[key]);
  const corpus = [input.question, ...Object.values(fields)].map(clean12).filter(Boolean).join(" ");
  const signals = Object.freeze({
    persistent: persistencePattern.test(corpus),
    multiFactor: multiFactorPattern.test(corpus) || [fields.whoOrWhatIsInvolved, fields.whatChanged, fields.whatTried].filter(Boolean).length >= 3,
    caseSpecific: caseSpecificPattern.test(corpus) || Boolean(fields.whatIsHappening),
    realityDependent: realityDependentPattern.test(corpus),
    personalized: Boolean(fields.whoOrWhatIsInvolved || fields.whatMattersMostNow)
  });
  const classifications = unique6([
    filled.length ? "CONTEXTUAL" : "SIMPLE",
    signals.personalized ? "PERSONALIZED" : null,
    signals.persistent ? "PERSISTENT" : null,
    signals.multiFactor ? "MULTI_FACTOR" : null,
    signals.realityDependent || signals.persistent && signals.multiFactor ? "COMPLEX" : null
  ]);
  return Object.freeze({
    schemaVersion: "PHI-OS-CKA-GUIDED-CONTEXT-v1.0.0",
    fields: Object.freeze(fields),
    filledFields: Object.freeze(filled),
    classifications: Object.freeze(classifications),
    signals,
    temporaryOnly: true,
    fullIcrCreated: false,
    classificationIsDiagnosis: false,
    canonicalRealityCreated: false
  });
}
function sourceAuthorityClass(source = {}) {
  const type = clean12(source.sourceType || source.authorityLabel).toUpperCase();
  if (/PUBLISHED|CANONICAL_ARTICLE/.test(type)) return "CANONICAL_OR_PUBLISHED_PHI_OS";
  if (/MANUSCRIPT|KSAR|REVIEWED/.test(type)) return "REVIEWED_MANUSCRIPT_OR_KSAR";
  if (/EXTERNAL|CURRENT_AUTHORITY/.test(type)) return "GOVERNED_EXTERNAL_AUTHORITY";
  return "CANONICAL_OR_PUBLISHED_PHI_OS";
}
function evaluateCkaExternalAuthority(question, payload = {}) {
  const text5 = clean12(question);
  const required = currentAuthorityPattern.test(text5) || unstableDomainPattern.test(text5);
  const professionalJudgmentRequested = professionalJudgmentPattern.test(text5);
  const authoritySources2 = (Array.isArray(payload.sources) ? payload.sources : []).filter((source) => sourceAuthorityClass(source) === "GOVERNED_EXTERNAL_AUTHORITY");
  return Object.freeze({
    required,
    professionalJudgmentRequested,
    governedCurrentAuthorityAvailable: authoritySources2.length > 0,
    authoritySourceCount: authoritySources2.length,
    ckaMakesProfessionalJudgment: false,
    liveAuthorityInvented: false
  });
}
function resolveCkaAnswerState(payload = {}, { guidedContext, authorityDecision } = {}) {
  const coverage = clean12(payload?.answer?.coverageStatus || payload?.coverage?.status).toUpperCase();
  if (authorityDecision?.professionalJudgmentRequested) return "PROFESSIONAL_HANDOFF";
  if (authorityDecision?.required && !authorityDecision.governedCurrentAuthorityAvailable) return "NEEDS_CURRENT_AUTHORITY";
  const grounded = Boolean(clean12(payload?.answer?.groundingBundleId || payload?.grounding?.bundleId)) && (Array.isArray(payload?.sources) ? payload.sources.length : 0) > 0;
  if (!grounded) return guidedContext?.filledFields?.length ? "UNKNOWN" : "NEEDS_CONTEXT";
  if (coverage === "STRONG_COVERAGE") return "ANSWERED";
  if (coverage === "PARTIAL_COVERAGE") return "PARTIALLY_ANSWERED";
  if (coverage === "OUT_OF_SCOPE") return "OUTSIDE_SCOPE";
  if (coverage === "INSUFFICIENT_COVERAGE" && !guidedContext?.filledFields?.length) return "NEEDS_CONTEXT";
  if (coverage === "INSUFFICIENT_COVERAGE") return "UNKNOWN";
  return "UNKNOWN";
}
function governedRelatedCards(payload = {}) {
  return (Array.isArray(payload.sources) ? payload.sources : []).filter((source) => typeof source?.href === "string" && source.href).map((source) => Object.freeze({
    concept: clean12(source.title || source.authorityLabel || "PHI OS knowledge"),
    volume: clean12(source.volumeLabel || source.bookCode || "PHI OS"),
    part: clean12(source.partLabel || source.partCode || "Knowledge"),
    description: clean12(source.questionScopedExcerpt || "Continue with this governed source."),
    contentType: /figure/i.test(clean12(source.sourceType)) ? "FIGURE" : /book|manuscript/i.test(clean12(source.sourceType)) ? "BOOK" : "ARTICLE",
    href: source.href
  }));
}
function projectCkaW5W17Envelope(payload = {}, {
  displayQuestion,
  locale = "zh-Hans",
  guidedContext,
  knowledgeContext
} = {}) {
  const answer = payload?.answer || {};
  if (!clean12(answer.answerId)) throw new Error("CKA_UPSTREAM_ANSWER_ID_REQUIRED");
  const question = clean12(displayQuestion || answer.question);
  const authorityDecision = evaluateCkaExternalAuthority(question, payload);
  const answerState = resolveCkaAnswerState(payload, { guidedContext, authorityDecision });
  const groundingBundleId = clean12(answer.groundingBundleId || payload?.grounding?.bundleId);
  const sourceGroups = /* @__PURE__ */ new Map();
  for (const source of Array.isArray(payload.sources) ? payload.sources : []) {
    const authorityClass2 = sourceAuthorityClass(source);
    if (!sourceGroups.has(authorityClass2)) sourceGroups.set(authorityClass2, []);
    sourceGroups.get(authorityClass2).push(Object.freeze({
      authorityLabel: clean12(source.authorityLabel),
      description: clean12(source.questionScopedExcerpt),
      volume: clean12(source.volumeLabel || source.bookCode),
      part: clean12(source.partLabel || source.partCode),
      href: source.href || null
    }));
  }
  const retrievalContext = Object.freeze({
    pipeline: Object.freeze(["QUESTION", "INTENT", "KNOWLEDGE_RETRIEVAL", "PUBLISHED_OR_AUTHORIZED_KNOWLEDGE", "GROUNDING", "ANSWER"]),
    authorityPriority: CKA_AUTHORITY_PRIORITY,
    authorityGroups: Object.freeze(CKA_AUTHORITY_PRIORITY.map((authorityClass2) => Object.freeze({
      authorityClass: authorityClass2,
      sources: Object.freeze(sourceGroups.get(authorityClass2) || [])
    }))),
    llmMemoryOnlyAnswerAllowed: false,
    authoritiesSilentlyCollapsed: false
  });
  const knowledgeRefs = Object.freeze({
    primaryNodeCodes: Object.freeze(unique6(answer?.knowledgeRefs?.primaryNodeCodes)),
    supportingNodeCodes: Object.freeze(unique6(answer?.knowledgeRefs?.supportingNodeCodes)),
    relatedNodeCodes: Object.freeze(unique6(answer?.knowledgeRefs?.relatedNodeCodes)),
    manuscriptRefs: Object.freeze(unique6(answer?.knowledgeRefs?.manuscriptRefs)),
    publishedRefs: Object.freeze(unique6(answer?.knowledgeRefs?.publishedRefs))
  });
  const unknownState = answerState === "NEEDS_CURRENT_AUTHORITY" ? "CURRENT_DATA_REQUIRED" : answerState === "OUTSIDE_SCOPE" ? "OUTSIDE_AUTHORITY" : answerState === "ANSWERED" ? "BOUNDED_KNOWN" : "UNKNOWN";
  return Object.freeze({
    schemaVersion: "PHI-OS-CKA-W5-W17-CLIENT-ENVELOPE-v1.0.0",
    answerState,
    record: Object.freeze({
      answerId: answer.answerId,
      questionId: `CKA-Q-v1-${stableHash3(`${locale}|${question}`)}`,
      retrievalContext,
      knowledgeRefs,
      groundingState: groundingBundleId && (payload?.sources?.length || 0) > 0 ? "GROUNDED" : "INSUFFICIENT_GROUNDING",
      groundingBundleId: groundingBundleId || null,
      unknownState,
      locale: locale === "en" ? "en" : "zh-Hans"
    }),
    guidedContext: guidedContext || null,
    knowledgeContext: knowledgeContext || null,
    externalAuthority: authorityDecision,
    relatedKnowledgeCards: Object.freeze(governedRelatedCards(payload)),
    accountBoundary: CKA_ACCOUNT_BOUNDARY,
    methodBoundary: Object.freeze({
      askIsMethodExecution: false,
      birthDataTriggersMethod: false,
      executionPath: Object.freeze(["READINESS", "DISCLOSURE", "CONSENT", "MPA_ELIGIBILITY", "EXECUTION", "NORMALIZATION"]),
      owner: "PERSONAL_RUNTIME"
    }),
    realityBoundary: Object.freeze({
      questionContextIsCanonicalRealityCase: false,
      simpleContextEphemeral: true,
      newCaseOnlyThroughRealityFlow: true
    }),
    navigationBoundary: Object.freeze({
      searchPurpose: "FIND_KNOWLEDGE",
      askPurpose: "UNDERSTAND_KNOWLEDGE",
      libraryPurpose: "BROWSE_DISCOVER_COMPARE_FOLLOW_READING_PATHS"
    }),
    governance: Object.freeze({
      groundedAnswerRuntimeConsumed: true,
      authoritativeAnswerGeneratedByCka: false,
      secondAnswerRuntimeCreated: false,
      secondRetrievalRuntimeCreated: false,
      persistentHistoryCreated: false,
      shadowAccountCreated: false,
      methodExecuted: false,
      realityJourneyActivated: false
    })
  });
}

// functions/_lib/client-knowledge-ask-c.js
var clean13 = (value) => String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ");
var optional2 = (value) => clean13(value) || null;
var list3 = (value) => Array.isArray(value) ? value : [];
var CKA_CONSUMPTION_LOCALES = Object.freeze(["en", "zh-Hans"]);
var CKA_RESPONSIVE_VIEWPORTS = Object.freeze([360, 390, 430, 768, 1024, 1280, 1440]);
var CKA_ENTITLEMENT_MATRIX = Object.freeze({
  GUEST: Object.freeze(["LIMITED_ASK"]),
  ACCOUNT: Object.freeze(["LIMITED_ASK", "HISTORY", "SAVE"]),
  ELIGIBLE_CUSTOMER: Object.freeze(["LIMITED_ASK", "HISTORY", "SAVE", "REALITY_AWARE_CONTEXT"]),
  ELIGIBLE_METHOD_USER: Object.freeze(["LIMITED_ASK", "HISTORY", "SAVE", "METHOD_HANDOFF"]),
  JOURNEY_USER: Object.freeze(["LIMITED_ASK", "HISTORY", "SAVE", "REALITY_AWARE_CONTEXT", "CONTINUITY"]),
  PROFESSIONAL: Object.freeze(["SEPARATE_PROFESSIONAL_SURFACE"])
});
function normalizeTrustedCkaAccess(data = {}) {
  const source = data && typeof data === "object" && !Array.isArray(data) ? data : {};
  const accountState = clean13(source.accountState).toUpperCase() === "ACCOUNT" ? "ACCOUNT" : "GUEST";
  const roles = new Set(list3(source.roles).map((value) => clean13(value).toUpperCase()).filter(Boolean));
  return Object.freeze({
    accountState,
    permission: source.permission === true,
    privacy: source.privacy === true,
    entitlement: source.entitlement === true,
    retentionPolicyAccepted: source.retentionPolicyAccepted === true,
    roles: Object.freeze([...roles]),
    source: "TRUSTED_REQUEST_CONTEXT_ONLY"
  });
}
function resolveCkaEntitlements(access = {}) {
  const normalized2 = normalizeTrustedCkaAccess(access);
  const capabilities = new Set(CKA_ENTITLEMENT_MATRIX.GUEST);
  if (normalized2.accountState === "ACCOUNT" && normalized2.retentionPolicyAccepted) CKA_ENTITLEMENT_MATRIX.ACCOUNT.forEach((value) => capabilities.add(value));
  if (normalized2.roles.includes("ELIGIBLE_CUSTOMER") && normalized2.permission && normalized2.privacy && normalized2.entitlement) {
    CKA_ENTITLEMENT_MATRIX.ELIGIBLE_CUSTOMER.forEach((value) => capabilities.add(value));
  }
  if (normalized2.roles.includes("ELIGIBLE_METHOD_USER") && normalized2.entitlement) {
    CKA_ENTITLEMENT_MATRIX.ELIGIBLE_METHOD_USER.forEach((value) => capabilities.add(value));
  }
  if (normalized2.roles.includes("JOURNEY_USER") && normalized2.entitlement) {
    CKA_ENTITLEMENT_MATRIX.JOURNEY_USER.forEach((value) => capabilities.add(value));
  }
  if (normalized2.roles.includes("PROFESSIONAL")) {
    capabilities.clear();
    CKA_ENTITLEMENT_MATRIX.PROFESSIONAL.forEach((value) => capabilities.add(value));
  }
  return Object.freeze({
    accountState: normalized2.accountState,
    capabilities: Object.freeze([...capabilities]),
    professionalSeparated: normalized2.roles.includes("PROFESSIONAL"),
    retentionRequiredForHistoryAndSave: true,
    retentionAccepted: normalized2.retentionPolicyAccepted,
    guestHiddenHistoryPersisted: false
  });
}
function normalizeTrustedRealityContext(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const realityCaseId = optional2(source.realityCaseId);
  const disclosureItems = list3(source.disclosureItems).slice(0, 12).map((item) => Object.freeze({
    label: clean13(item?.label).slice(0, 120),
    value: clean13(item?.value).slice(0, 240),
    category: clean13(item?.category || "CONTEXT").slice(0, 80)
  })).filter((item) => item.label && item.value);
  return Object.freeze({
    realityCaseId,
    contextLabel: optional2(source.contextLabel)?.slice(0, 180) || null,
    retrievalSummary: optional2(source.retrievalSummary)?.slice(0, 1200) || null,
    disclosureItems: Object.freeze(disclosureItems),
    source: "TRUSTED_REQUEST_CONTEXT_ONLY",
    analyticsProjectionAllowed: false
  });
}
function assertCkaRealityContextAuthorization({ access, realityContext, useCurrentRealityContext } = {}) {
  const trustedAccess = normalizeTrustedCkaAccess(access);
  const trustedReality = normalizeTrustedRealityContext(realityContext);
  if (useCurrentRealityContext !== true) {
    return Object.freeze({ authorized: false, requested: false, reason: "NOT_REQUESTED", trustedAccess, trustedReality });
  }
  const authorized = trustedAccess.accountState === "ACCOUNT" && trustedAccess.permission && trustedAccess.privacy && trustedAccess.entitlement && Boolean(trustedReality.realityCaseId);
  if (!authorized) throw new Error("CKA_REALITY_CONTEXT_NOT_AUTHORIZED");
  return Object.freeze({ authorized: true, requested: true, reason: "AUTHORIZED", trustedAccess, trustedReality });
}
function projectCkaRealityContextDisclosure(authorization = {}) {
  const active = authorization?.authorized === true;
  return Object.freeze({
    usingCurrentRealityContext: active,
    label: active ? "Using current Reality context" : "Current Reality context is not being used",
    contextLabel: active ? authorization?.trustedReality?.contextLabel || null : null,
    contextItems: active ? authorization?.trustedReality?.disclosureItems || Object.freeze([]) : Object.freeze([]),
    source: active ? "TRUSTED_REQUEST_CONTEXT_ONLY" : "NONE",
    privateContextInAnalyticsPayload: false,
    silentPrivateContextConsumption: false
  });
}
function publicationStateForSource(source = {}) {
  const type = clean13(source.sourceType).toUpperCase();
  if (type.startsWith("PUBLISHED_")) return "PUBLISHED";
  if (type.includes("MANUSCRIPT")) return "REVIEWED_NON_PUBLIC";
  if (type.includes("FIGURE")) return source.href ? "PUBLIC" : "NON_PUBLIC";
  return source.href ? "PUBLIC_GOVERNED" : "NON_PUBLIC_GOVERNED";
}
function contentTypeForSource(source = {}) {
  const type = clean13(source.sourceType).toUpperCase();
  if (type.includes("FIGURE")) return "FIGURE";
  if (type.includes("BOOK") || type.includes("MANUSCRIPT")) return "BOOK";
  return "ARTICLE";
}
function evaluateCkaKnowledgeCards(payload = {}, locale = "zh-Hans") {
  const answerLocale = locale === "en" ? "en" : "zh-Hans";
  const records = list3(payload?.sources).filter((source) => typeof source?.href === "string" && source.href).map((source) => {
    const record = Object.freeze({
      concept: clean13(source.title || source.authorityLabel || "PHI OS knowledge"),
      volume: clean13(source.volumeLabel || source.bookCode || "PHI OS"),
      part: clean13(source.partLabel || source.partCode || "Knowledge"),
      description: clean13(source.questionScopedExcerpt || "Continue with this governed source."),
      publicationState: publicationStateForSource(source),
      locale: answerLocale,
      contentType: contentTypeForSource(source),
      href: source.href,
      ownershipSource: source.bookCode ? "SOURCE_BOOK_CODE" : "SOURCE_METADATA",
      ownershipInferredFromKnBPrefix: false
    });
    return Object.freeze({
      ...record,
      valid: Boolean(record.concept && record.volume && record.part && record.description && record.publicationState && record.locale && record.contentType && record.href)
    });
  });
  return Object.freeze(records);
}
function evaluateCkaProductionAnswer(payload = {}, envelope = {}, cardAcceptance = []) {
  const answer = payload?.answer || {};
  const directAnswer = clean13(answer?.content?.directAnswer);
  const unknowns = list3(answer?.content?.unknowns);
  const boundaries = list3(answer?.content?.boundaries);
  const sourceCount = list3(payload?.sources).length;
  const groundingState = clean13(envelope?.record?.groundingState);
  const unknownVisible = Boolean(clean13(envelope?.record?.unknownState)) && (unknowns.length + boundaries.length > 0 || envelope?.answerState === "UNKNOWN");
  const relatedRequired = sourceCount > 0 && list3(payload?.sources).some((source) => source?.href);
  const relatedValid = !relatedRequired || cardAcceptance.length > 0 && cardAcceptance.every((card) => card.valid);
  const groundingValid = groundingState === "GROUNDED" && sourceCount > 0;
  return Object.freeze({
    directAnswerValid: Boolean(directAnswer),
    groundingValid,
    knowledgeSourceValid: sourceCount > 0,
    unknownVisible,
    authorityBoundaryValid: boundaries.length > 0 || Boolean(envelope?.externalAuthority),
    relatedKnowledgeValid: relatedValid,
    unverifiedGeneralGenerationPresentedAsPhiosKnowledge: false,
    productionAnswerAccepted: Boolean(directAnswer && groundingValid && sourceCount > 0 && unknownVisible && relatedValid)
  });
}
function projectCkaW18W33Consumption(payload = {}, envelope = {}, {
  locale = "zh-Hans",
  access = {},
  realityAuthorization = null
} = {}) {
  const knowledgeCards = evaluateCkaKnowledgeCards(payload, locale);
  const answerAcceptance = evaluateCkaProductionAnswer(payload, envelope, knowledgeCards);
  const entitlements = resolveCkaEntitlements(access);
  return Object.freeze({
    schemaVersion: "PHI-OS-CKA-W18-W33-CONSUMPTION-v1.0.0",
    knowledgeCards,
    answerAcceptance,
    entitlements,
    realityContext: projectCkaRealityContextDisclosure(realityAuthorization || {}),
    governance: Object.freeze({
      structuredAnswerRequired: true,
      genericUnlimitedChat: false,
      automaticJourneyEscalation: false,
      simplePublicAskForcedLogin: false,
      methodExecutionLeakage: false,
      realityCaseLeakage: false,
      privateContextInAnalyticsPayload: false,
      globalProductionAccepted: false
    })
  });
}

// functions/api/ask-phios-consumption.js
var JSON_HEADERS = Object.freeze({
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "referrer-policy": "no-referrer"
});
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}
var object2 = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
var text = (value) => String(value ?? "").trim();
function buildInput(payload, context) {
  const body = object2(payload);
  const rawEntry = object2(body.entryContext);
  const rawFollowUp = object2(body.followUpContext);
  const rawGuided = object2(body.guidedContext);
  const q = text(body.q);
  const locale = text(body.locale || "zh-Hans");
  const depth = normalizeAnswerDepth(body.depth || "STANDARD");
  const source = text(body.source || "hybrid");
  if (!q) throw new Error("KAP_QUESTION_INVALID");
  const trustedAccess = normalizeTrustedCkaAccess(context?.data?.ckaAccess || {});
  const useCurrentRealityContext = body.useCurrentRealityContext === true;
  const rawMode = text(rawEntry.mode).toUpperCase();
  const realityRequested = useCurrentRealityContext || rawMode === "REALITY_AWARE";
  const realityAuthorization = assertCkaRealityContextAuthorization({
    access: trustedAccess,
    realityContext: context?.data?.ckaRealityContext || {},
    useCurrentRealityContext: realityRequested
  });
  const realityCaseId = realityAuthorization.authorized ? realityAuthorization.trustedReality.realityCaseId : null;
  const entryContext = normalizeCkaEntryContext({
    entrySurface: rawEntry.entrySurface,
    entryRoute: rawEntry.entryRoute,
    contextType: rawEntry.contextType,
    contextId: rawEntry.contextId,
    bookCode: rawEntry.bookCode,
    partCode: rawEntry.partCode,
    articleCode: rawEntry.articleCode,
    figureCode: rawEntry.figureCode,
    realityCaseId,
    accountState: trustedAccess.accountState,
    locale,
    mode: realityRequested ? "REALITY_AWARE" : rawEntry.mode,
    permission: realityAuthorization.authorized ? trustedAccess.permission : false,
    privacy: realityAuthorization.authorized ? trustedAccess.privacy : false,
    entitlement: realityAuthorization.authorized ? trustedAccess.entitlement : false
  });
  const followUpContext = createCkaFollowUpContext({
    currentQuestion: q,
    contextQuestion: rawFollowUp.contextQuestion,
    parentAnswerId: rawFollowUp.parentAnswerId,
    groundingBundleId: rawFollowUp.groundingBundleId,
    followUpDepth: rawFollowUp.followUpDepth,
    accountState: trustedAccess.accountState
  });
  const followUpBoundary = classifyCkaFollowUpBoundary(q);
  if (!followUpBoundary.simpleAskAllowed) throw new Error("CKA_NOT_SIMPLE_ASK");
  const guidedContext = normalizeCkaGuidedContext({ question: q, ...rawGuided });
  const knowledgeContext = normalizeCkaKnowledgeContext({
    contextLabel: rawEntry.contextLabel,
    contextSummary: rawEntry.contextSummary,
    readingPath: rawEntry.readingPath,
    relatedKnowledgeRef: rawEntry.relatedKnowledgeRef
  });
  const requestContract = body.ptrcRequestContract?.schemaVersion === PTRC_ASK_CONTRACT_SCHEMA ? body.ptrcRequestContract : createPtrcAskRequestContract({ ...body, q, locale, entryContext: rawEntry, retrievalScope: body.retrievalScope || rawEntry.retrievalScope });
  const retrievalScope = normalizeAtlasRetrievalScope(requestContract.retrievalScope?.atlasScope || rawEntry.retrievalScope);
  return {
    q,
    locale,
    depth,
    source,
    entryContext,
    followUpContext,
    followUpBoundary,
    guidedContext,
    knowledgeContext,
    retrievalScope,
    requestContract,
    trustedAccess,
    realityAuthorization
  };
}
async function execute(context, payload) {
  const input = buildInput(payload, context);
  const retrievalQuestion = input.requestContract.question;
  const result = await runAskPhiosPipeline({
    input: {
      question: retrievalQuestion,
      locale: input.locale,
      surfaceContext: {
        surfaceType: "ASK_PHIOS",
        articleSlug: input.entryContext.articleCode || void 0,
        bookCode: input.entryContext.bookCode || void 0
      },
      retrievalScope: input.retrievalScope,
      requestContract: input.requestContract
    },
    request: context.request,
    env: context.env || {},
    depth: input.depth,
    retrievalOptions: { source: input.source, mode: "auto" }
  });
  const clientAnswer = projectCkaClientAnswer(result, {
    entryContext: input.entryContext,
    followUpContext: input.followUpContext,
    displayQuestion: input.q
  });
  const w5w17 = projectCkaW5W17Envelope(result, {
    displayQuestion: input.q,
    locale: input.locale,
    guidedContext: input.guidedContext,
    knowledgeContext: input.knowledgeContext
  });
  const w18w33 = projectCkaW18W33Consumption(result, w5w17, {
    locale: input.locale,
    access: input.trustedAccess,
    realityAuthorization: input.realityAuthorization
  });
  return json({
    ok: true,
    ...result,
    cka: {
      schemaVersion: "PHI-OS-CKA-RESPONSE-v1.1.0",
      requestContract: input.requestContract,
      trace: result.ptrc?.trace || null,
      entryContext: input.entryContext,
      followUp: {
        ...input.followUpContext,
        boundary: input.followUpBoundary,
        guestLimitReached: input.trustedAccess.accountState === "GUEST" && input.followUpContext.followUpDepth >= 1
      },
      clientAnswer,
      w5w17,
      w18w33,
      governance: {
        clientSurfaceOnly: true,
        upstreamAnswerRuntimeReused: true,
        secondAnswerRuntimeCreated: false,
        persistentHistoryCreated: false,
        shadowAccountCreated: false,
        requestTransport: "POST_JSON_NO_STORE",
        privateContextInQueryString: false,
        privateContextInAnalyticsPayload: false,
        entryContextProseAppendedToQuestion: false,
        guidedContextAppendedToQuestion: false,
        priorAnswerTextAppendedToQuestion: false
      }
    }
  });
}
function errorResponse(error) {
  const code = String(error?.message || "KAP_ASK_PHIOS_FAILED");
  const status = code === "CKA_REALITY_CONTEXT_NOT_AUTHORIZED" ? 403 : code === "CKA_GUEST_FOLLOW_UP_LIMIT_REACHED" ? 429 : code.startsWith("CKA_") || code === "KAP_QUESTION_INVALID" || code === "KAP_LOCALE_UNSUPPORTED" || code === "KAP_ANSWER_DEPTH_UNSUPPORTED" ? 400 : 500;
  return json({
    ok: false,
    error: { code },
    governance: {
      canonicalAuthorityCreated: false,
      publicationCreated: false,
      realityReadingCreated: false,
      persistentCaseCreated: false,
      shadowAccountCreated: false,
      methodExecuted: false,
      realityJourneyStarted: false,
      privateContextPersisted: false
    }
  }, status);
}
async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    return await execute(context, body);
  } catch (error) {
    return errorResponse(error);
  }
}

// functions/lens-router/lens-capability-current-v1.js
var LRR_CAPABILITIES = Object.freeze({
  AST: Object.freeze({ lensCode: "FUNCTION", internalCapabilityAvailability: "AVAILABLE", publicCapabilityAvailability: "AVAILABLE", publicExecutionAllowed: true, subCapabilities: Object.freeze({ NATAL: "AVAILABLE", CURRENT_DYNAMIC: "AVAILABLE", PROGRESSIONS: "NOT_ACTIVATED", RETURNS: "NOT_ACTIVATED", RELATIONAL: "NOT_ACTIVATED" }) }),
  BZR: Object.freeze({ lensCode: "TIME", internalCapabilityAvailability: "AVAILABLE", publicCapabilityAvailability: "AVAILABLE", publicExecutionAllowed: true, subCapabilities: Object.freeze({ NATAL: "AVAILABLE", TEMPORAL: "AVAILABLE", MONTHLY: "NOT_ACTIVATED", DAILY: "NOT_ACTIVATED", HOURLY: "NOT_ACTIVATED" }) }),
  ZWR: Object.freeze({ lensCode: "DOMAIN", internalCapabilityAvailability: "AVAILABLE", publicCapabilityAvailability: "AVAILABLE", publicExecutionAllowed: true, subCapabilities: Object.freeze({ NATAL: "AVAILABLE", DYNAMIC_DOMAIN: "AVAILABLE", MONTHLY: "NOT_ACTIVATED", DAILY: "NOT_ACTIVATED", HOURLY: "NOT_ACTIVATED", RELATIONAL: "NOT_ACTIVATED" }) }),
  HDR: Object.freeze({ lensCode: "OPERATION", internalCapabilityAvailability: "AVAILABLE", publicCapabilityAvailability: "RESTRICTED_INTERNAL", publicExecutionAllowed: false, subCapabilities: Object.freeze({ EXISTING_CALCULATION: "AVAILABLE", OPERATING_PROJECTION: "AVAILABLE", OPERATING_READING: "AVAILABLE", PROFESSIONAL_MANUAL_EXTENSIONS: "AVAILABLE_WITH_MANUAL_INPUT", RESTRICTED_EXTENSION_AUTOMATIC_CALCULATION: "NOT_ALLOWED", PUBLIC_SELF_SERVICE: "RESTRICTED_INTERNAL", RELATIONAL: "NOT_ACTIVATED", TRANSIT: "NOT_ACTIVATED" }) }),
  NUM: Object.freeze({ lensCode: "RHYTHM", internalCapabilityAvailability: "AVAILABLE", publicCapabilityAvailability: "AVAILABLE", publicExecutionAllowed: true, subCapabilities: Object.freeze({}) })
});

// functions/lens-router/lens-router-runtime.js
var LRR_TAXONOMY = Object.freeze(["STRUCTURE", "TIME", "CURRENT", "DOMAIN", "DECISION", "RELATIONSHIP", "RHYTHM", "REALITY_FACT", "PROFESSIONAL"]);
var PRECEDENCE = Object.freeze(["PROFESSIONAL", "REALITY_FACT", "RELATIONSHIP", "DECISION", "CURRENT", "RHYTHM", "TIME", "DOMAIN", "STRUCTURE"]);
var SIGNALS = Object.freeze({
  PROFESSIONAL: ["diagnose", "diagnosis", "treatment", "dosage", "prescription", "legal advice", "\u6CD5\u5F8B\u610F\u89C1", "\u8BCA\u65AD", "\u6CBB\u7597", "\u5242\u91CF", "\u5904\u65B9", "\u533B\u751F\u5E94\u8BE5", "\u5F8B\u5E08\u5E94\u8BE5", "\u7A0E\u52A1\u610F\u89C1"],
  REALITY_FACT: ["weather", "price today", "latest news", "current law", "current regulation", "who is the current", "what actually happened", "\u5929\u6C14", "\u4ECA\u5929\u4EF7\u683C", "\u6700\u65B0\u65B0\u95FB", "\u73B0\u884C\u6CD5\u5F8B", "\u73B0\u884C\u6CD5\u89C4", "\u5B9E\u9645\u53D1\u751F\u4E86\u4EC0\u4E48", "\u4E8B\u5B9E\u662F\u4EC0\u4E48"],
  RELATIONSHIP: ["between us", "me and my partner", "my partner and i", "our relationship", "with this person", "my husband", "my wife", "my spouse", "my boyfriend", "my girlfriend", "husband", "wife", "spouse", "partner", "boyfriend", "girlfriend", "\u6211\u548C\u4ED6", "\u6211\u548C\u5979", "\u6211\u548C\u4F34\u4FA3", "\u6211\u4EEC\u4E4B\u95F4", "\u8FD9\u6BB5\u5173\u7CFB", "\u4E24\u4E2A\u4EBA\u4E4B\u95F4", "\u6211\u4E08\u592B", "\u6211\u7684\u4E08\u592B", "\u4E08\u592B", "\u8001\u516C", "\u6211\u59BB\u5B50", "\u6211\u7684\u59BB\u5B50", "\u59BB\u5B50", "\u8001\u5A46", "\u914D\u5076", "\u4F34\u4FA3", "\u7537\u670B\u53CB", "\u5973\u670B\u53CB", "\u5BF9\u8C61"],
  DECISION: ["should i", "should we", "should i accept", "should i leave", "which should i choose", "decision", "decide", "\u8BE5\u4E0D\u8BE5", "\u662F\u5426\u5E94\u8BE5", "\u8981\u4E0D\u8981", "\u5E94\u8BE5\u9009\u62E9", "\u600E\u4E48\u51B3\u5B9A", "\u8FD9\u4E2A\u51B3\u5B9A", "\u5E94\u8BE5\u63A5\u53D7", "\u5E94\u8BE5\u79BB\u5F00", "\u5E94\u8BE5\u7EE7\u7EED"],
  CURRENT: ["right now", "currently", "at the moment", "recently", "today's activation", "current activation", "\u73B0\u5728", "\u5F53\u4E0B", "\u76EE\u524D", "\u6700\u8FD1", "\u6B64\u523B", "\u5F53\u524D\u6FC0\u6D3B"],
  RHYTHM: ["rhythm", "personal year", "personal month", "personal day", "cycle number", "numerology cycle", "\u8282\u594F", "\u4E2A\u4EBA\u5E74", "\u4E2A\u4EBA\u6708", "\u4E2A\u4EBA\u65E5", "\u6570\u5B57\u5468\u671F", "\u6570\u79D8\u5468\u671F"],
  TIME: ["this year", "next year", "last year", "annual", "long cycle", "luck cycle", "period", "timing", "year ahead", "\u4ECA\u5E74", "\u660E\u5E74", "\u53BB\u5E74", "\u5E74\u5EA6", "\u6D41\u5E74", "\u5927\u8FD0", "\u957F\u671F\u5468\u671F", "\u65F6\u95F4\u7ED3\u6784", "\u9636\u6BB5"],
  DOMAIN: ["career domain", "wealth domain", "partnership domain", "family domain", "home domain", "health domain", "life area", "\u4E8B\u4E1A\u9886\u57DF", "\u4E8B\u4E1A\u5BAB", "\u8D22\u5E1B", "\u8D22\u5BCC\u9886\u57DF", "\u592B\u59BB\u5BAB", "\u5173\u7CFB\u9886\u57DF", "\u5BB6\u5EAD\u9886\u57DF", "\u7530\u5B85", "\u5065\u5EB7\u9886\u57DF", "\u75BE\u5384", "\u4EBA\u751F\u9886\u57DF", "\u4E8B\u4E1A", "\u804C\u4E1A", "\u5DE5\u4F5C", "career", "wealth", "partnership", "family", "health"],
  STRUCTURE: ["natal", "birth structure", "core structure", "functional structure", "how am i structured", "\u51FA\u751F\u7ED3\u6784", "\u672C\u547D", "\u539F\u5C40", "\u5E95\u5C42\u7ED3\u6784", "\u529F\u80FD\u7ED3\u6784", "\u6211\u662F\u600E\u6837\u8FD0\u4F5C", "\u751F\u547D\u7ED3\u6784", "life structure"]
});
var COMPOUNDS = Object.freeze([
  { requires: ["TIME", "DOMAIN"], primary: "TIME", secondary: ["DOMAIN"] },
  { requires: ["CURRENT", "DOMAIN"], primary: "CURRENT", secondary: ["DOMAIN"] },
  { requires: ["DECISION", "DOMAIN"], primary: "DECISION", secondary: ["DOMAIN"] },
  { requires: ["RHYTHM", "TIME"], primary: "RHYTHM", secondary: ["TIME"] },
  { requires: ["DOMAIN", "STRUCTURE"], primary: "DOMAIN", secondary: ["STRUCTURE"] }
]);
var PRIMARY = Object.freeze({
  STRUCTURE: { lensCode: "FUNCTION", pluginCode: "AST", subCapability: "NATAL" },
  TIME: { lensCode: "TIME", pluginCode: "BZR", subCapability: "TEMPORAL" },
  CURRENT: { lensCode: "FUNCTION", pluginCode: "AST", subCapability: "CURRENT_DYNAMIC" },
  DOMAIN: { lensCode: "DOMAIN", pluginCode: "ZWR", subCapability: "NATAL" },
  DECISION: { lensCode: "OPERATION", pluginCode: "HDR", subCapability: "OPERATING_READING", realityEvidenceRequired: true },
  RHYTHM: { lensCode: "RHYTHM", pluginCode: "NUM", subCapability: null }
});
var SECONDARY = Object.freeze({
  STRUCTURE: { lensCode: "FUNCTION", pluginCode: "AST", subCapability: "NATAL", role: "SUPPORTING" },
  TIME: { lensCode: "TIME", pluginCode: "BZR", subCapability: "TEMPORAL", role: "CONTEXTUAL" },
  CURRENT: { lensCode: "FUNCTION", pluginCode: "AST", subCapability: "CURRENT_DYNAMIC", role: "CONTEXTUAL" },
  DOMAIN: { lensCode: "DOMAIN", pluginCode: "ZWR", subCapability: "DYNAMIC_DOMAIN", role: "SUPPORTING" },
  RHYTHM: { lensCode: "RHYTHM", pluginCode: "NUM", subCapability: null, role: "SUPPORTING" }
});
var DEFAULT_SUPPORT = Object.freeze({
  TIME: [{ lensCode: "RHYTHM", pluginCode: "NUM", subCapability: null, role: "SUPPORTING" }],
  RHYTHM: [{ lensCode: "TIME", pluginCode: "BZR", subCapability: "TEMPORAL", role: "CONTEXTUAL" }]
});
var HDR_INTERNAL_ACCESS = /* @__PURE__ */ new Set(["GOVERNED_INTERNAL_PROFESSIONAL", "GOVERNED_INTERNAL_QA"]);
function freeze5(v) {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v)) freeze5(x);
  }
  return v;
}
function normalize2(q) {
  return String(q || "").normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}
function isLatinPhrase(s) {
  return /^[a-z0-9' -]+$/i.test(s);
}
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function matches(text5, signal) {
  if (!signal) return false;
  if (!isLatinPhrase(signal)) return text5.includes(signal.toLowerCase());
  const p = escapeRegex(signal.toLowerCase()).replace(/\\ /g, "\\s+");
  return new RegExp(`(?:^|[^a-z0-9])${p}(?=$|[^a-z0-9])`, "i").test(text5);
}
function matchedSignals(text5, category) {
  return SIGNALS[category].filter((s) => matches(text5, s));
}
function priorityIndex(code) {
  const i = PRECEDENCE.indexOf(code);
  return i < 0 ? 999 : i;
}
function classifyLensQuestion({ question, taxonomyHint = null } = {}) {
  const text5 = normalize2(question);
  if (taxonomyHint != null && !LRR_TAXONOMY.includes(taxonomyHint)) throw Object.assign(new Error("LRR_TAXONOMY_HINT_INVALID"), { code: "LRR_TAXONOMY_HINT_INVALID", status: 400 });
  const evidence = {};
  for (const c of LRR_TAXONOMY) {
    const m = matchedSignals(text5, c);
    if (m.length) evidence[c] = m;
  }
  const matched = Object.keys(evidence).sort((a, b) => priorityIndex(a) - priorityIndex(b));
  if (taxonomyHint) {
    const secondary = matched.filter((x) => x !== taxonomyHint).slice(0, 2);
    return freeze5({ taxonomy: taxonomyHint, secondaryTaxonomy: secondary, classificationState: "CLASSIFIED", classificationAuthority: "EXPLICIT_FROZEN_TAXONOMY_HINT", evidence: freeze5({ taxonomyHint, matchedSignals: evidence }) });
  }
  if (!text5 || matched.length === 0) return freeze5({ taxonomy: "NEEDS_CONTEXT", secondaryTaxonomy: [], classificationState: "NEEDS_CONTEXT", classificationAuthority: "DETERMINISTIC_BOUNDED_RULES_V1", evidence: freeze5({ matchedSignals: {} }) });
  for (const c of ["PROFESSIONAL", "REALITY_FACT", "RELATIONSHIP"]) if (matched.includes(c)) return freeze5({ taxonomy: c, secondaryTaxonomy: matched.filter((x) => x !== c).slice(0, 2), classificationState: "CLASSIFIED", classificationAuthority: "DETERMINISTIC_BOUNDED_RULES_V1", evidence: freeze5({ matchedSignals: evidence }) });
  for (const r of COMPOUNDS) if (r.requires.every((x) => matched.includes(x))) return freeze5({ taxonomy: r.primary, secondaryTaxonomy: r.secondary, classificationState: "CLASSIFIED", classificationAuthority: "DETERMINISTIC_BOUNDED_RULES_V1", evidence: freeze5({ compound: r.requires.join("_"), matchedSignals: evidence }) });
  const primary = matched[0];
  return freeze5({ taxonomy: primary, secondaryTaxonomy: matched.filter((x) => x !== primary).slice(0, 2), classificationState: "CLASSIFIED", classificationAuthority: "DETERMINISTIC_BOUNDED_RULES_V1", evidence: freeze5({ matchedSignals: evidence }) });
}
function routePrimaryLens(classification) {
  const t = classification?.taxonomy;
  if (t === "NEEDS_CONTEXT" || t === "AMBIGUOUS") return freeze5({ routeState: "NEEDS_CONTEXT", candidate: null });
  if (t === "RELATIONSHIP") return freeze5({ routeState: "REQUIRED_RUNTIME_NOT_ACTIVATED", candidate: null, requiredRuntime: "RELATIONAL_RUNTIME" });
  if (t === "REALITY_FACT") return freeze5({ routeState: "REALITY_EVIDENCE_ONLY", candidate: null, authority: "REALITY_EVIDENCE" });
  if (t === "PROFESSIONAL") return freeze5({ routeState: "PROFESSIONAL_HANDOFF_REQUIRED", candidate: null, authority: "PROFESSIONAL_HANDOFF" });
  const p = PRIMARY[t];
  if (!p) throw Object.assign(new Error("LRR_PRIMARY_ROUTE_UNDEFINED"), { code: "LRR_PRIMARY_ROUTE_UNDEFINED" });
  return freeze5({ routeState: "CANDIDATE", candidate: freeze5({ ...p, role: "PRIMARY" }) });
}
function resolveSupportingLenses(classification, primaryCandidate) {
  const secondary = (classification?.secondaryTaxonomy || []).map((x) => SECONDARY[x]).filter(Boolean);
  let chosen = secondary.length ? secondary : [...DEFAULT_SUPPORT[classification?.taxonomy] || []];
  chosen = chosen.filter((x) => !(primaryCandidate && x.pluginCode === primaryCandidate.pluginCode && x.subCapability === primaryCandidate.subCapability));
  const seen = /* @__PURE__ */ new Set();
  chosen = chosen.filter((x) => {
    const k = `${x.pluginCode}:${x.subCapability || ""}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 2);
  return freeze5(chosen.map((x) => freeze5({ ...x })));
}
function gateLensCapability(candidate, { publicRequest = true, internalAccessClass = null } = {}) {
  if (!candidate) return freeze5({ routeState: "BLOCKED_CAPABILITY", allowed: false, reason: "LRR_CANDIDATE_REQUIRED" });
  const cap = LRR_CAPABILITIES[candidate.pluginCode];
  if (!cap) return freeze5({ routeState: "BLOCKED_CAPABILITY", allowed: false, reason: "LRR_CAPABILITY_RECORD_MISSING" });
  if (cap.lensCode !== candidate.lensCode) return freeze5({ routeState: "BLOCKED_CAPABILITY", allowed: false, reason: "LRR_LENS_CAPABILITY_MISMATCH" });
  const sub = candidate.subCapability;
  if (sub && cap.subCapabilities[sub] && cap.subCapabilities[sub] !== "AVAILABLE" && cap.subCapabilities[sub] !== "AVAILABLE_WITH_MANUAL_INPUT") return freeze5({ routeState: "BLOCKED_CAPABILITY", allowed: false, reason: "LRR_SUBCAPABILITY_NOT_ACTIVATED", availability: cap.subCapabilities[sub] });
  if (publicRequest) {
    if (cap.publicCapabilityAvailability !== "AVAILABLE" || cap.publicExecutionAllowed !== true) return freeze5({ routeState: "BLOCKED_CAPABILITY", allowed: false, reason: "LRR_PUBLIC_CAPABILITY_NOT_AVAILABLE", availability: cap.publicCapabilityAvailability, noSilentFallback: true });
    return freeze5({ routeState: "ROUTABLE", allowed: true, visibility: "PUBLIC_PRODUCTION", executionCompleteness: "PER_EXECUTION" });
  }
  if (cap.internalCapabilityAvailability !== "AVAILABLE") return freeze5({ routeState: "BLOCKED_CAPABILITY", allowed: false, reason: "LRR_INTERNAL_CAPABILITY_NOT_AVAILABLE", availability: cap.internalCapabilityAvailability });
  if (candidate.pluginCode === "HDR" && !HDR_INTERNAL_ACCESS.has(internalAccessClass)) return freeze5({ routeState: "BLOCKED_CAPABILITY", allowed: false, reason: "LRR_HDR_INTERNAL_ACCESS_REQUIRED", noSilentFallback: true });
  return freeze5({ routeState: candidate.pluginCode === "HDR" ? "ROUTABLE_INTERNAL_ONLY" : "ROUTABLE", allowed: true, visibility: "GOVERNED_INTERNAL", executionCompleteness: "PER_EXECUTION" });
}
function routeLensQuestion({ question, taxonomyHint = null, publicRequest = true, internalAccessClass = null } = {}) {
  const classification = classifyLensQuestion({ question, taxonomyHint });
  const primaryRoute = routePrimaryLens(classification);
  if (primaryRoute.routeState !== "CANDIDATE") return freeze5({ schemaVersion: "PHI-OS-LENS-ROUTE-PLAN-v1.0.0", question, classification, routeState: primaryRoute.routeState, primary: null, supporting: [], blockedSupporting: [], authority: primaryRoute.authority || null, requiredRuntime: primaryRoute.requiredRuntime || null, boundaries: freeze5({ methodVotingCreated: false, silentFallbackUsed: false, meaningCreated: false, runtimeExecuted: false, realityEvidenceFinalAuthority: true }) });
  const gate = gateLensCapability(primaryRoute.candidate, { publicRequest, internalAccessClass });
  const supportCandidates = resolveSupportingLenses(classification, primaryRoute.candidate);
  const supporting = [], blockedSupporting = [];
  for (const c of supportCandidates) {
    const g = gateLensCapability(c, { publicRequest, internalAccessClass });
    if (g.allowed) supporting.push(freeze5({ candidate: c, gate: g }));
    else blockedSupporting.push(freeze5({ candidate: c, gate: g }));
  }
  return freeze5({ schemaVersion: "PHI-OS-LENS-ROUTE-PLAN-v1.0.0", question, classification, routeState: gate.routeState, primary: freeze5({ candidate: primaryRoute.candidate, gate }), supporting: freeze5(supporting), blockedSupporting: freeze5(blockedSupporting), requirements: freeze5({ realityEvidenceRequired: classification.taxonomy === "DECISION", executionInputsResolved: false }), boundaries: freeze5({ methodVotingCreated: false, silentFallbackUsed: false, meaningCreated: false, runtimeExecuted: false, realityEvidenceFinalAuthority: true }) });
}

// functions/relational/relational-route-runtime.js
var RELATIONAL_ROUTE_PLAN_SCHEMA = "PHI-OS-RELATIONAL-ROUTE-PLAN-v1.0.0";
function routeRelationalQuestion(input) {
  const base = routeLensQuestion(input);
  if (base.classification?.taxonomy !== "RELATIONSHIP") throw Object.assign(new Error("RLR_RELATIONSHIP_TAXONOMY_REQUIRED"), { code: "RLR_RELATIONSHIP_TAXONOMY_REQUIRED", status: 400 });
  if (base.routeState !== "REQUIRED_RUNTIME_NOT_ACTIVATED" || base.requiredRuntime !== "RELATIONAL_RUNTIME") throw Object.assign(new Error("RLR_LRR_PREDECESSOR_STATE_INVALID"), { code: "RLR_LRR_PREDECESSOR_STATE_INVALID", status: 409 });
  const publicRequest = input?.publicRequest !== false;
  return Object.freeze({ schemaVersion: RELATIONAL_ROUTE_PLAN_SCHEMA, relationshipRuntimeCode: "PHI_OS_RELATIONAL_RUNTIME", routeState: publicRequest ? "RELATIONAL_RUNTIME_ROUTABLE" : "RELATIONAL_RUNTIME_ROUTABLE_INTERNAL", classification: base.classification, publicRequest, internalAccessClass: input?.internalAccessClass ?? null, components: Object.freeze([{ componentCode: "AST_RELATIONAL_STRUCTURE", pluginCode: "AST", availability: "AVAILABLE", role: "PRIMARY_STRUCTURE" }, { componentCode: "ZI_WEI_PARTNERSHIP_DOMAIN_CONTEXT", pluginCode: "ZWR", availability: "AVAILABLE_CONTEXTUAL_ONLY", role: "CONTEXTUAL" }, { componentCode: "BZR_RELATIONAL_TEMPORAL_CONTEXT", pluginCode: "BZR", availability: "AVAILABLE_CONTEXTUAL_ONLY", role: "CONTEXTUAL" }, { componentCode: "HDR_INTERNAL_RELATIONAL_STRUCTURE", pluginCode: "HDR", availability: publicRequest ? "RESTRICTED_INTERNAL" : "INTERNAL_AVAILABLE", role: "OPTIONAL_INTERNAL_CONTEXT" }]), realityEvidenceRequiredBeforeOutcomeClaim: true, boundaries: Object.freeze({ methodRuntimeExecuted: false, natalRuntimeRecalculated: false, compatibilityScoreCreated: false, relationshipVerdictCreated: false, methodVotingCreated: false, silentFallbackUsed: false, realityEvidenceFinalAuthority: true }) });
}

// functions/current-web-authority/current-web-authority-runtime.js
var CWA_EVIDENCE_SCHEMA = "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0";
var PRECEDENCE2 = Object.freeze({ OFFICIAL_PRIMARY: 100, REGULATOR: 95, PUBLIC_HEALTH: 95, GOVERNMENT: 90, OFFICIAL_COMPANY: 85, ACADEMIC: 80, MARKET_DATA_PROVIDER: 78, REPUTABLE_NEWS: 70, SECONDARY_REFERENCE: 55, COMMUNITY: 25 });
var DOMAIN_ALLOWED = Object.freeze({ HEALTH: /* @__PURE__ */ new Set(["OFFICIAL_PRIMARY", "REGULATOR", "PUBLIC_HEALTH", "GOVERNMENT", "ACADEMIC"]), FINANCIAL_MARKETS: /* @__PURE__ */ new Set(["OFFICIAL_PRIMARY", "REGULATOR", "GOVERNMENT", "MARKET_DATA_PROVIDER", "OFFICIAL_COMPANY", "REPUTABLE_NEWS"]), COMPANY_PRODUCT: /* @__PURE__ */ new Set(["OFFICIAL_PRIMARY", "OFFICIAL_COMPANY", "REGULATOR", "REPUTABLE_NEWS", "SECONDARY_REFERENCE"]), NEWS_CURRENT_EVENTS: /* @__PURE__ */ new Set(["OFFICIAL_PRIMARY", "GOVERNMENT", "REGULATOR", "REPUTABLE_NEWS"]), WEATHER: /* @__PURE__ */ new Set(["OFFICIAL_PRIMARY", "GOVERNMENT", "SECONDARY_REFERENCE"]), GENERAL_CURRENT: /* @__PURE__ */ new Set(["OFFICIAL_PRIMARY", "GOVERNMENT", "REGULATOR", "OFFICIAL_COMPANY", "ACADEMIC", "REPUTABLE_NEWS", "SECONDARY_REFERENCE"]) });
var TTL = Object.freeze({ STOCK_OR_MARKET_PRICE: 900, WEATHER_CURRENT: 10800, BREAKING_NEWS: 86400, NEWS_DEVELOPMENT: 604800, PUBLIC_HEALTH_ALERT: 86400, GENERAL_CURRENT_FACT: 604800 });
var CLAIM_ALLOWED = Object.freeze({ HEALTH: /* @__PURE__ */ new Set(["PUBLIC_HEALTH_ALERT", "MEDICAL_GUIDELINE", "GENERAL_CURRENT_FACT", "NEWS_DEVELOPMENT"]), FINANCIAL_MARKETS: /* @__PURE__ */ new Set(["STOCK_OR_MARKET_PRICE", "POLICY_OR_REGULATION", "BREAKING_NEWS", "NEWS_DEVELOPMENT", "GENERAL_CURRENT_FACT"]), COMPANY_PRODUCT: /* @__PURE__ */ new Set(["COMPANY_PRODUCT_SPEC", "POLICY_OR_REGULATION", "BREAKING_NEWS", "NEWS_DEVELOPMENT", "GENERAL_CURRENT_FACT"]), NEWS_CURRENT_EVENTS: /* @__PURE__ */ new Set(["BREAKING_NEWS", "NEWS_DEVELOPMENT", "GENERAL_CURRENT_FACT"]), WEATHER: /* @__PURE__ */ new Set(["WEATHER_CURRENT", "GENERAL_CURRENT_FACT"]), GENERAL_CURRENT: /* @__PURE__ */ new Set(["GENERAL_CURRENT_FACT", "BREAKING_NEWS", "NEWS_DEVELOPMENT", "POLICY_OR_REGULATION", "COMPANY_PRODUCT_SPEC"]) });
function fail5(code, status = 422) {
  const e = new Error(code);
  e.code = code;
  e.status = status;
  throw e;
}
function freeze6(v) {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v)) freeze6(x);
  }
  return v;
}
function iso(v, code) {
  const d = new Date(v);
  if (!v || Number.isNaN(d.valueOf())) fail5(code, 400);
  return d.toISOString();
}
function safeUrl(value) {
  let u;
  try {
    u = new URL(value);
  } catch {
    fail5("CWA_URL_INVALID", 400);
  }
  if (u.protocol !== "https:") fail5("CWA_HTTPS_REQUIRED", 400);
  u.hash = "";
  return u.toString();
}
function discoverCurrentSourceCandidates({ query = "", domain = "GENERAL_CURRENT", currentnessRequirement = "CURRENTNESS_REQUIRED", results = [] } = {}) {
  if (!String(query).trim()) fail5("CWA_DISCOVERY_QUERY_REQUIRED", 400);
  if (!DOMAIN_ALLOWED[domain]) fail5("CWA_DOMAIN_UNKNOWN", 400);
  if (currentnessRequirement === "CURRENTNESS_NONE") return freeze6({ state: "CWA_NOT_CALLED", query: String(query).trim(), domain, currentnessRequirement, candidates: [] });
  if (!Array.isArray(results)) fail5("CWA_DISCOVERY_RESULTS_ARRAY_REQUIRED", 400);
  return freeze6({ state: "CANDIDATES_DISCOVERED_NOT_ADMITTED", query: String(query).trim(), domain, currentnessRequirement, candidates: results.map(normalizeCurrentSourceCandidate), boundaries: freeze6({ searchResultIsFact: false, searchRankIsAuthority: false }) });
}
function normalizeCurrentSourceCandidate({ url, publisher, title, publishedAt = null, retrievedAt, authorityClassHint = null, sourceVersionHint = null } = {}) {
  if (!publisher?.trim() || !title?.trim()) fail5("CWA_SOURCE_METADATA_REQUIRED", 400);
  return freeze6({ url: safeUrl(url), publisher: publisher.trim(), title: title.trim(), publishedAt: publishedAt ? iso(publishedAt, "CWA_PUBLISHED_AT_INVALID") : null, retrievedAt: iso(retrievedAt, "CWA_RETRIEVED_AT_INVALID"), authorityClassHint: authorityClassHint || null, sourceVersionHint: sourceVersionHint || null, admissionState: "CANDIDATE_ONLY", isFact: false, isAuthority: false });
}
function evaluateCurrentness({ claimType, retrievedAt, now = (/* @__PURE__ */ new Date()).toISOString(), sourceVersionCurrent = null, superseded = false } = {}) {
  const r = new Date(iso(retrievedAt, "CWA_RETRIEVED_AT_INVALID")), n = new Date(iso(now, "CWA_NOW_INVALID"));
  if (r > n) fail5("CWA_RETRIEVAL_FROM_FUTURE", 400);
  if (TTL[claimType] != null) {
    const age = Math.floor((n - r) / 1e3);
    return freeze6({ freshnessState: age <= TTL[claimType] ? "FRESH" : "STALE", mode: "TTL", ageSeconds: age, ttlSeconds: TTL[claimType] });
  }
  if (claimType === "POLICY_OR_REGULATION") return freeze6({ freshnessState: superseded ? "STALE" : "FRESH_UNTIL_SUPERSEDED", mode: "UNTIL_SUPERSEDED" });
  if (claimType === "MEDICAL_GUIDELINE" || claimType === "COMPANY_PRODUCT_SPEC") return freeze6({ freshnessState: sourceVersionCurrent === true ? "FRESH_VERSION_BOUND" : "VERSION_CHECK_REQUIRED", mode: claimType === "MEDICAL_GUIDELINE" ? "VERSION_BOUND" : "CURRENT_RELEASE" });
  return freeze6({ freshnessState: "NO_FRESHNESS_POLICY", mode: "REJECT" });
}
function admitCurrentSource({ candidate, domain, authorityClass: authorityClass2, claimType, now, sourceVersionCurrent = null, superseded = false, sourceId, sourceVersionOrDigest } = {}) {
  if (!candidate || candidate.admissionState !== "CANDIDATE_ONLY") fail5("CWA_CANDIDATE_REQUIRED", 400);
  const allowed = DOMAIN_ALLOWED[domain];
  if (!allowed) fail5("CWA_DOMAIN_UNKNOWN", 400);
  if (!PRECEDENCE2[authorityClass2]) fail5("CWA_AUTHORITY_CLASS_UNKNOWN", 400);
  if (!allowed.has(authorityClass2)) return freeze6({ admissionState: "REJECTED", reason: "CWA_AUTHORITY_NOT_ALLOWED_FOR_DOMAIN", domain, authorityClass: authorityClass2 });
  const claimAllowed = CLAIM_ALLOWED[domain];
  if (!claimAllowed?.has(claimType)) return freeze6({ admissionState: "REJECTED", reason: "CWA_CLAIM_TYPE_NOT_ALLOWED_FOR_DOMAIN", domain, authorityClass: authorityClass2, claimType });
  const freshness = evaluateCurrentness({ claimType, retrievedAt: candidate.retrievedAt, now, sourceVersionCurrent, superseded });
  if (["STALE", "VERSION_CHECK_REQUIRED", "NO_FRESHNESS_POLICY"].includes(freshness.freshnessState)) return freeze6({ admissionState: freshness.freshnessState === "STALE" ? "STALE" : "REJECTED", reason: "CWA_FRESHNESS_NOT_ADMITTED", domain, authorityClass: authorityClass2, freshness });
  if (!sourceId?.trim() || !sourceVersionOrDigest?.trim()) fail5("CWA_PROVENANCE_REQUIRED", 400);
  return freeze6({ admissionState: "ADMITTED", source: { sourceId: sourceId.trim(), sourceVersionOrDigest: sourceVersionOrDigest.trim(), ...candidate, authorityClass: authorityClass2, domain }, claimType, freshness, authorityPrecedence: PRECEDENCE2[authorityClass2], sourceCountIsAuthority: false });
}
function createCurrentEvidence({ claimId, claimText, claimType, admission, publishedAt = null, supportLevel = "DIRECT", jurisdiction = null, conflicts = [] } = {}) {
  if (admission?.admissionState !== "ADMITTED") fail5("CWA_ADMITTED_SOURCE_REQUIRED", 409);
  if (!claimId?.trim() || !claimText?.trim()) fail5("CWA_CLAIM_REQUIRED", 400);
  return freeze6({ schemaVersion: CWA_EVIDENCE_SCHEMA, claimId: claimId.trim(), claimText: claimText.trim(), claimType, sourceId: admission.source.sourceId, sourceUrl: admission.source.url, authorityClass: admission.source.authorityClass, publisher: admission.source.publisher, title: admission.source.title, publishedAt: publishedAt || admission.source.publishedAt, retrievedAt: admission.source.retrievedAt, sourceVersion: admission.source.sourceVersionOrDigest, freshnessState: admission.freshness.freshnessState, supportLevel, jurisdiction, domain: admission.source.domain, conflicts: [...conflicts], boundaries: freeze6({ searchRankUsedAsAuthority: false, sourceVotingUsed: false, lensMutationAllowed: false, proseGenerationAllowed: false }) });
}
function classifyCurrentnessRequirement({ question = "", domain = "GENERAL_CURRENT" } = {}) {
  const q = String(question).toLowerCase();
  if (/today|current|currently|latest|recent|now|this week|this month|今天|目前|当前|现在|最新|最近/.test(q)) {
    if (domain === "HEALTH") return "CURRENTNESS_CRITICAL";
    return "CURRENTNESS_REQUIRED";
  }
  return "CURRENTNESS_NONE";
}

// functions/ask2/ask2-orchestrator.js
var ASK2_PLAN_SCHEMA = "PHI-OS-ASK2-ORCHESTRATION-PLAN-v1.0.0";
var ASK2_COMPOSITION_SCHEMA = "PHI-OS-ASK2-BOUNDED-COMPOSITION-v1.0.0";
var EVIDENCE_FIRST = /* @__PURE__ */ new Set(["CURRENT", "DECISION", "RELATIONSHIP", "REALITY_FACT"]);
var ORIGINS = /* @__PURE__ */ new Set(["DETERMINISTIC_RUNTIME", "GOVERNED_RUNTIME", "PROFESSIONAL_MANUAL_INPUT"]);
var ROUTE_LABELS = Object.freeze({
  "AST:NATAL": "Astrology Function Lens",
  "AST:CURRENT_DYNAMIC": "Astrology Current / Transit Lens",
  "BZR:TEMPORAL": "BaZi Temporal Lens",
  "ZWR:NATAL": "Zi Wei Domain Lens",
  "ZWR:DYNAMIC_DOMAIN": "Zi Wei Dynamic Domain Lens",
  "HDR:OPERATING_READING": "Internal Operating Lens",
  "NUM:": "Numeric Rhythm Lens",
  "RELATIONAL_RUNTIME:": "Relational Runtime"
});
var WHY = Object.freeze({
  STRUCTURE: "I am using the Astrology Function Lens because your question is mainly structural.",
  TIME: "I am using the BaZi Temporal Lens because your question is mainly temporal.",
  CURRENT: "I am using the Astrology Current / Transit Lens because your question is mainly about current dynamics.",
  DOMAIN: "I am using the Zi Wei Domain Lens because your question is mainly about a life area.",
  DECISION: "I am using the Internal Operating Lens because your question is mainly about how a decision is processed.",
  RHYTHM: "I am using the Numeric Rhythm Lens because your question is mainly about rhythm or cycle.",
  RELATIONSHIP: "I am using the Relational Runtime because your question is about interaction between two explicitly identified people.",
  REALITY_FACT: "No symbolic lens is primary because this question is asking for reality evidence.",
  PROFESSIONAL: "Professional authority is required; a symbolic lens cannot replace professional judgment.",
  NEEDS_CONTEXT: "More context is needed before PHI OS selects a lens."
});
function freeze7(v) {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v)) freeze7(x);
  }
  return v;
}
function fail6(code, status = 422) {
  const e = new Error(code);
  e.code = code;
  e.status = status;
  throw e;
}
function routeKey(candidate) {
  return `${candidate?.pluginCode || ""}:${candidate?.subCapability || ""}`;
}
function disclosureFor(candidate, role) {
  if (!candidate) return null;
  const key = routeKey(candidate);
  return freeze7({ role, label: ROUTE_LABELS[key] || `${candidate.pluginCode} ${candidate.subCapability || candidate.lensCode} Lens`, pluginCode: candidate.pluginCode, lensCode: candidate.lensCode, subCapability: candidate.subCapability ?? null });
}
function normalizeAsk2TaxonomyHint(question, taxonomyHint) {
  if (taxonomyHint != null) return taxonomyHint;
  const q = String(question || "").normalize("NFKC");
  if (/怎样做决定|如何做决定/.test(q)) return "DECISION";
  return null;
}
function currentEvidenceValid(item) {
  return item?.schemaVersion === "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0" && item?.boundaries?.searchRankUsedAsAuthority === false && item?.boundaries?.sourceVotingUsed === false && item?.boundaries?.lensMutationAllowed === false;
}
function ccrValid(snapshot) {
  return snapshot?.schemaVersion === "PHI-OS-CURRENT-CONTEXT-SNAPSHOT-v1.0.0";
}
function createLensDisclosure(routePlan) {
  const primary = routePlan?.primary?.candidate ? disclosureFor(routePlan.primary.candidate, "PRIMARY") : null;
  const supporting = (routePlan?.supporting || []).map((x) => disclosureFor(x.candidate, x.candidate?.role || "SUPPORTING")).filter(Boolean);
  return freeze7({ schemaVersion: "PHI-OS-ASK2-LENS-DISCLOSURE-v1.0.0", primary, supporting, visibleConsumedLensCount: Number(Boolean(primary)) + supporting.length, silentLensConsumption: false });
}
function explainLensSelection(routePlan) {
  const taxonomy = routePlan?.classification?.taxonomy || "NEEDS_CONTEXT";
  return freeze7({ schemaVersion: "PHI-OS-ASK2-WHY-THIS-LENS-v1.0.0", taxonomy, reason: WHY[taxonomy] || WHY.NEEDS_CONTEXT, authority: "LRR_QUESTION_TAXONOMY_AND_ROUTE_PLAN", methodSuperiorityClaimed: false, truthProofClaimed: false });
}
function buildAsk2OrchestrationPlan({
  question,
  taxonomyHint = null,
  domain = "GENERAL_CURRENT",
  publicRequest = true,
  internalAccessClass = null,
  currentContextSnapshot = null,
  currentExternalEvidence = [],
  externalCurrentRequired = null
} = {}) {
  if (!String(question || "").trim()) fail6("ASK2_QUESTION_REQUIRED", 400);
  const currentnessRequirement = classifyCurrentnessRequirement({ question, domain });
  const effectiveTaxonomyHint = normalizeAsk2TaxonomyHint(question, taxonomyHint);
  let routePlan = routeLensQuestion({ question, taxonomyHint: effectiveTaxonomyHint, publicRequest, internalAccessClass });
  let relationalPlan = null;
  if (routePlan.classification?.taxonomy === "RELATIONSHIP") {
    relationalPlan = routeRelationalQuestion({ question, taxonomyHint: "RELATIONSHIP", publicRequest, internalAccessClass });
  }
  const taxonomy = routePlan.classification?.taxonomy;
  const external = Array.isArray(currentExternalEvidence) ? currentExternalEvidence : [];
  if (external.some((x) => !currentEvidenceValid(x))) fail6("ASK2_CURRENT_EXTERNAL_EVIDENCE_NOT_ADMITTED", 409);
  const externalSignals = /(external|market|economy|economic|interest rate|opr|policy|regulation|news|weather|outbreak|cases|外部|市场|经济|利率|政策|新闻|天气|病例|疫情)/i.test(String(question));
  const mustUseExternal = externalCurrentRequired === true || externalCurrentRequired !== false && taxonomy === "REALITY_FACT" && currentnessRequirement !== "CURRENTNESS_NONE" || externalCurrentRequired !== false && externalSignals && currentnessRequirement !== "CURRENTNESS_NONE";
  if (mustUseExternal && external.length === 0) {
    return freeze7({ schemaVersion: ASK2_PLAN_SCHEMA, question, domain, taxonomy, currentnessRequirement, routePlan, relationalPlan, orchestrationState: "CURRENT_EXTERNAL_EVIDENCE_REQUIRED", currentReality: { internal: currentContextSnapshot || null, external: [] }, executionRequests: [], lensDisclosure: createLensDisclosure(routePlan), whyThisLens: explainLensSelection(routePlan), boundaries: freeze7({ runtimeFirst: true, modelCalculationAllowed: false, rawWebResultAllowed: false, lensMayMutateEvidence: false, methodVotingAllowed: false }) });
  }
  if (currentContextSnapshot != null && !ccrValid(currentContextSnapshot)) fail6("ASK2_CCR_SNAPSHOT_INVALID", 409);
  const evidenceRequired = EVIDENCE_FIRST.has(taxonomy);
  if (evidenceRequired && taxonomy !== "REALITY_FACT" && !currentContextSnapshot) {
    return freeze7({ schemaVersion: ASK2_PLAN_SCHEMA, question, domain, taxonomy, currentnessRequirement, routePlan, relationalPlan, orchestrationState: "CURRENT_CONTEXT_REQUIRED", currentReality: { internal: null, external }, executionRequests: [], lensDisclosure: createLensDisclosure(routePlan), whyThisLens: explainLensSelection(routePlan), boundaries: freeze7({ runtimeFirst: true, modelCalculationAllowed: false, rawWebResultAllowed: false, lensMayMutateEvidence: false, methodVotingAllowed: false }) });
  }
  if (routePlan.routeState === "PROFESSIONAL_HANDOFF_REQUIRED") {
    return freeze7({ schemaVersion: ASK2_PLAN_SCHEMA, question, domain, taxonomy, currentnessRequirement, routePlan, relationalPlan, orchestrationState: "PROFESSIONAL_HANDOFF_REQUIRED", currentReality: { internal: currentContextSnapshot || null, external }, executionRequests: [], lensDisclosure: createLensDisclosure(routePlan), whyThisLens: explainLensSelection(routePlan), boundaries: freeze7({ runtimeFirst: true, modelCalculationAllowed: false, rawWebResultAllowed: false, lensMayMutateEvidence: false, methodVotingAllowed: false }) });
  }
  if (routePlan.routeState === "REALITY_EVIDENCE_ONLY") {
    return freeze7({ schemaVersion: ASK2_PLAN_SCHEMA, question, domain, taxonomy, currentnessRequirement, routePlan, relationalPlan, orchestrationState: "REALITY_EVIDENCE_ONLY", currentReality: { internal: currentContextSnapshot || null, external }, executionRequests: [], lensDisclosure: createLensDisclosure(routePlan), whyThisLens: explainLensSelection(routePlan), boundaries: freeze7({ runtimeFirst: true, modelCalculationAllowed: false, rawWebResultAllowed: false, lensMayMutateEvidence: false, methodVotingAllowed: false }) });
  }
  const executionRequests = [];
  if (relationalPlan) {
    executionRequests.push(freeze7({ requestId: "ASK2-RUNTIME-001", routeKey: "RELATIONAL_RUNTIME", runtimeCode: "PHI_OS_RELATIONAL_RUNTIME", role: "PRIMARY", originRequired: "GOVERNED_RUNTIME", modelMayExecute: false }));
  } else if (routePlan.primary?.gate?.allowed === true) {
    const c = routePlan.primary.candidate;
    executionRequests.push(freeze7({ requestId: "ASK2-RUNTIME-001", routeKey: `${c.pluginCode}.${c.subCapability || ""}`.replace(/\.$/, ""), runtimeCode: c.pluginCode, role: "PRIMARY", originRequired: c.pluginCode === "HDR" ? "GOVERNED_RUNTIME" : "DETERMINISTIC_RUNTIME", modelMayExecute: false }));
    for (const [i, s] of (routePlan.supporting || []).entries()) {
      const c2 = s.candidate;
      executionRequests.push(freeze7({ requestId: `ASK2-RUNTIME-${String(i + 2).padStart(3, "0")}`, routeKey: `${c2.pluginCode}.${c2.subCapability || ""}`.replace(/\.$/, ""), runtimeCode: c2.pluginCode, role: c2.role || "SUPPORTING", originRequired: c2.pluginCode === "HDR" ? "GOVERNED_RUNTIME" : "DETERMINISTIC_RUNTIME", modelMayExecute: false }));
    }
  }
  const state = executionRequests.length ? "READY_FOR_RUNTIME_EXECUTION" : routePlan.routeState;
  return freeze7({ schemaVersion: ASK2_PLAN_SCHEMA, question, domain, taxonomy, currentnessRequirement, routePlan, relationalPlan, orchestrationState: state, currentReality: { internal: currentContextSnapshot || null, external }, executionRequests, lensDisclosure: createLensDisclosure(routePlan), whyThisLens: explainLensSelection(routePlan), boundaries: freeze7({ runtimeFirst: true, modelCalculationAllowed: false, rawWebResultAllowed: false, lensMayMutateEvidence: false, methodVotingAllowed: false, realityEvidenceFinalAuthority: true }) });
}
function validateRuntimeExecutionResult(result, request) {
  if (!request) fail6("ASK2_EXECUTION_REQUEST_REQUIRED", 400);
  if (!result || typeof result !== "object") fail6("ASK2_RUNTIME_RESULT_REQUIRED", 400);
  if (!ORIGINS.has(result.origin)) fail6("ASK2_RUNTIME_RESULT_ORIGIN_INVALID", 409);
  if (result.origin !== request.originRequired && !(request.originRequired === "GOVERNED_RUNTIME" && result.origin === "PROFESSIONAL_MANUAL_INPUT")) fail6("ASK2_RUNTIME_RESULT_ORIGIN_MISMATCH", 409);
  if (!String(result.sourceArtifactId || "").trim() || !String(result.sourceSchemaVersion || "").trim()) fail6("ASK2_RUNTIME_PROVENANCE_REQUIRED", 409);
  if (result.modelGeneratedCalculation === true) fail6("ASK2_MODEL_GENERATED_CALCULATION_FORBIDDEN", 409);
  return freeze7({ requestId: request.requestId, routeKey: request.routeKey, role: request.role, origin: result.origin, sourceArtifactId: result.sourceArtifactId, sourceSchemaVersion: result.sourceSchemaVersion, readingIr: result.readingIr ?? null });
}
function composeAsk2BoundedState({ plan, runtimeResults = [] } = {}) {
  if (plan?.schemaVersion !== ASK2_PLAN_SCHEMA) fail6("ASK2_PLAN_REQUIRED", 400);
  if (!["READY_FOR_RUNTIME_EXECUTION", "REALITY_EVIDENCE_ONLY"].includes(plan.orchestrationState)) fail6("ASK2_PLAN_NOT_COMPOSABLE", 409);
  const results = Array.isArray(runtimeResults) ? runtimeResults : [];
  const validated = [];
  if (plan.orchestrationState === "READY_FOR_RUNTIME_EXECUTION") {
    if (results.length !== plan.executionRequests.length) fail6("ASK2_RUNTIME_RESULT_COUNT_MISMATCH", 409);
    for (const req of plan.executionRequests) {
      const r = results.find((x) => x.requestId === req.requestId);
      validated.push(validateRuntimeExecutionResult(r, req));
    }
  }
  return freeze7({ schemaVersion: ASK2_COMPOSITION_SCHEMA, question: plan.question, currentContext: plan.currentReality.internal, currentExternalEvidence: plan.currentReality.external, runtimeResults: validated, primaryLens: plan.lensDisclosure.primary, supportingLenses: plan.lensDisclosure.supporting, whyThisLens: plan.whyThisLens, known: [], unknown: [], answer: null, nextStep: null, boundaries: freeze7({ boundedCompositionOnly: true, modelMayCompose: true, modelMayCalculate: false, modelMayMutateEvidence: false, modelMayCreateMedicalDiagnosis: false, modelMayCreateFinancialCalculation: false, methodVotingAllowed: false }) });
}

// functions/ask2/ask2-execution-adapters.js
var ASK2_ADAPTER_RESULT_SCHEMA = "PHI-OS-ASK2-EXECUTION-ADAPTER-RESULT-v1.0.0";
var ENDPOINTS = Object.freeze({
  "AST.NATAL": "/api/ast-structural-execute",
  "AST.CURRENT_DYNAMIC": "/api/ast-transit-execute",
  "BZR.TEMPORAL": "/api/bzr-temporal-execute",
  "ZWR.NATAL": "/api/zi-wei-execute",
  "ZWR.DYNAMIC_DOMAIN": "/api/zi-wei-dynamic-execute",
  "NUM": "/api/method-execute"
});
function fail7(code, status = 422) {
  const error = new Error(code);
  error.code = code;
  error.status = status;
  throw error;
}
function normalizePrecomputed(result, request) {
  return validateRuntimeExecutionResult({ ...result, requestId: request.requestId }, request);
}
function endpointFor(routeKey2) {
  return ENDPOINTS[routeKey2] || null;
}
async function executeEndpoint(request, input, { requestUrl, fetcher = fetch } = {}) {
  const endpoint = endpointFor(request.routeKey);
  if (!endpoint) return { state: "PRECOMPUTED_RESULT_REQUIRED", requestId: request.requestId, routeKey: request.routeKey };
  if (!input || typeof input !== "object") return { state: "INPUT_REQUIRED", requestId: request.requestId, routeKey: request.routeKey, endpoint };
  if (!requestUrl) fail7("ASK2_REQUEST_URL_REQUIRED_FOR_ENDPOINT_EXECUTION", 500);
  const target = new URL(endpoint, requestUrl);
  const response2 = await fetcher(target, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-phios-ask2-runtime-dispatch": "1"
    },
    cache: "no-store",
    body: JSON.stringify(input)
  });
  const payload = await response2.json().catch(() => null);
  if (!response2.ok || !payload?.ok) {
    return {
      state: "RUNTIME_EXECUTION_REJECTED",
      requestId: request.requestId,
      routeKey: request.routeKey,
      endpoint,
      errorCode: payload?.error?.code || payload?.error || "ASK2_BOUND_RUNTIME_EXECUTION_FAILED"
    };
  }
  const readingIr = payload.result ?? payload.projection ?? payload;
  const schemaVersion = String(readingIr?.schemaVersion || payload?.schemaVersion || ASK2_ADAPTER_RESULT_SCHEMA);
  const governed = {
    requestId: request.requestId,
    origin: request.originRequired,
    sourceArtifactId: `API:${endpoint}:${request.requestId}`,
    sourceSchemaVersion: schemaVersion,
    readingIr,
    modelGeneratedCalculation: false
  };
  return { state: "EXECUTED", endpoint, result: validateRuntimeExecutionResult(governed, request) };
}
async function executeAsk2RuntimeRequests(plan, {
  runtimeInputs = {},
  runtimeResults = {},
  requestUrl,
  fetcher = fetch
} = {}) {
  const requests = Array.isArray(plan?.executionRequests) ? plan.executionRequests : [];
  const records = [];
  for (const request of requests) {
    const precomputed = runtimeResults?.[request.requestId] || runtimeResults?.[request.routeKey];
    if (precomputed) {
      records.push({ state: "PRECOMPUTED_ACCEPTED", requestId: request.requestId, routeKey: request.routeKey, result: normalizePrecomputed(precomputed, request) });
      continue;
    }
    records.push(await executeEndpoint(request, runtimeInputs?.[request.requestId] || runtimeInputs?.[request.routeKey], { requestUrl, fetcher }));
  }
  const governedResults = records.filter((record) => record.result).map((record) => record.result);
  const pending = records.filter((record) => !record.result);
  return Object.freeze({
    schemaVersion: "PHI-OS-ASK2-EXECUTION-BATCH-v1.0.0",
    executionState: pending.length ? "INPUT_OR_GOVERNED_RESULT_REQUIRED" : "EXECUTION_COMPLETE",
    records: Object.freeze(records),
    governedResults: Object.freeze(governedResults),
    pending: Object.freeze(pending),
    boundaries: Object.freeze({ modelMayExecuteRuntime: false, modelMayCalculate: false, endpointBindingIsGoverned: true })
  });
}

// functions/ask2/ask2-public-composer.js
function text2(value) {
  return typeof value === "string" ? value.trim() : "";
}
function extractGovernedText(readingIr) {
  if (!readingIr || typeof readingIr !== "object") return [];
  const direct = [readingIr.summary, readingIr.directAnswer, readingIr.reading, readingIr.interpretation, readingIr.meaning].map(text2).filter(Boolean);
  const arrays = [readingIr.highlights, readingIr.observations, readingIr.findings, readingIr.sections].flatMap((value) => Array.isArray(value) ? value : []).map((item) => typeof item === "string" ? item : text2(item?.summary || item?.text || item?.description)).filter(Boolean);
  return [.../* @__PURE__ */ new Set([...direct, ...arrays])].slice(0, 8);
}
function buildAsk2ClientProjection({ plan, composition = null, execution = null, locale = "zh-Hans" } = {}) {
  const zh = locale === "zh-Hans";
  const primary = plan?.lensDisclosure?.primary?.label || null;
  const supporting = (plan?.lensDisclosure?.supporting || []).map((item) => item.label).filter(Boolean);
  const pending = execution?.pending || [];
  const governed = composition?.runtimeResults || execution?.governedResults || [];
  const governedText = governed.flatMap((item) => extractGovernedText(item.readingIr));
  let answerState = "ASK2_BOUNDED";
  let directAnswer = zh ? "PHI OS \u5DF2\u5EFA\u7ACB\u53D7\u6CBB\u7406\u7684\u8FD0\u884C\u8BA1\u5212\u3002" : "PHI OS has built a governed runtime plan.";
  let unknown = [];
  let observe = [];
  if (plan?.orchestrationState === "CURRENT_CONTEXT_REQUIRED") {
    answerState = "NEEDS_CONTEXT";
    if (plan?.taxonomy === "RELATIONSHIP") {
      directAnswer = zh ? "\u4EC5\u51ED\u201C\u813E\u6C14\u574F\u201D\u6216\u4E00\u6BB5\u5173\u7CFB\u63CF\u8FF0\uFF0CPHI OS \u4E0D\u80FD\u5224\u65AD\u5BF9\u65B9\u4E3A\u4EC0\u4E48\u4F1A\u8FD9\u6837\uFF0C\u4E5F\u4E0D\u4F1A\u731C\u6D4B\u5BF9\u65B9\u9690\u85CF\u7684\u611F\u53D7\u6216\u610F\u56FE\u3002\u5148\u8865\u5145\u5177\u4F53\u4E92\u52A8\u60C5\u5883\uFF0C\u624D\u80FD\u533A\u5206\u8FD9\u662F\u91CD\u590D\u7684\u4E92\u52A8\u6A21\u5F0F\u3001\u7279\u5B9A\u89E6\u53D1\u60C5\u5883\uFF0C\u8FD8\u662F\u4ECD\u7136\u6CA1\u6709\u8DB3\u591F\u8BC1\u636E\u89E3\u91CA\u3002" : "A label such as \u201Cbad temper\u201D is not enough to establish why another person behaves that way, and PHI OS will not infer hidden feelings or intentions. Add the concrete interaction context first so the answer can distinguish a repeated pattern, a specific trigger, or a genuine evidence gap.";
      unknown = [zh ? "\u76EE\u524D\u6CA1\u6709\u8DB3\u591F\u7684\u5173\u7CFB\u60C5\u5883\u8BC1\u636E\u6765\u89E3\u91CA\u539F\u56E0\u3002" : "There is not enough relationship-context evidence to explain the cause yet."];
      observe = zh ? ["\u4EC0\u4E48\u65F6\u5019\u6700\u5BB9\u6613\u53D1\u751F\uFF1F", "\u53D1\u751F\u524D\u901A\u5E38\u51FA\u73B0\u4EC0\u4E48\u4E8B\u60C5\u6216\u538B\u529B\uFF1F", "\u8FD9\u79CD\u60C5\u51B5\u662F\u5426\u53EA\u53D1\u751F\u5728\u4F60\u4EEC\u4E4B\u95F4\uFF0C\u8FD8\u662F\u5176\u4ED6\u573A\u666F\u4E5F\u4F1A\u51FA\u73B0\uFF1F", "\u6700\u8FD1\u6709\u6CA1\u6709\u660E\u663E\u53D8\u5316\uFF1F"] : ["When does it happen most often?", "What usually happens or changes just before it?", "Does it happen mainly between you two, or in other settings as well?", "Has anything changed recently?"];
    } else {
      directAnswer = zh ? "\u8FD9\u4E2A\u95EE\u9898\u9700\u8981\u5148\u7406\u89E3\u4F60\u5F53\u524D\u73B0\u5B9E\u4E2D\u5B9E\u9645\u53D1\u751F\u4E86\u4EC0\u4E48\uFF0C\u518D\u8C03\u7528\u76F8\u5E94 Runtime\u3002" : "This question needs current reality context before a runtime is used.";
      unknown = [zh ? "\u76EE\u524D\u6CA1\u6709\u8DB3\u591F\u7684 Current Context evidence\u3002" : "Current Context evidence is not yet available."];
      observe = [zh ? "\u8865\u5145\u6B63\u5728\u53D1\u751F\u4EC0\u4E48\u3001\u6301\u7EED\u591A\u4E45\u3001\u4EC0\u4E48\u53D1\u751F\u4E86\u53D8\u5316\uFF0C\u4EE5\u53CA\u73B0\u5728\u6700\u91CD\u8981\u7684\u662F\u4EC0\u4E48\u3002" : "Add what is happening, how long it has been happening, what changed, and what matters most now."];
    }
  } else if (plan?.orchestrationState === "CURRENT_EXTERNAL_EVIDENCE_REQUIRED") {
    answerState = "NEEDS_CURRENT_AUTHORITY";
    directAnswer = zh ? "\u8FD9\u4E2A\u95EE\u9898\u9700\u8981\u5F53\u524D\u5916\u90E8\u6743\u5A01\u8D44\u6599\u3002PHI OS \u4E0D\u4F1A\u7528\u6A21\u578B\u8BB0\u5FC6\u4EE3\u66FF Current Authority\u3002" : "This question requires current external authority. PHI OS will not substitute model memory.";
    unknown = [zh ? "\u5F53\u524D\u53D7\u6CBB\u7406\u7684 CWA evidence \u5C1A\u672A\u63D0\u4F9B\u3002" : "Governed CWA evidence has not been provided."];
  } else if (plan?.orchestrationState === "PROFESSIONAL_HANDOFF_REQUIRED") {
    answerState = "PROFESSIONAL_HANDOFF";
    directAnswer = zh ? "\u8FD9\u4E2A\u95EE\u9898\u9700\u8981\u4E13\u4E1A\u5224\u65AD\uFF1Bsymbolic lens \u4E0D\u80FD\u66FF\u4EE3\u4E13\u4E1A\u4EBA\u5458\u3002" : "This question requires professional judgment; a symbolic lens cannot replace a professional.";
  } else if (pending.length) {
    answerState = "ASK2_INPUT_REQUIRED";
    directAnswer = zh ? `PHI OS \u5DF2\u9009\u62E9${primary ? `\u300C${primary}\u300D` : "\u76F8\u5E94 Runtime"}\uFF0C\u4F46\u8FD8\u9700\u8981\u53D7\u6CBB\u7406\u7684 Runtime \u8F93\u5165\u6216\u65E2\u6709 Runtime \u7ED3\u679C\uFF0C\u4E0D\u80FD\u7531\u6A21\u578B\u81EA\u884C\u8865\u7B97\u3002` : `PHI OS selected ${primary || "the governed runtime"}, but governed runtime input or an existing runtime result is still required; the model cannot calculate it.`;
    unknown = pending.map((item) => `${item.routeKey}: ${item.state}`);
  } else if (governedText.length) {
    answerState = "ANSWERED";
    directAnswer = governedText[0];
    observe = governedText.slice(1);
  } else if (plan?.orchestrationState === "REALITY_EVIDENCE_ONLY") {
    answerState = "PARTIALLY_ANSWERED";
    const external = plan?.currentReality?.external || [];
    directAnswer = external.length ? zh ? "\u5DF2\u53D6\u5F97\u53D7\u6CBB\u7406\u7684 Current External Evidence\uFF1B\u6CA1\u6709\u4F7F\u7528 symbolic lens \u6539\u5199\u4E8B\u5B9E\u3002" : "Governed current external evidence is available; no symbolic lens was used to rewrite it." : zh ? "\u8FD9\u4E2A\u95EE\u9898\u4EE5\u73B0\u5B9E\u8BC1\u636E\u4E3A\u4E3B\uFF0C\u4E0D\u9700\u8981 symbolic lens\u3002" : "This question is primarily about reality evidence and does not require a symbolic lens.";
  }
  const whyThisMayHappen = plan?.orchestrationState === "CURRENT_CONTEXT_REQUIRED" && plan?.taxonomy === "RELATIONSHIP" ? [zh ? "\u4F60\u7684\u95EE\u9898\u6D89\u53CA\u4E24\u4E2A\u4EBA\u4E4B\u95F4\u7684\u4E92\u52A8\uFF0C\u56E0\u6B64\u8FD9\u91CC\u5148\u6309\u5173\u7CFB\u60C5\u5883\u5904\u7406\uFF1B\u5728\u6CA1\u6709\u5177\u4F53\u4E92\u52A8\u8D44\u6599\u524D\uFF0C\u4E0D\u63A8\u65AD\u5BF9\u65B9\u7684\u9690\u85CF\u611F\u53D7\u3001\u610F\u56FE\u6216\u5FC3\u7406\u72B6\u6001\u3002" : "Your question concerns interaction between two people, so it is handled as relationship context first; without concrete interaction evidence, hidden feelings, intentions or mental states are not inferred."] : plan?.whyThisLens?.reason ? [plan.whyThisLens.reason] : [];
  return Object.freeze({
    answerState,
    question: plan?.question || "",
    directAnswer,
    whyThisMayHappen,
    whatToObserve: observe,
    unknown: Object.freeze({ details: Object.freeze(unknown) }),
    disclosure: Object.freeze({ primary, supporting, why: plan?.whyThisLens?.reason || null }),
    boundaries: Object.freeze({ runtimeFirst: true, modelMayCalculate: false, currentEvidenceMayBeMutatedByLens: false })
  });
}

// functions/health/health-reality-runtime.js
var CARE_RANK = Object.freeze({
  INFORMATIONAL: 0,
  ROUTINE_REVIEW: 1,
  PROMPT_MEDICAL_REVIEW: 2,
  URGENT_EVALUATION: 3,
  EMERGENCY: 4
});
var text3 = (value) => String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ");
var EMERGENCY_PATTERNS = [
  /(?:sudden|severe).*chest pain.*(?:struggl|difficulty|can't|cannot).*breath/i,
  /(?:胸痛|胸口.*痛).*(?:呼吸困难|喘不过气|无法呼吸)/,
  /(?:face droop|arm weakness|speech difficulty)/i,
  /(?:脸歪|单侧无力|说话不清)/,
  /(?:severe bleeding|bleeding.*won't stop)/i,
  /(?:大量出血|止不住血)/
];
var URGENT_PATTERNS = [
  /(?:fainting|passed out|loss of consciousness)/i,
  /(?:昏厥|失去意识)/,
  /(?:new confusion|sudden confusion)/i,
  /(?:突然意识混乱|突然神志不清)/
];
var PROMPT_PATTERNS = [
  /(?:persistent|ongoing|for several (?:weeks|months)|getting worse)/i,
  /(?:持续|好几周|好几个月|越来越严重)/
];
function classifyHealthIntent(input = {}) {
  const q = text3(typeof input === "string" ? input : input.question);
  const healthTerms = /\b(health|symptom|pain|tired|fatigue|sleep|heart|blood|lab|doctor|medication|medicine|diagnos|breath|dizzy|dizziness|fever|hba1c|a1c|glucose|cholesterol|ldl|hdl|triglyceride|hemoglobin|haemoglobin|creatinine|egfr|blood pressure|heart rate)\b|健康|症状|疼|痛|疲劳|累|睡眠|心跳|血压|血糖|糖化血红蛋白|胆固醇|化验|检查|医生|药|呼吸|头晕|发烧/i;
  if (!healthTerms.test(q)) return "NON_HEALTH";
  if (/what does|what is|mean|reference range|是什么意思|什么是|参考范围/i.test(q)) return "HEALTH_INFORMATION";
  if (/report|lab|test result|scan|报告|化验|检验|影像/i.test(q)) return "HEALTH_DOCUMENT_UNDERSTANDING";
  if (/timeline|history|when it started|时间线|病程|什么时候开始/i.test(q)) return "HEALTH_TIMELINE";
  if (EMERGENCY_PATTERNS.some((p) => p.test(q)) || URGENT_PATTERNS.some((p) => p.test(q)) || /what should i do|怎么办|要不要去急诊/i.test(q)) return "HEALTH_CARE_NAVIGATION";
  return "HEALTH_REALITY";
}
function routeHealthSafety(input = {}) {
  const q = text3(typeof input === "string" ? input : input.question);
  let careState = "INFORMATIONAL";
  const matchedSignals2 = [];
  const promote = (state, signal) => {
    if (CARE_RANK[state] > CARE_RANK[careState]) careState = state;
    if (signal) matchedSignals2.push(signal);
  };
  if (EMERGENCY_PATTERNS.some((p) => p.test(q))) promote("EMERGENCY", "HIGH_RISK_EMERGENCY_PATTERN");
  else if (URGENT_PATTERNS.some((p) => p.test(q))) promote("URGENT_EVALUATION", "URGENT_PATTERN");
  else if (PROMPT_PATTERNS.some((p) => p.test(q))) promote("PROMPT_MEDICAL_REVIEW", "PERSISTENT_OR_WORSENING_PATTERN");
  else if (classifyHealthIntent({ question: q }) !== "NON_HEALTH") promote("ROUTINE_REVIEW", "HEALTH_CONCERN_PRESENT");
  return {
    schemaVersion: "PHI-OS-HRX-SAFETY-ROUTING-v1.0.0",
    careState,
    matchedSignals: matchedSignals2,
    safetyRoutingOnly: true,
    diagnosisEstablished: false,
    diseaseRuledOut: false,
    exhaustiveTriageClaimed: false
  };
}

// functions/health/ask-health-bridge.js
function planAskHealthBridge(input = {}, env = {}) {
  const question = String(input.question || "").trim();
  const intent = classifyHealthIntent({ question });
  if (intent === "NON_HEALTH") return { route: "CKA_STANDARD", healthIntent: false };
  const safety = routeHealthSafety({ question });
  const liveHealthAuthorityConnected = env.PHIOS_HEALTH_AUTHORITY_ENABLED === "1";
  const requiresExternalHealthFacts = ["HEALTH_INFORMATION", "HEALTH_DOCUMENT_UNDERSTANDING"].includes(intent);
  return {
    schemaVersion: "PHI-OS-ASK-HRX-BRIDGE-v1.0.0",
    route: safety.careState === "EMERGENCY" || safety.careState === "URGENT_EVALUATION" ? "HRX_SAFETY_FIRST" : requiresExternalHealthFacts && !liveHealthAuthorityConnected ? "HRX_AUTHORITY_REQUIRED" : "HRX_GUIDED_CONTEXT",
    healthIntent: true,
    intent,
    safety,
    authority: {
      liveHealthAuthorityConnected,
      generalModelMaySubstituteForHealthAuthority: false
    },
    governance: {
      methodExecutionAllowed: false,
      diagnosisAllowed: false,
      treatmentPrescriptionAllowed: false,
      silentPrivateContextConsumptionAllowed: false,
      productionActivation: false
    }
  };
}

// functions/ask2/ask2-consumption-runtime.js
var PERSONAL_ACTION_SIGNAL = /(?:我|我的|我们|自己).*(?:应该|怎么办|调整|选择|决定|关系|伴侣|工作|现金流|节奏)|(?:what should i|how should i|my (?:relationship|partner|work|career|cash flow|rhythm|decision))/i;
var PERSONAL_RELATIONSHIP_SIGNAL = /(?:我(?:的)?(?:丈夫|老公|妻子|老婆|伴侣)|my (?:husband|wife|spouse|partner)).*(?:脾气|发脾气|生气|争吵|bad[- ]tempered|angry|temper|argument)/i;
var CURRENT_SIGNAL = /(current|today|latest|recent|now|opr|interest rate|market|economy|policy|news|weather|outbreak|cases|今天|目前|现在|最新|利率|市场|经济|政策|新闻|天气|病例|疫情)/i;
var EVERGREEN_KNOWLEDGE = /^(what is|what are|define|explain|什么是|何谓|解释一下)/i;
var GENERAL_KNOWLEDGE_SIGNAL = /(文明|历史|知识|机制|概念|理论|atlas|civilization|history|knowledge|mechanism|concept|theory)/i;
var STRONG_FINANCIAL_SIGNAL = /(?:现金流|储蓄|存款|收入|支出|预算|负债|净值|退休金|rm\s*[\d,]+|cash flow|savings?|income|expense|budget|debt|net worth|retirement|rm\s*[\d,]+)/i;
var HEALTH_K1_SIGNAL = /(rash|redness|itch|itching|hives|swelling|blister|eczema|allerg|numbness|nausea|vomit|diarrhea|constipation|headache|cough|palpitation|skin sensitivity|sensitive skin|skin irritation|skin reaction|皮肤敏感|敏感肌|皮肤刺激|皮肤反应|泛红|干燥|脱皮|皮疹|红疹|红斑|红点|瘙痒|痒|荨麻疹|红肿|肿胀|水泡|湿疹|过敏|麻木|恶心|呕吐|腹泻|便秘|头痛|咳嗽)/i;
function classifyAsk2Consumption({ question, body = {}, env = {} } = {}) {
  const q = String(question || "").trim();
  let health = STRONG_FINANCIAL_SIGNAL.test(q) ? { route: "CKA_STANDARD", healthIntent: false } : planAskHealthBridge({ question: q }, env);
  if (!health.healthIntent && HEALTH_K1_SIGNAL.test(q)) {
    const safety = routeHealthSafety({ question: q });
    health = {
      schemaVersion: "PHI-OS-ASK2-HEALTH-K1-DOMAIN-BRIDGE-v1.0.0",
      route: safety.careState === "EMERGENCY" || safety.careState === "URGENT_EVALUATION" ? "HRX_SAFETY_FIRST" : "HRX_GUIDED_CONTEXT",
      healthIntent: true,
      intent: "HEALTH_REALITY",
      safety,
      authority: { liveHealthAuthorityConnected: env.PHIOS_HEALTH_AUTHORITY_ENABLED === "1", generalModelMaySubstituteForHealthAuthority: false },
      governance: { methodExecutionAllowed: false, diagnosisAllowed: false, treatmentPrescriptionAllowed: false, healthK1ConceptSignalUsed: true }
    };
  }
  if (health.healthIntent) return Object.freeze({ mode: "HEALTH", reasonCode: "HEALTH_SAFETY_PRECEDENCE", health });
  const explicitRuntime = Boolean(body?.taxonomyHint || Object.keys(body?.runtimeInputs || {}).length || Object.keys(body?.runtimeResults || {}).length || body?.currentContextSnapshot);
  const atlasType = String(body?.entryContext?.retrievalScope?.scopeType || "").toUpperCase();
  const atlasBook = String(body?.entryContext?.bookCode || body?.entryContext?.retrievalScope?.bookCode || "").toUpperCase();
  const atlasScope = ["CIVILIZATION_ATLAS", "CIVILIZATION_RECONFIGURATION_ATLAS"].includes(atlasType) || ["BOOK-5", "BOOK-6"].includes(atlasBook);
  if (atlasScope) return Object.freeze({ mode: "CKA", reasonCode: "STRUCTURED_ATLAS_KNOWLEDGE_SCOPE" });
  if (body?.entryContext?.retrievalScope?.scopeType === "STRUCTURED_KNOWLEDGE") return Object.freeze({ mode: "CKA", reasonCode: "STRUCTURED_BOOK_KNOWLEDGE_SCOPE" });
  if (explicitRuntime) return Object.freeze({ mode: "ASK2", reasonCode: "EXPLICIT_RUNTIME_INPUT" });
  if (EVERGREEN_KNOWLEDGE.test(q) || GENERAL_KNOWLEDGE_SIGNAL.test(q)) return Object.freeze({ mode: "CKA", reasonCode: "GENERAL_KNOWLEDGE_INTENT" });
  if (PERSONAL_ACTION_SIGNAL.test(q) || PERSONAL_RELATIONSHIP_SIGNAL.test(q)) return Object.freeze({ mode: "ASK2", reasonCode: "PERSONAL_CURRENT_ACTION_INTENT" });
  if (CURRENT_SIGNAL.test(q) && Array.isArray(body?.currentExternalEvidence) && body.currentExternalEvidence.length) return Object.freeze({ mode: "ASK2", reasonCode: "CURRENT_AUTHORITY_EVIDENCE_PRESENT" });
  return Object.freeze({ mode: "CKA", reasonCode: "DEFAULT_KNOWLEDGE_ROUTE" });
}
function deriveEphemeralCurrentContextSnapshot(body = {}) {
  if (body.currentContextSnapshot) return body.currentContextSnapshot;
  const fields = body.guidedContext && typeof body.guidedContext === "object" ? body.guidedContext : {};
  const entries = Object.entries(fields).filter(([, value]) => String(value || "").trim());
  if (!entries.length) return null;
  return Object.freeze({
    schemaVersion: "PHI-OS-CURRENT-CONTEXT-SNAPSHOT-v1.0.0",
    snapshotId: `ASK2-EPHEMERAL-${Date.now()}`,
    sourceType: "ASK_GUIDED_CONTEXT_EPHEMERAL",
    canonicalReality: false,
    persisted: false,
    observedAt: (/* @__PURE__ */ new Date()).toISOString(),
    fields: Object.freeze(Object.fromEntries(entries)),
    boundaries: Object.freeze({ userProvided: true, inferenceAllowed: false, silentPersistenceAllowed: false })
  });
}
async function runAsk2Consumption({ body, env = {}, requestUrl, fetcher = fetch } = {}) {
  const question = String(body?.q || body?.question || "").trim();
  const requestContract = body?.ptrcRequestContract || null;
  const classification = classifyAsk2Consumption({ question, body, env });
  if (classification.mode !== "ASK2") return Object.freeze({ classification, requestContract });
  const plan = buildAsk2OrchestrationPlan({
    question,
    taxonomyHint: body?.taxonomyHint || null,
    domain: body?.domain || "GENERAL_CURRENT",
    publicRequest: body?.publicRequest !== false,
    internalAccessClass: body?.internalAccessClass || null,
    currentContextSnapshot: deriveEphemeralCurrentContextSnapshot(body),
    currentExternalEvidence: body?.currentExternalEvidence || [],
    externalCurrentRequired: body?.externalCurrentRequired ?? null
  });
  if (plan.orchestrationState !== "READY_FOR_RUNTIME_EXECUTION") {
    return Object.freeze({ classification, requestContract, plan, execution: null, composition: null, client: buildAsk2ClientProjection({ plan, locale: body?.locale }) });
  }
  const execution = await executeAsk2RuntimeRequests(plan, {
    runtimeInputs: body?.runtimeInputs || {},
    runtimeResults: body?.runtimeResults || {},
    requestUrl,
    fetcher
  });
  let composition = null;
  if (execution.executionState === "EXECUTION_COMPLETE") {
    composition = composeAsk2BoundedState({ plan, runtimeResults: execution.governedResults.map((item) => ({ ...item, requestId: item.requestId })) });
  }
  const client = buildAsk2ClientProjection({ plan, composition, execution, locale: body?.locale });
  return Object.freeze({ classification, requestContract, plan, execution, composition, client });
}

// functions/api/ask-phios-orchestrated.js
var headers = Object.freeze({
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer"
});
var json2 = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
function ckaCompatFromAsk2(result) {
  const client = result.client;
  const answerId = `ASK2-${Date.now()}`;
  const authorityGroups = (result.plan?.currentReality?.external || []).map((evidence, index) => ({
    authorityClass: "GOVERNED_EXTERNAL_AUTHORITY",
    sources: [{
      authorityLabel: evidence.publisher || evidence.authorityClass || "Current Authority",
      description: evidence.claimText || evidence.title || "Governed current evidence",
      href: evidence.sourceUrl || null,
      volume: "",
      part: "",
      sourceId: evidence.sourceId || `CWA-${index + 1}`
    }]
  }));
  return {
    clientAnswer: {
      question: client.question,
      directAnswer: client.directAnswer,
      whyThisMayHappen: client.whyThisMayHappen,
      whatToObserve: client.whatToObserve,
      unknown: client.unknown,
      answerContext: { answerId },
      knowledgeContext: { groundingBundleId: `ASK2-GROUNDING-${answerId}` }
    },
    w5w17: {
      answerState: client.answerState,
      record: {
        unknownState: client.unknown.details.length ? "UNKNOWN_REMAINS" : "BOUNDARIES_PRESERVED",
        groundingBundleId: `ASK2-GROUNDING-${answerId}`,
        retrievalContext: { authorityGroups }
      },
      relatedKnowledgeCards: [],
      externalAuthority: {
        required: client.answerState === "NEEDS_CURRENT_AUTHORITY",
        professionalJudgmentRequested: client.answerState === "PROFESSIONAL_HANDOFF"
      },
      guidedContext: { classifications: [result.plan?.taxonomy || "ASK2"] }
    },
    followUp: { followUpDepth: 0 }
  };
}
function healthCompat(question, health, locale) {
  const zh = locale === "zh-Hans";
  const safety = health.safety?.careState;
  const direct = health.route === "HRX_SAFETY_FIRST" ? zh ? "\u8FD9\u4E2A\u5065\u5EB7\u95EE\u9898\u9700\u8981\u4F18\u5148\u8FDB\u5165\u5B89\u5168\u4E0E\u73B0\u5B9E\u7167\u62A4\u8DEF\u5F84\u3002" : "This health question requires safety-first real-world care routing." : health.route === "HRX_AUTHORITY_REQUIRED" ? zh ? "\u8FD9\u662F\u5065\u5EB7\u95EE\u9898\u3002PHI OS \u9700\u8981\u53D7\u6CBB\u7406\u7684 Health Authority \u624D\u80FD\u63D0\u4F9B\u5065\u5EB7\u4E8B\u5B9E\uFF0C\u4E0D\u4F1A\u7528\u666E\u901A\u6A21\u578B\u77E5\u8BC6\u4EE3\u66FF\u3002" : "This is a health question. Governed Health Authority is required for health facts; general model knowledge will not substitute." : zh ? "\u8FD9\u662F\u5065\u5EB7\u95EE\u9898\u3002PHI OS \u4F1A\u5148\u6574\u7406\u5F53\u524D\u75C7\u72B6\u3001\u65F6\u95F4\u4E0E\u76F8\u5173\u53D8\u5316\uFF0C\u4E0D\u4F1A\u76F4\u63A5\u8BCA\u65AD\u3002" : "This is a health question. PHI OS will first organize symptoms, timing, and changes without diagnosing.";
  const prompts = [
    zh ? "\u4EC0\u4E48\u65F6\u5019\u5F00\u59CB\uFF1F" : "When did it begin?",
    zh ? "\u6709\u4EC0\u4E48\u75D2\u3001\u75DB\u3001\u80BF\u3001\u6269\u6563\u6216\u5176\u4ED6\u53D8\u5316\uFF1F" : "Is there itching, pain, swelling, spreading, or another change?",
    zh ? "\u6700\u8FD1\u662F\u5426\u6709\u65B0\u7684\u836F\u7269\u3001\u4EA7\u54C1\u3001\u98DF\u7269\u6216\u73AF\u5883\u66B4\u9732\uFF1F" : "Any new medicine, product, food, or environmental exposure?"
  ];
  const answerId = `HRX-${Date.now()}`;
  return {
    ok: true,
    mode: "HEALTH",
    ask2: { schemaVersion: "PHI-OS-ASK2-PUBLIC-CONSUMPTION-v1.0.0", domain: "HEALTH", route: health.route, health },
    cka: {
      clientAnswer: { question, directAnswer: direct, whyThisMayHappen: [], whatToObserve: prompts, unknown: { details: [zh ? "\u539F\u56E0\u5C1A\u672A\u5EFA\u7ACB\u3002" : "The cause has not been established."] }, answerContext: { answerId }, knowledgeContext: { groundingBundleId: `HRX-GROUNDING-${answerId}` } },
      w5w17: { answerState: health.route === "HRX_SAFETY_FIRST" ? "PROFESSIONAL_HANDOFF" : health.route === "HRX_AUTHORITY_REQUIRED" ? "NEEDS_CURRENT_AUTHORITY" : "NEEDS_CONTEXT", record: { unknownState: "CAUSE_NOT_ESTABLISHED", groundingBundleId: `HRX-GROUNDING-${answerId}`, retrievalContext: { authorityGroups: [] } }, relatedKnowledgeCards: [], externalAuthority: { required: health.route === "HRX_AUTHORITY_REQUIRED", professionalJudgmentRequested: health.route === "HRX_SAFETY_FIRST" }, guidedContext: { classifications: ["HEALTH", health.intent || "HEALTH_REALITY"] } },
      followUp: { followUpDepth: 0 }
    }
  };
}
async function onRequestPost2(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json2({ ok: false, error: { code: "ASK2_INVALID_JSON" } }, 400);
  }
  const question = String(body?.q || body?.question || "").trim();
  if (!question) return json2({ ok: false, error: { code: "ASK2_QUESTION_REQUIRED" } }, 400);
  try {
    const requestContract = createPtrcAskRequestContract(body);
    const governedBody = { ...body, q: requestContract.question, locale: requestContract.locale, ptrcRequestContract: requestContract };
    const result = await runAsk2Consumption({ body: governedBody, env: context.env || {}, requestUrl: context.request.url, fetcher: fetch });
    if (result.classification.mode === "HEALTH") {
      const response2 = healthCompat(question, result.classification.health, requestContract.locale);
      return json2({ ...response2, requestContract });
    }
    if (result.classification.mode === "CKA") {
      const forwarded = new Request(context.request.url, { method: "POST", headers: context.request.headers, body: JSON.stringify(governedBody) });
      return onRequestPost({ ...context, request: forwarded });
    }
    return json2({
      ok: true,
      mode: "ASK2",
      requestContract,
      ask2: {
        schemaVersion: "PHI-OS-ASK2-PUBLIC-CONSUMPTION-v1.0.0",
        requestContract,
        plan: result.plan,
        execution: result.execution,
        composition: result.composition,
        client: result.client
      },
      cka: ckaCompatFromAsk2(result)
    });
  } catch (error) {
    return json2({ ok: false, error: { code: error?.code || error?.message || "ASK2_ORCHESTRATED_CONSUMPTION_FAILED" }, governance: { modelCalculationAllowed: false, rawWebResultAllowed: false } }, error?.status || 422);
  }
}

// functions/current-facts-gateway/current-facts-gateway.js
var PUBLIC_FACT_SIGNAL = /(exchange rate|fx\b|currency rate|stock|share price|market price|interest rate|weather|temperature|forecast|breaking|latest news|current event|regulation|law|policy|current price|price today|汇率|外汇|股价|市场价格|利率|天气|气温|预报|最新新闻|时事|法规|监管|政策|今日价格|当前价格)/i;
var DOMAIN_RULES = [["WEATHER", /(weather|temperature|forecast|天气|气温|预报)/i], ["FINANCIAL_MARKETS", /(exchange rate|fx\b|currency|stock|share price|market|interest rate|汇率|外汇|货币|股价|市场|利率)/i], ["NEWS_CURRENT_EVENTS", /(breaking|latest news|current event|新闻|时事|突发)/i], ["COMPANY_PRODUCT", /(current price|price today|product price|售价|产品价格|今日价格|当前价格)/i]];
var CLAIM_BY_DOMAIN = Object.freeze({ WEATHER: "WEATHER_CURRENT", FINANCIAL_MARKETS: "GENERAL_CURRENT_FACT", NEWS_CURRENT_EVENTS: "NEWS_DEVELOPMENT", COMPANY_PRODUCT: "COMPANY_PRODUCT_SPEC", GENERAL_CURRENT: "GENERAL_CURRENT_FACT" });
var clean14 = (v) => String(v ?? "").trim();
var list4 = (v) => Array.isArray(v) ? v : [];
function safeEndpoint(value) {
  let url;
  try {
    url = new URL(clean14(value));
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  return url;
}
function allowedHost(url, env) {
  const configured = clean14(env?.PHIOS_CURRENT_FACTS_ALLOWED_HOSTS);
  if (!configured) return true;
  const allowed = new Set(configured.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean));
  return allowed.has(url.hostname.toLowerCase());
}
function classifyCurrentFactNeed(question = "") {
  const q = clean14(question);
  if (!PUBLIC_FACT_SIGNAL.test(q)) return Object.freeze({ required: false, domain: "GENERAL_CURRENT" });
  const domain = DOMAIN_RULES.find(([, rx]) => rx.test(q))?.[0] || "GENERAL_CURRENT";
  return Object.freeze({ required: true, domain });
}
function authorityClass(item, domain) {
  const hint = clean14(item?.authorityClass || item?.authorityClassHint).toUpperCase();
  if (hint) return hint;
  if (domain === "WEATHER") return "GOVERNMENT";
  if (domain === "FINANCIAL_MARKETS") return "MARKET_DATA_PROVIDER";
  if (domain === "NEWS_CURRENT_EVENTS") return "REPUTABLE_NEWS";
  if (domain === "COMPANY_PRODUCT") return "OFFICIAL_COMPANY";
  return "SECONDARY_REFERENCE";
}
async function retrieveCurrentFacts({ question, env = {}, fetcher = fetch, now = (/* @__PURE__ */ new Date()).toISOString() } = {}) {
  const need = classifyCurrentFactNeed(question);
  if (!need.required) return Object.freeze({ state: "NOT_REQUIRED", domain: need.domain, retrievedAt: null, freshness: null, evidence: [], limitations: [] });
  const endpoint = safeEndpoint(env?.PHIOS_CURRENT_FACTS_ENDPOINT);
  if (!endpoint || !allowedHost(endpoint, env)) return Object.freeze({ state: "PROVIDER_NOT_CONFIGURED", domain: need.domain, retrievedAt: null, freshness: null, evidence: [], limitations: ["CURRENT_FACTS_PROVIDER_NOT_CONFIGURED"] });
  const headers2 = { "content-type": "application/json", "accept": "application/json" };
  if (clean14(env?.PHIOS_CURRENT_FACTS_API_KEY)) headers2.authorization = `Bearer ${clean14(env.PHIOS_CURRENT_FACTS_API_KEY)}`;
  let response2;
  try {
    response2 = await fetcher(endpoint, { method: "POST", headers: headers2, cache: "no-store", body: JSON.stringify({ query: clean14(question), domain: need.domain, maxResults: 5 }) });
  } catch {
    return Object.freeze({ state: "PROVIDER_UNAVAILABLE", domain: need.domain, retrievedAt: null, freshness: null, evidence: [], limitations: ["CURRENT_FACTS_PROVIDER_NETWORK_FAILURE"] });
  }
  const payload = await response2.json().catch(() => null);
  if (!response2.ok || !payload) return Object.freeze({ state: "PROVIDER_UNAVAILABLE", domain: need.domain, retrievedAt: null, freshness: null, evidence: [], limitations: ["CURRENT_FACTS_PROVIDER_RESPONSE_INVALID"] });
  const raw = list4(payload.results).slice(0, 5);
  const retrievedAt = clean14(payload.retrievedAt) || now;
  let candidates;
  try {
    candidates = discoverCurrentSourceCandidates({ query: question, domain: need.domain, currentnessRequirement: "CURRENTNESS_REQUIRED", results: raw.map((item) => ({ url: item.url || item.sourceUrl, publisher: item.publisher, title: item.title || item.claimText || "Current source", publishedAt: item.publishedAt || null, retrievedAt: item.retrievedAt || retrievedAt, authorityClassHint: item.authorityClass || null, sourceVersionHint: item.sourceVersionOrDigest || item.sourceVersion || null })) }).candidates;
  } catch {
    return Object.freeze({ state: "REJECTED", domain: need.domain, retrievedAt, freshness: null, evidence: [], limitations: ["CURRENT_FACTS_DISCOVERY_REJECTED"] });
  }
  const evidence = [];
  const limitations = [];
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i], rawItem = raw[i] || {};
    try {
      const claimType = clean14(rawItem.claimType) || CLAIM_BY_DOMAIN[need.domain] || "GENERAL_CURRENT_FACT";
      const admission = admitCurrentSource({ candidate, domain: need.domain, authorityClass: authorityClass(rawItem, need.domain), claimType, now, sourceVersionCurrent: rawItem.sourceVersionCurrent === true, superseded: rawItem.superseded === true, sourceId: clean14(rawItem.sourceId) || `CWA-PROVIDER-${i + 1}`, sourceVersionOrDigest: clean14(rawItem.sourceVersionOrDigest || rawItem.sourceVersion) || `retrieved:${candidate.retrievedAt}` });
      if (admission.admissionState !== "ADMITTED") {
        limitations.push(admission.reason || "CURRENT_SOURCE_NOT_ADMITTED");
        continue;
      }
      const claimText = clean14(rawItem.claimText || rawItem.answer || rawItem.snippet);
      if (!claimText) {
        limitations.push("CURRENT_FACT_CLAIM_TEXT_MISSING");
        continue;
      }
      evidence.push(createCurrentEvidence({ claimId: clean14(rawItem.claimId) || `CWA-CLAIM-${i + 1}`, claimText, claimType, admission, publishedAt: rawItem.publishedAt || null, supportLevel: clean14(rawItem.supportLevel) || "DIRECT", jurisdiction: clean14(rawItem.jurisdiction) || null }));
    } catch (error) {
      limitations.push(error?.code || error?.message || "CURRENT_SOURCE_REJECTED");
    }
  }
  const freshness = evidence.length ? evidence.map((x) => x.freshnessState).join(",") : null;
  return Object.freeze({ state: evidence.length ? "AVAILABLE" : "NO_ADMITTED_EVIDENCE", domain: need.domain, retrievedAt, freshness, evidence: Object.freeze(evidence), limitations: Object.freeze([...new Set(limitations)]), providerDisclosure: { serverSide: true, endpointHost: endpoint.hostname, browserDirectRetrieval: false } });
}

// functions/customer-projection/projection-common.js
var CX_PROJECTION_VERSION = "PHI-OS-CX-CUSTOMER-PROJECTION-v1.0.0";
var clean15 = (value) => String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ");
var list5 = (value) => Array.isArray(value) ? value : [];
var localeOf = (value) => value === "zh-Hans" ? "zh-Hans" : "en";
var text4 = (locale, en, zh) => localeOf(locale) === "zh-Hans" ? zh : en;
var uniq3 = (items) => [...new Set(list5(items).filter((v) => v !== null && v !== void 0 && v !== ""))];
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
  }
  return value;
}
function safeUrl2(value) {
  const v = clean15(value);
  if (!v) return null;
  try {
    const u = new URL(v, "https://phios.invalid");
    if (u.origin === "https://phios.invalid") return u.pathname + u.search + u.hash;
    if (u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}
function boundary() {
  return deepFreeze({ createsAuthority: false, calculates: false, infersNewFinding: false, changesMeaning: false, recommends: false, createsTruth: false, createsAvailability: false, createsEntitlement: false, createsAuthentication: false, createsProfessionalJudgment: false });
}
function sourceLineage(authorities = []) {
  return deepFreeze({ sourceAuthorities: uniq3(list5(authorities).map(clean15).filter(Boolean)), authorityPreserved: true });
}

// functions/customer-projection/knowledge-customer-projection.js
function normalizedCka(payload) {
  return payload?.cka?.clientAnswer ? payload.cka : payload?.clientAnswer ? payload : payload?.cka || {};
}
function authoritySources(payload) {
  const cka = normalizedCka(payload), direct = list5(cka?.clientAnswer?.sourcesGrounding).map((s) => ({ label: clean15(s?.authorityLabel), excerpt: clean15(s?.excerpt), href: safeUrl2(s?.href) }));
  const groups = list5(cka?.w5w17?.record?.retrievalContext?.authorityGroups).flatMap((g) => list5(g?.sources).map((s) => ({ label: clean15(s?.authorityLabel || s?.publisher || g?.authorityClass), excerpt: clean15(s?.description || s?.claimText), href: safeUrl2(s?.href || s?.sourceUrl), sourceId: clean15(s?.sourceId) || null })));
  return [...direct, ...groups].filter((s) => s.label || s.href);
}
var atlasLabel = (lang, kind) => ({ loss: text4(lang, "Civilization loss registry", "\u6587\u660E\u635F\u5931 Registry"), cases: text4(lang, "Civilization case registry", "\u6587\u660E\u6848\u4F8B Registry"), transitions: text4(lang, "Transition window registry", "\u6587\u660E\u8F6C\u578B\u7A97\u53E3 Registry"), snapshots: text4(lang, "World snapshot registry", "\u4E16\u754C\u6A2A\u5207\u9762 Registry"), comparison: text4(lang, "Comparison family registry", "\u6BD4\u8F83\u5BB6\u65CF Registry"), trajectories: text4(lang, "Long-duration trajectory registry", "\u957F\u65F6\u6BB5\u8F68\u8FF9 Registry"), timeline: text4(lang, "Timeline registry", "\u5386\u53F2\u810A\u67F1 Registry") })[kind] || text4(lang, "Civilization Atlas registry", "\u6587\u660E\u56FE\u8C31 Registry");
function atlasSources(atlas, lang) {
  return list5(atlas?.evidence).slice(0, 8).map((e) => deepFreeze({ label: `${atlasLabel(lang, e.kind)} \xB7 ${clean15(e.title || e.id)}`, excerpt: clean15(e.summary) || null, href: safeUrl2(atlas?.deepLink), sourceClass: "GOVERNED_KNOWLEDGE", sourceAuthority: "BOOK_V_CIVILIZATION_ATLAS_REGISTRY", participant: "PUBLIC", caseScope: "QUESTION", limitations: [clean15(e.authorityClass)].filter(Boolean) }));
}
function atlasSupporting(atlas, lang) {
  if (!atlas) return [];
  const s = atlas.sections || {}, out = [];
  const add = (label, items) => list5(items).filter(Boolean).slice(0, 4).forEach((x) => out.push(`${label}: ${clean15(x)}`));
  add(text4(lang, "What changed", "\u53D1\u751F\u4E86\u4EC0\u4E48\u53D8\u5316"), s.whatChanged);
  add(text4(lang, "Loss dimensions", "\u635F\u5931\u7EF4\u5EA6"), s.lossDimensions);
  add(text4(lang, "Examples", "\u6848\u4F8B"), s.examples);
  add(text4(lang, "What continued", "\u4EC0\u4E48\u7EE7\u7EED\u5B58\u5728"), s.whatContinued);
  add(text4(lang, "Evidence / unknown", "\u8BC1\u636E\uFF0F\u672A\u77E5"), s.evidenceUnknown);
  return out.slice(0, 12);
}
function projectKnowledgeAnswerForCustomer(payload = {}, { locale = "en", currentFacts = null } = {}) {
  const lang = localeOf(locale), cka = normalizedCka(payload), answer = cka?.clientAnswer || payload?.ask2?.client || {}, answerState = clean15(cka?.w5w17?.answerState || payload?.ask2?.client?.answerState) || "UNKNOWN", atlas = cka?.atlas || null, qualityOutcome = clean15(payload?.ptrc?.quality?.outcome) || null;
  const runtimeRelated = list5(answer?.relatedKnowledgeCards || cka?.w5w17?.relatedKnowledgeCards).map((card) => deepFreeze({ title: clean15(card?.concept || card?.title) || text4(lang, "Related knowledge", "\u76F8\u5173\u77E5\u8BC6"), description: clean15(card?.description) || null, href: safeUrl2(card?.href), contentType: clean15(card?.contentType) || null }));
  const atlasCard = atlas?.deepLink ? deepFreeze({ title: text4(lang, "Explore this position in Civilization Atlas", "\u5728\u6587\u660E\u56FE\u8C31\u67E5\u770B\u8FD9\u4E2A\u4F4D\u7F6E"), description: text4(lang, "Open the Atlas with the current layer and selected entities preserved.", "\u6253\u5F00\u6587\u660E\u56FE\u8C31\uFF0C\u5E76\u4FDD\u7559\u5F53\u524D\u56FE\u5C42\u4E0E\u6240\u9009\u5BF9\u8C61\u3002"), href: safeUrl2(atlas.deepLink), contentType: "ATLAS" }) : null;
  const related = [...atlasCard ? [atlasCard] : [], ...runtimeRelated];
  const facts = list5(currentFacts?.evidence).map((item) => deepFreeze({ claim: clean15(item?.claimText), source: clean15(item?.publisher || item?.title), sourceUrl: safeUrl2(item?.sourceUrl), retrievedAt: clean15(item?.retrievedAt) || null, freshness: clean15(item?.freshnessState) || null, authorityClass: clean15(item?.authorityClass) || null })).filter((x) => x.claim);
  const sources = [...atlasSources(atlas, lang), ...authoritySources(payload), ...facts.map((f) => ({ label: f.source, excerpt: f.claim, href: f.sourceUrl, retrievedAt: f.retrievedAt, freshness: f.freshness }))];
  const unknown = list5(answer?.unknown?.details).map(clean15).filter(Boolean);
  const needsReality = ["NEEDS_CONTEXT", "CURRENT_CONTEXT_REQUIRED"].includes(answerState) || payload?.ask2?.plan?.orchestrationState === "CURRENT_CONTEXT_REQUIRED";
  const runtimeDirect = clean15(answer?.directAnswer) || text4(lang, "A bounded answer is not available yet.", "\u76EE\u524D\u8FD8\u6CA1\u6709\u53EF\u7528\u7684\u8FB9\u754C\u5316\u56DE\u7B54\u3002");
  const needsClarification = sources.length === 0 && (qualityOutcome === "INSUFFICIENT" || /没有足够的受治理|not enough governed|insufficient governed/i.test(runtimeDirect));
  const direct = needsClarification ? text4(lang, "Which topic would you like to explore? Add a little detail, or browse the articles below.", "\u4F60\u60F3\u4E86\u89E3\u54EA\u4E2A\u4E3B\u9898\uFF1F\u53EF\u4EE5\u8865\u5145\u4E00\u70B9\u5177\u4F53\u4FE1\u606F\uFF0C\u6216\u5148\u6D4F\u89C8\u4E0B\u65B9\u6587\u7AE0\u3002") : atlas?.directFraming ? `${clean15(atlas.directFraming)}${runtimeDirect && runtimeDirect !== clean15(atlas.directFraming) ? (lang === "zh-Hans" ? "\n\n" : " ") + runtimeDirect : ""}` : runtimeDirect;
  const supporting = [...atlasSupporting(atlas, lang), ...list5(answer?.whyThisMayHappen).map(clean15).filter(Boolean)];
  const atlasLimits = list5(atlas?.sections?.evidenceUnknown).map(clean15).filter(Boolean);
  const limits = [...unknown, ...atlasLimits].map((value) => /canonical binding/i.test(value) ? text4(lang, "Some source material does not yet support a further conclusion.", "\u90E8\u5206\u6765\u6E90\u5C1A\u4E0D\u80FD\u652F\u6301\u8FDB\u4E00\u6B65\u7ED3\u8BBA\u3002") : /受治理.*knowledge|governed.*knowledge.*projection/i.test(value) ? text4(lang, "This is a reference explanation, not an assessment of your personal situation.", "\u8FD9\u662F\u53C2\u8003\u89E3\u91CA\uFF0C\u4E0D\u662F\u5BF9\u4F60\u4E2A\u4EBA\u5904\u5883\u7684\u5224\u65AD\u3002") : value);
  return deepFreeze({
    schemaVersion: `${CX_PROJECTION_VERSION}:ASK`,
    surface: "ASK",
    locale: lang,
    state: answerState,
    qualityOutcome,
    question: clean15(answer?.question || payload?.ask2?.client?.question) || null,
    answer: { text: direct, supporting: needsClarification ? [] : supporting, ...!needsClarification && answer.structuredAnswer ? { structuredAnswer: { mechanismOrState: clean15(answer.structuredAnswer.mechanismOrState), conditions: list5(answer.structuredAnswer.conditions).map(clean15), relatedFactors: list5(answer.structuredAnswer.relatedFactors).map(clean15), possibleTransition: clean15(answer.structuredAnswer.possibleTransition) || null, boundaryUnknown: clean15(answer.structuredAnswer.boundaryUnknown), exploreInBook: safeUrl2(answer.structuredAnswer.exploreInBook) } } : {} },
    basedOn: { sources: needsClarification ? [] : sources, statement: atlas ? text4(lang, "Civilization Atlas registry evidence is shown before broader PHI OS knowledge; current public information remains separate.", "\u6587\u660E\u56FE\u8C31 Registry evidence \u4F1A\u4F18\u5148\u4E8E\u66F4\u5E7F\u6CDB\u7684 PHI OS \u77E5\u8BC6\u663E\u793A\uFF1B\u5F53\u524D\u516C\u5171\u4FE1\u606F\u4ECD\u7136\u5206\u5F00\u3002") : facts.length ? text4(lang, "Current public information is shown separately from PHI OS reference knowledge.", "\u5F53\u524D\u516C\u5171\u4FE1\u606F\u4F1A\u4E0E PHI OS \u7684\u53C2\u8003\u77E5\u8BC6\u5206\u5F00\u663E\u793A\u3002") : text4(lang, "This answer uses only the PHI OS sources available for this question.", "\u8FD9\u4E2A\u56DE\u7B54\u53EA\u4F7F\u7528\u5F53\u524D\u95EE\u9898\u53EF\u7528\u7684 PHI OS \u6765\u6E90\u3002") },
    limits: { items: needsClarification ? [text4(lang, "A more specific question will help me find the right source.", "\u66F4\u5177\u4F53\u7684\u95EE\u9898\u6709\u52A9\u4E8E\u627E\u5230\u5408\u9002\u7684\u6765\u6E90\u3002")] : limits.length ? limits : [text4(lang, "No additional limitation was supplied by the runtime.", "\u8FD0\u884C\u65F6\u6CA1\u6709\u63D0\u4F9B\u989D\u5916\u9650\u5236\u3002")] },
    relatedKnowledge: needsClarification ? [{ title: text4(lang, "Browse articles", "\u6D4F\u89C8\u6587\u7AE0"), href: "/articles" }] : related,
    possibleNextStep: needsClarification ? { kind: "RELATED_KNOWLEDGE", label: text4(lang, "Browse articles", "\u6D4F\u89C8\u6587\u7AE0") } : atlasCard ? { kind: "RELATED_KNOWLEDGE", label: text4(lang, "Explore in Civilization Atlas", "\u5728\u6587\u660E\u56FE\u8C31\u7EE7\u7EED\u63A2\u7D22") } : { kind: needsReality ? "REALITY_ESCALATION" : related.length ? "RELATED_KNOWLEDGE" : "OBSERVE", label: needsReality ? text4(lang, "Continue in My Reality", "\u5728 My Reality \u7EE7\u7EED") : related.length ? text4(lang, "Explore related knowledge", "\u67E5\u770B\u76F8\u5173\u77E5\u8BC6") : text4(lang, "Observe what changes next", "\u7EE7\u7EED\u89C2\u5BDF\u4E0B\u4E00\u6B65\u53D8\u5316") },
    currentFacts: { state: clean15(currentFacts?.state) || "NOT_USED", retrievedAt: clean15(currentFacts?.retrievedAt) || null, freshness: clean15(currentFacts?.freshness) || null, limitations: list5(currentFacts?.limitations).map(clean15).filter(Boolean), evidence: facts },
    handoff: { available: true, question: clean15(answer?.question || payload?.ask2?.client?.question) || null, externalEvidence: facts.map((f) => deepFreeze({ sourceId: f.sourceUrl || f.source, statement: f.claim, sourceUrl: f.sourceUrl, authorityClass: f.authorityClass })), unknown },
    atlas: atlas ? deepFreeze({ intent: atlas.intent, deepLink: atlas.deepLink, retrievalPriority: atlas.retrievalPriority, evidenceCount: list5(atlas.evidence).length }) : null,
    governance: { currentFactsAreCanonicalKnowledge: false, aiPersonalityIsProductIdentity: false, atlasRegistryPromotedToCanonicalKnowledge: false, secondAskRuntimeCreated: false, secondRetrievalRuntimeCreated: false, ...sourceLineage(["CKA", "KAP", "CIVILIZATION_ATLAS_REGISTRY", "CURRENT_FACTS_GATEWAY"]), ...boundary() }
  });
}

// functions/customer-projection/contextual-ask-customer-projection.js
var freeze8 = (v) => {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v)) freeze8(x);
  }
  return v;
};
var clean16 = (v) => String(v ?? "").trim();
var list6 = (v) => Array.isArray(v) ? v : [];
var safeHref = (v) => {
  const s = clean16(v);
  if (!s) return null;
  if (s.startsWith("/")) return s;
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
};
function contextSourceCards(contexts, answerPayload) {
  const ask2Internal = answerPayload?.ask2?.plan?.currentReality?.internal;
  return list6(contexts).filter((item) => item.contextType !== "KNOWLEDGE").map((item) => freeze8({
    label: item.label,
    sourceClass: item.sourceClass,
    sourceAuthority: item.sourceAuthority,
    participant: item.participant,
    caseScope: item.caseScope,
    excerpt: item.summary || null,
    href: null,
    retrievedAt: item.generatedAt || null,
    freshness: item.freshness || null,
    limitations: item.limitations,
    answerUseState: item.contextType === "CURRENT_REALITY" && ask2Internal ? "CONSUMED_BY_CURRENT_CONTEXT_RUNTIME" : "SELECTED_CONTEXT_DISCLOSED",
    contextRef: item.contextRef
  }));
}
function projectContextualAskForCustomer(baseView = {}, { contexts = [], currentFacts = null, answerPayload = null, locale = "en" } = {}) {
  const disclosure = contextualAskDisclosure(contexts, currentFacts, locale);
  const runtimeSources = list6(baseView?.basedOn?.sources).map((s) => freeze8({ label: clean16(s?.label) || "Source", sourceClass: clean16(s?.sourceClass) || "GOVERNED_SOURCE", sourceAuthority: clean16(s?.sourceAuthority) || null, participant: clean16(s?.participant) || null, caseScope: clean16(s?.caseScope) || null, excerpt: clean16(s?.excerpt) || null, href: safeHref(s?.href), retrievedAt: clean16(s?.retrievedAt) || null, freshness: clean16(s?.freshness) || null, limitations: list6(s?.limitations), answerUseState: "RUNTIME_GROUNDING", contextRef: null }));
  const contextCards = contextSourceCards(contexts, answerPayload);
  const allSources = [...runtimeSources, ...contextCards];
  const groups = [];
  for (const source of allSources) {
    let group = groups.find((x) => x.sourceClass === source.sourceClass);
    if (!group) {
      group = { sourceClass: source.sourceClass, sources: [] };
      groups.push(group);
    }
    group.sources.push(source);
  }
  return freeze8({ ...baseView, schemaVersion: "PHI-OS-CX-R9-R2-CONTEXTUAL-ASK-CUSTOMER-v2.0.0", surface: "CONTEXTUAL_ASK", canonicalRoute: "/knowledge/ask/", selectedContext: disclosure, answerStructure: { answer: baseView?.answer || null, basedOnGroups: groups, currentVsStable: disclosure.currentVsStable, limits: baseView?.limits || { items: [] }, related: baseView?.relatedKnowledge || [], nextStep: baseView?.possibleNextStep || null }, provenance: { groups, collapsedByDefault: true, internalLifecycleCodesVisibleByDefault: false }, governance: { ...baseView?.governance || {}, oneContextualAsk: true, genericChatbotSurface: false, silentContextInjection: false, selectedContextEqualsProof: false, profileConvergenceIsProof: false, relationshipHiddenStateInference: false, professionalRecommendationCreatedByAsk: false, entitlementOwnedByAsk: false } });
}

// functions/api/customer-contextual-ask.js
var H = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" };
var json3 = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: H });
var clean17 = (v) => String(v ?? "").trim();
function requestedContexts(body) {
  const list7 = Array.isArray(body?.contexts) ? body.contexts : [];
  if (list7.length) return list7;
  if (body?.questionOnly === true) return [];
  return [{ contextType: "KNOWLEDGE" }];
}
var safePublicText = (value, max = 160) => clean17(value).slice(0, max);
async function publicationNavigation(base, entry, selected, env, locale) {
  if (entry?.bookCode !== "BOOK-5") return base;
  const hrefs = [...new Set([...base.basedOn?.sources || [], ...base.relatedKnowledge || []].map((r) => r.href?.split(/[?#]/)[0]).filter((h) => /^\/articles\/book5-[a-z0-9-]+$/.test(h || "")))].slice(0, 3);
  const articles = selected ? [selected] : (await Promise.all(hrefs.map((h) => resolveSelectedArticle(env, h.slice("/articles/".length), locale)))).filter(Boolean);
  const navigationKey = (href) => {
    const u = new URL(href, "https://phios.local");
    u.searchParams.delete("locale");
    u.searchParams.sort();
    return u.pathname + u.search + u.hash;
  };
  const publicHref = (href) => {
    if (href.startsWith("/articles/")) return href.split("#")[0];
    const u = new URL(href, "https://phios.local");
    if (u.pathname === "/books/reality-differentiation/" && u.searchParams.has("atlas")) {
      u.searchParams.set("locale", locale);
      return u.pathname + u.search + u.hash;
    }
    return href;
  };
  const titles = new Map(articles.map((a) => [navigationKey(a.href), a.title]));
  for (const article of articles) for (const link of article.atlasLinks) titles.set(navigationKey(link.href), link.label);
  const related = [...articles.map((a) => ({ title: a.title, href: a.href })), ...articles.flatMap((a) => a.atlasLinks.map((l) => ({ title: l.label, href: l.href }))), ...base.relatedKnowledge || []];
  const byHref = /* @__PURE__ */ new Map();
  for (const r of related.filter((r2) => r2.href)) {
    const href = publicHref(r.href), key = navigationKey(href);
    if (!byHref.has(key)) byHref.set(key, { ...r, href });
  }
  const distinct = [...byHref.values()];
  const sources = [...new Map((base.basedOn?.sources || []).map((s) => {
    const href = s.href ? publicHref(s.href) : s.href, key = href ? navigationKey(href) : s.label;
    return [key, { ...s, label: titles.get(key) || (locale === "zh-Hans" ? "\u7B2C\u4E94\u518C\u53C2\u8003\u8D44\u6599" : "Book V reference"), href }];
  })).values()];
  return { ...base, relatedKnowledge: distinct.slice(0, 10), basedOn: { ...base.basedOn, sources } };
}
function safeInternalRoute(value) {
  const route = clean17(value);
  return /^\/[a-zA-Z0-9/_?&=.%+-]*$/.test(route) && !route.startsWith("//") ? route.slice(0, 240) : null;
}
function explicitKnowledgeEntryContext(contexts, body) {
  const selected = contexts.find((item) => item.contextType === "KNOWLEDGE" && item.contextRef !== "PHIOS_GOVERNED_KNOWLEDGE");
  if (!selected || !isPublicKnowledgeContextRef(selected.contextRef)) return null;
  const supplied = body?.knowledgeContext || {};
  const suppliedRef = clean17(supplied.contextRef);
  const ref = suppliedRef === selected.contextRef ? suppliedRef : selected.contextRef;
  const [kind, id] = ref.split(":");
  const entrySurface = kind === "ARTICLE" ? "ARTICLE" : kind === "BOOK" ? "BOOK" : kind === "FIGURE" ? "FIGURE" : "KNOWLEDGE_SEARCH";
  const entry = { entrySurface, entryRoute: safeInternalRoute(supplied.contextRoute) || "/knowledge/", contextType: "KNOWLEDGE", contextId: ref, contextLabel: safePublicText(supplied.contextLabel) || selected.label, contextSummary: safePublicText(supplied.contextSummary, 320) || null, readingPath: safePublicText(supplied.readingPath, 240) || null, relatedKnowledgeRef: isPublicKnowledgeContextRef(supplied.relatedKnowledgeRef) ? supplied.relatedKnowledgeRef : ref, retrievalScope: normalizeAtlasRetrievalScope(supplied.retrievalScope), mode: "CONTEXTUAL" };
  if (kind === "ARTICLE") entry.articleCode = id;
  if (kind === "BOOK") entry.bookCode = id;
  if (kind === "FIGURE") entry.figureCode = id;
  return entry;
}
function questionOnlyView(question, locale, currentFacts) {
  const zh = locale === "zh-Hans", facts = (currentFacts?.evidence || []).map((x) => ({ claim: x.claimText, source: x.publisher || x.title, sourceUrl: x.sourceUrl, retrievedAt: x.retrievedAt, freshness: x.freshnessState, authorityClass: x.authorityClass }));
  return { schemaVersion: "PHI-OS-CX-R9-R2-QUESTION-ONLY-v1.0.0", surface: "ASK", locale, state: facts.length ? "CURRENT_FACTS_ONLY" : "NO_GOVERNED_CONTEXT_SELECTED", question, answer: { text: facts.length ? zh ? "\u6211\u627E\u5230\u4E86\u4E0E\u4F60\u7684\u95EE\u9898\u6709\u5173\u7684\u5F53\u524D\u516C\u5171\u4FE1\u606F\uFF1B\u6CA1\u6709\u52A0\u5165\u4EFB\u4F55\u4E2A\u4EBA\u8D44\u6599\u3002" : "I found current public information relevant to your question; no personal information was added." : zh ? "\u8FD9\u6B21\u6CA1\u6709\u9009\u62E9\u53EF\u7528\u4E8E\u56DE\u7B54\u7684\u6765\u6E90\uFF0C\u56E0\u6B64 PHI OS \u4E0D\u4F1A\u7528\u65E0\u5173\u5185\u5BB9\u628A\u7F3A\u53E3\u586B\u6EE1\u3002" : "No source was selected for this answer, so PHI OS will not fill the gap with unrelated content.", supporting: [] }, basedOn: { sources: facts.map((f) => ({ label: f.source, excerpt: f.claim, href: f.sourceUrl, retrievedAt: f.retrievedAt, freshness: f.freshness })), statement: zh ? "\u6CA1\u6709\u81EA\u52A8\u52A0\u5165\u8D26\u6237\u6216\u4E2A\u4EBA\u8D44\u6599\u3002" : "No account or personal information was added automatically." }, limits: { items: [zh ? "\u5982\u679C\u5E0C\u671B\u56DE\u7B54\u66F4\u8D34\u8FD1\u4F60\u7684\u60C5\u51B5\uFF0C\u53EF\u4EE5\u9009\u62E9\u4E00\u4E2A\u6765\u6E90\uFF0C\u6216\u52A0\u5165\u5F53\u524D\u5904\u5883\u3002" : "To make the answer more contextual, choose a source or add your current situation."] }, relatedKnowledge: [], possibleNextStep: { kind: "SELECT_CONTEXT", label: zh ? "\u9009\u62E9\u6765\u6E90\u540E\u91CD\u65B0\u63D0\u95EE" : "Choose a source and ask again" }, currentFacts: { state: currentFacts?.state || "NOT_USED", retrievedAt: currentFacts?.retrievedAt || null, freshness: currentFacts?.freshness || null, limitations: currentFacts?.limitations || [], evidence: facts }, handoff: { available: false }, governance: { currentFactsAreCanonicalKnowledge: false, recommends: false } };
}
function serverResolvedSeedAvailability(context, locale, seed) {
  const type = clean17(seed?.contextType).toUpperCase(), ref = clean17(seed?.contextRef);
  if (!type || !ref || type === "KNOWLEDGE" || type === "CURRENT_REALITY") return null;
  const resolved = Array.isArray(context.data?.resolvedAskContexts) ? context.data.resolvedAskContexts : [];
  try {
    const accepted = resolveExplicitAskContexts({ requested: [{ contextType: type, contextRef: ref }], resolvedContexts: resolved, locale });
    const item = accepted[0];
    if (!item) return null;
    return { contextType: item.contextType, label: item.label, sourceClass: item.sourceClass, participant: item.participant, caseScope: item.caseScope, availability: "AVAILABLE_FROM_SOURCE", reason: "SERVER_RESOLVED_SOURCE_CONTEXT", requestedContextRef: item.contextRef, generatedAt: item.generatedAt || null };
  } catch {
    return null;
  }
}
async function onRequestGet(context = {}) {
  const url = new URL(context.request?.url || "https://phios.test/api/customer-contextual-ask");
  const locale = url.searchParams.get("locale") === "zh-Hans" ? "zh-Hans" : "en";
  const seed = normalizeAskContext(url.searchParams);
  const availability = [...buildAskContextAvailability({ locale, requestedContextSeed: seed })];
  const authorized = serverResolvedSeedAvailability(context, locale, seed);
  if (authorized) {
    const index = availability.findIndex((x) => x.contextType === authorized.contextType);
    if (index >= 0) availability[index] = authorized;
    else availability.push(authorized);
  }
  return json3({ ok: true, canonicalRoute: "/knowledge/ask/", availability });
}
async function onRequestPost3(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json3({ ok: false, error: "INVALID_JSON" }, 400);
  }
  ;
  const question = clean17(body?.question || body?.q);
  if (!question) return json3({ ok: false, error: "ASK_QUESTION_REQUIRED" }, 400);
  const locale = body?.locale === "zh-Hans" ? "zh-Hans" : "en";
  let guidedRoute = null;
  if (body?.selectedMethod || body?.methodGuidanceRequested === true) {
    const url = new URL("/content/customer-experience-rebuild/registries/cx-r12r4-method-availability-registry-v1.json", context.request.url);
    const registryResponse = await (context.env?.ASSETS?.fetch ? context.env.ASSETS.fetch(new Request(url)) : fetch(url));
    if (!registryResponse.ok) return json3({ ok: false, error: "METHOD_GUIDANCE_REGISTRY_UNAVAILABLE" }, 503);
    const registry2 = await registryResponse.json();
    try {
      guidedRoute = routeGuidedAsk({ question, selectedMethod: body.selectedMethod, methodGuidanceRequested: body.methodGuidanceRequested, registry: registry2 });
    } catch (error) {
      return json3({ ok: false, error: error.code }, 422);
    }
    const choices = [guidedRoute.method || guidedRoute.primary, ...guidedRoute.alternatives || []].filter(Boolean).map((id) => {
      const m = [...registry2.guidedReportMethods || [], ...registry2.methods].find((m2) => m2.methodId === id);
      return { methodId: id, title: m.label[locale], formValue: m.formValue || null, href: m.formValue ? `/perspectives/personal/?method=${encodeURIComponent(m.formValue)}` : id === "PROFILE" ? "/perspectives/profile/" : "/perspectives/personal/", requires: m.routingProfile?.requires || [] };
    });
    return json3({ ok: true, guidedRoute, choices, view: projectContextualAskForCustomer({ surface: "ASK", locale, state: guidedRoute.mode, question, answer: { text: choices.length ? locale === "zh-Hans" ? `${choices[0].title}\u53EF\u80FD\u662F\u4E00\u4E2A\u6709\u7528\u7684\u8D77\u70B9\uFF0C\u4F60\u4E5F\u53EF\u4EE5\u9009\u62E9\u5176\u4ED6\u65B9\u6CD5\u3002` : `${choices[0].title} may be a useful starting point; you can choose another method.` : locale === "zh-Hans" ? "\u53EF\u4EE5\u5148\u8BF4\u660E\u4F60\u60F3\u4E86\u89E3\u5F53\u524D\u8FD0\u884C\u3001\u957F\u671F\u7ED3\u6784\uFF0C\u8FD8\u662F\u65F6\u95F4\u9636\u6BB5\u3002" : "You can clarify whether you want to explore current operation, baseline structure, or timing.", supporting: [] }, basedOn: { sources: [], statement: "" }, limits: { items: [] }, relatedKnowledge: choices, handoff: { available: false } }, { contexts: [], locale }) });
  }
  const navigation = knowledgeNavigationIntent(question, locale);
  if (navigation) {
    const base2 = { surface: "ASK", locale, state: "NAVIGATION", question, answer: { text: navigation.text, supporting: [] }, basedOn: { sources: [], statement: "" }, limits: { items: [] }, relatedKnowledge: [{ title: navigation.title, href: navigation.href }], possibleNextStep: { kind: "RELATED_KNOWLEDGE", label: navigation.title }, handoff: { available: false }, currentFacts: { state: "NOT_USED", evidence: [] } };
    return json3({ ok: true, view: projectContextualAskForCustomer(base2, { contexts: [], locale }), governance: { navigationOnly: true, rawAskRuntimeExposed: false } });
  }
  const currentFacts = await retrieveCurrentFacts({ question, env: context.env || {}, fetcher: fetch });
  let contexts;
  try {
    contexts = resolveExplicitAskContexts({ requested: requestedContexts(body), guidedContext: body?.guidedContext || {}, contextConsent: body?.contextConsent || {}, resolvedContexts: Array.isArray(context.data?.resolvedAskContexts) ? context.data.resolvedAskContexts : [], locale });
  } catch (error) {
    return json3({ ok: false, error: error.code || error.message || "ASK_CONTEXT_REJECTED", contextNotUsed: true }, error.status || 422);
  }
  if (body.guidedRouting === true && !contexts.some((c) => c.contextType !== "KNOWLEDGE" || c.contextRef !== "PHIOS_GOVERNED_KNOWLEDGE")) {
    const route = routeGuidedAsk({ question, confirmedReality: contexts.some((x) => x.contextType === "CURRENT_REALITY") ? true : null });
    if (route.mode === "CLARIFY") {
      const base2 = { surface: "ASK", locale, state: "CLARIFY", question, answer: { text: locale === "zh-Hans" ? "\u73B0\u5728\u5177\u4F53\u53D1\u751F\u4E86\u4EC0\u4E48\uFF1F\u4F60\u6700\u5E0C\u671B\u5F04\u6E05\u54EA\u4E00\u4EF6\u4E8B\uFF1F" : "What is happening now, and what would be most useful to understand?", supporting: [] }, basedOn: { sources: [], statement: "" }, limits: { items: [] }, relatedKnowledge: [], handoff: { available: false } };
      return json3({ ok: true, guidedRoute: route, view: projectContextualAskForCustomer(base2, { contexts: [], locale }) });
    }
  }
  if (contexts.length === 0) {
    const base2 = questionOnlyView(question, locale, currentFacts);
    return json3({ ok: true, view: projectContextualAskForCustomer(base2, { contexts, currentFacts, locale }), governance: { rawAskRuntimeExposed: false, silentAccountContextSweep: false } });
  }
  const currentRealitySelected = contexts.some((x) => x.contextType === "CURRENT_REALITY");
  const currentExternalEvidence = (currentFacts.evidence || []).map((e) => ({ sourceId: e.sourceId, claimText: e.claimText, title: e.title, sourceUrl: e.sourceUrl, authorityClass: e.authorityClass, publisher: e.publisher, retrievedAt: e.retrievedAt, freshnessState: e.freshnessState }));
  const entryContext = explicitKnowledgeEntryContext(contexts, body);
  let selectedArticle = null;
  if (entryContext?.articleCode) {
    const selected = await resolveSelectedArticle(context.env || {}, entryContext.articleCode, locale);
    if (!selected) return json3({ ok: false, error: "SELECTED_SOURCE_UNAVAILABLE", contextNotUsed: true }, 422);
    selectedArticle = selected;
    entryContext.articleCode = selected.slug;
    entryContext.bookCode = selected.bookCode;
    entryContext.articleContext = selected.articleContext;
    entryContext.contextLabel = selected.title;
    entryContext.entryRoute = selected.href;
    entryContext.contextSummary = null;
    contexts = contexts.map((c) => c.contextRef === entryContext.contextId ? { ...c, label: selected.title } : c);
  }
  if (entryContext) Object.assign(entryContext, await resolveFormationEntry(entryContext.contextId, context.env || {}));
  const forwarded = { q: question, locale, taxonomyHint: body?.taxonomyHint || null, guidedContext: currentRealitySelected ? body?.guidedContext || {} : {}, publicRequest: true, currentExternalEvidence, externalCurrentRequired: currentFacts.state === "AVAILABLE" ? true : null, contextualAsk: true, ...entryContext ? { entryContext } : {} };
  const request = new Request(new URL("/api/ask-phios-orchestrated", context.request.url), { method: "POST", headers: { "content-type": "application/json", "accept": "application/json" }, body: JSON.stringify(forwarded) });
  const response2 = await onRequestPost2({ ...context, request });
  const payload = await response2.json().catch(() => ({}));
  if (!response2.ok || payload?.ok !== true) return json3({ ok: false, error: payload?.error?.code || payload?.error || "ASK_RUNTIME_FAILED" }, response2.status || 422);
  let base = projectKnowledgeAnswerForCustomer(payload, { locale, currentFacts });
  if (selectedArticle) {
    base = { ...base, answer: { ...base.answer, text: base.answer.text, supporting: base.answer.supporting }, basedOn: { ...base.basedOn, sources: base.basedOn.sources.map((s) => s.href === selectedArticle.href ? { ...s, label: selectedArticle.title } : s) }, relatedKnowledge: [{ title: selectedArticle.title, href: selectedArticle.href }, ...(base.relatedKnowledge || []).filter((s) => s.href !== selectedArticle.href)] };
  }
  if (entryContext?.bookCode === "BOOK-6" && entryContext.retrievalScope?.dossierId) {
    base = { ...base, limits: { ...base.limits, items: [...base.limits?.items || [], locale === "zh-Hans" ? "\u63A5\u53D7\u53EA\u8986\u76D6\u6709\u51ED\u8BC1\u7684\u5B50\u7CFB\u7EDF\u4F4D\u7F6E\uFF1B\u6574\u5730\u533A\u4F4D\u7F6E\u4FDD\u6301\u672A\u77E5\uFF08UNKNOWN\uFF09\u3002\u672A\u63A5\u53D7\u5730\u533A\u4FDD\u6301\u672A\u77E5\u3002\u6765\u6E90\u8BB0\u5F55\u65F6\u95F4\u4E0D\u81EA\u52A8\u8BC1\u660E\u5F53\u524D\u65F6\u6548\u6027\u3002" : "Acceptance covers only evidenced subsystem positions; the whole dossier remains UNKNOWN. Unaccepted regions remain UNKNOWN. Source timestamps do not automatically establish current freshness."] } };
  }
  base = await publicationNavigation(base, entryContext, selectedArticle, context.env || {}, locale);
  const view = projectContextualAskForCustomer(base, { contexts, currentFacts, answerPayload: payload, locale });
  return json3({ ok: true, view, governance: { rawAskRuntimeExposed: false, currentFactsCanonicalKnowledge: false, browserThirdPartyRetrieval: false, silentAccountContextSweep: false, clientCannotSelfAuthorizePaidOrRelationshipContext: true } });
}

// functions/api/public-asset-config.js
var HTTPS_URL = /^https:\/\/[^\s]+$/i;
function normalize3(value) {
  const raw = String(value ?? "").trim();
  if (!raw || !HTTPS_URL.test(raw)) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}
function onRequestGet2({ env = {} }) {
  const publicAssetBaseUrl = normalize3(env.PHIOS_PUBLIC_ASSET_BASE_URL);
  if (!publicAssetBaseUrl) {
    return Response.json({ success: false, code: "PUBLIC_ASSET_BASE_URL_UNAVAILABLE", deliveryState: "FAIL_CLOSED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  return Response.json({
    success: true,
    publicAssetBaseUrl,
    source: "PHIOS_PUBLIC_ASSET_BASE_URL",
    registryVersion: "1.0.0",
    deliveryState: "CONFIGURED_NOT_UPSTREAM_VERIFICATION_AUTHORITY"
  }, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" } });
}

// content/registry/thesis.json
var thesis_default = {
  registry_version: "1.0.0",
  thesis_id: "reality-navigation-thesis",
  title: "Reality Navigation Thesis",
  status: "completed-source-registered-version-pending",
  version: null,
  authority: [
    "reality-navigation-category",
    "unified-runtime-framework",
    "research-to-infrastructure-bridge"
  ],
  architecture_chain: [
    "reality-navigation-thesis",
    "phios-knowledge-system",
    "runtime-blueprint",
    "reality-navigation-platform"
  ],
  source_file: "PHI OS Reality Navigation Thesis.pdf",
  source_size_bytes: 15994918,
  source_identity_status: "canonical-clean-filename-selected-among-equal-size-duplicates",
  web_route: "/thesis",
  freeze_blocker: "\u6B63\u5F0F PDF \u5DF2\u767B\u8BB0\uFF1B\u4ECD\u987B\u786E\u5B9A\u7248\u672C\u53F7\u5E76\u5EFA\u7ACB changelog \u540E\u624D\u80FD\u6807\u8BB0 stable\u3002",
  current_public_delivery: {
    object_key: "downloads/thesis/reality-navigation-thesis.pdf",
    public_url: "https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/downloads/thesis/reality-navigation-thesis.pdf",
    size_bytes: 3044299,
    sha256: "59452e4a00b853cee8260f500e3c758ca3b01ecec23589c586dbcb854c455c09",
    page_count: 104,
    owner_confirmation: {
      date: "2026-10-09",
      instruction: "Thesis \u7684 R2 \u6587\u4EF6\u7EA6 3 MB \u662F\u6B63\u786E\u7684\u7248\u672C",
      scope: "Existing R2 PDF is the correct current public delivery; no new numbered stable release inferred."
    },
    verification_evidence: "docs/assets/r2-public/wiring-20261009/THESIS-PDF.json",
    historical_source_registration_preserved: true
  }
};

// functions/api/thesis-download.js
async function onRequestGet3() {
  const delivery = thesis_default.current_public_delivery;
  if (!delivery?.owner_confirmation || delivery.object_key !== "downloads/thesis/reality-navigation-thesis.pdf") return new Response("Thesis delivery unavailable", { status: 503 });
  const upstream = await fetch(delivery.public_url);
  if (!upstream.ok || !upstream.headers.get("content-type")?.includes("application/pdf")) return new Response("Thesis PDF unavailable", { status: 502 });
  const bytes = await upstream.arrayBuffer();
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (b) => b.toString(16).padStart(2, "0")).join("");
  if (bytes.byteLength !== delivery.size_bytes || digest !== delivery.sha256) return new Response("Thesis version requires review", { status: 502 });
  return new Response(bytes, { headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="reality-navigation-thesis.pdf"', "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
}

// scripts/lib/book-publication-review-server.mjs
var root = process.cwd();
function resolveFile(pathname) {
  let file = path.resolve(root, "." + decodeURIComponent(pathname));
  if (file !== root && !file.startsWith(root + path.sep)) return null;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  else if (!fs.existsSync(file) && fs.existsSync(file + ".html")) file += ".html";
  return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
}
function createPublicationReviewServer() {
  const bindings = JSON.parse(fs.readFileSync("content/civilization-atlas/visuals/civilization-visual-approved-bindings-v1.json"));
  const env = { PHIOS_PUBLIC_ASSET_BASE_URL: new URL(bindings.assets[0].publicUrl).origin, ASSETS: { fetch: async (request) => {
    const file = resolveFile(new URL(request.url).pathname);
    return file ? new Response(fs.readFileSync(file)) : new Response("", { status: 404 });
  } } };
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://127.0.0.1");
      if (url.pathname.startsWith("/api/")) {
        const handler = url.pathname === "/api/customer-contextual-ask" ? req.method === "POST" ? onRequestPost3 : onRequestGet : url.pathname === "/api/public-asset-config" ? onRequestGet2 : url.pathname === "/api/thesis-download" && req.method === "GET" ? onRequestGet3 : null;
        if (!handler) {
          res.writeHead(503, { "content-type": "application/json" }).end(JSON.stringify({ ok: false, error: "NOT_AVAILABLE_IN_LOCAL_REVIEW" }));
          return;
        }
        let body = "";
        for await (const chunk of req) body += chunk;
        const request = new Request(url, { method: req.method, ...req.method === "POST" ? { body, headers: { "content-type": "application/json" } } : {} });
        const response2 = await handler({ request, env });
        res.writeHead(response2.status, Object.fromEntries(response2.headers));
        res.end(Buffer.from(await response2.arrayBuffer()));
        return;
      }
      const file = resolveFile(url.pathname);
      if (!file) {
        res.writeHead(404).end();
        return;
      }
      const mime = { ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".html": "text/html", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".avif": "image/avif" };
      res.writeHead(200, { "content-type": mime[path.extname(file)] || "application/octet-stream" });
      res.end(fs.readFileSync(file));
    } catch (error) {
      res.writeHead(500, { "content-type": "text/plain" }).end(String(error));
    }
  });
}
export {
  createPublicationReviewServer
};
