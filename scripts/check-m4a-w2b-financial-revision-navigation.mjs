import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createProfessionalConsent } from '../functions/professional/consent/professional-consent-contract.js';
import {
  createProfessionalWorkspace,
  activateProfessionalWorkspace
} from '../functions/professional/workspace/professional-workspace-contract.js';
import {
  createFinancialRevision,
  reviseFinancialRevision,
  buildFinancialRecalculationRequest,
  FINANCIAL_RECALCULATION_TRIGGERS,
  FINANCIAL_NAVIGATION_DOMAINS,
  FINANCIAL_TIMELINE_EVENTS
} from '../functions/professional/financial/financial-workspace-contract.js';
import {
  createFinancialNavigationRecommendation
} from '../functions/professional/financial/financial-navigation-recommendation-contract.js';
import {
  createProfessionalFollowUpTimeline,
  appendProfessionalFollowUpEvent,
  projectProfessionalFollowUpTimeline,
  FINANCIAL_FOLLOW_UP_EVENT_TYPES
} from '../functions/professional/workspace/professional-follow-up-timeline-contract.js';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const registry = JSON.parse(await read(
  'content/registry/m4a-w2b-financial-revision-navigation.json'
));
const page = await read('professional-workspace.html');
const controller = await read('assets/js/pages/professional-workspace.js');
const en = await read('assets/js/locales/en/professional.js');
const zh = await read('assets/js/locales/zh-Hans/professional.js');

assert.equal(registry.baseline, 'a488215be9688b25348cadb34a1ce65de921d259');
assert.deepEqual(
  Object.keys(FINANCIAL_RECALCULATION_TRIGGERS),
  registry.recalculation_trigger_domains
);
assert.deepEqual(FINANCIAL_NAVIGATION_DOMAINS, registry.navigation_domains);
assert.deepEqual(FINANCIAL_TIMELINE_EVENTS, registry.financial_timeline_events);
assert.deepEqual(FINANCIAL_FOLLOW_UP_EVENT_TYPES, FINANCIAL_TIMELINE_EVENTS);

const revision = createFinancialRevision({
  revision_id: 'revision_income_1',
  data_date: '2026-07-01',
  field_path: 'income.employment.amount',
  previous_value: 10000,
  updated_value: 12000,
  source_document: 'payslip_july',
  changed_by: 'professional_1',
  changed_at: '2026-07-29',
  reason: 'Updated verified income',
  calculation_impact: 'cash_flow_and_ratios',
  recommendation_impact: 'review_required',
  previous_data_version: 2,
  revised_data_version: 3
});
assert.equal(revision.previous_value_preserved, true);
assert.equal(revision.silent_overwrite, false);
assert.equal(revision.recalculation_required, true);
assert.ok(revision.impacted_metrics.includes('total_income'));
assert.equal(revision.downstream_calculations_stale, true);
assert.equal(revision.downstream_recommendations_stale, true);
const nextRevision = reviseFinancialRevision(revision, {
  revision_id: 'revision_income_2',
  data_date: '2026-08-01',
  field_path: 'income.employment.amount',
  updated_value: 12500,
  source_document: 'payslip_august',
  changed_by: 'professional_1',
  changed_at: '2026-08-02',
  reason: 'New month',
  calculation_impact: 'cash_flow_and_ratios',
  recommendation_impact: 'review_required'
});
assert.equal(nextRevision.previous_revision_id, revision.revision_id);
assert.equal(nextRevision.previous_value, revision.updated_value);
assert.equal(nextRevision.revised_data_version, 4);
const recalculation = buildFinancialRecalculationRequest(revision);
assert.equal(recalculation.old_calculation_overwritten, false);
assert.equal(recalculation.automatic_recommendation_created, false);
assert.equal(recalculation.status, 'pending_professional_review');

