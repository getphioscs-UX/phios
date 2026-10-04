// assets/customer-ui/js/visuals/personal-evidence-copy.js
var terms = {};
var add = (key, en, zh2) => {
  terms[key] = [en, zh2];
  terms[key.toUpperCase()] = [en, zh2];
  terms[en] = [en, zh2];
  terms[en.toUpperCase()] = [en, zh2];
};
[
  ["CUSTOMER_SELF_REPORT", "Your self-report", "\u4F60\u7684\u81EA\u9648"],
  ["MEASURED_TASK_PERFORMANCE", "Observed task performance", "\u4EFB\u52A1\u8868\u73B0"],
  ["EXTERNAL_PROFILE_RESULT", "Imported external profile", "\u5BFC\u5165\u7684\u5916\u90E8\u6D4B\u8BC4"],
  ["SYMBOLIC_INTERPRETATION", "Symbolic interpretation", "\u8C61\u5F81\u89E3\u8BFB"],
  ["MBTI_OFFICIAL", "Official MBTI result", "\u5B98\u65B9 MBTI \u7ED3\u679C"],
  ["16P_NERIS", "16Personalities result", "16Personalities \u7ED3\u679C"],
  ["OTHER_EXTERNAL_PROFILE", "Other external assessment", "\u5176\u4ED6\u5916\u90E8\u6D4B\u8BC4"],
  ["OTHER_BIG_FIVE", "Other Big Five assessment", "\u5176\u4ED6\u5927\u4E94\u4EBA\u683C\u6D4B\u8BC4"],
  ["IPIP_BIG_FIVE", "IPIP Big Five", "IPIP \u5927\u4E94\u4EBA\u683C"],
  ["IPIP", "IPIP self-report", "IPIP \u81EA\u9648"],
  ["O*NET", "O*NET career interests", "O*NET \u804C\u4E1A\u5174\u8DA3"],
  ["PHI_OS_FINANCIAL_CAPABILITY", "PHI OS financial capability", "PHI OS \u8D22\u52A1\u80FD\u529B"],
  ["COGNITIVE_NAVIGATION", "Cognitive navigation", "\u8BA4\u77E5\u5BFC\u822A"],
  ["EMOTIONAL_SOCIAL_REGULATION", "Emotional and social regulation", "\u60C5\u7EEA\u4E0E\u793E\u4EA4\u8C03\u8282"],
  ["ADAPTATION_COPING", "Adaptation and coping", "\u9002\u5E94\u4E0E\u5E94\u5BF9"],
  ["BODY_LIFESTYLE_STEWARDSHIP", "Body and lifestyle", "\u8EAB\u4F53\u4E0E\u751F\u6D3B\u65B9\u5F0F"],
  ["FINANCIAL_CAPABILITY", "Financial capability", "\u8D22\u52A1\u80FD\u529B"],
  ["MEANING_VALUES", "Meaning and values", "\u610F\u4E49\u4E0E\u4EF7\u503C"],
  ["REASONING_TASK_PERFORMANCE", "Reasoning task performance", "\u63A8\u7406\u4EFB\u52A1\u8868\u73B0"],
  ["ABSTRACT_RELATION", "Abstract relations", "\u62BD\u8C61\u5173\u7CFB"],
  ["PATTERN_COMPLETION", "Pattern completion", "\u6A21\u5F0F\u8865\u5168"],
  ["RELATIONAL_MATRIX", "Relational matrices", "\u5173\u7CFB\u77E9\u9635"],
  ["SEQUENCE_REASONING", "Sequence reasoning", "\u5E8F\u5217\u63A8\u7406"],
  ["SPATIAL_TRANSFORMATION", "Spatial transformations", "\u7A7A\u95F4\u53D8\u6362"],
  ["WORK", "Work context", "\u5DE5\u4F5C\u60C5\u5883"],
  ["RELATIONSHIP", "Relationship context", "\u5173\u7CFB\u60C5\u5883"],
  ["CURRENT_REALITY", "Current reality", "\u5F53\u4E0B\u73B0\u5B9E"],
  ["GENERAL", "General context", "\u4E00\u822C\u60C5\u5883"],
  ["HELPS_ME", "Helps me", "\u5BF9\u6211\u6709\u5E2E\u52A9"],
  ["COSTS_ME", "Costs me", "\u8BA9\u6211\u4ED8\u51FA\u4EE3\u4EF7"],
  ["BOTH", "Helps and costs me", "\u65E2\u6709\u5E2E\u52A9\u4E5F\u6709\u4EE3\u4EF7"],
  ["NEUTRAL", "Neutral", "\u4E2D\u6027"],
  ["UNSURE", "Not yet confirmed", "\u5C1A\u672A\u786E\u8BA4"],
  ["UNKNOWN", "Unknown", "\u672A\u77E5"],
  ["FINANCIAL_KNOWLEDGE", "Financial knowledge", "\u8D22\u52A1\u77E5\u8BC6"],
  ["FINANCIAL_BEHAVIOUR", "Financial behaviour", "\u8D22\u52A1\u884C\u4E3A"],
  ["FINANCIAL_ATTITUDES", "Financial attitudes", "\u8D22\u52A1\u6001\u5EA6"],
  ["PLANNING", "Planning", "\u89C4\u5212"],
  ["RISK_AWARENESS", "Risk awareness", "\u98CE\u9669\u610F\u8BC6"],
  ["DECISION_DISCIPLINE", "Decision discipline", "\u51B3\u7B56\u7EAA\u5F8B"],
  ["Openness", "Openness", "\u5F00\u653E\u6027"],
  ["Conscientiousness", "Conscientiousness", "\u5C3D\u8D23\u6027"],
  ["Extraversion", "Extraversion", "\u5916\u5411\u6027"],
  ["Agreeableness", "Agreeableness", "\u5B9C\u4EBA\u6027"],
  ["Neuroticism", "Neuroticism", "\u795E\u7ECF\u8D28"],
  ["EmotionalStability", "Emotional stability", "\u60C5\u7EEA\u7A33\u5B9A\u6027"],
  ["Energy", "Energy", "\u80FD\u91CF\u503E\u5411"],
  ["Identity", "Identity", "\u81EA\u6211\u8BA4\u540C"],
  ["Mind", "Mind", "\u601D\u7EF4\u503E\u5411"],
  ["Nature", "Nature", "\u5224\u65AD\u503E\u5411"],
  ["Tactics", "Tactics", "\u5E94\u5BF9\u503E\u5411"],
  ["realistic", "Realistic interests", "\u73B0\u5B9E\u578B\u5174\u8DA3"],
  ["investigative", "Investigative interests", "\u7814\u7A76\u578B\u5174\u8DA3"],
  ["artistic", "Artistic interests", "\u827A\u672F\u578B\u5174\u8DA3"],
  ["social", "Social interests", "\u793E\u4F1A\u578B\u5174\u8DA3"],
  ["enterprising", "Enterprising interests", "\u4F01\u4E1A\u578B\u5174\u8DA3"],
  ["conventional", "Conventional interests", "\u5E38\u89C4\u578B\u5174\u8DA3"],
  ["R", "Realistic interests", "\u73B0\u5B9E\u578B\u5174\u8DA3"],
  ["I", "Investigative interests", "\u7814\u7A76\u578B\u5174\u8DA3"],
  ["A", "Artistic interests", "\u827A\u672F\u578B\u5174\u8DA3"],
  ["S", "Social interests", "\u793E\u4F1A\u578B\u5174\u8DA3"],
  ["E", "Enterprising interests", "\u4F01\u4E1A\u578B\u5174\u8DA3"],
  ["C", "Conventional interests", "\u5E38\u89C4\u578B\u5174\u8DA3"],
  ["O", "Openness", "\u5F00\u653E\u6027"],
  ["N", "Neuroticism", "\u795E\u7ECF\u8D28"],
  ["normalizedSelfReportIndex", "Self-report index", "\u81EA\u9648\u6307\u6570"],
  ["rawScore", "Raw score", "\u539F\u59CB\u5206\u6570"],
  ["rawMean", "Raw mean", "\u539F\u59CB\u5747\u503C"],
  ["rawPoints", "Raw points", "\u539F\u59CB\u5F97\u5206"],
  ["score", "Score", "\u5206\u6570"],
  ["correctCount", "Correct answers", "\u7B54\u5BF9\u9898\u6570"],
  ["attemptedCount", "Attempted items", "\u4F5C\u7B54\u9898\u6570"],
  ["rawCorrect", "Correct answers", "\u7B54\u5BF9\u9898\u6570"],
  ["rawAttempted", "Attempted items", "\u4F5C\u7B54\u9898\u6570"],
  ["rawAccuracy", "Raw accuracy", "\u539F\u59CB\u6B63\u786E\u7387"],
  ["answered", "Answered items", "\u5DF2\u7B54\u9898\u6570"],
  ["expected", "Total items", "\u9898\u76EE\u603B\u6570"],
  ["adaptedIndex", "Adapted index", "\u6539\u7F16\u6307\u6570"],
  ["scaleMin", "Scale minimum", "\u91CF\u8868\u4E0B\u9650"],
  ["scaleMax", "Scale maximum", "\u91CF\u8868\u4E0A\u9650"],
  ["resultLabel", "Provider result", "\u63D0\u4F9B\u65B9\u7ED3\u679C"],
  ["PROVIDER_RESULT_LABEL_ONLY", "Provider result label only.", "\u4EC5\u4FDD\u7559\u63D0\u4F9B\u65B9\u7ED3\u679C\u540D\u79F0\u3002"],
  ["NO_CROSS_PROVIDER_EQUIVALENCE_ASSUMED", "Results from different providers are not assumed equivalent.", "\u4E0D\u5047\u8BBE\u4E0D\u540C\u63D0\u4F9B\u65B9\u7684\u7ED3\u679C\u7B49\u4EF7\u3002"],
  ["PROVIDER_DIMENSION_SEMANTICS_PRESERVED", "Dimensions retain their provider\u2019s meaning.", "\u7EF4\u5EA6\u4FDD\u7559\u63D0\u4F9B\u65B9\u7684\u539F\u59CB\u542B\u4E49\u3002"],
  ["PARTIAL_RESPONSE_SET", "Only part of the questionnaire was answered.", "\u672C\u6B21\u53EA\u5B8C\u6210\u4E86\u90E8\u5206\u95EE\u5377\u3002"],
  ["LOW_RESPONSE_COMPLETENESS", "Response completeness is low.", "\u4F5C\u7B54\u5B8C\u6574\u5EA6\u8F83\u4F4E\u3002"],
  ["SELF_REPORTED_INDEX_NOT_OBJECTIVE_TRAIT_SCORE", "The index describes self-report, not an objective trait score.", "\u6307\u6570\u63CF\u8FF0\u81EA\u9648\uFF0C\u4E0D\u662F\u5BA2\u89C2\u7279\u8D28\u5206\u6570\u3002"],
  ["RAW_TASK_PERFORMANCE_ONLY", "Raw performance on these tasks only.", "\u4EC5\u8868\u793A\u8FD9\u4E9B\u4EFB\u52A1\u7684\u539F\u59CB\u8868\u73B0\u3002"],
  ["NOT_IQ", "This is not an IQ score.", "\u8FD9\u4E0D\u662F IQ \u5206\u6570\u3002"],
  ["NOT_PERCENTILE", "This is not a normed percentile.", "\u8FD9\u4E0D\u662F\u5E38\u6A21\u767E\u5206\u4F4D\u3002"],
  ["NOT_COGNITIVE_DIAGNOSIS", "This is not a cognitive diagnosis.", "\u8FD9\u4E0D\u662F\u8BA4\u77E5\u8BCA\u65AD\u3002"],
  ["SYMBOLIC_INTERPRETATION_ONLY", "Symbolic interpretation only.", "\u4EC5\u4F5C\u8C61\u5F81\u89E3\u8BFB\u3002"],
  ["NOT_MEASURED_TRAIT", "This is not a measured trait.", "\u8FD9\u4E0D\u662F\u6D4B\u91CF\u5F97\u5230\u7684\u7279\u8D28\u3002"],
  ["LESS", "Less", "\u66F4\u5C11"],
  ["SAME", "The same", "\u76F8\u540C"],
  ["MORE", "More", "\u66F4\u591A"],
  ["CANNOT_TELL", "Cannot tell", "\u65E0\u6CD5\u5224\u65AD"],
  ["TRUE", "True", "\u6B63\u786E"],
  ["FALSE", "False", "\u9519\u8BEF"]
].forEach((x) => add(...x));
[
  ["STANDARDIZED_SELF_REPORT", "Standardized self-report", "\u6807\u51C6\u5316\u81EA\u9648"],
  ["BIG_FIVE", "Big Five", "\u5927\u4E94\u4EBA\u683C"],
  ["EMOTIONAL_STABILITY", "Emotional stability", "\u60C5\u7EEA\u7A33\u5B9A\u6027"],
  ["INTELLECT_IMAGINATION", "Intellect and imagination", "\u667A\u6027\u4E0E\u60F3\u8C61"],
  ["FINANCIAL_ATTITUDE", "Financial attitudes", "\u8D22\u52A1\u6001\u5EA6"],
  ["DIGITAL_FINANCE_SAFETY", "Digital finance safety", "\u6570\u5B57\u91D1\u878D\u5B89\u5168"],
  ["FINANCIAL_RESILIENCE_SELF_VIEW", "Self-reported financial resilience", "\u8D22\u52A1\u97E7\u6027\u81EA\u9648"],
  ["STANDARDIZED_SELF_REPORT_INTEREST_NOT_OBJECTIVE_PERSONALITY_FACT", "Self-reported interests are not objective personality facts.", "\u81EA\u9648\u5174\u8DA3\u4E0D\u662F\u5BA2\u89C2\u4EBA\u683C\u4E8B\u5B9E\u3002"],
  ["EXTERNALLY_SCORED_BY_ONET_WEB_SERVICES", "Scored by O*NET Web Services.", "\u7531 O*NET \u7F51\u7EDC\u670D\u52A1\u8BA1\u5206\u3002"],
  ["CAREER_INTEREST_NOT_JOB_FIT_GUARANTEE", "Career interests do not guarantee job fit.", "\u804C\u4E1A\u5174\u8DA3\u4E0D\u4FDD\u8BC1\u5C31\u4E1A\u9002\u914D\u3002"],
  ["NO_EMPLOYMENT_DECISION_AUTHORITY", "This evidence does not decide employment outcomes.", "\u8FD9\u4E9B\u8BC1\u636E\u4E0D\u51B3\u5B9A\u5C31\u4E1A\u7ED3\u679C\u3002"],
  ["RAW_KEYED_IPIP_SCORE", "Raw keyed IPIP score.", "IPIP \u539F\u59CB\u8BA1\u5206\u3002"],
  ["RAW_KEYED_IPIP_FACET_SCORE", "Raw keyed IPIP facet score.", "IPIP \u7EC6\u5206\u7EF4\u5EA6\u539F\u59CB\u8BA1\u5206\u3002"],
  ["NOT_NORMED", "No population norms are applied.", "\u672A\u5E94\u7528\u4EBA\u7FA4\u5E38\u6A21\u3002"],
  ["NOT_DIAGNOSTIC", "This is not a diagnosis.", "\u8FD9\u4E0D\u662F\u8BCA\u65AD\u3002"],
  ["PHI_OS_ADAPTED_SCORING", "PHI OS adapted scoring.", "PHI OS \u6539\u7F16\u8BA1\u5206\u3002"],
  ["NOT_OFFICIAL_OECD_SCORE", "This is not an official OECD score.", "\u8FD9\u4E0D\u662F\u5B98\u65B9 OECD \u5206\u6570\u3002"],
  ["NOT_FINANCIAL_ADVICE", "This is not financial advice.", "\u8FD9\u4E0D\u662F\u8D22\u52A1\u5EFA\u8BAE\u3002"],
  ["ONET_RIASEC", "O*NET RIASEC interests", "O*NET \u516D\u7C7B\u804C\u4E1A\u5174\u8DA3"],
  ["rawTotal", "Raw total", "\u539F\u59CB\u603B\u5206"],
  ["RESULT_LABEL", "Result label", "\u7ED3\u679C\u540D\u79F0"],
  ["EVIDENCE", "Source evidence", "\u6765\u6E90\u8BC1\u636E"],
  ["Where are these interests actually showing up now?", "Where are these interests actually showing up now?", "\u8FD9\u4E9B\u5174\u8DA3\u76EE\u524D\u5B9E\u9645\u51FA\u73B0\u5728\u54EA\u4E9B\u60C5\u5883\u4E2D\uFF1F"],
  ["Symbolic lens emphasizes a different operating pattern", "Symbolic lens emphasizes a different operating pattern", "\u8C61\u5F81\u89C6\u89D2\u5F3A\u8C03\u4E86\u4E0D\u540C\u7684\u8FD0\u4F5C\u6A21\u5F0F"],
  ["Provider result supplied by customer", "Provider result supplied by customer", "\u5BA2\u6237\u63D0\u4F9B\u7684\u5916\u90E8\u6D4B\u8BC4\u7ED3\u679C"]
].forEach((x) => add(...x));
[
  ["Each source keeps its own evidence class.", "\u4E0D\u540C\u6765\u6E90\u4FDD\u7559\u5404\u81EA\u7684\u8BC1\u636E\u7C7B\u522B\u3002"],
  ["No universal personality master score is created.", "\u4E0D\u4F1A\u751F\u6210\u603B\u4EBA\u683C\u5206\u6570\u3002"],
  ["Reasoning task performance is not IQ and is not a normed percentile.", "\u63A8\u7406\u4EFB\u52A1\u8868\u73B0\u4E0D\u662F IQ\uFF0C\u4E5F\u4E0D\u662F\u5E38\u6A21\u767E\u5206\u4F4D\u3002"],
  ["Self-assessment is not a diagnosis.", "\u81EA\u6211\u8BC4\u4F30\u4E0D\u662F\u8BCA\u65AD\u3002"],
  ["A symbolic perspective does not become scientifically validated because it resembles a questionnaire result.", "\u8C61\u5F81\u89C6\u89D2\u4E0D\u4F1A\u56E0\u4E3A\u4E0E\u95EE\u5377\u7ED3\u679C\u76F8\u4F3C\u800C\u83B7\u5F97\u79D1\u5B66\u9A8C\u8BC1\u3002"],
  ["These sources point in different directions and remain separate evidence classes.", "\u8FD9\u4E9B\u6765\u6E90\u6307\u5411\u4E0D\u540C\u65B9\u5411\uFF0C\u4ECD\u4FDD\u7559\u5404\u81EA\u7684\u8BC1\u636E\u7C7B\u522B\u3002"],
  ["The imported result and the customer self-report are not flattened into one conclusion.", "\u5BFC\u5165\u7ED3\u679C\u4E0E\u5BA2\u6237\u81EA\u9648\u4FDD\u7559\u4E3A\u4E0D\u540C\u8BC1\u636E\uFF0C\u4E0D\u5408\u5E76\u6210\u540C\u4E00\u7ED3\u8BBA\u3002"],
  ["The two self-reports differ on this domain; this opens a reality-check target rather than a compatibility verdict.", "\u4E24\u4EFD\u81EA\u9648\u5728\u8FD9\u4E2A\u9886\u57DF\u5B58\u5728\u5DEE\u5F02\uFF0C\u53EF\u4F5C\u4E3A\u73B0\u5B9E\u6838\u5BF9\u76EE\u6807\uFF0C\u4E0D\u6784\u6210\u517C\u5BB9\u5EA6\u5224\u65AD\u3002"],
  ["A provider-specific dimension difference is kept as an observation target only.", "\u63D0\u4F9B\u65B9\u7279\u5B9A\u7EF4\u5EA6\u7684\u5DEE\u5F02\u4EC5\u4FDD\u7559\u4E3A\u89C2\u5BDF\u76EE\u6807\u3002"],
  ["The two source classes remain in tension.", "\u4E24\u7C7B\u6765\u6E90\u4E4B\u95F4\u7684\u5F20\u529B\u4ECD\u7136\u4FDD\u7559\u3002"],
  ["Current Reality currently contradicts this self-reported signal.", "\u5F53\u4E0B\u73B0\u5B9E\u76EE\u524D\u4E0E\u8FD9\u9879\u81EA\u9648\u8BC1\u636E\u4E0D\u4E00\u81F4\u3002"],
  ["Compared with Current Reality", "\u4E0E\u5F53\u4E0B\u73B0\u5B9E\u5BF9\u7167"],
  ["Adapted from the OECD/INFE Toolkit for Measuring Financial Literacy, Inclusion and Well-Being 2026. PHI OS has modified and shortened content; this is not an official OECD score or OECD-endorsed instrument.", "\u6839\u636E OECD/INFE 2026 \u5E74\u91D1\u878D\u7D20\u517B\u3001\u666E\u60E0\u91D1\u878D\u4E0E\u798F\u7949\u6D4B\u91CF\u5DE5\u5177\u6539\u7F16\u3002PHI OS \u5BF9\u5185\u5BB9\u8FDB\u884C\u4E86\u4FEE\u6539\u548C\u7F29\u51CF\uFF1B\u8FD9\u4E0D\u662F\u5B98\u65B9 OECD \u5206\u6570\uFF0C\u4E5F\u4E0D\u662F OECD \u8BA4\u53EF\u7684\u6D4B\u91CF\u5DE5\u5177\u3002"]
].forEach(([en, zh2]) => add(en, en, zh2));
function evidenceLabel(value, locale = "en") {
  if (value == null || value === "") return "";
  if (typeof value === "object") return value[locale] || value.en || "";
  const text = String(value), entry = terms[text] || terms[text.toUpperCase()];
  if (entry) return entry[locale === "zh-Hans" ? 1 : 0];
  if (text.includes("::")) return text.split("::").filter((x) => !["EXTERNAL_PROFILE", "RESULT_LABEL"].includes(x)).map((x) => evidenceLabel(x, locale)).join(" \xB7 ");
  if (/^[A-Z][A-Z0-9_-]+$/.test(text) && !/^([EI][NS][TF][JP](-[AT])?|RM\d+|IPIP|RIASEC|IQ|OECD)$/.test(text)) return locale === "zh-Hans" ? "\u6765\u6E90\u9879\u76EE" : "Source item";
  return text;
}
function evidenceStatement(value, locale = "en") {
  return evidenceLabel(value, locale);
}
function evidenceValueRows(value, locale = "en") {
  if (value == null) return [];
  if (typeof value !== "object") return [[locale === "zh-Hans" ? "\u7ED3\u679C" : "Result", evidenceLabel(value, locale)]];
  return Object.entries(value).filter(([key, v]) => terms[key] && v != null && typeof v !== "object").map(([key, v]) => [evidenceLabel(key, locale), typeof v === "boolean" ? locale === "zh-Hans" ? v ? "\u662F" : "\u5426" : v ? "Yes" : "No" : evidenceLabel(v, locale)]);
}

