import crypto from 'node:crypto';

export const KAU_COVERAGE_STATES = Object.freeze(['complete','partial','thin','conflicted','missing']);
export const KAU_DRIFT_TYPES = Object.freeze(['definition_drift','boundary_drift','mechanism_drift','terminology_drift','ownership_drift','relationship_drift']);

export function classifyCoverage(dimensions) {
  const values = Object.values(dimensions);
  if (values.includes('conflicted')) return 'conflicted';
  if (values.every(v => v === 'complete')) return 'complete';
  if (values.every(v => v === 'missing')) return 'missing';
  if (values.filter(v => v === 'complete' || v === 'partial').length >= 5) return 'partial';
  return 'thin';
}

export function detectManuscriptDrift({ manuscriptCode, oldManuscriptDigest, newManuscriptDigest, affectedSections = [], affectedNodes = [], detectedDrift = [] }) {
  if (oldManuscriptDigest === newManuscriptDigest) {
    return { driftCode: `KAU-DRIFT-${manuscriptCode}-NOCHANGE`, manuscriptCode, oldManuscriptDigest, newManuscriptDigest, affectedSections: [], affectedNodes: [], detectedDrift: [], status: 'no_drift', authorityMode: 'proposal_only' };
  }
  const normalized = [...new Set(detectedDrift)].sort();
  for (const type of normalized) if (!KAU_DRIFT_TYPES.includes(type)) throw new Error(`KAU_UNKNOWN_DRIFT_TYPE:${type}`);
  return { driftCode: `KAU-DRIFT-${crypto.createHash('sha256').update(`${manuscriptCode}:${oldManuscriptDigest}:${newManuscriptDigest}`).digest('hex').slice(0,16).toUpperCase()}`, manuscriptCode, oldManuscriptDigest, newManuscriptDigest, affectedSections: [...new Set(affectedSections)].sort(), affectedNodes: [...new Set(affectedNodes)].sort(), detectedDrift: normalized, status: normalized.length ? 'requires_human_review' : 'drift_detected', authorityMode: 'proposal_only' };
}

export function assessProductionReadiness({ nodeExists, sourceCoverageSufficient, boundaryStable, noUnresolvedDuplicate, noUnresolvedConflict, localeSourceAvailable, humanEditorialAccepted }) {
  const checks = { canonicalNodeExists: !!nodeExists, sourceCoverageSufficient: !!sourceCoverageSufficient, boundaryStable: !!boundaryStable, noUnresolvedDuplicate: !!noUnresolvedDuplicate, noUnresolvedConflict: !!noUnresolvedConflict, localeSourceAvailable: !!localeSourceAvailable, humanEditorialAccepted: !!humanEditorialAccepted };
  const blockingReasons = Object.entries(checks).filter(([,v]) => !v).map(([k]) => k);
  return { checks, productionReady: blockingReasons.length === 0, blockingReasons };
}

export function assertKauGovernanceBoundary(operation) {
  const forbidden = new Set(['mutate_nodes_registry','mutate_blueprint_registry','write_article_candidate','approve_article','publish_article','mutate_meaning_mapping','mutate_asset_registry','mutate_journey_state','apply_registry_change_package']);
  if (forbidden.has(operation)) throw new Error(`KAU_AUTHORITY_BOUNDARY_DENIED:${operation}`);
  return true;
}
