import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const base = 'content/customer-experience-rebuild';
const BASELINE = 'f6d31dafdc37dcf3d8f2ebd1236bfa500b7dc64c';
const RECORDED_AT = '2026-09-03T03:18:00Z';
const checkMode = process.argv.includes('--check');

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const stable = (value) => JSON.stringify(value, null, 2) + '\n';
const mkdir = (rel) => fs.mkdirSync(path.join(root, rel), { recursive: true });
function write(rel, value) {
  const abs = path.join(root, rel);
  const text = stable(value);
  mkdir(path.dirname(rel));
  if (checkMode) {
    if (!fs.existsSync(abs)) throw new Error(`Missing generated CX-R2 successor artifact: ${rel}`);
    if (fs.readFileSync(abs, 'utf8') !== text) throw new Error(`Generated CX-R2 successor artifact is stale: ${rel}`);
  } else {
    fs.writeFileSync(abs, text);
  }
}

const r1aRoutes = readJson(`${base}/authority/canonical-customer-route-registry-v2.json`);
const projectionMap = readJson(`${base}/registries/backend-customer-projection-map-v3.json`);
if (r1aRoutes.baselineCommit !== BASELINE) throw new Error('CX-R2 requires current CX-R1A reconciliation at f6d31da.');
if (projectionMap.baselineCommit !== BASELINE) throw new Error('CX-R2 requires current backend-customer projection reconciliation at f6d31da.');
if (r1aRoutes.rules.canonicalAsk !== '/knowledge/ask/') throw new Error('CX-R2 requires /knowledge/ask/ as the prepared Ask authority.');

const spine = {
  schemaVersion: 'PHI-OS-CX-CUSTOMER-EXPERIENCE-SPINE-v2.0.0',
  work: 'CX-R2-W0',
  baselineCommit: BASELINE,
  recordedAt: RECORDED_AT,
  status: 'CUSTOMER_MAIN_CHAIN_FROZEN',
  canonicalSequence: [
    'UNDERSTAND',
    'ESTABLISH',
    'READ',
    'NAVIGATE',
    'ACT',
    'OBSERVE',
    'REVIEW',
    'CONTINUE'
  ],
  customerDisplaySequence: [
    'Understand',
    'Read',
    'Choose',
    'Act',
    'Observe',
    'Review',
    'Continue'
  ],
  steps: [
    { step: 'UNDERSTAND', customerMeaning: 'Understand what you are trying to work through before choosing a product or method.' },
    { step: 'ESTABLISH', customerMeaning: 'Establish the relevant current situation, known facts, constraints and open questions.' },
    { step: 'READ', customerMeaning: 'Read governed knowledge, perspectives and findings without collapsing their source classes.' },
    { step: 'NAVIGATE', customerMeaning: 'See possible directions, trade-offs, dependencies and what may be useful next.' },
    { step: 'ACT', customerMeaning: 'Turn a chosen direction into an explicit real-world action owned by the customer or professional.' },
    { step: 'OBSERVE', customerMeaning: 'Observe what actually happened and what new evidence appeared.' },
    { step: 'REVIEW', customerMeaning: 'Review what changed, what remained and which assumptions still hold.' },
    { step: 'CONTINUE', customerMeaning: 'Continue with updated context rather than restarting from zero.' }
  ],
  compressionRule: {
    internalEstablishMayAppearInsideCustomerUnderstandOrRealityIntake: true,
    internalNavigateMayBePresentedAsCustomerChoose: true,
    customerDisplayMayUseSevenSteps: true,
    internalCanonicalSequenceMustRemainEightSteps: true
  },
  rules: {
    productCatalogIsNotTheCustomerSpine: true,
    backendRuntimeCodesHiddenByDefault: true,
    backendAuthorityCreatedByCx: false,
    continuityIsAContinuationStateNotASeparateAuthority: true
  }
};
write(`${base}/registries/customer-experience-spine-v2.json`, spine);

