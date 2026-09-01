import { deepFreeze } from '../interpretation-runtime/mir7-utils.js';

export const PROFILE_PRODUCTION_AUTHORITY = deepFreeze({
  schemaVersion: 'PHI-OS-PROFILE-PRODUCTION-AUTHORITY-v1.0.0',
  work: 'PRF-W12',
  baselineCommit: '3a8e0658e26fa931257b491204a6ed2dcb345725',
  status: 'HUMAN_REVIEW_PENDING',
  machineCampaign: { required: 24, passed: 24 },
  humanAcceptance: { required: 24, accepted: 0, rejected: 0, pending: 24 },
  reviewPreviewAllowed: true,
  customerPublicationAllowed: false,
  profileSurfaceCutoverAllowed: false,
  modes: {
    QUICK_PROFILE: 'REVIEW_PREVIEW',
    FULL_SELF_ASSESSMENT: 'REVIEW_PREVIEW',
    REASONING_TASKS: 'REVIEW_PREVIEW',
    IMPORT_EXTERNAL_RESULT: 'REVIEW_PREVIEW'
  },
  boundaries: {
    automaticPersistence: false,
    profileRequiredForPersonalReading: false,
    quotientScoringAuthority: false,
    diagnosisAuthority: false,
    reasoningIqAuthority: false,
    universalMasterScoreAuthority: false,
    compatibilityScoreAuthority: false,
    partnerHiddenStateAuthority: false
  }
});

export function resolveProfileExecution({ preview = false } = {}) {
  if (PROFILE_PRODUCTION_AUTHORITY.customerPublicationAllowed === true) return { allowed: true, customerPublishable: true, preview: false, state: 'PRODUCTION' };
  if (preview === true && PROFILE_PRODUCTION_AUTHORITY.reviewPreviewAllowed === true) return { allowed: true, customerPublishable: false, preview: true, state: 'REVIEW_PREVIEW' };
  return { allowed: false, customerPublishable: false, preview: false, state: 'HUMAN_REVIEW_PENDING' };
}
