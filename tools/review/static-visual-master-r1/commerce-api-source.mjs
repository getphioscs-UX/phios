// functions/commerce/commerce-environment.js
var STRIPE_LIVE_ACCOUNT = "acct_1Pkdz8B2F823WiPt";
function commerceEnvironment(env = {}) {
  return env.STRIPE_ENVIRONMENT === "LIVE" ? "LIVE" : "QA";
}
function commerceStripeProduct(product, environment) {
  if (environment !== "LIVE") return product;
  if (!product.liveProductId || !product.livePriceId) throw Object.assign(Error("Live product binding not configured."), { status: 503, code: "stripe_live_product_unbound" });
  return { ...product, qaProductId: product.liveProductId, qaPriceId: product.livePriceId };
}
function requireStripeCommerce(env = {}) {
  const environment = commerceEnvironment(env), live = environment === "LIVE";
  const valid = live ? /^(sk|rk)_live_/ : /^(sk|rk)_test_/;
  if (!valid.test(env.STRIPE_SECRET_KEY || "") || live && env.PHIOS_COMMERCE_LIVE_ENABLED !== "true") throw Object.assign(Error("Stripe environment is not admitted."), { status: 503, code: live ? "stripe_live_gate_closed" : "stripe_qa_required" });
  return environment;
}
function commerceCheckoutAvailable(env = {}) {
  try {
    const mode = requireStripeCommerce(env);
    return mode === "LIVE" ? env.PHIOS_COMMERCE_LIVE_ENABLED === "true" : env.PHIOS_COMMERCE_QA_ENABLED === "true";
  } catch {
    return false;
  }
}

// functions/pws/commercial/commerce-economics-policy.js
var COMMERCE_ECONOMICS_VERSION = "PHIOS-COMMERCE-2026-10-09";
var rows = [
  ["COM-REPORT-BAZI-FULL", 5900, 4, false, "BZR"],
  ["COM-REPORT-ZIWEI-FULL", 5900, 3, false, "ZWR"],
  ["COM-REPORT-ASTROLOGY-FULL", 5900, 3, false, "AST"],
  ["COM-REPORT-PROFILE-FULL", 12900, 6, true, "PROFILE"],
  ["COM-REPORT-HD-FULL", 12900, 5, false, "HD"],
  ["COM-REPORT-ECR-FULL", 12900, 6, false, "ECR"],
  ["COM-REPORT-NUMEROLOGY-FULL", 3900, 2, false, "NUM"],
  ["COM-REPORT-CROSS-FULL", 29900, 10, false, "CROSS"],
  ["COM-READING-TAROT-FULL", 1900, 1, true, "TAROT"],
  ["COM-READING-ICHING-FULL", 3900, 2, true, "ICHING"],
  ["COM-REPORT-FINANCIAL-FULL", 15900, 7, true, "FINANCIAL"],
  ["COM-WILL-WRITING", 2900, 2, true, "WILL"],
  ["COM-REPORT-BUNDLE-2", 9900, null, false, null],
  ["COM-REPORT-BUNDLE-3", 14900, null, false, null]
];
var COMMERCE_ECONOMICS = Object.freeze(Object.fromEntries(rows.map(([productId, amountMinor, providerCapUsd, bilingualOnly, methodId]) => [productId, Object.freeze({ productId, amountMinor, currency: "MYR", providerCapUsd, bilingualOnly, methodId, bilingualSurchargeMinor: bilingualOnly ? 0 : 1e3, includedFollowups: 4, freeProviderCalls: 0, costScope: "REPORT_REPAIR_BILINGUAL_AND_FOUR_FOLLOWUPS" })])));
var STANDARD_BUNDLE_PRODUCTS = Object.freeze(["COM-REPORT-BAZI-FULL", "COM-REPORT-ZIWEI-FULL", "COM-REPORT-ASTROLOGY-FULL"]);
var RETIRED_COMMERCE_PRODUCTS = Object.freeze(["COM-REPORT-BUNDLE-5PLUS"]);

// functions/pws/commercial/report-successor-contract-history.js
var freeze = (v) => {
  if (v && typeof v === "object") {
    Object.values(v).forEach(freeze);
    Object.freeze(v);
  }
  return v;
};
var REPORT_COMMERCE_CONTRACT_ID = "phi-os.pws.report-commerce-successor.v1";
var version = "1.0.0";
var effectiveAt = "2026-09-17T00:00:00.000Z";
var singles = [["BAZI", "BZR", 3900], ["ZIWEI", "ZWR", 3900], ["ASTROLOGY", "AST", 3900], ["PROFILE", "PROFILE", 3900], ["NUMEROLOGY", "NUM", 3900], ["ECR", "ECR", 3900], ["HD", "HD", 12900], ["CROSS", "CROSS", 29900]].map(([name, methodId, amountMinor]) => ({ productId: `${name}_FULL_REPORT`, productCode: `${name.toLowerCase()}-full-report`, methodId: name === "PROFILE" ? null : methodId, kind: name === "PROFILE" ? "LEGACY_COMPATIBILITY" : methodId === "CROSS" ? "SYNTHESIS" : "SINGLE_METHOD", ...name === "PROFILE" ? { legacyMethodId: "PROFILE", newPrimaryPromotion: false, newPurchaseDefault: false, legacyReadable: true } : { newPrimaryPromotion: true, newPurchaseDefault: true }, amountMinor, currency: "MYR", bundleEligible: ["BAZI", "ZIWEI", "ASTROLOGY", "NUMEROLOGY", "ECR"].includes(name), entitlementKey: `report:${name.toLowerCase()}:full`, selection: null }));
var bundles = [["BUNDLE_2", 6900, 2, 2], ["BUNDLE_3", 9900, 3, 3], ["BUNDLE_5PLUS", 15900, 5, null]].map(([productId, amountMinor, min, max]) => ({ productId, productCode: productId.toLowerCase().replaceAll("_", "-"), methodId: null, kind: "BUNDLE", amountMinor, currency: "MYR", bundleEligible: false, entitlementKey: null, selection: { min, max, eligibilityRegistry: "standard-myr39-personal-evidence-v2", distinct: true } }));
var REPORT_COMMERCE_CONTRACT = freeze({ contractId: REPORT_COMMERCE_CONTRACT_ID, version, effectiveAt, owner: "PWS_COMMERCIAL_RUNTIME", approval: { source: "EXPLICIT_USER_APPROVED_SUCCESSOR_INPUT", baseline: "1046e1ee66db5403142c76f6754729de36d37ce7", successor: "013d3aa6e9d09ab079d0696a5d0b15905fac0783", date: "2026-09-17" }, products: [...singles, ...bundles], eligibilityRegistries: [{ registryId: "standard-myr39-v1", status: "HISTORICAL_ORDER_COMPATIBILITY", productIds: singles.filter((p) => p.bundleEligible || p.productId === "PROFILE_FULL_REPORT").map((p) => p.productId) }, { registryId: "standard-myr39-personal-evidence-v2", status: "FUTURE_SELECTION", productIds: singles.filter((p) => p.bundleEligible).map((p) => p.productId) }], policy: { bundleCreatesCross: false, crossGrantsSingleMethods: false, selectionIsEntitlement: false, clientPaymentSuccessIsAuthority: false, productionPaymentEnabled: false, activationOwner: "EXISTING_PWS_COMMERCE_GATE", entitlementActivationRequires: "SERVER_VERIFIED_PAYMENT_AND_PRODUCT_ADMISSION" } });
var REPORT_PRODUCT_DEFINITIONS = freeze(REPORT_COMMERCE_CONTRACT.products.map((p) => ({ product_code: p.productCode, display_name: p.productId.replaceAll("_", " "), product_type_code: "knowledge_product", state: "draft", current_version: version, legacy_product_ids: [], versions: [{ version, status: "active", effective_at: effectiveAt, components: [{ component_code: `${p.productCode}-reading`, component_type: "knowledge_access", configuration: { knowledge_asset_id: p.productId, access_scope: p.kind === "BUNDLE" ? "selected_independent_full_reports" : "single_subject_full_report", ...p.methodId ? { method_code: p.methodId } : p.kind === "LEGACY_COMPATIBILITY" ? { legacy_method_code: p.legacyMethodId } : { selection_policy_ref: REPORT_COMMERCE_CONTRACT_ID, eligibility_registry_ref: p.selection.eligibilityRegistry } } }] }] })));
var REPORT_PRICE_DEFINITIONS = freeze(REPORT_COMMERCE_CONTRACT.products.map((p) => ({ price_code: `${p.productCode}-myr`, price_version: version, currency_code: p.currency, amount_minor: p.amountMinor, status: "draft", effective_at: effectiveAt })));
var REPORT_OFFER_DEFINITIONS = freeze(REPORT_COMMERCE_CONTRACT.products.map((p) => ({ offer_code: `${p.productCode}-myr`, offer_version: version, display_name: p.productId.replaceAll("_", " "), product_code: p.productCode, product_version: version, price_code: `${p.productCode}-myr`, region_code: "my", customer_segment_code: "public-customer", status: "draft" })));
function resolveReportProduct(reference) {
  const p = REPORT_COMMERCE_CONTRACT.products.find((p2) => p2.productId === reference || p2.productCode === reference);
  if (!p) throw new Error("PWS_REPORT_PRODUCT_NOT_FOUND");
  return p;
}
var REPORT_LANGUAGE_PRICING_VERSION = "REPORT-LANGUAGE-R3-2026-09-23";
var REPORT_LANGUAGE_PRICING_POLICIES = freeze({
  [REPORT_LANGUAGE_PRICING_VERSION]: Object.fromEntries(REPORT_COMMERCE_CONTRACT.products.map((p) => [p.productId, { BILINGUAL: { surchargeMinor: p.productId === "BUNDLE_5PLUS" ? 2e3 : 1e3 } }])),
  "REPORT-LANGUAGE-R2-2026-09-20-CORRECTED": Object.fromEntries(REPORT_COMMERCE_CONTRACT.products.map((p) => [p.productId, { BILINGUAL: { surchargeMinor: p.productId === "BUNDLE_2" ? 0 : p.productId === "BUNDLE_5PLUS" ? 2e3 : 1e3 } }]))
});
function normalizeReportPresentation(input = {}) {
  const { reportLanguageMode, reportLocale } = input;
  if (!(reportLanguageMode === "SINGLE" && ["en", "zh-Hans"].includes(reportLocale) || reportLanguageMode === "BILINGUAL" && reportLocale === "bilingual"))
    throw Object.assign(new Error("Choose the report language explicitly."), { code: "REPORT_PRESENTATION_REQUIRED", status: 422 });
  return freeze({ reportLanguageMode, reportLocale });
}
function quoteReportPresentation(productId, input, selectedProductIds = [], pricingVersion = REPORT_LANGUAGE_PRICING_VERSION) {
  const product = resolveReportProduct(productId), presentation = normalizeReportPresentation(input);
  if (product.newPurchaseDefault === false) throw new Error("PWS_REPORT_LEGACY_NEW_PURCHASE_DISABLED");
  const plan = mapReportEntitlements(product.productId, selectedProductIds);
  const policy = REPORT_LANGUAGE_PRICING_POLICIES[pricingVersion]?.[product.productId];
  if (!policy) throw new Error("REPORT_PRICING_POLICY_NOT_FOUND");
  const surcharge = presentation.reportLanguageMode === "SINGLE" ? 0 : policy.BILINGUAL.surchargeMinor;
  return freeze({
    ...presentation,
    productId: product.productId,
    currency: product.currency,
    baseAmountMinor: product.amountMinor,
    surchargeAmountMinor: surcharge,
    amountMinor: product.amountMinor + surcharge,
    pricingVersion,
    modifierRule: presentation.reportLanguageMode === "SINGLE" ? "SINGLE_NO_SURCHARGE" : product.kind === "BUNDLE" ? `${product.productId}_BILINGUAL` : "INDIVIDUAL_BILINGUAL",
    selectedProductIds: plan.selectedProductIds
  });
}
function eligibleReportIds(bundleId) {
  const p = resolveReportProduct(bundleId);
  if (p.kind !== "BUNDLE") throw new Error("PWS_REPORT_BUNDLE_REQUIRED");
  return REPORT_COMMERCE_CONTRACT.eligibilityRegistries.find((r) => r.registryId === p.selection.eligibilityRegistry).productIds;
}
function mapReportEntitlements(productId, selectedProductIds = []) {
  const p = resolveReportProduct(productId);
  if (!Array.isArray(selectedProductIds)) throw new Error("PWS_REPORT_SELECTION_ARRAY_REQUIRED");
  let ids;
  if (p.kind === "BUNDLE") {
    const eligible = eligibleReportIds(p.productId), { min, max } = p.selection;
    if (selectedProductIds.length < min || selectedProductIds.length > (max ?? eligible.length)) throw new Error("PWS_REPORT_SELECTION_COUNT");
    if (new Set(selectedProductIds).size !== selectedProductIds.length) throw new Error("PWS_REPORT_SELECTION_DUPLICATE");
    if (selectedProductIds.some((id) => !eligible.includes(id))) throw new Error("PWS_REPORT_SELECTION_INELIGIBLE");
    ids = eligible.filter((id) => selectedProductIds.includes(id));
  } else {
    if (selectedProductIds.length) throw new Error("PWS_REPORT_SINGLE_SELECTION_FORBIDDEN");
    ids = [p.productId];
  }
  return freeze({ contractId: REPORT_COMMERCE_CONTRACT_ID, version, productId: p.productId, selectedProductIds: ids, entitlements: ids.map((id) => {
    const r = resolveReportProduct(id);
    return { productId: id, entitlementKey: r.entitlementKey, scope: r.kind === "SYNTHESIS" ? "CROSS_SYNTHESIS" : "INDEPENDENT_SINGLE_METHOD_REPORT", methodId: r.legacyMethodId || r.methodId };
  }), createsCrossReading: false, grantsEntitlement: false, requiresVerifiedPayment: true, requiresProductAdmission: true });
}