const intentModel = {
  schemaVersion: 'PHI-OS-CX-CUSTOMER-INTENT-MODEL-v1.0.0',
  work: 'CX-R2-W1',
  baselineCommit: BASELINE,
  recordedAt: RECORDED_AT,
  status: 'PRIMARY_CUSTOMER_INTENTS_FROZEN',
  principle: 'ENTRY_BY_CUSTOMER_INTENT_NOT_PRODUCT_CATALOG',
  primaryIntents: [
    {
      intentId: 'QUESTION',
      customerLanguage: 'I have a question',
      primaryRouteId: 'ASK',
      canonicalPath: '/knowledge/ask/',
      handoff: 'CONTEXTUAL_ASK',
      availabilityRule: 'ROUTE_MAY_EXIST_BEFORE_CONTEXT_CAPABILITY; CONTEXT AVAILABILITY REMAINS UPSTREAM_CONTROLLED'
    },
    {
      intentId: 'PERSPECTIVE',
      customerLanguage: 'I want another perspective',
      primaryRouteId: 'PERSPECTIVES',
      canonicalPath: '/perspectives/',
      handoff: 'PERSPECTIVE_SELECTION',
      availabilityRule: 'METHOD_AND_INSTRUMENT_AVAILABILITY_READS_MPA_OR_PRODUCT_AUTHORITY'
    },
    {
      intentId: 'REALITY_WORK',
      customerLanguage: 'I need to work through something real',
      primaryRouteId: 'MY_REALITY',
      canonicalPath: '/reality/',
      handoff: 'MY_REALITY_WORKSPACE',
      availabilityRule: 'CURRENT_REALITY_AND_RUNTIME_CAPABILITY_REMAIN_UPSTREAM_CONTROLLED'
    }
  ],
  rules: {
    onePrimaryDestinationPerIntent: true,
    productGridAsPrimaryEntryForbidden: true,
    methodGridAsPrimaryEntryForbidden: true,
    cxMayInventNewIntentAuthority: false
  }
};
write(`${base}/registries/customer-intent-model-v1.json`, intentModel);

