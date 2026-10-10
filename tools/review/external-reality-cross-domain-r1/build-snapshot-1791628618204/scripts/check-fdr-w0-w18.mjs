import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const base = 'content/financial/data-runtime';
const readJson = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const exists = path => fs.existsSync(path);
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const sorted = values => [...values].sort();
const requireFile = path => assert.ok(exists(path), `Missing FDR file: ${path}`);
const requireSet = (actual, expected, label) => assert.deepEqual(sorted(actual), sorted(expected), label);

const files = {
  baseline: `${base}/authority/financial-data-authority-baseline-v1.json`,
  manifest: `${base}/authority/fdr-w0-w18-foundation-manifest-v1.json`,
  reality: `${base}/contracts/financial-reality-object-contract-v1.json`,
  person: `${base}/contracts/financial-person-contract-v1.json`,
  household: `${base}/contracts/financial-household-contract-v1.json`,
  personRoles: `${base}/registries/financial-person-role-registry-v1.json`,
  entity: `${base}/contracts/financial-entity-contract-v1.json`,
  entityOwnership: `${base}/contracts/financial-entity-ownership-contract-v1.json`,
  entityTypes: `${base}/registries/financial-entity-type-registry-v1.json`,
  assetTypes: `${base}/registries/financial-asset-type-registry-v1.json`,
  asset: `${base}/contracts/financial-asset-contract-v1.json`,
  assetOwnership: `${base}/contracts/financial-asset-ownership-contract-v1.json`,
  liabilityTypes: `${base}/registries/financial-liability-type-registry-v1.json`,
  liability: `${base}/contracts/financial-liability-contract-v1.json`,
  guarantee: `${base}/contracts/financial-guarantee-contract-v1.json`,
  incomeTypes: `${base}/registries/financial-income-type-registry-v1.json`,
  income: `${base}/contracts/financial-income-stream-contract-v1.json`,
  expenseTypes: `${base}/registries/financial-expense-type-registry-v1.json`,
  expense: `${base}/contracts/financial-expense-contract-v1.json`,
  policy: `${base}/contracts/financial-policy-contract-v1.json`,
  goal: `${base}/contracts/financial-goal-contract-v1.json`,
  dar: `${base}/contracts/fdr-dar-cross-consumption-contract-v1.json`,
  disclosure: `${base}/registries/financial-disclosure-state-registry-v1.json`,
  fact: `${base}/contracts/financial-fact-contract-v1.json`,
  evidence: `${base}/contracts/financial-fact-evidence-contract-v1.json`,
  progressive: `${base}/contracts/financial-progressive-disclosure-contract-v1.json`,
  completeness: `${base}/contracts/financial-data-completeness-contract-v1.json`,
  documents: `${base}/contracts/financial-document-evidence-contract-v1.json`,
  consent: `${base}/contracts/financial-data-consent-contract-v1.json`,
  retention: `${base}/contracts/financial-data-retention-contract-v1.json`,
  sharing: `${base}/contracts/financial-data-sharing-scope-v1.json`
};
Object.values(files).forEach(requireFile);

