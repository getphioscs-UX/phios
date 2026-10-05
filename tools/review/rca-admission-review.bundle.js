// functions/current-reality/personal-current-reality-runtime.js
var INPUT_SCHEMA = "PHI-OS-PERSONAL-CURRENT-REALITY-INPUT-v2";
var OBSERVATION_SCHEMA = "PHI-OS-CURRENT-REALITY-OBSERVATION-v1";
var COMPARISON_SCHEMA = "PHI-OS-REALITY-COMPARISON-v1";
var CORRELATION_SCHEMA = "PHI-OS-METHOD-CURRENT-REALITY-CORRELATION-v1";
var CURRENT_REALITY_DOMAINS = Object.freeze([
  "CURRENT_STATE",
  "LOAD",
  "DRIFT",
  "DECISION",
  "EXECUTION",
  "RELATIONSHIP",
  "ENVIRONMENT",
  "RESOURCES",
  "RECOVERY",
  "OPEN_LOOPS",
  "BODY_CARRIER",
  "INPUT_SENSITIVITY"
]);
var CURRENT_REALITY_SENSITIVE_DOMAINS = Object.freeze(["HEALTH", "TRAUMA", "FINANCIAL", "RELATIONSHIP_SENSITIVE"]);
var REALITY_COMPARISON_STATES = Object.freeze(["CURRENTLY_RESONANT", "PARTIALLY_RESONANT", "CURRENTLY_NOT_RESONANT", "OPEN"]);
var CURRENT_REALITY_PURPOSE = "PERSONAL_READING_REALITY_COMPARISON";
var GENERAL = new Set(CURRENT_REALITY_DOMAINS);
var SENSITIVE = new Set(CURRENT_REALITY_SENSITIVE_DOMAINS);
var STATES = new Set(REALITY_COMPARISON_STATES);
var PROMPTS = /* @__PURE__ */ new Set(["ACTIVE_NOW", "HEAVY_NOW", "UNCERTAIN_NOW", "DECISION_STUCK", "ENERGY_COST", "SUPPORTIVE_NOW", "REPEATING_NOW", "UNDERSTAND_NOW", "DOMAIN_DETAIL", "SENSITIVE_DETAIL", "CARRIER_CONDITIONS", "CARRIER_ENVIRONMENT", "EXPERIENCE_SELECTION", "EXPERIENCE_STABILIZATION", "EXPERIENCE_PERSPECTIVE", "EXPERIENCE_MOTIVATION", "CONTEXT_COUNTER_EVIDENCE"]);
var clean = (v) => String(v ?? "").trim();
var list = (v) => Array.isArray(v) ? v : [];
var freeze = (v) => {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v)) freeze(x);
  }
  return v;
};
function fail(code, status = 422) {
  const e = new Error(code);
  e.code = code;
  e.status = status;
  throw e;
}
function clipped(v, max) {
  const s = clean(v);
  if (s.length > max) fail("CURRENT_REALITY_TEXT_TOO_LONG");
  return s;
}
function normalizeObservation(raw, index, { sensitive = false } = {}) {
  const domain = clean(raw?.domain).toUpperCase();
  const allowed = sensitive ? SENSITIVE : GENERAL;
  if (!allowed.has(domain)) fail(sensitive ? "CURRENT_REALITY_SENSITIVE_DOMAIN_INVALID" : "CURRENT_REALITY_DOMAIN_INVALID");
  const text2 = clipped(raw?.text, 600);
  if (!text2) fail("CURRENT_REALITY_OBSERVATION_TEXT_REQUIRED");
  const promptId = clean(raw?.promptId || "DOMAIN_DETAIL").toUpperCase();
  if (!PROMPTS.has(promptId)) fail("CURRENT_REALITY_PROMPT_INVALID");
  return freeze({ inputObservationId: `CR-IN-${String(index + 1).padStart(2, "0")}`, domain, promptId, text: text2, sensitive });
}
function normalizePersonalCurrentRealityInput(raw = {}, locale = "en") {
  const observations = list(raw?.observations), sensitiveObservations = list(raw?.sensitiveObservations);
  const anyInput = observations.length > 0 || sensitiveObservations.length > 0;
  if (anyInput && raw?.optIn !== true) fail("CURRENT_REALITY_EXPLICIT_OPT_IN_REQUIRED", 403);
  const purposeCode = clean(raw?.purposeCode);
  if (anyInput && purposeCode !== CURRENT_REALITY_PURPOSE) fail("CURRENT_REALITY_EXPLICIT_PURPOSE_REQUIRED");
  if (observations.length > 8) fail("CURRENT_REALITY_CORE_OBSERVATION_LIMIT_EXCEEDED");
  if (sensitiveObservations.length > 4) fail("CURRENT_REALITY_SENSITIVE_OBSERVATION_LIMIT_EXCEEDED");
  if (sensitiveObservations.length && raw?.sensitiveConsent !== true) fail("CURRENT_REALITY_SENSITIVE_CONSENT_REQUIRED", 403);
  const normalized = observations.map((x, i) => normalizeObservation(x, i));
  const sensitive = sensitiveObservations.map((x, i) => normalizeObservation(x, normalized.length + i, { sensitive: true }));
  return freeze({
    schemaVersion: INPUT_SCHEMA,
    locale: locale === "zh-Hans" ? "zh-Hans" : "en",
    optIn: anyInput,
    purposeCode: anyInput ? CURRENT_REALITY_PURPOSE : null,
    collectionMode: "PROGRESSIVE_MINIMAL",
    observations: freeze([...normalized, ...sensitive]),
    sensitiveConsent: sensitive.length > 0,
    governance: freeze({ explicitOptInRequired: true, explicitPurposeRequired: true, minimalCollection: true, automaticPersistence: false, customerInputPromotedToObjectiveFact: false })
  });
}
function canonicalizeCurrentRealityObservations(input) {
  if (input?.schemaVersion !== INPUT_SCHEMA) fail("CURRENT_REALITY_INPUT_V2_REQUIRED");
  const observations = list(input.observations).map((item, index) => freeze({
    observationId: `CR-OBS-${String(index + 1).padStart(2, "0")}`,
    domain: item.domain,
    promptId: item.promptId,
    statement: item.text,
    source: "CUSTOMER",
    confidence: "SELF_REPORTED",
    sensitive: item.sensitive === true,
    objectiveFact: false,
    diagnosis: false,
    professionalEvidence: false
  }));
  return freeze({
    schemaVersion: OBSERVATION_SCHEMA,
    observations: freeze(observations),
    governance: freeze({ sourceAlwaysCustomer: true, confidenceAlwaysSelfReported: true, selfReportMayBecomeDiagnosis: false, selfReportMayBecomeMethodProof: false, automaticPersistence: false })
  });
}
var PERSONAL_CURRENT_REALITY_SCHEMAS = Object.freeze({ input: INPUT_SCHEMA, observation: OBSERVATION_SCHEMA, comparison: COMPARISON_SCHEMA, correlation: CORRELATION_SCHEMA });
function guidedRealityQuestions(mode = "GUIDED", locale = "en") {
  const rows = [["intent", "UNDERSTAND_NOW", "What would you like to understand?", "\u4F60\u60F3\u5F04\u6E05\u4EC0\u4E48\uFF1F"], ["happening", "ACTIVE_NOW", "What is actually happening?", "\u5B9E\u9645\u6B63\u5728\u53D1\u751F\u4EC0\u4E48\uFF1F"], ["outcome", "DECISION_STUCK", "What would be useful to leave with?", "\u4F60\u5E0C\u671B\u5E26\u8D70\u4EC0\u4E48\u5E2E\u52A9\uFF1F"], ["duration", "REPEATING_NOW", "How long has this been happening?", "\u8FD9\u79CD\u60C5\u51B5\u6301\u7EED\u591A\u4E45\u4E86\uFF1F"], ["observations", "DOMAIN_DETAIL", "What have you directly observed?", "\u4F60\u76F4\u63A5\u89C2\u5BDF\u5230\u4E86\u4EC0\u4E48\uFF1F"], ["counterEvidence", "CONTEXT_COUNTER_EVIDENCE", "What does not fit this account?", "\u54EA\u4E9B\u60C5\u51B5\u4E0D\u7B26\u5408\u8FD9\u4E2A\u63CF\u8FF0\uFF1F"], ["support", "SUPPORTIVE_NOW", "What supports you?", "\u4EC0\u4E48\u6B63\u5728\u652F\u6301\u4F60\uFF1F"], ["uncertainty", "UNCERTAIN_NOW", "What is still uncertain?", "\u8FD8\u6709\u4EC0\u4E48\u4E0D\u786E\u5B9A\uFF1F"]];
  if (!["QUICK", "GUIDED", "DEEP", "DISCOVERY"].includes(mode)) fail("GUIDED_REALITY_MODE_INVALID");
  const selected = mode === "DISCOVERY" ? [["recentChange", "ACTIVE_NOW", "What changed recently?", "\u6700\u8FD1\u6709\u4EC0\u4E48\u53D8\u5316\uFF1F"], ["whereObvious", "DOMAIN_DETAIL", "Where is it most noticeable?", "\u5728\u54EA\u65B9\u9762\u6700\u660E\u663E\uFF1F"]] : rows.slice(0, mode === "QUICK" ? 3 : mode === "GUIDED" ? 6 : 8);
  return freeze(selected.map(([id, promptId, en, zh]) => ({ id, promptId, label: locale === "zh-Hans" ? zh : en, maxLength: 600, required: false })));
}
function summarizeGuidedReality({ mode = "GUIDED", answers = {}, locale = "en" } = {}) {
  const questions = guidedRealityQuestions(mode, locale), allowed = new Set(questions.map((q) => q.id));
  if (!answers || typeof answers !== "object" || Array.isArray(answers) || Object.keys(answers).some((k) => !allowed.has(k))) fail("GUIDED_REALITY_ANSWER_INVALID");
  const items = questions.filter((q) => clean(answers[q.id])).map((q) => ({ id: q.id, promptId: q.promptId, label: q.label, text: clipped(answers[q.id], 600) }));
  return freeze({ mode, locale, items, confirmationRequired: true, evidencePromoted: false, source: "CUSTOMER_VERBATIM", automaticPersistence: false });
}
function confirmGuidedReality({ mode, answers, locale = "en", confirmation, confirmedSummary } = {}) {
  const summary = summarizeGuidedReality({ mode, answers, locale });
  if (confirmation !== "ACCURATE" || confirmedSummary !== JSON.stringify(summary.items) || !summary.items.length) fail("GUIDED_REALITY_SUMMARY_CONFIRMATION_REQUIRED", 403);
  return normalizePersonalCurrentRealityInput({ optIn: true, purposeCode: CURRENT_REALITY_PURPOSE, observations: summary.items.map((x) => ({ promptId: x.promptId, domain: "CURRENT_STATE", text: x.text })) }, locale);
}

