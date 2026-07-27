import {
  FINANCIAL_NAVIGATION_DOMAINS
} from './financial-workspace-contract.js';

export const FINANCIAL_NAVIGATION_RECOMMENDATION_VERSION =
  'phi-os.financial-navigation-recommendation.v1';

const clean = value => typeof value === 'string' ? value.trim() : '';
const required = (value, field) => {
  const text = clean(value);
  if (!text) throw new TypeError(`${field} is required.`);
  return text;
};
const list = (value, field) => {
  if (!Array.isArray(value) || !value.length) {
    throw new TypeError(`${field} must contain at least one item.`);
  }
  return Object.freeze(value.map(item => required(item, field)));
};

export function createFinancialNavigationRecommendation(
  workspace,
  input = {},
  options = {}
) {
  if (
    workspace?.consent_validated !== true ||
    workspace?.view_financial_reality !== true ||
    workspace?.status === 'access_revoked'
  ) {
    throw new TypeError(
      'Financial Navigation requires active financial-data consent.'
    );
  }
  const domain = clean(input.domain);
  if (!FINANCIAL_NAVIGATION_DOMAINS.includes(domain)) {
    throw new TypeError('Unsupported Financial Navigation domain.');
  }
  for (const forbidden of [
    'product_id', 'product_name', 'required_purchase',
    'required_sale', 'guaranteed_return'
  ]) {
    if (input[forbidden]) {
      throw new TypeError(
        `Financial Navigation cannot set ${forbidden}.`
      );
    }
  }
  if (input.based_on_single_ratio === true) {
    throw new TypeError(
      'A major financial direction cannot rely on one ratio alone.'
    );
  }
  if (clean(input.required_action)) {
    throw new TypeError(
      'Financial Navigation cannot create a required action.'
    );
  }
  return Object.freeze({
    schema_version: FINANCIAL_NAVIGATION_RECOMMENDATION_VERSION,
    recommendation_id: required(
      input.recommendation_id,
      'recommendation_id'
    ),
    workspace_id: workspace.workspace_id,
    client_id: workspace.client_id,
    service_id: workspace.service_id,
    domain,
    priority: Number(input.priority) || 0,
    current_condition: required(
      input.current_condition,
      'current_condition'
    ),
    confirmed_evidence: list(
      input.confirmed_evidence,
      'confirmed_evidence'
    ),
    target_condition: required(input.target_condition, 'target_condition'),
    recommended_action: required(
      input.recommended_action,
      'recommended_action'
    ),
    alternative_options: list(
      input.alternative_options,
      'alternative_options'
    ),
    required_resources: list(
      input.required_resources,
      'required_resources'
    ),
    responsible_person: required(
      input.responsible_person,
      'responsible_person'
    ),
    target_date: new Date(input.target_date).toISOString(),
    risks: list(input.risks, 'risks'),
    dependencies: list(input.dependencies, 'dependencies'),
    review_trigger: required(input.review_trigger, 'review_trigger'),
    status: clean(input.status) || 'professional_review',
    created_by: required(
      input.created_by || workspace.professional_id,
      'created_by'
    ),
    created_at: new Date(
      options.now || input.created_at || new Date()
    ).toISOString(),
    product_neutral: true,
    client_choice_required: true,
    required_action: null,
    guaranteed_outcome: false,
    based_on_single_ratio: false,
    runtime_navigation_overwritten: false,
    runtime_evidence_written: false
  });
}

export default Object.freeze({
  createFinancialNavigationRecommendation
});
