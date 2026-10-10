import { canonicalClone } from './canonical-json.js';

export const DAR_CLAUSE_RESOLVER_VERSION = '1.0.0';

function asArray(value) { return Array.isArray(value) ? value : []; }

function getPath(source, path) {
  if (!path) return undefined;
  const parts = String(path).replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  let current = source;
  for (const part of parts) {
    if (current == null || !Object.prototype.hasOwnProperty.call(Object(current), part)) return undefined;
    current = current[part];
  }
  return current;
}

function predicateMatches(input, predicate = {}) {
  const value = getPath(input, predicate.field);
  if (Object.prototype.hasOwnProperty.call(predicate, 'equals')) return value === predicate.equals;
  if (predicate.nonEmpty === true) return Array.isArray(value) ? value.length > 0 : typeof value === 'string' ? value.trim().length > 0 : value != null;
  return false;
}

function parameterMap(input, requiredFields) {
  const parameters = {};
  for (const field of requiredFields) {
    const value = getPath(input, field);
    if (value === undefined || value === null || value === '') throw new Error(`DAR_CLAUSE_REQUIRED_FIELD_MISSING:${field}`);
    parameters[field] = canonicalClone(value);
  }
  return parameters;
}

function scalarToText(value, field) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  throw new Error(`DAR_CLAUSE_NON_SCALAR_BINDING_FORBIDDEN:${field}`);
}

function bindApprovedText(approvedText, parameters, requiredFields) {
  if (typeof approvedText !== 'string' || approvedText.length === 0) throw new Error('DAR_CLAUSE_APPROVED_TEXT_MISSING');
  const allowed = new Set(requiredFields);
  const token = /\{\{field:([A-Za-z0-9_.\[\]-]+)\}\}/g;
  const bound = approvedText.replace(token, (_, field) => {
    if (!allowed.has(field)) throw new Error(`DAR_CLAUSE_UNDECLARED_BINDING:${field}`);
    if (!Object.prototype.hasOwnProperty.call(parameters, field)) throw new Error(`DAR_CLAUSE_UNRESOLVED_BINDING:${field}`);
    return scalarToText(parameters[field], field);
  });
  if (/\{\{field:[^}]+\}\}/.test(bound)) throw new Error('DAR_CLAUSE_UNRESOLVED_BINDING');
  return bound;
}

function addUnique(list, value) {
  if (!list.includes(value)) list.push(value);
}

export function resolveClauses({ input = {}, template = {}, clauseRegistry = {}, selectionRules = {} } = {}) {
  const issues = [];
  const matchedRules = [];
  const requested = [];
  for (const clauseId of asArray(template.baseClauseIds)) addUnique(requested, clauseId);

  for (const rule of asArray(selectionRules.rules)) {
    if (!predicateMatches(input, rule.predicate)) continue;
    matchedRules.push(Object.freeze({ ruleId: rule.ruleId, disposition: rule.disposition, predicate: canonicalClone(rule.predicate) }));
    if (rule.disposition === 'AUTOMATIC_ASSEMBLY_BLOCKED') issues.push(Object.freeze({ code: 'RULE_BLOCKS_AUTOMATIC_ASSEMBLY', ruleId: rule.ruleId }));
    if (rule.disposition === 'LEGAL_REVIEW_REQUIRED') issues.push(Object.freeze({ code: 'RULE_REQUIRES_LEGAL_REVIEW', ruleId: rule.ruleId }));
    for (const clauseId of asArray(rule.candidateClauseIds)) addUnique(requested, clauseId);
  }

  const order = new Map(asArray(template.sectionOrder).map((id, index) => [id, index]));
  requested.sort((a, b) => (order.get(a) ?? Number.MAX_SAFE_INTEGER) - (order.get(b) ?? Number.MAX_SAFE_INTEGER) || a.localeCompare(b));

  const registryById = new Map(asArray(clauseRegistry.clauses).map((clause) => [clause.clauseId, clause]));
  const sections = [];
  for (const clauseId of requested) {
    const clause = registryById.get(clauseId);
    if (!clause) {
      issues.push(Object.freeze({ code: 'CLAUSE_REFERENCE_UNKNOWN', clauseId }));
      continue;
    }
    if (clause.approvalStatus !== 'APPROVED_TEMPLATE_COMPONENT' || !clause.approvalDigest || !clause.version || !clause.approvedText) {
      issues.push(Object.freeze({ code: 'CLAUSE_NOT_APPROVED', clauseId, approvalStatus: clause.approvalStatus ?? null }));
      continue;
    }
    if (!input.jurisdiction || clause.jurisdiction !== input.jurisdiction) {
      issues.push(Object.freeze({ code: 'CLAUSE_JURISDICTION_MISMATCH', clauseId, clauseJurisdiction: clause.jurisdiction ?? null, documentJurisdiction: input.jurisdiction ?? null }));
      continue;
    }
    try {
      const requiredFields = asArray(clause.requiredFields);
      const parameters = parameterMap(input, requiredFields);
      const renderText = bindApprovedText(clause.approvedText, parameters, requiredFields);
      const conditionEvidence = matchedRules
        .filter((rule) => asArray(selectionRules.rules).find((candidate) => candidate.ruleId === rule.ruleId)?.candidateClauseIds?.includes(clauseId))
        .map((rule) => canonicalClone(rule));
      sections.push(Object.freeze({
        clauseId,
        clauseVersion: clause.version,
        approvalDigest: clause.approvalDigest,
        parameters: Object.freeze(parameters),
        sourceFields: Object.freeze([...requiredFields]),
        conditionEvidence: Object.freeze(conditionEvidence),
        renderText
      }));
    } catch (error) {
      issues.push(Object.freeze({ code: 'CLAUSE_PARAMETER_BINDING_FAILED', clauseId, detail: String(error.message || error) }));
    }
  }

  const legalReviewRequired = issues.some((entry) => entry.code === 'RULE_REQUIRES_LEGAL_REVIEW');
  const fatal = issues.length > 0;
  return Object.freeze({
    status: fatal ? (legalReviewRequired ? 'LEGAL_REVIEW_REQUIRED' : 'AUTOMATIC_ASSEMBLY_BLOCKED') : 'RESOLVED',
    automaticAssemblyBlocked: fatal,
    requestedClauseIds: Object.freeze([...requested]),
    matchedRules: Object.freeze(matchedRules),
    sections: Object.freeze(fatal ? [] : sections),
    issues: Object.freeze(issues)
  });
}

export default Object.freeze({ resolveClauses, DAR_CLAUSE_RESOLVER_VERSION });
