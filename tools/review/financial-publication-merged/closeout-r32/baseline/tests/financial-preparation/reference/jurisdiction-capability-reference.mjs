/**
 * Decision-only reference. This module is not an authorization boundary, a legal
 * resolver, a calculator, a provider integration, or production configuration.
 * The owning service must authenticate every supplied fact/evidence/receipt.
 */
import { createHash } from 'node:crypto';

export const FEATURES = Object.freeze({
  BASIC_PREPARATION: 'BASIC_PREPARATION',
  PURE_MATH: 'PURE_MATH',
  TAX_ESTIMATE: 'TAX_ESTIMATE',
  AI_FACTUAL_REPORT: 'AI_FACTUAL_REPORT',
  WILL_PREPARATION: 'WILL_PREPARATION',
  WILL_SIGNING_TEXT: 'WILL_SIGNING_TEXT',
  PROFESSIONAL_HANDOFF: 'PROFESSIONAL_HANDOFF',
});

export const STATUSES = Object.freeze({
  READY: 'READY', UNKNOWN: 'UNKNOWN', UNSUPPORTED: 'UNSUPPORTED',
  EXPIRED: 'EXPIRED', REVIEW_NEEDED: 'REVIEW_NEEDED',
});

const PENINSULAR_STATES = new Set([
  'JOHOR', 'KEDAH', 'KELANTAN', 'MELAKA', 'NEGERI_SEMBILAN', 'PAHANG',
  'PENANG', 'PERAK', 'PERLIS', 'SELANGOR', 'TERENGGANU',
  'KUALA_LUMPUR', 'PUTRAJAYA',
]);
const UNKNOWN_WORDS = new Set([
  '', 'UNKNOWN', 'UNBOUND', 'DECLINED', 'NOT_PROVIDED', 'NOT_YET_PROVIDED',
  'NOT_DISCLOSED', 'DECLINED_TO_PROVIDE', 'UNSPECIFIED', 'UNCONFIRMED', 'TO_BE_CONFIRMED', 'PENDING',
]);
const DIMENSIONS = ['coverage', 'factsReadiness', 'runtimeIntegration'];
// Presentation priority only: the full blocker list is always retained.
const STATUS_PRIORITY = ['UNSUPPORTED', 'EXPIRED', 'UNKNOWN', 'REVIEW_NEEDED'];

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

/** Candidate jurisdictions are research/routing entries, NOT approved bundles. */
export const INITIAL_REGISTRY = freeze({
  id: 'phios-jurisdiction-reference-initial-2026-10-17',
  environment: 'REFERENCE_INITIAL',
  willCandidates: [
    { id: 'MY_PENINSULAR', country: 'MY', approval: 'PENDING_REVIEW' },
    { id: 'MY_SABAH', country: 'MY', approval: 'PENDING_REVIEW' },
    { id: 'MY_SARAWAK', country: 'MY', approval: 'PENDING_REVIEW' },
    { id: 'SG', country: 'SG', approval: 'PENDING_REVIEW' },
    { id: 'GB_ENGLAND_WALES', country: 'GB', approval: 'PENDING_REVIEW' },
  ],
  taxCandidates: ['MY'],
  bundles: [], // The inspected baseline has ZERO approved production Will bundles.
});

export function countApprovedWillBundles(registry = INITIAL_REGISTRY) {
  return registry.bundles.filter(b => b.kind === 'WILL' && b.approval?.status === 'APPROVED').length;
}

function known(value) {
  return value !== undefined && value !== null
    && !(typeof value === 'string' && UNKNOWN_WORDS.has(value.trim().toUpperCase()));
}

function get(object, path) {
  return path.split('.').reduce((value, key) => value?.[key], object);
}

function isoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function country(value) { return typeof value === 'string' && /^[A-Z]{2}$/.test(value); }
function nonemptyArray(value) { return Array.isArray(value) && value.length > 0; }
function nonemptyText(value) {
  return typeof value === 'string' && known(value) && value === value.trim()
    && value.toUpperCase() !== 'NOT_APPLICABLE';
}
function stringArray(value) {
  return nonemptyArray(value) && Array.from(value).every(nonemptyText) && new Set(value).size === value.length;
}
function containsExact(array, value) { return stringArray(array) && nonemptyText(value) && array.includes(value); }
function isoInstant(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}
function finalStatus(blockers) {
  return STATUS_PRIORITY.find(status => blockers.some(b => b.status === status)) ?? 'READY';
}
function sameSet(a, b) {
  return stringArray(a) && stringArray(b)
    && JSON.stringify([...new Set(a)].sort()) === JSON.stringify([...new Set(b)].sort());
}

function canonical(value) {
  if (value === undefined || value === null) return null;
  if (['string', 'boolean'].includes(typeof value)) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  throw new TypeError('Assessment context must contain plain JSON data');
}

/** Deterministic context binding, NOT a signature or an authenticated approval. */
export function buildWillAssessmentContext({ facts = {}, bundle = {}, registryId, asOfDate, contractVersion }) {
  const place = value => ({ country: value?.country, subdivision: value?.subdivision });
  const context = {
    schemaVersion: 'WILL_ASSESSMENT_CONTEXT_V1', feature: FEATURES.WILL_SIGNING_TEXT,
    registryId, asOfDate, contractVersion,
    bundle: {
      id: bundle.id, version: bundle.version, scope: bundle.scope,
      approval: bundle.approval, sourceRefs: bundle.sourceRefs, sourceStatus: bundle.sourceStatus,
      legalEffectiveFrom: bundle.legalEffectiveFrom, legalEffectiveTo: bundle.legalEffectiveTo,
      reviewValidUntil: bundle.reviewValidUntil, approvedClauseIds: bundle.approvedClauseIds,
      languages: bundle.languages, signatureMethods: bundle.signatureMethods,
    },
    facts: {
      profileRevision: facts.profileRevision, dateOfBirth: facts.person?.dateOfBirth,
      residence: place(facts.residence), habitualResidence: place(facts.habitualResidence),
      citizenships: facts.citizenships,
      domicile: { ...place(facts.domicile), status: facts.domicile?.status },
      assets: facts.assets,
      personalLaw: { islam: facts.personalLaw?.islam, customaryLawApplicability: facts.personalLaw?.customaryLawApplicability },
      will: {
        requestedJurisdiction: facts.will?.requestedJurisdiction, signingPlace: place(facts.will?.signingPlace),
        intendedSigningDate: facts.will?.intendedSigningDate, language: facts.will?.language,
        signatureMethod: facts.will?.signatureMethod, maritalStatus: facts.will?.maritalStatus,
        complexityFlags: facts.will?.complexityFlags,
      },
    },
  };
  return freeze({ schemaVersion: context.schemaVersion,
    digest: `sha256:${createHash('sha256').update(JSON.stringify(canonical(context))).digest('hex')}` });
}

/** Internal routing labels. Labuan, Scotland and Northern Ireland are not folded in. */
function placeRoute(place) {
  if (place?.country === 'SG') return 'SG';
  if (place?.country === 'MY') {
    if (PENINSULAR_STATES.has(place.subdivision)) return 'MY_PENINSULAR';
    if (place.subdivision === 'SABAH') return 'MY_SABAH';
    if (place.subdivision === 'SARAWAK') return 'MY_SARAWAK';
  }
  if (place?.country === 'GB' && ['ENGLAND', 'WALES'].includes(place.subdivision)) {
    return 'GB_ENGLAND_WALES';
  }
  return null;
}

/**
 * All dates and runtime receipts are explicit: there is no clock, IO, randomness,
 * user-country default, ethnic inference, canonical write, or generated document.
 * runtime and evidence must come from the owner, never directly from a browser.
 */