const ia = {
  schemaVersion: 'PHI-OS-CX-CUSTOMER-INFORMATION-ARCHITECTURE-v1.0.0',
  work: ['CX-R2-W2', 'CX-R2-W3', 'CX-R2-W4', 'CX-R2-W5', 'CX-R2-W6', 'CX-R2-W7', 'CX-R2-W8'],
  baselineCommit: BASELINE,
  recordedAt: RECORDED_AT,
  status: 'GLOBAL_IA_FROZEN_PRE_CUTOVER',
  primaryNavigation: ['EXPLORE', 'MY_REALITY', 'PERSPECTIVES', 'KNOWLEDGE', 'PROFESSIONAL'],
  utilities: ['SEARCH', 'ASK', 'ACCOUNT', 'LOCALE'],
  forbiddenTopLevel: ['REALITY_JOURNEY', 'READINGS', 'SERVICES', 'ACADEMY', 'REPORTS', 'FINANCIAL', 'BOOKS'],
  domains: {
    EXPLORE: {
      label: 'Explore',
      canonicalPath: '/explore/',
      items: [
        { itemId: 'WHAT_IS_PHI_OS', label: 'What is PHI OS', routeId: 'EXPLORE_WHY' },
        { itemId: 'HOW_IT_WORKS', label: 'How it works', routeId: 'EXPLORE_HOW' },
        { itemId: 'START_HERE', label: 'Start here', routeId: 'EXPLORE_START' },
        { itemId: 'FIVE_BOOKS', label: 'Five Books', routeId: 'BOOKS' },
        { itemId: 'ARTICLES', label: 'Articles', routeId: 'ARTICLES' },
        { itemId: 'ABOUT', label: 'About', routeId: 'ABOUT' }
      ]
    },
    MY_REALITY: {
      label: 'My Reality',
      canonicalPath: '/reality/',
      items: [
        { itemId: 'OVERVIEW', label: 'Overview', routeId: 'MY_REALITY' },
        { itemId: 'CURRENT_REALITY', label: 'Current Reality', routeId: 'REALITY_CURRENT' },
        { itemId: 'PERSPECTIVES', label: 'Perspectives', routeId: 'REALITY_PERSPECTIVES' },
        { itemId: 'NAVIGATION', label: 'Navigation', routeId: 'REALITY_NAVIGATION' },
        { itemId: 'ACTIONS', label: 'Actions', routeId: 'REALITY_ACTIONS' },
        { itemId: 'REVIEW', label: 'Review', routeId: 'REALITY_REVIEW' },
        { itemId: 'HISTORY', label: 'History', routeId: 'REALITY_HISTORY', state: 'FUTURE_GATED', futureDependency: 'LRM' },
        { itemId: 'REPORTS', label: 'Reports', routeId: 'REPORTS' }
      ]
    },
    PERSPECTIVES: {
      label: 'Perspectives',
      canonicalPath: '/perspectives/',
      availabilityAuthority: 'MPA_OR_PRODUCT_AUTHORITY',
      items: [
        { itemId: 'PERSONAL_REALITY', label: 'Personal Reality', routeId: 'PERSONAL_REALITY', availability: 'UPSTREAM_CONTROLLED' },
        { itemId: 'RELATIONSHIP', label: 'Relationship', routeId: 'RELATIONSHIP', availability: 'UPSTREAM_CONTROLLED' },
        { itemId: 'CURRENT_CONTEXT', label: 'Current Context', routeId: 'CURRENT_CONTEXT', availability: 'UPSTREAM_CONTROLLED' },
        { itemId: 'ASTROLOGY', label: 'Astrology', routeId: 'ASTROLOGY', availability: 'UPSTREAM_CONTROLLED' },
        { itemId: 'BAZI', label: 'BaZi', routeId: 'BAZI', availability: 'UPSTREAM_CONTROLLED' },
        { itemId: 'ZI_WEI', label: 'Zi Wei', routeId: 'ZI_WEI', availability: 'UPSTREAM_CONTROLLED' },
        { itemId: 'HUMAN_DESIGN', label: 'Human Design', routeId: 'HUMAN_DESIGN', availability: 'UPSTREAM_CONTROLLED' },
        { itemId: 'NUMEROLOGY', label: 'Numerology', routeId: 'NUMEROLOGY', availability: 'UPSTREAM_CONTROLLED' },
        { itemId: 'I_CHING', label: 'I Ching', routeId: 'I_CHING', availability: 'UPSTREAM_CONTROLLED' },
        { itemId: 'TAROT', label: 'Tarot', routeId: 'TAROT', availability: 'UPSTREAM_CONTROLLED' }
      ],
      successorReservedItems: [
        { itemId: 'PROFILE_ASSESSMENT', label: 'Profile & Assessment', routeId: 'PROFILE', ownerPhase: 'CX-R11', state: 'RESERVED_NOT_R2_ACTIVATED', availability: 'UPSTREAM_CONTROLLED' }
      ]
    },
    KNOWLEDGE: {
      label: 'Knowledge',
      canonicalPath: '/knowledge/',
      items: [
        { itemId: 'ASK', label: 'Ask PHI OS', routeId: 'ASK' },
        { itemId: 'SEARCH', label: 'Search', routeId: 'SEARCH' },
        { itemId: 'ARTICLES', label: 'Articles', routeId: 'ARTICLES' },
        { itemId: 'FIVE_BOOKS', label: 'Five Books', routeId: 'BOOKS' },
        { itemId: 'FIGURES', label: 'Figures', routeId: 'FIGURES' },
        { itemId: 'CONCEPTS', label: 'Concepts / Glossary', routeId: 'CONCEPTS' },
        { itemId: 'ACADEMY', label: 'Academy', routeId: 'ACADEMY' }
      ]
    },
    PROFESSIONAL: {
      label: 'Professional',
      canonicalPath: '/professional/',
      items: [
        { itemId: 'FINANCIAL_REALITY', label: 'Financial Reality', routeId: 'FINANCIAL_REALITY' },
        { itemId: 'PROFESSIONAL_REVIEW', label: 'Professional Review', routeId: 'PROFESSIONAL_REVIEW' },
        { itemId: 'REPORTS', label: 'Reports', routeId: 'REPORTS' },
        { itemId: 'SERVICES', label: 'Services', routeId: 'SERVICES' },
        { itemId: 'APPOINTMENTS', label: 'Appointments', routeId: 'APPOINTMENTS' }
      ]
    },
    ACCOUNT: {
      label: 'Account',
      canonicalPath: '/account/',
      sections: [
        { sectionId: 'CONTINUE', label: 'Continue' },
        { sectionId: 'MY_REALITY', label: 'My Reality' },
        { sectionId: 'RECENT_PERSPECTIVES', label: 'Recent Perspectives' },
        { sectionId: 'REPORTS', label: 'Reports' },
        { sectionId: 'SAVED_KNOWLEDGE', label: 'Saved Knowledge' },
        { sectionId: 'SETTINGS', label: 'Settings' }
      ],
      futureLrmSections: [
        { sectionId: 'HISTORY', label: 'History', state: 'FUTURE_GATED', futureDependency: 'LRM' },
        { sectionId: 'OBSERVATIONS', label: 'Observations', state: 'FUTURE_GATED', futureDependency: 'LRM' },
        { sectionId: 'OUTCOMES', label: 'Outcomes', state: 'FUTURE_GATED', futureDependency: 'LRM' },
        { sectionId: 'CONTINUITY', label: 'Continuity', state: 'FUTURE_GATED', futureDependency: 'LRM' }
      ]
    }
  },
  rules: {
    oneGlobalIa: true,
    firstLevelProductCatalogForbidden: true,
    journeyFirstNavigationForbidden: true,
    availabilityMayNotBeHardCodedByCx: true,
    topLevelBooksForbidden: true,
    topLevelAcademyForbidden: true,
    topLevelReportsForbidden: true,
    topLevelFinancialForbidden: true,
    routeCutoverPerformedByR2: false
  }
};
write(`${base}/authority/customer-information-architecture-v1.json`, ia);

