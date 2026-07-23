export const FINANCIAL_PRODUCT_NEUTRAL_VERSION =
  'phi-os.financial-product-neutral-boundary.v1';

export const FINANCIAL_POSITION_GATE_SECTIONS = Object.freeze([
  'current_financial_position',
  'confirmed_risks',
  'goal_constraints',
  'missing_data',
  'available_options'
]);

export const PRODUCT_NEUTRAL_DIRECTIONS = Object.freeze([
  'cash_flow_stabilisation',
  'emergency_reserve',
  'debt_restructuring_review',
  'expense_adjustment',
  'insurance_gap_review',
  'investment_allocation_review',
  'property_exposure_review',
  'tax_planning_review',
  'retirement_funding',
  'education_funding',
  'estate_preparation',
  'business_continuity'
]);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredText(value, field) {
  const text = cleanText(value);
  if (!text) throw new TypeError(`${field} is required.`);
  return text;
}

function references(values, field) {
  const result = [];
  for (const value of Array.isArray(values) ? values : []) {
    const text = requiredText(value, field);
    if (!result.includes(text)) result.push(text);
  }
  return result;
}

export function createFinancialPositionGate(input = {}) {
  const sections = {};
  for (const section of FINANCIAL_POSITION_GATE_SECTIONS) {
    const value = input.sections?.[section];
    if (
      !value ||
      value.complete !== true ||
      references(value.evidence_references, section).length === 0
    ) {
      throw new TypeError(
        `Financial position gate is incomplete: ${section}`
      );
    }
    sections[section] = Object.freeze({
      complete: true,
      evidence_references: Object.freeze(
        references(value.evidence_references, section)
      )
    });
  }
  return Object.freeze({
    contract: FINANCIAL_PRODUCT_NEUTRAL_VERSION,
    gate_id: requiredText(input.gate_id, 'gate_id'),
    household_id: requiredText(input.household_id, 'household_id'),
    sections: Object.freeze(sections),
    ready_for_product_neutral_direction: true,
    ready_for_product_specific_advice: false
  });
}

export function createProductNeutralDirection(input = {}) {
  if (
    input.position_gate?.contract !== FINANCIAL_PRODUCT_NEUTRAL_VERSION ||
    input.position_gate.ready_for_product_neutral_direction !== true
  ) {
    throw new TypeError('Completed Financial position gate is required.');
  }
  if (input.authority?.allowed !== true || input.authority.product_specific) {
    throw new TypeError('Permitted product-neutral authority is required.');
  }
  const direction = cleanText(input.direction_type);
  if (!PRODUCT_NEUTRAL_DIRECTIONS.includes(direction)) {
    throw new TypeError('A supported product-neutral direction is required.');
  }
  for (const field of [
    'product_identifier',
    'provider_identifier',
    'fund_identifier',
    'policy_identifier',
    'loan_identifier',
    'transaction_instruction'
  ]) {
    if (cleanText(input[field])) {
      throw new TypeError(
        'Product-neutral direction cannot identify a product or transaction.'
      );
    }
  }
  const evidence = references(input.evidence_references, 'evidence_references');
  if (evidence.length === 0) {
    throw new TypeError('Product-neutral direction requires evidence.');
  }
  return Object.freeze({
    contract: FINANCIAL_PRODUCT_NEUTRAL_VERSION,
    direction_id: requiredText(input.direction_id, 'direction_id'),
    household_id: input.position_gate.household_id,
    direction_type: direction,
    reason: requiredText(input.reason, 'reason'),
    evidence_references: Object.freeze(evidence),
    constraint_references: Object.freeze(
      references(input.constraint_references, 'constraint_references')
    ),
    missing_data_references: Object.freeze(
      references(input.missing_data_references, 'missing_data_references')
    ),
    first_action: requiredText(input.first_action, 'first_action'),
    review_point: requiredText(input.review_point, 'review_point'),
    product_specific: false,
    transaction_created: false,
    client_decision_required: true,
    automatic_execution: false,
    regulated_step_required_for_product_advice: true
  });
}

export function evaluateProductSpecificStep(input = {}) {
  return Object.freeze({
    contract: FINANCIAL_PRODUCT_NEUTRAL_VERSION,
    requested: input.product_specific === true,
    allowed: false,
    reason: 'separate_regulated_step_not_enabled',
    conflict_disclosure_required: true,
    commission_disclosure_required: true,
    qualified_authority_required: true,
    client_decision_required: true
  });
}

export default Object.freeze({
  createFinancialPositionGate,
  createProductNeutralDirection,
  evaluateProductSpecificStep
});
