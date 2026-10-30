// Additive local projection. Existing owners retain authorization, arithmetic and storage.
import {createBusinessSourceClosureCandidate} from './business-source-closure-candidate-r4.js';
import {authorizeR3, requireR3} from '../../profile/subject-bft-authority-candidate-r3.js';

export function createBusinessOwnerAdmissionCandidate(o) {
  const native = createBusinessSourceClosureCandidate(o);
  async function read(subjectId, identity, input) {
    const auth = await authorizeR3(o.deps, subjectId, identity, 'reading:probe');
    requireR3(typeof input?.expectedSourceVersion === 'string' && /^[a-f0-9]{64}$/.test(input.expectedSourceVersion), 'R5_EXACT_SOURCE_VERSION_REQUIRED', 409);
    const d = await native.diagnosis(subjectId, identity, input);
    const source = await o.intakes.read(input.intakeRef, identity);
    requireR3(source.sourceVersion === d.sourceVersion && source.sourceVersion === input.expectedSourceVersion, 'R5_SOURCE_CHANGED_DURING_READ', 409);
    const r = source.record, c = r.context;
    return {
      candidate: 'SUBJECT_BFT_R5_LOCAL_OWNER_REVIEW',
      source: {
        owner: 'functions/professional/financial/business-intake-candidate-r3.js',
        schemaVersion: r.schemaVersion, subjectType: auth.subject.metadata.subjectType,
        subjectId, accountId: identity.userId, sourceId: source.referenceId,
        sourceVersion: source.sourceVersion, reviewVersion: source.version,
        legalForm: r.legalForm, operatingScope: c.operatingScope, reportingScope: c.reportingScope,
        period: c.period, startDate: c.startDate, endDate: c.endDate,
        currency: c.currency, accountingBasis: c.basis, sourceDate: c.sourceDate,
        preparedBy: source.preparedByAccount, reviewedBy: r.review.reviewedBy,
        updatedAt: r.review.at,
        fields: Object.fromEntries(['revenue','costOfSales','operatingExpenses','netProfit','receivables','payables','inventory','closingCash','currentAssets','currentLiabilities'].map(k => [k, r.facts[k] ? structuredClone(r.facts[k]) : null])),
        ownerTransactions: structuredClone(r.ownerTransactions),
        grant: {id: auth.grantId, version: auth.grantVersion, purpose: auth.purpose, scope: auth.scope},
        personalIncomeProjection: null, householdMerge: false, independentLegalPersonAssumed: false
      },
      profile: {owner: 'functions/profile/subject-context-r1.js', subjectId, financial: d.summary},
      reading: d.reading, navigation: d.navigation,
      classification: d.classification,
      professionalDelivery: {caseId: auth.caseId, sourceVersion: d.sourceVersion,
        sourceReview: r.review, regulatedProfessionalApproval: false, externalDeliveryAuthorized: false},
      formalSourceAdmission: false, production: false,
      firstFormalBlocker: d.firstFormalBlocker,
      diagnosis: d
    };
  }
  async function compare(subjectId, identity, input, assumptions) {
    const p = await read(subjectId, identity, input);
    requireR3(assumptions?.explicit === true && assumptions.sourceVersion === p.source.sourceVersion &&
      assumptions.currency === p.source.currency && assumptions.period === p.source.period &&
      Number.isSafeInteger(assumptions.collectionAccelerationMinor) && assumptions.collectionAccelerationMinor >= 0 &&
      Number.isSafeInteger(assumptions.implementationCostMinor) && assumptions.implementationCostMinor >= 0 &&
      typeof assumptions.reason === 'string' && assumptions.reason.trim(), 'R5_SCENARIO_ASSUMPTIONS_REQUIRED', 422);
    const headroom = p.profile.financial.metrics.find(m => m.id === 'operatingHeadroom');
    const value = headroom?.value ?? null;
    const delta = assumptions.collectionAccelerationMinor - assumptions.implementationCostMinor;
    requireR3(Number.isSafeInteger(delta) && (value === null || Number.isSafeInteger(value + delta)), 'R5_SCENARIO_RANGE_INVALID', 422);
    return {sourceVersion: p.source.sourceVersion, assumptions: structuredClone(assumptions),
      baselineHeadroomMinor: value, conditionalHeadroomMinor: value === null ? null : value + delta,
      conditionalDeltaMinor: delta, ownerWithdrawableCashMinor: null,
      kind: 'EXPLICIT_ASSUMPTION_NOT_FORECAST', implemented: false, guaranteed: false, production: false};
  }
  return {read, compare, save: native.save, reopen: native.reopen, review: native.review};
}
