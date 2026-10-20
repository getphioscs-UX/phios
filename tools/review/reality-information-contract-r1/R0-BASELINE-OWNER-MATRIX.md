# R0 baseline and owner matrix

HEAD `c05f2acc9f73f3de650765e44e36c6e3c0973d47`; initial index/worktree clean. Remote main read separately matched. No applicable AGENTS.md found. Governance priority: content/registry/master-governance.json. Production flags, accounts and deployments NOT_EXERCISED.

| Owner path | Functions | Status | Evidence |
|---|---|---|---|
| content/registry/master-governance.json |  | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| about/founder/index.html |  | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| assets/js/pages/civilization-atlas/world-experience-r2.js |  | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| assets/js/pages/civilization-atlas/world-reading-context.js | activeWorldObject / worldObjectRelations / worldAskContext / askURL / sameObjectDirection | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/api/world-observations.js | onRequestGet | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/_lib/world-bank-observations.js | observationRequest / readWorldBankObservation | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/_lib/world-evidence.js | evidenceRequest / observationQuality / calculateHmda / readWorldEvidence | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/api/account-world-contexts.js | onRequest | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/api/customer-contextual-ask.js | onRequestGet / onRequestPost | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/_lib/knowledge-answer-grounding.js | evaluateKapQuestionSourceRelevance / createKapQuestionIntake / normalizeKapQuestion / buildKapRetrievalRequest / retrievePublishedBookSources | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/_lib/knowledge-source-eligibility.js | publicSourceUrl / customerText / customerSourceLabel / stateAllowsSource / manuscriptSourceAllowed | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/current-facts-gateway/current-facts-gateway.js | classifyCurrentFactNeed / retrieveCurrentFacts | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/api/customer-my-reality.js | onRequestGet / onRequestPost | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/api/customer-current-reality.js | onRequestPost / onRequestGet | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/api/current-reality/personal-current-reality-runtime.js | normalizePersonalCurrentRealityInput / canonicalizeCurrentRealityObservations / buildRealityComparisonCandidates / buildRealityComparisons / buildMethodCurrentRealityCorrelation | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/customer-projection/reality-customer-projection.js | projectRealityForCustomer | PARTIAL / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/customer-projection/my-reality-workspace-projection.js | projectMyRealityWorkspace | PARTIAL / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/customer-projection/reality-navigation-graph-projection.js | projectRealityNavigationGraph / assertRealityNavigationGraph | PARTIAL / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/customer-projection/pc-r1-reality-successor.js | createWorldEvidenceGateway / contextualWorldRelevance / newRealityCandidateStore / saveSelectedReality / reviewRealityRecord | PARTIAL / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/_lib/knowledge-reality-handoff.js | buildEscalationReason / evaluateRealityHandoffConsent / projectKnowledgeGroundingForHandoff / buildRealityEntrySeed / prepareRealityJourneyHandoff | PARTIAL / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/api/reality-handoff.js | onRequestPost / onRequestGet | PARTIAL / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/api/customer-reality-handoff.js | buildEcrHumanDesignRealityBridgeReportedContext / onRequestPost / onRequestGet | PARTIAL / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/customer-projection/continuity-customer-projection.js | projectContinuityForCustomer | PARTIAL / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/account/my-reality-saved-sources.js | collectMyRealitySavedSources | PARTIAL / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/_lib/structured-reality-candidates.js | resolveStructuredRealityCandidates | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/api/customer-financial-reality.js | onRequestPost / onRequestGet | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/professional/financial/pc-r1-current-reality.js | freshness / marketProviderRegistry / consumeMarketEvidence / portfolioReality / portfolioExposure | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/customer-projection/navigation-customer-projection.js | projectNavigationForCustomer | PARTIAL / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/current-web-authority/current-authority-conflict.js |  | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/current-web-authority/current-evidence-ir.js |  | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/current-web-authority/current-source-admission.js |  | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/current-web-authority/current-source-discovery.js |  | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |
| functions/current-web-authority/current-web-authority-runtime.js | discoverCurrentSourceCandidates / normalizeCurrentSourceCandidate / evaluateCurrentness / admitCurrentSource / createCurrentEvidence | EXISTING / VERIFIED source only | R0-FILE-SHA-MANIFEST.json |

Recursive imports, D1 references, schema and flag locators are recorded in the SHA manifest. Existing schema namespaces are not interchangeable: CX projections, PC-R1 successor, KAP handoff, current-evidence IR and Graph v1/v2 are separate. RIC v1 is an independent reference envelope, not a successor authority.

Graph G1 is limited sourced self-report/external references; G2 NOT_ESTABLISHED; G3 NO_VERIFIED_HISTORY. Reality customer string lanes lose per-item provenance; only explicitly sourced items can be adapted. Existing account-world-contexts writes are gated local/QA/preview and require consent+retention. Saved-source collection is also local/QA/preview gated; possession does not authorize current-question processing. Knowledge source eligibility rejects withheld/stale sources, validates manuscript admission and preserves canonical publication/entitlement boundaries. Continuity display maps upstream events and creates no history. Ask handoff creates a temporary reference seed and requires downstream RDG/ICR/RMO acceptance. These source observations do not establish live activation.