// functions/runtime/shared/schema-registry.js
var SCHEMA_IDS = Object.freeze({
  RUNTIME_ENTRY: "phi-os.runtime-entry.v1",
  RECONSTRUCTION: "phi-os.reconstruction.v1",
  READING_INPUT: "phi-os.reading-input.v1",
  REALITY_READING: "phi-os.reality-reading.v1",
  NAVIGATION_INPUT: "phi-os.navigation-input.v1",
  NAVIGATION: "phi-os.navigation.v1",
  REVIEW: "phi-os.review.v1",
  RUNTIME_MEMORY: "phi-os.runtime-memory.v1",
  CONTINUITY: "phi-os.continuity.v1",
  RUNTIME_SCOPE: "phi-os.runtime-scope.v1"
});
var defineSchema = (current, aliases = []) => Object.freeze({
  current,
  accepted: Object.freeze([.../* @__PURE__ */ new Set([current, ...aliases])])
});
var SCHEMA_REGISTRY = Object.freeze({
  runtimeEntry: defineSchema(SCHEMA_IDS.RUNTIME_ENTRY, [
    "phi-os.rule-entry.v1",
    "1.0"
  ]),
  reconstruction: defineSchema(SCHEMA_IDS.RECONSTRUCTION),
  readingInput: defineSchema(SCHEMA_IDS.READING_INPUT),
  realityReading: defineSchema(SCHEMA_IDS.REALITY_READING),
  navigationInput: defineSchema(SCHEMA_IDS.NAVIGATION_INPUT),
  navigation: defineSchema(SCHEMA_IDS.NAVIGATION),
  review: defineSchema(SCHEMA_IDS.REVIEW),
  runtimeMemory: defineSchema(SCHEMA_IDS.RUNTIME_MEMORY),
  continuity: defineSchema(SCHEMA_IDS.CONTINUITY),
  runtimeScope: defineSchema(SCHEMA_IDS.RUNTIME_SCOPE)
});