export function evaluateCapability({
  feature, facts = {}, evidence = {}, runtime = {}, registry = INITIAL_REGISTRY,
  asOfDate, asOfInstant, evaluationMode = 'REFERENCE',
}) {
  if (!Object.values(FEATURES).includes(feature)) throw new TypeError('Unknown feature');
  const blockers = [];
  const matchedBundles = [];
  const routes = [];
  let willContextDigest = null;
  const reviewHorizons = [];
  function block(dimension, status, code, paths = []) {
    if (!blockers.some(b => b.dimension === dimension && b.code === code
      && JSON.stringify(b.paths) === JSON.stringify(paths))) {
      blockers.push({ dimension, status, code, paths });
    }
  }
  function requireFact(path, validate = () => true) {
    const value = get(facts, path);
    if (!known(value)) block('factsReadiness', 'UNKNOWN', 'FACT_UNKNOWN', [path]);
    else if (!validate(value)) block('factsReadiness', 'REVIEW_NEEDED', 'FACT_INVALID', [path]);
    return value;
  }
  function requireEvidence(path, expected = true) {
    const value = get(evidence, path);
    if (!known(value)) block('factsReadiness', 'UNKNOWN', 'OWNER_EVIDENCE_MISSING', [path]);
    else if (value !== expected) block('factsReadiness', 'REVIEW_NEEDED', 'OWNER_EVIDENCE_NOT_PASSED', [path]);
  }
  function requirePlace(path) {
    const value = requireFact(`${path}.country`, country);
    if (['MY', 'GB'].includes(value)) requireFact(`${path}.subdivision`, nonemptyText);
    return get(facts, path);
  }
  function assessAuthorization(receipt, codePrefix, purpose, expectedBindings) {
    if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) {
      block('factsReadiness', 'UNKNOWN', `${codePrefix}_AUTHORIZATION_MISSING`);
      return;
    }
    if (!nonemptyText(receipt.id) || !nonemptyText(receipt.version)) {
      block('factsReadiness', 'UNKNOWN', `${codePrefix}_AUTHORIZATION_REFERENCE_MISSING`);
    }
    if (receipt.purpose !== purpose || receipt.status !== 'GRANTED' || receipt.active !== true
      || receipt.revocationState !== 'NOT_REVOKED' || known(receipt.revokedAt)) {
      block('factsReadiness', 'REVIEW_NEEDED', `${codePrefix}_AUTHORIZATION_NOT_ACTIVE`);
    }
    if (!isoInstant(receipt.issuedAt) || !isoInstant(receipt.expiresAt)) {
      block('factsReadiness', 'UNKNOWN', `${codePrefix}_AUTHORIZATION_TIME_MISSING`);
    } else {
      if (receipt.expiresAt <= receipt.issuedAt) block('factsReadiness', 'REVIEW_NEEDED', `${codePrefix}_AUTHORIZATION_CHRONOLOGY_INVALID`);
      if (isoInstant(asOfInstant) && receipt.issuedAt > asOfInstant) block('factsReadiness', 'REVIEW_NEEDED', `${codePrefix}_AUTHORIZATION_NOT_YET_ACTIVE`);
      if (isoInstant(asOfInstant) && receipt.expiresAt <= asOfInstant) block('factsReadiness', 'EXPIRED', `${codePrefix}_AUTHORIZATION_EXPIRED`);
      reviewHorizons.push(receipt.expiresAt.slice(0, 10));
    }
    for (const [key, expected] of Object.entries(expectedBindings)) {
      const matches = Array.isArray(expected) ? sameSet(receipt[key], expected)
        : nonemptyText(expected) && nonemptyText(receipt[key]) && receipt[key] === expected;
      if (!matches) block('factsReadiness', 'REVIEW_NEEDED', `${codePrefix}_AUTHORIZATION_BINDING_MISMATCH`, [key]);
    }
  }
  function assessBundle(kind, candidates, targetDate) {
    if (candidates.length === 0) {
      block('coverage', 'REVIEW_NEEDED', `${kind}_APPROVED_BUNDLE_ABSENT`);
      return;
    }
    if (candidates.length > 1) {
      block('coverage', 'REVIEW_NEEDED', 'AMBIGUOUS_BUNDLE_MATCH');
      return;
    }
    const bundle = candidates[0];
    matchedBundles.push({
      id: nonemptyText(bundle.id) ? bundle.id : null,
      version: nonemptyText(bundle.version) ? bundle.version : null,
    });
    if (bundle.approval?.status !== 'APPROVED' || !nonemptyText(bundle.approval?.recordId)) {
      block('coverage', 'REVIEW_NEEDED', 'BUNDLE_NOT_APPROVED');
    }
    if (!nonemptyText(bundle.id) || !nonemptyText(bundle.version) || !stringArray(bundle.sourceRefs)) {
      block('coverage', 'UNKNOWN', 'BUNDLE_PROVENANCE_INCOMPLETE');
    }
    if (bundle.sourceStatus !== 'VERIFIED_EFFECTIVE') {
      block('coverage', 'REVIEW_NEEDED', 'SOURCE_NOT_VERIFIED_EFFECTIVE');
    }
    if (!isoDate(bundle.reviewValidUntil)) block('coverage', 'UNKNOWN', 'SOURCE_REVIEW_DATE_MISSING');
    else if (isoDate(asOfDate) && asOfDate > bundle.reviewValidUntil) {
      block('coverage', 'EXPIRED', 'SOURCE_REVIEW_EXPIRED');
    }
    if (isoDate(bundle.reviewValidUntil)) reviewHorizons.push(bundle.reviewValidUntil);
    // A tax bundle is keyed to assessmentYear, not to filing year or today's year.
    if (kind === 'WILL' && isoDate(targetDate)) {
      if (!isoDate(bundle.legalEffectiveFrom)) block('coverage', 'UNKNOWN', 'LEGAL_EFFECTIVE_DATE_MISSING');
      else if (targetDate < bundle.legalEffectiveFrom) block('coverage', 'REVIEW_NEEDED', 'SOURCE_NOT_YET_EFFECTIVE_FOR_SIGNING');
      if (known(bundle.legalEffectiveTo) && !isoDate(bundle.legalEffectiveTo)) {
        block('coverage', 'UNKNOWN', 'LEGAL_END_DATE_INVALID');
      } else if (isoDate(bundle.legalEffectiveTo) && targetDate > bundle.legalEffectiveTo) {
        block('coverage', 'EXPIRED', 'BUNDLE_OUTSIDE_SIGNING_DATE');
      }
      if (isoDate(bundle.reviewValidUntil) && targetDate > bundle.reviewValidUntil) {
        block('coverage', 'REVIEW_NEEDED', 'SIGNING_BEYOND_SOURCE_REVIEW_HORIZON');
      }
      if (isoDate(bundle.legalEffectiveTo)) reviewHorizons.push(bundle.legalEffectiveTo);
    }
    if (kind === 'WILL') {
      if (!stringArray(bundle.approvedClauseIds)) block('coverage', 'REVIEW_NEEDED', 'APPROVED_CLAUSES_ABSENT');
      if (!containsExact(bundle.languages, facts.will?.language)) block('coverage', 'REVIEW_NEEDED', 'LANGUAGE_NOT_APPROVED');
      if (!containsExact(bundle.signatureMethods, facts.will?.signatureMethod)) block('coverage', 'REVIEW_NEEDED', 'SIGNATURE_METHOD_NOT_APPROVED');
      // The reference does not implement legal capacity/conflicts/execution law.
      // An owner-bound assessment is an additional gate, not a user checkbox.
      requireEvidence('willEligibilityAssessment', 'PASSED');
      requireEvidence('willAssessmentBundleId', bundle.id);
      requireEvidence('willAssessmentBundleVersion', bundle.version);
      requireEvidence('willAssessmentProfileRevision', facts.profileRevision);
      try {
        willContextDigest = buildWillAssessmentContext({ facts, bundle, registryId: registry.id,
          asOfDate, contractVersion: runtime.features?.[feature]?.contractVersion }).digest;
        requireEvidence('willAssessmentContextDigest', willContextDigest);
      } catch {
        block('factsReadiness', 'UNKNOWN', 'WILL_ASSESSMENT_CONTEXT_INVALID');
      }
    }
  }

  if (!isoDate(asOfDate)) block('coverage', 'UNKNOWN', 'AS_OF_DATE_REQUIRED');
  if ([FEATURES.AI_FACTUAL_REPORT, FEATURES.PROFESSIONAL_HANDOFF].includes(feature)) {
    if (!isoInstant(asOfInstant)) block('factsReadiness', 'UNKNOWN', 'AS_OF_INSTANT_REQUIRED');
    else if (isoDate(asOfDate) && asOfInstant.slice(0, 10) !== asOfDate) {
      block('factsReadiness', 'REVIEW_NEEDED', 'EVALUATION_TIME_DATE_MISMATCH');
    }
  }
  if (registry.environment === 'TEST_ONLY' && evaluationMode !== 'TEST_ONLY') {
    block('coverage', 'UNSUPPORTED', 'TEST_REGISTRY_FORBIDDEN');
  }
  const receipt = runtime.features?.[feature];
  if (receipt?.integration !== 'INTEGRATED' || !nonemptyText(receipt?.contractVersion)) {
    block('runtimeIntegration', 'REVIEW_NEEDED', 'OWNER_RUNTIME_NOT_INTEGRATED');
  }

  if (feature === FEATURES.PURE_MATH) {
    requireEvidence('mathInputsValidated');
    requireEvidence('mathModelVersionBound');
  }

  if (feature === FEATURES.TAX_ESTIMATE) {
    const jurisdiction = requireFact('tax.jurisdiction', country);
    const assessmentYear = requireFact('tax.assessmentYear', y => Number.isInteger(y) && y >= 1900 && y <= 9999);
    const residencyStatus = requireFact('tax.residencyStatus', s => ['RESIDENT', 'NON_RESIDENT'].includes(s));
    requireEvidence('taxInputsValidated');
    if (known(jurisdiction) && !registry.taxCandidates.includes(jurisdiction)) {
      block('coverage', 'UNSUPPORTED', 'TAX_JURISDICTION_NOT_CATALOGUED');
    } else if (![jurisdiction, assessmentYear, residencyStatus].every(known)) {
      block('coverage', 'UNKNOWN', 'TAX_SCOPE_UNRESOLVED');
    } else {
      const candidates = registry.bundles.filter(b => b.kind === 'TAX'
        && b.scope?.jurisdiction === jurisdiction && b.scope.assessmentYear === assessmentYear
        && b.scope.residencyStatus === residencyStatus);
      assessBundle('TAX', candidates);
    }
  }

  if (feature === FEATURES.AI_FACTUAL_REPORT) {
    const snapshot = requireFact('report.sourceSnapshotId', nonemptyText);
    const language = requireFact('report.language', nonemptyText);
    const serviceScope = requireFact('report.serviceScope', nonemptyText);
    const mode = requireFact('report.mode', m => ['FACTUAL_ONLY', 'PERSONALIZED_PLAN'].includes(m));
    if (known(mode) && mode !== 'FACTUAL_ONLY') {
      block('coverage', 'UNSUPPORTED', 'PERSONALIZED_PLAN_OUTSIDE_FACTUAL_REPORT');
    }
    requireEvidence('reportSourceValidated');
    requireEvidence('reportContractBound');
    if (!containsExact(receipt?.allowedLanguages, language) || !containsExact(receipt?.allowedServiceScopes, serviceScope)) {
      block('runtimeIntegration', 'REVIEW_NEEDED', 'REPORT_SCOPE_OR_LANGUAGE_NOT_INTEGRATED');
    }
    assessAuthorization(evidence.reportAuthorization, 'REPORT', 'REPORT', {
      sourceSnapshotId: snapshot, language, serviceScope, contractVersion: receipt?.contractVersion,
    });
  }

  if (feature === FEATURES.WILL_SIGNING_TEXT) {
    const jurisdiction = requireFact('will.requestedJurisdiction', nonemptyText);
    const candidate = registry.willCandidates.find(c => c.id === jurisdiction);
    if (!known(jurisdiction)) block('coverage', 'UNKNOWN', 'WILL_JURISDICTION_UNRESOLVED');
    else if (!candidate) block('coverage', 'UNSUPPORTED', 'WILL_JURISDICTION_NOT_CATALOGUED');

    requireFact('profileRevision', nonemptyText);
    const birthDate = requireFact('person.dateOfBirth', isoDate);
    requirePlace('residence');
    requirePlace('habitualResidence');
    const citizenships = requireFact('citizenships', v => stringArray(v) && v.every(country));
    requirePlace('domicile');
    const domicileStatus = requireFact('domicile.status', s => ['DECLARED', 'REVIEWED', 'NEEDS_REVIEW'].includes(s));
    if (domicileStatus === 'NEEDS_REVIEW') block('factsReadiness', 'REVIEW_NEEDED', 'DOMICILE_REVIEW_REQUIRED');
    const signingPlace = requirePlace('will.signingPlace');
    const signingDate = requireFact('will.intendedSigningDate', isoDate);
    if (isoDate(birthDate) && isoDate(asOfDate) && birthDate > asOfDate) {
      block('factsReadiness', 'REVIEW_NEEDED', 'DATE_OF_BIRTH_IN_FUTURE');
    }
    if (isoDate(birthDate) && isoDate(signingDate) && birthDate > signingDate) {
      block('factsReadiness', 'REVIEW_NEEDED', 'DATE_OF_BIRTH_AFTER_SIGNING');
    }
    if (isoDate(signingDate) && isoDate(asOfDate) && signingDate < asOfDate) {
      block('factsReadiness', 'REVIEW_NEEDED', 'INTENDED_SIGNING_DATE_IN_PAST');
    }
    requireFact('will.language', nonemptyText);
    requireFact('will.signatureMethod', s => ['WET_INK_IN_PERSON', 'REMOTE', 'ELECTRONIC'].includes(s));
    requireFact('will.maritalStatus', s => ['SINGLE', 'MARRIED', 'CIVIL_PARTNER', 'DIVORCED', 'WIDOWED', 'OTHER'].includes(s));
    requireFact('will.complexityFlags', v => Array.isArray(v) && Array.from(v).every(nonemptyText));
    const assets = requireFact('assets', v => Array.isArray(v)
      && Array.from(v).every(a => a !== null && typeof a === 'object' && !Array.isArray(a)));
    requireEvidence('assetInventoryConfirmedComplete');
    if (Array.isArray(assets)) assets.forEach((asset, i) => {
      requirePlace(`assets.${i}.location`);
      const ownership = requireFact(`assets.${i}.ownership`, s => ['SOLE', 'JOINT', 'TRUST', 'COMPANY', 'OTHER'].includes(s));
      if (known(ownership) && ownership !== 'SOLE') {
        block('factsReadiness', 'REVIEW_NEEDED', 'OWNERSHIP_OUTSIDE_INITIAL_SIMPLE_SCOPE', [`assets.${i}.ownership`]);
      }
    });

    let personalLawRoute = candidate ? `${candidate.id}_GENERAL` : null;
    if (candidate && ['MY', 'SG'].includes(candidate.country)) {
      const islam = requireFact('personalLaw.islam', s => ['YES', 'NO'].includes(s));
      if (islam === 'YES' && jurisdiction === 'MY_PENINSULAR') {
        personalLawRoute = 'MY_MUSLIM_SEPARATE_REGIME';
        block('coverage', 'REVIEW_NEEDED', 'MY_WILLS_ACT_1959_MUSLIM_EXCLUSION_REQUIRES_SEPARATE_ROUTE');
      } else if (islam === 'YES' && jurisdiction === 'SG') {
        personalLawRoute = 'SG_WILLS_ACT_PLUS_AMLA';
        block('coverage', 'REVIEW_NEEDED', 'SG_WILLS_FORMALITIES_PLUS_AMLA_REVIEW_REQUIRED');
      } else if (islam === 'YES') {
        personalLawRoute = `${jurisdiction}_MUSLIM_REVIEW`;
        block('coverage', 'REVIEW_NEEDED', 'REGIONAL_PERSONAL_LAW_REVIEW_REQUIRED');
      } else if (islam === 'NO') personalLawRoute = `${jurisdiction}_NON_MUSLIM`;
      else personalLawRoute = null;
    }
    if (['MY_SABAH', 'MY_SARAWAK'].includes(jurisdiction)) {
      const customary = requireFact('personalLaw.customaryLawApplicability', s => ['APPLIES', 'DOES_NOT_APPLY'].includes(s));
      if (customary === 'APPLIES') block('coverage', 'REVIEW_NEEDED', 'CUSTOMARY_LAW_REVIEW_REQUIRED');
    }
    if (personalLawRoute) routes.push(personalLawRoute);

    // A deliberately conservative PRODUCT scope, not a conflict-of-laws conclusion.
    if (candidate) {
      const places = [facts.residence, facts.habitualResidence, facts.domicile, signingPlace,
        ...(Array.isArray(assets) ? assets.map(a => a.location) : [])];
      if (places.some(p => known(p?.country) && (p.country !== candidate.country
        || (['MY', 'GB'].includes(p.country) && known(p.subdivision) && placeRoute(p) !== candidate.id)))
        || (Array.isArray(citizenships) && citizenships.some(c => c !== candidate.country))) {
        block('factsReadiness', 'REVIEW_NEEDED', 'CROSS_JURISDICTION_OUTSIDE_INITIAL_SIMPLE_SCOPE');
      }
      const candidates = registry.bundles.filter(b => b.kind === 'WILL'
        && b.scope?.jurisdiction === candidate.id && personalLawRoute !== null
        && b.scope.personalLawRoute === personalLawRoute);
      assessBundle('WILL', candidates, signingDate);
    }
    if (nonemptyArray(facts.will?.complexityFlags)) {
      block('factsReadiness', 'REVIEW_NEEDED', 'DECLARED_COMPLEXITY_REQUIRES_REVIEW', ['will.complexityFlags']);
    }
  }

  if (feature === FEATURES.PROFESSIONAL_HANDOFF) {
    const recipient = requireFact('handoff.professionalId', nonemptyText);
    const jurisdictionScope = requireFact('handoff.jurisdictionScope', nonemptyText);
    const serviceScope = requireFact('handoff.serviceScope', nonemptyText);
    const snapshot = requireFact('handoff.sourceSnapshotId', nonemptyText);
    const dataScope = requireFact('handoff.dataScope', stringArray);
    requireEvidence('handoffPacketValidated');
    assessAuthorization(evidence.handoffConsent, 'HANDOFF', 'PROFESSIONAL_HANDOFF', {
      professionalId: recipient, jurisdictionScope, serviceScope, sourceSnapshotId: snapshot,
      dataScope, contractVersion: receipt?.contractVersion,
    });
    const professionals = Array.isArray(runtime.professionals) ? runtime.professionals.filter(p => p?.id === recipient) : [];
    if (professionals.length > 1) block('coverage', 'REVIEW_NEEDED', 'AMBIGUOUS_PROFESSIONAL_MATCH');
    const verified = professionals.length === 1 ? professionals[0] : null;
    if (!verified || verified.verificationStatus !== 'VERIFIED'
      || !containsExact(verified.jurisdictionScopes, jurisdictionScope) || !containsExact(verified.serviceScopes, serviceScope)) {
      block('coverage', 'REVIEW_NEEDED', 'PROFESSIONAL_SCOPE_UNVERIFIED');
    } else if (!isoDate(verified.reviewValidUntil)) {
      block('coverage', 'UNKNOWN', 'PROFESSIONAL_REVIEW_DATE_MISSING');
    } else if (isoDate(asOfDate) && asOfDate > verified.reviewValidUntil) {
      block('coverage', 'EXPIRED', 'PROFESSIONAL_VERIFICATION_EXPIRED');
    }
    if (isoDate(verified?.reviewValidUntil)) reviewHorizons.push(verified.reviewValidUntil);
  }

  const dimensions = Object.fromEntries(DIMENSIONS.map(name => [name, {
    status: finalStatus(blockers.filter(b => b.dimension === name)),
    blockers: blockers.filter(b => b.dimension === name),
  }]));
  const status = finalStatus(blockers);
  return freeze({
    feature, status, allGatesPassed: status === 'READY', referenceOnly: true,
    testOnly: registry.environment === 'TEST_ONLY', registryId: nonemptyText(registry.id) ? registry.id : null,
    asOfDate: isoDate(asOfDate) ? asOfDate : null,
    ...dimensions, blockers, routes, matchedBundles,
    validity: {
      semantics: 'AT_EVALUATION_ONLY', reusableAuthorization: false,
      evaluatedAt: isoInstant(asOfInstant) ? asOfInstant : null,
      reviewNoLaterThan: reviewHorizons.length ? [...reviewHorizons].sort()[0] : null,
      freshEvaluationRequiredBefore: feature === FEATURES.WILL_SIGNING_TEXT ? ['GENERATE', 'SIGN']
        : feature === FEATURES.AI_FACTUAL_REPORT ? ['MODEL_CALL']
          : feature === FEATURES.PROFESSIONAL_HANDOFF ? ['HANDOFF'] : [],
    },
    // Binding hints, not an authorization or execution-validity token.
    binding: {
      profileRevision: nonemptyText(facts.profileRevision) ? facts.profileRevision : null,
      sourceSnapshotId: nonemptyText(facts.report?.sourceSnapshotId) ? facts.report.sourceSnapshotId
        : nonemptyText(facts.handoff?.sourceSnapshotId) ? facts.handoff.sourceSnapshotId : null,
      intendedSigningDate: feature === FEATURES.WILL_SIGNING_TEXT && isoDate(facts.will?.intendedSigningDate)
        ? facts.will.intendedSigningDate : null,
      language: feature === FEATURES.WILL_SIGNING_TEXT && nonemptyText(facts.will?.language) ? facts.will.language : null,
      willAssessmentContextDigest: willContextDigest,
    },
  });
}

/** Display projection omits raw values. Routes/reason codes can remain sensitive. */
export function projectCapabilityDecision(decision) {
  return freeze({
    feature: decision.feature, status: decision.status, allGatesPassed: decision.allGatesPassed,
    referenceOnly: true, testOnly: decision.testOnly,
    validity: {
      semantics: decision.validity.semantics, reusableAuthorization: false,
      evaluatedAt: decision.validity.evaluatedAt, reviewNoLaterThan: decision.validity.reviewNoLaterThan,
      freshEvaluationRequiredBefore: [...decision.validity.freshEvaluationRequiredBefore],
    },
    dimensions: Object.fromEntries(DIMENSIONS.map(name => [name, decision[name].status])),
    reasons: decision.blockers.map(({ dimension, status, code, paths }) => ({ dimension, status, code, paths: [...paths] })),
    routes: [...decision.routes],
  });
}
