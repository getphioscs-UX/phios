import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

function normalizeText(source) {
  return source
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n');
}

async function read(relativePath) {
  return normalizeText(
    await fs.readFile(path.join(root, relativePath), 'utf8')
  );
}

async function readJson(relativePath) {
  return JSON.parse(await read(relativePath));
}

async function exists(relativePath) {
  try {
    await fs.access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function sha256(relativePath) {
  return crypto
    .createHash('sha256')
    .update(await read(relativePath), 'utf8')
    .digest('hex');
}

const requiredFiles = [
  'content/registry/professional-service-catalog.json',
  'content/registry/professional-deliverable-catalog.json',
  'content/registry/professional-pricing-policy.json',
  'content/registry/professional-service-levels.json',
  'content/registry/professional-service-boundaries.json',
  'content/registry/m4a-w1-professional-service-definition.json',
  'docs/professional/M4A-W1-PROFESSIONAL-SERVICE-DEFINITION.md',
  'docs/professional/M4A-W1-INSTALL.md'
];

for (const file of requiredFiles) {
  assert.equal(
    await exists(file),
    true,
    `Missing M4A-W1 deliverable: ${file}`
  );
}

const catalog = await readJson(
  'content/registry/professional-service-catalog.json'
);
const deliverables = await readJson(
  'content/registry/professional-deliverable-catalog.json'
);
const pricing = await readJson(
  'content/registry/professional-pricing-policy.json'
);
const serviceLevels = await readJson(
  'content/registry/professional-service-levels.json'
);
const boundaries = await readJson(
  'content/registry/professional-service-boundaries.json'
);
const milestone = await readJson(
  'content/registry/m4a-w1-professional-service-definition.json'
);
const registryIndex = await readJson('content/registry/index.json');

assert.equal(catalog.milestone, 'M4A-W1');
assert.equal(catalog.status, 'definition-frozen-implementation-pending');
assert.deepEqual(catalog.serviceGroups, [
  'runtime',
  'human_design',
  'financial',
  'integrated'
]);

const expectedServiceIds = [
  'automated_runtime_reading',
  'professional_runtime_reading',
  'reading_consultation',
  'navigation_follow_up',
  'long_term_runtime_review',
  'human_design_foundation_report',
  'human_design_runtime_interpretation',
  'reality_specific_human_design_interpretation',
  'runtime_human_design_consultation',
  'financial_reality_snapshot',
  'financial_stamina_analysis',
  'financial_reality_consultation',
  'financial_navigation_plan',
  'financial_implementation_review',
  'long_term_financial_runtime_review',
  'joint_household_financial_review',
  'integrated_runtime_financial_review',
  'integrated_professional_review'
];
assert.deepEqual(
  catalog.services.map(service => service.serviceId),
  expectedServiceIds
);
assert.equal(
  new Set(catalog.services.map(service => service.serviceId)).size,
  catalog.services.length,
  'Professional service IDs must be unique'
);

const deliveryProfiles = new Map(
  deliverables.profiles.map(profile => [profile.profileId, profile])
);
const completionProfiles = new Map(
  serviceLevels.profiles.map(profile => [profile.profileId, profile])
);
const pricingProfiles = new Set(pricing.profiles);

for (const service of catalog.services) {
  assert.match(service.name.en, /\S/);
  assert.match(service.name['zh-Hans'], /\S/);
  assert.equal(
    deliveryProfiles.has(service.deliveryProfileId),
    true,
    `${service.serviceId}: missing delivery profile`
  );
  assert.equal(
    completionProfiles.has(service.completionProfileId),
    true,
    `${service.serviceId}: missing completion profile`
  );
  assert.equal(
    pricingProfiles.has(service.pricingProfileId),
    true,
    `${service.serviceId}: missing pricing profile`
  );
  assert.ok(
    ['existing-bounded-runtime', 'definition-only'].includes(
      service.activationStatus
    )
  );
}

const professionalServices = catalog.services.filter(
  service => service.serviceId !== 'automated_runtime_reading'
);
assert.equal(
  professionalServices.every(service =>
    service.professionalReviewRequired === true &&
    service.regulatedScopeGate === true
  ),
  true
);

const financialServiceIds = catalog.services
  .filter(service => service.group === 'financial')
  .map(service => service.serviceId);
for (const serviceId of [
  'financial_reality_snapshot',
  'financial_stamina_analysis',
  'financial_reality_consultation',
  'financial_navigation_plan',
  'financial_implementation_review',
  'long_term_financial_runtime_review',
  'joint_household_financial_review'
]) {
  assert.equal(
    financialServiceIds.includes(serviceId),
    true,
    `Missing financial service: ${serviceId}`
  );
}

const snapshot = deliveryProfiles.get('financial_reality_snapshot');
assert.equal(snapshot.adviceLevel, 'facts-only');
for (const section of [
  'Financial Information Date',
  'Financial Objectives',
  'Income Overview',
  'Expense Overview',
  'Asset Overview',
  'Liability Overview',
  'Insurance Overview',
  'Investment Overview',
  'Missing Information'
]) {
  assert.equal(
    snapshot.sections.includes(section),
    true,
    `Financial Reality Snapshot missing ${section}`
  );
}

const stamina = deliveryProfiles.get('financial_stamina_analysis');
for (const section of [
  'Financial Position Summary',
  'Cash Flow',
  'Net Worth',
  'Financial Ratios',
  'Insurance Protection',
  'Investment Position',
  'Property Position',
  'Tax Considerations',
  'Retirement Readiness',
  'Education Readiness',
  'Estate Readiness',
  'Financial Hazards',
  'Navigation Priorities'
]) {
  assert.equal(
    stamina.sections.includes(section),
    true,
    `Financial Stamina Analysis missing ${section}`
  );
}

const financialPlan = deliveryProfiles.get('financial_navigation_plan');
for (const section of [
  'Confirmed Financial Facts',
  'Professional Assessment',
  'Assumptions Used',
  'Priority Risks',
  'Recommended Direction',
  'Implementation Sequence',
  'Responsible Person',
  'Target Date',
  'Required Documents',
  'Review Trigger'
]) {
  assert.equal(
    financialPlan.sections.includes(section),
    true,
    `Financial Navigation Plan missing ${section}`
  );
}

const realitySpecific = deliveryProfiles.get(
  'reality_specific_human_design'
);
assert.deepEqual(realitySpecific.requiredSeparatedBlocks, [
  'Confirmed Reality Evidence',
  'Human Design Perspective',
  'Possible Correspondence',
  'What Remains Unverified'
]);

assert.deepEqual(
  deliverables.requiredSourceLabels,
  boundaries.sourceClasses,
  'Report source labels and professional boundary source classes must align'
);
for (const sourceClass of [
  'financial_fact',
  'professional_calculation',
  'professional_assessment',
  'projection',
  'assumption',
  'recommendation',
  'client_decision',
  'implementation_result'
]) {
  assert.equal(boundaries.sourceClasses.includes(sourceClass), true);
}

assert.equal(
  boundaries.separationRules.factsAndProfessionalOpinionShareField,
  false
);
assert.equal(
  boundaries.separationRules.humanDesignBecomesRuntimeEvidence,
  false
);
assert.equal(
  boundaries.separationRules.riskFlagAutomaticallyBecomesRecommendation,
  false
);
assert.equal(
  boundaries.financialBoundary.productNeutralFirst,
  true
);
assert.equal(
  boundaries.financialBoundary.regulatedAdviceRequiresQualifiedAuthorisedProfessional,
  true
);
assert.equal(
  boundaries.financialBoundary.automaticProductPurchase,
  false
);
assert.equal(
  boundaries.financialBoundary.automaticAssetSale,
  false
);
assert.equal(
  boundaries.humanDesignBoundary.interpretivePerspectiveOnly,
  true
);
assert.equal(
  boundaries.humanDesignBoundary.verifiedRealityFact,
  false
);
assert.equal(
  boundaries.humanDesignBoundary.directRequiredActionAllowed,
  false
);
assert.equal(
  boundaries.integratedBoundary.sourcesMayBeMergedIntoUnlabelledFact,
  false
);
for (const value of Object.values(boundaries.currentImplementationBoundary)) {
  assert.equal(value, false);
}

assert.equal(pricing.defaultCurrency, 'MYR');
assert.equal(pricing.amountsPublished, false);
assert.equal(pricing.checkoutEnabled, false);
for (const field of pricing.requiredFields) {
  assert.equal(
    Object.hasOwn(pricing.template, field),
    true,
    `Pricing template missing ${field}`
  );
}
for (const field of pricing.financialSupplementFields) {
  assert.equal(
    Object.hasOwn(pricing.template, field),
    true,
    `Financial pricing template missing ${field}`
  );
}
for (const driver of [
  'client_asset_total',
  'client_net_worth',
  'investment_portfolio_value'
]) {
  assert.equal(pricing.prohibitedPricingDrivers.includes(driver), true);
}
assert.equal(pricing.rules.assetValueAutomaticallyRaisesPrice, false);
assert.equal(pricing.rules.complexityReasonMustBeDisclosed, true);
assert.equal(pricing.rules.commissionBasedProductSelection, false);
for (const [field, value] of Object.entries(pricing.template)) {
  if (field === 'currency') {
    assert.equal(value, 'MYR');
  } else {
    assert.equal(value, null, `Price field must remain unfrozen: ${field}`);
  }
}

const expectedCompletionWindows = {
  one_to_three_business_days: [1, 3],
  three_to_five_business_days: [3, 5],
  five_to_seven_business_days: [5, 7],
  five_to_ten_business_days: [5, 10],
  seven_to_fourteen_business_days: [7, 14],
  three_to_five_after_consultation: [3, 5],
  five_to_ten_after_complete_update: [5, 10]
};
for (const [profileId, range] of Object.entries(expectedCompletionWindows)) {
  const profile = completionProfiles.get(profileId);
  assert.ok(profile, `Missing completion profile: ${profileId}`);
  assert.deepEqual(
    [profile.minimumBusinessDays, profile.maximumBusinessDays],
    range
  );
}

assert.equal(
  milestone.status,
  'service-definition-frozen-next-consent'
);
assert.equal(
  milestone.baseline.commit,
  'a6389e3cc3e5c4052aea60064c38412ad71a712b'
);
assert.deepEqual(milestone.implementationOrder, [
  'M4A-W1',
  'M4A-W3',
  'M4A-W7',
  'M4A-W8',
  'M4A-W2',
  'M4A-W4',
  'M4A-W5',
  'M4A-W6'
]);
assert.equal(milestone.nextWorkPackage, 'M4A-W3 Consent and Sharing');
for (const value of Object.values(milestone.guardrails)) {
  assert.equal(value, false);
}
for (const [file, expectedHash] of Object.entries(
  milestone.frozenArtifacts
)) {
  assert.equal(
    await sha256(file),
    expectedHash,
    `Frozen pre-M4A artifact changed: ${file}`
  );
}

const migrationFiles = (await fs.readdir(path.join(root, 'db/migrations')))
  .filter(filename => filename.endsWith('.sql'))
  .sort();
assert.deepEqual(
  migrationFiles.slice(0, milestone.migrationInventory.length),
  milestone.migrationInventory
);

assert.equal(
  registryIndex.registries.professional_service_catalog,
  './professional-service-catalog.json'
);
assert.equal(
  registryIndex.registries.professional_deliverable_catalog,
  './professional-deliverable-catalog.json'
);
assert.equal(
  registryIndex.registries.professional_pricing_policy,
  './professional-pricing-policy.json'
);
assert.equal(
  registryIndex.registries.professional_service_levels,
  './professional-service-levels.json'
);
assert.equal(
  registryIndex.registries.professional_service_boundaries,
  './professional-service-boundaries.json'
);
assert.equal(
  registryIndex.registries.m4a_w1_professional_service_definition,
  './m4a-w1-professional-service-definition.json'
);

const existingFinancialDomain = await read(
  'functions/runtime/navigation/professional-domains-financial.js'
);
for (const boundary of [
  "sensitiveDataCollection: false",
  "uploadEnabled: false",
  "conclusionsProvided: false"
]) {
  const contract = await read(
    'functions/runtime/navigation/professional-domain-contract.js'
  );
  assert.equal(contract.includes(boundary), true);
}
assert.equal(
  existingFinancialDomain.includes('Investment recommendations'),
  true
);

const knowledgeRelease = await readJson(
  'content/registry/m3b-knowledge-release.json'
);
assert.equal(
  knowledgeRelease.workstreams['M3B-W8'].checkoutAcceptsMoney,
  false
);

const authoredText = (
  await Promise.all(requiredFiles.map(file => read(file)))
).join('\n');
assert.doesNotMatch(
  authoredText,
  /\b\d{6}-?\d{2}-?\d{4}\b/,
  'M4A-W1 must not contain an identity number'
);
assert.doesNotMatch(
  authoredText,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  'M4A-W1 must not contain a client email address'
);
assert.doesNotMatch(
  authoredText,
  /\b\d{10,16}\b/,
  'M4A-W1 must not contain a full account, policy or phone number'
);

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['check:m4a-professional-service-definition'],
  'node scripts/check-m4a-professional-service-definition.mjs'
);
assert.equal(
  packageJson.scripts.check.includes(
    'node scripts/check-m4a-professional-service-definition.mjs'
  ),
  true
);

console.log(
  '✓ M4A-W1 Professional Service Definition passed: Runtime, Human Design, Financial and Integrated service families are structurally frozen.'
);
console.log(
  '  Prices, intake, sensitive uploads, calculations, Workspace, reports, checkout, regulated advice and D1 changes remain inactive.'
);
console.log(
  '  Next required gate: M4A-W3 Consent and Sharing, followed by M4A-W7 Professional Data and Privacy.'
);
