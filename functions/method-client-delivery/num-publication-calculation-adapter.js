import {resolveAlternativeTimingPhase}
  from '../num-expansion/num-alternative-timing-runtime.js';

// Preserve the existing technical source reference unchanged.
export const NUM_PUBLICATION_DIGIT_DISTRIBUTION_SOURCE_REF =
  'functions/num-expansion/num-digit-distribution-runtime.js';

// Calculation validation remains owned by the method layer.
export function validateNumPublicationTiming(input) {
  return resolveAlternativeTimingPhase(input);
}
