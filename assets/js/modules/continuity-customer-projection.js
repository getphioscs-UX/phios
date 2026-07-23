/*
 * PHI OS M3C-W9 Continuity Customer Projection
 * Pure presentation model for trigger, review timing and branch readiness.
 */

const asText = value => typeof value === 'string' ? value.trim() : '';

function addWindow(sourceDate, windowText) {
  const date = new Date(sourceDate);
  if (Number.isNaN(date.getTime())) return '';

  const match = asText(windowText).match(/(\d+)\s*(day|week|month)/i);
  if (!match) return '';

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === 'day') date.setUTCDate(date.getUTCDate() + amount);
  if (unit === 'week') date.setUTCDate(date.getUTCDate() + amount * 7);
  if (unit === 'month') date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString();
}

function branchFor(nextRuntimeState) {
  if (nextRuntimeState === 'start_new_entry') return 'new_journey';
  if (['return_to_reading', 'choose_another_path'].includes(nextRuntimeState)) {
    return 'revision';
  }
  if (nextRuntimeState === 'remain_open') return 'close';
  if (nextRuntimeState === 'professional_review') return 'professional';
  return nextRuntimeState ? 'continue' : 'pending';
}

function triggerFor(nextRuntimeState) {
  if (nextRuntimeState === 'start_new_entry') return 'new_change';
  if (['return_to_reading', 'choose_another_path'].includes(nextRuntimeState)) {
    return 'revision_needed';
  }
  if (nextRuntimeState === 'professional_review') return 'professional_boundary';
  if (nextRuntimeState === 'remain_open') return 'customer_close';
  return nextRuntimeState ? 'review_window' : 'not_established';
}

export function buildContinuityCustomerProjection(memory = {}, continuity = null) {
  const nextRuntimeState = asText(memory.outcomeMemory?.nextRuntimeState);
  const checkIn = continuity?.customerCheckIn || {};
  const derivedReviewAt = addWindow(
    memory.createdAt,
    memory.selectedPath?.observationWindow
  );

  return {
    trigger: {
      code: asText(checkIn.trigger) || triggerFor(nextRuntimeState),
      source: checkIn.trigger ? 'customer_check_in' : 'review_outcome'
    },
    reviewTiming: {
      nextReviewAt: asText(checkIn.nextReviewAt) || derivedReviewAt,
      source: checkIn.nextReviewAt
        ? 'customer_selected'
        : derivedReviewAt
          ? 'observation_window'
          : 'not_established'
    },
    checkIn: {
      recorded: Boolean(continuity?.userChoice?.confirmed),
      newChangeStatus: asText(checkIn.newChangeStatus),
      newChangeText: asText(checkIn.newChangeText),
      evidenceClass: 'reported_experience',
      automaticDetection: false
    },
    branch: {
      type: branchFor(nextRuntimeState),
      nextRuntimeState,
      revisionAvailable: ['return_to_reading', 'choose_another_path'].includes(nextRuntimeState),
      newJourneyAvailable: nextRuntimeState === 'start_new_entry',
      requiresReviewOutcomeChange: ![
        'return_to_reading',
        'choose_another_path',
        'start_new_entry'
      ].includes(nextRuntimeState)
    },
    guardrails: {
      readOnlyProjection: true,
      automaticChangeDetectionAllowed: false,
      automaticBranchSelectionAllowed: false,
      automaticNextRuntimeCreationAllowed: false,
      historicalOverwriteAllowed: false,
      userConfirmationRequired: true
    }
  };
}