// functions/pws/commercial/report-successor-contract.js
var freeze2 = (v) => {
  if (v && typeof v === "object") {
    Object.values(v).forEach(freeze2);
    Object.freeze(v);
  }
  return v;
};
var REPORT_COMMERCE_CONTRACT_ID2 = "phi-os.pws.report-commerce-successor.v1";
var version2 = "1.1.0";
var effectiveAt2 = "2026-10-09T00:00:00.000Z";
var singles2 = Object.values(COMMERCE_ECONOMICS).filter((p) => p.methodId).map((p) => {
  const name = p.productId.startsWith("COM-REPORT-") ? p.productId.slice(11, -5) : p.productId.startsWith("COM-READING-") ? p.productId.slice(12, -5) : "WILL";
  return { productId: `${name}_FULL_REPORT`, productCode: `${name.toLowerCase()}-full-report`, methodId: p.methodId, kind: p.methodId === "CROSS" ? "SYNTHESIS" : "SINGLE_METHOD", newPrimaryPromotion: true, newPurchaseDefault: true, amountMinor: p.amountMinor, currency: "MYR", bilingualOnly: p.bilingualOnly, bundleEligible: STANDARD_BUNDLE_PRODUCTS.includes(p.productId), entitlementKey: `report:${name.toLowerCase()}:full`, selection: null };
});
var bundles2 = [["BUNDLE_2", 9900, 2], ["BUNDLE_3", 14900, 3]].map(([productId, amountMinor, count]) => ({ productId, productCode: productId.toLowerCase().replaceAll("_", "-"), methodId: null, kind: "BUNDLE", amountMinor, currency: "MYR", bundleEligible: false, entitlementKey: null, selection: { min: count, max: count, eligibilityRegistry: "standard-myr59-20261009", distinct: true } }));
var REPORT_COMMERCE_CONTRACT2 = freeze2({ contractId: REPORT_COMMERCE_CONTRACT_ID2, version: version2, effectiveAt: effectiveAt2, owner: "PWS_COMMERCIAL_RUNTIME", approval: { source: "EXPLICIT_USER_COMMERCIAL_REVISION", baseline: "538442cae861566956d203eae8cb053f02abf377", policyVersion: COMMERCE_ECONOMICS_VERSION, date: "2026-10-09", scope: "PRICES_COST_CAPS_LANGUAGE_AND_BUNDLE_ELIGIBILITY" }, products: [...singles2, ...bundles2], eligibilityRegistries: [{ registryId: "standard-myr39-v1", status: "HISTORICAL_ORDER_COMPATIBILITY", productIds: eligibleReportIds("BUNDLE_2") }, { registryId: "standard-myr59-20261009", status: "FUTURE_SELECTION", productIds: singles2.filter((p) => p.bundleEligible).map((p) => p.productId) }], policy: { bundleCreatesCross: false, crossGrantsSingleMethods: false, selectionIsEntitlement: false, clientPaymentSuccessIsAuthority: false, productionPaymentEnabled: false, activationOwner: "EXISTING_PWS_COMMERCE_GATE", entitlementActivationRequires: "SERVER_VERIFIED_PAYMENT_AND_PRODUCT_ADMISSION" } });
var REPORT_PRODUCT_DEFINITIONS2 = freeze2(REPORT_COMMERCE_CONTRACT2.products.map((p) => ({ product_code: p.productCode, display_name: p.productId.replaceAll("_", " "), product_type_code: "knowledge_product", state: "draft", current_version: version2, legacy_product_ids: [], versions: [{ version: version2, status: "active", effective_at: effectiveAt2, components: [{ component_code: `${p.productCode}-reading`, component_type: "knowledge_access", configuration: { knowledge_asset_id: p.productId, access_scope: p.kind === "BUNDLE" ? "selected_independent_full_reports" : "single_subject_full_report", ...p.methodId ? { method_code: p.methodId } : p.kind === "LEGACY_COMPATIBILITY" ? { legacy_method_code: p.legacyMethodId } : { selection_policy_ref: REPORT_COMMERCE_CONTRACT_ID2, eligibility_registry_ref: p.selection.eligibilityRegistry } } }] }] })));
var REPORT_PRICE_DEFINITIONS2 = freeze2(REPORT_COMMERCE_CONTRACT2.products.map((p) => ({ price_code: `${p.productCode}-myr`, price_version: version2, currency_code: p.currency, amount_minor: p.amountMinor, status: "draft", effective_at: effectiveAt2 })));
var REPORT_OFFER_DEFINITIONS2 = freeze2(REPORT_COMMERCE_CONTRACT2.products.map((p) => ({ offer_code: `${p.productCode}-myr`, offer_version: version2, display_name: p.productId.replaceAll("_", " "), product_code: p.productCode, product_version: version2, price_code: `${p.productCode}-myr`, region_code: "my", customer_segment_code: "public-customer", status: "draft" })));
function resolveReportProduct2(reference) {
  const p = REPORT_COMMERCE_CONTRACT2.products.find((p2) => p2.productId === reference || p2.productCode === reference);
  if (!p) throw new Error("PWS_REPORT_PRODUCT_NOT_FOUND");
  return p;
}
var REPORT_LANGUAGE_PRICING_VERSION2 = COMMERCE_ECONOMICS_VERSION;
var REPORT_LANGUAGE_PRICING_POLICIES2 = freeze2({ [REPORT_LANGUAGE_PRICING_VERSION2]: Object.fromEntries(REPORT_COMMERCE_CONTRACT2.products.map((p) => [p.productId, { BILINGUAL: { surchargeMinor: p.bilingualOnly ? 0 : 1e3 } }])) });
function normalizeReportPresentation2(input = {}) {
  const { reportLanguageMode, reportLocale } = input;
  if (!(reportLanguageMode === "SINGLE" && ["en", "zh-Hans"].includes(reportLocale) || reportLanguageMode === "BILINGUAL" && reportLocale === "bilingual"))
    throw Object.assign(new Error("Choose the report language explicitly."), { code: "REPORT_PRESENTATION_REQUIRED", status: 422 });
  return freeze2({ reportLanguageMode, reportLocale });
}
function quoteReportPresentation2(productId, input, selectedProductIds = [], pricingVersion = REPORT_LANGUAGE_PRICING_VERSION2) {
  if (pricingVersion !== REPORT_LANGUAGE_PRICING_VERSION2) return quoteReportPresentation(productId, input, selectedProductIds, pricingVersion);
  const product = resolveReportProduct2(productId), presentation = normalizeReportPresentation2(input);
  if (product.bilingualOnly && presentation.reportLanguageMode !== "BILINGUAL") throw Object.assign(Error("REPORT_BILINGUAL_ONLY"), { status: 422, code: "REPORT_BILINGUAL_ONLY" });
  if (product.newPurchaseDefault === false) throw new Error("PWS_REPORT_LEGACY_NEW_PURCHASE_DISABLED");
  const plan = mapReportEntitlements2(product.productId, selectedProductIds);
  const policy = REPORT_LANGUAGE_PRICING_POLICIES2[pricingVersion]?.[product.productId];
  if (!policy) throw new Error("REPORT_PRICING_POLICY_NOT_FOUND");
  const surcharge = presentation.reportLanguageMode === "SINGLE" ? 0 : policy.BILINGUAL.surchargeMinor;
  return freeze2({
    ...presentation,
    productId: product.productId,
    currency: product.currency,
    baseAmountMinor: product.amountMinor,
    surchargeAmountMinor: surcharge,
    amountMinor: product.amountMinor + surcharge,
    pricingVersion,
    modifierRule: presentation.reportLanguageMode === "SINGLE" ? "SINGLE_NO_SURCHARGE" : product.kind === "BUNDLE" ? `${product.productId}_BILINGUAL` : "INDIVIDUAL_BILINGUAL",
    selectedProductIds: plan.selectedProductIds
  });
}
function eligibleReportIds2(bundleId) {
  const p = resolveReportProduct2(bundleId);
  if (p.kind !== "BUNDLE") throw new Error("PWS_REPORT_BUNDLE_REQUIRED");
  return REPORT_COMMERCE_CONTRACT2.eligibilityRegistries.find((r) => r.registryId === p.selection.eligibilityRegistry).productIds;
}
function mapReportEntitlements2(productId, selectedProductIds = []) {
  const p = resolveReportProduct2(productId);
  if (!Array.isArray(selectedProductIds)) throw new Error("PWS_REPORT_SELECTION_ARRAY_REQUIRED");
  let ids;
  if (p.kind === "BUNDLE") {
    const eligible = eligibleReportIds2(p.productId), { min, max } = p.selection;
    if (selectedProductIds.length < min || selectedProductIds.length > (max ?? eligible.length)) throw new Error("PWS_REPORT_SELECTION_COUNT");
    if (new Set(selectedProductIds).size !== selectedProductIds.length) throw new Error("PWS_REPORT_SELECTION_DUPLICATE");
    if (selectedProductIds.some((id) => !eligible.includes(id))) throw new Error("PWS_REPORT_SELECTION_INELIGIBLE");
    ids = eligible.filter((id) => selectedProductIds.includes(id));
  } else {
    if (selectedProductIds.length) throw new Error("PWS_REPORT_SINGLE_SELECTION_FORBIDDEN");
    ids = [p.productId];
  }
  return freeze2({ contractId: REPORT_COMMERCE_CONTRACT_ID2, version: version2, productId: p.productId, selectedProductIds: ids, entitlements: ids.map((id) => {
    const r = resolveReportProduct2(id);
    return { productId: id, entitlementKey: r.entitlementKey, scope: r.kind === "SYNTHESIS" ? "CROSS_SYNTHESIS" : "INDEPENDENT_SINGLE_METHOD_REPORT", methodId: r.legacyMethodId || r.methodId };
  }), createsCrossReading: false, grantsEntitlement: false, requiresVerifiedPayment: true, requiresProductAdmission: true });
}