// functions/runtime/review/review-contract.js
var REVIEW_CONTRACT_VERSION = SCHEMA_IDS.REVIEW;
var REVIEW_PATH_STATUSES = Object.freeze([
  "not_started",
  "in_progress",
  "paused",
  "completed",
  "changed",
  "withdrawn"
]);
var REVIEW_NEXT_RUNTIME_STATES = Object.freeze([
  "continue_observation",
  "continue_selected_path",
  "return_to_reading",
  "choose_another_path",
  "start_new_entry",
  "professional_review",
  "remain_open"
]);
var REVIEW_GUARDRAILS = Object.freeze({
  rereadingAllowed: false,
  historicalEvidenceReinterpretationAllowed: false,
  readingOverwriteAllowed: false,
  navigationOverwriteAllowed: false,
  automaticOutcomeAllowed: false,
  customerReportAsFactAllowed: false,
  unknownRealityPreserved: true,
  unexpectedRealityPreserved: true,
  userChoiceRequired: true,
  professionalConsentPreserved: true
});

// functions/runtime/memory/runtime-memory-contract.js
var RUNTIME_MEMORY_VERSION = SCHEMA_IDS.RUNTIME_MEMORY;
var MEMORY_EVIDENCE_CLASSES = Object.freeze([
  "reported_experience",
  "observed_evidence",
  "verified_record",
  "professional_record",
  "system_interpretation",
  "unknown_reality"
]);
var RUNTIME_MEMORY_GUARDRAILS = Object.freeze({
  customerReportAsFactAllowed: false,
  unknownRealityAsFactAllowed: false,
  historicalContractOverwriteAllowed: false,
  automaticContinuityAllowed: false,
  automaticNextRuntimeCreationAllowed: false,
  professionalConclusionInferenceAllowed: false,
  sensitiveDataCollectionAllowed: false,
  userChoiceRequiredForNextRuntime: true,
  appendOnly: true
});

