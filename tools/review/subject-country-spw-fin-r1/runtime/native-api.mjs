var __defProp = Object.defineProperty;
var __export = (target, all2) => {
  for (var name in all2)
    __defProp(target, name, { get: all2[name], enumerable: true });
};

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/api/customer-subject-workspace.js
var customer_subject_workspace_exports = {};
__export(customer_subject_workspace_exports, {
  createSubjectWorkspaceHandler: () => createSubjectWorkspaceHandler,
  onRequestGet: () => onRequestGet
});

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/customer-projection/projection-common.js
var CX_PROJECTION_VERSION = "PHI-OS-CX-CUSTOMER-PROJECTION-v1.0.0";
var clean = (value) => String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ");
var list = (value) => Array.isArray(value) ? value : [];
var localeOf = (value) => value === "zh-Hans" ? "zh-Hans" : "en";
var uniq = (items) => [...new Set(list(items).filter((v) => v !== null && v !== void 0 && v !== ""))];
var upstreamState = (value, fallback = "UNKNOWN") => clean(value) || fallback;
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
  }
  return value;
}
function safeUrl(value) {
  const v = clean(value);
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
  return deepFreeze({ sourceAuthorities: uniq(list(authorities).map(clean).filter(Boolean)), authorityPreserved: true });
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/customer-projection/navigation-customer-projection.js
var strings = (value) => list(value).map((item) => clean(typeof item === "string" ? item : item?.label || item?.summary || item?.statement)).filter(Boolean);
var option = (item) => deepFreeze({
  id: clean(item?.id || item?.pathId || item?.code) || null,
  label: clean(item?.label || item?.title || item?.statement),
  description: clean(item?.description || item?.summary) || null,
  href: safeUrl(item?.href),
  state: clean(item?.state || item?.status) || null,
  evidence: clean(item?.evidenceState) || null,
  tradeOff: clean(item?.tradeOff || item?.tradeoff) || null,
  risks: strings(item?.risks || item?.risk),
  dependencies: strings(item?.dependencies),
  reversibility: clean(item?.reversibility) || null,
  observationPoints: strings(item?.observationPoints || item?.observe)
});
var confirmation = (item) => {
  const state = clean(item?.confirmationState || item?.state || item?.status).toUpperCase();
  const customer = item?.customerConfirmed === true || state === "CHOSEN_BY_CUSTOMER";
  const professional = item?.professionalConfirmed === true || state === "CHOSEN_BY_PROFESSIONAL";
  const confirmed = customer || professional || ["CONFIRMED", "ACCEPTED"].includes(state);
  if (!confirmed) return null;
  return deepFreeze({ id: clean(item?.id || item?.actionId) || null, label: clean(item?.label || item?.title || item?.statement), confirmationState: state || "CONFIRMED", confirmedBy: customer ? "CUSTOMER" : professional ? "PROFESSIONAL" : "UPSTREAM_CONFIRMED" });
};
function projectNavigationForCustomer(navigation = {}, { locale = "en" } = {}) {
  const source = navigation && typeof navigation === "object" ? navigation : {};
  const options = list(source.options || source.paths || source.choices).map(option).filter((x) => x.label);
  const confirmedActions = list(source.actions).map(confirmation).filter(Boolean);
  return deepFreeze({ schemaVersion: `${CX_PROJECTION_VERSION}:NAVIGATION`, locale: localeOf(locale), state: upstreamState(source.state || source.status, "NOT_ESTABLISHED"), currentPosition: clean(source.currentPosition || source.position) || null, options, selectedId: clean(source.selectedId || source.selectedPathId) || null, confirmedActions, governance: { selectionMadeBySystem: false, unconfirmedActionsHidden: true, ...sourceLineage(["RNE"]), ...boundary() } });
}
function projectPublicCountryResearchNavigation({ subject, dimension, sourceRefs, sourceVersion, locale = "en", countryCode, year } = {}) {
  if (subject?.subjectType !== "COUNTRY" || subject.visibility !== "PUBLIC" || subject.subjectId !== "WORLD:COUNTRY:" + countryCode || !Array.isArray(sourceRefs) || !sourceVersion) throw Error("PUBLIC_COUNTRY_NAVIGATION_SCOPE_REQUIRED");
  const zh = locale === "zh-Hans", t = (z, e) => zh ? z : e, base = "/perspectives/profile/?subjectType=COUNTRY&country=" + countryCode + "&dimension=" + encodeURIComponent(dimension) + "&locale=" + locale;
  const projected = projectNavigationForCustomer({ state: "SOURCE_BOUND_OPTIONS", options: [{ id: "COMPARE_COUNTRY", label: t("\u6BD4\u8F83\u53E6\u4E00\u4E2A\u56FD\u5BB6\u7684\u540C\u5E74\u8D44\u6599", "Compare another country for the same year"), href: base + "&view=compare&year=" + year }, { id: "COMPARE_PERIOD", label: t("\u9009\u62E9\u53E6\u4E00\u7EDF\u8BA1\u671F\u95F4\u5E76\u590D\u6838\u6765\u6E90", "Select another statistical period and inspect sources"), href: base + "&view=reading" }, { id: "INSPECT_SOURCE", label: t("\u6838\u5BF9\u5F53\u524D\u7EF4\u5EA6\u7684\u6765\u6E90\u4E0E\u7F3A\u53E3", "Inspect this dimension\u2019s sources and gaps"), href: base + "&view=reading" }], actions: [] }, { locale });
  return { ...projected, governance: { ...projected.governance, sourceAuthorities: ["WORLD_EVIDENCE", "SUBJECT_CONTEXT_R1"], formalRNEAdmission: false }, subjectRef: subject.subjectId, subjectType: "COUNTRY", dimension, sourceRefs, sourceVersion, authority: "PUBLIC_OBSERVER_RESEARCH_ONLY", createsCase: false, createsCheckpoint: false, policyDecisionAuthority: false, savesPersonalFacts: false, persistence: false, automaticAction: false };
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/profile/subject-context-r1.js
var SUBJECT_CONTEXT_VERSION = "SUBJECT-CONTEXT-R1";
var SUBJECT_TYPES = Object.freeze(["PERSONAL", "FAMILY", "TEAM", "BUSINESS", "INSTITUTION", "COUNTRY"]);
var DIMENSIONS = Object.freeze(["identity", "expression", "relationships", "environment", "growth", "potential"]);
var SUBJECT_RELATIONSHIPS = Object.freeze(["BELONGS_TO_FAMILY", "PARTICIPATES_IN_TEAM", "WORKS_WITH_BUSINESS", "MANAGES_BUSINESS", "INTERACTS_WITH_INSTITUTION", "OPERATES_IN_COUNTRY", "OBSERVED_IN_WORLD_CONTEXT"]);
var DIMENSION_NAMES = Object.freeze({ identity: ["Identity", "\u8EAB\u4EFD"], expression: ["Expression", "\u8868\u8FBE"], relationships: ["Relationships", "\u5173\u7CFB"], environment: ["Environment", "\u73AF\u5883"], growth: ["Growth", "\u6210\u957F"], potential: ["Possibilities", "\u53EF\u80FD\u6027"] });
var definitions = {
  PERSONAL: [["Your values, roles and self-description.", "\u4F60\u7684\u4EF7\u503C\u3001\u89D2\u8272\u4E0E\u81EA\u6211\u8BA4\u8BC6\u3002"], ["How you communicate and express your views.", "\u4F60\u5982\u4F55\u6C9F\u901A\u548C\u8868\u8FBE\u89C2\u70B9\u3002"], ["Connections you have chosen to describe.", "\u4F60\u9009\u62E9\u8BF4\u660E\u7684\u4EBA\u9645\u8FDE\u63A5\u3002"], ["Your stated living and working conditions.", "\u4F60\u660E\u786E\u63D0\u4F9B\u7684\u751F\u6D3B\u4E0E\u5DE5\u4F5C\u6761\u4EF6\u3002"], ["Learning, experience and progress over time.", "\u968F\u65F6\u95F4\u79EF\u7D2F\u7684\u5B66\u4E60\u3001\u7ECF\u9A8C\u4E0E\u8FDB\u5C55\u3002"], ["Options within your resources and constraints.", "\u5728\u8D44\u6E90\u4E0E\u9650\u5236\u4E0B\u53EF\u4EE5\u63A2\u7D22\u7684\u9009\u62E9\u3002"]],
  FAMILY: [["The household and responsibilities within its stated scope.", "\u5DF2\u660E\u786E\u8303\u56F4\u5185\u7684\u5BB6\u5EAD\u7EC4\u6210\u4E0E\u8D23\u4EFB\u3002"], ["How members communicate and make shared decisions.", "\u6210\u5458\u5982\u4F55\u6C9F\u901A\u53CA\u4F5C\u5171\u540C\u51B3\u5B9A\u3002"], ["Consented care and support connections; not private member reports.", "\u7ECF\u6388\u6743\u7684\u7167\u62A4\u4E0E\u652F\u6301\u8FDE\u63A5\uFF0C\u4E0D\u5305\u542B\u6210\u5458\u79C1\u4EBA\u62A5\u544A\u3002"], ["Housing, services and shared living conditions.", "\u4F4F\u623F\u3001\u516C\u5171\u670D\u52A1\u4E0E\u5171\u540C\u751F\u6D3B\u6761\u4EF6\u3002"], ["Lifecycle changes and adaptation of shared resources.", "\u5BB6\u5EAD\u9636\u6BB5\u53D8\u5316\u4E0E\u5171\u540C\u8D44\u6E90\u7684\u9002\u5E94\u3002"], ["Options that members can choose together.", "\u53EF\u7531\u6210\u5458\u5171\u540C\u9009\u62E9\u7684\u8DEF\u5F84\u3002"]],
  TEAM: [["A team\u2019s stated purpose, roles and mandate.", "\u56E2\u961F\u660E\u786E\u7684\u76EE\u6807\u3001\u89D2\u8272\u4E0E\u804C\u8D23\u3002"], ["Coordination, communication and work practices.", "\u534F\u8C03\u3001\u6C9F\u901A\u53CA\u5DE5\u4F5C\u65B9\u5F0F\u3002"], ["Task dependencies and agreed collaboration.", "\u4EFB\u52A1\u4F9D\u8D56\u4E0E\u5DF2\u7EA6\u5B9A\u7684\u534F\u4F5C\u3002"], ["Resources, working conditions and project constraints.", "\u8D44\u6E90\u3001\u5DE5\u4F5C\u73AF\u5883\u4E0E\u9879\u76EE\u9650\u5236\u3002"], ["Evidence of learning, capability and delivery changes.", "\u5B66\u4E60\u3001\u80FD\u529B\u53CA\u4EA4\u4ED8\u53D8\u5316\u7684\u8BC1\u636E\u3002"], ["Feasible improvements requiring team agreement.", "\u9700\u8981\u56E2\u961F\u540C\u610F\u7684\u53EF\u884C\u6539\u8FDB\u3002"]],
  BUSINESS: [["Business activities, operating boundary and declared legal form.", "\u4E1A\u52A1\u6D3B\u52A8\u3001\u7ECF\u8425\u8303\u56F4\u53CA\u58F0\u660E\u7684\u6CD5\u5F8B\u5F62\u5F0F\u3002"], ["Products, services and how the business reaches customers.", "\u4EA7\u54C1\u3001\u670D\u52A1\u53CA\u9762\u5411\u5BA2\u6237\u7684\u7ECF\u8425\u65B9\u5F0F\u3002"], ["Authorized supplier, customer and operating dependencies.", "\u83B7\u6388\u6743\u7684\u4F9B\u5E94\u5546\u3001\u5BA2\u6237\u4E0E\u7ECF\u8425\u4F9D\u8D56\u3002"], ["Market, costs, supply chain and relevant public conditions.", "\u5E02\u573A\u3001\u6210\u672C\u3001\u4F9B\u5E94\u94FE\u53CA\u76F8\u5173\u516C\u5171\u6761\u4EF6\u3002"], ["Changes in comparable operating and financial evidence.", "\u53EF\u6BD4\u7684\u7ECF\u8425\u4E0E\u8D22\u52A1\u8BC1\u636E\u6240\u663E\u793A\u7684\u53D8\u5316\u3002"], ["Operating options subject to cash, capacity and uncertainty.", "\u53D7\u73B0\u91D1\u3001\u80FD\u529B\u53CA\u4E0D\u786E\u5B9A\u6027\u7EA6\u675F\u7684\u7ECF\u8425\u9009\u62E9\u3002"]],
  INSTITUTION: [["An institution\u2019s mission, mandate and service scope.", "\u673A\u6784\u7684\u5B97\u65E8\u3001\u804C\u8D23\u4E0E\u670D\u52A1\u8303\u56F4\u3002"], ["How services and governance are delivered.", "\u670D\u52A1\u53CA\u6CBB\u7406\u5982\u4F55\u8FD0\u4F5C\u3002"], ["Stakeholders and authorized institutional responsibilities.", "\u5229\u76CA\u76F8\u5173\u65B9\u53CA\u83B7\u6388\u6743\u7684\u673A\u6784\u8D23\u4EFB\u3002"], ["Policy, funding and operating conditions.", "\u653F\u7B56\u3001\u8D44\u91D1\u4E0E\u8FD0\u8425\u6761\u4EF6\u3002"], ["Changes in service coverage and organizational capability.", "\u670D\u52A1\u8986\u76D6\u4E0E\u7EC4\u7EC7\u80FD\u529B\u7684\u53D8\u5316\u3002"], ["Options consistent with the mandate and restricted funding.", "\u7B26\u5408\u804C\u8D23\u53CA\u53D7\u9650\u8D44\u91D1\u6761\u4EF6\u7684\u53EF\u9009\u8DEF\u5F84\u3002"]],
  COUNTRY: [["The public geographic entity and the scope of observation.", "\u516C\u5171\u5730\u7406\u4E3B\u4F53\u53CA\u89C2\u5BDF\u8303\u56F4\u3002"], ["Publicly documented institutions and economic activities.", "\u6709\u516C\u5171\u8D44\u6599\u652F\u6301\u7684\u5236\u5EA6\u4E0E\u7ECF\u6D4E\u6D3B\u52A8\u3002"], ["Public trade and institutional connections, not personal relationships.", "\u516C\u5F00\u8D38\u6613\u4E0E\u5236\u5EA6\u8FDE\u63A5\uFF0C\u800C\u975E\u4E2A\u4EBA\u4EBA\u9645\u5173\u7CFB\u3002"], ["Dated economic, social and infrastructure observations.", "\u5E26\u6709\u89C2\u5BDF\u65E5\u671F\u7684\u7ECF\u6D4E\u3001\u793E\u4F1A\u4E0E\u57FA\u7840\u8BBE\u65BD\u8D44\u6599\u3002"], ["Comparable changes over time, with revisions retained.", "\u53EF\u6BD4\u7684\u65F6\u95F4\u53D8\u5316\uFF0C\u5E76\u4FDD\u7559\u4FEE\u8BA2\u8EAB\u4EFD\u3002"], ["Public-policy scenarios and trade-offs, not predictions.", "\u516C\u5171\u653F\u7B56\u60C5\u666F\u4E0E\u6743\u8861\uFF0C\u800C\u975E\u786E\u5B9A\u9884\u6D4B\u3002"]]
};
function subjectDefinitions(type, locale = "en") {
  if (!SUBJECT_TYPES.includes(type)) throw issue("SUBJECT_TYPE_INVALID", 422);
  return DIMENSIONS.map((id2, i) => ({ id: id2, label: DIMENSION_NAMES[id2][locale === "zh-Hans" ? 1 : 0], definition: definitions[type][i][locale === "zh-Hans" ? 1 : 0] }));
}
var issue = (code, status = 403) => Object.assign(new Error(code), { code, status });
var need = (v, c, s) => {
  if (!v) throw issue(c, s);
};
var parse = (v) => typeof v === "string" ? JSON.parse(v) : v;
var activeAt = (r, now2) => r.status === "active" && Number.isFinite(Date.parse(r.valid_from)) && Date.parse(r.valid_from) <= now2 && (!r.valid_to || Number.isFinite(Date.parse(r.valid_to)) && Date.parse(r.valid_to) > now2);
function methodApplicability(type, { birthInputsVerified = false, consent = false } = {}) {
  need(SUBJECT_TYPES.includes(type), "SUBJECT_TYPE_INVALID", 422);
  return ["BAZI", "HUMAN_DESIGN", "ZI_WEI", "NUMEROLOGY", "WESTERN_ASTROLOGY"].map((method) => ({ method, status: type !== "PERSONAL" ? "NOT_APPLICABLE" : !consent ? "REQUIRES_CONSENT" : !birthInputsVerified ? "REQUIRES_VERIFIED_INPUT" : "CONDITIONALLY_APPLICABLE", publicationEligible: false }));
}
async function authorizeSubject(registry, subjectId, actorId, { operation = "profile:read", now: now2 = Date.now() } = {}) {
  need(typeof subjectId === "string" && subjectId.length <= 200, "SUBJECT_NOT_FOUND", 404);
  const view = await registry.query.getObjectView(subjectId), object = view?.object;
  need(object?.object_type === "SUBJECT_CONTEXT_REF" && object.status === "active", "SUBJECT_NOT_FOUND", 404);
  const m = object.metadata;
  need(m.contractVersion === SUBJECT_CONTEXT_VERSION && SUBJECT_TYPES.includes(m.subjectType), "SUBJECT_CONTRACT_INVALID", 409);
  const denies = (view.restrictions || []).filter((r) => activeAt(r, now2));
  need(!denies.some((r) => {
    const s = parse(r.scope_json);
    return !s.accountId || s.accountId === actorId;
  }), "SUBJECT_RESTRICTED");
  const publicRead = m.subjectType === "COUNTRY" && m.visibility === "PUBLIC" && m.canonicalSubjectRef?.owner === "WORLD" && operation === "profile:read";
  if (publicRead) return { object, role: "PUBLIC_OBSERVER", scopes: ["profile:read"], ownsSubject: false, grant: null };
  need(actorId, "AUTH_REQUIRED", 401);
  for (const row of view.relationships || []) {
    if (row.target_object_id !== subjectId || row.relationship_type !== "SUBJECT_CONTEXT_ACCESS" || !activeAt(row, now2)) continue;
    const a = parse(row.attributes_json);
    if (a.purpose !== "SUBJECT_PROFILE_DISPLAY" || a.subjectVersion !== m.version || !["OWNER", "EDITOR", "VIEWER"].includes(a.role) || !Array.isArray(a.scopes) || !a.scopes.includes(operation) || a.role === "VIEWER" && operation.endsWith(":write")) continue;
    const account = await registry.query.getObject(row.source_object_id);
    if (account?.status !== "active" || account.object_type !== "ACCOUNT_REFERENCE" || account.owner_module !== "ACCOUNT" || account.metadata.canonicalAccountId !== actorId) continue;
    need(m.requiresGuardianAuthority !== true, "GUARDIAN_AUTHORITY_OWNER_NOT_BOUND");
    return { object, role: a.role, scopes: a.scopes, ownsSubject: false, grant: { id: row.relationship_id, validTo: row.valid_to, version: a.subjectVersion } };
  }
  throw issue("SUBJECT_NOT_FOUND", 404);
}
var safeText = (v) => typeof v === "string" ? v.slice(0, 2e3) : "";
var evidenceTypes = ["OBSERVED_FACT", "VERIFIED_CALCULATION", "METHOD_INTERPRETATION", "SCENARIO", "SYMBOLIC_READING", "ILLUSTRATIVE_EXAMPLE"];
function evidenceProjection(e, publicOnly = false, locale = "en") {
  if (!e || !e.id || !e.version || !e.position || !evidenceTypes.includes(e.kind) || publicOnly && e.access !== "PUBLIC") return null;
  if (e.kind === "OBSERVED_FACT" && (!e.publisher || !e.period || !e.unit || !e.sourceUrl)) return null;
  let href = null;
  try {
    const u = new URL(e.sourceUrl);
    if (u.protocol === "https:" && !u.username && !u.password) href = u.href;
  } catch {
  }
  return { id: safeText(e.id), version: safeText(e.version), position: safeText(e.position), kind: e.kind, statement: safeText(locale === "zh-Hans" && e.statementZh ? e.statementZh : e.statement), sourceUrl: href, publisher: safeText(e.publisher), period: safeText(e.period), unit: safeText(e.unit), geography: safeText(e.geography), retrievedAt: safeText(e.retrievedAt), revision: safeText(e.revision), limitation: safeText(locale === "zh-Hans" && e.limitationZh ? e.limitationZh : e.limitation) };
}
async function readSubjectWorkspace(registry, subjectId, actorId, { locale = "en", now: now2 = Date.now() } = {}) {
  const auth = await authorizeSubject(registry, subjectId, actorId, { now: now2 });
  const m = auth.object.metadata, versions = await registry.versionStore.list(subjectId), v = versions[0];
  need(v?.status === "active" && v.checksum === m.currentPayloadDigest, "SUBJECT_VERSION_RECHECK_REQUIRED", 409);
  const bytes = new TextEncoder().encode(JSON.stringify(v.payload)), actual = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (n) => n.toString(16).padStart(2, "0")).join("");
  need(actual === v.checksum, "SUBJECT_PAYLOAD_DIGEST_MISMATCH", 409);
  const payload = v.payload, publicOnly = m.visibility === "PUBLIC", evidence = (payload.evidence || []).filter((e) => e.access === "PUBLIC" || e.ownerSubjectId === subjectId).map((e) => evidenceProjection(e, publicOnly, locale)).filter(Boolean), ids = new Set(evidence.map((e) => e.id));
  const dimensions = subjectDefinitions(m.subjectType, locale).map((d) => {
    const refs = (payload.dimensions?.[d.id] || []).filter((id2) => ids.has(id2));
    return { ...d, evidenceRefs: refs, state: refs.length ? "EVIDENCE_AVAILABLE" : "UNKNOWN", observations: evidence.filter((e) => refs.includes(e.id)) };
  });
  const financial = auth.scopes.includes("financial:read") ? payload.financial : null;
  if (financial) need(Object.values(financial.metrics || {}).every((m2) => ids.has(m2.sourceRef)), "FINANCIAL_EVIDENCE_REFERENCE_INVALID", 409);
  return { schemaVersion: SUBJECT_CONTEXT_VERSION, subjectId, subjectType: m.subjectType, profileId: m.profileId, profileVersion: m.version, subjectStatus: auth.object.status, visibility: m.visibility, createdAt: auth.object.created_at, updatedAt: auth.object.updated_at, asOfDate: m.asOfDate || null, description: safeText(m.description), provenanceStatus: m.dataNature || "SOURCE_BOUND", permissionPolicyRef: auth.grant?.id || "WORLD_PUBLIC_OBSERVATION", relationshipRefs: auth.grant ? [auth.grant.id] : [], sourceRefs: evidence.map((e) => ({ id: e.id, version: e.version, position: e.position })), canonicalSubjectRef: m.canonicalSubjectRef, version: m.version, sourceVersion: v.checksum, displayName: safeText(payload.displayNames?.[locale] || auth.object.canonical_name), displayNames: payload.displayNames ? { en: safeText(payload.displayNames.en), "zh-Hans": safeText(payload.displayNames["zh-Hans"]) } : null, role: auth.role, ownsSubject: false, dataNature: m.dataNature || "SOURCE_BOUND", legalForm: m.subjectType === "BUSINESS" ? m.legalForm || "UNKNOWN" : null, independentLegalPerson: m.subjectType === "BUSINESS" && m.legalForm === "SOLE_PROPRIETORSHIP" ? false : null, dimensions, evidence, financial: financial ? analyzeSubjectFinancial(m.subjectType, financial) : { state: "NOT_AUTHORIZED_OR_NOT_PROVIDED", metrics: [] }, methods: methodApplicability(m.subjectType), legacyPersonalRef: m.subjectType === "PERSONAL" ? m.canonicalSubjectRef : null, worldContext: (payload.worldContext || []).map((e) => evidenceProjection(e, true, locale)).filter(Boolean).map((e) => ({ ...e, relationship: "CONTEXT_ONLY_NOT_PERSONAL_OUTCOME" })), relationships: await readSubjectRelationships(registry, subjectId, actorId, { now: now2 }), worldTrend: projectWorldTrend(payload.worldTrend, evidence), navigation: { state: "USER_CHOICE_REQUIRED", subjectId, subjectType: m.subjectType, sourceVersion: v.checksum, facts: evidence.filter((e) => e.kind === "OBSERVED_FACT"), illustrations: evidence.filter((e) => e.kind === "ILLUSTRATIVE_EXAMPLE"), unknown: dimensions.filter((d) => d.state === "UNKNOWN").map((d) => d.id), constraints: payload.constraints?.map(safeText) || [], options: navigationOptions(m.subjectType, locale), customerProjection: projectNavigationForCustomer({ state: "SOURCE_BOUND_OPTIONS", options: navigationOptions(m.subjectType, locale), actions: [] }, { locale }), automaticAction: false }, persistedByThisRead: false };
}
async function listSubjectWorkspaces(registry, actorId, options = {}) {
  const objects = await registry.query.findObjects({ object_type: "SUBJECT_CONTEXT_REF", status: "active", limit: 100 }), items = [];
  for (const o of objects) try {
    const v = await readSubjectWorkspace(registry, o.object_id, actorId, options);
    items.push({ subjectId: v.subjectId, subjectType: v.subjectType, displayName: v.displayName, displayNames: v.displayNames, role: v.role, version: v.version });
  } catch (e) {
    if (!["SUBJECT_NOT_FOUND", "SUBJECT_RESTRICTED", "AUTH_REQUIRED"].includes(e.code)) throw e;
  }
  return { items, hasMore: objects.length === 100, provisionsSubjects: false };
}
function navigationOptions(type, locale = "en") {
  const options = { PERSONAL: [["Review necessary spending and your stated resources", "\u6838\u5BF9\u5FC5\u8981\u652F\u51FA\u4E0E\u5DF2\u63D0\u4F9B\u8D44\u6E90"]], FAMILY: [["Confirm shared costs and each member\u2019s permitted contribution", "\u786E\u8BA4\u5171\u540C\u5F00\u652F\u4E0E\u5404\u6210\u5458\u83B7\u6388\u6743\u7684\u6295\u5165"]], TEAM: [["Review project budget and delivery constraints", "\u6838\u5BF9\u9879\u76EE\u9884\u7B97\u4E0E\u4EA4\u4ED8\u9650\u5236"]], BUSINESS: [["Check receivables, operating cash and upcoming obligations", "\u6838\u5BF9\u5E94\u6536\u6B3E\u3001\u7ECF\u8425\u73B0\u91D1\u4E0E\u5373\u5C06\u5230\u671F\u7684\u4E49\u52A1"]], INSTITUTION: [["Review funding restrictions and service commitments", "\u6838\u5BF9\u8D44\u91D1\u7528\u9014\u9650\u5236\u53CA\u670D\u52A1\u627F\u8BFA"]], COUNTRY: [["Review dated public evidence and compare policy scenarios", "\u6838\u5BF9\u6709\u65E5\u671F\u7684\u516C\u5171\u8BC1\u636E\u5E76\u6BD4\u8F83\u653F\u7B56\u60C5\u666F"]] };
  return options[type].map((text2, i) => ({ id: "REVIEW_" + type + "_" + i, label: text2[locale === "zh-Hans" ? 1 : 0], type: "OPTION_NOT_RECOMMENDATION", requiresUserDecision: true }));
}
var scopes = { PERSONAL: ["PERSONAL"], FAMILY: ["HOUSEHOLD"], TEAM: ["PROJECT"], BUSINESS: ["BUSINESS_OPERATIONS"], INSTITUTION: ["INSTITUTION_BUDGET"], COUNTRY: ["PUBLIC_FISCAL", "MACROECONOMIC"] };
function analyzeSubjectFinancial(type, input) {
  need(SUBJECT_TYPES.includes(type), "SUBJECT_TYPE_INVALID", 422);
  need(scopes[type].includes(input.scope), "FINANCIAL_SCOPE_MISMATCH", 422);
  need(Object.keys(input.metrics || {}).every((id2) => FINANCIAL_SCOPE_METRICS[input.scope].includes(id2)), "FINANCIAL_METRIC_SCOPE_MISMATCH", 422);
  need(/^[A-Z]{3}$/.test(input.currency || "") && input.period && input.accountingBasis && input.consolidationBoundary, "FINANCIAL_CONTEXT_REQUIRED", 422);
  const get = (id2) => {
    const m = input.metrics?.[id2];
    return m && Number.isSafeInteger(m.value) && Math.abs(m.value) <= 1e13 && m.sourceRef && m.unit === "CURRENCY_MINOR" && m.period === input.period && m.currency === input.currency ? m.value : null;
  };
  const derived = [];
  const difference = (id2, a, b) => {
    const x = get(a), y = get(b);
    derived.push({ id: id2, value: x === null || y === null ? null : x - y, unit: "CURRENCY_MINOR", state: x === null || y === null ? "MISSING_INPUT" : "CALCULATED", formulaVersion: "SUBJECT-FINANCIAL-R1", formula: a + " \u2212 " + b, inputRefs: [input.metrics?.[a]?.sourceRef, input.metrics?.[b]?.sourceRef].filter(Boolean) });
    return x === null || y === null ? null : x - y;
  };
  if (type === "BUSINESS") {
    const profit = difference("grossProfit", "revenue", "costOfSales"), revenue = get("revenue");
    derived.push({ id: "grossMargin", value: profit !== null && revenue > 0 ? profit / revenue : null, unit: "RATIO", state: profit !== null && revenue > 0 ? "CALCULATED" : "MISSING_OR_ZERO_DENOMINATOR", formulaVersion: "SUBJECT-FINANCIAL-R1", formula: "grossProfit / revenue", inputRefs: ["grossProfit", input.metrics?.revenue?.sourceRef].filter(Boolean) });
    difference("workingCapital", "currentAssets", "currentLiabilities");
  }
  if (type === "COUNTRY" && input.scope === "PUBLIC_FISCAL") difference("budgetBalance", "governmentRevenue", "governmentExpenditure");
  if (type === "TEAM" || type === "INSTITUTION") difference("budgetRemaining", "budget", "actualSpending");
  return { state: ["PERSONAL", "FAMILY"].includes(type) ? "EXISTING_FINANCIAL_AUTHORITY_REQUIRED" : "SCOPE_BOUND_OVERVIEW", scope: input.scope, currency: input.currency, period: input.period, accountingBasis: input.accountingBasis, consolidationBoundary: input.consolidationBoundary, metrics: Object.entries(input.metrics || {}).map(([id2, m]) => ({ id: id2, value: get(id2), unit: m.unit, sourceRef: safeText(m.sourceRef), state: get(id2) === null ? "MISSING_OR_INCOMPATIBLE" : "SOURCE_VALUE" })), derived, profitIsNotCash: true, governmentRevenueIsNotGDP: true, modelGeneratedFacts: false };
}
function projectWorldTrend(trend, evidence) {
  if (!trend) return null;
  const ids = new Set(evidence.map((e) => e.id)), r = trend.result;
  if (trend.owner !== "functions/_lib/world-measurement-observations.js" || r?.state !== "TIME_SERIES_TREND" || !Array.isArray(r.points) || r.points.length < 12 || !r.points.every((p) => ids.has(p.observationId) && Number.isFinite(p.value))) return { state: "SOURCE_RECHECK_REQUIRED" };
  return { state: r.state, mode: trend.mode, periods: r.periods, unit: r.unit, points: r.points.map((p) => ({ period: p.period, value: p.value, sourceRef: p.observationId })), reading: "DESCRIPTIVE_SEQUENCE_NOT_CAUSAL_OR_FORECAST" };
}
async function readSubjectRelationships(registry, subjectId, actorId, { now: now2 = Date.now() } = {}) {
  await authorizeSubject(registry, subjectId, actorId, { now: now2 });
  const view = await registry.query.getObjectView(subjectId), out = [];
  for (const row of view.relationships || []) {
    if (!SUBJECT_RELATIONSHIPS.includes(row.relationship_type) || !activeAt(row, now2)) continue;
    const a = parse(row.attributes_json);
    if (a.verificationStatus !== "SOURCE_VERIFIED" || !a.sourceRef || !a.sourceVersion || a.purpose !== "SUBJECT_CONTEXT_READING") continue;
    if (a.visibility !== "PUBLIC" && (!actorId || !Array.isArray(a.allowedAccountIds) || !a.allowedAccountIds.includes(actorId))) continue;
    const other = row.source_object_id === subjectId ? row.target_object_id : row.source_object_id;
    try {
      await authorizeSubject(registry, other, actorId, { now: now2 });
    } catch {
      continue;
    }
    out.push({ id: row.relationship_id, type: row.relationship_type, sourceSubjectId: row.source_object_id, targetSubjectId: row.target_object_id, validFrom: row.valid_from, validTo: row.valid_to, sourceRef: safeText(a.sourceRef), sourceVersion: safeText(a.sourceVersion), verificationStatus: a.verificationStatus, visibility: a.visibility, grantsAccess: false });
  }
  return out;
}
var FINANCIAL_SCOPE_METRICS = Object.freeze({
  PERSONAL: ["income", "expenses", "assets", "liabilities", "netWorth", "cashFlow", "emergencyReserve", "debtObligations", "insuranceCoverage", "investmentAllocation"],
  HOUSEHOLD: ["householdIncome", "sharedExpenses", "householdBudget", "sharedAssets", "sharedLiabilities", "educationBudget", "dependantCosts"],
  PROJECT: ["budget", "actualSpending", "costAllocation", "resourceBudget"],
  BUSINESS_OPERATIONS: ["revenue", "costOfSales", "grossProfit", "operatingExpenses", "operatingProfit", "netProfit", "receivables", "payables", "cashPosition", "currentAssets", "currentLiabilities", "cashFlow", "budget", "actualSpending"],
  INSTITUTION_BUDGET: ["budget", "actualSpending", "funding", "grants", "restrictedFunds", "projectExpenditure"],
  PUBLIC_FISCAL: ["governmentRevenue", "governmentExpenditure", "publicDebt", "debtService", "budgetBalance"],
  MACROECONOMIC: ["GDP", "gdpGrowth", "inflation", "employment", "trade", "investment", "productivity", "currencyIndex"]
});

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/_lib/world-bank-observations.js
var WORLD_BANK_INDICATORS = Object.freeze({
  "SP.POP.TOTL": { unit: "persons", priceBasis: null, title: { en: "Population, total", "zh-Hans": "\u603B\u4EBA\u53E3" } },
  "NY.GDP.MKTP.CD": { unit: "USD", priceBasis: "CURRENT_USD", title: { en: "GDP (current US$)", "zh-Hans": "\u56FD\u5185\u751F\u4EA7\u603B\u503C\uFF08\u73B0\u4EF7\u7F8E\u5143\uFF09" } },
  "NY.GDP.MKTP.KD.ZG": { "unit": "percent", "priceBasis": null, "title": { "en": "GDP growth (annual %)", "zh-Hans": "GDP\u5B9E\u9645\u589E\u957F\u7387\uFF08\u5E74\u5EA6%\uFF09" }, "domain": "MACROECONOMIC", "dimensions": ["growth", "potential"], "financialMetricId": "gdpGrowth" },
  "FP.CPI.TOTL.ZG": { "unit": "percent", "priceBasis": null, "title": { "en": "Inflation, consumer prices (annual %)", "zh-Hans": "\u6D88\u8D39\u4EF7\u683C\u901A\u80C0\u7387\uFF08\u5E74\u5EA6%\uFF09" }, "domain": "MACROECONOMIC", "dimensions": ["environment"], "financialMetricId": "inflation" },
  "SL.EMP.TOTL.SP.ZS": { "unit": "percent", "priceBasis": null, "title": { "en": "Employment to population, age15+ (modelled ILO)", "zh-Hans": "15\u5C81\u4EE5\u4E0A\u5C31\u4E1A\u4EBA\u53E3\u6BD4\uFF08ILO\u6A21\u578B\u4F30\u8BA1\uFF09" }, "domain": "MACROECONOMIC", "dimensions": ["expression"], "financialMetricId": "employment" },
  "NE.TRD.GNFS.ZS": { "unit": "percent_GDP", "priceBasis": null, "title": { "en": "Trade (% GDP)", "zh-Hans": "\u8D27\u7269\u53CA\u670D\u52A1\u8D38\u6613\u5360GDP\u6BD4\uFF08%\uFF09" }, "domain": "MACROECONOMIC", "dimensions": ["relationships"], "financialMetricId": "trade" },
  "SP.URB.TOTL.IN.ZS": { "unit": "percent", "priceBasis": null, "title": { "en": "Urban population (% total)", "zh-Hans": "\u57CE\u9547\u4EBA\u53E3\u6BD4\uFF08%\uFF09" }, "domain": "MACROECONOMIC", "dimensions": ["environment"], "financialMetricId": null },
  "EG.ELC.ACCS.ZS": { "unit": "percent", "priceBasis": null, "title": { "en": "Access to electricity (% population)", "zh-Hans": "\u7535\u529B\u53EF\u53CA\u4EBA\u53E3\u6BD4\uFF08%\uFF09" }, "domain": "MACROECONOMIC", "dimensions": ["environment"], "financialMetricId": null },
  "EG.FEC.RNEW.ZS": { "unit": "percent_final_energy", "priceBasis": null, "title": { "en": "Renewable energy (% final consumption)", "zh-Hans": "\u53EF\u518D\u751F\u80FD\u6E90\u5360\u6700\u7EC8\u80FD\u6E90\u6D88\u8017\u6BD4\uFF08%\uFF09" }, "domain": "MACROECONOMIC", "dimensions": ["environment", "potential"], "financialMetricId": null },
  "IT.NET.USER.ZS": { "unit": "percent", "priceBasis": null, "title": { "en": "Internet use (% population)", "zh-Hans": "\u4E92\u8054\u7F51\u4F7F\u7528\u4EBA\u53E3\u6BD4\uFF08%\uFF09" }, "domain": "MACROECONOMIC", "dimensions": ["environment"], "financialMetricId": null },
  "GC.REV.XGRT.GD.ZS": { "unit": "percent_GDP", "priceBasis": null, "title": { "en": "Government revenue excluding grants (% GDP)", "zh-Hans": "\u653F\u5E9C\u6536\u5165\uFF08\u4E0D\u542B\u8D60\u6B3E\uFF09\u5360GDP\u6BD4\uFF08%\uFF09" }, "domain": "PUBLIC_FISCAL", "dimensions": ["expression"], "financialMetricId": "governmentRevenue" },
  "GC.XPN.TOTL.GD.ZS": { "unit": "percent_GDP", "priceBasis": null, "title": { "en": "Government expense (% GDP)", "zh-Hans": "\u653F\u5E9C\u8D39\u7528\u5360GDP\u6BD4\uFF08%\uFF09" }, "domain": "PUBLIC_FISCAL", "dimensions": ["expression"], "financialMetricId": "governmentExpenditure" },
  "GC.DOD.TOTL.GD.ZS": { "unit": "percent_GDP", "priceBasis": null, "title": { "en": "Central government debt (% GDP)", "zh-Hans": "\u4E2D\u592E\u653F\u5E9C\u503A\u52A1\u5360GDP\u6BD4\uFF08%\uFF09" }, "domain": "PUBLIC_FISCAL", "dimensions": ["potential"], "financialMetricId": "publicDebt" },
  "GC.BAL.CASH.GD.ZS": { "unit": "percent_GDP", "priceBasis": null, "title": { "en": "Cash surplus/deficit (% GDP)", "zh-Hans": "\u8D22\u653F\u73B0\u91D1\u76C8\u4F59\uFF0F\u8D64\u5B57\u5360GDP\u6BD4\uFF08%\uFF09" }, "domain": "PUBLIC_FISCAL", "dimensions": ["growth"], "financialMetricId": "budgetBalance" }
});
function observationRequest(input) {
  const keys = Object.keys(input);
  if (keys.some((k) => !["country", "indicator", "year"].includes(k))) throw Error("PUBLIC_IDENTIFIERS_ONLY");
  const country = String(input.country || "").toUpperCase(), indicator = input.indicator, year = Number(input.year);
  if (!/^[A-Z]{2}$/.test(country) || !WORLD_BANK_INDICATORS[indicator] || !Number.isInteger(year) || year < 1960 || year > (/* @__PURE__ */ new Date()).getUTCFullYear()) throw Error("OBSERVATION_INPUT_INVALID");
  return { country, indicator, year };
}
async function readWorldBankObservation(input, { fetcher = fetch, now: now2 = () => (/* @__PURE__ */ new Date()).toISOString() } = {}) {
  const q = observationRequest(input), sourceUrl = `https://api.worldbank.org/v2/country/${q.country}/indicator/${q.indicator}?format=json&date=${q.year}&per_page=1`, base = { ...q, provider: "WORLD_BANK", sourceUrl, retrievedAt: now2(), sourceLanguage: "en", spatialLevel: "COUNTRY", definition: WORLD_BANK_INDICATORS[q.indicator], value: null, observationPeriod: q.year, publicationDate: null, personalFact: false, providerCalls: 0 };
  try {
    const r = await fetcher(sourceUrl, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12e3) });
    if (!r.ok) return { ...base, state: r.status === 403 ? "NO_ACCESS" : "SERVICE_ERROR", httpStatus: r.status };
    const body = await r.json();
    if (Array.isArray(body) && body[0]?.total === 0 && body[1] === null) return { ...base, state: "YEAR_MISSING" };
    if (!Array.isArray(body) || !body[0] || !Array.isArray(body[1])) return { ...base, state: "INVALID_RESPONSE" };
    const row = body[1][0];
    if (!row) return { ...base, state: "YEAR_MISSING" };
    if (row.country?.id !== q.country || row.indicator?.id !== q.indicator || String(row.date) !== String(q.year) || body[1].length !== 1) return { ...base, state: "IDENTITY_MISMATCH" };
    if (row.unit && row.unit !== WORLD_BANK_INDICATORS[q.indicator].unit) return { ...base, state: "UNIT_MISMATCH" };
    if (row.value == null) return { ...base, state: "YEAR_MISSING", sourceVersion: body[0].lastupdated || null };
    if (typeof row.value !== "number" || !Number.isFinite(row.value)) return { ...base, state: "INVALID_RESPONSE" };
    return { ...base, state: "OBSERVED", value: row.value, countryName: row.country.value, countryIso3: row.countryiso3code, sourceVersion: body[0].lastupdated || null, publicationDate: null, datasetUpdatedAt: body[0].lastupdated || null, observationDate: String(row.date) };
  } catch (error) {
    return { ...base, state: error.name === "TimeoutError" || error.name === "AbortError" ? "TIMEOUT" : "SERVICE_ERROR" };
  }
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/assets/js/pages/civilization-atlas/world-country-search.js
var WORLD_COUNTRIES = [{ "id": "AFG", "iso2": "AF", "name": { "zh": "\u963F\u5BCC\u6C57", "en": "Afghanistan" } }, { "id": "ALB", "iso2": "AL", "name": { "zh": "\u963F\u5C14\u5DF4\u5C3C\u4E9A", "en": "Albania" } }, { "id": "DZA", "iso2": "DZ", "name": { "zh": "\u963F\u5C14\u53CA\u5229\u4E9A", "en": "Algeria" } }, { "id": "AGO", "iso2": "AO", "name": { "zh": "\u5B89\u54E5\u62C9", "en": "Angola" } }, { "id": "ARG", "iso2": "AR", "name": { "zh": "\u963F\u6839\u5EF7", "en": "Argentina" } }, { "id": "ARM", "iso2": "AM", "name": { "zh": "\u4E9A\u7F8E\u5C3C\u4E9A", "en": "Armenia" } }, { "id": "AUS", "iso2": "AU", "name": { "zh": "\u6FB3\u5927\u5229\u4E9A", "en": "Australia" } }, { "id": "AUT", "iso2": "AT", "name": { "zh": "\u5965\u5730\u5229", "en": "Austria" } }, { "id": "AZE", "iso2": "AZ", "name": { "zh": "\u963F\u585E\u62DC\u7586", "en": "Azerbaijan" } }, { "id": "BHS", "iso2": "BS", "name": { "zh": "\u5DF4\u54C8\u9A6C", "en": "Bahamas" } }, { "id": "BGD", "iso2": "BD", "name": { "zh": "\u5B5F\u52A0\u62C9\u56FD", "en": "Bangladesh" } }, { "id": "BLR", "iso2": "BY", "name": { "zh": "\u767D\u4FC4\u7F57\u65AF", "en": "Belarus" } }, { "id": "BEL", "iso2": "BE", "name": { "zh": "\u6BD4\u5229\u65F6", "en": "Belgium" } }, { "id": "BLZ", "iso2": "BZ", "name": { "zh": "\u4F2F\u5229\u5179", "en": "Belize" } }, { "id": "BEN", "iso2": "BJ", "name": { "zh": "\u8D1D\u5B81", "en": "Benin" } }, { "id": "BTN", "iso2": "BT", "name": { "zh": "\u4E0D\u4E39", "en": "Bhutan" } }, { "id": "BOL", "iso2": "BO", "name": { "zh": "\u73BB\u5229\u7EF4\u4E9A", "en": "Bolivia" } }, { "id": "BIH", "iso2": "BA", "name": { "zh": "\u6CE2\u65AF\u5C3C\u4E9A\u548C\u9ED1\u585E\u54E5\u7EF4\u90A3", "en": "Bosnia & Herzegovina" } }, { "id": "BWA", "iso2": "BW", "name": { "zh": "\u535A\u8328\u74E6\u7EB3", "en": "Botswana" } }, { "id": "BRA", "iso2": "BR", "name": { "zh": "\u5DF4\u897F", "en": "Brazil" } }, { "id": "BRN", "iso2": "BN", "name": { "zh": "\u6587\u83B1", "en": "Brunei" } }, { "id": "BGR", "iso2": "BG", "name": { "zh": "\u4FDD\u52A0\u5229\u4E9A", "en": "Bulgaria" } }, { "id": "BFA", "iso2": "BF", "name": { "zh": "\u5E03\u57FA\u7EB3\u6CD5\u7D22", "en": "Burkina Faso" } }, { "id": "BDI", "iso2": "BI", "name": { "zh": "\u5E03\u9686\u8FEA", "en": "Burundi" } }, { "id": "KHM", "iso2": "KH", "name": { "zh": "\u67EC\u57D4\u5BE8", "en": "Cambodia" } }, { "id": "CMR", "iso2": "CM", "name": { "zh": "\u5580\u9EA6\u9686", "en": "Cameroon" } }, { "id": "CAN", "iso2": "CA", "name": { "zh": "\u52A0\u62FF\u5927", "en": "Canada" } }, { "id": "CAF", "iso2": "CF", "name": { "zh": "\u4E2D\u975E\u5171\u548C\u56FD", "en": "Central African Republic" } }, { "id": "TCD", "iso2": "TD", "name": { "zh": "\u4E4D\u5F97", "en": "Chad" } }, { "id": "CHL", "iso2": "CL", "name": { "zh": "\u667A\u5229", "en": "Chile" } }, { "id": "CHN", "iso2": "CN", "name": { "zh": "\u4E2D\u56FD", "en": "China" } }, { "id": "COL", "iso2": "CO", "name": { "zh": "\u54E5\u4F26\u6BD4\u4E9A", "en": "Colombia" } }, { "id": "COG", "iso2": "CG", "name": { "zh": "\u521A\u679C\uFF08\u5E03\uFF09", "en": "Congo - Brazzaville" } }, { "id": "COD", "iso2": "CD", "name": { "zh": "\u521A\u679C\uFF08\u91D1\uFF09", "en": "Congo - Kinshasa" } }, { "id": "CRI", "iso2": "CR", "name": { "zh": "\u54E5\u65AF\u8FBE\u9ECE\u52A0", "en": "Costa Rica" } }, { "id": "HRV", "iso2": "HR", "name": { "zh": "\u514B\u7F57\u5730\u4E9A", "en": "Croatia" } }, { "id": "CUB", "iso2": "CU", "name": { "zh": "\u53E4\u5DF4", "en": "Cuba" } }, { "id": "CYP", "iso2": "CY", "name": { "zh": "\u585E\u6D66\u8DEF\u65AF", "en": "Cyprus" } }, { "id": "CZE", "iso2": "CZ", "name": { "zh": "\u6377\u514B", "en": "Czechia" } }, { "id": "CIV", "iso2": "CI", "name": { "zh": "\u79D1\u7279\u8FEA\u74E6", "en": "C\xF4te d\u2019Ivoire" } }, { "id": "DNK", "iso2": "DK", "name": { "zh": "\u4E39\u9EA6", "en": "Denmark" } }, { "id": "DJI", "iso2": "DJ", "name": { "zh": "\u5409\u5E03\u63D0", "en": "Djibouti" } }, { "id": "DOM", "iso2": "DO", "name": { "zh": "\u591A\u7C73\u5C3C\u52A0\u5171\u548C\u56FD", "en": "Dominican Republic" } }, { "id": "ECU", "iso2": "EC", "name": { "zh": "\u5384\u74DC\u591A\u5C14", "en": "Ecuador" } }, { "id": "EGY", "iso2": "EG", "name": { "zh": "\u57C3\u53CA", "en": "Egypt" } }, { "id": "SLV", "iso2": "SV", "name": { "zh": "\u8428\u5C14\u74E6\u591A", "en": "El Salvador" } }, { "id": "GNQ", "iso2": "GQ", "name": { "zh": "\u8D64\u9053\u51E0\u5185\u4E9A", "en": "Equatorial Guinea" } }, { "id": "ERI", "iso2": "ER", "name": { "zh": "\u5384\u7ACB\u7279\u91CC\u4E9A", "en": "Eritrea" } }, { "id": "EST", "iso2": "EE", "name": { "zh": "\u7231\u6C99\u5C3C\u4E9A", "en": "Estonia" } }, { "id": "SWZ", "iso2": "SZ", "name": { "zh": "\u65AF\u5A01\u58EB\u5170", "en": "Eswatini" } }, { "id": "ETH", "iso2": "ET", "name": { "zh": "\u57C3\u585E\u4FC4\u6BD4\u4E9A", "en": "Ethiopia" } }, { "id": "FLK", "iso2": "FK", "name": { "zh": "\u798F\u514B\u5170\u7FA4\u5C9B", "en": "Falkland Islands" } }, { "id": "FJI", "iso2": "FJ", "name": { "zh": "\u6590\u6D4E", "en": "Fiji" } }, { "id": "FIN", "iso2": "FI", "name": { "zh": "\u82AC\u5170", "en": "Finland" } }, { "id": "FRA", "iso2": "FR", "name": { "zh": "\u6CD5\u56FD", "en": "France" } }, { "id": "ATF", "iso2": "TF", "name": { "zh": "\u6CD5\u5C5E\u5357\u90E8\u9886\u5730", "en": "French Southern Territories" } }, { "id": "GAB", "iso2": "GA", "name": { "zh": "\u52A0\u84EC", "en": "Gabon" } }, { "id": "GMB", "iso2": "GM", "name": { "zh": "\u5188\u6BD4\u4E9A", "en": "Gambia" } }, { "id": "GEO", "iso2": "GE", "name": { "zh": "\u683C\u9C81\u5409\u4E9A", "en": "Georgia" } }, { "id": "DEU", "iso2": "DE", "name": { "zh": "\u5FB7\u56FD", "en": "Germany" } }, { "id": "GHA", "iso2": "GH", "name": { "zh": "\u52A0\u7EB3", "en": "Ghana" } }, { "id": "GRC", "iso2": "GR", "name": { "zh": "\u5E0C\u814A", "en": "Greece" } }, { "id": "GRL", "iso2": "GL", "name": { "zh": "\u683C\u9675\u5170", "en": "Greenland" } }, { "id": "GTM", "iso2": "GT", "name": { "zh": "\u5371\u5730\u9A6C\u62C9", "en": "Guatemala" } }, { "id": "GIN", "iso2": "GN", "name": { "zh": "\u51E0\u5185\u4E9A", "en": "Guinea" } }, { "id": "GNB", "iso2": "GW", "name": { "zh": "\u51E0\u5185\u4E9A\u6BD4\u7ECD", "en": "Guinea-Bissau" } }, { "id": "GUY", "iso2": "GY", "name": { "zh": "\u572D\u4E9A\u90A3", "en": "Guyana" } }, { "id": "HTI", "iso2": "HT", "name": { "zh": "\u6D77\u5730", "en": "Haiti" } }, { "id": "HND", "iso2": "HN", "name": { "zh": "\u6D2A\u90FD\u62C9\u65AF", "en": "Honduras" } }, { "id": "HUN", "iso2": "HU", "name": { "zh": "\u5308\u7259\u5229", "en": "Hungary" } }, { "id": "ISL", "iso2": "IS", "name": { "zh": "\u51B0\u5C9B", "en": "Iceland" } }, { "id": "IND", "iso2": "IN", "name": { "zh": "\u5370\u5EA6", "en": "India" } }, { "id": "IDN", "iso2": "ID", "name": { "zh": "\u5370\u5EA6\u5C3C\u897F\u4E9A", "en": "Indonesia" } }, { "id": "IRN", "iso2": "IR", "name": { "zh": "\u4F0A\u6717", "en": "Iran" } }, { "id": "IRQ", "iso2": "IQ", "name": { "zh": "\u4F0A\u62C9\u514B", "en": "Iraq" } }, { "id": "IRL", "iso2": "IE", "name": { "zh": "\u7231\u5C14\u5170", "en": "Ireland" } }, { "id": "ISR", "iso2": "IL", "name": { "zh": "\u4EE5\u8272\u5217", "en": "Israel" } }, { "id": "ITA", "iso2": "IT", "name": { "zh": "\u610F\u5927\u5229", "en": "Italy" } }, { "id": "JAM", "iso2": "JM", "name": { "zh": "\u7259\u4E70\u52A0", "en": "Jamaica" } }, { "id": "JPN", "iso2": "JP", "name": { "zh": "\u65E5\u672C", "en": "Japan" } }, { "id": "JOR", "iso2": "JO", "name": { "zh": "\u7EA6\u65E6", "en": "Jordan" } }, { "id": "KAZ", "iso2": "KZ", "name": { "zh": "\u54C8\u8428\u514B\u65AF\u5766", "en": "Kazakhstan" } }, { "id": "KEN", "iso2": "KE", "name": { "zh": "\u80AF\u5C3C\u4E9A", "en": "Kenya" } }, { "id": "XKX", "iso2": null, "name": { "zh": "\u79D1\u7D22\u6C83\u5730\u533A", "en": "Kosovo area" } }, { "id": "KWT", "iso2": "KW", "name": { "zh": "\u79D1\u5A01\u7279", "en": "Kuwait" } }, { "id": "KGZ", "iso2": "KG", "name": { "zh": "\u5409\u5C14\u5409\u65AF\u65AF\u5766", "en": "Kyrgyzstan" } }, { "id": "LAO", "iso2": "LA", "name": { "zh": "\u8001\u631D", "en": "Laos" } }, { "id": "LVA", "iso2": "LV", "name": { "zh": "\u62C9\u8131\u7EF4\u4E9A", "en": "Latvia" } }, { "id": "LBN", "iso2": "LB", "name": { "zh": "\u9ECE\u5DF4\u5AE9", "en": "Lebanon" } }, { "id": "LSO", "iso2": "LS", "name": { "zh": "\u83B1\u7D22\u6258", "en": "Lesotho" } }, { "id": "LBR", "iso2": "LR", "name": { "zh": "\u5229\u6BD4\u91CC\u4E9A", "en": "Liberia" } }, { "id": "LBY", "iso2": "LY", "name": { "zh": "\u5229\u6BD4\u4E9A", "en": "Libya" } }, { "id": "LTU", "iso2": "LT", "name": { "zh": "\u7ACB\u9676\u5B9B", "en": "Lithuania" } }, { "id": "LUX", "iso2": "LU", "name": { "zh": "\u5362\u68EE\u5821", "en": "Luxembourg" } }, { "id": "MDG", "iso2": "MG", "name": { "zh": "\u9A6C\u8FBE\u52A0\u65AF\u52A0", "en": "Madagascar" } }, { "id": "MWI", "iso2": "MW", "name": { "zh": "\u9A6C\u62C9\u7EF4", "en": "Malawi" } }, { "id": "MYS", "iso2": "MY", "name": { "zh": "\u9A6C\u6765\u897F\u4E9A", "en": "Malaysia" } }, { "id": "MLI", "iso2": "ML", "name": { "zh": "\u9A6C\u91CC", "en": "Mali" } }, { "id": "MRT", "iso2": "MR", "name": { "zh": "\u6BDB\u91CC\u5854\u5C3C\u4E9A", "en": "Mauritania" } }, { "id": "MEX", "iso2": "MX", "name": { "zh": "\u58A8\u897F\u54E5", "en": "Mexico" } }, { "id": "MDA", "iso2": "MD", "name": { "zh": "\u6469\u5C14\u591A\u74E6", "en": "Moldova" } }, { "id": "MNG", "iso2": "MN", "name": { "zh": "\u8499\u53E4", "en": "Mongolia" } }, { "id": "MNE", "iso2": "ME", "name": { "zh": "\u9ED1\u5C71", "en": "Montenegro" } }, { "id": "MAR", "iso2": "MA", "name": { "zh": "\u6469\u6D1B\u54E5", "en": "Morocco" } }, { "id": "MOZ", "iso2": "MZ", "name": { "zh": "\u83AB\u6851\u6BD4\u514B", "en": "Mozambique" } }, { "id": "MMR", "iso2": "MM", "name": { "zh": "\u7F05\u7538", "en": "Myanmar (Burma)" } }, { "id": "NAM", "iso2": "NA", "name": { "zh": "\u7EB3\u7C73\u6BD4\u4E9A", "en": "Namibia" } }, { "id": "NPL", "iso2": "NP", "name": { "zh": "\u5C3C\u6CCA\u5C14", "en": "Nepal" } }, { "id": "NLD", "iso2": "NL", "name": { "zh": "\u8377\u5170", "en": "Netherlands" } }, { "id": "NCL", "iso2": "NC", "name": { "zh": "\u65B0\u5580\u91CC\u591A\u5C3C\u4E9A", "en": "New Caledonia" } }, { "id": "NZL", "iso2": "NZ", "name": { "zh": "\u65B0\u897F\u5170", "en": "New Zealand" } }, { "id": "NIC", "iso2": "NI", "name": { "zh": "\u5C3C\u52A0\u62C9\u74DC", "en": "Nicaragua" } }, { "id": "NER", "iso2": "NE", "name": { "zh": "\u5C3C\u65E5\u5C14", "en": "Niger" } }, { "id": "NGA", "iso2": "NG", "name": { "zh": "\u5C3C\u65E5\u5229\u4E9A", "en": "Nigeria" } }, { "id": "PRK", "iso2": "KP", "name": { "zh": "\u671D\u9C9C", "en": "North Korea" } }, { "id": "MKD", "iso2": "MK", "name": { "zh": "\u5317\u9A6C\u5176\u987F", "en": "North Macedonia" } }, { "id": "XNC", "iso2": null, "name": { "zh": "\u5317\u585E\u6D66\u8DEF\u65AF\u5730\u533A", "en": "Northern Cyprus area" } }, { "id": "NOR", "iso2": "NO", "name": { "zh": "\u632A\u5A01", "en": "Norway" } }, { "id": "OMN", "iso2": "OM", "name": { "zh": "\u963F\u66FC", "en": "Oman" } }, { "id": "PAK", "iso2": "PK", "name": { "zh": "\u5DF4\u57FA\u65AF\u5766", "en": "Pakistan" } }, { "id": "PSE", "iso2": "PS", "name": { "zh": "\u5DF4\u52D2\u65AF\u5766\u9886\u571F", "en": "Palestinian Territories" } }, { "id": "PAN", "iso2": "PA", "name": { "zh": "\u5DF4\u62FF\u9A6C", "en": "Panama" } }, { "id": "PNG", "iso2": "PG", "name": { "zh": "\u5DF4\u5E03\u4E9A\u65B0\u51E0\u5185\u4E9A", "en": "Papua New Guinea" } }, { "id": "PRY", "iso2": "PY", "name": { "zh": "\u5DF4\u62C9\u572D", "en": "Paraguay" } }, { "id": "PER", "iso2": "PE", "name": { "zh": "\u79D8\u9C81", "en": "Peru" } }, { "id": "PHL", "iso2": "PH", "name": { "zh": "\u83F2\u5F8B\u5BBE", "en": "Philippines" } }, { "id": "POL", "iso2": "PL", "name": { "zh": "\u6CE2\u5170", "en": "Poland" } }, { "id": "PRT", "iso2": "PT", "name": { "zh": "\u8461\u8404\u7259", "en": "Portugal" } }, { "id": "PRI", "iso2": "PR", "name": { "zh": "\u6CE2\u591A\u9ECE\u5404", "en": "Puerto Rico" } }, { "id": "QAT", "iso2": "QA", "name": { "zh": "\u5361\u5854\u5C14", "en": "Qatar" } }, { "id": "ROU", "iso2": "RO", "name": { "zh": "\u7F57\u9A6C\u5C3C\u4E9A", "en": "Romania" } }, { "id": "RUS", "iso2": "RU", "name": { "zh": "\u4FC4\u7F57\u65AF", "en": "Russia" } }, { "id": "RWA", "iso2": "RW", "name": { "zh": "\u5362\u65FA\u8FBE", "en": "Rwanda" } }, { "id": "SAU", "iso2": "SA", "name": { "zh": "\u6C99\u7279\u963F\u62C9\u4F2F", "en": "Saudi Arabia" } }, { "id": "SEN", "iso2": "SN", "name": { "zh": "\u585E\u5185\u52A0\u5C14", "en": "Senegal" } }, { "id": "SRB", "iso2": "RS", "name": { "zh": "\u585E\u5C14\u7EF4\u4E9A", "en": "Serbia" } }, { "id": "SLE", "iso2": "SL", "name": { "zh": "\u585E\u62C9\u5229\u6602", "en": "Sierra Leone" } }, { "id": "SVK", "iso2": "SK", "name": { "zh": "\u65AF\u6D1B\u4F10\u514B", "en": "Slovakia" } }, { "id": "SVN", "iso2": "SI", "name": { "zh": "\u65AF\u6D1B\u6587\u5C3C\u4E9A", "en": "Slovenia" } }, { "id": "SLB", "iso2": "SB", "name": { "zh": "\u6240\u7F57\u95E8\u7FA4\u5C9B", "en": "Solomon Islands" } }, { "id": "SOM", "iso2": "SO", "name": { "zh": "\u7D22\u9A6C\u91CC", "en": "Somalia" } }, { "id": "XSL", "iso2": null, "name": { "zh": "\u7D22\u9A6C\u91CC\u5170\u5730\u533A", "en": "Somaliland area" } }, { "id": "ZAF", "iso2": "ZA", "name": { "zh": "\u5357\u975E", "en": "South Africa" } }, { "id": "KOR", "iso2": "KR", "name": { "zh": "\u97E9\u56FD", "en": "South Korea" } }, { "id": "SSD", "iso2": "SS", "name": { "zh": "\u5357\u82CF\u4E39", "en": "South Sudan" } }, { "id": "ESP", "iso2": "ES", "name": { "zh": "\u897F\u73ED\u7259", "en": "Spain" } }, { "id": "LKA", "iso2": "LK", "name": { "zh": "\u65AF\u91CC\u5170\u5361", "en": "Sri Lanka" } }, { "id": "SDN", "iso2": "SD", "name": { "zh": "\u82CF\u4E39", "en": "Sudan" } }, { "id": "SUR", "iso2": "SR", "name": { "zh": "\u82CF\u91CC\u5357", "en": "Suriname" } }, { "id": "SWE", "iso2": "SE", "name": { "zh": "\u745E\u5178", "en": "Sweden" } }, { "id": "CHE", "iso2": "CH", "name": { "zh": "\u745E\u58EB", "en": "Switzerland" } }, { "id": "SYR", "iso2": "SY", "name": { "zh": "\u53D9\u5229\u4E9A", "en": "Syria" } }, { "id": "TWN", "iso2": "TW", "name": { "zh": "\u53F0\u6E7E\u5730\u533A", "en": "Taiwan" } }, { "id": "TJK", "iso2": "TJ", "name": { "zh": "\u5854\u5409\u514B\u65AF\u5766", "en": "Tajikistan" } }, { "id": "TZA", "iso2": "TZ", "name": { "zh": "\u5766\u6851\u5C3C\u4E9A", "en": "Tanzania" } }, { "id": "THA", "iso2": "TH", "name": { "zh": "\u6CF0\u56FD", "en": "Thailand" } }, { "id": "TLS", "iso2": "TL", "name": { "zh": "\u4E1C\u5E1D\u6C76", "en": "Timor-Leste" } }, { "id": "TGO", "iso2": "TG", "name": { "zh": "\u591A\u54E5", "en": "Togo" } }, { "id": "TTO", "iso2": "TT", "name": { "zh": "\u7279\u7ACB\u5C3C\u8FBE\u548C\u591A\u5DF4\u54E5", "en": "Trinidad & Tobago" } }, { "id": "TUN", "iso2": "TN", "name": { "zh": "\u7A81\u5C3C\u65AF", "en": "Tunisia" } }, { "id": "TKM", "iso2": "TM", "name": { "zh": "\u571F\u5E93\u66FC\u65AF\u5766", "en": "Turkmenistan" } }, { "id": "TUR", "iso2": "TR", "name": { "zh": "\u571F\u8033\u5176", "en": "T\xFCrkiye" } }, { "id": "UGA", "iso2": "UG", "name": { "zh": "\u4E4C\u5E72\u8FBE", "en": "Uganda" } }, { "id": "UKR", "iso2": "UA", "name": { "zh": "\u4E4C\u514B\u5170", "en": "Ukraine" } }, { "id": "ARE", "iso2": "AE", "name": { "zh": "\u963F\u62C9\u4F2F\u8054\u5408\u914B\u957F\u56FD", "en": "United Arab Emirates" } }, { "id": "GBR", "iso2": "GB", "name": { "zh": "\u82F1\u56FD", "en": "United Kingdom" } }, { "id": "USA", "iso2": "US", "name": { "zh": "\u7F8E\u56FD", "en": "United States" } }, { "id": "URY", "iso2": "UY", "name": { "zh": "\u4E4C\u62C9\u572D", "en": "Uruguay" } }, { "id": "UZB", "iso2": "UZ", "name": { "zh": "\u4E4C\u5179\u522B\u514B\u65AF\u5766", "en": "Uzbekistan" } }, { "id": "VUT", "iso2": "VU", "name": { "zh": "\u74E6\u52AA\u963F\u56FE", "en": "Vanuatu" } }, { "id": "VEN", "iso2": "VE", "name": { "zh": "\u59D4\u5185\u745E\u62C9", "en": "Venezuela" } }, { "id": "VNM", "iso2": "VN", "name": { "zh": "\u8D8A\u5357", "en": "Vietnam" } }, { "id": "ESH", "iso2": "EH", "name": { "zh": "\u897F\u6492\u54C8\u62C9", "en": "Western Sahara" } }, { "id": "YEM", "iso2": "YE", "name": { "zh": "\u4E5F\u95E8", "en": "Yemen" } }, { "id": "ZMB", "iso2": "ZM", "name": { "zh": "\u8D5E\u6BD4\u4E9A", "en": "Zambia" } }, { "id": "ZWE", "iso2": "ZW", "name": { "zh": "\u6D25\u5DF4\u5E03\u97E6", "en": "Zimbabwe" } }];
WORLD_COUNTRIES.push({ id: "SGP", iso2: "SG", name: { zh: "\u65B0\u52A0\u5761", en: "Singapore" }, geometryAvailable: false, source: "https://api.worldbank.org/v2/country/SG?format=json" });
var countryText = (s) => String(s || "").normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
var names = (c) => [c.id, c.iso2, ...Object.values(c.name)];
function countriesInQuestion(value) {
  const q = countryText(value), original = String(value), rx = (n) => new RegExp("\\b" + countryText(n).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
  const matched = WORLD_COUNTRIES.filter((c) => Object.entries(c.name).some(([lang, n]) => lang === "zh" ? q.includes(countryText(n)) : rx(n).test(q)) || rx(c.id).test(q) || countryText(c.iso2) === q || new RegExp("\\b" + c.iso2 + "\\b").test(original) && c.iso2 === c.iso2.toUpperCase());
  const position = (c) => Math.min(...names(c).map((n) => /[\u3400-\u9fff]/.test(n) ? q.indexOf(countryText(n)) : q.search(rx(n))).filter((i) => i >= 0));
  return matched.sort((a, b) => position(a) - position(b));
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/_lib/world-country-evidence.js
var COUNTRY_EVIDENCE_VERSION = "WORLD_PUBLIC_COUNTRY_EVIDENCE_R1";
var countryIdentity = (code) => WORLD_COUNTRIES.find((x) => x.id === code) || null;
var publicSubjectRef = (code) => "WORLD:COUNTRY:" + code;
async function readCountryEvidence(env, origin) {
  const response = await env.ASSETS?.fetch(new Request(new URL("/content/world/world-country-public-evidence-r1.json", origin)));
  if (!response?.ok) throw Object.assign(Error("PUBLIC_COUNTRY_SOURCE_UNAVAILABLE"), { status: 503 });
  const snapshot = await response.json();
  if (snapshot.schemaVersion !== COUNTRY_EVIDENCE_VERSION || snapshot.owner !== "WORLD_EVIDENCE") throw Object.assign(Error("COUNTRY_SOURCE_VERSION_INVALID"), { status: 503 });
  return snapshot;
}
function projectCountryEvidence(snapshot, code, { year = null } = {}) {
  const identity = countryIdentity(code);
  if (!identity) throw Object.assign(Error("COUNTRY_IDENTITY_UNKNOWN"), { status: 404 });
  const rows2 = [];
  for (const series of snapshot.series || []) {
    const definition = WORLD_BANK_INDICATORS[series.indicatorId];
    if (!definition) continue;
    const sourceRows = series.observations.filter((x) => x.countryCode === code && (!year || x.period === year));
    const pilot = snapshot.identitySource.countries.some((c) => c.id === code);
    const periods = year ? [year] : Array.from({ length: snapshot.periodRequest.end - snapshot.periodRequest.start + 1 }, (_, i) => snapshot.periodRequest.start + i);
    const projectedRows = pilot ? periods.map((period) => sourceRows.find((x) => x.period === period) || { countryCode: code, period, value: null, qualityState: "MISSING", sourceReturnedObservation: false }) : sourceRows;
    for (const o of projectedRows) {
      const known = series.licenseStatus === "INDICATOR_CC_BY_4_0_VERIFIED" && o.qualityState === "OBSERVED" && Number.isFinite(o.value);
      rows2.push({ id: series.indicatorId + ":" + code + ":" + o.period, subjectId: publicSubjectRef(code), countryCode: code, countryCodeAlpha2: identity.iso2, indicatorId: series.indicatorId, indicatorDefinition: series.metadata.Longdefinition || series.metadata.Shortdefinition || null, title: definition.title, domain: definition.domain || "MACROECONOMIC", dimensionIds: definition.dimensions || (series.indicatorId === "SP.POP.TOTL" ? ["identity", "growth"] : ["expression", "growth"]), financialMetricId: definition.financialMetricId || (series.indicatorId === "NY.GDP.MKTP.CD" ? "gdp" : null), unit: definition.unit, currency: definition.unit === "USD" ? "USD" : null, value: known ? o.value : null, periodStart: null, periodEnd: null, sourceReportedPeriod: String(o.period), periodBoundaryStatus: "YEAR_LABEL_ONLY_CALENDAR_OR_FISCAL_BOUNDARY_NOT_VERIFIED", year: o.period, frequency: series.metadata.Periodicity || null, sourcePublisher: series.metadata.Source || null, sourceDataset: "World Development Indicators", sourceUrl: series.dataUrl, metadataUrl: series.metadataUrl, retrievedAt: series.retrievedAt, publicationDate: null, sourceUpdatedAt: series.sourceUpdatedAt, sourceVersion: series.sourceUpdatedAt || null, sourceDigest: series.dataSha256, metadataDigest: series.metadataSha256, projectionVersion: snapshot.projectionDigest, methodology: series.metadata.Statisticalconceptandmethodology || null, coverage: series.metadata.Limitationsandexceptions || null, licenseStatus: series.licenseStatus, licenseUrl: series.metadata.License_URL || null, sourceReturnedObservation: o.sourceReturnedObservation !== false, qualityState: known ? "OBSERVED" : o.qualityState === "RIGHTS_PENDING" ? "RIGHTS_PENDING" : "MISSING", kind: "OBSERVED_FACT", factStatement: "Source reports this statistical value; not a claim of direct measurement.", estimateBasis: ["SP.POP.TOTL", "SL.EMP.TOTL.SP.ZS"].includes(series.indicatorId) ? "SOURCE_ESTIMATE_OR_MODEL" : null, access: "PUBLIC", privateDataUsed: false });
    }
  }
  return { identity: { subjectId: publicSubjectRef(code), subjectType: "COUNTRY", displayNames: { en: identity.name.en, "zh-Hans": identity.name.zh }, countryCodeAlpha3: code, countryCodeAlpha2: identity.iso2, identitySource: identity.source || "WORLD_GEO_R2", identityVersion: "WORLD_GEO_R2_WITH_VERIFIED_SGP_IDENTITY", ownershipClass: "SYSTEM_MAINTAINED", visibility: "PUBLIC", permissionScope: ["PUBLIC_READ", "PUBLIC_RESEARCH"], ownsSubject: false, geometryAvailability: identity.geometryAvailable === false ? "UNAVAILABLE" : "AVAILABLE", entityType: ["MYS", "SGP", "IDN"].includes(code) ? "COUNTRY" : "GEOGRAPHIC_ENTITY_CLASSIFICATION_UNVERIFIED", currentIdentitySource: identity.source || "/content/civilization-atlas/geography/world-selection-geometry-r2.json" }, rows: rows2, sourceVersion: snapshot.projectionDigest, asOf: snapshot.retrievedAt, pilotCoverage: snapshot.identitySource.countries.some((c) => c.id === code), requestedYear: year };
}
function compareCountryEvidence(left, right, { year = 2024 } = {}) {
  const by = (p, id2) => p.rows.find((x) => x.indicatorId === id2 && x.year === year && x.qualityState === "OBSERVED");
  return Object.entries(WORLD_BANK_INDICATORS).map(([id2, d]) => {
    const a = by(left, id2), b = by(right, id2), compatible = a && b && ["indicatorId", "unit", "currency", "frequency", "sourceDataset", "projectionVersion", "year"].every((k) => a[k] === b[k]) && a.domain !== "PUBLIC_FISCAL";
    return { indicatorId: id2, title: d.title, year, unit: d.unit, left: a || null, right: b || null, state: compatible ? "COMPARABLE" : a?.domain === "PUBLIC_FISCAL" || b?.domain === "PUBLIC_FISCAL" ? "GOVERNMENT_COVERAGE_RECHECK_REQUIRED" : "MISSING_OR_INCOMPATIBLE", reason: compatible ? "Same reported definition, year, frequency, unit and snapshot. No ranking." : "Missing values or unconfirmed government reporting coverage; no substitute or score.", differenceCalculated: false };
  });
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/_lib/knowledge-source-eligibility.js
var denyStates = /* @__PURE__ */ new Set(["NOT_ACTIVATED", "WITHHELD", "DENIED", "UNKNOWN", "REJECTED", "STALE"]);
var clean2 = (value) => typeof value === "string" ? value.normalize("NFKC").trim().replace(/\s+/g, " ") : "";
function publicSourceUrl(value) {
  const s = clean2(value);
  if (!s) return null;
  try {
    const u = new URL(s, "https://phios.invalid");
    if (u.protocol !== "https:" || /^\/(?:api|tmp|tools|docs|functions|scripts|content|node_modules|\.git)(?:\/|$)/i.test(u.pathname)) return null;
    return u.origin === "https://phios.invalid" ? u.pathname + u.search + u.hash : u.toString();
  } catch {
    return null;
  }
}
function stateAllowsSource(source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return false;
  if (source.eligible !== void 0 && source.eligible !== true) return false;
  if (source.denied === true || source.stale === true || source.invalidated === true) return false;
  for (const key2 of ["currentAdmission", "admissionStatus", "eligibilityState"]) if (source[key2] !== void 0 && (typeof source[key2] !== "string" || denyStates.has(source[key2]) || !["ACTIVATED", "ADMITTED", "ELIGIBLE", "AVAILABLE"].includes(source[key2]))) return false;
  if (/unknown|stale|^v0(?:-|$)/i.test(clean2(source.sourceVersion))) return false;
  return true;
}
var NO_SUPPORT_COPY = Object.freeze({ en: "There is not enough source material to answer this question.", "zh-Hans": "\u76EE\u524D\u6CA1\u6709\u8DB3\u591F\u7684\u6765\u6E90\u8D44\u6599\u6765\u56DE\u7B54\u8FD9\u4E2A\u95EE\u9898\u3002" });

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/_lib/knowledge-epistemic-reading.js
var KNOWLEDGE_STATES = Object.freeze(["KNOWN", "RECONSTRUCTED", "PROJECTED", "CONTESTED", "UNKNOWN"]);
var OBSERVATION_TIME_CLASSES = Object.freeze(["CURRENT", "LONGITUDINAL", "STRUCTURAL"]);
var UNKNOWN_REASONS = Object.freeze(["INSUFFICIENT_EVIDENCE", "LOW_RESOLUTION", "TIME_WINDOW_TOO_SHORT", "SOURCE_CONFLICT", "CONTESTED", "MODEL_BLIND_SPOT", "IRREDUCIBLE_UNCERTAINTY"]);
var CLAIM_AUTHORITIES = Object.freeze({ POLICY_FACT: ["POLICY_ISSUER"], OFFICIAL_STATISTIC: ["STATISTICAL_AGENCY"], COMPANY_FINANCIAL_FACT: ["AUDITED_FILING", "REGULATORY_FILING"], MARKET_REACTION: ["MARKET_DATA"], LONGITUDINAL_PATTERN: ["REPEATED_EVIDENCE"], STRUCTURAL_RECONFIGURATION: ["RELATION_CARRIER_ROUTING_CONSTRAINT_EVIDENCE"], HISTORICAL_RECONSTRUCTION: ["HISTORICAL_ARCHIVE"], FUTURE_PROJECTION: ["CONDITIONAL_MODEL"], LIVED_EXPERIENCE: ["FIRST_PERSON_ACCOUNT"] });
function evaluateClaimAuthorityMatch({ claimType, authorityType } = {}) {
  return { claimType, authorityType, matched: (CLAIM_AUTHORITIES[claimType] || []).includes(authorityType), globalSourceRanking: false };
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/_lib/knowledge-country-reading.js
function countryReadingContext(subject, dimension, observations, { locale = "en", sourceVersion } = {}) {
  if (subject.subjectType !== "COUNTRY" || subject.visibility !== "PUBLIC" || !/^WORLD:COUNTRY:[A-Z]{3}$/.test(subject.subjectId)) throw Error("PUBLIC_READING_SUBJECT_REQUIRED");
  const eligible = observations.filter((e) => e.subjectId === subject.subjectId && e.qualityState === "OBSERVED" && e.licenseStatus === "INDICATOR_CC_BY_4_0_VERIFIED" && publicSourceUrl(e.sourceUrl) && stateAllowsSource({ sourceVersion: e.projectionVersion, eligible: true, eligibilityState: "AVAILABLE" }));
  const refs = eligible.map((x) => x.id);
  return { subjectType: "COUNTRY", subjectRef: subject.subjectId, dimension, sourceRefs: refs, sourceVersions: [...new Set(eligible.map((x) => x.sourceDigest))], periods: [...new Set(eligible.map((x) => x.year))].sort(), question: null, locale, readingPurpose: "PUBLIC_SOURCE_SCOPED_SUBJECT_REVIEW", sourceVersion, eligibility: refs.length ? "SOURCE_BOUND_PUBLIC_READING" : "INSUFFICIENT_EVIDENCE", knowledgeState: deriveKnowledgeState({ evidenceRefs: refs, sufficient: refs.length > 0, observedRealized: refs.length > 0 }), observationTimeClass: deriveObservationTimeClass({ repeatedEvidence: new Set(eligible.map((x) => x.year)).size > 1, distinctTimeWindows: new Set(eligible.map((x) => x.year)).size }), facts: eligible, calculations: [], mechanisms: [], conditionalInterpretations: [], assumptions: [], unknown: refs.length ? ["NO_CAUSAL_OR_POLICY_CONCLUSION"] : ["NO_MATCHING_PUBLIC_OBSERVATION"], modelUsed: false, privateReadingAccessGranted: false };
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/professional/financial/country-public-financial-adapter-r1.js
function countryFinancialProjection(subject, evidence) {
  if (subject.subjectType !== "COUNTRY" || subject.visibility !== "PUBLIC") throw Error("COUNTRY_PUBLIC_FINANCIAL_SCOPE_REQUIRED");
  const macro = evidence.filter((e) => e.domain === "MACROECONOMIC"), fiscal = evidence.filter((e) => e.domain === "PUBLIC_FISCAL");
  if (fiscal.some((e) => !FINANCIAL_SCOPE_METRICS.PUBLIC_FISCAL.includes(e.financialMetricId))) throw Error("PUBLIC_FISCAL_METRIC_SCOPE_MISMATCH");
  return { subjectId: subject.subjectId, subjectType: "COUNTRY", macroeconomic: { scope: "MACROECONOMIC", observations: macro }, publicFinance: { scope: "PUBLIC_FISCAL", observations: fiscal, governmentCoverage: "CENTRAL_OR_BUDGETARY_CENTRAL_RECHECK_REQUIRED", currencyAmountsAvailable: false, unavailableMetrics: ["debtService", "localCurrencyRevenue", "localCurrencyExpenditure", "verifiedConsolidatedGovernmentBoundary"], expenseIsCompleteExpenditure: false, reportedRatiosOnly: true, budgetBalance: null, budgetBalanceReason: "Revenue excludes grants; expense is not complete expenditure; no matched government boundary or cash-balance observation.", policyAdvice: false }, derivedMetrics: [], personalFormulaApplied: false, businessProfitApplied: false, GDPIsGovernmentRevenue: false, automaticProfessionalConclusion: false };
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/profile/public-country-profile-r1.js
var latest = (rows2) => [...new Set(rows2.map((x) => x.indicatorId))].map((id2) => {
  const all2 = rows2.filter((x) => x.indicatorId === id2).sort((a, b) => b.year - a.year);
  return all2.find((x) => x.qualityState === "OBSERVED") || all2[0];
}).filter(Boolean);
function publicSubjectCatalogue(locale = "en") {
  return { contractVersion: "SUBJECT-CONTEXT-R1", subjectTypes: SUBJECT_TYPES.map((id2) => ({ id: id2, publicCountryAvailable: id2 === "COUNTRY", personalEntry: id2 === "PERSONAL" ? "/perspectives/profile/" : null, privateProvisioningGranted: false, dimensions: subjectDefinitions(id2, locale) })), dimensionIds: DIMENSIONS, pilots: ["MYS", "SGP", "IDN"], privateSubjectCreation: false };
}
async function publicCountryProfile(context, { countryCode, locale = "en", year = null, compare = null, dimension = "identity" } = {}) {
  if (!DIMENSIONS.includes(dimension)) throw Object.assign(Error("DIMENSION_INVALID"), { status: 400 });
  const identity = countryIdentity(countryCode);
  if (!identity) throw Object.assign(Error("COUNTRY_IDENTITY_UNKNOWN"), { status: 404 });
  const snapshot = await readCountryEvidence(context.env, context.request.url), p = projectCountryEvidence(snapshot, countryCode, { year });
  const observations = year ? p.rows : latest(p.rows);
  const dimensions = subjectDefinitions("COUNTRY", locale).map((d) => {
    const rows2 = observations.filter((x) => x.dimensionIds.includes(d.id)), context2 = countryReadingContext(p.identity, d.id, p.rows.filter((x) => x.dimensionIds.includes(d.id)), { locale, sourceVersion: p.sourceVersion });
    return { ...d, observations: rows2, known: context2.facts.length > 0, readingContext: context2, sourceRefs: context2.sourceRefs, missing: rows2.filter((x) => x.value === null).map((x) => x.indicatorId), factPeriodIsNotRetrievalDate: true };
  });
  const financial = countryFinancialProjection(p.identity, observations);
  const selected = dimensions.find((x) => x.id === dimension);
  const navigation = projectPublicCountryResearchNavigation({ subject: p.identity, dimension, sourceRefs: selected.sourceRefs, sourceVersion: p.sourceVersion, locale, countryCode, year: year || 2024 });
  let comparison = null;
  if (compare) {
    if (compare === countryCode) throw Object.assign(Error("DIFFERENT_COUNTRY_REQUIRED"), { status: 400 });
    const other = projectCountryEvidence(snapshot, compare, { year: year || 2024 });
    comparison = { left: p.identity, right: other.identity, year: year || 2024, rows: compareCountryEvidence(p, other, { year: year || 2024 }), ranking: null, sourceVersion: p.sourceVersion };
  }
  return { schemaVersion: "COUNTRY_PROFILE_SOURCE_PROJECTION_R1", contractVersion: "SUBJECT-CONTEXT-R1", subject: p.identity, sourceVersion: p.sourceVersion, asOf: p.asOf, requestedYear: year, pilotCoverage: p.pilotCoverage, coverage: observations.filter((x) => x.value !== null).length ? "PROFILE_FACTS_PARTIAL" : "IDENTITY_AVAILABLE", dimensions, financial, comparison, navigation, history: { countryCode, requestedPeriod: null, coverage: "HISTORY_COVERAGE_PARTIAL", caseMappingAdmitted: false, modernBoundaryIsHistoricalBoundary: false, href: "/world/?worldJourney=history&locale=" + locale + "#v=2&mode=history&pane=cases&region=" + countryCode + "&applyYear=false" }, privacy: { accountRead: false, pwsRead: false, privateProfileRead: false, personalNationalityInferred: false, countryAdministrationGranted: false, persistence: false }, paidProviderCalls: 0, productionAdmissionGranted: false };
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/account/oidc-auth.js
import { EncryptJWT, jwtDecrypt, jwtVerify, createLocalJWKSet } from "jose";
var SESSION_COOKIE = "__Host-phios-session";
var encoder = new TextEncoder();
var fail = (code, status = 400) => Object.assign(new Error(code), { code, status });
var now = () => Math.floor(Date.now() / 1e3);
async function digest(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))), (v) => v.toString(16).padStart(2, "0")).join("");
}
function config(context) {
  const env = context.env || {}, origin = new URL(context.request.url).origin;
  if (env.AUTH_PROVIDER !== "auth0" || !env.AUTH_CLIENT_ID || !env.AUTH_CLIENT_SECRET || String(env.AUTH_SESSION_SECRET || "").length < 32 || !env.RUNTIME_DB?.prepare) throw fail("AUTH_CONFIGURATION_REQUIRED", 503);
  let issuer;
  try {
    issuer = new URL(env.AUTH_ISSUER);
  } catch {
    throw fail("AUTH_ISSUER_INVALID", 503);
  }
  if (issuer.protocol !== "https:" || issuer.username || issuer.password || issuer.search || issuer.hash || issuer.pathname !== "/") throw fail("AUTH_ISSUER_INVALID", 503);
  const callback = env.AUTH_CALLBACK_URL || `${origin}/api/auth/callback`;
  if (new URL(callback).origin !== origin || new URL(callback).pathname !== "/api/auth/callback" || new URL(callback).search || new URL(callback).hash || !origin.startsWith("https://")) throw fail("AUTH_CALLBACK_INVALID", 503);
  return { issuer: issuer.href, origin, callback, clientId: env.AUTH_CLIENT_ID, clientSecret: env.AUTH_CLIENT_SECRET, secret: env.AUTH_SESSION_SECRET, db: env.RUNTIME_DB };
}
async function key(c, purpose) {
  return crypto.subtle.digest("SHA-256", encoder.encode(`${purpose}\0${c.issuer}\0${c.clientId}\0${c.origin}\0${c.secret}`)).then((v) => new Uint8Array(v));
}
async function unseal(c, purpose, token) {
  const { payload } = await jwtDecrypt(token, await key(c, purpose), { issuer: c.issuer, audience: c.origin, keyManagementAlgorithms: ["dir"], contentEncryptionAlgorithms: ["A256GCM"], requiredClaims: ["exp", "iat"] });
  return payload;
}
function cookie(request, name) {
  const values = (request.headers.get("cookie") || "").split(";").map((v) => v.trim()).filter((v) => v.startsWith(`${name}=`));
  return values.length === 1 ? values[0].slice(name.length + 1) : null;
}
async function authenticate(context) {
  const token = cookie(context.request, SESSION_COOKIE);
  if (!token) return null;
  const c = config(context);
  let p;
  try {
    p = await unseal(c, "session", token);
  } catch {
    return null;
  }
  if (typeof p.sid !== "string" || typeof p.uid !== "string") return null;
  const row = await c.db.prepare("SELECT s.user_id FROM account_verified_sessions s JOIN users u ON u.user_id=s.user_id WHERE s.session_hash=? AND s.user_id=? AND s.issuer=? AND s.expires_at>? AND s.revoked_at IS NULL AND u.status='active'").bind(await digest(p.sid), p.uid, c.issuer, now()).first();
  if (!row) return null;
  return Object.freeze({ userId: row.user_id, providerId: c.issuer, sessionId: await digest(p.sid), verified: true, authenticated: true });
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/pws/registry/universal-registry-schema.js
var REGISTRY_SCHEMA_VERSION = "pws-v1";
var REGISTRY_STATUSES = Object.freeze({
  object: ["draft", "active", "suspended", "deprecated", "archived"],
  version: ["draft", "active", "superseded", "withdrawn"],
  relationship: ["active", "inactive", "revoked"],
  restriction: ["active", "inactive", "revoked", "expired"]
});
var RegistryValidationError = class extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "RegistryValidationError";
    this.code = "PWS_REGISTRY_VALIDATION_FAILED";
    this.details = details;
  }
};
function requiredText(value, field) {
  const text2 = String(value ?? "").trim();
  if (!text2) throw new RegistryValidationError(`${field} is required.`, { field });
  return text2;
}
function enumValue(value, allowed, field) {
  const normalized = requiredText(value, field);
  if (!allowed.includes(normalized)) {
    throw new RegistryValidationError(`${field} has an unsupported value.`, {
      field,
      value: normalized,
      allowed
    });
  }
  return normalized;
}
function jsonObject(value, field) {
  if (value === void 0 || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new RegistryValidationError(`${field} must be an object.`, { field });
  }
  return structuredClone(value);
}
function normalizeObject(input, now2) {
  return {
    object_id: requiredText(input.object_id, "object_id"),
    object_code: requiredText(input.object_code, "object_code"),
    object_type: requiredText(input.object_type, "object_type"),
    canonical_name: requiredText(input.canonical_name, "canonical_name"),
    owner_module: requiredText(input.owner_module, "owner_module"),
    schema_version: requiredText(
      input.schema_version || REGISTRY_SCHEMA_VERSION,
      "schema_version"
    ),
    status: enumValue(input.status || "active", REGISTRY_STATUSES.object, "status"),
    metadata: jsonObject(input.metadata, "metadata"),
    created_at: requiredText(input.created_at || now2, "created_at"),
    updated_at: requiredText(input.updated_at || now2, "updated_at")
  };
}
function parseJson(value, field) {
  try {
    return typeof value === "string" ? JSON.parse(value) : value ?? {};
  } catch {
    throw new RegistryValidationError(`Invalid JSON returned for ${field}.`, { field });
  }
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/pws/registry/store-helpers.js
var defaultClock = () => (/* @__PURE__ */ new Date()).toISOString();
var defaultId = (prefix) => `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
function assertDb(db) {
  if (!db?.prepare) {
    throw new RegistryValidationError("RUNTIME_DB D1 binding is required.", {
      binding: "RUNTIME_DB"
    });
  }
  return db;
}
async function all(statement) {
  const result = await statement.all();
  return Array.isArray(result) ? result : result?.results || [];
}
function boundedLimit(value, fallback = 50) {
  const number = Number(value ?? fallback);
  return Number.isInteger(number) && number > 0 ? Math.min(number, 100) : fallback;
}
function id(value, field = "object_id") {
  return requiredText(value, field);
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/pws/registry/audit-store.js
function createAuditStore(options = {}) {
  const db = assertDb(options.db);
  const clock = options.clock || defaultClock;
  const createId = options.createId || defaultId;
  return {
    async append(input) {
      const record = {
        audit_id: requiredText(input.audit_id || createId("aud"), "audit_id"),
        object_id: input.object_id || null,
        operation: requiredText(input.operation, "operation"),
        actor_id: requiredText(input.actor_id, "actor_id"),
        correlation_id: requiredText(input.correlation_id, "correlation_id"),
        before: input.before == null ? null : jsonObject(input.before, "before"),
        after: input.after == null ? null : jsonObject(input.after, "after"),
        occurred_at: requiredText(input.occurred_at || clock(), "occurred_at")
      };
      await db.prepare(`
        INSERT INTO pws_registry_audit VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
      `).bind(
        record.audit_id,
        record.object_id,
        record.operation,
        record.actor_id,
        record.correlation_id,
        record.before == null ? null : JSON.stringify(record.before),
        record.after == null ? null : JSON.stringify(record.after),
        record.occurred_at
      ).run();
      return record;
    },
    async list(objectId) {
      const rows2 = await all(db.prepare(`
        SELECT * FROM pws_registry_audit WHERE object_id = ?1
        ORDER BY occurred_at DESC
      `).bind(requiredText(objectId, "object_id")));
      return rows2.map((row) => ({
        ...row,
        before: row.before_json == null ? null : parseJson(row.before_json, "before"),
        after: row.after_json == null ? null : parseJson(row.after_json, "after")
      }));
    }
  };
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/pws/registry/event-outbox.js
function createEventOutbox(options = {}) {
  const db = assertDb(options.db);
  const clock = options.clock || defaultClock;
  const createId = options.createId || defaultId;
  return {
    async enqueue(input) {
      const record = {
        event_id: requiredText(input.event_id || createId("evt"), "event_id"),
        aggregate_id: requiredText(input.aggregate_id, "aggregate_id"),
        event_type: requiredText(input.event_type, "event_type"),
        event_version: Number(input.event_version || 1),
        payload: jsonObject(input.payload, "payload"),
        occurred_at: requiredText(input.occurred_at || clock(), "occurred_at")
      };
      await db.prepare(`
        INSERT INTO pws_registry_outbox (
          event_id, aggregate_id, event_type, event_version, payload_json, occurred_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
      `).bind(
        record.event_id,
        record.aggregate_id,
        record.event_type,
        record.event_version,
        JSON.stringify(record.payload),
        record.occurred_at
      ).run();
      return record;
    },
    async pending(limit = 50) {
      const rows2 = await all(db.prepare(`
        SELECT * FROM pws_registry_outbox WHERE published_at IS NULL
        ORDER BY occurred_at ASC LIMIT ?1
      `).bind(boundedLimit(limit)));
      return rows2.map((row) => ({ ...row, payload: parseJson(row.payload_json, "payload") }));
    },
    async markPublished(eventId, publishedAt = clock()) {
      await db.prepare(`
        UPDATE pws_registry_outbox SET published_at = ?2 WHERE event_id = ?1
      `).bind(requiredText(eventId, "event_id"), publishedAt).run();
    },
    async markFailed(eventId, error) {
      await db.prepare(`
        UPDATE pws_registry_outbox
        SET attempts = attempts + 1, last_error = ?2 WHERE event_id = ?1
      `).bind(requiredText(eventId, "event_id"), String(error)).run();
    }
  };
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/pws/registry/registry-query-api.js
function objectFromRow(row) {
  return row && { ...row, metadata: parseJson(row.metadata_json, "metadata") };
}
function createRegistryQueryApi(options = {}) {
  const db = assertDb(options.db);
  const getObject = async (objectId) => objectFromRow(await db.prepare(`
    SELECT * FROM pws_registry_objects WHERE object_id = ?1 LIMIT 1
  `).bind(requiredText(objectId, "object_id")).first());
  return Object.freeze({
    getObject,
    async findObjects(input = {}) {
      const values = [];
      const clauses = [];
      for (const [column, value] of [
        ["object_type", input.object_type],
        ["status", input.status],
        ["owner_module", input.owner_module]
      ]) {
        if (value) {
          values.push(String(value));
          clauses.push(`${column} = ?${values.length}`);
        }
      }
      values.push(boundedLimit(input.limit));
      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      const rows2 = await all(db.prepare(`
        SELECT * FROM pws_registry_objects ${where}
        ORDER BY canonical_name ASC LIMIT ?${values.length}
      `).bind(...values));
      return rows2.map(objectFromRow);
    },
    async getObjectView(objectId) {
      const id2 = requiredText(objectId, "object_id");
      const object = await getObject(id2);
      if (!object) return null;
      const [versions, relationships, restrictions] = await Promise.all([
        all(db.prepare(`SELECT * FROM pws_registry_versions
          WHERE object_id = ?1 ORDER BY version_number DESC`).bind(id2)),
        all(db.prepare(`SELECT * FROM pws_registry_relationships
          WHERE source_object_id = ?1 OR target_object_id = ?1
          ORDER BY created_at DESC`).bind(id2)),
        all(db.prepare(`SELECT * FROM pws_registry_restrictions
          WHERE object_id = ?1 AND status = 'active'
          ORDER BY created_at DESC`).bind(id2))
      ]);
      return { object, versions, relationships, restrictions };
    }
  });
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/pws/registry/relationship-store.js
function createRelationshipStore(options = {}) {
  const db = assertDb(options.db);
  const clock = options.clock || defaultClock;
  const createId = options.createId || defaultId;
  return {
    async create(input) {
      const record = {
        relationship_id: requiredText(
          input.relationship_id || createId("rel"),
          "relationship_id"
        ),
        source_object_id: id(input.source_object_id, "source_object_id"),
        target_object_id: id(input.target_object_id, "target_object_id"),
        relationship_type: requiredText(input.relationship_type, "relationship_type"),
        status: enumValue(
          input.status || "active",
          REGISTRY_STATUSES.relationship,
          "status"
        ),
        attributes: jsonObject(input.attributes, "attributes"),
        valid_from: requiredText(input.valid_from || clock(), "valid_from"),
        valid_to: input.valid_to || null,
        created_by: requiredText(input.created_by, "created_by"),
        created_at: requiredText(input.created_at || clock(), "created_at")
      };
      await db.prepare(`
        INSERT INTO pws_registry_relationships VALUES
        (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
      `).bind(
        record.relationship_id,
        record.source_object_id,
        record.target_object_id,
        record.relationship_type,
        record.status,
        JSON.stringify(record.attributes),
        record.valid_from,
        record.valid_to,
        record.created_by,
        record.created_at
      ).run();
      return record;
    },
    async listForObject(objectId) {
      const object_id = id(objectId);
      const rows2 = await all(db.prepare(`
        SELECT * FROM pws_registry_relationships
        WHERE source_object_id = ?1 OR target_object_id = ?1
        ORDER BY created_at DESC
      `).bind(object_id));
      return rows2.map((row) => ({
        ...row,
        attributes: parseJson(row.attributes_json, "attributes")
      }));
    }
  };
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/pws/registry/restriction-store.js
function createRestrictionStore(options = {}) {
  const db = assertDb(options.db);
  const clock = options.clock || defaultClock;
  const createId = options.createId || defaultId;
  return {
    async create(input) {
      const record = {
        restriction_id: requiredText(
          input.restriction_id || createId("rst"),
          "restriction_id"
        ),
        object_id: id(input.object_id),
        restriction_type: requiredText(input.restriction_type, "restriction_type"),
        effect: enumValue(input.effect, ["deny", "require", "limit"], "effect"),
        scope: jsonObject(input.scope, "scope"),
        reason: requiredText(input.reason, "reason"),
        status: enumValue(
          input.status || "active",
          REGISTRY_STATUSES.restriction,
          "status"
        ),
        valid_from: requiredText(input.valid_from || clock(), "valid_from"),
        valid_to: input.valid_to || null,
        created_by: requiredText(input.created_by, "created_by"),
        created_at: requiredText(input.created_at || clock(), "created_at")
      };
      await db.prepare(`
        INSERT INTO pws_registry_restrictions VALUES
        (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
      `).bind(
        record.restriction_id,
        record.object_id,
        record.restriction_type,
        record.effect,
        JSON.stringify(record.scope),
        record.reason,
        record.status,
        record.valid_from,
        record.valid_to,
        record.created_by,
        record.created_at
      ).run();
      return record;
    },
    async list(objectId, activeOnly = false) {
      const rows2 = await all(db.prepare(`
        SELECT * FROM pws_registry_restrictions
        WHERE object_id = ?1 ${activeOnly ? "AND status = 'active'" : ""}
        ORDER BY created_at DESC
      `).bind(id(objectId)));
      return rows2.map((row) => ({ ...row, scope: parseJson(row.scope_json, "scope") }));
    }
  };
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/pws/registry/version-store.js
function createVersionStore(options = {}) {
  const db = assertDb(options.db);
  const clock = options.clock || defaultClock;
  const createId = options.createId || defaultId;
  return {
    async append(input) {
      const objectId = id(input.object_id);
      const latest2 = await db.prepare(`
        SELECT COALESCE(MAX(version_number), 0) AS value
        FROM pws_registry_versions WHERE object_id = ?1
      `).bind(objectId).first();
      const record = {
        version_id: requiredText(input.version_id || createId("ver"), "version_id"),
        object_id: objectId,
        version_number: Number(latest2?.value || 0) + 1,
        schema_version: requiredText(input.schema_version || "pws-v1", "schema_version"),
        payload: jsonObject(input.payload, "payload"),
        checksum: requiredText(input.checksum, "checksum"),
        status: enumValue(input.status || "active", REGISTRY_STATUSES.version, "status"),
        created_by: requiredText(input.created_by, "created_by"),
        created_at: requiredText(input.created_at || clock(), "created_at")
      };
      if (!/^[a-f0-9]{64}$/.test(record.checksum)) {
        throw new TypeError("checksum must be a lowercase SHA-256 value.");
      }
      await db.prepare(`
        INSERT INTO pws_registry_versions (
          version_id, object_id, version_number, schema_version, payload_json,
          checksum, status, created_by, created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
      `).bind(
        record.version_id,
        record.object_id,
        record.version_number,
        record.schema_version,
        JSON.stringify(record.payload),
        record.checksum,
        record.status,
        record.created_by,
        record.created_at
      ).run();
      return record;
    },
    async list(objectId) {
      const rows2 = await all(db.prepare(`
        SELECT * FROM pws_registry_versions
        WHERE object_id = ?1 ORDER BY version_number DESC
      `).bind(id(objectId)));
      return rows2.map((row) => ({ ...row, payload: parseJson(row.payload_json, "payload") }));
    }
  };
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/pws/registry/universal-registry.js
function createUniversalRegistry(options = {}) {
  const db = assertDb(options.db);
  const clock = options.clock || defaultClock;
  const versionStore = createVersionStore({ ...options, db, clock });
  const relationshipStore = createRelationshipStore({ ...options, db, clock });
  const restrictionStore = createRestrictionStore({ ...options, db, clock });
  const auditStore = createAuditStore({ ...options, db, clock });
  const eventOutbox = createEventOutbox({ ...options, db, clock });
  const query = createRegistryQueryApi({ db });
  return Object.freeze({
    versionStore,
    relationshipStore,
    restrictionStore,
    auditStore,
    eventOutbox,
    query,
    async registerObject(input, context) {
      const record = normalizeObject(input, clock());
      await db.prepare(`
        INSERT INTO pws_registry_objects (
          object_id, object_code, object_type, canonical_name, owner_module,
          schema_version, status, metadata_json, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
      `).bind(
        record.object_id,
        record.object_code,
        record.object_type,
        record.canonical_name,
        record.owner_module,
        record.schema_version,
        record.status,
        JSON.stringify(record.metadata),
        record.created_at,
        record.updated_at
      ).run();
      await auditStore.append({
        object_id: record.object_id,
        operation: "registry.object.registered",
        actor_id: context.actor_id,
        correlation_id: context.correlation_id,
        after: record
      });
      await eventOutbox.enqueue({
        aggregate_id: record.object_id,
        event_type: "pws.registry.object.registered",
        payload: { object_id: record.object_id, object_code: record.object_code }
      });
      return record;
    },
    async updateStatus(objectId, status, context) {
      const before = await query.getObject(objectId);
      if (!before) return null;
      const now2 = clock();
      const canonicalStatus = enumValue(status, REGISTRY_STATUSES.object, "status");
      await db.prepare(`
        UPDATE pws_registry_objects SET status = ?2, updated_at = ?3
        WHERE object_id = ?1
      `).bind(objectId, canonicalStatus, now2).run();
      const after = {
        ...before,
        status: canonicalStatus,
        updated_at: now2
      };
      await auditStore.append({
        object_id: objectId,
        operation: "registry.object.status_changed",
        actor_id: context.actor_id,
        correlation_id: context.correlation_id,
        before,
        after
      });
      await eventOutbox.enqueue({
        aggregate_id: objectId,
        event_type: "pws.registry.object.status_changed",
        payload: { object_id: objectId, status: canonicalStatus }
      });
      return after;
    }
  });
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/api/customer-subject-workspace.js
var reply = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
function createSubjectWorkspaceHandler(resolveIdentity = authenticate) {
  return async (context) => {
    const u = new URL(context.request.url);
    if (u.searchParams.has("publicCountry") || u.searchParams.has("publicCountryCatalog")) {
      if (context.request.method !== "GET") return reply({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
      const allowed = ["publicCountry", "publicCountryCatalog", "locale", "year", "compare", "dimension"];
      if ([...u.searchParams.keys()].some((k) => !allowed.includes(k) || u.searchParams.getAll(k).length !== 1)) return reply({ ok: false, code: "PUBLIC_COUNTRY_FIELDS_ONLY" }, 400);
      try {
        const locale = u.searchParams.get("locale") === "zh-Hans" ? "zh-Hans" : "en", raw = u.searchParams.get("year"), year = raw ? Number(raw) : null;
        if (raw && (!Number.isInteger(year) || year < 1960 || year > (/* @__PURE__ */ new Date()).getUTCFullYear())) return reply({ ok: false, code: "YEAR_INVALID" }, 400);
        const body = u.searchParams.has("publicCountryCatalog") ? publicSubjectCatalogue(locale) : await publicCountryProfile(context, { countryCode: u.searchParams.get("publicCountry"), locale, year, compare: u.searchParams.get("compare"), dimension: u.searchParams.get("dimension") || "identity" });
        return Response.json({ ok: true, ...body }, { headers: { "Cache-Control": "public,max-age=300", "X-Content-Type-Options": "nosniff" } });
      } catch (e) {
        return reply({ ok: false, code: e.message || "PUBLIC_COUNTRY_UNAVAILABLE" }, e.status || 503);
      }
    }
    if (context.env?.PHIOS_SUBJECT_PROFILE_LOCAL !== "true" || !["127.0.0.1", "localhost", "[::1]"].includes(u.hostname)) return reply({ ok: false, code: "SUBJECT_WORKSPACE_NOT_ENABLED" }, 503);
    if (context.request.method !== "GET") return reply({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
    try {
      const identity = await resolveIdentity(context), actorId = identity?.verified ? identity.userId : null;
      const registry = createUniversalRegistry({ db: context.env.RUNTIME_DB }), locale = u.searchParams.get("locale") === "zh-Hans" ? "zh-Hans" : "en", subjectId = u.searchParams.get("subjectId");
      return reply({ ok: true, ...subjectId ? { workspace: await readSubjectWorkspace(registry, subjectId, actorId, { locale }) } : await listSubjectWorkspaces(registry, actorId, { locale }), scope: "LOCAL_CANDIDATE" });
    } catch (e) {
      return reply({ ok: false, code: e.code || "SUBJECT_SERVICE_UNAVAILABLE" }, e.status || 503);
    }
  };
}
var onRequestGet = createSubjectWorkspaceHandler();

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/api/client-intent-route.js
var client_intent_route_exports = {};
__export(client_intent_route_exports, {
  onRequestGet: () => onRequestGet2,
  onRequestPost: () => onRequestPost
});

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/assets/js/pages/civilization-atlas/world-journey-state-r3.js
var WORLD_JOURNEYS = Object.freeze(["now", "connections", "history", "compare"]);
var modes = /* @__PURE__ */ new Set(["landing", ...WORLD_JOURNEYS, "companies"]);
function worldQuestionTarget(value, { selected = false } = {}) {
  const q = String(value || "").normalize("NFKC").trim();
  if (!publicWorldQuestion(q) || !q || q.length > 500 || /自杀|自傷|自伤|suicid|emergency|急救|我的(?:账户|投资|工资|家庭|关系)|my (?:account|portfolio|salary|relationship)/i.test(q)) return null;
  if (/相关文章|阅读.*文章|在哪里读|知识搜索|\b(?:knowledge|article|where.*read)\b/i.test(q)) return null;
  let journey = null, symbol = null, company = null, region = null;
  if (/东方咖啡|東方咖啡|oriental\s*(?:kopi|coffee)|MYX:0338/i.test(q)) {
    journey = "companies";
    symbol = "MYX:0338";
  } else if (/NVIDIA|英伟达|輝達/i.test(q)) {
    journey = "companies";
    company = "NVIDIA";
  } else if (/\bMYX:\d{4}\b/i.test(q)) {
    journey = "companies";
    symbol = q.match(/MYX:\d{4}/i)[0].toUpperCase();
  } else if (/公司|企业研究|企業研究|上市|财报|財報|\b(?:company|companies|corporate|earnings|stock)\b/i.test(q)) journey = "companies";
  else if (!/比较|比較|\bcompar(?:e|ison)\b|历史|歷史|\bhistory\b/i.test(q) && /供应链|供應鏈|网络|網絡|贸易|貿易|港口|交通|城市|产业|產業|\b(?:supply\s*chains?|networks?|trade|ports?|transport|cities|urban|industr(?:y|ies))\b/i.test(q)) journey = "connections";
  else if (/比较|比較|对照|對照|\bcompar(?:e|ison)\b/i.test(q)) journey = "compare";
  else if (/文明|历史|歷史|罗马|羅馬|\b(?:history|civilizations?|rome|roman)\b/i.test(q)) journey = "history";
  else if (/世界|地区|地區|经济|經濟|人口|能源|马来西亚|馬來西亞|\b(?:world|econom(?:y|ic)|population|energy|malaysia|regions?)\b/i.test(q)) journey = /世界正在发生什么|世界正在發生什麼|understand the world|what.*happening.*world/i.test(q) ? "landing" : "now";
  else if (selected) journey = "landing";
  if (!journey) return null;
  const countries = countriesInQuestion(q);
  if (/马来西亚|馬來西亞|malaysia/i.test(q)) region = "MYS";
  else region = countries[0]?.id || null;
  const topic = /经济|econom|gdp/i.test(q) ? "economy" : /人口|population/i.test(q) ? "people" : "connections";
  const year = q.match(/\b(19\d{2}|20\d{2})\b/)?.[1] || "2024";
  const u = new URL("/world/", "https://getphios.com");
  u.searchParams.set("worldJourney", journey);
  if (symbol) u.searchParams.set("symbol", symbol);
  if (company) u.searchParams.set("q", company);
  if (journey === "history" && /罗马|羅馬|\b(?:rome|roman)\b/i.test(q)) u.hash = "v=2&mode=history&pane=cases&case=CA-T06-02";
  if (journey === "connections") u.hash = "v=2&mode=current&pane=map&topic=connections";
  if (journey === "now" && region) u.hash = new URLSearchParams({ v: 2, mode: "current", pane: "data", region, topic, year }).toString();
  if (journey === "history" && region) u.hash = new URLSearchParams({ v: 2, mode: "history", pane: "cases", region, topic }).toString();
  if (journey === "compare" && countries.length >= 2) u.hash = new URLSearchParams({ v: 2, mode: "compare", pane: "places", region: countries[0].id, baseline: countries[1].id, topic, year }).toString();
  return { journey, href: u.pathname + u.search + u.hash, reason: "EXPLICIT_PUBLIC_WORLD_TASK", company, region };
}
function publicWorldQuestion(value) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 500 && !/@|\b\d{7,}\b|胸痛|呼吸困难|不想活|自杀|自傷|自伤|suicid|chest pain|cannot breathe|emergency|急救|我叫|我家|本人|我的(?:账户|投资|工资|家庭|关系|健康|地址|电话|证件|身份证|银行|孩子)|i (?:live|earn)|my (?:account|portfolio|salary|relationship|health|address|phone|email|passport|bank|child|family)|出生|birth.*(?:time|date)/i.test(value);
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/assets/js/customer-entry-topic-map.js
var CUSTOMER_TOPICS = [
  {
    "id": "relationships",
    "name": {
      "zh-Hans": "\u611F\u60C5\u4E0E\u5173\u7CFB",
      "en": "Love & relationships"
    },
    "pattern": "\u7231\u60C5|\u604B\u7231|\u611F\u60C5|\u4F34\u4FA3|\u6C9F\u901A|\u5173\u7CFB|\\b(?:love|relationships?|partner|communication)\\b",
    "query": {
      "zh-Hans": "\u5173\u7CFB\u4E2D\u7684\u6C9F\u901A\u4E0E\u5171\u540C\u751F\u6D3B",
      "en": "Communication and shared life"
    },
    "source": "READING:BOOK-1:expression-media-influence-and-drift",
    "choices": [
      {
        "label": {
          "zh-Hans": "\u4E3A\u4EC0\u4E48\u6C9F\u901A\u4F1A\u5F71\u54CD\u5173\u7CFB\uFF1F",
          "en": "How does communication shape a relationship?"
        },
        "href": "/world/?reading=BOOK-1%3Aexpression-media-influence-and-drift",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "\u600E\u6837\u7406\u89E3\u957F\u671F\u5173\u7CFB\u4E0E\u5BB6\u5EAD\uFF1F",
          "en": "How do long-term relationships and families work?"
        },
        "href": "/world/?reading=BOOK-2%3Along-term-relationships-parenting-and-intergenerational-runtime",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "\u60F3\u4E3B\u52A8\u9009\u62E9\u4E2A\u4EBA\u63A2\u7D22\u65B9\u6CD5\uFF1F",
          "en": "Would you like to choose a personal perspective?"
        },
        "href": "/perspectives/personal/",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      }
    ],
    "sourceTitle": {
      "zh-Hans": "\u8868\u8FBE\u5982\u4F55\u8FDB\u5165\u5173\u7CFB\uFF1A\u80FD\u529B\u3001\u5A92\u4ECB\u3001\u5F71\u54CD\u4E0E\u504F\u79BB",
      "en": "How Expression Enters Relationship: Capacity, Media, Influence, and Drift"
    },
    "sourceVersions": {
      "zh-Hans": {
        "nodeId": "KN-B1-P5-041",
        "version": "1.0.0",
        "sha256": "7aa7642cdd73d14887aafbbfe7b564e1ebe1bcff76d32b7fcc2b324f43704115"
      },
      "en": {
        "nodeId": "KN-B1-P5-041",
        "version": "1.0.0",
        "sha256": "2549747219fbbbca6a3cc3f45a792e09077b5a37558d222965cda0d3ba5cf9b6"
      }
    }
  },
  {
    "id": "work",
    "name": {
      "zh-Hans": "\u5DE5\u4F5C\u4E0E\u65B9\u5411",
      "en": "Work & direction"
    },
    "pattern": "\u5DE5\u4F5C|\u804C\u4E1A|\u804C\u573A|\\b(?:work|career|job|employment)\\b",
    "source": "READING:BOOK-1:from-foundational-questions-to-capabilities-and-runtime-drives",
    "choices": [
      {
        "label": {
          "zh-Hans": "\u804C\u4E1A\u65B9\u5411\u4E0E\u80FD\u529B\uFF1A\u5148\u9605\u8BFB",
          "en": "Direction and capabilities: start reading"
        },
        "href": "/world/?reading=BOOK-1%3Afrom-foundational-questions-to-capabilities-and-runtime-drives",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "\u804C\u573A\u538B\u529B\uFF1A\u6574\u7406\u73B0\u5B9E\u5904\u5883",
          "en": "Workplace pressure: organize your situation"
        },
        "href": "/reality/",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "\u5DE5\u4F5C\u4E0E\u6536\u5165\uFF1A\u67E5\u770B\u8D22\u52A1\u51C6\u5907\u5DE5\u5177",
          "en": "Work and income: explore financial preparation"
        },
        "href": "/professional/financial/",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      }
    ],
    "sourceTitle": {
      "zh-Hans": "\u4ECE\u95EE\u9898\u5230\u80FD\u529B\uFF1A\u73B0\u5B9E\u5982\u4F55\u7EC4\u7EC7\u9700\u6C42\u3001\u8D44\u6E90\u4E0E\u884C\u52A8\u9A71\u52A8\u529B",
      "en": "From Foundational Questions to Capabilities: How Reality Organizes Need, Resources, and Runtime Drive"
    },
    "sourceVersions": {
      "zh-Hans": {
        "nodeId": "KN-B1-P3-006",
        "version": "1.0.0",
        "sha256": "df44d13fc2691e59fa227e0888ec9bf4f5c704e368f59f97efe87c63381522c4"
      },
      "en": {
        "nodeId": "KN-B1-P3-006",
        "version": "1.0.0",
        "sha256": "5e77f7865531ed8168843344822142e5efe4cf66b24732f80d79e0beb4222682"
      }
    }
  },
  {
    "id": "money",
    "name": {
      "zh-Hans": "\u91D1\u94B1\u4E0E\u751F\u6D3B",
      "en": "Money & everyday life"
    },
    "pattern": "\u94B1|\u91D1\u94B1|\u9884\u7B97|\u6536\u652F|\u6536\u5165|\u73B0\u91D1\u6D41|\\b(?:money|budget|income|cash flow|expenses?)\\b|make ends meet",
    "source": "READING:BOOK-2:culture-economic-runtime-value-storage-credit",
    "choices": [
      {
        "label": {
          "zh-Hans": "\u7406\u89E3\u4EF7\u503C\u3001\u4EA4\u6362\u4E0E\u4FE1\u7528",
          "en": "Understand value, exchange and credit"
        },
        "href": "/world/?reading=BOOK-2%3Aculture-economic-runtime-value-storage-credit",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "\u6574\u7406\u6536\u5165\u3001\u652F\u51FA\u4E0E\u51C6\u5907\u8D44\u6599",
          "en": "Organize income, expenses and preparation"
        },
        "href": "/professional/financial/",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "\u9700\u8981\u8D22\u52A1\u65B9\u9762\u7684\u4E13\u4E1A\u652F\u6301\uFF1F",
          "en": "Looking for professional financial support?"
        },
        "href": "/professional/#services",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      }
    ],
    "sourceTitle": {
      "zh-Hans": "\u6587\u5316\u5982\u4F55\u8FDB\u5165\u7ECF\u6D4E\u73B0\u5B9E\uFF1A\u6A21\u56E0\u3001\u5171\u540C\u5B9E\u8DF5\u3001\u4EF7\u503C\u50A8\u5B58\u4E0E\u4FE1\u7528\u5982\u4F55\u8FDE\u63A5",
      "en": "How Culture Becomes Economic Reality: Memes, Shared Practice, Value Storage, and Credit"
    },
    "sourceVersions": {
      "zh-Hans": {
        "nodeId": "KN-B2-P7-013",
        "version": "1.0.0",
        "sha256": "df39d50a98437c786fa2c32b558b34fefb6ad3f0e33ea64671f32fd0b385b094"
      },
      "en": {
        "nodeId": "KN-B2-P7-013",
        "version": "1.0.0",
        "sha256": "9d8c9c4a95a36dab463734c0903049ee781a09387a87227de9239568fd4aa5e7"
      }
    }
  },
  {
    "id": "family",
    "name": {
      "zh-Hans": "\u5BB6\u5EAD\u4E0E\u6210\u957F",
      "en": "Family & growth"
    },
    "pattern": "\u5BB6\u5EAD|\u517B\u80B2|\u5B69\u5B50|\u7236\u6BCD|\u6210\u957F|\\b(?:family|parenting|children|parents|growing up)\\b",
    "source": "READING:BOOK-2:long-term-relationships-parenting-and-intergenerational-runtime",
    "choices": [
      {
        "label": {
          "zh-Hans": "\u5BB6\u5EAD\u4E0E\u517B\u80B2\u600E\u6837\u76F8\u4E92\u5F71\u54CD\uFF1F",
          "en": "How do family life and parenting connect?"
        },
        "href": "/world/?reading=BOOK-2%3Along-term-relationships-parenting-and-intergenerational-runtime",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "\u9605\u8BFB\u4E0D\u540C\u4E2A\u4EBA\u89C6\u89D2",
          "en": "Explore different personal perspectives"
        },
        "href": "/perspectives/",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "\u9700\u8981\u771F\u4EBA\u652F\u6301\uFF1F",
          "en": "Would professional support help?"
        },
        "href": "/professional/#services",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      }
    ],
    "sourceTitle": {
      "zh-Hans": "\u957F\u671F\u5173\u7CFB\u5982\u4F55\u6210\u4E3A\u8DE8\u4E16\u4EE3\u8FD0\u884C\uFF1A\u517B\u80B2\u3001\u513F\u7AE5\u4E0E\u5BB6\u5EAD\u590D\u5236",
      "en": "How Long-Term Relationships Become Intergenerational Runtime: Parenting, Children, and Family Replication"
    },
    "sourceVersions": {
      "zh-Hans": {
        "nodeId": "KN-B2-P6-026",
        "version": "1.0.0",
        "sha256": "282fab8f9bd67a0f6cff064803930d7c53ab6d37645d12298ab37121df5205f3"
      },
      "en": {
        "nodeId": "KN-B2-P6-026",
        "version": "1.0.0",
        "sha256": "20138c4160c2fa5cb2c081a949b91097550ce49146c61d59c02e936579358d94"
      }
    }
  },
  {
    "id": "self",
    "name": {
      "zh-Hans": "\u8BA4\u8BC6\u81EA\u5DF1",
      "en": "Understand yourself"
    },
    "pattern": "\u8BA4\u8BC6\u81EA\u5DF1|\u4E86\u89E3\u81EA\u5DF1|\u6211\u662F\u8C01|\u4E2A\u4EBA\u753B\u50CF|\\b(?:understand myself|know myself|who am i|self understanding)\\b",
    "source": "READING:BOOK-1:from-foundational-questions-to-capabilities-and-runtime-drives",
    "choices": [
      {
        "label": {
          "zh-Hans": "\u8BA4\u8BC6\u9700\u6C42\u3001\u8D44\u6E90\u4E0E\u80FD\u529B",
          "en": "Read about needs, resources and capabilities"
        },
        "href": "/world/?reading=BOOK-1%3Afrom-foundational-questions-to-capabilities-and-runtime-drives",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "\u4E2A\u4EBA\u753B\u50CF\uFF1A\u6574\u7406\u81EA\u9648\u4E0E\u5DF2\u6709\u8BC4\u4F30",
          "en": "Profile: organize self-report and existing assessments"
        },
        "href": "/perspectives/profile/",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "PHI \u6784\u578B\uFF1A\u9605\u8BFB\u72EC\u7ACB\u6A21\u578B\u4E0E\u8F93\u5165\u8BF4\u660E",
          "en": "PHI Configuration: explore the model and its inputs"
        },
        "href": "/perspectives/phi-configuration/",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      }
    ],
    "sourceTitle": {
      "zh-Hans": "\u4ECE\u95EE\u9898\u5230\u80FD\u529B\uFF1A\u73B0\u5B9E\u5982\u4F55\u7EC4\u7EC7\u9700\u6C42\u3001\u8D44\u6E90\u4E0E\u884C\u52A8\u9A71\u52A8\u529B",
      "en": "From Foundational Questions to Capabilities: How Reality Organizes Need, Resources, and Runtime Drive"
    },
    "sourceVersions": {
      "zh-Hans": {
        "nodeId": "KN-B1-P3-006",
        "version": "1.0.0",
        "sha256": "df44d13fc2691e59fa227e0888ec9bf4f5c704e368f59f97efe87c63381522c4"
      },
      "en": {
        "nodeId": "KN-B1-P3-006",
        "version": "1.0.0",
        "sha256": "5e77f7865531ed8168843344822142e5efe4cf66b24732f80d79e0beb4222682"
      }
    }
  },
  {
    "id": "world",
    "name": {
      "zh-Hans": "\u4E16\u754C\u6B63\u5728\u53D1\u751F\u4EC0\u4E48",
      "en": "Understand the world"
    },
    "pattern": "\u9A6C\u6765\u897F\u4E9A|\u7ECF\u6D4E|\u4E16\u754C|\u5730\u533A|\u4EBA\u53E3|\u653F\u7B56|\u80FD\u6E90|\\b(?:malaysia|economy|world|region|population|policy|energy)\\b",
    "source": "READING:BOOK-6:book6-internet-supply-chains-global-cities",
    "choices": [
      {
        "label": {
          "zh-Hans": "\u9009\u62E9\u5730\u533A\uFF0C\u67E5\u770B\u4E8B\u5B9E\u4E0E\u6765\u6E90\u5E74\u4EFD",
          "en": "Choose a region; check facts and observation dates"
        },
        "href": "/world/",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "\u7406\u89E3\u7F51\u7EDC\u3001\u57CE\u5E02\u4E0E\u7ECF\u6D4E\u8054\u7CFB",
          "en": "Read about networks, cities and economic connections"
        },
        "href": "/world/?worldJourney=connections",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      },
      {
        "label": {
          "zh-Hans": "\u641C\u7D22\u66F4\u591A\u516C\u5F00\u77E5\u8BC6",
          "en": "Search more published knowledge"
        },
        "href": "/knowledge/",
        "permission": "PUBLIC_DISCOVERY_EXISTING_TARGET_RULES",
        "availability": "EXISTING_PAGE",
        "fallback": "/knowledge/"
      }
    ],
    "sourceTitle": {
      "zh-Hans": "\u4E92\u8054\u7F51\u3001\u4F9B\u5E94\u94FE\u4E0E\u5168\u7403\u57CE\u5E02\u7F51\u7EDC",
      "en": "The Internet, Global Supply Chains and Global City Networks"
    },
    "sourceVersions": {
      "zh-Hans": {
        "nodeId": "ART-B6-P13-019",
        "version": "1.0.0",
        "sha256": "6f9864f068ac23033d3f566966084b085e5da70aac3be5f9f286dcd2fab3206a"
      },
      "en": {
        "nodeId": "ART-B6-P13-019",
        "version": "1.0.0",
        "sha256": "e1e4d8771c361cc3d9495a8852665c54d3fb00aea3658854afcf230386a22555"
      }
    }
  }
];
function topicRoute(question, locale = "en", selected = null) {
  const wt = worldQuestionTarget(question, { selected: selected === "world" });
  if (wt) {
    const lang = locale === "zh-Hans" ? "zh-Hans" : "en", zh2 = lang === "zh-Hans", generic = wt.journey === "landing", title = zh2 ? "\u4E16\u754C\u63A2\u7D22" : "World exploration";
    const targetURL = new URL(wt.href, "https://getphios.com");
    targetURL.searchParams.set("locale", lang);
    const href = targetURL.pathname + targetURL.search + targetURL.hash;
    return { outcome: generic ? "TOPIC_PATHWAYS" : "MATCHED_CAPABILITY", worldPresentation: wt.journey, topicIds: ["world"], selectedTopic: "world", candidates: [], href, primaryAction: { href, label: zh2 ? "\u5F00\u59CB\u63A2\u7D22\u4E16\u754C" : "Start exploring World" }, clarification: zh2 ? "\u6309\u4F60\u660E\u786E\u9009\u62E9\u7684\u516C\u5F00\u4E3B\u9898\u8FDB\u5165\u5BF9\u5E94\u5DE5\u4F5C\u533A\uFF1B\u6CA1\u6709\u751F\u6210\u6216\u4FDD\u5B58\u4E2A\u4EBA\u8D44\u6599\u3002" : "Open the workspace for your explicit public topic. No personal information has been generated or saved.", navigationActions: [{ href: "/world/?worldJourney=now&locale=" + lang, label: zh2 ? "\u9009\u62E9\u5730\u533A\uFF0C\u67E5\u770B\u4E8B\u5B9E\u4E0E\u6765\u6E90\u5E74\u4EFD" : "Choose a region; check facts and dates" }, { href: "/world/?worldJourney=connections&locale=" + lang, label: zh2 ? "\u7406\u89E3\u7F51\u7EDC\u3001\u57CE\u5E02\u4E0E\u7ECF\u6D4E\u8054\u7CFB" : "Explore networks, cities and economic connections" }, { href: "/knowledge/?locale=" + lang, label: zh2 ? "\u641C\u7D22\u66F4\u591A\u516C\u5F00\u77E5\u8BC6" : "Search more published knowledge" }], providerCalls: 0, generationMode: "DETERMINISTIC", boundaries: { automaticPersistence: false, methodChosenByClientRouter: false } };
  }
  const zh = locale === "zh-Hans", q = String(question || "").normalize("NFKC").trim().replace(/(?:不要|不想|不需要|别推荐|不是问|don't want|do not want|not asking about|not interested in)\s*[^，,。.;；!?！？]*(?=[，,。.;；!?！？]|$)/ig, "");
  if (!q) return null;
  const matches = CUSTOMER_TOPICS.filter((t2) => selected ? t2.id === selected : new RegExp(t2.pattern, "i").test(q));
  if (!matches.length) return null;
  const t = matches[0], choices = matches.length > 1 && !selected ? matches.map((t2) => ({ label: t2.name[locale], labels: t2.name, topicId: t2.id })) : t.choices.map((c) => ({ href: c.href, label: c.label[locale], labels: c.label }));
  if (matches.length === 1 && t.id === "world" && /马来西亚|malaysia/i.test(q)) choices[0].href = "/world/?locale=" + locale + "#v=2&region=MYS&topic=economy";
  return { outcome: "TOPIC_PATHWAYS", candidates: [], topicIds: matches.map((t2) => t2.id), selectedTopic: t.id, clarification: matches.length > 1 && !selected ? zh ? "\u4F60\u63D0\u5230\u4E86\u51E0\u4E2A\u65B9\u9762\uFF0C\u60F3\u5148\u63A2\u7D22\u54EA\u4E00\u4E2A\uFF1F" : "You mentioned several areas. Which would you like to explore first?" : zh ? "\u5148\u9009\u4E00\u4E2A\u65B9\u5411\u3002\u8FD9\u91CC\u63D0\u4F9B\u76F8\u5173\u9605\u8BFB\u548C\u5165\u53E3\uFF0C\u4E0D\u4F1A\u5206\u6790\u4F60\u7684\u4E2A\u4EBA\u72B6\u51B5\u3002" : "Choose a direction. These are related readings and entrances, not an assessment of your situation.", navigationActions: choices, sourceTitle: t.sourceTitle[locale], providerCalls: 0, providerInvoked: false, generationMode: "DETERMINISTIC", href: choices[0].href || "/knowledge/", boundaries: { methodChosenByClientRouter: false, automaticPersistence: false } };
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/assets/js/ask-entry-capabilities.js
var ASK_CAPABILITIES = {
  "version": "PHI-OS-ASK-ENTRY-R1-v2",
  "generatedFrom": [
    "content/product-convergence-r1/registries/canonical-product-domain-registry-v1.json",
    "content/customer-experience-rebuild/registries/cx-r12r4-method-availability-registry-v1.json"
  ],
  "capabilities": [
    {
      "capabilityId": "PERSONAL_METHODS",
      "displayLabels": {
        "en": "Personal methods",
        "zh-Hans": "\u4E2A\u4EBA\u65B9\u6CD5"
      },
      "canonicalRoute": "/perspectives/personal/",
      "routeOwner": "assets/customer-ui/js/surfaces/personal-reality.js",
      "canonicalDomainRefs": [
        "PERSONAL_REALITY"
      ],
      "mappingGap": null,
      "verifiedAt": "2026-10-11T02:19:12.521Z",
      "canonicalDomainOwner": "PPR_CURRENT_SHARED_RUNTIME",
      "availability": "DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER",
      "availabilitySource": "content/customer-experience-rebuild/registries/cx-r12r4-method-availability-registry-v1.json",
      "inputRequirements": [
        "Birth date; time and place as required; consent"
      ],
      "sourceRequirements": [
        "Existing registered owner; no client-provided authority"
      ],
      "consentRequirement": "EXPLICIT_WHERE_PERSONAL",
      "entitlementRequirement": "EXISTING_SERVER_OWNER",
      "executionClass": "ENTRY",
      "outputKinds": [
        "Deterministic method reading"
      ],
      "capabilityVersion": "R1-v2",
      "indexVersion": "PHI-OS-ASK-ENTRY-R1-v2"
    },
    {
      "capabilityId": "RELATIONSHIP",
      "displayLabels": {
        "en": "Relationships",
        "zh-Hans": "\u5173\u7CFB"
      },
      "canonicalRoute": "/perspectives/relationship/",
      "routeOwner": "functions/personal-reading/relationship/",
      "canonicalDomainRefs": [
        "RELATIONSHIP_REALITY"
      ],
      "mappingGap": null,
      "verifiedAt": "2026-10-11T02:19:12.523Z",
      "canonicalDomainOwner": "REL_W0_W8",
      "availability": "DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER",
      "availabilitySource": "content/product-convergence-r1/registries/canonical-product-domain-registry-v1.json",
      "inputRequirements": [
        "Purpose; independently sourced participant information; applicable consent"
      ],
      "sourceRequirements": [
        "Existing registered owner; no client-provided authority"
      ],
      "consentRequirement": "EXPLICIT_WHERE_PERSONAL",
      "entitlementRequirement": "EXISTING_SERVER_OWNER",
      "executionClass": "ENTRY",
      "outputKinds": [
        "Bounded relationship reading"
      ],
      "capabilityVersion": "R1-v2",
      "indexVersion": "PHI-OS-ASK-ENTRY-R1-v2"
    },
    {
      "capabilityId": "FINANCIAL",
      "displayLabels": {
        "en": "Financial reality",
        "zh-Hans": "\u8D22\u52A1\u73B0\u5B9E"
      },
      "canonicalRoute": "/professional/financial/",
      "routeOwner": "functions/professional/financial/",
      "canonicalDomainRefs": [
        "FINANCIAL_REALITY"
      ],
      "mappingGap": null,
      "verifiedAt": "2026-10-11T02:19:12.523Z",
      "canonicalDomainOwner": "FDR_FCR_FAR_HFP_PFR",
      "availability": "DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER",
      "availabilitySource": "content/product-convergence-r1/registries/canonical-product-domain-registry-v1.json",
      "inputRequirements": [
        "Income, expenses and selected financial records; consent"
      ],
      "sourceRequirements": [
        "Existing registered owner; no client-provided authority"
      ],
      "consentRequirement": "EXPLICIT_WHERE_PERSONAL",
      "entitlementRequirement": "EXISTING_SERVER_OWNER",
      "executionClass": "ENTRY",
      "outputKinds": [
        "Financial organization and existing calculators"
      ],
      "capabilityVersion": "R1-v2",
      "indexVersion": "PHI-OS-ASK-ENTRY-R1-v2"
    },
    {
      "capabilityId": "WORLD",
      "displayLabels": {
        "en": "World",
        "zh-Hans": "\u4E16\u754C"
      },
      "canonicalRoute": "/world/",
      "routeOwner": "assets/js/pages/world.js",
      "canonicalDomainRefs": [
        "WORLD_REALITY"
      ],
      "mappingGap": null,
      "verifiedAt": "2026-10-11T02:19:12.523Z",
      "canonicalDomainOwner": "CURRENT_WEB_AUTHORITY",
      "availability": "DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER",
      "availabilitySource": "content/product-convergence-r1/registries/canonical-product-domain-registry-v1.json",
      "inputRequirements": [
        "Public object or region; dates for current questions"
      ],
      "sourceRequirements": [
        "Existing registered owner; no client-provided authority"
      ],
      "consentRequirement": "EXPLICIT_WHERE_PERSONAL",
      "entitlementRequirement": "EXISTING_SERVER_OWNER",
      "executionClass": "ENTRY",
      "outputKinds": [
        "Historical Atlas and scoped current dossiers"
      ],
      "capabilityVersion": "R1-v2",
      "indexVersion": "PHI-OS-ASK-ENTRY-R1-v2"
    },
    {
      "capabilityId": "HEALTH_CARE",
      "displayLabels": {
        "en": "Health and care",
        "zh-Hans": "\u5065\u5EB7\u4E0E\u7167\u62A4"
      },
      "canonicalRoute": "/health-reality.html",
      "routeOwner": "functions/health/health-reality-runtime.js",
      "canonicalDomainRefs": [],
      "mappingGap": "No product-domain owner with this exact name; customer group is not a new canonical domain.",
      "verifiedAt": "2026-10-11T02:19:12.523Z",
      "canonicalDomainOwner": "functions/health/health-reality-runtime.js",
      "availability": "DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER",
      "availabilitySource": "content/product-convergence-r1/registries/canonical-product-domain-registry-v1.json",
      "inputRequirements": [
        "Situation, timing and changes; no diagnosis"
      ],
      "sourceRequirements": [
        "Existing registered owner; no client-provided authority"
      ],
      "consentRequirement": "EXPLICIT_WHERE_PERSONAL",
      "entitlementRequirement": "EXISTING_SERVER_OWNER",
      "executionClass": "ENTRY",
      "outputKinds": [
        "Health organization and safety-first care routing"
      ],
      "capabilityVersion": "R1-v2",
      "indexVersion": "PHI-OS-ASK-ENTRY-R1-v2"
    },
    {
      "capabilityId": "PROFILE",
      "displayLabels": {
        "en": "Profile",
        "zh-Hans": "\u4E2A\u4EBA\u753B\u50CF"
      },
      "canonicalRoute": "/perspectives/profile/",
      "routeOwner": "functions/profile/profile-production-authority.js",
      "canonicalDomainRefs": [
        "PERSONAL_REALITY"
      ],
      "mappingGap": null,
      "verifiedAt": "2026-10-11T02:19:12.523Z",
      "canonicalDomainOwner": "PPR_CURRENT_SHARED_RUNTIME",
      "availability": "DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER",
      "availabilitySource": "content/product-convergence-r1/registries/canonical-product-domain-registry-v1.json",
      "inputRequirements": [
        "Self-report or eligible external/task evidence; consent"
      ],
      "sourceRequirements": [
        "Existing registered owner; no client-provided authority"
      ],
      "consentRequirement": "EXPLICIT_WHERE_PERSONAL",
      "entitlementRequirement": "EXISTING_SERVER_OWNER",
      "executionClass": "ENTRY",
      "outputKinds": [
        "Personal Evidence; existing bilingual report entitlement"
      ],
      "capabilityVersion": "R1-v2",
      "indexVersion": "PHI-OS-ASK-ENTRY-R1-v2"
    },
    {
      "capabilityId": "REFLECTION",
      "displayLabels": {
        "en": "Reflection",
        "zh-Hans": "\u95EE\u9898\u4E0E\u53CD\u601D"
      },
      "canonicalRoute": "/perspectives/tarot/",
      "routeOwner": "functions/core-method-runtime/tarot-runtime-v2.js",
      "canonicalDomainRefs": [
        "PERSONAL_REALITY"
      ],
      "mappingGap": null,
      "verifiedAt": "2026-10-11T02:19:12.523Z",
      "canonicalDomainOwner": "PPR_CURRENT_SHARED_RUNTIME",
      "availability": "DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER",
      "availabilitySource": "content/product-convergence-r1/registries/canonical-product-domain-registry-v1.json",
      "inputRequirements": [
        "Question; explicit Tarot draw or I Ching cast"
      ],
      "sourceRequirements": [
        "Existing registered owner; no client-provided authority"
      ],
      "consentRequirement": "EXPLICIT_WHERE_PERSONAL",
      "entitlementRequirement": "EXISTING_SERVER_OWNER",
      "executionClass": "ENTRY",
      "outputKinds": [
        "Separate deterministic symbolic reading"
      ],
      "capabilityVersion": "R1-v2",
      "indexVersion": "PHI-OS-ASK-ENTRY-R1-v2"
    },
    {
      "capabilityId": "PHI_CONFIGURATION",
      "displayLabels": {
        "en": "PHI Configuration",
        "zh-Hans": "PHI \u6784\u578B"
      },
      "canonicalRoute": "/perspectives/phi-configuration/",
      "routeOwner": "assets/customer-ui/js/surfaces/personal-reality.js",
      "canonicalDomainRefs": [
        "PERSONAL_REALITY"
      ],
      "mappingGap": null,
      "verifiedAt": "2026-10-11T02:19:12.523Z",
      "canonicalDomainOwner": "PPR_CURRENT_SHARED_RUNTIME",
      "availability": "DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER",
      "availabilitySource": "content/customer-experience-rebuild/registries/cx-r12r4-method-availability-registry-v1.json",
      "inputRequirements": [
        "Birth date, confirmed time/place; consent"
      ],
      "sourceRequirements": [
        "Existing registered owner; no client-provided authority"
      ],
      "consentRequirement": "EXPLICIT_WHERE_PERSONAL",
      "entitlementRequirement": "EXISTING_SERVER_OWNER",
      "executionClass": "ENTRY",
      "outputKinds": [
        "Independent PHI configuration model"
      ],
      "capabilityVersion": "R1-v2",
      "indexVersion": "PHI-OS-ASK-ENTRY-R1-v2"
    },
    {
      "capabilityId": "KNOWLEDGE",
      "displayLabels": {
        "en": "Read knowledge",
        "zh-Hans": "\u9605\u8BFB\u77E5\u8BC6"
      },
      "canonicalRoute": "/knowledge/",
      "routeOwner": "functions/_lib/knowledge-answer-composition.js",
      "canonicalDomainRefs": [
        "KNOWLEDGE"
      ],
      "mappingGap": null,
      "verifiedAt": "2026-10-11T02:19:12.523Z",
      "canonicalDomainOwner": "CANONICAL_KNOWLEDGE",
      "availability": "DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER",
      "availabilitySource": "content/product-convergence-r1/registries/canonical-product-domain-registry-v1.json",
      "inputRequirements": [
        "Question or public source reference"
      ],
      "sourceRequirements": [
        "Existing registered owner; no client-provided authority"
      ],
      "consentRequirement": "EXPLICIT_WHERE_PERSONAL",
      "entitlementRequirement": "EXISTING_SERVER_OWNER",
      "executionClass": "ENTRY",
      "outputKinds": [
        "Source-bound deterministic excerpts and reading paths"
      ],
      "capabilityVersion": "R1-v2",
      "indexVersion": "PHI-OS-ASK-ENTRY-R1-v2"
    },
    {
      "capabilityId": "PRODUCT_HELP",
      "displayLabels": {
        "en": "Account and report help",
        "zh-Hans": "\u8D26\u6237\u4E0E\u62A5\u544A\u5E2E\u52A9"
      },
      "canonicalRoute": "/account/",
      "routeOwner": "functions/account/",
      "canonicalDomainRefs": [
        "MY_REALITY"
      ],
      "mappingGap": null,
      "verifiedAt": "2026-10-11T02:19:12.523Z",
      "canonicalDomainOwner": "RMO",
      "availability": "DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER",
      "availabilitySource": "content/product-convergence-r1/registries/canonical-product-domain-registry-v1.json",
      "inputRequirements": [
        "Sign in to retrieve private reports or orders"
      ],
      "sourceRequirements": [
        "Existing registered owner; no client-provided authority"
      ],
      "consentRequirement": "EXPLICIT_WHERE_PERSONAL",
      "entitlementRequirement": "EXISTING_SERVER_OWNER",
      "executionClass": "ENTRY",
      "outputKinds": [
        "Authorized account retrieval; no new report generation"
      ],
      "capabilityVersion": "R1-v2",
      "indexVersion": "PHI-OS-ASK-ENTRY-R1-v2"
    },
    {
      "capabilityId": "PROFESSIONAL",
      "displayLabels": {
        "en": "Professional assistance",
        "zh-Hans": "\u4E13\u4E1A\u534F\u52A9"
      },
      "canonicalRoute": "/professional/",
      "routeOwner": "functions/professional/",
      "canonicalDomainRefs": [
        "PROFESSIONAL"
      ],
      "mappingGap": null,
      "verifiedAt": "2026-10-11T02:19:12.523Z",
      "canonicalDomainOwner": "PR_PFR",
      "availability": "DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER",
      "availabilitySource": "content/product-convergence-r1/registries/canonical-product-domain-registry-v1.json",
      "inputRequirements": [
        "Selected service and explicit consent"
      ],
      "sourceRequirements": [
        "Existing registered owner; no client-provided authority"
      ],
      "consentRequirement": "EXPLICIT_WHERE_PERSONAL",
      "entitlementRequirement": "EXISTING_SERVER_OWNER",
      "executionClass": "ENTRY",
      "outputKinds": [
        "Existing service/application route"
      ],
      "capabilityVersion": "R1-v2",
      "indexVersion": "PHI-OS-ASK-ENTRY-R1-v2"
    },
    {
      "capabilityId": "ACADEMY",
      "displayLabels": {
        "en": "Academy",
        "zh-Hans": "\u5B66\u4E60\u8BFE\u7A0B"
      },
      "canonicalRoute": "/academy/",
      "routeOwner": "functions/api/academy-navigation.js",
      "canonicalDomainRefs": [
        "KNOWLEDGE"
      ],
      "mappingGap": null,
      "verifiedAt": "2026-10-11T02:19:12.523Z",
      "canonicalDomainOwner": "CANONICAL_KNOWLEDGE",
      "availability": "DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER",
      "availabilitySource": "content/product-convergence-r1/registries/canonical-product-domain-registry-v1.json",
      "inputRequirements": [
        "Selected public topic; playback requires a real video asset"
      ],
      "sourceRequirements": [
        "Existing registered owner; no client-provided authority"
      ],
      "consentRequirement": "EXPLICIT_WHERE_PERSONAL",
      "entitlementRequirement": "EXISTING_SERVER_OWNER",
      "executionClass": "ENTRY",
      "outputKinds": [
        "Free public Navigation catalog; existing Method video access rules"
      ],
      "capabilityVersion": "R1-v2",
      "indexVersion": "PHI-OS-ASK-ENTRY-R1-v2"
    },
    {
      "capabilityId": "BOOKS",
      "displayLabels": {
        "en": "Books",
        "zh-Hans": "\u9605\u8BFB\u4E66\u7C4D"
      },
      "canonicalRoute": "/books/",
      "routeOwner": "functions/_lib/book-vii-published-admission.js",
      "canonicalDomainRefs": [
        "KNOWLEDGE"
      ],
      "mappingGap": null,
      "verifiedAt": "2026-10-11T02:19:12.523Z",
      "canonicalDomainOwner": "CANONICAL_KNOWLEDGE",
      "availability": "DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER",
      "availabilitySource": "content/product-convergence-r1/registries/canonical-product-domain-registry-v1.json",
      "inputRequirements": [
        "Published book/article identity; full books retain existing ownership rules"
      ],
      "sourceRequirements": [
        "Existing registered owner; no client-provided authority"
      ],
      "consentRequirement": "EXPLICIT_WHERE_PERSONAL",
      "entitlementRequirement": "EXISTING_SERVER_OWNER",
      "executionClass": "ENTRY",
      "outputKinds": [
        "Published reading and existing book catalog; Book VIII not for public sale"
      ],
      "capabilityVersion": "R1-v2",
      "indexVersion": "PHI-OS-ASK-ENTRY-R1-v2"
    },
    {
      "capabilityId": "APPOINTMENT",
      "displayLabels": {
        "en": "Appointment requests",
        "zh-Hans": "\u9884\u7EA6\u7533\u8BF7"
      },
      "canonicalRoute": "/professional/appointments/",
      "routeOwner": "functions/professional/appointments/appointment-request-store.js",
      "canonicalDomainRefs": [
        "PROFESSIONAL"
      ],
      "mappingGap": null,
      "verifiedAt": "2026-10-11T02:19:12.523Z",
      "canonicalDomainOwner": "PR_PFR",
      "availability": "DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER",
      "availabilitySource": "content/product-convergence-r1/registries/canonical-product-domain-registry-v1.json",
      "inputRequirements": [
        "Selected service, necessary information and explicit consent"
      ],
      "sourceRequirements": [
        "Existing registered owner; no client-provided authority"
      ],
      "consentRequirement": "EXPLICIT_WHERE_PERSONAL",
      "entitlementRequirement": "EXISTING_SERVER_OWNER",
      "executionClass": "ENTRY",
      "outputKinds": [
        "Unscheduled REQUESTED application; no automatic confirmation"
      ],
      "capabilityVersion": "R1-v2",
      "indexVersion": "PHI-OS-ASK-ENTRY-R1-v2"
    },
    {
      "capabilityId": "WILL",
      "displayLabels": {
        "en": "Will information draft",
        "zh-Hans": "\u9057\u5631\u8D44\u6599\u6574\u7406"
      },
      "canonicalRoute": "/professional/financial/#estate-planning",
      "routeOwner": "functions/account/will-information-delivery.js",
      "canonicalDomainRefs": [
        "FINANCIAL_REALITY"
      ],
      "mappingGap": null,
      "verifiedAt": "2026-10-11T02:19:12.523Z",
      "canonicalDomainOwner": "FDR_FCR_FAR_HFP_PFR",
      "availability": "DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER",
      "availabilitySource": "content/product-convergence-r1/registries/canonical-product-domain-registry-v1.json",
      "inputRequirements": [
        "Jurisdiction, information and save/delivery consent"
      ],
      "sourceRequirements": [
        "Existing registered owner; no client-provided authority"
      ],
      "consentRequirement": "EXPLICIT_WHERE_PERSONAL",
      "entitlementRequirement": "EXISTING_SERVER_OWNER",
      "executionClass": "ENTRY",
      "outputKinds": [
        "Existing informational draft; not a legally executed Will"
      ],
      "capabilityVersion": "R1-v2",
      "indexVersion": "PHI-OS-ASK-ENTRY-R1-v2"
    },
    {
      "capabilityId": "CONTINUITY",
      "displayLabels": {
        "en": "Continuity membership",
        "zh-Hans": "\u6301\u7EED\u4F1A\u5458"
      },
      "canonicalRoute": "/membership.html",
      "routeOwner": "functions/personal-reading/continuity/continuity-commercial-authority.js",
      "canonicalDomainRefs": [
        "MY_REALITY"
      ],
      "mappingGap": null,
      "verifiedAt": "2026-10-11T02:19:12.523Z",
      "canonicalDomainOwner": "RMO",
      "availability": "DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER",
      "availabilitySource": "content/product-convergence-r1/registries/canonical-product-domain-registry-v1.json",
      "inputRequirements": [
        "Established material; existing subscription and quota owner"
      ],
      "sourceRequirements": [
        "Existing registered owner; no client-provided authority"
      ],
      "consentRequirement": "EXPLICIT_WHERE_PERSONAL",
      "entitlementRequirement": "EXISTING_SERVER_OWNER",
      "executionClass": "ENTRY",
      "outputKinds": [
        "Ongoing follow-up; no monthly regeneration or automatic enrollment"
      ],
      "capabilityVersion": "R1-v2",
      "indexVersion": "PHI-OS-ASK-ENTRY-R1-v2"
    },
    {
      "capabilityId": "ABOUT",
      "displayLabels": {
        "en": "About PHI OS",
        "zh-Hans": "\u5173\u4E8E PHI OS"
      },
      "canonicalRoute": "/about/founder/#how",
      "routeOwner": "about/founder/index.html",
      "canonicalDomainRefs": [
        "KNOWLEDGE"
      ],
      "mappingGap": null,
      "verifiedAt": "2026-10-11T02:19:12.523Z",
      "canonicalDomainOwner": "CANONICAL_KNOWLEDGE",
      "availability": "DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER",
      "availabilitySource": "content/product-convergence-r1/registries/canonical-product-domain-registry-v1.json",
      "inputRequirements": [
        "Public platform introduction"
      ],
      "sourceRequirements": [
        "Existing registered owner; no client-provided authority"
      ],
      "consentRequirement": "EXPLICIT_WHERE_PERSONAL",
      "entitlementRequirement": "EXISTING_SERVER_OWNER",
      "executionClass": "ENTRY",
      "outputKinds": [
        "Existing platform/founder copy and real feature entrances"
      ],
      "capabilityVersion": "R1-v2",
      "indexVersion": "PHI-OS-ASK-ENTRY-R1-v2"
    },
    {
      "capabilityId": "THESIS",
      "displayLabels": {
        "en": "Thesis",
        "zh-Hans": "\u6838\u5FC3\u8BBA\u8FF0"
      },
      "canonicalRoute": "/thesis.html",
      "routeOwner": "thesis.html",
      "canonicalDomainRefs": [
        "KNOWLEDGE"
      ],
      "mappingGap": null,
      "verifiedAt": "2026-10-11T02:19:12.523Z",
      "canonicalDomainOwner": "CANONICAL_KNOWLEDGE",
      "availability": "DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER",
      "availabilitySource": "content/product-convergence-r1/registries/canonical-product-domain-registry-v1.json",
      "inputRequirements": [
        "Published thesis and available PDF projection"
      ],
      "sourceRequirements": [
        "Existing registered owner; no client-provided authority"
      ],
      "consentRequirement": "EXPLICIT_WHERE_PERSONAL",
      "entitlementRequirement": "EXISTING_SERVER_OWNER",
      "executionClass": "ENTRY",
      "outputKinds": [
        "Existing research reading/download; no invented PDF"
      ],
      "capabilityVersion": "R1-v2",
      "indexVersion": "PHI-OS-ASK-ENTRY-R1-v2"
    },
    {
      "capabilityId": "REALITY",
      "displayLabels": {
        "en": "Continue My Reality",
        "zh-Hans": "\u7EE7\u7EED\u6211\u7684\u73B0\u5B9E"
      },
      "canonicalRoute": "/reality/",
      "routeOwner": "functions/api/customer-contextual-ask.js",
      "canonicalDomainRefs": [
        "MY_REALITY"
      ],
      "mappingGap": null,
      "verifiedAt": "2026-10-11T02:19:12.523Z",
      "canonicalDomainOwner": "RMO",
      "availability": "DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER",
      "availabilitySource": "content/product-convergence-r1/registries/canonical-product-domain-registry-v1.json",
      "inputRequirements": [
        "Explicitly selected authorized records or current self-report"
      ],
      "sourceRequirements": [
        "Existing registered owner; no client-provided authority"
      ],
      "consentRequirement": "EXPLICIT_WHERE_PERSONAL",
      "entitlementRequirement": "EXISTING_SERVER_OWNER",
      "executionClass": "ENTRY",
      "outputKinds": [
        "Existing Reality and entitled contextual follow-up"
      ],
      "capabilityVersion": "R1-v2",
      "indexVersion": "PHI-OS-ASK-ENTRY-R1-v2"
    }
  ],
  "methods": [
    {
      "methodId": "ASTROLOGY",
      "formValue": "astrology",
      "inputMode": "BIRTH_BASED",
      "experienceState": "AVAILABLE_IN_THIS_READING",
      "label": {
        "en": "Astrology",
        "zh-Hans": "\u5360\u661F"
      }
    },
    {
      "methodId": "BAZI",
      "formValue": "bazi",
      "inputMode": "BIRTH_BASED",
      "experienceState": "AVAILABLE_IN_THIS_READING",
      "label": {
        "en": "BaZi",
        "zh-Hans": "\u516B\u5B57"
      }
    },
    {
      "methodId": "NUMEROLOGY",
      "formValue": "numeric",
      "inputMode": "BIRTH_BASED",
      "experienceState": "AVAILABLE_IN_THIS_READING",
      "label": {
        "en": "Numerology",
        "zh-Hans": "\u6570\u5B57\u5B66"
      }
    },
    {
      "methodId": "ZI_WEI_DOU_SHU",
      "formValue": "ziwei",
      "inputMode": "BIRTH_BASED",
      "experienceState": "AVAILABLE_IN_THIS_READING",
      "label": {
        "en": "Zi Wei",
        "zh-Hans": "\u7D2B\u5FAE\u6597\u6570"
      }
    },
    {
      "methodId": "HUMAN_DESIGN",
      "inputMode": "BIRTH_BASED",
      "experienceState": "NOT_CURRENTLY_AVAILABLE",
      "label": {
        "en": "Human Design",
        "zh-Hans": "\u4EBA\u7C7B\u56FE"
      }
    },
    {
      "methodId": "I_CHING",
      "inputMode": "QUESTION_CONTEXT",
      "experienceState": "SEPARATE_EXPERIENCE",
      "label": {
        "en": "I Ching",
        "zh-Hans": "\u6613\u7ECF"
      }
    },
    {
      "methodId": "TAROT",
      "inputMode": "QUESTION_CONTEXT",
      "experienceState": "SEPARATE_EXPERIENCE",
      "label": {
        "en": "Tarot",
        "zh-Hans": "\u5854\u7F57"
      }
    },
    {
      "methodId": "BZR",
      "formValue": "bazi",
      "label": {
        "en": "BaZi",
        "zh-Hans": "\u516B\u5B57"
      }
    },
    {
      "methodId": "ZWR",
      "formValue": "ziwei",
      "label": {
        "en": "Zi Wei",
        "zh-Hans": "\u7D2B\u5FAE\u6597\u6570"
      }
    },
    {
      "methodId": "AST",
      "formValue": "astrology",
      "label": {
        "en": "Astrology",
        "zh-Hans": "\u5360\u661F"
      }
    },
    {
      "methodId": "NUM",
      "formValue": "numeric",
      "label": {
        "en": "Numerology",
        "zh-Hans": "\u6570\u5B57\u5B66"
      }
    },
    {
      "methodId": "PROFILE",
      "formValue": null,
      "label": {
        "en": "PHI OS Profile",
        "zh-Hans": "PHI OS Profile"
      }
    },
    {
      "methodId": "ECR",
      "formValue": "ecr",
      "label": {
        "en": "PHI Configuration",
        "zh-Hans": "PHI \u6784\u578B"
      }
    },
    {
      "methodId": "HD",
      "formValue": null,
      "label": {
        "en": "Human Design",
        "zh-Hans": "\u4EBA\u7C7B\u56FE"
      }
    },
    {
      "methodId": "CROSS",
      "formValue": null,
      "label": {
        "en": "Cross Perspective",
        "zh-Hans": "\u8DE8\u65B9\u6CD5\u89C6\u89D2"
      }
    }
  ]
};

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/health/health-reality-runtime.js
var CARE_RANK = Object.freeze({
  INFORMATIONAL: 0,
  ROUTINE_REVIEW: 1,
  PROMPT_MEDICAL_REVIEW: 2,
  URGENT_EVALUATION: 3,
  EMERGENCY: 4
});
var text = (value) => String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ");
var EMERGENCY_PATTERNS = [
  // Same chest-pain + breathing-difficulty signal as the existing Chinese rule;
  // an English severity adjective must not be a prerequisite for safety routing.
  /chest pain.*(?:struggl|difficulty|can't|cannot).*breath/i,
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
  const q = text(typeof input === "string" ? input : input.question);
  const healthTerms = /\b(health|symptom|pain|tired|fatigue|sleep|heart|blood|lab|doctor|medication|medicine|diagnos|breath|dizzy|dizziness|fever|hba1c|a1c|glucose|cholesterol|ldl|hdl|triglyceride|hemoglobin|haemoglobin|creatinine|egfr|blood pressure|heart rate)\b|健康|症状|疼|痛|疲劳|累|睡眠|心跳|血压|血糖|糖化血红蛋白|胆固醇|化验|检查|医生|药|呼吸|头晕|发烧/i;
  if (!healthTerms.test(q)) return "NON_HEALTH";
  if (/what does|what is|mean|reference range|是什么意思|什么是|参考范围/i.test(q)) return "HEALTH_INFORMATION";
  if (/report|lab|test result|scan|报告|化验|检验|影像/i.test(q)) return "HEALTH_DOCUMENT_UNDERSTANDING";
  if (/timeline|history|when it started|时间线|病程|什么时候开始/i.test(q)) return "HEALTH_TIMELINE";
  if (EMERGENCY_PATTERNS.some((p) => p.test(q)) || URGENT_PATTERNS.some((p) => p.test(q)) || /what should i do|怎么办|要不要去急诊/i.test(q)) return "HEALTH_CARE_NAVIGATION";
  return "HEALTH_REALITY";
}
function routeHealthSafety(input = {}) {
  const q = text(typeof input === "string" ? input : input.question);
  let careState = "INFORMATIONAL";
  const matchedSignals = [];
  const promote = (state, signal) => {
    if (CARE_RANK[state] > CARE_RANK[careState]) careState = state;
    if (signal) matchedSignals.push(signal);
  };
  if (EMERGENCY_PATTERNS.some((p) => p.test(q))) promote("EMERGENCY", "HIGH_RISK_EMERGENCY_PATTERN");
  else if (URGENT_PATTERNS.some((p) => p.test(q))) promote("URGENT_EVALUATION", "URGENT_PATTERN");
  else if (PROMPT_PATTERNS.some((p) => p.test(q))) promote("PROMPT_MEDICAL_REVIEW", "PERSISTENT_OR_WORSENING_PATTERN");
  else if (classifyHealthIntent({ question: q }) !== "NON_HEALTH") promote("ROUTINE_REVIEW", "HEALTH_CONCERN_PRESENT");
  return {
    schemaVersion: "PHI-OS-HRX-SAFETY-ROUTING-v1.0.0",
    careState,
    matchedSignals,
    safetyRoutingOnly: true,
    diagnosisEstablished: false,
    diseaseRuledOut: false,
    exhaustiveTriageClaimed: false
  };
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/public/client-intent-router.js
var rules = [
  ["PHI_CONFIGURATION", /phi\s*(?:configuration|构型)|构型/i, 6],
  ["PROFILE", /profile|个人画像|自陈|测评/i, 5],
  ["ACADEMY", /academy|learning|course|tutorial|video lesson|learn|study|学院|学习|课程|视频教学/i, 6],
  ["BOOKS", /books|book\s*(?:[1-7]|i{1,3}|iv|v|vi|vii)\b|book catalog|书籍|书册|书库|阅读第|读第/i, 6],
  ["WILL", /遗嘱|estate planning|\b(?:will (?:draft|writing|information)|(?:prepare|write|draft|executed|a|the|my|signed) (?:a |my )?will)\b/i, 6],
  ["CONTINUITY", /continuity|membership|subscription|quota|会员|订阅|额度/i, 6],
  ["THESIS", /thesis|research\s*(?:paper|pdf)|核心论述|论文|研究 PDF/i, 6],
  ["PROFESSIONAL", /professional (?:assistance|service|help)|consultation|专业(?:协助|服务|帮助)|咨询服务/i, 5],
  ["PERSONAL_METHODS", /八字|四柱|紫微|占星|人类图|数字学|bazi|four pillars|zi\s*wei|astrology|human design|numerology|birth chart|personal methods|个人方法/i, 5],
  ["RELATIONSHIP", /关系|丈夫|伴侣|夫妻|relationship|husband|wife|partner|spouse/i, 3],
  ["FINANCIAL", /财务|收支|现金流|收入|支出|预算|financial|finances|cash flow|income|expense|budget/i, 3],
  ["WORLD", /文明|重组|世界|政策|atlas|civilization|reconfiguration|world|policy/i, 3],
  ["HEALTH_CARE", /健康|照护|症状|\b(?:health|care|symptoms?)\b/i, 3],
  ["REFLECTION", /塔罗|易经|问题与反思|反思|reflection|tarot|i ching/i, 5],
  ["REALITY", /报告.*(?:不一致|经历)|我的现实|继续现实|my reality|report.*(?:experience|disagree|different)/i, 6]
];
var aliases = { PERSONAL: "PERSONAL_METHODS", FINANCIAL: "FINANCIAL", REALITY: "REALITY", JOURNEY: "REALITY", LEARN: "KNOWLEDGE", WORK: "PROFESSIONAL", KNOWLEDGE: "KNOWLEDGE" };
var caps = ASK_CAPABILITIES.capabilities;
var methodMentions = (q) => [["BAZI", /八字|四柱|bazi|four pillars/i], ["ASTROLOGY", /占星|astrology/i], ["ZI_WEI_DOU_SHU", /紫微|zi\s*wei/i], ["NUMEROLOGY", /数字学|numerology/i], ["HUMAN_DESIGN", /人类图|human design/i], ["ECR", /构型|phi configuration/i], ["TAROT", /塔罗|tarot/i], ["I_CHING", /易经|i ching/i]].filter(([, pattern]) => pattern.test(q)).map(([id2]) => id2);
var routingText = (raw) => raw.replace(/(?:不想|不要|不需要|不感兴趣|不喜欢|别推荐|不是(?:问|要了解)|don't want|do not want|not interested in|not asking about|do not recommend|don't recommend|no need for)\s*[\s\S]*?(?=[，,。.;；!?！？]|\bbut\b|\binstead\b|而是|但是|但|只想|$)/ig, "").replace(/(?:[“"][^”"]*[”"]|‘[^’]*’)/g, "");
var methodTargets = { BAZI: ["PERSONAL_METHODS", "/perspectives/personal/?method=bazi#personal-input", "BaZi", "\u516B\u5B57"], ASTROLOGY: ["PERSONAL_METHODS", "/perspectives/personal/?method=astrology#personal-input", "Astrology", "\u5360\u661F"], ZI_WEI_DOU_SHU: ["PERSONAL_METHODS", "/perspectives/personal/?method=ziwei#personal-input", "Zi Wei", "\u7D2B\u5FAE"], NUMEROLOGY: ["PERSONAL_METHODS", "/perspectives/personal/?method=numerology#personal-input", "Numerology", "\u6570\u5B57\u5B66"], HUMAN_DESIGN: ["PERSONAL_METHODS", "/perspectives/personal/#perspective-human-design", "Human Design", "\u4EBA\u7C7B\u56FE"], ECR: ["PHI_CONFIGURATION", "/perspectives/phi-configuration/", "PHI Configuration", "PHI \u6784\u578B"], TAROT: ["REFLECTION", "/perspectives/tarot/", "Tarot", "\u5854\u7F57"], I_CHING: ["REFLECTION", "/perspectives/iching/", "I Ching", "\u6613\u7ECF"] };
var methodCandidate = (id2, locale) => {
  const [cap, fallback, en, zh] = methodTargets[id2];
  const registered = ASK_CAPABILITIES.methods.find((m) => m.methodId === id2);
  const href = cap === "PERSONAL_METHODS" && registered?.formValue ? "/perspectives/personal/?method=" + encodeURIComponent(registered.formValue) + "#personal-input" : fallback;
  return { ...caps.find((c) => c.capabilityId === cap), canonicalRoute: href, methodId: id2, displayLabels: { en, "zh-Hans": zh }, label: locale === "zh-Hans" ? zh : en };
};
function classifyClientIntent(input = {}) {
  const raw = String(input.question || input.q || "").normalize("NFKC").trim(), locale = input.locale === "zh-Hans" ? "zh-Hans" : "en", zh = locale === "zh-Hans";
  const base = { schemaVersion: "PHI-OS-CLIENT-INTENT-ROUTE-v2", indexVersion: ASK_CAPABILITIES.version, task: "ENTRY", generationMode: "DETERMINISTIC", providerInvoked: false, providerCalls: 0, questionPresent: !!raw, boundaries: { methodChosenByClientRouter: false, lensExecutionAllowed: false, modelCalculationAllowed: false, persistenceAllowed: false, automaticRealityCase: false, automaticJourneyActivation: false } };
  const result = (outcome, ids2 = [], clarification = null) => {
    const candidates = ids2.slice(0, 3).map((id2) => caps.find((c) => c.capabilityId === id2)).filter(Boolean).map((c) => ({ ...c, label: c.displayLabels[locale], reason: zh ? "\u4E0E\u4F60\u7684\u95EE\u9898\u4E2D\u660E\u786E\u7684\u4E3B\u9898\u6216\u4EFB\u52A1\u76F8\u5173\uFF1B\u7531\u4F60\u9009\u62E9\u7EE7\u7EED\u3002" : "Matches an explicit topic or task; you choose whether to continue." }));
    return { ...base, outcome, candidates, clarification, surface: candidates[0]?.capabilityId || "ASK", href: candidates[0]?.canonicalRoute || "/knowledge/ask/", routeReason: outcome };
  };
  if (!raw && !input.capabilityId && !input.surface) return result("NEEDS_INPUT", [], zh ? "\u4F60\u60F3\u4E86\u89E3\u4EC0\u4E48\uFF1F" : "What would you like to understand?");
  if (raw.length > 2e3) return { ...result("NEEDS_INPUT"), error: "QUESTION_TOO_LONG" };
  const safety = routeHealthSafety({ question: raw });
  if (["EMERGENCY", "URGENT_EVALUATION"].includes(safety.careState)) return { ...result("PROFESSIONAL_HANDOFF", ["HEALTH_CARE"]), safety };
  const q = routingText(raw);
  const brand = /\bphi[\s-]*os\b/i.test(q);
  if (/book\s*(?:viii|8)\b|第?八册|第八部/i.test(q)) return { ...result("LIMITED_SUPPORT"), href: "/books/", clarification: zh ? "\u7B2C\u516B\u518C\u662F\u975E\u516C\u5F00\u9500\u552E\u7684 operating volume\uFF1B\u53EF\u4EE5\u4ECE\u516C\u5F00\u4E66\u7C4D\u76EE\u5F55\u7EE7\u7EED\u3002" : "Book VIII is an operating volume outside public sale; you can continue through the public books catalog.", primaryAction: { href: "/books/", label: zh ? "\u516C\u5F00\u4E66\u7C4D\u76EE\u5F55" : "Public book catalog" } };
  if (/遗嘱|\bwill\b/i.test(q) && /法律效力|签署生效|有法律效力|legally valid|executed|guarantee.*legal/i.test(q)) return { ...result("LIMITED_SUPPORT", ["WILL"]), clarification: zh ? "\u73B0\u6709\u529F\u80FD\u662F\u9057\u5631\u8D44\u6599\u6574\u7406\u7A3F\uFF0C\u4E0D\u80FD\u751F\u6210\u5177\u6709\u6CD5\u5F8B\u6548\u529B\u7684\u7B7E\u7F72\u9057\u5631\u3002" : "The available function produces an informational Will draft, not a legally valid executed Will." };
  if (/诊断|完整健康报告|diagnos|full health report/i.test(q)) return { ...result("LIMITED_SUPPORT", ["HEALTH_CARE"]), clarification: zh ? "\u73B0\u6709\u5165\u53E3\u53EA\u63D0\u4F9B\u5065\u5EB7\u6574\u7406\u4E0E\u73B0\u5B9E\u7167\u62A4\u8DEF\u7531\uFF0C\u4E0D\u63D0\u4F9B\u8BCA\u65AD\u6216\u5B8C\u6574\u5065\u5EB7\u62A5\u544A\u3002" : "The existing entrance supports health organization and care routing, not diagnosis or a full health report." };
  const chosen = caps.find((c) => c.capabilityId === input.capabilityId);
  if (chosen && input.selectionConfirmed === true) {
    const id2 = input.selectedMethodId;
    if (id2 && (!methodTargets[id2] || methodTargets[id2][0] !== chosen.capabilityId)) return { ...result("NEEDS_CLARIFICATION"), error: "METHOD_SELECTION_NOT_IN_CAPABILITY" };
    if (id2) {
      const candidate = methodCandidate(id2, locale);
      return { ...result("MATCHED_CAPABILITY", [chosen.capabilityId]), href: candidate.canonicalRoute, candidates: [candidate] };
    }
    return { ...result("MATCHED_CAPABILITY", [chosen.capabilityId]), task: /下载|付款状态|已买|账户|预约|退款|取消订阅|download|payment status|purchased|account|appointment|refund|cancel subscription|how (?:do i|to) use/i.test(q) ? "PRODUCT_HELP" : "ENTRY" };
  }
  const introduction = /是什么|什么是|介绍|说明|用途|用来|关于|如何(?:使用|用)|怎么(?:使用|用)|怎样(?:使用|用)|有什么功能|能做什么|如何开始|\b(?:about|what\s+is|introduce|introduction|how\s+(?:do\s+i\s+)?use|how\s+to\s+use|features?|overview|purpose|what\s+can|can\s+(?:it|you)\s+do|get\s+started|tell\s+me\s+about)\b/i.test(q);
  if ((brand || /这个(?:平台|网站|系统)|这里|this (?:platform|site)|your platform/i.test(q)) && (introduction || /^\s*phi[\s-]*os[?？!！。.]?\s*$/i.test(q))) return { ...result("PLATFORM_INTRODUCTION", ["ABOUT"]), surface: "ABOUT", href: "/about/founder/#how", primaryAction: { href: "/about/founder/#how", label: zh ? "\u4E86\u89E3 PHI OS \u4E0E\u4F7F\u7528\u65B9\u5F0F" : "Learn about PHI OS and how to use it" }, auxiliaryActions: [{ href: "/knowledge/", label: zh ? "\u63A2\u7D22\u77E5\u8BC6" : "Explore knowledge" }, { href: "/reality/", label: zh ? "\u8FDB\u5165 My Reality" : "Open My Reality" }] };
  if (/下载|付款状态|已买|账户|预约|退款|取消订阅|download|payment status|purchased|account|appointment|refund|cancel subscription|how (?:do i|to) use/i.test(q)) {
    const helpIds = [...new Set(rules.filter(([, pattern]) => pattern.test(q)).map(([id2]) => id2))];
    if (/预约|appointment/i.test(q)) return { ...result("PRODUCT_HELP", ["APPOINTMENT"]), task: "PRODUCT_HELP" };
    if (/已买|付款状态|账户|purchased|payment status|account|refund|退款/i.test(q)) return { ...result("PRODUCT_HELP", ["PRODUCT_HELP"]), task: "PRODUCT_HELP" };
    if (helpIds.length > 1) return { ...result("MULTI_DOMAIN_CLARIFY", helpIds, zh ? "\u4F60\u60F3\u5148\u5904\u7406\u54EA\u4E00\u4E2A\u529F\u80FD\u7684\u4F7F\u7528\u95EE\u9898\uFF1F" : "Which function would you like help using first?"), task: "PRODUCT_HELP" };
    return { ...result("PRODUCT_HELP", helpIds.length ? helpIds : ["PRODUCT_HELP"]), task: "PRODUCT_HELP" };
  }
  if (/今天|最新|today|latest/i.test(q) && /政策|policy/i.test(q)) return result("NEEDS_INPUT", ["WORLD"], zh ? "\u6D89\u53CA\u54EA\u4E2A\u5730\u533A\u3001\u54EA\u9879\u653F\u7B56\u548C\u65E5\u671F\uFF1F\u8BF7\u5148\u9009\u62E9\u5F53\u524D\u6765\u6E90\uFF1B\u5386\u53F2\u8D44\u6599\u4E0D\u80FD\u8BC1\u660E\u4ECA\u5929\u7684\u5F71\u54CD\u3002" : "Which jurisdiction, policy and date? Select a current source first; historical material cannot establish today\u2019s effect.");
  const worldPresentation = topicRoute(q, locale, input.topicId);
  if (input.task !== "KNOWLEDGE_BASIC" && worldPresentation?.worldPresentation) return { ...base, ...worldPresentation, boundaries: { ...base.boundaries, ...worldPresentation.boundaries } };
  const explanatory = /为什么|为何|为啥|怎么会|如何|怎样(?:形成|影响|理解)|原因是什么|形成原因|理解.*(?:原因|概念|含义)|解释|\b(?:why|how|explain|what\s+causes|what\s+makes|tell\s+me\s+about)\b/i.test(q);
  const topical = topicRoute(q, locale, input.topicId);
  if (!explanatory && input.task !== "KNOWLEDGE_BASIC" && topical && topical.topicIds.length === 1) return { ...base, ...topical };
  if (input.task === "KNOWLEDGE_BASIC" || explanatory) return { ...result("KNOWLEDGE_LOOKUP", ["KNOWLEDGE"]), task: "KNOWLEDGE_BASIC", query: raw, retrievalQuery: q, generalExplanation: true };
  if (input.task === "KNOWLEDGE_BASIC" || /什么是|是什么意思|在哪里读|哪里读|文章|知识|有什么不同|比较|what is|what are|means|where.*read|article|knowledge|definition|difference|compare/i.test(q)) return { ...result("KNOWLEDGE_LOOKUP", ["KNOWLEDGE"]), task: "KNOWLEDGE_BASIC", query: raw, retrievalQuery: q };
  const explicit = caps.find((c) => c.capabilityId === input.capabilityId)?.capabilityId || aliases[String(input.surface || "").toUpperCase()];
  if (explicit) return result("MATCHED_CAPABILITY", [explicit]);
  const scores = rules.filter(([, r]) => r.test(q)).map(([id2, , score]) => ({ id: id2, score })).sort((a, b) => b.score - a.score);
  const ids = [...new Set(scores.map((s) => s.id))];
  if (methodMentions(q).length > 1 && ["PERSONAL_METHODS", "PHI_CONFIGURATION", "REFLECTION"].includes(ids[0])) {
    const r = result("MULTI_DOMAIN_CLARIFY", ids, zh ? "\u4F60\u63D0\u5230\u4E86\u591A\u4E2A\u65B9\u6CD5\u3002\u8BF7\u9009\u62E9\u5148\u8FDB\u5165\u7684\u65B9\u6CD5\uFF1B\u8FD9\u91CC\u4E0D\u4F1A\u6267\u884C\u8BA1\u7B97\u6216\u62BD\u724C\u3002" : "You mentioned multiple methods. Choose one to enter first; no calculation or draw is performed here.");
    return { ...r, candidates: methodMentions(q).slice(0, 3).map((id2) => methodCandidate(id2, locale)) };
  }
  if (ids.length > 1) return result("MULTI_DOMAIN_CLARIFY", ids, zh ? "\u4F60\u63D0\u5230\u4E86\u591A\u4E2A\u9886\u57DF\u3002\u8BF7\u9009\u62E9\u5148\u5904\u7406\u7684\u65B9\u9762\u3002" : "You mentioned multiple areas. Choose which one to address first.");
  if (ids.length) {
    let r = result("MATCHED_CAPABILITY", ids);
    if (ids[0] === "PERSONAL_METHODS") {
      const m = ASK_CAPABILITIES.methods.find((m2) => m2.formValue && new RegExp({ BAZI: "\u516B\u5B57|\u56DB\u67F1|bazi|four pillars", ZI_WEI_DOU_SHU: "\u7D2B\u5FAE|zi\\s*wei", ASTROLOGY: "\u5360\u661F|astrology", NUMEROLOGY: "\u6570\u5B57\u5B66|numerology" }[m2.methodId] || "(?!)", "i").test(q));
      if (m) r = { ...r, href: "/perspectives/personal/?method=" + encodeURIComponent(m.formValue) + "#personal-input", candidates: r.candidates.map((c, i) => i ? c : { ...c, canonicalRoute: "/perspectives/personal/?method=" + encodeURIComponent(m.formValue) + "#personal-input" }) };
    }
    if (ids[0] === "REFLECTION" && /易经|i ching/i.test(q)) r = { ...r, href: "/perspectives/iching/", candidates: r.candidates.map((c, i) => i ? c : { ...c, canonicalRoute: "/perspectives/iching/" }) };
    return r;
  }
  if (/工作|career|job|work/i.test(q)) return result("MULTI_DOMAIN_CLARIFY", ["REALITY", "KNOWLEDGE"], zh ? "\u4F60\u60F3\u6574\u7406\u81EA\u5DF1\u7684\u5DE5\u4F5C\u5904\u5883\uFF0C\u8FD8\u662F\u7406\u89E3\u4E00\u4E2A\u4E00\u822C\u5DE5\u4F5C\u6982\u5FF5\uFF1F" : "Would you like to organize your work situation or understand a general work concept?");
  if (/不知道从哪里|不知从何|我想了解|不确定|uncertain|not sure|where.*start|feel lost/i.test(q)) return result("NEEDS_CLARIFICATION", [], zh ? "\u4F60\u60F3\u627E\u4E00\u4E2A\u529F\u80FD\u3001\u7406\u89E3\u4E00\u822C\u77E5\u8BC6\uFF0C\u8FD8\u662F\u6574\u7406\u5F53\u524D\u5904\u5883\uFF1F" : "Are you looking for a function, general knowledge, or a way to organize your current situation?");
  return result("NO_MATCH", [], zh ? "\u76EE\u524D\u6CA1\u6709\u53EF\u9760\u7684\u5BF9\u5E94\u529F\u80FD\u3002\u8BF7\u8865\u5145\u4F60\u60F3\u4E86\u89E3\u7684\u4E3B\u9898\uFF0C\u6216\u76F4\u63A5\u6D4F\u89C8\u77E5\u8BC6\u3002" : "No supported capability matches yet. Clarify the topic or browse knowledge directly.");
}
function routeClientIntent(input = {}) {
  const route = classifyClientIntent(input), ids = [...new Set(route.candidates.map((c) => c.capabilityId))];
  const domainHints = rules.filter(([, pattern]) => pattern.test(routingText(String(input.question || input.q || "")))).flatMap(([id2]) => caps.find((c) => c.capabilityId === id2)?.canonicalDomainRefs || []);
  const taskAxis = route.task === "KNOWLEDGE_BASIC" ? "KNOWLEDGE_BASIC" : route.task === "PRODUCT_HELP" || route.outcome === "PRODUCT_HELP" ? "PRODUCT_HELP" : route.outcome === "PROFESSIONAL_HANDOFF" ? "SAFETY_HANDOFF" : ids[0] === "REALITY" && route.outcome === "MATCHED_CAPABILITY" ? "REALITY_NAVIGATION" : "ENTRY";
  if (route.href?.includes("method=bazi")) route.clarification = input.locale === "zh-Hans" ? "\u516B\u5B57\u4EE5\u51FA\u751F\u8D44\u6599\u7EC4\u7EC7\u56DB\u67F1\u4E0E\u4E94\u884C\u7684\u4F20\u7EDF\u89E3\u91CA\u3002\u8FDB\u5165\u73B0\u6709\u9875\u9762\u586B\u5199\u8D44\u6599\u5E76\u67E5\u770B\u53EF\u7528\u7684\u514D\u8D39\u547D\u76D8\uFF1B\u5B8C\u6574\u62A5\u544A\u662F\u72EC\u7ACB\u4ED8\u8D39\u5185\u5BB9\uFF0C\u8FDB\u5165\u9875\u9762\u4E0D\u4F1A\u6536\u8D39\u6216\u751F\u6210\u4ED8\u8D39\u62A5\u544A\u3002" : "BaZi is a traditional Four Pillars and Five Elements interpretation using birth details. Enter the existing page to provide inputs and view the available free chart. A full report is separate paid content; opening the page neither charges nor generates one.";
  return { ...route, ruleVersion: "ENTRY_TASK_DOMAIN_R1", axes: { task: taskAxis, canonicalDomains: [.../* @__PURE__ */ new Set([...route.candidates.flatMap((c) => c.canonicalDomainRefs || []), ...domainHints])], products: ids, methodSelection: route.href?.includes("?method=") ? new URL(route.href, "https://phios.local").searchParams.get("method") : null }, handoff: { execution: "DISCOVERY_ONLY", originalQuestionTransport: "EXPLICIT_SAME_ORIGIN_EPHEMERAL_INPUT_ONLY", automaticGeneration: false, automaticPersistence: false, providerCalls: 0 } };
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/_lib/book-vii-published-admission.js
var BOOK_VII_ADMISSION_PATH = "content/knowledge/public/successors/book-vii-v2-source-refresh-v1/published-projection.json";
var hash = async (text2) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text2)))).map((b) => b.toString(16).padStart(2, "0")).join("");
async function loadBookViiPublishedAdmission(readJson) {
  let release;
  try {
    release = await readJson(BOOK_VII_ADMISSION_PATH);
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/_lib/public-knowledge-api.js
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
  const response = await env.ASSETS.fetch(new Request(`https://assets.local/content/knowledge/public/retrieval/${name}.json`));
  if (!response.ok) throw new Error(`PUBLIC_KNOWLEDGE_PROJECTION_UNAVAILABLE:${name}`);
  const original = await response.json();
  if (name === "published-retrieval-index") return original;
  const release = await loadBookViiPublishedAdmission(async (path) => {
    const r = await env.ASSETS.fetch(new Request(`https://assets.local/${path}`));
    if (!r.ok) return null;
    return r.json();
  });
  return appendBookViiProjection(original, name, release);
}
function scoreNode({ query, node, aliases: aliases2, questions, fragments }) {
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
  for (const item of aliases2) {
    if (normalize(item.value) === q || normalize(item.normalized) === q) add(900, "exact_alias", item.value);
  }
  const candidates = [node.title, node.summary, ...questions.map((x) => x.question), ...aliases2.map((x) => x.value)];
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
    const aliases2 = aliasesP.records.filter((x) => x.locale === locale && x.nodeCode === node.nodeCode);
    const questions = questionsP.records.filter((x) => x.locale === locale && x.nodeCode === node.nodeCode);
    const fragments = fragmentsP.records.filter((x) => x.locale === locale && x.nodeCode === node.nodeCode && (!x.questionScope || x.questionScope.some((q) => normalize(q) === normalize(query))));
    const scored = scoreNode({ query, node, aliases: aliases2, questions, fragments });
    return { node, aliases: aliases2, questions, fragments, ...scored };
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
    projection: { nodeCode: top.node.nodeCode, locale, mode, fragments: selected.map(({ fragmentCode, ordinal, kind, text: text2, digest: digest2, ...metadata }) => ({ fragmentCode, ordinal, kind, text: text2, digest: digest2, ...metadata, ...metadata.bookId === "BOOK-7" ? { scopeMatch: exact, bookCode: "BOOK-7", partCode: "PART-14" } : {} })) },
    readingPath: { steps, localeSwitches, blockedContinuations },
    indexDigest: index.indexDigest
  }, 200, "public, max-age=60, stale-while-revalidate=300");
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/api/client-intent-route.js
var headers = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "referrer-policy": "no-referrer", "x-content-type-options": "nosniff" };
var reply2 = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
async function onRequestPost({ request, env = {} }) {
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 6e3) return reply2({ ok: false, error: "INPUT_TOO_LARGE" }, 413);
    body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw Error();
  } catch {
    return reply2({ ok: false, error: "CLIENT_INTENT_ROUTE_INVALID" }, 400);
  }
  const route = routeClientIntent(body), locale = body.locale === "zh-Hans" ? "zh-Hans" : "en", zh = locale === "zh-Hans";
  if (route.outcome !== "KNOWLEDGE_LOOKUP") return reply2({ ok: true, route });
  const query = String(route.retrievalQuery ?? route.query ?? body.question ?? body.q ?? "").trim();
  if (query.length > 500) return reply2({ ok: true, route: { ...route, outcome: "NEEDS_CLARIFICATION", candidates: [], clarification: zh ? "\u8BF7\u5148\u9009\u4E00\u4E2A\u5177\u4F53\u95EE\u9898\uFF08500 \u5B57\u4EE5\u5185\uFF09\u3002" : "Choose one specific question (up to 500 characters)." } });
  try {
    const url = new URL("/api/public-knowledge", request.url);
    url.searchParams.set("q", query);
    url.searchParams.set("locale", locale);
    const response = await handlePublicKnowledgeRequest(new Request(url), env), knowledge = await response.json();
    if (!response.ok || !knowledge.ok) throw Error("KNOWLEDGE_RETRIEVAL_FAILED");
    const sufficient = ["exact", "strong"].includes(knowledge.coverage?.level) && knowledge.projection?.fragments?.some((f) => f.text?.trim());
    if (sufficient) return reply2({ ok: true, route: { ...route, outcome: "KNOWLEDGE_RESULTS", candidates: [], knowledge: { coverage: knowledge.coverage, indexDigest: knowledge.indexDigest, results: knowledge.results.slice(0, 3), fragments: knowledge.projection.fragments.slice(0, 2).map((f) => ({ text: f.text.slice(0, 800), fragmentCode: f.fragmentCode, digest: f.digest })) }, primaryAction: { href: knowledge.results[0].href, label: zh ? "\u9605\u8BFB\u5339\u914D\u6765\u6E90" : "Read the matching source" } } });
    const topic = query.replace(/^(?:请|请问|人们?|人|people|humans?)\s*/i, "").replace(/为什么|为何|为啥|解释一下|解释|\b(?:why|explain|do|does|are|is)\b/gi, "").trim().slice(0, 80);
    return reply2({ ok: true, route: { ...route, outcome: knowledge.coverage?.level === "none" ? "KNOWLEDGE_SOURCE_INSUFFICIENT" : "NEEDS_CLARIFICATION", candidates: [], knowledge: { coverage: knowledge.coverage, indexDigest: knowledge.indexDigest, results: [] }, clarification: zh ? `\u5173\u4E8E\u201C${topic || "\u8FD9\u4E2A\u95EE\u9898"}\u201D\uFF0C\u4F60\u60F3\u4E86\u89E3\u6982\u5FF5\u542B\u4E49\u3001\u4E00\u822C\u5F62\u6210\u539F\u56E0\uFF0C\u8FD8\u662F\u67D0\u4E2A\u5177\u4F53\u60C5\u5883\uFF1F\u73B0\u6709\u6765\u6E90\u4E0D\u8DB3\u4EE5\u7ED9\u51FA\u53EF\u9760\u89E3\u91CA\u3002` : `For \u201C${topic || "this question"}\u201D, do you mean its definition, general causes, or a specific situation? The available sources do not yet support an explanation.`, primaryAction: { kind: "CLARIFY", label: zh ? "\u8865\u5145\u95EE\u9898" : "Clarify the question" }, auxiliaryActions: [{ href: "/knowledge/", label: zh ? "\u6D4F\u89C8\u73B0\u6709\u77E5\u8BC6" : "Browse existing knowledge" }] } });
  } catch (error) {
    const indexFailure = /PUBLIC_KNOWLEDGE_(?:ASSETS|PROJECTION)_UNAVAILABLE|Unexpected token|JSON/.test(error.message || "");
    return reply2({ ok: true, route: { ...route, outcome: indexFailure ? "INDEX_LOADING_FAILED" : "SERVICE_FAILURE", candidates: [], clarification: null, primaryAction: { kind: "RETRY", label: zh ? "\u91CD\u8BD5" : "Retry" }, providerCalls: 0 } });
  }
}
async function onRequestGet2({ request, env = {} }) {
  const u = new URL(request.url), question = u.searchParams.get("q") || "";
  if (question.length > 500) return reply2({ ok: false, error: "QUESTION_TOO_LONG" }, 400);
  return onRequestPost({ env, request: new Request(new URL("/api/client-intent-route", u), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question, locale: u.searchParams.get("locale"), topicId: u.searchParams.get("topicId") || void 0, task: u.searchParams.get("task") || void 0, capabilityId: u.searchParams.get("capabilityId") || void 0, selectedMethodId: u.searchParams.get("selectedMethodId") || void 0, selectionConfirmed: u.searchParams.get("selectionConfirmed") === "true" }) }) });
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/api/current-facts.js
var current_facts_exports = {};
__export(current_facts_exports, {
  onRequestGet: () => onRequestGet3,
  onRequestPost: () => onRequestPost2
});

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/current-web-authority/current-web-authority-runtime.js
var CWA_EVIDENCE_SCHEMA = "PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0";
var PRECEDENCE = Object.freeze({ OFFICIAL_PRIMARY: 100, REGULATOR: 95, PUBLIC_HEALTH: 95, GOVERNMENT: 90, OFFICIAL_COMPANY: 85, ACADEMIC: 80, MARKET_DATA_PROVIDER: 78, REPUTABLE_NEWS: 70, SECONDARY_REFERENCE: 55, COMMUNITY: 25 });
var DOMAIN_ALLOWED = Object.freeze({ HEALTH: /* @__PURE__ */ new Set(["OFFICIAL_PRIMARY", "REGULATOR", "PUBLIC_HEALTH", "GOVERNMENT", "ACADEMIC"]), FINANCIAL_MARKETS: /* @__PURE__ */ new Set(["OFFICIAL_PRIMARY", "REGULATOR", "GOVERNMENT", "MARKET_DATA_PROVIDER", "OFFICIAL_COMPANY", "REPUTABLE_NEWS"]), COMPANY_PRODUCT: /* @__PURE__ */ new Set(["OFFICIAL_PRIMARY", "OFFICIAL_COMPANY", "REGULATOR", "REPUTABLE_NEWS", "SECONDARY_REFERENCE"]), NEWS_CURRENT_EVENTS: /* @__PURE__ */ new Set(["OFFICIAL_PRIMARY", "GOVERNMENT", "REGULATOR", "REPUTABLE_NEWS"]), WEATHER: /* @__PURE__ */ new Set(["OFFICIAL_PRIMARY", "GOVERNMENT", "SECONDARY_REFERENCE"]), GENERAL_CURRENT: /* @__PURE__ */ new Set(["OFFICIAL_PRIMARY", "GOVERNMENT", "REGULATOR", "OFFICIAL_COMPANY", "ACADEMIC", "REPUTABLE_NEWS", "SECONDARY_REFERENCE"]) });
var TTL = Object.freeze({ STOCK_OR_MARKET_PRICE: 900, WEATHER_CURRENT: 10800, BREAKING_NEWS: 86400, NEWS_DEVELOPMENT: 604800, PUBLIC_HEALTH_ALERT: 86400, GENERAL_CURRENT_FACT: 604800 });
var CLAIM_ALLOWED = Object.freeze({ HEALTH: /* @__PURE__ */ new Set(["PUBLIC_HEALTH_ALERT", "MEDICAL_GUIDELINE", "GENERAL_CURRENT_FACT", "NEWS_DEVELOPMENT"]), FINANCIAL_MARKETS: /* @__PURE__ */ new Set(["STOCK_OR_MARKET_PRICE", "POLICY_OR_REGULATION", "BREAKING_NEWS", "NEWS_DEVELOPMENT", "GENERAL_CURRENT_FACT"]), COMPANY_PRODUCT: /* @__PURE__ */ new Set(["COMPANY_PRODUCT_SPEC", "POLICY_OR_REGULATION", "BREAKING_NEWS", "NEWS_DEVELOPMENT", "GENERAL_CURRENT_FACT"]), NEWS_CURRENT_EVENTS: /* @__PURE__ */ new Set(["BREAKING_NEWS", "NEWS_DEVELOPMENT", "GENERAL_CURRENT_FACT"]), WEATHER: /* @__PURE__ */ new Set(["WEATHER_CURRENT", "GENERAL_CURRENT_FACT"]), GENERAL_CURRENT: /* @__PURE__ */ new Set(["GENERAL_CURRENT_FACT", "BREAKING_NEWS", "NEWS_DEVELOPMENT", "POLICY_OR_REGULATION", "COMPANY_PRODUCT_SPEC"]) });
function fail2(code, status = 422) {
  const e = new Error(code);
  e.code = code;
  e.status = status;
  throw e;
}
function freeze(v) {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v)) freeze(x);
  }
  return v;
}
function iso(v, code) {
  const d = new Date(v);
  if (!v || Number.isNaN(d.valueOf())) fail2(code, 400);
  return d.toISOString();
}
function safeUrl2(value) {
  let u;
  try {
    u = new URL(value);
  } catch {
    fail2("CWA_URL_INVALID", 400);
  }
  if (u.protocol !== "https:") fail2("CWA_HTTPS_REQUIRED", 400);
  u.hash = "";
  return u.toString();
}
function discoverCurrentSourceCandidates({ query = "", domain = "GENERAL_CURRENT", currentnessRequirement = "CURRENTNESS_REQUIRED", results = [] } = {}) {
  if (!String(query).trim()) fail2("CWA_DISCOVERY_QUERY_REQUIRED", 400);
  if (!DOMAIN_ALLOWED[domain]) fail2("CWA_DOMAIN_UNKNOWN", 400);
  if (currentnessRequirement === "CURRENTNESS_NONE") return freeze({ state: "CWA_NOT_CALLED", query: String(query).trim(), domain, currentnessRequirement, candidates: [] });
  if (!Array.isArray(results)) fail2("CWA_DISCOVERY_RESULTS_ARRAY_REQUIRED", 400);
  return freeze({ state: "CANDIDATES_DISCOVERED_NOT_ADMITTED", query: String(query).trim(), domain, currentnessRequirement, candidates: results.map(normalizeCurrentSourceCandidate), boundaries: freeze({ searchResultIsFact: false, searchRankIsAuthority: false }) });
}
function normalizeCurrentSourceCandidate({ url, publisher, title, publishedAt = null, retrievedAt, authorityClassHint = null, sourceVersionHint = null } = {}) {
  if (!publisher?.trim() || !title?.trim()) fail2("CWA_SOURCE_METADATA_REQUIRED", 400);
  return freeze({ url: safeUrl2(url), publisher: publisher.trim(), title: title.trim(), publishedAt: publishedAt ? iso(publishedAt, "CWA_PUBLISHED_AT_INVALID") : null, retrievedAt: iso(retrievedAt, "CWA_RETRIEVED_AT_INVALID"), authorityClassHint: authorityClassHint || null, sourceVersionHint: sourceVersionHint || null, admissionState: "CANDIDATE_ONLY", isFact: false, isAuthority: false });
}
function evaluateCurrentness({ claimType, retrievedAt, now: now2 = (/* @__PURE__ */ new Date()).toISOString(), sourceVersionCurrent = null, superseded = false } = {}) {
  const r = new Date(iso(retrievedAt, "CWA_RETRIEVED_AT_INVALID")), n = new Date(iso(now2, "CWA_NOW_INVALID"));
  if (r > n) fail2("CWA_RETRIEVAL_FROM_FUTURE", 400);
  if (TTL[claimType] != null) {
    const age = Math.floor((n - r) / 1e3);
    return freeze({ freshnessState: age <= TTL[claimType] ? "FRESH" : "STALE", mode: "TTL", ageSeconds: age, ttlSeconds: TTL[claimType] });
  }
  if (claimType === "POLICY_OR_REGULATION") return freeze({ freshnessState: superseded ? "STALE" : "FRESH_UNTIL_SUPERSEDED", mode: "UNTIL_SUPERSEDED" });
  if (claimType === "MEDICAL_GUIDELINE" || claimType === "COMPANY_PRODUCT_SPEC") return freeze({ freshnessState: sourceVersionCurrent === true ? "FRESH_VERSION_BOUND" : "VERSION_CHECK_REQUIRED", mode: claimType === "MEDICAL_GUIDELINE" ? "VERSION_BOUND" : "CURRENT_RELEASE" });
  return freeze({ freshnessState: "NO_FRESHNESS_POLICY", mode: "REJECT" });
}
function admitCurrentSource({ candidate, domain, authorityClass: authorityClass2, claimType, now: now2, sourceVersionCurrent = null, superseded = false, sourceId, sourceVersionOrDigest } = {}) {
  if (!candidate || candidate.admissionState !== "CANDIDATE_ONLY") fail2("CWA_CANDIDATE_REQUIRED", 400);
  const allowed = DOMAIN_ALLOWED[domain];
  if (!allowed) fail2("CWA_DOMAIN_UNKNOWN", 400);
  if (!PRECEDENCE[authorityClass2]) fail2("CWA_AUTHORITY_CLASS_UNKNOWN", 400);
  if (!allowed.has(authorityClass2)) return freeze({ admissionState: "REJECTED", reason: "CWA_AUTHORITY_NOT_ALLOWED_FOR_DOMAIN", domain, authorityClass: authorityClass2 });
  const claimAllowed = CLAIM_ALLOWED[domain];
  if (!claimAllowed?.has(claimType)) return freeze({ admissionState: "REJECTED", reason: "CWA_CLAIM_TYPE_NOT_ALLOWED_FOR_DOMAIN", domain, authorityClass: authorityClass2, claimType });
  const freshness = evaluateCurrentness({ claimType, retrievedAt: candidate.retrievedAt, now: now2, sourceVersionCurrent, superseded });
  if (["STALE", "VERSION_CHECK_REQUIRED", "NO_FRESHNESS_POLICY"].includes(freshness.freshnessState)) return freeze({ admissionState: freshness.freshnessState === "STALE" ? "STALE" : "REJECTED", reason: "CWA_FRESHNESS_NOT_ADMITTED", domain, authorityClass: authorityClass2, freshness });
  if (!sourceId?.trim() || !sourceVersionOrDigest?.trim()) fail2("CWA_PROVENANCE_REQUIRED", 400);
  return freeze({ admissionState: "ADMITTED", source: { sourceId: sourceId.trim(), sourceVersionOrDigest: sourceVersionOrDigest.trim(), ...candidate, authorityClass: authorityClass2, domain }, claimType, freshness, authorityPrecedence: PRECEDENCE[authorityClass2], sourceCountIsAuthority: false });
}
function createCurrentEvidence({ claimId, claimText, claimType, admission, publishedAt = null, supportLevel = "DIRECT", jurisdiction = null, conflicts = [] } = {}) {
  if (admission?.admissionState !== "ADMITTED") fail2("CWA_ADMITTED_SOURCE_REQUIRED", 409);
  if (!claimId?.trim() || !claimText?.trim()) fail2("CWA_CLAIM_REQUIRED", 400);
  return freeze({ schemaVersion: CWA_EVIDENCE_SCHEMA, claimId: claimId.trim(), claimText: claimText.trim(), claimType, sourceId: admission.source.sourceId, sourceUrl: admission.source.url, authorityClass: admission.source.authorityClass, publisher: admission.source.publisher, title: admission.source.title, publishedAt: publishedAt || admission.source.publishedAt, retrievedAt: admission.source.retrievedAt, sourceVersion: admission.source.sourceVersionOrDigest, freshnessState: admission.freshness.freshnessState, supportLevel, jurisdiction, domain: admission.source.domain, conflicts: [...conflicts], boundaries: freeze({ searchRankUsedAsAuthority: false, sourceVotingUsed: false, lensMutationAllowed: false, proseGenerationAllowed: false }) });
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/current-facts-gateway/current-facts-gateway.js
var PUBLIC_FACT_SIGNAL = /(exchange rate|fx\b|currency rate|stock|share price|market price|interest rate|weather|temperature|forecast|breaking|latest news|current event|regulation|law|policy|current price|price today|汇率|外汇|股价|市场价格|利率|天气|气温|预报|最新新闻|时事|法规|监管|政策|今日价格|当前价格)/i;
var DOMAIN_RULES = [["WEATHER", /(weather|temperature|forecast|天气|气温|预报)/i], ["FINANCIAL_MARKETS", /(exchange rate|fx\b|currency|stock|share price|market|interest rate|汇率|外汇|货币|股价|市场|利率)/i], ["NEWS_CURRENT_EVENTS", /(breaking|latest news|current event|新闻|时事|突发)/i], ["COMPANY_PRODUCT", /(current price|price today|product price|售价|产品价格|今日价格|当前价格)/i]];
var CLAIM_BY_DOMAIN = Object.freeze({ WEATHER: "WEATHER_CURRENT", FINANCIAL_MARKETS: "GENERAL_CURRENT_FACT", NEWS_CURRENT_EVENTS: "NEWS_DEVELOPMENT", COMPANY_PRODUCT: "COMPANY_PRODUCT_SPEC", GENERAL_CURRENT: "GENERAL_CURRENT_FACT" });
var clean3 = (v) => String(v ?? "").trim();
var list2 = (v) => Array.isArray(v) ? v : [];
function safeEndpoint(value) {
  let url;
  try {
    url = new URL(clean3(value));
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  return url;
}
function allowedHost(url, env) {
  const configured = clean3(env?.PHIOS_CURRENT_FACTS_ALLOWED_HOSTS);
  if (!configured) return true;
  const allowed = new Set(configured.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean));
  return allowed.has(url.hostname.toLowerCase());
}
function classifyCurrentFactNeed(question = "") {
  const q = clean3(question);
  if (!PUBLIC_FACT_SIGNAL.test(q)) return Object.freeze({ required: false, domain: "GENERAL_CURRENT" });
  const domain = DOMAIN_RULES.find(([, rx]) => rx.test(q))?.[0] || "GENERAL_CURRENT";
  return Object.freeze({ required: true, domain });
}
function authorityClass(item, domain) {
  const hint = clean3(item?.authorityClass || item?.authorityClassHint).toUpperCase();
  if (hint) return hint;
  if (domain === "WEATHER") return "GOVERNMENT";
  if (domain === "FINANCIAL_MARKETS") return "MARKET_DATA_PROVIDER";
  if (domain === "NEWS_CURRENT_EVENTS") return "REPUTABLE_NEWS";
  if (domain === "COMPANY_PRODUCT") return "OFFICIAL_COMPANY";
  return "SECONDARY_REFERENCE";
}
async function retrieveCurrentFacts({ question, env = {}, fetcher = fetch, now: now2 = (/* @__PURE__ */ new Date()).toISOString() } = {}) {
  const need2 = classifyCurrentFactNeed(question);
  if (!need2.required) return Object.freeze({ state: "NOT_REQUIRED", domain: need2.domain, retrievedAt: null, freshness: null, evidence: [], limitations: [] });
  const endpoint = safeEndpoint(env?.PHIOS_CURRENT_FACTS_ENDPOINT);
  if (!endpoint || !allowedHost(endpoint, env)) return Object.freeze({ state: "PROVIDER_NOT_CONFIGURED", domain: need2.domain, retrievedAt: null, freshness: null, evidence: [], limitations: ["CURRENT_FACTS_PROVIDER_NOT_CONFIGURED"] });
  const headers2 = { "content-type": "application/json", "accept": "application/json" };
  if (clean3(env?.PHIOS_CURRENT_FACTS_API_KEY)) headers2.authorization = `Bearer ${clean3(env.PHIOS_CURRENT_FACTS_API_KEY)}`;
  let response;
  try {
    response = await fetcher(endpoint, { method: "POST", headers: headers2, cache: "no-store", body: JSON.stringify({ query: clean3(question), domain: need2.domain, maxResults: 5 }) });
  } catch {
    return Object.freeze({ state: "PROVIDER_UNAVAILABLE", domain: need2.domain, retrievedAt: null, freshness: null, evidence: [], limitations: ["CURRENT_FACTS_PROVIDER_NETWORK_FAILURE"] });
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) return Object.freeze({ state: "PROVIDER_UNAVAILABLE", domain: need2.domain, retrievedAt: null, freshness: null, evidence: [], limitations: ["CURRENT_FACTS_PROVIDER_RESPONSE_INVALID"] });
  const raw = list2(payload.results).slice(0, 5);
  const retrievedAt = clean3(payload.retrievedAt) || now2;
  let candidates;
  try {
    candidates = discoverCurrentSourceCandidates({ query: question, domain: need2.domain, currentnessRequirement: "CURRENTNESS_REQUIRED", results: raw.map((item) => ({ url: item.url || item.sourceUrl, publisher: item.publisher, title: item.title || item.claimText || "Current source", publishedAt: item.publishedAt || null, retrievedAt: item.retrievedAt || retrievedAt, authorityClassHint: item.authorityClass || null, sourceVersionHint: item.sourceVersionOrDigest || item.sourceVersion || null })) }).candidates;
  } catch {
    return Object.freeze({ state: "REJECTED", domain: need2.domain, retrievedAt, freshness: null, evidence: [], limitations: ["CURRENT_FACTS_DISCOVERY_REJECTED"] });
  }
  const evidence = [];
  const limitations = [];
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i], rawItem = raw[i] || {};
    try {
      const claimType = clean3(rawItem.claimType) || CLAIM_BY_DOMAIN[need2.domain] || "GENERAL_CURRENT_FACT";
      const admission = admitCurrentSource({ candidate, domain: need2.domain, authorityClass: authorityClass(rawItem, need2.domain), claimType, now: now2, sourceVersionCurrent: rawItem.sourceVersionCurrent === true, superseded: rawItem.superseded === true, sourceId: clean3(rawItem.sourceId) || `CWA-PROVIDER-${i + 1}`, sourceVersionOrDigest: clean3(rawItem.sourceVersionOrDigest || rawItem.sourceVersion) || `retrieved:${candidate.retrievedAt}` });
      if (admission.admissionState !== "ADMITTED") {
        limitations.push(admission.reason || "CURRENT_SOURCE_NOT_ADMITTED");
        continue;
      }
      const claimText = clean3(rawItem.claimText || rawItem.answer || rawItem.snippet);
      if (!claimText) {
        limitations.push("CURRENT_FACT_CLAIM_TEXT_MISSING");
        continue;
      }
      evidence.push(createCurrentEvidence({ claimId: clean3(rawItem.claimId) || `CWA-CLAIM-${i + 1}`, claimText, claimType, admission, publishedAt: rawItem.publishedAt || null, supportLevel: clean3(rawItem.supportLevel) || "DIRECT", jurisdiction: clean3(rawItem.jurisdiction) || null }));
    } catch (error) {
      limitations.push(error?.code || error?.message || "CURRENT_SOURCE_REJECTED");
    }
  }
  const freshness = evidence.length ? evidence.map((x) => x.freshnessState).join(",") : null;
  return Object.freeze({ state: evidence.length ? "AVAILABLE" : "NO_ADMITTED_EVIDENCE", domain: need2.domain, retrievedAt, freshness, evidence: Object.freeze(evidence), limitations: Object.freeze([...new Set(limitations)]), providerDisclosure: { serverSide: true, endpointHost: endpoint.hostname, browserDirectRetrieval: false } });
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/world/company-filings-r1.json
var company_filings_r1_default = {
  schemaVersion: "WORLD_OFFICIAL_FILING_SNAPSHOTS_R2",
  status: "DATED_PUBLIC_FILING_NOT_LIVE_MARKET_DATA",
  companies: [
    {
      symbol: "MYX:0338",
      name: "ORIENTAL KOPI HOLDINGS BERHAD",
      currency: "MYR",
      sourceUrl: "https://ir2.chartnexus.com/kopi/onenew.php?id=3700325&type=Announcement",
      sourceId: "FRA-28082026-00007",
      publishedAt: "2026-08-28",
      checkedAt: "2026-10-30",
      sourceAuthority: "ISSUER_IR_REPRODUCTION_OF_BURSA_ANNOUNCEMENT",
      filing: {
        periodStart: "2026-04-01",
        periodEnd: "2026-06-30",
        periodKind: "QUARTER",
        comparison: "SAME_QUARTER_PRIOR_YEAR",
        audited: false,
        statementUnit: "MYR_THOUSANDS",
        scale: 1e3,
        revenue: 156626,
        priorRevenue: 116745,
        netProfit: 17004,
        priorNetProfit: 17948,
        reportedEps: 0.85,
        epsUnit: "SEN",
        netAssetsPerShare: 0.16,
        totalAssets: 490140,
        totalLiabilities: 167561,
        equity: 322579,
        sharesOutstanding: 2e9,
        annualOrTtmNetProfit: null,
        annualOrTtmEps: null,
        averageEquity: null,
        statementBasis: "CONSOLIDATED",
        accountingStandards: "MFRS 134",
        shareClass: "ORDINARY",
        grossProfit: 36774,
        operatingProfit: 26028,
        cash: 13933,
        currentAssets: 307407,
        currentLiabilities: 42696,
        borrowings: 3044,
        sharesAsOf: "2026-06-30",
        operatingCashFlow: 50938,
        capex: 24041,
        capexConvention: "POSITIVE_CASH_OUTFLOW",
        dividendsPaid: 2e4,
        cashFlowPeriod: {
          start: "2025-10-01",
          end: "2026-06-30",
          kind: "YTD"
        },
        yearToDateSummary: {
          start: "2025-10-01",
          end: "2026-06-30",
          kind: "YTD",
          unit: "MYR_THOUSANDS",
          revenue: 443079,
          priorRevenue: 317756,
          netProfit: 49083,
          priorNetProfit: 44861,
          reportedEpsSen: 2.45,
          priorReportedEpsSen: 2.46,
          pdfPage: 2
        }
      },
      quote: null,
      limits: [
        "MANUALLY_CHECKED_LATEST_AS_OF_2026_10_30_NOT_CONTINUOUS_REFRESH",
        "BURSA_QUOTE_AND_REDISTRIBUTION_RIGHTS_NOT_VERIFIED",
        "QUARTER_NOT_ANNUALISED",
        "B8_BORROWINGS_EXCLUDE_LEASE_LIABILITIES",
        "CASH_EXCLUDES_OTHER_INVESTMENTS"
      ],
      latestFilingCheck: {
        checkedAt: "2026-10-30",
        indexUrl: "https://ir2.chartnexus.com/kopi/financial-report.php",
        latestListedPeriodEnd: "2026-06-30",
        method: "MANUAL_ISSUER_OFFICIAL_INDEX_CHECK",
        automaticRefresh: false
      },
      verifiedReport: {
        url: "https://ir2.chartnexus.com/kopi/docs/qr/q3_2026.pdf",
        sha256: "542364f8e59f1f5a17de729e1d2291b3415c05631efca9b2c9e5dfec94d733c8",
        pages: 22,
        checkedAt: "2026-10-30",
        verifier: "CODEX_MANUAL_DOCUMENT_CHECK_NOT_TL_HUMAN_ACCEPTANCE",
        borrowingsBasis: "B8 hire purchases only; lease liabilities excluded; not total liabilities",
        cashBasis: "Cash and bank balances only; other investments excluded",
        fieldPages: {
          revenue: 2,
          netProfit: 2,
          grossProfit: 2,
          operatingProfit: 2,
          totalAssets: 3,
          totalLiabilities: 3,
          equity: 3,
          cash: 3,
          currentAssets: 3,
          currentLiabilities: 3,
          borrowings: 19,
          sharesOutstanding: 4,
          operatingCashFlow: 6,
          capex: 6,
          dividendsPaid: 7
        }
      }
    }
  ],
  predecessorRevision: "206afa8f",
  predecessorSha256: "911e769330935ba36ed345376ea5ef7ab753759c5bc1cee301d1ebb714ef69c1"
};

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/scripts/lib/civilization-atlas/moomoo-financial-metrics-v1.mjs
function financialRatio(numerator, denominator, { name = "ratio", scale = 100, numeratorDefinition } = {}) {
  const fail4 = (reason) => ({ name, state: "NOT_COMPARABLE", value: null, reason });
  if (!numerator || !denominator) return fail4("INPUT_MISSING");
  for (const k of ["instrument", "timestamp"]) if (!numerator[k] || numerator[k] !== denominator[k]) return fail4("PERIOD_OR_INSTRUMENT_MISMATCH");
  for (const k of ["currencyCode", "periodText", "accountingStandards"]) if (!numerator.meta?.[k] || numerator.meta[k] !== denominator.meta?.[k]) return fail4("BASIS_MISMATCH");
  if (numerator.unit !== denominator.unit) return fail4("UNIT_MISMATCH");
  if (!Number.isFinite(numerator.value) || !Number.isFinite(denominator.value) || denominator.value <= 0 || numerator.value < 0) return fail4("INVALID_DENOMINATOR_OR_INAPPLICABLE_NEGATIVE");
  return { name, state: "DERIVED", value: numerator.value / denominator.value * scale, formula: `numerator / denominator * ${scale}`, numeratorDefinition, inputs: [numerator, denominator], calculationVersion: "world-financial-ratio-v1", unit: scale === 100 ? "percent" : "ratio", nullsAreNotZero: true };
}
function independentQuarterTTM(rows2) {
  if (rows2.length !== 4 || rows2.some((r) => r.meta?.flowBasis !== "INDEPENDENT_QUARTER")) return { state: "NOT_COMPUTED", reason: "FOUR_INDEPENDENT_QUARTERS_REQUIRED", value: null };
  if (new Set(rows2.map((r) => r.meta.periodText)).size !== 4 || new Set(rows2.map((r) => r.meta.currencyCode)).size !== 1 || new Set(rows2.map((r) => r.instrument)).size !== 1 || rows2.some((r) => !Number.isFinite(r.value))) return { state: "NOT_COMPUTED", reason: "PERIOD_OR_CURRENCY_MISMATCH", value: null };
  const times = rows2.map((r) => Date.parse(r.timestamp)).sort((a, b) => a - b);
  if (times.some((t, i) => i && (t - times[i - 1] < 60 * 864e5 || t - times[i - 1] > 120 * 864e5))) return { state: "NOT_COMPUTED", reason: "NON_CONSECUTIVE_QUARTERS", value: null };
  return { state: "DERIVED", value: rows2.reduce((n, r) => n + r.value, 0), formula: "sum of four explicitly independent, consecutive quarters", inputs: rows2 };
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/_lib/world-company-analysis.js
var finite = (x) => typeof x === "number" && Number.isFinite(x);
var unknown = (unit, reason) => ({ value: null, unit, state: "UNKNOWN", reason });
var metric = (value, unit, formula, sourceRefs) => finite(value) ? { value, unit, state: "KNOWN", formula, sourceRefs } : unknown(unit, "REQUIRED_INPUT_UNKNOWN");
function companySymbol(value) {
  if (typeof value !== "string" || !/^MYX:\d{4}$/.test(value)) throw Error("PUBLIC_COMPANY_SYMBOL_INVALID");
  return value;
}
function analyzeWorldCompany(packet, { now: now2 = (/* @__PURE__ */ new Date()).toISOString(), peMultiples = [] } = {}) {
  const symbol = companySymbol(packet.symbol);
  if (!Array.isArray(peMultiples) || peMultiples.length > 5 || peMultiples.some((x) => !finite(x) || x <= 0 || x > 200)) throw Error("SCENARIO_ASSUMPTIONS_INVALID");
  const f = packet.filing || {}, refs = packet.sourceId ? [packet.sourceId] : [], unit = packet.currency;
  const validCurrency = /^[A-Z]{3}$/.test(unit || ""), validFiling = validCurrency && f.scale > 0 && finite(f.scale) && /^\d{4}-\d{2}-\d{2}$/.test(f.periodEnd || "") && refs.length && /^https:\/\//.test(packet.sourceUrl || "");
  const money = (k) => validFiling && finite(f[k]) ? f[k] * f.scale : null;
  const annualReady = validFiling && ["ANNUAL", "TTM"].includes(f.annualOrTtmBasis) && f.annualOrTtmPeriodEnd === f.periodEnd;
  const revenue = money("revenue"), profit = money("netProfit"), annualProfit = annualReady ? money("annualOrTtmNetProfit") : null, averageEquity = annualReady && f.averageEquityPeriodMatched === true ? money("averageEquity") : null;
  let quoteState = "PROVIDER_GAP", price = null;
  const q = packet.quote;
  if (q) {
    quoteState = "RIGHTS_OR_IDENTITY_NOT_VERIFIED";
    if (q.redistributionAllowed === true && q.symbol === symbol && q.currency === unit && q.sourceId && q.priceType === "LAST_TRADED" && finite(q.price) && q.price >= 0 && q.retrievedAt === q.asOf) {
      try {
        const fresh = evaluateCurrentness({ claimType: "STOCK_OR_MARKET_PRICE", retrievedAt: q.asOf, now: now2 });
        quoteState = fresh.freshnessState;
        if (quoteState === "FRESH") price = q.price;
      } catch {
        quoteState = "INVALID_QUOTE_TIME";
      }
    }
  }
  const out = { revenue: metric(revenue, unit, "reported revenue \xD7 statement scale", refs), netProfit: metric(profit, unit, "reported profit \xD7 statement scale", refs), totalAssets: metric(money("totalAssets"), unit, "reported assets \xD7 statement scale", refs), totalLiabilities: metric(money("totalLiabilities"), unit, "reported liabilities \xD7 statement scale", refs), equity: metric(money("equity"), unit, "reported equity \xD7 statement scale", refs), eps: metric(validFiling && finite(f.reportedEps) && ["SEN", "MYR"].includes(f.epsUnit) ? f.reportedEps / (f.epsUnit === "SEN" ? 100 : 1) : null, validCurrency ? unit + "/share" : null, "reported EPS; sen \xF7 100 for MYR", refs) };
  const priorRevenue = money("priorRevenue");
  out.revenueGrowth = metric(f.comparison === "SAME_QUARTER_PRIOR_YEAR" && priorRevenue > 0 && revenue !== null ? (revenue - priorRevenue) / priorRevenue * 100 : null, "percent", "(revenue \u2212 comparable prior revenue) / prior revenue \xD7 100", refs);
  out.profitMargin = metric(revenue > 0 && profit !== null ? profit / revenue * 100 : null, "percent", "net profit / revenue \xD7 100", refs);
  out.marketCap = metric(price !== null && validFiling && finite(f.sharesOutstanding) && f.sharesOutstanding > 0 && f.sharesAsOf === q?.asOf?.slice(0, 10) ? price * f.sharesOutstanding : null, unit, "fresh price \xD7 dated current shares outstanding", [...refs, ...q?.sourceId ? [q.sourceId] : []]);
  out.pe = metric(price !== null && annualReady && f.annualOrTtmEps > 0 ? price / f.annualOrTtmEps : null, "multiple", "fresh price / annual or TTM EPS", refs);
  out.pb = metric(price !== null && validFiling && f.netAssetsPerShare > 0 ? price / f.netAssetsPerShare : null, "multiple", "fresh price / dated net assets per share (dates remain explicit)", refs);
  out.roe = metric(annualProfit !== null && averageEquity > 0 ? annualProfit / averageEquity * 100 : null, "percent", "annual or TTM net profit / matching average equity \xD7 100", refs);
  const scope = f.statementBasis || "UNKNOWN", extendedReady = validFiling && ["CONSOLIDATED", "COMPANY"].includes(scope) && Boolean(f.accountingStandards) && Boolean(f.shareClass);
  const observation = (value) => ({ value, instrument: symbol, timestamp: f.periodEnd, unit, meta: { currencyCode: unit, periodText: [f.periodStart, f.periodEnd, f.periodKind, scope, f.shareClass].join("/"), accountingStandards: f.accountingStandards } });
  const ratio = (a, b, scale = 100) => extendedReady ? financialRatio(observation(a), observation(b), { scale }) : { value: null };
  const cash = money("cash"), debt = money("borrowings"), ocf = money("operatingCashFlow"), capex = money("capex");
  out.cash = metric(cash, unit, "reported cash \xD7 statement scale", refs);
  out.debt = metric(debt, unit, "reported borrowings \xD7 statement scale; liabilities are not assumed to be debt", refs);
  out.netDebt = metric(extendedReady && cash !== null && debt !== null ? debt - cash : null, unit, "borrowings \u2212 cash; a negative value is net cash", refs);
  out.debtToEquity = metric(ratio(debt, money("equity")).value ?? null, "percent", "borrowings / matching positive equity \xD7 100", refs);
  out.currentRatio = metric(ratio(money("currentAssets"), money("currentLiabilities"), 1).value ?? null, "multiple", "current assets / matching positive current liabilities", refs);
  out.grossMargin = metric(extendedReady && revenue > 0 && money("grossProfit") !== null ? money("grossProfit") / revenue * 100 : null, "percent", "gross profit / same-period revenue \xD7 100", refs);
  out.operatingMargin = metric(extendedReady && revenue > 0 && money("operatingProfit") !== null ? money("operatingProfit") / revenue * 100 : null, "percent", "operating profit / same-period revenue \xD7 100", refs);
  const priorQ = f.previousQuarter, quarterComparable = extendedReady && f.periodKind === "QUARTER" && priorQ?.periodKind === "QUARTER" && priorQ.periodStart && Date.parse(priorQ.periodEnd) - Date.parse(priorQ.periodStart) >= 59 * 864e5 && Date.parse(priorQ.periodEnd) - Date.parse(priorQ.periodStart) <= 119 * 864e5 && priorQ.statementBasis === scope && priorQ.currency === unit && priorQ.shareClass === f.shareClass && priorQ.sourceId && Date.parse(f.periodStart) - Date.parse(priorQ.periodEnd) === 864e5 && money("previousQuarterRevenue") > 0;
  out.revenueGrowthQoQ = metric(quarterComparable && revenue !== null ? (revenue - money("previousQuarterRevenue")) / money("previousQuarterRevenue") * 100 : null, "percent", "(revenue \u2212 verified previous independent quarter revenue) / previous quarter revenue \xD7 100", refs.concat(priorQ?.sourceId || []));
  out.operatingCashFlow = metric(ocf, unit, "reported operating cash flow \xD7 statement scale", refs);
  out.freeCashFlow = metric(extendedReady && ocf !== null && capex !== null && capex >= 0 && f.capexConvention === "POSITIVE_CASH_OUTFLOW" ? ocf - capex : null, unit, "operating cash flow \u2212 positive capex outflow; convention must be explicit", refs);
  out.dividendsPaid = metric(money("dividendsPaid"), unit, "reported dividend cash payments; not an assumed annual dividend rate", refs);
  out.roa = metric(extendedReady && annualProfit !== null && f.averageAssetsPeriodMatched === true && money("averageAssets") > 0 ? annualProfit / money("averageAssets") * 100 : null, "percent", "annual or TTM net profit / matched average assets \xD7 100", refs);
  let ttmEps = annualReady && f.annualOrTtmBasis === "TTM" && finite(f.annualOrTtmEps) ? f.annualOrTtmEps : null;
  const quarters = f.independentQuarterEps || [], orderedQuarters = [...quarters].sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
  const independentSpans = orderedQuarters.length === 4 && orderedQuarters.every((r, i) => Number.isFinite(Date.parse(r.meta?.periodStart)) && Date.parse(r.timestamp) - Date.parse(r.meta.periodStart) >= 59 * 864e5 && Date.parse(r.timestamp) - Date.parse(r.meta.periodStart) <= 119 * 864e5 && (!i || Date.parse(r.meta.periodStart) - Date.parse(orderedQuarters[i - 1].timestamp) === 864e5)) && Date.parse(orderedQuarters[3].timestamp) - Date.parse(orderedQuarters[0].meta.periodStart) >= 350 * 864e5 && Date.parse(orderedQuarters[3].timestamp) - Date.parse(orderedQuarters[0].meta.periodStart) <= 379 * 864e5;
  if (ttmEps === null && extendedReady && independentSpans && quarters.length === 4 && quarters.every((r) => r.instrument === symbol && r.unit === unit + "/share" && r.meta?.currencyCode === unit && r.meta.statementBasis === scope && r.meta.shareClass === f.shareClass && r.meta.epsBasis === f.epsBasis && r.meta.sharesBasisId === f.sharesBasisId && r.meta.sourceId && Number.isFinite(Date.parse(r.timestamp))) && f.epsBasis && f.sharesBasisId && quarters.map((r) => r.timestamp.slice(0, 10)).sort().at(-1) === f.periodEnd) {
    const t = independentQuarterTTM(quarters);
    if (t.state === "DERIVED") ttmEps = t.value;
  }
  out.ttmEps = metric(ttmEps, validCurrency ? unit + "/share" : null, "explicit TTM EPS, or sum of four independent consecutive quarters on a matching EPS/share basis", refs.concat(quarters.map((r) => r.meta?.sourceId).filter(Boolean)));
  out.dividendYield = metric(price > 0 && extendedReady && f.annualDividendBasis === "PAST_12_MONTHS_DECLARED" && f.annualDividendPeriodEnd === q?.asOf?.slice(0, 10) && finite(f.annualDividendsPerShare) && f.annualDividendsPerShare >= 0 && f.dividendSourceId ? f.annualDividendsPerShare / price * 100 : null, "percent", "verified trailing twelve-month dividend per share / fresh authorized quote \xD7 100", refs.concat(f.dividendSourceId || []));
  const segments = f.businessSegments || [], segmentReady = extendedReady && revenue > 0 && f.segmentBasis === "NET_OF_ELIMINATIONS" && segments.length > 0 && segments.every((r) => r.name && r.sourceId && finite(r.revenue)) && Math.abs(segments.reduce((n, r) => n + r.revenue * f.scale, 0) - revenue) < 0.01;
  const segmentContributions = segments.map((r) => ({ name: r.name, contribution: metric(segmentReady ? r.revenue * f.scale / revenue * 100 : null, "percent", "reported segment revenue / reconciled consolidated revenue \xD7 100", [r.sourceId].filter(Boolean)) }));
  const latestChecked = packet.latestFilingCheck?.method === "MANUAL_ISSUER_OFFICIAL_INDEX_CHECK" && packet.latestFilingCheck.latestListedPeriodEnd === f.periodEnd && packet.latestFilingCheck.checkedAt === packet.checkedAt && Date.parse(packet.checkedAt) <= Date.parse(now2);
  const annotate = (m, metricId) => {
    m.metricId = metricId;
    m.period = { start: f.periodStart || null, end: f.periodEnd || null, kind: f.periodKind || null, statementBasis: scope };
    if (["totalAssets", "totalLiabilities", "equity", "cash", "debt", "netDebt", "debtToEquity", "currentRatio", "marketCap", "pb"].includes(metricId)) m.period = { start: null, end: f.periodEnd || null, kind: "AS_OF", statementBasis: scope };
    if (["operatingCashFlow", "freeCashFlow", "dividendsPaid"].includes(metricId) && f.cashFlowPeriod) {
      if (!["QUARTER", "YTD", "ANNUAL", "TTM"].includes(f.cashFlowPeriod.kind) || f.cashFlowPeriod.end !== f.periodEnd || !(Date.parse(f.cashFlowPeriod.start) < Date.parse(f.cashFlowPeriod.end))) throw Error("CASHFLOW_PERIOD_INVALID");
      m.period = { ...f.cashFlowPeriod, statementBasis: scope };
    }
    if (["ttmEps", "pe", "roe", "roa"].includes(metricId)) {
      m.period = { start: f.annualOrTtmPeriodStart || (independentSpans ? orderedQuarters[0].meta.periodStart : null), end: f.annualOrTtmPeriodEnd || f.periodEnd || null, kind: metricId === "ttmEps" || independentSpans ? "TTM" : f.annualOrTtmBasis || "UNKNOWN", statementBasis: scope };
    }
    m.inputSourceRefs = [.../* @__PURE__ */ new Set([...m.sourceRefs || refs, ...["marketCap", "pe", "pb", "dividendYield"].includes(metricId) && price !== null && q?.sourceId ? [q.sourceId] : []])];
    m.sourceAsOf = { filing: packet.publishedAt || null, quote: ["marketCap", "pe", "pb", "dividendYield"].includes(metricId) ? q?.asOf || null : null };
    m.formula = m.formula || "Required source-bound inputs are missing or not comparable";
    m.calculationVersion = "WORLD_COMPANY_WMDA_R2";
    m.limitations = [...m.value === null ? ["REQUIRED_INPUT_UNKNOWN_OR_INCOMPARABLE"] : [], ...scope === "UNKNOWN" ? ["STATEMENT_SCOPE_NOT_EXTRACTED"] : [], ...latestChecked ? ["LATEST_CHECKED_AS_OF_" + packet.checkedAt + "_NOT_AUTOMATIC_REFRESH"] : ["DATED_FILING_NOT_VERIFIED_LATEST"]];
    if (["debt", "netDebt", "debtToEquity"].includes(metricId) && packet.verifiedReport?.borrowingsBasis) m.limitations.push(packet.verifiedReport.borrowingsBasis);
    return m;
  };
  for (const [id2, m] of Object.entries(out)) annotate(m, id2);
  for (const row of segmentContributions) annotate(row.contribution, "segmentContribution");
  const valuationEps = annualReady && finite(f.annualOrTtmEps) ? f.annualOrTtmEps : ttmEps;
  if (price !== null && valuationEps > 0 && out.pe.value === null) out.pe = annotate(metric(price / valuationEps, "multiple", "fresh authorized price / verified independent-quarter TTM EPS", refs.concat(quarters.map((r) => r.meta?.sourceId).filter(Boolean))), "pe");
  const scenarios = peMultiples.map((pe) => ({ assumption: { peMultiple: pe, basis: "USER_DECLARED_NOT_FORECAST" }, price: metric(valuationEps > 0 ? valuationEps * pe : null, validCurrency ? unit + "/share" : null, "annual or TTM EPS \xD7 declared PE assumption", refs) }));
  for (const scenario of scenarios) {
    annotate(scenario.price, "declaredScenarioPrice");
    scenario.price.limitations.push("USER_DECLARED_ASSUMPTION_NOT_FORECAST");
  }
  return { symbol, name: packet.name || symbol, exchange: "MYX", securityCode: symbol.slice(4), industry: packet.industry || null, currency: unit || null, state: validFiling ? "PARTIAL_DATED_FILING" : "SOURCE_GAP", metrics: out, period: { start: f.periodStart || null, end: f.periodEnd || null, kind: f.periodKind || null, comparison: f.comparison || null, audited: f.audited === true }, source: { id: packet.sourceId || null, url: packet.sourceUrl || null, publishedAt: packet.publishedAt || null, checkedAt: packet.checkedAt || null, authority: packet.sourceAuthority || null, verifiedReport: packet.verifiedReport || null, latestFilingCheck: packet.latestFilingCheck || null }, freshness: { filing: latestChecked ? "LATEST_MANUALLY_VERIFIED_AS_OF_CHECK_NOT_AUTOMATIC_REFRESH" : "HISTORICAL_AS_FILED_NOT_VERIFIED_LATEST", quote: quoteState, computedAt: now2 }, scenarios, limits: [...packet.limits || [], "NO_QUARTERLY_ANNUALISATION", "NO_PRICE_TARGET_OR_INVESTMENT_RECOMMENDATION"], segmentContributions, reportedYearToDate: f.yearToDateSummary || null, interpretationMode: "RULE_BASED_EXPLANATION", providerCalls: 0, modelCalls: 0, personalFactsCreated: false };
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/assets/js/pages/civilization-atlas/world-r42-contract.js
function compareWorldObjects(a, b) {
  if (!a || !b) return { state: "COMPARABILITY_UNKNOWN", reasons: ["OBJECT_MISSING"] };
  const reasons = [];
  for (const [field, reason] of [["indicatorId", "INDICATOR_DEFINITIONS_DIFFER"], ["spatialLevel", "SPATIAL_SCOPES_DIFFER"], ["priceBasis", "PRICE_BASES_DIFFER"]]) if (a[field] && b[field] && a[field] !== b[field]) reasons.push(reason);
  if (a.unit && b.unit && a.unit !== b.unit) reasons.push("INCOMPATIBLE_UNITS");
  if (a.methodology && b.methodology && a.methodology !== b.methodology) reasons.push("INCOMPATIBLE_METHODS");
  if (reasons.length) return { state: "NOT_COMPARABLE", reasons };
  if (a.type !== b.type) return { state: "NOT_COMPARABLE", reasons: ["DIFFERENT_OBJECT_CLASSES"] };
  if (a.id === b.id) return { state: "COMPARABILITY_UNKNOWN", reasons: ["SELECT_TWO_DISTINCT_OBJECTS"] };
  if (!a.source || !b.source || !a.time || !b.time) return { state: "COMPARABILITY_UNKNOWN", reasons: ["SOURCE_OR_TIME_UNKNOWN"] };
  if (a.unit && b.unit && (a.time.start !== b.time.start || a.time.end !== b.time.end)) return { state: "NOT_COMPARABLE", reasons: ["MEASUREMENT_PERIODS_DIFFER"] };
  return { state: a.comparisonBasis && a.comparisonBasis === b.comparisonBasis ? "COMPARABLE" : "PARTIALLY_COMPARABLE", reasons: a.comparisonBasis === b.comparisonBasis && a.comparisonBasis ? [] : ["DESCRIPTIVE_SOURCE_ROWS_ONLY_NO_RANK_OR_CAUSAL_INFERENCE"] };
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/current-facts-gateway/world-company-projection.js
function retrievePublicCompany(input, { now: now2 = (/* @__PURE__ */ new Date()).toISOString() } = {}) {
  if (Object.keys(input).some((k) => !["operation", "symbol", "compare", "pe"].includes(k)) || input.operation !== "company") throw Error("PUBLIC_COMPANY_QUERY_INVALID");
  const symbol = companySymbol(input.symbol), comparison = input.compare ? companySymbol(input.compare) : null;
  if (input.pe !== void 0 && !/^\d{1,3}(?:\.\d{1,2})?(?:,\d{1,3}(?:\.\d{1,2})?){0,4}$/.test(input.pe)) throw Error("SCENARIO_ASSUMPTIONS_INVALID");
  const peMultiples = input.pe ? input.pe.split(",").map(Number) : [];
  const resolve = (s) => analyzeWorldCompany(company_filings_r1_default.companies.find((x) => x.symbol === s) || { symbol: s }, { now: now2, peMultiples });
  const company = resolve(symbol), other = comparison ? resolve(comparison) : null;
  const object = (c) => ({ id: c.symbol, type: "COMPANY_FINANCIAL_" + c.period.kind, unit: c.currency, source: c.source.id, time: { start: c.period.start, end: c.period.end }, comparisonBasis: c.period.kind, indicatorId: c.period.kind });
  const comparability = other ? compareWorldObjects(object(company), object(other)) : null;
  return { company, comparison: other ? { company: other, state: comparability.state === "COMPARABLE" ? "COMPARABLE_PERIOD" : "INCOMPARABLE_OR_MISSING_PERIOD", ownerResult: comparability, rankingProduced: false } : null, providerState: "NO_LIVE_PROVIDER_CALLED", storageWrites: 0, feeUSD: 0 };
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/api/current-facts.js
var H = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" };
var json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: H });
async function onRequestPost2(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400);
  }
  ;
  const question = String(body?.question || body?.q || "").trim();
  if (!question) return json({ ok: false, error: "QUESTION_REQUIRED" }, 400);
  const result = await retrieveCurrentFacts({ question, env: context.env || {}, fetcher: fetch });
  return json({ ok: true, result });
}
var requests = /* @__PURE__ */ new Map();
async function onRequestGet3({ request } = {}) {
  if (!request) return json({ ok: false, error: "CURRENT_FACTS_POST_ONLY" }, 405);
  try {
    const u = new URL(request.url);
    if (u.search.length > 240 || [...u.searchParams.keys()].some((k) => u.searchParams.getAll(k).length !== 1)) throw Error();
    if (u.searchParams.get("operation") !== "company") return json({ ok: false, error: "CURRENT_FACTS_POST_ONLY" }, 405);
    const result = retrievePublicCompany(Object.fromEntries(u.searchParams));
    const now2 = Date.now(), bucket = Math.floor(now2 / 6e4), address = request.headers.get("cf-connecting-ip") || "UNSPECIFIED_SHARED_BUCKET";
    const key2 = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(address + ":" + bucket)))).slice(0, 12).join(".");
    for (const [k, v] of requests) if (v.bucket !== bucket) requests.delete(k);
    if (requests.size >= 512 && !requests.has(key2)) return json({ ok: false, error: "PUBLIC_QUERY_CAPACITY" }, 429);
    const count = (requests.get(key2)?.count || 0) + 1;
    requests.set(key2, { bucket, count });
    if (count > 60) return new Response(JSON.stringify({ ok: false, error: "PUBLIC_QUERY_RATE_LIMIT" }), { status: 429, headers: { ...H, "retry-after": "60" } });
    return new Response(JSON.stringify({ ok: true, result }), { headers: { ...H, "cache-control": "public,max-age=300", "vary": "Accept-Encoding" } });
  } catch {
    return json({ ok: false, error: "PUBLIC_COMPANY_QUERY_INVALID" }, 400);
  }
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/api/world-observations.js
var world_observations_exports = {};
__export(world_observations_exports, {
  onRequest: () => onRequest,
  onRequestGet: () => onRequestGet4
});

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/world/world-evidence-series-v1.json
var world_evidence_series_v1_default = {
  contractVersion: "WORLD_EVIDENCE_P1_V1",
  series: {
    US_HMDA: {
      seriesId: "US_HMDA",
      countryCode: "USA",
      unit: "reported_records",
      frequency: "ANNUAL_ACTION_RECORDS",
      populationOrInstitutionCoverage: "HMDA reporting institutions; home-purchase action records, not unique people",
      licenseState: "FEDERAL_PUBLIC_DATA",
      allowedRawHashes: [
        "439f3a462163180af3a0b2ea45a4cdf80207bed1774a103659459aaa2d4fc2de",
        "a964491593a3a5c3789549cb04fb6e404f0922bb239cb3d0cc4c02bcc4ea2a93"
      ],
      sourceUrls: [
        "https://ffiec.cfpb.gov/v2/data-browser-api/view/nationwide/aggregations?years=2024&loan_purposes=1&actions_taken=1,2,3",
        "https://ffiec.cfpb.gov/v2/data-browser-api/view/nationwide/aggregations?years=2025&loan_purposes=1&actions_taken=1,2,3"
      ],
      measurementDefinition: "Home-purchase reported action counts; annual action records, not matched application cohort",
      freshness: "PINNED_HISTORICAL_NOT_REALTIME",
      admission: "BOUNDED_LOCAL_CANDIDATE",
      attribution: "Credit publisher, dataset, period and fetch vintage; no logos/endorsement; third-party content excluded",
      filters: {
        loan_purposes: [
          1
        ],
        actions_taken: [
          1,
          2,
          3
        ],
        excludes: [
          4,
          5,
          6,
          7,
          8
        ],
        notFiltered: [
          "income",
          "lien",
          "occupancy",
          "loan_type",
          "dwelling",
          "business_purpose",
          "reporter_type"
        ],
        preapproval: "Actions7/8 excluded; action1 may include originated preapproval requests"
      }
    },
    US_SLOOS: {
      seriesId: "US_SLOOS",
      countryCode: "USA",
      unit: "respondent_banks",
      frequency: "QUARTERLY_SURVEY",
      populationOrInstitutionCoverage: "49 domestic banks responding for government home-purchase category; not loan-weighted",
      licenseState: "FEDERAL_PUBLIC_DATA",
      allowedRawHashes: [
        "f792defe03173304ebc4f3839b36d7e6b4fd4fd8a6bd73577cace0989b94f24c"
      ],
      sourceUrls: [
        "https://www.federalreserve.gov/data/sloos/sloos-202410-table-1.htm"
      ],
      measurementDefinition: "Government home-purchase standards and demand respondent counts; refinancing excluded",
      freshness: "PINNED_HISTORICAL_NOT_REALTIME",
      admission: "BOUNDED_LOCAL_CANDIDATE",
      attribution: "Credit publisher, dataset, period and fetch vintage; no logos/endorsement; third-party content excluded"
    },
    MY_CPI: {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      unit: "index_2010_100",
      frequency: "MONTHLY",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      licenseState: "CC_BY_4_0",
      allowedRawHashes: [
        "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae"
      ],
      sourceUrls: [
        "https://storage.dosm.gov.my/cpi/cpi_2d.csv"
      ],
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      freshness: "PINNED_HISTORICAL_NOT_REALTIME",
      admission: "BOUNDED_LOCAL_CANDIDATE",
      attribution: "DOSM \xB7 CC BY 4.0 \xB7 derived selection disclosed \xB7 https://creativecommons.org/licenses/by/4.0/"
    },
    MY_INCOME: {
      seriesId: "MY_INCOME",
      countryCode: "MYS",
      unit: "MYR_per_month",
      frequency: "SURVEY_REFERENCE_YEAR",
      populationOrInstitutionCoverage: "Citizen households; nominal gross median monthly household income",
      licenseState: "CC_BY_4_0",
      allowedRawHashes: [
        "f586d78dd004f7002fb59bdcfdce697d81ecfdb67bb2cd72462ecf0a072345b5"
      ],
      sourceUrls: [
        "https://api.data.gov.my/data-catalogue?id=hh_income&limit=100"
      ],
      measurementDefinition: "Survey-reference-year nominal gross median MONTHLY income level, not monthly observations",
      freshness: "PINNED_HISTORICAL_NOT_REALTIME",
      admission: "BOUNDED_LOCAL_CANDIDATE",
      attribution: "DOSM \xB7 CC BY 4.0 \xB7 derived selection disclosed \xB7 https://creativecommons.org/licenses/by/4.0/"
    },
    MY_COHORT: {
      seriesId: "MY_COHORT",
      countryCode: "MYS",
      unit: "matched_application_count",
      frequency: "COHORT",
      populationOrInstitutionCoverage: "Same applications and outcomes with aligned product, period and institution coverage",
      licenseState: "DEFINITION_ONLY",
      allowedRawHashes: [],
      sourceUrls: [],
      measurementDefinition: "MY_COHORT",
      freshness: "PINNED_HISTORICAL_NOT_REALTIME",
      admission: "BOUNDED_LOCAL_CANDIDATE",
      attribution: "No numeric data admitted"
    },
    MECHANISM: {
      seriesId: "MECHANISM",
      countryCode: "GLOBAL",
      unit: "not_applicable",
      frequency: "NOT_APPLICABLE",
      populationOrInstitutionCoverage: "General conditional mechanism; not local empirical observation",
      licenseState: "PHIOS_PUBLIC_EXPLANATION",
      allowedRawHashes: [],
      sourceUrls: [],
      measurementDefinition: "MECHANISM",
      freshness: "PINNED_HISTORICAL_NOT_REALTIME",
      admission: "BOUNDED_LOCAL_CANDIDATE",
      attribution: "No numeric data admitted"
    },
    COMPARISON: {
      seriesId: "COMPARISON",
      countryCode: "GLOBAL",
      unit: "not_comparable",
      frequency: "NOT_APPLICABLE",
      populationOrInstitutionCoverage: "No harmonised international mortgage approval cohort",
      licenseState: "DEFINITION_ONLY",
      allowedRawHashes: [],
      sourceUrls: [],
      measurementDefinition: "COMPARISON",
      freshness: "PINNED_HISTORICAL_NOT_REALTIME",
      admission: "BOUNDED_LOCAL_CANDIDATE",
      attribution: "No numeric data admitted"
    }
  },
  explanations: {
    "zh-Hans": {
      text: "\u6587\u660E\u7ED3\u6784\u6700\u7EC8\u4F1A\u8FDB\u5165\u7A7A\u6C14\u3001\u4F4F\u623F\u3001\u4EA4\u901A\u3001\u5DE5\u4F5C\u3001\u6536\u5165\u4E0E\u751F\u6D3B\u6210\u672C\u3002\u751F\u6D3B\u73AF\u5883\u51B3\u5B9A\u65E5\u5E38\u57FA\u7840\u6761\u4EF6\uFF0C\u5C31\u4E1A\u628A\u4E2A\u4EBA\u63A5\u5165\u793E\u4F1A\u8D44\u6E90\u4E0E\u804C\u4E1A\u8DEF\u5F84\uFF0C\u6536\u5165\u4E0E\u5FC5\u8981\u6210\u672C\u4E4B\u95F4\u7684\u4F59\u91CF\u5219\u5F71\u54CD\u5BB6\u5EAD\u7F13\u51B2\u548C\u8F6C\u6362\u80FD\u529B\u3002",
      canonicalUrl: "https://getphios.com/articles/book6-environment-work-income?locale=zh-Hans#article-body",
      sourcePath: "/content/knowledge/public/successors/book6-publication-v1/visual-articles/zh-Hans/book6-environment-work-income.json",
      rawArtifactHash: "66222b7a3a4ab886e1c154511e49a87ea1a7fc960ef79c6915388fa3325f9789",
      locator: "/sections/0/blocks/0",
      sourceVersion: "1.0.0",
      publishedAt: "2026-09-24",
      kind: "PHIOS_PUBLISHED_INTERPRETATION_NOT_STATISTICAL_FACT"
    },
    en: {
      text: "Civilizational structures eventually enter daily life through air, housing, transport, work, income and living costs. Living environment shapes basic conditions, employment connects people to resources and career paths, and the margin between income and necessary costs affects household buffers and capacity to change.",
      canonicalUrl: "https://getphios.com/articles/book6-environment-work-income?locale=en#article-body",
      sourcePath: "/content/knowledge/public/successors/book6-publication-v1/visual-articles/en/book6-environment-work-income.json",
      rawArtifactHash: "d41e4df032036e4f35901e1eb7b66990fd168a4385100b5be0d4e6ab7165ebe2",
      locator: "/sections/0/blocks/0",
      sourceVersion: "1.0.0",
      publishedAt: "2026-09-24",
      kind: "PHIOS_PUBLISHED_INTERPRETATION_NOT_STATISTICAL_FACT"
    }
  },
  mechanismSources: [
    {
      sourceUrl: "https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-fixed-rate-and-adjustable-rate-mortgage-arm-loan-en-100/",
      sourcePublisher: "CFPB",
      type: "OFFICIAL_GENERAL_EXPLANATION_NOT_MY_LEGAL_ADVICE",
      readAt: "2026-10-20T04:14:27.952570+00:00"
    },
    {
      sourceUrl: "https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-mortgage-interest-rate-and-an-apr-en-135/",
      sourcePublisher: "CFPB",
      type: "OFFICIAL_GENERAL_EXPLANATION",
      readAt: "2026-10-20T04:14:27.952570+00:00"
    }
  ]
};

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/world/world-evidence-observations-v1.json
var world_evidence_observations_v1_default = {
  contractVersion: "WORLD_EVIDENCE_P1_V1",
  vintage: "2026-10-20_GATE2C_PINNED",
  observations: [
    {
      seriesId: "US_HMDA",
      countryCode: "USA",
      value: 161054,
      unit: "reported_records",
      frequency: "ANNUAL_ACTION_RECORDS",
      periodStart: "2024-01-01",
      periodEnd: "2024-12-31",
      measurementDefinition: "Home-purchase reported action counts; annual action records, not matched application cohort",
      populationOrInstitutionCoverage: "HMDA reporting institutions; home-purchase action records, not unique people",
      sourcePublisher: "FFIEC / CFPB",
      sourceDataset: "hmda-aggregate-2024",
      sourceUrl: "https://ffiec.cfpb.gov/v2/data-browser-api/view/nationwide/aggregations?years=2024&loan_purposes=1&actions_taken=1,2,3",
      observationPeriod: "2024",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.040868+00:00",
      sourceVersion: "SHA256:439f3a462163180af3a0b2ea45a4cdf80207bed1774a103659459aaa2d4fc2de",
      rawArtifactHash: "439f3a462163180af3a0b2ea45a4cdf80207bed1774a103659459aaa2d4fc2de",
      rawLocator: "data[action_taken=2].count",
      transformationId: "identity",
      licenseState: "FEDERAL_PUBLIC_DATA",
      qualityState: "OBSERVED",
      nullReason: null,
      actionCode: 2
    },
    {
      seriesId: "US_HMDA",
      countryCode: "USA",
      value: 623942,
      unit: "reported_records",
      frequency: "ANNUAL_ACTION_RECORDS",
      periodStart: "2024-01-01",
      periodEnd: "2024-12-31",
      measurementDefinition: "Home-purchase reported action counts; annual action records, not matched application cohort",
      populationOrInstitutionCoverage: "HMDA reporting institutions; home-purchase action records, not unique people",
      sourcePublisher: "FFIEC / CFPB",
      sourceDataset: "hmda-aggregate-2024",
      sourceUrl: "https://ffiec.cfpb.gov/v2/data-browser-api/view/nationwide/aggregations?years=2024&loan_purposes=1&actions_taken=1,2,3",
      observationPeriod: "2024",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.040868+00:00",
      sourceVersion: "SHA256:439f3a462163180af3a0b2ea45a4cdf80207bed1774a103659459aaa2d4fc2de",
      rawArtifactHash: "439f3a462163180af3a0b2ea45a4cdf80207bed1774a103659459aaa2d4fc2de",
      rawLocator: "data[action_taken=3].count",
      transformationId: "identity",
      licenseState: "FEDERAL_PUBLIC_DATA",
      qualityState: "OBSERVED",
      nullReason: null,
      actionCode: 3
    },
    {
      seriesId: "US_HMDA",
      countryCode: "USA",
      value: 3534113,
      unit: "reported_records",
      frequency: "ANNUAL_ACTION_RECORDS",
      periodStart: "2024-01-01",
      periodEnd: "2024-12-31",
      measurementDefinition: "Home-purchase reported action counts; annual action records, not matched application cohort",
      populationOrInstitutionCoverage: "HMDA reporting institutions; home-purchase action records, not unique people",
      sourcePublisher: "FFIEC / CFPB",
      sourceDataset: "hmda-aggregate-2024",
      sourceUrl: "https://ffiec.cfpb.gov/v2/data-browser-api/view/nationwide/aggregations?years=2024&loan_purposes=1&actions_taken=1,2,3",
      observationPeriod: "2024",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.040868+00:00",
      sourceVersion: "SHA256:439f3a462163180af3a0b2ea45a4cdf80207bed1774a103659459aaa2d4fc2de",
      rawArtifactHash: "439f3a462163180af3a0b2ea45a4cdf80207bed1774a103659459aaa2d4fc2de",
      rawLocator: "data[action_taken=1].count",
      transformationId: "identity",
      licenseState: "FEDERAL_PUBLIC_DATA",
      qualityState: "OBSERVED",
      nullReason: null,
      actionCode: 1
    },
    {
      seriesId: "US_HMDA",
      countryCode: "USA",
      value: 3592033,
      unit: "reported_records",
      frequency: "ANNUAL_ACTION_RECORDS",
      periodStart: "2025-01-01",
      periodEnd: "2025-12-31",
      measurementDefinition: "Home-purchase reported action counts; annual action records, not matched application cohort",
      populationOrInstitutionCoverage: "HMDA reporting institutions; home-purchase action records, not unique people",
      sourcePublisher: "FFIEC / CFPB",
      sourceDataset: "hmda-aggregate-2025",
      sourceUrl: "https://ffiec.cfpb.gov/v2/data-browser-api/view/nationwide/aggregations?years=2025&loan_purposes=1&actions_taken=1,2,3",
      observationPeriod: "2025",
      publishedAt: null,
      retrievedAt: "2026-10-20T03:02:25.807207+00:00",
      sourceVersion: "SHA256:a964491593a3a5c3789549cb04fb6e404f0922bb239cb3d0cc4c02bcc4ea2a93",
      rawArtifactHash: "a964491593a3a5c3789549cb04fb6e404f0922bb239cb3d0cc4c02bcc4ea2a93",
      rawLocator: "data[action_taken=1].count",
      transformationId: "identity",
      licenseState: "FEDERAL_PUBLIC_DATA",
      qualityState: "OBSERVED",
      nullReason: null,
      actionCode: 1
    },
    {
      seriesId: "US_HMDA",
      countryCode: "USA",
      value: 158865,
      unit: "reported_records",
      frequency: "ANNUAL_ACTION_RECORDS",
      periodStart: "2025-01-01",
      periodEnd: "2025-12-31",
      measurementDefinition: "Home-purchase reported action counts; annual action records, not matched application cohort",
      populationOrInstitutionCoverage: "HMDA reporting institutions; home-purchase action records, not unique people",
      sourcePublisher: "FFIEC / CFPB",
      sourceDataset: "hmda-aggregate-2025",
      sourceUrl: "https://ffiec.cfpb.gov/v2/data-browser-api/view/nationwide/aggregations?years=2025&loan_purposes=1&actions_taken=1,2,3",
      observationPeriod: "2025",
      publishedAt: null,
      retrievedAt: "2026-10-20T03:02:25.807207+00:00",
      sourceVersion: "SHA256:a964491593a3a5c3789549cb04fb6e404f0922bb239cb3d0cc4c02bcc4ea2a93",
      rawArtifactHash: "a964491593a3a5c3789549cb04fb6e404f0922bb239cb3d0cc4c02bcc4ea2a93",
      rawLocator: "data[action_taken=2].count",
      transformationId: "identity",
      licenseState: "FEDERAL_PUBLIC_DATA",
      qualityState: "OBSERVED",
      nullReason: null,
      actionCode: 2
    },
    {
      seriesId: "US_HMDA",
      countryCode: "USA",
      value: 607818,
      unit: "reported_records",
      frequency: "ANNUAL_ACTION_RECORDS",
      periodStart: "2025-01-01",
      periodEnd: "2025-12-31",
      measurementDefinition: "Home-purchase reported action counts; annual action records, not matched application cohort",
      populationOrInstitutionCoverage: "HMDA reporting institutions; home-purchase action records, not unique people",
      sourcePublisher: "FFIEC / CFPB",
      sourceDataset: "hmda-aggregate-2025",
      sourceUrl: "https://ffiec.cfpb.gov/v2/data-browser-api/view/nationwide/aggregations?years=2025&loan_purposes=1&actions_taken=1,2,3",
      observationPeriod: "2025",
      publishedAt: null,
      retrievedAt: "2026-10-20T03:02:25.807207+00:00",
      sourceVersion: "SHA256:a964491593a3a5c3789549cb04fb6e404f0922bb239cb3d0cc4c02bcc4ea2a93",
      rawArtifactHash: "a964491593a3a5c3789549cb04fb6e404f0922bb239cb3d0cc4c02bcc4ea2a93",
      rawLocator: "data[action_taken=3].count",
      transformationId: "identity",
      licenseState: "FEDERAL_PUBLIC_DATA",
      qualityState: "OBSERVED",
      nullReason: null,
      actionCode: 3
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 131.4,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-01",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-01-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 132.1,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-02-01",
      periodEnd: "2024-02-29",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-02",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-02-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 132.2,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-03-01",
      periodEnd: "2024-03-31",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-03",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-03-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 132.4,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-04-01",
      periodEnd: "2024-04-30",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-04",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-04-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 132.8,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-05-01",
      periodEnd: "2024-05-31",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-05",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-05-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 133,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-06-01",
      periodEnd: "2024-06-30",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-06",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-06-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 133.1,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-07-01",
      periodEnd: "2024-07-31",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-07",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-07-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 133.2,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-08-01",
      periodEnd: "2024-08-31",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-08",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-08-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 133.2,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-09-01",
      periodEnd: "2024-09-30",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-09",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-09-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 133.4,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-10-01",
      periodEnd: "2024-10-31",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-10",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-10-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 133.3,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-11-01",
      periodEnd: "2024-11-30",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-11",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-11-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_CPI",
      countryCode: "MYS",
      value: 133.4,
      unit: "index_2010_100",
      frequency: "MONTHLY",
      periodStart: "2024-12-01",
      periodEnd: "2024-12-31",
      measurementDefinition: "Monthly overall CPI index, 2010=100; not an inflation percentage",
      populationOrInstitutionCoverage: "DOSM national consumer price basket; not citizen-household income survey",
      sourcePublisher: "DOSM",
      sourceDataset: "my-cpi-full",
      sourceUrl: "https://storage.dosm.gov.my/cpi/cpi_2d.csv",
      observationPeriod: "2024-12",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.038197+00:00",
      sourceVersion: "SHA256:9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawArtifactHash: "9f5f33b4e6209c6bfbb9320260a2591bd9e38666c908dee85047bf63880649ae",
      rawLocator: "CSV date=2024-12-01,division=overall,index",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_INCOME",
      countryCode: "MYS",
      value: 6338,
      unit: "MYR_per_month",
      frequency: "SURVEY_REFERENCE_YEAR",
      periodStart: "2022-01-01",
      periodEnd: "2022-12-31",
      measurementDefinition: "Survey-reference-year nominal gross median MONTHLY income level, not monthly observations",
      populationOrInstitutionCoverage: "Citizen households; nominal gross median monthly household income",
      sourcePublisher: "DOSM",
      sourceDataset: "my-income",
      sourceUrl: "https://api.data.gov.my/data-catalogue?id=hh_income&limit=100",
      observationPeriod: "2022",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.039254+00:00",
      sourceVersion: "SHA256:f586d78dd004f7002fb59bdcfdce697d81ecfdb67bb2cd72462ecf0a072345b5",
      rawArtifactHash: "f586d78dd004f7002fb59bdcfdce697d81ecfdb67bb2cd72462ecf0a072345b5",
      rawLocator: "income_median; date=2022-01-01",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "MY_INCOME",
      countryCode: "MYS",
      value: 7017,
      unit: "MYR_per_month",
      frequency: "SURVEY_REFERENCE_YEAR",
      periodStart: "2024-01-01",
      periodEnd: "2024-12-31",
      measurementDefinition: "Survey-reference-year nominal gross median MONTHLY income level, not monthly observations",
      populationOrInstitutionCoverage: "Citizen households; nominal gross median monthly household income",
      sourcePublisher: "DOSM",
      sourceDataset: "my-income",
      sourceUrl: "https://api.data.gov.my/data-catalogue?id=hh_income&limit=100",
      observationPeriod: "2024",
      publishedAt: null,
      retrievedAt: "2026-10-20T02:50:53.039254+00:00",
      sourceVersion: "SHA256:f586d78dd004f7002fb59bdcfdce697d81ecfdb67bb2cd72462ecf0a072345b5",
      rawArtifactHash: "f586d78dd004f7002fb59bdcfdce697d81ecfdb67bb2cd72462ecf0a072345b5",
      rawLocator: "income_median; date=2024-01-01",
      transformationId: "identity",
      licenseState: "CC_BY_4_0",
      qualityState: "OBSERVED",
      nullReason: null
    },
    {
      seriesId: "US_SLOOS",
      countryCode: "USA",
      value: 1,
      unit: "respondent_banks",
      frequency: "QUARTERLY_SURVEY",
      periodStart: "2024-07-01",
      periodEnd: "2024-09-30",
      measurementDefinition: "Government home-purchase standards and demand respondent counts; refinancing excluded",
      populationOrInstitutionCoverage: "49 domestic banks responding for government home-purchase category; not loan-weighted",
      sourcePublisher: "Federal Reserve Board",
      sourceDataset: "fed-table-corrected",
      sourceUrl: "https://www.federalreserve.gov/data/sloos/sloos-202410-table-1.htm",
      observationPeriod: "2024-Q3",
      publishedAt: "2024-11-12",
      retrievedAt: "2026-10-20T02:50:53.039787+00:00",
      sourceVersion: "SHA256:f792defe03173304ebc4f3839b36d7e6b4fd4fd8a6bd73577cace0989b94f24c",
      rawArtifactHash: "f792defe03173304ebc4f3839b36d7e6b4fd4fd8a6bd73577cace0989b94f24c",
      rawLocator: "13. Over / B. Credit standards / all respondent counts",
      transformationId: "respondent_count",
      licenseState: "FEDERAL_PUBLIC_DATA",
      qualityState: "OBSERVED",
      nullReason: null,
      surveyMeasure: "standards",
      oppositeCount: 0,
      respondentCount: 49,
      questionCode: "Q13B"
    },
    {
      seriesId: "US_SLOOS",
      countryCode: "USA",
      value: 5,
      unit: "respondent_banks",
      frequency: "QUARTERLY_SURVEY",
      periodStart: "2024-07-01",
      periodEnd: "2024-09-30",
      measurementDefinition: "Government home-purchase standards and demand respondent counts; refinancing excluded",
      populationOrInstitutionCoverage: "49 domestic banks responding for government home-purchase category; not loan-weighted",
      sourcePublisher: "Federal Reserve Board",
      sourceDataset: "fed-table-corrected",
      sourceUrl: "https://www.federalreserve.gov/data/sloos/sloos-202410-table-1.htm",
      observationPeriod: "2024-Q3",
      publishedAt: "2024-11-12",
      retrievedAt: "2026-10-20T02:50:53.039787+00:00",
      sourceVersion: "SHA256:f792defe03173304ebc4f3839b36d7e6b4fd4fd8a6bd73577cace0989b94f24c",
      rawArtifactHash: "f792defe03173304ebc4f3839b36d7e6b4fd4fd8a6bd73577cace0989b94f24c",
      rawLocator: "14. Apart / B. Demand / all respondent counts",
      transformationId: "respondent_count",
      licenseState: "FEDERAL_PUBLIC_DATA",
      qualityState: "OBSERVED",
      nullReason: null,
      surveyMeasure: "demand",
      oppositeCount: 10,
      respondentCount: 49,
      questionCode: "Q14B"
    }
  ],
  limits: [
    "Historical fetch vintage, not real-time or frozen annual HMDA Snapshot",
    "Original per-observation publication/revision dates incomplete",
    "No matched MY application cohort counts; amounts cannot measure individual approval probability"
  ]
};

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/_lib/world-evidence.js
var EVIDENCE_COUNTRIES = Object.freeze(["USA", "MYS", "CHN", "JPN", "GBR", "EA", "GLOBAL"]);
function evidenceRequest(input) {
  if (Object.keys(input).some((k) => !["country", "series", "period"].includes(k)) || Object.values(input).some((v) => typeof v !== "string" || v.length > 40)) throw Error("PUBLIC_ENUMS_ONLY");
  if (!EVIDENCE_COUNTRIES.includes(input.country) || !world_evidence_series_v1_default.series[input.series] || !(/^(?:19\d{2}|20\d{2}|2100)(?:-Q[1-4])?$/.test(input.period) || input.period === "GENERAL")) throw Error("EVIDENCE_INPUT_INVALID");
  return { country: input.country, series: input.series, period: input.period };
}
function observationQuality(row, definition, query) {
  if (row.countryCode !== query.country || row.seriesId !== query.series || !row.observationPeriod.startsWith(query.period)) return "DEFINITION_MISMATCH";
  if (row.unit !== definition.unit || row.frequency !== definition.frequency || row.populationOrInstitutionCoverage !== definition.populationOrInstitutionCoverage || row.measurementDefinition !== definition.measurementDefinition) return "INCOMPARABLE";
  if (!["FEDERAL_PUBLIC_DATA", "CC_BY_4_0"].includes(row.licenseState) || row.licenseState !== definition.licenseState) return "NO_ACCESS";
  if (!definition.allowedRawHashes.includes(row.rawArtifactHash) || !definition.sourceUrls.includes(row.sourceUrl)) return "SOURCE_ERROR";
  if (row.value === null) return row.qualityState === "OBSERVED" ? "SOURCE_ERROR" : row.qualityState;
  if (typeof row.value !== "number" || !Number.isFinite(row.value) || row.value < 0) return "SOURCE_ERROR";
  if (!["OBSERVED", "NO_RELEASE", "NO_ACCESS", "MISSING_PERIOD", "DEFINITION_MISMATCH", "INCOMPARABLE", "SOURCE_ERROR", "STALE"].includes(row.qualityState)) return "SOURCE_ERROR";
  return row.qualityState;
}
function calculateHmda(rows2) {
  const counts = Object.fromEntries(rows2.map((r) => [r.actionCode, r.value]));
  if (rows2.length !== 3 || Object.keys(counts).length !== 3 || ![1, 2, 3].every((k) => Number.isSafeInteger(counts[k]) && counts[k] >= 0)) throw Error("ACTION_COUNTS_INVALID");
  const denominator = counts[1] + counts[2] + counts[3];
  if (!denominator || !Number.isSafeInteger(denominator)) throw Error("ZERO_OR_UNSAFE_DENOMINATOR");
  return { metric: "denial_share_in_defined_hmda_scope", value: counts[3] / denominator, unit: "share", numerator: counts[3], denominator, formula: "action3 / (action1 + action2 + action3)", actionCounts: counts, loanPurpose: 1, excludedActions: [4, 5, 6, 7, 8], population: "Reported home-purchase action records; not unique applicants or a matched application cohort" };
}
function readWorldEvidence(input, { definitions: definitions2 = world_evidence_series_v1_default, snapshots = world_evidence_observations_v1_default, now: now2 = () => (/* @__PURE__ */ new Date()).toISOString() } = {}) {
  const query = evidenceRequest(input), definition = definitions2.series[query.series];
  const result = { ...query, state: "OBSERVED", definition, observations: [], derivedMetrics: [], explanations: definitions2.explanations, mechanismSources: definitions2.mechanismSources, version: snapshots.vintage, computedAt: now2(), providerUsed: false, accountDataUsed: false, limits: snapshots.limits };
  if (!definition) return { ...result, state: "SOURCE_ERROR" };
  if (definition.countryCode !== query.country) return { ...result, state: "DEFINITION_MISMATCH" };
  if (["MY_COHORT", "MECHANISM", "COMPARISON"].includes(query.series)) return { ...result, state: query.series === "COMPARISON" ? "INCOMPARABLE" : "NO_RELEASE", nullReason: query.series === "MY_COHORT" ? "MATCHED_APPLICATION_COHORT_COUNTS_UNAVAILABLE" : query.series === "COMPARISON" ? "HARMONISED_DENOMINATOR_UNAVAILABLE" : "GENERAL_EXPLANATION_ONLY" };
  const rows2 = snapshots.observations.filter((r) => r.seriesId === query.series && r.observationPeriod.startsWith(query.period));
  if (!rows2.length) return { ...result, state: "MISSING_PERIOD" };
  for (const row of rows2) {
    const quality = observationQuality(row, definition, query);
    if (quality !== "OBSERVED") return { ...result, state: quality, nullReason: "EVIDENCE_QUALITY_GATE" };
  }
  if (query.series === "US_HMDA" && (JSON.stringify(definition.filters?.actions_taken) !== "[1,2,3]" || JSON.stringify(definition.filters?.loan_purposes) !== "[1]")) return { ...result, state: "DEFINITION_MISMATCH" };
  result.observations = rows2;
  try {
    if (query.series === "US_HMDA") result.derivedMetrics = [calculateHmda(rows2)];
    if (query.series === "US_SLOOS") result.derivedMetrics = rows2.map((r) => {
      if (!Number.isSafeInteger(r.respondentCount) || r.respondentCount <= 0 || !Number.isSafeInteger(r.oppositeCount) || r.oppositeCount < 0 || r.value + r.oppositeCount > r.respondentCount) throw Error("SURVEY_COUNTS_INVALID");
      return { metric: r.surveyMeasure === "standards" ? "net_tightening" : "net_stronger_demand", questionCode: r.questionCode, value: (r.value - r.oppositeCount) / r.respondentCount * 100, unit: "percent_respondent_banks", numerator: r.value - r.oppositeCount, denominator: r.respondentCount, formula: r.surveyMeasure === "standards" ? "(tightened - eased) / respondents * 100" : "(stronger - weaker) / respondents * 100", positiveCount: r.value, oppositeCount: r.oppositeCount };
    });
  } catch {
    return { ...result, state: "SOURCE_ERROR", observations: [], derivedMetrics: [], nullReason: "DERIVATION_INVALID" };
  }
  return result;
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/api/world-observations.js
async function onRequestGet4({ request, env = {} }) {
  try {
    const u = new URL(request.url);
    if (u.search.length > 300 || [...u.searchParams.keys()].some((k) => u.searchParams.getAll(k).length !== 1)) throw Error("DUPLICATE_OR_LONG_FIELD");
    if (u.searchParams.get("dataset") === "MY_CPI") {
      if (env.PHIOS_ENVIRONMENT !== "local" || env.PHIOS_WORLD_R4_LOCAL_ENABLED !== "true" || typeof env.WORLD_R4_READ !== "function") return Response.json({ ok: false, error: "LOCAL_MEASUREMENT_NOT_ENABLED" }, { status: 503, headers: { "cache-control": "no-store" } });
      return Response.json({ ok: true, ...await env.WORLD_R4_READ(Object.fromEntries(u.searchParams)) }, { headers: { "cache-control": "no-store" } });
    }
    if (u.searchParams.has("series")) {
      const evidence = readWorldEvidence(Object.fromEntries(u.searchParams));
      return Response.json({ ok: !["SOURCE_ERROR", "NO_ACCESS"].includes(evidence.state), evidence }, { headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
    }
    const result = await readWorldBankObservation(Object.fromEntries(u.searchParams));
    return Response.json({ ok: !["SERVICE_ERROR", "TIMEOUT", "INVALID_RESPONSE", "IDENTITY_MISMATCH", "UNIT_MISMATCH"].includes(result.state), observation: result }, { headers: { "cache-control": "public,max-age=300", "x-content-type-options": "nosniff" } });
  } catch {
    return Response.json({ ok: false, error: "PUBLIC_OBSERVATION_INPUT_INVALID" }, { status: 400 });
  }
}
var onRequest = (context) => context.request.method === "GET" ? onRequestGet4(context) : new Response(null, { status: 405, headers: { Allow: "GET" } });

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/api/book6-runtime-readout.js
var book6_runtime_readout_exports = {};
__export(book6_runtime_readout_exports, {
  onRequestGet: () => onRequestGet5
});

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/runtime-position-w8c-current-evidence-ir-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-af-w8c-current-authority-admission-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-eu-w8c-current-authority-admission-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-in-w8c-current-authority-admission-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-jp-w8c-current-authority-admission-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-kr-w8c-current-authority-admission-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-latam-w8c-current-authority-admission-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-me-w8c-current-authority-admission-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-ru-w8c-current-authority-admission-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-sea-w8c-current-authority-admission-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/_lib/book6-accepted-current.js
var fail3 = (code) => {
  throw Object.assign(Error(code), { code, status: 409 });
};
function projectAcceptedBook6Current({ accepted, humanDecisions, readout, externalEvidence: externalEvidence2 = [], sourceEvidence = [], asOf = (/* @__PURE__ */ new Date()).toISOString() }) {
  if (accepted?.status !== "ACCEPTED_CURRENT_DOSSIER" || accepted.stage !== "W8-I" || accepted.dossierId !== humanDecisions?.dossierId || humanDecisions.status !== "HUMAN_DECISIONS_RECORDED" || readout?.dossierId !== accepted.dossierId) fail3("BOOK6_ACCEPTED_CURRENT_LINEAGE_REQUIRED");
  const positions = accepted.admittedPositions || [];
  for (const p of positions) {
    if (!humanDecisions.records.some((r) => r.decision === "ACCEPT" && r.candidateId === p.candidateId && r.runtimePositionId === p.runtimePositionId && r.scope === p.scope && r.subsystem === p.subsystem) || !p.grammarId || !p.realityDomainId || p.scope !== "SUBSYSTEM" || !p.evidenceRefs?.length) fail3("BOOK6_POSITION_NOT_HUMAN_ACCEPTED");
    const ref = p.readoutReference || accepted.readoutReference;
    if (!ref || ref.digest !== readout.readoutReference?.digest || ref.code !== readout.readoutReference?.code) fail3("BOOK6_ACCEPTED_READOUT_DIGEST_MISMATCH");
    if (p.evidenceRefs.some((id2) => !readout.evidenceRefs?.includes(id2))) fail3("BOOK6_ACCEPTED_EVIDENCE_REFERENCE_MISSING");
  }
  const validSources = sourceEvidence.filter((r) => readout.evidenceRefs.includes(r.claimId));
  const covered = new Set(validSources.map((r) => r.claimId)), missingTimestampEvidence = readout.evidenceRefs.filter((id2) => !covered.has(id2));
  const latest2 = validSources.map((r) => r.retrievedAt).sort().at(-1) || readout.latestEvidenceAt || null;
  return { ...structuredClone(readout), schemaVersion: "BOOK6_ACCEPTED_CURRENT_CUSTOMER_PROJECTION_V1", dossierId: accepted.dossierId, sourceVersion: accepted.schemaVersion, acceptance: "HUMAN_ACCEPTED_SUBSYSTEM_POSITIONS_ONLY", acceptedAt: accepted.acceptedAt || humanDecisions.decidedAt, acceptedPositions: structuredClone(positions), wholeDossierPosition: "UNKNOWN", unknowns: structuredClone(accepted.preservedUnknowns || accepted.unresolvedSemanticBasis || accepted.preservedReferenceOnly || []), conflicts: structuredClone(accepted.preservedConflicts || []), currentTimestamp: asOf, sourceTimestamp: latest2, sourceEvidence: structuredClone(validSources), missingTimestampEvidence, currentness: latest2 ? "SOURCE_TIMESTAMPS_BOUND_CURRENT_FRESHNESS_NOT_INFERRED" : "CURRENTNESS_UNKNOWN", currentEvidenceRefreshRequired: !latest2, currentFreshnessAssessment: "UNKNOWN_UNLESS_SOURCE_SPECIFIC_CURRENT_POLICY_VERIFIED", externalEvidence: structuredClone(externalEvidence2), boundaries: { ...accepted.projectionBoundary, noPositionRederivation: true, noWholeDossierPromotion: true, providerObservationIsNotPositionAuthority: true }, providerCalls: 0 };
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/runtime-position-w8d-rre-readouts-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/moomoo-provider-validated-claims-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/moomoo-provider-w8c-admission-results-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/moomoo-provider-rre-eligible-handoff-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-af-w8i-accepted-current-dossier-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-af-w8h-human-decisions-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-af-w8d-rre-readout-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-cn-w8i-accepted-current-dossier-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-cn-w8h-human-decisions-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-eu-w8i-accepted-current-dossier-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-eu-w8h-human-decisions-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-eu-w8d-rre-readout-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-in-w8i-accepted-current-dossier-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-in-w8h-human-decisions-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-in-w8d-rre-readout-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-jp-w8i-accepted-current-dossier-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-jp-w8h-human-decisions-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-jp-w8d-rre-readout-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-kr-w8i-accepted-current-dossier-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-kr-w8h-human-decisions-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-kr-w8d-rre-readout-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-latam-w8i-accepted-current-dossier-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-latam-w8h-human-decisions-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-latam-w8d-rre-readout-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-me-w8i-accepted-current-dossier-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-me-w8h-human-decisions-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-me-w8d-rre-readout-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-ru-w8i-accepted-current-dossier-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-ru-w8h-human-decisions-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-ru-w8d-rre-readout-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-sea-w8i-accepted-current-dossier-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-sea-w8h-human-decisions-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-sea-w8d-rre-readout-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-us-w8i-accepted-current-dossier-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/content/civilization-atlas/reconfiguration/dossier-us-w8h-human-decisions-v1.json
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

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/_lib/book6-current-source.js
var rows = [{ accepted: dossier_af_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_af_w8h_human_decisions_v1_default, readout: dossier_af_w8d_rre_readout_v1_default }, { accepted: dossier_cn_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_cn_w8h_human_decisions_v1_default, readout: runtime_position_w8d_rre_readouts_v1_default.records.find((r) => r.dossierId === dossier_cn_w8i_accepted_current_dossier_v1_default.dossierId) }, { accepted: dossier_eu_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_eu_w8h_human_decisions_v1_default, readout: dossier_eu_w8d_rre_readout_v1_default }, { accepted: dossier_in_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_in_w8h_human_decisions_v1_default, readout: dossier_in_w8d_rre_readout_v1_default }, { accepted: dossier_jp_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_jp_w8h_human_decisions_v1_default, readout: dossier_jp_w8d_rre_readout_v1_default }, { accepted: dossier_kr_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_kr_w8h_human_decisions_v1_default, readout: dossier_kr_w8d_rre_readout_v1_default }, { accepted: dossier_latam_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_latam_w8h_human_decisions_v1_default, readout: dossier_latam_w8d_rre_readout_v1_default }, { accepted: dossier_me_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_me_w8h_human_decisions_v1_default, readout: dossier_me_w8d_rre_readout_v1_default }, { accepted: dossier_ru_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_ru_w8h_human_decisions_v1_default, readout: dossier_ru_w8d_rre_readout_v1_default }, { accepted: dossier_sea_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_sea_w8h_human_decisions_v1_default, readout: dossier_sea_w8d_rre_readout_v1_default }, { accepted: dossier_us_w8i_accepted_current_dossier_v1_default, humanDecisions: dossier_us_w8h_human_decisions_v1_default, readout: runtime_position_w8d_rre_readouts_v1_default.records.find((r) => r.dossierId === dossier_us_w8i_accepted_current_dossier_v1_default.dossierId) }];
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
function getAcceptedBook6Projection(id2, asOf = (/* @__PURE__ */ new Date()).toISOString()) {
  const row = rows.find((r) => r.accepted.dossierId === id2);
  return row ? projectAcceptedBook6Current({ ...row, asOf, externalEvidence: externalEvidence(id2, asOf), sourceEvidence: admittedTimestampSources(row, asOf) }) : null;
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/_lib/book6-public-provider-boundary.js
function publicBook6ProviderBoundary(projection) {
  if (!projection) return projection;
  const evidence = projection.externalEvidence || [];
  const withheld = evidence.filter((e) => String(e.sourceId || "").startsWith("MOOMOO-") || /^https:\/\/webapi\.moomoo\.com\//i.test(e.sourceUrl || ""));
  return { ...projection, externalEvidence: evidence.filter((e) => !withheld.includes(e)), externalProviderDisplay: { state: withheld.length ? "RIGHTS_UNVERIFIED_WITHHELD" : "NO_UNVERIFIED_PROVIDER_FIELDS", withheldRecords: withheld.length, acceptedPositionsUnchanged: true } };
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/api/book6-runtime-readout.js
async function onRequestGet5({ request }) {
  try {
    const id2 = new URL(request.url).searchParams.get("dossier")?.trim().toUpperCase(), projection = publicBook6ProviderBoundary(getAcceptedBook6Projection(id2));
    return projection ? Response.json({ ok: true, projection }, { headers: { "cache-control": "public, max-age=60" } }) : Response.json({ ok: false, error: "BOOK6_ACCEPTED_DOSSIER_NOT_FOUND" }, { status: 404 });
  } catch (e) {
    return Response.json({ ok: false, error: e.code || "BOOK6_ACCEPTED_PROJECTION_FAILED" }, { status: e.status || 409 });
  }
}

// ../Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/spw-native-owners.mjs
var native = { subject: customer_subject_workspace_exports, intent: client_intent_route_exports, company: current_facts_exports, observations: world_observations_exports, readout: book6_runtime_readout_exports };
export {
  native
};
