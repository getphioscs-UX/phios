// assets/customer-ui/js/visuals/profile-visual-mvp.js
var list = (v) => Array.isArray(v) ? v : [];
var esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var zh = (l) => l === "zh-Hans";
var humanize = (v) => String(v ?? "").replaceAll("::", " \xB7 ").replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
var stateReady = (fig) => fig?.state === "READY";
function nativeValue(v) {
  if (v == null) return "\u2014";
  if (typeof v === "number" || typeof v === "string") return String(v);
  if (typeof v.normalizedSelfReportIndex === "number") return `${Math.round(v.normalizedSelfReportIndex)}/100`;
  if (typeof v.score === "number") return String(v.score);
  if (typeof v.rawScore === "number") return String(v.rawScore);
  if (typeof v.correctCount === "number") return String(v.correctCount);
  const pairs = Object.entries(v).filter(([, x]) => ["number", "string", "boolean"].includes(typeof x)).slice(0, 2);
  return pairs.length ? pairs.map(([k, x]) => `${humanize(k)} ${x}`).join(" \xB7 ") : "\u2014";
}
var empty = (fig, locale, detail = "") => `<section class="prf-pfig prf-pfig--empty" data-pfig="${esc(fig?.pfig || "")}"><div class="prf-pfig-empty__mark" aria-hidden="true"></div><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u8D44\u6599\u4ECD\u5728\u5F62\u6210" : "Evidence still forming"}</p><h3>${esc(fig?.customerLabel?.[locale] || fig?.customerLabel?.en || "Profile view")}</h3><p>${esc(detail || (zh(locale) ? "\u76EE\u524D\u6CA1\u6709\u8DB3\u591F\u3001\u53EF\u76F4\u63A5\u6295\u5F71\u7684\u8BC1\u636E\uFF1BPHI OS \u4E0D\u4F1A\u8865\u5199\u7F3A\u5931\u7ED3\u679C\u3002" : "There is not enough governed evidence to render this view yet. PHI OS will not fill the gaps."))}</p></div></section>`;
function dimensionMap(fig, locale) {
  if (!stateReady(fig)) return empty(fig, locale, zh(locale) ? "\u5B8C\u6210\u4E00\u4E2A Profile \u6765\u6E90\u540E\uFF0C\u8FD9\u91CC\u4F1A\u6309\u6765\u6E90\u5206\u522B\u663E\u793A\u53EF\u89C2\u5BDF\u7EF4\u5EA6\u3002" : "Complete a Profile source to see its dimensions here, kept separate by source.");
  const lanes = list(fig.data?.lanes);
  return `<section class="prf-pfig prf-pfig--dimension" data-pfig="PFIG-001"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u6765\u6E90\u5206\u5C42" : "SOURCE-AWARE"}</p><h3>${zh(locale) ? "\u4E2A\u4EBA\u8BC1\u636E\u7EF4\u5EA6\u5730\u56FE" : "Personal evidence dimension map"}</h3></div><p>${zh(locale) ? "\u6BCF\u4E00\u7EC4\u90FD\u4FDD\u7559\u539F\u59CB\u6765\u6E90\uFF0C\u4E0D\u628A\u4E0D\u540C\u6D4B\u91CF\u4F53\u7CFB\u5408\u6210\u540C\u4E00\u5206\u6570\u3002" : "Each lane keeps its original source. Different instruments are not merged into one score."}</p></header><div class="prf-dimension-lanes">${lanes.map((l) => `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${esc(humanize(l.providerFamily || l.sourceClass || l.sourceKey))}</span><small>${esc(humanize(l.sourceClass || ""))}</small></div><div class="prf-dimension-lane__items">${list(l.dimensions).map((d) => `<div class="prf-dimension-chip"><span>${esc(humanize(d.facetId || d.domainId || "Signal"))}</span><strong>${esc(nativeValue(d.value))}</strong></div>`).join("")}</div></article>`).join("")}</div></section>`;
}
function itemLabel(x) {
  return x?.label || x?.title || x?.statement || x?.note || humanize(x?.lensId || x?.signalRef || x?.id || x?.kind || "Observed pattern");
}
function strengthCost(fig, locale) {
  if (!stateReady(fig)) return empty(fig, locale, zh(locale) ? "\u5F53\u4F60\u786E\u8BA4\u67D0\u4E2A\u5DF2\u89C2\u5BDF\u6A21\u5F0F\u201C\u5E2E\u52A9\u6211\u201D\u201C\u6D88\u8017\u6211\u201D\u6216\u4E24\u8005\u517C\u6709\u65F6\uFF0C\u8FD9\u91CC\u624D\u4F1A\u51FA\u73B0\u8D44\u6E90\uFF0F\u6210\u672C\u5730\u56FE\u3002" : "This view appears only when an observed pattern is confirmed as helping, costing, or both.");
  const resources = list(fig.data?.resources), costs = list(fig.data?.costs);
  const col = (rows, type) => `<div class="prf-sc-col" data-kind="${type}"><div class="prf-sc-col__title"><span aria-hidden="true"></span><b>${type === "resource" ? zh(locale) ? "\u53EF\u8C03\u7528\u8D44\u6E90" : "Observed resources" : zh(locale) ? "\u6210\u672C\u4E0E\u5F20\u529B" : "Costs & tensions"}</b></div>${rows.length ? rows.map((x) => `<article><strong>${esc(itemLabel(x))}</strong>${x?.contextType ? `<small>${esc(humanize(x.contextType))}</small>` : ""}</article>`).join("") : `<p class="prf-sc-col__none">${zh(locale) ? "\u76EE\u524D\u6CA1\u6709\u5DF2\u786E\u8BA4\u9879\u76EE" : "No confirmed items yet"}</p>`}</div>`;
  return `<section class="prf-pfig" data-pfig="PFIG-003"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u73B0\u5B9E\u786E\u8BA4" : "REALITY-CONFIRMED"}</p><h3>${zh(locale) ? "\u8D44\u6E90\u4E0E\u6210\u672C\u5730\u56FE" : "Resource & cost map"}</h3></div><p>${zh(locale) ? "\u9AD8\u5206\u4E0D\u4F1A\u81EA\u52A8\u53D8\u6210\u4F18\u52BF\uFF0C\u4F4E\u5206\u4E5F\u4E0D\u4F1A\u81EA\u52A8\u53D8\u6210\u5F31\u70B9\u3002\u8FD9\u91CC\u53EA\u663E\u793A\u5DF2\u6709\u8BC1\u636E\u4E0E\u73B0\u5B9E\u786E\u8BA4\u3002" : "High scores do not automatically become strengths, and low scores do not become weaknesses. This view uses governed evidence and reality confirmation only."}</p></header><div class="prf-sc-grid">${col(resources, "resource")}${col(costs, "cost")}</div></section>`;
}
function patternRadar(fig, locale) {
  if (!stateReady(fig)) return empty(fig, locale, zh(locale) ? "\u5F53\u540C\u4E00\u6765\u6E90\u5177\u6709\u81F3\u5C11\u4E24\u4E2A\u53EF\u6BD4\u8F83\u7EF4\u5EA6\u65F6\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u6765\u6E90\u5185\u7684\u6A21\u5F0F\u5206\u5E03\u3002" : "A source-native pattern appears here when one source has at least two comparable dimensions.");
  const series = list(fig.data?.series);
  return `<section class="prf-pfig" data-pfig="PFIG-002"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u6765\u6E90\u5185\u6A21\u5F0F" : "WITHIN-SOURCE"}</p><h3>${zh(locale) ? "\u6D4B\u8BC4\u6A21\u5F0F" : "Assessment pattern"}</h3></div><p>${zh(locale) ? "\u6BCF\u6761\u5E8F\u5217\u53EA\u5C5E\u4E8E\u81EA\u5DF1\u7684\u6765\u6E90\uFF1B\u4E0D\u540C\u6D4B\u8BC4\u4E0D\u4F1A\u5408\u5E76\u6210\u603B\u4EBA\u683C\u96F7\u8FBE\u3002" : "Each series stays within its own source. Different instruments are not merged into one master personality radar."}</p></header><div class="prf-dimension-lanes">${series.map((row) => `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${esc(humanize(row.providerFamily || row.sourceClass || row.sourceKey))}</span><small>${esc(humanize(row.sourceClass || ""))}</small></div><div class="prf-dimension-lane__items">${list(row.points).map((p) => `<div class="prf-dimension-chip"><span>${esc(humanize(p.axis))}</span><strong>${esc(nativeValue(p.value))}</strong></div>`).join("")}</div></article>`).join("")}</div></section>`;
}
function contextVariation(fig, locale) {
  if (!stateReady(fig)) return empty(fig, locale, zh(locale) ? "\u52A0\u5165\u5E26\u6709\u660E\u786E\u60C5\u5883\u7684\u73B0\u5B9E\u89C2\u5BDF\u540E\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u8BC1\u636E\u5982\u4F55\u968F\u60C5\u5883\u53D8\u5316\u3002" : "Add explicit context observations to see how evidence varies across contexts.");
  const observations = list(fig.data?.observations);
  const ctxs = list(fig.data?.contexts);
  return `<section class="prf-pfig" data-pfig="PFIG-004"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u60C5\u5883" : "CONTEXT"}</p><h3>${zh(locale) ? "\u60C5\u5883\u53D8\u5316" : "Context variation"}</h3></div><p>${zh(locale) ? "\u8FD9\u91CC\u53EA\u663E\u793A\u660E\u786E\u8BB0\u5F55\u7684\u60C5\u5883\uFF1B\u672A\u89C2\u5BDF\u5230\u7684\u60C5\u5883\u7EE7\u7EED\u4FDD\u6301\u672A\u77E5\u3002" : "Only explicitly recorded contexts appear here. Unobserved contexts remain unknown."}</p></header><div class="prf-dimension-lanes">${ctxs.map((ctx) => {
    const rows = observations.filter((x) => x.contextType === ctx);
    return `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${esc(humanize(ctx))}</span><small>${rows.length} ${zh(locale) ? "\u9879\u89C2\u5BDF" : "observation(s)"}</small></div><div class="prf-dimension-lane__items">${rows.map((x) => `<div class="prf-dimension-chip"><span>${esc(itemLabel(x))}</span><strong>${esc(humanize(x.confirmation || "UNSURE"))}</strong></div>`).join("")}</div></article>`;
  }).join("")}</div></section>`;
}
function workMap(fig, locale) {
  if (!stateReady(fig)) return empty(fig, locale, zh(locale) ? "\u52A0\u5165\u804C\u4E1A\u5174\u8DA3\u6216\u5DE5\u4F5C\u60C5\u5883\u89C2\u5BDF\u540E\uFF0C\u8FD9\u91CC\u4F1A\u5F62\u6210\u5DE5\u4F5C\u8BC1\u636E\u5730\u56FE\u3002" : "Add career-interest or work-context evidence to open this work map.");
  const interest = fig.data?.interestEvidence;
  const observed = list(fig.data?.observedExpression);
  const axes = list(interest?.axes);
  return `<section class="prf-pfig" data-pfig="PFIG-006"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u5DE5\u4F5C\u8BC1\u636E" : "WORK EVIDENCE"}</p><h3>${zh(locale) ? "\u5DE5\u4F5C\u5174\u8DA3\u4E0E\u8868\u8FBE" : "Work interest & expression"}</h3></div><p>${zh(locale) ? "\u804C\u4E1A\u5174\u8DA3\u4E0D\u662F\u80FD\u529B\u6216\u5C31\u4E1A\u9002\u914D\u7ED3\u8BBA\uFF1B\u73B0\u5B9E\u89C2\u5BDF\u53EF\u4EE5\u8865\u5145\u5B83\u5728\u5DE5\u4F5C\u4E2D\u7684\u5B9E\u9645\u8868\u8FBE\u3002" : "Career interest is not an ability or job-fit verdict. Real-world observations may add evidence about expression at work."}</p></header><div class="prf-dimension-lanes">${axes.length ? `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>RIASEC</span><small>${zh(locale) ? "\u804C\u4E1A\u5174\u8DA3" : "Career interest"}</small></div><div class="prf-dimension-lane__items">${axes.map((a) => `<div class="prf-dimension-chip"><span>${esc(a.label || a.code || "Interest")}</span><strong>${esc(nativeValue(a.score))}</strong></div>`).join("")}</div></article>` : ""}${observed.length ? `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${zh(locale) ? "\u73B0\u5B9E\u89C2\u5BDF" : "Observed expression"}</span><small>WORK</small></div><div class="prf-dimension-lane__items">${observed.map((x) => `<div class="prf-dimension-chip"><span>${esc(itemLabel(x))}</span><strong>${esc(humanize(x.confirmation || "UNSURE"))}</strong></div>`).join("")}</div></article>` : ""}</div></section>`;
}
function relationshipMap(fig, locale) {
  if (!stateReady(fig)) return empty(fig, locale, zh(locale) ? "\u52A0\u5165\u5173\u7CFB\u60C5\u5883\u7684\u89C2\u5BDF\u6216\u5DF2\u6CBB\u7406\u7684\u5173\u7CFB\u8BC1\u636E\u540E\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u4E92\u52A8\u8BC1\u636E\u3002" : "Add relationship observations or evidence to open this interaction view.");
  const observed = list(fig.data?.observations);
  const rel = fig.data?.relationshipEvidence;
  return `<section class="prf-pfig" data-pfig="PFIG-007"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u5173\u7CFB\u8BC1\u636E" : "RELATIONSHIP EVIDENCE"}</p><h3>${zh(locale) ? "\u5173\u7CFB\u4E92\u52A8" : "Relationship interaction"}</h3></div><p>${zh(locale) ? "\u8FD9\u91CC\u4E0D\u4EA7\u751F\u517C\u5BB9\u5EA6\u3001\u5BF9\u65B9\u9690\u85CF\u72B6\u6001\u6216\u5173\u7CFB\u7ED3\u679C\u9884\u6D4B\u3002" : "This view does not create compatibility scores, hidden-partner inference, or outcome predictions."}</p></header><div class="prf-dimension-lanes">${observed.length ? `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${zh(locale) ? "\u5DF2\u89C2\u5BDF\u4E92\u52A8" : "Observed interaction"}</span><small>RELATIONSHIP</small></div><div class="prf-dimension-lane__items">${observed.map((x) => `<div class="prf-dimension-chip"><span>${esc(itemLabel(x))}</span><strong>${esc(humanize(x.confirmation || "UNSURE"))}</strong></div>`).join("")}</div></article>` : ""}${rel ? `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${zh(locale) ? "\u5173\u7CFB\u6765\u6E90" : "Relationship source"}</span><small>${esc(humanize(rel.sourceClass || rel.kind || "EVIDENCE"))}</small></div><div class="prf-dimension-lane__items"><div class="prf-dimension-chip"><span>${esc(itemLabel(rel))}</span><strong>${zh(locale) ? "\u4FDD\u7559\u6765\u6E90" : "Source preserved"}</strong></div></div></article>` : ""}</div></section>`;
}
function decisionMap(fig, locale) {
  if (!stateReady(fig)) return empty(fig, locale, zh(locale) ? "\u5F53\u89C4\u5212\u3001\u98CE\u9669\u610F\u8BC6\u3001\u51B3\u7B56\u7EAA\u5F8B\u6216\u73B0\u5B9E\u51B3\u7B56\u89C2\u5BDF\u53EF\u7528\u65F6\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u51B3\u7B56\u8BC1\u636E\u3002" : "Decision evidence appears when planning, risk awareness, decision discipline, or relevant current observations are available.");
  const dims = list(fig.data?.decisionEvidence);
  const current = list(fig.data?.currentPattern);
  return `<section class="prf-pfig" data-pfig="PFIG-008"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u51B3\u7B56\u8BC1\u636E" : "DECISION EVIDENCE"}</p><h3>${zh(locale) ? "\u5F53\u524D\u51B3\u7B56\u8BC1\u636E" : "Current decision evidence"}</h3></div><p>${zh(locale) ? "\u5B83\u4E0D\u662F\u56FA\u5B9A\u51B3\u7B56\u7C7B\u578B\uFF0C\u4E5F\u4E0D\u6784\u6210\u8D22\u52A1\u5EFA\u8BAE\u3002" : "This is not a fixed decision type and it does not constitute financial advice."}</p></header><div class="prf-dimension-lanes">${dims.length ? `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${zh(locale) ? "\u6765\u6E90\u7EF4\u5EA6" : "Source dimensions"}</span><small>${dims.length}</small></div><div class="prf-dimension-lane__items">${dims.map((x) => `<div class="prf-dimension-chip"><span>${esc(humanize(x.facetId || x.domainId || "Decision"))}</span><strong>${esc(nativeValue(x.value))}</strong></div>`).join("")}</div></article>` : ""}${current.length ? `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>Current Reality</span><small>${zh(locale) ? "\u73B0\u5B9E\u89C2\u5BDF" : "Observed context"}</small></div><div class="prf-dimension-lane__items">${current.map((x) => `<div class="prf-dimension-chip"><span>${esc(itemLabel(x))}</span><strong>${esc(humanize(x.confirmation || "UNSURE"))}</strong></div>`).join("")}</div></article>` : ""}</div></section>`;
}
var stateMeta = (locale) => ({
  CONVERGES: { label: zh(locale) ? "\u8D8B\u540C" : "Converges", hint: zh(locale) ? "\u4E0D\u540C\u6765\u6E90\u6307\u5411\u76F8\u8FD1\u89C2\u5BDF" : "Sources point toward a similar observation" },
  CONTEXT_DEPENDENT: { label: zh(locale) ? "\u89C6\u60C5\u5883\u800C\u53D8" : "Context-dependent", hint: zh(locale) ? "\u5DEE\u5F02\u53EF\u7531\u660E\u786E\u60C5\u5883\u8BC1\u636E\u89E3\u91CA" : "Difference is tied to explicit context evidence" },
  DIVERGES: { label: zh(locale) ? "\u5206\u6B67" : "Diverges", hint: zh(locale) ? "\u6765\u6E90\u4E4B\u95F4\u5B58\u5728\u660E\u786E\u4E0D\u4E00\u81F4" : "Sources remain explicitly different" },
  UNKNOWN: { label: zh(locale) ? "\u5C1A\u672A\u786E\u8BA4" : "Unknown", hint: zh(locale) ? "\u8BC1\u636E\u4E0D\u8DB3\uFF0C\u4E0D\u5F3A\u884C\u5F52\u7C7B" : "Insufficient evidence; no forced classification" }
});
function convergence(fig, locale) {
  if (!stateReady(fig)) return empty(fig, locale, zh(locale) ? "\u52A0\u5165\u7B2C\u4E8C\u4E2A\u53EF\u6BD4\u8F83\u6765\u6E90\uFF0C\u6216\u4E0E Current Reality \u5BF9\u7167\u540E\uFF0C\u8FD9\u91CC\u624D\u4F1A\u663E\u793A\u8DE8\u6765\u6E90\u5173\u7CFB\u3002" : "Add another comparable source, or compare with Current Reality, to open this cross-source view.");
  const rows = list(fig.data?.perspectives), meta = stateMeta(locale);
  const groups = ["CONVERGES", "CONTEXT_DEPENDENT", "DIVERGES", "UNKNOWN"];
  return `<section class="prf-pfig" data-pfig="PFIG-005"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u8DE8\u6765\u6E90" : "CROSS-SOURCE"}</p><h3>${zh(locale) ? "\u8D8B\u540C\u3001\u60C5\u5883\u4E0E\u5206\u6B67" : "Convergence & divergence"}</h3></div><p>${zh(locale) ? "\u76F8\u4F3C\u4E0D\u4EE3\u8868\u4E92\u76F8\u9A8C\u8BC1\uFF1B\u5206\u6B67\u4E5F\u53EF\u4EE5\u4FDD\u7559\u3002" : "Similarity does not validate one source with another; disagreement is allowed to remain visible."}</p></header><div class="prf-convergence-grid">${groups.map((g) => {
    const hits = rows.filter((x) => x.projectionState === g);
    return `<article class="prf-convergence-state" data-state="${g}"><div class="prf-convergence-state__top"><span></span><strong>${esc(meta[g].label)}</strong><b>${hits.length}</b></div><small>${esc(meta[g].hint)}</small>${hits.slice(0, 3).map((x) => `<p>${esc(x.statement || humanize(x.nativeGroup || ""))}</p>`).join("")}</article>`;
  }).join("")}</div></section>`;
}
function realityBridge(fig, locale) {
  if (!stateReady(fig)) return empty(fig, locale, zh(locale) ? "\u5F53\u4E2A\u4EBA\u8BC1\u636E\u4E0E Current Reality\u3001\u77DB\u76FE\u8BC1\u636E\u6216\u5DF2\u6709\u89C2\u5BDF\u95EE\u9898\u53D1\u751F\u8FDE\u63A5\u65F6\uFF0C\u8FD9\u91CC\u4F1A\u5F62\u6210\u73B0\u5B9E\u6865\u63A5\u3002" : "This bridge appears when personal evidence connects to Current Reality, contradictions, or an admitted observation question.");
  const contradictions = list(fig.data?.contradictions), questions = list(fig.data?.questions);
  const hasContext = Boolean(fig.data?.contextEvidence);
  const stage = (n, title, body, active = true) => `<div class="prf-bridge-stage" data-active="${active ? "true" : "false"}"><span class="prf-bridge-stage__n">${n}</span><div><strong>${esc(title)}</strong><p>${esc(body)}</p></div></div>`;
  return `<section class="prf-pfig prf-pfig--bridge" data-pfig="PFIG-009"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u73B0\u5B9E\u6865\u63A5" : "REALITY BRIDGE"}</p><h3>${zh(locale) ? "\u4ECE\u4E2A\u4EBA\u8BC1\u636E\u56DE\u5230\u73B0\u5B9E" : "Bring personal evidence back to reality"}</h3></div><p>${zh(locale) ? "\u4E2A\u4EBA\u8BC1\u636E\u63D0\u4F9B\u89C2\u5BDF\u89D2\u5EA6\uFF0CCurrent Reality \u63D0\u4F9B\u5F53\u4E0B\u60C5\u5883\uFF1B\u4E8C\u8005\u4E0D\u4F1A\u4E92\u76F8\u8BC1\u660E\u3002" : "Personal evidence offers a lens; Current Reality supplies present context. Neither validates the other."}</p></header><div class="prf-bridge-flow">${stage("01", zh(locale) ? "\u4E2A\u4EBA\u8BC1\u636E" : "Personal evidence", zh(locale) ? "\u4FDD\u7559\u6765\u6E90\u4E0E\u65F6\u95F4" : "Source and date stay visible", true)}${stage("02", zh(locale) ? "Current Reality" : "Current Reality", hasContext ? zh(locale) ? "\u5DF2\u6709\u5F53\u524D\u60C5\u5883\u8BC1\u636E" : "Current context evidence is available" : zh(locale) ? "\u5C1A\u672A\u8FDE\u63A5\u5F53\u524D\u60C5\u5883" : "No current context linked yet", hasContext)}${stage("03", zh(locale) ? "\u9700\u8981\u89C2\u5BDF\u7684\u5DEE\u5F02" : "What to observe", contradictions.length ? zh(locale) ? `${contradictions.length} \u4E2A\u6765\u6E90\uFF0F\u60C5\u5883\u5DEE\u5F02\u4ECD\u53EF\u89C1` : `${contradictions.length} source/context difference(s) remain visible` : zh(locale) ? "\u76EE\u524D\u6CA1\u6709\u660E\u786E\u77DB\u76FE" : "No explicit contradiction in this result", contradictions.length > 0)}${stage("04", zh(locale) ? "\u73B0\u5B9E\u95EE\u9898" : "Reality question", questions[0]?.text || (zh(locale) ? "\u52A0\u5165 Current Reality \u540E\u518D\u7EE7\u7EED\u89C2\u5BDF\u3002" : "Add Current Reality to continue the observation."), questions.length > 0)}</div><div class="prf-bridge-actions"><a class="cx-button" href="/perspectives/personal/#cx-current-reality">${zh(locale) ? "\u4E0E Current Reality \u5BF9\u7167" : "Compare with Current Reality"}</a></div></section>`;
}
var PROFILE_VISUAL_MVP_IDS = Object.freeze(["PFIG-001", "PFIG-002", "PFIG-003", "PFIG-004", "PFIG-005", "PFIG-006", "PFIG-007", "PFIG-008", "PFIG-009"]);
function renderPersonalEvidenceFigure(figure, { locale = "en" } = {}) {
  const renderers = { "PFIG-001": dimensionMap, "PFIG-002": patternRadar, "PFIG-003": strengthCost, "PFIG-004": contextVariation, "PFIG-005": convergence, "PFIG-006": workMap, "PFIG-007": relationshipMap, "PFIG-008": decisionMap, "PFIG-009": realityBridge };
  const render = renderers[figure?.pfig];
  if (!render) throw new Error("PERSONAL_EVIDENCE_FIGURE_NOT_ADMITTED");
  return render(figure, locale);
}

