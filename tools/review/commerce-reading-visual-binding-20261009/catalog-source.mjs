// functions/commerce/commerce-environment.js
function commerceStripeProduct(product, environment) {
  if (environment !== "LIVE") return product;
  if (!product.liveProductId || !product.livePriceId) throw Object.assign(Error("Live product binding not configured."), { status: 503, code: "stripe_live_product_unbound" });
  return { ...product, qaProductId: product.liveProductId, qaPriceId: product.livePriceId };
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
function eligibleReportIds(bundleId) {
  const p = resolveReportProduct(bundleId);
  if (p.kind !== "BUNDLE") throw new Error("PWS_REPORT_BUNDLE_REQUIRED");
  return REPORT_COMMERCE_CONTRACT.eligibilityRegistries.find((r) => r.registryId === p.selection.eligibilityRegistry).productIds;
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
function eligibleReportIds2(bundleId) {
  const p = resolveReportProduct2(bundleId);
  if (p.kind !== "BUNDLE") throw new Error("PWS_REPORT_BUNDLE_REQUIRED");
  return REPORT_COMMERCE_CONTRACT2.eligibilityRegistries.find((r) => r.registryId === p.selection.eligibilityRegistry).productIds;
}

// functions/pws/commercial/stripe-product-registry.js
var STRIPE_QA_ACCOUNT = "acct_1UFr0TBEKXJyHMkK";
var COMMERCE_STRIPE_VERSION = "COM-STRIPE-R1";
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
function commerceEntitlements(productId, selectedProducts = []) {
  return commerceSelection(productId, selectedProducts).map((id) => ({ productId: id, entitlementCode: commerceProduct(id).entitlementPolicy }));
}
function assertReportPriceParity() {
  for (const row of STRIPE_PRODUCT_REGISTRY.filter((p) => p.active && p.category === "REPORT" && !p.professionalReviewRequired && p.productId.startsWith("COM-REPORT-"))) {
    const id = row.productId.replace("COM-REPORT-", "").replaceAll("-", "_");
    const legacy = id.startsWith("BUNDLE") ? id : id.replace("_FULL", "_FULL_REPORT");
    if (resolveReportProduct2(legacy)?.amountMinor !== row.amountMinor) throw new Error("REPORT_PRICE_AUTHORITY_DRIFT:" + row.productId);
  }
  return true;
}
var historicalRows = [
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
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "WILL WRITING",
    "entitlementPolicy": "PURCHASED_INTAKE_REQUIRED",
    "fulfillmentType": "HUMAN_SERVICE"
  },
  {
    "productId": "COM-REPORT-FINANCIAL-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 15900,
    "qaProductId": "prod_VHPtDLeg1UajcN",
    "qaPriceId": "price_1UGr3gBEKXJyHMkKAmHkIrmz",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT FINANCIAL FULL",
    "entitlementPolicy": "REPORT_FINANCIAL_FULL",
    "fulfillmentType": "REPORT_ACCESS",
    "professionalReviewRequired": true
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
    "active": true,
    "title": "REPORT BUNDLE 5PLUS",
    "entitlementPolicy": "SELECTED_STANDARD_REPORTS",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-BUNDLE-3",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 9900,
    "qaProductId": "prod_VHPtwqHj0F4P7C",
    "qaPriceId": "price_1UGr3cBEKXJyHMkKWoVsrCVn",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT BUNDLE 3",
    "entitlementPolicy": "SELECTED_STANDARD_REPORTS",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-BUNDLE-2",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 6900,
    "qaProductId": "prod_VHPttr1bpn1AU8",
    "qaPriceId": "price_1UGr3aBEKXJyHMkKPnlBqWP1",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT BUNDLE 2",
    "entitlementPolicy": "SELECTED_STANDARD_REPORTS",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-ECR-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 3900,
    "qaProductId": "prod_VHPtFV3gJ4MbA2",
    "qaPriceId": "price_1UGr3YBEKXJyHMkKBagvT0b3",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT ECR FULL",
    "entitlementPolicy": "REPORT_ECR_FULL",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-CROSS-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 29900,
    "qaProductId": "prod_VHPtFwBBbFdgNN",
    "qaPriceId": "price_1UGr3WBEKXJyHMkKMzKNaaEm",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT CROSS FULL",
    "entitlementPolicy": "REPORT_CROSS_FULL",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-HD-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 12900,
    "qaProductId": "prod_VHPtAElGHLi3gh",
    "qaPriceId": "price_1UGr3UBEKXJyHMkK4u9lYF0A",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT HD FULL",
    "entitlementPolicy": "REPORT_HD_FULL",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-PROFILE-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 3900,
    "qaProductId": "prod_VHPtnVjpP4CUMG",
    "qaPriceId": "price_1UGr3RBEKXJyHMkKteu1HeRH",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT PROFILE FULL",
    "entitlementPolicy": "REPORT_PROFILE_FULL",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-NUMEROLOGY-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 3900,
    "qaProductId": "prod_VHPtzvhrG3VnuD",
    "qaPriceId": "price_1UGr3PBEKXJyHMkKH6EsZNQy",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT NUMEROLOGY FULL",
    "entitlementPolicy": "REPORT_NUMEROLOGY_FULL",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-ASTROLOGY-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 3900,
    "qaProductId": "prod_VHPtQk6R2hKboU",
    "qaPriceId": "price_1UGr3NBEKXJyHMkKXBx8geSX",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT ASTROLOGY FULL",
    "entitlementPolicy": "REPORT_ASTROLOGY_FULL",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-ZIWEI-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 3900,
    "qaProductId": "prod_VHPt5VvsD8UtOj",
    "qaPriceId": "price_1UGr3LBEKXJyHMkKOGsjmm4C",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT ZIWEI FULL",
    "entitlementPolicy": "REPORT_ZIWEI_FULL",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-BAZI-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 3900,
    "qaProductId": "prod_VHPthmjwXsFaSG",
    "qaPriceId": "price_1UGr3JBEKXJyHMkK8gOJBTe7",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT BAZI FULL",
    "entitlementPolicy": "REPORT_BAZI_FULL",
    "fulfillmentType": "REPORT_ACCESS"
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
  }
];
function commerceOrderProduct(order) {
  const registered = STRIPE_PRODUCT_REGISTRY.find((p) => p.productId === order?.product_id);
  const current = registered && order?.environment === "LIVE" ? commerceStripeProduct(registered, "LIVE") : registered;
  if (current?.qaPriceId === order?.qa_price_id) return current;
  const historic = historicalRows.find((p) => p.productId === order?.product_id && p.qaPriceId === order?.qa_price_id);
  if (!historic) throw Object.assign(Error("Stored product price not recognized."), { status: 422, code: "commerce_provider_mismatch" });
  return Object.freeze(historic);
}
function commerceOrderEntitlements(order) {
  const product = commerceOrderProduct(order), selected = JSON.parse(order.selected_products_json || "[]");
  const ids = product.productId.includes("BUNDLE") ? selected : [product.productId];
  return ids.map((productId) => {
    const p = STRIPE_PRODUCT_REGISTRY.find((p2) => p2.productId === productId);
    if (!p || !p.entitlementPolicy) throw Error("ORDER_ENTITLEMENT_PRODUCT_UNKNOWN");
    return { productId, entitlementCode: p.entitlementPolicy };
  });
}
export {
  COMMERCE_STRIPE_VERSION,
  STRIPE_PRODUCT_REGISTRY,
  STRIPE_QA_ACCOUNT,
  assertReportPriceParity,
  commerceEntitlements,
  commerceOrderEntitlements,
  commerceOrderProduct,
  commerceProduct,
  commerceSelection,
  standardBundleProducts
};