// functions/commerce/report-presentation.js
function reportContractId(id) {
  const key = (id === "COM-WILL-WRITING" ? "WILL-FULL" : id.replace("COM-READING-", "").replace("COM-REPORT-", "")).replaceAll("-", "_");
  return key.startsWith("BUNDLE") ? key : key.replace("_FULL", "_FULL_REPORT");
}
function isLanguageReport(product) {
  try {
    return (product.category === "REPORT" || product.productId === "COM-WILL-WRITING") && Boolean(resolveReportProduct2(reportContractId(product.productId)));
  } catch {
    return false;
  }
}
function commerceReportQuote(product, input, selected = []) {
  return quoteReportPresentation2(reportContractId(product.productId), input, product.productId.includes("BUNDLE") ? selected.map(reportContractId) : []);
}
function orderReportPresentation(order) {
  return JSON.parse(order.context_json || "{}").reportPresentation || null;
}
function validateOrderReportPresentation(product, order) {
  const stored = orderReportPresentation(order);
  if (!stored) return null;
  const quote = quoteReportPresentation2(reportContractId(product.productId), stored, product.productId.includes("BUNDLE") ? JSON.parse(order.selected_products_json).map(reportContractId) : [], stored.pricingVersion);
  if (JSON.stringify(quote) !== JSON.stringify(stored) || quote.amountMinor !== order.amount_minor) throw Object.assign(new Error("Stored presentation mismatch."), { code: "commerce_provider_mismatch", status: 422 });
  return quote;
}

// functions/symbolic-method-persistence/symbolic-account-identity-v1.js
var clean = (value) => String(value ?? "").normalize("NFKC").trim();
var SYMBOLIC_ACCOUNT_IDENTITY_VERSION = "1.0.0";
function normalizeVerifiedSymbolicAccountIdentity(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const userId = clean(source.userId);
  const providerId = clean(source.providerId);
  const sessionId = clean(source.sessionId) || null;
  const verified = source.verified === true && source.authenticated === true;
  if (!verified || !userId || !providerId) return null;
  return Object.freeze({
    version: SYMBOLIC_ACCOUNT_IDENTITY_VERSION,
    userId,
    providerId,
    sessionId,
    verified: true,
    authenticated: true,
    source: "TRUSTED_SERVER_REQUEST_CONTEXT_ONLY"
  });
}