const routeRows = [
  ['HOME', '/', '/', 'ROOT', 'PRIMARY_OR_ROOT', 'CX-R6', 'PRESENT_PATH_NOT_R2_REBUILT'],
  ['EXPLORE', '/explore/', '/explore', 'EXPLORE', 'PRIMARY', 'CX-R7', 'TARGET_DECLARED_PREDECESSOR_PATH_EXISTS'],
  ['EXPLORE_WHY', '/explore/why-phios/', '/about/why-phios/', 'EXPLORE', 'SECONDARY', 'CX-R7', 'TARGET_DECLARED_PREDECESSOR_PATH_EXISTS'],
  ['EXPLORE_HOW', '/explore/how-it-works/', null, 'EXPLORE', 'SECONDARY', 'CX-R7', 'TARGET_DECLARED_NOT_BUILT'],
  ['EXPLORE_START', '/explore/start/', null, 'EXPLORE', 'SECONDARY', 'CX-R7', 'TARGET_DECLARED_NOT_BUILT'],
  ['ABOUT', '/about/', null, 'EXPLORE', 'SECONDARY', 'CX-R7', 'TARGET_DECLARED_NOT_BUILT'],
  ['MY_REALITY', '/reality/', '/reality/', 'MY_REALITY', 'PRIMARY', 'CX-R10', 'PRESENT_PATH_NOT_R2_REBUILT'],
  ['REALITY_CURRENT', '/reality/current/', null, 'MY_REALITY', 'SECONDARY', 'CX-R10', 'TARGET_DECLARED_NOT_BUILT'],
  ['REALITY_PERSPECTIVES', '/reality/perspectives/', null, 'MY_REALITY', 'SECONDARY', 'CX-R10', 'TARGET_DECLARED_NOT_BUILT'],
  ['REALITY_NAVIGATION', '/reality/navigation/', null, 'MY_REALITY', 'SECONDARY', 'CX-R10', 'TARGET_DECLARED_NOT_BUILT'],
  ['REALITY_ACTIONS', '/reality/actions/', null, 'MY_REALITY', 'SECONDARY', 'CX-R10', 'TARGET_DECLARED_NOT_BUILT'],
  ['REALITY_REVIEW', '/reality/review/', null, 'MY_REALITY', 'SECONDARY', 'CX-R10', 'TARGET_DECLARED_NOT_BUILT'],
  ['REALITY_HISTORY', '/reality/history/', null, 'MY_REALITY', 'FUTURE_GATED', 'CX-R10', 'FUTURE_LRM_GATED'],
  ['PERSPECTIVES', '/perspectives/', '/perspectives/', 'PERSPECTIVES', 'PRIMARY', 'CX-R11', 'PRESENT_PATH_NOT_R2_REBUILT'],
  ['PERSONAL_REALITY', '/perspectives/personal/', '/perspectives/personal/', 'PERSPECTIVES', 'SECONDARY', 'CX-R12', 'PRESENT_PATH_NOT_R2_REBUILT'],
  ['RELATIONSHIP', '/perspectives/relationship/', null, 'PERSPECTIVES', 'SECONDARY', 'CX-R11', 'TARGET_DECLARED_NOT_BUILT'],
  ['PROFILE', '/perspectives/profile/', '/perspectives/profile/', 'PERSPECTIVES', 'RESERVED_SUCCESSOR', 'CX-R11', 'RESERVED_NOT_R2_ACTIVATED'],
  ['CURRENT_CONTEXT', '/perspectives/current-context/', null, 'PERSPECTIVES', 'SECONDARY', 'CX-R11', 'TARGET_DECLARED_NOT_BUILT'],
  ['ASTROLOGY', '/perspectives/astrology/', null, 'PERSPECTIVES', 'SECONDARY', 'CX-R11', 'TARGET_DECLARED_NOT_BUILT'],
  ['BAZI', '/perspectives/bazi/', null, 'PERSPECTIVES', 'SECONDARY', 'CX-R11', 'TARGET_DECLARED_NOT_BUILT'],
  ['ZI_WEI', '/perspectives/zi-wei/', null, 'PERSPECTIVES', 'SECONDARY', 'CX-R11', 'TARGET_DECLARED_NOT_BUILT'],
  ['HUMAN_DESIGN', '/perspectives/human-design/', null, 'PERSPECTIVES', 'SECONDARY', 'CX-R11', 'TARGET_DECLARED_NOT_BUILT'],
  ['NUMEROLOGY', '/perspectives/numerology/', null, 'PERSPECTIVES', 'SECONDARY', 'CX-R11', 'TARGET_DECLARED_NOT_BUILT'],
  ['I_CHING', '/perspectives/i-ching/', '/perspectives/iching/', 'PERSPECTIVES', 'SECONDARY', 'CX-R11', 'TARGET_DECLARED_PREDECESSOR_PATH_EXISTS'],
  ['TAROT', '/perspectives/tarot/', '/perspectives/tarot/', 'PERSPECTIVES', 'SECONDARY', 'CX-R11', 'PRESENT_PATH_NOT_R2_REBUILT'],
  ['KNOWLEDGE', '/knowledge/', '/library', 'KNOWLEDGE', 'PRIMARY', 'CX-R8', 'TARGET_DECLARED_PREDECESSOR_PATH_EXISTS'],
  ['ASK', '/knowledge/ask/', '/ask', 'KNOWLEDGE', 'UTILITY_AND_SECONDARY', 'CX-R9-R2', 'TARGET_DECLARED_PREDECESSOR_PATH_EXISTS'],
  ['SEARCH', '/knowledge/search/', '/search/', 'KNOWLEDGE', 'UTILITY_AND_SECONDARY', 'CX-R8', 'TARGET_DECLARED_PREDECESSOR_PATH_EXISTS'],
  ['ARTICLES', '/knowledge/articles/', '/articles', 'KNOWLEDGE', 'SECONDARY', 'CX-R8', 'TARGET_DECLARED_PREDECESSOR_PATH_EXISTS'],
  ['BOOKS', '/knowledge/books/', '/books/', 'KNOWLEDGE', 'SECONDARY', 'CX-R8', 'TARGET_DECLARED_PREDECESSOR_PATH_EXISTS'],
  ['FIGURES', '/knowledge/figures/', '/figures', 'KNOWLEDGE', 'SECONDARY', 'CX-R8', 'TARGET_DECLARED_PREDECESSOR_PATH_EXISTS'],
  ['CONCEPTS', '/knowledge/concepts/', '/glossary', 'KNOWLEDGE', 'SECONDARY', 'CX-R8', 'TARGET_DECLARED_PREDECESSOR_PATH_EXISTS'],
  ['ACADEMY', '/knowledge/learn/', '/academy', 'KNOWLEDGE', 'SECONDARY', 'CX-R16', 'TARGET_DECLARED_PREDECESSOR_PATH_EXISTS'],
  ['PROFESSIONAL', '/professional/', '/professional/', 'PROFESSIONAL', 'PRIMARY', 'CX-R14', 'PRESENT_PATH_NOT_R2_REBUILT'],
  ['FINANCIAL_REALITY', '/professional/financial/', '/professional/financial/', 'PROFESSIONAL', 'SECONDARY', 'CX-R13', 'PRESENT_PATH_NOT_R2_REBUILT'],
  ['PROFESSIONAL_REVIEW', '/professional/review/', null, 'PROFESSIONAL', 'SECONDARY', 'CX-R14', 'TARGET_DECLARED_NOT_BUILT'],
  ['REPORTS', '/professional/reports/', '/professional-reports', 'PROFESSIONAL', 'SECONDARY', 'CX-R14', 'TARGET_DECLARED_PREDECESSOR_PATH_EXISTS'],
  ['SERVICES', '/professional/services/', '/services', 'PROFESSIONAL', 'SECONDARY', 'CX-R14', 'TARGET_DECLARED_PREDECESSOR_PATH_EXISTS'],
  ['APPOINTMENTS', '/professional/appointments/', '/professional-appointments', 'PROFESSIONAL', 'SECONDARY', 'CX-R14', 'TARGET_DECLARED_PREDECESSOR_PATH_EXISTS'],
  ['ACCOUNT', '/account/', '/account', 'ACCOUNT', 'UTILITY', 'CX-R15', 'TARGET_DECLARED_PREDECESSOR_PATH_EXISTS']
];
const routes = routeRows.map(([routeId, canonicalPath, currentOperationalPath, domain, navigationRole, ownerPhase, routeState]) => ({
  routeId,
  canonicalPath,
  currentOperationalPath,
  domain,
  navigationRole,
  ownerPhase,
  routeState,
  successorPresentationAccepted: false,
  routeCutoverPerformedByR2: false
}));