// functions/canonical-presentation-runtime/personal-evidence-dossier-presentation.js
var esc2 = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var human = (v) => String(v ?? "").replaceAll("::", " \xB7 ").replaceAll("_", " ");
function renderPersonalEvidenceDossier({ dossier, profileView, locale = "en", customerName = "", subject = "", reviewPreview = false, report = null, cprHandoff = null }) {
  if (!reviewPreview && (report?.canonicalState !== "RELEASED" || cprHandoff?.sourceReportDigest !== report.reportDigest || cprHandoff?.targetRuntime !== "CPR")) throw new Error("CPR_PERSONAL_EVIDENCE_RELEASE_REQUIRED");
  if (!reviewPreview && report.customer !== profileView?.participantRef) throw new Error("CPR_PERSONAL_EVIDENCE_CUSTOMER_MISMATCH");
  if (dossier?.participantRef !== profileView?.participantRef) throw new Error("CPR_PERSONAL_EVIDENCE_SUBJECT_MISMATCH");
  const zh2 = locale === "zh-Hans", cards = profileView.signalCards || [];
  const page = (body, attrs = "") => `<article class="pub-page pe-body" ${attrs}>${body}</article>`;
  const staticPage = (asset, cover = false) => `<article class="pub-static" data-pe-static="${esc2(asset.id)}"><img src="${esc2(asset.publicUrl)}" alt="${zh2 ? "\u6863\u6848\u9759\u6001\u89C6\u89C9" : "Dossier static visual"}" loading="eager" onerror="this.nextElementSibling.hidden=false"><p class="pe-asset-error" hidden>${zh2 ? "\u73B0\u6709\u9759\u6001\u89C6\u89C9\u6682\u65F6\u65E0\u6CD5\u52A0\u8F7D\uFF1B\u6253\u5370\u5C1A\u672A\u5C31\u7EEA\u3002" : "Existing static visual is unavailable. Print is not ready."}</p>${cover ? `<div class="pe-cover-values"><span>${esc2(customerName || profileView.participantRef)}</span><span>${esc2(dossier.asOfDate || "")}</span><span>${esc2(subject)}</span></div>` : ""}</article>`;
  const rows = (card) => `<div class="pe-source"><strong>${esc2(card.sourceLabel || human(card.sourceClass))}</strong><p>${esc2(human(card.domainId))} ${esc2(human(card.facetId))}</p><pre>${esc2(JSON.stringify(card.value ?? null, null, 2))}</pre><p>${esc2(card.providerFamily || "")} \xB7 ${esc2(card.assessmentDate || (zh2 ? "\u65E5\u671F\u672A\u77E5" : "Date unknown"))}</p><ul>${(card.precisionBoundary || []).map((x) => `<li>${esc2(human(x))}</li>`).join("")}</ul></div>`;
  let html = dossier.staticPages.map((a, i) => staticPage(a, i === 0)).join("");
  for (const section of dossier.sections) {
    html += staticPage(section.master);
    for (const fig of section.pfigs) html += page(renderPersonalEvidenceFigure(fig, { locale }), `data-pe-section="${esc2(section.section)}"`);
    const refs = new Set(section.pfigs.flatMap((f) => f.evidenceRefs || []));
    const selected = section.section === "SEC-02" ? cards : section.section === "SEC-08" ? cards.filter((c) => c.domainId === "FINANCIAL_CAPABILITY" || c.sourceClass === "EXTERNAL_PROFILE_RESULT") : cards.filter((c) => refs.has(c.signalRef));
    for (const card of selected) html += page(rows(card), `data-pe-section="${esc2(section.section)}"`);
    if (!section.pfigs.length && !selected.length) html += page(`<p>${zh2 ? "\u6B64\u7AE0\u8282\u5C1A\u65E0\u5DF2\u77E5\u8BC1\u636E\uFF1B\u672A\u77E5\u4FDD\u6301\u5F00\u653E\u3002" : "No evidence for this section yet. Unknowns remain open."}</p>`, `data-pe-section="${esc2(section.section)}" data-pe-sparse="true"`);
    if (section.section === "SEC-10") html += page(`<ul>${(profileView.boundaries || []).map((x) => `<li>${esc2(x)}</li>`).join("")}</ul><p>${zh2 ? "\u8BC4\u4F30\u7ED3\u679C\u4E0D\u81EA\u52A8\u6210\u4E3A\u5F53\u4E0B\u73B0\u5B9E\uFF0C\u4E5F\u4E0D\u81EA\u52A8\u4FDD\u5B58\u3002" : "Assessment evidence does not automatically become Current Reality and is not saved automatically."}</p>`, `data-pe-section="SEC-10"`);
  }
  return `<div class="pub-report pe-dossier" data-print-shell="PHI-OS-REPORT-PRINT-SHELL-V2" data-review-preview="${reviewPreview}">${html}</div>`;
}

