export const NUM_NATIVE_BODY_CANDIDATE_VERSION='NUM-NATIVE-FULL19-REVIEW-v1';
export const NUM_NATIVE_CANDIDATE_VERSION='NUM-NATIVE-OWNER39-REVIEW-v1';
// Existing R30/body-only QA remains 32 MiB. The current 39-page candidate uses
// the existing private-artifact hard ceiling, selected only after version binding.
export const numLocalPdfByteLimit=version=>version===NUM_NATIVE_CANDIDATE_VERSION?128*1024*1024:32*1024*1024;