const inheritedAliases = r1aRoutes.legacyAliases.map((alias) => ({ ...alias, source: 'CX-R1A_PREPARATION', activation: 'PLANNED_COMPATIBILITY_NOT_R2_CUTOVER' }));
const r2Aliases = [
  ['/explore', 'EXPLORE', '/explore/'],
  ['/perspectives/iching/', 'I_CHING', '/perspectives/i-ching/'],
  ['/library', 'KNOWLEDGE', '/knowledge/'],
  ['/library.html', 'KNOWLEDGE', '/knowledge/'],
  ['/search', 'SEARCH', '/knowledge/search/'],
  ['/search/', 'SEARCH', '/knowledge/search/'],
  ['/articles', 'ARTICLES', '/knowledge/articles/'],
  ['/articles.html', 'ARTICLES', '/knowledge/articles/'],
  ['/figures', 'FIGURES', '/knowledge/figures/'],
  ['/figures.html', 'FIGURES', '/knowledge/figures/'],
  ['/glossary', 'CONCEPTS', '/knowledge/concepts/'],
  ['/glossary.html', 'CONCEPTS', '/knowledge/concepts/'],
  ['/academy', 'ACADEMY', '/knowledge/learn/'],
  ['/academy.html', 'ACADEMY', '/knowledge/learn/'],
  ['/services', 'SERVICES', '/professional/services/'],
  ['/services.html', 'SERVICES', '/professional/services/'],
  ['/professional-reports', 'REPORTS', '/professional/reports/'],
  ['/professional-reports.html', 'REPORTS', '/professional/reports/'],
  ['/professional-appointments', 'APPOINTMENTS', '/professional/appointments/'],
  ['/professional-appointments.html', 'APPOINTMENTS', '/professional/appointments/'],
  ['/account', 'ACCOUNT', '/account/'],
  ['/account.html', 'ACCOUNT', '/account/']
].map(([aliasPath, canonicalRouteId, destination]) => ({
  path: aliasPath,
  canonicalRouteId,
  destination,
  redirectStatus: 308,
  source: 'CX-R2_ROUTE_AUTHORITY',
  activation: 'PLANNED_COMPATIBILITY_NOT_R2_CUTOVER'
}));