const baseline = readJson(files.baseline);
assert.equal(baseline.schemaVersion, 'PHI-OS-FDR-W0-AUTHORITY-BASELINE-v1.0.0');
assert.equal(baseline.baselineCommit, '812d7c8');
assert.deepEqual(baseline.authority.owns, [
  'CANONICAL_FINANCIAL_FACTS',
  'FINANCIAL_FACT_IDENTITY',
  'FINANCIAL_FACT_LINEAGE',
  'FINANCIAL_DISCLOSURE_STATE',
  'FINANCIAL_FACT_EVIDENCE_BINDING'
]);
for (const denied of [
  'FINANCIAL_CALCULATION', 'FINANCIAL_ANALYSIS', 'PROFESSIONAL_JUDGMENT',
  'PROFESSIONAL_RECOMMENDATION', 'REPORT_ASSEMBLY', 'ACCOUNT_IDENTITY',
  'REALITY_MODEL_AUTHORITY', 'CONSENT_AUTHORITY', 'RETENTION_AUTHORITY',
  'ESTATE_DISTRIBUTION_INSTRUCTION', 'LEGAL_CLAUSE', 'WILL_VALIDITY'
]) assert.ok(baseline.authority.doesNotOwn.includes(denied), `FDR-W0 missing denied authority ${denied}`);
assert.equal(baseline.invariants.oneCanonicalFinancialFactAuthority, true);
assert.equal(baseline.invariants.createsSecondAccountAuthority, false);
assert.equal(baseline.invariants.calculationAuthorityInFdr, false);
assert.equal(baseline.invariants.analysisAuthorityInFdr, false);
assert.equal(baseline.invariants.professionalJudgmentAuthorityInFdr, false);
assert.equal(baseline.invariants.estateDistributionInstructionAuthorityInFdr, false);
assert.equal(baseline.invariants.silentMigrationAllowed, false);
assert.equal(baseline.exitGate.duplicateFinancialFactAuthorityCount, 0);
assert.equal(baseline.exitGate.secondAccountAuthorityCount, 0);
assert.equal(baseline.exitGate.silentMigrationCount, 0);
assert.equal(baseline.reconciliation.dar.baselinePresence, 'NOT_PRESENT_IN_812d7c8_BASELINE');
for (const predecessor of baseline.frozenPredecessors) {
  requireFile(predecessor.path);
  assert.equal(sha256(predecessor.path), predecessor.sha256, `Frozen predecessor drift: ${predecessor.path}`);
}

const reality = readJson(files.reality);
requireSet(reality.requiredTopLevelFields, [
  'financialRealityId','householdReference','customerReferences','asOfDate','currencyContext','people','entities','assets','liabilities','incomeStreams','expenses','policies','goals','estateFacts','documents','disclosureSummary','evidenceSummary','version','digest'
], 'FDR-W1 top-level object drift');
for (const [key, value] of Object.entries({
  factsOnly:true, calculationsAllowed:false, analysisAllowed:false, recommendationsAllowed:false,
  professionalJudgmentAllowed:false, estateDistributionInstructionAllowed:false, legalClauseAllowed:false,
  partialDisclosureAllowed:true, unknownPreserved:true, declinedPreserved:true, missingConvertedToZero:false
})) assert.equal(reality.invariants[key], value, `FDR-W1 invariant ${key}`);

const personRoles = readJson(files.personRoles);
requireSet(personRoles.roles, ['CUSTOMER','SPOUSE','DEPENDENT','CHILD','PARENT','BENEFICIARY','EXECUTOR','GUARDIAN','SHAREHOLDER','DIRECTOR','INSURED_PERSON','POLICY_OWNER'], 'FDR-W2 roles drift');
assert.equal(personRoles.rules.multipleRolesPerPersonAllowed, true);
assert.equal(personRoles.rules.beneficiaryRoleIsFactNotDistributionInstruction, true);
assert.equal(readJson(files.person).rules.personIdIsNotAccountId, true);
assert.equal(readJson(files.household).rules.adultMembersRetainSeparateConsent, true);
assert.equal(readJson(files.household).rules.membershipDoesNotImplyJointOwnership, true);

requireSet(readJson(files.entityTypes).entityTypes, ['COMPANY','PARTNERSHIP','SOLE_PROPRIETORSHIP','TRUST','FOUNDATION','OTHER_ENTITY'], 'FDR-W3 entity type drift');
const entity = readJson(files.entity);
for (const f of ['ownershipReferences','directorPersonIds','shareholderPersonIds','revenueFact','profitFact','dividendFact','debtReferences','guaranteeReferences','valuationFact']) {
  assert.ok(entity.requiredFields.includes(f) || entity.optionalFields.includes(f), `FDR-W3 missing ${f}`);
}
assert.equal(entity.rules.revenueProfitDividendAreStoredFactsNotCalculatedByFdr, true);
assert.equal(entity.rules.jurisdictionMayBeInferred, false);
assert.equal(readJson(files.entityOwnership).rules.ownershipTotalsNeedNotBeForcedTo100WhenDisclosureIncomplete, true);

