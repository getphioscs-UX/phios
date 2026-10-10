const EXPLICIT_SIGNALS = Object.freeze([
  ['crossBorderEstate', 'CROSS_BORDER_ESTATE'],
  ['complexTrust', 'COMPLEX_TRUST'],
  ['specialNeedsBeneficiary', 'SPECIAL_NEEDS_BENEFICIARY'],
  ['companySuccession', 'COMPANY_SUCCESSION'],
  ['conflictingOwnership', 'CONFLICTING_OWNERSHIP'],
  ['largeDigitalAssetArrangement', 'LARGE_DIGITAL_ASSET_ARRANGEMENT'],
  ['customClauseRequested', 'CUSTOM_CLAUSE'],
  ['nonStandardFamilyStructure', 'NON_STANDARD_FAMILY_STRUCTURE']
]);

export function evaluateWillEscalation(input = {}, jurisdictionRegistry = {}) {
  const signals = [];
  const explicitJurisdiction = typeof input.jurisdiction === 'string' ? input.jurisdiction.trim() : '';
  const jurisdiction = Array.isArray(jurisdictionRegistry.jurisdictions)
    ? jurisdictionRegistry.jurisdictions.find((entry) => entry.jurisdiction === explicitJurisdiction)
    : null;

  if (!explicitJurisdiction || !jurisdiction || jurisdiction.status !== 'PRODUCTION_APPROVED') {
    signals.push(Object.freeze({
      code: 'UNSUPPORTED_JURISDICTION',
      source: 'JURISDICTION_REGISTRY',
      detail: explicitJurisdiction || null,
      registryStatus: jurisdiction?.status ?? 'UNREGISTERED'
    }));
  }

  for (const [field, code] of EXPLICIT_SIGNALS) {
    if (input[field] === true) signals.push(Object.freeze({ code, source: `input.${field}` }));
  }

  if (signals.length === 0) {
    return Object.freeze({ status: 'CLEAR', automaticAssemblyBlocked: false, nextState: null, signals: Object.freeze([]) });
  }
  return Object.freeze({
    status: 'AUTOMATIC_ASSEMBLY_BLOCKED',
    automaticAssemblyBlocked: true,
    nextState: 'LEGAL_REVIEW_REQUIRED',
    signals: Object.freeze(signals)
  });
}

export default Object.freeze({ evaluateWillEscalation });
