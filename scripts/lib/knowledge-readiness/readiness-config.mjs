import path from 'node:path';

export const READINESS_SCHEMA_VERSION =
  'PHI-OS-CANONICAL-PRODUCTION-READINESS-v1.0.0';
export const READINESS_INDEX_SCHEMA_VERSION =
  'PHI-OS-CANONICAL-PRODUCTION-READINESS-INDEX-v1.0.0';
export const READINESS_CONTRACT_VERSION = 'PJA-W2F-A1-v1.0.0-Frozen';
export const DEFAULT_READINESS_LOCALE = 'zh-Hans';
export const READINESS_DIRECTORY = 'content/knowledge/editorial/readiness';
export const READINESS_SCHEMA_PATH =
  `${READINESS_DIRECTORY}/canonical-production-readiness.schema.json`;
export const READINESS_CONTRACT_PATH =
  `${READINESS_DIRECTORY}/universal-production-readiness-contract.json`;
export const READINESS_INDEX_PATH =
  `${READINESS_DIRECTORY}/canonical-production-readiness-index.json`;
export const READINESS_INVENTORY_PATH =
  'docs/pja/PJA-W2F-A-CANONICAL-READINESS-INVENTORY.md';

export const READINESS_STATUSES = Object.freeze([
  'not_assessed',
  'identity_ready',
  'thesis_draft',
  'boundary_draft',
  'ready_for_editorial_review',
  'changes_required',
  'production_ready',
  'production_blocked',
  'retired'
]);

export const ARTICLE_TREATMENTS = Object.freeze([
  'integrate',
  'briefly_address',
  'defer',
  'faq_candidate',
  'supporting_article_candidate',
  'video_candidate',
  'exclude'
]);

export const READINESS_ERROR_CODES = Object.freeze([
  'KNOWLEDGE_SCOPE_INVALID',
  'KNOWLEDGE_SCOPE_EMPTY',
  'CANONICAL_NODE_NOT_FOUND',
  'CANONICAL_NODE_TYPE_INVALID',
  'CANONICAL_NODE_INVENTORY_EMPTY',
  'BOOK_NOT_FOUND',
  'PART_NOT_FOUND',
  'BLUEPRINT_NOT_FOUND',
  'BLUEPRINT_MEMBERSHIP_MISMATCH',
  'READINESS_FILE_NOT_FOUND',
  'READINESS_ALREADY_EXISTS',
  'READINESS_SCHEMA_INVALID',
  'CANONICAL_IDENTITY_MISMATCH',
  'CANONICAL_HIERARCHY_MISMATCH',
  'CANONICAL_THESIS_NOT_READY',
  'CANONICAL_THESIS_DUPLICATED',
  'PART_THESIS_NOT_READY',
  'BOOK_CONTINUITY_MISMATCH',
  'PART_CONTINUITY_MISMATCH',
  'NODE_CONTINUITY_MISMATCH',
  'PRODUCTION_BOUNDARY_NOT_READY',
  'MUST_ESTABLISH_MISSING',
  'MUST_NOT_CLAIM_MISSING',
  'INCLUDED_SCOPE_MISSING',
  'EXCLUDED_SCOPE_MISSING',
  'SUPPORTING_QUESTION_NOT_FOUND',
  'SUPPORTING_QUESTION_MAPPING_INCOMPLETE',
  'SUPPORTING_QUESTION_MULTI_ASSIGNED',
  'PREVIOUS_NODE_MISMATCH',
  'NEXT_NODE_MISMATCH',
  'LEARNING_PATH_MISMATCH',
  'CLAIM_BOUNDARY_NOT_READY',
  'SOURCE_BOUNDARY_NOT_READY',
  'FIGURE_BOUNDARY_NOT_READY',
  'PUBLIC_BOUNDARY_NOT_READY',
  'LOCALIZED_CONTENT_NOT_READY',
  'BLOCKING_FINDINGS_PRESENT',
  'PRODUCTION_STATUS_INVALID',
  'VERSION_BINDING_MISSING',
  'PRODUCTION_READY_REQUIREMENTS_NOT_MET'
]);

export class ReadinessError extends Error {
  constructor(code, message, hint = null, details = null) {
    super(message);
    this.name = 'ReadinessError';
    this.code = code;
    this.hint = hint;
    this.details = details;
  }
}

export function formatReadinessError(error) {
  const code = error?.code || 'READINESS_SCHEMA_INVALID';
  const lines = [`${code}: ${error?.message || 'Unexpected readiness failure.'}`];
  if (error?.hint) lines.push(`Hint: ${error.hint}`);
  return lines.join('\n');
}

export function parseReadinessArgs(argv) {
  const positionals = [];
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) {
      positionals.push(value);
      continue;
    }
    const name = value.slice(2);
    if (name === 'json') {
      options.json = true;
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      throw new ReadinessError(
        'KNOWLEDGE_SCOPE_INVALID',
        `Option --${name} requires a value.`
      );
    }
    options[name] = next;
    index += 1;
  }
  if (positionals.length > 1 || positionals.length && options.scope) {
    throw new ReadinessError(
      'KNOWLEDGE_SCOPE_INVALID',
      'Provide one Node code or one --scope value, not both.'
    );
  }
  return {
    nodeCode: positionals[0] ?? null,
    scope: options.scope ?? null,
    locale: options.locale ?? DEFAULT_READINESS_LOCALE,
    options
  };
}

export function readinessFileName(nodeCode, locale = DEFAULT_READINESS_LOCALE) {
  const base = nodeCode.toLowerCase();
  return locale === DEFAULT_READINESS_LOCALE
    ? `${base}-production-readiness.json`
    : `${base}.${locale}-production-readiness.json`;
}

export function readinessRelativePath(nodeCode, locale = DEFAULT_READINESS_LOCALE) {
  return path.posix.join(READINESS_DIRECTORY, readinessFileName(nodeCode, locale));
}

export function canonicalNodePattern(nodeCode) {
  return /^KN-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(nodeCode);
}

export function isCanonicalKnowledgeNode(node) {
  return Boolean(
    node &&
    canonicalNodePattern(node.nodeCode) &&
    typeof node.nodeType === 'string' &&
    node.nodeType.length
  );
}

export function finding(code, message, field = null, severity = 'blocking') {
  return { code, message, field, severity };
}