// functions/pws/commercial/stripe-product-registry.js
var rows2 = [
  {
    "productId": "COM-SERVICE-NATURAL-HEALER",
    "category": "HUMAN_SERVICE",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 1e4,
    "qaProductId": "prod_VHPtICmRyTxUTJ",
    "qaPriceId": "price_1UGr3rBEKXJyHMkKycFy3VrE",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "SERVICE NATURAL HEALER",
    "entitlementPolicy": "PURCHASED_INTAKE_REQUIRED",
    "fulfillmentType": "HUMAN_SERVICE",
    "durationMinutes": 60,
    "initialModality": "UNDECIDED"
  },
  {
    "productId": "COM-SERVICE-CASH-FLOW-GAME",
    "category": "HUMAN_SERVICE",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 1e4,
    "qaProductId": "prod_VHPtAg35IB3oWs",
    "qaPriceId": "price_1UGr3pBEKXJyHMkKgcRniO8X",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "SERVICE CASH FLOW GAME",
    "entitlementPolicy": "PURCHASED_INTAKE_REQUIRED",
    "fulfillmentType": "HUMAN_SERVICE",
    "durationMinutes": 120
  },
  {
    "productId": "COM-SERVICE-FINANCIAL-CONSULTATION",
    "category": "HUMAN_SERVICE",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 1e4,
    "qaProductId": "prod_VHPtGMdqOKxW8w",
    "qaPriceId": "price_1UGr3nBEKXJyHMkK8TlT1TOe",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "SERVICE FINANCIAL CONSULTATION",
    "entitlementPolicy": "PURCHASED_INTAKE_REQUIRED",
    "fulfillmentType": "HUMAN_SERVICE",
    "durationMinutes": 60
  },
  {
    "productId": "COM-SUBSCRIPTION-MONTHLY",
    "category": "MEMBERSHIP",
    "billingType": "RECURRING",
    "currency": "MYR",
    "amountMinor": 1900,
    "qaProductId": "prod_VHPt9J27xVQl7q",
    "qaPriceId": "price_1UGr3lBEKXJyHMkKOuDD7NVR",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "SUBSCRIPTION MONTHLY",
    "entitlementPolicy": "PHIOS_MEMBERSHIP",
    "fulfillmentType": "SUBSCRIPTION_ACCESS"
  },
  {
    "productId": "COM-WILL-WRITING",
    "category": "HUMAN_SERVICE",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 2900,
    "qaProductId": "prod_VHPt6JmDxsSc70",
    "qaPriceId": "price_1UGr3jBEKXJyHMkKCulLqIpr",
    "liveProductId": "prod_VPJ4qpBONlSBhY",
    "livePriceId": "price_1UOUSdB2F823WiPtponKg92q",
    "active": true,
    "title": "WILL WRITING",
    "entitlementPolicy": "PURCHASED_INTAKE_REQUIRED",
    "fulfillmentType": "HUMAN_SERVICE",
    "pricingVersion": "PHIOS-COMMERCE-2026-10-09",
    "bilingualOnly": true
  },
  {
    "productId": "COM-REPORT-FINANCIAL-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 15900,
    "qaProductId": "prod_VHPtDLeg1UajcN",
    "qaPriceId": "price_1UGr3gBEKXJyHMkKAmHkIrmz",
    "liveProductId": "prod_VPJ4q0LXYLPP8r",
    "livePriceId": "price_1UOUSMB2F823WiPtpl7bImdp",
    "active": true,
    "title": "REPORT FINANCIAL FULL",
    "entitlementPolicy": "REPORT_FINANCIAL_FULL",
    "fulfillmentType": "REPORT_ACCESS",
    "professionalReviewRequired": true,
    "pricingVersion": "PHIOS-COMMERCE-2026-10-09",
    "bilingualOnly": true
  },
  {
    "productId": "COM-REPORT-BUNDLE-5PLUS",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 15900,
    "qaProductId": "prod_VHPtWWpUFzts4C",
    "qaPriceId": "price_1UGr3eBEKXJyHMkKRDancawo",
    "liveProductId": null,
    "livePriceId": null,
    "active": false,
    "title": "REPORT BUNDLE 5PLUS",
    "entitlementPolicy": "SELECTED_STANDARD_REPORTS",
    "fulfillmentType": "REPORT_ACCESS",
    "retired": true,
    "retiredReason": "OWNER_REMOVED_PRODUCT_2026_10_09"
  },
  {
    "productId": "COM-REPORT-BUNDLE-3",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 14900,
    "qaProductId": "prod_VHPtwqHj0F4P7C",
    "qaPriceId": "price_1UOUJmBEKXJyHMkKCjj6kfv9",
    "liveProductId": "prod_VPJ4zopAwg8TIz",
    "livePriceId": "price_1UOUSYB2F823WiPt00lgUYPL",
    "active": true,
    "title": "REPORT BUNDLE 3",
    "entitlementPolicy": "SELECTED_STANDARD_REPORTS",
    "fulfillmentType": "REPORT_ACCESS",
    "pricingVersion": "PHIOS-COMMERCE-2026-10-09",
    "bilingualOnly": false
  },
  {
    "productId": "COM-REPORT-BUNDLE-2",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 9900,
    "qaProductId": "prod_VHPttr1bpn1AU8",
    "qaPriceId": "price_1UOUJbBEKXJyHMkKA66OOmYq",
    "liveProductId": "prod_VPJ4cDdK0u8XbH",
    "livePriceId": "price_1UOUSSB2F823WiPtCeqAQJmy",
    "active": true,
    "title": "REPORT BUNDLE 2",
    "entitlementPolicy": "SELECTED_STANDARD_REPORTS",
    "fulfillmentType": "REPORT_ACCESS",
    "pricingVersion": "PHIOS-COMMERCE-2026-10-09",
    "bilingualOnly": false
  },
  {
    "productId": "COM-REPORT-ECR-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 12900,
    "qaProductId": "prod_VHPtFV3gJ4MbA2",
    "qaPriceId": "price_1UOUJ9BEKXJyHMkKopYqtbsW",
    "liveProductId": "prod_VPJ4fhloElFHAM",
    "livePriceId": "price_1UOUS5B2F823WiPtRGukHzi2",
    "active": true,
    "title": "REPORT ECR FULL",
    "entitlementPolicy": "REPORT_ECR_FULL",
    "fulfillmentType": "REPORT_ACCESS",
    "pricingVersion": "PHIOS-COMMERCE-2026-10-09",
    "bilingualOnly": false
  },
  {
    "productId": "COM-REPORT-CROSS-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 29900,
    "qaProductId": "prod_VHPtFwBBbFdgNN",
    "qaPriceId": "price_1UGr3WBEKXJyHMkKMzKNaaEm",
    "liveProductId": "prod_VPJ4aV0LP68Jxa",
    "livePriceId": "price_1UOUSGB2F823WiPtatkNT3Xh",
    "active": true,
    "title": "REPORT CROSS FULL",
    "entitlementPolicy": "REPORT_CROSS_FULL",
    "fulfillmentType": "REPORT_ACCESS",
    "pricingVersion": "PHIOS-COMMERCE-2026-10-09",
    "bilingualOnly": false
  },
  {
    "productId": "COM-REPORT-HD-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 12900,
    "qaProductId": "prod_VHPtAElGHLi3gh",
    "qaPriceId": "price_1UGr3UBEKXJyHMkK4u9lYF0A",
    "liveProductId": "prod_VPJ4q1daQnfUdD",
    "livePriceId": "price_1UOURzB2F823WiPtK7YBt90R",
    "active": true,
    "title": "REPORT HD FULL",
    "entitlementPolicy": "REPORT_HD_FULL",
    "fulfillmentType": "REPORT_ACCESS",
    "pricingVersion": "PHIOS-COMMERCE-2026-10-09",
    "bilingualOnly": false
  },
  {
    "productId": "COM-REPORT-PROFILE-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 12900,
    "qaProductId": "prod_VHPtnVjpP4CUMG",
    "qaPriceId": "price_1UOUIsBEKXJyHMkKwgSWeO8u",
    "liveProductId": "prod_VPJ4Jt88AxeieE",
    "livePriceId": "price_1UOURtB2F823WiPt4Efx01Vy",
    "active": true,
    "title": "REPORT PROFILE FULL",
    "entitlementPolicy": "REPORT_PROFILE_FULL",
    "fulfillmentType": "REPORT_ACCESS",
    "pricingVersion": "PHIOS-COMMERCE-2026-10-09",
    "bilingualOnly": true
  },
  {
    "productId": "COM-REPORT-NUMEROLOGY-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 3900,
    "qaProductId": "prod_VHPtzvhrG3VnuD",
    "qaPriceId": "price_1UGr3PBEKXJyHMkKH6EsZNQy",
    "liveProductId": "prod_VPJ4jMMlGcq5nb",
    "livePriceId": "price_1UOUSBB2F823WiPt2hxQlc7l",
    "active": true,
    "title": "REPORT NUMEROLOGY FULL",
    "entitlementPolicy": "REPORT_NUMEROLOGY_FULL",
    "fulfillmentType": "REPORT_ACCESS",
    "pricingVersion": "PHIOS-COMMERCE-2026-10-09",
    "bilingualOnly": false
  },
  {
    "productId": "COM-REPORT-ASTROLOGY-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 5900,
    "qaProductId": "prod_VHPtQk6R2hKboU",
    "qaPriceId": "price_1UOUIgBEKXJyHMkK3JXmPBjG",
    "liveProductId": "prod_VPJ3cSe7zTXqRT",
    "livePriceId": "price_1UOURoB2F823WiPtDKdldx8B",
    "active": true,
    "title": "REPORT ASTROLOGY FULL",
    "entitlementPolicy": "REPORT_ASTROLOGY_FULL",
    "fulfillmentType": "REPORT_ACCESS",
    "pricingVersion": "PHIOS-COMMERCE-2026-10-09",
    "bilingualOnly": false
  },
  {
    "productId": "COM-REPORT-ZIWEI-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 5900,
    "qaProductId": "prod_VHPt5VvsD8UtOj",
    "qaPriceId": "price_1UOUIQBEKXJyHMkKlkoLy31M",
    "liveProductId": "prod_VPJ30ITqmTtOzH",
    "livePriceId": "price_1UOURiB2F823WiPtG9lGf6ze",
    "active": true,
    "title": "REPORT ZIWEI FULL",
    "entitlementPolicy": "REPORT_ZIWEI_FULL",
    "fulfillmentType": "REPORT_ACCESS",
    "pricingVersion": "PHIOS-COMMERCE-2026-10-09",
    "bilingualOnly": false
  },
  {
    "productId": "COM-REPORT-BAZI-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 5900,
    "qaProductId": "prod_VHPthmjwXsFaSG",
    "qaPriceId": "price_1UOUHhBEKXJyHMkKSC3iujbJ",
    "liveProductId": "prod_VPJ3GTLLyGFf4r",
    "livePriceId": "price_1UOURFB2F823WiPtFaRs305S",
    "active": true,
    "title": "REPORT BAZI FULL",
    "entitlementPolicy": "REPORT_BAZI_FULL",
    "fulfillmentType": "REPORT_ACCESS",
    "pricingVersion": "PHIOS-COMMERCE-2026-10-09",
    "bilingualOnly": false
  },
  {
    "productId": "COM-BOOK-07",
    "category": "BOOK",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 5900,
    "qaProductId": "prod_VGP1BLTCYDrb91",
    "qaPriceId": "price_1UFsDJBEKXJyHMkKSjpjX9cy",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "PHI OS Book VII \xB7 Reality Navigation",
    "entitlementPolicy": "BOOK_07_FULL_ACCESS",
    "fulfillmentType": "DIGITAL_ACCESS"
  },
  {
    "productId": "COM-BOOK-06",
    "category": "BOOK",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 5900,
    "qaProductId": "prod_VGP0cERwXu94fE",
    "qaPriceId": "price_1UFsCmBEKXJyHMkKf8oIIZOw",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "PHI OS Book VI \xB7 Reality Observation",
    "entitlementPolicy": "BOOK_06_FULL_ACCESS",
    "fulfillmentType": "DIGITAL_ACCESS"
  },
  {
    "productId": "COM-BOOK-05",
    "category": "BOOK",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 10900,
    "qaProductId": "prod_VGP0CeBp5eJPAD",
    "qaPriceId": "price_1UFsCEBEKXJyHMkKuRZ9kLcl",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "PHI OS Book V \xB7 Reality Differentiation",
    "entitlementPolicy": "BOOK_05_FULL_ACCESS",
    "fulfillmentType": "DIGITAL_ACCESS"
  },
  {
    "productId": "COM-BOOK-04",
    "category": "BOOK",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 8900,
    "qaProductId": "prod_VGOzuWuFgFxjZB",
    "qaPriceId": "price_1UFsBBBEKXJyHMkKA5xMRsFa",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "PHI OS Book IV \xB7 Reality Expansion",
    "entitlementPolicy": "BOOK_04_FULL_ACCESS",
    "fulfillmentType": "DIGITAL_ACCESS"
  },
  {
    "productId": "COM-BOOK-03",
    "category": "BOOK",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 8900,
    "qaProductId": "prod_VGOnfMW59B4xyJ",
    "qaPriceId": "price_1UFrzXBEKXJyHMkKjL6kjuFT",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "PHI OS Book III \xB7 Reality Continuity",
    "entitlementPolicy": "BOOK_03_FULL_ACCESS",
    "fulfillmentType": "DIGITAL_ACCESS"
  },
  {
    "productId": "COM-BOOK-02",
    "category": "BOOK",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 8900,
    "qaProductId": "prod_VGOm5pFpxQlAqG",
    "qaPriceId": "price_1UFryrBEKXJyHMkKyqtxoNgm",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "PHI OS Book II \xB7 Reality Runtime",
    "entitlementPolicy": "BOOK_02_FULL_ACCESS",
    "fulfillmentType": "DIGITAL_ACCESS"
  },
  {
    "productId": "COM-BOOK-01",
    "category": "BOOK",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 8900,
    "qaProductId": "prod_VGNrkqQT5jOa8O",
    "qaPriceId": "price_1UFr6EBEKXJyHMkKNFEDlDg5",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "PHI OS Book I \xB7 Reality Formation",
    "entitlementPolicy": "BOOK_01_FULL_ACCESS",
    "fulfillmentType": "DIGITAL_ACCESS"
  },
  {
    "productId": "COM-READING-TAROT-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 1900,
    "qaProductId": "prod_VPIynToecofMgI",
    "qaPriceId": "price_1UOUMKBEKXJyHMkKQV8dp1XI",
    "liveProductId": "prod_VPJ4giIEyqQNex",
    "livePriceId": "price_1UOUSjB2F823WiPtXqfaEJzI",
    "active": true,
    "title": "Tarot Full Reading",
    "entitlementPolicy": "TAROT_FULL_READING",
    "fulfillmentType": "REPORT_ACCESS",
    "bilingualOnly": true,
    "pricingVersion": "PHIOS-COMMERCE-2026-10-09"
  },
  {
    "productId": "COM-READING-ICHING-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 3900,
    "qaProductId": "prod_VPIy59BN4qfDlL",
    "qaPriceId": "price_1UOUMPBEKXJyHMkKLuJ7Y8p7",
    "liveProductId": "prod_VPJ48RwrcxQ47Z",
    "livePriceId": "price_1UOUSpB2F823WiPt5BqiZDsC",
    "active": true,
    "title": "I Ching Full Reading",
    "entitlementPolicy": "ICHING_FULL_READING",
    "fulfillmentType": "REPORT_ACCESS",
    "bilingualOnly": true,
    "pricingVersion": "PHIOS-COMMERCE-2026-10-09"
  }
];
var bookPublication = {
  "COM-BOOK-01": [1, "Reality Formation", "\u4E16\u754C\u5982\u4F55\u5F62\u6210", "BOOK_01_FULL_ACCESS"],
  "COM-BOOK-02": [2, "Reality Runtime", "\u4E16\u754C\u5982\u4F55\u8FD0\u884C", "BOOK_02_FULL_ACCESS"],
  "COM-BOOK-03": [3, "Reality Continuity", "\u4E16\u754C\u5982\u4F55\u7EF4\u6301", "BOOK_03_FULL_ACCESS"],
  "COM-BOOK-04": [4, "Reality Expansion", "\u4E16\u754C\u5982\u4F55\u6269\u5C55", "BOOK_04_FULL_ACCESS"],
  "COM-BOOK-05": [5, "Reality Differentiation", "\u4E16\u754C\u5982\u4F55\u5206\u5316", "BOOK_05_FULL_ACCESS"],
  "COM-BOOK-CONFIGURATION": [6, "Reality Reconfiguration", "\u4E16\u754C\u5982\u4F55\u91CD\u7EC4", "BOOK_CONFIGURATION_FULL_ACCESS"],
  "COM-BOOK-06": [7, "Reality Observation", "\u4E16\u754C\u5982\u4F55\u88AB\u89C2\u5BDF", "BOOK_06_FULL_ACCESS"],
  "COM-BOOK-07": [8, "Reality Navigation", "\u4E16\u754C\u5C06\u5982\u4F55\u7EE7\u7EED", "BOOK_07_FULL_ACCESS"]
};
rows2.push({
  productId: "COM-BOOK-CONFIGURATION",
  category: "BOOK",
  billingType: "ONE_TIME",
  currency: "MYR",
  amountMinor: 10900,
  qaProductId: "prod_VHXHiFJUW2FBEX",
  qaPriceId: "price_1UGyClBEKXJyHMkKLUjUaBMH",
  liveProductId: null,
  livePriceId: null,
  active: true,
  title: "PHI OS Book VI \xB7 Reality Reconfiguration",
  entitlementPolicy: "BOOK_CONFIGURATION_FULL_ACCESS",
  fulfillmentType: "DIGITAL_ACCESS"
});
var roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
for (const row of rows2) {
  const b = bookPublication[row.productId];
  if (!b) continue;
  Object.assign(row, {
    publicationBookCode: `BOOK-${b[0]}`,
    publicationVolume: b[0],
    workId: b[1].toLowerCase().replaceAll(" ", "-"),
    title: `PHI OS Book ${roman[b[0] - 1]} \xB7 ${b[1]}`,
    titleZh: `PHI OS \u7B2C${b[0]}\u518C \xB7 ${b[2]}`
  });
  if (row.productId === "COM-BOOK-CONFIGURATION") row.workId = "reality-configuration";
  if (row.entitlementPolicy !== b[3]) throw new Error("BOOK_ENTITLEMENT_IDENTITY_DRIFT");
  if (b[0] === 8) Object.assign(row, { active: false, productionSaleAllowed: false, publicationStatus: "PUBLICATION_NOT_OFFERED", contentStatus: "PRIVATE_DOCTRINE_IN_DEVELOPMENT" });
}
var STRIPE_PRODUCT_REGISTRY = Object.freeze(rows2.map((row) => Object.freeze(row)));
function commerceProduct(id) {
  const product = STRIPE_PRODUCT_REGISTRY.find((row) => row.productId === id);
  if (!product?.active) throw Object.assign(new Error("Unknown or inactive product."), { status: 422, code: "commerce_product_invalid" });
  return product;
}
function standardBundleProducts() {
  return eligibleReportIds2("BUNDLE_2").map((id) => "COM-REPORT-" + id.replace("_FULL_REPORT", "-FULL"));
}
function commerceSelection(productId, selectedProducts = []) {
  const product = commerceProduct(productId);
  if (!Array.isArray(selectedProducts)) throw Object.assign(new Error("Invalid selection."), { status: 422, code: "bundle_selection_invalid" });
  if (!productId.includes("BUNDLE")) {
    if (selectedProducts.length) throw Object.assign(new Error("Unexpected selection."), { status: 422, code: "bundle_selection_invalid" });
    return [productId];
  }
  const n = selectedProducts.length, eligible = standardBundleProducts();
  const validCount = productId.endsWith("-2") ? n === 2 : productId.endsWith("-3") ? n === 3 : false;
  if (!validCount || new Set(selectedProducts).size !== n || selectedProducts.some((id) => !eligible.includes(id))) throw Object.assign(new Error("Select distinct eligible standard reports."), { status: 422, code: "bundle_selection_invalid" });
  return [...selectedProducts].sort();
}