// assets/customer-ui/js/visuals/profile-visual-mvp.js
var list = (v) => Array.isArray(v) ? v : [];
var esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var zh = (l) => l === "zh-Hans";
var humanize = (v, locale) => evidenceLabel(v, locale);
var stateReady = (fig) => fig?.state === "READY";
function nativeValue(v, locale) {
  if (v == null) return "\u2014";
  if (typeof v === "number" || typeof v === "string") return evidenceLabel(v, locale);
  if (typeof v.normalizedSelfReportIndex === "number") return `${Math.round(v.normalizedSelfReportIndex)}/100`;
  if (typeof v.score === "number") return String(v.score);
  if (typeof v.rawScore === "number") return String(v.rawScore);
  if (typeof v.correctCount === "number") return String(v.correctCount);
  const pairs = evidenceValueRows(v, locale).slice(0, 2);
  return pairs.length ? pairs.map(([k, x]) => `${k} ${x}`).join(" \xB7 ") : "\u2014";
}
var empty = (fig, locale, detail = "") => `<section class="prf-pfig prf-pfig--empty" data-pfig="${esc(fig?.pfig || "")}"><div class="prf-pfig-empty__mark" aria-hidden="true"></div><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u8D44\u6599\u4ECD\u5728\u5F62\u6210" : "Evidence still forming"}</p><h3>${esc(evidenceLabel(fig?.customerLabel?.[locale] || fig?.customerLabel?.en || "Evidence view", locale))}</h3><p>${esc(detail || (zh(locale) ? "\u76EE\u524D\u6CA1\u6709\u8DB3\u591F\u3001\u53EF\u76F4\u63A5\u6295\u5F71\u7684\u8BC1\u636E\uFF1BPHI OS \u4E0D\u4F1A\u8865\u5199\u7F3A\u5931\u7ED3\u679C\u3002" : "There is not enough governed evidence to render this view yet. PHI OS will not fill the gaps."))}</p></div></section>`;
function dimensionMap(fig, locale) {
  if (!stateReady(fig)) return empty(fig, locale, zh(locale) ? "\u5B8C\u6210\u4E00\u4E2A\u4E2A\u4EBA\u8BC1\u636E\u6765\u6E90\u540E\uFF0C\u8FD9\u91CC\u4F1A\u6309\u6765\u6E90\u5206\u522B\u663E\u793A\u53EF\u89C2\u5BDF\u7EF4\u5EA6\u3002" : "Complete an evidence source to see its dimensions here, kept separate by source.");
  const lanes = list(fig.data?.lanes);
  return `<section class="prf-pfig prf-pfig--dimension" data-pfig="PFIG-001"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u6765\u6E90\u5206\u5C42" : "SOURCE-AWARE"}</p><h3>${zh(locale) ? "\u4E2A\u4EBA\u8BC1\u636E\u7EF4\u5EA6\u5730\u56FE" : "Personal evidence dimension map"}</h3></div><p>${zh(locale) ? "\u6BCF\u4E00\u7EC4\u90FD\u4FDD\u7559\u539F\u59CB\u6765\u6E90\uFF0C\u4E0D\u628A\u4E0D\u540C\u6D4B\u91CF\u4F53\u7CFB\u5408\u6210\u540C\u4E00\u5206\u6570\u3002" : "Each lane keeps its original source. Different instruments are not merged into one score."}</p></header><div class="prf-dimension-lanes">${lanes.map((l) => `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${esc(humanize(l.providerFamily || l.sourceClass || l.sourceKey, locale))}</span><small>${esc(humanize(l.sourceClass || "", locale))}</small></div><div class="prf-dimension-lane__items">${list(l.dimensions).map((d) => `<div class="prf-dimension-chip"><span>${esc(humanize(d.facetId || d.domainId || "Signal", locale))}</span><strong>${esc(nativeValue(d.value, locale))}</strong></div>`).join("")}</div></article>`).join("")}</div></section>`;
}
function itemLabel(x, locale) {
  return evidenceStatement(x?.label || x?.title || x?.statement || x?.note, locale) || (zh(locale) ? "\u5DF2\u89C2\u5BDF\u6A21\u5F0F" : "Observed pattern");
}
function strengthCost(fig, locale) {
  if (!stateReady(fig)) return empty(fig, locale, zh(locale) ? "\u5F53\u4F60\u786E\u8BA4\u67D0\u4E2A\u5DF2\u89C2\u5BDF\u6A21\u5F0F\u201C\u5E2E\u52A9\u6211\u201D\u201C\u6D88\u8017\u6211\u201D\u6216\u4E24\u8005\u517C\u6709\u65F6\uFF0C\u8FD9\u91CC\u624D\u4F1A\u51FA\u73B0\u8D44\u6E90\uFF0F\u6210\u672C\u5730\u56FE\u3002" : "This view appears only when an observed pattern is confirmed as helping, costing, or both.");
  const resources = list(fig.data?.resources), costs = list(fig.data?.costs);
  const col = (rows, type) => `<div class="prf-sc-col" data-kind="${type}"><div class="prf-sc-col__title"><span aria-hidden="true"></span><b>${type === "resource" ? zh(locale) ? "\u53EF\u8C03\u7528\u8D44\u6E90" : "Observed resources" : zh(locale) ? "\u6210\u672C\u4E0E\u5F20\u529B" : "Costs & tensions"}</b></div>${rows.length ? rows.map((x) => `<article><strong>${esc(itemLabel(x, locale))}</strong>${x?.contextType ? `<small>${esc(humanize(x.contextType, locale))}</small>` : ""}</article>`).join("") : `<p class="prf-sc-col__none">${zh(locale) ? "\u76EE\u524D\u6CA1\u6709\u5DF2\u786E\u8BA4\u9879\u76EE" : "No confirmed items yet"}</p>`}</div>`;
  return `<section class="prf-pfig" data-pfig="PFIG-003"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u73B0\u5B9E\u786E\u8BA4" : "REALITY-CONFIRMED"}</p><h3>${zh(locale) ? "\u8D44\u6E90\u4E0E\u6210\u672C\u5730\u56FE" : "Resource & cost map"}</h3></div><p>${zh(locale) ? "\u9AD8\u5206\u4E0D\u4F1A\u81EA\u52A8\u53D8\u6210\u4F18\u52BF\uFF0C\u4F4E\u5206\u4E5F\u4E0D\u4F1A\u81EA\u52A8\u53D8\u6210\u5F31\u70B9\u3002\u8FD9\u91CC\u53EA\u663E\u793A\u5DF2\u6709\u8BC1\u636E\u4E0E\u73B0\u5B9E\u786E\u8BA4\u3002" : "High scores do not automatically become strengths, and low scores do not become weaknesses. This view uses governed evidence and reality confirmation only."}</p></header><div class="prf-sc-grid">${col(resources, "resource")}${col(costs, "cost")}</div></section>`;
}
function patternRadar(fig, locale) {
  if (!stateReady(fig)) return empty(fig, locale, zh(locale) ? "\u5F53\u540C\u4E00\u6765\u6E90\u5177\u6709\u81F3\u5C11\u4E24\u4E2A\u53EF\u6BD4\u8F83\u7EF4\u5EA6\u65F6\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u6765\u6E90\u5185\u7684\u6A21\u5F0F\u5206\u5E03\u3002" : "A source-native pattern appears here when one source has at least two comparable dimensions.");
  const series = list(fig.data?.series);
  return `<section class="prf-pfig" data-pfig="PFIG-002"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u6765\u6E90\u5185\u6A21\u5F0F" : "WITHIN-SOURCE"}</p><h3>${zh(locale) ? "\u6D4B\u8BC4\u6A21\u5F0F" : "Assessment pattern"}</h3></div><p>${zh(locale) ? "\u6BCF\u6761\u5E8F\u5217\u53EA\u5C5E\u4E8E\u81EA\u5DF1\u7684\u6765\u6E90\uFF1B\u4E0D\u540C\u6D4B\u8BC4\u4E0D\u4F1A\u5408\u5E76\u6210\u603B\u4EBA\u683C\u96F7\u8FBE\u3002" : "Each series stays within its own source. Different instruments are not merged into one master personality radar."}</p></header><div class="prf-dimension-lanes">${series.map((row) => `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${esc(humanize(row.providerFamily || row.sourceClass || row.sourceKey, locale))}</span><small>${esc(humanize(row.sourceClass || "", locale))}</small></div><div class="prf-dimension-lane__items">${list(row.points).map((p) => `<div class="prf-dimension-chip"><span>${esc(humanize(p.axis, locale))}</span><strong>${esc(nativeValue(p.value, locale))}</strong></div>`).join("")}</div></article>`).join("")}</div></section>`;
}
function contextVariation(fig, locale) {
  if (!hasRenderablePersonalEvidenceFigure(fig)) return empty(fig, locale, zh(locale) ? "\u52A0\u5165\u5E26\u6709\u660E\u786E\u60C5\u5883\u7684\u73B0\u5B9E\u89C2\u5BDF\u540E\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u8BC1\u636E\u5982\u4F55\u968F\u60C5\u5883\u53D8\u5316\u3002" : "Add explicit context observations to see how evidence varies across contexts.");
  const observations = list(fig.data?.observations);
  const ctxs = list(fig.data?.contexts);
  return `<section class="prf-pfig" data-pfig="PFIG-004"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u60C5\u5883" : "CONTEXT"}</p><h3>${zh(locale) ? "\u60C5\u5883\u53D8\u5316" : "Context variation"}</h3></div><p>${zh(locale) ? "\u8FD9\u91CC\u53EA\u663E\u793A\u660E\u786E\u8BB0\u5F55\u7684\u60C5\u5883\uFF1B\u672A\u89C2\u5BDF\u5230\u7684\u60C5\u5883\u7EE7\u7EED\u4FDD\u6301\u672A\u77E5\u3002" : "Only explicitly recorded contexts appear here. Unobserved contexts remain unknown."}</p></header><div class="prf-dimension-lanes">${ctxs.map((ctx) => {
    const rows = observations.filter((x) => x.contextType === ctx);
    return `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${esc(humanize(ctx, locale))}</span><small>${rows.length} ${zh(locale) ? "\u9879\u89C2\u5BDF" : "observation(s)"}</small></div><div class="prf-dimension-lane__items">${rows.map((x) => `<div class="prf-dimension-chip"><span>${esc(itemLabel(x, locale))}</span><strong>${esc(humanize(x.confirmation || "UNSURE", locale))}</strong></div>`).join("")}</div></article>`;
  }).join("")}</div></section>`;
}
function workMap(fig, locale) {
  if (!stateReady(fig)) return empty(fig, locale, zh(locale) ? "\u52A0\u5165\u804C\u4E1A\u5174\u8DA3\u6216\u5DE5\u4F5C\u60C5\u5883\u89C2\u5BDF\u540E\uFF0C\u8FD9\u91CC\u4F1A\u5F62\u6210\u5DE5\u4F5C\u8BC1\u636E\u5730\u56FE\u3002" : "Add career-interest or work-context evidence to open this work map.");
  const interest = fig.data?.interestEvidence;
  const observed = list(fig.data?.observedExpression);
  const axes = list(interest?.axes);
  return `<section class="prf-pfig" data-pfig="PFIG-006"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u5DE5\u4F5C\u8BC1\u636E" : "WORK EVIDENCE"}</p><h3>${zh(locale) ? "\u5DE5\u4F5C\u5174\u8DA3\u4E0E\u8868\u8FBE" : "Work interest & expression"}</h3></div><p>${zh(locale) ? "\u804C\u4E1A\u5174\u8DA3\u4E0D\u662F\u80FD\u529B\u6216\u5C31\u4E1A\u9002\u914D\u7ED3\u8BBA\uFF1B\u73B0\u5B9E\u89C2\u5BDF\u53EF\u4EE5\u8865\u5145\u5B83\u5728\u5DE5\u4F5C\u4E2D\u7684\u5B9E\u9645\u8868\u8FBE\u3002" : "Career interest is not an ability or job-fit verdict. Real-world observations may add evidence about expression at work."}</p></header><div class="prf-dimension-lanes">${axes.length ? `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>RIASEC</span><small>${zh(locale) ? "\u804C\u4E1A\u5174\u8DA3" : "Career interest"}</small></div><div class="prf-dimension-lane__items">${axes.map((a) => `<div class="prf-dimension-chip"><span>${esc(evidenceLabel(a.label || a.code || "Interest", locale))}</span><strong>${esc(nativeValue(a.score, locale))}</strong></div>`).join("")}</div></article>` : ""}${observed.length ? `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${zh(locale) ? "\u73B0\u5B9E\u89C2\u5BDF" : "Observed expression"}</span><small>${zh(locale) ? "\u5DE5\u4F5C" : "Work"}</small></div><div class="prf-dimension-lane__items">${observed.map((x) => `<div class="prf-dimension-chip"><span>${esc(itemLabel(x, locale))}</span><strong>${esc(humanize(x.confirmation || "UNSURE", locale))}</strong></div>`).join("")}</div></article>` : ""}</div></section>`;
}
function relationshipMap(fig, locale) {
  if (!stateReady(fig)) return empty(fig, locale, zh(locale) ? "\u52A0\u5165\u5173\u7CFB\u60C5\u5883\u7684\u89C2\u5BDF\u6216\u5DF2\u6CBB\u7406\u7684\u5173\u7CFB\u8BC1\u636E\u540E\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u4E92\u52A8\u8BC1\u636E\u3002" : "Add relationship observations or evidence to open this interaction view.");
  const observed = list(fig.data?.observations);
  const rel = fig.data?.relationshipEvidence;
  return `<section class="prf-pfig" data-pfig="PFIG-007"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u5173\u7CFB\u8BC1\u636E" : "RELATIONSHIP EVIDENCE"}</p><h3>${zh(locale) ? "\u5173\u7CFB\u4E92\u52A8" : "Relationship interaction"}</h3></div><p>${zh(locale) ? "\u8FD9\u91CC\u4E0D\u4EA7\u751F\u517C\u5BB9\u5EA6\u3001\u5BF9\u65B9\u9690\u85CF\u72B6\u6001\u6216\u5173\u7CFB\u7ED3\u679C\u9884\u6D4B\u3002" : "This view does not create compatibility scores, hidden-partner inference, or outcome predictions."}</p></header><div class="prf-dimension-lanes">${observed.length ? `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${zh(locale) ? "\u5DF2\u89C2\u5BDF\u4E92\u52A8" : "Observed interaction"}</span><small>${zh(locale) ? "\u5173\u7CFB" : "Relationship"}</small></div><div class="prf-dimension-lane__items">${observed.map((x) => `<div class="prf-dimension-chip"><span>${esc(itemLabel(x, locale))}</span><strong>${esc(humanize(x.confirmation || "UNSURE", locale))}</strong></div>`).join("")}</div></article>` : ""}${rel ? `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${zh(locale) ? "\u5173\u7CFB\u6765\u6E90" : "Relationship source"}</span><small>${esc(humanize(rel.sourceClass || rel.kind || "EVIDENCE", locale))}</small></div><div class="prf-dimension-lane__items"><div class="prf-dimension-chip"><span>${esc(list(rel.evidence).map((x) => itemLabel(x, locale)).join(" \xB7 ") || itemLabel(rel, locale))}</span><strong>${zh(locale) ? "\u4FDD\u7559\u6765\u6E90" : "Source preserved"}</strong></div></div></article>` : ""}</div></section>`;
}
function decisionMap(fig, locale) {
  if (!stateReady(fig)) return empty(fig, locale, zh(locale) ? "\u5F53\u89C4\u5212\u3001\u98CE\u9669\u610F\u8BC6\u3001\u51B3\u7B56\u7EAA\u5F8B\u6216\u73B0\u5B9E\u51B3\u7B56\u89C2\u5BDF\u53EF\u7528\u65F6\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u51B3\u7B56\u8BC1\u636E\u3002" : "Decision evidence appears when planning, risk awareness, decision discipline, or relevant current observations are available.");
  const dims = list(fig.data?.decisionEvidence);
  const current = list(fig.data?.currentPattern);
  return `<section class="prf-pfig" data-pfig="PFIG-008"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u51B3\u7B56\u8BC1\u636E" : "DECISION EVIDENCE"}</p><h3>${zh(locale) ? "\u5F53\u524D\u51B3\u7B56\u8BC1\u636E" : "Current decision evidence"}</h3></div><p>${zh(locale) ? "\u5B83\u4E0D\u662F\u56FA\u5B9A\u51B3\u7B56\u7C7B\u578B\uFF0C\u4E5F\u4E0D\u6784\u6210\u8D22\u52A1\u5EFA\u8BAE\u3002" : "This is not a fixed decision type and it does not constitute financial advice."}</p></header><div class="prf-dimension-lanes">${dims.length ? `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${zh(locale) ? "\u6765\u6E90\u7EF4\u5EA6" : "Source dimensions"}</span><small>${dims.length}</small></div><div class="prf-dimension-lane__items">${dims.map((x) => `<div class="prf-dimension-chip"><span>${esc(humanize(x.facetId || x.domainId || "Decision", locale))}</span><strong>${esc(nativeValue(x.value, locale))}</strong></div>`).join("")}</div></article>` : ""}${current.length ? `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${zh(locale) ? "\u5F53\u4E0B\u73B0\u5B9E" : "Current reality"}</span><small>${zh(locale) ? "\u73B0\u5B9E\u89C2\u5BDF" : "Observed context"}</small></div><div class="prf-dimension-lane__items">${current.map((x) => `<div class="prf-dimension-chip"><span>${esc(itemLabel(x, locale))}</span><strong>${esc(humanize(x.confirmation || "UNSURE", locale))}</strong></div>`).join("")}</div></article>` : ""}</div></section>`;
}
var stateMeta = (locale) => ({
  CONVERGES: { label: zh(locale) ? "\u8D8B\u540C" : "Converges", hint: zh(locale) ? "\u4E0D\u540C\u6765\u6E90\u6307\u5411\u76F8\u8FD1\u89C2\u5BDF" : "Sources point toward a similar observation" },
  CONTEXT_DEPENDENT: { label: zh(locale) ? "\u89C6\u60C5\u5883\u800C\u53D8" : "Context-dependent", hint: zh(locale) ? "\u5DEE\u5F02\u53EF\u7531\u660E\u786E\u60C5\u5883\u8BC1\u636E\u89E3\u91CA" : "Difference is tied to explicit context evidence" },
  DIVERGES: { label: zh(locale) ? "\u5206\u6B67" : "Diverges", hint: zh(locale) ? "\u6765\u6E90\u4E4B\u95F4\u5B58\u5728\u660E\u786E\u4E0D\u4E00\u81F4" : "Sources remain explicitly different" },
  UNKNOWN: { label: zh(locale) ? "\u5C1A\u672A\u786E\u8BA4" : "Unknown", hint: zh(locale) ? "\u8BC1\u636E\u4E0D\u8DB3\uFF0C\u4E0D\u5F3A\u884C\u5F52\u7C7B" : "Insufficient evidence; no forced classification" }
});
function convergence(fig, locale) {
  if (!stateReady(fig)) return empty(fig, locale, zh(locale) ? "\u52A0\u5165\u7B2C\u4E8C\u4E2A\u53EF\u6BD4\u8F83\u6765\u6E90\uFF0C\u6216\u4E0E\u5F53\u4E0B\u73B0\u5B9E \u5BF9\u7167\u540E\uFF0C\u8FD9\u91CC\u624D\u4F1A\u663E\u793A\u8DE8\u6765\u6E90\u5173\u7CFB\u3002" : "Add another comparable source, or compare with current reality, to open this cross-source view.");
  const rows = list(fig.data?.perspectives), meta = stateMeta(locale);
  const groups = ["CONVERGES", "CONTEXT_DEPENDENT", "DIVERGES", "UNKNOWN"];
  return `<section class="prf-pfig" data-pfig="PFIG-005"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u8DE8\u6765\u6E90" : "CROSS-SOURCE"}</p><h3>${zh(locale) ? "\u8D8B\u540C\u3001\u60C5\u5883\u4E0E\u5206\u6B67" : "Convergence & divergence"}</h3></div><p>${zh(locale) ? "\u76F8\u4F3C\u4E0D\u4EE3\u8868\u4E92\u76F8\u9A8C\u8BC1\uFF1B\u5206\u6B67\u4E5F\u53EF\u4EE5\u4FDD\u7559\u3002" : "Similarity does not validate one source with another; disagreement is allowed to remain visible."}</p></header><div class="prf-convergence-grid">${groups.map((g) => {
    const hits = rows.filter((x) => x.projectionState === g);
    return `<article class="prf-convergence-state" data-state="${g}"><div class="prf-convergence-state__top"><span></span><strong>${esc(meta[g].label)}</strong><b>${hits.length}</b></div><small>${esc(meta[g].hint)}</small>${hits.slice(0, 3).map((x) => `<p>${esc(evidenceStatement(x.statement, locale) || meta[g].hint)}</p>`).join("")}</article>`;
  }).join("")}</div></section>`;
}
function realityBridge(fig, locale) {
  if (!stateReady(fig)) return empty(fig, locale, zh(locale) ? "\u5F53\u4E2A\u4EBA\u8BC1\u636E\u4E0E\u5F53\u4E0B\u73B0\u5B9E\u3001\u77DB\u76FE\u8BC1\u636E\u6216\u5DF2\u6709\u89C2\u5BDF\u95EE\u9898\u53D1\u751F\u8FDE\u63A5\u65F6\uFF0C\u8FD9\u91CC\u4F1A\u5F62\u6210\u73B0\u5B9E\u6865\u63A5\u3002" : "This bridge appears when personal evidence connects to current reality, contradictions, or an admitted observation question.");
  const contradictions = list(fig.data?.contradictions), questions = list(fig.data?.questions);
  const hasContext = Boolean(fig.data?.contextEvidence?.currentReality);
  const stage = (n, title, body, active = true) => `<div class="prf-bridge-stage" data-active="${active ? "true" : "false"}"><span class="prf-bridge-stage__n">${n}</span><div><strong>${esc(title)}</strong><p>${esc(body)}</p></div></div>`;
  return `<section class="prf-pfig prf-pfig--bridge" data-pfig="PFIG-009"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale) ? "\u73B0\u5B9E\u6865\u63A5" : "REALITY BRIDGE"}</p><h3>${zh(locale) ? "\u4ECE\u4E2A\u4EBA\u8BC1\u636E\u56DE\u5230\u73B0\u5B9E" : "Bring personal evidence back to reality"}</h3></div><p>${zh(locale) ? "\u4E2A\u4EBA\u8BC1\u636E\u63D0\u4F9B\u89C2\u5BDF\u89D2\u5EA6\uFF0C\u5F53\u4E0B\u73B0\u5B9E\u63D0\u4F9B\u5F53\u4E0B\u60C5\u5883\uFF1B\u4E8C\u8005\u4E0D\u4F1A\u4E92\u76F8\u8BC1\u660E\u3002" : "Personal evidence offers a lens; current reality supplies present context. Neither validates the other."}</p></header><div class="prf-bridge-flow">${stage("01", zh(locale) ? "\u4E2A\u4EBA\u8BC1\u636E" : "Personal evidence", zh(locale) ? "\u4FDD\u7559\u6765\u6E90\u4E0E\u65F6\u95F4" : "Source and date stay visible", true)}${stage("02", zh(locale) ? "\u5F53\u4E0B\u73B0\u5B9E" : "Current reality", hasContext ? zh(locale) ? "\u5DF2\u6709\u5F53\u524D\u60C5\u5883\u8BC1\u636E" : "Current context evidence is available" : zh(locale) ? "\u5C1A\u672A\u8FDE\u63A5\u5F53\u524D\u60C5\u5883" : "No current context linked yet", hasContext)}${stage("03", zh(locale) ? "\u9700\u8981\u89C2\u5BDF\u7684\u5DEE\u5F02" : "What to observe", contradictions.length ? zh(locale) ? `${contradictions.length} \u4E2A\u6765\u6E90\uFF0F\u60C5\u5883\u5DEE\u5F02\u4ECD\u53EF\u89C1` : `${contradictions.length} source/context difference(s) remain visible` : zh(locale) ? "\u76EE\u524D\u6CA1\u6709\u660E\u786E\u77DB\u76FE" : "No explicit contradiction in this result", contradictions.length > 0)}${stage("04", zh(locale) ? "\u73B0\u5B9E\u95EE\u9898" : "Reality question", evidenceStatement(questions[0]?.text, locale) || (zh(locale) ? "\u52A0\u5165\u5F53\u4E0B\u73B0\u5B9E \u540E\u518D\u7EE7\u7EED\u89C2\u5BDF\u3002" : "Add current reality to continue the observation."), questions.length > 0)}</div><div class="prf-bridge-actions"><a class="cx-button" href="/perspectives/personal/#cx-current-reality">${zh(locale) ? "\u4E0E\u5F53\u4E0B\u73B0\u5B9E \u5BF9\u7167" : "Compare with current reality"}</a></div></section>`;
}
var PROFILE_VISUAL_MVP_IDS = Object.freeze(["PFIG-001", "PFIG-002", "PFIG-003", "PFIG-004", "PFIG-005", "PFIG-006", "PFIG-007", "PFIG-008", "PFIG-009"]);
function renderPersonalEvidenceFigure(figure, { locale = "en" } = {}) {
  const renderers = { "PFIG-001": dimensionMap, "PFIG-002": patternRadar, "PFIG-003": strengthCost, "PFIG-004": contextVariation, "PFIG-005": convergence, "PFIG-006": workMap, "PFIG-007": relationshipMap, "PFIG-008": decisionMap, "PFIG-009": realityBridge };
  const render = renderers[figure?.pfig];
  if (!render) throw new Error("PERSONAL_EVIDENCE_FIGURE_NOT_ADMITTED");
  return render(figure, locale);
}
function hasRenderablePersonalEvidenceFigure(fig) {
  if (fig?.state !== "READY") return false;
  const d = fig.data || {};
  if (fig.pfig === "PFIG-004") return list(d.contexts).some((c) => list(d.observations).some((x) => x.contextType === c && Boolean(x.label || x.title || x.statement || x.note)));
  return { "PFIG-001": () => list(d.lanes).some((x) => list(x.dimensions).length), "PFIG-002": () => list(d.series).some((x) => list(x.points).length), "PFIG-003": () => list(d.resources).length || list(d.costs).length, "PFIG-005": () => list(d.perspectives).length, "PFIG-006": () => list(d.interestEvidence?.axes).length || list(d.observedExpression).length, "PFIG-007": () => list(d.observations).length || list(d.relationshipEvidence?.evidence).length, "PFIG-008": () => list(d.decisionEvidence).length || list(d.currentPattern).length, "PFIG-009": () => Boolean(d.contextEvidence?.currentReality) || list(d.contradictions).length || list(d.questions).length }[fig.pfig]?.() ? true : false;
}