const aliasMap = new Map();
for (const alias of [...inheritedAliases, ...r2Aliases]) aliasMap.set(`${alias.path}|${alias.canonicalRouteId}`, alias);

const routeRegistry = {
  schemaVersion: 'PHI-OS-CX-CANONICAL-CUSTOMER-ROUTE-REGISTRY-v3.0.0',
  work: 'CX-R2-W2-W10',
  baselineCommit: BASELINE,
  recordedAt: RECORDED_AT,
  status: 'CUSTOMER_ROUTE_AUTHORITY_FROZEN_PRE_CUTOVER',
  predecessorInputs: [
    `${base}/authority/canonical-customer-route-registry-v2.json`,
    `${base}/migration/hard-cutover-preparation-v2.json`
  ],
  primaryNavigation: ia.primaryNavigation,
  utilities: ia.utilities,
  authorityBoundary: {
    createsBackendAuthority: false,
    presentationRoutingOnly: true,
    routeAuthorityMayPrecedeSurfaceImplementation: true,
    oneCanonicalPathPerRouteId: true,
    routeCutoverPerformed: false,
    redirectsMutatedByR2: false,
    physicalLegacyDeletePerformed: false
  },
  routes,
  compatibilityAliases: [...aliasMap.values()].sort((a, b) => a.path.localeCompare(b.path)),
  rules: {
    canonicalAsk: '/knowledge/ask/',
    realityJourneyTopLevelForbidden: true,
    readingsTopLevelForbidden: true,
    servicesTopLevelForbidden: true,
    academyTopLevelForbidden: true,
    reportsTopLevelForbidden: true,
    financialTopLevelForbidden: true,
    booksTopLevelForbidden: true,
    doNotCutOverBeforeReplacementAcceptance: true,
    doNotDeleteLegacyBeforeProductionBrowserAcceptance: true,
    routeTargetDoesNotImplyCapabilityAvailable: true
  }
};
write(`${base}/authority/canonical-customer-route-registry-v3.json`, routeRegistry);