// functions/commerce/controlled-purchase-candidate.js
var fail = (code2) => {
  throw Object.assign(new Error(code2), { code: code2, status: 403 });
};
function controlledPurchaseOffer(env, { ownerId, productId, originalAmountMinor, now = Date.now() }) {
  if (env.PHIOS_CONTROLLED_PURCHASE_ENABLED !== "true") return null;
  let policy;
  try {
    policy = JSON.parse(env.PHIOS_CONTROLLED_PURCHASE_POLICY || "null");
  } catch {
    fail("controlled_policy_invalid");
  }
  if (!policy || !policy.campaignId || policy.ownerId !== ownerId) fail("controlled_owner_denied");
  if (policy.maximumUses !== 1 || !Number.isFinite(Date.parse(policy.startsAt)) || !Number.isFinite(Date.parse(policy.expiresAt)) || now < Date.parse(policy.startsAt) || now >= Date.parse(policy.expiresAt) || Date.parse(policy.expiresAt) - Date.parse(policy.startsAt) > 7 * 864e5) fail("controlled_window_invalid");
  const p = policy.products?.[productId];
  if (!p || !policy.completedProductIds?.includes(productId)) fail("controlled_product_not_completed");
  if (!/^coupon_[A-Za-z0-9_-]+$/.test(p.couponId) || p.originalAmountMinor !== originalAmountMinor || !Number.isInteger(p.paidAmountMinor) || p.paidAmountMinor < 100 || p.paidAmountMinor >= originalAmountMinor) fail("controlled_discount_invalid");
  return Object.freeze({ campaignId: policy.campaignId, ownerId, productId, couponId: p.couponId, originalAmountMinor, discountAmountMinor: originalAmountMinor - p.paidAmountMinor, paidAmountMinor: p.paidAmountMinor, currency: "MYR", maximumUses: 1, expiresAt: policy.expiresAt, reservationKey: `controlled-purchase/${policy.campaignId}/${ownerId}`, providerCostCapUnchanged: true, followupEntitlementUnchanged: true });
}
function controlledOrderOffer(order) {
  let c;
  try {
    c = JSON.parse(order.context_json || "{}").controlledPurchase;
  } catch {
    fail("controlled_context_invalid");
  }
  if (!c) return null;
  if (c.ownerId !== order.customer_id || c.productId !== order.product_id || c.originalAmountMinor !== order.amount_minor || c.currency !== "MYR" || c.maximumUses !== 1 || !Number.isInteger(c.paidAmountMinor) || c.paidAmountMinor < 100 || c.discountAmountMinor !== c.originalAmountMinor - c.paidAmountMinor || !c.couponId || !c.campaignId) fail("controlled_order_invalid");
  return c;
}

// functions/pws/registry/universal-registry-schema.js
var REGISTRY_STATUSES = Object.freeze({
  object: ["draft", "active", "suspended", "deprecated", "archived"],
  version: ["draft", "active", "superseded", "withdrawn"],
  relationship: ["active", "inactive", "revoked"],
  restriction: ["active", "inactive", "revoked", "expired"]
});

// functions/pws/product/product-runtime.js
var PRODUCT_RUNTIME_CONTRACT = "phi-os.pws.product-runtime.v1";
var PRODUCT_COMPONENT_TYPES = Object.freeze([
  "knowledge_access",
  "journey_access",
  "professional_service_access",
  "membership_access",
  "service_credit"
]);
var PRODUCT_STATES = Object.freeze(["draft", "active", "suspended", "retired"]);
var VERSION_STATES = Object.freeze(["draft", "active", "superseded", "withdrawn"]);
var CODE_PATTERN = /^[a-z][a-z0-9-]*$/;
var VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
var FORBIDDEN_PRODUCT_FIELDS = Object.freeze([
  "amount",
  "amount_minor",
  "currency",
  "country",
  "countries",
  "payment_provider",
  "payment_provider_id",
  "provider",
  "provider_id",
  "entitlement_id",
  "journey_id"
]);
var ProductRuntimeError = class extends Error {
  constructor(code2, message, details = {}) {
    super(message);
    this.name = "ProductRuntimeError";
    this.code = code2;
    this.details = Object.freeze({ ...details });
  }
};
function requiredText(value, field) {
  const text = String(value ?? "").trim();
  if (!text) {
    throw new ProductRuntimeError(
      "PWS_PRODUCT_INVALID",
      `${field} is required.`,
      { field }
    );
  }
  return text;
}
function code(value, field) {
  const normalized = requiredText(value, field);
  if (!CODE_PATTERN.test(normalized)) {
    throw new ProductRuntimeError(
      "PWS_PRODUCT_INVALID",
      `${field} must be a lowercase product code.`,
      { field, value: normalized }
    );
  }
  return normalized;
}
function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}
function clone(value) {
  return structuredClone(value);
}
function rejectCommercialBinding(value, path = "product") {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_PRODUCT_FIELDS.includes(key)) {
      throw new ProductRuntimeError(
        "PWS_PRODUCT_COMMERCIAL_BINDING_FORBIDDEN",
        `Product Runtime cannot contain ${key}.`,
        { field: `${path}.${key}` }
      );
    }
    rejectCommercialBinding(child, `${path}.${key}`);
  }
}
function normalizeConfiguration(type, input = {}) {
  const configuration = clone(input);
  if (type === "knowledge_access") {
    configuration.knowledge_asset_id = requiredText(
      configuration.knowledge_asset_id,
      "knowledge_asset_id"
    );
    configuration.access_scope = requiredText(
      configuration.access_scope,
      "access_scope"
    );
  }
  if (type === "journey_access") {
    configuration.journey_type = requiredText(
      configuration.journey_type,
      "journey_type"
    );
    configuration.method_code = requiredText(
      configuration.method_code,
      "method_code"
    );
    if (!Number.isSafeInteger(configuration.journey_count) || configuration.journey_count < 1) {
      throw new ProductRuntimeError(
        "PWS_PRODUCT_COMPONENT_INVALID",
        "journey_count must be a positive safe integer.",
        { field: "journey_count" }
      );
    }
  }
  if (type === "professional_service_access") {
    configuration.service_code = requiredText(
      configuration.service_code,
      "service_code"
    );
    for (const field of ["eligibility_required", "consent_required", "assignment_required"]) {
      if (configuration[field] !== true) {
        throw new ProductRuntimeError(
          "PWS_PRODUCT_COMPONENT_INVALID",
          `${field} must remain true.`,
          { field }
        );
      }
    }
  }
  if (type === "membership_access") {
    configuration.membership_tier = requiredText(
      configuration.membership_tier,
      "membership_tier"
    );
  }
  if (type === "service_credit") {
    configuration.service_code = requiredText(
      configuration.service_code,
      "service_code"
    );
    if (!Number.isSafeInteger(configuration.units) || configuration.units < 1) {
      throw new ProductRuntimeError(
        "PWS_PRODUCT_COMPONENT_INVALID",
        "Service Credit units must be a positive safe integer.",
        { field: "units" }
      );
    }
  }
  return configuration;
}
function createProductComponent(input) {
  const componentType = requiredText(input?.component_type, "component_type");
  if (!PRODUCT_COMPONENT_TYPES.includes(componentType)) {
    throw new ProductRuntimeError(
      "PWS_PRODUCT_COMPONENT_INVALID",
      "Unsupported Product Component type.",
      { field: "component_type", value: componentType }
    );
  }
  const component = {
    component_code: code(input.component_code, "component_code"),
    component_type: componentType,
    configuration: normalizeConfiguration(componentType, input.configuration),
    creates_entitlement: false,
    activates_journey: false,
    creates_professional_assignment: false,
    creates_professional_responsibility: false
  };
  rejectCommercialBinding(component, "component");
  return deepFreeze(component);
}
function composeProductVersion(input) {
  const version3 = requiredText(input?.version, "version");
  if (!VERSION_PATTERN.test(version3)) {
    throw new ProductRuntimeError(
      "PWS_PRODUCT_VERSION_INVALID",
      "version must use MAJOR.MINOR.PATCH.",
      { field: "version", value: version3 }
    );
  }
  const status = requiredText(input.status || "active", "status");
  if (!VERSION_STATES.includes(status)) {
    throw new ProductRuntimeError(
      "PWS_PRODUCT_VERSION_INVALID",
      "Unsupported Product Version status.",
      { field: "status", value: status }
    );
  }
  const components = (input.components || []).map(createProductComponent);
  if (components.length === 0) {
    throw new ProductRuntimeError(
      "PWS_PRODUCT_VERSION_INVALID",
      "Product Version requires a component."
    );
  }
  const componentCodes = components.map((item) => item.component_code);
  if (new Set(componentCodes).size !== componentCodes.length) {
    throw new ProductRuntimeError(
      "PWS_PRODUCT_VERSION_INVALID",
      "Product Component codes must be unique."
    );
  }
  const productVersion = {
    version: version3,
    status,
    effective_at: requiredText(input.effective_at, "effective_at"),
    components,
    creates_entitlement: false,
    activates_journey: false
  };
  rejectCommercialBinding(productVersion, "product_version");
  return deepFreeze(productVersion);
}
function normalizeProduct(input) {
  const productCode = code(input.product_code, "product_code");
  const state = requiredText(input.state || "active", "state");
  if (!PRODUCT_STATES.includes(state)) {
    throw new ProductRuntimeError(
      "PWS_PRODUCT_INVALID",
      "Unsupported Product state.",
      { field: "state", value: state }
    );
  }
  const versions = (input.versions || []).map(composeProductVersion);
  const versionCodes = versions.map((item) => item.version);
  if (versions.length === 0 || new Set(versionCodes).size !== versions.length) {
    throw new ProductRuntimeError(
      "PWS_PRODUCT_INVALID",
      "Product Versions must exist and be unique."
    );
  }
  const currentVersion = requiredText(input.current_version, "current_version");
  if (!versions.some((item) => item.version === currentVersion && item.status === "active")) {
    throw new ProductRuntimeError(
      "PWS_PRODUCT_INVALID",
      "current_version must reference an active Product Version."
    );
  }
  const legacyProductIds = [...new Set(
    (input.legacy_product_ids || []).map((value) => code(value, "legacy_product_id"))
  )];
  if (legacyProductIds.includes(productCode)) {
    throw new ProductRuntimeError(
      "PWS_PRODUCT_INVALID",
      "A legacy Product ID cannot equal the canonical code."
    );
  }
  const product = {
    contract: PRODUCT_RUNTIME_CONTRACT,
    product_code: productCode,
    display_name: requiredText(input.display_name, "display_name"),
    product_type_code: requiredText(input.product_type_code, "product_type_code"),
    state,
    current_version: currentVersion,
    legacy_product_ids: legacyProductIds,
    versions,
    payment_provider_independent: true,
    country_independent: true,
    currency_independent: true,
    creates_entitlement: false,
    activates_journey: false
  };
  rejectCommercialBinding(product);
  return deepFreeze(product);
}
var DEFAULT_PRODUCT_RUNTIME_DEFINITIONS = deepFreeze([
  ...REPORT_PRODUCT_DEFINITIONS2,
  {
    product_code: "reality-journey-pass-v1",
    display_name: "Reality Journey Pass",
    product_type_code: "reality_journey_pass",
    state: "active",
    current_version: "1.0.0",
    legacy_product_ids: [],
    versions: [{
      version: "1.0.0",
      status: "active",
      effective_at: "2026-07-30T00:00:00.000Z",
      components: [{
        component_code: "reality-journey-access",
        component_type: "journey_access",
        configuration: {
          journey_type: "personal_reality_journey",
          method_code: "reality_journey",
          journey_count: 1,
          professional_review_included: false
        }
      }]
    }]
  },
  {
    product_code: "phios-book-one-zh-pdf",
    display_name: "\u300A\u4E16\u754C\u5982\u4F55\u5F62\u6210\u300B\u7B2C\u4E00\u518C",
    product_type_code: "book",
    state: "active",
    current_version: "1.0.0",
    legacy_product_ids: ["phios-book-one"],
    versions: [{
      version: "1.0.0",
      status: "active",
      effective_at: "2026-07-19T00:00:00.000Z",
      components: [{
        component_code: "book-one-knowledge-access",
        component_type: "knowledge_access",
        configuration: {
          knowledge_asset_id: "BOOK-I",
          access_scope: "full_asset",
          language: "zh-Hans",
          format: "watermarked_pdf",
          licence: "single_purchaser_personal_use"
        }
      }]
    }]
  }
].map(normalizeProduct));
function createProductRuntime(options = {}) {
  const products = (options.products || DEFAULT_PRODUCT_RUNTIME_DEFINITIONS).map(normalizeProduct);
  const canonical = /* @__PURE__ */ new Map();
  const legacy = /* @__PURE__ */ new Map();
  for (const product of products) {
    if (canonical.has(product.product_code) || legacy.has(product.product_code)) {
      throw new ProductRuntimeError(
        "PWS_PRODUCT_CONFLICT",
        "Duplicate canonical Product code.",
        { product_code: product.product_code }
      );
    }
    canonical.set(product.product_code, product);
    for (const legacyId of product.legacy_product_ids) {
      if (canonical.has(legacyId) || legacy.has(legacyId)) {
        throw new ProductRuntimeError(
          "PWS_PRODUCT_CONFLICT",
          "Legacy Product ID is ambiguous.",
          { legacy_product_id: legacyId }
        );
      }
      legacy.set(legacyId, product.product_code);
    }
  }
  const resolveProduct = (reference) => {
    const requested = requiredText(reference, "product_reference");
    const canonicalCode = legacy.get(requested) || requested;
    const product = canonical.get(canonicalCode);
    if (!product) {
      throw new ProductRuntimeError(
        "PWS_PRODUCT_NOT_FOUND",
        "Product could not be resolved.",
        { product_reference: requested }
      );
    }
    return product;
  };
  const resolveProductVersion = (reference, version3 = null) => {
    const product = resolveProduct(reference);
    const requestedVersion = version3 || product.current_version;
    const productVersion = product.versions.find((item) => item.version === requestedVersion);
    if (!productVersion) {
      throw new ProductRuntimeError(
        "PWS_PRODUCT_VERSION_NOT_FOUND",
        "Product Version could not be resolved.",
        { product_code: product.product_code, version: requestedVersion }
      );
    }
    return productVersion;
  };
  return Object.freeze({
    contract: PRODUCT_RUNTIME_CONTRACT,
    listProducts: () => Object.freeze([...canonical.values()]),
    resolveProduct,
    resolveProductVersion,
    resolveComponents(reference, version3 = null, componentType = null) {
      const productVersion = resolveProductVersion(reference, version3);
      if (componentType && !PRODUCT_COMPONENT_TYPES.includes(componentType)) {
        throw new ProductRuntimeError(
          "PWS_PRODUCT_COMPONENT_INVALID",
          "Unsupported Product Component type.",
          { component_type: componentType }
        );
      }
      return Object.freeze(productVersion.components.filter(
        (item) => !componentType || item.component_type === componentType
      ));
    },
    mapLegacyProduct(reference) {
      const requested = requiredText(reference, "legacy_product_id");
      const productCode = legacy.get(requested);
      return productCode ? deepFreeze({
        legacy_product_id: requested,
        product_code: productCode,
        read_compatibility_only: true,
        legacy_write_allowed: false
      }) : null;
    }
  });
}
var productRuntime = createProductRuntime();

