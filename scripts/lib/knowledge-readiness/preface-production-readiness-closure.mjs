import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const C3R1_ROOT = 'content/knowledge/editorial/c3r1';
export const C3R1_PATHS = {
  contract: `${C3R1_ROOT}/production-readiness-closure.contract.json`,
  source: `${C3R1_ROOT}/kn-preface-001-source-research.json`,
  claims: `${C3R1_ROOT}/kn-preface-001-claim-coverage.json`,
  evidence: `${C3R1_ROOT}/kn-preface-001-evidence-traceability.json`,
  approval: `${C3R1_ROOT}/kn-preface-001-human-production-approval.json`,
  exportability: `${C3R1_ROOT}/kn-preface-001-exportability.json`
};

export function evidenceBundleHash(records) {
  return `sha256:${crypto.createHash('sha256').update([records.source, records.claims, records.evidence].map(value => typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`).join('')).digest('hex')}`;
}

export function resolveProductionReadinessClosure(root, overrides = {}) {
  const raw = {}, parsed = {};
  for (const [key, relative] of Object.entries(C3R1_PATHS)) {
    const absolute = path.join(root, relative);
    raw[key] = overrides[key] === undefined ? (fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : null) : null;
    parsed[key] = overrides[key] === undefined ? (raw[key] ? JSON.parse(raw[key]) : null) : overrides[key];
  }
  const blocking = [];
  for (const key of ['contract', 'source', 'claims', 'evidence', 'approval', 'exportability']) if (!parsed[key]) blocking.push(`${key.toUpperCase()}_RECORD_NOT_FOUND`);
  const nodeRecords = ['source', 'claims', 'evidence', 'approval', 'exportability'].filter(key => parsed[key]);
  if (nodeRecords.some(key => parsed[key].nodeCode !== 'KN-PREFACE-001')) blocking.push('NODE_SCOPE_MISMATCH');
  const registry = JSON.parse(fs.readFileSync(path.join(root, 'content/knowledge/registry/sources.json'), 'utf8'));
  const knownCodes = new Set((registry.sources || []).map(item => item.sourceCode));
  const authorityIds = new Set((parsed.source?.verificationAuthorities || []).filter(item => item.verificationResult === 'verified').map(item => item.authorityId));
  if (!parsed.source?.registrySourceKnown || !knownCodes.has(parsed.source?.registrySourceCode)) blocking.push('UNKNOWN_SOURCE');
  if ((parsed.source?.missingCoverage || []).length) blocking.push('MISSING_SOURCE_COVERAGE');
  const claims = parsed.claims?.claimCoverage || [];
  if (!claims.length || claims.some(claim => claim.coverage !== 'covered')) blocking.push('UNSUPPORTED_CLAIM');
  if (claims.some(claim => !claim.registrySourceCodes?.every(code => knownCodes.has(code)))) blocking.push('BROKEN_SOURCE_REFERENCE');
  if (claims.some(claim => !claim.verificationAuthorityIds?.every(id => authorityIds.has(id)))) blocking.push('UNKNOWN_VERIFICATION_AUTHORITY');
  const chains = parsed.evidence?.chains || [];
  if (claims.some(claim => !chains.some(chain => chain.claimId === claim.claimId && chain.traceability === 'closed'))) blocking.push('EVIDENCE_TRACEABILITY_OPEN');
  if ((parsed.evidence?.brokenReferences || []).length || (parsed.evidence?.unknownSources || []).length) blocking.push('BROKEN_EVIDENCE_REFERENCE');
  const bundleHash = raw.source && raw.claims && raw.evidence ? evidenceBundleHash(raw) : evidenceBundleHash(parsed);
  const approval = parsed.approval;
  const knownReviewer = approval?.reviewer === 'TL';
  if (!approval?.reviewer) blocking.push('APPROVAL_REVIEWER_REQUIRED');
  else if (!knownReviewer) blocking.push('UNKNOWN_REVIEWER');
  if (['AI', 'ai', 'system', 'migration', 'initializer', 'automation'].includes(approval?.reviewer)) blocking.push('NON_HUMAN_APPROVER');
  if (approval?.decision !== 'approved') blocking.push('HUMAN_PRODUCTION_APPROVAL_REQUIRED');
  if (!approval?.approvedAt || Number.isNaN(Date.parse(approval.approvedAt))) blocking.push('APPROVAL_TIME_INVALID');
  if (!approval?.approvalVersion) blocking.push('APPROVAL_VERSION_REQUIRED');
  if (!approval?.contentHash) blocking.push('APPROVAL_HASH_REQUIRED');
  else if (approval.contentHash !== bundleHash) blocking.push('APPROVAL_HASH_MISMATCH');
  const exportability = parsed.exportability;
  if (exportability?.exportAllowed !== true) blocking.push('EXPORTABILITY_NOT_ALLOWED');
  if (exportability?.exportAllowed === true && approval?.decision !== 'approved') blocking.push('EXPORT_WITHOUT_APPROVAL');
  if (exportability?.approvalContentHash !== bundleHash) blocking.push('EXPORTABILITY_HASH_MISMATCH');
  if (!exportability?.productionVersion || !exportability?.targetLanguage || !exportability?.targetFormats?.length || !exportability?.requiredOutputs?.length) blocking.push('EXPORTABILITY_CONTRACT_INCOMPLETE');
  const unique = [...new Set(blocking)];
  return {
    node: 'KN-PREFACE-001', status: unique.length ? 'production_blocked' : 'production_ready',
    source: { status: unique.some(code => code.includes('SOURCE')) ? 'blocked' : 'verified', registrySourceCode: parsed.source?.registrySourceCode || null },
    claims: { status: unique.includes('UNSUPPORTED_CLAIM') ? 'blocked' : 'covered', total: claims.length },
    review: { evidenceBundleHash: bundleHash, traceability: unique.some(code => code.includes('EVIDENCE')) ? 'open' : 'closed' },
    approval: approval || null, exportability: exportability || null, blocking: unique
  };
}