const workspace = createProfessionalWorkspace({
  workspace_id: 'workspace_financial_w2b',
  client_id: 'client_financial_w2b',
  professional_id: 'professional_financial_w2b',
  service_id: 'financial_navigation',
  current_runtime_id: 'runtime_financial_w2b'
});
const consent = createProfessionalConsent({
  consent_id: 'consent_financial_w2b',
  client_id: workspace.client_id,
  professional_id: workspace.professional_id,
  service_id: workspace.service_id,
  purpose: 'Financial Navigation review',
  consent_version: '1.0.0',
  duration: 'thirty_days',
  explicit_action: true,
  resource_scopes: ['navigation'],
  financial_data_scopes: ['income', 'expenses', 'liabilities'],
  acknowledgements: {
    scope_selected: true, data_accuracy: true,
    future_access_revocable: true,
    information_and_date_basis: true,
    missing_or_incorrect_data_affects_analysis: true,
    projections_use_assumptions: true,
    future_results_not_guaranteed: true,
    client_retains_final_decision: true,
    regulated_professional_may_be_required: true
  }
}, { now: '2026-07-29T00:00:00.000Z' });
const active = activateProfessionalWorkspace(workspace, consent, {
  now: '2026-07-30T00:00:00.000Z'
});
const recommendationInput = {
  recommendation_id: 'recommendation_reserve_1',
  domain: 'emergency_reserve',
  priority: 1,
  current_condition: 'Liquidity covers fewer than three months.',
  confirmed_evidence: ['Bank balance dated 2026-07-01', 'Expense record'],
  target_condition: 'Build an agreed reserve range.',
  recommended_action: 'Review a staged reserve contribution.',
  alternative_options: ['Adjust the target period', 'Review expenses first'],
  required_resources: ['Verified monthly expenses'],
  responsible_person: 'Client',
  target_date: '2026-12-31',
  risks: ['Income volatility'],
  dependencies: ['Complete expense verification'],
  review_trigger: 'Income or expenses change materially'
};
const recommendation = createFinancialNavigationRecommendation(
  active,
  recommendationInput,
  { now: '2026-07-30T00:00:00.000Z' }
);
assert.equal(recommendation.product_neutral, true);
assert.equal(recommendation.client_choice_required, true);
assert.equal(recommendation.required_action, null);
assert.equal(recommendation.guaranteed_outcome, false);
assert.equal(recommendation.runtime_navigation_overwritten, false);
assert.throws(() => createFinancialNavigationRecommendation(active, {
  ...recommendationInput,
  recommendation_id: 'bad_product',
  product_name: 'Specific Product'
}), /cannot set product_name/);
assert.throws(() => createFinancialNavigationRecommendation(active, {
  ...recommendationInput,
  recommendation_id: 'bad_ratio',
  based_on_single_ratio: true
}), /cannot rely on one ratio/);

let timeline = createProfessionalFollowUpTimeline(active);
timeline = appendProfessionalFollowUpEvent(active, timeline, {
  event_id: 'event_revision',
  event_type: 'financial_data_updated',
  event_label: 'Income updated',
  source_record_id: revision.revision_id,
  revision_id: revision.revision_id,
  data_date: revision.data_date,
  client_visible: true
}, { now: '2026-07-30T00:00:00.000Z' });
timeline = appendProfessionalFollowUpEvent(active, timeline, {
  event_id: 'event_navigation',
  event_type: 'navigation_plan_delivered',
  event_label: 'Financial Navigation delivered',
  source_record_id: recommendation.recommendation_id,
  recommendation_id: recommendation.recommendation_id,
  previous_event_id: 'event_revision',
  client_visible: true
}, { now: '2026-07-31T00:00:00.000Z' });
timeline = appendProfessionalFollowUpEvent(active, timeline, {
  event_id: 'event_runtime',
  event_type: 'report_drafted',
  event_label: 'Runtime report drafted',
  source_record_id: 'report_1'
}, { now: '2026-08-01T00:00:00.000Z' });
assert.equal(timeline.events.length, 3);
assert.equal(timeline.events[0].financial_event, true);
const financialTimeline = projectProfessionalFollowUpTimeline(timeline, {
  financial_only: true
});
assert.equal(financialTimeline.events.length, 2);
assert.equal(financialTimeline.append_only, true);
assert.equal(timeline.events.length, 3);

for (const token of [
  'professionalFinancialRevisionsOnly',
  'professionalFinancialNavigationOnly',
  'professionalFinancialTimelineOnly'
]) assert.ok(page.includes(token), `Missing Workspace control ${token}`);
for (const token of [
  'financial_revisions', 'financial_navigation_recommendations',
  'financialRevisionBoundary', 'financialNavigationBoundary'
]) assert.ok(controller.includes(token), `Missing Workspace projection ${token}`);
for (const forbidden of ['fetch(', 'localStorage', 'sessionStorage', '/api/']) {
  assert.equal(controller.includes(forbidden), false);
}
for (const key of [
  'financialRevisionsOnly', 'financialNavigationOnly',
  'financialTimelineOnly', 'financialNavigationBoundary'
]) {
  assert.ok(en.includes(`${key}:`)); assert.ok(zh.includes(`${key}:`));
}
assert.equal(registry.boundaries.silent_overwrite_allowed, false);
assert.equal(registry.boundaries.automatic_product_purchase, false);
assert.equal(registry.boundaries.guaranteed_return, false);
assert.equal(registry.boundaries.runtime_navigation_overwritten, false);

console.log('✓ M4A-W2B Financial Revision and Navigation Operationalization passed: versioned revisions, recalculation impact, product-neutral recommendations and append-only financial follow-up are aligned.');