// functions/pws/registry/product-offer-registry.js
var DEFAULT_PRODUCT_TYPE_DEFINITIONS = Object.freeze([
  Object.freeze({
    code: "knowledge_product",
    name: "Knowledge Product",
    definition: "A governed knowledge item offered without individual analysis."
  }),
  Object.freeze({
    code: "reality_journey_pass",
    name: "Reality Journey Pass",
    definition: "An entitlement-bearing product for one bounded Reality Journey."
  }),
  Object.freeze({
    code: "professional_service_product",
    name: "Professional Service Product",
    definition: "A separately selected professional service requiring its own eligibility, consent, payment and assignment."
  }),
  Object.freeze({
    code: "book",
    name: "Book",
    definition: "A governed publication product."
  }),
  Object.freeze({
    code: "membership",
    name: "Membership",
    definition: "A time-bounded membership product with explicit entitlements."
  }),
  Object.freeze({
    code: "follow_up_product",
    name: "Follow-up Product",
    definition: "A separately purchased continuation product linked to an eligible prior journey or service."
  })
]);
var DEFAULT_OFFER_DEFINITIONS = Object.freeze({
  "reality-journey-pass-v1": Object.freeze({
    code: "reality-journey-pass-v1-myr",
    amount_minor: 500,
    currency: "MYR"
  }),
  "phios-book-one-zh-pdf": Object.freeze({
    code: "phios-book-one-zh-pdf-myr",
    amount_minor: 8900,
    currency: "MYR"
  })
});
var DEFAULT_PRODUCT_DEFINITIONS = Object.freeze(
  // The legacy seed marks every definition active. Draft runtime products must
  // stay outside this compatibility projection until separately admitted.
  DEFAULT_PRODUCT_RUNTIME_DEFINITIONS.filter((product) => product.state === "active").map((product) => {
    const version3 = product.versions.find(
      (item) => item.version === product.current_version
    );
    const journeyAccess = version3.components.find(
      (item) => item.component_type === "journey_access"
    );
    const knowledgeAccess = version3.components.find(
      (item) => item.component_type === "knowledge_access"
    );
    return Object.freeze({
      product_code: product.product_code,
      display_name: product.display_name,
      product_type_code: product.product_type_code,
      product_version: product.current_version,
      method_code: journeyAccess?.configuration.method_code || "knowledge_routing",
      journey_type: journeyAccess?.configuration.journey_type || null,
      professional_review_included: journeyAccess?.configuration.professional_review_included === true,
      legacy_product_ids: product.legacy_product_ids,
      fulfilment_code: knowledgeAccess?.configuration.format || null,
      knowledge_asset_id: knowledgeAccess?.configuration.knowledge_asset_id || null,
      offer: DEFAULT_OFFER_DEFINITIONS[product.product_code]
    });
  })
);

// functions/commerce/book-product-registry.js
var CANONICAL_BOOK_ONE = DEFAULT_PRODUCT_DEFINITIONS.find(
  (product) => product.product_code === "phios-book-one-zh-pdf"
);
if (!CANONICAL_BOOK_ONE) {
  throw new Error("Canonical Book I Product is not registered.");
}
var BOOK_ONE_PRODUCT = Object.freeze({
  productId: CANONICAL_BOOK_ONE.product_code,
  legacyProductId: CANONICAL_BOOK_ONE.legacy_product_ids[0],
  productVersion: "1.0.0",
  title: "\u300A\u4E16\u754C\u5982\u4F55\u5F62\u6210\u300B\u7B2C\u4E00\u518C",
  subtitle: "\u73B0\u5B9E\u5F62\u6210\u4E0E\u4F53\u9A8C",
  language: "zh-Hans",
  format: "watermarked-pdf",
  pageCount: 462,
  currency: CANONICAL_BOOK_ONE.offer.currency,
  amountMinor: CANONICAL_BOOK_ONE.offer.amount_minor,
  displayPrice: `RM${CANONICAL_BOOK_ONE.offer.amount_minor / 100}`,
  license: "single-purchaser-personal-use",
  sourceObjectKey: "private/books/book-one/zh-Hans/book-one-v1.pdf",
  paymentMethods: Object.freeze(["card", "fpx"]),
  downloadTokenLifetimeSeconds: 900,
  downloadTokenMaxUses: 2,
  emailTokenLifetimeSeconds: 259200,
  emailTokenMaxUses: 3,
  active: true
});
var BOOK_PRODUCTS = Object.freeze([BOOK_ONE_PRODUCT]);
function resolveCommerceBookSourceKey(env, productId) {
  if (productId === "COM-BOOK-01") return resolveBookOneSourceKey(env);
  let mappings = {};
  try {
    mappings = JSON.parse(env.COMMERCE_BOOK_SOURCE_KEYS_JSON || "{}");
  } catch {
  }
  const key = String(mappings[productId] || "");
  if (!/^(?:COM-BOOK-0[2-7]|COM-BOOK-CONFIGURATION)$/.test(productId) || !key || key.includes("..") || key.startsWith("/") || /^https?:/.test(key)) throw Object.assign(new Error("Private book source mapping is not configured."), { status: 503, code: "commerce_book_source_unconfigured" });
  return key;
}
function resolveBookOneSourceKey(env = {}) {
  return String(env.BOOK_ONE_SOURCE_KEY || "").trim() || BOOK_ONE_PRODUCT.sourceObjectKey;
}

// functions/commerce/commerce-observability.js
var allowed = /* @__PURE__ */ new Set(["order_id", "stripe_event_id", "checkout_session_id", "product_id", "status", "amount_minor", "currency", "error_code"]);
function commerceLog(event, fields = {}) {
  console.info(JSON.stringify({ component: "commerce", event, ...Object.fromEntries(Object.entries(fields).filter(([key]) => allowed.has(key))) }));
}

// functions/commerce/commerce-crypto.js
var encoder = new TextEncoder();
var decoder = new TextDecoder();
function cryptoApi() {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new Error("Web Crypto is required.");
  }
  return globalThis.crypto;
}
function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}
async function sha256Hex(value) {
  const digest = await cryptoApi().subtle.digest(
    "SHA-256",
    typeof value === "string" ? encoder.encode(value) : value
  );
  return bytesToHex(new Uint8Array(digest));
}
function randomId(prefix = "") {
  return `${prefix}${cryptoApi().randomUUID().replaceAll("-", "")}`;
}
function randomToken(byteLength = 32) {
  return bytesToBase64Url(
    cryptoApi().getRandomValues(new Uint8Array(byteLength))
  );
}

