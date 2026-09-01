import { deepFreeze } from '../interpretation-runtime/mir7-utils.js';

export const PROFILE_PRODUCTION_AUTHORITY = deepFreeze({
  schemaVersion: 'PHI-OS-PROFILE-PRODUCTION-AUTHORITY-v1.0.0',
  work: 'PRF-W12',
  campaignBaselineCommit: '3a8e0658e26fa931257b491204a6ed2dcb345725',
  admissionCommitContext: 'dcd325143f119d5817f2abf03f79f9a8ba5b789c',
  status: 'PRODUCTION_ADMITTED_CUTOVER_ELIGIBLE',
  machineCampaign: { required: 24, passed: 24 },
  humanAcceptance: { required: 24, accepted: 24, rejected: 0, pending: 0, inheritedAcceptance: false },
  freezePromotion: { required: 8, active: 8 },
  reviewPreviewAllowed: true,
  customerPublicationAllowed: true,
  profileSurfaceCutoverAllowed: true,
  profileSurfaceCutoverExecuted: false,
  primaryNavigationCutoverEligible: true,
  primaryNavigationCutoverExecuted: false,
  modes: {
    QUICK_PROFILE: 'PRODUCTION',
    FULL_SELF_ASSESSMENT: 'PRODUCTION',
    REASONING_TASKS: 'PRODUCTION',
    IMPORT_EXTERNAL_RESULT: 'PRODUCTION'
  },
  academicBridge: {
    P1_IPIP_BIG_FIVE: 'AVAILABLE_CAPABILITY',
    P2_PHI_REASONING: 'AVAILABLE_CAPABILITY_NON_IQ',
    P3_ONET_RIASEC: 'AVAILABLE_WHEN_CONFIGURED',
    P4_FINANCIAL_CAPABILITY: 'AVAILABLE_CAPABILITY'
  },
  boundaries: {
    automaticPersistence: false,
    profileRequiredForPersonalReading: false,
    quotientScoringAuthority: false,
    diagnosisAuthority: false,
    reasoningIqAuthority: false,
    normedPercentileAuthority: false,
    universalMasterScoreAuthority: false,
    compatibilityScoreAuthority: false,
    partnerHiddenStateAuthority: false,
    crossSourceScientificValidationTransferAuthority: false
  }
});

export function resolveProfileExecution({ preview = false } = {}) {
  if (PROFILE_PRODUCTION_AUTHORITY.customerPublicationAllowed === true) return { allowed: true, customerPublishable: true, preview: false, state: 'PRODUCTION' };
  if (preview === true && PROFILE_PRODUCTION_AUTHORITY.reviewPreviewAllowed === true) return { allowed: true, customerPublishable: false, preview: true, state: 'REVIEW_PREVIEW' };
  return { allowed: false, customerPublishable: false, preview: false, state: 'NOT_ADMITTED' };
}
