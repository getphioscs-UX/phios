const STATUS = Object.freeze({
  VALID: 'VALID',
  INVALID: 'INVALID',
  INCOMPLETE: 'INCOMPLETE',
  PROFESSIONAL_REVIEW_REQUIRED: 'PROFESSIONAL_REVIEW_REQUIRED'
});

function issue(code, path, detail = null) {
  return Object.freeze({ code, path, ...(detail == null ? {} : { detail }) });
}

function asArray(value) { return Array.isArray(value) ? value : []; }
function finiteNumber(value) { return typeof value === 'number' && Number.isFinite(value); }

export function evaluateWillShareIntegrity(input = {}) {
  const beneficiaryIds = new Set(asArray(input.beneficiaryPersonIds));
  const residue = asArray(input.residuaryDistribution);
  const distributions = asArray(input.distributions);
  const invalid = [];
  const incomplete = [];
  const review = [];

  if (residue.length === 0) incomplete.push(issue('RESIDUE_DISTRIBUTION_MISSING', 'residuaryDistribution'));

  let residueTotal = 0;
  const residueByBeneficiary = new Map();
  for (let i = 0; i < residue.length; i += 1) {
    const row = residue[i] || {};
    const path = `residuaryDistribution[${i}]`;
    if (!row.beneficiaryPersonId || !beneficiaryIds.has(row.beneficiaryPersonId)) {
      incomplete.push(issue('UNRESOLVED_BENEFICIARY', `${path}.beneficiaryPersonId`, row.beneficiaryPersonId ?? null));
    }
    if (!finiteNumber(row.percentage)) {
      incomplete.push(issue('SHARE_MISSING_OR_NON_NUMERIC', `${path}.percentage`));
      continue;
    }
    if (row.percentage < 0) invalid.push(issue('NEGATIVE_SHARE', `${path}.percentage`, row.percentage));
    if (row.percentage > 100) invalid.push(issue('SHARE_OVER_100', `${path}.percentage`, row.percentage));
    residueTotal += row.percentage;
    if (row.beneficiaryPersonId) {
      if (residueByBeneficiary.has(row.beneficiaryPersonId) && residueByBeneficiary.get(row.beneficiaryPersonId) !== row.percentage) {
        invalid.push(issue('DUPLICATE_CONFLICTING_ASSIGNMENT', path, row.beneficiaryPersonId));
      }
      residueByBeneficiary.set(row.beneficiaryPersonId, row.percentage);
    }
    if (row.survivorshipCondition || row.ageCondition || row.trustCondition) {
      review.push(issue('CONDITIONAL_RESIDUE_REQUIRES_REVIEW', path));
    }
  }

  if (residue.length > 0 && Number.isFinite(residueTotal) && Math.abs(residueTotal - 100) > 1e-9) {
    invalid.push(issue('RESIDUE_TOTAL_NOT_100', 'residuaryDistribution', residueTotal));
  }

  const assignmentByKey = new Map();
  for (let i = 0; i < distributions.length; i += 1) {
    const row = distributions[i] || {};
    const path = `distributions[${i}]`;
    const ids = asArray(row.beneficiaryPersonIds);
    for (const personId of ids) {
      if (!beneficiaryIds.has(personId)) incomplete.push(issue('UNRESOLVED_BENEFICIARY', `${path}.beneficiaryPersonIds`, personId));
    }
    for (const share of asArray(row.percentageShares)) {
      if (!share?.beneficiaryPersonId || !beneficiaryIds.has(share.beneficiaryPersonId)) incomplete.push(issue('UNRESOLVED_BENEFICIARY', `${path}.percentageShares`, share?.beneficiaryPersonId ?? null));
      if (!finiteNumber(share?.percentage)) incomplete.push(issue('SHARE_MISSING_OR_NON_NUMERIC', `${path}.percentageShares`));
      else {
        if (share.percentage < 0) invalid.push(issue('NEGATIVE_SHARE', `${path}.percentageShares`, share.percentage));
        if (share.percentage > 100) invalid.push(issue('SHARE_OVER_100', `${path}.percentageShares`, share.percentage));
      }
    }
    const key = `${row.distributionType ?? 'UNKNOWN'}::${row.assetId ?? 'NO_ASSET'}::${ids.slice().sort().join(',')}`;
    const signature = JSON.stringify({ percentageShares: row.percentageShares ?? null, substituteBeneficiaryPersonIds: row.substituteBeneficiaryPersonIds ?? null });
    if (assignmentByKey.has(key) && assignmentByKey.get(key) !== signature) invalid.push(issue('DUPLICATE_CONFLICTING_ASSIGNMENT', path, key));
    assignmentByKey.set(key, signature);
    if (['CLASS_DISTRIBUTION','SURVIVORSHIP_CONDITION','AGE_CONDITION','TRUST_CONDITION'].includes(row.distributionType) || row.classDefinition || row.survivorshipCondition || row.ageCondition || row.trustCondition) {
      review.push(issue('COMPLEX_DISTRIBUTION_REQUIRES_REVIEW', path));
    }
  }

  let status = STATUS.VALID;
  if (invalid.length) status = STATUS.INVALID;
  else if (incomplete.length) status = STATUS.INCOMPLETE;
  else if (review.length) status = STATUS.PROFESSIONAL_REVIEW_REQUIRED;

  return Object.freeze({
    status,
    residueTotal,
    repaired: false,
    issues: Object.freeze([...invalid, ...incomplete, ...review]),
    counts: Object.freeze({ invalid: invalid.length, incomplete: incomplete.length, professionalReview: review.length })
  });
}

export { STATUS as WILL_SHARE_INTEGRITY_STATUS };
export default Object.freeze({ evaluateWillShareIntegrity, WILL_SHARE_INTEGRITY_STATUS: STATUS });