requireSet(readJson(files.assetTypes).assetTypes, ['CASH','BANK_ACCOUNT','FIXED_DEPOSIT','PROPERTY','VEHICLE','EPF','PRS','UNIT_TRUST','LISTED_SECURITY','PRIVATE_COMPANY_SHARE','BUSINESS_INTEREST','INSURANCE_VALUE','JEWELLERY','SAFE_DEPOSIT','DIGITAL_ASSET','INTELLECTUAL_PROPERTY','FOREIGN_ASSET','OTHER'], 'FDR-W4 asset types drift');
const asset = readJson(files.asset);
assert.equal(asset.rules.assetValueIsFactNotCalculation, true);
assert.equal(asset.rules.rangeValueAllowed, true);
assert.equal(asset.rules.missingValueDoesNotBecomeZero, true);
requireSet(readJson(files.assetOwnership).ownershipModes, ['SOLE','JOINT','JOINT_EITHER','JOINT_BOTH','TENANCY_SHARE','COMPANY_OWNED','TRUST_OWNED','UNKNOWN'], 'FDR-W5 ownership modes drift');
assert.equal(readJson(files.assetOwnership).rules.jointDoesNotMeanEqualShares, true);
assert.equal(readJson(files.assetOwnership).rules.ownershipMayBeInferred, false);

requireSet(readJson(files.liabilityTypes).liabilityTypes, ['MORTGAGE','HIRE_PURCHASE','PERSONAL_LOAN','CREDIT_CARD','BUSINESS_LOAN','MARGIN','OTHER'], 'FDR-W6 liability types drift');
assert.equal(readJson(files.liability).rules.missingBalanceDoesNotBecomeZero, true);
const guarantee = readJson(files.guarantee);
requireSet(guarantee.guaranteeTypes, ['PERSONAL_GUARANTEE','CORPORATE_GUARANTEE','JOINT_GUARANTEE','CONTINGENT_LIABILITY'], 'FDR-W7 guarantee type drift');
assert.equal(guarantee.rules.largeBusinessGuaranteeMayNotBeNoteOnly, true);
assert.equal(guarantee.rules.contingentExposureDoesNotBecomeCurrentDebtAutomatically, true);

requireSet(readJson(files.incomeTypes).incomeTypes, ['SALARY','ALLOWANCE','BUSINESS_INCOME','DIVIDEND','RENTAL','INTEREST','INVESTMENT_DISTRIBUTION','FOREIGN_INCOME','PENSION','OTHER'], 'FDR-W8 income types drift');
const income = readJson(files.income);
assert.equal(income.rules.annualizationCalculationInFdr, false);
assert.equal(income.rules.foreignIncomeConversionInFdr, false);
assert.equal(income.rules.rangeAmountAllowed, true);
requireSet(readJson(files.expenseTypes).expenseTypes, ['ESSENTIAL','DISCRETIONARY','DEBT_SERVICE','EDUCATION','INSURANCE','TAX','DEPENDENT_SUPPORT','TRAVEL','BUSINESS_SUPPORT','OTHER'], 'FDR-W9 expense types drift');
requireSet(readJson(files.expenseTypes).frequencies, ['MONTHLY','ANNUAL','IRREGULAR','ONE_OFF'], 'FDR-W9 frequency drift');
assert.equal(readJson(files.expense).rules.monthlyNormalizationCalculationInFdr, false);

const policy = readJson(files.policy);
for (const field of ['owner','insured','beneficiary','policyType','provider','sumAssured','premium','cashValue','term','nominationStatus','coverageScope']) assert.ok(policy.requiredFields.includes(field), `FDR-W10 missing ${field}`);
assert.equal(policy.rules.premiumOnlyPolicyRecordForbidden, true);
assert.equal(policy.rules.coverageGapCalculationInFdr, false);
assert.equal(policy.rules.beneficiaryFactDoesNotCreateDistributionInstruction, true);

