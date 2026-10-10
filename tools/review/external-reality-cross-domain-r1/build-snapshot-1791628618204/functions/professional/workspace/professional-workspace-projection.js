const PRIORITY_WEIGHT = Object.freeze({
  urgent: 0,
  high: 1,
  normal: 2
});

export const FINANCIAL_CLIENT_FILTERS = Object.freeze({
  awaiting_financial_intake: client =>
    ['not_started', 'awaiting'].includes(client.financial_intake_status),
  awaiting_documents: client =>
    ['not_started', 'awaiting', 'partial'].includes(client.documents_status),
  financial_analysis_in_progress: client =>
    client.financial_review_status === 'analysis_in_progress',
  professional_review_required: client =>
    client.financial_review_status === 'professional_review_required',
  financial_consultation_pending: client =>
    client.financial_review_status === 'consultation_pending',
  navigation_plan_pending: client =>
    client.financial_review_status === 'navigation_plan_pending',
  implementation_review_due: client =>
    client.financial_review_status === 'implementation_review_due',
  annual_review_due: client =>
    client.financial_review_status === 'annual_review_due'
});

export const FINANCIAL_TASK_TYPES = Object.freeze(new Set([
  'financial_intake_received', 'bank_records_pending',
  'income_evidence_pending', 'expense_evidence_pending',
  'insurance_documents_pending', 'investment_statements_pending',
  'property_documents_pending', 'liability_details_pending',
  'calculation_review_required', 'financial_recommendation_review',
  'client_clarification_required', 'annual_review_due'
]));

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function buildProfessionalClientList(clients = [], filter = {}) {
  const source = Array.isArray(clients) ? clients : [];
  const serviceId = cleanText(filter.service_id);
  const status = cleanText(filter.status);
  const consentStatus = cleanText(filter.consent_status);
  const financialFilter = cleanText(filter.financial_filter);
  if (
    financialFilter &&
    !Object.hasOwn(FINANCIAL_CLIENT_FILTERS, financialFilter)
  ) {
    throw new TypeError('Unsupported financial client filter.');
  }
  return Object.freeze(source.filter(client => (
    (!serviceId || client.service_id === serviceId) &&
    (!status || client.professional_status === status) &&
    (!consentStatus || client.consent_status === consentStatus) &&
    (!financialFilter || FINANCIAL_CLIENT_FILTERS[financialFilter](client))
  )).map(client => Object.freeze({ ...client })));
}

export function buildProfessionalReviewQueue(tasks = [], filter = {}) {
  const source = Array.isArray(tasks) ? tasks : [];
  const taskType = cleanText(filter.task_type);
  const status = cleanText(filter.status);
  const professionalId = cleanText(filter.assigned_professional_id);
  const financialOnly = filter.financial_only === true;
  return Object.freeze(source.filter(task => (
    (!taskType || task.task_type === taskType) &&
    (!status || task.status === status) &&
    (!professionalId ||
      task.assigned_professional_id === professionalId) &&
    (!financialOnly || FINANCIAL_TASK_TYPES.has(task.task_type))
  )).sort((left, right) => {
    const priority = (PRIORITY_WEIGHT[left.priority] ?? 9) -
      (PRIORITY_WEIGHT[right.priority] ?? 9);
    if (priority !== 0) return priority;
    return Date.parse(left.due_at) - Date.parse(right.due_at);
  }).map(task => Object.freeze({ ...task })));
}

export default Object.freeze({
  buildProfessionalClientList,
  buildProfessionalReviewQueue
});
