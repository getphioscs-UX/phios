import { deduplicateBy } from './article-package.mjs';

function claimClassFor(type) {
  if (type === 'boundary_statement') return 'Boundary Claim';
  if (type === 'canonical_transition') return 'Interpretive Claim';
  if (type === 'externally_verifiable') return 'External Factual Claim';
  if (type === 'editorial_inference') return 'Qualified Claim';
  return 'Canonical Framework Claim';
}

function normalizeClaimType(type) {
  const allowed = new Set([
    'externally_verifiable',
    'phi_os_interpretation',
    'editorial_inference',
    'mixed',
    'canonical_transition',
    'boundary_statement'
  ]);
  return allowed.has(type) ? type : 'phi_os_interpretation';
}

export function buildClaimLedger(brief, articleCode) {
  const nodeCode = brief.canonicalIdentity.canonicalNodeCode;
  const sourceCodes = brief.sourcePlan.sourceReferences
    .map(source => source.sourceCode)
    .filter(Boolean);
  const declared = brief.claimBoundary.claimDossier?.claims ||
    brief.claimBoundary.claims ||
    [];
  const claims = declared.length
    ? declared.map((claim, index) => {
        const claimType = normalizeClaimType(
          claim.claimType || claim.type
        );
        const mappedSources = deduplicateBy(
          (claim.sourceCodes || []).map(sourceCode => ({ sourceCode })),
          'sourceCode'
        ).map(source => source.sourceCode);
        const sourceRequired = claim.sourceRequired === true ||
          claimType === 'externally_verifiable';
        return {
          claimCode:
            claim.claimCode ||
            claim.claimId ||
            `CLM-${nodeCode}-${String(index + 1).padStart(3, '0')}`,
          canonicalNodeCode: nodeCode,
          articleCode,
          claimText: claim.statement,
          claimType,
          claimClass: claimClassFor(claimType),
          sourceRequirement: sourceRequired ? 'required' : 'not_required',
          sourceCodes: mappedSources,
          sourceState:
            sourceRequired && mappedSources.length === 0
              ? 'source_pending'
              : 'mapped_not_verified',
          qualification:
            claim.qualification ||
            'Draft claim awaiting human editorial and source review.',
          articlePlacement:
            claim.articleSection ||
            `S${String(index + 1).padStart(2, '0')}`,
          reviewState: 'not_reviewed',
          approvalState: 'not_approved'
        };
      })
    : [
        {
          claimCode: `CLM-${nodeCode}-001`,
          canonicalNodeCode: nodeCode,
          articleCode,
          claimText: brief.canonicalProposition,
          claimType: 'phi_os_interpretation',
          claimClass: 'Canonical Framework Claim',
          sourceRequirement: sourceCodes.length ? 'required' : 'not_required',
          sourceCodes,
          sourceState:
            sourceCodes.length ? 'mapped_not_verified' : 'not_required',
          qualification:
            'PHI OS Canonical framework statement; it is not an externally proven universal fact.',
          articlePlacement: 'S01',
          reviewState: 'not_reviewed',
          approvalState: 'not_approved'
        },
        ...brief.articleBoundary.mustNotClaim.map((statement, index) => ({
          claimCode: `CLM-${nodeCode}-${String(index + 2).padStart(3, '0')}`,
          canonicalNodeCode: nodeCode,
          articleCode,
          claimText: statement,
          claimType: 'boundary_statement',
          claimClass: 'Boundary Claim',
          sourceRequirement: 'not_required',
          sourceCodes: [],
          sourceState: 'not_required',
          qualification: 'Public article boundary.',
          articlePlacement: 'S06',
          reviewState: 'not_reviewed',
          approvalState: 'not_approved'
        }))
      ];
  return {
    schemaVersion: 'PHI-OS-CANONICAL-ARTICLE-CLAIM-LEDGER-v1.0.0',
    canonicalNodeCode: nodeCode,
    articleCode,
    locale: brief.canonicalIdentity.locale,
    claimSetVersion: '1.0.0',
    claims
  };
}