const goal = readJson(files.goal);
requireSet(goal.goalTypes, ['EMERGENCY','RETIREMENT','EDUCATION','PROPERTY','BUSINESS_SUCCESSION','ESTATE_LIQUIDITY','WEALTH_TRANSFER','INVESTMENT','DEBT_REDUCTION','OTHER'], 'FDR-W11 goal type drift');
for (const field of ['target','targetDate','priority','owner','fundingSource','status']) assert.ok(goal.requiredFields.includes(field), `FDR-W11 missing ${field}`);
assert.equal(goal.rules.goalIsCustomerStatedFactNotRecommendation, true);
assert.equal(goal.rules.fdrMayNotOptimizeGoals, true);

const dar = readJson(files.dar);
requireSet(dar.fdrOwnedEstateFacts, ['willExists','trustExists','nominationExists','beneficiaryKnown','executorKnown','assetJurisdiction','ownership'], 'FDR-W12 estate facts drift');
for (const forbidden of ['whoReceivesWhat','legalClause','willValidity']) assert.ok(dar.fdrDoesNotOwn.includes(forbidden), `FDR-W12 missing boundary ${forbidden}`);
assert.equal(dar.consumptionRules.darInstructionMayMutateFdrAssetFact, false);
assert.equal(dar.consumptionRules.darMayInventMissingFdrFact, false);
assert.equal(dar.consumptionRules.darUseRequiresW18ConsentScope, 'WILL_ASSEMBLY');

const disclosure = readJson(files.disclosure);
requireSet(disclosure.states, ['KNOWN_EXACT','KNOWN_APPROXIMATE','RANGE_ONLY','SELF_REPORTED','DOCUMENT_VERIFIED','NOT_YET_PROVIDED','DECLINED_TO_PROVIDE','UNKNOWN','NOT_APPLICABLE'], 'FDR-W13 disclosure state drift');
assert.equal(disclosure.rules.declinedIsNotZero, true);
assert.equal(disclosure.rules.unknownIsNotZero, true);
assert.equal(disclosure.rules.notApplicableExcludedFromCompletenessDenominator, true);

const fact = readJson(files.fact);
requireSet(fact.requiredFields, ['factId','factCode','value','disclosureState','evidence','effectiveDate','recordedAt'], 'FDR-W13/W14 fact envelope drift');
requireSet(fact.evidenceObjectRequiredFields, ['evidenceType','source','verifiedAt','effectiveDate','documentReference','confidence'], 'FDR-W14 inline evidence drift');
assert.equal(fact.rules.everyAtomicFinancialFactUsesThisEnvelope, true);
assert.equal(fact.rules.evidenceTravelsWithFact, true);
assert.equal(fact.rules.nullMayBeCoercedToZero, false);
for (const domainFile of [files.reality, files.person, files.household, files.entity, files.entityOwnership, files.asset, files.assetOwnership, files.liability, files.guarantee, files.income, files.expense, files.policy, files.goal]) {
  const domain = readJson(domainFile);
  assert.equal(domain.factEnvelopeReference, 'financial-fact-contract-v1.json', `Missing atomic fact envelope binding: ${domainFile}`);
  assert.equal(domain.rules?.allAtomicFinancialFactsUseFactEnvelope ?? domain.invariants?.allAtomicFinancialFactsUseFactEnvelope, true, `Atomic fact envelope not required: ${domainFile}`);
}

const evidence = readJson(files.evidence);
requireSet(evidence.requiredFields, ['evidenceType','source','verifiedAt','effectiveDate','documentReference','confidence'], 'FDR-W14 evidence fields drift');
assert.equal(evidence.rules.eachFinancialFactCarriesEvidenceState, true);
assert.equal(evidence.rules.aiExtractionIsNotVerificationByItself, true);

const progressive = readJson(files.progressive);
requireSet(progressive.levels, ['QUICK','PLANNING','VERIFIED','PROFESSIONAL'], 'FDR-W15 levels drift');
assert.equal(progressive.levelRequirements.QUICK.exactAmountsRequired, false);
assert.equal(progressive.levelRequirements.QUICK.rangesAllowed, true);
assert.equal(progressive.transitionRules.noExactAmountBlocksWholeCustomer, false);
assert.equal(progressive.transitionRules.missingOneDomainBlocksUnrelatedDomains, false);

