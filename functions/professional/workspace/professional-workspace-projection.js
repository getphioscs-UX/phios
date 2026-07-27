const PRIORITY_WEIGHT = Object.freeze({
  urgent: 0,
  high: 1,
  normal: 2
});

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function buildProfessionalClientList(clients = [], filter = {}) {
  const source = Array.isArray(clients) ? clients : [];
  const serviceId = cleanText(filter.service_id);
  const status = cleanText(filter.status);
  const consentStatus = cleanText(filter.consent_status);
  return Object.freeze(source.filter(client => (
    (!serviceId || client.service_id === serviceId) &&
    (!status || client.professional_status === status) &&
    (!consentStatus || client.consent_status === consentStatus)
  )).map(client => Object.freeze({ ...client })));
}

export function buildProfessionalReviewQueue(tasks = [], filter = {}) {
  const source = Array.isArray(tasks) ? tasks : [];
  const taskType = cleanText(filter.task_type);
  const status = cleanText(filter.status);
  const professionalId = cleanText(filter.assigned_professional_id);
  return Object.freeze(source.filter(task => (
    (!taskType || task.task_type === taskType) &&
    (!status || task.status === status) &&
    (!professionalId ||
      task.assigned_professional_id === professionalId)
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
