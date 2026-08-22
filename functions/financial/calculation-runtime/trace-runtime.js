/** PHI OS FCR-W18 trace runtime. */
export function createTrace({ traceId, engineCode, resultCode, formula, inputReferences = [], assumptionReferences = [], notes = [] }) {
  if (!traceId || !engineCode || !resultCode || !formula) throw new TypeError('FCR trace identity and formula are required.');
  return Object.freeze({
    traceId, engineCode, resultCode, formula,
    inputReferences: Object.freeze([...new Set(inputReferences.filter(Boolean))]),
    assumptionReferences: Object.freeze([...new Set(assumptionReferences.filter(Boolean))]),
    notes: Object.freeze([...notes]),
    recommendationCreated: false,
    professionalJudgmentCreated: false
  });
}