const completeness = readJson(files.completeness);
requireSet(completeness.domains, ['HOUSEHOLD','ASSETS','LIABILITIES','PROTECTION','ESTATE'], 'FDR-W16 domains drift');
for (const field of ['missingCount','declinedCount','unknownCount','notApplicableCount']) assert.ok(completeness.outputFields.includes(field), `FDR-W16 missing ${field}`);
assert.equal(completeness.rules.thisIsFinancialCalculation, false);
assert.equal(completeness.rules.thisIsGovernanceMetadataDerivation, true);
assert.equal(completeness.rules.declinedCountsAsZeroValue, false);
assert.equal(completeness.rules.unknownCountsAsZeroValue, false);

const documents = readJson(files.documents);
requireSet(documents.documentTypes, ['BANK_STATEMENT','LOAN_STATEMENT','PROPERTY_TITLE','POLICY_SCHEDULE','EPF','PORTFOLIO_STATEMENT','COMPANY_ACCOUNTS','SHARE_REGISTER','TAX_RECORD','WILL','TRUST_DEED'], 'FDR-W17 document types drift');
assert.equal(documents.rules.rawDocumentContentEmbeddedInFdrObject, false);
assert.equal(documents.rules.extractionMayCreateAuthority, false);
assert.equal(documents.rules.willDocumentDoesNotGrantWillValidity, true);

const consent = readJson(files.consent);
requireSet(consent.purposeScopes, ['FINANCIAL_PLANNING','WILL_ASSEMBLY','PROFESSIONAL_REVIEW','REPORT'], 'FDR-W18 consent scopes drift');
assert.equal(consent.rules.financialPlanningConsentAuthorizesWillAssembly, false);
assert.equal(consent.rules.willAssemblyRequiresExplicitScope, true);
assert.equal(consent.rules.consentAuthorizesRetention, false);
assert.equal(consent.rules.adultHouseholdMembersRequireSeparateConsent, true);
assert.equal(consent.rules.aiMayGrantConsent, false);
const retention = readJson(files.retention);
assert.equal(retention.rules.silentIndefiniteRetentionAllowed, false);
assert.equal(retention.rules.purposeBoundRetentionRequired, true);
assert.equal(retention.rules.legalHoldMustBeExplicit, true);
const sharing = readJson(files.sharing);
assert.equal(sharing.rules.financialPlanningToWillImplicitReuseAllowed, false);
assert.equal(sharing.rules.crossProfessionalReuseAllowedWithoutConsent, false);
assert.equal(sharing.rules.revokedScopeFailsClosed, true);
assert.equal(sharing.rules.missingScopeFailsClosed, true);

const manifest = readJson(files.manifest);
requireSet(manifest.implementedWorks, Array.from({length:19}, (_, i) => `FDR-W${i}`), 'FDR W0-W18 manifest drift');
requireSet(manifest.deferredWorks, Array.from({length:6}, (_, i) => `FDR-W${i + 19}`), 'FDR W19-W24 deferral drift');
assert.equal(manifest.status, 'W0_W18_IMPLEMENTED_NOT_FINAL_FROZEN');
assert.equal(manifest.rules.w24FinalFreezeNotImplementedYet, true);

console.log('✓ FDR-W0–W18 Financial Data Runtime foundation passed.');
console.log('  FDR owns canonical financial facts only; Calculation, Analysis, Professional Judgment, Account, RMO, RR and legal/estate instruction authority remain external.');
console.log('  Household/person/entity, assets/ownership, liabilities/guarantees, income/expenses, protection, goals, estate facts, disclosure/evidence, documents and purpose-scoped consent are canonicalized.');
console.log('  Partial/range disclosure is preserved; declined/unknown values never become zero; FINANCIAL_PLANNING does not imply WILL_ASSEMBLY consent.');
console.log('  Historical W0–W18 checkpoint remains byte-governed: W19–W24 were deferred at that predecessor checkpoint; successor completion is checked separately by check:fdr.');