const journey = {
  schemaVersion: 'PHI-OS-CX-REALITY-JOURNEY-DEPROMOTION-CONTRACT-v1.0.0',
  work: 'CX-R2-W9',
  baselineCommit: BASELINE,
  recordedAt: RECORDED_AT,
  status: 'REALITY_JOURNEY_DEMOTED',
  customerPosition: 'WORKSPACE_PROGRESSION_NOT_FIRST_LEVEL_PRODUCT',
  jrCustomerProjectionRoles: ['WORKSPACE_PROGRESS', 'STAGE', 'CONTINUATION', 'HANDOFF'],
  compatibility: {
    currentRouteMayRemainTemporarily: true,
    knownCompatibilityPath: '/reality-journey',
    topNavigationAllowed: false,
    primaryHomepageProductAllowed: false,
    newStandaloneProductAuthorityAllowed: false
  },
  rules: {
    jrBackendAuthorityUntouched: true,
    cxMayRecalculateJourney: false,
    journeyFirstCompositionForbidden: true,
    journeyMayBeMigratedIntoMyRealityWorkspaceByCxR10: true,
    physicalLegacyDeletePerformedByR2: false
  }
};
write(`${base}/contracts/reality-journey-depromotion-contract-v1.json`, journey);

const surfaces = [
  ['HOME', '/', 'Orient the customer and offer the three primary ways to begin.', [], 'PUBLIC', 'START_WITH_MY_REALITY', 'ASK_PHI_OS', []],
  ['EXPLORE', '/explore/', 'Explain PHI OS, how it works and where to begin.', ['KNOWLEDGE'], 'PUBLIC', 'START_HERE', 'OPEN_KNOWLEDGE', []],
  ['MY_REALITY', '/reality/', 'Work through a current real situation in one continuing workspace.', ['ICR', 'RDG', 'RMO', 'RRE', 'JR', 'RNE', 'RR'], 'MIXED', 'CONTINUE_MY_REALITY', 'REVIEW_CURRENT_REALITY', ['LRM_FUTURE']],
  ['PERSPECTIVES', '/perspectives/', 'Choose a governed perspective without implying equal evidence status or availability.', ['MPA', 'METHOD_RUNTIMES', 'CMR'], 'PUBLIC', 'CHOOSE_A_PERSPECTIVE', 'RETURN_TO_MY_REALITY', []],
  ['PERSONAL_REALITY', '/perspectives/personal/', 'Use governed personal reading outputs inside the shared customer system.', ['MPA', 'METHOD_RUNTIMES', 'CMR', 'RRE'], 'MIXED', 'OPEN_PERSONAL_READING', 'ASK_ABOUT_THIS_READING', []],
  ['RELATIONSHIP', '/perspectives/relationship/', 'Use governed relationship outputs with explicit participant and case scope.', ['RELATIONSHIP_PRODUCT_AUTHORITY'], 'MIXED', 'OPEN_RELATIONSHIP', 'ASK_ABOUT_THIS_RELATIONSHIP', []],
  ['PROFILE_ASSESSMENT', '/perspectives/profile/', 'Host profile and assessment context when the successor product authority is ready.', ['PROFILE_PRODUCT_AUTHORITY'], 'MIXED', 'OPEN_PROFILE', 'COMPARE_WITH_CURRENT_REALITY', ['CX-R11_PRODUCT_AUTHORITY']],
  ['KNOWLEDGE', '/knowledge/', 'Search, read and navigate governed PHI OS knowledge.', ['CKA', 'KAP', 'KNOWLEDGE_RUNTIME'], 'PUBLIC', 'SEARCH_KNOWLEDGE', 'ASK_PHI_OS', []],
  ['ASK', '/knowledge/ask/', 'Ask one contextual question with explicit source/context selection.', ['CKA', 'KAP', 'CURRENT_FACTS_GATEWAY'], 'PUBLIC', 'ASK_QUESTION', 'CHOOSE_CONTEXT', ['CX-R9-R2_REPLACEMENT_ACCEPTANCE']],
  ['SEARCH', '/knowledge/search/', 'Search governed knowledge without creating a second knowledge authority.', ['KNOWLEDGE_RUNTIME'], 'PUBLIC', 'SEARCH', 'OPEN_KNOWLEDGE_HOME', []],
  ['FINANCIAL_REALITY', '/professional/financial/', 'Project governed financial runtime outputs for customer and professional review.', ['FINANCIAL_RUNTIMES', 'PFR'], 'MIXED', 'OPEN_FINANCIAL_REALITY', 'PROFESSIONAL_REVIEW', []],
  ['PROFESSIONAL', '/professional/', 'Enter the professional layer for review, services, reports and appointments.', ['PR', 'PFR', 'RR'], 'PUBLIC', 'VIEW_PROFESSIONAL_OPTIONS', 'OPEN_REPORTS', []],
  ['REPORT', '/professional/reports/', 'Access governed reports without letting the CX layer assemble a canonical report.', ['RR'], 'ACCOUNT', 'OPEN_REPORT', 'RETURN_TO_MY_REALITY', []],
  ['ACCOUNT', '/account/', 'Resume work, access recent perspectives and reports, and manage settings.', ['ACCOUNT'], 'ACCOUNT', 'CONTINUE', 'OPEN_SETTINGS', ['LRM_FUTURE']],
  ['ACADEMY', '/knowledge/learn/', 'Access learning as part of Knowledge rather than a first-level platform kingdom.', ['KNOWLEDGE_RUNTIME'], 'PUBLIC', 'START_LEARNING', 'OPEN_KNOWLEDGE_HOME', []]
].map(([surfaceId, route, customerPurpose, runtimeConsumers, authRequirement, primaryAction, secondaryAction, futureDependencies]) => ({
  surfaceId,
  route,
  customerPurpose,
  runtimeConsumers,
  authRequirement,
  primaryAction,
  secondaryAction,
  futureDependencies,
  namespace: 'cx-',
  shellAuthority: 'ONE_GLOBAL_CUSTOMER_SHELL_TARGET',
  availabilityAuthority: 'UPSTREAM_AUTHORITY_OR_ROUTE_STATE',
  availabilityHardCodedByCx: false,
  successorAuthorityState: 'R2_ROUTE_AND_PURPOSE_FROZEN_PRESENTATION_NOT_ACTIVATED_BY_R2'
}));