// functions/canonical-presentation-runtime/personal-evidence-dossier-presentation.js
var esc2 = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
function renderPersonalEvidenceDossier({ dossier, profileView, locale = "en", customerName = "", subject = "", reviewPreview = false, report = null, cprHandoff = null }) {
  if (!reviewPreview && (report?.canonicalState !== "RELEASED" || cprHandoff?.sourceReportDigest !== report.reportDigest || cprHandoff?.targetRuntime !== "CPR")) throw new Error("CPR_PERSONAL_EVIDENCE_RELEASE_REQUIRED");
  if (!reviewPreview && report.customer !== profileView?.participantRef) throw new Error("CPR_PERSONAL_EVIDENCE_CUSTOMER_MISMATCH");
  if (dossier?.participantRef !== profileView?.participantRef) throw new Error("CPR_PERSONAL_EVIDENCE_SUBJECT_MISMATCH");
  const zh2 = locale === "zh-Hans", cards = profileView.signalCards || [];
  const page = (body, attrs = "") => `<article class="pub-page pe-body" ${attrs}>${body}</article>`;
  const staticPage = (asset, cover = false) => `<article class="pub-static" data-pe-static="${esc2(asset.id)}"><img src="${esc2(asset.publicUrl)}" alt="${zh2 ? "\u6863\u6848\u9759\u6001\u89C6\u89C9" : "Dossier static visual"}" loading="eager" onerror="this.nextElementSibling.hidden=false"><p class="pe-asset-error" hidden>${zh2 ? "\u73B0\u6709\u9759\u6001\u89C6\u89C9\u6682\u65F6\u65E0\u6CD5\u52A0\u8F7D\uFF1B\u6253\u5370\u5C1A\u672A\u5C31\u7EEA\u3002" : "Existing static visual is unavailable. Print is not ready."}</p>${cover ? `<div class="pe-cover-values"><span>${esc2(customerName || profileView.participantRef)}</span><span>${esc2(dossier.asOfDate || "")}</span><span>${esc2(subject)}</span></div>` : ""}</article>`;
  const rows = (card) => `<div class="pe-source"><strong>${esc2(evidenceLabel(card.sourceClass, locale))}</strong><p>${esc2(evidenceLabel(card.domainId, locale))} ${esc2(evidenceLabel(card.facetId, locale))}</p><dl>${evidenceValueRows(card.value, locale).map(([k, v]) => `<div><dt>${esc2(k)}</dt><dd>${esc2(v)}</dd></div>`).join("")}</dl><p>${esc2(evidenceLabel(card.providerFamily, locale))} \xB7 ${esc2(card.assessmentDate || (zh2 ? "\u65E5\u671F\u672A\u77E5" : "Date unknown"))}</p><ul>${(card.precisionBoundary || []).map((x) => `<li>${esc2(evidenceStatement(x, locale))}</li>`).join("")}</ul></div>`;
  let html = dossier.staticPages.map((a, i) => staticPage(a, i === 0)).join("");
  for (const section of dossier.sections) {
    html += staticPage(section.master);
    for (const fig of section.pfigs) if (hasRenderablePersonalEvidenceFigure(fig)) html += page(renderPersonalEvidenceFigure(fig, { locale }), `data-pe-section="${esc2(section.section)}"`);
    const selected = section.section === "SEC-02" ? cards : section.section === "SEC-08" ? cards.filter((c) => String(c.domainId).startsWith("FINANCIAL_CAPABILITY") || c.sourceClass === "EXTERNAL_PROFILE_RESULT") : [];
    let group = [], lineCount = 0;
    const emit = () => {
      if (group.length) html += page(group.map(rows).join(""), `data-pe-section="${esc2(section.section)}"`);
      group = [];
      lineCount = 0;
    };
    for (const card of selected) {
      const lines = JSON.stringify(card.value ?? null, null, 2).split("\n").length + (card.precisionBoundary || []).length + 6;
      if (lineCount + lines > 32) emit();
      group.push(card);
      lineCount += lines;
    }
    emit();
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