// functions/interpretation-runtime/mir7-utils.js
function stableStringify(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(v[k])}`).join(",")}}`;
}
function deepFreeze(v) {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v)) deepFreeze(x);
  }
  return v;
}
async function sha256Stable(v) {
  const text2 = typeof v === "string" ? v : stableStringify(v);
  const bytes = new TextEncoder().encode(text2);
  if (globalThis.crypto?.subtle) {
    const b = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(bytes).digest("hex");
}

// functions/report-context/report-context-admission.js
var REPORT_MODES = Object.freeze(["CANONICAL_READING", "CONTEXTUAL_READING"]);
var REPORT_MODE_LABELS = Object.freeze({ CANONICAL_READING: { en: "Read the method itself", "zh-Hans": "\u53EA\u8BFB\u53D6\u65B9\u6CD5\u672C\u8EAB" }, CONTEXTUAL_READING: { en: "Read it with my current situation", "zh-Hans": "\u7ED3\u5408\u6211\u73B0\u5728\u7684\u751F\u6D3B" } });
var fail2 = (code, status = 422) => {
  throw Object.assign(new Error(code), { code, status });
};
var text = (x, max = 600) => {
  if (typeof x !== "string" || !x.trim() || x.length > max) fail2("REPORT_CONTEXT_TEXT_INVALID");
  return x.trim();
};
var domains = /* @__PURE__ */ new Set([...CURRENT_REALITY_DOMAINS, ...CURRENT_REALITY_SENSITIVE_DOMAINS]);
var ZWR_CONTEXT_SECTION_DOMAINS = Object.freeze({ S02: ["CURRENT_STATE", "DECISION", "EXECUTION"], S03: ["RECOVERY", "CURRENT_STATE", "INPUT_SENSITIVITY"], S04: ["CURRENT_STATE", "DECISION", "EXECUTION", "ENVIRONMENT", "LOAD", "DRIFT"], S05: ["RESOURCES", "FINANCIAL", "DECISION"], S06: ["RELATIONSHIP", "RELATIONSHIP_SENSITIVE", "DECISION"], S07: ["RELATIONSHIP", "ENVIRONMENT", "RESOURCES", "LOAD"], S08: ["LOAD", "RECOVERY", "HEALTH", "BODY_CARRIER", "INPUT_SENSITIVITY", "TRAUMA"], S09: ["DRIFT", "DECISION", "CURRENT_STATE"], S10: ["CURRENT_STATE", "DECISION", "DRIFT"], S11: ["OPEN_LOOPS", "DECISION", "EXECUTION"] });
function reportMode(value, { newUi = false } = {}) {
  if (value == null && !newUi) return "CANONICAL_READING";
  if (!REPORT_MODES.includes(value)) fail2("REPORT_MODE_REQUIRED");
  return value;
}
function createReportContextIntent({ ownerAccountId, personId, reportProductId, methodId, reportMode: mode, primaryQuestion, requestedDomains, sourceChannel = "REPORT_GENERATION_UI", createdAt = (/* @__PURE__ */ new Date()).toISOString(), contextIntentId = crypto.randomUUID() } = {}) {
  if (!["REPORT_GENERATION_UI", "ASK_PHIOS_EXPLICIT_HANDOFF"].includes(sourceChannel)) fail2("REPORT_CONTEXT_SOURCE_INVALID");
  if (!["ZWR", "BZR", "AST", "NUM", "HD", "ECR", "PROFILE", "CROSS"].includes(methodId)) fail2("REPORT_CONTEXT_METHOD_INVALID");
  if (!Array.isArray(requestedDomains) || requestedDomains.some((d) => !domains.has(d)) || requestedDomains.length > 4) fail2("REPORT_CONTEXT_DOMAIN_INVALID");
  return deepFreeze({ schemaVersion: "PHI-OS-REPORT-CONTEXT-INTENT-v1", contextIntentId, ownerAccountId: text(ownerAccountId, 120), personId: text(personId, 120), reportProductId: text(reportProductId, 120), methodId, reportMode: reportMode(mode, { newUi: true }), primaryQuestion: text(primaryQuestion), requestedDomains: [...new Set(requestedDomains)], sourceChannel, createdAt, evidence: false });
}
function evaluateRealityAdmission({ intent, observations = [], explicitCustomerOptIn = false, customerConfirmed = false, sensitiveConsent = false, sectionId, corroboration = [] } = {}) {
  const selected = reportMode(intent?.reportMode), allowed = intent?.methodId === "ZWR" ? ZWR_CONTEXT_SECTION_DOMAINS[sectionId] || [] : intent?.requestedDomains || [];
  const candidates = observations.map((o) => {
    const reasons = [];
    const relevant = intent.requestedDomains.includes(o.domain) && allowed.includes(o.domain);
    const specific = String(o.statement || "").trim().length >= 16 && /个月|周|昨天|最近|目前|正在|工作|职责|伴侣|收入|计划|week|month|currently|work|partner|decision|since|when|during|yesterday|started|changed|project/i.test(o.statement) && !/^(最近不太好|我不知道|还不确定|something is wrong|not sure|i don.t know)[。.! ]*$/i.test(o.statement);
    if (selected !== "CONTEXTUAL_READING") reasons.push("CANONICAL_NO_BINDING");
    if (!explicitCustomerOptIn) reasons.push("OPT_IN_REQUIRED");
    if (!intent.primaryQuestion) reasons.push("INTERPRETIVE_INTENT_REQUIRED");
    if (!relevant) reasons.push("NOT_REPORT_RELEVANT");
    if (!specific) reasons.push("INSUFFICIENT_SPECIFICITY");
    if (!customerConfirmed) reasons.push("CUSTOMER_CONFIRMATION_REQUIRED");
    if (o.sensitive && !sensitiveConsent) reasons.push("SENSITIVE_CONSENT_REQUIRED");
    const stronger = corroboration.filter((r) => r.ownerAccountId === intent.ownerAccountId && r.personId === intent.personId && r.observationId === o.observationId && r.domain === o.domain && r.admissionState === "ADMITTED" && r.sourceAuthorityRef && r.sourceRef && MEMORY_EVIDENCE_CLASSES.includes(r.evidenceClass) && ["observed_evidence", "verified_record", "professional_record"].includes(r.evidenceClass));
    return { ...o, candidateId: o.observationId, reportMethodId: intent.methodId, reportProductId: intent.reportProductId, relevanceState: relevant ? "RELEVANT" : "NOT_RELEVANT", specificityState: specific ? "SUFFICIENT" : "INSUFFICIENT", confirmationState: customerConfirmed ? "ACCURATE" : "UNCONFIRMED", admissionState: reasons.length ? "R1_CONTEXT_AVAILABLE" : stronger.length ? "R3_REALITY_CORROBORATED" : "R2_REALITY_REFERENCED", admissionReasons: reasons, corroborationRefs: stronger.map((r) => ({ sourceRef: r.sourceRef, evidenceClass: r.evidenceClass, sourceAuthorityRef: r.sourceAuthorityRef })), sectionId };
  });
  const admitted = candidates.filter((x) => !x.admissionReasons.length);
  return deepFreeze({ candidates, admitted, admissionState: selected === "CANONICAL_READING" ? "R0_NO_BINDING" : admitted.some((x) => x.admissionState === "R3_REALITY_CORROBORATED") ? "R3_REALITY_CORROBORATED" : admitted.length ? "R2_REALITY_REFERENCED" : observations.length ? "R1_CONTEXT_AVAILABLE" : "R0_NO_BINDING" });
}
async function createReportRealityBrief({ intent, mode = "QUICK", answers, locale = "en", confirmedSummary, confirmation, domain, sectionId, explicitOptIn = false, sensitiveConsent = false, comparisonState = "OPEN", corroboration = [], asOf = (/* @__PURE__ */ new Date()).toISOString(), realityBriefId = crypto.randomUUID() } = {}) {
  if (intent?.reportMode !== "CONTEXTUAL_READING") fail2("REALITY_BRIEF_NOT_ADMITTED");
  if (!explicitOptIn) fail2("CONTEXTUAL_REALITY_OPT_IN_REQUIRED", 403);
  if (!REALITY_COMPARISON_STATES.includes(comparisonState)) fail2("REPORT_COMPARISON_INVALID");
  confirmGuidedReality({ mode, answers, locale, confirmation, confirmedSummary });
  if (answers.intent?.trim() !== intent.primaryQuestion) fail2("REALITY_CONTEXT_INTENT_MISMATCH");
  const sensitive = CURRENT_REALITY_SENSITIVE_DOMAINS.includes(domain), raw = { domain, promptId: "ACTIVE_NOW", text: answers.happening || "" };
  if (!sensitive && /诊断|病史|创伤|自杀|负债|收入金额|薪资|账户余额|diagnos|trauma|suicid|account balance|salary|debt amount/i.test(raw.text)) fail2("REALITY_SENSITIVE_DOMAIN_SELECTION_REQUIRED", 403);
  const canonical = canonicalizeCurrentRealityObservations(normalizePersonalCurrentRealityInput({ optIn: true, purposeCode: CURRENT_REALITY_PURPOSE, observations: sensitive ? [] : [raw], sensitiveObservations: sensitive && sensitiveConsent ? [raw] : [], sensitiveConsent }, locale));
  const obs = canonical.observations.map((o) => ({ ...o, observationId: intent.contextIntentId + ":" + o.observationId, sourceRef: intent.contextIntentId + ":happening", evidenceClass: "reported_experience" }));
  const admission = evaluateRealityAdmission({ intent, observations: obs, explicitCustomerOptIn: explicitOptIn, customerConfirmed: confirmation === "ACCURATE", sensitiveConsent, sectionId, corroboration });
  if (!admission.admitted.length) fail2(sensitive && !sensitiveConsent ? "REALITY_SENSITIVE_CONSENT_REQUIRED" : admission.candidates.some((o) => o.specificityState === "INSUFFICIENT") ? "REALITY_CONTEXT_INSUFFICIENTLY_SPECIFIC" : admission.candidates.some((o) => o.relevanceState === "NOT_RELEVANT") ? "REALITY_CONTEXT_NOT_REPORT_RELEVANT" : "REALITY_BRIEF_NOT_ADMITTED");
  const seed = { schemaVersion: "PHI-OS-REPORT-REALITY-BRIEF-v1", realityBriefId, ownerAccountId: intent.ownerAccountId, personId: intent.personId, reportProductId: intent.reportProductId, methodId: intent.methodId, reportMode: intent.reportMode, primaryQuestion: intent.primaryQuestion, contextIntentId: intent.contextIntentId, asOf, admissionState: admission.admissionState, observations: admission.admitted.map((o) => ({ ...o, comparisonState })), decisionContext: { activeDecision: domain === "DECISION" ? answers.happening : null, desiredUnderstanding: answers.outcome || null }, knownBoundary: { unverifiedItems: admission.admitted.map((o) => o.observationId), unknownItems: [], excludedItems: admission.candidates.filter((o) => o.admissionReasons.length).map((o) => ({ candidateId: o.candidateId, reasons: o.admissionReasons })) }, governance: { customerConfirmed: true, confirmationTimestamp: asOf, explicitOptIn: true, purposeCode: CURRENT_REALITY_PURPOSE, automaticPersistence: false, mayProveMethod: false, mayRewriteMethod: false, mayBecomeObjectiveFact: false } };
  return deepFreeze({ ...seed, realityBriefDigest: await sha256Stable(seed) });
}
export {
  createReportContextIntent,
  createReportRealityBrief,
  guidedRealityQuestions,
  summarizeGuidedReality
};
