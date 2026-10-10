export const FINANCIAL_AUTHORITY_VERSION =
  'phi-os.financial-professional-authority.v1';

export const FINANCIAL_PERMITTED_SERVICE_SCOPES = Object.freeze([
  'financial_fact_finding',
  'financial_position_reconstruction',
  'financial_stamina_analysis',
  'financial_risk_review',
  'goal_prioritisation',
  'product_neutral_navigation',
  'implementation_review',
  'scheduled_review'
]);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredText(value, field) {
  const text = cleanText(value);
  if (!text) throw new TypeError(`${field} is required.`);
  return text;
}

function isoDate(value, field) {
  const time = Date.parse(cleanText(value));
  if (!Number.isFinite(time)) throw new TypeError(`${field} must be a date.`);
  return new Date(time).toISOString();
}

function scopes(values) {
  const result = [];
  for (const value of Array.isArray(values) ? values : []) {
    const scope = cleanText(value);
    if (!FINANCIAL_PERMITTED_SERVICE_SCOPES.includes(scope)) {
      throw new TypeError('Unsupported Financial professional service scope.');
    }
    if (!result.includes(scope)) result.push(scope);
  }
  if (result.length === 0) {
    throw new TypeError('Professional authority requires permitted scopes.');
  }
  return result;
}

export function createFinancialProfessionalAuthority(
  input = {},
  options = {}
) {
  const issuedAt = isoDate(
    options.now || input.issued_at || new Date().toISOString(),
    'issued_at'
  );
  const expiresAt = isoDate(input.expiry_date, 'expiry_date');
  if (expiresAt <= issuedAt) {
    throw new TypeError('Professional authority expiry must be in the future.');
  }
  return Object.freeze({
    contract: FINANCIAL_AUTHORITY_VERSION,
    authority_record_id: requiredText(
      input.authority_record_id,
      'authority_record_id'
    ),
    professional_id: requiredText(input.professional_id, 'professional_id'),
    professional_qualification: requiredText(
      input.professional_qualification,
      'professional_qualification'
    ),
    licence_or_registration: requiredText(
      input.licence_or_registration,
      'licence_or_registration'
    ),
    jurisdiction: requiredText(input.jurisdiction, 'jurisdiction'),
    permitted_service_scopes: Object.freeze(
      scopes(input.permitted_service_scopes)
    ),
    restricted_product_advice:
      input.restricted_product_advice !== false,
    insurance_scope: cleanText(input.insurance_scope) || 'none',
    investment_scope: cleanText(input.investment_scope) || 'none',
    tax_scope: cleanText(input.tax_scope) || 'none',
    estate_scope: cleanText(input.estate_scope) || 'none',
    issued_at: issuedAt,
    expiry_date: expiresAt,
    status: cleanText(input.status) || 'active',
    product_specific_advice_enabled: false
  });
}

export function authorizeFinancialProfessionalAction(
  authority,
  request = {},
  options = {}
) {
  if (authority?.contract !== FINANCIAL_AUTHORITY_VERSION) {
    throw new TypeError('A valid Financial professional authority is required.');
  }
  const now = isoDate(
    options.now || request.requested_at || new Date().toISOString(),
    'requested_at'
  );
  if (authority.status !== 'active' || authority.expiry_date <= now) {
    throw new TypeError('Financial professional authority is inactive or expired.');
  }
  if (authority.jurisdiction !== cleanText(request.jurisdiction)) {
    throw new TypeError('Financial professional jurisdiction does not match.');
  }
  const serviceScope = cleanText(request.service_scope);
  if (!authority.permitted_service_scopes.includes(serviceScope)) {
    throw new TypeError('Financial professional action is outside permitted scope.');
  }
  if (request.product_specific === true) {
    throw new TypeError(
      'Product-specific advice requires a later separate regulated step.'
    );
  }
  const specialistScope = cleanText(request.specialist_scope);
  if (
    specialistScope &&
    !['insurance', 'investment', 'tax', 'estate'].includes(specialistScope)
  ) {
    throw new TypeError('Unsupported Financial specialist scope.');
  }
  if (
    specialistScope &&
    authority[`${specialistScope}_scope`] === 'none'
  ) {
    throw new TypeError('Financial specialist action is outside authority.');
  }

  return Object.freeze({
    contract: FINANCIAL_AUTHORITY_VERSION,
    authority_record_id: authority.authority_record_id,
    professional_id: authority.professional_id,
    service_scope: serviceScope,
    jurisdiction: authority.jurisdiction,
    allowed: true,
    product_specific: false,
    restricted_product_advice: authority.restricted_product_advice,
    workspace_sign_off_allowed: true,
    conflict_disclosure_required_for_product_step: true,
    commission_disclosure_required_for_product_step: true
  });
}

export default Object.freeze({
  createFinancialProfessionalAuthority,
  authorizeFinancialProfessionalAction
});
