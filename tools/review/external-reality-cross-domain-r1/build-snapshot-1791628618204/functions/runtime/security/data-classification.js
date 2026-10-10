import {
  RUNTIME_DATA_CLASSIFICATIONS,
  SECURITY_ERROR_CODES,
  SECURITY_PRIVACY_CONTRACT_ID,
  SecurityPrivacyError
} from './security-contract.js';

const classificationSet = new Set(RUNTIME_DATA_CLASSIFICATIONS);

const sensitiveTokens = Object.freeze([
  'answer',
  'conversation',
  'message',
  'entry_text',
  'reported_experience',
  'medical',
  'health',
  'financial',
  'bank',
  'tax',
  'identity_document',
  'address',
  'phone',
  'email',
  'credential',
  'token',
  'secret'
]);

const professionalTokens = Object.freeze([
  'professional_record',
  'professional_workspace',
  'professional_review',
  'advisor_note',
  'qualified_assessment'
]);

function normalizedPath(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, '_');
}

function containsToken(path, tokens) {
  return tokens.some(token => path.includes(token));
}

export function assertRuntimeDataClassification(value) {
  const classification = String(value || '').trim().toLowerCase();
  if (!classificationSet.has(classification)) {
    throw new SecurityPrivacyError(
      SECURITY_ERROR_CODES.INVALID_INPUT,
      `Unsupported Runtime data classification: ${classification || 'empty'}`
    );
  }
  return classification;
}

export function classifyRuntimeData(input = {}) {
  const path = normalizedPath(input.path || input.field);
  const explicit = String(input.classification || '')
    .trim()
    .toLowerCase();

  if (explicit) {
    return Object.freeze({
      contract: SECURITY_PRIVACY_CONTRACT_ID,
      classification: assertRuntimeDataClassification(explicit),
      reason: 'explicit_classification'
    });
  }
  if (containsToken(path, sensitiveTokens)) {
    return Object.freeze({
      contract: SECURITY_PRIVACY_CONTRACT_ID,
      classification: 'sensitive',
      reason: 'sensitive_runtime_content'
    });
  }
  if (containsToken(path, professionalTokens)) {
    return Object.freeze({
      contract: SECURITY_PRIVACY_CONTRACT_ID,
      classification: 'professional',
      reason: 'professional_boundary_content'
    });
  }
  if (
    input.research_consent?.status === 'granted' &&
    input.research_consent?.withdrawn !== true
  ) {
    return Object.freeze({
      contract: SECURITY_PRIVACY_CONTRACT_ID,
      classification: 'research-consented',
      reason: 'explicit_research_consent'
    });
  }
  if (input.published === true && input.owner_approved === true) {
    return Object.freeze({
      contract: SECURITY_PRIVACY_CONTRACT_ID,
      classification: 'public',
      reason: 'owner_approved_publication'
    });
  }
  return Object.freeze({
    contract: SECURITY_PRIVACY_CONTRACT_ID,
    classification: 'private',
    reason: 'private_by_default'
  });
}

export default classifyRuntimeData;