// functions/profile/personal-evidence-handoffs.js
var PERSONAL_EVIDENCE_REALITY_HANDOFF_SCHEMA = "PHI-OS-PERSONAL-EVIDENCE-REALITY-HANDOFF-v1.0.0";
var list2 = (v) => Array.isArray(v) ? v : [];
var unique = (v) => [...new Set(list2(v).filter(Boolean))];
var clean = (v) => String(v ?? "").trim();
var freeze = (v) => {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v)) freeze(x);
  }
  return v;
};
function preservePersonalEvidenceReference(x = {}) {
  return {
    sourceId: clean(x.sourceId || x.signalRef),
    sourceClass: clean(x.sourceClass),
    providerFamily: x.providerFamily || null,
    assessmentDate: x.assessmentDate || null,
    observedAt: x.observedAt || null,
    domainId: x.domainId || null,
    facetId: x.facetId || null,
    nativeValue: structuredClone(x.nativeValue ?? x.value ?? null),
    context: structuredClone(x.context ?? null),
    confirmationState: x.confirmationState || x.confidence || null,
    provenance: structuredClone(x.provenance || []),
    precisionBoundary: structuredClone(x.precisionBoundary || []),
    realityQuestion: x.realityQuestion || null,
    unknownState: x.unknownState || "OPEN",
    statement: clean(x.statement) || `${x.sourceLabel || x.sourceClass}: ${x.domainId || ""}${x.facetId ? ` \xB7 ${x.facetId}` : ""}`.trim(),
    realityFact: false
  };
}
function buildPersonalEvidenceRealityHandoff({
  profileView = null,
  selectedEvidenceRefs = [],
  observationNote = "",
  openQuestion = "",
  selectionAction = "KEEP_EVIDENCE"
} = {}) {
  if (profileView?.schemaVersion !== "PHI-OS-PROGRESSIVE-PROFILE-VIEW-v1") throw new Error("PERSONAL_EVIDENCE_PROFILE_VIEW_REQUIRED");
  const cards = list2(profileView.signalCards);
  const allowed = new Map(cards.map((x) => [x.signalRef, x]));
  const selected = unique(selectedEvidenceRefs).map((ref) => allowed.get(ref)).filter(Boolean);
  if (!selected.length) throw new Error("PERSONAL_EVIDENCE_EXPLICIT_SELECTION_REQUIRED");
  if (unique(selectedEvidenceRefs).some((ref) => !allowed.has(ref))) throw new Error("PERSONAL_EVIDENCE_SELECTION_MISMATCH");
  if (!["KEEP_EVIDENCE", "COMPARE_CURRENT_REALITY", "OBSERVATION_TARGET", "OPEN_QUESTION"].includes(selectionAction)) throw new Error("PERSONAL_EVIDENCE_SELECTION_ACTION_INVALID");
  return freeze({
    schemaVersion: PERSONAL_EVIDENCE_REALITY_HANDOFF_SCHEMA,
    participantRef: profileView.participantRef || null,
    profileViewRef: profileView.profileViewId || null,
    customerSelected: true,
    selectionAction,
    automaticPersistence: false,
    selectedEvidenceRefs: selected.map((x) => x.signalRef),
    evidenceReferences: selected.map(preservePersonalEvidenceReference),
    observationNote: clean(observationNote),
    openQuestion: clean(openQuestion),
    governance: {
      explicitSelection: true,
      explicitConsentStillRequiredAtApi: true,
      fullDossierTransferred: false,
      assessmentBecomesRealityFact: false,
      automaticPersistence: false
    }
  });
}
function preparePersonalEvidenceDomainHandoff({ bundle, targetDomain, purpose, selectedEvidenceRefs = [], consentRef, time, explicitConsent = false, otherParticipantRef = null } = {}) {
  const target = { RELATIONSHIP: "relationship", CAREER: "career", FINANCIAL: "financial" }[targetDomain];
  const lane = target && bundle?.[target];
  if (!lane) throw new Error("PERSONAL_EVIDENCE_TARGET_DOMAIN_INVALID");
  if (explicitConsent !== true || !clean(consentRef) || !clean(purpose) || !Number.isFinite(Date.parse(time))) throw new Error("PERSONAL_EVIDENCE_TARGET_CONSENT_REQUIRED");
  const selected = unique(selectedEvidenceRefs);
  if (!selected.length || selected.some((ref) => !lane.evidenceRefs.includes(ref))) throw new Error("PERSONAL_EVIDENCE_TARGET_SELECTION_INVALID");
  if (otherParticipantRef && otherParticipantRef === bundle.participantRef) throw new Error("PERSONAL_EVIDENCE_PARTICIPANTS_MUST_DIFFER");
  return freeze({
    purpose: clean(purpose),
    targetDomain,
    selectedEvidenceRefs: selected,
    consentRef: clean(consentRef),
    time: new Date(time).toISOString(),
    participantRef: bundle.participantRef,
    otherParticipantRef,
    route: lane.route,
    lane: targetDomain === "RELATIONSHIP" ? "SEPARATE_PROFILE_EVIDENCE_LANE" : lane.target,
    targetMutation: false,
    automaticPersistence: false,
    contextProjectionOnly: true,
    governance: lane.governance
  });
}
export {
  buildPersonalEvidenceRealityHandoff,
  preparePersonalEvidenceDomainHandoff,
  renderPersonalEvidenceDossier
};