// functions/commerce/book-commerce-store.js
function dbFrom(env) {
  const db = env?.RUNTIME_DB;
  if (!db?.prepare) {
    throw Object.assign(new Error("Commerce database is not configured."), {
      status: 503,
      code: "commerce_database_not_configured"
    });
  }
  return db;
}
async function ensureCommerceProducts(env, clock = Date.now) {
  const db = dbFrom(env), now = nowIso(clock);
  await db.batch(STRIPE_PRODUCT_REGISTRY.filter((p) => commerceEnvironment(env) !== "LIVE" || p.livePriceId).map((registered) => {
    const p = commerceEnvironment(env) === "LIVE" && registered.active ? commerceStripeProduct(registered, "LIVE") : registered;
    return db.prepare(`INSERT INTO commerce_products
    (product_id,product_version,title,language,format,currency,amount_minor,source_object_key,active,created_at,updated_at,category,billing_type,qa_price_id,qa_product_id)
    VALUES (?1,'COM-STRIPE-R1',?2,'bilingual',?3,'MYR',?4,'',?10,?5,?5,?6,?7,?8,?9)
    ON CONFLICT(product_id) DO UPDATE SET active=excluded.active,title=excluded.title,amount_minor=excluded.amount_minor,qa_price_id=excluded.qa_price_id,qa_product_id=excluded.qa_product_id,updated_at=excluded.updated_at`).bind(p.productId, p.title, p.fulfillmentType, p.amountMinor, now, p.category, p.billingType, p.qaPriceId, p.qaProductId, p.active ? 1 : 0);
  }));
}
async function createCommerceOrder({ env, customerId, productId, selectedProducts, idempotencyKeyHash, requestHash, locale, context = {}, clock = Date.now }) {
  await ensureCommerceProducts(env, clock);
  const p = commerceStripeProduct(commerceProduct(productId), commerceEnvironment(env)), db = dbFrom(env), now = nowIso(clock);
  await db.prepare(`INSERT OR IGNORE INTO commerce_checkout_attempts
    (checkout_attempt_id,product_id,idempotency_key_hash,status,locale,created_at,updated_at,customer_id,selected_products_json,order_state,amount_minor,currency,qa_price_id,request_hash,environment,context_json)
    VALUES (?1,?2,?3,'creating',?4,?5,?5,?6,?7,'PENDING',?8,'MYR',?9,?10,?12,?11)`).bind(randomId("ord_"), productId, idempotencyKeyHash, locale, now, customerId, JSON.stringify(selectedProducts), context.reportPresentation?.amountMinor ?? p.amountMinor, p.qaPriceId, requestHash, JSON.stringify(context), commerceEnvironment(env)).run();
  const order = await db.prepare("SELECT * FROM commerce_checkout_attempts WHERE idempotency_key_hash=?1").bind(idempotencyKeyHash).first();
  if (order.customer_id !== customerId || order.request_hash !== requestHash) throw Object.assign(new Error("Idempotency key conflicts with another request."), { status: 409, code: "idempotency_conflict" });
  return order;
}
async function commerceOrder(env, id, customerId) {
  return dbFrom(env).prepare(`SELECT * FROM commerce_checkout_attempts WHERE checkout_attempt_id=?1 AND environment=?2 ${customerId ? "AND customer_id=?3" : ""}`).bind(...customerId ? [id, commerceEnvironment(env), customerId] : [id, commerceEnvironment(env)]).first();
}
async function commerceCustomerBinding(env, customerId) {
  return dbFrom(env).prepare("SELECT * FROM commerce_customer_bindings WHERE customer_id=?1 AND environment=?2").bind(customerId, commerceEnvironment(env)).first();
}
async function bindCommerceCustomer(env, customerId, stripeCustomerId) {
  await dbFrom(env).prepare(`INSERT OR IGNORE INTO commerce_customer_bindings (customer_id,stripe_customer_id,environment,created_at) VALUES (?1,?2,?4,?3)`).bind(customerId, stripeCustomerId, (/* @__PURE__ */ new Date()).toISOString(), commerceEnvironment(env)).run();
  const binding = await commerceCustomerBinding(env, customerId);
  if (binding.stripe_customer_id !== stripeCustomerId) throw Object.assign(new Error("Customer binding conflict."), { status: 409, code: "customer_binding_conflict" });
  return binding;
}
async function attachCommerceCheckout(env, order, session) {
  const db = dbFrom(env);
  await db.prepare(`UPDATE commerce_checkout_attempts SET stripe_checkout_session_id=?2,stripe_checkout_url=?3,status='payment_pending',order_state='CHECKOUT_CREATED',expires_at=?4,updated_at=?5 WHERE checkout_attempt_id=?1 AND order_state IN ('PENDING','CHECKOUT_CREATED')`).bind(order.checkout_attempt_id, session.id, session.url, new Date(session.expires_at * 1e3).toISOString(), (/* @__PURE__ */ new Date()).toISOString()).run();
}
async function ownedCommerceBook(env, customerId, productId) {
  return dbFrom(env).prepare(`SELECT entitlement_id,watermark_status,watermarked_object_key FROM digital_entitlements WHERE customer_id=?1 AND product_id=?2 AND entitlement_status='active' AND (expires_at IS NULL OR expires_at>?3) ORDER BY granted_at DESC LIMIT 1`).bind(customerId, productId, (/* @__PURE__ */ new Date()).toISOString()).first();
}
async function commerceAccountProjection(env, customerId, clock = Date.now) {
  const db = dbFrom(env), time = Math.floor(clock() / 1e3);
  const [orders, entitlements, subscriptions, services] = await Promise.all([
    db.prepare(`SELECT o.checkout_attempt_id AS orderId,o.product_id AS productId,o.order_state AS state,o.amount_minor AS amountMinor,o.currency,o.review_required AS reviewRequired,o.context_json,p.amount_minor AS paidAmountMinor FROM commerce_checkout_attempts o LEFT JOIN commerce_purchases p ON p.checkout_attempt_id=o.checkout_attempt_id WHERE o.customer_id=?1 AND o.environment=?2 ORDER BY o.created_at DESC LIMIT 100`).bind(customerId, commerceEnvironment(env)).all(),
    db.prepare(`SELECT product_id AS productId,entitlement_code AS entitlementCode,entitlement_status AS status,watermark_status AS deliveryState FROM digital_entitlements e WHERE customer_id=?1 AND entitlement_status='active' AND (expires_at IS NULL OR expires_at>?2) AND EXISTS(SELECT 1 FROM commerce_purchases p JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id WHERE p.purchase_id=e.purchase_id AND o.environment=?3)`).bind(customerId, nowIso(clock), commerceEnvironment(env)).all(),
    db.prepare("SELECT subscription_status AS status,current_period_end AS currentPeriodEnd,paid_until AS paidUntil,cancel_at_period_end AS cancelAtPeriodEnd FROM commerce_subscriptions s WHERE customer_id=?1 AND EXISTS(SELECT 1 FROM commerce_checkout_attempts o WHERE o.checkout_attempt_id=s.order_id AND o.environment=?2)").bind(customerId, commerceEnvironment(env)).all(),
    db.prepare("SELECT product_id AS productId,fulfillment_state AS state,duration_minutes AS durationMinutes,modality FROM commerce_service_fulfillments s WHERE customer_id=?1 AND EXISTS(SELECT 1 FROM commerce_checkout_attempts o WHERE o.checkout_attempt_id=s.order_id AND o.environment=?2)").bind(customerId, commerceEnvironment(env)).all()
  ]);
  return { orders: orders.results.map(({ context_json, ...row }) => {
    const offer = controlledOrderOffer({ context_json, customer_id: customerId, product_id: row.productId, amount_minor: row.amountMinor });
    return { ...row, reportPresentation: orderReportPresentation({ context_json }), ...offer ? { controlledPayment: { originalAmountMinor: offer.originalAmountMinor, discountAmountMinor: offer.discountAmountMinor, payableAmountMinor: offer.paidAmountMinor, paidAmountMinor: row.paidAmountMinor ?? null, currency: "MYR" } } : {} };
  }), entitlements: entitlements.results, subscriptions: subscriptions.results.map((s) => ({ ...s, entitlementCode: "PHIOS_MEMBERSHIP", accessGranted: ["ACTIVE", "CANCEL_AT_PERIOD_END"].includes(s.status) && s.paidUntil > time && s.currentPeriodEnd > time })), services: services.results };
}
function nowIso(clock) {
  return new Date(clock()).toISOString();
}
function addSeconds(iso, seconds) {
  return new Date(Date.parse(iso) + seconds * 1e3).toISOString();
}
async function issueDownloadToken({
  env,
  entitlementId,
  purpose = "buyer_download",
  lifetimeSeconds = BOOK_ONE_PRODUCT.downloadTokenLifetimeSeconds,
  maxUses = BOOK_ONE_PRODUCT.downloadTokenMaxUses,
  clock = Date.now
}) {
  const rawToken = randomToken(32);
  const tokenHash = await sha256Hex(rawToken);
  const tokenId = randomId("dlt_");
  const createdAt = nowIso(clock);
  const expiresAt = addSeconds(createdAt, lifetimeSeconds);
  await dbFrom(env).prepare(`
    INSERT INTO commerce_download_tokens (
      token_id, entitlement_id, token_hash, purpose, expires_at,
      max_uses, use_count, created_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, ?7)
  `).bind(
    tokenId,
    entitlementId,
    tokenHash,
    purpose,
    expiresAt,
    maxUses,
    createdAt
  ).run();
  return { rawToken, tokenId, expiresAt, maxUses };
}

// functions/commerce/stripe-client.js
var STRIPE_API = "https://api.stripe.com/v1";
function stripeSecret(env) {
  const secret = String(env?.STRIPE_SECRET_KEY || "").trim();
  if (!/^(sk|rk)_/.test(secret)) {
    throw Object.assign(new Error("Stripe is not configured."), {
      status: 503,
      code: "stripe_not_configured"
    });
  }
  return secret;
}
async function stripeRequest(env, path, options = {}) {
  const response = await (options.fetcher || fetch)(
    `${STRIPE_API}${path}`,
    {
      method: options.method || "GET",
      headers: {
        authorization: `Bearer ${stripeSecret(env)}`,
        ...options.apiVersion ? { "Stripe-Version": options.apiVersion } : {},
        ...options.idempotencyKey ? { "idempotency-key": options.idempotencyKey } : {},
        ...options.body ? { "content-type": "application/x-www-form-urlencoded" } : {}
      },
      body: options.body
    }
  );
  let payload = {};
  try {
    payload = await response.json();
  } catch {
  }
  if (!response.ok) {
    throw Object.assign(new Error("Stripe rejected the request."), {
      status: response.status >= 400 && response.status < 500 ? 400 : 502,
      code: "stripe_request_failed",
      stripeRequestId: response.headers.get("request-id") || ""
    });
  }
  return payload;
}
async function stripeQaRequest(env, path, options = {}) {
  const environment = requireStripeCommerce(env);
  const payload = await stripeRequest(env, path, { ...options, apiVersion: "2026-07-29.dahlia" });
  if (payload.livemode !== void 0 && payload.livemode !== (environment === "LIVE") || payload.data?.some((item) => item.livemode !== void 0 && item.livemode !== (environment === "LIVE"))) throw Object.assign(new Error("Live object rejected."), { status: 502, code: "stripe_live_object_rejected" });
  return payload;
}
async function verifyStripeQaAccount(env, fetcher) {
  const account = await stripeQaRequest(env, "/account", { fetcher });
  if (account.id !== (commerceEnvironment(env) === "LIVE" ? STRIPE_LIVE_ACCOUNT : "acct_1UFr0TBEKXJyHMkK")) throw Object.assign(new Error("Wrong Stripe account."), { status: 503, code: "stripe_qa_account_mismatch" });
}
function createCanonicalStripeCustomer(env, customerId, idempotencyKey, fetcher) {
  return stripeQaRequest(env, "/customers", { method: "POST", body: new URLSearchParams({ "metadata[customer_id]": customerId, "metadata[environment]": commerceEnvironment(env) }), idempotencyKey, fetcher });
}
function createCommerceCheckoutSession({ env, product, order, customerId, origin, locale, idempotencyKey, fetcher }) {
  product = commerceStripeProduct(product, commerceEnvironment(env));
  const mode = product.billingType === "RECURRING" ? "subscription" : "payment";
  const metadata = { order_id: order.checkout_attempt_id, commerce_product_id: product.productId, customer_id: order.customer_id, environment: commerceEnvironment(env), schema_version: "COM-STRIPE-R1", selected_reports: order.selected_products_json };
  const body = new URLSearchParams({ mode, customer: customerId, "line_items[0][price]": product.qaPriceId, "line_items[0][quantity]": "1", success_url: `${origin}/account?commerce_order=${encodeURIComponent(order.checkout_attempt_id)}`, cancel_url: `${origin}/account?commerce_order=${encodeURIComponent(order.checkout_attempt_id)}&checkout=cancelled`, locale: locale === "zh-Hans" ? "zh" : "en" });
  const presentation = validateOrderReportPresentation(product, order);
  const controlled = JSON.parse(order.context_json || "{}").controlledPurchase;
  if (controlled) {
    body.set("discounts[0][coupon]", controlled.couponId);
    metadata.controlled_campaign_id = controlled.campaignId;
    body.set("expires_at", String(Math.min(Math.floor(Date.parse(controlled.expiresAt) / 1e3), Math.floor(Date.now() / 1e3) + 86400)));
  }
  if (presentation) {
    for (const key of ["reportLanguageMode", "reportLocale", "pricingVersion", "modifierRule", "surchargeAmountMinor"]) metadata[key] = String(presentation[key]);
    if (presentation.surchargeAmountMinor) {
      body.set("line_items[1][price_data][currency]", "myr");
      body.set("line_items[1][price_data][product]", product.qaProductId);
      body.set("line_items[1][price_data][unit_amount]", String(presentation.surchargeAmountMinor));
      body.set("line_items[1][quantity]", "1");
    }
  }
  const suffix = order.checkout_attempt_id.replace("ord_", "").slice(0, 8).split("").map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
  body.set("integration_identifier", `phios_commerce_${commerceEnvironment(env).toLowerCase()}_${suffix}`);
  for (const [key, value] of Object.entries(metadata)) {
    body.set(`metadata[${key}]`, value);
    body.set(`${mode === "subscription" ? "subscription_data" : "payment_intent_data"}[metadata][${key}]`, value);
  }
  return stripeQaRequest(env, "/checkout/sessions", { method: "POST", body, idempotencyKey, fetcher });
}
function createCommercePortal(env, customerId, origin, fetcher) {
  return stripeQaRequest(env, "/billing_portal/sessions", { method: "POST", body: new URLSearchParams({ customer: customerId, return_url: `${origin}/account` }), fetcher });
}

