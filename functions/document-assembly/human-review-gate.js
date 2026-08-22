import { sha256Hex } from './digest.js';
import { canonicalClone } from './canonical-json.js';

export const DAR_REQUIRED_CONFIRMATIONS = Object.freeze([
  'REVIEWED_NAMES','REVIEWED_BENEFICIARIES','REVIEWED_ASSET_ALLOCATIONS','REVIEWED_RESIDUE','EXPORT_NOT_EXECUTION'
]);

export function evaluateHumanReview({ ir = {}, validation = {}, escalation = {}, confirmations = {} } = {}) {
  const missing = DAR_REQUIRED_CONFIRMATIONS.filter((id) => confirmations[id] !== true);
  const issues = [];
  if (ir.assemblyStatus !== 'DOCUMENT_CANDIDATE') issues.push('ASSEMBLY_NOT_DOCUMENT_CANDIDATE');
  if (validation.status !== 'PASS') issues.push('DOCUMENT_VALIDATION_NOT_PASS');
  if (escalation.status !== 'CLEAR') issues.push('LEGAL_ESCALATION_NOT_CLEAR');
  if (missing.length) issues.push('REQUIRED_CONFIRMATIONS_MISSING');
  const status = issues.length === 0 ? 'APPROVED_FOR_EXPORT' : 'CUSTOMER_REVIEW_INCOMPLETE';
  const confirmationRecord = Object.fromEntries(DAR_REQUIRED_CONFIRMATIONS.map((id) => [id, confirmations[id] === true]));
  return Object.freeze({
    status,
    assemblyDigest: ir.assemblyDigest ?? null,
    confirmationDigest: sha256Hex({ assemblyDigest: ir.assemblyDigest ?? null, confirmations: confirmationRecord }),
    confirmations: Object.freeze(canonicalClone(confirmationRecord)),
    missingConfirmations: Object.freeze(missing),
    issues: Object.freeze(issues),
    exportEqualsExecution: false
  });
}

export default Object.freeze({ evaluateHumanReview, DAR_REQUIRED_CONFIRMATIONS });