const surfaceRegistry = {
  schemaVersion: 'PHI-OS-CX-CUSTOMER-SURFACE-REGISTRY-v3.0.0',
  work: 'CX-R2-W10',
  baselineCommit: BASELINE,
  recordedAt: RECORDED_AT,
  status: 'CUSTOMER_SURFACE_AUTHORITY_FROZEN_PRE_PRESENTATION_CUTOVER',
  surfaceCount: surfaces.length,
  surfaces,
  rules: {
    oneSurfaceIdOneRoute: true,
    methodSpecificGlobalShellAllowed: false,
    duplicateCustomerNavigationAllowed: false,
    routeDeclarationImpliesAvailability: false,
    r2ActivatesPresentation: false,
    r2PerformsRouteCutover: false
  }
};
write(`${base}/registries/customer-surface-registry-v3.json`, surfaceRegistry);

const acceptance = {
  schemaVersion: 'PHI-OS-CX-R2-ACCEPTANCE-v2.0.0',
  work: 'CX-R2-W11',
  baselineCommit: BASELINE,
  recordedAt: RECORDED_AT,
  status: 'ACCEPTED_CUSTOMER_IA_AND_ROUTE_AUTHORITY',
  requiredExitStates: ['CUSTOMER_MAIN_CHAIN_FROZEN', 'GLOBAL_IA_FROZEN', 'REALITY_JOURNEY_DEMOTED'],
  evidence: [
    `${base}/registries/customer-experience-spine-v2.json`,
    `${base}/registries/customer-intent-model-v1.json`,
    `${base}/authority/customer-information-architecture-v1.json`,
    `${base}/authority/canonical-customer-route-registry-v3.json`,
    `${base}/contracts/reality-journey-depromotion-contract-v1.json`,
    `${base}/registries/customer-surface-registry-v3.json`
  ],
  rules: {
    backendAuthorityTouched: false,
    productionRouteCutoverPerformed: false,
    legacyPhysicalDeletePerformed: false,
    newCustomerDesignSystemCreated: false,
    canonicalAskAuthority: '/knowledge/ask/',
    hardCodedMethodAvailability: false,
    readyForCxR3: true
  }
};
write(`${base}/acceptance/cx-r2-acceptance-v2.json`, acceptance);

if (checkMode) {
  console.log('✓ CX-R2 successor artifacts are current for baseline f6d31da.');
} else {
  console.log(`Generated CX-R2 successor authority: ${routeRegistry.routes.length} canonical route targets, ${surfaceRegistry.surfaceCount} customer surfaces, ${spine.canonicalSequence.length}-step internal spine.`);
}