// functions/commerce/commerce-http.js
function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      ...extraHeaders
    }
  });
}
function cleanText(value, maximum = 500) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maximum) : "";
}
function localeFrom(value) {
  const locale = cleanText(value, 32).toLowerCase().replaceAll("_", "-");
  return locale === "zh" || locale.startsWith("zh-") ? "zh-Hans" : "en";
}
async function readJsonBody(request, maximumBytes = 16384) {
  const contentType = cleanText(request.headers.get("content-type"), 128).toLowerCase();
  if (!contentType.includes("application/json")) {
    throw Object.assign(new Error("Content-Type must be application/json."), {
      status: 415,
      code: "content_type_invalid"
    });
  }
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > maximumBytes) {
    throw Object.assign(new Error("Request body is too large."), {
      status: 413,
      code: "request_body_too_large"
    });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    throw Object.assign(new Error("Request body must be valid JSON."), {
      status: 400,
      code: "json_invalid"
    });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw Object.assign(new Error("Request body must be a JSON object."), {
      status: 400,
      code: "request_body_invalid"
    });
  }
  return body;
}
function commerceError(error, fallbackCode = "commerce_failed") {
  const status = Number(error?.status);
  return json({
    success: false,
    error: cleanText(error?.code, 96) || fallbackCode,
    message: status >= 400 && status < 500 ? cleanText(error?.message, 500) : "The commerce service could not complete this request."
  }, status >= 400 && status <= 599 ? status : 500);
}

// functions/commerce/commerce-stripe-api.js
function requireIdentity(context) {
  const identity = normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);
  if (!identity) throw Object.assign(new Error("Sign in with your verified PHI OS account."), { status: 401, code: "commerce_authentication_required" });
  return identity.userId;
}
function sameOrigin(request) {
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") !== origin) throw Object.assign(new Error("Same-origin request required."), { status: 403, code: "commerce_origin_invalid" });
  return origin;
}
async function commerceApi(context, action) {
  const { request, env = {}, fetch: fetcher } = context;
  try {
    if (action === "catalog") return json({ success: true, environment: commerceEnvironment(env), liveEnabled: commerceEnvironment(env) === "LIVE" && commerceCheckoutAvailable(env), checkoutAvailable: commerceCheckoutAvailable(env), products: STRIPE_PRODUCT_REGISTRY.filter((p) => p.active).map(({ qaPriceId, qaProductId, livePriceId, liveProductId, ...p }) => {
      let reportPresentationOptions = null, reportPurchaseState = null;
      if (isLanguageReport(p)) {
        try {
          reportPresentationOptions = (p.bilingualOnly ? ["bilingual"] : ["zh-Hans", "en", "bilingual"]).map((reportLocale) => commerceReportQuote(p, { reportLocale, reportLanguageMode: reportLocale === "bilingual" ? "BILINGUAL" : "SINGLE" }, p.productId.includes("BUNDLE") ? standardBundleProducts().slice(0, p.productId.endsWith("-2") ? 2 : p.productId.endsWith("-3") ? 3 : 5) : []));
          reportPurchaseState = "AVAILABLE";
        } catch (error) {
          if (error?.message === "PWS_REPORT_LEGACY_NEW_PURCHASE_DISABLED") {
            reportPresentationOptions = [];
            reportPurchaseState = "LEGACY_READABLE_NEW_PURCHASE_DISABLED";
          } else throw error;
        }
      }
      return { ...p, checkoutAvailable: commerceCheckoutAvailable(env) && (commerceEnvironment(env) !== "LIVE" || Boolean(livePriceId && liveProductId)), reportPresentationOptions, reportPurchaseState };
    }), eligibleBundleProducts: standardBundleProducts() });
    const customerId = requireIdentity(context);
    if (action === "account") return json({ success: true, ...await commerceAccountProjection(env, customerId) });
    if (action === "status") {
      const order2 = await commerceOrder(env, new URL(request.url).searchParams.get("order_id"), customerId);
      if (!order2) return json({ success: false, code: "order_not_found" }, 404);
      return json({ success: true, order: { orderId: order2.checkout_attempt_id, productId: order2.product_id, state: order2.order_state, amountMinor: order2.amount_minor, currency: order2.currency, reviewRequired: Boolean(order2.review_required), reportPresentation: orderReportPresentation(order2) } });
    }
    const origin = sameOrigin(request);
    if (action === "book-download") {
      const body2 = await readJsonBody(request), p = commerceProduct(body2.productId);
      if (p.category !== "BOOK") return json({ success: false, error: "book_required" }, 422);
      const record = await ownedCommerceBook(env, customerId, p.productId);
      if (!record) return json({ success: false, error: "book_access_required" }, 403);
      if (record.watermark_status !== "ready" || !record.watermarked_object_key) return json({ success: false, error: "watermarked_book_not_ready" }, 409);
      const token = await issueDownloadToken({ env, entitlementId: record.entitlement_id });
      return json({ success: true, downloadUrl: `/api/book-one-download?token=${encodeURIComponent(token.rawToken)}`, expiresAt: token.expiresAt });
    }
    requireStripeCommerce(env);
    if (!commerceCheckoutAvailable(env)) throw Object.assign(new Error("QA checkout is not enabled."), { status: 503, code: "commerce_qa_gate_closed" });
    const body = await readJsonBody(request);
    if (action === "portal") {
      if (Object.keys(body).some((k) => k !== "locale")) throw Object.assign(new Error("Portal customer is server owned."), { status: 422, code: "portal_input_invalid" });
      const binding2 = await commerceCustomerBinding(env, customerId);
      if (!binding2) return json({ success: false, code: "stripe_customer_not_bound" }, 409);
      await verifyStripeQaAccount(env, fetcher);
      const portal = await createCommercePortal(env, binding2.stripe_customer_id, origin, fetcher);
      return json({ success: true, url: portal.url });
    }
    const allowed2 = /* @__PURE__ */ new Set(["productId", "selectedProducts", "locale", "context", "acceptDigitalPolicy", "reportLanguageMode", "reportLocale", "amount", "surcharge", "total"]);
    if (Object.keys(body).some((k) => !allowed2.has(k))) throw Object.assign(new Error("Only canonical product input is accepted."), { status: 422, code: "checkout_input_invalid" });
    const product = commerceProduct(body.productId), selected = commerceSelection(product.productId, body.selectedProducts || []);
    if (product.category === "BOOK") resolveCommerceBookSourceKey(env, product.productId);
    if (body.acceptDigitalPolicy !== true) throw Object.assign(new Error("Accept purchase terms."), { status: 422, code: "digital_policy_acceptance_required" });
    const supplied = request.headers.get("idempotency-key") || "";
    if (!/^[A-Za-z0-9._:-]{16,120}$/.test(supplied)) throw Object.assign(new Error("Idempotency key required."), { status: 422, code: "idempotency_key_required" });
    const reference = body.context?.readingId;
    if (body.context && (Object.keys(body.context).some((k) => k !== "readingId") || typeof reference !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(reference))) throw Object.assign(new Error("Invalid report reference."), { status: 422, code: "checkout_context_invalid" });
    const contextSnapshot = reference ? { readingId: reference } : {};
    if (isLanguageReport(product)) contextSnapshot.reportPresentation = commerceReportQuote(product, body, selected);
    else if (body.reportLanguageMode || body.reportLocale) throw Object.assign(new Error("Report language is not applicable."), { status: 422, code: "REPORT_PRESENTATION_NOT_APPLICABLE" });
    const controlled = controlledPurchaseOffer(env, { ownerId: customerId, productId: product.productId, originalAmountMinor: contextSnapshot.reportPresentation?.amountMinor ?? product.amountMinor });
    if (controlled) {
      if (product.billingType === "RECURRING" || !isLanguageReport(product)) throw Object.assign(Error("Controlled report purchase only."), { status: 403, code: "controlled_product_denied" });
      contextSnapshot.controlledPurchase = controlled;
    }
    const requestHash = await sha256Hex(JSON.stringify({ productId: product.productId, selected, context: contextSnapshot }));
    const key = await sha256Hex(controlled ? `COM-STRIPE-R1/${commerceEnvironment(env)}/${controlled.reservationKey}` : `COM-STRIPE-R1/${commerceEnvironment(env)}/${customerId}/${supplied}`);
    const order = await createCommerceOrder({ env, customerId, productId: product.productId, selectedProducts: selected, idempotencyKeyHash: key, requestHash, locale: localeFrom(body.locale), context: contextSnapshot });
    if (order.stripe_checkout_url && order.order_state === "CHECKOUT_CREATED" && Date.parse(order.expires_at) > Date.now()) return json({ success: true, orderId: order.checkout_attempt_id, checkoutUrl: order.stripe_checkout_url, replay: true });
    if (order.order_state !== "PENDING") throw Object.assign(new Error("This checkout attempt is no longer open. Start a new purchase."), { status: 409, code: "checkout_attempt_closed" });
    await verifyStripeQaAccount(env, fetcher);
    let binding = await commerceCustomerBinding(env, customerId);
    if (!binding) {
      const customer = await createCanonicalStripeCustomer(env, customerId, await sha256Hex(`COM-STRIPE-R1/customer/${customerId}`), fetcher);
      binding = await bindCommerceCustomer(env, customerId, customer.id);
    }
    const session = await createCommerceCheckoutSession({ env, product, order, customerId: binding.stripe_customer_id, origin, locale: order.locale, idempotencyKey: `checkout-${key}`, fetcher });
    if (!(commerceEnvironment(env) === "LIVE" ? /^cs_(?!test_)/ : /^cs_test_/).test(session.id) || !/^https:\/\/checkout\.stripe\.com\//.test(session.url || "") || !Number.isFinite(session.expires_at)) throw Object.assign(new Error("Invalid QA checkout response."), { status: 502, code: "checkout_response_invalid" });
    await attachCommerceCheckout(env, order, session);
    commerceLog("CHECKOUT_CREATED", { order_id: order.checkout_attempt_id, checkout_session_id: session.id, product_id: product.productId, amount_minor: order.amount_minor, currency: "MYR" });
    return json({ success: true, orderId: order.checkout_attempt_id, checkoutUrl: session.url }, 201);
  } catch (error) {
    if (error.message === "PWS_REPORT_LEGACY_NEW_PURCHASE_DISABLED") Object.assign(error, { status: 422, code: "PWS_REPORT_LEGACY_NEW_PURCHASE_DISABLED" });
    return commerceError(error, "commerce_request_failed");
  }
}
export {
  commerceApi
};
